import { state } from "./state.js";
import { updateHeaderUI, renderPlots, renderCellarUI, renderWarehouse, renderMarket, renderShop, renderBreweryUI, renderRacks } from "./ui.js";

function serializeSaveState() {
	return {
		gold: state.gold,
		currentWeather: state.currentWeather,
		seeds: state.seeds,
		ingredients: state.ingredients,
		wines: state.wines,
		wineRacks: state.wineRacks,
		beers: state.beers,
		plots: state.plots,
		barrels: state.barrels,
		kettleUnlocked: state.kettleUnlocked,
		kettle: state.kettle,
		shop: state.shop,
	};
}

function applySaveState(serializedData) {
	if (!serializedData) return;
	try {
		state.gold = serializedData.gold ?? state.gold;
		state.currentWeather = serializedData.currentWeather ?? state.currentWeather;
		state.seeds = serializedData.seeds ?? state.seeds;
		state.ingredients = serializedData.ingredients ?? state.ingredients;
		state.wines = serializedData.wines ?? state.wines;
		state.wineRacks = serializedData.wineRacks ?? state.wineRacks;
		state.beers = serializedData.beers ?? state.beers;
		state.plots = serializedData.plots ?? state.plots;
		state.barrels = serializedData.barrels ?? state.barrels;
		state.kettleUnlocked = serializedData.kettleUnlocked ?? state.kettleUnlocked;
		state.kettle = serializedData.kettle ?? state.kettle;
		state.shop = serializedData.shop ?? state.shop;

		updateHeaderUI();
		renderPlots();
		renderCellarUI();
		renderWarehouse();
		renderMarket();
		renderShop();
		renderBreweryUI();
		renderRacks();
	} catch (err) {
		console.error("Failed to apply save state:", err);
	}
}

export function saveGameState() {
    try {
        const stateData = serializeSaveState();
        console.log("Game state saved to local storage.");
        localStorage.setItem('grand_reserve_save', JSON.stringify(stateData));
    } catch (err) {
        console.error("Failed to save game to local storage:", err);
    }
}

export function loadGameState() {
    try {
        const savedStateJSON = localStorage.getItem('grand_reserve_save');
        if (savedStateJSON) {
            const savedState = JSON.parse(savedStateJSON);
            applySaveState(savedState);
            console.log("Game state loaded from local storage.");
        }
    } catch (err) {
        console.error("Failed to load game from local storage:", err);
    }
}

export function resetGameState() {
    if (confirm("Are you sure you want to reset all game progress? This cannot be undone.")) {
        localStorage.removeItem('grand_reserve_save');
        window.location.reload();
    }
}