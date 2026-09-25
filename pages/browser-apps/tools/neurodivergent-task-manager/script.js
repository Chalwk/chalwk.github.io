// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

'use strict';

// ---------------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------------
const taskForm = document.getElementById('task-form');
const tasksList = document.getElementById('tasks-list');
const completedTasks = document.getElementById('completed-tasks');
const remindersList = document.getElementById('reminders-list');
const stepsContainer = document.getElementById('steps-container');
const addStepBtn = document.getElementById('add-step');
const visualTimer = document.getElementById('visual-timer');
const startTimerBtn = document.getElementById('start-timer');
const pauseTimerBtn = document.getElementById('pause-timer');
const resetTimerBtn = document.getElementById('reset-timer');
const customTimerInput = document.getElementById('custom-timer');
const setCustomTimerBtn = document.getElementById('set-custom-timer');
const pointsElement = document.getElementById('points');
const streakElement = document.getElementById('streak');
const tasksCompletedElement = document.getElementById('tasks-completed');
const templateDropdown = document.getElementById('template-dropdown');
const useTemplateBtn = document.getElementById('use-template-btn');

const sortSelect = document.getElementById('task-sort');
const focusModeBtn = document.getElementById('focus-mode-btn');
const focusModeOverlay = document.getElementById('focus-mode-overlay');
const focusModeContent = document.getElementById('focus-mode-content');
const focusModeCloseBtn = document.getElementById('focus-mode-close');
const soundToggle = document.getElementById('sound-toggle');
const motionToggle = document.getElementById('motion-toggle');
const notifyToggle = document.getElementById('notify-toggle');
const exportBtn = document.getElementById('export-data-btn');
const importInput = document.getElementById('import-data-input');
const importBtn = document.getElementById('import-data-btn');
const notificationContainer = document.getElementById('notification-container');
const submitBtn = document.getElementById('task-submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const editingTaskIdInput = document.getElementById('editing-task-id');
const taskFormTitle = document.getElementById('task-form-title-text');

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let tasks = safeParse('tasks', []);
let completedTasksList = safeParse('completedTasks', []);
let reminders = safeParse('reminders', []);
let userStats = safeParse('userStats', {
    points: 0,
    streak: 0,
    tasksCompleted: 0,
    achievements: [],
    lastCompletion: null
});
let timerUses = safeParse('timerUses', 0);
let settings = safeParse('settings', {
    sound: true,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    notifications: false
});
let sortMode = localStorage.getItem('sortMode') || 'created';

let timerInterval = null;
let timerDuration = 25 * 60;   // total length of the current timer, seconds
let timerRemaining = 25 * 60;  // seconds left
let timerEndAt = null;         // timestamp (ms) the timer will hit zero, when running
let timerRunning = false;
let activeTimerTaskId = null;

const baseTitle = document.title;

function safeParse(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
        console.error(`Couldn't read "${key}" from storage, using default.`, err);
        return fallback;
    }
}

function escapeHTML(value) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
}

// ---------------------------------------------------------------------------
// Task templates
// ---------------------------------------------------------------------------
const taskTemplates = [
    {
        title: "Morning Routine 🌅",
        description: "Start your day right",
        steps: ["Make bed", "Brush teeth", "Drink water", "Eat breakfast"],
        priority: "medium",
        timer: 30
    },
    {
        title: "Work Session 💼",
        description: "Focused work time",
        steps: ["Check emails", "Prioritize tasks", "Work on main project", "Take short breaks"],
        priority: "high",
        timer: 45
    },
    {
        title: "Exercise 🏃‍♂️",
        description: "Get moving and stay healthy",
        steps: ["Warm up stretches", "Cardio exercise", "Strength training", "Cool down"],
        priority: "medium",
        timer: 60
    },
    {
        title: "Study Session 📚",
        description: "Learning and knowledge building",
        steps: ["Review previous notes", "Read new material", "Take notes", "Practice problems"],
        priority: "high",
        timer: 25
    },
    {
        title: "Evening Wind-down 🌙",
        description: "Prepare for restful sleep",
        steps: ["Tidy living space", "Prepare for tomorrow", "Relaxation activity", "Digital devices off"],
        priority: "low",
        timer: 20
    },
    {
        title: "Creative Time 🎨",
        description: "Express yourself creatively",
        steps: ["Gather materials", "Warm up exercise", "Main creative work", "Clean up"],
        priority: "medium",
        timer: 40
    }
];

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
function init() {
    applySettings();
    populateTemplateDropdown();
    restoreTimerState();
    renderTasks();
    renderCompletedTasks();
    renderReminders();
    updateStats();
    updateAchievements();
    updateTimerDisplay();
    updateTimerCircle();
    updateTabTitle();

    checkReminders();
    setInterval(checkReminders, 30 * 1000);
}

