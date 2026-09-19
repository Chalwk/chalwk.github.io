// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

const svgNS = 'http://www.w3.org/2000/svg';
const TILE = 48;
const MAX_CHARGE = 3;
const NUM_WORD = { 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six' };

const svg = document.getElementById('game-board');
const status = document.getElementById('status');
const resetBtn = document.getElementById('reset');
const playAgainBtn = document.getElementById('play-again');
const pvpBtn = document.getElementById('pvp');
const pvaiBtn = document.getElementById('pvai');
const boardSizeSelect = document.getElementById('board-size');
const difficultySelect = document.getElementById('difficulty');
const difficultyLabel = document.getElementById('difficulty-label');
const score1Display = document.getElementById('score-1');
const score2Display = document.getElementById('score-2');
const shield1Display = document.getElementById('shield-1');
const shield2Display = document.getElementById('shield-2');
const rerollCount1Display = document.getElementById('reroll-count-1');
const rerollCount2Display = document.getElementById('reroll-count-2');
const player2Label = document.getElementById('player-2-label');
const overlay = document.getElementById('game-over-overlay');
const overlayMessage = document.getElementById('game-over-message');
const overlayScore = document.getElementById('game-over-score');
const diceBox = document.getElementById('dice-box');
const diceIcon = document.getElementById('dice-icon');
const rollBtn = document.getElementById('roll-btn');
const rerollBtn = document.getElementById('reroll-btn');
const rerollBadge = document.getElementById('reroll-badge');
const gameLog = document.getElementById('game-log');
const soundToggle = document.getElementById('sound-toggle');
const soundIcon = document.getElementById('sound-icon');
const confettiCanvas = document.getElementById('confetti');

let gameMode = 'pvai';
let difficulty = 'cautious';
let totalTiles = 100;
let layout = { cols: 10, rows: 10 };
let ladders = new Map(); // bottom -> top
let snakes = new Map();  // head -> tail
let positions = { 1: 1, 2: 1 };
let charges = { 1: { shield: 0, reroll: 0 }, 2: { shield: 0, reroll: 0 } };
let currentPlayer = 1;
let gameActive = true;
let turnPhase = 'idle'; // idle | rolling | rolled | moving
let pendingRoll = 0;
let rerollWindowTimer = null;
let token1, token2;
let soundOn = true;
let audioCtx = null;

/* ---------------------------------------------------------------------------
   Sound
   --------------------------------------------------------------------------- */
function beep(freq, dur, type = 'sine', volume = 0.08) {
    if (!soundOn) return;
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.value = volume;
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
        osc.stop(audioCtx.currentTime + dur);
    } catch (e) { /* ignore */ }
}

soundToggle.addEventListener('click', () => {
    soundOn = !soundOn;
    soundIcon.textContent = soundOn ? '🔊' : '🔇';
    soundToggle.classList.toggle('muted', !soundOn);
});

/* ---------------------------------------------------------------------------
   Board layout & hazard generation
   --------------------------------------------------------------------------- */
function buildLayout(tiles) {
    const cols = Math.round(Math.sqrt(tiles));
    return { cols, rows: cols };
}

function tileCenter(tile, cols, rows) {
    const idx = tile - 1;
    const rowFromBottom = Math.floor(idx / cols);
    let colInRow = idx % cols;
    if (rowFromBottom % 2 === 1) colInRow = cols - 1 - colInRow;
    const row = rows - 1 - rowFromBottom;
    return { x: colInRow * TILE + TILE / 2, y: row * TILE + TILE / 2, row, col: colInRow };
}

function generateHazards(tiles, cols) {
    const used = new Set([1, tiles]);
    const laddersMap = new Map();
    const snakesMap = new Map();
    const count = Math.max(4, Math.round(tiles / 12));

    function randomFreeTile() {
        let t, tries = 0;
        do {
            t = 2 + Math.floor(Math.random() * (tiles - 2));
            tries++;
        } while (used.has(t) && tries < 300);
        return used.has(t) ? null : t;
    }

    for (let i = 0; i < count; i++) {
        const bottom = randomFreeTile();
        if (bottom === null) continue;
        const span = cols + Math.floor(Math.random() * cols * 2);
        const top = Math.min(bottom + span, tiles - 1);
        if (top - bottom < cols || used.has(top)) continue;
        used.add(bottom);
        used.add(top);
        laddersMap.set(bottom, top);
    }

    for (let i = 0; i < count; i++) {
        const head = randomFreeTile();
        if (head === null) continue;
        const span = cols + Math.floor(Math.random() * cols * 2);
        const tail = Math.max(head - span, 2);
        if (head - tail < cols || used.has(tail)) continue;
        used.add(head);
        used.add(tail);
        snakesMap.set(head, tail);
    }

    return { ladders: laddersMap, snakes: snakesMap };
}

