import assert from 'node:assert/strict';
import test from 'node:test';
import { runBalanceSimulation } from '../js/balance.js';

test('balance reports are reproducible and record their configuration', () => {
    const first = runBalanceSimulation({ seed: 1597, runs: 40 });
    const second = runBalanceSimulation({ seed: 1597, runs: 40 });
    const otherSeed = runBalanceSimulation({ seed: 1598, runs: 40 });

    assert.deepEqual(first, second);
    assert.notDeepEqual(first, otherSeed);
    assert.equal(first.seed, 1597);
    assert.equal(first.runs, 40);
    assert.equal(first.contracts.generationFailures, 0);
    assert.equal(first.contracts.solverFailures, 0);
    assert.equal(first.market.products, 20);
    assert.equal(first.market.ticksPerScenario, 40);
    assert.ok(first.contracts.perfectMatchPayout.min > 0);
    assert.ok(first.market.priceByStartingOversupply.oversupply25.mean
        < first.market.priceByStartingOversupply.baseline.mean);
});