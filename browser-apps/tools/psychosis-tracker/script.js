/*
Copyright (c) 2024-2026. Jericho Crosby (Chalwk)

Psychosis Tracker - JavaScript
*/

(function() {
    const dateInput = document.getElementById('logDate');
    const timeInput = document.getElementById('logTime');
    const durationInput = document.getElementById('logDuration');
    const intensitySlider = document.getElementById('logIntensity');
    const intensityDisplay = document.getElementById('intensityDisplay');
    const voiceTextarea = document.getElementById('logVoice');
    const notesTextarea = document.getElementById('logNotes');

    const hallucinationCheckboxes = document.querySelectorAll('#hallucinationTypeCheckboxes input[type=checkbox]');
    const hallucinationOtherCheckbox = document.getElementById('hallucinationOther');
    const customHallucinationContainer = document.getElementById('customHallucinationContainer');
    const customHallucinationInput = document.getElementById('customHallucinationInput');
    const moodEpisodeRadios = document.querySelectorAll('input[name="moodEpisode"]');
    const additionalSymptomsCheckboxes = document.querySelectorAll('#additionalSymptomsCheckboxes input[type=checkbox]');
    const triggerInput = document.getElementById('triggerInput');
    const medicationRadios = document.querySelectorAll('input[name="medication"]');
    const sleepHoursInput = document.getElementById('sleepHours');
    const stressSlider = document.getElementById('stressLevel');
    const stressDisplay = document.getElementById('stressDisplay');

    const copingCheckboxes = document.querySelectorAll('#copingCheckboxes input[type=checkbox]');
    const copingOtherCheckbox = document.getElementById('copingOther');
    const customCopingContainer = document.getElementById('customCopingContainer');
    const customCopingInput = document.getElementById('customCopingInput');
    const addBtn = document.getElementById('addEntryBtn');
    const clearFormBtn = document.getElementById('clearFormBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile');
    const entriesListDiv = document.getElementById('entriesList');
    const totalSpan = document.getElementById('totalEntries');
    const avgSpan = document.getElementById('avgIntensity');
    const weekSpan = document.getElementById('thisWeek');
    const toast = document.getElementById('toast');

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

    const STORAGE_KEY = 'voice_entries';
    let editingId = null;

    stressSlider.addEventListener('input', function() {
        stressDisplay.textContent = this.value;
    });

    intensitySlider.addEventListener('input', function() {
        intensityDisplay.textContent = this.value;
        this.setAttribute('aria-valuenow', this.value);
    });

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

    dateInput.value = getTodayDate();

    document.getElementById('todayDateBtn').addEventListener('click', () => {
        dateInput.value = getTodayDate();
    });
    document.getElementById('nowTimeBtn').addEventListener('click', () => {
        timeInput.value = getCurrentTime();
    });

    copingOtherCheckbox.addEventListener('change', function(e) {
        if (this.checked) {
            customCopingContainer.style.display = 'block';
            customCopingInput.focus();
        } else {
            customCopingContainer.style.display = 'none';
            customCopingInput.value = '';
        }
    });

    hallucinationOtherCheckbox.addEventListener('change', function(e) {
        if (this.checked) {
            customHallucinationContainer.style.display = 'block';
            customHallucinationInput.focus();
        } else {
            customHallucinationContainer.style.display = 'none';
            customHallucinationInput.value = '';
        }
    });

    clearFormBtn.addEventListener('click', function() {
        resetForm();
        editingId = null;
        updateAddButtonText();
    });

    function resetForm() {
        dateInput.value = getTodayDate();
        timeInput.value = '';
        durationInput.value = '';
        intensitySlider.value = 5;
        intensityDisplay.textContent = '5';
        intensitySlider.setAttribute('aria-valuenow', '5');
        voiceTextarea.value = '';
        notesTextarea.value = '';

        hallucinationCheckboxes.forEach(cb => cb.checked = false);
        customHallucinationContainer.style.display = 'none';
        customHallucinationInput.value = '';
        moodEpisodeRadios.forEach(r => r.checked = false);
        additionalSymptomsCheckboxes.forEach(cb => cb.checked = false);
        triggerInput.value = '';
        medicationRadios.forEach(r => r.checked = false);
        sleepHoursInput.value = '';
        stressSlider.value = 5;
        stressDisplay.textContent = '5';

        copingCheckboxes.forEach(cb => cb.checked = false);
        customCopingContainer.style.display = 'none';
        customCopingInput.value = '';
    }

    function updateAddButtonText() {
        const span = addBtn.querySelector('span');
        if (editingId) {
            span.textContent = 'update entry';
        } else {
            span.textContent = 'log this episode';
        }
    }

    function loadEntries() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Failed to load entries:', e);
            alert('Could not read data from storage. Storage may be full or corrupted.');
            return [];
        }
    }

    function saveEntries(entries) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
        } catch (e) {
            console.error('Failed to save entries:', e);
            alert('Could not save data. Storage may be full or disabled.');
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
        if (confirm('Permanently delete all logged voices? This cannot be undone.')) {
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
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voice-entries-${getTodayDate()}.json`;
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

        if (durationInput.value) {
            const dur = parseInt(durationInput.value, 10);
            if (isNaN(dur) || dur < 0) {
                alert('Duration must be a positive number (or empty).');
                return;
            }
        }

        const hallucinationTypes = [];
        hallucinationCheckboxes.forEach(cb => {
            if (cb.checked && cb.value) hallucinationTypes.push(cb.value);
        });
        if (hallucinationOtherCheckbox.checked && customHallucinationInput.value.trim() !== '') {
            hallucinationTypes.push(customHallucinationInput.value.trim());
        }

        let moodEpisode = null;
        for (let r of moodEpisodeRadios) {
            if (r.checked) {
                moodEpisode = r.value;
                break;
            }
        }

        const additionalSymptoms = [];
        additionalSymptomsCheckboxes.forEach(cb => {
            if (cb.checked) additionalSymptoms.push(cb.value);
        });

        const trigger = triggerInput.value.trim() || null;

        let medication = null;
        for (let r of medicationRadios) {
            if (r.checked) {
                medication = r.value;
                break;
            }
        }

        let sleepHours = null;
        if (sleepHoursInput.value) {
            const val = parseFloat(sleepHoursInput.value);
            if (!isNaN(val) && val >= 0 && val <= 24) sleepHours = val;
            else alert('Please enter a valid number of hours (0-24).');
        }

        const stressLevel = parseInt(stressSlider.value, 10);
        const selectedCoping = [];
        copingCheckboxes.forEach(cb => {
            if (cb.checked && cb.value) selectedCoping.push(cb.value);
        });
        if (copingOtherCheckbox.checked && customCopingInput.value.trim() !== '') {
            selectedCoping.push(customCopingInput.value.trim());
        }

        const entryData = {
            id: editingId || Date.now() + '-' + Math.random().toString(36).substr(2, 6),
            date: dateInput.value,
            time: timeInput.value || null,
            duration: durationInput.value ? parseInt(durationInput.value, 10) : null,
            intensity: parseInt(intensitySlider.value, 10),
            hallucinationTypes: hallucinationTypes.length ? hallucinationTypes : null,
            moodEpisode: moodEpisode,
            additionalSymptoms: additionalSymptoms.length ? additionalSymptoms : null,
            trigger: trigger,
            medication: medication,
            sleepHours: sleepHours,
            stressLevel: stressLevel,
            voice: voiceTextarea.value.trim() || null,
            coping: selectedCoping,
            notes: notesTextarea.value.trim() || null,
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
    clearAllBtn.addEventListener('click', clearAll);

    function formatDateLocal(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function renderAll() {
        const entries = loadEntries();
        totalSpan.textContent = entries.length;

        if (entries.length === 0) {
            avgSpan.textContent = '-';
            weekSpan.textContent = '0';
        } else {
            const sum = entries.reduce((acc, e) => acc + (e.intensity || 0), 0);
            const avg = (sum / entries.length).toFixed(1);
            avgSpan.textContent = avg;

            const now = new Date();
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const weekCount = entries.filter(e => {
                let entryDate;
                if (e.time) {
                    entryDate = new Date(`${e.date}T${e.time}:00`);
                } else {
                    entryDate = new Date(e.timestamp);
                }
                return entryDate >= sevenDaysAgo;
            }).length;
            weekSpan.textContent = weekCount;
        }

        if (entries.length === 0) {
            entriesListDiv.innerHTML = '<div class="empty-message">✨ no entries yet. use the form to start.</div>';
            return;
        }

        let html = '';
        entries.slice(0, 15).forEach(entry => {
            const dateObj = new Date(entry.date + 'T12:00:00');
            const formattedDate = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            const timeStr = entry.time ? ` · ${entry.time}` : '';
            const durationStr = entry.duration ? ` · ${entry.duration} min` : '';
            const intensity = entry.intensity || 5;
            const voiceSnippet = entry.voice ? `“${entry.voice.substring(0, 60)}${entry.voice.length > 60 ? '…' : ''}”` : '(no description)';
            const fullVoice = entry.voice || '';

            const hallTypes = entry.hallucinationTypes ? entry.hallucinationTypes.join(', ') : '';
            const moodEp = entry.moodEpisode ? ` · mood: ${entry.moodEpisode}` : '';
            const symptoms = entry.additionalSymptoms ? ` · symptoms: ${entry.additionalSymptoms.join(', ')}` : '';
            const trigger = entry.trigger ? ` · trigger: ${entry.trigger}` : '';
            const med = entry.medication ? ` · meds: ${entry.medication}` : '';
            const sleep = entry.sleepHours ? ` · sleep: ${entry.sleepHours}h` : '';
            const stress = entry.stressLevel ? ` · stress: ${entry.stressLevel}/10` : '';

            const copingList = entry.coping && entry.coping.length ? entry.coping.join(', ') : 'none recorded';
            const notes = entry.notes ? `<div class="entry-note-preview"><i class="fas fa-pencil-alt"></i> ${entry.notes.substring(0, 50)}${entry.notes.length > 50 ? '…' : ''}</div>` : '';
            const fullNotes = entry.notes || '';

            const showMoreVoice = entry.voice && entry.voice.length > 60 ? `<button class="show-more-btn" data-field="voice" data-id="${entry.id}">show more</button>` : '';
            const showMoreNotes = entry.notes && entry.notes.length > 50 ? `<button class="show-more-btn" data-field="notes" data-id="${entry.id}">show more</button>` : '';

            html += `
                <div class="entry-card" data-id="${entry.id}">
                    <button class="delete-entry" aria-label="Delete entry" title="delete entry"><i class="fas fa-times"></i></button>
                    <button class="edit-entry" aria-label="Edit entry" title="edit entry"><i class="fas fa-pencil-alt"></i></button>
                    <div class="entry-header">
                        <span class="entry-date"><i class="far fa-calendar-alt"></i> ${formattedDate}${timeStr}</span>
                        <span class="entry-intensity">🔥 ${intensity}/10</span>
                    </div>
                    <div class="entry-voice" id="voice-${entry.id}">
                        <span class="voice-text">${voiceSnippet}</span>
                        ${showMoreVoice}
                    </div>
                    <div class="entry-meta">
                        <span><i class="fas fa-hands"></i> ${copingList}</span>
                        ${durationStr}
                    </div>
                    <div class="entry-details" style="font-size:0.8rem; color:#4b5563; margin-top:0.3rem;">
                        ${hallTypes ? '<span><i class="fas fa-eye"></i> ' + hallTypes + '</span>' : ''}
                        ${moodEp} ${symptoms} ${trigger} ${med} ${sleep} ${stress}
                    </div>
                    <div class="entry-notes" id="notes-${entry.id}">
                        ${notes}
                        ${showMoreNotes}
                    </div>
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

        document.querySelectorAll('.show-more-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const field = btn.dataset.field;
                const id = btn.dataset.id;
                const entry = loadEntries().find(e => e.id === id);
                if (entry) {
                    if (field === 'voice' && entry.voice) {
                        const voiceDiv = document.getElementById(`voice-${id}`);
                        const textSpan = voiceDiv.querySelector('.voice-text');
                        if (textSpan) {
                            textSpan.textContent = `“${entry.voice}”`;
                            btn.remove();
                        }
                    } else if (field === 'notes' && entry.notes) {
                        const notesDiv = document.getElementById(`notes-${id}`);
                        notesDiv.innerHTML = `<div class="entry-note-full"><i class="fas fa-pencil-alt"></i> ${entry.notes}</div>`;
                    }
                }
            });
        });
    }

    function populateFormForEdit(entry) {
        dateInput.value = entry.date || getTodayDate();
        timeInput.value = entry.time || '';
        durationInput.value = entry.duration || '';
        intensitySlider.value = entry.intensity || 5;
        intensityDisplay.textContent = intensitySlider.value;
        intensitySlider.setAttribute('aria-valuenow', intensitySlider.value);
        voiceTextarea.value = entry.voice || '';
        notesTextarea.value = entry.notes || '';

        hallucinationCheckboxes.forEach(cb => cb.checked = false);
        customHallucinationContainer.style.display = 'none';
        customHallucinationInput.value = '';
        if (entry.hallucinationTypes && entry.hallucinationTypes.length) {
            entry.hallucinationTypes.forEach(type => {
                let matched = false;
                hallucinationCheckboxes.forEach(cb => {
                    if (cb.value === type) {
                        cb.checked = true;
                        matched = true;
                    }
                });
                if (!matched) {
                    hallucinationOtherCheckbox.checked = true;
                    customHallucinationContainer.style.display = 'block';
                    customHallucinationInput.value = type;
                }
            });
        }

        moodEpisodeRadios.forEach(r => r.checked = false);
        if (entry.moodEpisode) {
            const radio = document.querySelector(`input[name="moodEpisode"][value="${entry.moodEpisode}"]`);
            if (radio) radio.checked = true;
        }

        additionalSymptomsCheckboxes.forEach(cb => cb.checked = false);
        if (entry.additionalSymptoms && entry.additionalSymptoms.length) {
            entry.additionalSymptoms.forEach(sym => {
                additionalSymptomsCheckboxes.forEach(cb => {
                    if (cb.value === sym) cb.checked = true;
                });
            });
        }

        triggerInput.value = entry.trigger || '';

        medicationRadios.forEach(r => r.checked = false);
        if (entry.medication) {
            const radio = document.querySelector(`input[name="medication"][value="${entry.medication}"]`);
            if (radio) radio.checked = true;
        }

        sleepHoursInput.value = entry.sleepHours !== null && entry.sleepHours !== undefined ? entry.sleepHours : '';

        stressSlider.value = entry.stressLevel !== undefined ? entry.stressLevel : 5;
        stressDisplay.textContent = stressSlider.value;

        copingCheckboxes.forEach(cb => cb.checked = false);
        customCopingContainer.style.display = 'none';
        customCopingInput.value = '';
        if (entry.coping && entry.coping.length) {
            entry.coping.forEach(strategy => {
                let matched = false;
                copingCheckboxes.forEach(cb => {
                    if (cb.value === strategy) {
                        cb.checked = true;
                        matched = true;
                    }
                });
                if (!matched) {
                    copingOtherCheckbox.checked = true;
                    customCopingContainer.style.display = 'block';
                    customCopingInput.value = strategy;
                }
            });
        }

        editingId = entry.id;
        updateAddButtonText();
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
        today.setHours(0,0,0,0);

        if (selectedRange === 'week') {
            endDate = new Date(today);
            endDate.setHours(23,59,59,999);
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 6);
            startDate.setHours(0,0,0,0);
        } else if (selectedRange === 'month') {
            endDate = new Date(today);
            endDate.setHours(23,59,59,999);
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 29);
            startDate.setHours(0,0,0,0);
        } else { // custom
            if (!summaryStartDate.value || !summaryEndDate.value) {
                alert('Please select both start and end dates.');
                return;
            }
            startDate = new Date(summaryStartDate.value + 'T00:00:00');
            endDate = new Date(summaryEndDate.value + 'T23:59:59.999');
        }

        const summaryText = buildSummary(startDate, endDate);
        summaryOutput.textContent = summaryText;
        copySummaryBtn.disabled = (summaryText === 'No entries in this period.');
    });

    function buildSummary(start, end) {
        const startStr = formatDateLocal(start);
        const endStr = formatDateLocal(end);

        const entries = loadEntries();
        const filtered = entries.filter(e => {
            if (!e.date) return false;
            return e.date >= startStr && e.date <= endStr;
        }).sort((a,b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));

        if (filtered.length === 0) return 'No entries in this period.';

        let summary = '';
        let currentDate = '';
        filtered.forEach(entry => {
            const entryDateStr = entry.date;
            if (entryDateStr !== currentDate) {
                if (currentDate) summary += '\n';
                const d = new Date(entryDateStr + 'T12:00:00');
                summary += d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + ':\n';
                currentDate = entryDateStr;
            }
            summary += `  - ${entry.time ? entry.time : 'time not recorded'}: `;
            summary += `Intensity ${entry.intensity}/10`;
            if (entry.duration) summary += `, duration ${entry.duration} min`;

            if (entry.hallucinationTypes && entry.hallucinationTypes.length) summary += `, types: ${entry.hallucinationTypes.join(', ')}`;
            if (entry.moodEpisode) summary += `, mood episode: ${entry.moodEpisode}`;
            if (entry.additionalSymptoms && entry.additionalSymptoms.length) summary += `, symptoms: ${entry.additionalSymptoms.join(', ')}`;
            if (entry.trigger) summary += `, trigger: ${entry.trigger}`;
            if (entry.medication) summary += `, medication: ${entry.medication}`;
            if (entry.sleepHours) summary += `, sleep: ${entry.sleepHours}h`;
            if (entry.stressLevel) summary += `, stress: ${entry.stressLevel}/10`;

            summary += `\n    Voice: "${entry.voice ? entry.voice : 'no description'}"`;
            if (entry.coping && entry.coping.length) summary += `\n    Coping: ${entry.coping.join(', ')}`;
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