// DOM Elements
const calculateBtn = document.getElementById('calculate-btn');
const saveBtn = document.getElementById('save-btn');
const recommendationsBtn = document.getElementById('recommendations-btn');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const exportBtn = document.getElementById('export-btn');
const riskIndicator = document.getElementById('risk-indicator');
const riskScore = document.getElementById('risk-score');
const riskLevel = document.getElementById('risk-level');
const factorBreakdown = document.getElementById('factor-breakdown');
const recommendationsCard = document.getElementById('recommendations-card');
const historyList = document.getElementById('history-list');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const collapseToggles = document.querySelectorAll('.collapse-toggle');
const defaultValues = new Set();

// Slider elements
const sliders = document.querySelectorAll('.slider');
const sliderValues = document.querySelectorAll('.slider-value');

// Factor scores
const energyScore = document.getElementById('energy-score');
const sensoryScore = document.getElementById('sensory-score');
const executiveScore = document.getElementById('executive-score');
const socialScore = document.getElementById('social-score');
const emotionScore = document.getElementById('emotion-score');

// Storage key
const STORAGE_KEY = 'burnout-assessment-history';

// Initialize sliders
sliders.forEach((slider, index) => {
    // Set all sliders to neutral (3) initially
    slider.value = 3;
    sliderValues[index].textContent = '3';

    // Track that this is a default value
    defaultValues.add(slider.id);

    slider.addEventListener('input', function() {
        sliderValues[index].textContent = this.value;
        // Remove from default values once user changes it
        defaultValues.delete(this.id);
    });
});

// Tab functionality
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs and contents
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        // Add active class to clicked tab and corresponding content
        tab.classList.add('active');
        const tabId = `${tab.dataset.tab}-tab`;
        document.getElementById(tabId).classList.add('active');
    });
});

// Collapse functionality for factor groups
collapseToggles.forEach(toggle => {
    toggle.addEventListener('click', function() {
        const targetId = this.getAttribute('data-target');
        const content = document.getElementById(targetId);
        const icon = this.querySelector('.collapse-icon');

        if (content.classList.contains('collapsed')) {
            content.classList.remove('collapsed');
            content.style.maxHeight = content.scrollHeight + 'px';
            icon.style.transform = 'rotate(0deg)';
        } else {
            content.classList.add('collapsed');
            content.style.maxHeight = '0';
            icon.style.transform = 'rotate(-90deg)';
        }
    });

    // Initialize collapsed state
    const targetId = toggle.getAttribute('data-target');
    const content = document.getElementById(targetId);
    const icon = toggle.querySelector('.collapse-icon');
    content.classList.add('collapsed');
    content.style.maxHeight = '0';
    icon.style.transform = 'rotate(-90deg)';
});

// Calculate risk
calculateBtn.addEventListener('click', calculateRisk);

