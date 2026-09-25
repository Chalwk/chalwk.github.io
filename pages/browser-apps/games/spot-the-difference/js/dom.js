// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// --- DOM handles --------------------------------------------------------------
const scoreEl = document.getElementById('score-count');
const bestScoreEl = document.getElementById('best-score');
const roundLabelEl = document.getElementById('round-label');
const themeLabelEl = document.getElementById('theme-label');
const statusEl = document.getElementById('status');
const timeFillEl = document.getElementById('time-fill');
const timeTextEl = document.getElementById('time-text');
const foundChip = document.getElementById('found-chip');
const foundCountEl = document.getElementById('found-count');
const comboChip = document.getElementById('combo-chip');
const comboCountEl = document.getElementById('combo-count');
const hintsChip = document.getElementById('hints-chip');
const hintsCountEl = document.getElementById('hints-count');
const logEl = document.getElementById('log');

const sceneWrapEl = document.getElementById('scene-wrap');
const leftBoardEl = document.getElementById('scene-board-left');
const rightBoardEl = document.getElementById('scene-board-right');

const overlay = document.getElementById('game-over-overlay');
const overlayMessage = document.getElementById('game-over-message');
const overlayDetail = document.getElementById('game-over-detail');
const playAgainBtn = document.getElementById('play-again');
const resetBtn = document.getElementById('reset-btn');
const hintBtn = document.getElementById('hint-btn');
const soundToggleBtn = document.getElementById('sound-toggle');
const sizeSelect = document.getElementById('scene-size');
const difficultySelect = document.getElementById('difficulty');
const gamePanelEl = document.getElementById('game-panel');
