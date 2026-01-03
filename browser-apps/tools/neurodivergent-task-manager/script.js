/*
Copyright (c) 2025-2026. Jericho Crosby (Chalwk)

Neurodivergent Task Manager JavaScript
*/

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

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let completedTasksList = JSON.parse(localStorage.getItem('completedTasks')) || [];
let reminders = JSON.parse(localStorage.getItem('reminders')) || [];
let userStats = JSON.parse(localStorage.getItem('userStats')) || {
    points: 0,
    streak: 0,
    tasksCompleted: 0,
    achievements: []
};
let timerInterval = null;
let timerSeconds = 25 * 60;
let timerRunning = false;
let timerPaused = false;
let timerUses = JSON.parse(localStorage.getItem('timerUses')) || 0;

const taskTemplates = [
    {
        title: "Morning Routine 🌅",
        description: "Start your day right",
        steps: [
            "Make bed",
            "Brush teeth",
            "Drink water",
            "Eat breakfast"
        ],
        priority: "medium",
        timer: 30
    },
    {
        title: "Work Session 💼",
        description: "Focused work time",
        steps: [
            "Check emails",
            "Prioritize tasks",
            "Work on main project",
            "Take short breaks"
        ],
        priority: "high",
        timer: 45
    },
    {
        title: "Exercise 🏃‍♂️",
        description: "Get moving and stay healthy",
        steps: [
            "Warm up stretches",
            "Cardio exercise",
            "Strength training",
            "Cool down"
        ],
        priority: "medium",
        timer: 60
    },
    {
        title: "Study Session 📚",
        description: "Learning and knowledge building",
        steps: [
            "Review previous notes",
            "Read new material",
            "Take notes",
            "Practice problems"
        ],
        priority: "high",
        timer: 25
    },
    {
        title: "Evening Wind-down 🌙",
        description: "Prepare for restful sleep",
        steps: [
            "Tidy living space",
            "Prepare for tomorrow",
            "Relaxation activity",
            "Digital devices off"
        ],
        priority: "low",
        timer: 20
    },
    {
        title: "Creative Time 🎨",
        description: "Express yourself creatively",
        steps: [
            "Gather materials",
            "Warm up exercise",
            "Main creative work",
            "Clean up"
        ],
        priority: "medium",
        timer: 40
    },
    {
        title: "Morning Routine Plus 🌅",
        description: "Gentle, structured start for focus and calm",
        steps: [
            "Wake up - place feet on floor",
            "Open curtains or get 2 minutes of sunlight",
            "Drink a full glass of water",
            "Use bathroom and basic hygiene",
            "Choose outfit from 2 options",
            "Quick sensory check",
            "3-minute calendar check",
            "Set one small starter task"
        ],
        priority: "medium",
        timer: 30
    },
    {
        title: "Mini Launch 🚀 (Quick Morning)",
        description: "Ultra-short routine when you need momentum fast",
        steps: [
            "Turn on lights or lamp",
            "Drink water",
            "Wash face",
            "Put on a comfortable top",
            "Pick one task for 10 minutes"
        ],
        priority: "high",
        timer: 10
    },
    {
        title: "Pomodoro Focus Session ⏲️",
        description: "25-minute focused work with short break",
        steps: [
            "Choose a single measurable goal",
            "Clear workspace",
            "Set timer for 25 minutes",
            "Work without distractions",
            "Take a 5-minute break"
        ],
        priority: "high",
        timer: 25
    },
    {
        title: "Deep Work Block 🔒",
        description: "Longer uninterrupted focus for big tasks",
        steps: [
            "Define one deliverable",
            "Turn off notifications",
            "Prepare water or fidget tool",
            "Set 50-minute timer",
            "Record progress then take 10-minute break"
        ],
        priority: "high",
        timer: 50
    },
    {
        title: "Study Session - Chunked 📚",
        description: "Small chunks for learning and retention",
        steps: [
            "Review notes for 5 minutes",
            "Set specific reading or problem goal",
            "Use two 20-minute blocks with break",
            "Summarize key points",
            "Plan next small goal"
        ],
        priority: "high",
        timer: 45
    },
    {
        title: "Transition Routine ↔️",
        description: "Shift between activities smoothly",
        steps: [
            "Give a 5-minute warning",
            "Quick physical reset",
            "Gather items for next task",
            "One deep breath and begin"
        ],
        priority: "medium",
        timer: 10
    },
    {
        title: "Sensory Reset Break ✨",
        description: "Short break to regulate sensory load",
        steps: [
            "Move to quiet or dim space",
            "Use calming sound support",
            "Grounding exercise",
            "Use sensory tool",
            "Return when calmer"
        ],
        priority: "medium",
        timer: 10
    },
    {
        title: "Medication & Health Check 💊",
        description: "Quick health routine",
        steps: [
            "Take medication",
            "Log dosage",
            "Drink water",
            "Check for side effects",
            "Set reminder"
        ],
        priority: "high",
        timer: 5
    },
    {
        title: "Meal Prep - Simple Batch 🍲",
        description: "Make several easy meals",
        steps: [
            "Pick base",
            "Choose proteins and veggies",
            "Cook or assemble",
            "Portion into containers",
            "Wipe down surfaces"
        ],
        priority: "medium",
        timer: 45
    },
    {
        title: "15-Minute Clean Blitz ⚡",
        description: "Fast tidy to reset environment",
        steps: [
            "Set timer",
            "Tidy visible surfaces",
            "Bin trash",
            "Place loose items in box",
            "Wipe one surface"
        ],
        priority: "low",
        timer: 15
    },
    {
        title: "Grocery Trip - Prep + Run 🛒",
        description: "Reduce overwhelm while shopping",
        steps: [
            "Check pantry and list essentials",
            "Choose 1 or 2 meal plans",
            "Pack sensory supports",
            "Bring aisle sorted list",
            "Stick to list and use self-checkout"
        ],
        priority: "medium",
        timer: 90
    },
    {
        title: "Social Interaction Prep 🗣️",
        description: "Get ready for social events",
        steps: [
            "Define a goal",
            "Prep prompts",
            "Plan exit strategy",
            "Bring grounding object",
            "Do quick calming exercise"
        ],
        priority: "medium",
        timer: 20
    },
    {
        title: "Appointment Prep 📎",
        description: "Prepare for appointments",
        steps: [
            "Confirm details",
            "Prepare transport and sensory aids",
            "Write key questions",
            "Set reminder",
            "Pack essentials"
        ],
        priority: "high",
        timer: 30
    },
    {
        title: "Evening Wind-down Plus 🌙",
        description: "Slow the brain and body before sleep",
        steps: [
            "Tidy area for 5 minutes",
            "Prepare outfit or bag",
            "Dim lights",
            "Relaxing activity",
            "Turn off devices 30 minutes before bed"
        ],
        priority: "low",
        timer: 30
    },
    {
        title: "Bedtime Routine 🛏️",
        description: "Consistent cues for sleep",
        steps: [
            "Brush teeth and hygiene",
            "Change into comfortable clothes",
            "Do body scan or breathing",
            "Use sleep aids if needed",
            "Set alarm and place phone away"
        ],
        priority: "low",
        timer: 20
    },
    {
        title: "Emotional Regulation Toolkit ❤️",
        description: "Simple plan for emotional spikes",
        steps: [
            "Label the feeling",
            "Take deep breaths",
            "Grounding technique",
            "Hydrate or snack",
            "Contact support if needed"
        ],
        priority: "high",
        timer: 10
    },
    {
        title: "Weekly Review & Plan 📆",
        description: "Low-stress weekly planning",
        steps: [
            "List wins and unfinished tasks",
            "Pick 3 must-dos",
            "Plan one self-care or social activity",
            "Sort laundry and clothes",
            "Tidy inbox and schedules"
        ],
        priority: "medium",
        timer: 45
    },
    {
        title: "Creative Session 🎨",
        description: "Playful creative time",
        steps: [
            "Set up materials",
            "Warm-up activity",
            "Work on main piece freely",
            "Stretch break",
            "Tidy and label work"
        ],
        priority: "medium",
        timer: 40
    },
    {
        title: "Burnout De-escalation Plan 🚑",
        description: "Steps to protect energy",
        steps: [
            "Stop task and rest",
            "Reduce sensory input",
            "Drink water and eat snack",
            "Use grounding or weight",
            "Notify trusted person and postpone demands"
        ],
        priority: "high",
        timer: 15
    }
];

