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
	// NEW: Edit Task Modal Elements
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
	let editingTaskId = null; // NEW: To track which task is being edited

	// --- Constants & Config ---
	const API_URL = "https://wot-tau.vercel.app"; //http://localhost:3005
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
			openEditModal(taskItem.dataset.id); // CHANGED
		} else if (target.closest(".delete-subtask-btn") && subtaskItem) {
			// CHANGED
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
		switchMode(currentMode === "focus" ? "break" : "focus");
	});
	focusDurationInput.addEventListener("change", () => currentMode === "focus" && switchMode("focus"));
	breakDurationInput.addEventListener("change", () => currentMode === "break" && switchMode("break"));
	closeModalBtn.addEventListener("click", closeModal);
	saveEventBtn.addEventListener("click", saveEvent);
	eventModal.addEventListener("click", (e) => e.target === eventModal && closeModal());
	setInterval(updateAllCountdowns, 1000);

	// NEW: Edit Modal Listeners
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

	// --- Data Management (DB & Local) ---
	async function loadDataFromDB() {
		await loadTasks();
		await loadStudyLogs();
		await loadStreak();
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
				currentUser.username = data.user.username; // Update username in currentUser
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
		const pages = {dashboard: dashboardPage, study: studyPage, tasks: tasksPage};
		const navs = {dashboard: navDashboard, study: navStudy, tasks: navTasks};
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
		// MODIFIED
		if (!text.trim()) return;
		const task = tasks.find((t) => t._id === taskId);
		if (!task) return;
		const tempSubId = `temp_${Date.now()}`;
		const optimisticSubTask = {_id: tempSubId, text, completed: false};
		if (!task.subTasks) task.subTasks = [];
		task.subTasks.push(optimisticSubTask);

		if (fromModal) {
			// MODIFIED
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

			// Replace temp task with real one from server
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
		// MODIFIED
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
		// MODIFIED
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

	// REMOVED old inline-edit functions: enterEditMode, saveTaskChanges, enterSubtaskEditMode

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
	}
	function playPauseTimer() {
		isPaused = !isPaused;
		playPauseBtn.textContent = isPaused ? "Resume" : "Pause";
		if (isPaused) {
			clearInterval(timerInterval);
			saveStudyLogs();
		} else {
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

	// --- NEW: Edit Task Modal Functions ---
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

		// Fix: Capture the ID in a local variable before it's nulled by closeEditModal()
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

	// --- App Start ---
	checkAuthAndInitialize();
});
