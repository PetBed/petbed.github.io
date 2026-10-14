import test from 'node:test';
import assert from 'node:assert/strict';

import { createInitialState } from '../src/game-core.js';
import { getMuseumBonuses, openFossil, setMuseumDisplay } from '../src/fossils.js';

async function loadSites() {
  try {
    return await import('../src/sites.js');
  } catch {
    assert.fail('multi-site progression is not implemented');
  }
}

test('foundingCostsActiveSiteMaterials', async () => {
  const { foundSite } = await loadSites();
  const state = createInitialState();
  const startingIron = state.site.resources.iron;
  const startingStone = state.site.resources.stone;

  const result = foundSite(state, 'granite-reach');

  assert.equal(result.ok, true);
  assert.equal(state.site.resources.iron, startingIron - 10);
  assert.equal(state.site.resources.stone, startingStone - 10);
  assert.ok(state.sites.some(site => site.id === 'granite-reach'));
});

test('switchesWithoutLosingLayouts', async () => {
  const { foundSite, switchSite } = await loadSites();
  const state = createInitialState();
  state.site.belts.push({
    id: 'home-belt',
    type: 'belt',
    x: 7,
    y: 8,
    direction: 'north',
    item: { type: 'resource', resource: 'iron' },
    progress: 0.5,
  });
  const originalLayout = {
    buildings: structuredClone(state.site.buildings),
    belts: structuredClone(state.site.belts),
  };
  foundSite(state, 'granite-reach');

  assert.equal(switchSite(state, 'granite-reach').ok, true);
  state.site.buildings[0].x = 30;
  assert.equal(switchSite(state, 'site-1').ok, true);

  assert.deepEqual(state.site.buildings, originalLayout.buildings);
  assert.deepEqual(state.site.belts, originalLayout.belts);
  assert.equal(state.resources, state.site.resources);
});

test('sitesKeepMaterialsSeparate', async () => {
  const { foundSite, switchSite } = await loadSites();
  const state = createInitialState();
  foundSite(state, 'granite-reach');
  const homeCoal = state.sites[0].resources.coal;
  const newSiteCoal = state.sites[1].resources.coal;
  state.sites[1].resources.coal += 3;

  assert.equal(state.sites[0].resources.coal, homeCoal);
  assert.equal(state.sites[1].resources.coal, newSiteCoal + 3);
  switchSite(state, 'granite-reach');
  assert.equal(state.resources.coal, newSiteCoal + 3);
});

test('fossilsTransferBetweenMuseums', async () => {
  const { foundSite, switchSite } = await loadSites();
  const state = createInitialState();
  foundSite(state, 'granite-reach');
  const item = { type: 'unidentified-fossil', id: 'unidentified-site-1-transfer' };
  state.sites[0].unidentifiedFossils.push(item);
  const opened = openFossil(state, 'site-1', item.id, () => 0);

  assert.equal(setMuseumDisplay(state, 'site-1', opened.fossil.id, 0).ok, true);
  assert.equal(setMuseumDisplay(state, 'granite-reach', opened.fossil.id, 0).ok, true);
  assert.deepEqual(state.sites[0].museum.displayed, [null]);
  assert.equal(state.sites[1].museum.displayed[0], opened.fossil.id);
  assert.equal(switchSite(state, 'granite-reach').ok, true);
  assert.ok(state.collection.some(fossil => fossil.id === opened.fossil.id));
});

test('museumBonusesStayLocal', async () => {
  const { foundSite } = await loadSites();
  const state = createInitialState();
  foundSite(state, 'granite-reach');
  const item = { type: 'unidentified-fossil', id: 'unidentified-site-1-bonus' };
  state.sites[0].unidentifiedFossils.push(item);
  const opened = openFossil(state, 'site-1', item.id, () => 0);
  setMuseumDisplay(state, 'site-1', opened.fossil.id, 0);

  assert.ok(getMuseumBonuses(state, 'site-1').digSpeed > 0);
  assert.deepEqual(getMuseumBonuses(state, 'granite-reach'), { digSpeed: 0, output: 0 });
});

test('inactiveCatchupRespectsConnectedRoutes', async () => {
  const { simulateInactiveSite } = await loadSites();
  const disconnected = createInitialState().site;
  disconnected.resourceNodes[0].remaining = 2;
  const disconnectedLayout = disconnected.buildings.map(({ id, x, y }) => ({ id, x, y }));

  simulateInactiveSite(disconnected, 20);

  assert.equal(disconnected.resources.coal, 12);
  assert.equal(disconnected.buildings[0].outputSlots.length, 2);
  assert.deepEqual(
    disconnected.buildings.map(({ id, x, y }) => ({ id, x, y })),
    disconnectedLayout
  );

  const connected = createInitialState().site;
  connected.resourceNodes[0].remaining = 2;
  connected.buildings.find(building => building.type === 'warehouse').x = -4;
  connected.buildings.find(building => building.type === 'warehouse').y = 4;
  connected.belts.push(
    { id: 'source-belt', type: 'belt', x: -6, y: 4, direction: 'east', item: null, progress: 0 },
    { id: 'warehouse-belt', type: 'belt', x: -5, y: 4, direction: 'east', item: null, progress: 0 }
  );

  simulateInactiveSite(connected, 20);

  assert.equal(connected.resources.coal, 14);
  assert.equal(connected.buildings[0].outputSlots.length, 0);
});

test('catchesUpSiteFromItsLastSimulatedTime', async () => {
  const { catchUpSite } = await loadSites();
  const site = createInitialState().site;
  site.lastSimulatedAt = 1000;
  site.resourceNodes[0].remaining = 2;

  const result = catchUpSite(site, 11000, 5000);

  assert.equal(result.elapsedSeconds, 10);
  assert.equal(site.lastSimulatedAt, 11000);
  assert.equal(site.resources.coal, 12);
  assert.equal(site.buildings[0].outputSlots.length, 2);
});
