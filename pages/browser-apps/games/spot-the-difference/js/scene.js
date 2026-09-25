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
// Used to reject "recolor" differences that are too subtle
// to spot (e.g. #fbbf24 vs #facc15).
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

// Minimum distance between two difference anchors so their click targets
// never overlap and every difference stays individually findable.
const DIFF_SEPARATION = 70;

// Recolours are ignored unless they are at least this far apart in RGB space.
// (A palette pair like #fbbf24 / #facc15 scores ~20 — basically invisible.)
const MIN_RECOLOR_DISTANCE = 60;

// Scatters a random handful of objects across the canvas, rejecting spots
// that would overlap something already placed.
function generateBaseScene(sizeKey) {
    const preset = SIZE_PRESETS[sizeKey] || SIZE_PRESETS.small;
    const theme = pick(SCENE_THEMES);
    const count = randInt(preset.minObjects, preset.maxObjects);
    const objects = [];
    let attempts = 0;
    while (objects.length < count && attempts < count * 60) {
        attempts++;
        const type = pick(OBJECT_TYPES);
        const scale = 0.8 + Math.random() * 0.5;
        const radius = type.radius * scale;
        const spot = findFreeSpot(objects, preset.w, preset.h, radius);
        if (!spot) continue;
        // Keep every object fully inside the viewBox so nothing is ever
        // half-drawn off the edge (which would make it look "missing").
        const margin = Math.min(radius + 4, preset.w / 2 - 4, preset.h / 2 - 4);
        objects.push({
            typeId: type.id,
            x: clamp(spot.x, margin, preset.w - margin),
            y: clamp(spot.y, margin, preset.h - margin),
            scale,
            radius,
            color: pick(type.palette),
        });
    }
    return { theme, viewW: preset.w, viewH: preset.h, objects };
}

