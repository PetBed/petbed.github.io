import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as Tone from 'tone';
import { Play, Square, Music, Activity, X } from 'lucide-react';
import GraphEquationLayer from './GraphEquationLayer';
import {
  GraphContext,
  Grid,
  DraggablePoint,
  PlotCurve,
  getVisiblePointOnCurve,
  bindPointerDrag,
} from './graphEngine';
import { emitInteractionEffect } from './interactionEffects';

// --- Math-to-Music Dictionaries ---
const NOTE_MAP_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_MAP_FLAT  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// --- Smart Equation Parser ---
const parseMathString = (latex) => {
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
    let e = expr.replace(/x/g, `(${xVal})`);
    try { return new Function('return ' + e)(); } catch { return NaN; }
  };

  const y0 = evaluateAt(0);
  const y1 = evaluateAt(1);
  const yMinus1 = evaluateAt(-1);
  const y2 = evaluateAt(2);
  const y3 = evaluateAt(3);

  if (isNaN(y0) || isNaN(y1) || isNaN(yMinus1) || isNaN(y2) || isNaN(y3)) return null;

  if (expr.includes('Math.sin')) {
     let a = 1, b = 1, c = 0, d = 0;
     
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
    let b = 1, a = 0, c = y0;
    
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
       c: Math.round(c * 1000) / 1000 
    };
  }

  const D = y0;
  const B = (y1 + yMinus1 - 2 * D) / 2;
  const A = (y2 - y1 + yMinus1 - D - 4 * B) / 6;
  const C = (y1 - yMinus1) / 2 - A;

  const round = (n) => Math.round(n * 1000) / 1000;
  const rA = round(A), rB = round(B), rC = round(C), rD = round(D);

  if (Math.abs(rA) > 0.001) {
    const h = -rB / (3 * rA);
    const k = rA * Math.pow(h, 3) + rB * Math.pow(h, 2) + rC * h + rD;
    return { type: 'cubic', a: rA, c: rD, h: round(h), k: round(k) }; 
  } else if (Math.abs(rB) > 0.001) {
    const h = -rC / (2 * rB);
    const k = rD - (rC * rC) / (4 * rB);
    return { type: 'quadratic', a: rB, b: rC, c: rD, h: round(h), k: round(k) };
  } else {
    return { type: 'linear', m: rC, c: rD };
  }
};

const formatLinear = (m, c) => {
  if (m === 0) return `y = ${c}`;
  const mStr = m === 1 ? '' : m === -1 ? '-' : m;
  const cStr = c === 0 ? '' : c > 0 ? `+ ${c}` : `- ${Math.abs(c)}`;
  return `y = ${mStr}x ${cStr}`.trim();
};

const formatQuadratic = (a, h, k) => {
  const aStr = a === 1 ? '' : a === -1 ? '-' : a;
  const hStr = h === 0 ? '' : h > 0 ? `- ${h}` : `+ ${Math.abs(h)}`;
  const kStr = k === 0 ? '' : k > 0 ? `+ ${k}` : `- ${Math.abs(k)}`;
  if (h === 0) return `y = ${aStr}x^2 ${kStr}`.trim();
  return `y = ${aStr}(x ${hStr})^2 ${kStr}`.trim();
};

const formatCubic = (a, h, k) => {
  const aStr = a === 1 ? '' : a === -1 ? '-' : a;
  const hStr = h === 0 ? '' : h > 0 ? `- ${h}` : `+ ${Math.abs(h)}`;
  const kStr = k === 0 ? '' : k > 0 ? `+ ${k}` : `- ${Math.abs(k)}`;
  if (h === 0) return `y = ${aStr}x^3 ${kStr}`.trim();
  return `y = ${aStr}(x ${hStr})^3 ${kStr}`.trim();
};

