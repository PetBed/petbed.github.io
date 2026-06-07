// --- CORE GAME DATA ---
export const SHORT_NAMES = {
	pinot_noir: "Pinot",
	chardonnay: "Chard",
	cabernet: "Cabernet",
	muscat: "Muscat",
	hops: "Hops",
	barley: "Barley",
	blackberry: "Blackberry",
	raspberry: "Raspberry",
	blueberry: "Blueberry",
	strawberry: "Strawberry",
	elderberry: "Elderberry",
	wheat: "Wheat",
	rye: "Rye",
	pumpkin: "Pumpkin",
	wild_yeast: "Yeast",
	cacao_nibs: "Cacao",
	coffee_beans: "Coffee",
	pure_honey: "Honey",
	coriander_peel: "Coriander",
};

export const INGREDIENTS_DATA = {
	pinot_noir: {name: "Pinot Noir Grapes"},
	chardonnay: {name: "Chardonnay Grapes"},
	cabernet: {name: "Cabernet Grapes"},
	muscat: {name: "Muscat Grapes"},
	hops: {name: "Fresh Hops"},
	barley: {name: "Craft Barley"},
	blackberry: {name: "Wild Blackberry"},
	raspberry: {name: "Golden Raspberry"},
	blueberry: {name: "Forest Blueberry"},
	strawberry: {name: "Sweet Strawberry"},
	elderberry: {name: "Bitter Elderberry"},
	wheat: {name: "Malt Wheat"},
	rye: {name: "Spicy Rye"},
	pumpkin: {name: "Sugar Pumpkin"},
	wild_yeast: {name: "Wild Yeast"},
	cacao_nibs: {name: "Cacao Nibs"},
	coffee_beans: {name: "Coffee Beans"},
	pure_honey: {name: "Pure Honey"},
	coriander_peel: {name: "Coriander & Peel"},
};

export const SEEDS_DATA = {
	pinot_noir: {name: "Pinot Noir Grape Seeds", cost: 15, growTime: 6},
	chardonnay: {name: "Chardonnay Grape Seeds", cost: 20, growTime: 8},
	cabernet: {name: "Cabernet Grape Seeds", cost: 30, growTime: 12},
	muscat: {name: "Muscat Grape Seeds", cost: 45, growTime: 15},
	blackberry: {name: "Blackberry Seeds", cost: 12, growTime: 5},
	raspberry: {name: "Raspberry Seeds", cost: 18, growTime: 7},
	blueberry: {name: "Blueberry Seeds", cost: 25, growTime: 10},
	strawberry: {name: "Strawberry Seeds", cost: 35, growTime: 11},
	elderberry: {name: "Elderberry Seeds", cost: 50, growTime: 18},
	hops: {name: "Hops Seeds", cost: 15, growTime: 8},
	barley: {name: "Barley Seeds", cost: 10, growTime: 6},
	wheat: {name: "Wheat Seeds", cost: 8, growTime: 5},
	rye: {name: "Spicy Rye Seeds", cost: 14, growTime: 7},
	pumpkin: {name: "Pumpkin Seeds", cost: 22, growTime: 14},
};

export const PANTRY_DATA = {
	wild_yeast: {name: "Wild Yeast", cost: 15},
	cacao_nibs: {name: "Cacao Nibs", cost: 10},
	coffee_beans: {name: "Coffee Beans", cost: 12},
	pure_honey: {name: "Pure Honey", cost: 20},
	coriander_peel: {name: "Coriander & Peel", cost: 8},
};

