import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/game-core.js';
import { foundSite } from '../src/sites.js';

const DATABASE_NAME = 'fossil-factory';
const STORE_NAME = 'saves';
const SAVE_ID = 'main';

async function loadStorage() {
  try {
    return await import('../src/storage.js');
  } catch {
    assert.fail('IndexedDB save/load is not implemented');
  }
}

async function loadFakeIndexedDb() {
  await import('fake-indexeddb/auto');
}

async function clearDatabase() {
  await loadFakeIndexedDb();
  await new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE_NAME);
    request.onsuccess = resolve;
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('database deletion was blocked'));
  });
}

async function writeRecord(record) {
  await new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(record);
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    };
  });
}

async function readRecord() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const getRequest = transaction.objectStore(STORE_NAME).get(SAVE_ID);
      getRequest.onsuccess = () => {
        database.close();
        resolve(getRequest.result);
      };
      getRequest.onerror = () => reject(getRequest.error);
    };
  });
}

test('roundTripsPhysicalState', async () => {
  const { loadGame, saveGame } = await loadStorage();
  await clearDatabase();
  const state = createInitialState();
  state.site.belts.push({
    id: 'belt-save-test',
    type: 'belt',
    x: 4,
    y: 5,
    direction: 'east',
    item: { type: 'resource', resource: 'iron', amount: 2 },
    progress: 0.4,
  });
  state.site.unidentifiedFossils.push({
    type: 'unidentified-fossil',
    id: 'unidentified-site-1-save-test',
  });
  state.collection.push({
    id: 'identified-save-test',
    family: 'fish',
    rarity: 'rare',
    name: 'Fish Rare',
    bonus: { digSpeed: 0.08, output: 0.1 },
  });
  state.site.museum.displayed[0] = 'identified-save-test';

  await saveGame(state);
  const loaded = await loadGame();

  assert.deepEqual(loaded, state);
});

test('returnsNullWhenNoSaveExists', async () => {
  const { loadGame } = await loadStorage();
  await clearDatabase();

  assert.equal(await loadGame(), null);
});

test('roundTripsMultipleSitesAndOfflineTimestamp', async () => {
  const { loadGame, saveGame } = await loadStorage();
  await clearDatabase();
  const state = createInitialState();
  assert.equal(foundSite(state, 'granite-reach').ok, true);
  state.sites[1].resources.copper = 7;

  await saveGame(state);
  const loaded = await loadGame();

  assert.deepEqual(loaded, state);
  assert.equal(loaded.sites[1].resources.copper, 7);
  assert.ok(Number.isSafeInteger(loaded.lastSavedAt));
  assert.equal(Object.prototype.propertyIsEnumerable.call(loaded, 'lastSavedAt'), false);
});

test('rejectsMalformedSaveWithoutOverwrite', async () => {
  const { loadGame, saveGame } = await loadStorage();
  await clearDatabase();
  await saveGame(createInitialState());
  const malformed = {
    id: SAVE_ID,
    saveVersion: 2,
    state: { version: 1, sites: 'not-an-array' },
  };
  await writeRecord(malformed);

  await assert.rejects(loadGame(), /invalid save data/i);
  assert.deepEqual(await readRecord(), malformed);
});

test('rejectsIncompleteSiteInventoryWithoutOverwrite', async () => {
  const { loadGame, saveGame } = await loadStorage();
  await clearDatabase();
  await saveGame(createInitialState());
  const validRecord = await readRecord();

  for (const removeField of [
    state => delete state.sites[0].resources.iron,
    state => delete state.sites[0].fragments.fern,
  ]) {
    const malformed = structuredClone(validRecord);
    removeField(malformed.state);
    await writeRecord(malformed);

    await assert.rejects(loadGame(), /invalid save data/i);
    assert.deepEqual(await readRecord(), malformed);
  }
});

test('rejectsSaveMissingExplorationHistoryWithoutOverwrite', async () => {
  const { loadGame, saveGame } = await loadStorage();
  await clearDatabase();
  await saveGame(createInitialState());
  const malformed = await readRecord();
  delete malformed.state.sites[0].exploredChunks;
  await writeRecord(malformed);

  await assert.rejects(loadGame(), /invalid save data/i);
  assert.deepEqual(await readRecord(), malformed);
});

test('rejectsVersionTwoSaveWithoutItsOfflineTimestamp', async () => {
  const { loadGame, saveGame } = await loadStorage();
  await clearDatabase();
  await saveGame(createInitialState());
  const malformed = await readRecord();
  malformed.saveVersion = 2;
  delete malformed.savedAt;
  await writeRecord(malformed);

  await assert.rejects(loadGame(), /invalid save data/i);
  assert.deepEqual(await readRecord(), malformed);
});

test('migratesVersionTwoSiteResourcesForTheCurrentWorld', async () => {
  const { loadGame, saveGame } = await loadStorage();
  await clearDatabase();
  const priorState = createInitialState();
  await saveGame(priorState);
  delete priorState.site.resources.copper;
  delete priorState.site.exploredChunks;
  delete priorState.site.buildings[0].requiresPower;
  delete priorState.site.buildings[0].powerReserved;
  await writeRecord({
    id: SAVE_ID,
    saveVersion: 2,
    savedAt: 1000,
    state: priorState,
  });

  const migrated = await loadGame();

  assert.equal(migrated.site.resources.copper, 0);
  assert.deepEqual(migrated.site.exploredChunks, {});
  assert.equal(migrated.site.buildings[0].requiresPower, false);
  assert.equal(migrated.site.buildings[0].powerReserved, false);
});

test('migratesSupportedVersion', async () => {
  const { loadGame, saveGame } = await loadStorage();
  await clearDatabase();
  const priorState = createInitialState();
  delete priorState.site.museum.bonuses;
  delete priorState.site.nextFossilId;
  await saveGame(priorState);
  await writeRecord({ id: SAVE_ID, saveVersion: 1, state: priorState });

  const migrated = await loadGame();

  assert.deepEqual(migrated.site.museum.bonuses, { digSpeed: 0, output: 0 });
  assert.equal(migrated.site.nextFossilId, 1);
  assert.equal(migrated.site.museum.displayed.length, migrated.site.museum.slots);
});