/* ---------------------------------------------------------------------------
   Rendering
   --------------------------------------------------------------------------- */
function drawLadder(bottom, top) {
    const cols = layout.cols, rows = layout.rows;
    const a = tileCenter(bottom, cols, rows);
    const b = tileCenter(top, cols, rows);
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const px = -uy, py = ux;
    const railOffset = 6.5;

    [1, -1].forEach((side) => {
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', a.x + px * railOffset * side);
        line.setAttribute('y1', a.y + py * railOffset * side);
        line.setAttribute('x2', b.x + px * railOffset * side);
        line.setAttribute('y2', b.y + py * railOffset * side);
        line.setAttribute('class', 'cb-ladder-rail');
        svg.appendChild(line);
    });

    const rungCount = Math.max(2, Math.round(len / 16));
    for (let i = 1; i < rungCount; i++) {
        const t = i / rungCount;
        const cx = a.x + dx * t, cy = a.y + dy * t;
        const rung = document.createElementNS(svgNS, 'line');
        rung.setAttribute('x1', cx + px * railOffset);
        rung.setAttribute('y1', cy + py * railOffset);
        rung.setAttribute('x2', cx - px * railOffset);
        rung.setAttribute('y2', cy - py * railOffset);
        rung.setAttribute('class', 'cb-ladder-rung');
        svg.appendChild(rung);
    }
}

function drawSnake(head, tail) {
    const cols = layout.cols, rows = layout.rows;
    const a = tileCenter(head, cols, rows);
    const b = tileCenter(tail, cols, rows);
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const px = -dy / len, py = dx / len;
    const curve = len * 0.28 * (Math.random() < 0.5 ? 1 : -1);
    const mx = (a.x + b.x) / 2 + px * curve;
    const my = (a.y + b.y) / 2 + py * curve;

    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`);
    path.setAttribute('class', 'cb-snake-path');
    svg.appendChild(path);

    const headMarker = document.createElementNS(svgNS, 'circle');
    headMarker.setAttribute('cx', a.x);
    headMarker.setAttribute('cy', a.y);
    headMarker.setAttribute('r', 6.5);
    headMarker.setAttribute('class', 'cb-snake-head-marker');
    svg.appendChild(headMarker);

    [-2.2, 2.2].forEach((offset) => {
        const eye = document.createElementNS(svgNS, 'circle');
        eye.setAttribute('cx', a.x + offset);
        eye.setAttribute('cy', a.y - 1.5);
        eye.setAttribute('r', 1.1);
        eye.setAttribute('class', 'cb-snake-eye');
        svg.appendChild(eye);
    });
}

function createToken(cls) {
    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('r', TILE * 0.27);
    circle.setAttribute('class', cls);
    return circle;
}

function renderBoard() {
    const { cols, rows } = layout;
    const size = cols * TILE;
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.innerHTML = '';

    const ladderTops = new Set(ladders.values());
    const snakeTails = new Set(snakes.values());

    for (let t = 1; t <= totalTiles; t++) {
        const { row, col } = tileCenter(t, cols, rows);
        const rect = document.createElementNS(svgNS, 'rect');
        rect.setAttribute('x', col * TILE);
        rect.setAttribute('y', row * TILE);
        rect.setAttribute('width', TILE);
        rect.setAttribute('height', TILE);

        let cls = 'cb-tile ' + ((row + col) % 2 === 0 ? 'cb-tile-a' : 'cb-tile-b');
        if (t === totalTiles) cls += ' cb-tile-final';
        if (ladders.has(t)) cls += ' cb-tile-ladder-bottom';
        if (ladderTops.has(t)) cls += ' cb-tile-ladder-top';
        if (snakes.has(t)) cls += ' cb-tile-snake-head';
        if (snakeTails.has(t)) cls += ' cb-tile-snake-tail';
        rect.setAttribute('class', cls);
        svg.appendChild(rect);

        const text = document.createElementNS(svgNS, 'text');
        text.setAttribute('x', col * TILE + 4);
        text.setAttribute('y', row * TILE + 11);
        text.setAttribute('class', 'cb-tile-num');
        text.textContent = t;
        svg.appendChild(text);
    }

    snakes.forEach((tail, head) => drawSnake(head, tail));
    ladders.forEach((top, bottom) => drawLadder(bottom, top));

    token1 = createToken('cb-token cb-token-1');
    token2 = createToken('cb-token cb-token-2');
    svg.appendChild(token1);
    svg.appendChild(token2);
    updateTokenPositions();
}

function updateTokenPositions() {
    const { cols, rows } = layout;
    const p1 = tileCenter(positions[1], cols, rows);
    const p2 = tileCenter(positions[2], cols, rows);
    const sameTile = positions[1] === positions[2];
    const offset = sameTile ? 9 : 0;

    token1.setAttribute('cx', p1.x - offset);
    token1.setAttribute('cy', p1.y);
    token2.setAttribute('cx', p2.x + offset);
    token2.setAttribute('cy', p2.y);
}

/* ---------------------------------------------------------------------------
   Helpers
   --------------------------------------------------------------------------- */
function playerName(p) {
    if (p === 2 && gameMode === 'pvai') return 'The AI';
    return `Player ${p}`;
}

function logMsg(text) {
    gameLog.textContent = text;
}

function updateScores() {
    score1Display.textContent = positions[1];
    score2Display.textContent = positions[2];
}

function updateChargeDisplays() {
    shield1Display.textContent = `🛡️ ${charges[1].shield}`;
    shield2Display.textContent = `🛡️ ${charges[2].shield}`;
    rerollCount1Display.textContent = `🔁 ${charges[1].reroll}`;
    rerollCount2Display.textContent = `🔁 ${charges[2].reroll}`;
    shield1Display.classList.toggle('active', charges[1].shield > 0);
    shield2Display.classList.toggle('active', charges[2].shield > 0);
    rerollCount1Display.classList.toggle('active', charges[1].reroll > 0);
    rerollCount2Display.classList.toggle('active', charges[2].reroll > 0);
    rerollBadge.textContent = charges[currentPlayer].reroll;
}

function updateStatus() {
    if (!gameActive) return;
    status.textContent = `${playerName(currentPlayer)}'s turn`;
}

