// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// --- Rendering ---------------------------------------------------------------
function sceneBackgroundMarkup(theme, w, h, side) {
    const gradId = `sky-${theme.id}-${side}`;
    const groundY = h * 0.78;
    return `<defs><linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">` +
        `<stop offset="0%" stop-color="${theme.sky[0]}"/><stop offset="100%" stop-color="${theme.sky[1]}"/>` +
        `</linearGradient></defs>` +
        `<rect x="0" y="0" width="${w}" height="${h}" fill="url(#${gradId})"/>` +
        `<rect x="0" y="${groundY}" width="${w}" height="${h - groundY}" fill="${theme.ground}"/>` +
        `<rect x="0" y="${groundY}" width="${w}" height="2" fill="${theme.groundLine}"/>`;
}

// Defensive: if a scene object ever has a bad position/scale/type, skip it
// rather than emitting invalid SVG markup that would blank the whole board.
function objectMarkup(o) {
    if (!o || !o.typeId) return '';
    const x = Number(o.x);
    const y = Number(o.y);
    const scale = Number(o.scale);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(scale) || scale <= 0) {
        return '';
    }
    return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${scale.toFixed(2)})">${drawObjectShape(o.typeId, o.color)}</g>`;
}

function markPointFor(d, side) {
    const mark = side === 'left' ? d.markLeft : d.markRight;
    if (mark === null) return null;
    if (!mark || !Number.isFinite(mark.x) || !Number.isFinite(mark.y)) {
        return { x: d.x, y: d.y };
    }
    return mark;
}

function diffRingMarkup(d, side) {
    const p = markPointFor(d, side);
    if (!p) return '';
    return `<g class="diff-found-mark">` +
        `<circle cx="${p.x}" cy="${p.y}" r="${d.radius.toFixed(1)}" class="diff-ring"/>` +
        `<path d="M ${p.x - 6} ${p.y} l 4 4 l 8 -9" class="diff-check"/>` +
        `</g>`;
}

function renderBoards() {
    if (!scene) return;
    const { theme, viewW, viewH, left, right, diffs } = scene;
    [leftBoardEl, rightBoardEl].forEach(el => {
        el.setAttribute('viewBox', `0 0 ${viewW} ${viewH}`);
        el.style.aspectRatio = `${viewW} / ${viewH}`;
    });
    const found = diffs.filter(d => d.found);
    const leftMarkers = found.map(d => diffRingMarkup(d, 'left')).join('');
    const rightMarkers = found.map(d => diffRingMarkup(d, 'right')).join('');
    leftBoardEl.innerHTML = sceneBackgroundMarkup(theme, viewW, viewH, 'l') +
        left.map(objectMarkup).join('') + leftMarkers;
    rightBoardEl.innerHTML = sceneBackgroundMarkup(theme, viewW, viewH, 'r') +
        right.map(objectMarkup).join('') + rightMarkers;
}

// Transient red X where a click missed. Appended directly (not part of the
// tracked scene state) so it doesn't survive the next full re-render.
function showMissMarker(boardEl, x, y) {
    const ns = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('class', 'diff-miss-mark');
    g.innerHTML = `<line x1="${x - 9}" y1="${y - 9}" x2="${x + 9}" y2="${y + 9}"/><line x1="${x - 9}" y1="${y + 9}" x2="${x + 9}" y2="${y - 9}"/>`;
    boardEl.appendChild(g);
    setTimeout(() => g.remove(), 550);
}

// Pulses a ring around one un-found difference on both boards for a moment.
function flashHint(diff) {
    const ns = 'http://www.w3.org/2000/svg';
    [[leftBoardEl, 'left'], [rightBoardEl, 'right']].forEach(([boardEl, side]) => {
        const p = markPointFor(diff, side);
        if (!p) return;
        const g = document.createElementNS(ns, 'g');
        g.setAttribute('class', 'diff-hint-mark');
        g.innerHTML = `<circle cx="${p.x}" cy="${p.y}" r="${diff.radius.toFixed(1)}"/>`;
        boardEl.appendChild(g);
        setTimeout(() => g.remove(), 1800);
    });
}

function updateTimerHud() {
    const pct = Math.max(0, Math.round((timeLeft / Math.max(1, roundTimeTotal)) * 100));
    timeFillEl.style.width = pct + '%';
    timeFillEl.className = 'time-fill' + (timeLeft <= 8 ? ' danger' : timeLeft <= 20 ? ' warn' : '');
    timeTextEl.textContent = `${Math.max(0, timeLeft)}s`;
}

function updateHud() {
    scoreEl.textContent = score;
    bestScoreEl.textContent = bestScore;
    roundLabelEl.textContent = `Round ${round} / ${MAX_ROUND}`;
    if (scene) themeLabelEl.textContent = `${scene.theme.icon} ${scene.theme.name}`;
    foundCountEl.textContent = scene ? `${foundCount} / ${scene.diffs.length}` : '0 / 0';
    comboCountEl.textContent = `${combo}x`;
    hintsCountEl.textContent = hintsLeft;
    hintBtn.disabled = hintsLeft <= 0 || !gameActive || gameOver;
    updateTimerHud();
}

function render() {
    renderBoards();
    updateHud();
}