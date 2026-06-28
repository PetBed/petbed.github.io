import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MousePointer2, Pen, Type, Eraser, 
  Undo, Redo, PlaySquare, 
  Menu, Share2, Camera, X, Check, Delete, ChevronLeft, ChevronRight, Sigma
} from 'lucide-react';
import { useHandTracking } from './useHandTracking';
import { parseAndPrepareEquation, findAllActions, performAction, stripIdsFromMathJson } from './mathUtils';
import { MathfieldElement } from 'mathlive';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
MathfieldElement.fontsDirectory = '/fonts';
import { ComputeEngine } from 'https://esm.run/@cortex-js/compute-engine';
import MachineVisionOverlay from './MachineVisionOverlay';

// The exact sequence of states for the interactive demo.
const DEMO_SCRIPT = [
  { // 0: 2x + 2 = 6
    left: [
      { type: 'term', coef: '2', var: 'x', drag: 'coef' },
      { type: 'op', val: '+' },
      { type: 'term', coef: '2', var: null, drag: 'term' }
    ],
    right: [ { type: 'term', coef: '6', var: null } ]
  },
  { // 1: 2x + 2 - 2 = 6 - 2
    left: [
      { type: 'term', coef: '2', var: 'x' },
      { type: 'click_group', id: 'c1', items: [
        { type: 'op', val: '+' }, { type: 'term', coef: '2' },
        { type: 'op', val: '-', animClass: 'anim-step-1-sub' }, 
        { type: 'term', coef: '2', animClass: 'anim-step-1-sub' }
      ]}
    ],
    right: [
      { type: 'term', coef: '6' }, 
      { type: 'op', val: '-', animClass: 'anim-step-1' }, 
      { type: 'term', coef: '2', animClass: 'anim-step-1' }
    ]
  },
  { // 2: 2x = 6 - 2
    left: [ { type: 'term', coef: '2', var: 'x', animClass: 'anim-step-2' } ],
    right: [
      { type: 'click_group', id: 'c2', items: [
        { type: 'term', coef: '6' }, { type: 'op', val: '-' }, { type: 'term', coef: '2' }
      ]}
    ]
  },
  { // 3: 2x = 4
    left: [
      { type: 'term', coef: '2', var: 'x', drag: 'coef' }
    ],
    right: [ { type: 'term', coef: '4', var: null, animClass: 'anim-step-3' } ]
  },
  { // 4: 2x / 2 = 4 / 2
    left: [
      { type: 'click_group', id: 'c3', frac: { 
          num: [{ type: 'term', coef: '2', var: 'x' }], 
          den: [{ type: 'term', coef: '2', animClass: 'anim-step-4' }] 
      } }
    ],
    right: [
      { type: 'frac', num: [{ type: 'term', coef: '4' }], 
        den: [{ type: 'term', coef: '2', animClass: 'anim-step-4' }] }
    ]
  },
  { // 5: x = 4 / 2
    left: [ { type: 'term', coef: null, var: 'x', animClass: 'anim-step-5' } ],
    right: [
      { type: 'click_group', id: 'c4', frac: { num: [{ type: 'term', coef: '4' }], den: [{ type: 'term', coef: '2' }] } }
    ]
  },
  { // 6: x = 2
    left: [ { type: 'term', coef: null, var: 'x' } ],
    right: [ { type: 'term', coef: '2', var: null, animClass: 'anim-step-6' } ]
  }
];

