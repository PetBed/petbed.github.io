// ==========================================
// OBSIDIAN-STYLED NOTE TAKING & NOTEBOOKS
// ==========================================

window.StudyApp = window.StudyApp || {};

var saveNoteDebounceTimer = null;
var activeNoteTags = [];
var isSavingNote = false;
var wikilinkDropdownIndex = -1;
var wikilinkMatches = [];

// ==========================================
// LOCAL STORAGE & CACHE UTILITIES
// ==========================================
var NOTES_CACHE_KEY = "study_notes_cache";
var NOTEBOOKS_CACHE_KEY = "study_notebooks_cache";

function getCachedNotes() {
	try {
		var data = localStorage.getItem(NOTES_CACHE_KEY);
		return data ? JSON.parse(data) : [];
	} catch (e) {
		return [];
	}
}

function setCachedNotes(notesList) {
	try {
		localStorage.setItem(NOTES_CACHE_KEY, JSON.stringify(notesList));
	} catch (e) {}
}

function getCachedNotebooks() {
	try {
		var data = localStorage.getItem(NOTEBOOKS_CACHE_KEY);
		return data ? JSON.parse(data) : [];
	} catch (e) {
		return [];
	}
}

function setCachedNotebooks(notebooksList) {
	try {
		localStorage.setItem(NOTEBOOKS_CACHE_KEY, JSON.stringify(notebooksList));
	} catch (e) {}
}

// ==========================================
// DATA LOADING & API CALLS
// ==========================================
async function loadNotesData() {
	if (!currentUser) return;

	// Populate from cache first for instantaneous rendering
	var cachedNotes = getCachedNotes();
	var cachedNotebooks = getCachedNotebooks();
	if (cachedNotes.length > 0) notes = cachedNotes;
	if (cachedNotebooks.length > 0) notebooks = cachedNotebooks;

	try {
		var nbPromise = fetch(`${API_URL}/api/study/notebooks?userId=${currentUser.id}`);
		var notesPromise = fetch(`${API_URL}/api/study/notes?userId=${currentUser.id}`);

		var [nbRes, notesRes] = await Promise.all([nbPromise, notesPromise]);

		if (nbRes.ok) {
			var nbData = await nbRes.json();
			notebooks = nbData.notebooks || [];
			setCachedNotebooks(notebooks);
		}

		if (notesRes.ok) {
			var notesData = await notesRes.json();
			notes = notesData.notes || [];
			setCachedNotes(notes);
		}
	} catch (error) {
		console.warn("Could not fetch notes from server, relying on local cache:", error);
	}

	renderNotesPage();
}

// ==========================================
// OBSIDIAN MARKDOWN & WIKILINK PARSING
// ==========================================

