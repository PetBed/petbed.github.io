import { globals, state } from './state.js';

function restore(target, snapshot) {
    for (const key of Object.keys(target)) {
        if (!(key in snapshot)) delete target[key];
    }
    Object.assign(target, snapshot);
}

export function withIsolatedGameState(callback) {
    const stateSnapshot = structuredClone(state);
    const globalsSnapshot = structuredClone(globals);
    try {
        return callback();
    } finally {
        restore(state, stateSnapshot);
        restore(globals, globalsSnapshot);
    }
}

export function createSeededRandom(seed) {
    let value = seed >>> 0;
    return function random() {
        value += 0x6D2B79F5;
        let mixed = value;
        mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
        mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
        return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
    };
}