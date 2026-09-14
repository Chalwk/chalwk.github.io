// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;
const STATS_KEY = 'blunder_stats_v1';

// ---------------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------------
const gridEl = document.getElementById('grid');
const keyboardEl = document.getElementById('keyboard');
const statusEl = document.getElementById('status');
const guessCountEl = document.getElementById('guess-count');
const streakEl = document.getElementById('streak');
const overlay = document.getElementById('game-over-overlay');
const overlayMessage = document.getElementById('game-over-message');
const overlayWord = document.getElementById('game-over-word');
const shareBtn = document.getElementById('share-btn');
const playAgainBtn = document.getElementById('play-again');
const resetBtn = document.getElementById('reset');
const statsBtn = document.getElementById('statsBtn');
const helpBtn = document.getElementById('helpBtn');
const hardModeToggle = document.getElementById('hard-mode');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modalContent');
const modalClose = document.getElementById('modalClose');

// Persistent live region for screen reader announcements
const liveRegion = document.createElement('div');
liveRegion.setAttribute('aria-live', 'polite');
liveRegion.setAttribute('aria-atomic', 'true');
liveRegion.className = 'sr-only';
document.body.appendChild(liveRegion);

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------
let wordlist = [];
let allowedSet = new Set();
let secret = '';
let board = createBoard();
let row = 0;
let col = 0;
let finished = false;
let won = false;
let guessResults = [];      // [{ guess, result: [...] }]
let keyboardState = {};     // { letter: 'correct'|'present'|'absent' }
let gameHardMode = false;   // captured at newGame()
let statusTimeout = null;

function createBoard() {
    return Array.from({ length: MAX_GUESSES }, () => Array(WORD_LENGTH).fill(''));
}

function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
}

function announce(text) {
    liveRegion.textContent = '';
    setTimeout(() => { liveRegion.textContent = text; }, 30);
}

