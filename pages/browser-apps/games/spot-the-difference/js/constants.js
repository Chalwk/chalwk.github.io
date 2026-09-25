// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// --- Constants -----------------------------------------------------------
const MAX_ROUND = 12;

const SIZE_PRESETS = {
    small: { w: 480, h: 320, minObjects: 6, maxObjects: 8 },
    medium: { w: 560, h: 360, minObjects: 8, maxObjects: 11 },
    large: { w: 640, h: 400, minObjects: 10, maxObjects: 14 },
};

const DIFFICULTY_PRESETS = {
    easy: { baseTime: 80, minTime: 35, diffStart: 4, diffStep: 2, hitRadiusMult: 1.2, missPenalty: 2, hintCost: 8, hintsPerRound: 3 },
    normal: { baseTime: 65, minTime: 28, diffStart: 5, diffStep: 2, hitRadiusMult: 1, missPenalty: 4, hintCost: 12, hintsPerRound: 2 },
    hard: { baseTime: 50, minTime: 22, diffStart: 6, diffStep: 3, hitRadiusMult: 0.82, missPenalty: 6, hintCost: 16, hintsPerRound: 1 },
};

// Sky, ground and hill colours for each theme. The skeleton and the
// objects share these so the scene reads as one picture.
const SCENE_THEMES = [
    { id: 'meadow', name: 'Sunny Meadow', icon: '🌼', sky: ['#8ec9f0', '#d8f3ff'], ground: '#7bbf6a', groundLine: '#5a9c4a', hillA: '#9ad786', hillB: '#6eb25c', accent: '#fde047' },
    { id: 'dusk', name: 'Dusky Orchard', icon: '🌇', sky: ['#f6a56b', '#5b3a86'], ground: '#4a3a5c', groundLine: '#332748', hillA: '#6a527e', hillB: '#3f3355', accent: '#fef3c7' },
    { id: 'night', name: 'Starlit Garden', icon: '🌙', sky: ['#101c3d', '#1f3866'], ground: '#16233f', groundLine: '#0d1730', hillA: '#1f3260', hillB: '#122042', accent: '#e5e7eb' },
    { id: 'desert', name: 'Dune Oasis', icon: '🏜️', sky: ['#ffd68a', '#ffb3a0'], ground: '#e0b876', groundLine: '#c99a55', hillA: '#eec688', hillB: '#d4a668', accent: '#fb923c' },
    { id: 'candy', name: 'Candy Grove', icon: '🍬', sky: ['#ffd1ee', '#fff0f8'], ground: '#f7a8c4', groundLine: '#e084ab', hillA: '#ffb8d8', hillB: '#e894ba', accent: '#f472b6' },
    { id: 'deep', name: 'Underwater Reef', icon: '🌊', sky: ['#0b4f6c', '#1c7ea8'], ground: '#0a3a52', groundLine: '#062938', hillA: '#0e5875', hillB: '#093f58', accent: '#67e8f9' },
];

const OBJECT_TYPES = [
    { id: 'sun', name: 'Sun', radius: 19, palette: ['#fbbf24', '#f97316', '#fde047', '#facc15'] },
    { id: 'cloud', name: 'Cloud', radius: 16, palette: ['#ffffff', '#e5e7eb', '#cbd5e1', '#fde68a'] },
    { id: 'tree', name: 'Tree', radius: 18, palette: ['#22c55e', '#16a34a', '#4ade80', '#0d9488'] },
    { id: 'mushroom', name: 'Mushroom', radius: 16, palette: ['#ef4444', '#f97316', '#a855f7', '#ec4899'] },
    { id: 'star', name: 'Star', radius: 16, palette: ['#fde047', '#fbbf24', '#67e8f9', '#f472b6'] },
    { id: 'heart', name: 'Heart', radius: 16, palette: ['#f472b6', '#ef4444', '#a855f7', '#fb7185'] },
    { id: 'moon', name: 'Moon', radius: 14, palette: ['#e5e7eb', '#fef3c7', '#93c5fd', '#c4b5fd'] },
    { id: 'flower', name: 'Flower', radius: 14, palette: ['#f472b6', '#fbbf24', '#f87171', '#a78bfa'] },
    { id: 'gem', name: 'Gem', radius: 16, palette: ['#67e8f9', '#a855f7', '#4ade80', '#f472b6'] },
    { id: 'ghost', name: 'Ghost', radius: 14, palette: ['#e5e7eb', '#c4b5fd', '#93c5fd', '#fbcfe8'] },
    { id: 'balloon', name: 'Balloon', radius: 18, palette: ['#f87171', '#60a5fa', '#facc15', '#4ade80'] },
    { id: 'fish', name: 'Fish', radius: 16, palette: ['#fb923c', '#38bdf8', '#f472b6', '#a3e635'] },
    { id: 'bird', name: 'Bird', radius: 14, palette: ['#38bdf8', '#a855f7', '#f472b6', '#fb923c'] },
    { id: 'bush', name: 'Bush', radius: 18, palette: ['#22c55e', '#16a34a', '#4ade80', '#0d9488'] },
];

