export const BUILDING_DEFINITIONS = {
  warehouse: {
    width: 2,
    height: 2,
    cost: { iron: 8, stone: 4 },
    inputs: [
      { x: -1, y: 0, direction: 'west' },
      { x: 2, y: 0, direction: 'east' },
      { x: 0, y: -1, direction: 'north' },
      { x: 0, y: 2, direction: 'south' },
    ],
    outputs: [],
  },
  excavator: {
    width: 2,
    height: 2,
    cost: { iron: 4, stone: 4 },
    inputs: [],
    outputs: [{ x: 2, y: 0, direction: 'east' }],
  },
  generator: {
    width: 2,
    height: 2,
    cost: { iron: 6, stone: 4 },
    inputs: [{ x: -1, y: 0, direction: 'west' }],
    outputs: [],
  },
  smelter: {
    width: 2,
    height: 2,
    cost: { iron: 8, stone: 4 },
    inputs: [{ x: -1, y: 0, direction: 'west' }],
    outputs: [{ x: 2, y: 0, direction: 'east' }],
  },
  crusher: {
    width: 2,
    height: 2,
    cost: { iron: 5, stone: 6 },
    inputs: [{ x: -1, y: 0, direction: 'west' }],
    outputs: [{ x: 2, y: 0, direction: 'east' }],
  },
  'fossil-finisher': {
    width: 3,
    height: 2,
    cost: { iron: 12, sediment: 6 },
    inputs: [{ x: -1, y: 0, direction: 'west' }],
    outputs: [{ x: 3, y: 0, direction: 'east' }],
  },
  splitter: {
    width: 1,
    height: 1,
    cost: { iron: 2 },
    inputs: [{ x: -1, y: 0, direction: 'west' }],
    outputs: [
      { x: 1, y: 0, direction: 'east' },
      { x: 0, y: 1, direction: 'south' },
    ],
  },
};

export const BELT_COST = { iron: 1 };

const DIRECTIONS = ['north', 'east', 'south', 'west'];

function rotateDirection(direction, rotation) {
  const index = DIRECTIONS.indexOf(direction);
  return DIRECTIONS[(index + rotation / 90) % DIRECTIONS.length];
}

export function getBuildingFootprint(building) {
  const definition = BUILDING_DEFINITIONS[building.type];
  const swapsDimensions = building.rotation === 90 || building.rotation === 270;
  const width = swapsDimensions ? definition.height : definition.width;
  const height = swapsDimensions ? definition.width : definition.height;

  return {
    left: building.x,
    top: building.y,
    right: building.x + width - 1,
    bottom: building.y + height - 1,
    width,
    height,
  };
}

export function getBuildingPorts(building) {
  const definition = BUILDING_DEFINITIONS[building.type];

  return [
    ...definition.inputs.map(port => ({ type: 'input', ...port })),
    ...definition.outputs.map(port => ({ type: 'output', ...port })),
  ].map(port => {
    let width = definition.width;
    let height = definition.height;
    let x = port.x;
    let y = port.y;
    let direction = port.direction;

    for (let turn = 0; turn < building.rotation / 90; turn += 1) {
      [x, y] = [height - 1 - y, x];
      [width, height] = [height, width];
      direction = rotateDirection(direction, 90);
    }

    return {
      type: port.type,
      x: building.x + x,
      y: building.y + y,
      direction,
    };
  });
}