function calculateRisk() {
    // Check if all values are still at default (neutral)
    if (defaultValues.size === sliders.length) {
        alert('Please adjust at least one slider from the neutral position to get an accurate assessment.');
        return;
    }

    // Get values from all sliders (now 0-5 scale)
    const energyLevel = parseInt(document.getElementById('energy-level').value);
    const sleepQuality = parseInt(document.getElementById('sleep-quality').value);
    const routineDifficulty = parseInt(document.getElementById('routine-difficulty').value);
    const stimulantUse = parseInt(document.getElementById('stimulant-use').value);

    const sensoryOverload = parseInt(document.getElementById('sensory-overload').value);
    const sensoryAvoidance = parseInt(document.getElementById('sensory-avoidance').value);
    const tactileSensitivity = parseInt(document.getElementById('tactile-sensitivity').value);
    const sensoryTools = parseInt(document.getElementById('sensory-tools').value);

    const taskInitiation = parseInt(document.getElementById('task-initiation').value);
    const planningDifficulty = parseInt(document.getElementById('planning-difficulty').value);
    const memoryIssues = parseInt(document.getElementById('memory-issues').value);
    const decisionFatigue = parseInt(document.getElementById('decision-fatigue').value);

    const socialDrain = parseInt(document.getElementById('social-drain').value);
    const maskingLevel = parseInt(document.getElementById('masking-level').value);
    const communicationDifficulty = parseInt(document.getElementById('communication-difficulty').value);
    const socialIsolation = parseInt(document.getElementById('social-isolation').value);

    const emotionalReactivity = parseInt(document.getElementById('emotional-reactivity').value);
    const emotionalNumbness = parseInt(document.getElementById('emotional-numbness').value);
    const meltdownFrequency = parseInt(document.getElementById('meltdown-frequency').value);
    const hopelessness = parseInt(document.getElementById('hopelessness').value);

    // Calculate factor scores (each category now has 4 questions, max 20)
    const energyFactor = energyLevel + sleepQuality + routineDifficulty + stimulantUse;
    const sensoryFactor = sensoryOverload + sensoryAvoidance + tactileSensitivity + sensoryTools;
    const executiveFactor = taskInitiation + planningDifficulty + memoryIssues + decisionFatigue;
    const socialFactor = socialDrain + maskingLevel + communicationDifficulty + socialIsolation;
    const emotionFactor = emotionalReactivity + emotionalNumbness + meltdownFrequency + hopelessness;

    // Calculate total score (0-100)
    const totalScore = energyFactor + sensoryFactor + executiveFactor + socialFactor + emotionFactor;

    // Update factor breakdown
    energyScore.textContent = `${energyFactor}/20`;
    sensoryScore.textContent = `${sensoryFactor}/20`;
    executiveScore.textContent = `${executiveFactor}/20`;
    socialScore.textContent = `${socialFactor}/20`;
    emotionScore.textContent = `${emotionFactor}/20`;

    // Show factor breakdown
    factorBreakdown.style.display = 'block';

    // Update risk indicator position
    const riskPercentage = (totalScore / 100) * 100;
    riskIndicator.style.left = `${riskPercentage}%`;

    // Update risk score and level
    riskScore.textContent = totalScore;

    let riskText = '';
    let riskClass = '';

    if (totalScore <= 25) {
        riskText = 'Low Risk';
        riskClass = 'low-risk';
    } else if (totalScore <= 50) {
        riskText = 'Medium Risk';
        riskClass = 'medium-risk';
    } else if (totalScore <= 75) {
        riskText = 'High Risk';
        riskClass = 'high-risk';
    } else {
        riskText = 'Critical Risk';
        riskClass = 'critical-risk';
    }

    riskLevel.textContent = riskText;
    riskLevel.className = `risk-level ${riskClass}`;

    // Update recommendations based on highest scoring factors
    updatePriorityRecommendations(energyFactor, sensoryFactor, executiveFactor, socialFactor, emotionFactor);
}

// Update priority recommendations based on factor scores
function updatePriorityRecommendations(energy, sensory, executive, social, emotion) {
    const factors = [
        { name: 'energy', score: energy },
        { name: 'sensory', score: sensory },
        { name: 'executive', score: executive },
        { name: 'social', score: social },
        { name: 'emotion', score: emotion }
    ];

    // Sort by score (highest first)
    factors.sort((a, b) => b.score - a.score);

    // Update priority badges based on ranking
    factors.forEach((factor, index) => {
        const tab = document.querySelector(`[data-tab="${factor.name}"]`);
        if (tab) {
            // Clear existing priority indicators
            const existingBadges = tab.querySelectorAll('.priority-indicator');
            existingBadges.forEach(badge => badge.remove());

            // Add new priority indicator
            let priorityText = '';
            let priorityClass = '';

            if (index === 0) {
                priorityText = 'Highest Priority';
                priorityClass = 'priority-high';
            } else if (index === 1) {
                priorityText = 'High Priority';
                priorityClass = 'priority-high';
            } else if (index === 2) {
                priorityText = 'Medium Priority';
                priorityClass = 'priority-medium';
            } else {
                priorityText = 'Lower Priority';
                priorityClass = 'priority-low';
            }

            const priorityBadge = document.createElement('span');
            priorityBadge.className = `priority-badge ${priorityClass} priority-indicator`;
            priorityBadge.textContent = priorityText;
            tab.appendChild(priorityBadge);
        }
    });
}

