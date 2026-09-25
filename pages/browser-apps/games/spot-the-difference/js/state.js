// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// --- Game state --------------------------------------------------------------
let sizeKey = sizeSelect.value;
let difficultyKey = difficultySelect.value;

let round = 1;
let score = 0;
let combo = 0;
let bestCombo = 0;
let bestScore = 0;

let scene = null;
let foundCount = 0;
let hintsLeft = 0;
let timeLeft = 0;
let roundTimeTotal = 1;
let carryTime = 0;
let timerId = null;
let roundTimeoutId = null;

let gameActive = false;
let gameOver = false;

let audioCtx = null;
let soundMuted = false;

try {
    soundMuted = localStorage.getItem('spotdiff-sound-muted') === 'true';
} catch (e) { /* storage unavailable */ }
try {
    bestScore = Number(localStorage.getItem('spotdiff-best-score')) || 0;
} catch (e) { /* storage unavailable */ }