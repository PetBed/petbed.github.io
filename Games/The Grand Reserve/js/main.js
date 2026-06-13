// --- MODULE ENTRY POINT ---
import {startLoop, plantSeed, addToPress, removeFromPress, placeWineOnRack, removeWineFromRack, addToKettle, removeFromKettle, startKettlePhysics, adjustKettleHeat, clearFinishedKettle, sellWineQualityGroup, sellBeerGroup, buySeed, buyPantryItem, buyPlot, buyBarrelType, buyKettle, buyOakConditioning, saveCustomLabel, bottleAsVinegar, setWeather, startWeatherSystem, startContractSystem, acceptContract, fulfillContract, cancelContract} from "./engine.js";
import {initSound, switchReserveTab, switchShopTab, switchTab, updateHeaderUI, renderPlots, closePlotSelector, renderCellarUI, openPressModal, closePressModal, renderWarehouse, renderMarket, openSellModal, openSellBeerModal, closeSellModal, renderShop, renderBreweryUI, renderRacks, openRackSelectModal, closeRackSelectModal, openKettleModal, closeKettleModal, closeModal, openLabelerModal, closeLabelerModal, updateLabelDraft, renderWeather, showToast, openContractDetailModal, closeContractDetailModal, openOrderBreakdownModal, closeOrderBreakdownModal} from "./ui.js";
import { initPlaytest } from "./playtest.js";
import { globals } from "./state.js";
import { loadGameState, saveGameState } from "./storage.js";

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

window.onload = () => {
	initSound();
	if (window.lucide) window.lucide.createIcons();

	loadGameState();

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
