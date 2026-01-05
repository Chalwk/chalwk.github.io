/*
Copyright (c) 2024-2026. Jericho Crosby (Chalwk)

Ultimate Tic-Tac-Toe - JavaScript (P5.JS)
*/

let canvas;
let board;
let smallBoardWinners;
let currentPlayer = 'X';
let gameActive = true;
let gameMode = 'pvai';
let aiDifficulty = 'medium';
let nextBoard = null;
let scores = { X: 0, O: 0, T: 0 };
let animations = [];
let hoverEffect = null;
let pulse = 0;

const BOARD_SIZE = 600;
const MARGIN = 20;
const SMALL_BOARD_SIZE = (BOARD_SIZE - MARGIN * 4) / 3;
const CELL_SIZE = (SMALL_BOARD_SIZE - 20) / 3;
const COLORS = {
    background: [30, 30, 40],
    grid: [60, 70, 90],
    x: [255, 107, 107],
    o: [78, 205, 196],
    highlight: [6, 182, 212],
    text: [240, 240, 255],
    win: [245, 158, 11],
    tie: [148, 163, 184]
};

const WINNING_CONDITIONS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

let statusElement, currentPlayerElement, nextBoardElement;
let scoreXElement, scoreOElement, scoreTieElement;
let resetBtn, pvpBtn, pvaiBtn, aiDifficultySelect;

function setup() {
    canvas = createCanvas(BOARD_SIZE, BOARD_SIZE);
    canvas.parent('p5-canvas');
    canvas.style('border-radius', '8px');
    canvas.style('box-shadow', '0 8px 32px rgba(0, 0, 0, 0.3)');

    statusElement = document.getElementById('status');
    currentPlayerElement = document.getElementById('current-player');
    nextBoardElement = document.getElementById('next-board');
    scoreXElement = document.getElementById('score-x');
    scoreOElement = document.getElementById('score-o');
    scoreTieElement = document.getElementById('score-tie');
    resetBtn = document.getElementById('reset');
    pvpBtn = document.getElementById('pvp');
    pvaiBtn = document.getElementById('pvai');
    aiDifficultySelect = document.getElementById('ai-difficulty');

    resetBtn.addEventListener('click', resetGame);
    pvpBtn.addEventListener('click', () => setGameMode('pvp'));
    pvaiBtn.addEventListener('click', () => setGameMode('pvai'));
    aiDifficultySelect.addEventListener('change', updateAIDifficulty);

    document.addEventListener('keydown', handleKeyPress);

    resetGame();
}

function draw() {
    pulse = (pulse + 0.02) % TWO_PI;
    background(COLORS.background);

    drawBackgroundPattern();
    drawGameBoard();
    drawAnimations();

    if (hoverEffect) {
        drawHoverEffect();
    }

    drawWinningLines();
    updateAnimations();
}

function drawBackgroundPattern() {
    push();
    noStroke();
    fill(255, 255, 255, 3);
    for (let x = 0; x < width; x += 40) {
        for (let y = 0; y < height; y += 40) {
            const offset = sin(pulse + x * 0.01 + y * 0.01) * 2;
            circle(x + offset, y + offset, 1);
        }
    }
    pop();
}

