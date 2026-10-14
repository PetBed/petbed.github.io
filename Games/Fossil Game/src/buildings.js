export const BUILDING_DEFINITIONS = {
  excavator: {
    width: 2,
    height: 2,
    cost: {},
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
