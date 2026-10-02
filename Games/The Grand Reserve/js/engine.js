import {state, globals} from "./state.js";
import {SHORT_NAMES, INGREDIENTS_DATA, SEEDS_DATA, PANTRY_DATA, RECIPES, BEER_RECIPES, TIERS, VINTAGE_RANKS, BARREL_TYPES} from "./data.js";
import {WEATHER_DATA} from "./weather.js";
import {playSound} from "./audio.js";
import {saveGameState} from "./storage.js";
import { playHarvestAnimation, playPurchaseAnimation, playGoldPopupAnimation } from "./effects.js";
import {renderPlots, renderCellarUI, showToast, updateHeaderUI, renderWarehouse, renderPressModal, renderMarket, renderRacks, renderShop, renderBreweryUI, renderKettleModal, renderMarketTimer, openSellModal, openSellBeerModal, openLabelerModal, renderWeather, hideItemTooltip, openDialog, renderContractsBoard, openContractDetailModal} from "./ui.js";
import {generateSolvableContract, checkContractCompletion} from "./contracts.js";
import {generateContractFlavorText} from "./flavor-text.js";
import {advanceGameTick as advanceSimulationTick, advanceKettlePhysicsStep, harvestCrop, plantCrop, predictBeerRecipe, predictWineRecipe, updateMarketPrices as updateMarketSimulation} from "./game-simulation.js";

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

export function startContractSystem() {
    // Attempt to generate a new contract periodically
    setInterval(() => {
        if (state.contracts.filter(c => c.status === 'available').length < 10) {
            const newContract = generateSolvableContract();
            if (newContract) {
                state.contracts.push(newContract);
                renderContractsBoard();
                showToast("A new customer order has been posted!");
                playSound("clink");
            }
        }
    }, (10 + Math.random() * 5) * 60000); // 10-15 minutes
}

export function handlePlotClick(id) {
	const plot = state.plots[id];
	if (plot.state === "empty") {
		state.activeSelectorPlotId = id;
		renderPlots();
	} else if (plot.state === "ready") {
		const plotElement = document.getElementById(`plot-btn-${id}`);
		const seedKey = harvestCrop(id);
		if (!seedKey) return;
		playHarvestAnimation(plotElement, seedKey);
		renderPlots();
		renderWarehouse();
		saveGameState();
	}
}

export function plantSeed(id, seedKey) {
	if (!plantCrop(id, seedKey)) return;
	renderPlots();
	renderShop();
	saveGameState();
}

export function addToPress(ingredientId) {
	hideItemTooltip();
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

	if (state.tutorial.active && state.tutorial.step === 9) {
        const pinotCount = globals.loadedPressIngredients.filter(id => {
            const ing = state.ingredients.find(i => i.id === id);
            return ing && ing.key === 'pinot_noir';
        }).length;
        if (pinotCount === 2) {
            window.advanceTutorial(10);
        }
    }
	renderWarehouse();
}

export function removeFromPress(slotIndex) {
	// This function now expects the actual ingredient ID to remove, not a slot index.
	hideItemTooltip();
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
	renderWarehouse();
}

export function getRecipePrediction() {
	return predictWineRecipe();
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
			if (state.tutorial.active && state.tutorial.step === 12) {
                window.advanceTutorial(13);
            }
			showToast(`Barrel 0${id + 1} squished! Fermentation starting...`);
		}
		renderCellarUI();
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

	if (state.tutorial.active && state.tutorial.step === 15) {
        window.advanceTutorial(16);
    }

	playSound("pop");

	if (finalTier === "s") {
		// S-Tier handles labeler after Celebration modal via button override in UI
		openDialog(document.getElementById("pop-modal"));
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
}

export function placeWineOnRack(bottleId) {
	hideItemTooltip();
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
	renderWarehouse();
	saveGameState();
}

