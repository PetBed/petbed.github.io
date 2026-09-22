// ==========================================
// AUTHENTICATION, SETTINGS & NAVIGATION
// ==========================================

window.StudyApp = window.StudyApp || {};

async function checkAuthAndInitialize() {
	const user = localStorage.getItem("studyUser");
	if (user) {
		currentUser = JSON.parse(user);

		if (currentUser.settings && currentUser.settings.darkMode) {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}

		loadingIndicator.style.display = "flex";
		appContainer.classList.add("hidden");
		welcomeMessage.textContent = `Welcome back, ${currentUser.username}!`;

		// 1. Fetch the latest state from the server.
		try {
			console.log("Syncing and migrating user data with server...");
			const response = await fetch(`${API_URL}/api/study/user/collectible-state?userId=${currentUser.id}`);
			if (!response.ok) throw new Error("Server sync failed");

			const serverState = await response.json();

			// 2. Overwrite local data with the server's authoritative data
			// This includes both existing fields AND any newly added fields with defaults
			currentUser.accumulatedStudyTime = serverState.accumulatedStudyTime;
			currentUser.unclaimedDrops = serverState.unclaimedDrops;
			currentUser.inventory = serverState.inventory;
			currentUser.pendingDrops = serverState.pendingDrops;

			// Update settings if they exist on server
			if (serverState.settings) {
				currentUser.settings = serverState.settings;
				// Re-apply theme in case it was updated on server
				if (currentUser.settings.darkMode) {
					document.documentElement.classList.add("dark");
				} else {
					document.documentElement.classList.remove("dark");
				}
			}

			// Update sound library if it exists
			if (serverState.soundLibrary) {
				currentUser.soundLibrary = serverState.soundLibrary;
			}

			// Update syllabus if it exists
			if (serverState.syllabus) {
				currentUser.syllabus = serverState.syllabus;
				syllabus = serverState.syllabus;
			}

			// 3. Save the synced and migrated data back to localStorage
			localStorage.setItem("studyUser", JSON.stringify(currentUser));
			console.log("Sync and migration complete. Local state updated:", currentUser);
		} catch (error) {
			console.error("Failed to sync with server:", error);
			// If sync fails, warn the user but continue with local data
			console.warn("Continuing with local data. Some features may not work correctly.");
		}

		await initializeApp();

		// 4. Initialize the collectibles module with the fresh, synced data.
		if (window.initCollectibles) {
			window.initCollectibles(currentUser.id, currentUser.accumulatedStudyTime, currentUser.unclaimedDrops);
		}

		loadingIndicator.style.display = "none";
		appContainer.classList.remove("hidden");
		appContainer.style.display = "flex";
	} else {
		window.location.href = "auth.html";
	}
}

async function initializeApp() {
	await loadDataFromDB();
	loadTaskViewPreferences();
	populateCalendarWithExams();
	renderCalendar();
	renderCountdowns();
	populateSubjects();
	filterSubjectEl.value = taskSubjectFilter;
	filterStatusEl.value = taskStatusFilter;
	sortTasksEl.value = taskSort;
	renderTasksPage();
	renderSemesterSection();
	renderStudyLogs();
	updateTimerDisplay();
	initGoogleCalendarIntegration();
	darkModeToggle.checked = document.documentElement.classList.contains("dark");
	showPage("dashboard");
}

function handleLogout() {
	localStorage.removeItem("studyUser");
	currentUser = null;
	window.location.href = "auth.html";
}

async function handleUpdateUsername(e) {
	e.preventDefault();
	const newUsername = newUsernameInput.value.trim();
	if (!newUsername || newUsername === currentUser.username) return;

	try {
		const response = await fetch(`${API_URL}/api/study/user/username`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId: currentUser.id, newUsername }),
		});
		const data = await response.json();
		if (data.error) {
			usernameMessageEl.textContent = data.error;
			usernameMessageEl.classList.remove("text-green-500");
			usernameMessageEl.classList.add("text-red-500");
		} else {
			currentUser.username = data.user.username;
			localStorage.setItem("studyUser", JSON.stringify(currentUser));
			welcomeMessage.textContent = `Welcome back, ${currentUser.username}!`;
			usernameMessageEl.textContent = "Username updated!";
			usernameMessageEl.classList.add("text-green-500");
			usernameMessageEl.classList.remove("text-red-500");
			newUsernameInput.value = "";
		}
	} catch (error) {
		usernameMessageEl.textContent = "An error occurred.";
		usernameMessageEl.classList.remove("text-green-500");
		usernameMessageEl.classList.add("text-red-500");
	} finally {
		setTimeout(() => (usernameMessageEl.textContent = ""), 3000);
	}
}

