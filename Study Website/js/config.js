// ==========================================
// CONFIGURATION & CONSTANTS
// ==========================================

window.StudyApp = window.StudyApp || {};

var API_URL = "https://wot-tau.vercel.app"; // local: https://wot-tau.vercel.app
var TASK_VIEW_PREFS_KEY = "studyTaskViewPreferences";
var subjectColors = {
	Malay: "#8B0000",
	English: "#1D3557",
	History: "#D2691E",
	Accounting: "#FFD60A",
	"Modern Mathematics": "#00B4D8",
	Moral: "#6A4C93",
	"Additional Mathematics": "#00B4D8",
	Physics: "#E63946",
	Biology: "#2D6A4F",
	Economy: "#606C38",
	Chemistry: "#6C757D",
	PJPK: "#9EF01A",
	Other: "#64748b"
};
var RBT_ACCENT = "#FFD60A";
var defaultExamsTemplate = [
	{ subject: "Malay 2", date: "2026-04-20T06:55:00" },
	{ subject: "Malay 1", date: "2026-04-20T09:40:00" },
	{ subject: "English 2", date: "2026-04-21T07:45:00" },
	{ subject: "English 1", date: "2026-04-21T09:40:00" },
	{ subject: "History 2", date: "2026-04-22T06:55:00" },
	{ subject: "History 1", date: "2026-04-22T09:45:00" },
	{ subject: "Accounting 2", date: "2026-04-22T11:00:00" },
	{ subject: "Accounting 1", date: "2026-04-22T13:50:00" },
	{ subject: "Modern Mathematics 2", date: "2026-04-23T06:55:00" },
	{ subject: "Modern Mathematics 1", date: "2026-04-23T09:45:00" },
	{ subject: "Moral", date: "2026-04-24T06:55:00" },
	{ subject: "Additional Mathematics 2", date: "2026-05-04T06:55:00" },
	{ subject: "Additional Mathematics 1", date: "2026-05-04T09:45:00" },
	{ subject: "Physics 2", date: "2026-05-05T06:55:00" },
	{ subject: "Physics 1", date: "2026-05-05T09:45:00" },
	{ subject: "Biology 2", date: "2026-05-06T06:55:00" },
	{ subject: "Biology 1", date: "2026-05-06T09:45:00" },
	{ subject: "Chemistry 2", date: "2026-05-07T06:55:00" },
	{ subject: "Chemistry 1", date: "2026-05-07T09:45:00" },
	{ subject: "Economy 1", date: "2026-05-07T11:15:00" },
	{ subject: "Malay Listening", date: "2026-05-08T07:30:00" },
	{ subject: "English Listening", date: "2026-05-08T08:35:00" },
	{ subject: "PJPK", date: "2026-05-08T09:40:00" },
	{ subject: "Economy 2", date: "2026-05-08T11:15:00" },
];
var quotes = [
	"The secret of getting ahead is getting started.",
	"The expert in anything was once a beginner.",
	"Believe you can and you're halfway there.",
	"Well done is better than well said.",
	"Strive for progress, not perfection.",
	"The future belongs to those who believe in the beauty of their dreams.",
	"Success is the sum of small efforts, repeated day in and day out.",
	"Don't watch the clock; do what it does. Keep going.",
	"It does not matter how slowly you go as long as you do not stop.",
	"The pain you feel today will be the strength you feel tomorrow."
];

window.StudyApp.config = {
	API_URL,
	TASK_VIEW_PREFS_KEY,
	subjectColors,
	RBT_ACCENT,
	defaultExamsTemplate,
	quotes
};
