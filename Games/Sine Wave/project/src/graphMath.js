export const parseMathString = (latex) => {
  if (!latex) return null;

  let expr = latex.replace(/^y\s*=\s*/, '');
  expr = expr.replace(/\\left\(/g, '(').replace(/\\right\)/g, ')');
  expr = expr.replace(/\\cdot/g, '*').replace(/\\times/g, '*');
  expr = expr.replace(/\\frac{([^}]*)}{([^}]*)}/g, '($1)/($2)');

  expr = expr.replace(/\^{([^}]+)}/g, '**($1)');
  expr = expr.replace(/\^([a-zA-Z0-9.]+)/g, '**$1');

  expr = expr.replace(/([0-9.])\s*x/g, '$1*x');
  expr = expr.replace(/([0-9.])\s*\(/g, '$1*(');
  expr = expr.replace(/\)\s*\(/g, ')*(');
  expr = expr.replace(/\)\s*x/g, ')*x');

  expr = expr.replace(/-\(/g, '-1*(');
  expr = expr.replace(/-x/g, '-1*x');

  expr = expr.replace(/([0-9.])\s*\\sin/g, '$1*\\sin');
  expr = expr.replace(/\)\s*\\sin/g, ')*\\sin');

  expr = expr.replace(/\\sin/g, 'Math.sin');
  expr = expr.replace(/\\pi/g, 'Math.PI');

  const evaluateAt = (xVal) => {
    const e = expr.replace(/x/g, `(${xVal})`);
    try { return new Function('return ' + e)(); } catch { return NaN; }
  };

  const y0 = evaluateAt(0);
  const y1 = evaluateAt(1);
  const yMinus1 = evaluateAt(-1);
  const y2 = evaluateAt(2);
  const y3 = evaluateAt(3);

  if (isNaN(y0) || isNaN(y1) || isNaN(yMinus1) || isNaN(y2) || isNaN(y3)) return null;

  if (expr.includes('Math.sin')) {
    let a = 1; let b = 1; let c = 0; let d = 0;

    const dMatch = expr.match(/\)[ \t]*([+-][ \t]*[\d.]+)\s*$/);
    if (dMatch) d = parseFloat(dMatch[1].replace(/\s/g, ''));

    const aMatch = expr.match(/^\s*([-+]?\s*[\d.]+)\s*\*?\s*Math\.sin/);
    if (aMatch) {
      a = parseFloat(aMatch[1].replace(/\s/g, ''));
    } else if (expr.match(/^\s*[-]\s*\*?\s*Math\.sin/)) {
      a = -1;
    }

    const cMatch = expr.match(/Math\.sin\(\s*(?:[-+0-9.]+\s*\*\s*\()?\s*x\s*([+-]\s*[\d.]+)\s*\)?\s*\)/);
    if (cMatch) {
      c = -parseFloat(cMatch[1].replace(/\s/g, ''));
    }

    const bMatch = expr.match(/Math\.sin\(\s*([-+0-9.]+)\s*\*\s*\(/);
    if (bMatch) {
      b = parseFloat(bMatch[1]);
    } else {
      const bxMatch = expr.match(/Math\.sin\(\s*([-+0-9.]+)\s*\*\s*x/);
      if (bxMatch) b = parseFloat(bxMatch[1]);
    }
    return { type: 'trig', a, b, c, d };
  }

  const isExponential = latex.includes('^x') || latex.match(/\^{[^}]*x[^}]*}/) || /\*\*\s*\(?[^)]*x/.test(expr);

  if (isExponential) {
    const dy0 = y1 - y0;
    const dy1 = y2 - y1;
    let b = 1; let a = 0; let c = y0;

    if (Math.abs(dy0) > 1e-7) {
      b = dy1 / dy0;
      if (b > 0 && Math.abs(b - 1) > 1e-7) {
        a = dy0 / (b - 1);
        c = y0 - a;
      }
    }

    b = Math.max(0.01, b);
    return {
      type: 'exponential',
      a: Math.round(a * 1000) / 1000,
      b: Math.round(b * 1000) / 1000,
      c: Math.round(c * 1000) / 1000,
    };
  }

  const D = y0;
  const B = (y1 + yMinus1 - 2 * D) / 2;
  const A = (y2 - y1 + yMinus1 - D - 4 * B) / 6;
  const C = (y1 - yMinus1) / 2 - A;

  const round = (n) => Math.round(n * 1000) / 1000;
  const rA = round(A); const rB = round(B); const rC = round(C); const rD = round(D);

  if (Math.abs(rA) > 0.001) {
    const h = -rB / (3 * rA);
    const k = rA * Math.pow(h, 3) + rB * Math.pow(h, 2) + rC * h + rD;
    return { type: 'cubic', a: rA, c: rD, h: round(h), k: round(k) };
  }
  if (Math.abs(rB) > 0.001) {
    const h = -rC / (2 * rB);
    const k = rD - (rC * rC) / (4 * rB);
    return { type: 'quadratic', a: rB, b: rC, c: rD, h: round(h), k: round(k) };
  }
  return { type: 'linear', m: rC, c: rD };
};

export const formatLinear = (m, c) => {
  if (m === 0) return `y = ${c}`;
  const mStr = m === 1 ? '' : m === -1 ? '-' : m;
  const cStr = c === 0 ? '' : c > 0 ? `+ ${c}` : `- ${Math.abs(c)}`;
  return `y = ${mStr}x ${cStr}`.trim();
};

export const formatQuadratic = (a, h, k) => {
  const aStr = a === 1 ? '' : a === -1 ? '-' : a;
  const hStr = h === 0 ? '' : h > 0 ? `- ${h}` : `+ ${Math.abs(h)}`;
  const kStr = k === 0 ? '' : k > 0 ? `+ ${k}` : `- ${Math.abs(k)}`;
  if (h === 0) return `y = ${aStr}x^2 ${kStr}`.trim();
  return `y = ${aStr}(x ${hStr})^2 ${kStr}`.trim();
};

export const formatCubic = (a, h, k) => {
  const aStr = a === 1 ? '' : a === -1 ? '-' : a;
  const hStr = h === 0 ? '' : h > 0 ? `- ${h}` : `+ ${Math.abs(h)}`;
  const kStr = k === 0 ? '' : k > 0 ? `+ ${k}` : `- ${Math.abs(k)}`;
  if (h === 0) return `y = ${aStr}x^3 ${kStr}`.trim();
  return `y = ${aStr}(x ${hStr})^3 ${kStr}`.trim();
};

export const formatTrig = (a, b, c, d) => {
  const aStr = a === 1 ? '' : a === -1 ? '-' : a;
  const bStr = b === 1 ? '' : b === -1 ? '-1' : b;
  const cStr = c === 0 ? '' : c > 0 ? `- ${c}` : `+ ${Math.abs(c)}`;
  const dStr = d === 0 ? '' : d > 0 ? `+ ${d}` : `- ${Math.abs(d)}`;

  let inner = 'x';
  if (b !== 1 || c !== 0) {
    inner = c === 0 ? `${bStr}x` : `${bStr}(x ${cStr})`;
  }
  return `y = ${aStr}\\sin(${inner}) ${dStr}`.trim();
};

export const formatExponential = (a, b, c) => {
  const aStr = a === 1 ? '' : a === -1 ? '-' : a;
  const cStr = c === 0 ? '' : c > 0 ? `+ ${c}` : `- ${Math.abs(c)}`;
  return `y = ${aStr}(${b})^x ${cStr}`.trim();
};