export function removeWineFromRack(slotId) {
	hideItemTooltip();
	const bottle = state.wineRacks[slotId];
	if (!bottle) return;

	state.wineRacks[slotId] = null;
	state.wines.push(bottle);

	playSound("pop");
	const title = bottle.customLabel ? bottle.customLabel.title : RECIPES[bottle.recipeKey].name;
	showToast(`Removed ${title} from rack back to reserve vault!`);
	renderRacks();
	renderWarehouse();
	saveGameState();
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
		const { overlap, bounceSound, completed } = advanceKettlePhysicsStep(kettle);
		if (bounceSound) playSound("gurgle");

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

		if (completed) {
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

			openLabelerModal(newBeerId, "beer");
		}
	}, 33);
}

export function addToKettle(ingredientKey) {
	hideItemTooltip();
	if (globals.loadedKettleIngredients.length >= 3) {
		showToast("Kettle is fully loaded! (Max 3 slots)");
		return;
	}
	const ingredient = state.ingredients.find((item) =>
		item.key === ingredientKey &&
		item.count > globals.loadedKettleIngredients.filter((loadedIngredient) => loadedIngredient === item).length
	);
	if (!ingredient) {
		showToast("Not enough stock!");
		return;
	}

	globals.loadedKettleIngredients.push(ingredient);
	playSound("pluck");
	renderKettleModal();
	renderWarehouse();
	updateHeaderUI();
}

export function removeFromKettle(slotIndex) {
	hideItemTooltip();
	if (slotIndex >= globals.loadedKettleIngredients.length) return;
	globals.loadedKettleIngredients.splice(slotIndex, 1);
	playSound("pluck");
	renderKettleModal();
	renderWarehouse();
}

export function getKettleRecipePrediction() {
	return predictBeerRecipe();
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

	if (state.tutorial.active && state.tutorial.step === 19) {
        window.advanceTutorial(20);
    }

	playSound("clink");
	showToast(`Custom label applied: "${draft.title}"`);

	window.closeLabelerModal();
	renderWarehouse();
	renderRacks();
	saveGameState();
}

export function sellWineQualityGroup(qualityKey, rankIndex, customTitleStr, flavourStr, sourceElement) {
	hideItemTooltip();
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
    if (sourceElement) {
        playGoldPopupAnimation(earnings, sourceElement);
    }
	showToast(`Sold 1 bottle of "${customTitleStr}" for +$${earnings}!`, "success");

	updateHeaderUI();
	renderWarehouse();
	renderMarket();
	openSellModal(globals.activeSellingWineKey);
	saveGameState();
}

export function sellBeerGroup(customTitleStr, sourceElement) {
	hideItemTooltip();
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
	if (sourceElement) {
        playGoldPopupAnimation(earnings, sourceElement);
    }
	showToast(`Sold 1 pint of "${customTitleStr}" for +$${earnings}!`, "success");

	updateHeaderUI();
	renderWarehouse();
	renderMarket();
	openSellBeerModal(globals.activeSellingBeerKey);
	saveGameState();
}

export function buySeed(seedKey, sourceElement) {
	const seed = SEEDS_DATA[seedKey];
	if (seed && state.gold >= seed.cost) {
		state.gold -= seed.cost;
		state.seeds[seedKey]++;

		if (sourceElement) {
            playPurchaseAnimation(sourceElement, seedKey, 'seed');
        } else {
			playSound("clink");
		}
		showToast(`Bought 1x ${seed.name}!`);
		updateHeaderUI();
		renderShop();
		saveGameState();
	}
}

export function buyPantryItem(pantryKey, sourceElement) {
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

		if (sourceElement) {
            playPurchaseAnimation(sourceElement, pantryKey, 'pantry');
        } else {
			playSound("clink");
		}
		showToast(`Direct-purchased 1x ${item.name}! Added to Pantry.`);
		updateHeaderUI();
		renderShop();
		saveGameState();
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
			showToast("Vineyard plot unlocked!");
			updateHeaderUI();
			renderPlots();
			renderShop();
			saveGameState();
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
		saveGameState();
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
		saveGameState();
	}
}

export function buyOakConditioning() {
	if (state.gold >= state.shop.oakBuffCost && !state.shop.oakBuffOwned) {
		state.gold -= state.shop.oakBuffCost;
		state.shop.oakBuffOwned = true;
		playSound("clink");
		showToast("Oak conditioning installed!");
		updateHeaderUI();
		renderShop();
		saveGameState();
	}
}

