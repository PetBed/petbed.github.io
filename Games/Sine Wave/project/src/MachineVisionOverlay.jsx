import React, { useMemo } from 'react';

const seededRandom = (seed) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

const LABEL_FORMATS = [
  (r) => `OBJ_${String(Math.floor(r() * 999)).padStart(3, '0')}`,
  (r) => `TRACK_pt_${Math.floor(r() * 99)}`,
  (r) => `FEAT_${(r() * 0.99 + 0.01).toFixed(2)}`,
  (r) => `cls:${['linear', 'poly', 'curve', 'node'][Math.floor(r() * 4)]}`,
  (r) => `ID:0x${Math.floor(r() * 4095).toString(16).toUpperCase().padStart(3, '0')}`,
  (r) => `BBOX[${Math.floor(r() * 99)},${Math.floor(r() * 99)}]`,
  (r) => `kp_${Math.floor(r() * 64)}:${(r()).toFixed(2)}`,
  (r) => `seg#${Math.floor(r() * 512)}`,
  (r) => `Δ${(r() * 2 - 1).toFixed(2)}`,
  (r) => `v${Math.floor(r() * 9)}.${Math.floor(r() * 9)}`,
];

const CornerBrackets = ({ x, y, w, h, size = 1.2 }) => (
  <g className="mv-bracket-group">
    <polyline points={`${x},${y + size} ${x},${y} ${x + size},${y}`} className="mv-bracket" />
    <polyline points={`${x + w - size},${y} ${x + w},${y} ${x + w},${y + size}`} className="mv-bracket" />
    <polyline points={`${x},${y + h - size} ${x},${y + h} ${x + size},${y + h}`} className="mv-bracket" />
    <polyline points={`${x + w - size},${y + h} ${x + w},${y + h} ${x + w},${y + h - size}`} className="mv-bracket" />
  </g>
);

export default function MachineVisionOverlay({ className = '', showHud = true }) {
  const artifacts = useMemo(() => {
    const rand = seededRandom(42);
    const boxes = Array.from({ length: 22 }, (_, i) => {
      const format = LABEL_FORMATS[Math.floor(rand() * LABEL_FORMATS.length)];
      return {
        id: i,
        x: rand() * 82 + 1,
        y: rand() * 82 + 1,
        w: rand() * 16 + 3,
        h: rand() * 12 + 2.5,
        conf: (rand() * 0.38 + 0.52).toFixed(2),
        label: format(rand),
        rot: (rand() - 0.5) * 12,
        dashed: rand() > 0.55,
        fadeDuration: rand() * 4 + 3,
        fadeDelay: rand() * 6,
      };
    });
    const lines = Array.from({ length: 32 }, (_, i) => ({
      id: i,
      x1: rand() * 100,
      y1: rand() * 100,
      x2: rand() * 100,
      y2: rand() * 100,
      opacity: rand() * 0.35 + 0.08,
      fadeDuration: rand() * 5 + 4,
      fadeDelay: rand() * 5,
    }));
    const contours = Array.from({ length: 8 }, (_, i) => {
      const cx = rand() * 80 + 10;
      const cy = rand() * 80 + 10;
      const pts = Array.from({ length: 6 + Math.floor(rand() * 5) }, (_, j) => {
        const angle = (j / 8) * Math.PI * 2 + rand() * 0.4;
        const r = rand() * 4 + 2;
        return `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`;
      }).join(' ');
      return {
        id: i,
        points: pts,
        fadeDuration: rand() * 6 + 4,
        fadeDelay: rand() * 4,
      };
    });
    return { boxes, lines, contours };
  }, []);

  return (
    <div className={`mv-overlay ${className}`} aria-hidden="true">
      <svg className="mv-overlay-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        {artifacts.lines.map((l) => (
          <line
            key={`ln-${l.id}`}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            className="mv-artifact-line mv-artifact-fade"
            style={{
              opacity: l.opacity,
              '--fade-duration': `${l.fadeDuration}s`,
              '--fade-delay': `${l.fadeDelay}s`,
            }}
          />
        ))}
        {artifacts.contours.map((c) => (
          <polyline
            key={`ct-${c.id}`}
            points={c.points}
            className="mv-contour mv-artifact-fade"
            style={{
              '--fade-duration': `${c.fadeDuration}s`,
              '--fade-delay': `${c.fadeDelay}s`,
            }}
          />
        ))}
        {artifacts.boxes.map((b) => (
          <g
            key={`bx-${b.id}`}
            transform={`rotate(${b.rot} ${b.x + b.w / 2} ${b.y + b.h / 2})`}
            className="mv-artifact-fade"
            style={{
              '--fade-duration': `${b.fadeDuration}s`,
              '--fade-delay': `${b.fadeDelay}s`,
            }}
          >
            <rect
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              className={b.dashed ? 'mv-detection-box mv-detection-box--dashed' : 'mv-detection-box'}
              fill="none"
            />
            <CornerBrackets x={b.x} y={b.y} w={b.w} h={b.h} />
            <text x={b.x} y={b.y - 0.6} className="mv-detection-label">
              {b.label}
            </text>
          </g>
        ))}
        <line x1="0" y1="33.33" x2="100" y2="33.33" className="mv-rule-of-thirds" />
        <line x1="0" y1="66.66" x2="100" y2="66.66" className="mv-rule-of-thirds" />
        <line x1="33.33" y1="0" x2="33.33" y2="100" className="mv-rule-of-thirds" />
        <line x1="66.66" y1="0" x2="66.66" y2="100" className="mv-rule-of-thirds" />
        <circle cx="50" cy="50" r="18" className="mv-crosshair-ring" fill="none" />
        <line x1="50" y1="28" x2="50" y2="72" className="mv-crosshair-line" />
        <line x1="28" y1="50" x2="72" y2="50" className="mv-crosshair-line" />
      </svg>

      {showHud && (
        <>
          <div className="mv-hud-corner mv-hud-tl" />
          <div className="mv-hud-corner mv-hud-tr" />
          <div className="mv-hud-corner mv-hud-bl" />
          <div className="mv-hud-corner mv-hud-br" />
          <div className="mv-hud-status">
            <span className="mv-rec">REC</span>
          </div>
          <div className="mv-hud-status mv-hud-status--bl">
            <span>RES:1920×1080</span>
            <span>ISO:800</span>
            <span>SHUTTER:1/60</span>
          </div>
        </>
      )}

      <div className="mv-scanlines" />
      <div className="mv-noise" />
    </div>
  );
}
