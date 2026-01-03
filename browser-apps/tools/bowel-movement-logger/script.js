/*
Copyright (c) 2025-2026. Jericho Crosby (Chalwk)

Bowel Movement Logger JavaScript
*/

let bowelMovementData = [];

const sampleData = [
    { id: 1, date: "2025-10-05", time: "08:30", type: "3", notes: "Normal movement" },
    { id: 2, date: "2025-10-07", time: "09:15", type: "4", notes: "Slightly loose" },
    { id: 3, date: "2025-10-09", time: "10:00", type: "2", notes: "Hard, constipated" },
    { id: 4, date: "2025-10-11", time: "08:00 / 14:30", type: "3/4", notes: "Two movements, one normal one loose" },
    { id: 5, date: "2025-10-13", time: "07:45", type: "3", notes: "" },
    { id: 6, date: "2025-10-15", time: "09:00", type: "5", notes: "Loose" },
    { id: 7, date: "2025-10-17", time: "08:30", type: "3", notes: "Normal" },
    { id: 8, date: "2025-10-19", time: "10:15", type: "4", notes: "Soft" },
    { id: 9, date: "2025-10-21", time: "08:45", type: "3", notes: "Normal" },
    { id: 10, date: "2025-10-23", time: "09:30", type: "4", notes: "Slightly soft" },
    { id: 11, date: "2025-10-25", time: "08:00", type: "3", notes: "" },
    { id: 12, date: "2025-10-27", time: "11:00", type: "2-3", notes: "Between type 2 and 3" },
    { id: 13, date: "2025-10-29", time: "08:30", type: "3", notes: "Regular" },
    { id: 14, date: "2025-11-01", time: "09:15", type: "4", notes: "Morning movement" },
    { id: 15, date: "2025-11-03", time: "08:45 / 16:00", type: "3/5", notes: "Two movements, second one loose" }
];

let isUsingSampleData = false;

function checkAndLoadSampleData() {
    const savedData = localStorage.getItem('bowelMovementData');

    if (!savedData || savedData === '[]') {
        loadSampleData();
        showSampleDataNotification();
    } else {
        try {
            const parsed = JSON.parse(savedData);
            if (parsed.length === 0) {
                loadSampleData();
                showSampleDataNotification();
            } else {
                const firstEntry = parsed[0];
                if (firstEntry && firstEntry.id === 1 && firstEntry.date === "2025-12-15") {
                    isUsingSampleData = true;
                    showSampleDataNotification();
                }
            }
        } catch (e) {
            console.error('Error checking data:', e);
        }
    }
}

function loadSampleData() {
    bowelMovementData = [...sampleData];
    saveData();
    isUsingSampleData = true;

    normalizeAllDates();
    renderLogTable();
    updatePredictionAndStats();
    populateMonthFilter();

    return bowelMovementData;
}

function clearSampleData() {
    if (confirm('This will clear all sample data and allow you to start with your own entries. Continue?')) {
        bowelMovementData = [];
        localStorage.removeItem('bowelMovementData');
        isUsingSampleData = false;

        renderLogTable();
        updatePredictionAndStats();
        populateMonthFilter();
        hideSampleDataNotification();
        alert('Sample data cleared! You can now add your own entries.');
    }
}

function showSampleDataNotification() {
    const notification = document.getElementById('sampleDataNotification');
    if (notification) {
        notification.style.display = 'block';
    }
    isUsingSampleData = true;
}

function hideSampleDataNotification() {
    const notification = document.getElementById('sampleDataNotification');
    if (notification) {
        notification.style.display = 'none';
    }
    isUsingSampleData = false;
}

function normalizeDateString(s) {
    if (!s) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

    const dd_mm_yyyy_match = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (dd_mm_yyyy_match) {
        const day = dd_mm_yyyy_match[1].padStart(2, '0');
        const month = dd_mm_yyyy_match[2].padStart(2, '0');
        const year = dd_mm_yyyy_match[3];
        return `${year}-${month}-${day}`;
    }

    const d_mm_yyyy_match = s.match(/^(\d{1})-(\d{1,2})-(\d{4})$/);
    if (d_mm_yyyy_match) {
        const day = d_mm_yyyy_match[1].padStart(2, '0');
        const month = d_mm_yyyy_match[2].padStart(2, '0');
        const year = d_mm_yyyy_match[3];
        return `${year}-${month}-${day}`;
    }

    const monthMap = {
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
    };

    const monthNameMatch = s.toLowerCase().match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})/);
    if (monthNameMatch) {
        const monthName = monthNameMatch[1];
        const day = parseInt(monthNameMatch[2]);
        const month = monthMap[monthName];

        if (month !== undefined && !isNaN(day)) {
            const today = new Date();
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();

            let year = currentYear;
            if (month > currentMonth) {
                year = currentYear - 1;
            }

            const date = new Date(year, month, day);
            return date.toISOString().split('T')[0];
        }
    }

    let d = new Date(s);
    if (isNaN(d)) {
        d = new Date(s + ' ' + new Date().getFullYear());
    }

    if (!isNaN(d)) {
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    console.warn(`Could not parse date: "${s}"`);
    return null;
}

function normalizeAllDates() {
    let normalizedCount = 0;
    let errorCount = 0;

    bowelMovementData = bowelMovementData.map(entry => {
        const normalizedDate = normalizeDateString(entry.date);

        if (normalizedDate) {
            normalizedCount++;
            return {
                ...entry,
                date: normalizedDate
            };
        } else {
            errorCount++;
            console.error(`Failed to normalize date for entry ID ${entry.id}: ${entry.date}`);
            return entry;
        }
    });

    bowelMovementData.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
    });

    console.log(`Normalized ${normalizedCount} dates, ${errorCount} errors`);
    return bowelMovementData;
}

