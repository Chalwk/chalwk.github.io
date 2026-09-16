// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

const svg = document.getElementById('game-board');
const statusEl = document.getElementById('status');
const movesEl = document.getElementById('moves');
const timerEl = document.getElementById('timer');
const resetBtn = document.getElementById('reset');
const difficultySelect = document.getElementById('difficulty');
const levelSelect = document.getElementById('level-select');
const gameOverOverlay = document.getElementById('game-over-overlay');
const gameOverMessageEl = document.getElementById('game-over-message');
const gameOverDetailEl = document.getElementById('game-over-detail');
const retryBtn = document.getElementById('retry-btn');
const nextBtn = document.getElementById('next-btn');

// ---------------------------------------------------------------------------
// Layout constants (SVG user-space units; the SVG scales responsively)
// ---------------------------------------------------------------------------
const BOARD_SIZE = 520;
const MARGIN = 22;

// ---------------------------------------------------------------------------
// Level data. Each level is hand-built and solvable: `initial` on a mirror is
// its deliberately WRONG starting orientation, so every level needs at least
// one rotation. size = [rows, cols]. source.dir is the direction the beam
// leaves the source in. Walls stop the beam dead - the player has to route
// around them with mirrors instead of going straight through.
// ---------------------------------------------------------------------------
const LEVELS = {
    easy: [
        { size: [5, 5], source: { r: 2, c: 0, dir: 'E' }, mirrors: [{ r: 2, c: 2, initial: '\\' }], walls: [], target: { r: 0, c: 2 } },
        { size: [5, 5], source: { r: 0, c: 0, dir: 'E' }, mirrors: [{ r: 0, c: 2, initial: '/' }, { r: 3, c: 2, initial: '/' }], walls: [], target: { r: 3, c: 4 } },
        { size: [6, 6], source: { r: 0, c: 0, dir: 'E' }, mirrors: [{ r: 0, c: 1, initial: '/' }, { r: 2, c: 1, initial: '/' }, { r: 2, c: 4, initial: '\\' }], walls: [], target: { r: 0, c: 4 } },
        { size: [6, 6], source: { r: 4, c: 5, dir: 'W' }, mirrors: [{ r: 4, c: 3, initial: '/' }, { r: 1, c: 3, initial: '/' }], walls: [], target: { r: 1, c: 0 } },
        { size: [6, 6], source: { r: 0, c: 5, dir: 'S' }, mirrors: [{ r: 2, c: 5, initial: '\\' }, { r: 2, c: 3, initial: '/' }, { r: 0, c: 3, initial: '/' }], walls: [], target: { r: 0, c: 0 } },
    ],
    normal: [
        { size: [7, 7], source: { r: 3, c: 0, dir: 'E' }, mirrors: [{ r: 3, c: 2, initial: '\\' }, { r: 1, c: 2, initial: '\\' }], walls: [{ r: 3, c: 3 }], target: { r: 1, c: 6 } },
        { size: [7, 7], source: { r: 0, c: 3, dir: 'S' }, mirrors: [{ r: 2, c: 3, initial: '\\' }, { r: 2, c: 1, initial: '\\' }, { r: 5, c: 1, initial: '/' }], walls: [{ r: 3, c: 3 }], target: { r: 5, c: 5 } },
        { size: [7, 7], source: { r: 6, c: 0, dir: 'N' }, mirrors: [{ r: 4, c: 0, initial: '\\' }, { r: 4, c: 3, initial: '\\' }, { r: 1, c: 3, initial: '\\' }, { r: 1, c: 5, initial: '/' }], walls: [{ r: 4, c: 4 }, { r: 1, c: 6 }], target: { r: 4, c: 5 } },
        { size: [8, 8], source: { r: 2, c: 7, dir: 'W' }, mirrors: [{ r: 2, c: 5, initial: '\\' }, { r: 5, c: 5, initial: '\\' }, { r: 5, c: 2, initial: '/' }], walls: [{ r: 0, c: 5 }, { r: 5, c: 1 }, { r: 0, c: 2 }], target: { r: 1, c: 2 } },
        { size: [8, 8], source: { r: 0, c: 0, dir: 'E' }, mirrors: [{ r: 0, c: 2, initial: '/' }, { r: 3, c: 2, initial: '/' }, { r: 3, c: 5, initial: '\\' }, { r: 1, c: 5, initial: '\\' }], walls: [{ r: 3, c: 6 }, { r: 6, c: 2 }], target: { r: 1, c: 7 } },
    ],
    hard: [
        { size: [8, 8], source: { r: 0, c: 0, dir: 'E' }, mirrors: [{ r: 0, c: 2, initial: '/' }, { r: 3, c: 2, initial: '/' }, { r: 3, c: 6, initial: '\\' }, { r: 0, c: 6, initial: '/' }], walls: [{ r: 3, c: 7 }, { r: 0, c: 3 }, { r: 6, c: 6 }], target: { r: 0, c: 4 } },
        { size: [8, 8], source: { r: 4, c: 0, dir: 'E' }, mirrors: [{ r: 4, c: 2, initial: '\\' }, { r: 1, c: 2, initial: '\\' }, { r: 1, c: 6, initial: '/' }], walls: [{ r: 4, c: 3 }, { r: 4, c: 4 }, { r: 4, c: 5 }], target: { r: 4, c: 6 } },
        { size: [9, 9], source: { r: 8, c: 0, dir: 'N' }, mirrors: [{ r: 6, c: 0, initial: '\\' }, { r: 6, c: 3, initial: '\\' }, { r: 2, c: 3, initial: '\\' }, { r: 2, c: 7, initial: '/' }], walls: [{ r: 6, c: 4 }, { r: 6, c: 5 }, { r: 6, c: 6 }, { r: 2, c: 8 }], target: { r: 6, c: 7 } },
        { size: [9, 9], source: { r: 0, c: 8, dir: 'S' }, mirrors: [{ r: 2, c: 8, initial: '\\' }, { r: 2, c: 5, initial: '\\' }, { r: 5, c: 5, initial: '\\' }, { r: 5, c: 1, initial: '/' }], walls: [{ r: 2, c: 4 }, { r: 5, c: 0 }, { r: 8, c: 8 }], target: { r: 1, c: 1 } },
        { size: [10, 10], source: { r: 0, c: 9, dir: 'S' }, mirrors: [{ r: 2, c: 9, initial: '\\' }, { r: 2, c: 6, initial: '\\' }, { r: 5, c: 6, initial: '\\' }, { r: 5, c: 2, initial: '/' }, { r: 1, c: 2, initial: '\\' }], walls: [{ r: 2, c: 5 }, { r: 5, c: 1 }, { r: 8, c: 3 }], target: { r: 1, c: 7 } },
    ],
};

