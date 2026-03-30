/* Copyright (c) 2024-2026. Jericho Crosby (Chalwk) */

(function () {
    const dateInput = document.getElementById('logDate');
    const bedtimeInput = document.getElementById('bedtime');
    const wakeTimeInput = document.getElementById('wakeTime');
    const difficultySlider = document.getElementById('difficultyLevel');
    const difficultyDisplay = document.getElementById('difficultyDisplay');
    const difficultyReason = document.getElementById('difficultyReason');
    const wakeEventsContainer = document.getElementById('wakeEventsContainer');
    const addWakeEventBtn = document.getElementById('addWakeEventBtn');
    const racingThoughts = document.getElementById('racingThoughts');
    const nightmares = document.getElementById('nightmares');
    const traumaNightmare = document.getElementById('traumaNightmare');
    const traumaContainer = document.getElementById('traumaNightmareContainer');
    const fearSleep = document.getElementById('fearSleep');
    const restlessness = document.getElementById('restlessness');
    const mood = document.getElementById('mood');
    const preRoutine = document.getElementById('preRoutine');
    const postRoutine = document.getElementById('postRoutine');
    const seasonalDepression = document.getElementById('seasonalDepression');
    const notes = document.getElementById('notes');
    const addBtn = document.getElementById('addEntryBtn');
    const clearFormBtn = document.getElementById('clearFormBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile');
    const entriesListDiv = document.getElementById('entriesList');
    const totalSpan = document.getElementById('totalEntries');
    const avgAwakeningsSpan = document.getElementById('avgAwakenings');
    const avgDifficultySpan = document.getElementById('avgDifficulty');
    const nightmareCountSpan = document.getElementById('nightmareCount');
    const toast = document.getElementById('toast');

    const stress = document.getElementById('stress');
    const caffeine = document.getElementById('caffeine');
    const alcohol = document.getElementById('alcohol');
    const exercise = document.getElementById('exercise');
    const screenTime = document.getElementById('screenTime');
    const medication = document.getElementById('medication');
    const environment = document.getElementById('environment');

    const summaryBtn = document.getElementById('summaryBtn');
    const summaryModal = document.getElementById('summaryModal');
    const closeModal = document.querySelector('.close-modal');
    const rangeRadios = document.querySelectorAll('input[name="summaryRange"]');
    const customRangeDiv = document.getElementById('customRangeInputs');
    const summaryStartDate = document.getElementById('summaryStartDate');
    const summaryEndDate = document.getElementById('summaryEndDate');
    const generateSummaryBtn = document.getElementById('generateSummaryBtn');
    const summaryOutput = document.getElementById('summaryOutput');
    const copySummaryBtn = document.getElementById('copySummaryBtn');

    const collapsibles = [
        {
            checkbox: document.getElementById('hadDifficulty'),
            content: document.getElementById('difficultyFields'),
            icon: 'difficultyIcon'
        },
        {
            checkbox: document.getElementById('hadWakeEvents'),
            content: document.getElementById('wakeEventsFields'),
            icon: 'wakeEventsIcon'
        },
        {
            checkbox: document.getElementById('hadSymptoms'),
            content: document.getElementById('symptomsFields'),
            icon: 'symptomsIcon'
        },
        {
            checkbox: document.getElementById('hadMorning'),
            content: document.getElementById('morningFields'),
            icon: 'morningIcon'
        },
        {
            checkbox: document.getElementById('hadAdditional'),
            content: document.getElementById('additionalFields'),
            icon: 'additionalIcon'
        }
    ];

    const STORAGE_KEY = 'sleep_entries';
    let editingId = null;

    function getTodayDate() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getCurrentTime() {
        const d = new Date();
        return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }

    function formatDateLocal(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function setupCollapsible(checkbox, content, iconId) {
        const icon = document.getElementById(iconId);
        const header = icon.closest('.collapse-header');

        const toggle = () => {
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change', {bubbles: true}));
        };

        header.addEventListener('click', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'LABEL' || e.target.closest('button')) return;
            toggle();
        });

        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                content.style.display = 'block';
                icon.className = 'fas fa-chevron-down collapse-icon';
            } else {
                content.style.display = 'none';
                icon.className = 'fas fa-chevron-right collapse-icon';
            }
        });
    }

    collapsibles.forEach(c => setupCollapsible(c.checkbox, c.content, c.icon));

    dateInput.value = getTodayDate();

    difficultySlider.addEventListener('input', function () {
        difficultyDisplay.textContent = this.value;
    });

    document.getElementById('todayDateBtn').addEventListener('click', () => {
        dateInput.value = getTodayDate();
    });

    document.getElementById('nowBedtimeBtn').addEventListener('click', () => {
        bedtimeInput.value = getCurrentTime();
    });
    document.getElementById('nowWakeTimeBtn').addEventListener('click', () => {
        wakeTimeInput.value = getCurrentTime();
    });

    nightmares.addEventListener('change', function () {
        traumaContainer.style.display = this.checked ? 'block' : 'none';
        if (!this.checked) traumaNightmare.checked = false;
    });

    function createWakeEventRow(time = '', ease = 'moderate') {
        const row = document.createElement('div');
        row.className = 'wake-event-row';
        row.innerHTML = `
            <input type="time" class="time-input" value="${time}" placeholder="Time">
            <select class="ease-select">
                <option value="very easy">Very easy</option>
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="difficult">Difficult</option>
                <option value="very difficult">Very difficult</option>
            </select>
            <button type="button" class="remove-wake-event" title="Remove"><i class="fas fa-times"></i></button>
        `;
        row.querySelector('.ease-select').value = ease;
        row.querySelector('.remove-wake-event').addEventListener('click', () => {
            row.remove();
        });
        return row;
    }

    addWakeEventBtn.addEventListener('click', () => {
        wakeEventsContainer.appendChild(createWakeEventRow());
    });

    function getWakeEvents() {
        const rows = document.querySelectorAll('.wake-event-row');
        const events = [];
        rows.forEach(row => {
            const time = row.querySelector('.time-input').value;
            const ease = row.querySelector('.ease-select').value;
            if (time) {
                events.push({time, ease});
            }
        });
        return events;
    }

    function setWakeEvents(events) {
        wakeEventsContainer.innerHTML = '';
        events.forEach(ev => {
            wakeEventsContainer.appendChild(createWakeEventRow(ev.time, ev.ease));
        });
    }

    function resetForm() {
        dateInput.value = getTodayDate();
        bedtimeInput.value = '';
        wakeTimeInput.value = '';
        difficultySlider.value = 5;
        difficultyDisplay.textContent = '5';
        difficultyReason.value = '';
        wakeEventsContainer.innerHTML = '';
        racingThoughts.checked = false;
        nightmares.checked = false;
        traumaContainer.style.display = 'none';
        traumaNightmare.checked = false;
        fearSleep.checked = false;
        restlessness.checked = false;
        mood.value = '';
        preRoutine.value = '';
        postRoutine.value = '';
        stress.checked = false;
        caffeine.checked = false;
        alcohol.checked = false;
        exercise.checked = false;
        screenTime.checked = false;
        medication.checked = false;
        environment.checked = false;
        seasonalDepression.checked = false;
        notes.value = '';

        collapsibles.forEach(c => {
            if (c.checkbox.checked) {
                c.checkbox.checked = false;
                c.checkbox.dispatchEvent(new Event('change'));
            }
        });
    }

    function updateAddButtonText() {
        const span = addBtn.querySelector('span');
        span.textContent = editingId ? 'update entry' : 'log this night';
    }

    function loadEntries() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Failed to load entries:', e);
            alert('Could not read data from storage.');
            return [];
        }
    }

    function saveEntries(entries) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
        } catch (e) {
            console.error('Failed to save entries:', e);
            alert('Could not save data. Storage may be full.');
        }
    }

    function addEntry(entry) {
        const entries = loadEntries();
        entries.unshift(entry);
        saveEntries(entries);
        renderAll();
    }

    function updateEntry(updatedEntry) {
        let entries = loadEntries();
        const index = entries.findIndex(e => e.id === updatedEntry.id);
        if (index !== -1) {
            entries[index] = updatedEntry;
            saveEntries(entries);
        }
        renderAll();
    }

    function deleteEntry(id) {
        let entries = loadEntries();
        entries = entries.filter(e => e.id !== id);
        saveEntries(entries);
        renderAll();
    }

    function clearAll() {
        if (confirm('Permanently delete all sleep logs? This cannot be undone.')) {
            localStorage.removeItem(STORAGE_KEY);
            renderAll();
            resetForm();
            editingId = null;
            updateAddButtonText();
        }
    }

    function exportData() {
        const entries = loadEntries();
        const dataStr = JSON.stringify(entries, null, 2);
        const blob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sleep-entries-${getTodayDate()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (!Array.isArray(imported)) throw new Error('Invalid format');
                if (confirm('This will replace all current entries. Continue?')) {
                    saveEntries(imported);
                    renderAll();
                    showToast('Data imported');
                }
            } catch (err) {
                alert('Failed to import: invalid JSON file.');
            }
        };
        reader.readAsText(file);
    }

    exportBtn.addEventListener('click', exportData);
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', (e) => {
        if (e.target.files.length) {
            importData(e.target.files[0]);
            importFile.value = '';
        }
    });

    function showToast(message = 'Entry saved') {
        toast.textContent = `✓ ${message}`;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2000);
    }

    function handleAddEntry() {
        if (!dateInput.value) {
            alert('Please select a date.');
            return;
        }

        const wakeEvents = getWakeEvents();

        const entryData = {
            id: editingId || Date.now() + '-' + Math.random().toString(36).substr(2, 6),
            date: dateInput.value,
            bedtime: bedtimeInput.value || null,
            wakeTime: wakeTimeInput.value || null,
            difficultyLevel: parseInt(difficultySlider.value, 10),
            difficultyReason: difficultyReason.value.trim() || null,
            awakenings: wakeEvents,
            racingThoughts: racingThoughts.checked,
            nightmares: nightmares.checked,
            traumaNightmare: traumaNightmare.checked,
            fearSleep: fearSleep.checked,
            restlessness: restlessness.checked,
            mood: mood.value.trim() || null,
            preRoutine: preRoutine.value.trim() || null,
            postRoutine: postRoutine.value.trim() || null,
            stress: stress.checked,
            caffeine: caffeine.checked,
            alcohol: alcohol.checked,
            exercise: exercise.checked,
            screenTime: screenTime.checked,
            medication: medication.checked,
            environment: environment.checked,
            seasonalDepression: seasonalDepression.checked,
            notes: notes.value.trim() || null,
            timestamp: new Date().toISOString()
        };

        if (editingId) {
            updateEntry(entryData);
            showToast('Entry updated');
            editingId = null;
            updateAddButtonText();
        } else {
            addEntry(entryData);
            showToast('Entry added');
        }

        resetForm();
    }

    addBtn.addEventListener('click', handleAddEntry);
    clearFormBtn.addEventListener('click', () => {
        resetForm();
        editingId = null;
        updateAddButtonText();
    });
    clearAllBtn.addEventListener('click', clearAll);

    function populateFormForEdit(entry) {
        resetForm();

        dateInput.value = entry.date || getTodayDate();
        bedtimeInput.value = entry.bedtime || '';
        wakeTimeInput.value = entry.wakeTime || '';
        difficultySlider.value = entry.difficultyLevel || 5;
        difficultyDisplay.textContent = difficultySlider.value;
        difficultyReason.value = entry.difficultyReason || '';
        setWakeEvents(entry.awakenings || []);
        racingThoughts.checked = entry.racingThoughts || false;
        nightmares.checked = entry.nightmares || false;
        traumaContainer.style.display = entry.nightmares ? 'block' : 'none';
        traumaNightmare.checked = entry.traumaNightmare || false;
        fearSleep.checked = entry.fearSleep || false;
        restlessness.checked = entry.restlessness || false;
        mood.value = entry.mood || '';
        preRoutine.value = entry.preRoutine || '';
        postRoutine.value = entry.postRoutine || '';
        stress.checked = entry.stress || false;
        caffeine.checked = entry.caffeine || false;
        alcohol.checked = entry.alcohol || false;
        exercise.checked = entry.exercise || false;
        screenTime.checked = entry.screenTime || false;
        medication.checked = entry.medication || false;
        environment.checked = entry.environment || false;
        seasonalDepression.checked = entry.seasonalDepression || false;
        notes.value = entry.notes || '';

        if (entry.difficultyLevel || entry.difficultyReason) {
            const cb = document.getElementById('hadDifficulty');
            if (!cb.checked) cb.checked = true;
            cb.dispatchEvent(new Event('change'));
        }
        if (entry.awakenings && entry.awakenings.length) {
            const cb = document.getElementById('hadWakeEvents');
            if (!cb.checked) cb.checked = true;
            cb.dispatchEvent(new Event('change'));
        }
        if (entry.racingThoughts || entry.nightmares || entry.fearSleep || entry.restlessness) {
            const cb = document.getElementById('hadSymptoms');
            if (!cb.checked) cb.checked = true;
            cb.dispatchEvent(new Event('change'));
        }
        if (entry.mood || entry.preRoutine || entry.postRoutine) {
            const cb = document.getElementById('hadMorning');
            if (!cb.checked) cb.checked = true;
            cb.dispatchEvent(new Event('change'));
        }
        if (entry.stress || entry.caffeine || entry.alcohol || entry.exercise || entry.screenTime || entry.medication || entry.environment || entry.seasonalDepression) {
            const cb = document.getElementById('hadAdditional');
            if (!cb.checked) cb.checked = true;
            cb.dispatchEvent(new Event('change'));
        }

        editingId = entry.id;
        updateAddButtonText();
    }

    function renderAll() {
        const entries = loadEntries();
        totalSpan.textContent = entries.length;

        if (entries.length === 0) {
            avgAwakeningsSpan.textContent = '-';
            avgDifficultySpan.textContent = '-';
            nightmareCountSpan.textContent = '0';
        } else {
            const totalAwakenings = entries.reduce((sum, e) => sum + (e.awakenings ? e.awakenings.length : 0), 0);
            const avgAwake = (totalAwakenings / entries.length).toFixed(1);
            avgAwakeningsSpan.textContent = avgAwake;

            const totalDiff = entries.reduce((sum, e) => sum + (e.difficultyLevel || 0), 0);
            const avgDiff = (totalDiff / entries.length).toFixed(1);
            avgDifficultySpan.textContent = avgDiff;

            const nightmareNights = entries.filter(e => e.nightmares).length;
            nightmareCountSpan.textContent = nightmareNights;
        }

        if (entries.length === 0) {
            entriesListDiv.innerHTML = '<div class="empty-message">✨ no entries yet. use the form to start.</div>';
            return;
        }

        let html = '';
        entries.slice(0, 15).forEach(entry => {
            const dateObj = new Date(entry.date + 'T12:00:00');
            const formattedDate = dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            const bedtime = entry.bedtime || '--:--';
            const wakeTime = entry.wakeTime || '--:--';
            const awakeningsCount = entry.awakenings ? entry.awakenings.length : 0;
            const nightmareIcon = entry.nightmares ? ' 🌙💭' : '';
            const traumaMark = entry.traumaNightmare ? ' (trauma)' : '';
            const snippet = entry.notes ? `<div class="entry-note-preview"><i class="fas fa-pencil-alt"></i> ${entry.notes.substring(0, 50)}${entry.notes.length > 50 ? '…' : ''}</div>` : '';

            html += `
                <div class="entry-card" data-id="${entry.id}">
                    <button class="delete-entry" aria-label="Delete entry" title="delete entry"><i class="fas fa-times"></i></button>
                    <button class="edit-entry" aria-label="Edit entry" title="edit entry"><i class="fas fa-pencil-alt"></i></button>
                    <div class="entry-header">
                        <span class="entry-date"><i class="far fa-calendar-alt"></i> ${formattedDate}</span>
                        <span class="entry-badge">${bedtime} - ${wakeTime}</span>
                    </div>
                    <div class="entry-details">
                        <p><i class="fas fa-exclamation-triangle"></i> Difficulty: ${entry.difficultyLevel}/10</p>
                        <p><i class="fas fa-clock"></i> Awakenings: ${awakeningsCount}</p>
                        ${entry.nightmares ? `<p><i class="fas fa-dragon"></i> Nightmare${traumaMark}</p>` : ''}
                        ${entry.fearSleep ? '<p><i class="fas fa-frown"></i> Fear to sleep</p>' : ''}
                        ${entry.mood ? `<p><i class="fas fa-smile"></i> Mood: ${entry.mood}</p>` : ''}
                    </div>
                    ${snippet}
                </div>
            `;
        });

        entriesListDiv.innerHTML = html;

        document.querySelectorAll('.delete-entry').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = e.target.closest('.entry-card');
                if (card) {
                    const id = card.dataset.id;
                    if (id && confirm('Delete this entry?')) {
                        deleteEntry(id);
                        if (editingId === id) {
                            editingId = null;
                            updateAddButtonText();
                            resetForm();
                        }
                    }
                }
            });
        });

        document.querySelectorAll('.edit-entry').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = e.target.closest('.entry-card');
                if (card) {
                    const id = card.dataset.id;
                    const entry = loadEntries().find(e => e.id === id);
                    if (entry) {
                        populateFormForEdit(entry);
                    }
                }
            });
        });
    }

    function setDefaultCustomDates() {
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        summaryStartDate.value = formatDateLocal(sevenDaysAgo);
        summaryEndDate.value = formatDateLocal(today);
    }

    summaryBtn.addEventListener('click', () => {
        summaryModal.style.display = 'flex';
        document.querySelector('input[name="summaryRange"][value="week"]').checked = true;
        customRangeDiv.style.display = 'none';
        summaryOutput.textContent = '';
        copySummaryBtn.disabled = true;
        setDefaultCustomDates();
    });

    closeModal.addEventListener('click', () => {
        summaryModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === summaryModal) {
            summaryModal.style.display = 'none';
        }
    });

    rangeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                customRangeDiv.style.display = 'block';
                setDefaultCustomDates();
            } else {
                customRangeDiv.style.display = 'none';
            }
        });
    });

    generateSummaryBtn.addEventListener('click', () => {
        const selectedRange = document.querySelector('input[name="summaryRange"]:checked').value;
        let startDate, endDate;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedRange === 'week') {
            endDate = new Date(today);
            endDate.setHours(23, 59, 59, 999);
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 6);
            startDate.setHours(0, 0, 0, 0);
        } else if (selectedRange === 'month') {
            endDate = new Date(today);
            endDate.setHours(23, 59, 59, 999);
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 29);
            startDate.setHours(0, 0, 0, 0);
        } else {
            if (!summaryStartDate.value || !summaryEndDate.value) {
                alert('Please select both start and end dates.');
                return;
            }
            startDate = new Date(summaryStartDate.value + 'T00:00:00');
            endDate = new Date(summaryEndDate.value + 'T23:59:59.999');
        }

        const summaryText = buildSleepSummary(startDate, endDate);
        summaryOutput.textContent = summaryText;
        copySummaryBtn.disabled = (summaryText === 'No entries in this period.');
    });

    function buildSleepSummary(start, end) {
        const startStr = formatDateLocal(start);
        const endStr = formatDateLocal(end);

        const entries = loadEntries();
        const filtered = entries.filter(e => {
            if (!e.date) return false;
            return e.date >= startStr && e.date <= endStr;
        }).sort((a, b) => a.date.localeCompare(b.date) || (a.bedtime || '').localeCompare(b.bedtime || ''));

        if (filtered.length === 0) return 'No entries in this period.';

        let summary = '';
        let currentDate = '';
        filtered.forEach(entry => {
            const entryDateStr = entry.date;
            if (entryDateStr !== currentDate) {
                if (currentDate) summary += '\n';
                const d = new Date(entryDateStr + 'T12:00:00');
                summary += d.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }) + ':\n';
                currentDate = entryDateStr;
            }
            summary += `  - Bedtime: ${entry.bedtime || '--:--'}, Wake: ${entry.wakeTime || '--:--'}, Difficulty: ${entry.difficultyLevel}/10`;
            if (entry.difficultyReason) summary += ` (${entry.difficultyReason})`;
            summary += `, Awakenings: ${entry.awakenings ? entry.awakenings.length : 0}`;
            if (entry.nightmares) summary += `, Nightmare${entry.traumaNightmare ? ' (trauma)' : ''}`;
            if (entry.fearSleep) summary += `, Fear to sleep`;
            if (entry.racingThoughts) summary += `, Racing thoughts`;
            if (entry.restlessness) summary += `, Restlessness`;
            if (entry.mood) summary += `, Mood: ${entry.mood}`;

            let factors = [];
            if (entry.stress) factors.push('Stress');
            if (entry.caffeine) factors.push('Caffeine');
            if (entry.alcohol) factors.push('Alcohol');
            if (entry.exercise) factors.push('Exercise');
            if (entry.screenTime) factors.push('Screen time');
            if (entry.medication) factors.push('Medication');
            if (entry.environment) factors.push('Environment');
            if (entry.seasonalDepression) factors.push('Seasonal pattern');
            if (factors.length) summary += `, Factors: ${factors.join(', ')}`;

            summary += `\n    Pre-routine: "${entry.preRoutine || 'none'}"`;
            summary += `\n    Post-routine: "${entry.postRoutine || 'none'}"`;
            if (entry.notes) summary += `\n    Notes: ${entry.notes}`;
            summary += '\n';
        });
        return summary;
    }

    copySummaryBtn.addEventListener('click', () => {
        const text = summaryOutput.textContent;
        if (text) {
            navigator.clipboard.writeText(text).then(() => {
                showToast('Summary copied');
            }).catch(() => {
                alert('Could not copy text.');
            });
        }
    });

    renderAll();
})();