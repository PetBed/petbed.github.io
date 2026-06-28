import { useEffect, useRef } from 'react';

function landmarksToScreenPoint(landmarks, videoEl) {
  const indexTip = landmarks[8];
  const thumbTip = landmarks[4];
  const midpointX = (thumbTip.x + indexTip.x) / 2;
  const midpointY = (thumbTip.y + indexTip.y) / 2;

  if (!videoEl?.videoWidth) return null;

  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const videoAspectRatio = videoEl.videoWidth / videoEl.videoHeight;
  const screenAspectRatio = screenWidth / screenHeight;

  if (screenAspectRatio > videoAspectRatio) {
    const renderHeight = screenWidth / videoAspectRatio;
    const offsetY = (renderHeight - screenHeight) / 2;
    return {
      x: (1 - midpointX) * screenWidth,
      y: (midpointY * renderHeight) - offsetY,
    };
  }

  const renderWidth = screenHeight * videoAspectRatio;
  const offsetX = (renderWidth - screenWidth) / 2;
  return {
    x: ((1 - midpointX) * renderWidth) - offsetX,
    y: midpointY * screenHeight,
  };
}

function isHandPinching(landmarks) {
  const indexTip = landmarks[8];
  const thumbTip = landmarks[4];
  const dist = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
  return dist < 0.06;
}

function isHandFist(landmarks) {
  const palm = landmarks[9];
  const fingerTips = [8, 12, 16, 20];
  const avgTipDist = fingerTips.reduce((sum, idx) => {
    const tip = landmarks[idx];
    return sum + Math.hypot(tip.x - palm.x, tip.y - palm.y);
  }, 0) / fingerTips.length;

  if (avgTipDist > 0.1) return false;

  const indexExtended = Math.hypot(
    landmarks[8].x - landmarks[5].x,
    landmarks[8].y - landmarks[5].y
  ) > 0.12;
  const middleExtended = Math.hypot(
    landmarks[12].x - landmarks[9].x,
    landmarks[12].y - landmarks[9].y
  ) > 0.12;

  return !indexExtended && !middleExtended;
}

function getGraphPanelAtPoint(x, y, isTrackingOverlay) {
  const stack = document.elementsFromPoint(x, y);
  for (const el of stack) {
    if (isTrackingOverlay(el)) continue;
    const panel = el.closest('[data-graph-panel]');
    if (panel) return panel;
  }
  return null;
}

function getGraphableEquationAtPoint(x, y, isTrackingOverlay) {
  const stack = document.elementsFromPoint(x, y);
  for (const el of stack) {
    if (isTrackingOverlay(el)) continue;
    if (el.closest('[data-graph-panel]')) return null;
    const host = el.closest('.canvas-element');
    if (!host) continue;
    const button = host.querySelector('.gm-graph-button:not(.gm-graph-button--hidden)');
    if (button) return host;
  }
  return null;
}

