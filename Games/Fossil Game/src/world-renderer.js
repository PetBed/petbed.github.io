import { BUILDING_DEFINITIONS } from './buildings.js';
import { screenToWorld } from './camera.js';

const TILE_SIZE = 32;
const DIRECTIONS = {
  north: { x: 0, y: -1 },
  east: { x: 1, y: 0 },
  south: { x: 0, y: 1 },
  west: { x: -1, y: 0 },
};
const RESOURCE_COLOURS = {
  coal: '#24282a',
  iron: '#bd7654',
  stone: '#a39b82',
  sediment: '#ba9a56',
  fragment: '#70a48e',
};
const BUILDING_COLOURS = {
  excavator: '#c58544',
  warehouse: '#65736b',
  generator: '#6b6b4e',
  smelter: '#a05d43',
  crusher: '#8a7554',
  'fossil-finisher': '#667c71',
  splitter: '#a4804a',
};
const ITEM_COLOURS = {
  coal: '#171c1e',
  iron: '#c77b58',
  stone: '#b5ac93',
  sediment: '#d0ad5d',
  steel: '#c4c8bd',
  concrete: '#a0a99e',
  trilobite: '#a2bb73',
  pterosaur: '#9b8dc0',
  fish: '#75a9c5',
  fern: '#7fb78f',
  'unidentified-fossil': '#e2c76b',
};

function hashTile(x, y) {
  let value = Math.imul(x ^ 0x45d9f3b, 0x45d9f3b) ^ Math.imul(y, 0x119de1f3);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return (value ^ (value >>> 16)) >>> 0;
}

function activeSite(state) {
  return state.sites.find(site => site.id === state.activeSiteId) || state.site;
}

function rotatedFootprint(building) {
  const definition = BUILDING_DEFINITIONS[building.type];
  return building.rotation === 90 || building.rotation === 270
    ? { width: definition.height, height: definition.width }
    : { width: definition.width, height: definition.height };
}

function drawGroundTile(context, x, y) {
  const shade = hashTile(x, y) % 4;
  const colours = ['#343b35', '#303832', '#384038', '#323a37'];
  context.fillStyle = colours[shade];
  context.fillRect(x, y, 1, 1);
  context.fillStyle = '#232b28';
  context.fillRect(x + 0.03, y + 0.96, 0.94, 0.04);
  context.fillRect(x + 0.96, y + 0.03, 0.04, 0.93);

  const fleck = hashTile(x + 3, y - 7);
  context.fillStyle = fleck % 3 === 0 ? '#465044' : '#29312c';
  context.fillRect(x + 0.18 + (fleck % 53) / 100, y + 0.2 + (fleck % 37) / 100, 0.06, 0.06);
}

function drawResourceNode(context, node) {
  const colour = RESOURCE_COLOURS[node.resource] || '#70a48e';
  context.fillStyle = '#202723';
  context.fillRect(node.x + 0.06, node.y + 0.06, 0.88, 0.88);
  context.fillStyle = colour;
  context.fillRect(node.x + 0.14, node.y + 0.16, 0.72, 0.68);
  context.fillStyle = '#d5d0b5';
  context.fillRect(node.x + 0.28, node.y + 0.27, 0.14, 0.14);
  context.fillRect(node.x + 0.58, node.y + 0.58, 0.16, 0.12);
  if (node.resource === 'fragment') {
    context.fillStyle = '#e2c76b';
    context.fillRect(node.x + 0.42, node.y + 0.36, 0.18, 0.18);
  }
}

function drawDirection(context, direction, colour = '#dbc279') {
  const offset = DIRECTIONS[direction] || DIRECTIONS.east;
  context.fillStyle = colour;
  context.beginPath();
  context.moveTo(0.5 + offset.x * 0.25, 0.5 + offset.y * 0.25);
  if (offset.x !== 0) {
    context.lineTo(0.5 - offset.x * 0.18, 0.5 - 0.2);
    context.lineTo(0.5 - offset.x * 0.18, 0.5 + 0.2);
  } else {
    context.lineTo(0.5 - 0.2, 0.5 - offset.y * 0.18);
    context.lineTo(0.5 + 0.2, 0.5 - offset.y * 0.18);
  }
  context.closePath();
  context.fill();
}

function itemColour(item) {
  return ITEM_COLOURS[item.resource || item.family || item.type] || '#d9d1ae';
}

function drawItem(context, item, x, y, size = 0.32) {
  context.fillStyle = '#161c19';
  context.fillRect(x - size / 2 - 0.035, y - size / 2 - 0.035, size + 0.07, size + 0.07);
  context.fillStyle = itemColour(item);
  context.fillRect(x - size / 2, y - size / 2, size, size);
  context.fillStyle = '#ffffff44';
  context.fillRect(x - size / 2, y - size / 2, size * 0.36, size * 0.24);
}

function drawBelt(context, belt) {
  context.fillStyle = '#1f2925';
  context.fillRect(belt.x + 0.05, belt.y + 0.05, 0.9, 0.9);
  context.fillStyle = '#5a6359';
  context.fillRect(belt.x + 0.12, belt.y + 0.12, 0.76, 0.76);
  context.fillStyle = '#74766a';
  context.fillRect(belt.x + 0.16, belt.y + 0.17, 0.68, 0.66);
  context.save();
  context.translate(belt.x, belt.y);
  drawDirection(context, belt.direction, '#d6c879');
  context.restore();

  if (belt.item) {
    const offset = DIRECTIONS[belt.direction] || DIRECTIONS.east;
    const progress = Math.min(0.7, Math.max(0, belt.progress || 0) * 0.7);
    drawItem(context, belt.item, belt.x + 0.5 + offset.x * progress, belt.y + 0.5 + offset.y * progress);
  }
}

