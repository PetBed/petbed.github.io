import { advanceSiteFrame, createInitialState } from './src/game-core.js';
import {
  exploreSite,
  isBuildingPlacementValid,
  placeBelt,
  placeBeltRoute,
  placeBuilding,
  previewBeltRoute,
  getGridLineTiles,
  removeBelt,
  removeBeltsAtTiles,
  removeBuilding,
} from './src/world-grid.js';
import { BELT_COST, BUILDING_DEFINITIONS, getBuildingPorts } from './src/buildings.js';
import {
  canAffordCost,
  getCostDisplayRows,
  getResourceDisplayRows,
} from './src/materials.js';
import {
  expandMuseum,
  getMuseumBonuses,
  openFossil,
  setMuseumDisplay,
} from './src/fossils.js';
import { panCamera, screenToWorld, zoomCamera } from './src/camera.js';
import { drawMinimap, drawWorld } from './src/world-renderer.js';
import { loadGame, saveGame } from './src/storage.js';
import {
  catchUpActiveSite,
  catchUpSite,
  foundSite,
  SITE_DEFINITIONS,
  switchSite,
} from './src/sites.js';

let state = createInitialState();
const worldCanvas = document.getElementById('world-canvas');
const worldContext = worldCanvas.getContext('2d');
const minimapCanvas = document.getElementById('minimap-canvas');
const minimapContext = minimapCanvas.getContext('2d');
const resourceStrip = document.getElementById('resource-strip');
const eventLog = document.getElementById('event-log');
const inspectTitle = document.getElementById('inspect-title');
const inspectCopy = document.getElementById('inspect-copy');
const inspectDetails = document.getElementById('inspect-details');
const toast = document.getElementById('toast');
const saveWarning = document.getElementById('save-warning');
const TILE_SIZE = 32;
const BELT_DIRECTIONS = ['east', 'south', 'west', 'north'];
const BUILDINGS = ['excavator', 'generator', 'smelter', 'crusher', 'fossil-finisher', 'splitter'];
const HOTKEY_BUILDS = ['belt', ...BUILDINGS, 'remove'];
const camera = {
  x: window.innerWidth / 2 - TILE_SIZE / 2,
  y: window.innerHeight / 2 - TILE_SIZE / 2,
  zoom: 1,
  tileSize: TILE_SIZE,
};

let selectedBuild = 'belt';
let selectedRotation = 0;
let beltDirectionIndex = 0;
let selectedMuseumSlot = 0;
let lastFrameTime = performance.now();
let lastHudUpdate = 0;
let toastTimeout;
let pointerPosition = null;
let dragState = null;
let beltRoutePreview = null;
let canvasScale = 1;
let minimapMap = null;
let lastViewportWidth = window.innerWidth;
let lastViewportHeight = window.innerHeight;
let gameReady = false;
let savingEnabled = true;
let saveInProgress = false;
let lastSaveError = '';
let renderedSiteNavigation = '';
let inspectedTile = null;

function activeSite() {
  return state.sites.find(site => site.id === state.activeSiteId);
}

function pushLog(message) {
  const item = document.createElement('li');
  item.textContent = message;
  eventLog.prepend(item);
  while (eventLog.children.length > 8) {
    eventLog.removeChild(eventLog.lastChild);
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('visible'), 1800);
}

function setSaveWarning(message) {
  saveWarning.textContent = message;
  saveWarning.hidden = !message;
}

async function persistState() {
  if (!gameReady || !savingEnabled || saveInProgress) {
    return;
  }
  saveInProgress = true;
  try {
    await saveGame(state);
    lastSaveError = '';
    setSaveWarning('');
  } catch (error) {
    const message = error.message || 'Unknown save error';
    setSaveWarning(`Save error: ${message}`);
    if (message !== lastSaveError) {
      pushLog(`Save failed: ${message}`);
      lastSaveError = message;
    }
  } finally {
    saveInProgress = false;
  }
}

function formatItem(item) {
  if (item.type === 'resource') return item.resource;
  if (item.type === 'fragment') return `${item.family} fragment`;
  if (item.type === 'unidentified-fossil') return 'unidentified fossil';
  return item.type;
}

function formatInventorySlot(item) {
  const name = formatItem(item);
  const label = name.charAt(0).toUpperCase() + name.slice(1);
  const amount = item.amount || 1;
  return amount > 1 ? `${label} ×${amount}` : label;
}

