// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

const gameBoard = document.getElementById('game-board');
const status = document.getElementById('status');
const resetBtn = document.getElementById('reset');
const playAgainBtn = document.getElementById('play-again');
const pvpBtn = document.getElementById('pvp');
const pvaiBtn = document.getElementById('pvai');
const difficultySelect = document.getElementById('difficulty');
const difficultyLabel = document.getElementById('difficulty-label');
const score1Display = document.getElementById('score-1');
const score2Display = document.getElementById('score-2');
const player2Label = document.getElementById('player-2-label');
const overlay = document.getElementById('game-over-overlay');
const overlayMessage = document.getElementById('game-over-message');
const overlayScore = document.getElementById('game-over-score');
const winningLine = document.getElementById('winning-line');

const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

const POSITION_BONUS = [3, 2, 3, 2, 4, 2, 3, 2, 3]; // center best, edges weakest

let board = Array(9).fill().map(() => Array(9).fill(''));
let smallBoardWinners = Array(9).fill('');
let currentPlayer = 'X';
let gameActive = true;
let gameMode = 'pvai';
let difficulty = 'greedy';
let nextBoard = null;
let aiBusy = false;

// ---------------------------------------------------------------------------
// Setup / rendering
// ---------------------------------------------------------------------------
function initGame() {
    gameBoard.innerHTML = '';

    for (let boardIndex = 0; boardIndex < 9; boardIndex++) {
        const smallBoard = document.createElement('div');
        smallBoard.className = 'small-board';
        smallBoard.dataset.index = boardIndex;

        if (smallBoardWinners[boardIndex] && smallBoardWinners[boardIndex] !== 'T') {
            smallBoard.classList.add(`won-${smallBoardWinners[boardIndex]}`);
        } else if (smallBoardWinners[boardIndex] === 'T') {
            smallBoard.classList.add('won-tie');
        }

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

        gameBoard.appendChild(smallBoard);
    }

    updateBoardHighlight();
    updateScores();
    updateStatus();
}

function handleCellClick(e) {
    if (!gameActive || aiBusy) return;
    if (gameMode === 'pvai' && currentPlayer === 'O') return;

    const boardIndex = parseInt(e.target.dataset.board, 10);
    const cellIndex = parseInt(e.target.dataset.cell, 10);

    if (nextBoard !== null && boardIndex !== nextBoard) return;
    if (board[boardIndex][cellIndex] !== '') return;
    if (smallBoardWinners[boardIndex]) return;

    playMove(boardIndex, cellIndex);
}

// ---------------------------------------------------------------------------
// Move execution
// ---------------------------------------------------------------------------
function playMove(boardIndex, cellIndex) {
    board[boardIndex][cellIndex] = currentPlayer;

    const cell = document.querySelector(
        `.cell[data-board="${boardIndex}"][data-cell="${cellIndex}"]`
    );
    if (cell) {
        cell.textContent = currentPlayer;
        cell.classList.add('taken', `player-${currentPlayer}`);
    }

    const wonSmallBoard = checkSmallBoardWinner(boardIndex);

    const overallWinner = checkOverallWinner();
    if (overallWinner !== null) {
        endGame(overallWinner);
        return;
    }

    // Determine the next forced board
    nextBoard = cellIndex;
    if (smallBoardWinners[nextBoard]) nextBoard = null;

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';

    updateBoardHighlight();
    updateScores();
    updateStatus();

    if (gameMode === 'pvai' && currentPlayer === 'O' && gameActive) {
        aiBusy = true;
        setTimeout(() => {
            const move = chooseAIMove();
            aiBusy = false;
            if (move) playMove(move.board, move.cell);
        }, 450);
    }
}

// ---------------------------------------------------------------------------
// Win detection
// ---------------------------------------------------------------------------
function smallBoardWinner(arr) {
    for (const [a, b, c] of winningConditions) {
        if (arr[a] && arr[a] === arr[b] && arr[a] === arr[c]) return arr[a];
    }
    return null;
}

function overallWinner(winners, player) {
    for (const [a, b, c] of winningConditions) {
        if (winners[a] === player && winners[b] === player && winners[c] === player) {
            return true;
        }
    }
    return false;
}

function checkSmallBoardWinner(boardIndex) {
    const sb = board[boardIndex];
    const winner = smallBoardWinner(sb);

    if (winner) {
        smallBoardWinners[boardIndex] = winner;
        const el = document.querySelector(`.small-board[data-index="${boardIndex}"]`);
        if (el) el.classList.add(`won-${winner}`);
        return true;
    }

    if (!sb.includes('')) {
        smallBoardWinners[boardIndex] = 'T';
        const el = document.querySelector(`.small-board[data-index="${boardIndex}"]`);
        if (el) el.classList.add('won-tie');
    }
    return false;
}

function checkOverallWinner() {
    for (const [a, b, c] of winningConditions) {
        const w = smallBoardWinners[a];
        if (w && w !== 'T' && w === smallBoardWinners[b] && w === smallBoardWinners[c]) {
            drawWinningLine([a, b, c]);
            return w;
        }
    }

    if (!smallBoardWinners.includes('')) {
        return 'T';
    }
    return null;
}

