// ==========================================
// SOUND LIBRARY & BACKGROUND AUDIO
// ==========================================

window.StudyApp = window.StudyApp || {};

function onYouTubeIframeAPIReady() {
	window.dispatchEvent(new Event("youtubeApiReady"));
}
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

	async function saveSoundLibraryOrder(orderedIds) {
		try {
			await fetch(`${API_URL}/api/study/sound-library/reorder`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId: currentUser.id, orderedIds }),
			});
		} catch (error) {
			console.error("Failed to save sound order:", error);
		}
	}


	// --- EDITED: All functions for the Sound Library feature ---

	// Load the user's sound library from the database
	async function loadSoundLibrary(startupState = {}) {
		if (!currentUser) return;
		if (Object.prototype.hasOwnProperty.call(startupState, "soundLibrary")) {
			soundLibrary = Array.isArray(startupState.soundLibrary) ? startupState.soundLibrary : [];
			renderSoundLibrary();
			return;
		}
		try {
			const response = await fetch(`${API_URL}/api/study/sound-library?userId=${currentUser.id}`);
			if (!response.ok) throw new Error("Failed to load sounds");
			soundLibrary = await response.json();
			renderSoundLibrary();
		} catch (error) {
			console.error("Error loading sound library:", error);
			displaySoundLibraryError("Could not load your saved sounds from the database.", error);
		}
	}

	// Render the list of sounds
	function renderSoundLibrary() {
		if (!isYouTubeApiReady) return;
		if (soundLibrarySortableInstance) {
			soundLibrarySortableInstance.destroy();
			soundLibrarySortableInstance = null;
		}
		soundLibraryList.innerHTML = "";
		if (soundLibrary.length === 0) {
			soundLibraryList.innerHTML = `<p class="text-slate-400 text-center text-sm py-2">Your sound library is empty.</p>`;
			return;
		}
		soundLibrary.forEach((sound) => {
			const isPlaying = sound._id === currentPlayingSoundId;
			const el = document.createElement("div");
			el.className = `sound-item group flex items-center justify-between p-2 rounded-lg text-sm ${isPlaying ? "bg-blue-100 dark:bg-blue-900/50" : "hover:bg-slate-100 dark:hover:bg-slate-700/50"}`;
			el.dataset.soundId = sound._id;
			el.innerHTML = `
                <div class="flex items-center min-w-0">
					<button type="button" class="sound-drag-handle mr-2 flex-shrink-0 cursor-grab text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors" title="Drag to reorder sound" aria-label="Drag to reorder sound"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg></button>
                	<span class="font-medium text-slate-700 dark:text-slate-200 truncate">${sound.name}</span>
				</div>
                <div class="flex items-center md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button data-url="${sound.url}" data-id="${sound._id}" class="play-sound-btn p-1 text-slate-500 hover:text-blue-500">
                         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    </button>
                    <button data-id="${sound._id}" class="edit-sound-btn p-1 text-slate-500 hover:text-green-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button data-id="${sound._id}" class="delete-sound-btn p-1 text-slate-500 hover:text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            `;
			soundLibraryList.appendChild(el);
		});

		// Add event listeners to the new buttons
		document.querySelectorAll(".play-sound-btn").forEach((btn) => btn.addEventListener("click", (e) => handlePlaySound(e.currentTarget.dataset.id, e.currentTarget.dataset.url)));
		document.querySelectorAll(".edit-sound-btn").forEach((btn) => btn.addEventListener("click", (e) => handleEditSound(e.currentTarget.dataset.id)));
		document.querySelectorAll(".delete-sound-btn").forEach((btn) => btn.addEventListener("click", (e) => handleDeleteSound(e.currentTarget.dataset.id)));

		soundLibrarySortableInstance = new Sortable(soundLibraryList, {
			animation: 150,
			handle: ".sound-drag-handle",
			delayOnTouchOnly: true,
			delay: 120,
			touchStartThreshold: 5,
			ghostClass: "sortable-ghost",
			dragClass: "sortable-drag",
			onEnd: (evt) => {
				const orderedIds = [...evt.to.children].map((item) => item.dataset.soundId);
				const soundMap = new Map(soundLibrary.map((sound) => [sound._id, sound]));
				soundLibrary = orderedIds.map((id) => soundMap.get(id)).filter(Boolean);
				saveSoundLibraryOrder(orderedIds);
			},
		});
	}

	// Handle adding a new sound from the form
	async function handleAddSound(e) {
		e.preventDefault();
		const name = soundNameInput.value.trim();
		const url = soundUrlInput.value.trim();
		if (!name || !url) return;

		if (!parseYoutubeUrl(url)) {
			soundErrorMessage.textContent = "Please enter a valid YouTube URL.";
			setTimeout(() => (soundErrorMessage.textContent = ""), 3000);
			return;
		}

		try {
			const response = await fetch(`${API_URL}/api/study/sound-library/add`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId: currentUser.id, name, url }),
			});
			if (!response.ok) throw new Error("Failed to add sound");
			soundLibrary = await response.json();
			renderSoundLibrary();
			addSoundForm.reset();
		} catch (error) {
			console.error("Error adding sound:", error);
			soundErrorMessage.textContent = "Could not add sound.";
			setTimeout(() => (soundErrorMessage.textContent = ""), 3000);
		}
	}

	// Handle editing an existing sound
	async function handleEditSound(soundId) {
		const sound = soundLibrary.find((s) => s._id === soundId);
		if (!sound) return;

		const newName = prompt("Enter new name for the sound:", sound.name);
		if (!newName || newName.trim() === "") return;

		const newUrl = prompt("Enter new YouTube URL:", sound.url);
		if (!newUrl || !parseYoutubeUrl(newUrl)) {
			alert("Invalid YouTube URL.");
			return;
		}

		try {
			const response = await fetch(`${API_URL}/api/study/sound-library/edit/${soundId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId: currentUser.id, name: newName.trim(), url: newUrl.trim() }),
			});
			if (!response.ok) throw new Error("Failed to edit sound");
			soundLibrary = await response.json();
			renderSoundLibrary();
		} catch (error) {
			console.error("Error editing sound:", error);
		}
	}

	// Handle deleting a sound
	async function handleDeleteSound(soundId) {
		if (!confirm("Are you sure you want to delete this sound?")) return;
		try {
			const response = await fetch(`${API_URL}/api/study/sound-library/delete/${soundId}`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId: currentUser.id }),
			});
			if (!response.ok) throw new Error("Failed to delete sound");
			soundLibrary = await response.json();
			renderSoundLibrary();
		} catch (error) {
			console.error("Error deleting sound:", error);
		}
	}

	// Initialize the YouTube player
	function initializeYoutubePlayer() {
		if (ytPlayer || !isYouTubeApiReady) return;
		try {
			ytPlayer = new YT.Player("youtube-player", {
				height: "195",
				width: "348",
				playerVars: {
					playsinline: 1,
					controls: 0, // Hide controls for a cleaner look
					modestbranding: 1,
					loop: 1, // Loop the video
				},
			});
		} catch (error) {
			displaySoundLibraryError("The YouTube player could not be initialized.", error);
		}
	}

	// Handle playing a sound when the play button is clicked
	function handlePlaySound(soundId, url) {
		if (!ytPlayer) {
			displaySoundLibraryError("YouTube player is not available.");
			return;
		}

		const videoId = parseYoutubeUrl(url);
		if (!videoId) {
			alert("Invalid YouTube URL provided.");
			return;
		}

		currentPlayingSoundId = soundId;
		youtubePlayerContainer.classList.remove("hidden");
		ytPlayer.loadVideoById(videoId);

		if (!isPaused) {
			ytPlayer.playVideo();
		}
		renderSoundLibrary();
	}

	// Utility to get video ID from various YouTube URL formats
	function parseYoutubeUrl(url) {
		const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
		const match = url.match(regExp);
		return match && match[2].length === 11 ? match[2] : null;
	}

	function displaySoundLibraryError(userMessage, systemError = null) {
		soundLibraryList.classList.add("hidden");
		addSoundForm.classList.add("hidden");
		soundLibraryError.classList.remove("hidden");

		let errorMessage = `<p class="font-semibold text-red-800 dark:text-red-300">Sound Library Unavailable</p>
                            <p class="text-sm text-red-700 dark:text-red-400 mt-1">${userMessage}</p>`;

		if (systemError) {
			errorMessage += `<p class="text-xs text-red-600 dark:text-red-500 mt-2 font-mono">Details: ${systemError.message || systemError}</p>`;
		}

		soundLibraryError.innerHTML = errorMessage;
	}


function initSoundEvents() {
	addSoundForm.addEventListener("submit", handleAddSound);

	const apiReadyTimeout = setTimeout(() => {
		if (!isYouTubeApiReady) {
			displaySoundLibraryError("The YouTube player API did not load in time. This may be due to network restrictions.");
		}
	}, 5000); // 5-second timeout

	window.addEventListener("youtubeApiReady", () => {
		clearTimeout(apiReadyTimeout); // Clear the timeout if the API loads successfully
		isYouTubeApiReady = true;
		initializeYoutubePlayer();
	});
}

window.initSoundEvents = initSoundEvents;

window.StudyApp.sounds = {
	onYouTubeIframeAPIReady,
	saveSoundLibraryOrder,
	loadSoundLibrary,
	renderSoundLibrary,
	handleAddSound,
	handleEditSound,
	handleDeleteSound,
	initializeYoutubePlayer,
	handlePlaySound,
	parseYoutubeUrl,
	displaySoundLibraryError,
	initSoundEvents
};
