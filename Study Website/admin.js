document.addEventListener("DOMContentLoaded", () => {
	// --- CONFIG & STATE ---
	const API_URL = "https://wot-tau.vercel.app"; // Use the same API URL as your main app
	const AUTHORIZED_EMAILS = ["test@test.com", "roti_canai_telur@outlook.com"]; // IMPORTANT: Change these to your actual admin emails

	let currentBaseItems = [];
	let currentItemModels = [];
	let currentBaseItem = null;
	let currentImageBase64 = null;

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
	const itemModelImageInput = document.getElementById("item-model-image-input");
	const itemModelImagePreview = document.getElementById("item-model-image-preview");
	const itemModelImagePlaceholder = document.getElementById("item-model-image-placeholder");
	const itemModelUploadBtn = document.getElementById("item-model-upload-btn");
	const itemModelRemoveImageBtn = document.getElementById("item-model-remove-image-btn");

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

	itemModelUploadBtn.addEventListener("click", () => itemModelImageInput.click());
	itemModelImageInput.addEventListener("change", handleImageSelection);
	itemModelRemoveImageBtn.addEventListener("click", handleRemoveImage);

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

	// EDITED: This function is now optimistic for Create and Edit operations.
	async function handleSaveBaseItem(e) {
		e.preventDefault();
		const id = editingBaseItemIdInput.value;
		const isEditing = !!id;
		closeBaseItemModal();

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

		if (isEditing) {
			const itemIndex = currentBaseItems.findIndex((i) => i._id === id);
			if (itemIndex === -1) return;

			const originalItem = {...currentBaseItems[itemIndex]};
			currentBaseItems[itemIndex] = {...originalItem, ...data};
			renderBaseItems();

			try {
				const response = await fetch(`${API_URL}/api/admin/base-items/${id}`, {
					method: "PUT",
					headers: {"Content-Type": "application/json"},
					body: JSON.stringify(data),
				});
				if (!response.ok) throw new Error("Server update failed");
			} catch (error) {
				console.error("Failed to save base item:", error);
				currentBaseItems[itemIndex] = originalItem;
				renderBaseItems();
				alert("Failed to update base item. Reverting changes.");
			}
		} else {
			const tempId = `temp_${Date.now()}`;
			const optimisticItem = {...data, _id: tempId};
			currentBaseItems.push(optimisticItem);
			renderBaseItems();

			try {
				const response = await fetch(`${API_URL}/api/admin/base-items`, {
					method: "POST",
					headers: {"Content-Type": "application/json"},
					body: JSON.stringify(data),
				});
				if (!response.ok) throw new Error("Server create failed");
				const savedItem = await response.json();
				const itemIndex = currentBaseItems.findIndex((i) => i._id === tempId);
				if (itemIndex !== -1) {
					currentBaseItems[itemIndex] = savedItem;
				}
				renderBaseItems();
			} catch (error) {
				console.error("Failed to create base item:", error);
				currentBaseItems = currentBaseItems.filter((i) => i._id !== tempId);
				renderBaseItems();
				alert("Failed to create base item. Reverting changes.");
			}
		}
	}

	// EDITED: This function is now optimistic for Delete operations.
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
				const itemIndex = currentBaseItems.findIndex((i) => i._id === id);
				if (itemIndex === -1) return;

				const deletedItem = currentBaseItems.splice(itemIndex, 1)[0];
				renderBaseItems();

				try {
					const response = await fetch(`${API_URL}/api/admin/base-items/${id}`, {method: "DELETE"});
					if (!response.ok) throw new Error("Server delete failed");
				} catch (error) {
					console.error("Failed to delete base item:", error);
					currentBaseItems.splice(itemIndex, 0, deletedItem);
					renderBaseItems();
					alert("Failed to delete base item. Reverting changes.");
				}
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
			modelCard.className = "bg-white p-4 rounded-lg shadow-sm grid grid-cols-5 gap-4 items-center";
			modelCard.innerHTML = `
                <div class="col-span-1">
                    <img src="${model.imageBase64 || "https://placehold.co/100x100/e2e8f0/94a3b8?text=No+Image"}" alt="${model.name}" class="w-20 h-20 object-cover rounded-md bg-slate-200">
                </div>
                <div class="col-span-3">
                    <p class="font-bold">${model.name}</p>
                    <p class="text-sm text-slate-500 font-mono">${model.modelId}</p>
                    <div class="text-xs mt-2">
                        <span class="font-semibold">Rarity:</span> ${model.rarity} | 
                        <span class="font-semibold">Colors:</span> ${model.colorOptions.join(", ") || "N/A"}
                    </div>
                </div>
                <div class="col-span-1 flex flex-col items-end gap-2">
                    <button data-action="edit" data-id="${model._id}" class="text-sm bg-slate-200 py-1 px-3 rounded-md w-full text-center">Edit</button>
                    <button data-action="delete" data-id="${model._id}" class="text-sm bg-red-500 text-white py-1 px-3 rounded-md w-full text-center">Delete</button>
                </div>
            `;
			itemModelsList.appendChild(modelCard);
		});
	}

	function openItemModelModal(model = null) {
		itemModelForm.reset();
		currentImageBase64 = null;
		updateImagePreview(null);

		if (model) {
			itemModelModalTitle.textContent = "Edit Item Model";
			editingItemModelIdInput.value = model._id;
			itemModelNameInput.value = model.name;
			itemModelIdInput.value = model.modelId;
			itemModelRarityInput.value = model.rarity;
			itemModelColorsInput.value = model.colorOptions.join(",");

			if (model.imageBase64) {
				currentImageBase64 = model.imageBase64;
				updateImagePreview(model.imageBase64);
			}

			if (model.modelStats) {
				itemModelWeightInput.value = model.modelStats.weightRange?.join(",") || "";
				itemModelPriceInput.value = model.modelStats.priceRange?.join(",") || "";
				itemModelAestheticInput.value = model.modelStats.aestheticRange?.join(",") || "";
			}
			if (model.limitedEdition) {
				itemModelLimitedEditionCheckbox.checked = model.limitedEdition.isLimited;
				itemModelMaxSerialInput.value = model.limitedEdition.maxSerial || "";
			}
			if (currentBaseItem && currentBaseItem.defaultStats) {
				itemModelWeightInput.placeholder = `${currentBaseItem.defaultStats.weightRange.join(",")}`;
				itemModelPriceInput.placeholder = `${currentBaseItem.defaultStats.priceRange.join(",")}`;
				itemModelAestheticInput.placeholder = `${currentBaseItem.defaultStats.aestheticRange.join(",")}`;
			}
		} else {
			itemModelModalTitle.textContent = "Create New Model";
			editingItemModelIdInput.value = "";

			if (currentBaseItem && currentBaseItem.defaultStats) {
				itemModelWeightInput.placeholder = `${currentBaseItem.defaultStats.weightRange.join(",")}`;
				itemModelPriceInput.placeholder = `${currentBaseItem.defaultStats.priceRange.join(",")}`;
				itemModelAestheticInput.placeholder = `${currentBaseItem.defaultStats.aestheticRange.join(",")}`;
			}
		}
		itemModelModal.classList.remove("hidden");
		itemModelModal.classList.add("flex");
	}

	function closeItemModelModal() {
		itemModelModal.classList.add("hidden");
		itemModelModal.classList.remove("flex");
	}

	// EDITED: This function is now optimistic for Create and Edit operations.
	async function handleSaveItemModel(e) {
		e.preventDefault();
		const id = editingItemModelIdInput.value;
		const isEditing = !!id;
		closeItemModelModal();

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
			imageBase64: currentImageBase64,
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

		if (isEditing) {
			const modelIndex = currentItemModels.findIndex((m) => m._id === id);
			if (modelIndex === -1) return;

			const originalModel = {...currentItemModels[modelIndex]};
			currentItemModels[modelIndex] = {...originalModel, ...data};
			renderItemModels();

			try {
				const response = await fetch(`${API_URL}/api/admin/item-models/${id}`, {
					method: "PUT",
					headers: {"Content-Type": "application/json"},
					body: JSON.stringify(data),
				});
				if (!response.ok) throw new Error("Server update failed");
			} catch (error) {
				console.error("Failed to save item model:", error);
				currentItemModels[modelIndex] = originalModel;
				renderItemModels();
				alert("Failed to update item model.");
			}
		} else {
			const tempId = `temp_model_${Date.now()}`;
			const optimisticModel = {...data, _id: tempId};
			currentItemModels.push(optimisticModel);
			renderItemModels();

			try {
				const response = await fetch(`${API_URL}/api/admin/item-models`, {
					method: "POST",
					headers: {"Content-Type": "application/json"},
					body: JSON.stringify(data),
				});
				if (!response.ok) throw new Error("Server create failed");
				const savedModel = await response.json();
				const modelIndex = currentItemModels.findIndex((m) => m._id === tempId);
				if (modelIndex !== -1) {
					currentItemModels[modelIndex] = savedModel;
				}
				renderItemModels();
			} catch (error) {
				console.error("Failed to save item model:", error);
				currentItemModels = currentItemModels.filter((m) => m._id !== tempId);
				renderItemModels();
				alert("Failed to create item model.");
			}
		}
	}

	// EDITED: This function is now optimistic for Delete operations.
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
				const modelIndex = currentItemModels.findIndex((m) => m._id === id);
				if (modelIndex === -1) return;

				const deletedModel = currentItemModels.splice(modelIndex, 1)[0];
				renderItemModels();

				try {
					const response = await fetch(`${API_URL}/api/admin/item-models/${id}`, {method: "DELETE"});
					if (!response.ok) throw new Error("Server delete failed");
				} catch (error) {
					console.error("Failed to delete item model:", error);
					currentItemModels.splice(modelIndex, 0, deletedModel);
					renderItemModels();
					alert("Failed to delete item model.");
				}
			}
		}
	}

	// --- IMAGE HANDLING LOGIC ---

	async function handleImageSelection(event) {
		const file = event.target.files[0];
		if (!file) return;

		try {
			const compressedBase64 = await compressAndEncodeImage(file);
			currentImageBase64 = compressedBase64;
			updateImagePreview(compressedBase64);
		} catch (error) {
			console.error("Image compression error:", error);
			alert("Failed to process image.");
		}
	}

	function handleRemoveImage() {
		currentImageBase64 = ""; // Set to empty string to signal removal
		updateImagePreview(null);
		itemModelImageInput.value = ""; // Clear the file input
	}

	function updateImagePreview(base64String) {
		if (base64String) {
			itemModelImagePreview.src = base64String;
			itemModelImagePreview.classList.remove("hidden");
			itemModelImagePlaceholder.classList.add("hidden");
		} else {
			itemModelImagePreview.src = "";
			itemModelImagePreview.classList.add("hidden");
			itemModelImagePlaceholder.classList.remove("hidden");
		}
	}

	function compressAndEncodeImage(file, maxWidth = 512, maxHeight = 512, quality = 0.8) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = (event) => {
				const img = new Image();
				img.src = event.target.result;
				img.onload = () => {
					const canvas = document.createElement("canvas");
					let width = img.width;
					let height = img.height;

					if (width > height) {
						if (width > maxWidth) {
							height *= maxWidth / width;
							width = maxWidth;
						}
					} else {
						if (height > maxHeight) {
							width *= maxHeight / height;
							height = maxHeight;
						}
					}

					canvas.width = width;
					canvas.height = height;
					const ctx = canvas.getContext("2d");
					ctx.drawImage(img, 0, 0, width, height);

					const dataUrl = canvas.toDataURL("image/jpeg", quality);
					resolve(dataUrl);
				};
				img.onerror = (error) => reject(error);
			};
			reader.onerror = (error) => reject(error);
		});
	}

	// --- KICKSTART ---
	checkAuth();
});
