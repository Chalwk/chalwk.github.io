// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

(() => {
    "use strict";

    // -------------------------------------------------------------------------
    // Constants & data
    // -------------------------------------------------------------------------
    const STORAGE_KEY = "autism-regulog-history-v3";
    const SETTINGS_KEY = "autism-regulog-settings-v3";
    const THEME_KEY = "autism-regulog-theme";
    const DEFAULT_MAX_HISTORY = 200;
    const HISTORY_PAGE_SIZE = 10;

    const SYMPTOMS = [
        { id: "tired", label: "Tired / sleepy", tags: ["fatigue"] },
        { id: "poor-sleep", label: "Poor sleep last night", tags: ["fatigue"] },
        { id: "hungry", label: "Hungry", tags: ["basic-needs"] },
        { id: "loss-appetite", label: "Loss of appetite", tags: ["basic-needs"] },
        { id: "dehydration", label: "Thirst / dehydrated", tags: ["basic-needs", "physiological"] },
        { id: "overwhelmed", label: "Feeling overwhelmed", tags: ["sensory", "stress"] },
        { id: "sensory-noise", label: "Too much noise / loud", tags: ["sensory"] },
        { id: "sensory-light", label: "Bright lights / visual clutter", tags: ["sensory"] },
        { id: "sensory-smell", label: "Sensitive to smells", tags: ["sensory"] },
        { id: "hot-sweaty", label: "Hot / sweaty", tags: ["sensory", "physiological"] },
        { id: "cold", label: "Feeling cold / chills", tags: ["sensory", "physiological"] },
        { id: "stomach", label: "Stomach pain / nausea", tags: ["physiological"] },
        { id: "headache", label: "Headache / migraine", tags: ["physiological"] },
        { id: "irritable", label: "Irritable / short temper", tags: ["stress", "overload"] },
        { id: "shutdown", label: "Shutting down / blanking out", tags: ["shutdown", "overload"] },
        { id: "meltdown", label: "Meltdown / intense distress", tags: ["meltdown", "overload"] },
        { id: "low-focus", label: "Trouble focusing", tags: ["executive-function", "fatigue"] },
        { id: "slow-thoughts", label: "Slow thoughts / fuzzy", tags: ["fatigue", "executive-function"] },
        { id: "sensory-touch", label: "Touch causes discomfort", tags: ["sensory"] },
        { id: "ruminating", label: "Ruminating / stuck thoughts", tags: ["anxiety"] },
        { id: "panic", label: "Panic / racing heart", tags: ["anxiety", "physiological"] },
        { id: "withdrawn", label: "Wanting to withdraw / hide", tags: ["shutdown", "stress"] },
        { id: "overstimulation", label: "Overstimulated after social time", tags: ["sensory", "social-fatigue"] },
        {
            id: "verbal-communication",
            label: "Difficulty with verbal communication",
            tags: ["shutdown", "social-fatigue"]
        },
        { id: "eye-contact", label: "Avoiding eye contact", tags: ["social-fatigue"] },
        { id: "stimming", label: "Increased stimming", tags: ["self-regulation"] },
        { id: "repetitive-behaviors", label: "Increased repetitive behaviors", tags: ["self-regulation"] },
        { id: "special-interests", label: "Focused on special interests", tags: ["self-regulation", "positive"] },
        { id: "time-blindness", label: "Time blindness / losing track of time", tags: ["executive-function"] },
        { id: "task-initiation", label: "Difficulty starting tasks", tags: ["executive-function"] },
        { id: "transitions", label: "Difficulty with transitions", tags: ["executive-function"] },
        { id: "interoception", label: "Trouble sensing bodily needs", tags: ["interoception"] },
        { id: "proprioception", label: "Seeking or avoiding physical pressure", tags: ["proprioception"] },
        { id: "happy", label: "Happy / content", tags: ["positive"] },
        { id: "calm", label: "Calm / regulated", tags: ["positive", "regulated"] },
        { id: "excited", label: "Excited / energetic", tags: ["positive", "high-arousal"] },
        { id: "anxious", label: "Anxious / worried", tags: ["anxiety", "stress"] },
        { id: "frustrated", label: "Frustrated / annoyed", tags: ["stress", "irritable"] },
        { id: "angry", label: "Angry / upset", tags: ["stress", "meltdown"] },
        { id: "sad", label: "Sad / low mood", tags: ["withdrawn"] },
        { id: "numb", label: "Numb / disconnected", tags: ["shutdown"] },
        { id: "confused", label: "Confused / disoriented", tags: ["executive-function"] }
    ];

    const TAGS = {
        "sensory": {
            name: "Sensory overload",
            strategies: [
                "Find a quieter, darker space.",
                "Use noise-cancelling headphones or earplugs.",
                "Try deep pressure: a weighted blanket or tight shirt if comfortable.",
                "Allow stimming: fidget toys or movement.",
                "Use a cold cloth or a fan to regulate temperature.",
                "Reduce visual clutter in your environment.",
                "Use sunglasses indoors if lights are too bright.",
                "Try a sensory diet with scheduled breaks."
            ],
            explanation: "Sensory input like sound, light, touch, or temperature can become overwhelming. Reducing input and using sensory supports helps."
        },
        "fatigue": {
            name: "Fatigue / low energy",
            strategies: [
                "Try a short rest or nap if possible.",
                "Drink water and have a small snack.",
                "Break tasks into five-minute steps.",
                "Lower demands and deprioritise non-essential tasks.",
                "Use an energy management system like spoon theory.",
                "Schedule rest breaks before you need them.",
                "Consider whether you are experiencing autistic burnout."
            ],
            explanation: "Low energy affects focus and tolerance. Small rests and nutrition often help."
        },
        "basic-needs": {
            name: "Basic needs (hunger, thirst)",
            strategies: [
                "Eat a small, familiar snack.",
                "Drink water or a favoured drink.",
                "Avoid heavy or new foods during distress.",
                "Set reminders to eat and drink regularly.",
                "Keep safe foods readily available.",
                "Use visual cues for meal times."
            ],
            explanation: "Often physical needs drive emotional responses. Meeting them first is low-effort and effective."
        },
        "stress": {
            name: "Stress / overload",
            strategies: [
                "Use grounding: name five things you can see, hear, or feel.",
                "Try slow box breathing: 4 in, 4 hold, 4 out, 4 hold.",
                "Simplify the environment and reduce decisions.",
                "Send a short, honest message if you need space.",
                "Use a stress scale to identify your level.",
                "Practise progressive muscle relaxation.",
                "Use a worry jar to externalise concerns."
            ],
            explanation: "Acute stress lowers tolerance. Grounding and simple choices reduce load."
        },
        "executive-function": {
            name: "Executive difficulty (planning, focus)",
            strategies: [
                "Do a five-minute timer task - short bursts help.",
                "Write a tiny next-step checklist.",
                "Remove distractions - phone away or on focus mode.",
                "Use visual timers or alarms.",
                "Break tasks into smaller, manageable steps.",
                "Use body doubling if available.",
                "Set up systems and routines to reduce decision fatigue."
            ],
            explanation: "Tasks can feel huge. Tiny steps make progress achievable."
        },
        "physiological": {
            name: "Physiological symptoms",
            strategies: [
                "Check temperature, hydration, and breathing.",
                "If physical symptoms are severe, contact a medical professional.",
                "Use soothing positions and paced breathing.",
                "Practise interoception exercises to better sense bodily signals.",
                "Keep a symptom diary to identify patterns."
            ],
            explanation: "Some feelings come from body signals and may need physical care or professional input."
        },
        "shutdown": {
            name: "Shutdown",
            strategies: [
                "Find a safe, low-demand space.",
                "Reduce questions and expectations.",
                "Offer a calm presence and reassurance if supporting someone.",
                "Allow time to recover without forcing conversation.",
                "Use alternative communication methods like writing or AAC.",
                "Create a shutdown recovery plan in advance."
            ],
            explanation: "Shutdowns are protective. Gentle, low-demand care helps recovery."
        },
        "meltdown": {
            name: "Meltdown",
            strategies: [
                "Ensure safety for the person and others.",
                "Avoid punitive responses.",
                "Offer space and reduce sensory input.",
                "Later, when calm, debrief gently if helpful.",
                "Create a meltdown prevention plan identifying triggers.",
                "Have a safe, quiet space available for recovery."
            ],
            explanation: "Meltdowns are intense and need safety and de-escalation rather than reasoning."
        },
        "anxiety": {
            name: "Anxiety",
            strategies: [
                "Try paced breathing or grounding.",
                "Label the emotion out loud or in a journal.",
                "Use brief, structured distraction, e.g. a short walk.",
                "If persistent, consider talking with a mental health provider.",
                "Practise radical acceptance of anxious feelings.",
                "Use anxiety scaling to rate and manage intensity."
            ],
            explanation: "Anxiety increases arousal. Grounding and structure reduce it in the moment."
        },
        "overload": {
            name: "High cognitive/emotional load",
            strategies: [
                "Pause tasks and rest for five minutes.",
                "Delegate or postpone non-essential tasks.",
                "Use one-step instructions only.",
                "Reduce multitasking and focus on one thing at a time.",
                "Use the 'stop, breathe, reflect, choose' method."
            ],
            explanation: "When too many things demand attention, lowering load is important."
        },
        "social-fatigue": {
            name: "Social fatigue",
            strategies: [
                "Plan quiet recovery time after social events.",
                "Tell safe people your limits in advance.",
                "Use short check-ins rather than long conversations.",
                "Use written communication when verbal is difficult.",
                "Schedule social activities when you have most energy.",
                "Have an exit strategy for social situations."
            ],
            explanation: "Social interactions can be draining. Predictable recovery routines help."
        },
        "positive": {
            name: "Positive states",
            strategies: [
                "Savour and acknowledge positive moments.",
                "Engage in special interests or hobbies.",
                "Share your joy with understanding people.",
                "Note what contributed to positive feelings for future reference.",
                "Practise gratitude for small wins."
            ],
            explanation: "Recognising and extending positive states helps build resilience."
        },
        "regulated": {
            name: "Well-regulated",
            strategies: [
                "Note what's working well for future reference.",
                "Engage in preventative self-care.",
                "Tackle challenging tasks while regulated.",
                "Share strategies that are working with your support system.",
                "Plan for upcoming challenges while in this state."
            ],
            explanation: "Being well-regulated is an opportunity for proactive planning."
        },
        "self-regulation": {
            name: "Self-regulation strategies",
            strategies: [
                "Use stimming as a regulation tool.",
                "Engage in special interests for enjoyment and calm.",
                "Practise mindfulness or meditation.",
                "Use fidget tools or sensory items.",
                "Create a personalised self-regulation toolkit."
            ],
            explanation: "Self-regulation strategies help maintain equilibrium."
        },
        "interoception": {
            name: "Interoception awareness",
            strategies: [
                "Practise body scanning to notice sensations.",
                "Use visual cues for hunger, thirst, and bathroom needs.",
                "Set regular timers for checking in with your body.",
                "Keep a log of bodily sensations and their meanings.",
                "Work with an occupational therapist on interoception."
            ],
            explanation: "Interoception is the sense of internal bodily states, which can be challenging for autistic people."
        },
        "proprioception": {
            name: "Proprioceptive needs",
            strategies: [
                "Use weighted blankets or lap pads for deep pressure.",
                "Engage in activities that provide joint compression.",
                "Try proprioceptive activities like pushing against walls.",
                "Use tight-fitting clothing if comfortable.",
                "Incorporate movement breaks with jumping or stretching."
            ],
            explanation: "Proprioception is awareness of body position and movement, which can need regulation."
        },
        "high-arousal": {
            name: "High arousal states",
            strategies: [
                "Engage in calming activities like deep pressure.",
                "Use slow, rhythmic movements.",
                "Practise deep breathing exercises.",
                "Find a quiet space to reduce stimulation.",
                "Use a weighted blanket or compression clothing."
            ],
            explanation: "High arousal states can be overwhelming and may need calming strategies."
        }
    };

    // Category chips shown above the symptom list
    const GROUPS = [
        { id: "all", label: "All" },
        { id: "sensory", label: "Sensory" },
        { id: "fatigue", label: "Fatigue" },
        { id: "basic-needs", label: "Basic needs" },
        { id: "stress", label: "Stress" },
        { id: "executive-function", label: "Focus" },
        { id: "anxiety", label: "Anxiety" },
        { id: "shutdown", label: "Shutdown" },
        { id: "meltdown", label: "Meltdown" },
        { id: "social-fatigue", label: "Social" },
        { id: "positive", label: "Positive" }
    ];

    // -------------------------------------------------------------------------
    // DOM helpers
    // -------------------------------------------------------------------------
    const el = (sel, root = document) => root.querySelector(sel);
    const els = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const fmtDate = ts => new Date(ts).toLocaleString();

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, m => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[m]));
    }

    function escapeCsv(s) {
        return String(s).replace(/"/g, '""');
    }

    // -------------------------------------------------------------------------
    // DOM references
    // -------------------------------------------------------------------------
    const symptomListEl = el("#symptom-list");
    const groupFilterEl = el("#group-filter");
    const selectionSummaryEl = el("#selection-summary");
    const analyzeBtn = el("#analyze-btn");
    const saveBtn = el("#save-btn");
    const resultSummary = el("#result-summary");
    const suggestionsEl = el("#suggestions");
    const patternInsightsEl = el("#pattern-insights");
    const historyList = el("#history-list");
    const historyMoreEl = el("#history-more");
    const clearHistoryBtn = el("#clear-history");
    const searchInput = el("#search");
    const clearBtn = el("#clear-btn");
    const exportCsvBtn = el("#export-csv-btn");
    const exportJsonBtn = el("#export-json-btn");
    const importJsonBtn = el("#import-json-btn");
    const fileInput = el("#file-input");
    const settingsDialog = el("#settings-dialog");
    const helpDialog = el("#help-dialog");
    const openSettingsBtn = el("#open-settings");
    const helpBtn = el("#help-btn");
    const themeBtn = el("#theme-btn");
    const themeIcon = el("#theme-icon");
    const maxHistoryInput = el("#max-history");
    const enableNotifications = el("#enable-notifications");
    const enableSounds = el("#enable-sounds");
    const closeHelpBtn = el("#close-help");
    const tagChart = el("#tag-chart");
    const symptomChart = el("#symptom-chart");
    const copyResultsBtn = el("#copy-results-btn");
    const toastRegion = el("#toast-region");

    // -------------------------------------------------------------------------
    // Settings
    // -------------------------------------------------------------------------
    function loadSettings() {
        try {
            const raw = localStorage.getItem(SETTINGS_KEY);
            const parsed = raw ? JSON.parse(raw) : {};
            return {
                maxHistory: parsed.maxHistory || DEFAULT_MAX_HISTORY,
                enableNotifications: !!parsed.enableNotifications,
                enableSounds: !!parsed.enableSounds
            };
        } catch (e) {
            return {
                maxHistory: DEFAULT_MAX_HISTORY,
                enableNotifications: false,
                enableSounds: false
            };
        }
    }

    function saveSettings(obj) {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(obj));
        } catch (e) { }
    }

    // -------------------------------------------------------------------------
    // Theme
    // -------------------------------------------------------------------------
    function applyTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        try { localStorage.setItem(THEME_KEY, theme); } catch (e) { }
        if (themeIcon) themeIcon.textContent = theme === "dark" ? "☀" : "🌙";
        if (themeBtn) {
            themeBtn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
            themeBtn.title = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
        }
        // Charts need to be redrawn with the new palette
        requestAnimationFrame(() => {
            drawTagChart();
            drawSymptomChart();
        });
    }

    function getCurrentTheme() {
        return document.documentElement.getAttribute("data-theme") || "light";
    }

    // -------------------------------------------------------------------------
    // Toasts
    // -------------------------------------------------------------------------
    function toast(message, opts = {}) {
        if (!toastRegion) return;
        const node = document.createElement("div");
        node.className = "toast fade-in";
        if (opts.tone) node.classList.add(`toast-${opts.tone}`);
        node.textContent = message;
        toastRegion.appendChild(node);
        const ttl = opts.duration || 2600;
        setTimeout(() => {
            node.classList.add("toast-out");
            setTimeout(() => node.remove(), 250);
        }, ttl);
    }

    // -------------------------------------------------------------------------
    // Confirm dialog (promise-based)
    // -------------------------------------------------------------------------
    const confirmDialogEl = el("#confirm-dialog");
    const confirmMessageEl = el("#confirm-message");
    const confirmOkBtn = el("#confirm-ok");
    const confirmTitleEl = el("#confirm-title");

    function confirmDialog(message, opts = {}) {
        return new Promise(resolve => {
            if (!confirmDialogEl) {
                // Fallback if dialog is unsupported
                resolve(window.confirm(message));
                return;
            }
            confirmMessageEl.textContent = message;
            confirmTitleEl.textContent = opts.title || "Are you sure?";
            confirmOkBtn.textContent = opts.okText || "Confirm";

            const handler = () => {
                confirmDialogEl.removeEventListener("close", handler);
                resolve(confirmDialogEl.returnValue === "confirm");
            };
            confirmDialogEl.addEventListener("close", handler);
            confirmDialogEl.showModal();
        });
    }

    // -------------------------------------------------------------------------
    // Sounds
    // -------------------------------------------------------------------------
    let audioCtx = null;
    function playSound(kind = "click") {
        if (!loadSettings().enableSounds) return;
        try {
            audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
            const o = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            o.type = "sine";
            o.frequency.value = kind === "error" ? 220 : kind === "success" ? 620 : 440;
            g.gain.value = 0.045;
            o.connect(g);
            g.connect(audioCtx.destination);
            const now = audioCtx.currentTime;
            g.gain.setValueAtTime(0.045, now);
            g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
            o.start(now);
            o.stop(now + 0.2);
        } catch (e) { /* silently ignore */ }
    }

    // -------------------------------------------------------------------------
    // Group chips
    // -------------------------------------------------------------------------
    let activeGroup = "all";

    function renderGroupFilter() {
        if (!groupFilterEl) return;
        groupFilterEl.innerHTML = "";
        GROUPS.forEach(g => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "chip";
            btn.dataset.group = g.id;
            btn.textContent = g.label;
            btn.setAttribute("aria-pressed", g.id === activeGroup ? "true" : "false");
            if (g.id === activeGroup) btn.classList.add("is-active");
            btn.addEventListener("click", () => {
                activeGroup = g.id;
                els(".chip", groupFilterEl).forEach(c => {
                    const isActive = c.dataset.group === activeGroup;
                    c.classList.toggle("is-active", isActive);
                    c.setAttribute("aria-pressed", isActive ? "true" : "false");
                });
                renderSymptomList(searchInput.value);
                playSound("click");
            });
            groupFilterEl.appendChild(btn);
        });
    }

    // -------------------------------------------------------------------------
    // Symptom list
    // -------------------------------------------------------------------------
    function symptomMatchesFilter(sym, q) {
        if (activeGroup !== "all" && !(sym.tags || []).includes(activeGroup)) return false;
        if (!q) return true;
        const haystack = `${sym.label} ${(sym.tags || []).join(" ")}`.toLowerCase();
        return haystack.includes(q);
    }

    function renderSymptomList(filter = "") {
        symptomListEl.innerHTML = "";
        const q = filter.trim().toLowerCase();

        const visible = SYMPTOMS.filter(sym => symptomMatchesFilter(sym, q));

        if (!visible.length) {
            const empty = document.createElement("p");
            empty.className = "muted empty-state";
            empty.textContent = "No symptoms match that search. Try a different word or clear the filter.";
            symptomListEl.appendChild(empty);
            updateSelectionSummary();
            return;
        }

        visible.forEach(sym => {
            const card = document.createElement("div");
            card.className = "symptom fade-in";
            card.dataset.id = sym.id;
            card.innerHTML = `
                <input class="sym-check" type="checkbox" id="sym-${sym.id}" value="${sym.id}" aria-label="${escapeHtml(sym.label)}" />
                <label class="sym-body" for="sym-${sym.id}">
                    <span class="sym-label">${escapeHtml(sym.label)}</span>
                    ${sym.help ? `<small class="sym-help">${escapeHtml(sym.help)}</small>` : ""}
                </label>
                <div class="intensity-seg" role="group" aria-label="Intensity for ${escapeHtml(sym.label)}" data-for="${sym.id}">
                    <button type="button" data-val="1" aria-pressed="false">Low</button>
                    <button type="button" data-val="2" aria-pressed="true" class="is-active">Med</button>
                    <button type="button" data-val="3" aria-pressed="false">High</button>
                </div>
            `;
            symptomListEl.appendChild(card);
        });

        // Restore checked state from current selection so re-rendering is safe
        updateSelectionSummary();
    }

    // Read the current selection from the DOM
    function getSelectedSymptomsWithWeights() {
        return els(".sym-check", symptomListEl)
            .filter(cb => cb.checked)
            .map(cb => {
                const card = cb.closest(".symptom");
                const seg = el(".intensity-seg", card);
                const active = seg ? el("button.is-active", seg) : null;
                const weight = active ? Number(active.dataset.val) : 2;
                return { id: cb.value, weight };
            });
    }

    // Update the selection summary strip
    function updateSelectionSummary() {
        const selected = getSelectedSymptomsWithWeights();
        selectionSummaryEl.innerHTML = "";

        // Refresh visual selected state on cards
        els(".symptom", symptomListEl).forEach(card => {
            const cb = el(".sym-check", card);
            card.classList.toggle("selected", !!(cb && cb.checked));
        });

        if (!selected.length) {
            selectionSummaryEl.classList.remove("has-selection");
            selectionSummaryEl.innerHTML =
                `<span class="sel-hint muted">Nothing selected yet. Pick anything that fits.</span>`;
            return;
        }

        selectionSummaryEl.classList.add("has-selection");

        const label = document.createElement("span");
        label.className = "sel-label";
        label.textContent = `${selected.length} selected`;
        selectionSummaryEl.appendChild(label);

        selected.forEach(item => {
            const sym = SYMPTOMS.find(s => s.id === item.id);
            if (!sym) return;
            const chip = document.createElement("button");
            chip.type = "button";
            chip.className = "sel-chip";
            chip.title = "Remove";
            chip.innerHTML =
                `${escapeHtml(sym.label)}<span class="sel-weight" aria-hidden="true">${item.weight}</span><span class="sel-x" aria-hidden="true">×</span>`;
            chip.addEventListener("click", () => {
                const cb = el(`#sym-${CSS.escape(item.id)}`, symptomListEl);
                if (cb) cb.checked = false;
                updateSelectionSummary();
                playSound("click");
            });
            selectionSummaryEl.appendChild(chip);
        });
    }

    // -------------------------------------------------------------------------
    // Analysis
    // -------------------------------------------------------------------------
    let lastAnalysis = null;

    function analyze(selected) {
        if (!selected || selected.length === 0) {
            resultSummary.innerHTML =
                `Nothing is selected yet. Pick anything that fits in <strong>Step 1</strong>, then press Analyze.`;
            suggestionsEl.innerHTML = "";
            patternInsightsEl.innerHTML =
                '<p class="muted">Patterns will appear here once you have saved a few entries.</p>';
            copyResultsBtn.hidden = true;
            return;
        }

        resultSummary.textContent = "Analyzing your selections…";
        suggestionsEl.innerHTML = '<div class="loading">Loading suggestions…</div>';
        copyResultsBtn.hidden = true;

        // Small async delay so the UI feels responsive
        setTimeout(() => {
            const tagScore = {};
            selected.forEach(item => {
                const s = SYMPTOMS.find(x => x.id === item.id);
                if (!s) return;
                (s.tags || []).forEach(tag => {
                    tagScore[tag] = (tagScore[tag] || 0) + item.weight;
                });
            });

            const totalScore = Object.values(tagScore).reduce((a, b) => a + b, 0);

            const entries = Object.keys(tagScore).map(tag => ({
                tag,
                score: tagScore[tag],
                info: TAGS[tag] || { name: tag, strategies: [], explanation: "" },
                percent: totalScore ? Math.round((tagScore[tag] / totalScore) * 100) : 0
            })).sort((a, b) => b.score - a.score);

            resultSummary.innerHTML =
                `Matched <strong>${selected.length}</strong> item${selected.length === 1 ? "" : "s"}. ` +
                `Top patterns: <strong>${entries.slice(0, 3).map(e => escapeHtml(e.info.name)).join(", ") || "none"}</strong>.`;

            suggestionsEl.innerHTML = "";
            if (!entries.length) return;

            entries.forEach(entry => {
                const card = document.createElement("article");
                card.className = "suggestion fade-in";
                card.innerHTML = `
                    <header class="suggestion-head">
                        <h3>${escapeHtml(entry.info.name)}</h3>
                        <span class="percent-badge" title="Relative weight">${entry.percent}%</span>
                    </header>
                    <p class="muted suggestion-explain">${escapeHtml(entry.info.explanation || "")}</p>
                    <ul class="strategies" aria-label="Strategies for ${escapeHtml(entry.info.name)}">
                        ${entry.info.strategies.map(s => `
                            <li class="strategy">
                                <button class="copy" type="button" data-copy="${escapeHtml(s)}" title="Copy strategy">Copy</button>
                                <span class="strategy-text">${escapeHtml(s)}</span>
                            </li>
                        `).join("")}
                    </ul>
                    <div class="taglist">
                        ${SYMPTOMS.filter(s => s.tags && s.tags.includes(entry.tag))
                        .slice(0, 8)
                        .map(s => `<span class="tag" data-sym="${escapeHtml(s.id)}">${escapeHtml(s.label)}</span>`)
                        .join("")}
                    </div>
                `;
                suggestionsEl.appendChild(card);
            });

            lastAnalysis = { entries, selected };
            copyResultsBtn.hidden = false;

            updatePatternInsights();
        }, 380);
    }

    function buildAnalysisText() {
        if (!lastAnalysis) return "";
        const lines = [];
        lines.push("Autism Regulog - check-in summary");
        lines.push("Selected: " + lastAnalysis.selected.map(s => {
            const sym = SYMPTOMS.find(x => x.id === s.id);
            return `${sym ? sym.label : s.id} (${s.weight})`;
        }).join(", "));
        lines.push("");
        lastAnalysis.entries.slice(0, 4).forEach(entry => {
            lines.push(`• ${entry.info.name} - ${entry.percent}%`);
            entry.info.strategies.slice(0, 3).forEach(st => lines.push(`   - ${st}`));
            lines.push("");
        });
        return lines.join("\n").trim();
    }

    // -------------------------------------------------------------------------
    // Pattern insights
    // -------------------------------------------------------------------------
    function updatePatternInsights() {
        const history = loadHistory();
        if (history.length < 3) {
            patternInsightsEl.innerHTML =
                '<p class="muted">Patterns will appear here once you have saved at least three entries.</p>';
            return;
        }

        const tagCooccurrence = {};
        history.forEach(entry => {
            const tags = new Set();
            entry.symptoms.forEach(s => {
                const symptom = SYMPTOMS.find(x => x.id === s.id);
                if (!symptom) return;
                (symptom.tags || []).forEach(tag => tags.add(tag));
            });
            const arr = Array.from(tags);
            for (let i = 0; i < arr.length; i++) {
                for (let j = i + 1; j < arr.length; j++) {
                    const pair = [arr[i], arr[j]].sort().join("|");
                    tagCooccurrence[pair] = (tagCooccurrence[pair] || 0) + 1;
                }
            }
        });

        const common = Object.entries(tagCooccurrence)
            .filter(([, count]) => count >= Math.max(2, Math.ceil(history.length * 0.25)))
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        patternInsightsEl.innerHTML = "";

        if (!common.length) {
            patternInsightsEl.innerHTML =
                '<p class="muted">No strong patterns detected yet. Keep checking in - patterns show up over time.</p>';
            return;
        }

        const heading = document.createElement("h4");
        heading.textContent = "Common combinations in your entries";
        patternInsightsEl.appendChild(heading);

        common.forEach(([pair, count]) => {
            const [t1, t2] = pair.split("|");
            const n1 = TAGS[t1]?.name || t1;
            const n2 = TAGS[t2]?.name || t2;
            const pct = Math.round((count / history.length) * 100);

            const item = document.createElement("div");
            item.className = "pattern-item fade-in";
            item.innerHTML = `
                <strong>${escapeHtml(n1)} + ${escapeHtml(n2)}</strong>
                <div class="muted">Appears in ${pct}% of your saved entries</div>
            `;
            patternInsightsEl.appendChild(item);
        });
    }

    // -------------------------------------------------------------------------
    // History
    // -------------------------------------------------------------------------
    function loadHistory() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error("Failed to load history", e);
            return [];
        }
    }

    function saveHistory(arr) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(arr || []));
        } catch (e) {
            console.error("Failed to save history", e);
            toast("Could not save - storage may be full.", { tone: "error" });
        }
        renderHistory();
    }

    function pushHistory(entry) {
        const settings = loadSettings();
        const arr = loadHistory();
        arr.unshift(entry);
        const limit = settings.maxHistory || DEFAULT_MAX_HISTORY;
        if (arr.length > limit) arr.length = limit;
        saveHistory(arr);
    }

    let historyVisibleCount = HISTORY_PAGE_SIZE;

    function renderHistory() {
        const arr = loadHistory();
        historyList.innerHTML = "";
        historyMoreEl.innerHTML = "";

        if (!arr.length) {
            historyList.innerHTML = `<div class="muted empty-state">No saved entries yet. Your check-ins will show up here.</div>`;
            drawTagChart();
            drawSymptomChart();
            return;
        }

        const visible = arr.slice(0, historyVisibleCount);

        visible.forEach((h, idx) => {
            const item = document.createElement("div");
            item.className = "hist-item fade-in";

            const labels = h.symptoms.map(s => {
                const sym = SYMPTOMS.find(x => x.id === s.id);
                const name = sym ? sym.label : s.id;
                const weight = s.weight > 1 ? ` • ${s.weight}` : "";
                return `<span class="tag" title="Intensity: ${s.weight}">${escapeHtml(name)}${weight}</span>`;
            }).join("");

            item.innerHTML = `
                <div class="hist-left">
                    <div class="hist-date">${fmtDate(h.ts)}</div>
                    <div class="hist-tags">${labels}</div>
                </div>
                <div class="hist-metadata">
                    <div class="hist-summary">${escapeHtml(h.summaryName || h.summary || "")}</div>
                    <button class="btn ghost small delete-entry" data-idx="${idx}" aria-label="Delete entry from ${fmtDate(h.ts)}">Delete</button>
                </div>
            `;
            historyList.appendChild(item);
        });

        if (arr.length > historyVisibleCount) {
            const remaining = arr.length - historyVisibleCount;
            const more = document.createElement("button");
            more.type = "button";
            more.className = "btn secondary";
            more.textContent = `Show ${Math.min(remaining, HISTORY_PAGE_SIZE)} more`;
            more.addEventListener("click", () => {
                historyVisibleCount += HISTORY_PAGE_SIZE;
                renderHistory();
            });
            historyMoreEl.appendChild(more);
        }

        els(".delete-entry", historyList).forEach(btn => {
            btn.addEventListener("click", async ev => {
                const idx = Number(btn.dataset.idx);
                const ok = await confirmDialog("Delete this saved entry? This cannot be undone.", {
                    title: "Delete entry",
                    okText: "Delete"
                });
                if (!ok) return;
                const fresh = loadHistory();
                fresh.splice(idx, 1);
                saveHistory(fresh);
                playSound("click");
                toast("Entry deleted.");
            });
        });

        drawTagChart();
        drawSymptomChart();
    }

    // -------------------------------------------------------------------------
    // Export / Import
    // -------------------------------------------------------------------------
    function downloadBlob(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    function exportCSV() {
        const arr = loadHistory();
        if (!arr.length) {
            toast("Nothing to export yet.", { tone: "error" });
            return;
        }
        const header = ["timestamp", "human_time", "selected_symptoms", "weights", "top_patterns"];
        const rows = arr.map(item => {
            const labels = item.symptoms.map(s => {
                const sym = SYMPTOMS.find(x => x.id === s.id);
                return sym ? sym.label : s.id;
            }).join("|");
            const weights = item.symptoms.map(s => s.weight).join("|");
            const top = item.summaryName || item.summary || "";
            const iso = new Date(item.ts).toISOString();
            return [
                iso,
                `"${fmtDate(item.ts)}"`,
                `"${escapeCsv(labels)}"`,
                `"${escapeCsv(weights)}"`,
                `"${escapeCsv(top)}"`
            ];
        });
        const csv = [header.join(","), ...rows.map(r => r.join(","))].join("\n");
        downloadBlob(csv, `autism-regulog-history-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
        toast("CSV exported.");
    }

    function exportJSON() {
        const arr = loadHistory();
        if (!arr.length) {
            toast("Nothing to export yet.", { tone: "error" });
            return;
        }
        const json = JSON.stringify(arr, null, 2);
        downloadBlob(json, `autism-regulog-history-${new Date().toISOString().slice(0, 10)}.json`, "application/json");
        toast("JSON exported.");
    }

    function importJSONFile(file) {
        const reader = new FileReader();
        reader.onload = ev => {
            try {
                const parsed = JSON.parse(ev.target.result);
                if (!Array.isArray(parsed)) throw new Error("Invalid format: expected an array");
                const existing = loadHistory();
                const map = new Map(existing.map(e => [e.ts, e]));
                parsed.forEach(p => {
                    if (p && p.ts && !map.has(p.ts)) map.set(p.ts, p);
                });
                const merged = Array.from(map.values()).sort((a, b) => b.ts - a.ts);
                saveHistory(merged);
                toast(`Imported ${parsed.length} entries (${merged.length} total).`, { tone: "success" });
            } catch (e) {
                console.error(e);
                toast("Import failed - the file was not a valid backup.", { tone: "error" });
            }
        };
        reader.readAsText(file);
    }

    // -------------------------------------------------------------------------
    // Summary tags (for saving)
    // -------------------------------------------------------------------------
    function deriveSummaryTagsWeighted(selected) {
        const tagScore = {};
        selected.forEach(item => {
            const s = SYMPTOMS.find(x => x.id === item.id);
            if (!s) return;
            (s.tags || []).forEach(tag => {
                tagScore[tag] = (tagScore[tag] || 0) + item.weight;
            });
        });
        return Object.keys(tagScore).sort((a, b) => tagScore[b] - tagScore[a]);
    }

    // -------------------------------------------------------------------------
    // Charts
    // -------------------------------------------------------------------------
    function chartPalette() {
        const dark = getCurrentTheme() === "dark";
        return {
            bg: dark ? "#1e293b" : "#ffffff",
            text: dark ? "#cbd5e1" : "#334155",
            track: dark ? "#334155" : "#eef2ff",
            accent: dark ? "#818cf8" : "#4f46e5",
            muted: dark ? "#64748b" : "#94a3b8"
        };
    }

    function prepCanvas(canvas) {
        const w = canvas.clientWidth || 400;
        const h = canvas.clientHeight || 220;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        const ctx = canvas.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        return { ctx, w, h };
    }

    function drawTagChart() {
        if (!tagChart) return;
        const { ctx, w, h } = prepCanvas(tagChart);
        const pal = chartPalette();
        ctx.fillStyle = pal.bg;
        ctx.fillRect(0, 0, w, h);

        const history = loadHistory();
        if (!history.length) {
            ctx.fillStyle = pal.muted;
            ctx.font = "13px system-ui, Arial";
            ctx.fillText("No history yet", 14, 24);
            return;
        }

        const agg = {};
        history.forEach(entry => {
            entry.symptoms.forEach(s => {
                const sym = SYMPTOMS.find(x => x.id === s.id);
                if (!sym) return;
                (sym.tags || []).forEach(tag => {
                    agg[tag] = (agg[tag] || 0) + (s.weight || 1);
                });
            });
        });

        const pairs = Object.keys(agg)
            .map(k => ({ name: TAGS[k]?.name || k, v: agg[k] }))
            .sort((a, b) => b.v - a.v)
            .slice(0, 6);

        if (!pairs.length) {
            ctx.fillStyle = pal.muted;
            ctx.font = "13px system-ui, Arial";
            ctx.fillText("No tag data yet", 14, 24);
            return;
        }

        const max = pairs[0].v || 1;
        const left = 110;
        const padding = 12;
        const barH = 20;
        const gap = 12;
        ctx.font = "12px system-ui, Arial";

        pairs.forEach((p, i) => {
            const y = padding + i * (barH + gap);
            ctx.fillStyle = pal.text;
            ctx.fillText(p.name.length > 18 ? p.name.slice(0, 17) + "…" : p.name, 8, y + barH - 5);

            ctx.fillStyle = pal.track;
            ctx.fillRect(left, y, w - left - padding, barH);

            const barW = Math.max(4, (w - left - padding) * (p.v / max));
            ctx.fillStyle = pal.accent;
            ctx.fillRect(left, y, barW, barH);
        });
    }

    function drawSymptomChart() {
        if (!symptomChart) return;
        const { ctx, w, h } = prepCanvas(symptomChart);
        const pal = chartPalette();
        ctx.fillStyle = pal.bg;
        ctx.fillRect(0, 0, w, h);

        const history = loadHistory();
        if (!history.length) {
            ctx.fillStyle = pal.muted;
            ctx.font = "13px system-ui, Arial";
            ctx.fillText("No symptom data yet", 14, 24);
            return;
        }

        const agg = {};
        history.forEach(entry => {
            entry.symptoms.forEach(s => {
                agg[s.id] = (agg[s.id] || 0) + 1;
            });
        });

        const pairs = Object.keys(agg)
            .map(k => {
                const sym = SYMPTOMS.find(s => s.id === k);
                return { name: sym ? sym.label : k, v: agg[k] };
            })
            .sort((a, b) => b.v - a.v)
            .slice(0, 8);

        if (!pairs.length) {
            ctx.fillStyle = pal.muted;
            ctx.font = "13px system-ui, Arial";
            ctx.fillText("No symptom data yet", 14, 24);
            return;
        }

        const max = pairs[0].v || 1;
        const left = 110;
        const padding = 12;
        const barH = 18;
        const gap = 10;
        ctx.font = "12px system-ui, Arial";

        pairs.forEach((p, i) => {
            const y = padding + i * (barH + gap);
            ctx.fillStyle = pal.text;
            ctx.fillText(p.name.length > 18 ? p.name.slice(0, 17) + "…" : p.name, 8, y + barH - 4);

            ctx.fillStyle = pal.track;
            ctx.fillRect(left, y, w - left - padding, barH);

            const barW = Math.max(4, (w - left - padding) * (p.v / max));
            ctx.fillStyle = pal.accent;
            ctx.fillRect(left, y, barW, barH);
        });
    }

    // -------------------------------------------------------------------------
    // Reminder notifications (opt-in)
    // -------------------------------------------------------------------------
    let reminderTimer = null;
    function refreshReminderTimer() {
        if (reminderTimer) {
            clearInterval(reminderTimer);
            reminderTimer = null;
        }
        const s = loadSettings();
        if (!s.enableNotifications) return;
        reminderTimer = setInterval(() => {
            toast("Gentle check-in - how are you feeling right now?", { duration: 4000 });
        }, 45 * 60 * 1000);
    }

    // -------------------------------------------------------------------------
    // Event wiring
    // -------------------------------------------------------------------------
    function wire() {
        renderGroupFilter();
        renderSymptomList();
        renderHistory();
        updateSelectionSummary();

        // Checkbox toggles from label/input
        symptomListEl.addEventListener("change", ev => {
            if (ev.target && ev.target.classList.contains("sym-check")) {
                updateSelectionSummary();
                playSound("click");
            }
        });

        // Clicking anywhere on the card (except the intensity buttons) toggles selection
        symptomListEl.addEventListener("click", ev => {
            const seg = ev.target.closest(".intensity-seg");
            const btn = ev.target.closest("button[data-val]");

            if (seg && btn) {
                const id = seg.dataset.for;
                const card = seg.closest(".symptom");
                const cb = el(".sym-check", card);

                els("button", seg).forEach(b => {
                    const active = b === btn;
                    b.classList.toggle("is-active", active);
                    b.setAttribute("aria-pressed", active ? "true" : "false");
                });

                // Selecting an intensity should also check the symptom
                if (cb && !cb.checked) {
                    cb.checked = true;
                }
                updateSelectionSummary();
                playSound("click");
                return;
            }

            const card = ev.target.closest(".symptom");
            if (!card) return;
            // Ignore clicks on the checkbox itself or the label (the browser handles those)
            if (ev.target.closest("input") || ev.target.closest("label")) return;

            const cb = el(".sym-check", card);
            if (!cb) return;
            cb.checked = !cb.checked;
            updateSelectionSummary();
            playSound("click");
        });

        // Copy strategy buttons + tag-click copy
        suggestionsEl.addEventListener("click", ev => {
            const copyBtn = ev.target.closest("button.copy");
            if (copyBtn) {
                const text = copyBtn.dataset.copy || "";
                navigator.clipboard?.writeText(text).then(() => {
                    copyBtn.textContent = "Copied";
                    copyBtn.classList.add("is-copied");
                    setTimeout(() => {
                        copyBtn.textContent = "Copy";
                        copyBtn.classList.remove("is-copied");
                    }, 900);
                }).catch(() => { });
                return;
            }

            const tag = ev.target.closest(".tag");
            if (!tag) return;
            const symId = tag.dataset.sym;
            const sym = symId && SYMPTOMS.find(s => s.id === symId);
            if (!sym) return;
            navigator.clipboard?.writeText(sym.label).then(() => {
                tag.classList.add("is-copied");
                setTimeout(() => tag.classList.remove("is-copied"), 400);
            }).catch(() => { });
        });

        // Copy full analysis summary
        copyResultsBtn.addEventListener("click", () => {
            const text = buildAnalysisText();
            if (!text) return;
            navigator.clipboard?.writeText(text).then(() => {
                toast("Summary copied to clipboard.", { tone: "success" });
            }).catch(() => {
                toast("Could not copy - try selecting the text manually.", { tone: "error" });
            });
        });

        // Analyze
        analyzeBtn.addEventListener("click", () => {
            const sel = getSelectedSymptomsWithWeights();
            analyze(sel);
        });

        // Save
        saveBtn.addEventListener("click", () => {
            const sel = getSelectedSymptomsWithWeights();
            if (!sel.length) {
                toast("Select at least one symptom before saving.", { tone: "error" });
                return;
            }
            const tags = deriveSummaryTagsWeighted(sel);
            const summaryName = tags.slice(0, 3).map(t => TAGS[t] ? TAGS[t].name : t).join(", ");

            pushHistory({
                ts: Date.now(),
                symptoms: sel,
                summary: tags.join(", "),
                summaryName
            });

            playSound("success");
            toast("Saved to your history.", { tone: "success" });
            resultSummary.innerHTML = `Saved this check-in - <strong>${escapeHtml(summaryName || "no pattern detected")}</strong>.`;
        });

        // Clear selections
        clearBtn.addEventListener("click", () => {
            els(".sym-check", symptomListEl).forEach(cb => { cb.checked = false; });
            els(".intensity-seg", symptomListEl).forEach(seg => {
                els("button", seg).forEach((b, i) => {
                    const active = b.dataset.val === "2";
                    b.classList.toggle("is-active", active);
                    b.setAttribute("aria-pressed", active ? "true" : "false");
                });
            });
            searchInput.value = "";
            activeGroup = "all";
            els(".chip", groupFilterEl).forEach(c => {
                const isActive = c.dataset.group === "all";
                c.classList.toggle("is-active", isActive);
                c.setAttribute("aria-pressed", isActive ? "true" : "false");
            });
            renderSymptomList();
            updateSelectionSummary();
            resultSummary.innerHTML =
                `Selections cleared. Pick anything that fits, then press <strong>Analyze</strong>.`;
            suggestionsEl.innerHTML = "";
            patternInsightsEl.innerHTML =
                '<p class="muted">Patterns will appear here once you have saved a few entries.</p>';
            copyResultsBtn.hidden = true;
            lastAnalysis = null;
        });

        // Search
        searchInput.addEventListener("input", e => renderSymptomList(e.target.value));

        // Clear all history
        clearHistoryBtn.addEventListener("click", async () => {
            const ok = await confirmDialog(
                "Remove all saved entries? This cannot be undone. Export a backup first if you want to keep them.",
                { title: "Clear history", okText: "Delete everything" }
            );
            if (!ok) return;
            try { localStorage.removeItem(STORAGE_KEY); } catch (e) { }
            historyVisibleCount = HISTORY_PAGE_SIZE;
            renderHistory();
            toast("History cleared.");
        });

        // Export / Import
        exportCsvBtn.addEventListener("click", exportCSV);
        exportJsonBtn.addEventListener("click", exportJSON);
        importJsonBtn.addEventListener("click", () => {
            fileInput.value = "";
            fileInput.click();
        });
        fileInput.addEventListener("change", async ev => {
            const f = ev.target.files && ev.target.files[0];
            if (!f) return;
            const ok = await confirmDialog(
                "Importing will merge these entries into your local history. Continue?",
                { title: "Import backup", okText: "Merge" }
            );
            if (!ok) return;
            importJSONFile(f);
        });

        // Theme toggle
        themeBtn.addEventListener("click", () => {
            const next = getCurrentTheme() === "dark" ? "light" : "dark";
            applyTheme(next);
            playSound("click");
        });

        // Help dialog
        helpBtn.addEventListener("click", () => helpDialog.showModal());
        if (closeHelpBtn) {
            closeHelpBtn.addEventListener("click", () => helpDialog.close());
        }

        // Settings dialog
        openSettingsBtn.addEventListener("click", () => {
            const s = loadSettings();
            maxHistoryInput.value = s.maxHistory || DEFAULT_MAX_HISTORY;
            enableNotifications.checked = s.enableNotifications;
            enableSounds.checked = s.enableSounds;
            settingsDialog.showModal();
        });

        // Settings save (button has value="save" inside form method="dialog")
        settingsDialog.addEventListener("close", () => {
            if (settingsDialog.returnValue !== "save") return;
            const val = Math.max(5, Math.min(10000, Number(maxHistoryInput.value) || DEFAULT_MAX_HISTORY));
            saveSettings({
                maxHistory: val,
                enableNotifications: enableNotifications.checked,
                enableSounds: enableSounds.checked
            });
            refreshReminderTimer();
            renderHistory();
            toast("Settings saved.", { tone: "success" });
        });

        // Keyboard shortcuts
        document.addEventListener("keydown", ev => {
            // "/" focuses search unless typing in a field
            if (ev.key === "/" && !ev.ctrlKey && !ev.metaKey) {
                const t = ev.target;
                const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
                if (!typing) {
                    ev.preventDefault();
                    searchInput.focus();
                }
            }
            // Ctrl/Cmd + Enter triggers Analyze
            if ((ev.ctrlKey || ev.metaKey) && ev.key === "Enter") {
                const sel = getSelectedSymptomsWithWeights();
                if (sel.length) {
                    ev.preventDefault();
                    analyze(sel);
                }
            }
        });

        // Resize: redraw charts
        let resizeTimer;
        window.addEventListener("resize", () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                drawTagChart();
                drawSymptomChart();
            }, 120);
        });

        // Initial reminder timer
        refreshReminderTimer();
    }

    // -------------------------------------------------------------------------
    // Boot
    // -------------------------------------------------------------------------
    function boot() {
        // Ensure theme is set (the inline script in <head> already did this,
        // but we sync the toggle button state here).
        const theme = getCurrentTheme();
        applyTheme(theme);

        wire();

        setTimeout(() => {
            drawTagChart();
            drawSymptomChart();
        }, 80);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})();