// Each theme draws from its own pools. Sky objects float in the upper
// part of the canvas. Ground objects sit along the ground line.
// `rejects` is a list of type-id pairs that must not co-exist in one
// scene. This gives themes a way to keep iconic combos apart (a sun next
// to a star, a ghost beside a flower) so the scene still reads cleanly
// even after compositions scatter objects around.
const THEME_POOLS = {
    meadow: {
        sky: ['sun', 'cloud', 'balloon', 'bird'],
        ground: ['tree', 'mushroom', 'flower', 'bush', 'heart'],
        rejects: [['heart', 'mushroom'], ['balloon', 'mushroom']],
    },
    dusk: {
        sky: ['cloud', 'balloon', 'bird', 'star'],
        ground: ['tree', 'mushroom', 'flower', 'bush', 'ghost'],
        rejects: [['ghost', 'flower'], ['balloon', 'ghost']],
    },
    night: {
        sky: ['moon', 'star', 'cloud', 'ghost'],
        ground: ['tree', 'mushroom', 'gem', 'bush', 'flower'],
        rejects: [['ghost', 'flower'], ['flower', 'mushroom']],
    },
    desert: {
        sky: ['sun', 'cloud', 'bird'],
        ground: ['tree', 'gem', 'mushroom', 'bush', 'star'],
        rejects: [['sun', 'star'], ['mushroom', 'gem']],
    },
    candy: {
        sky: ['cloud', 'heart', 'balloon', 'sun'],
        ground: ['tree', 'mushroom', 'flower', 'heart', 'bush'],
        rejects: [['sun', 'heart'], ['mushroom', 'heart']],
    },
    deep: {
        sky: ['fish', 'star', 'ghost'],
        ground: ['fish', 'gem', 'star', 'flower', 'bush'],
        rejects: [['ghost', 'flower'], ['gem', 'star']],
    },
};

// Skeleton variants control the permanent scenery on the left and right
// edges plus the number of hills. Every variant keeps the "one anchor
// left, one anchor right" rhythm so differences still pop against a
// stable frame, but the shape of that frame is no longer predictable.
const SKELETON_VARIANTS = {
    meadow: [
        { id: 'tree_fence', left: 'tree', right: 'fence' },
        { id: 'cabin_open', left: 'cabin', right: 'none' },
        { id: 'tree_tree', left: 'tree', right: 'tree' },
        { id: 'tree_windmill', left: 'tree', right: 'windmill' },
    ],
    dusk: [
        { id: 'tree_fence', left: 'tree', right: 'fence' },
        { id: 'cabin_open', left: 'cabin', right: 'none' },
        { id: 'tree_windmill', left: 'tree', right: 'windmill' },
    ],
    night: [
        { id: 'tree_fence', left: 'tree', right: 'fence' },
        { id: 'cabin_open', left: 'cabin', right: 'none' },
        { id: 'tree_lighthouse', left: 'tree', right: 'lighthouse' },
    ],
    desert: [
        { id: 'cactus_open', left: 'cactus', right: 'none' },
        { id: 'rocks_open', left: 'rocks', right: 'none' },
        { id: 'cactus_rocks', left: 'cactus', right: 'rocks' },
        { id: 'cactus_windmill', left: 'cactus', right: 'windmill' },
    ],
    candy: [
        { id: 'tree_fence', left: 'tree', right: 'fence' },
        { id: 'cabin_open', left: 'cabin', right: 'none' },
        { id: 'tree_tree', left: 'tree', right: 'tree' },
    ],
    deep: [
        { id: 'coral_open', left: 'coral', right: 'none' },
        { id: 'rocks_open', left: 'rocks', right: 'none' },
        { id: 'coral_rocks', left: 'coral', right: 'rocks' },
    ],
};

// Distant terrain layouts. Fractions are of the viewport size so they
// scale with the size preset. Each entry has 1-3 hill ellipses.
const HILL_LAYOUTS = [
    { hills: [[0.22, 8, 0.32, 0.11], [0.70, 12, 0.38, 0.09]] },
    { hills: [[0.35, 6, 0.45, 0.13]] },
    { hills: [[0.15, 10, 0.26, 0.10], [0.52, 4, 0.30, 0.14], [0.84, 12, 0.28, 0.09]] },
    { hills: [[0.62, 10, 0.50, 0.12]] },
    { hills: [[0.28, 14, 0.40, 0.10], [0.78, 6, 0.32, 0.12]] },
];

