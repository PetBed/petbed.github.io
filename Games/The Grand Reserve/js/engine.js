import {state, globals} from "./state.js";
import {SHORT_NAMES, INGREDIENTS_DATA, SEEDS_DATA, PANTRY_DATA, RECIPES, BEER_RECIPES, TIERS, VINTAGE_RANKS, BARREL_TYPES} from "./data.js";
import {WEATHER_DATA} from "./weather.js";
import {playSound} from "./audio.js";
import {triggerAutoSave} from "./firebase-sync.js";
import {renderPlots, renderCellarUI, showToast, updateHeaderUI, renderWarehouse, renderPressModal, renderMarket, renderRacks, renderShop, renderBreweryUI, renderKettleModal, renderMarketTimer, openSellModal, openSellBeerModal, openLabelerModal} from "./ui.js";

export function setWeather(weatherKey) {
	state.currentWeather = weatherKey;
	renderWeather();
}

export function startWeatherSystem() {
	setInterval(() => {
		const weatherKeys = Object.keys(WEATHER_DATA);
		const newWeather = weatherKeys[Math.floor(Math.random() * weatherKeys.length)];
		setWeather(newWeather);
	}, 180000); // 3 minutes
}

export function renderWeather() {
	const weather = WEATHER_DATA[state.currentWeather];
	const weatherDisplay = document.getElementById("weather-display");
	if (weatherDisplay) {
		weatherDisplay.innerHTML = `
			<i data-lucide="${weather.icon}" class="w-4 h-4 ${weather.color}"></i>
			<span class="${weather.color}">${weather.name}</span>
		`;
		if (window.lucide) window.lucide.createIcons();
	}
}

export function handlePlotClick(id) {
	const plot = state.plots[id];
	if (plot.state === "empty") {
		state.activeSelectorPlotId = id;
		renderPlots();
	} else if (plot.state === "ready") {
		const seedKey = plot.cropType;
		const ingData = INGREDIENTS_DATA[seedKey];
		const flavour = JSON.parse(JSON.stringify(ingData.flavour)); // Deep copy to prevent mutation of base data
		const harvestWeatherKey = state.currentWeather;
		const weather = WEATHER_DATA[harvestWeatherKey];
		if (weather && weather.modifier) {
			flavour.sw = Math.max(0, Math.min(100, flavour.sw + weather.modifier.sw));
			flavour.ac = Math.max(0, Math.min(100, flavour.ac + weather.modifier.ac));
			flavour.tn = Math.max(0, Math.min(100, flavour.tn + weather.modifier.tn));
			flavour.bd = Math.max(0, Math.min(100, flavour.bd + weather.modifier.bd));
		}

		const existingIngredient = state.ingredients.find(ing => ing.key === seedKey && JSON.stringify(ing.flavour) === JSON.stringify(flavour));
		if (existingIngredient) {
			existingIngredient.count++;
		} else {
			state.ingredients.push({
				id: `${seedKey}_${Date.now()}`,
				key: seedKey,
				count: 1,
				flavour: flavour,
				weather: harvestWeatherKey,
			});
		}

		plot.state = "empty";
		plot.cropType = null;
		playSound("pluck");
		showToast(`Harvested ${INGREDIENTS_DATA[seedKey].name}!`);
		renderPlots();
		updateHeaderUI();
		renderWarehouse();
		triggerAutoSave();
	}
}

export function plantSeed(id, seedKey) {
	const plot = state.plots[id];
	if (plot && plot.state === "empty" && state.seeds[seedKey] > 0) {
		state.seeds[seedKey]--;
		plot.state = "growing";
		plot.cropType = seedKey;
		plot.timeRemaining = SEEDS_DATA[seedKey].growTime;
		state.activeSelectorPlotId = null;
		playSound("pluck");
		showToast(`Planted ${SHORT_NAMES[seedKey]}!`);
		renderPlots();
		updateHeaderUI();
		renderShop();
		triggerAutoSave();
	}
}

