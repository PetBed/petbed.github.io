import {
  BELT_COST,
  BUILDING_DEFINITIONS,
  getBuildingFootprint,
} from './buildings.js';
import { FOSSIL_FAMILIES } from './fossils.js';

const VALID_ROTATIONS = new Set([0, 90, 180, 270]);
const VALID_DIRECTIONS = new Set(['north', 'east', 'south', 'west']);
const DIRECTION_ORDER = ['south', 'east', 'north', 'west'];
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

function tileHasBuilding(site, x, y) {
  return site.buildings.some(building => {
    const footprint = getBuildingFootprint(building);
    return x >= footprint.left && x <= footprint.right && y >= footprint.top && y <= footprint.bottom;
  });
}

function toTile(point, fallback = { x: 0, y: 0 }) {
  if (!point || typeof point !== 'object') {
    return fallback;
  }
  return { x: Number(point.x), y: Number(point.y) };
}

function normalizeCost(cost, resources) {
  if (!cost || typeof cost !== 'object' || Array.isArray(cost)) {
    return null;
  }
  const normalized = {};
  for (const [resource, amount] of Object.entries(cost)) {
    if (!Object.hasOwn(resources, resource) || !Number.isFinite(amount) || amount < 0) {
      return null;
    }
    normalized[resource] = amount;
  }
  return normalized;
}

function laneKey(x, y, direction) {
  return `${x},${y}:${direction}`;
}

function getBeltPlacementInfo(site, x, y, direction) {
  const sameDirection = site.belts.find(belt => belt.x === x && belt.y === y && belt.direction === direction);
  const crossing = site.belts.filter(belt => belt.x === x && belt.y === y && belt.direction !== direction);
  return { sameDirection, crossing, isCrossing: crossing.length > 0, isDuplicate: Boolean(sameDirection) };
}

