/*
	Copyright (c) 2025-2026. Jericho Crosby (Chalwk)

    Autistic Burnout Risk Assessment JavaScript
*/

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

// Track answered sliders
const answeredSliders = new Set();

// Initialize sliders with validation
sliders.forEach((slider, index) => {
    slider.value = 3;
    sliderValues[index].textContent = '3';
    slider.classList.add('unanswered');

    slider.addEventListener('input', function() {
        sliderValues[index].textContent = this.value;

        // Mark as answered
        answeredSliders.add(this.id);
        slider.classList.remove('unanswered');
        slider.classList.add('answered');

        updateCalculateButtonState();
    });
});

function updateCalculateButtonState() {
    const allAnswered = answeredSliders.size === sliders.length;

    if (allAnswered) {
        calculateBtn.disabled = false;
        calculateBtn.classList.remove('disabled');
        calculateBtn.title = 'Calculate your burnout risk';
    } else {
        calculateBtn.disabled = true;
        calculateBtn.classList.add('disabled');
        const remaining = sliders.length - answeredSliders.size;
        calculateBtn.title = `Please answer ${remaining} more question${remaining !== 1 ? 's' : ''}`;
    }
}

updateCalculateButtonState();

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

// Collapse groups
function initializeCollapsedState() {
    collapseToggles.forEach(toggle => {
        const targetId = toggle.getAttribute('data-target');
        const content = document.getElementById(targetId);
        const icon = toggle.querySelector('.collapse-icon');

        content.classList.add('collapsed');
        content.style.maxHeight = '0';
        icon.style.transform = 'rotate(-90deg)';

        toggle.addEventListener('click', function() {
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
    });
}

initializeCollapsedState();
calculateBtn.addEventListener('click', calculateRisk);

function calculateRisk() {
    // Check if all sliders have been answered
    if (answeredSliders.size !== sliders.length) {
        const unansweredCount = sliders.length - answeredSliders.size;
        alert(`Please answer all ${unansweredCount} remaining question${unansweredCount !== 1 ? 's' : ''} before calculating your risk.`);

        // Highlight unanswered questions
        sliders.forEach(slider => {
            if (!answeredSliders.has(slider.id)) {
                slider.scrollIntoView({ behavior: 'smooth', block: 'center' });
                slider.focus();
                return;
            }
        });

        return;
    }

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

    // Energy factor (high impact on overall burnout)
    const energyFactor = Math.round(
        (energyLevel * 1.2) +
        (sleepQuality * 1.1) +
        (routineDifficulty * 1.0) +
        (stimulantUse * 0.9)
    );

    // Sensory factor (medium-high impact)
    const sensoryFactor = Math.round(
        (sensoryOverload * 1.1) +
        (sensoryAvoidance * 1.0) +
        (tactileSensitivity * 0.9) +
        (sensoryTools * 0.8)
    );

    // Executive function factor (high impact)
    const executiveFactor = Math.round(
        (taskInitiation * 1.2) +
        (planningDifficulty * 1.1) +
        (memoryIssues * 1.0) +
        (decisionFatigue * 1.1)
    );

    // Social factor (medium impact)
    const socialFactor = Math.round(
        (socialDrain * 1.1) +
        (maskingLevel * 1.2) +
        (communicationDifficulty * 1.0) +
        (socialIsolation * 0.9)
    );

    // Emotional factor (high impact)
    const emotionFactor = Math.round(
        (emotionalReactivity * 1.1) +
        (emotionalNumbness * 1.0) +
        (meltdownFrequency * 1.3) +
        (hopelessness * 1.2)
    );

    // Non-linear scaling to account for compounding effects
    // Higher scores in multiple areas compound burnout risk!
    const factorScores = [energyFactor, sensoryFactor, executiveFactor, socialFactor, emotionFactor];
    const highRiskFactors = factorScores.filter(score => score >= 15).length;
    const compoundingMultiplier = 1 + (highRiskFactors * 0.1); // 10% increase per high-risk factor

    // Calculate total score with compounding
    let totalScore = Math.round(
        (energyFactor + sensoryFactor + executiveFactor + socialFactor + emotionFactor) *
        compoundingMultiplier
    );

    // Cap at maximum of 100!
    totalScore = Math.min(totalScore, 100);

    // Show weighted scores but display out of 20
    energyScore.textContent = `${energyFactor}/20`;
    sensoryScore.textContent = `${sensoryFactor}/20`;
    executiveScore.textContent = `${executiveFactor}/20`;
    socialScore.textContent = `${socialFactor}/20`;
    emotionScore.textContent = `${emotionFactor}/20`;

    factorBreakdown.style.display = 'block';

    const riskPercentage = Math.min((totalScore / 100) * 100, 100);
    riskIndicator.style.left = `${riskPercentage}%`;
    riskScore.textContent = totalScore;

    let riskText = '';
    let riskClass = '';
    let riskDescription = '';

    if (totalScore <= 20) {
        riskText = 'Low Risk';
        riskClass = 'low-risk';
        riskDescription = 'Minimal signs of burnout. Good self-care practices detected.';
    } else if (totalScore <= 40) {
        riskText = 'Moderate Risk';
        riskClass = 'medium-risk';
        riskDescription = 'Early warning signs present. Consider preventative strategies.';
    } else if (totalScore <= 60) {
        riskText = 'High Risk';
        riskClass = 'high-risk';
        riskDescription = 'Significant burnout symptoms. Active intervention recommended.';
    } else if (totalScore <= 80) {
        riskText = 'Severe Risk';
        riskClass = 'critical-risk';
        riskDescription = 'Severe burnout symptoms. Professional support strongly advised.';
    } else {
        riskText = 'Critical Risk';
        riskClass = 'critical-risk';
        riskDescription = 'Critical level of burnout. Immediate professional support needed.';
    }

    riskLevel.textContent = riskText;
    riskLevel.className = `risk-level ${riskClass}`;

    const riskDescriptionEl = document.getElementById('risk-description');
    if (riskDescriptionEl) {
        riskDescriptionEl.textContent = riskDescription;
    }
    updatePriorityRecommendations(energyFactor, sensoryFactor, executiveFactor, socialFactor, emotionFactor);

    factorBreakdown.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Priority recommendations
function updatePriorityRecommendations(energy, sensory, executive, social, emotion) {
    const factors = [
        { name: 'energy', score: energy, label: 'Energy Management' },
        { name: 'sensory', score: sensory, label: 'Sensory Processing' },
        { name: 'executive', score: executive, label: 'Executive Function' },
        { name: 'social', score: social, label: 'Social Interaction' },
        { name: 'emotion', score: emotion, label: 'Emotional Regulation' }
    ];

    // Sort by score (highest first)
    factors.sort((a, b) => b.score - a.score);

    // Clear existing priority indicators
    document.querySelectorAll('.priority-indicator').forEach(indicator => indicator.remove());

    // Update priority badges based on ranking and score thresholds
    factors.forEach((factor, index) => {
        const tab = document.querySelector(`[data-tab="${factor.name}"]`);
        if (tab) {
            let priorityText = '';
            let priorityClass = '';

            // Determine priority based on combination of rank and absolute score
            if (factor.score >= 16 || index === 0) {
                priorityText = 'Highest Priority';
                priorityClass = 'priority-high';
            } else if (factor.score >= 12 || index <= 1) {
                priorityText = 'High Priority';
                priorityClass = 'priority-high';
            } else if (factor.score >= 8 || index <= 2) {
                priorityText = 'Medium Priority';
                priorityClass = 'priority-medium';
            } else {
                priorityText = 'Lower Priority';
                priorityClass = 'priority-low';
            }

            const priorityBadge = document.createElement('span');
            priorityBadge.className = `priority-badge ${priorityClass} priority-indicator`;
            priorityBadge.textContent = priorityText;
            priorityBadge.title = `${factor.label}: ${factor.score}/20`;
            tab.appendChild(priorityBadge);
        }
    });
}

saveBtn.addEventListener('click', saveAssessment);

function saveAssessment() {
    const totalScore = riskScore.textContent;
    if (totalScore === '--' || answeredSliders.size !== sliders.length) {
        alert('Please complete and calculate your risk score before saving.');
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
        },
        answeredQuestions: answeredSliders.size
    };

    const history = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    history.push(assessment);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    renderHistory();

    alert('Assessment saved successfully!');
}

// Show recommendations
recommendationsBtn.addEventListener('click', () => {
    if (answeredSliders.size !== sliders.length) {
        alert('Please complete the assessment first to get personalized recommendations.');
        return;
    }

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
    let csv = 'Date,Total Score,Energy Factor,Sensory Factor,Executive Factor,Social Factor,Emotion Factor,Questions Answered\n';

    history.forEach(assessment => {
        const date = new Date(assessment.date).toLocaleDateString();
        csv += `${date},${assessment.score},${assessment.factors.energy},${assessment.factors.sensory},${assessment.factors.executive},${assessment.factors.social},${assessment.factors.emotion},${assessment.answeredQuestions || sliders.length}\n`;
    });

    // Download link
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

// Enhanced history rendering
function renderHistory() {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    if (history.length === 0) {
        historyList.innerHTML = '<div class="history-empty"><p>No assessment history yet.</p><p>Complete and save an assessment to see your history here.</p></div>';
        return;
    }

    // Sort by date (newest first)
    history.sort((a, b) => new Date(b.date) - new Date(a.date));

    let html = '';

    history.forEach((assessment, index) => {
        const date = new Date(assessment.date).toLocaleDateString();
        const time = new Date(assessment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let riskClass = '';
        let riskLevelText = '';

        if (assessment.score <= 20) {
            riskClass = 'low';
            riskLevelText = 'Low Risk';
        } else if (assessment.score <= 40) {
            riskClass = 'medium';
            riskLevelText = 'Moderate Risk';
        } else if (assessment.score <= 60) {
            riskClass = 'high';
            riskLevelText = 'High Risk';
        } else if (assessment.score <= 80) {
            riskClass = 'critical';
            riskLevelText = 'Severe Risk';
        } else {
            riskClass = 'critical';
            riskLevelText = 'Critical Risk';
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
                <div class="history-header">
                    <div class="history-date">${date} at ${time}</div>
                    <div class="history-risk">${riskLevelText} ${trendHtml}</div>
                </div>
                <div class="history-score-total">Total Score: <strong>${assessment.score}/100</strong></div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(assessment.score / 100) * 100}%"></div>
                </div>
                <div class="history-scores">
                    <span class="factor-score">Energy: ${assessment.factors.energy}/20</span>
                    <span class="factor-score">Sensory: ${assessment.factors.sensory}/20</span>
                    <span class="factor-score">Executive: ${assessment.factors.executive}/20</span>
                    <span class="factor-score">Social: ${assessment.factors.social}/20</span>
                    <span class="factor-score">Emotion: ${assessment.factors.emotion}/20</span>
                </div>
            </div>
        `;
    });

    historyList.innerHTML = html;
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    renderHistory();

    // Add CSS for validation states
    const style = document.createElement('style');
    style.textContent = `
        .slider.unanswered {
            border: 2px solid #ff6b6b;
            border-radius: 4px;
        }
        .slider.answered {
            border: 2px solid #51cf66;
            border-radius: 4px;
        }
        #calculate-btn.disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        .history-empty {
            text-align: center;
            padding: 2rem;
            color: #666;
        }
        .history-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }
        .history-risk {
            font-weight: bold;
        }
        .history-score-total {
            margin-bottom: 0.5rem;
        }
        .history-scores {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 0.5rem;
            margin-top: 0.5rem;
        }
        .factor-score {
            font-size: 0.9rem;
            color: #555;
        }
    `;
    document.head.appendChild(style);
});