// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// ---------------------------------------------------------------------------
// DOM
// ---------------------------------------------------------------------------
const mazeBoard = document.getElementById('maze-board');
const movesEl = document.getElementById('moves');
const timerEl = document.getElementById('timer');
const gemsEl = document.getElementById('gems');
const statusEl = document.getElementById('status');
const resetBtn = document.getElementById('reset');
const hintBtn = document.getElementById('hint-btn');
const playAgainBtn = document.getElementById('play-again');
const overlay = document.getElementById('game-over-overlay');
const overlayMessage = document.getElementById('game-over-message');
const overlayDetail = document.getElementById('game-over-detail');
const soundToggleBtn = document.getElementById('sound-toggle');
const sizeSelect = document.getElementById('maze-size');
const difficultySelect = document.getElementById('difficulty');
const fogToggle = document.getElementById('fog-toggle');

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------
// extraOpenings: how many additional passages to carve (scaled by maze size).
// gemCount:      how many gems must be collected before the exit unlocks.
const DIFFICULTY = {
    easy: { extraOpenings: 6, gemCount: 3 },
    normal: { extraOpenings: 3, gemCount: 5 },
    hard: { extraOpenings: 0, gemCount: 7 },
};

const DIRS = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
];

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let mazeSize = parseInt(sizeSelect.value, 10);
let difficultyKey = difficultySelect.value;
let fogEnabled = fogToggle.checked;

let maze = [];                       // 2D array: 0 = path, 1 = wall
let gems = [];                       // [{ x, y, collected }]
let player = { x: 1, y: 0 };
let exitCell = { x: 0, y: 0 };
let trailSet = new Set();            // visited cells, as "x,y" strings
let moves = 0;
let timeSeconds = 0;
let timerInterval = null;

let gameActive = false;
let gameCompleted = false;
let started = false;
let exitUnlocked = false;

let hintTimeoutId = null;
let hintedCells = [];

// ---------------------------------------------------------------------------
// Sound (Web Audio, synthesized - no assets needed)
// ---------------------------------------------------------------------------
let audioCtx = null;
let soundMuted = localStorage.getItem('maze-sound-muted') === 'true';

function ensureAudioCtx() {
    if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        audioCtx = new Ctx();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

function playTone(freq, duration, { type = 'sine', gain = 0.15, delay = 0 } = {}) {
    if (soundMuted) return;
    const ctx = ensureAudioCtx();
    if (!ctx) return;

    const startTime = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
}

function playMoveSound() { playTone(240, 0.05, { type: 'sine', gain: 0.06 }); }
function playBumpSound() { playTone(110, 0.12, { type: 'sawtooth', gain: 0.08 }); }
function playGemSound() {
    playTone(880, 0.10, { type: 'triangle', gain: 0.14 });
    playTone(1320, 0.13, { type: 'triangle', gain: 0.12, delay: 0.07 });
}
function playUnlockSound() {
    [523.25, 659.25, 783.99].forEach((f, i) =>
        playTone(f, 0.16, { type: 'triangle', gain: 0.13, delay: i * 0.08 }));
}
function playWinSound() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
        playTone(f, 0.22, { type: 'triangle', gain: 0.16, delay: i * 0.11 }));
}
function playHintSound() { playTone(660, 0.09, { type: 'sine', gain: 0.1 }); }

function updateSoundIcon() {
    soundToggleBtn.innerHTML = soundMuted
        ? '<i class="fas fa-volume-mute"></i>'
        : '<i class="fas fa-volume-up"></i>';
    soundToggleBtn.setAttribute('aria-pressed', String(soundMuted));
    soundToggleBtn.title = soundMuted ? 'Sound off (click to enable)' : 'Sound on (click to mute)';
}

