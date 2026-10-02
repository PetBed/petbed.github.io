// --- MODULE ENTRY POINT ---
import {startLoop, plantSeed, addToPress, removeFromPress, placeWineOnRack, removeWineFromRack, addToKettle, removeFromKettle, startKettlePhysics, adjustKettleHeat, clearFinishedKettle, sellWineQualityGroup, sellBeerGroup, buySeed, buyPantryItem, buyPlot, buyBarrelType, buyKettle, buyOakConditioning, saveCustomLabel, bottleAsVinegar, setWeather, startWeatherSystem, startContractSystem, acceptContract, fulfillContract, cancelContract} from "./engine.js";
import { playPlantAnimation, playAddToPressAnimation } from "./effects.js";
import {initSound, switchReserveTab, switchShopTab, switchTab, updateHeaderUI, renderPlots, closePlotSelector, renderCellarUI, openPressModal, closePressModal, renderWarehouse, renderMarket, openSellModal, openSellBeerModal, closeSellModal, renderShop, renderBreweryUI, renderRacks, openRackSelectModal, closeRackSelectModal, openKettleModal, closeKettleModal, closeModal, openLabelerModal, closeLabelerModal, updateLabelDraft, renderWeather, showToast, openContractDetailModal, closeContractDetailModal, openOrderBreakdownModal, closeOrderBreakdownModal, openSettingsModal, closeSettingsModal, setFontStyle, applyFont} from "./ui.js";
import { startTutorial, advanceTutorial, resumeTutorial } from "./tutorial.js";
import { initPlaytest } from "./playtest.js";
import { state, globals } from "./state.js";
import { loadGameState, saveGameState } from "./storage.js";
import { PANTRY_DATA } from "./data.js";

// Expose DOM interaction functions to the global window context
window.switchReserveTab = switchReserveTab;
window.switchShopTab = switchShopTab;
window.switchTab = switchTab;
window.closePressModal = closePressModal;
window.removeFromPress = removeFromPress;
window.addToPress = addToPress;
window.openKettleModal = openKettleModal;
window.closeKettleModal = closeKettleModal;
window.addToKettle = addToKettle;
window.removeFromKettle = removeFromKettle;
window.closeModal = closeModal;
window.closeSellModal = closeSellModal;
window.buyPlot = buyPlot;
window.buyBarrelType = buyBarrelType;
window.buyKettle = buyKettle;
window.buyOakConditioning = buyOakConditioning;
window.buySeed = buySeed;
window.buyPantryItem = buyPantryItem;
window.plantSeed = plantSeed;
window.adjustKettleHeat = adjustKettleHeat;
window.clearFinishedKettle = clearFinishedKettle;
window.openSellModal = openSellModal;
window.openSellBeerModal = openSellBeerModal;
window.sellWineQualityGroup = sellWineQualityGroup;
window.sellBeerGroup = sellBeerGroup;
window.closePlotSelector = closePlotSelector;
window.openRackSelectModal = openRackSelectModal;
window.closeRackSelectModal = closeRackSelectModal;
window.placeWineOnRack = placeWineOnRack;
window.removeWineFromRack = removeWineFromRack;
window.bottleAsVinegar = bottleAsVinegar;

window.openLabelerModal = openLabelerModal;
window.closeLabelerModal = closeLabelerModal;
window.updateLabelDraft = updateLabelDraft;
window.saveCustomLabel = saveCustomLabel;
window.openPressModal = openPressModal;
window.setWeather = setWeather;
window.startKettlePhysics = startKettlePhysics;
window.acceptContract = acceptContract;
window.fulfillContract = fulfillContract;
window.cancelContract = cancelContract;
window.openContractDetailModal = openContractDetailModal;
window.closeContractDetailModal = closeContractDetailModal;
window.openOrderBreakdownModal = openOrderBreakdownModal;
window.closeOrderBreakdownModal = closeOrderBreakdownModal;
window.advanceTutorial = advanceTutorial; // Expose for UI interaction
window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.setFontStyle = setFontStyle;

// New function for handling the animation trigger
function handleSeedClickAnimation(seedElement, plotId, seedKey, tutorialNextStep) {
    const sourceIcon = seedElement.querySelector('div');
    if (!sourceIcon) {
        // Failsafe if something goes wrong, just plant without animation.
        plantSeed(plotId, seedKey);
        if (tutorialNextStep) window.advanceTutorial(tutorialNextStep);
        return;
    }

    // Get the required info for the animation BEFORE the elements are destroyed.
    const startRect = sourceIcon.getBoundingClientRect();
    const seedIconHTML = sourceIcon.innerHTML;

    // Call the function to properly close the seed selector UI.
    closePlotSelector();

    // Now that the plots are re-rendered, get the new plot element for the animation target.
    const plotElement = document.getElementById(`plot-btn-${plotId}`);
    
    const onComplete = () => {
        plantSeed(plotId, seedKey);
        if (tutorialNextStep) window.advanceTutorial(tutorialNextStep);
    };

    // Call the animation with the pre-captured info.
    playPlantAnimation(startRect, seedIconHTML, plotElement, onComplete);
}
window.handleSeedClickAnimation = handleSeedClickAnimation;

function handleAddToPressAnimation(sourceElement, ingredientId) {
    const ingredient = state.ingredients.find(ing => ing.id === ingredientId);
    if (!ingredient) return;

    const pantryAdditiveKeys = Object.keys(PANTRY_DATA);
    const isPantryAdditive = pantryAdditiveKeys.includes(ingredient.key);

    let targetElement;
    if (isPantryAdditive) {
        if (globals.loadedPantryAdditiveId) return; // Already full
        targetElement = document.getElementById('press-pantry-slot');
    } else {
        if (globals.loadedPressIngredients.length >= 3) return; // Full
        targetElement = document.getElementById(`press-slot-${globals.loadedPressIngredients.length}`);
    }

    if (!targetElement) return;

    const sourceIcon = sourceElement.querySelector('.w-6.h-6');
    if (!sourceIcon) return;

    const startRect = sourceIcon.getBoundingClientRect();
    const iconHTML = sourceIcon.innerHTML;

    sourceElement.style.visibility = 'hidden';

    const onComplete = () => {
        addToPress(ingredientId);
    };

    playAddToPressAnimation(startRect, iconHTML, targetElement, onComplete);
}
window.handleAddToPressAnimation = handleAddToPressAnimation;

window.onload = () => {
	initSound();
	if (window.lucide) window.lucide.createIcons();

	const gameWasLoaded = loadGameState();
	if (!gameWasLoaded) {
		applyFont(state.font);
	}

	renderWeather();
	startWeatherSystem();
	startContractSystem();

	renderPlots();
	renderCellarUI();
	updateHeaderUI();
	renderWarehouse();
	renderMarket();
	renderShop();
	renderBreweryUI();
	renderRacks();

	globals.gameLoopInterval = startLoop();
	initPlaytest();

	if (!gameWasLoaded) {
		startTutorial();
	} else if (state.tutorial.active) {
		resumeTutorial();
	}
	console.log("Game initialized");

	// Autosave every 10 seconds
	setInterval(saveGameState, 10000);

		function handleManualSaveHotkey(e) {
			if (!(e.ctrlKey || e.metaKey) || e.altKey) return;

			const isSaveShortcut = e.key?.toLowerCase() === 's' || e.code === 'KeyS';
			if (!isSaveShortcut) return;

			e.preventDefault();
			e.stopPropagation();
			saveGameState();
			showToast("Game Saved!");
		}

	// Manual Save Hotkey
		window.addEventListener('keydown', handleManualSaveHotkey, true);
};
