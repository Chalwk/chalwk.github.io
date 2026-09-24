// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// --- Game state --------------------------------------------------------------
// These are module-level so almost every function can read/tweak them.
const MAX_FLOOR = 10;
let sizeKey = sizeSelect.value;
let difficultyKey = difficultySelect.value;
let gridW = 0, gridH = 0;
let grid = [];              // TILE values
let discovered = [];        // tiles the player has ever seen (persists per floor)
let visible = [];           // tiles currently in line of sight
let rooms = [];
let secretRoom = null;
let enemies = [];
let items = [];
let player = null;
let floor = 1;
let floorTheme = FLOOR_THEMES[0];
let gameActive = false;
let gameOver = false;
let choicePending = false;  // true while a modal is open - blocks input
let choiceIndex = 0;        // index of the currently highlighted choice card
let killCount = 0;
let boss = null;
let audioCtx = null;
let soundMuted = false;
try {
    soundMuted = localStorage.getItem('dungeon-sound-muted') === 'true';
} catch (e) { /* ignore */ }