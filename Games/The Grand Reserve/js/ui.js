import {state, globals} from "./state.js";
import {SHORT_NAMES, INGREDIENTS_DATA, SEEDS_DATA, PANTRY_DATA, RECIPES, BEER_RECIPES, TIERS, VINTAGE_RANKS} from "./data.js";
import {getSeedIcon, getCropIcon, getWineIcon, getBeerIcon} from "./graphics.js";
import {toggleAudio} from "./audio.js";
import {handlePlotClick, getRecipePrediction, handleBarrelClick, handleBottleAction, getKettleRecipePrediction} from "./engine.js";

export function switchReserveTab(tabId) {
	globals.currentReserveTab = tabId;
	document.querySelectorAll('#tab-inventory [id^="res-tab-"]').forEach((btn) => {
		if (btn.id === `res-tab-${tabId}`) btn.className = "flex-1 py-1.5 text-xs font-black uppercase rounded-lg transition-all bg-white text-amber-950 shadow-sm";
		else btn.className = "flex-1 py-1.5 text-xs font-black uppercase rounded-lg transition-all text-amber-700/60";
	});
	document.getElementById("reserve-ingredients-content").className = tabId === "ingredients" ? "w-full flex flex-col gap-4" : "hidden";
	document.getElementById("reserve-wines-content").className = tabId === "wines" ? "w-full grid grid-cols-1 md:grid-cols-2 gap-3" : "hidden";
	document.getElementById("reserve-beers-content").className = tabId === "beers" ? "w-full grid grid-cols-1 md:grid-cols-2 gap-3" : "hidden";
	renderWarehouse();
}

export function switchShopTab(tabId) {
	globals.currentShopTab = tabId;
	document.querySelectorAll('#tab-shop [id^="shop-tab-"]').forEach((btn) => {
		if (btn.id === `shop-tab-${tabId}`) btn.className = "flex-1 py-1.5 text-xs font-black uppercase rounded-lg transition-all bg-white text-amber-950 shadow-sm";
		else btn.className = "flex-1 py-1.5 text-xs font-black uppercase rounded-lg transition-all text-amber-700/60";
	});
	document.getElementById("shop-seeds-content").className = tabId === "seeds" ? "w-full grid grid-cols-1 md:grid-cols-2 gap-3" : "hidden";
	document.getElementById("shop-pantry-content").className = tabId === "pantry" ? "w-full grid grid-cols-1 md:grid-cols-2 gap-3" : "hidden";
	document.getElementById("shop-upgrades-content").className = tabId === "upgrades" ? "w-full grid grid-cols-1 md:grid-cols-2 gap-3" : "hidden";
	renderShop();
}

export function updateHeaderUI() {
	const goldEl = document.getElementById("ui-gold");
	if (goldEl) goldEl.textContent = state.gold;
	let totalStored = state.wines.length + state.beers.length;
	state.wineRacks.forEach((slot) => {
		if (slot) totalStored++;
	});
	const dot = document.getElementById("ui-reserve-dot");
	if (dot) {
		if (totalStored > 0) dot.classList.remove("hidden");
		else dot.classList.add("hidden");
	}
}

export function renderPlots() {
	const grid = document.getElementById("plot-grid");
	if (!grid) return;
	grid.innerHTML = "";
	state.plots.forEach((plot) => {
		const btn = document.createElement("button");
		btn.id = `plot-btn-${plot.id}`;
		btn.className = "relative w-full aspect-square rounded-2xl border-4 shadow-md transition-all duration-200 flex flex-col items-center justify-center gap-1 ";
		if (plot.state === "locked") {
			btn.className += "bg-amber-900/10 border-amber-900/20 cursor-not-allowed opacity-60";
			btn.innerHTML = `<i data-lucide="lock" class="w-6 h-6 text-amber-950/40"></i><span class="text-[10px] font-black text-amber-950/40 tracking-wider">LOCKED</span>`;
		} else if (plot.state === "empty") {
			if (state.activeSelectorPlotId === plot.id) {
				btn.className += "bg-amber-950/95 border-amber-950 cursor-default";
				const ownedSeeds = Object.keys(state.seeds).filter((key) => state.seeds[key] > 0);
				if (ownedSeeds.length === 0) {
					btn.innerHTML = `<div class="absolute inset-1 bg-amber-950/95 rounded-xl z-20 flex flex-col justify-center items-center p-1"><span class="text-[8px] font-black tracking-widest text-red-400 uppercase text-center mb-1">NO SEEDS</span><button onclick="event.stopPropagation(); closePlotSelector()" class="w-full text-[8px] bg-stone-700 text-white font-extrabold rounded py-1 hover:bg-stone-600">Close</button></div>`;
				} else {
					btn.innerHTML = `<div class="absolute inset-1 bg-amber-950/95 rounded-xl z-20 flex flex-col justify-start p-1 overflow-y-auto"><span class="text-[8px] font-black tracking-widest text-yellow-500 uppercase text-center mb-1">SELECT SEED</span>${ownedSeeds.map((key) => `<button onclick="event.stopPropagation(); plantSeed(${plot.id}, '${key}')" class="w-full text-[8px] bg-amber-900 text-white font-extrabold rounded py-1 mb-1 hover:bg-rose-800 transition-colors flex items-center justify-start gap-1 px-1.5 truncate"><div class="w-4 h-4 shrink-0">${getSeedIcon(key)}</div><span class="truncate">${SHORT_NAMES[key]} (${state.seeds[key]})</span></button>`).join("")}<button onclick="event.stopPropagation(); closePlotSelector()" class="w-full text-[8px] bg-stone-700 text-white font-extrabold rounded py-1 hover:bg-stone-600 mt-auto">Cancel</button></div>`;
				}
			} else {
				btn.className += "bg-[#a67c52] border-[#593d1f] hover:bg-[#b58c62] cursor-pointer";
				btn.innerHTML = `<i data-lucide="sprout" class="w-8 h-8 text-[#593d1f]/40"></i><span class="text-[10px] font-black text-[#593d1f]/60 tracking-wider">PLANT</span>`;
				btn.onclick = () => handlePlotClick(plot.id);
			}
		} else if (plot.state === "growing") {
			btn.className += "bg-[#b0c95d] border-[#6b821f] cursor-not-allowed";
			btn.innerHTML = `<div class="w-10 h-10 animate-bounce">${getCropIcon(plot.cropType)}</div><span class="text-[8px] font-black text-emerald-950 bg-white/50 px-1.5 py-0.5 rounded-full leading-none">${plot.timeRemaining}s</span>`;
		} else if (plot.state === "ready") {
			btn.className += "bg-emerald-600 border-emerald-800 hover:scale-105 hover:bg-emerald-500 cursor-pointer";
			btn.innerHTML = `<div class="w-12 h-12 animate-bounce">${getCropIcon(plot.cropType)}</div><span class="text-[8px] font-black text-white bg-black/30 px-1.5 py-0.5 rounded-full uppercase tracking-wider leading-none mt-1">HARVEST</span>`;
			btn.onclick = () => handlePlotClick(plot.id);
		}
		grid.appendChild(btn);
	});
	if (window.lucide) window.lucide.createIcons();
}

export function closePlotSelector() {
	state.activeSelectorPlotId = null;
	renderPlots();
}

export function openPressModal(barrelId) {
	const barrel = state.barrels.find((b) => b.id === barrelId);
	if (!barrel || barrel.state !== "empty") return;
	globals.activePressBarrelId = barrelId;
	globals.loadedPressIngredients = [];
	document.getElementById("press-modal").classList.remove("hidden");
	renderPressModal();
}

export function closePressModal() {
	globals.loadedPressIngredients.forEach((ing) => {
		state.ingredients[ing]++;
	});
	globals.loadedPressIngredients = [];
	globals.activePressBarrelId = null;
	document.getElementById("press-modal").classList.add("hidden");
	updateHeaderUI();
	renderWarehouse();
}