export function isBuildingPlacementValid(state, buildingId, x, y, rotation = 0) {
  const site = activeSite(state);
  if (
    !site ||
    !BUILDING_DEFINITIONS[buildingId] ||
    !Number.isSafeInteger(x) ||
    !Number.isSafeInteger(y) ||
    !VALID_ROTATIONS.has(rotation)
  ) {
    return false;
  }

  return !isOccupied(site, getBuildingFootprint({ type: buildingId, x, y, rotation }));
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

function calcRemovalRefund(entity, fallbackCost) {
  return Object.hasOwn(entity, 'paidCost') ? entity.paidCost : fallbackCost;
}

// Seeded starters are the buildings createSite places before the player acts. They cost
// no materials, so removing one refunds nothing. Keep this list aligned with the seeded
// buildings: an id that no seeded building owns must not appear here, or the first
// player-placed building to take it would refund nothing.
const STARTER_BUILDING_SUFFIXES = [1, 2];

function findStarterBuilding(site, building) {
  // A recorded payment always wins: an entity the player bought was not a starter, even
  // when it holds an id the starter set once reserved.
  if (Object.hasOwn(building, 'paidCost')) {
    return false;
  }
  return STARTER_BUILDING_SUFFIXES.some(suffix =>
    building.id === `building-${suffix}` || building.id === `${site.id}-building-${suffix}`
  );
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

  if (!isBuildingPlacementValid(state, buildingId, x, y, rotation)) {
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
    paidCost: { ...definition.cost },
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

  const placement = getBeltPlacementInfo(site, x, y, direction);
  if (placement.isDuplicate) {
    return { ok: false, reason: 'duplicate belt lane' };
  }
  if (tileHasBuilding(site, x, y)) {
    return { ok: false, reason: 'occupied tile' };
  }

  const cost = placement.isCrossing ? {} : { ...BELT_COST };
  if (Object.keys(cost).length && !canPay(site.resources, cost)) {
    return { ok: false, reason: 'insufficient resources' };
  }

  if (Object.keys(cost).length) {
    pay(site.resources, cost);
  }

  site.belts.push({
    id: nextId(state, 'belt'),
    type: 'belt',
    x,
    y,
    direction,
    item: null,
    progress: 0,
    paidCost: { ...cost },
  });

  return { ok: true };
}

export function previewBeltRoute(state, start, end) {
  const site = activeSite(state);
  if (!site) {
    return { ok: false, reason: 'no active site' };
  }

  const startTile = toTile(start);
  const endTile = toTile(end);
  if (
    !Number.isSafeInteger(startTile.x) ||
    !Number.isSafeInteger(startTile.y) ||
    !Number.isSafeInteger(endTile.x) ||
    !Number.isSafeInteger(endTile.y)
  ) {
    return { ok: false, reason: 'route endpoints must be integer tiles' };
  }
  if (startTile.x === endTile.x && startTile.y === endTile.y) {
    return { ok: false, reason: 'route endpoints must differ' };
  }
  if (
    tileHasBuilding(site, startTile.x, startTile.y) ||
    tileHasBuilding(site, endTile.x, endTile.y) ||
    site.belts.some(belt =>
      (belt.x === startTile.x && belt.y === startTile.y) ||
      (belt.x === endTile.x && belt.y === endTile.y)
    )
  ) {
    return { ok: false, reason: 'route endpoints must be empty' };
  }

  const startKey = `${startTile.x},${startTile.y}`;
  const goalKey = `${endTile.x},${endTile.y}`;
  const heuristic = point => Math.abs(endTile.x - point.x) + Math.abs(endTile.y - point.y);
  const open = [{
    ...startTile,
    key: startKey,
    cost: 0,
    estimate: heuristic(startTile),
    order: 0,
  }];
  const bestCosts = new Map([[startKey, 0]]);
  const cameFrom = new Map();
  const settled = new Set();
  let nextOrder = 1;

  while (open.length > 0) {
    open.sort((first, second) =>
      first.estimate - second.estimate || first.order - second.order
    );
    const current = open.shift();
    if (settled.has(current.key)) {
      continue;
    }
    const currentKey = current.key;
    if (currentKey === goalKey) {
      break;
    }
    settled.add(currentKey);

    for (const direction of DIRECTION_ORDER) {
      const delta = {
        north: { x: 0, y: -1 },
        east: { x: 1, y: 0 },
        south: { x: 0, y: 1 },
        west: { x: -1, y: 0 },
      }[direction];
      const next = { x: current.x + delta.x, y: current.y + delta.y };
      const nextKey = `${next.x},${next.y}`;
      if (settled.has(nextKey)) {
        continue;
      }
      if (tileHasBuilding(site, next.x, next.y)) {
        continue;
      }
      if (!Number.isSafeInteger(next.x) || !Number.isSafeInteger(next.y)) {
        continue;
      }
      const nextCost = current.cost + 1;
      if (bestCosts.has(nextKey) && bestCosts.get(nextKey) <= nextCost) {
        continue;
      }
      bestCosts.set(nextKey, nextCost);
      cameFrom.set(nextKey, currentKey);
      open.push({
        ...next,
        key: nextKey,
        cost: nextCost,
        estimate: nextCost + heuristic(next),
        order: nextOrder,
      });
      nextOrder += 1;
    }
  }

  if (!cameFrom.has(goalKey)) {
    return { ok: false, reason: 'no valid route' };
  }

  const path = [endTile];
  let cursor = goalKey;
  while (cursor !== startKey) {
    const previous = cameFrom.get(cursor);
    if (!previous) {
      return { ok: false, reason: 'route reconstruction failed' };
    }
    cursor = previous;
    path.push({
      x: Number(cursor.split(',')[0]),
      y: Number(cursor.split(',')[1]),
    });
  }
  path.reverse();

  const route = path.map((tile, index) => {
    const from = index < path.length - 1 ? tile : path[index - 1];
    const to = index < path.length - 1 ? path[index + 1] : tile;
    const direction = to.x > from.x
      ? 'east'
      : to.x < from.x
        ? 'west'
        : to.y > from.y
          ? 'south'
          : 'north';
    const existing = site.belts.find(belt =>
      belt.x === tile.x && belt.y === tile.y && belt.direction === direction
    );
    const crossing = site.belts.some(belt =>
      belt.x === tile.x && belt.y === tile.y && belt.direction !== direction
    );
    return {
      ...tile,
      direction,
      kind: existing ? 'reuse' : crossing ? 'crossing' : 'new',
    };
  });

  const cost = { iron: route.filter(step => step.kind === 'new').length };
  const availableIron = Number.isFinite(site.resources.iron) ? site.resources.iron : 0;
  let remainingIron = availableIron;
  const buildable = [];
  for (const step of route) {
    if (step.kind === 'new') {
      if (remainingIron < 1) {
        break;
      }
      remainingIron -= 1;
    }
    buildable.push(step);
  }
  const buildableCost = { iron: buildable.filter(step => step.kind === 'new').length };

  return {
    ok: true,
    route,
    buildableRoute: buildable,
    cost,
    complete: buildable.length === route.length,
    affordable: availableIron >= cost.iron,
    remaining: Math.max(0, cost.iron - buildableCost.iron),
  };
}

export function placeBeltRoute(state, start, end) {
  const site = activeSite(state);
  if (!site) {
    return { ok: false, reason: 'no active site' };
  }

  const preview = previewBeltRoute(state, start, end);
  if (!preview.ok) {
    return preview;
  }

  const buildableRoute = preview.buildableRoute || preview.route;
  const paid = { iron: buildableRoute.filter(step => step.kind === 'new').length };

  if (
    !Object.entries(paid).every(([resource, amount]) =>
      Number.isFinite(site.resources[resource]) && site.resources[resource] >= amount
    )
  ) {
    return { ok: false, reason: 'insufficient resources' };
  }

  if (paid.iron > 0) {
    pay(site.resources, paid);
  }

  for (const step of buildableRoute) {
    const existing = site.belts.find(belt => belt.x === step.x && belt.y === step.y && belt.direction === step.direction);
    if (existing) {
      continue;
    }
    site.belts.push({
      id: nextId(state, 'belt'),
      type: 'belt',
      x: step.x,
      y: step.y,
      direction: step.direction,
      item: null,
      progress: 0,
      paidCost: step.kind === 'new' ? { iron: 1 } : {},
    });
  }

  return {
    ok: true,
    placed: buildableRoute.length,
    reused: buildableRoute.filter(step => step.kind === 'reuse').length,
    cost: paid,
    remaining: Math.max(0, preview.cost.iron - paid.iron),
  };
}

export function getGridLineTiles(start, end) {
  if (
    !start || !end ||
    !Number.isSafeInteger(start.x) || !Number.isSafeInteger(start.y) ||
    !Number.isSafeInteger(end.x) || !Number.isSafeInteger(end.y)
  ) {
    throw new RangeError('grid line endpoints must be integer world coordinates');
  }

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const nx = Math.abs(dx);
  const ny = Math.abs(dy);
  const stepX = Math.sign(dx);
  const stepY = Math.sign(dy);
  let x = start.x;
  let y = start.y;
  let ix = 0;
  let iy = 0;
  const tiles = [{ x, y }];

  while (ix < nx || iy < ny) {
    const decision = (1 + 2 * ix) * ny - (1 + 2 * iy) * nx;
    if (decision === 0) {
      tiles.push({ x: x + stepX, y });
      tiles.push({ x, y: y + stepY });
      x += stepX;
      y += stepY;
      ix += 1;
      iy += 1;
    } else if (decision < 0) {
      x += stepX;
      ix += 1;
    } else {
      y += stepY;
      iy += 1;
    }
    tiles.push({ x, y });
  }

  return tiles;
}

function prepareItemReturns(site, items) {
  const resourceReturns = {};
  const fragmentReturns = {};
  const fossils = [];
  let returnedItems = 0;

  for (const item of items) {
    if (item === null) {
      continue;
    }
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { ok: false, reason: 'unsupported held item' };
    }

    const amount = item.amount === undefined ? 1 : item.amount;
    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, reason: 'invalid held item amount' };
    }
    if (item.type === 'resource' && Object.hasOwn(site.resources, item.resource)) {
      resourceReturns[item.resource] = (resourceReturns[item.resource] || 0) + amount;
      returnedItems += amount;
    } else if (item.type === 'fragment' && Object.hasOwn(site.fragments, item.family)) {
      fragmentReturns[item.family] = (fragmentReturns[item.family] || 0) + amount;
      returnedItems += amount;
    } else if (item.type === 'unidentified-fossil' && Array.isArray(site.unidentifiedFossils)) {
      fossils.push(item);
      returnedItems += 1;
    } else {
      return { ok: false, reason: 'unsupported held item' };
    }
  }

  return {
    ok: true,
    resourceReturns,
    fragmentReturns,
    fossils,
    returnedItems,
  };
}

