document.addEventListener("DOMContentLoaded", () => {
	// --- CONFIG & STATE ---
	const API_URL = "https://wot-tau.vercel.app"; // Use the same API URL as your main app
	const AUTHORIZED_EMAILS = ["roti_canai_telur@outlook.com", "test@test.com"]; // IMPORTANT: Change these to your actual admin emails

	let currentBaseItems = [];
	let currentItemModels = [];
	let currentBaseItem = null; // The base item currently being viewed/edited

	// --- DOM ELEMENTS ---
	const authGate = document.getElementById("auth-gate");
	const adminPanel = document.getElementById("admin-panel");
	const authEmailInput = document.getElementById("auth-email-input");
	const authSubmitBtn = document.getElementById("auth-submit-btn");
	const authError = document.getElementById("auth-error");
	const logoutBtn = document.getElementById("logout-btn");

	// Main Views
	const baseItemsView = document.getElementById("base-items-view");
	const itemModelsView = document.getElementById("item-models-view");
	const backToBaseItemsBtn = document.getElementById("back-to-base-items-btn");

	// Base Items UI
	const baseItemsList = document.getElementById("base-items-list");
	const showCreateBaseItemModalBtn = document.getElementById("show-create-base-item-modal-btn");
	const baseItemModal = document.getElementById("base-item-modal");
	const baseItemModalTitle = document.getElementById("base-item-modal-title");
	const baseItemForm = document.getElementById("base-item-form");
	const cancelBaseItemModalBtn = document.getElementById("cancel-base-item-modal-btn");
	const editingBaseItemIdInput = document.getElementById("editing-base-item-id");
	const baseItemNameInput = document.getElementById("base-item-name");
	const baseItemIdInput = document.getElementById("base-item-id");
	const baseItemWeightInput = document.getElementById("base-item-weight");
	const baseItemPriceInput = document.getElementById("base-item-price");
	const baseItemAestheticInput = document.getElementById("base-item-aesthetic");

	// Item Models UI
	const itemModelsList = document.getElementById("item-models-list");
	const currentBaseItemName = document.getElementById("current-base-item-name");
	const showCreateItemModelModalBtn = document.getElementById("show-create-item-model-modal-btn");
	const itemModelModal = document.getElementById("item-model-modal");
	const itemModelModalTitle = document.getElementById("item-model-modal-title");
	const itemModelForm = document.getElementById("item-model-form");
	const cancelItemModelModalBtn = document.getElementById("cancel-item-model-modal-btn");
	const editingItemModelIdInput = document.getElementById("editing-item-model-id");
	const itemModelNameInput = document.getElementById("item-model-name");
	const itemModelIdInput = document.getElementById("item-model-id");
	const itemModelRarityInput = document.getElementById("item-model-rarity");
	const itemModelColorsInput = document.getElementById("item-model-colors");
	const itemModelWeightInput = document.getElementById("item-model-weight");
	const itemModelPriceInput = document.getElementById("item-model-price");
	const itemModelAestheticInput = document.getElementById("item-model-aesthetic");
	const itemModelLimitedEditionCheckbox = document.getElementById("item-model-limited-edition");
	const itemModelMaxSerialInput = document.getElementById("item-model-max-serial");

	// --- AUTHORIZATION ---
	function checkAuth() {
		const adminEmail = sessionStorage.getItem("adminEmail");
		if (adminEmail && AUTHORIZED_EMAILS.includes(adminEmail)) {
			authGate.classList.add("hidden");
			adminPanel.classList.remove("hidden");
			initializeApp();
		} else {
			authGate.classList.remove("hidden");
			adminPanel.classList.add("hidden");
		}
	}

	authSubmitBtn.addEventListener("click", () => {
		const email = authEmailInput.value.trim().toLowerCase();
		if (AUTHORIZED_EMAILS.includes(email)) {
			sessionStorage.setItem("adminEmail", email);
			checkAuth();
		} else {
			authError.textContent = "Unauthorized email address.";
		}
	});

	logoutBtn.addEventListener("click", () => {
		sessionStorage.removeItem("adminEmail");
		checkAuth();
	});

	// --- INITIALIZATION ---
	async function initializeApp() {
		await fetchBaseItems();
	}

	// --- VIEW MANAGEMENT ---
	function showView(viewName) {
		baseItemsView.classList.add("hidden");
		itemModelsView.classList.add("hidden");
		if (viewName === "base-items") {
			baseItemsView.classList.remove("hidden");
		} else if (viewName === "item-models") {
			itemModelsView.classList.remove("hidden");
		}
	}

	backToBaseItemsBtn.addEventListener("click", () => {
		currentBaseItem = null;
		showView("base-items");
	});

	// --- API CALLS ---
	async function fetchBaseItems() {
		try {
			const response = await fetch(`${API_URL}/api/admin/base-items`);
			currentBaseItems = await response.json();
			renderBaseItems();
		} catch (error) {
			console.error("Error fetching base items:", error);
		}
	}

	async function fetchItemModels(baseItemId) {
		try {
			const response = await fetch(`${API_URL}/api/admin/item-models?baseItemId=${baseItemId}`);
			currentItemModels = await response.json();
			renderItemModels();
		} catch (error) {
			console.error("Error fetching item models:", error);
		}
	}

	// --- EVENT LISTENERS ---

	// Base Item Listeners
	showCreateBaseItemModalBtn.addEventListener("click", () => openBaseItemModal());
	cancelBaseItemModalBtn.addEventListener("click", () => closeBaseItemModal());
	baseItemForm.addEventListener("submit", handleSaveBaseItem);
	baseItemsList.addEventListener("click", handleBaseItemListClick);

	// Item Model Listeners
	showCreateItemModelModalBtn.addEventListener("click", () => openItemModelModal());
	cancelItemModelModalBtn.addEventListener("click", () => closeItemModelModal());
	itemModelForm.addEventListener("submit", handleSaveItemModel);
	itemModelsList.addEventListener("click", handleItemModelListClick);

	// --- BASE ITEM LOGIC ---

	function renderBaseItems() {
		baseItemsList.innerHTML = "";
		currentBaseItems.forEach((item) => {
			const itemCard = document.createElement("div");
			itemCard.className = "bg-white p-4 rounded-lg shadow-md flex flex-col justify-between";
			itemCard.innerHTML = `
                <div>
                    <h3 class="font-bold text-lg">${item.name}</h3>
                    <p class="text-sm text-slate-500 font-mono">${item.itemId}</p>
                </div>
                <div class="flex justify-end gap-2 mt-4">
                    <button data-action="edit" data-id="${item._id}" class="text-sm bg-slate-200 py-1 px-3 rounded-md">Edit</button>
                    <button data-action="view-models" data-id="${item._id}" class="text-sm bg-blue-500 text-white py-1 px-3 rounded-md">View Models</button>
                    <button data-action="delete" data-id="${item._id}" class="text-sm bg-red-500 text-white py-1 px-3 rounded-md">Delete</button>
                </div>
            `;
			baseItemsList.appendChild(itemCard);
		});
	}

	function openBaseItemModal(item = null) {
		baseItemForm.reset();
		if (item) {
			baseItemModalTitle.textContent = "Edit Base Item";
			editingBaseItemIdInput.value = item._id;
			baseItemNameInput.value = item.name;
			baseItemIdInput.value = item.itemId;
			baseItemWeightInput.value = item.defaultStats.weightRange.join(",");
			baseItemPriceInput.value = item.defaultStats.priceRange.join(",");
			baseItemAestheticInput.value = item.defaultStats.aestheticRange.join(",");
		} else {
			baseItemModalTitle.textContent = "Create Base Item";
			editingBaseItemIdInput.value = "";
		}
		baseItemModal.classList.remove("hidden");
		baseItemModal.classList.add("flex");
	}

	function closeBaseItemModal() {
		baseItemModal.classList.add("hidden");
		baseItemModal.classList.remove("flex");
	}

	async function handleSaveBaseItem(e) {
		e.preventDefault();
		const id = editingBaseItemIdInput.value;
		const isEditing = !!id;

		const parseRange = (str) =>
			str
				.split(",")
				.map(Number)
				.filter((n) => !isNaN(n));

		const data = {
			name: baseItemNameInput.value,
			itemId: baseItemIdInput.value,
			defaultStats: {
				weightRange: parseRange(baseItemWeightInput.value),
				priceRange: parseRange(baseItemPriceInput.value),
				aestheticRange: parseRange(baseItemAestheticInput.value),
			},
		};

		try {
			const url = isEditing ? `${API_URL}/api/admin/base-items/${id}` : `${API_URL}/api/admin/base-items`;
			const method = isEditing ? "PUT" : "POST";
			await fetch(url, {
				method,
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify(data),
			});
			closeBaseItemModal();
			fetchBaseItems();
		} catch (error) {
			console.error("Failed to save base item:", error);
		}
	}

	async function handleBaseItemListClick(e) {
		const button = e.target.closest("button");
		if (!button) return;

		const id = button.dataset.id;
		const action = button.dataset.action;
		const item = currentBaseItems.find((i) => i._id === id);

		if (action === "edit") {
			openBaseItemModal(item);
		} else if (action === "delete") {
			if (confirm(`Are you sure you want to delete "${item.name}"? This will also delete all its models.`)) {
				await fetch(`${API_URL}/api/admin/base-items/${id}`, {method: "DELETE"});
				fetchBaseItems();
			}
		} else if (action === "view-models") {
			currentBaseItem = item;
			currentBaseItemName.textContent = item.name;
			fetchItemModels(item._id);
			showView("item-models");
		}
	}

	// --- ITEM MODEL LOGIC ---
	function renderItemModels() {
		itemModelsList.innerHTML = "";
		currentItemModels.forEach((model) => {
			const modelCard = document.createElement("div");
			modelCard.className = "bg-white p-4 rounded-lg shadow-sm grid grid-cols-4 gap-4 items-center";
			modelCard.innerHTML = `
                <div>
                    <p class="font-bold">${model.name}</p>
                    <p class="text-sm text-slate-500 font-mono">${model.modelId}</p>
                </div>
                <div><span class="font-semibold">Rarity:</span> ${model.rarity}</div>
                <div><span class="font-semibold">Colors:</span> ${model.colorOptions.join(", ") || "N/A"}</div>
                <div class="flex justify-end gap-2">
                    <button data-action="edit" data-id="${model._id}" class="text-sm bg-slate-200 py-1 px-3 rounded-md">Edit</button>
                    <button data-action="delete" data-id="${model._id}" class="text-sm bg-red-500 text-white py-1 px-3 rounded-md">Delete</button>
                </div>
            `;
			itemModelsList.appendChild(modelCard);
		});
	}

	function openItemModelModal(model = null) {
		itemModelForm.reset();
		if (model) {
			itemModelModalTitle.textContent = "Edit Item Model";
			editingItemModelIdInput.value = model._id;
			itemModelNameInput.value = model.name;
			itemModelIdInput.value = model.modelId;
			itemModelRarityInput.value = model.rarity;
			itemModelColorsInput.value = model.colorOptions.join(",");
			if (model.modelStats) {
				itemModelWeightInput.value = model.modelStats.weightRange?.join(",") || "";
				itemModelPriceInput.value = model.modelStats.priceRange?.join(",") || "";
				itemModelAestheticInput.value = model.modelStats.aestheticRange?.join(",") || "";
			}
			if (model.limitedEdition) {
				itemModelLimitedEditionCheckbox.checked = model.limitedEdition.isLimited;
				itemModelMaxSerialInput.value = model.limitedEdition.maxSerial || "";
			}
		} else {
			itemModelModalTitle.textContent = "Create New Model";
			editingItemModelIdInput.value = "";
		}
		itemModelModal.classList.remove("hidden");
		itemModelModal.classList.add("flex");
	}

	function closeItemModelModal() {
		itemModelModal.classList.add("hidden");
		itemModelModal.classList.remove("flex");
	}

	async function handleSaveItemModel(e) {
		e.preventDefault();
		const id = editingItemModelIdInput.value;
		const isEditing = !!id;

		const parseRange = (str) =>
			str
				? str
						.split(",")
						.map(Number)
						.filter((n) => !isNaN(n))
				: undefined;

		const data = {
			baseItemId: currentBaseItem._id,
			name: itemModelNameInput.value,
			modelId: itemModelIdInput.value,
			rarity: itemModelRarityInput.value,
			colorOptions: itemModelColorsInput.value
				.split(",")
				.map((c) => c.trim())
				.filter(Boolean),
			modelStats: {
				weightRange: parseRange(itemModelWeightInput.value),
				priceRange: parseRange(itemModelPriceInput.value),
				aestheticRange: parseRange(itemModelAestheticInput.value),
			},
			limitedEdition: {
				isLimited: itemModelLimitedEditionCheckbox.checked,
				maxSerial: itemModelMaxSerialInput.value ? Number(itemModelMaxSerialInput.value) : 0,
			},
		};

		try {
			const url = isEditing ? `${API_URL}/api/admin/item-models/${id}` : `${API_URL}/api/admin/item-models`;
			const method = isEditing ? "PUT" : "POST";
			await fetch(url, {
				method,
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify(data),
			});
			closeItemModelModal();
			fetchItemModels(currentBaseItem._id);
		} catch (error) {
			console.error("Failed to save item model:", error);
		}
	}

	async function handleItemModelListClick(e) {
		const button = e.target.closest("button");
		if (!button) return;

		const id = button.dataset.id;
		const action = button.dataset.action;
		const model = currentItemModels.find((m) => m._id === id);

		if (action === "edit") {
			openItemModelModal(model);
		} else if (action === "delete") {
			if (confirm(`Are you sure you want to delete "${model.name}"?`)) {
				await fetch(`${API_URL}/api/admin/item-models/${id}`, {method: "DELETE"});
				fetchItemModels(currentBaseItem._id);
			}
		}
	}

	// --- KICKSTART ---
	checkAuth();
});
