// ==========================================
// TASKS & SUBTASKS MANAGEMENT
// ==========================================

window.StudyApp = window.StudyApp || {};

function saveTaskViewPreferences() {
	localStorage.setItem(
		TASK_VIEW_PREFS_KEY,
		JSON.stringify({
			taskSubjectFilter,
			taskStatusFilter,
			taskSort,
		})
	);
}

function loadTaskViewPreferences() {
	try {
		const rawPrefs = localStorage.getItem(TASK_VIEW_PREFS_KEY);
		if (!rawPrefs) return;
		const prefs = JSON.parse(rawPrefs);
		if (prefs.taskSubjectFilter) taskSubjectFilter = prefs.taskSubjectFilter;
		if (prefs.taskStatusFilter) taskStatusFilter = prefs.taskStatusFilter;
		if (prefs.taskSort) taskSort = prefs.taskSort;
	} catch (error) {
		console.warn("Failed to load task view preferences:", error);
	}
}

const isTaskExpanded = (taskId) => taskCollapseState[taskId] === true;

function toggleTaskSubtasks(taskId) {
	taskCollapseState[taskId] = !isTaskExpanded(taskId);
	renderTasksPage();
}


// --- Task Management (DB) ---
async function loadTasks() {
	if (!currentUser) return;
	try {
		const response = await fetch(`${API_URL}/api/study/tasks?userId=${currentUser.id}`);
		tasks = await response.json();
		renderTasksPage();
	} catch (error) {
		console.error("Failed to fetch tasks:", error);
	}
}
async function addTask() {
	const text = taskInput.value.trim();
	const subject = taskSubjectSelect.value;
	const time = taskTimeInput.value;
	const deadline = taskDeadlineInput.value;
	if (!text || !subject || !time || !deadline) return;
	const tempId = `temp_${Date.now()}`;
	const optimisticTask = { _id: tempId, text, subject, time, deadline, completed: false, subTasks: [] };
	tasks.push(optimisticTask);
	renderTasksPage();
	taskInput.value = "";
	taskTimeInput.value = "";
	taskDeadlineInput.value = "";
	taskErrorEl.textContent = "";
	try {
		const response = await fetch(`${API_URL}/api/study/tasks`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ text, subject, time, deadline, userId: currentUser.id }),
		});
		if (!response.ok) throw new Error("Server error");
		const savedTask = await response.json();
		// Replace the temp task with the real one from server (gets the real _id)
		const tempIndex = tasks.findIndex((t) => t._id === tempId);
		if (tempIndex !== -1) tasks[tempIndex] = savedTask;
		renderTasksPage();
	} catch (error) {
		console.error("Failed to add task:", error);
		tasks = tasks.filter((t) => t._id !== tempId);
		renderTasksPage();
		taskErrorEl.textContent = "Failed to save task. Please try again.";
		setTimeout(() => (taskErrorEl.textContent = ""), 3000);
	}
}
async function toggleTask(task) {
	const originalCompleted = task.completed;
	task.completed = !task.completed;
	renderTasksPage();
	try {
		const response = await fetch(`${API_URL}/api/study/tasks/${task._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completed: task.completed }) });
		if (!response.ok) throw new Error("Server error");
	} catch (error) {
		console.error("Failed to toggle task:", error);
		task.completed = originalCompleted;
		renderTasksPage();
	}
}
async function deleteTask(taskId) {
	const taskIndex = tasks.findIndex((t) => t._id === taskId);
	if (taskIndex === -1) return;
	const deletedTask = tasks[taskIndex];
	tasks.splice(taskIndex, 1);
	renderTasksPage();
	try {
		const response = await fetch(`${API_URL}/api/study/tasks/${taskId}`, { method: "DELETE" });
		if (!response.ok) throw new Error("Server error");
	} catch (error) {
		console.error("Failed to delete task:", error);
		tasks.splice(taskIndex, 0, deletedTask);
		renderTasksPage();
	}
}

async function saveTaskOrder(orderedIds) {
	try {
		await fetch(`${API_URL}/api/study/tasks/reorder`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ orderedIds }),
		});
	} catch (error) {
		console.error("Failed to save task order:", error);
	}
}

async function saveSubTaskOrder(taskId, orderedIds) {
	try {
		await fetch(`${API_URL}/api/study/tasks/${taskId}/subtasks/reorder`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ orderedIds }),
		});
	} catch (error) {
		console.error("Failed to save sub-task order:", error);
	}
}

// --- Sub-task functions ---
async function addSubTask(taskId, text, fromModal = false) {
	if (!text.trim()) return;
	const task = tasks.find((t) => t._id === taskId);
	if (!task) return;
	const tempSubId = `temp_${Date.now()}`;
	const optimisticSubTask = { _id: tempSubId, text, completed: false };
	if (!task.subTasks) task.subTasks = [];
	task.subTasks.push(optimisticSubTask);

	if (fromModal) {
		renderSubtasksInModal(taskId);
	} else {
		renderTasksPage();
	}

	try {
		const response = await fetch(`${API_URL}/api/study/tasks/${taskId}/subtasks`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ text }),
		});
		if (!response.ok) throw new Error("Server error");

		// Silently update the temp subtask ID with the real one from the server
		const updatedTask = await response.json();
		const taskIndex = tasks.findIndex((t) => t._id === taskId);
		if (taskIndex !== -1) {
			// Only replace the subTasks array to get real IDs, without triggering a re-render
			tasks[taskIndex].subTasks = updatedTask.subTasks;
		}
	} catch (error) {
		console.error("Failed to add sub-task:", error);
		const taskToRevert = tasks.find((t) => t._id === taskId);
		if (taskToRevert) {
			taskToRevert.subTasks = taskToRevert.subTasks.filter((st) => st._id !== tempSubId);
		}
		if (fromModal) {
			renderSubtasksInModal(taskId);
		} else {
			renderTasksPage();
		}
	}
}
async function toggleSubTask(taskId, subtaskId, completed) {
	const task = tasks.find((t) => t._id === taskId);
	const subTask = task?.subTasks.find((st) => st._id === subtaskId);
	if (!subTask) return;
	const oldStatus = subTask.completed;
	subTask.completed = completed;
	renderTasksPage();
	try {
		await updateSubTask(taskId, subtaskId, { completed });
	} catch (error) {
		console.error("Failed to toggle sub-task:", error);
		subTask.completed = oldStatus;
		renderTasksPage();
	}
}

async function updateSubTask(taskId, subtaskId, updates, fromModal = false) {
	try {
		const response = await fetch(`${API_URL}/api/study/tasks/${taskId}/subtasks/${subtaskId}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(updates),
		});
		if (!response.ok) throw new Error("Server error");

		// Silently sync IDs without re-rendering
		const updatedTask = await response.json();
		const taskIndex = tasks.findIndex((t) => t._id === taskId);
		if (taskIndex !== -1) tasks[taskIndex].subTasks = updatedTask.subTasks;
	} catch (error) {
		console.error("Failed to update sub-task:", error);
		// Revert is handled by the calling function (e.g. toggleSubTask)
	}
}

