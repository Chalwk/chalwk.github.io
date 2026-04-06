// Copyright (c) 2024-2026. Jericho Crosby (Chalwk)

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;

// DOM stuff
const gridEl = document.getElementById('grid');
const keyboardEl = document.getElementById('keyboard');
const newGameBtn = document.getElementById('newGameBtn');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modalContent');
const modalClose = document.getElementById('modalClose');
const statsBtn = document.getElementById('statsBtn');
const helpBtn = document.getElementById('helpBtn');

// game state
let wordlist = [];
let allowedSet = new Set(); // valid guesses
let secret = '';
let board = Array.from({length: MAX_GUESSES}, () => Array.from({length: WORD_LENGTH}, () => ''));
let row = 0;
let col = 0;
let finished = false;
let keyboardState = {}; // tracks key colors (correct/present/absent)

// helper: create element
function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
}

// load dictionary from words.txt, fallback to built-in list
async function loadWords() {
    try {
        const resp = await fetch('words.txt');
        if (!resp.ok) throw new Error('words.txt not found');
        const txt = await resp.text();
        const raw = txt.split(/\r?\n/).map(s => s.trim().toLowerCase()).filter(Boolean);
        wordlist = raw.filter(w => /^[a-z]+$/.test(w) && w.length === WORD_LENGTH);
        allowedSet = new Set(raw.filter(w => /^[a-z]+$/.test(w) && w.length === WORD_LENGTH));
    } catch (e) {
        const FALLBACK = [
            "apple", "brave", "crane", "dodge", "eagle", "flame", "glory", "hound", "infer", "jolly",
            "knack", "lemon", "mango", "noble", "ocean", "party", "quake", "river", "scent", "tango",
            "union", "vivid", "woven", "xenon", "young", "zesty"
        ];
        wordlist = FALLBACK.slice();
        allowedSet = new Set(FALLBACK);
    }
}

// start fresh game
function newGame() {
    secret = wordlist[Math.floor(Math.random() * wordlist.length)];
    board = Array.from({length: MAX_GUESSES}, () => Array.from({length: WORD_LENGTH}, () => ''));
    row = 0;
    col = 0;
    finished = false;
    keyboardState = {};
    renderGrid();
    renderKeyboard();
    announce("New game. Start guessing.");
}

// draw the 6x5 grid
function renderGrid() {
    gridEl.innerHTML = '';
    for (let r = 0; r < MAX_GUESSES; r++) {
        const rowEl = el('div', 'row');
        rowEl.setAttribute('data-row', r.toString());
        for (let c = 0; c < WORD_LENGTH; c++) {
            const tile = el('div', 'tile', board[r][c] || '');
            tile.setAttribute('data-row', r.toString());
            tile.setAttribute('data-col', c.toString());
            tile.setAttribute('tabindex', '-1');
            rowEl.appendChild(tile);
        }
        gridEl.appendChild(rowEl);
    }
}

// keyboard layout (three rows)
const KEY_LAYOUT = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['Enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'Backspace']
];

// render on-screen keyboard with current key colors
function renderKeyboard() {
    keyboardEl.innerHTML = '';
    for (const line of KEY_LAYOUT) {
        const row = el('div', 'k-row');
        for (const k of line) {
            const keyCls = 'key' + (k.length > 1 ? ' wide' : '');
            const btn = el('button', keyCls, k === 'Backspace' ? '⌫' : (k === 'Enter' ? 'Enter' : k));
            btn.setAttribute('data-key', k);
            const lower = (k.length === 1 ? k : k).toLowerCase();
            if (keyboardState[lower]) btn.classList.add(keyboardState[lower]);
            btn.addEventListener('click', () => handleKey(k));
            row.appendChild(btn);
        }
        keyboardEl.appendChild(row);
    }
}