const formatTrig = (a, b, c, d) => {
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

const formatExponential = (a, b, c) => {
  const aStr = a === 1 ? '' : a === -1 ? '-' : a;
  const cStr = c === 0 ? '' : c > 0 ? `+ ${c}` : `- ${Math.abs(c)}`;
  return `y = ${aStr}(${b})^x ${cStr}`.trim();
};


export default function GraphAudioPrototype({
  initialLatex = "y = 1(2)^x - 3",
  equationLatex,
  layers,
  onLatexChange,
  onClose,
  onRegisterHandControls,
  handTrackingEnabled = false,
  variant = "full",
}) {
  const isMultiLayer = Array.isArray(layers) && layers.length > 0;
  const [layerParsedMap, setLayerParsedMap] = useState({});
  const layerAudioRef = useRef([]);
  const [latex, setLatex] = useState(initialLatex);
  const [parsed, setParsed] = useState(() => parseMathString(initialLatex));
  const [isPlaying, setIsPlaying] = useState(false);
  const [chordInfo, setChordInfo] = useState({ name: "Loading...", root: "C4", type: "sine" });
  
  const synthsRef = useRef([]);
  const effectsRef = useRef({});
  const mfRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ dx: 0, dy: 0 });
  const skipNextEmitRef = useRef(false);
  const hasMountedRef = useRef(false);
  
  const linearSlopeXRef = useRef(2);
  const quadArmXRef = useRef(1);
  const cubicArmXRef = useRef(1);

  // --- Graph Camera State ---
  const [viewCtx, setViewCtx] = useState({ cx: 0, cy: 0, scale: 50, width: 500, height: 500 });
  const svgRef = useRef(null);
  
  // OPTIMIZATION: Memoize activeCtx so React doesn't recreate Context/Functions 60 times a second
  const activeCtx = useMemo(() => ({
     ...viewCtx,
     mathToPixel: (x, y) => ({
       px: viewCtx.width / 2 + (x - viewCtx.cx) * viewCtx.scale,
       py: viewCtx.height / 2 - (y - viewCtx.cy) * viewCtx.scale
     }),
     pixelToMath: (px, py) => ({
       x: viewCtx.cx + (px - viewCtx.width / 2) / viewCtx.scale,
       y: viewCtx.cy - (py - viewCtx.height / 2) / viewCtx.scale
     })
  }), [viewCtx]);

  // OPTIMIZATION: Proper Tone.js garbage collection to prevent memory leaks on unmount
  useEffect(() => {
    return () => {
      synthsRef.current.forEach(synth => {
        if (synth && typeof synth.dispose === 'function') synth.dispose();
      });
      Object.values(effectsRef.current).forEach(effect => {
        if (effect && typeof effect.dispose === 'function') effect.dispose();
      });
      layerAudioRef.current.forEach(({ synths, tremolo, limiter }) => {
        synths?.forEach((s) => s.dispose?.());
        tremolo?.dispose?.();
        limiter?.dispose?.();
      });
    };
  }, []);

  // Zooming Handler
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    
    const handleWheel = (e) => {
      e.preventDefault();
      const zoomFactor = 1.1;
      const direction = e.deltaY > 0 ? -1 : 1;
      const factor = direction > 0 ? zoomFactor : 1 / zoomFactor;

      const rect = svg.getBoundingClientRect();
      const clientPx = (e.clientX - rect.left) * (activeCtx.width / rect.width);
      const clientPy = (e.clientY - rect.top) * (activeCtx.height / rect.height);
      
      const mathBefore = activeCtx.pixelToMath(clientPx, clientPy);
      const newScale = Math.max(5, Math.min(activeCtx.scale * factor, 1500));
      
      const newCx = mathBefore.x - (clientPx - activeCtx.width / 2) / newScale;
      const newCy = mathBefore.y + (clientPy - activeCtx.height / 2) / newScale;
      
      setViewCtx(prev => ({ ...prev, scale: newScale, cx: newCx, cy: newCy }));
    };
    
    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => svg.removeEventListener('wheel', handleWheel);
  }, [activeCtx]);

  useEffect(() => {
    if (equationLatex == null) return;

    skipNextEmitRef.current = true;
    setLatex(equationLatex);
    const nextParsed = parseMathString(equationLatex);
    if (nextParsed) setParsed(nextParsed);
  }, [equationLatex]);

  useEffect(() => {
    if (!onLatexChange) return;

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (skipNextEmitRef.current) {
      skipNextEmitRef.current = false;
      return;
    }

    onLatexChange(latex);
  }, [latex, onLatexChange]);

  // Panning Handler
  const handlePointerDownSVG = (e) => {
    if (e.target.closest('[data-graph-node]')) return;
    e.preventDefault();
    emitInteractionEffect(e.clientX, e.clientY, 'gesture');
    
    const svg = svgRef.current;
    if (!svg) return;

    let startX = e.clientX;
    let startY = e.clientY;
    let startCx = activeCtx.cx;
    let startCy = activeCtx.cy;
    
    bindPointerDrag(svg, e.pointerId, {
      onMove: (moveEv) => {
        const dx = moveEv.clientX - startX;
        const dy = moveEv.clientY - startY;
        const rect = svg.getBoundingClientRect();
        const dxMath = (dx * (activeCtx.width / rect.width)) / activeCtx.scale;
        const dyMath = (dy * (activeCtx.height / rect.height)) / activeCtx.scale;
        
        setViewCtx(prev => ({ ...prev, cx: startCx - dxMath, cy: startCy + dyMath }));
      },
      onEnd: () => {},
    });
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/mathlive';
    script.defer = true;
    document.head.appendChild(script);
    
    const timer = setInterval(() => {
      if (mfRef.current && customElements.get('math-field')) {
        mfRef.current.addEventListener('input', (e) => {
          if (!isDraggingRef.current) {
            setLatex(e.target.value);
            const p = parseMathString(e.target.value);
            if (p) setParsed(p);
          }
        });
        mfRef.current.value = latex;
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, []); // eslint-disable-line

  useEffect(() => {
    if (mfRef.current && isDraggingRef.current) {
      mfRef.current.value = latex;
    }
  }, [latex]);

  // --- Music Engine Logic ---
  const getChordData = (mathObj) => {
    if (!mathObj) return null;
    
    // Y-intercept logic for Root Pitch
    let yIntercept = mathObj.c;
    if (mathObj.type === 'trig') {
       yIntercept = mathObj.d; 
    } else if (mathObj.type === 'exponential') {
       yIntercept = mathObj.a + mathObj.c; 
    }
    
    const rawYIntercept = isNaN(yIntercept) ? 0 : yIntercept;
    const clampedY = Math.max(-100, Math.min(100, rawYIntercept));
    const roundedY = Math.round(clampedY);
    const rootIndex = ((roundedY % 12) + 12) % 12;

    let rootName;
    if (rawYIntercept > roundedY) {
      rootName = NOTE_MAP_FLAT[rootIndex];
    } else if (rawYIntercept < roundedY) {
      rootName = NOTE_MAP_SHARP[rootIndex];
    } else {
      const isBlackKey = [1, 3, 6, 8, 10].includes(rootIndex);
      rootName = isBlackKey ? NOTE_MAP_SHARP[rootIndex] : NOTE_MAP_SHARP[rootIndex];
    }

    const rootOctave = Math.max(0, Math.min(8, 4 + Math.floor(roundedY / 12)));
    const rootNoteStr = `${rootName}${rootOctave}`;
    const rootFreq = Tone.Frequency(rootNoteStr);

    let notes = [];
    let chordName = "";

    // Spread voicings to prevent harmonic masking and mud.
    if (mathObj.type === 'linear') {
      notes = [rootFreq.toNote(), rootFreq.transpose(7).toNote(), rootFreq.transpose(16).toNote()];
      chordName = `${rootName} Major`;
    } else if (mathObj.type === 'quadratic') {
      notes = [rootFreq.toNote(), rootFreq.transpose(7).toNote(), rootFreq.transpose(15).toNote()];
      chordName = `${rootName} Minor`;
    } else if (mathObj.type === 'cubic') {
      notes = [rootFreq.toNote(), rootFreq.transpose(6).toNote(), rootFreq.transpose(9).toNote(), rootFreq.transpose(15).toNote()];
      chordName = `${rootName} Diminished 7th`;
    } else if (mathObj.type === 'trig') {
      notes = [rootFreq.toNote(), rootFreq.transpose(6).toNote(), rootFreq.transpose(18).toNote()];
      chordName = `${rootName} Tritone`;
    } else if (mathObj.type === 'exponential') {
      notes = [rootFreq.toNote(), rootFreq.transpose(8).toNote(), rootFreq.transpose(10).toNote(), rootFreq.transpose(16).toNote()];
      chordName = `${rootName} Augmented 7th`;
    } else if (mathObj.type === 'conic') {
      notes = [rootFreq.toNote(), rootFreq.transpose(6).toNote(), rootFreq.transpose(10).toNote(), rootFreq.transpose(15).toNote()];
      chordName = `${rootName} Half-Diminished`;
    }

    let rawSteepness = 0;
    let scaleFactor = 1;
    let gainVal = 0;
    let tremoloRate = 0;
    let tremoloDepth = 0;
    
    if (mathObj.type === 'linear') { rawSteepness = mathObj.m; scaleFactor = 4; }
    if (mathObj.type === 'quadratic') { rawSteepness = mathObj.a; scaleFactor = 2; }
    if (mathObj.type === 'cubic') { rawSteepness = mathObj.a; scaleFactor = 1.5; }
    if (mathObj.type === 'exponential') { rawSteepness = (mathObj.b - 1) * 2; scaleFactor = 3; }
    if (mathObj.type === 'trig') { 
      rawSteepness = mathObj.b; 
      scaleFactor = 1.5; 
      gainVal = 20 * Math.log10(Math.max(0.01, Math.abs(mathObj.a) / 2)); 
      tremoloRate = Math.max(0.1, Math.abs(mathObj.b) * 3); 
      tremoloDepth = 0.8; 
    }
    
    const steepness = isFinite(rawSteepness) ? rawSteepness : 0;
    const harmonicIntensity = Math.min(Math.abs(steepness) / scaleFactor, 1);
    const oscType = 'sine'; 

    return { 
      notes, name: chordName, root: rootNoteStr, harmonicIntensity, 
      type: oscType, gain: gainVal, tremoloRate, tremoloDepth 
    };
  };

  useEffect(() => {
    if (!parsed) return;
    const data = getChordData(parsed);
    setChordInfo(data);

    if (isPlaying && synthsRef.current.length > 0 && data) {
      synthsRef.current.forEach((synth, i) => {
        if (data.notes[i]) {
          const freq = Tone.Frequency(data.notes[i]).toFrequency();
          if (isFinite(freq) && freq > 0) {
             synth.frequency.rampTo(freq, 0.1);
          }
          const modValue = isFinite(data.harmonicIntensity) ? data.harmonicIntensity * 8 : 0;
          synth.modulationIndex.rampTo(modValue, 0.1);
          if (isFinite(data.gain)) synth.volume.rampTo(data.gain, 0.1);
        }
      });

      if (effectsRef.current.tremolo) {
        effectsRef.current.tremolo.frequency.rampTo(data.tremoloRate || 0.1, 0.1);
        effectsRef.current.tremolo.depth.rampTo(data.tremoloDepth || 0, 0.1);
      }
    }
  }, [parsed, isPlaying, isMultiLayer, layers, layerParsedMap]);

  useEffect(() => {
    if (!isPlaying || !isMultiLayer) return;
    layerAudioRef.current.forEach((audio) => {
      const mathObj = layerParsedMap[audio.layerId];
      if (!mathObj) return;
      const data = getChordData(mathObj);
      if (!data) return;
      audio.data = data;
      audio.synths.forEach((synth, i) => {
        if (data.notes[i]) {
          const freq = Tone.Frequency(data.notes[i]).toFrequency();
          if (isFinite(freq) && freq > 0) synth.frequency.rampTo(freq, 0.1);
          synth.modulationIndex.rampTo(isFinite(data.harmonicIntensity) ? data.harmonicIntensity * 8 : 0, 0.1);
          if (isFinite(data.gain)) synth.volume.rampTo(data.gain, 0.1);
        }
      });
      audio.tremolo.frequency.rampTo(data.tremoloRate || 0.1, 0.1);
      audio.tremolo.depth.rampTo(data.tremoloDepth || 0, 0.1);
    });
  }, [layerParsedMap, isPlaying, isMultiLayer]);

  const handleLayerParsedChange = useCallback((layerId, nextParsed) => {
    setLayerParsedMap((prev) => ({ ...prev, [layerId]: nextParsed }));
  }, []);

  const toggleAudio = async () => {
    if (isPlaying) {
      if (isMultiLayer) {
        layerAudioRef.current.forEach(({ synths }) => synths.forEach((s) => s.triggerRelease()));
        layerAudioRef.current.forEach(({ tremolo, limiter }) => {
          tremolo?.dispose?.();
          limiter?.dispose?.();
        });
        layerAudioRef.current = [];
      } else {
        synthsRef.current.forEach(synth => synth.triggerRelease());
      }
      setIsPlaying(false);
      return;
    }

    await Tone.start();

    if (isMultiLayer) {
      layerAudioRef.current = layers
        .map((layer) => {
          const mathObj = layerParsedMap[layer.id] || parseMathString(layer.latex);
          const data = getChordData(mathObj);
          if (!data) return null;

          const limiter = new Tone.Limiter(-2).toDestination();
          const tremolo = new Tone.Tremolo(data.tremoloRate || 4, data.tremoloDepth || 0).connect(limiter).start();
          const fmOptions = {
            harmonicity: 1,
            modulationIndex: 0,
            oscillator: { type: 'sine' },
            modulation: { type: 'sine' },
            envelope: { attack: 0.3, decay: 0.2, sustain: 0.8, release: 1.5 },
          };
          const synths = [
            new Tone.FMSynth(fmOptions).connect(tremolo),
            new Tone.FMSynth(fmOptions).connect(tremolo),
            new Tone.FMSynth(fmOptions).connect(tremolo),
            new Tone.FMSynth(fmOptions).connect(tremolo),
          ];
          synths.forEach((synth, i) => {
            synth.modulationIndex.value = isFinite(data.harmonicIntensity) ? data.harmonicIntensity * 8 : 0;
            synth.oscillator.type = data.type;
            if (isFinite(data.gain)) synth.volume.value = data.gain;
            if (data.notes[i]) synth.triggerAttack(data.notes[i]);
          });
          return { layerId: layer.id, synths, tremolo, limiter, data };
        })
        .filter(Boolean);
      setIsPlaying(true);
      return;
    }

    const data = getChordData(parsed);
    
    if (synthsRef.current.length === 0) {
      const limiter = new Tone.Limiter(-2).toDestination();
      const tremolo = new Tone.Tremolo(4, 0).connect(limiter).start();
      effectsRef.current = { tremolo, limiter };

      const fmOptions = {
        harmonicity: 1, 
        modulationIndex: 0,
        oscillator: { type: "sine" },
        modulation: { type: "sine" },
        envelope: { attack: 0.3, decay: 0.2, sustain: 0.8, release: 1.5 }
      };
      
      synthsRef.current = [
        new Tone.FMSynth(fmOptions).connect(tremolo),
        new Tone.FMSynth(fmOptions).connect(tremolo),
        new Tone.FMSynth(fmOptions).connect(tremolo),
        new Tone.FMSynth(fmOptions).connect(tremolo) 
      ];
    }

    if (effectsRef.current.tremolo) {
      effectsRef.current.tremolo.frequency.value = data.tremoloRate || 0.1;
      effectsRef.current.tremolo.depth.value = data.tremoloDepth || 0;
    }

    synthsRef.current.forEach((synth, i) => {
      synth.modulationIndex.value = isFinite(data.harmonicIntensity) ? data.harmonicIntensity * 8 : 0;
      synth.oscillator.type = data.type;
      if (isFinite(data.gain)) synth.volume.value = data.gain;
      if (data.notes[i]) synth.triggerAttack(data.notes[i]);
    });
    
    setIsPlaying(true);
  };

  const toggleAudioRef = useRef(toggleAudio);
  toggleAudioRef.current = toggleAudio;

  useEffect(() => {
    if (!onRegisterHandControls) return;
    onRegisterHandControls({
      toggleAudio: () => toggleAudioRef.current(),
    });
  }, [onRegisterHandControls]);

  // --- Dynamic Graph Renderers ---
  const renderLinear = () => {
    const fn = (x) => parsed.m * x + parsed.c;
    const slopeTargetX = linearSlopeXRef.current;
    const slopeVisible = getVisiblePointOnCurve(slopeTargetX, fn(slopeTargetX), fn, activeCtx);

    return (
      <g>
        <PlotCurve fn={fn} color="#6b8f71" />
        <DraggablePoint 
          x={0} y={parsed.c} constrainX={0} color="#c4a574" noBounds
          onMove={(pt) => {
            isDraggingRef.current = true;
            const newC = Math.round(pt.y * 1000) / 1000;
            const newLatex = formatLinear(parsed.m, newC);
            setLatex(newLatex);
            setParsed(parseMathString(newLatex));
          }}
          onMoveEnd={() => { isDraggingRef.current = false; }}
        />
        <DraggablePoint 
          x={slopeVisible.x} y={slopeVisible.y} color="#6b8f71"
          onMove={(pt) => {
            isDraggingRef.current = true;
            if (Math.abs(pt.x) < 0.1) return; 
            linearSlopeXRef.current = pt.x;
            
            let newM = (pt.y - parsed.c) / pt.x;
            newM = Math.max(-100, Math.min(100, newM)); 
            newM = Math.round(newM * 1000) / 1000;
            
            const newLatex = formatLinear(newM, parsed.c);
            setLatex(newLatex);
            setParsed(parseMathString(newLatex));
          }}
          onMoveEnd={() => { isDraggingRef.current = false; }}
        />
      </g>
    );
  };

  const renderQuadratic = () => {
    const fn = (x) => parsed.a * Math.pow(x - parsed.h, 2) + parsed.k;
    
    const vertexVisible = getVisiblePointOnCurve(parsed.h, parsed.k, fn, activeCtx);
    const rArmTargetX = parsed.h + quadArmXRef.current;
    const rArmVisible = getVisiblePointOnCurve(rArmTargetX, fn(rArmTargetX), fn, activeCtx);
    const lArmTargetX = parsed.h - quadArmXRef.current;
    const lArmVisible = getVisiblePointOnCurve(lArmTargetX, fn(lArmTargetX), fn, activeCtx);

    return (
      <g>
        <PlotCurve fn={fn} color="#6b8f71" />
        
        <DraggablePoint 
          x={0} y={parsed.c} constrainX={0} color="#c4a574" noBounds
          onMove={(pt) => {
            isDraggingRef.current = true;
            const newC = Math.round(pt.y * 1000) / 1000;
            const deltaC = newC - parsed.c;
            const newK = Math.round((parsed.k + deltaC) * 1000) / 1000; 
            const newLatex = formatQuadratic(parsed.a, parsed.h, newK);
            setLatex(newLatex);
            setParsed(parseMathString(newLatex));
          }}
          onMoveEnd={() => { isDraggingRef.current = false; }}
        />

        <DraggablePoint 
          x={vertexVisible.x} y={vertexVisible.y} color="#6b8f71"
          onMoveStart={() => {
            dragOffsetRef.current = { dx: parsed.h - vertexVisible.x, dy: parsed.k - vertexVisible.y };
          }}
          onMove={(pt) => {
            isDraggingRef.current = true;
            const targetH = pt.x + dragOffsetRef.current.dx;
            const targetK = pt.y + dragOffsetRef.current.dy;
            
            const newH = Math.round(targetH * 1000) / 1000;
            const newK = Math.round(targetK * 1000) / 1000;
            
            let newA = parsed.a;
            if (Math.abs(newH) > 0.05) {
              newA = parsed.a + (parsed.k - newK) / (newH * newH);
            }
            newA = Math.max(-100, Math.min(100, newA)); 
            newA = Math.round(newA * 1000) / 1000;
            if (Math.abs(newA) < 0.002) newA = newA < 0 ? -0.002 : 0.002; 
            
            const newLatex = formatQuadratic(newA, newH, newK);
            setLatex(newLatex);
            setParsed(parseMathString(newLatex));
          }}
          onMoveEnd={() => { isDraggingRef.current = false; }}
        />
        
        <DraggablePoint 
          x={rArmVisible.x} y={rArmVisible.y} color="#5a8a72"
          onMove={(pt) => {
            isDraggingRef.current = true;
            const dx = pt.x - parsed.h;
            if (Math.abs(dx) < 0.2) return; 
            quadArmXRef.current = dx; 
            
            let newA = (pt.y - parsed.k) / (dx * dx);
            newA = Math.max(-100, Math.min(100, newA));
            newA = Math.round(newA * 1000) / 1000;
            if (Math.abs(newA) < 0.002) newA = newA < 0 ? -0.002 : 0.002;
            
            const newLatex = formatQuadratic(newA, parsed.h, parsed.k);
            setLatex(newLatex);
            setParsed(parseMathString(newLatex));
          }}
          onMoveEnd={() => { isDraggingRef.current = false; }}
        />
        
        <DraggablePoint 
          x={lArmVisible.x} y={lArmVisible.y} color="#5a8a72"
          onMove={(pt) => {
            isDraggingRef.current = true;
            const dx = parsed.h - pt.x;
            if (Math.abs(dx) < 0.2) return; 
            quadArmXRef.current = dx; 
            
            let newA = (pt.y - parsed.k) / (dx * dx);
            newA = Math.max(-100, Math.min(100, newA));
            newA = Math.round(newA * 1000) / 1000;
            if (Math.abs(newA) < 0.002) newA = newA < 0 ? -0.002 : 0.002;
            
            const newLatex = formatQuadratic(newA, parsed.h, parsed.k);
            setLatex(newLatex);
            setParsed(parseMathString(newLatex));
          }}
          onMoveEnd={() => { isDraggingRef.current = false; }}
        />
      </g>
    );
  };

  const renderCubic = () => {
    const fn = (x) => parsed.a * Math.pow(x - parsed.h, 3) + parsed.k;
    
    const inflVisible = getVisiblePointOnCurve(parsed.h, parsed.k, fn, activeCtx);
    const rArmTargetX = parsed.h + cubicArmXRef.current;
    const rArmVisible = getVisiblePointOnCurve(rArmTargetX, fn(rArmTargetX), fn, activeCtx);
    const lArmTargetX = parsed.h - cubicArmXRef.current;
    const lArmVisible = getVisiblePointOnCurve(lArmTargetX, fn(lArmTargetX), fn, activeCtx);

    return (
      <g>
        <PlotCurve fn={fn} color="#c4a574" />
        
        <DraggablePoint 
          x={0} y={parsed.c} constrainX={0} color="#c4a574" noBounds
          onMove={(pt) => {
            isDraggingRef.current = true;
            const newC = Math.round(pt.y * 1000) / 1000;
            const deltaC = newC - parsed.c;
            const newK = Math.round((parsed.k + deltaC) * 1000) / 1000; 
            const newLatex = formatCubic(parsed.a, parsed.h, newK);
            setLatex(newLatex);
            setParsed(parseMathString(newLatex));
          }}
          onMoveEnd={() => { isDraggingRef.current = false; }}
        />

        <DraggablePoint 
          x={inflVisible.x} y={inflVisible.y} color="#c4a574"
          onMoveStart={() => {
            dragOffsetRef.current = { dx: parsed.h - inflVisible.x, dy: parsed.k - inflVisible.y };
          }}
          onMove={(pt) => {
            isDraggingRef.current = true;
            const targetH = pt.x + dragOffsetRef.current.dx;
            const targetK = pt.y + dragOffsetRef.current.dy;
            
            const newH = Math.round(targetH * 1000) / 1000;
            const newK = Math.round(targetK * 1000) / 1000;
            
            let newA = parsed.a;
            if (Math.abs(newH) > 0.05) {
              newA = (newK - parsed.c) / Math.pow(newH, 3);
            }
            newA = Math.max(-50, Math.min(50, newA)); 
            newA = Math.round(newA * 1000) / 1000;
            if (Math.abs(newA) < 0.002) newA = newA < 0 ? -0.002 : 0.002;
            
            const newLatex = formatCubic(newA, newH, newK);
            setLatex(newLatex);
            setParsed(parseMathString(newLatex));
          }}
          onMoveEnd={() => { isDraggingRef.current = false; }}
        />
        
        <DraggablePoint 
          x={rArmVisible.x} y={rArmVisible.y} color="#5a8a72"
          onMove={(pt) => {
            isDraggingRef.current = true;
            const dx = pt.x - parsed.h;
            if (Math.abs(dx) < 0.2) return; 
            cubicArmXRef.current = dx; 
            
            let newA = (pt.y - parsed.k) / Math.pow(dx, 3);
            newA = Math.max(-50, Math.min(50, newA));
            newA = Math.round(newA * 1000) / 1000;
            if (Math.abs(newA) < 0.002) newA = newA < 0 ? -0.002 : 0.002;
            
            const newLatex = formatCubic(newA, parsed.h, parsed.k);
            setLatex(newLatex);
            setParsed(parseMathString(newLatex));
          }}
          onMoveEnd={() => { isDraggingRef.current = false; }}
        />
        
        <DraggablePoint 
          x={lArmVisible.x} y={lArmVisible.y} color="#5a8a72"
          onMove={(pt) => {
            isDraggingRef.current = true;
            const dx = parsed.h - pt.x; 
            if (Math.abs(dx) < 0.2) return; 
            cubicArmXRef.current = dx; 
            
            let newA = (parsed.k - pt.y) / Math.pow(dx, 3);
            newA = Math.max(-50, Math.min(50, newA));
            newA = Math.round(newA * 1000) / 1000;
            if (Math.abs(newA) < 0.002) newA = newA < 0 ? -0.002 : 0.002;
            
            const newLatex = formatCubic(newA, parsed.h, parsed.k);
            setLatex(newLatex);
            setParsed(parseMathString(newLatex));
          }}
          onMoveEnd={() => { isDraggingRef.current = false; }}
        />
      </g>
    );
  };

  const renderTrig = () => {
    const fn = (x) => parsed.a * Math.sin(parsed.b * (x - parsed.c)) + parsed.d;
    
    const yInt = fn(0);
    
    const crestX = parsed.c + (Math.PI / (2 * parsed.b));
    const crestVisible = getVisiblePointOnCurve(crestX, parsed.d + parsed.a, fn, activeCtx);
    
    const troughX = parsed.c - (Math.PI / (2 * parsed.b));
    const troughVisible = getVisiblePointOnCurve(troughX, parsed.d - parsed.a, fn, activeCtx);

    return (
      <g>
        <PlotCurve fn={fn} color="#7a9898" />
        
        <DraggablePoint 
          x={0} y={yInt} constrainX={0} color="#c4a574" noBounds
          onMove={(pt) => {
            isDraggingRef.current = true;
            const newY = Math.round(pt.y * 1000) / 1000;
            const deltaY = newY - yInt;
            const newD = Math.round((parsed.d + deltaY) * 1000) / 1000;
            
            const newLatex = formatTrig(parsed.a, parsed.b, parsed.c, newD);
            setLatex(newLatex);
            setParsed(parseMathString(newLatex));
          }}
          onMoveEnd={() => { isDraggingRef.current = false; }}
        />

        <DraggablePoint 
          x={crestVisible.x} y={crestVisible.y} color="#7a9898"
          onMoveStart={() => {
            dragOffsetRef.current = { dy: (parsed.d + parsed.a) - crestVisible.y };
          }}
          onMove={(pt) => {
            isDraggingRef.current = true;
            const targetY = pt.y + (dragOffsetRef.current?.dy || 0);
            let newA = targetY - parsed.d;
            newA = Math.max(-50, Math.min(50, newA));
            newA = Math.round(newA * 100) / 100;
            if (Math.abs(newA) < 0.1) newA = newA < 0 ? -0.1 : 0.1;
            
            const newLatex = formatTrig(newA, parsed.b, parsed.c, parsed.d);
            setLatex(newLatex);
            setParsed(parseMathString(newLatex));
          }}
          onMoveEnd={() => { isDraggingRef.current = false; }}
        />
        
        <DraggablePoint 
          x={troughVisible.x} y={troughVisible.y} color="#5a8a72"
          onMoveStart={() => {
            dragOffsetRef.current = { dx: troughX - troughVisible.x };
          }}
          onMove={(pt) => {
            isDraggingRef.current = true;
            const targetX = pt.x + (dragOffsetRef.current?.dx || 0);
            const dx = targetX - parsed.c;
            if (Math.abs(dx) < 0.1) return;
            let newB = -Math.PI / (2 * dx);
            if (parsed.a < 0) newB = -newB; 
            newB = Math.max(0.1, Math.min(10, Math.abs(newB)));
            newB = Math.round(newB * 100) / 100;
            
            const newLatex = formatTrig(parsed.a, newB, parsed.c, parsed.d);
            setLatex(newLatex);
            setParsed(parseMathString(newLatex));
          }}
          onMoveEnd={() => { isDraggingRef.current = false; }}
        />
      </g>
    );
  };

  const renderExponential = () => {
    const fn = (x) => parsed.a * Math.pow(parsed.b, x) + parsed.c;
    
    const yInt = parsed.a + parsed.c;
    const curveX = 1;
    const curveY = fn(curveX);
    const curveVisible = getVisiblePointOnCurve(curveX, curveY, fn, activeCtx);

    const asymX = activeCtx.cx; 
    const asymVisible = getVisiblePointOnCurve(asymX, parsed.c, () => parsed.c, activeCtx);

    return (
      <g>
        <line 
          x1={0} 
          y1={activeCtx.mathToPixel(0, parsed.c).py} 
          x2={activeCtx.width} 
          y2={activeCtx.mathToPixel(0, parsed.c).py} 
          stroke="rgba(107,143,113,0.45)" 
          strokeWidth={2} 
          strokeDasharray="6,6" 
          opacity={0.6}
        />
        
        <PlotCurve fn={fn} color="#9a8860" />
        
        <DraggablePoint 
          x={asymVisible.x} y={parsed.c} constrainX={asymVisible.x} color="rgba(107,143,113,0.55)" noBounds
          onMove={(pt) => {
            isDraggingRef.current = true;
            const newC = Math.round(pt.y * 1000) / 1000;
            const newLatex = formatExponential(parsed.a, parsed.b, newC);
            setLatex(newLatex);
            setParsed(parseMathString(newLatex));
          }}
          onMoveEnd={() => { isDraggingRef.current = false; }}
        />

        <DraggablePoint 
          x={0} y={yInt} constrainX={0} color="#c4a574" noBounds
          onMove={(pt) => {
            isDraggingRef.current = true;
            let newA = pt.y - parsed.c;
            newA = Math.round(newA * 1000) / 1000;
            if (Math.abs(newA) < 0.05) newA = newA < 0 ? -0.05 : 0.05; 
            
            const newLatex = formatExponential(newA, parsed.b, parsed.c);
            setLatex(newLatex);
            setParsed(parseMathString(newLatex));
          }}
          onMoveEnd={() => { isDraggingRef.current = false; }}
        />
        
        <DraggablePoint 
          x={curveVisible.x} y={curveVisible.y} color="#9a8860"
          onMoveStart={() => {
            dragOffsetRef.current = { dx: curveX - curveVisible.x, dy: curveY - curveVisible.y };
          }}
          onMove={(pt) => {
            isDraggingRef.current = true;
            let targetX = pt.x + (dragOffsetRef.current?.dx || 0);
            const targetY = pt.y + (dragOffsetRef.current?.dy || 0);
            
            if (Math.abs(targetX) < 0.1) targetX = targetX < 0 ? -0.1 : 0.1;
            
            let val = (targetY - parsed.c) / parsed.a;
            if (val <= 0) val = 0.001; 
            
            let newB = Math.pow(val, 1 / targetX);
            newB = Math.max(0.01, Math.min(50, newB)); 
            newB = Math.round(newB * 1000) / 1000;
            if (Math.abs(newB - 1) < 0.01) newB = 1.05; 
            
            const newLatex = formatExponential(parsed.a, newB, parsed.c);
            setLatex(newLatex);
            setParsed(parseMathString(newLatex));
          }}
          onMoveEnd={() => { isDraggingRef.current = false; }}
        />
      </g>
    );
  };

  if (variant === "compact") {
    const hasRenderable = isMultiLayer
      ? layers.some((layer) => parseMathString(layer.latex))
      : !!parsed;

    return (
      <div className="w-full mv-graph-panel flex flex-col font-mono text-mv-text relative" data-graph-panel="true">
        {onClose && !handTrackingEnabled && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 mv-btn mv-btn-icon z-20"
            title="Close Graph"
          >
            <X size={14} />
          </button>
        )}
        <div className="relative flex items-center justify-center overflow-hidden p-2" style={{ height: '370px', touchAction: 'none' }}>
          {hasRenderable ? (
            <svg
              ref={svgRef}
              viewBox={`0 0 ${activeCtx.width} ${activeCtx.height}`}
              className="w-full h-full mv-graph-panel"
              style={{ touchAction: 'none', cursor: 'crosshair' }}
              onPointerDown={handlePointerDownSVG}
            >
              <GraphContext.Provider value={activeCtx}>
                <Grid />
                {isMultiLayer ? (
                  layers.map((layer) => (
                    <GraphEquationLayer
                      key={layer.id}
                      layerId={layer.id}
                      latex={layer.latex}
                      color={layer.color}
                      onLatexChange={layer.onLatexChange}
                      onParsedChange={handleLayerParsedChange}
                    />
                  ))
                ) : (
                  <>
                    {parsed.type === 'linear' && renderLinear()}
                    {parsed.type === 'quadratic' && renderQuadratic()}
                    {parsed.type === 'cubic' && renderCubic()}
                    {parsed.type === 'trig' && renderTrig()}
                    {parsed.type === 'exponential' && renderExponential()}
                  </>
                )}
              </GraphContext.Provider>
            </svg>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-mv-dim text-xs p-4 text-center uppercase tracking-wider">
              [ERR] Unable to render equation
            </div>
          )}
          {!handTrackingEnabled && (
            <button
              onClick={(e) => {
                emitInteractionEffect(e.clientX, e.clientY, 'click');
                toggleAudio();
              }}
              disabled={!hasRenderable}
              title={isPlaying ? "Stop Audio" : "Play Audio"}
              className={`absolute bottom-4 right-4 z-10 w-16 h-16 rounded-full flex items-center justify-center
                          transition-all duration-200 ease-in-out
                          border
                          ${isPlaying
                            ? 'border-mv-alert-bright/50 bg-mv-alert/20 text-mv-alert-bright'
                            : 'border-mv-track/50 bg-mv-bg-elevated/20 text-mv-track'
                          }
                          hover:bg-opacity-50 hover:border-opacity-100 disabled:opacity-30 disabled:cursor-not-allowed
                          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-mv-bg focus:ring-mv-track`}
            >
              {isPlaying ? <Square size={24} /> : <Play size={24} className="ml-1" />}
            </button>
          )}
        </div>
      </div>
    );
  }


  // --- Full Page Variant ---
  return (
    <div className="h-full bg-mv-bg flex flex-col p-8 font-mono text-mv-text relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 mv-btn mv-btn-icon z-50"
          title="Close Graph"
        >
          <X size={14} />
        </button>
      )}
      <div className="max-w-4xl w-full mx-auto mb-8">
        <h1 className="text-sm font-semibold text-mv-bright uppercase tracking-[0.2em] flex items-center gap-3">
          <Activity size={18} className="text-mv-track" />
          Graph Sonification Engine
        </h1>
        <p className="text-mv-dim mt-3 text-xs leading-relaxed">
          Input equation — e.g. <code className="mv-code">y = 1(2)^x - 3</code> or <code className="mv-code">y = 2\sin(x - 3.14) + 1</code>.
          Pan viewport. Control points lock to screen edge.
        </p>
      </div>

      <div className="max-w-4xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <div className="mv-card">
            <h2 className="mv-card-title">Equation Input</h2>
            <math-field 
              ref={mfRef} 
              className="mv-math-field"
              style={{ fontSize: '20px' }}
            />
            {!parsed && <p className="text-mv-alert-bright text-xs mt-3 uppercase tracking-wider">[ERR] Parse failed — try y = a(b)^x + c, y = mx + c, or y = a\sin(b(x-c)) + d</p>}
          </div>

          <div className="mv-card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="mv-card-title" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>Audio Engine</h2>
              <Music size={16} className="text-mv-amber-bright" />
            </div>

            <div className="space-y-0 mb-6">
              <div className="mv-data-row">
                <span>Active Chord</span>
                <span>{chordInfo?.name}</span>
              </div>
              <div className="mv-data-row">
                <span>Root Note</span>
                <span>{chordInfo?.root}</span>
              </div>
              <div className="mv-data-row">
                <span>Harmonics</span>
                <span>
                  {chordInfo?.harmonicIntensity !== undefined 
                    ? `${Math.round(chordInfo.harmonicIntensity * 100)}%` 
                    : "0%"}
                </span>
              </div>
              {chordInfo?.tremoloDepth > 0 && (
                <div className="mv-data-row">
                  <span>Wobble (LFO)</span>
                  <span className="text-mv-amber-bright">{Math.round(chordInfo.tremoloRate * 10) / 10} Hz</span>
                </div>
              )}
            </div>

            <button 
              onClick={toggleAudio}
              disabled={!parsed}
              className={`mv-btn w-full ${isPlaying ? 'mv-btn-alert-active' : 'mv-btn-primary'}`}
              style={{ height: '44px' }}
            >
              {isPlaying ? (
                <><Square size={14} /> Stop Chord</>
              ) : (
                <><Play size={14} /> Play Swelling Chord</>
              )}
            </button>
          </div>
        </div>

        <div className="mv-graph-panel overflow-hidden h-[500px]">
           {parsed ? (
              <div className="w-full h-full relative flex items-center justify-center overflow-hidden" style={{ touchAction: 'none' }}>
                <svg 
                  ref={svgRef}
                  viewBox={`0 0 ${activeCtx.width} ${activeCtx.height}`} 
                  className="w-full max-w-[500px] h-full mv-graph-panel"
                  style={{ touchAction: 'none', cursor: 'crosshair' }}
                  onPointerDown={handlePointerDownSVG}
                >
                  <GraphContext.Provider value={activeCtx}>
                    <Grid />
                    {parsed.type === 'linear' && renderLinear()}
                    {parsed.type === 'quadratic' && renderQuadratic()}
                    {parsed.type === 'cubic' && renderCubic()}
                    {parsed.type === 'trig' && renderTrig()}
                    {parsed.type === 'exponential' && renderExponential()}
                  </GraphContext.Provider>
                </svg>
              </div>
           ) : (
             <div className="w-full h-full flex items-center justify-center text-mv-dim text-xs uppercase tracking-wider">
                [WAIT] Awaiting valid equation...
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

export { parseMathString } from './graphMath';