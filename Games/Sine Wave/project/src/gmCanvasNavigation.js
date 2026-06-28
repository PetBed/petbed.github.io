const ZOOM_MIN = 0.35;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 1.12;

export function clampZoom(zoom) {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));
}

export function getGmScrollContainer(rootEl) {
  if (!rootEl) return null;
  return rootEl.querySelector('.gm-canvas')?.parentElement ?? rootEl;
}

export function screenToCanvasPoint(rootEl, clientX, clientY) {
  const scrollContainer = getGmScrollContainer(rootEl);
  if (!scrollContainer) {
    return { x: clientX, y: clientY };
  }

  const rect = scrollContainer.getBoundingClientRect();
  return {
    x: clientX - rect.left + scrollContainer.scrollLeft,
    y: clientY - rect.top + scrollContainer.scrollTop,
  };
}

export function getViewportCenter(rootEl) {
  const scrollContainer = getGmScrollContainer(rootEl);
  if (!scrollContainer) {
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }

  return {
    x: scrollContainer.scrollLeft + scrollContainer.clientWidth / 2,
    y: scrollContainer.scrollTop + scrollContainer.clientHeight / 2,
  };
}

export function isGmCanvasBackground(target, rootEl) {
  if (!target || !rootEl?.contains(target)) return false;
  if (target === rootEl) return true;
  if (target.closest('.canvas-element')) return false;
  if (target.closest('.mv-panel, .mv-modal, .mv-tracker-cursor, math-field')) return false;
  if (target.closest('button.mv-btn')) return false;
  return !!target.closest('.gm-canvas, .gm-styles');
}

export function syncElementPosition(element, pos, animated = false) {
  if (!element?.pos || typeof element.translateElement !== 'function') return;

  const next = { x: pos.x, y: pos.y };
  element.settings?.set?.('pos', { x: next.x, y: next.y });
  element.translateElement(next, animated);
}

function scaleElementSize(element, scaleFactor) {
  if (!element?.size || typeof element.resizeElement !== 'function') return;

  const nextSize = {
    width: element.size.width * scaleFactor,
    height: element.size.height * scaleFactor,
  };
  element.resizeElement(nextSize);
  element.settings?.set?.('size', { width: nextSize.width, height: nextSize.height });
}

function scaleElementTypography(element, scaleFactor) {
  if (typeof element.setFontSize !== 'function') return;

  const currentSize = element.settings?.get?.('font_size') ?? element.font_size ?? 50;
  const nextSize = Math.max(10, Math.round(currentSize * scaleFactor));
  element.setFontSize(nextSize);
}

function scalePath(path, scaleFactor, focalPoint) {
  if (!path?.points?.length) return;

  path.points = path.points.map(([x, y]) => [
    focalPoint.x + (x - focalPoint.x) * scaleFactor,
    focalPoint.y + (y - focalPoint.y) * scaleFactor,
  ]);
  path.width = (path.width || 1) * scaleFactor;
  path.update?.();
  path.emitChangeEvent?.();
}

function translatePath(path, dx, dy) {
  if (!path?.points?.length) return;

  path.points = path.points.map(([x, y]) => [x + dx, y + dy]);
  path.update?.();
  path.emitChangeEvent?.();
}

function finalizeModelLayout(model) {
  model.adjustCanvasToContainAllElements?.();
}

export function panCanvasModel(model, dx, dy) {
  if (!model || (!dx && !dy)) return;

  model.elements().forEach((element) => {
    syncElementPosition(element, {
      x: element.pos.x + dx,
      y: element.pos.y + dy,
    });
  });

  model.paths().forEach((path) => translatePath(path, dx, dy));
  finalizeModelLayout(model);
}

export function zoomCanvasElement(element, scaleFactor, focalPoint) {
  if (!element?.pos || scaleFactor === 1) return;

  syncElementPosition(element, {
    x: focalPoint.x + (element.pos.x - focalPoint.x) * scaleFactor,
    y: focalPoint.y + (element.pos.y - focalPoint.y) * scaleFactor,
  });
  scaleElementTypography(element, scaleFactor);
  scaleElementSize(element, scaleFactor);
}

export function zoomCanvasModel(model, scaleFactor, focalPoint) {
  if (!model || scaleFactor === 1) return;

  model.elements().forEach((element) => zoomCanvasElement(element, scaleFactor, focalPoint));
  model.paths().forEach((path) => scalePath(path, scaleFactor, focalPoint));
  finalizeModelLayout(model);
}

