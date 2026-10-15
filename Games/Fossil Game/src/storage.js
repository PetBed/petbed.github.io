import { FOSSIL_FAMILIES } from './fossils.js';

const DATABASE_NAME = 'fossil-factory';
const DATABASE_VERSION = 1;
const STORE_NAME = 'saves';
const SAVE_ID = 'main';
const SAVE_VERSION = 3;
const GAME_STATE_VERSION = 1;
const RESOURCE_KEYS = ['coal', 'iron', 'copper', 'stone', 'sediment', 'steel', 'concrete', 'power'];
const RESOURCE_NODE_TYPES = ['coal', 'iron', 'copper', 'stone', 'sediment', 'fragment'];

function failInvalidSave(reason) {
  throw new Error(`Invalid save data: ${reason}. The existing save was left untouched.`);
}

function validateState(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    failInvalidSave('game state is not an object');
  }
  if (state.version !== GAME_STATE_VERSION) {
    failInvalidSave('unsupported game state version');
  }
  if (!Array.isArray(state.sites) || state.sites.length === 0) {
    failInvalidSave('site list is missing');
  }
  if (typeof state.activeSiteId !== 'string') {
    failInvalidSave('active site id is missing');
  }
  if (!Array.isArray(state.collection) || !Array.isArray(state.fossils)) {
    failInvalidSave('fossil collection is missing');
  }
  if (!Number.isSafeInteger(state.nextEntityId) || state.nextEntityId < 1) {
    failInvalidSave('next entity id is invalid');
  }

  const activeSite = state.sites.find(site => site.id === state.activeSiteId);
  if (!activeSite) {
    failInvalidSave('active site does not exist');
  }

  for (const site of state.sites) {
    if (
      typeof site.id !== 'string' ||
      !site.resources || typeof site.resources !== 'object' || Array.isArray(site.resources) ||
      !site.fragments || typeof site.fragments !== 'object' || Array.isArray(site.fragments) ||
      !Array.isArray(site.buildings) ||
      !Array.isArray(site.belts) ||
      !Array.isArray(site.resourceNodes) ||
      !Array.isArray(site.unidentifiedFossils) ||
      !site.exploredChunks ||
      typeof site.exploredChunks !== 'object' ||
      Array.isArray(site.exploredChunks) ||
      Object.values(site.exploredChunks).some(explored => explored !== true) ||
      !site.museum ||
      !Number.isSafeInteger(site.museum.slots) ||
      site.museum.slots < 1 ||
      !Array.isArray(site.museum.displayed) ||
      (
        site.lastSimulatedAt !== undefined &&
        (!Number.isSafeInteger(site.lastSimulatedAt) || site.lastSimulatedAt < 0)
      )
    ) {
      failInvalidSave(`site ${site.id || '(unknown)'} is incomplete`);
    }
    for (const resource of RESOURCE_KEYS) {
      if (!Number.isFinite(site.resources[resource]) || site.resources[resource] < 0) {
        failInvalidSave(`site ${site.id} has incomplete resources`);
      }
    }
    for (const family of FOSSIL_FAMILIES) {
      if (!Number.isFinite(site.fragments[family]) || site.fragments[family] < 0) {
        failInvalidSave(`site ${site.id} has incomplete fragments`);
      }
    }
    for (const building of site.buildings) {
      if (
        typeof building.id !== 'string' ||
        typeof building.type !== 'string' ||
        !Number.isSafeInteger(building.x) ||
        !Number.isSafeInteger(building.y) ||
        !Array.isArray(building.inputSlots) ||
        !Array.isArray(building.outputSlots) ||
        (building.requiresPower !== undefined && typeof building.requiresPower !== 'boolean') ||
        (building.powerReserved !== undefined && typeof building.powerReserved !== 'boolean') ||
        (
          Object.hasOwn(building, 'paidCost') &&
          (
            !building.paidCost ||
            typeof building.paidCost !== 'object' ||
            Array.isArray(building.paidCost) ||
            Object.entries(building.paidCost).some(([resource, amount]) =>
              !RESOURCE_KEYS.includes(resource) ||
              !Number.isFinite(amount) ||
              amount < 0
            )
          )
        )
      ) {
        failInvalidSave(`site ${site.id} has an invalid building`);
      }
    }
    for (const node of site.resourceNodes) {
      if (
        typeof node.id !== 'string' ||
        !RESOURCE_NODE_TYPES.includes(node.resource) ||
        !Number.isSafeInteger(node.x) ||
        !Number.isSafeInteger(node.y) ||
        !Number.isFinite(node.remaining) ||
        node.remaining < 0 ||
        (
          node.resource === 'fragment' &&
          (
            !Array.isArray(node.families) ||
            node.families.length === 0 ||
            node.families.some(family => !FOSSIL_FAMILIES.includes(family))
          )
        )
      ) {
        failInvalidSave(`site ${site.id} has an invalid resource node`);
      }
    }
    const beltLaneKeys = new Set();
    for (const belt of site.belts) {
      if (
        typeof belt.id !== 'string' ||
        !Number.isSafeInteger(belt.x) ||
        !Number.isSafeInteger(belt.y) ||
        !['north', 'east', 'south', 'west'].includes(belt.direction) ||
        !Object.hasOwn(belt, 'item') ||
        !Number.isFinite(belt.progress) ||
        (
          Object.hasOwn(belt, 'paidCost') &&
          (
            !belt.paidCost ||
            typeof belt.paidCost !== 'object' ||
            Array.isArray(belt.paidCost) ||
            Object.entries(belt.paidCost).some(([resource, amount]) =>
              !RESOURCE_KEYS.includes(resource) ||
              !Number.isFinite(amount) ||
              amount < 0
            )
          )
        )
      ) {
        failInvalidSave(`site ${site.id} has an invalid belt`);
      }
      const laneKey = `${belt.x},${belt.y}:${belt.direction}`;
      if (beltLaneKeys.has(laneKey)) {
        failInvalidSave(`site ${site.id} has duplicate belt lanes`);
      }
      beltLaneKeys.add(laneKey);
    }
    for (const fossil of site.unidentifiedFossils) {
      if (fossil.type !== 'unidentified-fossil' || typeof fossil.id !== 'string') {
        failInvalidSave(`site ${site.id} has an invalid unidentified fossil`);
      }
    }
  }
}

