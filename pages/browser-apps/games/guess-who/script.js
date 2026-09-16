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
const recordEl = document.getElementById('record');
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
const gameContainerEl = document.getElementById('game-container');
const turnBarEl = document.getElementById('turn-bar');
const continueBtn = document.getElementById('continue-btn');

// Constants
const COLS = 6;
const ROWS = 4;
const TOTAL = COLS * ROWS; // 24
const STATS_KEY = 'guesswho.stats.v1';
const SOUND_KEY = 'guesswho.sound';

// Character traits
// Order is left-to-right, top-to-bottom
const BOARDS = {
    'faces1.png': [
        // Row 1
        { name: 'Alex', gender: 'male', hairColor: 'brown', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Maria', gender: 'female', hairColor: 'blonde', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
        { name: 'Bernard', gender: 'male', hairColor: 'gray', hairLength: 'short', bald: false, facialHair: 'mustache', glasses: true, hat: false, headband: false, eyeColor: 'brown', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Anita', gender: 'female', hairColor: 'black', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: true, eyeColor: 'brown', skinTone: 'dark', freckles: false, bigNose: false, earrings: true },
        { name: 'Eric', gender: 'male', hairColor: 'red', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'green', skinTone: 'light', freckles: true, bigNose: false, earrings: false },
        { name: 'Claire', gender: 'female', hairColor: 'black', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'brown', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
        // Row 2
        { name: 'Bill', gender: 'male', hairColor: 'brown', hairLength: 'short', bald: false, facialHair: 'beard', glasses: false, hat: true, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Susan', gender: 'female', hairColor: 'red', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'green', skinTone: 'light', freckles: true, bigNose: false, earrings: true },
        { name: 'George', gender: 'male', hairColor: null, hairLength: null, bald: true, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Anne', gender: 'female', hairColor: 'gray', hairLength: 'short', bald: false, facialHair: 'none', glasses: true, hat: false, headband: false, eyeColor: 'brown', skinTone: 'dark', freckles: false, bigNose: false, earrings: true },
        { name: 'Alfred', gender: 'male', hairColor: 'brown', hairLength: 'short', bald: false, facialHair: 'mustache', glasses: false, hat: true, headband: false, eyeColor: 'brown', skinTone: 'medium', freckles: false, bigNose: false, earrings: false },
        { name: 'Sophie', gender: 'female', hairColor: 'blonde', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: true, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: true, bigNose: false, earrings: false },
        // Row 3
        { name: 'Rachel', gender: 'female', hairColor: 'gray', hairLength: 'short', bald: false, facialHair: 'none', glasses: true, hat: false, headband: false, eyeColor: 'brown', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
        { name: 'Charles', gender: 'male', hairColor: 'black', hairLength: 'short', bald: false, facialHair: 'none', glasses: true, hat: false, headband: false, eyeColor: 'brown', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'David', gender: 'male', hairColor: 'black', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'brown', skinTone: 'dark', freckles: false, bigNose: false, earrings: false },
        { name: 'Laura', gender: 'female', hairColor: 'brown', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'green', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
        { name: 'Max', gender: 'male', hairColor: 'blonde', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Emily', gender: 'female', hairColor: 'black', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: true, eyeColor: 'brown', skinTone: 'dark', freckles: false, bigNose: false, earrings: true },
        // Row 4
        { name: 'Herman', gender: 'male', hairColor: 'brown', hairLength: 'short', bald: false, facialHair: 'none', glasses: true, hat: false, headband: false, eyeColor: 'brown', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Jane', gender: 'female', hairColor: 'red', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Joe', gender: 'male', hairColor: 'gray', hairLength: 'short', bald: false, facialHair: 'beard', glasses: false, hat: true, headband: false, eyeColor: 'brown', skinTone: 'light', freckles: false, bigNose: true, earrings: false },
        { name: 'Grace', gender: 'female', hairColor: 'black', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'brown', skinTone: 'dark', freckles: false, bigNose: false, earrings: true },
        { name: 'Peter', gender: 'male', hairColor: 'brown', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: true, earrings: false },
        { name: 'Julia', gender: 'female', hairColor: 'black', hairLength: 'long', bald: false, facialHair: 'none', glasses: true, hat: false, headband: false, eyeColor: 'brown', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
    ],
    'faces2.png': [
        // Row 1
        { name: 'Tom', gender: 'male', hairColor: 'black', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Anita', gender: 'female', hairColor: 'red', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'green', skinTone: 'light', freckles: true, bigNose: false, earrings: false },
        { name: 'Phillip', gender: 'male', hairColor: 'gray', hairLength: 'short', bald: false, facialHair: 'mustache', glasses: true, hat: false, headband: false, eyeColor: 'brown', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Kate', gender: 'female', hairColor: 'blonde', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: true, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
        { name: 'Frans', gender: 'male', hairColor: 'black', hairLength: 'short', bald: false, facialHair: 'beard', glasses: false, hat: false, headband: false, eyeColor: 'brown', skinTone: 'dark', freckles: false, bigNose: false, earrings: false },
        { name: 'Maria', gender: 'female', hairColor: 'gray', hairLength: 'short', bald: false, facialHair: 'none', glasses: true, hat: true, headband: false, eyeColor: 'brown', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
        // Row 2
        { name: 'Robert', gender: 'male', hairColor: 'brown', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: true, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: true, bigNose: false, earrings: false },
        { name: 'Sarah', gender: 'female', hairColor: 'black', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'brown', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
        { name: 'Sam', gender: 'male', hairColor: 'brown', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: true, bigNose: false, earrings: false },
        { name: 'Richard', gender: 'male', hairColor: 'brown', hairLength: 'short', bald: false, facialHair: 'mustache', glasses: false, hat: true, headband: false, eyeColor: 'brown', skinTone: 'medium', freckles: false, bigNose: false, earrings: false },
        { name: 'Olivia', gender: 'female', hairColor: 'red', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'green', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
        { name: 'Anne', gender: 'female', hairColor: 'black', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: true, eyeColor: 'brown', skinTone: 'dark', freckles: false, bigNose: false, earrings: true },
        // Row 3
        { name: 'Paul', gender: 'male', hairColor: 'gray', hairLength: 'short', bald: false, facialHair: 'beard', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Julia', gender: 'female', hairColor: 'brown', hairLength: 'long', bald: false, facialHair: 'none', glasses: true, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Peter', gender: 'male', hairColor: 'black', hairLength: 'short', bald: false, facialHair: 'none', glasses: true, hat: false, headband: false, eyeColor: 'brown', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Emily', gender: 'female', hairColor: 'gray', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
        { name: 'Herman', gender: 'male', hairColor: 'red', hairLength: 'short', bald: false, facialHair: 'beard', glasses: false, hat: true, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Claire', gender: 'female', hairColor: 'black', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'brown', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
        // Row 4
        { name: 'Alex', gender: 'male', hairColor: 'brown', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: true, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: true, earrings: false },
        { name: 'Charles', gender: 'male', hairColor: 'black', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'brown', skinTone: 'dark', freckles: false, bigNose: false, earrings: false },
        { name: 'Laura', gender: 'female', hairColor: 'brown', hairLength: 'long', bald: false, facialHair: 'none', glasses: true, hat: false, headband: false, eyeColor: 'brown', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
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
let stats = { wins: 0, losses: 0, games: 0 };

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

function loadStats() {
    try {
        const raw = localStorage.getItem(STATS_KEY);
        if (!raw) return;
        const p = JSON.parse(raw);
        if (p && typeof p === 'object') {
            stats.wins = Number(p.wins) || 0;
            stats.losses = Number(p.losses) || 0;
            stats.games = Number(p.games) || 0;
        }
    } catch (e) { /* ignore */ }
}

function saveStats() {
    try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch (e) { /* ignore */ }
}

function renderRecord() {
    recordEl.textContent = `All-time - Won ${stats.wins} · Lost ${stats.losses} · Played ${stats.games}`;
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

function updatePlayerChip() {
    if (playerSecretIndex >= 0 && CHARACTERS[playerSecretIndex]) {
        playerCharacterEl.textContent = `You: ${CHARACTERS[playerSecretIndex].name}`;
        playerCharacterEl.classList.add('show');
    } else {
        playerCharacterEl.textContent = '';
        playerCharacterEl.classList.remove('show');
    }
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
        card.setAttribute('tabindex', '0');

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
        statusEl.textContent = n === 1
            ? 'One face left - flip it or guess!'
            : `${n} characters face up`;
        return;
    }

    if (n === 1) statusEl.textContent = 'One character left - make your guess!';
    else if (n === 0) statusEl.textContent = 'All faces flipped - ask a question or restart';
    else statusEl.textContent = `${n} characters face up`;
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

        // AI selects a different character
        do {
            aiSecretIndex = Math.floor(Math.random() * TOTAL);
        } while (aiSecretIndex === playerSecretIndex);

        // AI always tracks its own candidates automatically (auto-flip).
        aiCandidates = Array.from({ length: TOTAL }, (_, i) => i);
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
    addChatMessage(`You asked: "${def.label}" - ${answer ? 'Yes' : 'No'}`, 'player');

    queueAiTurn();

    if (autoFlip) {
        setTimeout(() => { if (aiTurnQueued && !gameOver) beginAiTurn(); }, 900);
    }
}

// Guessing
function requestGuess(index) {
    if (gameOver || gamePhase !== 'player-turn') return;
    if (guessesLeft <= 0) return;

    pendingGuessIdx = index;
    confirmMessageEl.textContent = `Guess ${charName(index)}?`;
    confirmOverlay.classList.add('show');
}

function cancelGuess() {
    pendingGuessIdx = -1;
    confirmOverlay.classList.remove('show');
}

function commitGuess() {
    confirmOverlay.classList.remove('show');
    if (pendingGuessIdx === -1 || gameOver) return;

    const idx = pendingGuessIdx;
    pendingGuessIdx = -1;

    const card = boardEl.querySelector(`[data-index="${idx}"]`);

    if (idx === aiSecretIndex) {
        if (card) card.classList.add('correct');
        endGame(true);
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
        endGame(false);
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
        // Safety fallback: if candidates drop to 0, reset to all
        if (aiCandidates.length === 0) {
            aiCandidates = Array.from({ length: TOTAL }, (_, i) => i);
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
        endGame(false, true); // AI wins
    } else {
        // AI guessed wrong, player wins
        endGame(true);
    }
}

// Handle Player answering AI's question
// The AI always narrows its own candidates automatically (auto-flip is always on for the AI).
aiAnswerYes.addEventListener('click', () => {
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
function endGame(playerWon, aiWon = false) {
    gameOver = true;
    gamePhase = 'game-over';

    aiTurnQueued = false;
    turnBarEl.hidden = true;
    questionListEl.classList.remove('is-locked');

    stats.games++;
    if (playerWon) stats.wins++; else stats.losses++;
    saveStats();
    renderRecord();

    let message;
    if (playerWon) {
        message = 'You win!';
        statusEl.className = 'win-message';
        sfx.win();
        launchConfetti(1);
    } else if (aiWon) {
        message = 'AI wins!';
        statusEl.className = 'tie-message';
        sfx.lose();
        launchConfetti(2);
    } else {
        message = 'Out of guesses';
        statusEl.className = 'tie-message';
        sfx.lose();
        launchConfetti(2);
    }
    statusEl.textContent = message;

    gameOverMessageEl.textContent = message;
    if (playerWon) {
        gameOverScoreEl.textContent = `Solved in ${questionCount} question${questionCount === 1 ? '' : 's'}`;
    } else {
        gameOverScoreEl.textContent = `Your character was ${charName(playerSecretIndex)}. AI's was ${charName(aiSecretIndex)}.`;
    }
    gameOverOverlay.classList.add('show');
}

function giveUp() {
    if (gameOver || gamePhase === 'setup') return;
    const card = boardEl.querySelector(`[data-index="${aiSecretIndex}"]`);
    if (card) card.classList.add('correct');
    endGame(false, false);
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

    updatePlayerChip();

    clearConfetti();
    renderBoard();
    renderQuestions();
    updateStatus();
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

// Keyboard shortcuts
function onKeyDown(e) {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

    if (e.key === ' ' || e.key === 'Enter') {
        const active = document.activeElement;
        if (active && (active.tagName === 'BUTTON' || active.tagName === 'A')) return;
        if (aiTurnQueued) {
            e.preventDefault();
            beginAiTurn();
        }
        return;
    }

    switch (e.key) {
        case 'r': case 'R': newGame(); break;
        case 'm': case 'M': toggleSound(); break;
        case 'Escape':
            if (confirmOverlay.classList.contains('show')) cancelGuess();
            break;
    }
}

// Events
resetBtn.addEventListener('click', newGame);
playAgainBtn.addEventListener('click', newGame);
revealBtn.addEventListener('click', giveUp);
soundToggleBtn.addEventListener('click', toggleSound);
confirmYesBtn.addEventListener('click', commitGuess);
confirmNoBtn.addEventListener('click', cancelGuess);
guessesSelect.addEventListener('change', newGame);
assistSelect.addEventListener('change', () => { autoFlip = assistSelect.value === 'on'; });
document.addEventListener('keydown', onKeyDown);

window.addEventListener('resize', () => {
    if (confettiParticles.length) resizeConfettiCanvas();
});

// Boot
loadStats();
loadSoundPref();
renderRecord();
newGame();