const DIFFICULTY_ORDER = ['easy', 'normal', 'hard'];
const DIRS = { N: { dr: -1, dc: 0 }, S: { dr: 1, dc: 0 }, E: { dr: 0, dc: 1 }, W: { dr: 0, dc: -1 } };

// ---------------------------------------------------------------------------
// Beam physics (pure functions operating on a level + an orientation map)
// ---------------------------------------------------------------------------
function reflect(dir, orientation) {
    if (orientation === '/') return { N: 'E', E: 'N', S: 'W', W: 'S' }[dir];
    return { N: 'W', W: 'N', S: 'E', E: 'S' }[dir];
}

function toggleOrientation(o) {
    return o === '/' ? '\\' : '/';
}

// Traces the beam from the source using the current mirror orientations.
// Returns { points: [{r,c}...], status: 'hit' | 'blocked' | 'lost' }.
// `points` are grid coordinates suitable for turning into a polyline; the
// final point of a 'lost' beam is clamped to the board edge by the renderer.
function traceBeam(level, orientations) {
    const [rows, cols] = level.size;
    const wallSet = new Set(level.walls.map(w => `${w.r},${w.c}`));
    const mirrorMap = {};
    level.mirrors.forEach(m => { mirrorMap[`${m.r},${m.c}`] = orientations[`${m.r},${m.c}`]; });

    let r = level.source.r;
    let c = level.source.c;
    let dir = level.source.dir;
    const points = [{ r, c }];
    const maxSteps = rows * cols * 4 + 20;

    for (let steps = 0; steps < maxSteps; steps++) {
        const nr = r + DIRS[dir].dr;
        const nc = c + DIRS[dir].dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
            points.push({ r: nr, c: nc, offgrid: true });
            return { points, status: 'lost' };
        }
        points.push({ r: nr, c: nc });

        const key = `${nr},${nc}`;
        if (wallSet.has(key)) return { points, status: 'blocked' };
        if (nr === level.target.r && nc === level.target.c) return { points, status: 'hit' };
        if (mirrorMap[key] !== undefined) {
            dir = reflect(dir, mirrorMap[key]);
        }
        r = nr;
        c = nc;
    }
    return { points, status: 'lost' };
}

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------
let difficulty = 'easy';
let levelIndex = 0;
let level = null;
let orientations = {};
let moves = 0;
let solved = false;
let elapsedSeconds = 0;
let timerHandle = null;

function currentLevels() {
    return LEVELS[difficulty];
}

function cellKey(r, c) {
    return `${r},${c}`;
}

