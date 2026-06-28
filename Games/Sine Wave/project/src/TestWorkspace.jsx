import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { Undo, Redo, RefreshCw, PlusSquare, X, Check, Camera } from 'lucide-react';
import { MathfieldElement } from 'mathlive';
import { useHandTracking } from './useHandTracking'; // Assuming this file exists alongside App.jsx
import GraphAudioPrototype, { parseMathString } from './GraphSound';

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

export default function TestWorkspace() {
    const gmCanvasRef = useRef(null);
    const gmApiRef = useRef(null);
    const mainContainerRef = useRef(null);
    const [isGmReady, setIsGmReady] = useState(false);
    const [showInsertModal, setShowInsertModal] = useState(false);
    const mathFieldRef = useRef(null);

    // --- Hand Tracking State & Refs ---
    const [isCameraMode, setIsCameraMode] = useState(false);
    const [isCameraLoading, setIsCameraLoading] = useState(false);
    const videoRef = useRef(null);
    const handCanvasRef = useRef(null);
    const cursor0Ref = useRef(null);
    const cursor1Ref = useRef(null);
    // Dummy pan state for useHandTracking hook compatibility
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    
    const createGraphForLatex = useCallback((latex) => {
        if (!gmApiRef.current) {
            console.error('[createGraphForLatex] Graspable Math API not ready.');
            return;
        }

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
            'create-graph-host', // method for GM's internal logging
            (element) => { // This callback is fired when the element is ready.
                console.log('[GM createElement callback] Received element:', element);

                const hostElementCandidate = element.el || (element.$el && element.$el[0]) || (element.element_div && element.element_div[0]);
                const hostElement = hostElementCandidate instanceof Element ? hostElementCandidate : (hostElementCandidate && hostElementCandidate[0]);

                if (hostElement instanceof Element) {
                    console.log('[GM createElement callback] SUCCESS: Found host DOM element:', hostElement);
                    // Allow the GM element to size itself to our custom content.
                    hostElement.style.height = 'fit-content';

                    // Find GM's own content container to render our component into.
                    // This is more robust than creating our own div.
                    // The content div class can vary, so we check for multiple possibilities.
                    const contentArea = hostElement.querySelector('.content-container') || hostElement.querySelector('.gm-no-focus-outline');

                    if (contentArea) {
                        console.log('[GM createElement callback] Found GM content area:', contentArea);
                        // Clear the "Loading Graph..." text and prepare for React.
                        contentArea.innerHTML = '';
                        // No need to set height here; it will grow with its React content.
                        contentArea.style.padding = '0';
                        contentArea.style.overflow = 'hidden';

                        const root = ReactDOM.createRoot(contentArea);
                        root.render(<GraphAudioPrototype initialLatex={latex} variant="compact" />);
                        element.reactRoot = root; // Store for cleanup
                    } else {
                        console.error('[GM createElement callback] ERROR: Could not find a suitable content container (.content-container or .gm-no-focus-outline) to render the graph into.');
                    }
                } else {
                    console.error('[GM createElement callback] ERROR: Could not find a valid host DOM element for the textbox.', { element, candidate: hostElementCandidate });
                }
            }
        );
    }, []);

    useEffect(() => {
        let canvasInstance = null;
        let isCancelled = false;

        const initialize = async () => {
            try {
                const gmath = await loadGmApi();
                if (isCancelled || !gmCanvasRef.current) return;

                console.log('Graspable Math ready. Initializing canvas...');
                const canvasOptions = {
                    use_toolbar: false,
                };
                canvasInstance = new gmath.Canvas(gmCanvasRef.current, canvasOptions);
                console.log('Graspable Math canvas initialized!');
                gmApiRef.current = canvasInstance;

                // Listen for new elements being created on the canvas
                canvasInstance.model.on('create', ({ target_type, target: element }) => {
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
                                        createGraphForLatex(latex);
                                    };
                                    
                                    hostElement.appendChild(button);
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
                                createGraphForLatex(mistakeLatex);
                            }
                        });
                    }

                });
                setIsGmReady(true);
            } catch (error) {
                console.error('Failed to initialize Graspable Math canvas:', error);
            }
        };

        initialize();

        return () => {
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
                pos: 'auto'
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

    const createPointerEvent = (type, x, y, extra = {}) => {
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
        const targetElement = document.elementFromPoint(x, y);

        if (!targetElement) {
            console.log('[handleHandClick] No element found at coordinates.');
            return;
        }

        console.log(`[handleHandClick] Simulating click on element:`, targetElement);

        const events = [
            createPointerEvent('pointerdown', x, y),
            createMouseEvent('mousedown', x, y, 1),
            createPointerEvent('pointerup', x, y),
            createMouseEvent('mouseup', x, y, 0),
            createMouseEvent('click', x, y, 0),
        ];

        for (const event of events) {
            console.log(`[handleHandClick] Dispatching ${event.type} event...`);
            targetElement.dispatchEvent(event);
        }

        console.log('[handleHandClick] Click simulation finished.');
    }, []);

    const handleHandTrackingError = useCallback(() => {
        setIsCameraMode(false);
        alert("Unable to access camera or load hand tracking models. Please ensure you've given camera permissions.");
    }, []);

    const dispatchPointerEvent = (type, target, x, y, buttons = 1) => {
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
        console.log('[handleHandDragStart] Starting drag at', { x, y, element });
        if (!element) return;
        dispatchPointerEvent('pointerdown', element, x, y, 1);
        dispatchMouseEvent('mousedown', element, x, y, 1);
    }, []);

    const handleHandDragMove = useCallback((element, { x, y }) => {
        if (!element) return;
        const targetElement = document.elementFromPoint(x, y) || element;
        console.log('[handleHandDragMove] Moving drag to', { x, y, element: targetElement });
        dispatchPointerEvent('pointermove', targetElement, x, y, 1);
        dispatchMouseEvent('mousemove', targetElement, x, y, 1);
    }, []);

    const handleHandDragEnd = useCallback((element, { x, y }) => {
        if (!element) return;
        const targetElement = document.elementFromPoint(x, y) || element;
        console.log('[handleHandDragEnd] Ending drag at', { x, y, element: targetElement });
        dispatchPointerEvent('pointerup', targetElement, x, y, 0);
        dispatchMouseEvent('mouseup', targetElement, x, y, 0);
        dispatchMouseEvent('click', targetElement, x, y, 0);
    }, []);

    // The useHandTracking hook is assumed to be available from the project context.
    // Based on your request, we need both click and drag support for hand gestures.
    useHandTracking({
        enabled: isCameraMode,
        videoRef,
        canvasRef: handCanvasRef,
        cursor0Ref,
        cursor1Ref,
        mainRef: mainContainerRef,
        panOffset,
        setPanOffset,
        onClick: handleHandClick,
        onPointerDragStart: handleHandDragStart,
        onPointerDragMove: handleHandDragMove,
        onPointerDragEnd: handleHandDragEnd,
        onLoadingChange: setIsCameraLoading,
        onError: handleHandTrackingError,
    });

    return (
        <div 
            ref={mainContainerRef}
            className="w-screen h-screen relative bg-slate-50"
        >
            {/* Video Background Layer for Hand Tracking */}
            {isCameraMode && (
                <>
                    {/* 
                      The video feed for hand tracking. The `-scale-x-100` class flips the video
                      horizontally to create a "mirror" effect, which is more intuitive for users
                      as it mimics their own movements.
                    */}
                    <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover -scale-x-100 z-0" autoPlay playsInline/>
                    <canvas ref={handCanvasRef} className="absolute inset-0 w-full h-full object-cover -scale-x-100 z-1 pointer-events-none" />
                </>
            )}

            {/* Custom Toolbar */}
            <div className="absolute top-4 left-4 bg-white p-2 rounded-lg shadow-lg border border-slate-200 z-10 flex items-center gap-2">
                <button onClick={handleInsert} disabled={!isGmReady} title="Insert Expression" className="bg-blue-600 text-white h-10 px-4 flex items-center justify-center rounded-md shadow-sm hover:bg-blue-700 transition-colors font-semibold disabled:bg-slate-400 disabled:cursor-not-allowed">
                    <PlusSquare size={18} className="mr-2" />
                    Insert
                </button>
                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                <button onClick={handleUndo} disabled={!isGmReady} title="Undo" className="text-slate-600 h-10 w-10 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors disabled:text-slate-300 disabled:cursor-not-allowed">
                    <Undo size={18} />
                </button>
                <button onClick={handleRedo} disabled={!isGmReady} title="Redo" className="text-slate-600 h-10 w-10 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors disabled:text-slate-300 disabled:cursor-not-allowed">
                    <Redo size={18} />
                </button>
                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                <button onClick={handleReset} disabled={!isGmReady} title="Reset Canvas" className="text-slate-600 h-10 w-10 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors disabled:text-slate-300 disabled:cursor-not-allowed">
                    <RefreshCw size={18} />
                </button>
                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                <button
                    onClick={() => setIsCameraMode(!isCameraMode)}
                    disabled={isCameraLoading}
                    title={isCameraMode ? 'Stop Hand Tracking' : 'Use Hand Tracking'}
                    className={`h-10 px-4 flex items-center justify-center rounded-md transition-colors disabled:cursor-wait ${
                        isCameraMode ? 'bg-green-100 text-green-700' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <Camera size={18} className="mr-2" />
                    {isCameraLoading ? 'Starting...' : isCameraMode ? 'Tracking On' : 'Use Hand'}
                </button>
            </div>

            {/* Insert Expression Modal */}
            {showInsertModal && (
                <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
                    <div className="relative bg-white rounded-2xl p-6 shadow-xl w-full max-w-xl flex flex-col gap-4 border border-slate-200">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-slate-800">Insert Expression</h2>
                            <button
                                onClick={() => setShowInsertModal(false)}
                                className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
                            >
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>
                        <math-field
                            ref={mathFieldRef}
                            style={{
                                width: '100%',
                                backgroundColor: '#f8fafc',
                                borderRadius: '12px',
                                padding: '16px 20px',
                                fontSize: '1.75rem',
                                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
                                border: '1px solid #e2e8f0',
                                outline: 'none',
                                fontFamily: 'math',
                            }}
                            virtual-keyboard-mode="onfocus"
                        ></math-field>
                        <div className="flex justify-end">
                            <button
                                onClick={handleConfirmInsert}
                                className="bg-blue-600 text-white h-11 px-6 flex items-center justify-center rounded-lg shadow-sm hover:bg-blue-700 transition-colors font-semibold"
                            >
                                <Check size={20} strokeWidth={3} className="mr-2" />
                                Add to Canvas
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
                    <div ref={cursor0Ref} className="fixed top-0 left-0 w-6 h-6 rounded-full border-2 border-blue-500 bg-blue-500/50 pointer-events-none shadow-lg z-[9999]" style={{ marginLeft: '-12px', marginTop: '-12px', transition: 'transform 0.05s ease-out', display: 'none' }} />
                    <div ref={cursor1Ref} className="fixed top-0 left-0 w-6 h-6 rounded-full border-2 border-green-500 bg-green-500/50 pointer-events-none shadow-lg z-[9999]" style={{ marginLeft: '-12px', marginTop: '-12px', transition: 'transform 0.05s ease-out', display: 'none' }} />
                </>
            )}
        </div>
    );
}