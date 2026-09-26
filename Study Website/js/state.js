// ==========================================
// APPLICATION STATE
// ==========================================

window.StudyApp = window.StudyApp || {};

var studyChart = null;
var currentDate = new Date();
var events = {};
var customEvents = [];
var googleCalendarConfigs = [];
var googleCalendarEvents = [];
var tasks = [];
var studyLogs = {};
var semesters = [];
var activeSemesterId = null;
var viewingSemesterId = null;
var managingExamsSemesterId = null;
var deletingSemesterId = null;
var selectedDate = null;
var timerInterval = null;
var timeLeft = 25 * 60;
var isPaused = true;
var currentMode = "focus";
var studyStreak = 0;
var lastStudyDay = "";
var currentUser = null;
var taskSubjectFilter = "all";
var taskStatusFilter = "all";
var taskSort = "dueDate";
var taskCollapseState = {};
var editingTaskId = null;
var pipVideoElement = null;
var pipCanvas = null;
var pipContext = null;
var soundLibrary = [];
var ytPlayer = null;
var currentPlayingSoundId = null;
var isYouTubeApiReady = false;
var flashcardSets = [];
var currentFlashcardSet = null;
var currentCardIndex = 0;
var shuffledFlashcards = [];
var sortableInstance = null;
var taskSortableInstance = null;
var subtaskSortableInstances = [];
var soundLibrarySortableInstance = null;
var flashcardSetSortableInstance = null;
var sessionSecondsStudied = 0;
var syllabus = [];
var activeSyllabusSubjectId = null;
var timerEngine = "pomodoro"; // "pomodoro" or "stopwatch"
var stopwatchSeconds = 0;
var activeSessionStartTime = null;
var activeSessionAccumulatedSeconds = 0;
var currentLinkedItem = null;
var studySessions = [];
var notes = [];
var notebooks = [];
var activeNoteId = null;
var activeNotebookId = 'all';
var noteSearchQuery = '';
var noteSubjectFilter = 'all';
var noteTagFilter = 'all';
var noteSortBy = 'updatedAt';
var noteEditorMode = 'edit';
var isNoteDirty = false;
var selectedStudyGroupId = null;
var activeSharedActivityId = null;

if ("Notification" in window && Notification.permission === "default") {
	Notification.requestPermission().then(permission => {
		console.log("Notification permission:", permission);
	});
}

