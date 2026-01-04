/*
Copyright (c) 2025-2026. Jericho Crosby (Chalwk)

Tic-Tac-Toe - JavaScript
*/

const gameBoard = document.getElementById('game-board');
const status = document.getElementById('status');
const resetBtn = document.getElementById('reset');
const pvpBtn = document.getElementById('pvp');
const pvaiBtn = document.getElementById('pvai');
const currentPlayerDisplay = document.getElementById('current-player');
const nextBoardDisplay = document.getElementById('next-board');
const winningLine = document.getElementById('winning-line');

let board = Array(9).fill().map(() => Array(9).fill(''));
let smallBoardWinners = Array(9).fill('');
let currentPlayer = 'X';
let gameActive = true;
let gameMode = 'pvai';
let nextBoard = null;

const winningConditions = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
];

function initGame() {
    gameBoard.innerHTML = '';

    for (let boardIndex = 0; boardIndex < 9; boardIndex++) {
        const smallBoard = document.createElement('div');
        smallBoard.className = 'small-board';
        smallBoard.dataset.index = boardIndex;

        for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.board = boardIndex;
            cell.dataset.cell = cellIndex;
            cell.textContent = board[boardIndex][cellIndex];

            if (board[boardIndex][cellIndex]) {
                cell.classList.add('taken', `player-${board[boardIndex][cellIndex]}`);
            }

            cell.addEventListener('click', handleCellClick);
            smallBoard.appendChild(cell);
        }

        if (smallBoardWinners[boardIndex]) {
            smallBoard.classList.add(`won-${smallBoardWinners[boardIndex]}`);
        }

        gameBoard.appendChild(smallBoard);
    }

    updateBoardHighlight();
    updateStatus();
}

function handleCellClick(e) {
    if (!gameActive) return;

    const boardIndex = parseInt(e.target.dataset.board);
    const cellIndex = parseInt(e.target.dataset.cell);

    if (nextBoard !== null && boardIndex !== nextBoard) return;
    if (board[boardIndex][cellIndex] !== '') return;
    if (smallBoardWinners[boardIndex]) return;

    makeMove(boardIndex, cellIndex);
}

function makeMove(boardIndex, cellIndex) {
    board[boardIndex][cellIndex] = currentPlayer;

    const cell = document.querySelector(`.cell[data-board="${boardIndex}"][data-cell="${cellIndex}"]`);
    cell.textContent = currentPlayer;
    cell.classList.add('taken', `player-${currentPlayer}`);

    checkSmallBoardWinner(boardIndex);
    checkOverallWinner();

    if (gameActive) {
        nextBoard = cellIndex;
        if (smallBoardWinners[nextBoard]) {
            nextBoard = null;
        }

        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        updateBoardHighlight();
        updateStatus();

        if (gameMode === 'pvai' && currentPlayer === 'O') {
            setTimeout(makeAIMove, 500);
        }
    }
}

function makeAIMove() {
    if (!gameActive) return;

    let availableMoves = [];

    if (nextBoard === null) {
        for (let b = 0; b < 9; b++) {
            if (smallBoardWinners[b]) continue;
            for (let c = 0; c < 9; c++) {
                if (board[b][c] === '') {
                    availableMoves.push({board: b, cell: c});
                }
            }
        }
    } else {
        if (smallBoardWinners[nextBoard]) {
            for (let b = 0; b < 9; b++) {
                if (smallBoardWinners[b]) continue;
                for (let c = 0; c < 9; c++) {
                    if (board[b][c] === '') {
                        availableMoves.push({board: b, cell: c});
                    }
                }
            }
        } else {
            for (let c = 0; c < 9; c++) {
                if (board[nextBoard][c] === '') {
                    availableMoves.push({board: nextBoard, cell: c});
                }
            }
        }
    }

    if (availableMoves.length > 0) {
        const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        makeMove(randomMove.board, randomMove.cell);
    }
}

function checkSmallBoardWinner(boardIndex) {
    const smallBoard = board[boardIndex];

    for (let condition of winningConditions) {
        const [a, b, c] = condition;
        if (smallBoard[a] && smallBoard[a] === smallBoard[b] && smallBoard[a] === smallBoard[c]) {
            smallBoardWinners[boardIndex] = smallBoard[a];
            const smallBoardElement = document.querySelector(`.small-board[data-index="${boardIndex}"]`);
            smallBoardElement.classList.add(`won-${smallBoard[a]}`);
            return;
        }
    }

    if (!smallBoard.includes('')) {
        smallBoardWinners[boardIndex] = 'T';
    }
}

function checkOverallWinner() {
    for (let condition of winningConditions) {
        const [a, b, c] = condition;
        if (smallBoardWinners[a] && smallBoardWinners[a] === smallBoardWinners[b] && smallBoardWinners[a] === smallBoardWinners[c] && smallBoardWinners[a] !== 'T') {
            gameActive = false;
            status.textContent = `Player ${smallBoardWinners[a]} wins the game!`;
            status.className = 'win-message';
            drawWinningLine(condition);
            return;
        }
    }

    if (!smallBoardWinners.includes('')) {
        gameActive = false;
        status.textContent = "It's a tie!";
        status.className = 'tie-message';
    }
}

