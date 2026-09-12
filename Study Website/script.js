// ==========================================
// STUDY DASHBOARD - MAIN APPLICATION ENTRY
// ==========================================

window.StudyApp = window.StudyApp || {};

// Global YouTube iframe API hook required by YouTube API
function onYouTubeIframeAPIReady() {
	window.dispatchEvent(new Event("youtubeApiReady"));
}
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

// Data Management (DB & Local)
async function loadDataFromDB() {
	await loadTasks();
	await loadStudyLogs();
	await loadStreak();
	await loadSoundLibrary();
	await loadFlashcardSets();
	if (typeof loadSyllabus === "function") {
		await loadSyllabus();
	}
	await loadSemesters();
	checkStreak();
}
window.loadDataFromDB = loadDataFromDB;
window.StudyApp.loadDataFromDB = loadDataFromDB;

// Master initialization on DOMContentLoaded
document.addEventListener("DOMContentLoaded", function () {
	// 1. Initialize all DOM elements
	if (typeof initDOM === "function") {
		initDOM();
	}

	// 2. Initialize feature event listeners
	if (typeof initAuthEvents === "function") initAuthEvents();
	if (typeof initSemesterEvents === "function") initSemesterEvents();
	if (typeof initTaskEvents === "function") initTaskEvents();
	if (typeof initCalendarEvents === "function") initCalendarEvents();
	if (typeof initTimerEvents === "function") initTimerEvents();
	if (typeof initSoundEvents === "function") initSoundEvents();
	if (typeof initFlashcardEvents === "function") initFlashcardEvents();
	if (typeof initSyllabusEvents === "function") initSyllabusEvents();

	// 3. Authenticate and initialize the app
	if (typeof checkAuthAndInitialize === "function") {
		checkAuthAndInitialize();
	}
});