(() => {
    // ----- config + data -----
    const STORAGE_KEY = "autism-tracker-history-v3";
    const DEFAULT_MAX_HISTORY = 200;

    // Emotions for the emotion grid
    const EMOTIONS = [
        { id: "happy", label: "Happy", color: "#FFD166", tags: ["positive"] },
        { id: "calm", label: "Calm", color: "#06D6A0", tags: ["positive", "regulated"] },
        { id: "content", label: "Content", color: "#118AB2", tags: ["positive"] },
        { id: "excited", label: "Excited", color: "#EF476F", tags: ["positive", "high-arousal"] },
        { id: "anxious", label: "Anxious", color: "#FF9E64", tags: ["anxiety", "stress"] },
        { id: "overwhelmed", label: "Overwhelmed", color: "#9B5DE5", tags: ["sensory", "stress", "overload"] },
        { id: "frustrated", label: "Frustrated", color: "#F15BB5", tags: ["stress", "irritable"] },
        { id: "angry", label: "Angry", color: "#CE4257", tags: ["stress", "meltdown"] },
        { id: "sad", label: "Sad", color: "#7209B7", tags: ["withdrawn"] },
        { id: "tired", label: "Tired", color: "#4CC9F0", tags: ["fatigue"] },
        { id: "numb", label: "Numb", color: "#4361EE", tags: ["shutdown"] },
        { id: "confused", label: "Confused", color: "#3A0CA3", tags: ["executive-function"] }
    ];

    // symptoms: id, label, tags, optional help
    const SYMPTOMS = [
        { id: "tired", label: "Tired / sleepy", tags: ["fatigue"] },
        { id: "poor-sleep", label: "Poor sleep last night", tags: ["fatigue"] },
        { id: "hungry", label: "Hungry", tags: ["basic-needs"] },
        { id: "loss-appetite", label: "Loss of appetite", tags: ["basic-needs"] },
        { id: "dehydration", label: "Thirst / dehydrated", tags: ["basic-needs","physiological"] },
        { id: "overwhelmed", label: "Feeling overwhelmed", tags: ["sensory","stress"] },
        { id: "sensory-noise", label: "Too much noise / loud", tags: ["sensory"] },
        { id: "sensory-light", label: "Bright lights / visual clutter", tags: ["sensory"] },
        { id: "sensory-smell", label: "Sensitive to smells", tags: ["sensory"] },
        { id: "hot-sweaty", label: "Hot / sweaty", tags: ["sensory","physiological"] },
        { id: "cold", label: "Feeling cold / chills", tags: ["sensory","physiological"] },
        { id: "stomach", label: "Stomach pain / nausea", tags: ["physiological"] },
        { id: "headache", label: "Headache / migraine", tags: ["physiological"] },
        { id: "irritable", label: "Irritable / short temper", tags: ["stress","overload"] },
        { id: "shutdown", label: "Shutting down / blanking out", tags: ["shutdown","overload"] },
        { id: "meltdown", label: "Meltdown / intense distress", tags: ["meltdown","overload"] },
        { id: "low-focus", label: "Trouble focusing", tags: ["executive-function","fatigue"] },
        { id: "slow-thoughts", label: "Slow thoughts / fuzzy", tags: ["fatigue","executive-function"] },
        { id: "sensory-touch", label: "Touch causes discomfort", tags: ["sensory"] },
        { id: "ruminating", label: "Ruminating / stuck thoughts", tags: ["anxiety"] },
        { id: "panic", label: "Panic / racing heart", tags: ["anxiety","physiological"] },
        { id: "withdrawn", label: "Wanting to withdraw / hide", tags: ["shutdown","stress"] },
        { id: "overstimulation", label: "Overstimulated after social time", tags: ["sensory","social-fatigue"] },
        { id: "verbal-communication", label: "Difficulty with verbal communication", tags: ["shutdown", "social-fatigue"] },
        { id: "eye-contact", label: "Avoiding eye contact", tags: ["social-fatigue"] },
        { id: "stimming", label: "Increased stimming", tags: ["self-regulation"] },
        { id: "repetitive-behaviors", label: "Increased repetitive behaviors", tags: ["self-regulation"] },
        { id: "special-interests", label: "Focused on special interests", tags: ["self-regulation", "positive"] },
        { id: "time-blindness", label: "Time blindness / losing track of time", tags: ["executive-function"] },
        { id: "task-initiation", label: "Difficulty starting tasks", tags: ["executive-function"] },
        { id: "transitions", label: "Difficulty with transitions", tags: ["executive-function"] },
        { id: "interoception", label: "Trouble sensing bodily needs", tags: ["interoception"] },
        { id: "proprioception", label: "Seeking or avoiding physical pressure", tags: ["proprioception"] }
    ];

    const TAGS = {
        "sensory": {
            name: "Sensory overload",
            strategies: [
                "Find a quieter, darker space.",
                "Use noise-cancelling headphones or earplugs.",
                "Try deep pressure: weighted blanket or tight shirt if comfortable.",
                "Allow stimming: fidget toys or movement.",
                "Use a cold cloth or fan to regulate temperature.",
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
                "Break tasks into 5-minute steps.",
                "Lower demands and deprioritize non-essential tasks.",
                "Use a energy management system like spoon theory.",
                "Schedule rest breaks before you need them.",
                "Consider if you're experiencing autistic burnout."
            ],
            explanation: "Low energy affects focus and tolerance. Small rests and nutrition often help."
        },
        "basic-needs": {
            name: "Basic needs (hunger, thirst)",
            strategies: [
                "Eat a small, familiar snack.",
                "Drink water or a favoured drink.",
                "Avoid heavy new foods during distress.",
                "Set reminders to eat and drink regularly.",
                "Keep safe foods readily available.",
                "Use visual cues for meal times."
            ],
            explanation: "Often physical needs drive emotional responses. Meeting them first is low-effort and effective."
        },
        "stress": {
            name: "Stress / overload",
            strategies: [
                "Use grounding: name 5 things you can see/hear/feel.",
                "Try slow box breathing: 4 in, 4 hold, 4 out, 4 hold.",
                "Simplify the environment and reduce decisions.",
                "Send a short, honest message if needing space.",
                "Use a stress scale to identify your level.",
                "Practice progressive muscle relaxation.",
                "Use a worry jar to externalize concerns."
            ],
            explanation: "Acute stress lowers tolerance. Grounding and simple choices reduce load."
        },
        "executive-function": {
            name: "Executive difficulty (planning, focus)",
            strategies: [
                "Do a 5-minute timer task — short bursts help.",
                "Write a tiny next-step checklist.",
                "Remove distractions — phone away or on focus mode.",
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
                "If physical symptoms are severe contact a medical professional.",
                "Use soothing positions and paced breathing.",
                "Practice interoception exercises to better sense bodily signals.",
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
                "Practice radical acceptance of anxious feelings.",
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
                "Savor and acknowledge positive moments.",
                "Engage in special interests or hobbies.",
                "Share your joy with understanding people.",
                "Note what contributed to positive feelings for future reference.",
                "Practice gratitude for small wins."
            ],
            explanation: "Recognizing and extending positive states helps build resilience."
        },
        "regulated": {
            name: "Well-regulated",
            strategies: [
                "Note what's working well for future reference.",
                "Engage in preventative self-care.",
                "Tackle challenging tasks while regulated.",
                "Share strategies that are working with support system.",
                "Plan for upcoming challenges while in this state."
            ],
            explanation: "Being well-regulated is an opportunity for proactive planning."
        },
        "self-regulation": {
            name: "Self-regulation strategies",
            strategies: [
                "Use stimming as a regulation tool.",
                "Engage in special interests for enjoyment and calm.",
                "Practice mindfulness or meditation.",
                "Use fidget tools or sensory items.",
                "Create a personalized self-regulation toolkit."
            ],
            explanation: "Self-regulation strategies help maintain equilibrium."
        },
        "interoception": {
            name: "Interoception awareness",
            strategies: [
                "Practice body scanning to notice sensations.",
                "Use visual cues for hunger, thirst, bathroom needs.",
                "Set regular timers for checking in with your body.",
                "Keep a log of bodily sensations and their meanings.",
                "Work with an occupational therapist on interoception."
            ],
            explanation: "Interoception is the sense of internal bodily states which can be challenging for autistic people."
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
            explanation: "Proprioception refers to awareness of body position and movement which can need regulation."
        }
    };

    // ----- helpers -----
    const el = (sel, root = document) => root.querySelector(sel);
    const els = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const fmtDate = ts => new Date(ts).toLocaleString();

    // ----- DOM refs -----
    const emotionGridEl = el("#emotion-grid");
    const resetEmotionsBtn = el("#reset-emotions");
    const selectedEmotionsEl = el("#selected-emotions");
    const symptomListEl = el("#symptom-list");
    const analyzeBtn = el("#analyze-btn");
    const saveBtn = el("#save-btn");
    const resultSummary = el("#result-summary");
    const suggestionsEl = el("#suggestions");
    const patternInsightsEl = el("#pattern-insights");
    const historyList = el("#history-list");
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
    const maxHistoryInput = el("#max-history");
    const enableNotifications = el("#enable-notifications");
    const enableSounds = el("#enable-sounds");
    const saveSettingsBtn = el("#save-settings");
    const closeSettingsBtn = el("#close-settings");
    const closeHelpBtn = el("#close-help");
    const tagChart = el("#tag-chart");
    const emotionChart = el("#emotion-chart");

    // ----- state -----
    let selectedEmotions = [];

    // settings storage
    function loadSettings() {
        try {
            const raw = localStorage.getItem(`${STORAGE_KEY}-settings`);
            const parsed = raw ? JSON.parse(raw) : {};
            return {
                maxHistory: parsed.maxHistory || DEFAULT_MAX_HISTORY,
                enableNotifications: parsed.enableNotifications || false,
                enableSounds: parsed.enableSounds || false
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
        localStorage.setItem(`${STORAGE_KEY}-settings`, JSON.stringify(obj));
    }

    // ----- emotion grid -----
    function renderEmotionGrid() {
        emotionGridEl.innerHTML = "";

        EMOTIONS.forEach((emotion) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "emotion-btn";
            button.textContent = emotion.label;
            button.style.backgroundColor = emotion.color;
            button.dataset.emotionId = emotion.id;

            button.addEventListener("click", () => toggleEmotion(emotion.id));

            emotionGridEl.appendChild(button);
        });
    }

    function toggleEmotion(emotionId) {
        const emotion = EMOTIONS.find(e => e.id === emotionId);
        if (!emotion) return;

        const index = selectedEmotions.findIndex(e => e.id === emotionId);
        const button = el(`[data-emotion-id="${emotionId}"]`);

        if (index === -1) {
            // Add emotion
            selectedEmotions.push(emotion);
            button.classList.add("selected");

            // Add animation
            button.style.animation = "pulse 0.5s ease";
            setTimeout(() => {
                button.style.animation = "";
            }, 500);
        } else {
            // Remove emotion
            selectedEmotions.splice(index, 1);
            button.classList.remove("selected");
        }

        updateSelectedEmotionsDisplay();

        // Play sound if enabled
        const settings = loadSettings();
        if (settings.enableSounds) {
            playSound("click");
        }
    }

    function updateSelectedEmotionsDisplay() {
        selectedEmotionsEl.innerHTML = "";

        if (selectedEmotions.length === 0) {
            selectedEmotionsEl.innerHTML = '<p class="muted">No emotions selected</p>';
            return;
        }

        selectedEmotions.forEach(emotion => {
            const tag = document.createElement("div");
            tag.className = "emotion-tag";
            tag.innerHTML = `
                ${emotion.label}
                <button type="button" aria-label="Remove ${emotion.label}">×</button>
            `;
            tag.style.backgroundColor = emotion.color;

            const removeBtn = tag.querySelector("button");
            removeBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                toggleEmotion(emotion.id);
            });

            selectedEmotionsEl.appendChild(tag);
        });
    }

    function resetEmotions() {
        selectedEmotions = [];
        els(".emotion-btn").forEach(button => {
            button.classList.remove("selected");
        });
        updateSelectedEmotionsDisplay();
    }

    // ----- render symptom list (with intensity control) -----
    function renderSymptomList(filter = "") {
        symptomListEl.innerHTML = "";
        const q = filter.trim().toLowerCase();
        SYMPTOMS.forEach(sym => {
            if (q && !(sym.label.toLowerCase().includes(q) || (sym.tags || []).join(" ").includes(q))) return;
            const wrapper = document.createElement("div");
            wrapper.className = "symptom fade-in";
            wrapper.innerHTML = `
        <div class="symptom-left">
          <input id="sym-${sym.id}" type="checkbox" name="symptom" value="${sym.id}" aria-label="${sym.label}" />
        </div>
        <div style="flex:1">
          <label for="sym-${sym.id}">${sym.label}</label>
          ${sym.help ? `<small>${sym.help}</small>` : ""}
        </div>
        <div>
          <label class="muted" for="intensity-${sym.id}" style="font-size:0.8rem">Intensity</label>
          <select id="intensity-${sym.id}" class="intensity" aria-label="Intensity for ${sym.label}" disabled>
            <option value="1">Low</option>
            <option value="2" selected>Medium</option>
            <option value="3">High</option>
          </select>
        </div>
      `;
            symptomListEl.appendChild(wrapper);
        });
    }

    // ----- selection helpers -----
    function getSelectedSymptomsWithWeights() {
        return els("input[name='symptom']:checked", symptomListEl).map(cb => {
            const id = cb.value;
            const select = el(`#intensity-${id}`, symptomListEl);
            const weight = select ? Number(select.value) : 1;
            return { id, weight };
        });
    }

    function getAllSelectedItems() {
        const symptoms = getSelectedSymptomsWithWeights();
        const emotions = selectedEmotions.map(emotion => {
            return {
                id: emotion.id,
                weight: 1,
                type: 'emotion',
                tags: emotion.tags
            };
        });

        return [...symptoms, ...emotions];
    }

    // ----- analysis logic (weighted) -----
    function analyze(selected) {
        if (!selected || selected.length === 0) {
            resultSummary.textContent = "No symptoms or emotions selected. Choose items and press Analyze.";
            suggestionsEl.innerHTML = "";
            patternInsightsEl.innerHTML = '<p class="muted">Pattern insights will appear here after multiple entries.</p>';
            return;
        }

        // aggregate tag weights
        const tagScore = {};
        selected.forEach((item) => {
            let tags = [];

            if (item.type === 'emotion') {
                tags = item.tags;
            } else {
                const s = SYMPTOMS.find(x => x.id === item.id);
                if (s) tags = s.tags || [];
            }

            tags.forEach(tag => {
                tagScore[tag] = (tagScore[tag] || 0) + item.weight;
            });
        });

        const totalScore = Object.values(tagScore).reduce((a,b) => a + b, 0);

        const entries = Object.keys(tagScore).map(tag => {
            return {
                tag,
                score: tagScore[tag],
                info: TAGS[tag] || { name: tag, strategies: [], explanation: "" },
                percent: totalScore ? Math.round((tagScore[tag] / totalScore) * 100) : 0
            };
        }).sort((a,b) => b.score - a.score);

        const emotionLabels = selectedEmotions.map(e => e.label).join(", ");
        const symptomCount = selected.filter(s => !s.type).length;

        resultSummary.textContent = `Matched ${symptomCount} symptom(s) and ${selectedEmotions.length} emotion(s). Top patterns: ${entries.slice(0,3).map(e => e.info.name).join(", ") || "None"}.`;

        // render suggestions
        suggestionsEl.innerHTML = "";
        if (entries.length === 0) return;

        entries.forEach(entry => {
            const card = document.createElement("article");
            card.className = "suggestion fade-in";
            card.innerHTML = `
        <h3>
          <span>${escapeHtml(entry.info.name)}</span>
          <span class="percent-badge" title="Relative confidence">${entry.percent}%</span>
        </h3>
        <p class="muted">${escapeHtml(entry.info.explanation || "")}</p>
        <ul aria-label="Strategies for ${escapeHtml(entry.info.name)}" class="strategies">
          ${entry.info.strategies.map(s => `<li class="strategy"><button class="copy btn" data-copy="${escapeHtml(s)}" title="Copy strategy">Copy</button><span style="margin-left:8px">${escapeHtml(s)}</span></li>`).join("")}
        </ul>
        <div class="taglist">
          ${SYMPTOMS.filter(s => s.tags && s.tags.includes(entry.tag))
            .slice(0,6)
            .map(s => `<span class="tag" data-sym="${escapeHtml(s.id)}">${escapeHtml(s.label)}</span>`)
            .join("")}
          ${EMOTIONS.filter(e => e.tags && e.tags.includes(entry.tag))
            .map(e => `<span class="tag" style="background:${e.color};color:white" data-emotion="${escapeHtml(e.id)}">${escapeHtml(e.label)}</span>`)
            .join("")}
        </div>
      `;
            suggestionsEl.appendChild(card);
        });

        // Update pattern insights
        updatePatternInsights();
    }

    function updatePatternInsights() {
        const history = loadHistory();
        if (history.length < 3) {
            patternInsightsEl.innerHTML = '<p class="muted">Pattern insights will appear here after multiple entries.</p>';
            return;
        }

        // Simple pattern detection - look for frequently co-occurring tags
        const tagCooccurrence = {};
        const emotionFrequency = {};

        history.forEach(entry => {
            const tags = new Set();

            // Get all tags from symptoms and emotions in this entry
            entry.symptoms.forEach(s => {
                const symptom = SYMPTOMS.find(x => x.id === s.id);
                if (symptom) {
                    symptom.tags.forEach(tag => tags.add(tag));
                }
            });

            if (entry.emotions) {
                entry.emotions.forEach(emotionId => {
                    const emotion = EMOTIONS.find(e => e.id === emotionId);
                    if (emotion) {
                        emotion.tags.forEach(tag => tags.add(tag));
                        emotionFrequency[emotionId] = (emotionFrequency[emotionId] || 0) + 1;
                    }
                });
            }

            // Update co-occurrence counts
            const tagArray = Array.from(tags);
            for (let i = 0; i < tagArray.length; i++) {
                for (let j = i + 1; j < tagArray.length; j++) {
                    const pair = [tagArray[i], tagArray[j]].sort().join('|');
                    tagCooccurrence[pair] = (tagCooccurrence[pair] || 0) + 1;
                }
            }
        });

        // Find the most common co-occurrences
        const commonPatterns = Object.entries(tagCooccurrence)
            .filter(([_, count]) => count > history.length * 0.3) // At least 30% of entries
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        patternInsightsEl.innerHTML = "";

        if (commonPatterns.length === 0) {
            patternInsightsEl.innerHTML = '<p class="muted">No strong patterns detected yet. Continue tracking to see insights.</p>';
            return;
        }

        patternInsightsEl.innerHTML = '<h4>Common Patterns in Your Data</h4>';

        commonPatterns.forEach(([pair, count]) => {
            const [tag1, tag2] = pair.split('|');
            const tag1Name = TAGS[tag1] ? TAGS[tag1].name : tag1;
            const tag2Name = TAGS[tag2] ? TAGS[tag2].name : tag2;

            const patternEl = document.createElement("div");
            patternEl.className = "pattern-item";
            patternEl.innerHTML = `
                <strong>${tag1Name} + ${tag2Name}</strong>
                <div class="muted">Occurs in ${Math.round(count/history.length * 100)}% of your entries</div>
            `;
            patternInsightsEl.appendChild(patternEl);
        });
    }

    // ----- history management -----
    function loadHistory() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error("Failed to load history", e);
            return [];
        }
    }
    function saveHistory(arr) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(arr || []));
        renderHistory();
    }
    function pushHistory(entry) {
        const settings = loadSettings();
        const arr = loadHistory();
        arr.unshift(entry);
        // enforce max history
        if (arr.length > (settings.maxHistory || DEFAULT_MAX_HISTORY)) {
            arr.splice((settings.maxHistory || DEFAULT_MAX_HISTORY));
        }
        saveHistory(arr);
    }

    function renderHistory() {
        const arr = loadHistory();
        historyList.innerHTML = "";
        if (!arr.length) {
            historyList.innerHTML = `<div class="muted">No saved entries yet. Save entries with the Save button.</div>`;
            drawTagChart();
            drawEmotionChart();
            return;
        }

        arr.forEach((h, idx) => {
            const item = document.createElement("div");
            item.className = "hist-item fade-in";
            const emotionLabels = h.emotions ? h.emotions.map(id => {
                const emotion = EMOTIONS.find(e => e.id === id);
                return emotion ? emotion.label : id;
            }).join(", ") : "";

            item.innerHTML = `
        <div class="hist-left">
          <div style="font-weight:700">${fmtDate(h.ts)}</div>
          <div class="hist-tags">${h.symptoms.map(s => {
                const sym = SYMPTOMS.find(x => x.id === s.id);
                return `<span class="tag" title="Intensity: ${s.weight}">${escapeHtml(sym ? sym.label : s.id)}${s.weight>1?` • ${s.weight}`:""}</span>`;
            }).join("")}</div>
          ${emotionLabels ? `<div class="hist-tags" style="margin-top:6px">${h.emotions.map(id => {
            const emotion = EMOTIONS.find(e => e.id === id);
            return `<span class="tag" style="background:${emotion ? emotion.color : '#6b7280'};color:white">${emotion ? emotion.label : id}</span>`;
        }).join("")}</div>` : ''}
        </div>
        <div class="hist-metadata" style="text-align:right">
          <div style="font-weight:700">${escapeHtml(h.summaryName || h.summary || "")}</div>
          <div class="muted" style="margin-top:8px">
            <button class="btn small delete-entry" data-idx="${idx}" aria-label="Delete entry ${idx}">Delete</button>
          </div>
        </div>
      `;
        historyList.appendChild(item);
    });

// attach delete handlers via delegation
els(".delete-entry", historyList).forEach(btn => {
    btn.addEventListener("click", ev => {
        const idx = Number(btn.dataset.idx);
        if (!confirm("Delete this saved entry? This cannot be undone.")) return;
        const arr = loadHistory();
        arr.splice(idx, 1);
        saveHistory(arr);
    });
});

drawTagChart();
drawEmotionChart();
}

