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
const connectSelect = document.getElementById('connect-length');
const difficultySelect = document.getElementById('difficulty');
const difficultyLabel = document.getElementById('difficulty-label');
const timerSelect = document.getElementById('turn-timer');
const timerBar = document.getElementById('timer-bar');
const timerFill = document.getElementById('timer-fill');
const gameOverOverlay = document.getElementById('game-over-overlay');
const gameOverMessageEl = document.getElementById('game-over-message');
const gameOverScoreEl = document.getElementById('game-over-score');
const soundToggleBtn = document.getElementById('sound-toggle');
const soundIcon = document.getElementById('sound-icon');
const recordEl = document.getElementById('record');
const confettiCanvas = document.getElementById('confetti');

// ---------------------------------------------------------------------------
// Layout constants (SVG user-space units; the SVG scales responsively)
// ---------------------------------------------------------------------------
const SVG_NS = 'http://www.w3.org/2000/svg';
const CELL = 70;
const MARGIN = 14;
const HOLE_R = CELL * 0.42;
const DISC_R = CELL * 0.36;

// Player identifiers used throughout state + AI search
const HUMAN_PLAYER = 1;
const AI_PLAYER = 2;

const STATS_KEY = 'forsight.stats.v1';
const SOUND_KEY = 'forsight.sound';

// ---------------------------------------------------------------------------
// Global UI state (not part of simulate-able game state)
// ---------------------------------------------------------------------------
let mode = 'pvai';         // 'pvp'    | 'pvai'
let difficulty = 'greedy'; // 'random' | 'greedy' | 'strategic'
let aiBusy = false;
let soundOn = true;

// Session score: wins per player (persists across rounds until mode changes)
let scores = [0, 0];

// All-time record (persisted in localStorage)
let stats = { p1: 0, p2: 0, draws: 0, games: 0 };

let currentPlayer = 1;
let gameOver = false;
let connectLength = 4;

// The core game state: { cols, rows, board }
// `board` is indexed board[row][col] with row 0 = BOTTOM row (gravity target).
let game = null;

// 2D array of SVG <circle> disc elements, indexed [row][col]
let cellEls = [];

// Ghost disc shown at the top of the hovered column
let previewDisc = null;

// Dashed ring marking the most recent drop
let lastMoveRing = null;

let lastMove = null;

// Keyboard aim target
let aimCol = null;

// Turn timer
let timerSeconds = 0;
let turnTimerId = null;
let timerDeadline = 0;
let lastTickSecond = -1;

// ---------------------------------------------------------------------------
// Sound engine (Web Audio API - everything is synthesised, no assets needed)
// ---------------------------------------------------------------------------
let audioCtx = null;

function getAudioCtx() {
    if (!audioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        try { audioCtx = new AC(); } catch (e) { return null; }
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => { });
    }
    return audioCtx;
}

function tone(opts) {
    if (!soundOn) return;
    const ctx = getAudioCtx();
    if (!ctx) return;

    const {
        freq = 440,
        type = 'sine',
        duration = 0.15,
        gain = 0.15,
        delay = 0,
        sweepTo = null,
    } = opts || {};

    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (sweepTo) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), t0 + duration);
    }

    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    osc.connect(amp).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.03);
}

const sfx = {
    drop(player) {
        tone({ freq: player === 1 ? 330 : 262, type: 'triangle', duration: 0.12, gain: 0.18, sweepTo: player === 1 ? 175 : 140 });
        tone({ freq: 90, type: 'sine', duration: 0.16, gain: 0.12, delay: 0.05 });
    },
    win() {
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
            tone({ freq: f, type: 'triangle', duration: 0.24, gain: 0.16, delay: i * 0.1 });
        });
    },
    lose() {
        [392, 329.63, 261.63].forEach((f, i) => {
            tone({ freq: f, type: 'sawtooth', duration: 0.3, gain: 0.09, delay: i * 0.14 });
        });
    },
    draw() {
        [349.23, 329.63].forEach((f, i) => {
            tone({ freq: f, type: 'sine', duration: 0.28, gain: 0.12, delay: i * 0.2 });
        });
    },
    invalid() {
        tone({ freq: 150, type: 'square', duration: 0.09, gain: 0.07 });
    },
    tick() {
        tone({ freq: 900, type: 'square', duration: 0.045, gain: 0.05 });
    },
    toggle() {
        tone({ freq: 660, type: 'sine', duration: 0.08, gain: 0.1, sweepTo: 880 });
    },
};