// Parse YAML frontmatter from raw markdown
function extractFrontmatter(content) {
	var frontmatter = {};
	var body = content;
	var fmRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
	var match = content.match(fmRegex);

	if (match) {
		var yamlBlock = match[1];
		body = content.replace(fmRegex, "");
		var lines = yamlBlock.split("\n");
		var currentKey = null;

		lines.forEach(function (line) {
			line = line.trim();
			if (!line || line.startsWith("#")) return;

			if (line.startsWith("- ") && currentKey && Array.isArray(frontmatter[currentKey])) {
				frontmatter[currentKey].push(line.replace(/^- \s*/, "").replace(/^['"]|['"]$/g, ""));
				return;
			}

			var colonIndex = line.indexOf(":");
			if (colonIndex !== -1) {
				var key = line.slice(0, colonIndex).trim();
				var val = line.slice(colonIndex + 1).trim();

				if (val === "") {
					frontmatter[key] = [];
					currentKey = key;
				} else {
					frontmatter[key] = val.replace(/^['"]|['"]$/g, "");
					currentKey = key;
				}
			}
		});
	}

	return { frontmatter: frontmatter, body: body };
}

// Build frontmatter string for export
function generateFrontmatter(note) {
	var lines = ["---"];
	lines.push(`title: "${(note.title || 'Untitled Note').replace(/"/g, '\\"')}"`);
	if (note.subject) lines.push(`subject: "${note.subject}"`);
	if (note.tags && note.tags.length > 0) {
		lines.push("tags:");
		note.tags.forEach(function (t) {
			lines.push(`  - ${t.replace(/^#/, "")}`);
		});
	}
	if (note.aliases && note.aliases.length > 0) {
		lines.push("aliases:");
		note.aliases.forEach(function (a) {
			lines.push(`  - "${a}"`);
		});
	}
	if (note.updatedAt) lines.push(`updated: "${new Date(note.updatedAt).toISOString()}"`);
	lines.push("---");
	lines.push("");
	return lines.join("\n");
}

// Convert Obsidian Callouts: > [!type] Title
function processObsidianCallouts(markdownText) {
	var calloutRegex = /^>\s*\[!([a-zA-Z0-9_-]+)\](?:\s*([^\n]*))?\n((?:>.*\n?)*)/gm;

	return markdownText.replace(calloutRegex, function (match, type, title, body) {
		type = type.toLowerCase();
		var displayTitle = title && title.trim() ? title.trim() : (type.charAt(0).toUpperCase() + type.slice(1));
		var cleanedBody = body.replace(/^>\s?/gm, "");

		var calloutClass = "callout-note";
		if (["tip", "success", "check"].includes(type)) calloutClass = "callout-tip";
		else if (["warning", "caution", "attention"].includes(type)) calloutClass = "callout-warning";
		else if (["danger", "error", "bug"].includes(type)) calloutClass = "callout-danger";
		else if (["info", "todo"].includes(type)) calloutClass = "callout-info";
		else if (["example", "quote"].includes(type)) calloutClass = "callout-example";

		return `<div class="obsidian-callout ${calloutClass}">` +
			`<div class="obsidian-callout-header">${escapeHtml(displayTitle)}</div>` +
			`<div class="obsidian-callout-body">${parseMarkdownBasic(cleanedBody)}</div>` +
			`</div>\n`;
	});
}

// Parse markdown helper for callout bodies
function parseMarkdownBasic(text) {
	if (typeof marked !== "undefined" && typeof marked.parse === "function") {
		return marked.parse(text);
	}
	return text;
}

// Convert Obsidian Wikilinks: [[Note Title]] and [[Note Title|Custom Text]]
function processWikilinks(htmlText) {
	// Match [[Target|Alias]] or [[Target]]
	var wikilinkRegex = /\[\[([^\]\|\n]+)(?:\|([^\]\n]+))?\]\]/g;

	return htmlText.replace(wikilinkRegex, function (match, target, alias) {
		target = (target || "").trim();
		var displayText = alias && alias.trim() ? alias.trim() : target;

		// Check if target note exists (by title or alias)
		var noteExists = notes.some(function (n) {
			if (n.title && n.title.toLowerCase() === target.toLowerCase()) return true;
			if (n.aliases && n.aliases.some(function (a) { return a.toLowerCase() === target.toLowerCase(); })) return true;
			return false;
		});

		var notFoundClass = noteExists ? "" : " not-found";
		var tooltip = noteExists ? `Go to "${escapeHtml(target)}"` : `"${escapeHtml(target)}" (Click to create)`;

		return `<a href="javascript:void(0)" class="internal-wikilink${notFoundClass}" data-note-target="${escapeHtml(target)}" title="${tooltip}">` +
			`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block opacity-70"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>` +
			`<span>${escapeHtml(displayText)}</span>` +
			`</a>`;
	});
}

// Process task checklist checkboxes for interactive toggling
function processTaskCheckboxes(htmlText) {
	var index = 0;
	return htmlText.replace(/\[ \]/g, function () {
		return `<input type="checkbox" class="markdown-task-checkbox" data-task-idx="${index++}">`;
	}).replace(/\[x\]/gi, function () {
		return `<input type="checkbox" class="markdown-task-checkbox" checked data-task-idx="${index++}">`;
	});
}

// Full Obsidian Render Pipeline
function renderObsidianMarkdown(rawText) {
	if (!rawText) return '<p class="text-slate-400 italic">Empty note. Start typing...</p>';

	// 1. Separate YAML frontmatter if present
	var parsed = extractFrontmatter(rawText);
	var markdownBody = parsed.body;

	// 2. Process Obsidian callouts
	var withCallouts = processObsidianCallouts(markdownBody);

	// 3. Parse markdown through Marked
	var html = "";
	if (typeof marked !== "undefined" && typeof marked.parse === "function") {
		marked.setOptions({ breaks: true, gfm: true });
		html = marked.parse(withCallouts);
	} else {
		html = withCallouts;
	}

	// 4. Sanitize HTML
	if (typeof DOMPurify !== "undefined" && typeof DOMPurify.sanitize === "function") {
		html = DOMPurify.sanitize(html, {
			ADD_TAGS: ["input"],
			ADD_ATTR: ["type", "checked", "data-task-idx", "data-note-target", "class", "title"]
		});
	}

	// 5. Process Wikilinks: [[Link]] and [[Link|Custom Text]]
	html = processWikilinks(html);

	// 6. Process Task Checkboxes
	html = processTaskCheckboxes(html);

	return html;
}

// ==========================================
// BACKLINKS (LINKED MENTIONS) ENGINE
// ==========================================
function computeBacklinks(targetNote) {
	if (!targetNote || !targetNote.title) return [];

	var titleLower = targetNote.title.trim().toLowerCase();
	var aliases = (targetNote.aliases || []).map(function (a) { return a.toLowerCase(); });
	var backlinks = [];

	notes.forEach(function (n) {
		if (n._id === targetNote._id) return;
		var content = n.content || "";

		// Regex for [[Title]] or [[Title|Alias]]
		var wikilinkRegex = /\[\[([^\]\|\n]+)(?:\|([^\]\n]+))?\]\]/g;
		var match;
		var matchedSnippets = [];

		while ((match = wikilinkRegex.exec(content)) !== null) {
			var linkTarget = (match[1] || "").trim().toLowerCase();
			if (linkTarget === titleLower || aliases.includes(linkTarget)) {
				// Extract snippet surrounding the mention
				var start = Math.max(0, match.index - 50);
				var end = Math.min(content.length, match.index + match[0].length + 50);
				var snippet = (start > 0 ? "..." : "") +
					content.slice(start, end).replace(/\n/g, " ").trim() +
					(end < content.length ? "..." : "");
				matchedSnippets.push(snippet);
			}
		}

		if (matchedSnippets.length > 0) {
			backlinks.push({
				sourceNote: n,
				snippets: matchedSnippets
			});
		}
	});

	return backlinks;
}

// ==========================================
// NOTE STATS CALCULATOR
// ==========================================
function calculateNoteStats(text) {
	if (!text || !text.trim()) {
		return { words: 0, chars: 0, readTime: "0 min read" };
	}
	var cleanText = extractFrontmatter(text).body.trim();
	var words = cleanText ? cleanText.split(/\s+/).filter(Boolean).length : 0;
	var chars = cleanText.length;
	var minutes = Math.ceil(words / 200);
	var readTime = minutes <= 1 ? "1 min read" : `${minutes} min read`;
	return { words: words, chars: chars, readTime: readTime };
}

// ==========================================
// AUTOSAVE & STATE PERSISTENCE
// ==========================================
function markNoteSaving() {
	isSavingNote = true;
	if (noteSaveStatus) {
		noteSaveStatus.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse mr-1.5"></span><span class="text-xs text-slate-500">Saving...</span>';
	}
}

function markNoteSaved() {
	isSavingNote = false;
	isNoteDirty = false;
	if (noteSaveStatus) {
		noteSaveStatus.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span><span class="text-xs text-slate-500">Saved</span>';
	}
}

function queueAutoSave() {
	isNoteDirty = true;
	markNoteSaving();
	clearTimeout(saveNoteDebounceTimer);
	saveNoteDebounceTimer = setTimeout(function () {
		saveCurrentNote();
	}, 800);
}

async function saveCurrentNote() {
	if (!currentUser || !activeNoteId) return;

	var note = notes.find(function (n) { return n._id === activeNoteId; });
	if (!note) return;

	// Gather values from DOM
	var newTitle = noteTitleInput ? (noteTitleInput.value.trim() || "Untitled Note") : note.title;
	var newContent = noteEditorTextarea ? noteEditorTextarea.value : note.content;
	var newSubject = noteSubjectSelect ? noteSubjectSelect.value : note.subject;
	var newNotebookId = noteNotebookSelect ? (noteNotebookSelect.value === "none" ? null : noteNotebookSelect.value) : note.notebookId;

	note.title = newTitle;
	note.content = newContent;
	note.subject = newSubject;
	note.notebookId = newNotebookId;
	note.tags = activeNoteTags;
	note.updatedAt = new Date().toISOString();

	// Update local storage cache immediately
	setCachedNotes(notes);
	renderNotesList();
	updateBacklinksSection();

	// Send update to server
	try {
		var response = await fetch(`${API_URL}/api/study/notes/${note._id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				title: note.title,
				content: note.content,
				subject: note.subject,
				notebookId: note.notebookId,
				tags: note.tags,
				aliases: note.aliases || [],
				isPinned: note.isPinned
			})
		});

		if (response.ok) {
			var data = await response.json();
			if (data && data.note) {
				var idx = notes.findIndex(function (n) { return n._id === activeNoteId; });
				if (idx !== -1) notes[idx] = data.note;
				setCachedNotes(notes);
			}
		}
	} catch (error) {
		console.warn("Failed to sync note to server, cached locally:", error);
	}

	markNoteSaved();
}

// ==========================================
// NOTEBOOK ACTIONS
// ==========================================
function openCreateNotebookModal() {
	if (!notebookModal) return;
	if (notebookIdInput) notebookIdInput.value = "";
	if (notebookNameInput) notebookNameInput.value = "";
	if (notebookDescInput) notebookDescInput.value = "";
	if (notebookColorInput) notebookColorInput.value = "#3b82f6";
	var titleEl = document.getElementById("notebook-modal-title");
	if (titleEl) titleEl.textContent = "New Notebook";
	notebookModal.classList.remove("hidden");
	if (notebookNameInput) notebookNameInput.focus();
}

function openEditNotebookModal(nb) {
	if (!notebookModal || !nb) return;
	if (notebookIdInput) notebookIdInput.value = nb._id;
	if (notebookNameInput) notebookNameInput.value = nb.name;
	if (notebookDescInput) notebookDescInput.value = nb.description || "";
	if (notebookColorInput) notebookColorInput.value = nb.color || "#3b82f6";
	var titleEl = document.getElementById("notebook-modal-title");
	if (titleEl) titleEl.textContent = "Edit Notebook";
	notebookModal.classList.remove("hidden");
	if (notebookNameInput) notebookNameInput.focus();
}

function closeNotebookModal() {
	if (notebookModal) notebookModal.classList.add("hidden");
}

async function handleNotebookFormSubmit(e) {
	e.preventDefault();
	if (!currentUser || !notebookNameInput) return;

	var name = notebookNameInput.value.trim();
	var description = notebookDescInput ? notebookDescInput.value.trim() : "";
	var color = notebookColorInput ? notebookColorInput.value : "#3b82f6";
	var id = notebookIdInput ? notebookIdInput.value : "";

	if (!name) return;

	closeNotebookModal();

	if (id) {
		// Edit
		var idx = notebooks.findIndex(function (n) { return n._id === id; });
		if (idx !== -1) {
			notebooks[idx].name = name;
			notebooks[idx].description = description;
			notebooks[idx].color = color;
			setCachedNotebooks(notebooks);
			renderNotebooksList();
		}
		try {
			await fetch(`${API_URL}/api/study/notebooks/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: name, description: description, color: color })
			});
		} catch (err) {
			console.error("Failed to update notebook on server:", err);
		}
	} else {
		// Create
		var tempId = "temp_nb_" + Date.now();
		var newNb = {
			_id: tempId,
			name: name,
			description: description,
			color: color,
			userId: currentUser.id,
			noteCount: 0,
			createdAt: new Date().toISOString()
		};
		notebooks.push(newNb);
		setCachedNotebooks(notebooks);
		renderNotebooksList();

		try {
			var res = await fetch(`${API_URL}/api/study/notebooks`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: name, description: description, color: color, userId: currentUser.id })
			});
			if (res.ok) {
				var data = await res.json();
				if (data && data.notebook) {
					var foundIdx = notebooks.findIndex(function (n) { return n._id === tempId; });
					if (foundIdx !== -1) notebooks[foundIdx] = data.notebook;
					setCachedNotebooks(notebooks);
					renderNotebooksList();
				}
			}
		} catch (err) {
			console.error("Failed to create notebook on server:", err);
		}
	}
}

