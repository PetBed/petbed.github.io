import { tickSite, createInitialState } from './src/game-core.js';
import { placeBelt, placeBuilding } from './src/world-grid.js';
import { BUILDING_DEFINITIONS } from './src/buildings.js';
import {
  expandMuseum,
  getMuseumBonuses,
  openFossil,
  setMuseumDisplay,
} from './src/fossils.js';
import { panCamera, screenToWorld, zoomCamera } from './src/camera.js';
import { drawMinimap, drawWorld } from './src/world-renderer.js';
import { loadGame, saveGame } from './src/storage.js';
import { catchUpSite, foundSite, SITE_DEFINITIONS, switchSite } from './src/sites.js';

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
const RESOURCE_LABELS = {
  coal: 'Coal',
  iron: 'Iron',
  copper: 'Copper',
  stone: 'Stone',
  sediment: 'Sediment',
  steel: 'Steel',
  concrete: 'Concrete',
};
const RESOURCE_MARKS = {
  coal: 'C',
  iron: 'Fe',
  copper: 'Cu',
  stone: 'S',
  sediment: 'D',
  steel: 'St',
  concrete: 'Co',
};
const BELT_DIRECTIONS = ['east', 'south', 'west', 'north'];
const BUILDINGS = ['excavator', 'generator', 'smelter', 'crusher', 'fossil-finisher', 'splitter'];
const HOTKEY_BUILDS = ['belt', ...BUILDINGS];
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
let canvasScale = 1;
let minimapMap = null;
let lastViewportWidth = window.innerWidth;
let lastViewportHeight = window.innerHeight;
let gameReady = false;
let savingEnabled = true;
let saveInProgress = false;
let lastSaveError = '';
let renderedSiteNavigation = '';

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
  for (const [key, label] of Object.entries(RESOURCE_LABELS)) {
    const chip = document.createElement('span');
    chip.className = 'resource-chip';
    const mark = document.createElement('span');
    mark.textContent = RESOURCE_MARKS[key];
    const amount = document.createElement('strong');
    amount.textContent = String(Math.floor(site.resources[key] || 0));
    chip.title = label;
    chip.append(mark, amount);
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
    button.classList.toggle('selected', button.dataset.build === selectedBuild);
  }
  const hint = document.getElementById('build-hint');
  if (!selectedBuild) {
    hint.textContent = 'Click a tile to inspect · Esc clears build selection';
  } else if (selectedBuild === 'belt') {
    hint.textContent = `${BELT_DIRECTIONS[beltDirectionIndex]} belt · R rotates`;
    return;
  } else {
    const cost = BUILDING_DEFINITIONS[selectedBuild].cost;
    hint.textContent = `${Object.entries(cost).map(([material, amount]) => `${amount} ${material}`).join(' · ')} · R rotates`;
  }
}

function updateHud() {
  renderSiteNavigation();
  renderResources();
  renderFossilInventory();
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
  worldContext.setTransform(canvasScale, 0, 0, canvasScale, 0, 0);
  drawWorld(worldContext, state, camera, { width, height });

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

  if (pointerPosition && selectedBuild) {
    worldContext.save();
    worldContext.translate(camera.x, camera.y);
    worldContext.scale(camera.zoom * TILE_SIZE, camera.zoom * TILE_SIZE);
    const tile = screenToWorld(pointerPosition, camera);
    worldContext.fillStyle = 'rgba(225, 207, 120, 0.18)';
    worldContext.fillRect(tile.x, tile.y, 1, 1);
    worldContext.strokeStyle = '#f0d987';
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

function inspectTile(tile) {
  const site = activeSite();
  const building = tileHasBuilding(site, tile);
  if (building) {
    inspectTitle.textContent = building.type.replaceAll('-', ' ');
    inspectCopy.textContent = `${building.x}, ${building.y} · facing ${building.rotation}°`;
    inspectDetails.textContent = `Input ${building.inputSlots.length} · Output ${building.outputSlots.length} · Progress ${Math.floor(building.progress || 0)}`;
    return;
  }

  const belt = site.belts.find(item => item.x === tile.x && item.y === tile.y);
  if (belt) {
    inspectTitle.textContent = 'Transport belt';
    inspectCopy.textContent = `${belt.direction} · tile ${tile.x}, ${tile.y}`;
    inspectDetails.textContent = belt.item ? `Carrying ${formatItem(belt.item)}` : 'Waiting for an item';
    return;
  }

  const node = site.resourceNodes.find(item => item.x === tile.x && item.y === tile.y);
  if (node) {
    inspectTitle.textContent = node.resource === 'fragment' ? 'Fossil bed' : `${node.resource} deposit`;
    inspectCopy.textContent = `${Math.max(0, node.remaining)} units remain at ${tile.x}, ${tile.y}.`;
    inspectDetails.textContent = node.resource === 'fragment' ? 'Excavate fragments, then prepare them at a fossil finisher.' : 'Place an excavator on this deposit.';
    return;
  }

  inspectTitle.textContent = 'Factory';
  inspectCopy.textContent = `Ground tile ${tile.x}, ${tile.y}`;
  inspectDetails.textContent = '';
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

function handleWorldClick(event) {
  if (dragState?.moved) {
    return;
  }
  const rect = worldCanvas.getBoundingClientRect();
  const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  const tile = screenToWorld(point, camera);
  if (selectedBuild) {
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
  const deltaSeconds = Math.min(1, Math.max(0, (now - lastFrameTime) / 1000));
  lastFrameTime = now;
  const site = activeSite();
  const events = tickSite(site, deltaSeconds);
  site.lastSimulatedAt = Date.now();
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
  selectedBuild = button.dataset.build;
  renderBuildSelection();
});

document.getElementById('cancel-build').addEventListener('click', () => {
  selectedBuild = null;
  renderBuildSelection();
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
  if (dragState) {
    const dx = event.clientX - dragState.x;
    const dy = event.clientY - dragState.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) {
      dragState.moved = true;
      panCamera(camera, dx, dy);
    }
    dragState.x = event.clientX;
    dragState.y = event.clientY;
  }
});

worldCanvas.addEventListener('pointerdown', event => {
  const isPanGesture = event.button === 2 || event.button === 1 || event.shiftKey || event.pointerType === 'touch';
  if (isPanGesture) {
    dragState = { x: event.clientX, y: event.clientY, moved: false, isPanGesture };
    worldCanvas.setPointerCapture(event.pointerId);
  }
});

worldCanvas.addEventListener('pointerup', event => {
  if (dragState?.moved) {
    dragState = null;
    return;
  }
  if (event.button === 0 && (!dragState?.isPanGesture || event.pointerType === 'touch')) {
    handleWorldClick(event);
  }
  dragState = null;
});

worldCanvas.addEventListener('pointercancel', () => {
  dragState = null;
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
  if (/^[1-7]$/.test(event.key)) {
    selectedBuild = HOTKEY_BUILDS[Number(event.key) - 1];
    renderBuildSelection();
  } else if (event.key.toLowerCase() === 'r') {
    if (selectedBuild === 'belt') {
      beltDirectionIndex = (beltDirectionIndex + 1) % BELT_DIRECTIONS.length;
    } else {
      selectedRotation = (selectedRotation + 90) % 360;
    }
    renderBuildSelection();
  } else if (event.key === 'Escape') {
    selectedBuild = null;
    renderBuildSelection();
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
    }
  });
  requestAnimationFrame(gameFrame);
}

startGame();
