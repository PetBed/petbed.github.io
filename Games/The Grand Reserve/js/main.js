// --- MODULE ENTRY POINT ---
import {initFirebase, openSyncModal, closeSyncModal, copySyncCode, loadRemoteSyncCode, triggerManualSync} from "./firebase-sync.js";
import {startLoop, plantSeed, addToPress, removeFromPress, placeWineOnRack, removeWineFromRack, addToKettle, removeFromKettle, startKettlePhysics, adjustKettleHeat, clearFinishedKettle, sellWineQualityGroup, sellBeerGroup, buySeed, buyPantryItem, buyPlot, buyBarrel, buyKettle, buyOakConditioning, saveCustomLabel, bottleAsVinegar, setWeather, startWeatherSystem} from "./engine.js";
import {initSound, switchReserveTab, switchShopTab, switchTab, updateHeaderUI, renderPlots, closePlotSelector, renderCellarUI, openPressModal, closePressModal, renderWarehouse, renderMarket, openSellModal, openSellBeerModal, closeSellModal, renderShop, renderBreweryUI, renderRacks, openRackSelectModal, closeRackSelectModal, openKettleModal, closeKettleModal, closeModal, openLabelerModal, closeLabelerModal, updateLabelDraft, renderWeather} from "./ui.js";
import { initPlaytest } from "./playtest.js";
import { globals } from "./state.js";

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
window.buyBarrel = buyBarrel;
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

window.openSyncModal = openSyncModal;
window.closeSyncModal = closeSyncModal;
window.copySyncCode = copySyncCode;
window.loadRemoteSyncCode = loadRemoteSyncCode;
window.triggerManualSync = triggerManualSync;
window.openPressModal = openPressModal;
window.setWeather = setWeather;
window.startKettlePhysics = startKettlePhysics;
window.onload = () => {
	initSound();
	if (window.lucide) window.lucide.createIcons();

	renderWeather();
	startWeatherSystem();

	renderPlots();
	renderCellarUI();
	updateHeaderUI();
	renderWarehouse();
	renderMarket();
	renderShop();
	renderBreweryUI();
	renderRacks();

	globals.gameLoopInterval = startLoop();
	initFirebase();
	initPlaytest();
	console.log("Game initialized");
};