async function deleteSubTask(taskId, subtaskId, fromModal = false) {
	const task = tasks.find((t) => t._id === taskId);
	if (!task) return;
	const subtaskIndex = task.subTasks.findIndex((st) => st._id === subtaskId);
	if (subtaskIndex === -1) return;
	const deletedSubTask = task.subTasks[subtaskIndex];
	task.subTasks.splice(subtaskIndex, 1);

	if (fromModal) {
		renderSubtasksInModal(taskId);
	} else {
		renderTasksPage();
	}

	try {
		const response = await fetch(`${API_URL}/api/study/tasks/${taskId}/subtasks/${subtaskId}`, {
			method: "DELETE",
		});
		if (!response.ok) throw new Error("Server error");
	} catch (error) {
		console.error("Failed to delete sub-task:", error);
		task.subTasks.splice(subtaskIndex, 0, deletedSubTask);
		if (fromModal) {
			renderSubtasksInModal(taskId);
		} else {
			renderTasksPage();
		}
	}
}


function renderNextTodos() {
	const incomplete = tasks.filter((t) => !t.completed).slice(0, 3);
	nextTodosContainer.innerHTML = "";
	if (incomplete.length === 0) {
		nextTodosContainer.innerHTML = `<div class="text-center p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-500/30 rounded-lg"><p class="font-semibold text-green-700 dark:text-green-400">All caught up!</p></div>`;
		return;
	}
	incomplete.forEach((task) => {
		const el = document.createElement("div");
		el.className = "p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg";
		let progressBarHtml = "";
		if (task.subTasks && task.subTasks.length > 0) {
			const completedCount = task.subTasks.filter((st) => st.completed).length;
			const totalCount = task.subTasks.length;
			const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
			progressBarHtml = `
                    <div class="mt-2 flex items-center gap-2">
                        <div class="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                            <div class="bg-green-500 h-2 rounded-full" style="width: ${percentage}%"></div>
                        </div>
                        <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">${completedCount}/${totalCount}</span>
                    </div>`;
		}
		el.innerHTML = `
                <div class="flex items-start space-x-3">
                    <div class="mt-1 w-2.5 h-2.5 rounded-full" style="background-color: ${getColorForSubject(task.subject)};"></div>
                    <div>
                        <p class="font-semibold text-slate-800 dark:text-slate-200">${task.text}</p>
                        <p class="text-sm text-slate-500 dark:text-slate-400">Due: ${new Date(task.deadline).toLocaleDateString()}</p>
                    </div>
                </div>
                ${progressBarHtml}`;
		nextTodosContainer.appendChild(el);
	});
}