window.StudyApp.state = {
	get studyChart() { return studyChart; },
	set studyChart(v) { studyChart = v; },
	get currentDate() { return currentDate; },
	set currentDate(v) { currentDate = v; },
	get events() { return events; },
	set events(v) { events = v; },
	get customEvents() { return customEvents; },
	set customEvents(v) { customEvents = v; },
	get googleCalendarConfigs() { return googleCalendarConfigs; },
	set googleCalendarConfigs(v) { googleCalendarConfigs = v; },
	get googleCalendarEvents() { return googleCalendarEvents; },
	set googleCalendarEvents(v) { googleCalendarEvents = v; },
	get tasks() { return tasks; },
	set tasks(v) { tasks = v; },
	get studyLogs() { return studyLogs; },
	set studyLogs(v) { studyLogs = v; },
	get semesters() { return semesters; },
	set semesters(v) { semesters = v; },
	get activeSemesterId() { return activeSemesterId; },
	set activeSemesterId(v) { activeSemesterId = v; },
	get viewingSemesterId() { return viewingSemesterId; },
	set viewingSemesterId(v) { viewingSemesterId = v; },
	get managingExamsSemesterId() { return managingExamsSemesterId; },
	set managingExamsSemesterId(v) { managingExamsSemesterId = v; },
	get deletingSemesterId() { return deletingSemesterId; },
	set deletingSemesterId(v) { deletingSemesterId = v; },
	get selectedDate() { return selectedDate; },
	set selectedDate(v) { selectedDate = v; },
	get timerInterval() { return timerInterval; },
	set timerInterval(v) { timerInterval = v; },
	get timeLeft() { return timeLeft; },
	set timeLeft(v) { timeLeft = v; },
	get isPaused() { return isPaused; },
	set isPaused(v) { isPaused = v; },
	get currentMode() { return currentMode; },
	set currentMode(v) { currentMode = v; },
	get studyStreak() { return studyStreak; },
	set studyStreak(v) { studyStreak = v; },
	get lastStudyDay() { return lastStudyDay; },
	set lastStudyDay(v) { lastStudyDay = v; },
	get currentUser() { return currentUser; },
	set currentUser(v) { currentUser = v; },
	get taskSubjectFilter() { return taskSubjectFilter; },
	set taskSubjectFilter(v) { taskSubjectFilter = v; },
	get taskStatusFilter() { return taskStatusFilter; },
	set taskStatusFilter(v) { taskStatusFilter = v; },
	get taskSort() { return taskSort; },
	set taskSort(v) { taskSort = v; },
	get taskCollapseState() { return taskCollapseState; },
	set taskCollapseState(v) { taskCollapseState = v; },
	get editingTaskId() { return editingTaskId; },
	set editingTaskId(v) { editingTaskId = v; },
	get pipVideoElement() { return pipVideoElement; },
	set pipVideoElement(v) { pipVideoElement = v; },
	get pipCanvas() { return pipCanvas; },
	set pipCanvas(v) { pipCanvas = v; },
	get pipContext() { return pipContext; },
	set pipContext(v) { pipContext = v; },
	get soundLibrary() { return soundLibrary; },
	set soundLibrary(v) { soundLibrary = v; },
	get ytPlayer() { return ytPlayer; },
	set ytPlayer(v) { ytPlayer = v; },
	get currentPlayingSoundId() { return currentPlayingSoundId; },
	set currentPlayingSoundId(v) { currentPlayingSoundId = v; },
	get isYouTubeApiReady() { return isYouTubeApiReady; },
	set isYouTubeApiReady(v) { isYouTubeApiReady = v; },
	get flashcardSets() { return flashcardSets; },
	set flashcardSets(v) { flashcardSets = v; },
	get currentFlashcardSet() { return currentFlashcardSet; },
	set currentFlashcardSet(v) { currentFlashcardSet = v; },
	get currentCardIndex() { return currentCardIndex; },
	set currentCardIndex(v) { currentCardIndex = v; },
	get shuffledFlashcards() { return shuffledFlashcards; },
	set shuffledFlashcards(v) { shuffledFlashcards = v; },
	get sortableInstance() { return sortableInstance; },
	set sortableInstance(v) { sortableInstance = v; },
	get taskSortableInstance() { return taskSortableInstance; },
	set taskSortableInstance(v) { taskSortableInstance = v; },
	get subtaskSortableInstances() { return subtaskSortableInstances; },
	set subtaskSortableInstances(v) { subtaskSortableInstances = v; },
	get soundLibrarySortableInstance() { return soundLibrarySortableInstance; },
	set soundLibrarySortableInstance(v) { soundLibrarySortableInstance = v; },
	get flashcardSetSortableInstance() { return flashcardSetSortableInstance; },
	set flashcardSetSortableInstance(v) { flashcardSetSortableInstance = v; },
	get sessionSecondsStudied() { return sessionSecondsStudied; },
	set sessionSecondsStudied(v) { sessionSecondsStudied = v; },
	get syllabus() { return syllabus; },
	set syllabus(v) { syllabus = v; },
	get activeSyllabusSubjectId() { return activeSyllabusSubjectId; },
	set activeSyllabusSubjectId(v) { activeSyllabusSubjectId = v; },
	get timerEngine() { return timerEngine; },
	set timerEngine(v) { timerEngine = v; },
	get stopwatchSeconds() { return stopwatchSeconds; },
	set stopwatchSeconds(v) { stopwatchSeconds = v; },
	get activeSessionStartTime() { return activeSessionStartTime; },
	set activeSessionStartTime(v) { activeSessionStartTime = v; },
	get activeSessionAccumulatedSeconds() { return activeSessionAccumulatedSeconds; },
	set activeSessionAccumulatedSeconds(v) { activeSessionAccumulatedSeconds = v; },
	get currentLinkedItem() { return currentLinkedItem; },
	set currentLinkedItem(v) { currentLinkedItem = v; },
	get studySessions() { return studySessions; },
	set studySessions(v) { studySessions = v; },
	get notes() { return notes; },
	set notes(v) { notes = v; },
	get notebooks() { return notebooks; },
	set notebooks(v) { notebooks = v; },
	get activeNoteId() { return activeNoteId; },
	set activeNoteId(v) { activeNoteId = v; },
	get activeNotebookId() { return activeNotebookId; },
	set activeNotebookId(v) { activeNotebookId = v; },
	get noteSearchQuery() { return noteSearchQuery; },
	set noteSearchQuery(v) { noteSearchQuery = v; },
	get noteSubjectFilter() { return noteSubjectFilter; },
	set noteSubjectFilter(v) { noteSubjectFilter = v; },
	get noteTagFilter() { return noteTagFilter; },
	set noteTagFilter(v) { noteTagFilter = v; },
	get noteSortBy() { return noteSortBy; },
	set noteSortBy(v) { noteSortBy = v; },
	get noteEditorMode() { return noteEditorMode; },
	set noteEditorMode(v) { noteEditorMode = v; },
	get isNoteDirty() { return isNoteDirty; },
	set isNoteDirty(v) { isNoteDirty = v; }
};