// ---------------------------------------------------------------------------
// Persistent stats
// ---------------------------------------------------------------------------
function getStats() {
    try {
        const raw = localStorage.getItem(STATS_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        return {
            played: 0, win: 0, loss: 0, dist: {}, streak: 0, maxStreak: 0,
            ...(parsed || {}),
        };
    } catch (e) {
        return { played: 0, win: 0, loss: 0, dist: {}, streak: 0, maxStreak: 0 };
    }
}

function saveStats(wonGame, guesses) {
    const s = getStats();
    s.played++;
    if (wonGame) {
        s.win++;
        s.streak = (s.streak || 0) + 1;
        s.maxStreak = Math.max(s.maxStreak || 0, s.streak);
        if (guesses) s.dist[guesses] = (s.dist[guesses] || 0) + 1;
    } else {
        s.loss++;
        s.streak = 0;
    }
    try {
        localStorage.setItem(STATS_KEY, JSON.stringify(s));
    } catch (e) { /* storage unavailable - ignore */ }
}

// ---------------------------------------------------------------------------
// Word list loading
// ---------------------------------------------------------------------------
async function loadWords() {
    try {
        const resp = await fetch('words.txt');
        if (!resp.ok) throw new Error('words.txt not found');
        const txt = await resp.text();
        const raw = txt.split(/\r?\n/).map(s => s.trim().toLowerCase()).filter(Boolean);
        const valid = raw.filter(w => /^[a-z]+$/.test(w) && w.length === WORD_LENGTH);
        if (!valid.length) throw new Error('no valid words');
        wordlist = valid;
        allowedSet = new Set(valid);
    } catch (e) {
        const FALLBACK = [
            "apple", "brave", "crane", "dodge", "eagle", "flame", "glory", "hound", "infer", "jolly",
            "knack", "lemon", "mango", "noble", "ocean", "party", "quake", "river", "scent", "tango",
            "union", "vivid", "woven", "xenon", "young", "zesty", "atlas", "bloom", "crisp", "dwell",
            "ember", "frost", "grasp", "heron", "ivory", "jumbo", "kiosk", "lodge", "mirth", "nudge",
            "optic", "prism", "quilt", "roast", "swirl", "tiger", "ultra", "valor", "waltz", "yield"
        ];
        wordlist = FALLBACK.slice();
        allowedSet = new Set(FALLBACK);
    }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function buildGrid() {
    gridEl.innerHTML = '';
    for (let r = 0; r < MAX_GUESSES; r++) {
        const rowEl = el('div', 'blunder-row');
        rowEl.setAttribute('data-row', String(r));
        for (let c = 0; c < WORD_LENGTH; c++) {
            const tile = el('div', 'tile');
            tile.setAttribute('data-row', String(r));
            tile.setAttribute('data-col', String(c));
            rowEl.appendChild(tile);
        }
        gridEl.appendChild(rowEl);
    }
}

const KEY_LAYOUT = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['Enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'Backspace'],
];

function buildKeyboard() {
    keyboardEl.innerHTML = '';
    for (const line of KEY_LAYOUT) {
        const rowEl = el('div', 'k-row');
        for (const k of line) {
            const isWide = k.length > 1;
            const btn = el('button', 'key' + (isWide ? ' wide' : ''));
            btn.type = 'button';
            btn.setAttribute('data-key', k);
            if (k === 'Backspace') {
                btn.innerHTML = '<i class="fas fa-delete-left"></i>';
                btn.setAttribute('aria-label', 'Backspace');
            } else if (k === 'Enter') {
                btn.textContent = 'Enter';
                btn.setAttribute('aria-label', 'Enter');
            } else {
                btn.textContent = k.toUpperCase();
            }
            btn.addEventListener('click', () => handleKey(k));
            rowEl.appendChild(btn);
        }
        keyboardEl.appendChild(rowEl);
    }
}

// Update existing keys in place instead of rebuilding the whole keyboard.
function updateKeyboardState() {
    keyboardEl.querySelectorAll('.key[data-key]').forEach(btn => {
        const k = btn.getAttribute('data-key');
        if (k.length !== 1) return;
        const lower = k.toLowerCase();
        btn.classList.remove('correct', 'present', 'absent');
        const state = keyboardState[lower];
        if (state) btn.classList.add(state);
    });
}

function updateTile(r, c) {
    const rowEl = gridEl.querySelector(`.blunder-row[data-row="${r}"]`);
    if (!rowEl) return;
    const tile = rowEl.querySelector(`.tile[data-col="${c}"]`);
    if (!tile) return;
    const letter = board[r][c];
    tile.textContent = letter ? letter.toUpperCase() : '';
    tile.classList.toggle('filled', !!letter);
}

function updateCursorHighlight() {
    gridEl.querySelectorAll('.tile.cursor').forEach(t => t.classList.remove('cursor'));
    if (finished || row >= MAX_GUESSES || col >= WORD_LENGTH) return;
    const rowEl = gridEl.querySelector(`.blunder-row[data-row="${row}"]`);
    if (!rowEl) return;
    const tiles = rowEl.querySelectorAll('.tile');
    if (tiles[col]) tiles[col].classList.add('cursor');
}

function updateScoreBar() {
    guessCountEl.textContent = `${guessResults.length} / ${MAX_GUESSES}`;
    streakEl.textContent = String(getStats().streak || 0);
}

// ---------------------------------------------------------------------------
// Status messages
// ---------------------------------------------------------------------------
function setStatus(text, cls = '') {
    clearTimeout(statusTimeout);
    statusEl.textContent = text;
    statusEl.className = cls;
}

function flashStatus(text, cls = 'lose-message', duration = 1600) {
    setStatus(text, cls);
    statusTimeout = setTimeout(() => {
        if (!finished) setStatus('Guess the word!');
    }, duration);
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
function handleKey(key) {
    if (finished) return;

    if (key === 'Backspace') {
        if (col > 0) {
            col--;
            board[row][col] = '';
            updateTile(row, col);
            updateCursorHighlight();
        }
        return;
    }

    if (key === 'Enter') {
        submitGuess();
        return;
    }

    const letter = key.length === 1 ? key.toLowerCase() : '';
    if (!/^[a-z]$/.test(letter)) return;

    if (col < WORD_LENGTH) {
        board[row][col] = letter;
        col++;
        updateTile(row, col - 1);
        updateCursorHighlight();
    }
}

function handleTileClick(r, c) {
    if (finished || r !== row) return;
    // Clicking past the cursor would create a gap - ignore.
    if (c > col) return;
    col = c;
    for (let i = c; i < WORD_LENGTH; i++) {
        board[row][i] = '';
        updateTile(row, i);
    }
    updateCursorHighlight();
}

gridEl.addEventListener('click', (e) => {
    const tile = e.target.closest('.tile');
    if (!tile) return;
    const r = parseInt(tile.getAttribute('data-row'), 10);
    const c = parseInt(tile.getAttribute('data-col'), 10);
    handleTileClick(r, c);
});

// ---------------------------------------------------------------------------
// Guess evaluation
// ---------------------------------------------------------------------------
function evaluateGuess(guess, secretWord) {
    const status = Array(WORD_LENGTH).fill('absent');
    const secretArr = secretWord.split('');
    const guessArr = guess.split('');

    // First pass - exact matches
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (guessArr[i] === secretArr[i]) {
            status[i] = 'correct';
            secretArr[i] = null;
            guessArr[i] = null;
        }
    }
    // Second pass - misplaced letters
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (guessArr[i] === null) continue;
        const idx = secretArr.indexOf(guessArr[i]);
        if (idx !== -1) {
            status[i] = 'present';
            secretArr[idx] = null;
        }
    }
    return status;
}

function validateHardMode(guess) {
    // Revealed positions must be reused.
    for (const { guess: prevGuess, result } of guessResults) {
        for (let i = 0; i < WORD_LENGTH; i++) {
            if (result[i] === 'correct' && guess[i] !== prevGuess[i]) {
                return `Position ${i + 1} must be ${prevGuess[i].toUpperCase()}`;
            }
        }
    }
    // Revealed letters must appear somewhere in the new guess.
    const required = new Set();
    for (const { guess: prevGuess, result } of guessResults) {
        for (let i = 0; i < WORD_LENGTH; i++) {
            if (result[i] === 'correct' || result[i] === 'present') {
                required.add(prevGuess[i]);
            }
        }
    }
    for (const letter of required) {
        if (!guess.includes(letter)) {
            return `Guess must contain ${letter.toUpperCase()}`;
        }
    }
    return null;
}

function submitGuess() {
    if (finished) return;

    if (col !== WORD_LENGTH) {
        pulseRow(row);
        flashStatus('Not enough letters');
        announce('Not enough letters');
        return;
    }

    const guess = board[row].join('');
    if (!allowedSet.has(guess)) {
        shakeRow(row);
        flashStatus('Not in word list');
        announce('Not in word list');
        return;
    }

    if (gameHardMode && guessResults.length > 0) {
        const err = validateHardMode(guess);
        if (err) {
            shakeRow(row);
            flashStatus(err, 'lose-message', 2000);
            announce(err);
            return;
        }
    }

    const result = evaluateGuess(guess, secret);
    guessResults.push({ guess, result });
    applyResultToRow(row, result);

    for (let i = 0; i < WORD_LENGTH; i++) {
        upgradeKeyState(guess[i], result[i]);
    }
    updateKeyboardState();

    const isWin = result.every(s => s === 'correct');

    row++;
    col = 0;
    updateScoreBar();
    updateCursorHighlight();

    if (isWin) {
        finished = true;
        won = true;
        saveStats(true, guessResults.length);
        setTimeout(() => {
            setStatus('You won!', 'win-message');
            showWinOverlay();
        }, 1100);
        return;
    }

    if (row >= MAX_GUESSES) {
        finished = true;
        won = false;
        saveStats(false, null);
        setTimeout(() => {
            setStatus('Out of tries!', 'lose-message');
            showLossOverlay();
        }, 1100);
    }
}

function upgradeKeyState(letter, status) {
    const ranking = { correct: 3, present: 2, absent: 1 };
    const prev = keyboardState[letter];
    if (!prev || (ranking[status] || 0) > (ranking[prev] || 0)) {
        keyboardState[letter] = status;
    }
}

// ---------------------------------------------------------------------------
// Animations
// ---------------------------------------------------------------------------
function applyResultToRow(r, result) {
    const rowEl = gridEl.querySelector(`.blunder-row[data-row="${r}"]`);
    if (!rowEl) return;
    const tiles = rowEl.querySelectorAll('.tile');
    tiles.forEach((tile, i) => {
        setTimeout(() => {
            tile.classList.add('flip');
            // Swap the tile colour at the visual midpoint of the flip.
            setTimeout(() => {
                tile.classList.remove('absent', 'present', 'correct');
                tile.classList.add(result[i]);
            }, 150);
            setTimeout(() => tile.classList.remove('flip'), 340);
        }, i * 180);
    });
}

function pulseRow(r) {
    const rowEl = gridEl.querySelector(`.blunder-row[data-row="${r}"]`);
    if (!rowEl) return;
    rowEl.animate([
        { transform: 'translateY(0)' },
        { transform: 'translateY(-6px)' },
        { transform: 'translateY(0)' },
    ], { duration: 300, easing: 'ease' });
}

function shakeRow(r) {
    const rowEl = gridEl.querySelector(`.blunder-row[data-row="${r}"]`);
    if (!rowEl) return;
    rowEl.animate([
        { transform: 'translateX(0)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(10px)' },
        { transform: 'translateX(-6px)' },
        { transform: 'translateX(6px)' },
        { transform: 'translateX(0)' },
    ], { duration: 400, easing: 'ease' });
}

// ---------------------------------------------------------------------------
// Overlays & modals
// ---------------------------------------------------------------------------
function showWinOverlay() {
    overlayMessage.textContent = 'You Won!';
    overlayWord.textContent = `The word was ${secret.toUpperCase()}`;
    overlay.classList.add('show');
    announce(`You won in ${guessResults.length} guesses!`);
}

function showLossOverlay() {
    overlayMessage.textContent = 'Out of Tries';
    overlayWord.textContent = `The word was ${secret.toUpperCase()}`;
    overlay.classList.add('show');
    announce(`Out of tries. The word was ${secret.toUpperCase()}`);
}

function hideOverlay() {
    overlay.classList.remove('show');
}

function showModal(content) {
    modalContent.innerHTML = '';
    if (typeof content === 'string') modalContent.innerHTML = content;
    else modalContent.appendChild(content);
    modal.classList.remove('hidden');
}

function hideModal() {
    modal.classList.add('hidden');
}

// ---------------------------------------------------------------------------
// Share
// ---------------------------------------------------------------------------
function shareResult() {
    if (guessResults.length === 0) {
        announce('No guesses to share yet.');
        return;
    }
    const attempts = finished ? (won ? String(guessResults.length) : 'X') : '?';
    const lines = guessResults.map(({ result }) =>
        result.map(r => r === 'correct' ? '🟩' : r === 'present' ? '🟨' : '⬜').join('')
    );
    const text = `Blunder ${attempts}/${MAX_GUESSES}\n\n${lines.join('\n')}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => {
                announce('Results copied to clipboard.');
                flashStatus('Copied to clipboard!', 'win-message', 1500);
            })
            .catch(() => alert(text));
    } else {
        alert(text);
    }
}

// ---------------------------------------------------------------------------
// Stats & help
// ---------------------------------------------------------------------------
function renderStatsModal() {
    const s = getStats();
    const container = document.createElement('div');

    const header = document.createElement('h3');
    header.textContent = 'Statistics';
    container.appendChild(header);

    const winPct = s.played ? Math.round(100 * (s.win / s.played)) : 0;
    const grid = document.createElement('div');
    grid.className = 'stats-grid';
    grid.innerHTML = `
        <div class="stat"><div class="num">${s.played}</div><div class="label">Played</div></div>
        <div class="stat"><div class="num">${winPct}%</div><div class="label">Win %</div></div>
        <div class="stat"><div class="num">${s.streak || 0}</div><div class="label">Streak</div></div>
        <div class="stat"><div class="num">${s.maxStreak || 0}</div><div class="label">Max Streak</div></div>
    `;
    container.appendChild(grid);

    const distTitle = document.createElement('div');
    distTitle.className = 'dist-title';
    distTitle.textContent = 'Guess Distribution';
    container.appendChild(distTitle);

    const maxCount = Math.max(1, ...Object.values(s.dist || {}));
    const dist = document.createElement('div');
    dist.className = 'dist-list';
    for (let i = 1; i <= MAX_GUESSES; i++) {
        const count = (s.dist && s.dist[i]) || 0;
        const pct = count > 0 ? Math.max(14, Math.round((count / maxCount) * 100)) : 14;
        const row = document.createElement('div');
        row.className = 'dist-row';
        row.innerHTML = `
            <span class="dist-num">${i}</span>
            <div class="dist-bar-wrap">
                <div class="dist-bar${count > 0 ? ' active' : ''}" style="width:${pct}%">${count}</div>
            </div>
        `;
        dist.appendChild(row);
    }
    container.appendChild(dist);

    showModal(container);
}

function renderHelpModal() {
    showModal(`
        <h3>How to Play</h3>
        <p>Guess the hidden 5-letter word in six tries. Each guess must be a valid word. After each guess the colour of the tiles shows how close your guess was.</p>
        <ul>
            <li><strong style="color:#4ade80;">Green</strong> &mdash; correct letter in the correct spot.</li>
            <li><strong style="color:#fbbf24;">Yellow</strong> &mdash; letter is in the word but in the wrong spot.</li>
            <li><strong style="color:#64748b;">Gray</strong> &mdash; letter is not in the word at all.</li>
        </ul>
        <p>Use your physical keyboard or click the on-screen keys. Hit <code>Enter</code> to submit. Click any tile in the active row to move the cursor.</p>
        <p><strong>Hard Mode</strong> forces you to reuse every green and yellow letter you've already discovered.</p>
    `);
}

// ---------------------------------------------------------------------------
// New game
// ---------------------------------------------------------------------------
function newGame() {
    if (wordlist.length === 0) {
        setStatus('No words available.');
        return;
    }
    secret = wordlist[Math.floor(Math.random() * wordlist.length)];
    board = createBoard();
    row = 0;
    col = 0;
    finished = false;
    won = false;
    guessResults = [];
    keyboardState = {};
    gameHardMode = hardModeToggle.checked;
    clearTimeout(statusTimeout);

    hideOverlay();
    hideModal();
    buildGrid();
    buildKeyboard();
    updateScoreBar();
    updateCursorHighlight();
    setStatus('Guess the word!');
    announce('New game. Start guessing.');
}

// ---------------------------------------------------------------------------
// Global events
// ---------------------------------------------------------------------------
document.addEventListener('keydown', (e) => {
    // When a modal is open, only Escape works.
    if (!modal.classList.contains('hidden')) {
        if (e.key === 'Escape') hideModal();
        return;
    }
    if (e.repeat) return;

    if (e.key === 'Enter') {
        handleKey('Enter');
        e.preventDefault();
        return;
    }
    if (e.key === 'Backspace') {
        handleKey('Backspace');
        e.preventDefault();
        return;
    }
    const k = e.key.toLowerCase();
    if (/^[a-z]$/.test(k)) handleKey(k);
});

resetBtn.addEventListener('click', newGame);
playAgainBtn.addEventListener('click', newGame);
shareBtn.addEventListener('click', shareResult);
statsBtn.addEventListener('click', renderStatsModal);
helpBtn.addEventListener('click', renderHelpModal);
modalClose.addEventListener('click', hideModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) hideModal();
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
async function init() {
    await loadWords();
    newGame();
}

init();