import {
  BELT_COST,
  BUILDING_DEFINITIONS,
  getBuildingFootprint,
} from './buildings.js';
import { FOSSIL_FAMILIES } from './fossils.js';

const VALID_ROTATIONS = new Set([0, 90, 180, 270]);
const VALID_DIRECTIONS = new Set(['north', 'east', 'south', 'west']);
const EXPLORATION_CHUNK_SIZE = 24;
const MINERAL_RESOURCES = ['coal', 'iron', 'copper', 'stone', 'sediment'];

function activeSite(state) {
  return state.sites.find(site => site.id === state.activeSiteId);
}

function intersects(first, second) {
  return first.left <= second.right &&
    first.right >= second.left &&
    first.top <= second.bottom &&
    first.bottom >= second.top;
}

function isOccupied(site, footprint) {
  if (site.belts.some(belt =>
    belt.x >= footprint.left &&
    belt.x <= footprint.right &&
    belt.y >= footprint.top &&
    belt.y <= footprint.bottom
  )) {
    return true;
  }

  return site.buildings.some(building =>
    intersects(getBuildingFootprint(building), footprint)
  );
}

function chunkHash(siteId, chunkX, chunkY, salt = 0) {
  let value = 2166136261;
  for (const character of siteId) {
    value = Math.imul(value ^ character.charCodeAt(0), 16777619);
  }
  value = Math.imul(value ^ chunkX, 16777619);
  value = Math.imul(value ^ chunkY, 16777619);
  return Math.imul(value ^ salt, 16777619) >>> 0;
}

function findChunkTile(site, chunkX, chunkY, seed) {
  const tileCount = EXPLORATION_CHUNK_SIZE ** 2;
  const start = seed % tileCount;

  for (let offset = 0; offset < tileCount; offset += 1) {
    const index = (start + offset) % tileCount;
    const x = chunkX * EXPLORATION_CHUNK_SIZE + index % EXPLORATION_CHUNK_SIZE;
    const y = chunkY * EXPLORATION_CHUNK_SIZE + Math.floor(index / EXPLORATION_CHUNK_SIZE);
    const footprint = { left: x, right: x, top: y, bottom: y };
    if (
      !isOccupied(site, footprint) &&
      !site.resourceNodes.some(node => node.x === x && node.y === y)
    ) {
      return { x, y };
    }
  }

  return null;
}

export function exploreSite(state, bounds) {
  const site = activeSite(state);
  if (!site) {
    return [];
  }
  if (
    !bounds ||
    !['left', 'top', 'right', 'bottom'].every(key => Number.isSafeInteger(bounds[key])) ||
    bounds.left > bounds.right ||
    bounds.top > bounds.bottom
  ) {
    throw new RangeError('exploration bounds must be ordered integer world coordinates');
  }

  if (!site.exploredChunks || typeof site.exploredChunks !== 'object' || Array.isArray(site.exploredChunks)) {
    site.exploredChunks = {};
  }

  const firstChunkX = Math.floor(bounds.left / EXPLORATION_CHUNK_SIZE);
  const lastChunkX = Math.floor(bounds.right / EXPLORATION_CHUNK_SIZE);
  const firstChunkY = Math.floor(bounds.top / EXPLORATION_CHUNK_SIZE);
  const lastChunkY = Math.floor(bounds.bottom / EXPLORATION_CHUNK_SIZE);
  const generated = [];

  for (let chunkY = firstChunkY; chunkY <= lastChunkY; chunkY += 1) {
    for (let chunkX = firstChunkX; chunkX <= lastChunkX; chunkX += 1) {
      const chunkKey = `${chunkX},${chunkY}`;
      if (site.exploredChunks[chunkKey]) {
        continue;
      }
      site.exploredChunks[chunkKey] = true;

      const seed = chunkHash(site.id, chunkX, chunkY);
      const mineral = findChunkTile(site, chunkX, chunkY, seed);
      if (mineral) {
        const node = {
          id: `node-${site.id}-${chunkX}-${chunkY}-mineral`,
          resource: MINERAL_RESOURCES[seed % MINERAL_RESOURCES.length],
          ...mineral,
          remaining: 100,
        };
        site.resourceNodes.push(node);
        generated.push(node);
      }

      const fragmentTile = findChunkTile(site, chunkX, chunkY, chunkHash(site.id, chunkX, chunkY, 1));
      if (fragmentTile) {
        const families = site.resourceNodes.find(node => node.resource === 'fragment')?.families || FOSSIL_FAMILIES;
        const node = {
          id: `node-${site.id}-${chunkX}-${chunkY}-fossil`,
          resource: 'fragment',
          ...fragmentTile,
          families: [...families],
          remaining: 100,
        };
        site.resourceNodes.push(node);
        generated.push(node);
      }
    }
  }

  return generated;
}

function canPay(resources, cost) {
  return Object.entries(cost).every(([resource, amount]) =>
    Number.isFinite(resources[resource]) && resources[resource] >= amount
  );
}

function pay(resources, cost) {
  for (const [resource, amount] of Object.entries(cost)) {
    resources[resource] -= amount;
  }
}

function nextId(state, prefix) {
  const id = `${prefix}-${state.nextEntityId}`;
  state.nextEntityId += 1;
  return id;
}

export function placeBuilding(state, buildingId, x, y, rotation = 0) {
  const definition = BUILDING_DEFINITIONS[buildingId];
  const site = activeSite(state);

  if (!site) {
    return { ok: false, reason: 'no active site' };
  }
  if (!definition) {
    return { ok: false, reason: `unknown building: ${buildingId}` };
  }
  if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y)) {
    return { ok: false, reason: 'coordinates must be integers' };
  }
  if (!VALID_ROTATIONS.has(rotation)) {
    return { ok: false, reason: 'invalid rotation' };
  }

  const footprint = getBuildingFootprint({ type: buildingId, x, y, rotation });
  if (isOccupied(site, footprint)) {
    return { ok: false, reason: 'occupied tiles' };
  }
  if (!canPay(site.resources, definition.cost)) {
    return { ok: false, reason: 'insufficient resources' };
  }

  pay(site.resources, definition.cost);
  const building = {
    id: nextId(state, 'building'),
    type: buildingId,
    x,
    y,
    rotation,
    inputSlots: [],
    outputSlots: [],
    progress: 0,
    ...(buildingId === 'excavator' ? { requiresPower: true, powerReserved: false } : {}),
    outputDirections: buildingId === 'splitter' ? ['east', 'south'] : undefined,
    lastOutputIndex: 0,
  };

  site.buildings.push(building);
  return { ok: true };
}

export function placeBelt(state, x, y, direction) {
  const site = activeSite(state);

  if (!site) {
    return { ok: false, reason: 'no active site' };
  }
  if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y)) {
    return { ok: false, reason: 'coordinates must be integers' };
  }
  if (!VALID_DIRECTIONS.has(direction)) {
    return { ok: false, reason: 'invalid direction' };
  }
  if (isOccupied(site, { left: x, right: x, top: y, bottom: y })) {
    return { ok: false, reason: 'occupied tile' };
  }
  if (!canPay(site.resources, BELT_COST)) {
    return { ok: false, reason: 'insufficient resources' };
  }

  pay(site.resources, BELT_COST);
  site.belts.push({
    id: nextId(state, 'belt'),
    type: 'belt',
    x,
    y,
    direction,
    item: null,
    progress: 0,
  });

  return { ok: true };
}
