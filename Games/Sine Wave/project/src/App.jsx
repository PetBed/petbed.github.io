import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { Undo, Redo, RefreshCw, PlusSquare, X, Check, Camera, ZoomIn, ZoomOut } from 'lucide-react';
import {
    applyCreatedElementZoom,
    attachGmCanvasNavigation,
    clampZoom,
    isGmCanvasBackground,
    panCanvasModel,
    screenToCanvasPoint,
    zoomCanvasModel,
} from './gmCanvasNavigation';
import { MathfieldElement } from 'mathlive';
import { useHandTracking } from './useHandTracking'; // Assuming this file exists alongside App.jsx
import GraphAudioPrototype, { parseMathString } from './GraphSound';
import { animateGraphFlickerIn } from './graphRevealAnimation';
import MachineVisionOverlay from './MachineVisionOverlay';
import { emitInteractionEffect, emitInteractionEffectOnElement } from './interactionEffects';

MathfieldElement.fontsDirectory = '/fonts';

// A singleton promise to ensure the GM API script is loaded only once.
let gmApiPromise = null;
const loadGmApi = () => {
    if (!gmApiPromise) {
        gmApiPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://graspablemath.com/shared/libs/gmath/gm-inject.js';
            script.async = true;
            script.onload = () => {
                if (window.loadGM) {
                    console.log('Graspable Math API loader found. Loading GM...');
                    window.loadGM(() => {
                        console.log('Graspable Math library loaded.');
                        resolve(window.gmath);
                    }, { version: 'latest' });
                } else {
                    reject(new Error('loadGM function not found on window after script load.'));
                }
            };
            script.onerror = (err) => {
                console.error('Failed to load GM inject script:', err);
                reject(err);
            };
            document.body.appendChild(script);
        });
    }
    return gmApiPromise;
};

const LAYER_COLORS = ['#6b8f71', '#c4a574', '#7a9898', '#9a8860', '#a86565'];

const normalizeGraphSources = (element) => {
    if (element._graphSources?.length) return element._graphSources;
    if (element._currentLatex) {
        return [{
            layerId: element._defaultLayerId || 'layer-0',
            sourceDomEl: element._graphSourceEl || null,
            derivationElement: element._graphSourceDerivation || null,
            latex: element._currentLatex,
        }];
    }
    return [];
};

const getGraphElementFromHost = (hostEl, model) => {
    if (!hostEl || !model) return null;
    return model.elements().find((element) => element._graphHostEl === hostEl) || null;
};

const findGraphHostAtPoint = (x, y) => {
    const stack = document.elementsFromPoint(x, y);
    for (const el of stack) {
        const host = el.closest?.('.canvas-element');
        if (host?.querySelector('[data-graph-panel]')) return host;
    }
    return null;
};

const rectsOverlap = (a, b, threshold = 0.25) => {
    const left = Math.max(a.left, b.left);
    const right = Math.min(a.right, b.right);
    const top = Math.max(a.top, b.top);
    const bottom = Math.min(a.bottom, b.bottom);
    if (right <= left || bottom <= top) return false;
    const overlapArea = (right - left) * (bottom - top);
    const minArea = Math.min(a.width * a.height, b.width * b.height);
    return minArea > 0 && overlapArea / minArea >= threshold;
};

const Line = ({ x1, y1, x2, y2 }) => {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} className="mv-connection-line" strokeWidth="1" />;
};

const getConnectionLinePoints = (sourceEl, targetEl) => {
    const graphButton = sourceEl.querySelector('.gm-graph-button');
    const sourceAnchor = (graphButton && !graphButton.classList.contains('gm-graph-button--hidden'))
        ? graphButton
        : sourceEl;
    const sourceRect = sourceAnchor.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    const x1 = sourceRect.left + sourceRect.width / 2;
    const y1 = sourceRect.top + sourceRect.height / 2;
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;

    const dx = targetCenterX - x1;
    const dy = targetCenterY - y1;

    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
        return { x1, y1, x2: targetCenterX, y2: targetCenterY };
    }

    let x2;
    let y2;

    if (Math.abs(dx) * targetRect.height > Math.abs(dy) * targetRect.width) {
        x2 = dx > 0 ? targetRect.left : targetRect.right;
        const t = (x2 - x1) / (dx || 1);
        y2 = y1 + dy * t;
        y2 = Math.max(targetRect.top, Math.min(targetRect.bottom, y2));
    } else {
        y2 = dy > 0 ? targetRect.top : targetRect.bottom;
        const t = (y2 - y1) / (dy || 1);
        x2 = x1 + dx * t;
        x2 = Math.max(targetRect.left, Math.min(targetRect.right, x2));
    }

    return { x1, y1, x2, y2 };
};