function toggleSound() {
    soundOn = !soundOn;
    soundIcon.textContent = soundOn ? '🔊' : '🔇';
    soundToggleBtn.classList.toggle('muted', !soundOn);
    try { localStorage.setItem(SOUND_KEY, soundOn ? '1' : '0'); } catch (e) { /* ignore */ }
    if (soundOn) sfx.toggle();
}

function loadSoundPref() {
    try {
        if (localStorage.getItem(SOUND_KEY) === '0') soundOn = false;
    } catch (e) { /* ignore */ }
    soundIcon.textContent = soundOn ? '🔊' : '🔇';
    soundToggleBtn.classList.toggle('muted', !soundOn);
}

// ---------------------------------------------------------------------------
// All-time record persistence
// ---------------------------------------------------------------------------
function loadStats() {
    try {
        const raw = localStorage.getItem(STATS_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
            stats.p1 = Number(parsed.p1) || 0;
            stats.p2 = Number(parsed.p2) || 0;
            stats.draws = Number(parsed.draws) || 0;
            stats.games = Number(parsed.games) || 0;
        }
    } catch (e) { /* ignore */ }
}

function saveStats() {
    try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch (e) { /* ignore */ }
}

function renderRecord() {
    if (!recordEl) return;
    recordEl.textContent =
        `All-time - P1 ${stats.p1} · P2 ${stats.p2} · Draws ${stats.draws} · Games ${stats.games}`;
}

// ---------------------------------------------------------------------------
// Pure state helpers (operate on a plain board array so the AI can reuse them)
// ---------------------------------------------------------------------------
function createBoard(cols, rows) {
    return Array.from({ length: rows }, () => Array(cols).fill(null));
}

// Lowest empty row in `col`, or -1 if the column is full.
function getDropRow(board, col) {
    for (let r = 0; r < board.length; r++) {
        if (board[r][col] === null) return r;
    }
    return -1;
}

function dropPiece(board, col, player) {
    const r = getDropRow(board, col);
    if (r === -1) return -1;
    board[r][col] = player;
    return r;
}

function getValidMoves(board) {
    const moves = [];
    for (let c = 0; c < board[0].length; c++) {
        if (getDropRow(board, c) !== -1) moves.push(c);
    }
    return moves;
}

// Returns the contiguous run of cells (>= connectLength) that `player` just
// completed through (r, c), or null if there is no win there.
function checkWinFrom(board, r, c, player) {
    const rows = board.length;
    const cols = board[0].length;
    const need = connectLength;
    const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];

    for (const [dr, dc] of dirs) {
        const cells = [[r, c]];
        for (const sign of [1, -1]) {
            let rr = r + dr * sign;
            let cc = c + dc * sign;
            while (
                rr >= 0 && rr < rows &&
                cc >= 0 && cc < cols &&
                board[rr][cc] === player
            ) {
                cells.push([rr, cc]);
                rr += dr * sign;
                cc += dc * sign;
            }
        }
        if (cells.length >= need) return cells;
    }
    return null;
}

// ---------------------------------------------------------------------------
// AI - difficulty strategies
// ---------------------------------------------------------------------------

// Easy: pick any legal column at random.
function chooseRandomMove(board) {
    const valid = getValidMoves(board);
    return valid[Math.floor(Math.random() * valid.length)];
}

// Medium: take an immediate win, otherwise block the opponent's win,
// otherwise favour the central columns.
function chooseGreedyMove(board) {
    const valid = getValidMoves(board);

    for (const col of valid) {
        const r = dropPiece(board, col, AI_PLAYER);
        const win = checkWinFrom(board, r, col, AI_PLAYER);
        board[r][col] = null;
        if (win) return col;
    }

    for (const col of valid) {
        const r = dropPiece(board, col, HUMAN_PLAYER);
        const win = checkWinFrom(board, r, col, HUMAN_PLAYER);
        board[r][col] = null;
        if (win) return col;
    }

    const center = (board[0].length - 1) / 2;
    const preferred = valid.filter((c) => Math.abs(c - center) <= 1);
    const pool = preferred.length ? preferred : valid;
    return pool[Math.floor(Math.random() * pool.length)];
}