export function addToPress(ingredientId) {
	const ingredient = state.ingredients.find(ing => ing.id === ingredientId);
	if (!ingredient || ingredient.count <= 0 || !ingredient.flavour) { // Ensure ingredient has flavour data
		showToast("Not enough stock!");
		return;
	}
	
	const isPantryAdditive = ingredient.key === "wild_yeast" || ingredient.key === "pure_honey";
	
	if (isPantryAdditive) {
		if (globals.loadedPantryAdditiveId) {
			showToast("Only one pantry additive can be used per barrel!");
			return;
		}
		globals.loadedPantryAdditiveId = ingredientId;
	} else {
		// Existing logic for regular ingredients
		globals.loadedPressIngredients.push(ingredientId);
	}
	
	ingredient.count--;
	
	playSound("pluck");
	renderPressModal();
	updateHeaderUI();
	renderWarehouse();
}

export function removeFromPress(slotIndex) {
	// This function now expects the actual ingredient ID to remove, not a slot index.
	// The UI will be updated to pass the ID.
	const ingredientIdToRemove = slotIndex; // Renaming for clarity based on UI change

	// Check if it's the pantry additive
	if (globals.loadedPantryAdditiveId === ingredientIdToRemove) {
		const ingredient = state.ingredients.find(ing => ing.id === globals.loadedPantryAdditiveId);
		if (ingredient) {
			ingredient.count++;
		}
		globals.loadedPantryAdditiveId = null;
	} else {
		// Check if it's a regular ingredient
		const index = globals.loadedPressIngredients.indexOf(ingredientIdToRemove);
		if (index === -1) return; // Not found in regular ingredients

		const ingredient = state.ingredients.find(ing => ing.id === ingredientIdToRemove);
		if (ingredient) {
			ingredient.count++;
		}
		globals.loadedPressIngredients.splice(index, 1);
	}

	playSound("pluck");
	renderPressModal();
	updateHeaderUI();
	renderWarehouse();
}

export function getRecipePrediction() {
	if (globals.loadedPressIngredients.length === 0) {
		return {key: null, name: "Empty Press", desc: "Load ingredients to preview.", flavour: {sw: 0, ac: 0, tn: 0, bd: 0}};
	}

	const flavour = {sw: 0, ac: 0, tn: 0, bd: 0};
	const ingredientKeys = [];
	globals.loadedPressIngredients.forEach((ingId) => {
		const ing = state.ingredients.find(i => i.id === ingId); // Find the actual ingredient object
		if (ing && ing.flavour) {
			flavour.sw = Math.max(0, Math.min(100, flavour.sw + ing.flavour.sw));
			flavour.ac = Math.max(0, Math.min(100, flavour.ac + ing.flavour.ac));
			flavour.tn = Math.max(0, Math.min(100, flavour.tn + ing.flavour.tn));
			flavour.bd = Math.max(0, Math.min(100, flavour.bd + ing.flavour.bd));
			ingredientKeys.push(ing.key);
		}
	});

	// Add flavour from pantry additive, if present
	if (globals.loadedPantryAdditiveId) {
		const pantryIng = state.ingredients.find(i => i.id === globals.loadedPantryAdditiveId);
		if (pantryIng && pantryIng.flavour) {
			flavour.sw = Math.max(0, Math.min(100, flavour.sw + pantryIng.flavour.sw));
			flavour.ac = Math.max(0, Math.min(100, flavour.ac + pantryIng.flavour.ac));
			flavour.tn = Math.max(0, Math.min(100, flavour.tn + pantryIng.flavour.tn));
			flavour.bd = Math.max(0, Math.min(100, flavour.bd + pantryIng.flavour.bd));
		}
	};

	const counts = {};
	ingredientKeys.forEach((ing) => {
		counts[ing] = (counts[ing] || 0) + 1;
	});

	const matches = (recipeReq) => {
		const reqKeys = Object.keys(recipeReq);
		if (reqKeys.length === 0) return false;
		const loadedKeys = Object.keys(counts);
		if (loadedKeys.length !== reqKeys.length) return false;
		return reqKeys.every((k) => counts[k] === recipeReq[k]);
	};

	for (const [key, recipe] of Object.entries(RECIPES)) {
		if (key === "fruit_cider" || key === "house_red") continue;
		if (matches(recipe.req)) {
			return {key, name: recipe.name, desc: recipe.desc, flavour};
		}
	}

	if (globals.loadedPressIngredients.length >= 2) {
		const berriesList = ["blackberry", "raspberry", "blueberry", "strawberry", "elderberry"];
		const allBerries = ingredientKeys.every((ing) => berriesList.includes(ing));

		if (allBerries) {
			return {key: "fruit_cider", name: RECIPES.fruit_cider.name, desc: RECIPES.fruit_cider.desc, flavour};
		} else {
			return {key: "house_red", name: RECIPES.house_red.name, desc: RECIPES.house_red.desc, flavour};
		}
	}

	return {key: null, name: "Incomplete Recipe", desc: "Add more ingredients to form a valid recipe.", flavour};
}