function drawGameBoard() {
    push();
    stroke(COLORS.grid);
    strokeWeight(3);
    noFill();

    for (let i = 1; i <= 2; i++) {
        line(
            MARGIN + i * SMALL_BOARD_SIZE + (i - 1) * MARGIN,
            MARGIN,
            MARGIN + i * SMALL_BOARD_SIZE + (i - 1) * MARGIN,
            BOARD_SIZE - MARGIN
        );
        line(
            MARGIN,
            MARGIN + i * SMALL_BOARD_SIZE + (i - 1) * MARGIN,
            BOARD_SIZE - MARGIN,
            MARGIN + i * SMALL_BOARD_SIZE + (i - 1) * MARGIN
        );
    }

    for (let boardRow = 0; boardRow < 3; boardRow++) {
        for (let boardCol = 0; boardCol < 3; boardCol++) {
            const boardIndex = boardRow * 3 + boardCol;
            const x = MARGIN + boardCol * (SMALL_BOARD_SIZE + MARGIN);
            const y = MARGIN + boardRow * (SMALL_BOARD_SIZE + MARGIN);

            push();
            if (smallBoardWinners[boardIndex] === 'X') {
                fill(COLORS.x[0], COLORS.x[1], COLORS.x[2], 30);
            } else if (smallBoardWinners[boardIndex] === 'O') {
                fill(COLORS.o[0], COLORS.o[1], COLORS.o[2], 30);
            } else if (smallBoardWinners[boardIndex] === 'T') {
                fill(COLORS.tie[0], COLORS.tie[1], COLORS.tie[2], 20);
            } else {
                fill(COLORS.background[0], COLORS.background[1], COLORS.background[2], 100);
            }
            noStroke();
            rect(x, y, SMALL_BOARD_SIZE, SMALL_BOARD_SIZE, 8);
            pop();

            if (nextBoard === boardIndex || nextBoard === null) {
                push();
                noFill();
                stroke(COLORS.highlight);
                strokeWeight(2 + sin(pulse * 2) * 0.5);
                rect(x, y, SMALL_BOARD_SIZE, SMALL_BOARD_SIZE, 8);
                pop();
            }

            push();
            stroke(COLORS.grid);
            strokeWeight(1.5);
            for (let i = 1; i <= 2; i++) {
                line(
                    x + i * CELL_SIZE,
                    y + 10,
                    x + i * CELL_SIZE,
                    y + SMALL_BOARD_SIZE - 10
                );
                line(
                    x + 10,
                    y + i * CELL_SIZE,
                    x + SMALL_BOARD_SIZE - 10,
                    y + i * CELL_SIZE
                );
            }
            pop();

            for (let cellRow = 0; cellRow < 3; cellRow++) {
                for (let cellCol = 0; cellCol < 3; cellCol++) {
                    const cellIndex = cellRow * 3 + cellCol;
                    const cellValue = board[boardIndex][cellIndex];
                    if (cellValue) {
                        drawMark(
                            x + cellCol * CELL_SIZE + CELL_SIZE / 2,
                            y + cellRow * CELL_SIZE + CELL_SIZE / 2,
                            cellValue,
                            boardIndex,
                            cellIndex
                        );
                    }
                }
            }
        }
    }
    pop();
}

function drawMark(x, y, mark, boardIndex, cellIndex) {
    push();
    const animation = animations.find(a =>
    a.board === boardIndex && a.cell === cellIndex
    );
    const progress = animation ? animation.progress : 1;

    if (mark === 'X') {
        stroke(COLORS.x[0], COLORS.x[1], COLORS.x[2]);
        strokeWeight(6);
        noFill();
        const size = CELL_SIZE * 0.35 * progress;
        const rotation = progress * PI / 4;
        push();
        translate(x, y);
        rotate(rotation);
        line(-size, -size, size, size);
        line(size, -size, -size, size);
        pop();

        drawingContext.shadowBlur = 15 * progress;
        drawingContext.shadowColor = `rgba(${COLORS.x[0]}, ${COLORS.x[1]}, ${COLORS.x[2]}, 0.5)`;
        line(x - size, y - size, x + size, y + size);
        line(x + size, y - size, x - size, y + size);
        drawingContext.shadowBlur = 0;
    } else {
        stroke(COLORS.o[0], COLORS.o[1], COLORS.o[2]);
        strokeWeight(6);
        noFill();
        const size = CELL_SIZE * 0.35 * progress;
        ellipse(x, y, size * 2);

        drawingContext.shadowBlur = 15 * progress;
        drawingContext.shadowColor = `rgba(${COLORS.o[0]}, ${COLORS.o[1]}, ${COLORS.o[2]}, 0.5)`;
        ellipse(x, y, size * 2);
        drawingContext.shadowBlur = 0;
    }
    pop();
}

function drawHoverEffect() {
    if (!gameActive || !hoverEffect) return;

    const { boardIndex, cellIndex } = hoverEffect;
    const boardRow = Math.floor(boardIndex / 3);
    const boardCol = boardIndex % 3;
    const cellRow = Math.floor(cellIndex / 3);
    const cellCol = cellIndex % 3;

    const x = MARGIN + boardCol * (SMALL_BOARD_SIZE + MARGIN) +
    cellCol * CELL_SIZE + CELL_SIZE / 2;
    const y = MARGIN + boardRow * (SMALL_BOARD_SIZE + MARGIN) +
    cellRow * CELL_SIZE + CELL_SIZE / 2;

    push();
    noFill();
    stroke(COLORS.highlight);
    strokeWeight(3);
    const alpha = 100 + sin(pulse * 5) * 50;
    stroke(COLORS.highlight[0], COLORS.highlight[1], COLORS.highlight[2], alpha);
    rect(x - CELL_SIZE/2 + 5, y - CELL_SIZE/2 + 5,
        CELL_SIZE - 10, CELL_SIZE - 10, 4);
    pop();
}