// ----- export CSV & JSON -----
function exportCSV() {
const arr = loadHistory();
if (!arr.length) { alert("No history to export."); return; }
const header = ["timestamp","human_time","selected_symptoms","weights","emotions","top_patterns"];
const rows = arr.map(item => {
const labels = item.symptoms.map(s => {
const sym = SYMPTOMS.find(x => x.id === s.id);
return (sym ? sym.label : s.id);
}).join("|");
const weights = item.symptoms.map(s => s.weight).join("|");
const emotions = item.emotions ? item.emotions.map(id => {
const emotion = EMOTIONS.find(e => e.id === id);
return emotion ? emotion.label : id;
}).join("|") : "";
const top = (item.summaryName || item.summary || "");
const iso = new Date(item.ts).toISOString();
return [iso, `"${fmtDate(item.ts)}"`, `"${escapeCsv(labels)}"`, `"${escapeCsv(weights)}"`, `"${escapeCsv(emotions)}"`, `"${escapeCsv(top)}"`];
});
const csv = [header.join(","), ...rows.map(r => r.join(","))].join("\n");
downloadBlob(csv, `autism-tracker-history-${new Date().toISOString().slice(0,10)}.csv`, "text/csv");
}

function exportJSON() {
const arr = loadHistory();
if (!arr.length) { alert("No history to export."); return; }
const json = JSON.stringify(arr, null, 2);
downloadBlob(json, `autism-tracker-history-${new Date().toISOString().slice(0,10)}.json`, "application/json");
}

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

