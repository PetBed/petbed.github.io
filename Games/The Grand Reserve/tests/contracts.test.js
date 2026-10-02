import assert from 'node:assert/strict';
import test from 'node:test';
import { RECIPES } from '../js/data.js';
import { checkContractCompletion, generateSolvableContract, solveContractValidity } from '../js/contracts.js';
import { advanceGameTick } from '../js/game-simulation.js';
import { globals, state } from '../js/state.js';
import { createSeededRandom, withIsolatedGameState } from '../js/qa-support.js';

test('contract generation is reproducible with a fixed seed and clock', () => {
    const generate = () => generateSolvableContract({
        random: createSeededRandom(8128),
        now: () => 1700000000000,
    });
    const contract = generate();

    assert.ok(contract);
    assert.deepEqual(generate(), contract);
    assert.ok(RECIPES[contract.recipeKey]);

    const attributes = Object.keys(contract.targets);
    assert.ok(attributes.length >= 1 && attributes.length <= 4);
    for (const range of Object.values(contract.targets)) {
        assert.ok(range.min >= 0);
        assert.ok(range.max <= 100);
        assert.ok(range.min < range.max);
    }
});

test('contract completion accepts the exact tolerance boundary and rejects beyond it', () => {
    const contract = {
        recipeKey: 'pinot_noir',
        targets: { sw: { min: 40, max: 50 } },
        multiplierRange: { min: 1.5, max: 2.35 },
    };

    const atBoundary = checkContractCompletion(
        { recipeKey: 'pinot_noir', flavour: { sw: 70 } },
        contract,
    );
    const beyondBoundary = checkContractCompletion(
        { recipeKey: 'pinot_noir', flavour: { sw: 71 } },
        contract,
    );

    assert.equal(atBoundary.success, true);
    assert.equal(atBoundary.precision, 0);
    assert.equal(atBoundary.multiplier, contract.multiplierRange.min);
    assert.equal(beyondBoundary.success, false);
});

test('contract completion rejects a mismatched wine recipe', () => {
    const result = checkContractCompletion(
        { recipeKey: 'chardonnay', flavour: { sw: 45 } },
        {
            recipeKey: 'pinot_noir',
            targets: { sw: { min: 40, max: 50 } },
            multiplierRange: { min: 1.5, max: 2.35 },
        },
    );

    assert.deepEqual(result, { success: false, reason: 'Incorrect wine type.' });
});

test('a game tick advances crops, cellar, racks, and contract expiry', () => {
    withIsolatedGameState(() => {
        state.plots = state.plots.map((plot, index) => index === 0
            ? { ...plot, state: 'growing', cropType: 'pinot_noir', timeRemaining: 1 }
            : { ...plot, state: 'empty', cropType: null, timeRemaining: 0 });
        state.barrels = [
            { id: 0, type: 'french_oak', state: 'fermenting', fermentTime: 1, ageProgress: 0, qualityMultiplier: 0.8 },
            {
                id: 1,
                type: 'french_oak',
                state: 'aging',
                ageProgress: 99.5,
                flavour: { sw: 50, ac: 50, tn: 99.9, bd: 99.9 },
            },
        ];
        state.wineRacks = [
            { id: 'wine_test', age: 14, rankIndex: 0 },
            ...Array(8).fill(null),
        ];
        state.contracts = [
            { id: 'expires', status: 'available', timeRemaining: 1 },
            { id: 'active', status: 'active', timeRemaining: 1 },
        ];
        state.market.tickCurrent = 10;
        globals.currentTab = 'orders';

        const effects = new Proxy({}, { get: () => () => {} });
        advanceGameTick(1, { random: () => 0.99, effects });

        assert.equal(state.plots[0].state, 'ready');
        assert.equal(state.barrels[0].state, 'aging');
        assert.equal(state.barrels[0].ageProgress, 0);
        assert.equal(state.barrels[0].qualityMultiplier, 1);
        assert.equal(state.barrels[1].ageProgress, 100);
        assert.deepEqual(state.barrels[1].flavour, { sw: 49.9, ac: 50, tn: 100, bd: 100 });
        assert.equal(state.wineRacks[0].age, 15);
        assert.equal(state.wineRacks[0].rankIndex, 1);
        assert.deepEqual(state.contracts.map((contract) => contract.id), ['active']);
        assert.equal(state.market.tickCurrent, 9);
    });
});

test('a seeded offer batch is solvable and accepts its requested flavour profiles', () => {
    const random = createSeededRandom(73129);

    for (let index = 0; index < 100; index++) {
        const contract = generateSolvableContract({ random, now: () => index });
        assert.ok(contract, `offer ${index} should be generated`);
        assert.ok(solveContractValidity(contract.recipeKey, contract.targets).length > 0);

        const flavour = { sw: 50, ac: 50, tn: 50, bd: 50 };
        for (const [attribute, range] of Object.entries(contract.targets)) {
            flavour[attribute] = (range.min + range.max) / 2;
        }
        assert.equal(
            checkContractCompletion({ recipeKey: contract.recipeKey, flavour }, contract).success,
            true,
        );
    }
});