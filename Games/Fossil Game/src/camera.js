const MIN_ZOOM = 0.35;
const MAX_ZOOM = 3.5;

export function screenToWorld(point, camera) {
  const tileSize = camera.tileSize || 32;
  const scaledTileSize = tileSize * camera.zoom;
  return {
    x: Math.floor((point.x - camera.x) / scaledTileSize),
    y: Math.floor((point.y - camera.y) / scaledTileSize),
  };
}

export function panCamera(camera, dx, dy) {
  camera.x += dx;
  camera.y += dy;
  return camera;
}

export function zoomCamera(camera, delta, anchor) {
  const previousZoom = camera.zoom;
  const nextZoom = Math.min(
    MAX_ZOOM,
    Math.max(MIN_ZOOM, previousZoom * Math.exp(-delta * 0.001))
  );
  const scaleRatio = nextZoom / previousZoom;

  camera.x = anchor.x - (anchor.x - camera.x) * scaleRatio;
  camera.y = anchor.y - (anchor.y - camera.y) * scaleRatio;
  camera.zoom = nextZoom;
  return camera;
}
