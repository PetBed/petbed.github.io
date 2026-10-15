import test from 'node:test';
import assert from 'node:assert/strict';

import { createInitialState } from '../src/game-core.js';
import * as worldGrid from '../src/world-grid.js';
import { BELT_COST, BUILDING_DEFINITIONS, getBuildingFootprint } from '../src/buildings.js';

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
    paidCost: { iron: 1 },
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

test('findsBuildingsAtTilesUsingTheSharedFootprint', () => {
  const state = createInitialState();
  const site = state.sites[0];

  for (const rotation of [0, 90, 180, 270]) {
    const building = {
      id: `rotated-${rotation}`,
      type: 'fossil-finisher',
      x: 20,
      y: 20,
      rotation,
      inputSlots: [],
      outputSlots: [],
      progress: 0,
    };
    site.buildings = [building];
    const footprint = getBuildingFootprint(building);

    for (let x = footprint.left - 1; x <= footprint.right + 1; x += 1) {
      for (let y = footprint.top - 1; y <= footprint.bottom + 1; y += 1) {
        const covered = x >= footprint.left && x <= footprint.right &&
          y >= footprint.top && y <= footprint.bottom;
        assert.equal(
          worldGrid.findBuildingAtTile(site, x, y),
          covered ? building : undefined,
          `rotation ${rotation} tile ${x},${y}`
        );
      }
    }
  }
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

test('usesStableTieBreakForEqualShortestPaths', () => {
  const state = createInitialState();
  const site = state.sites.find(({ id }) => id === state.activeSiteId);
  site.buildings = [];
  site.belts = [];
  site.resources.iron = 10;

  const first = worldGrid.previewBeltRoute(state, { x: 0, y: 0 }, { x: 1, y: 1 });
  const second = worldGrid.previewBeltRoute(state, { x: 0, y: 0 }, { x: 1, y: 1 });

  assert.deepEqual(
    first.route.map(({ x, y, direction }) => ({ x, y, direction })),
    [
      { x: 0, y: 0, direction: 'south' },
      { x: 0, y: 1, direction: 'east' },
      { x: 1, y: 1, direction: 'east' },
    ]
  );
  assert.deepEqual(second.route, first.route);
});

test('routesAroundBuildingButOverResourceNodes', () => {
  const state = createInitialState();
  const site = state.sites.find(({ id }) => id === state.activeSiteId);
  site.buildings = [
    { id: 'route-blocker', type: 'splitter', x: 2, y: 0, rotation: 0 },
    { id: 'route-south-blocker', type: 'splitter', x: 0, y: 1, rotation: 0 },
    { id: 'route-north-blocker', type: 'splitter', x: 0, y: -1, rotation: 0 },
  ];
  site.belts = [];
  site.resources.iron = 10;
  site.resourceNodes.push({
    id: 'route-passable-node',
    resource: 'iron',
    x: 1,
    y: 0,
    remaining: 100,
  });

  const preview = worldGrid.previewBeltRoute(state, { x: 0, y: 0 }, { x: 4, y: 0 });

  assert.equal(preview.ok, true);
  assert.ok(preview.route.some(({ x, y }) => x === 1 && y === 0));
  assert.ok(preview.route.every(({ x, y }) => !(x === 2 && y === 0)));
});

test('requiresEmptyEndpoints', () => {
  const state = createInitialState();
  const site = state.sites.find(({ id }) => id === state.activeSiteId);
  site.buildings = [];
  site.belts = [{
    id: 'endpoint-belt',
    type: 'belt',
    x: 0,
    y: 0,
    direction: 'east',
    item: null,
    progress: 0,
  }];
  site.resources.iron = 10;
  const before = structuredClone(state);

  const preview = worldGrid.previewBeltRoute(state, { x: 0, y: 0 }, { x: 3, y: 0 });
  const commit = worldGrid.placeBeltRoute(state, { x: 0, y: 0 }, { x: 3, y: 0 });

  assert.deepEqual(preview, { ok: false, reason: 'route endpoints must be empty' });
  assert.deepEqual(commit, { ok: false, reason: 'route endpoints must be empty' });
  assert.deepEqual(state, before);

  site.belts = [];
  site.buildings = [{ id: 'occupied-endpoint', type: 'splitter', x: 3, y: 0, rotation: 0 }];
  const beforeOccupiedEnd = structuredClone(state);
  assert.deepEqual(
    worldGrid.previewBeltRoute(state, { x: 0, y: 0 }, { x: 3, y: 0 }),
    { ok: false, reason: 'route endpoints must be empty' }
  );
  assert.deepEqual(state, beforeOccupiedEnd);
});

test('capsPreviewAtLastAffordableTile', () => {
  const state = createInitialState();
  const site = state.sites.find(({ id }) => id === state.activeSiteId);
  site.buildings = [];
  site.belts = [];
  site.resources.iron = 2;
  const before = structuredClone(state);

  const preview = worldGrid.previewBeltRoute(state, { x: 0, y: 0 }, { x: 3, y: 0 });

  assert.equal(preview.ok, true);
  assert.deepEqual(preview.route.map(({ x, y }) => ({ x, y })), [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 3, y: 0 },
  ]);
  assert.deepEqual(preview.buildableRoute.map(({ x, y }) => ({ x, y })), [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ]);
  assert.deepEqual(preview.cost, { iron: 4 });
  assert.equal(preview.complete, false);
  assert.equal(preview.remaining, 2);
  assert.deepEqual(state, before);
});

test('revalidatesAndCommitsOnlyAffordablePrefix', () => {
  const state = createInitialState();
  const site = state.sites.find(({ id }) => id === state.activeSiteId);
  site.buildings = [];
  site.belts = [];
  site.resources.iron = 4;

  const preview = worldGrid.previewBeltRoute(state, { x: 0, y: 0 }, { x: 3, y: 0 });
  site.resources.iron = 2;
  const commit = worldGrid.placeBeltRoute(state, { x: 0, y: 0 }, { x: 3, y: 0 });

  assert.equal(preview.complete, true);
  assert.deepEqual(commit, {
    ok: true,
    placed: 2,
    reused: 0,
    cost: { iron: 2 },
    remaining: 2,
  });
  assert.deepEqual(site.belts.map(({ x, y }) => ({ x, y })), [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ]);
  assert.equal(site.resources.iron, 0);
});

test('refundsRecordedConstructionCostExactlyOnce', () => {
  const state = createInitialState();
  const site = state.sites.find(({ id }) => id === state.activeSiteId);
  const resourcesBeforeBuild = { ...site.resources };

  assert.deepEqual(worldGrid.placeBuilding(state, 'generator', 20, 20), { ok: true });
  const generator = site.buildings.find(building => building.x === 20 && building.y === 20);
  assert.deepEqual(generator.paidCost, BUILDING_DEFINITIONS.generator.cost);

  const beforeRemoval = structuredClone(state);
  const result = worldGrid.removeBuilding(state, generator.id);

  assert.deepEqual(result, {
    ok: true,
    refunded: BUILDING_DEFINITIONS.generator.cost,
    returnedItems: 0,
  });
  assert.deepEqual(site.resources, resourcesBeforeBuild);
  assert.equal(site.buildings.some(building => building.id === generator.id), false);
  const afterFirstRemoval = structuredClone(state);
  assert.deepEqual(worldGrid.removeBuilding(state, generator.id), { ok: false, reason: 'unknown building' });
  assert.deepEqual(state, afterFirstRemoval);
  assert.notDeepEqual(state, beforeRemoval);
});

test('doesNotRefundPreplacedStarterBuildings', () => {
  const state = createInitialState();
  const site = state.sites[0];
  const starters = [...site.buildings];
  assert.ok(starters.length > 0, 'the starting site seeds at least one building');
  const resourcesBefore = structuredClone(site.resources);

  for (const starter of starters) {
    assert.deepEqual(worldGrid.removeBuilding(state, starter.id), {
      ok: true,
      refunded: {},
      returnedItems: 0,
    });
  }
  assert.deepEqual(site.resources, resourcesBefore);
});

test('refundsFirstPaidBuildingThatReusesAStarterId', () => {
  const state = createInitialState();
  const site = state.sites[0];
  const resourcesBefore = { ...site.resources };

  assert.deepEqual(worldGrid.placeBuilding(state, 'generator', 20, 20), { ok: true });
  const generator = site.buildings.find(building => building.x === 20 && building.y === 20);
  assert.equal(generator.id, 'building-3');

  assert.deepEqual(worldGrid.removeBuilding(state, generator.id), {
    ok: true,
    refunded: BUILDING_DEFINITIONS.generator.cost,
    returnedItems: 0,
  });
  assert.deepEqual(site.resources, resourcesBefore);
});

test('infersHistoricalConstructionCostForLegacyBuiltEntity', () => {
  const state = createInitialState();
  const site = state.sites[0];
  const resourcesBeforeBuild = { ...site.resources };
  assert.deepEqual(worldGrid.placeBuilding(state, 'generator', 20, 20), { ok: true });
  const generator = site.buildings.find(building => building.x === 20 && building.y === 20);
  delete generator.paidCost;

  assert.deepEqual(worldGrid.removeBuilding(state, generator.id), {
    ok: true,
    refunded: BUILDING_DEFINITIONS.generator.cost,
    returnedItems: 0,
  });
  assert.deepEqual(site.resources, resourcesBeforeBuild);
});

test('returnsMachineContentsToMatchingInventories', () => {
  const state = createInitialState();
  const site = state.sites[0];
  assert.deepEqual(worldGrid.placeBuilding(state, 'smelter', 20, 20), { ok: true });
  const smelter = site.buildings.find(building => building.x === 20 && building.y === 20);
  const fossil = { type: 'unidentified-fossil', id: 'returned-fossil' };
  smelter.inputSlots.push(
    { type: 'resource', resource: 'iron', amount: 2 },
    { type: 'fragment', family: 'fish', amount: 1 }
  );
  smelter.outputSlots.push(fossil);
  const ironBefore = site.resources.iron;
  const fragmentsBefore = site.fragments.fish;

  const result = worldGrid.removeBuilding(state, smelter.id);

  assert.deepEqual(result, {
    ok: true,
    refunded: BUILDING_DEFINITIONS.smelter.cost,
    returnedItems: 4,
  });
  assert.equal(site.resources.iron, ironBefore + BUILDING_DEFINITIONS.smelter.cost.iron + 2);
  assert.equal(site.fragments.fish, fragmentsBefore + 1);
  assert.deepEqual(site.unidentifiedFossils, [fossil]);
});

test('removesOnlySelectedLaneAndReturnsItsItem', () => {
  const state = createInitialState();
  const site = state.sites[0];
  const selected = {
    id: 'selected-east-lane',
    type: 'belt',
    x: 20,
    y: 20,
    direction: 'east',
    item: { type: 'resource', resource: 'coal', amount: 2 },
    progress: 0.5,
    paidCost: { iron: 1 },
  };
  const crossing = {
    id: 'crossing-north-lane',
    type: 'belt',
    x: 20,
    y: 20,
    direction: 'north',
    item: null,
    progress: 0,
    paidCost: {},
  };
  site.belts.push(selected, crossing);
  const ironBefore = site.resources.iron;
  const coalBefore = site.resources.coal;

  assert.deepEqual(worldGrid.removeBelt(state, selected.id), {
    ok: true,
    refunded: { iron: 1 },
    returnedItems: 2,
  });
  assert.deepEqual(site.belts, [crossing]);
  assert.equal(site.resources.iron, ironBefore + 1);
  assert.equal(site.resources.coal, coalBefore + 2);
});

test('removeBeltsAtTilesDeletesAllLanesButNoBuildings', () => {
  const state = createInitialState();
  const site = state.sites[0];
  const warehouse = site.buildings.find(building => building.type === 'warehouse');
  const east = {
    id: 'swept-east',
    type: 'belt',
    x: 12,
    y: 14,
    direction: 'east',
    item: null,
    progress: 0,
    paidCost: { iron: 1 },
  };
  const north = {
    id: 'swept-north',
    type: 'belt',
    x: 12,
    y: 14,
    direction: 'north',
    item: { type: 'fragment', family: 'fern', amount: 2 },
    progress: 0,
    paidCost: {},
  };
  const other = {
    id: 'not-swept',
    type: 'belt',
    x: 13,
    y: 14,
    direction: 'east',
    item: null,
    progress: 0,
    paidCost: { iron: 1 },
  };
  site.belts.push(east, north, other);
  const ironBefore = site.resources.iron;
  const fernBefore = site.fragments.fern;

  const result = worldGrid.removeBeltsAtTiles(state, [{ x: 12, y: 14 }]);

  assert.deepEqual(result, {
    ok: true,
    removed: [east.id, north.id],
    refunded: { iron: 1 },
    returnedItems: 2,
  });
  assert.deepEqual(site.belts, [other]);
  assert.equal(site.resources.iron, ironBefore + 1);
  assert.equal(site.fragments.fern, fernBefore + 2);
  assert.ok(site.buildings.includes(warehouse));
});

test('gridSweepIncludesEveryTouchedTile', () => {
  assert.deepEqual(
    worldGrid.getGridLineTiles({ x: 0, y: 0 }, { x: 2, y: 2 }),
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ]
  );
});

test('rejectsInvalidRemovalWithoutPartialRefund', () => {
  const state = createInitialState();
  const site = state.sites[0];
  const first = {
    id: 'valid-before-invalid',
    type: 'belt',
    x: 20,
    y: 20,
    direction: 'east',
    item: null,
    progress: 0,
    paidCost: { iron: 1 },
  };
  const invalid = {
    id: 'invalid-held-item',
    type: 'belt',
    x: 20,
    y: 20,
    direction: 'north',
    item: { type: 'unsupported-item' },
    progress: 0,
    paidCost: { iron: 1 },
  };
  site.belts.push(first, invalid);
  const before = structuredClone(state);

  assert.deepEqual(worldGrid.removeBeltsAtTiles(state, [{ x: 20, y: 20 }]), {
    ok: false,
    reason: 'unsupported held item',
  });
  assert.deepEqual(state, before);
});