// handle key presses (both physical and on-screen)
function handleKey(key) {
    if (finished) return;

    if (key === 'Backspace') {
        if (col > 0) {
            col--;
            board[row][col] = '';
            updateTile(row, col);
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
    }
}

// update a single tile in the grid
function updateTile(r, c) {
    const rowEl = gridEl.querySelector(`.row[data-row="${r}"]`);
    if (!rowEl) return;
    const tile = rowEl.querySelector(`.tile[data-col="${c}"]`);
    if (tile) tile.textContent = board[r][c] ? board[r][c].toUpperCase() : '';
}

// submit current row's guess, check validity and evaluate
function submitGuess() {
    if (col !== WORD_LENGTH) {
        pulseRow(row);
        announce('Not enough letters');
        return;
    }
    const guess = board[row].join('');
    if (!allowedSet.has(guess)) {
        announce('Not in word list');
        shakeRow(row);
        return;
    }

    const result = evaluateGuess(guess, secret);
    applyResultToRow(row, result);

    // update keyboard colors based on result
    for (let i = 0; i < WORD_LENGTH; i++) {
        const l = guess[i];
        const status = result[i];
        upgradeKeyState(l, status);
    }
    renderKeyboard();

    if (result.every(s => s === 'correct')) {
        finished = true;
        setTimeout(() => showWin(), 700);
        saveStats(true, row + 1);
        return;
    }

    row++;
    col = 0;
    if (row >= MAX_GUESSES) {
        finished = true;
        setTimeout(() => showLoss(), 700);
        saveStats(false, null);
    }
}

// evaluate guess against secret -> array of 'correct'/'present'/'absent'
function evaluateGuess(guess, secretWord) {
    const status = Array(WORD_LENGTH).fill('absent');
    const secretArr = secretWord.split('');
    const guessArr = guess.split('');
    // first pass: exact matches
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (guessArr[i] === secretArr[i]) {
            status[i] = 'correct';
            secretArr[i] = null;
            guessArr[i] = null;
        }
    }
    // second pass: misplaced letters
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (guessArr[i] === null) continue;
        const idx = secretArr.indexOf(guessArr[i]);
        if (idx !== -1) {
            status[i] = 'present';
            secretArr[idx] = null;
            guessArr[i] = null;
        } else {
            status[i] = 'absent';
        }
    }
    return status;
}

// apply color classes to a whole row with flip animation
function applyResultToRow(r, result) {
    const rowEl = gridEl.querySelector(`.row[data-row="${r}"]`);
    if (!rowEl) return;
    const tiles = Array.from(rowEl.querySelectorAll('.tile'));
    tiles.forEach((t, i) => {
        setTimeout(() => {
            t.classList.add('flip');
            setTimeout(() => {
                t.classList.remove('flip');
                t.classList.remove('absent', 'present', 'correct');
                t.classList.add(result[i]);
            }, 260);
        }, i * 200);
    });
}

// visual feedback: row bounce for short guess
function pulseRow(r) {
    const rowEl = gridEl.querySelector(`.row[data-row="${r}"]`);
    if (!rowEl) return;
    rowEl.animate([
        {transform: 'translateY(0)'},
        {transform: 'translateY(-8px)'},
        {transform: 'translateY(0)'}
    ], {duration: 320, easing: 'ease'});
}

// shake row for invalid word
function shakeRow(r) {
    const rowEl = gridEl.querySelector(`.row[data-row="${r}"]`);
    if (!rowEl) return;
    rowEl.animate([
        {transform: 'translateX(0)'},
        {transform: 'translateX(-10px)'},
        {transform: 'translateX(10px)'},
        {transform: 'translateX(0)'}
    ], {duration: 320, easing: 'ease'});
}

// update keyboard state (only upgrade to higher priority status)
function upgradeKeyState(letter, status) {
    const prev = keyboardState[letter] || null;
    const ranking = {'correct': 3, 'present': 2, 'absent': 1, null: 0};
    if (ranking[status] > ranking[prev]) {
        keyboardState[letter] = status;
    }
}

// physical keyboard handler
document.addEventListener('keydown', (e) => {
    if (finished) return;
    if (e.key === 'Backspace' || e.key === 'Enter') {
        handleKey(e.key === 'Backspace' ? 'Backspace' : 'Enter');
        e.preventDefault();
        return;
    }
    const k = e.key.toLowerCase();
    if (/^[a-z]$/.test(k)) handleKey(k);
});

// modal display
function showModal(html) {
    modalContent.innerHTML = '';
    if (typeof html === 'string') modalContent.innerHTML = html;
    else modalContent.appendChild(html);
    modal.classList.remove('hidden');
}

modalClose.addEventListener('click', () => modal.classList.add('hidden'));
modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
});

// screen reader announcement
function announce(text) {
    const live = document.createElement('div');
    live.style.position = 'absolute';
    live.style.left = '-9999px';
    live.setAttribute('aria-live', 'polite');
    live.textContent = text;
    document.body.appendChild(live);
    setTimeout(() => live.remove(), 900);
}

