// ==========================================
// TIMER, STUDY LOGS, STREAKS & PICTURE-IN-PICTURE
// ==========================================

window.StudyApp = window.StudyApp || {};

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
					backgroundColor: labels.map((l) => (typeof getColorForSubject === "function" ? getColorForSubject(l) : (subjectColors[l] || "#00B4D8"))),
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


// --- Study Log Management (DB) ---
async function loadStudyLogs(startupState = {}) {
	if (!currentUser) return;
	if (Object.prototype.hasOwnProperty.call(startupState, "studyLogs")) {
		const logsFromServer = startupState.studyLogs;
		studyLogs = Array.isArray(logsFromServer) ? Object.fromEntries(logsFromServer) : logsFromServer || {};
		renderStudyLogs();
		return;
	}
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
			headers: { "Content-Type": "application/json" },
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


// --- Streak Management (DB) ---
async function loadStreak(startupState = {}) {
	if (!currentUser) return;
	if (Object.prototype.hasOwnProperty.call(startupState, "studyStreak") && Object.prototype.hasOwnProperty.call(startupState, "lastStudyDay")) {
		studyStreak = Number(startupState.studyStreak) || 0;
		lastStudyDay = startupState.lastStudyDay || "";
		return;
	}
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
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId: currentUser.id, studyStreak, lastStudyDay }),
		});
		renderDashboard();
	} catch (error) {
		console.error("Failed to save streak:", error);
	}
}


// --- Study Session History Management (DB) ---
async function loadStudySessions() {
	if (!currentUser) return;
	try {
		const response = await fetch(`${API_URL}/api/study/sessions?userId=${currentUser.id}`);
		if (response.ok) {
			const data = await response.json();
			studySessions = Array.isArray(data.sessions) ? data.sessions : [];
			localStorage.setItem(`studySessions_${currentUser.id}`, JSON.stringify(studySessions));
		} else {
			const cached = localStorage.getItem(`studySessions_${currentUser.id}`);
			if (cached) studySessions = JSON.parse(cached);
		}
	} catch (error) {
		console.warn("Failed to fetch study sessions, falling back to local cache:", error);
		const cached = localStorage.getItem(`studySessions_${currentUser.id}`);
		if (cached) studySessions = JSON.parse(cached);
	}
	if (studyHistoryModal && !studyHistoryModal.classList.contains("hidden")) {
		renderStudyHistoryModalContent();
	}
}

async function saveStudySession(session) {
	if (!currentUser || !session) return;
	studySessions.unshift(session);
	localStorage.setItem(`studySessions_${currentUser.id}`, JSON.stringify(studySessions));
	if (studyHistoryModal && !studyHistoryModal.classList.contains("hidden")) {
		renderStudyHistoryModalContent();
	}
	try {
		await fetch(`${API_URL}/api/study/sessions`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId: currentUser.id, session })
		});
	} catch (error) {
		console.error("Failed to sync study session with server:", error);
	}
}

async function deleteStudySession(sessionId) {
	if (!currentUser || !sessionId) return;
	studySessions = studySessions.filter((s) => s.id !== sessionId);
	localStorage.setItem(`studySessions_${currentUser.id}`, JSON.stringify(studySessions));
	renderStudyHistoryModalContent();
	try {
		await fetch(`${API_URL}/api/study/sessions/${sessionId}?userId=${currentUser.id}`, {
			method: "DELETE"
		});
	} catch (error) {
		console.error("Failed to delete study session on server:", error);
	}
}

function finalizeActiveSession() {
	if (!activeSessionStartTime || activeSessionAccumulatedSeconds <= 0) {
		if (typeof stopSharedStudyActivity === "function") stopSharedStudyActivity();
		activeSessionStartTime = null;
		activeSessionAccumulatedSeconds = 0;
		return;
	}

	const subject = (pomodoroSubjectSelect && pomodoroSubjectSelect.value) ? pomodoroSubjectSelect.value : "General";
	const now = new Date();
	const activeSem = getActiveSemester();

	let displayText = `Focused on ${subject}`;
	let itemType = "none";
	let itemId = "";
	let subId = "";
	let title = "";
	let parentTitle = "";

	if (currentLinkedItem) {
		itemType = currentLinkedItem.type || "none";
		itemId = currentLinkedItem.id || "";
		subId = currentLinkedItem.subId || "";
		title = currentLinkedItem.title || "";
		parentTitle = currentLinkedItem.parentTitle || "";
		displayText = currentLinkedItem.displayText || displayText;
	}

	const sessionRecord = {
		id: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
		startTime: activeSessionStartTime,
		endTime: now.toISOString(),
		durationSeconds: activeSessionAccumulatedSeconds,
		subject,
		mode: timerEngine || "pomodoro",
		semesterId: activeSem ? activeSem.id : "",
		linkedItem: {
			itemType,
			itemId,
			subId,
			title,
			parentTitle,
			displayText
		},
		createdAt: now.toISOString()
	};

	saveStudySession(sessionRecord);
	if (typeof stopSharedStudyActivity === "function") stopSharedStudyActivity();
	activeSessionStartTime = null;
	activeSessionAccumulatedSeconds = 0;
}