soundToggleBtn.addEventListener('click', () => {
    soundMuted = !soundMuted;
    localStorage.setItem('maze-sound-muted', String(soundMuted));
    updateSoundIcon();
    if (!soundMuted) {
        ensureAudioCtx();
        playTone(440, 0.08, { gain: 0.1 });
    }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
}

// ---------------------------------------------------------------------------
// Maze generation (randomized Prim's, then carve extra openings)
// ---------------------------------------------------------------------------
function generateMaze(size, extraOpenings) {
    const grid = Array.from({ length: size }, () => Array(size).fill(1));

    const startX = Math.floor(Math.random() * (size - 1)) | 1;
    const startY = Math.floor(Math.random() * (size - 1)) | 1;
    grid[startY][startX] = 0;

    const frontier = [];
    const step = [{ x: 0, y: -2 }, { x: 2, y: 0 }, { x: 0, y: 2 }, { x: -2, y: 0 }];

    for (const d of step) {
        const nx = startX + d.x, ny = startY + d.y;
        if (nx > 0 && nx < size - 1 && ny > 0 && ny < size - 1) {
            frontier.push({ x: nx, y: ny, px: startX + d.x / 2, py: startY + d.y / 2 });
        }
    }

    while (frontier.length) {
        const idx = Math.floor(Math.random() * frontier.length);
        const { x, y, px, py } = frontier.splice(idx, 1)[0];

        if (grid[y][x] === 1) {
            grid[y][x] = 0;
            grid[py][px] = 0;
            for (const d of step) {
                const nx = x + d.x, ny = y + d.y;
                if (nx > 0 && nx < size - 1 && ny > 0 && ny < size - 1 && grid[ny][nx] === 1) {
                    frontier.push({ x: nx, y: ny, px: x + d.x / 2, py: y + d.y / 2 });
                }
            }
        }
    }

    // Carve extra openings (adds loops, makes the maze less "tree-like").
    const attempts = extraOpenings * size;
    for (let i = 0; i < attempts; i++) {
        const x = 1 + Math.floor(Math.random() * (size - 2));
        const y = 1 + Math.floor(Math.random() * (size - 2));
        if (grid[y][x] !== 1) continue;

        let pathNeighbors = 0;
        for (const n of DIRS) {
            const nx = x + n.x, ny = y + n.y;
            if (nx >= 0 && nx < size && ny >= 0 && ny < size && grid[ny][nx] === 0) {
                pathNeighbors++;
            }
        }
        if (pathNeighbors === 2) grid[y][x] = 0;
    }

    // Force the entrance open and guarantee it connects to the maze interior.
    grid[0][1] = 0;
    if (grid[1][1] === 1) grid[1][1] = 0;

    return grid;
}

// BFS the whole maze and return the farthest reachable cell + distance map.
function bfsFarthest(grid, start) {
    const size = grid.length;
    const dist = Array.from({ length: size }, () => Array(size).fill(-1));
    const q = [{ x: start.x, y: start.y }];
    dist[start.y][start.x] = 0;

    let farthest = { x: start.x, y: start.y };
    let farDist = 0;

    while (q.length) {
        const cur = q.shift();
        const d = dist[cur.y][cur.x];

        if (d > farDist) {
            farDist = d;
            farthest = { x: cur.x, y: cur.y };
        }

        for (const dir of DIRS) {
            const nx = cur.x + dir.x, ny = cur.y + dir.y;
            if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
            if (grid[ny][nx] === 1 || dist[ny][nx] !== -1) continue;
            dist[ny][nx] = d + 1;
            q.push({ x: nx, y: ny });
        }
    }

    return { farthest, dist };
}

// Place gems on path cells, at least `minDist` steps from the start.
function placeGems(grid, count, exclude, minDist, distMap) {
    const size = grid.length;
    const candidates = [];
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (grid[y][x] !== 0) continue;
            if (exclude.some(e => e.x === x && e.y === y)) continue;
            if (distMap[y][x] < minDist) continue;
            candidates.push({ x, y, collected: false });
        }
    }
    shuffle(candidates);
    return candidates.slice(0, count);
}