function drawWinningLine(winningCombo) {
    const [a, b, c] = winningCombo;
    const container = document.getElementById('game-container').getBoundingClientRect();

    const smallBoard1 = document.querySelector(`.small-board[data-index="${a}"]`).getBoundingClientRect();
    const smallBoard3 = document.querySelector(`.small-board[data-index="${c}"]`).getBoundingClientRect();

    let startX, startY, endX, endY, length, angle;

    if (winningCombo[0] === 0 && winningCombo[1] === 1 && winningCombo[2] === 2) {
        startX = smallBoard1.left - container.left + 10;
        startY = smallBoard1.top - container.top + smallBoard1.height / 2;
        endX = smallBoard3.left - container.left + smallBoard3.width - 10;
        endY = smallBoard3.top - container.top + smallBoard3.height / 2;
    } else if (winningCombo[0] === 3 && winningCombo[1] === 4 && winningCombo[2] === 5) {
        startX = smallBoard1.left - container.left + 10;
        startY = smallBoard1.top - container.top + smallBoard1.height / 2;
        endX = smallBoard3.left - container.left + smallBoard3.width - 10;
        endY = smallBoard3.top - container.top + smallBoard3.height / 2;
    } else if (winningCombo[0] === 6 && winningCombo[1] === 7 && winningCombo[2] === 8) {
        startX = smallBoard1.left - container.left + 10;
        startY = smallBoard1.top - container.top + smallBoard1.height / 2;
        endX = smallBoard3.left - container.left + smallBoard3.width - 10;
        endY = smallBoard3.top - container.top + smallBoard3.height / 2;
    } else if (winningCombo[0] === 0 && winningCombo[1] === 3 && winningCombo[2] === 6) {
        startX = smallBoard1.left - container.left + smallBoard1.width / 2;
        startY = smallBoard1.top - container.top + 10;
        endX = smallBoard3.left - container.left + smallBoard3.width / 2;
        endY = smallBoard3.top - container.top + smallBoard3.height - 10;
    } else if (winningCombo[0] === 1 && winningCombo[1] === 4 && winningCombo[2] === 7) {
        startX = smallBoard1.left - container.left + smallBoard1.width / 2;
        startY = smallBoard1.top - container.top + 10;
        endX = smallBoard3.left - container.left + smallBoard3.width / 2;
        endY = smallBoard3.top - container.top + smallBoard3.height - 10;
    } else if (winningCombo[0] === 2 && winningCombo[1] === 5 && winningCombo[2] === 8) {
        startX = smallBoard1.left - container.left + smallBoard1.width / 2;
        startY = smallBoard1.top - container.top + 10;
        endX = smallBoard3.left - container.left + smallBoard3.width / 2;
        endY = smallBoard3.top - container.top + smallBoard3.height - 10;
    } else if (winningCombo[0] === 0 && winningCombo[1] === 4 && winningCombo[2] === 8) {
        startX = smallBoard1.left - container.left + 10;
        startY = smallBoard1.top - container.top + 10;
        endX = smallBoard3.left - container.left + smallBoard3.width - 10;
        endY = smallBoard3.top - container.top + smallBoard3.height - 10;
    } else {
        startX = smallBoard1.left - container.left + smallBoard1.width - 10;
        startY = smallBoard1.top - container.top + 10;
        endX = smallBoard3.left - container.left + 10;
        endY = smallBoard3.top - container.top + smallBoard3.height - 10;
    }

    length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);

    winningLine.style.width = length + 'px';
    winningLine.style.left = startX + 'px';
    winningLine.style.top = startY + 'px';
    winningLine.style.transform = `rotate(${angle}deg)`;
    winningLine.style.display = 'block';
}

function updateBoardHighlight() {
    document.querySelectorAll('.small-board').forEach(board => {
        board.classList.remove('active');
    });

    if (nextBoard !== null) {
        const nextBoardElement = document.querySelector(`.small-board[data-index="${nextBoard}"]`);
        if (nextBoardElement) {
            nextBoardElement.classList.add('active');
        }
    }
}

function updateStatus() {
    currentPlayerDisplay.textContent = currentPlayer;
    nextBoardDisplay.textContent = nextBoard === null ? 'Any' : `Board ${nextBoard + 1}`;
    status.textContent = `Player ${currentPlayer}'s turn`;
}

function resetGame() {
    board = Array(9).fill().map(() => Array(9).fill(''));
    smallBoardWinners = Array(9).fill('');
    currentPlayer = 'X';
    gameActive = true;
    nextBoard = null;
    status.className = '';
    winningLine.style.display = 'none';
    initGame();
}

function setGameMode(mode) {
    gameMode = mode;
    resetGame();

    pvpBtn.className = mode === 'pvp' ? 'btn' : 'btn btn-secondary';
    pvaiBtn.className = mode === 'pvai' ? 'btn' : 'btn btn-secondary';
}

initGame();

resetBtn.addEventListener('click', resetGame);
pvpBtn.addEventListener('click', () => setGameMode('pvp'));
pvaiBtn.addEventListener('click', () => setGameMode('pvai'));