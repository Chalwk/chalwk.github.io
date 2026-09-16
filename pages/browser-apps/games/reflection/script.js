// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// ---------------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------------
const svg = document.getElementById('game-board');
const statusEl = document.getElementById('status');
const movesEl = document.getElementById('moves');
const timerEl = document.getElementById('timer');
const parEl = document.getElementById('par');
const bestEl = document.getElementById('best');
const resetBtn = document.getElementById('reset');
const undoBtn = document.getElementById('undo');
const hintBtn = document.getElementById('hint');
const newPuzzleBtn = document.getElementById('new-puzzle-btn');
const difficultySelect = document.getElementById('difficulty');
const levelSelect = document.getElementById('level-select');
const gameOverOverlay = document.getElementById('game-over-overlay');
const gameOverMessageEl = document.getElementById('game-over-message');
const gameOverDetailEl = document.getElementById('game-over-detail');
const starRowEl = document.getElementById('star-row');
const retryBtn = document.getElementById('retry-btn');
const nextBtn = document.getElementById('next-btn');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const BOARD_SIZE = 520;
const MARGIN = 22;
const LEVELS_PER_DIFFICULTY = 12;

const DIFFICULTY_ORDER = ['easy', 'normal', 'hard'];
const DIRS = { N: { dr: -1, dc: 0 }, S: { dr: 1, dc: 0 }, E: { dr: 0, dc: 1 }, W: { dr: 0, dc: -1 } };

// Tunables per difficulty. `fixed` and `decoys` are ranges applied on top of
// the main path mirrors (fixed = how many path mirrors get locked in place;
// decoys = how many extra mirrors are scattered off the solution path).
const DIFFICULTY_CONFIG = {
    easy: { minSize: 5, maxSize: 6, mirrors: [2, 3], walls: [0, 1], fixed: [0, 0], decoys: [0, 1] },
    normal: { minSize: 6, maxSize: 8, mirrors: [3, 5], walls: [1, 2], fixed: [0, 1], decoys: [1, 2] },
    hard: { minSize: 7, maxSize: 10, mirrors: [4, 7], walls: [2, 4], fixed: [1, 2], decoys: [2, 3] },
};

// ---------------------------------------------------------------------------
// Seeded PRNG (mulberry32) so puzzles are reproducible from a seed.
// ---------------------------------------------------------------------------
function makeRNG(seed) {
    let s = (seed | 0) >>> 0;
    return function () {
        s = (s + 0x6D2B79F5) | 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

// ---------------------------------------------------------------------------
// Level generation
// ---------------------------------------------------------------------------
function mirrorOrient(inDir, outDir) {
    const slashMap = { N: 'E', E: 'N', S: 'W', W: 'S' };
    return slashMap[inDir] === outDir ? '/' : '\\';
}

function placeSource(rows, cols, rng) {
    const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
    const edge = randInt(0, 3);
    if (edge === 0) return { r: 0, c: randInt(1, cols - 2), dir: 'S' };
    if (edge === 1) return { r: rows - 1, c: randInt(1, cols - 2), dir: 'N' };
    if (edge === 2) return { r: randInt(1, rows - 2), c: 0, dir: 'E' };
    return { r: randInt(1, rows - 2), c: cols - 1, dir: 'W' };
}

// Walks a non-self-intersecting path from the source, placing a mirror at
// every turn, then extends a final straight segment to the target.
function walkPath(rows, cols, source, numMirrors, rng) {
    const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
    const pick = arr => arr[Math.floor(rng() * arr.length)];

    let r = source.r, c = source.c, dir = source.dir;
    const visited = new Set([`${r},${c}`]);
    const mirrors = [];

    for (let i = 0; i < numMirrors; i++) {
        const maxStep = Math.min(5, rows - 1, cols - 1);
        const stepLen = randInt(1, Math.max(1, maxStep));

        let moved = false;
        for (let s = 0; s < stepLen; s++) {
            const nr = r + DIRS[dir].dr;
            const nc = c + DIRS[dir].dc;
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) break;
            if (visited.has(`${nr},${nc}`)) break;
            r = nr; c = nc;
            visited.add(`${r},${c}`);
            moved = true;
        }
        if (!moved) return null;

        const perp = (dir === 'N' || dir === 'S') ? ['E', 'W'] : ['N', 'S'];
        const validDirs = perp.filter(d => {
            const nr = r + DIRS[d].dr;
            const nc = c + DIRS[d].dc;
            return nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited.has(`${nr},${nc}`);
        });
        if (validDirs.length === 0) return null;
        const newDir = pick(validDirs);

        const orient = mirrorOrient(dir, newDir);
        mirrors.push({ r, c, orient });
        dir = newDir;
    }

    // Final straight segment ending at the target cell.
    const maxTargetStep = Math.min(5, rows - 1, cols - 1);
    const targetStep = randInt(2, Math.max(2, maxTargetStep));
    let tr = r, tc = c;
    for (let s = 0; s < targetStep; s++) {
        const nr = r + DIRS[dir].dr;
        const nc = c + DIRS[dir].dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) break;
        if (visited.has(`${nr},${nc}`)) break;
        r = nr; c = nc;
        visited.add(`${r},${c}`);
        tr = r; tc = c;
    }

    const last = mirrors[mirrors.length - 1];
    if (tr === last.r && tc === last.c) return null;

    return { mirrors, target: { r: tr, c: tc }, visited };
}

