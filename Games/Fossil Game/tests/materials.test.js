import test from 'node:test';
import assert from 'node:assert/strict';

import { BUILDING_DEFINITIONS } from '../src/buildings.js';
import * as materials from '../src/materials.js';

test('rendersKnownCostsWithIconsAndNames', () => {
  assert.equal(typeof materials.getCostDisplayRows, 'function');

  assert.deepEqual(
    materials.getCostDisplayRows(BUILDING_DEFINITIONS['fossil-finisher'].cost),
    [
      { resource: 'iron', name: 'Iron', icon: '■', mark: 'Fe', amount: 12 },
      { resource: 'sediment', name: 'Sediment', icon: '◒', mark: 'D', amount: 6 },
    ]
  );
});

test('showsResourceInventoryWithAccessibleNames', () => {
  assert.equal(typeof materials.getResourceDisplayRows, 'function');

  assert.deepEqual(
    materials.getResourceDisplayRows({
      coal: 2,
      iron: 3,
      copper: 0,
      stone: 1,
      sediment: 4,
      steel: 5,
      concrete: 6,
    }),
    [
      { resource: 'coal', name: 'Coal', icon: '●', mark: 'C', amount: 2 },
      { resource: 'iron', name: 'Iron', icon: '■', mark: 'Fe', amount: 3 },
      { resource: 'copper', name: 'Copper', icon: '▲', mark: 'Cu', amount: 0 },
      { resource: 'stone', name: 'Stone', icon: '◆', mark: 'S', amount: 1 },
      { resource: 'sediment', name: 'Sediment', icon: '◒', mark: 'D', amount: 4 },
      { resource: 'steel', name: 'Steel', icon: '✦', mark: 'St', amount: 5 },
      { resource: 'concrete', name: 'Concrete', icon: '▰', mark: 'Co', amount: 6 },
    ]
  );
});

test('checksAffordabilityAgainstCurrentStock', () => {
  assert.equal(typeof materials.canAffordCost, 'function');

  assert.equal(materials.canAffordCost({ iron: 12, sediment: 6 }, { iron: 12, sediment: 6 }), true);
  assert.equal(materials.canAffordCost({ iron: 11, sediment: 6 }, { iron: 12, sediment: 6 }), false);
});
