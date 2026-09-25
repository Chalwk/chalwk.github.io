// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// --- Constants -----------------------------------------------------------
const MAX_ROUND = 12;

// Canvas dimensions and how many objects get scattered into the scene.
const SIZE_PRESETS = {
    small: { w: 480, h: 320, minObjects: 6, maxObjects: 8 },
    medium: { w: 560, h: 360, minObjects: 8, maxObjects: 11 },
    large: { w: 640, h: 400, minObjects: 10, maxObjects: 14 },
};

// Difficulty knobs: starting timer, how fast the diff count ramps up,
// click forgiveness, and the cost of a wrong click / a hint.
const DIFFICULTY_PRESETS = {
    easy: { baseTime: 80, minTime: 35, diffStart: 4, diffStep: 2, hitRadiusMult: 1.2, missPenalty: 2, hintCost: 8, hintsPerRound: 3 },
    normal: { baseTime: 65, minTime: 28, diffStart: 5, diffStep: 2, hitRadiusMult: 1, missPenalty: 4, hintCost: 12, hintsPerRound: 2 },
    hard: { baseTime: 50, minTime: 22, diffStart: 6, diffStep: 3, hitRadiusMult: 0.82, missPenalty: 6, hintCost: 16, hintsPerRound: 1 },
};

// One theme is picked per round to paint the sky/ground behind the objects.
const SCENE_THEMES = [
    { id: 'meadow', name: 'Sunny Meadow', icon: '🌼', sky: ['#8ec9f0', '#d8f3ff'], ground: '#7bbf6a', groundLine: '#5a9c4a' },
    { id: 'dusk', name: 'Dusky Orchard', icon: '🌇', sky: ['#f6a56b', '#5b3a86'], ground: '#4a3a5c', groundLine: '#332748' },
    { id: 'night', name: 'Starlit Garden', icon: '🌙', sky: ['#101c3d', '#1f3866'], ground: '#16233f', groundLine: '#0d1730' },
    { id: 'desert', name: 'Dune Oasis', icon: '🏜️', sky: ['#ffd68a', '#ffb3a0'], ground: '#e0b876', groundLine: '#c99a55' },
    { id: 'candy', name: 'Candy Grove', icon: '🍬', sky: ['#ffd1ee', '#fff0f8'], ground: '#f7a8c4', groundLine: '#e084ab' },
    { id: 'deep', name: 'Underwater Reef', icon: '🌊', sky: ['#0b4f6c', '#1c7ea8'], ground: '#0a3a52', groundLine: '#062938' },
];

// Every object is drawn procedurally by shapes.js, keyed by id. `palette`
// restricts recolors to hues that still read as intentional on that object.
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
];

// Difference archetypes. `label` is used in the log/status when one is found.
const DIFF_TYPES = {
    recolor: { id: 'recolor', label: 'a colour swap' },
    resize: { id: 'resize', label: 'a size change' },
    move: { id: 'move', label: 'a shifted object' },
    add: { id: 'add', label: 'an extra object' },
    remove: { id: 'remove', label: 'a missing object' },
};

// The pool differences are drawn from, in rotation, so early diffs in a
// round aren't accidentally all the same archetype.
const DIFF_KIND_CYCLE = ['recolor', 'move', 'resize', 'remove', 'add', 'recolor', 'move', 'resize'];
