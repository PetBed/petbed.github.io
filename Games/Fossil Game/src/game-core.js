import { RECIPES, EXCAVATOR_CYCLE_SECONDS, EXCAVATOR_POWER } from './recipes.js';
import { tickLogistics } from './logistics.js';
import { FOSSIL_FAMILIES, createUnidentifiedFossilItem } from './fossils.js';

export { FOSSIL_FAMILIES } from './fossils.js';

const MAX_SIMULATION_STEPS_PER_CALL = 300;
const DEFAULT_OUTPUT_CAPACITY = 4;

const MACHINE_COSTS = {
  digger: { steel: 35, concrete: 20 },
  smelter: { steel: 60, concrete: 30 },
  crusher: { steel: 80, concrete: 40 },
  generator: { steel: 40, concrete: 25 },
};

const INITIAL_RESOURCES = {
  coal: 12,
  iron: 16,
  copper: 0,
  stone: 20,
  sediment: 16,
  steel: 0,
  concrete: 0,
  power: 0,
};
const INITIAL_FRAGMENTS = {
  trilobite: 0,
  pterosaur: 0,
  fish: 0,
  fern: 0,
};

export function createSite({
  id = 'site-1',
  name = 'Basalt Basin',
  depth = 1,
  startingResources = INITIAL_RESOURCES,
  resourceNodes = null,
} = {}) {
  const resources = { ...startingResources };
  const fragments = { ...INITIAL_FRAGMENTS };
  const museumDisplay = [null];
  const unidentifiedFossils = [];
  const isStartingSite = id === 'site-1';
  const buildingId = suffix => isStartingSite ? `building-${suffix}` : `${id}-building-${suffix}`;
  const siteResourceNodes = resourceNodes || [
    { id: 'node-coal', resource: 'coal', x: -8, y: 4, remaining: 100 },
    { id: 'node-iron', resource: 'iron', x: 8, y: 4, remaining: 100 },
    { id: 'node-stone', resource: 'stone', x: 4, y: -8, remaining: 100 },
    { id: 'node-sediment', resource: 'sediment', x: -4, y: -8, remaining: 100 },
    { id: 'node-fossils', resource: 'fragment', x: 0, y: 8, families: FOSSIL_FAMILIES, remaining: 100 },
  ];

  return {
    id,
    name,
    depth,
    grid: {},
    resources,
    fragments,
    buildings: [
      {
        id: buildingId(1),
        type: 'excavator',
        x: -8,
        y: 4,
        rotation: 0,
        resourceNodeId: 'node-coal',
        inputSlots: [],
        outputSlots: [],
        progress: 0,
        outputCapacity: 4,
        requiresPower: false,
        powerReserved: false,
      },
      {
        id: buildingId(2),
        type: 'warehouse',
        x: 0,
        y: 0,
        rotation: 0,
        inputSlots: [],
        outputSlots: [],
        progress: 0,
      },
    ],
    belts: [],
    resourceNodes: siteResourceNodes,
    exploredChunks: {},
    unidentifiedFossils,
    museum: {
      slots: 1,
      displayed: museumDisplay,
      bonuses: { digSpeed: 0, output: 0 },
    },
    nextFossilId: 1,
    lastSimulatedAt: Date.now(),
  };
}

export function createInitialState() {
  const site = createSite();
  const resources = site.resources;
  const fragments = site.fragments;
  const collection = [];
  const museumDisplay = site.museum.displayed;
  const unidentifiedFossils = site.unidentifiedFossils;

  return {
    version: 1,
    activeSiteId: site.id,
    sites: [site],
    resources,
    fragments,
    fossils: collection,
    collection,
    unidentifiedFossils,
    machines: {
      digger: 1,
      smelter: 0,
      crusher: 0,
      generator: 0,
    },
    museum: {
      [site.id]: museumDisplay,
    },
    site,
    nextEntityId: 3,
    nextId: 1,
  };
}

function isInputMatch(item, requirement) {
  return item.type === requirement.type &&
    (requirement.resource === undefined || item.resource === requirement.resource) &&
    (requirement.family === undefined || requirement.family === '*' || item.family === requirement.family);
}

function itemAmount(item) {
  return item.amount === undefined ? 1 : item.amount;
}

