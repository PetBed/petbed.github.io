import gsap from 'gsap';

let fxLayer = null;

const COLORS = {
  track: '#6b8f71',
  amber: '#c4a574',
  alert: '#a86565',
  dim: 'rgba(107, 143, 113, 0.45)',
};

function ensureLayer() {
  if (!fxLayer || !document.body.contains(fxLayer)) {
    fxLayer = document.createElement('div');
    fxLayer.className = 'mv-fx-layer';
    fxLayer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(fxLayer);
  }
  return fxLayer;
}

function spawnSvg(width, height) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  svg.style.position = 'absolute';
  svg.style.overflow = 'visible';
  svg.style.pointerEvents = 'none';
  return svg;
}

function lineEl(x1, y1, x2, y2, color = COLORS.track, sw = 1) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  el.setAttribute('x1', x1);
  el.setAttribute('y1', y1);
  el.setAttribute('x2', x2);
  el.setAttribute('y2', y2);
  el.setAttribute('stroke', color);
  el.setAttribute('stroke-width', String(sw));
  return el;
}

function rectEl(x, y, w, h, color = COLORS.track, sw = 1) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  el.setAttribute('x', x);
  el.setAttribute('y', y);
  el.setAttribute('width', w);
  el.setAttribute('height', h);
  el.setAttribute('fill', 'none');
  el.setAttribute('stroke', color);
  el.setAttribute('stroke-width', String(sw));
  return el;
}

function bracketGroup(cx, cy, size, color = COLORS.amber) {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const s = size;
  const corners = [
    [[cx - s, cy - s + 6], [cx - s, cy - s], [cx - s + 6, cy - s]],
    [[cx + s - 6, cy - s], [cx + s, cy - s], [cx + s, cy - s + 6]],
    [[cx - s, cy + s - 6], [cx - s, cy + s], [cx - s + 6, cy + s]],
    [[cx + s - 6, cy + s], [cx + s, cy + s], [cx + s, cy + s - 6]],
  ];
  corners.forEach((pts) => {
    const pl = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    pl.setAttribute('points', pts.map((p) => p.join(',')).join(' '));
    pl.setAttribute('fill', 'none');
    pl.setAttribute('stroke', color);
    pl.setAttribute('stroke-width', '1');
    g.appendChild(pl);
  });
  return g;
}

function burstLines(x, y, count, spread, color) {
  const size = spread * 2 + 20;
  const svg = spawnSvg(size, size);
  svg.style.left = `${x - size / 2}px`;
  svg.style.top = `${y - size / 2}px`;
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('transform', `translate(${size / 2}, ${size / 2})`);

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const len = spread * 0.3;
    const ln = lineEl(0, 0, Math.cos(angle) * len, Math.sin(angle) * len, color, 0.8);
    g.appendChild(ln);
  }

  const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  ring.setAttribute('cx', '0');
  ring.setAttribute('cy', '0');
  ring.setAttribute('r', '4');
  ring.setAttribute('fill', 'none');
  ring.setAttribute('stroke', color);
  ring.setAttribute('stroke-width', '0.8');
  g.appendChild(ring);

  svg.appendChild(g);
  return { svg, g, lines: g.querySelectorAll('line'), ring };
}

function emitClickBurst(x, y, color = COLORS.track) {
  const layer = ensureLayer();
  const spread = 28;
  const { svg, g, lines, ring } = burstLines(x, y, 8, spread, color);
  layer.appendChild(svg);

  const brackets = bracketGroup(0, 0, 10, COLORS.amber);
  g.appendChild(brackets);

  const squares = [];
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const sq = rectEl(-3, -3, 6, 6, COLORS.amber, 0.7);
    sq.setAttribute('transform', `translate(${Math.cos(angle) * 8}, ${Math.sin(angle) * 8})`);
    g.appendChild(sq);
    squares.push(sq);
  }

  gsap.fromTo(g, { scale: 0.4, opacity: 1 }, { scale: 1, opacity: 0, duration: 0.55, ease: 'power2.out' });
  lines.forEach((ln, i) => {
    const angle = (i / lines.length) * Math.PI * 2;
    gsap.to(ln, {
      attr: { x2: Math.cos(angle) * spread, y2: Math.sin(angle) * spread },
      duration: 0.45,
      ease: 'power2.out',
    });
  });
  gsap.to(ring, { attr: { r: spread * 0.6 }, opacity: 0, duration: 0.5, ease: 'power2.out' });
  gsap.to(brackets, { scale: 1.8, opacity: 0, duration: 0.5, ease: 'power2.out', transformOrigin: '0px 0px' });
  squares.forEach((sq, i) => {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    gsap.to(sq, {
      attr: { transform: `translate(${Math.cos(angle) * spread * 0.7}, ${Math.sin(angle) * spread * 0.7}) rotate(${i * 45})` },
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out',
    });
  });

  gsap.delayedCall(0.6, () => svg.remove());
}

