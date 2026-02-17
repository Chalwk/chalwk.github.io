/*
Copyright (c) 2024-2026. Jericho Crosby (Chalwk)

Time & Date Calculator - JavaScript
*/

(function() {
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const includeEndDateChk = document.getElementById('includeEndDate');
    const calculateBtn = document.getElementById('calculateBtn');

    const resultLine1 = document.getElementById('resultLine1');
    const resultLine2 = document.getElementById('resultLine2');
    const resultDays = document.getElementById('resultDays');
    const resultDesc = document.getElementById('resultDesc');
    const resultYmd = document.getElementById('resultYmd');
    const resultMd = document.getElementById('resultMd');
    const resultAlt = document.getElementById('resultAlt');

    function formatDateUTC(year, month, day) {
        const date = new Date(Date.UTC(year, month - 1, day));
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC'
        });
    }

    function parseDateInput(value) {
        if (!value) return null;
        const parts = value.split('-');
        if (parts.length !== 3) return null;
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
        return { year, month, day };
    }

    function getTodayString() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
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
        return { years, months, days };
    }

    function daysBetween(start, end) {
        const startUtc = Date.UTC(start.year, start.month - 1, start.day);
        const endUtc = Date.UTC(end.year, end.month - 1, end.day);
        const diffMs = endUtc - startUtc;
        return Math.round(diffMs / (1000 * 60 * 60 * 24));
    }

    function formatNumber(n) {
        return n.toLocaleString('en-US');
    }

    function updateResult() {
        const startVal = startDateInput.value;
        const endVal = endDateInput.value;
        const includeEnd = includeEndDateChk.checked;

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

        const start = parseDateInput(startVal);
        const end = parseDateInput(endVal);
        if (!start || !end) {
            resultLine1.textContent = 'Invalid date format.';
            return;
        }

        const startTime = Date.UTC(start.year, start.month - 1, start.day);
        const endTime = Date.UTC(end.year, end.month - 1, end.day);
        if (startTime > endTime) {
            resultLine1.textContent = 'Start date must be before or equal to end date.';
            return;
        }

        const totalDaysExclusive = daysBetween(start, end);
        const totalDays = includeEnd ? totalDaysExclusive + 1 : totalDaysExclusive;

        const startFormatted = formatDateUTC(start.year, start.month, start.day);
        const endFormatted = formatDateUTC(end.year, end.month, end.day);

        const includeText = includeEnd ? 'including' : 'excluding';
        const inclusiveLabel = includeEnd ? 'inclusive' : 'exclusive';

        resultLine1.textContent = `From (inclusive): ${startFormatted}`;
        resultLine2.textContent = `To (${inclusiveLabel}): ${endFormatted}`;

        const daysFormatted = formatNumber(totalDays);
        resultDays.textContent = `Total days in period: ${daysFormatted}`;

        resultDesc.textContent = `The duration is ${daysFormatted} days (${includeText} the final day).`;

        const ymd = getYmdDifference(start, end);
        resultYmd.textContent = `In years, months, days: ${ymd.years} years, ${ymd.months} months, ${ymd.days} days (${includeText} end date).`;

        const totalMonths = ymd.years * 12 + ymd.months;
        resultMd.textContent = `In months and days: ${totalMonths} months, ${ymd.days} days (${includeText} end date).`;

        const seconds = totalDays * 24 * 3600;
        const minutes = totalDays * 24 * 60;
        const hours = totalDays * 24;
        const weeks = Math.floor(totalDays / 7);
        const remDays = totalDays % 7;
        const percent = (totalDays / 365 * 100).toFixed(2);

        resultAlt.innerHTML = `
            Other units:<br>
            ${formatNumber(seconds)} seconds<br>
            ${formatNumber(minutes)} minutes<br>
            ${formatNumber(hours)} hours<br>
            ${formatNumber(totalDays)} days<br>
            ${formatNumber(weeks)} weeks and ${remDays} days<br>
            Percentage of a common year (365 days): ${percent}%
        `;
    }

    calculateBtn.addEventListener('click', updateResult);

    document.querySelectorAll('.today-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const target = e.currentTarget.dataset.target;
            const today = getTodayString();
            if (target === 'start') {
                startDateInput.value = today;
            } else if (target === 'end') {
                endDateInput.value = today;
            }
        });
    });

    window.addEventListener('load', updateResult);
})();