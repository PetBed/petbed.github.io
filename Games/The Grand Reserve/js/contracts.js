import { RECIPES, INGREDIENTS_DATA, BARREL_TYPES } from "./data.js";
import { WEATHER_DATA } from "./weather.js";

const YEASTS = {
    none: { id: 'none', name: "No Additive", flavour: { sw: 0, ac: 0, tn: 0, bd: 0 } },
    wild_yeast: { id: 'wild_yeast', name: "Wild Yeast", flavour: INGREDIENTS_DATA.wild_yeast.flavour },
    pure_honey: { id: 'pure_honey', name: "Pure Honey", flavour: INGREDIENTS_DATA.pure_honey.flavour }
};

const NPC_ARCHETYPES = [
    { name: "Baron von Richter", title: "Silesian Wine Connoisseur", avatar: "🍷" },
    { name: "Lady Josephine", title: "Royal Court Sommelier", avatar: "👑" },
    { name: "Marigold Thorne", title: "Earthy Botanical Apothecary", avatar: "🌿" },
    { name: "Captain Haddock", title: "Merchant Port Master", avatar: "⚓" },
    { name: "The Wandering Minstrel", title: "Local Tavern Bard", avatar: "🎵" },
    { name: "Master Alchemist", title: "Guild of Transmutation", avatar: "⚗️" }
];

function solveContractValidity(recipeKey, targets, minTimeWindow = 1.5) {
    const recipe = RECIPES[recipeKey];
    if (!recipe) return [];

    let validConfigurations = [];

    for (const weather of Object.values(WEATHER_DATA)) {
        for (const yeast of Object.values(YEASTS)) {
            for (const barrel of Object.values(BARREL_TYPES)) {

                // Phase 1: Calculate base flavour from ingredients
                let baseFlavour = { sw: 0, ac: 0, tn: 0, bd: 0 };
                for (const [ingKey, count] of Object.entries(recipe.req)) {
                    const ingFlavour = INGREDIENTS_DATA[ingKey].flavour;
                    if (ingFlavour) {
                        baseFlavour.sw += ingFlavour.sw * count;
                        baseFlavour.ac += ingFlavour.ac * count;
                        baseFlavour.tn += ingFlavour.tn * count;
                        baseFlavour.bd += ingFlavour.bd * count;
                    }
                }

                // Phase 2: Apply weather modifier and clamp
                if (weather.modifier) {
                    baseFlavour.sw = Math.max(0, Math.min(100, baseFlavour.sw + weather.modifier.sw));
                    baseFlavour.ac = Math.max(0, Math.min(100, baseFlavour.ac + weather.modifier.ac));
                    baseFlavour.tn = Math.max(0, Math.min(100, baseFlavour.tn + weather.modifier.tn));
                    baseFlavour.bd = Math.max(0, Math.min(100, baseFlavour.bd + weather.modifier.bd));
                }

                // Phase 3: Apply pantry additive and clamp
                if (yeast.flavour) {
                    baseFlavour.sw = Math.max(0, Math.min(100, baseFlavour.sw + yeast.flavour.sw));
                    baseFlavour.ac = Math.max(0, Math.min(100, baseFlavour.ac + yeast.flavour.ac));
                    baseFlavour.tn = Math.max(0, Math.min(100, baseFlavour.tn + yeast.flavour.tn));
                    baseFlavour.bd = Math.max(0, Math.min(100, baseFlavour.bd + yeast.flavour.bd));
                }

                // Phase 4: Analytical intersection solving for aging
                let t_start = 0;
                let t_end = 100;
                let possible = true;

                for (const attr of Object.keys(targets)) {
                    const range = targets[attr];
                    const rate = barrel.flavourModifier[attr] || 0;
                    const initialVal = baseFlavour[attr];

                    if (rate === 0) {
                        if (initialVal < range.min || initialVal > range.max) {
                            possible = false;
                            break;
                        }
                        continue;
                    }

                    let t_min = (range.min - initialVal) / rate;
                    let t_max = (range.max - initialVal) / rate;

                    if (rate < 0) [t_min, t_max] = [t_max, t_min];

                    t_start = Math.max(t_start, t_min);
                    t_end = Math.min(t_end, t_max);
                }

                if (possible && t_start <= t_end && (t_end - t_start) >= minTimeWindow) {
                    validConfigurations.push({ weather: weather.id, yeast: yeast.id, barrel: barrel.id });
                    // We only need to know if it's possible, so we can exit early.
                    return validConfigurations;
                }
            }
        }
    }
    return [];
}

export function generateSolvableContract() {
    let scanCount = 0;
    const MAX_SCANS = 500;

    while (scanCount < MAX_SCANS) {
        scanCount++;

        // 1. Pick a random wine recipe (excluding fallbacks)
        const recipeKeys = Object.keys(RECIPES).filter(k => k !== 'fruit_cider' && k !== 'house_red');
        const recipeKey = recipeKeys[Math.floor(Math.random() * recipeKeys.length)];

        // 2. Decide how many attributes to target (1 to 4)
        const attributeCount = Math.floor(Math.random() * 4) + 1;
        const attrs = ['sw', 'ac', 'tn', 'bd'];
        const chosenAttrs = attrs.sort(() => 0.5 - Math.random()).slice(0, attributeCount);

        // 3. Generate randomized target ranges
        const targets = {};
        for (const attr of chosenAttrs) {
            const minVal = Math.floor(Math.random() * 70); // Start range lower
            const maxVal = minVal + Math.floor(Math.random() * 20) + 15; // Width 15-35
            targets[attr] = { min: minVal, max: Math.min(100, maxVal) };
        }

        // 4. Validate with the solver
        const solutions = solveContractValidity(recipeKey, targets);
        if (solutions.length > 0) {
            // 5. If solvable, create the contract object
            const npc = NPC_ARCHETYPES[Math.floor(Math.random() * NPC_ARCHETYPES.length)];
            const multipliers = { 1: 2.0, 2: 2.5, 3: 3.0, 4: 4.0 };

            return {
                id: `contract_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                npc: npc,
                recipeKey: recipeKey,
                targets: targets,
                multiplier: multipliers[attributeCount],
                status: 'available',
                timeRemaining: (20 + Math.random() * 10) * 60, // 20-30 minutes in seconds
            };
        }
    }

    console.warn(`Solvability Engine failed to generate a contract after ${MAX_SCANS} attempts.`);
    return null;
}

export function checkContractCompletion(wine, contract) {
    if (wine.recipeKey !== contract.recipeKey) {
        return { success: false, reason: "Incorrect wine type." };
    }

    for (const attr in contract.targets) {
        const targetRange = contract.targets[attr];
        const wineValue = wine.flavour[attr];

        if (wineValue < targetRange.min || wineValue > targetRange.max) {
            const attrName = {sw: "Sweetness", ac: "Acidity", tn: "Tannin", bd: "Body"}[attr];
            const issue = wineValue < targetRange.min ? "too low" : "too high";
            return {
                success: false,
                reason: `${attrName} is ${issue}. (${Math.round(wineValue)}% vs target of ${targetRange.min}-${targetRange.max}%)`
            };
        }
    }

    return { success: true };
}