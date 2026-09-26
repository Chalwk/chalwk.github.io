// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// ---------- Element refs ----------
const calculateBtn = document.getElementById('calculate-btn');
const clearAnswersBtn = document.getElementById('clear-answers-btn');
const saveBtn = document.getElementById('save-btn');
const copyResultsBtn = document.getElementById('copy-results-btn');
const recommendationsBtn = document.getElementById('recommendations-btn');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const exportBtn = document.getElementById('export-btn');
const riskIndicator = document.getElementById('risk-indicator');
const riskScore = document.getElementById('risk-score');
const riskLevel = document.getElementById('risk-level');
const riskDescription = document.getElementById('risk-description');
const factorBreakdown = document.getElementById('factor-breakdown');
const recommendationsCard = document.getElementById('recommendations-card');
const historyList = document.getElementById('history-list');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

const tabs = document.querySelectorAll('[role="tab"]');
const tabContents = document.querySelectorAll('[role="tabpanel"]');
const allRadios = document.querySelectorAll('input[type="radio"]');

const scoreEls = {
    energy: document.getElementById('energy-score'),
    sensory: document.getElementById('sensory-score'),
    executive: document.getElementById('executive-score'),
    social: document.getElementById('social-score'),
    emotion: document.getElementById('emotion-score')
};
const barEls = {
    energy: document.getElementById('energy-bar'),
    sensory: document.getElementById('sensory-bar'),
    executive: document.getElementById('executive-bar'),
    social: document.getElementById('social-bar'),
    emotion: document.getElementById('emotion-bar')
};

const STORAGE_KEY = 'burnout-assessment-history';
const DRAFT_KEY = 'burnout-assessment-draft-v2';

// All unique question names (radio group names)
const QUESTION_NAMES = [...new Set(Array.from(allRadios).map(r => r.name))];
const TOTAL_QUESTIONS = QUESTION_NAMES.length;

// ---------- Answer tracking ----------
const answers = new Map();

allRadios.forEach(radio => {
    radio.addEventListener('change', e => {
        answers.set(e.target.name, parseInt(e.target.value, 10));
        saveDraft();
        updateProgress();
        // Clear any previous highlight if all answered
        const fieldset = e.target.closest('fieldset');
        if (fieldset) fieldset.classList.remove('unanswered');
    });
});

function updateProgress() {
    const answered = answers.size;
    const pct = (answered / TOTAL_QUESTIONS) * 100;
    progressBar.style.width = pct + '%';
    progressText.textContent = `${answered} of ${TOTAL_QUESTIONS} answered`;

    const allDone = answered === TOTAL_QUESTIONS;
    calculateBtn.disabled = !allDone;
    calculateBtn.classList.toggle('disabled', !allDone);
    calculateBtn.title = allDone
        ? 'Calculate your burnout risk'
        : `Please answer ${TOTAL_QUESTIONS - answered} more question${TOTAL_QUESTIONS - answered !== 1 ? 's' : ''}`;
}

// ---------- Draft save/load (so an interrupted session is not lost) ----------
function saveDraft() {
    try {
        const obj = {};
        answers.forEach((v, k) => { obj[k] = v; });
        localStorage.setItem(DRAFT_KEY, JSON.stringify(obj));
    } catch (e) { /* storage may be unavailable */ }
}

function loadDraft() {
    try {
        const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
        Object.entries(draft).forEach(([name, value]) => {
            const radio = document.querySelector(`input[name="${CSS.escape(name)}"][value="${value}"]`);
            if (radio) {
                radio.checked = true;
                answers.set(name, parseInt(value, 10));
            }
        });
        updateProgress();
    } catch (e) { /* ignore */ }
}

// ---------- Clear answers ----------
clearAnswersBtn.addEventListener('click', () => {
    if (answers.size === 0) return;
    if (!confirm('Clear all your answers? This cannot be undone.')) return;
    answers.clear();
    allRadios.forEach(r => { r.checked = false; });
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) { }
    updateProgress();
    // Reset results panel
    riskIndicator.style.left = '0%';
    riskScore.textContent = '--';
    riskLevel.textContent = 'Complete assessment first';
    riskLevel.className = 'risk-level';
    riskDescription.textContent = '';
    factorBreakdown.style.display = 'none';
    recommendationsCard.style.display = 'none';
});

