import assert from 'node:assert/strict';
import test from 'node:test';
import { migrateLegacyContracts, serializeSaveState } from '../js/storage.js';
import { state } from '../js/state.js';
import { withIsolatedGameState } from '../js/qa-support.js';

test('save serialization includes gameplay preferences and preserves the current market-save contract', () => {
    withIsolatedGameState(() => {
        state.gold = 321;
        state.font = 'retro';
        state.dialogueDifficulty = 'sommelier';

        const serialized = serializeSaveState();
        assert.equal(serialized.gold, 321);
        assert.equal(serialized.font, 'retro');
        assert.equal(serialized.dialogueDifficulty, 'sommelier');
        assert.ok(Array.isArray(serialized.plots));
        assert.ok(serialized.kettle);
        assert.equal('market' in serialized, false);
    });
});

test('legacy contract multipliers migrate by target count and leave current contracts unchanged', () => {
    const contracts = [
        { id: 'one', multiplier: 2, targets: { sw: { min: 40, max: 50 } } },
        { id: 'two', multiplier: 2.5, targets: { sw: {}, ac: {} } },
        { id: 'current', multiplierRange: { min: 1.5, max: 2.35 }, targets: { sw: {} } },
    ];

    assert.equal(migrateLegacyContracts(contracts), contracts);
    assert.deepEqual(contracts[0].multiplierRange, { min: 1.5, max: 2.35 });
    assert.equal('multiplier' in contracts[0], false);
    assert.deepEqual(contracts[1].multiplierRange, { min: 2.2, max: 2.85 });
    assert.equal(contracts[2].multiplier, undefined);
    assert.equal(migrateLegacyContracts(null), null);
});