function renderStudyLogs() {
	studyLogContainer.innerHTML = "";
	const activeSem = getActiveSemester();
	if (studyTrackerSemesterBadge) {
		studyTrackerSemesterBadge.textContent = activeSem ? activeSem.name : "Active Semester";
	}
	const logsToRender = activeSem && activeSem.studyLogs ? activeSem.studyLogs : studyLogs;
	if (typeof hasCustomSubjects === "function" && hasCustomSubjects()) {
		const userSubjectEntries = syllabus.map((sub) => {
			const seconds = (logsToRender && logsToRender[sub.name]) ? Number(logsToRender[sub.name]) || 0 : 0;
			return { subject: sub.name, seconds, isCustom: true };
		});
		userSubjectEntries.sort((a, b) => {
			if (b.seconds !== a.seconds) return b.seconds - a.seconds;
			return 0;
		});

		const userSubjectNamesLower = new Set(syllabus.map((s) => s.name.toLowerCase()));
		const otherEntries = [];
		if (typeof logsToRender === "object" && logsToRender !== null) {
			for (const [k, v] of Object.entries(logsToRender)) {
				if (!userSubjectNamesLower.has(k.toLowerCase()) && Number(v) > 0) {
					otherEntries.push({ subject: k, seconds: Number(v), isCustom: false });
				}
			}
		}
		otherEntries.sort((a, b) => b.seconds - a.seconds);
		const allEntriesToRender = [...userSubjectEntries, ...otherEntries];

		if (allEntriesToRender.length === 0) {
			studyLogContainer.innerHTML = `<p class="text-slate-400 text-center py-2 text-xs">No subjects added yet.</p>`;
			return;
		}

		allEntriesToRender.forEach(({ subject, seconds, isCustom }) => {
			const el = document.createElement("div");
			el.className = "flex items-center justify-between p-2 bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-700/50 dark:hover:bg-slate-700/80 rounded-lg text-sm cursor-pointer transition";
			el.title = "Click to view session history & select subject";
			el.innerHTML = `
					<div class="flex items-center min-w-0 pr-2">
						<span class="w-2.5 h-2.5 rounded-full mr-2 shrink-0" style="background-color:${getColorForSubject(subject)};"></span>
						<span class="font-medium text-slate-700 dark:text-slate-200 truncate">${escapeHtml(subject)}</span>
						${!isCustom ? '<span class="ml-1.5 text-[10px] px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400 shrink-0">Past</span>' : ''}
					</div>
					<span class="font-semibold text-xs text-slate-600 dark:text-slate-300 shrink-0">${formatLogTime(seconds || 0)}</span>
				`;
			el.addEventListener("click", () => {
				if (pomodoroSubjectSelect) {
					pomodoroSubjectSelect.value = subject;
				}
				openStudyHistoryModal(subject);
			});
			studyLogContainer.appendChild(el);
		});
		return;
	}

	if (!Object.keys(logsToRender).length) {
		studyLogContainer.innerHTML = `<p class="text-slate-400 text-center py-2">No sessions logged in this semester.</p>`;
		return;
	}
	const sortedStudyEntries = Object.entries(logsToRender).sort((a, b) => b[1] - a[1]);
	for (const [subject, seconds] of sortedStudyEntries) {
		const el = document.createElement("div");
		el.className = "flex items-center justify-between p-2 bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-700/50 dark:hover:bg-slate-700/80 rounded-md text-sm cursor-pointer transition";
		el.title = "Click to view session history & select subject";
		el.innerHTML = `<div class="flex items-center"><span class="w-2.5 h-2.5 rounded-full mr-2" style="background-color:${getColorForSubject(subject)};"></span><span class="font-medium text-slate-700 dark:text-slate-200">${subject}</span></div><span class="font-semibold text-slate-600 dark:text-slate-300">${formatLogTime(seconds || 0)}</span>`;
		el.addEventListener("click", () => {
			if (pomodoroSubjectSelect) {
				pomodoroSubjectSelect.value = subject;
			}
			openStudyHistoryModal(subject);
		});
		studyLogContainer.appendChild(el);
	}
}

function updateTimerDisplay() {
	if (timerEngine === "stopwatch") {
		timerDisplay.textContent = formatTime(stopwatchSeconds);
	} else {
		timerDisplay.textContent = formatTime(timeLeft);
	}
	updatePiPTimer();
}

function playNotificationSound() {
	try {
		const a = new (window.AudioContext || window.webkitAudioContext)();
		const o = a.createOscillator();
		o.type = "sine";
		o.frequency.setValueAtTime(600, a.currentTime);
		o.connect(a.destination);
		o.start();
		setTimeout(() => o.stop(), 200);
	} catch (e) {
		console.warn("Audio playback not allowed:", e);
	}
}

function switchMode(mode) {
	clearInterval(timerInterval);
	timerInterval = null;
	isPaused = true;
	currentMode = mode;
	if (modeIndicator) modeIndicator.textContent = mode.toUpperCase();
	if (playPauseBtn) playPauseBtn.textContent = "Start";
	timeLeft = (mode === "focus" ? (focusDurationInput ? focusDurationInput.value : 25) : (breakDurationInput ? breakDurationInput.value : 5)) * 60;
	updateTimerDisplay();
	closePiPTimer();
}

function setTimerEngine(engine) {
	if (timerEngine === engine) return;

	// Cleanly pause and finalize current session if running
	if (!isPaused) {
		if (timerEngine === "stopwatch") accrueStopwatchTime();
		clearInterval(timerInterval);
		timerInterval = null;
		stopwatchLastUpdateAt = null;
		isPaused = true;
		saveStudyLogs();
		finalizeActiveSession();
		closePiPTimer();
	} else {
		finalizeActiveSession();
	}

	timerEngine = engine;

	if (timerEngine === "pomodoro") {
		if (timerModePomodoroBtn) {
			timerModePomodoroBtn.className = "flex-1 py-1.5 px-3 text-xs font-semibold rounded-md bg-blue-600 text-white transition";
		}
		if (timerModeStopwatchBtn) {
			timerModeStopwatchBtn.className = "flex-1 py-1.5 px-3 text-xs font-semibold rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition";
		}
		if (pomodoroDurationsContainer) pomodoroDurationsContainer.classList.remove("hidden");
		if (skipBtn) skipBtn.classList.remove("hidden");
		if (stopStopwatchBtn) stopStopwatchBtn.classList.add("hidden");
		if (playPauseBtn) playPauseBtn.textContent = "Start";
		switchMode(currentMode || "focus");
	} else {
		if (timerModePomodoroBtn) {
			timerModePomodoroBtn.className = "flex-1 py-1.5 px-3 text-xs font-semibold rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition";
		}
		if (timerModeStopwatchBtn) {
			timerModeStopwatchBtn.className = "flex-1 py-1.5 px-3 text-xs font-semibold rounded-md bg-blue-600 text-white transition";
		}
		if (pomodoroDurationsContainer) pomodoroDurationsContainer.classList.add("hidden");
		if (skipBtn) skipBtn.classList.add("hidden");
		if (stopStopwatchBtn) stopStopwatchBtn.classList.remove("hidden");
		if (modeIndicator) modeIndicator.textContent = "STOPWATCH";
		if (playPauseBtn) playPauseBtn.textContent = "Start";
		updateTimerDisplay();
	}
}

function resetStopwatch() {
	if (!isPaused) {
		if (timerEngine === "stopwatch") accrueStopwatchTime();
		clearInterval(timerInterval);
		timerInterval = null;
		isPaused = true;
	}
	stopwatchLastUpdateAt = null;
	finalizeActiveSession();
	saveStudyLogs();
	stopwatchSeconds = 0;
	if (playPauseBtn) playPauseBtn.textContent = "Start";
	updateTimerDisplay();
}