export function renderPressModal() {
	for (let i = 0; i < 3; i++) {
		const slot = document.getElementById(`press-slot-${i}`);
		if (i < globals.loadedPressIngredients.length) {
			const ingKey = globals.loadedPressIngredients[i];
			slot.className = "w-14 h-14 bg-white rounded-xl border-2 border-amber-950 flex flex-col items-center justify-center text-xs font-extrabold cursor-pointer hover:border-red-500 transition-all p-1";
			slot.innerHTML = `<div class="w-8 h-8">${getCropIcon(ingKey)}</div><span class="text-[8px] text-amber-900 leading-none mt-1 truncate max-w-full px-1">${SHORT_NAMES[ingKey] || ingKey}</span>`;
		} else {
			slot.className = "w-14 h-14 bg-white rounded-xl border-2 border-dashed border-stone-300 flex items-center justify-center text-xs font-extrabold cursor-pointer hover:text-stone-500 transition-all";
			slot.innerHTML = "+";
		}
	}

	const pred = getRecipePrediction();
	document.getElementById("press-prediction-name").textContent = pred.name;
	document.getElementById("press-prediction-desc").textContent = pred.desc;

	const confirmBtn = document.getElementById("press-confirm-btn");
	if (pred.key && globals.loadedPressIngredients.length >= 2) {
		confirmBtn.disabled = false;
		confirmBtn.className = "w-full py-3 bg-rose-800 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-lg transition-all text-xs uppercase tracking-wide cursor-pointer active:scale-95";
		confirmBtn.onclick = () => {
			if (globals.activePressBarrelId === null) return;
			const barrel = state.barrels.find((b) => b.id === globals.activePressBarrelId);
			if (barrel) {
				barrel.state = "crushing";
				barrel.crushProgress = 0;
				barrel.recipeKey = pred.key;
				globals.loadedPressIngredients = [];
				globals.activePressBarrelId = null;
				document.getElementById("press-modal").classList.add("hidden");
				if (window.playSound) window.playSound("pop");
				showToast(`Ingredients loaded! Tap barrel to start squishing.`);
				renderCellarUI();
				updateHeaderUI();
				renderWarehouse();
			}
		};
	} else {
		confirmBtn.disabled = true;
		confirmBtn.className = "w-full py-3 bg-stone-100 text-stone-400 font-extrabold rounded-xl text-xs uppercase tracking-wide cursor-not-allowed";
		confirmBtn.onclick = null;
	}

	const invList = document.getElementById("press-inventory-list");
	invList.innerHTML = "";
	let hasIngredients = false;
	const wineIngredients = ["pinot_noir", "chardonnay", "cabernet", "muscat", "blackberry", "raspberry", "blueberry", "strawberry", "elderberry"];
	wineIngredients.forEach((key) => {
		const count = state.ingredients[key] || 0;
		if (count > 0) {
			hasIngredients = true;
			const ingData = INGREDIENTS_DATA[key];
			const item = document.createElement("button");
			item.className = "w-full flex items-center justify-between p-2 bg-amber-50 hover:bg-amber-100 border border-amber-950/10 rounded-lg text-xs font-bold transition-all text-left";
			item.onclick = () => window.addToPress(key);
			item.innerHTML = `<span class="flex items-center gap-1.5 font-black text-amber-950"><span class="w-6 h-6 inline-block shrink-0">${getCropIcon(key)}</span>${ingData.name}</span><span class="bg-amber-950/10 px-2 py-0.5 rounded text-[10px] font-black">Stock: ${count}</span>`;
			invList.appendChild(item);
		}
	});
	if (!hasIngredients) invList.innerHTML = `<div class="py-4 text-center text-[10px] text-stone-400 font-bold">No harvested stock available.</div>`;
}

export function renderCellarUI() {
	const container = document.getElementById("barrels-container");
	if (!container) return;
	container.innerHTML = "";

	state.barrels.forEach((barrel, index) => {
		const wrapper = document.createElement("div");
		wrapper.className = "w-full flex flex-col items-center bg-amber-950/5 p-4 rounded-2xl border border-amber-950/10 shadow-inner relative";

		let bBtnClasses = "relative w-36 h-44 rounded-t-[2.5rem] rounded-b-xl border-4 shadow-lg flex flex-col items-center justify-center transition-all duration-150 z-10 ";
		let contentHTML = "";
		let instructions = "";
		let isUrgent = false;

		if (barrel.state === "empty") {
			bBtnClasses += "border-amber-950 bg-[#c48d53] cursor-pointer hover:scale-105";
			contentHTML = `<i data-lucide="plus-circle" class="w-10 h-10 text-amber-950/40 mb-1"></i><span class="text-[10px] font-black text-amber-950/60 uppercase">Press ingredients</span>`;
			const ingredientCount = Object.values(state.ingredients).reduce((a, b) => a + b, 0);
			instructions = ingredientCount >= 2 ? "Ready to load ingredients." : "Needs harvested ingredients.";
		} else if (barrel.state === "crushing") {
			bBtnClasses += "border-amber-950 bg-[#a66f38] cursor-pointer";
			contentHTML = `<i data-lucide="pocket" class="w-10 h-10 text-purple-900 animate-bounce mb-1"></i><span class="text-[10px] font-black text-purple-950 uppercase">Tap squish</span>`;
			instructions = `Squishing! (${barrel.crushProgress}/${barrel.maxCrush})`;
		} else if (barrel.state === "fermenting") {
			bBtnClasses += "border-amber-950 bg-[#8a4e1a] cursor-not-allowed opacity-90";
			contentHTML = `<i data-lucide="loader-2" class="w-10 h-10 text-amber-300 animate-spin mb-1"></i><span class="text-[10px] font-black text-amber-200 uppercase">Fermenting</span>`;
			instructions = `Fermenting (${barrel.fermentTime}s)`;
		} else if (barrel.state === "aging") {
			bBtnClasses += "border-amber-950 bg-[#6b2c21]";
			contentHTML = `<div class="w-14 h-14 animate-pulse">${getWineIcon(barrel.recipeKey, "s")}</div><span class="text-[9px] font-black text-purple-300 uppercase mt-1">Aging</span>`;
			instructions = `Aging safely into: ${RECIPES[barrel.recipeKey].name}`;
		}

		wrapper.innerHTML = `
                <div class="flex w-full items-center justify-between mb-3 px-1">
                    <span class="text-xs font-black text-amber-950 bg-white/50 px-2 py-0.5 rounded-md border border-amber-900/10">Barrel 0${index + 1}</span>
                    <span class="text-[10px] font-bold text-amber-800/80 bg-white/50 px-2 py-0.5 rounded-md border border-amber-900/10">${instructions}</span>
                </div>
                <button id="barrel-btn-${barrel.id}" class="${bBtnClasses}" ${barrel.state === "fermenting" || barrel.state === "aging" ? "disabled" : ""}>
                    <div class="absolute top-4 w-full h-3 border-y border-amber-950/20 bg-amber-950/40 pointer-events-none"></div>
                    <div class="absolute bottom-6 w-full h-3 border-y border-amber-950/20 bg-amber-950/40 pointer-events-none"></div>
                    <div class="z-10 flex flex-col items-center justify-center pointer-events-none">${contentHTML}</div>
                </button>
                ${barrel.state === "aging" ? generateAgingBarHTML(barrel) : ""}
            `;
		container.appendChild(wrapper);

		const btn = document.getElementById(`barrel-btn-${barrel.id}`);
		if (barrel.state === "empty" || barrel.state === "crushing") btn.onclick = () => handleBarrelClick(barrel.id);
		if (barrel.state === "aging") {
			document.getElementById(`bottle-now-btn-${barrel.id}`).onclick = () => handleBottleAction(barrel.id);
			if (barrel.ageProgress >= 100) {
				const vinegarBtn = document.getElementById(`vinegar-btn-${barrel.id}`);
				if (vinegarBtn) vinegarBtn.onclick = () => window.bottleAsVinegar(barrel.id);
			}
		}
	});
	if (window.lucide) window.lucide.createIcons();
}

export function generateAgingBarHTML(barrel) {
	const progress = barrel.ageProgress;
	let barGlow = progress >= 80 ? "sweet-spot-glow" : "";

	let tierText = "";
	let tierVal = 0;
	const liveBaseVal = state.market.current[barrel.recipeKey];
	if (progress < 30) {
		tierText = "C-Tier Table";
		tierVal = Math.round(liveBaseVal * TIERS.c.mult);
	} else if (progress < 60) {
		tierText = "B-Tier Classic";
		tierVal = Math.round(liveBaseVal * TIERS.b.mult);
	} else if (progress < 80) {
		tierText = "A-Tier Premium";
		tierVal = Math.round(liveBaseVal * TIERS.a.mult);
	} else {
		tierText = "★ S-Tier Reserve ★";
		tierVal = Math.round(liveBaseVal * TIERS.s.mult);
	}

	return `
            <div class="w-full mt-4 flex-col bg-white p-3 rounded-xl border border-amber-900/10 shadow-sm ${barGlow}">
                <div class="relative h-4 w-full rounded-full bg-gray-200 overflow-hidden flex border border-gray-300">
                    <div class="h-full bg-stone-400" style="width: 30%"></div><div class="h-full bg-orange-300" style="width: 30%"></div>
                    <div class="h-full bg-yellow-400" style="width: 20%"></div><div class="h-full bg-purple-500" style="width: 20%"></div>
                    <div class="absolute top-0 bottom-0 w-2.5 bg-red-600 border border-white shadow-md transition-all duration-100" style="left: ${progress}%;"></div>
                </div>
                <div class="flex justify-between items-center mt-3">
                    <div class="text-[10px] font-semibold text-amber-900/80 uppercase">Est: <span class="font-extrabold text-amber-950">${tierText} ($${tierVal})</span></div>
                    <div class="flex items-center gap-2">
                        ${progress >= 100 ? `<button id="vinegar-btn-${barrel.id}" class="px-3 py-1.5 bg-yellow-800 text-white font-extrabold text-[10px] rounded-lg shadow hover:bg-yellow-700 transition-all flex items-center gap-1"><i data-lucide="flask-conical" class="w-3 h-3"></i> VINEGAR</button>` : ""}
                        <button id="bottle-now-btn-${barrel.id}" class="px-3 py-1.5 bg-rose-700 text-white font-extrabold text-[10px] rounded-lg shadow hover:bg-rose-600 transition-all flex items-center gap-1"><i data-lucide="wine" class="w-3 h-3"></i> BOTTLE</button>
                    </div>
                </div>
            </div>
        `;
}

