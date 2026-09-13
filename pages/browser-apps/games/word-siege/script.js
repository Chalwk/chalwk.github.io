// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

const difficultySelect = document.getElementById('difficulty');
const categorySelect = document.getElementById('category');
const categoryBadge = document.getElementById('category-badge');
const wordDisplay = document.getElementById('word-display');
const keyboard = document.getElementById('keyboard');
const status = document.getElementById('status');
const scoreDisplay = document.getElementById('score');
const streakDisplay = document.getElementById('streak');
const resetBtn = document.getElementById('reset');
const playAgainBtn = document.getElementById('play-again');
const overlay = document.getElementById('game-over-overlay');
const overlayMessage = document.getElementById('game-over-message');
const overlayWord = document.getElementById('game-over-word');
const towerBlocksGroup = document.getElementById('tower-blocks');
const towerRubbleGroup = document.getElementById('tower-rubble');
const flag = document.querySelector('.flag');

const MAX_WRONG = 8;
const KEY_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

let wordBank = {};
let currentWord = '';
let currentCategory = '';
let guessed = new Set();
let wrongCount = 0;
let gameActive = false;

let score = Number(localStorage.getItem('wordSiegeScore') || 0);
let streak = Number(localStorage.getItem('wordSiegeStreak') || 0);

function updateStatsDisplay() {
    scoreDisplay.textContent = score;
    streakDisplay.textContent = streak;
}

function saveStats() {
    localStorage.setItem('wordSiegeScore', String(score));
    localStorage.setItem('wordSiegeStreak', String(streak));
}

async function loadWords() {
    try {
        const res = await fetch('words.json');
        wordBank = await res.json();
        populateCategories();
        startNewWord();
    } catch (err) {
        status.textContent = 'Could not load word list.';
        console.error('Failed to load words.json', err);
    }
}

function populateCategories() {
    const difficulty = difficultySelect.value;
    const categories = Object.keys(wordBank[difficulty] || {});
    const previousValue = categorySelect.value;

    categorySelect.innerHTML = '';

    const randomOption = document.createElement('option');
    randomOption.value = 'random';
    randomOption.textContent = 'Random';
    categorySelect.appendChild(randomOption);

    categories.forEach((cat) => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });

    if (categories.includes(previousValue)) {
        categorySelect.value = previousValue;
    } else {
        categorySelect.value = 'random';
    }
}

function pickWord() {
    const difficulty = difficultySelect.value;
    const categories = wordBank[difficulty] || {};
    let categoryChoice = categorySelect.value;

    if (categoryChoice === 'random' || !categories[categoryChoice]) {
        const keys = Object.keys(categories);
        categoryChoice = keys[Math.floor(Math.random() * keys.length)];
    }

    const list = categories[categoryChoice] || [];
    const word = list[Math.floor(Math.random() * list.length)];

    return { word: (word || '').toLowerCase(), category: categoryChoice };
}

function buildTower() {
    towerBlocksGroup.innerHTML = '';
    towerRubbleGroup.innerHTML = '';
    flag.style.opacity = '1';
    flag.style.transform = 'none';

    const blockHeight = 22;
    const topY = 48;
    const bottomWidth = 150;
    const topWidth = 66;

    for (let i = 0; i < MAX_WRONG; i++) {
        const t = i / (MAX_WRONG - 1);
        const width = topWidth + (bottomWidth - topWidth) * t;
        const x = 100 - width / 2;
        const y = topY + (MAX_WRONG - 1 - i) * blockHeight;

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('class', 'tower-block');
        rect.setAttribute('data-index', i);
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', width);
        rect.setAttribute('height', blockHeight - 2);
        rect.setAttribute('rx', 2);
        rect.setAttribute('fill', shadeForBlock(i));
        towerBlocksGroup.appendChild(rect);

        const rubble = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rubble.setAttribute('class', 'rubble-piece');
        rubble.setAttribute('data-index', i);
        rubble.setAttribute('x', 20 + i * 18);
        rubble.setAttribute('y', 228 + (i % 2) * 6);
        rubble.setAttribute('width', 16);
        rubble.setAttribute('height', 10);
        rubble.setAttribute('rx', 2);
        towerRubbleGroup.appendChild(rubble);
    }
}

function shadeForBlock(index) {
    const shades = ['#7c8bb0', '#748399', '#6d7a91', '#657289', '#5e6a80', '#576277', '#4f596d', '#485163'];
    return shades[index % shades.length];
}

