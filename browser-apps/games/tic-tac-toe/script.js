// Copyright (c) 2025. Jericho Crosby (Chalwk)

const cells = document.querySelectorAll('.cell');
const status = document.getElementById('status');
const resetBtn = document.getElementById('reset');
const pvpBtn = document.getElementById('pvp');
const pvaiBtn = document.getElementById('pvai');
const winningLine = document.getElementById('winning-line');

let board = Array(9).fill('');
let currentPlayer = 'X';
let gameActive = true;
let gameMode = 'pvai';

const winningConditions = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
];

const sounds = {
    move: new Audio(),
    aiMove: new Audio(),
    win: new Audio(),
    tie: new Audio()
};

function initSounds() {
    sounds.move.src = generateBeep(800, 0.1);
    sounds.aiMove.src = generateBeep(500, 0.1);
    sounds.win.src = generateBeep(600, 0.5);
    sounds.tie.src = generateBeep(300, 0.3);
}

function generateBeep(frequency, duration) {
    const sampleRate = 44100;
    const numSamples = Math.floor(duration * sampleRate);
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, numSamples * 2, true);

    const amplitude = 0.3;
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const value = Math.sin(2 * Math.PI * frequency * t) * amplitude;
        view.setInt16(44 + i * 2, value * 0x7FFF, true);
    }

    return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

function playSound(soundName) {
    try {
        const sound = sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.log('Sound play failed:', e));
        }
    } catch (error) {
        console.log('Sound error:', error);
    }
}

function handleCellClick(e) {
    if (!gameActive || currentPlayer === 'O' && gameMode === 'pvai') return;

    const index = e.target.dataset.index;
    if (board[index] !== '') return;

    makeMove(index);

    if (gameActive && gameMode === 'pvai' && currentPlayer === 'O') {
        setTimeout(makeAIMove, 500);
    }
}

function makeMove(index) {
    board[index] = currentPlayer;
    cells[index].textContent = currentPlayer;
    cells[index].classList.add('taken', `player-${currentPlayer}`);
    playSound('move');
    checkResult();
    if (gameActive) {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        status.textContent = `Player ${currentPlayer}'s turn`;
    }
}

function makeAIMove() {
    if (!gameActive) return;

    let availableCells = [];
    board.forEach((cell, index) => {
        if (cell === '') availableCells.push(index);
    });

    if (availableCells.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableCells.length);
        makeMove(availableCells[randomIndex]);

        playSound('aiMove');
    }
}

function checkResult() {
    let roundWon = false;
    let winningCombo = null;

    for (let condition of winningConditions) {
        const [a, b, c] = condition;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            roundWon = true;
            winningCombo = condition;
            break;
        }
    }

    if (roundWon) {
        status.textContent = `Player ${currentPlayer} wins!`;
        status.className = 'win-message';
        gameActive = false;
        drawWinningLine(winningCombo);
        playSound('win');
        winningCombo.forEach(index => {
            cells[index].classList.add('winning-cell');
        });
        return;
    }

    if (!board.includes('')) {
        status.textContent = "It's a tie!";
        status.className = 'tie-message';
        gameActive = false;
        winningLine.style.display = 'none';
        playSound('tie');
    }
}

function drawWinningLine(winningCombo) {
    const [a, b, c] = winningCombo;
    const cellSize = 100;
    const gap = 5;

    const cell1 = cells[a].getBoundingClientRect();
    const cell2 = cells[c].getBoundingClientRect();
    const container = document.getElementById('game-container').getBoundingClientRect();

    let startX, startY, endX, endY, length, angle;

    // Horizontal lines (rows)
    if (winningCombo[0] === 0 && winningCombo[1] === 1 && winningCombo[2] === 2) {
        startX = cell1.left - container.left + 10;
        startY = cell1.top - container.top + cellSize / 2;
        endX = cell2.left - container.left + cellSize - 10;
        endY = cell2.top - container.top + cellSize / 2;
    } else if (winningCombo[0] === 3 && winningCombo[1] === 4 && winningCombo[2] === 5) {
        startX = cell1.left - container.left + 10;
        startY = cell1.top - container.top + cellSize / 2;
        endX = cell2.left - container.left + cellSize - 10;
        endY = cell2.top - container.top + cellSize / 2;
    } else if (winningCombo[0] === 6 && winningCombo[1] === 7 && winningCombo[2] === 8) {
        startX = cell1.left - container.left + 10;
        startY = cell1.top - container.top + cellSize / 2;
        endX = cell2.left - container.left + cellSize - 10;
        endY = cell2.top - container.top + cellSize / 2;
    }
    // Vertical lines (columns)
    else if (winningCombo[0] === 0 && winningCombo[1] === 3 && winningCombo[2] === 6) {
        startX = cell1.left - container.left + cellSize / 2;
        startY = cell1.top - container.top + 10;
        endX = cell2.left - container.left + cellSize / 2;
        endY = cell2.top - container.top + cellSize - 10;
    } else if (winningCombo[0] === 1 && winningCombo[1] === 4 && winningCombo[2] === 7) {
        startX = cell1.left - container.left + cellSize / 2;
        startY = cell1.top - container.top + 10;
        endX = cell2.left - container.left + cellSize / 2;
        endY = cell2.top - container.top + cellSize - 10;
    } else if (winningCombo[0] === 2 && winningCombo[1] === 5 && winningCombo[2] === 8) {
        startX = cell1.left - container.left + cellSize / 2;
        startY = cell1.top - container.top + 10;
        endX = cell2.left - container.left + cellSize / 2;
        endY = cell2.top - container.top + cellSize - 10;
    }
    // Diagonal lines
    else if (winningCombo[0] === 0 && winningCombo[1] === 4 && winningCombo[2] === 8) {
        startX = cell1.left - container.left + 10;
        startY = cell1.top - container.top + 10;
        endX = cell2.left - container.left + cellSize - 10;
        endY = cell2.top - container.top + cellSize - 10;
    } else if (winningCombo[0] === 2 && winningCombo[1] === 4 && winningCombo[2] === 6) {
        startX = cell1.left - container.left + cellSize - 10;
        startY = cell1.top - container.top + 10;
        endX = cell2.left - container.left + 10;
        endY = cell2.top - container.top + cellSize - 10;
    }

    length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);

    winningLine.style.width = length + 'px';
    winningLine.style.left = startX + 'px';
    winningLine.style.top = startY + 'px';
    winningLine.style.transform = `rotate(${angle}deg)`;
    winningLine.style.display = 'block';
}

function resetGame() {
    board = Array(9).fill('');
    currentPlayer = 'X';
    gameActive = true;
    status.textContent = `Player ${currentPlayer}'s turn`;
    status.className = '';
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('taken', 'player-X', 'player-O', 'winning-cell');
    });
    winningLine.style.display = 'none';
}

function setGameMode(mode) {
    gameMode = mode;
    resetGame();

    pvpBtn.classList.toggle('active', mode === 'pvp');
    pvaiBtn.classList.toggle('active', mode === 'pvai');
}

initSounds();
setGameMode('pvai');

cells.forEach(cell => cell.addEventListener('click', handleCellClick));
resetBtn.addEventListener('click', resetGame);
pvpBtn.addEventListener('click', () => setGameMode('pvp'));
pvaiBtn.addEventListener('click', () => setGameMode('pvai'));