import { BELT_COST, BUILDING_DEFINITIONS } from './buildings.js';

const VALID_ROTATIONS = new Set([0, 90, 180, 270]);
const VALID_DIRECTIONS = new Set(['north', 'east', 'south', 'west']);

function activeSite(state) {
  return state.sites.find(site => site.id === state.activeSiteId);
}

function footprintAt(building, x, y, rotation) {
  const definition = BUILDING_DEFINITIONS[building.type];
  const swapsDimensions = rotation === 90 || rotation === 270;
  const width = swapsDimensions ? definition.height : definition.width;
  const height = swapsDimensions ? definition.width : definition.height;

  return {
    left: x,
    top: y,
    right: x + width - 1,
    bottom: y + height - 1,
  };
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
    intersects(footprintAt(building, building.x, building.y, building.rotation), footprint)
  );
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

  const footprint = footprintAt({ type: buildingId }, x, y, rotation);
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
