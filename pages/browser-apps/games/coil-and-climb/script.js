// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

const svg = document.getElementById('game-board');
const statusEl = document.getElementById('status');
const score1El = document.getElementById('score-1');
const score2El = document.getElementById('score-2');
const player2LabelEl = document.getElementById('player-2-label');
const resetBtn = document.getElementById('reset');
const playAgainBtn = document.getElementById('play-again');
const pvpBtn = document.getElementById('pvp');
const pvaiBtn = document.getElementById('pvai');
const boardSizeSelect = document.getElementById('board-size');
const difficultySelect = document.getElementById('difficulty');
const difficultyLabel = document.getElementById('difficulty-label');
const powersSelect = document.getElementById('powers');
const gameOverOverlay = document.getElementById('game-over-overlay');
const gameOverMessageEl = document.getElementById('game-over-message');
const gameOverScoreEl = document.getElementById('game-over-score');
const soundToggleBtn = document.getElementById('sound-toggle');
const soundIcon = document.getElementById('sound-icon');
const recordEl = document.getElementById('record');
const confettiCanvas = document.getElementById('confetti');
const die0Btn = document.getElementById('die-0');
const die1Btn = document.getElementById('die-1');
const powerRow = document.getElementById('power-row');
const noteBar = document.getElementById('note-bar');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SVG_NS = 'http://www.w3.org/2000/svg';
const CELL = 70;
const MARGIN = 8;
const SOUND_KEY = 'coilclimb.sound';
const STATS_KEY = 'coilclimb.stats.v1';
const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

const HUMAN_PLAYER = 1;
const AI_PLAYER = 2;

const POWER_DEFS = {
    shield: { icon: '🛡️', label: 'Shield', desc: 'Blocks the next serpent bite.' },
    swap: { icon: '🔄', label: 'Swap', desc: 'Swap places with your rival.' },
    boost: { icon: '🚀', label: 'Boost', desc: '+3 squares on your next move.' },
};
const POWER_KEYS = Object.keys(POWER_DEFS);

// ---------------------------------------------------------------------------
// UI state
// ---------------------------------------------------------------------------
let mode = 'pvai';              // 'pvp' | 'pvai'
let difficulty = 'greedy';      // 'random' | 'greedy' | 'strategic'
let powersEnabled = true;
let soundOn = true;
let aiBusy = false;

let stats = { p1: 0, p2: 0, games: 0 };

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------
let game = null;
let currentPlayer = 1;
let gameOver = false;
let dice = [0, 0];
let phase = 'idle';             // 'idle' | 'rolled' | 'moving'
let tokenEls = { 1: null, 2: null };
let powerTileEls = {};

// ---------------------------------------------------------------------------
// Sound engine
// ---------------------------------------------------------------------------
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

function tone({ freq = 440, type = 'sine', duration = 0.15, gain = 0.15, delay = 0, sweepTo = null } = {}) {
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
    roll() { [180, 240, 320].forEach((f, i) => tone({ freq: f, type: 'square', duration: 0.05, gain: 0.05, delay: i * 0.06 })); },
    step() { tone({ freq: 560, type: 'triangle', duration: 0.05, gain: 0.07 }); },
    ladder() { [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, type: 'triangle', duration: 0.14, gain: 0.12, delay: i * 0.07 })); },
    snake() { tone({ freq: 420, type: 'sawtooth', duration: 0.55, gain: 0.10, sweepTo: 80 }); },
    power() { [660, 880, 1100].forEach((f, i) => tone({ freq: f, type: 'sine', duration: 0.12, gain: 0.12, delay: i * 0.06 })); },
    shield() { tone({ freq: 300, type: 'triangle', duration: 0.22, gain: 0.14, sweepTo: 640 }); },
    swap() { [500, 700, 500].forEach((f, i) => tone({ freq: f, type: 'sine', duration: 0.1, gain: 0.1, delay: i * 0.06 })); },
    win() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone({ freq: f, type: 'triangle', duration: 0.24, gain: 0.16, delay: i * 0.10 })); },
    lose() { [392, 329.63, 261.63].forEach((f, i) => tone({ freq: f, type: 'sawtooth', duration: 0.30, gain: 0.10, delay: i * 0.14 })); },
    invalid() { tone({ freq: 150, type: 'square', duration: 0.09, gain: 0.07 }); },
    toggle() { tone({ freq: 660, type: 'sine', duration: 0.08, gain: 0.10, sweepTo: 880 }); },
};

