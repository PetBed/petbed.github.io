import React from 'react';
import { emitInteractionEffect } from './interactionEffects';

export const bindPointerDrag = (captureTarget, pointerId, { onMove, onEnd }) => {
  let captured = false;
  try {
    captureTarget.setPointerCapture(pointerId);
    captured = true;
  } catch {
    // Synthetic pointer events from hand tracking may not capture.
  }

  const moveTarget = captured ? captureTarget : window;

  const handleMove = (moveEvent) => onMove(moveEvent);

  const handleUp = (upEvent) => {
    if (captured) {
      try {
        captureTarget.releasePointerCapture(upEvent.pointerId);
      } catch {
        // Ignore release failures for synthetic pointers.
      }
    }
    moveTarget.removeEventListener('pointermove', handleMove);
    moveTarget.removeEventListener('pointerup', handleUp);
    onEnd(upEvent);
  };

  moveTarget.addEventListener('pointermove', handleMove);
  moveTarget.addEventListener('pointerup', handleUp);
};

const GRAPH_NODE_VISUAL_HALF = 12;
const GRAPH_NODE_HIT_HALF = 28;

export const GraphContext = React.createContext(null);

export const DraggablePoint = ({ x, y, onMove, onMoveStart, onMoveEnd, constrainX, color = '#6b8f71', noBounds }) => {
  const ctx = React.useContext(GraphContext);
  const { px, py } = ctx.mathToPixel(x, y);

  const handlePointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    emitInteractionEffect(e.clientX, e.clientY, 'pinch');
    if (onMoveStart) onMoveStart();
    const target = e.currentTarget;

    bindPointerDrag(target, e.pointerId, {
      onMove: (moveEvent) => {
        const svg = target.closest('svg');
        const rect = svg.getBoundingClientRect();
        const scaleX = ctx.width / rect.width;
        const scaleY = ctx.height / rect.height;
        let clientPx = (moveEvent.clientX - rect.left) * scaleX;
        let clientPy = (moveEvent.clientY - rect.top) * scaleY;

        if (!noBounds) {
          const padding = 16;
          clientPx = Math.max(padding, Math.min(clientPx, ctx.width - padding));
          clientPy = Math.max(padding, Math.min(clientPy, ctx.height - padding));
        }

        let mathPt = ctx.pixelToMath(clientPx, clientPy);
        if (constrainX !== undefined) mathPt.x = constrainX;

        onMove(mathPt);
      },
      onEnd: () => {
        if (onMoveEnd) onMoveEnd();
      },
    });
  };

  return (
    <g
      data-graph-node="true"
      style={{ cursor: 'grab', touchAction: 'none' }}
      onPointerDown={handlePointerDown}
    >
      <rect
        x={px - GRAPH_NODE_HIT_HALF}
        y={py - GRAPH_NODE_HIT_HALF}
        width={GRAPH_NODE_HIT_HALF * 2}
        height={GRAPH_NODE_HIT_HALF * 2}
        fill="transparent"
        stroke="none"
        pointerEvents="all"
      />
      <line x1={px - GRAPH_NODE_VISUAL_HALF} y1={py} x2={px + GRAPH_NODE_VISUAL_HALF} y2={py} stroke={color} strokeWidth={1.5} opacity={0.55} />
      <line x1={px} y1={py - GRAPH_NODE_VISUAL_HALF} x2={px} y2={py + GRAPH_NODE_VISUAL_HALF} stroke={color} strokeWidth={1.5} opacity={0.55} />
      <rect
        x={px - GRAPH_NODE_VISUAL_HALF}
        y={py - GRAPH_NODE_VISUAL_HALF}
        width={GRAPH_NODE_VISUAL_HALF * 2}
        height={GRAPH_NODE_VISUAL_HALF * 2}
        fill="none"
        stroke={color}
        strokeWidth={2}
        pointerEvents="none"
      />
    </g>
  );
};

export const Grid = () => {
  const ctx = React.useContext(GraphContext);
  const lines = [];
  const startX = Math.floor(ctx.cx - (ctx.width / 2) / ctx.scale);
  const endX = Math.ceil(ctx.cx + (ctx.width / 2) / ctx.scale);
  const startY = Math.floor(ctx.cy - (ctx.height / 2) / ctx.scale);
  const endY = Math.ceil(ctx.cy + (ctx.height / 2) / ctx.scale);

  for (let i = startX; i <= endX; i++) {
    const { px } = ctx.mathToPixel(i, 0);
    lines.push(<line key={`v${i}`} x1={px} y1={0} x2={px} y2={ctx.height} stroke={i === 0 ? 'rgba(107,143,113,0.55)' : 'rgba(255,255,255,0.05)'} strokeWidth={i === 0 ? 1.5 : 1} />);
  }
  for (let i = startY; i <= endY; i++) {
    const { py } = ctx.mathToPixel(0, i);
    lines.push(<line key={`h${i}`} x1={0} y1={py} x2={ctx.width} y2={py} stroke={i === 0 ? 'rgba(107,143,113,0.55)' : 'rgba(255,255,255,0.05)'} strokeWidth={i === 0 ? 1.5 : 1} />);
  }
  return <g>{lines}</g>;
};

export const PlotCurve = ({ fn, color }) => {
  const ctx = React.useContext(GraphContext);
  let d = '';
  const startX = ctx.cx - (ctx.width / 2) / ctx.scale;
  const endX = ctx.cx + (ctx.width / 2) / ctx.scale;
  const step = Math.max(0.01, (endX - startX) / 100);

  let first = true;
  for (let x = startX; x <= endX; x += step) {
    const y = fn(x);
    if (!isFinite(y)) continue;
    const { px, py } = ctx.mathToPixel(x, y);
    if (first) {
      d += `M ${px} ${py} `;
      first = false;
    } else {
      d += `L ${px} ${py} `;
    }
  }

  const finalY = fn(endX);
  if (isFinite(finalY)) {
    const { px, py } = ctx.mathToPixel(endX, finalY);
    d += `L ${px} ${py} `;
  }

  return <path d={d} fill="none" stroke={color} strokeWidth={3} />;
};

export const getVisiblePointOnCurve = (targetX, targetY, fn, activeCtx) => {
  const paddingPx = 24;
  const minX = activeCtx.cx + (paddingPx - activeCtx.width / 2) / activeCtx.scale;
  const maxX = activeCtx.cx + (activeCtx.width - paddingPx - activeCtx.width / 2) / activeCtx.scale;
  const minY = activeCtx.cy - (activeCtx.height - paddingPx - activeCtx.height / 2) / activeCtx.scale;
  const maxY = activeCtx.cy - (paddingPx - activeCtx.height / 2) / activeCtx.scale;

  if (targetX >= minX && targetX <= maxX && targetY >= minY && targetY <= maxY) {
    return { x: targetX, y: targetY };
  }

  let closestDist = Infinity;
  let bestX = targetX;
  const steps = 300;
  const stepSize = (maxX - minX) / steps;

  for (let i = 0; i <= steps; i++) {
    const testX = minX + i * stepSize;
    const testY = fn(testX);
    if (isFinite(testY) && testY >= minY && testY <= maxY) {
      const dist = Math.hypot(testX - targetX, testY - targetY);
      if (dist < closestDist) {
        closestDist = dist;
        bestX = testX;
      }
    }
  }

  if (closestDist === Infinity) {
    const clampX = Math.max(minX, Math.min(targetX, maxX));
    return { x: clampX, y: fn(clampX) };
  }

  return { x: bestX, y: fn(bestX) };
};