function normalizeState(state) {
  for (const site of state.sites) {
    if (!site.exploredChunks) {
      site.exploredChunks = {};
    }
    const starterExcavatorId = site.id === 'site-1'
      ? 'building-1'
      : `${site.id}-building-1`;
    for (const building of site.buildings) {
      if (building.type !== 'excavator') {
        continue;
      }
      if (typeof building.requiresPower !== 'boolean') {
        building.requiresPower = building.id !== starterExcavatorId;
      }
      if (typeof building.powerReserved !== 'boolean') {
        building.powerReserved = false;
      }
    }
  }
  const activeSite = state.sites.find(site => site.id === state.activeSiteId);
  state.site = activeSite;
  state.resources = activeSite.resources;
  state.fragments = activeSite.fragments;
  state.unidentifiedFossils = activeSite.unidentifiedFossils;
  state.fossils = state.collection;
  state.museum = Object.fromEntries(state.sites.map(site => [
    site.id,
    site.museum.displayed,
  ]));
  return state;
}

function withSaveTimestamp(state, savedAt) {
  Object.defineProperty(state, 'lastSavedAt', {
    value: Number.isSafeInteger(savedAt) && savedAt >= 0 ? savedAt : Date.now(),
    enumerable: false,
  });
  return state;
}

function migrateVersionOneState(previousState) {
  if (!previousState || typeof previousState !== 'object' || Array.isArray(previousState)) {
    failInvalidSave('version 1 game state is malformed');
  }
  const state = structuredClone(previousState);
  if (!Array.isArray(state.collection)) {
    state.collection = Array.isArray(state.fossils) ? state.fossils : null;
  }
  if (!Array.isArray(state.collection)) {
    failInvalidSave('version 1 fossil collection is missing');
  }
  if (!Array.isArray(state.sites)) {
    failInvalidSave('version 1 site list is missing');
  }

  for (const site of state.sites) {
    if (!Array.isArray(site.unidentifiedFossils)) {
      site.unidentifiedFossils = [];
    }
    if (!site.museum || typeof site.museum !== 'object') {
      site.museum = { slots: 1, displayed: [] };
    }
    site.museum.slots = Number.isSafeInteger(site.museum.slots) && site.museum.slots > 0
      ? site.museum.slots
      : 1;
    if (!Array.isArray(site.museum.displayed)) {
      site.museum.displayed = [];
    }
    while (site.museum.displayed.length < site.museum.slots) {
      site.museum.displayed.push(null);
    }

    const displayedIds = new Set(site.museum.displayed.filter(Boolean));
    const bonuses = { digSpeed: 0, output: 0 };
    for (const fossil of state.collection) {
      if (displayedIds.has(fossil.id)) {
        bonuses.digSpeed += fossil.bonus?.digSpeed || 0;
        bonuses.output += fossil.bonus?.output || 0;
      }
    }
    site.museum.bonuses = bonuses;

    const existingIds = [
      ...site.unidentifiedFossils,
      ...site.buildings.flatMap(building => building.outputSlots || []),
      ...site.belts.map(belt => belt.item).filter(Boolean),
    ]
      .map(item => /^unidentified-.+-(\d+)$/.exec(item.id || ''))
      .filter(Boolean)
      .map(match => Number(match[1]));
    site.nextFossilId = Math.max(0, ...existingIds) + 1;
  }

  state.version = GAME_STATE_VERSION;
  migrateLegacyWorldFields(state);
  return normalizeState(state);
}

