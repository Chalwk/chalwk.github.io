(() => {
    // ----- config + data -----
    const STORAGE_KEY = "autism-tracker-history-v2";
    const DEFAULT_MAX_HISTORY = 200;

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
        { id: "hot-sweaty", label: "Hot / sweaty", tags: ["sensory","physiological"] },
        { id: "stomach", label: "Stomach pain / nausea", tags: ["physiological"] },
        { id: "irritable", label: "Irritable / short temper", tags: ["stress","overload"] },
        { id: "shutdown", label: "Shutting down / blanking out", tags: ["shutdown","overload"] },
        { id: "meltdown", label: "Meltdown / intense distress", tags: ["meltdown","overload"] },
        { id: "low-focus", label: "Trouble focusing", tags: ["executive-function","fatigue"] },
        { id: "slow-thoughts", label: "Slow thoughts / fuzzy", tags: ["fatigue","executive-function"] },
        { id: "sensory-touch", label: "Touch causes discomfort", tags: ["sensory"] },
        { id: "ruminating", label: "Ruminating / stuck thoughts", tags: ["anxiety"] },
        { id: "panic", label: "Panic / racing heart", tags: ["anxiety","physiological"] },
        { id: "withdrawn", label: "Wanting to withdraw / hide", tags: ["shutdown","stress"] },
        { id: "overstimulation", label: "Overstimulated after social time", tags: ["sensory","social-fatigue"] }
    ];

    const TAGS = {
        "sensory": {
            name: "Sensory overload",
            strategies: [
                "Find a quieter, darker space.",
                "Use noise-cancelling headphones or earplugs.",
                "Try deep pressure: weighted blanket or tight shirt if comfortable.",
                "Allow stimming: fidget toys or movement.",
                "Use a cold cloth or fan to regulate temperature."
            ],
            explanation: "Sensory input like sound, light, touch, or temperature can become overwhelming. Reducing input and using sensory supports helps."
        },
        "fatigue": {
            name: "Fatigue / low energy",
            strategies: [
                "Try a short rest or nap if possible.",
                "Drink water and have a small snack.",
                "Break tasks into 5-minute steps.",
                "Lower demands and deprioritize non-essential tasks."
            ],
            explanation: "Low energy affects focus and tolerance. Small rests and nutrition often help."
        },
        "basic-needs": {
            name: "Basic needs (hunger, thirst)",
            strategies: [
                "Eat a small, familiar snack.",
                "Drink water or a favoured drink.",
                "Avoid heavy new foods during distress."
            ],
            explanation: "Often physical needs drive emotional responses. Meeting them first is low-effort and effective."
        },
        "stress": {
            name: "Stress / overload",
            strategies: [
                "Use grounding: name 5 things you can see/hear/feel.",
                "Try slow box breathing: 4 in, 4 hold, 4 out, 4 hold.",
                "Simplify the environment and reduce decisions.",
                "Send a short, honest message if needing space."
            ],
            explanation: "Acute stress lowers tolerance. Grounding and simple choices reduce load."
        },
        "executive-function": {
            name: "Executive difficulty (planning, focus)",
            strategies: [
                "Do a 5-minute timer task — short bursts help.",
                "Write a tiny next-step checklist.",
                "Remove distractions — phone away or on focus mode.",
                "Use visual timers or alarms."
            ],
            explanation: "Tasks can feel huge. Tiny steps make progress achievable."
        },
        "physiological": {
            name: "Physiological symptoms",
            strategies: [
                "Check temperature, hydration, and breathing.",
                "If physical symptoms are severe contact a medical professional.",
                "Use soothing positions and paced breathing."
            ],
            explanation: "Some feelings come from body signals and may need physical care or professional input."
        },
        "shutdown": {
            name: "Shutdown",
            strategies: [
                "Find a safe, low-demand space.",
                "Reduce questions and expectations.",
                "Offer a calm presence and reassurance if supporting someone.",
                "Allow time to recover without forcing conversation."
            ],
            explanation: "Shutdowns are protective. Gentle, low-demand care helps recovery."
        },
        "meltdown": {
            name: "Meltdown",
            strategies: [
                "Ensure safety for the person and others.",
                "Avoid punitive responses.",
                "Offer space and reduce sensory input.",
                "Later, when calm, debrief gently if helpful."
            ],
            explanation: "Meltdowns are intense and need safety and de-escalation rather than reasoning."
        },
        "anxiety": {
            name: "Anxiety",
            strategies: [
                "Try paced breathing or grounding.",
                "Label the emotion out loud or in a journal.",
                "Use brief, structured distraction, e.g. a short walk.",
                "If persistent, consider talking with a mental health provider."
            ],
            explanation: "Anxiety increases arousal. Grounding and structure reduce it in the moment."
        },
        "overload": {
            name: "High cognitive/emotional load",
            strategies: [
                "Pause tasks and rest for five minutes.",
                "Delegate or postpone non-essential tasks.",
                "Use one-step instructions only."
            ],
            explanation: "When too many things demand attention, lowering load is important."
        },
        "social-fatigue": {
            name: "Social fatigue",
            strategies: [
                "Plan quiet recovery time after social events.",
                "Tell safe people your limits in advance.",
                "Use short check-ins rather than long conversations."
            ],
            explanation: "Social interactions can be draining. Predictable recovery routines help."
        }
    };

    // ----- helpers -----
    const el = (sel, root = document) => root.querySelector(sel);
    const els = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const fmtDate = ts => new Date(ts).toLocaleString();

    // ----- DOM refs -----
    const symptomListEl = el("#symptom-list");
    const analyzeBtn = el("#analyze-btn");
    const saveBtn = el("#save-btn");
    const resultSummary = el("#result-summary");
    const suggestionsEl = el("#suggestions");
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
    const saveSettingsBtn = el("#save-settings");
    const closeSettingsBtn = el("#close-settings");
    const closeHelpBtn = el("#close-help");
    const tagChart = el("#tag-chart");

    // settings storage
    function loadSettings() {
        try {
            const raw = localStorage.getItem(`${STORAGE_KEY}-settings`);
            const parsed = raw ? JSON.parse(raw) : {};
            return {
                maxHistory: parsed.maxHistory || DEFAULT_MAX_HISTORY
            };
        } catch (e) {
            return { maxHistory: DEFAULT_MAX_HISTORY };
        }
    }
    function saveSettings(obj) {
        localStorage.setItem(`${STORAGE_KEY}-settings`, JSON.stringify(obj));
    }

    // ----- render symptom list (with intensity control) -----
    function renderSymptomList(filter = "") {
        symptomListEl.innerHTML = "";
        const q = filter.trim().toLowerCase();
        SYMPTOMS.forEach(sym => {
            if (q && !(sym.label.toLowerCase().includes(q) || (sym.tags || []).join(" ").includes(q))) return;
            const wrapper = document.createElement("div");
            wrapper.className = "symptom";
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

    // ----- analysis logic (weighted) -----
    function analyze(selected) {
        if (!selected || selected.length === 0) {
            resultSummary.textContent = "No symptoms selected. Choose items and press Analyze.";
            suggestionsEl.innerHTML = "";
            return;
        }

        // aggregate tag weights
        const tagScore = {};
        selected.forEach(({ id, weight }) => {
            const s = SYMPTOMS.find(x => x.id === id);
            if (!s) return;
            (s.tags || []).forEach(tag => {
                tagScore[tag] = (tagScore[tag] || 0) + weight;
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

        resultSummary.textContent = `Matched ${selected.length} symptom(s). Top patterns: ${entries.slice(0,3).map(e => e.info.name).join(", ") || "None"}.`;

        // render suggestions
        suggestionsEl.innerHTML = "";
        if (entries.length === 0) return;

        entries.forEach(entry => {
            const card = document.createElement("article");
            card.className = "suggestion";
            card.innerHTML = `
        <h3>
          <span>${escapeHtml(entry.info.name)}</span>
          <span class="percent-badge" title="Relative confidence">${entry.percent}%</span>
        </h3>
        <p class="muted">${escapeHtml(entry.info.explanation || "")}</p>
        <ul aria-label="Strategies for ${escapeHtml(entry.info.name)}" class="strategies">
          ${entry.info.strategies.map(s => `<li class="strategy"><button class="copy btn" data-copy="${escapeHtml(s)}" title="Copy strategy">Copy</button><span style="margin-left:8px">${escapeHtml(s)}</span></li>`).join("")}
        </ul>
        <div class="taglist">${SYMPTOMS.filter(s => s.tags && s.tags.includes(entry.tag)).slice(0,6).map(s => `<span class="tag" data-sym="${escapeHtml(s.id)}">${escapeHtml(s.label)}</span>`).join("")}</div>
      `;
            suggestionsEl.appendChild(card);
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
            drawTagChart(); // clears chart
            return;
        }

        arr.forEach((h, idx) => {
            const item = document.createElement("div");
            item.className = "hist-item";
            item.innerHTML = `
        <div class="hist-left">
          <div style="font-weight:700">${fmtDate(h.ts)}</div>
          <div class="hist-tags">${h.symptoms.map(s => {
                const sym = SYMPTOMS.find(x => x.id === s.id);
                return `<span class="tag" title="Intensity: ${s.weight}">${escapeHtml(sym ? sym.label : s.id)}${s.weight>1?` • ${s.weight}`:""}</span>`;
            }).join("")}</div>
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
    }

    // ----- export CSV & JSON -----
    function exportCSV() {
        const arr = loadHistory();
        if (!arr.length) { alert("No history to export."); return; }
        const header = ["timestamp","human_time","selected_symptoms","weights","top_patterns"];
        const rows = arr.map(item => {
            const labels = item.symptoms.map(s => {
                const sym = SYMPTOMS.find(x => x.id === s.id);
                return (sym ? sym.label : s.id);
            }).join("|");
            const weights = item.symptoms.map(s => s.weight).join("|");
            const top = (item.summaryName || item.summary || "");
            const iso = new Date(item.ts).toISOString();
            return [iso, `"${fmtDate(item.ts)}"`, `"${escapeCsv(labels)}"`, `"${escapeCsv(weights)}"`, `"${escapeCsv(top)}"`];
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
        selected.forEach(({ id, weight }) => {
            const s = SYMPTOMS.find(x => x.id === id);
            if (!s) return;
            (s.tags || []).forEach(tag => tagScore[tag] = (tagScore[tag] || 0) + weight);
        });
        return Object.keys(tagScore).sort((a,b) => tagScore[b] - tagScore[a]);
    }

    function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m])); }
    function escapeCsv(s){ return String(s).replace(/"/g,'""'); }

    // ----- chart drawing (simple bar chart on canvas) -----
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
        });

        const pairs = Object.keys(agg).map(k => ({ tag:k, name:(TAGS[k]?.name || k), v:agg[k] })).sort((a,b)=>b.v-a.v);
        const top = pairs.slice(0,6);
        const max = top[0].v || 1;

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

    // ----- event wiring -----
    function wire() {
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
            const sym = SYMPTOMS.find(s => s.id === symId);
            if (!sym) return;
            navigator.clipboard?.writeText(sym.label).then(()=> {
                tag.style.opacity = "0.6"; setTimeout(()=> tag.style.opacity = "1", 400);
            }).catch(()=>{});
        });

        analyzeBtn.addEventListener("click", () => {
            const sel = getSelectedSymptomsWithWeights();
            analyze(sel);
        });

        saveBtn.addEventListener("click", () => {
            const sel = getSelectedSymptomsWithWeights();
            if (!sel.length) { alert("Select at least one symptom before saving."); return; }
            const tags = deriveSummaryTagsWeighted(sel);
            const summaryName = tags.slice(0,3).map(t => TAGS[t] ? TAGS[t].name : t).join(", ");
            pushHistory({ ts: Date.now(), symptoms: sel, summary: tags.join(", "), summaryName });
            resultSummary.textContent = `Saved entry - ${summaryName || "no pattern detected"}.`;
        });

        clearBtn.addEventListener("click", () => {
            els("input[name='symptom']", symptomListEl).forEach(i => i.checked = false);
            els(".intensity", symptomListEl).forEach(s => s.disabled = true);
            resultSummary.textContent = "Selections cleared.";
            suggestionsEl.innerHTML = "";
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
            settingsDialog.showModal();
        });
        closeSettingsBtn.addEventListener("click", () => settingsDialog.close());
        saveSettingsBtn.addEventListener("click", () => {
            const val = Math.max(5, Math.min(10000, Number(maxHistoryInput.value) || DEFAULT_MAX_HISTORY));
            saveSettings({ maxHistory: val });
            settingsDialog.close();
            renderHistory();
        });

        // help dialog
        helpBtn.addEventListener("click", () => helpDialog.showModal());
        closeHelpBtn.addEventListener("click", () => helpDialog.close());

        // react to window resize for chart
        window.addEventListener("resize", () => drawTagChart());
    }

    // ----- small utils -----
    function escapeCsvFields(arr) { return arr.map(v => `"${String(v).replace(/"/g,'""')}"`).join(","); }

    // ----- init -----
    document.addEventListener("DOMContentLoaded", () => { wire(); });
})();