function isMirrorCell(r, c) {
    return level.mirrors.some(m => m.r === r && m.c === c);
}

function isWallCell(r, c) {
    return level.walls.some(w => w.r === r && w.c === c);
}

function isSourceCell(r, c) {
    return level.source.r === r && level.source.c === c;
}

function isTargetCell(r, c) {
    return level.target.r === r && level.target.c === c;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
}

function cellPixel(r, c, cell) {
    return { x: MARGIN + (c + 0.5) * cell, y: MARGIN + (r + 0.5) * cell };
}

function renderBoard() {
    const [rows, cols] = level.size;
    const cell = (BOARD_SIZE - MARGIN * 2) / Math.max(rows, cols);
    svg.setAttribute('viewBox', `0 0 ${BOARD_SIZE} ${BOARD_SIZE}`);
    svg.innerHTML = '';

    // Cell backgrounds + click targets
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const x = MARGIN + c * cell;
            const y = MARGIN + r * cell;
            const bg = svgEl('rect', {
                class: 'cell-bg', x, y, width: cell, height: cell,
            });
            svg.appendChild(bg);

            if (isWallCell(r, c)) {
                svg.appendChild(svgEl('rect', {
                    class: 'cell-wall', x: x + 2, y: y + 2, width: cell - 4, height: cell - 4, rx: 4,
                }));
                svg.appendChild(svgEl('line', {
                    class: 'cell-wall-hatch', x1: x + cell * 0.2, y1: y + cell * 0.2,
                    x2: x + cell * 0.8, y2: y + cell * 0.8,
                }));
                svg.appendChild(svgEl('line', {
                    class: 'cell-wall-hatch', x1: x + cell * 0.8, y1: y + cell * 0.2,
                    x2: x + cell * 0.2, y2: y + cell * 0.8,
                }));
            }
        }
    }

    // Source icon (triangle pointing in its emit direction)
    drawSource(cell);

    // Target ring (lit on solve)
    drawTarget(cell);

    // Mirrors (clickable, rotate on click)
    level.mirrors.forEach(m => drawMirror(m, cell));

    // Beam on top of everything
    drawBeam(cell);
}

function drawSource(cell) {
    const { r, c, dir } = level.source;
    const { x, y } = cellPixel(r, c, cell);
    const s = cell * 0.28;
    const rot = { N: 270, S: 90, E: 0, W: 180 }[dir];
    const pts = `${x - s},${y - s} ${x + s},${y} ${x - s},${y + s}`;
    svg.appendChild(svgEl('polygon', {
        class: 'source-shape', points: pts,
        transform: `rotate(${rot} ${x} ${y})`,
    }));
}

function drawTarget(cell) {
    const { r, c } = level.target;
    const { x, y } = cellPixel(r, c, cell);
    svg.appendChild(svgEl('circle', {
        id: 'target-ring', class: `target-ring${solved ? ' lit' : ''}`,
        cx: x, cy: y, r: cell * 0.3,
    }));
    svg.appendChild(svgEl('circle', {
        id: 'target-dot', class: `target-dot${solved ? ' lit' : ''}`,
        cx: x, cy: y, r: cell * 0.09,
    }));
}

function drawMirror(m, cell) {
    const { x, y } = cellPixel(m.r, m.c, cell);
    const o = orientations[cellKey(m.r, m.c)];
    const half = cell * 0.32;
    const [x1, y1, x2, y2] = o === '/'
        ? [x - half, y + half, x + half, y - half]
        : [x - half, y - half, x + half, y + half];

    const group = svgEl('g', { class: 'mirror-group' });
    const hit = svgEl('rect', {
        class: 'cell-hit', x: x - cell / 2, y: y - cell / 2, width: cell, height: cell,
    });
    const line = svgEl('line', { class: 'mirror-line', x1, y1, x2, y2 });
    group.appendChild(hit);
    group.appendChild(line);
    group.addEventListener('click', () => onMirrorClick(m));
    svg.appendChild(group);
}

function drawBeam(cell) {
    if (!level._trace) return;
    const { points, status } = level._trace;
    const pixelPts = points.map(p => {
        let px, py;
        if (p.offgrid) {
            const clampedR = Math.max(0, Math.min(level.size[0] - 1, p.r));
            const clampedC = Math.max(0, Math.min(level.size[1] - 1, p.c));
            const center = cellPixel(clampedR, clampedC, cell);
            px = p.c < 0 ? MARGIN : p.c >= level.size[1] ? MARGIN + level.size[1] * cell : center.x;
            py = p.r < 0 ? MARGIN : p.r >= level.size[0] ? MARGIN + level.size[0] * cell : center.y;
        } else {
            const pt = cellPixel(p.r, p.c, cell);
            px = pt.x;
            py = pt.y;
        }
        return `${px},${py}`;
    }).join(' ');

    svg.appendChild(svgEl('polyline', {
        class: `beam-path ${status}`, points: pixelPts,
    }));
}