function renderTasksPage() {
	if (typeof refreshLinkActivityData === "function") {
		refreshLinkActivityData();
	}
	let tasksToRender = [...tasks];
	if (taskSubjectFilter !== "all") {
		tasksToRender = tasksToRender.filter((task) => task.subject === taskSubjectFilter);
	}
	if (taskStatusFilter === "completed") {
		tasksToRender = tasksToRender.filter((task) => task.completed);
	} else if (taskStatusFilter === "inprogress") {
		tasksToRender = tasksToRender.filter((task) => !task.completed);
	}
	if (taskSort === "dueDate") {
		tasksToRender.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
	} else if (taskSort === "time") {
		tasksToRender.sort((a, b) => a.time - b.time);
	}
	// "custom" sort uses the server-side order field — no client sort needed

	// Destroy existing sortable before re-rendering
	if (taskSortableInstance) {
		taskSortableInstance.destroy();
		taskSortableInstance = null;
	}
	subtaskSortableInstances.forEach((instance) => instance.destroy());
	subtaskSortableInstances = [];

	fullTaskListEl.innerHTML = "";
	if (!tasksToRender.length) {
		fullTaskListEl.innerHTML = `<p class="text-slate-400 text-center py-4">No tasks match your filters.</p>`;
		return;
	}
	const isCustomSort = taskSort === "custom";
	tasksToRender.forEach((task) => {
		const el = document.createElement("div");
		el.className = "task-item p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg";
		el.dataset.id = task._id;
		const completedClass = task.completed ? " line-through text-slate-400 dark:text-slate-500" : "";
		const isExpanded = isTaskExpanded(task._id);
		let subtasksHtml = `<div class="subtask-list pl-2 mt-2 space-y-1" data-task-id="${task._id}" ${isCustomSort ? 'aria-label="Sub-tasks. Drag or use move buttons to reorder."' : ""}>`;
		let progressBarHtml = "";
		if (task.subTasks && task.subTasks.length > 0) {
			const completedCount = task.subTasks.filter((st) => st.completed).length;
			const totalCount = task.subTasks.length;
			const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
			progressBarHtml = `
                    <div class="mt-2 flex items-center gap-2">
						<button type="button" class="task-collapse-btn flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" aria-expanded="${isExpanded}" aria-label="${isExpanded ? "Collapse sub-tasks" : "Expand sub-tasks"}" title="${isExpanded ? "Collapse sub-tasks" : "Expand sub-tasks"}">
							<i class="${isExpanded ? "icon-angle-up" : "icon-angle-down"}"></i>
						</button>
                        <div class="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                            <div class="bg-green-500 h-2 rounded-full" style="width: ${percentage}%"></div>
                        </div>
                        <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">${completedCount}/${totalCount}</span>
                    </div>
                `;
			task.subTasks.forEach((st) => {
				const subCompletedClass = st.completed ? " line-through text-slate-500" : "dark:text-slate-300";
				subtasksHtml += `
                        <div class="subtask-item group flex items-center justify-between" data-id="${st._id}" data-parent-id="${task._id}">
                            <div class="flex items-center flex-grow min-w-0">
								${isCustomSort ? `<button type="button" class="subtask-drag-handle mr-2 flex-shrink-0 cursor-grab text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors" title="Drag to reorder sub-task" aria-label="Drag to reorder sub-task"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg></button>` : ""}
                                <input type="checkbox" ${st.completed ? "checked" : ""} class="subtask-checkbox h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer">
                                <span class="subtask-text-view ml-2 text-sm cursor-pointer ${subCompletedClass}">${st.text}</span>
                            </div>
							<div class="flex items-center">
								${isCustomSort ? `
									<button type="button" class="move-subtask-up-btn text-slate-400 hover:text-blue-500 mr-1" aria-label="Move sub-task up" title="Move sub-task up">↑</button>
									<button type="button" class="move-subtask-down-btn text-slate-400 hover:text-blue-500 mr-1" aria-label="Move sub-task down" title="Move sub-task down">↓</button>
								` : ""}
                            	<button class="delete-subtask-btn text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100">
                                	<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            	</button>
							</div>
                        </div>
                    `;
			});
		}
		subtasksHtml += "</div>";

		el.innerHTML = `
                <div class="flex items-start justify-between group">
                    ${isCustomSort ? `<button type="button" class="task-drag-handle self-start mt-0.5 mr-2 flex-shrink-0 cursor-grab text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors" title="Drag to reorder task" aria-label="Drag to reorder task"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg></button>` : ""}
                    <div class="flex items-start flex-grow">
                        <input type="checkbox" ${task.completed ? "checked" : ""} class="task-checkbox mt-1 mr-3 h-5 w-5 rounded border-gray-300 text-blue-600 cursor-pointer">
                        <div class="task-details-view w-full">
                            <p class="font-medium text-slate-700 dark:text-slate-200 ${completedClass}">${task.text}</p>
                            <div class="flex flex-wrap items-center gap-x-2 text-xs mt-1 ${completedClass}">
                                <span class="flex items-center font-semibold" style="color:${getColorForSubject(task.subject)};"><span class="w-2 h-2 rounded-full mr-1.5" style="background-color:${getColorForSubject(task.subject)};"></span>${task.subject}</span>
                                <span class="dark:text-slate-400">•</span><span class="dark:text-slate-400">${task.time} mins</span><span class="dark:text-slate-400">•</span><span class="dark:text-slate-400">${new Date(task.deadline).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center">
                         <button class="edit-task-btn opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-500 mr-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="delete-task-btn opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
						${isCustomSort ? `
							<button type="button" class="move-task-up-btn text-slate-400 hover:text-blue-500 ml-1" aria-label="Move task up" title="Move task up">↑</button>
							<button type="button" class="move-task-down-btn text-slate-400 hover:text-blue-500 ml-1" aria-label="Move task down" title="Move task down">↓</button>
						` : ""}
                    </div>
                </div>
                ${progressBarHtml}
				<div class="subtask-panel overflow-hidden ${isExpanded ? "expanded" : ""}" data-task-id="${task._id}">
                	${subtasksHtml}
                	<div class="mt-2 pl-2 flex items-center gap-2">
                    	<input type="text" id="subtask-input-${task._id}" class="w-full text-sm p-1 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700" placeholder="Add sub-task...">
                    	<button class="add-subtask-btn text-xs bg-blue-500 text-white rounded px-2 py-1" data-task-id="${task._id}">Add</button>
                	</div>
                </div>
            `;
		fullTaskListEl.appendChild(el);
	});

	applySubtaskPanelHeights();

	// Initialize Sortable only in custom order mode
	if (isCustomSort) {
		taskSortableInstance = new Sortable(fullTaskListEl, {
			animation: 150,
			handle: ".task-drag-handle",
			delayOnTouchOnly: true,
			delay: 120,
			touchStartThreshold: 5,
			ghostClass: "sortable-ghost",
			dragClass: "sortable-drag",
			onEnd: (evt) => {
				// Reorder the local tasks array to match the new DOM order
				const newOrderedIds = [...evt.to.children].map((el) => el.dataset.id);
				const taskMap = new Map(tasks.map((t) => [t._id, t]));
				// Rebuild tasks array in new order (preserving any tasks not visible due to filters)
				const reorderedVisible = newOrderedIds.map((id) => taskMap.get(id)).filter(Boolean);
				const hiddenTasks = tasks.filter((t) => !newOrderedIds.includes(t._id));
				tasks = [...reorderedVisible, ...hiddenTasks];
				saveTaskOrder(newOrderedIds);
			},
		});

		document.querySelectorAll(".subtask-list").forEach((subtaskListEl) => {
			const taskId = subtaskListEl.dataset.taskId;
			const subtaskSortable = new Sortable(subtaskListEl, {
				animation: 150,
				handle: ".subtask-drag-handle",
				delayOnTouchOnly: true,
				delay: 120,
				touchStartThreshold: 5,
				ghostClass: "sortable-ghost",
				dragClass: "sortable-drag",
				onEnd: (evt) => {
					const subtaskIds = [...evt.to.children].map((el) => el.dataset.id);
					const task = tasks.find((t) => t._id === taskId);
					if (!task || !Array.isArray(task.subTasks)) return;
					const subtaskMap = new Map(task.subTasks.map((st) => [st._id, st]));
					task.subTasks = subtaskIds.map((id) => subtaskMap.get(id)).filter(Boolean);
					saveSubTaskOrder(taskId, subtaskIds);
				},
			});
			subtaskSortableInstances.push(subtaskSortable);
		});
	}
}