function resizeCanvas(canvas, context, width, height) {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return ratio;
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.x += (width - lastViewportWidth) / 2;
  camera.y += (height - lastViewportHeight) / 2;
  lastViewportWidth = width;
  lastViewportHeight = height;
  canvasScale = resizeCanvas(worldCanvas, worldContext, width, height);
  const minimapRect = minimapCanvas.getBoundingClientRect();
  resizeCanvas(minimapCanvas, minimapContext, minimapRect.width, minimapRect.height);
}

function renderResources() {
  const site = activeSite();
  resourceStrip.replaceChildren();
  for (const { resource, name, icon, amount } of getResourceDisplayRows(site.resources)) {
    const chip = document.createElement('span');
    chip.className = 'resource-chip';
    chip.dataset.resource = resource;
    chip.setAttribute('role', 'group');
    chip.setAttribute('aria-label', `${name}: ${amount}`);
    const iconElement = document.createElement('span');
    iconElement.className = 'material-icon';
    iconElement.dataset.resource = resource;
    iconElement.setAttribute('aria-hidden', 'true');
    iconElement.textContent = icon;
    const label = document.createElement('span');
    label.className = 'material-name';
    label.textContent = name;
    const amountElement = document.createElement('strong');
    amountElement.textContent = String(amount);
    chip.title = `${name}: ${amount}`;
    chip.append(iconElement, label, amountElement);
    resourceStrip.append(chip);
  }
  document.getElementById('power-value').textContent = String(Math.floor(site.resources.power));
}

function renderFossilInventory() {
  const site = activeSite();
  const unidentifiedList = document.getElementById('unidentified-list');
  const collectionList = document.getElementById('collection-list');
  const museumSlots = document.getElementById('museum-slots');
  unidentifiedList.replaceChildren();
  collectionList.replaceChildren();
  museumSlots.replaceChildren();

  if (site.unidentifiedFossils.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = 'No sealed fossils';
    unidentifiedList.append(empty);
  } else {
    for (const fossil of site.unidentifiedFossils) {
      const row = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = 'Sealed specimen';
      const openButton = document.createElement('button');
      openButton.type = 'button';
      openButton.dataset.openFossil = fossil.id;
      openButton.textContent = 'Open';
      row.append(label, openButton);
      unidentifiedList.append(row);
    }
  }

  document.getElementById('museum-count').textContent = `${site.museum.slots} slots`;
  for (let index = 0; index < site.museum.slots; index += 1) {
    const fossilId = site.museum.displayed[index];
    const fossil = state.collection.find(item => item.id === fossilId);
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = `museum-slot${selectedMuseumSlot === index ? ' selected' : ''}`;
    slot.dataset.museumSlot = String(index);
    slot.textContent = `Slot ${index + 1}: ${fossil ? fossil.name : 'empty'}`;
    museumSlots.append(slot);
  }

  if (state.collection.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = 'Collection is empty';
    collectionList.append(empty);
  } else {
    for (const fossil of state.collection) {
      const row = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = `${fossil.name} · ${fossil.rarity}`;
      const displayButton = document.createElement('button');
      displayButton.type = 'button';
      displayButton.dataset.displayFossil = fossil.id;
      displayButton.textContent = 'Display';
      row.append(label, displayButton);
      collectionList.append(row);
    }
  }
}

function renderBuildSelection() {
  for (const button of document.querySelectorAll('[data-build]')) {
    const buildId = button.dataset.build;
    if (buildId === 'remove') {
      button.classList.toggle('selected', selectedBuild === 'remove');
      button.title = 'Click a machine or belt tile to remove it; drag to sweep belts';
      continue;
    }
    const cost = buildId === 'belt' ? BELT_COST : BUILDING_DEFINITIONS[buildId].cost;
    const rows = getCostDisplayRows(cost);
    const affordable = canAffordCost(activeSite().resources, cost);
    const costElement = button.querySelector('.build-cost');
    const affordabilityElement = button.querySelector('.build-affordability');
    costElement.replaceChildren(...rows.map(({ resource, name, icon, amount }) => {
      const row = document.createElement('span');
      row.className = 'material-cost-row';
      row.dataset.resource = resource;
      const iconElement = document.createElement('span');
      iconElement.className = 'material-icon';
      iconElement.dataset.resource = resource;
      iconElement.setAttribute('aria-hidden', 'true');
      iconElement.textContent = icon;
      const label = document.createElement('span');
      label.className = 'material-name';
      label.textContent = name;
      const amountElement = document.createElement('strong');
      amountElement.textContent = String(amount);
      row.append(iconElement, label, amountElement);
      return row;
    }));
    button.classList.toggle('unaffordable', !affordable);
    button.dataset.affordable = String(affordable);
    button.title = `${button.querySelector('.build-name').textContent}: ${
      rows.map(({ name, amount }) => `${amount} ${name}`).join(', ')
    }`;
    affordabilityElement.textContent = affordable ? 'Materials ready' : 'Not enough materials';
    button.classList.toggle('selected', button.dataset.build === selectedBuild);
  }
  const hint = document.getElementById('build-hint');
  if (!selectedBuild) {
    hint.textContent = 'Click a tile to inspect · Esc clears build selection';
  } else if (selectedBuild === 'belt') {
    hint.textContent = `Drag between empty tiles to route · ${BELT_DIRECTIONS[beltDirectionIndex]} belt · R rotates`;
  } else if (selectedBuild === 'remove') {
    hint.textContent = 'Click to remove a machine or belt tile · Drag to sweep belts';
  } else {
    hint.textContent = 'Preview the footprint · R rotates';
  }
}

