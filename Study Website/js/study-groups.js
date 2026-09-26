// ==========================================
// STUDY GROUPS, SHARED PRESENCE & GROUP CHAT
// ==========================================

window.StudyApp = window.StudyApp || {};

const studyGroupsState = {
    groups: [],
    room: null,
    pollTimer: null,
    displayTimer: null,
    roomRequest: null,
    activeTab: "live",
    lastMessageId: null,
    refreshCooldownUntil: 0,
    mobileRoomShowing: false
};
let sharedActivityHeartbeatTimer = null;

function studyGroupHeaders() {
    const token = currentUser && currentUser.token;
    return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

async function studyGroupRequest(path, options = {}) {
    const token = currentUser && currentUser.token;
    if (!token) {
        throw new Error("Your saved session needs to be refreshed. Log out, then sign in again before using study groups.");
    }
    const response = await fetch(`${API_URL}/api/study/groups${path}`, {
        ...options,
        headers: { ...studyGroupHeaders(), ...(options.headers || {}) }
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
        throw new Error("Your study session has expired. Log out, then sign in again before using study groups.");
    }
    if (!response.ok) throw new Error(data.error || "Study group request failed.");
    return data;
}

function formatGroupSeconds(seconds) {
    const totalSeconds = Math.floor(Math.max(0, Number(seconds) || 0));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;
    return hours ? `${hours}h ${String(minutes).padStart(2, "0")}m ${String(remainingSeconds).padStart(2, "0")}s` : `${minutes}m ${String(remainingSeconds).padStart(2, "0")}s`;
}

function updateStudyGroupStatus(message, isError = false) {
    if (!studyGroupStatus) return;
    studyGroupStatus.textContent = message || "";
    studyGroupStatus.className = `text-xs mt-3 ${isError ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"}`;
}

function setStudyGroupMobileRoomVisible(visible) {
    studyGroupsState.mobileRoomShowing = Boolean(visible && selectedStudyGroupId);
    if (studyGroupsPage) studyGroupsPage.classList.toggle("mobile-room-active", studyGroupsState.mobileRoomShowing);
}

async function loadStudyGroups() {
    try {
        studyGroupsState.groups = await studyGroupRequest("/");
        renderStudyGroupsList();
        if (selectedStudyGroupId && studyGroupsState.groups.some(group => group.id === selectedStudyGroupId)) {
            await loadStudyGroupRoom();
            setStudyGroupMobileRoomVisible(Boolean(studyGroupsState.room));
        } else if (studyGroupsState.groups.length) {
            await selectStudyGroup(studyGroupsState.groups[0].id);
        } else {
            renderStudyGroupRoomEmpty();
        }
    } catch (error) {
        updateStudyGroupStatus(error.message, true);
    }
}

function renderStudyGroupsList() {
    if (!studyGroupsList) return;
    if (!studyGroupsState.groups.length) {
        studyGroupsList.innerHTML = '<p class="text-sm text-slate-500 dark:text-slate-400">No study groups yet. Create one or join with a code.</p>';
        return;
    }
    studyGroupsList.innerHTML = studyGroupsState.groups.map(group => `
        <button type="button" data-group-id="${group.id}" class="study-group-list-item w-full text-left p-3 rounded-lg border ${group.id === selectedStudyGroupId ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-700 hover:border-blue-300"} transition">
            <span class="block font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">${escapeHtml(group.name)}</span>
            <span class="block text-xs text-slate-500 dark:text-slate-400 mt-1">${group.joinPolicy === "approval" ? "Approval required" : "Open with code"}</span>
        </button>
    `).join("");
    studyGroupsList.querySelectorAll("[data-group-id]").forEach(button => button.addEventListener("click", () => selectStudyGroup(button.dataset.groupId)));
}

async function selectStudyGroup(groupId) {
    if (selectedStudyGroupId !== groupId && activeSharedActivityId) await stopSharedStudyActivity();
    selectedStudyGroupId = groupId;
    studyGroupsState.room = null;
    studyGroupsState.lastMessageId = null;
    renderStudyGroupsList();
    await loadStudyGroupRoom();
    setStudyGroupMobileRoomVisible(Boolean(studyGroupsState.room));
    startStudyGroupPolling();
}

function renderStudyGroupRoomEmpty() {
    if (studyGroupRoom) studyGroupRoom.classList.add("hidden");
    if (studyGroupMemberHistory) studyGroupMemberHistory.classList.add("hidden");
    setStudyGroupMobileRoomVisible(false);
    closeStudyGroupSettings();
}

async function loadStudyGroupRoom() {
    if (!selectedStudyGroupId) return;
    if (studyGroupsState.roomRequest) return studyGroupsState.roomRequest;
    studyGroupsState.roomRequest = (async () => {
      try {
        const room = await studyGroupRequest(`/${selectedStudyGroupId}/room${studyGroupsState.lastMessageId ? `?sinceMessageId=${encodeURIComponent(studyGroupsState.lastMessageId)}` : ""}`);
        if (studyGroupsState.room && studyGroupsState.lastMessageId) {
            const existingMessages = studyGroupsState.room.messages || [];
            const messagesById = new Map(existingMessages.map(message => [message.id, message]));
            room.messages.forEach(message => messagesById.set(message.id, message));
            room.messages = Array.from(messagesById.values()).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }
        studyGroupsState.room = room;
        renderStudyGroupRoom(room);
        if (typeof isPaused !== "undefined" && !isPaused && !activeSharedActivityId && isStudyGroupSharingEnabled()) {
            const subject = (pomodoroSubjectSelect && pomodoroSubjectSelect.value) ? pomodoroSubjectSelect.value : "General";
            startSharedStudyActivity(subject, timerEngine);
        }
        updateStudyGroupStatus(`Updated ${new Date(room.serverNow).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
            } catch (error) {
        updateStudyGroupStatus(error.message, true);
            } finally {
                studyGroupsState.roomRequest = null;
            }
        })();
        return studyGroupsState.roomRequest;
}

function renderStudyGroupRoom(room) {
    if (!studyGroupRoom) return;
    studyGroupRoom.classList.remove("hidden");
    studyGroupRoomTitle.textContent = room.group.name;
    studyGroupRoomCode.textContent = room.group.joinCode ? `Code: ${room.group.joinCode}` : "Member room";
    studyGroupShareToggle.checked = room.privacy?.shareLiveStatus !== false;
    studyGroupShareLeaderboardToggle.checked = room.privacy?.shareLeaderboard === true;
    studyGroupShareHistoryToggle.checked = room.privacy?.shareHistory === true;
    studyGroupShareSubjectToggle.checked = room.privacy?.shareSubject === true;
    studyGroupShareActivityDetailsToggle.checked = room.privacy?.shareActivityDetails !== false;
    renderStudyGroupMembers(room.members, room.permissions);
    renderStudyGroupLeaderboard(room.leaderboard);
    renderStudyGroupMessages(room.messages);
    if (studyGroupOwnerControls) {
        studyGroupOwnerControls.classList.toggle("hidden", !room.permissions.isOwner);
        if (room.permissions.isOwner) {
            studyGroupOwnerName.value = room.group.name;
            studyGroupOwnerPolicy.value = room.group.joinPolicy;
            renderStudyGroupPendingMembers(room.pendingMembers || []);
        }
    }
    if (room.permissions.isOwner && room.group.joinCode) {
        studyGroupRoomCode.title = "Share this code with classmates";
    }
    room.messages.forEach(message => { studyGroupsState.lastMessageId = message.id; });
}

async function loadGlobalStudyLeaderboard() {
    if (!studyGroupGlobalLeaderboard) return;
    try {
        const data = await studyGroupRequest("/leaderboard/global");
        studyGroupGlobalLeaderboard.innerHTML = data.leaderboard.length ? data.leaderboard.map(item => `<div class="flex items-center justify-between gap-3 py-2 border-b border-slate-100 dark:border-slate-700 last:border-0"><span class="text-sm text-slate-700 dark:text-slate-200"><span class="inline-block w-6 text-slate-400">${item.rank}.</span>${escapeHtml(item.username)}</span><span class="text-sm font-semibold text-slate-700 dark:text-slate-200">${formatGroupSeconds(item.todaySeconds)}</span></div>`).join("") : '<p class="text-sm text-slate-500 dark:text-slate-400 py-2">No public study time yet today.</p>';
    } catch (error) {
        studyGroupGlobalLeaderboard.innerHTML = `<p class="text-sm text-rose-600 dark:text-rose-400 py-2">${escapeHtml(error.message)}</p>`;
    }
}

function renderStudyGroupMembers(members, permissions) {
    if (!studyGroupMembers) return;
    studyGroupMembers.innerHTML = members.map(member => {
        const liveLabel = member.live ? `<span class="text-blue-600 dark:text-blue-400" data-live-start="${member.live.startedAt}">${member.live.details ? escapeHtml(member.live.details) : "Online"}${member.live.subject ? ` · ${escapeHtml(member.live.subject)}` : ""} <span class="live-duration"></span></span>` : '<span class="text-slate-400">Offline</span>';
        const timeLabel = member.todaySeconds === null ? "Private" : `<span class="member-today-time" data-today-base="${member.todaySeconds}" data-today-synced-at="${studyGroupsState.room?.serverNow || new Date().toISOString()}"${member.live ? ` data-today-start="${member.live.startedAt}"` : ""}>${formatGroupSeconds(member.todaySeconds)}</span>`;
        return `<div class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/60 transition">
            <button type="button" data-member-id="${member.id}" class="min-w-0 flex-1 text-left"><span class="block font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">${escapeHtml(member.username)}${member.isSelf ? " (you)" : ""}</span><span class="block text-xs mt-1">${liveLabel}</span></button>
            <span class="shrink-0 text-xs font-semibold text-slate-600 dark:text-slate-300">${timeLabel}</span>
        </div>`;
    }).join("");
    studyGroupMembers.querySelectorAll("[data-member-id]").forEach(button => button.addEventListener("click", () => openStudyGroupHistory(button.dataset.memberId)));
    updateLiveStudyGroupDurations();
}

function renderStudyGroupPendingMembers(members) {
    if (!studyGroupPendingMembers) return;
    studyGroupPendingMembers.innerHTML = members.length ? `<p class="text-xs font-semibold text-slate-600 dark:text-slate-300">Pending requests</p>${members.map(member => `<div class="flex items-center justify-between gap-2 text-sm"><span class="truncate">${escapeHtml(member.username)}</span><button type="button" data-approve-member="${member.id}" class="text-xs font-semibold text-blue-600 dark:text-blue-400">Approve</button></div>`).join("")}` : '<p class="text-xs text-slate-500 dark:text-slate-400">No pending requests.</p>';
    studyGroupPendingMembers.querySelectorAll("[data-approve-member]").forEach(button => button.addEventListener("click", () => approveStudyGroupMember(button.dataset.approveMember)));
}

function updateLiveStudyGroupDurations() {
    if (!studyGroupMembers) return;
    studyGroupMembers.querySelectorAll("[data-live-start]").forEach(element => {
        const seconds = Math.max(0, Math.floor((Date.now() - new Date(element.dataset.liveStart).getTime()) / 1000));
        const duration = element.querySelector(".live-duration");
        if (duration) duration.textContent = `(${formatGroupSeconds(seconds)})`;
    });
    studyGroupMembers.querySelectorAll("[data-today-base]").forEach(element => {
        const syncedAt = new Date(element.dataset.todaySyncedAt).getTime();
        const liveStart = element.dataset.todayStart ? new Date(element.dataset.todayStart).getTime() : 0;
        const seconds = Number(element.dataset.todayBase) + (liveStart ? Math.max(0, Math.floor((Date.now() - Math.max(syncedAt, liveStart)) / 1000)) : 0);
        element.textContent = formatGroupSeconds(seconds);
    });
}

function toggleStudyGroupSettings(forceOpen) {
    if (!studyGroupSettingsPanel || !studyGroupSettingsButton) return;
    const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : studyGroupSettingsPanel.classList.contains("hidden");
    studyGroupSettingsPanel.classList.toggle("hidden", !shouldOpen);
    studyGroupSettingsButton.setAttribute("aria-expanded", String(shouldOpen));
}

function closeStudyGroupSettings() {
    toggleStudyGroupSettings(false);
}

function renderStudyGroupLeaderboard(leaderboard) {
    if (!studyGroupLeaderboard) return;
    studyGroupLeaderboard.innerHTML = leaderboard.length ? leaderboard.map(item => `<div class="flex items-center justify-between gap-3 py-2 border-b border-slate-100 dark:border-slate-700 last:border-0"><span class="text-sm text-slate-700 dark:text-slate-200"><span class="inline-block w-6 text-slate-400">${item.rank}.</span>${escapeHtml(item.username)}</span><span class="text-sm font-semibold text-slate-700 dark:text-slate-200">${formatGroupSeconds(item.todaySeconds)}</span></div>`).join("") : '<p class="text-sm text-slate-500 dark:text-slate-400">No shared study time yet today.</p>';
}

function renderStudyGroupMessages(messages) {
    if (!studyGroupMessages) return;
    if (!messages.length) {
        studyGroupMessages.innerHTML = '<p class="text-sm text-slate-500 dark:text-slate-400">Start the conversation.</p>';
        return;
    }
    studyGroupMessages.innerHTML = messages.map(message => `<div class="rounded-lg bg-slate-50 dark:bg-slate-700/60 p-2.5"><div class="flex items-baseline justify-between gap-2"><span class="text-xs font-semibold text-slate-700 dark:text-slate-200">${escapeHtml(message.username)}</span><time class="text-[10px] text-slate-400">${new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div><p class="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words mt-1">${escapeHtml(message.body)}</p></div>`).join("");
    studyGroupMessages.scrollTop = studyGroupMessages.scrollHeight;
}

async function openStudyGroupHistory(userId) {
    if (!selectedStudyGroupId || !studyGroupMemberHistory) return;
    const member = studyGroupsState.room?.members?.find(item => item.id === userId);
    const canManageMember = Boolean(studyGroupsState.room?.permissions?.isOwner && userId !== currentUser.id);
    let data = { user: { username: member ? member.username : "Member" }, sessions: [] };
    let historyError = "";
    try {
        data = await studyGroupRequest(`/${selectedStudyGroupId}/history/${userId}`);
    } catch (error) {
        historyError = error.message;
    }
    const managementActions = canManageMember ? `<div class="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700"><p class="text-xs text-slate-500 dark:text-slate-400 mb-3">Leader actions for this member</p><div class="flex flex-wrap gap-2"><button type="button" id="modal-transfer-member" class="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">Transfer ownership</button><button type="button" id="modal-remove-member" class="px-3 py-2 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-900/20">Remove from group</button></div></div>` : "";
    const historyContent = historyError ? `<p class="text-sm text-slate-500 dark:text-slate-400">${escapeHtml(historyError)}</p>` : (data.sessions.length ? data.sessions.map(session => `<div class="flex justify-between gap-3 py-2 border-t border-slate-100 dark:border-slate-700 text-sm"><span>${escapeHtml(session.details || session.subject || "Study session")}</span><span class="font-semibold">${formatGroupSeconds(session.durationSeconds)}</span></div>`).join("") : '<p class="text-sm text-slate-500 dark:text-slate-400">No shared sessions today.</p>');
    studyGroupMemberHistory.classList.remove("hidden");
    studyGroupMemberHistory.innerHTML = `<div class="w-[calc(100vw-2rem)] md:w-[80vw] h-[80vh] rounded-2xl bg-white dark:bg-slate-800 shadow-xl p-5 md:p-6 overflow-y-auto"><div class="flex items-center justify-between gap-3 mb-3"><h4 id="study-group-member-history-title" class="font-semibold text-lg text-slate-800 dark:text-slate-100">${escapeHtml(data.user.username)} today</h4><button type="button" id="close-group-history" aria-label="Close member history" class="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div><p class="text-xs text-slate-500 dark:text-slate-400 mb-3">Study history for the current study day.</p>${historyContent}${managementActions}</div>`;
    document.getElementById("close-group-history").addEventListener("click", () => studyGroupMemberHistory.classList.add("hidden"));
    const transferButton = document.getElementById("modal-transfer-member");
    const removeButton = document.getElementById("modal-remove-member");
    if (transferButton) transferButton.addEventListener("click", () => transferStudyGroupOwnership(userId));
    if (removeButton) removeButton.addEventListener("click", () => removeStudyGroupMember(userId));
}

async function handleCreateStudyGroup(event) {
    event.preventDefault();
    try {
        const data = await studyGroupRequest("/", { method: "POST", body: JSON.stringify({ name: studyGroupNameInput.value, joinPolicy: "public" }) });
        studyGroupNameInput.value = "";
        updateStudyGroupStatus(`Created ${data.name}. Share code ${data.joinCode} with your peers.`);
        await loadStudyGroups();
    } catch (error) {
        updateStudyGroupStatus(error.message, true);
    }
}

async function handleJoinStudyGroup(event) {
    event.preventDefault();
    try {
        const data = await studyGroupRequest("/join", { method: "POST", body: JSON.stringify({ joinCode: studyGroupJoinCodeInput.value }) });
        studyGroupJoinCodeInput.value = "";
        updateStudyGroupStatus(data.status === "pending" ? "Join request sent for approval." : `Joined ${data.name}.`);
        await loadStudyGroups();
    } catch (error) {
        updateStudyGroupStatus(error.message, true);
    }
}

async function handleStudyGroupMessage(event) {
    event.preventDefault();
    const body = studyGroupMessageInput.value.trim();
    if (!body || !selectedStudyGroupId) return;
    try {
        await studyGroupRequest(`/${selectedStudyGroupId}/messages`, { method: "POST", body: JSON.stringify({ body }) });
        studyGroupMessageInput.value = "";
        await loadStudyGroupRoom();
    } catch (error) {
        updateStudyGroupStatus(error.message, true);
    }
}

async function saveStudyGroupPrivacy() {
    if (!selectedStudyGroupId) return;
    try {
        await studyGroupRequest(`/${selectedStudyGroupId}/privacy`, {
            method: "PATCH",
            body: JSON.stringify({
                shareLiveStatus: studyGroupShareToggle.checked,
                shareLeaderboard: studyGroupShareLeaderboardToggle.checked,
                shareHistory: studyGroupShareHistoryToggle.checked,
                shareSubject: studyGroupShareSubjectToggle.checked,
                shareActivityDetails: studyGroupShareActivityDetailsToggle.checked
            })
        });
        await loadStudyGroupRoom();
    } catch (error) {
        updateStudyGroupStatus(error.message, true);
    }
}

function setStudyGroupTab(tab) {
    studyGroupsState.activeTab = tab;
    [studyGroupLivePanel, studyGroupLeaderboardPanel, studyGroupChatPanel].forEach(panel => panel && panel.classList.add("hidden"));
    const panel = tab === "live" ? studyGroupLivePanel : tab === "leaderboard" ? studyGroupLeaderboardPanel : studyGroupChatPanel;
    if (panel) panel.classList.remove("hidden");
    studyGroupTabs && studyGroupTabs.querySelectorAll("button").forEach(button => button.classList.toggle("bg-blue-600", button.dataset.tab === tab));
    if (tab === "leaderboard") loadGlobalStudyLeaderboard();
}

async function saveStudyGroupOwnerSettings(event) {
    event.preventDefault();
    if (!selectedStudyGroupId) return;
    try {
        await studyGroupRequest(`/${selectedStudyGroupId}`, { method: "PATCH", body: JSON.stringify({ name: studyGroupOwnerName.value, joinPolicy: studyGroupOwnerPolicy.value }) });
        updateStudyGroupStatus("Group settings saved.");
        await loadStudyGroups();
    } catch (error) {
        updateStudyGroupStatus(error.message, true);
    }
}

async function regenerateStudyGroupCode() {
    if (!selectedStudyGroupId || !confirm("Regenerate the join code? Existing codes will stop working.")) return;
    try {
        const data = await studyGroupRequest(`/${selectedStudyGroupId}`, { method: "PATCH", body: JSON.stringify({ regenerateCode: true }) });
        updateStudyGroupStatus(`New join code: ${data.joinCode}`);
        await loadStudyGroupRoom();
    } catch (error) {
        updateStudyGroupStatus(error.message, true);
    }
}

async function deleteStudyGroup() {
    const groupName = studyGroupsState.room?.group?.name || "this group";
    if (!selectedStudyGroupId || !confirm(`Delete ${groupName}? This permanently removes its members, messages, and study activity.`)) return;
    try {
        if (activeSharedActivityId) await stopSharedStudyActivity();
        await studyGroupRequest(`/${selectedStudyGroupId}`, { method: "DELETE" });
        selectedStudyGroupId = null;
        studyGroupsState.room = null;
        studyGroupsState.lastMessageId = null;
        closeStudyGroupSettings();
        await loadStudyGroups();
        updateStudyGroupStatus("Group deleted.");
    } catch (error) {
        updateStudyGroupStatus(error.message, true);
    }
}

async function approveStudyGroupMember(userId) {
    if (!selectedStudyGroupId) return;
    try {
        await studyGroupRequest(`/${selectedStudyGroupId}/members/${userId}/approve`, { method: "POST" });
        await loadStudyGroupRoom();
    } catch (error) {
        updateStudyGroupStatus(error.message, true);
    }
}

async function removeStudyGroupMember(userId) {
    if (!selectedStudyGroupId || !confirm("Remove this member from the group?")) return;
    try {
        await studyGroupRequest(`/${selectedStudyGroupId}/members/${userId}`, { method: "DELETE" });
        if (studyGroupMemberHistory) studyGroupMemberHistory.classList.add("hidden");
        await loadStudyGroupRoom();
    } catch (error) {
        updateStudyGroupStatus(error.message, true);
    }
}

async function transferStudyGroupOwnership(userId) {
    if (!selectedStudyGroupId || !confirm("Transfer group ownership to this member? You will become a regular member.")) return;
    try {
        await studyGroupRequest(`/${selectedStudyGroupId}/transfer/${userId}`, { method: "POST" });
        if (studyGroupMemberHistory) studyGroupMemberHistory.classList.add("hidden");
        await loadStudyGroups();
    } catch (error) {
        updateStudyGroupStatus(error.message, true);
    }
}

async function leaveStudyGroup() {
    if (!selectedStudyGroupId || !confirm("Leave this study group? You will need its code to join again.")) return;
    try {
        if (activeSharedActivityId) await stopSharedStudyActivity();
        await studyGroupRequest(`/${selectedStudyGroupId}/leave`, { method: "DELETE" });
        closeStudyGroupSettings();
        if (studyGroupMemberHistory) studyGroupMemberHistory.classList.add("hidden");
        selectedStudyGroupId = null;
        studyGroupsState.room = null;
        studyGroupsState.lastMessageId = null;
        updateStudyGroupStatus("You left the study group.");
        await loadStudyGroups();
    } catch (error) {
        updateStudyGroupStatus(error.message, true);
    }
}

function startStudyGroupPolling() {
    stopStudyGroupPolling();
    if (!selectedStudyGroupId || document.visibilityState === "hidden") return;
    studyGroupsState.pollTimer = setInterval(() => {
        if (document.visibilityState === "visible" && studyGroupsState.activeTab !== "") loadStudyGroupRoom();
    }, 45000);
}

function stopStudyGroupPolling() {
    if (studyGroupsState.pollTimer) clearInterval(studyGroupsState.pollTimer);
    studyGroupsState.pollTimer = null;
}

async function initializeStudyGroups() {
    await loadStudyGroups();
}

async function refreshStudyGroup() {
    const remaining = studyGroupsState.refreshCooldownUntil - Date.now();
    if (remaining > 0) return;
    studyGroupsState.refreshCooldownUntil = Date.now() + 15000;
    if (studyGroupRefreshButton) {
        studyGroupRefreshButton.disabled = true;
        studyGroupRefreshButton.title = "Refresh available in 15 seconds";
    }
    try {
        if (selectedStudyGroupId) await loadStudyGroupRoom();
        else await loadStudyGroups();
    } finally {
        window.setTimeout(() => {
            if (studyGroupRefreshButton) {
                studyGroupRefreshButton.disabled = false;
                studyGroupRefreshButton.title = "Refresh study group";
            }
        }, 15000);
    }
}

function handleStudyGroupsPageChange(page) {
    if (page === "groups") {
        startStudyGroupPolling();
    } else {
        stopStudyGroupPolling();
    }
}

function isStudyGroupSharingEnabled() {
    const sharingRequested = Boolean(studyGroupShareToggle && studyGroupShareToggle.checked);
    return Boolean(sharingRequested && selectedStudyGroupId && currentUser);
}

async function startSharedStudyActivity(subject, mode) {
    if (!isStudyGroupSharingEnabled() || activeSharedActivityId) return;
    activeSharedActivityId = `activity_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    try {
        const details = currentLinkedItem?.displayText || "";
        const response = await studyGroupRequest(`/${selectedStudyGroupId}/activity/start`, { method: "POST", body: JSON.stringify({ clientActivityId: activeSharedActivityId, subject, mode, details }) });
        activeSharedActivityId = response.activityId;
        if (sharedActivityHeartbeatTimer) clearInterval(sharedActivityHeartbeatTimer);
        sharedActivityHeartbeatTimer = setInterval(async () => {
            if (!activeSharedActivityId) return;
            try {
                await studyGroupRequest(`/${selectedStudyGroupId}/activity/heartbeat`, { method: "POST", body: JSON.stringify({ clientActivityId: activeSharedActivityId }) });
            } catch (error) {
                console.warn("Unable to refresh shared study activity:", error);
            }
        }, 90000);
        const room = studyGroupsState.room;
        const self = room?.members?.find(member => member.isSelf);
        if (room && self) {
            self.live = { activityId: response.activityId, startedAt: response.startedAt, mode, subject, details };
            room.serverNow = new Date().toISOString();
            renderStudyGroupRoom(room);
        }
    } catch (error) {
        activeSharedActivityId = null;
        console.warn("Unable to share study activity:", error);
    }
}

async function stopSharedStudyActivity() {
    if (!activeSharedActivityId || !selectedStudyGroupId) return;
    const activityId = activeSharedActivityId;
    activeSharedActivityId = null;
    if (sharedActivityHeartbeatTimer) clearInterval(sharedActivityHeartbeatTimer);
    sharedActivityHeartbeatTimer = null;
    try {
        const response = await studyGroupRequest(`/${selectedStudyGroupId}/activity/stop`, { method: "POST", body: JSON.stringify({ clientActivityId: activityId }) });
        const room = studyGroupsState.room;
        const self = room?.members?.find(member => member.isSelf);
        if (room && self) {
            self.live = null;
            if (self.todaySeconds !== null) self.todaySeconds = Number(self.todaySeconds || 0) + Number(response.durationSeconds || 0);
            room.serverNow = new Date().toISOString();
            renderStudyGroupRoom(room);
        }
    } catch (error) {
        console.warn("Unable to finalize shared study activity:", error);
    }
}

function initStudyGroupsEvents() {
    if (studyGroupCreateForm) studyGroupCreateForm.addEventListener("submit", handleCreateStudyGroup);
    if (studyGroupJoinForm) studyGroupJoinForm.addEventListener("submit", handleJoinStudyGroup);
    if (studyGroupMessageForm) studyGroupMessageForm.addEventListener("submit", handleStudyGroupMessage);
    const mobileBackButton = document.getElementById("study-group-back-button");
    if (mobileBackButton) mobileBackButton.addEventListener("click", () => {
        setStudyGroupMobileRoomVisible(false);
        const selectedButton = studyGroupsList?.querySelector(`[data-group-id="${selectedStudyGroupId}"]`);
        if (selectedButton) selectedButton.focus();
    });
    if (studyGroupOwnerForm) studyGroupOwnerForm.addEventListener("submit", saveStudyGroupOwnerSettings);
    if (studyGroupRegenerateCode) studyGroupRegenerateCode.addEventListener("click", regenerateStudyGroupCode);
    if (studyGroupDeleteButton) studyGroupDeleteButton.addEventListener("click", deleteStudyGroup);
    if (studyGroupGlobalLeaderboardBtn) studyGroupGlobalLeaderboardBtn.addEventListener("click", loadGlobalStudyLeaderboard);
    if (studyGroupSettingsButton) {
        studyGroupSettingsButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.09a2 2 0 0 1 1 1.74v.5a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
        studyGroupSettingsButton.addEventListener("click", () => toggleStudyGroupSettings());
    }
    if (studyGroupRefreshButton) studyGroupRefreshButton.addEventListener("click", refreshStudyGroup);
    if (studyGroupLeaveButton) studyGroupLeaveButton.addEventListener("click", leaveStudyGroup);
    if (studyGroupSettingsClose) studyGroupSettingsClose.addEventListener("click", closeStudyGroupSettings);
    if (studyGroupSettingsPanel) studyGroupSettingsPanel.addEventListener("click", event => event.target === studyGroupSettingsPanel && closeStudyGroupSettings());
    if (studyGroupMemberHistory) studyGroupMemberHistory.addEventListener("click", event => event.target === studyGroupMemberHistory && studyGroupMemberHistory.classList.add("hidden"));
    if (studyGroupTabs) studyGroupTabs.querySelectorAll("button").forEach(button => button.addEventListener("click", () => setStudyGroupTab(button.dataset.tab)));
    [studyGroupShareToggle, studyGroupShareLeaderboardToggle, studyGroupShareHistoryToggle, studyGroupShareSubjectToggle, studyGroupShareActivityDetailsToggle].forEach(toggle => toggle && toggle.addEventListener("change", saveStudyGroupPrivacy));
    syncStudyGroupPrivacyControls();
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && studyGroupsPage && !studyGroupsPage.classList.contains("hidden")) {
            loadStudyGroupRoom();
            startStudyGroupPolling();
        } else {
            stopStudyGroupPolling();
        }
    });
    studyGroupsState.displayTimer = setInterval(updateLiveStudyGroupDurations, 1000);
    setStudyGroupTab("live");
}

function syncStudyGroupPrivacyControls() {
    if (!currentUser || !privacyLiveStatusToggle) return;
    if (!currentUser.settings) currentUser.settings = {};
    let shouldPersistLiveDefault = false;
    if (typeof currentUser.settings.shareLiveStatus !== "boolean") {
        currentUser.settings.shareLiveStatus = true;
        shouldPersistLiveDefault = true;
        localStorage.setItem("studyUser", JSON.stringify(currentUser));
    }
    privacyLiveStatusToggle.checked = currentUser.settings.shareLiveStatus !== false;
    privacyLeaderboardToggle.checked = currentUser.settings?.shareLeaderboard === true;
    privacyHistoryToggle.checked = currentUser.settings?.shareHistory === true;
    privacySubjectToggle.checked = currentUser.settings?.shareSubject === true;
    if (shouldPersistLiveDefault) saveStudyGroupPrivacy();
}

window.handleStudyGroupsPageChange = handleStudyGroupsPageChange;
window.initStudyGroupsEvents = initStudyGroupsEvents;
window.initializeStudyGroups = initializeStudyGroups;
window.startSharedStudyActivity = startSharedStudyActivity;
window.stopSharedStudyActivity = stopSharedStudyActivity;
window.isStudyGroupSharingEnabled = isStudyGroupSharingEnabled;
window.syncStudyGroupPrivacyControls = syncStudyGroupPrivacyControls;