function applySubtaskPanelHeights() {
	document.querySelectorAll(".subtask-panel").forEach((panelEl) => {
		const taskId = panelEl.dataset.taskId;
		const expanded = isTaskExpanded(taskId);
		if (expanded) {
			panelEl.style.maxHeight = "0px";
			requestAnimationFrame(() => {
				panelEl.style.maxHeight = `${panelEl.scrollHeight}px`;
			});
		} else {
			panelEl.style.maxHeight = `${panelEl.scrollHeight}px`;
			requestAnimationFrame(() => {
				panelEl.style.maxHeight = "0px";
			});
		}
	});
}

function moveTaskByOffset(taskId, offset) {
	if (taskSort !== "custom") return;
	const currentIndex = tasks.findIndex((task) => task._id === taskId);
	const targetIndex = currentIndex + offset;
	if (currentIndex < 0 || targetIndex < 0 || targetIndex >= tasks.length) return;
	const [movedTask] = tasks.splice(currentIndex, 1);
	tasks.splice(targetIndex, 0, movedTask);
	renderTasksPage();
	saveTaskOrder(tasks.map((task) => task._id));
}

function moveSubTaskByOffset(taskId, subtaskId, offset) {
	if (taskSort !== "custom") return;
	const task = tasks.find((t) => t._id === taskId);
	if (!task || !Array.isArray(task.subTasks)) return;
	const currentIndex = task.subTasks.findIndex((subtask) => subtask._id === subtaskId);
	const targetIndex = currentIndex + offset;
	if (currentIndex < 0 || targetIndex < 0 || targetIndex >= task.subTasks.length) return;
	const [movedSubTask] = task.subTasks.splice(currentIndex, 1);
	task.subTasks.splice(targetIndex, 0, movedSubTask);
	renderTasksPage();
	saveSubTaskOrder(taskId, task.subTasks.map((subtask) => subtask._id));
}