function showDiceFace(n) {
    diceIcon.className = `fas fa-dice-${NUM_WORD[n]}`;
}

function animateDiceRoll(callback) {
    diceBox.classList.add('rolling');
    let ticks = 0;
    const iv = setInterval(() => {
        showDiceFace(1 + Math.floor(Math.random() * 6));
        ticks++;
        if (ticks > 6) {
            clearInterval(iv);
            diceBox.classList.remove('rolling');
            callback();
        }
    }, 65);
}

/* ---------------------------------------------------------------------------
   Turn flow
   --------------------------------------------------------------------------- */
function isAITurn() {
    return gameMode === 'pvai' && currentPlayer === 2;
}

function startTurn() {
    if (!gameActive) return;
    turnPhase = 'idle';
    pendingRoll = 0;
    updateStatus();
    updateChargeDisplays();
    rerollBtn.disabled = true;

    if (isAITurn()) {
        rollBtn.disabled = true;
        setTimeout(rollDice, 700);
    } else {
        rollBtn.disabled = false;
    }
}

function rollDice() {
    if (!gameActive || turnPhase !== 'idle') return;
    turnPhase = 'rolling';
    rollBtn.disabled = true;
    rerollBtn.disabled = true;
    beep(440, 0.08, 'square', 0.05);

    animateDiceRoll(() => {
        pendingRoll = 1 + Math.floor(Math.random() * 6);
        showDiceFace(pendingRoll);
        turnPhase = 'rolled';
        handlePostRoll();
    });
}

function predictedTile() {
    const to = positions[currentPlayer] + pendingRoll;
    return Math.min(to, totalTiles + 1); // +1 sentinel marks overshoot
}

