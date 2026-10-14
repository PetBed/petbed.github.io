import { BUILDING_DEFINITIONS } from './buildings.js';

export const EXCAVATOR_CYCLE_SECONDS = 2;

export const RECIPES = {
  generator: {
    inputs: [{ type: 'resource', resource: 'coal', amount: 1 }],
    outputs: [{ type: 'power', amount: 10 }],
    duration: 2,
    power: 0,
    constructionCost: BUILDING_DEFINITIONS.generator.cost,
  },
  smelter: {
    inputs: [
      { type: 'resource', resource: 'iron', amount: 1 },
      { type: 'resource', resource: 'coal', amount: 1 },
    ],
    outputs: [{ type: 'resource', resource: 'steel', amount: 1 }],
    duration: 3,
    power: 2,
    constructionCost: BUILDING_DEFINITIONS.smelter.cost,
  },
  crusher: {
    inputs: [
      { type: 'resource', resource: 'stone', amount: 2 },
      { type: 'resource', resource: 'sediment', amount: 1 },
    ],
    outputs: [{ type: 'resource', resource: 'concrete', amount: 1 }],
    duration: 3,
    power: 1,
    constructionCost: BUILDING_DEFINITIONS.crusher.cost,
  },
  'fossil-finisher': {
    inputs: [{ type: 'fragment', family: '*', amount: 4 }],
    outputs: [{ type: 'unidentified-fossil', amount: 1 }],
    duration: 6,
    power: 4,
    constructionCost: BUILDING_DEFINITIONS['fossil-finisher'].cost,
  },
};
