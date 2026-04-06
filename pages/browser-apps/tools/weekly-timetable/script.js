// Copyright (c) 2024-2026. Jericho Crosby (Chalwk)

(function () {
    // ==========  constants & defaults  ==========
    const STORAGE_KEY = 'TimetableApp';
    const MAX_DAYS = 7;
    const DEFAULT_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', "Friday"];
    const DEFAULT_PERIODS = [
        {name: 'Period 1', start: '09:00', end: '10:00'},
        {name: 'Period 2', start: '10:00', end: '11:00'},
        {name: 'Break', start: '11:00', end: '11:20'},
        {name: 'Period 3', start: '11:20', end: '12:20'},
        {name: 'Lunch', start: '12:20', end: '13:00'},
        {name: 'Period 4', start: '13:00', end: '14:00'},
        {name: 'Period 5', start: '14:00', end: '15:00'}
    ];
    const DEFAULT_STATE = createDefaultState();
    const LEGACY_DEFAULT_STATE = createLegacyDefaultState();

    // DOM stuff
    const els = {
        tableHead: document.getElementById('tableHead'),
        tableBody: document.getElementById('tableBody'),
        currentSubjectDisplay: document.getElementById('currentSubjectDisplay'),
        currentTimeInfo: document.getElementById('currentTimeInfo'),
        sampleBanner: document.getElementById('sampleBanner'),
        addDayBtn: document.getElementById('addDayBtn'),
        addPeriodBtn: document.getElementById('addPeriodBtn'),
        resetDaysBtn: document.getElementById('resetDaysBtn'),
        resetPeriodsBtn: document.getElementById('resetPeriodsBtn'),
        resetFullBtn: document.getElementById('resetFullBtn'),
        exportDataBtn: document.getElementById('exportDataBtn'),
        importFileInput: document.getElementById('importFileInput'),
        timetableTable: document.getElementById('timetableTable'),
        periodModal: document.getElementById('periodModal'),
        periodNameInput: document.getElementById('periodNameInput'),
        periodStartInput: document.getElementById('periodStartInput'),
        periodEndInput: document.getElementById('periodEndInput'),
        savePeriodBtn: document.getElementById('savePeriodBtn'),
        cancelPeriodBtn: document.getElementById('cancelPeriodBtn'),
        modalClose: document.querySelector('.modal-close')
    };

    // The main state object (days, periods, schedule grid)
    const state = {
        days: [],
        periods: [],
        schedule: [],
        customized: false
    };

    let activePeriodIndex = null;   // which period is being edited in modal

    // ----- default data generators -----
    function createDefaultState() {
        const days = [...DEFAULT_DAYS];
        const periods = DEFAULT_PERIODS.map(period => ({...period}));
        const schedule = periods.map((_, periodIndex) =>
            days.map((_, dayIndex) => getDefaultSubject(periodIndex, dayIndex))
        );
        return {days, periods, schedule, customized: false};
    }

    function createLegacyDefaultState() {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const periods = DEFAULT_PERIODS.map(period => ({...period}));
        const schedule = [
            ['Math', 'English', 'Science', 'History', 'Art'],
            ['Physics', 'Literature', 'Biology', 'Geography', 'Music'],
            ['Break', 'Break', 'Break', 'Break', 'Break'],
            ['Programming', 'French', 'Chemistry', 'PE', 'Drama'],
            ['Lunch', 'Lunch', 'Lunch', 'Lunch', 'Lunch'],
            ['Workshop', 'Study', 'Sports', 'Debate', 'Drawing'],
            ['Review', 'Tutorial', 'Lab', 'Seminar', 'Free']
        ];
        return {days, periods, schedule, customized: false};
    }

    // fill any empty cell with a reasonable default
    function getDefaultSubject(periodIndex, dayIndex) {
        const template = [
            ['Assembly', 'Math', 'English', 'Science', 'History', 'Art', 'PE'],
            ['Advisor', 'Physics', 'Literature', 'Biology', 'Geography', 'Music', 'Study'],
            ['Break', 'Break', 'Break', 'Break', 'Break', 'Break', 'Break'],
            ['Programming', 'French', 'Chemistry', 'PE', 'Drama', 'Economics', 'Library'],
            ['Lunch', 'Lunch', 'Lunch', 'Lunch', 'Lunch', 'Lunch', 'Lunch'],
            ['Workshop', 'Study', 'Sports', 'Debate', 'Drawing', 'Lab', 'Free'],
            ['Review', 'Tutorial', 'Lab', 'Seminar', 'Free', 'Catch-up', 'Planning']
        ];
        return template[periodIndex]?.[dayIndex] ?? 'New Subject';
    }

    // helpers for cloning defaults
    function cloneDefaultDays() {
        return [...DEFAULT_DAYS];
    }

    function cloneDefaultPeriods() {
        return DEFAULT_PERIODS.map(p => ({...p}));
    }

    // ----- data sanitization (ensures everything is valid) -----
    function normalizeState(input) {
        let days = Array.isArray(input?.days) && input.days.length ? input.days.map(normalizeText) : cloneDefaultDays();
        let periods = Array.isArray(input?.periods) && input.periods.length ? input.periods.map(normalizePeriod) : cloneDefaultPeriods();
        let schedule = normalizeSchedule(input?.schedule, periods.length, days.length);

        if (days.length > MAX_DAYS) {
            days = days.slice(0, MAX_DAYS);
            schedule = schedule.map(row => row.slice(0, MAX_DAYS));
        }
        const customized = Boolean(input?.customized);
        return {days, periods, schedule, customized};
    }

    function normalizeText(value) {
        return String(value ?? '').trim();
    }

    function normalizePeriod(period) {
        return {
            name: normalizeText(period?.name) || 'New Period',
            start: normalizeTime(period?.start, '12:00'),
            end: normalizeTime(period?.end, '13:00')
        };
    }

    function normalizeTime(value, fallback) {
        const text = normalizeText(value);
        return /^\d{2}:\d{2}$/.test(text) ? text : fallback;
    }

    function normalizeSchedule(schedule, periodCount, dayCount) {
        return Array.from({length: periodCount}, (_, periodIndex) => {
            const sourceRow = Array.isArray(schedule?.[periodIndex]) ? schedule[periodIndex] : [];
            return Array.from({length: dayCount}, (_, dayIndex) => {
                const cell = sourceRow[dayIndex];
                return normalizeText(cell) || (periodIndex < DEFAULT_PERIODS.length && dayIndex < DEFAULT_DAYS.length
                    ? getDefaultSubject(periodIndex, dayIndex)
                    : 'New Subject');
            });
        });
    }

    // check if current data matches any of the built-in defaults (to decide if we show the banner)
    function matchesState(current, baseline) {
        return JSON.stringify({
            days: current.days,
            periods: current.periods,
            schedule: current.schedule
        }) === JSON.stringify({
            days: baseline.days,
            periods: baseline.periods,
            schedule: baseline.schedule
        });
    }

    function isDefaultState(current) {
        return matchesState(current, DEFAULT_STATE) || matchesState(current, LEGACY_DEFAULT_STATE);
    }

    // ----- localStorage load/save -----
    function loadState() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            applyState(DEFAULT_STATE, false);
            return false;
        }
        try {
            const parsed = JSON.parse(raw);
            const normalized = normalizeState(parsed);
            normalized.customized = typeof parsed.customized === 'boolean' ? parsed.customized : !isDefaultState(normalized);
            applyState(normalized, false);
            return true;
        } catch {
            applyState(DEFAULT_STATE, false);
            return false;
        }
    }

    function applyState(nextState, persist = true) {
        state.days = nextState.days.map(normalizeText);
        state.periods = nextState.periods.map(period => ({...period}));
        state.schedule = normalizeSchedule(nextState.schedule, state.periods.length, state.days.length);
        state.customized = Boolean(nextState.customized);
        if (persist) saveState();
        renderAll();
    }

    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                days: state.days,
                periods: state.periods,
                schedule: state.schedule,
                customized: state.customized
            }));
        } catch {
        }
    }

    function markCustomized() {
        state.customized = true;
        saveState();
    }

    // ----- editing actions -----
    function setDayName(index, value) {
        state.days[index] = normalizeText(value) || 'Day';
        markCustomized();
        renderAll();
    }

    function setPeriodField(index, field, value) {
        if (!state.periods[index]) return;
        if (field === 'name') {
            state.periods[index].name = normalizeText(value) || 'New Period';
        } else {
            state.periods[index][field] = normalizeTime(value, field === 'start' ? '12:00' : '13:00');
        }
        markCustomized();
        renderAll();
    }

    function setSubject(periodIndex, dayIndex, value) {
        if (!state.schedule[periodIndex]) return;
        state.schedule[periodIndex][dayIndex] = normalizeText(value) || 'New Subject';
        markCustomized();
        renderTimetable();
        renderCurrentSubject();
        renderHighlights();
    }

    // row/column management
    function addDay() {
        if (state.days.length >= MAX_DAYS) {
            alert(`Cannot add more than ${MAX_DAYS} days.`);
            return;
        }
        state.days.push(`Day ${state.days.length + 1}`);
        state.schedule.forEach(row => row.push('New Subject'));
        markCustomized();
        renderAll();
    }

    function removeDay(index) {
        if (state.days.length <= 1) {
            alert('Cannot remove the only day.');
            return;
        }
        if (confirm(`Are you sure you want to delete "${state.days[index]}"? All subjects in this day will be removed.`)) {
            state.days.splice(index, 1);
            state.schedule.forEach(row => row.splice(index, 1));
            markCustomized();
            renderAll();
        }
    }

    function addPeriod() {
        state.periods.push({name: 'New Period', start: '12:00', end: '13:00'});
        state.schedule.push(Array.from({length: state.days.length}, () => 'New Subject'));
        markCustomized();
        renderAll();
    }

    function removePeriod(index) {
        if (state.periods.length <= 1) {
            alert('Cannot remove the only period.');
            return;
        }
        if (confirm(`Remove period "${state.periods[index].name}"? All subjects in this period will be deleted.`)) {
            state.periods.splice(index, 1);
            state.schedule.splice(index, 1);
            markCustomized();
            renderAll();
        }
    }

    function resetDays() {
        if (confirm('Reset all day names to default (Monday-Friday)? This will not delete subjects but will rename days.')) {
            state.days = cloneDefaultDays();
            state.schedule = normalizeSchedule(state.schedule, state.periods.length, state.days.length);
            markCustomized();
            renderAll();
        }
    }

    function resetPeriods() {
        if (confirm('Reset periods to default (Period 1, Period 2, Break, etc.)? All custom period names and times will be lost.')) {
            state.periods = cloneDefaultPeriods();
            state.schedule = normalizeSchedule(state.schedule, state.periods.length, state.days.length);
            markCustomized();
            renderAll();
        }
    }

    function resetAll() {
        if (confirm('⚠️ RESET ALL: This will erase your entire timetable and restore the sample data. All unsaved exports will be lost. Are you sure?')) {
            const nextState = createDefaultState();
            nextState.customized = true;
            applyState(nextState, false);
            saveState();
        }
    }

    // ----- modal for editing period -----
    function openPeriodEditor(periodIndex) {
        const period = state.periods[periodIndex];
        if (!period) return;
        activePeriodIndex = periodIndex;
        els.periodNameInput.value = period.name;
        els.periodStartInput.value = period.start;
        els.periodEndInput.value = period.end;
        els.periodModal.style.display = 'flex';
    }

    function closePeriodEditor() {
        els.periodModal.style.display = 'none';
        activePeriodIndex = null;
    }

    function savePeriodChanges() {
        if (activePeriodIndex === null) return;
        const newName = normalizeText(els.periodNameInput.value);
        let newStart = normalizeTime(els.periodStartInput.value, '12:00');
        let newEnd = normalizeTime(els.periodEndInput.value, '13:00');

        if (toMinutes(newEnd) <= toMinutes(newStart)) {
            alert('End time must be after start time. Please adjust.');
            return;
        }
        if (newName) setPeriodField(activePeriodIndex, 'name', newName);
        setPeriodField(activePeriodIndex, 'start', newStart);
        setPeriodField(activePeriodIndex, 'end', newEnd);
        closePeriodEditor();
        renderAll();
    }

    // ----- rendering the table -----
    function renderTimetable() {
        const headCells = ['<th>Period / Day</th>']
            .concat(state.days.map((day, index) => `
                <th class="day-header" data-day-index="${index}">
                    ${escapeHtml(day)}
                    <i class="fas fa-trash-alt remove-day-icon" data-day-index="${index}" title="Remove Day"></i>
                </th>
            `))
            .join('');

        const bodyRows = state.periods.map((period, periodIndex) => {
            const cells = state.days.map((_, dayIndex) => {
                const subject = state.schedule[periodIndex]?.[dayIndex] ?? '—';
                return `<td class="subject-cell" data-period-index="${periodIndex}" data-day-index="${dayIndex}">${escapeHtml(subject)}</td>`;
            }).join('');
            return `
                <tr>
                    <td class="period-cell" data-period-index="${periodIndex}" data-period-edit="true">
                        <strong>${escapeHtml(period.name)}</strong><br>
                        <span class="time-label">${escapeHtml(period.start)}-${escapeHtml(period.end)}</span>
                        <i class="fas fa-trash-alt remove-period-icon" data-period-index="${periodIndex}" title="Remove Period"></i>
                    </td>
                    ${cells}
                </tr>
            `;
        }).join('');

        els.tableHead.innerHTML = headCells;
        els.tableBody.innerHTML = bodyRows;
    }

    function renderSampleBanner() {
        if (els.sampleBanner) {
            els.sampleBanner.style.display = 'flex';
        }
    }

    // ----- live current class info (highlight & text) -----
    function renderCurrentSubject() {
        const info = getCurrentSubjectInfo();
        els.currentSubjectDisplay.textContent = info.subject;
        els.currentTimeInfo.textContent = `${info.period} • ${info.timeInfo}`;
    }

    function renderHighlights() {
        // remove old highlight class
        const cells = els.timetableTable.querySelectorAll('.current-period-col');
        cells.forEach(cell => cell.classList.remove('current-period-col'));

        const now = new Date();
        let dayIndex = now.getDay();
        if (dayIndex === 0) dayIndex = -1;
        else dayIndex = dayIndex - 1;  // convert JS Sun=0 -> Mon=0 etc.

        const activePeriodIndex = getActivePeriodIndex(now);
        if (dayIndex < 0 || dayIndex >= state.days.length || activePeriodIndex === -1) return;

        const headers = els.tableHead.querySelectorAll('th');
        headers[dayIndex + 1]?.classList.add('current-period-col');
        const row = els.tableBody.querySelectorAll('tr')[activePeriodIndex];
        row?.querySelectorAll('td')[dayIndex + 1]?.classList.add('current-period-col');
    }

    function getCurrentSubjectInfo() {
        const now = new Date();
        let dayIndex = now.getDay();
        const realDayName = now.toLocaleDateString(undefined, {weekday: 'long'});
        const timeLabel = now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});

        if (dayIndex === 0) dayIndex = -1;
        else dayIndex = dayIndex - 1;

        if (dayIndex < 0 || dayIndex >= state.days.length) {
            return {subject: 'No class', period: 'Weekend / No schedule', timeInfo: `${timeLabel} on ${realDayName}`};
        }

        const dayName = state.days[dayIndex];
        const activePeriodIndex = getActivePeriodIndex(now);
        if (activePeriodIndex === -1) {
            return {
                subject: 'No class',
                period: 'Between periods / After hours',
                timeInfo: `${timeLabel} on ${dayName}`
            };
        }
        const activePeriod = state.periods[activePeriodIndex];
        const subject = state.schedule[activePeriodIndex]?.[dayIndex] ?? '—';
        return {
            subject,
            period: `${activePeriod.name} • ${activePeriod.start}-${activePeriod.end}`,
            timeInfo: `${timeLabel} on ${dayName}`
        };
    }

    function getActivePeriodIndex(now) {
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        for (let index = 0; index < state.periods.length; index++) {
            const period = state.periods[index];
            const start = toMinutes(period.start);
            const end = toMinutes(period.end);
            if (currentMinutes >= start && currentMinutes < end) return index;
        }
        return -1;
    }

    function toMinutes(time) {
        const [hours, minutes] = String(time).split(':').map(Number);
        return hours * 60 + minutes;
    }

    function renderAll() {
        renderSampleBanner();
        renderTimetable();
        renderCurrentSubject();
        renderHighlights();
    }

    function refreshClock() {
        renderCurrentSubject();
        renderHighlights();
    }

    // ----- export / import JSON -----
    function exportData() {
        const blob = new Blob([JSON.stringify({
            days: state.days,
            periods: state.periods,
            schedule: state.schedule,
            customized: state.customized
        }, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'timetable_config.json';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    function importData(file) {
        if (!confirm('Importing JSON will replace your current timetable. Continue?')) return;
        const reader = new FileReader();
        reader.onload = event => {
            try {
                const parsed = JSON.parse(event.target.result);
                let normalized = normalizeState(parsed);
                if (parsed.days?.length > MAX_DAYS) {
                    alert(`Your imported timetable had ${parsed.days.length} days. Only the first ${MAX_DAYS} days were kept.`);
                }
                normalized.customized = true;
                applyState(normalized, false);
                saveState();
                alert('Timetable imported successfully!');
            } catch {
                alert('Error parsing JSON. Invalid file format.');
            }
        };
        reader.readAsText(file);
    }

    // ----- helpers & event binding -----
    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function isRemoveIconClick(target) {
        return target.closest('.remove-day-icon') || target.closest('.remove-period-icon');
    }

    // Wire up all buttons and table interactions
    els.addDayBtn.addEventListener('click', addDay);
    els.addPeriodBtn.addEventListener('click', addPeriod);
    els.resetDaysBtn.addEventListener('click', resetDays);
    els.resetPeriodsBtn.addEventListener('click', resetPeriods);
    els.resetFullBtn.addEventListener('click', resetAll);
    els.exportDataBtn.addEventListener('click', exportData);
    els.importFileInput.addEventListener('change', event => {
        const [file] = event.target.files || [];
        if (file) importData(file);
        event.target.value = '';
    });

    // click on day header -> rename day
    els.tableHead.addEventListener('click', event => {
        if (isRemoveIconClick(event.target)) return;
        const header = event.target.closest('.day-header');
        if (!header) return;
        const index = Number(header.dataset.dayIndex);
        const nextValue = prompt('Enter new day name:', state.days[index]);
        if (nextValue !== null) setDayName(index, nextValue);
    });

    // click on subject or period name (not remove icon)
    els.tableBody.addEventListener('click', event => {
        if (isRemoveIconClick(event.target)) return;
        const subjectCell = event.target.closest('.subject-cell');
        if (subjectCell) {
            const periodIndex = Number(subjectCell.dataset.periodIndex);
            const dayIndex = Number(subjectCell.dataset.dayIndex);
            const currentValue = state.schedule[periodIndex]?.[dayIndex] ?? 'New Subject';
            const nextValue = prompt('Edit subject:', currentValue);
            if (nextValue !== null) setSubject(periodIndex, dayIndex, nextValue);
            return;
        }
        const periodCell = event.target.closest('.period-cell');
        if (periodCell && !event.target.closest('.remove-period-icon')) {
            const periodIndex = Number(periodCell.dataset.periodIndex);
            if (!isNaN(periodIndex)) openPeriodEditor(periodIndex);
        }
    });

    // remove icons (trash can)
    els.timetableTable.addEventListener('click', event => {
        const removeDayIcon = event.target.closest('.remove-day-icon');
        if (removeDayIcon) {
            const dayIndex = Number(removeDayIcon.dataset.dayIndex);
            removeDay(dayIndex);
            return;
        }
        const removePeriodIcon = event.target.closest('.remove-period-icon');
        if (removePeriodIcon) {
            const periodIndex = Number(removePeriodIcon.dataset.periodIndex);
            removePeriod(periodIndex);
        }
    });

    // modal controls
    els.savePeriodBtn.addEventListener('click', savePeriodChanges);
    els.cancelPeriodBtn.addEventListener('click', closePeriodEditor);
    els.modalClose.addEventListener('click', closePeriodEditor);
    window.addEventListener('click', (e) => {
        if (e.target === els.periodModal) closePeriodEditor();
    });

    // bootstrap
    loadState();
    refreshClock();
    setInterval(refreshClock, 30000); // update current class every 30 sec
})();