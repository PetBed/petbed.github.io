// ==========================================
// SEMESTER MANAGEMENT & ACADEMIC RECORDS
// ==========================================

window.StudyApp = window.StudyApp || {};

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
			if (typeof hasCustomSubjects === "function" && hasCustomSubjects()) {
				return [];
			}
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
		if (typeof hasCustomSubjects === "function" && hasCustomSubjects()) {
			return allExams;
		}
		return allExams.length > 0 ? allExams : defaultExamsTemplate;
	}

	function getCurrentExams() {
		const activeSem = getActiveSemester();
		if (activeSem && Array.isArray(activeSem.exams)) {
			if (activeSem.exams.length > 0) {
				return activeSem.exams.map((e) => ({ ...e, semesterId: activeSem.id, semesterName: activeSem.name }));
			}
			if (typeof hasCustomSubjects === "function" && hasCustomSubjects()) {
				return [];
			}
		}


		return getAllSemestersExams();
	}


	function cleanupDefaultTemplateExams() {
		if (!Array.isArray(semesters) || !semesters.length) return false;
		let purgedAny = false;
		semesters.forEach((s) => {
			if (Array.isArray(s.exams)) {
				const beforeCount = s.exams.length;
				s.exams = s.exams.filter((ex) => !(ex.id && String(ex.id).startsWith("exam_migrated_") && (ex.mark === null || ex.mark === undefined || ex.mark === "") && !ex.notes));
				if (s.exams.length !== beforeCount) purgedAny = true;
			}
		});
		if (purgedAny) {
			saveSemesters(true);
		}
		return purgedAny;
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

		if (typeof hasCustomSubjects === "function" && hasCustomSubjects()) {
			cleanupDefaultTemplateExams();
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
				exams: (typeof hasCustomSubjects === "function" && hasCustomSubjects()) ? [] : defaultExamsTemplate.map((e, idx) => ({
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

	function openExamsModal(semesterId = null, initialTab = "finals", preselectedSubject = null) {
		const targetId = semesterId || activeSemesterId || (semesters && semesters[0] ? semesters[0].id : null);
		const sem = semesters.find((s) => s.id === targetId);
		if (!sem) return;
		managingExamsSemesterId = targetId;
		if (typeof populateSubjects === "function") populateSubjects();
		switchModalTab(initialTab);
		renderSemesterExamsModal(targetId);
		if (preselectedSubject) {
			if (initialTab === "exams" && examSubjectInput) {
				examSubjectInput.value = preselectedSubject;
			} else if (initialTab === "finals" && finalSubjectInput) {
				finalSubjectInput.value = preselectedSubject;
			}
		}
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
				card.className = `semester-card p-5 rounded-2xl bg-white dark:bg-slate-800 border ${isActive
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
							${isActive
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


function initSemesterEvents() {
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

}

window.initSemesterEvents = initSemesterEvents;
window.openExamsModal = openExamsModal;
window.cleanupDefaultTemplateExams = cleanupDefaultTemplateExams;

window.StudyApp.semesters = {
	getActiveSemester,
	getViewingSemester,
	getSemesterTotalSeconds,
	getSemesterStats,
	getAllSemestersExams,
	getCurrentExams,
	loadSemesters,
	saveSemesters,
	openSemesterModal,
	closeSemesterModal,
	handleSaveSemester,
	setActiveSemester,
	openDeleteSemesterModal,
	closeDeleteSemesterModal,
	handleConfirmDeleteSemester,
	switchModalTab,
	openExamsModal,
	closeExamsModal,
	resetExamForm,
	populateExamFormForEdit,
	handleSaveExam,
	deleteExamFromSemester,
	resetSubjectFinalForm,
	populateSubjectFinalFormForEdit,
	handleSaveSubjectFinal,
	deleteSubjectFinal,
	handleAutoFillFinalFromExams,
	renderSubjectFinalsList,
	renderSemesterExamsModal,
	renderSemesterSection,
	initSemesterEvents
};
