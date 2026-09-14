// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

const boardSizeSelect = document.getElementById('board-size');
const difficultySelect = document.getElementById('difficulty');
const categorySelect = document.getElementById('category');
const letterGrid = document.getElementById('letter-grid');
const traceLayer = document.getElementById('trace-layer');
const wordListEl = document.getElementById('word-list');
const statusEl = document.getElementById('status');
const foundCountEl = document.getElementById('found-count');
const timerEl = document.getElementById('timer');
const resetBtn = document.getElementById('reset');
const playAgainBtn = document.getElementById('play-again');
const overlay = document.getElementById('game-over-overlay');
const overlayMessage = document.getElementById('game-over-message');
const overlayDetail = document.getElementById('game-over-detail');
const soundToggleBtn = document.getElementById('sound-toggle');

const SVG_NS = 'http://www.w3.org/2000/svg';

// Number of hidden words per board size
const WORD_COUNT = { 8: 6, 12: 8, 15: 10 };

// How many extra candidate words to consider so that failed placements
// (overlapping conflicts, etc.) can be swapped out for other words.
const CANDIDATE_MULTIPLIER = 5;

// Words shorter than this are never placed (keeps puzzles interesting).
const MIN_WORD_LEN = 3;

// Colors assigned to each found word (in order)
const WORD_COLORS = [
    { stroke: '#ef4444', fill: 'rgba(239, 68, 68, 0.28)' },
    { stroke: '#4ade80', fill: 'rgba(74, 222, 128, 0.28)' },
    { stroke: '#60a5fa', fill: 'rgba(96, 165, 250, 0.28)' },
    { stroke: '#fbbf24', fill: 'rgba(251, 191, 36, 0.28)' },
    { stroke: '#a78bfa', fill: 'rgba(167, 139, 250, 0.28)' },
    { stroke: '#f472b6', fill: 'rgba(244, 114, 182, 0.28)' },
    { stroke: '#2dd4bf', fill: 'rgba(45, 212, 191, 0.28)' },
    { stroke: '#fb923c', fill: 'rgba(251, 146, 60, 0.28)' },
    { stroke: '#a3e635', fill: 'rgba(163, 230, 53, 0.28)' },
    { stroke: '#38bdf8', fill: 'rgba(56, 189, 248, 0.28)' },
];

// All 8 possible placement directions (includes reversed words).
const ALL_DIRECTIONS = [
    [0, 1], [0, -1], [1, 0], [-1, 0],
    [1, 1], [1, -1], [-1, 1], [-1, -1],
];

// Easy mode: only forward reads (left-to-right, top-to-bottom, diagonal ↘).
const FORWARD_DIRECTIONS = [
    [0, 1], [1, 0], [1, 1],
];

// Difficulty presets: which directions are allowed, and whether words may
// share cells with each other.
const DIFFICULTY = {
    easy: { directions: FORWARD_DIRECTIONS, allowOverlap: false },
    normal: { directions: ALL_DIRECTIONS, allowOverlap: false },
    hard: { directions: ALL_DIRECTIONS, allowOverlap: true },
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let wordBank = {};
let gridSize = 8;
let grid = [];             // 2D array of letters
let placedWords = [];      // [{ word, cells: [{r,c}...], found, colorIdx }]
let foundWords = new Set();
let cellEls = [];          // 2D array of DOM elements

let isDragging = false;
let startCell = null;
let direction = null;
let currentPath = [];
let activePathEl = null;

let timerStart = 0;
let timerInterval = null;
let gameActive = false;

let audioCtx = null;
let soundMuted = localStorage.getItem('wordsearch-sound-muted') === 'true';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function uniqueWords(list) {
    return Array.from(new Set(list));
}

// Every word from every category, flattened and deduped.
function allWords() {
    return uniqueWords(Object.values(wordBank).flat());
}

// Only keep words that physically fit on an n x n board.
function wordsThatFit(list, n) {
    return list.filter((w) => {
        if (typeof w !== 'string') return false;
        const len = w.length;
        return len >= MIN_WORD_LEN && len <= n;
    });
}

// ---------------------------------------------------------------------------
// Bootstrapping
// ---------------------------------------------------------------------------
async function loadWords() {
    try {
        const res = await fetch('words.json');
        wordBank = await res.json();
        populateCategories();
        startNewPuzzle();
    } catch (err) {
        statusEl.textContent = 'Could not load word list.';
        console.error('Failed to load words.json', err);
    }
}

function populateCategories() {
    const categories = Object.keys(wordBank);
    const previous = categorySelect.value;

    categorySelect.innerHTML = '';

    const randomOpt = document.createElement('option');
    randomOpt.value = 'random';
    randomOpt.textContent = 'Random';
    categorySelect.appendChild(randomOpt);

    categories.forEach((cat) => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        categorySelect.appendChild(opt);
    });

    if (categories.includes(previous)) {
        categorySelect.value = previous;
    } else {
        categorySelect.value = 'random';
    }
}

