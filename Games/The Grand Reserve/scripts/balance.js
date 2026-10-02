import { runBalanceSimulation } from '../js/balance.js';

function readOption(name, fallback) {
    const index = process.argv.indexOf(name);
    if (index < 0) return fallback;
    const value = Number(process.argv[index + 1]);
    if (!Number.isInteger(value)) throw new TypeError(`${name} requires an integer value.`);
    return value;
}

const report = runBalanceSimulation({
    seed: readOption('--seed', 20261001),
    runs: readOption('--runs', 100),
});
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);