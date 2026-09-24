// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// --- DOM handles --------------------------------------------------------------
// Grabbing them all up front so render/update code stays tidy!
const boardEl = document.getElementById('dungeon-board');
const statusEl = document.getElementById('status');
const floorLabelEl = document.getElementById('floor-label');
const floorThemeEl = document.getElementById('floor-theme');
const hpFillEl = document.getElementById('hp-fill');
const hpTextEl = document.getElementById('hp-text');
const goldCountEl = document.getElementById('gold-count');
const weaponChip = document.getElementById('weapon-chip');
const weaponIconEl = document.getElementById('weapon-icon');
const weaponNameEl = document.getElementById('weapon-name');
const boonChip = document.getElementById('boon-chip');
const boonNameEl = document.getElementById('boon-name');
const roomChip = document.getElementById('room-chip');
const roomNameEl = document.getElementById('room-name');
const redKeyChip = document.getElementById('redkey-chip');
const redKeyDot = redKeyChip.querySelector('.key-dot');
const redKeyStatusEl = document.getElementById('redkey-status');
const goldKeyChip = document.getElementById('goldkey-chip');
const goldKeyDot = goldKeyChip.querySelector('.key-dot');
const goldKeyStatusEl = document.getElementById('goldkey-status');
const potionCountEl = document.getElementById('potion-count');
const logEl = document.getElementById('log');
const overlay = document.getElementById('game-over-overlay');
const overlayMessage = document.getElementById('game-over-message');
const overlayDetail = document.getElementById('game-over-detail');
const playAgainBtn = document.getElementById('play-again');
const resetBtn = document.getElementById('reset-btn');
const waitBtn = document.getElementById('wait-btn');
const potionBtn = document.getElementById('potion-btn');
const soundToggleBtn = document.getElementById('sound-toggle');
const sizeSelect = document.getElementById('dungeon-size');
const difficultySelect = document.getElementById('difficulty');
const choiceOverlay = document.getElementById('choice-overlay');
const choiceKickerEl = document.getElementById('choice-kicker');
const choiceTitleEl = document.getElementById('choice-title');
const choiceDescriptionEl = document.getElementById('choice-description');
const choiceOptionsEl = document.getElementById('choice-options');
const gamePanelEl = document.getElementById('game-panel');