function aiShouldReroll() {
    if (charges[currentPlayer].reroll <= 0) return false;
    const from = positions[currentPlayer];
    const to = from + pendingRoll;
    const overshoot = to > totalTiles;
    const bitten = snakes.has(to) && charges[currentPlayer].shield <= 0;

    if (difficulty === 'random') return Math.random() < 0.4;
    if (difficulty === 'cautious') return overshoot || bitten;
    if (difficulty === 'strategic') {
        const farFromGoal = (totalTiles - from) > layout.cols * 2;
        return overshoot || bitten || (pendingRoll <= 2 && farFromGoal);
    }
    return false;
}

function handlePostRoll() {
    updateChargeDisplays();

    if (isAITurn()) {
        if (aiShouldReroll()) {
            setTimeout(() => doReroll(true), 500);
        } else {
            setTimeout(finalizeMove, 700);
        }
        return;
    }

    if (charges[currentPlayer].reroll > 0) {
        rerollBtn.disabled = false;
        rerollWindowTimer = setTimeout(() => {
            rerollBtn.disabled = true;
            finalizeMove();
        }, 1800);
    } else {
        setTimeout(finalizeMove, 900);
    }
}

rerollBtn.addEventListener('click', () => {
    if (turnPhase === 'rolled' && !isAITurn()) doReroll(false);
});

function doReroll(isAI) {
    if (turnPhase !== 'rolled') return;
    clearTimeout(rerollWindowTimer);
    rerollBtn.disabled = true;
    charges[currentPlayer].reroll--;
    updateChargeDisplays();
    const oldRoll = pendingRoll;
    beep(660, 0.1, 'square', 0.05);

    animateDiceRoll(() => {
        pendingRoll = 1 + Math.floor(Math.random() * 6);
        showDiceFace(pendingRoll);
        logMsg(`🔁 ${playerName(currentPlayer)} used a reroll: ${oldRoll} → ${pendingRoll}.`);
        setTimeout(finalizeMove, isAI ? 700 : 900);
    });
}

function finalizeMove() {
    if (!gameActive) return;
    turnPhase = 'moving';
    rollBtn.disabled = true;
    rerollBtn.disabled = true;

    const roll = pendingRoll;
    const from = positions[currentPlayer];
    const to = from + roll;
    logMsg(`🎲 ${playerName(currentPlayer)} rolled a ${roll}.`);

    if (to > totalTiles) {
        setTimeout(() => {
            logMsg(`🏁 ${playerName(currentPlayer)} needs an exact roll to finish!`);
            endTurn();
        }, 700);
        return;
    }

    movePlayerTo(currentPlayer, to, () => resolveTile(currentPlayer, to));
}

function movePlayerTo(player, tile, callback) {
    positions[player] = tile;
    updateTokenPositions();
    updateScores();
    setTimeout(callback, 480);
}

function resolveTile(player, tile) {
    if (tile === totalTiles) {
        setTimeout(() => declareWinner(player), 250);
        return;
    }

    if (snakes.has(tile)) {
        const c = charges[player];
        const token = player === 1 ? token1 : token2;
        if (c.shield > 0) {
            c.shield--;
            updateChargeDisplays();
            logMsg(`🛡️ ${playerName(player)}'s shield blocked the bite at ${tile}!`);
            beep(520, 0.15, 'triangle', 0.06);
            setTimeout(endTurn, 700);
            return;
        }
        const tail = snakes.get(tile);
        c.shield = Math.min(c.shield + 1, MAX_CHARGE);
        updateChargeDisplays();
        logMsg(`🐍 ${playerName(player)} was bitten at ${tile}! Sliding down to ${tail}. (+1 shield banked)`);
        beep(180, 0.25, 'sawtooth', 0.06);
        token.classList.add('bite');
        setTimeout(() => token.classList.remove('bite'), 500);
        movePlayerTo(player, tail, () => setTimeout(endTurn, 350));
        return;
    }

    if (ladders.has(tile)) {
        const top = ladders.get(tile);
        const token = player === 1 ? token1 : token2;
        charges[player].reroll = Math.min(charges[player].reroll + 1, MAX_CHARGE);
        updateChargeDisplays();
        logMsg(`🪜 ${playerName(player)} climbed from ${tile} to ${top}! (+1 reroll banked)`);
        beep(720, 0.18, 'sine', 0.07);
        token.classList.add('climb');
        setTimeout(() => token.classList.remove('climb'), 450);
        movePlayerTo(player, top, () => setTimeout(endTurn, 350));
        return;
    }

    setTimeout(endTurn, 450);
}

