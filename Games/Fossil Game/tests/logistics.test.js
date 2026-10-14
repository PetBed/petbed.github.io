import test from 'node:test';
import assert from 'node:assert/strict';

import { createInitialState } from '../src/game-core.js';
import * as logistics from '../src/logistics.js';

function addBelt(site, id, x, y, direction, item = null, progress = 0) {
  const belt = { id, type: 'belt', x, y, direction, item, progress };
  site.belts.push(belt);
  return belt;
}

function addBuilding(site, id, type, x, y, extra = {}) {
  const building = {
    id,
    type,
    x,
    y,
    rotation: 0,
    inputSlots: [],
    outputSlots: [],
    progress: 0,
    ...extra,
  };
  site.buildings.push(building);
  return building;
}

function createSite() {
  return createInitialState().sites[0];
}

test('movesItemOneTilePerSecond', () => {
  assert.equal(typeof logistics.tickLogistics, 'function');

  const site = createSite();
  const item = { type: 'resource', resource: 'coal' };
  const first = addBelt(site, 'belt-a', 10, 10, 'east', item);
  const second = addBelt(site, 'belt-b', 11, 10, 'east');

  logistics.tickLogistics(site, 1);

  assert.equal(first.item, null);
  assert.equal(second.item, item);
  assert.equal(second.progress, 0);
});

test('retainsUnprocessedLongTickTime', () => {
  assert.equal(typeof logistics.tickLogistics, 'function');

  const site = createSite();
  const item = { type: 'resource', resource: 'coal' };
  const belts = [];

  for (let index = 0; index <= 301; index += 1) {
    belts.push(addBelt(
      site,
      `belt-long-${index}`,
      1000 + index,
      10,
      'east',
      index === 0 ? item : null
    ));
  }

  logistics.tickLogistics(site, 301);

  assert.equal(belts[300].item, item);
  assert.equal(site.logisticsAccumulator, 1);

  logistics.tickLogistics(site, 0);

  assert.equal(belts[300].item, null);
  assert.equal(belts[301].item, item);
});

test('transfersItemToMachinePort', () => {
  assert.equal(typeof logistics.tickLogistics, 'function');

  const site = createSite();
  const item = { type: 'resource', resource: 'iron' };
  const belt = addBelt(site, 'belt-input', 2, 20, 'east', item);
  const smelter = addBuilding(site, 'smelter-input', 'smelter', 3, 20);

  logistics.tickLogistics(site, 1);

  assert.equal(belt.item, null);
  assert.deepEqual(smelter.inputSlots, [item]);
});

test('retainsBlockedItemWithoutDuplication', () => {
  assert.equal(typeof logistics.tickLogistics, 'function');

  const site = createSite();
  const firstItem = { type: 'resource', resource: 'coal' };
  const secondItem = { type: 'resource', resource: 'iron' };
  const first = addBelt(site, 'belt-blocked', 10, 30, 'east', firstItem);
  const second = addBelt(site, 'belt-full', 11, 30, 'east', secondItem);

  logistics.tickLogistics(site, 1);

  assert.equal(first.item, firstItem);
  assert.equal(second.item, secondItem);
  assert.equal(site.belts.filter(belt => belt.item !== null).length, 2);
});

test('alternatesSplitterOutputs', () => {
  assert.equal(typeof logistics.tickLogistics, 'function');
  assert.equal(typeof logistics.setSplitterOutputs, 'function');

  const site = createSite();
  const firstItem = { type: 'resource', resource: 'coal' };
  const splitter = addBuilding(site, 'splitter-a', 'splitter', 41, 40, {
    outputDirections: ['east', 'south'],
    lastOutputIndex: 0,
  });
  const input = addBelt(site, 'belt-splitter-input', 40, 40, 'east', firstItem);
  const eastOutput = addBelt(site, 'belt-east', 42, 40, 'east');
  const southOutput = addBelt(site, 'belt-south', 41, 41, 'south');

  assert.deepEqual(
    logistics.setSplitterOutputs(site, splitter.id, ['east', 'south']),
    { ok: true }
  );
  logistics.tickLogistics(site, 1);
  assert.equal(input.item, null);
  assert.equal(eastOutput.item, firstItem);

  const secondItem = { type: 'resource', resource: 'stone' };
  input.item = secondItem;
  logistics.tickLogistics(site, 1);

  assert.equal(input.item, null);
  assert.equal(southOutput.item, secondItem);
});