export function handleBarrelClick(id) {
	const barrel = state.barrels.find((b) => b.id === id);
	if (!barrel) return;
	if (barrel.state === "empty") {
		window.openPressModal(id);
	} else if (barrel.state === "crushing") {
		barrel.crushProgress++;
		playSound("squish");
		const btn = document.getElementById(`barrel-btn-${id}`);
		if (btn) {
			btn.classList.add("animate-shake");
			setTimeout(() => btn.classList.remove("animate-shake"), 150);
		}
		if (barrel.crushProgress >= barrel.maxCrush) {
			barrel.state = "fermenting";
			barrel.fermentTime = barrel.maxFerment;
			showToast(`Barrel 0${id + 1} squished! Fermentation starting...`);
		}
		renderCellarUI();
		triggerAutoSave();
	}
}

export function handleBottleAction(id) {
	const barrel = state.barrels.find((b) => b.id === id);
	if (!barrel || barrel.state !== "aging") return;

	const progress = barrel.ageProgress;
  let finalTier = (progress < 30) ? "c" : (progress < 60) ? "b" : (progress < 80) ? "a" : "s";

	// const flavour = {sw: 0, ac: 0, tn: 0, bd: 0};
	// barrel.ingredients.forEach((ingId) => {
	// 	const ing = state.ingredients.find(i => i.id === ingId);
	// 	if (ing && ing.flavour) { // Ensure ingredient has flavour data
	// 		flavour.sw = Math.max(0, Math.min(100, flavour.sw + ing.flavour.sw));
	// 		flavour.ac = Math.max(0, Math.min(100, flavour.ac + ing.flavour.ac));
	// 		flavour.tn = Math.max(0, Math.min(100, flavour.tn + ing.flavour.tn));
	// 		flavour.bd = Math.max(0, Math.min(100, flavour.bd + ing.flavour.bd));
	// 	}
	// });

	// // Add flavour from pantry additive, if present in the barrel
	// if (barrel.pantryAdditiveId) {
	// 	const pantryIng = state.ingredients.find(i => i.id === barrel.pantryAdditiveId);
	// 	if (pantryIng && pantryIng.flavour) { // Ensure pantry additive has flavour data
	// 		flavour.sw = Math.max(0, Math.min(100, flavour.sw + pantryIng.flavour.sw));
	// 		flavour.ac = Math.max(0, Math.min(100, flavour.ac + pantryIng.flavour.ac));
	// 		flavour.tn = Math.max(0, Math.min(100, flavour.tn + pantryIng.flavour.tn));
	// 		flavour.bd = Math.max(0, Math.min(100, flavour.bd + pantryIng.flavour.bd));
	// 	}
	// }

	const bottle = {
		id: "wine_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
		recipeKey: barrel.recipeKey,
		qualityKey: finalTier,
		age: 0,
		rankIndex: 0,
		flavour: JSON.parse(JSON.stringify(barrel.flavour)),
		// customLabel property appended later inside labeler
	};

	state.wines.push(bottle);
	playSound("pop");

	if (finalTier === "s") {
		// S-Tier handles labeler after Celebration modal via button override in UI
		document.getElementById("pop-modal").classList.remove("hidden");
		// Store temporarily on the global for the celebration to retrieve
		globals.labeling.id = bottle.id;
	} else {
		showToast(`Bottled generic ${RECIPES[barrel.recipeKey].name} (${TIERS[finalTier].name}).`);
		openLabelerModal(bottle.id, "wine"); // Invoke customization immediately
	}

	barrel.state = "empty";
	barrel.ageProgress = 0;
	barrel.crushProgress = 0;
	barrel.recipeKey = null;
	barrel.ingredients = [];
	barrel.baseWineFlavour = null; // Clear base flavour
	barrel.flavour = null; // Clear current flavour
	barrel.pantryAdditiveId = null; // Clear pantry additive from barrel

	updateHeaderUI();
	renderCellarUI();
	renderWarehouse();
	renderMarket();
	triggerAutoSave();
}

