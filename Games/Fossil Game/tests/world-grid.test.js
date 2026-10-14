import test from 'node:test';
import assert from 'node:assert/strict';

import { createInitialState } from '../src/game-core.js';
import * as worldGrid from '../src/world-grid.js';
import { BELT_COST, BUILDING_DEFINITIONS } from '../src/buildings.js';

test('placesBuildingAndDeductsCost', () => {
  assert.equal(typeof worldGrid.placeBuilding, 'function');
  assert.ok(BUILDING_DEFINITIONS.generator);

  const state = createInitialState();
  const site = state.sites.find(({ id }) => id === state.activeSiteId);
  const cost = BUILDING_DEFINITIONS.generator.cost;
  const x = 20;
  const y = 20;

  for (const [resource, amount] of Object.entries(cost)) {
    site.resources[resource] = amount;
  }

  const result = worldGrid.placeBuilding(state, 'generator', x, y, 0);

  assert.deepEqual(result, { ok: true });
  assert.ok(site.buildings.some(building => building.type === 'generator' && building.x === x && building.y === y));
  for (const [resource, amount] of Object.entries(cost)) {
    assert.equal(site.resources[resource], 0);
  }
});

test('rejectsInvalidOrOccupiedPlacement', () => {
  assert.equal(typeof worldGrid.placeBuilding, 'function');

  const state = createInitialState();
  const site = state.sites.find(({ id }) => id === state.activeSiteId);
  const occupied = site.buildings[0];
  const beforeInvalid = structuredClone(state);
  const invalidResult = worldGrid.placeBuilding(state, 'generator', 1.5, 20, 0);

  assert.equal(invalidResult.ok, false);
  assert.deepEqual(state, beforeInvalid);

  const beforeOccupied = structuredClone(state);
  const occupiedResult = worldGrid.placeBuilding(state, 'generator', occupied.x, occupied.y, 0);

  assert.equal(occupiedResult.ok, false);
  assert.deepEqual(state, beforeOccupied);
});

test('placesBeltAndDeductsCost', () => {
  assert.equal(typeof worldGrid.placeBelt, 'function');

  const state = createInitialState();
  const site = state.sites.find(({ id }) => id === state.activeSiteId);
  site.resources.iron = BELT_COST.iron;

  const result = worldGrid.placeBelt(state, 20, 20, 'east');

  assert.deepEqual(result, { ok: true });
  assert.deepEqual(site.belts[0], {
    id: 'belt-2',
    type: 'belt',
    x: 20,
    y: 20,
    direction: 'east',
    item: null,
    progress: 0,
  });
  assert.equal(site.resources.iron, 0);
});

test('createsGuaranteedStartingSite', () => {
  const state = createInitialState();
  const site = state.sites?.find(({ id }) => id === state.activeSiteId);

  assert.equal(state.version, 1);
  assert.equal(state.activeSiteId, 'site-1');
  assert.ok(site);
  assert.equal(site.resources.coal, 12);
  assert.equal(site.resources.iron, 16);
  assert.equal(site.resources.stone, 20);
  assert.equal(site.resources.sediment, 16);
  assert.equal(site.resources.steel, 0);
  assert.equal(site.resources.concrete, 0);
  assert.ok(site.buildings.some(building => building.type === 'excavator'));
  assert.ok(['coal', 'iron', 'stone', 'sediment'].every(type =>
    site.resourceNodes.some(node => node.resource === type)
  ));
  assert.deepEqual(state.unidentifiedFossils, []);
  assert.deepEqual(state.collection, []);
  assert.equal(typeof state.nextEntityId, 'number');
});

test('rejectsInsufficientMaterialBuildingCost', () => {
  assert.equal(typeof worldGrid.placeBuilding, 'function');
  assert.ok(BUILDING_DEFINITIONS.generator);

  const state = createInitialState();
  const site = state.sites.find(({ id }) => id === state.activeSiteId);
  for (const resource of Object.keys(BUILDING_DEFINITIONS.generator.cost)) {
    site.resources[resource] = 0;
  }
  const before = structuredClone(state);
  const result = worldGrid.placeBuilding(state, 'generator', 20, 20, 0);

  assert.deepEqual(result, { ok: false, reason: 'insufficient resources' });
  assert.deepEqual(state, before);
});