// Hard: negamax-style minimax with alpha-beta pruning.
function minimax(board, depth, alpha, beta, maximizing, lastMoveRef) {
    if (lastMoveRef) {
        const win = checkWinFrom(board, lastMoveRef.r, lastMoveRef.c, lastMoveRef.player);
        if (win) {
            return lastMoveRef.player === AI_PLAYER
                ? { score: 100000 + depth }
                : { score: -100000 - depth };
        }
    }

    const valid = getValidMoves(board);
    if (valid.length === 0) return { score: 0 };
    if (depth === 0) return { score: evaluateBoard(board) };

    const ordered = orderMoves(valid, board[0].length);

    if (maximizing) {
        let bestScore = -Infinity;
        let bestCol = ordered[0];
        for (const col of ordered) {
            const r = dropPiece(board, col, AI_PLAYER);
            const { score } = minimax(board, depth - 1, alpha, beta, false, {
                r, c: col, player: AI_PLAYER,
            });
            board[r][col] = null;

            if (score > bestScore) { bestScore = score; bestCol = col; }
            if (bestScore > alpha) alpha = bestScore;
            if (alpha >= beta) break;
        }
        return { score: bestScore, col: bestCol };
    }

    let bestScore = Infinity;
    let bestCol = ordered[0];
    for (const col of ordered) {
        const r = dropPiece(board, col, HUMAN_PLAYER);
        const { score } = minimax(board, depth - 1, alpha, beta, true, {
            r, c: col, player: HUMAN_PLAYER,
        });
        board[r][col] = null;

        if (score < bestScore) { bestScore = score; bestCol = col; }
        if (bestScore < beta) beta = bestScore;
        if (alpha >= beta) break;
    }
    return { score: bestScore, col: bestCol };
}

// Try the centre columns first for better alpha-beta pruning.
function orderMoves(moves, cols) {
    const center = (cols - 1) / 2;
    return moves.slice().sort((a, b) => Math.abs(a - center) - Math.abs(b - center));
}

// Static evaluation of a non-terminal board from the AI's perspective.
function evaluateBoard(board) {
    const rows = board.length;
    const cols = board[0].length;
    const need = connectLength;
    let score = 0;

    // Nudge the search toward controlling the centre columns.
    const centerCol = Math.floor(cols / 2);
    for (let r = 0; r < rows; r++) {
        if (board[r][centerCol] === AI_PLAYER) score += 3;
        else if (board[r][centerCol] === HUMAN_PLAYER) score -= 3;
    }

    const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            for (const [dr, dc] of dirs) {
                const endR = r + dr * (need - 1);
                const endC = c + dc * (need - 1);
                if (endR < 0 || endR >= rows || endC < 0 || endC >= cols) continue;

                let ai = 0;
                let hu = 0;
                for (let i = 0; i < need; i++) {
                    const v = board[r + dr * i][c + dc * i];
                    if (v === AI_PLAYER) ai++;
                    else if (v === HUMAN_PLAYER) hu++;
                }

                if (ai > 0 && hu > 0) continue; // blocked window - worthless
                if (ai === need) score += 10000;
                else if (ai === need - 1) score += 100;
                else if (ai === need - 2 && need >= 4) score += 10;

                if (hu === need) score -= 10000;
                else if (hu === need - 1) score -= 120;
                else if (hu === need - 2 && need >= 4) score -= 12;
            }
        }
    }

    return score;
}

// Pick a search depth that keeps the hardest board size responsive.
function getSearchDepth(cols, rows) {
    const cells = cols * rows;
    let depth = cells <= 25 ? 8 : cells <= 42 ? 6 : 5;
    if (connectLength >= 5) depth = Math.max(4, depth - 1);
    return depth;
}

function chooseStrategicMove(board) {
    const cols = board[0].length;
    const rows = board.length;
    const depth = getSearchDepth(cols, rows);

    const valid = orderMoves(getValidMoves(board), cols);
    let bestScore = -Infinity;
    let bestCol = valid[0];
    let alpha = -Infinity;
    const beta = Infinity;

    for (const col of valid) {
        const r = dropPiece(board, col, AI_PLAYER);
        const { score } = minimax(board, depth - 1, alpha, beta, false, {
            r, c: col, player: AI_PLAYER,
        });
        board[r][col] = null;

        if (score > bestScore) {
            bestScore = score;
            bestCol = col;
        }
        if (bestScore > alpha) alpha = bestScore;
    }
    return bestCol;
}

