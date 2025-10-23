// This file manages the entire collectible card game feature for the user.

document.addEventListener("DOMContentLoaded", () => {
	// --- CONFIGURATION ---
	const API_URL = "http://localhost:3005"; // Ensure this matches your main script
	const CARD_DROP_INTERVAL = 20 * 60; // 20 minutes in seconds

	// Rarity styles - used for borders, text colors, etc.
	const RARITY_STYLES = {
		common: {bg: "bg-slate-200 dark:bg-slate-600", text: "text-slate-600 dark:text-slate-300", border: "border-slate-300 dark:border-slate-500"},
		uncommon: {bg: "bg-green-100 dark:bg-green-900/50", text: "text-green-700 dark:text-green-400", border: "border-green-400 dark:border-green-600"},
		rare: {bg: "bg-blue-100 dark:bg-blue-900/50", text: "text-blue-700 dark:text-blue-400", border: "border-blue-400 dark:border-blue-600"},
		epic: {bg: "bg-purple-100 dark:bg-purple-900/50", text: "text-purple-700 dark:text-purple-400", border: "border-purple-400 dark:border-purple-600"},
		legendary: {bg: "bg-yellow-100 dark:bg-yellow-900/50", text: "text-yellow-700 dark:text-yellow-400", border: "border-yellow-400 dark:border-yellow-600"},
		mythic: {bg: "bg-red-100 dark:bg-red-900/50", text: "text-red-700 dark:text-red-400", border: "border-red-400 dark:border-red-600"},
	};

	// --- STATE ---
	let userId = null;
	let accumulatedTime = 0;
	let unclaimedDrops = 0;
	let cardChoices = [];
	let inventory = [];

	// --- DOM ELEMENTS ---
	const dropProgressContainer = document.getElementById("drop-progress-container");
	const dropProgressBar = document.getElementById("drop-progress-bar");
	const dropProgressText = document.getElementById("drop-progress-text");
	const claimDropBtn = document.getElementById("claim-drop-btn");
	const claimNotification = document.getElementById("claim-notification");

	const claimModal = document.getElementById("claim-card-modal");
	const claimModalContent = document.getElementById("claim-card-choices");
	const claimModalLoading = document.getElementById("claim-loading");

	const binderGrid = document.getElementById("binder-grid");
	const cardDetailModal = document.getElementById("card-detail-modal");
	const cardDetailContent = document.getElementById("card-detail-content");
	const closeCardDetailModalBtn = document.getElementById("close-card-detail-modal-btn");

	// --- INITIALIZATION ---
	window.initCollectibles = (currentUserId, initialTime, initialDrops) => {
		userId = currentUserId;
		accumulatedTime = initialTime || 0;
		unclaimedDrops = initialDrops || 0;
		renderDropProgress();
		fetchInventory();
	};

	window.collectiblesModule = {
		renderInventory,
		tickProgress,
		saveCollectibleState,
	};

	// --- EVENT LISTENERS ---
	claimDropBtn.addEventListener("click", handleClaimClick);
	claimModal.addEventListener("click", (e) => {
		if (e.target === claimModal) {
			closeClaimModal();
		}
	});

	binderGrid.addEventListener("click", handleBinderGridClick);
	closeCardDetailModalBtn.addEventListener("click", closeCardDetailModal);
	cardDetailModal.addEventListener("click", (e) => {
		if (e.target === cardDetailModal) {
			closeCardDetailModal();
		}
	});

	// --- CORE LOGIC ---

	function tickProgress() {
		if (!userId) return;

		accumulatedTime++;

		if (accumulatedTime >= CARD_DROP_INTERVAL) {
			unclaimedDrops++;
			accumulatedTime -= CARD_DROP_INTERVAL;

			saveCollectibleState();
		}

		renderDropProgress();
	}

	async function saveCollectibleState() {
		if (!userId) return;

		try {
			const response = await fetch(`${API_URL}/api/study/user/collectible-state`, {
				method: "PUT",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({userId, accumulatedStudyTime: accumulatedTime, unclaimedDrops}),
			});
			if (!response.ok) throw new Error("Failed to save progress.");

			const data = await response.json();

			accumulatedTime = data.accumulatedStudyTime;
			unclaimedDrops = data.unclaimedDrops;
			renderDropProgress();

			const user = JSON.parse(localStorage.getItem("studyUser"));
			if (user) {
				user.accumulatedStudyTime = accumulatedTime;
				user.unclaimedDrops = unclaimedDrops;
				localStorage.setItem("studyUser", JSON.stringify(user));
			}
		} catch (error) {
			console.error("Failed to save collectible state:", error);
		}
	}

	function renderDropProgress() {
		if (!dropProgressBar) return;
		const percentage = (accumulatedTime / CARD_DROP_INTERVAL) * 100;
		const minutes = Math.floor(accumulatedTime / 60);
		const requiredMinutes = CARD_DROP_INTERVAL / 60;

		dropProgressBar.style.width = `${Math.min(percentage, 100)}%`;
		dropProgressText.textContent = `${minutes} / ${requiredMinutes} mins`;

		if (unclaimedDrops > 0) {
			claimNotification.textContent = unclaimedDrops;
			claimNotification.classList.remove("hidden");
			claimDropBtn.classList.add("animate-pulse");
		} else {
			claimNotification.classList.add("hidden");
			claimDropBtn.classList.remove("animate-pulse");
		}
	}

	async function handleClaimClick() {
		if (unclaimedDrops < 1) {
			alert("You have no card drops to claim. Keep studying!");
			return;
		}

		openClaimModal(true);
    console.log("Generating card drop for user:", userId);
    try {
      const response = await fetch(`${API_URL}/api/collectibles/generate-drop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      cardChoices = await response.json();
      renderCardChoices();
      openClaimModal(false);
    } catch (error) {
      console.error("Failed to generate card drop:", error);
      closeClaimModal();
      alert("Could not generate a card drop. Please try again.");
    }
	}

	function openClaimModal(isLoading = false) {
		if (isLoading) {
			claimModalLoading.classList.remove("hidden");
			claimModalContent.classList.add("hidden");
		} else {
			claimModalLoading.classList.add("hidden");
			claimModalContent.classList.remove("hidden");
		}
		claimModal.classList.remove("hidden");
	}

	function closeClaimModal() {
		claimModal.classList.add("hidden");
		cardChoices = [];
	}

	// EDITED: Adjusted padding, font sizes, and margins to prevent overflow and ensure alignment.
	function renderCardChoices() {
		claimModalContent.innerHTML = "";
		cardChoices.forEach((card, index) => {
			const rarityStyle = RARITY_STYLES[card.generatedStats.rarity] || RARITY_STYLES.common;
			const cardEl = document.createElement("div");

			let versionClass = "";
			if (card.generatedStats.version === "shiny") {
				versionClass = " card-version-shiny";
			} else if (card.generatedStats.version === "gold") {
				versionClass = " card-version-gold";
			}

			cardEl.className = `claim-card-container bg-white dark:bg-slate-700 rounded-lg shadow-lg border-2 ${rarityStyle.border} flex flex-col overflow-hidden${versionClass}`;
			cardEl.setAttribute("data-tilt", "");

			let versionHTML = "";
			if (card.generatedStats.version === "shiny") {
				versionHTML = `<span class="font-bold text-yellow-400">✨ SHINY</span>`;
			} else if (card.generatedStats.version === "gold") {
				versionHTML = `<span class="font-bold text-amber-500">🏆 GOLD</span>`;
			} else if (card.generatedStats.version === "inverted") {
				versionHTML = `<span class="font-bold text-indigo-500">🎨 INVERTED</span>`;
			}

			const serialHTML = card.generatedStats.serialNumber ? `<span class="font-mono">${card.generatedStats.serialNumber}</span>` : "";

			cardEl.innerHTML = `
                <div class="w-full text-center py-1 ${rarityStyle.bg}">
                    <p class="font-semibold text-sm capitalize ${rarityStyle.text}">${card.generatedStats.rarity}</p>
                </div>
                
                <div class="p-3 flex-grow w-full flex flex-col items-center">
                    <div class="card-image-wrapper w-full aspect-[5/3] rounded-md bg-slate-200 dark:bg-slate-600 flex items-center justify-center overflow-hidden">
                        <img src="${card.itemModel.imageBase64 || "https://placehold.co/250x150/e2e8f0/94a3b8?text=No+Image"}" alt="${card.itemModel.name}" class="w-full h-full object-cover">
                    </div>
                    
                    <h3 class="font-semibold text-base text-center text-slate-800 dark:text-slate-100 min-h-[2.75rem] flex items-center justify-center">${card.itemModel.name}</h3>
                    
                    <div class="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-slate-600 dark:text-slate-400 w-full mt-auto border-t ${rarityStyle.border} pt-2">
                        <div class="font-semibold">Condition:</div>
                        <div class="text-right">${card.generatedStats.condition}</div>

                        <div class="font-semibold">Aesthetic:</div>
                        <div class="text-right">${card.generatedStats.aestheticScore}</div>

                        <div class="font-semibold">Weight:</div>
                        <div class="text-right">${card.generatedStats.weight}g</div>

                        <div class="font-semibold">Price:</div>
                        <div class="text-right">$${card.generatedStats.price.toFixed(2)}</div>
                        
                        <div class="col-span-2 text-center mt-2 border-t ${rarityStyle.border} pt-1">
                             <p class="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Collector Value</p>
                             <p class="text-lg font-bold text-slate-800 dark:text-slate-200">${card.generatedStats.collectorValue}</p>
                        </div>
                    </div>
                </div>

                <div class="w-full text-[10px] text-slate-500 dark:text-slate-400 px-3 pb-1.5 flex justify-between items-center min-h-[1.25rem]">
                    <span>${versionHTML}</span>
                    <span>${serialHTML}</span>
                </div>

                <button data-index="${index}" class="claim-choice-btn w-full bg-blue-600 text-white py-2 rounded-b-md hover:bg-blue-700 font-semibold transition-colors">Choose</button>
            `;
			claimModalContent.appendChild(cardEl);
		});

		document.querySelectorAll(".claim-choice-btn").forEach((btn) => {
			btn.addEventListener("click", handleSelectCard);
		});

		VanillaTilt.init(document.querySelectorAll(".claim-card-container"), {
			max: 15,
			speed: 400,
			glare: true,
			"max-glare": 0.2,
		});
	}

	async function handleSelectCard(event) {
		const choiceIndex = event.target.dataset.index;
		const chosenCard = cardChoices[choiceIndex];

		document.querySelectorAll(".claim-choice-btn").forEach((btn) => (btn.disabled = true));
		event.target.textContent = "Claiming...";

		try {
			const response = await fetch(`${API_URL}/api/collectibles/claim-card`, {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({userId, chosenCard}),
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.error);

			unclaimedDrops = data.unclaimedDrops;
			alert(`You claimed the ${chosenCard.itemModel.name}!`);
			closeClaimModal();
			renderDropProgress();

			const user = JSON.parse(localStorage.getItem("studyUser"));
			if (user) {
				user.unclaimedDrops = unclaimedDrops;
				localStorage.setItem("studyUser", JSON.stringify(user));
			}
			await fetchInventory();
		} catch (error) {
			console.error("Failed to claim card:", error);
			alert(`Error: ${error.message}`);
			document.querySelectorAll(".claim-choice-btn").forEach((btn) => (btn.disabled = false));
			event.target.textContent = "Choose";
		}
	}

	async function fetchInventory() {
		if (!userId) return;
		try {
			const response = await fetch(`${API_URL}/api/collectibles/inventory?userId=${userId}`);
			if (!response.ok) throw new Error("Could not fetch inventory.");
			inventory = await response.json();
			renderInventory();
		} catch (error) {
			console.error("Error fetching inventory:", error);
			if (binderGrid) {
				binderGrid.innerHTML = `<p class="text-red-500 col-span-full text-center">Could not load your collection.</p>`;
			}
		}
	}

	function renderInventory() {
        if (!binderGrid) return;
        binderGrid.innerHTML = '';
        if (inventory.length === 0) {
            binderGrid.innerHTML = `<p class="text-slate-500 dark:text-slate-400 col-span-full text-center">Your collection is empty. Keep studying to earn cards!</p>`;
            return;
        }

        inventory.forEach(item => {
            const rarityStyle = RARITY_STYLES[item.generatedStats.rarity] || RARITY_STYLES.common;
            const cardEl = document.createElement("div");
            cardEl.className = `binder-card relative bg-white dark:bg-slate-700 rounded-lg shadow-md border ${rarityStyle.border} flex flex-col overflow-hidden cursor-pointer`;
            cardEl.dataset.itemId = item._id;

            let versionClass = "";
						if (item.generatedStats.version === "shiny") {
							versionClass = " card-version-shiny";
						} else if (item.generatedStats.version === "gold") {
							versionClass = " card-version-gold";
						}

            let versionHTML = '';
            if (item.generatedStats.version === "shiny") {
                versionHTML = `<span class="font-bold text-yellow-400">✨</span>`;
            } else if (item.generatedStats.version === "gold") {
                versionHTML = `<span class="font-bold text-amber-500">🏆</span>`;
            } else if (item.generatedStats.version === "inverted") {
                versionHTML = `<span class="font-bold text-indigo-500">🎨</span>`;
            }

            const serialHTML = item.generatedStats.serialNumber ? `<span class="font-mono text-[9px]">${item.generatedStats.serialNumber.split("/")[0]}</span>` : "";

            cardEl.innerHTML = `
            <div class="${versionClass}">
                <div class="w-full text-center py-0.5 ${rarityStyle.bg}">
                    <p class="font-semibold text-[10px] capitalize ${rarityStyle.text}">${item.generatedStats.rarity}</p>
                </div>
                <div class="p-2 pb-0 flex-grow w-full flex flex-col items-center">
                    <div class="w-full aspect-[5/3] rounded-sm bg-slate-200 dark:bg-slate-600 flex items-center justify-center overflow-hidden">
                        <img src="${item.itemModelId.imageBase64 || "https://placehold.co/250x150/e2e8f0/94a3b8?text=No+Image"}" alt="${item.itemModelId.name}" class="w-full h-full object-cover">
                    </div>
                    <h3 class="font-bold text-xs text-center text-slate-800 dark:text-slate-100 leading-tight my-1 min-h-[1.875rem] flex items-center justify-center">${item.itemModelId.name}</h3>
                    <div class="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[0.5rem] text-slate-600 dark:text-slate-400 w-full border-t ${rarityStyle.border} pt-2">
                        <div class="font-semibold">Condition:</div><div class="text-right">${item.generatedStats.condition}</div>
                        <div class="font-semibold">Aesthetic:</div><div class="text-right">${item.generatedStats.aestheticScore}</div>
                        <div class="font-semibold">Weight:</div><div class="text-right">${item.generatedStats.weight}g</div>
                        <div class="font-semibold">Price:</div><div class="text-right">$${item.generatedStats.price.toFixed(2)}</div>
                        <div class="col-span-2 text-center mt-2 border-t ${rarityStyle.border} pt-2">
                             <p class="text-[0.5rem] font-semibold text-slate-500 dark:text-slate-400">Collector Value</p>
                             <p class="text-sm font-bold text-slate-800 dark:text-slate-200">${item.generatedStats.collectorValue}</p>
                        </div>
                    </div>
                </div>
                <div class="w-full text-[10px] text-slate-500 dark:text-slate-400 px-2 pb-1 flex justify-between items-center mt-auto">
                    <span>${versionHTML}</span>
                    <span>${serialHTML}</span>
                </div>
            </div>
            `;
            binderGrid.appendChild(cardEl);
        });
      }

	function handleBinderGridClick(event) {
		const card = event.target.closest(".binder-card");
		if (card && card.dataset.itemId) {
			openCardDetailModal(card.dataset.itemId);
		}
	}

	function openCardDetailModal(itemId) {
		const item = inventory.find((i) => i._id === itemId);
		if (!item) return;

		renderCardDetail(item);
		cardDetailModal.classList.remove("hidden");
	}

	function closeCardDetailModal() {
		cardDetailModal.classList.add("hidden");
		cardDetailContent.innerHTML = "";
	}

	function renderCardDetail(item) {
		const rarityStyle = RARITY_STYLES[item.generatedStats.rarity] || RARITY_STYLES.common;

		let versionClass = "";
		if (item.generatedStats.version === "shiny") {
			versionClass = " card-version-shiny";
		} else if (item.generatedStats.version === "gold") {
			versionClass = " card-version-gold";
		}

		let versionHTML = "";
		if (item.generatedStats.version === "shiny") {
			versionHTML = `<span class="font-bold text-yellow-400">✨ SHINY</span>`;
		} else if (item.generatedStats.version === "gold") {
			versionHTML = `<span class="font-bold text-amber-500">🏆 GOLD</span>`;
		} else if (item.generatedStats.version === "inverted") {
			versionHTML = `<span class="font-bold text-indigo-500">🎨 INVERTED</span>`;
		}

		const serialHTML = item.generatedStats.serialNumber ? `<span class="font-mono">${item.generatedStats.serialNumber}</span>` : "";

		cardDetailContent.innerHTML = `
            <div class="claim-card-container bg-white dark:bg-slate-700 rounded-lg shadow-lg border-2 ${rarityStyle.border} flex flex-col overflow-hidden${versionClass}" data-tilt>
                <div class="w-full text-center py-1 ${rarityStyle.bg}">
                    <p class="font-semibold text-sm capitalize ${rarityStyle.text}">${item.generatedStats.rarity}</p>
                </div>
                <div class="p-4 flex-grow w-full flex flex-col items-center">
                    <div class="card-image-wrapper w-full aspect-[5/3] rounded-md bg-slate-200 dark:bg-slate-600 flex items-center justify-center overflow-hidden">
                        <img src="${item.itemModelId.imageBase64 || "https://placehold.co/250x150/e2e8f0/94a3b8?text=No+Image"}" alt="${item.itemModelId.name}" class="w-full h-full object-cover">
                    </div>
                    <h3 class="font-semibold text-xl text-center text-slate-800 dark:text-slate-100 min-h-[5rem] flex items-center justify-center">${item.itemModelId.name}</h3>
                    <div class="grid grid-cols-2 gap-x-3 gap-y-0.5 text-sm text-slate-600 dark:text-slate-400 w-full border-t ${rarityStyle.border} pt-2">
                        <div class="font-semibold">Condition:</div><div class="text-right">${item.generatedStats.condition}</div>
                        <div class="font-semibold">Aesthetic:</div><div class="text-right">${item.generatedStats.aestheticScore}</div>
                        <div class="font-semibold">Weight:</div><div class="text-right">${item.generatedStats.weight}g</div>
                        <div class="font-semibold">Price:</div><div class="text-right">$${item.generatedStats.price.toFixed(2)}</div>
                        <div class="col-span-2 text-center mt-2 border-t ${rarityStyle.border} pt-2">
                             <p class="text-sm font-semibold text-slate-500 dark:text-slate-400">Collector Value</p>
                             <p class="text-2xl font-bold text-slate-800 dark:text-slate-200">${item.generatedStats.collectorValue}</p>
                        </div>
                    </div>
                </div>
                <div class="w-full text-xs text-slate-500 dark:text-slate-400 px-4 pb-2 flex justify-between items-center min-h-[1.25rem]">
                    <span>${versionHTML}</span>
                    <span>${serialHTML}</span>
                </div>
            </div>
        `;

		VanillaTilt.init(cardDetailContent.querySelector(".claim-card-container"), {
			max: 15,
			speed: 400,
			glare: true,
			"max-glare": 0.2,
		});
	}
});