export function showRackTooltip(e, slotId) {
	const bottle = state.wineRacks[slotId];
	if (!bottle) return;
	const tooltip = document.getElementById("rack-tooltip");
	const title = bottle.customLabel ? bottle.customLabel.title : RECIPES[bottle.recipeKey].name;
	const vintageRankName = VINTAGE_RANKS[bottle.rankIndex].name;

	document.getElementById("tooltip-title").textContent = title;
	document.getElementById("tooltip-age").textContent = `${vintageRankName} (${bottle.age} Years Old)`;

	tooltip.classList.remove("hidden");
	tooltip.style.left = e.pageX + 15 + "px";
	tooltip.style.top = e.pageY + 15 + "px";
}

export function hideRackTooltip() {
	document.getElementById("rack-tooltip").classList.add("hidden");
}

export function renderRacks() {
	const grid = document.getElementById("rack-grid");
	if (!grid) return;
	grid.innerHTML = "";

	state.wineRacks.forEach((bottle, slotId) => {
		const cell = document.createElement("div");
		cell.className = "relative w-full h-28 bg-[#a67c52] border-t-8 border-b-4 border-t-[#c48d53] border-b-[#593d1f] flex items-center justify-center p-2 transition-all duration-350";

		if (bottle === null) {
			cell.className += " cursor-pointer group hover:bg-[#b58c62]";
			cell.innerHTML = `
                    <div class="text-center text-[#593d1f]/70 group-hover:text-[#442d17] transition-colors">
                        <svg viewBox="0 0 64 64" class="w-12 h-12 mx-auto opacity-60">
                            <path d="M12,40 Q32,28 52,40" stroke="currentColor" stroke-width="7" fill="none" stroke-linecap="round"/>
                        </svg>
                        <span class="text-[9px] font-black uppercase tracking-wider">Empty Slot</span>
                    </div>
                `;
			cell.onclick = () => openRackSelectModal(slotId);
			cell.onmouseenter = null;
			cell.onmouseleave = null;
		} else {
			const recipe = RECIPES[bottle.recipeKey];
			const rank = VINTAGE_RANKS[bottle.rankIndex];
			let bottleSizeClass = "h-16 w-16";
			if (bottle.rankIndex === 1) bottleSizeClass = "h-18 w-18";
			else if (bottle.rankIndex === 2) bottleSizeClass = "h-20 w-20 shadow-lg animate-pulse";
			else if (bottle.rankIndex === 3) bottleSizeClass = "h-22 w-22 shadow-2xl animate-pulse font-bold";

			const displayTitle = bottle.customLabel ? bottle.customLabel.title : recipe.name;

			cell.className += " cursor-pointer group";
			cell.innerHTML = `
                    <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
                        <div class="text-center text-white"><i data-lucide="trash-2" class="w-8 h-8 mx-auto"></i><span class="text-xs font-bold">Remove</span></div>
                    </div>
                    <div class="${bottleSizeClass} -rotate-90 transition-transform duration-300 group-hover:scale-95 z-10">${getWineIcon(bottle.recipeKey, bottle.qualityKey, bottle.customLabel)}</div>
                    <div class="absolute bottom-1.5 text-center w-full px-2 z-0"><span class="text-[8px] font-black text-white/90 bg-black/40 px-2 py-0.5 rounded-md leading-tight truncate inline-block max-w-full">${displayTitle}</span></div>
                `;
			cell.onclick = () => window.removeWineFromRack(slotId);

			cell.onmouseenter = (e) => showRackTooltip(e, slotId);
			cell.onmousemove = (e) => { const tooltip = document.getElementById("rack-tooltip"); tooltip.style.left = e.pageX + 15 + "px"; tooltip.style.top = e.pageY + 15 + "px"; };
			cell.onmouseleave = hideRackTooltip;
		}
		grid.appendChild(cell);
	});
	if (window.lucide) window.lucide.createIcons();
}

export function openRackSelectModal(slotId) {
	state.activeRackSlotId = slotId;
	const modal = document.getElementById("rack-select-modal");
	const list = document.getElementById("rack-select-list");
	list.innerHTML = "";

	if (state.wines.length === 0) {
		list.innerHTML = `<div class="py-6 text-center text-[10px] text-stone-400 font-bold">No bottled reserve stock available in your inventory.</div>`;
	} else {
		state.wines.forEach((bottle) => {
			const recipe = RECIPES[bottle.recipeKey];
			const rank = VINTAGE_RANKS[bottle.rankIndex];
			const title = bottle.customLabel ? bottle.customLabel.title : recipe.name;
			const item = document.createElement("button");
			item.className = "w-full flex items-center justify-between p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-950/10 rounded-lg text-xs font-bold text-left transition-colors";
			item.onclick = () => window.placeWineOnRack(bottle.id);
			item.innerHTML = `<div class="flex items-center gap-3"><div class="w-10 h-10 shrink-0">${getWineIcon(bottle.recipeKey, bottle.qualityKey, bottle.customLabel)}</div><div><h4 class="font-black text-amber-950 text-xs">${title}</h4><div class="flex items-center gap-1.5 mt-0.5 text-[8px] text-stone-500 leading-none"><span class="uppercase tracking-wider font-extrabold bg-stone-200 px-1 py-0.5 rounded">${TIERS[bottle.qualityKey].name}</span><span class="px-1 py-0.5 rounded ${rank.color}">${rank.name} (${bottle.age}y)</span></div></div></div><i data-lucide="arrow-right-circle" class="w-5 h-5 text-amber-700/60"></i>`;
			list.appendChild(item);
		});
	}
	modal.classList.remove("hidden");
	if (window.lucide) window.lucide.createIcons();
}

export function closeRackSelectModal() {
	state.activeRackSlotId = null;
	document.getElementById("rack-select-modal").classList.add("hidden");
}

