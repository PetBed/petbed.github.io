export const FOSSIL_FAMILIES = ['trilobite', 'pterosaur', 'fish', 'fern'];

const RARITY_BONUSES = {
  common: { digSpeed: 0.02, output: 0.03 },
  uncommon: { digSpeed: 0.05, output: 0.06 },
  rare: { digSpeed: 0.08, output: 0.1 },
  epic: { digSpeed: 0.12, output: 0.12 },
  legendary: { digSpeed: 0.16, output: 0.18 },
};
const MUSEUM_EXPANSION_COST = { iron: 8, stone: 8 };
const FRAGMENTS_PER_FOSSIL = 4;
const DEFAULT_OUTPUT_CAPACITY = 4;

function findSite(state, siteId) {
  return state.sites.find(site => site.id === siteId);
}

function makeUnidentifiedFossilId(site) {
  const nextId = site.nextFossilId || 1;
  site.nextFossilId = nextId + 1;
  return `unidentified-${site.id}-${nextId}`;
}

export function createUnidentifiedFossilItem(site) {
  return {
    type: 'unidentified-fossil',
    id: makeUnidentifiedFossilId(site),
    createdAt: Date.now(),
  };
}

function matchesFragment(item) {
  return item.type === 'fragment' && FOSSIL_FAMILIES.includes(item.family);
}

function countFragments(inputSlots) {
  return inputSlots
    .filter(matchesFragment)
    .reduce((total, item) => total + (item.amount ?? 1), 0);
}

function consumeFragments(inputSlots, amount) {
  for (let index = 0; index < inputSlots.length && amount > 0;) {
    const item = inputSlots[index];
    if (!matchesFragment(item)) {
      index += 1;
      continue;
    }

    const available = item.amount ?? 1;
    const consumed = Math.min(available, amount);
    amount -= consumed;
    if (consumed === available) {
      inputSlots.splice(index, 1);
    } else {
      item.amount = available - consumed;
      index += 1;
    }
  }
}

export function finishFossil(site, finisher) {
  if (!site || !finisher || finisher.type !== 'fossil-finisher') {
    return { ok: false, reason: 'invalid fossil finisher' };
  }
  if (!Array.isArray(finisher.inputSlots) || !Array.isArray(finisher.outputSlots)) {
    return { ok: false, reason: 'invalid machine slots' };
  }
  if (countFragments(finisher.inputSlots) < FRAGMENTS_PER_FOSSIL) {
    return { ok: false, reason: 'missing inputs' };
  }
  if (finisher.outputSlots.length >= (finisher.outputCapacity || DEFAULT_OUTPUT_CAPACITY)) {
    return { ok: false, reason: 'output full' };
  }

  consumeFragments(finisher.inputSlots, FRAGMENTS_PER_FOSSIL);
  const item = createUnidentifiedFossilItem(site);
  finisher.outputSlots.push(item);
  return { ok: true, item };
}

function rollValue(rng) {
  const value = rng();
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError('rng must return a number between 0 and 1');
  }
  return value;
}

function rollRarity(value) {
  if (value < 0.52) return 'common';
  if (value < 0.78) return 'uncommon';
  if (value < 0.92) return 'rare';
  if (value < 0.98) return 'epic';
  return 'legendary';
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function openFossil(state, siteId, fossilId, rng = Math.random) {
  const site = findSite(state, siteId);
  if (!site) {
    return { ok: false, reason: 'unknown site' };
  }
  const fossilIndex = site.unidentifiedFossils.findIndex(item =>
    item.id === fossilId && item.type === 'unidentified-fossil'
  );
  if (fossilIndex < 0) {
    return { ok: false, reason: 'unidentified fossil not found' };
  }

  const familyRoll = rollValue(rng);
  const rarityRoll = rollValue(rng);
  const family = FOSSIL_FAMILIES[Math.floor(familyRoll * FOSSIL_FAMILIES.length)];
  const rarity = rollRarity(rarityRoll);
  const [item] = site.unidentifiedFossils.splice(fossilIndex, 1);
  const fossil = {
    id: item.id,
    family,
    rarity,
    name: `${capitalize(family)} ${capitalize(rarity)}`,
    bonus: { ...RARITY_BONUSES[rarity] },
    createdAt: item.createdAt ?? Date.now(),
  };
  state.collection.push(fossil);
  return { ok: true, fossil };
}

export function getMuseumBonuses(state, siteId) {
  const site = findSite(state, siteId);
  const bonuses = { digSpeed: 0, output: 0 };
  if (!site) {
    return bonuses;
  }

  const displayed = new Set(site.museum.displayed.filter(Boolean));
  for (const fossil of state.collection) {
    if (!displayed.has(fossil.id)) {
      continue;
    }
    bonuses.digSpeed += fossil.bonus?.digSpeed || 0;
    bonuses.output += fossil.bonus?.output || 0;
  }
  return bonuses;
}

export function setMuseumDisplay(state, siteId, fossilId, slotIndex) {
  const site = findSite(state, siteId);
  if (!site) {
    return { ok: false, reason: 'unknown site' };
  }
  if (!Number.isSafeInteger(slotIndex) || slotIndex < 0 || slotIndex >= site.museum.slots) {
    return { ok: false, reason: 'invalid museum slot' };
  }
  if (!state.collection.some(fossil => fossil.id === fossilId)) {
    return { ok: false, reason: 'fossil is not owned' };
  }

  for (const candidate of state.sites) {
    candidate.museum.displayed = candidate.museum.displayed.map(id =>
      id === fossilId ? null : id
    );
    state.museum[candidate.id] = candidate.museum.displayed;
    candidate.museum.bonuses = getMuseumBonuses(state, candidate.id);
  }
  site.museum.displayed[slotIndex] = fossilId;
  site.museum.bonuses = getMuseumBonuses(state, siteId);
  return { ok: true };
}

export function expandMuseum(state, siteId) {
  const site = findSite(state, siteId);
  if (!site) {
    return { ok: false, reason: 'unknown site' };
  }
  if (!Object.entries(MUSEUM_EXPANSION_COST).every(([resource, amount]) =>
    Number.isFinite(site.resources[resource]) && site.resources[resource] >= amount
  )) {
    return { ok: false, reason: 'insufficient resources' };
  }

  for (const [resource, amount] of Object.entries(MUSEUM_EXPANSION_COST)) {
    site.resources[resource] -= amount;
  }
  site.museum.slots += 1;
  site.museum.displayed.push(null);
  state.museum[site.id] = site.museum.displayed;
  return { ok: true };
}