function drawAnimations() {
    for (let i = animations.length - 1; i >= 0; i--) {
        const anim = animations[i];
        if (anim.type === 'win') {
            drawWinAnimation(anim);
        }
    }
}

function drawWinAnimation(anim) {
    const [a, b, c] = anim.combo;
    const points = [a, b, c].map(index => {
        const boardRow = Math.floor(index / 3);
        const boardCol = index % 3;
        return {
            x: MARGIN + boardCol * (SMALL_BOARD_SIZE + MARGIN) + SMALL_BOARD_SIZE / 2,
            y: MARGIN + boardRow * (SMALL_BOARD_SIZE + MARGIN) + SMALL_BOARD_SIZE / 2
        };
    });

    push();
    stroke(COLORS.win[0], COLORS.win[1], COLORS.win[2]);
    strokeWeight(8);
    noFill();
    drawingContext.shadowBlur = 20;
    drawingContext.shadowColor = `rgba(${COLORS.win[0]}, ${COLORS.win[1]}, ${COLORS.win[2]}, 0.7)`;

    const progress = anim.progress;
    const totalLength = dist(points[0].x, points[0].y, points[2].x, points[2].y);
    const currentLength = totalLength * progress;

    if (progress < 1) {
        const dirX = (points[2].x - points[0].x) / totalLength;
        const dirY = (points[2].y - points[0].y) / totalLength;
        const endX = points[0].x + dirX * currentLength;
        const endY = points[0].y + dirY * currentLength;
        line(points[0].x, points[0].y, endX, endY);
    } else {
        const pulseWidth = 2 + sin(pulse * 5);
        strokeWeight(pulseWidth);
        line(points[0].x, points[0].y, points[2].x, points[2].y);

        for (let i = 0; i < 5; i++) {
            const t = i / 4;
            const px = lerp(points[0].x, points[2].x, t);
            const py = lerp(points[0].y, points[2].y, t);
            const offset = pulse * 2 + i * 0.5;
            const particleSize = 8 + sin(offset) * 4;
            fill(COLORS.win[0], COLORS.win[1], COLORS.win[2], 200);
            noStroke();
            ellipse(px, py, particleSize);
        }
    }

    drawingContext.shadowBlur = 0;
    pop();
}

function drawWinningLines() {
    for (let boardIndex = 0; boardIndex < 9; boardIndex++) {
        if (smallBoardWinners[boardIndex] && smallBoardWinners[boardIndex] !== 'T') {
            const winner = smallBoardWinners[boardIndex];
            const smallBoard = board[boardIndex];

            for (let condition of WINNING_CONDITIONS) {
                const [a, b, c] = condition;
                if (smallBoard[a] === winner &&
                smallBoard[b] === winner &&
                smallBoard[c] === winner) {
                    drawSmallBoardWinLine(boardIndex, condition, winner);
                    break;
                }
            }
        }
    }
}

function drawSmallBoardWinLine(boardIndex, combo, winner) {
    const boardRow = Math.floor(boardIndex / 3);
    const boardCol = boardIndex % 3;
    const boardX = MARGIN + boardCol * (SMALL_BOARD_SIZE + MARGIN);
    const boardY = MARGIN + boardRow * (SMALL_BOARD_SIZE + MARGIN);

    const points = combo.map(cellIndex => {
        const cellRow = Math.floor(cellIndex / 3);
        const cellCol = cellIndex % 3;
        return {
            x: boardX + cellCol * CELL_SIZE + CELL_SIZE / 2,
            y: boardY + cellRow * CELL_SIZE + CELL_SIZE / 2
        };
    });

    push();
    stroke(winner === 'X' ? COLORS.x : COLORS.o);
    strokeWeight(4);
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = winner === 'X' ?
    `rgba(${COLORS.x[0]}, ${COLORS.x[1]}, ${COLORS.x[2]}, 0.5)` :
    `rgba(${COLORS.o[0]}, ${COLORS.o[1]}, ${COLORS.o[2]}, 0.5)`;

    line(points[0].x, points[0].y, points[2].x, points[2].y);

    drawingContext.shadowBlur = 0;
    pop();
}