// ---------------------------------------------------------------------------
// Winning line overlay
// ---------------------------------------------------------------------------
function drawWinningLine(combo) {
    const [a, b, c] = combo;
    const boardWrap = document.querySelector('.board-wrap');
    const containerRect = boardWrap.getBoundingClientRect();

    const sb1 = document.querySelector(`.small-board[data-index="${a}"]`).getBoundingClientRect();
    const sb3 = document.querySelector(`.small-board[data-index="${c}"]`).getBoundingClientRect();

    const relLeft = (el) => el.left - containerRect.left;
    const relTop = (el) => el.top - containerRect.top;

    let startX, startY, endX, endY;

    if (a === 0 && b === 1 && c === 2) {
        startX = relLeft(sb1) + 10;
        startY = relTop(sb1) + sb1.height / 2;
        endX = relLeft(sb3) + sb3.width - 10;
        endY = relTop(sb3) + sb3.height / 2;
    } else if (a === 3 && b === 4 && c === 5) {
        startX = relLeft(sb1) + 10;
        startY = relTop(sb1) + sb1.height / 2;
        endX = relLeft(sb3) + sb3.width - 10;
        endY = relTop(sb3) + sb3.height / 2;
    } else if (a === 6 && b === 7 && c === 8) {
        startX = relLeft(sb1) + 10;
        startY = relTop(sb1) + sb1.height / 2;
        endX = relLeft(sb3) + sb3.width - 10;
        endY = relTop(sb3) + sb3.height / 2;
    } else if (a === 0 && b === 3 && c === 6) {
        startX = relLeft(sb1) + sb1.width / 2;
        startY = relTop(sb1) + 10;
        endX = relLeft(sb3) + sb3.width / 2;
        endY = relTop(sb3) + sb3.height - 10;
    } else if (a === 1 && b === 4 && c === 7) {
        startX = relLeft(sb1) + sb1.width / 2;
        startY = relTop(sb1) + 10;
        endX = relLeft(sb3) + sb3.width / 2;
        endY = relTop(sb3) + sb3.height - 10;
    } else if (a === 2 && b === 5 && c === 8) {
        startX = relLeft(sb1) + sb1.width / 2;
        startY = relTop(sb1) + 10;
        endX = relLeft(sb3) + sb3.width / 2;
        endY = relTop(sb3) + sb3.height - 10;
    } else if (a === 0 && b === 4 && c === 8) {
        startX = relLeft(sb1) + 10;
        startY = relTop(sb1) + 10;
        endX = relLeft(sb3) + sb3.width - 10;
        endY = relTop(sb3) + sb3.height - 10;
    } else {
        startX = relLeft(sb1) + sb1.width - 10;
        startY = relTop(sb1) + 10;
        endX = relLeft(sb3) + 10;
        endY = relTop(sb3) + sb3.height - 10;
    }

    const length = Math.hypot(endX - startX, endY - startY);
    const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);

    winningLine.style.width = length + 'px';
    winningLine.style.left = startX + 'px';
    winningLine.style.top = startY + 'px';
    winningLine.style.transform = `rotate(${angle}deg)`;
    winningLine.style.display = 'block';
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------
function updateBoardHighlight() {
    document.querySelectorAll('.small-board').forEach((el) => el.classList.remove('active'));

    if (nextBoard !== null && !smallBoardWinners[nextBoard]) {
        const el = document.querySelector(`.small-board[data-index="${nextBoard}"]`);
        if (el) el.classList.add('active');
    }
}

function updateScores() {
    let x = 0;
    let o = 0;
    for (const w of smallBoardWinners) {
        if (w === 'X') x++;
        else if (w === 'O') o++;
    }
    score1Display.textContent = x;
    score2Display.textContent = o;
}

function updateStatus() {
    if (!gameActive) return;

    const turnLabel = (gameMode === 'pvai' && currentPlayer === 'O')
        ? "AI's turn"
        : `Player ${currentPlayer}'s turn`;

    const boardLabel = nextBoard === null
        ? 'any open board'
        : `board ${nextBoard + 1}`;

    status.textContent = `${turnLabel} — play in ${boardLabel}`;
    status.className = '';
}

function endGame(winner) {
    gameActive = false;
    aiBusy = false;

    let message;
    let detail;

    if (winner === 'T') {
        message = "It's a Tie!";
        detail = 'Every small board was played.';
        status.className = 'tie-message';
    } else {
        const opponentIsAI = gameMode === 'pvai' && winner === 'O';
        message = opponentIsAI
            ? 'AI Wins!'
            : `Player ${winner} Wins!`;
        detail = `Small boards — X: ${score1Display.textContent}   O: ${score2Display.textContent}`;
        status.className = 'win-message';
    }

    status.textContent = message;

    overlayMessage.textContent = message;
    overlayScore.textContent = detail;
    overlay.classList.add('show');
}

function hideOverlay() {
    overlay.classList.remove('show');
}