export function applyCreatedElementZoom(element, zoomLevel) {
  if (!element || zoomLevel === 1) return;

  scaleElementTypography(element, zoomLevel);
  scaleElementSize(element, zoomLevel);
}

export function attachGmCanvasNavigation({ rootEl, getModel, zoomRef, onZoomChange }) {
  const noop = () => {};
  const emptyApi = { zoomIn: noop, zoomOut: noop, resetZoom: noop };

  if (!rootEl) {
    return { detach: noop, api: emptyApi };
  }

  const panState = {
    active: false,
    startX: 0,
    startY: 0,
    pointerId: null,
  };

  const setZoom = (nextZoom) => {
    const clamped = clampZoom(nextZoom);
    zoomRef.current = clamped;
    onZoomChange?.(clamped);
    return clamped;
  };

  const zoomByFactor = (factor, clientX, clientY) => {
    const model = getModel();
    if (!model) return;

    const currentZoom = zoomRef.current || 1;
    const nextZoom = setZoom(currentZoom * factor);
    const appliedFactor = nextZoom / currentZoom;
    if (Math.abs(appliedFactor - 1) < 0.001) return;

    const focalPoint = Number.isFinite(clientX) && Number.isFinite(clientY)
      ? screenToCanvasPoint(rootEl, clientX, clientY)
      : getViewportCenter(rootEl);

    zoomCanvasModel(model, appliedFactor, focalPoint);
  };

  const onWheel = (event) => {
    const model = getModel();
    if (!model) return;
    if (!isGmCanvasBackground(event.target, rootEl)) return;

    event.preventDefault();
    const factor = event.deltaY > 0 ? 1 / ZOOM_STEP : ZOOM_STEP;
    zoomByFactor(factor, event.clientX, event.clientY);
  };

  const endPan = (event) => {
    if (!panState.active) return;

    const scrollContainer = getGmScrollContainer(rootEl);
    if (scrollContainer && panState.pointerId != null) {
      try {
        scrollContainer.releasePointerCapture(panState.pointerId);
      } catch {
        // Ignore release failures for synthetic pointers.
      }
    }

    if (scrollContainer) {
      scrollContainer.style.cursor = '';
    }

    panState.active = false;
    panState.pointerId = null;
  };

  const onPointerDown = (event) => {
    const isPanButton = event.button === 1 || (event.button === 0 && event.altKey);
    if (!isPanButton) return;
    if (!isGmCanvasBackground(event.target, rootEl)) return;

    event.preventDefault();
    panState.active = true;
    panState.startX = event.clientX;
    panState.startY = event.clientY;
    panState.pointerId = event.pointerId;

    const scrollContainer = getGmScrollContainer(rootEl);
    if (scrollContainer) {
      scrollContainer.style.cursor = 'grabbing';
      try {
        scrollContainer.setPointerCapture(event.pointerId);
      } catch {
        // Ignore capture failures for synthetic pointers.
      }
    }
  };

  const onPointerMove = (event) => {
    if (!panState.active || event.pointerId !== panState.pointerId) return;

    const model = getModel();
    if (!model) return;

    const dx = event.clientX - panState.startX;
    const dy = event.clientY - panState.startY;
    if (!dx && !dy) return;

    panState.startX = event.clientX;
    panState.startY = event.clientY;
    panCanvasModel(model, dx, dy);
  };

  rootEl.addEventListener('wheel', onWheel, { passive: false });
  rootEl.addEventListener('pointerdown', onPointerDown);
  rootEl.addEventListener('pointermove', onPointerMove);
  rootEl.addEventListener('pointerup', endPan);
  rootEl.addEventListener('pointercancel', endPan);

  const api = {
    zoomIn(clientX, clientY) {
      zoomByFactor(ZOOM_STEP, clientX, clientY);
    },
    zoomOut(clientX, clientY) {
      zoomByFactor(1 / ZOOM_STEP, clientX, clientY);
    },
    resetZoom() {
      const model = getModel();
      if (!model) return;

      const currentZoom = zoomRef.current || 1;
      if (currentZoom === 1) return;

      const focalPoint = getViewportCenter(rootEl);
      zoomCanvasModel(model, 1 / currentZoom, focalPoint);
      setZoom(1);
    },
  };

  const detach = () => {
    rootEl.removeEventListener('wheel', onWheel);
    rootEl.removeEventListener('pointerdown', onPointerDown);
    rootEl.removeEventListener('pointermove', onPointerMove);
    rootEl.removeEventListener('pointerup', endPan);
    rootEl.removeEventListener('pointercancel', endPan);
    endPan({});
  };

  return { detach, api };
}