// Initialize the app
function init() {
    renderTasks();
    renderCompletedTasks();
    renderReminders();
    updateStats();
    updateAchievements();
    updateTimerCircle();
    initializeTemplates();
}

function initializeTemplates() {
    const templatesContainer = document.createElement('div');
    templatesContainer.className = 'card';
    templatesContainer.innerHTML = `
        <h2 class="card-title">Task Templates 🎯</h2>
        <select id="template-dropdown" class="template-dropdown">
            <option value="">Select a template</option>
            ${taskTemplates.map((template, index) => `
                <option value='${index}'>${template.title} (${template.steps.length} steps)</option>
            `).join('')}
        </select>
        <button id="use-template-btn" class="btn btn-use-template">Use Template</button>
    `;

    const leftColumn = document.querySelector('.left-column');
    const taskCreationCard = document.querySelector('.left-column .card');
    leftColumn.insertBefore(templatesContainer, taskCreationCard.nextSibling);

    const dropdown = document.getElementById('template-dropdown');
    const useBtn = document.getElementById('use-template-btn');

    useBtn.addEventListener('click', () => {
        const selectedIndex = dropdown.value;
        if (selectedIndex !== "") {
            const templateData = taskTemplates[selectedIndex];
            loadTemplate(templateData);
        }
    });
}


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

taskForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;
    const priority = document.getElementById('task-priority').value;
    const timerMinutes = parseInt(document.getElementById('task-timer').value);
    const reminder = document.getElementById('task-reminder').value;

    const stepInputs = document.querySelectorAll('.step-text');
    const steps = Array.from(stepInputs)
        .map(input => input.value.trim())
        .filter(value => value !== '');

    const task = {
        id: Date.now(),
        title,
        description,
        priority,
        steps: steps.map((text, index) => ({
            id: index,
            text,
            completed: false
        })),
        timer: timerMinutes,
        reminder,
        createdAt: new Date().toISOString(),
        completed: false
    };

    tasks.push(task);

    saveData();
    renderTasks();

    taskForm.reset();
    resetSteps();

    showNotification('Task created successfully!', 'success');
});

addStepBtn.addEventListener('click', function() {
    const stepCount = document.querySelectorAll('.step-input').length + 1;
    const stepInput = document.createElement('div');
    stepInput.className = 'step-input';
    stepInput.innerHTML = `
        <input type="text" class="step-text" placeholder="Step ${stepCount}">
        <button type="button" class="btn-remove-step">×</button>
    `;
    stepsContainer.appendChild(stepInput);

    updateRemoveButtons();
});

stepsContainer.addEventListener('click', function(e) {
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

    if (stepInputs.length === 1) {
        removeButtons[0].disabled = true;
    } else {
        removeButtons.forEach(button => button.disabled = false);
    }
}

function resetSteps() {
    stepsContainer.innerHTML = `
        <div class="step-input">
            <input type="text" class="step-text" placeholder="Step 1">
            <button type="button" class="btn-remove-step" disabled>×</button>
        </div>
    `;
}

function renderTasks() {
    tasksList.innerHTML = '';

    if (tasks.length === 0) {
        tasksList.innerHTML = '<p>No tasks yet. Create your first task!</p>';
        return;
    }

    const incompleteTasks = tasks.filter(task => !task.completed);

    if (incompleteTasks.length === 0) {
        tasksList.innerHTML = '<p>All tasks completed! Great job!</p>';
        return;
    }

    incompleteTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        tasksList.appendChild(taskElement);
    });
}

function renderCompletedTasks() {
    completedTasks.innerHTML = '';

    if (completedTasksList.length === 0) {
        completedTasks.innerHTML = '<p>No completed tasks yet.</p>';
        return;
    }

    const recentCompleted = completedTasksList.slice(-5).reverse();

    recentCompleted.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        taskElement.innerHTML = `
                    <div class="task-header">
                        <div class="task-title">${task.title}</div>
                        <div class="task-priority priority-${task.priority}">${task.priority}</div>
                    </div>
                    <p>Completed on ${new Date(task.completedAt).toLocaleDateString()}</p>
                    <div class="completed-task-actions">
                        <button class="btn-delete-completed" data-task-id="${task.id}">Delete</button>
                    </div>
                `;
        completedTasks.appendChild(taskElement);
    });
}