function openEditModal(taskId) {
	const task = tasks.find((t) => t._id === taskId);
	if (!task) return;

	editingTaskId = taskId;
	editTaskText.value = task.text;
	editTaskSubject.value = task.subject;
	editTaskTime.value = task.time;
	editTaskDeadline.value = new Date(task.deadline).toISOString().split("T")[0];

	renderSubtasksInModal(taskId);

	editTaskModal.classList.remove("hidden");
}

function closeEditModal() {
	editingTaskId = null;
	editTaskModal.classList.add("hidden");
}

async function saveTaskEdits() {
	if (!editingTaskId) return;
	const taskIdToSave = editingTaskId;
	const updates = {
		text: editTaskText.value.trim(),
		subject: editTaskSubject.value,
		time: editTaskTime.value,
		deadline: editTaskDeadline.value,
	};

	// Optimistic UI update — snapshot original for rollback
	const taskIndex = tasks.findIndex((t) => t._id === taskIdToSave);
	let originalTask = null;
	if (taskIndex > -1) {
		originalTask = { ...tasks[taskIndex], subTasks: [...(tasks[taskIndex].subTasks || [])] };
		tasks[taskIndex] = { ...tasks[taskIndex], ...updates, subTasks: originalTask.subTasks };
		renderTasksPage();
	}

	closeEditModal();

	try {
		const response = await fetch(`${API_URL}/api/study/tasks/${taskIdToSave}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(updates),
		});
		if (!response.ok) throw new Error("Server error");
		// Success — local state is already correct, no reload needed
	} catch (error) {
		console.error("Failed to save task changes:", error);
		// Rollback the optimistic update
		if (taskIndex > -1 && originalTask) {
			tasks[taskIndex] = originalTask;
			renderTasksPage();
		}
	}
}

function renderSubtasksInModal(taskId) {
	const task = tasks.find((t) => t._id === taskId);
	editSubtaskList.innerHTML = "";
	if (!task || !task.subTasks || task.subTasks.length === 0) {
		editSubtaskList.innerHTML = '<p class="text-slate-400 text-sm text-center">No sub-tasks yet.</p>';
		return;
	}

	task.subTasks.forEach((st) => {
		const subtaskEl = document.createElement("div");
		subtaskEl.className = "subtask-item-edit group flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg";
		subtaskEl.dataset.id = st._id;
		const subCompletedClass = st.completed ? " line-through text-slate-500" : "dark:text-slate-300";

		subtaskEl.innerHTML = `
                <span class="subtask-text-edit text-sm cursor-pointer ${subCompletedClass}">${st.text}</span>
                <button class="delete-subtask-btn-edit text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            `;
		editSubtaskList.appendChild(subtaskEl);
	});
}


