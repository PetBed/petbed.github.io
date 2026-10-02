import assert from 'node:assert/strict';
import test from 'node:test';
import { BEER_RECIPES, INGREDIENTS_DATA, RECIPES, SEEDS_DATA } from '../js/data.js';
import {
    advanceKettlePhysicsStep,
    calculateHarvestFlavour,
    harvestCrop,
    plantCrop,
    predictBeerRecipe,
    predictWineRecipe,
} from '../js/game-simulation.js';
import { globals, state } from '../js/state.js';
import { createSeededRandom, withIsolatedGameState } from '../js/qa-support.js';

test('every declared wine and beer recipe resolves from its catalog ingredients', () => {
    withIsolatedGameState(() => {
        for (const [recipeKey, recipe] of Object.entries(RECIPES)) {
            if (Object.keys(recipe.req).length === 0) continue;
            let nextId = 0;
            state.ingredients = Object.entries(recipe.req).flatMap(([ingredientKey, count]) =>
                Array.from({ length: count }, () => ({
                    id: `wine-${recipeKey}-${nextId++}`,
                    key: ingredientKey,
                    count: 1,
                    flavour: INGREDIENTS_DATA[ingredientKey].flavour,
                })));
            globals.loadedPressIngredients = state.ingredients.map((ingredient) => ingredient.id);
            assert.equal(predictWineRecipe().key, recipeKey);
            assert.ok(recipe.baseVal > 0);
        }

        for (const [recipeKey, recipe] of Object.entries(BEER_RECIPES)) {
            globals.loadedKettleIngredients = Object.entries(recipe.req).flatMap(([ingredientKey, count]) =>
                Array.from({ length: count }, () => ({ key: ingredientKey })));
            assert.equal(predictBeerRecipe().key, recipeKey);
            assert.ok(recipe.baseVal > 0);
        }
    });
});

test('crop planting consumes stock and harvest applies weather without mutating catalog data', () => {
    withIsolatedGameState(() => {
        const originalFlavour = structuredClone(INGREDIENTS_DATA.pinot_noir.flavour);
        state.seeds.pinot_noir = 1;
        state.currentWeather = 'sunny';

        assert.equal(plantCrop(0, 'pinot_noir'), true);
        assert.equal(plantCrop(0, 'pinot_noir'), false);
        assert.equal(plantCrop(1, 'pinot_noir'), false);
        assert.equal(plantCrop(3, 'pinot_noir'), false);
        assert.equal(state.seeds.pinot_noir, 0);
        assert.equal(state.plots[0].timeRemaining, SEEDS_DATA.pinot_noir.growTime);

        state.plots[0].state = 'ready';
        assert.equal(harvestCrop(0, { now: () => 1234 }), 'pinot_noir');
        assert.deepEqual(state.ingredients[0].flavour, { sw: 35, ac: 15, tn: 15, bd: 20 });
        assert.equal(state.ingredients[0].weather, 'sunny');
        assert.equal(state.plots[0].state, 'empty');
        assert.deepEqual(INGREDIENTS_DATA.pinot_noir.flavour, originalFlavour);

        state.plots[0] = { ...state.plots[0], state: 'ready', cropType: 'pinot_noir' };
        harvestCrop(0, { now: () => 5678 });
        assert.equal(state.ingredients[0].count, 2);

        state.plots[0] = { ...state.plots[0], state: 'ready', cropType: 'hops' };
        harvestCrop(0, { now: () => 9012 });
        assert.equal(state.ingredients[1].flavour, null);
        assert.equal(state.ingredients[1].weather, null);
    });
});

test('harvest modifiers are clamped and missing flavour crops remain flavourless', () => {
    assert.deepEqual(calculateHarvestFlavour('hops', 'sunny'), { flavour: null, weather: null });
    const harvest = calculateHarvestFlavour('muscat', 'rain');
    assert.deepEqual(harvest.flavour, { sw: 35, ac: 30, tn: 5, bd: 20 });
    assert.ok(Object.values(harvest.flavour).every((value) => value >= 0 && value <= 100));
});

test('kettle physics stays in bounds and reports a completed aligned brew', () => {
    const createKettle = () => ({
        recipeKey: 'wheat_beer',
        catcherPos: 50,
        catcherVel: 0,
        targetPos: 50,
        targetVel: 0,
        progress: 99.99,
    });
    const completedKettle = createKettle();
    const result = advanceKettlePhysicsStep(completedKettle, { random: () => 0.5 });
    assert.equal(result.overlap, true);
    assert.equal(result.completed, true);
    assert.equal(completedKettle.progress, 100);

    const boundedKettle = { ...createKettle(), catcherPos: 79.5, catcherVel: 3, targetPos: 99.8, targetVel: 1, progress: 0 };
    const boundaryResult = advanceKettlePhysicsStep(boundedKettle, { random: () => 0.99 });
    assert.equal(boundaryResult.bounceSound, true);
    assert.ok(boundedKettle.catcherPos >= 0 && boundedKettle.catcherPos <= 79);
    assert.ok(boundedKettle.targetPos >= 0 && boundedKettle.targetPos <= 100);
    assert.ok(boundedKettle.progress >= 0 && boundedKettle.progress <= 100);

    const first = createKettle();
    const second = createKettle();
    const firstRandom = createSeededRandom(3);
    const secondRandom = createSeededRandom(3);
    for (let step = 0; step < 100; step++) {
        advanceKettlePhysicsStep(first, { random: firstRandom });
        advanceKettlePhysicsStep(second, { random: secondRandom });
    }
    assert.deepEqual(first, second);
});