function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function getTypeClass(type) {
    if (type.includes('1') || type.includes('2')) return 'type-1';
    if (type.includes('3')) return 'type-3';
    if (type.includes('4') || type.includes('5') || type.includes('6')) return 'type-4';
    return '';
}

function extractIndividualEvents() {
    const events = [];
    let errorCount = 0;

    bowelMovementData.forEach(entry => {
        try {
            const times = entry.time.split(' / ');
            const types = entry.type.split('/');
            const notes = entry.notes;

            for (let i = 0; i < Math.max(times.length, types.length); i++) {
                const time = times[i] ? times[i].trim() : '';
                const type = types[i] ? types[i].trim() : '3';

                if (time) {
                    const cleanTime = time.replace('~', '');

                    let dateTime;

                    try {
                        dateTime = new Date(`${entry.date}T${cleanTime}:00`);

                        if (isNaN(dateTime)) {
                            const [hours, minutes] = cleanTime.split(':').map(Number);
                            const date = new Date(entry.date);
                            date.setHours(hours, minutes, 0, 0);
                            dateTime = date;
                        }
                    } catch (timeError) {
                        console.warn(`Error parsing time "${time}" for entry ${entry.id}:`, timeError);
                        dateTime = new Date(entry.date);
                    }

                    if (!isNaN(dateTime.getTime())) {
                        events.push({
                            timestamp: dateTime.getTime(),
                            datetime: dateTime,
                            date: entry.date,
                            time: time,
                            type: type,
                            notes: notes,
                            id: `${entry.id}-${i}`,
                            originalEntryId: entry.id
                        });
                    } else {
                        errorCount++;
                        console.warn(`Invalid datetime for entry ${entry.id}, time: ${time}`);
                    }
                } else {
                    const dateTime = new Date(entry.date);
                    if (!isNaN(dateTime.getTime())) {
                        events.push({
                            timestamp: dateTime.getTime(),
                            datetime: dateTime,
                            date: entry.date,
                            time: '',
                            type: type,
                            notes: notes,
                            id: `${entry.id}-${i}`,
                            originalEntryId: entry.id
                        });
                    }
                }
            }
        } catch (error) {
            errorCount++;
            console.error(`Error processing entry ${entry.id}:`, error);
        }
    });

    const sortedEvents = events.sort((a, b) => a.timestamp - b.timestamp);

    if (errorCount > 0) {
        console.warn(`Found ${errorCount} time parsing errors`);
    }

    return sortedEvents;
}

function calculateEventIntervals(events) {
    if (events.length < 2) return [];

    const intervals = [];
    for (let i = 1; i < events.length; i++) {
        const intervalHours = (events[i].timestamp - events[i-1].timestamp) / (1000 * 60 * 60);
        intervals.push(intervalHours);
    }

    return intervals;
}

function calculateTrimmedMean(arr, trimPercent = 0.1) {
    if (arr.length === 0) return 0;

    const sorted = [...arr].sort((a, b) => a - b);
    const trimCount = Math.floor(sorted.length * trimPercent);
    const trimmed = sorted.slice(trimCount, sorted.length - trimCount);

    if (trimmed.length === 0) return sorted[Math.floor(sorted.length / 2)];

    return trimmed.reduce((sum, val) => sum + val, 0) / trimmed.length;
}

function calculateWeightedMean(intervals, weights) {
    if (intervals.length === 0) return 0;

    let weightedSum = 0;
    let weightSum = 0;

    for (let i = 0; i < intervals.length; i++) {
        const weight = weights[i] || 1;
        weightedSum += intervals[i] * weight;
        weightSum += weight;
    }

    return weightedSum / weightSum;
}

function getRecencyWeights(events, decayFactor = 0.95) {
    const weights = [];
    const now = Date.now();

    for (let i = 0; i < events.length - 1; i++) {
        const age = (now - events[i].timestamp) / (1000 * 60 * 60 * 24);
        const weight = Math.pow(decayFactor, age);
        weights.push(weight);
    }

    return weights;
}

function calculatePoissonProbabilities(avgEventsPerDay) {
    if (avgEventsPerDay <= 0) return { p24: 0, p48: 0, p72: 0 };

    const lambda = avgEventsPerDay;
    const p24 = 1 - Math.exp(-lambda * 1);
    const p48 = 1 - Math.exp(-lambda * 2);
    const p72 = 1 - Math.exp(-lambda * 3);

    return {
        p24: Math.min(p24, 0.99),
        p48: Math.min(p48, 0.99),
        p72: Math.min(p72, 0.99)
    };
}

