document.addEventListener("DOMContentLoaded", () => {
	// --- CONFIG & STATE ---
	const API_URL = "https://wot-tau.vercel.app"; // Use the same API URL as your main app
	const ADMIN_TOKEN_KEY = "studyAdminToken";

	let currentBaseItems = [];
	let currentItemModels = [];
	let currentBaseItem = null;
	let currentImageBase64 = null;
	let dataCollections = [];
	let dataPageDocuments = [];
	let dataPage = 1;
	let dataPages = 1;
	let editingDataId = null;
	let searchDebounce;
	let structuredModelSchemas = new Map();
	let structuredModelState = null;
	let structuredModelInitial = null;
	let structuredJsonFields = [];
	let structuredJsonDrafts = new Map();
	let expandedArrayPaths = new Set();
	let referenceDataLists = new Map();
	let fieldInputCounter = 0;
	let pendingDataDocument = null;
	let activeEditorIsStructured = false;

	// --- DOM ELEMENTS ---
	const authGate = document.getElementById("auth-gate");
	const adminPanel = document.getElementById("admin-panel");
	const authPasswordInput = document.getElementById("auth-password-input");
	const authSubmitBtn = document.getElementById("auth-submit-btn");
	const authError = document.getElementById("auth-error");
	const logoutBtn = document.getElementById("logout-btn");
	const showDataManagerBtn = document.getElementById("show-data-manager-btn");
	const showCollectiblesBtn = document.getElementById("show-collectibles-btn");
	const dataManagerView = document.getElementById("data-manager-view");
	const dataModelSelect = document.getElementById("data-model-select");
	const dataSearchInput = document.getElementById("data-search-input");
	const dataRefreshBtn = document.getElementById("data-refresh-btn");
	const dataCreateBtn = document.getElementById("data-create-btn");
	const dataStatus = document.getElementById("data-status");
	const dataRecordsList = document.getElementById("data-records-list");
	const dataPageSummary = document.getElementById("data-page-summary");
	const dataPreviousBtn = document.getElementById("data-previous-btn");
	const dataNextBtn = document.getElementById("data-next-btn");
	const dataEditorModal = document.getElementById("data-editor-modal");
	const dataEditorTitle = document.getElementById("data-editor-title");
	const dataEditorDescription = document.getElementById("data-editor-description");
	const dataEditorFields = document.getElementById("data-editor-fields");
	const dataEditorJsonWrap = document.getElementById("data-editor-json-wrap");
	const dataEditorJson = document.getElementById("data-editor-json");
	const dataEditorError = document.getElementById("data-editor-error");
	const dataEditorCloseBtn = document.getElementById("data-editor-close-btn");
	const dataEditorCancelBtn = document.getElementById("data-editor-cancel-btn");
	const dataEditorSaveBtn = document.getElementById("data-editor-save-btn");
	const dataSaveConfirmation = document.getElementById("data-save-confirmation");
	const dataSaveConfirmationSummary = document.getElementById("data-save-confirmation-summary");
	const dataSaveBackBtn = document.getElementById("data-save-back-btn");
	const dataSaveConfirmBtn = document.getElementById("data-save-confirm-btn");
	const dataEditorFooter = document.getElementById("data-editor-footer");

	async function adminFetch(url, options = {}) {
		const headers = new Headers(options.headers || {});
		const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
		if (token) headers.set("Authorization", `Bearer ${token}`);
		if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
		return fetch(url, { ...options, headers });
	}

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

	const importModelsBtn = document.getElementById("import-models-btn");
	const exportModelsBtn = document.getElementById("export-models-btn");
	const itemModelTextModal = document.getElementById("item-model-text-modal");
	const itemModelTextModalTitle = document.getElementById("item-model-text-modal-title");
	const itemModelTextArea = document.getElementById("item-model-text-area");
	const itemModelTextError = document.getElementById("item-model-text-error");
	const itemModelTextModalButtons = document.getElementById("item-model-text-modal-buttons");

	// --- AUTHORIZATION ---
	async function checkAuth() {
		const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
		if (token) {
			try {
				const response = await adminFetch(`${API_URL}/api/admin/session`);
				if (!response.ok) throw new Error("Admin session expired.");
				authGate.classList.add("hidden");
				adminPanel.classList.remove("hidden");
				await initializeApp();
				return;
			} catch (error) {
				sessionStorage.removeItem(ADMIN_TOKEN_KEY);
			}
		}
		authGate.classList.remove("hidden");
		adminPanel.classList.add("hidden");
	}

	async function signIn() {
		authError.textContent = "";
		authSubmitBtn.disabled = true;
		try {
			const response = await fetch(`${API_URL}/api/admin/session`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ password: authPasswordInput.value }),
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.error || "Unable to sign in.");
			sessionStorage.setItem(ADMIN_TOKEN_KEY, result.token);
			authPasswordInput.value = "";
			await checkAuth();
		} catch (error) {
			authError.textContent = error.message;
		} finally {
			authSubmitBtn.disabled = false;
		}
	}

	authSubmitBtn.addEventListener("click", signIn);
	authPasswordInput.addEventListener("keydown", (event) => {
		if (event.key === "Enter") signIn();
	});

	logoutBtn.addEventListener("click", () => {
		sessionStorage.removeItem(ADMIN_TOKEN_KEY);
		checkAuth();
	});

	// --- INITIALIZATION ---
	async function initializeApp() {
		showAdminSection("data");
		await fetchStructuredModelSchemas();
		await fetchDataCollections();
	}

	showDataManagerBtn.addEventListener("click", () => showAdminSection("data"));
	showCollectiblesBtn.addEventListener("click", () => {
		showAdminSection("collectibles");
		if (currentBaseItem) fetchItemModels(currentBaseItem._id);
		else fetchBaseItems();
	});

	function showAdminSection(section) {
		const isData = section === "data";
		dataManagerView.classList.toggle("hidden", !isData);
		baseItemsView.classList.toggle("hidden", isData || Boolean(currentBaseItem));
		itemModelsView.classList.toggle("hidden", isData || !currentBaseItem);
		showDataManagerBtn.classList.toggle("border-blue-600", isData);
		showDataManagerBtn.classList.toggle("text-blue-700", isData);
		showDataManagerBtn.classList.toggle("border-transparent", !isData);
		showCollectiblesBtn.classList.toggle("border-blue-600", !isData);
		showCollectiblesBtn.classList.toggle("text-blue-700", !isData);
		showCollectiblesBtn.classList.toggle("border-transparent", isData);
	}

	// --- VIEW MANAGEMENT ---
	function showView(viewName) {
		dataManagerView.classList.add("hidden");
		baseItemsView.classList.add("hidden");
		itemModelsView.classList.add("hidden");
		showCollectiblesBtn.classList.add("border-blue-600", "text-blue-700");
		showCollectiblesBtn.classList.remove("border-transparent");
		showDataManagerBtn.classList.remove("border-blue-600", "text-blue-700");
		showDataManagerBtn.classList.add("border-transparent");
		if (viewName === "base-items") {
			baseItemsView.classList.remove("hidden");
		} else if (viewName === "item-models") {
			itemModelsView.classList.remove("hidden");
		}
	}

	function escapeHtml(value) {
		return String(value).replace(/[&<>"']/g, (character) => ({
			"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
		})[character]);
	}

	async function fetchDataCollections() {
		dataStatus.textContent = "Loading data types...";
		try {
			const response = await adminFetch(`${API_URL}/api/admin/data/collections`);
			const result = await response.json();
			if (!response.ok) throw new Error(result.error || "Unable to load data types.");
			dataCollections = result;
			const previousModel = dataModelSelect.value;
			dataModelSelect.innerHTML = dataCollections.map((item) =>
				`<option value="${escapeHtml(item.name)}">${escapeHtml(item.name)} · ${item.count.toLocaleString()}</option>`
			).join("");
			if (dataCollections.some((item) => item.name === previousModel)) dataModelSelect.value = previousModel;
			if (!dataCollections.length) {
				dataStatus.textContent = "No registered models were found.";
				dataRecordsList.innerHTML = "";
				return;
			}
			dataCreateBtn.disabled = dataModelSelect.value === "StudyUser";
			dataCreateBtn.title = dataCreateBtn.disabled ? "Create study users through sign-up so passwords are securely hashed." : "";
			await fetchDataRecords();
		} catch (error) {
			dataStatus.textContent = error.message;
		}
	}

	async function fetchDataRecords() {
		const model = dataModelSelect.value;
		if (!model) return;
		dataStatus.textContent = "Loading records...";
		dataRecordsList.innerHTML = "";
		const params = new URLSearchParams({ page: String(dataPage), limit: "25", search: dataSearchInput.value.trim() });
		try {
			const response = await adminFetch(`${API_URL}/api/admin/data/${encodeURIComponent(model)}?${params}`);
			const result = await response.json();
			if (!response.ok) throw new Error(result.error || "Unable to load records.");
			dataPages = Math.max(1, result.pages);
			dataPage = result.page;
			dataPageDocuments = result.documents;
			renderDataRecords(result.documents);
			dataPageSummary.textContent = `${result.total.toLocaleString()} records · Page ${result.page} of ${dataPages}`;
			dataPreviousBtn.disabled = dataPage <= 1;
			dataNextBtn.disabled = dataPage >= dataPages;
			dataStatus.textContent = result.total ? `${result.documents.length} records shown` : "No matching records.";
		} catch (error) {
			dataStatus.textContent = error.message;
			dataPageSummary.textContent = "";
		}
	}

	function renderDataRecords(documents) {
		if (!documents.length) {
			dataRecordsList.innerHTML = '<tr><td colspan="3" class="px-4 py-10 text-center text-slate-500">No records in this view.</td></tr>';
			return;
		}
		dataRecordsList.innerHTML = documents.map((document) => {
			const id = String(document._id || "");
			const preview = JSON.stringify(document).slice(0, 260);
			return `<tr>
				<td class="px-4 py-3 align-top"><code class="text-xs break-all">${escapeHtml(id)}</code></td>
				<td class="px-4 py-3 align-top"><code class="block max-w-2xl truncate text-xs text-slate-600" title="${escapeHtml(preview)}">${escapeHtml(preview)}</code></td>
				<td class="px-4 py-3 align-top"><div class="flex justify-end gap-2">
					<button data-action="edit" data-id="${escapeHtml(id)}" class="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200">Edit</button>
					<button data-action="delete" data-id="${escapeHtml(id)}" class="px-3 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100">Delete</button>
				</div></td>
			</tr>`;
		}).join("");
	}

	async function fetchStructuredModelSchemas() {
		try {
			const response = await adminFetch(`${API_URL}/api/admin/data/structured-models`);
			const result = await response.json();
			if (!response.ok) throw new Error(result.error || "Unable to load structured editor schemas.");
			structuredModelSchemas = new Map(result.map((model) => [model.name, model.fields]));
		} catch (error) {
			console.error("Unable to load structured editor schemas:", error);
		}
	}

	function cloneData(value) {
		return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
	}

	function labelForField(name) {
		return name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/^./, (letter) => letter.toUpperCase());
	}

	function defaultValueForField(field) {
		if (Object.prototype.hasOwnProperty.call(field, "default")) return cloneData(field.default);
		if (field.type === "object") return defaultValueForFields(field.children || []);
		if (field.type === "array") return [];
		if (field.type === "map") return {};
		if (field.type === "json") return field.name === "pendingDrops" ? [] : {};
		if (field.type === "Boolean") return false;
		if (field.type === "ObjectId") return "";
		if (field.nullable) return null;
		return undefined;
	}

	function defaultValueForFields(fields) {
		const result = {};
		for (const field of fields) {
			const value = defaultValueForField(field);
			if (value !== undefined) result[field.name] = value;
		}
		return result;
	}

	function getValueAtPath(value, path) {
		return path.reduce((current, key) => current == null ? undefined : current[key], value);
	}

	function setValueAtPath(value, path, nextValue) {
		let current = value;
		for (let index = 0; index < path.length - 1; index++) {
			const key = path[index];
			if (current[key] == null) current[key] = typeof path[index + 1] === "number" ? [] : {};
			current = current[key];
		}
		if (path.length) current[path[path.length - 1]] = nextValue;
	}

	function makeInput(field, value, path) {
		const wrapper = document.createElement("div");
		wrapper.className = "min-w-0";
		const label = document.createElement("label");
		label.className = "block text-sm font-medium text-slate-700 mb-1";
		label.textContent = labelForField(field.name);
		if (field.required) {
			const requiredMark = document.createElement("span");
			requiredMark.className = "text-red-700 ml-1";
			requiredMark.textContent = "*";
			label.append(requiredMark);
		}
		wrapper.append(label);

		if (field.sensitive || field.editable === false) {
			const protectedValue = document.createElement("p");
			protectedValue.className = "text-sm text-slate-500 italic p-2 border border-slate-200 rounded bg-slate-50";
			protectedValue.textContent = "Protected value; unchanged on save.";
			wrapper.append(protectedValue);
			return wrapper;
		}

		let input;
		if (field.enum?.length) {
			input = document.createElement("select");
			if (!field.required || value == null) {
				const empty = document.createElement("option");
				empty.value = "";
				empty.textContent = "Select a value";
				input.append(empty);
			}
			for (const optionValue of field.enum) {
				const option = document.createElement("option");
				option.value = String(optionValue);
				option.textContent = String(optionValue);
				input.append(option);
			}
			input.value = value == null ? "" : String(value);
		} else if (field.type === "Boolean") {
			input = document.createElement("input");
			input.type = "checkbox";
			input.checked = Boolean(value);
		} else if (field.type === "json") {
			input = document.createElement("textarea");
			input.className = "font-mono text-xs min-h-32";
			const pathKey = JSON.stringify(path);
			input.value = structuredJsonDrafts.has(pathKey) ? structuredJsonDrafts.get(pathKey) : value === undefined ? "[]" : JSON.stringify(value, null, 2);
			input.dataset.jsonField = "true";
			input.dataset.path = JSON.stringify(path);
			structuredJsonFields.push(input);
		} else {
			const useTextarea = field.type === "String" && ((field.maxlength || 0) >= 200 || /notes|content|details|displayText/i.test(field.name));
			input = document.createElement(useTextarea ? "textarea" : "input");
			if (useTextarea) input.rows = 3;
			else if (field.type === "Number") input.type = "number";
			else if (field.type === "Date") input.type = "datetime-local";
			else input.type = "text";
			if (field.type === "Number") {
				if (field.min !== undefined) input.min = String(field.min);
				if (field.max !== undefined) input.max = String(field.max);
				input.step = "any";
				input.value = value == null ? "" : String(value);
			} else if (field.type === "Date") {
				if (value) {
					const date = new Date(value);
					input.value = Number.isNaN(date.getTime()) ? "" : new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
				}
			} else {
				input.value = value == null ? "" : String(value);
			}
			if (field.maxlength !== undefined) input.maxLength = field.maxlength;
			if (field.ref) {
				let datalist = referenceDataLists.get(field.ref);
				if (!datalist) {
					datalist = document.createElement("datalist");
					datalist.id = `reference-options-${field.ref.toLowerCase()}`;
					referenceDataLists.set(field.ref, datalist);
					dataEditorFields.append(datalist);
				}
				input.setAttribute("list", datalist.id);
				input.placeholder = `Search or enter ${field.ref} ID`;
				input.dataset.referenceModel = field.ref;
			} else if (field.type === "ObjectId") {
				input.placeholder = "ObjectId";
			}
		}

		input.id = `admin-data-field-${++fieldInputCounter}`;
		label.htmlFor = input.id;
		if (field.type === "Boolean") input.classList.add("h-4", "w-4", "accent-blue-700");
		else input.classList.add("w-full", "p-2", "border", "border-slate-300", "rounded-md", "bg-white");
		input.dataset.path = JSON.stringify(path);
		input.dataset.fieldType = field.type;
		if (field.nullable) input.dataset.nullable = "true";
		if (field.required && field.type !== "json") input.required = true;
		wrapper.append(input);
		return wrapper;
	}

	function renderStructuredFields(container, fields, value, parentPath = []) {
		for (const field of fields) {
			const path = [...parentPath, field.name];
			const currentValue = getValueAtPath(value, path);
			if (field.type === "object") {
				const details = document.createElement("details");
				details.className = "border border-slate-200 rounded-md p-3";
				const summary = document.createElement("summary");
				summary.className = "font-semibold text-slate-800 cursor-pointer";
				summary.textContent = labelForField(field.name);
				details.append(summary);
				const children = document.createElement("div");
				children.className = "grid grid-cols-1 md:grid-cols-2 gap-3 pt-3";
				renderStructuredFields(children, field.children || [], value, path);
				details.append(children);
				container.append(details);
			} else if (field.type === "array") {
				const section = document.createElement("section");
				section.className = "border border-slate-200 rounded-md p-3";
				const heading = document.createElement("div");
				heading.className = "flex justify-between items-center gap-3 mb-3";
				const details = document.createElement("details");
				details.className = "min-w-0 flex-1";
				const title = document.createElement("h3");
				title.className = "font-semibold text-slate-800";
				title.textContent = `${labelForField(field.name)} (${Array.isArray(currentValue) ? currentValue.length : 0})`;
				const summary = document.createElement("summary");
				summary.className = "cursor-pointer";
				summary.append(title);
				details.append(summary);
				const addButton = document.createElement("button");
				addButton.type = "button";
				addButton.className = "px-3 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100";
				addButton.textContent = "Add item";
				addButton.dataset.action = "array-add";
				addButton.dataset.path = JSON.stringify(path);
				addButton.dataset.itemDescriptor = JSON.stringify(field.items || { type: "json" });
				heading.append(details, addButton);
				section.append(heading);
				const itemContainer = document.createElement("div");
				itemContainer.className = "pt-2";
				details.append(itemContainer);
				const items = Array.isArray(currentValue) ? currentValue : [];
				const arrayPathKey = JSON.stringify(path);
				details.open = items.length === 0 || expandedArrayPaths.has(arrayPathKey);
				details.addEventListener("toggle", () => {
					if (details.open) expandedArrayPaths.add(arrayPathKey);
					else expandedArrayPaths.delete(arrayPathKey);
				});
				items.forEach((item, index) => {
					const itemPath = [...path, index];
					const itemSection = document.createElement("div");
					itemSection.className = "border-t border-slate-100 py-3";
					const itemHeading = document.createElement("div");
					itemHeading.className = "flex justify-between items-center gap-2 mb-3";
					const itemTitle = document.createElement("span");
					itemTitle.className = "text-sm font-medium text-slate-700";
					itemTitle.textContent = `${labelForField(field.name)} ${index + 1}`;
					const actions = document.createElement("div");
				actions.className = "flex gap-1";
					for (const [action, label] of [["array-up", "Move up"], ["array-down", "Move down"], ["array-remove", "Remove"]]) {
						const button = document.createElement("button");
						button.type = "button";
						button.className = "px-2 py-1 text-xs rounded bg-slate-100 hover:bg-slate-200";
						button.textContent = label;
						button.dataset.action = action;
						button.dataset.path = JSON.stringify(path);
						button.dataset.index = String(index);
						actions.append(button);
					}
					itemHeading.append(itemTitle, actions);
					itemSection.append(itemHeading);
					if (field.items?.type === "object") {
						const childGrid = document.createElement("div");
						childGrid.className = "grid grid-cols-1 md:grid-cols-2 gap-3";
						renderStructuredFields(childGrid, field.items.children || [], value, itemPath);
						itemSection.append(childGrid);
					} else {
						itemSection.append(makeInput({ ...field.items, name: `${field.name} item`, required: false }, item, itemPath));
						const arrayInput = itemSection.querySelector("[data-path]");
						if (arrayInput) arrayInput.dataset.arrayItem = "true";
					}
					itemContainer.append(itemSection);
				});
				container.append(section);
			} else if (field.type === "map") {
				const section = document.createElement("section");
				section.className = "border border-slate-200 rounded-md p-3";
				section.dataset.mapPath = JSON.stringify(path);
				const heading = document.createElement("div");
				heading.className = "flex justify-between items-center gap-3 mb-2";
				const title = document.createElement("h3");
				title.className = "font-semibold text-slate-800";
				title.textContent = labelForField(field.name);
				const addButton = document.createElement("button");
				addButton.type = "button";
				addButton.className = "px-3 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100";
				addButton.textContent = "Add key";
				addButton.dataset.action = "map-add";
				addButton.dataset.path = JSON.stringify(path);
				addButton.dataset.itemType = field.items?.type || "String";
				heading.append(title, addButton);
				section.append(heading);
				const entries = currentValue instanceof Map ? [...currentValue.entries()] : Object.entries(currentValue || {});
				for (const [key, entryValue] of entries) {
					section.append(createMapRow(path, key, entryValue, field.items?.type || "String"));
				}
				container.append(section);
			} else {
				container.append(makeInput(field, currentValue, path));
			}
		}
	}

	function createMapRow(path, key, value, type) {
		const row = document.createElement("div");
		row.className = "grid grid-cols-[1fr_1fr_auto] gap-2 mb-2";
		row.dataset.mapRow = "true";
		row.dataset.path = JSON.stringify(path);
		const keyInput = document.createElement("input");
		keyInput.type = "text";
		keyInput.value = key;
		keyInput.placeholder = "Key";
		keyInput.className = "p-2 border border-slate-300 rounded-md min-w-0";
		keyInput.dataset.mapKey = "true";
		const valueInput = document.createElement("input");
		valueInput.type = type === "Number" ? "number" : "text";
		valueInput.value = value == null ? "" : String(value);
		valueInput.placeholder = "Value";
		valueInput.className = "p-2 border border-slate-300 rounded-md min-w-0";
		valueInput.dataset.mapValueType = type;
		const removeButton = document.createElement("button");
		removeButton.type = "button";
		removeButton.textContent = "Remove";
		removeButton.className = "px-2 rounded bg-slate-100 hover:bg-slate-200";
		removeButton.dataset.action = "map-remove";
		row.append(keyInput, valueInput, removeButton);
		return row;
	}

	function syncMapSection(section) {
		const path = JSON.parse(section.dataset.mapPath);
		const itemType = section.querySelector("[data-action='map-add']")?.dataset.itemType || section.querySelector("[data-map-value-type]")?.dataset.mapValueType || "String";
		const result = {};
		for (const row of section.querySelectorAll("[data-map-row]")) {
			const key = row.querySelector("[data-map-key]").value.trim();
			if (!key) continue;
			const input = row.querySelector("[data-map-value-type]");
			const raw = input.value;
			if (itemType === "Number" && raw === "") continue;
			result[key] = itemType === "Number" ? Number(raw) : raw;
		}
		setValueAtPath(structuredModelState, path, result);
	}

	function updateStructuredInput(input) {
		const path = JSON.parse(input.dataset.path);
		let value;
		if (input.type === "checkbox") value = input.checked;
		else if (input.dataset.fieldType === "Number") {
			value = input.value === "" ? (input.dataset.nullable ? null : undefined) : Number(input.value);
		} else if (input.dataset.fieldType === "Date") {
			const date = input.value ? new Date(input.value) : null;
			value = date && !Number.isNaN(date.getTime()) ? date.toISOString() : (input.dataset.nullable ? null : undefined);
		} else value = input.value;
		setValueAtPath(structuredModelState, path, value);
	}

	function renderStructuredEditor() {
		dataEditorFields.replaceChildren();
		structuredJsonFields = [];
		referenceDataLists = new Map();
		renderStructuredFields(dataEditorFields, structuredModelSchemas.get(dataModelSelect.value) || [], structuredModelState);
		populateReferenceSuggestions();
	}

	async function populateReferenceSuggestions() {
		const referenceInputs = [...dataEditorFields.querySelectorAll("[data-reference-model]")];
		const referenceModels = [...new Set(referenceInputs.map((input) => input.dataset.referenceModel))];
		await Promise.all(referenceModels.map(async (model) => {
			try {
				const response = await adminFetch(`${API_URL}/api/admin/data/${encodeURIComponent(model)}?page=1&limit=100`);
				const result = await response.json();
				if (!response.ok) return;
				const datalist = referenceDataLists.get(model);
				if (!datalist) return;
				for (const record of result.documents) {
					const option = document.createElement("option");
					option.value = String(record._id);
					option.label = String(record.username || record.name || record.email || record.studyDay || record._id);
					datalist.append(option);
				}
			} catch (error) {
				console.warn(`Unable to load ${model} reference suggestions:`, error);
			}
		}));
	}

	function openDataEditor(record = null) {
		editingDataId = record ? String(record._id) : null;
		pendingDataDocument = null;
		structuredJsonDrafts = new Map();
		activeEditorIsStructured = structuredModelSchemas.has(dataModelSelect.value);
		dataEditorTitle.textContent = editingDataId ? `Edit ${dataModelSelect.value} record` : `New ${dataModelSelect.value} record`;
		dataEditorError.textContent = "";
		setSaveConfirmationVisible(false);
		dataEditorModal.classList.remove("hidden");
		dataEditorModal.classList.add("flex");
		if (activeEditorIsStructured) {
			dataEditorDescription.textContent = dataModelSelect.value === "StudyUser" && !editingDataId
				? "Create study users through sign-up so password and recovery-answer values are securely hashed."
				: "Expand sections to edit fields. Protected credentials remain unchanged.";
			dataEditorFields.classList.remove("hidden");
			dataEditorJsonWrap.classList.add("hidden");
			structuredModelInitial = cloneData(record || defaultValueForFields(structuredModelSchemas.get(dataModelSelect.value)));
			structuredModelState = cloneData(structuredModelInitial);
			renderStructuredEditor();
			if (dataModelSelect.value === "StudyUser" && !editingDataId) {
				dataEditorError.textContent = "StudyUser creation is disabled here; use the sign-up workflow to securely hash credentials.";
				dataEditorSaveBtn.disabled = true;
			} else dataEditorSaveBtn.disabled = false;
		} else {
			dataEditorDescription.textContent = "Edit the document as JSON. Keep the document structure valid.";
			dataEditorFields.classList.add("hidden");
			dataEditorJsonWrap.classList.remove("hidden");
			dataEditorJson.value = JSON.stringify(record || {}, null, 2);
			dataEditorSaveBtn.disabled = false;
			dataEditorJson.focus();
		}
	}

	function setSaveConfirmationVisible(visible) {
		dataSaveConfirmation.classList.toggle("hidden", !visible);
		dataEditorFooter.classList.toggle("hidden", visible);
		if (!visible) dataEditorError.textContent = "";
	}

	function closeDataEditor() {
		dataEditorModal.classList.add("hidden");
		dataEditorModal.classList.remove("flex");
		pendingDataDocument = null;
		structuredModelState = null;
		structuredModelInitial = null;
		structuredJsonDrafts.clear();
		dataEditorSaveBtn.disabled = false;
	}

	function removeRedactionPlaceholders(value) {
		if (Array.isArray(value)) return value.map(removeRedactionPlaceholders);
		if (!value || typeof value !== "object") return value;
		return Object.fromEntries(Object.entries(value)
			.filter(([, item]) => item !== "[REDACTED]")
			.map(([key, item]) => [key, removeRedactionPlaceholders(item)]));
	}

	function collectStructuredDocument() {
		for (const section of dataEditorFields.querySelectorAll("[data-map-path]")) syncMapSection(section);
		for (const field of structuredJsonFields) {
			const path = JSON.parse(field.dataset.path);
			let value;
			try {
				value = JSON.parse(field.value);
			} catch (error) {
				field.setCustomValidity(`Enter valid JSON: ${error.message}`);
				field.reportValidity();
				throw new Error(`${labelForField(path[path.length - 1])} must contain valid JSON.`);
			}
			field.setCustomValidity("");
			setValueAtPath(structuredModelState, path, value);
		}
		const invalidInput = dataEditorFields.querySelector(":invalid");
		if (invalidInput) {
			for (const details of dataEditorFields.querySelectorAll("details")) details.open = true;
			invalidInput.reportValidity();
			throw new Error("Review the highlighted fields before saving.");
		}
		return removeRedactionPlaceholders(cloneData(structuredModelState));
	}

	function countChangedValues(before, after) {
		if (JSON.stringify(before) === JSON.stringify(after)) return 0;
		if (Array.isArray(before) && Array.isArray(after)) {
			const length = Math.max(before.length, after.length);
			let changes = 0;
			for (let index = 0; index < length; index++) changes += countChangedValues(before[index], after[index]);
			return changes || 1;
		}
		if (before && after && typeof before === "object" && typeof after === "object" && !Array.isArray(before) && !Array.isArray(after)) {
			const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
			let changes = 0;
			for (const key of keys) {
				if (before[key] === "[REDACTED]" || after[key] === "[REDACTED]") continue;
				changes += countChangedValues(before[key], after[key]);
			}
			return changes;
		}
		return 1;
	}

	function reviewDataSave() {
		dataEditorError.textContent = "";
		try {
			if (activeEditorIsStructured) pendingDataDocument = collectStructuredDocument();
			else {
				const documentValue = JSON.parse(dataEditorJson.value);
				if (!documentValue || Array.isArray(documentValue) || typeof documentValue !== "object") throw new Error("The document must be a JSON object.");
				pendingDataDocument = removeRedactionPlaceholders(documentValue);
			}
			const changes = editingDataId ? countChangedValues(removeRedactionPlaceholders(structuredModelInitial || dataPageDocuments.find((item) => String(item._id) === editingDataId)), pendingDataDocument) : Object.keys(pendingDataDocument).length;
			const action = editingDataId ? "Save edits to" : "Create";
			dataSaveConfirmationSummary.textContent = `${action} ${dataModelSelect.value}${editingDataId ? ` record ${editingDataId}` : " record"}? ${changes} changed field${changes === 1 ? "" : "s"} will be submitted.`;
			setSaveConfirmationVisible(true);
			dataSaveConfirmBtn.focus();
		} catch (error) {
			dataEditorError.textContent = error.message;
		}
	}

	async function saveDataRecord() {
		if (!pendingDataDocument) return;
		const model = encodeURIComponent(dataModelSelect.value);
		const url = editingDataId
			? `${API_URL}/api/admin/data/${model}/${encodeURIComponent(editingDataId)}`
			: `${API_URL}/api/admin/data/${model}`;
		dataSaveConfirmBtn.disabled = true;
		try {
			const response = await adminFetch(url, {
				method: editingDataId ? "PUT" : "POST",
				body: JSON.stringify(pendingDataDocument),
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.error || "Unable to save record.");
			closeDataEditor();
			await fetchDataCollections();
		} catch (error) {
			dataEditorError.textContent = error.message;
		} finally {
			dataSaveConfirmBtn.disabled = false;
		}
	}

	dataEditorFields.addEventListener("input", (event) => {
		if (event.target.dataset.jsonField) {
			structuredJsonDrafts.set(event.target.dataset.path, event.target.value);
			return;
		}
		const input = event.target.closest("[data-path]:not([data-json-field])");
		if (input && input.dataset.fieldType) updateStructuredInput(input);
		const mapSection = event.target.closest("[data-map-path]");
		if (mapSection) syncMapSection(mapSection);
	});
	dataEditorFields.addEventListener("change", (event) => {
		const input = event.target.closest("[data-path]:not([data-json-field])");
		if (input && input.dataset.fieldType) updateStructuredInput(input);
	});
	dataEditorFields.addEventListener("click", (event) => {
		const button = event.target.closest("button[data-action]");
		if (!button) return;
		const path = JSON.parse(button.dataset.path);
		if (button.dataset.action.startsWith("array-")) {
			const current = getValueAtPath(structuredModelState, path) || [];
				if (button.dataset.action === "array-add") {
					current.push(defaultValueForField(JSON.parse(button.dataset.itemDescriptor)));
					expandedArrayPaths.add(JSON.stringify(path));
				}
			else {
				const index = Number(button.dataset.index);
				if (button.dataset.action === "array-remove") current.splice(index, 1);
				if (button.dataset.action === "array-up" && index > 0) [current[index - 1], current[index]] = [current[index], current[index - 1]];
				if (button.dataset.action === "array-down" && index < current.length - 1) [current[index + 1], current[index]] = [current[index], current[index + 1]];
			}
			setValueAtPath(structuredModelState, path, current);
			renderStructuredEditor();
		} else if (button.dataset.action === "map-add") {
			const section = button.closest("[data-map-path]");
			syncMapSection(section);
			section.append(createMapRow(path, "", "", button.dataset.itemType));
		} else if (button.dataset.action === "map-remove") {
			const section = button.closest("[data-map-path]");
			button.closest("[data-map-row]").remove();
			syncMapSection(section);
		}
	});

	dataModelSelect.addEventListener("change", () => {
		dataPage = 1;
		const isStudyUser = dataModelSelect.value === "StudyUser";
		dataCreateBtn.disabled = isStudyUser;
		dataCreateBtn.title = isStudyUser ? "Create study users through sign-up so passwords are securely hashed." : "";
		fetchDataRecords();
	});
	dataSearchInput.addEventListener("input", () => {
		clearTimeout(searchDebounce);
		searchDebounce = setTimeout(() => { dataPage = 1; fetchDataRecords(); }, 250);
	});
	dataRefreshBtn.addEventListener("click", fetchDataCollections);
	dataCreateBtn.addEventListener("click", () => openDataEditor());
	dataPreviousBtn.addEventListener("click", () => { if (dataPage > 1) { dataPage--; fetchDataRecords(); } });
	dataNextBtn.addEventListener("click", () => { if (dataPage < dataPages) { dataPage++; fetchDataRecords(); } });
	dataEditorCloseBtn.addEventListener("click", closeDataEditor);
	dataEditorCancelBtn.addEventListener("click", closeDataEditor);
	dataEditorSaveBtn.addEventListener("click", reviewDataSave);
	dataSaveBackBtn.addEventListener("click", () => setSaveConfirmationVisible(false));
	dataSaveConfirmBtn.addEventListener("click", saveDataRecord);
	dataEditorModal.addEventListener("click", (event) => { if (event.target === dataEditorModal) closeDataEditor(); });
	dataRecordsList.addEventListener("click", async (event) => {
		const button = event.target.closest("button[data-action]");
		if (!button) return;
		const documentId = button.dataset.id;
		if (button.dataset.action === "edit") {
			const document = dataPageDocuments.find((item) => String(item._id) === documentId);
			if (document) openDataEditor(document);
			else dataStatus.textContent = "Record is no longer on this page. Refresh and try again.";
		} else if (button.dataset.action === "delete" && confirm(`Permanently delete this ${dataModelSelect.value} record? This cannot be undone.`)) {
			try {
				const response = await adminFetch(`${API_URL}/api/admin/data/${encodeURIComponent(dataModelSelect.value)}/${encodeURIComponent(documentId)}`, { method: "DELETE" });
				const result = await response.json();
				if (!response.ok) throw new Error(result.error || "Unable to delete record.");
				await fetchDataCollections();
			} catch (error) {
				dataStatus.textContent = error.message;
			}
		}
	});

	backToBaseItemsBtn.addEventListener("click", () => {
		currentBaseItem = null;
		showView("base-items");
	});

	// --- API CALLS ---
	async function fetchBaseItems() {
		try {
			const response = await adminFetch(`${API_URL}/api/admin/base-items`);
			currentBaseItems = await response.json();
			renderBaseItems();
		} catch (error) {
			console.error("Error fetching base items:", error);
		}
	}

	async function fetchItemModels(baseItemId) {
		try {
			const response = await adminFetch(`${API_URL}/api/admin/item-models?baseItemId=${baseItemId}`);
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

	importModelsBtn.addEventListener("click", () => openItemModelTextModal("import"));
	exportModelsBtn.addEventListener("click", () => openItemModelTextModal("export"));

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

			const originalItem = { ...currentBaseItems[itemIndex] };
			currentBaseItems[itemIndex] = { ...originalItem, ...data };
			renderBaseItems();

			try {
				const response = await adminFetch(`${API_URL}/api/admin/base-items/${id}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
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
			const optimisticItem = { ...data, _id: tempId };
			currentBaseItems.push(optimisticItem);
			renderBaseItems();

			try {
				const response = await adminFetch(`${API_URL}/api/admin/base-items`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
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
					const response = await adminFetch(`${API_URL}/api/admin/base-items/${id}`, { method: "DELETE" });
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

			// --- Helper logic to find and display overridden stats ---
			let statsDisplay = "";
			const customStats = [];
			const defaultStats = currentBaseItem.defaultStats;

			if (model.modelStats?.weightRange?.length && model.modelStats.weightRange.join(",") !== defaultStats.weightRange.join(",")) {
				customStats.push(`<span class="font-semibold">Weight:</span> ${model.modelStats.weightRange.join(", ")}`);
			}
			if (model.modelStats?.priceRange?.length && model.modelStats.priceRange.join(",") !== defaultStats.priceRange.join(",")) {
				customStats.push(`<span class="font-semibold">Price:</span> ${model.modelStats.priceRange.join(", ")}`);
			}
			if (model.modelStats?.aestheticRange?.length && model.modelStats.aestheticRange.join(",") !== defaultStats.aestheticRange.join(",")) {
				customStats.push(`<span class="font-semibold">Aesthetic:</span> ${model.modelStats.aestheticRange.join(", ")}`);
			}

			if (customStats.length > 0) {
				statsDisplay = `
                    <div class="text-xs mt-1 text-sky-600 dark:text-sky-400">
                        <strong>Overrides:</strong> ${customStats.join(" | ")}
                    </div>
                `;
			}
			// --- End helper logic ---

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
                    ${statsDisplay}
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

			const originalModel = { ...currentItemModels[modelIndex] };
			currentItemModels[modelIndex] = { ...originalModel, ...data };
			renderItemModels();

			try {
				const response = await adminFetch(`${API_URL}/api/admin/item-models/${id}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
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
			const optimisticModel = { ...data, _id: tempId };
			currentItemModels.push(optimisticModel);
			renderItemModels();

			try {
				const response = await adminFetch(`${API_URL}/api/admin/item-models`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
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
					const response = await adminFetch(`${API_URL}/api/admin/item-models/${id}`, { method: "DELETE" });
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

	function openItemModelTextModal(mode) {
		itemModelTextError.textContent = "";
		itemModelTextModalButtons.innerHTML = "";

		if (mode === "import") {
			itemModelTextModalTitle.textContent = `Import Models for ${currentBaseItem.name}`;
			itemModelTextArea.value = "";
			itemModelTextArea.readOnly = false;
			itemModelTextModalButtons.innerHTML = `
                <button type="button" class="cancel-text-modal-btn bg-slate-200 py-2 px-4 rounded-md">Cancel</button>
                <button id="import-text-btn" class="bg-green-600 text-white py-2 px-4 rounded-md">Import</button>
            `;
			document.getElementById("import-text-btn").addEventListener("click", handleImportModels);
		} else {
			// 'export' mode is now 'export/edit'
			itemModelTextModalTitle.textContent = `Export / Edit Models from ${currentBaseItem.name}`;
			itemModelTextArea.value = generateModelsAsText();
			itemModelTextArea.readOnly = false; // Make it editable
			itemModelTextModalButtons.innerHTML = `
                <button type="button" class="cancel-text-modal-btn bg-slate-200 py-2 px-4 rounded-md">Close</button>
                <button id="copy-text-btn" class="bg-blue-600 text-white py-2 px-4 rounded-md">Copy to Clipboard</button>
                <button id="save-text-edit-btn" class="bg-yellow-500 text-white py-2 px-4 rounded-md">Save Changes</button>
            `;
			document.getElementById("copy-text-btn").addEventListener("click", () => {
				navigator.clipboard.writeText(itemModelTextArea.value).then(() => {
					alert("Copied to clipboard!");
				});
			});
			// Add listener for the new save button
			document.getElementById("save-text-edit-btn").addEventListener("click", handleEditModelsAsText);
		}

		itemModelTextModal.querySelector(".cancel-text-modal-btn").addEventListener("click", closeItemModelTextModal);
		itemModelTextModal.classList.remove("hidden");
		itemModelTextModal.classList.add("flex");
	}

	function closeItemModelTextModal() {
		itemModelTextModal.classList.add("hidden");
		itemModelTextModal.classList.remove("flex");
	}

	function generateModelsAsText() {
		return currentItemModels
			.map((model) => {
				let text = `name: ${model.name}\n`;
				text += `modelId: ${model.modelId}\n`;
				text += `rarity: ${model.rarity}\n`;
				if (model.colorOptions && model.colorOptions.length > 0) {
					text += `colors: ${model.colorOptions.join(",")}\n`;
				}
				if (model.modelStats?.weightRange?.length > 0) {
					text += `weight: ${model.modelStats.weightRange.join(",")}\n`;
				}
				if (model.modelStats?.priceRange?.length > 0) {
					text += `price: ${model.modelStats.priceRange.join(",")}\n`;
				}
				if (model.modelStats?.aestheticRange?.length > 0) {
					text += `aesthetic: ${model.modelStats.aestheticRange.join(",")}\n`;
				}
				if (model.limitedEdition?.isLimited) {
					text += `limited: true\n`;
					text += `maxSerial: ${model.limitedEdition.maxSerial}\n`;
				}
				// Note: Image data (imageBase64) is not exported to keep the text clean and human-readable.
				return text;
			})
			.join("---\n");
	}

	function parseTextToModels(text) {
		const modelBlocks = text.split(/\n---\n/);
		const models = [];
		let error = null;

		modelBlocks.forEach((block, index) => {
			if (block.trim() === "") return;
			const model = {};
			const lines = block.trim().split("\n");

			lines.forEach((line) => {
				const parts = line.split(":");
				const key = parts[0].trim().toLowerCase();
				const value = parts.slice(1).join(":").trim();

				switch (key) {
					case "name":
						model.name = value;
						break;
					case "modelid":
						model.modelId = value;
						break;
					case "rarity":
						model.rarity = value.toLowerCase();
						break;
					case "colors":
						model.colorOptions = value
							.split(",")
							.map((c) => c.trim())
							.filter(Boolean);
						break;
					case "weight":
						(model.modelStats = model.modelStats || {}).weightRange = value.split(",").map(Number);
						break;
					case "price":
						(model.modelStats = model.modelStats || {}).priceRange = value.split(",").map(Number);
						break;
					case "aesthetic":
						(model.modelStats = model.modelStats || {}).aestheticRange = value.split(",").map(Number);
						break;
					case "limited":
						(model.limitedEdition = model.limitedEdition || {}).isLimited = value === "true";
						break;
					case "maxserial":
						(model.limitedEdition = model.limitedEdition || {}).maxSerial = Number(value);
						break;
				}
			});

			// Basic validation for required fields
			if (!model.name || !model.modelId || !model.rarity) {
				error = `Model #${index + 1} is missing required fields (name, modelId, rarity).`;
			}

			models.push(model);
		});

		if (error) {
			throw new Error(error);
		}

		return models;
	}

	async function handleImportModels() {
		const text = itemModelTextArea.value;
		try {
			const models = parseTextToModels(text);
			if (models.length === 0) {
				itemModelTextError.textContent = "No models found in the text.";
				return;
			}

			const response = await adminFetch(`${API_URL}/api/admin/base-items/${currentBaseItem._id}/batch-models`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ models }),
			});

			if (!response.ok) {
				const errData = await response.json();
				throw new Error(errData.error || "Server error during import.");
			}

			closeItemModelTextModal();
			await fetchItemModels(currentBaseItem._id); // Refresh list from server to show new models
		} catch (error) {
			itemModelTextError.textContent = error.message;
			console.error("Import error:", error);
		}
	}

	async function handleEditModelsAsText() {
		const text = itemModelTextArea.value;
		try {
			const models = parseTextToModels(text);

			if (!confirm(`This will replace all existing models for "${currentBaseItem.name}" with the content from the text area. Are you sure you want to proceed?`)) {
				return;
			}

			const response = await adminFetch(`${API_URL}/api/admin/base-items/${currentBaseItem._id}/batch-models`, {
				method: "PUT", // Using PUT for replacement
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ models }),
			});

			if (!response.ok) {
				const errData = await response.json();
				throw new Error(errData.error || "Server error during update.");
			}

			closeItemModelTextModal();
			await fetchItemModels(currentBaseItem._id); // Refresh list
		} catch (error) {
			itemModelTextError.textContent = error.message;
			console.error("Text edit error:", error);
		}
	}

	// --- KICKSTART ---
	checkAuth();
});
