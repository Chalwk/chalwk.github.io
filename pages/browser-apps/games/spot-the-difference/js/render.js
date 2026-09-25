// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// --- Rendering ---------------------------------------------------------------
// The skeleton is identical on both boards within a round. It gives the
// eye a fixed frame so differences stand out against something stable.
// Variants vary the frame between rounds while keeping that stability.

// --- Sky anchor (sun or moon) -------------------------------------------------
function drawSkyAnchor(theme, w) {
    const cx = w - 52;
    const cy = 46;
    const isNight = theme.id === 'night' || theme.id === 'dusk';
    let out = '';
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
    return out;
}

// --- Skeleton anchors ---------------------------------------------------------
function drawDecorTree(x, baseY, theme) {
    let out = '';
    out += `<rect x="${x - 4}" y="${baseY - 44}" width="8" height="44" rx="2" fill="${theme.groundLine}"/>`;
    out += `<circle cx="${x}" cy="${baseY - 54}" r="20" fill="${theme.hillA}"/>`;
    out += `<circle cx="${x - 15}" cy="${baseY - 44}" r="13" fill="${theme.hillA}"/>`;
    out += `<circle cx="${x + 15}" cy="${baseY - 44}" r="13" fill="${theme.hillA}"/>`;
    out += `<circle cx="${x - 5}" cy="${baseY - 58}" r="7" fill="#ffffff" opacity="0.15"/>`;
    return out;
}

function drawDecorFence(w, baseY, theme) {
    const fenceStart = w * 0.76;
    const fenceEnd = w * 0.96;
    let out = '';
    out += `<line x1="${fenceStart.toFixed(1)}" y1="${(baseY - 10).toFixed(1)}" x2="${fenceEnd.toFixed(1)}" y2="${(baseY - 10).toFixed(1)}" stroke="${theme.groundLine}" stroke-width="2"/>`;
    out += `<line x1="${fenceStart.toFixed(1)}" y1="${(baseY - 18).toFixed(1)}" x2="${fenceEnd.toFixed(1)}" y2="${(baseY - 18).toFixed(1)}" stroke="${theme.groundLine}" stroke-width="2"/>`;
    for (let i = 0; i < 4; i++) {
        const fx = fenceStart + i * ((fenceEnd - fenceStart) / 3);
        out += `<rect x="${(fx - 2).toFixed(1)}" y="${(baseY - 22).toFixed(1)}" width="4" height="24" fill="${theme.groundLine}"/>`;
    }
    return out;
}

function drawDecorCabin(x, baseY, theme) {
    let out = '';
    out += `<rect x="${x - 22}" y="${baseY - 36}" width="44" height="36" rx="2" fill="${theme.hillB}"/>`;
    out += `<rect x="${x - 22}" y="${baseY - 36}" width="44" height="36" rx="2" fill="#000000" opacity="0.08"/>`;
    out += `<polygon points="${x - 28},${baseY - 34} ${x},${baseY - 58} ${x + 28},${baseY - 34}" fill="${theme.groundLine}"/>`;
    out += `<rect x="${x - 6}" y="${baseY - 22}" width="12" height="22" rx="1" fill="${theme.groundLine}" opacity="0.8"/>`;
    out += `<rect x="${x - 18}" y="${baseY - 30}" width="9" height="9" fill="#fef3c7" opacity="0.85"/>`;
    out += `<rect x="${x + 9}" y="${baseY - 30}" width="9" height="9" fill="#fef3c7" opacity="0.85"/>`;
    out += `<rect x="${x + 10}" y="${baseY - 56}" width="7" height="14" fill="${theme.groundLine}"/>`;
    return out;
}