function migrateLegacyWorldFields(state) {
  if (!Array.isArray(state.sites)) {
    return;
  }
  for (const site of state.sites) {
    if (!Object.hasOwn(site, 'exploredChunks')) {
      site.exploredChunks = {};
    }
    if (
      site.resources &&
      typeof site.resources === 'object' &&
      !Array.isArray(site.resources) &&
      !Object.hasOwn(site.resources, 'copper')
    ) {
      site.resources.copper = 0;
    }
  }
}

function migrateVersionTwoState(previousState) {
  if (!previousState || typeof previousState !== 'object' || Array.isArray(previousState)) {
    failInvalidSave('version 2 game state is malformed');
  }
  return structuredClone(previousState);
}

function openDatabase() {
  if (!globalThis.indexedDB) {
    return Promise.reject(new Error('IndexedDB is unavailable; this browser cannot save the factory.'));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error(`Unable to open factory save database: ${request.error?.message || 'unknown error'}`));
    request.onblocked = () => reject(new Error('Factory save database upgrade is blocked by another open game tab.'));
  });
}

function saveError(error) {
  return new Error(`Unable to save factory: ${error?.message || 'unknown IndexedDB error'}`);
}

export async function saveGame(state) {
  validateState(state);
  const record = {
    id: SAVE_ID,
    saveVersion: SAVE_VERSION,
    savedAt: Date.now(),
    state: structuredClone(state),
  };
  const database = await openDatabase();

  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(record);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error('save transaction aborted'));
    });
  } catch (error) {
    throw saveError(error);
  } finally {
    database.close();
  }
}

export async function loadGame() {
  const database = await openDatabase();
  let record;

  try {
    record = await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).get(SAVE_ID);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      transaction.onabort = () => reject(transaction.error || new Error('load transaction aborted'));
    });
  } catch (error) {
    throw new Error(`Unable to load factory save: ${error?.message || 'unknown IndexedDB error'}`);
  } finally {
    database.close();
  }

  if (record === undefined) {
    return null;
  }
  if (
    !record ||
    record.id !== SAVE_ID ||
    !Number.isSafeInteger(record.saveVersion) ||
    !record.state
  ) {
    failInvalidSave('save envelope is malformed');
  }

  if (record.saveVersion === 1) {
    const migrated = migrateVersionOneState(record.state);
    validateState(migrated);
    return withSaveTimestamp(migrated, record.savedAt);
  }
  if (record.saveVersion === 2) {
    if (!Number.isSafeInteger(record.savedAt) || record.savedAt < 0) {
      failInvalidSave('save timestamp is invalid');
    }
    const migrated = migrateVersionTwoState(record.state);
    migrateLegacyWorldFields(migrated);
    validateState(migrated);
    return withSaveTimestamp(normalizeState(migrated), record.savedAt);
  }
  if (record.saveVersion !== SAVE_VERSION) {
    failInvalidSave(`save version ${record.saveVersion} is not supported`);
  }

  validateState(record.state);
  if (!Number.isSafeInteger(record.savedAt) || record.savedAt < 0) {
    failInvalidSave('save timestamp is invalid');
  }
  return withSaveTimestamp(normalizeState(record.state), record.savedAt);
}
