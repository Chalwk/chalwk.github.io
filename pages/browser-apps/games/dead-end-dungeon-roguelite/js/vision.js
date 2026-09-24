// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// --- Vision ------------------------------------------------------------------
// Standard Bresenham line - if any tile between us blocks sight, this fails.
function hasLineOfSight(x0, y0, x1, y1) {
    let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    let sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy, x = x0, y = y0;
    while (true) {
        if (x === x1 && y === y1) return true;
        if (!(x === x0 && y === y0) && !isOpenForVision(x, y)) return false;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x += sx; }
        if (e2 <= dx) { err += dx; y += sy; }
    }
}
function visionRadius() {
    let radius = floorTheme.vision;
    if (hasBoon('scouting')) radius += 1;
    return radius;
}

// Treasure Sense extends the shimmer range; Pathfinder gives a small bump too.
function secretHintRadius() { return hasBoon('treasure_sense') ? 3 : hasBoon('scouting') ? 2 : 1; }

// Rebuild `visible` (line of sight) and OR the results into `discovered` (memory).
function recomputeVisibility() {
    visible = Array.from({ length: gridH }, () => Array(gridW).fill(false));
    const px = player.x, py = player.y, vr = visionRadius();
    for (let y = Math.max(0, py - vr); y <= Math.min(gridH - 1, py + vr); y++) {
        for (let x = Math.max(0, px - vr); x <= Math.min(gridW - 1, px + vr); x++) {
            if (Math.max(Math.abs(x - px), Math.abs(y - py)) > vr) continue;
            if (hasLineOfSight(px, py, x, y)) {
                visible[y][x] = true;
                discovered[y][x] = true;
            }
        }
    }
}