function shuffleArray(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function fallbackLevel() {
    return {
        size: [5, 5],
        source: { r: 2, c: 0, dir: 'E' },
        mirrors: [{ r: 2, c: 2, initial: '\\', solution: '/', fixed: false }],
        walls: [],
        target: { r: 0, c: 2 },
        par: 1,
    };
}

function generateLevel(difficulty, seed, depth = 0) {
    if (depth > 5) return fallbackLevel();

    const cfg = DIFFICULTY_CONFIG[difficulty];
    const rng = makeRNG(seed);
    const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;

    for (let attempt = 0; attempt < 100; attempt++) {
        const size = randInt(cfg.minSize, cfg.maxSize);
        const rows = size, cols = size;

        const source = placeSource(rows, cols, rng);
        const numMirrors = randInt(cfg.mirrors[0], cfg.mirrors[1]);

        const path = walkPath(rows, cols, source, numMirrors, rng);
        if (!path) continue;

        const pathKeys = path.visited;

        // Pick which path mirrors are locked (fixed).
        const maxFixed = Math.max(0, path.mirrors.length - 1);
        const numFixed = Math.min(maxFixed, randInt(cfg.fixed[0], cfg.fixed[1]));
        const fixedSet = new Set();
        while (fixedSet.size < numFixed) {
            fixedSet.add(randInt(0, path.mirrors.length - 1));
        }

        const mirrors = path.mirrors.map((m, i) => ({
            r: m.r,
            c: m.c,
            initial: m.orient,
            solution: m.orient,
            fixed: fixedSet.has(i),
        }));

        // Scramble the rotatable path mirrors.
        let flipped = 0;
        mirrors.forEach(m => {
            if (m.fixed) return;
            if (rng() < 0.5) {
                m.initial = m.initial === '/' ? '\\' : '/';
                flipped++;
            }
        });
        if (flipped === 0) {
            const rotatable = mirrors.filter(m => !m.fixed);
            if (rotatable.length > 0) {
                const m = rotatable[Math.floor(rng() * rotatable.length)];
                m.initial = m.initial === '/' ? '\\' : '/';
                flipped++;
            }
        }

        // Cells not on the solution path - candidates for decoys and walls.
        const available = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const k = `${r},${c}`;
                if (pathKeys.has(k)) continue;
                if (r === source.r && c === source.c) continue;
                available.push({ r, c });
            }
        }
        shuffleArray(available, rng);

        const decoyCount = Math.min(available.length, randInt(cfg.decoys[0], cfg.decoys[1]));
        for (let i = 0; i < decoyCount; i++) {
            const cell = available[i];
            mirrors.push({
                r: cell.r,
                c: cell.c,
                initial: rng() < 0.5 ? '/' : '\\',
                solution: null,
                fixed: false,
            });
        }

        const walls = [];
        const wallStart = decoyCount;
        const wallMax = Math.min(available.length - wallStart, randInt(cfg.walls[0], cfg.walls[1]));
        for (let i = 0; i < wallMax; i++) {
            walls.push(available[wallStart + i]);
        }

        const candidate = {
            size: [rows, cols],
            source,
            mirrors,
            walls,
            target: path.target,
            par: mirrors.filter(m => !m.fixed && m.solution && m.initial !== m.solution).length,
        };

        // Sanity check: solve it ourselves and make sure the beam reaches the target.
        const testOrientations = {};
        mirrors.forEach(m => {
            testOrientations[`${m.r},${m.c}`] = m.solution || m.initial;
        });
        const trace = traceBeam(candidate, testOrientations);
        if (trace.status === 'hit') return candidate;
    }

    return generateLevel(difficulty, (seed + 0x9E3779B9) >>> 0, depth + 1);
}