// ---------------------------------------------------------------------------
// Settings: sound, reduced motion, notifications
// ---------------------------------------------------------------------------
function applySettings() {
    document.body.classList.toggle('reduce-motion', !!settings.reducedMotion);
    if (soundToggle) soundToggle.checked = !!settings.sound;
    if (motionToggle) motionToggle.checked = !!settings.reducedMotion;
    if (notifyToggle) {
        notifyToggle.checked = !!settings.notifications && Notification?.permission === 'granted';
    }
}

function saveSettings() {
    localStorage.setItem('settings', JSON.stringify(settings));
}

if (soundToggle) {
    soundToggle.addEventListener('change', () => {
        settings.sound = soundToggle.checked;
        saveSettings();
    });
}

if (motionToggle) {
    motionToggle.addEventListener('change', () => {
        settings.reducedMotion = motionToggle.checked;
        document.body.classList.toggle('reduce-motion', settings.reducedMotion);
        saveSettings();
    });
}

if (notifyToggle) {
    notifyToggle.addEventListener('change', async () => {
        if (notifyToggle.checked) {
            if (!('Notification' in window)) {
                showNotification('This browser doesn\u2019t support notifications.', 'info');
                notifyToggle.checked = false;
                return;
            }
            const permission = await Notification.requestPermission();
            settings.notifications = permission === 'granted';
            notifyToggle.checked = settings.notifications;
            if (!settings.notifications) {
                showNotification('Notifications were blocked. You can still see in-app alerts.', 'info');
            }
        } else {
            settings.notifications = false;
        }
        saveSettings();
    });
}

function playChime() {
    if (!settings.sound) return;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const notes = [660, 880];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.0001, ctx.currentTime);
            const start = ctx.currentTime + i * 0.18;
            gain.gain.exponentialRampToValueAtTime(0.2, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.4);
        });
        setTimeout(() => ctx.close(), 1000);
    } catch (err) {
        console.error('Could not play chime', err);
    }
}

function sendBrowserNotification(title, body) {
    if (settings.notifications && 'Notification' in window && Notification.permission === 'granted') {
        try {
            new Notification(title, { body, icon: undefined });
        } catch (err) {
            console.error('Could not show browser notification', err);
        }
    }
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------
function populateTemplateDropdown() {
    templateDropdown.innerHTML = '<option value="">Select a template</option>';
    taskTemplates.forEach((template, index) => {
        const option = document.createElement('option');
        option.value = index.toString();
        option.textContent = `${template.title} (${template.steps.length} steps)`;
        templateDropdown.appendChild(option);
    });
}

useTemplateBtn.addEventListener('click', () => {
    const selectedIndex = templateDropdown.value;
    if (selectedIndex !== "") {
        loadTemplate(taskTemplates[parseInt(selectedIndex, 10)]);
    }
});

function loadTemplate(template) {
    document.getElementById('task-title').value = template.title;
    document.getElementById('task-description').value = template.description;
    document.getElementById('task-priority').value = template.priority;
    document.getElementById('task-timer').value = template.timer;

    resetSteps();
    template.steps.forEach((step, index) => {
        if (index > 0) {
            addStepBtn.click();
        }
        const stepInputs = document.querySelectorAll('.step-text');
        stepInputs[index].value = step;
    });

    showNotification(`"${template.title}" template loaded!`, 'info');
}

// ---------------------------------------------------------------------------
// Task form: create + edit
// ---------------------------------------------------------------------------
taskForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const title = document.getElementById('task-title').value.trim();
    if (!title) return;

    const description = document.getElementById('task-description').value.trim();
    const priority = document.getElementById('task-priority').value;
    const timerMinutes = Math.max(1, parseInt(document.getElementById('task-timer').value, 10) || 25);
    const reminderValue = document.getElementById('task-reminder').value;

    const stepInputs = document.querySelectorAll('.step-text');
    const stepTexts = Array.from(stepInputs)
        .map(input => input.value.trim())
        .filter(value => value !== '');

    const editingId = editingTaskIdInput.value ? parseInt(editingTaskIdInput.value, 10) : null;

    if (editingId) {
        const task = tasks.find(t => t.id === editingId);
        if (task) {
            // Preserve completion state of steps that still exist (matched by text).
            const previousByText = new Map(task.steps.map(s => [s.text, s.completed]));
            task.title = title;
            task.description = description;
            task.priority = priority;
            task.timer = timerMinutes;
            task.reminder = reminderValue;
            task.steps = stepTexts.map((text, index) => ({
                id: index,
                text,
                completed: previousByText.get(text) || false
            }));
            syncReminderForTask(task);
            saveData();
            renderTasks();
            renderReminders();
            showNotification('Task updated!', 'success');
        }
        exitEditMode();
    } else {
        const task = {
            id: Date.now(),
            title,
            description,
            priority,
            steps: stepTexts.map((text, index) => ({ id: index, text, completed: false })),
            timer: timerMinutes,
            reminder: reminderValue,
            createdAt: new Date().toISOString(),
            completed: false
        };

        tasks.push(task);
        syncReminderForTask(task);
        saveData();
        renderTasks();
        renderReminders();
        showNotification('Task created successfully!', 'success');
    }

    taskForm.reset();
    resetSteps();
    updateTabTitle();
});

