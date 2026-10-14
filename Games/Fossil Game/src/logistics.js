import { BUILDING_DEFINITIONS } from './buildings.js';

const DIRECTIONS = ['north', 'east', 'south', 'west'];
const DIRECTION_OFFSETS = {
  north: { x: 0, y: -1 },
  east: { x: 1, y: 0 },
  south: { x: 0, y: 1 },
  west: { x: -1, y: 0 },
};
const MAX_MACHINE_INPUT_ITEMS = 4;
const MAX_STEPS_PER_CALL = 300;

function rotateDirection(direction, rotation) {
  const index = DIRECTIONS.indexOf(direction);
  return DIRECTIONS[(index + rotation / 90) % DIRECTIONS.length];
}

function opposite(direction) {
  return rotateDirection(direction, 180);
}

function positionKey(x, y) {
  return `${x},${y}`;
}

function portPosition(building, port, rotation) {
  const definition = BUILDING_DEFINITIONS[building.type];
  let width = definition.width;
  let height = definition.height;
  let x = port.x;
  let y = port.y;
  let direction = port.direction;

  for (let turn = 0; turn < rotation / 90; turn += 1) {
    [x, y] = [height - 1 - y, x];
    [width, height] = [height, width];
    direction = rotateDirection(direction, 90);
  }

  return {
    x: building.x + x,
    y: building.y + y,
    direction,
  };
}

function getInputPort(site, belt) {
  for (const building of site.buildings) {
    const definition = BUILDING_DEFINITIONS[building.type];
    if (!definition || building.type === 'splitter') {
      continue;
    }

    for (const port of definition.inputs) {
      const position = portPosition(building, port, building.rotation);
      if (
        position.x === belt.x &&
        position.y === belt.y &&
        belt.direction === opposite(position.direction)
      ) {
        return { building, position };
      }
    }
  }

  return null;
}

function getSplitterInput(site, belt) {
  for (const building of site.buildings) {
    if (building.type !== 'splitter') {
      continue;
    }

    const definition = BUILDING_DEFINITIONS.splitter;
    for (const port of definition.inputs) {
      const position = portPosition(building, port, building.rotation);
      if (
        position.x === belt.x &&
        position.y === belt.y &&
        belt.direction === opposite(position.direction)
      ) {
        return building;
      }
    }
  }

  return null;
}

function nextPosition(belt) {
  const offset = DIRECTION_OFFSETS[belt.direction];
  return { x: belt.x + offset.x, y: belt.y + offset.y };
}

function chooseSplitterOutput(site, splitter, reservedBelts, initiallyOccupied) {
  const directions = splitter.outputDirections || ['east', 'south'];
  const firstIndex = splitter.lastOutputIndex || 0;

  for (let attempt = 0; attempt < directions.length; attempt += 1) {
    const index = (firstIndex + attempt) % directions.length;
    const direction = directions[index];
    const offset = DIRECTION_OFFSETS[direction];
    const x = splitter.x + offset.x;
    const y = splitter.y + offset.y;
    const belt = site.belts.find(item => item.x === x && item.y === y);

    if (
      belt &&
      belt.item === null &&
      !initiallyOccupied.has(positionKey(x, y)) &&
      !reservedBelts.has(belt.id)
    ) {
      return { belt, nextIndex: (index + 1) % directions.length };
    }
  }

  return null;
}

function releaseMachineOutputs(site, reservedBelts, initiallyOccupied) {
  for (const building of site.buildings) {
    const definition = BUILDING_DEFINITIONS[building.type];
    if (!definition || definition.outputs.length === 0 || building.outputSlots.length === 0) {
      continue;
    }

    for (const port of definition.outputs) {
      const position = portPosition(building, port, building.rotation);
      const belt = site.belts.find(item => item.x === position.x && item.y === position.y);
      if (
        !belt ||
        belt.direction !== position.direction ||
        belt.item !== null ||
        initiallyOccupied.has(positionKey(belt.x, belt.y)) ||
        reservedBelts.has(belt.id)
      ) {
        continue;
      }

      belt.item = building.outputSlots.shift();
      belt.progress = 0;
      reservedBelts.add(belt.id);
      break;
    }
  }
}

function advanceOneSecond(site) {
  const itemsAtStart = new Map(site.belts.map(belt => [belt.id, belt.item]));
  const initiallyOccupied = new Set(
    site.belts
      .filter(belt => belt.item !== null)
      .map(belt => positionKey(belt.x, belt.y))
  );
  const reservedBelts = new Set();
  const reservedInputs = new Map();

  for (const belt of site.belts) {
    if (itemsAtStart.get(belt.id) === null) {
      continue;
    }

    belt.progress = Math.min(1, belt.progress + 1);
    if (belt.progress < 1) {
      continue;
    }

    const splitter = getSplitterInput(site, belt);
    if (splitter) {
      const output = chooseSplitterOutput(site, splitter, reservedBelts, initiallyOccupied);
      if (!output) {
        continue;
      }

      output.belt.item = belt.item;
      output.belt.progress = 0;
      belt.item = null;
      belt.progress = 0;
      splitter.lastOutputIndex = output.nextIndex;
      reservedBelts.add(output.belt.id);
      continue;
    }

    const inputPort = getInputPort(site, belt);
    if (inputPort) {
      const reservedCount = reservedInputs.get(inputPort.building.id) || 0;
      if (inputPort.building.inputSlots.length + reservedCount < MAX_MACHINE_INPUT_ITEMS) {
        inputPort.building.inputSlots.push(belt.item);
        reservedInputs.set(inputPort.building.id, reservedCount + 1);
        belt.item = null;
        belt.progress = 0;
      }
      continue;
    }

    const next = nextPosition(belt);
    const target = site.belts.find(item => item.x === next.x && item.y === next.y);
    if (
      target &&
      target.item === null &&
      !initiallyOccupied.has(positionKey(target.x, target.y)) &&
      !reservedBelts.has(target.id)
    ) {
      target.item = belt.item;
      target.progress = 0;
      belt.item = null;
      belt.progress = 0;
      reservedBelts.add(target.id);
    }
  }

  releaseMachineOutputs(site, reservedBelts, initiallyOccupied);
}

export function tickLogistics(site, deltaSeconds) {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
    throw new RangeError('deltaSeconds must be a finite non-negative number');
  }

  const accumulated = (site.logisticsAccumulator || 0) + deltaSeconds;
  let steps = Math.min(MAX_STEPS_PER_CALL, Math.floor(accumulated + 1e-9));
  site.logisticsAccumulator = Math.max(0, accumulated - steps);

  while (steps > 0) {
    advanceOneSecond(site);
    steps -= 1;
  }
}

export function setSplitterOutputs(site, splitterId, outputDirections) {
  const splitter = site.buildings.find(building =>
    building.id === splitterId && building.type === 'splitter'
  );

  if (!splitter) {
    return { ok: false, reason: 'unknown splitter' };
  }
  if (
    !Array.isArray(outputDirections) ||
    outputDirections.length !== 2 ||
    new Set(outputDirections).size !== 2 ||
    outputDirections.some(direction => !DIRECTIONS.includes(direction))
  ) {
    return { ok: false, reason: 'splitter requires two distinct valid output directions' };
  }

  splitter.outputDirections = [...outputDirections];
  splitter.lastOutputIndex = 0;
  return { ok: true };
}
