import test from 'node:test';
import assert from 'node:assert/strict';

import { createInitialState } from '../src/game-core.js';
import { tickLogistics } from '../src/logistics.js';

async function loadFossils() {
  try {
    return await import('../src/fossils.js');
  } catch {
    assert.fail('fossil discovery API is not implemented');
  }
}

function addSecondSite(state) {
  const secondSite = structuredClone(state.sites[0]);
  secondSite.id = 'site-2';
  secondSite.name = 'Granite Reach';
  secondSite.museum = { slots: 1, displayed: [] };
  state.sites.push(secondSite);
  state.museum[secondSite.id] = secondSite.museum.displayed;
  return secondSite;
}

test('finishesUnidentifiedFossilWithoutRng', async () => {
  const { finishFossil } = await loadFossils();
  const site = createInitialState().sites[0];
  const finisher = {
    id: 'finisher-1',
    type: 'fossil-finisher',
    inputSlots: [
      { type: 'fragment', family: 'trilobite' },
      { type: 'fragment', family: 'fish' },
      { type: 'fragment', family: 'fern' },
      { type: 'fragment', family: 'pterosaur' },
    ],
    outputSlots: [],
  };

  const result = finishFossil(site, finisher);

  assert.equal(result.ok, true);
  assert.equal(finisher.inputSlots.length, 0);
  assert.equal(finisher.outputSlots.length, 1);
  assert.equal(finisher.outputSlots[0].type, 'unidentified-fossil');
  assert.equal(typeof finisher.outputSlots[0].id, 'string');
  assert.equal('family' in finisher.outputSlots[0], false);
  assert.equal('rarity' in finisher.outputSlots[0], false);
});

test('warehouseStoresOnlyBeltDeliveredFossils', () => {
  const site = createInitialState().sites[0];
  const warehouse = site.buildings.find(building => building.type === 'warehouse');
  const fossil = { type: 'unidentified-fossil', id: 'unidentified-site-1-1' };
  const belt = {
    id: 'fossil-belt',
    type: 'belt',
    x: warehouse.x - 1,
    y: warehouse.y,
    direction: 'east',
    item: fossil,
    progress: 0,
  };
  site.belts.push(belt);

  assert.equal(site.unidentifiedFossils.includes(fossil), false);
  tickLogistics(site, 1);

  assert.deepEqual(site.unidentifiedFossils, [fossil]);
  assert.equal(belt.item, null);
});

test('openFossilRollsOnlyWhenRequested', async () => {
  const { openFossil } = await loadFossils();
  const state = createInitialState();
  const fossil = { type: 'unidentified-fossil', id: 'unidentified-site-1-1' };
  state.sites[0].unidentifiedFossils.push(fossil);
  const rolls = [0, 0];
  let rngCalls = 0;

  const result = openFossil(state, 'site-1', fossil.id, () => {
    rngCalls += 1;
    return rolls.shift();
  });

  assert.equal(rngCalls, 2);
  assert.equal(result.ok, true);
  assert.equal(result.fossil.family, 'trilobite');
  assert.equal(result.fossil.rarity, 'common');
  assert.equal(state.sites[0].unidentifiedFossils.length, 0);
  assert.equal(state.collection[0].id, fossil.id);
});

test('rejectsSecondOpen', async () => {
  const { openFossil } = await loadFossils();
  const state = createInitialState();
  const fossil = { type: 'unidentified-fossil', id: 'unidentified-site-1-1' };
  state.sites[0].unidentifiedFossils.push(fossil);
  const first = openFossil(state, 'site-1', fossil.id, () => 0);
  const collectionBeforeSecondOpen = structuredClone(state.collection);

  const second = openFossil(state, 'site-1', fossil.id, () => 0);

  assert.equal(first.ok, true);
  assert.equal(second.ok, false);
  assert.deepEqual(state.collection, collectionBeforeSecondOpen);
});

test('museumBonusIsSiteLocal', async () => {
  const { getMuseumBonuses, openFossil, setMuseumDisplay } = await loadFossils();
  const state = createInitialState();
  const secondSite = addSecondSite(state);
  const unidentified = { type: 'unidentified-fossil', id: 'unidentified-site-1-1' };
  state.sites[0].unidentifiedFossils.push(unidentified);
  const opened = openFossil(state, 'site-1', unidentified.id, () => 0);

  assert.equal(setMuseumDisplay(state, 'site-1', opened.fossil.id, 0).ok, true);
  assert.ok(getMuseumBonuses(state, 'site-1').digSpeed > 0);
  assert.equal(getMuseumBonuses(state, secondSite.id).digSpeed, 0);

  assert.equal(setMuseumDisplay(state, secondSite.id, opened.fossil.id, 0).ok, true);
  assert.equal(getMuseumBonuses(state, 'site-1').digSpeed, 0);
  assert.ok(getMuseumBonuses(state, secondSite.id).digSpeed > 0);
});

test('expandingMuseumDeductsMaterials', async () => {
  const { expandMuseum } = await loadFossils();
  const state = createInitialState();
  const site = state.sites[0];
  const startingIron = site.resources.iron;
  const startingStone = site.resources.stone;

  const result = expandMuseum(state, site.id);

  assert.equal(result.ok, true);
  assert.equal(site.museum.slots, 2);
  assert.equal(site.resources.iron, startingIron - 8);
  assert.equal(site.resources.stone, startingStone - 8);
});