// ---------------------------------------------------------------------------
// Puzzle generation
// ---------------------------------------------------------------------------
function createEmptyGrid(n) {
    return Array.from({ length: n }, () => Array(n).fill(null));
}

// Returns a shuffled list of candidate words that fit the board.
// If a specific category is selected but doesn't have enough fitting words,
// it is topped up with words from the other categories.
function pickCandidates(n) {
    const target = WORD_COUNT[n] || 6;
    const wanted = target * CANDIDATE_MULTIPLIER;

    const selected = categorySelect.value;
    let pool;

    if (selected === 'random' || !wordBank[selected]) {
        pool = wordsThatFit(allWords(), n);
    } else {
        pool = wordsThatFit(uniqueWords(wordBank[selected] || []), n);

        if (pool.length < wanted) {
            const extras = wordsThatFit(allWords(), n).filter(
                (w) => !pool.includes(w)
            );
            shuffleArray(extras);
            pool = pool.concat(extras);
        }
    }

    shuffleArray(pool);
    return pool.slice(0, wanted);
}

// Attempt to place `word` on `grid2D`.
//   - `directions`   : array of [dr, dc] vectors to try.
//   - `allowOverlap` : when false, every target cell must be empty.
//                      when true,  a filled cell is only rejected if its
//                                  existing letter doesn't match.
// Returns the list of cells on success, or null if no position was found.
function tryPlaceWord(grid2D, word, n, directions, allowOverlap) {
    const upper = word.toUpperCase();
    const len = upper.length;

    for (let attempt = 0; attempt < 500; attempt++) {
        const [dr, dc] = directions[Math.floor(Math.random() * directions.length)];
        const r = Math.floor(Math.random() * n);
        const c = Math.floor(Math.random() * n);

        const endR = r + dr * (len - 1);
        const endC = c + dc * (len - 1);
        if (endR < 0 || endR >= n || endC < 0 || endC >= n) continue;

        let fits = true;
        for (let i = 0; i < len; i++) {
            const rr = r + dr * i;
            const cc = c + dc * i;
            const existing = grid2D[rr][cc];
            if (existing !== null) {
                // If overlaps are disabled, any filled cell kills the placement.
                // Otherwise the shared cell must have the same letter.
                if (!allowOverlap || existing !== upper[i]) {
                    fits = false;
                    break;
                }
            }
        }
        if (!fits) continue;

        const cells = [];
        for (let i = 0; i < len; i++) {
            const rr = r + dr * i;
            const cc = c + dc * i;
            grid2D[rr][cc] = upper[i];
            cells.push({ r: rr, c: cc });
        }
        return cells;
    }
    return null;
}