function selectBuild(buildId) {
  if (dragState?.kind === 'remove') {
    finishRemovalGesture(dragState);
  }
  selectedBuild = buildId;
  dragState = null;
  beltRoutePreview = null;
  renderBuildSelection();
}

function updateHud() {
  renderSiteNavigation();
  renderResources();
  renderFossilInventory();
  renderBuildSelection();
}

function renderSiteNavigation() {
  const navigationState = JSON.stringify({
    activeSiteId: state.activeSiteId,
    sites: state.sites.map(site => [site.id, site.name]),
  });
  if (navigationState === renderedSiteNavigation) {
    return;
  }
  renderedSiteNavigation = navigationState;

  const navigation = document.getElementById('site-navigation');
  navigation.replaceChildren();
  state.sites.forEach((site, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `site-tab${site.id === state.activeSiteId ? ' selected' : ''}`;
    button.dataset.siteId = site.id;
    button.dataset.siteNumber = String(index + 1);
    button.setAttribute('aria-label', `Switch to ${site.name}`);
    button.setAttribute('aria-pressed', String(site.id === state.activeSiteId));
    button.title = site.name;
    button.textContent = String(index + 1);
    navigation.append(button);
  });

  const available = SITE_DEFINITIONS.find(definition =>
    !state.sites.some(site => site.id === definition.id)
  );
  if (available) {
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'found-site';
    button.className = 'found-site';
    button.textContent = '+';
    button.setAttribute(
      'aria-label',
      `Found ${available.name} for ${available.foundingCost.iron} iron and ${available.foundingCost.stone} stone`
    );
    button.title = `Found ${available.name} · ${available.foundingCost.iron} iron / ${available.foundingCost.stone} stone`;
    navigation.append(button);
  }
}

function resizeAndDraw() {
  const width = worldCanvas.clientWidth;
  const height = worldCanvas.clientHeight;
  const topLeft = screenToWorld({ x: 0, y: 0 }, camera);
  const bottomRight = screenToWorld({ x: width, y: height }, camera);
  exploreSite(state, {
    left: topLeft.x - 2,
    top: topLeft.y - 2,
    right: bottomRight.x + 2,
    bottom: bottomRight.y + 2,
  });
  worldContext.setTransform(canvasScale, 0, 0, canvasScale, 0, 0);
  let buildingPreview = null;
  if (pointerPosition && selectedBuild && selectedBuild !== 'belt' && selectedBuild !== 'remove') {
    const tile = screenToWorld(pointerPosition, camera);
    buildingPreview = {
      type: 'building',
      buildingType: selectedBuild,
      x: tile.x,
      y: tile.y,
      rotation: selectedRotation,
      valid: isBuildingPlacementValid(state, selectedBuild, tile.x, tile.y, selectedRotation),
      affordable: canAffordCost(activeSite().resources, BUILDING_DEFINITIONS[selectedBuild].cost),
    };
  }
  drawWorld(
    worldContext,
    state,
    camera,
    { width, height },
    beltRoutePreview || buildingPreview
  );

  const site = activeSite();
  const mapWidth = minimapCanvas.clientWidth;
  const mapHeight = minimapCanvas.clientHeight;
  const mapScale = window.devicePixelRatio || 1;
  minimapContext.setTransform(mapScale, 0, 0, mapScale, 0, 0);
  minimapMap = drawMinimap(minimapContext, site, camera, {
    width: mapWidth,
    height: mapHeight,
    worldWidth: width,
    worldHeight: height,
  });

  if (pointerPosition && (selectedBuild === 'belt' || selectedBuild === 'remove')) {
    worldContext.save();
    worldContext.translate(camera.x, camera.y);
    worldContext.scale(camera.zoom * TILE_SIZE, camera.zoom * TILE_SIZE);
    const tile = screenToWorld(pointerPosition, camera);
    const removeMode = selectedBuild === 'remove';
    worldContext.fillStyle = removeMode ? 'rgba(210, 110, 87, 0.2)' : 'rgba(225, 207, 120, 0.18)';
    worldContext.fillRect(tile.x, tile.y, 1, 1);
    worldContext.strokeStyle = removeMode ? '#ed9b80' : '#f0d987';
    worldContext.lineWidth = 0.045;
    worldContext.strokeRect(tile.x + 0.02, tile.y + 0.02, 0.96, 0.96);
    worldContext.restore();
  }
}

