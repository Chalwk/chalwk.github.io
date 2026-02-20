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
    const addBtn = document.getElementById('addEntryBtn');
    const clearFormBtn = document.getElementById('clearFormBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const entriesListDiv = document.getElementById('entriesList');
    const totalSpan = document.getElementById('totalEntries');
    const avgSpan = document.getElementById('avgIntensity');
    const weekSpan = document.getElementById('thisWeek');

    const STORAGE_KEY = 'voice_entries';

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
    });

    document.getElementById('todayDateBtn').addEventListener('click', function() {
        dateInput.value = getTodayDate();
    });
    document.getElementById('nowTimeBtn').addEventListener('click', function() {
        timeInput.value = getCurrentTime();
    });

    clearFormBtn.addEventListener('click', function() {
        dateInput.value = getTodayDate();
        timeInput.value = '';
        durationInput.value = '';
        intensitySlider.value = 5;
        intensityDisplay.textContent = '5';
        voiceTextarea.value = '';
        notesTextarea.value = '';
        copingCheckboxes.forEach(cb => cb.checked = false);
    });

    function loadEntries() {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    function saveEntries(entries) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    }

    function addEntry(entry) {
        const entries = loadEntries();
        entries.unshift(entry);
        saveEntries(entries);
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
        }
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
                const d = new Date(e.date + 'T12:00:00');
                return d >= sevenDaysAgo;
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
            const copingList = entry.coping && entry.coping.length ? entry.coping.join(', ') : 'none recorded';
            const notes = entry.notes ? `<div style="font-size:0.8rem; margin-top:0.3rem;"><i class="fas fa-pencil-alt"></i> ${entry.notes.substring(0, 50)}${entry.notes.length>50?'…':''}</div>` : '';

            html += `
                <div class="entry-card" data-id="${entry.id}">
                    <button class="delete-entry" title="delete entry"><i class="fas fa-times"></i></button>
                    <div class="entry-header">
                        <span class="entry-date"><i class="far fa-calendar-alt"></i> ${formattedDate}${timeStr}</span>
                        <span class="entry-intensity">🔥 ${intensity}/10</span>
                    </div>
                    <div class="entry-voice">${voiceSnippet}</div>
                    <div class="entry-meta">
                        <span><i class="fas fa-hands"></i> ${copingList}</span>
                        ${durationStr}
                    </div>
                    ${notes}
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
                    }
                }
            });
        });
    }

    function handleAddEntry() {
        if (!dateInput.value) {
            alert('Please select a date.');
            return;
        }

        const selectedCoping = [];
        copingCheckboxes.forEach(cb => {
            if (cb.checked) selectedCoping.push(cb.value);
        });

        const newEntry = {
            id: Date.now() + '-' + Math.random().toString(36).substr(2, 6),
            date: dateInput.value,
            time: timeInput.value || null,
            duration: durationInput.value ? parseInt(durationInput.value) : null,
            intensity: parseInt(intensitySlider.value, 10),
            voice: voiceTextarea.value.trim() || null,
            coping: selectedCoping,
            notes: notesTextarea.value.trim() || null,
            timestamp: new Date().toISOString()
        };

        addEntry(newEntry);
        timeInput.value = '';
        durationInput.value = '';
        intensitySlider.value = 5;
        intensityDisplay.textContent = '5';
        voiceTextarea.value = '';
        notesTextarea.value = '';
        copingCheckboxes.forEach(cb => cb.checked = false);
        dateInput.value = getTodayDate();
    }

    addBtn.addEventListener('click', handleAddEntry);
    clearAllBtn.addEventListener('click', clearAll);
    renderAll();
})();