// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

(function () {
    'use strict';

    const STORAGE_KEY = 'crisis_plan_v1'; // kept for backward compat
    const SETTINGS_KEY = 'crisis_plan_settings_v1';
    const QUICK_CALL_KEY = 'crisis_plan_quickcall_collapsed';
    const MOOD_KEY = 'crisis_plan_moods_v1';
    const RESOURCES_OPEN_KEY = 'crisis_plan_resources_open';
    const MAX_UNDO_HISTORY = 20;

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
        contacts: [], // [{ id, name, phone, relationship }]
        safety: {
            emergencyContacts: '', // legacy textarea fallback
            professionalContacts: '',
            medicalInfo: '',
            meansRestriction: '',
            reasonsForLiving: ''
        },
        userName: '',
        updatedAt: null,
        schemaVersion: 2
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

    const DEFAULT_SETTINGS = {
        fontSize: 'normal',
        highContrast: false,
        reduceMotion: false,
        darkMode: false
    };

    // ---------- Utility ----------
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

    function escapeHtml(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function getTodayDate() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // ---------- Settings ----------
    function loadSettings() {
        try {
            const stored = localStorage.getItem(SETTINGS_KEY);
            if (!stored) return Object.assign({}, DEFAULT_SETTINGS);
            return Object.assign({}, DEFAULT_SETTINGS, JSON.parse(stored));
        } catch (e) {
            return Object.assign({}, DEFAULT_SETTINGS);
        }
    }
    function saveSettings() {
        try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
        catch (e) { console.error('Failed to save settings:', e); }
    }

    // ---------- Plan load/save ----------
    function loadPlan() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return clone(DEFAULT_PLAN);
            const parsed = JSON.parse(stored);
            const safe = (arr, fallback) => Array.isArray(arr) ? arr : clone(fallback);
            return {
                levels: {
                    early: safe(parsed.levels && parsed.levels.early, DEFAULT_PLAN.levels.early),
                    mild: safe(parsed.levels && parsed.levels.mild, DEFAULT_PLAN.levels.mild),
                    moderate: safe(parsed.levels && parsed.levels.moderate, DEFAULT_PLAN.levels.moderate),
                    severe: safe(parsed.levels && parsed.levels.severe, DEFAULT_PLAN.levels.severe),
                    now: safe(parsed.levels && parsed.levels.now, DEFAULT_PLAN.levels.now)
                },
                triggers: parsed.triggers || '',
                whatHappened: parsed.whatHappened || '',
                needsNow: parsed.needsNow || '',
                contacts: Array.isArray(parsed.contacts) ? parsed.contacts.map(c => ({
                    id: c.id || newItemId(),
                    name: String(c.name || ''),
                    phone: String(c.phone || ''),
                    relationship: String(c.relationship || '')
                })) : [],
                safety: Object.assign({}, DEFAULT_PLAN.safety, parsed.safety || {}),
                userName: typeof parsed.userName === 'string' ? parsed.userName : '',
                updatedAt: parsed.updatedAt || null,
                schemaVersion: 2
            };
        } catch (e) {
            console.error('Failed to load plan:', e);
            alert('Could not read your plan from storage. Storage may be full or corrupted.');
            return clone(DEFAULT_PLAN);
        }
    }

    function savePlan() {
        plan.updatedAt = new Date().toISOString();
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
        } catch (e) {
            console.error('Failed to save plan:', e);
            showToast('Could not save - storage full or disabled', true);
            return;
        }
        updateLastSavedIndicator();
    }

    let plan = loadPlan();
    let nextIdCounter = 0;
    function newItemId() {
        nextIdCounter += 1;
        return 'item-' + Date.now() + '-' + nextIdCounter;
    }

    function normalizeLevels() {
        RENDERABLE_LEVELS.forEach(lvl => {
            plan.levels[lvl.id] = (plan.levels[lvl.id] || []).map(item => {
                if (typeof item === 'string') return { id: newItemId(), text: item, checked: false };
                if (!item.id) item.id = newItemId();
                if (typeof item.checked !== 'boolean') item.checked = false;
                if (typeof item.text !== 'string') item.text = String(item.text || '');
                return item;
            });
        });
    }
    normalizeLevels();

    // ---------- Toast ----------
    const toastEl = $('#toast');
    let toastTimer = null;
    function showToast(message = 'Plan saved', isError = false) {
        if (!toastEl) return;
        toastEl.textContent = (isError ? '\u26A0 ' : '\u2713 ') + message;
        toastEl.classList.toggle('toast-error', !!isError);
        toastEl.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
    }

    // ---------- Undo system ----------
    const undoToast = $('#undoToast');
    const undoToastMessage = $('#undoToastMessage');
    const undoToastBtn = $('#undoToastBtn');
    let undoStack = [];
    let undoTimer = null;

    function pushUndo(label, restoreFn) {
        undoStack.push({ label, restoreFn, timestamp: Date.now() });
        if (undoStack.length > MAX_UNDO_HISTORY) undoStack.shift();
        showUndoToast(label);
    }

    function showUndoToast(label) {
        if (!undoToast) return;
        undoToastMessage.textContent = label;
        undoToast.classList.add('show');
        clearTimeout(undoTimer);
        undoTimer = setTimeout(() => {
            undoToast.classList.remove('show');
            undoStack = [];
        }, 6000);
    }

    if (undoToastBtn) {
        undoToastBtn.addEventListener('click', () => {
            const entry = undoStack.pop();
            if (!entry) return;
            try {
                entry.restoreFn();
                savePlan();
                renderAllLevels();
                renderAllSuggestions();
                renderContacts();
                renderEmergencyPanel();
                showToast('Restored');
            } catch (e) {
                console.error(e);
                showToast('Could not undo', true);
            }
            undoToast.classList.remove('show');
        });
    }

    // ---------- Collapsibles ----------
    function setupCollapsible(toggleId, contentEl, iconId, opts = {}) {
        if (!contentEl) return;
        const toggle = document.getElementById(toggleId);
        const icon = document.getElementById(iconId);
        const header = contentEl.previousElementSibling;
        if (!toggle || !icon || !header) return;

        const setOpen = (open, silent) => {
            toggle.checked = open;
            contentEl.style.display = open ? 'block' : 'none';
            icon.classList.toggle('fa-chevron-right', !open);
            icon.classList.toggle('fa-chevron-down', open);
            header.setAttribute('aria-expanded', String(open));
            const hint = header.querySelector('.collapse-hint');
            if (hint) hint.textContent = open ? 'tap to collapse' : 'tap to expand';
            if (!silent && opts.onChange) opts.onChange(open);
        };

        header.addEventListener('click', (e) => {
            if (e.target.closest('.add-item-row') || e.target.tagName === 'INPUT') return;
            if (e.target.closest('a')) return;
            setOpen(!toggle.checked);
        });
        header.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setOpen(!toggle.checked);
            }
        });
        if (opts.startOpen) setOpen(true, true);
    }

    LEVELS.forEach(lvl => {
        setupCollapsible(
            `level-${lvl.id}-toggle`,
            document.getElementById(`level-${lvl.id}-content`),
            `level-${lvl.id}-icon`
        );
    });
    setupCollapsible('safetyToggle', document.getElementById('safetyFields'), 'safetyIcon');
    setupCollapsible('currentStateToggle', document.getElementById('currentStateContent'), 'currentStateIcon');

    // Resources collapsed by default (persisted)
    setupCollapsible(
        'resourcesToggle',
        document.getElementById('resourcesContent'),
        'resourcesIcon',
        {
            startOpen: localStorage.getItem(RESOURCES_OPEN_KEY) === '1',
            onChange: (open) => localStorage.setItem(RESOURCES_OPEN_KEY, open ? '1' : '0')
        }
    );

    // ---------- Tabs (combined resources) ----------
    const tabButtons = $$('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => activateTab(btn.dataset.tab));
        btn.addEventListener('keydown', (e) => {
            const idx = tabButtons.indexOf(btn);
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const dir = e.key === 'ArrowRight' ? 1 : -1;
                const next = tabButtons[(idx + dir + tabButtons.length) % tabButtons.length];
                next.focus();
                activateTab(next.dataset.tab);
            }
        });
    });
    function activateTab(name) {
        tabButtons.forEach(b => {
            const active = b.dataset.tab === name;
            b.classList.toggle('active', active);
            b.setAttribute('aria-selected', String(active));
            b.tabIndex = active ? 0 : -1;
        });
        $$('.tab-panel').forEach(p => {
            const isActive = p.id === `panel-${name}`;
            p.classList.toggle('active', isActive);
            p.hidden = !isActive;
        });
    }

    // ---------- Settings UI ----------
    let settings = loadSettings();

    function applySettings() {
        document.body.classList.remove('text-large', 'text-xlarge');
        if (settings.fontSize === 'large') document.body.classList.add('text-large');
        if (settings.fontSize === 'xlarge') document.body.classList.add('text-xlarge');
        document.body.classList.toggle('high-contrast', !!settings.highContrast);
        document.body.classList.toggle('reduce-motion', !!settings.reduceMotion);
        document.body.classList.toggle('dark-mode', !!settings.darkMode);

        $$('.segmented-btn[data-font-size]').forEach(btn => {
            const active = btn.dataset.fontSize === settings.fontSize;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-pressed', String(active));
        });
        const hc = $('#highContrastToggle');
        const rm = $('#reduceMotionToggle');
        const dm = $('#darkModeToggle');
        if (hc) hc.checked = !!settings.highContrast;
        if (rm) rm.checked = !!settings.reduceMotion;
        if (dm) dm.checked = !!settings.darkMode;
    }
    applySettings();

    const settingsBtn = $('#settingsBtn');
    const settingsPanel = $('#settingsPanel');
    if (settingsBtn && settingsPanel) {
        settingsBtn.addEventListener('click', () => {
            const isOpen = settingsPanel.style.display === 'block';
            settingsPanel.style.display = isOpen ? 'none' : 'block';
            settingsBtn.setAttribute('aria-expanded', String(!isOpen));
        });
    }
    $$('.segmented-btn[data-font-size]').forEach(btn => {
        btn.addEventListener('click', () => {
            settings.fontSize = btn.dataset.fontSize;
            saveSettings();
            applySettings();
        });
    });
    ['highContrastToggle', 'reduceMotionToggle', 'darkModeToggle'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('change', () => {
            const key = id.replace('Toggle', '');
            settings[key] = el.checked;
            saveSettings();
            applySettings();
        });
    });

    // ---------- Quick call bar ----------
    const quickCallBar = $('#quickCallBar');
    const quickCallToggle = $('#quickCallToggle');
    if (quickCallBar && quickCallToggle) {
        const collapsed = localStorage.getItem(QUICK_CALL_KEY) === '1';
        quickCallBar.classList.toggle('collapsed', collapsed);
        quickCallToggle.addEventListener('click', () => {
            const nowCollapsed = !quickCallBar.classList.contains('collapsed');
            quickCallBar.classList.toggle('collapsed', nowCollapsed);
            localStorage.setItem(QUICK_CALL_KEY, nowCollapsed ? '1' : '0');
        });
    }

    // ---------- Save indicator ----------
    const lastSavedEl = $('#lastSavedIndicator');
    function updateLastSavedIndicator() {
        if (!lastSavedEl) return;
        if (!plan.updatedAt) { lastSavedEl.textContent = ''; return; }
        const d = new Date(plan.updatedAt);
        lastSavedEl.textContent = `Saved ${d.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })}`;
    }

    // ---------- Rendering: items ----------
    function renderSuggestions(levelId) {
        const wrap = document.getElementById(`level-${levelId}-suggestions`);
        if (!wrap) return;
        const list = SUGGESTIONS[levelId] || [];
        const existing = new Set(plan.levels[levelId].map(i => i.text.trim().toLowerCase()));
        wrap.innerHTML = '';
        const remaining = list.filter(s => !existing.has(s.trim().toLowerCase()));
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
        if (!container) return;
        const items = plan.levels[levelId];
        container.innerHTML = '';

        if (!items.length) {
            const empty = document.createElement('div');
            empty.className = 'empty-message';
            empty.textContent = 'no steps yet - add one below.';
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
            checkbox.setAttribute('aria-label', item.text);
            checkbox.addEventListener('change', () => {
                item.checked = checkbox.checked;
                row.classList.toggle('checked', item.checked);
                savePlan();
                updateLevelCount(levelId);
                renderEmergencyPanel();
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
            editBtn.setAttribute('aria-label', 'Edit: ' + item.text);
            editBtn.innerHTML = '<i class="fas fa-pencil" aria-hidden="true"></i>';
            editBtn.addEventListener('click', () => beginEdit(levelId, item, row, text));

            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'delete-item-btn';
            deleteBtn.title = 'Remove';
            deleteBtn.setAttribute('aria-label', 'Remove: ' + item.text);
            deleteBtn.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i>';
            deleteBtn.addEventListener('click', () => {
                const idx = plan.levels[levelId].findIndex(i => i.id === item.id);
                const removed = plan.levels[levelId][idx];
                plan.levels[levelId] = plan.levels[levelId].filter(i => i.id !== item.id);
                savePlan();
                renderLevel(levelId);
                renderSuggestions(levelId);
                pushUndo(`Removed "${truncate(removed.text, 30)}"`, () => {
                    plan.levels[levelId].splice(idx, 0, removed);
                });
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

    function truncate(s, n) {
        s = String(s || '');
        return s.length > n ? s.slice(0, n - 1) + '\u2026' : s;
    }

    function beginEdit(levelId, item, row, textEl) {
        const original = item.text;
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'plan-item-edit-input';
        input.value = item.text;
        row.replaceChild(input, textEl);
        input.focus();
        input.select();

        let committed = false;
        const commit = () => {
            if (committed) return;
            committed = true;
            const val = input.value.trim();
            if (val && val !== original) {
                item.text = val;
                savePlan();
            }
            renderLevel(levelId);
            renderSuggestions(levelId);
        };
        const cancel = () => {
            if (committed) return;
            committed = true;
            renderLevel(levelId);
        };

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); commit(); }
            else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
        });
        input.addEventListener('blur', commit);
    }

    function updateLevelCount(levelId) {
        const items = plan.levels[levelId];
        const checked = items.filter(i => i.checked).length;
        const el = document.getElementById(`level-${levelId}-count`);
        if (el) el.textContent = items.length ? `${checked}/${items.length}` : '';
    }

    function renderAllLevels() {
        RENDERABLE_LEVELS.forEach(lvl => renderLevel(lvl.id));
    }

    // ---------- Add items ----------
    $$('.add-item-btn').forEach(btn => {
        btn.addEventListener('click', () => addItemFromInput(btn.dataset.level));
    });
    $$('.add-item-input').forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); addItemFromInput(input.dataset.level); }
        });
    });
    function addItemFromInput(levelId) {
        const input = document.querySelector(`.add-item-input[data-level="${levelId}"]`);
        if (!input) return;
        const val = input.value.trim();
        if (!val) return;
        plan.levels[levelId].push({ id: newItemId(), text: val, checked: false });
        input.value = '';
        savePlan();
        renderLevel(levelId);
        renderSuggestions(levelId);
    }

    // ---------- Page title ----------
    const userNameEl = $('#userNameInput');
    const originalPageTitle = document.title;
    function updatePageTitle() {
        const name = (plan.userName || '').trim();
        document.title = name ? `Crisis Planner - ${name}` : originalPageTitle;
    }

    // ---------- Text field wiring ----------
    const triggersEl = $('#currentTriggers');
    const whatHappenedEl = $('#whatHappened');
    const needsNowEl = $('#needsNow');
    const professionalContactsEl = $('#professionalContacts');
    const medicalInfoEl = $('#medicalInfo');
    const meansRestrictionEl = $('#meansRestriction');
    const reasonsForLivingEl = $('#reasonsForLiving');

    function loadTextFields() {
        if (userNameEl) userNameEl.value = plan.userName || '';
        updatePageTitle();
        if (triggersEl) triggersEl.value = plan.triggers || '';
        if (whatHappenedEl) whatHappenedEl.value = plan.whatHappened || '';
        if (needsNowEl) needsNowEl.value = plan.needsNow || '';
        if (professionalContactsEl) professionalContactsEl.value = plan.safety.professionalContacts || '';
        if (medicalInfoEl) medicalInfoEl.value = plan.safety.medicalInfo || '';
        if (meansRestrictionEl) meansRestrictionEl.value = plan.safety.meansRestriction || '';
        if (reasonsForLivingEl) reasonsForLivingEl.value = plan.safety.reasonsForLiving || '';
        updateReasonsPinned();
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
        if (!el) return;
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
        [professionalContactsEl, 'professionalContacts'],
        [medicalInfoEl, 'medicalInfo'],
        [meansRestrictionEl, 'meansRestriction'],
        [reasonsForLivingEl, 'reasonsForLiving']
    ].forEach(([el, key]) => {
        if (!el) return;
        el.addEventListener('input', () => {
            plan.safety[key] = el.value;
            if (key === 'reasonsForLiving') updateReasonsPinned();
            debouncedSave();
        });
    });

    // ---------- Reasons pinned card ----------
    const reasonsPinned = $('#reasonsPinned');
    const reasonsPinnedBody = $('#reasonsPinnedBody');
    function updateReasonsPinned() {
        if (!reasonsPinned || !reasonsPinnedBody) return;
        const text = (plan.safety.reasonsForLiving || '').trim();
        if (!text) { reasonsPinned.hidden = true; reasonsPinnedBody.textContent = ''; return; }
        reasonsPinned.hidden = false;
        reasonsPinnedBody.textContent = text;
    }

    // ---------- Structured contacts ----------
    const contactsList = $('#contactsList');
    const addContactBtn = $('#addContactBtn');
    const contactName = $('#contactName');
    const contactPhone = $('#contactPhone');
    const contactRel = $('#contactRel');

    function renderContacts() {
        if (!contactsList) return;
        contactsList.innerHTML = '';
        if (!plan.contacts.length) {
            const empty = document.createElement('div');
            empty.className = 'empty-message small';
            empty.textContent = 'no personal contacts yet - add one below.';
            contactsList.appendChild(empty);
            return;
        }
        plan.contacts.forEach(c => {
            const row = document.createElement('div');
            row.className = 'contact-row';
            const tel = c.phone.replace(/\s+/g, '');
            row.innerHTML = `
                <div class="contact-info">
                    <span class="contact-name">${escapeHtml(c.name || '(no name)')}</span>
                    ${c.relationship ? `<span class="contact-rel">${escapeHtml(c.relationship)}</span>` : ''}
                    <span class="contact-phone">${escapeHtml(c.phone || '')}</span>
                </div>
            `;
            const actions = document.createElement('div');
            actions.className = 'contact-actions';
            if (c.phone) {
                const call = document.createElement('a');
                call.className = 'contact-btn contact-call';
                call.href = 'tel:' + tel;
                call.title = 'Call';
                call.setAttribute('aria-label', `Call ${c.name || c.phone}`);
                call.innerHTML = '<i class="fas fa-phone" aria-hidden="true"></i>';
                actions.appendChild(call);
                const sms = document.createElement('a');
                sms.className = 'contact-btn contact-sms';
                sms.href = 'sms:' + tel;
                sms.title = 'Text';
                sms.setAttribute('aria-label', `Text ${c.name || c.phone}`);
                sms.innerHTML = '<i class="fas fa-comment" aria-hidden="true"></i>';
                actions.appendChild(sms);
            }
            const edit = document.createElement('button');
            edit.type = 'button';
            edit.className = 'contact-btn contact-edit';
            edit.title = 'Edit';
            edit.setAttribute('aria-label', `Edit ${c.name || 'contact'}`);
            edit.innerHTML = '<i class="fas fa-pencil" aria-hidden="true"></i>';
            edit.addEventListener('click', () => editContact(c));
            actions.appendChild(edit);

            const del = document.createElement('button');
            del.type = 'button';
            del.className = 'contact-btn contact-del';
            del.title = 'Remove';
            del.setAttribute('aria-label', `Remove ${c.name || 'contact'}`);
            del.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i>';
            del.addEventListener('click', () => {
                const idx = plan.contacts.findIndex(x => x.id === c.id);
                const removed = plan.contacts[idx];
                plan.contacts.splice(idx, 1);
                savePlan();
                renderContacts();
                renderEmergencyPanel();
                pushUndo(`Removed ${removed.name || 'contact'}`, () => {
                    plan.contacts.splice(idx, 0, removed);
                });
            });
            actions.appendChild(del);

            row.appendChild(actions);
            contactsList.appendChild(row);
        });
    }

    function editContact(c) {
        const name = prompt('Name:', c.name || '');
        if (name === null) return;
        const phone = prompt('Phone:', c.phone || '');
        if (phone === null) return;
        const rel = prompt('Relationship (optional):', c.relationship || '');
        if (rel === null) return;
        c.name = name.trim();
        c.phone = phone.trim();
        c.relationship = rel.trim();
        savePlan();
        renderContacts();
        renderEmergencyPanel();
    }

    if (addContactBtn) {
        addContactBtn.addEventListener('click', () => {
            const name = contactName.value.trim();
            const phone = contactPhone.value.trim();
            const rel = contactRel.value.trim();
            if (!name && !phone) return;
            plan.contacts.push({ id: newItemId(), name, phone, relationship: rel });
            contactName.value = '';
            contactPhone.value = '';
            contactRel.value = '';
            savePlan();
            renderContacts();
            renderEmergencyPanel();
            showToast('Contact added');
        });
    }
    [contactName, contactPhone, contactRel].forEach((el, i, arr) => {
        if (!el) return;
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (i === arr.length - 1 || !arr[i + 1].value) addContactBtn.click();
                else arr[i + 1].focus();
            }
        });
    });

    // ---------- Mood check-in ----------
    const moodSlider = $('#moodSlider');
    const moodValue = $('#moodValue');
    const moodHistory = $('#moodHistory');

    function loadMoods() {
        try { return JSON.parse(localStorage.getItem(MOOD_KEY) || '[]'); }
        catch (e) { return []; }
    }
    function saveMoods(moods) {
        try { localStorage.setItem(MOOD_KEY, JSON.stringify(moods.slice(-30))); }
        catch (e) { console.error(e); }
    }
    let moods = loadMoods();

    function renderMoodHistory() {
        if (!moodHistory) return;
        if (!moods.length) { moodHistory.textContent = ''; return; }
        moodHistory.innerHTML = moods.slice(-7).map(m => {
            const d = new Date(m.t);
            const label = d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' });
            const cls = m.v <= 3 ? 'mood-low' : m.v <= 6 ? 'mood-mid' : 'mood-high';
            return `<span class="mood-chip ${cls}" title="${label}">${label}: ${m.v}</span>`;
        }).join('');
    }
    renderMoodHistory();

    if (moodSlider) {
        moodSlider.addEventListener('input', () => {
            moodValue.textContent = moodSlider.value + '/10';
        });
        moodSlider.addEventListener('change', () => {
            const v = parseInt(moodSlider.value, 10);
            moods.push({ t: Date.now(), v });
            saveMoods(moods);
            renderMoodHistory();
            showToast('Check-in saved');
        });
    }

    // ---------- Reset buttons ----------
    $('#resetPlanBtn').addEventListener('click', () => {
        const confirmText = prompt('Type RESET to confirm resetting the whole plan to defaults. This cannot be undone.');
        if (confirmText !== 'RESET') {
            if (confirmText !== null) showToast('Reset cancelled');
            return;
        }
        plan = clone(DEFAULT_PLAN);
        normalizeLevels();
        savePlan();
        renderAllLevels();
        renderAllSuggestions();
        renderContacts();
        renderEmergencyPanel();
        loadTextFields();
        showToast('Plan reset to defaults');
    });

    $('#resetCurrentStateBtn').addEventListener('click', () => {
        if (!confirm('Reset only the "What\'s happening right now" section?')) return;
        plan.levels.now.forEach(item => { item.checked = false; });
        plan.triggers = '';
        plan.whatHappened = '';
        plan.needsNow = '';
        loadTextFields();
        savePlan();
        renderLevel('now');
        renderSuggestions('now');
        showToast('Current state reset');
    });

    // ---------- Export / import ----------
    $('#exportBtn').addEventListener('click', () => {
        const payload = Object.assign({}, plan, { exportedAt: new Date().toISOString(), app: 'crisis-planner' });
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `crisis-plan-${getTodayDate()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Exported');
    });

    $('#importBtn').addEventListener('click', () => $('#importFile').click());
    $('#importFile').addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const imported = JSON.parse(ev.target.result);
                if (!imported || typeof imported !== 'object' || !imported.levels) {
                    alert('This doesn\u2019t look like a crisis plan file.');
                    return;
                }
                if (!confirm('This will replace your current plan. Continue?')) return;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(imported));
                plan = loadPlan();
                normalizeLevels();
                savePlan();
                renderAllLevels();
                renderAllSuggestions();
                renderContacts();
                renderEmergencyPanel();
                loadTextFields();
                showToast('Plan imported');
            } catch (err) {
                alert('Failed to import: invalid JSON file.');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    });

    // ---------- Summary / plan modal ----------
    const summaryModal = $('#summaryModal');
    const summaryOutput = $('#summaryOutput');
    const copySummaryBtn = $('#copySummaryBtn');
    const downloadSummaryBtn = $('#downloadSummaryBtn');
    const shareSummaryBtn = $('#shareSummaryBtn');
    const modalTitleEl = $('#modalTitle');
    const modalHintEl = $('#modalHint');
    const closeSummaryModal = $('#closeSummaryModal');
    let currentDownloadPrefix = 'crisis-summary';
    let lastModalFocus = null;

    function openModal(el, opener) {
        if (!el) return;
        lastModalFocus = opener || document.activeElement;
        el.style.display = 'flex';
        document.body.classList.add('modal-open');
        const focusable = el.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable) setTimeout(() => focusable.focus(), 30);
    }
    function closeModal(el) {
        if (!el) return;
        el.style.display = 'none';
        if (!$$('.modal').some(m => m.style.display === 'flex')) {
            document.body.classList.remove('modal-open');
        }
        if (lastModalFocus && typeof lastModalFocus.focus === 'function') {
            try { lastModalFocus.focus(); } catch (e) { }
        }
    }

    // Focus trap for modals
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        const openModals = $$('.modal').filter(m => m.style.display === 'flex');
        if (!openModals.length) return;
        const modal = openModals[openModals.length - 1];
        const focusables = $$('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])', modal)
            .filter(el => el.offsetParent !== null);
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

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
        if (plan.contacts.length) {
            html += `<strong>Personal contacts:</strong>`;
            html += `<ul class="summary-list">`;
            plan.contacts.forEach(c => {
                const label = [c.name, c.relationship].filter(Boolean).join(' (' + (c.relationship ? '' : '')) || c.name;
                html += `<li>${escapeHtml(c.name || '(no name)')}${c.relationship ? ` (${escapeHtml(c.relationship)})` : ''}${c.phone ? ` - ${escapeHtml(c.phone)}` : ''}</li>`;
            });
            html += `</ul>`;
        }
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
        if (!anyCompleted) html += `<span class="summary-empty">No steps completed yet.</span>`;
        html += `</div>`;

        html += `<div class="summary-section"><strong>SAFETY INFORMATION</strong><br>`;
        if (plan.contacts.length) {
            html += `<strong>Personal contacts:</strong>`;
            html += `<ul class="summary-list">`;
            plan.contacts.forEach(c => {
                html += `<li>${escapeHtml(c.name || '(no name)')}${c.relationship ? ` (${escapeHtml(c.relationship)})` : ''}${c.phone ? ` - ${escapeHtml(c.phone)}` : ''}</li>`;
            });
            html += `</ul>`;
        }
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

    function openSummary(kind) {
        if (kind === 'plan') {
            modalTitleEl.textContent = 'Your Crisis Plan';
            modalHintEl.textContent = 'Completed steps and safety information - for a quick look or to show someone.';
            summaryOutput.innerHTML = buildPlanViewHTML();
            currentDownloadPrefix = 'crisis-plan';
        } else {
            modalTitleEl.textContent = 'Crisis Handover Summary';
            modalHintEl.textContent = 'A clean summary you can show to a crisis team, support worker, or emergency mental health service.';
            summaryOutput.innerHTML = buildSummaryHTML();
            currentDownloadPrefix = 'crisis-summary';
        }
        openModal(summaryModal);
        if (shareSummaryBtn) shareSummaryBtn.hidden = !navigator.share;
    }

    $('#summaryBtn').addEventListener('click', () => openSummary('summary'));
    const viewPlanBtn = $('#viewPlanBtn2');
    if (viewPlanBtn) viewPlanBtn.addEventListener('click', () => openSummary('plan'));

    closeSummaryModal.addEventListener('click', () => closeModal(summaryModal));
    closeSummaryModal.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeModal(summaryModal); }
    });
    summaryModal.addEventListener('click', (e) => { if (e.target === summaryModal) closeModal(summaryModal); });

    function summaryText() {
        const temp = document.createElement('div');
        temp.innerHTML = summaryOutput.innerHTML;
        return temp.textContent;
    }

    copySummaryBtn.addEventListener('click', () => {
        const text = summaryText();
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => showToast('Summary copied')).catch(() => alert('Could not copy text.'));
    });
    downloadSummaryBtn.addEventListener('click', () => {
        const text = summaryText();
        if (!text) return;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentDownloadPrefix}-${getTodayDate()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    });
    if (shareSummaryBtn) {
        shareSummaryBtn.addEventListener('click', async () => {
            const text = summaryText();
            if (!text) return;
            try {
                await navigator.share({ title: 'Crisis plan', text });
            } catch (e) { /* user cancelled */ }
        });
    }

    // ---------- Emergency Mode ----------
    const emergencyFab = $('#emergencyFab');
    const emergencyModal = $('#emergencyModal');
    const closeEmergencyModal = $('#closeEmergencyModal');
    const emergencyContacts = $('#emergencyContacts');
    const emergencyPersonal = $('#emergencyPersonal');
    const emergencyReasons = $('#emergencyReasons');
    const emergencyReasonsBody = $('#emergencyReasonsBody');

    function renderEmergencyPanel() {
        if (!emergencyContacts) return;
        emergencyContacts.innerHTML = '';
        if (plan.contacts.length) {
            emergencyPersonal.hidden = false;
            plan.contacts.forEach(c => {
                if (!c.phone) return;
                const a = document.createElement('a');
                a.className = 'emergency-contact-btn';
                a.href = 'tel:' + c.phone.replace(/\s+/g, '');
                a.innerHTML = `
                    <span class="emergency-contact-icon"><i class="fas fa-phone" aria-hidden="true"></i></span>
                    <span class="emergency-contact-info">
                        <span class="emergency-contact-name">${escapeHtml(c.name || c.phone)}</span>
                        ${c.relationship ? `<span class="emergency-contact-rel">${escapeHtml(c.relationship)}</span>` : ''}
                    </span>
                `;
                emergencyContacts.appendChild(a);
            });
        } else {
            emergencyPersonal.hidden = true;
        }
        const reasons = (plan.safety.reasonsForLiving || '').trim();
        if (reasons) {
            emergencyReasons.hidden = false;
            emergencyReasonsBody.textContent = reasons;
        } else {
            emergencyReasons.hidden = true;
        }
    }

    if (emergencyFab) {
        emergencyFab.addEventListener('click', () => {
            renderEmergencyPanel();
            openModal(emergencyModal);
        });
    }
    closeEmergencyModal.addEventListener('click', () => closeModal(emergencyModal));
    closeEmergencyModal.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeModal(emergencyModal); }
    });
    emergencyModal.addEventListener('click', (e) => { if (e.target === emergencyModal) closeModal(emergencyModal); });

    $('#emergencyGroundingBtn').addEventListener('click', () => {
        closeModal(emergencyModal);
        openGrounding();
    });
    $('#emergencyPlanBtn').addEventListener('click', () => {
        closeModal(emergencyModal);
        openSummary('plan');
    });
    $('#emergencySummaryBtn').addEventListener('click', () => {
        closeModal(emergencyModal);
        openSummary('summary');
    });

    // ---------- Grounding ----------
    const groundingModal = $('#groundingModal');
    const closeGroundingModal = $('#closeGroundingModal');
    const breathingCircle = $('#breathingCircle');
    const breathingWord = $('#breathingWord');
    const breathingCount = $('#breathingCount');
    const breathingToggleBtn = $('#breathingToggleBtn');
    let breathingTimer = null;
    let breathingRunning = false;
    let breathingTechnique = 'calm';

    const TECHNIQUES = {
        calm: [
            { word: 'breathe in', ms: 4000, cls: 'inhale' },
            { word: 'hold', ms: 2000, cls: 'inhale' },
            { word: 'breathe out', ms: 6000, cls: 'exhale' }
        ],
        box: [
            { word: 'breathe in', ms: 4000, cls: 'inhale' },
            { word: 'hold', ms: 4000, cls: 'inhale' },
            { word: 'breathe out', ms: 4000, cls: 'exhale' },
            { word: 'hold', ms: 4000, cls: 'exhale' }
        ],
        '478': [
            { word: 'breathe in', ms: 4000, cls: 'inhale' },
            { word: 'hold', ms: 7000, cls: 'inhale' },
            { word: 'breathe out', ms: 8000, cls: 'exhale' }
        ]
    };

    function stopBreathing() {
        breathingRunning = false;
        clearTimeout(breathingTimer);
        clearInterval(breathingTimer);
        breathingTimer = null;
        breathingCircle.classList.remove('inhale', 'exhale');
        breathingWord.textContent = 'start';
        if (breathingCount) breathingCount.textContent = '';
        breathingToggleBtn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i> start';
    }

    function startBreathing() {
        breathingRunning = true;
        breathingToggleBtn.innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i> stop';
        const cycle = TECHNIQUES[breathingTechnique] || TECHNIQUES.calm;
        let step = 0;
        function runStep() {
            if (!breathingRunning) return;
            const s = cycle[step % cycle.length];
            breathingWord.textContent = s.word;
            breathingCircle.classList.remove('inhale', 'exhale');
            if (!settings.reduceMotion) breathingCircle.classList.add(s.cls);
            const totalSec = Math.round(s.ms / 1000);
            let remaining = totalSec;
            if (breathingCount) breathingCount.textContent = remaining;
            clearInterval(breathingTimer);
            breathingTimer = setInterval(() => {
                remaining -= 1;
                if (breathingCount) breathingCount.textContent = remaining > 0 ? remaining : '';
                if (remaining <= 0) clearInterval(breathingTimer);
            }, 1000);
            step += 1;
            setTimeout(() => {
                if (!breathingRunning) return;
                runStep();
            }, s.ms);
        }
        runStep();
    }

    if (breathingToggleBtn) {
        breathingToggleBtn.addEventListener('click', () => {
            if (breathingRunning) stopBreathing(); else startBreathing();
        });
    }
    $$('.segmented-btn[data-technique]').forEach(btn => {
        btn.addEventListener('click', () => {
            breathingTechnique = btn.dataset.technique;
            $$('.segmented-btn[data-technique]').forEach(b => {
                const active = b === btn;
                b.classList.toggle('active', active);
                b.setAttribute('aria-pressed', String(active));
            });
            if (breathingRunning) { stopBreathing(); startBreathing(); }
        });
    });

    function openGrounding() {
        openModal(groundingModal);
    }
    $('#groundingBtn').addEventListener('click', openGrounding);
    closeGroundingModal.addEventListener('click', () => { stopBreathing(); closeModal(groundingModal); });
    closeGroundingModal.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stopBreathing(); closeModal(groundingModal); }
    });
    groundingModal.addEventListener('click', (e) => {
        if (e.target === groundingModal) { stopBreathing(); closeModal(groundingModal); }
    });

    // ---------- Shortcuts modal ----------
    const shortcutsModal = $('#shortcutsModal');
    const closeShortcutsModal = $('#closeShortcutsModal');
    closeShortcutsModal.addEventListener('click', () => closeModal(shortcutsModal));
    closeShortcutsModal.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeModal(shortcutsModal); }
    });
    shortcutsModal.addEventListener('click', (e) => { if (e.target === shortcutsModal) closeModal(shortcutsModal); });

    // ---------- Global keyboard shortcuts ----------
    document.addEventListener('keydown', (e) => {
        const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
        if (e.key === 'Escape') {
            const open = $$('.modal').filter(m => m.style.display === 'flex');
            if (open.length) {
                const m = open[open.length - 1];
                if (m === groundingModal) stopBreathing();
                closeModal(m);
            }
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
            savePlan();
            showToast('Saved');
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
            e.preventDefault();
            $('#printBtn').click();
            return;
        }
        if (typing) return;
        if (e.key === '?') {
            e.preventDefault();
            openModal(shortcutsModal);
        } else if (e.key.toLowerCase() === 'e' && !e.ctrlKey && !e.metaKey && !e.altKey) {
            renderEmergencyPanel();
            openModal(emergencyModal);
        } else if (e.key.toLowerCase() === 'g' && !e.ctrlKey && !e.metaKey && !e.altKey) {
            openGrounding();
        }
    });

    // ---------- Print ----------
    const printBtn = $('#printBtn');
    const printArea = $('#printArea');
    const printCardBtn = $('#printCardBtn');

    function buildPrintHTML(pocket) {
        const now = new Date();
        const name = (plan.userName || '').trim();
        if (pocket) {
            let html = `<div class="pocket-card">`;
            html += `<div class="pocket-card-head"><strong>Crisis plan</strong>${name ? ` - ${escapeHtml(name)}` : ''}</div>`;
            html += `<div class="pocket-card-grid">`;
            html += `<div class="pocket-card-cell"><span>Emergency</span><strong>111</strong></div>`;
            html += `<div class="pocket-card-cell"><span>Need to talk</span><strong>1737</strong></div>`;
            html += `<div class="pocket-card-cell"><span>Tautoko</span><strong>0508 828 865</strong></div>`;
            html += `<div class="pocket-card-cell"><span>Lifeline</span><strong>0800 543 354</strong></div>`;
            html += `</div>`;
            if (plan.contacts.length) {
                html += `<div class="pocket-card-section"><strong>My people</strong><ul>`;
                plan.contacts.forEach(c => {
                    if (c.name || c.phone) html += `<li>${escapeHtml(c.name || '(no name)')}${c.phone ? ` - ${escapeHtml(c.phone)}` : ''}</li>`;
                });
                html += `</ul></div>`;
            }
            if (plan.safety.professionalContacts) {
                html += `<div class="pocket-card-section"><strong>GP / worker</strong><div>${escapeHtml(plan.safety.professionalContacts)}</div></div>`;
            }
            if (plan.safety.reasonsForLiving) {
                html += `<div class="pocket-card-section"><strong>Reasons to keep going</strong><div>${escapeHtml(plan.safety.reasonsForLiving)}</div></div>`;
            }
            html += `<div class="pocket-card-foot">Printed ${escapeHtml(now.toLocaleDateString('en-NZ'))}</div>`;
            html += `</div>`;
            return html;
        }

        const heading = name ? `My Crisis Plan - ${escapeHtml(name)}` : 'My Crisis Plan';
        let html = `<h1>${heading}</h1><p>Printed: ${escapeHtml(now.toLocaleString('en-NZ'))}</p><hr>`;
        LEVELS.forEach(lvl => {
            html += `<h2>${escapeHtml(lvl.label)}</h2>`;
            const items = plan.levels[lvl.id];
            if (items.length) html += '<ul>' + items.map(i => `<li>${escapeHtml(i.text)}</li>`).join('') + '</ul>';
            else html += '<p><em>No steps added yet.</em></p>';
        });
        html += '<h2>Safety information</h2>';
        if (plan.contacts.length) {
            html += `<p><strong>Personal contacts:</strong></p><ul>`;
            plan.contacts.forEach(c => {
                html += `<li>${escapeHtml(c.name || '(no name)')}${c.relationship ? ` (${escapeHtml(c.relationship)})` : ''}${c.phone ? ` - ${escapeHtml(c.phone)}` : ''}</li>`;
            });
            html += `</ul>`;
        }
        html += `<p><strong>GP / therapist / support worker:</strong><br>${escapeHtml(plan.safety.professionalContacts) || 'not specified'}</p>`;
        html += `<p><strong>Diagnoses, medications, allergies:</strong><br>${escapeHtml(plan.safety.medicalInfo) || 'not specified'}</p>`;
        html += `<p><strong>Means restriction in place:</strong><br>${escapeHtml(plan.safety.meansRestriction) || 'not specified'}</p>`;
        html += `<p><strong>Reasons to keep going:</strong><br>${escapeHtml(plan.safety.reasonsForLiving) || 'not specified'}</p>`;
        return html;
    }

    function doPrint(pocket) {
        updatePageTitle();
        printArea.innerHTML = buildPrintHTML(pocket);
        printArea.classList.toggle('pocket', !!pocket);
        document.body.classList.toggle('printing-pocket', !!pocket);
        window.print();
        setTimeout(() => {
            document.body.classList.remove('printing-pocket');
            printArea.classList.remove('pocket');
        }, 500);
    }

    if (printBtn) printBtn.addEventListener('click', () => doPrint(false));
    if (printCardBtn) printCardBtn.addEventListener('click', () => doPrint(true));

    // ---------- Init ----------
    renderAllLevels();
    renderAllSuggestions();
    renderContacts();
    renderEmergencyPanel();
    loadTextFields();
    updateLastSavedIndicator();
})();