async function deleteNotebook(notebookId) {
	var nb = notebooks.find(function (n) { return n._id === notebookId; });
	if (!nb) return;

	if (!confirm(`Delete notebook "${nb.name}"? Notes inside will be moved to Unfiled.`)) {
		return;
	}

	notebooks = notebooks.filter(function (n) { return n._id !== notebookId; });
	notes.forEach(function (note) {
		if (note.notebookId === notebookId) note.notebookId = null;
	});

	if (activeNotebookId === notebookId) activeNotebookId = "all";

	setCachedNotebooks(notebooks);
	setCachedNotes(notes);
	renderNotebooksList();
	renderNotesList();

	try {
		await fetch(`${API_URL}/api/study/notebooks/${notebookId}`, { method: "DELETE" });
	} catch (err) {
		console.error("Failed to delete notebook on server:", err);
	}
}

// ==========================================
// NOTE ACTIONS (CREATE, SELECT, DELETE, PIN)
// ==========================================
async function createNewNote(customTitle, customContent, customNotebookId) {
	if (!currentUser) return;

	var title = customTitle || "Untitled Note";
	var content = customContent || "";
	var targetNb = customNotebookId || (activeNotebookId !== "all" && activeNotebookId !== "unfiled" ? activeNotebookId : null);
	var subject = noteSubjectSelect ? noteSubjectSelect.value : "Other";

	var tempId = "temp_note_" + Date.now();
	var newNote = {
		_id: tempId,
		title: title,
		content: content,
		userId: currentUser.id,
		notebookId: targetNb,
		subject: subject,
		tags: [],
		aliases: [],
		isPinned: false,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	notes.unshift(newNote);
	activeNoteId = newNote._id;
	setCachedNotes(notes);

	renderNotesList();
	selectNote(newNote._id);

	if (noteTitleInput) {
		noteTitleInput.focus();
		noteTitleInput.select();
	}

	try {
		var res = await fetch(`${API_URL}/api/study/notes`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				title: newNote.title,
				content: newNote.content,
				userId: currentUser.id,
				notebookId: newNote.notebookId,
				subject: newNote.subject,
				tags: newNote.tags,
				aliases: newNote.aliases,
				isPinned: newNote.isPinned
			})
		});
		if (res.ok) {
			var data = await res.json();
			if (data && data.note) {
				var idx = notes.findIndex(function (n) { return n._id === tempId; });
				if (idx !== -1) {
					notes[idx] = data.note;
					if (activeNoteId === tempId) activeNoteId = data.note._id;
				}
				setCachedNotes(notes);
				renderNotesList();
			}
		}
	} catch (err) {
		console.warn("Failed to create note on server, saved locally:", err);
	}
}

function selectNote(noteId) {
	activeNoteId = noteId;
	var note = notes.find(function (n) { return n._id === noteId; });

	if (!note) {
		if (activeNoteContainer) activeNoteContainer.classList.add("hidden");
		if (noNoteSelectedPlaceholder) noNoteSelectedPlaceholder.classList.remove("hidden");
		return;
	}

	if (noNoteSelectedPlaceholder) noNoteSelectedPlaceholder.classList.add("hidden");
	if (activeNoteContainer) activeNoteContainer.classList.remove("hidden");

	// Mobile view switch: show editor, hide list on small screens
	var sidebarPane = document.getElementById("notes-sidebar-pane");
	var editorPane = document.getElementById("notes-editor-pane");
	if (window.innerWidth < 768) {
		if (sidebarPane) sidebarPane.classList.add("hidden");
		if (editorPane) editorPane.classList.remove("hidden");
	}

	// Populate editor controls
	if (noteTitleInput) noteTitleInput.value = note.title || "";
	if (noteEditorTextarea) noteEditorTextarea.value = note.content || "";

	activeNoteTags = Array.isArray(note.tags) ? [...note.tags] : [];
	renderActiveNoteTags();

	populateNotebookDropdown();
	if (noteNotebookSelect) {
		noteNotebookSelect.value = note.notebookId ? (note.notebookId._id || note.notebookId) : "none";
	}

	populateNoteSubjectDropdown();
	if (noteSubjectSelect) {
		noteSubjectSelect.value = note.subject || "Other";
		updateSubjectIndicator();
	}

	updatePinButtonState(note.isPinned);
	updateStatsAndPreview();
	updateBacklinksSection();
	markNoteSaved();
	renderNotesList();
}

async function deleteActiveNote() {
	if (!activeNoteId) return;
	var note = notes.find(function (n) { return n._id === activeNoteId; });
	if (!note) return;

	if (!confirm(`Are you sure you want to delete "${note.title || 'Untitled Note'}"?`)) {
		return;
	}

	var deletedId = activeNoteId;
	notes = notes.filter(function (n) { return n._id !== deletedId; });
	setCachedNotes(notes);

	activeNoteId = notes.length > 0 ? notes[0]._id : null;
	renderNotesList();

	if (activeNoteId) {
		selectNote(activeNoteId);
	} else {
		if (activeNoteContainer) activeNoteContainer.classList.add("hidden");
		if (noNoteSelectedPlaceholder) noNoteSelectedPlaceholder.classList.remove("hidden");
	}

	try {
		await fetch(`${API_URL}/api/study/notes/${deletedId}`, { method: "DELETE" });
	} catch (err) {
		console.error("Failed to delete note on server:", err);
	}
}

function togglePinActiveNote() {
	if (!activeNoteId) return;
	var note = notes.find(function (n) { return n._id === activeNoteId; });
	if (!note) return;

	note.isPinned = !note.isPinned;
	updatePinButtonState(note.isPinned);
	queueAutoSave();
	renderNotesList();
}