// BFS shortest path between two cells.
function bfsPath(from, target) {
    const size = mazeSize;
    const visited = Array.from({ length: size }, () => Array(size).fill(false));
    const parent = Array.from({ length: size }, () => Array(size).fill(null));
    const q = [{ x: from.x, y: from.y }];
    visited[from.y][from.x] = true;

    while (q.length) {
        const cur = q.shift();
        if (cur.x === target.x && cur.y === target.y) break;

        for (const d of DIRS) {
            const nx = cur.x + d.x, ny = cur.y + d.y;
            if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
            if (visited[ny][nx] || maze[ny][nx] === 1) continue;
            visited[ny][nx] = true;
            parent[ny][nx] = cur;
            q.push({ x: nx, y: ny });
        }
    }

    if (!parent[target.y][target.x] && !(target.x === from.x && target.y === from.y)) {
        return [];
    }

    const path = [];
    let cur = { x: target.x, y: target.y };
    while (cur) {
        path.push(cur);
        if (cur.x === from.x && cur.y === from.y) break;
        cur = parent[cur.y][cur.x];
    }
    return path.reverse();
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function getFogRadius() {
    return Math.max(3, Math.ceil(mazeSize / 6));
}

function computeCellSize() {
    const wrap = mazeBoard.parentElement;
    const available = wrap.clientWidth - 32;
    const base = Math.floor(available / mazeSize) - 2;
    const clamped = Math.max(12, Math.min(36, base));
    mazeBoard.style.setProperty('--cell-size', clamped + 'px');
}

function isFogged(x, y) {
    if (!fogEnabled || gameCompleted) return false;
    const radius = getFogRadius();
    return Math.max(Math.abs(x - player.x), Math.abs(y - player.y)) > radius;
}

function renderMaze() {
    computeCellSize();
    mazeBoard.style.gridTemplateColumns = `repeat(${mazeSize}, var(--cell-size))`;
    mazeBoard.innerHTML = '';

    for (let y = 0; y < mazeSize; y++) {
        for (let x = 0; x < mazeSize; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.x = x;
            cell.dataset.y = y;

            const fogged = isFogged(x, y);

            if (maze[y][x] === 1) cell.classList.add('wall');
            else cell.classList.add('path');

            if (!fogged && trailSet.has(`${x},${y}`)) cell.classList.add('trail');

            if (!fogged && gems.some(g => !g.collected && g.x === x && g.y === y)) {
                cell.classList.add('gem');
            }

            if (!fogged && exitCell.x === x && exitCell.y === y) {
                cell.classList.add('exit');
                if (!exitUnlocked) cell.classList.add('locked');
            }

            if (player.x === x && player.y === y) cell.classList.add('player');
            if (fogged) cell.classList.add('fogged');

            mazeBoard.appendChild(cell);
        }
    }

    movesEl.textContent = moves;
    timerEl.textContent = formatTime(timeSeconds);
    const collected = gems.filter(g => g.collected).length;
    gemsEl.textContent = `${collected} / ${gems.length}`;
}

function updateStatus(text) {
    statusEl.textContent = text;
}

function refreshGemStatus() {
    if (exitUnlocked) {
        updateStatus('Exit unlocked! Head to the red goal');
        return;
    }
    const remaining = gems.filter(g => !g.collected).length;
    if (remaining === gems.length) {
        updateStatus(`Collect all ${gems.length} gems`);
    } else if (remaining === 0) {
        updateStatus('Exit unlocked!');
    } else {
        updateStatus(`${remaining} gem${remaining === 1 ? '' : 's'} remaining`);
    }
}

// ---------------------------------------------------------------------------
// Timer
// ---------------------------------------------------------------------------
function startTimer() {
    stopTimer();
    timerInterval = setInterval(() => {
        timeSeconds++;
        timerEl.textContent = formatTime(timeSeconds);
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// ---------------------------------------------------------------------------
// Game flow
// ---------------------------------------------------------------------------
function initMaze() {
    overlay.classList.remove('show');
    stopTimer();
    clearHint();

    const preset = DIFFICULTY[difficultyKey] || DIFFICULTY.normal;

    maze = generateMaze(mazeSize, preset.extraOpenings);

    // Player entrance is always at (1, 0) - the top edge opening.
    player = { x: 1, y: 0 };
    trailSet = new Set(['1,0']);

    // Exit auto-placed at the farthest reachable cell - guarantees a long,
    // always-solvable path no matter how the maze was carved.
    const { farthest, dist } = bfsFarthest(maze, player);
    exitCell = farthest;

    // Gems are placed away from the entrance and never overlap start / exit.
    gems = placeGems(maze, preset.gemCount, [player, exitCell], 4, dist);

    moves = 0;
    timeSeconds = 0;
    gameActive = true;
    gameCompleted = false;
    started = false;
    exitUnlocked = false;

    refreshGemStatus();
    renderMaze();
}

function movePlayer(dx, dy) {
    if (!gameActive || gameCompleted) return;

    const nx = player.x + dx;
    const ny = player.y + dy;

    if (nx < 0 || ny < 0 || nx >= mazeSize || ny >= mazeSize) return;

    if (maze[ny][nx] === 1) {
        playBumpSound();
        return;
    }

    player.x = nx;
    player.y = ny;
    moves++;
    trailSet.add(`${nx},${ny}`);

    if (!started) {
        startTimer();
        started = true;
    }

    playMoveSound();

    // Gem pickup
    const gem = gems.find(g => !g.collected && g.x === nx && g.y === ny);
    if (gem) {
        gem.collected = true;
        playGemSound();

        const remaining = gems.filter(g => !g.collected).length;
        if (remaining === 0 && !exitUnlocked) {
            exitUnlocked = true;
            playUnlockSound();
        }
        refreshGemStatus();
    }

    renderMaze();

    // Win check
    if (exitUnlocked && player.x === exitCell.x && player.y === exitCell.y) {
        endGame();
    }
}

function endGame() {
    gameCompleted = true;
    gameActive = false;
    stopTimer();
    playWinSound();

    const key = `maze-best-${mazeSize}-${difficultyKey}`;
    const prev = parseInt(localStorage.getItem(key) || '0', 10);
    const isNewBest = !prev || moves < prev;
    if (isNewBest) localStorage.setItem(key, String(moves));

    const timeStr = formatTime(timeSeconds);
    const bestSuffix = isNewBest ? ' · New Best!' : '';

    overlayMessage.textContent = 'Maze Solved!';
    overlayDetail.textContent = `${moves} move${moves === 1 ? '' : 's'} · ${timeStr}${bestSuffix}`;
    overlay.classList.add('show');

    updateStatus('Solved!');
    renderMaze();
}

// ---------------------------------------------------------------------------
// Hint
// ---------------------------------------------------------------------------
function clearHint() {
    if (hintTimeoutId) {
        clearTimeout(hintTimeoutId);
        hintTimeoutId = null;
    }
    hintedCells.forEach(c => c.classList.remove('hint'));
    hintedCells = [];
}

function flashPath(path) {
    clearHint();
    for (const p of path) {
        if (p.x === player.x && p.y === player.y) continue;
        if (p.x === exitCell.x && p.y === exitCell.y) continue;
        const el = mazeBoard.querySelector(`.cell[data-x="${p.x}"][data-y="${p.y}"]`);
        if (el) {
            el.classList.add('hint');
            hintedCells.push(el);
        }
    }
    hintTimeoutId = setTimeout(() => {
        hintedCells.forEach(c => c.classList.remove('hint'));
        hintedCells = [];
        hintTimeoutId = null;
    }, 2200);
}

hintBtn.addEventListener('click', () => {
    if (!gameActive || gameCompleted) return;
    playHintSound();

    if (exitUnlocked) {
        flashPath(bfsPath(player, exitCell));
        return;
    }

    // Route to the nearest uncollected gem.
    let bestPath = null;
    for (const g of gems) {
        if (g.collected) continue;
        const path = bfsPath(player, g);
        if (path.length && (!bestPath || path.length < bestPath.length)) {
            bestPath = path;
        }
    }
    if (bestPath) flashPath(bestPath);
});

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
        e.preventDefault();
    }

    switch (key) {
        case 'w': case 'arrowup': movePlayer(0, -1); break;
        case 's': case 'arrowdown': movePlayer(0, 1); break;
        case 'a': case 'arrowleft': movePlayer(-1, 0); break;
        case 'd': case 'arrowright': movePlayer(1, 0); break;
    }
});

document.querySelectorAll('.dpad-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const dir = btn.dataset.dir;
        if (dir === 'up') movePlayer(0, -1);
        else if (dir === 'down') movePlayer(0, 1);
        else if (dir === 'left') movePlayer(-1, 0);
        else if (dir === 'right') movePlayer(1, 0);
    });
});

resetBtn.addEventListener('click', initMaze);
playAgainBtn.addEventListener('click', initMaze);

sizeSelect.addEventListener('change', () => {
    mazeSize = parseInt(sizeSelect.value, 10);
    initMaze();
});

difficultySelect.addEventListener('change', () => {
    difficultyKey = difficultySelect.value;
    initMaze();
});

fogToggle.addEventListener('change', () => {
    fogEnabled = fogToggle.checked;
    renderMaze();
});

window.addEventListener('resize', renderMaze);

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
updateSoundIcon();
initMaze();