function renderReminders() {
    remindersList.innerHTML = '';

    if (reminders.length === 0) {
        remindersList.innerHTML = '<p>No upcoming reminders.</p>';
        return;
    }

    const upcomingReminders = reminders.filter(reminder => {
        return new Date(reminder.date) > new Date();
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    if (upcomingReminders.length === 0) {
        remindersList.innerHTML = '<p>No upcoming reminders.</p>';
        return;
    }

    upcomingReminders.forEach(reminder => {
        const reminderElement = document.createElement('div');
        reminderElement.className = 'task-item';
        reminderElement.innerHTML = `
                    <div class="task-header">
                        <div class="task-title">${reminder.title}</div>
                    </div>
                    <p>${new Date(reminder.date).toLocaleString()}</p>
                `;
        remindersList.appendChild(reminderElement);
    });
}

function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = 'task-item';
    taskElement.dataset.id = task.id;

    const completedSteps = task.steps.filter(step => step.completed).length;
    const totalSteps = task.steps.length;
    const completionPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    taskElement.innerHTML = `
                <div class="task-header">
                    <div class="task-title">${task.title}</div>
                    <div class="task-priority priority-${task.priority}">${task.priority}</div>
                </div>
                ${task.description ? `<p class="task-description">${task.description}</p>` : ''}

                ${task.steps.length > 0 ? `
                <div class="task-steps">
                    <h4 class="steps-title">Steps (${completedSteps}/${totalSteps})</h4>
                    ${task.steps.map(step => `
                        <div class="step-item ${step.completed ? 'completed' : ''}">
                            <label class="step-checkbox-container">
                                <input type="checkbox" class="step-checkbox" ${step.completed ? 'checked' : ''} data-task-id="${task.id}" data-step-id="${step.id}">
                                <span class="checkmark"></span>
                            </label>
                            <span class="step-text">${step.text}</span>
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
                        <button class="btn start-task-timer" data-task-id="${task.id}">Start Timer</button>
                    </div>
                </div>

                <div class="task-actions">
                    <button class="btn btn-success complete-task" data-task-id="${task.id}">Complete</button>
                    <button class="btn btn-danger delete-task" data-task-id="${task.id}">Delete</button>
                </div>
            `;

    return taskElement;
}

tasksList.addEventListener('click', function(e) {
    const taskId = parseInt(e.target.dataset.taskId);

    if (e.target.classList.contains('complete-task')) {
        completeTask(taskId);
    } else if (e.target.classList.contains('delete-task')) {
        deleteTask(taskId);
    } else if (e.target.classList.contains('start-task-timer')) {
        startTaskTimer(taskId);
    } else if (e.target.classList.contains('step-checkbox')) {
        toggleStepCompletion(taskId, parseInt(e.target.dataset.stepId), e.target.checked);
    }
});

completedTasks.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-delete-completed')) {
        const taskId = parseInt(e.target.dataset.taskId);
        deleteCompletedTask(taskId);
    }
});

function deleteCompletedTask(taskId) {
    if (!confirm('Are you sure you want to permanently delete this completed task?')) return;

    completedTasksList = completedTasksList.filter(task => task.id !== taskId);
    saveData();
    renderCompletedTasks();
    showNotification('Completed task deleted', 'info');
}

function completeTask(taskId) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;

    const task = tasks[taskIndex];
    task.completed = true;
    task.completedAt = new Date().toISOString();

    completedTasksList.push(task);
    tasks.splice(taskIndex, 1);

    userStats.tasksCompleted += 1;
    userStats.points += calculatePoints(task);

    updateStreak();

    saveData();
    renderTasks();
    renderCompletedTasks();
    updateStats();
    updateAchievements();

    showNotification('Task completed! Great job!', 'success');
}

function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    tasks = tasks.filter(task => task.id !== taskId);

    saveData();
    renderTasks();

    showNotification('Task deleted', 'info');
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

        const stepItem = taskElement.querySelector(`.step-checkbox[data-step-id="${stepId}"]`).closest('.step-item');
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

