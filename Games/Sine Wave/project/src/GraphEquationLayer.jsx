import React, { useEffect, useRef, useState, useContext } from 'react';
import {
  DraggablePoint,
  PlotCurve,
  GraphContext,
  getVisiblePointOnCurve,
} from './graphEngine';
import {
  parseMathString,
  formatLinear,
  formatQuadratic,
  formatCubic,
  formatTrig,
  formatExponential,
} from './graphMath';

export default function GraphEquationLayer({
  layerId,
  latex: externalLatex,
  color = '#6b8f71',
  onLatexChange,
  onParsedChange,
}) {
  const activeCtx = useContext(GraphContext);
  const [latex, setLatex] = useState(externalLatex);
  const [parsed, setParsed] = useState(() => parseMathString(externalLatex));
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ dx: 0, dy: 0 });
  const skipEmitRef = useRef(false);
  const linearSlopeXRef = useRef(2);
  const quadArmXRef = useRef(1);
  const cubicArmXRef = useRef(1);

  const applyLatex = (newLatex) => {
    const nextParsed = parseMathString(newLatex);
    setLatex(newLatex);
    if (nextParsed) {
      setParsed(nextParsed);
      onParsedChange?.(layerId, nextParsed);
    }
  };

  useEffect(() => {
    if (externalLatex === latex || isDraggingRef.current) return;
    skipEmitRef.current = true;
    setLatex(externalLatex);
    const nextParsed = parseMathString(externalLatex);
    if (nextParsed) {
      setParsed(nextParsed);
      onParsedChange?.(layerId, nextParsed);
    }
  }, [externalLatex, layerId, latex, onParsedChange]);

  useEffect(() => {
    if (skipEmitRef.current) {
      skipEmitRef.current = false;
      return;
    }
    if (!isDraggingRef.current) {
      onLatexChange?.(latex);
    }
  }, [latex, onLatexChange]);

  if (!parsed || !activeCtx) return null;

  const accent = color;
  const secondary = `${color}99`;

  if (parsed.type === 'linear') {
    const fn = (x) => parsed.m * x + parsed.c;
    const slopeVisible = getVisiblePointOnCurve(linearSlopeXRef.current, fn(linearSlopeXRef.current), fn, activeCtx);
    return (
      <g data-graph-layer={layerId}>
        <PlotCurve fn={fn} color={accent} />
        <DraggablePoint x={0} y={parsed.c} constrainX={0} color="#c4a574" noBounds onMove={(pt) => {
          isDraggingRef.current = true;
          applyLatex(formatLinear(parsed.m, Math.round(pt.y * 1000) / 1000));
        }} onMoveEnd={() => { isDraggingRef.current = false; }} />
        <DraggablePoint x={slopeVisible.x} y={slopeVisible.y} color={accent} onMove={(pt) => {
          isDraggingRef.current = true;
          if (Math.abs(pt.x) < 0.1) return;
          linearSlopeXRef.current = pt.x;
          let newM = (pt.y - parsed.c) / pt.x;
          newM = Math.max(-100, Math.min(100, Math.round(newM * 1000) / 1000));
          applyLatex(formatLinear(newM, parsed.c));
        }} onMoveEnd={() => { isDraggingRef.current = false; }} />
      </g>
    );
  }

  if (parsed.type === 'quadratic') {
    const fn = (x) => parsed.a * Math.pow(x - parsed.h, 2) + parsed.k;
    const vertexVisible = getVisiblePointOnCurve(parsed.h, parsed.k, fn, activeCtx);
    const rArmVisible = getVisiblePointOnCurve(parsed.h + quadArmXRef.current, fn(parsed.h + quadArmXRef.current), fn, activeCtx);
    const lArmVisible = getVisiblePointOnCurve(parsed.h - quadArmXRef.current, fn(parsed.h - quadArmXRef.current), fn, activeCtx);
    return (
      <g data-graph-layer={layerId}>
        <PlotCurve fn={fn} color={accent} />
        <DraggablePoint x={0} y={parsed.c} constrainX={0} color="#c4a574" noBounds onMove={(pt) => {
          isDraggingRef.current = true;
          const newC = Math.round(pt.y * 1000) / 1000;
          applyLatex(formatQuadratic(parsed.a, parsed.h, Math.round((parsed.k + newC - parsed.c) * 1000) / 1000));
        }} onMoveEnd={() => { isDraggingRef.current = false; }} />
        <DraggablePoint x={vertexVisible.x} y={vertexVisible.y} color={accent}
          onMoveStart={() => { dragOffsetRef.current = { dx: parsed.h - vertexVisible.x, dy: parsed.k - vertexVisible.y }; }}
          onMove={(pt) => {
            isDraggingRef.current = true;
            const newH = Math.round((pt.x + dragOffsetRef.current.dx) * 1000) / 1000;
            const newK = Math.round((pt.y + dragOffsetRef.current.dy) * 1000) / 1000;
            let newA = parsed.a;
            if (Math.abs(newH) > 0.05) newA = parsed.a + (parsed.k - newK) / (newH * newH);
            newA = Math.max(-100, Math.min(100, Math.round(newA * 1000) / 1000));
            if (Math.abs(newA) < 0.002) newA = newA < 0 ? -0.002 : 0.002;
            applyLatex(formatQuadratic(newA, newH, newK));
          }} onMoveEnd={() => { isDraggingRef.current = false; }} />
        <DraggablePoint x={rArmVisible.x} y={rArmVisible.y} color={secondary} onMove={(pt) => {
          isDraggingRef.current = true;
          const dx = pt.x - parsed.h;
          if (Math.abs(dx) < 0.2) return;
          quadArmXRef.current = dx;
          let newA = (pt.y - parsed.k) / (dx * dx);
          newA = Math.max(-100, Math.min(100, Math.round(newA * 1000) / 1000));
          if (Math.abs(newA) < 0.002) newA = newA < 0 ? -0.002 : 0.002;
          applyLatex(formatQuadratic(newA, parsed.h, parsed.k));
        }} onMoveEnd={() => { isDraggingRef.current = false; }} />
        <DraggablePoint x={lArmVisible.x} y={lArmVisible.y} color={secondary} onMove={(pt) => {
          isDraggingRef.current = true;
          const dx = parsed.h - pt.x;
          if (Math.abs(dx) < 0.2) return;
          quadArmXRef.current = dx;
          let newA = (pt.y - parsed.k) / (dx * dx);
          newA = Math.max(-100, Math.min(100, Math.round(newA * 1000) / 1000));
          if (Math.abs(newA) < 0.002) newA = newA < 0 ? -0.002 : 0.002;
          applyLatex(formatQuadratic(newA, parsed.h, parsed.k));
        }} onMoveEnd={() => { isDraggingRef.current = false; }} />
      </g>
    );
  }

  if (parsed.type === 'cubic') {
    const fn = (x) => parsed.a * Math.pow(x - parsed.h, 3) + parsed.k;
    const inflVisible = getVisiblePointOnCurve(parsed.h, parsed.k, fn, activeCtx);
    const rArmVisible = getVisiblePointOnCurve(parsed.h + cubicArmXRef.current, fn(parsed.h + cubicArmXRef.current), fn, activeCtx);
    const lArmVisible = getVisiblePointOnCurve(parsed.h - cubicArmXRef.current, fn(parsed.h - cubicArmXRef.current), fn, activeCtx);
    return (
      <g data-graph-layer={layerId}>
        <PlotCurve fn={fn} color={accent} />
        <DraggablePoint x={0} y={parsed.c} constrainX={0} color="#c4a574" noBounds onMove={(pt) => {
          isDraggingRef.current = true;
          const deltaC = Math.round(pt.y * 1000) / 1000 - parsed.c;
          applyLatex(formatCubic(parsed.a, parsed.h, Math.round((parsed.k + deltaC) * 1000) / 1000));
        }} onMoveEnd={() => { isDraggingRef.current = false; }} />
        <DraggablePoint x={inflVisible.x} y={inflVisible.y} color={accent}
          onMoveStart={() => { dragOffsetRef.current = { dx: parsed.h - inflVisible.x, dy: parsed.k - inflVisible.y }; }}
          onMove={(pt) => {
            isDraggingRef.current = true;
            const newH = Math.round((pt.x + dragOffsetRef.current.dx) * 1000) / 1000;
            const newK = Math.round((pt.y + dragOffsetRef.current.dy) * 1000) / 1000;
            let newA = parsed.a;
            if (Math.abs(newH) > 0.05) newA = (newK - parsed.c) / Math.pow(newH, 3);
            newA = Math.max(-50, Math.min(50, Math.round(newA * 1000) / 1000));
            if (Math.abs(newA) < 0.002) newA = newA < 0 ? -0.002 : 0.002;
            applyLatex(formatCubic(newA, newH, newK));
          }} onMoveEnd={() => { isDraggingRef.current = false; }} />
        <DraggablePoint x={rArmVisible.x} y={rArmVisible.y} color={secondary} onMove={(pt) => {
          isDraggingRef.current = true;
          const dx = pt.x - parsed.h;
          if (Math.abs(dx) < 0.2) return;
          cubicArmXRef.current = dx;
          let newA = (pt.y - parsed.k) / Math.pow(dx, 3);
          newA = Math.max(-50, Math.min(50, Math.round(newA * 1000) / 1000));
          if (Math.abs(newA) < 0.002) newA = newA < 0 ? -0.002 : 0.002;
          applyLatex(formatCubic(newA, parsed.h, parsed.k));
        }} onMoveEnd={() => { isDraggingRef.current = false; }} />
        <DraggablePoint x={lArmVisible.x} y={lArmVisible.y} color={secondary} onMove={(pt) => {
          isDraggingRef.current = true;
          const dx = parsed.h - pt.x;
          if (Math.abs(dx) < 0.2) return;
          cubicArmXRef.current = dx;
          let newA = (parsed.k - pt.y) / Math.pow(dx, 3);
          newA = Math.max(-50, Math.min(50, Math.round(newA * 1000) / 1000));
          if (Math.abs(newA) < 0.002) newA = newA < 0 ? -0.002 : 0.002;
          applyLatex(formatCubic(newA, parsed.h, parsed.k));
        }} onMoveEnd={() => { isDraggingRef.current = false; }} />
      </g>
    );
  }

  if (parsed.type === 'trig') {
    const fn = (x) => parsed.a * Math.sin(parsed.b * (x - parsed.c)) + parsed.d;
    const yInt = fn(0);
    const crestX = parsed.c + (Math.PI / (2 * parsed.b));
    const crestVisible = getVisiblePointOnCurve(crestX, parsed.d + parsed.a, fn, activeCtx);
    const troughX = parsed.c - (Math.PI / (2 * parsed.b));
    const troughVisible = getVisiblePointOnCurve(troughX, parsed.d - parsed.a, fn, activeCtx);
    return (
      <g data-graph-layer={layerId}>
        <PlotCurve fn={fn} color={accent} />
        <DraggablePoint x={0} y={yInt} constrainX={0} color="#c4a574" noBounds onMove={(pt) => {
          isDraggingRef.current = true;
          const newD = Math.round((parsed.d + Math.round(pt.y * 1000) / 1000 - yInt) * 1000) / 1000;
          applyLatex(formatTrig(parsed.a, parsed.b, parsed.c, newD));
        }} onMoveEnd={() => { isDraggingRef.current = false; }} />
        <DraggablePoint x={crestVisible.x} y={crestVisible.y} color={accent}
          onMoveStart={() => { dragOffsetRef.current = { dy: (parsed.d + parsed.a) - crestVisible.y }; }}
          onMove={(pt) => {
            isDraggingRef.current = true;
            let newA = (pt.y + (dragOffsetRef.current?.dy || 0)) - parsed.d;
            newA = Math.max(-50, Math.min(50, Math.round(newA * 100) / 100));
            if (Math.abs(newA) < 0.1) newA = newA < 0 ? -0.1 : 0.1;
            applyLatex(formatTrig(newA, parsed.b, parsed.c, parsed.d));
          }} onMoveEnd={() => { isDraggingRef.current = false; }} />
        <DraggablePoint x={troughVisible.x} y={troughVisible.y} color={secondary}
          onMoveStart={() => { dragOffsetRef.current = { dx: troughX - troughVisible.x }; }}
          onMove={(pt) => {
            isDraggingRef.current = true;
            const targetX = pt.x + (dragOffsetRef.current?.dx || 0);
            const dx = targetX - parsed.c;
            if (Math.abs(dx) < 0.1) return;
            let newB = Math.abs(-Math.PI / (2 * dx));
            newB = Math.max(0.1, Math.min(10, Math.round(newB * 100) / 100));
            applyLatex(formatTrig(parsed.a, newB, parsed.c, parsed.d));
          }} onMoveEnd={() => { isDraggingRef.current = false; }} />
      </g>
    );
  }

  if (parsed.type === 'exponential') {
    const fn = (x) => parsed.a * Math.pow(parsed.b, x) + parsed.c;
    const yInt = parsed.a + parsed.c;
    const curveVisible = getVisiblePointOnCurve(1, fn(1), fn, activeCtx);
    const asymVisible = getVisiblePointOnCurve(activeCtx.cx, parsed.c, () => parsed.c, activeCtx);
    return (
      <g data-graph-layer={layerId}>
        <line x1={0} y1={activeCtx.mathToPixel(0, parsed.c).py} x2={activeCtx.width} y2={activeCtx.mathToPixel(0, parsed.c).py}
          stroke={secondary} strokeWidth={2} strokeDasharray="6,6" opacity={0.6} />
        <PlotCurve fn={fn} color={accent} />
        <DraggablePoint x={asymVisible.x} y={parsed.c} constrainX={asymVisible.x} color={secondary} noBounds onMove={(pt) => {
          isDraggingRef.current = true;
          applyLatex(formatExponential(parsed.a, parsed.b, Math.round(pt.y * 1000) / 1000));
        }} onMoveEnd={() => { isDraggingRef.current = false; }} />
        <DraggablePoint x={0} y={yInt} constrainX={0} color="#c4a574" noBounds onMove={(pt) => {
          isDraggingRef.current = true;
          let newA = Math.round((pt.y - parsed.c) * 1000) / 1000;
          if (Math.abs(newA) < 0.05) newA = newA < 0 ? -0.05 : 0.05;
          applyLatex(formatExponential(newA, parsed.b, parsed.c));
        }} onMoveEnd={() => { isDraggingRef.current = false; }} />
        <DraggablePoint x={curveVisible.x} y={curveVisible.y} color={accent}
          onMoveStart={() => { dragOffsetRef.current = { dx: 1 - curveVisible.x, dy: fn(1) - curveVisible.y }; }}
          onMove={(pt) => {
            isDraggingRef.current = true;
            let targetX = pt.x + (dragOffsetRef.current?.dx || 0);
            const targetY = pt.y + (dragOffsetRef.current?.dy || 0);
            if (Math.abs(targetX) < 0.1) targetX = targetX < 0 ? -0.1 : 0.1;
            let val = (targetY - parsed.c) / parsed.a;
            if (val <= 0) val = 0.001;
            let newB = Math.pow(val, 1 / targetX);
            newB = Math.max(0.01, Math.min(50, Math.round(newB * 1000) / 1000));
            if (Math.abs(newB - 1) < 0.01) newB = 1.05;
            applyLatex(formatExponential(parsed.a, newB, parsed.c));
          }} onMoveEnd={() => { isDraggingRef.current = false; }} />
      </g>
    );
  }

  return null;
}
