// ==========================================
// FLASHCARDS FEATURE
// ==========================================

window.StudyApp = window.StudyApp || {};

var draggedItem = null;
var textModalMode = null;

	async function saveFlashcardSetOrder(orderedIds) {
		try {
			await fetch(`${API_URL}/api/study/flashcard-sets/reorder`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orderedIds }),
			});
		} catch (error) {
			console.error("Failed to save flashcard set order:", error);
		}
	}


	// ==========================================
	// FLASHCARD API CALLS
	// ==========================================
	async function loadFlashcardSets() {
		if (!currentUser) return;
		try {
			const response = await fetch(`${API_URL}/api/study/flashcard-sets?userId=${currentUser.id}`);
			flashcardSets = await response.json();
			renderFlashcardSets();
		} catch (error) {
			console.error("Failed to load flashcard sets:", error);
		}
	}

	async function saveFlashcardSet(id, name, subject, flashcards = null) {
		const isEditing = !!id;
		closeSetModal();

		const updateData = { name, subject, userId: currentUser.id };
		if (flashcards !== null) {
			updateData.flashcards = flashcards; // Add flashcards array if it's provided
		}

		if (isEditing) {
			const setIndex = flashcardSets.findIndex((s) => s._id === id);
			if (setIndex === -1) return;

			const originalSet = { ...flashcardSets[setIndex] };
			flashcardSets[setIndex] = { ...originalSet, ...updateData };
			renderFlashcardSets();

			try {
				const response = await fetch(`${API_URL}/api/study/flashcard-sets/${id}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(updateData),
				});
				if (!response.ok) throw new Error("Failed to save set");
				// If we updated text, we need to refresh the single set view
				if (flashcards !== null) {
					currentFlashcardSet = await response.json();
					renderSingleSetView(currentFlashcardSet);
				}
			} catch (error) {
				console.error("Error updating flashcard set:", error);
				flashcardSets[setIndex] = originalSet;
				renderFlashcardSets();
				alert("Failed to update the set. Please try again.");
			}
		} else {
			// Logic for creating a new set remains the same
			const tempId = `temp_${Date.now()}`;
			const newSet = { _id: tempId, name, subject, flashcards: flashcards || [], userId: currentUser.id };
			flashcardSets.push(newSet);
			renderFlashcardSets();

			try {
				const response = await fetch(`${API_URL}/api/study/flashcard-sets`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(newSet),
				});
				if (!response.ok) throw new Error("Failed to create set");
				const createdSet = await response.json();
				const tempIndex = flashcardSets.findIndex((s) => s._id === tempId);
				if (tempIndex !== -1) {
					flashcardSets[tempIndex] = createdSet;
				}
				renderFlashcardSets();
			} catch (error) {
				console.error("Error creating flashcard set:", error);
				flashcardSets = flashcardSets.filter((s) => s._id !== tempId);
				renderFlashcardSets();
				alert("Failed to create the set. Please try again.");
			}
		}
	}

	async function deleteFlashcardSet(setId) {
		if (!confirm("Are you sure you want to delete this entire set? This action cannot be undone.")) return;

		// --- Optimistic Update ---
		const setIndex = flashcardSets.findIndex((s) => s._id === setId);
		if (setIndex === -1) return;
		const deletedSet = flashcardSets[setIndex]; // Backup
		flashcardSets.splice(setIndex, 1); // Remove from local state
		renderFlashcardSets(); // Update UI

		try {
			const response = await fetch(`${API_URL}/api/study/flashcard-sets/${setId}`, { method: "DELETE" });
			if (!response.ok) throw new Error("Failed to delete set");
			// Success, no further action needed
		} catch (error) {
			console.error("Error deleting set:", error);
			// --- Revert on Failure ---
			flashcardSets.splice(setIndex, 0, deletedSet); // Add back to original position
			renderFlashcardSets();
			alert("Failed to delete the set. Please try again.");
		}
	}

	async function saveFlashcard(setId, cardId, front, back) {
		const isEditing = !!cardId;
		closeCardModal();

		const set = currentFlashcardSet;
		if (!set) return;

		if (isEditing) {
			// --- Optimistic Update for EDIT ---
			const cardIndex = set.flashcards.findIndex((c) => c._id === cardId);
			if (cardIndex === -1) return;

			const originalCard = { ...set.flashcards[cardIndex] };
			set.flashcards[cardIndex] = { ...originalCard, front, back };
			renderSingleSetView(set);

			try {
				const response = await fetch(`${API_URL}/api/study/flashcard-sets/${setId}/cards/${cardId}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ front, back }),
				});
				if (!response.ok) throw new Error("Failed to save card");
				// Success
			} catch (error) {
				console.error("Error updating card:", error);
				// --- Revert ---
				set.flashcards[cardIndex] = originalCard;
				renderSingleSetView(set);
				alert("Failed to update the card.");
			}
		} else {
			// --- Optimistic Update for CREATE ---
			const tempId = `temp_card_${Date.now()}`;
			const newCard = { _id: tempId, front, back };
			set.flashcards.push(newCard);
			renderSingleSetView(set);

			try {
				const response = await fetch(`${API_URL}/api/study/flashcard-sets/${setId}/cards`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ front, back }),
				});
				if (!response.ok) throw new Error("Failed to create card");
				const updatedSet = await response.json();
				// --- Replace local set with updated from server to get correct IDs ---
				currentFlashcardSet = updatedSet;
				const setIndex = flashcardSets.findIndex((s) => s._id === setId);
				if (setIndex !== -1) flashcardSets[setIndex] = updatedSet;
				renderSingleSetView(updatedSet);
			} catch (error) {
				console.error("Error creating card:", error);
				// --- Revert ---
				set.flashcards = set.flashcards.filter((c) => c._id !== tempId);
				renderSingleSetView(set);
				alert("Failed to create the card.");
			}
		}
	}

	async function deleteFlashcard(setId, cardId) {
		if (!confirm("Delete this card?")) return;

		const set = currentFlashcardSet;
		if (!set) return;

		// --- Optimistic Update ---
		const cardIndex = set.flashcards.findIndex((c) => c._id === cardId);
		if (cardIndex === -1) return;

		const deletedCard = set.flashcards[cardIndex];
		set.flashcards.splice(cardIndex, 1);
		renderSingleSetView(set);

		try {
			const response = await fetch(`${API_URL}/api/study/flashcard-sets/${setId}/cards/${cardId}`, { method: "DELETE" });
			if (!response.ok) throw new Error("Failed to delete card");
			// Success
		} catch (error) {
			console.error("Error deleting card:", error);
			// --- Revert ---
			set.flashcards.splice(cardIndex, 0, deletedCard);
			renderSingleSetView(set);
			alert("Failed to delete the card.");
		}
	}

	async function saveCardOrder(setId, orderedIds) {
		const originalOrder = [...currentFlashcardSet.flashcards]; // Backup current order
		try {
			const response = await fetch(`${API_URL}/api/study/flashcard-sets/${setId}/reorder-cards`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orderedIds }),
			});
			if (!response.ok) throw new Error("Failed to save new order");
			// Success, the local state is already correct.
		} catch (error) {
			console.error("Error saving card order:", error);
			// --- Revert on Failure ---
			currentFlashcardSet.flashcards = originalOrder;
			renderSingleSetView(currentFlashcardSet);
			alert("Could not save the new card order. Please try again.");
		}
	}

	// ==========================================
	// FLASHCARD RENDERING & LOGIC
	// ==========================================

	function renderFlashcardSets() {
		// Destroy existing sortable before re-rendering
		if (flashcardSetSortableInstance) {
			flashcardSetSortableInstance.destroy();
			flashcardSetSortableInstance = null;
		}

		flashcardSetsGrid.innerHTML = "";
		if (flashcardSets.length === 0) {
			flashcardSetsGrid.innerHTML = `<p class="text-slate-500 dark:text-slate-400 col-span-full text-center">You haven't created any flashcard sets yet. Click "Create New Set" to start!</p>`;
			return;
		}
		flashcardSets.forEach((set) => {
			const el = document.createElement("div");
			el.className = "set-card group relative bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm cursor-pointer hover:shadow-lg transition-shadow";
			el.dataset.setId = set._id;
			el.innerHTML = `
                <div class="set-drag-handle absolute top-2 left-2 cursor-grab text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity z-10" title="Drag to reorder">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                </div>
                <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button data-action="edit" class="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button data-action="delete" class="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-red-200 dark:hover:bg-red-800/50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
                <p class="font-bold text-lg text-slate-800 dark:text-slate-100 mt-4">${set.name}</p>
                <p class="text-sm text-slate-500 dark:text-slate-400" style="color:${getColorForSubject(set.subject)};">${set.subject}</p>
                <p class="text-sm text-slate-400 dark:text-slate-500 mt-2">${set.flashcards.length} cards</p>
            `;
			flashcardSetsGrid.appendChild(el);
		});

		flashcardSetSortableInstance = new Sortable(flashcardSetsGrid, {
			animation: 150,
			handle: ".set-drag-handle",
			ghostClass: "sortable-ghost",
			dragClass: "sortable-drag",
			onEnd: (evt) => {
				const newOrderedIds = [...evt.to.children].map((el) => el.dataset.setId);
				const setMap = new Map(flashcardSets.map((s) => [s._id, s]));
				flashcardSets = newOrderedIds.map((id) => setMap.get(id)).filter(Boolean);
				saveFlashcardSetOrder(newOrderedIds);
			},
		});
	}

	function renderSingleSetView(set) {
		// Destroy any existing Sortable instance to prevent memory leaks
		if (sortableInstance) {
			sortableInstance.destroy();
			sortableInstance = null;
		}

		currentFlashcardSet = set;
		singleSetName.textContent = set.name;
		singleSetSubject.textContent = set.subject;
		singleSetCardsGrid.innerHTML = "";

		if (set.flashcards.length === 0) {
			singleSetCardsGrid.innerHTML = `<p class="text-slate-500 dark:text-slate-400 col-span-full text-center">This set is empty. Click "Add/Edit Cards" to create your first flashcard.</p>`;
		} else {
			set.flashcards.forEach((card, index) => {
				const el = document.createElement("div");
				el.className = "flashcard-preview-container group perspective";
				el.dataset.cardId = card._id;

				el.innerHTML = `
                    <div class="drag-handle" title="Drag to reorder">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>
                    </div>
                    <div class="card-preview-flipper">
                        <div class="card-preview-face front">${parseMarkdown(card.front)}</div>
                        <div class="card-preview-face back">${parseMarkdown(card.back)}</div>
                    </div>
                    <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button data-action="edit-card" data-card-id="${card._id}" class="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button data-action="delete-card" data-card-id="${card._id}" class="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-red-200 dark:hover:bg-red-800/50">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                `;
				singleSetCardsGrid.appendChild(el);
			});

			// ADDED: Initialize Sortable.js after rendering the cards
			sortableInstance = new Sortable(singleSetCardsGrid, {
				animation: 150, // ms, for smooth animation
				handle: ".drag-handle", // Restrict drag start to this handle
				ghostClass: "sortable-ghost", // Class for the drop placeholder
				dragClass: "sortable-drag", // Class for the item being dragged
				onEnd: (evt) => {
					// Get the new order of card IDs from the DOM
					const newOrderedIds = [...evt.to.children].map((item) => item.dataset.cardId);

					// Create a map for efficient lookup of the original card objects
					const cardMap = new Map(currentFlashcardSet.flashcards.map((card) => [card._id.toString(), card]));

					// Reorder the actual data array based on the new ID order
					currentFlashcardSet.flashcards = newOrderedIds.map((id) => cardMap.get(id));

					// Save the new order to the backend
					saveCardOrder(currentFlashcardSet._id, newOrderedIds);

					// A light re-render to update internal state without destroying the Sortable instance
					renderSingleSetView(currentFlashcardSet);
				},
			});
		}
		showFlashcardView("single-set");
	}

	function renderStudyView() {
		const studyDeck = shuffledFlashcards.length > 0 ? shuffledFlashcards : currentFlashcardSet.flashcards;

		if (!currentFlashcardSet || studyDeck.length === 0) return;

		flashcardFlipper.classList.remove("is-flipped");
		const card = studyDeck[currentCardIndex];
		flashcardFront.innerHTML = parseMarkdown(card.front);
		flashcardBack.innerHTML = parseMarkdown(card.back);
		cardCounter.textContent = `${currentCardIndex + 1} / ${studyDeck.length}`;

		showFlashcardView("study");
	}

	function showFlashcardView(viewName) {
		flashcardSetsView.classList.add("hidden");
		flashcardSingleSetView.classList.add("hidden");
		flashcardStudyView.classList.add("hidden");

		if (viewName !== "study") {
			shuffledFlashcards = [];
		}

		if (viewName === "sets") flashcardSetsView.classList.remove("hidden");
		else if (viewName === "single-set") flashcardSingleSetView.classList.remove("hidden");
		else if (viewName === "study") flashcardStudyView.classList.remove("hidden");
	}

	// Modal Handlers
	function openSetModal(set = null) {
		flashcardSetForm.reset();
		const subjects = typeof getUserSubjects === "function" ? getUserSubjects() : Object.keys(subjectColors || {});
		flashcardSetSubjectInput.innerHTML = "";
		subjects.forEach((s) => flashcardSetSubjectInput.add(new Option(s, s)));

		if (set) {
			// Editing existing set
			flashcardSetModalTitle.textContent = "Edit Flashcard Set";
			editingSetIdInput.value = set._id;
			flashcardSetNameInput.value = set.name;
			flashcardSetSubjectInput.value = set.subject;
		} else {
			// Creating new set
			flashcardSetModalTitle.textContent = "Create New Set";
			editingSetIdInput.value = "";
		}
		flashcardSetModal.classList.remove("hidden");
	}
	function closeSetModal() {
		flashcardSetModal.classList.add("hidden");
	}

	function openCardModal(card = null) {
		flashcardCardForm.reset();
		cardPreviewFlipper.classList.remove("is-flipped");
		updateCardPreview();

		if (card) {
			// Editing
			flashcardCardModalTitle.textContent = "Edit Card";
			editingCardIdInput.value = card._id;
			cardFrontInput.value = card.front;
			cardBackInput.value = card.back;
		} else {
			// Adding
			flashcardCardModalTitle.textContent = "Add New Card";
			editingCardIdInput.value = "";
		}
		updateCardPreview();
		flashcardCardModal.classList.remove("hidden");
	}
	function closeCardModal() {
		flashcardCardModal.classList.add("hidden");
	}

	function updateCardPreview() {
		cardPreviewFront.innerHTML = parseMarkdown(cardFrontInput.value || "Front of Card");
		cardPreviewBack.innerHTML = parseMarkdown(cardBackInput.value || "Back of Card");
	}

	function startStudySession(shuffle = false) {
		if (!currentFlashcardSet || currentFlashcardSet.flashcards.length === 0) {
			alert("This set has no cards to study. Add some cards first!");
			return;
		}

		if (shuffle) {
			// Fisher-Yates shuffle algorithm
			const array = [...currentFlashcardSet.flashcards];
			for (let i = array.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[array[i], array[j]] = [array[j], array[i]];
			}
			shuffledFlashcards = array;
		} else {
			shuffledFlashcards = []; // Ensure we use the default order
		}

		currentCardIndex = 0;
		renderStudyView();
	}

	function openImportExportModal(mode, set = null) {
		textModalMode = mode;
		flashcardTextError.textContent = "";
		flashcardTextModalButtons.innerHTML = "";

		if (mode === "import") {
			flashcardTextModalTitle.textContent = "Import New Set";
			flashcardTextArea.value = "";
			flashcardTextArea.readOnly = false;
			// Add Import and Cancel buttons
			flashcardTextModalButtons.innerHTML = `
                <button id="cancel-text-modal-btn" class="px-4 py-2 bg-slate-100 rounded-lg dark:bg-slate-600 dark:text-slate-200">Cancel</button>
                <button id="import-text-btn" class="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg">Import Set</button>
            `;
			document.getElementById("import-text-btn").addEventListener("click", handleImportSet);
		} else if (mode === "edit" && set) {
			flashcardTextModalTitle.textContent = "Export / Edit Set as Text";
			flashcardTextArea.value = generateSetAsText(set);
			flashcardTextArea.readOnly = false;
			// Add Save, Copy, and Close buttons
			flashcardTextModalButtons.innerHTML = `
                <button id="cancel-text-modal-btn" class="px-4 py-2 bg-slate-100 rounded-lg dark:bg-slate-600 dark:text-slate-200">Close</button>
                <button id="copy-text-btn" class="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg dark:bg-slate-500 dark:text-slate-200">Copy to Clipboard</button>
                <button id="save-text-btn" class="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg">Save Changes</button>
            `;
			document.getElementById("save-text-btn").addEventListener("click", () => handleEditTextSet(set._id));
			document.getElementById("copy-text-btn").addEventListener("click", handleCopyToClipboard);
		}

		document.getElementById("cancel-text-modal-btn").addEventListener("click", closeImportExportModal);
		flashcardTextModal.classList.remove("hidden");
	}

	function closeImportExportModal() {
		flashcardTextModal.classList.add("hidden");
	}

	function generateSetAsText(set) {
		let text = `Name: ${set.name}\n`;
		text += `Subject: ${set.subject}\n`;
		text += set.flashcards.map((card) => `---\n${card.front}\n///\n${card.back}`).join("\n");
		return text;
	}

	function parseTextToSet(text) {
		const lines = text.split("\n");
		const nameLine = lines.find((line) => line.toLowerCase().startsWith("name:"));
		const subjectLine = lines.find((line) => line.toLowerCase().startsWith("subject:"));

		if (!nameLine || !subjectLine) return null;

		const name = nameLine.substring(5).trim();
		const subject = subjectLine.substring(8).trim();

		if (!name || !subject) return null;

		const cardText = text.substring(text.indexOf("---")).trim();
		const cardBlocks = cardText.split(/\n---\n/);

		const flashcards = cardBlocks
			.map((block) => {
				const parts = block.replace(/^---/, "").trim().split("\n///\n");
				if (parts.length === 2) {
					return { front: parts[0].trim(), back: parts[1].trim() };
				}
				return null;
			})
			.filter(Boolean); // Filter out any null entries from invalid blocks

		return { name, subject, flashcards };
	}

	function handleImportSet() {
		const text = flashcardTextArea.value;
		const parsedSet = parseTextToSet(text);

		if (!parsedSet) {
			flashcardTextError.textContent = "Invalid format. Please provide Name, Subject, and at least one card.";
			return;
		}

		saveFlashcardSet(null, parsedSet.name, parsedSet.subject, parsedSet.flashcards);
		closeImportExportModal();
	}

	function handleEditTextSet(setId) {
		const text = flashcardTextArea.value;
		const parsedSet = parseTextToSet(text);

		if (!parsedSet) {
			flashcardTextError.textContent = "Invalid format. Please ensure Name and Subject lines are present.";
			return;
		}

		saveFlashcardSet(setId, parsedSet.name, parsedSet.subject, parsedSet.flashcards);
		closeImportExportModal();
	}

	function handleCopyToClipboard() {
		flashcardTextArea.select();
		document.execCommand("copy");
		alert("Copied to clipboard!");
	}