function updatePinButtonState(isPinned) {
	if (!notePinBtn) return;
	if (isPinned) {
		notePinBtn.classList.add("text-blue-600", "dark:text-blue-400", "bg-blue-50", "dark:bg-blue-900/30");
		notePinBtn.classList.remove("text-slate-500", "dark:text-slate-400");
		notePinBtn.title = "Unpin Note";
	} else {
		notePinBtn.classList.remove("text-blue-600", "dark:text-blue-400", "bg-blue-50", "dark:bg-blue-900/30");
		notePinBtn.classList.add("text-slate-500", "dark:text-slate-400");
		notePinBtn.title = "Pin Note to Top";
	}
}

// ==========================================
// TAGS MANAGEMENT
// ==========================================
function renderActiveNoteTags() {
	if (!noteTagsList) return;
	noteTagsList.innerHTML = "";

	activeNoteTags.forEach(function (tag, index) {
		var pill = document.createElement("span");
		pill.className = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600";
		pill.innerHTML = `<span>#${escapeHtml(tag.replace(/^#/, ''))}</span>` +
			`<button type="button" class="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 ml-0.5 leading-none" data-tag-remove="${index}">&times;</button>`;

		pill.querySelector("button").addEventListener("click", function (e) {
			e.stopPropagation();
			activeNoteTags.splice(index, 1);
			renderActiveNoteTags();
			queueAutoSave();
		});

		noteTagsList.appendChild(pill);
	});
}