function chooseAIMove(board) {
    switch (difficulty) {
        case 'random': return chooseRandomMove(board);
        case 'strategic': return chooseStrategicMove(board);
        default: return chooseGreedyMove(board);
    }
}

// How long the AI "thinks" before replying. Longer delays on harder
// difficulties sell the illusion of a deeper search.
function getAIThinkDelay() {
    const ranges = {
        random: [100, 900],
        greedy: [500, 1500],
        strategic: [800, 2100],
    };
    const [min, max] = ranges[difficulty] || ranges.greedy;
    return min + Math.random() * (max - min);
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
}

function buildBoard() {
    const { cols, rows } = game;
    const width = MARGIN * 2 + cols * CELL;
    const height = MARGIN * 2 + rows * CELL;

    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.innerHTML = '';

    // Board panel
    svg.appendChild(svgEl('rect', {
        class: 'fr-board-bg',
        x: 0, y: 0, width, height, rx: 14,
    }));

    // Holes + disc placeholders
    cellEls = [];
    for (let r = 0; r < rows; r++) {
        cellEls[r] = [];
        for (let c = 0; c < cols; c++) {
            const cx = MARGIN + c * CELL + CELL / 2;
            const cy = MARGIN + (rows - 1 - r) * CELL + CELL / 2;

            svg.appendChild(svgEl('circle', {
                class: 'fr-hole', cx, cy, r: HOLE_R,
            }));

            const disc = svgEl('circle', {
                class: 'fr-disc',
                id: `disc-${r}-${c}`,
                cx, cy, r: DISC_R,
            });
            svg.appendChild(disc);
            cellEls[r][c] = disc;
        }
    }

    // Dashed ring that marks the most recent drop
    lastMoveRing = svgEl('circle', {
        class: 'fr-last-move',
        cx: 0, cy: 0, r: DISC_R + 6,
    });
    svg.appendChild(lastMoveRing);

    // Hover preview disc (above the holes, below the hit areas)
    previewDisc = svgEl('circle', {
        class: 'fr-disc fr-preview',
        cx: MARGIN + CELL / 2,
        cy: MARGIN + CELL / 2,
        r: DISC_R,
    });
    svg.appendChild(previewDisc);

    // Transparent column hit areas on top of everything
    for (let c = 0; c < cols; c++) {
        const hit = svgEl('rect', {
            class: 'fr-column-hit',
            x: MARGIN + c * CELL,
            y: 0,
            width: CELL,
            height,
        });
        hit.addEventListener('click', () => onColumnClick(c));
        hit.addEventListener('mouseenter', () => onColumnHover(c));
        hit.addEventListener('mouseleave', onColumnLeave);
        svg.appendChild(hit);
    }
}

function renderMoveResult(row, col, player, winningCells) {
    const disc = cellEls[row][col];
    disc.setAttribute('class', `fr-disc owner-${player}`);

    if (winningCells) {
        for (const [r, c] of winningCells) {
            const el = cellEls[r][c];
            el.setAttribute('class', `${el.getAttribute('class')} winning`);
        }
    }
}

function renderLastMove() {
    if (!lastMoveRing) return;

    if (!lastMove) {
        lastMoveRing.setAttribute('class', 'fr-last-move');
        return;
    }

    const { row, col, player } = lastMove;
    lastMoveRing.setAttribute('cx', MARGIN + col * CELL + CELL / 2);
    lastMoveRing.setAttribute('cy', MARGIN + (game.rows - 1 - row) * CELL + CELL / 2);
    lastMoveRing.setAttribute('r', DISC_R + 6);
    lastMoveRing.setAttribute('class', `fr-last-move owner-${player} visible`);
}