function syncReminderForTask(task) {
    // Remove any existing reminder tied to this task, then re-add if one is set.
    reminders = reminders.filter(r => r.taskId !== task.id);
    if (task.reminder) {
        reminders.push({
            id: `${task.id}-reminder`,
            taskId: task.id,
            title: task.title,
            date: task.reminder,
            notified: false
        });
    }
}

function enterEditMode(task) {
    editingTaskIdInput.value = task.id;
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description || '';
    document.getElementById('task-priority').value = task.priority;
    document.getElementById('task-timer').value = task.timer;
    document.getElementById('task-reminder').value = task.reminder || '';

    resetSteps();
    if (task.steps.length > 0) {
        task.steps.forEach((step, index) => {
            if (index > 0) addStepBtn.click();
            document.querySelectorAll('.step-text')[index].value = step.text;
        });
    }

    if (taskFormTitle) taskFormTitle.textContent = 'Edit Task';
    if (submitBtn) submitBtn.textContent = 'Save Changes';
    if (cancelEditBtn) cancelEditBtn.hidden = false;

    taskForm.scrollIntoView({ behavior: settings.reducedMotion ? 'auto' : 'smooth', block: 'start' });
    document.getElementById('task-title').focus();
}

function exitEditMode() {
    editingTaskIdInput.value = '';
    if (taskFormTitle) taskFormTitle.textContent = 'Create New Task';
    if (submitBtn) submitBtn.textContent = 'Create Task';
    if (cancelEditBtn) cancelEditBtn.hidden = true;
}

if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', () => {
        taskForm.reset();
        resetSteps();
        exitEditMode();
    });
}

// ---------------------------------------------------------------------------
// Step chunking inputs
// ---------------------------------------------------------------------------
addStepBtn.addEventListener('click', function () {
    const stepCount = document.querySelectorAll('.step-input').length + 1;
    const stepInput = document.createElement('div');
    stepInput.className = 'step-input';
    stepInput.innerHTML = `
        <input type="text" class="step-text" placeholder="Step ${stepCount}">
        <button type="button" class="btn-remove-step" aria-label="Remove this step">×</button>
    `;
    stepsContainer.appendChild(stepInput);
    updateRemoveButtons();
});

stepsContainer.addEventListener('click', function (e) {
    if (e.target.classList.contains('btn-remove-step')) {
        const stepInput = e.target.closest('.step-input');
        if (stepInput && document.querySelectorAll('.step-input').length > 1) {
            stepInput.remove();
            updateRemoveButtons();
        }
    }
});

function updateRemoveButtons() {
    const stepInputs = document.querySelectorAll('.step-input');
    const removeButtons = document.querySelectorAll('.btn-remove-step');
    const onlyOne = stepInputs.length === 1;

    removeButtons.forEach(button => {
        button.disabled = onlyOne;
    });
}