export function renderBreweryUI() {
	const lockedPanel = document.getElementById("brewery-locked-panel");
	const activePanel = document.getElementById("brewery-active-panel");

	if (!state.kettleUnlocked) {
		lockedPanel.classList.remove("hidden");
		activePanel.classList.add("hidden");
		return;
	}
	lockedPanel.classList.add("hidden");
	activePanel.className = "w-full flex flex-col gap-4";

	const kettle = state.kettle;
	let innerHTML = "";

	if (kettle.state === "empty") {
		innerHTML = `
        <div class="bg-amber-950/5 p-6 rounded-2xl border border-amber-950/10 w-full shadow-inner flex flex-col items-center text-center">
            <div onclick="openKettleModal()" class="w-40 h-40 cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 relative">
                <svg viewBox="0 0 64 64" class="w-full h-full drop-shadow-xl">
                    <path d="M16,52 L48,52 L44,56 L20,56 Z" fill="#4A2F13" />
                    <path d="M12,28 C12,18 20,14 32,14 C44,14 52,18 52,28 L52,44 C52,50 44,52 32,52 C20,52 12,50 12,44 Z" fill="#cd7f32" stroke="#8c4f1c" stroke-width="2" />
                    <path d="M16,28 C16,22 22,18 32,18" fill="none" stroke="#f0a76e" stroke-width="2.5" opacity="0.6" stroke-linecap="round" />
                    <path d="M22,14 Q32,4 42,14" fill="#a0522d" stroke="#8c4f1c" stroke-width="2" />
                    <circle cx="32" cy="5" r="3.5" fill="#ffd700" stroke="#8c4f1c" stroke-width="1.5" />
                    <circle cx="32" cy="35" r="9" fill="#ffffff" stroke="#8c4f1c" stroke-width="2" />
                    <line x1="32" y1="35" x2="36" y2="31" stroke="#ff0000" stroke-width="2" stroke-linecap="round" />
                    <path d="M46,38 L54,38 L54,46 L50,46" fill="none" stroke="#a0522d" stroke-width="3.5" stroke-linecap="round" />
                </svg>
                <span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-4 w-4">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
                </span>
            </div>
            <h3 class="text-lg font-black text-amber-950 mt-4 uppercase">The Copper Kettle</h3>
            <p class="text-xs text-amber-800/80 mt-1 max-w-sm">Click the kettle to open the ingredient press. Load grains, adjuncts, and pantry additives to discover legendary recipes!</p>
            <button onclick="openKettleModal()" class="mt-4 px-6 py-2.5 bg-[#cd7f32] hover:bg-[#b56f2b] text-white font-extrabold text-xs uppercase tracking-wide rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all">Open Kettle Press</button>
        </div>`;
	} else if (kettle.state === "brewing") {
		innerHTML = `
        <div class="bg-[#cd7f32]/10 p-5 rounded-2xl border-4 border-[#cd7f32] w-full flex flex-col items-center shadow-lg relative">
            <div class="w-16 h-16 animate-bounce">${getBeerIcon(kettle.recipeKey)}</div>
            <span class="text-xs font-black uppercase text-amber-900 tracking-wider mt-2">Brewing: ${BEER_RECIPES[kettle.recipeKey].name}</span>
            <div class="w-full bg-white p-3.5 rounded-xl border border-amber-950/10 shadow-sm mt-3 flex flex-col items-center">
                <span class="text-[9px] font-black tracking-widest text-amber-900/60 uppercase">Kettle Stabilization</span>
                <div id="kettle-feedback" class="px-2.5 py-0.5 text-[9px] font-extrabold rounded-full border mt-1.5 text-amber-700 bg-amber-50 border-amber-200">Adjust Temperature!</div>
                <div class="relative w-full h-11 bg-amber-950/15 rounded-xl mt-4 border border-amber-950/20 overflow-hidden shadow-inner">
                    <div id="kettle-catcher" class="absolute top-0.5 bottom-0.5 bg-emerald-500/40 border-2 border-emerald-600 rounded-lg shadow-md transition-all duration-75" style="left: ${kettle.catcherPos}%; width: 21%;"></div>
                    <div id="kettle-target" class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center transition-all duration-75" style="left: ${kettle.targetPos}%;">
                        <svg viewBox="0 0 64 64" class="w-8 h-8 animate-bounce"><circle cx="32" cy="32" r="14" fill="#60a5fa" opacity="0.3" stroke="#2563eb" stroke-width="2"/><circle cx="28" cy="28" r="6" fill="#93c5fd" opacity="0.6"/><circle cx="34" cy="34" r="3" fill="#ffffff" opacity="0.8"/><path d="M32,10 C36,15 36,18 32,22" fill="none" stroke="#60a5fa" stroke-width="2" opacity="0.7" stroke-linecap="round"/><path d="M40,14 C43,18 43,21 40,24" fill="none" stroke="#60a5fa" stroke-width="1.5" opacity="0.5" stroke-linecap="round"/></svg>
                    </div>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-3 w-full mt-3">
                <button onclick="adjustKettleHeat(2.16)" class="py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1"><i data-lucide="flame" class="w-3.5 h-3.5"></i> Stoke Fire (→)</button>
                <button onclick="adjustKettleHeat(-2.16)" class="py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1"><i data-lucide="wind" class="w-3.5 h-3.5"></i> Vent Steam (←)</button>
            </div>
            <div class="w-full bg-white p-3.5 rounded-xl border border-amber-950/10 shadow-sm mt-3">
                <div class="flex justify-between items-center text-[10px] font-black text-amber-950/60 uppercase mb-1.5 px-1">
                    <span>Stabilization Progress</span>
                </div>
                <div class="w-full bg-amber-900/10 rounded-full h-3 overflow-hidden shadow-inner">
                    <div id="kettle-progress-bar" class="bg-amber-500 h-full rounded-full transition-all duration-75" style="width: ${kettle.progress}%"></div>
                </div>
            </div>
        </div>`;
	} else if (kettle.state === "success" || kettle.state === "failed") {
		const success = kettle.state === "success";
		innerHTML = `
        <div class="bg-amber-950/5 p-6 rounded-2xl border-2 border-dashed border-amber-950/30 w-full flex flex-col items-center text-center animate-fade-in">
            <i data-lucide="${success ? "check-circle" : "x-circle"}" class="w-12 h-12 ${success ? "text-green-600" : "text-red-600"} mb-2"></i>
            <h3 class="text-md font-black text-amber-950">${success ? "Brew Complete!" : "Brewing Failed"}</h3>
            <p class="text-xs text-amber-800/80 mt-1 max-w-[200px] leading-tight">${success ? "Excellent thermal balance! Batch complete." : "The mash charred or grew too cold, halting fermentation."}</p>
            <button onclick="clearFinishedKettle()" class="mt-4 px-4 py-2 bg-amber-950 text-white text-xs font-black uppercase rounded-lg shadow hover:bg-amber-900 active:scale-95 transition-all">Finish Batch & Clean</button>
        </div>`;
	}
	activePanel.innerHTML = innerHTML;
	if (window.lucide) window.lucide.createIcons();
}

export function openKettleModal() {
	if (!state.kettleUnlocked) return;
	globals.loadedKettleIngredients = [];
	document.getElementById("kettle-modal").classList.remove("hidden");
	renderKettleModal();
}

export function closeKettleModal() {
	globals.loadedKettleIngredients.forEach((ing) => {
		state.ingredients[ing]++;
	});
	globals.loadedKettleIngredients = [];
	document.getElementById("kettle-modal").classList.add("hidden");
	updateHeaderUI();
	renderWarehouse();
}

export function renderKettleModal() {
	for (let i = 0; i < 3; i++) {
		const slot = document.getElementById(`kettle-slot-${i}`);
		if (i < globals.loadedKettleIngredients.length) {
			const ingKey = globals.loadedKettleIngredients[i];
			slot.className = "w-14 h-14 bg-white rounded-xl border-2 border-amber-950 flex flex-col items-center justify-center text-xs font-extrabold cursor-pointer hover:border-red-500 transition-all p-1";
			slot.innerHTML = `<div class="w-8 h-8">${getCropIcon(ingKey)}</div><span class="text-[8px] text-amber-900 leading-none mt-1 truncate max-w-full px-1">${SHORT_NAMES[ingKey] || ingKey}</span>`;
		} else {
			slot.className = "w-14 h-14 bg-white rounded-xl border-2 border-dashed border-stone-300 flex items-center justify-center text-xs font-extrabold cursor-pointer hover:text-stone-500 transition-all";
			slot.innerHTML = "+";
		}
	}

	const pred = getKettleRecipePrediction();
	document.getElementById("kettle-prediction-name").textContent = pred.name;
	document.getElementById("kettle-prediction-desc").textContent = pred.desc;

	const confirmBtn = document.getElementById("kettle-confirm-btn");
	if (pred.key && globals.loadedKettleIngredients.length >= 2) {
		confirmBtn.disabled = false;
		confirmBtn.className = "w-full py-3 bg-amber-700 hover:bg-amber-600 text-white font-extrabold rounded-xl shadow-lg transition-all text-xs uppercase tracking-wide cursor-pointer active:scale-95";
		confirmBtn.onclick = () => {
			state.kettle.recipeKey = pred.key;
			state.kettle.state = "brewing";
			state.kettle.progress = 0;
			state.kettle.catcherPos = 40;
			state.kettle.catcherVel = 0;
			state.kettle.targetPos = 50;
			state.kettle.targetVel = 0.5;
			state.kettle.timeLeft = 30;
			state.kettle.overheatSeconds = 0;
			globals.loadedKettleIngredients = [];
			document.getElementById("kettle-modal").classList.add("hidden");
			if (window.playSound) window.playSound("pop");
			showToast(`Kettle Loaded! Keep the green bar on the bubble!`);
			renderBreweryUI();
			updateHeaderUI();
			renderWarehouse();
			if (window.startKettlePhysics) window.startKettlePhysics();
		};
	} else {
		confirmBtn.disabled = true;
		confirmBtn.className = "w-full py-3 bg-stone-100 text-stone-400 font-extrabold rounded-xl text-xs uppercase tracking-wide cursor-not-allowed";
		confirmBtn.onclick = null;
	}

	const invList = document.getElementById("kettle-inventory-list");
	invList.innerHTML = "";
	let hasIngredients = false;
	const brewIngredients = ["barley", "hops", "wheat", "rye", "pumpkin", "blueberry", "wild_yeast", "cacao_nibs", "coffee_beans", "pure_honey", "coriander_peel"];
	brewIngredients.forEach((key) => {
		const count = state.ingredients[key] || 0;
		if (count > 0) {
			hasIngredients = true;
			const ingData = INGREDIENTS_DATA[key];
			const item = document.createElement("button");
			item.className = "w-full flex items-center justify-between p-2 bg-amber-50 hover:bg-amber-100 border border-amber-950/10 rounded-lg text-xs font-bold transition-all text-left";
			item.onclick = () => window.addToKettle(key);
			item.innerHTML = `<span class="flex items-center gap-1.5 font-black text-amber-950"><span class="w-6 h-6 inline-block shrink-0">${getCropIcon(key)}</span>${ingData.name}</span><span class="bg-amber-950/10 px-2 py-0.5 rounded text-[10px] font-black">Stock: ${count}</span>`;
			invList.appendChild(item);
		}
	});
	if (!hasIngredients) invList.innerHTML = `<div class="py-4 text-center text-[10px] text-stone-400 font-bold">No grains, berries, or pantry stock available.</div>`;
}

