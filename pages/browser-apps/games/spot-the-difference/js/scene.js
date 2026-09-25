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

// --- Theme / composition helpers ----------------------------------------------
function poolHasType(pool, typeId) {
    return pool.sky.includes(typeId) || pool.ground.includes(typeId);
}

function compositionFitsPool(comp, pool) {
    return comp.requires.every(t => poolHasType(pool, t));
}

// Returns true if placing `candidate` would violate a theme rejection
// against any of the types already present in the scene.
function typeIsRejected(candidate, existingTypes, rejects) {
    if (!rejects || !rejects.length) return false;
    for (const [a, b] of rejects) {
        if (candidate === a && existingTypes.has(b)) return true;
        if (candidate === b && existingTypes.has(a)) return true;
    }
    return false;
}

// Bounding box of a composition relative to its anchor. Lets us know how
// much slack to leave on each side when picking an anchor point.
function compositionExtents(comp) {
    let minDx = Infinity, maxDx = -Infinity, minDy = Infinity, maxDy = -Infinity;
    for (const part of comp.parts) {
        const type = getObjectType(part.typeId);
        if (!type) continue;
        const r = type.radius * part.scale;
        minDx = Math.min(minDx, part.dx - r);
        maxDx = Math.max(maxDx, part.dx + r);
        minDy = Math.min(minDy, part.dy - r);
        maxDy = Math.max(maxDy, part.dy + r);
    }
    return { minDx, maxDx, minDy, maxDy };
}

// Try to drop one whole composition into the scene. Returns true on
// success and commits the placed parts to `objects`.
function tryPlaceComposition(comp, objects, w, h, groundY) {
    const pad = 22;
    const ext = compositionExtents(comp);
    if (!Number.isFinite(ext.minDx) || !Number.isFinite(ext.maxDx)) return false;

    // The band describes where a composition's *body* may sit. We subtract
    // the composition's own extents from the band to get a legal anchor
    // range, so the whole cluster stays inside the band.
    const band = comp.band === 'sky'
        ? { minX: pad, maxX: w * 0.72, minY: pad, maxY: groundY - 12 }
        : { minX: w * 0.14, maxX: w * 0.74, minY: groundY - 20, maxY: h - pad };

    const aMinX = band.minX - ext.minDx;
    const aMaxX = band.maxX - ext.maxDx;
    const aMinY = band.minY - ext.minDy;
    const aMaxY = band.maxY - ext.maxDy;
    if (aMaxX <= aMinX || aMaxY <= aMinY) return false;

    for (let attempt = 0; attempt < 40; attempt++) {
        const cx = randInt(aMinX, aMaxX);
        const cy = randInt(aMinY, aMaxY);
        const placements = [];
        let ok = true;

        for (const part of comp.parts) {
            const type = getObjectType(part.typeId);
            if (!type) { ok = false; break; }
            const radius = type.radius * part.scale;
            const x = cx + part.dx;
            const y = cy + part.dy;

            if (x - radius < pad || x + radius > w - pad) { ok = false; break; }
            if (y - radius < pad || y + radius > h - pad) { ok = false; break; }
            if (comp.band === 'sky' && y + radius > groundY - 8) { ok = false; break; }

            const clashOutside = objects.some(o =>
                distancePt(o, { x, y }) < (o.radius + radius + 6));
            if (clashOutside) { ok = false; break; }

            const clashInside = placements.some(p =>
                distancePt(p, { x, y }) < (p.radius + radius + 4));
            if (clashInside) { ok = false; break; }

            placements.push({ part, type, x, y, radius });
        }

        if (!ok) continue;

        for (const p of placements) {
            objects.push({
                typeId: p.part.typeId,
                x: p.x,
                y: p.y,
                scale: p.part.scale,
                radius: p.radius,
                color: pick(p.type.palette),
                band: comp.band,
            });
        }
        return true;
    }
    return false;
}