function resetSteps() {
    stepsContainer.innerHTML = `
        <div class="step-input">
            <input type="text" class="step-text" placeholder="Step 1">
            <button type="button" class="btn-remove-step" disabled aria-label="Remove this step">×</button>
        </div>
    `;
}

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------
const priorityWeight = { high: 3, medium: 2, low: 1 };

if (sortSelect) {
    sortSelect.value = sortMode;
    sortSelect.addEventListener('change', () => {
        sortMode = sortSelect.value;
        localStorage.setItem('sortMode', sortMode);
        renderTasks();
    });
}

function sortTasks(list) {
    const copy = [...list];
    switch (sortMode) {
        case 'oldest':
            return copy.sort((a, b) => a.id - b.id);
        case 'priority-high':
            return copy.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
        case 'priority-low':
            return copy.sort((a, b) => priorityWeight[a.priority] - priorityWeight[b.priority]);
        case 'reminder':
            return copy.sort((a, b) => {
                if (!a.reminder && !b.reminder) return 0;
                if (!a.reminder) return 1;
                if (!b.reminder) return -1;
                return new Date(a.reminder) - new Date(b.reminder);
            });
        case 'created':
        default:
            return copy.sort((a, b) => b.id - a.id);
    }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function renderTasks() {
    tasksList.innerHTML = '';
    const incompleteTasks = sortTasks(tasks.filter(task => !task.completed));

    if (incompleteTasks.length === 0) {
        tasksList.innerHTML = '<p class="empty-state">No tasks yet. Create your first task!</p>';
        return;
    }

    incompleteTasks.forEach(task => {
        tasksList.appendChild(createTaskElement(task));
    });
}

function renderCompletedTasks() {
    completedTasks.innerHTML = '';
    if (completedTasksList.length === 0) {
        completedTasks.innerHTML = '<p class="empty-state">No completed tasks yet.</p>';
        return;
    }

    const recentCompleted = completedTasksList.slice(-5).reverse();
    recentCompleted.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        taskElement.innerHTML = `
            <div class="task-header">
                <div class="task-title">${escapeHTML(task.title)}</div>
                <div class="task-priority priority-${task.priority}">${escapeHTML(task.priority)}</div>
            </div>
            <p class="completed-date">Completed on ${new Date(task.completedAt).toLocaleDateString()}</p>
            <div class="completed-task-actions">
                <button class="btn btn-danger btn-delete-completed" data-task-id="${task.id}">Delete</button>
            </div>
        `;
        completedTasks.appendChild(taskElement);
    });
}