function initFlashcardEvents() {
	importSetBtn.addEventListener("click", () => openImportExportModal("import"));
	exportEditSetBtn.addEventListener("click", () => openImportExportModal("edit", currentFlashcardSet));

	createSetBtn.addEventListener("click", () => openSetModal());
	cancelSetModalBtn.addEventListener("click", closeSetModal);
	flashcardSetForm.addEventListener("submit", (e) => {
		e.preventDefault();
		saveFlashcardSet(editingSetIdInput.value, flashcardSetNameInput.value, flashcardSetSubjectInput.value);
	});

	flashcardSetsGrid.addEventListener("click", (e) => {
		const card = e.target.closest(".set-card");
		if (!card) return;

		const setId = card.dataset.setId;
		const action = e.target.closest("button")?.dataset.action;

		if (action === "edit") {
			const setToEdit = flashcardSets.find((s) => s._id === setId);
			openSetModal(setToEdit);
		} else if (action === "delete") {
			deleteFlashcardSet(setId);
		} else {
			// Clicked on the card itself, open the single set view
			const setToView = flashcardSets.find((s) => s._id === setId);
			if (setToView) renderSingleSetView(setToView);
		}
	});

	singleSetCardsGrid.addEventListener("click", (e) => {
		const flipper = e.target.closest(".card-preview-flipper");
		const editBtn = e.target.closest('[data-action="edit-card"]');
		const deleteBtn = e.target.closest('[data-action="delete-card"]');

		if (editBtn) {
			const cardId = editBtn.dataset.cardId;
			const cardToEdit = currentFlashcardSet.flashcards.find((c) => c._id === cardId);
			if (cardToEdit) openCardModal(cardToEdit);
		} else if (deleteBtn) {
			const cardId = deleteBtn.dataset.cardId;
			deleteFlashcard(currentFlashcardSet._id, cardId);
		} else if (flipper && !e.target.closest(".drag-handle")) {
			flipper.classList.toggle("is-flipped");
		}
	});

	backToSetsBtn.addEventListener("click", () => showFlashcardView("sets"));
	studyBackBtn.addEventListener("click", () => showFlashcardView("single-set"));

	addEditCardsBtn.addEventListener("click", () => openCardModal());
	cancelCardModalBtn.addEventListener("click", closeCardModal);
	flashcardCardForm.addEventListener("submit", (e) => {
		e.preventDefault();
		saveFlashcard(currentFlashcardSet._id, editingCardIdInput.value, cardFrontInput.value, cardBackInput.value);
	});

	// Listeners for live preview in card modal
	cardFrontInput.addEventListener("input", updateCardPreview);
	cardBackInput.addEventListener("input", updateCardPreview);
	cardPreviewFlipper.addEventListener("click", () => cardPreviewFlipper.classList.toggle("is-flipped"));

	// Study mode listeners
	studySetBtn.addEventListener("click", () => startStudySession(false)); // Study in order
	shuffleStudyBtn.addEventListener("click", () => startStudySession(true)); // Study shuffled

	flashcardFlipper.addEventListener("click", () => flashcardFlipper.classList.toggle("is-flipped"));

	nextCardBtn.addEventListener("click", () => {
		const studyDeck = shuffledFlashcards.length > 0 ? shuffledFlashcards : currentFlashcardSet.flashcards;
		if (currentFlashcardSet && currentCardIndex < studyDeck.length - 1) {
			flashcardFlipper.style.transition = "none";
			flashcardFlipper.classList.remove("is-flipped");

			currentCardIndex++;
			renderStudyView();

			flashcardFlipper.offsetHeight;

			flashcardFlipper.style.transition = "transform 0.6s";
		}
	});
	prevCardBtn.addEventListener("click", () => {
		if (currentFlashcardSet && currentCardIndex > 0) {
			flashcardFlipper.style.transition = "none";
			flashcardFlipper.classList.remove("is-flipped");

			currentCardIndex--;
			renderStudyView();

			flashcardFlipper.offsetHeight;

			flashcardFlipper.style.transition = "transform 0.6s";
		}
	});

	// --- Desktop Mouse Drag Events ---
	singleSetCardsGrid.addEventListener("dragstart", (e) => {
		const draggableTarget = e.target.closest(".flashcard-preview-container");
		if (draggableTarget) {
			draggedItem = draggableTarget;
		} else {
			e.preventDefault();
		}
	});

}

window.initFlashcardEvents = initFlashcardEvents;

window.StudyApp.flashcards = {
	saveFlashcardSetOrder,
	loadFlashcardSets,
	saveFlashcardSet,
	deleteFlashcardSet,
	saveFlashcard,
	deleteFlashcard,
	saveCardOrder,
	renderFlashcardSets,
	renderSingleSetView,
	renderStudyView,
	showFlashcardView,
	openSetModal,
	closeSetModal,
	openCardModal,
	closeCardModal,
	updateCardPreview,
	startStudySession,
	openImportExportModal,
	closeImportExportModal,
	generateSetAsText,
	parseTextToSet,
	handleImportSet,
	handleEditTextSet,
	handleCopyToClipboard,
	initFlashcardEvents
};