function processGraphHandGestures(handFrames, handStateRef, mainRef, onGraphHandGesture, isTrackingOverlay) {
  if (typeof onGraphHandGesture !== 'function' || handFrames.length === 0) {
    return new Set();
  }

  const consumedHands = new Set();

  handFrames.forEach((frame) => {
    frame.overGraph = !!getGraphPanelAtPoint(frame.x, frame.y, isTrackingOverlay);
    frame.overEquation = !!getGraphableEquationAtPoint(frame.x, frame.y, isTrackingOverlay);

    const state = handStateRef.current[frame.i];
    if (frame.isFist && frame.overGraph) {
      const panel = getGraphPanelAtPoint(frame.x, frame.y, isTrackingOverlay);
      if (panel) state.fistTargetGraphPanel = panel;
    }
    if (frame.isFist && frame.overEquation) {
      const host = getGraphableEquationAtPoint(frame.x, frame.y, isTrackingOverlay);
      if (host) state.fistTargetEquationHost = host;
    }

    if (frame.wasFist && !frame.isFist) {
      state.fistGestureConsumed = false;
    }
  });

  if (handFrames.length === 2) {
    for (const pincher of handFrames) {
      if (pincher.wasPinching || !pincher.isPinching || pincher.overGraph) continue;

      const pointer = handFrames.find((hand) => hand.i !== pincher.i);
      if (!pointer?.overGraph || pointer.isPinching) continue;

      const state = handStateRef.current[pincher.i];
      if (state.graphPinchConsumed) continue;

      const graphPanel = getGraphPanelAtPoint(pointer.x, pointer.y, isTrackingOverlay);
      if (!graphPanel) continue;

      onGraphHandGesture({ type: 'toggleAudio', graphPanel, x: pointer.x, y: pointer.y });
      state.graphPinchConsumed = true;
      consumedHands.add(pincher.i);
      resetHandInteractionState(state, mainRef);
    }
  }

  for (const frame of handFrames) {
    if (!frame.wasFist || frame.isFist) continue;

    const state = handStateRef.current[frame.i];
    if (state.fistGestureConsumed) continue;

    if (state.fistTargetGraphPanel) {
      onGraphHandGesture({
        type: 'close',
        graphPanel: state.fistTargetGraphPanel,
        x: frame.x,
        y: frame.y,
      });
      state.fistTargetGraphPanel = null;
      state.fistTargetEquationHost = null;
      state.fistGestureConsumed = true;
      consumedHands.add(frame.i);
      resetHandInteractionState(state, mainRef);
      continue;
    }

    if (state.fistTargetEquationHost) {
      onGraphHandGesture({
        type: 'open',
        equationHost: state.fistTargetEquationHost,
        x: frame.x,
        y: frame.y,
      });
      state.fistTargetEquationHost = null;
      state.fistGestureConsumed = true;
      consumedHands.add(frame.i);
      resetHandInteractionState(state, mainRef);
    }
  }

  return consumedHands;
}

function resetHandInteractionState(state, mainRef) {
  if (state.draggedClone) {
    state.draggedClone.remove();
    state.draggedClone = null;
  }
  if (state.draggedSource) {
    state.draggedSource.style.opacity = '1';
    state.draggedSource = null;
  }
  if (state.lastDropZone) {
    state.lastDropZone.classList.remove('bg-slate-100', 'shadow-inner');
    state.lastDropZone = null;
  }
  if (state.isGenericDrag && state.dragElement) {
    state.dragElement = null;
    state.isGenericDrag = false;
  }
  if (state.isPanning && mainRef?.current) {
    mainRef.current.style.cursor = 'auto';
  }
  state.dragType = null;
  state.actionId = null;
  state.clickId = null;
  state.isPanning = false;
  state.panStartCoords = null;
  state.initialPan = null;
}