function analyzeDayOfWeekPattern(events) {
    const dayCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    events.forEach(event => {
        const day = event.datetime.getDay();
        dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    let maxDay = 0;
    let maxCount = 0;
    for (let day in dayCounts) {
        if (dayCounts[day] > maxCount) {
            maxCount = dayCounts[day];
            maxDay = parseInt(day);
        }
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return {
        counts: dayCounts,
        mostActiveDay: dayNames[maxDay],
        dayFactor: maxCount / (events.length / 7)
    };
}

function analyzeTimeOfDayPattern(events) {
    const hourCounts = Array(24).fill(0);

    events.forEach(event => {
        const hour = event.datetime.getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

    return {
        counts: hourCounts,
        peakHour: peakHour,
        isMorningPerson: peakHour >= 5 && peakHour <= 11,
        isAfternoonPerson: peakHour >= 12 && peakHour <= 17,
        isEveningPerson: peakHour >= 18 || peakHour <= 4
    };
}

function detectOutliers(intervals) {
    if (intervals.length < 3) return { outliers: [], cleanedIntervals: intervals };

    const sorted = [...intervals].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;

    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const outliers = intervals.filter(interval => interval < lowerBound || interval > upperBound);
    const cleanedIntervals = intervals.filter(interval => interval >= lowerBound && interval <= upperBound);

    return { outliers, cleanedIntervals };
}

function detectTrend(events) {
    if (events.length < 4) return { trend: 'insufficient data', slope: 0 };

    const timestamps = events.map((e, i) => i);
    const intervals = calculateEventIntervals(events);

    if (intervals.length === 0) return { trend: 'insufficient data', slope: 0 };

    const n = intervals.length;
    const sumX = timestamps.slice(0, n).reduce((a, b) => a + b, 0);
    const sumY = intervals.reduce((a, b) => a + b, 0);
    const sumXY = timestamps.slice(0, n).reduce((sum, x, i) => sum + x * intervals[i], 0);
    const sumX2 = timestamps.slice(0, n).reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    let trend;
    if (slope > 0.1) trend = 'increasing';
    else if (slope < -0.1) trend = 'decreasing';
    else trend = 'stable';

    return { trend, slope };
}

function groupEventsByDate(events) {
    const grouped = {};
    events.forEach(event => {
        const dateStr = event.date;
        if (!grouped[dateStr]) {
            grouped[dateStr] = [];
        }
        grouped[dateStr].push(event);
    });
    return grouped;
}

function calculateDayIntervals(events) {
    if (events.length < 2) return [];

    const grouped = groupEventsByDate(events);
    const uniqueDates = Object.keys(grouped).sort();

    const intervals = [];
    for (let i = 1; i < uniqueDates.length; i++) {
        const date1 = new Date(uniqueDates[i-1]);
        const date2 = new Date(uniqueDates[i]);
        const intervalDays = (date2 - date1) / (1000 * 60 * 60 * 24);
        intervals.push(intervalDays);
    }

    return intervals;
}

function calculateEnhancedPrediction() {
    normalizeAllDates();
    const events = extractIndividualEvents();

    if (events.length < 2) {
        return {
            nextDate: null,
            avgFrequency: 0,
            daysSinceLast: calculateDaysSinceLast(events),
            predictionText: events.length === 0 ? 'No data available' : 'Need more data',
            probabilities: { p24: 0, p48: 0, p72: 0 },
            patterns: {},
            stats: {}
        };
    }

    const grouped = groupEventsByDate(events);
    const uniqueDates = Object.keys(grouped).sort();
    const dayIntervals = calculateDayIntervals(events);

    if (dayIntervals.length === 0) {
        return {
            nextDate: null,
            avgFrequency: 0,
            daysSinceLast: 0,
            predictionText: 'Need more data (only one day recorded)',
            probabilities: { p24: 0.3, p48: 0.5, p72: 0.7 },
            patterns: {},
            stats: {}
        };
    }

    const intervalsInDays = dayIntervals;
    const meanInterval = intervalsInDays.reduce((a, b) => a + b, 0) / intervalsInDays.length;
    const medianInterval = intervalsInDays.sort((a, b) => a - b)[Math.floor(intervalsInDays.length / 2)];
    const trimmedMeanInterval = calculateTrimmedMean(intervalsInDays, 0.1);

    const recencyWeights = getRecencyWeights(events);
    const weightedMeanInterval = calculateWeightedMean(intervalsInDays, recencyWeights);

    const { outliers, cleanedIntervals } = detectOutliers(intervalsInDays);
    const outlierAdjustedMean = cleanedIntervals.length > 0 ?
    cleanedIntervals.reduce((a, b) => a + b, 0) / cleanedIntervals.length :
    weightedMeanInterval;

    const firstDate = new Date(uniqueDates[0]);
    const lastDate = new Date(uniqueDates[uniqueDates.length - 1]);
    const totalDaysSpan = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
    const totalDaysWithEvents = uniqueDates.length;
    const eventsPerDay = events.length / Math.max(totalDaysSpan, 1);
    const probabilities = calculatePoissonProbabilities(eventsPerDay);
    const lastEventDate = new Date(uniqueDates[uniqueDates.length - 1]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStr = today.toISOString().split('T')[0];
    const hasEventsToday = grouped[todayStr] !== undefined;

    const daysSinceLast = hasEventsToday ? 0 : Math.floor((today - lastEventDate) / (1000 * 60 * 60 * 24));

    let nextDate;
    if (hasEventsToday) {
        nextDate = new Date(today);
        nextDate.setDate(nextDate.getDate() + (outlierAdjustedMean || weightedMeanInterval));
    } else {
        nextDate = new Date(lastEventDate);
        nextDate.setDate(nextDate.getDate() + (outlierAdjustedMean || weightedMeanInterval));
    }

    let predictionText;

    if (hasEventsToday) {
        if (probabilities.p24 > 0.3) {
            predictionText = 'Possibly tomorrow';
        } else {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            predictionText = formatDateForDisplay(tomorrow.toISOString().split('T')[0]);
        }
    } else {
        if (probabilities.p24 > 0.7) {
            predictionText = 'Very likely today';
        } else if (probabilities.p24 > 0.4) {
            predictionText = 'Likely today';
        } else if (nextDate.toDateString() === today.toDateString()) {
            predictionText = 'Possibly today';
        } else if (nextDate.toDateString() === new Date(today.getTime() + 24*60*60*1000).toDateString()) {
            predictionText = 'Likely tomorrow';
        } else {
            predictionText = formatDateForDisplay(nextDate.toISOString().split('T')[0]);
        }
    }

    const patterns = {};

    if (events.length > 0) {
        patterns.dayOfWeek = analyzeDayOfWeekPattern(events);
        patterns.timeOfDay = analyzeTimeOfDayPattern(events);
        patterns.trend = detectTrend(events);
    }

    return {
        nextDate: nextDate,
        avgFrequency: weightedMeanInterval.toFixed(1),
        daysSinceLast: daysSinceLast,
        predictionText: predictionText,
        probabilities: probabilities,
        patterns: patterns,
        stats: {
            meanInterval: meanInterval.toFixed(2),
            medianInterval: medianInterval.toFixed(2),
            weightedMean: weightedMeanInterval.toFixed(2),
            trimmedMean: trimmedMeanInterval.toFixed(2),
            eventsPerDay: eventsPerDay.toFixed(2),
            totalDaysWithEvents: totalDaysWithEvents,
            totalDaysSpan: totalDaysSpan.toFixed(1),
            outlierCount: outliers.length
        }
    };
}

function calculateDaysSinceLast(events) {
    if (events.length === 0) return 0;

    const lastEvent = events[events.length - 1];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDate = new Date(lastEvent.date);

    return Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
}

function updateEnhancedPredictionDisplay(prediction) {
    const nextPredictionElement = document.getElementById('nextPrediction');
    if (!nextPredictionElement) return;

    if (prediction.predictionText === 'Need more data' || prediction.predictionText === 'No data available') {
        nextPredictionElement.innerHTML = `
            <div style="font-size: 1.4rem; margin-bottom: 5px;">${prediction.predictionText}</div>
            <div class="prediction-probability">
                <span title="Next 24 hours">Add more entries for predictions</span>
            </div>
        `;
    } else {
        nextPredictionElement.innerHTML = `
            <div style="font-size: 1.4rem; margin-bottom: 5px;">${prediction.predictionText}</div>
            <div class="prediction-probability">
                <span title="Next 24 hours">24h: ${Math.round(prediction.probabilities.p24 * 100)}%</span>
                <span title="Next 48 hours">48h: ${Math.round(prediction.probabilities.p48 * 100)}%</span>
                <span title="Next 72 hours">72h: ${Math.round(prediction.probabilities.p72 * 100)}%</span>
            </div>
            ${prediction.patterns.dayOfWeek ?
                `<div class="prediction-pattern">
                    Most active: ${prediction.patterns.dayOfWeek.mostActiveDay}
                    ${prediction.patterns.trend.trend !== 'insufficient data' ?
                        `<span class="trend-indicator ${prediction.patterns.trend.trend === 'increasing' ? 'trend-up' :
                          prediction.patterns.trend.trend === 'decreasing' ? 'trend-down' : 'trend-stable'}">
                          ${prediction.patterns.trend.trend === 'increasing' ? '↗' :
                           prediction.patterns.trend.trend === 'decreasing' ? '↘' : '→'}
                        </span>` : ''}
                </div>` : ''}
        `;
    }

    document.getElementById('avgFrequency').textContent = `${prediction.avgFrequency} days`;
    document.getElementById('daysSinceLast').textContent = `${prediction.daysSinceLast} days`;
}

function updateDetailedStatistics(prediction) {
    const stats = calculateStatistics();
    document.getElementById('totalEntries').textContent = stats.totalEntries;
    document.getElementById('avgDaysBetween').textContent = stats.avgDaysBetween;
    document.getElementById('mostCommonType').textContent = stats.mostCommonType;
    document.getElementById('currentStreak').textContent = stats.currentStreak;

    let detailedStatsContainer = document.getElementById('detailedStats');
    if (!detailedStatsContainer && prediction.stats && Object.keys(prediction.stats).length > 0) {
        detailedStatsContainer = document.createElement('div');
        detailedStatsContainer.id = 'detailedStats';
        detailedStatsContainer.className = 'detailed-stats';
        detailedStatsContainer.innerHTML = `
            <div class="stat-card small">
                <div class="stat-value">${prediction.stats.eventsPerDay || '0.0'}</div>
                <div class="stat-label">Events/Day</div>
            </div>
            <div class="stat-card small">
                <div class="stat-value">${prediction.stats.medianInterval || '0.0'}</div>
                <div class="stat-label">Median Interval</div>
            </div>
            <div class="stat-card small">
                <div class="stat-value">${prediction.stats.weightedMean || '0.0'}</div>
                <div class="stat-label">Weighted Mean</div>
            </div>
            <div class="stat-card small">
                <div class="stat-value">${prediction.stats.outlierCount || '0'}</div>
                <div class="stat-label">Outliers</div>
            </div>
        `;

        const statsGrid = document.querySelector('.stats-grid');
        if (statsGrid) {
            statsGrid.appendChild(detailedStatsContainer);
        }
    } else if (detailedStatsContainer && prediction.stats) {
        const statCards = detailedStatsContainer.querySelectorAll('.stat-card');
        if (statCards.length >= 4) {
            statCards[0].querySelector('.stat-value').textContent = prediction.stats.eventsPerDay || '0.0';
            statCards[1].querySelector('.stat-value').textContent = prediction.stats.medianInterval || '0.0';
            statCards[2].querySelector('.stat-value').textContent = prediction.stats.weightedMean || '0.0';
            statCards[3].querySelector('.stat-value').textContent = prediction.stats.outlierCount || '0';
        }
    }
}

function calculateStatistics() {
    const events = extractIndividualEvents();
    const totalEntries = events.length;

    const prediction = calculateEnhancedPrediction();
    const avgDaysBetween = prediction.avgFrequency || '0.0';

    const typeCounts = {};
    events.forEach(event => {
        const primaryType = event.type.split('-')[0];
        typeCounts[primaryType] = (typeCounts[primaryType] || 0) + 1;
    });

    let mostCommonType = '-';
    let maxCount = 0;
    for (const type in typeCounts) {
        if (typeCounts[type] > maxCount) {
            maxCount = typeCounts[type];
            mostCommonType = `Type ${type}`;
        }
    }

    let currentStreak = 0;
    if (events.length > 0) {
        const eventsByDate = {};
        events.forEach(event => {
            const date = event.date;
            if (!eventsByDate[date]) {
                eventsByDate[date] = [];
            }
            eventsByDate[date].push(event);
        });

        const sortedDates = Object.keys(eventsByDate).sort((a, b) => new Date(b) - new Date(a));
        currentStreak = 1;

        for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = new Date(sortedDates[i-1]);
            const currDate = new Date(sortedDates[i]);
            const diffDays = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                currentStreak++;
            } else {
                break;
            }
        }
    }

    return {
        totalEntries,
        avgDaysBetween,
        mostCommonType,
        currentStreak
    };
}

function renderLogTable(data = bowelMovementData) {
    const tableBody = document.getElementById('logTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="no-results">No entries found</td></tr>';
        return;
    }

    const sortedData = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedData.forEach(entry => {
        const row = document.createElement('tr');
        row.className = getTypeClass(entry.type);

        const displayDate = formatDateForDisplay(entry.date);

        row.innerHTML = `
                <td>${displayDate}</td>
                <td>${entry.time}</td>
                <td><span class="type-badge">${entry.type}</span></td>
                <td>${entry.notes || '-'}</td>
                <td class="action-buttons">
                    <button class="action-btn edit-btn" data-id="${entry.id}">Edit</button>
                    <button class="action-btn delete-btn" data-id="${entry.id}">Delete</button>
                </td>
            `;

        tableBody.appendChild(row);
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            editEntry(id);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            deleteEntry(id);
        });
    });
}

function createTimeTypePair(time = '', type = '3') {
    const pairDiv = document.createElement('div');
    pairDiv.className = 'time-type-pair';

    pairDiv.innerHTML = `
            <input type="time" class="form-control movement-time" value="${time}" required>
            <select class="form-control movement-type" required>
                <option value="1" ${type === '1' ? 'selected' : ''}>Type 1</option>
                <option value="2" ${type === '2' ? 'selected' : ''}>Type 2</option>
                <option value="3" ${type === '3' ? 'selected' : ''}>Type 3</option>
                <option value="4" ${type === '4' ? 'selected' : ''}>Type 4</option>
                <option value="5" ${type === '5' ? 'selected' : ''}>Type 5</option>
                <option value="6" ${type === '6' ? 'selected' : ''}>Type 6</option>
                <option value="7" ${type === '7' ? 'selected' : ''}>Type 7</option>
                <option value="1-2" ${type === '1-2' ? 'selected' : ''}>Type 1-2</option>
                <option value="2-3" ${type === '2-3' ? 'selected' : ''}>Type 2-3</option>
                <option value="3-4" ${type === '3-4' ? 'selected' : ''}>Type 3-4</option>
                <option value="4-5" ${type === '4-5' ? 'selected' : ''}>Type 4-5</option>
                <option value="5-6" ${type === '5-6' ? 'selected' : ''}>Type 5-6</option>
            </select>
            <button type="button" class="remove-pair-btn">Remove</button>
        `;

    return pairDiv;
}

function addEntry() {
    document.getElementById('modalTitle').textContent = 'Add New Entry';
    document.getElementById('entryForm').reset();
    document.getElementById('entryId').value = '';
    document.getElementById('entryDate').value = new Date().toISOString().split('T')[0];

    const pairsContainer = document.getElementById('timeTypePairs');
    pairsContainer.innerHTML = '';

    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const defaultTime = `${hours}:${minutes}`;

    pairsContainer.appendChild(createTimeTypePair(defaultTime, '3'));

    document.getElementById('entryModal').style.display = 'flex';
}

function editEntry(id) {
    const entry = bowelMovementData.find(item => item.id === id);
    if (!entry) return;

    document.getElementById('modalTitle').textContent = 'Edit Entry';
    document.getElementById('entryId').value = entry.id;
    document.getElementById('entryDate').value = entry.date;
    document.getElementById('entryNotes').value = entry.notes;

    const times = entry.time.split(' / ');
    const types = entry.type.split('/');

    const pairsContainer = document.getElementById('timeTypePairs');
    pairsContainer.innerHTML = '';

    for (let i = 0; i < Math.max(times.length, types.length); i++) {
        const time = times[i] ? times[i].trim() : '';
        const type = types[i] ? types[i].trim() : '3';
        pairsContainer.appendChild(createTimeTypePair(time, type));
    }

    document.getElementById('entryModal').style.display = 'flex';
}

function deleteEntry(id) {
    if (confirm('Are you sure you want to delete this entry?')) {
        bowelMovementData = bowelMovementData.filter(item => item.id !== id);
        saveData();
        renderLogTable();
        applyFilters();
        updatePredictionAndStats();
    }
}

function saveEntry(event) {
    event.preventDefault();

    const id = document.getElementById('entryId').value;
    const date = document.getElementById('entryDate').value;
    const notes = document.getElementById('entryNotes').value;

    const timeElements = document.querySelectorAll('.movement-time');
    const typeElements = document.querySelectorAll('.movement-type');

    const times = Array.from(timeElements).map(el => el.value).filter(time => time !== '');
    const types = Array.from(typeElements).map(el => el.value);

    const timeString = times.join(' / ');
    const typeString = types.join('/');

    const existingEntryIndex = bowelMovementData.findIndex(item =>
    item.date === date && item.id !== parseInt(id)
    );

    if (existingEntryIndex !== -1) {
        if (confirm(`An entry already exists for ${date}. Would you like to merge this with the existing entry instead?`)) {
            const existingEntry = bowelMovementData[existingEntryIndex];

            const existingTimes = existingEntry.time.split(' / ').filter(t => t);
            const existingTypes = existingEntry.type.split('/').filter(t => t);

            const allTimes = [...existingTimes, ...times];
            const allTypes = [...existingTypes, ...types];

            existingEntry.time = allTimes.join(' / ');
            existingEntry.type = allTypes.join('/');

            if (notes && !existingEntry.notes) {
                existingEntry.notes = notes;
            } else if (notes && existingEntry.notes && notes !== existingEntry.notes) {
                existingEntry.notes = `${existingEntry.notes}; ${notes}`;
            }

            if (id) {
                bowelMovementData = bowelMovementData.filter(item => item.id !== parseInt(id));
            }
        } else {
            if (id) {
                const index = bowelMovementData.findIndex(item => item.id === parseInt(id));
                if (index !== -1) {
                    bowelMovementData[index] = {
                        ...bowelMovementData[index],
                        date,
                        time: timeString,
                        type: typeString,
                        notes
                    };
                }
            } else {
                const newId = bowelMovementData.length > 0 ? Math.max(...bowelMovementData.map(item => item.id)) + 1 : 1;
                bowelMovementData.push({
                    id: newId,
                    date,
                    time: timeString,
                    type: typeString,
                    notes
                });
            }
        }
    } else {
        if (id) {
            const index = bowelMovementData.findIndex(item => item.id === parseInt(id));
            if (index !== -1) {
                bowelMovementData[index] = {
                    ...bowelMovementData[index],
                    date,
                    time: timeString,
                    type: typeString,
                    notes
                };
            }
        } else {
            const newId = bowelMovementData.length > 0 ? Math.max(...bowelMovementData.map(item => item.id)) + 1 : 1;
            bowelMovementData.push({
                id: newId,
                date,
                time: timeString,
                type: typeString,
                notes
            });
        }
    }

    saveData();
    renderLogTable();
    applyFilters();
    updatePredictionAndStats();
    closeModal();
}

function saveData() {
    localStorage.setItem('bowelMovementData', JSON.stringify(bowelMovementData));

    if (isUsingSampleData && bowelMovementData.length > 0) {
        const isStillSampleData = bowelMovementData.some(entry =>
        entry.id <= 15 && entry.date.startsWith('2025-01')
        );

        if (!isStillSampleData) {
            isUsingSampleData = false;
            hideSampleDataNotification();
        }
    }
}

function loadData() {
    const savedData = localStorage.getItem('bowelMovementData');

    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            if (Array.isArray(parsed)) {
                bowelMovementData = parsed;

                if (bowelMovementData.length > 0 && bowelMovementData[0].date &&
                (bowelMovementData[0].date.includes('-') ||
                bowelMovementData[0].date.includes(','))) {

                    console.log('Detected imported data, normalizing dates...');
                    normalizeAllDates();
                    saveData();
                }
            }
        } catch (e) {
            console.error('Error loading saved data:', e);
            bowelMovementData = [];
        }
    }
}