function addTagToActiveNote(rawTag) {
	var clean = rawTag.trim().replace(/^[#\s]+/, "");
	if (!clean) return;
	if (!activeNoteTags.includes(clean)) {
		activeNoteTags.push(clean);
		renderActiveNoteTags();
		queueAutoSave();
	}
}

// ==========================================
// EDITOR MODES & SPLIT VIEW
// ==========================================
function setEditorMode(mode) {
	noteEditorMode = mode;

	var editorCol = document.getElementById("note-editor-col");
	var previewCol = document.getElementById("note-preview-col");
	var splitDivider = document.getElementById("note-split-divider");

	if (!editorCol || !previewCol) return;

	// Reset mode button states
	[noteModeEditBtn, noteModeSplitBtn, noteModePreviewBtn].forEach(function (btn) {
		if (btn) btn.classList.remove("active", "bg-white", "dark:bg-slate-700", "text-blue-600", "dark:text-blue-400", "shadow-xs");
	});

	if (mode === "edit") {
		editorCol.classList.remove("hidden");
		editorCol.className = "flex-1 flex flex-col min-w-0";
		previewCol.classList.add("hidden");
		if (splitDivider) splitDivider.classList.add("hidden");
		if (noteModeEditBtn) noteModeEditBtn.classList.add("active", "bg-white", "dark:bg-slate-700", "text-blue-600", "dark:text-blue-400", "shadow-xs");
	} else if (mode === "preview") {
		editorCol.classList.add("hidden");
		previewCol.classList.remove("hidden");
		previewCol.className = "flex-1 flex flex-col min-w-0 overflow-y-auto";
		if (splitDivider) splitDivider.classList.add("hidden");
		if (noteModePreviewBtn) noteModePreviewBtn.classList.add("active", "bg-white", "dark:bg-slate-700", "text-blue-600", "dark:text-blue-400", "shadow-xs");
		updateStatsAndPreview();
	} else {
		// Split mode
		editorCol.classList.remove("hidden");
		editorCol.className = "w-full md:w-1/2 flex flex-col min-w-0 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700";
		previewCol.classList.remove("hidden");
		previewCol.className = "w-full md:w-1/2 flex flex-col min-w-0 overflow-y-auto";
		if (splitDivider) splitDivider.classList.remove("hidden");
		if (noteModeSplitBtn) noteModeSplitBtn.classList.add("active", "bg-white", "dark:bg-slate-700", "text-blue-600", "dark:text-blue-400", "shadow-xs");
		updateStatsAndPreview();
	}
}

// Update stats and preview HTML
function updateStatsAndPreview() {
	var raw = noteEditorTextarea ? noteEditorTextarea.value : "";
	var stats = calculateNoteStats(raw);

	if (noteWordCount) noteWordCount.textContent = `${stats.words} words`;
	if (noteCharCount) noteCharCount.textContent = `${stats.chars} chars`;
	if (noteReadTime) noteReadTime.textContent = stats.readTime;

	if (notePreviewContainer) {
		notePreviewContainer.innerHTML = renderObsidianMarkdown(raw);
		attachPreviewInteractions();
	}
}

// Attach interactive wikilinks and checkbox click events to preview
function attachPreviewInteractions() {
	if (!notePreviewContainer) return;

	// Wikilink clicks
	var wikilinks = notePreviewContainer.querySelectorAll(".internal-wikilink");
	wikilinks.forEach(function (link) {
		link.addEventListener("click", function (e) {
			e.preventDefault();
			var target = link.getAttribute("data-note-target");
			if (!target) return;

			var existing = notes.find(function (n) {
				if (n.title && n.title.toLowerCase() === target.toLowerCase()) return true;
				if (n.aliases && n.aliases.some(function (a) { return a.toLowerCase() === target.toLowerCase(); })) return true;
				return false;
			});

			if (existing) {
				selectNote(existing._id);
			} else {
				if (confirm(`Note "${target}" does not exist yet. Create it now?`)) {
					createNewNote(target, `# ${target}\n\n`);
				}
			}
		});
	});

	// Task checkbox toggling
	var checkboxes = notePreviewContainer.querySelectorAll(".markdown-task-checkbox");
	checkboxes.forEach(function (cb) {
		cb.addEventListener("change", function () {
			var targetIdx = parseInt(cb.getAttribute("data-task-idx"), 10);
			toggleMarkdownTask(targetIdx, cb.checked);
		});
	});
}

// Toggle task in raw markdown
function toggleMarkdownTask(targetIdx, isChecked) {
	if (!noteEditorTextarea) return;
	var raw = noteEditorTextarea.value;
	var currentIdx = 0;
	var taskRegex = /\[([ xX])\]/g;

	var updated = raw.replace(taskRegex, function (match, checkState) {
		if (currentIdx === targetIdx) {
			currentIdx++;
			return isChecked ? "[x]" : "[ ]";
		}
		currentIdx++;
		return match;
	});

	noteEditorTextarea.value = updated;
	queueAutoSave();
}

// ==========================================
// TOOLBAR ACTIONS & KEYBINDS
// ==========================================
function insertFormatting(prefix, suffix, defaultText) {
	if (!noteEditorTextarea) return;
	var textarea = noteEditorTextarea;
	var start = textarea.selectionStart;
	var end = textarea.selectionEnd;
	var text = textarea.value;
	var selectedText = text.substring(start, end) || defaultText;

	var replacement = prefix + selectedText + suffix;
	textarea.setRangeText(replacement, start, end, "select");
	textarea.focus();

	// If defaultText was used, select default text so user can immediately overwrite it
	if (!text.substring(start, end)) {
		textarea.selectionStart = start + prefix.length;
		textarea.selectionEnd = start + prefix.length + defaultText.length;
	}

	updateStatsAndPreview();
	queueAutoSave();
}

function insertLinePrefix(linePrefix) {
	if (!noteEditorTextarea) return;
	var textarea = noteEditorTextarea;
	var start = textarea.selectionStart;
	var end = textarea.selectionEnd;
	var text = textarea.value;

	var lineStart = text.lastIndexOf("\n", start - 1) + 1;
	var before = text.substring(0, lineStart);
	var lineAndAfter = text.substring(lineStart);

	textarea.value = before + linePrefix + lineAndAfter;
	textarea.selectionStart = start + linePrefix.length;
	textarea.selectionEnd = end + linePrefix.length;
	textarea.focus();

	updateStatsAndPreview();
	queueAutoSave();
}

function insertTable() {
	var tableTemplate = "\n| Column 1 | Column 2 | Column 3 |\n| :--- | :--- | :--- |\n| Item 1 | Item 2 | Item 3 |\n| Item 4 | Item 5 | Item 6 |\n";
	insertFormatting(tableTemplate, "", "");
}

function insertCallout(type) {
	var template = `\n> [!${type || "note"}] Title\n> Contents of the callout.\n`;
	insertFormatting(template, "", "");
}

function handleEditorKeydown(e) {
	if (!noteEditorTextarea) return;

	// Autocomplete navigation when dropdown is open
	if (wikilinkSuggestPopover && !wikilinkSuggestPopover.classList.contains("hidden")) {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			wikilinkDropdownIndex = Math.min(wikilinkDropdownIndex + 1, wikilinkMatches.length - 1);
			renderWikilinkSuggestions();
			return;
		}
		if (e.key === "ArrowUp") {
			e.preventDefault();
			wikilinkDropdownIndex = Math.max(wikilinkDropdownIndex - 1, 0);
			renderWikilinkSuggestions();
			return;
		}
		if (e.key === "Enter" || e.key === "Tab") {
			if (wikilinkDropdownIndex >= 0 && wikilinkMatches[wikilinkDropdownIndex]) {
				e.preventDefault();
				insertWikilinkFromSuggestion(wikilinkMatches[wikilinkDropdownIndex].title);
				return;
			}
		}
		if (e.key === "Escape") {
			closeWikilinkSuggestions();
			return;
		}
	}

	// Keyboard shortcuts
	var isCtrlOrCmd = e.ctrlKey || e.metaKey;

	if (isCtrlOrCmd && e.key.toLowerCase() === "b") {
		e.preventDefault();
		insertFormatting("**", "**", "bold text");
	} else if (isCtrlOrCmd && e.key.toLowerCase() === "i") {
		e.preventDefault();
		insertFormatting("*", "*", "italic text");
	} else if (isCtrlOrCmd && e.key.toLowerCase() === "k") {
		e.preventDefault();
		insertFormatting("[", "](https://)", "link text");
	} else if (isCtrlOrCmd && (e.key.toLowerCase() === "s" || e.key === "S")) {
		e.preventDefault();
		saveCurrentNote();
	} else if (isCtrlOrCmd && e.key.toLowerCase() === "e") {
		e.preventDefault();
		setEditorMode(noteEditorMode === "edit" ? "preview" : "edit");
	} else if (isCtrlOrCmd && e.shiftKey && e.key.toLowerCase() === "l") {
		e.preventDefault();
		insertFormatting("[[", "]]", "Note Title");
	} else if (e.key === "Tab") {
		e.preventDefault();
		insertFormatting("  ", "", "");
	}
}

// Wikilink Autocomplete Popover
function checkWikilinkTrigger() {
	if (!noteEditorTextarea || !wikilinkSuggestPopover) return;
	var textarea = noteEditorTextarea;
	var cursor = textarea.selectionStart;
	var textBefore = textarea.value.substring(0, cursor);

	var lastDoubleBracket = textBefore.lastIndexOf("[[");
	if (lastDoubleBracket !== -1 && lastDoubleBracket >= cursor - 30) {
		var query = textBefore.substring(lastDoubleBracket + 2);
		// Check that there is no closing bracket before cursor
		if (!query.includes("]") && !query.includes("\n")) {
			showWikilinkSuggestions(query.trim().toLowerCase());
			return;
		}
	}
	closeWikilinkSuggestions();
}

function showWikilinkSuggestions(filterText) {
	if (!wikilinkSuggestPopover) return;
	wikilinkMatches = notes.filter(function (n) {
		if (n._id === activeNoteId) return false;
		if (!filterText) return true;
		return (n.title || "").toLowerCase().includes(filterText);
	}).slice(0, 6);

	if (wikilinkMatches.length === 0) {
		closeWikilinkSuggestions();
		return;
	}

	wikilinkDropdownIndex = 0;
	renderWikilinkSuggestions();
	wikilinkSuggestPopover.classList.remove("hidden");
}

function renderWikilinkSuggestions() {
	if (!wikilinkSuggestPopover) return;
	wikilinkSuggestPopover.innerHTML = "";

	wikilinkMatches.forEach(function (match, i) {
		var item = document.createElement("button");
		item.type = "button";
		item.className = "w-full text-left px-3 py-1.5 text-xs flex items-center justify-between rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition" +
			(i === wikilinkDropdownIndex ? " bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-medium" : " text-slate-700 dark:text-slate-300");

		item.innerHTML = `<span class="truncate">${escapeHtml(match.title || "Untitled")}</span>` +
			`<span class="text-[10px] text-slate-400 ml-2 uppercase">${escapeHtml(match.subject || "Note")}</span>`;

		item.addEventListener("mousedown", function (e) {
			e.preventDefault();
			insertWikilinkFromSuggestion(match.title);
		});

		wikilinkSuggestPopover.appendChild(item);
	});
}

function insertWikilinkFromSuggestion(title) {
	if (!noteEditorTextarea) return;
	var textarea = noteEditorTextarea;
	var cursor = textarea.selectionStart;
	var text = textarea.value;
	var lastDoubleBracket = text.substring(0, cursor).lastIndexOf("[[");

	if (lastDoubleBracket !== -1) {
		var before = text.substring(0, lastDoubleBracket);
		var after = text.substring(cursor);
		var insertion = `[[${title}]]`;
		textarea.value = before + insertion + after;
		textarea.selectionStart = textarea.selectionEnd = before.length + insertion.length;
	}
	closeWikilinkSuggestions();
	updateStatsAndPreview();
	queueAutoSave();
}

function closeWikilinkSuggestions() {
	if (wikilinkSuggestPopover) wikilinkSuggestPopover.classList.add("hidden");
	wikilinkMatches = [];
	wikilinkDropdownIndex = -1;
}

// ==========================================
// BACKLINKS UI
// ==========================================
function updateBacklinksSection() {
	if (!noteBacklinksContainer || !noteBacklinksList) return;

	var activeNote = notes.find(function (n) { return n._id === activeNoteId; });
	if (!activeNote) {
		noteBacklinksContainer.classList.add("hidden");
		return;
	}

	var backlinks = computeBacklinks(activeNote);
	var countEl = document.getElementById("note-backlinks-count");
	if (countEl) countEl.textContent = backlinks.length;

	noteBacklinksList.innerHTML = "";

	if (backlinks.length === 0) {
		noteBacklinksList.innerHTML = '<p class="text-xs text-slate-400 italic p-2">No other notes link to this note yet. Use [[Note Title]] to link notes together.</p>';
		return;
	}

	backlinks.forEach(function (bl) {
		var card = document.createElement("div");
		card.className = "p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition";

		var subjectBadge = bl.sourceNote.subject ?
			`<span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 font-semibold">${escapeHtml(bl.sourceNote.subject)}</span>` : "";

		card.innerHTML = `<div class="flex items-center justify-between gap-2 mb-1">` +
			`<span class="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">${escapeHtml(bl.sourceNote.title || 'Untitled')}</span>` +
			`${subjectBadge}` +
			`</div>` +
			`<div class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 italic">${escapeHtml(bl.snippets[0] || "")}</div>`;

		card.addEventListener("click", function () {
			selectNote(bl.sourceNote._id);
		});

		noteBacklinksList.appendChild(card);
	});
}

// ==========================================
// IMPORT & EXPORT (OBSIDIAN COMPATIBILITY)
// ==========================================
function exportActiveNoteAsMarkdown() {
	var note = notes.find(function (n) { return n._id === activeNoteId; });
	if (!note) return;

	var frontmatter = generateFrontmatter(note);
	var fullContent = frontmatter + (note.content || "");
	var fileName = `${(note.title || "Untitled").replace(/[^a-zA-Z0-9_\-]/g, "_")}.md`;

	var blob = new Blob([fullContent], { type: "text/markdown;charset=utf-8;" });
	var link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = fileName;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

function copyActiveNoteMarkdown() {
	var note = notes.find(function (n) { return n._id === activeNoteId; });
	if (!note) return;

	var frontmatter = generateFrontmatter(note);
	var fullContent = frontmatter + (note.content || "");

	navigator.clipboard.writeText(fullContent).then(function () {
		alert("Obsidian markdown copied to clipboard!");
	}).catch(function (err) {
		console.error("Copy failed:", err);
	});
}

function triggerImportMarkdown() {
	if (noteImportInput) noteImportInput.click();
}

async function handleImportMarkdownFiles(e) {
	var files = e.target.files;
	if (!files || files.length === 0) return;

	var importedNotes = [];

	for (var i = 0; i < files.length; i++) {
		var file = files[i];
		var text = await file.text();
		var titleFromName = file.name.replace(/\.md$/i, "");
		var parsed = extractFrontmatter(text);

		var title = parsed.frontmatter.title || titleFromName;
		var subject = parsed.frontmatter.subject || (noteSubjectSelect ? noteSubjectSelect.value : "Other");
		var tags = Array.isArray(parsed.frontmatter.tags) ? parsed.frontmatter.tags : [];
		var aliases = Array.isArray(parsed.frontmatter.aliases) ? parsed.frontmatter.aliases : [];

		importedNotes.push({
			title: title,
			content: parsed.body,
			subject: subject,
			tags: tags,
			aliases: aliases,
			notebookId: activeNotebookId !== "all" && activeNotebookId !== "unfiled" ? activeNotebookId : null
		});
	}

	e.target.value = "";

	if (importedNotes.length === 0) return;

	try {
		var res = await fetch(`${API_URL}/api/study/notes/import`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId: currentUser.id, notes: importedNotes })
		});
		if (res.ok) {
			var data = await res.json();
			if (data && data.notes) {
				notes = data.notes.concat(notes);
				setCachedNotes(notes);
				renderNotesList();
				if (notes.length > 0) selectNote(notes[0]._id);
			}
		}
	} catch (err) {
		console.error("Server import failed, importing locally:", err);
		importedNotes.forEach(function (n) {
			n._id = "local_imp_" + Date.now() + Math.random().toString(36).substr(2, 4);
			n.userId = currentUser.id;
			n.isPinned = false;
			n.createdAt = new Date().toISOString();
			n.updatedAt = new Date().toISOString();
			notes.unshift(n);
		});
		setCachedNotes(notes);
		renderNotesList();
		if (notes.length > 0) selectNote(notes[0]._id);
	}
}