function drawDecorWindmill(x, baseY, theme) {
    let out = '';
    out += `<polygon points="${x - 12},${baseY} ${x + 12},${baseY} ${x + 7},${baseY - 44} ${x - 7},${baseY - 44}" fill="${theme.hillB}"/>`;
    out += `<polygon points="${x - 9},${baseY - 44} ${x + 9},${baseY - 44} ${x},${baseY - 56}" fill="${theme.groundLine}"/>`;
    const hubY = baseY - 48;
    for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const ex = x + Math.cos(a) * 20;
        const ey = hubY + Math.sin(a) * 20;
        out += `<line x1="${x}" y1="${hubY}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="${theme.groundLine}" stroke-width="2.4" stroke-linecap="round"/>`;
    }
    out += `<circle cx="${x}" cy="${hubY}" r="3" fill="${theme.groundLine}"/>`;
    return out;
}

function drawDecorLighthouse(x, baseY, theme) {
    let out = '';
    out += `<polygon points="${x - 12},${baseY} ${x + 12},${baseY} ${x + 8},${baseY - 46} ${x - 8},${baseY - 46}" fill="${theme.hillB}"/>`;
    out += `<rect x="${x - 10.5}" y="${baseY - 36}" width="21" height="6" fill="#ffffff" opacity="0.6"/>`;
    out += `<rect x="${x - 9}" y="${baseY - 22}" width="18" height="6" fill="#ffffff" opacity="0.6"/>`;
    out += `<circle cx="${x}" cy="${baseY - 51}" r="12" fill="#fef3c7" opacity="0.18"/>`;
    out += `<rect x="${x - 8}" y="${baseY - 56}" width="16" height="10" fill="#fde68a"/>`;
    out += `<polygon points="${x - 10},${baseY - 56} ${x + 10},${baseY - 56} ${x},${baseY - 64}" fill="${theme.groundLine}"/>`;
    return out;
}

function drawDecorCactus(x, baseY, theme) {
    const c = theme.hillA;
    let out = '';
    out += `<rect x="${x - 5}" y="${baseY - 46}" width="10" height="46" rx="4" fill="${c}"/>`;
    out += `<rect x="${x - 20}" y="${baseY - 32}" width="7" height="18" rx="3" fill="${c}"/>`;
    out += `<rect x="${x - 20}" y="${baseY - 22}" width="15" height="7" rx="3" fill="${c}"/>`;
    out += `<rect x="${x + 13}" y="${baseY - 38}" width="7" height="22" rx="3" fill="${c}"/>`;
    out += `<rect x="${x + 5}" y="${baseY - 28}" width="15" height="7" rx="3" fill="${c}"/>`;
    out += `<rect x="${x - 2}" y="${baseY - 44}" width="1.4" height="40" fill="#ffffff" opacity="0.25"/>`;
    return out;
}

function drawDecorRocks(x, baseY, theme) {
    let out = '';
    out += `<ellipse cx="${x - 12}" cy="${baseY - 6}" rx="14" ry="10" fill="${theme.hillB}"/>`;
    out += `<ellipse cx="${x + 6}" cy="${baseY - 4}" rx="11" ry="8" fill="${theme.hillA}"/>`;
    out += `<ellipse cx="${x + 18}" cy="${baseY - 3}" rx="8" ry="6" fill="${theme.hillB}"/>`;
    out += `<ellipse cx="${x - 14}" cy="${baseY - 10}" rx="4" ry="2.5" fill="#ffffff" opacity="0.15"/>`;
    return out;
}

