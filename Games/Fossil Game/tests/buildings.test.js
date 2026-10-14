import test from 'node:test';
import assert from 'node:assert/strict';

import * as buildings from '../src/buildings.js';

test('transformsBuildingFootprintAndPortsForAllRotations', () => {
  assert.equal(typeof buildings.getBuildingFootprint, 'function');
  assert.equal(typeof buildings.getBuildingPorts, 'function');

  const expected = [
    {
      rotation: 0,
      footprint: { left: 10, top: 20, right: 12, bottom: 21, width: 3, height: 2 },
      ports: [
        { type: 'input', x: 9, y: 20, direction: 'west' },
        { type: 'output', x: 13, y: 20, direction: 'east' },
      ],
    },
    {
      rotation: 90,
      footprint: { left: 10, top: 20, right: 11, bottom: 22, width: 2, height: 3 },
      ports: [
        { type: 'input', x: 11, y: 19, direction: 'north' },
        { type: 'output', x: 11, y: 23, direction: 'south' },
      ],
    },
    {
      rotation: 180,
      footprint: { left: 10, top: 20, right: 12, bottom: 21, width: 3, height: 2 },
      ports: [
        { type: 'input', x: 13, y: 21, direction: 'east' },
        { type: 'output', x: 9, y: 21, direction: 'west' },
      ],
    },
    {
      rotation: 270,
      footprint: { left: 10, top: 20, right: 11, bottom: 22, width: 2, height: 3 },
      ports: [
        { type: 'input', x: 10, y: 23, direction: 'south' },
        { type: 'output', x: 10, y: 19, direction: 'north' },
      ],
    },
  ];

  for (const { rotation, footprint, ports } of expected) {
    const building = { type: 'fossil-finisher', x: 10, y: 20, rotation };
    assert.deepEqual(buildings.getBuildingFootprint(building), footprint);
    assert.deepEqual(buildings.getBuildingPorts(building), ports);
  }

  assert.deepEqual(
    buildings.getBuildingPorts({ type: 'smelter', x: 10, y: 20, rotation: 90 }),
    [
      { type: 'input', x: 11, y: 19, direction: 'north' },
      { type: 'output', x: 11, y: 22, direction: 'south' },
    ]
  );
});