function exportData() {
    const dataStr = JSON.stringify(bowelMovementData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'bowel-movement-data-' + new Date().toISOString().split('T')[0] + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('Data exported successfully!');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);

                if (!Array.isArray(importedData)) {
                    throw new Error('Invalid data format: Expected array');
                }

                const isValid = importedData.every(entry =>
                entry.id !== undefined &&
                entry.date &&
                entry.time !== undefined &&
                entry.type !== undefined
                );

                if (!isValid) {
                    throw new Error('Invalid data structure');
                }

                if (confirm(`Import ${importedData.length} entries? This will replace your current data.`)) {
                    bowelMovementData = importedData;

                    normalizeAllDates();

                    saveData();
                    renderLogTable();
                    applyFilters();
                    updatePredictionAndStats();
                    populateMonthFilter();
                    alert('Data imported successfully! Normalized ' + bowelMovementData.length + ' entries.');
                }
            } catch (error) {
                alert('Error importing data: ' + error.message);
            }
        };

        reader.readAsText(file);
    };

    input.click();
}

function showImportExportModal() {
    const modal = document.getElementById('importExportModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeImportExportModal() {
    const modal = document.getElementById('importExportModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function closeModal() {
    document.getElementById('entryModal').style.display = 'none';
}

function populateMonthFilter() {
    const monthFilter = document.getElementById('monthFilter');
    if (!monthFilter) return;

    monthFilter.innerHTML = '<option value="all">All Months</option>';

    const months = [...new Set(bowelMovementData.map(entry => {
        const date = new Date(entry.date);
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    }))].sort().reverse();

    months.forEach(month => {
        const date = new Date(month + '-01');
        const option = document.createElement('option');
        option.value = month;
        option.textContent = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        monthFilter.appendChild(option);
    });
}

function applyFilters() {
    const typeFilter = document.getElementById('typeFilter').value;
    const monthFilter = document.getElementById('monthFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    let filteredData = bowelMovementData;

    if (typeFilter !== 'all') {
        filteredData = filteredData.filter(entry => entry.type.includes(typeFilter));
    }

    if (monthFilter !== 'all') {
        filteredData = filteredData.filter(entry => {
            const entryMonth = entry.date.substring(0, 7);
            return entryMonth === monthFilter;
        });
    }

    if (searchTerm) {
        filteredData = filteredData.filter(entry => {
            return (
            entry.date.includes(searchTerm) ||
            entry.time.toLowerCase().includes(searchTerm) ||
            entry.type.toLowerCase().includes(searchTerm) ||
            (entry.notes && entry.notes.toLowerCase().includes(searchTerm))
            );
        });
    }

    renderLogTable(filteredData);
}

function calculateStdDev(arr) {
    if (arr.length === 0) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
}

function renderAnalytics() {
    const prediction = calculateEnhancedPrediction();
    const events = extractIndividualEvents();

    const modelDetailsElement = document.getElementById('modelDetails');
    if (modelDetailsElement) {
        if (prediction.stats && Object.keys(prediction.stats).length > 0) {
            modelDetailsElement.innerHTML = `
                <p><strong>Weighted Mean Interval:</strong> ${prediction.stats.weightedMean} days</p>
                <p><strong>Median Interval:</strong> ${prediction.stats.medianInterval} days</p>
                <p><strong>Events per Day:</strong> ${prediction.stats.eventsPerDay}</p>
                <p><strong>Trimmed Mean:</strong> ${prediction.stats.trimmedMean} days</p>
                <p><strong>Outliers Removed:</strong> ${prediction.stats.outlierCount}</p>
            `;
        } else {
            modelDetailsElement.innerHTML = `
                <p>Insufficient data for detailed analysis. Add more entries to see analytics.</p>
            `;
        }
    }

    const dayChart = document.getElementById('dayPatternChart');
    if (dayChart) {
        dayChart.innerHTML = '';

        if (prediction.patterns.dayOfWeek && events.length > 0) {
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const maxCount = Math.max(...Object.values(prediction.patterns.dayOfWeek.counts));

            dayNames.forEach((dayName, index) => {
                const count = prediction.patterns.dayOfWeek.counts[index] || 0;
                const height = maxCount > 0 ? (count / maxCount * 80) + 20 : 20;
                const isHighlight = dayName === prediction.patterns.dayOfWeek.mostActiveDay;

                const bar = document.createElement('div');
                bar.className = `day-bar ${isHighlight ? 'highlight' : ''}`;
                bar.style.height = `${height}px`;
                bar.title = `${dayName}: ${count} events`;

                const label = document.createElement('div');
                label.className = 'day-label';
                label.textContent = dayName;

                bar.appendChild(label);
                dayChart.appendChild(bar);
            });
        } else {
            dayChart.innerHTML = '<p>Not enough data for day pattern analysis</p>';
        }
    }

    const timeChart = document.getElementById('timePatternChart');
    if (timeChart) {
        timeChart.innerHTML = '';

        if (prediction.patterns.timeOfDay && events.length > 0) {
            const timeLabels = ['12a', '2a', '4a', '6a', '8a', '10a', '12p', '2p', '4p', '6p', '8p', '10p'];

            for (let hour = 0; hour < 24; hour++) {
                const count = prediction.patterns.timeOfDay.counts[hour] || 0;
                const isActive = count > 0;
                const isPeak = hour === prediction.patterns.timeOfDay.peakHour;

                const cell = document.createElement('div');
                cell.className = `hour-cell ${isActive ? 'active' : ''} ${isPeak ? 'peak' : ''}`;
                cell.title = `${hour}:00 - ${count} events`;
                cell.style.opacity = isActive ? Math.min(count / 3, 1) : 0.3;

                if ([0, 6, 12, 18].includes(hour)) {
                    const label = document.createElement('div');
                    label.style.position = 'absolute';
                    label.style.bottom = '-20px';
                    label.style.left = '0';
                    label.style.right = '0';
                    label.style.textAlign = 'center';
                    label.style.fontSize = '0.7rem';
                    label.style.color = 'var(--text-light)';
                    label.textContent = timeLabels[Math.floor(hour / 2)];
                    cell.appendChild(label);
                }

                timeChart.appendChild(cell);
            }
        } else {
            timeChart.innerHTML = '<p>Not enough data for time pattern analysis</p>';
        }
    }

    const trendAnalysisElement = document.getElementById('trendAnalysis');
    if (trendAnalysisElement) {
        if (prediction.patterns.trend && prediction.patterns.trend.trend !== 'insufficient data') {
            trendAnalysisElement.innerHTML = `
                <p><strong>Current Trend:</strong>
                    <span class="trend-indicator">
                        ${prediction.patterns.trend.trend === 'increasing' ? '📈 Increasing' :
                          prediction.patterns.trend.trend === 'decreasing' ? '📉 Decreasing' : '➡️ Stable'}
                    </span>
                </p>
                <p><strong>Slope:</strong> ${prediction.patterns.trend.slope.toFixed(3)}</p>
                <p><small>Positive slope = longer intervals between events</small></p>
            `;
        } else {
            trendAnalysisElement.innerHTML = `
                <p>Not enough data for trend analysis</p>
            `;
        }
    }

    const statisticalSummaryElement = document.getElementById('statisticalSummary');
    if (statisticalSummaryElement) {
        const intervals = calculateEventIntervals(events);
        const intervalsInDays = intervals.map(h => h / 24);

        if (intervalsInDays.length > 0) {
            statisticalSummaryElement.innerHTML = `
                <p><strong>Total Events:</strong> ${events.length}</p>
                <p><strong>Interval Stats:</strong></p>
                <ul style="margin-left: 15px; font-size: 0.9rem;">
                    <li>Min: ${Math.min(...intervalsInDays).toFixed(2)} days</li>
                    <li>Max: ${Math.max(...intervalsInDays).toFixed(2)} days</li>
                    <li>Std Dev: ${calculateStdDev(intervalsInDays).toFixed(2)} days</li>
                </ul>
            `;
        } else {
            statisticalSummaryElement.innerHTML = `
                <p>Not enough data for statistical summary</p>
            `;
        }
    }

    const outlierInfoElement = document.getElementById('outlierInfo');
    if (outlierInfoElement) {
        const intervals = calculateEventIntervals(events);
        const intervalsInDays = intervals.map(h => h / 24);
        const { outliers } = detectOutliers(intervalsInDays);

        if (outliers.length > 0) {
            outlierInfoElement.innerHTML = `
                <p><strong>Outliers Detected:</strong> ${outliers.length}</p>
                <p><small>Outlier intervals (days):</small></p>
                <ul style="margin-left: 15px; font-size: 0.9rem;">
                    ${outliers.map(o => `<li>${o.toFixed(2)}</li>`).join('')}
                </ul>
            `;
        } else {
            outlierInfoElement.innerHTML = `
                <p>No significant outliers detected</p>
                <p><small>Outliers are unusual intervals that don't follow your normal pattern</small></p>
            `;
        }
    }
}

function showAnalyticsModal() {
    const modal = document.getElementById('analyticsModal');
    if (modal) {
        modal.style.display = 'flex';
        renderAnalytics();
    }
}

function closeAnalyticsModal() {
    const modal = document.getElementById('analyticsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function updatePredictionAndStats() {
    const prediction = calculateEnhancedPrediction();
    const stats = calculateStatistics();

    updateEnhancedPredictionDisplay(prediction);

    const totalEntriesElement = document.getElementById('totalEntries');
    const avgDaysBetweenElement = document.getElementById('avgDaysBetween');
    const mostCommonTypeElement = document.getElementById('mostCommonType');
    const currentStreakElement = document.getElementById('currentStreak');

    if (totalEntriesElement) totalEntriesElement.textContent = stats.totalEntries;
    if (avgDaysBetweenElement) avgDaysBetweenElement.textContent = stats.avgDaysBetween;
    if (mostCommonTypeElement) mostCommonTypeElement.textContent = stats.mostCommonType;
    if (currentStreakElement) currentStreakElement.textContent = stats.currentStreak;

    updateDetailedStatistics(prediction);
}

document.addEventListener('DOMContentLoaded', function() {
    checkAndLoadSampleData();

    if (!isUsingSampleData) {
        loadData();
    }

    renderLogTable();
    updatePredictionAndStats();
    populateMonthFilter();

    const addEntryBtn = document.getElementById('addEntryBtn');
    if (addEntryBtn) addEntryBtn.addEventListener('click', addEntry);

    const entryForm = document.getElementById('entryForm');
    if (entryForm) entryForm.addEventListener('submit', saveEntry);

    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportData);

    const importBtn = document.getElementById('importBtn');
    if (importBtn) importBtn.addEventListener('click', importData);

    const showImportExportBtn = document.getElementById('showImportExportBtn');
    if (showImportExportBtn) showImportExportBtn.addEventListener('click', showImportExportModal);

    const closeImportExportBtn = document.getElementById('closeImportExportBtn');
    if (closeImportExportBtn) closeImportExportBtn.addEventListener('click', closeImportExportModal);

    const cancelImportExportBtn = document.getElementById('cancelImportExportBtn');
    if (cancelImportExportBtn) cancelImportExportBtn.addEventListener('click', closeImportExportModal);

    const clearSampleDataBtn = document.getElementById('clearSampleDataBtn');
    if (clearSampleDataBtn) clearSampleDataBtn.addEventListener('click', clearSampleData);

    const loadSampleDataBtn = document.getElementById('loadSampleDataBtn');
    if (loadSampleDataBtn) loadSampleDataBtn.addEventListener('click', loadSampleData);

    const hideSampleNotificationBtn = document.getElementById('hideSampleNotificationBtn');
    if (hideSampleNotificationBtn) hideSampleNotificationBtn.addEventListener('click', hideSampleDataNotification);

    const addPairBtn = document.getElementById('addPairBtn');
    if (addPairBtn) {
        addPairBtn.addEventListener('click', function() {
            const pairsContainer = document.getElementById('timeTypePairs');
            if (pairsContainer) {
                pairsContainer.appendChild(createTimeTypePair());
            }
        });
    }

    const timeTypePairs = document.getElementById('timeTypePairs');
    if (timeTypePairs) {
        timeTypePairs.addEventListener('click', function(e) {
            if (e.target.classList.contains('remove-pair-btn')) {
                const pairDiv = e.target.closest('.time-type-pair');
                if (document.querySelectorAll('.time-type-pair').length > 1) {
                    pairDiv.remove();
                } else {
                    alert('You need at least one movement entry');
                }
            }
        });
    }

    const typeFilter = document.getElementById('typeFilter');
    if (typeFilter) typeFilter.addEventListener('change', applyFilters);

    const monthFilter = document.getElementById('monthFilter');
    if (monthFilter) monthFilter.addEventListener('change', applyFilters);

    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', applyFilters);

    const entryModal = document.getElementById('entryModal');
    if (entryModal) {
        entryModal.addEventListener('click', function(event) {
            if (event.target === this) {
                closeModal();
            }
        });
    }

    const importExportModal = document.getElementById('importExportModal');
    if (importExportModal) {
        importExportModal.addEventListener('click', function(event) {
            if (event.target === this) {
                closeImportExportModal();
            }
        });
    }

    const showAnalyticsBtn = document.getElementById('showAnalyticsBtn');
    if (showAnalyticsBtn) showAnalyticsBtn.addEventListener('click', showAnalyticsModal);

    const closeAnalyticsBtn = document.getElementById('closeAnalyticsBtn');
    if (closeAnalyticsBtn) closeAnalyticsBtn.addEventListener('click', closeAnalyticsModal);

    const closeAnalyticsModalBtn = document.getElementById('closeAnalyticsModalBtn');
    if (closeAnalyticsModalBtn) closeAnalyticsModalBtn.addEventListener('click', closeAnalyticsModal);

    const analyticsModal = document.getElementById('analyticsModal');
    if (analyticsModal) {
        analyticsModal.addEventListener('click', function(event) {
            if (event.target === this) {
                closeAnalyticsModal();
            }
        });
    }
});