function buildPuzzle() {
    const n = gridSize;
    const target = WORD_COUNT[n] || 6;

    const preset = DIFFICULTY[difficultySelect.value] || DIFFICULTY.normal;
    const { directions, allowOverlap } = preset;

    const candidates = pickCandidates(n);

    const grid2D = createEmptyGrid(n);
    const placements = [];

    for (const w of candidates) {
        if (placements.length >= target) break;
        if (w.length > n) continue;

        const cells = tryPlaceWord(grid2D, w, n, directions, allowOverlap);
        if (cells) {
            placements.push({
                word: w.toUpperCase(),
                cells,
                found: false,
                colorIdx: placements.length % WORD_COLORS.length,
            });
        }
    }

    // Fill remaining cells with random A–Z
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            if (grid2D[r][c] === null) {
                grid2D[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            }
        }
    }

    grid = grid2D;
    placedWords = placements;
    foundWords = new Set();

    return { placedCount: placements.length };
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function renderGrid() {
    const n = gridSize;
    letterGrid.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
    letterGrid.innerHTML = '';
    cellEls = Array.from({ length: n }, () => Array(n).fill(null));

    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.r = r;
            cell.dataset.c = c;
            cell.textContent = grid[r][c];
            letterGrid.appendChild(cell);
            cellEls[r][c] = cell;
        }
    }

    // Size SVG to match grid coordinate system (1 unit = 1 cell).
    traceLayer.setAttribute('viewBox', `0 0 ${n} ${n}`);
    traceLayer.setAttribute('preserveAspectRatio', 'none');
    traceLayer.innerHTML = '';
}

function renderWordList() {
    wordListEl.innerHTML = '';
    placedWords.forEach((p) => {
        const chip = document.createElement('span');
        chip.className = 'word-chip';
        chip.dataset.word = p.word;
        chip.textContent = p.word;
        chip.style.setProperty('--chip-stroke', WORD_COLORS[p.colorIdx].stroke);
        chip.style.setProperty('--chip-fill', WORD_COLORS[p.colorIdx].fill);
        wordListEl.appendChild(chip);
    });
    updateFoundCount();
}

function updateFoundCount() {
    foundCountEl.textContent = `${foundWords.size} / ${placedWords.length}`;
}

function updateStatus(text, className = '') {
    statusEl.textContent = text;
    statusEl.className = className;
}

// ---------------------------------------------------------------------------
// Sound effects (synthesized via Web Audio API - no audio files required)
// ---------------------------------------------------------------------------
function updateSoundIcon() {
    if (!soundToggleBtn) return;
    soundToggleBtn.innerHTML = soundMuted
        ? '<i class="fas fa-volume-mute"></i>'
        : '<i class="fas fa-volume-up"></i>';
    soundToggleBtn.setAttribute('aria-pressed', String(soundMuted));
    soundToggleBtn.title = soundMuted ? 'Sound off (click to enable)' : 'Sound on (click to mute)';
}

function ensureAudioCtx() {
    if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        audioCtx = new Ctx();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

// Plays a single short tone. `freq` in Hz, `duration` in seconds.
function playTone(freq, duration, { type = 'sine', gain = 0.15, delay = 0 } = {}) {
    if (soundMuted) return;
    const ctx = ensureAudioCtx();
    if (!ctx) return;

    const startTime = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    // Quick fade in/out avoids clicks and keeps effects short and punchy.
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
}

function playFoundSound() {
    // Bright two-note chime
    playTone(660, 0.12, { type: 'sine', gain: 0.18 });
    playTone(990, 0.16, { type: 'sine', gain: 0.16, delay: 0.08 });
}

function playInvalidSound() {
    // Short low buzz
    playTone(160, 0.18, { type: 'sawtooth', gain: 0.1 });
}

function playWinSound() {
    // Little ascending fanfare
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        playTone(freq, 0.22, { type: 'triangle', gain: 0.16, delay: i * 0.11 });
    });
}

