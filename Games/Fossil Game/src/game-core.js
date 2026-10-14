import { RECIPES, EXCAVATOR_CYCLE_SECONDS } from './recipes.js';
import { tickLogistics } from './logistics.js';

export const FOSSIL_FAMILIES = ['trilobite', 'pterosaur', 'fish', 'fern'];
export const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

const MAX_SIMULATION_STEPS_PER_CALL = 300;
const DEFAULT_OUTPUT_CAPACITY = 4;

const MACHINE_COSTS = {
  digger: { steel: 35, concrete: 20 },
  smelter: { steel: 60, concrete: 30 },
  crusher: { steel: 80, concrete: 40 },
  generator: { steel: 40, concrete: 25 },
};

export function createInitialState() {
  const resources = {
    coal: 12,
    iron: 16,
    stone: 20,
    sediment: 16,
    steel: 0,
    concrete: 0,
    power: 0,
  };
  const fragments = {
    trilobite: 0,
    pterosaur: 0,
    fish: 0,
    fern: 0,
  };
  const collection = [];
  const museumDisplay = [];
  const unidentifiedFossils = [];
  const site = {
    id: 'site-1',
    name: 'Basalt Basin',
    depth: 1,
    grid: {},
    resources,
    fragments,
    buildings: [
      {
        id: 'building-1',
        type: 'excavator',
        x: -8,
        y: 4,
        rotation: 0,
        resourceNodeId: 'node-coal',
        inputSlots: [],
        outputSlots: [],
        progress: 0,
        outputCapacity: 4,
      },
      {
        id: 'building-2',
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
    resourceNodes: [
      { id: 'node-coal', resource: 'coal', x: -8, y: 4, remaining: 100 },
      { id: 'node-iron', resource: 'iron', x: 8, y: 4, remaining: 100 },
      { id: 'node-stone', resource: 'stone', x: 4, y: -8, remaining: 100 },
      { id: 'node-sediment', resource: 'sediment', x: -4, y: -8, remaining: 100 },
      { id: 'node-fossils', resource: 'fragment', x: 0, y: 8, families: FOSSIL_FAMILIES, remaining: 100 },
    ],
    unidentifiedFossils,
    museum: {
      slots: 1,
      displayed: museumDisplay,
    },
  };

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

  building.progress += 1;
  if (building.progress < EXCAVATOR_CYCLE_SECONDS) {
    return;
  }

  building.progress -= EXCAVATOR_CYCLE_SECONDS;
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

function weightedChoice(entries, rng) {
  const total = entries.reduce((sum, [, count]) => sum + Math.max(0, count), 0);
  if (total <= 0) {
    return null;
  }

  const threshold = rng() * total;
  let running = 0;

  for (const [key, count] of entries) {
    running += Math.max(0, count);
    if (running >= threshold) {
      return key;
    }
  }

  return entries[entries.length - 1][0];
}

function determineRarity(rng = Math.random) {
  const roll = rng();
  if (roll < 0.52) return 'common';
  if (roll < 0.78) return 'uncommon';
  if (roll < 0.92) return 'rare';
  if (roll < 0.98) return 'epic';
  return 'legendary';
}

export function processFragments(state, rng = Math.random) {
  const available = Object.entries(state.fragments).filter(([, count]) => count > 0);
  if (available.length === 0) {
    return { completed: [], processed: 0 };
  }

  const chosenFamily = weightedChoice(available, rng);
  if (!chosenFamily) {
    return { completed: [], processed: 0 };
  }

  let remaining = 4;
  const consumed = {};

  for (const [family, count] of available) {
    if (remaining <= 0) break;
    const take = Math.min(count, remaining);
    if (take > 0) {
      consumed[family] = take;
      remaining -= take;
    }
  }

  if (remaining > 0) {
    return { completed: [], processed: 0 };
  }

  for (const [family, count] of Object.entries(consumed)) {
    state.fragments[family] = Math.max(0, state.fragments[family] - count);
  }

  const rarity = determineRarity(rng);
  const fossil = {
    id: `fossil-${state.nextId++}`,
    family: chosenFamily,
    rarity,
    name: `${capitalize(chosenFamily)} ${capitalize(rarity)}`,
    bonus: getBonusForRarity(rarity),
    createdAt: Date.now(),
  };

  state.fossils.push(fossil);
  state.museum['site-1'].push(fossil.id);

  return { completed: [fossil], processed: 1 };
}

function getBonusForRarity(rarity) {
  const bonusMap = {
    common: { digSpeed: 0.02, output: 0.03 },
    uncommon: { digSpeed: 0.05, output: 0.06 },
    rare: { digSpeed: 0.08, output: 0.1 },
    epic: { digSpeed: 0.12, output: 0.12 },
    legendary: { digSpeed: 0.16, output: 0.18 },
  };

  return bonusMap[rarity] || bonusMap.common;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
