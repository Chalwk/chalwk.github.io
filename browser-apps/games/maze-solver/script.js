/*
Copyright (c) 2025-2026. Jericho Crosby (Chalwk)

Saze Solver - JavaScript
*/

const mazeContainer = document.getElementById("maze-container");
const scoreElement = document.getElementById("score");
const timerElement = document.getElementById("timer");
const bestElement = document.getElementById("best");
const resetBtn = document.getElementById("reset-btn");
const browserBtn = document.getElementById("browser-btn");
const hintBtn = document.getElementById("hint-btn");
const sizeSelect = document.getElementById("size-select");

let mazeSize = parseInt(sizeSelect.value, 10);
let maze = [];
let player = { x: 0, y: 0 };
let end = { x: 0, y: 0 };
let moves = 0;
let timer = null;
let timeSeconds = 0;
let started = false;
let gameCompleted = false;

function bestKey(size) { return `maze_best_${size}`; }

function updateBestUI() {
    const b = localStorage.getItem(bestKey(mazeSize));
    bestElement.textContent = b ? `Best: ${b} moves` : "Best: -";
}

function shuffle(arr) {
    for(let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

function generateMaze(size) {
    const grid = Array.from({length: size}, () => Array(size).fill(1));
    const startX = Math.floor(Math.random() * (size-1)) | 1;
    const startY = Math.floor(Math.random() * (size-1)) | 1;

    grid[startY][startX] = 0;
    const frontier = [];
    const directions = [{x:0,y:-2},{x:2,y:0},{x:0,y:2},{x:-2,y:0}];

    for(const d of directions) {
        const nx = startX + d.x, ny = startY + d.y;
        if(nx > 0 && nx < size-1 && ny > 0 && ny < size-1) {
            frontier.push({x: nx, y: ny, px: startX + d.x/2, py: startY + d.y/2});
        }
    }

    while(frontier.length > 0) {
        const randomIndex = Math.floor(Math.random() * frontier.length);
        const cell = frontier[randomIndex];
        frontier.splice(randomIndex, 1);

        const {x, y, px, py} = cell;
        if(grid[y][x] === 1) {
            grid[y][x] = 0;
            grid[py][px] = 0;

            for(const d of directions) {
                const nx = x + d.x, ny = y + d.y;
                if(nx > 0 && nx < size-1 && ny > 0 && ny < size-1 && grid[ny][nx] === 1) {
                    frontier.push({x: nx, y: ny, px: x + d.x/2, py: y + d.y/2});
                }
            }
        }
    }

    grid[0][1] = 0;
    grid[1][0] = 0;
    grid[size-1][size-2] = 0;
    grid[size-2][size-1] = 0;

    for(let i = 0; i < size * 2; i++) {
        const x = Math.floor(Math.random() * (size-2)) + 1;
        const y = Math.floor(Math.random() * (size-2)) + 1;

        if(grid[y][x] === 1) {
            let pathNeighbors = 0;
            const neighbors = [{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];

            for(const n of neighbors) {
                const nx = x + n.x, ny = y + n.y;
                if(nx >= 0 && nx < size && ny >= 0 && ny < size && grid[ny][nx] === 0) {
                    pathNeighbors++;
                }
            }

            if(pathNeighbors === 2) {
                grid[y][x] = 0;
            }
        }
    }

    return grid;
}

function computeCellSize() {
    const container = document.getElementById('game-container');
    const containerWidth = container.clientWidth - 40;
    const base = Math.floor(containerWidth / mazeSize) - 3;
    const clamped = Math.max(18, Math.min(40, base));
    document.documentElement.style.setProperty('--cell-size', clamped + 'px');
    mazeContainer.style.gridTemplateColumns = `repeat(${mazeSize}, var(--cell-size))`;
}

function drawMaze() {
    computeCellSize();
    mazeContainer.innerHTML = "";

    for(let y = 0; y < mazeSize; y++) {
        for(let x = 0; x < mazeSize; x++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.classList.add(maze[y][x] === 1 ? "wall" : "path");
            cell.dataset.x = x;
            cell.dataset.y = y;

            if(player.x === x && player.y === y) cell.classList.add("player");
            if(end.x === x && end.y === y) cell.classList.add("end");

            mazeContainer.appendChild(cell);
        }
    }

    scoreElement.textContent = `Moves: ${moves}`;
    timerElement.textContent = `Time: ${timeSeconds}s`;
    updateBestUI();
}

function movePlayer(dx, dy) {
    if (gameCompleted) return;

    const nx = player.x + dx, ny = player.y + dy;
    if(nx < 0 || ny < 0 || nx >= mazeSize || ny >= mazeSize) return;
    if(maze[ny][nx] === 1) return;

    player.x = nx;
    player.y = ny;
    moves++;

    if(!started) {
        startTimer();
        started = true;
    }

    drawMaze();

    if(player.x === end.x && player.y === end.y) {
        gameCompleted = true;
        stopTimer();

        setTimeout(() => {
            alert(`Congratulations! You finished in ${moves} moves and ${timeSeconds} seconds!`);

            const prev = parseInt(localStorage.getItem(bestKey(mazeSize)) || "0", 10);
            if(!prev || moves < prev) {
                localStorage.setItem(bestKey(mazeSize), String(moves));
                updateBestUI();
            }
        }, 100);
    }
}

document.addEventListener("keydown", e => {
    const key = e.key.toLowerCase();
    if(["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
        e.preventDefault();
    }

    switch(key) {
        case "w":
        case "arrowup": movePlayer(0, -1); break;
        case "a":
        case "arrowleft": movePlayer(-1, 0); break;
        case "s":
        case "arrowdown": movePlayer(0, 1); break;
        case "d":
        case "arrowright": movePlayer(1, 0); break;
    }
});

document.querySelectorAll("#touch-controls button").forEach(btn => {
    btn.addEventListener("click", () => {
        const dir = btn.dataset.dir;
        if(dir === "up") movePlayer(0, -1);
        if(dir === "down") movePlayer(0, 1);
        if(dir === "left") movePlayer(-1, 0);
        if(dir === "right") movePlayer(1, 0);
    });
});

resetBtn.addEventListener("click", () => {
    initMaze(mazeSize);
});

browserBtn.addEventListener("click", () => {
    window.location.href = "../../../browser-apps/apps_and_tools.html";
});

sizeSelect.addEventListener("change", (e) => {
    mazeSize = parseInt(e.target.value, 10);
    initMaze(mazeSize);
});

function startTimer() {
    if(timer) clearInterval(timer);
    timer = setInterval(() => {
        timeSeconds++;
        timerElement.textContent = `Time: ${timeSeconds}s`;
    }, 1000);
}

function stopTimer() {
    if(timer) {
        clearInterval(timer);
        timer = null;
    }
}

function resetTimer() {
    stopTimer();
    timeSeconds = 0;
    started = false;
    timerElement.textContent = `Time: 0s`;
}

function findShortestPath() {
    const q = [];
    const visited = Array.from({length: mazeSize}, () => Array(mazeSize).fill(false));
    const parent = Array.from({length: mazeSize}, () => Array(mazeSize).fill(null));

    q.push({x: player.x, y: player.y});
    visited[player.y][player.x] = true;
    const dirs = [{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];

    while(q.length) {
        const cur = q.shift();
        if(cur.x === end.x && cur.y === end.y) break;

        for(const d of dirs) {
            const nx = cur.x + d.x, ny = cur.y + d.y;
            if(nx < 0 || ny < 0 || nx >= mazeSize || ny >= mazeSize) continue;
            if(visited[ny][nx]) continue;
            if(maze[ny][nx] === 1) continue;

            visited[ny][nx] = true;
            parent[ny][nx] = cur;
            q.push({x: nx, y: ny});
        }
    }

    const path = [];
    let cur = {x: end.x, y: end.y};

    if(!parent[cur.y][cur.x] && !(cur.x === player.x && cur.y === player.y)) {
        return [];
    }

    while(cur) {
        path.push(cur);
        if(cur.x === player.x && cur.y === player.y) break;
        cur = parent[cur.y][cur.x];
    }

    path.reverse();
    return path;
}

hintBtn.addEventListener("click", () => {
    const path = findShortestPath();
    if(!path || path.length <= 1) return;

    const cells = [];
    for(const p of path) {
        const selector = `.cell[data-x="${p.x}"][data-y="${p.y}"]`;
        const el = mazeContainer.querySelector(selector);
        if(el && !(p.x === player.x && p.y === player.y) && !(p.x === end.x && p.y === end.y)) {
            el.classList.add("hint");
            cells.push(el);
        }
    }

    setTimeout(() => cells.forEach(c => c.classList.remove("hint")), 2200);
});

function initMaze(size) {
    mazeSize = size;
    maze = generateMaze(mazeSize);
    player = { x: 1, y: 0 };
    end = { x: mazeSize - 2, y: mazeSize - 1 };
    moves = 0;
    gameCompleted = false;
    resetTimer();
    computeCellSize();
    drawMaze();
    updateBestUI();
}

window.addEventListener('resize', computeCellSize);
window.addEventListener('load', initMaze(mazeSize));