function updateAnimations() {
    for (let i = animations.length - 1; i >= 0; i--) {
        animations[i].progress += animations[i].speed;
        if (animations[i].progress >= 1) {
            animations.splice(i, 1);
        }
    }
}

function mouseMoved() {
    if (!gameActive) {
        hoverEffect = null;
        return;
    }

    const boardCol = Math.floor((mouseX - MARGIN) / (SMALL_BOARD_SIZE + MARGIN));
    const boardRow = Math.floor((mouseY - MARGIN) / (SMALL_BOARD_SIZE + MARGIN));

    if (boardRow >= 0 && boardRow < 3 && boardCol >= 0 && boardCol < 3) {
        const boardIndex = boardRow * 3 + boardCol;

        const cellX = mouseX - (MARGIN + boardCol * (SMALL_BOARD_SIZE + MARGIN));
        const cellY = mouseY - (MARGIN + boardRow * (SMALL_BOARD_SIZE + MARGIN));
        const cellCol = Math.floor(cellX / CELL_SIZE);
        const cellRow = Math.floor(cellY / CELL_SIZE);

        if (cellRow >= 0 && cellRow < 3 && cellCol >= 0 && cellCol < 3) {
            const cellIndex = cellRow * 3 + cellCol;

            if ((nextBoard === null || nextBoard === boardIndex) &&
            !smallBoardWinners[boardIndex] &&
            !board[boardIndex][cellIndex]) {
                hoverEffect = { boardIndex, cellIndex };
                return;
            }
        }
    }
    hoverEffect = null;
}

function mouseClicked() {
    if (!gameActive || !hoverEffect) return;

    const { boardIndex, cellIndex } = hoverEffect;
    makeMove(boardIndex, cellIndex);
}

