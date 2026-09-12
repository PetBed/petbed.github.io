// ==========================================
// SYLLABUS & TOPIC MASTERY CHECKLIST MODULE
// ==========================================

window.StudyApp = window.StudyApp || {};

var syllabusSortableInstance = null;

const SYLLABUS_STATUSES = [
	{ key: "not_started", label: "Not Started", colorClass: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600" },
	{ key: "in_progress", label: "In Progress", colorClass: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-700/60" },
	{ key: "review_required", label: "Review Required", colorClass: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-700/60" },
	{ key: "mastered", label: "Mastered", colorClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/60" }
];

function getStatusConfig(statusKey) {
	return SYLLABUS_STATUSES.find(s => s.key === statusKey) || SYLLABUS_STATUSES[0];
}

// ----------------------------------------------------
// Data Loading & Persistence
// ----------------------------------------------------
async function loadSyllabus() {
	if (!currentUser) return;
	try {
		const response = await fetch(`${API_URL}/api/study/syllabus?userId=${currentUser.id}`);
		if (response.ok) {
			const data = await response.json();
			syllabus = data.syllabus || [];
		} else {
			// Fallback to localStorage
			const cached = localStorage.getItem(`studySyllabus_${currentUser.id}`);
			if (cached) syllabus = JSON.parse(cached);
		}
	} catch (err) {
		console.warn("Failed to fetch syllabus from server, loading local cache:", err);
		const cached = localStorage.getItem(`studySyllabus_${currentUser.id}`);
		if (cached) syllabus = JSON.parse(cached);
	}

	if (!activeSyllabusSubjectId && syllabus.length > 0) {
		activeSyllabusSubjectId = syllabus[0].id;
	}

	// Persist to local storage
	localStorage.setItem(`studySyllabus_${currentUser.id}`, JSON.stringify(syllabus));
	if (typeof populateSubjects === "function") {
		populateSubjects();
	}
}

async function saveSyllabus(syncToServer = true) {
	if (!currentUser) return;
	// Always save locally first (optimistic update)
	localStorage.setItem(`studySyllabus_${currentUser.id}`, JSON.stringify(syllabus));

	if (syncToServer) {
		try {
			await fetch(`${API_URL}/api/study/syllabus/sync`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId: currentUser.id, syllabus }),
			});
		} catch (err) {
			console.error("Failed to sync syllabus with server:", err);
		}
	}
}

// ----------------------------------------------------
// Rendering
// ----------------------------------------------------
function renderSyllabusPage() {
	if (!syllabusPage) return;

	// Compute overall statistics
	let totalChapters = 0;
	let masteredChapters = 0;
	let inProgressChapters = 0;
	let reviewChapters = 0;
	let notStartedChapters = 0;

	syllabus.forEach(sub => {
		(sub.chapters || []).forEach(ch => {
			totalChapters++;
			if (ch.status === "mastered") masteredChapters++;
			else if (ch.status === "in_progress") inProgressChapters++;
			else if (ch.status === "review_required") reviewChapters++;
			else notStartedChapters++;
		});
	});

	const overallPct = totalChapters > 0 ? Math.round((masteredChapters / totalChapters) * 100) : 0;

	if (syllabusOverallProgress) {
		syllabusOverallProgress.style.width = `${overallPct}%`;
	}
	if (syllabusOverallText) {
		syllabusOverallText.textContent = `${masteredChapters} of ${totalChapters} chapters mastered (${overallPct}%)`;
	}
	if (syllabusSubjectsCount) {
		syllabusSubjectsCount.textContent = `${syllabus.length} Subject${syllabus.length === 1 ? "" : "s"}`;
	}
	if (syllabusChaptersCount) {
		syllabusChaptersCount.textContent = `${totalChapters} Chapter${totalChapters === 1 ? "" : "s"}`;
	}

	// If no subjects exist, show empty state
	if (syllabus.length === 0) {
		if (syllabusEmptyState) syllabusEmptyState.classList.remove("hidden");
		if (syllabusSubjectContent) syllabusSubjectContent.classList.add("hidden");
		if (syllabusTabsContainer) syllabusTabsContainer.innerHTML = "";
		return;
	}

	if (syllabusEmptyState) syllabusEmptyState.classList.add("hidden");
	if (syllabusSubjectContent) syllabusSubjectContent.classList.remove("hidden");

	// Ensure active subject is valid
	if (!activeSyllabusSubjectId || !syllabus.find(s => s.id === activeSyllabusSubjectId)) {
		activeSyllabusSubjectId = syllabus[0].id;
	}

	renderSubjectTabs();
	renderActiveSubjectContent();
}

function renderSubjectTabs() {
	if (!syllabusTabsContainer) return;
	syllabusTabsContainer.innerHTML = "";

	syllabus.forEach((sub, idx) => {
		const isActive = sub.id === activeSyllabusSubjectId;
		const total = (sub.chapters || []).length;
		const mastered = (sub.chapters || []).filter(c => c.status === "mastered").length;

		const tabBtn = document.createElement("button");
		tabBtn.type = "button";
		tabBtn.className = `px-4 py-2 rounded-xl text-sm font-semibold transition shrink-0 flex items-center gap-2 border ${
			isActive
				? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-500 shadow-xs"
				: "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700/60"
		}`;
		tabBtn.dataset.subjectId = sub.id;

		const dot = document.createElement("span");
		dot.className = "w-2.5 h-2.5 rounded-full shrink-0";
		dot.style.backgroundColor = sub.color || "#00B4D8";

		const label = document.createElement("span");
		label.textContent = sub.name;

		const badge = document.createElement("span");
		badge.className = "text-[11px] px-1.5 py-0.5 rounded-md font-medium text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-600/60";
		badge.textContent = `${mastered}/${total}`;

		tabBtn.appendChild(dot);
		tabBtn.appendChild(label);
		tabBtn.appendChild(badge);

		tabBtn.addEventListener("click", () => {
			activeSyllabusSubjectId = sub.id;
			renderSyllabusPage();
		});

		syllabusTabsContainer.appendChild(tabBtn);
	});
}

function renderActiveSubjectContent() {
	if (!syllabusSubjectContent) return;

	const currentSubjectIndex = syllabus.findIndex(s => s.id === activeSyllabusSubjectId);
	const subject = syllabus[currentSubjectIndex];
	if (!subject) return;

	const chapters = subject.chapters || [];
	const total = chapters.length;
	const mastered = chapters.filter(c => c.status === "mastered").length;
	const inProgress = chapters.filter(c => c.status === "in_progress").length;
	const review = chapters.filter(c => c.status === "review_required").length;
	const notStarted = chapters.filter(c => c.status === "not_started" || !c.status).length;
	const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;

	const activeSem = typeof getActiveSemester === "function" ? getActiveSemester() : null;
	const semSeconds = activeSem && activeSem.studyLogs ? (activeSem.studyLogs[subject.name] || 0) : 0;
	const totalSeconds = (typeof studyLogs === "object" && studyLogs && studyLogs[subject.name]) ? studyLogs[subject.name] : 0;
	const displaySeconds = Math.max(totalSeconds, semSeconds);
	const studyTimeString = typeof formatLogTime === "function" ? formatLogTime(displaySeconds) : `${Math.floor(displaySeconds / 60)}m`;

	const allExams = typeof getAllSemestersExams === "function" ? getAllSemestersExams() : [];
	const subjectExams = allExams.filter(e => e.subject && e.subject.trim().toLowerCase() === subject.name.trim().toLowerCase());

	syllabusSubjectContent.innerHTML = `
		<div class="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 md:p-6 shadow-xs space-y-6">
			<!-- Subject Header Card -->
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-700/60">
				<div>
					<div class="flex items-center gap-3">
						<span class="w-3.5 h-3.5 rounded-full shrink-0" style="background-color: ${subject.color || '#00B4D8'};"></span>
						<h2 class="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">${escapeHtml(subject.name)}</h2>
						<span class="text-xs px-2.5 py-1 rounded-full font-semibold border ${
							pct === 100 
								? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700' 
								: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600'
						}">${pct}% Mastered</span>
					</div>
					<p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
						${mastered} mastered, ${inProgress} in progress, ${review} review required, ${notStarted} not started
					</p>
					<div class="flex items-center gap-2 mt-2 flex-wrap text-xs">
						<span class="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 px-2.5 py-1 rounded-lg">
							<span>Total Studied:</span>
							<strong class="text-blue-600 dark:text-blue-400">${studyTimeString}</strong>
						</span>
						${subjectExams.length > 0 ? `
						<span class="inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-200/60 dark:border-amber-700/40 px-2.5 py-1 rounded-lg">
							<span>${subjectExams.length} Exam Paper${subjectExams.length === 1 ? "" : "s"} Scheduled</span>
						</span>
						` : ''}
					</div>
				</div>

				<!-- Subject Action Controls -->
				<div class="flex items-center gap-2 flex-wrap">
					<button type="button" id="syllabus-move-left-btn" ${currentSubjectIndex === 0 ? 'disabled' : ''}
						class="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition" title="Move Subject Left">
						Left
					</button>
					<button type="button" id="syllabus-move-right-btn" ${currentSubjectIndex === syllabus.length - 1 ? 'disabled' : ''}
						class="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition" title="Move Subject Right">
						Right
					</button>
					<button type="button" id="syllabus-edit-subject-btn"
						class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition">
						Edit Subject
					</button>
					<button type="button" id="syllabus-delete-subject-btn"
						class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition">
						Delete Subject
					</button>
					<button type="button" id="syllabus-add-exam-btn"
						class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-95 text-white shadow-xs transition flex items-center gap-1.5" title="Schedule an exam paper for this subject">
						<span>Schedule Exam</span>
					</button>
					<button type="button" id="syllabus-add-chapter-btn"
						class="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-xs transition flex items-center gap-1.5">
						<span>+ Add Chapter</span>
					</button>
				</div>
			</div>

			<!-- Subject Progress Bar -->
			<div>
				<div class="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
					<span>Syllabus Completion</span>
					<span>${mastered} / ${total} Chapters</span>
				</div>
				<div class="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
					<div class="bg-emerald-500 h-2.5 rounded-full transition-all duration-300" style="width: ${pct}%"></div>
				</div>
			</div>

			${subjectExams.length > 0 ? `
			<!-- Scheduled Exam Papers for Subject -->
			<div class="space-y-2 pt-1 pb-1">
				<div class="flex items-center justify-between">
					<h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Scheduled Exam Papers & Dates</h3>
					<button type="button" id="syllabus-manage-exams-btn" class="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold">Manage in Semesters &rarr;</button>
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
					${subjectExams.map(ex => {
						const d = new Date(ex.date);
						const dateDisplay = isNaN(d.getTime()) ? ex.date : d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
						const hasMark = ex.mark !== null && ex.mark !== undefined && ex.mark !== "";
						return `
						<div class="p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-700/30 flex items-center justify-between gap-2">
							<div class="min-w-0">
								<p class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">${escapeHtml(ex.paper || "Exam Paper")}</p>
								<p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">${dateDisplay}</p>
							</div>
							${hasMark ? `
							<span class="text-xs font-semibold px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 shrink-0">${ex.mark}/${ex.maxMark || 100}</span>
							` : `
							<span class="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-800/40 shrink-0">Scheduled</span>
							`}
						</div>
						`;
					}).join("")}
				</div>
			</div>
			` : ''}

			<!-- Chapters List -->
			<div class="space-y-3 pt-2">
				<div class="flex items-center justify-between">
					<h3 class="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Chapters & Topics</h3>
					<span class="text-xs text-slate-400">Click on status badge to update progress</span>
				</div>
				<div id="syllabus-chapters-list" class="space-y-2.5">
					<!-- Dynamically rendered chapter items -->
				</div>
			</div>
		</div>
	`;

	// Bind header actions
	const moveLeftBtn = document.getElementById("syllabus-move-left-btn");
	if (moveLeftBtn) moveLeftBtn.addEventListener("click", () => moveSubject(subject.id, -1));

	const moveRightBtn = document.getElementById("syllabus-move-right-btn");
	if (moveRightBtn) moveRightBtn.addEventListener("click", () => moveSubject(subject.id, 1));

	const editSubBtn = document.getElementById("syllabus-edit-subject-btn");
	if (editSubBtn) editSubBtn.addEventListener("click", () => openSubjectModal(subject));

	const deleteSubBtn = document.getElementById("syllabus-delete-subject-btn");
	if (deleteSubBtn) deleteSubBtn.addEventListener("click", () => handleDeleteSubject(subject.id));

	const addChapBtn = document.getElementById("syllabus-add-chapter-btn");
	if (addChapBtn) addChapBtn.addEventListener("click", () => openChapterModal(subject.id));

	const addExamBtn = document.getElementById("syllabus-add-exam-btn");
	if (addExamBtn) {
		addExamBtn.addEventListener("click", () => {
			if (typeof openExamsModal === "function") {
				openExamsModal(null, "exams", subject.name);
			}
		});
	}

	const manageExamsBtn = document.getElementById("syllabus-manage-exams-btn");
	if (manageExamsBtn) {
		manageExamsBtn.addEventListener("click", () => {
			if (typeof openExamsModal === "function") {
				openExamsModal(null, "exams", subject.name);
			}
		});
	}

	renderChaptersList(subject);
}

function renderChaptersList(subject) {
	const container = document.getElementById("syllabus-chapters-list");
	if (!container) return;
	container.innerHTML = "";

	const chapters = subject.chapters || [];

	if (chapters.length === 0) {
		container.innerHTML = `
			<div class="p-8 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
				<p class="text-sm font-medium text-slate-600 dark:text-slate-400">No chapters added yet for ${escapeHtml(subject.name)}.</p>
				<p class="text-xs text-slate-400 dark:text-slate-500 mt-1">Click "+ Add Chapter" above to start adding topics.</p>
			</div>
		`;
		return;
	}

	chapters.forEach((ch, idx) => {
		const chapterNumber = idx + 1;
		const chapterLabel = `Chapter ${chapterNumber}`;
		const hasCustomName = ch.name && ch.name.trim().length > 0;
		const displayName = hasCustomName ? ch.name.trim() : chapterLabel;
		const statusCfg = getStatusConfig(ch.status);

		const item = document.createElement("div");
		item.className = "p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-700/30 hover:border-slate-300 dark:hover:border-slate-600 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3";
		item.dataset.chapterId = ch.id;

		item.innerHTML = `
			<div class="flex items-start gap-3 min-w-0">
				<span class="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0 select-none">
					${chapterLabel}
				</span>
				<div class="min-w-0">
					<div class="flex items-center gap-2">
						<h4 class="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
							${hasCustomName ? escapeHtml(displayName) : chapterLabel}
						</h4>
					</div>
					${ch.notes ? `<p class="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">${escapeHtml(ch.notes)}</p>` : ''}
				</div>
			</div>

			<div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
				<!-- Status Toggle Button -->
				<button type="button" data-action="toggle-status" data-chapter-id="${ch.id}"
					class="px-3 py-1 rounded-lg text-xs font-semibold border transition ${statusCfg.colorClass}"
					title="Click to advance status">
					${statusCfg.label}
				</button>

				<!-- Reorder Up/Down -->
				<button type="button" data-action="move-up" data-chapter-id="${ch.id}" ${idx === 0 ? 'disabled' : ''}
					class="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
					title="Move Up">
					<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m18 15-6-6-6 6"/></svg>
				</button>
				<button type="button" data-action="move-down" data-chapter-id="${ch.id}" ${idx === chapters.length - 1 ? 'disabled' : ''}
					class="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
					title="Move Down">
					<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
				</button>

				<!-- Edit Chapter -->
				<button type="button" data-action="edit-chapter" data-chapter-id="${ch.id}"
					class="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition"
					title="Edit Chapter">
					<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
				</button>

				<!-- Delete Chapter -->
				<button type="button" data-action="delete-chapter" data-chapter-id="${ch.id}"
					class="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
					title="Delete Chapter">
					<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
				</button>
			</div>
		`;

		// Wire row actions
		item.querySelector('[data-action="toggle-status"]').addEventListener("click", () => {
			cycleChapterStatus(subject.id, ch.id);
		});

		item.querySelector('[data-action="move-up"]').addEventListener("click", () => {
			moveChapter(subject.id, ch.id, -1);
		});

		item.querySelector('[data-action="move-down"]').addEventListener("click", () => {
			moveChapter(subject.id, ch.id, 1);
		});

		item.querySelector('[data-action="edit-chapter"]').addEventListener("click", () => {
			openChapterModal(subject.id, ch);
		});

		item.querySelector('[data-action="delete-chapter"]').addEventListener("click", () => {
			handleDeleteChapter(subject.id, ch.id);
		});

		container.appendChild(item);
	});
}

// ----------------------------------------------------
// Status Cycling (Not Started -> In Progress -> Review Required -> Mastered)
// ----------------------------------------------------
function cycleChapterStatus(subjectId, chapterId) {
	const subject = syllabus.find(s => s.id === subjectId);
	if (!subject) return;

	const chapter = (subject.chapters || []).find(c => c.id === chapterId);
	if (!chapter) return;

	const statusKeys = ["not_started", "in_progress", "review_required", "mastered"];
	const currentIdx = statusKeys.indexOf(chapter.status || "not_started");
	const nextStatus = statusKeys[(currentIdx + 1) % statusKeys.length];

	chapter.status = nextStatus;
	saveSyllabus();
	renderSyllabusPage();
}

// ----------------------------------------------------
// Subject Operations (Create, Edit, Delete, Reorder)
// ----------------------------------------------------
function openSubjectModal(subjectToEdit = null) {
	if (!syllabusSubjectModal) return;

	if (subjectToEdit) {
		if (syllabusSubjectModalTitle) syllabusSubjectModalTitle.textContent = "Edit Subject";
		if (syllabusSubjectIdInput) syllabusSubjectIdInput.value = subjectToEdit.id;
		if (syllabusSubjectNameInput) syllabusSubjectNameInput.value = subjectToEdit.name;
		if (syllabusSubjectColorInput) syllabusSubjectColorInput.value = subjectToEdit.color || "#00B4D8";
	} else {
		if (syllabusSubjectModalTitle) syllabusSubjectModalTitle.textContent = "Add New Subject";
		if (syllabusSubjectIdInput) syllabusSubjectIdInput.value = "";
		if (syllabusSubjectNameInput) syllabusSubjectNameInput.value = "";
		if (syllabusSubjectColorInput) syllabusSubjectColorInput.value = "#00B4D8";
	}

	syllabusSubjectModal.classList.remove("hidden");
	if (syllabusSubjectNameInput) syllabusSubjectNameInput.focus();
}

function closeSubjectModal() {
	if (!syllabusSubjectModal) return;
	syllabusSubjectModal.classList.add("hidden");
	if (syllabusSubjectForm) syllabusSubjectForm.reset();
}

function handleSaveSubject(e) {
	e.preventDefault();
	if (!syllabusSubjectNameInput) return;

	const name = syllabusSubjectNameInput.value.trim();
	if (!name) return;

	const color = syllabusSubjectColorInput ? syllabusSubjectColorInput.value : "#00B4D8";
	const id = syllabusSubjectIdInput ? syllabusSubjectIdInput.value : "";
	const wasFirstSubject = (!syllabus || syllabus.length === 0);

	if (id) {
		// Edit existing subject
		const existing = syllabus.find(s => s.id === id);
		if (existing) {
			const oldName = existing.name;
			existing.name = name;
			existing.color = color;
			if (oldName && oldName !== name) {
				if (typeof studyLogs === "object" && studyLogs !== null && studyLogs[oldName] !== undefined) {
					studyLogs[name] = (studyLogs[name] || 0) + studyLogs[oldName];
					delete studyLogs[oldName];
					if (typeof saveStudyLogs === "function") saveStudyLogs();
				}
				if (Array.isArray(semesters)) {
					semesters.forEach(sem => {
						if (sem.studyLogs && sem.studyLogs[oldName] !== undefined) {
							sem.studyLogs[name] = (sem.studyLogs[name] || 0) + sem.studyLogs[oldName];
							delete sem.studyLogs[oldName];
						}
						if (Array.isArray(sem.exams)) {
							sem.exams.forEach(ex => { if (ex.subject === oldName) ex.subject = name; });
						}
						if (Array.isArray(sem.subjectFinals)) {
							sem.subjectFinals.forEach(f => { if (f.subject === oldName) f.subject = name; });
						}
					});
					if (typeof saveSemesters === "function") saveSemesters(true);
				}
				if (Array.isArray(tasks)) {
					let tasksChanged = false;
					tasks.forEach(t => { if (t.subject === oldName) { t.subject = name; tasksChanged = true; } });
					if (tasksChanged && typeof saveTasks === "function") saveTasks();
				}
				if (Array.isArray(flashcardSets)) {
					let setsChanged = false;
					flashcardSets.forEach(set => { if (set.subject === oldName) { set.subject = name; setsChanged = true; } });
					if (setsChanged && typeof saveFlashcardSets === "function") saveFlashcardSets();
				}
			}
		}
	} else {
		// Create new subject
		const newSub = {
			id: "subj_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
			name: name,
			color: color,
			order: syllabus.length,
			chapters: []
		};
		syllabus.push(newSub);
		activeSyllabusSubjectId = newSub.id;
		if (wasFirstSubject && typeof cleanupDefaultTemplateExams === "function") {
			cleanupDefaultTemplateExams();
		}
	}

	closeSubjectModal();
	saveSyllabus();
	renderSyllabusPage();
	if (typeof populateSubjects === "function") populateSubjects();
	if (typeof populateCalendarWithExams === "function") populateCalendarWithExams();
	if (typeof renderCalendar === "function") renderCalendar();
	if (typeof renderCountdowns === "function") renderCountdowns();
	if (typeof renderStudyLogs === "function") renderStudyLogs();
	if (typeof renderTasksPage === "function") renderTasksPage();
	if (typeof renderSemesterSection === "function") renderSemesterSection();
}

function handleDeleteSubject(subjectId) {
	const subject = syllabus.find(s => s.id === subjectId);
	if (!subject) return;

	if (!confirm(`Are you sure you want to delete "${subject.name}" and all its chapters?`)) {
		return;
	}

	syllabus = syllabus.filter(s => s.id !== subjectId);
	syllabus.forEach((s, idx) => { s.order = idx; });

	if (activeSyllabusSubjectId === subjectId) {
		activeSyllabusSubjectId = syllabus.length > 0 ? syllabus[0].id : null;
	}

	saveSyllabus();
	renderSyllabusPage();
	if (typeof populateSubjects === "function") populateSubjects();
	if (typeof populateCalendarWithExams === "function") populateCalendarWithExams();
	if (typeof renderCalendar === "function") renderCalendar();
	if (typeof renderCountdowns === "function") renderCountdowns();
	if (typeof renderStudyLogs === "function") renderStudyLogs();
	if (typeof renderTasksPage === "function") renderTasksPage();
	if (typeof renderSemesterSection === "function") renderSemesterSection();
}

function moveSubject(subjectId, offset) {
	const currentIdx = syllabus.findIndex(s => s.id === subjectId);
	if (currentIdx === -1) return;

	const targetIdx = currentIdx + offset;
	if (targetIdx < 0 || targetIdx >= syllabus.length) return;

	const temp = syllabus[currentIdx];
	syllabus[currentIdx] = syllabus[targetIdx];
	syllabus[targetIdx] = temp;

	syllabus.forEach((s, idx) => { s.order = idx; });

	saveSyllabus();
	renderSyllabusPage();
}

// ----------------------------------------------------
// Chapter Operations (Create, Edit, Delete, Reorder)
// ----------------------------------------------------
function openChapterModal(subjectId, chapterToEdit = null) {
	if (!syllabusChapterModal) return;

	if (syllabusChapterSubjectIdInput) syllabusChapterSubjectIdInput.value = subjectId;

	const subject = syllabus.find(s => s.id === subjectId);
	const nextChapterNumber = subject && subject.chapters ? subject.chapters.length + 1 : 1;

	if (chapterToEdit) {
		if (syllabusChapterModalTitle) syllabusChapterModalTitle.textContent = "Edit Chapter";
		if (syllabusChapterIdInput) syllabusChapterIdInput.value = chapterToEdit.id;
		if (syllabusChapterNameInput) {
			syllabusChapterNameInput.value = chapterToEdit.name || "";
			syllabusChapterNameInput.placeholder = `e.g. Kinematics (Defaults to Chapter)`;
		}
		if (syllabusChapterNotesInput) syllabusChapterNotesInput.value = chapterToEdit.notes || "";
		if (syllabusChapterStatusInput) syllabusChapterStatusInput.value = chapterToEdit.status || "not_started";
	} else {
		if (syllabusChapterModalTitle) syllabusChapterModalTitle.textContent = `Add Chapter (Chapter ${nextChapterNumber})`;
		if (syllabusChapterIdInput) syllabusChapterIdInput.value = "";
		if (syllabusChapterNameInput) {
			syllabusChapterNameInput.value = "";
			syllabusChapterNameInput.placeholder = `e.g. Kinematics (Leave blank for "Chapter ${nextChapterNumber}")`;
		}
		if (syllabusChapterNotesInput) syllabusChapterNotesInput.value = "";
		if (syllabusChapterStatusInput) syllabusChapterStatusInput.value = "not_started";
	}

	syllabusChapterModal.classList.remove("hidden");
	if (syllabusChapterNameInput) syllabusChapterNameInput.focus();
}

function closeChapterModal() {
	if (!syllabusChapterModal) return;
	syllabusChapterModal.classList.add("hidden");
	if (syllabusChapterForm) syllabusChapterForm.reset();
}

function handleSaveChapter(e) {
	e.preventDefault();
	const subjectId = syllabusChapterSubjectIdInput ? syllabusChapterSubjectIdInput.value : "";
	const subject = syllabus.find(s => s.id === subjectId);
	if (!subject) return;

	if (!subject.chapters) subject.chapters = [];

	const id = syllabusChapterIdInput ? syllabusChapterIdInput.value : "";
	const name = syllabusChapterNameInput ? syllabusChapterNameInput.value.trim() : "";
	const notes = syllabusChapterNotesInput ? syllabusChapterNotesInput.value.trim() : "";
	const status = syllabusChapterStatusInput ? syllabusChapterStatusInput.value : "not_started";

	if (id) {
		// Edit chapter
		const existing = subject.chapters.find(c => c.id === id);
		if (existing) {
			existing.name = name;
			existing.notes = notes;
			existing.status = status;
		}
	} else {
		// Create new chapter
		const newChap = {
			id: "chap_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
			name: name,
			notes: notes,
			status: status,
			order: subject.chapters.length
		};
		subject.chapters.push(newChap);
	}

	closeChapterModal();
	saveSyllabus();
	renderSyllabusPage();
}

function handleDeleteChapter(subjectId, chapterId) {
	const subject = syllabus.find(s => s.id === subjectId);
	if (!subject) return;

	const chapterIdx = (subject.chapters || []).findIndex(c => c.id === chapterId);
	if (chapterIdx === -1) return;

	const chapter = subject.chapters[chapterIdx];
	const chapterLabel = `Chapter ${chapterIdx + 1}${chapter.name ? ': ' + chapter.name : ''}`;

	if (!confirm(`Delete ${chapterLabel}?`)) {
		return;
	}

	subject.chapters = subject.chapters.filter(c => c.id !== chapterId);
	// Re-index chapter orders
	subject.chapters.forEach((c, idx) => { c.order = idx; });

	saveSyllabus();
	renderSyllabusPage();
}

function moveChapter(subjectId, chapterId, offset) {
	const subject = syllabus.find(s => s.id === subjectId);
	if (!subject || !subject.chapters) return;

	const currentIdx = subject.chapters.findIndex(c => c.id === chapterId);
	if (currentIdx === -1) return;

	const targetIdx = currentIdx + offset;
	if (targetIdx < 0 || targetIdx >= subject.chapters.length) return;

	const temp = subject.chapters[currentIdx];
	subject.chapters[currentIdx] = subject.chapters[targetIdx];
	subject.chapters[targetIdx] = temp;

	subject.chapters.forEach((c, idx) => { c.order = idx; });

	saveSyllabus();
	renderSyllabusPage();
}

function importFromStudyLogs() {
	const foundSubjects = new Set();
	if (typeof studyLogs === "object" && studyLogs !== null) {
		Object.keys(studyLogs).forEach((k) => {
			if (k && k.trim()) foundSubjects.add(k.trim());
		});
	}
	if (Array.isArray(semesters)) {
		semesters.forEach((sem) => {
			if (sem.studyLogs) {
				Object.keys(sem.studyLogs).forEach((k) => {
					if (k && k.trim()) foundSubjects.add(k.trim());
				});
			}
			if (Array.isArray(sem.exams)) {
				sem.exams.forEach((ex) => {
					if (ex.subject && ex.subject.trim() && !(ex.id && String(ex.id).startsWith("exam_migrated_"))) {
						foundSubjects.add(ex.subject.trim());
					}
				});
			}
		});
	}
	if (foundSubjects.size === 0) {
		alert("No existing study logs or exams found to import.");
		return;
	}

	foundSubjects.forEach((subName) => {
		if (!syllabus.find((s) => s.name.toLowerCase() === subName.toLowerCase())) {
			syllabus.push({
				id: "subj_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
				name: subName,
				color: typeof getColorForSubject === "function" ? getColorForSubject(subName) : "#00B4D8",
				order: syllabus.length,
				chapters: []
			});
		}
	});

	if (syllabus.length > 0) {
		activeSyllabusSubjectId = syllabus[0].id;
		if (typeof cleanupDefaultTemplateExams === "function") cleanupDefaultTemplateExams();
	}

	saveSyllabus();
	renderSyllabusPage();
	if (typeof populateSubjects === "function") populateSubjects();
	if (typeof populateCalendarWithExams === "function") populateCalendarWithExams();
	if (typeof renderCalendar === "function") renderCalendar();
	if (typeof renderCountdowns === "function") renderCountdowns();
	if (typeof renderStudyLogs === "function") renderStudyLogs();
	if (typeof renderTasksPage === "function") renderTasksPage();
	if (typeof renderSemesterSection === "function") renderSemesterSection();
}

function importStarterTemplate() {
	const defaultList = ["Modern Mathematics", "Additional Mathematics", "Physics", "Chemistry", "Biology", "English", "History"];
	defaultList.forEach((name) => {
		if (!syllabus.find((s) => s.name.toLowerCase() === name.toLowerCase())) {
			syllabus.push({
				id: "subj_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
				name: name,
				color: (typeof subjectColors === "object" && subjectColors && subjectColors[name]) ? subjectColors[name] : "#00B4D8",
				order: syllabus.length,
				chapters: []
			});
		}
	});

	if (syllabus.length > 0) {
		activeSyllabusSubjectId = syllabus[0].id;
		if (typeof cleanupDefaultTemplateExams === "function") cleanupDefaultTemplateExams();
	}

	saveSyllabus();
	renderSyllabusPage();
	if (typeof populateSubjects === "function") populateSubjects();
	if (typeof populateCalendarWithExams === "function") populateCalendarWithExams();
	if (typeof renderCalendar === "function") renderCalendar();
	if (typeof renderCountdowns === "function") renderCountdowns();
	if (typeof renderStudyLogs === "function") renderStudyLogs();
	if (typeof renderTasksPage === "function") renderTasksPage();
	if (typeof renderSemesterSection === "function") renderSemesterSection();
}

// ----------------------------------------------------
// Event Listeners Registration
// ----------------------------------------------------
function initSyllabusEvents() {
	if (navSyllabus) {
		navSyllabus.addEventListener("click", () => showPage("syllabus"));
	}

	if (syllabusAddSubjectTabBtn) {
		syllabusAddSubjectTabBtn.addEventListener("click", () => openSubjectModal());
	}

	if (syllabusEmptyAddBtn) {
		syllabusEmptyAddBtn.addEventListener("click", () => openSubjectModal());
	}

	if (syllabusEmptyImportLogsBtn) {
		syllabusEmptyImportLogsBtn.addEventListener("click", importFromStudyLogs);
	}

	if (syllabusEmptyImportTemplateBtn) {
		syllabusEmptyImportTemplateBtn.addEventListener("click", importStarterTemplate);
	}

	if (syllabusSubjectForm) {
		syllabusSubjectForm.addEventListener("submit", handleSaveSubject);
	}

	if (closeSubjectModalBtn) {
		closeSubjectModalBtn.addEventListener("click", closeSubjectModal);
	}

	if (cancelSubjectModalBtn) {
		cancelSubjectModalBtn.addEventListener("click", closeSubjectModal);
	}

	if (syllabusSubjectModal) {
		syllabusSubjectModal.addEventListener("click", (e) => {
			if (e.target === syllabusSubjectModal) closeSubjectModal();
		});
	}

	if (syllabusChapterForm) {
		syllabusChapterForm.addEventListener("submit", handleSaveChapter);
	}

	if (closeChapterModalBtn) {
		closeChapterModalBtn.addEventListener("click", closeChapterModal);
	}

	if (cancelChapterModalBtn) {
		cancelChapterModalBtn.addEventListener("click", closeChapterModal);
	}

	if (syllabusChapterModal) {
		syllabusChapterModal.addEventListener("click", (e) => {
			if (e.target === syllabusChapterModal) closeChapterModal();
		});
	}
}

window.initSyllabusEvents = initSyllabusEvents;
window.importFromStudyLogs = importFromStudyLogs;
window.importStarterTemplate = importStarterTemplate;

window.StudyApp.syllabus = {
	loadSyllabus,
	saveSyllabus,
	renderSyllabusPage,
	openSubjectModal,
	closeSubjectModal,
	handleSaveSubject,
	handleDeleteSubject,
	moveSubject,
	openChapterModal,
	closeChapterModal,
	handleSaveChapter,
	handleDeleteChapter,
	moveChapter,
	cycleChapterStatus,
	initSyllabusEvents,
	importFromStudyLogs,
	importStarterTemplate
};