function endTurn() {
    if (!gameActive) return;
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    startTurn();
}

function declareWinner(player) {
    gameActive = false;
    const message = `${playerName(player)} Wins!`;
    status.textContent = message;
    status.className = 'win-message';
    logMsg(`🏆 ${playerName(player)} reached tile ${totalTiles} first!`);
    overlayMessage.textContent = message;
    overlayScore.textContent =
        `Player 1: tile ${positions[1]}  -  ${gameMode === 'pvai' ? 'AI' : 'Player 2'}: tile ${positions[2]}`;
    overlay.classList.add('show');
    beep(880, 0.35, 'sine', 0.08);
    setTimeout(() => beep(1175, 0.4, 'sine', 0.08), 180);
    launchConfetti();
    rollBtn.disabled = true;
    rerollBtn.disabled = true;
}

function hideOverlay() {
    overlay.classList.remove('show');
}

/* ---------------------------------------------------------------------------
   Confetti
   --------------------------------------------------------------------------- */
function launchConfetti() {
    const ctx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    const colors = ['#ef4444', '#4ade80', '#facc15', '#7ef9ff', '#f59e0b'];
    const pieces = Array.from({ length: 120 }, () => ({
        x: Math.random() * confettiCanvas.width,
        y: -20 - Math.random() * confettiCanvas.height * 0.5,
        size: 4 + Math.random() * 5,
        speed: 2 + Math.random() * 3,
        drift: (Math.random() - 0.5) * 2,
        rot: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        color: colors[Math.floor(Math.random() * colors.length)]
    }));

    const start = performance.now();
    function frame(now) {
        const elapsed = now - start;
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        pieces.forEach((p) => {
            p.y += p.speed;
            p.x += p.drift;
            p.rot += p.rotSpeed;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
        });
        if (elapsed < 2600) {
            requestAnimationFrame(frame);
        } else {
            ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        }
    }
    requestAnimationFrame(frame);
}

/* ---------------------------------------------------------------------------
   Game lifecycle
   --------------------------------------------------------------------------- */
function resetGame() {
    hideOverlay();
    clearTimeout(rerollWindowTimer);

    layout = buildLayout(totalTiles);
    const hazards = generateHazards(totalTiles, layout.cols);
    ladders = hazards.ladders;
    snakes = hazards.snakes;

    positions = { 1: 1, 2: 1 };
    charges = { 1: { shield: 0, reroll: 0 }, 2: { shield: 0, reroll: 0 } };
    currentPlayer = 1;
    gameActive = true;
    turnPhase = 'idle';
    pendingRoll = 0;
    status.className = '';
    diceIcon.className = 'fas fa-dice';

    renderBoard();
    updateScores();
    updateChargeDisplays();
    logMsg('A fresh board! Climbing ladders grants a reroll. Getting bitten grants a shield.');
    startTurn();
}

function setGameMode(mode) {
    gameMode = mode;
    pvpBtn.className = mode === 'pvp' ? 'btn' : 'btn btn-secondary';
    pvaiBtn.className = mode === 'pvai' ? 'btn' : 'btn btn-secondary';
    player2Label.textContent = mode === 'pvai' ? 'AI' : 'Player 2';
    difficultyLabel.classList.toggle('hidden', mode !== 'pvai');
    resetGame();
}

/* ---------------------------------------------------------------------------
   Event wiring
   --------------------------------------------------------------------------- */
boardSizeSelect.addEventListener('change', () => {
    totalTiles = Number(boardSizeSelect.value);
    resetGame();
});

difficultySelect.addEventListener('change', () => {
    difficulty = difficultySelect.value;
});

rollBtn.addEventListener('click', rollDice);
resetBtn.addEventListener('click', resetGame);
playAgainBtn.addEventListener('click', resetGame);
pvpBtn.addEventListener('click', () => setGameMode('pvp'));
pvaiBtn.addEventListener('click', () => setGameMode('pvai'));

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !rollBtn.disabled) {
        e.preventDefault();
        rollDice();
    } else if (e.key.toLowerCase() === 'r' && rerollBtn && !rerollBtn.disabled) {
        rerollBtn.click();
    } else if (e.key.toLowerCase() === 'm') {
        soundToggle.click();
    }
});

setGameMode('pvai');