function makeMove(boardIndex, cellIndex) {
    if (!gameActive ||
    (nextBoard !== null && boardIndex !== nextBoard) ||
    board[boardIndex][cellIndex] ||
    smallBoardWinners[boardIndex]) {
        return;
    }

    animations.push({
        type: 'mark',
        board: boardIndex,
        cell: cellIndex,
        progress: 0,
        speed: 0.1
    });

    board[boardIndex][cellIndex] = currentPlayer;
    checkSmallBoardWinner(boardIndex);

    const winner = checkOverallWinner();
    if (winner) {
        if (winner !== 'T') {
            scores[winner]++;
            updateScoreDisplay();

            for (let condition of WINNING_CONDITIONS) {
                const [a, b, c] = condition;
                if (smallBoardWinners[a] === winner &&
                smallBoardWinners[b] === winner &&
                smallBoardWinners[c] === winner) {
                    animations.push({
                        type: 'win',
                        combo: condition,
                        progress: 0,
                        speed: 0.03
                    });
                    break;
                }
            }
        } else {
            scores.T++;
            updateScoreDisplay();
        }
        gameActive = false;
        statusElement.textContent = winner === 'T' ? "Game is a tie!" : `Player ${winner} wins!`;
        statusElement.className = winner === 'T' ? 'tie-message' : 'win-message';
        return;
    }

    nextBoard = cellIndex;
    if (smallBoardWinners[nextBoard]) {
        nextBoard = null;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateDisplay();

    if (gameMode === 'pvai' && currentPlayer === 'O' && gameActive) {
        setTimeout(makeAIMove, 500);
    }
}

function makeAIMove() {
    if (!gameActive) return;

    let availableMoves = [];

    if (nextBoard === null) {
        for (let b = 0; b < 9; b++) {
            if (smallBoardWinners[b]) continue;
            for (let c = 0; c < 9; c++) {
                if (!board[b][c]) {
                    availableMoves.push({ board: b, cell: c });
                }
            }
        }
    } else {
        if (smallBoardWinners[nextBoard]) {
            for (let b = 0; b < 9; b++) {
                if (smallBoardWinners[b]) continue;
                for (let c = 0; c < 9; c++) {
                    if (!board[b][c]) {
                        availableMoves.push({ board: b, cell: c });
                    }
                }
            }
        } else {
            for (let c = 0; c < 9; c++) {
                if (!board[nextBoard][c]) {
                    availableMoves.push({ board: nextBoard, cell: c });
                }
            }
        }
    }

    if (availableMoves.length > 0) {
        let chosenMove;

        if (aiDifficulty === 'easy') {
            chosenMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        } else if (aiDifficulty === 'medium') {
            chosenMove = findStrategicMove(availableMoves, 'O');
            if (!chosenMove) {
                chosenMove = findStrategicMove(availableMoves, 'X');
            }
            if (!chosenMove) {
                chosenMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
            }
        } else {
            chosenMove = findStrategicMove(availableMoves, 'O');
            if (!chosenMove) {
                chosenMove = findStrategicMove(availableMoves, 'X');
            }
            if (!chosenMove) {
                const centerMoves = availableMoves.filter(move => move.cell === 4);
                if (centerMoves.length > 0) {
                    chosenMove = centerMoves[Math.floor(Math.random() * centerMoves.length)];
                } else {
                    chosenMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
                }
            }
        }

        if (chosenMove) {
            makeMove(chosenMove.board, chosenMove.cell);
        }
    }
}

function findStrategicMove(availableMoves, player) {
    for (let move of availableMoves) {
        const { board: b, cell: c } = move;

        const testBoard = [...board[b]];
        testBoard[c] = player;

        for (let condition of WINNING_CONDITIONS) {
            const [a, bIdx, cIdx] = condition;
            if (testBoard[a] === player &&
            testBoard[bIdx] === player &&
            testBoard[cIdx] === player) {
                return move;
            }
        }
    }
    return null;
}

function checkSmallBoardWinner(boardIndex) {
    const smallBoard = board[boardIndex];

    for (let condition of WINNING_CONDITIONS) {
        const [a, b, c] = condition;
        if (smallBoard[a] &&
        smallBoard[a] === smallBoard[b] &&
        smallBoard[a] === smallBoard[c]) {
            smallBoardWinners[boardIndex] = smallBoard[a];
            return smallBoard[a];
        }
    }

    if (!smallBoard.includes('')) {
        smallBoardWinners[boardIndex] = 'T';
        return 'T';
    }

    return null;
}

function checkOverallWinner() {
    for (let condition of WINNING_CONDITIONS) {
        const [a, b, c] = condition;
        if (smallBoardWinners[a] &&
        smallBoardWinners[a] === smallBoardWinners[b] &&
        smallBoardWinners[a] === smallBoardWinners[c] &&
        smallBoardWinners[a] !== 'T') {
            return smallBoardWinners[a];
        }
    }

    if (!smallBoardWinners.includes('')) {
        return 'T';
    }

    return null;
}

function updateDisplay() {
    currentPlayerElement.textContent = currentPlayer;
    currentPlayerElement.className = currentPlayer === 'X' ? 'player-x' : 'player-o';

    nextBoardElement.textContent = nextBoard === null ? 'Any' : `Board ${nextBoard + 1}`;

    if (gameActive) {
        statusElement.textContent = `Player ${currentPlayer}'s turn`;
        statusElement.className = '';
    }
}

function updateScoreDisplay() {
    scoreXElement.textContent = scores.X;
    scoreOElement.textContent = scores.O;
    scoreTieElement.textContent = scores.T;
}

function resetGame() {
    board = Array(9).fill().map(() => Array(9).fill(''));
    smallBoardWinners = Array(9).fill('');
    currentPlayer = 'X';
    gameActive = true;
    nextBoard = null;
    animations = [];
    hoverEffect = null;

    updateDisplay();
    statusElement.textContent = "Player X's turn";
    statusElement.className = '';
}

function setGameMode(mode) {
    gameMode = mode;
    resetGame();

    pvpBtn.className = mode === 'pvp' ? 'btn' : 'btn btn-secondary';
    pvaiBtn.className = mode === 'pvai' ? 'btn' : 'btn btn-secondary';
}

function updateAIDifficulty() {
    aiDifficulty = aiDifficultySelect.value;
}

function handleKeyPress(e) {
    switch (e.key) {
        case ' ':
            e.preventDefault();
            resetGame();
            break;
        case 'm':
        case 'M':
            e.preventDefault();
            setGameMode(gameMode === 'pvp' ? 'pvai' : 'pvp');
            break;
        case '1': case '2': case '3':
        case '4': case '5': case '6':
        case '7': case '8': case '9':
            if (nextBoard === null) {
                const boardNum = parseInt(e.key) - 1;
                if (boardNum >= 0 && boardNum < 9 && !smallBoardWinners[boardNum]) {
                    nextBoard = boardNum;
                    updateDisplay();
                }
            }
            break;
    }
}

window.addEventListener('DOMContentLoaded', () => {});