function showWin() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
        <strong>Nice! You guessed it.</strong><br>
        <small>The word was <code>${secret.toUpperCase()}</code></small>
        <button class="btn" style="margin-top: 1rem; background: var(--primary); color: white;">Share results</button>
    `;
    const shareBtn = wrapper.querySelector('button');
    shareBtn.addEventListener('click', shareResult);
    showModal(wrapper);
}

function showLoss() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
        <strong>Out of tries</strong>
        <p>The word was <code>${secret.toUpperCase()}</code></p>
        <button class="btn" style="margin-top: 1rem; background: var(--primary); color: white;">Play again</button>
    `;
    const replayBtn = wrapper.querySelector('button');
    replayBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        newGame();
    });
    showModal(wrapper);
}

// copy shareable result text to clipboard
function shareResult() {
    const lines = [];
    for (let r = 0; r <= row && r < MAX_GUESSES; r++) {
        const rowEl = gridEl.querySelector(`.row[data-row="${r}"]`);
        const tiles = rowEl.querySelectorAll('.tile');
        const rowEmojis = Array.from(tiles).map(t => {
            if (t.classList.contains('correct')) return '🟩';
            if (t.classList.contains('present')) return '🟨';
            return '⬜';
        }).join('');
        lines.push(rowEmojis);
    }
    const text = `Blunder ${finished ? (row <= MAX_GUESSES - 1 ? row + 1 : 'X') : '?'} / ${MAX_GUESSES}\n` + lines.join('\n');
    navigator.clipboard?.writeText(text).then(() => {
        announce('Results copied to clipboard');
    }).catch(() => {
        alert(text);
    });
}

// stats stored in localStorage
const STATS_KEY = 'blunder_stats_v1';

function getStats() {
    try {
        const raw = localStorage.getItem(STATS_KEY);
        return raw ? JSON.parse(raw) : {played: 0, win: 0, loss: 0, dist: {}};
    } catch (e) {
        return {played: 0, win: 0, loss: 0, dist: {}};
    }
}

function saveStats(won, guesses) {
    const s = getStats();
    s.played++;
    if (won) s.win++; else s.loss++;
    if (won) {
        s.dist[guesses] = (s.dist[guesses] || 0) + 1;
    }
    localStorage.setItem(STATS_KEY, JSON.stringify(s));
}

function showStats() {
    const s = getStats();
    const container = document.createElement('div');

    const statsGrid = document.createElement('div');
    statsGrid.className = 'stats-grid';
    statsGrid.innerHTML = `
        <div class="stat">
            <div class="num">${s.played}</div>
            <div class="label">Played</div>
        </div>
        <div class="stat">
            <div class="num">${s.win}</div>
            <div class="label">Wins</div>
        </div>
        <div class="stat">
            <div class="num">${s.loss}</div>
            <div class="label">Losses</div>
        </div>
        <div class="stat">
            <div class="num">${s.played ? Math.round(100 * (s.win / s.played)) + "%" : "0%"}</div>
            <div class="label">Win %</div>
        </div>
    `;

    const distDiv = document.createElement('div');
    distDiv.style.marginTop = '1.5rem';
    distDiv.innerHTML = `<strong>Guesses distribution</strong>`;
    const list = document.createElement('div');
    list.style.marginTop = '0.75rem';
    for (let i = 1; i <= MAX_GUESSES; i++) {
        const count = s.dist[i] || 0;
        const line = document.createElement('div');
        line.style.display = 'flex';
        line.style.justifyContent = 'space-between';
        line.style.gap = '1rem';
        line.innerHTML = `<div>${i}:</div><div>${count}</div>`;
        list.appendChild(line);
    }
    distDiv.appendChild(list);

    container.appendChild(statsGrid);
    container.appendChild(distDiv);
    showModal(container);
}

function bindUI() {
    newGameBtn.addEventListener('click', newGame);
    statsBtn.addEventListener('click', showStats);
    helpBtn.addEventListener('click', showHelp);
}

function showHelp() {
    const help = `
        <h3>How to play</h3>
        <p>Guess the hidden 5-letter word in six tries. Each guess must be a valid word. After each guess the color of the tiles will show how close your guess was to the word.</p>
        <ul>
            <li><strong>Green</strong> means correct letter in correct spot.</li>
            <li><strong>Yellow</strong> means letter is in the word but wrong spot.</li>
            <li><strong>Gray</strong> means letter is not in the word at all.</li>
        </ul>
        <p>Use your physical keyboard or click the keys.</p>
    `;
    showModal(help);
}

async function init() {
    await loadWords();
    bindUI();
    newGame();
}

document.addEventListener('DOMContentLoaded', init);