function hasInputs(inputSlots, requirements) {
  return requirements.every(requirement => {
    const available = inputSlots
      .filter(item => isInputMatch(item, requirement))
      .reduce((sum, item) => sum + itemAmount(item), 0);
    return available >= requirement.amount;
  });
}

function consumeInputs(inputSlots, requirements) {
  const consumed = [];

  for (const requirement of requirements) {
    let remaining = requirement.amount;
    for (let index = 0; index < inputSlots.length && remaining > 0;) {
      const item = inputSlots[index];
      if (!isInputMatch(item, requirement)) {
        index += 1;
        continue;
      }

      const available = itemAmount(item);
      const amount = Math.min(available, remaining);
      consumed.push({ ...item, amount });
      remaining -= amount;

      if (amount === available) {
        inputSlots.splice(index, 1);
      } else {
        item.amount = available - amount;
        index += 1;
      }
    }
  }

  return consumed;
}

function addBlockedEvent(events, machineId, reason) {
  if (!events.blocked.some(event =>
    event.machineId === machineId && event.reason === reason
  )) {
    events.blocked.push({ machineId, reason });
  }
}

function hasOutputCapacity(building, recipe) {
  const itemOutputs = recipe.outputs.filter(output => output.type !== 'power').length;
  const capacity = building.outputCapacity || DEFAULT_OUTPUT_CAPACITY;
  return building.outputSlots.length + itemOutputs <= capacity;
}

function completeRecipe(site, building, recipe, events) {
  if (building.type === 'fossil-finisher') {
    const fossil = createUnidentifiedFossilItem(site);
    building.outputSlots.push(fossil);
    events.produced.push(fossil);
    building.progress = 0;
    building.pendingOutputs = null;
    return;
  }

  for (const output of recipe.outputs) {
    if (output.type === 'power') {
      site.resources.power += output.amount;
      events.produced.push({ type: 'power', amount: output.amount });
      continue;
    }

    const item = { ...output };
    building.outputSlots.push(item);
    events.produced.push(item);
  }

  building.progress = 0;
  building.pendingOutputs = null;
}

function advanceRecipeMachine(site, building, events) {
  const recipe = RECIPES[building.type];
  if (!recipe) {
    return;
  }

  if (building.progress === 0 && !building.pendingOutputs) {
    if (!hasInputs(building.inputSlots, recipe.inputs)) {
      addBlockedEvent(events, building.id, 'missing inputs');
      return;
    }
    if (site.resources.power < recipe.power) {
      addBlockedEvent(events, building.id, 'insufficient power');
      return;
    }
    if (!hasOutputCapacity(building, recipe)) {
      addBlockedEvent(events, building.id, 'output full');
      return;
    }

    events.consumed.push(...consumeInputs(building.inputSlots, recipe.inputs));
    site.resources.power -= recipe.power;
    building.pendingOutputs = recipe.outputs.map(output => ({ ...output }));
  }

  building.progress += 1;
  if (building.progress >= recipe.duration) {
    completeRecipe(site, building, recipe, events);
  }
}

function findResourceNode(site, building) {
  if (building.resourceNodeId) {
    return site.resourceNodes.find(node => node.id === building.resourceNodeId);
  }
  const node = site.resourceNodes.find(candidate =>
    candidate.x === building.x && candidate.y === building.y
  );
  if (node) {
    building.resourceNodeId = node.id;
  }
  return node;
}

function randomFamily(families, rng) {
  const roll = rng();
  if (!Number.isFinite(roll) || roll < 0 || roll >= 1) {
    throw new RangeError('rng must return a number between 0 and 1');
  }
  return families[Math.floor(roll * families.length)];
}

