// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// --- Scene generation ----------------------------------------------------------
function diffCountForRound(round) {
    const p = DIFFICULTY_PRESETS[difficultyKey];
    return Math.min(p.diffStart + Math.floor((round - 1) / p.diffStep), 10);
}

function timeForRound(round) {
    const p = DIFFICULTY_PRESETS[difficultyKey];
    return Math.max(p.minTime, p.baseTime - (round - 1) * 3);
}

// --- Colour helpers -----------------------------------------------------------
function hexToRgb(hex) {
    const h = String(hex).replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const v = parseInt(full, 16);
    return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}

function colorDistance(a, b) {
    const ca = hexToRgb(a);
    const cb = hexToRgb(b);
    const dr = ca.r - cb.r;
    const dg = ca.g - cb.g;
    const db = ca.b - cb.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
}

const DIFF_SEPARATION = 70;
const MIN_RECOLOR_DISTANCE = 60;
const OBJECT_OVERLAP_ALLOWANCE = 0.9;
const GROUND_FRACTION = 0.78;

// Places one object inside its band, avoiding everything already placed.
// Sky band is above the ground line, ground band sits along it.
// The x range for ground objects leaves room for the skeleton tree and fence.
function findSpot(objects, w, h, radius, band, groundY) {
    const pad = 22;
    let minX, maxX, minY, maxY;
    if (band === 'sky') {
        minX = pad + radius + 60;
        maxX = w - pad - radius - 70;
        minY = pad + radius;
        maxY = groundY - radius - 24;
    } else {
        minX = w * 0.14 + radius;
        maxX = w * 0.74 - radius;
        minY = groundY - radius * 1.1;
        maxY = h - pad - radius * 0.4;
    }
    if (maxX <= minX || maxY <= minY) return null;
    for (let i = 0; i < 50; i++) {
        const x = randInt(minX, maxX);
        const y = randInt(minY, maxY);
        const clash = objects.some(o => distancePt(o, { x, y }) < (o.radius + radius + 10));
        if (!clash) return { x, y };
    }
    return null;
}

// Scatters a themed handful of sky and ground objects across the canvas.
function generateBaseScene(sizeKey) {
    const preset = SIZE_PRESETS[sizeKey] || SIZE_PRESETS.small;
    const theme = pick(SCENE_THEMES);
    const pool = THEME_POOLS[theme.id] || THEME_POOLS.meadow;
    const groundY = preset.h * GROUND_FRACTION;
    const objects = [];
    const target = randInt(preset.minObjects, preset.maxObjects);

    // Sky objects, smaller so they read as distant.
    const skyTarget = randInt(2, 4);
    let attempts = 0;
    while (objects.length < skyTarget && attempts < 60) {
        attempts++;
        const type = getObjectType(pick(pool.sky));
        const scale = 0.6 + Math.random() * 0.4;
        const radius = type.radius * scale;
        const spot = findSpot(objects, preset.w, preset.h, radius, 'sky', groundY);
        if (!spot) continue;
        objects.push({ typeId: type.id, x: spot.x, y: spot.y, scale, radius, color: pick(type.palette), band: 'sky' });
    }

    // Ground objects, closer to the camera so they are larger.
    const groundTarget = Math.max(3, target - objects.length);
    attempts = 0;
    let placed = 0;
    while (placed < groundTarget && attempts < 120) {
        attempts++;
        const type = getObjectType(pick(pool.ground));
        const scale = 0.95 + Math.random() * 0.4;
        const radius = type.radius * scale;
        const spot = findSpot(objects, preset.w, preset.h, radius, 'ground', groundY);
        if (!spot) continue;
        objects.push({ typeId: type.id, x: spot.x, y: spot.y, scale, radius, color: pick(type.palette), band: 'ground' });
        placed++;
    }

    return { theme, viewW: preset.w, viewH: preset.h, groundY, objects };
}

