import assert from 'node:assert/strict';
import test from 'node:test';
import { BEER_RECIPES, RECIPES } from '../js/data.js';
import { updateMarketPrices } from '../js/game-simulation.js';
import { state } from '../js/state.js';
import { createSeededRandom, withIsolatedGameState } from '../js/qa-support.js';

function simulateMarket(seed) {
    return withIsolatedGameState(() => {
        const productKeys = [...Object.keys(RECIPES), ...Object.keys(BEER_RECIPES)];
        for (const key of productKeys) state.market.oversupply[key] = 12;

        const random = createSeededRandom(seed);
        for (let tick = 0; tick < 12; tick++) {
            updateMarketPrices({ random, render: false });
        }

        return structuredClone(state.market);
    });
}

test('market updates are repeatable and keep bounded price history', () => {
    const first = simulateMarket(42);
    const second = simulateMarket(42);

    assert.deepEqual(first, second);
    for (const key of [...Object.keys(RECIPES), ...Object.keys(BEER_RECIPES)]) {
        assert.ok(first.current[key] >= 1, `${key} price must remain positive`);
        assert.equal(first.history[key].length, 10, `${key} history should retain the latest ten prices`);
        assert.ok(first.history[key].every((price) => price >= 1));
        assert.ok(first.oversupply[key] > 0);
    }
});