function emitPinchBurst(x, y) {
  const layer = ensureLayer();
  const size = 48;
  const svg = spawnSvg(size, size);
  svg.style.left = `${x - size / 2}px`;
  svg.style.top = `${y - size / 2}px`;
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('transform', `translate(${size / 2}, ${size / 2})`);

  const diamond = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  diamond.setAttribute('points', '0,-8 8,0 0,8 -8,0');
  diamond.setAttribute('fill', 'none');
  diamond.setAttribute('stroke', COLORS.track);
  diamond.setAttribute('stroke-width', '1');
  g.appendChild(diamond);

  for (let i = 0; i < 4; i++) {
    const ln = lineEl(0, 0, 0, -14, COLORS.amber, 0.7);
    ln.setAttribute('transform', `rotate(${i * 90})`);
    g.appendChild(ln);
  }

  svg.appendChild(g);
  layer.appendChild(svg);

  gsap.fromTo(g, { scale: 0.5, opacity: 1 }, { scale: 1.6, opacity: 0, duration: 0.4, ease: 'power2.out' });
  g.querySelectorAll('line').forEach((ln) => {
    gsap.to(ln, { attr: { y2: -22 }, opacity: 0, duration: 0.35, ease: 'power2.out' });
  });
  gsap.delayedCall(0.45, () => svg.remove());
}

function emitGraphOpen(x, y) {
  const layer = ensureLayer();
  const w = 120;
  const h = 80;
  const svg = spawnSvg(w, h);
  svg.style.left = `${x - w / 2}px`;
  svg.style.top = `${y - h / 2}px`;

  const brackets = bracketGroup(w / 2, h / 2, 30, COLORS.track);
  svg.appendChild(brackets);

  for (let i = 0; i < 5; i++) {
    const scanY = (i / 4) * h;
    const scan = lineEl(0, scanY, w, scanY, COLORS.dim, 0.5);
    scan.style.opacity = '0.6';
    svg.appendChild(scan);
    gsap.fromTo(scan, { attr: { x1: w / 2, x2: w / 2 }, opacity: 0.8 }, {
      attr: { x1: 0, x2: w },
      opacity: 0,
      duration: 0.35,
      delay: i * 0.04,
      ease: 'power1.out',
    });
  }

  layer.appendChild(svg);
  gsap.fromTo(brackets, { scale: 0.6, opacity: 1 }, { scale: 1.2, opacity: 0, duration: 0.65, ease: 'power2.out', transformOrigin: `${w / 2}px ${h / 2}px` });
  gsap.delayedCall(0.7, () => svg.remove());
}

function emitGraphClose(x, y) {
  const layer = ensureLayer();
  const size = 64;
  const svg = spawnSvg(size, size);
  svg.style.left = `${x - size / 2}px`;
  svg.style.top = `${y - size / 2}px`;
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('transform', `translate(${size / 2}, ${size / 2})`);

  const outer = rectEl(-18, -18, 36, 36, COLORS.alert, 1);
  const inner = rectEl(-8, -8, 16, 16, COLORS.amber, 0.8);
  g.appendChild(outer);
  g.appendChild(inner);

  const xMark = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  xMark.appendChild(lineEl(-6, -6, 6, 6, COLORS.alert, 1));
  xMark.appendChild(lineEl(-6, 6, 6, -6, COLORS.alert, 1));
  g.appendChild(xMark);

  svg.appendChild(g);
  layer.appendChild(svg);

  gsap.fromTo(g, { scale: 1.2, opacity: 1 }, { scale: 0.3, opacity: 0, duration: 0.45, ease: 'power2.in' });
  gsap.delayedCall(0.5, () => svg.remove());
}

function emitGestureTrail(x, y) {
  const layer = ensureLayer();
  const dot = document.createElement('div');
  dot.className = 'mv-fx-dot';
  dot.style.left = `${x}px`;
  dot.style.top = `${y}px`;
  layer.appendChild(dot);
  gsap.fromTo(dot, { scale: 1, opacity: 0.7 }, { scale: 0, opacity: 0, duration: 0.35, ease: 'power2.out', onComplete: () => dot.remove() });
}

function centerOf(el) {
  if (!el?.getBoundingClientRect) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export function emitInteractionEffect(x, y, type = 'click') {
  if (typeof x !== 'number' || typeof y !== 'number') return;

  switch (type) {
    case 'pinch':
      emitPinchBurst(x, y);
      break;
    case 'pinch-release':
      emitClickBurst(x, y, COLORS.amber);
      break;
    case 'graph-open':
      emitGraphOpen(x, y);
      break;
    case 'graph-close':
      emitGraphClose(x, y);
      break;
    case 'gesture':
      emitGestureTrail(x, y);
      break;
    case 'zoom':
      emitClickBurst(x, y, COLORS.dim);
      break;
    case 'click':
    default:
      emitClickBurst(x, y);
      break;
  }
}

export function emitInteractionEffectOnElement(el, type = 'click') {
  const c = centerOf(el);
  if (c) emitInteractionEffect(c.x, c.y, type);
}
