(function () {
    const STORAGE_KEY = 'crisis_plan_v1';

    const LEVELS = [
        { id: 'early', label: 'Early warning signs' },
        { id: 'mild', label: 'Mild distress' },
        { id: 'moderate', label: 'Moderate crisis' },
        { id: 'severe', label: 'Severe emergency' }
    ];

    const NOW_ID = 'now';
    const RENDERABLE_LEVELS = LEVELS.concat([{ id: NOW_ID, label: "What's happening right now" }]);

    const DEFAULT_PLAN = {
        levels: {
            early: [
                'Sleep pattern is changing (too much or too little)',
                'Pulling away from people or messages',
                'Skipping meals or basic self-care',
                'Thoughts feel racing or stuck in a loop',
                'More irritable, or shutting down more than usual',
                'Losing interest in usual hobbies'
            ],
            mild: [
                'Use a grounding technique (e.g. 5-4-3-2-1 senses)',
                'Step outside or change environment',
                'Message a trusted friend or support person',
                'Do a low-demand comfort activity (gaming, music, etc.)',
                'Slow, deep breathing for a few minutes',
                'Write down what\u2019s going on'
            ],
            moderate: [
                'Contact my counsellor or support worker (CSW)',
                'Use my crisis coping card / distraction kit',
                'Remove myself from an overstimulating environment',
                'Call a trusted person and ask them to stay on the phone',
                'Use PRN medication if prescribed',
                'Go to a pre-agreed safe space'
            ],
            severe: [
                'Call Crisis Resolution',
                'Call 111 or go to the nearest ED',
                'Ask someone to stay with me, or come get me',
                'Remove access to means of harm, or ask someone to hold them',
                'Tell someone exactly what is happening right now'
            ],
            now: [
                'Having thoughts of suicide or self-harm',
                'Feeling unsafe right now',
                'Alone - no one else here with me',
                'Having a meltdown or shutdown',
                'Haven\u2019t eaten, slept, or taken meds today',
                'Just need someone to listen, not fix it'
            ]
        },
        triggers: '',
        whatHappened: '',
        needsNow: '',
        safety: {
            emergencyContacts: '',
            professionalContacts: '',
            medicalInfo: '',
            meansRestriction: '',
            reasonsForLiving: ''
        },
        updatedAt: null
    };

    function loadPlan() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return structuredCloneSafe(DEFAULT_PLAN);
            const parsed = JSON.parse(stored);
            return {
                levels: {
                    early: Array.isArray(parsed.levels && parsed.levels.early) ? parsed.levels.early : structuredCloneSafe(DEFAULT_PLAN.levels.early),
                    mild: Array.isArray(parsed.levels && parsed.levels.mild) ? parsed.levels.mild : structuredCloneSafe(DEFAULT_PLAN.levels.mild),
                    moderate: Array.isArray(parsed.levels && parsed.levels.moderate) ? parsed.levels.moderate : structuredCloneSafe(DEFAULT_PLAN.levels.moderate),
                    severe: Array.isArray(parsed.levels && parsed.levels.severe) ? parsed.levels.severe : structuredCloneSafe(DEFAULT_PLAN.levels.severe),
                    now: Array.isArray(parsed.levels && parsed.levels.now) ? parsed.levels.now : structuredCloneSafe(DEFAULT_PLAN.levels.now)
                },
                triggers: parsed.triggers || '',
                whatHappened: parsed.whatHappened || '',
                needsNow: parsed.needsNow || '',
                safety: Object.assign({}, DEFAULT_PLAN.safety, parsed.safety || {}),
                updatedAt: parsed.updatedAt || null
            };
        } catch (e) {
            console.error('Failed to load plan:', e);
            alert('Could not read your plan from storage. Storage may be full or corrupted.');
            return structuredCloneSafe(DEFAULT_PLAN);
        }
    }

    function structuredCloneSafe(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    function savePlan() {
        plan.updatedAt = new Date().toISOString();
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
        } catch (e) {
            console.error('Failed to save plan:', e);
            alert('Could not save your plan. Storage may be full or disabled.');
            return;
        }
    }

    let plan = loadPlan();
    let nextIdCounter = 0;

    function newItemId() {
        nextIdCounter += 1;
        return 'item-' + Date.now() + '-' + nextIdCounter;
    }

    function normalizeLevels() {
        RENDERABLE_LEVELS.forEach(lvl => {
            plan.levels[lvl.id] = plan.levels[lvl.id].map(item => {
                if (typeof item === 'string') {
                    return { id: newItemId(), text: item, checked: false };
                }
                return item;
            });
        });
    }
    normalizeLevels();

    const toast = document.getElementById('toast');

    function showToast(message = 'Plan saved') {
        toast.textContent = `\u2713 ${message}`;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }

    function setupCollapsible(toggleId, contentEl, iconId) {
        const toggle = document.getElementById(toggleId);
        const icon = document.getElementById(iconId);
        const header = icon.closest('.collapse-header');

        header.addEventListener('click', (e) => {
            if (e.target.closest('.add-item-row') || e.target.tagName === 'INPUT') return;
            toggle.checked = !toggle.checked;
            toggle.dispatchEvent(new Event('change'));
        });

        toggle.addEventListener('change', () => {
            if (toggle.checked) {
                contentEl.style.display = 'block';
                icon.className = icon.className.replace('fa-chevron-right', 'fa-chevron-down');
            } else {
                contentEl.style.display = 'none';
                icon.className = icon.className.replace('fa-chevron-down', 'fa-chevron-right');
            }
        });
    }

    LEVELS.forEach(lvl => {
        setupCollapsible(`level-${lvl.id}-toggle`, document.getElementById(`level-${lvl.id}-content`), `level-${lvl.id}-icon`);
    });
    setupCollapsible('safetyToggle', document.getElementById('safetyFields'), 'safetyIcon');
    setupCollapsible('currentStateToggle', document.getElementById('currentStateContent'), 'currentStateIcon');

    function renderLevel(levelId) {
        const container = document.getElementById(`level-${levelId}-items`);
        const items = plan.levels[levelId];
        container.innerHTML = '';

        if (!items.length) {
            const empty = document.createElement('div');
            empty.className = 'empty-message';
            empty.textContent = 'no steps yet \u2014 add one below.';
            container.appendChild(empty);
        }

        items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'plan-item' + (item.checked ? ' checked' : '');
            row.dataset.id = item.id;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'plan-item-checkbox';
            checkbox.checked = !!item.checked;
            checkbox.addEventListener('change', () => {
                item.checked = checkbox.checked;
                row.classList.toggle('checked', item.checked);
                savePlan();
            });

            const text = document.createElement('span');
            text.className = 'plan-item-text';
            text.textContent = item.text;

            const actions = document.createElement('div');
            actions.className = 'plan-item-actions';

            const editBtn = document.createElement('button');
            editBtn.type = 'button';
            editBtn.className = 'edit-item-btn';
            editBtn.title = 'Edit';
            editBtn.innerHTML = '<i class="fas fa-pencil"></i>';
            editBtn.addEventListener('click', () => beginEdit(levelId, item, row, text));

            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'delete-item-btn';
            deleteBtn.title = 'Remove';
            deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
            deleteBtn.addEventListener('click', () => {
                plan.levels[levelId] = plan.levels[levelId].filter(i => i.id !== item.id);
                savePlan();
                renderLevel(levelId);
            });

            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);

            row.appendChild(checkbox);
            row.appendChild(text);
            row.appendChild(actions);
            container.appendChild(row);
        });

        updateLevelCount(levelId);
    }

    function beginEdit(levelId, item, row, textEl) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'plan-item-edit-input';
        input.value = item.text;
        row.replaceChild(input, textEl);
        input.focus();
        input.select();

        const commit = () => {
            const val = input.value.trim();
            if (val) item.text = val;
            savePlan();
            renderLevel(levelId);
        };

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') renderLevel(levelId);
        });
        input.addEventListener('blur', commit);
    }

    function updateLevelCount(levelId) {
        const items = plan.levels[levelId];
        const checked = items.filter(i => i.checked).length;
        const countEl = document.getElementById(`level-${levelId}-count`);
        countEl.textContent = items.length ? `${checked}/${items.length}` : '';
    }

    function renderAllLevels() {
        RENDERABLE_LEVELS.forEach(lvl => renderLevel(lvl.id));
    }

    document.querySelectorAll('.add-item-btn').forEach(btn => {
        btn.addEventListener('click', () => addItemFromInput(btn.dataset.level));
    });
    document.querySelectorAll('.add-item-input').forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addItemFromInput(input.dataset.level);
            }
        });
    });

    function addItemFromInput(levelId) {
        const input = document.querySelector(`.add-item-input[data-level="${levelId}"]`);
        const val = input.value.trim();
        if (!val) return;
        plan.levels[levelId].push({ id: newItemId(), text: val, checked: false });
        input.value = '';
        savePlan();
        renderLevel(levelId);
    }

    const triggersEl = document.getElementById('currentTriggers');
    const whatHappenedEl = document.getElementById('whatHappened');
    const needsNowEl = document.getElementById('needsNow');
    const emergencyContactsEl = document.getElementById('emergencyContacts');
    const professionalContactsEl = document.getElementById('professionalContacts');
    const medicalInfoEl = document.getElementById('medicalInfo');
    const meansRestrictionEl = document.getElementById('meansRestriction');
    const reasonsForLivingEl = document.getElementById('reasonsForLiving');

    function loadTextFields() {
        triggersEl.value = plan.triggers || '';
        whatHappenedEl.value = plan.whatHappened || '';
        needsNowEl.value = plan.needsNow || '';
        emergencyContactsEl.value = plan.safety.emergencyContacts || '';
        professionalContactsEl.value = plan.safety.professionalContacts || '';
        medicalInfoEl.value = plan.safety.medicalInfo || '';
        meansRestrictionEl.value = plan.safety.meansRestriction || '';
        reasonsForLivingEl.value = plan.safety.reasonsForLiving || '';
    }

    let saveTimeout = null;
    function debouncedSave() {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(savePlan, 400);
    }

    [
        [triggersEl, 'triggers'],
        [whatHappenedEl, 'whatHappened'],
        [needsNowEl, 'needsNow']
    ].forEach(([el, key]) => {
        el.addEventListener('input', () => {
            plan[key] = el.value;
            debouncedSave();
        });
    });

    [
        [emergencyContactsEl, 'emergencyContacts'],
        [professionalContactsEl, 'professionalContacts'],
        [medicalInfoEl, 'medicalInfo'],
        [meansRestrictionEl, 'meansRestriction'],
        [reasonsForLivingEl, 'reasonsForLiving']
    ].forEach(([el, key]) => {
        el.addEventListener('input', () => {
            plan.safety[key] = el.value;
            debouncedSave();
        });
    });

    document.getElementById('resetPlanBtn').addEventListener('click', () => {
        if (confirm('Reset the whole plan back to the suggested defaults? Your custom items, notes, and contacts will be lost. This cannot be undone.')) {
            plan = structuredCloneSafe(DEFAULT_PLAN);
            normalizeLevels();
            savePlan();
            renderAllLevels();
            loadTextFields();
            showToast('Plan reset to defaults');
        }
    });

    document.getElementById('resetCurrentStateBtn').addEventListener('click', () => {
        if (confirm('Reset only the "What\'s happening right now" section? This will uncheck all items and clear the trigger, situation, and needs notes.')) {
            plan.levels.now.forEach(item => {
                item.checked = false;
            });
            plan.triggers = '';
            plan.whatHappened = '';
            plan.needsNow = '';
            loadTextFields();
            savePlan();
            renderLevel('now');
            showToast('Current state reset');
        }
    });

    document.getElementById('exportBtn').addEventListener('click', () => {
        const dataStr = JSON.stringify(plan, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `crisis-plan-${getTodayDate()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });

    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });

    document.getElementById('importFile').addEventListener('change', (e) => {
        if (!e.target.files.length) return;
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const result = ev.target.result;
                if (typeof result !== 'string') {
                    alert('Failed to import: unexpected data format.');
                    return;
                }
                const imported = JSON.parse(result);
                if (!imported || typeof imported !== 'object' || !imported.levels) {
                    alert('Failed to import: this doesn\u2019t look like a crisis plan file.');
                    return;
                }
                if (confirm('This will replace your current plan. Continue?')) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(imported));
                    plan = loadPlan();
                    normalizeLevels();
                    savePlan();
                    renderAllLevels();
                    loadTextFields();
                    showToast('Plan imported');
                }
            } catch (err) {
                alert('Failed to import: invalid JSON file.');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    });

    function getTodayDate() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    const summaryBtn = document.getElementById('summaryBtn');
    const summaryModal = document.getElementById('summaryModal');
    const closeModal = document.querySelector('.close-modal');
    const summaryOutput = document.getElementById('summaryOutput');
    const copySummaryBtn = document.getElementById('copySummaryBtn');
    const downloadSummaryBtn = document.getElementById('downloadSummaryBtn');

    function levelLabel(id) {
        const found = LEVELS.find(l => l.id === id);
        return found ? found.label : id;
    }

    function highestLevelReached() {
        for (let i = LEVELS.length - 1; i >= 0; i--) {
            const hasChecked = plan.levels[LEVELS[i].id].some(item => item.checked);
            if (hasChecked) return LEVELS[i].label;
        }
        return 'Not specified';
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function buildSummaryHTML() {
        const now = new Date();
        let html = '';

        html += `<div class="summary-section"><strong>CRISIS HANDOVER SUMMARY</strong><br>`;
        html += `Generated: ${now.toLocaleString('en-NZ')}</div>`;
        html += `<hr class="summary-divider">`;

        html += `<div class="summary-section"><strong>HIGHEST ESCALATION LEVEL REACHED</strong><br>`;
        html += `${escapeHtml(highestLevelReached())}</div>`;

        html += `<div class="summary-section"><strong>WHAT IS HAPPENING NOW</strong><br>`;
        const checkedNow = plan.levels[NOW_ID].filter(i => i.checked);
        if (checkedNow.length) {
            html += `<ul class="summary-list">`;
            checkedNow.forEach(i => { html += `<li>${escapeHtml(i.text)}</li>`; });
            html += `</ul>`;
        } else {
            html += `<span class="summary-empty">(nothing ticked on the "what's happening right now" checklist)</span>`;
        }
        html += `Trigger(s): ${escapeHtml(plan.triggers) || 'not specified'}<br>`;
        html += `What happened: ${escapeHtml(plan.whatHappened) || 'not specified'}</div>`;

        html += `<div class="summary-section"><strong>WHAT I HAVE ALREADY DONE TO HELP MYSELF</strong><br>`;
        let anyChecked = false;
        LEVELS.forEach(lvl => {
            const checkedItems = plan.levels[lvl.id].filter(i => i.checked);
            if (checkedItems.length) {
                anyChecked = true;
                html += `<span class="summary-level">${escapeHtml(lvl.label)}:</span>`;
                html += `<ul class="summary-list">`;
                checkedItems.forEach(i => { html += `<li>${escapeHtml(i.text)}</li>`; });
                html += `</ul>`;
            }
        });
        if (!anyChecked) html += `<span class="summary-empty">(nothing ticked off yet)</span>`;
        html += `</div>`;

        html += `<div class="summary-section"><strong>WHAT I NEED FROM YOU</strong><br>`;
        html += `${escapeHtml(plan.needsNow) || 'not specified'}</div>`;

        html += `<div class="summary-section"><strong>SAFETY INFORMATION</strong><br>`;
        html += `<strong>Emergency & crisis contacts:</strong><br>`;
        html += `<div class="summary-text">${escapeHtml(plan.safety.emergencyContacts) || 'not specified'}</div>`;
        html += `<strong>GP / therapist / support worker:</strong><br>`;
        html += `<div class="summary-text">${escapeHtml(plan.safety.professionalContacts) || 'not specified'}</div>`;
        html += `<strong>Diagnoses, medications, allergies:</strong><br>`;
        html += `<div class="summary-text">${escapeHtml(plan.safety.medicalInfo) || 'not specified'}</div>`;
        html += `<strong>Means restriction in place:</strong><br>`;
        html += `<div class="summary-text">${escapeHtml(plan.safety.meansRestriction) || 'not specified'}</div>`;
        html += `<strong>Reasons to keep going:</strong><br>`;
        html += `<div class="summary-text">${escapeHtml(plan.safety.reasonsForLiving) || 'not specified'}</div>`;
        html += `</div>`;

        return html;
    }

    function buildPlanViewHTML() {
        const now = new Date();
        let html = '';

        html += `<div class="summary-section"><strong>MY CRISIS PLAN</strong><br>`;
        html += `Generated: ${now.toLocaleString('en-NZ')}</div>`;
        html += `<hr class="summary-divider">`;

        html += `<div class="summary-section"><strong>COMPLETED STEPS (by level)</strong><br>`;
        let anyCompleted = false;
        LEVELS.forEach(lvl => {
            const checkedItems = plan.levels[lvl.id].filter(i => i.checked);
            if (checkedItems.length) {
                anyCompleted = true;
                html += `<span class="summary-level">${escapeHtml(lvl.label)}:</span>`;
                html += `<ul class="summary-list">`;
                checkedItems.forEach(i => { html += `<li>${escapeHtml(i.text)}</li>`; });
                html += `</ul>`;
            }
        });
        if (!anyCompleted) {
            html += `<span class="summary-empty">No steps completed yet.</span>`;
        }
        html += `</div>`;

        html += `<div class="summary-section"><strong>SAFETY INFORMATION</strong><br>`;
        html += `<strong>Emergency & crisis contacts:</strong><br>`;
        html += `<div class="summary-text">${escapeHtml(plan.safety.emergencyContacts) || 'not specified'}</div>`;
        html += `<strong>GP / therapist / support worker:</strong><br>`;
        html += `<div class="summary-text">${escapeHtml(plan.safety.professionalContacts) || 'not specified'}</div>`;
        html += `<strong>Diagnoses, medications, allergies:</strong><br>`;
        html += `<div class="summary-text">${escapeHtml(plan.safety.medicalInfo) || 'not specified'}</div>`;
        html += `<strong>Means restriction in place:</strong><br>`;
        html += `<div class="summary-text">${escapeHtml(plan.safety.meansRestriction) || 'not specified'}</div>`;
        html += `<strong>Reasons to keep going:</strong><br>`;
        html += `<div class="summary-text">${escapeHtml(plan.safety.reasonsForLiving) || 'not specified'}</div>`;
        html += `</div>`;

        html += `<div class="summary-section"><strong>NEW ZEALAND CRISIS RESOURCES</strong><br>`;
        NZ_RESOURCES_TEXT.forEach(line => {
            html += `<div>• ${escapeHtml(line)}</div>`;
        });
        html += `</div>`;

        return html;
    }

    const NZ_RESOURCES_TEXT = [
        'Emergency Services: Call 111 if you are in immediate danger.',
        'Need to Talk?: Call or text 1737 - free, 24/7 counselling.',
        'Suicide Crisis Helpline: 0508 828 865 (0508 TAUTOKO) - 24/7.',
        'Lifeline (NZ): 0800 543 354 or text 4357 - 24/7 support.',
        'Healthline: 0800 611 116 - health advice & triage (24/7).',
        'Crisis Resolution - Christchurch: 0800 920 092',
        'Crisis Resolution - Auckland: 0800 800 717',
        'Crisis Resolution - Wellington/Porirua/Hutt Valley: 0800 745 477',
        'Crisis Resolution - Waikato: 0800 50 50 50',
        'Crisis Resolution - Otago: 0800 467 846 (press 2)',
        'Crisis Resolution - Southland: 0800 467 846 (press 1)',
        'What’s Up (kids & teens): 0800 942 8787',
        'Youthline: 0800 376 633 or text 234'
    ];

    const modalTitleEl = document.getElementById('modalTitle');
    const modalHintEl = document.getElementById('modalHint');
    let currentDownloadPrefix = 'crisis-summary';

    function openModal(title, hint, htmlContent, downloadPrefix) {
        modalTitleEl.textContent = title;
        modalHintEl.textContent = hint;
        summaryOutput.innerHTML = htmlContent;
        currentDownloadPrefix = downloadPrefix;
        summaryModal.style.display = 'flex';
    }

    summaryBtn.addEventListener('click', () => {
        openModal(
            'Crisis Handover Summary',
            'A clean summary you can show to a crisis team, support worker, or emergency mental health service.',
            buildSummaryHTML(),
            'crisis-summary'
        );
    });

    function handleViewPlan() {
        openModal(
            'Your Crisis Plan',
            'Completed steps and safety information - for a quick look or to show someone.',
            buildPlanViewHTML(),
            'crisis-plan'
        );
    }

    const viewPlanBtn = document.getElementById('viewPlanBtn2');
    if (viewPlanBtn) viewPlanBtn.addEventListener('click', handleViewPlan);

    closeModal.addEventListener('click', () => {
        summaryModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === summaryModal) summaryModal.style.display = 'none';
    });

    copySummaryBtn.addEventListener('click', () => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = summaryOutput.innerHTML;
        const text = tempDiv.textContent;
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            showToast('Summary copied');
        }).catch(() => {
            alert('Could not copy text.');
        });
    });

    downloadSummaryBtn.addEventListener('click', () => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = summaryOutput.innerHTML;
        const text = tempDiv.textContent;
        if (!text) return;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentDownloadPrefix}-${getTodayDate()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    });

    renderAllLevels();
    loadTextFields();
})();