// This hook encapsulates all the logic for MediaPipe hand tracking.
export const useHandTracking = ({
  enabled,
  videoRef,
  canvasRef,
  cursor0Ref,
  cursor1Ref,
  mainRef,
  panOffset,
  setPanOffset,
  isCanvasPanTarget,
  onTwoHandZoom,
  onDrop,
  onClick,
  onLoadingChange,
  onError,
  onPointerDragStart,
  onPointerDragMove,
  onPointerDragEnd,
  onGraphHandGesture,
  onInteractionEffect,
}) => {
  const handStateRef = useRef([
    { isPinching: false, isFist: false, dragType: null, actionId: null, draggedClone: null, draggedSource: null, clickId: null, lastDropZone: null, lastHoveredEl: null, isPanning: false, panStartCoords: null, initialPan: null, dragElement: null, isGenericDrag: false, graphPinchConsumed: false, equationPinchConsumed: false, fistTargetGraphPanel: null, fistTargetEquationHost: null, fistGestureConsumed: false },
    { isPinching: false, isFist: false, dragType: null, actionId: null, draggedClone: null, draggedSource: null, clickId: null, lastDropZone: null, lastHoveredEl: null, isPanning: false, panStartCoords: null, initialPan: null, dragElement: null, isGenericDrag: false, graphPinchConsumed: false, equationPinchConsumed: false, fistTargetGraphPanel: null, fistTargetEquationHost: null, fistGestureConsumed: false }
  ]);
  const twoHandZoomRef = useRef({ active: false, lastDistance: 0 });

  const panOffsetRef = useRef(panOffset);
  useEffect(() => { panOffsetRef.current = panOffset; }, [panOffset]);

  useEffect(() => {
    if (!enabled) {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      return;
    }

    let cameraInstance;
    let hands;
    onLoadingChange(true);

    const initHandTracking = async () => {
      try {
        const loadScript = (src) => new Promise((resolve, reject) => {
          if (document.querySelector(`script[src="${src}"]`)) return resolve();
          const s = document.createElement('script');
          s.src = src;
          s.crossOrigin = 'anonymous';
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });

        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');

        hands = new window.Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6
        });

        hands.onResults((results) => {
          const isTrackingOverlay = (el) => {
            if (!el) return true;
            if (videoRef.current && el === videoRef.current) return true;
            if (canvasRef.current && el === canvasRef.current) return true;
            if (cursor0Ref.current?.contains(el) || cursor1Ref.current?.contains(el)) return true;
            return false;
          };

          const getElementAtPoint = (x, y) => {
            const stack = document.elementsFromPoint(x, y);
            for (const el of stack) {
              if (isTrackingOverlay(el)) continue;
              return el;
            }
            return null;
          };

          if (!canvasRef.current || !videoRef.current) return;

          const canvasCtx = canvasRef.current.getContext('2d');
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          canvasCtx.save();
          canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

          if (results.multiHandLandmarks) {
            for (const landmarks of results.multiHandLandmarks) {
              window.drawConnectors(canvasCtx, landmarks, window.HAND_CONNECTIONS, { color: '#6b8f71', lineWidth: 2 });
              window.drawLandmarks(canvasCtx, landmarks, { color: '#c4a574', lineWidth: 1, radius: 3 });
            }
          }
          canvasCtx.restore();

          const activeHands = results.multiHandLandmarks ? results.multiHandLandmarks.length : 0;
          const videoEl = videoRef.current;

          for (let i = activeHands; i < 2; i++) {
            const state = handStateRef.current[i];
            resetHandInteractionState(state, mainRef);
            state.isPinching = false;
            state.isFist = false;

            const cursor = i === 0 ? cursor0Ref.current : cursor1Ref.current;
            if (cursor) cursor.style.display = 'none';
          }

          if (activeHands <= 0) {
            twoHandZoomRef.current.active = false;
            return;
          }

          const handFrames = [];
          for (let i = 0; i < Math.min(activeHands, 2); i++) {
            const landmarks = results.multiHandLandmarks[i];
            const point = landmarksToScreenPoint(landmarks, videoEl);
            if (!point) continue;

            const state = handStateRef.current[i];
            const wasPinching = state.isPinching;
            const isPinching = isHandPinching(landmarks);
            const wasFist = state.isFist;
            const isFist = isHandFist(landmarks);
            state.isPinching = isPinching;
            state.isFist = isFist;

            handFrames.push({
              i,
              landmarks,
              x: point.x,
              y: point.y,
              wasPinching,
              isPinching,
              wasFist,
              isFist,
            });
          }

          handFrames.forEach(({ i, x, y, isPinching, isFist }) => {
            const cursor = i === 0 ? cursor0Ref.current : cursor1Ref.current;
            if (!cursor) return;

            const trackColor = isFist
              ? '#a86565'
              : isPinching
              ? (i === 0 ? '#6b8f71' : '#c4a574')
              : (i === 0 ? '#a86565' : '#9a8860');
            cursor.style.setProperty('--mv-track', trackColor);
            cursor.style.transform = `translate(${x}px, ${y}px) scale(${isFist ? 0.7 : isPinching ? 0.85 : 1})`;
            const inner = cursor.querySelector('.mv-tracker-cursor-inner');
            if (inner) inner.style.borderColor = trackColor;
            cursor.style.display = 'block';
          });

          const bothPinching = handFrames.length === 2 && handFrames.every((frame) => frame.isPinching);

          if (bothPinching && typeof onTwoHandZoom === 'function') {
            const [handA, handB] = handFrames;
            const distance = Math.hypot(handA.x - handB.x, handA.y - handB.y);
            const focalX = (handA.x + handB.x) / 2;
            const focalY = (handA.y + handB.y) / 2;

            if (!twoHandZoomRef.current.active) {
              twoHandZoomRef.current = { active: true, lastDistance: distance };
              handStateRef.current.forEach((state) => resetHandInteractionState(state, mainRef));
            } else if (distance > 0 && twoHandZoomRef.current.lastDistance > 0) {
              const scaleFactor = distance / twoHandZoomRef.current.lastDistance;
              if (Math.abs(scaleFactor - 1) > 0.002) {
                onTwoHandZoom({ scaleFactor, focalX, focalY });
              }
            }

            twoHandZoomRef.current.lastDistance = distance;
            return;
          }

          if (twoHandZoomRef.current.active) {
            twoHandZoomRef.current.active = false;
            twoHandZoomRef.current.lastDistance = 0;
          }

          const graphGestureHands = processGraphHandGestures(
            handFrames,
            handStateRef,
            mainRef,
            onGraphHandGesture,
            isTrackingOverlay
          );

          handFrames.forEach(({ i, x, y, wasPinching, isPinching }) => {
            if (graphGestureHands.has(i)) return;

            const state = handStateRef.current[i];
            const cursor = i === 0 ? cursor0Ref.current : cursor1Ref.current;

            if (cursor0Ref.current) cursor0Ref.current.style.display = 'none';
            if (cursor1Ref.current) cursor1Ref.current.style.display = 'none';
            handStateRef.current.forEach((handState) => {
              if (handState.draggedClone) handState.draggedClone.style.display = 'none';
            });

            const elAtPoint = getElementAtPoint(x, y);
            const graphPanel = elAtPoint?.closest('[data-graph-panel]');

            if (graphPanel && onGraphHandGesture) {
              if (!wasPinching && isPinching) return;
              if (isPinching) return;
            }

            const currentHoveredEl = elAtPoint ? elAtPoint.closest('[data-drag-type], [data-click-group]') : null;
            const finalHoveredEl = (currentHoveredEl && currentHoveredEl === state.draggedSource) ? null : currentHoveredEl;

            if (finalHoveredEl !== state.lastHoveredEl) {
              if (state.lastHoveredEl) {
                state.lastHoveredEl.classList.remove('text-blue-600', 'bg-slate-200/80');
              }
              if (finalHoveredEl) {
                if (finalHoveredEl.hasAttribute('data-drag-type')) {
                  finalHoveredEl.classList.add('text-blue-600');
                } else if (finalHoveredEl.hasAttribute('data-click-group')) {
                  finalHoveredEl.classList.add('bg-slate-200/80');
                }
              }
              state.lastHoveredEl = finalHoveredEl;
            }

            if (cursor0Ref.current && activeHands > 0) cursor0Ref.current.style.display = 'block';
            if (cursor1Ref.current && activeHands > 1) cursor1Ref.current.style.display = 'block';
            handStateRef.current.forEach((handState) => {
              if (handState.draggedClone) handState.draggedClone.style.display = 'block';
            });

            const startCanvasPan = () => {
              state.isPanning = false;
              state.panStartCoords = { x, y };
              state.initialPan = panOffsetRef.current;
            };

            if (!wasPinching && isPinching) {
              onInteractionEffect?.({ x, y, type: 'pinch' });

              const dragEl = elAtPoint ? elAtPoint.closest('[data-drag-type]') : null;
              const clickEl = elAtPoint ? elAtPoint.closest('[data-click-group]') : null;
              const canvasPanTarget = isCanvasPanTarget?.(elAtPoint);
              const genericDragTarget = (!dragEl && !canvasPanTarget && onPointerDragStart && mainRef.current && elAtPoint && mainRef.current.contains(elAtPoint) && elAtPoint !== mainRef.current)
                ? elAtPoint
                : null;

              if (dragEl && dragEl.style.opacity !== '0') {
                state.dragType = dragEl.getAttribute('data-drag-type');
                if (state.dragType === 'custom') {
                  state.actionId = dragEl.getAttribute('data-action-id');
                }
                const clone = dragEl.cloneNode(true);
                const computedStyle = window.getComputedStyle(dragEl);
                clone.style.position = 'fixed';
                clone.style.pointerEvents = 'none';
                clone.style.zIndex = '9999';
                clone.style.transform = 'translate(-50%, -50%)';
                clone.style.fontSize = computedStyle.fontSize;
                clone.style.fontFamily = computedStyle.fontFamily;
                clone.style.color = computedStyle.color;
                clone.style.margin = '0';
                document.body.appendChild(clone);
                state.draggedClone = clone;
                state.draggedSource = dragEl;
                dragEl.style.opacity = '0';
              } else if (canvasPanTarget) {
                startCanvasPan();
              } else if (genericDragTarget) {
                state.dragElement = genericDragTarget;
                state.isGenericDrag = true;
                state.panStartCoords = null;
                state.initialPan = null;
                onPointerDragStart?.(genericDragTarget, { x, y });
              } else if (clickEl) {
                state.clickId = clickEl.getAttribute('data-click-group');
              } else {
                startCanvasPan();
              }
            } else if (wasPinching && !isPinching) {
              onInteractionEffect?.({ x, y, type: 'pinch-release' });

              if (state.dragType) {
                const dropZone = elAtPoint ? elAtPoint.closest('[data-drop-zone="true"]') : null;
                if (dropZone) {
                  const dropSide = dropZone.getAttribute('data-drop-side');
                  onDrop?.(state.dragType, dropSide, state.actionId);
                }
                if (state.draggedSource) state.draggedSource.style.opacity = '1';
                if (state.draggedClone) state.draggedClone.remove();
                if (state.lastDropZone) state.lastDropZone.classList.remove('bg-slate-100', 'shadow-inner');
                state.draggedSource = null;
                state.draggedClone = null;
                state.lastDropZone = null;
                state.dragType = null;
                state.actionId = null;
              } else if (state.clickId) {
                onClick?.(state.clickId);
                state.clickId = null;
              } else if (state.isGenericDrag && state.dragElement) {
                onPointerDragEnd?.(state.dragElement, { x, y });
                state.dragElement = null;
                state.isGenericDrag = false;
                state.panStartCoords = null;
                state.initialPan = null;
              } else if (state.isPanning) {
                state.isPanning = false;
                state.panStartCoords = null;
                state.initialPan = null;
                if (mainRef.current) mainRef.current.style.cursor = 'auto';
              } else if (state.panStartCoords) {
                if (typeof onClick === 'function') {
                  onClick({ x: state.panStartCoords.x, y: state.panStartCoords.y });
                }
                state.panStartCoords = null;
                state.initialPan = null;
              }
            } else if (isPinching) {
              if (state.draggedClone) {
                state.draggedClone.style.left = `${x}px`;
                state.draggedClone.style.top = `${y}px`;

                const dropZone = elAtPoint ? elAtPoint.closest('[data-drop-zone="true"]') : null;
                if (dropZone !== state.lastDropZone) {
                  if (state.lastDropZone) {
                    state.lastDropZone.classList.remove('bg-slate-100', 'shadow-inner');
                  }
                  if (dropZone) {
                    dropZone.classList.add('bg-slate-100', 'shadow-inner');
                  }
                  state.lastDropZone = dropZone;
                }
              } else if (state.panStartCoords) {
                if (!state.isPanning) {
                  const dx = x - state.panStartCoords.x;
                  const dy = y - state.panStartCoords.y;
                  const moveThreshold = 10;
                  if (Math.hypot(dx, dy) > moveThreshold) {
                    state.isPanning = true;
                    if (mainRef.current) mainRef.current.style.cursor = 'grabbing';
                  }
                }

                if (state.isPanning) {
                  const dx = x - state.panStartCoords.x;
                  const dy = y - state.panStartCoords.y;
                  setPanOffset({ x: state.initialPan.x + dx, y: state.initialPan.y + dy });
                }
              }
            }

            if (isPinching && state.isGenericDrag && state.dragElement) {
              onPointerDragMove?.(state.dragElement, { x, y });
            }
          });
        });

        if (videoRef.current) {
          cameraInstance = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current) {
                await hands.send({ image: videoRef.current });
              }
            },
            width: 1280,
            height: 720
          });
          await cameraInstance.start();
          onLoadingChange(false);
        }
      } catch (err) {
        console.error("Camera setup failed", err);
        onLoadingChange(false);
        onError(err);
      }
    };

    initHandTracking();

    return () => {
      if (cameraInstance) cameraInstance.stop();
      if (hands) hands.close();
      handStateRef.current.forEach((state) => {
        if (state.draggedClone) state.draggedClone.remove();
        if (state.draggedSource) state.draggedSource.style.opacity = '1';
        if (state.lastHoveredEl) {
          state.lastHoveredEl.classList.remove('text-blue-600', 'bg-slate-200/80');
          state.lastHoveredEl = null;
        }
      });
    };
  }, [enabled, videoRef, canvasRef, cursor0Ref, cursor1Ref, mainRef, setPanOffset, isCanvasPanTarget, onTwoHandZoom, onDrop, onClick, onLoadingChange, onError, onPointerDragStart, onPointerDragMove, onPointerDragEnd, onGraphHandGesture, onInteractionEffect]);
};