if (soundToggleBtn) {
    updateSoundIcon();
    soundToggleBtn.addEventListener('click', () => {
        soundMuted = !soundMuted;
        localStorage.setItem('wordsearch-sound-muted', String(soundMuted));
        updateSoundIcon();
        if (!soundMuted) {
            ensureAudioCtx();
            playTone(440, 0.08, { gain: 0.12 }); // confirmation blip
        }
    });
}

// ---------------------------------------------------------------------------
// Pointer / drag handling
// ---------------------------------------------------------------------------
// Fractional position of the pointer inside the grid (1 unit = 1 cell).
function pointFromEvent(clientX, clientY) {
    const rect = letterGrid.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) return null;
    return {
        r: (y / rect.height) * gridSize,
        c: (x / rect.width) * gridSize,
    };
}

function cellFromPoint(clientX, clientY) {
    const p = pointFromEvent(clientX, clientY);
    if (!p) return null;
    const r = Math.floor(p.r);
    const c = Math.floor(p.c);
    if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) return null;
    return { r, c };
}

function onPointerDown(e) {
    if (!gameActive) return;
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (!cell) return;
    e.preventDefault();
    ensureAudioCtx();

    isDragging = true;
    startCell = cell;
    direction = null;
    currentPath = [cell];
    renderActivePath();
}

function onPointerMove(e) {
    if (!isDragging || !startCell) return;

    const p = pointFromEvent(e.clientX, e.clientY);
    if (!p) return;

    const dx = p.c - (startCell.c + 0.5);
    const dy = p.r - (startCell.r + 0.5);

    // Lock the direction once the pointer has clearly left the start cell.
    if (direction === null) {
        const adx = Math.abs(dx);
        const ady = Math.abs(dy);
        const DEADZONE = 0.6;            // cell units
        if (adx < DEADZONE && ady < DEADZONE) return;

        const ratio = Math.min(adx, ady) / Math.max(adx, ady); // 0..1
        if (ratio >= 0.6) {
            direction = [Math.sign(dy), Math.sign(dx)];  // diagonal
        } else if (adx > ady) {
            direction = [0, Math.sign(dx)];              // horizontal
        } else {
            direction = [Math.sign(dy), 0];              // vertical
        }
    }

    const [dr, dc] = direction;

    // Number of cells travelled along the locked direction
    // (projection of the pointer offset onto that direction).
    const k = Math.round((dx * dc + dy * dr) / (Math.abs(dr) + Math.abs(dc)));

    if (k <= 0) {
        currentPath = [startCell];
        renderActivePath();
        return;
    }

    const path = [];
    for (let i = 0; i <= k; i++) {
        const rr = startCell.r + dr * i;
        const cc = startCell.c + dc * i;
        if (rr < 0 || rr >= gridSize || cc < 0 || cc >= gridSize) break;
        path.push({ r: rr, c: cc });
    }
    currentPath = path;
    renderActivePath();
}

function onPointerUp() {
    if (!isDragging) return;
    isDragging = false;

    if (currentPath.length >= 2) {
        const letters = currentPath.map(({ r, c }) => grid[r][c]).join('');
        const reversed = [...letters].reverse().join('');
        checkSelection(letters, reversed);
    }

    currentPath = [];
    direction = null;
    startCell = null;
    clearActivePath();
}

function checkSelection(forward, backward) {
    const match = placedWords.find(
        (p) => !p.found && (p.word === forward || p.word === backward)
    );

    if (match) {
        match.found = true;
        foundWords.add(match.word);
        markWordFound(match);
        updateFoundCount();
        playFoundSound();

        const chip = wordListEl.querySelector(`[data-word="${match.word}"]`);
        if (chip) chip.classList.add('found');

        if (foundWords.size === placedWords.length) {
            endGame();
        } else {
            updateStatus(`Found: ${match.word}`, 'win-message');
            setTimeout(() => {
                if (gameActive) updateStatus('Drag to trace a word');
            }, 1100);
        }
    } else if (forward.length >= 3 || backward.length >= 3) {
        const el = activePathEl;
        if (el) el.classList.add('invalid');
        playInvalidSound();
    }
}