async function handleUpdatePassword(e) {
	e.preventDefault();
	const currentPassword = currentPasswordInput.value;
	const newPassword = newPasswordInput.value;
	if (!currentPassword || !newPassword) return;

	try {
		const response = await fetch(`${API_URL}/api/study/user/password`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId: currentUser.id, currentPassword, newPassword }),
		});
		const data = await response.json();
		if (data.error) {
			passwordMessageEl.textContent = data.error;
			passwordMessageEl.classList.remove("text-green-500");
			passwordMessageEl.classList.add("text-red-500");
		} else {
			passwordMessageEl.textContent = data.message;
			passwordMessageEl.classList.add("text-green-500");
			passwordMessageEl.classList.remove("text-red-500");
			updatePasswordForm.reset();
		}
	} catch (error) {
		passwordMessageEl.textContent = "An error occurred.";
		passwordMessageEl.classList.remove("text-green-500");
		passwordMessageEl.classList.add("text-red-500");
	} finally {
		setTimeout(() => (passwordMessageEl.textContent = ""), 3000);
	}
}

async function handleToggleDarkMode() {
	const isDarkMode = darkModeToggle.checked;
	if (isDarkMode) {
		document.documentElement.classList.add("dark");
	} else {
		document.documentElement.classList.remove("dark");
	}

	if (!currentUser.settings) {
		currentUser.settings = {};
	}
	currentUser.settings.darkMode = isDarkMode;
	localStorage.setItem("studyUser", JSON.stringify(currentUser));

	try {
		await fetch(`${API_URL}/api/study/settings/darkmode`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId: currentUser.id, darkMode: isDarkMode }),
		});
	} catch (error) {
		console.error("Failed to save dark mode preference:", error);
		if (isDarkMode) document.documentElement.classList.remove("dark");
		else document.documentElement.classList.add("dark");
		currentUser.settings.darkMode = !isDarkMode;
		localStorage.setItem("studyUser", JSON.stringify(currentUser));
	}
}

function showPage(page) {
	const pages = { dashboard: dashboardPage, study: studyPage, tasks: tasksPage, flashcards: flashcardsPage, notes: notesPage, binder: binderPage, syllabus: syllabusPage };
	const navs = { dashboard: navDashboard, study: navStudy, tasks: navTasks, flashcards: navFlashcards, notes: navNotes, binder: navBinder, syllabus: navSyllabus };
	Object.keys(pages).forEach((p) => {
		if (pages[p]) pages[p].classList.add("hidden");
		if (navs[p]) navs[p].classList.remove("active");
	});
	if (pages[page]) pages[page].classList.remove("hidden");
	if (navs[page]) navs[page].classList.add("active");

	if (page === "dashboard") renderDashboard();

	if (page === "notes" && typeof renderNotesPage === "function") {
		renderNotesPage();
	}

	if (page === "binder" && window.collectiblesModule && typeof window.collectiblesModule.renderInventory === "function") {
		window.collectiblesModule.renderInventory();
	}

	if (page === "syllabus" && typeof renderSyllabusPage === "function") {
		renderSyllabusPage();
	}
}

function renderDashboard() {
	renderMotivationalQuote();
	renderSemesterSection();
	renderUpcomingExams();
	renderStudyChart();
	renderNextTodos();
	renderStreak();
}
function renderMotivationalQuote() {
	motivationalQuoteEl.textContent = `"${quotes[Math.floor(Math.random() * quotes.length)]}"`;
}

function initAuthEvents() {
	if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
	if (settingsBtn) settingsBtn.addEventListener("click", () => settingsModal && settingsModal.classList.remove("hidden"));
	if (closeSettingsModalBtn) closeSettingsModalBtn.addEventListener("click", () => settingsModal && settingsModal.classList.add("hidden"));
	if (settingsModal) settingsModal.addEventListener("click", (e) => e.target === settingsModal && settingsModal.classList.add("hidden"));
	if (updateUsernameForm) updateUsernameForm.addEventListener("submit", handleUpdateUsername);
	if (updatePasswordForm) updatePasswordForm.addEventListener("submit", handleUpdatePassword);
	if (darkModeToggle) darkModeToggle.addEventListener("change", handleToggleDarkMode);

	if (navDashboard) navDashboard.addEventListener("click", () => showPage("dashboard"));
	if (navStudy) navStudy.addEventListener("click", () => showPage("study"));
	if (navTasks) navTasks.addEventListener("click", () => showPage("tasks"));
	if (navFlashcards) navFlashcards.addEventListener("click", () => showPage("flashcards"));
	if (navNotes) navNotes.addEventListener("click", () => showPage("notes"));
	if (navBinder) navBinder.addEventListener("click", () => showPage("binder"));
}

window.initAuthEvents = initAuthEvents;

window.StudyApp.auth = {
	checkAuthAndInitialize,
	initializeApp,
	handleLogout,
	handleUpdateUsername,
	handleUpdatePassword,
	handleToggleDarkMode,
	showPage,
	renderDashboard,
	renderMotivationalQuote,
	initAuthEvents
};