function toggleSound() {
    soundOn = !soundOn;
    soundIcon.textContent = soundOn ? '🔊' : '🔇';
    soundToggleBtn.classList.toggle('muted', !soundOn);
    try { localStorage.setItem(SOUND_KEY, soundOn ? '1' : '0'); } catch (e) { /* ignore */ }
    if (soundOn) sfx.toggle();
}

function loadSoundPref() {
    try { if (localStorage.getItem(SOUND_KEY) === '0') soundOn = false; } catch (e) { /* ignore */ }
    soundIcon.textContent = soundOn ? '🔊' : '🔇';
    soundToggleBtn.classList.toggle('muted', !soundOn);
}

// ---------------------------------------------------------------------------
// Stats persistence
// ---------------------------------------------------------------------------
function loadStats() {
    try {
        const raw = localStorage.getItem(STATS_KEY);
        if (!raw) return;
        const p = JSON.parse(raw);
        if (p && typeof p === 'object') {
            stats.p1 = Number(p.p1) || 0;
            stats.p2 = Number(p.p2) || 0;
            stats.games = Number(p.games) || 0;
        }
    } catch (e) { /* ignore */ }
}

function saveStats() {
    try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch (e) { /* ignore */ }
}

function renderRecord() {
    if (!recordEl) return;
    recordEl.textContent = `All-time — P1 ${stats.p1} · P2/AI ${stats.p2} · Games ${stats.games}`;
}

// ---------------------------------------------------------------------------
// SVG helpers + boustrophedon numbering
// ---------------------------------------------------------------------------
function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v);
    return el;
}

function squareToCell(s, size) {
    const r = Math.floor((s - 1) / size);
    const i = (s - 1) % size;
    const c = (r % 2 === 0) ? i : (size - 1 - i);
    return { row: r, col: c };
}

function cellCenter(s, size) {
    const { row, col } = squareToCell(s, size);
    return {
        x: MARGIN + col * CELL + CELL / 2,
        y: MARGIN + (size - 1 - row) * CELL + CELL / 2,
    };
}

// ---------------------------------------------------------------------------
// Board generation
// ---------------------------------------------------------------------------
function pickLink(used, min, max, minGap, maxGap, upward) {
    for (let attempt = 0; attempt < 200; attempt++) {
        const start = min + Math.floor(Math.random() * (max - min + 1));
        if (used.has(start)) continue;

        let endMin, endMax;
        if (upward) {
            endMin = start + minGap;
            endMax = Math.min(max, start + maxGap);
        } else {
            endMin = Math.max(min, start - maxGap);
            endMax = start - minGap;
        }
        if (endMin > endMax) continue;

        const candidates = [];
        for (let e = endMin; e <= endMax; e++) {
            if (!used.has(e)) candidates.push(e);
        }
        if (!candidates.length) continue;

        const end = candidates[Math.floor(Math.random() * candidates.length)];
        return { from: start, to: end };
    }
    return null;
}

function generateLinks(size) {
    const total = size * size;
    const used = new Set([1, total]);
    const ladders = [];
    const snakes = [];
    const numLadders = Math.max(3, Math.floor(total / 12));
    const numSnakes = Math.max(3, Math.floor(total / 12));
    const minGap = 4;
    const maxGap = Math.max(6, Math.floor(total * 0.4));

    for (let i = 0; i < numLadders; i++) {
        const link = pickLink(used, 3, total - 2, minGap, maxGap, true);
        if (!link) continue;
        used.add(link.from);
        used.add(link.to);
        ladders.push(link);
    }
    for (let i = 0; i < numSnakes; i++) {
        const link = pickLink(used, 3, total - 2, minGap, maxGap, false);
        if (!link) continue;
        used.add(link.from);
        used.add(link.to);
        snakes.push(link);
    }
    return { ladders, snakes, used };
}

