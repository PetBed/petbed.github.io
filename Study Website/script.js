function onYouTubeIframeAPIReady() {
	window.dispatchEvent(new Event("youtubeApiReady"));
}

document.addEventListener("DOMContentLoaded", function () {
	// --- DOM Elements ---
	const loadingIndicator = document.getElementById("loading-indicator");
	const appContainer = document.getElementById("app-container");
	const logoutBtn = document.getElementById("logout-btn");
	const welcomeMessage = document.getElementById("welcome-message");
	const dashboardPage = document.getElementById("dashboard-page");
	const studyPage = document.getElementById("study-page");
	const tasksPage = document.getElementById("tasks-page");
	const navDashboard = document.getElementById("nav-dashboard");
	const navStudy = document.getElementById("nav-study");
	const navTasks = document.getElementById("nav-tasks");
	const monthYearEl = document.getElementById("month-year");
	const calendarDaysEl = document.getElementById("calendar-days");
	const prevMonthBtn = document.getElementById("prev-month");
	const nextMonthBtn = document.getElementById("next-month");
	const countdownContainer = document.getElementById("countdown-container");
	const fullTaskListEl = document.getElementById("full-task-list");
	const taskInput = document.getElementById("task-page-input");
	const taskSubjectSelect = document.getElementById("task-page-subject");
	const taskTimeInput = document.getElementById("task-page-time");
	const taskDeadlineInput = document.getElementById("task-page-deadline");
	const addTaskBtn = document.getElementById("task-page-add-btn");
	const taskErrorEl = document.getElementById("task-page-error");
	const filterSubjectEl = document.getElementById("filter-subject");
	const filterStatusEl = document.getElementById("filter-status");
	const sortTasksEl = document.getElementById("sort-tasks");
	const timerDisplay = document.getElementById("timer-display");
	const modeIndicator = document.getElementById("mode-indicator");
	const pomodoroSubjectSelect = document.getElementById("pomodoro-subject");
	const focusDurationInput = document.getElementById("focus-duration");
	const breakDurationInput = document.getElementById("break-duration");
	const playPauseBtn = document.getElementById("play-pause-btn");
	const skipBtn = document.getElementById("skip-btn");
	const studyLogContainer = document.getElementById("study-log-container");
	const eventModal = document.getElementById("event-modal");
	const closeModalBtn = document.getElementById("close-modal");
	const saveEventBtn = document.getElementById("save-event");
	const eventTitleInput = document.getElementById("event-title");
	const modalDateEl = document.getElementById("modal-date");
	const upcomingExamsContainer = document.getElementById("upcoming-exams-container");
	const nextTodosContainer = document.getElementById("next-todos-container");
	const studyChartCanvas = document.getElementById("study-chart");
	const motivationalQuoteEl = document.getElementById("motivational-quote");
	const streakContainerEl = document.getElementById("streak-container");
	const settingsBtn = document.getElementById("settings-btn");
	const settingsModal = document.getElementById("settings-modal");
	const closeSettingsModalBtn = document.getElementById("close-settings-modal");
	const updateUsernameForm = document.getElementById("update-username-form");
	const updatePasswordForm = document.getElementById("update-password-form");
	const newUsernameInput = document.getElementById("new-username-input");
	const currentPasswordInput = document.getElementById("current-password-input");
	const newPasswordInput = document.getElementById("new-password-input");
	const usernameMessageEl = document.getElementById("username-message");
	const passwordMessageEl = document.getElementById("password-message");
	const darkModeToggle = document.getElementById("dark-mode-toggle");
	const editTaskModal = document.getElementById("edit-task-modal");
	const editTaskText = document.getElementById("edit-task-text");
	const editTaskSubject = document.getElementById("edit-task-subject");
	const editTaskTime = document.getElementById("edit-task-time");
	const editTaskDeadline = document.getElementById("edit-task-deadline");
	const editSubtaskList = document.getElementById("edit-subtask-list");
	const editAddSubtaskInput = document.getElementById("edit-add-subtask-input");
	const editAddSubtaskBtn = document.getElementById("edit-add-subtask-btn");
	const cancelEditTaskBtn = document.getElementById("cancel-edit-task-btn");
	const saveEditTaskBtn = document.getElementById("save-edit-task-btn");
	const youtubePlayerContainer = document.getElementById("youtube-player-container");
	const soundLibraryList = document.getElementById("sound-library-list");
	const addSoundForm = document.getElementById("add-sound-form");
	const soundNameInput = document.getElementById("sound-name-input");
	const soundUrlInput = document.getElementById("sound-url-input");
	const soundErrorMessage = document.getElementById("sound-error-message");
	const soundLibraryError = document.getElementById("sound-library-error");
	const flashcardsPage = document.getElementById("flashcards-page");
	const navFlashcards = document.getElementById("nav-flashcards");
	const flashcardSetsView = document.getElementById("flashcard-sets-view");
	const createSetBtn = document.getElementById("create-set-btn");
	const flashcardSetsGrid = document.getElementById("flashcard-sets-grid");
	const flashcardSingleSetView = document.getElementById("flashcard-single-set-view");
	const backToSetsBtn = document.getElementById("back-to-sets-btn");
	const singleSetName = document.getElementById("single-set-name");
	const singleSetSubject = document.getElementById("single-set-subject");
	const studySetBtn = document.getElementById("study-set-btn");
	const shuffleStudyBtn = document.getElementById("shuffle-study-btn");
	const addEditCardsBtn = document.getElementById("add-edit-cards-btn");
	const singleSetCardsGrid = document.getElementById("single-set-cards-grid");
	const flashcardStudyView = document.getElementById("flashcard-study-view");
	const studyBackBtn = document.getElementById("study-back-btn");
	const flashcardFlipper = document.getElementById("flashcard-flipper");
	const flashcardFront = document.getElementById("flashcard-front");
	const flashcardBack = document.getElementById("flashcard-back");
	const prevCardBtn = document.getElementById("prev-card-btn");
	const nextCardBtn = document.getElementById("next-card-btn");
	const cardCounter = document.getElementById("card-counter");
	const flashcardSetModal = document.getElementById("flashcard-set-modal");
	const flashcardSetModalTitle = document.getElementById("flashcard-set-modal-title");
	const flashcardSetForm = document.getElementById("flashcard-set-form");
	const editingSetIdInput = document.getElementById("editing-set-id");
	const flashcardSetNameInput = document.getElementById("flashcard-set-name-input");
	const flashcardSetSubjectInput = document.getElementById("flashcard-set-subject-input");
	const cancelSetModalBtn = document.getElementById("cancel-set-modal-btn");
	const flashcardCardModal = document.getElementById("flashcard-card-modal");
	const flashcardCardModalTitle = document.getElementById("flashcard-card-modal-title");
	const flashcardCardForm = document.getElementById("flashcard-card-form");
	const editingCardIdInput = document.getElementById("editing-card-id");
	const cardFrontInput = document.getElementById("card-front-input");
	const cardBackInput = document.getElementById("card-back-input");
	const cardPreviewFlipper = document.getElementById("card-preview-flipper");
	const cardPreviewFront = document.getElementById("card-preview-front");
	const cardPreviewBack = document.getElementById("card-preview-back");
	const cancelCardModalBtn = document.getElementById("cancel-card-modal-btn");

	// --- State ---
	let studyChart = null;
	let currentDate = new Date();
	let events = {};
	let tasks = [];
	let studyLogs = {};
	let selectedDate = null;
	let timerInterval = null;
	let timeLeft = 25 * 60;
	let isPaused = true;
	let currentMode = "focus";
	let studyStreak = 0;
	let lastStudyDay = "";
	let currentUser = null;
	let taskSubjectFilter = "all";
	let taskStatusFilter = "all";
	let taskSort = "dueDate";
	let editingTaskId = null;
	let pipVideoElement = null;
	let pipCanvas = null;
	let pipContext = null;
	let soundLibrary = [];
	let ytPlayer = null;
	let currentPlayingSoundId = null;
	let isYouTubeApiReady = false;
	let flashcardSets = [];
	let currentFlashcardSet = null;
	let currentCardIndex = 0;
	let shuffledFlashcards = [];

	// --- Constants & Config ---
	const API_URL = "https://wot-tau.vercel.app"; // local: http://localhost:3005
	const subjectColors = {Malay: "#8B0000", Chinese: "#E63946", English: "#1D3557", Moral: "#6A4C93", History: "#D2691E", Geography: "#606C38", RBT: "#6C757D", PJK: "#9EF01A", Science: "#2D6A4F", Mathematics: "#00B4D8", Art: "#E6399B", Other: "#64748b"};
	const RBT_ACCENT = "#FFD60A";
	const exams = [
		{subject: "Malay Paper 1", date: "2025-10-03T06:50:00"},
		{subject: "Malay Paper 2", date: "2025-10-03T08:25:00"},
		{subject: "Chinese", date: "2025-10-03T09:45:00"},
		{subject: "English Paper 1", date: "2025-10-07T06:50:00"},
		{subject: "English Paper 2", date: "2025-10-07T08:25:00"},
		{subject: "Moral", date: "2025-10-07T09:45:00"},
		{subject: "History", date: "2025-10-08T07:00:00"},
		{subject: "Geography", date: "2025-10-08T09:40:00"},
		{subject: "RBT", date: "2025-10-09T06:50:00"},
		{subject: "PJK", date: "2025-10-09T08:20:00"},
		{subject: "Science", date: "2025-10-09T09:40:00"},
		{subject: "Mathematics", date: "2025-10-10T07:00:00"},
		{subject: "Art", date: "2025-10-10T09:40:00"},
	];
	const quotes = ["The secret of getting ahead is getting started.", "The expert in anything was once a beginner.", "Believe you can and you're halfway there.", "Well done is better than well said.", "Strive for progress, not perfection.", "The future belongs to those who believe in the beauty of their dreams.", "Success is the sum of small efforts, repeated day in and day out.", "Don't watch the clock; do what it does. Keep going.", "It does not matter how slowly you go as long as you do not stop.", "The pain you feel today will be the strength you feel tomorrow."];

	// --- UTILITY FUNCTIONS ---
	const getDateString = (d) => d.toISOString().split("T")[0];
	const getColorForSubject = (s) => (Object.keys(subjectColors).find((k) => s.toLowerCase().includes(k.toLowerCase())) ? subjectColors[Object.keys(subjectColors).find((k) => s.toLowerCase().includes(k.toLowerCase()))] : subjectColors["Other"]);
	const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
	const formatLogTime = (s) => {
		const hours = Math.floor(s / 3600);
		const minutes = Math.floor((s % 3600) / 60);
		const seconds = Math.floor(s % 60);
		return `${hours > 0 ? `${hours}h ` : ""}${minutes > 0 ? `${minutes}m ` : ""}${seconds}s`;
	};

  function parseMarkdown(text) {
		// Configure marked to add breaks for newlines (like GitHub Flavored Markdown)
		marked.setOptions({
			breaks: true,
		});
		const rawHtml = marked.parse(text);
		// Sanitize the HTML to prevent XSS attacks
		return DOMPurify.sanitize(rawHtml);
	}

	// --- App Initialization & Auth Check ---
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
			await initializeApp();
			loadingIndicator.style.display = "none";
			appContainer.classList.remove("hidden");
			appContainer.style.display = "flex";
		} else {
			window.location.href = "auth.html";
		}
	}

	async function initializeApp() {
		await loadDataFromDB();
		populateCalendarWithExams();
		renderCalendar();
		renderCountdowns();
		const populateSubjects = () => {
			const selects = [taskSubjectSelect, pomodoroSubjectSelect, filterSubjectEl, editTaskSubject];
			selects.forEach((sel) => {
				if (sel.id === "filter-subject") {
					while (sel.options.length > 1) sel.remove(1);
				} else {
					sel.innerHTML = "";
				}
				Object.keys(subjectColors).forEach((s) => sel.add(new Option(s, s)));
			});
		};
		populateSubjects();
		renderTasksPage();
		renderStudyLogs();
		updateTimerDisplay();
		darkModeToggle.checked = document.documentElement.classList.contains("dark");
		showPage("dashboard");
	}

	function handleLogout() {
		localStorage.removeItem("studyUser");
		currentUser = null;
		window.location.href = "auth.html";
	}

	// --- Event Listeners ---
	logoutBtn.addEventListener("click", handleLogout);
	settingsBtn.addEventListener("click", () => settingsModal.classList.remove("hidden"));
	closeSettingsModalBtn.addEventListener("click", () => settingsModal.classList.add("hidden"));
	settingsModal.addEventListener("click", (e) => e.target === settingsModal && settingsModal.classList.add("hidden"));
	updateUsernameForm.addEventListener("submit", handleUpdateUsername);
	updatePasswordForm.addEventListener("submit", handleUpdatePassword);
	darkModeToggle.addEventListener("change", handleToggleDarkMode);

	navDashboard.addEventListener("click", () => showPage("dashboard"));
	navStudy.addEventListener("click", () => showPage("study"));
	navTasks.addEventListener("click", () => showPage("tasks"));
	navFlashcards.addEventListener("click", () => showPage("flashcards"));

	prevMonthBtn.addEventListener("click", () => {
		currentDate.setMonth(currentDate.getMonth() - 1);
		renderCalendar();
	});
	nextMonthBtn.addEventListener("click", () => {
		currentDate.setMonth(currentDate.getMonth() + 1);
		renderCalendar();
	});

	fullTaskListEl.addEventListener("click", (e) => {
		const target = e.target;
		const taskItem = target.closest(".task-item");
		const subtaskItem = target.closest(".subtask-item");

		if (target.closest(".task-checkbox") && taskItem) {
			const task = tasks.find((t) => t._id === taskItem.dataset.id);
			if (task) toggleTask(task);
		} else if (target.closest(".delete-task-btn") && taskItem) {
			deleteTask(taskItem.dataset.id);
		} else if (target.closest(".add-subtask-btn")) {
			const taskId = target.dataset.taskId;
			const inputEl = document.getElementById(`subtask-input-${taskId}`);
			if (inputEl) {
				addSubTask(taskId, inputEl.value);
				inputEl.value = "";
			}
		} else if (target.closest(".subtask-checkbox") && subtaskItem) {
			const taskId = subtaskItem.dataset.parentId;
			const subtaskId = subtaskItem.dataset.id;
			toggleSubTask(taskId, subtaskId, target.checked);
		} else if (target.closest(".edit-task-btn") && taskItem) {
			openEditModal(taskItem.dataset.id);
		} else if (target.closest(".delete-subtask-btn") && subtaskItem) {
			const taskId = subtaskItem.dataset.parentId;
			const subtaskId = subtaskItem.dataset.id;
			deleteSubTask(taskId, subtaskId);
		}
	});

	addTaskBtn.addEventListener("click", addTask);
	taskInput.addEventListener("keydown", (e) => e.key === "Enter" && addTask());

	filterSubjectEl.addEventListener("change", (e) => {
		taskSubjectFilter = e.target.value;
		renderTasksPage();
	});
	filterStatusEl.addEventListener("change", (e) => {
		taskStatusFilter = e.target.value;
		renderTasksPage();
	});
	sortTasksEl.addEventListener("change", (e) => {
		taskSort = e.target.value;
		renderTasksPage();
	});

	playPauseBtn.addEventListener("click", playPauseTimer);
	skipBtn.addEventListener("click", () => {
		if (currentMode === "focus") {
			saveStudyLogs();
		}
		if (ytPlayer && typeof ytPlayer.stopVideo === "function") {
			ytPlayer.stopVideo();
			youtubePlayerContainer.classList.add("hidden");
			currentPlayingSoundId = null;
			renderSoundLibrary();
		}
		switchMode(currentMode === "focus" ? "break" : "focus");
	});
	focusDurationInput.addEventListener("change", () => currentMode === "focus" && switchMode("focus"));
	breakDurationInput.addEventListener("change", () => currentMode === "break" && switchMode("break"));
	closeModalBtn.addEventListener("click", closeModal);
	saveEventBtn.addEventListener("click", saveEvent);
	eventModal.addEventListener("click", (e) => e.target === eventModal && closeModal());
	setInterval(updateAllCountdowns, 1000);

	cancelEditTaskBtn.addEventListener("click", closeEditModal);
	saveEditTaskBtn.addEventListener("click", saveTaskEdits);
	editAddSubtaskBtn.addEventListener("click", () => {
		if (editingTaskId && editAddSubtaskInput.value.trim()) {
			addSubTask(editingTaskId, editAddSubtaskInput.value.trim(), true);
			editAddSubtaskInput.value = "";
		}
	});
	editSubtaskList.addEventListener("click", (e) => {
		const subtaskItem = e.target.closest(".subtask-item-edit");
		if (!subtaskItem) return;
		const subtaskId = subtaskItem.dataset.id;

		if (e.target.closest(".delete-subtask-btn-edit")) {
			deleteSubTask(editingTaskId, subtaskId, true);
		} else if (e.target.closest(".subtask-text-edit")) {
			const currentText = e.target.textContent;
			const newText = prompt("Edit sub-task:", currentText);
			if (newText && newText.trim() !== currentText) {
				updateSubTask(
					editingTaskId,
					subtaskId,
					{
						text: newText.trim(),
					},
					true
				);
			}
		}
	});

	document.addEventListener("visibilitychange", handleVisibilityChangeForPiP);
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

	// --- Data Management (DB & Local) ---
	async function loadDataFromDB() {
		await loadTasks();
		await loadStudyLogs();
		await loadStreak();
		await loadSoundLibrary();
		await loadFlashcardSets();
		checkStreak();
	}

	// --- Settings Handlers ---
	async function handleUpdateUsername(e) {
		e.preventDefault();
		const newUsername = newUsernameInput.value.trim();
		if (!newUsername || newUsername === currentUser.username) return;

		try {
			const response = await fetch(`${API_URL}/api/study/user/username`, {
				method: "PUT",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({userId: currentUser.id, newUsername}),
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
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({userId: currentUser.id, currentPassword, newPassword}),
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
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({userId: currentUser.id, darkMode: isDarkMode}),
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
		const pages = {dashboard: dashboardPage, study: studyPage, tasks: tasksPage, flashcards: flashcardsPage};
		const navs = {dashboard: navDashboard, study: navStudy, tasks: navTasks, flashcards: navFlashcards};
		Object.keys(pages).forEach((p) => {
			pages[p].classList.add("hidden");
			navs[p].classList.remove("active");
		});
		pages[page].classList.remove("hidden");
		navs[page].classList.add("active");
		if (page === "dashboard") renderDashboard();
	}

	function renderDashboard() {
		renderMotivationalQuote();
		renderUpcomingExams();
		renderStudyChart();
		renderNextTodos();
		renderStreak();
	}
	function renderMotivationalQuote() {
		motivationalQuoteEl.textContent = `"${quotes[Math.floor(Math.random() * quotes.length)]}"`;
	}
	function renderUpcomingExams() {
		const now = new Date();
		const upcoming = exams.filter((e) => new Date(e.date) > now).sort((a, b) => new Date(a.date) - new Date(b.date));
		upcomingExamsContainer.innerHTML = "";
		if (upcoming.length === 0) {
			upcomingExamsContainer.innerHTML = `<p class="text-slate-500">No upcoming exams!</p>`;
			return;
		}
		const nextDate = new Date(upcoming[0].date).toDateString();
		const nextExams = upcoming.filter((e) => new Date(e.date).toDateString() === nextDate);
		upcomingExamsContainer.innerHTML = `<p class="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">On ${new Date(nextExams[0].date).toLocaleDateString("en-US", {weekday: "long", month: "long", day: "numeric"})}</p>`;
		nextExams.forEach((exam) => {
			const el = document.createElement("div");
			el.className = "flex items-center p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg";
			el.innerHTML = `<div class="w-1.5 h-10 rounded-full mr-3" style="background-color: ${getColorForSubject(exam.subject)};"></div><div><p class="font-semibold text-slate-800 dark:text-slate-200">${exam.subject}</p><p class="text-sm text-slate-500 dark:text-slate-400">${new Date(exam.date).toLocaleTimeString("en-US", {hour: "numeric", minute: "2-digit", hour12: true})}</p></div>`;
			upcomingExamsContainer.appendChild(el);
		});
	}
	function renderStudyChart() {
		const ctx = studyChartCanvas.getContext("2d");
		const labels = Object.keys(studyLogs);
		const data = labels.map((label) => (studyLogs[label] / 3600).toFixed(2));
		if (studyChart) studyChart.destroy();
		if (labels.length === 0) {
			ctx.clearRect(0, 0, studyChartCanvas.width, studyChartCanvas.height);
			ctx.font = "16px Inter";
			ctx.fillStyle = "#94a3b8";
			ctx.textAlign = "center";
			ctx.fillText("Log study time to see your progress!", studyChartCanvas.width / 2, 50);
			return;
		}
		studyChart = new Chart(ctx, {type: "bar", data: {labels, datasets: [{label: "Hours Studied", data, backgroundColor: labels.map((l) => subjectColors[l] || subjectColors["Other"]), borderRadius: 6}]}, options: {responsive: true, maintainAspectRatio: false, scales: {y: {beginAtZero: true, grid: {display: false, color: "#94a3b8"}, title: {display: true, text: "Hours", color: "#94a3b8"}, ticks: {color: "#94a3b8"}}, x: {grid: {display: false}, ticks: {color: "#94a3b8"}}}, plugins: {legend: {display: false}}}});
	}

	function renderNextTodos() {
		const incomplete = tasks.filter((t) => !t.completed).slice(0, 3);
		nextTodosContainer.innerHTML = "";
		if (incomplete.length === 0) {
			nextTodosContainer.innerHTML = `<div class="text-center p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-500/30 rounded-lg"><p class="font-semibold text-green-700 dark:text-green-400">All caught up!</p></div>`;
			return;
		}
		incomplete.forEach((task) => {
			const el = document.createElement("div");
			el.className = "p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg";
			let progressBarHtml = "";
			if (task.subTasks && task.subTasks.length > 0) {
				const completedCount = task.subTasks.filter((st) => st.completed).length;
				const totalCount = task.subTasks.length;
				const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
				progressBarHtml = `
                    <div class="mt-2 flex items-center gap-2">
                        <div class="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                            <div class="bg-green-500 h-2 rounded-full" style="width: ${percentage}%"></div>
                        </div>
                        <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">${completedCount}/${totalCount}</span>
                    </div>`;
			}
			el.innerHTML = `
                <div class="flex items-start space-x-3">
                    <div class="mt-1 w-2.5 h-2.5 rounded-full" style="background-color: ${getColorForSubject(task.subject)};"></div>
                    <div>
                        <p class="font-semibold text-slate-800 dark:text-slate-200">${task.text}</p>
                        <p class="text-sm text-slate-500 dark:text-slate-400">Due: ${new Date(task.deadline).toLocaleDateString()}</p>
                    </div>
                </div>
                ${progressBarHtml}`;
			nextTodosContainer.appendChild(el);
		});
	}

	function renderStreak() {
		streakContainerEl.innerHTML = `<p class="text-slate-600 dark:text-slate-400">You're on a</p><p class="text-3xl font-bold text-orange-600 dark:text-orange-400">${studyStreak} day streak! 🔥</p>`;
	}

	async function checkStreak() {
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);
		const todayStr = getDateString(today);
		const yesterdayStr = getDateString(yesterday);
		if (lastStudyDay && lastStudyDay !== todayStr && lastStudyDay !== yesterdayStr) {
			studyStreak = 0;
			await saveStreak();
		}
	}
	async function updateStreak() {
		const todayStr = getDateString(new Date());
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		const yesterdayStr = getDateString(yesterday);
		if (lastStudyDay === todayStr) return;
		if (lastStudyDay === yesterdayStr) {
			studyStreak++;
		} else {
			studyStreak = 1;
		}
		lastStudyDay = todayStr;
		await saveStreak();
	}

	// --- Task Management (DB) ---
	async function loadTasks() {
		if (!currentUser) return;
		try {
			const response = await fetch(`${API_URL}/api/study/tasks?userId=${currentUser.id}`);
			tasks = await response.json();
			renderTasksPage();
		} catch (error) {
			console.error("Failed to fetch tasks:", error);
		}
	}
	async function addTask() {
		const text = taskInput.value.trim();
		const subject = taskSubjectSelect.value;
		const time = taskTimeInput.value;
		const deadline = taskDeadlineInput.value;
		if (!text || !subject || !time || !deadline) return;
		const tempId = `temp_${Date.now()}`;
		const optimisticTask = {_id: tempId, text, subject, time, deadline, completed: false, subTasks: []};
		tasks.push(optimisticTask);
		renderTasksPage();
		taskInput.value = "";
		taskTimeInput.value = "";
		taskDeadlineInput.value = "";
		taskErrorEl.textContent = "";
		try {
			const response = await fetch(`${API_URL}/api/study/tasks`, {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({text, subject, time, deadline, userId: currentUser.id}),
			});
			if (!response.ok) throw new Error("Server error");
			await loadTasks();
		} catch (error) {
			console.error("Failed to add task:", error);
			tasks = tasks.filter((t) => t._id !== tempId);
			renderTasksPage();
			taskErrorEl.textContent = "Failed to save task. Please try again.";
			setTimeout(() => (taskErrorEl.textContent = ""), 3000);
		}
	}
	async function toggleTask(task) {
		try {
			await fetch(`${API_URL}/api/study/tasks/${task._id}`, {method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify({completed: !task.completed})});
			await loadTasks();
		} catch (error) {
			console.error("Failed to toggle task:", error);
		}
	}
	async function deleteTask(taskId) {
		try {
			await fetch(`${API_URL}/api/study/tasks/${taskId}`, {method: "DELETE"});
			await loadTasks();
		} catch (error) {
			console.error("Failed to delete task:", error);
		}
	}

	// --- Sub-task functions ---
	async function addSubTask(taskId, text, fromModal = false) {
		if (!text.trim()) return;
		const task = tasks.find((t) => t._id === taskId);
		if (!task) return;
		const tempSubId = `temp_${Date.now()}`;
		const optimisticSubTask = {_id: tempSubId, text, completed: false};
		if (!task.subTasks) task.subTasks = [];
		task.subTasks.push(optimisticSubTask);

		if (fromModal) {
			renderSubtasksInModal(taskId);
		} else {
			renderTasksPage();
		}

		try {
			const response = await fetch(`${API_URL}/api/study/tasks/${taskId}/subtasks`, {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({text}),
			});
			if (!response.ok) throw new Error("Server error");

			const updatedTask = await response.json();
			const taskIndex = tasks.findIndex((t) => t._id === taskId);
			if (taskIndex !== -1) tasks[taskIndex] = updatedTask;

			if (fromModal) {
				renderSubtasksInModal(taskId);
			} else {
				renderTasksPage();
			}
		} catch (error) {
			console.error("Failed to add sub-task:", error);
			const taskToRevert = tasks.find((t) => t._id === taskId);
			if (taskToRevert) {
				taskToRevert.subTasks = taskToRevert.subTasks.filter((st) => st._id !== tempSubId);
			}
			if (fromModal) {
				renderSubtasksInModal(taskId);
			} else {
				renderTasksPage();
			}
		}
	}
	async function toggleSubTask(taskId, subtaskId, completed) {
		const task = tasks.find((t) => t._id === taskId);
		const subTask = task?.subTasks.find((st) => st._id === subtaskId);
		if (!subTask) return;
		const oldStatus = subTask.completed;
		subTask.completed = completed;
		renderTasksPage();
		try {
			await updateSubTask(taskId, subtaskId, {completed});
		} catch (error) {
			console.error("Failed to toggle sub-task:", error);
			subTask.completed = oldStatus;
			renderTasksPage();
		}
	}

	async function updateSubTask(taskId, subtaskId, updates, fromModal = false) {
		try {
			const response = await fetch(`${API_URL}/api/study/tasks/${taskId}/subtasks/${subtaskId}`, {
				method: "PUT",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify(updates),
			});
			if (!response.ok) throw new Error("Server error");

			const updatedTask = await response.json();
			const taskIndex = tasks.findIndex((t) => t._id === taskId);
			if (taskIndex !== -1) tasks[taskIndex] = updatedTask;

			if (fromModal) {
				renderSubtasksInModal(taskId);
			} else {
				renderTasksPage();
			}
		} catch (error) {
			console.error("Failed to update sub-task:", error);
			// Optional: add logic to revert optimistic update on failure
		}
	}

	async function deleteSubTask(taskId, subtaskId, fromModal = false) {
		try {
			const response = await fetch(`${API_URL}/api/study/tasks/${taskId}/subtasks/${subtaskId}`, {
				method: "DELETE",
			});
			if (!response.ok) throw new Error("Server error");

			const updatedTask = await response.json();
			const taskIndex = tasks.findIndex((t) => t._id === taskId);
			if (taskIndex !== -1) tasks[taskIndex] = updatedTask;

			if (fromModal) {
				renderSubtasksInModal(taskId);
			} else {
				renderTasksPage();
			}
		} catch (error) {
			console.error("Failed to delete sub-task:", error);
		}
	}

	// --- Study Log Management (DB) ---
	async function loadStudyLogs() {
		if (!currentUser) return;
		try {
			const response = await fetch(`${API_URL}/api/study/logs?userId=${currentUser.id}`);
			const logsFromServer = await response.json();
			studyLogs = Array.isArray(logsFromServer) ? Object.fromEntries(logsFromServer) : logsFromServer;
			renderStudyLogs();
		} catch (error) {
			console.error("Failed to fetch study logs:", error);
		}
	}
	async function saveStudyLogs() {
		if (!currentUser) return;
		try {
			await fetch(`${API_URL}/api/study/logs`, {method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify({userId: currentUser.id, studyLogs})});
			await updateStreak();
		} catch (error) {
			console.error("Failed to save study logs:", error);
		}
	}

	// --- Streak Management (DB) ---
	async function loadStreak() {
		if (!currentUser) return;
		try {
			const response = await fetch(`${API_URL}/api/study/streak?userId=${currentUser.id}`);
			const data = await response.json();
			if (data.error) {
				console.error("Failed to load streak:", data.error);
				studyStreak = 0;
				lastStudyDay = "";
			} else {
				studyStreak = data.studyStreak;
				lastStudyDay = data.lastStudyDay;
			}
		} catch (error) {
			console.error("Failed to fetch streak:", error);
			studyStreak = 0;
			lastStudyDay = "";
		}
	}
	async function saveStreak() {
		if (!currentUser) return;
		try {
			await fetch(`${API_URL}/api/study/streak`, {
				method: "PUT",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({userId: currentUser.id, studyStreak, lastStudyDay}),
			});
			renderDashboard();
		} catch (error) {
			console.error("Failed to save streak:", error);
		}
	}

	// --- Core Functionality ---
	function populateCalendarWithExams() {
		exams.forEach((exam) => {
			const d = new Date(exam.date);
			const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
			const timeStr = d.toLocaleTimeString("en-US", {hour: "numeric", minute: "2-digit"});
			if (!events[dateStr]) events[dateStr] = [];
			events[dateStr].push(`${timeStr} - ${exam.subject}`);
		});
	}
	function renderCalendar() {
		calendarDaysEl.innerHTML = "";
		const year = currentDate.getFullYear(),
			month = currentDate.getMonth();
		monthYearEl.textContent = `${new Date(year, month).toLocaleString("en-US", {month: "long"})} ${year}`;
		const firstDay = new Date(year, month, 1).getDay();
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		for (let i = 0; i < firstDay; i++) calendarDaysEl.appendChild(document.createElement("div"));
		for (let i = 1; i <= daysInMonth; i++) {
			const dayEl = document.createElement("div");
			dayEl.className = "day cursor-pointer p-2 md:p-3 rounded-xl flex flex-col items-start min-h-[90px]";
			const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
			dayEl.dataset.date = dateStr;
			const dayNum = document.createElement("span");
			dayNum.textContent = i;
			dayNum.className = "text-sm font-medium";
			if (new Date().toDateString() === new Date(dateStr + "T00:00:00").toDateString()) dayNum.className += " bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center";
			else dayNum.className += " text-slate-700 dark:text-slate-300";
			dayEl.appendChild(dayNum);
			if (events[dateStr]) {
				const eventsContainer = document.createElement("div");
				eventsContainer.className = "mt-1 text-xs space-y-1 w-full overflow-hidden";
				events[dateStr].slice(0, 2).forEach((txt) => {
					const pill = document.createElement("div");
					pill.className = "p-1 rounded text-[10px] truncate font-medium";
					const color = getColorForSubject(txt);
					pill.style.backgroundColor = color + "20";
					pill.style.color = color;
					pill.textContent = txt;
					eventsContainer.appendChild(pill);
				});
				dayEl.appendChild(eventsContainer);
			}
			dayEl.addEventListener("click", () => openModal(dateStr));
			calendarDaysEl.appendChild(dayEl);
		}
	}
	function renderCountdowns() {
		countdownContainer.innerHTML = "";
		const upcomingExams = exams.filter((e) => new Date(e.date) > new Date()).sort((a, b) => new Date(a.date) - new Date(b.date));
		if (upcomingExams.length === 0) {
			countdownContainer.innerHTML = '<p class="text-slate-500 dark:text-slate-400">No more exams! 🎉</p>';
			return;
		}
		const nextExam = upcomingExams[0];
		const otherExams = upcomingExams.slice(1);

		let featuredHtml = `
            <div>
                <p class="text-sm font-semibold text-slate-600 dark:text-slate-400">Next Up</p>
                <div class="p-4 mt-2 rounded-lg bg-slate-100 dark:bg-slate-700/50 border-l-4" style="border-color: ${getColorForSubject(nextExam.subject)}">
                     <div class="flex items-center justify-between">
                        <p class="font-bold text-slate-800 dark:text-slate-200">${nextExam.subject}</p>
                        ${nextExam.subject.toLowerCase().includes("rbt") ? `<div class="w-3 h-3 rounded-full" style="background-color:${RBT_ACCENT};"></div>` : ""}
                    </div>
                    <p class="countdown-timer text-2xl font-mono text-slate-600 dark:text-slate-300 mt-1" data-date="${nextExam.date}"></p>
                </div>
            </div>
        `;

		let othersHtml = "";
		if (otherExams.length > 0) {
			othersHtml += '<h3 class="text-lg font-semibold text-slate-700 dark:text-slate-200 mt-6 mb-2">Upcoming</h3><div id="other-exams-carousel" class="flex overflow-x-auto gap-4 pb-4 hide-scrollbar">';
			otherExams.forEach((exam) => {
				othersHtml += `
                    <div class="flex-shrink-0 w-48 p-3 rounded-lg bg-slate-100 dark:bg-slate-700/50 border-l-4" style="border-color: ${getColorForSubject(exam.subject)}">
                        <p class="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">${exam.subject}</p>
                        <p class="countdown-timer text-lg font-mono text-slate-600 dark:text-slate-300 mt-1" data-date="${exam.date}"></p>
                    </div>
                `;
			});
			othersHtml += "</div>";
		}

		countdownContainer.innerHTML = featuredHtml + othersHtml;

		const carousel = document.getElementById("other-exams-carousel");
		if (carousel) {
			carousel.addEventListener("wheel", (event) => {
				event.preventDefault();
				carousel.scrollLeft += event.deltaY;
			});
		}

		updateAllCountdowns();
	}
	function updateAllCountdowns() {
		document.querySelectorAll(".countdown-timer").forEach((timerEl) => {
			const targetDate = new Date(timerEl.dataset.date).getTime();
			const now = new Date().getTime();
			const diff = targetDate - now;
			if (diff > 0) {
				const d = Math.floor(diff / (1e3 * 60 * 60 * 24)),
					h = Math.floor((diff % (1e3 * 60 * 60 * 24)) / (1e3 * 60 * 60)),
					m = Math.floor((diff % (1e3 * 60 * 60)) / (1e3 * 60)),
					s = Math.floor((diff % (1e3 * 60)) / 1e3);
				timerEl.textContent = `${String(d).padStart(2, "0")}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
			} else {
				timerEl.textContent = "Exam has started!";
				timerEl.classList.add("text-green-600", "font-semibold");
			}
		});
	}
	function renderTasksPage() {
		let tasksToRender = [...tasks];
		if (taskSubjectFilter !== "all") {
			tasksToRender = tasksToRender.filter((task) => task.subject === taskSubjectFilter);
		}
		if (taskStatusFilter === "completed") {
			tasksToRender = tasksToRender.filter((task) => task.completed);
		} else if (taskStatusFilter === "inprogress") {
			tasksToRender = tasksToRender.filter((task) => !task.completed);
		}
		if (taskSort === "dueDate") {
			tasksToRender.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
		} else if (taskSort === "time") {
			tasksToRender.sort((a, b) => a.time - b.time);
		}
		fullTaskListEl.innerHTML = "";
		if (!tasksToRender.length) {
			fullTaskListEl.innerHTML = `<p class="text-slate-400 text-center py-4">No tasks match your filters.</p>`;
			return;
		}
		tasksToRender.forEach((task) => {
			const el = document.createElement("div");
			el.className = "task-item p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg";
			el.dataset.id = task._id;
			const completedClass = task.completed ? " line-through text-slate-400 dark:text-slate-500" : "";
			let subtasksHtml = '<div class="pl-6 mt-2 space-y-1">';
			let progressBarHtml = "";
			if (task.subTasks && task.subTasks.length > 0) {
				const completedCount = task.subTasks.filter((st) => st.completed).length;
				const totalCount = task.subTasks.length;
				const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
				progressBarHtml = `
                    <div class="mt-2 flex items-center gap-2">
                        <div class="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                            <div class="bg-green-500 h-2 rounded-full" style="width: ${percentage}%"></div>
                        </div>
                        <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">${completedCount}/${totalCount}</span>
                    </div>
                `;
				task.subTasks.forEach((st) => {
					const subCompletedClass = st.completed ? " line-through text-slate-500" : "dark:text-slate-300";
					subtasksHtml += `
                        <div class="subtask-item group flex items-center justify-between" data-id="${st._id}" data-parent-id="${task._id}">
                            <div class="flex items-center flex-grow">
                                <input type="checkbox" ${st.completed ? "checked" : ""} class="subtask-checkbox h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer">
                                <span class="subtask-text-view ml-2 text-sm cursor-pointer ${subCompletedClass}">${st.text}</span>
                            </div>
                            <button class="delete-subtask-btn text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    `;
				});
			}
			subtasksHtml += "</div>";

			el.innerHTML = `
                <div class="flex items-start justify-between group">
                    <div class="flex items-start flex-grow">
                        <input type="checkbox" ${task.completed ? "checked" : ""} class="task-checkbox mt-1 mr-3 h-5 w-5 rounded border-gray-300 text-blue-600 cursor-pointer">
                        <div class="task-details-view w-full">
                            <p class="font-medium text-slate-700 dark:text-slate-200 ${completedClass}">${task.text}</p>
                            <div class="flex flex-wrap items-center gap-x-2 text-xs mt-1 ${completedClass}">
                                <span class="flex items-center font-semibold" style="color:${getColorForSubject(task.subject)};"><span class="w-2 h-2 rounded-full mr-1.5" style="background-color:${getColorForSubject(task.subject)};"></span>${task.subject}</span>
                                <span class="dark:text-slate-400">•</span><span class="dark:text-slate-400">${task.time} mins</span><span class="dark:text-slate-400">•</span><span class="dark:text-slate-400">${new Date(task.deadline).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center">
                         <button class="edit-task-btn opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-500 mr-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="delete-task-btn opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </div>
                ${progressBarHtml}
                ${subtasksHtml}
                <div class="mt-2 pl-6 flex items-center gap-2">
                    <input type="text" id="subtask-input-${task._id}" class="w-full text-sm p-1 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700" placeholder="Add sub-task...">
                    <button class="add-subtask-btn text-xs bg-blue-500 text-white rounded px-2 py-1" data-task-id="${task._id}">Add</button>
                </div>
            `;
			fullTaskListEl.appendChild(el);
		});
	}

	function renderStudyLogs() {
		studyLogContainer.innerHTML = "";
		if (!Object.keys(studyLogs).length) {
			studyLogContainer.innerHTML = `<p class="text-slate-400 text-center py-2">No sessions logged.</p>`;
			return;
		}
		for (const subject in studyLogs) {
			const el = document.createElement("div");
			el.className = "flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-700/50 rounded-md text-sm";
			el.innerHTML = `<div class="flex items-center"><span class="w-2.5 h-2.5 rounded-full mr-2" style="background-color:${getColorForSubject(subject)};"></span><span class="font-medium text-slate-700 dark:text-slate-200">${subject}</span></div><span class="font-semibold text-slate-600 dark:text-slate-300">${formatLogTime(studyLogs[subject] || 0)}</span>`;
			studyLogContainer.appendChild(el);
		}
	}

	function updateTimerDisplay() {
		timerDisplay.textContent = formatTime(timeLeft);
		updatePiPTimer();
	}

	function playNotificationSound() {
		const a = new (window.AudioContext || window.webkitAudioContext)();
		const o = a.createOscillator();
		o.type = "sine";
		o.frequency.setValueAtTime(600, a.currentTime);
		o.connect(a.destination);
		o.start();
		setTimeout(() => o.stop(), 200);
	}

	function switchMode(mode) {
		clearInterval(timerInterval);
		timerInterval = null;
		isPaused = true;
		currentMode = mode;
		modeIndicator.textContent = mode;
		playPauseBtn.textContent = "Start";
		timeLeft = (mode === "focus" ? focusDurationInput.value : breakDurationInput.value) * 60;
		updateTimerDisplay();
		closePiPTimer();
		if (ytPlayer && typeof ytPlayer.stopVideo === "function") {
			ytPlayer.stopVideo();
			youtubePlayerContainer.classList.add("hidden");
			currentPlayingSoundId = null;
			renderSoundLibrary();
		}
	}

	function playPauseTimer() {
		isPaused = !isPaused;
		playPauseBtn.textContent = isPaused ? "Resume" : "Pause";
		if (isPaused) {
			clearInterval(timerInterval);
			saveStudyLogs();
			closePiPTimer();
			if (ytPlayer && typeof ytPlayer.pauseVideo === "function" && currentPlayingSoundId) {
				ytPlayer.pauseVideo();
			}
		} else {
			if (document.visibilityState === "hidden") {
				handleVisibilityChangeForPiP();
			}
			if (ytPlayer && typeof ytPlayer.playVideo === "function" && currentPlayingSoundId) {
				ytPlayer.playVideo();
			}
			timerInterval = setInterval(() => {
				timeLeft--;
				if (currentMode === "focus") {
					const subject = pomodoroSubjectSelect.value;
					studyLogs[subject] = (studyLogs[subject] || 0) + 1;
					renderStudyLogs();
				}
				updateTimerDisplay();
				if (timeLeft <= 0) {
					playNotificationSound();
					if (currentMode === "focus") {
						saveStudyLogs();
					}
					switchMode(currentMode === "focus" ? "break" : "focus");
				}
			}, 1000);
		}
	}
	function openModal(date) {
		selectedDate = date;
		modalDateEl.textContent = new Date(date + "T00:00:00").toLocaleDateString("en-US", {weekday: "long", year: "numeric", month: "long", day: "numeric"});
		eventTitleInput.value = "";
		eventModal.classList.remove("hidden");
	}
	function closeModal() {
		eventModal.classList.add("hidden");
	}
	function saveEvent() {
		const title = eventTitleInput.value.trim();
		if (title && selectedDate) {
			if (!events[selectedDate]) events[selectedDate] = [];
			events[selectedDate].push(`Custom: ${title}`);
			renderCalendar();
			closeModal();
		}
	}

	function openEditModal(taskId) {
		const task = tasks.find((t) => t._id === taskId);
		if (!task) return;

		editingTaskId = taskId;
		editTaskText.value = task.text;
		editTaskSubject.value = task.subject;
		editTaskTime.value = task.time;
		editTaskDeadline.value = new Date(task.deadline).toISOString().split("T")[0];

		renderSubtasksInModal(taskId);

		editTaskModal.classList.remove("hidden");
	}

	function closeEditModal() {
		editingTaskId = null;
		editTaskModal.classList.add("hidden");
	}

	async function saveTaskEdits() {
		if (!editingTaskId) return;
		const taskIdToSave = editingTaskId;
		const updates = {
			text: editTaskText.value.trim(),
			subject: editTaskSubject.value,
			time: editTaskTime.value,
			deadline: editTaskDeadline.value,
		};

		// Optimistic UI update
		const taskIndex = tasks.findIndex((t) => t._id === taskIdToSave);
		if (taskIndex > -1) {
			// Important: Merge updates with existing subTasks to avoid deleting them
			const existingSubTasks = tasks[taskIndex].subTasks || [];
			tasks[taskIndex] = {...tasks[taskIndex], ...updates, subTasks: existingSubTasks};
			renderTasksPage();
		}

		closeEditModal();

		try {
			// Use the locally saved ID for the fetch request
			await fetch(`${API_URL}/api/study/tasks/${taskIdToSave}`, {
				method: "PUT",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify(updates),
			});
			// Reload tasks from server to get the final state
			await loadTasks();
		} catch (error) {
			console.error("Failed to save task changes:", error);
			// If save fails, reload tasks from server to revert the optimistic update
			await loadTasks();
		}
	}

	function renderSubtasksInModal(taskId) {
		const task = tasks.find((t) => t._id === taskId);
		editSubtaskList.innerHTML = "";
		if (!task || !task.subTasks || task.subTasks.length === 0) {
			editSubtaskList.innerHTML = '<p class="text-slate-400 text-sm text-center">No sub-tasks yet.</p>';
			return;
		}

		task.subTasks.forEach((st) => {
			const subtaskEl = document.createElement("div");
			subtaskEl.className = "subtask-item-edit group flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg";
			subtaskEl.dataset.id = st._id;
			const subCompletedClass = st.completed ? " line-through text-slate-500" : "dark:text-slate-300";

			subtaskEl.innerHTML = `
                <span class="subtask-text-edit text-sm cursor-pointer ${subCompletedClass}">${st.text}</span>
                <button class="delete-subtask-btn-edit text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            `;
			editSubtaskList.appendChild(subtaskEl);
		});
	}

	function handleVisibilityChangeForPiP() {
		const timerIsActive = timerInterval && !isPaused;
		if (document.visibilityState === "hidden" && timerIsActive) {
			openPiPTimer();
		} else if (document.visibilityState === "visible") {
			closePiPTimer();
		}
	}

	async function openPiPTimer() {
		if (document.pictureInPictureElement) {
			return;
		}
		if (!pipVideoElement) {
			pipVideoElement = document.createElement("video");
			pipVideoElement.autoplay = true;
			pipVideoElement.muted = true;
			pipCanvas = document.createElement("canvas");
			pipCanvas.width = 400;
			pipCanvas.height = 200;
			pipContext = pipCanvas.getContext("2d");
			pipVideoElement.srcObject = pipCanvas.captureStream();
			pipVideoElement.addEventListener("leavepictureinpicture", () => {
				pipVideoElement.pause();
			});
		}
		updatePiPTimer();
		try {
			await pipVideoElement.play();
			await pipVideoElement.requestPictureInPicture();
		} catch (error) {
			console.error("PiP Error:", error);
		}
	}

	function updatePiPTimer() {
		if (!pipContext) return;
		const isDarkMode = document.documentElement.classList.contains("dark");
		const bgColor = isDarkMode ? "#1e293b" : "#f1f5f9";
		const textColor = isDarkMode ? "#f1f5f9" : "#1e293b";
		const modeColor = isDarkMode ? "#94a3b8" : "#64748b";

		// Background
		pipContext.fillStyle = bgColor;
		pipContext.fillRect(0, 0, pipCanvas.width, pipCanvas.height);

		// Mode Text (e.g., "Focus")
		pipContext.fillStyle = modeColor;
		pipContext.font = "24px 'Inter', sans-serif";
		pipContext.textAlign = "center";
		pipContext.fillText(currentMode.charAt(0).toUpperCase() + currentMode.slice(1), pipCanvas.width / 2, 60);

		// Timer Text
		pipContext.fillStyle = textColor;
		pipContext.font = "bold 70px 'Inter', sans-serif";
		pipContext.fillText(formatTime(timeLeft), pipCanvas.width / 2, 140);
	}

	async function closePiPTimer() {
		if (document.pictureInPictureElement) {
			try {
				await document.exitPictureInPicture();
			} catch (error) {
				console.error("Error exiting PiP:", error);
			}
		}
		if (pipVideoElement && !pipVideoElement.paused) {
			pipVideoElement.pause();
		}
	}

	// --- EDITED: All functions for the Sound Library feature ---

	// Load the user's sound library from the database
	async function loadSoundLibrary() {
		if (!currentUser) return;
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
		soundLibraryList.innerHTML = "";
		if (soundLibrary.length === 0) {
			soundLibraryList.innerHTML = `<p class="text-slate-400 text-center text-sm py-2">Your sound library is empty.</p>`;
			return;
		}
		soundLibrary.forEach((sound) => {
			const isPlaying = sound._id === currentPlayingSoundId;
			const el = document.createElement("div");
			el.className = `sound-item group flex items-center justify-between p-2 rounded-lg text-sm ${isPlaying ? "bg-blue-100 dark:bg-blue-900/50" : "hover:bg-slate-100 dark:hover:bg-slate-700/50"}`;
			el.innerHTML = `
                <span class="font-medium text-slate-700 dark:text-slate-200 truncate">${sound.name}</span>
                <div class="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
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
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({userId: currentUser.id, name, url}),
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
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({userId: currentUser.id, name: newName.trim(), url: newUrl.trim()}),
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
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({userId: currentUser.id}),
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

	async function saveFlashcardSet(id, name, subject) {
		const isEditing = !!id;
		const url = isEditing ? `${API_URL}/api/study/flashcard-sets/${id}` : `${API_URL}/api/study/flashcard-sets`;
		const method = isEditing ? "PUT" : "POST";

		try {
			const response = await fetch(url, {
				method: method,
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({name, subject, userId: currentUser.id}),
			});
			if (!response.ok) throw new Error("Failed to save set");
			await loadFlashcardSets();
			closeSetModal();
		} catch (error) {
			console.error("Error saving flashcard set:", error);
			// You might want to show an error message in the modal
		}
	}

	async function deleteFlashcardSet(setId) {
		if (!confirm("Are you sure you want to delete this entire set? This action cannot be undone.")) return;
		try {
			await fetch(`${API_URL}/api/study/flashcard-sets/${setId}`, {method: "DELETE"});
			await loadFlashcardSets(); // Refresh the list view
		} catch (error) {
			console.error("Error deleting set:", error);
		}
	}

	async function saveFlashcard(setId, cardId, front, back) {
		const isEditing = !!cardId;
		const url = isEditing ? `${API_URL}/api/study/flashcard-sets/${setId}/cards/${cardId}` : `${API_URL}/api/study/flashcard-sets/${setId}/cards`;
		const method = isEditing ? "PUT" : "POST";

		try {
			const response = await fetch(url, {
				method: method,
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({front, back}),
			});
			if (!response.ok) throw new Error("Failed to save card");
			currentFlashcardSet = await response.json(); // Update the current set with the response
			const setIndex = flashcardSets.findIndex((set) => set._id === setId);
			if (setIndex !== -1) flashcardSets[setIndex] = currentFlashcardSet;

			renderSingleSetView(currentFlashcardSet); // Re-render the cards grid
			closeCardModal();
		} catch (error) {
			console.error("Error saving card:", error);
		}
	}

	async function deleteFlashcard(setId, cardId) {
		if (!confirm("Delete this card?")) return;
		try {
			const response = await fetch(`${API_URL}/api/study/flashcard-sets/${setId}/cards/${cardId}`, {method: "DELETE"});
			if (!response.ok) throw new Error("Failed to delete card");
			currentFlashcardSet = await response.json();
			const setIndex = flashcardSets.findIndex((set) => set._id === setId);
			if (setIndex !== -1) flashcardSets[setIndex] = currentFlashcardSet;
			renderSingleSetView(currentFlashcardSet);
		} catch (error) {
			console.error("Error deleting card:", error);
		}
	}

	// ==========================================
	// FLASHCARD RENDERING & LOGIC
	// ==========================================

	function renderFlashcardSets() {
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
                <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button data-action="edit" class="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button data-action="delete" class="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-red-200 dark:hover:bg-red-800/50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
                <p class="font-bold text-lg text-slate-800 dark:text-slate-100">${set.name}</p>
                <p class="text-sm text-slate-500 dark:text-slate-400" style="color:${getColorForSubject(set.subject)};">${set.subject}</p>
                <p class="text-sm text-slate-400 dark:text-slate-500 mt-2">${set.flashcards.length} cards</p>
            `;
			flashcardSetsGrid.appendChild(el);
		});
	}

	function renderSingleSetView(set) {
		currentFlashcardSet = set;
		singleSetName.textContent = set.name;
		singleSetSubject.textContent = set.subject;
		singleSetCardsGrid.innerHTML = "";

		if (set.flashcards.length === 0) {
			singleSetCardsGrid.innerHTML = `<p class="text-slate-500 dark:text-slate-400 col-span-full text-center">This set is empty. Click "Add/Edit Cards" to create your first flashcard.</p>`;
		} else {
			set.flashcards.forEach((card) => {
				const el = document.createElement("div");
				// Use relative and group for hover-reveal buttons
				el.className = "relative group perspective";
				el.innerHTML = `
                    <div class="card-preview-flipper" data-card-id="${card._id}">
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
		flashcardSetSubjectInput.innerHTML = "";
		Object.keys(subjectColors).forEach((s) => flashcardSetSubjectInput.add(new Option(s, s)));

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
		} else if (flipper) {
			// Only flip the card if not clicking on a button inside it
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

	// --- App Start ---
	checkAuthAndInitialize();
});
