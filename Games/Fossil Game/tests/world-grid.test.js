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
  assert.match(site.belts[0].id, /^belt-\d+$/);
  assert.deepEqual(
    Object.fromEntries(Object.entries(site.belts[0]).filter(([key]) => key !== 'id')),
    {
    type: 'belt',
    x: 20,
    y: 20,
    direction: 'east',
    item: null,
    progress: 0,
    }
  );
  assert.equal(site.resources.iron, 0);
});

test('reusesExistingLaneAndAddsFreeCrossingLane', () => {
  const state = createInitialState();
  const site = state.sites.find(({ id }) => id === state.activeSiteId);
  site.buildings = [];
  site.belts = [{
    id: 'belt-existing-east',
    type: 'belt',
    x: 10,
    y: 10,
    direction: 'east',
    item: null,
    progress: 0,
  }];
  site.resources.iron = 3;

  const route = worldGrid.placeBeltRoute(state, { x: 9, y: 10 }, { x: 11, y: 10 });
  const ironAfterRoute = site.resources.iron;
  const crossing = worldGrid.placeBelt(state, 10, 10, 'north');

  assert.equal(route.ok, true);
  assert.equal(route.reused, 1);
  assert.equal(crossing.ok, true);
  assert.equal(site.resources.iron, ironAfterRoute);
  assert.deepEqual(
    site.belts.filter(belt => belt.x === 10 && belt.y === 10).map(({ direction }) => direction),
    ['east', 'north']
  );
});

test('rejectsDuplicateSameDirectionLane', () => {
  const state = createInitialState();
  const site = state.sites.find(({ id }) => id === state.activeSiteId);
  site.resources.iron = 3;

  assert.equal(worldGrid.placeBelt(state, 10, 10, 'east').ok, true);
  const beforeDuplicate = structuredClone(state);
  const duplicate = worldGrid.placeBelt(state, 10, 10, 'east');

  assert.deepEqual(duplicate, { ok: false, reason: 'duplicate belt lane' });
  assert.deepEqual(state, beforeDuplicate);
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

test('keepsExcavatorPlacementOnResourceNode', () => {
  const state = createInitialState();
  const site = state.sites.find(({ id }) => id === state.activeSiteId);
  const node = { id: 'node-placement-test', resource: 'iron', x: 1000, y: 1000, remaining: 100 };
  site.resourceNodes.push(node);

  const result = worldGrid.placeBuilding(state, 'excavator', node.x, node.y, 0);

  assert.deepEqual(result, { ok: true });
  assert.ok(site.buildings.some(building =>
    building.type === 'excavator' && building.x === node.x && building.y === node.y
  ));
});

test('findsShortestFourDirectionRoute', () => {
  const state = createInitialState();
  const site = state.sites.find(({ id }) => id === state.activeSiteId);
  site.buildings = [];
  site.belts = [];
  site.resources.iron = 99;

  const preview = worldGrid.previewBeltRoute(state, { x: 0, y: 0 }, { x: 3, y: 0 });

  assert.deepEqual(preview.ok, true);
  assert.deepEqual(
    preview.route.map(step => ({ x: step.x, y: step.y, direction: step.direction })),
    [
      { x: 0, y: 0, direction: 'east' },
      { x: 1, y: 0, direction: 'east' },
      { x: 2, y: 0, direction: 'east' },
      { x: 3, y: 0, direction: 'east' },
    ]
  );
  assert.deepEqual(preview.cost, { iron: 4 });
});

test('refundsRecordedConstructionCostExactlyOnce', () => {
  const state = createInitialState();
  const site = state.sites.find(({ id }) => id === state.activeSiteId);
  const generator = site.buildings.find(building => building.type === 'generator');

  if (!generator) {
    throw new Error('expected starter generator to exist');
  }

  const before = { ...site.resources };
  const result = worldGrid.removeBuilding(state, generator.id);

  assert.deepEqual(result, {
    ok: true,
    refunded: BUILDING_DEFINITIONS.generator.cost,
    returnedItems: 0,
  });
  assert.equal(site.resources.iron, before.iron + BUILDING_DEFINITIONS.generator.cost.iron);
  assert.equal(site.resources.stone, before.stone + BUILDING_DEFINITIONS.generator.cost.stone);
  assert.equal(site.buildings.some(building => building.id === generator.id), false);
});
