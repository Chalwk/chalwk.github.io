// DOM Elements
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

// User stats elements
const pointsElement = document.getElementById('points');
const streakElement = document.getElementById('streak');
const tasksCompletedElement = document.getElementById('tasks-completed');

// State
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
let timerSeconds = 25 * 60; // 25 minutes in seconds
let timerRunning = false;
let timerPaused = false;
let timerUses = JSON.parse(localStorage.getItem('timerUses')) || 0;

// Task Templates
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

// Initialize task templates
function initializeTemplates() {
    const templatesContainer = document.createElement('div');
    templatesContainer.className = 'card';
    templatesContainer.innerHTML = `
        <h2 class="card-title">Task Templates 🎯</h2>
        <div class="templates-grid" id="templates-container">
            ${taskTemplates.map(template => `
                <div class="template-item" data-template='${JSON.stringify(template).replace(/'/g, "&#39;")}'>
                    <div class="template-title">${template.title}</div>
                    <div class="template-steps">${template.steps.length} steps</div>
                    <button class="btn btn-use-template">Use</button>
                </div>
            `).join('')}
        </div>
    `;

    // Insert templates card after task creation card
    const leftColumn = document.querySelector('.left-column');
    const taskCreationCard = document.querySelector('.left-column .card');
    leftColumn.insertBefore(templatesContainer, taskCreationCard.nextSibling);

    // Add event listeners for template buttons
    document.getElementById('templates-container').addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-use-template')) {
            const templateItem = e.target.closest('.template-item');
            const templateData = JSON.parse(templateItem.dataset.template.replace(/&#39;/g, "'"));
            loadTemplate(templateData);
        }
    });
}

// Load template into form
function loadTemplate(template) {
    document.getElementById('task-title').value = template.title;
    document.getElementById('task-description').value = template.description;
    document.getElementById('task-priority').value = template.priority;
    document.getElementById('task-timer').value = template.timer;

    // Clear existing steps
    resetSteps();

    // Add template steps
    template.steps.forEach((step, index) => {
        if (index > 0) {
            addStepBtn.click();
        }
        const stepInputs = document.querySelectorAll('.step-text');
        stepInputs[index].value = step;
    });

    showNotification(`"${template.title}" template loaded!`, 'info');
}

// Task Form Submission
taskForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;
    const priority = document.getElementById('task-priority').value;
    const timerMinutes = parseInt(document.getElementById('task-timer').value);
    const reminder = document.getElementById('task-reminder').value;

    // Get steps
    const stepInputs = document.querySelectorAll('.step-text');
    const steps = Array.from(stepInputs)
        .map(input => input.value.trim())
        .filter(value => value !== '');

    // Create task object
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

    // Add to tasks array
    tasks.push(task);

    // Save to localStorage
    saveData();

    // Render tasks
    renderTasks();

    // Reset form
    taskForm.reset();
    resetSteps();

    // Show confirmation
    showNotification('Task created successfully!', 'success');
});

// Add Step Button
addStepBtn.addEventListener('click', function() {
    const stepCount = document.querySelectorAll('.step-input').length + 1;
    const stepInput = document.createElement('div');
    stepInput.className = 'step-input';
    stepInput.innerHTML = `
                <input type="text" class="step-text" placeholder="Step ${stepCount}">
            `;
    stepsContainer.appendChild(stepInput);
});

// Reset steps to initial state
function resetSteps() {
    stepsContainer.innerHTML = `
                <div class="step-input">
                    <input type="text" class="step-text" placeholder="Step 1">
                </div>
            `;
}

// Render Tasks
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