function tileHasBuilding(site, tile) {
  return site.buildings.find(building => {
    const definition = BUILDING_DEFINITIONS[building.type];
    const rotated = building.rotation === 90 || building.rotation === 270;
    const width = rotated ? definition.height : definition.width;
    const height = rotated ? definition.width : definition.height;
    return tile.x >= building.x && tile.x < building.x + width &&
      tile.y >= building.y && tile.y < building.y + height;
  });
}

function setInspectorDetails(text, actions = []) {
  inspectDetails.replaceChildren(document.createTextNode(text));
  for (const action of actions) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'inspector-remove';
    if (action.buildingId !== undefined) {
      button.dataset.removeBuilding = action.buildingId;
    } else {
      button.dataset.removeBelt = action.beltId;
    }
    button.textContent = action.label;
    inspectDetails.append(button);
  }
}

function inspectTile(tile) {
  inspectedTile = { x: tile.x, y: tile.y };
  const site = activeSite();
  const building = tileHasBuilding(site, tile);
  if (building) {
    const ports = getBuildingPorts(building);
    const inputDirections = ports.filter(port => port.type === 'input').map(port => port.direction);
    const outputDirections = ports.filter(port => port.type === 'output').map(port => port.direction);
    inspectTitle.textContent = building.type.replaceAll('-', ' ');
    inspectCopy.textContent = `${building.x}, ${building.y} · rotated ${building.rotation}°`;
    setInspectorDetails([
      `Input ports: ${inputDirections.join(', ') || 'none'}`,
      `Output ports: ${outputDirections.join(', ') || 'none'}`,
      `Input items: ${building.inputSlots.map(formatInventorySlot).join(', ') || 'none'}`,
      `Output items: ${building.outputSlots.map(formatInventorySlot).join(', ') || 'none'}`,
      `Progress: ${Math.floor(building.progress || 0)}`,
    ].join('\n'), [{
      buildingId: building.id,
      label: 'Remove machine · refund',
    }]);
    return;
  }

  const belts = site.belts.filter(item => item.x === tile.x && item.y === tile.y);
  if (belts.length > 0) {
    inspectTitle.textContent = belts.length === 1 ? 'Transport belt' : 'Crossing belts';
    inspectCopy.textContent = `${belts.length} lane${belts.length === 1 ? '' : 's'} · tile ${tile.x}, ${tile.y}`;
    setInspectorDetails(belts.map(belt =>
      `${belt.direction} · ${belt.item ? `carrying ${formatItem(belt.item)}` : 'waiting for an item'}`
    ).join('\n'), belts.map(belt => ({
      beltId: belt.id,
      label: `Remove ${belt.direction} lane · refund`,
    })));
    return;
  }

  const node = site.resourceNodes.find(item => item.x === tile.x && item.y === tile.y);
  if (node) {
    inspectTitle.textContent = node.resource === 'fragment' ? 'Fossil bed' : `${node.resource} deposit`;
    inspectCopy.textContent = `${Math.max(0, node.remaining)} units remain at ${tile.x}, ${tile.y}.`;
    setInspectorDetails(node.resource === 'fragment' ? 'Excavate fragments, then prepare them at a fossil finisher.' : 'Place an excavator on this deposit.');
    return;
  }

  inspectTitle.textContent = 'Factory';
  inspectCopy.textContent = `Ground tile ${tile.x}, ${tile.y}`;
  setInspectorDetails('');
}