function renderReminders() {
    remindersList.innerHTML = '';
    const upcomingReminders = reminders
        .filter(reminder => new Date(reminder.date) > new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (upcomingReminders.length === 0) {
        remindersList.innerHTML = '<p class="empty-state">No upcoming reminders.</p>';
        return;
    }

    upcomingReminders.forEach(reminder => {
        const reminderElement = document.createElement('div');
        reminderElement.className = 'task-item';
        reminderElement.innerHTML = `
            <div class="task-header">
                <div class="task-title">${escapeHTML(reminder.title)}</div>
            </div>
            <p class="completed-date">${new Date(reminder.date).toLocaleString()}</p>
        `;
        remindersList.appendChild(reminderElement);
    });
}

function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = 'task-item';
    if (task.id === activeTimerTaskId) taskElement.classList.add('task-item-active-timer');
    taskElement.dataset.id = task.id;

    const completedSteps = task.steps.filter(step => step.completed).length;
    const totalSteps = task.steps.length;
    const completionPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    const isOverdue = task.reminder && new Date(task.reminder) < new Date();

    taskElement.innerHTML = `
        <div class="task-header">
            <div class="task-title">${escapeHTML(task.title)}</div>
            <div class="task-priority priority-${task.priority}">${escapeHTML(task.priority)}</div>
        </div>
        ${task.description ? `<p class="task-description">${escapeHTML(task.description)}</p>` : ''}
        ${isOverdue ? '<p class="overdue-badge">⏰ Reminder passed</p>' : ''}

        ${task.steps.length > 0 ? `
        <div class="task-steps">
            <div class="steps-title">Steps (${completedSteps}/${totalSteps})</div>
            ${task.steps.map(step => `
                <div class="step-item ${step.completed ? 'completed' : ''}">
                    <label class="step-checkbox-container">
                        <input type="checkbox" class="step-checkbox" ${step.completed ? 'checked' : ''} data-task-id="${task.id}" data-step-id="${step.id}" aria-label="${escapeHTML(step.text)}">
                        <span class="checkmark"></span>
                    </label>
                    <span class="step-text">${escapeHTML(step.text)}</span>
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${task.steps.length > 0 ? `
        <div class="progress-container">
            <div class="progress-label">Progress: ${Math.round(completionPercentage)}%</div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${completionPercentage}%"></div>
            </div>
        </div>
        ` : ''}

        <div class="task-timer">
            <div class="timer-display">${formatTime(task.timer * 60)}</div>
            <div class="timer-controls">
                <button class="btn btn-secondary start-task-timer" data-task-id="${task.id}">Start Timer</button>
            </div>
        </div>

        <div class="task-actions">
            <button class="btn btn-success complete-task" data-task-id="${task.id}">Complete</button>
            <button class="btn btn-secondary edit-task" data-task-id="${task.id}">Edit</button>
            <button class="btn btn-danger delete-task" data-task-id="${task.id}">Delete</button>
        </div>
    `;

    return taskElement;
}

tasksList.addEventListener('click', function (e) {
    const target = e.target.closest('button, input.step-checkbox');
    if (!target) return;
    const taskId = parseInt(target.dataset.taskId, 10);

    if (target.classList.contains('complete-task')) {
        completeTask(taskId);
    } else if (target.classList.contains('delete-task')) {
        deleteTask(taskId);
    } else if (target.classList.contains('edit-task')) {
        const task = tasks.find(t => t.id === taskId);
        if (task) enterEditMode(task);
    } else if (target.classList.contains('start-task-timer')) {
        startTaskTimer(taskId);
    } else if (target.classList.contains('step-checkbox')) {
        toggleStepCompletion(taskId, parseInt(target.dataset.stepId, 10), target.checked);
    }
});

completedTasks.addEventListener('click', function (e) {
    if (e.target.classList.contains('btn-delete-completed')) {
        const taskId = parseInt(e.target.dataset.taskId, 10);
        deleteCompletedTask(taskId);
    }
});

// ---------------------------------------------------------------------------
// Task actions
// ---------------------------------------------------------------------------
function deleteCompletedTask(taskId) {
    if (!confirm('Permanently delete this completed task? This can\u2019t be undone.')) return;
    completedTasksList = completedTasksList.filter(task => task.id !== taskId);
    saveData();
    renderCompletedTasks();
    showNotification('Completed task deleted', 'info');
}

function deleteTask(taskId) {
    const index = tasks.findIndex(task => task.id === taskId);
    if (index === -1) return;
    const [removed] = tasks.splice(index, 1);
    reminders = reminders.filter(r => r.taskId !== taskId);
    saveData();
    renderTasks();
    renderReminders();
    updateTabTitle();

    showUndoSnackbar(`Deleted "${removed.title}"`, () => {
        tasks.splice(index, 0, removed);
        syncReminderForTask(removed);
        saveData();
        renderTasks();
        renderReminders();
        updateTabTitle();
    });
}

function toggleStepCompletion(taskId, stepId, completed) {
    const task = tasks.find(task => task.id === taskId);
    if (!task) return;

    const step = task.steps.find(step => step.id === stepId);
    if (!step) return;

    step.completed = completed;
    const taskElement = document.querySelector(`.task-item[data-id="${taskId}"]`);

    if (taskElement) {
        const completedSteps = task.steps.filter(step => step.completed).length;
        const totalSteps = task.steps.length;
        const completionPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

        const progressFill = taskElement.querySelector('.progress-fill');
        const progressLabel = taskElement.querySelector('.progress-label');
        if (progressFill && progressLabel) {
            progressFill.style.width = `${completionPercentage}%`;
            progressLabel.textContent = `Progress: ${Math.round(completionPercentage)}%`;
        }

        const checkbox = taskElement.querySelector(`.step-checkbox[data-step-id="${stepId}"]`);
        const stepItem = checkbox ? checkbox.closest('.step-item') : null;
        if (stepItem) {
            stepItem.classList.toggle('completed', completed);
        }
    }

    if (completed) {
        userStats.points += 5;
        updateStats();
    }
    saveData();
}

function completeTask(taskId) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;

    const task = tasks[taskIndex];
    task.completed = true;
    task.completedAt = new Date().toISOString();

    completedTasksList.push(task);
    tasks.splice(taskIndex, 1);
    reminders = reminders.filter(r => r.taskId !== taskId);

    userStats.tasksCompleted += 1;
    userStats.points += calculatePoints(task);
    updateStreak();

    saveData();
    renderTasks();
    renderCompletedTasks();
    renderReminders();
    updateStats();
    updateAchievements();
    updateTabTitle();
    playChime();
    showNotification('Task completed! Great job!', 'success');
}

// ---------------------------------------------------------------------------
// Timer (drift-corrected, survives page refresh)
// ---------------------------------------------------------------------------
startTimerBtn.addEventListener('click', () => startTimer());
pauseTimerBtn.addEventListener('click', pauseTimer);
resetTimerBtn.addEventListener('click', resetTimer);
setCustomTimerBtn.addEventListener('click', setCustomTimer);

function startTaskTimer(taskId) {
    const task = tasks.find(task => task.id === taskId);
    if (!task) return;

    timerDuration = task.timer * 60;
    timerRemaining = timerDuration;
    customTimerInput.value = task.timer;
    activeTimerTaskId = taskId;
    updateTimerDisplay();
    updateTimerCircle();
    startTimer();

    timerUses++;
    localStorage.setItem('timerUses', JSON.stringify(timerUses));
    updateAchievements();
    renderTasks();
    showNotification(`Timer set for "${task.title}"`, 'info');
}

function startTimer() {
    if (timerRunning) return;
    if (timerRemaining <= 0) timerRemaining = timerDuration;
    timerRunning = true;
    timerEndAt = Date.now() + timerRemaining * 1000;
    persistTimerState();

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(tickTimer, 250);
}

function tickTimer() {
    const secondsLeft = Math.max(0, Math.round((timerEndAt - Date.now()) / 1000));
    if (secondsLeft !== timerRemaining) {
        timerRemaining = secondsLeft;
        updateTimerDisplay();
        updateTimerCircle();
    }

    if (secondsLeft <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        timerRunning = false;
        activeTimerTaskId = null;
        clearPersistedTimerState();
        renderTasks();
        playChime();
        sendBrowserNotification('Timer finished!', 'Time to take a break or check on your task.');
        showNotification('Timer finished!', 'success');
    }
}

function pauseTimer() {
    if (!timerRunning) return;
    clearInterval(timerInterval);
    timerInterval = null;
    timerRunning = false;
    timerRemaining = Math.max(0, Math.round((timerEndAt - Date.now()) / 1000));
    persistTimerState();
}

function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timerRunning = false;
    activeTimerTaskId = null;
    timerDuration = Math.max(1, parseInt(customTimerInput.value, 10) || 25) * 60;
    timerRemaining = timerDuration;
    clearPersistedTimerState();
    updateTimerDisplay();
    updateTimerCircle();
    renderTasks();
}