export function renderWarehouse() {
	if (globals.currentReserveTab === "ingredients") {
		const list = document.getElementById("reserve-ingredients-content");
		if (!list) return;
		list.innerHTML = "";

		const agriculturalKeys = ["pinot_noir", "chardonnay", "cabernet", "muscat", "blackberry", "raspberry", "blueberry", "strawberry", "elderberry", "hops", "barley", "wheat", "rye", "pumpkin"];
		const pantryKeys = ["wild_yeast", "cacao_nibs", "coffee_beans", "pure_honey", "coriander_peel"];

		const agContainer = document.createElement("div");
		agContainer.className = "w-full flex flex-col gap-2";
		agContainer.innerHTML = `<h3 class="text-xs font-black uppercase tracking-wider text-amber-900 border-b border-amber-900/10 pb-1 flex items-center gap-1"><i data-lucide="sprout" class="w-4 h-4"></i> Grains & Crops</h3>`;

		let agEmpty = true;
		agriculturalKeys.forEach((key) => {
			const count = state.ingredients[key] || 0;
			if (count > 0) {
				agEmpty = false;
				const row = document.createElement("div");
				row.className = "flex justify-between items-center p-3 bg-white border border-stone-200/50 rounded-xl shadow-sm animate-fade-in";
				row.innerHTML = `<span class="text-xs font-black flex items-center gap-2"><div class="w-6 h-6 shrink-0">${getCropIcon(key)}</div>${INGREDIENTS_DATA[key].name}</span><span class="text-[10px] bg-amber-100 text-amber-950 font-black px-2.5 py-1 rounded-full border border-amber-200/50">Stock: ${count}</span>`;
				agContainer.appendChild(row);
			}
		});
		if (agEmpty) agContainer.innerHTML += `<div class="py-4 text-center text-[10px] text-stone-400 font-bold">No agricultural crops stored.</div>`;
		list.appendChild(agContainer);

		const pantryContainer = document.createElement("div");
		pantryContainer.className = "w-full flex flex-col gap-2 mt-4";
		pantryContainer.innerHTML = `<h3 class="text-xs font-black uppercase tracking-wider text-amber-900 border-b border-amber-900/10 pb-1 flex items-center gap-1"><i data-lucide="shopping-cart" class="w-4 h-4"></i> Pantry shelf Stock</h3>`;

		let pantryEmpty = true;
		pantryKeys.forEach((key) => {
			const count = state.ingredients[key] || 0;
			if (count > 0) {
				pantryEmpty = false;
				const row = document.createElement("div");
				row.className = "flex justify-between items-center p-3 bg-white border border-stone-200/50 rounded-xl shadow-sm animate-fade-in";
				row.innerHTML = `<span class="text-xs font-black flex items-center gap-2"><div class="w-6 h-6 shrink-0">${getCropIcon(key)}</div>${INGREDIENTS_DATA[key].name}</span><span class="text-[10px] bg-indigo-100 text-indigo-950 font-black px-2.5 py-1 rounded-full border border-indigo-200/50">Stock: ${count}</span>`;
				pantryContainer.appendChild(row);
			}
		});
		if (pantryEmpty) pantryContainer.innerHTML += `<div class="py-4 text-center text-[10px] text-stone-400 font-bold">No pantry additives direct-purchased yet.</div>`;
		list.appendChild(pantryContainer);
	} else if (globals.currentReserveTab === "wines") {
		const list = document.getElementById("reserve-wines-content");
		if (!list) return;
		list.innerHTML = "";
		let empty = true;

		const grouped = {};
		state.wines.forEach((bottle) => {
			empty = false;
			const title = bottle.customLabel ? bottle.customLabel.title : RECIPES[bottle.recipeKey].name;
			const groupKey = `${bottle.recipeKey}_${bottle.qualityKey}_${bottle.rankIndex}_${title}`;
			if (!grouped[groupKey]) {
				grouped[groupKey] = {
					recipeKey: bottle.recipeKey,
					qualityKey: bottle.qualityKey,
					rankIndex: bottle.rankIndex,
					title: title,
					customLabel: bottle.customLabel,
					sampleId: bottle.id,
					count: 0,
				};
			}
			grouped[groupKey].count++;
		});

		Object.values(grouped).forEach((g) => {
			const recipe = RECIPES[g.recipeKey];
			const rank = VINTAGE_RANKS[g.rankIndex];
			const hasLabel = !!g.customLabel;

			const card = document.createElement("div");
			card.className = `flex flex-col bg-white border border-stone-200/50 p-4 rounded-xl shadow-sm animate-fade-in relative ${recipe.bg}`;
			card.innerHTML = `
                    <div class="flex justify-between items-center pb-2 border-b border-stone-100/50 mb-2">
                        <h4 class="text-xs font-black leading-tight text-amber-950 truncate pr-2">${g.title}</h4>
                        <span class="text-[9px] font-black bg-stone-900/10 text-stone-900 px-2 py-0.5 rounded-full whitespace-nowrap">Stock: ${g.count}</span>
                    </div>
                    <div class="flex justify-between items-center gap-3">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 shrink-0">${getWineIcon(g.recipeKey, g.qualityKey, g.customLabel)}</div>
                            <div class="flex flex-wrap gap-1.5 mt-1">
                                <span class="text-[8px] font-black bg-stone-900/5 px-2 py-1 rounded text-stone-700 tracking-wider uppercase">${TIERS[g.qualityKey].name}</span>
                                <span class="text-[8px] font-black px-2 py-1 rounded tracking-wider ${rank.color}">${rank.name}</span>
                            </div>
                        </div>
                        <button onclick="openLabelerModal('${g.sampleId}', 'wine')" class="text-[9px] font-black uppercase text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-1.5 rounded transition-all active:scale-95 whitespace-nowrap border border-amber-900/10">
                            ${hasLabel ? "Edit Label" : "+ Label"}
                        </button>
                    </div>
                `;
			list.appendChild(card);
		});

		if (empty) list.innerHTML = `<div class="py-12 text-center text-xs text-stone-400 w-full col-span-2">Aging reserves are empty. Start fermenting inside the cellar!</div>`;
	} else if (globals.currentReserveTab === "beers") {
		const list = document.getElementById("reserve-beers-content");
		if (!list) return;
		list.innerHTML = "";
		let empty = true;

		const grouped = {};
		state.beers.forEach((beer) => {
			empty = false;
			const title = beer.customLabel ? beer.customLabel.title : BEER_RECIPES[beer.recipeKey].name;
			const groupKey = `${beer.recipeKey}_${title}`;
			if (!grouped[groupKey]) {
				grouped[groupKey] = {
					recipeKey: beer.recipeKey,
					title: title,
					customLabel: beer.customLabel,
					sampleId: beer.id,
					count: 0,
				};
			}
			grouped[groupKey].count++;
		});

		Object.values(grouped).forEach((g) => {
			const hasLabel = !!g.customLabel;
			const card = document.createElement("div");
			card.className = "flex flex-col p-3 bg-white border border-stone-200/50 rounded-xl shadow-sm animate-fade-in";
			card.innerHTML = `
            <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-black truncate">${g.title}</span>
                <span class="text-[10px] bg-amber-100 text-amber-950 font-black px-2.5 py-1 rounded-full border border-amber-200/50">Stock: ${g.count}</span>
            </div>
            <div class="flex justify-between items-center gap-2">
                 <div class="w-10 h-10 shrink-0">${getBeerIcon(g.recipeKey, g.customLabel)}</div>
                 <button onclick="openLabelerModal('${g.sampleId}', 'beer')" class="text-[9px] font-black uppercase text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1.5 rounded transition-all active:scale-95 whitespace-nowrap border border-amber-900/10">
                      ${hasLabel ? "Edit Label" : "+ Label"}
                  </button>
            </div>
        `;
			list.appendChild(card);
		});

		if (empty) list.innerHTML = `<div class="py-12 text-center text-xs text-stone-400 w-full col-span-2">No craft beer stock currently owned. Unlocks inside the Brewery module.</div>`;
	}
	if (window.lucide) window.lucide.createIcons();
}

