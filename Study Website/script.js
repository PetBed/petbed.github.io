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
  const binderPage = document.getElementById("binder-page");
	const navDashboard = document.getElementById("nav-dashboard");
	const navStudy = document.getElementById("nav-study");
	const navTasks = document.getElementById("nav-tasks");
	const navBinder = document.getElementById("nav-binder");
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

	// --- Semester Hub DOM Elements ---
	const semesterHubSection = document.getElementById("semester-hub-section");
	const quickSemesterSelect = document.getElementById("quick-semester-select");
	const addSemesterBtn = document.getElementById("add-semester-btn");
	const semestersGrid = document.getElementById("semesters-grid");
	const metricSemStudyTime = document.getElementById("metric-sem-study-time");
	const metricSemExams = document.getElementById("metric-sem-exams");
	const metricSemAvg = document.getElementById("metric-sem-avg");
	const metricSemGradeBadge = document.getElementById("metric-sem-grade-badge");
	const metricSemAvgSource = document.getElementById("metric-sem-avg-source");
	const metricSemGpa = document.getElementById("metric-sem-gpa");
	const metricSemGpaBadge = document.getElementById("metric-sem-gpa-badge");
	const metricSemDates = document.getElementById("metric-sem-dates");
	const semesterCountText = document.getElementById("semester-count-text");
	const chartSemesterFilter = document.getElementById("chart-semester-filter");
	const studyTrackerSemesterBadge = document.getElementById("study-tracker-semester-badge");

	// --- Semester Modal Elements ---
	const semesterModal = document.getElementById("semester-modal");
	const semesterModalTitle = document.getElementById("semester-modal-title");
	const closeSemesterModalBtn = document.getElementById("close-semester-modal-btn");
	const cancelSemesterModalBtn = document.getElementById("cancel-semester-modal-btn");
	const semesterForm = document.getElementById("semester-form");
	const editingSemesterIdInput = document.getElementById("editing-semester-id");
	const semesterNameInput = document.getElementById("semester-name-input");
	const semesterStartDateInput = document.getElementById("semester-start-date");
	const semesterEndDateInput = document.getElementById("semester-end-date");
	const semesterDescriptionInput = document.getElementById("semester-description-input");
	const semesterIsActiveInput = document.getElementById("semester-is-active-input");

	// --- Semester Academic Records & Exams Modal Elements ---
	const semesterExamsModal = document.getElementById("semester-exams-modal");
	const examsModalSemesterTitle = document.getElementById("exams-modal-semester-title");
	const examsModalActiveBadge = document.getElementById("exams-modal-active-badge");
	const examsModalSemesterDates = document.getElementById("exams-modal-semester-dates");
	const closeExamsModalBtn = document.getElementById("close-exams-modal-btn");
	const examsModalCount = document.getElementById("exams-modal-count");
	const examsModalGradedCount = document.getElementById("exams-modal-graded-count");
	const examsModalFinalsCount = document.getElementById("exams-modal-finals-count");
	const examsModalAvgMark = document.getElementById("exams-modal-avg-mark");
	const examsModalAvgSource = document.getElementById("exams-modal-avg-source");
	const examsModalGradePill = document.getElementById("exams-modal-grade-pill");
	const examsModalGpa = document.getElementById("exams-modal-gpa");

	// Modal Tab Navigation Elements
	const tabBtnFinalScores = document.getElementById("tab-btn-final-scores");
	const tabBtnExamPapers = document.getElementById("tab-btn-exam-papers");
	const tabContentFinalScores = document.getElementById("tab-content-final-scores");
	const tabContentExamPapers = document.getElementById("tab-content-exam-papers");
	const tabFinalsBadge = document.getElementById("tab-finals-badge");
	const tabExamsBadge = document.getElementById("tab-exams-badge");

	// Final Subject Scores Form & List Elements
	const toggleFinalFormBtn = document.getElementById("toggle-final-form-btn");
	const resetFinalFormBtn = document.getElementById("reset-final-form-btn");
	const finalFormHeading = document.getElementById("final-form-heading");
	const subjectFinalForm = document.getElementById("subject-final-form");
	const editingFinalIdInput = document.getElementById("editing-final-id");
	const finalSubjectInput = document.getElementById("final-subject-input");
	const finalScoreInput = document.getElementById("final-score-input");
	const finalMaxScoreInput = document.getElementById("final-max-score-input");
	const finalGpaInput = document.getElementById("final-gpa-input");
	const finalGradeInput = document.getElementById("final-grade-input");
	const finalCreditsInput = document.getElementById("final-credits-input");
	const finalNotesInput = document.getElementById("final-notes-input");
	const calcFinalFromExamsBtn = document.getElementById("calc-final-from-exams-btn");
	const subjectFinalsListContainer = document.getElementById("subject-finals-list-container");

	// Exam Papers Form & List Elements
	const toggleExamFormBtn = document.getElementById("toggle-exam-form-btn");
	const resetExamFormBtn = document.getElementById("reset-exam-form-btn");
	const examFormHeading = document.getElementById("exam-form-heading");
	const semesterExamForm = document.getElementById("semester-exam-form");
	const editingExamIdInput = document.getElementById("editing-exam-id");
	const examSubjectInput = document.getElementById("exam-subject-input");
	const examTitleInput = document.getElementById("exam-title-input");
	const examDatetimeInput = document.getElementById("exam-datetime-input");
	const examMarkInput = document.getElementById("exam-mark-input");
	const examMaxMarkInput = document.getElementById("exam-max-mark-input");
	const examLetterGradeInput = document.getElementById("exam-letter-grade-input");
	const examNotesInput = document.getElementById("exam-notes-input");
	const examsListContainer = document.getElementById("exams-list-container");

	// --- Delete Semester Modal Elements ---
	const deleteSemesterModal = document.getElementById("delete-semester-modal");
	const deleteSemesterNameEl = document.getElementById("delete-semester-name");
	const cancelDeleteSemesterBtn = document.getElementById("cancel-delete-semester-btn");
	const confirmDeleteSemesterBtn = document.getElementById("confirm-delete-semester-btn");

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
	const importSetBtn = document.getElementById("import-set-btn");
	const exportEditSetBtn = document.getElementById("export-edit-set-btn");
	const flashcardTextModal = document.getElementById("flashcard-text-modal");
	const flashcardTextModalTitle = document.getElementById("flashcard-text-modal-title");
	const flashcardTextArea = document.getElementById("flashcard-text-area");
	const flashcardTextError = document.getElementById("flashcard-text-error");
	const flashcardTextModalButtons = document.getElementById("flashcard-text-modal-buttons");

	// --- State ---
	let studyChart = null;
	let currentDate = new Date();
	let events = {};
	let tasks = [];
	let studyLogs = {};
	let semesters = [];
	let activeSemesterId = null;
	let viewingSemesterId = null;
	let managingExamsSemesterId = null;
	let deletingSemesterId = null;
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
	let taskCollapseState = {};
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
	let sortableInstance = null;
	let taskSortableInstance = null;
	let subtaskSortableInstances = [];
	let soundLibrarySortableInstance = null;
	let flashcardSetSortableInstance = null;
  let sessionSecondsStudied = 0;

  if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().then(permission => {
            console.log("Notification permission:", permission);
        });
  }

	// --- Constants & Config ---
	const API_URL = "https://wot-tau.vercel.app"; // local: https://wot-tau.vercel.app
	const TASK_VIEW_PREFS_KEY = "studyTaskViewPreferences";
	const subjectColors = {Malay: "#8B0000", English: "#1D3557", History: "#D2691E", Accounting: "#FFD60A", "Modern Mathematics": "#00B4D8", Moral: "#6A4C93", "Additional Mathematics": "#00B4D8", Physics: "#E63946", Biology: "#2D6A4F", Economy: "#606C38", Chemistry: "#6C757D", PJPK: "#9EF01A", Other: "#64748b"};
	const RBT_ACCENT = "#FFD60A";
	const defaultExamsTemplate = [
		{subject: "Malay 2", date: "2026-04-20T06:55:00"},
		{subject: "Malay 1", date: "2026-04-20T09:40:00"},
		{subject: "English 2", date: "2026-04-21T07:45:00"},
		{subject: "English 1", date: "2026-04-21T09:40:00"},
		{subject: "History 2", date: "2026-04-22T06:55:00"},
		{subject: "History 1", date: "2026-04-22T09:45:00"},
		{subject: "Accounting 2", date: "2026-04-22T11:00:00"},
		{subject: "Accounting 1", date: "2026-04-22T13:50:00"},
		{subject: "Modern Mathematics 2", date: "2026-04-23T06:55:00"},
		{subject: "Modern Mathematics 1", date: "2026-04-23T09:45:00"},
		{subject: "Moral", date: "2026-04-24T06:55:00"},
		{subject: "Additional Mathematics 2", date: "2026-05-04T06:55:00"},
		{subject: "Additional Mathematics 1", date: "2026-05-04T09:45:00"},
		{subject: "Physics 2", date: "2026-05-05T06:55:00"},
		{subject: "Physics 1", date: "2026-05-05T09:45:00"},
		{subject: "Biology 2", date: "2026-05-06T06:55:00"},
		{subject: "Biology 1", date: "2026-05-06T09:45:00"},
		{subject: "Chemistry 2", date: "2026-05-07T06:55:00"},
		{subject: "Chemistry 1", date: "2026-05-07T09:45:00"},
		{subject: "Economy 1", date: "2026-05-07T11:15:00"},
		{subject: "Malay Listening", date: "2026-05-08T07:30:00"},
		{subject: "English Listening", date: "2026-05-08T08:35:00"},
		{subject: "PJPK", date: "2026-05-08T09:40:00"},
		{subject: "Economy 2", date: "2026-05-08T11:15:00"},
	];
	const quotes = ["The secret of getting ahead is getting started.", "The expert in anything was once a beginner.", "Believe you can and you're halfway there.", "Well done is better than well said.", "Strive for progress, not perfection.", "The future belongs to those who believe in the beauty of their dreams.", "Success is the sum of small efforts, repeated day in and day out.", "Don't watch the clock; do what it does. Keep going.", "It does not matter how slowly you go as long as you do not stop.", "The pain you feel today will be the strength you feel tomorrow."];

	// --- SEMESTER & EXAM UTILITY FUNCTIONS ---
	function getGradePillClass(gradeStr) {
		if (!gradeStr) return "grade-pill-none";
		const g = String(gradeStr).trim().toUpperCase();
		if (g.startsWith("A") || g === "1ST" || g.includes("DISTINCTION") || g === "9" || g === "8") return "grade-pill-a";
		if (g.startsWith("B") || g === "2:1" || g.includes("MERIT") || g === "7" || g === "6") return "grade-pill-b";
		if (g.startsWith("C") || g === "2:2" || g.includes("PASS") || g === "5" || g === "4") return "grade-pill-c";
		if (g.startsWith("D") || g.startsWith("E") || g.startsWith("F") || g.includes("FAIL") || g <= "3") return "grade-pill-d";
		return "grade-pill-b";
	}

	function suggestGradeFromPercentage(percentage) {
		if (percentage === null || percentage === undefined || isNaN(percentage)) return "";
		const p = Number(percentage);
		if (p >= 90) return "A+";
		if (p >= 80) return "A";
		if (p >= 75) return "B+";
		if (p >= 70) return "B";
		if (p >= 65) return "C+";
		if (p >= 60) return "C";
		if (p >= 50) return "D";
		return "F";
	}

	function suggestGpaFromPercentage(percentage) {
		if (percentage === null || percentage === undefined || isNaN(percentage)) return "";
		const p = Number(percentage);
		if (p >= 90) return "4.00";
		if (p >= 80) return "4.00";
		if (p >= 75) return "3.67";
		if (p >= 70) return "3.33";
		if (p >= 65) return "3.00";
		if (p >= 60) return "2.67";
		if (p >= 55) return "2.33";
		if (p >= 50) return "2.00";
		if (p >= 40) return "1.00";
		return "0.00";
	}

	function calculateGrade(mark, maxMark = 100) {
		if (mark === null || mark === undefined || mark === "" || isNaN(Number(mark)) || Number(maxMark) <= 0) {
			return null;
		}
		const m = Number(mark);
		const max = Number(maxMark);
		const percentage = Math.round((m / max) * 1000) / 10;
		const grade = suggestGradeFromPercentage(percentage);
		const pillClass = getGradePillClass(grade);
		return { grade, percentage, pillClass };
	}

	function getActiveSemester() {
		if (!semesters || !semesters.length) return null;
		let sem = semesters.find((s) => s.id === activeSemesterId);
		if (!sem) {
			sem = semesters.find((s) => s.isActive) || semesters[0];
			activeSemesterId = sem.id;
		}
		return sem;
	}

	function getViewingSemester() {
		if (!semesters || !semesters.length) return null;
		if (viewingSemesterId === "all") return null;
		let sem = semesters.find((s) => s.id === viewingSemesterId);
		if (!sem) {
			sem = getActiveSemester();
			viewingSemesterId = sem ? sem.id : null;
		}
		return sem;
	}

	function getSemesterTotalSeconds(sem) {
		if (!sem || !sem.studyLogs) return 0;
		return Object.values(sem.studyLogs).reduce((acc, sec) => acc + (Number(sec) || 0), 0);
	}

	function getSemesterStats(sem) {
		if (!sem) return { totalSeconds: 0, examsCount: 0, gradedCount: 0, finalsCount: 0, avgPercentage: null, semesterGpa: null, gradeObj: null, isFromFinals: false };
		const totalSeconds = getSemesterTotalSeconds(sem);
		const semExams = Array.isArray(sem.exams) ? sem.exams : [];
		const examsCount = semExams.length;
		const gradedExams = semExams.filter((e) => e.mark !== null && e.mark !== undefined && e.mark !== "" && !isNaN(Number(e.mark)));
		const gradedCount = gradedExams.length;

		const semFinals = Array.isArray(sem.subjectFinals) ? sem.subjectFinals : [];
		const validFinals = semFinals.filter((f) => f.score !== null && f.score !== undefined && f.score !== "" && !isNaN(Number(f.score)));
		const finalsCount = validFinals.length;

		let avgPercentage = null;
		let semesterGpa = null;
		let gradeObj = null;
		let isFromFinals = false;

		if (finalsCount > 0) {
			// Counted from Final Subject Scores!
			isFromFinals = true;
			let totalScoreWeighted = 0;
			let totalScoreWeight = 0;
			let totalGpaWeighted = 0;
			let totalGpaWeight = 0;

			validFinals.forEach((f) => {
				const max = Number(f.maxScore) > 0 ? Number(f.maxScore) : 100;
				const pct = (Number(f.score) / max) * 100;
				const weight = Number(f.creditHours) > 0 ? Number(f.creditHours) : 1;
				totalScoreWeighted += pct * weight;
				totalScoreWeight += weight;

				if (f.gpa !== null && f.gpa !== undefined && f.gpa !== "" && !isNaN(Number(f.gpa))) {
					totalGpaWeighted += Number(f.gpa) * weight;
					totalGpaWeight += weight;
				}
			});

			if (totalScoreWeight > 0) {
				avgPercentage = Math.round((totalScoreWeighted / totalScoreWeight) * 10) / 10;
				gradeObj = calculateGrade(avgPercentage, 100);
			}

			if (totalGpaWeight > 0) {
				semesterGpa = (Math.round((totalGpaWeighted / totalGpaWeight) * 100) / 100).toFixed(2);
			}
		} else if (gradedCount > 0) {
			// Fallback: computed from individual exam papers if no finals entered yet
			const sumPercentages = gradedExams.reduce((sum, e) => {
				const max = Number(e.maxMark) || 100;
				return sum + ((Number(e.mark) / max) * 100);
			}, 0);
			avgPercentage = Math.round((sumPercentages / gradedCount) * 10) / 10;
			gradeObj = calculateGrade(avgPercentage, 100);
		}

		return { totalSeconds, examsCount, gradedCount, finalsCount, avgPercentage, semesterGpa, gradeObj, isFromFinals };
	}

	function getAllSemestersExams() {
		if (!semesters || !semesters.length) {
			return defaultExamsTemplate;
		}
		const allExams = [];
		semesters.forEach((sem) => {
			if (Array.isArray(sem.exams)) {
				sem.exams.forEach((exam) => {
					allExams.push({
						...exam,
						semesterId: sem.id,
						semesterName: sem.name,
					});
				});
			}
		});
		return allExams.length > 0 ? allExams : defaultExamsTemplate;
	}

	function getCurrentExams() {
		const activeSem = getActiveSemester();
		if (activeSem && Array.isArray(activeSem.exams) && activeSem.exams.length > 0) {
			return activeSem.exams.map((e) => ({ ...e, semesterId: activeSem.id, semesterName: activeSem.name }));
		}
		return getAllSemestersExams();
	}

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

	function saveTaskViewPreferences() {
		localStorage.setItem(
			TASK_VIEW_PREFS_KEY,
			JSON.stringify({
				taskSubjectFilter,
				taskStatusFilter,
				taskSort,
			})
		);
	}

	function loadTaskViewPreferences() {
		try {
			const rawPrefs = localStorage.getItem(TASK_VIEW_PREFS_KEY);
			if (!rawPrefs) return;
			const prefs = JSON.parse(rawPrefs);
			if (prefs.taskSubjectFilter) taskSubjectFilter = prefs.taskSubjectFilter;
			if (prefs.taskStatusFilter) taskStatusFilter = prefs.taskStatusFilter;
			if (prefs.taskSort) taskSort = prefs.taskSort;
		} catch (error) {
			console.warn("Failed to load task view preferences:", error);
		}
	}

	const isTaskExpanded = (taskId) => taskCollapseState[taskId] === true;

	function toggleTaskSubtasks(taskId) {
		taskCollapseState[taskId] = !isTaskExpanded(taskId);
		renderTasksPage();
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
		const populateSubjects = () => {
			const selects = [taskSubjectSelect, pomodoroSubjectSelect, filterSubjectEl, editTaskSubject, examSubjectInput, finalSubjectInput];
			selects.forEach((sel) => {
				if (!sel) return;
				if (sel.id === "filter-subject") {
					while (sel.options.length > 1) sel.remove(1);
				} else {
					sel.innerHTML = "";
				}
				Object.keys(subjectColors).forEach((s) => sel.add(new Option(s, s)));
			});
		};
		populateSubjects();
		filterSubjectEl.value = taskSubjectFilter;
		filterStatusEl.value = taskStatusFilter;
		sortTasksEl.value = taskSort;
		renderTasksPage();
		renderSemesterSection();
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

	// --- Semester Hub Event Listeners ---
	if (addSemesterBtn) addSemesterBtn.addEventListener("click", () => openSemesterModal());
	if (closeSemesterModalBtn) closeSemesterModalBtn.addEventListener("click", closeSemesterModal);
	if (cancelSemesterModalBtn) cancelSemesterModalBtn.addEventListener("click", closeSemesterModal);
	if (semesterModal) semesterModal.addEventListener("click", (e) => e.target === semesterModal && closeSemesterModal());
	if (semesterForm) semesterForm.addEventListener("submit", handleSaveSemester);

	if (quickSemesterSelect) {
		quickSemesterSelect.addEventListener("change", (e) => {
			viewingSemesterId = e.target.value;
			renderSemesterSection();
			renderStudyChart();
		});
	}

	if (chartSemesterFilter) {
		chartSemesterFilter.addEventListener("change", (e) => {
			viewingSemesterId = e.target.value;
			renderStudyChart();
		});
	}

	if (semestersGrid) {
		semestersGrid.addEventListener("click", (e) => {
			const setActiveBtn = e.target.closest(".set-active-btn");
			if (setActiveBtn) {
				const semId = setActiveBtn.dataset.id;
				setActiveSemester(semId);
				return;
			}
			const viewExamsBtn = e.target.closest(".view-exams-btn");
			if (viewExamsBtn) {
				const semId = viewExamsBtn.dataset.id;
				openExamsModal(semId);
				return;
			}
			const editSemBtn = e.target.closest(".edit-sem-btn");
			if (editSemBtn) {
				const semId = editSemBtn.dataset.id;
				openSemesterModal(semId);
				return;
			}
			const deleteSemBtn = e.target.closest(".delete-sem-btn");
			if (deleteSemBtn) {
				const semId = deleteSemBtn.dataset.id;
				openDeleteSemesterModal(semId);
				return;
			}
		});
	}

	// --- Semester Academic Records & Exams Modal Event Listeners ---
	if (closeExamsModalBtn) closeExamsModalBtn.addEventListener("click", closeExamsModal);
	if (semesterExamsModal) semesterExamsModal.addEventListener("click", (e) => e.target === semesterExamsModal && closeExamsModal());
	
	// Tab switching
	if (tabBtnFinalScores) tabBtnFinalScores.addEventListener("click", () => switchModalTab("finals"));
	if (tabBtnExamPapers) tabBtnExamPapers.addEventListener("click", () => switchModalTab("exams"));

	// Final Subject Scores Form Listeners
	if (resetFinalFormBtn) resetFinalFormBtn.addEventListener("click", resetSubjectFinalForm);
	if (toggleFinalFormBtn) {
		toggleFinalFormBtn.addEventListener("click", () => {
			if (resetFinalFormBtn && !resetFinalFormBtn.classList.contains("hidden")) {
				resetSubjectFinalForm();
			}
		});
	}
	if (subjectFinalForm) subjectFinalForm.addEventListener("submit", handleSaveSubjectFinal);
	if (calcFinalFromExamsBtn) calcFinalFromExamsBtn.addEventListener("click", handleAutoFillFinalFromExams);

	// Auto-fill grade & GPA suggestions when typing final score
	const updateFinalSuggestions = () => {
		const score = parseFloat(finalScoreInput.value);
		const max = parseFloat(finalMaxScoreInput.value) || 100;
		if (!isNaN(score) && max > 0) {
			const pct = (score / max) * 100;
			if (!finalGradeInput.dataset.manualEdit) {
				finalGradeInput.value = suggestGradeFromPercentage(pct);
			}
			if (!finalGpaInput.dataset.manualEdit) {
				finalGpaInput.value = suggestGpaFromPercentage(pct);
			}
		}
	};
	if (finalScoreInput) finalScoreInput.addEventListener("input", updateFinalSuggestions);
	if (finalMaxScoreInput) finalMaxScoreInput.addEventListener("input", updateFinalSuggestions);
	if (finalGradeInput) finalGradeInput.addEventListener("input", () => { finalGradeInput.dataset.manualEdit = "true"; });
	if (finalGpaInput) finalGpaInput.addEventListener("input", () => { finalGpaInput.dataset.manualEdit = "true"; });

	if (subjectFinalsListContainer) {
		subjectFinalsListContainer.addEventListener("click", (e) => {
			const editBtn = e.target.closest(".edit-final-btn");
			if (editBtn) {
				const finalId = editBtn.dataset.id;
				populateSubjectFinalFormForEdit(finalId);
				return;
			}
			const deleteBtn = e.target.closest(".delete-final-btn");
			if (deleteBtn) {
				const finalId = deleteBtn.dataset.id;
				deleteSubjectFinal(finalId);
				return;
			}
		});
	}

	// Exam Papers Form Listeners
	if (resetExamFormBtn) resetExamFormBtn.addEventListener("click", resetExamForm);
	if (toggleExamFormBtn) {
		toggleExamFormBtn.addEventListener("click", () => {
			if (resetExamFormBtn && !resetExamFormBtn.classList.contains("hidden")) {
				resetExamForm();
			}
		});
	}
	if (semesterExamForm) semesterExamForm.addEventListener("submit", handleSaveExam);

	// Auto-fill grade suggestion when typing exam mark
	const updateExamGradeSuggestion = () => {
		if (examMarkInput && examLetterGradeInput) {
			const mark = parseFloat(examMarkInput.value);
			const max = parseFloat(examMaxMarkInput.value) || 100;
			if (!isNaN(mark) && max > 0 && !examLetterGradeInput.dataset.manualEdit) {
				examLetterGradeInput.value = suggestGradeFromPercentage((mark / max) * 100);
			}
		}
	};
	if (examMarkInput) examMarkInput.addEventListener("input", updateExamGradeSuggestion);
	if (examMaxMarkInput) examMaxMarkInput.addEventListener("input", updateExamGradeSuggestion);
	if (examLetterGradeInput) examLetterGradeInput.addEventListener("input", () => { examLetterGradeInput.dataset.manualEdit = "true"; });

	if (examsListContainer) {
		examsListContainer.addEventListener("click", (e) => {
			const editExamBtn = e.target.closest(".edit-exam-btn");
			if (editExamBtn) {
				const examId = editExamBtn.dataset.id;
				populateExamFormForEdit(examId);
				return;
			}
			const logMarkBtn = e.target.closest(".log-mark-quick-btn");
			if (logMarkBtn) {
				const examId = logMarkBtn.dataset.id;
				populateExamFormForEdit(examId);
				if (examMarkInput) examMarkInput.focus();
				return;
			}
			const deleteExamBtn = e.target.closest(".delete-exam-btn");
			if (deleteExamBtn) {
				const examId = deleteExamBtn.dataset.id;
				deleteExamFromSemester(examId);
				return;
			}
		});
	}

	// --- Delete Semester Modal Event Listeners ---
	if (cancelDeleteSemesterBtn) cancelDeleteSemesterBtn.addEventListener("click", closeDeleteSemesterModal);
	if (confirmDeleteSemesterBtn) confirmDeleteSemesterBtn.addEventListener("click", handleConfirmDeleteSemester);
	if (deleteSemesterModal) deleteSemesterModal.addEventListener("click", (e) => e.target === deleteSemesterModal && closeDeleteSemesterModal());

	navDashboard.addEventListener("click", () => showPage("dashboard"));
	navStudy.addEventListener("click", () => showPage("study"));
	navTasks.addEventListener("click", () => showPage("tasks"));
	navFlashcards.addEventListener("click", () => showPage("flashcards"));
  navBinder.addEventListener("click", () => showPage("binder"));
  importSetBtn.addEventListener("click", () => openImportExportModal("import"));
  exportEditSetBtn.addEventListener("click", () => openImportExportModal("edit", currentFlashcardSet));

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
		} else if (target.closest(".move-task-up-btn") && taskItem) {
			moveTaskByOffset(taskItem.dataset.id, -1);
		} else if (target.closest(".move-task-down-btn") && taskItem) {
			moveTaskByOffset(taskItem.dataset.id, 1);
		} else if (target.closest(".move-subtask-up-btn") && subtaskItem) {
			moveSubTaskByOffset(subtaskItem.dataset.parentId, subtaskItem.dataset.id, -1);
		} else if (target.closest(".move-subtask-down-btn") && subtaskItem) {
			moveSubTaskByOffset(subtaskItem.dataset.parentId, subtaskItem.dataset.id, 1);
		} else if (target.closest(".task-collapse-btn") && taskItem) {
			toggleTaskSubtasks(taskItem.dataset.id);
		}
	});

	addTaskBtn.addEventListener("click", addTask);
	taskInput.addEventListener("keydown", (e) => e.key === "Enter" && addTask());

	filterSubjectEl.addEventListener("change", (e) => {
		taskSubjectFilter = e.target.value;
		saveTaskViewPreferences();
		renderTasksPage();
	});
	filterStatusEl.addEventListener("change", (e) => {
		taskStatusFilter = e.target.value;
		saveTaskViewPreferences();
		renderTasksPage();
	});
	sortTasksEl.addEventListener("change", (e) => {
		taskSort = e.target.value;
		saveTaskViewPreferences();
		renderTasksPage();
	});

	playPauseBtn.addEventListener("click", playPauseTimer);
	skipBtn.addEventListener("click", () => {
		if (currentMode === "focus") {
			saveStudyLogs();
			if (window.collectiblesModule) {
				window.collectiblesModule.saveCollectibleState();
			}      
		}
		// if (ytPlayer && typeof ytPlayer.stopVideo === "function") {
		// 	ytPlayer.stopVideo();
		// 	youtubePlayerContainer.classList.add("hidden");
		// 	currentPlayingSoundId = null;
		// 	renderSoundLibrary();
		// }
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
		await loadSemesters();
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
		const pages = {dashboard: dashboardPage, study: studyPage, tasks: tasksPage, flashcards: flashcardsPage, binder: binderPage};
		const navs = {dashboard: navDashboard, study: navStudy, tasks: navTasks, flashcards: navFlashcards, binder: navBinder};
		Object.keys(pages).forEach((p) => {
			if (pages[p]) pages[p].classList.add("hidden");
			if (navs[p]) navs[p].classList.remove("active");
		});
		if (pages[page]) pages[page].classList.remove("hidden");
		if (navs[page]) navs[page].classList.add("active");

		if (page === "dashboard") renderDashboard();

		if (page === "binder" && window.collectiblesModule && typeof window.collectiblesModule.renderInventory === "function") {
			window.collectiblesModule.renderInventory();
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
	function renderUpcomingExams() {
		const now = new Date();
		const allExams = getAllSemestersExams();
		const upcoming = allExams.filter((e) => new Date(e.date) > now).sort((a, b) => new Date(a.date) - new Date(b.date));
		upcomingExamsContainer.innerHTML = "";
		if (upcoming.length === 0) {
			upcomingExamsContainer.innerHTML = `<p class="text-slate-500 dark:text-slate-400">No upcoming exams!</p>`;
			return;
		}
		const nextDate = new Date(upcoming[0].date).toDateString();
		const nextExams = upcoming.filter((e) => new Date(e.date).toDateString() === nextDate);
		upcomingExamsContainer.innerHTML = `<p class="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">On ${new Date(nextExams[0].date).toLocaleDateString("en-US", {weekday: "long", month: "long", day: "numeric"})}</p>`;
		nextExams.forEach((exam) => {
			const el = document.createElement("div");
			el.className = "flex items-center p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg";
			const semBadge = exam.semesterName ? `<span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium mr-2">${exam.semesterName}</span>` : "";
			el.innerHTML = `
				<div class="w-1.5 h-10 rounded-full mr-3" style="background-color: ${getColorForSubject(exam.subject)};"></div>
				<div class="min-w-0 flex-1">
					<div class="flex items-center">
						${semBadge}
						<p class="font-semibold text-slate-800 dark:text-slate-200 truncate">${exam.subject}${exam.paper ? ` • ${exam.paper}` : ""}</p>
					</div>
					<p class="text-sm text-slate-500 dark:text-slate-400">${new Date(exam.date).toLocaleTimeString("en-US", {hour: "numeric", minute: "2-digit", hour12: true})}</p>
				</div>
			`;
			upcomingExamsContainer.appendChild(el);
		});
	}
	function renderStudyChart() {
		if (!studyChartCanvas) return;
		const ctx = studyChartCanvas.getContext("2d");
		let targetLogs = {};

		if (viewingSemesterId === "all") {
			semesters.forEach((s) => {
				if (s.studyLogs) {
					for (const [subj, sec] of Object.entries(s.studyLogs)) {
						targetLogs[subj] = (targetLogs[subj] || 0) + (Number(sec) || 0);
					}
				}
			});
		} else {
			const viewedSem = getViewingSemester();
			targetLogs = viewedSem && viewedSem.studyLogs ? viewedSem.studyLogs : studyLogs;
		}

		const sortedStudyEntries = Object.entries(targetLogs).sort((a, b) => b[1] - a[1]);
		const labels = sortedStudyEntries.map(([subject]) => subject);
		const data = sortedStudyEntries.map(([, seconds]) => (seconds / 3600).toFixed(2));
		if (studyChart) studyChart.destroy();
		if (labels.length === 0) {
			ctx.clearRect(0, 0, studyChartCanvas.width, studyChartCanvas.height);
			ctx.font = "16px Inter";
			ctx.fillStyle = "#94a3b8";
			ctx.textAlign = "center";
			ctx.fillText("Log study time to see your progress!", studyChartCanvas.width / 2, 50);
			return;
		}
		studyChart = new Chart(ctx, {
			type: "bar",
			data: {
				labels,
				datasets: [
					{
						label: "Hours Studied",
						data,
						backgroundColor: labels.map((l) => subjectColors[l] || subjectColors["Other"]),
						borderRadius: 6,
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					y: {
						beginAtZero: true,
						grid: { display: false, color: "#94a3b8" },
						title: { display: true, text: "Hours", color: "#94a3b8" },
						ticks: { color: "#94a3b8" },
					},
					x: {
						grid: { display: false },
						ticks: { color: "#94a3b8" },
					},
				},
				plugins: { legend: { display: false } },
			},
		});
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
			const savedTask = await response.json();
			// Replace the temp task with the real one from server (gets the real _id)
			const tempIndex = tasks.findIndex((t) => t._id === tempId);
			if (tempIndex !== -1) tasks[tempIndex] = savedTask;
			renderTasksPage();
		} catch (error) {
			console.error("Failed to add task:", error);
			tasks = tasks.filter((t) => t._id !== tempId);
			renderTasksPage();
			taskErrorEl.textContent = "Failed to save task. Please try again.";
			setTimeout(() => (taskErrorEl.textContent = ""), 3000);
		}
	}
	async function toggleTask(task) {
		const originalCompleted = task.completed;
		task.completed = !task.completed;
		renderTasksPage();
		try {
			const response = await fetch(`${API_URL}/api/study/tasks/${task._id}`, {method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify({completed: task.completed})});
			if (!response.ok) throw new Error("Server error");
		} catch (error) {
			console.error("Failed to toggle task:", error);
			task.completed = originalCompleted;
			renderTasksPage();
		}
	}
	async function deleteTask(taskId) {
		const taskIndex = tasks.findIndex((t) => t._id === taskId);
		if (taskIndex === -1) return;
		const deletedTask = tasks[taskIndex];
		tasks.splice(taskIndex, 1);
		renderTasksPage();
		try {
			const response = await fetch(`${API_URL}/api/study/tasks/${taskId}`, {method: "DELETE"});
			if (!response.ok) throw new Error("Server error");
		} catch (error) {
			console.error("Failed to delete task:", error);
			tasks.splice(taskIndex, 0, deletedTask);
			renderTasksPage();
		}
	}

	async function saveTaskOrder(orderedIds) {
		try {
			await fetch(`${API_URL}/api/study/tasks/reorder`, {
				method: "PUT",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({orderedIds}),
			});
		} catch (error) {
			console.error("Failed to save task order:", error);
		}
	}

	async function saveSubTaskOrder(taskId, orderedIds) {
		try {
			await fetch(`${API_URL}/api/study/tasks/${taskId}/subtasks/reorder`, {
				method: "PUT",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({orderedIds}),
			});
		} catch (error) {
			console.error("Failed to save sub-task order:", error);
		}
	}

	async function saveSoundLibraryOrder(orderedIds) {
		try {
			await fetch(`${API_URL}/api/study/sound-library/reorder`, {
				method: "PUT",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({userId: currentUser.id, orderedIds}),
			});
		} catch (error) {
			console.error("Failed to save sound order:", error);
		}
	}

	async function saveFlashcardSetOrder(orderedIds) {
		try {
			await fetch(`${API_URL}/api/study/flashcard-sets/reorder`, {
				method: "PUT",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({orderedIds}),
			});
		} catch (error) {
			console.error("Failed to save flashcard set order:", error);
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

			// Silently update the temp subtask ID with the real one from the server
			const updatedTask = await response.json();
			const taskIndex = tasks.findIndex((t) => t._id === taskId);
			if (taskIndex !== -1) {
				// Only replace the subTasks array to get real IDs, without triggering a re-render
				tasks[taskIndex].subTasks = updatedTask.subTasks;
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

			// Silently sync IDs without re-rendering
			const updatedTask = await response.json();
			const taskIndex = tasks.findIndex((t) => t._id === taskId);
			if (taskIndex !== -1) tasks[taskIndex].subTasks = updatedTask.subTasks;
		} catch (error) {
			console.error("Failed to update sub-task:", error);
			// Revert is handled by the calling function (e.g. toggleSubTask)
		}
	}

	async function deleteSubTask(taskId, subtaskId, fromModal = false) {
		const task = tasks.find((t) => t._id === taskId);
		if (!task) return;
		const subtaskIndex = task.subTasks.findIndex((st) => st._id === subtaskId);
		if (subtaskIndex === -1) return;
		const deletedSubTask = task.subTasks[subtaskIndex];
		task.subTasks.splice(subtaskIndex, 1);

		if (fromModal) {
			renderSubtasksInModal(taskId);
		} else {
			renderTasksPage();
		}

		try {
			const response = await fetch(`${API_URL}/api/study/tasks/${taskId}/subtasks/${subtaskId}`, {
				method: "DELETE",
			});
			if (!response.ok) throw new Error("Server error");
		} catch (error) {
			console.error("Failed to delete sub-task:", error);
			task.subTasks.splice(subtaskIndex, 0, deletedSubTask);
			if (fromModal) {
				renderSubtasksInModal(taskId);
			} else {
				renderTasksPage();
			}
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
		const activeSem = getActiveSemester();
		if (activeSem) {
			if (!activeSem.studyLogs) activeSem.studyLogs = {};
			activeSem.studyLogs = { ...studyLogs };
			saveSemesters(true);
		}
		try {
			await fetch(`${API_URL}/api/study/logs`, {
				method: "PUT",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({
					userId: currentUser.id,
					studyLogs,
					activeSemesterId
				})
			});
			await updateStreak();
		} catch (error) {
			console.error("Failed to save study logs:", error);
		}
	}

	// --- SEMESTER MANAGEMENT FUNCTIONS ---
	async function loadSemesters() {
		if (!currentUser) return;
		const storageKey = `studySemesters_${currentUser.id}`;
		const activeKey = `studyActiveSemester_${currentUser.id}`;
		let loadedFromDb = false;

		try {
			const response = await fetch(`${API_URL}/api/study/semesters?userId=${currentUser.id}`);
			if (response.ok) {
				const data = await response.json();
				if (Array.isArray(data.semesters) && data.semesters.length > 0) {
					semesters = data.semesters;
					activeSemesterId = data.activeSemesterId || (semesters[0] ? semesters[0].id : null);
					loadedFromDb = true;
				}
			}
		} catch (error) {
			console.warn("Could not fetch semesters from server, checking local storage:", error);
		}

		if (!loadedFromDb) {
			const localSemesters = localStorage.getItem(storageKey);
			if (localSemesters) {
				try {
					semesters = JSON.parse(localSemesters);
					activeSemesterId = localStorage.getItem(activeKey) || (semesters[0] ? semesters[0].id : null);
				} catch (e) {
					console.error("Failed to parse local semesters:", e);
					semesters = [];
				}
			}
		}

		// Ensure all semesters have subjectFinals and exams have letterGrade
		if (Array.isArray(semesters)) {
			semesters.forEach((s) => {
				if (!Array.isArray(s.subjectFinals)) s.subjectFinals = [];
				if (!Array.isArray(s.exams)) s.exams = [];
				s.exams.forEach((ex) => {
					if (ex.letterGrade === undefined) ex.letterGrade = "";
				});
			});
		}

		// Migration: If no semesters exist yet, auto-create the initial semester from existing study logs and exams!
		if (!semesters || semesters.length === 0) {
			console.log("Migrating existing user data into initial semester...");
			const initialSem = {
				id: "sem_" + Date.now(),
				name: "Semester 1 (Current)",
				startDate: new Date().toISOString().split("T")[0],
				endDate: "",
				isActive: true,
				description: "Initial semester migrated with your existing study logs and exams",
				studyLogs: typeof studyLogs === "object" && studyLogs !== null ? { ...studyLogs } : {},
				exams: defaultExamsTemplate.map((e, idx) => ({
					id: "exam_migrated_" + idx,
					subject: e.subject,
					date: e.date,
					paper: "",
					mark: null,
					maxMark: 100,
					letterGrade: "",
					weight: 0,
					notes: "",
				})),
				subjectFinals: [],
				createdAt: new Date().toISOString(),
			};
			semesters = [initialSem];
			activeSemesterId = initialSem.id;
			saveSemesters(true);
		}

		if (!viewingSemesterId) {
			viewingSemesterId = activeSemesterId;
		}

		// Sync active semester's studyLogs with current studyLogs state
		const activeSem = getActiveSemester();
		if (activeSem && activeSem.studyLogs) {
			for (const subject in activeSem.studyLogs) {
				studyLogs[subject] = activeSem.studyLogs[subject];
			}
		}

		renderSemesterSection();
	}

	async function saveSemesters(syncBackend = true) {
		if (!currentUser) return;
		const storageKey = `studySemesters_${currentUser.id}`;
		const activeKey = `studyActiveSemester_${currentUser.id}`;

		semesters.forEach((s) => {
			s.isActive = (s.id === activeSemesterId);
		});

		try {
			localStorage.setItem(storageKey, JSON.stringify(semesters));
			if (activeSemesterId) {
				localStorage.setItem(activeKey, activeSemesterId);
			}
		} catch (e) {
			console.error("Failed to save semesters to localStorage:", e);
		}

		if (syncBackend) {
			try {
				await fetch(`${API_URL}/api/study/semesters/sync`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						userId: currentUser.id,
						semesters,
						activeSemesterId,
					}),
				});
			} catch (error) {
				console.warn("Could not sync semesters with server (saved locally):", error);
			}
		}
	}

	function openSemesterModal(semesterId = null) {
		if (semesterId) {
			const sem = semesters.find((s) => s.id === semesterId);
			if (!sem) return;
			if (semesterModalTitle) semesterModalTitle.textContent = "Edit Semester";
			if (editingSemesterIdInput) editingSemesterIdInput.value = sem.id;
			if (semesterNameInput) semesterNameInput.value = sem.name;
			if (semesterStartDateInput) semesterStartDateInput.value = sem.startDate || "";
			if (semesterEndDateInput) semesterEndDateInput.value = sem.endDate || "";
			if (semesterDescriptionInput) semesterDescriptionInput.value = sem.description || "";
			if (semesterIsActiveInput) semesterIsActiveInput.checked = (sem.id === activeSemesterId);
		} else {
			if (semesterModalTitle) semesterModalTitle.textContent = "Create New Semester";
			if (editingSemesterIdInput) editingSemesterIdInput.value = "";
			if (semesterForm) semesterForm.reset();
			if (semesterIsActiveInput) semesterIsActiveInput.checked = (semesters.length === 0);
		}
		if (semesterModal) semesterModal.classList.remove("hidden");
	}

	function closeSemesterModal() {
		if (semesterModal) semesterModal.classList.add("hidden");
		if (editingSemesterIdInput) editingSemesterIdInput.value = "";
		if (semesterForm) semesterForm.reset();
	}

	async function handleSaveSemester(e) {
		e.preventDefault();
		const editingId = editingSemesterIdInput ? editingSemesterIdInput.value : "";
		const name = semesterNameInput.value.trim();
		const startDate = semesterStartDateInput.value;
		const endDate = semesterEndDateInput.value;
		const description = semesterDescriptionInput.value.trim();
		const setActive = semesterIsActiveInput ? semesterIsActiveInput.checked : false;

		if (!name) return;

		if (editingId) {
			const sem = semesters.find((s) => s.id === editingId);
			if (sem) {
				sem.name = name;
				sem.startDate = startDate;
				sem.endDate = endDate;
				sem.description = description;
				if (setActive) {
					activeSemesterId = sem.id;
					semesters.forEach((s) => (s.isActive = s.id === sem.id));
				}
			}
		} else {
			const newSem = {
				id: "sem_" + Date.now(),
				name,
				startDate,
				endDate,
				description,
				isActive: setActive || (semesters.length === 0),
				studyLogs: {},
				exams: [],
				subjectFinals: [],
				createdAt: new Date().toISOString(),
			};
			if (newSem.isActive) {
				activeSemesterId = newSem.id;
				semesters.forEach((s) => (s.isActive = false));
			}
			semesters.push(newSem);
			viewingSemesterId = newSem.id;
		}

		await saveSemesters(true);
		closeSemesterModal();
		renderSemesterSection();
		renderStudyChart();
		renderUpcomingExams();
		populateCalendarWithExams();
		renderCalendar();
		renderCountdowns();
		renderStudyLogs();
	}

	async function setActiveSemester(id) {
		const sem = semesters.find((s) => s.id === id);
		if (!sem) return;

		activeSemesterId = id;
		viewingSemesterId = id;
		semesters.forEach((s) => (s.isActive = s.id === id));

		if (sem.studyLogs) {
			studyLogs = { ...sem.studyLogs };
		} else {
			sem.studyLogs = {};
			studyLogs = {};
		}

		await saveSemesters(true);
		renderSemesterSection();
		renderStudyLogs();
		renderStudyChart();
		renderUpcomingExams();
		populateCalendarWithExams();
		renderCalendar();
		renderCountdowns();
	}

	function openDeleteSemesterModal(semesterId) {
		if (semesters.length <= 1) {
			alert("You must have at least one semester. To replace this semester, create a new semester first.");
			return;
		}
		const sem = semesters.find((s) => s.id === semesterId);
		if (!sem) return;

		deletingSemesterId = semesterId;
		if (deleteSemesterNameEl) deleteSemesterNameEl.textContent = `"${sem.name}"`;
		if (deleteSemesterModal) deleteSemesterModal.classList.remove("hidden");
	}

	function closeDeleteSemesterModal() {
		if (deleteSemesterModal) deleteSemesterModal.classList.add("hidden");
		deletingSemesterId = null;
	}

	async function handleConfirmDeleteSemester() {
		if (!deletingSemesterId) return;
		const idToDelete = deletingSemesterId;

		semesters = semesters.filter((s) => s.id !== idToDelete);

		if (activeSemesterId === idToDelete) {
			activeSemesterId = semesters.length > 0 ? semesters[0].id : null;
			if (activeSemesterId && semesters[0]) {
				semesters[0].isActive = true;
				studyLogs = semesters[0].studyLogs ? { ...semesters[0].studyLogs } : {};
			}
		}
		if (viewingSemesterId === idToDelete) {
			viewingSemesterId = activeSemesterId;
		}

		closeDeleteSemesterModal();
		await saveSemesters(true);
		renderSemesterSection();
		renderStudyLogs();
		renderStudyChart();
		renderUpcomingExams();
		populateCalendarWithExams();
		renderCalendar();
		renderCountdowns();
	}

	let currentModalTab = "finals";
	function switchModalTab(tab) {
		currentModalTab = tab;
		if (tab === "finals") {
			if (tabBtnFinalScores) {
				tabBtnFinalScores.classList.add("is-active");
				tabBtnFinalScores.classList.remove("text-slate-600", "dark:text-slate-300");
			}
			if (tabBtnExamPapers) {
				tabBtnExamPapers.classList.remove("is-active");
				tabBtnExamPapers.classList.add("text-slate-600", "dark:text-slate-300");
			}
			if (tabContentFinalScores) tabContentFinalScores.classList.remove("hidden");
			if (tabContentExamPapers) tabContentExamPapers.classList.add("hidden");
		} else {
			if (tabBtnFinalScores) {
				tabBtnFinalScores.classList.remove("is-active");
				tabBtnFinalScores.classList.add("text-slate-600", "dark:text-slate-300");
			}
			if (tabBtnExamPapers) {
				tabBtnExamPapers.classList.add("is-active");
				tabBtnExamPapers.classList.remove("text-slate-600", "dark:text-slate-300");
			}
			if (tabContentFinalScores) tabContentFinalScores.classList.add("hidden");
			if (tabContentExamPapers) tabContentExamPapers.classList.remove("hidden");
		}
	}

	function openExamsModal(semesterId) {
		const sem = semesters.find((s) => s.id === semesterId);
		if (!sem) return;
		managingExamsSemesterId = semesterId;
		switchModalTab("finals");
		renderSemesterExamsModal(semesterId);
		if (semesterExamsModal) semesterExamsModal.classList.remove("hidden");
	}

	function closeExamsModal() {
		if (semesterExamsModal) semesterExamsModal.classList.add("hidden");
		managingExamsSemesterId = null;
		resetExamForm();
		resetSubjectFinalForm();
	}

	function resetExamForm() {
		if (editingExamIdInput) editingExamIdInput.value = "";
		if (semesterExamForm) semesterExamForm.reset();
		if (examMaxMarkInput) examMaxMarkInput.value = 100;
		if (examLetterGradeInput) {
			examLetterGradeInput.value = "";
			delete examLetterGradeInput.dataset.manualEdit;
		}
		if (examFormHeading) examFormHeading.textContent = "Add Exam Paper / Log Mark";
		if (resetExamFormBtn) resetExamFormBtn.classList.add("hidden");
	}

	function populateExamFormForEdit(examId) {
		const sem = semesters.find((s) => s.id === managingExamsSemesterId);
		if (!sem || !Array.isArray(sem.exams)) return;
		const exam = sem.exams.find((e) => e.id === examId);
		if (!exam) return;

		switchModalTab("exams");
		if (editingExamIdInput) editingExamIdInput.value = exam.id;
		if (examSubjectInput) examSubjectInput.value = exam.subject;
		if (examTitleInput) examTitleInput.value = exam.paper || "";
		if (examDatetimeInput) {
			try {
				const d = new Date(exam.date);
				if (!isNaN(d.getTime())) {
					const pad = (n) => String(n).padStart(2, "0");
					const localIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
					examDatetimeInput.value = localIso;
				} else {
					examDatetimeInput.value = exam.date;
				}
			} catch (e) {
				examDatetimeInput.value = exam.date;
			}
		}
		if (examMarkInput) examMarkInput.value = exam.mark !== null && exam.mark !== undefined ? exam.mark : "";
		if (examMaxMarkInput) examMaxMarkInput.value = exam.maxMark || 100;
		if (examLetterGradeInput) {
			examLetterGradeInput.value = exam.letterGrade || "";
			if (exam.letterGrade) examLetterGradeInput.dataset.manualEdit = "true";
			else delete examLetterGradeInput.dataset.manualEdit;
		}
		if (examNotesInput) examNotesInput.value = exam.notes || "";

		if (examFormHeading) examFormHeading.textContent = "Edit Exam Paper / Mark";
		if (resetExamFormBtn) resetExamFormBtn.classList.remove("hidden");
	}

	async function handleSaveExam(e) {
		e.preventDefault();
		const sem = semesters.find((s) => s.id === managingExamsSemesterId);
		if (!sem) return;

		const editingId = editingExamIdInput ? editingExamIdInput.value : "";
		const subject = examSubjectInput.value;
		const paper = examTitleInput ? examTitleInput.value.trim() : "";
		const dateVal = examDatetimeInput.value;
		const markVal = examMarkInput && examMarkInput.value !== "" ? parseFloat(examMarkInput.value) : null;
		const maxMarkVal = examMaxMarkInput && examMaxMarkInput.value !== "" ? parseFloat(examMaxMarkInput.value) : 100;
		let letterGradeVal = examLetterGradeInput ? examLetterGradeInput.value.trim().toUpperCase() : "";
		const notesVal = examNotesInput ? examNotesInput.value.trim() : "";

		if (!subject || !dateVal) return;

		if (!letterGradeVal && markVal !== null && maxMarkVal > 0) {
			letterGradeVal = suggestGradeFromPercentage((markVal / maxMarkVal) * 100);
		}

		if (!Array.isArray(sem.exams)) sem.exams = [];

		if (editingId) {
			const idx = sem.exams.findIndex((ex) => ex.id === editingId);
			if (idx !== -1) {
				sem.exams[idx] = {
					...sem.exams[idx],
					subject,
					paper,
					date: dateVal,
					mark: markVal,
					maxMark: maxMarkVal,
					letterGrade: letterGradeVal,
					notes: notesVal,
				};
			}
		} else {
			const newExam = {
				id: "exam_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
				subject,
				paper,
				date: dateVal,
				mark: markVal,
				maxMark: maxMarkVal,
				letterGrade: letterGradeVal,
				weight: 0,
				notes: notesVal,
			};
			sem.exams.push(newExam);
		}

		await saveSemesters(true);
		renderSemesterExamsModal(managingExamsSemesterId);
		renderSemesterSection();
		populateCalendarWithExams();
		renderCalendar();
		renderCountdowns();
		renderUpcomingExams();
	}

	async function deleteExamFromSemester(examId) {
		const sem = semesters.find((s) => s.id === managingExamsSemesterId);
		if (!sem || !Array.isArray(sem.exams)) return;

		if (!confirm("Are you sure you want to delete this exam paper?")) return;

		sem.exams = sem.exams.filter((ex) => ex.id !== examId);
		await saveSemesters(true);
		renderSemesterExamsModal(managingExamsSemesterId);
		renderSemesterSection();
		populateCalendarWithExams();
		renderCalendar();
		renderCountdowns();
		renderUpcomingExams();
	}

	// --- Final Subject Scores Functions ---
	function resetSubjectFinalForm() {
		if (editingFinalIdInput) editingFinalIdInput.value = "";
		if (subjectFinalForm) subjectFinalForm.reset();
		if (finalMaxScoreInput) finalMaxScoreInput.value = 100;
		if (finalCreditsInput) finalCreditsInput.value = 1;
		if (finalGradeInput) delete finalGradeInput.dataset.manualEdit;
		if (finalGpaInput) delete finalGpaInput.dataset.manualEdit;
		if (finalFormHeading) finalFormHeading.textContent = "Key In Final Subject Score & GPA";
		if (resetFinalFormBtn) resetFinalFormBtn.classList.add("hidden");
	}

	function populateSubjectFinalFormForEdit(finalId) {
		const sem = semesters.find((s) => s.id === managingExamsSemesterId);
		if (!sem || !Array.isArray(sem.subjectFinals)) return;
		const finalItem = sem.subjectFinals.find((f) => f.id === finalId);
		if (!finalItem) return;

		switchModalTab("finals");
		if (editingFinalIdInput) editingFinalIdInput.value = finalItem.id;
		if (finalSubjectInput) finalSubjectInput.value = finalItem.subject;
		if (finalScoreInput) finalScoreInput.value = finalItem.score !== null && finalItem.score !== undefined ? finalItem.score : "";
		if (finalMaxScoreInput) finalMaxScoreInput.value = finalItem.maxScore || 100;
		if (finalGpaInput) {
			finalGpaInput.value = finalItem.gpa !== null && finalItem.gpa !== undefined ? finalItem.gpa : "";
			finalGpaInput.dataset.manualEdit = "true";
		}
		if (finalGradeInput) {
			finalGradeInput.value = finalItem.letterGrade || "";
			finalGradeInput.dataset.manualEdit = "true";
		}
		if (finalCreditsInput) finalCreditsInput.value = finalItem.creditHours || 1;
		if (finalNotesInput) finalNotesInput.value = finalItem.notes || "";

		if (finalFormHeading) finalFormHeading.textContent = "Edit Final Subject Score & GPA";
		if (resetFinalFormBtn) resetFinalFormBtn.classList.remove("hidden");
	}

	async function handleSaveSubjectFinal(e) {
		e.preventDefault();
		const sem = semesters.find((s) => s.id === managingExamsSemesterId);
		if (!sem) return;

		const editingId = editingFinalIdInput ? editingFinalIdInput.value : "";
		const subject = finalSubjectInput.value;
		const scoreVal = finalScoreInput && finalScoreInput.value !== "" ? parseFloat(finalScoreInput.value) : null;
		const maxScoreVal = finalMaxScoreInput && finalMaxScoreInput.value !== "" ? parseFloat(finalMaxScoreInput.value) : 100;
		let gpaVal = finalGpaInput && finalGpaInput.value !== "" ? parseFloat(finalGpaInput.value) : null;
		let letterGradeVal = finalGradeInput ? finalGradeInput.value.trim().toUpperCase() : "";
		const creditsVal = finalCreditsInput && finalCreditsInput.value !== "" ? parseFloat(finalCreditsInput.value) : 1;
		const notesVal = finalNotesInput ? finalNotesInput.value.trim() : "";

		if (!subject || scoreVal === null || isNaN(scoreVal)) {
			alert("Please provide a subject and valid final score.");
			return;
		}

		// Auto-derive grade or GPA if user left them empty
		const pct = (scoreVal / maxScoreVal) * 100;
		if (!letterGradeVal) {
			letterGradeVal = suggestGradeFromPercentage(pct);
		}
		if (gpaVal === null || isNaN(gpaVal)) {
			const suggested = suggestGpaFromPercentage(pct);
			if (suggested !== "") gpaVal = parseFloat(suggested);
		}

		if (!Array.isArray(sem.subjectFinals)) sem.subjectFinals = [];

		if (editingId) {
			const idx = sem.subjectFinals.findIndex((f) => f.id === editingId);
			if (idx !== -1) {
				sem.subjectFinals[idx] = {
					...sem.subjectFinals[idx],
					subject,
					score: scoreVal,
					maxScore: maxScoreVal,
					gpa: gpaVal,
					letterGrade: letterGradeVal,
					creditHours: creditsVal,
					notes: notesVal,
				};
			}
		} else {
			// Check if a final score for this subject already exists
			const existingIdx = sem.subjectFinals.findIndex((f) => f.subject.toLowerCase() === subject.toLowerCase());
			if (existingIdx !== -1) {
				if (!confirm(`A final score for ${subject} already exists. Do you want to overwrite it?`)) {
					return;
				}
				sem.subjectFinals[existingIdx] = {
					...sem.subjectFinals[existingIdx],
					subject,
					score: scoreVal,
					maxScore: maxScoreVal,
					gpa: gpaVal,
					letterGrade: letterGradeVal,
					creditHours: creditsVal,
					notes: notesVal,
				};
			} else {
				const newFinal = {
					id: "final_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
					subject,
					score: scoreVal,
					maxScore: maxScoreVal,
					gpa: gpaVal,
					letterGrade: letterGradeVal,
					creditHours: creditsVal,
					notes: notesVal,
				};
				sem.subjectFinals.push(newFinal);
			}
		}

		await saveSemesters(true);
		renderSemesterExamsModal(managingExamsSemesterId);
		renderSemesterSection();
	}

	async function deleteSubjectFinal(finalId) {
		const sem = semesters.find((s) => s.id === managingExamsSemesterId);
		if (!sem || !Array.isArray(sem.subjectFinals)) return;

		if (!confirm("Are you sure you want to delete this final subject score?")) return;

		sem.subjectFinals = sem.subjectFinals.filter((f) => f.id !== finalId);
		await saveSemesters(true);
		renderSemesterExamsModal(managingExamsSemesterId);
		renderSemesterSection();
	}

	function handleAutoFillFinalFromExams() {
		const sem = semesters.find((s) => s.id === managingExamsSemesterId);
		if (!sem) return;

		const selectedSubject = finalSubjectInput ? finalSubjectInput.value : "";
		if (!selectedSubject) {
			alert("Please select a subject first.");
			return;
		}

		const semExams = Array.isArray(sem.exams) ? sem.exams : [];
		const matching = semExams.filter(
			(e) => e.subject.toLowerCase() === selectedSubject.toLowerCase() && e.mark !== null && e.mark !== undefined && e.mark !== ""
		);

		if (!matching.length) {
			alert(`No graded exam papers found for ${selectedSubject} in this semester yet. You can key in the final score directly!`);
			return;
		}

		// Calculate average percentage of logged papers
		const totalPct = matching.reduce((sum, e) => {
			const max = Number(e.maxMark) || 100;
			return sum + ((Number(e.mark) / max) * 100);
		}, 0);
		const avgPct = Math.round((totalPct / matching.length) * 10) / 10;

		finalScoreInput.value = avgPct;
		finalMaxScoreInput.value = 100;
		finalGradeInput.value = suggestGradeFromPercentage(avgPct);
		finalGpaInput.value = suggestGpaFromPercentage(avgPct);
		finalNotesInput.value = `Auto-averaged from ${matching.length} exam papers (${matching.map((e) => e.paper || "Paper").join(", ")})`;
		delete finalGradeInput.dataset.manualEdit;
		delete finalGpaInput.dataset.manualEdit;
	}

	function renderSubjectFinalsList(sem) {
		if (!subjectFinalsListContainer) return;
		subjectFinalsListContainer.innerHTML = "";

		const finals = Array.isArray(sem.subjectFinals) ? [...sem.subjectFinals] : [];
		if (!finals.length) {
			subjectFinalsListContainer.innerHTML = `
				<div class="text-center py-7 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
					<p class="text-slate-500 dark:text-slate-400 text-sm font-medium">No final subject scores logged yet.</p>
					<p class="text-xs text-slate-400 mt-1">Key in your final subject scores and GPA above — these will be counted toward your Semester Average and GPA!</p>
				</div>
			`;
			return;
		}

		finals.sort((a, b) => a.subject.localeCompare(b.subject));

		finals.forEach((f) => {
			const row = document.createElement("div");
			row.className = "final-score-row flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/80 dark:border-slate-700/60 gap-2.5";

			const max = Number(f.maxScore) > 0 ? Number(f.maxScore) : 100;
			const pct = Math.round(((Number(f.score) / max) * 100) * 10) / 10;
			const gradeStr = f.letterGrade || suggestGradeFromPercentage(pct);
			const pillClass = getGradePillClass(gradeStr);
			const gpaDisplay = f.gpa !== null && f.gpa !== undefined && f.gpa !== "" ? Number(f.gpa).toFixed(2) : suggestGpaFromPercentage(pct);
			const credits = Number(f.creditHours) > 0 ? Number(f.creditHours) : 1;

			row.innerHTML = `
				<div class="flex items-center gap-3 min-w-0">
					<div class="w-2.5 h-10 rounded-full flex-shrink-0" style="background-color: ${getColorForSubject(f.subject)};"></div>
					<div class="min-w-0">
						<div class="flex items-center gap-2 flex-wrap">
							<span class="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">${f.subject}</span>
							<span class="text-[11px] px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium">${credits} Credit${credits === 1 ? "" : "s"}</span>
						</div>
						<p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
							${f.notes ? `<span><i>${f.notes}</i></span>` : `<span class="text-slate-400">Final subject record</span>`}
						</p>
					</div>
				</div>

				<div class="flex items-center justify-end gap-2.5 flex-shrink-0">
					<div class="flex items-center gap-2">
						<div class="text-right">
							<span class="font-mono font-bold text-sm text-slate-800 dark:text-slate-100">${f.score} / ${max}</span>
							<span class="text-xs text-slate-500 dark:text-slate-400 block">${pct}%</span>
						</div>
						<span class="grade-pill ${pillClass}">Grade ${gradeStr}</span>
						${gpaDisplay ? `<span class="gpa-pill">GPA ${gpaDisplay}</span>` : ""}
					</div>
					<div class="flex items-center gap-1">
						<button class="edit-final-btn p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition" title="Edit Final Score" data-id="${f.id}">
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
						</button>
						<button class="delete-final-btn p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition" title="Delete Final Score" data-id="${f.id}">
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
						</button>
					</div>
				</div>
			`;

			subjectFinalsListContainer.appendChild(row);
		});
	}

	function renderSemesterExamsModal(semesterId) {
		const sem = semesters.find((s) => s.id === semesterId);
		if (!sem) return;
		managingExamsSemesterId = semesterId;

		if (examsModalSemesterTitle) {
			examsModalSemesterTitle.textContent = `${sem.name} - Academic Records & Exams`;
		}
		if (examsModalActiveBadge) {
			if (sem.id === activeSemesterId) {
				examsModalActiveBadge.classList.remove("hidden");
			} else {
				examsModalActiveBadge.classList.add("hidden");
			}
		}
		if (examsModalSemesterDates) {
			const start = sem.startDate ? new Date(sem.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
			const end = sem.endDate ? new Date(sem.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
			examsModalSemesterDates.textContent = start && end ? `${start} - ${end}` : start ? `From ${start}` : "Semester dates not specified";
		}

		const stats = getSemesterStats(sem);
		if (examsModalCount) examsModalCount.textContent = stats.examsCount;
		if (examsModalGradedCount) examsModalGradedCount.textContent = stats.gradedCount;
		if (examsModalFinalsCount) examsModalFinalsCount.textContent = stats.finalsCount;
		if (examsModalGpa) examsModalGpa.textContent = stats.semesterGpa !== null ? stats.semesterGpa : "--";
		if (examsModalAvgMark) {
			examsModalAvgMark.textContent = stats.avgPercentage !== null ? `${stats.avgPercentage}%` : "--";
		}
		if (examsModalAvgSource) {
			examsModalAvgSource.textContent = stats.isFromFinals ? "Finals Avg" : (stats.gradedCount > 0 ? "Exams Avg" : "");
		}
		if (examsModalGradePill) {
			if (stats.gradeObj) {
				examsModalGradePill.className = `grade-pill ${stats.gradeObj.pillClass}`;
				examsModalGradePill.textContent = `Grade ${stats.gradeObj.grade}`;
				examsModalGradePill.classList.remove("hidden");
			} else {
				examsModalGradePill.classList.add("hidden");
			}
		}

		if (tabFinalsBadge) tabFinalsBadge.textContent = stats.finalsCount;
		if (tabExamsBadge) tabExamsBadge.textContent = stats.examsCount;

		resetExamForm();
		resetSubjectFinalForm();
		renderSubjectFinalsList(sem);

		if (examsListContainer) {
			examsListContainer.innerHTML = "";
			const semExams = Array.isArray(sem.exams) ? [...sem.exams] : [];
			if (!semExams.length) {
				examsListContainer.innerHTML = `
					<div class="text-center py-8 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
						<p class="text-slate-500 dark:text-slate-400 text-sm">No exams scheduled for this semester yet.</p>
						<p class="text-xs text-slate-400 mt-1">Use the form above to add exam dates, papers, and marks!</p>
					</div>
				`;
				return;
			}

			semExams.sort((a, b) => new Date(a.date) - new Date(b.date));

			semExams.forEach((exam) => {
				const row = document.createElement("div");
				row.className = "exam-item-row flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/80 dark:border-slate-700/60 gap-3";

				const examDate = new Date(exam.date);
				const formattedDate = !isNaN(examDate.getTime())
					? examDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
					: exam.date;
				const formattedTime = !isNaN(examDate.getTime())
					? examDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
					: "";

				const grade = calculateGrade(exam.mark, exam.maxMark);
				const displayGrade = exam.letterGrade || (grade ? grade.grade : "");
				const pillClass = exam.letterGrade ? getGradePillClass(exam.letterGrade) : (grade ? grade.pillClass : "grade-pill-none");
				let scoreHtml = "";

				if (grade) {
					scoreHtml = `
						<div class="flex items-center gap-2">
							<span class="font-mono font-bold text-sm text-slate-800 dark:text-slate-100">${exam.mark} / ${exam.maxMark || 100}</span>
							<span class="grade-pill ${pillClass}">${grade.percentage}% (${displayGrade})</span>
						</div>
					`;
				} else if (exam.letterGrade) {
					scoreHtml = `
						<span class="grade-pill ${pillClass}">Grade ${exam.letterGrade}</span>
					`;
				} else {
					scoreHtml = `
						<button class="log-mark-quick-btn text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-600 dark:text-slate-200 transition" data-id="${exam.id}">
							+ Log Mark
						</button>
					`;
				}

				row.innerHTML = `
					<div class="flex items-center gap-3 min-w-0">
						<div class="w-2.5 h-10 rounded-full flex-shrink-0" style="background-color: ${getColorForSubject(exam.subject)};"></div>
						<div class="min-w-0">
							<div class="flex items-center gap-2">
								<span class="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">${exam.subject}</span>
								${exam.paper ? `<span class="text-xs px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium">${exam.paper}</span>` : ""}
							</div>
							<p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
								<span>${formattedDate}</span>
								${formattedTime ? `<span>• ${formattedTime}</span>` : ""}
								${exam.notes ? `<span>• <i>${exam.notes}</i></span>` : ""}
							</p>
						</div>
					</div>

					<div class="flex items-center justify-end gap-3 flex-shrink-0">
						${scoreHtml}
						<div class="flex items-center gap-1">
							<button class="edit-exam-btn p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition" title="Edit Exam" data-id="${exam.id}">
								<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
							</button>
							<button class="delete-exam-btn p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition" title="Delete Exam" data-id="${exam.id}">
								<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
							</button>
						</div>
					</div>
				`;

				examsListContainer.appendChild(row);
			});
		}
	}

	function renderSemesterSection() {
		if (!semesterHubSection) return;

		const activeSem = getActiveSemester();
		const viewedSem = getViewingSemester();
		const currentSem = viewedSem || activeSem;

		if (quickSemesterSelect) {
			quickSemesterSelect.innerHTML = "";
			semesters.forEach((sem) => {
				const opt = document.createElement("option");
				opt.value = sem.id;
				opt.textContent = `${sem.name}${sem.id === activeSemesterId ? " (Active)" : ""}`;
				if (sem.id === (viewingSemesterId || activeSemesterId)) opt.selected = true;
				quickSemesterSelect.appendChild(opt);
			});
		}

		if (chartSemesterFilter) {
			chartSemesterFilter.innerHTML = "";
			const allOpt = document.createElement("option");
			allOpt.value = "all";
			allOpt.textContent = "All Semesters Combined";
			if (viewingSemesterId === "all") allOpt.selected = true;
			chartSemesterFilter.appendChild(allOpt);

			semesters.forEach((sem) => {
				const opt = document.createElement("option");
				opt.value = sem.id;
				opt.textContent = `${sem.name}${sem.id === activeSemesterId ? " (Active)" : ""}`;
				if (sem.id === viewingSemesterId) opt.selected = true;
				chartSemesterFilter.appendChild(opt);
			});
		}

		if (currentSem) {
			const stats = getSemesterStats(currentSem);
			if (metricSemStudyTime) {
				metricSemStudyTime.textContent = formatLogTime(stats.totalSeconds);
			}
			if (metricSemExams) {
				metricSemExams.textContent = `${stats.finalsCount} Finals • ${stats.examsCount} Exams`;
			}
			if (metricSemAvg) {
				if (stats.avgPercentage !== null) {
					metricSemAvg.textContent = `${stats.avgPercentage}%`;
					if (metricSemGradeBadge && stats.gradeObj) {
						metricSemGradeBadge.className = `grade-pill ${stats.gradeObj.pillClass}`;
						metricSemGradeBadge.textContent = stats.gradeObj.grade;
						metricSemGradeBadge.classList.remove("hidden");
					}
					if (metricSemAvgSource) {
						metricSemAvgSource.textContent = stats.isFromFinals ? "Finals Avg" : "Exams Avg";
					}
				} else {
					metricSemAvg.textContent = "No marks yet";
					if (metricSemGradeBadge) metricSemGradeBadge.classList.add("hidden");
					if (metricSemAvgSource) metricSemAvgSource.textContent = "";
				}
			}
			if (metricSemGpa) {
				if (stats.semesterGpa !== null) {
					metricSemGpa.textContent = stats.semesterGpa;
					if (metricSemGpaBadge) {
						metricSemGpaBadge.textContent = `GPA ${stats.semesterGpa}`;
						metricSemGpaBadge.classList.remove("hidden");
					}
				} else {
					metricSemGpa.textContent = "--";
					if (metricSemGpaBadge) metricSemGpaBadge.classList.add("hidden");
				}
			}
			if (metricSemDates) {
				const start = currentSem.startDate ? new Date(currentSem.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
				const end = currentSem.endDate ? new Date(currentSem.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
				if (start && end) {
					metricSemDates.textContent = `${start} - ${end}`;
				} else if (start) {
					metricSemDates.textContent = `From ${start}`;
				} else {
					metricSemDates.textContent = "Ongoing";
				}
			}
		}

		if (semesterCountText) {
			semesterCountText.textContent = `${semesters.length} Semester${semesters.length === 1 ? "" : "s"}`;
		}

		if (semestersGrid) {
			semestersGrid.innerHTML = "";
			if (!semesters.length) {
				semestersGrid.innerHTML = `
					<div class="col-span-full text-center py-8 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600">
						<p class="text-slate-500 dark:text-slate-400 font-medium">No semesters added yet.</p>
						<button id="empty-add-sem-btn" class="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl">Create Semester</button>
					</div>
				`;
				const emptyBtn = document.getElementById("empty-add-sem-btn");
				if (emptyBtn) emptyBtn.addEventListener("click", () => openSemesterModal());
				return;
			}

			semesters.forEach((sem) => {
				const isActive = (sem.id === activeSemesterId);
				const stats = getSemesterStats(sem);

				const card = document.createElement("div");
				card.className = `semester-card p-5 rounded-2xl bg-white dark:bg-slate-800 border ${
					isActive
						? "border-blue-500 dark:border-blue-400 is-active"
						: "border-slate-200/90 dark:border-slate-700/80"
				} flex flex-col justify-between shadow-sm`;

				const startFmt = sem.startDate ? new Date(sem.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }) : "";
				const endFmt = sem.endDate ? new Date(sem.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }) : "";
				const dateRangeStr = (startFmt && endFmt) ? `${startFmt} – ${endFmt}` : (startFmt ? `From ${startFmt}` : "Dates not set");

				let gradeBadgeHtml = "";
				if (stats.avgPercentage !== null && stats.gradeObj) {
					gradeBadgeHtml = `<span class="grade-pill ${stats.gradeObj.pillClass}">${stats.avgPercentage}% (${stats.gradeObj.grade})</span>`;
				} else {
					gradeBadgeHtml = `<span class="grade-pill grade-pill-none">No Marks</span>`;
				}

				let gpaBadgeHtml = "";
				if (stats.semesterGpa !== null) {
					gpaBadgeHtml = `<span class="gpa-pill">GPA ${stats.semesterGpa}</span>`;
				} else {
					gpaBadgeHtml = `<span class="text-slate-400 dark:text-slate-500 font-mono text-xs">--</span>`;
				}

				card.innerHTML = `
					<div>
						<div class="flex items-start justify-between gap-2 mb-2">
							<div class="min-w-0">
								<div class="flex items-center gap-2">
									<h4 class="font-bold text-base text-slate-900 dark:text-slate-100 truncate">${sem.name}</h4>
								</div>
								<p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${dateRangeStr}</p>
							</div>
							${
								isActive
									? `<span class="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50">
											<span class="pulse-dot"></span> Active
									   </span>`
									: `<button class="set-active-btn flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition" data-id="${sem.id}">Set Active</button>`
							}
						</div>

						${sem.description ? `<p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 my-2 italic">"${sem.description}"</p>` : ""}

						<div class="grid grid-cols-3 gap-2 my-3.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/40 text-xs">
							<div>
								<span class="text-slate-400 block font-medium">Study Hours</span>
								<span class="font-bold text-slate-800 dark:text-slate-200">${formatLogTime(stats.totalSeconds)}</span>
							</div>
							<div>
								<span class="text-slate-400 block font-medium">Avg Grade</span>
								<div class="mt-0.5">${gradeBadgeHtml}</div>
							</div>
							<div>
								<span class="text-slate-400 block font-medium">Semester GPA</span>
								<div class="mt-0.5">${gpaBadgeHtml}</div>
							</div>
						</div>
					</div>

					<div class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/60 gap-1.5">
						<button class="view-exams-btn flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-semibold transition" data-id="${sem.id}">
							<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
							<span>Records (${stats.finalsCount} Finals • ${stats.examsCount} Exams)</span>
						</button>
						<button class="edit-sem-btn p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition" title="Edit Semester" data-id="${sem.id}">
							<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
						</button>
						<button class="delete-sem-btn p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition" title="Delete Semester" data-id="${sem.id}">
							<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
						</button>
					</div>
				`;

				semestersGrid.appendChild(card);
			});
		}

		if (studyTrackerSemesterBadge) {
			studyTrackerSemesterBadge.textContent = activeSem ? activeSem.name : "Active Semester";
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
		const allExams = getAllSemestersExams();
		allExams.forEach((exam) => {
			const d = new Date(exam.date);
			if (isNaN(d.getTime())) return;
			const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
			const timeStr = d.toLocaleTimeString("en-US", {hour: "numeric", minute: "2-digit"});
			if (!events[dateStr]) events[dateStr] = [];
			const eventText = `${timeStr} - ${exam.subject}${exam.paper ? ` (${exam.paper})` : ""}`;
			if (!events[dateStr].includes(eventText)) {
				events[dateStr].push(eventText);
			}
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
		const allExams = getAllSemestersExams();
		const upcomingExams = allExams.filter((e) => new Date(e.date) > new Date()).sort((a, b) => new Date(a.date) - new Date(b.date));
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
                        <p class="font-bold text-slate-800 dark:text-slate-200">${nextExam.subject}${nextExam.paper ? ` (${nextExam.paper})` : ""}</p>
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
                        <p class="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">${exam.subject}${exam.paper ? ` (${exam.paper})` : ""}</p>
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
		// "custom" sort uses the server-side order field — no client sort needed

		// Destroy existing sortable before re-rendering
		if (taskSortableInstance) {
			taskSortableInstance.destroy();
			taskSortableInstance = null;
		}
		subtaskSortableInstances.forEach((instance) => instance.destroy());
		subtaskSortableInstances = [];

		fullTaskListEl.innerHTML = "";
		if (!tasksToRender.length) {
			fullTaskListEl.innerHTML = `<p class="text-slate-400 text-center py-4">No tasks match your filters.</p>`;
			return;
		}
		const isCustomSort = taskSort === "custom";
		tasksToRender.forEach((task) => {
			const el = document.createElement("div");
			el.className = "task-item p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg";
			el.dataset.id = task._id;
			const completedClass = task.completed ? " line-through text-slate-400 dark:text-slate-500" : "";
			const isExpanded = isTaskExpanded(task._id);
			let subtasksHtml = `<div class="subtask-list pl-2 mt-2 space-y-1" data-task-id="${task._id}" ${isCustomSort ? 'aria-label="Sub-tasks. Drag or use move buttons to reorder."' : ""}>`;
			let progressBarHtml = "";
			if (task.subTasks && task.subTasks.length > 0) {
				const completedCount = task.subTasks.filter((st) => st.completed).length;
				const totalCount = task.subTasks.length;
				const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
				progressBarHtml = `
                    <div class="mt-2 flex items-center gap-2">
						<button type="button" class="task-collapse-btn flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" aria-expanded="${isExpanded}" aria-label="${isExpanded ? "Collapse sub-tasks" : "Expand sub-tasks"}" title="${isExpanded ? "Collapse sub-tasks" : "Expand sub-tasks"}">
							<i class="${isExpanded ? "icon-angle-up" : "icon-angle-down"}"></i>
						</button>
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
                            <div class="flex items-center flex-grow min-w-0">
								${isCustomSort ? `<button type="button" class="subtask-drag-handle mr-2 flex-shrink-0 cursor-grab text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors" title="Drag to reorder sub-task" aria-label="Drag to reorder sub-task"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg></button>` : ""}
                                <input type="checkbox" ${st.completed ? "checked" : ""} class="subtask-checkbox h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer">
                                <span class="subtask-text-view ml-2 text-sm cursor-pointer ${subCompletedClass}">${st.text}</span>
                            </div>
							<div class="flex items-center">
								${isCustomSort ? `
									<button type="button" class="move-subtask-up-btn text-slate-400 hover:text-blue-500 mr-1" aria-label="Move sub-task up" title="Move sub-task up">↑</button>
									<button type="button" class="move-subtask-down-btn text-slate-400 hover:text-blue-500 mr-1" aria-label="Move sub-task down" title="Move sub-task down">↓</button>
								` : ""}
                            	<button class="delete-subtask-btn text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100">
                                	<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            	</button>
							</div>
                        </div>
                    `;
				});
			}
			subtasksHtml += "</div>";

			el.innerHTML = `
                <div class="flex items-start justify-between group">
                    ${isCustomSort ? `<button type="button" class="task-drag-handle self-start mt-0.5 mr-2 flex-shrink-0 cursor-grab text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors" title="Drag to reorder task" aria-label="Drag to reorder task"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg></button>` : ""}
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
						${isCustomSort ? `
							<button type="button" class="move-task-up-btn text-slate-400 hover:text-blue-500 ml-1" aria-label="Move task up" title="Move task up">↑</button>
							<button type="button" class="move-task-down-btn text-slate-400 hover:text-blue-500 ml-1" aria-label="Move task down" title="Move task down">↓</button>
						` : ""}
                    </div>
                </div>
                ${progressBarHtml}
				<div class="subtask-panel overflow-hidden ${isExpanded ? "expanded" : ""}" data-task-id="${task._id}">
                	${subtasksHtml}
                	<div class="mt-2 pl-2 flex items-center gap-2">
                    	<input type="text" id="subtask-input-${task._id}" class="w-full text-sm p-1 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700" placeholder="Add sub-task...">
                    	<button class="add-subtask-btn text-xs bg-blue-500 text-white rounded px-2 py-1" data-task-id="${task._id}">Add</button>
                	</div>
                </div>
            `;
			fullTaskListEl.appendChild(el);
		});

		applySubtaskPanelHeights();

		// Initialize Sortable only in custom order mode
		if (isCustomSort) {
			taskSortableInstance = new Sortable(fullTaskListEl, {
				animation: 150,
				handle: ".task-drag-handle",
				delayOnTouchOnly: true,
				delay: 120,
				touchStartThreshold: 5,
				ghostClass: "sortable-ghost",
				dragClass: "sortable-drag",
				onEnd: (evt) => {
					// Reorder the local tasks array to match the new DOM order
					const newOrderedIds = [...evt.to.children].map((el) => el.dataset.id);
					const taskMap = new Map(tasks.map((t) => [t._id, t]));
					// Rebuild tasks array in new order (preserving any tasks not visible due to filters)
					const reorderedVisible = newOrderedIds.map((id) => taskMap.get(id)).filter(Boolean);
					const hiddenTasks = tasks.filter((t) => !newOrderedIds.includes(t._id));
					tasks = [...reorderedVisible, ...hiddenTasks];
					saveTaskOrder(newOrderedIds);
				},
			});

			document.querySelectorAll(".subtask-list").forEach((subtaskListEl) => {
				const taskId = subtaskListEl.dataset.taskId;
				const subtaskSortable = new Sortable(subtaskListEl, {
					animation: 150,
					handle: ".subtask-drag-handle",
					delayOnTouchOnly: true,
					delay: 120,
					touchStartThreshold: 5,
					ghostClass: "sortable-ghost",
					dragClass: "sortable-drag",
					onEnd: (evt) => {
						const subtaskIds = [...evt.to.children].map((el) => el.dataset.id);
						const task = tasks.find((t) => t._id === taskId);
						if (!task || !Array.isArray(task.subTasks)) return;
						const subtaskMap = new Map(task.subTasks.map((st) => [st._id, st]));
						task.subTasks = subtaskIds.map((id) => subtaskMap.get(id)).filter(Boolean);
						saveSubTaskOrder(taskId, subtaskIds);
					},
				});
				subtaskSortableInstances.push(subtaskSortable);
			});
		}
	}

	function applySubtaskPanelHeights() {
		document.querySelectorAll(".subtask-panel").forEach((panelEl) => {
			const taskId = panelEl.dataset.taskId;
			const expanded = isTaskExpanded(taskId);
			if (expanded) {
				panelEl.style.maxHeight = "0px";
				requestAnimationFrame(() => {
					panelEl.style.maxHeight = `${panelEl.scrollHeight}px`;
				});
			} else {
				panelEl.style.maxHeight = `${panelEl.scrollHeight}px`;
				requestAnimationFrame(() => {
					panelEl.style.maxHeight = "0px";
				});
			}
		});
	}

	function moveTaskByOffset(taskId, offset) {
		if (taskSort !== "custom") return;
		const currentIndex = tasks.findIndex((task) => task._id === taskId);
		const targetIndex = currentIndex + offset;
		if (currentIndex < 0 || targetIndex < 0 || targetIndex >= tasks.length) return;
		const [movedTask] = tasks.splice(currentIndex, 1);
		tasks.splice(targetIndex, 0, movedTask);
		renderTasksPage();
		saveTaskOrder(tasks.map((task) => task._id));
	}

	function moveSubTaskByOffset(taskId, subtaskId, offset) {
		if (taskSort !== "custom") return;
		const task = tasks.find((t) => t._id === taskId);
		if (!task || !Array.isArray(task.subTasks)) return;
		const currentIndex = task.subTasks.findIndex((subtask) => subtask._id === subtaskId);
		const targetIndex = currentIndex + offset;
		if (currentIndex < 0 || targetIndex < 0 || targetIndex >= task.subTasks.length) return;
		const [movedSubTask] = task.subTasks.splice(currentIndex, 1);
		task.subTasks.splice(targetIndex, 0, movedSubTask);
		renderTasksPage();
		saveSubTaskOrder(taskId, task.subTasks.map((subtask) => subtask._id));
	}

	function renderStudyLogs() {
		studyLogContainer.innerHTML = "";
		const activeSem = getActiveSemester();
		if (studyTrackerSemesterBadge) {
			studyTrackerSemesterBadge.textContent = activeSem ? activeSem.name : "Active Semester";
		}
		const logsToRender = activeSem && activeSem.studyLogs ? activeSem.studyLogs : studyLogs;
		if (!Object.keys(logsToRender).length) {
			studyLogContainer.innerHTML = `<p class="text-slate-400 text-center py-2">No sessions logged in this semester.</p>`;
			return;
		}
		const sortedStudyEntries = Object.entries(logsToRender).sort((a, b) => b[1] - a[1]);
		for (const [subject, seconds] of sortedStudyEntries) {
			const el = document.createElement("div");
			el.className = "flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-700/50 rounded-md text-sm";
			el.innerHTML = `<div class="flex items-center"><span class="w-2.5 h-2.5 rounded-full mr-2" style="background-color:${getColorForSubject(subject)};"></span><span class="font-medium text-slate-700 dark:text-slate-200">${subject}</span></div><span class="font-semibold text-slate-600 dark:text-slate-300">${formatLogTime(seconds || 0)}</span>`;
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
		// if (ytPlayer && typeof ytPlayer.stopVideo === "function") {
		// 	ytPlayer.stopVideo();
		// 	youtubePlayerContainer.classList.add("hidden");
		// 	currentPlayingSoundId = null;
		// 	renderSoundLibrary();
		// }
	}

	function playPauseTimer() {
		isPaused = !isPaused;
		playPauseBtn.textContent = isPaused ? "Resume" : "Pause";
		if (isPaused) {
			clearInterval(timerInterval);
			saveStudyLogs();
			// Sync any leftover progress when pausing
			if (window.collectiblesModule) {
				window.collectiblesModule.saveCollectibleState();
			}
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

					// Log to active semester
					const activeSem = getActiveSemester();
					if (activeSem) {
						if (!activeSem.studyLogs) activeSem.studyLogs = {};
						activeSem.studyLogs[subject] = (activeSem.studyLogs[subject] || 0) + 1;
					}

					// Call the collectibles module every second to update progress
					if (window.collectiblesModule) {
						window.collectiblesModule.tickProgress();
					}
					renderStudyLogs();
				}
				updateTimerDisplay();
				if (timeLeft <= 0) {
					playNotificationSound();
					if (currentMode === "focus") {
						saveStudyLogs();
						if (window.collectiblesModule) {
							window.collectiblesModule.saveCollectibleState();
						}
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

		// Optimistic UI update — snapshot original for rollback
		const taskIndex = tasks.findIndex((t) => t._id === taskIdToSave);
		let originalTask = null;
		if (taskIndex > -1) {
			originalTask = {...tasks[taskIndex], subTasks: [...(tasks[taskIndex].subTasks || [])]};
			tasks[taskIndex] = {...tasks[taskIndex], ...updates, subTasks: originalTask.subTasks};
			renderTasksPage();
		}

		closeEditModal();

		try {
			const response = await fetch(`${API_URL}/api/study/tasks/${taskIdToSave}`, {
				method: "PUT",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify(updates),
			});
			if (!response.ok) throw new Error("Server error");
			// Success — local state is already correct, no reload needed
		} catch (error) {
			console.error("Failed to save task changes:", error);
			// Rollback the optimistic update
			if (taskIndex > -1 && originalTask) {
				tasks[taskIndex] = originalTask;
				renderTasksPage();
			}
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

	async function saveFlashcardSet(id, name, subject, flashcards = null) {
		const isEditing = !!id;
		closeSetModal();

		const updateData = {name, subject, userId: currentUser.id};
		if (flashcards !== null) {
			updateData.flashcards = flashcards; // Add flashcards array if it's provided
		}

		if (isEditing) {
			const setIndex = flashcardSets.findIndex((s) => s._id === id);
			if (setIndex === -1) return;

			const originalSet = {...flashcardSets[setIndex]};
			flashcardSets[setIndex] = {...originalSet, ...updateData};
			renderFlashcardSets();

			try {
				const response = await fetch(`${API_URL}/api/study/flashcard-sets/${id}`, {
					method: "PUT",
					headers: {"Content-Type": "application/json"},
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
			const newSet = {_id: tempId, name, subject, flashcards: flashcards || [], userId: currentUser.id};
			flashcardSets.push(newSet);
			renderFlashcardSets();

			try {
				const response = await fetch(`${API_URL}/api/study/flashcard-sets`, {
					method: "POST",
					headers: {"Content-Type": "application/json"},
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
			const response = await fetch(`${API_URL}/api/study/flashcard-sets/${setId}`, {method: "DELETE"});
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

			const originalCard = {...set.flashcards[cardIndex]};
			set.flashcards[cardIndex] = {...originalCard, front, back};
			renderSingleSetView(set);

			try {
				const response = await fetch(`${API_URL}/api/study/flashcard-sets/${setId}/cards/${cardId}`, {
					method: "PUT",
					headers: {"Content-Type": "application/json"},
					body: JSON.stringify({front, back}),
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
			const newCard = {_id: tempId, front, back};
			set.flashcards.push(newCard);
			renderSingleSetView(set);

			try {
				const response = await fetch(`${API_URL}/api/study/flashcard-sets/${setId}/cards`, {
					method: "POST",
					headers: {"Content-Type": "application/json"},
					body: JSON.stringify({front, back}),
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
			const response = await fetch(`${API_URL}/api/study/flashcard-sets/${setId}/cards/${cardId}`, {method: "DELETE"});
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
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({orderedIds}),
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
					return {front: parts[0].trim(), back: parts[1].trim()};
				}
				return null;
			})
			.filter(Boolean); // Filter out any null entries from invalid blocks

		return {name, subject, flashcards};
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

	// --- App Start ---
	checkAuthAndInitialize();
});