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

	// START: Add these new DOM element variables for the edit modal
	const editTaskModal = document.getElementById("edit-task-modal");
	const closeEditModalBtn = document.getElementById("close-edit-modal-btn");
	const cancelEditBtn = document.getElementById("cancel-edit-btn");
	const editTaskForm = document.getElementById("edit-task-form");
	const editTaskIdInput = document.getElementById("edit-task-id");
	const editTaskInput = document.getElementById("edit-task-input");
	const editTaskSubject = document.getElementById("edit-task-subject");
	const editTaskTime = document.getElementById("edit-task-time");
	const editTaskDeadline = document.getElementById("edit-task-deadline");
	const editSubtasksList = document.getElementById("edit-subtasks-list");
	const editNewSubtaskInput = document.getElementById("edit-new-subtask-input");
	const editAddSubtaskBtn = document.getElementById("edit-add-subtask-btn");
	const editTaskErrorEl = document.getElementById("edit-task-error");
	// END: Add these new DOM element variables for the edit modal

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

	// --- Constants & Config ---
	// FIX: Changed API_URL to match your local server from the error logs.
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
			const selects = [taskSubjectSelect, pomodoroSubjectSelect, filterSubjectEl, editTaskSubject]; // Add editTaskSubject here
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

		if (target.classList.contains("task-checkbox") && taskItem) {
			const task = tasks.find((t) => t._id === taskItem.dataset.id);
			if (task) toggleTask(task);
		}
		if (target.closest(".delete-task-btn") && taskItem) {
			deleteTask(taskItem.dataset.id);
		}
		// START: Add this block to handle edit button clicks
		if (target.closest(".edit-task-btn") && taskItem) {
			openEditModal(taskItem.dataset.id);
		}
		// END: Add this block to handle edit button clicks
		if (target.classList.contains("add-subtask-btn")) {
			const taskId = target.dataset.taskId;
			const inputEl = document.getElementById(`subtask-input-${taskId}`);
			if (inputEl) {
				addSubTask(taskId, inputEl.value);
				inputEl.value = "";
			}
		}
		if (target.classList.contains("subtask-checkbox") && subtaskItem) {
			const taskId = subtaskItem.dataset.parentId;
			const subtaskId = subtaskItem.dataset.id;
			toggleSubTask(taskId, subtaskId, target.checked);
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

	// START: Add event listeners for the new edit modal
	closeEditModalBtn.addEventListener("click", closeEditModal);
	cancelEditBtn.addEventListener("click", closeEditModal);
	editTaskModal.addEventListener("click", (e) => e.target === editTaskModal && closeEditModal());
	editTaskForm.addEventListener("submit", handleUpdateTask);
	editAddSubtaskBtn.addEventListener("click", handleAddSubtaskInModal);
	editSubtasksList.addEventListener("click", function (e) {
		if (e.target.classList.contains("delete-subtask-in-modal-btn")) {
			e.target.parentElement.remove();
		}
	});
	// END: Add event listeners for the new edit modal

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

		// THE FIX: Ensure settings object exists before assigning to it
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
			// Revert UI on failure if needed
			if (isDarkMode) document.documentElement.classList.remove("dark");
			else document.documentElement.classList.add("dark");

			// Also revert the local state
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

	// START: Add this new function to update a task
	async function updateTask(taskId, updatedData) {
		try {
			// FIX: Corrected the API endpoint to match the backend routes.
			const response = await fetch(`${API_URL}/api/study/tasks/${taskId}`, {
				method: "PUT",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify(updatedData),
			});
			if (!response.ok) throw new Error("Server error");
			await loadTasks(); // Reload tasks to reflect changes
		} catch (error) {
			console.error("Failed to update task:", error);
			editTaskErrorEl.textContent = "Failed to save changes.";
		}
	}
	// END: Add this new function to update a task

	// --- Sub-task functions ---
	async function addSubTask(taskId, text) {
		if (!text.trim()) return;
		const task = tasks.find((t) => t._id === taskId);
		if (!task) return;
		const tempSubId = `temp_${Date.now()}`;
		const optimisticSubTask = {_id: tempSubId, text, completed: false};
		if (!task.subTasks) task.subTasks = [];
		task.subTasks.push(optimisticSubTask);
		renderTasksPage();
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
			renderTasksPage();
		} catch (error) {
			console.error("Failed to add sub-task:", error);
			task.subTasks = task.subTasks.filter((st) => st._id !== tempSubId);
			renderTasksPage();
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
			const response = await fetch(`${API_URL}/api/study/tasks/${taskId}/subtasks/${subtaskId}`, {
				method: "PUT",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({completed}),
			});
			if (!response.ok) throw new Error("Server error");
		} catch (error) {
			console.error("Failed to toggle sub-task:", error);
			subTask.completed = oldStatus;
			renderTasksPage();
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

		// FIX: Removed incorrect HTML block that was causing the ReferenceError.
		// This now correctly renders only the exam countdown information.
		let featuredHtml = `
            <div>
                <p class="text-sm font-semibold text-slate-600 dark:text-slate-400">Next Up</p>
                <div class="p-4 mt-2 rounded-lg bg-slate-100 dark:bg-slate-700/50 border-l-4" style="border-color: ${getColorForSubject(nextExam.subject)}">
                     <div class="flex items-center justify-between">
                        <p class="font-bold text-slate-800 dark:text-slate-200">${nextExam.subject}</p>
                        ${nextExam.subject.toLowerCase().includes("rbt") ? `<div class="w-3 h-3 rounded-full" style="background-color:${RBT_ACCENT};"></div>` : ""}
                    </div>
                    <p class="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-2" data-deadline="${nextExam.date}">Loading...</p>
                    <p class="text-xs text-slate-500 dark:text-slate-400">${new Date(nextExam.date).toLocaleString("en-US", {weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"})}</p>
                </div>
            </div>
        `;

		if (otherExams.length > 0) {
			featuredHtml += `<p class="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-6 mb-2">Also Coming Up</p><div class="flex overflow-x-auto space-x-3 pb-2 hide-scrollbar">`;
			otherExams.slice(0, 4).forEach((exam) => {
				featuredHtml += `
                    <div class="flex-shrink-0 w-48 p-3 rounded-lg bg-slate-100 dark:bg-slate-700/50">
                        <div class="flex items-center">
                            <div class="w-2 h-2 rounded-full mr-2" style="background-color: ${getColorForSubject(exam.subject)};"></div>
                            <p class="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">${exam.subject}</p>
                        </div>
                        <p class="text-lg font-bold text-slate-600 dark:text-slate-400 mt-1" data-deadline="${exam.date}">Loading...</p>
                    </div>
                `;
			});
			featuredHtml += `</div>`;
		}

		countdownContainer.innerHTML = featuredHtml;
		updateAllCountdowns();
	}

	// FIX: This function was missing from the provided code and is needed for the task page to render.
	function renderTasksPage() {
		fullTaskListEl.innerHTML = "";
		let filteredTasks = tasks;
		if (taskSubjectFilter !== "all") {
			filteredTasks = filteredTasks.filter((t) => t.subject === taskSubjectFilter);
		}
		if (taskStatusFilter !== "all") {
			filteredTasks = filteredTasks.filter((t) => (taskStatusFilter === "completed" ? t.completed : !t.completed));
		}
		filteredTasks.sort((a, b) => {
			if (taskSort === "dueDate") return new Date(a.deadline) - new Date(b.deadline);
			if (taskSort === "subject") return a.subject.localeCompare(b.subject);
			return 0;
		});

		if (filteredTasks.length === 0) {
			fullTaskListEl.innerHTML = `<p class="text-center text-slate-500 dark:text-slate-400 col-span-full py-8">No tasks match the current filters.</p>`;
			return;
		}

		filteredTasks.forEach((task) => {
			const el = document.createElement("div");
			el.className = `task-item group p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 ${task.completed ? "opacity-60" : ""}`;
			el.dataset.id = task._id;

			let subtasksHtml = "";
			if (task.subTasks && task.subTasks.length > 0) {
				subtasksHtml += '<div class="mt-3 space-y-2">';
				task.subTasks.forEach((st) => {
					subtasksHtml += `
						<div class="subtask-item flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md" data-id="${st._id}" data-parent-id="${task._id}">
							<div class="flex items-center">
								<input type="checkbox" class="subtask-checkbox h-4 w-4 rounded border-gray-300 text-blue-600" ${st.completed ? "checked" : ""}>
								<label class="ml-2 text-sm text-slate-700 dark:text-slate-300 ${st.completed ? "line-through" : ""}">${st.text}</label>
							</div>
						</div>
					`;
				});
				subtasksHtml += "</div>";
			}

			let progressBarHtml = "";
			if (task.subTasks && task.subTasks.length > 0) {
				const completedCount = task.subTasks.filter((st) => st.completed).length;
				const totalCount = task.subTasks.length;
				const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
				progressBarHtml = `
                    <div class="mt-3 flex items-center gap-2">
                        <div class="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                            <div class="bg-blue-600 h-2 rounded-full" style="width: ${percentage}%"></div>
                        </div>
                        <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">${completedCount}/${totalCount}</span>
                    </div>`;
			}

			el.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex items-start gap-3">
                        <input type="checkbox" class="task-checkbox h-5 w-5 rounded border-gray-300 text-blue-600 mt-1" ${task.completed ? "checked" : ""}>
                        <div>
                            <p class="font-semibold text-slate-800 dark:text-slate-200 ${task.completed ? "line-through" : ""}">${task.text}</p>
                            <div class="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                <span><strong class="font-medium">Subject:</strong> ${task.subject}</span>
                                <span><strong class="font-medium">Time:</strong> ${task.time} min</span>
                                <span class="${new Date(task.deadline) < new Date() && !task.completed ? "text-red-500 font-bold" : ""}"><strong class="font-medium">Deadline:</strong> ${new Date(task.deadline).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center">
                        <button class="edit-task-btn p-1 text-slate-400 hover:text-blue-500 transition opacity-0 group-hover:opacity-100"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-edit-2 pointer-events-none"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg></button>
                        <button class="delete-task-btn opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 ml-2"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="pointer-events-none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
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

	// START: Add this missing function
	function updateAllCountdowns() {
		const countdownEls = document.querySelectorAll("[data-deadline]");
		countdownEls.forEach((el) => {
			const deadline = new Date(el.dataset.deadline);
			const now = new Date();
			const diff = deadline - now;

			if (diff < 0) {
				el.textContent = "Event has passed!";
				return;
			}
			const days = Math.floor(diff / (1000 * 60 * 60 * 24));
			const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
			const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
			const seconds = Math.floor((diff % (1000 * 60)) / 1000);

			el.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
		});
	}
	// END: Add this missing function

	// START: Add these new functions for handling the edit modal
	function openEditModal(taskId) {
		const task = tasks.find((t) => t._id === taskId);
		if (!task) return;

		editTaskIdInput.value = taskId;
		editTaskInput.value = task.text;
		editTaskSubject.value = task.subject;
		editTaskTime.value = task.time;
		editTaskDeadline.value = getDateString(new Date(task.deadline));

		renderSubtasksInModal(task.subTasks || []);
		editTaskModal.classList.remove("hidden");
	}

	function closeEditModal() {
		editTaskModal.classList.add("hidden");
		editTaskForm.reset();
		editTaskErrorEl.textContent = "";
	}

	function renderSubtasksInModal(subtasks) {
		editSubtasksList.innerHTML = "";
		subtasks.forEach((sub) => {
			const el = document.createElement("div");
			el.className = "flex items-center gap-2";
			// Use a unique property like a timestamp for new subtasks if _id doesn't exist
			el.dataset.id = sub._id || `new_${Date.now()}`;
			el.innerHTML = `
				<input type="checkbox" ${sub.completed ? "checked" : ""} class="edit-subtask-checkbox h-4 w-4 rounded border-gray-300 text-blue-600">
				<input type="text" value="${sub.text}" class="edit-subtask-text w-full text-sm p-1 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700">
				<button type="button" class="delete-subtask-in-modal-btn text-slate-400 hover:text-red-500">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="pointer-events-none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
				</button>
			`;
			editSubtasksList.appendChild(el);
		});
	}

	function handleAddSubtaskInModal() {
		const text = editNewSubtaskInput.value.trim();
		if (!text) return;

		const el = document.createElement("div");
		el.className = "flex items-center gap-2";
		el.dataset.id = `new_${Date.now()}`;
		el.innerHTML = `
			<input type="checkbox" class="edit-subtask-checkbox h-4 w-4 rounded border-gray-300 text-blue-600">
			<input type="text" value="${text}" class="edit-subtask-text w-full text-sm p-1 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700">
			<button type="button" class="delete-subtask-in-modal-btn text-slate-400 hover:text-red-500">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="pointer-events-none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
			</button>
		`;
		editSubtasksList.appendChild(el);
		editNewSubtaskInput.value = "";
	}

	function handleUpdateTask(e) {
		e.preventDefault();
		const taskId = editTaskIdInput.value;
		const subtaskElements = editSubtasksList.querySelectorAll(".flex");
		const updatedSubtasks = Array.from(subtaskElements)
			.map((el) => {
				const originalSubtask = tasks.find((t) => t._id === taskId)?.subTasks.find((st) => st._id === el.dataset.id);
				return {
					_id: originalSubtask ? originalSubtask._id : undefined, // only include _id if it exists
					text: el.querySelector(".edit-subtask-text").value.trim(),
					completed: el.querySelector(".edit-subtask-checkbox").checked,
				};
			})
			.filter((sub) => sub.text);

		const updatedData = {
			text: editTaskInput.value,
			subject: editTaskSubject.value,
			time: editTaskTime.value,
			deadline: editTaskDeadline.value,
			subTasks: updatedSubtasks,
		};

		updateTask(taskId, updatedData);
		closeEditModal();
	}
	// END: Add these new functions for handling the edit modal

	// --- App Start ---
	checkAuthAndInitialize();
});
