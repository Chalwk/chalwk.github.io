// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

const boardEl = document.getElementById('board');
const questionListEl = document.getElementById('question-list');
const statusEl = document.getElementById('status');
const questionCountEl = document.getElementById('question-count');
const guessesLeftEl = document.getElementById('guesses-left');
const resetBtn = document.getElementById('reset');
const revealBtn = document.getElementById('reveal');
const playAgainBtn = document.getElementById('play-again');
const soundToggleBtn = document.getElementById('sound-toggle');
const soundIcon = document.getElementById('sound-icon');
const gameOverOverlay = document.getElementById('game-over-overlay');
const gameOverMessageEl = document.getElementById('game-over-message');
const gameOverScoreEl = document.getElementById('game-over-score');
const confirmOverlay = document.getElementById('confirm-overlay');
const confirmMessageEl = document.getElementById('confirm-message');
const confirmYesBtn = document.getElementById('confirm-yes');
const confirmNoBtn = document.getElementById('confirm-no');
const guessesSelect = document.getElementById('guesses');
const assistSelect = document.getElementById('assist');
const confettiCanvas = document.getElementById('confetti');
const chatLogEl = document.getElementById('chat-log');
const selectionOverlay = document.getElementById('selection-overlay');
const selectionOkBtn = document.getElementById('selection-ok');
const aiQuestionOverlay = document.getElementById('ai-question-overlay');
const aiQuestionText = document.getElementById('ai-question-text');
const aiAnswerYes = document.getElementById('ai-answer-yes');
const aiAnswerNo = document.getElementById('ai-answer-no');
const playerCharacterEl = document.getElementById('player-character');
const playerCharacterFaceEl = document.getElementById('player-character-face');
const gameContainerEl = document.getElementById('game-container');
const turnBarEl = document.getElementById('turn-bar');
const turnBarTextEl = document.getElementById('turn-bar-text');
const continueBtn = document.getElementById('continue-btn');

// Constants
const COLS = 6;
const ROWS = 4;
const TOTAL = COLS * ROWS; // 24
const SOUND_KEY = 'guesswho.sound';