export function bottleAsVinegar(id) {
	const barrel = state.barrels.find((b) => b.id === id);
	if (!barrel || barrel.state !== "aging") return;

	const bottle = {
		id: "wine_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
		recipeKey: barrel.recipeKey,
		qualityKey: "vinegar",
		age: 0,
		rankIndex: 0,
	};
	state.wines.push(bottle);
	playSound("pop");
	showToast(`Barrel 0${barrel.id + 1} batch was converted to Vinegar.`);

	barrel.state = "empty";
	barrel.ageProgress = 0;
	barrel.crushProgress = 0;
	barrel.pantryAdditiveId = null; // Clear pantry additive from barrel
	barrel.baseWineFlavour = null; // Clear base flavour
	barrel.flavour = null; // Clear current flavour
	barrel.recipeKey = null;

	updateHeaderUI();
	renderCellarUI();
	renderWarehouse();
	renderMarket();
	triggerAutoSave();
}

export function placeWineOnRack(bottleId) {
	const index = state.wines.findIndex((w) => w.id === bottleId);
	if (index === -1 || state.activeRackSlotId === null) return;

	const bottle = state.wines[index];
	state.wines.splice(index, 1);
	state.wineRacks[state.activeRackSlotId] = bottle;

	playSound("pluck");
	const title = bottle.customLabel ? bottle.customLabel.title : RECIPES[bottle.recipeKey].name;
	showToast(`Placed ${title} on rack slot 0${state.activeRackSlotId + 1}!`);
	window.closeRackSelectModal();
	renderRacks();
	updateHeaderUI();
	renderWarehouse();
	triggerAutoSave();
}

export function removeWineFromRack(slotId) {
	const bottle = state.wineRacks[slotId];
	if (!bottle) return;

	state.wineRacks[slotId] = null;
	state.wines.push(bottle);

	playSound("pop");
	const title = bottle.customLabel ? bottle.customLabel.title : RECIPES[bottle.recipeKey].name;
	showToast(`Removed ${title} from rack back to reserve vault!`);
	renderRacks();
	updateHeaderUI();
	renderWarehouse();
	triggerAutoSave();
}