function crumbleNextBlock() {
    const index = wrongCount - 1;
    const block = towerBlocksGroup.querySelector(`[data-index="${index}"]`);
    const rubble = towerRubbleGroup.querySelector(`[data-index="${index}"]`);

    if (block) {
        block.classList.add('falling');
        setTimeout(() => {
            block.style.display = 'none';
        }, 550);
    }
    if (rubble) {
        setTimeout(() => rubble.classList.add('show'), 300);
    }

    if (wrongCount >= MAX_WRONG) {
        flag.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        flag.style.transform = 'translateY(30px) rotate(20deg)';
        flag.style.opacity = '0';
    }
}

function buildKeyboard() {
    keyboard.innerHTML = '';
    KEY_ROWS.forEach((row) => {
        [...row].forEach((letter) => {
            const key = document.createElement('button');
            key.className = 'key';
            key.textContent = letter;
            key.dataset.letter = letter.toLowerCase();
            key.addEventListener('click', () => handleGuess(letter.toLowerCase()));
            keyboard.appendChild(key);
        });
    });
}

function buildWordDisplay() {
    wordDisplay.innerHTML = '';
    [...currentWord].forEach((char) => {
        const slot = document.createElement('span');
        slot.className = 'letter-slot';
        slot.dataset.letter = char;
        slot.textContent = guessed.has(char) ? char.toUpperCase() : '';
        if (guessed.has(char)) slot.classList.add('revealed');
        wordDisplay.appendChild(slot);
    });
}

function handleGuess(letter) {
    if (!gameActive || guessed.has(letter)) return;

    guessed.add(letter);
    const key = keyboard.querySelector(`[data-letter="${letter}"]`);

    if (currentWord.includes(letter)) {
        if (key) {
            key.classList.add('correct');
            key.disabled = true;
        }
        buildWordDisplay();
        checkWin();
    } else {
        if (key) {
            key.classList.add('wrong');
            key.disabled = true;
        }
        wrongCount++;
        crumbleNextBlock();
        checkLoss();
    }
}

function checkWin() {
    const solved = [...currentWord].every((char) => guessed.has(char));
    if (solved) {
        gameActive = false;
        score += pointsForWord();
        streak += 1;
        saveStats();
        updateStatsDisplay();
        status.textContent = 'Word guessed!';
        status.className = 'win-message';
        showOverlay('Tower Held!', `The word was "${currentWord.toUpperCase()}"`);
    }
}

function checkLoss() {
    if (wrongCount >= MAX_WRONG) {
        gameActive = false;
        streak = 0;
        saveStats();
        updateStatsDisplay();
        status.textContent = 'The tower has fallen!';
        status.className = 'lose-message';
        showOverlay('Tower Fell!', `The word was "${currentWord.toUpperCase()}"`);
        revealFullWord();
    }
}

function pointsForWord() {
    const difficulty = difficultySelect.value;
    const base = { easy: 5, medium: 10, hard: 15 }[difficulty] || 5;
    const remainingLives = MAX_WRONG - wrongCount;
    return base + remainingLives;
}

function revealFullWord() {
    [...currentWord].forEach((char) => guessed.add(char));
    buildWordDisplay();
}

function showOverlay(message, wordText) {
    overlayMessage.textContent = message;
    overlayWord.textContent = wordText;
    overlay.classList.add('show');
}

function hideOverlay() {
    overlay.classList.remove('show');
}

function startNewWord() {
    hideOverlay();
    const { word, category } = pickWord();

    if (!word) {
        status.textContent = 'No words found for that category.';
        return;
    }

    currentWord = word;
    currentCategory = category;
    guessed = new Set();
    wrongCount = 0;
    gameActive = true;

    categoryBadge.textContent = currentCategory;
    status.textContent = 'Guess the word!';
    status.className = '';

    buildTower();
    buildKeyboard();
    buildWordDisplay();
}

document.addEventListener('keydown', (e) => {
    const letter = e.key.toLowerCase();
    if (/^[a-z]$/.test(letter)) {
        handleGuess(letter);
    }
});

difficultySelect.addEventListener('change', () => {
    populateCategories();
    startNewWord();
});
categorySelect.addEventListener('change', startNewWord);
resetBtn.addEventListener('click', startNewWord);
playAgainBtn.addEventListener('click', startNewWord);

updateStatsDisplay();
loadWords();
