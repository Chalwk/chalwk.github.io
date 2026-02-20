/*
Copyright (c) 2024-2026. Jericho Crosby (Chalwk)

Voice Tracker - JavaScript
*/

(function() {
    const dateInput = document.getElementById('logDate');
    const timeInput = document.getElementById('logTime');
    const durationInput = document.getElementById('logDuration');
    const intensitySlider = document.getElementById('logIntensity');
    const intensityDisplay = document.getElementById('intensityDisplay');
    const voiceTextarea = document.getElementById('logVoice');
    const notesTextarea = document.getElementById('logNotes');
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
    const footerCopyright = document.getElementById('footerCopyright');

    const currentYear = new Date().getFullYear();
    footerCopyright.textContent = `© ${currentYear} Jericho Crosby. All rights reserved.`;

    const STORAGE_KEY = 'voice_entries';
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

    dateInput.value = getTodayDate();

    intensitySlider.addEventListener('input', function() {
        intensityDisplay.textContent = this.value;
        this.setAttribute('aria-valuenow', this.value);
    });

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

        dateInput.value = getTodayDate();
        timeInput.value = '';
        durationInput.value = '';
        intensitySlider.value = 5;
        intensityDisplay.textContent = '5';
        intensitySlider.setAttribute('aria-valuenow', '5');
        voiceTextarea.value = '';
        notesTextarea.value = '';
        copingCheckboxes.forEach(cb => cb.checked = false);
        customCopingContainer.style.display = 'none';
        customCopingInput.value = '';
    }

    addBtn.addEventListener('click', handleAddEntry);
    clearAllBtn.addEventListener('click', clearAll);

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

    renderAll();
})();