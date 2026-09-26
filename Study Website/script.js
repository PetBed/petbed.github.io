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
	const startupState = window.StudyApp.startupState || {};
	await loadTasks();
	await Promise.all([
		loadStudyLogs(startupState),
		typeof loadStudySessions === "function" ? loadStudySessions() : Promise.resolve(),
		loadStreak(startupState)
	]);
	await loadSemesters();
	checkStreak();
}

const pageDataPromises = {};

function loadPageData(page) {
	if (pageDataPromises[page]) return pageDataPromises[page];
	const loaders = {
		study: () => loadSoundLibrary(window.StudyApp.startupState || {}),
		flashcards: () => loadFlashcardSets(),
		notes: () => typeof loadNotesData === "function" ? loadNotesData() : Promise.resolve(),
		syllabus: () => typeof loadSyllabus === "function" ? loadSyllabus(window.StudyApp.startupState || {}) : Promise.resolve(),
		groups: () => typeof initializeStudyGroups === "function" ? initializeStudyGroups() : Promise.resolve()
	};
	if (!loaders[page]) return Promise.resolve();
	pageDataPromises[page] = Promise.resolve().then(loaders[page]).catch((error) => {
		delete pageDataPromises[page];
		throw error;
	});
	return pageDataPromises[page];
}
window.StudyApp.loadPageData = loadPageData;
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
	if (typeof initNotesEvents === "function") initNotesEvents();

	// 3. Authenticate and initialize the app
	if (typeof checkAuthAndInitialize === "function") {
		checkAuthAndInitialize();
	}
});