// ---------------------------------------------------------------------------
// Beam physics
// ---------------------------------------------------------------------------
function reflect(dir, orientation) {
    if (orientation === '/') return { N: 'E', E: 'N', S: 'W', W: 'S' }[dir];
    return { N: 'W', W: 'N', S: 'E', E: 'S' }[dir];
}

function toggleOrientation(o) {
    return o === '/' ? '\\' : '/';
}

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
let sessionSeed = 0;
let difficulty = 'easy';
let levelIndex = 0;
let level = null;
let orientations = {};
let moves = 0;
let solved = false;
let elapsedSeconds = 0;
let timerHandle = null;
let history = [];
let hintKey = null;
let hintTimer = null;

function cellKey(r, c) { return `${r},${c}`; }

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

function isWallCell(r, c) {
    return level.walls.some(w => w.r === r && w.c === c);
}

function renderBoard() {
    const [rows, cols] = level.size;
    const cell = (BOARD_SIZE - MARGIN * 2) / Math.max(rows, cols);
    svg.setAttribute('viewBox', `0 0 ${BOARD_SIZE} ${BOARD_SIZE}`);
    svg.innerHTML = '';

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const x = MARGIN + c * cell;
            const y = MARGIN + r * cell;
            svg.appendChild(svgEl('rect', {
                class: 'cell-bg', x, y, width: cell, height: cell,
            }));

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

    drawSource(cell);
    drawTarget(cell);
    level.mirrors.forEach(m => drawMirror(m, cell));
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
    if (!o) return;

    const half = cell * 0.32;
    const [x1, y1, x2, y2] = o === '/'
        ? [x - half, y + half, x + half, y - half]
        : [x - half, y - half, x + half, y + half];

    const isHint = hintKey === cellKey(m.r, m.c);
    const group = svgEl('g', { class: `mirror-group${m.fixed ? ' fixed' : ''}` });
    const hit = svgEl('rect', {
        class: `cell-hit${m.fixed ? ' static' : ''}`,
        x: x - cell / 2, y: y - cell / 2, width: cell, height: cell,
    });
    const line = svgEl('line', { class: `mirror-line${isHint ? ' hint' : ''}`, x1, y1, x2, y2 });

    group.appendChild(hit);
    group.appendChild(line);

    if (m.fixed) {
        // Small lock dot so the player can spot locked mirrors at a glance.
        group.appendChild(svgEl('circle', {
            class: 'mirror-lock',
            cx: x + cell * 0.32,
            cy: y - cell * 0.32,
            r: cell * 0.07,
        }));
    } else {
        group.addEventListener('click', () => onMirrorClick(m));
    }

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
    if (solved || m.fixed) return;
    const key = cellKey(m.r, m.c);
    const prev = orientations[key];
    if (prev === undefined) return;

    orientations[key] = toggleOrientation(prev);
    history.push({ key, prev });
    moves++;
    clearHint();
    recompute();
}