// ---------- Tabs (with keyboard arrow navigation) ----------
tabs.forEach((tab, idx) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', e => {
        let newIdx = null;
        if (e.key === 'ArrowRight') newIdx = (idx + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') newIdx = (idx - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') newIdx = 0;
        else if (e.key === 'End') newIdx = tabs.length - 1;
        if (newIdx !== null) {
            e.preventDefault();
            tabs[newIdx].focus();
            activateTab(tabs[newIdx]);
        }
    });
});

function activateTab(tab) {
    tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
    });
    tabContents.forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    const panel = document.getElementById(`${tab.dataset.tab}-tab`);
    if (panel) panel.classList.add('active');
}

// ---------- Main calculation ----------
calculateBtn.addEventListener('click', calculateRisk);

function calculateRisk() {
    if (answers.size !== TOTAL_QUESTIONS) {
        const remaining = TOTAL_QUESTIONS - answers.size;
        alert(`Please answer all ${remaining} remaining question${remaining !== 1 ? 's' : ''} before calculating.`);
        // Highlight the first unanswered question
        for (const name of QUESTION_NAMES) {
            if (!answers.has(name)) {
                const fieldset = document.querySelector(`input[name="${CSS.escape(name)}"]`)?.closest('fieldset');
                if (fieldset) {
                    fieldset.classList.add('unanswered');
                    fieldset.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    fieldset.querySelector('input')?.focus({ preventScroll: true });
                }
                break;
            }
        }
        return;
    }

    const v = name => answers.get(name);

    const energyFactor = Math.round(
        (v('energy-level') * 1.2) +
        (v('sleep-quality') * 1.1) +
        (v('routine-difficulty') * 1.0) +
        (v('stimulant-use') * 0.9)
    );

    const sensoryFactor = Math.round(
        (v('sensory-overload') * 1.1) +
        (v('sensory-avoidance') * 1.0) +
        (v('tactile-sensitivity') * 0.9) +
        (v('sensory-tools') * 0.8)
    );

    const executiveFactor = Math.round(
        (v('task-initiation') * 1.2) +
        (v('planning-difficulty') * 1.1) +
        (v('memory-issues') * 1.0) +
        (v('decision-fatigue') * 1.1)
    );

    const socialFactor = Math.round(
        (v('social-drain') * 1.1) +
        (v('masking-level') * 1.2) +
        (v('communication-difficulty') * 1.0) +
        (v('social-isolation') * 0.9)
    );

    const emotionFactor = Math.round(
        (v('emotional-reactivity') * 1.1) +
        (v('emotional-numbness') * 1.0) +
        (v('meltdown-frequency') * 1.3) +
        (v('hopelessness') * 1.2)
    );

    const factorScores = [energyFactor, sensoryFactor, executiveFactor, socialFactor, emotionFactor];
    const highRiskFactors = factorScores.filter(s => s >= 15).length;
    const compoundingMultiplier = 1 + (highRiskFactors * 0.1);
    let totalScore = Math.round(factorScores.reduce((a, b) => a + b, 0) * compoundingMultiplier);
    totalScore = Math.min(totalScore, 100);

    // Factor UI
    scoreEls.energy.textContent = `${energyFactor}/20`;
    scoreEls.sensory.textContent = `${sensoryFactor}/20`;
    scoreEls.executive.textContent = `${executiveFactor}/20`;
    scoreEls.social.textContent = `${socialFactor}/20`;
    scoreEls.emotion.textContent = `${emotionFactor}/20`;

    setBar('energy', energyFactor);
    setBar('sensory', sensoryFactor);
    setBar('executive', executiveFactor);
    setBar('social', socialFactor);
    setBar('emotion', emotionFactor);

    factorBreakdown.style.display = 'block';

    // Risk meter
    const riskPercentage = Math.min((totalScore / 100) * 100, 100);
    riskIndicator.style.left = `${riskPercentage}%`;
    riskScore.textContent = totalScore;

    let riskText = '';
    let riskClass = '';
    let riskDesc = '';
    if (totalScore <= 20) {
        riskText = 'Low Risk';
        riskClass = 'low-risk';
        riskDesc = 'Minimal signs of burnout. Your self-care practices appear to be working well.';
    } else if (totalScore <= 40) {
        riskText = 'Moderate Risk';
        riskClass = 'medium-risk';
        riskDesc = 'Early warning signs are present. Consider preventative strategies and extra rest.';
    } else if (totalScore <= 60) {
        riskText = 'High Risk';
        riskClass = 'high-risk';
        riskDesc = 'Significant burnout symptoms. Active intervention and support are recommended.';
    } else if (totalScore <= 80) {
        riskText = 'Severe Risk';
        riskClass = 'critical-risk';
        riskDesc = 'Severe burnout symptoms. Professional support is strongly advised.';
    } else {
        riskText = 'Critical Risk';
        riskClass = 'critical-risk';
        riskDesc = 'Critical level of burnout. Please seek immediate professional support.';
    }

    riskLevel.textContent = riskText;
    riskLevel.className = `risk-level ${riskClass}`;
    riskDescription.textContent = riskDesc;

    updatePriorityRecommendations(energyFactor, sensoryFactor, executiveFactor, socialFactor, emotionFactor);

    // Scroll to results
    document.getElementById('results-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setBar(key, score) {
    const bar = barEls[key];
    if (!bar) return;
    bar.style.width = `${(score / 20) * 100}%`;
    bar.classList.remove('low', 'medium', 'high');
    if (score >= 15) bar.classList.add('high');
    else if (score >= 9) bar.classList.add('medium');
    else bar.classList.add('low');
}

// ---------- Tab priority badge ----------
function updatePriorityRecommendations(energy, sensory, executive, social, emotion) {
    const factors = [
        { name: 'energy', score: energy },
        { name: 'sensory', score: sensory },
        { name: 'executive', score: executive },
        { name: 'social', score: social },
        { name: 'emotion', score: emotion }
    ];
    factors.sort((a, b) => b.score - a.score);

    document.querySelectorAll('.priority-indicator').forEach(i => i.remove());

    factors.forEach((factor, index) => {
        const tab = document.querySelector(`[data-tab="${factor.name}"]`);
        if (!tab) return;
        let text, cls;
        if (factor.score >= 16 || index === 0) { text = 'Highest Priority'; cls = 'priority-high'; }
        else if (factor.score >= 12 || index <= 1) { text = 'High Priority'; cls = 'priority-high'; }
        else if (factor.score >= 8 || index <= 2) { text = 'Medium Priority'; cls = 'priority-medium'; }
        else { text = 'Lower Priority'; cls = 'priority-low'; }
        const badge = document.createElement('span');
        badge.className = `priority-badge ${cls} priority-indicator`;
        badge.textContent = text;
        badge.title = `${factor.name}: ${factor.score}/20`;
        tab.appendChild(badge);
    });
}

// ---------- Save assessment ----------
saveBtn.addEventListener('click', saveAssessment);

function saveAssessment() {
    if (riskScore.textContent === '--' || answers.size !== TOTAL_QUESTIONS) {
        alert('Please complete and calculate your risk score before saving.');
        return;
    }
    const assessment = {
        date: new Date().toISOString(),
        score: parseInt(riskScore.textContent, 10),
        factors: {
            energy: parseInt(scoreEls.energy.textContent.split('/')[0], 10),
            sensory: parseInt(scoreEls.sensory.textContent.split('/')[0], 10),
            executive: parseInt(scoreEls.executive.textContent.split('/')[0], 10),
            social: parseInt(scoreEls.social.textContent.split('/')[0], 10),
            emotion: parseInt(scoreEls.emotion.textContent.split('/')[0], 10)
        },
        answeredQuestions: answers.size
    };
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    history.push(assessment);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    renderHistory();
    alert('Assessment saved successfully.');
}

// ---------- Copy results ----------
copyResultsBtn.addEventListener('click', async () => {
    if (riskScore.textContent === '--') {
        alert('Please complete the assessment first.');
        return;
    }
    const date = new Date().toLocaleString();
    const lines = [
        'Autistic Burnout Risk Assessment',
        `Date: ${date}`,
        `Total Score: ${riskScore.textContent}/100`,
        `Risk Level: ${riskLevel.textContent}`,
        '',
        'Factor Breakdown:',
        `- Energy & Fatigue: ${scoreEls.energy.textContent}`,
        `- Sensory Sensitivity: ${scoreEls.sensory.textContent}`,
        `- Executive Function: ${scoreEls.executive.textContent}`,
        `- Social Demands: ${scoreEls.social.textContent}`,
        `- Emotional State: ${scoreEls.emotion.textContent}`,
        '',
        'Note: This is a self-assessment tool, not a diagnostic instrument.'
    ];
    const text = lines.join('\n');
    try {
        await navigator.clipboard.writeText(text);
        copyResultsBtn.textContent = 'Copied!';
        setTimeout(() => { copyResultsBtn.textContent = 'Copy Results'; }, 2000);
    } catch (e) {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); copyResultsBtn.textContent = 'Copied!'; }
        catch (err) { alert('Could not copy to clipboard.'); }
        document.body.removeChild(ta);
        setTimeout(() => { copyResultsBtn.textContent = 'Copy Results'; }, 2000);
    }
});