function startTaskTimer(taskId) {
    const task = tasks.find(task => task.id === taskId);
    if (!task) return;

    timerSeconds = task.timer * 60;
    updateTimerDisplay();
    updateTimerCircle();

    if (!timerRunning) {
        startTimer();
    }

    timerUses++;
    localStorage.setItem('timerUses', JSON.stringify(timerUses));
    updateAchievements();

    showNotification(`Timer set for "${task.title}"`, 'info');
}

startTimerBtn.addEventListener('click', startTimer);
pauseTimerBtn.addEventListener('click', pauseTimer);
resetTimerBtn.addEventListener('click', resetTimer);
setCustomTimerBtn.addEventListener('click', setCustomTimer);

function startTimer() {
    if (timerRunning) return;

    timerRunning = true;
    timerPaused = false;

    timerInterval = setInterval(() => {
        if (timerSeconds > 0) {
            timerSeconds--;
            updateTimerDisplay();
            updateTimerCircle();
        } else {
            clearInterval(timerInterval);
            timerRunning = false;
            showNotification('Timer finished!', 'success');
        }
    }, 1000);
}

function pauseTimer() {
    if (!timerRunning) return;

    clearInterval(timerInterval);
    timerRunning = false;
    timerPaused = true;
}

function resetTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    timerPaused = false;
    timerSeconds = parseInt(customTimerInput.value) * 60;
    updateTimerDisplay();
    updateTimerCircle();
}

function setCustomTimer() {
    const minutes = parseInt(customTimerInput.value);
    if (isNaN(minutes) || minutes < 1) return;

    resetTimer();
    showNotification(`Timer set to ${minutes} minutes`, 'info');
}

function updateTimerDisplay() {
    visualTimer.textContent = formatTime(timerSeconds);
}

function updateTimerCircle() {
    const totalSeconds = parseInt(customTimerInput.value) * 60;
    const percentage = ((totalSeconds - timerSeconds) / totalSeconds) * 100;

    const timerCircle = document.querySelector('.timer-circle');
    timerCircle.style.background = `conic-gradient(var(--accent) ${percentage}%, var(--light) 0%)`;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

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

    if (lastCompletion === today) {
        return;
    }

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
    if (userStats.tasksCompleted >= 1) {
        unlockAchievement('achievement-1');
    }

    if (userStats.streak >= 3) {
        unlockAchievement('achievement-2');
    }

    if (userStats.tasksCompleted >= 10) {
        unlockAchievement('achievement-3');
    }

    if (timerUses >= 5) {
        unlockAchievement('achievement-4');
    }

    if (userStats.tasksCompleted >= 25) {
        unlockAchievement('achievement-5');
    }

    if (userStats.streak >= 7) {
        unlockAchievement('achievement-6');
    }

    const totalStepsCompleted = completedTasksList.reduce((total, task) => {
        return total + task.steps.filter(step => step.completed).length;
    }, 0);
    if (totalStepsCompleted >= 50) {
        unlockAchievement('achievement-7');
    }

    const highPriorityCompleted = completedTasksList.filter(task => task.priority === 'high').length;
    if (highPriorityCompleted >= 5) {
        unlockAchievement('achievement-8');
    }
}

function unlockAchievement(achievementId) {
    const achievement = document.getElementById(achievementId);
    if (achievement && !achievement.classList.contains('unlocked')) {
        achievement.classList.add('unlocked');
        achievement.classList.remove('locked');
        showNotification(`Achievement unlocked: ${achievement.querySelector('.achievement-title').textContent}`, 'success');
    }
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = 'var(--border-radius)';
    notification.style.color = 'white';
    notification.style.zIndex = '1000';
    notification.style.boxShadow = 'var(--box-shadow)';

    if (type === 'success') {
        notification.style.backgroundColor = 'var(--success)';
    } else if (type === 'info') {
        notification.style.backgroundColor = 'var(--primary)';
    } else {
        notification.style.backgroundColor = 'var(--dark)';
    }

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}

function saveData() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('completedTasks', JSON.stringify(completedTasksList));
    localStorage.setItem('reminders', JSON.stringify(reminders));
    localStorage.setItem('userStats', JSON.stringify(userStats));
}

init();