// Clones the base scene into a "left" (untouched) and "right" (mutated) copy,
// applying `diffCount` distinct differences to the right side only.
function generateDifferences(base, diffCount) {
    const preset = DIFFICULTY_PRESETS[difficultyKey];
    const left = base.objects.map(o => ({ ...o }));
    const right = base.objects.map(o => ({ ...o }));
    const diffs = [];
    const usedIndices = new Set();
    const kindOrder = shuffle(DIFF_KIND_CYCLE);
    let guard = 0;
    let kindIdx = 0;
    const maxGuard = Math.max(80, diffCount * 80);

    while (diffs.length < diffCount && guard < maxGuard) {
        guard++;
        // Advance through the kind cycle on every attempt (success *or*
        // failure) so a kind that can't be placed here doesn't stall the
        // whole round and leave us with zero differences.
        const kind = kindOrder[kindIdx % kindOrder.length];
        kindIdx++;

        // --- ADD: a brand new object exists on the right only ---------------
        if (kind === 'add') {
            const type = pick(OBJECT_TYPES);
            const scale = 0.8 + Math.random() * 0.5;
            const radius = type.radius * scale;
            const spot = findFreeSpot(right, base.viewW, base.viewH, radius);
            if (!spot) continue;
            const margin = radius + 4;
            const px = clamp(spot.x, margin, base.viewW - margin);
            const py = clamp(spot.y, margin, base.viewH - margin);
            if (!farEnough(diffs, { x: px, y: py }, DIFF_SEPARATION)) continue;
            right.push({ typeId: type.id, x: px, y: py, scale, radius, color: pick(type.palette) });
            // Mark this brand-new object as spoken for so a later diff
            // doesn't mutate it too (which would create a misleading anchor).
            usedIndices.add(right.length - 1);
            diffs.push({
                kind,
                x: px,
                y: py,
                radius: Math.max(radius, 22) * preset.hitRadiusMult,
                found: false,
            });
            continue;
        }

        // Build the list of objects we're still allowed to touch.
        const available = [];
        for (let i = 0; i < right.length; i++) {
            if (!usedIndices.has(i) && !right[i]._removed) available.push(i);
        }
        if (!available.length) continue;
        const idx = pick(available);
        const obj = right[idx];
        const anchor = { x: obj.x, y: obj.y };

        // --- REMOVE: object gone on the right --------------------------------
        if (kind === 'remove') {
            if (!farEnough(diffs, anchor, DIFF_SEPARATION)) continue;
            usedIndices.add(idx);
            obj._removed = true;
            diffs.push({
                kind,
                x: anchor.x,
                y: anchor.y,
                radius: Math.max(obj.radius, 22) * preset.hitRadiusMult,
                found: false,
            });
            continue;
        }

        // --- RECOLOR: same object, new colour on the right -------------------
        if (kind === 'recolor') {
            const type = getObjectType(obj.typeId);
            if (!type) continue;
            // Prefer palette entries that are *clearly* different.
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
                radius: Math.max(obj.radius, 22) * preset.hitRadiusMult,
                found: false,
            });
            continue;
        }

        // --- RESIZE: same object, clearly different size on the right --------
        if (kind === 'resize') {
            if (!farEnough(diffs, anchor, DIFF_SEPARATION)) continue;
            usedIndices.add(idx);
            const grow = Math.random() < 0.5;
            // Make it obvious: at least a 45% / 60% size jump.
            obj.scale = clamp(obj.scale * (grow ? 1.6 : 0.55), 0.4, 2.2);
            obj.radius = getObjectRadius(obj.typeId) * obj.scale;
            diffs.push({
                kind,
                x: anchor.x,
                y: anchor.y,
                radius: Math.max(obj.radius, 24) * preset.hitRadiusMult,
                found: false,
            });
            continue;
        }

        // --- MOVE: same object, visibly shifted on the right -----------------
        if (kind === 'move') {
            // The shift has to be big enough to actually notice. Tie the
            // minimum distance to the object's own size, so even a small
            // heart or moon moves a real, visible number of pixels.
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
                // If clamping ate the movement, don't count it.
                if (actual < minDist * 0.85) continue;
                // Don't drop the moved object on top of another one, or it
                // becomes visually merged and effectively invisible.
                const clashes = right.some((other, i) =>
                    i !== idx && !other._removed &&
                    distancePt(other, { x: nx, y: ny }) < (other.radius + obj.radius) * 0.9);
                if (clashes) continue;
                const mid = { x: (obj.x + nx) / 2, y: (obj.y + ny) / 2 };
                if (!farEnough(diffs, mid, DIFF_SEPARATION)) continue;
                usedIndices.add(idx);
                obj.x = nx;
                obj.y = ny;
                diffs.push({
                    kind,
                    x: mid.x,
                    y: mid.y,
                    radius: Math.max(obj.radius + actual * 0.6, 32) * preset.hitRadiusMult,
                    found: false,
                });
                placed = true;
            }
            continue;
        }
    }

    return { left, right: right.filter(o => !o._removed), diffs };
}

function buildRoundScene(sizeKey, round) {
    const preset = SIZE_PRESETS[sizeKey] || SIZE_PRESETS.small;
    const desired = diffCountForRound(round);
    let result = null;

    // Retry so we never hand the player an empty (unwinnable) round, and
    // so sparse scenes still produce a playable number of differences.
    for (let attempt = 0; attempt < 10 && !result; attempt++) {
        const base = generateBaseScene(sizeKey);
        if (!base.objects.length) continue;
        const maxByObjects = Math.max(3, base.objects.length - 1);
        const diffCount = Math.max(1, Math.min(desired, maxByObjects, preset.maxObjects + 2));
        const built = generateDifferences(base, diffCount);
        if (built.diffs.length > 0) {
            result = {
                theme: base.theme,
                viewW: base.viewW,
                viewH: base.viewH,
                left: built.left,
                right: built.right,
                diffs: built.diffs,
            };
        }
    }

    // Last-ditch fallback: keep the game playable no matter what.
    if (!result) {
        const base = generateBaseScene(sizeKey);
        const built = generateDifferences(base, 1);
        result = {
            theme: base.theme,
            viewW: base.viewW,
            viewH: base.viewH,
            left: built.left,
            right: built.right,
            diffs: built.diffs,
        };
    }

    return result;
}