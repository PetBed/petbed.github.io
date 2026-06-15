// --- CORE GAME STATE & GLOBALS ---
export const state = {
	gold: 150,
	dialogueDifficulty: 'beginner',
	currentWeather: "temperate",

	seeds: {
		pinot_noir: 2,
		chardonnay: 0,
		cabernet: 0,
		muscat: 0,
		hops: 2,
		barley: 2,
		wheat: 0,
		rye: 0,
		pumpkin: 0,
		blackberry: 1,
		raspberry: 0,
		blueberry: 0,
		strawberry: 0,
		elderberry: 0,
	},

	ingredients: [],

	wines: [],
	contracts: [],

	wineRacks: Array(9).fill(null),

	// Migrated to an array to support individual custom labels
	beers: [],

	plots: Array(9)
		.fill()
		.map((_, i) => ({
			id: i,
			state: i < 3 ? "empty" : "locked",
			cropType: null,
			timeRemaining: 0,
		})),

	barrels: [
		{
			id: 0,
			type: "french_oak", // Default barrel type
			state: "empty",
			crushProgress: 0,
			maxCrush: 5,
			fermentTime: 0,
			maxFerment: 5,
			ageProgress: 0,
			qualityMultiplier: 1.0,
			recipeKey: null,
			ingredients: [],
			pantryAdditiveId: null, // New: Stores the ID of the single pantry additive used
			baseWineFlavour: null, // New: Flavour before aging modifiers
			flavour: null, // New: Current flavour including aging modifiers
		},
	],

	kettleUnlocked: false,
	kettle: {
		recipeKey: null,
		state: "empty",
		progress: 0,
		catcherPos: 40,
		catcherVel: 0,
		targetPos: 50,
		targetVel: 0,
		timeLeft: 30,
		overheatSeconds: 0,
	},

	market: {
		tickCurrent: 30,
		tickMax: 30,
		history: {
			chardonnay: [45, 45, 44, 46],
			pinot_noir: [50, 49, 51, 50],
			cabernet: [65, 64, 66, 65],
			muscat: [85, 84, 86, 85],
			summer_rose: [60, 61, 59, 60],
			blackberry_port: [80, 79, 81, 80],
			royal_gold: [95, 96, 94, 95],
			elder_blue: [110, 109, 111, 110],
			imperial_velvet: [150, 149, 151, 150],
			fruit_cider: [25, 24, 26, 25],
			house_red: [30, 29, 31, 30],
			wheat_beer: [30, 29, 31, 30],
			golden_ale: [40, 39, 41, 40],
			bitter_ipa: [55, 54, 56, 55],
			belgian_witbier: [65, 64, 66, 65],
			spiced_rye_ipa: [70, 69, 71, 70],
			wild_sour_ale: [85, 84, 86, 85],
			pumpkin_spice_ale: [95, 94, 96, 95],
			imperial_honey_braggot: [110, 109, 111, 110],
			double_espresso_stout: [130, 129, 131, 130],
		},
		current: {
			chardonnay: 45,
			pinot_noir: 50,
			cabernet: 65,
			muscat: 85,
			summer_rose: 60,
			blackberry_port: 80,
			royal_gold: 95,
			elder_blue: 110,
			imperial_velvet: 150,
			fruit_cider: 25,
			house_red: 30,
			wheat_beer: 30,
			golden_ale: 40,
			bitter_ipa: 55,
			belgian_witbier: 65,
			spiced_rye_ipa: 70,
			wild_sour_ale: 85,
			pumpkin_spice_ale: 95,
			imperial_honey_braggot: 110,
			double_espresso_stout: 130,
		},
		oversupply: {
			chardonnay: 0,
			pinot_noir: 0,
			cabernet: 0,
			muscat: 0,
			summer_rose: 0,
			blackberry_port: 0,
			royal_gold: 0,
			elder_blue: 0,
			imperial_velvet: 0,
			fruit_cider: 0,
			house_red: 0,
			wheat_beer: 0,
			golden_ale: 0,
			bitter_ipa: 0,
			belgian_witbier: 0,
			spiced_rye_ipa: 0,
			wild_sour_ale: 0,
			pumpkin_spice_ale: 0,
			imperial_honey_braggot: 0,
			double_espresso_stout: 0,
		},
	},

	shop: {
		plotCost: 50,
		// Individual barrel costs are now defined in BARREL_TYPES and tracked in barrelsOwned
		// The old generic barrelCost is removed.
		kettleCost: 150,
		oakBuffCost: 250,
		oakBuffOwned: false,
		barrelsOwned: { // Initialize barrelsOwned here
			french_oak: 1, // Start with one French Oak
			american_oak: 0,
			chestnut_wood: 0,
			old_bourbon: 0,
		}
	},

	activeSelectorPlotId: null,
	activeRackSlotId: null,

	// Tutorial State
	tutorial: {
		active: false,
		step: 0,
	}
};

// Extracted global tracking variables required by multiple files
export const globals = {
	gameLoopInterval: null,
	isPaused: false,
	loadedPressIngredients: [],
  loadedPantryAdditiveId: null, // For the single pantry additive
	loadedKettleIngredients: [],
	activePressBarrelId: null,
	activeSellingWineKey: null,
	activeSellingBeerKey: null,
	currentReserveTab: "ingredients",
	currentShopTab: "seeds",
	currentTab: "vineyard",
	kettlePhysicsInterval: null,

	// Customization Labeler State
	labeling: {
		id: null,
		type: null,
		draft: {},
	},

	// Playtest Toggles
	showContractRanges: false,
};
