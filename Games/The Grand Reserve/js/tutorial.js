import { state } from './state.js';
import { renderPlots, showToast } from './ui.js';

let tutorialOverlay = null;
let tutorialModal = null;
let currentHighlightSelector = null;

function createTutorialUI() {
    if (document.getElementById('tutorial-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'tutorial-overlay';
    overlay.className = 'fixed inset-0 bg-black/70 z-[999] pointer-events-none transition-all duration-300';
    document.body.appendChild(overlay);

    const modal = document.createElement('div');
    modal.id = 'tutorial-modal';
    modal.className = 'hidden fixed z-[1000] bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md p-4 animate-fade-in';
    modal.innerHTML = `
        <div class="bg-white p-5 rounded-2xl border-4 border-amber-500 shadow-2xl">
            <h3 id="tutorial-title" class="text-lg font-black text-amber-950 mb-2"></h3>
            <p id="tutorial-text" class="text-sm text-stone-700 mb-4"></p>
            <button id="tutorial-button" class="w-full py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-500 transition-all"></button>
        </div>
    `;
    document.body.appendChild(modal);

    tutorialOverlay = overlay;
    tutorialModal = modal;
}

function showTutorialModal(title, text, buttonText, onClick) {
    if (!tutorialModal) createTutorialUI();
    
    document.getElementById('tutorial-title').textContent = title;
    document.getElementById('tutorial-text').textContent = text;
    const button = document.getElementById('tutorial-button');
    button.textContent = buttonText;
    button.onclick = onClick;

    tutorialModal.classList.remove('hidden');
    tutorialOverlay.classList.add('pointer-events-auto');
    tutorialOverlay.classList.remove('pointer-events-none');
    tutorialOverlay.style.clipPath = ''; // Reset clip path for modal
}

function dismissTutorialModal() {
    if (tutorialModal) tutorialModal.classList.add('hidden');
    if (tutorialOverlay) {
        tutorialOverlay.classList.remove('pointer-events-auto');
        tutorialOverlay.classList.add('pointer-events-none');
        tutorialOverlay.style.clipPath = '';
    }
}

function highlightUI(selector) {
    currentHighlightSelector = selector;
    const element = document.querySelector(selector);
    if (element) {
        const rect = element.getBoundingClientRect();
        // The old path was complex and not robust. This new path uses the 'evenodd' fill-rule 
        // which is the standard and correct way to create a hole in a shape.
        // It defines the outer viewport, then the inner rectangle for the hole.
        tutorialOverlay.style.clipPath = `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${rect.left}px ${rect.top}px, ${rect.right}px ${rect.top}px, ${rect.right}px ${rect.bottom}px, ${rect.left}px ${rect.bottom}px, ${rect.left}px ${rect.top}px)`;
    } else {
        currentHighlightSelector = null;
        if (tutorialOverlay) {
            tutorialOverlay.style.clipPath = '';
        }
    }
}

function cleanupTutorial() {
    if (tutorialOverlay) tutorialOverlay.remove();
    if (tutorialModal) tutorialModal.remove();
    state.tutorial.active = false;
    renderPlots();
    window.removeEventListener('resize', handleTutorialResize);
    window.removeEventListener('scroll', handleTutorialResize, true);
    currentHighlightSelector = null;
}

export function advanceTutorial(step = null) {
    if (step) {
        state.tutorial.step = step;
    } else {
        state.tutorial.step++;
    }

    if (tutorialModal) tutorialModal.classList.add('hidden');
    if (tutorialOverlay) {
        tutorialOverlay.classList.remove('pointer-events-auto');
        tutorialOverlay.classList.add('pointer-events-none');
        tutorialOverlay.style.clipPath = ''; // Clear highlights
        currentHighlightSelector = null;
    }

    switch (state.tutorial.step) {
        case 1: // Welcome
            showTutorialModal(
                "Welcome to the Vineyard!",
                "Let's get your hands dirty and plant your first vine. We'll start by planting some Pinot Noir grapes.",
                "Let's Go!",
                () => advanceTutorial()
            );
            break;
        case 2: // Highlight first plot
            renderPlots();
            highlightUI('#plot-btn-0');
            break;
        case 3: // Seed planted, now instant grow
            const plot = state.plots[0];
            if (plot.state === 'growing') {
                plot.timeRemaining = 0;
                plot.state = 'ready';
                renderPlots();
                showTutorialModal("Instant Harvest!", "Normally, you'd have to wait. We've given this one a little magic to speed things up.", "Great!", () => advanceTutorial());
            }
            break;
        case 4: // Highlight ready plot for harvest
            renderPlots();
            highlightUI('#plot-btn-0');
            break;
        case 5: // Harvested, show feedback
            const reserveTab = document.querySelector('[data-target="inventory"]');
            if (reserveTab) {
                reserveTab.classList.add('tutorial-flash');
                setTimeout(() => reserveTab.classList.remove('tutorial-flash'), 1500);
            }
            showTutorialModal("First Harvest Complete!", "You've harvested one bundle of grapes. To make wine, you'll need two.", "Okay", () => advanceTutorial());
            break;

        // --- PHASE 2 ---
        case 6: // Give second grape and guide to cellar
            let pinotIngredient = state.ingredients.find(ing => ing.key === 'pinot_noir');
            if (pinotIngredient) {
                pinotIngredient.count = 2;
            } else {
                state.ingredients.push({
                    id: `pinot_noir_${Date.now()}`,
                    key: 'pinot_noir',
                    count: 2,
                    flavour: { sw: 15, ac: 25, tn: 15, bd: 20 },
                    weather: null
                });
            }
            showToast("Added 1x bonus Pinot Noir Grapes to your Reserve!");
            showTutorialModal("Let's Make Wine!", "We've added a second bundle of grapes to your reserve. Now, head to the Cellar to begin.", "Go to Cellar", () => {
                window.switchTab('cellar');
                advanceTutorial();
            });
            highlightUI('[data-target="cellar"]');
            break;

        case 7: // Highlight first barrel
            highlightUI('#barrel-wrapper-0');
            break;

        case 8: // Barrel clicked, press modal is open. Guide loading.
            showTutorialModal("The Ingredient Press", "This is the press. Load your two Pinot Noir grape bundles into the slots to preview the wine recipe.", "Got it", () => advanceTutorial());
            break;
        
        case 9: // Highlight ingredients in press modal. Passive step.
            const pinotIngredientUI = state.ingredients.find(ing => ing.key === 'pinot_noir');
            if (pinotIngredientUI) {
                highlightUI(`#press-inventory-item-${pinotIngredientUI.id}`);
            }
            break;

        case 10: // Ingredients loaded, highlight squish button
            highlightUI('#press-confirm-btn');
            break;

        case 11: // Squished, now guide tapping
            showTutorialModal("Get Stomping!", "Now, give it a few good stomps! Tap the barrel 5 times to crush the grapes.", "Okay!", () => advanceTutorial());
            break;
        
        case 12: // Highlight barrel for tapping
            highlightUI('#barrel-wrapper-0');
            // Engine will advance to 13 when tapping is complete
            break;

        case 13: // Tapped 5 times, now fermenting. Skip timer.
            const barrel = state.barrels[0];
            if (barrel.state === 'fermenting') {
                barrel.fermentTime = 0; // Instantly skip ferment time
                showTutorialModal("Fermentation", "The yeast is turning sugar into alcohol. We'll speed this part up.", "Next", () => {
                    dismissTutorialModal();
                });
            }
            break;
        
        case 14: // Now aging. Explain and highlight bottle button.
            showTutorialModal("Aging & Bottling", "The wine is now aging, which improves its quality. For now, let's bottle it early to see how it works.", "Bottle It", () => advanceTutorial());
            break;

        case 15: // Highlight bottle button
            highlightUI(`#bottle-now-btn-0`);
            break;

        case 16: // Bottled. Introduce labeler.
            showTutorialModal("Label Your Wine", "Great! Now let's give your first wine a custom label. This adds a personal touch and can increase its value.", "Open Labeler", () => {
                const bottle = state.wines.find(w => w.recipeKey === 'pinot_noir');
                if (bottle) {
                    window.openLabelerModal(bottle.id, 'wine');
                    advanceTutorial(17);
                }
            });
            break;

        case 17: // Labeler open, highlight title
            showTutorialModal("Name Your Vintage", "First, give your wine a unique name.", "Okay", () => {
                dismissTutorialModal();
                highlightUI('#labeler-title');
            });
            break;

        case 18: // Title entered, highlight crest
            showTutorialModal("Choose an Emblem", "Now, select a crest for your brand.", "Okay", () => {
                dismissTutorialModal();
                highlightUI('#labeler-crest-grid');
            });
            break;

        case 19: // Crest selected, highlight save
            showTutorialModal("Finish the Design", "Looks great! Attach the label to finish.", "Okay", () => {
                dismissTutorialModal();
                highlightUI('#labeler-save-btn');
            });
            break;

        case 20: // Label saved. Introduce market.
            showTutorialModal("Your First Custom Vintage!", "Congratulations! You've created your first fully custom wine. It's now in your Reserve. Let's head to the Market to see how you can sell it for a profit.", "To the Market!", () => {
                window.switchTab('market');
                advanceTutorial();
            });
            break;

        case 21: // Final debrief
            highlightUI('[data-target="market"]');
            showTutorialModal("Tutorial Complete!", "You've mastered the fundamentals of winemaking, from planting seeds to bottling your own vintage. The estate is now yours to command. Explore, experiment, and build your reputation. Good luck!", "Begin My Journey", () => {
                cleanupTutorial();
            });
            break;
    }
}

export function startTutorial() {
    if (state.tutorial.active) return;
    state.tutorial.active = true;
    state.tutorial.step = 0;
    state.gold = 20;
    state.seeds.pinot_noir = 2; // Give 2 for phase 2
    createTutorialUI();
    window.addEventListener('resize', handleTutorialResize);
    window.addEventListener('scroll', handleTutorialResize, true);
    advanceTutorial();
}

export function resumeTutorial() {
    if (!state.tutorial.active) return;

    const currentStep = state.tutorial.step;

    // Checkpoint logic for Phase 1
    if (currentStep > 0 && currentStep <= 5) {
        state.tutorial.step = 0; // Reset to beginning of phase
        // Also reset the world state for this phase to ensure a clean start
        state.plots[0].state = 'empty';
        state.plots[0].cropType = null;
        state.plots[0].timeRemaining = 0;
        // Remove any tutorial-related grapes from inventory
        state.ingredients = state.ingredients.filter(ing => ing.key !== 'pinot_noir');
        state.seeds.pinot_noir = 2; // Ensure they have the seeds
    }
    // Checkpoint logic for Phase 2
    else if (currentStep > 5 && currentStep <= 21) {
        state.tutorial.step = 5; // Reset to beginning of phase 2 (will be incremented to 6)
        // Reset world state for this phase
        state.barrels[0] = { ...state.barrels[0], state: 'empty', crushProgress: 0, fermentTime: 0, ageProgress: 0, recipeKey: null, ingredients: [], pantryAdditiveId: null, baseWineFlavour: null, flavour: null };
        // Remove any wines created during the tutorial
        state.wines = state.wines.filter(w => w.recipeKey !== 'pinot_noir');
        // Ensure player has the grapes
        let pinot = state.ingredients.find(i => i && i.key === 'pinot_noir');
        if (pinot) {
            pinot.count = 1; // It will be incremented to 2 in step 6
        } else {
             state.ingredients.push({
				id: `pinot_noir_${Date.now()}`,
				key: 'pinot_noir',
				count: 1,
				flavour: { sw: 15, ac: 25, tn: 15, bd: 20 }, // Base flavour
				weather: null,
			});
        }
    }

    // Future phases would have their own 'else if' blocks here

    // Re-initialize UI and advance to the checkpointed step
    createTutorialUI();
    window.addEventListener('resize', handleTutorialResize);
    window.addEventListener('scroll', handleTutorialResize, true);
    renderPlots(); // Re-render plots with the reset state
    advanceTutorial(); // This will increment step to 1 and run the first step
}

function handleTutorialResize() {
    if (state.tutorial.active && currentHighlightSelector) {
        highlightUI(currentHighlightSelector);
    }
}