// ==========================================
// RENDERING & UI UPDATES
// ==========================================
function renderNotesPage() {
	populateNotebookDropdown();
	populateNoteSubjectDropdown();
	populateSubjectFilterDropdown();
	renderNotebooksList();
	renderNotesList();

	if (notes.length > 0 && !activeNoteId) {
		selectNote(notes[0]._id);
	} else if (activeNoteId) {
		selectNote(activeNoteId);
	} else {
		if (activeNoteContainer) activeNoteContainer.classList.add("hidden");
		if (noNoteSelectedPlaceholder) noNoteSelectedPlaceholder.classList.remove("hidden");
	}
}

function renderNotebooksList() {
	if (!notebooksListEl) return;
	notebooksListEl.innerHTML = "";

	var totalNotes = notes.length;
	var unfiledNotes = notes.filter(function (n) { return !n.notebookId; }).length;

	// 1. "All Notes" item
	var allItem = createNotebookPill("all", "All Notes", totalNotes, activeNotebookId === "all");
	notebooksListEl.appendChild(allItem);

	// 2. User notebooks
	notebooks.forEach(function (nb) {
		var count = notes.filter(function (n) {
			var nId = n.notebookId ? (n.notebookId._id || n.notebookId) : null;
			return nId === nb._id;
		}).length;

		var item = createNotebookPill(nb._id, nb.name, count, activeNotebookId === nb._id, nb);
		notebooksListEl.appendChild(item);
	});

	// 3. "Unfiled" item
	var unfiledItem = createNotebookPill("unfiled", "Unfiled", unfiledNotes, activeNotebookId === "unfiled");
	notebooksListEl.appendChild(unfiledItem);
}