// --- Individual placement ------------------------------------------------------
// Places one object inside its band, avoiding everything already placed.
// Sky band is above the ground line, ground band sits along it.
// The x range for ground objects leaves room for the skeleton anchors.
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

// Fills the scene up to `target` objects with individual (non-composed)
// picks, respecting the theme's reject pairs.
function fillWithIndividuals(objects, w, h, groundY, pool, target, placedTypes) {
    const types = new Set(placedTypes);

    // Sky band first, so ground objects that depend on remaining room see
    // the true final count.
    let skyCount = objects.filter(o => o.band === 'sky').length;
    const skyTarget = clamp(skyCount + randInt(1, 2), 2, 4);
    let attempts = 0;
    while (skyCount < skyTarget && attempts < 60) {
        attempts++;
        const candidates = pool.sky.filter(t => !typeIsRejected(t, types, pool.rejects));
        if (!candidates.length) break;
        const type = getObjectType(pick(candidates));
        const scale = 0.6 + Math.random() * 0.4;
        const radius = type.radius * scale;
        const spot = findSpot(objects, w, h, radius, 'sky', groundY);
        if (!spot) continue;
        objects.push({ typeId: type.id, x: spot.x, y: spot.y, scale, radius, color: pick(type.palette), band: 'sky' });
        types.add(type.id);
        skyCount++;
    }

    // Ground band fills to the target total.
    attempts = 0;
    while (objects.length < target && attempts < 120) {
        attempts++;
        const candidates = pool.ground.filter(t => !typeIsRejected(t, types, pool.rejects));
        if (!candidates.length) break;
        const type = getObjectType(pick(candidates));
        const scale = 0.95 + Math.random() * 0.4;
        const radius = type.radius * scale;
        const spot = findSpot(objects, w, h, radius, 'ground', groundY);
        if (!spot) continue;
        objects.push({ typeId: type.id, x: spot.x, y: spot.y, scale, radius, color: pick(type.palette), band: 'ground' });
        types.add(type.id);
    }
}

// --- Base scene ----------------------------------------------------------------
// Scatters a themed handful of sky and ground objects across the canvas.
// Compositions (clusters) are dropped in first; individual objects fill
// the rest of the target so scenes don't look sparse.
function generateBaseScene(sizeKey) {
    const preset = SIZE_PRESETS[sizeKey] || SIZE_PRESETS.small;
    const theme = pick(SCENE_THEMES);
    const pool = THEME_POOLS[theme.id] || THEME_POOLS.meadow;
    const variants = SKELETON_VARIANTS[theme.id] || SKELETON_VARIANTS.meadow;
    const variant = pick(variants);
    const hillLayout = pick(HILL_LAYOUTS);
    const groundY = preset.h * GROUND_FRACTION;
    const objects = [];
    const target = randInt(preset.minObjects, preset.maxObjects);
    const placedTypes = new Set();

    // 1. Compositions first - they're the visually deliberate clusters.
    const eligible = COMPOSITIONS.filter(c =>
        compositionFitsPool(c, pool) && c.parts.length <= target + 1);
    const shuffled = shuffle(eligible);
    const maxComps = Math.min(2, Math.max(1, Math.floor(target / 3)));
    let compsPlaced = 0;
    for (const comp of shuffled) {
        if (compsPlaced >= maxComps) break;
        if (comp.requires.some(t => typeIsRejected(t, placedTypes, pool.rejects))) continue;
        if (tryPlaceComposition(comp, objects, preset.w, preset.h, groundY)) {
            for (const p of comp.parts) placedTypes.add(p.typeId);
            compsPlaced++;
        }
    }

    // 2. Fill out the rest with individual objects.
    fillWithIndividuals(objects, preset.w, preset.h, groundY, pool, target, placedTypes);

    return { theme, variant, hillLayout, viewW: preset.w, viewH: preset.h, groundY, objects };
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
                variant: base.variant,
                hillLayout: base.hillLayout,
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
                variant: base.variant,
                hillLayout: base.hillLayout,
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