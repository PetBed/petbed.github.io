import { BEER_RECIPES, RECIPES, TIERS, VINTAGE_RANKS } from './data.js';
import { checkContractCompletion, generateSolvableContract, solveContractValidity } from './contracts.js';
import { updateMarketPrices } from './game-simulation.js';
import { state } from './state.js';
import { createSeededRandom, withIsolatedGameState } from './qa-support.js';

function summarize(values) {
    if (values.length === 0) return { min: 0, max: 0, mean: 0 };
    const total = values.reduce((sum, value) => sum + value, 0);
    return {
        min: Math.min(...values),
        max: Math.max(...values),
        mean: total / values.length,
    };
}

export function runBalanceSimulation({ seed = 20261001, runs = 100 } = {}) {
    if (!Number.isInteger(seed) || !Number.isInteger(runs) || runs < 1) {
        throw new TypeError('seed and runs must be integers; runs must be at least 1.');
    }

    return withIsolatedGameState(() => {
        const random = createSeededRandom(seed);
        const targetCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
        const targetWidths = [];
        const perfectMatchPayouts = [];
        let generationFailures = 0;
        let solverFailures = 0;

        for (let index = 0; index < runs; index++) {
            const contract = generateSolvableContract({
                random,
                now: () => 1700000000000 + index,
            });
            if (!contract) {
                generationFailures++;
                continue;
            }

            if (solveContractValidity(contract.recipeKey, contract.targets).length === 0) {
                solverFailures++;
                continue;
            }

            const attributes = Object.entries(contract.targets);
            targetCounts[attributes.length]++;
            for (const [, range] of attributes) targetWidths.push(range.max - range.min);

            const flavour = { sw: 50, ac: 50, tn: 50, bd: 50 };
            for (const [attribute, range] of attributes) {
                flavour[attribute] = (range.min + range.max) / 2;
            }
            const completion = checkContractCompletion({ recipeKey: contract.recipeKey, flavour }, contract);
            if (completion.success) {
                const marketValue = RECIPES[contract.recipeKey].baseVal;
                perfectMatchPayouts.push(Math.round(
                    marketValue * TIERS.s.mult * VINTAGE_RANKS[0].mult * completion.multiplier,
                ));
            }
        }

        const initialMarket = structuredClone(state.market);
        const productKeys = [...Object.keys(RECIPES), ...Object.keys(BEER_RECIPES)];
        const marketScenarios = {};
        for (const startingOversupply of [0, 25]) {
            state.market = structuredClone(initialMarket);
            for (const key of productKeys) state.market.oversupply[key] = startingOversupply;

            const observedPrices = [];
            for (let tick = 0; tick < runs; tick++) {
                updateMarketPrices({ random, render: false });
                for (const key of productKeys) observedPrices.push(state.market.current[key]);
            }
            marketScenarios[startingOversupply === 0 ? 'baseline' : 'oversupply25'] = summarize(observedPrices);
        }

        return {
            schemaVersion: 1,
            seed,
            runs,
            contracts: {
                generationFailures,
                solverFailures,
                targetCountDistribution: targetCounts,
                targetWidth: summarize(targetWidths),
                perfectMatchPayout: summarize(perfectMatchPayouts),
            },
            market: {
                products: productKeys.length,
                ticksPerScenario: runs,
                priceByStartingOversupply: marketScenarios,
            },
        };
    });
}