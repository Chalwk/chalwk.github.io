const mazeContainer = document.getElementById("maze-container");
const scoreElement = document.getElementById("score");
const resetBtn = document.getElementById("reset-btn");
const browserBtn = document.getElementById("browser-btn");

const mazeSize = 15; // 15x15 maze
let maze = [];
let player = { x: 0, y: 0 };
let end = { x: mazeSize - 1, y: mazeSize - 1 };
let moves = 0;

// Procedural maze generation using Depth-First Search
function generateMaze(size) {
    const grid = Array(size).fill().map(() => Array(size).fill(1)); // 1 = wall, 0 = path
    const stack = [];
    const directions = [
        {x: 0, y: -1}, {x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}
    ];

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function carve(x, y) {
        grid[y][x] = 0;
        shuffle(directions);
        for (const d of directions) {
            const nx = x + d.x * 2;
            const ny = y + d.y * 2;
            if (ny >= 0 && ny < size && nx >= 0 && nx < size && grid[ny][nx] === 1) {
                grid[y + d.y][x + d.x] = 0;
                carve(nx, ny);
            }
        }
    }

    carve(0, 0);
    grid[size-1][size-1] = 0; // End point
    return grid;
}

function drawMaze() {
    mazeContainer.innerHTML = "";
    maze.forEach((row, y) => {
        row.forEach((cell, x) => {
            const div = document.createElement("div");
            div.classList.add("cell");
            div.classList.add(cell === 1 ? "wall" : "path");
            if (player.x === x && player.y === y) div.classList.add("player");
            if (end.x === x && end.y === y) div.classList.add("end");
            mazeContainer.appendChild(div);
        });
        mazeContainer.appendChild(document.createElement("br"));
    });
    scoreElement.textContent = `Moves: ${moves}`;
}

function movePlayer(dx, dy) {
    const nx = player.x + dx;
    const ny = player.y + dy;
    if (nx >= 0 && nx < mazeSize && ny >= 0 && ny < mazeSize && maze[ny][nx] === 0) {
        player.x = nx;
        player.y = ny;
        moves++;
        drawMaze();
        if (player.x === end.x && player.y === end.y) {
            setTimeout(() => alert(`You reached the end in ${moves} moves!`), 10);
        }
    }
}

// Controls
document.addEventListener("keydown", e => {
    switch(e.key.toLowerCase()) {
        case "w": movePlayer(0, -1); break;
        case "a": movePlayer(-1, 0); break;
        case "s": movePlayer(0, 1); break;
        case "d": movePlayer(1, 0); break;
    }
});

// Touch controls
document.querySelectorAll("#touch-controls button").forEach(btn => {
    btn.addEventListener("click", () => {
        const dir = btn.dataset.dir;
        switch(dir) {
            case "up": movePlayer(0, -1); break;
            case "down": movePlayer(0, 1); break;
            case "left": movePlayer(-1, 0); break;
            case "right": movePlayer(1, 0); break;
        }
    });
});

// Reset button
resetBtn.addEventListener("click", () => {
    maze = generateMaze(mazeSize);
    player = { x: 0, y: 0 };
    moves = 0;
    drawMaze();
});

// Back button
browserBtn.addEventListener("click", () => {
    window.location.href = "../index.html";
});

// Initialize
maze = generateMaze(mazeSize);
drawMaze();
