import { BEER_RECIPES, BARREL_TYPES, INGREDIENTS_DATA, RECIPES, SEEDS_DATA, VINTAGE_RANKS } from './data.js';
import { globals, state } from './state.js';
import { WEATHER_DATA } from './weather.js';

function clampFlavour(flavour) {
	for (const attribute of ['sw', 'ac', 'tn', 'bd']) {
		flavour[attribute] = Math.max(0, Math.min(100, flavour[attribute]));
	}
	return flavour;
}

export function calculateHarvestFlavour(cropKey, weatherKey) {
	const baseFlavour = INGREDIENTS_DATA[cropKey]?.flavour;
	if (!baseFlavour) return { flavour: null, weather: null };
	const flavour = { ...baseFlavour };
	const modifier = WEATHER_DATA[weatherKey]?.modifier;
	if (modifier) {
		for (const attribute of ['sw', 'ac', 'tn', 'bd']) flavour[attribute] += modifier[attribute];
	}
	return { flavour: clampFlavour(flavour), weather: weatherKey };
}

export function plantCrop(plotId, seedKey) {
	const plot = state.plots[plotId];
	if (!plot || plot.state !== 'empty' || !(state.seeds[seedKey] > 0) || !SEEDS_DATA[seedKey]) return false;
	state.seeds[seedKey]--;
	plot.state = 'growing';
	plot.cropType = seedKey;
	plot.timeRemaining = SEEDS_DATA[seedKey].growTime;
	state.activeSelectorPlotId = null;
	return true;
}

export function harvestCrop(plotId, { now = Date.now } = {}) {
	const plot = state.plots[plotId];
	if (!plot || plot.state !== 'ready') return null;
	const seedKey = plot.cropType;
	if (!INGREDIENTS_DATA[seedKey]) return null;
	const harvest = calculateHarvestFlavour(seedKey, state.currentWeather);
	const existingIngredient = state.ingredients.find((ingredient) =>
		ingredient.key === seedKey && JSON.stringify(ingredient.flavour) === JSON.stringify(harvest.flavour));
	if (existingIngredient) {
		existingIngredient.count++;
	} else {
		state.ingredients.push({
			id: `${seedKey}_${now()}`,
			key: seedKey,
			count: 1,
			flavour: harvest.flavour,
			weather: harvest.weather,
		});
	}
	plot.state = 'empty';
	plot.cropType = null;
	return seedKey;
}

export function predictWineRecipe() {
	const loadedIds = globals.loadedPressIngredients;
	if (loadedIds.length === 0) {
		return { key: null, name: 'Empty Press', desc: 'Load ingredients to preview.', flavour: { sw: 0, ac: 0, tn: 0, bd: 0 } };
	}

	const flavour = { sw: 0, ac: 0, tn: 0, bd: 0 };
	const ingredientKeys = [];
	for (const ingredientId of loadedIds) {
		const ingredient = state.ingredients.find((item) => item.id === ingredientId);
		if (!ingredient?.flavour) continue;
		for (const attribute of ['sw', 'ac', 'tn', 'bd']) {
			flavour[attribute] = Math.max(0, Math.min(100, flavour[attribute] + ingredient.flavour[attribute]));
		}
		ingredientKeys.push(ingredient.key);
	}

	const pantryIngredient = state.ingredients.find((item) => item.id === globals.loadedPantryAdditiveId);
	if (pantryIngredient?.flavour) {
		for (const attribute of ['sw', 'ac', 'tn', 'bd']) {
			flavour[attribute] = Math.max(0, Math.min(100, flavour[attribute] + pantryIngredient.flavour[attribute]));
		}
	}

	const counts = {};
	for (const key of ingredientKeys) counts[key] = (counts[key] || 0) + 1;
	const matches = (requirements) => {
		const requiredKeys = Object.keys(requirements);
		return requiredKeys.length > 0
			&& Object.keys(counts).length === requiredKeys.length
			&& requiredKeys.every((key) => counts[key] === requirements[key]);
	};

	for (const [key, recipe] of Object.entries(RECIPES)) {
		if (key !== 'fruit_cider' && key !== 'house_red' && matches(recipe.req)) {
			return { key, name: recipe.name, desc: recipe.desc, flavour };
		}
	}
	if (loadedIds.length >= 2) {
		const berries = ['blackberry', 'raspberry', 'blueberry', 'strawberry', 'elderberry'];
		const key = ingredientKeys.every((ingredientKey) => berries.includes(ingredientKey)) ? 'fruit_cider' : 'house_red';
		return { key, name: RECIPES[key].name, desc: RECIPES[key].desc, flavour };
	}
	return { key: null, name: 'Incomplete Recipe', desc: 'Add more ingredients to form a valid recipe.', flavour };
}