function initTaskEvents() {
	fullTaskListEl.addEventListener("click", (e) => {
		const target = e.target;
		const taskItem = target.closest(".task-item");
		const subtaskItem = target.closest(".subtask-item");

		if (target.closest(".task-checkbox") && taskItem) {
			const task = tasks.find((t) => t._id === taskItem.dataset.id);
			if (task) toggleTask(task);
		} else if (target.closest(".delete-task-btn") && taskItem) {
			deleteTask(taskItem.dataset.id);
		} else if (target.closest(".add-subtask-btn")) {
			const taskId = target.dataset.taskId;
			const inputEl = document.getElementById(`subtask-input-${taskId}`);
			if (inputEl) {
				addSubTask(taskId, inputEl.value);
				inputEl.value = "";
			}
		} else if (target.closest(".subtask-checkbox") && subtaskItem) {
			const taskId = subtaskItem.dataset.parentId;
			const subtaskId = subtaskItem.dataset.id;
			toggleSubTask(taskId, subtaskId, target.checked);
		} else if (target.closest(".edit-task-btn") && taskItem) {
			openEditModal(taskItem.dataset.id);
		} else if (target.closest(".delete-subtask-btn") && subtaskItem) {
			const taskId = subtaskItem.dataset.parentId;
			const subtaskId = subtaskItem.dataset.id;
			deleteSubTask(taskId, subtaskId);
		} else if (target.closest(".move-task-up-btn") && taskItem) {
			moveTaskByOffset(taskItem.dataset.id, -1);
		} else if (target.closest(".move-task-down-btn") && taskItem) {
			moveTaskByOffset(taskItem.dataset.id, 1);
		} else if (target.closest(".move-subtask-up-btn") && subtaskItem) {
			moveSubTaskByOffset(subtaskItem.dataset.parentId, subtaskItem.dataset.id, -1);
		} else if (target.closest(".move-subtask-down-btn") && subtaskItem) {
			moveSubTaskByOffset(subtaskItem.dataset.parentId, subtaskItem.dataset.id, 1);
		} else if (target.closest(".task-collapse-btn") && taskItem) {
			toggleTaskSubtasks(taskItem.dataset.id);
		}
	});

	addTaskBtn.addEventListener("click", addTask);
	taskInput.addEventListener("keydown", (e) => e.key === "Enter" && addTask());

	filterSubjectEl.addEventListener("change", (e) => {
		taskSubjectFilter = e.target.value;
		saveTaskViewPreferences();
		renderTasksPage();
	});
	filterStatusEl.addEventListener("change", (e) => {
		taskStatusFilter = e.target.value;
		saveTaskViewPreferences();
		renderTasksPage();
	});
	sortTasksEl.addEventListener("change", (e) => {
		taskSort = e.target.value;
		saveTaskViewPreferences();
		renderTasksPage();
	});


	cancelEditTaskBtn.addEventListener("click", closeEditModal);
	saveEditTaskBtn.addEventListener("click", saveTaskEdits);
	editAddSubtaskBtn.addEventListener("click", () => {
		if (editingTaskId && editAddSubtaskInput.value.trim()) {
			addSubTask(editingTaskId, editAddSubtaskInput.value.trim(), true);
			editAddSubtaskInput.value = "";
		}
	});
	editSubtaskList.addEventListener("click", (e) => {
		const subtaskItem = e.target.closest(".subtask-item-edit");
		if (!subtaskItem) return;
		const subtaskId = subtaskItem.dataset.id;

		if (e.target.closest(".delete-subtask-btn-edit")) {
			deleteSubTask(editingTaskId, subtaskId, true);
		} else if (e.target.closest(".subtask-text-edit")) {
			const currentText = e.target.textContent;
			const newText = prompt("Edit sub-task:", currentText);
			if (newText && newText.trim() !== currentText) {
				updateSubTask(
					editingTaskId,
					subtaskId,
					{
						text: newText.trim(),
					},
					true
				);
			}
		}
	});

}

window.initTaskEvents = initTaskEvents;

window.StudyApp.tasks = {
	saveTaskViewPreferences,
	loadTaskViewPreferences,
	isTaskExpanded,
	toggleTaskSubtasks,
	loadTasks,
	addTask,
	toggleTask,
	deleteTask,
	saveTaskOrder,
	saveSubTaskOrder,
	addSubTask,
	toggleSubTask,
	updateSubTask,
	deleteSubTask,
	renderNextTodos,
	renderTasksPage,
	applySubtaskPanelHeights,
	moveTaskByOffset,
	moveSubTaskByOffset,
	openEditModal,
	closeEditModal,
	saveTaskEdits,
	renderSubtasksInModal,
	initTaskEvents
};