function removalMessage(description, result) {
  const parts = [`Removed ${description}`];
  const refunds = Object.entries(result.refunded || {})
    .filter(([, amount]) => amount > 0)
    .map(([resource, amount]) => `${amount} ${resource}`);
  if (refunds.length > 0) {
    parts.push(`refunded ${refunds.join(', ')}`);
  }
  if (result.returnedItems > 0) {
    parts.push(`returned ${result.returnedItems} item${result.returnedItems === 1 ? '' : 's'}`);
  }
  return parts.join(' · ');
}

function reportSingleRemoval(tile, description, result) {
  if (!result.ok) {
    showToast(result.reason);
    return;
  }
  const message = removalMessage(description, result);
  pushLog(`${message}.`);
  showToast(message);
  updateHud();
  inspectTile(tile);
  void persistState();
}

function removeAtTile(tile) {
  const site = activeSite();
  const building = tileHasBuilding(site, tile);
  if (building) {
    reportSingleRemoval(tile, building.type.replaceAll('-', ' '), removeBuilding(state, building.id));
    return;
  }
  const belts = site.belts.filter(belt => belt.x === tile.x && belt.y === tile.y);
  if (belts.length > 0) {
    const result = removeBeltsAtTiles(state, [tile]);
    reportSingleRemoval(tile, `${result.ok ? result.removed.length : belts.length} belt lane${belts.length === 1 ? '' : 's'}`, result);
    return;
  }
  showToast('Nothing to remove here');
}

function createRemovalSummary() {
  return { removedBelts: 0, refunded: {}, returnedItems: 0 };
}

function addRemovalToSummary(summary, result) {
  summary.removedBelts += result.removed.length;
  summary.returnedItems += result.returnedItems;
  for (const [resource, amount] of Object.entries(result.refunded)) {
    summary.refunded[resource] = (summary.refunded[resource] || 0) + amount;
  }
}

function sweepRemovalToTile(tile) {
  if (!dragState || dragState.kind !== 'remove' ||
      (tile.x === dragState.lastTile.x && tile.y === dragState.lastTile.y)) {
    return;
  }
  dragState.moved ||= tile.x !== dragState.startTile.x || tile.y !== dragState.startTile.y;
  const tiles = getGridLineTiles(dragState.lastTile, tile);
  const result = removeBeltsAtTiles(state, tiles);
  if (!result.ok) {
    showToast(result.reason);
  } else if (result.removed.length > 0) {
    addRemovalToSummary(dragState.summary, result);
    updateHud();
    inspectTile(tile);
    void persistState();
  }
  dragState.lastTile = tile;
}

function finishRemovalGesture(gesture) {
  if (!gesture || gesture.summary.removedBelts === 0) {
    return;
  }
  const summary = gesture.summary;
  const description = `${summary.removedBelts} belt lane${summary.removedBelts === 1 ? '' : 's'}`;
  const message = removalMessage(description, summary);
  pushLog(`${message}.`);
  showToast(message);
  updateHud();
  inspectTile(gesture.lastTile);
}

function placeSelected(tile) {
  const result = selectedBuild === 'belt'
    ? placeBelt(state, tile.x, tile.y, BELT_DIRECTIONS[beltDirectionIndex])
    : placeBuilding(state, selectedBuild, tile.x, tile.y, selectedRotation);

  if (!result.ok) {
    showToast(result.reason);
    return;
  }
  pushLog(`${selectedBuild.replaceAll('-', ' ')} placed at ${tile.x}, ${tile.y}.`);
  showToast('Construction placed');
  updateHud();
  inspectTile(tile);
  void persistState();
}

function commitBeltRoute(start, end) {
  const result = placeBeltRoute(state, start, end);
  if (!result.ok) {
    pushLog(`Belt route not placed: ${result.reason}.`);
    showToast(result.reason);
    return;
  }
  if (result.placed === 0) {
    const message = `Need ${result.remaining} iron to start this route`;
    pushLog(`${message}.`);
    showToast(message);
    return;
  }

  updateHud();
  inspectTile(end);
  if (result.remaining > 0) {
    const message = `Route partial · ${result.remaining} more iron needed`;
    pushLog(`Placed ${result.placed} belt tiles; ${result.remaining} iron is still needed for the full route.`);
    showToast(message);
  } else {
    pushLog(`Belt route placed · ${result.cost.iron} iron.`);
    showToast(`Belt route placed · ${result.cost.iron} iron`);
  }
  void persistState();
}