function clearWinHighlights() {
    for (let r = 0; r < cellEls.length; r++) {
        for (let c = 0; c < cellEls[r].length; c++) {
            const el = cellEls[r][c];
            const cls = el.getAttribute('class') || '';
            if (cls.indexOf('winning') !== -1) {
                el.setAttribute('class', cls.replace(/\s*winning/g, '').trim());
            }
        }
    }
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
// Turn timer
// ---------------------------------------------------------------------------
function startTurnTimer() {
    stopTurnTimer();

    // No timer for the AI - its think delay is what paces the turn.
    if (!timerSeconds || gameOver || isAITurn()) {
        timerBar.classList.remove('active');
        return;
    }

    timerDeadline = performance.now() + timerSeconds * 1000;
    lastTickSecond = -1;
    timerBar.classList.add('active');
    timerFill.style.width = '100%';
    timerFill.className = 'ok';
    turnTimerId = setInterval(tickTimer, 100);
}

function stopTurnTimer() {
    if (turnTimerId) {
        clearInterval(turnTimerId);
        turnTimerId = null;
    }
    timerBar.classList.remove('active');
}

function tickTimer() {
    if (gameOver) { stopTurnTimer(); return; }

    const remaining = Math.max(0, timerDeadline - performance.now());
    const pct = (remaining / (timerSeconds * 1000)) * 100;

    timerFill.style.width = pct + '%';
    timerFill.className = pct > 50 ? 'ok' : pct > 25 ? 'warn' : 'danger';

    const secs = Math.ceil(remaining / 1000);
    if (secs <= 3 && secs > 0 && secs !== lastTickSecond) {
        lastTickSecond = secs;
        sfx.tick();
    }

    if (remaining <= 0) {
        stopTurnTimer();
        handleTimeout();
    }
}

function handleTimeout() {
    if (gameOver) return;
    const valid = getValidMoves(game.board);
    if (!valid.length) return;

    sfx.invalid();
    const col = valid[Math.floor(Math.random() * valid.length)];
    playMove(col, true);
}

// ---------------------------------------------------------------------------
// Game flow
// ---------------------------------------------------------------------------
function isAITurn() {
    return mode === 'pvai' && currentPlayer === AI_PLAYER && !gameOver;
}

function onColumnClick(col) {
    if (aiBusy || gameOver || isAITurn()) return;
    if (getDropRow(game.board, col) === -1) { sfx.invalid(); return; }
    playMove(col, false);
}

function showPreview(col) {
    if (!previewDisc) return;
    previewDisc.setAttribute('cx', MARGIN + col * CELL + CELL / 2);
    previewDisc.setAttribute('cy', MARGIN + CELL / 2);
    previewDisc.setAttribute('class', `fr-disc fr-preview visible owner-${currentPlayer}`);
}

function onColumnHover(col) {
    if (aiBusy || gameOver || isAITurn()) return;
    if (getDropRow(game.board, col) === -1) return;
    aimCol = col;
    showPreview(col);
}

function onColumnLeave() {
    aimCol = null;
    if (!previewDisc) return;
    previewDisc.setAttribute('class', 'fr-disc fr-preview');
}

function playMove(col, viaAI) {
    const player = currentPlayer;
    const row = dropPiece(game.board, col, player);
    if (row === -1) return;

    onColumnLeave();

    lastMove = { row, col, player };

    const winningCells = checkWinFrom(game.board, row, col, player);
    renderMoveResult(row, col, player, winningCells);
    renderLastMove();
    sfx.drop(player);

    if (winningCells) {
        endGame(player);
        return;
    }

    if (getValidMoves(game.board).length === 0) {
        endGame(null);
        return;
    }

    currentPlayer = player === 1 ? 2 : 1;
    updateStatsUI();
    startTurnTimer();

    if (isAITurn()) scheduleAITurn();
    void viaAI;
}

function scheduleAITurn() {
    if (gameOver) return;
    aiBusy = true;
    updateStatsUI();

    setTimeout(() => {
        if (gameOver || !isAITurn()) {
            aiBusy = false;
            return;
        }
        const col = chooseAIMove(game.board);
        aiBusy = false;
        playMove(col, true);
    }, getAIThinkDelay());
}

function endGame(winner) {
    gameOver = true;
    aiBusy = false;
    stopTurnTimer();

    if (winner !== null) scores[winner - 1] += 1;

    // All-time record
    stats.games += 1;
    if (winner === null) stats.draws += 1;
    else if (winner === 1) stats.p1 += 1;
    else stats.p2 += 1;
    saveStats();
    renderRecord();

    let message;
    if (winner === null) {
        message = 'DRAW';
        statusEl.className = 'tie-message';
        sfx.draw();
    } else if (winner === 1) {
        message = mode === 'pvai' ? 'YOU WIN' : 'PLAYER 1 WINS';
        statusEl.className = 'win-message';
        sfx.win();
        launchConfetti(1);
    } else {
        message = mode === 'pvai' ? 'AI WINS' : 'PLAYER 2 WINS';
        statusEl.className = 'win-message';
        if (mode === 'pvai') sfx.lose(); else sfx.win();
        launchConfetti(2);
    }

    statusEl.textContent = message;
    updateStatsUI();

    gameOverMessageEl.textContent = message;
    gameOverScoreEl.textContent = `${scores[0]} - ${scores[1]}`;
    gameOverOverlay.classList.add('show');
    onColumnLeave();
}

function updateStatsUI() {
    score1El.textContent = scores[0];
    score2El.textContent = scores[1];
    if (gameOver) return;

    if (mode === 'pvai') {
        if (aiBusy) statusEl.textContent = 'AI is thinking…';
        else statusEl.textContent = currentPlayer === 1 ? 'Your turn' : "AI's turn";
    } else {
        statusEl.textContent = `Player ${currentPlayer}'s turn`;
    }
}

function resetGame() {
    const [cols, rows] = boardSizeSelect.value.split('x').map(Number);

    game = { cols, rows, board: createBoard(cols, rows) };
    currentPlayer = 1;
    gameOver = false;
    aiBusy = false;
    lastMove = null;
    aimCol = null;

    stopTurnTimer();
    clearConfetti();
    statusEl.className = '';
    gameOverOverlay.classList.remove('show');

    buildBoard();
    renderLastMove();
    updateStatsUI();
    renderRecord();
    startTurnTimer();
}

function setMode(newMode) {
    mode = newMode;

    pvpBtn.className = mode === 'pvp' ? 'btn' : 'btn btn-secondary';
    pvaiBtn.className = mode === 'pvai' ? 'btn' : 'btn btn-secondary';
    difficultyLabel.classList.toggle('hidden', mode !== 'pvai');
    player2LabelEl.textContent = mode === 'pvai' ? 'AI' : 'Player 2';

    // Switching opponent type starts a fresh session score.
    scores = [0, 0];
    resetGame();
}

// ---------------------------------------------------------------------------
// Keyboard control
// ---------------------------------------------------------------------------
function moveAim(delta) {
    if (aiBusy || gameOver || isAITurn()) return;

    const valid = getValidMoves(game.board);
    if (!valid.length) return;

    if (aimCol === null || valid.indexOf(aimCol) === -1) {
        aimCol = valid[Math.floor((valid.length - 1) / 2)];
    } else {
        const idx = valid.indexOf(aimCol);
        let next = idx + delta;
        if (next < 0) next = 0;
        if (next >= valid.length) next = valid.length - 1;
        aimCol = valid[next];
    }

    showPreview(aimCol);
}

function dropAim() {
    if (aiBusy || gameOver || isAITurn()) return;
    if (aimCol === null) { moveAim(0); return; }
    if (getDropRow(game.board, aimCol) === -1) { sfx.invalid(); return; }
    playMove(aimCol, false);
}

function onKeyDown(e) {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

    switch (e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            moveAim(-1);
            break;
        case 'ArrowRight':
            e.preventDefault();
            moveAim(1);
            break;
        case 'ArrowDown':
        case 'Enter':
        case ' ':
            e.preventDefault();
            dropAim();
            break;
        case 'r':
        case 'R':
            resetGame();
            break;
        case 'm':
        case 'M':
            toggleSound();
            break;
        default:
            break;
    }
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
resetBtn.addEventListener('click', resetGame);
playAgainBtn.addEventListener('click', resetGame);
pvpBtn.addEventListener('click', () => setMode('pvp'));
pvaiBtn.addEventListener('click', () => setMode('pvai'));
soundToggleBtn.addEventListener('click', toggleSound);

boardSizeSelect.addEventListener('change', () => {
    scores = [0, 0];
    resetGame();
});

connectSelect.addEventListener('change', () => {
    connectLength = Number(connectSelect.value) || 4;
    scores = [0, 0];
    resetGame();
});

difficultySelect.addEventListener('change', () => {
    difficulty = difficultySelect.value;
    resetGame();
});

timerSelect.addEventListener('change', () => {
    timerSeconds = Number(timerSelect.value) || 0;
    startTurnTimer();
});

document.addEventListener('keydown', onKeyDown);

window.addEventListener('resize', () => {
    if (confettiParticles.length) resizeConfettiCanvas();
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
loadStats();
loadSoundPref();
connectLength = Number(connectSelect.value) || 4;
timerSeconds = Number(timerSelect.value) || 0;
difficulty = difficultySelect.value;
renderRecord();
setMode(mode);