// Clones the base scene into a left (untouched) and right (mutated) copy.
function generateDifferences(base, diffCount) {
    const preset = DIFFICULTY_PRESETS[difficultyKey];
    const left = base.objects.map(o => ({ ...o }));
    const right = base.objects.map(o => ({ ...o }));
    const diffs = [];
    const usedIndices = new Set();
    const removedIndices = new Set();
    const kindOrder = shuffle(DIFF_KIND_CYCLE);
    let guard = 0;
    let kindIdx = 0;
    const maxGuard = Math.max(80, diffCount * 80);

    while (diffs.length < diffCount && guard < maxGuard) {
        guard++;
        const kind = kindOrder[kindIdx % kindOrder.length];
        kindIdx++;

        const available = [];
        for (let i = 0; i < right.length; i++) {
            if (!usedIndices.has(i) && !removedIndices.has(i)) available.push(i);
        }
        if (!available.length) continue;
        const idx = pick(available);
        const obj = right[idx];
        const anchor = { x: obj.x, y: obj.y };

        // --- REMOVE: object is gone on the right side ------------------------
        if (kind === 'remove') {
            if (!farEnough(diffs, anchor, DIFF_SEPARATION)) continue;
            usedIndices.add(idx);
            removedIndices.add(idx);
            diffs.push({
                kind,
                x: anchor.x,
                y: anchor.y,
                radius: Math.max(obj.radius, 24) * preset.hitRadiusMult,
                markLeft: { x: anchor.x, y: anchor.y },
                markRight: { x: anchor.x, y: anchor.y },
                found: false,
            });
            continue;
        }

        // --- RECOLOR: same object, new colour on the right -------------------
        if (kind === 'recolor') {
            const type = getObjectType(obj.typeId);
            if (!type) continue;
            const clearly = type.palette.filter(c =>
                c !== obj.color && colorDistance(c, obj.color) >= MIN_RECOLOR_DISTANCE);
            const anyOther = type.palette.filter(c => c !== obj.color);
            const pool = clearly.length ? clearly : anyOther;
            if (!pool.length) continue;
            if (!farEnough(diffs, anchor, DIFF_SEPARATION)) continue;
            usedIndices.add(idx);
            obj.color = pick(pool);
            diffs.push({
                kind,
                x: anchor.x,
                y: anchor.y,
                radius: Math.max(obj.radius, 24) * preset.hitRadiusMult,
                markLeft: { x: anchor.x, y: anchor.y },
                markRight: { x: anchor.x, y: anchor.y },
                found: false,
            });
            continue;
        }

        // --- RESIZE: same object, clearly different size on the right --------
        if (kind === 'resize') {
            const type = getObjectType(obj.typeId);
            if (!type) continue;

            const grow = Math.random() < 0.5;
            const newScale = clamp(obj.scale * (grow ? 1.6 : 0.55), 0.4, 2.2);
            const newRadius = type.radius * newScale;

            const margin = Math.min(newRadius + 4, base.viewW / 2 - 4, base.viewH / 2 - 4);
            const nx = clamp(obj.x, margin, base.viewW - margin);
            const ny = clamp(obj.y, margin, base.viewH - margin);

            const clashes = right.some((other, i) =>
                i !== idx && !removedIndices.has(i) &&
                distancePt(other, { x: nx, y: ny }) < (other.radius + newRadius) * OBJECT_OVERLAP_ALLOWANCE);
            if (clashes) continue;

            const newAnchor = { x: nx, y: ny };
            if (!farEnough(diffs, newAnchor, DIFF_SEPARATION)) continue;

            usedIndices.add(idx);
            obj.scale = newScale;
            obj.radius = newRadius;
            obj.x = nx;
            obj.y = ny;
            diffs.push({
                kind,
                x: newAnchor.x,
                y: newAnchor.y,
                radius: Math.max(newRadius, 24) * preset.hitRadiusMult,
                markLeft: { x: anchor.x, y: anchor.y },
                markRight: { x: newAnchor.x, y: newAnchor.y },
                found: false,
            });
            continue;
        }

        // --- MOVE: same object, visibly shifted on the right -----------------
        if (kind === 'move') {
            const minDist = Math.max(45, Math.round(obj.radius * 2.4));
            const maxDist = minDist + 26;
            let placed = false;
            for (let attempt = 0; attempt < 20 && !placed; attempt++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = randInt(minDist, maxDist);
                const margin = obj.radius + 6;
                const nx = clamp(obj.x + Math.cos(angle) * dist, margin, base.viewW - margin);
                const ny = clamp(obj.y + Math.sin(angle) * dist, margin, base.viewH - margin);
                const actual = Math.hypot(nx - obj.x, ny - obj.y);
                if (actual < minDist * 0.85) continue;
                const clashes = right.some((other, i) =>
                    i !== idx && !removedIndices.has(i) &&
                    distancePt(other, { x: nx, y: ny }) < (other.radius + obj.radius) * OBJECT_OVERLAP_ALLOWANCE);
                if (clashes) continue;
                const from = { x: obj.x, y: obj.y };
                const mid = { x: (from.x + nx) / 2, y: (from.y + ny) / 2 };
                if (!farEnough(diffs, mid, DIFF_SEPARATION)) continue;
                usedIndices.add(idx);
                obj.x = nx;
                obj.y = ny;
                // Hit radius is based on the object, not the distance moved,
                // so clicks must land near one of the two visible positions.
                diffs.push({
                    kind,
                    x: mid.x,
                    y: mid.y,
                    radius: Math.max(obj.radius * 1.2, 26) * preset.hitRadiusMult,
                    markLeft: from,
                    markRight: { x: nx, y: ny },
                    found: false,
                });
                placed = true;
            }
            continue;
        }
    }

    return { left, right: right.filter((_, i) => !removedIndices.has(i)), diffs };
}