function handleWorldClick(event) {
  if (dragState?.moved) {
    return;
  }
  const rect = worldCanvas.getBoundingClientRect();
  const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  const tile = screenToWorld(point, camera);
  if (selectedBuild === 'remove') {
    removeAtTile(tile);
  } else if (selectedBuild) {
    placeSelected(tile);
  } else {
    inspectTile(tile);
  }
}

function recenterFromMinimap(event) {
  const rect = minimapCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const worldX = Math.max(-minimapMap.range, Math.min(
    minimapMap.range - 1,
    Math.floor((x - minimapMap.mapLeft) / minimapMap.scale - minimapMap.range)
  ));
  const worldY = Math.max(-minimapMap.range, Math.min(
    minimapMap.range - 1,
    Math.floor((y - minimapMap.mapTop) / minimapMap.scale - minimapMap.range)
  ));
  camera.x = worldCanvas.clientWidth / 2 - (worldX + 0.5) * TILE_SIZE * camera.zoom;
  camera.y = worldCanvas.clientHeight / 2 - (worldY + 0.5) * TILE_SIZE * camera.zoom;
}

function gameFrame(now) {
  const site = activeSite();
  const events = advanceSiteFrame(site, now, lastFrameTime, Date.now());
  lastFrameTime = now;
  for (const item of events.produced) {
    if (item.type !== 'power') {
      pushLog(`Produced ${formatItem(item)}.`);
    }
  }
  if (now - lastHudUpdate > 250) {
    updateHud();
    lastHudUpdate = now;
  }
  resizeAndDraw();
  requestAnimationFrame(gameFrame);
}

document.querySelector('.build-tools').addEventListener('click', event => {
  const button = event.target.closest('[data-build]');
  if (!button) return;
  selectBuild(button.dataset.build);
});

inspectDetails.addEventListener('click', event => {
  const button = event.target.closest('[data-remove-building], [data-remove-belt]');
  if (!button) return;
  const tile = inspectedTile;
  const buildingId = button.dataset.removeBuilding;
  const beltId = button.dataset.removeBelt;
  const result = buildingId !== undefined
    ? removeBuilding(state, activeSite().buildings.find(item => String(item.id) === buildingId)?.id)
    : removeBelt(state, activeSite().belts.find(item => String(item.id) === beltId)?.id);
  const description = button.dataset.removeBuilding !== undefined
    ? 'machine'
    : 'belt lane';
  if (tile) {
    reportSingleRemoval(tile, description, result);
  }
});

document.getElementById('cancel-build').addEventListener('click', () => {
  selectBuild(null);
});

document.getElementById('site-navigation').addEventListener('click', event => {
  const siteButton = event.target.closest('[data-site-id]');
  if (siteButton) {
    const site = state.sites.find(candidate => candidate.id === siteButton.dataset.siteId);
    const catchup = site ? catchUpSite(site, Date.now()) : null;
    const result = switchSite(state, siteButton.dataset.siteId);
    if (!result.ok) {
      showToast(result.reason);
      return;
    }
    dragState = null;
    beltRoutePreview = null;
    if (catchup?.elapsedSeconds >= 60) {
      pushLog(`${result.site.name} caught up by ${Math.floor(catchup.elapsedSeconds / 60)} minutes.`);
    }
    lastFrameTime = performance.now();
    selectedMuseumSlot = 0;
    document.getElementById('site-name').textContent = result.site.name;
    inspectTitle.textContent = result.site.name;
    inspectCopy.textContent =
      'Place belts from machine ports. Items enter inventory only when a belt reaches the warehouse.';
    inspectDetails.textContent = '';
    camera.x = worldCanvas.clientWidth / 2 - TILE_SIZE / 2;
    camera.y = worldCanvas.clientHeight / 2 - TILE_SIZE / 2;
    pushLog(`Now viewing ${result.site.name}.`);
    updateHud();
    void persistState();
    return;
  }

  if (event.target.closest('#found-site')) {
    const definition = SITE_DEFINITIONS.find(candidate =>
      !state.sites.some(site => site.id === candidate.id)
    );
    if (!definition) {
      showToast('All dig sites have been founded');
      return;
    }
    const result = foundSite(state, definition.id);
    if (!result.ok) {
      showToast(result.reason);
      return;
    }
    result.site.lastSimulatedAt = Date.now();
    pushLog(`${result.site.name} founded with its own factory and materials.`);
    showToast(`${result.site.name} founded · switch with the numbered site tabs`);
    updateHud();
    void persistState();
  }
});

