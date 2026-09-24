// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// --- Sprite helper -----------------------------------------------------------
function sprite(name) {
    if (!name) return '';
    const bag = window.GameSprites;
    return (bag && bag[name]) || '';
}

// --- Tile texture variation --------------------------------------------------
// Walls and floors each have a handful of hand-drawn variants. I hash (x, y)
// to pick one so a tile keeps the same look across renders - Math.random()
// here would make the entire dungeon flicker on every step.
function tileHash(x, y) {
    let h = (x * 374761393 + y * 668265263) | 0;
    h = ((h ^ (h >>> 13)) * 1274126177) | 0;
    return (h ^ (h >>> 16)) >>> 0;
}
function variantFor(x, y, variants) {
    return variants[tileHash(x, y) % variants.length];
}
const WALL_VARIANTS = ['wallA', 'wallB', 'wallC'];
const FLOOR_VARIANTS = ['floorA', 'floorB', 'floorC'];