function undo() {
    if (solved || history.length === 0) return;
    const last = history.pop();
    orientations[last.key] = last.prev;
    moves = Math.max(0, moves - 1);
    clearHint();
    recompute();
}

function showHint() {
    if (solved) return;
    const wrong = level.mirrors.filter(m =>
        !m.fixed && m.solution && orientations[cellKey(m.r, m.c)] !== m.solution
    );
    if (wrong.length === 0) return;

    hintKey = cellKey(wrong[0].r, wrong[0].c);
    if (hintTimer) clearTimeout(hintTimer);
    renderBoard();
    hintTimer = setTimeout(() => {
        hintKey = null;
        hintTimer = null;
        renderBoard();
    }, 2200);
}

function clearHint() {
    if (hintTimer) {
        clearTimeout(hintTimer);
        hintTimer = null;
    }
    hintKey = null;
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
    if (parEl && level) parEl.textContent = `par ${level.par}`;
    if (solved) return;

    statusEl.classList.remove('blocked-message', 'win-message', 'lost-message');
    if (level._trace.status === 'blocked') {
        statusEl.textContent = 'Blocked! Reroute the beam.';
        statusEl.classList.add('blocked-message');
    } else if (level._trace.status === 'lost') {
        statusEl.textContent = 'Beam escaped - try a different angle.';
        statusEl.classList.add('lost-message');
    } else {
        statusEl.textContent = 'Rotate the mirrors to guide the beam';
    }
}

function computeStars(moves, par) {
    if (moves <= par) return 3;
    if (moves <= par + 3) return 2;
    return 1;
}

function winLevel() {
    solved = true;
    stopTimer();
    statusEl.textContent = 'Target hit!';
    statusEl.classList.remove('blocked-message', 'lost-message');
    statusEl.classList.add('win-message');

    const ring = document.getElementById('target-ring');
    const dot = document.getElementById('target-dot');
    if (ring) ring.classList.add('lit');
    if (dot) dot.classList.add('lit');

    const stars = computeStars(moves, level.par);
    renderStars(stars);

    gameOverMessageEl.textContent = stars === 3 ? 'Perfect!' : 'Solved!';
    gameOverDetailEl.textContent =
        `${moves} move${moves === 1 ? '' : 's'} · par ${level.par} · ${formatTime(elapsedSeconds)}`;

    saveBest(stars);

    const hasNextInDifficulty = levelIndex + 1 < LEVELS_PER_DIFFICULTY;
    const diffPos = DIFFICULTY_ORDER.indexOf(difficulty);
    const hasNextDifficulty = diffPos + 1 < DIFFICULTY_ORDER.length;

    if (hasNextInDifficulty || hasNextDifficulty) {
        nextBtn.hidden = false;
        nextBtn.textContent = hasNextInDifficulty
            ? 'Next Level'
            : `Next: ${capitalize(DIFFICULTY_ORDER[diffPos + 1])}`;
    } else {
        nextBtn.hidden = true;
        gameOverMessageEl.textContent = 'All Levels Solved!';
    }

    gameOverOverlay.classList.add('show');
}

function renderStars(stars) {
    starRowEl.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const span = document.createElement('span');
        span.className = 'star' + (i < stars ? ' filled' : '');
        span.textContent = '★';
        span.style.animationDelay = `${i * 0.12}s`;
        starRowEl.appendChild(span);
    }
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

// ---------------------------------------------------------------------------
// Persistence (per-session-seed best stats)
// ---------------------------------------------------------------------------
function bestKey() {
    return `reflect:best:${sessionSeed}:${difficulty}:${levelIndex}`;
}