function setCustomTimer() {
    const minutes = parseInt(customTimerInput.value, 10);
    if (isNaN(minutes) || minutes < 1) {
        showNotification('Enter a timer length of at least 1 minute.', 'info');
        return;
    }
    resetTimer();
    showNotification(`Timer set to ${minutes} minutes`, 'info');
}

function persistTimerState() {
    if (timerRunning) {
        localStorage.setItem('timerState', JSON.stringify({
            endAt: timerEndAt,
            duration: timerDuration,
            taskId: activeTimerTaskId
        }));
    } else {
        clearPersistedTimerState();
    }
}

function clearPersistedTimerState() {
    localStorage.removeItem('timerState');
}

function restoreTimerState() {
    const saved = safeParse('timerState', null);
    timerDuration = Math.max(1, parseInt(customTimerInput.value, 10) || 25) * 60;
    timerRemaining = timerDuration;

    if (!saved) return;

    const secondsLeft = Math.round((saved.endAt - Date.now()) / 1000);
    timerDuration = saved.duration;
    activeTimerTaskId = saved.taskId || null;

    if (secondsLeft > 0) {
        timerRemaining = secondsLeft;
        timerEndAt = saved.endAt;
        timerRunning = true;
        customTimerInput.value = Math.round(timerDuration / 60);
        timerInterval = setInterval(tickTimer, 250);
    } else {
        // Timer would have finished while the page was closed.
        clearPersistedTimerState();
        timerRemaining = timerDuration;
        activeTimerTaskId = null;
    }
}