export default function TestWorkspace() {
    const gmCanvasRef = useRef(null);
    const gmApiRef = useRef(null);
    const mainContainerRef = useRef(null);
    const [isGmReady, setIsGmReady] = useState(false);
    const [showInsertModal, setShowInsertModal] = useState(false);
    const mathFieldRef = useRef(null);
    const activePointerIdRef = useRef(1);
    const activeDragTargetRef = useRef(null);
    const [lines, setLines] = useState([]);
    const [elementPairs, setElementPairs] = useState([]);
    const [canvasZoom, setCanvasZoom] = useState(1);
    const canvasZoomRef = useRef(1);
    const gmNavRef = useRef(null);
    const lastHandPanOffsetRef = useRef({ x: 0, y: 0 });
    const openGraphsRef = useRef(new WeakMap());
    const activeGraphDragHostRef = useRef(null);
    const mouseGraphDragHostRef = useRef(null);

    // --- Hand Tracking State & Refs ---
    const [isCameraMode, setIsCameraMode] = useState(false);
    const [isCameraLoading, setIsCameraLoading] = useState(false);
    const videoRef = useRef(null);
    const handCanvasRef = useRef(null);
    const cursor0Ref = useRef(null);
    const cursor1Ref = useRef(null);
    // Dummy pan state for useHandTracking hook compatibility
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    
    const showGraphOpenButton = (button) => {
        if (button) button.classList.remove('gm-graph-button--hidden');
    };

    const hideGraphOpenButton = (sourceElement) => {
        const button = sourceElement?.querySelector('.gm-graph-button');
        if (button) button.classList.add('gm-graph-button--hidden');
        return button || null;
    };

    const cleanupGraphHost = (element) => {
        if (!element) return;

        if (element._graphRevealTween) {
            element._graphRevealTween.kill();
            element._graphRevealTween = null;
        }

        if (element.reactRoot) {
            element.reactRoot.unmount();
            element.reactRoot = null;
        }

        showGraphOpenButton(element._graphOpenButton);
        if (element._graphSourceEl) {
            openGraphsRef.current.delete(element._graphSourceEl);
        }
        element._graphSources?.forEach((source) => {
            if (source.sourceDomEl) openGraphsRef.current.delete(source.sourceDomEl);
            if (source.derivationElement) {
                source.derivationElement._linkedGraphElement = null;
            }
        });
        if (element._graphSourceDerivation && !element._graphSources?.length) {
            element._graphSourceDerivation._linkedGraphElement = null;
        }
        if (element._graphHostEl) {
            setElementPairs((prev) => prev.filter((pair) => pair.targetEl !== element._graphHostEl));
        }

        element._isGraphHost = false;
    };

    const closeGraphElement = useCallback((element) => {
        if (!element || !gmApiRef.current?.model) return;

        cleanupGraphHost(element);
        gmApiRef.current.model.removeElement(element);
    }, []);

    const syncLayerLatexToDerivation = useCallback((graphElement, source, newLatex) => {
        source.latex = newLatex;
        const derivation = source.derivationElement;
        if (!derivation?.setExpression || graphElement._syncingLatex) return;

        graphElement._syncingLatex = true;
        try {
            derivation.setExpression(newLatex);
        } finally {
            graphElement._syncingLatex = false;
        }
    }, []);

    const renderGraphHost = useCallback((graphElement, { handTrackingEnabled = false } = {}) => {
        if (!graphElement.reactRoot) return;

        const sources = normalizeGraphSources(graphElement);
        graphElement._graphSources = sources;

        graphElement.reactRoot.render(
            <GraphAudioPrototype
                layers={sources.map((source, index) => ({
                    id: source.layerId,
                    latex: source.latex,
                    color: LAYER_COLORS[index % LAYER_COLORS.length],
                    onLatexChange: (newLatex) => syncLayerLatexToDerivation(graphElement, source, newLatex),
                }))}
                variant="compact"
                handTrackingEnabled={handTrackingEnabled}
                onClose={() => closeGraphElement(graphElement)}
                onRegisterHandControls={(controls) => {
                    graphElement._handControls = controls;
                }}
            />
        );
    }, [closeGraphElement, syncLayerLatexToDerivation]);

    const attachDerivationGraphSync = useCallback((graphElement, derivationElement) => {
        if (!derivationElement) return;

        derivationElement._linkedGraphElement = graphElement;

        if (derivationElement._graphChangeHandlerAttached) return;
        derivationElement._graphChangeHandlerAttached = true;

        derivationElement.events.on('change', ({ model }) => {
            const linkedGraph = derivationElement._linkedGraphElement;
            if (!linkedGraph?._isGraphHost || linkedGraph._syncingLatex || !model) return;

            const newLatex = model.to_latex();
            const source = linkedGraph._graphSources?.find((entry) => entry.derivationElement === derivationElement);
            if (!source) return;
            if (!newLatex || newLatex === source.latex) return;
            if (!parseMathString(newLatex)) return;

            source.latex = newLatex;
            renderGraphHost(linkedGraph, { handTrackingEnabled: isCameraMode });
        });
    }, [renderGraphHost, isCameraMode]);

    const removeGraphTextboxToolbar = (graphHostElement) => {
        graphHostElement.querySelector('.btn-toolbar')?.remove();
    };

    const createGraphForLatex = useCallback((latex, { sourceDomEl = null, derivationElement = null } = {}) => {
        if (!gmApiRef.current) {
            console.error('[createGraphForLatex] Graspable Math API not ready.');
            return;
        }

        if (sourceDomEl && openGraphsRef.current.has(sourceDomEl)) {
            return;
        }

        const graphButton = hideGraphOpenButton(sourceDomEl);

        console.log(`[createGraphForLatex] Creating graph host for LaTeX: "${latex}"`);

        gmApiRef.current.model.createElement(
            'textbox', 
            {
                pos: 'auto',
                size: { width: 400, height: 450 },
                initialLatex: latex,
                text: 'Loading Graph...',
                edit_mode_drag_box_width: 40
            },
            'create-graph-host',
            (element) => {
                console.log('[GM createElement callback] Received element:', element);

                element._isGraphHost = true;
                element._graphSourceEl = sourceDomEl || null;
                element._graphSourceDerivation = derivationElement || null;
                element._graphOpenButton = graphButton;
                element._currentLatex = latex;
                element._defaultLayerId = crypto.randomUUID();
                element._graphSources = [{
                    layerId: element._defaultLayerId,
                    sourceDomEl: sourceDomEl || null,
                    derivationElement: derivationElement || null,
                    latex,
                }];

                if (sourceDomEl) {
                    openGraphsRef.current.set(sourceDomEl, element);
                }

                attachDerivationGraphSync(element, derivationElement);

                const hostElementCandidate = element.el || (element.$el && element.$el[0]) || (element.element_div && element.element_div[0]);
                const graphHostElement = hostElementCandidate instanceof Element ? hostElementCandidate : (hostElementCandidate && hostElementCandidate[0]);

                if (graphHostElement instanceof Element) {
                    element._graphHostEl = graphHostElement;

                    if (sourceDomEl) {
                        setElementPairs(prev => [...prev, { sourceEl: sourceDomEl, targetEl: graphHostElement }]);
                    }

                    console.log('[GM createElement callback] SUCCESS: Found host DOM element:', graphHostElement);
                    graphHostElement.style.height = 'fit-content';
                    removeGraphTextboxToolbar(graphHostElement);
                    setTimeout(() => removeGraphTextboxToolbar(graphHostElement), 0);
                    setTimeout(() => removeGraphTextboxToolbar(graphHostElement), 100);

                    const dragBar = graphHostElement.firstChild;
                    if (dragBar instanceof HTMLElement) {
                        dragBar.style.zIndex = '100';
                        console.log('[GM createElement callback] Adjusted drag bar z-index to 100.');
                    }

                    const contentArea = graphHostElement.querySelector('.content-container') || graphHostElement.querySelector('.gm-no-focus-outline');

                    if (contentArea) {
                        console.log('[GM createElement callback] Found GM content area:', contentArea);
                        contentArea.innerHTML = '';
                        contentArea.style.padding = '0';
                        contentArea.style.overflow = 'hidden';

                        const root = ReactDOM.createRoot(contentArea);
                        element.reactRoot = root;
                        renderGraphHost(element, { handTrackingEnabled: isCameraMode });
                    } else {
                        console.error('[GM createElement callback] ERROR: Could not find a suitable content container (.content-container or .gm-no-focus-outline) to render the graph into.');
                    }
                    
                    setTimeout(() => {
                        let targetElement = graphHostElement.querySelector('.gm-no-focus-outline');
                        if (!targetElement && graphHostElement.classList.contains('gm-no-focus-outline')) {
                            targetElement = graphHostElement;
                        }

                        if (targetElement) {
                            console.log('[GM createElement callback] Applied z-index to .gm-no-focus-outline element (or host).');
                        }
                    }, 50);

                    requestAnimationFrame(() => {
                        element._graphRevealTween = animateGraphFlickerIn(graphHostElement);
                    });
                } else {
                    console.error('[GM createElement callback] ERROR: Could not find a valid host DOM element for the textbox.', { element, candidate: hostElementCandidate });
                    showGraphOpenButton(graphButton);
                    if (sourceDomEl) openGraphsRef.current.delete(sourceDomEl);
                }
            }
        );
    }, [attachDerivationGraphSync, renderGraphHost, isCameraMode]);

    useEffect(() => {
        let canvasInstance = null;
        let navigation = null;
        let isCancelled = false;

        const initialize = async () => {
            try {
                const gmath = await loadGmApi();
                if (isCancelled || !gmCanvasRef.current) return;

                console.log('Graspable Math ready. Initializing canvas...');
                const canvasOptions = {
                    use_toolbar: false,
                    overflow_visible: true,
                    horizontal_scroll: true,
                    vertical_scroll: true,
                };
                canvasInstance = new gmath.Canvas(gmCanvasRef.current, canvasOptions);
                console.log('Graspable Math canvas initialized!');
                gmApiRef.current = canvasInstance;

                navigation = attachGmCanvasNavigation({
                    rootEl: mainContainerRef.current,
                    getModel: () => gmApiRef.current?.model,
                    zoomRef: canvasZoomRef,
                    onZoomChange: setCanvasZoom,
                });
                gmNavRef.current = navigation.api;

                canvasInstance.model.on('create', ({ target_type, target: element }) => {
                    applyCreatedElementZoom(element, canvasZoomRef.current);
                    console.log(`[GM Event] 'create' event fired for target_type: '${target_type}'`, { element });

                    if (target_type === 'derivation') {
                        console.log('[GM Event] Element is a derivation. Proceeding to check if graphable.');
                        const model = element.getLastModel();

                        if (!model) {
                            console.log('[GM Event] Derivation has no model yet. Cannot determine if graphable.');
                            return;
                        }

                        let isGraphable = false;
                        let latex = '';

                        latex = model.to_latex();
                        console.log(`[GM Event] Derivation model converted to LaTeX: "${latex}"`);

                        if (latex.includes('y') && latex.includes('=') && latex.includes('x') && parseMathString(latex)) {
                            isGraphable = true;
                            console.log('[GM Event] Equation is determined to be graphable.');
                        } else {
                            console.log('[GM Event] Equation is NOT graphable.');
                        }

                        if (isGraphable) {
                            // The 'create' event might fire before the DOM element is attached.
                            // We'll use a small timeout to wait for the next render tick.
                            setTimeout(() => {
                                console.log('[GM Event] Attempting to find DOM element for the graphable derivation.');
                                const hostElementCandidate = element.el || (element.$el && element.$el[0]) || (element.element_div && element.element_div[0]);

                                // The candidate could be a raw DOM element or a jQuery-like object.
                                // We need the raw element for getComputedStyle.
                                const hostElement = hostElementCandidate instanceof Element ? hostElementCandidate : (hostElementCandidate && hostElementCandidate[0]);

                                if (hostElement instanceof Element) {
                                    console.log('[GM Event] SUCCESS: Found host DOM element:', hostElement);
                                    // Ensure relative positioning for the button
                                    if (window.getComputedStyle(hostElement).position === 'static') {
                                        hostElement.style.position = 'relative';
                                        console.log('[GM Event] Set host element position to relative.');
                                    }
                                    
                                    // Check if a button already exists to prevent duplicates
                                    if (hostElement.querySelector('.gm-graph-button')) {
                                        console.log('[GM Event] Graph button already exists on this element. Skipping creation.');
                                        return;
                                    }

                                    const button = document.createElement('button');
                                    button.className = 'gm-graph-button';
                                    button.title = 'Show Graph';
                                    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>`;
                                    
                                    button.onclick = (e) => {
                                        console.log('[GM Graph Button] Clicked!');
                                        e.stopPropagation();
                                        createGraphForLatex(latex, { sourceDomEl: hostElement, derivationElement: element });
                                    };
                                    
                                    hostElement.appendChild(button);
                                    if (isCameraMode) {
                                        button.classList.add('gm-graph-button--hand-mode');
                                    }
                                    console.log('[GM Event] Appended graph button to host element.');
                                } else {
                                    console.error('[GM Event] ERROR: Could not find a valid host DOM element for the derivation. The button cannot be attached.', { element, candidate: hostElementCandidate });
                                }
                            }, 0); // A timeout of 0ms defers execution until the stack is clear.
                        }

                        // Also allow clicking the equation itself to open the graph
                        element.events.on('mistake', () => {
                            const mistakeModel = element.getLastModel();
                            if (!mistakeModel) return;
                            const mistakeLatex = mistakeModel.to_latex();
                            if (mistakeLatex.includes('y') && mistakeLatex.includes('=') && mistakeLatex.includes('x') && parseMathString(mistakeLatex)) {
                                console.log('Graphable equation clicked:', mistakeLatex);
                                const hostElementCandidate = element.el || (element.$el && element.$el[0]) || (element.element_div && element.element_div[0]);
                                const hostElement = hostElementCandidate instanceof Element ? hostElementCandidate : (hostElementCandidate && hostElementCandidate[0]);
                                if (hostElement) {
                                  createGraphForLatex(mistakeLatex, { sourceDomEl: hostElement, derivationElement: element });
                                } else {
                                  createGraphForLatex(mistakeLatex, { derivationElement: element });
                                }
                            }
                        });
                    }

                });

                canvasInstance.model.on('remove', ({ target: element }) => {
                    if (!element?._isGraphHost) return;
                    cleanupGraphHost(element);
                });

                setIsGmReady(true);
            } catch (error) {
                console.error('Failed to initialize Graspable Math canvas:', error);
            }
        };

        initialize();

        return () => {
            navigation?.detach?.();
            gmNavRef.current = null;
            canvasZoomRef.current = 1;
            // --- Cleanup Logic ---
            // Unmount any React components when the GM canvas is destroyed.
            if (gmApiRef.current) {
                gmApiRef.current.model.elements().forEach(element => {
                    if (element.reactRoot) element.reactRoot.unmount();
                });
            }
            isCancelled = true;
            console.log('Cleaning up Graspable Math instance...');
            
            if (canvasInstance && typeof canvasInstance.destroy === 'function') {
                canvasInstance.destroy();
            }
            gmApiRef.current = null;

            if (gmCanvasRef.current) {
                gmCanvasRef.current.innerHTML = '';
            }
            setIsGmReady(false);
        };
    }, [createGraphForLatex]);

    const handleUndo = () => {
        if (gmApiRef.current) gmApiRef.current.controller.undo();
    };

    const handleRedo = () => {
        if (gmApiRef.current) gmApiRef.current.controller.redo();
    };

    const handleReset = () => {
        if (gmApiRef.current) gmApiRef.current.controller.reset();
        canvasZoomRef.current = 1;
        setCanvasZoom(1);
    };

    const handleInsert = () => {
        setShowInsertModal(true);
        // Focus the mathfield when the modal opens
        setTimeout(() => mathFieldRef.current?.focus(), 0);
    };

    const handleConfirmInsert = () => {
        if (!gmApiRef.current || !mathFieldRef.current) return;

        const mathField = mathFieldRef.current;
        const latex = mathField.value;

        if (!latex.trim() || mathField.errors.length > 0) {
            alert("The expression is empty or contains errors. Please correct it.");
            return;
        }

        // Convert LaTeX to ascii-math, which GM's parser understands.
        const asciiExpr = mathField.getValue('ascii-math');

        /**
         * A placeholder for any necessary string replacements between MathLive's
         * ascii-math output and what GM's parser expects.
         */
        const normalize = (expr) => {
            // Example: return expr.replace(/some_pattern/g, 'some_replacement');
            return expr;
        };

        const normalizedExpr = normalize(asciiExpr);

        try {
            gmApiRef.current.model.createElement('derivation', {
                eq: normalizedExpr,
                pos: 'auto',
                color: '#FFFFFF',
                handle_stroke_color: '#FFFFFF'
            });

            // On success, close the modal and clear the input.
            setShowInsertModal(false);
            mathField.value = '';
        } catch (parseError) {
            console.error("Graspable Math failed to parse expression:", normalizedExpr, parseError);
            alert("Graspable Math couldn't read that expression. Please check the format.");
        }
    };

    // --- Hand Tracking Integration ---

    const isHandTrackingOverlay = useCallback((el) => {
        if (!el) return true;
        if (el === videoRef.current || el === handCanvasRef.current) return true;
        if (cursor0Ref.current?.contains(el) || cursor1Ref.current?.contains(el)) return true;
        return false;
    }, []);

    const resolveInteractiveTarget = useCallback((x, y, fallback = null) => {
        const stack = document.elementsFromPoint(x, y);
        for (const target of stack) {
            if (isHandTrackingOverlay(target)) continue;

            const graphNode = target.closest('[data-graph-node]');
            if (graphNode) return graphNode;

            const svgTarget = target.closest('svg');
            if (svgTarget) return svgTarget;

            return target;
        }
        return fallback;
    }, [isHandTrackingOverlay]);

    const createPointerEvent = (type, x, y, extra = {}, pointerId = 1) => {
        return new PointerEvent(type, {
            clientX: x,
            clientY: y,
            screenX: x,
            screenY: y,
            bubbles: true,
            cancelable: true,
            view: window,
            pointerType: 'touch',
            isPrimary: true,
            button: 0,
            buttons: type === 'pointerup' ? 0 : 1,
            detail: 1,
            pointerId,
            ...extra,
        });
    };

    const createMouseEvent = (type, x, y, buttons) => {
        return new MouseEvent(type, {
            clientX: x,
            clientY: y,
            screenX: x,
            screenY: y,
            bubbles: true,
            cancelable: true,
            view: window,
            button: 0,
            buttons,
            detail: 1,
        });
    };

    const handleHandClick = useCallback(({ x, y }) => {
        console.log(`[handleHandClick] Received click event at screen coordinates: (${x}, ${y})`);
        emitInteractionEffect(x, y, 'click');
        const targetElement = resolveInteractiveTarget(x, y);

        if (!targetElement) {
            console.log('[handleHandClick] No element found at coordinates.');
            return;
        }

        console.log(`[handleHandClick] Simulating click on element:`, targetElement);

        const pointerId = activePointerIdRef.current;
        activePointerIdRef.current = pointerId + 1;
        const events = [
            createPointerEvent('pointerdown', x, y, {}, pointerId),
            createMouseEvent('mousedown', x, y, 1),
            createPointerEvent('pointerup', x, y, {}, pointerId),
            createMouseEvent('mouseup', x, y, 0),
            createMouseEvent('click', x, y, 0),
        ];

        for (const event of events) {
            console.log(`[handleHandClick] Dispatching ${event.type} event...`);
            targetElement.dispatchEvent(event);
        }

        console.log('[handleHandClick] Click simulation finished.');
    }, [resolveInteractiveTarget]);

    const handleHandTrackingError = useCallback(() => {
        setIsCameraMode(false);
        alert("Unable to access camera or load hand tracking models. Please ensure you've given camera permissions.");
    }, []);

    const dispatchPointerEvent = (type, target, x, y, buttons = 1, pointerId = 1) => {
        if (!target) return;
        const event = new PointerEvent(type, {
            clientX: x,
            clientY: y,
            screenX: x,
            screenY: y,
            bubbles: true,
            cancelable: true,
            view: window,
            pointerType: 'touch',
            isPrimary: true,
            button: 0,
            buttons,
            detail: 1,
            pointerId,
        });
        console.log(`[handleHandDrag] Dispatching ${type} to`, target, { x, y, buttons });
        target.dispatchEvent(event);
    };

    const dispatchMouseEvent = (type, target, x, y, buttons = 1) => {
        if (!target) return;
        const event = new MouseEvent(type, {
            clientX: x,
            clientY: y,
            screenX: x,
            screenY: y,
            bubbles: true,
            cancelable: true,
            view: window,
            button: 0,
            buttons,
            detail: 1,
        });
        console.log(`[handleHandDrag] Dispatching ${type} to`, target, { x, y, buttons });
        target.dispatchEvent(event);
    };

    const handleHandDragStart = useCallback((element, { x, y }) => {
        const resolvedTarget = resolveInteractiveTarget(x, y, element);
        const graphHost = resolvedTarget?.closest?.('.canvas-element');
        if (graphHost?.querySelector('[data-graph-panel]')) {
            activeGraphDragHostRef.current = graphHost;
        }
        console.log('[handleHandDragStart] Starting drag at', { x, y, element: resolvedTarget });
        if (!resolvedTarget) return;
        activeDragTargetRef.current = resolvedTarget;
        const pointerId = activePointerIdRef.current;
        activePointerIdRef.current = pointerId + 1;
        dispatchPointerEvent('pointerdown', resolvedTarget, x, y, 1, pointerId);
        dispatchMouseEvent('mousedown', resolvedTarget, x, y, 1);
    }, [resolveInteractiveTarget]);

    const handleHandDragMove = useCallback((_element, { x, y }) => {
        const dragTarget = activeDragTargetRef.current;
        if (!dragTarget) return;
        const pointerId = activePointerIdRef.current - 1;
        console.log('[handleHandDragMove] Moving drag to', { x, y, element: dragTarget });
        dispatchPointerEvent('pointermove', dragTarget, x, y, 1, pointerId);
        dispatchMouseEvent('mousemove', dragTarget, x, y, 1);
    }, []);

    const isCanvasPanTarget = useCallback((el) => {
        return isGmCanvasBackground(el, gmCanvasRef.current);
    }, []);

    const handleTwoHandZoom = useCallback(({ scaleFactor, focalX, focalY }) => {
        const model = gmApiRef.current?.model;
        const rootEl = gmCanvasRef.current;
        if (!model || !rootEl) return;

        const currentZoom = canvasZoomRef.current || 1;
        const nextZoom = clampZoom(currentZoom * scaleFactor);
        const appliedFactor = nextZoom / currentZoom;
        if (Math.abs(appliedFactor - 1) < 0.001) return;

        canvasZoomRef.current = nextZoom;
        setCanvasZoom(nextZoom);

        emitInteractionEffect(focalX, focalY, 'zoom');

        const focalPoint = screenToCanvasPoint(rootEl, focalX, focalY);
        zoomCanvasModel(model, appliedFactor, focalPoint);
    }, []);

    const mergeGraphElements = useCallback((targetElement, sourceElement) => {
        if (!targetElement || !sourceElement || targetElement === sourceElement || !gmApiRef.current?.model) return;

        const targetSources = normalizeGraphSources(targetElement);
        const sourceSources = normalizeGraphSources(sourceElement).map((source) => ({
            ...source,
            layerId: crypto.randomUUID(),
        }));

        const mergedSources = [...targetSources, ...sourceSources];
        targetElement._graphSources = mergedSources;
        targetElement._currentLatex = mergedSources[0]?.latex || targetElement._currentLatex;

        mergedSources.forEach((source) => {
            if (source.derivationElement) {
                source.derivationElement._linkedGraphElement = targetElement;
                attachDerivationGraphSync(targetElement, source.derivationElement);
            }
            if (source.sourceDomEl) {
                openGraphsRef.current.set(source.sourceDomEl, targetElement);
            }
        });

        const targetHost = targetElement._graphHostEl;
        const sourceHost = sourceElement._graphHostEl;
        if (targetHost && sourceHost) {
            setElementPairs((prev) => {
                const next = prev.map((pair) => (
                    pair.targetEl === sourceHost ? { ...pair, targetEl: targetHost } : pair
                ));
                const seen = new Set();
                return next.filter((pair) => {
                    const key = `${pair.sourceEl}-${pair.targetEl}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
            });
        }

        renderGraphHost(targetElement, { handTrackingEnabled: isCameraMode });

        if (sourceElement._graphRevealTween) {
            sourceElement._graphRevealTween.kill();
            sourceElement._graphRevealTween = null;
        }
        if (sourceElement.reactRoot) {
            sourceElement.reactRoot.unmount();
            sourceElement.reactRoot = null;
        }
        sourceElement._isGraphHost = false;
        sourceElement._graphSources = [];
        gmApiRef.current.model.removeElement(sourceElement);
        if (targetHost) {
            emitInteractionEffectOnElement(targetHost, 'graph-open');
        }
    }, [attachDerivationGraphSync, isCameraMode, renderGraphHost]);

    const tryMergeGraphOnDrop = useCallback((draggedHostEl, x, y) => {
        if (!draggedHostEl || !gmApiRef.current?.model) return;

        const targetHost = findGraphHostAtPoint(x, y);
        if (!targetHost || targetHost === draggedHostEl) return;

        const draggedRect = draggedHostEl.getBoundingClientRect();
        const targetRect = targetHost.getBoundingClientRect();
        if (!rectsOverlap(draggedRect, targetRect)) return;

        const draggedElement = getGraphElementFromHost(draggedHostEl, gmApiRef.current.model);
        const targetElement = getGraphElementFromHost(targetHost, gmApiRef.current.model);
        if (!draggedElement?._isGraphHost || !targetElement?._isGraphHost) return;

        mergeGraphElements(targetElement, draggedElement);
    }, [mergeGraphElements]);

    const handleHandDragEnd = useCallback((_element, { x, y }) => {
        const dragTarget = activeDragTargetRef.current;
        if (!dragTarget) return;
        const pointerId = activePointerIdRef.current - 1;
        console.log('[handleHandDragEnd] Ending drag at', { x, y, element: dragTarget });
        dispatchPointerEvent('pointerup', dragTarget, x, y, 0, pointerId);
        dispatchMouseEvent('mouseup', dragTarget, x, y, 0);
        dispatchMouseEvent('click', dragTarget, x, y, 0);
        activeDragTargetRef.current = null;

        if (activeGraphDragHostRef.current) {
            tryMergeGraphOnDrop(activeGraphDragHostRef.current, x, y);
            activeGraphDragHostRef.current = null;
        }
    }, [tryMergeGraphOnDrop]);

    const handleGraphHandGesture = useCallback(({ type, graphPanel, equationHost, x, y }) => {
        if (type === 'open') {
            if (typeof x === 'number' && typeof y === 'number') {
                emitInteractionEffect(x, y, 'graph-open');
            }
            if (!equationHost || !gmApiRef.current?.model) return;

            const derivation = gmApiRef.current.model.elements().find((element) => {
                if (element._isGraphHost) return false;
                const hostCandidate = element.el || (element.$el && element.$el[0]) || (element.element_div && element.element_div[0]);
                const hostEl = hostCandidate instanceof Element ? hostCandidate : (hostCandidate && hostCandidate[0]);
                return hostEl === equationHost;
            });
            if (!derivation) return;

            const model = derivation.getLastModel?.();
            const latex = model?.to_latex?.();
            if (!latex || !parseMathString(latex)) return;

            createGraphForLatex(latex, { sourceDomEl: equationHost, derivationElement: derivation });
            return;
        }

        const hostEl = graphPanel?.closest('.canvas-element');
        if (!hostEl || !gmApiRef.current?.model) return;

        const graphElement = gmApiRef.current.model.elements().find(
            (element) => element._graphHostEl === hostEl
        );
        if (!graphElement) return;

        if (type === 'close') {
            if (typeof x === 'number' && typeof y === 'number') {
                emitInteractionEffect(x, y, 'graph-close');
            }
            closeGraphElement(graphElement);
        } else if (type === 'toggleAudio') {
            if (typeof x === 'number' && typeof y === 'number') {
                emitInteractionEffect(x, y, 'pinch');
            }
            graphElement._handControls?.toggleAudio?.();
        }
    }, [closeGraphElement, createGraphForLatex]);

    const handleInteractionEffect = useCallback(({ x, y, type }) => {
        emitInteractionEffect(x, y, type);
    }, []);

    useEffect(() => {
        if (!gmApiRef.current?.model) return;

        gmApiRef.current.model.elements().forEach((element) => {
            if (element._isGraphHost) {
                renderGraphHost(element, { handTrackingEnabled: isCameraMode });
            }
        });
    }, [isCameraMode, renderGraphHost]);

    useEffect(() => {
        const canvasRoot = gmCanvasRef.current;
        if (!canvasRoot) return;

        const handlePointerDown = (event) => {
            const host = event.target.closest?.('.canvas-element');
            if (host?.querySelector('[data-graph-panel]')) {
                mouseGraphDragHostRef.current = host;
            }
        };

        const handlePointerUp = (event) => {
            if (!mouseGraphDragHostRef.current) return;
            tryMergeGraphOnDrop(mouseGraphDragHostRef.current, event.clientX, event.clientY);
            mouseGraphDragHostRef.current = null;
        };

        canvasRoot.addEventListener('pointerdown', handlePointerDown, true);
        window.addEventListener('pointerup', handlePointerUp, true);
        return () => {
            canvasRoot.removeEventListener('pointerdown', handlePointerDown, true);
            window.removeEventListener('pointerup', handlePointerUp, true);
        };
    }, [isGmReady, tryMergeGraphOnDrop]);

    useEffect(() => {
        document.querySelectorAll('.gm-graph-button').forEach((button) => {
            if (isCameraMode) {
                button.classList.add('gm-graph-button--hand-mode');
            } else {
                button.classList.remove('gm-graph-button--hand-mode');
            }
        });
    }, [isCameraMode]);

    useEffect(() => {
        const handleUiClick = (e) => {
            if (!e.isTrusted) return;
            const btn = e.target.closest('.mv-btn, .gm-graph-button');
            if (btn) emitInteractionEffectOnElement(btn, 'click');
        };
        document.addEventListener('click', handleUiClick, true);
        return () => document.removeEventListener('click', handleUiClick, true);
    }, []);

    useHandTracking({
        enabled: isCameraMode,
        videoRef,
        canvasRef: handCanvasRef,
        cursor0Ref,
        cursor1Ref,
        mainRef: mainContainerRef,
        panOffset,
        setPanOffset,
        isCanvasPanTarget,
        onTwoHandZoom: handleTwoHandZoom,
        onGraphHandGesture: isCameraMode ? handleGraphHandGesture : undefined,
        onInteractionEffect: isCameraMode ? handleInteractionEffect : undefined,
        onClick: handleHandClick,
        onPointerDragStart: handleHandDragStart,
        onPointerDragMove: handleHandDragMove,
        onPointerDragEnd: handleHandDragEnd,
        onLoadingChange: setIsCameraLoading,
        onError: handleHandTrackingError,
    });

    useEffect(() => {
        if (!gmApiRef.current?.model) return;

        const dx = panOffset.x - lastHandPanOffsetRef.current.x;
        const dy = panOffset.y - lastHandPanOffsetRef.current.y;
        lastHandPanOffsetRef.current = { ...panOffset };

        if (dx || dy) {
            panCanvasModel(gmApiRef.current.model, dx, dy);
        }
    }, [panOffset]);

    const handleZoomIn = () => {
        gmNavRef.current?.zoomIn();
    };

    const handleZoomOut = () => {
        gmNavRef.current?.zoomOut();
    };

    useEffect(() => {
        let frameId;
        const updatePositions = () => {
            if (elementPairs.length > 0) {
                const newLines = elementPairs.map(({ sourceEl, targetEl }, index) => {
                    // Check if elements are still in the DOM
                    if (!document.body.contains(sourceEl) || !document.body.contains(targetEl)) {
                        return null;
                    }
                    const { x1, y1, x2, y2 } = getConnectionLinePoints(sourceEl, targetEl);
                    return {
                        id: `line-${index}`,
                        x1,
                        y1,
                        x2,
                        y2,
                    };
                }).filter(Boolean); // Filter out nulls for disconnected elements

                setLines(prevLines => {
                    // Only update state if there's a change to avoid unnecessary re-renders
                    if (JSON.stringify(newLines) !== JSON.stringify(prevLines)) {
                        return newLines;
                    }
                    return prevLines;
                });
            } else {
                setLines(prevLines => {
                    if (prevLines.length > 0) {
                        return [];
                    }
                    return prevLines;
                });
            }
            frameId = requestAnimationFrame(updatePositions);
        };
        frameId = requestAnimationFrame(updatePositions);
        return () => {
            cancelAnimationFrame(frameId);
        };
    }, [elementPairs]);

    return (
        <div 
            ref={mainContainerRef}
            className={`mv-root w-screen h-screen relative overflow-hidden${isCameraMode ? ' mv-hand-tracking' : ''}`}
        >
            {!isCameraMode && <MachineVisionOverlay showHud={false} />}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-[5]">
                {lines.map((line, i) => (
                    <Line key={i} {...line} />
                ))}
            </svg>
            {/* Video Background Layer for Hand Tracking */}
            {isCameraMode && (
                <>
                    {/* 
                      The video feed for hand tracking. The `-scale-x-100` class flips the video
                      horizontally to create a "mirror" effect, which is more intuitive for users
                      as it mimics their own movements.
                    */}
                    <video ref={videoRef} className="mv-camera-feed absolute inset-0 w-full h-full object-cover -scale-x-100 z-0 pointer-events-none" autoPlay playsInline/>
                    <div className="mv-camera-feed-overlay" />
                    <MachineVisionOverlay />
                    <canvas ref={handCanvasRef} className="absolute inset-0 w-full h-full object-cover -scale-x-100 z-[2] pointer-events-none" />
                </>
            )}

            {/* Custom Toolbar */}
            <div className="absolute top-4 left-4 mv-panel z-10">
                <span className="mv-panel-label">SYS</span>
                <button onClick={handleInsert} disabled={!isGmReady} title="Insert Expression" className="mv-btn mv-btn-primary">
                    <PlusSquare size={14} />
                    Insert
                </button>
                <div className="mv-divider" />
                <button onClick={handleUndo} disabled={!isGmReady} title="Undo" className="mv-btn mv-btn-icon">
                    <Undo size={14} />
                </button>
                <button onClick={handleRedo} disabled={!isGmReady} title="Redo" className="mv-btn mv-btn-icon">
                    <Redo size={14} />
                </button>
                <div className="mv-divider" />
                <button onClick={handleReset} disabled={!isGmReady} title="Reset Canvas" className="mv-btn mv-btn-icon">
                    <RefreshCw size={14} />
                </button>
                <div className="mv-divider" />
                <button onClick={handleZoomOut} disabled={!isGmReady} title="Zoom Out (scroll wheel, two-hand pinch, or Alt+drag to pan)" className="mv-btn mv-btn-icon">
                    <ZoomOut size={14} />
                </button>
                <span className="mv-panel-label" style={{ minWidth: '3rem', textAlign: 'center' }}>
                    {Math.round(canvasZoom * 100)}%
                </span>
                <button onClick={handleZoomIn} disabled={!isGmReady} title="Zoom In (scroll wheel, two-hand pinch, or Alt+drag to pan)" className="mv-btn mv-btn-icon">
                    <ZoomIn size={14} />
                </button>
                <div className="mv-divider" />
                <button
                    onClick={() => setIsCameraMode(!isCameraMode)}
                    disabled={isCameraLoading}
                    title={isCameraMode ? 'Stop Hand Tracking (pinch+drag pan, fist on equation/graph to open/close, drop graph on graph to merge)' : 'Use Hand Tracking (pinch+drag to pan, two-hand pinch to zoom)'}
                    className={`mv-btn ${isCameraMode ? 'mv-btn-active' : ''}`}
                >
                    <Camera size={14} />
                    {isCameraLoading ? 'Init...' : isCameraMode ? 'Track:ON' : 'Track:OFF'}
                </button>
            </div>

            {/* Insert Expression Modal */}
            {showInsertModal && (
                <div className="fixed inset-0 z-20 flex items-center justify-center mv-modal-backdrop p-4">
                    <div className="mv-modal">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="mv-modal-title">Input Expression</h2>
                                <p className="mv-modal-subtitle">ASCII-MATH // GM PARSER</p>
                            </div>
                            <button
                                onClick={() => setShowInsertModal(false)}
                                className="mv-btn mv-btn-icon"
                            >
                                <X size={14} strokeWidth={2.5} />
                            </button>
                        </div>
                        <math-field
                            ref={mathFieldRef}
                            className="mv-math-field"
                            virtual-keyboard-mode="onfocus"
                        ></math-field>
                        <div className="flex justify-end">
                            <button
                                onClick={handleConfirmInsert}
                                className="mv-btn mv-btn-primary"
                            >
                                <Check size={14} strokeWidth={3} />
                                Commit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Graspable Math Canvas Container */}
            <div 
                ref={gmCanvasRef} 
                className="w-full h-full"
            ></div>

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