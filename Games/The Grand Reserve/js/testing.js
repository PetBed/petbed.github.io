import { checkContractCompletion, generateSolvableContract, solveContractValidity } from './contracts.js';
import { advanceGameTick, updateMarketPrices } from './game-simulation.js';
import { runBalanceSimulation } from './balance.js';
import { globals, state } from './state.js';
import { createSeededRandom, withIsolatedGameState } from './qa-support.js';

const scenarioResults = document.getElementById('scenario-results');
const statusOutput = document.getElementById('run-status');
const reportOutput = document.getElementById('report-output');
const downloadButton = document.getElementById('download-report');
let latestReport = null;

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

function runContractScenario(seed, runs) {
    const random = createSeededRandom(seed);
    let generated = 0;
    let solvable = 0;
    let acceptedAtTarget = 0;

    for (let index = 0; index < runs; index++) {
        const contract = generateSolvableContract({ random, now: () => seed + index });
        if (!contract) continue;
        generated++;
        if (solveContractValidity(contract.recipeKey, contract.targets).length === 0) continue;
        solvable++;

        const flavour = { sw: 50, ac: 50, tn: 50, bd: 50 };
        for (const [attribute, range] of Object.entries(contract.targets)) {
            flavour[attribute] = (range.min + range.max) / 2;
        }
        if (checkContractCompletion({ recipeKey: contract.recipeKey, flavour }, contract).success) {
            acceptedAtTarget++;
        }
    }

    assert(generated === runs, `Only ${generated} of ${runs} offers generated.`);
    assert(solvable === runs, `${runs - solvable} generated offers failed the production solver.`);
    assert(acceptedAtTarget === runs, `${runs - acceptedAtTarget} target-profile wines were rejected.`);
    return `${generated} offers generated, solver-confirmed, and accepted at target flavour.`;
}

function runProgressionScenario() {
    return withIsolatedGameState(() => {
        state.plots = state.plots.map((plot, index) => index === 0
            ? { ...plot, state: 'growing', cropType: 'pinot_noir', timeRemaining: 1 }
            : { ...plot, state: 'empty', cropType: null, timeRemaining: 0 });
        state.barrels = [
            { id: 0, type: 'french_oak', state: 'fermenting', fermentTime: 1, ageProgress: 0, qualityMultiplier: 0.8 },
            {
                id: 1,
                type: 'french_oak',
                state: 'aging',
                ageProgress: 99.5,
                flavour: { sw: 50, ac: 50, tn: 99.9, bd: 99.9 },
            },
        ];
        state.wineRacks = [{ id: 'qa-wine', age: 14, rankIndex: 0 }, ...Array(8).fill(null)];
        state.contracts = [
            { id: 'expired', status: 'available', timeRemaining: 1 },
            { id: 'active', status: 'active', timeRemaining: 1 },
        ];
        state.market.tickCurrent = 10;
        globals.currentTab = 'orders';

        advanceGameTick(1, {
            random: () => 0.99,
            effects: new Proxy({}, { get: () => () => {} }),
        });

        assert(state.plots[0].state === 'ready', 'A one-second crop did not become ready.');
        assert(state.barrels[0].state === 'aging', 'Fermentation did not enter aging.');
        assert(state.barrels[0].qualityMultiplier === 1, 'Fermentation did not reset quality.');
        assert(state.barrels[1].ageProgress === 100, 'Aging did not clamp at completion.');
        assert(state.barrels[1].flavour.tn === 100 && state.barrels[1].flavour.bd === 100, 'Aging flavour exceeded its cap.');
        assert(state.wineRacks[0].rankIndex === 1, 'Rack maturation did not advance the vintage rank.');
        assert(state.contracts.length === 1 && state.contracts[0].id === 'active', 'Available contract expiry removed the wrong order.');
        return 'Crop, fermentation, aging, rack rank, and contract expiry transitions passed.';
    });
}

function simulateMarket(seed, ticks) {
    return withIsolatedGameState(() => {
        for (const key of Object.keys(state.market.oversupply)) state.market.oversupply[key] = 12;
        const random = createSeededRandom(seed);
        for (let tick = 0; tick < ticks; tick++) updateMarketPrices({ random, render: false });
        return structuredClone(state.market);
    });
}

function runMarketScenario(seed, runs) {
    const ticks = Math.min(runs, 30);
    const first = simulateMarket(seed, ticks);
    const second = simulateMarket(seed, ticks);
    assert(JSON.stringify(first) === JSON.stringify(second), 'Same-seed market output changed between runs.');
    const allPrices = Object.values(first.current);
    assert(allPrices.every((price) => price >= 1), 'A market price fell below one gold.');
    assert(Object.values(first.history).every((history) => history.length <= 10), 'Market history exceeded ten points.');
    return `${Object.keys(first.current).length} products across ${ticks} seeded ticks; prices stay positive and histories remain bounded.`;
}

function addResult(name, callback) {
    const result = document.createElement('article');
    result.className = 'result';
    const heading = document.createElement('div');
    heading.className = 'result-head';
    const title = document.createElement('h3');
    title.textContent = name;
    const status = document.createElement('span');
    status.className = 'status';
    status.textContent = 'RUNNING';
    const detail = document.createElement('p');
    detail.textContent = 'Executing production-backed scenario.';
    heading.append(title, status);
    result.append(heading, detail);
    scenarioResults.append(result);

    try {
        detail.textContent = callback();
        status.textContent = 'PASS';
        status.classList.add('pass');
        return true;
    } catch (error) {
        detail.textContent = error instanceof Error ? error.message : String(error);
        status.textContent = 'FAIL';
        status.classList.add('fail');
        return false;
    }
}

function readConfiguration() {
    const seed = Number(document.getElementById('seed-input').value);
    const runs = Number(document.getElementById('runs-input').value);
    if (!Number.isSafeInteger(seed) || !Number.isInteger(runs) || runs < 1 || runs > 10000) {
        throw new TypeError('Use a safe integer seed and 1-10,000 simulation runs.');
    }
    return { seed, runs };
}

document.getElementById('run-scenarios').addEventListener('click', () => {
    try {
        const { seed, runs } = readConfiguration();
        scenarioResults.replaceChildren();
        const results = [
            addResult('Contract solvability', () => runContractScenario(seed, runs)),
            addResult('Game progression tick', runProgressionScenario),
            addResult('Market determinism', () => runMarketScenario(seed, runs)),
        ];
        statusOutput.textContent = results.every(Boolean) ? 'All scenarios passed' : 'One or more scenarios failed';
    } catch (error) {
        statusOutput.textContent = error instanceof Error ? error.message : String(error);
    }
});

document.getElementById('run-balance').addEventListener('click', () => {
    try {
        const configuration = readConfiguration();
        latestReport = runBalanceSimulation(configuration);
        reportOutput.textContent = JSON.stringify(latestReport, null, 2);
        downloadButton.disabled = false;
        statusOutput.textContent = `Balance batch complete · seed ${configuration.seed}`;
    } catch (error) {
        statusOutput.textContent = error instanceof Error ? error.message : String(error);
    }
});

downloadButton.addEventListener('click', () => {
    if (!latestReport) return;
    const reportBlob = new Blob([JSON.stringify(latestReport, null, 2)], { type: 'application/json' });
    const reportUrl = URL.createObjectURL(reportBlob);
    const link = document.createElement('a');
    link.href = reportUrl;
    link.download = `grand-reserve-balance-${latestReport.seed}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(reportUrl), 1000);
});