function playPauseTimer() {
	isPaused = !isPaused;
	playPauseBtn.textContent = isPaused ? "Resume" : "Pause";

	if (isPaused) {
		if (timerEngine === "stopwatch") accrueStopwatchTime();
		clearInterval(timerInterval);
		timerInterval = null;
		stopwatchLastUpdateAt = null;
		saveStudyLogs();
		if (window.collectiblesModule) {
			window.collectiblesModule.saveCollectibleState();
		}
		finalizeActiveSession();
		closePiPTimer();
		if (ytPlayer && typeof ytPlayer.pauseVideo === "function" && currentPlayingSoundId) {
			ytPlayer.pauseVideo();
		}
	} else {
		// Resumed / Started
		if (!activeSessionStartTime) {
			activeSessionStartTime = new Date().toISOString();
			activeSessionAccumulatedSeconds = 0;
			if (typeof startSharedStudyActivity === "function") {
				const subject = (pomodoroSubjectSelect && pomodoroSubjectSelect.value) ? pomodoroSubjectSelect.value : "General";
				startSharedStudyActivity(subject, timerEngine);
			}
		}
		if (timerEngine === "stopwatch") stopwatchLastUpdateAt = Date.now();

		if (document.visibilityState === "hidden") {
			handleVisibilityChangeForPiP();
		}
		if (ytPlayer && typeof ytPlayer.playVideo === "function" && currentPlayingSoundId) {
			ytPlayer.playVideo();
		}

		if (timerEngine === "stopwatch") {
			timerInterval = setInterval(accrueStopwatchTime, 1000);
		} else {
			// Pomodoro Mode: ticks down
			timerInterval = setInterval(() => {
				timeLeft--;
				if (currentMode === "focus") {
					activeSessionAccumulatedSeconds++;
					const subject = (pomodoroSubjectSelect && pomodoroSubjectSelect.value) ? pomodoroSubjectSelect.value : "General";
					studyLogs[subject] = (studyLogs[subject] || 0) + 1;

					const activeSem = getActiveSemester();
					if (activeSem) {
						if (!activeSem.studyLogs) activeSem.studyLogs = {};
						activeSem.studyLogs[subject] = (activeSem.studyLogs[subject] || 0) + 1;
					}

					if (window.collectiblesModule) {
						window.collectiblesModule.tickProgress();
					}
					renderStudyLogs();
				}
				updateTimerDisplay();
				if (timeLeft <= 0) {
					playNotificationSound();
					if (currentMode === "focus") {
						finalizeActiveSession();
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
}

function accrueStopwatchTime() {
	if (stopwatchLastUpdateAt === null) return;

	const now = Date.now();
	const elapsedSeconds = Math.floor((now - stopwatchLastUpdateAt) / 1000);
	if (elapsedSeconds <= 0) return;
	stopwatchLastUpdateAt += elapsedSeconds * 1000;
	stopwatchSeconds += elapsedSeconds;
	activeSessionAccumulatedSeconds += elapsedSeconds;

	const subject = (pomodoroSubjectSelect && pomodoroSubjectSelect.value) ? pomodoroSubjectSelect.value : "General";
	studyLogs[subject] = (studyLogs[subject] || 0) + elapsedSeconds;

	const activeSem = getActiveSemester();
	if (activeSem) {
		if (!activeSem.studyLogs) activeSem.studyLogs = {};
		activeSem.studyLogs[subject] = (activeSem.studyLogs[subject] || 0) + elapsedSeconds;
	}

	if (window.collectiblesModule) {
		window.collectiblesModule.tickProgress(elapsedSeconds);
	}
	renderStudyLogs();
	updateTimerDisplay();
}

function handleVisibilityChangeForPiP() {
	const timerIsActive = timerInterval && !isPaused;
	if (timerIsActive && timerEngine === "stopwatch") accrueStopwatchTime();
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

	pipContext.fillStyle = bgColor;
	pipContext.fillRect(0, 0, pipCanvas.width, pipCanvas.height);

	let modeText = "Focus";
	let timeText = formatTime(timeLeft);

	if (timerEngine === "stopwatch") {
		modeText = "Stopwatch";
		timeText = formatTime(stopwatchSeconds);
	} else {
		modeText = currentMode ? (currentMode.charAt(0).toUpperCase() + currentMode.slice(1)) : "Focus";
		timeText = formatTime(timeLeft);
	}

	pipContext.fillStyle = modeColor;
	pipContext.font = "24px 'Inter', sans-serif";
	pipContext.textAlign = "center";
	pipContext.fillText(modeText, pipCanvas.width / 2, 60);

	pipContext.fillStyle = textColor;
	pipContext.font = "bold 70px 'Inter', sans-serif";
	pipContext.fillText(timeText, pipCanvas.width / 2, 140);
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


// --- Ergonomic Custom Activity Linking Logic ---
let linkActivityTypeFilter = "all";
let linkActivitySubjectFilterVal = "all";
let linkActivitySortMode = "curriculum";
let linkActivitySearchQuery = "";
let expandedChapterIds = new Set();
let pendingLinkedSubject = null;

function getAllLinkableActivities() {
	const items = [];

	// 1. Syllabus Chapters & Subchapters (from in-memory state)
	const userSubjects = Array.isArray(syllabus) ? syllabus : [];
	userSubjects.forEach((sub, subIdx) => {
		const subName = sub.name || "Subject";
		const chapters = Array.isArray(sub.chapters) ? sub.chapters : [];
		chapters.forEach((ch, chIdx) => {
			const subchapters = Array.isArray(ch.subchapters) ? ch.subchapters : [];
			const scItems = subchapters.map((sc, scIdx) => ({
				id: sc.id,
				chapterId: ch.id,
				type: "subchapter",
				title: sc.name,
				parentTitle: ch.name,
				subject: subName,
				displayText: `Focused on ${ch.name} & ${sc.name} for ${subName}`,
				subIdx,
				chIdx,
				scIdx,
				sortName: `${subName} ${ch.name} ${sc.name}`.toLowerCase()
			}));

			items.push({
				id: ch.id,
				type: "chapter",
				title: ch.name,
				parentTitle: "",
				subject: subName,
				displayText: `Focused on ${ch.name} for ${subName}`,
				subIdx,
				chIdx,
				scIdx: -1,
				hasSubchapters: scItems.length > 0,
				subchapters: scItems,
				sortName: `${subName} ${ch.name}`.toLowerCase()
			});
		});
	});

	// 2. Tasks (Pending active tasks from in-memory state)
	const activeTasks = (Array.isArray(tasks) ? tasks : []).filter((t) => !t.completed);
	activeTasks.forEach((t, tIdx) => {
		items.push({
			id: t._id,
			type: "task",
			title: t.text,
			parentTitle: "",
			subject: t.subject || "General",
			deadline: t.deadline || "",
			displayText: `Focused on ${t.text} for ${t.subject || "General"}`,
			subIdx: 998,
			chIdx: tIdx,
			scIdx: -1,
			sortName: `${t.subject || ""} ${t.text}`.toLowerCase()
		});
	});

	// 3. Exams (from in-memory state)
	const activeSem = typeof getActiveSemester === "function" ? getActiveSemester() : null;
	let allExams = [];
	if (activeSem && Array.isArray(activeSem.exams)) {
		allExams = activeSem.exams;
	} else if (Array.isArray(semesters)) {
		semesters.forEach((s) => {
			if (Array.isArray(s.exams)) allExams = allExams.concat(s.exams);
		});
	}
	allExams.forEach((e, eIdx) => {
		const examTitle = e.paper ? `Exam (${e.paper})` : "Exam";
		items.push({
			id: e.id,
			type: "exam",
			title: examTitle,
			parentTitle: "",
			subject: e.subject || "General",
			displayText: `Studied for ${e.subject || "General"} ${examTitle}`,
			subIdx: 999,
			chIdx: eIdx,
			scIdx: -1,
			sortName: `${e.subject || ""} ${examTitle}`.toLowerCase()
		});
	});

	// 4. Flashcards (from in-memory state)
	const sets = Array.isArray(flashcardSets) ? flashcardSets : [];
	sets.forEach((fs, fsIdx) => {
		items.push({
			id: fs._id,
			type: "flashcard",
			title: fs.name,
			parentTitle: "",
			subject: fs.subject || "General",
			displayText: `Studied flashcards ${fs.name} for ${fs.subject || "General"}`,
			subIdx: 1000,
			chIdx: fsIdx,
			scIdx: -1,
			sortName: `${fs.subject || ""} ${fs.name}`.toLowerCase()
		});
	});

	return items;
}

function populateActivitySubjectFilter() {
	if (!linkActivitySubjectFilter) return;
	const prevVal = linkActivitySubjectFilter.value;
	linkActivitySubjectFilter.innerHTML = '<option value="all">All Subjects</option>';
	const subjects = typeof getUserSubjects === "function" ? getUserSubjects() : Object.keys(subjectColors || {});
	subjects.forEach((s) => {
		linkActivitySubjectFilter.add(new Option(s, s));
	});
	if (prevVal && (prevVal === "all" || subjects.includes(prevVal))) {
		linkActivitySubjectFilter.value = prevVal;
	} else {
		linkActivitySubjectFilter.value = "all";
		linkActivitySubjectFilterVal = "all";
	}
}

function renderLinkActivityDropdown() {
	if (!linkActivityItemsList) return;
	linkActivityItemsList.innerHTML = "";

	const rawItems = getAllLinkableActivities();
	const q = (linkActivitySearchQuery || "").trim().toLowerCase();
	const subjFilter = linkActivitySubjectFilterVal || "all";
	const typeFilter = linkActivityTypeFilter || "all";

	let visibleCount = 0;

	// When typeFilter is "subchapter", show flat list of all subchapters with their parent chapter shown
	if (typeFilter === "subchapter") {
		const flatSubchapters = [];
		rawItems.forEach((it) => {
			if (it.type === "chapter" && it.hasSubchapters) {
				it.subchapters.forEach((sc) => flatSubchapters.push(sc));
			}
		});

		let filtered = flatSubchapters.filter((sc) => {
			if (subjFilter !== "all" && sc.subject.toLowerCase() !== subjFilter.toLowerCase()) return false;
			if (q) {
				const match = sc.title.toLowerCase().includes(q) ||
					sc.subject.toLowerCase().includes(q) ||
					sc.parentTitle.toLowerCase().includes(q);
				if (!match) return false;
			}
			return true;
		});

		if (linkActivitySortMode === "alpha") {
			filtered.sort((a, b) => a.title.localeCompare(b.title));
		} else if (linkActivitySortMode === "curriculum") {
			filtered.sort((a, b) => a.subIdx - b.subIdx || a.chIdx - b.chIdx || a.scIdx - b.scIdx);
		}

		visibleCount = filtered.length;
		if (filtered.length === 0) {
			renderEmptyLinkActivityNotice("No subchapters found matching your search/filters.");
		} else {
			filtered.forEach((sc) => {
				const row = document.createElement("div");
				row.className = "p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 hover:bg-blue-50/70 dark:bg-slate-700/30 dark:hover:bg-slate-700/70 transition cursor-pointer flex items-center justify-between gap-2";
				row.innerHTML = `
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-1.5 mb-0.5">
							<span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">SUBCHAPTER</span>
							<span class="text-[10px] text-slate-500 dark:text-slate-400 truncate">${escapeHtml(sc.subject)}</span>
						</div>
						<div class="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">${escapeHtml(sc.title)}</div>
						<div class="text-[10px] text-slate-500 dark:text-slate-400 truncate">Chapter: ${escapeHtml(sc.parentTitle)}</div>
					</div>
					<button type="button" class="px-2 py-1 text-[11px] font-medium rounded bg-blue-600 hover:bg-blue-700 text-white transition shrink-0">Select</button>
				`;
				row.addEventListener("click", () => selectLinkedActivity(sc));
				linkActivityItemsList.appendChild(row);
			});
		}
	} else {
		// Filter items (chapters with expandable subchapters, tasks, exams, flashcards)
		let filtered = rawItems.filter((item) => {
			if (subjFilter !== "all" && item.subject.toLowerCase() !== subjFilter.toLowerCase()) return false;
			if (typeFilter !== "all" && item.type !== typeFilter) return false;

			if (q) {
				if (item.type === "chapter") {
					const chMatch = item.title.toLowerCase().includes(q) || item.subject.toLowerCase().includes(q);
					const scMatch = item.hasSubchapters && item.subchapters.some((sc) => sc.title.toLowerCase().includes(q));
					if (!chMatch && !scMatch) return false;
					if (scMatch) expandedChapterIds.add(item.id);
				} else {
					const match = item.title.toLowerCase().includes(q) || item.subject.toLowerCase().includes(q);
					if (!match) return false;
				}
			}
			return true;
		});

		if (linkActivitySortMode === "alpha") {
			filtered.sort((a, b) => a.title.localeCompare(b.title));
		} else if (linkActivitySortMode === "type") {
			const typeRank = { chapter: 1, task: 2, exam: 3, flashcard: 4 };
			filtered.sort((a, b) => (typeRank[a.type] || 9) - (typeRank[b.type] || 9) || a.title.localeCompare(b.title));
		} else {
			filtered.sort((a, b) => a.subIdx - b.subIdx || a.chIdx - b.chIdx);
		}

		visibleCount = filtered.length;
		if (filtered.length === 0) {
			renderEmptyLinkActivityNotice("No activities found matching your search/filters.");
		} else {
			filtered.forEach((item) => {
				if (item.type === "chapter") {
					const chCard = document.createElement("div");
					chCard.className = "border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50/50 dark:bg-slate-700/30 transition";

					const isExpanded = expandedChapterIds.has(item.id);
					const subCount = item.hasSubchapters ? item.subchapters.length : 0;

					chCard.innerHTML = `
						<div class="flex items-center justify-between p-2 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition gap-2">
							<div class="chapter-select-target flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer" title="Select chapter: ${escapeHtml(item.title)}">
								<span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 shrink-0">CHAPTER</span>
								<span class="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">${escapeHtml(item.title)}</span>
								<span class="text-[10px] text-slate-500 dark:text-slate-400 shrink-0 truncate">${escapeHtml(item.subject)}</span>
							</div>
							<div class="flex items-center gap-1 shrink-0">
								${subCount > 0 ? `
									<button type="button" class="subchapters-toggle-btn px-2 py-0.5 text-[10px] font-semibold rounded border border-slate-300 dark:border-slate-600 bg-white hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition" title="Show/hide subchapters">
										${subCount} Subchapters ${isExpanded ? "▴" : "▾"}
									</button>
								` : ''}
								<button type="button" class="chapter-quick-select-btn px-2 py-0.5 text-[10px] font-semibold rounded bg-blue-600 hover:bg-blue-700 text-white transition">
									Select
								</button>
							</div>
						</div>
						${subCount > 0 ? `
							<div class="subchapters-container ${isExpanded ? '' : 'hidden'} border-t border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 divide-y divide-slate-100 dark:divide-slate-700/50 pl-4 pr-2 py-1">
								${item.subchapters.map((sc) => `
									<div data-sc-id="${escapeHtml(sc.id)}" class="subchapter-item py-1.5 px-2 hover:bg-blue-50 dark:hover:bg-slate-700/60 rounded cursor-pointer transition flex items-center justify-between gap-2">
										<div class="flex items-center gap-1.5 min-w-0">
											<span class="text-[9px] font-bold px-1 py-0.2 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 shrink-0">SUB</span>
											<span class="text-xs text-slate-700 dark:text-slate-200 truncate">${escapeHtml(sc.title)}</span>
										</div>
										<button type="button" class="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0">Select</button>
									</div>
								`).join("")}
							</div>
						` : ''}
					`;

					const selectTarget = chCard.querySelector(".chapter-select-target");
					const quickSelectBtn = chCard.querySelector(".chapter-quick-select-btn");
					const toggleBtn = chCard.querySelector(".subchapters-toggle-btn");
					const subContainer = chCard.querySelector(".subchapters-container");

					if (selectTarget) selectTarget.addEventListener("click", () => selectLinkedActivity(item));
					if (quickSelectBtn) quickSelectBtn.addEventListener("click", () => selectLinkedActivity(item));

					if (toggleBtn && subContainer) {
						toggleBtn.addEventListener("click", (e) => {
							e.stopPropagation();
							if (expandedChapterIds.has(item.id)) {
								expandedChapterIds.delete(item.id);
								subContainer.classList.add("hidden");
								toggleBtn.textContent = `${subCount} Subchapters ▾`;
							} else {
								expandedChapterIds.add(item.id);
								subContainer.classList.remove("hidden");
								toggleBtn.textContent = `${subCount} Subchapters ▴`;
							}
						});
					}

					if (subContainer) {
						const scRows = subContainer.querySelectorAll(".subchapter-item");
						scRows.forEach((scRow) => {
							const scId = scRow.getAttribute("data-sc-id");
							const targetSc = item.subchapters.find((s) => s.id === scId);
							if (targetSc) {
								scRow.addEventListener("click", (e) => {
									e.stopPropagation();
									selectLinkedActivity(targetSc);
								});
							}
						});
					}

					linkActivityItemsList.appendChild(chCard);
				} else {
					// Task, Exam, Flashcard
					const row = document.createElement("div");
					row.className = "p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 hover:bg-blue-50/70 dark:bg-slate-700/30 dark:hover:bg-slate-700/70 transition cursor-pointer flex items-center justify-between gap-2";

					let badgeText = "TASK";
					let badgeClass = "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
					if (item.type === "exam") {
						badgeText = "EXAM";
						badgeClass = "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300";
					} else if (item.type === "flashcard") {
						badgeText = "FLASHCARDS";
						badgeClass = "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300";
					}

					row.innerHTML = `
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-1.5 mb-0.5">
								<span class="text-[9px] font-bold px-1.5 py-0.2 rounded ${badgeClass}">${badgeText}</span>
								<span class="text-[10px] text-slate-500 dark:text-slate-400 truncate">${escapeHtml(item.subject)}</span>
								${item.deadline ? `<span class="text-[10px] text-slate-400 dark:text-slate-500 truncate">• Due: ${escapeHtml(item.deadline)}</span>` : ''}
							</div>
							<div class="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">${escapeHtml(item.title)}</div>
						</div>
						<button type="button" class="px-2 py-1 text-[11px] font-medium rounded bg-blue-600 hover:bg-blue-700 text-white transition shrink-0">Select</button>
					`;
					row.addEventListener("click", () => selectLinkedActivity(item));
					linkActivityItemsList.appendChild(row);
				}
			});
		}
	}

	if (linkActivityResultsCount) {
		linkActivityResultsCount.textContent = `${visibleCount} item${visibleCount === 1 ? "" : "s"}`;
	}
}

function renderEmptyLinkActivityNotice(msg) {
	if (!linkActivityItemsList) return;
	linkActivityItemsList.innerHTML = `
		<div class="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
			<p class="font-medium text-slate-600 dark:text-slate-400">${escapeHtml(msg)}</p>
			<p class="text-[11px] mt-1">Try adjusting your search or filters.</p>
		</div>
	`;
}

function applyLinkedSubject(subject) {
	if (!pomodoroSubjectSelect || !subject) return;
	const hasOption = Array.from(pomodoroSubjectSelect.options).some((o) => o.value === subject);
	if (!hasOption) pomodoroSubjectSelect.add(new Option(subject, subject));
	pomodoroSubjectSelect.value = subject;
}

function closeLinkedSubjectConfirmModal() {
	pendingLinkedSubject = null;
	if (linkedSubjectConfirmModal) linkedSubjectConfirmModal.classList.add("hidden");
}

function openLinkedSubjectConfirmModal(item, subject) {
	pendingLinkedSubject = subject;
	if (linkedSubjectConfirmActivity) linkedSubjectConfirmActivity.textContent = item.title || "this activity";
	if (linkedSubjectConfirmSubject) linkedSubjectConfirmSubject.textContent = subject;
	if (linkedSubjectConfirmModal) linkedSubjectConfirmModal.classList.remove("hidden");
}

function selectLinkedActivity(item) {
	if (!item) return;

	const mappedType = item.type === "chapter" || item.type === "subchapter" ? "syllabus" : item.type;
	const isSubchapter = item.type === "subchapter";
	const id = isSubchapter ? (item.chapterId || "") : (item.id || "");
	const subId = isSubchapter ? (item.id || "") : "";

	currentLinkedItem = {
		type: mappedType,
		id: id,
		subId: subId,
		title: item.title,
		parentTitle: item.parentTitle || "",
		subject: item.subject,
		displayText: item.displayText
	};

	if (item.subject) applyLinkedSubject(item.subject);

	// Update active card preview
	if (linkedCardTypeBadge) {
		const label = isSubchapter ? "Subchapter" : item.type === "chapter" ? "Chapter" : item.type.toUpperCase();
		linkedCardTypeBadge.textContent = label;
	}
	if (linkedCardSubjectBadge) {
		linkedCardSubjectBadge.textContent = item.subject;
	}
	if (linkedCardTitle) {
		linkedCardTitle.textContent = item.title;
	}
	if (linkedCardParent) {
		if (item.parentTitle) {
			linkedCardParent.textContent = `Chapter: ${item.parentTitle}`;
			linkedCardParent.classList.remove("hidden");
		} else {
			linkedCardParent.classList.add("hidden");
		}
	}
	if (linkedActivityActiveCard) {
		linkedActivityActiveCard.classList.remove("hidden");
	}
	if (clearLinkedItemBtn) {
		clearLinkedItemBtn.classList.remove("hidden");
	}

	// Close menu
	if (linkActivityMenu) {
		linkActivityMenu.classList.add("hidden");
	}

	// Legacy backward compatibility sync
	if (sessionLinkType) sessionLinkType.value = mappedType;
	if (sessionLinkPreview) {
		sessionLinkPreview.textContent = item.displayText;
		sessionLinkPreview.classList.remove("hidden");
	}
}

function clearLinkedActivity() {
	currentLinkedItem = null;
	if (linkedActivityActiveCard) linkedActivityActiveCard.classList.add("hidden");
	if (clearLinkedItemBtn) clearLinkedItemBtn.classList.add("hidden");
	if (linkActivitySearchInput) linkActivitySearchInput.value = "";
	if (clearSearchBtn) clearSearchBtn.classList.add("hidden");
	linkActivitySearchQuery = "";

	if (sessionLinkType) sessionLinkType.value = "none";
	if (sessionLinkPreview) {
		sessionLinkPreview.textContent = "";
		sessionLinkPreview.classList.add("hidden");
	}
	if (linkActivityMenu) linkActivityMenu.classList.add("hidden");
}

function toggleLinkActivityMenu(forceOpen = null) {
	if (!linkActivityMenu) return;
	const shouldOpen = forceOpen !== null ? forceOpen : linkActivityMenu.classList.contains("hidden");
	if (shouldOpen) {
		populateActivitySubjectFilter();
		renderLinkActivityDropdown();
		linkActivityMenu.classList.remove("hidden");
	} else {
		linkActivityMenu.classList.add("hidden");
	}
}

function refreshLinkActivityData() {
	populateActivitySubjectFilter();
	if (linkActivityMenu && !linkActivityMenu.classList.contains("hidden")) {
		renderLinkActivityDropdown();
	}
}
window.refreshLinkActivityData = refreshLinkActivityData;

// Backward-compatible delegators
function populateLinkTargetOptions() {
	refreshLinkActivityData();
}

function handleLinkTargetSelection() {
	// Handled directly by selectLinkedActivity
}


// --- Study History Modal & In-Depth Details ---
function openStudyHistoryModal(filterSubject = null) {
	if (!studyHistoryModal) return;
	populateHistorySubjectFilter();

	if (filterSubject && historyFilterSubject) {
		historyFilterSubject.value = filterSubject;
	} else if (historyFilterSubject) {
		historyFilterSubject.value = "all";
	}
	if (historyFilterType) {
		historyFilterType.value = "all";
	}

	renderStudyHistoryModalContent();
	studyHistoryModal.classList.remove("hidden");
}

function closeStudyHistoryModal() {
	if (studyHistoryModal) {
		studyHistoryModal.classList.add("hidden");
	}
}

function populateHistorySubjectFilter() {
	if (!historyFilterSubject) return;
	const currentVal = historyFilterSubject.value;
	historyFilterSubject.innerHTML = '<option value="all">All Subjects</option>';
	const subjects = typeof getUserSubjects === "function" ? getUserSubjects() : Object.keys(subjectColors || {});
	subjects.forEach((s) => {
		historyFilterSubject.add(new Option(s, s));
	});
	if (currentVal && (currentVal === "all" || subjects.includes(currentVal))) {
		historyFilterSubject.value = currentVal;
	}
}

function renderStudyHistoryModalContent() {
	if (!studyHistoryList) return;
	studyHistoryList.innerHTML = "";

	const selectedSubj = historyFilterSubject ? historyFilterSubject.value : "all";
	const selectedType = historyFilterType ? historyFilterType.value : "all";

	const allSessions = Array.isArray(studySessions) ? studySessions : [];
	const filtered = allSessions.filter((sess) => {
		if (selectedSubj !== "all" && sess.subject !== selectedSubj) {
			return false;
		}
		if (selectedType !== "all") {
			const itemType = sess.linkedItem?.itemType || "general";
			if (selectedType === "general") {
				if (itemType !== "none" && itemType !== "general") return false;
			} else if (itemType !== selectedType) {
				return false;
			}
		}
		return true;
	});

	// Compute summary statistics
	const totalSessionsCount = filtered.length;
	const totalFocusSeconds = filtered.reduce((acc, s) => acc + (Number(s.durationSeconds) || 0), 0);
	const subjectDurationMap = {};
	filtered.forEach((s) => {
		subjectDurationMap[s.subject] = (subjectDurationMap[s.subject] || 0) + (Number(s.durationSeconds) || 0);
	});
	let topSubjectName = "None";
	let topSubjectSec = 0;
	for (const [subj, sec] of Object.entries(subjectDurationMap)) {
		if (sec > topSubjectSec) {
			topSubjectSec = sec;
			topSubjectName = subj;
		}
	}

	if (historyTotalSessions) historyTotalSessions.textContent = String(totalSessionsCount);
	if (historyTotalTime) historyTotalTime.textContent = formatLogTime(totalFocusSeconds);
	if (historyTopSubject) historyTopSubject.textContent = topSubjectName;

	if (filtered.length === 0) {
		studyHistoryList.innerHTML = `
				<div class="py-12 text-center text-slate-400 dark:text-slate-500">
					<p class="text-sm font-semibold text-slate-600 dark:text-slate-400">No study sessions found</p>
					<p class="text-xs mt-1">Complete a Pomodoro round or Stopwatch study session to record your history.</p>
				</div>
			`;
		return;
	}

	filtered.forEach((sess) => {
		const card = document.createElement("div");
		card.className = "p-3.5 bg-slate-50 hover:bg-slate-100/90 dark:bg-slate-700/40 dark:hover:bg-slate-700/70 border border-slate-200 dark:border-slate-700 rounded-xl transition space-y-2";

		const startDate = new Date(sess.startTime);
		const endDate = new Date(sess.endTime);
		const dateStr = !isNaN(startDate.getTime())
			? startDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
			: "Recorded Session";
		const startTimeStr = !isNaN(startDate.getTime())
			? startDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
			: "";
		const endTimeStr = !isNaN(endDate.getTime())
			? endDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
			: "";
		const timeRangeStr = (startTimeStr && endTimeStr) ? `${startTimeStr} – ${endTimeStr}` : "";

		const headline = sess.linkedItem?.displayText || `Focused on ${sess.subject}`;
		const durationFormatted = formatLogTime(sess.durationSeconds || 0);
		const modeLabel = sess.mode === "stopwatch" ? "Stopwatch" : "Pomodoro";
		const typeKey = sess.linkedItem?.itemType || "none";
		let typeLabel = "General";
		if (typeKey === "task") typeLabel = "Task";
		else if (typeKey === "syllabus") typeLabel = "Syllabus";
		else if (typeKey === "exam") typeLabel = "Exam";
		else if (typeKey === "flashcard") typeLabel = "Flashcard";

		const subjColor = typeof getColorForSubject === "function" ? getColorForSubject(sess.subject) : "#00B4D8";

		card.innerHTML = `
				<div class="flex items-start justify-between gap-2">
					<div class="min-w-0 flex-1">
						<p class="font-semibold text-sm text-slate-800 dark:text-slate-200 leading-snug break-words">${escapeHtml(headline)}</p>
						<p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${escapeHtml(dateStr)}${timeRangeStr ? ` • ${escapeHtml(timeRangeStr)}` : ""}</p>
					</div>
					<span class="text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-2.5 py-1 rounded-md shrink-0">
						${escapeHtml(durationFormatted)}
					</span>
				</div>
				<div class="flex items-center justify-between pt-1 border-t border-slate-200/70 dark:border-slate-600/50 text-xs">
					<div class="flex items-center gap-1.5 flex-wrap">
						<span class="font-medium px-2 py-0.5 rounded text-white" style="background-color: ${subjColor};">${escapeHtml(sess.subject)}</span>
						<span class="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium">${escapeHtml(modeLabel)}</span>
						<span class="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-400">${escapeHtml(typeLabel)}</span>
					</div>
					<button type="button" class="text-red-500 hover:text-red-600 dark:text-red-400 text-xs font-medium delete-study-session-btn" data-id="${escapeHtml(sess.id)}">Delete</button>
				</div>
			`;

		const delBtn = card.querySelector(".delete-study-session-btn");
		if (delBtn) {
			delBtn.addEventListener("click", (e) => {
				e.stopPropagation();
				if (confirm("Are you sure you want to delete this session record?")) {
					deleteStudySession(sess.id);
				}
			});
		}

		studyHistoryList.appendChild(card);
	});
}


function initTimerEvents() {
	const syncStudyTrackerOrder = () => {
		const studyPage = document.getElementById("study-page");
		const calendarColumn = document.getElementById("study-calendar-column");
		const toolsColumn = document.getElementById("study-tools-column");
		const timerCard = document.getElementById("study-timer-card");
		if (!studyPage || !calendarColumn || !toolsColumn || !timerCard) return;

		if (window.matchMedia("(max-width: 639px)").matches) {
			studyPage.insertBefore(timerCard, calendarColumn);
		} else {
			toolsColumn.insertBefore(timerCard, toolsColumn.firstChild);
		}
	};
	syncStudyTrackerOrder();
	window.addEventListener("resize", syncStudyTrackerOrder);

	if (playPauseBtn) playPauseBtn.addEventListener("click", playPauseTimer);
	if (skipBtn) {
		skipBtn.addEventListener("click", () => {
			if (currentMode === "focus") {
				finalizeActiveSession();
				saveStudyLogs();
				if (window.collectiblesModule) {
					window.collectiblesModule.saveCollectibleState();
				}
			}
			switchMode(currentMode === "focus" ? "break" : "focus");
		});
	}

	if (timerModePomodoroBtn) {
		timerModePomodoroBtn.addEventListener("click", () => setTimerEngine("pomodoro"));
	}
	if (timerModeStopwatchBtn) {
		timerModeStopwatchBtn.addEventListener("click", () => setTimerEngine("stopwatch"));
	}
	if (stopStopwatchBtn) {
		stopStopwatchBtn.addEventListener("click", resetStopwatch);
	}

	if (focusDurationInput) {
		focusDurationInput.addEventListener("change", () => currentMode === "focus" && switchMode("focus"));
	}
	if (breakDurationInput) {
		breakDurationInput.addEventListener("change", () => currentMode === "break" && switchMode("break"));
	}
	if (pomodoroSubjectSelect) {
		pomodoroSubjectSelect.addEventListener("change", (e) => {
			const linkedSubject = currentLinkedItem?.subject;
			if (linkedSubject && e.target.value !== linkedSubject) {
				openLinkedSubjectConfirmModal(currentLinkedItem, linkedSubject);
			}
		});
	}

	// Activity linking events
	if (linkActivitySearchInput) {
		linkActivitySearchInput.addEventListener("input", (e) => {
			linkActivitySearchQuery = e.target.value;
			if (clearSearchBtn) {
				if (linkActivitySearchQuery.length > 0) clearSearchBtn.classList.remove("hidden");
				else clearSearchBtn.classList.add("hidden");
			}
			toggleLinkActivityMenu(true);
			renderLinkActivityDropdown();
		});
		linkActivitySearchInput.addEventListener("focus", () => {
			toggleLinkActivityMenu(true);
		});
	}

	if (clearSearchBtn) {
		clearSearchBtn.addEventListener("click", () => {
			if (linkActivitySearchInput) linkActivitySearchInput.value = "";
			linkActivitySearchQuery = "";
			clearSearchBtn.classList.add("hidden");
			renderLinkActivityDropdown();
		});
	}

	if (linkActivityDropdownToggle) {
		linkActivityDropdownToggle.addEventListener("click", () => {
			toggleLinkActivityMenu();
		});
	}

	if (changeLinkedItemBtn) {
		changeLinkedItemBtn.addEventListener("click", () => {
			toggleLinkActivityMenu(true);
			if (linkActivitySearchInput) linkActivitySearchInput.focus();
		});
	}

	if (linkActivityCloseBtn) {
		linkActivityCloseBtn.addEventListener("click", () => {
			toggleLinkActivityMenu(false);
		});
	}

	// Type filter pills
	const typeFilterBtns = document.querySelectorAll(".link-type-filter-btn");
	typeFilterBtns.forEach((btn) => {
		btn.addEventListener("click", () => {
			typeFilterBtns.forEach((b) => {
				b.classList.remove("active", "bg-blue-600", "text-white");
				b.classList.add("bg-slate-100", "dark:bg-slate-700", "text-slate-600", "dark:text-slate-300");
			});
			btn.classList.add("active", "bg-blue-600", "text-white");
			btn.classList.remove("bg-slate-100", "dark:bg-slate-700", "text-slate-600", "dark:text-slate-300");

			linkActivityTypeFilter = btn.dataset.typeFilter || "all";
			renderLinkActivityDropdown();
		});
	});

	// Subject filter dropdown
	if (linkActivitySubjectFilter) {
		linkActivitySubjectFilter.addEventListener("change", (e) => {
			linkActivitySubjectFilterVal = e.target.value;
			renderLinkActivityDropdown();
		});
	}

	// Quick "Current Subject" button
	if (linkActivityQuickCurrSubj) {
		linkActivityQuickCurrSubj.addEventListener("click", () => {
			const currSubj = (pomodoroSubjectSelect && pomodoroSubjectSelect.value) ? pomodoroSubjectSelect.value : "";
			if (currSubj && linkActivitySubjectFilter) {
				linkActivitySubjectFilter.value = currSubj;
				linkActivitySubjectFilterVal = currSubj;
				renderLinkActivityDropdown();
			}
		});
	}

	// Sort button
	if (linkActivitySortBtn) {
		linkActivitySortBtn.addEventListener("click", () => {
			if (linkActivitySortMode === "curriculum") {
				linkActivitySortMode = "alpha";
				linkActivitySortBtn.textContent = "Sort: A-Z";
			} else if (linkActivitySortMode === "alpha") {
				linkActivitySortMode = "type";
				linkActivitySortBtn.textContent = "Sort: Type";
			} else {
				linkActivitySortMode = "curriculum";
				linkActivitySortBtn.textContent = "Sort: Default";
			}
			linkActivitySortBtn.dataset.sortMode = linkActivitySortMode;
			renderLinkActivityDropdown();
		});
	}

	// Dismiss dropdown when clicking outside
	document.addEventListener("click", (e) => {
		const container = document.getElementById("link-activity-selector-container");
		const activeCard = document.getElementById("linked-activity-active-card");
		if (container && !container.contains(e.target) && (!activeCard || !activeCard.contains(e.target))) {
			if (linkActivityMenu && !linkActivityMenu.classList.contains("hidden")) {
				linkActivityMenu.classList.add("hidden");
			}
		}
	});

	// Escape key to close dropdown
	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape" && linkActivityMenu && !linkActivityMenu.classList.contains("hidden")) {
			linkActivityMenu.classList.add("hidden");
		}
	});

	if (clearLinkedItemBtn) {
		clearLinkedItemBtn.addEventListener("click", clearLinkedActivity);
	}

	if (sessionLinkType) {
		sessionLinkType.addEventListener("change", populateLinkTargetOptions);
	}
	if (sessionLinkTarget) {
		sessionLinkTarget.addEventListener("change", handleLinkTargetSelection);
	}

	// Study History Modal events
	if (openStudyHistoryBtn) {
		openStudyHistoryBtn.addEventListener("click", () => openStudyHistoryModal());
	}
	if (closeStudyHistoryBtn) {
		closeStudyHistoryBtn.addEventListener("click", closeStudyHistoryModal);
	}
	if (studyHistoryModal) {
		studyHistoryModal.addEventListener("click", (e) => {
			if (e.target === studyHistoryModal) closeStudyHistoryModal();
		});
	}
	if (cancelLinkedSubjectConfirmBtn) {
		cancelLinkedSubjectConfirmBtn.addEventListener("click", () => {
			if (currentLinkedItem?.subject) applyLinkedSubject(currentLinkedItem.subject);
			closeLinkedSubjectConfirmModal();
		});
	}
	if (applyLinkedSubjectConfirmBtn) {
		applyLinkedSubjectConfirmBtn.addEventListener("click", () => {
			closeLinkedSubjectConfirmModal();
		});
	}
	if (linkedSubjectConfirmModal) {
		linkedSubjectConfirmModal.addEventListener("click", (e) => {
			if (e.target === linkedSubjectConfirmModal) closeLinkedSubjectConfirmModal();
		});
	}
	if (historyFilterSubject) {
		historyFilterSubject.addEventListener("change", renderStudyHistoryModalContent);
	}
	if (historyFilterType) {
		historyFilterType.addEventListener("change", renderStudyHistoryModalContent);
	}

	document.addEventListener("visibilitychange", handleVisibilityChangeForPiP);
}

window.initTimerEvents = initTimerEvents;

window.StudyApp.timer = {
	renderStudyChart,
	renderStreak,
	checkStreak,
	updateStreak,
	loadStudyLogs,
	saveStudyLogs,
	loadStreak,
	saveStreak,
	loadStudySessions,
	saveStudySession,
	deleteStudySession,
	finalizeActiveSession,
	renderStudyLogs,
	updateTimerDisplay,
	playNotificationSound,
	switchMode,
	setTimerEngine,
	resetStopwatch,
	playPauseTimer,
	handleVisibilityChangeForPiP,
	openPiPTimer,
	updatePiPTimer,
	closePiPTimer,
	populateLinkTargetOptions,
	handleLinkTargetSelection,
	clearLinkedActivity,
	refreshLinkActivityData,
	getAllLinkableActivities,
	renderLinkActivityDropdown,
	selectLinkedActivity,
	openStudyHistoryModal,
	closeStudyHistoryModal,
	renderStudyHistoryModalContent,
	initTimerEvents
};