document.getElementById('expand-museum').addEventListener('click', () => {
  const result = expandMuseum(state, state.activeSiteId);
  if (result.ok) {
    selectedMuseumSlot = activeSite().museum.slots - 1;
    pushLog('Museum expanded with iron and stone.');
    showToast('Museum slot added');
    updateHud();
    void persistState();
  } else {
    showToast(result.reason);
  }
});

document.querySelector('.inventory-panel').addEventListener('click', event => {
  const openButton = event.target.closest('[data-open-fossil]');
  if (openButton) {
    const result = openFossil(state, state.activeSiteId, openButton.dataset.openFossil);
    if (result.ok) {
      pushLog(`Opened ${result.fossil.rarity} ${result.fossil.family} fossil.`);
      showToast(`Discovery: ${result.fossil.name}`);
      updateHud();
      void persistState();
    } else {
      showToast(result.reason);
    }
    return;
  }

  const slotButton = event.target.closest('[data-museum-slot]');
  if (slotButton) {
    selectedMuseumSlot = Number(slotButton.dataset.museumSlot);
    updateHud();
    return;
  }

  const displayButton = event.target.closest('[data-display-fossil]');
  if (displayButton) {
    const result = setMuseumDisplay(
      state,
      state.activeSiteId,
      displayButton.dataset.displayFossil,
      selectedMuseumSlot
    );
    if (result.ok) {
      const bonuses = getMuseumBonuses(state, state.activeSiteId);
      pushLog(`Museum bonuses: +${Math.round(bonuses.digSpeed * 100)}% dig speed.`);
      showToast('Specimen displayed at this site');
      updateHud();
      void persistState();
    } else {
      showToast(result.reason);
    }
  }
});

worldCanvas.addEventListener('pointermove', event => {
  const rect = worldCanvas.getBoundingClientRect();
  pointerPosition = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  if (dragState?.kind === 'pan') {
    const dx = event.clientX - dragState.x;
    const dy = event.clientY - dragState.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) {
      dragState.moved = true;
      panCamera(camera, dx, dy);
    }
    dragState.x = event.clientX;
    dragState.y = event.clientY;
  } else if (dragState?.kind === 'belt-route') {
    const endTile = screenToWorld(pointerPosition, camera);
    dragState.endTile = endTile;
    dragState.moved = dragState.moved ||
      endTile.x !== dragState.startTile.x ||
      endTile.y !== dragState.startTile.y;
    beltRoutePreview = {
      type: 'belt-route',
      start: dragState.startTile,
      end: endTile,
      ...previewBeltRoute(state, dragState.startTile, endTile),
    };
  } else if (dragState?.kind === 'remove') {
    sweepRemovalToTile(screenToWorld(pointerPosition, camera));
  }
});

worldCanvas.addEventListener('pointerdown', event => {
  const isPanGesture =
    event.button === 2 ||
    event.button === 1 ||
    event.shiftKey ||
    (event.pointerType === 'touch' && !selectedBuild);
  if (isPanGesture) {
    dragState = { kind: 'pan', x: event.clientX, y: event.clientY, moved: false };
    worldCanvas.setPointerCapture(event.pointerId);
  } else if (event.button === 0 && selectedBuild === 'belt') {
    const rect = worldCanvas.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const startTile = screenToWorld(point, camera);
    dragState = {
      kind: 'belt-route',
      startTile,
      endTile: startTile,
      moved: false,
    };
    worldCanvas.setPointerCapture(event.pointerId);
  } else if (event.button === 0 && selectedBuild === 'remove') {
    const rect = worldCanvas.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const startTile = screenToWorld(point, camera);
    dragState = {
      kind: 'remove',
      startTile,
      lastTile: startTile,
      moved: false,
      summary: createRemovalSummary(),
    };
    worldCanvas.setPointerCapture(event.pointerId);
  }
});

