import { createSite, tickSite } from './game-core.js';
import { FOSSIL_FAMILIES } from './fossils.js';

const MAX_INACTIVE_CATCHUP_SECONDS = 6 * 60 * 60;
const SIMULATION_CHUNK_SECONDS = 300;
const FOUNDING_COST = { iron: 10, stone: 10 };

export const SITE_DEFINITIONS = [
  {
    id: 'granite-reach',
    name: 'Granite Reach',
    depth: 2,
    foundingCost: FOUNDING_COST,
    startingResources: {
      coal: 8,
      iron: 10,
      stone: 12,
      sediment: 8,
      copper: 0,
      steel: 0,
      concrete: 0,
      power: 0,
    },
    resourceNodes: [
      { id: 'node-coal', resource: 'coal', x: -8, y: 4, remaining: 100 },
      { id: 'node-iron', resource: 'iron', x: 8, y: 4, remaining: 100 },
      { id: 'node-stone', resource: 'stone', x: 4, y: -8, remaining: 100 },
      { id: 'node-sediment', resource: 'sediment', x: -4, y: -8, remaining: 100 },
      { id: 'node-copper', resource: 'copper', x: 8, y: -8, remaining: 100 },
      {
        id: 'node-fossils',
        resource: 'fragment',
        x: 0,
        y: 8,
        families: [FOSSIL_FAMILIES[0], FOSSIL_FAMILIES[2]],
        remaining: 100,
      },
    ],
  },
];

function currentSite(state) {
  return state?.sites?.find(site => site.id === state.activeSiteId);
}

function hasFoundingMaterials(site, cost) {
  return Object.entries(cost).every(([resource, amount]) =>
    Number.isFinite(site.resources[resource]) && site.resources[resource] >= amount
  );
}

export function foundSite(state, siteDefinitionId) {
  const definition = SITE_DEFINITIONS.find(site => site.id === siteDefinitionId);
  if (!definition) {
    return { ok: false, reason: 'unknown site' };
  }
  if (!state || !Array.isArray(state.sites) || state.sites.some(site => site.id === definition.id)) {
    return { ok: false, reason: 'site already founded' };
  }

  const active = currentSite(state);
  if (!active) {
    return { ok: false, reason: 'unknown active site' };
  }
  if (!hasFoundingMaterials(active, definition.foundingCost)) {
    return { ok: false, reason: 'insufficient resources' };
  }

  for (const [resource, amount] of Object.entries(definition.foundingCost)) {
    active.resources[resource] -= amount;
  }

  const site = createSite({
    id: definition.id,
    name: definition.name,
    depth: definition.depth,
    startingResources: definition.startingResources,
    resourceNodes: structuredClone(definition.resourceNodes),
  });
  state.sites.push(site);
  state.museum[site.id] = site.museum.displayed;
  return { ok: true, site };
}

export function switchSite(state, siteId) {
  const site = state?.sites?.find(candidate => candidate.id === siteId);
  if (!site) {
    return { ok: false, reason: 'unknown site' };
  }

  state.activeSiteId = site.id;
  state.site = site;
  state.resources = site.resources;
  state.fragments = site.fragments;
  state.unidentifiedFossils = site.unidentifiedFossils;
  state.museum[site.id] = site.museum.displayed;
  return { ok: true, site };
}

export function simulateInactiveSite(site, elapsedSeconds) {
  if (!site || !Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) {
    throw new RangeError('site and a finite non-negative elapsedSeconds are required');
  }

  const events = { produced: [], consumed: [], blocked: [] };
  let remaining = Math.min(elapsedSeconds, MAX_INACTIVE_CATCHUP_SECONDS);
  while (remaining > 0) {
    const step = Math.min(remaining, SIMULATION_CHUNK_SECONDS);
    const chunkEvents = tickSite(site, step);
    events.produced.push(...chunkEvents.produced);
    events.consumed.push(...chunkEvents.consumed);
    for (const blocked of chunkEvents.blocked) {
      if (!events.blocked.some(event =>
        event.machineId === blocked.machineId && event.reason === blocked.reason
      )) {
        events.blocked.push(blocked);
      }
    }
    remaining -= step;
  }
  return events;
}

export function catchUpSite(site, currentTime = Date.now(), fallbackLastSimulatedAt = currentTime) {
  if (
    !site ||
    !Number.isSafeInteger(currentTime) ||
    currentTime < 0 ||
    !Number.isSafeInteger(fallbackLastSimulatedAt) ||
    fallbackLastSimulatedAt < 0
  ) {
    throw new RangeError('site and valid catch-up timestamps are required');
  }

  const lastSimulatedAt = Number.isSafeInteger(site.lastSimulatedAt) && site.lastSimulatedAt >= 0
    ? site.lastSimulatedAt
    : fallbackLastSimulatedAt;
  const elapsedSeconds = Math.max(0, (currentTime - lastSimulatedAt) / 1000);
  const events = simulateInactiveSite(site, elapsedSeconds);
  site.lastSimulatedAt = currentTime;
  return { elapsedSeconds, events };
}

export function catchUpActiveSite(state, currentTime = Date.now()) {
  const site = currentSite(state);
  if (!site) {
    throw new RangeError('state must have an active site to resume');
  }
  return catchUpSite(site, currentTime);
}