export default function App() {
  const [script, setScript] = useState(DEMO_SCRIPT);
  const [step, setStep] = useState(0);
  const [isDemoActive, setIsDemoActive] = useState(true);
  const [ce, setCe] = useState(null);
  const [draggedAction, setDraggedAction] = useState(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0, visible: false });
  
  // Panning state for the main workspace
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const panOffsetRef = useRef(panOffset);
  useEffect(() => { panOffsetRef.current = panOffset; }, [panOffset]);

  // Solver state
  const [possibleActions, setPossibleActions] = useState([]);
  // Refs for state used in callbacks to avoid stale closures
  const scriptRef = useRef(script);
  useEffect(() => { scriptRef.current = script; }, [script]);
  const possibleActionsRef = useRef([]);
  useEffect(() => { possibleActionsRef.current = possibleActions; }, [possibleActions]);

  // Custom Keyboard State
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [keyboardInput, setKeyboardInput] = useState("");
  const mathfieldRef = useRef(null);
  
  // Camera & Tracking State
  const [isCameraMode, setIsCameraMode] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const cursor0Ref = useRef(null);
  const cursor1Ref = useRef(null);
  const canvasRef = useRef(null); 
  const mainRef = useRef(null);
  
  const stepRef = useRef(step);
  useEffect(() => { stepRef.current = step; }, [step]);
  const isDemoActiveRef = useRef(isDemoActive);
  useEffect(() => { isDemoActiveRef.current = isDemoActive; }, [isDemoActive]);

  // Effect to determine the next solvable action for custom equations
  useEffect(() => {
    if (!isDemoActive && ce) {
      const currentEq = script[step];
      console.log('[DEBUG] Finding actions for equation:', JSON.parse(JSON.stringify(currentEq)));
      const allActions = findAllActions(currentEq, ce) || [];
      console.log('[DEBUG] Found actions:', allActions);
      setPossibleActions(allActions);
    }
  }, [script, step, isDemoActive, ce]);

  useEffect(() => {
    // Initialize the Compute Engine once on component mount.
    setCe(new ComputeEngine());
  }, []); // Empty dependency array ensures this runs only once on mount.

  useEffect(() => {
    // Handle keyboard z-index separately when it's shown.
    if (showKeyboard && mathfieldRef.current) {
      mathfieldRef.current.virtualKeyboardZIndex = 100001;
    }
  }, [showKeyboard]);

  const handleKeyboardSubmit = () => {
    if (!mathfieldRef.current) return;

    // MathLive may return the math-json as a JS object or as a JSON string
    let raw = null;
    try {
      raw = typeof mathfieldRef.current.getValue === 'function'
        ? mathfieldRef.current.getValue('math-json')
        : null;
    } catch (err) {
      raw = null;
    }

    if (!raw) return;

    let mathJson = raw;
    if (typeof raw === 'string') {
      try { mathJson = JSON.parse(raw); } catch (e) { mathJson = null; }
    }

    // An empty field can result in `['Sequence']` or other non-renderable states.
    // We should not add an empty equation to the workspace.
    if (!mathJson || (Array.isArray(mathJson) && mathJson[0] === 'Sequence' && mathJson.length === 1)) {
      return;
    }

    const newEquationState = parseAndPrepareEquation(mathJson);

    if (isDemoActive) {
      // First custom equation, replace the demo script
      setScript([newEquationState]);
      setStep(0);
      setIsDemoActive(false);
    } else {
      // Subsequent custom equations, append to the script
      setScript(prev => [...prev, newEquationState]);
      setStep(prev => prev + 1);
    }

    setShowKeyboard(false);
    setKeyboardInput("");
  };

  const resetToDemo = () => {
    setScript(DEMO_SCRIPT);
    setStep(0);
    setIsDemoActive(true); // This will also clear possibleActions via its useEffect
    setPanOffset({ x: 0, y: 0 }); // Reset pan when returning to the demo
  };

  // --- Mouse & Hand Panning Logic ---
  const panStateRef = useRef({ isPanning: false, startX: 0, startY: 0, initialPan: { x: 0, y: 0 } });

  const handleMainMouseDown = (e) => {
    const target = e.target;
    // Ignore clicks on interactable elements, buttons, inputs, etc.
    if (target.closest('[data-drag-type], [data-click-group], button, input, a, [data-drop-zone="true"]')) {
        return;
    }
    
    e.preventDefault();
    const mainEl = mainRef.current;
    if (!mainEl) return;

    panStateRef.current = {
        isPanning: true,
        startX: e.clientX,
        startY: e.clientY,
        initialPan: panOffsetRef.current,
    };
    mainEl.style.cursor = 'grabbing';
    mainEl.style.userSelect = 'none';

    window.addEventListener('mousemove', handleMainMouseMove);
    window.addEventListener('mouseup', handleMainMouseUp);
  };

  const handleMainMouseMove = (e) => {
      if (!panStateRef.current.isPanning) return;
      e.preventDefault();

      const dx = e.clientX - panStateRef.current.startX;
      const dy = e.clientY - panStateRef.current.startY;

      setPanOffset({
        x: panStateRef.current.initialPan.x + dx,
        y: panStateRef.current.initialPan.y + dy,
      });
  };

  const handleMainMouseUp = () => {
      const mainEl = mainRef.current;
      if (mainEl) {
          mainEl.style.cursor = 'auto';
          mainEl.style.userSelect = 'auto';
      }
      panStateRef.current.isPanning = false;
      window.removeEventListener('mousemove', handleMainMouseMove);
      window.removeEventListener('mouseup', handleMainMouseUp);
  };

  // --- External Hand interaction wrappers ---
  const executeHandDrop = useCallback((type, dropSide, actionId) => {
    const isDemo = isDemoActiveRef.current;
    const curStep = stepRef.current;

    if (isDemo) {
      if (curStep === 0 && type === 'term' && dropSide === 'right') {
        setStep(1);
      } else if (curStep === 3 && type === 'coef' && dropSide === 'right') {
        setStep(4);
      }
    } else if (type === 'custom' && actionId) {
      const actions = possibleActionsRef.current;
      const actionToPerform = actions.find(a => a.nodeId === actionId);
      if (actionToPerform && (actionToPerform.type === 'isolate' || actionToPerform.type === 'divide' || actionToPerform.type === 'multiply_by_denominator')) {
        const { side: actionSide } = actionToPerform;
        const oppositeSide = actionSide === 'left' ? 'right' : 'left';
        if (dropSide === oppositeSide) {
          const newEquation = performAction(scriptRef.current[curStep], actionToPerform);
          setScript(prev => [...prev, newEquation]);
          setStep(prev => prev + 1);
        }
      }
    }
  }, []);

  const executeHandClick = useCallback((id) => {
    const isDemo = isDemoActiveRef.current;
    const curStep = stepRef.current;
    if (isDemo) {
      if (curStep === 1 && id === 'c1') setStep(2);
      if (curStep === 2 && id === 'c2') setStep(3);
      if (curStep === 4 && id === 'c3') setStep(5);
      if (curStep === 5 && id === 'c4') setStep(6);
    } else {
      // Handle clicks for custom equations
      const actions = possibleActionsRef.current;
      const actionToPerform = actions.find(a => a.type === 'simplify' && a.nodeId === id);
      if (actionToPerform) {
        const newEquation = performAction(scriptRef.current[curStep], actionToPerform);
        setScript(prev => [...prev, newEquation]);
        setStep(prev => prev + 1);
      }
    }
  }, []); // Keep dependencies empty; we use refs to get current state.

  const handleHandTrackingError = useCallback(() => {
    setIsCameraMode(false);
    alert("Unable to access camera or load tracking models.");
  }, []);
  
  // --- Hand Tracking & Camera Logic ---
  useHandTracking({
    enabled: isCameraMode,
    videoRef,
    canvasRef,
    cursor0Ref,
    cursor1Ref,
    mainRef,
    panOffset,
    setPanOffset,
    onDrop: executeHandDrop,
    onClick: executeHandClick,
    onLoadingChange: setIsCameraLoading,
    onError: handleHandTrackingError
  });

  // --- GSAP Choreography ---
  useEffect(() => {
    if (step === 0 || !isDemoActive) return;

    let ctx;

    const runAnimations = () => {
      const gsap = window.gsap;
      if (!gsap) return;

      ctx = gsap.context(() => {
        gsap.fromTo(`#row-${step}`,
          { opacity: 0, y: -25 },
          { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
        );

        if (step === 1) {
          gsap.fromTo('.anim-step-1',
            { x: -180, y: -50, scale: 1.2, opacity: 0 },
            { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.2)', stagger: 0.05 }
          );
          gsap.fromTo('.anim-step-1-sub',
            { scale: 0, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.4, delay: 0.1, ease: 'back.out(2)', stagger: 0.05 }
          );
        }
        else if (step === 2) {
          gsap.fromTo('.anim-step-2', { x: 40 }, { x: 0, duration: 0.5, ease: 'power2.out' });
        }
        else if (step === 3) {
          gsap.fromTo('.anim-step-3', { scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2.5)' });
        }
        else if (step === 4) {
          gsap.fromTo('.anim-step-4', { x: -80, y: -40, scale: 1.5, opacity: 0 }, { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.2)', stagger: 0.1 });
        }
        else if (step === 5 || step === 6) {
          gsap.fromTo(`.anim-step-${step}`, { scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.5)' });
        }
      }, containerRef);
    };

    if (window.gsap) {
      runAnimations();
    } else {
      const gScript = document.createElement('script');
      gScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js';
      gScript.async = true;
      gScript.onload = runAnimations;
      document.head.appendChild(gScript);
    }

    return () => { if (ctx) ctx.revert(); };
  }, [step, isDemoActive]);

  // --- Drag & Drop Handlers ---
  const handlePointerDragStart = (e, action) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedAction(action);
    setDragPosition({ x: e.clientX, y: e.clientY, visible: true });
  };

  const handleDrop = (dropSide) => {
    if (!draggedAction) return;

    if (isDemoActive) {
      if (typeof draggedAction === 'string') {
        if (step === 0 && draggedAction === 'term' && dropSide === 'right') {
          setStep(1);
        } else if (step === 3 && draggedAction === 'coef' && dropSide === 'right') {
          setStep(4);
        }
      }
    } else if (typeof draggedAction === 'object' && draggedAction !== null && 'side' in draggedAction) {
      const oppositeSide = draggedAction.side === 'left' ? 'right' : 'left';
      if (dropSide === oppositeSide) {
        const newEquation = performAction(script[step], draggedAction);
        setScript(prev => [...prev, newEquation]);
        setStep(prev => prev + 1);
      }
    }

    setDraggedAction(null);
    setDragPosition({ x: 0, y: 0, visible: false });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const preventTextSelection = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    if (!draggedAction) return undefined;

    const handlePointerMove = (e) => {
      setDragPosition((prev) => ({ ...prev, x: e.clientX, y: e.clientY }));
    };

    const handlePointerUp = (e) => {
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const dropZone = target?.closest('[data-drop-zone="true"]');
      if (dropZone) {
        handleDrop(dropZone.getAttribute('data-drop-side'));
      } else {
        setDraggedAction(null);
        setDragPosition({ x: 0, y: 0, visible: false });
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggedAction, step, script, isDemoActive]);


  // --- Click Handlers (Native HTML5) ---
  const handleClickGroup = (id) => executeHandClick(id);

  // --- Dumb/Static MathJSON Renderer ---
  // This component's only job is to render a MathJSON node. It has no interactivity.
  const StaticMathNode = ({ node, ce }) => {
    if (!node || !ce) return null;

    if (typeof node !== 'object') {
      if (typeof node === 'string' && /^[a-zA-Z]$/.test(node)) {
        return <span className="italic mr-[2px]">{node}</span>;
      }
      return <>{String(node)}</>;
    }

    try {
      const cleanNode = stripIdsFromMathJson(node);
      const latex = ce.box(cleanNode).latex;

      if (typeof latex === 'string' && latex.trim()) {
        return (
          <span className="inline-flex items-center align-middle leading-none">
            <InlineMath math={latex} />
          </span>
        );
      }
    } catch (error) {
      console.warn('[LatexRender] Failed to render node:', error, node);
    }

    return <span className="text-mv-dim">?</span>;
  };

  // --- Recursive MathJSON Renderer for Custom Equations ---
  const MathJsonNode = ({ node, isLastStep, side }) => {
    if (!node || !ce) return null;

    const actions = isLastStep ? possibleActionsRef.current : [];

    // Base case: Primitives (numbers, variables)
    if (typeof node !== 'object') {
      return <StaticMathNode node={node} ce={ce} />;
    }

    // It's an array expression
    const head = node[0];
    let args = node.slice(1);
    let metadata = {};
    if (args.length > 0 && typeof args[args.length - 1] === 'object' && !Array.isArray(args[args.length - 1])) {
      metadata = args.pop();
    }
    const nodeId = metadata.id;
    console.log(`[DEBUG] MathJsonNode rendering node (id: ${nodeId}, side: ${side}):`, node);

    const actionForNode = actions.find(a => a.nodeId === nodeId);

    // --- Interactivity Check for the entire node ---
    if (actionForNode && actionForNode.type === 'simplify') {
      return (
        <span onClick={() => handleClickGroup(actionForNode.nodeId)} data-click-group={actionForNode.nodeId} className="cursor-pointer hover:bg-mv-track-dim/30 rounded-lg p-2 -m-2 select-none">
          <span style={{ pointerEvents: 'none' }} >
            <StaticMathNode node={node} ce={ce} />
          </span>
        </span>
      );
    }

    // --- Recursive Rendering: check if CHILDREN are interactive ---
    switch (head) {
      case 'Add':
      case 'Subtract': {
        const op = head === 'Add' ? '+' : '-';        
        const actionForParent = actions.find(a => a.nodeId === nodeId && a.type === 'isolate');
        if (actionForParent) {
            console.log(`[DEBUG] Found ISOLATE action for parent node ${nodeId}:`, actionForParent);
        }
        const termToDragJson = actionForParent ? JSON.stringify(actionForParent.termNode) : null;

        return (
          <span className="inline-flex items-center">
            {args.map((arg, i) => {
              const isDraggable = actionForParent && JSON.stringify(arg) === termToDragJson;
              if (isDraggable) {
                console.log(`[DEBUG] Rendering DRAGGABLE (isolate) for node id ${actionForParent.nodeId}, term:`, arg);
              }
              const operator = i > 0 ? <span className="mx-[0.25em]">{op}</span> : null;

              if (isDraggable) { 
                return (
                  <span
                    key={i}
                    onPointerDown={(e) => handlePointerDragStart(e, actionForParent)}
                    onMouseDown={preventTextSelection}
                    onTouchStart={preventTextSelection}
                    data-drag-type="custom"
                    data-action-id={actionForParent.nodeId}
                    className="cursor-grab active:cursor-grabbing hover:bg-mv-track-dim/30 rounded-lg p-2 -m-2 select-none inline-flex items-center"
                    style={{ WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'none' }}
                  >
                    <span style={{ pointerEvents: 'none' }}>
                      {operator} <StaticMathNode node={arg} ce={ce} />
                    </span>
                  </span>
                );
              }
              return (
                <React.Fragment key={i}>
                  {operator}
                  <MathJsonNode node={arg} isLastStep={isLastStep} side={side} />
                </React.Fragment>
              );
            })}
          </span>
        );
      }
      case 'Multiply': {
        const actionForParent = actions.find(a => a.nodeId === nodeId && a.type === 'divide');
        if (actionForParent) {
            console.log(`[DEBUG] Found DIVIDE action for parent node ${nodeId}:`, actionForParent);
        }
        const coeffToDrag = actionForParent ? actionForParent.coefficient : null;

        return (
          <span className="inline-flex items-center">
            {args.map((arg, i) => {
              const isDraggable = actionForParent && arg === coeffToDrag;
              if (isDraggable) {
                console.log(`[DEBUG] Rendering DRAGGABLE (divide) for node id ${actionForParent.nodeId}, coefficient:`, arg);
              }
              // Render implicit multiplication by just having elements next to each other
              if (isDraggable) {
                return (
                  <span
                    key={i}
                    onPointerDown={(e) => handlePointerDragStart(e, actionForParent)}
                    onMouseDown={preventTextSelection}
                    onTouchStart={preventTextSelection}
                    data-drag-type="custom"
                    data-action-id={actionForParent.nodeId}
                    className="cursor-grab active:cursor-grabbing hover:bg-mv-track-dim/30 rounded-lg p-2 -m-2 select-none"
                    style={{ WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'none' }}
                  >
                    <span style={{ pointerEvents: 'none' }}>
                      <StaticMathNode node={arg} ce={ce} />
                    </span>
                  </span>
                );
              }
              return <MathJsonNode key={i} node={arg} isLastStep={isLastStep} side={side} />;
            })}
          </span>
        );
      }
      // For non-interactive containers, just recurse
      // This case also handles making the denominator draggable for multiplication.
      case 'Divide': {
        const actionForNode = actions.find(a => a.nodeId === nodeId && a.type === 'multiply_by_denominator');
        if (actionForNode) {
            console.log(`[DEBUG] Found MULTIPLY_BY_DENOMINATOR action for node ${nodeId}:`, actionForNode);
            console.log(`[DEBUG] Rendering DRAGGABLE (multiply_by_denominator) for node id ${actionForNode.nodeId}`);
        }
        const numeratorNode = args[0];
        const denominatorNode = args[1];

        return (
          <span className="inline-flex flex-col items-center justify-center align-middle mx-[0.25em] text-[0.9em]">
            <span className="w-full text-center leading-[1.3] px-1 pb-px border-b-[1px] border-mv-track">
                <MathJsonNode node={numeratorNode} isLastStep={isLastStep} side={side} />
            </span>
            <span className="w-full text-center leading-[1.3] px-1 pt-px flex justify-center">
              {actionForNode ? (
                <span
                  onPointerDown={(e) => handlePointerDragStart(e, actionForNode)}
                  onMouseDown={preventTextSelection}
                  onTouchStart={preventTextSelection}
                  data-drag-type="custom"
                  data-action-id={actionForNode.nodeId}
                  className="cursor-grab active:cursor-grabbing hover:bg-mv-track-dim/30 rounded-lg p-2 -m-2 select-none"
                  style={{ WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'none' }}
                >
                  <span style={{ pointerEvents: 'none' }}>
                    <StaticMathNode node={denominatorNode} ce={ce} />
                  </span>
                </span>
              ) : (
                <MathJsonNode node={denominatorNode} isLastStep={isLastStep} side={side} />
              )}
            </span>
          </span>
        );
      }
      default: { // Fallback for unknown functions or structures
        return <StaticMathNode node={node} ce={ce} />;
      }
    }
  };

  const renderPreviewNode = (action) => {
    if (!ce || !action) return null;
    const previewNode = action.termNode ?? action.coefficient ?? action.denominator ?? action.to ?? null;
    if (!previewNode) return null;
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
        <StaticMathNode node={previewNode} ce={ce} />
      </div>
    );
  };

  // --- Recursive AST Renderer ---
  const renderExpression = (expr, isLastStep, side) => {
    // Use MathLive for rendering custom (non-demo) equations.
    if (!isDemoActive) {
      if (!ce || !Array.isArray(expr) || expr.length === 0) return null;
      
      // expr is an array of root nodes for that side of the equation.
      return expr.map((node, i) => (
        <MathJsonNode key={i} node={node} isLastStep={isLastStep} side={side} />
      ));
    }

    // Fallback to the original renderer for the interactive demo script.
    return expr.map((node, i) => {
      const animClass = node.animClass ? ` ${node.animClass}` : '';
      
      if (node.type === 'term') {
        const content = (
          <>
            {node.coef}
            {node.var && <span className="italic mr-[2px]">{node.var}</span>}
          </>
        );

        if (isLastStep && node.drag === 'coef') {
          return (
            <span key={i} className={`inline-flex items-center${animClass}`}>
              <span 
                onPointerDown={(e) => handlePointerDragStart(e, 'coef')}
                onMouseDown={preventTextSelection}
                onTouchStart={preventTextSelection}
                data-drag-type="coef"
                className="cursor-grab active:cursor-grabbing hover:text-mv-track transition-colors p-3 -m-3 rounded select-none relative"
                style={{ WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'none' }}
              >
                {node.coef}
              </span>
              <span className="italic">{node.var}</span>
            </span>
          );
        }

        if (isLastStep && node.drag === 'term') {
          return (
            <span 
              key={i}
              onPointerDown={(e) => handlePointerDragStart(e, 'term')}
              onMouseDown={preventTextSelection}
              onTouchStart={preventTextSelection}
              data-drag-type="term"
              className={`cursor-grab active:cursor-grabbing hover:text-mv-track transition-colors p-3 -m-3 rounded select-none inline-flex items-center${animClass}`}
              style={{ WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'none' }}
            >
              {content}
            </span>
          );
        }

        return <span key={i} className={`inline-flex items-center${animClass}`}>{content}</span>;
      }

      if (node.type === 'op') {
        return <span key={i} className={`mx-[0.25em]${animClass}`}>{node.val}</span>;
      }

      if (node.type === 'frac') {
        return (
          <span key={i} className={`inline-flex flex-col items-center justify-center align-middle mx-[0.25em] text-[0.9em]${animClass}`}>
            <span className="w-full text-center leading-[1.3] px-1 pb-px border-b-[1px] border-mv-track">{renderExpression(node.num, isLastStep, side)}</span>
            <span className="w-full text-center leading-[1.3] px-1 pt-px">{renderExpression(node.den, isLastStep, side)}</span>
          </span>
        );
      }

      if (node.type === 'click_group') {
        const inner = node.items 
          ? renderExpression(node.items, isLastStep, side) 
          : (node.frac ? renderExpression([{...node.frac, type: 'frac'}], isLastStep, side) : null);
        
        if (isLastStep) {
          return (
            <span 
              key={i} 
              onClick={() => handleClickGroup(node.id)} 
              data-click-group={node.id}
              className={`cursor-pointer hover:bg-mv-track-dim/40 p-3 -m-3 rounded transition-colors select-none inline-flex items-center${animClass}`}
            >
              {inner}
            </span>
          );
        }
        return <span key={i} className={`inline-flex items-center${animClass}`}>{inner}</span>;
      }

      return null;
    });
  };

  return (
    <div className="mv-root h-screen w-full flex flex-col font-mono text-mv-text overflow-hidden relative">
      
      {!isCameraMode && <MachineVisionOverlay showHud={false} className="z-0" />}
      
      {/* Video Background Layer */}
      {isCameraMode && (
        <>
          <video ref={videoRef} className="mv-camera-feed absolute inset-0 w-full h-full object-cover -scale-x-100 z-0" autoPlay playsInline />
          <div className="mv-camera-feed-overlay" />
          <MachineVisionOverlay />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover -scale-x-100 z-[5] pointer-events-none" />
        </>
      )}

      {/* Top Navbar */}
      <header className="h-12 mv-panel z-20 relative shrink-0 justify-between px-2" style={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}>
        <div className="flex items-center gap-3">
          <Menu className="text-mv-dim cursor-pointer" size={18} />
          <div className="text-mv-bright text-xs uppercase tracking-wider">MV-WORKSPACE &gt; MATH_SHEET</div>
          <div className="flex items-center gap-1 ml-2 border-l pl-3 border-mv-border-dim">
             <button 
                onClick={() => setShowKeyboard(true)}
                className="mv-btn mv-btn-primary"
                style={{ height: '28px', fontSize: '10px' }}
              >
                <Sigma size={12} /> Formulas
              </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsCameraMode(!isCameraMode)} 
            disabled={isCameraLoading}
            className={`mv-btn ${isCameraMode ? 'mv-btn-active' : ''}`}
            style={{ height: '28px', fontSize: '10px' }}
          >
            <Camera size={12} /> 
            {isCameraLoading ? 'Init...' : isCameraMode ? 'Track:ON' : 'Track:OFF'}
          </button>
          <div className="mv-divider" />
          <button onClick={resetToDemo} className="mv-btn" style={{ height: '28px', fontSize: '10px' }}>
            <PlaySquare size={12} /> Reset
          </button>
          <button className="mv-btn" style={{ height: '28px', fontSize: '10px' }}>
            <Share2 size={12} /> Share
          </button>
        </div>
      </header>

      <div className={`flex flex-1 overflow-hidden z-10 transition-colors duration-300 ${isCameraMode ? 'bg-mv-bg/60' : 'bg-mv-bg'}`}>
        
        {/* Left Toolbar */}
        <aside className={`w-14 border-r flex flex-col items-center py-3 gap-2 shrink-0 ${isCameraMode ? 'bg-mv-panel/80 border-mv-border-dim' : 'bg-mv-panel border-mv-border-dim'}`}>
          {[MousePointer2, Pen, Type, Eraser].map((Icon, idx) => (
            <button key={idx} className={`mv-btn mv-btn-icon ${idx === 0 ? 'mv-btn-active' : ''}`} style={{ width: '28px', height: '28px' }}>
              <Icon size={16} />
            </button>
          ))}
          <div className="w-6 h-px bg-mv-border-dim my-1" />
          <button className="mv-btn mv-btn-icon" style={{ width: '28px', height: '28px' }}><Undo size={16} /></button>
        </aside>

        {/* Main Canvas */}
        <main ref={mainRef} onMouseDown={handleMainMouseDown} className="flex-1 relative overflow-auto" style={{ 
            fontFamily: '"Times New Roman", Times, serif',
            backgroundSize: '24px 24px',
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.035) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.035) 1px, transparent 1px)
            `,
          }}>
          
          <div ref={containerRef} className="p-24 pt-32 max-w-4xl flex flex-col items-center" style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}>

            {/* Steps Container */}
            <div className="flex flex-col items-start text-[2.75rem] leading-none text-mv-bright tracking-tight">
              {(!isDemoActive && !ce) ? (
                <div className="text-mv-dim text-xs font-mono p-4 uppercase tracking-wider">[LOAD] Math Engine...</div>
              ) : (
                script.slice(0, step + 1).map((s, idx) => {
                  const isLast = idx === step;
                  
                  return (
                    <div key={idx} id={`row-${idx}`} className="flex flex-row items-stretch min-h-[4rem] mb-1">
                      <div 
                        data-drop-zone={isLast ? "true" : "false"}
                        data-drop-side="left"
                        className="flex flex-row items-center justify-end min-w-[100px] pr-1 transition-colors rounded-lg"
                        onPointerOver={handleDragOver}
                      >
                        {renderExpression(s.left, isLast, 'left')}
                      </div>

                      {s.right.length > 0 && (
                        <div className="flex flex-row items-center justify-center w-[40px] mx-[0.1em]">
                          =
                        </div>
                      )}

                      <div 
                        data-drop-zone={isLast ? "true" : "false"}
                        data-drop-side="right"
                        className={`flex flex-row items-center justify-start min-w-[50px] pl-1 transition-colors rounded-lg`}
                        onPointerOver={handleDragOver}
                      >
                        {renderExpression(s.right, isLast, 'right')}
                      </div>
                      
                      {isDemoActive && (
                        <div className="relative flex flex-col items-center justify-center w-12 ml-4">
                          {idx > 0 && <div className="absolute top-[-3rem] bottom-[50%] w-px bg-mv-track/40 pointer-events-none" />}
                          <div className="w-[12px] h-[12px] border border-mv-track bg-mv-bg z-10" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </main>
      </div>

      {/* --- FORMULA EDITOR MODAL --- */}
      {showKeyboard && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center mv-modal-backdrop p-4">
          <div className="mv-modal z-[100001]">
            
            <div className="flex justify-between items-center">
                <div>
                  <h2 className="mv-modal-title">Formula Editor</h2>
                  <p className="mv-modal-subtitle">MATHLIVE // KEYBOARD INPUT</p>
                </div>
                <button 
                    onClick={() => setShowKeyboard(false)}
                    className="mv-btn mv-btn-icon"
                >
                    <X size={14} strokeWidth={2.5} />
                </button>
            </div>

            <math-field
                ref={mathfieldRef}
                onInput={e => setKeyboardInput(e.target.value)}
                className="mv-math-field"
                placeholder="e.g., y = 2x^2 + 5"
            >
                {keyboardInput}
            </math-field>
            
            <div className="flex justify-end">
                <button 
                    onClick={handleKeyboardSubmit}
                    className="mv-btn mv-btn-primary"
                >
                    <Check size={14} strokeWidth={3} />
                    Apply
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Drag Preview */}
      {draggedAction && dragPosition.visible && (
        <div
          className="fixed top-0 left-0 pointer-events-none z-[100002] text-[2.75rem] leading-none text-mv-bright tracking-tight"
          style={{
            transform: `translate(${dragPosition.x}px, ${dragPosition.y}px) translate(-50%, -50%)`,
            fontFamily: '"Times New Roman", Times, serif',
          }}
        >
          {isDemoActive ? (
            <div className="border border-mv-border bg-mv-elevated px-3 py-2">
              {/* Hardcoded preview for the demo script */}
              {draggedAction === 'term' && '2'}
              {draggedAction === 'coef' && '2'}
            </div>
          ) : (
            renderPreviewNode(draggedAction)
          )}
        </div>
      )}

      {/* Custom Virtual Hand Cursors */}
      {isCameraMode && (
        <>
          <div ref={cursor0Ref} className="mv-tracker-cursor" style={{ transition: 'transform 0.05s ease-out' }}>
            <div className="mv-tracker-cursor-inner" />
          </div>
          <div ref={cursor1Ref} className="mv-tracker-cursor" style={{ transition: 'transform 0.05s ease-out' }}>
            <div className="mv-tracker-cursor-inner" />
          </div>
        </>
      )}
    </div>
  );
}