// import JSON (merge)
function importJSONFile(file) {
const reader = new FileReader();
reader.onload = ev => {
try {
const parsed = JSON.parse(ev.target.result);
if (!Array.isArray(parsed)) throw new Error("Invalid JSON format: expected an array");
const existing = loadHistory();
// merge but avoid duplicates by timestamp
const map = new Map(existing.map(e => [e.ts, e]));
parsed.forEach(p => {
if (!map.has(p.ts)) map.set(p.ts, p);
});
const merged = Array.from(map.values()).sort((a,b) => b.ts - a.ts);
saveHistory(merged);
alert(`Imported ${parsed.length} entries. Merged into ${merged.length} total.`);
} catch (e) {
alert("Failed to import JSON. Make sure it is a valid backup file.");
console.error(e);
}
};
reader.readAsText(file);
}

// ----- utility functions -----
function deriveSummaryTagsWeighted(selected) {
const tagScore = {};
selected.forEach((item) => {
let tags = [];

if (item.type === 'emotion') {
tags = item.tags;
} else {
const s = SYMPTOMS.find(x => x.id === item.id);
if (s) tags = s.tags || [];
}

tags.forEach(tag => tagScore[tag] = (tagScore[tag] || 0) + item.weight);
});
return Object.keys(tagScore).sort((a,b) => tagScore[b] - tagScore[a]);
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m])); }
function escapeCsv(s){ return String(s).replace(/"/g,'""'); }

function playSound(type) {
// In a real app, you would play actual sound files
// This is a placeholder for sound functionality
console.log(`Playing ${type} sound`);
}

// ----- chart drawing -----
function drawTagChart() {
const ctx = tagChart.getContext("2d");
const history = loadHistory();
// clear
ctx.clearRect(0,0,tagChart.width,tagChart.height);

if (!history.length) {
ctx.fillStyle = "#6b7280";
ctx.font = "14px system-ui, Arial";
ctx.fillText("No history yet", 14, 24);
return;
}

// aggregate tag counts across history (sum of weights)
const agg = {};
history.forEach(entry => {
entry.symptoms.forEach(s => {
const sym = SYMPTOMS.find(x => x.id === s.id);
if (!sym) return;
(sym.tags || []).forEach(tag => agg[tag] = (agg[tag] || 0) + s.weight);
});

if (entry.emotions) {
entry.emotions.forEach(emotionId => {
const emotion = EMOTIONS.find(e => e.id === emotionId);
if (emotion) {
emotion.tags.forEach(tag => agg[tag] = (agg[tag] || 0) + 1);
}
});
}
});

const pairs = Object.keys(agg).map(k => ({ tag:k, name:(TAGS[k]?.name || k), v:agg[k] })).sort((a,b)=>b.v-a.v);
const top = pairs.slice(0,6);
const max = top[0]?.v || 1;

// drawing
const padding = 12;
const w = tagChart.clientWidth;
const h = Math.max(120, tagChart.clientHeight);
tagChart.width = Math.floor(w * devicePixelRatio);
tagChart.height = Math.floor(h * devicePixelRatio);
ctx.scale(devicePixelRatio, devicePixelRatio);

// background
ctx.fillStyle = "#fff";
ctx.fillRect(0,0,w,h);

const barLeft = 120;
const barHeight = 22;
const gap = 12;
ctx.font = "13px system-ui, Arial";
ctx.fillStyle = "#374151";

top.forEach((p, i) => {
const y = padding + i * (barHeight + gap);
// label
ctx.fillStyle = "#374151";
ctx.fillText(p.name, 12, y + barHeight - 6);
// bar bg
ctx.fillStyle = "#eef2ff";
ctx.fillRect(barLeft, y, w - barLeft - padding, barHeight);
// bar fill
const width = Math.max(6, ((w - barLeft - padding) * (p.v / max)));
ctx.fillStyle = "#2563eb";
ctx.fillRect(barLeft, y, width, barHeight);
// value
ctx.fillStyle = "#fff";
ctx.fillText(String(p.v), barLeft + width - 28, y + barHeight - 6);
ctx.fillStyle = "#374151";
});
}

function drawEmotionChart() {
const ctx = emotionChart.getContext("2d");
const history = loadHistory();
// clear
ctx.clearRect(0,0,emotionChart.width,emotionChart.height);

if (!history.length) {
ctx.fillStyle = "#6b7280";
ctx.font = "14px system-ui, Arial";
ctx.fillText("No emotion data yet", 14, 24);
return;
}

// aggregate emotion counts across history
const agg = {};
history.forEach(entry => {
if (entry.emotions) {
entry.emotions.forEach(emotionId => {
agg[emotionId] = (agg[emotionId] || 0) + 1;
});
}
});

const pairs = Object.keys(agg).map(k => {
const emotion = EMOTIONS.find(e => e.id === k);
return {
id: k,
name: emotion ? emotion.label : k,
color: emotion ? emotion.color : '#6b7280',
v: agg[k]
};
}).sort((a,b)=>b.v-a.v);

const top = pairs.slice(0,8);
const max = top[0]?.v || 1;

// drawing
const padding = 12;
const w = emotionChart.clientWidth;
const h = Math.max(120, emotionChart.clientHeight);
emotionChart.width = Math.floor(w * devicePixelRatio);
emotionChart.height = Math.floor(h * devicePixelRatio);
ctx.scale(devicePixelRatio, devicePixelRatio);

// background
ctx.fillStyle = "#fff";
ctx.fillRect(0,0,w,h);

const barLeft = 120;
const barHeight = 18;
const gap = 10;
ctx.font = "12px system-ui, Arial";
ctx.fillStyle = "#374151";

top.forEach((p, i) => {
const y = padding + i * (barHeight + gap);
// label
ctx.fillStyle = "#374151";
ctx.fillText(p.name, 12, y + barHeight - 5);
// bar bg
ctx.fillStyle = "#f3f4f6";
ctx.fillRect(barLeft, y, w - barLeft - padding, barHeight);
// bar fill
const width = Math.max(4, ((w - barLeft - padding) * (p.v / max)));
ctx.fillStyle = p.color;
ctx.fillRect(barLeft, y, width, barHeight);
// value
ctx.fillStyle = "#fff";
ctx.fillText(String(p.v), barLeft + width - 20, y + barHeight - 5);
ctx.fillStyle = "#374151";
});
}

// ----- event wiring -----
function wire() {
renderEmotionGrid();
renderSymptomList();
renderHistory();

// toggle intensity select when checkbox toggled
symptomListEl.addEventListener("change", ev => {
if (!ev.target || ev.target.name !== "symptom") return;
const id = ev.target.value;
const sel = el(`#intensity-${id}`, symptomListEl);
if (sel) sel.disabled = !ev.target.checked;
// give brief focus to select if enabled
if (sel && !sel.disabled) sel.focus();
});

// clicking tag in suggestions copies symptom label
suggestionsEl.addEventListener("click", ev => {
const copyBtn = ev.target.closest("button.copy");
if (copyBtn) {
const text = copyBtn.dataset.copy || "";
navigator.clipboard?.writeText(text).then(() => {
copyBtn.textContent = "Copied";
setTimeout(()=> copyBtn.textContent = "Copy", 800);
}).catch(()=>{});
return;
}
const tag = ev.target.closest(".tag");
if (!tag) return;
const symId = tag.dataset.sym;
if (symId) {
const sym = SYMPTOMS.find(s => s.id === symId);
if (!sym) return;
navigator.clipboard?.writeText(sym.label).then(()=> {
tag.style.opacity = "0.6";
setTimeout(()=> tag.style.opacity = "1", 400);
}).catch(()=>{});
}
const emotionId = tag.dataset.emotion;
if (emotionId) {
const emotion = EMOTIONS.find(e => e.id === emotionId);
if (!emotion) return;
navigator.clipboard?.writeText(emotion.label).then(()=> {
tag.style.opacity = "0.6";
setTimeout(()=> tag.style.opacity = "1", 400);
}).catch(()=>{});
}
});

resetEmotionsBtn.addEventListener("click", resetEmotions);

analyzeBtn.addEventListener("click", () => {
const sel = getAllSelectedItems();
analyze(sel);
});

saveBtn.addEventListener("click", () => {
const sel = getAllSelectedItems();
if (!sel.length) {
alert("Select at least one symptom or emotion before saving.");
return;
}
const tags = deriveSummaryTagsWeighted(sel);
const summaryName = tags.slice(0,3).map(t => TAGS[t] ? TAGS[t].name : t).join(", ");
const emotions = selectedEmotions.map(e => e.id);

pushHistory({
ts: Date.now(),
symptoms: sel.filter(s => !s.type),
emotions: emotions,
summary: tags.join(", "),
summaryName
});
resultSummary.textContent = `Saved entry - ${summaryName || "no pattern detected"}.`;
});

clearBtn.addEventListener("click", () => {
els("input[name='symptom']", symptomListEl).forEach(i => i.checked = false);
els(".intensity", symptomListEl).forEach(s => s.disabled = true);
resetEmotions();
resultSummary.textContent = "Selections cleared.";
suggestionsEl.innerHTML = "";
patternInsightsEl.innerHTML = '<p class="muted">Pattern insights will appear here after multiple entries.</p>';
searchInput.value = "";
renderSymptomList();
});

searchInput.addEventListener("input", e => renderSymptomList(e.target.value));

clearHistoryBtn.addEventListener("click", () => {
if (!confirm("Remove all saved entries? This cannot be undone.")) return;
localStorage.removeItem(STORAGE_KEY);
renderHistory();
});

exportCsvBtn.addEventListener("click", exportCSV);
exportJsonBtn.addEventListener("click", exportJSON);

importJsonBtn.addEventListener("click", () => {
fileInput.value = "";
fileInput.click();
});

fileInput.addEventListener("change", (ev) => {
const f = ev.target.files && ev.target.files[0];
if (!f) return;
if (!confirm("Importing will merge entries into local history. Continue?")) return;
importJSONFile(f);
});

// settings dialog
openSettingsBtn.addEventListener("click", () => {
const s = loadSettings();
maxHistoryInput.value = s.maxHistory || DEFAULT_MAX_HISTORY;
enableNotifications.checked = s.enableNotifications || false;
enableSounds.checked = s.enableSounds || false;
settingsDialog.showModal();
});
closeSettingsBtn.addEventListener("click", () => settingsDialog.close());
saveSettingsBtn.addEventListener("click", () => {
const val = Math.max(5, Math.min(10000, Number(maxHistoryInput.value) || DEFAULT_MAX_HISTORY));
saveSettings({
maxHistory: val,
enableNotifications: enableNotifications.checked,
enableSounds: enableSounds.checked
});
settingsDialog.close();
renderHistory();
});

// help dialog
helpBtn.addEventListener("click", () => helpDialog.showModal());
closeHelpBtn.addEventListener("click", () => helpDialog.close());

// react to window resize for charts
window.addEventListener("resize", () => {
drawTagChart();
drawEmotionChart();
});
}

// ----- init -----
document.addEventListener("DOMContentLoaded", () => {
wire();
// Initial chart render after a brief delay to ensure proper sizing
setTimeout(() => {
drawTagChart();
drawEmotionChart();
}, 100);
});
})();