import test from 'node:test';
import assert from 'node:assert/strict';

async function loadCamera() {
  try {
    return await import('../src/camera.js');
  } catch {
    assert.fail('camera helpers are not implemented');
  }
}

test('convertsScreenPointToTile', async () => {
  const { screenToWorld } = await loadCamera();
  const camera = { x: 10, y: 20, zoom: 2, tileSize: 32 };

  assert.deepEqual(screenToWorld({ x: 148, y: 212 }, camera), { x: 2, y: 3 });
});

test('keepsZoomAnchorStable', async () => {
  const { screenToWorld, zoomCamera } = await loadCamera();
  const camera = { x: -40, y: 30, zoom: 1, tileSize: 32 };
  const anchor = { x: 200, y: 100 };
  const tileUnderAnchor = screenToWorld(anchor, camera);

  zoomCamera(camera, -500, anchor);

  assert.deepEqual(screenToWorld(anchor, camera), tileUnderAnchor);
});

test('pansCamera', async () => {
  const { panCamera } = await loadCamera();
  const camera = { x: 20, y: -10, zoom: 1.5, tileSize: 32 };

  panCamera(camera, 12, -6);

  assert.deepEqual(camera, { x: 32, y: -16, zoom: 1.5, tileSize: 32 });
});