// Composed templates cluster objects so differences feel deliberate
// rather than scattered. Each composition declares its band, the object
// types it needs via `requires`, and relative offsets for each part.
// If a theme pool does not offer all required types, the composition is
// skipped and the next candidate is tried.
const COMPOSITIONS = [
    {
        id: 'cottage', band: 'ground',
        requires: ['tree', 'bush', 'flower'],
        parts: [
            { typeId: 'tree', dx: 0, dy: -4, scale: 1.05 },
            { typeId: 'bush', dx: -30, dy: 10, scale: 0.85 },
            { typeId: 'bush', dx: 30, dy: 10, scale: 0.85 },
            { typeId: 'flower', dx: -12, dy: 16, scale: 0.7 },
            { typeId: 'flower', dx: 12, dy: 16, scale: 0.7 },
        ],
    },
    {
        id: 'grove', band: 'ground',
        requires: ['tree'],
        parts: [
            { typeId: 'tree', dx: -26, dy: 4, scale: 0.95 },
            { typeId: 'tree', dx: 0, dy: -8, scale: 1.15 },
            { typeId: 'tree', dx: 26, dy: 4, scale: 0.95 },
        ],
    },
    {
        id: 'mushroom_patch', band: 'ground',
        requires: ['mushroom'],
        parts: [
            { typeId: 'mushroom', dx: -16, dy: 6, scale: 1.0 },
            { typeId: 'mushroom', dx: 2, dy: 0, scale: 1.2 },
            { typeId: 'mushroom', dx: 18, dy: 8, scale: 0.9 },
        ],
    },
    {
        id: 'flower_bed', band: 'ground',
        requires: ['flower'],
        parts: [
            { typeId: 'flower', dx: -20, dy: 4, scale: 0.9 },
            { typeId: 'flower', dx: 0, dy: -2, scale: 1.05 },
            { typeId: 'flower', dx: 20, dy: 4, scale: 0.9 },
        ],
    },
    {
        id: 'gem_cluster', band: 'ground',
        requires: ['gem'],
        parts: [
            { typeId: 'gem', dx: -16, dy: 6, scale: 1.0 },
            { typeId: 'gem', dx: 14, dy: 2, scale: 1.1 },
        ],
    },
    {
        id: 'bush_row', band: 'ground',
        requires: ['bush'],
        parts: [
            { typeId: 'bush', dx: -24, dy: 4, scale: 0.9 },
            { typeId: 'bush', dx: 0, dy: 0, scale: 1.0 },
            { typeId: 'bush', dx: 24, dy: 4, scale: 0.9 },
        ],
    },
    {
        id: 'heart_pair', band: 'ground',
        requires: ['heart'],
        parts: [
            { typeId: 'heart', dx: -14, dy: 0, scale: 1.0 },
            { typeId: 'heart', dx: 14, dy: 4, scale: 0.9 },
        ],
    },
    {
        id: 'fish_school', band: 'sky',
        requires: ['fish'],
        parts: [
            { typeId: 'fish', dx: -28, dy: 2, scale: 0.8 },
            { typeId: 'fish', dx: 0, dy: -8, scale: 0.9 },
            { typeId: 'fish', dx: 28, dy: 2, scale: 0.8 },
        ],
    },
    {
        id: 'cloud_bank', band: 'sky',
        requires: ['cloud'],
        parts: [
            { typeId: 'cloud', dx: -34, dy: 0, scale: 0.8 },
            { typeId: 'cloud', dx: 10, dy: 6, scale: 0.7 },
            { typeId: 'cloud', dx: 40, dy: -2, scale: 0.65 },
        ],
    },
    {
        id: 'balloon_cluster', band: 'sky',
        requires: ['balloon'],
        parts: [
            { typeId: 'balloon', dx: -22, dy: 2, scale: 0.85 },
            { typeId: 'balloon', dx: 0, dy: -10, scale: 0.95 },
            { typeId: 'balloon', dx: 22, dy: 4, scale: 0.8 },
        ],
    },
    {
        id: 'flock', band: 'sky',
        requires: ['bird'],
        parts: [
            { typeId: 'bird', dx: -26, dy: 0, scale: 0.75 },
            { typeId: 'bird', dx: 0, dy: -8, scale: 0.85 },
            { typeId: 'bird', dx: 28, dy: 2, scale: 0.7 },
        ],
    },
    {
        id: 'star_patch', band: 'sky',
        requires: ['star'],
        parts: [
            { typeId: 'star', dx: -24, dy: 0, scale: 0.7 },
            { typeId: 'star', dx: 4, dy: -10, scale: 0.8 },
            { typeId: 'star', dx: 26, dy: 4, scale: 0.65 },
        ],
    },
    {
        id: 'ghost_watch', band: 'sky',
        requires: ['ghost'],
        parts: [
            { typeId: 'ghost', dx: -18, dy: 0, scale: 0.9 },
            { typeId: 'ghost', dx: 16, dy: -6, scale: 0.8 },
        ],
    },
];

const DIFF_TYPES = {
    recolor: { id: 'recolor', label: 'a colour swap' },
    resize: { id: 'resize', label: 'a size change' },
    move: { id: 'move', label: 'a shifted object' },
    remove: { id: 'remove', label: 'a missing object' },
};

// Kinds rotate so early diffs are not all the same archetype.
// "add" is gone because a subtle extra object is not findable.
const DIFF_KIND_CYCLE = ['recolor', 'move', 'resize', 'remove', 'recolor', 'move', 'resize', 'remove'];