export function openLabelerModal(id, type) {
	let item;
	if (type === "wine") {
		item = state.wines.find((w) => w.id === id) || state.wineRacks.find((w) => w && w.id === id);
	} else {
		item = state.beers.find((b) => b.id === id);
	}
	if (!item) return;

	globals.labeling = {
		id,
		type,
		draft: item.customLabel
			? JSON.parse(JSON.stringify(item.customLabel))
			: {
					title: type === "wine" ? RECIPES[item.recipeKey].name : BEER_RECIPES[item.recipeKey].name,
					bgShape: "rect",
					borderStyle: "solid",
					crestId: "star",
					bgColor: "#FEF9E7",
					crestColor: "#D4AC0D",
				},
	};

	document.getElementById("labeler-title").value = globals.labeling.draft.title;
	renderLabelerPreview();
	updateLabelerControlsUI();
	document.getElementById("labeler-modal").classList.remove("hidden");
}

export function updateLabelDraft(key, value) {
	globals.labeling.draft[key] = value;
	renderLabelerPreview();
	updateLabelerControlsUI();
}

export function updateLabelerControlsUI() {
	const {bgShape, borderStyle, crestId, bgColor, crestColor} = globals.labeling.draft;

	document.querySelectorAll("[data-shape]").forEach((el) => {
		if (el.dataset.shape === bgShape) el.classList.add("ring-2", "ring-amber-500", "bg-amber-100");
		else el.classList.remove("ring-2", "ring-amber-500", "bg-amber-100");
	});

	document.querySelectorAll("[data-border]").forEach((el) => {
		if (el.dataset.border === borderStyle) el.classList.add("ring-2", "ring-amber-500", "bg-amber-100");
		else el.classList.remove("ring-2", "ring-amber-500", "bg-amber-100");
	});

	document.querySelectorAll("[data-crest]").forEach((el) => {
		if (el.dataset.crest === crestId) el.classList.add("ring-2", "ring-amber-500", "bg-amber-100");
		else el.classList.remove("ring-2", "ring-amber-500", "bg-amber-100");
	});

	document.querySelectorAll("[data-bgcolor]").forEach((el) => {
		if (el.dataset.bgcolor === bgColor) el.classList.add("scale-125", "ring-2", "ring-offset-1", "ring-amber-900");
		else el.classList.remove("scale-125", "ring-2", "ring-offset-1", "ring-amber-900");
	});

	document.querySelectorAll("[data-crestcolor]").forEach((el) => {
		if (el.dataset.crestcolor === crestColor) el.classList.add("scale-125", "ring-2", "ring-offset-1", "ring-amber-900");
		else el.classList.remove("scale-125", "ring-2", "ring-offset-1", "ring-amber-900");
	});
}

export function renderLabelerPreview() {
	const container = document.getElementById("labeler-preview-container");
	if (!container) return;

	const {id, type, draft} = globals.labeling;
	let item;
	if (type === "wine") {
		item = state.wines.find((w) => w.id === id) || state.wineRacks.find((w) => w && w.id === id);
		if (item) container.innerHTML = getWineIcon(item.recipeKey, item.qualityKey, draft);
	} else {
		item = state.beers.find((b) => b.id === id);
		if (item) container.innerHTML = getBeerIcon(item.recipeKey, draft);
	}
}

export function closeLabelerModal() {
	globals.labeling = {id: null, type: null, draft: {}};
	document.getElementById("labeler-modal").classList.add("hidden");
}