// ---------------------------------------------------------------------------
// Trace rendering (SVG overlay)
// ---------------------------------------------------------------------------
function pathToPoints(path) {
    return path.map(({ r, c }) => `${c + 0.5},${r + 0.5}`).join(' ');
}

function renderActivePath() {
    clearActivePath();
    if (currentPath.length < 2) return;
    const poly = document.createElementNS(SVG_NS, 'polyline');
    poly.setAttribute('points', pathToPoints(currentPath));
    poly.setAttribute('class', 'trace-line active');
    poly.setAttribute('stroke-width', '0.18');
    traceLayer.appendChild(poly);
    activePathEl = poly;
}

function clearActivePath() {
    if (activePathEl && activePathEl.parentNode) {
        activePathEl.parentNode.removeChild(activePathEl);
    }
    activePathEl = null;
}

function markWordFound(placement) {
    const color = WORD_COLORS[placement.colorIdx];

    // Highlight cells
    placement.cells.forEach(({ r, c }) => {
        const el = cellEls[r][c];
        if (el) {
            el.classList.add('found');
            el.style.background = color.fill;
            el.style.color = color.stroke;
        }
    });

    // Draw permanent line
    const poly = document.createElementNS(SVG_NS, 'polyline');
    poly.setAttribute('points', pathToPoints(placement.cells));
    poly.setAttribute('class', 'trace-line found');
    poly.setAttribute('stroke', color.stroke);
    poly.setAttribute('stroke-width', '0.14');
    traceLayer.appendChild(poly);
}

// ---------------------------------------------------------------------------
// Timer
// ---------------------------------------------------------------------------
function startTimer() {
    stopTimer();
    timerStart = Date.now();
    timerEl.textContent = '0:00';
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - timerStart) / 1000);
        const m = Math.floor(elapsed / 60);
        const s = String(elapsed % 60).padStart(2, '0');
        timerEl.textContent = `${m}:${s}`;
    }, 250);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// ---------------------------------------------------------------------------
// Game lifecycle
// ---------------------------------------------------------------------------
function startNewPuzzle() {
    hideOverlay();
    stopTimer();

    gridSize = parseInt(boardSizeSelect.value, 10);
    const { placedCount } = buildPuzzle();

    if (placedCount === 0) {
        letterGrid.innerHTML = '';
        wordListEl.innerHTML = '';
        updateFoundCount();
        updateStatus('No words fit this board.');
        gameActive = false;
        return;
    }

    renderGrid();
    renderWordList();
    updateStatus('Drag to trace a word');
    gameActive = true;

    startTimer();
}

function endGame() {
    gameActive = false;
    stopTimer();
    updateStatus('Puzzle solved!', 'win-message');
    playWinSound();

    const elapsed = Math.floor((Date.now() - timerStart) / 1000);
    const m = Math.floor(elapsed / 60);
    const s = String(elapsed % 60).padStart(2, '0');

    overlayMessage.textContent = 'Puzzle Solved!';
    overlayDetail.textContent = `All ${placedWords.length} words found in ${m}:${s}`;
    overlay.classList.add('show');
}

function hideOverlay() {
    overlay.classList.remove('show');
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
boardSizeSelect.addEventListener('change', () => {
    populateCategories();
    startNewPuzzle();
});

difficultySelect.addEventListener('change', startNewPuzzle);
categorySelect.addEventListener('change', startNewPuzzle);
resetBtn.addEventListener('click', startNewPuzzle);
playAgainBtn.addEventListener('click', startNewPuzzle);

letterGrid.addEventListener('pointerdown', onPointerDown);
document.addEventListener('pointermove', onPointerMove);
document.addEventListener('pointerup', onPointerUp);
document.addEventListener('pointercancel', onPointerUp);

// Prevent the page from scrolling while the player drags on the grid on touch devices.
letterGrid.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });

loadWords();