function prepareRemovalPlan(site, entity, fallbackCost, refundFree = false, items = []) {
  const rawRefund = refundFree ? {} : calcRemovalRefund(entity, fallbackCost);
  const refund = normalizeCost(rawRefund, site.resources);
  if (!refund) {
    return { ok: false, reason: 'invalid paid cost' };
  }

  const itemReturns = prepareItemReturns(site, items);
  if (!itemReturns.ok) {
    return itemReturns;
  }

  const resourceReturns = { ...refund };
  for (const [resource, amount] of Object.entries(itemReturns.resourceReturns)) {
    resourceReturns[resource] = (resourceReturns[resource] || 0) + amount;
  }
  for (const [resource, amount] of Object.entries(resourceReturns)) {
    if (!Number.isFinite(site.resources[resource] + amount)) {
      return { ok: false, reason: 'inventory total is invalid' };
    }
  }
  for (const [family, amount] of Object.entries(itemReturns.fragmentReturns)) {
    if (!Number.isFinite(site.fragments[family] + amount)) {
      return { ok: false, reason: 'inventory total is invalid' };
    }
  }

  return {
    ok: true,
    refunded: refund,
    resourceReturns,
    fragmentReturns: itemReturns.fragmentReturns,
    fossils: itemReturns.fossils,
    returnedItems: itemReturns.returnedItems,
  };
}