export function startKettlePhysics() {
	if (globals.kettlePhysicsInterval) clearInterval(globals.kettlePhysicsInterval);
	const catcherWidth = 21;

	globals.kettlePhysicsInterval = setInterval(() => {
		if (state.kettle.state !== "brewing") {
			clearInterval(globals.kettlePhysicsInterval);
			globals.kettlePhysicsInterval = null;
			return;
		}

		// Fetch DOM elements inside the interval to properly re-attach if tabs are switched mid-brew
		const catcherEl = document.getElementById("kettle-catcher");
		const targetEl = document.getElementById("kettle-target");
		const progressEl = document.getElementById("kettle-progress-bar");
		const feedbackEl = document.getElementById("kettle-feedback");

		const kettle = state.kettle;
		kettle.catcherVel *= 0.92;
		kettle.catcherPos += kettle.catcherVel;

		if (kettle.catcherPos < 0) {
			kettle.catcherPos = 0;
			kettle.catcherVel = -kettle.catcherVel * 0.45;
			if (Math.abs(kettle.catcherVel) > 0.4) playSound("gurgle");
		}
		if (kettle.catcherPos > 100 - catcherWidth) {
			kettle.catcherPos = 100 - catcherWidth;
			kettle.catcherVel = -kettle.catcherVel * 0.45;
			if (Math.abs(kettle.catcherVel) > 0.4) playSound("gurgle");
		}

		if (Math.random() < 0.8) {
			kettle.targetVel += (Math.random() - 0.5) * 0.45;
		}
		kettle.targetVel = Math.max(-1.43, Math.min(1.43, kettle.targetVel));
		kettle.targetPos += kettle.targetVel;

		if (kettle.targetPos < 0) {
			kettle.targetPos = 0;
			kettle.targetVel = -kettle.targetVel * 0.8;
		}
		if (kettle.targetPos > 100) {
			kettle.targetPos = 100;
			kettle.targetVel = -kettle.targetVel * 0.8;
		}

		const overlap = kettle.targetPos >= kettle.catcherPos && kettle.targetPos <= kettle.catcherPos + catcherWidth;

		if (overlap) {
			const beerRecipe = BEER_RECIPES[kettle.recipeKey] || {baseVal: 30};
			const baseVal = beerRecipe.baseVal;
			const brewTimeSeconds = 7.5 + ((baseVal - 30) / 100) * 14.5;
			const increment = (33 / (brewTimeSeconds * 1000)) * 100;
			kettle.progress = Math.min(100, kettle.progress + increment);
		} else {
			kettle.progress = Math.max(0, kettle.progress - 0.25);
		}

		if (catcherEl) {
			catcherEl.style.left = `${kettle.catcherPos}%`;
			catcherEl.style.width = `${catcherWidth}%`;
		}
		if (targetEl) targetEl.style.left = `${kettle.targetPos}%`;
		if (progressEl) progressEl.style.width = `${kettle.progress}%`;
		if (feedbackEl) {
			if (overlap) {
				feedbackEl.textContent = "Bubbles Aligned!";
				feedbackEl.className = "px-2.5 py-0.5 text-[9px] font-extrabold rounded-full border text-emerald-700 bg-emerald-50 border-emerald-200 animate-pulse";
			} else {
				feedbackEl.textContent = "Catch the bubble!";
				feedbackEl.className = "px-2.5 py-0.5 text-[9px] font-extrabold rounded-full border text-amber-700 bg-amber-50 border-amber-200";
			}
		}

		if (kettle.progress >= 100) {
			clearInterval(globals.kettlePhysicsInterval);
			globals.kettlePhysicsInterval = null;
			kettle.state = "success";

			const newBeerId = "beer_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
			state.beers.push({
				id: newBeerId,
				recipeKey: kettle.recipeKey,
			});

			showToast(`Brewed a ${BEER_RECIPES[kettle.recipeKey].name}! Prepare label design.`);
			playSound("pop");
			renderBreweryUI();
			triggerAutoSave();

			openLabelerModal(newBeerId, "beer");
		}
	}, 33);
}

export function addToKettle(ingredientKey) {
	if (globals.loadedKettleIngredients.length >= 3) {
		showToast("Kettle is fully loaded! (Max 3 slots)");
		return;
	}
	if (state.ingredients[ingredientKey] <= 0) {
		showToast("Not enough stock!");
		return;
	}

	state.ingredients[ingredientKey]--;
	globals.loadedKettleIngredients.push(ingredientKey);
	playSound("pluck");
			renderKettleModal(); // This will re-render the inventory, showing returned items
	updateHeaderUI();
	renderWarehouse();
}

export function removeFromKettle(slotIndex) {
	if (slotIndex >= globals.loadedKettleIngredients.length) return;
	const ing = globals.loadedKettleIngredients[slotIndex];
	state.ingredients[ing]++;
	globals.loadedKettleIngredients.splice(slotIndex, 1);
	playSound("pluck");
	renderKettleModal();
	updateHeaderUI();
	renderWarehouse();
}

export function getKettleRecipePrediction() {
	if (globals.loadedKettleIngredients.length === 0) return {key: null, name: "Empty Kettle", desc: "Load ingredients to preview."};
	const counts = {};
	globals.loadedKettleIngredients.forEach((ing) => {
		counts[ing] = (counts[ing] || 0) + 1;
	});
	const matches = (recipeReq) => {
		const reqKeys = Object.keys(recipeReq);
		if (reqKeys.length === 0) return false;
		const loadedKeys = Object.keys(counts);
		if (loadedKeys.length !== reqKeys.length) return false;
		return reqKeys.every((k) => counts[k] === recipeReq[k]);
	};
	for (const [key, recipe] of Object.entries(BEER_RECIPES)) {
		if (matches(recipe.req)) return {key, name: recipe.name, desc: recipe.desc};
	}
	return {key: null, name: "Mysterious Mash", desc: "Add more grains or pantry additives to balance a valid recipe."};
}

