const cells = document.querySelectorAll('.cell');
const status = document.getElementById('status');
const resetBtn = document.getElementById('reset');
const pvpBtn = document.getElementById('pvp');
const pvaiBtn = document.getElementById('pvai');
const winningLine = document.getElementById('winning-line');

let board = Array(9).fill('');
let currentPlayer = 'X';
let gameActive = false;
let gameMode = ''; // 'pvp' or 'pvai'

const winningConditions = [
    [0,1,2],[3,4,5],[6,7,8],   // rows
    [0,3,6],[1,4,7],[2,5,8],   // columns
    [0,4,8],[2,4,6]            // diagonals
];

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
        gameActive = false;
        drawWinningLine(winningCombo);
        return;
    }

    if (!board.includes('')) {
        status.textContent = "It's a tie!";
        gameActive = false;
        winningLine.style.display = 'none';
    }
}

function drawWinningLine(winningCombo) {
    const [a, b, c] = winningCombo;
    const cellSize = 100;
    const gap = 5;

    // Get positions of the winning cells
    const cell1 = cells[a].getBoundingClientRect();
    const cell2 = cells[c].getBoundingClientRect();
    const container = document.getElementById('game-container').getBoundingClientRect();

    // Calculate line properties based on winning combination
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

    // Calculate line length and angle
    length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);

    // Apply styles to the winning line
    winningLine.style.width = length + 'px';
    winningLine.style.left = startX + 'px';
    winningLine.style.top = startY + 'px';
    winningLine.style.transform = `rotate(${angle}deg)`;
    winningLine.style.display = 'block';
}

function resetGame() {
    board = Array(9).fill('');
    currentPlayer = 'X';
    gameActive = gameMode !== '';
    status.textContent = gameActive ? `Player ${currentPlayer}'s turn` : 'Select a game mode to start';
    cells.forEach(cell => cell.textContent = '');
    winningLine.style.display = 'none';
}

function setGameMode(mode) {
    gameMode = mode;
    resetGame();
    status.textContent = `Player ${currentPlayer}'s turn`;

    // Update button styles to show active mode
    pvpBtn.style.backgroundColor = mode === 'pvp' ? '#0056b3' : '#007BFF';
    pvaiBtn.style.backgroundColor = mode === 'pvai' ? '#0056b3' : '#007BFF';
}

cells.forEach(cell => cell.addEventListener('click', handleCellClick));
resetBtn.addEventListener('click', resetGame);
pvpBtn.addEventListener('click', () => setGameMode('pvp'));
pvaiBtn.addEventListener('click', () => setGameMode('pvai'));