// Character traits
// Order is left-to-right, top-to-bottom
const BOARDS = {
    'faces1.png': [
        // Row 1
        { name: 'Alex', gender: 'male', hairColor: 'brown', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Maria', gender: 'female', hairColor: 'blonde', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
        { name: 'Bernard', gender: 'male', hairColor: 'gray', hairLength: 'short', bald: false, facialHair: 'mustache', glasses: true, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Anita', gender: 'female', hairColor: 'black', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: true, eyeColor: 'brown', skinTone: 'dark', freckles: false, bigNose: false, earrings: true },
        { name: 'Eric', gender: 'male', hairColor: 'red', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'green', skinTone: 'light', freckles: true, bigNose: false, earrings: false },
        { name: 'Claire', gender: 'female', hairColor: 'black', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
        // Row 2
        { name: 'Bill', gender: 'male', hairColor: 'brown', hairLength: 'short', bald: false, facialHair: 'beard', glasses: false, hat: true, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Susan', gender: 'female', hairColor: 'red', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'green', skinTone: 'light', freckles: true, bigNose: false, earrings: true },
        { name: 'George', gender: 'male', hairColor: null, hairLength: null, bald: true, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Anne', gender: 'female', hairColor: 'gray', hairLength: 'short', bald: false, facialHair: 'none', glasses: true, hat: false, headband: false, eyeColor: 'blue', skinTone: 'dark', freckles: false, bigNose: false, earrings: true },
        { name: 'Alfred', gender: 'male', hairColor: 'brown', hairLength: 'short', bald: false, facialHair: 'mustache', glasses: false, hat: true, headband: false, eyeColor: 'brown', skinTone: 'medium', freckles: false, bigNose: false, earrings: false },
        { name: 'Sophie', gender: 'female', hairColor: 'blonde', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: true, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: true, bigNose: false, earrings: false },
        // Row 3
        { name: 'Rachel', gender: 'female', hairColor: 'gray', hairLength: 'short', bald: false, facialHair: 'none', glasses: true, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
        { name: 'Charles', gender: 'male', hairColor: 'black', hairLength: 'short', bald: false, facialHair: 'none', glasses: true, hat: false, headband: false, eyeColor: 'brown', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'David', gender: 'male', hairColor: 'black', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'dark', freckles: false, bigNose: false, earrings: false },
        { name: 'Laura', gender: 'female', hairColor: 'brown', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'green', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
        { name: 'Max', gender: 'male', hairColor: 'blonde', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Emily', gender: 'female', hairColor: 'black', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: true, eyeColor: 'brown', skinTone: 'medium', freckles: false, bigNose: false, earrings: true },
        // Row 4
        { name: 'Herman', gender: 'male', hairColor: 'brown', hairLength: 'short', bald: false, facialHair: 'none', glasses: true, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Jane', gender: 'female', hairColor: 'red', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
        { name: 'Joe', gender: 'male', hairColor: 'gray', hairLength: 'short', bald: false, facialHair: 'beard', glasses: false, hat: true, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: true, earrings: false },
        { name: 'Grace', gender: 'female', hairColor: 'black', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'brown', skinTone: 'dark', freckles: false, bigNose: false, earrings: true },
        { name: 'Peter', gender: 'male', hairColor: null, hairLength: null, bald: true, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: true, earrings: false },
        { name: 'Julia', gender: 'female', hairColor: 'black', hairLength: 'long', bald: false, facialHair: 'none', glasses: true, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
    ],
    'faces2.png': [
        // Row 1
        { name: 'Tom', gender: 'male', hairColor: 'black', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Anita', gender: 'female', hairColor: 'red', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'green', skinTone: 'light', freckles: true, bigNose: false, earrings: false },
        { name: 'Phillip', gender: 'male', hairColor: null, hairLength: null, bald: true, facialHair: 'mustache', glasses: true, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Kate', gender: 'female', hairColor: 'blonde', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: true, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
        { name: 'Frans', gender: 'male', hairColor: 'black', hairLength: 'short', bald: false, facialHair: 'beard', glasses: false, hat: false, headband: false, eyeColor: 'brown', skinTone: 'medium', freckles: false, bigNose: false, earrings: false },
        { name: 'Maria', gender: 'female', hairColor: 'gray', hairLength: 'short', bald: false, facialHair: 'none', glasses: true, hat: true, headband: false, eyeColor: 'brown', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
        // Row 2
        { name: 'Robert', gender: 'male', hairColor: 'brown', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: true, headband: false, eyeColor: 'brown', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Sarah', gender: 'female', hairColor: 'black', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'brown', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
        { name: 'Sam', gender: 'male', hairColor: 'brown', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: true, bigNose: false, earrings: false },
        { name: 'Richard', gender: 'male', hairColor: 'brown', hairLength: 'short', bald: false, facialHair: 'mustache', glasses: false, hat: true, headband: false, eyeColor: 'brown', skinTone: 'medium', freckles: false, bigNose: false, earrings: false },
        { name: 'Olivia', gender: 'female', hairColor: 'red', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'green', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
        { name: 'Anne', gender: 'female', hairColor: 'black', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: true, eyeColor: 'brown', skinTone: 'dark', freckles: false, bigNose: false, earrings: true },
        // Row 3
        { name: 'Paul', gender: 'male', hairColor: 'gray', hairLength: 'short', bald: false, facialHair: 'beard', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Julia', gender: 'female', hairColor: 'brown', hairLength: 'long', bald: false, facialHair: 'none', glasses: true, hat: false, headband: false, eyeColor: 'blue', skinTone: 'medium', freckles: false, bigNose: false, earrings: true },
        { name: 'Peter', gender: 'male', hairColor: 'black', hairLength: 'short', bald: false, facialHair: 'none', glasses: true, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Emily', gender: 'female', hairColor: 'gray', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
        { name: 'Herman', gender: 'male', hairColor: 'red', hairLength: 'short', bald: false, facialHair: 'beard', glasses: false, hat: true, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Claire', gender: 'female', hairColor: 'black', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'brown', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
        // Row 4
        { name: 'Alex', gender: 'male', hairColor: 'brown', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: true, headband: false, eyeColor: 'brown', skinTone: 'light', freckles: false, bigNose: true, earrings: false },
        { name: 'Charles', gender: 'male', hairColor: 'black', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'brown', skinTone: 'dark', freckles: false, bigNose: false, earrings: false },
        { name: 'Laura', gender: 'female', hairColor: 'brown', hairLength: 'long', bald: false, facialHair: 'none', glasses: true, hat: false, headband: false, eyeColor: 'green', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
        { name: 'George', gender: 'male', hairColor: null, hairLength: null, bald: true, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Bernard', gender: 'male', hairColor: 'blonde', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Susan', gender: 'female', hairColor: 'black', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: true, eyeColor: 'brown', skinTone: 'medium', freckles: false, bigNose: false, earrings: true },
    ]
};

const QUESTION_DEFS = [
    { id: 'male', label: 'Is your character male?', test: c => c.gender === 'male' },
    { id: 'female', label: 'Is your character female?', test: c => c.gender === 'female' },
    { id: 'hair-black', label: 'Does your character have black hair?', test: c => c.hairColor === 'black' },
    { id: 'hair-brown', label: 'Does your character have brown hair?', test: c => c.hairColor === 'brown' },
    { id: 'hair-blonde', label: 'Does your character have blonde hair?', test: c => c.hairColor === 'blonde' },
    { id: 'hair-red', label: 'Does your character have red hair?', test: c => c.hairColor === 'red' },
    { id: 'hair-gray', label: 'Does your character have gray hair?', test: c => c.hairColor === 'gray' },
    { id: 'bald', label: 'Is your character bald?', test: c => c.bald === true },
    { id: 'long-hair', label: 'Does your character have long hair?', test: c => c.hairLength === 'long' },
    { id: 'short-hair', label: 'Does your character have short hair?', test: c => c.hairLength === 'short' },
    { id: 'mustache', label: 'Does your character have a mustache?', test: c => c.facialHair === 'mustache' },
    { id: 'beard', label: 'Does your character have a beard?', test: c => c.facialHair === 'beard' },
    { id: 'clean', label: 'Is your character clean-shaven?', test: c => c.facialHair === 'none' },
    { id: 'glasses', label: 'Does your character wear glasses?', test: c => c.glasses === true },
    { id: 'hat', label: 'Does your character wear a hat?', test: c => c.hat === true },
    { id: 'headband', label: 'Does your character wear a headband or bandana?', test: c => c.headband === true },
    { id: 'eyes-brown', label: 'Does your character have brown eyes?', test: c => c.eyeColor === 'brown' },
    { id: 'eyes-blue', label: 'Does your character have blue eyes?', test: c => c.eyeColor === 'blue' },
    { id: 'eyes-green', label: 'Does your character have green eyes?', test: c => c.eyeColor === 'green' },
    { id: 'skin-light', label: 'Does your character have light skin?', test: c => c.skinTone === 'light' },
    { id: 'skin-medium', label: 'Does your character have medium skin?', test: c => c.skinTone === 'medium' },
    { id: 'skin-dark', label: 'Does your character have dark skin?', test: c => c.skinTone === 'dark' },
    { id: 'freckles', label: 'Does your character have freckles?', test: c => c.freckles === true },
    { id: 'big-nose', label: 'Does your character have a big nose?', test: c => c.bigNose === true },
    { id: 'earrings', label: 'Does your character wear earrings?', test: c => c.earrings === true },
];

// Game state
let CHARACTERS = [];
let currentSheet = 'faces1.png';
let playerSecretIndex = -1;
let aiSecretIndex = -1;
let guessesLeft = 1;
let questionCount = 0;
let gameOver = false;
let autoFlip = false;
let pendingGuessIdx = -1;
let soundOn = true;
let guessedIndices = new Set();

// AI State
let aiCandidates = [];
let aiUsedQuestions = new Set();
let currentAiQuestionId = null;
let gamePhase = 'setup'; // 'setup', 'player-turn', 'ai-turn', 'game-over'
let aiTurnQueued = false;

// Sound engine
let audioCtx = null;

function getAudioCtx() {
    if (!audioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        try { audioCtx = new AC(); } catch (e) { return null; }
    }
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => { });
    return audioCtx;
}

function tone({ freq = 440, type = 'sine', duration = 0.15, gain = 0.15, delay = 0, sweepTo = null }) {
    if (!soundOn) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (sweepTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), t0 + duration);
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(amp).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.03);
}

const sfx = {
    flip() { tone({ freq: 420, type: 'triangle', duration: 0.08, gain: 0.10, sweepTo: 260 }); },
    answer(yes) { tone({ freq: yes ? 660 : 330, type: 'sine', duration: 0.22, gain: 0.14, sweepTo: yes ? 880 : 220 }); },
    wrong() { tone({ freq: 180, type: 'sawtooth', duration: 0.28, gain: 0.10 }); },
    win() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone({ freq: f, type: 'triangle', duration: 0.24, gain: 0.16, delay: i * 0.10 })); },
    lose() { [392, 329.63, 261.63].forEach((f, i) => tone({ freq: f, type: 'sawtooth', duration: 0.30, gain: 0.10, delay: i * 0.14 })); },
    toggle() { tone({ freq: 660, type: 'sine', duration: 0.08, gain: 0.10, sweepTo: 880 }); },
};

function loadSoundPref() {
    try { if (localStorage.getItem(SOUND_KEY) === '0') soundOn = false; } catch (e) { /* ignore */ }
    updateSoundIcon();
}

function updateSoundIcon() {
    soundIcon.textContent = soundOn ? '🔊' : '🔇';
    soundToggleBtn.classList.toggle('muted', !soundOn);
}

function toggleSound() {
    soundOn = !soundOn;
    try { localStorage.setItem(SOUND_KEY, soundOn ? '1' : '0'); } catch (e) { /* ignore */ }
    updateSoundIcon();
    if (soundOn) sfx.toggle();
}

function addChatMessage(text, sender) {
    const msg = document.createElement('div');
    msg.className = `chat-message ${sender}`;
    msg.textContent = text;
    chatLogEl.appendChild(msg);
    chatLogEl.scrollTop = chatLogEl.scrollHeight;
}

function charName(index) {
    const c = CHARACTERS[index];
    return c && c.name ? c.name : `#${index + 1}`;
}

let confirmOnYes = null;
let confirmOnNo = null;

function showConfirm(message, onYes, onNo) {
    confirmMessageEl.textContent = message;
    confirmOnYes = onYes || null;
    confirmOnNo = onNo || null;
    confirmOverlay.classList.add('show');
}

function hideConfirm() {
    confirmOverlay.classList.remove('show');
    confirmOnYes = null;
    confirmOnNo = null;
}

confirmYesBtn.addEventListener('click', () => {
    const cb = confirmOnYes;
    hideConfirm();
    if (cb) cb();
});

confirmNoBtn.addEventListener('click', () => {
    const cb = confirmOnNo;
    hideConfirm();
    if (cb) cb();
});

// Renders the player's chosen character into the right-hand side panel.
function updatePlayerChip() {
    if (playerSecretIndex >= 0 && CHARACTERS[playerSecretIndex]) {
        const c = CHARACTERS[playerSecretIndex];
        playerCharacterEl.textContent = `You: ${c.name}`;
        playerCharacterEl.classList.add('show');

        const col = playerSecretIndex % COLS;
        const row = Math.floor(playerSecretIndex / COLS);
        const posX = (col * 100) / (COLS - 1);
        const posY = (row * 100) / (ROWS - 1);

        playerCharacterFaceEl.style.backgroundImage = `url('${currentSheet}')`;
        playerCharacterFaceEl.style.backgroundPosition = `${posX}% ${posY}%`;
        playerCharacterFaceEl.classList.remove('empty');
        playerCharacterFaceEl.textContent = '';
    } else {
        playerCharacterEl.textContent = '';
        playerCharacterEl.classList.remove('show');
        playerCharacterFaceEl.style.backgroundImage = '';
        playerCharacterFaceEl.classList.add('empty');
        playerCharacterFaceEl.textContent = '?';
    }
    requestAnimationFrame(alignPlayerCard);
}

// Aligns the right-panel player card with row 2 of the character grid.
function alignPlayerCard() {
    const panel = document.querySelector('.player-card-panel');
    const faceWrap = document.querySelector('.player-card-face-wrap');
    const nameEl = playerCharacterEl;
    if (!panel || !faceWrap || !nameEl) return;

    // Only align in the three-column desktop layout.
    if (window.innerWidth <= 900) {
        panel.style.paddingTop = '';
        faceWrap.style.width = '';
        faceWrap.style.maxWidth = '';
        return;
    }

    const boardWrap = document.getElementById('board-wrap');
    const cards = boardEl.querySelectorAll('.gw-card');
    if (!boardWrap || cards.length <= COLS) {
        panel.style.paddingTop = '';
        return;
    }

    const row2Card = cards[COLS]; // first card of row 2
    const boardRect = boardWrap.getBoundingClientRect();
    const row2Rect = row2Card.getBoundingClientRect();

    // Match the preview face size to an actual board card.
    faceWrap.style.maxWidth = 'none';
    faceWrap.style.width = Math.round(row2Rect.width) + 'px';

    const cs = getComputedStyle(panel);
    const gap = parseFloat(cs.rowGap) || parseFloat(cs.gap) || 6;

    const offset = row2Rect.top - boardRect.top;
    const nameVisible = nameEl.classList.contains('show');
    const nameH = nameVisible ? nameEl.offsetHeight : 0;
    const pad = Math.max(0, offset - nameH - gap);
    panel.style.paddingTop = Math.round(pad) + 'px';
}

// Board rendering
function renderBoard() {
    boardEl.innerHTML = '';
    boardEl.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;

    CHARACTERS.forEach((char, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const posX = (col * 100) / (COLS - 1);
        const posY = (row * 100) / (ROWS - 1);

        const card = document.createElement('div');
        card.className = 'gw-card';
        card.dataset.index = i;
        card.setAttribute('role', 'button');

        const face = document.createElement('div');
        face.className = 'gw-face';
        face.style.backgroundImage = `url('${currentSheet}')`;
        face.style.backgroundPosition = `${posX}% ${posY}%`;

        const nameTag = document.createElement('div');
        nameTag.className = 'gw-name';
        nameTag.textContent = char.name;

        const flip = document.createElement('div');
        flip.className = 'gw-flip';
        flip.textContent = '?';

        const guessBtn = document.createElement('button');
        guessBtn.type = 'button';
        guessBtn.className = 'gw-guess';
        guessBtn.title = `Guess ${char.name}`;
        guessBtn.setAttribute('aria-label', `Guess ${char.name}`);
        guessBtn.textContent = '?';
        guessBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // During setup the guess button should behave like a card click
            // so the player can still pick their character from that corner.
            if (gamePhase === 'setup') {
                onCardClick(i);
                return;
            }
            requestGuess(i);
        });

        card.appendChild(face);
        card.appendChild(flip);
        card.appendChild(nameTag);
        card.appendChild(guessBtn);
        card.addEventListener('click', () => onCardClick(i));

        boardEl.appendChild(card);
    });
}

// Question panel
function renderQuestions() {
    questionListEl.innerHTML = '';

    QUESTION_DEFS.forEach((def) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'gw-question';
        btn.dataset.q = def.id;
        btn.textContent = def.label;
        btn.addEventListener('click', () => askQuestion(def));
        questionListEl.appendChild(btn);
    });
}

function faceUpCount() {
    return boardEl.querySelectorAll('.gw-card:not(.eliminated)').length;
}

function updateStatus() {
    if (gameOver) return;
    if (gamePhase === 'setup') {
        statusEl.textContent = 'Select your character to begin';
        return;
    }
    if (gamePhase === 'ai-turn') {
        statusEl.textContent = 'AI is thinking...';
        return;
    }

    const n = faceUpCount();

    if (aiTurnQueued) {
        if (autoFlip) {
            statusEl.textContent = n <= 1
                ? 'Ready to hand over.'
                : 'Auto-flip is on. Hand over when ready.';
        } else {
            statusEl.textContent = 'Flip any ruled-out faces, then hand over.';
        }
        return;
    }

    if (n === 1) statusEl.textContent = 'One character left - make your guess!';
    else if (n === 0) statusEl.textContent = 'All faces flipped - ask a question or restart';
    else statusEl.textContent = 'Your turn - ask a question or flip faces';
}

function flashStatus(text, cls, ms = 1300) {
    statusEl.textContent = text;
    statusEl.className = cls;
    setTimeout(() => {
        if (!gameOver) {
            statusEl.className = '';
            updateStatus();
        }
    }, ms);
}

// Queue / begin the AI turn on the player's signal
function queueAiTurn() {
    aiTurnQueued = true;
    turnBarEl.hidden = false;
    questionListEl.classList.add('is-locked');

    if (turnBarTextEl) {
        turnBarTextEl.textContent = autoFlip
            ? 'Auto-flip is on. Hand over when ready.'
            : 'Flip any ruled-out faces, then hand over.';
    }

    continueBtn.classList.remove('pulse');
    void continueBtn.offsetWidth; // force reflow so the animation restarts
    continueBtn.classList.add('pulse');

    updateStatus();
}

function beginAiTurn() {
    if (!aiTurnQueued || gameOver) return;
    aiTurnQueued = false;
    turnBarEl.hidden = true;
    questionListEl.classList.remove('is-locked');
    gamePhase = 'ai-turn';
    updateStatus();
    aiTurn(); // keeps its internal ~1.2s "thinking" beat before acting
}

// Card interaction
function onCardClick(index) {
    if (gameOver) return;

    if (gamePhase === 'setup') {
        // Player is selecting their character - any click inside the cell works
        playerSecretIndex = index;
        selectionOverlay.classList.remove('show');
        gameContainerEl.classList.remove('setup-mode');
        gamePhase = 'player-turn';
        statusEl.textContent = "Character selected! Your turn.";
        sfx.answer(true);
        updatePlayerChip();

        const ownCard = boardEl.querySelector(`[data-index="${index}"]`);
        if (ownCard) {
            ownCard.classList.add('eliminated');
            setTimeout(() => sfx.flip(), 220);
        }

        // AI selects a different character
        do {
            aiSecretIndex = Math.floor(Math.random() * TOTAL);
        } while (aiSecretIndex === playerSecretIndex);

        // AI always tracks its own candidates automatically (auto-flip).
        // Its own secret is excluded since the player's character can never match it.
        aiCandidates = Array.from({ length: TOTAL }, (_, i) => i).filter(i => i !== aiSecretIndex);
        return;
    }

    if (gamePhase !== 'player-turn') return;

    const card = boardEl.querySelector(`[data-index="${index}"]`);
    if (!card) return;

    if (card.classList.contains('eliminated')) {
        card.classList.remove('eliminated');
    } else {
        card.classList.add('eliminated');
    }
    sfx.flip();
    updateStatus();
}

// Player Asking a Question
function askQuestion(def) {
    if (gameOver || gamePhase !== 'player-turn' || aiTurnQueued) return;

    const secret = CHARACTERS[aiSecretIndex];
    const answer = def.test(secret);

    questionCount++;
    questionCountEl.textContent = questionCount;

    const chip = questionListEl.querySelector(`[data-q="${def.id}"]`);
    if (chip) chip.classList.add('used');

    if (autoFlip) {
        CHARACTERS.forEach((c, i) => {
            // Never auto-flip the player's own face - they know who they are.
            if (i === playerSecretIndex) return;
            if (def.test(c) !== answer) {
                const card = boardEl.querySelector(`[data-index="${i}"]`);
                if (card && !card.classList.contains('eliminated')) {
                    card.classList.add('eliminated');
                }
            }
        });
    }

    sfx.answer(answer);
    flashStatus(answer ? 'Yes!' : 'No!', answer ? 'win-message' : 'tie-message');
    addChatMessage(`YOU: "${def.label}" — ${answer ? 'Yes' : 'No'}`, 'player');

    queueAiTurn();

    if (autoFlip) {
        setTimeout(() => { if (aiTurnQueued && !gameOver) beginAiTurn(); }, 900);
    }
}

// Guessing
function requestGuess(index) {
    if (gameOver || gamePhase !== 'player-turn' || aiTurnQueued) return;
    if (guessesLeft <= 0) return;

    if (guessedIndices.has(index)) {
        flashStatus('Already guessed that one.', 'tie-message', 1000);
        return;
    }

    const card = boardEl.querySelector(`[data-index="${index}"]`);
    if (card && card.classList.contains('eliminated')) {
        flashStatus('That face is flipped.', 'tie-message', 1000);
        return;
    }

    pendingGuessIdx = index;
    showConfirm(`Guess ${charName(index)}?`, commitGuess, cancelGuess);
}

function cancelGuess() {
    pendingGuessIdx = -1;
    hideConfirm();
}

function commitGuess() {
    hideConfirm();
    if (pendingGuessIdx === -1 || gameOver) return;

    const idx = pendingGuessIdx;
    pendingGuessIdx = -1;
    guessedIndices.add(idx);

    const card = boardEl.querySelector(`[data-index="${idx}"]`);
    if (card) card.classList.add('guessed');

    if (idx === aiSecretIndex) {
        if (card) card.classList.add('correct');
        endGame('player-guessed-correct');
        return;
    }

    guessesLeft--;
    guessesLeftEl.textContent = guessesLeft;
    sfx.wrong();

    if (card) {
        card.classList.add('wrong-guess');
        setTimeout(() => card.classList.remove('wrong-guess'), 900);
    }

    if (guessesLeft <= 0) {
        endGame('player-out-of-guesses');
    } else {
        flashStatus('Wrong! Try again.', 'tie-message', 1500);
        addChatMessage(`You guessed ${charName(idx)}. Wrong!`, 'player');
    }
}

// AI Logic
function getBestQuestion(candidates, usedQs) {
    let bestQ = null;
    let minDiff = Infinity;
    const availableQs = QUESTION_DEFS.filter(q => !usedQs.has(q.id));
    if (availableQs.length === 0) return null;

    for (const q of availableQs) {
        let yes = 0;
        let no = 0;
        for (const idx of candidates) {
            if (q.test(CHARACTERS[idx])) yes++;
            else no++;
        }
        const diff = Math.abs(yes - no);
        if (diff < minDiff) {
            minDiff = diff;
            bestQ = q;
        }
    }
    return bestQ;
}

function aiTurn() {
    if (gameOver || gamePhase !== 'ai-turn') return;

    setTimeout(() => {
        // Re-check after the delay: the player may have given up or won.
        if (gameOver || gamePhase !== 'ai-turn') return;

        // Safety fallback: if candidates drop to 0, reset to all (excluding the AI's own secret)
        if (aiCandidates.length === 0) {
            aiCandidates = Array.from({ length: TOTAL }, (_, i) => i).filter(i => i !== aiSecretIndex);
        }

        if (aiCandidates.length === 1) {
            // AI is confident, make a guess
            const guessIdx = aiCandidates[0];
            aiGuess(guessIdx);
            return;
        }

        const q = getBestQuestion(aiCandidates, aiUsedQuestions);
        if (!q) {
            // No questions left, guess randomly from remaining candidates
            const guessIdx = aiCandidates[Math.floor(Math.random() * aiCandidates.length)];
            aiGuess(guessIdx);
            return;
        }

        aiUsedQuestions.add(q.id);
        currentAiQuestionId = q.id;
        aiQuestionText.textContent = q.label;
        aiQuestionOverlay.classList.add('show');
        addChatMessage(`AI asks: "${q.label}"`, 'ai');
    }, 1200);
}

function aiGuess(idx) {
    addChatMessage(`AI guesses: ${charName(idx)}`, 'ai');
    const card = boardEl.querySelector(`[data-index="${idx}"]`);
    if (card) card.classList.add('correct');

    if (idx === playerSecretIndex) {
        endGame('ai-guessed-correct'); // AI wins
    } else {
        endGame('ai-guessed-wrong');   // AI blundered - player wins
    }
}

// Handle Player answering AI's question
// The AI always narrows its own candidates automatically (auto-flip is always on for the AI).
aiAnswerYes.addEventListener('click', () => {
    if (gameOver) return;
    aiQuestionOverlay.classList.remove('show');
    const q = QUESTION_DEFS.find(def => def.id === currentAiQuestionId);
    if (q) {
        aiCandidates = aiCandidates.filter(idx => q.test(CHARACTERS[idx]));
        addChatMessage(`You answered: Yes`, 'player');
    }
    gamePhase = 'player-turn';
    updateStatus();
});

aiAnswerNo.addEventListener('click', () => {
    if (gameOver) return;
    aiQuestionOverlay.classList.remove('show');
    const q = QUESTION_DEFS.find(def => def.id === currentAiQuestionId);
    if (q) {
        aiCandidates = aiCandidates.filter(idx => !q.test(CHARACTERS[idx]));
        addChatMessage(`You answered: No`, 'player');
    }
    gamePhase = 'player-turn';
    updateStatus();
});

selectionOkBtn.addEventListener('click', () => {
    selectionOverlay.classList.remove('show');
});

continueBtn.addEventListener('click', beginAiTurn);

// End of game
// reason: 'player-guessed-correct' | 'ai-guessed-wrong'
//       | 'ai-guessed-correct'   | 'player-out-of-guesses' | 'player-gave-up'
function endGame(reason) {
    gameOver = true;
    gamePhase = 'game-over';

    aiTurnQueued = false;
    turnBarEl.hidden = true;
    questionListEl.classList.remove('is-locked');

    let message = '';
    let score = '';
    let palette = 2; // default red-ish

    switch (reason) {
        case 'player-guessed-correct':
            message = 'You win!';
            score = `Solved in ${questionCount} question${questionCount === 1 ? '' : 's'}`;
            statusEl.className = 'win-message';
            sfx.win();
            palette = 1;
            break;

        case 'ai-guessed-wrong':
            message = 'You win!';
            score = `The AI guessed wrong. Its character was ${charName(aiSecretIndex)}.`;
            statusEl.className = 'win-message';
            sfx.win();
            palette = 1;
            break;

        case 'ai-guessed-correct':
            message = 'AI wins!';
            score = `Your character was ${charName(playerSecretIndex)}. AI's was ${charName(aiSecretIndex)}.`;
            statusEl.className = 'tie-message';
            sfx.lose();
            palette = 2;
            break;

        case 'player-out-of-guesses':
            message = 'Out of guesses';
            score = `Your character was ${charName(playerSecretIndex)}. AI's was ${charName(aiSecretIndex)}.`;
            statusEl.className = 'tie-message';
            sfx.lose();
            palette = 2;
            break;

        case 'player-gave-up':
            message = 'You gave up';
            score = `AI's character was ${charName(aiSecretIndex)}.`;
            statusEl.className = 'tie-message';
            sfx.lose();
            palette = 2;
            break;

        default:
            message = 'Game over';
            score = '';
            statusEl.className = '';
            palette = 2;
    }

    statusEl.textContent = message;
    gameOverMessageEl.textContent = message;
    gameOverScoreEl.textContent = score;
    gameOverOverlay.classList.add('show');
    launchConfetti(palette);
}

function giveUp() {
    if (gameOver || gamePhase === 'setup') return;
    const card = boardEl.querySelector(`[data-index="${aiSecretIndex}"]`);
    if (card) card.classList.add('correct');
    endGame('player-gave-up');
}

// New game
function newGame() {
    // Randomly select a board
    const sheets = ['faces1.png', 'faces2.png'];
    currentSheet = sheets[Math.floor(Math.random() * sheets.length)];
    CHARACTERS = BOARDS[currentSheet];

    playerSecretIndex = -1;
    aiSecretIndex = -1;
    guessesLeft = Number(guessesSelect.value) || 1;
    questionCount = 0;
    gameOver = false;
    pendingGuessIdx = -1;
    autoFlip = assistSelect.value === 'on';
    guessedIndices = new Set();

    aiCandidates = [];
    aiUsedQuestions.clear();
    currentAiQuestionId = null;
    gamePhase = 'setup';

    aiTurnQueued = false;
    turnBarEl.hidden = true;
    questionListEl.classList.remove('is-locked');

    questionCountEl.textContent = questionCount;
    guessesLeftEl.textContent = guessesLeft;
    statusEl.className = '';
    statusEl.textContent = 'Select your character to begin';

    gameOverOverlay.classList.remove('show');
    confirmOverlay.classList.remove('show');
    aiQuestionOverlay.classList.remove('show');
    selectionOverlay.classList.add('show');

    // Dim everything in the container except the board during selection
    gameContainerEl.classList.add('setup-mode');

    chatLogEl.innerHTML = '';

    clearConfetti();
    renderBoard();
    renderQuestions();
    updatePlayerChip();
    updateStatus();

    requestAnimationFrame(alignPlayerCard);
}

// Confetti
let confettiParticles = [];
let confettiRaf = null;
let confettiW = 0;
let confettiH = 0;

function resizeConfettiCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    confettiW = window.innerWidth;
    confettiH = window.innerHeight;
    confettiCanvas.width = Math.floor(confettiW * dpr);
    confettiCanvas.height = Math.floor(confettiH * dpr);
    confettiCanvas.style.width = confettiW + 'px';
    confettiCanvas.style.height = confettiH + 'px';
    const ctx = confettiCanvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function launchConfetti(player) {
    const ctx = confettiCanvas.getContext('2d');
    if (!ctx) return;
    resizeConfettiCanvas();

    const palettes = {
        1: ['#60a5fa', '#93c5fd', '#dbeafe', '#ffffff', '#fbbf24'],
        2: ['#ef4444', '#f87171', '#fecaca', '#ffffff', '#fbbf24'],
    };
    const colors = palettes[player] || palettes[1];

    for (let i = 0; i < 150; i++) {
        confettiParticles.push({
            x: Math.random() * confettiW,
            y: -20 - Math.random() * confettiH * 0.5,
            vx: (Math.random() - 0.5) * 3.2,
            vy: 2 + Math.random() * 4.5,
            size: 5 + Math.random() * 7,
            rot: Math.random() * Math.PI * 2,
            vr: (Math.random() - 0.5) * 0.32,
            color: colors[Math.floor(Math.random() * colors.length)],
        });
    }
    if (!confettiRaf) confettiRaf = requestAnimationFrame(stepConfetti);
}

function stepConfetti() {
    const ctx = confettiCanvas.getContext('2d');
    if (!ctx) { confettiRaf = null; return; }
    ctx.clearRect(0, 0, confettiW, confettiH);

    for (let i = confettiParticles.length - 1; i >= 0; i--) {
        const p = confettiParticles[i];
        p.vy += 0.06;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;

        if (p.y > confettiH + 40) {
            confettiParticles.splice(i, 1);
            continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
    }

    if (confettiParticles.length) {
        confettiRaf = requestAnimationFrame(stepConfetti);
    } else {
        ctx.clearRect(0, 0, confettiW, confettiH);
        confettiRaf = null;
    }
}

function clearConfetti() {
    confettiParticles = [];
    const ctx = confettiCanvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, confettiW, confettiH);
}

// Events
resetBtn.addEventListener('click', () => {
    if (gamePhase === 'setup' || gameOver) {
        newGame();
        return;
    }
    showConfirm('Start a new game? The current match will be lost.', newGame);
});

playAgainBtn.addEventListener('click', newGame);

revealBtn.addEventListener('click', () => {
    if (gameOver || gamePhase === 'setup') return;
    showConfirm("Give up and reveal the AI's character?", giveUp);
});

soundToggleBtn.addEventListener('click', toggleSound);

// Settings: wrong-guesses restarts the match, so confirm mid-game.
guessesSelect.addEventListener('change', () => {
    const apply = () => {
        guessesLeft = Number(guessesSelect.value) || 1;
        guessesLeftEl.textContent = guessesLeft;
    };

    if (gamePhase === 'setup' || gameOver) {
        apply();
        return;
    }

    const previous = String(guessesLeft);
    showConfirm(
        'Changing wrong guesses will restart the match. Continue?',
        () => { apply(); newGame(); },
        () => { guessesSelect.value = previous; }
    );
});

assistSelect.addEventListener('change', () => {
    autoFlip = assistSelect.value === 'on';
    // Keep the turn-bar copy in sync if it's currently visible.
    if (turnBarTextEl && !turnBarEl.hidden) {
        turnBarTextEl.textContent = autoFlip
            ? 'Auto-flip is on. Hand over when ready.'
            : 'Flip any ruled-out faces, then hand over.';
    }
});

window.addEventListener('resize', () => {
    if (confettiParticles.length) resizeConfettiCanvas();
    alignPlayerCard();
});

// Boot
loadSoundPref();
resizeConfettiCanvas();
newGame();