export function adjustKettleHeat(deg) {
	if (state.kettle.state !== "brewing") return;
	state.kettle.catcherVel += deg;
	playSound("squish");
}

export function clearFinishedKettle() {
	state.kettle.state = "empty";
	state.kettle.recipeKey = null;
	renderBreweryUI();
	renderWarehouse();
	renderMarket();
}

// Custom Label Persistance Function
export function saveCustomLabel() {
	const {id, type, draft} = globals.labeling;
	if (!id) return;

	if (type === "wine") {
		let item = state.wines.find((w) => w.id === id);
		if (!item) item = state.wineRacks.find((w) => w && w.id === id);
		if (item) item.customLabel = {...draft};
	} else {
		let item = state.beers.find((b) => b.id === id);
		if (item) item.customLabel = {...draft};
	}

	playSound("clink");
	showToast(`Custom label applied: "${draft.title}"`);

	window.closeLabelerModal();
	renderWarehouse();
	renderRacks();
	renderMarket();
	triggerAutoSave();
}

export function sellWineQualityGroup(qualityKey, rankIndex, customTitleStr, flavourStr) {
	if (!globals.activeSellingWineKey) return;

	// Find all bottles matching criteria including exact custom titles to empty the group
	const indexesToRemove = [];
	state.wines.forEach((w, idx) => {
		const matchKey = w.recipeKey === globals.activeSellingWineKey && w.qualityKey === qualityKey && w.rankIndex === rankIndex;
		const title = w.customLabel ? w.customLabel.title : RECIPES[globals.activeSellingWineKey].name;
		const matchFlavour = JSON.stringify(w.flavour) === flavourStr;
		if (matchKey && title === customTitleStr && matchFlavour) {
			indexesToRemove.push(idx);
		}
	});

	if (indexesToRemove.length === 0) return;

	// Actually remove one from the top of the stack
	const targetIndex = indexesToRemove[0];
	state.wines.splice(targetIndex, 1);

	const liveBaseVal = state.market.current[globals.activeSellingWineKey];
	const qMult = TIERS[qualityKey].mult;
	const vMult = VINTAGE_RANKS[rankIndex].mult;
	const earnings = Math.round(liveBaseVal * qMult * vMult);

	state.gold += earnings;
	state.market.oversupply[globals.activeSellingWineKey]++;

	playSound("clink");
	showToast(`Sold 1 bottle of "${customTitleStr}" for $${earnings}!`);

	updateHeaderUI();
	renderWarehouse();
	renderMarket();
	openSellModal(globals.activeSellingWineKey);
	triggerAutoSave();
}

export function sellBeerGroup(customTitleStr) {
	if (!globals.activeSellingBeerKey) return;

	const indexesToRemove = [];
	state.beers.forEach((b, idx) => {
		const title = b.customLabel ? b.customLabel.title : BEER_RECIPES[globals.activeSellingBeerKey].name;
		if (b.recipeKey === globals.activeSellingBeerKey && title === customTitleStr) {
			indexesToRemove.push(idx);
		}
	});

	if (indexesToRemove.length === 0) return;
	state.beers.splice(indexesToRemove[0], 1);

	const earnings = state.market.current[globals.activeSellingBeerKey];
	state.gold += earnings;
	state.market.oversupply[globals.activeSellingBeerKey]++;

	playSound("clink");
	showToast(`Sold 1 pint of "${customTitleStr}" for $${earnings}!`);

	updateHeaderUI();
	renderWarehouse();
	renderMarket();
	openSellBeerModal(globals.activeSellingBeerKey);
	triggerAutoSave();
}

export function buySeed(seedKey) {
	const seed = SEEDS_DATA[seedKey];
	if (seed && state.gold >= seed.cost) {
		state.gold -= seed.cost;
		state.seeds[seedKey]++;
		playSound("clink");
		showToast(`Bought 1x ${seed.name}!`);
		updateHeaderUI();
		renderShop();
		triggerAutoSave();
	}
}

