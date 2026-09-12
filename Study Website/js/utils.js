// ==========================================
// UTILITY FUNCTIONS
// ==========================================

window.StudyApp = window.StudyApp || {};

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


	// --- UTILITY FUNCTIONS ---
	function escapeHtml(str) {
		if (str === null || str === undefined) return "";
		return String(str)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");
	}

	const getDateString = (d) => d.toISOString().split("T")[0];
	function hasCustomSubjects() {
		return Array.isArray(syllabus) && syllabus.length > 0;
	}

	function getUserSubjects() {
		if (hasCustomSubjects()) {
			return syllabus.map((s) => s.name);
		}
		return Object.keys(subjectColors || {});
	}

	function getColorForSubject(s) {
		if (!s) return "#64748b";
		const str = String(s).trim();
		// 1. Check user custom syllabus subjects first
		if (Array.isArray(syllabus) && syllabus.length > 0) {
			const exact = syllabus.find((sub) => sub.name && sub.name.trim().toLowerCase() === str.toLowerCase());
			if (exact && exact.color) return exact.color;
			const partial = syllabus.find((sub) => sub.name && (str.toLowerCase().includes(sub.name.trim().toLowerCase()) || sub.name.trim().toLowerCase().includes(str.toLowerCase())));
			if (partial && partial.color) return partial.color;
		}
		// 2. Check default subjectColors
		if (typeof subjectColors === "object" && subjectColors !== null) {
			const match = Object.keys(subjectColors).find((k) => str.toLowerCase().includes(k.toLowerCase()));
			if (match && subjectColors[match]) return subjectColors[match];
			if (subjectColors["Other"]) return subjectColors["Other"];
		}
		return "#00B4D8";
	}

	function populateSubjects() {
		const subjects = getUserSubjects();
		const selects = [
			taskSubjectSelect,
			pomodoroSubjectSelect,
			filterSubjectEl,
			editTaskSubject,
			examSubjectInput,
			finalSubjectInput,
			eventSubjectSelect,
			flashcardSetSubjectInput
		];

		selects.forEach((sel) => {
			if (!sel) return;
			const previousVal = sel.value;

			if (sel.id === "filter-subject") {
				while (sel.options.length > 1) sel.remove(1);
				subjects.forEach((s) => sel.add(new Option(s, s)));
				if (previousVal && (previousVal === "all" || subjects.includes(previousVal))) {
					sel.value = previousVal;
				} else {
					sel.value = "all";
				}
			} else {
				sel.innerHTML = "";
				if (subjects.length === 0) {
					const opt = new Option("No subjects added yet", "");
					opt.disabled = true;
					opt.selected = true;
					sel.add(opt);
				} else {
					subjects.forEach((s) => sel.add(new Option(s, s)));
					if (previousVal && subjects.includes(previousVal)) {
						sel.value = previousVal;
					} else {
						sel.selectedIndex = 0;
					}
				}
			}
		});
	}
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

	function pad(num) {
		return String(num).padStart(2, "0");
	}

window.hasCustomSubjects = hasCustomSubjects;
window.getUserSubjects = getUserSubjects;
window.getColorForSubject = getColorForSubject;
window.populateSubjects = populateSubjects;

window.StudyApp.utils = {
	getGradePillClass,
	suggestGradeFromPercentage,
	suggestGpaFromPercentage,
	calculateGrade,
	escapeHtml,
	getDateString,
	hasCustomSubjects,
	getUserSubjects,
	getColorForSubject,
	populateSubjects,
	formatTime,
	formatLogTime,
	parseMarkdown,
	pad
};