// ---------- Show recommendations ----------
recommendationsBtn.addEventListener('click', () => {
    if (answers.size !== TOTAL_QUESTIONS) {
        alert('Please complete the assessment first to see personalized recommendations.');
        return;
    }
    recommendationsCard.style.display = 'block';
    recommendationsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// ---------- History ----------
clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all assessment history? This cannot be undone.')) {
        localStorage.removeItem(STORAGE_KEY);
        renderHistory();
    }
});

exportBtn.addEventListener('click', exportData);

function exportData() {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    if (history.length === 0) {
        alert('No assessment history to export.');
        return;
    }
    let csv = 'Date,Total Score,Energy,Sensory,Executive,Social,Emotion,Questions Answered\n';
    history.forEach(a => {
        const date = new Date(a.date).toLocaleDateString();
        csv += `${date},${a.score},${a.factors.energy},${a.factors.sensory},${a.factors.executive},${a.factors.social},${a.factors.emotion},${a.answeredQuestions || TOTAL_QUESTIONS}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `burnout-assessment-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function renderHistory() {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    if (history.length === 0) {
        historyList.innerHTML = '<div class="history-empty"><p>No assessment history yet.</p><p>Complete and save an assessment to see your history here.</p></div>';
        return;
    }
    history.sort((a, b) => new Date(b.date) - new Date(a.date));
    let html = '';
    history.forEach((assessment, index) => {
        const date = new Date(assessment.date).toLocaleDateString();
        const time = new Date(assessment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        let riskClass = 'low';
        let riskLevelText = 'Low Risk';
        if (assessment.score <= 20) { riskClass = 'low'; riskLevelText = 'Low Risk'; }
        else if (assessment.score <= 40) { riskClass = 'medium'; riskLevelText = 'Moderate Risk'; }
        else if (assessment.score <= 60) { riskClass = 'high'; riskLevelText = 'High Risk'; }
        else if (assessment.score <= 80) { riskClass = 'critical'; riskLevelText = 'Severe Risk'; }
        else { riskClass = 'critical'; riskLevelText = 'Critical Risk'; }

        let trendHtml = '';
        if (index < history.length - 1) {
            const prevScore = history[index + 1].score;
            const trend = assessment.score - prevScore;
            if (trend > 5) trendHtml = '<span class="trend-indicator trend-up">↑ Increasing</span>';
            else if (trend < -5) trendHtml = '<span class="trend-indicator trend-down">↓ Improving</span>';
            else trendHtml = '<span class="trend-indicator trend-stable">→ Stable</span>';
        }

        html += `
            <div class="history-item ${riskClass}">
                <div class="history-header">
                    <div class="history-date">${date} at ${time}</div>
                    <div class="history-risk">${riskLevelText} ${trendHtml}</div>
                </div>
                <div class="history-score-total">Total Score: <strong>${assessment.score}/100</strong></div>
                <div class="progress-bar"><div class="progress-fill" style="width: ${assessment.score}%"></div></div>
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

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
    loadDraft();
    updateProgress();
    renderHistory();
    // Position indicator at 0 on first load
    riskIndicator.style.left = '0%';
});