export function buyPantryItem(pantryKey) {
	const item = PANTRY_DATA[pantryKey];
	if (item && state.gold >= item.cost) {
		state.gold -= item.cost;

		// Pantry items don't have flavour variations, so we can group them by key
		const existingIngredient = state.ingredients.find((ing) => ing.key === pantryKey);
		if (existingIngredient) {
			existingIngredient.count++;
		} else {
			state.ingredients.push({
				id: `${pantryKey}_${Date.now()}`,
				key: pantryKey,
				count: 1,
				flavour: INGREDIENTS_DATA[pantryKey]?.flavour || null,
			});
		}

		playSound("clink");
		showToast(`Direct-purchased 1x ${item.name}! Added to Pantry.`);
		updateHeaderUI();
		renderShop();
		triggerAutoSave();
	}
}

export function buyPlot() {
	if (state.gold >= state.shop.plotCost) {
		const firstLocked = state.plots.find((p) => p.state === "locked");
		if (firstLocked) {
			state.gold -= state.shop.plotCost;
			firstLocked.state = "empty";
			state.shop.plotCost = Math.round(state.shop.plotCost * 1.5);
			playSound("clink");
			showToast("Vineyard Plot unlocked!");
			updateHeaderUI();
			renderPlots();
			renderShop();
			triggerAutoSave();
		}
	}
}

export function buyBarrelType(barrelTypeKey) { // Renamed from buyBarrel
	const barrelTypeData = BARREL_TYPES[barrelTypeKey];
	if (!barrelTypeData) {
		console.error("Invalid barrel type:", barrelTypeKey);
		return;
	}

	const currentOwned = state.shop.barrelsOwned[barrelTypeKey] || 0;
	if (currentOwned >= barrelTypeData.maxOwned) {
		showToast(`Already own maximum ${barrelTypeData.name} barrels!`);
		return;
	}

	if (state.gold >= barrelTypeData.cost) {
		state.gold -= barrelTypeData.cost;
		state.barrels.push({
			id: state.barrels.length, // Assign a new unique ID
			type: barrelTypeKey,
			state: "empty",
			crushProgress: 0,
			maxCrush: 5,
			fermentTime: 0,
			maxFerment: 5,
			ageProgress: 0,
			qualityMultiplier: 1.0,
			recipeKey: null,
			ingredients: [],
			pantryAdditiveId: null,
			baseWineFlavour: null,
			flavour: null,
		});
		state.shop.barrelsOwned[barrelTypeKey] = currentOwned + 1; // Increment count
		playSound("clink");
		showToast(`New ${barrelTypeData.name} installed!`);
		updateHeaderUI();
		renderCellarUI();
		renderShop();
		triggerAutoSave();
	}
	else {
		showToast("Not enough gold to buy this barrel!");
	}
}

export function buyKettle() {
	if (state.gold >= state.shop.kettleCost && !state.kettleUnlocked) {
		state.gold -= state.shop.kettleCost;
		state.kettleUnlocked = true;
		playSound("clink");
		showToast("Copper Kettle active! Brewery module unlocked.");
		updateHeaderUI();
		renderBreweryUI();
		renderShop();
		triggerAutoSave();
	}
}

export function buyOakConditioning() {
	if (state.gold >= state.shop.oakBuffCost && !state.shop.oakBuffOwned) {
		state.gold -= state.shop.oakBuffCost;
		state.shop.oakBuffOwned = true;
		playSound("clink");
		showToast("Installed Oak Conditioning! Aging speed +30%.");
		updateHeaderUI();
		renderShop();
		triggerAutoSave();
	}
}

