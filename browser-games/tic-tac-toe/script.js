const cells = document.querySelectorAll('.cell');
const status = document.getElementById('status');
const resetBtn = document.getElementById('reset');

let board = Array(9).fill('');
let currentPlayer = 'X';
let gameActive = true;

const winningConditions = [
    [0,1,2],[3,4,5],[6,7,8],   // rows
    [0,3,6],[1,4,7],[2,5,8],   // columns
    [0,4,8],[2,4,6]            // diagonals
];

function handleCellClick(e) {
    const index = e.target.dataset.index;
    if (board[index] !== '' || !gameActive) return;

    board[index] = currentPlayer;
    e.target.textContent = currentPlayer;

    checkResult();
    if (gameActive) {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        status.textContent = `Player ${currentPlayer}'s turn`;
    }
}

function checkResult() {
    let roundWon = false;
    for (let condition of winningConditions) {
        const [a, b, c] = condition;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            roundWon = true;
            break;
        }
    }

    if (roundWon) {
        status.textContent = `Player ${currentPlayer} wins!`;
        gameActive = false;
        return;
    }

    if (!board.includes('')) {
        status.textContent = "It's a tie!";
        gameActive = false;
    }
}

function resetGame() {
    board = Array(9).fill('');
    currentPlayer = 'X';
    gameActive = true;
    status.textContent = `Player ${currentPlayer}'s turn`;
    cells.forEach(cell => cell.textContent = '');
}

cells.forEach(cell => cell.addEventListener('click', handleCellClick));
resetBtn.addEventListener('click', resetGame);