// Save assessment
saveBtn.addEventListener('click', saveAssessment);

function saveAssessment() {
    const totalScore = riskScore.textContent;
    if (totalScore === '--') {
        alert('Please calculate your risk score before saving.');
        return;
    }

    const assessment = {
        date: new Date().toISOString(),
        score: parseInt(totalScore),
        factors: {
            energy: parseInt(energyScore.textContent.split('/')[0]),
            sensory: parseInt(sensoryScore.textContent.split('/')[0]),
            executive: parseInt(executiveScore.textContent.split('/')[0]),
            social: parseInt(socialScore.textContent.split('/')[0]),
            emotion: parseInt(emotionScore.textContent.split('/')[0])
        }
    };

    // Get existing history or initialize empty array
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    // Add new assessment
    history.push(assessment);

    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));

    // Update history display
    renderHistory();

    alert('Assessment saved successfully!');
}

// Show recommendations
recommendationsBtn.addEventListener('click', () => {
    recommendationsCard.style.display = 'block';
    recommendationsCard.scrollIntoView({ behavior: 'smooth' });
});

// Clear history
clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all assessment history? This cannot be undone.')) {
        localStorage.removeItem(STORAGE_KEY);
        renderHistory();
    }
});

// Export data
exportBtn.addEventListener('click', exportData);

function exportData() {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    if (history.length === 0) {
        alert('No assessment history to export.');
        return;
    }

    // Convert to CSV
    let csv = 'Date,Total Score,Energy Factor,Sensory Factor,Executive Factor,Social Factor,Emotion Factor\n';

    history.forEach(assessment => {
        const date = new Date(assessment.date).toLocaleDateString();
        csv += `${date},${assessment.score},${assessment.factors.energy},${assessment.factors.sensory},${assessment.factors.executive},${assessment.factors.social},${assessment.factors.emotion}\n`;
    });

    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `burnout-assessment-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Render history
function renderHistory() {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    if (history.length === 0) {
        historyList.innerHTML = '<p>No assessment history yet. Complete and save an assessment to see your history here.</p>';
        return;
    }

    // Sort by date (newest first)
    history.sort((a, b) => new Date(b.date) - new Date(a.date));

    let html = '';

    history.forEach((assessment, index) => {
        const date = new Date(assessment.date).toLocaleDateString();
        const time = new Date(assessment.date).toLocaleTimeString();

        let riskClass = '';
        if (assessment.score <= 25) {
            riskClass = '';
        } else if (assessment.score <= 50) {
            riskClass = 'medium';
        } else if (assessment.score <= 75) {
            riskClass = 'high';
        } else {
            riskClass = 'critical';
        }

        // Calculate trend if there's a previous assessment
        let trendHtml = '';
        if (index < history.length - 1) {
            const prevScore = history[index + 1].score;
            const trend = assessment.score - prevScore;

            if (trend > 5) {
                trendHtml = '<span class="trend-indicator trend-up">↑ Increasing</span>';
            } else if (trend < -5) {
                trendHtml = '<span class="trend-indicator trend-down">↓ Improving</span>';
            } else {
                trendHtml = '<span class="trend-indicator trend-stable">→ Stable</span>';
            }
        }

        html += `
                <div class="history-item ${riskClass}">
                    <div class="history-date">${date} at ${time} ${trendHtml}</div>
                    <div>Total Score: <strong>${assessment.score}/100</strong></div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(assessment.score / 100) * 100}%"></div>
                    </div>
                    <div class="history-score">
                        <span>Energy: ${assessment.factors.energy}/20</span>
                        <span>Sensory: ${assessment.factors.sensory}/20</span>
                        <span>Executive: ${assessment.factors.executive}/20</span>
                        <span>Social: ${assessment.factors.social}/20</span>
                        <span>Emotion: ${assessment.factors.emotion}/20</span>
                    </div>
                </div>
            `;
    });

    historyList.innerHTML = html;
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    renderHistory();
});