// ---------------------------------------------------------------------------
// Game flow
// ---------------------------------------------------------------------------
function onMirrorClick(m) {
    if (solved) return;
    const key = cellKey(m.r, m.c);
    orientations[key] = toggleOrientation(orientations[key]);
    moves++;
    recompute();
}

function recompute() {
    level._trace = traceBeam(level, orientations);
    renderBoard();
    updateStatsUI();

    if (level._trace.status === 'hit' && !solved) {
        winLevel();
    }
}

function updateStatsUI() {
    movesEl.textContent = moves;
    if (solved) return;

    statusEl.classList.remove('blocked-message', 'win-message');
    if (level._trace.status === 'blocked') {
        statusEl.textContent = 'Blocked! Reroute the beam.';
        statusEl.classList.add('blocked-message');
    } else {
        statusEl.textContent = 'Rotate the mirrors to guide the beam';
    }
}

function winLevel() {
    solved = true;
    stopTimer();
    statusEl.textContent = 'Target hit!';
    statusEl.classList.remove('blocked-message');
    statusEl.classList.add('win-message');

    const ring = document.getElementById('target-ring');
    const dot = document.getElementById('target-dot');
    if (ring) ring.classList.add('lit');
    if (dot) dot.classList.add('lit');

    gameOverMessageEl.textContent = 'Solved!';
    gameOverDetailEl.textContent = `${moves} move${moves === 1 ? '' : 's'} \u00b7 ${formatTime(elapsedSeconds)}`;

    const hasNextInDifficulty = levelIndex + 1 < currentLevels().length;
    const diffPos = DIFFICULTY_ORDER.indexOf(difficulty);
    const hasNextDifficulty = diffPos + 1 < DIFFICULTY_ORDER.length;

    if (hasNextInDifficulty || hasNextDifficulty) {
        nextBtn.hidden = false;
        nextBtn.textContent = hasNextInDifficulty ? 'Next Level' : `Next: ${capitalize(DIFFICULTY_ORDER[diffPos + 1])}`;
    } else {
        nextBtn.hidden = true;
        gameOverMessageEl.textContent = 'All Levels Solved!';
    }

    gameOverOverlay.classList.add('show');
}

function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function startTimer() {
    stopTimer();
    elapsedSeconds = 0;
    timerEl.textContent = formatTime(0);
    timerHandle = setInterval(() => {
        elapsedSeconds++;
        timerEl.textContent = formatTime(elapsedSeconds);
    }, 1000);
}

function stopTimer() {
    if (timerHandle) clearInterval(timerHandle);
    timerHandle = null;
}

function populateLevelSelect() {
    levelSelect.innerHTML = '';
    currentLevels().forEach((_, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `Level ${i + 1}`;
        levelSelect.appendChild(opt);
    });
    levelSelect.value = levelIndex;
}

function loadLevel(index) {
    levelIndex = index;
    level = currentLevels()[levelIndex];
    orientations = {};
    level.mirrors.forEach(m => { orientations[cellKey(m.r, m.c)] = m.initial; });

    moves = 0;
    solved = false;
    statusEl.className = '';
    gameOverOverlay.classList.remove('show');
    levelSelect.value = levelIndex;

    startTimer();
    recompute();
}

function setDifficulty(newDifficulty) {
    difficulty = newDifficulty;
    levelIndex = 0;
    populateLevelSelect();
    loadLevel(0);
}

function goToNextLevel() {
    if (levelIndex + 1 < currentLevels().length) {
        loadLevel(levelIndex + 1);
        return;
    }
    const diffPos = DIFFICULTY_ORDER.indexOf(difficulty);
    if (diffPos + 1 < DIFFICULTY_ORDER.length) {
        difficulty = DIFFICULTY_ORDER[diffPos + 1];
        difficultySelect.value = difficulty;
        levelIndex = 0;
        populateLevelSelect();
        loadLevel(0);
    }
}

resetBtn.addEventListener('click', () => loadLevel(levelIndex));
retryBtn.addEventListener('click', () => loadLevel(levelIndex));
nextBtn.addEventListener('click', goToNextLevel);
difficultySelect.addEventListener('change', () => setDifficulty(difficultySelect.value));
levelSelect.addEventListener('change', () => loadLevel(parseInt(levelSelect.value, 10)));

populateLevelSelect();
loadLevel(0);