worldCanvas.addEventListener('pointerup', event => {
  if (dragState?.kind === 'remove') {
    const rect = worldCanvas.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const endTile = screenToWorld(point, camera);
    const removalGesture = dragState;
    sweepRemovalToTile(endTile);
    dragState = null;
    if (!removalGesture.moved) {
      removeAtTile(removalGesture.startTile);
    } else {
      finishRemovalGesture(removalGesture);
    }
    return;
  }

  if (dragState?.kind === 'belt-route') {
    const rect = worldCanvas.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    pointerPosition = point;
    const endTile = screenToWorld(point, camera);
    const routeGesture = dragState;
    const moved = routeGesture.moved ||
      endTile.x !== routeGesture.startTile.x ||
      endTile.y !== routeGesture.startTile.y;
    dragState = null;
    beltRoutePreview = null;
    if (moved) {
      commitBeltRoute(routeGesture.startTile, endTile);
    } else if (event.button === 0) {
      handleWorldClick(event);
    }
    return;
  }

  if (dragState?.kind === 'pan') {
    const panGesture = dragState;
    dragState = null;
    if (panGesture.moved) {
      return;
    }
    if (event.button === 0 && event.pointerType === 'touch') {
      handleWorldClick(event);
    }
    return;
  }

  if (event.button === 0) {
    handleWorldClick(event);
  }
  dragState = null;
});

worldCanvas.addEventListener('pointercancel', () => {
  if (dragState?.kind === 'remove') {
    finishRemovalGesture(dragState);
  }
  dragState = null;
  beltRoutePreview = null;
});

worldCanvas.addEventListener('contextmenu', event => event.preventDefault());
worldCanvas.addEventListener('wheel', event => {
  event.preventDefault();
  const rect = worldCanvas.getBoundingClientRect();
  zoomCamera(camera, event.deltaY, { x: event.clientX - rect.left, y: event.clientY - rect.top });
}, { passive: false });

minimapCanvas.addEventListener('click', recenterFromMinimap);
window.addEventListener('resize', resize);
window.addEventListener('keydown', event => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
  if (/^[1-8]$/.test(event.key)) {
    selectBuild(HOTKEY_BUILDS[Number(event.key) - 1]);
  } else if (event.key.toLowerCase() === 'r') {
    if (selectedBuild === 'belt') {
      beltDirectionIndex = (beltDirectionIndex + 1) % BELT_DIRECTIONS.length;
    } else if (selectedBuild && selectedBuild !== 'remove') {
      selectedRotation = (selectedRotation + 90) % 360;
    }
    renderBuildSelection();
  } else if (event.key === 'Escape') {
    selectBuild(null);
  } else if (['ArrowLeft', 'a', 'A'].includes(event.key)) {
    panCamera(camera, 48, 0);
  } else if (['ArrowRight', 'd', 'D'].includes(event.key)) {
    panCamera(camera, -48, 0);
  } else if (['ArrowUp', 'w', 'W'].includes(event.key)) {
    panCamera(camera, 0, 48);
  } else if (['ArrowDown', 's', 'S'].includes(event.key)) {
    panCamera(camera, 0, -48);
  }
});

async function startGame() {
  try {
    const savedState = await loadGame();
    if (savedState) {
      state = savedState;
      const now = Date.now();
      let elapsedSeconds = 0;
      for (const site of state.sites) {
        const catchup = catchUpSite(site, now, savedState.lastSavedAt);
        elapsedSeconds = Math.max(elapsedSeconds, catchup.elapsedSeconds);
      }
      pushLog('Factory restored from local save.');
      if (elapsedSeconds >= 1) {
        pushLog(`Sites caught up by ${Math.floor(Math.min(elapsedSeconds, 21600) / 60)} offline minutes.`);
      }
    } else {
      pushLog('New Basalt Basin factory ready.');
    }
  } catch (error) {
    savingEnabled = false;
    const message = error.message || 'Unknown load error';
    setSaveWarning(`Save not loaded. Playing without saving to protect existing data. ${message}`);
    pushLog(`Factory save was not loaded: ${message}`);
  }

  document.getElementById('site-name').textContent = activeSite().name;
  document.getElementById('inspect-title').textContent = activeSite().name;
  document.getElementById('inspect-copy').textContent =
    'Place belts from machine ports. Items enter inventory only when a belt reaches the warehouse.';
  resize();
  renderBuildSelection();
  updateHud();
  gameReady = true;
  void persistState();
  window.setInterval(() => { void persistState(); }, 5000);
  window.addEventListener('pagehide', () => { void persistState(); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void persistState();
    } else {
      const catchup = catchUpActiveSite(state, Date.now());
      lastFrameTime = performance.now();
      if (catchup.elapsedSeconds >= 1) {
        pushLog(`Factory caught up by ${Math.floor(Math.min(catchup.elapsedSeconds, 21600) / 60)} offline minutes.`);
      }
      updateHud();
      resizeAndDraw();
      void persistState();
    }
  });
  requestAnimationFrame(gameFrame);
}

startGame();