function combineRemovalPlans(site, plans) {
  const combined = {
    refunded: {},
    resourceReturns: {},
    fragmentReturns: {},
    fossils: [],
    returnedItems: 0,
  };
  for (const plan of plans) {
    for (const [resource, amount] of Object.entries(plan.refunded)) {
      combined.refunded[resource] = (combined.refunded[resource] || 0) + amount;
    }
    for (const [resource, amount] of Object.entries(plan.resourceReturns)) {
      combined.resourceReturns[resource] = (combined.resourceReturns[resource] || 0) + amount;
    }
    for (const [family, amount] of Object.entries(plan.fragmentReturns)) {
      combined.fragmentReturns[family] = (combined.fragmentReturns[family] || 0) + amount;
    }
    combined.fossils.push(...plan.fossils);
    combined.returnedItems += plan.returnedItems;
  }

  for (const [resource, amount] of Object.entries(combined.resourceReturns)) {
    if (!Number.isFinite(site.resources[resource] + amount)) {
      return null;
    }
  }
  for (const [family, amount] of Object.entries(combined.fragmentReturns)) {
    if (!Number.isFinite(site.fragments[family] + amount)) {
      return null;
    }
  }
  return combined;
}

function applyRemovalPlan(site, plan) {
  for (const [resource, amount] of Object.entries(plan.resourceReturns)) {
    site.resources[resource] += amount;
  }
  for (const [family, amount] of Object.entries(plan.fragmentReturns)) {
    site.fragments[family] += amount;
  }
  site.unidentifiedFossils.push(...plan.fossils);
}

export function removeBuilding(state, buildingId) {
  const site = activeSite(state);
  if (!site) {
    return { ok: false, reason: 'no active site' };
  }

  const index = site.buildings.findIndex(building => building.id === buildingId);
  if (index === -1) {
    return { ok: false, reason: 'unknown building' };
  }

  const building = site.buildings[index];
  const plan = prepareRemovalPlan(
    site,
    building,
    BUILDING_DEFINITIONS[building.type]?.cost || {},
    findStarterBuilding(site, building),
    [...building.inputSlots, ...building.outputSlots]
  );
  if (!plan.ok) {
    return plan;
  }
  applyRemovalPlan(site, plan);
  site.buildings.splice(index, 1);
  return { ok: true, refunded: plan.refunded, returnedItems: plan.returnedItems };
}

export function removeBelt(state, beltId) {
  const site = activeSite(state);
  if (!site) {
    return { ok: false, reason: 'no active site' };
  }

  const index = site.belts.findIndex(belt => belt.id === beltId);
  if (index === -1) {
    return { ok: false, reason: 'unknown belt' };
  }

  const belt = site.belts[index];
  const plan = prepareRemovalPlan(site, belt, BELT_COST, false, [belt.item]);
  if (!plan.ok) {
    return plan;
  }
  applyRemovalPlan(site, plan);
  site.belts.splice(index, 1);
  return { ok: true, refunded: plan.refunded, returnedItems: plan.returnedItems };
}

export function removeBeltsAtTiles(state, tiles) {
  const site = activeSite(state);
  if (!site) {
    return { ok: false, reason: 'no active site' };
  }
  if (!Array.isArray(tiles)) {
    return { ok: false, reason: 'tiles must be an array' };
  }

  const targetKeys = new Set();
  for (const tile of tiles) {
    if (!tile || !Number.isSafeInteger(tile.x) || !Number.isSafeInteger(tile.y)) {
      return { ok: false, reason: 'tiles must contain integer coordinates' };
    }
    targetKeys.add(`${tile.x},${tile.y}`);
  }

  const selected = site.belts.filter(belt => targetKeys.has(`${belt.x},${belt.y}`));
  const plans = selected.map(belt => prepareRemovalPlan(site, belt, BELT_COST, false, [belt.item]));
  const invalid = plans.find(plan => !plan.ok);
  if (invalid) {
    return invalid;
  }
  const combined = combineRemovalPlans(site, plans);
  if (!combined) {
    return { ok: false, reason: 'inventory total is invalid' };
  }

  applyRemovalPlan(site, combined);
  const selectedIds = new Set(selected.map(belt => belt.id));
  site.belts = site.belts.filter(belt => !selectedIds.has(belt.id));
  return {
    ok: true,
    removed: selected.map(belt => belt.id),
    refunded: combined.refunded,
    returnedItems: combined.returnedItems,
  };
}

export function getBeltDirectionsAtTile(site, x, y) {
  return site.belts.filter(belt => belt.x === x && belt.y === y).map(belt => belt.direction);
}

export function isBeltRouteBlocked(site, x, y) {
  return tileHasBuilding(site, x, y) || site.belts.some(belt => belt.x === x && belt.y === y && belt.item !== null);
}
