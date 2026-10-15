import test from 'node:test';
import assert from 'node:assert/strict';

import { createInitialState } from '../src/game-core.js';
import * as renderer from '../src/world-renderer.js';
import * as worldGrid from '../src/world-grid.js';

function items(count, resource) {
  return Array.from({ length: count }, (_, index) => ({
    type: 'resource',
    resource,
    index,
  }));
}

function recordingContext() {
  const calls = [];
  const context = {
    calls,
    clearRect(...args) { calls.push({ method: 'clearRect', args }); },
    fillRect(...args) { calls.push({ method: 'fillRect', args, fillStyle: this.fillStyle }); },
    strokeRect(...args) { calls.push({ method: 'strokeRect', args, strokeStyle: this.strokeStyle }); },
    save() {},
    restore() {},
    translate() {},
    scale() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    closePath() {},
    fill() {},
    stroke() {},
    rect() {},
    fillText() {},
    setLineDash() {},
  };
  return context;
}

test('keepsMachineInventoryMarkersInsideFootprint', () => {
  assert.equal(typeof renderer.getMachineInventoryMarkers, 'function');

  const machines = [
    {
      building: {
        type: 'smelter',
        x: 10,
        y: 20,
        rotation: 0,
        inputSlots: items(3, 'iron'),
        outputSlots: items(3, 'steel'),
      },
      footprint: { left: 10, top: 20, width: 2, height: 2 },
    },
    {
      building: {
        type: 'fossil-finisher',
        x: -5,
        y: 8,
        rotation: 90,
        inputSlots: items(5, 'sediment'),
        outputSlots: items(5, 'unidentified-fossil'),
      },
      footprint: { left: -5, top: 8, width: 2, height: 3 },
    },
  ];

  for (const { building, footprint } of machines) {
    const markers = renderer.getMachineInventoryMarkers(building);
    const inputs = markers.filter(marker => marker.role === 'input');
    const outputs = markers.filter(marker => marker.role === 'output');

    assert.deepEqual(inputs.map(marker => marker.item), building.inputSlots);
    assert.deepEqual(outputs.map(marker => marker.item), building.outputSlots);
    assert.ok(inputs.length > 0 && outputs.length > 0);

    for (const marker of markers) {
      assert.ok(marker.size > 0);
      assert.ok(marker.x - marker.size / 2 >= footprint.left);
      assert.ok(marker.x + marker.size / 2 <= footprint.left + footprint.width);
      assert.ok(marker.y - marker.size / 2 >= footprint.top);
      assert.ok(marker.y + marker.size / 2 <= footprint.top + footprint.height);
    }
  }
});

test('previewsOnlyUnoccupiedValidBuildingFootprints', () => {
  assert.equal(typeof worldGrid.isBuildingPlacementValid, 'function');

  const state = createInitialState();
  const site = state.sites.find(candidate => candidate.id === state.activeSiteId);
  site.resources.iron = 0;

  assert.equal(worldGrid.isBuildingPlacementValid(state, 'smelter', 20, 20, 90), true);
  assert.equal(
    worldGrid.isBuildingPlacementValid(state, 'smelter', site.buildings[0].x, site.buildings[0].y, 0),
    false
  );
  assert.equal(worldGrid.isBuildingPlacementValid(state, 'smelter', 20, 20, 45), false);
});

test('drawsRotatedBuildingPreviewWithDistinctPlacementStates', () => {
  const state = createInitialState();
  const camera = { x: 0, y: 0, zoom: 1, tileSize: 32 };
  const viewport = { width: 32, height: 32 };

  function previewFillStyle(status) {
    const context = recordingContext();
    renderer.drawWorld(context, state, camera, viewport, {
      type: 'building',
      buildingType: 'fossil-finisher',
      x: 20,
      y: 20,
      rotation: 90,
      ...status,
    });
    assert.ok(context.calls.some(call =>
      call.method === 'strokeRect' && call.args.join(',') === '20,20,2,3'
    ));
    return context.calls.find(call =>
      call.method === 'fillRect' && call.args.join(',') === '20,20,2,3'
    )?.fillStyle;
  }

  const ready = previewFillStyle({ valid: true, affordable: true });
  const blocked = previewFillStyle({ valid: false, affordable: true });
  const unaffordable = previewFillStyle({ valid: true, affordable: false });

  assert.ok(ready);
  assert.ok(blocked);
  assert.ok(unaffordable);
  assert.notEqual(ready, blocked);
  assert.notEqual(ready, unaffordable);
  assert.notEqual(blocked, unaffordable);
});