export function startLoop(multiplier = 1) {
	return setInterval(() => {
		const speedFactor = state.shop.oakBuffOwned ? 1.3 : 1.0;

		// Auto-resume minigame physics if loaded from a cloud save mid-brew
		if (state.kettle.state === "brewing" && !globals.kettlePhysicsInterval) {
			startKettlePhysics();
		}

		let plotsChanged = false;
		state.plots.forEach((plot) => {
			if (plot.state === "growing") {
				plot.timeRemaining--;
				plotsChanged = true;
				if (plot.timeRemaining <= 0) plot.state = "ready";
			}
		});
		if (plotsChanged) {
			renderPlots();
			triggerAutoSave();
		}

		let cellarChanged = false;
		state.barrels.forEach((barrel) => {
			if (barrel.state === "fermenting") {
				barrel.fermentTime--;
				cellarChanged = true;
				if (Math.random() < 0.2) playSound("gurgle");
				if (barrel.fermentTime <= 0) {
					barrel.state = "aging";
					barrel.ageProgress = 0;
					barrel.qualityMultiplier = 1.0;
					showToast(`Fermentation completed inside Barrel 0${barrel.id + 1}!`);
				}
			} else if (barrel.state === "aging") {
				// Apply barrel flavour modifiers during aging
				const barrelTypeData = BARREL_TYPES[barrel.type];
				if (barrelTypeData && barrelTypeData.flavourModifier && barrel.flavour) {
					const modifier = barrelTypeData.flavourModifier;
					const actualSpeedFactor = speedFactor;

					barrel.flavour.sw = Math.max(0, Math.min(100, barrel.flavour.sw + modifier.sw * actualSpeedFactor));
					barrel.flavour.ac = Math.max(0, Math.min(100, barrel.flavour.ac + modifier.ac * actualSpeedFactor));
					barrel.flavour.tn = Math.max(0, Math.min(100, barrel.flavour.tn + modifier.tn * actualSpeedFactor));
					barrel.flavour.bd = Math.max(0, Math.min(100, barrel.flavour.bd + modifier.bd * actualSpeedFactor));
				}

				cellarChanged = true;
				if (barrel.ageProgress >= 78 && barrel.ageProgress < 100) {
					if (Math.random() < 0.5) playSound("tick");
				}
				barrel.ageProgress += speedFactor;
				if (barrel.ageProgress > 100) {
					barrel.ageProgress = 100;
				}
			}
		});
		if (cellarChanged) renderCellarUI();

		let racksChanged = false;
		state.wineRacks.forEach((bottle, idx) => {
			if (bottle) {
				bottle.age++;
				racksChanged = true;
				const potentialRank = VINTAGE_RANKS.find((r, i) => {
					const currentBoundary = r.ageReq;
					const isNextOverBound = VINTAGE_RANKS[i + 1] ? bottle.age >= VINTAGE_RANKS[i + 1].ageReq : false;
					return bottle.age >= currentBoundary && !isNextOverBound;
				});

				if (potentialRank) {
					const newIdx = VINTAGE_RANKS.indexOf(potentialRank);
					if (newIdx !== bottle.rankIndex) {
						bottle.rankIndex = newIdx;
						showToast(`A racked bottle has reached "${potentialRank.name}" maturation!`);
						playSound("tick");
					}
				}
			}
		});
		if (racksChanged && globals.currentTab === "racks") renderRacks();

		state.market.tickCurrent--;
		renderMarketTimer();

		if (state.market.tickCurrent <= 0) {
			state.market.tickCurrent = state.market.tickMax;
			updateMarketPrices();
			showToast("📈 Market prices have shifted!");
		}
	}, 1000 / multiplier);
}

export function updateMarketPrices() {
	Object.keys(RECIPES).forEach((key) => {
		const base = RECIPES[key].baseVal || 45;
		state.market.oversupply[key] *= 0.8;
		const penalty = Math.max(0.3, 1 - state.market.oversupply[key] * 0.05);
		const volatility = 1 + (Math.random() * 0.4 - 0.2);
		let newPrice = Math.round(base * volatility * penalty);
		newPrice = Math.max(1, newPrice);
		state.market.current[key] = newPrice;
		state.market.history[key].push(newPrice);
		if (state.market.history[key].length > 10) state.market.history[key].shift();
	});

	Object.keys(BEER_RECIPES).forEach((key) => {
		const base = BEER_RECIPES[key].baseVal || 30;
		state.market.oversupply[key] *= 0.8;
		const penalty = Math.max(0.3, 1 - state.market.oversupply[key] * 0.05);
		const volatility = 1 + (Math.random() * 0.3 - 0.15);
		let newPrice = Math.round(base * volatility * penalty);
		newPrice = Math.max(1, newPrice);
		state.market.current[key] = newPrice;
		state.market.history[key].push(newPrice);
		if (state.market.history[key].length > 10) state.market.history[key].shift();
	});

	renderMarket();
	renderWarehouse();
}