function isValidRenderableObject(o) {
    return !!o && !!o.typeId &&
        Number.isFinite(o.x) && Number.isFinite(o.y) &&
        Number.isFinite(o.scale) && o.scale > 0 &&
        Number.isFinite(o.radius) && o.radius > 0;
}

function sceneIsValid(built) {
    if (!built || !Array.isArray(built.left) || !Array.isArray(built.right)) return false;
    if (!built.left.every(isValidRenderableObject)) return false;
    if (!built.right.every(isValidRenderableObject)) return false;
    return true;
}

function buildRoundScene(sizeKey, round) {
    const preset = SIZE_PRESETS[sizeKey] || SIZE_PRESETS.small;
    const desired = diffCountForRound(round);
    let result = null;

    for (let attempt = 0; attempt < 10 && !result; attempt++) {
        const base = generateBaseScene(sizeKey);
        if (!base.objects.length) continue;
        const maxByObjects = Math.max(3, base.objects.length - 1);
        const diffCount = Math.max(1, Math.min(desired, maxByObjects, preset.maxObjects + 2));
        const built = generateDifferences(base, diffCount);
        if (built.diffs.length > 0 && sceneIsValid(built)) {
            result = {
                theme: base.theme,
                viewW: base.viewW,
                viewH: base.viewH,
                groundY: base.groundY,
                left: built.left,
                right: built.right,
                diffs: built.diffs,
            };
        }
    }

    for (let attempt = 0; attempt < 10 && !result; attempt++) {
        const base = generateBaseScene(sizeKey);
        if (!base.objects.length) continue;
        const built = generateDifferences(base, 1);
        if (built.diffs.length > 0 && sceneIsValid(built)) {
            result = {
                theme: base.theme,
                viewW: base.viewW,
                viewH: base.viewH,
                groundY: base.groundY,
                left: built.left,
                right: built.right,
                diffs: built.diffs,
            };
        }
    }

    return result;
}