function advanceExcavator(site, building, events, rng) {
  const node = findResourceNode(site, building);
  if (!node) {
    addBlockedEvent(events, building.id, 'no resource node');
    return;
  }
  if (node.remaining <= 0) {
    addBlockedEvent(events, building.id, 'resource depleted');
    return;
  }
  if (building.outputSlots.length >= (building.outputCapacity || DEFAULT_OUTPUT_CAPACITY)) {
    addBlockedEvent(events, building.id, 'output full');
    return;
  }

  if (building.requiresPower !== false && !building.powerReserved) {
    if (site.resources.power < EXCAVATOR_POWER) {
      addBlockedEvent(events, building.id, 'insufficient power');
      return;
    }
    site.resources.power -= EXCAVATOR_POWER;
    building.powerReserved = true;
  }

  building.progress += 1 + (site.museum?.bonuses?.digSpeed || 0);
  if (building.progress < EXCAVATOR_CYCLE_SECONDS) {
    return;
  }

  building.progress -= EXCAVATOR_CYCLE_SECONDS;
  building.powerReserved = false;
  node.remaining -= 1;
  const item = node.resource === 'fragment'
    ? { type: 'fragment', family: randomFamily(node.families, rng), amount: 1 }
    : { type: 'resource', resource: node.resource, amount: 1 };
  building.outputSlots.push(item);
  events.produced.push(item);
}

function advanceSiteOneSecond(site, rng, events) {
  for (const building of site.buildings) {
    if (building.type === 'excavator') {
      advanceExcavator(site, building, events, rng);
    }
  }

  for (const building of site.buildings) {
    if (building.type === 'generator') {
      advanceRecipeMachine(site, building, events);
    }
  }

  for (const building of site.buildings) {
    if (building.type !== 'generator' && building.type !== 'excavator') {
      advanceRecipeMachine(site, building, events);
    }
  }

  tickLogistics(site, 1);
}

export function tickSite(site, deltaSeconds, rng = Math.random) {
  if (!site || !Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
    throw new RangeError('site and a finite non-negative deltaSeconds are required');
  }

  const events = { produced: [], consumed: [], blocked: [] };
  const accumulated = (site.simulationAccumulator || 0) + deltaSeconds;
  let steps = Math.min(
    MAX_SIMULATION_STEPS_PER_CALL,
    Math.floor(accumulated + 1e-9)
  );
  site.simulationAccumulator = Math.max(0, accumulated - steps);

  while (steps > 0) {
    advanceSiteOneSecond(site, rng, events);
    steps -= 1;
  }

  return events;
}

export function advanceSiteFrame(site, frameTime, previousFrameTime, wallClockTime = Date.now()) {
  if (
    !site ||
    !Number.isFinite(frameTime) ||
    !Number.isFinite(previousFrameTime) ||
    !Number.isSafeInteger(wallClockTime) ||
    wallClockTime < 0
  ) {
    throw new RangeError('site and valid frame timestamps are required');
  }

  const deltaSeconds = Math.max(0, (frameTime - previousFrameTime) / 1000);
  const events = tickSite(site, deltaSeconds);
  site.lastSimulatedAt = Math.max(
    0,
    Math.floor(wallClockTime - (site.simulationAccumulator || 0) * 1000)
  );
  return events;
}

export function dig(state, rng = Math.random) {
  const bonus = Math.max(1, state.machines.digger || 1);

  state.resources.stone += Math.round(3 * bonus);
  state.resources.sediment += Math.round(2 * bonus);
  state.resources.coal += Math.round(1.5 * bonus);
  state.resources.iron += Math.round(1 * bonus);

  const batch = {};

  for (const family of FOSSIL_FAMILIES) {
    const amount = Math.max(0, Math.round((rng() * 2 + 0.5) * state.site.depth));
    if (amount > 0) {
      state.fragments[family] += amount;
      batch[family] = amount;
    } else {
      batch[family] = 0;
    }
  }

  return {
    resources: state.resources,
    fragments: state.fragments,
    batch,
  };
}

export function buyMachine(state, machineId, rng = Math.random) {
  const cost = MACHINE_COSTS[machineId];
  if (!cost) {
    throw new Error(`Unknown machine: ${machineId}`);
  }

  if (
    state.resources.steel < cost.steel ||
    state.resources.concrete < cost.concrete
  ) {
    return { ...state, purchased: false, reason: 'insufficient resources' };
  }

  state.resources.steel -= cost.steel;
  state.resources.concrete -= cost.concrete;
  state.machines[machineId] = (state.machines[machineId] || 0) + 1;

  if (machineId === 'generator') {
    state.resources.power += 12 + Math.round(rng() * 10);
  }

  return { ...state, purchased: true };
}

export function processFragments() {
  return {
    completed: [],
    processed: 0,
    reason: 'use a physical fossil finisher and open its unidentified output',
  };
}
