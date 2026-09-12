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
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId: currentUser.id, studyStreak, lastStudyDay }),
			});
			renderDashboard();
		} catch (error) {
			console.error("Failed to save streak:", error);
		}
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
				el.title = "Click to select for timer";
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


function initTimerEvents() {
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
	renderStudyLogs,
	updateTimerDisplay,
	playNotificationSound,
	switchMode,
	playPauseTimer,
	handleVisibilityChangeForPiP,
	openPiPTimer,
	updatePiPTimer,
	closePiPTimer,
	initTimerEvents
};