export const RECIPES = {
	chardonnay: {name: "Chardonnay Dry White", baseVal: 45, req: {chardonnay: 2}, bg: "bg-yellow-50", desc: "A classic, crisp white wine with clean, buttery notes."},
	pinot_noir: {name: "Pinot Noir Light Red", baseVal: 50, req: {pinot_noir: 2}, bg: "bg-rose-50", desc: "An elegant, ruby-colored red wine with earthy cherry notes."},
	cabernet: {name: "Cabernet Bold Red", baseVal: 65, req: {cabernet: 2}, bg: "bg-purple-50", desc: "Deep, robust red wine bursting with dark fruit aromas."},
	muscat: {name: "Golden Muscat Dessert", baseVal: 85, req: {muscat: 2}, bg: "bg-amber-50", desc: "Luxuriously sweet and thick dessert wine."},
	summer_rose: {name: "Summer Rosé", baseVal: 60, req: {pinot_noir: 1, strawberry: 1}, bg: "bg-pink-50", desc: "A refreshing, light pink blush wine bursting with fresh sweetness."},
	blackberry_port: {name: "Midnight Blackberry Port", baseVal: 80, req: {cabernet: 1, blackberry: 2}, bg: "bg-indigo-50", desc: "A heavy, fortified dessert wine with complex, dark berry tannins."},
	royal_gold: {name: "Royal Gold Mead-Wine", baseVal: 95, req: {muscat: 1, raspberry: 1}, bg: "bg-yellow-100", desc: "A golden elixir combining floral raspberry with aromatic grape."},
	elder_blue: {name: "Elder-Blue Elixir", baseVal: 110, req: {elderberry: 2, blueberry: 1}, bg: "bg-blue-100", desc: "A rare, dark blue vintage that is highly tart and complex."},
	imperial_velvet: {name: "Imperial Velvet Blend", baseVal: 150, req: {cabernet: 1, blueberry: 1, elderberry: 1}, bg: "bg-purple-950 text-white", desc: "The ultimate reserve wine. Deep, ink-colored, and intensely flavored."},
	fruit_cider: {name: "Generic Fruit Cider", baseVal: 25, req: {}, bg: "bg-orange-50", desc: "A standard crisp and aromatic fruit cider."},
	house_red: {name: "House Red Blend", baseVal: 30, req: {}, bg: "bg-red-50", desc: "Simple, reliable house blend."},
};

export const BEER_RECIPES = {
	wheat_beer: {name: "Wheat Beer", baseVal: 30, req: {barley: 1, wheat: 1}, desc: "A classic, unfiltered German-style weissbier. Light and refreshing."},
	golden_ale: {name: "Golden Ale", baseVal: 40, req: {barley: 2, hops: 1}, desc: "Clear, smooth, and sessionable with a mild malty finish."},
	bitter_ipa: {name: "Bitter IPA", baseVal: 55, req: {barley: 1, hops: 2}, desc: "A hop-forward pale ale with high, crisp piney bitterness."},
	belgian_witbier: {name: "Belgian Witbier", baseVal: 65, req: {wheat: 1, hops: 1, coriander_peel: 1}, desc: "A refreshing white ale spiced with dried orange peel and coriander."},
	spiced_rye_ipa: {name: "Spiced Rye IPA", baseVal: 70, req: {rye: 1, hops: 2}, desc: "A bold IPA utilizing rye to balance intense hops with a dry, peppery snap."},
	wild_sour_ale: {name: "Wild Sour Ale", baseVal: 85, req: {wheat: 1, wild_yeast: 1, blueberry: 1}, desc: "A tart, refreshing wild ale conditioned with sweet forest blueberries."},
	pumpkin_spice_ale: {name: "Pumpkin Spice Ale", baseVal: 95, req: {wheat: 1, pumpkin: 1, pure_honey: 1}, desc: "A copper-colored autumn specialty bursting with sweet pumpkin and honey notes."},
	imperial_honey_braggot: {name: "Imperial Honey Braggot", baseVal: 110, req: {barley: 1, pure_honey: 2}, desc: "A heavy, historic cross-brew combining sweet ale malts and rich, fermented honey."},
	double_espresso_stout: {name: "Double Espresso Stout", baseVal: 130, req: {barley: 1, coffee_beans: 1, cacao_nibs: 1}, desc: "The ultimate craft brew. Jet-black, heavily roasted, and intensely rich with notes of espresso and dark cacao."},
};

export const TIERS = {
	s: {name: "★ S-Tier Reserve ★", mult: 2.5},
	a: {name: "A-Tier Premium", mult: 1.5},
	b: {name: "B-Tier Classic", mult: 1.0},
	c: {name: "C-Tier Table", mult: 0.6},
	vinegar: {name: "Vinegar Decay", mult: 0.15},
};

export const VINTAGE_RANKS = [
	{name: "Freshly Bottled", ageReq: 0, mult: 1.0, color: "text-stone-500 bg-stone-100 border-stone-200"},
	{name: "Fine Aged", ageReq: 15, mult: 1.5, color: "text-amber-700 bg-amber-50 border-amber-200"},
	{name: "Estate Reserve", ageReq: 40, mult: 2.2, color: "text-indigo-700 bg-indigo-50 border-indigo-200 animate-pulse"},
	{name: "Centennial Vintage", ageReq: 80, mult: 3.5, color: "text-purple-700 bg-purple-100 border-purple-300 font-extrabold animate-pulse"},
];