// ---------------------------------------------------------------------------
// AI
// ---------------------------------------------------------------------------
function getValidMovesForPlayer(player) {
    const moves = [];
    const considerAll = nextBoard === null || smallBoardWinners[nextBoard];

    if (considerAll) {
        for (let b = 0; b < 9; b++) {
            if (smallBoardWinners[b]) continue;
            for (let c = 0; c < 9; c++) {
                if (board[b][c] === '') moves.push({ board: b, cell: c });
            }
        }
    } else {
        for (let c = 0; c < 9; c++) {
            if (board[nextBoard][c] === '') moves.push({ board: nextBoard, cell: c });
        }
    }
    return moves;
}

// Count "two-in-a-row with an empty third" threats for a small-board array.
function countThreats(arr, player) {
    let threats = 0;
    for (const [a, b, c] of winningConditions) {
        const vals = [arr[a], arr[b], arr[c]];
        const p = vals.filter((v) => v === player).length;
        const e = vals.filter((v) => v === '').length;
        if (p === 2 && e === 1) threats++;
    }
    return threats;
}

function evaluateAIMove(boardIndex, cellIndex, player) {
    const opponent = player === 'X' ? 'O' : 'X';
    let score = 0;

    // --- Small-board impact
    const sbAfter = board[boardIndex].slice();
    sbAfter[cellIndex] = player;

    const newWinners = smallBoardWinners.slice();

    if (smallBoardWinner(sbAfter)) {
        newWinners[boardIndex] = player;
        score += 1000;

        // --- Overall win?
        if (overallWinner(newWinners, player)) {
            return 100000;
        }
    } else if (!sbAfter.includes('')) {
        newWinners[boardIndex] = 'T';
    }

    // --- Would opponent win this small board if they played here?
    const sbOpp = board[boardIndex].slice();
    sbOpp[cellIndex] = opponent;
    if (smallBoardWinner(sbOpp)) {
        score += 400;
    }

    // --- Threat creation / blocking
    score += countThreats(sbAfter, player) * 30;
    score += countThreats(board[boardIndex], opponent) * 15;

    // --- Position value inside the small board
    score += POSITION_BONUS[cellIndex] * 2;

    // --- Greedy stops here
    if (difficulty === 'greedy') {
        return score;
    }

    // --- Strategic extras:
    // Does this move help us line up on the overall board?
    if (smallBoardWinner(sbAfter) && !overallWinner(newWinners, player)) {
        // Count our "two small boards in a row" lines
        for (const [a, b, c] of winningConditions) {
            const line = [a, b, c];
            const ours = line.filter((i) => newWinners[i] === player).length;
            const empties = line.filter((i) => newWinners[i] === '' || !newWinners[i]).length;
            if (ours === 2 && empties === 1) score += 120;
        }
    }

    // --- Where are we sending the opponent?
    const sentBoard = cellIndex;
    if (smallBoardWinners[sentBoard]) {
        // Opponent gets a free move anywhere — generally bad for us.
        score -= 180;
    } else {
        const oppThreatsThere = countThreats(board[sentBoard], opponent);
        const oppOptionsThere = board[sentBoard].filter((v) => v === '').length;
        // We want to give them few, weak options.
        score -= oppThreatsThere * 45;
        score -= oppOptionsThere * 1;
    }

    return score;
}

function chooseAIMove() {
    const moves = getValidMovesForPlayer('O');
    if (moves.length === 0) return null;

    if (difficulty === 'random') {
        return moves[Math.floor(Math.random() * moves.length)];
    }

    let bestMove = moves[0];
    let bestScore = -Infinity;

    for (const move of moves) {
        const s = evaluateAIMove(move.board, move.cell, 'O') + Math.random() * 0.5;
        if (s > bestScore) {
            bestScore = s;
            bestMove = move;
        }
    }
    return bestMove;
}

// ---------------------------------------------------------------------------
// Reset / mode
// ---------------------------------------------------------------------------
function resetGame() {
    board = Array(9).fill().map(() => Array(9).fill(''));
    smallBoardWinners = Array(9).fill('');
    currentPlayer = 'X';
    gameActive = true;
    aiBusy = false;
    nextBoard = null;
    winningLine.style.display = 'none';
    hideOverlay();
    initGame();
}

function setGameMode(mode) {
    gameMode = mode;

    pvpBtn.className = mode === 'pvp' ? 'btn' : 'btn btn-secondary';
    pvaiBtn.className = mode === 'pvai' ? 'btn' : 'btn btn-secondary';
    player2Label.textContent = mode === 'pvai' ? 'AI' : 'Player O';
    difficultyLabel.classList.toggle('hidden', mode !== 'pvai');

    resetGame();
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
resetBtn.addEventListener('click', resetGame);
playAgainBtn.addEventListener('click', resetGame);
pvpBtn.addEventListener('click', () => setGameMode('pvp'));
pvaiBtn.addEventListener('click', () => setGameMode('pvai'));

difficultySelect.addEventListener('change', () => {
    difficulty = difficultySelect.value;
});

difficulty = difficultySelect.value;
setGameMode('pvai');