export function predictBeerRecipe() {
	const loadedIngredients = globals.loadedKettleIngredients;
	if (loadedIngredients.length === 0) return { key: null, name: 'Empty Kettle', desc: 'Load ingredients to preview.' };
	const counts = {};
	for (const ingredient of loadedIngredients) counts[ingredient.key] = (counts[ingredient.key] || 0) + 1;
	for (const [key, recipe] of Object.entries(BEER_RECIPES)) {
		const requiredKeys = Object.keys(recipe.req);
		if (requiredKeys.length === Object.keys(counts).length
			&& requiredKeys.every((ingredientKey) => counts[ingredientKey] === recipe.req[ingredientKey])) {
			return { key, name: recipe.name, desc: recipe.desc };
		}
	}
	return { key: null, name: 'Mysterious Mash', desc: 'Add more grains or pantry additives to balance a valid recipe.' };
}

export function advanceKettlePhysicsStep(kettle, { random = Math.random } = {}) {
	const catcherWidth = 21;
	let bounceSound = false;
	kettle.catcherVel *= 0.92;
	kettle.catcherPos += kettle.catcherVel;
	if (kettle.catcherPos < 0) {
		kettle.catcherPos = 0;
		kettle.catcherVel = -kettle.catcherVel * 0.45;
		if (Math.abs(kettle.catcherVel) > 0.4) bounceSound = true;
	}
	if (kettle.catcherPos > 100 - catcherWidth) {
		kettle.catcherPos = 100 - catcherWidth;
		kettle.catcherVel = -kettle.catcherVel * 0.45;
		if (Math.abs(kettle.catcherVel) > 0.4) bounceSound = true;
	}
	if (random() < 0.8) kettle.targetVel += (random() - 0.5) * 0.45;
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
		const recipe = BEER_RECIPES[kettle.recipeKey] || { baseVal: 30 };
		const brewTimeSeconds = 7.5 + ((recipe.baseVal - 30) / 100) * 14.5;
		const increment = (33 / (brewTimeSeconds * 1000)) * 100;
		kettle.progress = Math.min(100, kettle.progress + increment);
	} else {
		kettle.progress = Math.max(0, kettle.progress - 0.25);
	}
	return { overlap, bounceSound, completed: kettle.progress >= 100 };
}