test('drawsBeltRouteKindsAndUnaffordableTail', () => {
  const context = recordingContext();
  const state = createInitialState();
  const route = [
    { x: 20, y: 20, direction: 'east', kind: 'new' },
    { x: 21, y: 20, direction: 'east', kind: 'reuse' },
    { x: 22, y: 20, direction: 'south', kind: 'crossing' },
    { x: 22, y: 21, direction: 'south', kind: 'new' },
  ];

  renderer.drawWorld(
    context,
    state,
    { x: 0, y: 0, zoom: 1, tileSize: 32 },
    { width: 32, height: 32 },
    {
      type: 'belt-route',
      ok: true,
      route,
      buildableRoute: route.slice(0, 3),
    }
  );

  const previewFills = route.map(({ x, y }) =>
    context.calls.find(call =>
      call.method === 'fillRect' &&
      call.args[0] === x + 0.08 &&
      call.args[1] === y + 0.08 &&
      call.args[2] === 0.84 &&
      call.args[3] === 0.84
    )?.fillStyle
  );
  assert.ok(previewFills.every(Boolean));
  assert.equal(new Set(previewFills.slice(0, 3)).size, 3);
  assert.notEqual(previewFills[3], previewFills[0]);
});

test('drawsInvalidBeltRouteEndpoints', () => {
  const context = recordingContext();
  const state = createInitialState();

  renderer.drawWorld(
    context,
    state,
    { x: 0, y: 0, zoom: 1, tileSize: 32 },
    { width: 32, height: 32 },
    {
      type: 'belt-route',
      ok: false,
      start: { x: 20, y: 20 },
      end: { x: 23, y: 20 },
    }
  );

  for (const [x, y] of [[20, 20], [23, 20]]) {
    assert.ok(context.calls.some(call =>
      call.method === 'strokeRect' &&
      call.args[0] === x + 0.04 &&
      call.args[1] === y + 0.04 &&
      call.args[2] === 0.92 &&
      call.args[3] === 0.92 &&
      call.strokeStyle === '#de6956'
    ));
  }
});

test('interpolatesUnblockedItemBetweenBeltCenters', () => {
  const site = createInitialState().sites[0];
  const belt = {
    id: 'belt-moving',
    type: 'belt',
    x: 10,
    y: 10,
    direction: 'east',
    item: { type: 'resource', resource: 'iron' },
    progress: 0,
  };
  site.logisticsAccumulator = 0.5;
  site.belts.push(
    belt,
    {
      id: 'belt-destination',
      type: 'belt',
      x: 11,
      y: 10,
      direction: 'east',
      item: null,
      progress: 0,
    }
  );

  assert.deepEqual(renderer.getBeltItemPosition(site, belt), { x: 11, y: 10.5 });
});

test('holdsBlockedItemAtItsCurrentCenter', () => {
  const site = createInitialState().sites[0];
  const belt = {
    id: 'belt-blocked',
    type: 'belt',
    x: 10,
    y: 10,
    direction: 'east',
    item: { type: 'resource', resource: 'iron' },
    progress: 0,
  };
  site.logisticsAccumulator = 0.5;
  site.belts.push(
    belt,
    {
      id: 'belt-occupied-destination',
      type: 'belt',
      x: 11,
      y: 10,
      direction: 'east',
      item: { type: 'resource', resource: 'coal' },
      progress: 0,
    }
  );

  assert.deepEqual(renderer.getBeltItemPosition(site, belt), { x: 10.5, y: 10.5 });
});

test('drawsDistinctTracksForCrossingLanes', () => {
  const context = recordingContext();
  const state = createInitialState();
  state.sites[0].belts.push(
    {
      id: 'belt-horizontal',
      type: 'belt',
      x: 10,
      y: 10,
      direction: 'east',
      item: null,
      progress: 0,
    },
    {
      id: 'belt-vertical',
      type: 'belt',
      x: 10,
      y: 10,
      direction: 'north',
      item: null,
      progress: 0,
    }
  );

  renderer.drawWorld(
    context,
    state,
    { x: 0, y: 0, zoom: 1, tileSize: 32 },
    { width: 640, height: 640 }
  );

  assert.ok(context.calls.some(call =>
    call.method === 'fillRect' &&
    call.args.join(',') === '10.08,10.34,0.84,0.32'
  ));
  assert.ok(context.calls.some(call =>
    call.method === 'fillRect' &&
    call.args.join(',') === '10.34,10.08,0.32,0.84'
  ));
});

test('drawWorldDoesNotMutateItemOrSimulationState', () => {
  const context = recordingContext();
  const state = createInitialState();
  const site = state.sites[0];
  site.logisticsAccumulator = 0.5;
  site.simulationAccumulator = 0.25;
  site.belts.push({
    id: 'belt-render-purity',
    type: 'belt',
    x: 10,
    y: 10,
    direction: 'east',
    item: { type: 'resource', resource: 'iron' },
    progress: 0.25,
  });
  const before = structuredClone(site);

  renderer.drawWorld(
    context,
    state,
    { x: 0, y: 0, zoom: 1, tileSize: 32 },
    { width: 640, height: 640 }
  );

  assert.deepEqual(site, before);
});