function createNotebookPill(id, name, count, isActive, notebookObj) {
	var container = document.createElement("div");
	container.className = "flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition text-xs font-medium group " +
		(isActive ? "notebook-pill active-notebook" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60");

	var left = document.createElement("div");
	left.className = "flex items-center gap-2 truncate";

	var iconColor = notebookObj ? (notebookObj.color || "#3b82f6") : "#94a3b8";
	left.innerHTML = `<span class="w-2 h-2 rounded-full flex-shrink-0" style="background-color: ${iconColor};"></span>` +
		`<span class="truncate">${escapeHtml(name)}</span>`;

	var right = document.createElement("div");
	right.className = "flex items-center gap-1.5 flex-shrink-0";

	var badge = document.createElement("span");
	badge.className = "text-[11px] px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-semibold";
	badge.textContent = count;
	right.appendChild(badge);

	if (notebookObj) {
		var editBtn = document.createElement("button");
		editBtn.type = "button";
		editBtn.className = "opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition p-0.5";
		editBtn.title = "Edit Notebook";
		editBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;
		editBtn.addEventListener("click", function (e) {
			e.stopPropagation();
			openEditNotebookModal(notebookObj);
		});

		var delBtn = document.createElement("button");
		delBtn.type = "button";
		delBtn.className = "opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition p-0.5";
		delBtn.title = "Delete Notebook";
		delBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
		delBtn.addEventListener("click", function (e) {
			e.stopPropagation();
			deleteNotebook(notebookObj._id);
		});

		right.appendChild(editBtn);
		right.appendChild(delBtn);
	}

	container.appendChild(left);
	container.appendChild(right);

	container.addEventListener("click", function () {
		activeNotebookId = id;
		renderNotebooksList();
		renderNotesList();
	});

	return container;
}

function renderNotesList() {
	if (!notesListContainer) return;

	var filtered = notes.filter(function (n) {
		// 1. Notebook filter
		if (activeNotebookId === "unfiled" && n.notebookId) return false;
		if (activeNotebookId !== "all" && activeNotebookId !== "unfiled") {
			var nId = n.notebookId ? (n.notebookId._id || n.notebookId) : null;
			if (nId !== activeNotebookId) return false;
		}

		// 2. Subject filter
		if (noteSubjectFilter !== "all" && n.subject !== noteSubjectFilter) return false;

		// 3. Tag filter
		if (noteTagFilter !== "all") {
			if (!n.tags || !n.tags.includes(noteTagFilter)) return false;
		}

		// 4. Search query
		if (noteSearchQuery && noteSearchQuery.trim()) {
			var q = noteSearchQuery.trim().toLowerCase();
			var titleMatch = (n.title || "").toLowerCase().includes(q);
			var contentMatch = (n.content || "").toLowerCase().includes(q);
			var tagsMatch = (n.tags || []).some(function (t) { return t.toLowerCase().includes(q); });
			var aliasMatch = (n.aliases || []).some(function (a) { return a.toLowerCase().includes(q); });
			if (!titleMatch && !contentMatch && !tagsMatch && !aliasMatch) return false;
		}

		return true;
	});

	// Sorting
	filtered.sort(function (a, b) {
		// Pinned notes always at top
		if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;

		if (noteSortBy === "createdAt") {
			return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
		} else if (noteSortBy === "titleAsc") {
			return (a.title || "").localeCompare(b.title || "");
		} else if (noteSortBy === "titleDesc") {
			return (b.title || "").localeCompare(a.title || "");
		} else {
			// updatedAt
			return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
		}
	});

	if (notesCountBadge) {
		notesCountBadge.textContent = `${filtered.length} notes`;
	}

	notesListContainer.innerHTML = "";

	if (filtered.length === 0) {
		notesListContainer.innerHTML = '<div class="p-6 text-center text-slate-400 text-xs">' +
			'<svg class="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>' +
			'<p class="font-medium">No notes found</p>' +
			'<p class="text-[11px] mt-1 text-slate-400">Create a new note or clear your search filter.</p>' +
			'</div>';
		return;
	}

	filtered.forEach(function (note) {
		var card = createNoteCard(note);
		notesListContainer.appendChild(card);
	});
}

function createNoteCard(note) {
	var card = document.createElement("div");
	var isActive = note._id === activeNoteId;
	card.className = "note-card p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-xs cursor-pointer transition hover:border-blue-400 dark:hover:border-blue-500 " +
		(isActive ? "active-note" : "");

	// Extract snippet
	var parsed = extractFrontmatter(note.content || "");
	var snippet = parsed.body.replace(/[#*`_~>[\]]/g, "").trim().replace(/\s+/g, " ").slice(0, 85);
	if (!snippet) snippet = "No additional text...";

	// Format relative date
	var dateStr = formatRelativeTime(note.updatedAt || note.createdAt);

	// Subject badge color
	var subjColor = getColorForSubject(note.subject || "Other");

	var pinHtml = note.isPinned ?
		`<svg class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>` : "";

	var tagsHtml = (note.tags || []).slice(0, 3).map(function (t) {
		return `<span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">#${escapeHtml(t.replace(/^#/, ''))}</span>`;
	}).join(" ");

	card.innerHTML = `<div class="flex items-start justify-between gap-1 mb-1">` +
		`<h4 class="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">${escapeHtml(note.title || 'Untitled Note')}</h4>` +
		`${pinHtml}` +
		`</div>` +
		`<p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2 leading-relaxed">${escapeHtml(snippet)}</p>` +
		`<div class="flex items-center justify-between text-[11px] text-slate-400">` +
		`<div class="flex items-center gap-1.5 overflow-hidden">` +
		`<span class="w-2 h-2 rounded-full flex-shrink-0" style="background-color: ${subjColor};"></span>` +
		`<span class="truncate text-[10px] text-slate-500 dark:text-slate-400 font-medium">${escapeHtml(note.subject || 'Other')}</span>` +
		tagsHtml +
		`</div>` +
		`<span class="text-[10px] whitespace-nowrap ml-2">${dateStr}</span>` +
		`</div>`;

	card.addEventListener("click", function () {
		selectNote(note._id);
	});

	return card;
}

function formatRelativeTime(isoDate) {
	if (!isoDate) return "";
	var now = new Date();
	var date = new Date(isoDate);
	var diffSec = Math.floor((now - date) / 1000);

	if (diffSec < 60) return "Just now";
	if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
	if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
	if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

	return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ==========================================
// DROPDOWNS & METADATA HELPERS
// ==========================================
function populateNotebookDropdown() {
	if (!noteNotebookSelect) return;
	var currentVal = noteNotebookSelect.value;
	noteNotebookSelect.innerHTML = '<option value="none">No Notebook (Unfiled)</option>';

	notebooks.forEach(function (nb) {
		var opt = document.createElement("option");
		opt.value = nb._id;
		opt.textContent = nb.name;
		noteNotebookSelect.appendChild(opt);
	});

	if (currentVal) noteNotebookSelect.value = currentVal;
}

function populateNoteSubjectDropdown() {
	if (!noteSubjectSelect) return;
	var subjects = getUserSubjects();
	noteSubjectSelect.innerHTML = "";

	subjects.forEach(function (subj) {
		var opt = document.createElement("option");
		opt.value = subj;
		opt.textContent = subj;
		noteSubjectSelect.appendChild(opt);
	});
}

function populateSubjectFilterDropdown() {
	if (!noteSubjectFilterEl) return;
	var subjects = getUserSubjects();
	noteSubjectFilterEl.innerHTML = '<option value="all">All Subjects</option>';

	subjects.forEach(function (subj) {
		var opt = document.createElement("option");
		opt.value = subj;
		opt.textContent = subj;
		noteSubjectFilterEl.appendChild(opt);
	});
}

function updateSubjectIndicator() {
	var dot = document.getElementById("note-subject-dot");
	if (dot && noteSubjectSelect) {
		dot.style.backgroundColor = getColorForSubject(noteSubjectSelect.value);
	}
}

// ==========================================
// EVENT LISTENERS INITIALIZATION
// ==========================================
function initNotesEvents() {
	// Top Header Buttons
	if (newNoteBtn) newNoteBtn.addEventListener("click", function () { createNewNote(); });
	if (newNotebookBtn) newNotebookBtn.addEventListener("click", openCreateNotebookModal);

	// Empty State create note button
	var emptyCreateBtn = document.getElementById("notes-empty-create-btn");
	if (emptyCreateBtn) emptyCreateBtn.addEventListener("click", function () { createNewNote(); });

	// Search & Filters
	if (notesSearchInput) {
		notesSearchInput.addEventListener("input", function (e) {
			noteSearchQuery = e.target.value;
			if (clearNotesSearchBtn) {
				clearNotesSearchBtn.classList.toggle("hidden", !noteSearchQuery);
			}
			renderNotesList();
		});
	}

	if (clearNotesSearchBtn) {
		clearNotesSearchBtn.addEventListener("click", function () {
			if (notesSearchInput) notesSearchInput.value = "";
			noteSearchQuery = "";
			clearNotesSearchBtn.classList.add("hidden");
			renderNotesList();
		});
	}

	if (noteSubjectFilterEl) {
		noteSubjectFilterEl.addEventListener("change", function (e) {
			noteSubjectFilter = e.target.value;
			renderNotesList();
		});
	}

	if (noteSortEl) {
		noteSortEl.addEventListener("change", function (e) {
			noteSortBy = e.target.value;
			renderNotesList();
		});
	}

	// Active Note Inputs
	if (noteTitleInput) {
		noteTitleInput.addEventListener("input", function () {
			var note = notes.find(function (n) { return n._id === activeNoteId; });
			if (note) note.title = noteTitleInput.value.trim() || "Untitled Note";
			queueAutoSave();
		});
	}

	if (noteEditorTextarea) {
		noteEditorTextarea.addEventListener("input", function () {
			var note = notes.find(function (n) { return n._id === activeNoteId; });
			if (note) note.content = noteEditorTextarea.value;
			updateStatsAndPreview();
			checkWikilinkTrigger();
			queueAutoSave();
		});

		noteEditorTextarea.addEventListener("keydown", handleEditorKeydown);
	}

	if (noteSubjectSelect) {
		noteSubjectSelect.addEventListener("change", function () {
			updateSubjectIndicator();
			queueAutoSave();
		});
	}

	if (noteNotebookSelect) {
		noteNotebookSelect.addEventListener("change", function () {
			queueAutoSave();
			renderNotebooksList();
		});
	}

	// Tags input
	if (noteTagInput) {
		noteTagInput.addEventListener("keydown", function (e) {
			if (e.key === "Enter" || e.key === ",") {
				e.preventDefault();
				addTagToActiveNote(noteTagInput.value);
				noteTagInput.value = "";
			}
		});
	}

	// Pin & Delete
	if (notePinBtn) notePinBtn.addEventListener("click", togglePinActiveNote);
	if (noteDeleteBtn) noteDeleteBtn.addEventListener("click", deleteActiveNote);

	// Mode buttons
	if (noteModeEditBtn) noteModeEditBtn.addEventListener("click", function () { setEditorMode("edit"); });
	if (noteModePreviewBtn) noteModePreviewBtn.addEventListener("click", function () { setEditorMode("preview"); });
	if (noteModeSplitBtn) noteModeSplitBtn.addEventListener("click", function () { setEditorMode("split"); });

	// Mobile Back Button
	if (noteMobileBackBtn) {
		noteMobileBackBtn.addEventListener("click", function () {
			var sidebarPane = document.getElementById("notes-sidebar-pane");
			var editorPane = document.getElementById("notes-editor-pane");
			if (sidebarPane) sidebarPane.classList.remove("hidden");
			if (editorPane) editorPane.classList.add("hidden");
		});
	}

	// Toolbar formatting buttons
	initToolbarEvents();

	// Import / Export
	if (noteExportBtn) noteExportBtn.addEventListener("click", exportActiveNoteAsMarkdown);
	var copyMdBtn = document.getElementById("note-copy-md-btn");
	if (copyMdBtn) copyMdBtn.addEventListener("click", copyActiveNoteMarkdown);
	var importBtn = document.getElementById("note-import-btn");
	if (importBtn) importBtn.addEventListener("click", triggerImportMarkdown);
	if (noteImportInput) noteImportInput.addEventListener("change", handleImportMarkdownFiles);

	// Backlinks toggle
	if (noteBacklinksToggleBtn) {
		noteBacklinksToggleBtn.addEventListener("click", function () {
			var body = document.getElementById("note-backlinks-body");
			var chevron = document.getElementById("note-backlinks-chevron");
			if (body) body.classList.toggle("hidden");
			if (chevron) chevron.classList.toggle("rotate-180");
		});
	}

	// Notebook Modal
	if (notebookForm) notebookForm.addEventListener("submit", handleNotebookFormSubmit);
	if (closeNotebookModalBtn) closeNotebookModalBtn.addEventListener("click", closeNotebookModal);
	var cancelNbBtn = document.getElementById("cancel-notebook-modal-btn");
	if (cancelNbBtn) cancelNbBtn.addEventListener("click", closeNotebookModal);
	if (notebookModal) {
		notebookModal.addEventListener("click", function (e) {
			if (e.target === notebookModal) closeNotebookModal();
		});
	}

	// Close wikilink suggestion popup on outside click
	document.addEventListener("click", function (e) {
		if (wikilinkSuggestPopover && !wikilinkSuggestPopover.contains(e.target) && e.target !== noteEditorTextarea) {
			closeWikilinkSuggestions();
		}
	});

	// Handle window resize for split view on mobile
	window.addEventListener("resize", function () {
		if (window.innerWidth < 768 && noteEditorMode === "split") {
			setEditorMode("edit");
		}
	});
}

function initToolbarEvents() {
	var tbBold = document.getElementById("tb-bold");
	var tbItalic = document.getElementById("tb-italic");
	var tbStrike = document.getElementById("tb-strike");
	var tbH1 = document.getElementById("tb-h1");
	var tbH2 = document.getElementById("tb-h2");
	var tbH3 = document.getElementById("tb-h3");
	var tbBullet = document.getElementById("tb-bullet");
	var tbNumbered = document.getElementById("tb-numbered");
	var tbTask = document.getElementById("tb-task");
	var tbQuote = document.getElementById("tb-quote");
	var tbCodeInline = document.getElementById("tb-code-inline");
	var tbCodeBlock = document.getElementById("tb-code-block");
	var tbLink = document.getElementById("tb-link");
	var tbWikilink = document.getElementById("tb-wikilink");
	var tbCallout = document.getElementById("tb-callout");
	var tbTable = document.getElementById("tb-table");
	var tbHr = document.getElementById("tb-hr");

	if (tbBold) tbBold.addEventListener("click", function () { insertFormatting("**", "**", "bold text"); });
	if (tbItalic) tbItalic.addEventListener("click", function () { insertFormatting("*", "*", "italic text"); });
	if (tbStrike) tbStrike.addEventListener("click", function () { insertFormatting("~~", "~~", "strikethrough text"); });
	if (tbH1) tbH1.addEventListener("click", function () { insertLinePrefix("# "); });
	if (tbH2) tbH2.addEventListener("click", function () { insertLinePrefix("## "); });
	if (tbH3) tbH3.addEventListener("click", function () { insertLinePrefix("### "); });
	if (tbBullet) tbBullet.addEventListener("click", function () { insertLinePrefix("- "); });
	if (tbNumbered) tbNumbered.addEventListener("click", function () { insertLinePrefix("1. "); });
	if (tbTask) tbTask.addEventListener("click", function () { insertLinePrefix("- [ ] "); });
	if (tbQuote) tbQuote.addEventListener("click", function () { insertLinePrefix("> "); });
	if (tbCodeInline) tbCodeInline.addEventListener("click", function () { insertFormatting("`", "`", "code"); });
	if (tbCodeBlock) tbCodeBlock.addEventListener("click", function () { insertFormatting("\n```\n", "\n```\n", "code block"); });
	if (tbLink) tbLink.addEventListener("click", function () { insertFormatting("[", "](https://)", "link text"); });
	if (tbWikilink) tbWikilink.addEventListener("click", function () { insertFormatting("[[", "]]", "Note Title"); });
	if (tbCallout) tbCallout.addEventListener("click", function () { insertCallout("note"); });
	if (tbTable) tbTable.addEventListener("click", insertTable);
	if (tbHr) tbHr.addEventListener("click", function () { insertFormatting("\n---\n", "", ""); });
}

// Global exports
window.loadNotesData = loadNotesData;
window.renderNotesPage = renderNotesPage;
window.initNotesEvents = initNotesEvents;
window.createNewNote = createNewNote;

window.StudyApp.notes = {
	loadNotesData: loadNotesData,
	renderNotesPage: renderNotesPage,
	initNotesEvents: initNotesEvents,
	createNewNote: createNewNote,
	selectNote: selectNote,
	deleteActiveNote: deleteActiveNote,
	exportActiveNoteAsMarkdown: exportActiveNoteAsMarkdown,
	copyActiveNoteMarkdown: copyActiveNoteMarkdown,
	triggerImportMarkdown: triggerImportMarkdown,
	setEditorMode: setEditorMode
};
