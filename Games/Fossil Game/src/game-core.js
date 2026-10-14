export const FOSSIL_FAMILIES = ['trilobite', 'pterosaur', 'fish', 'fern'];
export const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

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
    ],
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
    unidentifiedFossils: [],
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
    nextEntityId: 2,
    nextId: 1,
  };
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