function updateTimerDisplay() {
    visualTimer.textContent = formatTime(timerRemaining);
}

function updateTimerCircle() {
    const percentage = timerDuration > 0 ? ((timerDuration - timerRemaining) / timerDuration) * 100 : 0;
    const timerCircle = document.querySelector('.timer-circle');
    timerCircle.style.background = `conic-gradient(var(--accent) ${percentage}%, var(--light) 0%)`;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Reminders: due-check loop
// ---------------------------------------------------------------------------
function checkReminders() {
    const now = new Date();
    let changed = false;

    reminders.forEach(reminder => {
        if (!reminder.notified && new Date(reminder.date) <= now) {
            reminder.notified = true;
            changed = true;
            playChime();
            sendBrowserNotification('Reminder', reminder.title);
            showNotification(`Reminder: ${reminder.title}`, 'info');
        }
    });

    if (changed) {
        saveData();
        renderReminders();
        renderTasks();
    }
}

// ---------------------------------------------------------------------------
// Points, streaks, achievements
// ---------------------------------------------------------------------------
function calculatePoints(task) {
    let points = 10;
    if (task.priority === 'high') points += 10;
    else if (task.priority === 'medium') points += 5;
    if (task.steps.length > 0) points += task.steps.length * 2;
    return points;
}

function updateStreak() {
    const today = new Date().toDateString();
    const lastCompletion = userStats.lastCompletion ? new Date(userStats.lastCompletion).toDateString() : null;

    if (lastCompletion === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toDateString();

    if (lastCompletion === yesterdayString) {
        userStats.streak += 1;
    } else {
        userStats.streak = 1;
    }

    userStats.lastCompletion = new Date().toISOString();
}

function updateStats() {
    pointsElement.textContent = userStats.points;
    streakElement.textContent = userStats.streak;
    tasksCompletedElement.textContent = userStats.tasksCompleted;
}

function updateAchievements() {
    const achievements = [
        { id: 'achievement-1', condition: userStats.tasksCompleted >= 1 },
        { id: 'achievement-2', condition: userStats.streak >= 3 },
        { id: 'achievement-3', condition: userStats.tasksCompleted >= 10 },
        { id: 'achievement-4', condition: timerUses >= 5 },
        { id: 'achievement-5', condition: userStats.tasksCompleted >= 25 },
        { id: 'achievement-6', condition: userStats.streak >= 7 },
        {
            id: 'achievement-7',
            condition: completedTasksList.reduce((total, task) => total + task.steps.filter(step => step.completed).length, 0) >= 50
        },
        { id: 'achievement-8', condition: completedTasksList.filter(task => task.priority === 'high').length >= 5 }
    ];

    achievements.forEach(({ id, condition }) => {
        if (condition) unlockAchievement(id);
    });
}

function unlockAchievement(achievementId) {
    const achievement = document.getElementById(achievementId);
    if (achievement && !achievement.classList.contains('unlocked')) {
        achievement.classList.add('unlocked');
        achievement.classList.remove('locked');
        showNotification(`Achievement unlocked: ${achievement.querySelector('.achievement-title').textContent}`, 'success');
    }
}

// ---------------------------------------------------------------------------
// Focus Mode
// ---------------------------------------------------------------------------
if (focusModeBtn) {
    focusModeBtn.addEventListener('click', openFocusMode);
}
if (focusModeCloseBtn) {
    focusModeCloseBtn.addEventListener('click', closeFocusMode);
}
if (focusModeOverlay) {
    focusModeOverlay.addEventListener('click', (e) => {
        if (e.target === focusModeOverlay) closeFocusMode();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !focusModeOverlay.hidden) closeFocusMode();
    });
}

function openFocusMode() {
    if (!focusModeOverlay || !focusModeContent) return;
    renderFocusTask();
    focusModeOverlay.hidden = false;
    focusModeCloseBtn.focus();
}

function closeFocusMode() {
    if (!focusModeOverlay) return;
    focusModeOverlay.hidden = true;
    focusModeBtn.focus();
}

function renderFocusTask() {
    const [next] = sortTasks(tasks.filter(t => !t.completed));
    if (!next) {
        focusModeContent.innerHTML = `<p class="empty-state">No tasks left. Nice work — take a break! 🎉</p>`;
        return;
    }
    focusModeContent.innerHTML = '';
    focusModeContent.appendChild(createTaskElement(next));
}

// Keep the Focus Mode view in sync whenever the task list re-renders.
const originalRenderTasks = renderTasks;
renderTasks = function () {
    originalRenderTasks();
    if (focusModeOverlay && !focusModeOverlay.hidden) renderFocusTask();
};

// ---------------------------------------------------------------------------
// Export / Import
// ---------------------------------------------------------------------------
if (exportBtn) {
    exportBtn.addEventListener('click', () => {
        const payload = {
            exportedAt: new Date().toISOString(),
            tasks,
            completedTasks: completedTasksList,
            reminders,
            userStats,
            timerUses
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `neurodivergent-task-manager-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showNotification('Backup downloaded', 'success');
    });
}

if (importBtn && importInput) {
    importBtn.addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', () => {
        const file = importInput.files[0];
        if (!file) return;

        if (!confirm('Importing will replace your current tasks and stats. Continue?')) {
            importInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                tasks = Array.isArray(data.tasks) ? data.tasks : [];
                completedTasksList = Array.isArray(data.completedTasks) ? data.completedTasks : [];
                reminders = Array.isArray(data.reminders) ? data.reminders : [];
                userStats = data.userStats || userStats;
                timerUses = data.timerUses || 0;

                saveData();
                localStorage.setItem('timerUses', JSON.stringify(timerUses));
                renderTasks();
                renderCompletedTasks();
                renderReminders();
                updateStats();
                updateAchievements();
                updateTabTitle();
                showNotification('Backup restored!', 'success');
            } catch (err) {
                console.error(err);
                showNotification('That file couldn\u2019t be read as a valid backup.', 'info');
            } finally {
                importInput.value = '';
            }
        };
        reader.readAsText(file);
    });
}

// ---------------------------------------------------------------------------
// Notifications & undo snackbar (in-app)
// ---------------------------------------------------------------------------
function showNotification(message, type) {
    if (!notificationContainer) return;
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('role', 'status');
    notification.textContent = message;

    notificationContainer.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('notification-fade');
        setTimeout(() => notification.remove(), 500);
    }, 3500);
}

function showUndoSnackbar(message, onUndo) {
    if (!notificationContainer) return;
    const snackbar = document.createElement('div');
    snackbar.className = 'notification notification-info notification-snackbar';
    snackbar.setAttribute('role', 'status');
    snackbar.innerHTML = `<span>${escapeHTML(message)}</span>`;

    const undoBtn = document.createElement('button');
    undoBtn.type = 'button';
    undoBtn.className = 'snackbar-undo-btn';
    undoBtn.textContent = 'Undo';
    snackbar.appendChild(undoBtn);

    let dismissed = false;
    const timeoutId = setTimeout(() => dismiss(), 6000);

    function dismiss() {
        if (dismissed) return;
        dismissed = true;
        clearTimeout(timeoutId);
        snackbar.classList.add('notification-fade');
        setTimeout(() => snackbar.remove(), 500);
    }

    undoBtn.addEventListener('click', () => {
        if (dismissed) return;
        dismissed = true;
        clearTimeout(timeoutId);
        onUndo();
        snackbar.remove();
        showNotification('Undone', 'info');
    });

    notificationContainer.appendChild(snackbar);
}

// ---------------------------------------------------------------------------
// Tab title badge
// ---------------------------------------------------------------------------
function updateTabTitle() {
    const pending = tasks.filter(t => !t.completed).length;
    document.title = pending > 0 ? `(${pending}) ${baseTitle}` : baseTitle;
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------
function saveData() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('completedTasks', JSON.stringify(completedTasksList));
    localStorage.setItem('reminders', JSON.stringify(reminders));
    localStorage.setItem('userStats', JSON.stringify(userStats));
}

document.addEventListener('DOMContentLoaded', init);
