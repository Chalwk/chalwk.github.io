// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// --- Rendering ---------------------------------------------------------------
// The skeleton is identical on both boards. It gives the eye a fixed frame
// so differences stand out against something stable.
function sceneSkeletonMarkup(theme, w, h, side) {
    const gradId = `sky-${theme.id}-${side}`;
    const groundY = h * 0.78;
    let out = `<defs><linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">`;
    out += `<stop offset="0%" stop-color="${theme.sky[0]}"/>`;
    out += `<stop offset="100%" stop-color="${theme.sky[1]}"/>`;
    out += `</linearGradient></defs>`;
    out += `<rect x="0" y="0" width="${w}" height="${h}" fill="url(#${gradId})"/>`;

    // Sun or moon, always in the top right corner.
    const cx = w - 52;
    const cy = 46;
    const isNight = theme.id === 'night' || theme.id === 'dusk';
    if (isNight) {
        out += `<circle cx="${cx}" cy="${cy}" r="22" fill="${theme.accent}" opacity="0.9"/>`;
        out += `<circle cx="${cx - 6}" cy="${cy - 4}" r="3" fill="#94a3b8" opacity="0.45"/>`;
        out += `<circle cx="${cx + 4}" cy="${cy + 5}" r="2" fill="#94a3b8" opacity="0.4"/>`;
    } else {
        out += `<circle cx="${cx}" cy="${cy}" r="22" fill="${theme.accent}"/>`;
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            const x1 = cx + Math.cos(a) * 26;
            const y1 = cy + Math.sin(a) * 26;
            const x2 = cx + Math.cos(a) * 34;
            const y2 = cy + Math.sin(a) * 34;
            out += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${theme.accent}" stroke-width="2.4" stroke-linecap="round" opacity="0.85"/>`;
        }
    }

    // Distant hills sit behind the ground line.
    out += `<ellipse cx="${(w * 0.22).toFixed(1)}" cy="${(groundY + 8).toFixed(1)}" rx="${(w * 0.32).toFixed(1)}" ry="${(h * 0.11).toFixed(1)}" fill="${theme.hillA}"/>`;
    out += `<ellipse cx="${(w * 0.7).toFixed(1)}" cy="${(groundY + 12).toFixed(1)}" rx="${(w * 0.38).toFixed(1)}" ry="${(h * 0.09).toFixed(1)}" fill="${theme.hillB}"/>`;

    // Ground strip.
    out += `<rect x="0" y="${groundY.toFixed(1)}" width="${w}" height="${(h - groundY).toFixed(1)}" fill="${theme.ground}"/>`;
    out += `<rect x="0" y="${groundY.toFixed(1)}" width="${w}" height="2" fill="${theme.groundLine}"/>`;

    // Permanent tree on the left. Never becomes a difference.
    const treeX = 34;
    const treeBaseY = groundY + 4;
    out += `<rect x="${treeX - 4}" y="${treeBaseY - 44}" width="8" height="44" rx="2" fill="${theme.groundLine}"/>`;
    out += `<circle cx="${treeX}" cy="${treeBaseY - 54}" r="20" fill="${theme.hillA}"/>`;
    out += `<circle cx="${treeX - 15}" cy="${treeBaseY - 44}" r="13" fill="${theme.hillA}"/>`;
    out += `<circle cx="${treeX + 15}" cy="${treeBaseY - 44}" r="13" fill="${theme.hillA}"/>`;
    out += `<circle cx="${treeX - 5}" cy="${treeBaseY - 58}" r="7" fill="#ffffff" opacity="0.15"/>`;

    // Permanent fence on the right.
    const fenceY = groundY + 2;
    const fenceStart = w * 0.76;
    const fenceEnd = w * 0.96;
    out += `<line x1="${fenceStart.toFixed(1)}" y1="${(fenceY - 10).toFixed(1)}" x2="${fenceEnd.toFixed(1)}" y2="${(fenceY - 10).toFixed(1)}" stroke="${theme.groundLine}" stroke-width="2"/>`;
    out += `<line x1="${fenceStart.toFixed(1)}" y1="${(fenceY - 18).toFixed(1)}" x2="${fenceEnd.toFixed(1)}" y2="${(fenceY - 18).toFixed(1)}" stroke="${theme.groundLine}" stroke-width="2"/>`;
    for (let i = 0; i < 4; i++) {
        const fx = fenceStart + i * ((fenceEnd - fenceStart) / 3);
        out += `<rect x="${(fx - 2).toFixed(1)}" y="${(fenceY - 22).toFixed(1)}" width="4" height="24" fill="${theme.groundLine}"/>`;
    }

    return out;
}

// Skip any object with a bad position or scale so one bad tile does not
// blank the whole board.
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
    leftBoardEl.innerHTML = sceneSkeletonMarkup(theme, viewW, viewH, 'l') +
        left.map(objectMarkup).join('') + leftMarkers;
    rightBoardEl.innerHTML = sceneSkeletonMarkup(theme, viewW, viewH, 'r') +
        right.map(objectMarkup).join('') + rightMarkers;
}

// Transient red X where a click missed. Not part of tracked state.
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