function drawBuilding(context, building) {
  const { width, height } = rotatedFootprint(building);
  const colour = BUILDING_COLOURS[building.type] || '#66736b';
  context.fillStyle = '#1b211d';
  context.fillRect(building.x - 0.07, building.y - 0.07, width + 0.14, height + 0.14);
  context.fillStyle = colour;
  context.fillRect(building.x, building.y, width, height);
  context.fillStyle = '#ffffff16';
  context.fillRect(building.x + 0.12, building.y + 0.12, width - 0.24, 0.12);
  context.fillStyle = '#29302a';
  for (let x = 0.25; x < width; x += 0.5) {
    context.fillRect(building.x + x, building.y + 0.3, 0.08, height - 0.6);
  }
  context.fillStyle = '#f1dfad';
  context.font = '0.34px monospace';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  const labels = {
    excavator: 'EX',
    warehouse: 'WH',
    generator: 'GE',
    smelter: 'SM',
    crusher: 'CR',
    'fossil-finisher': 'FO',
    splitter: 'SP',
  };
  context.fillText(labels[building.type] || '??', building.x + width / 2, building.y + height / 2);

  for (let index = 0; index < building.outputSlots.length; index += 1) {
    drawItem(context, building.outputSlots[index], building.x + width - 0.18, building.y - 0.12 - index * 0.38, 0.28);
  }
  for (let index = 0; index < building.inputSlots.length; index += 1) {
    drawItem(context, building.inputSlots[index], building.x + 0.18 + index * 0.34, building.y + height + 0.12, 0.26);
  }
}

export function drawWorld(context, state, camera, viewport) {
  context.clearRect(0, 0, viewport.width, viewport.height);
  context.fillStyle = '#28312d';
  context.fillRect(0, 0, viewport.width, viewport.height);
  context.save();
  context.translate(camera.x, camera.y);
  context.scale(camera.zoom * TILE_SIZE, camera.zoom * TILE_SIZE);

  const site = activeSite(state);
  const topLeft = screenToWorld({ x: 0, y: 0 }, camera);
  const bottomRight = screenToWorld({ x: viewport.width, y: viewport.height }, camera);
  const left = topLeft.x - 2;
  const top = topLeft.y - 2;
  const right = bottomRight.x + 2;
  const bottom = bottomRight.y + 2;

  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      drawGroundTile(context, x, y);
    }
  }

  for (const node of site.resourceNodes) {
    if (node.x >= left && node.x <= right && node.y >= top && node.y <= bottom) {
      drawResourceNode(context, node);
    }
  }
  for (const belt of site.belts) {
    drawBelt(context, belt);
  }
  for (const building of site.buildings) {
    drawBuilding(context, building);
  }

  context.restore();
}

export function drawMinimap(context, site, camera, viewport) {
  const range = 32;
  const scale = Math.min(viewport.width / (range * 2), viewport.height / (range * 2));
  const mapWidth = range * 2 * scale;
  const mapHeight = range * 2 * scale;
  const mapLeft = (viewport.width - mapWidth) / 2;
  const mapTop = (viewport.height - mapHeight) / 2;
  const worldToMap = (x, y) => ({
    x: mapLeft + (x + range) * scale,
    y: mapTop + (y + range) * scale,
  });

  context.clearRect(0, 0, viewport.width, viewport.height);
  context.fillStyle = '#1e2723';
  context.fillRect(0, 0, viewport.width, viewport.height);
  context.fillStyle = '#3c493f';
  context.fillRect(mapLeft, mapTop, mapWidth, mapHeight);
  for (const node of site.resourceNodes) {
    const point = worldToMap(node.x, node.y);
    context.fillStyle = RESOURCE_COLOURS[node.resource] || '#70a48e';
    context.fillRect(point.x, point.y, Math.max(2, scale), Math.max(2, scale));
  }
  for (const belt of site.belts) {
    const point = worldToMap(belt.x, belt.y);
    context.fillStyle = belt.item ? '#e2c76b' : '#919380';
    context.fillRect(point.x, point.y, Math.max(2, scale * 0.7), Math.max(2, scale * 0.7));
  }
  for (const building of site.buildings) {
    const point = worldToMap(building.x, building.y);
    context.fillStyle = BUILDING_COLOURS[building.type] || '#d2bf7a';
    context.fillRect(point.x, point.y, Math.max(3, scale * 2), Math.max(3, scale * 2));
  }

  const tileSize = camera.tileSize || TILE_SIZE;
  const cameraLeft = (-camera.x / (tileSize * camera.zoom)) + range;
  const cameraTop = (-camera.y / (tileSize * camera.zoom)) + range;
  const cameraWidth = viewport.worldWidth / (tileSize * camera.zoom);
  const cameraHeight = viewport.worldHeight / (tileSize * camera.zoom);
  context.strokeStyle = '#f2e6b9';
  context.lineWidth = 1.5;
  context.strokeRect(
    mapLeft + cameraLeft * scale,
    mapTop + cameraTop * scale,
    cameraWidth * scale,
    cameraHeight * scale
  );

  return { range, scale, mapLeft, mapTop, mapWidth, mapHeight };
}
