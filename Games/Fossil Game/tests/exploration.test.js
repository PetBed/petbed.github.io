import test from 'node:test';
import assert from 'node:assert/strict';

import { createInitialState } from '../src/game-core.js';
import * as worldGrid from '../src/world-grid.js';

test('exploringNewChunksCreatesStableMineralAndFossilDepositsOnce', () => {
  assert.equal(typeof worldGrid.exploreSite, 'function');

  const state = createInitialState();
  const bounds = { left: 96, top: -120, right: 119, bottom: -97 };
  const startingNodes = state.site.resourceNodes.length;

  worldGrid.exploreSite(state, bounds);
  const generated = state.site.resourceNodes.slice(startingNodes);

  assert.equal(generated.length, 2);
  assert.ok(generated.some(node => node.resource === 'fragment'));
  assert.ok(generated.some(node =>
    ['coal', 'iron', 'copper', 'stone', 'sediment'].includes(node.resource)
  ));
  assert.ok(generated.every(node => node.remaining > 0));

  const firstResult = structuredClone(generated);
  worldGrid.exploreSite(state, bounds);
  assert.deepEqual(state.site.resourceNodes.slice(startingNodes), firstResult);

  const secondState = createInitialState();
  worldGrid.exploreSite(secondState, bounds);
  assert.deepEqual(secondState.site.resourceNodes.slice(startingNodes), firstResult);
});
