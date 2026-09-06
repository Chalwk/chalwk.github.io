// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

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
        userName: '',
        updatedAt: null
    };

    const SUGGESTIONS = {
        early: [
            'Avoiding messages or phone calls',
            'Feeling numb or disconnected',
            'Increased use of alcohol or other substances',
            'Skin picking, hair pulling, or other repetitive habits increasing',
            'Struggling with usual routines or self-care tasks'
        ],
        mild: [
            'Use noise-cancelling headphones or earplugs',
            'Stim / use a fidget or sensory tool',
            'Have a warm drink or snack',
            'Watch or listen to something familiar and comforting',
            'Wrap up in a blanket or weighted blanket',
            'Go for a short walk'
        ],
        moderate: [
            'Move to a quiet, low-stimulation room',
            'Text (rather than call) a trusted person',
            'Use ear defenders / reduce lighting and noise',
            'Follow my sensory or meltdown/shutdown plan',
            'Cancel or postpone non-essential plans for today'
        ],
        severe: [
            'Text 1737 if calling feels like too much',
            'Have someone else make the call for me',
            'Go to a public, safe place if I can\u2019t be alone',
            'Give my phone or keys to someone I trust'
        ],
        now: [
            'Overwhelmed by noise, light, or touch',
            'Can\u2019t speak right now / non-verbal',
            'Dissociating or feeling unreal',
            'In physical pain',
            'Scared to ask for help'
        ]
    };

    const SETTINGS_KEY = 'crisis_plan_settings_v1';
    const DEFAULT_SETTINGS = { fontSize: 'normal', highContrast: false, reduceMotion: false };

    function loadSettings() {
        try {
            const stored = localStorage.getItem(SETTINGS_KEY);
            if (!stored) return Object.assign({}, DEFAULT_SETTINGS);
            return Object.assign({}, DEFAULT_SETTINGS, JSON.parse(stored));
        } catch (e) {
            return Object.assign({}, DEFAULT_SETTINGS);
        }
    }

    function saveSettings(settings) {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error('Failed to save settings:', e);
        }
    }

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
                userName: typeof parsed.userName === 'string' ? parsed.userName : '',
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
        if (typeof updateLastSavedIndicator === 'function') updateLastSavedIndicator();
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
    setupCollapsible('moreSupportToggle', document.getElementById('moreSupportContent'), 'moreSupportIcon');

    let settings = loadSettings();

    function applySettings() {
        document.body.classList.remove('text-large', 'text-xlarge');
        if (settings.fontSize === 'large') document.body.classList.add('text-large');
        if (settings.fontSize === 'xlarge') document.body.classList.add('text-xlarge');
        document.body.classList.toggle('high-contrast', !!settings.highContrast);
        document.body.classList.toggle('reduce-motion', !!settings.reduceMotion);

        document.querySelectorAll('.segmented-btn[data-font-size]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.fontSize === settings.fontSize);
        });
        const hcToggle = document.getElementById('highContrastToggle');
        const rmToggle = document.getElementById('reduceMotionToggle');
        if (hcToggle) hcToggle.checked = !!settings.highContrast;
        if (rmToggle) rmToggle.checked = !!settings.reduceMotion;
    }
    applySettings();

    const settingsBtn = document.getElementById('settingsBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    if (settingsBtn && settingsPanel) {
        settingsBtn.addEventListener('click', () => {
            const isOpen = settingsPanel.style.display === 'block';
            settingsPanel.style.display = isOpen ? 'none' : 'block';
            settingsBtn.setAttribute('aria-expanded', String(!isOpen));
        });
    }

    document.querySelectorAll('.segmented-btn[data-font-size]').forEach(btn => {
        btn.addEventListener('click', () => {
            settings.fontSize = btn.dataset.fontSize;
            saveSettings(settings);
            applySettings();
        });
    });
    const highContrastToggle = document.getElementById('highContrastToggle');
    if (highContrastToggle) {
        highContrastToggle.addEventListener('change', () => {
            settings.highContrast = highContrastToggle.checked;
            saveSettings(settings);
            applySettings();
        });
    }
    const reduceMotionToggle = document.getElementById('reduceMotionToggle');
    if (reduceMotionToggle) {
        reduceMotionToggle.addEventListener('change', () => {
            settings.reduceMotion = reduceMotionToggle.checked;
            saveSettings(settings);
            applySettings();
        });
    }

    const QUICK_CALL_KEY = 'crisis_plan_quickcall_collapsed';
    const quickCallBar = document.getElementById('quickCallBar');
    const quickCallToggle = document.getElementById('quickCallToggle');
    if (quickCallBar && quickCallToggle) {
        const collapsed = localStorage.getItem(QUICK_CALL_KEY) === '1';
        quickCallBar.classList.toggle('collapsed', collapsed);
        quickCallToggle.addEventListener('click', () => {
            const nowCollapsed = !quickCallBar.classList.contains('collapsed');
            quickCallBar.classList.toggle('collapsed', nowCollapsed);
            localStorage.setItem(QUICK_CALL_KEY, nowCollapsed ? '1' : '0');
        });
    }

    const lastSavedEl = document.getElementById('lastSavedIndicator');
    function updateLastSavedIndicator() {
        if (!lastSavedEl) return;
        if (!plan.updatedAt) {
            lastSavedEl.textContent = '';
            return;
        }
        const d = new Date(plan.updatedAt);
        lastSavedEl.textContent = `Saved ${d.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })}`;
    }

    function renderSuggestions(levelId) {
        const wrap = document.getElementById(`level-${levelId}-suggestions`);
        if (!wrap) return;
        const list = SUGGESTIONS[levelId] || [];
        const existingText = new Set(plan.levels[levelId].map(i => i.text.trim().toLowerCase()));
        wrap.innerHTML = '';
        const remaining = list.filter(s => !existingText.has(s.trim().toLowerCase()));
        if (!remaining.length) return;

        const label = document.createElement('span');
        label.className = 'suggestion-label';
        label.textContent = 'Quick add:';
        wrap.appendChild(label);

        remaining.forEach(s => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'suggestion-chip';
            chip.textContent = s;
            chip.addEventListener('click', () => {
                plan.levels[levelId].push({ id: newItemId(), text: s, checked: true });
                savePlan();
                renderLevel(levelId);
                renderSuggestions(levelId);
            });
            wrap.appendChild(chip);
        });
    }

    function renderAllSuggestions() {
        RENDERABLE_LEVELS.forEach(lvl => renderSuggestions(lvl.id));
    }

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
                renderSuggestions(levelId);
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
            renderSuggestions(levelId);
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
        renderSuggestions(levelId);
    }

    const userNameEl = document.getElementById('userNameInput');
    const originalPageTitle = document.title;

    function updatePageTitle() {
        const name = (plan.userName || '').trim();
        if (!name) {
            document.title = originalPageTitle;
            return;
        }
        if (/Jericho Crosby \(Chalwk\)/i.test(originalPageTitle)) {
            document.title = originalPageTitle.replace(/Jericho Crosby \(Chalwk\)/i, name);
        } else {
            document.title = `${originalPageTitle} - ${name}`;
        }
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
        if (userNameEl) userNameEl.value = plan.userName || '';
        updatePageTitle();
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

    if (userNameEl) {
        userNameEl.addEventListener('input', () => {
            plan.userName = userNameEl.value;
            updatePageTitle();
            debouncedSave();
        });
    }

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
            renderAllSuggestions();
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
            renderSuggestions('now');
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
                    renderAllSuggestions();
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

        const nameSuffix = (plan.userName || '').trim() ? `: ${escapeHtml(plan.userName.trim())}` : '';
        html += `<div class="summary-section"><strong>CRISIS HANDOVER SUMMARY${nameSuffix}</strong><br>`;
        html += `Generated: ${now.toLocaleString('en-NZ')}</div>`;
        html += `<hr class="summary-divider">`;

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

        const nameSuffix = (plan.userName || '').trim() ? `: ${escapeHtml(plan.userName.trim())}` : '';
        html += `<div class="summary-section"><strong>MY CRISIS PLAN${nameSuffix}</strong><br>`;
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
        'What\'s Up (kids & teens): 0800 942 8787',
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

    const groundingBtn = document.getElementById('groundingBtn');
    const groundingModal = document.getElementById('groundingModal');
    const closeGroundingModal = document.getElementById('closeGroundingModal');
    const breathingCircle = document.getElementById('breathingCircle');
    const breathingWord = document.getElementById('breathingWord');
    const breathingToggleBtn = document.getElementById('breathingToggleBtn');
    let breathingTimer = null;
    let breathingRunning = false;

    function stopBreathing() {
        breathingRunning = false;
        clearInterval(breathingTimer);
        breathingTimer = null;
        breathingCircle.classList.remove('inhale', 'exhale');
        breathingWord.textContent = 'start';
        breathingToggleBtn.innerHTML = '<i class="fas fa-play"></i> start';
    }

    function startBreathing() {
        breathingRunning = true;
        breathingToggleBtn.innerHTML = '<i class="fas fa-pause"></i> stop';
        const cycle = [
            { word: 'breathe in', ms: 4000, cls: 'inhale' },
            { word: 'hold', ms: 2000, cls: 'inhale' },
            { word: 'breathe out', ms: 5000, cls: 'exhale' }
        ];
        let step = 0;
        function runStep() {
            if (!breathingRunning) return;
            const s = cycle[step % cycle.length];
            breathingWord.textContent = s.word;
            breathingCircle.classList.remove('inhale', 'exhale');
            if (!settings.reduceMotion) breathingCircle.classList.add(s.cls);
            step += 1;
            breathingTimer = setTimeout(runStep, s.ms);
        }
        runStep();
    }

    if (breathingToggleBtn) {
        breathingToggleBtn.addEventListener('click', () => {
            if (breathingRunning) stopBreathing();
            else startBreathing();
        });
    }

    if (groundingBtn && groundingModal) {
        groundingBtn.addEventListener('click', () => {
            groundingModal.style.display = 'flex';
        });
    }
    if (closeGroundingModal) {
        closeGroundingModal.addEventListener('click', () => {
            stopBreathing();
            groundingModal.style.display = 'none';
        });
    }
    window.addEventListener('click', (e) => {
        if (e.target === groundingModal) {
            stopBreathing();
            groundingModal.style.display = 'none';
        }
    });

    const printBtn = document.getElementById('printBtn');
    const printArea = document.getElementById('printArea');
    if (printBtn && printArea) {
        printBtn.addEventListener('click', () => {
            updatePageTitle();
            const now = new Date();
            const name = (plan.userName || '').trim();
            const heading = name ? `My Crisis Plan - ${escapeHtml(name)}` : 'My Crisis Plan';
            let html = `<h1>${heading}</h1><p>Printed: ${escapeHtml(now.toLocaleString('en-NZ'))}</p><hr>`;

            LEVELS.forEach(lvl => {
                html += `<h2>${escapeHtml(lvl.label)}</h2>`;
                const items = plan.levels[lvl.id];
                if (items.length) {
                    html += '<ul>' + items.map(i => `<li>${escapeHtml(i.text)}</li>`).join('') + '</ul>';
                } else {
                    html += '<p><em>No steps added yet.</em></p>';
                }
            });

            html += '<h2>Safety information</h2>';
            html += `<p><strong>Emergency &amp; crisis contacts:</strong><br>${escapeHtml(plan.safety.emergencyContacts) || 'not specified'}</p>`;
            html += `<p><strong>GP / therapist / support worker:</strong><br>${escapeHtml(plan.safety.professionalContacts) || 'not specified'}</p>`;
            html += `<p><strong>Diagnoses, medications, allergies:</strong><br>${escapeHtml(plan.safety.medicalInfo) || 'not specified'}</p>`;
            html += `<p><strong>Means restriction in place:</strong><br>${escapeHtml(plan.safety.meansRestriction) || 'not specified'}</p>`;
            html += `<p><strong>Reasons to keep going:</strong><br>${escapeHtml(plan.safety.reasonsForLiving) || 'not specified'}</p>`;

            printArea.innerHTML = html;
            window.print();
        });
    }

    renderAllLevels();
    renderAllSuggestions();
    loadTextFields();
    updateLastSavedIndicator();
})();