// Render Completed Tasks
function renderCompletedTasks() {
    completedTasks.innerHTML = '';

    if (completedTasksList.length === 0) {
        completedTasks.innerHTML = '<p>No completed tasks yet.</p>';
        return;
    }

    // Show only the 5 most recent completed tasks
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

// Render Reminders
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

// Create Task Element
function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = 'task-item';
    taskElement.dataset.id = task.id;

    // Calculate completion percentage for progress bar
    const completedSteps = task.steps.filter(step => step.completed).length;
    const totalSteps = task.steps.length;
    const completionPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    taskElement.innerHTML = `
                <div class="task-header">
                    <div class="task-title">${task.title}</div>
                    <div class="task-priority priority-${task.priority}">${task.priority}</div>
                </div>
                ${task.description ? `<p>${task.description}</p>` : ''}

                ${task.steps.length > 0 ? `
                <div class="task-steps">
                    ${task.steps.map(step => `
                        <div class="step-item">
                            <input type="checkbox" class="step-checkbox" ${step.completed ? 'checked' : ''} data-task-id="${task.id}" data-step-id="${step.id}">
                            <span class="step-text ${step.completed ? 'completed' : ''}">${step.text}</span>
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                ${task.steps.length > 0 ? `
                <div class="timer-progress">
                    <div class="timer-progress-bar" style="width: ${completionPercentage}%"></div>
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

// Event Delegation for Task Actions
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

// Delete Completed Task
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

// Complete Task
function completeTask(taskId) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;

    const task = tasks[taskIndex];
    task.completed = true;
    task.completedAt = new Date().toISOString();

    // Move to completed tasks
    completedTasksList.push(task);
    tasks.splice(taskIndex, 1);

    // Update stats
    userStats.tasksCompleted += 1;
    userStats.points += calculatePoints(task);

    // Check for streak
    updateStreak();

    // Save and render
    saveData();
    renderTasks();
    renderCompletedTasks();
    updateStats();
    updateAchievements();

    // Show celebration
    showNotification('Task completed! Great job!', 'success');
}

// Delete Task
function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    tasks = tasks.filter(task => task.id !== taskId);

    saveData();
    renderTasks();

    showNotification('Task deleted', 'info');
}

// Toggle Step Completion
function toggleStepCompletion(taskId, stepId, completed) {
    const task = tasks.find(task => task.id === taskId);
    if (!task) return;

    const step = task.steps.find(step => step.id === stepId);
    if (!step) return;

    step.completed = completed;

    // Update progress bar
    const taskElement = document.querySelector(`.task-item[data-id="${taskId}"]`);
    if (taskElement) {
        const completedSteps = task.steps.filter(step => step.completed).length;
        const totalSteps = task.steps.length;
        const completionPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

        const progressBar = taskElement.querySelector('.timer-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${completionPercentage}%`;
        }

        // Update step text style
        const stepText = taskElement.querySelector(`.step-checkbox[data-step-id="${stepId}"]`).nextElementSibling;
        if (stepText) {
            stepText.classList.toggle('completed', completed);
        }
    }

    // Award points for step completion
    if (completed) {
        userStats.points += 5;
        updateStats();
    }

    saveData();
}

// Start Task Timer
function startTaskTimer(taskId) {
    const task = tasks.find(task => task.id === taskId);
    if (!task) return;

    // Set the timer to the task's specified time
    timerSeconds = task.timer * 60;
    updateTimerDisplay();
    updateTimerCircle();

    // Start the timer if not already running
    if (!timerRunning) {
        startTimer();
    }

    // Track timer usage for achievements
    timerUses++;
    localStorage.setItem('timerUses', JSON.stringify(timerUses));
    updateAchievements();

    showNotification(`Timer set for "${task.title}"`, 'info');
}

// Timer Functions
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
            // Play a sound if needed
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

// Calculate points for task completion
function calculatePoints(task) {
    let points = 10; // Base points

    // Bonus points based on priority
    if (task.priority === 'high') points += 10;
    else if (task.priority === 'medium') points += 5;

    // Bonus points for steps
    if (task.steps.length > 0) points += task.steps.length * 2;

    return points;
}

// Update streak
function updateStreak() {
    const today = new Date().toDateString();
    const lastCompletion = userStats.lastCompletion ? new Date(userStats.lastCompletion).toDateString() : null;

    if (lastCompletion === today) {
        // Already completed a task today, no change
        return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toDateString();

    if (lastCompletion === yesterdayString) {
        // Continued streak
        userStats.streak += 1;
    } else {
        // New streak or broken streak
        userStats.streak = 1;
    }

    userStats.lastCompletion = new Date().toISOString();
}

// Update stats display
function updateStats() {
    pointsElement.textContent = userStats.points;
    streakElement.textContent = userStats.streak;
    tasksCompletedElement.textContent = userStats.tasksCompleted;
}

// Update achievements
function updateAchievements() {
    // First task achievement
    if (userStats.tasksCompleted >= 1) {
        unlockAchievement('achievement-1');
    }

    // 3-day streak achievement
    if (userStats.streak >= 3) {
        unlockAchievement('achievement-2');
    }

    // Task master achievement (10 tasks)
    if (userStats.tasksCompleted >= 10) {
        unlockAchievement('achievement-3');
    }

    // Timer user achievement (use timer 5 times)
    if (timerUses >= 5) {
        unlockAchievement('achievement-4');
    }

    // NEW ACHIEVEMENTS

    // Productivity Pro (25 tasks)
    if (userStats.tasksCompleted >= 25) {
        unlockAchievement('achievement-5');
    }

    // Week Warrior (7-day streak)
    if (userStats.streak >= 7) {
        unlockAchievement('achievement-6');
    }

    // Step Master (complete 50 steps)
    const totalStepsCompleted = completedTasksList.reduce((total, task) => {
        return total + task.steps.filter(step => step.completed).length;
    }, 0);
    if (totalStepsCompleted >= 50) {
        unlockAchievement('achievement-7');
    }

    // Priority Finisher (complete 5 high-priority tasks)
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

// Show notification
function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Style the notification
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

    // Add to page
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('completedTasks', JSON.stringify(completedTasksList));
    localStorage.setItem('reminders', JSON.stringify(reminders));
    localStorage.setItem('userStats', JSON.stringify(userStats));
}

// Initialize the app
init();