function generatePowerTiles(size, used, count) {
    const total = size * size;
    const tiles = new Map();
    let placed = 0;
    for (let attempt = 0; attempt < 400 && placed < count; attempt++) {
        const s = 3 + Math.floor(Math.random() * (total - 4));
        if (used.has(s) || tiles.has(s)) continue;
        const key = POWER_KEYS[Math.floor(Math.random() * POWER_KEYS.length)];
        tiles.set(s, key);
        placed++;
    }
    return tiles;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function buildBoard() {
    const size = game.size;
    const total = game.total;
    const width = MARGIN * 2 + size * CELL;
    svg.setAttribute('viewBox', `0 0 ${width} ${width}`);
    svg.innerHTML = '';

    svg.appendChild(svgEl('rect', {
        class: 'cc-board-bg', x: 0, y: 0, width, height: width, rx: 14,
    }));

    // Cells + numbers
    for (let s = 1; s <= total; s++) {
        const { row, col } = squareToCell(s, size);
        const x = MARGIN + col * CELL;
        const y = MARGIN + (size - 1 - row) * CELL;
        const cls = ((row + col) % 2 === 0) ? 'cc-cell light' : 'cc-cell dark';
        svg.appendChild(svgEl('rect', {
            class: cls, x: x + 1, y: y + 1, width: CELL - 2, height: CELL - 2, rx: 4,
        }));
        const t = svgEl('text', { class: 'cc-num', x: x + 6, y: y + 16 });
        t.textContent = String(s);
        svg.appendChild(t);
    }

    // Ladders
    for (const link of game.links.ladders) {
        svg.appendChild(drawLadder(link.from, link.to, size));
    }
    // Snakes
    for (const link of game.links.snakes) {
        svg.appendChild(drawSnake(link.from, link.to, size));
    }

    // Power tiles
    powerTileEls = {};
    for (const [s, key] of game.powerTiles) {
        const c = cellCenter(s, size);
        const def = POWER_DEFS[key];
        const g = svgEl('g', { class: 'cc-power-tile' });
        g.appendChild(svgEl('circle', { cx: c.x, cy: c.y, r: CELL * 0.28 }));
        const t = svgEl('text', {
            x: c.x, y: c.y + 6,
            'text-anchor': 'middle',
            'font-size': CELL * 0.4,
        });
        t.textContent = def.icon;
        g.appendChild(t);
        svg.appendChild(g);
        powerTileEls[s] = g;
    }

    // Tokens
    tokenEls = {};
    for (const p of [1, 2]) {
        const g = svgEl('g', { class: `cc-token token-${p}`, id: `token-${p}` });
        g.appendChild(svgEl('circle', { cx: 0, cy: 0, r: CELL * 0.16 }));
        const t = svgEl('text', {
            x: 0, y: 5, 'text-anchor': 'middle',
            'font-size': CELL * 0.22,
        });
        t.textContent = String(p);
        g.appendChild(t);
        svg.appendChild(g);
        tokenEls[p] = g;
    }
    renderTokens();
}

function drawLadder(from, to, size) {
    const a = cellCenter(from, size);
    const b = cellCenter(to, size);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const w = 9;
    const g = svgEl('g', { class: 'cc-ladder' });
    g.appendChild(svgEl('line', { x1: a.x + nx * w, y1: a.y + ny * w, x2: b.x + nx * w, y2: b.y + ny * w }));
    g.appendChild(svgEl('line', { x1: a.x - nx * w, y1: a.y - ny * w, x2: b.x - nx * w, y2: b.y - ny * w }));
    const rungs = Math.max(3, Math.floor(len / 22));
    for (let i = 1; i < rungs; i++) {
        const t = i / rungs;
        const px = a.x + dx * t;
        const py = a.y + dy * t;
        g.appendChild(svgEl('line', { x1: px + nx * w, y1: py + ny * w, x2: px - nx * w, y2: py - ny * w }));
    }
    return g;
}

function drawSnake(from, to, size) {
    const a = cellCenter(from, size);
    const b = cellCenter(to, size);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const segments = Math.max(4, Math.floor(len / 38));
    const amp = 16;
    let d = `M ${a.x} ${a.y}`;
    for (let i = 0; i < segments; i++) {
        const tMid = (i + 0.5) / segments;
        const t1 = (i + 1) / segments;
        const sign = (i % 2 === 0) ? 1 : -1;
        const cx = a.x + dx * tMid + nx * amp * sign;
        const cy = a.y + dy * tMid + ny * amp * sign;
        const x1 = a.x + dx * t1;
        const y1 = a.y + dy * t1;
        d += ` Q ${cx} ${cy} ${x1} ${y1}`;
    }
    const g = svgEl('g', { class: 'cc-snake' });
    g.appendChild(svgEl('path', { d, fill: 'none' }));
    g.appendChild(svgEl('circle', { cx: a.x, cy: a.y, r: 6 }));
    return g;
}

function renderTokens() {
    const size = game.size;
    for (const p of [1, 2]) {
        const g = tokenEls[p];
        if (!g) continue;
        const pos = game.positions[p - 1];
        if (pos <= 0) {
            g.setAttribute('transform', 'translate(-100,-100)');
            continue;
        }
        const c = cellCenter(pos, size);
        const offset = p === 1 ? -CELL * 0.18 : CELL * 0.18;
        g.setAttribute('transform', `translate(${c.x + offset}, ${c.y})`);
    }
}

// ---------------------------------------------------------------------------
// Game flow
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function newGame() {
    const size = Number(boardSizeSelect.value) || 8;
    const total = size * size;
    const links = generateLinks(size);
    const powerTiles = powersEnabled
        ? generatePowerTiles(size, links.used, Math.max(3, Math.floor(total / 14)))
        : new Map();

    game = {
        size, total,
        links,
        powerTiles,
        positions: [0, 0],
        powers: [[], []],
        shields: [0, 0],
        boosts: [0, 0],
    };
    currentPlayer = 1;
    gameOver = false;
    phase = 'idle';
    dice = [0, 0];
    aiBusy = false;

    gameOverOverlay.classList.remove('show');
    noteBar.textContent = '';
    statusEl.className = '';

    buildBoard();
    updateStatsUI();
    updateDiceUI();
    updatePowerUI();
    updateStatus();
    startTurn();
}

function startTurn() {
    if (gameOver) return;
    phase = 'idle';
    dice = [0, 0];
    updateDiceUI();
    updatePowerUI();
    updateStatus();

    if (isAITurn()) {
        aiBusy = true;
        setTimeout(() => {
            if (gameOver || !isAITurn()) { aiBusy = false; return; }
            aiMaybeUsePower();
            setTimeout(() => {
                if (gameOver || !isAITurn()) { aiBusy = false; return; }
                rollDice();
                setTimeout(() => {
                    if (gameOver || !isAITurn()) { aiBusy = false; return; }
                    const choice = chooseAIDie();
                    aiBusy = false;
                    selectDie(choice);
                }, 650);
            }, 450);
        }, 700);
    }
}

function isAITurn() {
    return mode === 'pvai' && currentPlayer === AI_PLAYER && !gameOver;
}

function rollDice() {
    if (gameOver || phase !== 'idle') return;
    dice = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
    phase = 'rolled';
    sfx.roll();
    updateDiceUI();
    updateStatus();
}

function selectDie(index) {
    if (gameOver || phase !== 'rolled') return;
    const dieValue = dice[index];
    if (!dieValue) return;
    phase = 'moving';
    updateDiceUI();
    takeTurn(dieValue);
}

async function takeTurn(dieValue) {
    const p = currentPlayer;
    const from = game.positions[p - 1];

    // Apply boost
    if (game.boosts[p - 1] > 0) {
        dieValue += game.boosts[p - 1];
        game.boosts[p - 1] = 0;
        setNote(`Boost! Moving ${dieValue} squares.`);
    }

    let target = from + dieValue;
    if (target > game.total) {
        target = game.total - (target - game.total);
    }

    await animateMovement(p, from, target);
    game.positions[p - 1] = target;

    // Ladder?
    const ladder = game.links.ladders.find(l => l.from === target);
    if (ladder) {
        await sleep(300);
        sfx.ladder();
        setNote(`Ladder! Up to ${ladder.to}`);
        await animateMovement(p, target, ladder.to, 2);
        game.positions[p - 1] = ladder.to;
        target = ladder.to;
    }

    // Snake?
    const snake = game.links.snakes.find(s => s.from === target);
    if (snake) {
        if (game.shields[p - 1] > 0) {
            game.shields[p - 1]--;
            sfx.shield();
            setNote('Shield blocked the serpent!');
            await sleep(500);
        } else {
            await sleep(300);
            sfx.snake();
            setNote(`Serpent! Down to ${snake.to}`);
            await animateMovement(p, target, snake.to, 3);
            game.positions[p - 1] = snake.to;
            target = snake.to;
        }
    }

    // Power tile?
    if (game.powerTiles.has(target)) {
        const key = game.powerTiles.get(target);
        game.powers[p - 1].push(key);
        sfx.power();
        setNote(`Picked up: ${POWER_DEFS[key].label}!`);
        await sleep(500);
        updatePowerUI();
    }

    // Win?
    if (game.positions[p - 1] === game.total) {
        endGame(p);
        return;
    }

    // Hand over
    currentPlayer = p === 1 ? 2 : 1;
    updateStatsUI();
    startTurn();
}

async function animateMovement(player, from, to, speed = 1) {
    if (from === to) return;
    const step = to > from ? 1 : -1;
    let pos = from;
    while (pos !== to) {
        pos += step;
        game.positions[player - 1] = pos;
        renderTokens();
        sfx.step();
        await sleep(130 / speed);
    }
}

function setNote(text) {
    noteBar.textContent = text;
    noteBar.classList.remove('pulse');
    void noteBar.offsetWidth;
    noteBar.classList.add('pulse');
}

function updateDiceUI() {
    [die0Btn, die1Btn].forEach((btn, i) => {
        if (dice[i]) {
            btn.textContent = DICE_FACES[dice[i] - 1];
            btn.classList.add('rolled');
        } else {
            btn.textContent = phase === 'idle' ? '?' : '';
            btn.classList.remove('rolled');
        }
        btn.classList.toggle('disabled', phase !== 'rolled' || isAITurn() || aiBusy);
    });
}

function updatePowerUI() {
    powerRow.innerHTML = '';
    const powers = game ? game.powers[currentPlayer - 1] : [];
    if (!powersEnabled || !powers.length) {
        powerRow.classList.add('empty');
        return;
    }
    powerRow.classList.remove('empty');
    const counts = {};
    for (const k of powers) counts[k] = (counts[k] || 0) + 1;
    for (const [k, n] of Object.entries(counts)) {
        const def = POWER_DEFS[k];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'power-btn';
        btn.title = def.desc;
        btn.innerHTML =
            `<span class="power-icon">${def.icon}</span>` +
            `<span class="power-label">${def.label}</span>` +
            (n > 1 ? `<span class="power-count">×${n}</span>` : '');
        btn.disabled = isAITurn() || aiBusy || phase === 'moving' || gameOver;
        btn.addEventListener('click', () => activatePower(k));
        powerRow.appendChild(btn);
    }
}

function activatePower(key) {
    if (gameOver || phase === 'moving') return;
    const p = currentPlayer;
    const idx = game.powers[p - 1].indexOf(key);
    if (idx === -1) return;
    game.powers[p - 1].splice(idx, 1);

    if (key === 'shield') {
        game.shields[p - 1]++;
        sfx.shield();
        setNote('Shield active! Blocks next serpent.');
    } else if (key === 'swap') {
        const other = p === 1 ? 2 : 1;
        const a = game.positions[p - 1];
        const b = game.positions[other - 1];
        game.positions[p - 1] = b;
        game.positions[other - 1] = a;
        sfx.swap();
        setNote('Swapped places!');
        renderTokens();
    } else if (key === 'boost') {
        game.boosts[p - 1] += 3;
        sfx.power();
        setNote('Boost ready! +3 on next move.');
    }
    updatePowerUI();
}

// ---------------------------------------------------------------------------
// AI
// ---------------------------------------------------------------------------
function chooseAIDie() {
    if (difficulty === 'random') {
        return Math.random() < 0.5 ? 0 : 1;
    }
    const p = AI_PLAYER;
    const from = game.positions[p - 1];

    const evaluate = (die) => {
        let pos = from + die;
        if (pos > game.total) pos = game.total - (pos - game.total);
        const ladder = game.links.ladders.find(l => l.from === pos);
        if (ladder) pos = ladder.to;
        const snake = game.links.snakes.find(s => s.from === pos);
        if (snake && game.shields[p - 1] === 0) pos = snake.to;
        return pos;
    };

    const score = (pos) => {
        let s = pos;
        if (difficulty === 'strategic' && game.powerTiles.has(pos)) s += 3;
        return s;
    };

    const a = score(evaluate(dice[0]));
    const b = score(evaluate(dice[1]));
    return a >= b ? 0 : 1;
}

function aiMaybeUsePower() {
    if (!powersEnabled) return;
    const p = AI_PLAYER;
    const powers = game.powers[p - 1];
    if (!powers.length) return;

    const myPos = game.positions[p - 1];
    const theirPos = game.positions[0];

    if (powers.includes('swap') && myPos + 10 < theirPos) {
        activatePower('swap');
        return;
    }
    if (powers.includes('boost') && game.boosts[p - 1] === 0) {
        activatePower('boost');
        return;
    }
    if (powers.includes('shield') && game.shields[p - 1] === 0) {
        const ahead = game.links.snakes.some(s => s.from > myPos && s.from <= myPos + 12);
        if (ahead) activatePower('shield');
    }
}

// ---------------------------------------------------------------------------
// End of game
// ---------------------------------------------------------------------------
function endGame(winner) {
    gameOver = true;
    aiBusy = false;
    phase = 'idle';
    stats.games++;
    if (winner === 1) stats.p1++;
    else stats.p2++;
    saveStats();
    renderRecord();

    let message;
    if (winner === 1) {
        message = mode === 'pvai' ? 'You Win!' : 'Player 1 Wins!';
        statusEl.className = 'win-message';
        sfx.win();
        launchConfetti(1);
    } else {
        message = mode === 'pvai' ? 'AI Wins!' : 'Player 2 Wins!';
        statusEl.className = 'tie-message';
        sfx.lose();
        launchConfetti(2);
    }
    statusEl.textContent = message;
    gameOverMessageEl.textContent = message;
    gameOverScoreEl.textContent = `${stats.p1} - ${stats.p2}`;
    gameOverOverlay.classList.add('show');
    updateDiceUI();
    updatePowerUI();
}

function updateStatus() {
    if (gameOver) return;
    if (isAITurn()) {
        statusEl.textContent = aiBusy ? 'AI is thinking…' : "AI's turn";
        return;
    }
    if (phase === 'idle') {
        statusEl.textContent = mode === 'pvai'
            ? 'Your turn — roll the dice'
            : `Player ${currentPlayer}'s turn — roll the dice`;
    } else if (phase === 'rolled') {
        statusEl.textContent = 'Pick a die to move';
    } else {
        statusEl.textContent = 'Moving…';
    }
}

function updateStatsUI() {
    score1El.textContent = String(stats.p1);
    score2El.textContent = String(stats.p2);
}

// ---------------------------------------------------------------------------
// Confetti
// ---------------------------------------------------------------------------
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
        1: ['#ef4444', '#f87171', '#fecaca', '#ffffff', '#facc15'],
        2: ['#4ade80', '#22c55e', '#bbf7d0', '#ffffff', '#facc15'],
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

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
resetBtn.addEventListener('click', newGame);
playAgainBtn.addEventListener('click', newGame);
pvpBtn.addEventListener('click', () => setMode('pvp'));
pvaiBtn.addEventListener('click', () => setMode('pvai'));
soundToggleBtn.addEventListener('click', toggleSound);

die0Btn.addEventListener('click', () => {
    if (isAITurn() || aiBusy) return;
    if (phase === 'idle') rollDice();
    else if (phase === 'rolled') selectDie(0);
});
die1Btn.addEventListener('click', () => {
    if (isAITurn() || aiBusy) return;
    if (phase === 'idle') rollDice();
    else if (phase === 'rolled') selectDie(1);
});

boardSizeSelect.addEventListener('change', newGame);
difficultySelect.addEventListener('change', () => { difficulty = difficultySelect.value; });
powersSelect.addEventListener('change', () => {
    powersEnabled = powersSelect.value === 'on';
    newGame();
});

document.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (e.key === 'r' || e.key === 'R') newGame();
    else if (e.key === 'm' || e.key === 'M') toggleSound();
});

window.addEventListener('resize', () => {
    if (confettiParticles.length) resizeConfettiCanvas();
});

function setMode(newMode) {
    mode = newMode;
    pvpBtn.className = mode === 'pvp' ? 'btn' : 'btn btn-secondary';
    pvaiBtn.className = mode === 'pvai' ? 'btn' : 'btn btn-secondary';
    difficultyLabel.classList.toggle('hidden', mode !== 'pvai');
    player2LabelEl.textContent = mode === 'pvai' ? 'AI' : 'Player 2';
    newGame();
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
loadStats();
loadSoundPref();
difficulty = difficultySelect.value;
powersEnabled = powersSelect.value === 'on';
renderRecord();
setMode(mode);