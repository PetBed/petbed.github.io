// ==========================================
// CALENDAR, TIMELINE & GOOGLE CALENDAR SYNC
// ==========================================

window.StudyApp = window.StudyApp || {};

	function getCustomEventsStorageKey() {
		return `studyCalendarCustomEvents_${currentUser ? currentUser.id : "guest"}`;
	}
	function loadCustomEvents() {
		try {
			const saved = localStorage.getItem(getCustomEventsStorageKey());
			customEvents = saved ? JSON.parse(saved) : [];
			if (!Array.isArray(customEvents)) customEvents = [];
		} catch (e) {
			console.error("Failed to load custom events:", e);
			customEvents = [];
		}
	}
	function saveCustomEventsToStorage() {
		try {
			localStorage.setItem(getCustomEventsStorageKey(), JSON.stringify(customEvents));
		} catch (e) {
			console.error("Failed to save custom events:", e);
		}
	}


	// =========================================================================
	// GOOGLE CALENDAR INTEGRATION
	// =========================================================================
	function getGoogleCalendarConfigsStorageKey() {
		return `studyGoogleCalendarConfigs_${currentUser ? currentUser.id : "guest"}`;
	}
	function getGoogleCalendarEventsStorageKey() {
		return `studyGoogleCalendarEvents_${currentUser ? currentUser.id : "guest"}`;
	}
	function getGoogleCalendarAutoSyncStorageKey() {
		return `studyGoogleCalendarAutoSync_${currentUser ? currentUser.id : "guest"}`;
	}

	function loadGoogleCalendarState() {
		try {
			const savedConfigs = localStorage.getItem(getGoogleCalendarConfigsStorageKey());
			googleCalendarConfigs = savedConfigs ? JSON.parse(savedConfigs) : [];
			if (!Array.isArray(googleCalendarConfigs)) googleCalendarConfigs = [];
		} catch (e) {
			console.error("Failed to load Google Calendar configs:", e);
			googleCalendarConfigs = [];
		}

		try {
			const savedEvents = localStorage.getItem(getGoogleCalendarEventsStorageKey());
			googleCalendarEvents = savedEvents ? JSON.parse(savedEvents) : [];
			if (!Array.isArray(googleCalendarEvents)) googleCalendarEvents = [];
		} catch (e) {
			console.error("Failed to load Google Calendar events cache:", e);
			googleCalendarEvents = [];
		}
	}

	function saveGoogleCalendarConfigs() {
		try {
			localStorage.setItem(getGoogleCalendarConfigsStorageKey(), JSON.stringify(googleCalendarConfigs));
		} catch (e) {
			console.error("Failed to save Google Calendar configs:", e);
		}
	}

	function saveGoogleCalendarEvents() {
		try {
			localStorage.setItem(getGoogleCalendarEventsStorageKey(), JSON.stringify(googleCalendarEvents));
		} catch (e) {
			console.error("Failed to save Google Calendar events cache:", e);
		}
	}

	function unescapeIcsText(str) {
		if (!str) return "";
		return str
			.replace(/\\n/gi, "\n")
			.replace(/\\,/g, ",")
			.replace(/\\;/g, ";")
			.replace(/\\\\/g, "\\");
	}

	function parseIcsDateTime(dateStr, params) {
		if (!dateStr) return null;
		const cleanStr = dateStr.trim();
		const isAllDay = (params && params.includes("VALUE=DATE")) || cleanStr.length === 8;

		if (isAllDay) {
			const y = parseInt(cleanStr.slice(0, 4), 10);
			const m = parseInt(cleanStr.slice(4, 6), 10);
			const d = parseInt(cleanStr.slice(6, 8), 10);
			const dateFormatted = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
			return { isAllDay: true, dateStr: dateFormatted, year: y, month: m, day: d, dateObj: new Date(y, m - 1, d) };
		}

		const match = cleanStr.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
		if (!match) return null;

		const [, y, m, d, h, min, s, isUtc] = match;
		let dateObj;
		if (isUtc) {
			dateObj = new Date(Date.UTC(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10), parseInt(h, 10), parseInt(min, 10), parseInt(s, 10)));
		} else {
			dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10), parseInt(h, 10), parseInt(min, 10), parseInt(s, 10));
		}

		const localY = dateObj.getFullYear();
		const localM = String(dateObj.getMonth() + 1).padStart(2, "0");
		const localD = String(dateObj.getDate()).padStart(2, "0");
		const dateFormatted = `${localY}-${localM}-${localD}`;

		const startMinutes = dateObj.getHours() * 60 + dateObj.getMinutes();
		const h24 = dateObj.getHours();
		const period = h24 >= 12 ? "PM" : "AM";
		const h12 = h24 % 12 || 12;
		const timeStr = `${h12}:${String(dateObj.getMinutes()).padStart(2, "0")} ${period}`;

		return {
			isAllDay: false,
			dateStr: dateFormatted,
			timeStr: timeStr,
			startTime: `${String(h24).padStart(2, "0")}:${String(dateObj.getMinutes()).padStart(2, "0")}`,
			startMinutes: startMinutes,
			dateObj: dateObj
		};
	}

	function parseIcsFeed(icsText, config) {
		if (!icsText || !icsText.includes("BEGIN:VCALENDAR")) {
			throw new Error("Content is not a valid iCalendar feed (missing BEGIN:VCALENDAR).");
		}

		// RFC 5545 unfold continuation lines
		const unfolded = icsText.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
		const lines = unfolded.split(/\r\n|\n|\r/);

		const rawEvents = [];
		let currentEvent = null;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].trim();
			if (line === "BEGIN:VEVENT") {
				currentEvent = {};
			} else if (line === "END:VEVENT") {
				if (currentEvent && currentEvent.DTSTART && currentEvent.STATUS !== "CANCELLED") {
					rawEvents.push(currentEvent);
				}
				currentEvent = null;
			} else if (currentEvent) {
				const colonIdx = line.indexOf(":");
				if (colonIdx > 0) {
					const propPart = line.slice(0, colonIdx);
					const valPart = line.slice(colonIdx + 1);
					const [propName, ...paramParts] = propPart.split(";");
					const paramStr = paramParts.join(";");

					if (propName === "SUMMARY") currentEvent.SUMMARY = unescapeIcsText(valPart);
					else if (propName === "DESCRIPTION") currentEvent.DESCRIPTION = unescapeIcsText(valPart);
					else if (propName === "LOCATION") currentEvent.LOCATION = unescapeIcsText(valPart);
					else if (propName === "URL") currentEvent.URL = valPart;
					else if (propName === "UID") currentEvent.UID = valPart;
					else if (propName === "STATUS") currentEvent.STATUS = valPart.toUpperCase();
					else if (propName === "RRULE") currentEvent.RRULE = valPart;
					else if (propName === "DTSTART") {
						currentEvent.DTSTART = valPart;
						currentEvent.DTSTART_PARAMS = paramStr;
					} else if (propName === "DTEND") {
						currentEvent.DTEND = valPart;
						currentEvent.DTEND_PARAMS = paramStr;
					}
				}
			}
		}

		const resultEvents = [];
		const now = new Date();
		const rangeStart = new Date(now.getFullYear() - 1, 0, 1);
		const rangeEnd = new Date(now.getFullYear() + 2, 11, 31);

		rawEvents.forEach((raw, idx) => {
			const startParsed = parseIcsDateTime(raw.DTSTART, raw.DTSTART_PARAMS);
			if (!startParsed) return;

			let endParsed = parseIcsDateTime(raw.DTEND, raw.DTEND_PARAMS);
			let durationMinutes = 60;

			if (endParsed && !startParsed.isAllDay && !endParsed.isAllDay) {
				const diffMs = endParsed.dateObj.getTime() - startParsed.dateObj.getTime();
				if (diffMs > 0) durationMinutes = Math.round(diffMs / 60000);
			}

			const baseEvent = {
				baseId: raw.UID || `gcal_${config.id}_${idx}`,
				calendarId: config.id,
				calendarName: config.name,
				color: config.color || "#4285F4",
				title: raw.SUMMARY || "(No Title)",
				location: raw.LOCATION || "",
				notes: raw.DESCRIPTION || "",
				url: raw.URL || "",
				isAllDay: startParsed.isAllDay,
				startTime: startParsed.startTime || "",
				startMinutes: startParsed.startMinutes ?? null,
				durationMinutes: durationMinutes
			};

			if (!raw.RRULE) {
				if (startParsed.isAllDay && endParsed && endParsed.dateObj > startParsed.dateObj) {
					let curr = new Date(startParsed.dateObj);
					while (curr < endParsed.dateObj) {
						const y = curr.getFullYear();
						const m = String(curr.getMonth() + 1).padStart(2, "0");
						const d = String(curr.getDate()).padStart(2, "0");
						const dStr = `${y}-${m}-${d}`;
						resultEvents.push({
							...baseEvent,
							id: `${baseEvent.baseId}_${dStr}`,
							dateStr: dStr,
							timeStr: "All Day",
							endTimeStr: ""
						});
						curr.setDate(curr.getDate() + 1);
					}
				} else {
					let endTimeStr = "";
					if (!baseEvent.isAllDay && baseEvent.startMinutes !== null) {
						const endMins = Math.min(24 * 60, baseEvent.startMinutes + durationMinutes);
						const endH24 = Math.floor(endMins / 60) % 24;
						const endPeriod = endH24 >= 12 ? "PM" : "AM";
						const endH12 = endH24 % 12 || 12;
						endTimeStr = `${endH12}:${String(endMins % 60).padStart(2, "0")} ${endPeriod}`;
					}

					resultEvents.push({
						...baseEvent,
						id: `${baseEvent.baseId}_${startParsed.dateStr}`,
						dateStr: startParsed.dateStr,
						timeStr: baseEvent.isAllDay ? "All Day" : startParsed.timeStr,
						endTimeStr: endTimeStr,
						endMinutes: baseEvent.isAllDay ? null : baseEvent.startMinutes + durationMinutes
					});
				}
			} else {
				const rruleObj = {};
				raw.RRULE.split(";").forEach((pair) => {
					const [k, v] = pair.split("=");
					if (k && v) rruleObj[k.toUpperCase()] = v;
				});

				const freq = rruleObj.FREQ || "WEEKLY";
				const interval = parseInt(rruleObj.INTERVAL || "1", 10);
				const count = rruleObj.COUNT ? parseInt(rruleObj.COUNT, 10) : 100;
				let untilDate = null;
				if (rruleObj.UNTIL) {
					const uParsed = parseIcsDateTime(rruleObj.UNTIL);
					if (uParsed) untilDate = uParsed.dateObj;
				}

				const byDays = rruleObj.BYDAY ? rruleObj.BYDAY.split(",") : null;
				const dayMap = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

				let occurrences = 0;
				let cursor = new Date(startParsed.dateObj);

				if (freq === "WEEKLY" && byDays) {
					const targetDays = byDays.map((d) => dayMap[d.trim().toUpperCase()]).filter((d) => d !== undefined);
					while (occurrences < count && cursor <= rangeEnd) {
						const weekStart = new Date(cursor);
						for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
							const testDate = new Date(weekStart);
							testDate.setDate(weekStart.getDate() + dayOffset);
							if (testDate < startParsed.dateObj) continue;
							if (untilDate && testDate > untilDate) break;
							if (testDate > rangeEnd) break;

							if (targetDays.includes(testDate.getDay())) {
								const y = testDate.getFullYear();
								const m = String(testDate.getMonth() + 1).padStart(2, "0");
								const d = String(testDate.getDate()).padStart(2, "0");
								const dStr = `${y}-${m}-${d}`;

								let endTimeStr = "";
								if (!baseEvent.isAllDay && baseEvent.startMinutes !== null) {
									const endMins = Math.min(24 * 60, baseEvent.startMinutes + durationMinutes);
									const endH24 = Math.floor(endMins / 60) % 24;
									const endPeriod = endH24 >= 12 ? "PM" : "AM";
									const endH12 = endH24 % 12 || 12;
									endTimeStr = `${endH12}:${String(endMins % 60).padStart(2, "0")} ${endPeriod}`;
								}

								resultEvents.push({
									...baseEvent,
									id: `${baseEvent.baseId}_${dStr}`,
									dateStr: dStr,
									timeStr: baseEvent.isAllDay ? "All Day" : startParsed.timeStr,
									endTimeStr: endTimeStr,
									endMinutes: baseEvent.isAllDay ? null : baseEvent.startMinutes + durationMinutes
								});
								occurrences++;
								if (occurrences >= count) break;
							}
						}
						cursor.setDate(cursor.getDate() + 7 * interval);
					}
				} else if (freq === "DAILY") {
					while (occurrences < count && cursor <= rangeEnd) {
						if (untilDate && cursor > untilDate) break;
						if (cursor >= rangeStart) {
							const y = cursor.getFullYear();
							const m = String(cursor.getMonth() + 1).padStart(2, "0");
							const d = String(cursor.getDate()).padStart(2, "0");
							const dStr = `${y}-${m}-${d}`;

							let endTimeStr = "";
							if (!baseEvent.isAllDay && baseEvent.startMinutes !== null) {
								const endMins = Math.min(24 * 60, baseEvent.startMinutes + durationMinutes);
								const endH24 = Math.floor(endMins / 60) % 24;
								const endPeriod = endH24 >= 12 ? "PM" : "AM";
								const endH12 = endH24 % 12 || 12;
								endTimeStr = `${endH12}:${String(endMins % 60).padStart(2, "0")} ${endPeriod}`;
							}

							resultEvents.push({
								...baseEvent,
								id: `${baseEvent.baseId}_${dStr}`,
								dateStr: dStr,
								timeStr: baseEvent.isAllDay ? "All Day" : startParsed.timeStr,
								endTimeStr: endTimeStr,
								endMinutes: baseEvent.isAllDay ? null : baseEvent.startMinutes + durationMinutes
							});
							occurrences++;
						}
						cursor.setDate(cursor.getDate() + interval);
					}
				}
			}
		});

		return resultEvents;
	}

	async function fetchIcsFeedWithFallback(url) {
		let cleanUrl = url.trim();
		if (cleanUrl.startsWith("webcal://")) cleanUrl = "https://" + cleanUrl.slice(9);

		const fetchSources = [
			`https://api.allorigins.win/raw?url=${encodeURIComponent(cleanUrl)}`,
			`https://corsproxy.io/?url=${encodeURIComponent(cleanUrl)}`,
			`${API_URL}/api/study/calendar/ical-proxy?url=${encodeURIComponent(cleanUrl)}`,
			cleanUrl
		];

		let lastError = null;
		for (const src of fetchSources) {
			try {
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 12000);
				const res = await fetch(src, { signal: controller.signal });
				clearTimeout(timeoutId);
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const text = await res.text();
				if (text && text.includes("BEGIN:VCALENDAR")) {
					return text;
				}
			} catch (e) {
				lastError = e;
			}
		}

		throw new Error(lastError ? `Could not load calendar feed: ${lastError.message}` : "Failed to load calendar feed through proxy.");
	}

	async function syncGoogleCalendar(calendarId) {
		const cfg = googleCalendarConfigs.find((c) => c.id === calendarId);
		if (!cfg) return;

		updateGcalStatusDot("syncing");
		renderGoogleCalendarsList();

		try {
			const icsText = await fetchIcsFeedWithFallback(cfg.url);
			const newEvents = parseIcsFeed(icsText, cfg);

			// Remove old events for this calendar and append fresh ones
			googleCalendarEvents = googleCalendarEvents.filter((e) => e.calendarId !== calendarId).concat(newEvents);
			cfg.lastSynced = new Date().toISOString();
			cfg.eventCount = newEvents.length;
			cfg.syncError = null;

			saveGoogleCalendarConfigs();
			saveGoogleCalendarEvents();
			populateCalendarWithExams();
			renderCalendar();
			if (selectedDate && eventModal && !eventModal.classList.contains("hidden")) {
				renderDayTimeline(selectedDate);
			}

			updateGcalStatusDot("synced");
			renderGoogleCalendarsList();
			return newEvents;
		} catch (err) {
			console.error(`Failed to sync Google Calendar "${cfg.name}":`, err);
			cfg.syncError = err.message;
			saveGoogleCalendarConfigs();
			updateGcalStatusDot("error");
			renderGoogleCalendarsList();
			throw err;
		}
	}

	async function syncAllGoogleCalendars() {
		if (googleCalendarConfigs.length === 0) return;
		updateGcalStatusDot("syncing");
		if (gcalSyncAllIcon) gcalSyncAllIcon.classList.add("animate-spin-fast");

		let hasError = false;
		for (const cfg of googleCalendarConfigs) {
			try {
				await syncGoogleCalendar(cfg.id);
			} catch (e) {
				hasError = true;
			}
		}

		if (gcalSyncAllIcon) gcalSyncAllIcon.classList.remove("animate-spin-fast");
		updateGcalStatusDot(hasError ? "error" : "synced");
	}

	function updateGcalStatusDot(state) {
		if (!gcalStatusDot) return;
		gcalStatusDot.className = "w-2 h-2 rounded-full transition-colors";
		if (state === "syncing") {
			gcalStatusDot.classList.add("gcal-status-syncing");
			gcalStatusDot.title = "Syncing with Google Calendar...";
		} else if (state === "synced") {
			gcalStatusDot.classList.add("gcal-status-synced");
			gcalStatusDot.title = "Google Calendar synced";
		} else if (state === "error") {
			gcalStatusDot.classList.add("gcal-status-error");
			gcalStatusDot.title = "Sync error (click to manage)";
		} else {
			if (googleCalendarConfigs.length > 0) {
				gcalStatusDot.classList.add("gcal-status-synced");
				gcalStatusDot.title = "Google Calendar linked";
			} else {
				gcalStatusDot.classList.add("bg-slate-400", "dark:bg-slate-500");
				gcalStatusDot.title = "Not linked yet";
			}
		}
	}

	function openGcalModal() {
		if (!gcalModal) return;
		renderGoogleCalendarsList();
		gcalModal.classList.remove("hidden");
	}

	function closeGcalModal() {
		if (!gcalModal) return;
		gcalModal.classList.add("hidden");
		if (gcalFormError) gcalFormError.textContent = "";
	}

	function renderGoogleCalendarsList() {
		if (!gcalCalendarsList || !gcalEmptyCalendars) return;
		gcalCalendarsList.innerHTML = "";

		if (googleCalendarConfigs.length === 0) {
			gcalEmptyCalendars.classList.remove("hidden");
			return;
		}
		gcalEmptyCalendars.classList.add("hidden");

		googleCalendarConfigs.forEach((cfg) => {
			const isEnabled = cfg.enabled !== false;
			const card = document.createElement("div");
			card.className = `gcal-calendar-card flex items-center justify-between p-3 rounded-xl border bg-white dark:bg-slate-800 shadow-2xs ${isEnabled ? "border-slate-200 dark:border-slate-700" : "border-dashed border-slate-200 dark:border-slate-700 opacity-60"}`;
			card.style.borderLeft = `4px solid ${cfg.color || "#4285F4"}`;

			const lastSyncText = cfg.lastSynced ? new Date(cfg.lastSynced).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Never";
			const count = cfg.eventCount ?? (googleCalendarEvents.filter((e) => e.calendarId === cfg.id).length);

			card.innerHTML = `
				<div class="min-w-0 flex-1 pr-2">
					<div class="flex items-center gap-2">
						<span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${cfg.color}"></span>
						<h5 class="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">${escapeHtml(cfg.name)}</h5>
						${!isEnabled ? `<span class="text-[10px] text-slate-400 font-medium">(Hidden)</span>` : ""}
					</div>
					<div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 truncate">
						<span>${count} event${count === 1 ? "" : "s"}</span>
						<span>•</span>
						<span>Synced ${lastSyncText}</span>
						${cfg.syncError ? `<span class="text-red-500 font-medium truncate" title="${escapeHtml(cfg.syncError)}">⚠️ Error</span>` : ""}
					</div>
				</div>
				<div class="flex items-center gap-1.5 shrink-0">
					<!-- Toggle Visibility Button -->
					<button type="button" data-gcal-action="toggle" data-id="${cfg.id}" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition" title="${isEnabled ? "Hide events from calendar" : "Show events on calendar"}">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
							${isEnabled
					? `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`
					: `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`
				}
						</svg>
					</button>

					<!-- Sync Button -->
					<button type="button" data-gcal-action="sync" data-id="${cfg.id}" class="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition" title="Sync now">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
					</button>

					<!-- Delete Button -->
					<button type="button" data-gcal-action="delete" data-id="${cfg.id}" class="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition" title="Unlink calendar">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
					</button>
				</div>
			`;

			card.querySelector('[data-gcal-action="toggle"]').addEventListener("click", () => {
				cfg.enabled = !isEnabled;
				saveGoogleCalendarConfigs();
				populateCalendarWithExams();
				renderCalendar();
				if (selectedDate && eventModal && !eventModal.classList.contains("hidden")) {
					renderDayTimeline(selectedDate);
				}
				renderGoogleCalendarsList();
			});

			card.querySelector('[data-gcal-action="sync"]').addEventListener("click", async (e) => {
				const btnSvg = e.currentTarget.querySelector("svg");
				if (btnSvg) btnSvg.classList.add("animate-spin-fast");
				try {
					await syncGoogleCalendar(cfg.id);
				} catch (err) {
					alert(`Failed to sync "${cfg.name}": ${err.message}`);
				} finally {
					if (btnSvg) btnSvg.classList.remove("animate-spin-fast");
				}
			});

			card.querySelector('[data-gcal-action="delete"]').addEventListener("click", () => {
				if (!confirm(`Are you sure you want to unlink "${cfg.name}"? Synced events from this calendar will be removed from your view.`)) return;
				googleCalendarConfigs = googleCalendarConfigs.filter((c) => c.id !== cfg.id);
				googleCalendarEvents = googleCalendarEvents.filter((e) => e.calendarId !== cfg.id);
				saveGoogleCalendarConfigs();
				saveGoogleCalendarEvents();
				populateCalendarWithExams();
				renderCalendar();
				if (selectedDate && eventModal && !eventModal.classList.contains("hidden")) {
					renderDayTimeline(selectedDate);
				}
				updateGcalStatusDot();
				renderGoogleCalendarsList();
			});

			gcalCalendarsList.appendChild(card);
		});
	}

	function initGoogleCalendarIntegration() {
		loadGoogleCalendarState();

		const autoSyncPref = localStorage.getItem(getGoogleCalendarAutoSyncStorageKey());
		const autoSyncEnabled = autoSyncPref === null ? true : autoSyncPref === "true";
		if (gcalAutoSyncToggle) {
			gcalAutoSyncToggle.checked = autoSyncEnabled;
			gcalAutoSyncToggle.addEventListener("change", () => {
				localStorage.setItem(getGoogleCalendarAutoSyncStorageKey(), gcalAutoSyncToggle.checked ? "true" : "false");
			});
		}

		if (gcalColorPicker && gcalSelectedColorInput) {
			const colorBtns = gcalColorPicker.querySelectorAll(".gcal-color-opt");
			colorBtns.forEach((btn) => {
				btn.addEventListener("click", () => {
					colorBtns.forEach((b) => b.classList.remove("ring-2", "ring-offset-2", "ring-blue-500"));
					btn.classList.add("ring-2", "ring-offset-2", "ring-blue-500");
					gcalSelectedColorInput.value = btn.dataset.color || "#4285F4";
				});
			});
		}

		if (gcalGuideToggle && gcalGuideContent && gcalGuideIcon) {
			gcalGuideToggle.addEventListener("click", () => {
				const isHidden = gcalGuideContent.classList.toggle("hidden");
				gcalGuideIcon.style.transform = isHidden ? "rotate(0deg)" : "rotate(180deg)";
			});
			gcalGuideContent.classList.add("hidden");
		}

		if (openGcalModalBtn) openGcalModalBtn.addEventListener("click", openGcalModal);
		if (closeGcalModalBtn) closeGcalModalBtn.addEventListener("click", closeGcalModal);
		if (closeGcalModalFooterBtn) closeGcalModalFooterBtn.addEventListener("click", closeGcalModal);
		if (gcalModal) gcalModal.addEventListener("click", (e) => e.target === gcalModal && closeGcalModal());

		if (gcalSyncAllBtn) {
			gcalSyncAllBtn.addEventListener("click", async () => {
				await syncAllGoogleCalendars();
			});
		}

		if (gcalAddForm && gcalUrlInput && gcalNameInput) {
			gcalAddForm.addEventListener("submit", async (e) => {
				e.preventDefault();
				if (gcalFormError) gcalFormError.textContent = "";

				let url = gcalUrlInput.value.trim();
				if (!url) return;
				if (url.startsWith("webcal://")) url = "https://" + url.slice(9);

				const name = gcalNameInput.value.trim() || "Google Calendar";
				const color = gcalSelectedColorInput ? gcalSelectedColorInput.value : "#4285F4";

				const submitBtn = document.getElementById("gcal-add-btn");
				const originalText = submitBtn ? submitBtn.innerHTML : "";
				if (submitBtn) {
					submitBtn.disabled = true;
					submitBtn.innerHTML = `<span class="animate-spin-fast inline-block mr-1">⏳</span> Validating & Syncing...`;
				}

				try {
					const newConfig = {
						id: `cal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
						name: name,
						url: url,
						color: color,
						enabled: true,
						lastSynced: null,
						eventCount: 0
					};

					googleCalendarConfigs.push(newConfig);
					saveGoogleCalendarConfigs();

					await syncGoogleCalendar(newConfig.id);

					gcalUrlInput.value = "";
					gcalNameInput.value = "Google Calendar";
					if (gcalFormError) gcalFormError.textContent = "";
				} catch (err) {
					if (gcalFormError) {
						gcalFormError.textContent = `Error: ${err.message}. Please verify the iCal address.`;
					}
				} finally {
					if (submitBtn) {
						submitBtn.disabled = false;
						submitBtn.innerHTML = originalText;
					}
				}
			});
		}

		if (gcalFileInput) {
			gcalFileInput.addEventListener("change", (e) => {
				const file = e.target.files && e.target.files[0];
				if (!file) return;

				const reader = new FileReader();
				reader.onload = (evt) => {
					try {
						const icsText = evt.target.result;
						const fileName = file.name.replace(/\.ics$/i, "") || "Imported Calendar";
						const color = gcalSelectedColorInput ? gcalSelectedColorInput.value : "#4285F4";

						const newConfig = {
							id: `cal_file_${Date.now()}`,
							name: fileName,
							url: "(Local .ics file)",
							color: color,
							enabled: true,
							lastSynced: new Date().toISOString(),
							eventCount: 0,
							isLocalFile: true
						};

						const parsed = parseIcsFeed(icsText, newConfig);
						newConfig.eventCount = parsed.length;

						googleCalendarConfigs.push(newConfig);
						googleCalendarEvents = googleCalendarEvents.concat(parsed);

						saveGoogleCalendarConfigs();
						saveGoogleCalendarEvents();
						populateCalendarWithExams();
						renderCalendar();
						if (selectedDate && eventModal && !eventModal.classList.contains("hidden")) {
							renderDayTimeline(selectedDate);
						}

						updateGcalStatusDot("synced");
						renderGoogleCalendarsList();
						alert(`Successfully imported ${parsed.length} events from "${file.name}"!`);
						gcalFileInput.value = "";
					} catch (err) {
						alert("Failed to parse .ics file: " + err.message);
					}
				};
				reader.readAsText(file);
			});
		}

		updateGcalStatusDot();
		renderGoogleCalendarsList();

		if (autoSyncEnabled && googleCalendarConfigs.some((c) => !c.isLocalFile)) {
			setTimeout(() => {
				syncAllGoogleCalendars().catch((e) => console.warn("Background auto-sync issue:", e));
			}, 1500);
		}
	}


	function renderUpcomingExams() {
		const now = new Date();
		const allExams = getAllSemestersExams();
		const upcoming = allExams.filter((e) => new Date(e.date) > now).sort((a, b) => new Date(a.date) - new Date(b.date));
		upcomingExamsContainer.innerHTML = "";
		if (upcoming.length === 0) {
			upcomingExamsContainer.innerHTML = `<p class="text-slate-500 dark:text-slate-400">No upcoming exams!</p>`;
			return;
		}
		const nextDate = new Date(upcoming[0].date).toDateString();
		const nextExams = upcoming.filter((e) => new Date(e.date).toDateString() === nextDate);
		upcomingExamsContainer.innerHTML = `<p class="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">On ${new Date(nextExams[0].date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>`;
		nextExams.forEach((exam) => {
			const el = document.createElement("div");
			el.className = "flex items-center p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg";
			const semBadge = exam.semesterName ? `<span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium mr-2">${exam.semesterName}</span>` : "";
			el.innerHTML = `
				<div class="w-1.5 h-10 rounded-full mr-3" style="background-color: ${getColorForSubject(exam.subject)};"></div>
				<div class="min-w-0 flex-1">
					<div class="flex items-center">
						${semBadge}
						<p class="font-semibold text-slate-800 dark:text-slate-200 truncate">${exam.subject}${exam.paper ? ` • ${exam.paper}` : ""}</p>
					</div>
					<p class="text-sm text-slate-500 dark:text-slate-400">${new Date(exam.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}</p>
				</div>
			`;
			upcomingExamsContainer.appendChild(el);
		});
	}

	// --- Core Functionality ---
	function populateCalendarWithExams() {
		loadCustomEvents();
		events = {};

		const allExams = getAllSemestersExams();
		allExams.forEach((exam, idx) => {
			const d = new Date(exam.date);
			if (isNaN(d.getTime())) return;
			const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
			const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
			const startMinutes = d.getHours() * 60 + d.getMinutes();
			const durationMinutes = 90;
			const endMinutes = Math.min(24 * 60, startMinutes + durationMinutes);
			const endHour = Math.floor(endMinutes / 60);
			const endMinute = endMinutes % 60;
			const endD = new Date(d);
			endD.setHours(endHour, endMinute, 0, 0);
			const endTimeStr = endD.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
			const subjectColor = getColorForSubject(exam.subject || "Other");

			if (!events[dateStr]) events[dateStr] = [];
			events[dateStr].push({
				id: exam.id || `exam_${exam.semesterId || "sem"}_${idx}`,
				type: "exam",
				title: `${exam.subject}${exam.paper ? ` (${exam.paper})` : ""}`,
				subject: exam.subject,
				paper: exam.paper || "",
				semesterName: exam.semesterName || "",
				dateStr: dateStr,
				timeStr: timeStr,
				endTimeStr: endTimeStr,
				startMinutes: startMinutes,
				endMinutes: endMinutes,
				durationMinutes: durationMinutes,
				isAllDay: false,
				color: subjectColor,
				notes: exam.notes || "",
				text: `${timeStr} - ${exam.subject}${exam.paper ? ` (${exam.paper})` : ""}`
			});
		});

		// Include custom events
		customEvents.forEach((ce) => {
			if (!ce.dateStr) return;
			if (!events[ce.dateStr]) events[ce.dateStr] = [];
			const subjectColor = getColorForSubject(ce.subject || "Other");

			let startMinutes = 9 * 60;
			let endMinutes = 10 * 60;
			if (ce.startTime) {
				const [h, m] = ce.startTime.split(":").map(Number);
				if (!isNaN(h) && !isNaN(m)) startMinutes = h * 60 + m;
			}
			if (ce.endTime) {
				const [h, m] = ce.endTime.split(":").map(Number);
				if (!isNaN(h) && !isNaN(m)) endMinutes = h * 60 + m;
			}
			if (endMinutes <= startMinutes) {
				endMinutes = Math.min(24 * 60, startMinutes + 60);
			}
			const durationMinutes = Math.max(20, endMinutes - startMinutes);

			const formatMinutesTo12h = (totalMins) => {
				const h24 = Math.floor(totalMins / 60) % 24;
				const mins = totalMins % 60;
				const period = h24 >= 12 ? "PM" : "AM";
				const h12 = h24 % 12 || 12;
				return `${h12}:${String(mins).padStart(2, "0")} ${period}`;
			};

			const timeStr = ce.startTime ? formatMinutesTo12h(startMinutes) : "All Day";
			const endTimeStr = ce.endTime ? formatMinutesTo12h(endMinutes) : "";

			events[ce.dateStr].push({
				id: ce.id,
				type: "custom",
				title: ce.title,
				subject: ce.subject || "Other",
				paper: "",
				dateStr: ce.dateStr,
				timeStr: timeStr,
				endTimeStr: endTimeStr,
				startTime: ce.startTime || "",
				endTime: ce.endTime || "",
				startMinutes: ce.startTime ? startMinutes : null,
				endMinutes: ce.endTime ? endMinutes : null,
				durationMinutes: ce.startTime ? durationMinutes : 60,
				isAllDay: !ce.startTime,
				color: ce.color || subjectColor,
				notes: ce.notes || "",
				text: `Custom: ${ce.title}`
			});
		});

		// Include Google Calendar events
		loadGoogleCalendarState();
		const activeGcalConfigs = googleCalendarConfigs.filter((c) => c.enabled !== false);
		const activeConfigIds = new Set(activeGcalConfigs.map((c) => c.id));
		const activeGcalMap = new Map(activeGcalConfigs.map((c) => [c.id, c]));

		googleCalendarEvents.forEach((ge) => {
			if (!activeConfigIds.has(ge.calendarId)) return;
			if (!ge.dateStr) return;
			if (!events[ge.dateStr]) events[ge.dateStr] = [];

			const cfg = activeGcalMap.get(ge.calendarId);
			const calColor = (cfg && cfg.color) || ge.color || "#4285F4";

			events[ge.dateStr].push({
				id: ge.id,
				type: "gcal",
				calendarId: ge.calendarId,
				calendarName: ge.calendarName || (cfg ? cfg.name : "Google Calendar"),
				title: ge.title,
				subject: ge.calendarName || "Google Calendar",
				paper: "",
				dateStr: ge.dateStr,
				timeStr: ge.timeStr,
				endTimeStr: ge.endTimeStr,
				startTime: ge.startTime || "",
				endTime: ge.endTime || "",
				startMinutes: ge.startMinutes,
				endMinutes: ge.endMinutes,
				durationMinutes: ge.durationMinutes || 60,
				isAllDay: ge.isAllDay,
				color: calColor,
				location: ge.location || "",
				notes: ge.notes || "",
				url: ge.url || "",
				text: `Google: ${ge.title}`
			});
		});

		// Sort events on each day chronologically
		Object.keys(events).forEach((dStr) => {
			events[dStr].sort((a, b) => {
				if (a.isAllDay && !b.isAllDay) return -1;
				if (!a.isAllDay && b.isAllDay) return 1;
				const aMin = a.startMinutes ?? 0;
				const bMin = b.startMinutes ?? 0;
				return aMin - bMin;
			});
		});
	}

	function renderCalendar() {
		calendarDaysEl.innerHTML = "";
		const year = currentDate.getFullYear(),
			month = currentDate.getMonth();
		monthYearEl.textContent = `${new Date(year, month).toLocaleString("en-US", { month: "long" })} ${year}`;
		const firstDay = new Date(year, month, 1).getDay();
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		for (let i = 0; i < firstDay; i++) calendarDaysEl.appendChild(document.createElement("div"));
		for (let i = 1; i <= daysInMonth; i++) {
			const dayEl = document.createElement("div");
			dayEl.className = "day cursor-pointer p-2 md:p-3 rounded-xl flex flex-col items-start min-h-[85px] sm:min-h-[95px] overflow-hidden";
			const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
			dayEl.dataset.date = dateStr;
			if (selectedDate === dateStr && eventModal && !eventModal.classList.contains("hidden")) {
				dayEl.classList.add("selected-day");
			}

			const headerRow = document.createElement("div");
			headerRow.className = "w-full flex items-center justify-between";

			const dayNum = document.createElement("span");
			dayNum.textContent = i;
			dayNum.className = "text-sm font-semibold";
			if (new Date().toDateString() === new Date(dateStr + "T00:00:00").toDateString()) {
				dayNum.className += " bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-xs";
			} else {
				dayNum.className += " text-slate-700 dark:text-slate-300";
			}
			headerRow.appendChild(dayNum);

			// Small dot indicator on mobile if day has events
			if (events[dateStr] && events[dateStr].length > 0) {
				const dot = document.createElement("span");
				dot.className = "sm:hidden w-2 h-2 rounded-full bg-blue-500";
				headerRow.appendChild(dot);
			}

			dayEl.appendChild(headerRow);

			if (events[dateStr] && events[dateStr].length > 0) {
				const dayEvents = events[dateStr];
				const eventsContainer = document.createElement("div");
				eventsContainer.className = "mt-1.5 text-xs space-y-1 w-full overflow-hidden flex-1";

				dayEvents.slice(0, 2).forEach((evt) => {
					const pill = document.createElement("div");
					pill.className = "px-1.5 py-0.5 rounded text-[10px] truncate font-medium flex items-center gap-1 transition-all";
					if (evt.type === "gcal") pill.classList.add("gcal-pill");
					const color = evt.color || getColorForSubject(evt.subject || "Other");
					pill.style.backgroundColor = color + "20";
					pill.style.color = color;
					pill.style.borderLeft = `2.5px solid ${color}`;

					let displayTitle = evt.title;
					if (evt.type === "exam") {
						displayTitle = `${evt.timeStr ? evt.timeStr + " " : ""}${evt.title}`;
					} else if (evt.type === "gcal") {
						displayTitle = `${!evt.isAllDay && evt.timeStr ? evt.timeStr + " " : ""}${evt.title}`;
					}
					const tooltip = evt.type === "gcal"
						? `[Google: ${evt.calendarName || "GCal"}] ${evt.timeStr ? evt.timeStr + (evt.endTimeStr ? ` - ${evt.endTimeStr}` : "") + " • " : ""}${evt.title}${evt.location ? ` @ ${evt.location}` : ""}`
						: displayTitle;
					pill.title = tooltip;
					pill.textContent = displayTitle;
					eventsContainer.appendChild(pill);
				});

				if (dayEvents.length > 2) {
					const moreBadge = document.createElement("div");
					moreBadge.className = "text-[10px] font-semibold text-slate-500 dark:text-slate-400 pl-0.5";
					moreBadge.textContent = `+${dayEvents.length - 2} more`;
					eventsContainer.appendChild(moreBadge);
				}

				dayEl.appendChild(eventsContainer);
			}
			dayEl.addEventListener("click", () => openModal(dateStr));
			calendarDaysEl.appendChild(dayEl);
		}
	}
	function renderCountdowns() {
		countdownContainer.innerHTML = "";
		const allExams = getAllSemestersExams();
		const upcomingExams = allExams.filter((e) => new Date(e.date) > new Date()).sort((a, b) => new Date(a.date) - new Date(b.date));
		if (upcomingExams.length === 0) {
			if (typeof hasCustomSubjects === "function" && hasCustomSubjects()) {
				countdownContainer.innerHTML = `
					<div class="p-4 rounded-xl bg-slate-100/80 dark:bg-slate-700/40 text-center space-y-2 border border-slate-200/60 dark:border-slate-700/60">
						<p class="text-xs font-semibold text-slate-700 dark:text-slate-300">No upcoming exams scheduled</p>
						<p class="text-[11px] text-slate-400 dark:text-slate-500">Set exam dates to see live countdowns</p>
						<button type="button" id="countdown-schedule-exam-btn" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-xs transition">
							+ Schedule Exam
						</button>
					</div>
				`;
				const btn = document.getElementById("countdown-schedule-exam-btn");
				if (btn) {
					btn.addEventListener("click", () => {
						if (typeof openExamsModal === "function") {
							openExamsModal(null, "exams");
						}
					});
				}
			} else {
				countdownContainer.innerHTML = '<p class="text-slate-500 dark:text-slate-400 text-xs text-center py-2">No more exams! 🎉</p>';
			}
			return;
		}
		const nextExam = upcomingExams[0];
		const otherExams = upcomingExams.slice(1);

		let featuredHtml = `
            <div>
                <p class="text-sm font-semibold text-slate-600 dark:text-slate-400">Next Up</p>
                <div class="p-4 mt-2 rounded-lg bg-slate-100 dark:bg-slate-700/50 border-l-4" style="border-color: ${getColorForSubject(nextExam.subject)}">
                     <div class="flex items-center justify-between">
                        <p class="font-bold text-slate-800 dark:text-slate-200">${nextExam.subject}${nextExam.paper ? ` (${nextExam.paper})` : ""}</p>
                        ${nextExam.subject.toLowerCase().includes("rbt") ? `<div class="w-3 h-3 rounded-full" style="background-color:${RBT_ACCENT};"></div>` : ""}
                    </div>
                    <p class="countdown-timer text-2xl font-mono text-slate-600 dark:text-slate-300 mt-1" data-date="${nextExam.date}"></p>
                </div>
            </div>
        `;

		let othersHtml = "";
		if (otherExams.length > 0) {
			othersHtml += '<h3 class="text-lg font-semibold text-slate-700 dark:text-slate-200 mt-6 mb-2">Upcoming</h3><div id="other-exams-carousel" class="flex overflow-x-auto gap-4 pb-4 hide-scrollbar">';
			otherExams.forEach((exam) => {
				othersHtml += `
                    <div class="flex-shrink-0 w-48 p-3 rounded-lg bg-slate-100 dark:bg-slate-700/50 border-l-4" style="border-color: ${getColorForSubject(exam.subject)}">
                        <p class="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">${exam.subject}${exam.paper ? ` (${exam.paper})` : ""}</p>
                        <p class="countdown-timer text-lg font-mono text-slate-600 dark:text-slate-300 mt-1" data-date="${exam.date}"></p>
                    </div>
                `;
			});
			othersHtml += "</div>";
		}

		countdownContainer.innerHTML = featuredHtml + othersHtml;

		const carousel = document.getElementById("other-exams-carousel");
		if (carousel) {
			carousel.addEventListener("wheel", (event) => {
				event.preventDefault();
				carousel.scrollLeft += event.deltaY;
			});
		}

		updateAllCountdowns();
	}
	function updateAllCountdowns() {
		document.querySelectorAll(".countdown-timer").forEach((timerEl) => {
			const targetDate = new Date(timerEl.dataset.date).getTime();
			const now = new Date().getTime();
			const diff = targetDate - now;
			if (diff > 0) {
				const d = Math.floor(diff / (1e3 * 60 * 60 * 24)),
					h = Math.floor((diff % (1e3 * 60 * 60 * 24)) / (1e3 * 60 * 60)),
					m = Math.floor((diff % (1e3 * 60 * 60)) / (1e3 * 60)),
					s = Math.floor((diff % (1e3 * 60)) / 1e3);
				timerEl.textContent = `${String(d).padStart(2, "0")}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
			} else {
				timerEl.textContent = "Exam has started!";
				timerEl.classList.add("text-green-600", "font-semibold");
			}
		});
	}

	// --- Google Calendar Timeline Modal Logic ---
	function openModal(date) {
		selectedDate = date;
		const dateObj = new Date(date + "T00:00:00");
		const isToday = new Date().toDateString() === dateObj.toDateString();

		// Highlight current selected day in calendar grid
		document.querySelectorAll(".day").forEach((d) => {
			d.classList.toggle("selected-day", d.dataset.date === date);
		});

		if (modalDateHeadingEl) {
			modalDateHeadingEl.textContent = dateObj.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
		}
		if (modalDateSubEl) {
			modalDateSubEl.textContent = dateObj.toLocaleDateString("en-US", { year: "numeric" });
		}
		if (modalTodayBadgeEl) {
			modalTodayBadgeEl.classList.toggle("hidden", !isToday);
		}
		if (modalDateEl) {
			modalDateEl.textContent = dateObj.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
		}

		// Reset and hide add event panel
		toggleAddEventForm(false);

		// Render Google Calendar timeline for this date
		renderDayTimeline(date);

		eventModal.classList.remove("hidden");
	}

	function closeModal() {
		eventModal.classList.add("hidden");
		document.querySelectorAll(".day").forEach((d) => d.classList.remove("selected-day"));
		toggleAddEventForm(false);
	}

	function toggleAddEventForm(show, prefillHour) {
		if (!calendarAddEventPanel) return;
		const isCurrentlyHidden = calendarAddEventPanel.classList.contains("hidden");
		const shouldShow = typeof show === "boolean" ? show : isCurrentlyHidden;

		if (shouldShow) {
			calendarAddEventPanel.classList.remove("hidden");
			eventTitleInput.value = "";
			if (eventNotesInput) eventNotesInput.value = "";

			const defaultHour = typeof prefillHour === "number" ? prefillHour : 9;
			const endHour = (defaultHour + 1) % 24;
			if (eventStartTimeInput) eventStartTimeInput.value = `${String(defaultHour).padStart(2, "0")}:00`;
			if (eventEndTimeInput) eventEndTimeInput.value = `${String(endHour).padStart(2, "0")}:00`;

			setTimeout(() => eventTitleInput.focus(), 50);
		} else {
			calendarAddEventPanel.classList.add("hidden");
		}
	}

	function layoutTimelineEvents(eventsList) {
		if (!eventsList || !eventsList.length) return [];
		const sorted = [...eventsList].sort((a, b) => a.startMinutes - b.startMinutes || b.durationMinutes - a.durationMinutes);

		const clusters = [];
		let currentCluster = [];
		let clusterEnd = -1;

		sorted.forEach((evt) => {
			if (currentCluster.length === 0) {
				currentCluster.push(evt);
				clusterEnd = evt.endMinutes;
			} else {
				if (evt.startMinutes < clusterEnd) {
					currentCluster.push(evt);
					clusterEnd = Math.max(clusterEnd, evt.endMinutes);
				} else {
					clusters.push(currentCluster);
					currentCluster = [evt];
					clusterEnd = evt.endMinutes;
				}
			}
		});
		if (currentCluster.length > 0) clusters.push(currentCluster);

		const positioned = [];
		clusters.forEach((cluster) => {
			const columns = [];
			cluster.forEach((evt) => {
				let placed = false;
				for (let colIdx = 0; colIdx < columns.length; colIdx++) {
					if (columns[colIdx] <= evt.startMinutes) {
						columns[colIdx] = evt.endMinutes;
						evt.colIndex = colIdx;
						placed = true;
						break;
					}
				}
				if (!placed) {
					evt.colIndex = columns.length;
					columns.push(evt.endMinutes);
				}
			});
			const totalCols = columns.length;
			cluster.forEach((evt) => {
				evt.totalCols = totalCols;
				positioned.push(evt);
			});
		});

		return positioned;
	}

	function renderDayTimeline(dateStr) {
		const dayEvents = (events[dateStr] || []).slice();
		const isToday = new Date().toDateString() === new Date(dateStr + "T00:00:00").toDateString();

		// Update event counts
		const examCount = dayEvents.filter((e) => e.type === "exam").length;
		const customCount = dayEvents.filter((e) => e.type === "custom").length;
		const gcalCount = dayEvents.filter((e) => e.type === "gcal").length;
		if (modalEventsCountEl) {
			let countText = `${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}`;
			if (dayEvents.length > 0) {
				const parts = [];
				if (examCount > 0) parts.push(`${examCount} exam${examCount === 1 ? "" : "s"}`);
				if (customCount > 0) parts.push(`${customCount} custom`);
				if (gcalCount > 0) parts.push(`${gcalCount} Google`);
				countText += ` (${parts.join(", ")})`;
			}
			modalEventsCountEl.textContent = countText;
		}

		// Check Untimed / All-Day events
		const untimedEvents = dayEvents.filter((e) => e.isAllDay || e.startMinutes === null || e.startMinutes === undefined);
		const timedEvents = dayEvents.filter((e) => !e.isAllDay && e.startMinutes !== null && e.startMinutes !== undefined);

		if (timelineAllDaySection && timelineAllDayList) {
			timelineAllDayList.innerHTML = "";
			if (untimedEvents.length > 0) {
				timelineAllDaySection.classList.remove("hidden");
				untimedEvents.forEach((evt) => {
					const chip = document.createElement("div");
					chip.className = "flex items-center justify-between p-2 rounded-lg text-xs font-semibold shadow-xs";
					chip.style.backgroundColor = evt.color + "22";
					chip.style.color = evt.color;
					chip.style.borderLeft = `3.5px solid ${evt.color}`;

					let subInfo = evt.notes ? `<span class="text-[10px] text-slate-500 truncate">(${escapeHtml(evt.notes)})</span>` : "";
					if (evt.type === "gcal" && evt.location) {
						subInfo = `<span class="text-[10px] text-slate-500 truncate">📍 ${escapeHtml(evt.location)}</span>`;
					}

					chip.innerHTML = `
						<div class="flex items-center gap-2 truncate">
							${evt.type === "gcal" ? `<svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM7 11h5v5H7z"/></svg>` : ""}
							<span class="truncate">${escapeHtml(evt.title)}</span>
							${subInfo}
						</div>
						<div class="flex items-center gap-2 shrink-0">
							${evt.type === "gcal"
							? `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-700 dark:text-blue-300">${escapeHtml(evt.calendarName || "Google")}</span>`
							: ""
						}
							<span class="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">All Day</span>
							${evt.type === "custom" ? `<button data-delete-id="${evt.id}" title="Delete event" class="text-slate-400 hover:text-red-500 p-0.5 transition"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>` : ""}
						</div>
					`;
					chip.querySelector("[data-delete-id]")?.addEventListener("click", (e) => {
						e.stopPropagation();
						deleteCustomEvent(evt.id);
					});
					timelineAllDayList.appendChild(chip);
				});
			} else {
				timelineAllDaySection.classList.add("hidden");
			}
		}

		// Empty State
		if (timelineEmptyState) {
			timelineEmptyState.classList.toggle("hidden", dayEvents.length > 0);
		}

		// Build 24-hour timeline grid
		const HOUR_HEIGHT = 60;
		if (timelineTimeLabels) timelineTimeLabels.innerHTML = "";
		if (timelineHourRows) timelineHourRows.innerHTML = "";
		if (timelineEventsOverlay) timelineEventsOverlay.innerHTML = "";

		for (let hour = 0; hour < 24; hour++) {
			// Time label
			const label = document.createElement("div");
			label.className = "timeline-time-label";
			const period = hour >= 12 ? "PM" : "AM";
			const h12 = hour % 12 || 12;
			label.textContent = `${h12} ${period}`;
			if (timelineTimeLabels) timelineTimeLabels.appendChild(label);

			// Hour row line
			const row = document.createElement("div");
			row.className = "timeline-hour-row group cursor-pointer";
			row.title = `Click to add event at ${h12} ${period}`;
			row.dataset.hour = hour;
			row.addEventListener("click", () => toggleAddEventForm(true, hour));
			if (timelineHourRows) timelineHourRows.appendChild(row);
		}

		// Render Timed Events on the Timeline
		const positionedEvents = layoutTimelineEvents(timedEvents);
		positionedEvents.forEach((evt) => {
			const top = (evt.startMinutes / 60) * HOUR_HEIGHT;
			const height = Math.max(36, (evt.durationMinutes / 60) * HOUR_HEIGHT);
			const colWidth = 100 / evt.totalCols;
			const left = evt.colIndex * colWidth;
			const width = colWidth - (evt.totalCols > 1 ? 1.5 : 0.5);

			const card = document.createElement("div");
			card.className = "gcal-timeline-event pointer-events-auto";
			card.style.top = `${top}px`;
			card.style.height = `${height}px`;
			card.style.left = `${left}%`;
			card.style.width = `${width}%`;
			card.style.borderLeftColor = evt.color;
			card.style.backgroundColor = evt.color + "22";

			card.innerHTML = `
				<div class="flex items-start justify-between gap-1 w-full overflow-hidden">
					<div class="font-bold text-slate-800 dark:text-slate-100 truncate text-xs flex items-center gap-1.5">
						<span class="w-2 h-2 rounded-full shrink-0" style="background-color: ${evt.color}"></span>
						<span class="truncate">${escapeHtml(evt.title)}</span>
					</div>
					<div class="flex items-center gap-1 shrink-0">
						${evt.type === "exam"
					? `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">Exam</span>`
					: evt.type === "gcal"
						? `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-700 dark:text-blue-300 flex items-center gap-1"><svg class="w-2.5 h-2.5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM7 11h5v5H7z"/></svg>${escapeHtml(evt.calendarName || "Google")}</span>`
						: `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-700 dark:text-blue-300">Custom</span>`
				}
						${evt.type === "custom"
					? `<button data-delete-id="${evt.id}" title="Delete event" class="gcal-event-delete-btn p-0.5 text-slate-400 hover:text-red-500 rounded transition">
									<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
								</button>`
					: ""
				}
					</div>
				</div>
				<div class="text-[10px] font-medium text-slate-600 dark:text-slate-300 mt-0.5 flex items-center gap-1.5 truncate">
					<span>${evt.timeStr}${evt.endTimeStr ? ` - ${evt.endTimeStr}` : ""}</span>
					${evt.semesterName ? `<span class="text-slate-400 dark:text-slate-500 truncate">• ${escapeHtml(evt.semesterName)}</span>` : ""}
					${evt.type === "gcal" ? `<span class="text-slate-400 dark:text-slate-500 truncate">• Read-only</span>` : ""}
				</div>
				${evt.location ? `<div class="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">📍 ${escapeHtml(evt.location)}</div>` : ""}
				${evt.notes ? `<div class="text-[10px] text-slate-500 dark:text-slate-400 truncate italic mt-0.5">${escapeHtml(evt.notes)}</div>` : ""}
			`;

			card.querySelector("[data-delete-id]")?.addEventListener("click", (e) => {
				e.stopPropagation();
				deleteCustomEvent(evt.id);
			});

			if (timelineEventsOverlay) timelineEventsOverlay.appendChild(card);
		});

		// Red Current Time Line Indicator
		if (timelineNowLine) {
			if (isToday) {
				const now = new Date();
				const currentMinutes = now.getHours() * 60 + now.getMinutes();
				const nowTop = (currentMinutes / 60) * HOUR_HEIGHT;
				timelineNowLine.style.top = `${nowTop}px`;
				timelineNowLine.classList.remove("hidden");
			} else {
				timelineNowLine.classList.add("hidden");
			}
		}

		// Auto scroll to earliest event or current time
		if (calendarTimelineScroll) {
			let scrollTargetMinute = 8 * 60; // default 8:00 AM
			if (timedEvents.length > 0) {
				const earliestMinute = Math.min(...timedEvents.map((e) => e.startMinutes));
				scrollTargetMinute = Math.max(0, earliestMinute - 30);
			} else if (isToday) {
				const now = new Date();
				scrollTargetMinute = Math.max(0, now.getHours() * 60 + now.getMinutes() - 60);
			}
			setTimeout(() => {
				calendarTimelineScroll.scrollTop = (scrollTargetMinute / 60) * HOUR_HEIGHT;
			}, 60);
		}
	}

	function saveEvent() {
		const title = eventTitleInput.value.trim();
		if (!title) {
			alert("Please enter an event title.");
			eventTitleInput.focus();
			return;
		}
		if (!selectedDate) return;

		const subject = eventSubjectSelect ? eventSubjectSelect.value : "Other";
		const startTime = eventStartTimeInput ? eventStartTimeInput.value : "09:00";
		const endTime = eventEndTimeInput ? eventEndTimeInput.value : "10:00";
		const notes = eventNotesInput ? eventNotesInput.value.trim() : "";
		const color = getColorForSubject(subject);

		const newEvent = {
			id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
			dateStr: selectedDate,
			title: title,
			subject: subject,
			startTime: startTime,
			endTime: endTime,
			notes: notes,
			color: color,
			createdAt: new Date().toISOString()
		};

		customEvents.push(newEvent);
		saveCustomEventsToStorage();
		populateCalendarWithExams();
		renderCalendar();
		renderDayTimeline(selectedDate);
		toggleAddEventForm(false);
	}

	function deleteCustomEvent(id) {
		if (!id) return;
		customEvents = customEvents.filter((e) => e.id !== id);
		saveCustomEventsToStorage();
		populateCalendarWithExams();
		renderCalendar();
		if (selectedDate) renderDayTimeline(selectedDate);
	}


function initCalendarEvents() {
	if (todayMonthBtn) {
		todayMonthBtn.addEventListener("click", () => {
			currentDate = new Date();
			renderCalendar();
		});
	}
	prevMonthBtn.addEventListener("click", () => {
		currentDate.setMonth(currentDate.getMonth() - 1);
		renderCalendar();
	});
	nextMonthBtn.addEventListener("click", () => {
		currentDate.setMonth(currentDate.getMonth() + 1);
		renderCalendar();
	});

	closeModalBtn.addEventListener("click", closeModal);
	if (closeModalFooterBtn) closeModalFooterBtn.addEventListener("click", closeModal);
	saveEventBtn.addEventListener("click", saveEvent);
	eventModal.addEventListener("click", (e) => e.target === eventModal && closeModal());
	if (openAddEventBtn) openAddEventBtn.addEventListener("click", () => toggleAddEventForm());
	if (cancelAddEventBtn) cancelAddEventBtn.addEventListener("click", () => toggleAddEventForm(false));
	if (cancelAddEventX) cancelAddEventX.addEventListener("click", () => toggleAddEventForm(false));
	if (emptyStateAddBtn) emptyStateAddBtn.addEventListener("click", () => toggleAddEventForm(true));

	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape" && eventModal && !eventModal.classList.contains("hidden")) {
			closeModal();
		}
		if (e.key === "Escape" && gcalModal && !gcalModal.classList.contains("hidden")) {
			closeGcalModal();
		}
	});
	setInterval(updateAllCountdowns, 1000);
}

window.initCalendarEvents = initCalendarEvents;

window.StudyApp.calendar = {
	getCustomEventsStorageKey,
	loadCustomEvents,
	saveCustomEventsToStorage,
	getGoogleCalendarConfigsStorageKey,
	getGoogleCalendarEventsStorageKey,
	getGoogleCalendarAutoSyncStorageKey,
	loadGoogleCalendarState,
	saveGoogleCalendarConfigs,
	saveGoogleCalendarEvents,
	unescapeIcsText,
	parseIcsDateTime,
	parseIcsFeed,
	fetchIcsFeedWithFallback,
	syncGoogleCalendar,
	syncAllGoogleCalendars,
	updateGcalStatusDot,
	openGcalModal,
	closeGcalModal,
	renderGoogleCalendarsList,
	initGoogleCalendarIntegration,
	renderUpcomingExams,
	populateCalendarWithExams,
	formatMinutesTo12h,
	renderCalendar,
	renderCountdowns,
	updateAllCountdowns,
	openModal,
	closeModal,
	toggleAddEventForm,
	layoutTimelineEvents,
	renderDayTimeline,
	saveEvent,
	deleteCustomEvent,
	initCalendarEvents
};