export function acceptContract(contractId) {
    const contract = state.contracts.find(c => c.id === contractId);
    if (!contract || contract.status !== 'available') return;

    if (state.contracts.filter(c => c.status === 'active').length >= 3) {
        showToast("You can only have 3 active orders at a time!");
        return;
    }

    contract.status = 'active';
    contract.timeRemaining = undefined; // Active contracts don't expire
    playSound("pluck");
    showToast("Order accepted! Check the board for details.");
    renderContractsBoard();
}

export function fulfillContract(contractId, wineId, sourceElement) {
    const contract = state.contracts.find(c => c.id === contractId);
    const wineIndex = state.wines.findIndex(w => w.id === wineId);
    if (!contract || wineIndex === -1) {
        showToast("Error: Could not find order or wine.");
        return;
    }

    const wine = state.wines[wineIndex];
    const result = checkContractCompletion(wine, contract);

    if (result.success) {
        const marketValue = state.market.current[wine.recipeKey] || RECIPES[wine.recipeKey].baseVal;
        const tierMultiplier = TIERS[wine.qualityKey].mult;
        const effectiveTierMultiplier = Math.max(1, tierMultiplier); // Tier multiplier is at least 1x for contracts
        const vintageMultiplier = VINTAGE_RANKS[wine.rankIndex].mult;

        const finalMultiplier = result.multiplier;
        const earnings = Math.round(marketValue * effectiveTierMultiplier * vintageMultiplier * finalMultiplier);

        const breakdownData = {
            contract,
            wine,
            result,
            marketValue,
            tierMultiplier: effectiveTierMultiplier,
            vintageMultiplier,
            earnings
        };

        window.openOrderBreakdownModal(breakdownData);

        state.gold += earnings;

        state.wines.splice(wineIndex, 1);
        state.contracts = state.contracts.filter(c => c.id !== contractId);

        playSound("clink");
        if (sourceElement) {
            playGoldPopupAnimation(earnings, sourceElement);
        }
        window.closeContractDetailModal();
        renderContractsBoard();
        renderWarehouse();
        saveGameState();
    } else {
        showToast(`Submission rejected: ${result.reason}`, "error");
    }
}

export function cancelContract(contractId) {
    const contractIndex = state.contracts.findIndex(c => c.id === contractId);
    if (contractIndex === -1) return;

    state.contracts.splice(contractIndex, 1);
    
    playSound("pop");
    showToast("Order cancelled.");
    window.closeContractDetailModal();
    renderContractsBoard();
    saveGameState();
}

export function setDialogueDifficulty(difficulty) {
    if (!['beginner', 'intermediate', 'sommelier'].includes(difficulty)) return;
    state.dialogueDifficulty = difficulty;
    showToast(`Dialogue difficulty set to: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`);

    // Regenerate flavor text for existing contracts to reflect the change immediately
    state.contracts.forEach(contract => {
        if (contract) { // Ensure contract exists
            contract.flavorText = generateContractFlavorText(contract);
        }
    });
    renderContractsBoard();
}

const DEFAULT_TICK_EFFECTS = {
	startKettlePhysics,
	renderPlots,
	saveGameState,
	playSound,
	renderCellarUI,
	renderRacks,
	showToast,
	renderContractsBoard,
	renderMarketTimer,
	updateMarketPrices,
	advanceTutorial: (step) => window.advanceTutorial(step),
};

export function advanceGameTick(multiplier = 1, options = {}) {
	return advanceSimulationTick(multiplier, {
		...options,
		effects: options.effects ?? DEFAULT_TICK_EFFECTS,
	});
}

export function startLoop(multiplier = 1) {
	return setInterval(() => advanceGameTick(multiplier), 1000 / multiplier);
}

export function updateMarketPrices({ random = Math.random, render = true } = {}) {
	updateMarketSimulation({ random });

	if (render) {
		renderMarket();
		renderWarehouse();
	}
}