function getBest() {
    try { return JSON.parse(localStorage.getItem(bestKey())); }
    catch (e) { return null; }
}

function saveBest(stars) {
    const prev = getBest();
    const next = {
        moves: prev && prev.moves < moves ? prev.moves : moves,
        time: prev && prev.time < elapsedSeconds ? prev.time : elapsedSeconds,
        stars: Math.max(stars, prev ? prev.stars : 0),
    };
    try { localStorage.setItem(bestKey(), JSON.stringify(next)); } catch (e) { /* ignore */ }
    updateBestDisplay();
}

function updateBestDisplay() {
    const best = getBest();
    if (best) {
        bestEl.textContent = `best ${best.moves} · ${formatTime(best.time)}`;
    } else {
        bestEl.textContent = 'best --';
    }
}

// ---------------------------------------------------------------------------
// Level management
// ---------------------------------------------------------------------------
function populateLevelSelect() {
    levelSelect.innerHTML = '';
    for (let i = 0; i < LEVELS_PER_DIFFICULTY; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `Level ${i + 1}`;
        levelSelect.appendChild(opt);
    }
    levelSelect.value = levelIndex;
}

function loadLevel(index) {
    levelIndex = index;
    const seed = hashString(`${sessionSeed}:${difficulty}:${index}`);
    level = generateLevel(difficulty, seed);

    orientations = {};
    level.mirrors.forEach(m => { orientations[cellKey(m.r, m.c)] = m.initial; });

    moves = 0;
    solved = false;
    history = [];
    clearHint();
    statusEl.className = '';
    gameOverOverlay.classList.remove('show');
    levelSelect.value = levelIndex;

    startTimer();
    recompute();
    updateBestDisplay();
}

function setDifficulty(newDifficulty) {
    difficulty = newDifficulty;
    levelIndex = 0;
    populateLevelSelect();
    loadLevel(0);
}

function goToNextLevel() {
    if (levelIndex + 1 < LEVELS_PER_DIFFICULTY) {
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

function newPuzzleSet() {
    sessionSeed = (Math.random() * 0xFFFFFFFF) >>> 0;
    try { sessionStorage.setItem('reflect:seed', String(sessionSeed)); } catch (e) { /* ignore */ }
    levelIndex = 0;
    populateLevelSelect();
    loadLevel(0);
}

// ---------------------------------------------------------------------------
// UI handlers
// ---------------------------------------------------------------------------
resetBtn.addEventListener('click', () => loadLevel(levelIndex));
retryBtn.addEventListener('click', () => loadLevel(levelIndex));
nextBtn.addEventListener('click', goToNextLevel);
undoBtn.addEventListener('click', undo);
hintBtn.addEventListener('click', showHint);
newPuzzleBtn.addEventListener('click', newPuzzleSet);
difficultySelect.addEventListener('change', () => setDifficulty(difficultySelect.value));
levelSelect.addEventListener('change', () => loadLevel(parseInt(levelSelect.value, 10)));

document.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (e.key === 'z' || e.key === 'Z') { undo(); e.preventDefault(); }
    else if (e.key === 'r' || e.key === 'R') { loadLevel(levelIndex); }
    else if (e.key === 'h' || e.key === 'H') { showHint(); }
    else if (e.key === 'n' || e.key === 'N') { goToNextLevel(); }
});

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
(function init() {
    try {
        const stored = sessionStorage.getItem('reflect:seed');
        sessionSeed = stored ? (parseInt(stored, 10) >>> 0) : (Math.random() * 0xFFFFFFFF) >>> 0;
        if (!stored) sessionStorage.setItem('reflect:seed', String(sessionSeed));
    } catch (e) {
        sessionSeed = (Math.random() * 0xFFFFFFFF) >>> 0;
    }
    populateLevelSelect();
    loadLevel(0);
})();