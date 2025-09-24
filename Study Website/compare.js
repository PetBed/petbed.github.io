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
	const eventModal = document.getElementById("event-modal");
	const closeModalBtn = document.getElementById("close-modal");
	const eventTitleInput = document.getElementById("event-title");
	const saveEventBtn = document.getElementById("save-event-btn");
	const modalDateEl = document.getElementById("modal-date");
	const eventsListEl = document.getElementById("events-list");
	const timerDisplay = document.getElementById("timer-display");
	const playPauseBtn = document.getElementById("play-pause-btn");
	const pomodoroSubjectSelect = document.getElementById("pomodoro-subject");
	const timerTaskSelect = document.getElementById("timer-task-select");
	const focusModeBtn = document.getElementById("focus-mode-btn");
	const breakModeBtn = document.getElementById("break-mode-btn");
	const studyChartCanvas = document.getElementById("study-chart");
	const dailyGoalProgress = document.getElementById("daily-goal-progress");
	const streakCounter = document.getElementById("streak-counter");
	const motivationQuote = document.getElementById("motivation-quote");
	const editTaskModal = document.getElementById("edit-task-modal");
	const closeEditModalBtn = document.getElementById("close-edit-modal");
	const saveEditTaskBtn = document.getElementById("save-edit-task-btn");
	const editTaskTextInput = document.getElementById("edit-task-text");
	const editTaskSubjectSelect = document.getElementById("edit-task-subject");
	const editTaskTimeInput = document.getElementById("edit-task-time");
	const editTaskDeadlineInput = document.getElementById("edit-task-deadline");
	const editSubtasksContainer = document.getElementById("edit-subtasks-container");
	const settingsBtn = document.getElementById("settings-btn");
	const settingsModal = document.getElementById("settings-modal");
	const closeSettingsModalBtn = document.getElementById("close-settings-modal");
	const usernameUpdateForm = document.getElementById("username-update-form");
	const passwordUpdateForm = document.getElementById("password-update-form");
	const darkModeToggle = document.getElementById("dark-mode-toggle");
	const usernameErrorEl = document.getElementById("username-error");
	const passwordErrorEl = document.getElementById("password-error");
	const usernameSuccessEl = document.getElementById("username-success");
	const passwordSuccessEl = document.getElementById("password-success");
	const newUsernameInput = document.getElementById("new-username");
	const currentPasswordInput = document.getElementById("current-password");
	const newPasswordInput = document.getElementById("new-password");

	// --- State ---
	const API_URL = "http://localhost:3005";
	let currentUser = null;
	let currentDate = new Date();
	let tasks = [];
	let events = {};
	let selectedDate = null;
	let timerInterval;
	let timeLeft = 25 * 60;
	let currentMode = "focus";
	let isPaused = true;
	let studyLogs = {};
	let studyStreak = 0;
	let lastStudyDay = "";
	let studyChart;
	let currentlyTrackedTaskId = null;
	let editingTaskId = null;

	const subjects = ["Mathematics", "Physics", "Chemistry", "Biology", "History", "Literature", "Computer Science", "General"];
	const motivationalQuotes = ["The secret to getting ahead is getting started.", "Don't watch the clock; do what it does. Keep going.", "The expert in anything was once a beginner.", "Success is the sum of small efforts, repeated day in and day out.", "Believe you can and you're halfway there.", "The only way to do great work is to love what you do.", "Push yourself, because no one else is going to do it for you."];

	// --- Initialization ---
	async function checkAuthAndInitialize() {
		const user = JSON.parse(localStorage.getItem("studyUser"));
		if (!user) {
			window.location.href = "auth.html";
		} else {
			await initializeApp(user);
		}
	}

	async function initializeApp(user) {
		currentUser = user;
		// ✅ FIXED: Add a robust safeguard to ensure currentUser._id always exists.
		// This makes the frontend resilient to any data inconsistencies from localStorage.
		if (currentUser && currentUser.id && !currentUser._id) {
			currentUser._id = currentUser.id;
		}

		if (!currentUser || !currentUser._id) {
			console.error("User ID not found, logging out.");
			logout();
			return;
		}

		applyDarkMode(currentUser.settings.darkMode);
		darkModeToggle.checked = currentUser.settings.darkMode;
		welcomeMessage.textContent = `Welcome, ${currentUser.username}!`;
		newUsernameInput.value = currentUser.username;
		populateSubjectSelects();
		await loadDataFromDB();
		renderCalendar();
		updateTimerDisplay();
		renderTasksPage();
		renderDashboard();
		showPage("dashboard-page");
	}

	function populateSubjectSelects() {
		const selects = [taskSubjectSelect, pomodoroSubjectSelect, editTaskSubjectSelect];
		selects.forEach((select) => {
			select.innerHTML = subjects.map((s) => `<option value="${s}">${s}</option>`).join("");
		});
	}

	async function loadDataFromDB() {
		showLoading();
		try {
			await Promise.all([loadTasks(), loadStudyLogs(), loadStreak()]);
		} catch (error) {
			console.error("Error loading initial data:", error);
		}
		hideLoading();
	}

	function showPage(pageId) {
		[dashboardPage, studyPage, tasksPage].forEach((p) => p.classList.add("hidden"));
		document.getElementById(pageId).classList.remove("hidden");
		[navDashboard, navStudy, navTasks].forEach((n) => n.classList.remove("bg-blue-600", "text-white"));
		if (pageId === "dashboard-page") navDashboard.classList.add("bg-blue-600", "text-white");
		if (pageId === "study-page") navStudy.classList.add("bg-blue-600", "text-white");
		if (pageId === "tasks-page") navTasks.classList.add("bg-blue-600", "text-white");
	}

	function showLoading() {
		appContainer.classList.add("hidden");
		loadingIndicator.classList.remove("hidden");
		loadingIndicator.classList.add("flex");
	}

	function hideLoading() {
		loadingIndicator.classList.add("hidden");
		loadingIndicator.classList.remove("flex");
		appContainer.classList.remove("hidden");
	}

	function logout() {
		localStorage.removeItem("studyUser");
		window.location.href = "auth.html";
	}

	// --- API Functions ---
	async function loadTasks() {
		try {
			const response = await fetch(`${API_URL}/api/study/tasks?userId=${currentUser._id}`);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.error || "Failed to fetch tasks");
			}
			tasks = data;
			populateTimerTaskSelect();
		} catch (err) {
			console.error("Failed to fetch tasks:", err);
			tasks = []; // ✅ FIXED: Gracefully handle error to prevent crashes.
		}
	}

	async function addTask() {
		const text = taskInput.value.trim();
		const subject = taskSubjectSelect.value;
		const time = taskTimeInput.value;
		const deadline = taskDeadlineInput.value;
		if (!text || !subject || !time || !deadline) {
			taskErrorEl.textContent = "All fields are required.";
			return;
		}
		taskErrorEl.textContent = "";
		const newTask = {
			text,
			subject,
			time,
			deadline,
			userId: currentUser._id,
		};
		try {
			const response = await fetch(`${API_URL}/api/study/tasks`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(newTask),
			});
			const data = await response.json();
			tasks.push(data);
			renderTasksPage();
			populateTimerTaskSelect();
			taskInput.value = "";
			taskTimeInput.value = "";
			taskDeadlineInput.value = "";
		} catch (err) {
			console.error("Failed to add task:", err);
			taskErrorEl.textContent = "Failed to add task. Please try again.";
		}
	}

	async function updateTask(taskId, updates) {
		try {
			const response = await fetch(`${API_URL}/api/study/tasks/${taskId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(updates),
			});
			const updatedTask = await response.json();
			const index = tasks.findIndex((t) => t._id === taskId);
			if (index !== -1) tasks[index] = updatedTask;
			return updatedTask;
		} catch (err) {
			console.error(`Failed to update task ${taskId}:`, err);
		}
	}

	async function deleteTask(taskId) {
		try {
			await fetch(`${API_URL}/api/study/tasks/${taskId}`, {
				method: "DELETE",
			});
			tasks = tasks.filter((t) => t._id !== taskId);
			renderTasksPage();
			populateTimerTaskSelect();
		} catch (err) {
			console.error(`Failed to delete task ${taskId}:`, err);
		}
	}

	async function loadStudyLogs() {
		try {
			const response = await fetch(`${API_URL}/api/study/logs?userId=${currentUser._id}`);
			if (!response.ok) throw new Error("Failed to fetch logs");
			const data = await response.json();
			studyLogs = data || {};
		} catch (err) {
			console.error("Failed to load study logs:", err);
			studyLogs = {}; // ✅ FIXED: Gracefully handle error.
		}
	}

	async function saveStudyLogs() {
		try {
			await fetch(`${API_URL}/api/study/logs`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					userId: currentUser._id,
					studyLogs,
				}),
			});
			if (currentlyTrackedTaskId) {
				const task = tasks.find((t) => t._id === currentlyTrackedTaskId);
				if (task) {
					await updateTask(currentlyTrackedTaskId, {
						timeSpent: task.timeSpent,
					});
				}
			}
		} catch (err) {
			console.error("Failed to save study logs:", err);
		}
	}

	async function loadStreak() {
		try {
			const response = await fetch(`${API_URL}/api/study/streak?userId=${currentUser._id}`);
			if (!response.ok) throw new Error("Failed to load streak");
			const data = await response.json();
			studyStreak = data.studyStreak || 0;
			lastStudyDay = data.lastStudyDay || "";
		} catch (err) {
			console.error("Failed to load streak:", err.message);
			studyStreak = 0; // ✅ FIXED: Gracefully handle error.
			lastStudyDay = "";
		}
	}

	async function saveStreak() {
		try {
			await fetch(`${API_URL}/api/study/streak`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					userId: currentUser._id,
					studyStreak,
					lastStudyDay,
				}),
			});
		} catch (err) {
			console.error("Failed to save streak:", err);
		}
	}

	// --- Calendar ---
	function renderCalendar() {
		calendarDaysEl.innerHTML = "";
		const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
		const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
		monthYearEl.textContent = currentDate.toLocaleDateString("en-US", {
			month: "long",
			year: "numeric",
		});

		for (let i = 0; i < firstDay.getDay(); i++) {
			calendarDaysEl.innerHTML += `<div></div>`;
		}

		for (let i = 1; i <= lastDay.getDate(); i++) {
			const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
			const dateString = date.toISOString().split("T")[0];
			const isToday = dateString === new Date().toISOString().split("T")[0] ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-800";
			const hasEvent = events[dateString] ? "border-2 border-blue-400" : "";
			calendarDaysEl.innerHTML += `
                <div class="day p-2 text-center rounded-lg shadow cursor-pointer ${isToday} ${hasEvent}" data-date="${dateString}">
                    ${i}
                </div>
            `;
		}
	}

	// --- Tasks Page ---
	function renderTasksPage() {
		fullTaskListEl.innerHTML = "";
		if (!Array.isArray(tasks)) {
			console.error("Tasks data is not an array:", tasks);
			fullTaskListEl.innerHTML = "<li>Error: Tasks could not be loaded.</li>";
			return;
		}
		const sortedTasks = [...tasks].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
		sortedTasks.forEach((task) => {
			const el = document.createElement("div");
			const isCompleted = task.completed;
			el.className = `p-4 rounded-lg shadow transition-all ${isCompleted ? "bg-slate-100 dark:bg-slate-800 opacity-60" : "bg-white dark:bg-slate-700"}`;
			const subtasksHtml = task.subTasks
				.map(
					(sub) => `
                <div class="flex items-center justify-between pl-8 py-1 text-sm">
                    <div class="flex items-center gap-2">
                        <input type="checkbox" class="subtask-checkbox" data-task-id="${task._id}" data-subtask-id="${sub._id}" ${sub.completed ? "checked" : ""}>
                        <span class="${sub.completed ? "line-through text-slate-500" : ""}">${sub.text}</span>
                    </div>
                    <button class="delete-subtask-btn text-slate-400 hover:text-red-500" data-task-id="${task._id}" data-subtask-id="${sub._id}">✕</button>
                </div>`
				)
				.join("");

			el.innerHTML = `
                <div class="flex items-start justify-between">
                    <div class="flex items-start gap-3">
                        <input type="checkbox" class="task-checkbox mt-1.5" data-task-id="${task._id}" ${isCompleted ? "checked" : ""}>
                        <div>
                            <p class="font-semibold ${isCompleted ? "line-through" : ""}">${task.text}</p>
                            <div class="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                <span>${task.subject}</span>
                                <span>|</span>
                                <span>Due: ${new Date(task.deadline).toLocaleDateString()}</span>
                                <span>|</span>
                                <span>Est: ${task.time} min</span>
                                <span>|</span>
                                <span>Spent: ${Math.floor((task.timeSpent || 0) / 60)} min</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button class="edit-task-btn p-1 text-slate-500 hover:text-blue-600" data-task-id="${task._id}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z"></path></svg>
                        </button>
                        <button class="delete-task-btn p-1 text-slate-500 hover:text-red-600" data-task-id="${task._id}">
                           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </div>
                <div class="pl-4 mt-2">
                    ${subtasksHtml}
                     <div class="mt-2 pl-8 flex items-center gap-2">
                        <input type="text" class="add-subtask-input w-full text-sm p-1 border border-slate-200 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-800" placeholder="Add sub-task...">
                        <button class="add-subtask-btn text-xs bg-blue-500 text-white rounded px-2 py-1" data-task-id="${task._id}">Add</button>
                    </div>
                </div>
            `;
			fullTaskListEl.appendChild(el);
		});
	}

	// --- Dashboard ---
	function renderDashboard() {
		renderCountdownTimers();
		renderStudyChart();
		updateDailyGoal();
		updateStreakCounter();
		displayMotivationQuote();
	}

	function renderCountdownTimers() {
		countdownContainer.innerHTML = "";
		const upcomingTasks = tasks
			.filter((t) => !t.completed && new Date(t.deadline) > new Date())
			.sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
			.slice(0, 4);

		if (upcomingTasks.length === 0) {
			countdownContainer.innerHTML = `<p class="text-slate-500">No upcoming deadlines. Great job!</p>`;
			return;
		}

		upcomingTasks.forEach((task) => {
			const now = new Date();
			const deadline = new Date(task.deadline);
			const diff = deadline - now;
			const days = Math.floor(diff / (1000 * 60 * 60 * 24));
			const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

			countdownContainer.innerHTML += `
                <div class="bg-white dark:bg-slate-800 p-3 rounded-lg shadow">
                    <p class="font-semibold text-sm">${task.text}</p>
                    <p class="text-xs text-blue-600 dark:text-blue-400">${task.subject}</p>
                    <p class="text-lg font-bold mt-1">${days}d ${hours}h left</p>
                </div>
            `;
		});
	}

	function renderStudyChart() {
		const labels = Object.keys(studyLogs);
		const data = Object.values(studyLogs).map((sec) => sec / 3600); // convert to hours

		if (studyChart) {
			studyChart.destroy();
		}
		studyChart = new Chart(studyChartCanvas, {
			type: "doughnut",
			data: {
				labels: labels,
				datasets: [
					{
						label: "Study Hours",
						data: data,
						backgroundColor: ["#3b82f6", "#ef4444", "#22c55e", "#f97316", "#8b5cf6", "#fde047", "#ec4899", "#14b8a6"],
						hoverOffset: 4,
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: "bottom",
						labels: {
							color: document.body.classList.contains("dark") ? "#cbd5e1" : "#475569",
						},
					},
				},
			},
		});
	}

	function updateDailyGoal() {
		const today = new Date().toISOString().split("T")[0];
		const todaySubjects = Object.keys(events).filter((date) => date === today);
		// This logic needs refinement. For now, let's track total time studied today.
		let totalSecondsToday = 0;
		// A more complex logic would be needed here if we track daily logs separately.
		// For now, let's just show a static goal.
		dailyGoalProgress.textContent = `Today's Goal: 4 hours (Feature in development)`;
	}

	function updateStreakCounter() {
		const todayStr = new Date().toISOString().split("T")[0];
		if (Object.values(studyLogs).some((time) => time > 0) && todayStr !== lastStudyDay) {
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			const yesterdayStr = yesterday.toISOString().split("T")[0];

			if (lastStudyDay === yesterdayStr) {
				studyStreak++;
			} else {
				studyStreak = 1;
			}
			lastStudyDay = todayStr;
			saveStreak();
		}
		streakCounter.textContent = `${studyStreak} Day Streak 🔥`;
	}

	function displayMotivationQuote() {
		const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
		motivationQuote.textContent = motivationalQuotes[randomIndex];
	}

	// --- Study Tracker ---
	function formatTime(seconds) {
		const mins = Math.floor(seconds / 60)
			.toString()
			.padStart(2, "0");
		const secs = (seconds % 60).toString().padStart(2, "0");
		return `${mins}:${secs}`;
	}

	function updateTimerDisplay() {
		timerDisplay.textContent = formatTime(timeLeft);
		document.title = `${formatTime(timeLeft)} - ${currentMode === "focus" ? "Focus Time" : "Break Time"}`;
	}

	function playNotificationSound() {
		new Audio("https://www.soundjay.com/buttons/sounds/button-16.mp3").play();
	}

	function switchMode(mode) {
		clearInterval(timerInterval);
		isPaused = true;
		playPauseBtn.innerHTML = `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
		currentMode = mode;

		if (mode === "focus") {
			timeLeft = 25 * 60;
			focusModeBtn.classList.add("bg-blue-600", "text-white");
			breakModeBtn.classList.remove("bg-blue-600", "text-white");
			document.querySelector(".timer-container").classList.remove("bg-green-100", "dark:bg-green-900/50");
			document.querySelector(".timer-container").classList.add("bg-blue-100", "dark:bg-blue-900/50");
		} else {
			timeLeft = 5 * 60;
			focusModeBtn.classList.remove("bg-blue-600", "text-white");
			breakModeBtn.classList.add("bg-blue-600", "text-white");
			document.querySelector(".timer-container").classList.remove("bg-blue-100", "dark:bg-blue-900/50");
			document.querySelector(".timer-container").classList.add("bg-green-100", "dark:bg-green-900/50");
		}
		updateTimerDisplay();
	}

	function playPauseTimer() {
		isPaused = !isPaused;
		playPauseBtn.innerHTML = isPaused ? `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>` : `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;

		if (isPaused) {
			clearInterval(timerInterval);
			saveStudyLogs();
		} else {
			timerInterval = setInterval(() => {
				timeLeft--;
				const subject = pomodoroSubjectSelect.value;
				if (currentMode === "focus") {
					studyLogs[subject] = (studyLogs[subject] || 0) + 1;
					if (currentlyTrackedTaskId) {
						const task = tasks.find((t) => t._id === currentlyTrackedTaskId);
						if (task) {
							task.timeSpent = (task.timeSpent || 0) + 1;
						}
					}
					renderStudyChart();
				}
				updateTimerDisplay();
				if (timeLeft <= 0) {
					playNotificationSound();
					if (currentMode === "focus") {
						saveStudyLogs();
						updateStreakCounter();
					}
					switchMode(currentMode === "focus" ? "break" : "focus");
				}
			}, 1000);
		}
	}

	function populateTimerTaskSelect() {
		timerTaskSelect.innerHTML = '<option value="">Track time for a specific task...</option>';
		tasks
			.filter((t) => !t.completed)
			.forEach((task) => {
				timerTaskSelect.innerHTML += `<option value="${task._id}">${task.text}</option>`;
			});
	}

	// --- Modals (Events, Edit Task, Settings) ---
	function openModal(date) {
		selectedDate = date;
		modalDateEl.textContent = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		});
		eventTitleInput.value = "";
		renderEvents();
		eventModal.classList.remove("hidden");
	}

	function closeModal() {
		eventModal.classList.add("hidden");
	}

	function saveEvent() {
		const title = eventTitleInput.value.trim();
		if (title) {
			if (!events[selectedDate]) {
				events[selectedDate] = [];
			}
			events[selectedDate].push(title);
			eventTitleInput.value = "";
			renderEvents();
			renderCalendar();
		}
	}

	function renderEvents() {
		eventsListEl.innerHTML = "";
		if (events[selectedDate]) {
			events[selectedDate].forEach((event) => {
				eventsListEl.innerHTML += `<li class="p-2 bg-slate-100 dark:bg-slate-700 rounded">${event}</li>`;
			});
		} else {
			eventsListEl.innerHTML = `<li class="text-slate-500">No events for this day.</li>`;
		}
	}

	function openEditModal(taskId) {
		editingTaskId = taskId;
		const task = tasks.find((t) => t._id === taskId);
		if (!task) return;

		editTaskTextInput.value = task.text;
		editTaskSubjectSelect.value = task.subject;
		editTaskTimeInput.value = task.time;
		editTaskDeadlineInput.value = new Date(task.deadline).toISOString().split("T")[0];

		editSubtasksContainer.innerHTML = "";
		task.subTasks.forEach((sub) => {
			editSubtasksContainer.innerHTML += `
				<div class="flex items-center gap-2">
					<input type="checkbox" ${sub.completed ? "checked" : ""} class="edit-subtask-checkbox" data-subtask-id="${sub._id}">
					<input type="text" value="${sub.text}" class="edit-subtask-text w-full p-1 bg-slate-100 dark:bg-slate-700 rounded">
				</div>
			`;
		});

		editTaskModal.classList.remove("hidden");
	}

	function closeEditModal() {
		editTaskModal.classList.add("hidden");
		editingTaskId = null;
	}

	async function saveEditedTask() {
		if (!editingTaskId) return;

		const updates = {
			text: editTaskTextInput.value,
			subject: editTaskSubjectSelect.value,
			time: editTaskTimeInput.value,
			deadline: editTaskDeadlineInput.value,
		};

		await updateTask(editingTaskId, updates);
		// Note: Subtask saving logic needs to be implemented separately if needed
		renderTasksPage();
		closeEditModal();
	}

	function openSettingsModal() {
		settingsModal.classList.remove("hidden");
	}

	function closeSettingsModal() {
		settingsModal.classList.add("hidden");
	}

	async function updateUsername(e) {
		e.preventDefault();
		usernameErrorEl.textContent = "";
		usernameSuccessEl.textContent = "";
		const newUsername = newUsernameInput.value;
		try {
			const response = await fetch(`${API_URL}/api/study/user/username`, {
				method: "PUT",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({userId: currentUser._id, newUsername}),
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.error);

			currentUser.username = data.user.username;
			localStorage.setItem("studyUser", JSON.stringify(currentUser));
			welcomeMessage.textContent = `Welcome, ${currentUser.username}!`;
			usernameSuccessEl.textContent = data.message;
		} catch (err) {
			usernameErrorEl.textContent = err.message;
		}
	}

	async function updatePassword(e) {
		e.preventDefault();
		passwordErrorEl.textContent = "";
		passwordSuccessEl.textContent = "";
		const currentPassword = currentPasswordInput.value;
		const newPassword = newPasswordInput.value;
		try {
			const response = await fetch(`${API_URL}/api/study/user/password`, {
				method: "PUT",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({userId: currentUser._id, currentPassword, newPassword}),
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.error);
			passwordSuccessEl.textContent = data.message;
			currentPasswordInput.value = "";
			newPasswordInput.value = "";
		} catch (err) {
			passwordErrorEl.textContent = err.message;
		}
	}

	async function toggleDarkMode() {
		const isDark = darkModeToggle.checked;
		applyDarkMode(isDark);
		try {
			await fetch(`${API_URL}/api/study/settings/darkmode`, {
				method: "PUT",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({userId: currentUser._id, darkMode: isDark}),
			});
			currentUser.settings.darkMode = isDark;
			localStorage.setItem("studyUser", JSON.stringify(currentUser));
			renderStudyChart();
		} catch (err) {
			console.error("Failed to save dark mode setting:", err);
		}
	}

	function applyDarkMode(isDark) {
		if (isDark) {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	}

	async function addSubTask(taskId, text) {
		try {
			const response = await fetch(`${API_URL}/api/study/tasks/${taskId}/subtasks`, {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({text}),
			});
			const updatedTask = await response.json();
			const index = tasks.findIndex((t) => t._id === taskId);
			if (index !== -1) tasks[index] = updatedTask;
			renderTasksPage();
		} catch (err) {
			console.error("Failed to add subtask:", err);
		}
	}

	async function updateSubTask(taskId, subtaskId, completed) {
		try {
			const response = await fetch(`${API_URL}/api/study/tasks/${taskId}/subtasks/${subtaskId}`, {
				method: "PUT",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({completed}),
			});
			const updatedTask = await response.json();
			const index = tasks.findIndex((t) => t._id === taskId);
			if (index !== -1) tasks[index] = updatedTask;
			renderTasksPage();
		} catch (err) {
			console.error("Failed to update subtask:", err);
		}
	}

	async function deleteSubTask(taskId, subtaskId) {
		try {
			const response = await fetch(`${API_URL}/api/study/tasks/${taskId}/subtasks/${subtaskId}`, {
				method: "DELETE",
			});
			const updatedTask = await response.json();
			const index = tasks.findIndex((t) => t._id === taskId);
			if (index !== -1) tasks[index] = updatedTask;
			renderTasksPage();
		} catch (err) {
			console.error("Failed to delete subtask:", err);
		}
	}

	// --- Event Listeners ---
	navDashboard.addEventListener("click", () => showPage("dashboard-page"));
	navStudy.addEventListener("click", () => showPage("study-page"));
	navTasks.addEventListener("click", () => showPage("tasks-page"));
	prevMonthBtn.addEventListener("click", () => {
		currentDate.setMonth(currentDate.getMonth() - 1);
		renderCalendar();
	});
	nextMonthBtn.addEventListener("click", () => {
		currentDate.setMonth(currentDate.getMonth() + 1);
		renderCalendar();
	});
	calendarDaysEl.addEventListener("click", (e) => {
		if (e.target.classList.contains("day")) {
			openModal(e.target.dataset.date);
		}
	});
	addTaskBtn.addEventListener("click", addTask);
	closeModalBtn.addEventListener("click", closeModal);
	saveEventBtn.addEventListener("click", saveEvent);
	playPauseBtn.addEventListener("click", playPauseTimer);
	focusModeBtn.addEventListener("click", () => switchMode("focus"));
	breakModeBtn.addEventListener("click", () => switchMode("break"));
	timerTaskSelect.addEventListener("change", (e) => {
		currentlyTrackedTaskId = e.target.value;
	});
	logoutBtn.addEventListener("click", logout);
	closeEditModalBtn.addEventListener("click", closeEditModal);
	saveEditTaskBtn.addEventListener("click", saveEditedTask);
	settingsBtn.addEventListener("click", openSettingsModal);
	closeSettingsModalBtn.addEventListener("click", closeSettingsModal);
	usernameUpdateForm.addEventListener("submit", updateUsername);
	passwordUpdateForm.addEventListener("submit", updatePassword);
	darkModeToggle.addEventListener("change", toggleDarkMode);

	fullTaskListEl.addEventListener("click", (e) => {
		if (e.target.closest(".edit-task-btn")) {
			openEditModal(e.target.closest(".edit-task-btn").dataset.taskId);
		}
		if (e.target.closest(".delete-task-btn")) {
			if (confirm("Are you sure you want to delete this task?")) {
				deleteTask(e.target.closest(".delete-task-btn").dataset.taskId);
			}
		}
		if (e.target.classList.contains("task-checkbox")) {
			const taskId = e.target.dataset.taskId;
			const completed = e.target.checked;
			updateTask(taskId, {completed}).then(() => renderTasksPage());
		}
		if (e.target.classList.contains("add-subtask-btn")) {
			const taskId = e.target.dataset.taskId;
			const input = e.target.previousElementSibling;
			const text = input.value.trim();
			if (text) {
				addSubTask(taskId, text);
				input.value = "";
			}
		}
		if (e.target.classList.contains("subtask-checkbox")) {
			const {taskId, subtaskId} = e.target.dataset;
			const completed = e.target.checked;
			updateSubTask(taskId, subtaskId, completed);
		}
		if (e.target.classList.contains("delete-subtask-btn")) {
			const {taskId, subtaskId} = e.target.dataset;
			deleteSubTask(taskId, subtaskId);
		}
	});

	// --- Final Initialization Call ---
	checkAuthAndInitialize();
});
