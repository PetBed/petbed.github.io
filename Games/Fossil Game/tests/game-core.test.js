import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createInitialState,
  dig,
  processFragments,
  buyMachine,
} from '../src/game-core.js';
import * as gameCore from '../src/game-core.js';
import * as recipes from '../src/recipes.js';

function addBuilding(site, id, type, extra = {}) {
  const building = {
    id,
    type,
    x: 20,
    y: 20,
    rotation: 0,
    inputSlots: [],
    outputSlots: [],
    progress: 0,
    ...extra,
  };
  site.buildings.push(building);
  return building;
}

test('dig produces resources and fragment batches', () => {
  const state = createInitialState();
  const result = dig(state, () => 0.1);

  assert.ok(result.resources.stone >= 3);
  assert.ok(result.resources.sediment >= 2);
  assert.ok(Object.values(result.fragments).some(value => value > 0));
});

test('processFragments converts fragment batches into a finished fossil outcome', () => {
  const state = createInitialState();
  state.fragments = { trilobite: 6, pterosaur: 4, fish: 2, fern: 2 };

  const result = processFragments(state, () => 0.08);

  assert.equal(result.completed.length, 1);
  assert.match(result.completed[0].family, /trilobite|pterosaur|fish|fern/);
  assert.ok(['common', 'uncommon', 'rare', 'epic', 'legendary'].includes(result.completed[0].rarity));
  assert.ok(state.fossils.some(f => f.id === result.completed[0].id));
});

test('buyMachine consumes materials and updates the machine count', () => {
  const state = createInitialState();
  state.resources.steel = 200;
  state.resources.concrete = 200;

  const updated = buyMachine(state, 'smelter', () => 0.5);

  assert.equal(updated.machines.smelter, 1);
  assert.ok(updated.resources.steel < 200);
  assert.ok(updated.resources.concrete < 200);
});

test('excavatorEmitsResourcesAndFragments', () => {
  assert.equal(typeof gameCore.tickSite, 'function');

  const state = createInitialState();
  const site = state.sites[0];
  const fragmentNode = site.resourceNodes.find(node => node.resource === 'fragment');
  assert.ok(fragmentNode);
  const fragmentExcavator = addBuilding(site, 'fragment-excavator', 'excavator', {
    x: fragmentNode.x,
    y: fragmentNode.y,
    resourceNodeId: fragmentNode.id,
  });
  const coalExcavator = site.buildings.find(building => building.type === 'excavator');

  gameCore.tickSite(site, 2, () => 0);

  assert.ok(coalExcavator.outputSlots.some(item =>
    item.type === 'resource' && item.resource === 'coal'
  ));
  assert.ok(fragmentExcavator.outputSlots.some(item =>
    item.type === 'fragment' && item.family === 'trilobite'
  ));
  assert.equal(site.resources.coal, 12);
});

test('productionWaitsForPower', () => {
  assert.equal(typeof gameCore.tickSite, 'function');
  assert.ok(recipes.RECIPES?.smelter);

  const site = createInitialState().sites[0];
  const iron = { type: 'resource', resource: 'iron' };
  const coal = { type: 'resource', resource: 'coal' };
  const smelter = addBuilding(site, 'test-smelter-power', 'smelter', {
    inputSlots: [iron, coal],
  });
  const powerCost = recipes.RECIPES.smelter.power;
  site.resources.power = powerCost - 1;

  const events = gameCore.tickSite(site, 2, () => 0);

  assert.deepEqual(smelter.inputSlots, [iron, coal]);
  assert.equal(smelter.progress, 0);
  assert.ok(events.blocked.some(event =>
    event.machineId === smelter.id && event.reason === 'insufficient power'
  ));
});

test('missingInputsRemainUnchanged', () => {
  assert.equal(typeof gameCore.tickSite, 'function');

  const site = createInitialState().sites[0];
  const iron = { type: 'resource', resource: 'iron' };
  const smelter = addBuilding(site, 'test-smelter-inputs', 'smelter', {
    inputSlots: [iron],
  });
  site.resources.power = 100;

  const events = gameCore.tickSite(site, 2, () => 0);

  assert.deepEqual(smelter.inputSlots, [iron]);
  assert.equal(smelter.progress, 0);
  assert.ok(events.blocked.some(event =>
    event.machineId === smelter.id && event.reason === 'missing inputs'
  ));
});

test('generatorCoalIsNotAlsoRecipeInput', () => {
  assert.equal(typeof gameCore.tickSite, 'function');

  const site = createInitialState().sites[0];
  const generatorCoal = { type: 'resource', resource: 'coal' };
  const smelterIron = { type: 'resource', resource: 'iron' };
  const generator = addBuilding(site, 'test-generator', 'generator', {
    inputSlots: [generatorCoal],
  });
  const smelter = addBuilding(site, 'test-smelter-shared-coal', 'smelter', {
    inputSlots: [smelterIron],
  });

  const events = gameCore.tickSite(site, 2, () => 0);

  assert.deepEqual(generator.inputSlots, []);
  assert.deepEqual(smelter.inputSlots, [smelterIron]);
  assert.ok(site.resources.power > 0);
  assert.ok(events.blocked.some(event =>
    event.machineId === smelter.id && event.reason === 'missing inputs'
  ));
});

test('extractedItemsReachWarehouseOnlyThroughBelts', () => {
  assert.equal(typeof gameCore.tickSite, 'function');

  const site = createInitialState().sites[0];
  const excavator = site.buildings.find(building => building.type === 'excavator');
  const warehouse = site.buildings.find(building => building.type === 'warehouse');
  site.resourceNodes.find(node => node.id === excavator.resourceNodeId).remaining = 1;

  gameCore.tickSite(site, 2, () => 0);
  assert.equal(site.resources.coal, 12);
  assert.ok(excavator.outputSlots.some(item => item.resource === 'coal'));

  warehouse.x = -5;
  warehouse.y = 4;
  site.belts.push({
    id: 'belt-to-warehouse',
    type: 'belt',
    x: -6,
    y: 4,
    direction: 'east',
    item: null,
    progress: 0,
  });

  gameCore.tickSite(site, 1, () => 0);
  assert.equal(site.resources.coal, 12);
  gameCore.tickSite(site, 1, () => 0);

  assert.equal(site.resources.coal, 13);
  assert.ok(excavator.outputSlots.every(item => item.resource !== 'coal'));
});