export function createSparkline(history) {
	if (!history || history.length < 2) return "";
	const max = Math.max(...history);
	const min = Math.min(...history);
	const range = max - min || 1;
	const w = 48,
		h = 18;
	const step = w / (history.length - 1);
	const pts = history.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(" ");
	const isUp = history[history.length - 1] >= history[history.length - 2];
	const color = isUp ? "#16a34a" : "#dc2626";
	return `<svg width="${w}" height="${h}" class="overflow-visible inline-block opacity-80"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

export function renderMarketTimer() {
	const textEl = document.getElementById("market-timer-text");
	const barEl = document.getElementById("market-timer-bar");
	if (textEl && barEl) {
		textEl.textContent = `${state.market.tickCurrent}s`;
		const pct = (state.market.tickCurrent / state.market.tickMax) * 100;
		barEl.style.width = `${pct}%`;
		if (state.market.tickCurrent <= 5) {
			barEl.className = "bg-red-500 h-full rounded-full transition-all duration-1000 ease-linear";
			textEl.classList.add("animate-pulse", "text-red-600");
		} else {
			barEl.className = "bg-amber-500 h-full rounded-full transition-all duration-1000 ease-linear";
			textEl.classList.remove("animate-pulse", "text-red-600");
			textEl.classList.add("text-amber-600");
		}
	}
}

export function renderMarket() {
	const list = document.getElementById("market-list");
	if (!list) return;
	list.innerHTML = "";

	Object.keys(RECIPES).forEach((key) => {
		const recipe = RECIPES[key];
		const basePrice = state.market.current[key];
		const history = state.market.history[key];
		const stockSum = state.wines.filter((w) => w.recipeKey === key).length;

		const sparklineSVG = createSparkline(history);
		const isUp = history.length > 1 && history[history.length - 1] >= history[history.length - 2];
		const trendHTML = isUp ? `<i data-lucide="trending-up" class="w-3.5 h-3.5 text-green-600 inline"></i>` : `<i data-lucide="trending-down" class="w-3.5 h-3.5 text-red-600 inline"></i>`;

		const card = document.createElement("div");
		card.className = "flex items-center justify-between bg-white p-3 rounded-xl border border-amber-900/10 shadow-sm animate-fade-in";
		const disabled = stockSum <= 0;

		card.innerHTML = `
                <div class="flex items-center gap-2.5 w-1/2 min-w-0">
                    <div class="w-11 h-11 shrink-0">${getWineIcon(key, "s")}</div>
                    <div class="min-w-0">
                        <h4 class="font-black text-[11px] text-amber-950 truncate">${recipe.name}</h4>
                        <span class="text-[9px] text-amber-800/50 whitespace-nowrap font-bold">Stored: ${stockSum}</span>
                    </div>
                </div>
                <div class="flex flex-col items-end gap-1 w-1/2">
                    <div class="flex items-center justify-end gap-2 w-full">
                        <div class="w-12 h-6 flex items-center justify-center shrink-0">${sparklineSVG}</div>
                        <span class="text-xs text-amber-900 font-black flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-900/10">$${basePrice}${trendHTML}</span>
                    </div>
                    <button onclick="openSellModal('${key}')" ${disabled ? "disabled" : ""} class="w-full py-1 text-[9px] font-black rounded-lg shadow-sm tracking-wide transition-all uppercase ${disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none" : "bg-yellow-500 hover:bg-yellow-400 text-amber-950 active:scale-95 cursor-pointer"}">SELL WINE</button>
                </div>
            `;
		list.appendChild(card);
	});

	Object.keys(BEER_RECIPES).forEach((key) => {
		const recipe = BEER_RECIPES[key];
		const basePrice = state.market.current[key];
		const history = state.market.history[key];

		const stock = state.beers.filter((b) => b.recipeKey === key).length;

		const sparklineSVG = createSparkline(history);
		const isUp = history.length > 1 && history[history.length - 1] >= history[history.length - 2];
		const trendHTML = isUp ? `<i data-lucide="trending-up" class="w-3.5 h-3.5 text-green-600 inline"></i>` : `<i data-lucide="trending-down" class="w-3.5 h-3.5 text-red-600 inline"></i>`;

		const card = document.createElement("div");
		card.className = "flex items-center justify-between bg-white p-3 rounded-xl border border-amber-900/10 shadow-sm animate-fade-in";
		const disabled = stock <= 0;

		card.innerHTML = `
                <div class="flex items-center gap-2.5 w-1/2 min-w-0">
                    <div class="w-11 h-11 shrink-0">${getBeerIcon(key)}</div>
                    <div class="min-w-0">
                        <h4 class="font-black text-[11px] text-amber-950 truncate">${recipe.name}</h4>
                        <span class="text-[9px] text-amber-800/50 whitespace-nowrap font-bold">Stored: ${stock}</span>
                    </div>
                </div>
                <div class="flex flex-col items-end gap-1 w-1/2">
                    <div class="flex items-center justify-end gap-2 w-full">
                        <div class="w-12 h-6 flex items-center justify-center shrink-0">${sparklineSVG}</div>
                        <span class="text-xs text-amber-900 font-black flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-900/10">$${basePrice}${trendHTML}</span>
                    </div>
                    <button onclick="openSellBeerModal('${key}')" ${disabled ? "disabled" : ""} class="w-full py-1 text-[9px] font-black rounded-lg shadow-sm tracking-wide transition-all uppercase ${disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none" : "bg-yellow-500 hover:bg-yellow-400 text-amber-950 active:scale-95 cursor-pointer"}">SELL BEER</button>
                </div>
            `;
		list.appendChild(card);
	});
	if (window.lucide) window.lucide.createIcons();
}

export function openSellModal(wineKey) {
	globals.activeSellingWineKey = wineKey;
	const container = document.getElementById("sell-tiers-container");
	if (!container) return;
	container.innerHTML = "";

	const recipe = RECIPES[wineKey];
	document.getElementById("sell-modal-title").textContent = `Sell: ${recipe.name}`;

	const filteredWines = state.wines.filter((w) => w.recipeKey === wineKey);
	const liveBaseVal = state.market.current[wineKey];

	const groups = {};
	filteredWines.forEach((bottle) => {
		const title = bottle.customLabel ? bottle.customLabel.title : recipe.name;
		const groupKey = `${bottle.qualityKey}_${bottle.rankIndex}_${title}`;
		if (!groups[groupKey]) {
			groups[groupKey] = {
				qualityKey: bottle.qualityKey,
				rankIndex: bottle.rankIndex,
				title: title,
				customLabel: bottle.customLabel,
				bottles: [],
			};
		}
		groups[groupKey].bottles.push(bottle);
	});

	const uniqueKeys = Object.keys(groups);

	if (uniqueKeys.length === 0) {
		container.innerHTML = `<div class="py-4 text-center text-[10px] text-stone-400 font-bold">No stock matching recipe.</div>`;
	} else {
		uniqueKeys.forEach((gKey) => {
			const g = groups[gKey];
			const qMult = TIERS[g.qualityKey].mult;
			const vMult = VINTAGE_RANKS[g.rankIndex].mult;
			const finalEarning = Math.round(liveBaseVal * qMult * vMult);
			const vintageName = VINTAGE_RANKS[g.rankIndex].name;
			const qualityName = TIERS[g.qualityKey].name;

			const safeTitle = g.title.replace(/'/g, "\\'").replace(/"/g, "&quot;");

			const btn = document.createElement("button");
			btn.className = "w-full flex items-center justify-between p-3 border rounded-2xl bg-amber-50 border-amber-950/20 hover:bg-amber-100 active:scale-95 transition-all font-bold text-left mb-2";
			btn.onclick = () => window.sellWineQualityGroup(g.qualityKey, g.rankIndex, safeTitle);

			btn.innerHTML = `
                    <div class="flex items-center gap-3 w-3/4">
                        <div class="w-10 h-10 shrink-0">
                            ${getWineIcon(wineKey, g.qualityKey, g.customLabel)}
                        </div>
                        <div class="text-left min-w-0 pr-2">
                            <h4 class="text-xs font-black truncate">${g.title}</h4>
                            <p class="text-[9px] opacity-75 truncate">${qualityName} • ${vintageName}</p>
                            <p class="text-[9px] opacity-75 text-green-700">+$${finalEarning} per bottle (Age: ${g.bottles[0].age}y)</p>
                        </div>
                    </div>
                    <span class="bg-black/10 px-2.5 py-0.5 rounded-lg text-xs font-black shrink-0">Qty: ${g.bottles.length}</span>
                `;
			container.appendChild(btn);
		});
	}
	document.getElementById("sell-overlay-modal").classList.remove("hidden");
}

export function openSellBeerModal(beerKey) {
	globals.activeSellingBeerKey = beerKey;
	const container = document.getElementById("sell-tiers-container");
	if (!container) return;
	container.innerHTML = "";

	const recipe = BEER_RECIPES[beerKey];
	document.getElementById("sell-modal-title").textContent = `Sell: ${recipe.name}`;

	const filteredBeers = state.beers.filter((b) => b.recipeKey === beerKey);
	const liveBaseVal = state.market.current[beerKey];

	const groups = {};
	filteredBeers.forEach((beer) => {
		const title = beer.customLabel ? beer.customLabel.title : recipe.name;
		const groupKey = `${title}`;
		if (!groups[groupKey]) {
			groups[groupKey] = {
				title: title,
				customLabel: beer.customLabel,
				items: [],
			};
		}
		groups[groupKey].items.push(beer);
	});

	const uniqueKeys = Object.keys(groups);

	if (uniqueKeys.length === 0) {
		container.innerHTML = `<div class="py-4 text-center text-[10px] text-stone-400 font-bold">No stock matching recipe.</div>`;
	} else {
		uniqueKeys.forEach((gKey) => {
			const g = groups[gKey];
			const finalEarning = liveBaseVal;
			const safeTitle = g.title.replace(/'/g, "\\'").replace(/"/g, "&quot;");

			const btn = document.createElement("button");
			btn.className = "w-full flex items-center justify-between p-3 border rounded-2xl bg-amber-50 border-amber-950/20 hover:bg-amber-100 active:scale-95 transition-all font-bold text-left mb-2";
			btn.onclick = () => window.sellBeerGroup(safeTitle);

			btn.innerHTML = `
                    <div class="flex items-center gap-3 w-3/4">
                        <div class="w-10 h-10 shrink-0">
                            ${getBeerIcon(beerKey, g.customLabel)}
                        </div>
                        <div class="text-left min-w-0 pr-2">
                            <h4 class="text-xs font-black truncate">${g.title}</h4>
                            <p class="text-[9px] opacity-75 text-green-700">+$${finalEarning} per pint</p>
                        </div>
                    </div>
                    <span class="bg-black/10 px-2.5 py-0.5 rounded-lg text-xs font-black shrink-0">Qty: ${g.items.length}</span>
                `;
			container.appendChild(btn);
		});
	}
	document.getElementById("sell-overlay-modal").classList.remove("hidden");
}

export function closeSellModal() {
	document.getElementById("sell-overlay-modal").classList.add("hidden");
	globals.activeSellingWineKey = null;
	globals.activeSellingBeerKey = null;
}

export function renderShop() {
	if (globals.currentShopTab === "seeds") {
		const list = document.getElementById("shop-seeds-content");
		if (!list) return;
		list.innerHTML = "";
		Object.keys(SEEDS_DATA).forEach((key) => {
			const seed = SEEDS_DATA[key];
			const itemDiv = document.createElement("div");
			itemDiv.className = "flex items-center justify-between bg-white p-4 rounded-xl border border-stone-200/50 shadow-sm animate-fade-in";
			itemDiv.innerHTML = `<div class="flex items-center gap-3"><div class="w-10 h-10 shrink-0">${getSeedIcon(key)}</div><div><h4 class="font-black text-xs text-amber-950">${seed.name}</h4><p class="text-[10px] text-amber-800/60 font-bold">Grow time: ${seed.growTime}s (Owned: ${state.seeds[key]})</p></div></div><button onclick="buySeed('${key}')" class="${state.gold >= seed.cost ? "bg-yellow-500 hover:bg-yellow-400 text-amber-950 active:scale-95 cursor-pointer" : "bg-gray-100 text-gray-400 cursor-not-allowed"} px-3 py-2 text-[10px] font-black rounded-lg shadow-sm tracking-wide transition-all uppercase flex items-center gap-1" ${state.gold < seed.cost ? "disabled" : ""}><i data-lucide="coins" class="w-3.5 h-3.5"></i> ${seed.cost}</button>`;
			list.appendChild(itemDiv);
		});
	} else if (globals.currentShopTab === "pantry") {
		const list = document.getElementById("shop-pantry-content");
		if (!list) return;
		list.innerHTML = "";
		Object.keys(PANTRY_DATA).forEach((key) => {
			const item = PANTRY_DATA[key];
			const itemDiv = document.createElement("div");
			itemDiv.className = "flex items-center justify-between bg-white p-4 rounded-xl border border-stone-200/50 shadow-sm animate-fade-in";
			itemDiv.innerHTML = `<div class="flex items-center gap-3"><div class="w-10 h-10 shrink-0">${getCropIcon(key)}</div><div><h4 class="font-black text-xs text-amber-950">${item.name}</h4><p class="text-[10px] text-amber-800/60 font-bold">Instant pantry shelf addition (Owned: ${state.ingredients[key]})</p></div></div><button onclick="buyPantryItem('${key}')" class="${state.gold >= item.cost ? "bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95 cursor-pointer" : "bg-gray-100 text-gray-400 cursor-not-allowed"} px-3 py-2 text-[10px] font-black rounded-lg shadow-sm tracking-wide transition-all uppercase flex items-center gap-1" ${state.gold < item.cost ? "disabled" : ""}><i data-lucide="coins" class="w-3.5 h-3.5"></i> ${item.cost}</button>`;
			list.appendChild(itemDiv);
		});
	} else if (globals.currentShopTab === "upgrades") {
		const list = document.getElementById("shop-upgrades-content");
		if (!list) return;
		list.innerHTML = "";
		const plotsLocked = state.plots.filter((p) => p.state === "locked").length;
		const barrelsCount = state.barrels.length;

		const plotRow = document.createElement("div");
		plotRow.className = "flex items-center justify-between bg-white p-4 rounded-xl border border-stone-200/50 shadow-sm animate-fade-in w-full";
		plotRow.innerHTML = `<div class="flex items-center gap-3"><div class="p-2 bg-blue-50 rounded-lg"><i data-lucide="map" class="w-6 h-6 text-blue-800"></i></div><div><h4 class="font-black text-xs text-amber-950">Expand Vineyard Plots</h4><p class="text-[10px] text-amber-800/60 font-bold">${plotsLocked > 0 ? `Unlocks 1 new plot (${plotsLocked} remaining)` : "Maximum plots purchased!"}</p></div></div>${plotsLocked > 0 ? `<button onclick="buyPlot()" class="${state.gold >= state.shop.plotCost ? "bg-yellow-500 hover:bg-yellow-400 text-amber-950 active:scale-95 cursor-pointer" : "bg-gray-100 text-gray-400 cursor-not-allowed"} px-3 py-2 text-[10px] font-black rounded-lg shadow-sm tracking-wide transition-all uppercase flex items-center gap-1" ${state.gold < state.shop.plotCost ? "disabled" : ""}><i data-lucide="coins" class="w-3.5 h-3.5"></i> ${state.shop.plotCost}</button>` : `<span class="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md">MAXED</span>`}`;
		list.appendChild(plotRow);

		const barrelRow = document.createElement("div");
		barrelRow.className = "flex items-center justify-between bg-white p-4 rounded-xl border border-stone-200/50 shadow-sm mt-3 animate-fade-in w-full";
		barrelRow.innerHTML = `<div class="flex items-center gap-3"><div class="p-2 bg-amber-50 rounded-lg"><i data-lucide="database" class="w-6 h-6 text-amber-800"></i></div><div><h4 class="font-black text-xs text-amber-950">Oak Barrel Slot</h4><p class="text-[10px] text-amber-800/60 font-bold">${barrelsCount < 3 ? `Increase capacity: ${barrelsCount}/3 barrels` : "Cellar full!"}</p></div></div>${barrelsCount < 3 ? `<button onclick="buyBarrel()" class="${state.gold >= state.shop.barrelCost ? "bg-yellow-500 hover:bg-yellow-400 text-amber-950 active:scale-95 cursor-pointer" : "bg-gray-100 text-gray-400 cursor-not-allowed"} px-3 py-2 text-[10px] font-black rounded-lg shadow-sm tracking-wide transition-all uppercase flex items-center gap-1" ${state.gold < state.shop.barrelCost ? "disabled" : ""}><i data-lucide="coins" class="w-3.5 h-3.5"></i> ${state.shop.barrelCost}</button>` : `<span class="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-md">MAXED</span>`}`;
		list.appendChild(barrelRow);

		const kettleRow = document.createElement("div");
		kettleRow.className = "flex items-center justify-between bg-white p-4 rounded-xl border border-stone-200/50 shadow-sm mt-3 animate-fade-in w-full";
		kettleRow.innerHTML = `<div class="flex items-center gap-3"><div class="p-2 bg-amber-100 rounded-lg"><i data-lucide="flame" class="w-6 h-6 text-amber-600"></i></div><div><h4 class="font-black text-xs text-amber-950">Copper Kettle</h4><p class="text-[10px] text-amber-800/60 font-bold">${!state.kettleUnlocked ? "Unlocks grain-based beer brewing tab!" : "Kettle purchased!"}</p></div></div>${!state.kettleUnlocked ? `<button onclick="buyKettle()" class="${state.gold >= state.shop.kettleCost ? "bg-yellow-500 hover:bg-yellow-400 text-amber-950 active:scale-95 cursor-pointer" : "bg-gray-100 text-gray-400 cursor-not-allowed"} px-3 py-2 text-[10px] font-black rounded-lg shadow-sm tracking-wide transition-all uppercase flex items-center gap-1" ${state.gold < state.shop.kettleCost ? "disabled" : ""}><i data-lucide="coins" class="w-3.5 h-3.5"></i> ${state.shop.kettleCost}</button>` : `<span class="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-md">UNLOCKED</span>`}`;
		list.appendChild(kettleRow);

		const oakRow = document.createElement("div");
		oakRow.className = "flex items-center justify-between bg-white p-4 rounded-xl border border-stone-200/50 shadow-sm mt-3 animate-fade-in w-full";
		oakRow.innerHTML = `<div class="flex items-center gap-3"><div class="p-2 bg-indigo-50 rounded-lg"><i data-lucide="sparkles" class="w-6 h-6 text-indigo-600"></i></div><div><h4 class="font-black text-xs text-amber-950">Oak Conditioning</h4><p class="text-[10px] text-amber-800/60 font-bold">${!state.shop.oakBuffOwned ? "Permanently speeds up wine aging by +30%!" : "Conditioning owned!"}</p></div></div>${!state.shop.oakBuffOwned ? `<button onclick="buyOakConditioning()" class="${state.gold >= state.shop.oakBuffCost ? "bg-yellow-500 hover:bg-yellow-400 text-amber-950 active:scale-95 cursor-pointer" : "bg-gray-100 text-gray-400 cursor-not-allowed"} px-3 py-2 text-[10px] font-black rounded-lg shadow-sm tracking-wide transition-all uppercase flex items-center gap-1" ${state.gold < state.shop.oakBuffCost ? "disabled" : ""}><i data-lucide="coins" class="w-3.5 h-3.5"></i> ${state.shop.oakBuffCost}</button>` : `<span class="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">INSTALLED</span>`}`;
		list.appendChild(oakRow);
	}
	if (window.lucide) window.lucide.createIcons();
}

export function switchTab(targetId) {
	globals.currentTab = targetId;
	document.querySelectorAll(".tab-content").forEach((el) => el.classList.remove("active"));
	document.getElementById(`tab-${targetId}`).classList.add("active");
	document.querySelectorAll(".nav-btn").forEach((btn) => {
		if (btn.dataset.target === targetId) btn.className = `nav-btn flex flex-col items-center flex-1 py-1 px-0.5 rounded-lg transition-all bg-amber-100 text-amber-950 shadow-inner`;
		else btn.className = `nav-btn flex flex-col items-center flex-1 py-1 px-0.5 rounded-lg transition-all text-amber-700/50 hover:bg-amber-100`;
	});
	if (targetId === "inventory") renderWarehouse();
	if (targetId === "market") renderMarket();
	if (targetId === "shop") renderShop();
	if (targetId === "brewery") renderBreweryUI();
	if (targetId === "racks") renderRacks();
}

export function showToast(text) {
	const container = document.getElementById("toast-container");
	if (!container) return;
	const toast = document.createElement("div");
	toast.className = "bg-amber-950 text-amber-50 px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center justify-between border border-amber-800/50 animate-fade-in";
	toast.innerHTML = `<span>${text}</span>`;
	if (container.firstChild) container.insertBefore(toast, container.firstChild);
	else container.appendChild(toast);
	setTimeout(() => {
		toast.classList.add("opacity-0", "translate-y-2", "transition-all", "duration-300");
		setTimeout(() => toast.remove(), 300);
	}, 2500);
}

export function initSound() {
	const btn = document.getElementById("sound-toggle");
	const icon = document.getElementById("sound-icon");
	if (!btn || !icon) return;
	btn.addEventListener("click", () => {
		const isEnabled = toggleAudio();
		if (isEnabled) {
			icon.setAttribute("data-lucide", "volume-2");
			btn.className = "p-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors shadow-sm";
		} else {
			icon.setAttribute("data-lucide", "volume-x");
			btn.className = "p-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg transition-colors shadow-sm";
		}
		if (window.lucide) window.lucide.createIcons();
	});
}

export function closeModal() {
	document.getElementById("pop-modal").classList.add("hidden");

	// If an S-Tier pop modal was just closed, check if a labeler sequence should trigger
	if (globals.labeling.id) {
		const bottleIdToLabel = globals.labeling.id;
		globals.labeling.id = null; // Clear the temporary ID immediately
		openLabelerModal(bottleIdToLabel, "wine"); // Then open the modal with the stored ID
	}
}
