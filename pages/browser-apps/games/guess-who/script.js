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

// Constants
const SHEET = 'faces.png'; // single sprite-sheet asset
const COLS = 6;
const ROWS = 4;
const TOTAL = COLS * ROWS; // 24
const STATS_KEY = 'guesswho.stats.v1';
const SOUND_KEY = 'guesswho.sound';

// Character traits
// Order is left-to-right, top-to-bottom
// (character #1 = top-left 256×256 cell, #24 = bottom-right).
//
// Allowed values (so the auto-generated questions stay valid):
//   gender:     'male' | 'female'
//   hairColor:  'black' | 'brown' | 'blonde' | 'red' | 'gray' | null (bald)
//   hairLength: 'short' | 'long' | null (bald)
//   bald:       true | false
//   facialHair: 'none' | 'mustache' | 'beard'
//   glasses:    true | false
//   hat:        true | false
//   headband:   true | false   (headband, bandana, headscarf)
//   eyeColor:   'brown' | 'blue' | 'green'
//   skinTone:   'light' | 'medium' | 'dark'
//   freckles:   true | false
//   bigNose:    true | false
//   earrings:   true | false

const CHARACTERS = [
    // Row 1
    // 1: brown short hair, blue eyes, light skin, blue shirt
    { gender: 'male', hairColor: 'brown', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
    // 2: blonde wavy long hair, pearl earrings, purple top
    { gender: 'female', hairColor: 'blonde', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
    // 3: older man, white/gray hair, round glasses, white mustache
    { gender: 'male', hairColor: 'gray', hairLength: 'short', bald: false, facialHair: 'mustache', glasses: true, hat: false, headband: false, eyeColor: 'brown', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
    // 4: dark skin, black curly hair, pink headband, gold hoops
    { gender: 'female', hairColor: 'black', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: true, eyeColor: 'brown', skinTone: 'dark', freckles: false, bigNose: false, earrings: true },
    // 5: young male, orange/red short hair, green eyes, freckles
    { gender: 'male', hairColor: 'red', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'green', skinTone: 'light', freckles: true, bigNose: false, earrings: false },
    // 6: long straight black hair with bangs, pearl earrings, purple top
    { gender: 'female', hairColor: 'black', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'brown', skinTone: 'light', freckles: false, bigNose: false, earrings: true },

    // Row 2
    // 7: blue beanie, dark beard, blue eyes
    { gender: 'male', hairColor: 'brown', hairLength: 'short', bald: false, facialHair: 'beard', glasses: false, hat: true, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
    // 8: curly red hair, green eyes, freckles, gold earrings
    { gender: 'female', hairColor: 'red', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'green', skinTone: 'light', freckles: true, bigNose: false, earrings: true },
    // 9: bald man, blue eyes, no facial hair
    { gender: 'male', hairColor: null, hairLength: null, bald: true, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
    // 10: older woman, gray hair in updo, purple glasses, dark skin, pearls
    { gender: 'female', hairColor: 'gray', hairLength: 'short', bald: false, facialHair: 'none', glasses: true, hat: false, headband: false, eyeColor: 'brown', skinTone: 'dark', freckles: false, bigNose: false, earrings: true },
    // 11: brown cowboy hat, mustache, medium skin
    { gender: 'male', hairColor: 'brown', hairLength: 'short', bald: false, facialHair: 'mustache', glasses: false, hat: true, headband: false, eyeColor: 'brown', skinTone: 'medium', freckles: false, bigNose: false, earrings: false },
    // 12: blue baseball cap, blonde hair, freckles
    { gender: 'female', hairColor: 'blonde', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: true, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: true, bigNose: false, earrings: false },

    // Row 3
    // 13: older woman, short white/gray curly hair, red glasses, pearls
    { gender: 'female', hairColor: 'gray', hairLength: 'short', bald: false, facialHair: 'none', glasses: true, hat: false, headband: false, eyeColor: 'brown', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
    // 14: black short hair, black-framed glasses, light skin
    { gender: 'male', hairColor: 'black', hairLength: 'short', bald: false, facialHair: 'none', glasses: true, hat: false, headband: false, eyeColor: 'brown', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
    // 15: dark skin, short black curly hair, brown eyes
    { gender: 'male', hairColor: 'black', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'brown', skinTone: 'dark', freckles: false, bigNose: false, earrings: false },
    // 16: long straight brown hair, green eyes, gold hoops
    { gender: 'female', hairColor: 'brown', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'green', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
    // 17: blonde short hair, blue eyes, rosy cheeks
    { gender: 'male', hairColor: 'blonde', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
    // 18: red polka-dot bandana, dark curly hair, dark skin, gold hoops
    { gender: 'female', hairColor: 'black', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: true, eyeColor: 'brown', skinTone: 'dark', freckles: false, bigNose: false, earrings: true },

    // Row 4
    // 19: curly brown hair, round glasses, purple sweater
    { gender: 'male', hairColor: 'brown', hairLength: 'short', bald: false, facialHair: 'none', glasses: true, hat: false, headband: false, eyeColor: 'brown', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
    // 20: long red/orange braided hair, blue eyes, green top
    { gender: 'female', hairColor: 'red', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
    // 21: green bucket hat, white/gray beard, prominent nose
    { gender: 'male', hairColor: 'gray', hairLength: 'short', bald: false, facialHair: 'beard', glasses: false, hat: true, headband: false, eyeColor: 'brown', skinTone: 'light', freckles: false, bigNose: true, earrings: false },
    // 22: dark curly hair, dark skin, gold hoops (no headwear)
    { gender: 'female', hairColor: 'black', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'brown', skinTone: 'dark', freckles: false, bigNose: false, earrings: true },
    // 23: older man, balding on top, brown side hair, big nose, blue eyes
    { gender: 'male', hairColor: 'brown', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: true, earrings: false },
    // 24: long straight black hair, blue-framed glasses, red top
    { gender: 'female', hairColor: 'black', hairLength: 'long', bald: false, facialHair: 'none', glasses: true, hat: false, headband: false, eyeColor: 'brown', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
];

// Question definitions (auto-generated from trait columns)
// Each entry tests one trait on a character object. Add, remove, or reword
// freely - the panel rebuilds itself from this list on every new game.

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
let secretIndex = -1;
let guessesLeft = 3;
let questionCount = 0;
let gameOver = false;
let autoFlip = true;
let pendingGuessIdx = -1;
let soundOn = true;
let stats = { wins: 0, losses: 0, games: 0 };

// Sound engine (Web Audio - all synthesised)
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
    recordEl.textContent =
        `All-time - Won ${stats.wins} · Lost ${stats.losses} · Played ${stats.games}`;
}

// Board rendering
// Each card's face is a CSS background positioned via percentage offsets
// against the 6×4 sprite sheet (background-size: 600% 400%).
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

        const face = document.createElement('div');
        face.className = 'gw-face';
        face.style.backgroundImage = `url('${SHEET}')`;
        face.style.backgroundPosition = `${posX}% ${posY}%`;

        const flip = document.createElement('div');
        flip.className = 'gw-flip';
        flip.textContent = '?';

        const guessBtn = document.createElement('button');
        guessBtn.type = 'button';
        guessBtn.className = 'gw-guess';
        guessBtn.title = `Guess character #${i + 1}`;
        guessBtn.setAttribute('aria-label', `Guess character ${i + 1}`);
        guessBtn.textContent = '?';
        guessBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            requestGuess(i);
        });

        card.appendChild(face);
        card.appendChild(flip);
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

// Status helpers
function faceUpCount() {
    return boardEl.querySelectorAll('.gw-card:not(.eliminated)').length;
}

function updateStatus() {
    if (gameOver) return;
    const n = faceUpCount();
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

// Card interaction
function onCardClick(index) {
    if (gameOver) return;
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

// Asking a question
function askQuestion(def) {
    if (gameOver) return;

    const secret = CHARACTERS[secretIndex];
    const answer = def.test(secret); // true or false

    questionCount++;
    questionCountEl.textContent = questionCount;

    // Mark the chip as used
    const chip = questionListEl.querySelector(`[data-q="${def.id}"]`);
    if (chip) chip.classList.add('used');

    // Auto-eliminate every character that disagrees with the answer.
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
}

// Guessing
function requestGuess(index) {
    if (gameOver) return;
    if (guessesLeft <= 0) return;

    pendingGuessIdx = index;
    confirmMessageEl.textContent = `Guess character #${index + 1}?`;
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

    if (idx === secretIndex) {
        if (card) card.classList.add('correct');
        endGame(true);
        return;
    }

    // Wrong guess
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
    }
}

// End of game
function endGame(won, revealed = false) {
    gameOver = true;
    stats.games++;
    if (won) stats.wins++; else stats.losses++;
    saveStats();
    renderRecord();

    let message;
    if (won) {
        message = 'You win!';
        statusEl.className = 'win-message';
        sfx.win();
        launchConfetti(1);
    } else if (revealed) {
        message = 'Gave up';
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
    gameOverScoreEl.textContent = won
        ? `Solved in ${questionCount} question${questionCount === 1 ? '' : 's'}`
        : `The secret character was #${secretIndex + 1}`;
    gameOverOverlay.classList.add('show');
}

function giveUp() {
    if (gameOver) return;
    const card = boardEl.querySelector(`[data-index="${secretIndex}"]`);
    if (card) card.classList.add('correct');
    endGame(false, true);
}

// New game
function newGame() {
    secretIndex = Math.floor(Math.random() * TOTAL);
    guessesLeft = Number(guessesSelect.value) || 3;
    questionCount = 0;
    gameOver = false;
    pendingGuessIdx = -1;
    autoFlip = assistSelect.value === 'on';

    questionCountEl.textContent = questionCount;
    guessesLeftEl.textContent = guessesLeft;
    statusEl.className = '';

    gameOverOverlay.classList.remove('show');
    confirmOverlay.classList.remove('show');

    clearConfetti();
    renderBoard();
    renderQuestions();
    updateStatus();
}

// Confetti (reused pattern from the Forsight game)
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

    switch (e.key) {
        case 'r':
        case 'R':
            newGame();
            break;
        case 'm':
        case 'M':
            toggleSound();
            break;
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

assistSelect.addEventListener('change', () => {
    autoFlip = assistSelect.value === 'on';
});

document.addEventListener('keydown', onKeyDown);

window.addEventListener('resize', () => {
    if (confettiParticles.length) resizeConfettiCanvas();
});

// Boot
loadStats();
loadSoundPref();
renderRecord();
newGame();