export function advanceGameTick(multiplier = 1, { random = Math.random, effects = {} } = {}) {
	const speedFactor = state.shop.oakBuffOwned ? 1.3 : 1.0;

	if (state.kettle.state === 'brewing' && !globals.kettlePhysicsInterval) effects.startKettlePhysics?.();

	let plotsChanged = false;
	state.plots.forEach((plot) => {
		if (plot.state === 'growing') {
			plot.timeRemaining--;
			plotsChanged = true;
			if (plot.timeRemaining <= 0) plot.state = 'ready';
		}
	});
	if (plotsChanged) {
		effects.renderPlots?.();
		effects.saveGameState?.();
	}

	let cellarChanged = false;
	state.barrels.forEach((barrel) => {
		if (barrel.state === 'fermenting') {
			barrel.fermentTime--;
			cellarChanged = true;
			if (random() < 0.2) effects.playSound?.('gurgle');
			if (barrel.fermentTime <= 0) {
				barrel.state = 'aging';
				barrel.ageProgress = 0;
				barrel.qualityMultiplier = 1.0;
				if (state.tutorial.active && state.tutorial.step === 13) effects.advanceTutorial?.(14);
				effects.showToast?.(`Fermentation completed inside Barrel 0${barrel.id + 1}!`);
			}
		} else if (barrel.state === 'aging') {
			const progressGain = Math.min(speedFactor, Math.max(0, 100 - barrel.ageProgress));
			const barrelTypeData = BARREL_TYPES[barrel.type];
			if (barrelTypeData?.flavourModifier && barrel.flavour) {
				const modifier = barrelTypeData.flavourModifier;
				for (const attribute of ['sw', 'ac', 'tn', 'bd']) {
					barrel.flavour[attribute] = Math.max(0, Math.min(100,
						barrel.flavour[attribute] + modifier[attribute] * progressGain));
				}
			}

			cellarChanged = true;
			if (barrel.ageProgress >= 78 && barrel.ageProgress < 100 && random() < 0.5) effects.playSound?.('tick');
			barrel.ageProgress = Math.min(100, barrel.ageProgress + progressGain);
		}
	});
	if (cellarChanged) effects.renderCellarUI?.();

	let racksChanged = false;
	state.wineRacks.forEach((bottle) => {
		if (!bottle) return;
		bottle.age++;
		racksChanged = true;
		const potentialRank = VINTAGE_RANKS.find((rank, index) => {
			const isNextOverBound = VINTAGE_RANKS[index + 1]
				? bottle.age >= VINTAGE_RANKS[index + 1].ageReq
				: false;
			return bottle.age >= rank.ageReq && !isNextOverBound;
		});
		if (!potentialRank) return;
		const newRankIndex = VINTAGE_RANKS.indexOf(potentialRank);
		if (newRankIndex !== bottle.rankIndex) {
			bottle.rankIndex = newRankIndex;
			effects.showToast?.(`A racked bottle has reached "${potentialRank.name}" maturation!`);
			effects.playSound?.('tick');
		}
	});
	if (racksChanged && globals.currentTab === 'racks') effects.renderRacks?.();
	state.market.tickCurrent--;

	let contractsChanged = false;
	state.contracts.forEach((contract) => {
		if (contract.status === 'available' && contract.timeRemaining > 0) {
			contract.timeRemaining -= multiplier;
			if (contract.timeRemaining <= 0) contractsChanged = true;
		}
	});
	if (contractsChanged) {
		state.contracts = state.contracts.filter((contract) => contract.timeRemaining > 0 || contract.status !== 'available');
	}
	if (contractsChanged && globals.currentTab === 'orders') effects.renderContractsBoard?.();

	effects.renderMarketTimer?.();
	if (state.market.tickCurrent <= 0) {
		state.market.tickCurrent = state.market.tickMax;
		effects.updateMarketPrices?.();
		effects.showToast?.('📈 Market prices have shifted!');
	}
}

export function updateMarketPrices({ random = Math.random } = {}) {
	for (const [key, recipe] of Object.entries(RECIPES)) {
		state.market.oversupply[key] *= 0.8;
		const penalty = Math.max(0.3, 1 - state.market.oversupply[key] * 0.05);
		const volatility = 1 + (random() * 0.4 - 0.2);
		const price = Math.max(1, Math.round((recipe.baseVal || 45) * volatility * penalty));
		state.market.current[key] = price;
		state.market.history[key].push(price);
		if (state.market.history[key].length > 10) state.market.history[key].shift();
	}

	for (const [key, recipe] of Object.entries(BEER_RECIPES)) {
		state.market.oversupply[key] *= 0.8;
		const penalty = Math.max(0.3, 1 - state.market.oversupply[key] * 0.05);
		const volatility = 1 + (random() * 0.3 - 0.15);
		const price = Math.max(1, Math.round((recipe.baseVal || 30) * volatility * penalty));
		state.market.current[key] = price;
		state.market.history[key].push(price);
		if (state.market.history[key].length > 10) state.market.history[key].shift();
	}
}