function drawDecorCoral(x, baseY, theme) {
    const c = theme.accent;
    let out = '';
    out += `<path d="M ${x} ${baseY} Q ${x - 4} ${baseY - 30} ${x - 12} ${baseY - 40}" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    out += `<path d="M ${x} ${baseY} Q ${x + 2} ${baseY - 24} ${x + 10} ${baseY - 34}" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    out += `<path d="M ${x - 2} ${baseY - 14} Q ${x - 18} ${baseY - 22} ${x - 22} ${baseY - 30}" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    out += `<circle cx="${x - 12}" cy="${baseY - 40}" r="3.5" fill="${c}"/>`;
    out += `<circle cx="${x + 10}" cy="${baseY - 34}" r="3.5" fill="${c}"/>`;
    out += `<circle cx="${x - 22}" cy="${baseY - 30}" r="2.8" fill="${c}"/>`;
    return out;
}

function drawSkeletonLeft(kind, theme, w, h, groundY) {
    const x = 34;
    const baseY = groundY + 4;
    switch (kind) {
        case 'tree': return drawDecorTree(x, baseY, theme);
        case 'cabin': return drawDecorCabin(x, baseY, theme);
        case 'cactus': return drawDecorCactus(x, baseY, theme);
        case 'rocks': return drawDecorRocks(x, baseY, theme);
        case 'coral': return drawDecorCoral(x, baseY, theme);
        default: return '';
    }
}

function drawSkeletonRight(kind, theme, w, h, groundY) {
    const baseY = groundY + 2;
    switch (kind) {
        case 'fence': return drawDecorFence(w, baseY, theme);
        case 'tree': return drawDecorTree(w - 34, groundY + 4, theme);
        case 'windmill': return drawDecorWindmill(w - 46, groundY + 4, theme);
        case 'lighthouse': return drawDecorLighthouse(w - 46, groundY + 4, theme);
        case 'rocks': return drawDecorRocks(w - 40, groundY + 4, theme);
        default: return '';
    }
}

// --- Skeleton ----------------------------------------------------------------
function sceneSkeletonMarkup(theme, variant, hillLayout, w, h, side) {
    const gradId = `sky-${theme.id}-${side}`;
    const groundY = h * 0.78;
    let out = `<defs><linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">`;
    out += `<stop offset="0%" stop-color="${theme.sky[0]}"/>`;
    out += `<stop offset="100%" stop-color="${theme.sky[1]}"/>`;
    out += `</linearGradient></defs>`;
    out += `<rect x="0" y="0" width="${w}" height="${h}" fill="url(#${gradId})"/>`;

    // Sun or moon - same anchor every round for both boards.
    out += drawSkyAnchor(theme, w);

    // Distant hills.
    const hills = (hillLayout && hillLayout.hills) || [[0.22, 8, 0.32, 0.11], [0.70, 12, 0.38, 0.09]];
    hills.forEach(([cxF, cyOff, rxF, ryF], i) => {
        const cx = (w * cxF).toFixed(1);
        const cy = (groundY + cyOff).toFixed(1);
        const rx = (w * rxF).toFixed(1);
        const ry = (h * ryF).toFixed(1);
        const fill = i % 2 === 0 ? theme.hillA : theme.hillB;
        out += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}"/>`;
    });

    // Ground strip.
    out += `<rect x="0" y="${groundY.toFixed(1)}" width="${w}" height="${(h - groundY).toFixed(1)}" fill="${theme.ground}"/>`;
    out += `<rect x="0" y="${groundY.toFixed(1)}" width="${w}" height="2" fill="${theme.groundLine}"/>`;

    // Permanent scenery on each edge. Never becomes a difference.
    const leftKind = variant ? variant.left : 'tree';
    const rightKind = variant ? variant.right : 'fence';
    out += drawSkeletonLeft(leftKind, theme, w, h, groundY);
    out += drawSkeletonRight(rightKind, theme, w, h, groundY);

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
    const { theme, variant, hillLayout, viewW, viewH, left, right, diffs } = scene;
    [leftBoardEl, rightBoardEl].forEach(el => {
        el.setAttribute('viewBox', `0 0 ${viewW} ${viewH}`);
        el.style.aspectRatio = `${viewW} / ${viewH}`;
    });
    const found = diffs.filter(d => d.found);
    const leftMarkers = found.map(d => diffRingMarkup(d, 'left')).join('');
    const rightMarkers = found.map(d => diffRingMarkup(d, 'right')).join('');
    leftBoardEl.innerHTML = sceneSkeletonMarkup(theme, variant, hillLayout, viewW, viewH, 'l') +
        left.map(objectMarkup).join('') + leftMarkers;
    rightBoardEl.innerHTML = sceneSkeletonMarkup(theme, variant, hillLayout, viewW, viewH, 'r') +
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