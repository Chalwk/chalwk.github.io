/*
Copyright (c) 2024-2026. Jericho Crosby (Chalwk)

Time & Date Calculator - JavaScript
*/

(function () {
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const includeEndDateChk = document.getElementById('includeEndDate');
    const includeTimeChk = document.getElementById('includeTime');
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    const startTimeGroup = document.getElementById('startTimeGroup');
    const endTimeGroup = document.getElementById('endTimeGroup');
    const calculateBtn = document.getElementById('calculateBtn');

    const resultLine1 = document.getElementById('resultLine1');
    const resultLine2 = document.getElementById('resultLine2');
    const resultDays = document.getElementById('resultDays');
    const resultDesc = document.getElementById('resultDesc');
    const resultYmd = document.getElementById('resultYmd');
    const resultMd = document.getElementById('resultMd');
    const resultAlt = document.getElementById('resultAlt');

    includeTimeChk.addEventListener('change', function () {
        const show = includeTimeChk.checked;
        startTimeGroup.style.display = show ? 'flex' : 'none';
        endTimeGroup.style.display = show ? 'flex' : 'none';
    });

    function formatDateTime(date, includeTime) {
        if (!includeTime) {
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } else {
            return date.toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        }
    }

    function parseDateInput(value) {
        if (!value) return null;
        const parts = value.split('-');
        if (parts.length !== 3) return null;
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
        return {year, month, day};
    }

    function getTodayString() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getCurrentTimeString() {
        const d = new Date();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    function daysInMonth(year, month) {
        return new Date(Date.UTC(year, month, 0)).getUTCDate();
    }

    function getYmdDifference(start, end) {
        let sy = start.year, sm = start.month, sd = start.day;
        let ey = end.year, em = end.month, ed = end.day;

        let years = ey - sy;
        let months = em - sm;
        let days = ed - sd;

        if (days < 0) {
            months--;
            const prevMonth = em - 1;
            const prevMonthYear = prevMonth === 0 ? ey - 1 : ey;
            const prevMonthNum = prevMonth === 0 ? 12 : prevMonth;
            days += daysInMonth(prevMonthYear, prevMonthNum);
        }
        if (months < 0) {
            years--;
            months += 12;
        }
        return {years, months, days};
    }

    function formatNumber(n) {
        return n.toLocaleString('en-US');
    }

    function updateResult() {
        const startVal = startDateInput.value;
        const endVal = endDateInput.value;
        const includeEnd = includeEndDateChk.checked;
        const includeTime = includeTimeChk.checked;

        if (!startVal || !endVal) {
            resultLine1.textContent = 'Please select both dates.';
            resultLine2.textContent = '';
            resultDays.textContent = '';
            resultDesc.textContent = '';
            resultYmd.textContent = '';
            resultMd.textContent = '';
            resultAlt.textContent = '';
            return;
        }

        const startParts = parseDateInput(startVal);
        const endParts = parseDateInput(endVal);
        if (!startParts || !endParts) {
            resultLine1.textContent = 'Invalid date format.';
            return;
        }

        let startHour = 0, startMinute = 0;
        let endHour = 0, endMinute = 0;

        if (includeTime) {
            if (startTimeInput.value) {
                const [h, m] = startTimeInput.value.split(':');
                startHour = parseInt(h, 10) || 0;
                startMinute = parseInt(m, 10) || 0;
            }
            if (endTimeInput.value) {
                const [h, m] = endTimeInput.value.split(':');
                endHour = parseInt(h, 10) || 0;
                endMinute = parseInt(m, 10) || 0;
            }
        }

        const startDate = new Date(startParts.year, startParts.month - 1, startParts.day, startHour, startMinute, 0);
        const endDate = new Date(endParts.year, endParts.month - 1, endParts.day, endHour, endMinute, 0);

        let endEffective = endDate;
        if (includeEnd) {
            endEffective = new Date(endDate.getTime() + 86400000);
        }

        const diffMs = endEffective - startDate;
        if (diffMs < 0) {
            resultLine1.textContent = 'Start date/time must be before or equal to end date/time.';
            return;
        }

        const totalDays = diffMs / 86400000;
        const totalDaysFormatted = Number.isInteger(totalDays) ? totalDays.toString() : totalDays.toFixed(2);

        const startFormatted = formatDateTime(startDate, includeTime && (startHour !== 0 || startMinute !== 0));
        const endFormatted = formatDateTime(endDate, includeTime && (endHour !== 0 || endMinute !== 0));

        const includeText = includeEnd ? 'including' : 'excluding';
        const inclusiveLabel = includeEnd ? 'inclusive' : 'exclusive';

        resultLine1.textContent = `From (inclusive): ${startFormatted}`;
        resultLine2.textContent = `To (${inclusiveLabel}): ${endFormatted}`;

        resultDays.textContent = `Total days in period: ${formatNumber(totalDaysFormatted)}`;

        const durationText = includeTime ? 'exact duration' : 'days';
        resultDesc.textContent = `The ${durationText} is ${formatNumber(totalDaysFormatted)} days (${includeText} the final day).`;

        const ymd = getYmdDifference(startParts, endParts);
        resultYmd.textContent = `In years, months, days: ${ymd.years} years, ${ymd.months} months, ${ymd.days} days (${includeText} end date).`;

        const totalMonths = ymd.years * 12 + ymd.months;
        resultMd.textContent = `In months and days: ${totalMonths} months, ${ymd.days} days (${includeText} end date).`;

        const seconds = diffMs / 1000;
        const minutes = seconds / 60;
        const hours = minutes / 60;
        const weeks = totalDays / 7;
        const wholeWeeks = Math.floor(weeks);
        const remDays = (totalDays % 7).toFixed(2);
        const percent = (totalDays / 365 * 100).toFixed(2);

        resultAlt.innerHTML = `
            Other units:<br>
            ${formatNumber(seconds)} seconds<br>
            ${formatNumber(minutes)} minutes<br>
            ${formatNumber(hours)} hours<br>
            ${formatNumber(totalDaysFormatted)} days<br>
            ${formatNumber(wholeWeeks)} weeks and ${remDays} days<br>
            Percentage of a common year (365 days): ${percent}%
        `;
    }

    calculateBtn.addEventListener('click', updateResult);

    document.querySelectorAll('.today-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const target = e.currentTarget.dataset.target;
            const todayDate = getTodayString();
            if (target === 'start') {
                startDateInput.value = todayDate;
                if (includeTimeChk.checked) {
                    startTimeInput.value = getCurrentTimeString();
                }
            } else if (target === 'end') {
                endDateInput.value = todayDate;
                if (includeTimeChk.checked) {
                    endTimeInput.value = getCurrentTimeString();
                }
            }
        });
    });

    document.querySelectorAll('.now-time-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const targetId = e.currentTarget.dataset.target; // 'startTime' or 'endTime'
            const timeInput = document.getElementById(targetId);
            if (timeInput) {
                timeInput.value = getCurrentTimeString();
            }
        });
    });

    window.addEventListener('load', updateResult);
})();