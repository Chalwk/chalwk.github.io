// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

const svg = document.getElementById('game-board');
const statusEl = document.getElementById('status');
const movesEl = document.getElementById('moves');
const timerEl = document.getElementById('timer');
const parEl = document.getElementById('par');
const bestEl = document.getElementById('best');
const levelCounterEl = document.getElementById('level-counter');
const targetsStatusEl = document.getElementById('targets-status');
const budgetStatusEl = document.getElementById('budget-status');
const resetBtn = document.getElementById('reset');
const undoBtn = document.getElementById('undo');
const hintBtn = document.getElementById('hint');
const newPuzzleBtn = document.getElementById('new-puzzle-btn');
const difficultySelect = document.getElementById('difficulty');
const gameOverOverlay = document.getElementById('game-over-overlay');
const gameOverMessageEl = document.getElementById('game-over-message');
const gameOverDetailEl = document.getElementById('game-over-detail');
const starRowEl = document.getElementById('star-row');
const retryBtn = document.getElementById('retry-btn');
const nextBtn = document.getElementById('next-btn');

const BOARD_SIZE = 560;
const MARGIN = 24;
const DIFFICULTY_ORDER = ['easy', 'normal', 'hard'];
const DIRS = {
    N: { dr: -1, dc: 0 },
    S: { dr: 1, dc: 0 },
    E: { dr: 0, dc: 1 },
    W: { dr: 0, dc: -1 },
};
const TURN_RIGHT = { N: 'E', E: 'S', S: 'W', W: 'N' };

// Hard is intentionally constrained by a move budget. Easy remains relaxed.
const DIFFICULTY_CONFIG = {
    easy: {
        minSize: 6, maxSize: 7,
        mirrors: [3, 5], walls: [0, 2], fixed: [0, 1], decoys: [1, 2],
        targets: [1, 2], splitters: 0, portalPairs: 0,
        budgetExtra: Infinity, hintPenalty: 0,
    },
    normal: {
        minSize: 7, maxSize: 9,
        mirrors: [5, 8], walls: [2, 4], fixed: [0, 2], decoys: [2, 4],
        targets: [2, 3], splitters: [0, 1], portalPairs: [0, 1],
        budgetExtra: 8, hintPenalty: 1,
    },
    hard: {
        minSize: 8, maxSize: 10,
        mirrors: [7, 10], walls: [3, 6], fixed: [1, 3], decoys: [3, 6],
        targets: [2, 4], splitters: [1, 2], portalPairs: [1, 2],
        budgetExtra: 5, hintPenalty: 2,
    },
};

// ---------------------------------------------------------------------------
// Seeded PRNG
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

function randInt(rng, min, max) {
    return Math.floor(rng() * (max - min + 1)) + min;
}

function pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
}

function shuffleArray(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function cellKey(r, c) {
    return `${r},${c}`;
}

function stateKey(r, c, dir) {
    return `${r},${c},${dir}`;
}

// ---------------------------------------------------------------------------
// Level generation
// ---------------------------------------------------------------------------
function mirrorOrient(inDir, outDir) {
    const slash = { N: 'E', E: 'N', S: 'W', W: 'S' };
    return slash[inDir] === outDir ? '/' : '\\';
}

function toggleOrientation(o) {
    return o === '/' ? '\\' : '/';
}

function placeSource(rows, cols, rng) {
    const edge = randInt(rng, 0, 3);
    if (edge === 0) return { r: 0, c: randInt(rng, 1, cols - 2), dir: 'S' };
    if (edge === 1) return { r: rows - 1, c: randInt(rng, 1, cols - 2), dir: 'N' };
    if (edge === 2) return { r: randInt(rng, 1, rows - 2), c: 0, dir: 'E' };
    return { r: randInt(rng, 1, rows - 2), c: cols - 1, dir: 'W' };
}

// Build a simple non-self-intersecting solution route. A mirror is required at
// each turn, while straight segments provide safe locations for targets.
function walkPath(rows, cols, source, numMirrors, rng) {
    let r = source.r;
    let c = source.c;
    let dir = source.dir;
    const visited = new Set([cellKey(r, c)]);
    const mirrors = [];
    const segments = [];

    for (let i = 0; i < numMirrors; i++) {
        const maxStep = Math.max(1, Math.min(5, rows - 1, cols - 1));
        const stepLen = randInt(rng, 1, maxStep);
        const segmentStart = { r, c };
        let moved = 0;

        while (moved < stepLen) {
            const nr = r + DIRS[dir].dr;
            const nc = c + DIRS[dir].dc;
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) break;
            if (visited.has(cellKey(nr, nc))) break;
            r = nr;
            c = nc;
            visited.add(cellKey(r, c));
            moved++;
        }

        if (!moved) return null;
        segments.push({ from: segmentStart, to: { r, c }, dir });

        const perp = (dir === 'N' || dir === 'S') ? ['E', 'W'] : ['N', 'S'];
        const validDirs = perp.filter(d => {
            const nr = r + DIRS[d].dr;
            const nc = c + DIRS[d].dc;
            return nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited.has(cellKey(nr, nc));
        });
        if (!validDirs.length) return null;

        const newDir = pick(rng, validDirs);
        mirrors.push({ r, c, orient: mirrorOrient(dir, newDir) });
        dir = newDir;
    }

    const finalCandidates = [];
    for (let s = 2; s <= Math.min(6, rows + cols); s++) {
        const nr = r + DIRS[dir].dr * s;
        const nc = c + DIRS[dir].dc * s;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) break;
        if (visited.has(cellKey(nr, nc))) break;
        finalCandidates.push({ r: nr, c: nc, steps: s });
    }
    if (!finalCandidates.length) return null;

    const final = pick(rng, finalCandidates);
    for (let s = 1; s <= final.steps; s++) {
        visited.add(cellKey(r + DIRS[dir].dr * s, c + DIRS[dir].dc * s));
    }

    const target = { r: final.r, c: final.c };
    return { mirrors, target, visited, dir, segments };
}

function chooseTargets(path, count, rng) {
    const candidates = [];
    const occupiedMirrors = new Set(path.mirrors.map(m => cellKey(m.r, m.c)));
    for (const key of path.visited) {
        const [r, c] = key.split(',').map(Number);
        if (key === cellKey(path.target.r, path.target.c)) continue;
        if (occupiedMirrors.has(key)) continue;
        candidates.push({ r, c });
    }
    candidates.push({ r: path.target.r, c: path.target.c });
    shuffleArray(candidates, rng);
    return candidates.slice(0, Math.max(1, Math.min(count, candidates.length)));
}

function occupiedSet(level) {
    return new Set([
        cellKey(level.source.r, level.source.c),
        ...level.walls.map(w => cellKey(w.r, w.c)),
        ...level.mirrors.map(m => cellKey(m.r, m.c)),
        ...level.targets.map(t => cellKey(t.r, t.c)),
        ...level.splitters.map(s => cellKey(s.r, s.c)),
        ...level.portals.map(p => cellKey(p.r, p.c)),
    ]);
}

function fallbackLevel() {
    return {
        size: [7, 7],
        source: { r: 3, c: 0, dir: 'E' },
        mirrors: [
            { r: 3, c: 2, initial: '\\', solution: '/', fixed: false },
            { r: 1, c: 2, initial: '/', solution: '\\', fixed: false },
        ],
        walls: [{ r: 0, c: 4 }],
        targets: [{ r: 1, c: 4 }, { r: 1, c: 6 }],
        splitters: [],
        portals: [],
        par: 2,
        budget: 10,
    };
}

function generateLevel(difficulty, seed, depth = 0) {
    if (depth > 7) return fallbackLevel();
    const cfg = DIFFICULTY_CONFIG[difficulty];
    const rng = makeRNG(seed);

    for (let attempt = 0; attempt < 180; attempt++) {
        const size = randInt(rng, cfg.minSize, cfg.maxSize);
        const rows = size;
        const cols = size;
        const source = placeSource(rows, cols, rng);
        const numMirrors = randInt(rng, cfg.mirrors[0], cfg.mirrors[1]);
        const path = walkPath(rows, cols, source, numMirrors, rng);
        if (!path || path.mirrors.length < 2) continue;

        const fixedCount = Math.min(
            Math.max(0, path.mirrors.length - 2),
            randInt(rng, cfg.fixed[0], cfg.fixed[1])
        );
        const fixedIndexes = new Set();
        while (fixedIndexes.size < fixedCount) fixedIndexes.add(randInt(rng, 0, path.mirrors.length - 1));

        const mirrors = path.mirrors.map((m, i) => ({
            r: m.r,
            c: m.c,
            initial: m.orient,
            solution: m.orient,
            fixed: fixedIndexes.has(i),
        }));

        let flipped = 0;
        mirrors.forEach(m => {
            if (m.fixed) return;
            if (rng() < 0.72) {
                m.initial = toggleOrientation(m.initial);
                flipped++;
            }
        });
        if (!flipped) {
            const movable = mirrors.filter(m => !m.fixed);
            if (movable.length) {
                const m = pick(rng, movable);
                m.initial = toggleOrientation(m.initial);
            }
        }

        const base = {
            size: [rows, cols], source, mirrors,
            walls: [], targets: chooseTargets(path, randInt(rng, cfg.targets[0], cfg.targets[1]), rng),
            splitters: [], portals: [],
        };

        const occupied = occupiedSet(base);
        const available = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const key = cellKey(r, c);
                if (!occupied.has(key)) available.push({ r, c });
            }
        }
        shuffleArray(available, rng);

        // Decoy mirrors make the visually obvious solution less reliable.
        let cursor = 0;
        const decoyCount = Math.min(cfg.decoys[1], Math.min(available.length, randInt(rng, cfg.decoys[0], cfg.decoys[1])));
        for (let i = 0; i < decoyCount; i++) {
            const cell = available[cursor++];
            if (!cell) break;
            base.mirrors.push({ r: cell.r, c: cell.c, initial: rng() < 0.5 ? '/' : '\\', solution: null, fixed: false });
        }

        // Walls are selected after mirrors so they never overlap a usable piece.
        const wallCount = Math.min(randInt(rng, cfg.walls[0], cfg.walls[1]), available.length - cursor);
        for (let i = 0; i < wallCount; i++) base.walls.push(available[cursor++]);

        // Special pieces are deliberately placed off the guaranteed solution path.
        const specialCount = randInt(rng, cfg.splitters[0], cfg.splitters[1]);
        for (let i = 0; i < specialCount && cursor < available.length; i++) {
            const cell = available[cursor++];
            base.splitters.push({ r: cell.r, c: cell.c });
        }

        const portalPairCount = randInt(rng, cfg.portalPairs[0], cfg.portalPairs[1]);
        for (let pair = 0; pair < portalPairCount; pair++) {
            if (cursor + 1 >= available.length) break;
            const a = available[cursor++];
            const b = available[cursor++];
            base.portals.push({ id: pair + 1, r: a.r, c: a.c });
            base.portals.push({ id: pair + 1, r: b.r, c: b.c });
        }

        // The intended solution is always represented by the solution orientations.
        const solutionOrientations = {};
        base.mirrors.forEach(m => { solutionOrientations[cellKey(m.r, m.c)] = m.solution || m.initial; });
        const solutionTrace = traceBeam(base, solutionOrientations);
        const requiredTargets = new Set(base.targets.map(t => cellKey(t.r, t.c)));
        const solvedTargets = requiredTargets.size === 0
            ? true
            : [...requiredTargets].every(k => solutionTrace.hitTargets.has(k));

        if (!solvedTargets) continue;

        const par = base.mirrors.filter(m => !m.fixed && m.solution && m.initial !== m.solution).length;
        const budget = Number.isFinite(cfg.budgetExtra) ? par + cfg.budgetExtra : Infinity;
        return { ...base, par: Math.max(1, par), budget };
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

function traceBeam(levelData, orientations) {
    const [rows, cols] = levelData.size;
    const wallSet = new Set(levelData.walls.map(w => cellKey(w.r, w.c)));
    const mirrorMap = new Map();
    levelData.mirrors.forEach(m => mirrorMap.set(cellKey(m.r, m.c), orientations[cellKey(m.r, m.c)]));
    const splitterSet = new Set(levelData.splitters.map(s => cellKey(s.r, s.c)));
    const portalMap = new Map();
    const portalsById = new Map();
    levelData.portals.forEach(p => {
        const key = cellKey(p.r, p.c);
        portalMap.set(key, p);
        if (!portalsById.has(p.id)) portalsById.set(p.id, []);
        portalsById.get(p.id).push(p);
    });

    const requiredTargets = new Set(levelData.targets.map(t => cellKey(t.r, t.c)));
    const hitTargets = new Set();
    const paths = [];
    const queue = [{ r: levelData.source.r, c: levelData.source.c, dir: levelData.source.dir, path: [{ r: levelData.source.r, c: levelData.source.c }] }];
    const visitedStates = new Set();
    let blockedCount = 0;
    let lostCount = 0;
    let splitCount = 0;
    let safety = 0;

    while (queue.length && safety++ < rows * cols * 16) {
        const ray = queue.shift();
        const path = ray.path.slice();
        let r = ray.r;
        let c = ray.c;
        let dir = ray.dir;
        let terminated = false;

        for (let step = 0; step < rows * cols * 3; step++) {
            const loopKey = stateKey(r, c, dir);
            if (visitedStates.has(loopKey)) {
                lostCount++;
                terminated = true;
                break;
            }
            visitedStates.add(loopKey);

            const nr = r + DIRS[dir].dr;
            const nc = c + DIRS[dir].dc;
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
                path.push({ r: nr, c: nc, offgrid: true });
                lostCount++;
                terminated = true;
                break;
            }

            r = nr;
            c = nc;
            path.push({ r, c });
            const key = cellKey(r, c);

            if (requiredTargets.has(key)) hitTargets.add(key);
            if (wallSet.has(key)) {
                blockedCount++;
                terminated = true;
                break;
            }

            const portal = portalMap.get(key);
            if (portal) {
                const pair = portalsById.get(portal.id) || [];
                const destination = pair.find(p => p.r !== portal.r || p.c !== portal.c);
                if (destination) {
                    r = destination.r;
                    c = destination.c;
                    path.push({ r, c, portal: true });
                    if (requiredTargets.has(cellKey(r, c))) hitTargets.add(cellKey(r, c));
                }
            }

            const mirrorOrientation = mirrorMap.get(key);
            if (mirrorOrientation) {
                dir = reflect(dir, mirrorOrientation);
            }

            if (splitterSet.has(key)) {
                splitCount++;
                const branchDir = TURN_RIGHT[dir];
                const branchKey = stateKey(r, c, branchDir);
                if (!visitedStates.has(branchKey)) {
                    queue.push({
                        r, c, dir: branchDir,
                        path: path.concat([{ r, c, split: true }]),
                    });
                }
            }
        }

        paths.push({ points: path, terminal: terminated ? 'ended' : 'limit' });
    }

    const allTargetsHit = requiredTargets.size === 0 || [...requiredTargets].every(k => hitTargets.has(k));
    let status = 'lost';
    if (allTargetsHit) status = 'hit';
    else if (blockedCount > 0) status = 'blocked';

    return { paths, status, hitTargets, blockedCount, lostCount, splitCount };
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let difficulty = 'normal';
let puzzleSeed = 0;
let puzzleNumber = 0;
let level = null;
let orientations = {};
let moves = 0;
let solved = false;
let elapsedSeconds = 0;
let timerHandle = null;
let history = [];
let hintKey = null;
let hintTimer = null;
let hintUses = 0;

// ---------------------------------------------------------------------------
// SVG rendering
// ---------------------------------------------------------------------------
const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
}

function cellPixel(r, c, cell) {
    return { x: MARGIN + (c + 0.5) * cell, y: MARGIN + (r + 0.5) * cell };
}

function isWallCell(r, c) {
    return level.walls.some(w => w.r === r && w.c === c);
}

function renderBoard() {
    if (!level) return;
    const [rows, cols] = level.size;
    const cell = (BOARD_SIZE - MARGIN * 2) / Math.max(rows, cols);
    svg.setAttribute('viewBox', `0 0 ${BOARD_SIZE} ${BOARD_SIZE}`);
    svg.innerHTML = '';

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const x = MARGIN + c * cell;
            const y = MARGIN + r * cell;
            svg.appendChild(svgEl('rect', { class: 'cell-bg', x, y, width: cell, height: cell, rx: 2 }));
            if (isWallCell(r, c)) drawWall(r, c, cell);
        }
    }

    drawSource(cell);
    drawSpecials(cell);
    drawTargets(cell);
    level.mirrors.forEach(m => drawMirror(m, cell));
    drawBeam(cell);
}

function drawWall(r, c, cell) {
    const x = MARGIN + c * cell;
    const y = MARGIN + r * cell;
    svg.appendChild(svgEl('rect', {
        class: 'cell-wall', x: x + 2, y: y + 2, width: cell - 4, height: cell - 4, rx: 5,
    }));
    svg.appendChild(svgEl('line', { class: 'cell-wall-hatch', x1: x + cell * 0.2, y1: y + cell * 0.2, x2: x + cell * 0.8, y2: y + cell * 0.8 }));
    svg.appendChild(svgEl('line', { class: 'cell-wall-hatch', x1: x + cell * 0.8, y1: y + cell * 0.2, x2: x + cell * 0.2, y2: y + cell * 0.8 }));
}

function drawSource(cell) {
    const { r, c, dir } = level.source;
    const { x, y } = cellPixel(r, c, cell);
    const s = cell * 0.28;
    const rot = { N: 270, S: 90, E: 0, W: 180 }[dir];
    const pts = `${x - s},${y - s} ${x + s},${y} ${x - s},${y + s}`;
    svg.appendChild(svgEl('polygon', { class: 'source-shape', points: pts, transform: `rotate(${rot} ${x} ${y})` }));
}

function drawTargets(cell) {
    const hitTargets = level._trace ? level._trace.hitTargets : new Set();
    level.targets.forEach((target, index) => {
        const { x, y } = cellPixel(target.r, target.c, cell);
        const lit = hitTargets.has(cellKey(target.r, target.c));
        svg.appendChild(svgEl('circle', {
            class: `target-ring${lit ? ' lit' : ''}`,
            cx: x, cy: y, r: cell * 0.3,
        }));
        svg.appendChild(svgEl('circle', {
            class: `target-dot${lit ? ' lit' : ''}`,
            cx: x, cy: y, r: cell * 0.09,
        }));
        svg.appendChild(svgEl('text', {
            x, y: y - cell * 0.33, fill: lit ? '#4ade80' : 'rgba(255,255,255,0.45)',
            'font-size': Math.max(8, cell * 0.12), 'font-family': 'var(--font-mono)', 'font-weight': '700', 'text-anchor': 'middle',
        })).textContent = `${index + 1}`;
    });
}

function drawSpecials(cell) {
    level.splitters.forEach(s => {
        const { x, y } = cellPixel(s.r, s.c, cell);
        const size = cell * 0.25;
        svg.appendChild(svgEl('rect', { class: 'splitter-body', x: x - size, y: y - size, width: size * 2, height: size * 2, rx: size * 0.4, transform: `rotate(45 ${x} ${y})` }));
        svg.appendChild(svgEl('line', { class: 'splitter-ray', x1: x - size * 0.8, y1: y, x2: x + size * 0.8, y2: y }));
        svg.appendChild(svgEl('line', { class: 'splitter-ray', x1: x, y1: y, x2: x, y2: y - size * 0.8 }));
    });

    const grouped = new Map();
    level.portals.forEach(p => {
        if (!grouped.has(p.id)) grouped.set(p.id, []);
        grouped.get(p.id).push(p);
    });
    grouped.forEach((parts, id) => parts.forEach(p => {
        const { x, y } = cellPixel(p.r, p.c, cell);
        svg.appendChild(svgEl('circle', { class: 'portal-ring', cx: x, cy: y, r: cell * 0.27 }));
        svg.appendChild(svgEl('circle', { class: 'portal-core', cx: x, cy: y, r: cell * 0.1 }));
        svg.appendChild(svgEl('text', { class: 'portal-label', x, y, 'font-size': Math.max(8, cell * 0.12) })).textContent = id;
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
    const hit = svgEl('rect', { class: `cell-hit${m.fixed ? ' static' : ''}`, x: x - cell / 2, y: y - cell / 2, width: cell, height: cell, rx: 2 });
    const line = svgEl('line', { class: `mirror-line${isHint ? ' hint' : ''}`, x1, y1, x2, y2 });
    group.appendChild(hit);
    group.appendChild(line);

    if (m.fixed) {
        group.appendChild(svgEl('circle', { class: 'mirror-lock', cx: x + cell * 0.32, cy: y - cell * 0.32, r: cell * 0.07 }));
    } else {
        group.addEventListener('click', () => onMirrorClick(m));
    }
    svg.appendChild(group);
}

function drawBeam(cell) {
    if (!level._trace) return;
    const status = level._trace.status;
    level._trace.paths.forEach(path => {
        const points = path.points.map(p => {
            if (p.offgrid) {
                const clampedR = Math.max(0, Math.min(level.size[0] - 1, p.r));
                const clampedC = Math.max(0, Math.min(level.size[1] - 1, p.c));
                const center = cellPixel(clampedR, clampedC, cell);
                const px = p.c < 0 ? MARGIN : p.c >= level.size[1] ? MARGIN + level.size[1] * cell : center.x;
                const py = p.r < 0 ? MARGIN : p.r >= level.size[0] ? MARGIN + level.size[0] * cell : center.y;
                return `${px},${py}`;
            }
            const pt = cellPixel(p.r, p.c, cell);
            return `${pt.x},${pt.y}`;
        }).join(' ');
        if (points) svg.appendChild(svgEl('polyline', { class: `beam-path ${status}`, points }));
    });
}

// ---------------------------------------------------------------------------
// UI helpers and flow
// ---------------------------------------------------------------------------
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
        if (solved) return;
        elapsedSeconds++;
        timerEl.textContent = formatTime(elapsedSeconds);
    }, 1000);
}

function stopTimer() {
    if (timerHandle) clearInterval(timerHandle);
    timerHandle = null;
}

function getMoveBudget() {
    return level ? level.budget : Infinity;
}

function recompute() {
    level._trace = traceBeam(level, orientations);
    renderBoard();
    updateStatsUI();
    if (level._trace.status === 'hit' && !solved) winLevel();
    if (!solved && Number.isFinite(getMoveBudget()) && moves >= getMoveBudget()) {
        loseOnMoveLimit();
    }
}

function updateStatsUI() {
    movesEl.textContent = moves;
    if (parEl && level) parEl.textContent = `par ${level.par}`;
    if (levelCounterEl) levelCounterEl.textContent = `Puzzle ${puzzleNumber}`;
    if (!level || !level._trace) return;

    const hit = level._trace.hitTargets.size;
    const total = level.targets.length;
    if (targetsStatusEl) targetsStatusEl.textContent = `Targets ${hit}/${total}`;
    if (budgetStatusEl) budgetStatusEl.textContent = Number.isFinite(level.budget) ? `Moves ${Math.max(0, level.budget - moves)} left` : 'Moves ∞';

    if (solved) return;
    statusEl.classList.remove('blocked-message', 'win-message', 'lost-message', 'limit-message');
    if (Number.isFinite(level.budget) && moves >= level.budget) {
        statusEl.textContent = 'Move limit reached. Retry and route more carefully.';
        statusEl.classList.add('limit-message');
    } else if (level._trace.status === 'blocked') {
        statusEl.textContent = level._trace.hitTargets.size ? 'Partial route! Avoid the obstruction.' : 'Blocked! Find a better route.';
        statusEl.classList.add('blocked-message');
    } else if (level._trace.hitTargets.size > 0) {
        statusEl.textContent = 'Nice! Keep the beam moving through every target.';
    } else if (level._trace.status === 'lost') {
        statusEl.textContent = 'Beam escaped. Try a different angle.';
        statusEl.classList.add('lost-message');
    } else {
        statusEl.textContent = 'Rotate the mirrors to guide the beam';
    }
}

function onMirrorClick(m) {
    if (solved || m.fixed) return;
    if (Number.isFinite(getMoveBudget()) && moves >= getMoveBudget()) return;
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
    if (solved || !level) return;
    const wrong = level.mirrors.filter(m => !m.fixed && m.solution && orientations[cellKey(m.r, m.c)] !== m.solution);
    if (!wrong.length) return;
    hintKey = cellKey(wrong[0].r, wrong[0].c);
    hintUses++;
    if (hintTimer) clearTimeout(hintTimer);
    renderBoard();
    hintTimer = setTimeout(() => {
        hintKey = null;
        hintTimer = null;
        renderBoard();
    }, 1800);
}

function clearHint() {
    if (hintTimer) clearTimeout(hintTimer);
    hintTimer = null;
    hintKey = null;
}

function computeStars(moveCount, par, budget) {
    const overPar = Math.max(0, moveCount - par);
    let stars = overPar === 0 ? 3 : overPar <= 2 ? 2 : 1;
    if (Number.isFinite(budget) && moveCount >= budget) stars = 0;
    if (hintUses > 0) stars = Math.max(1, stars - 1);
    if (hintUses >= 2) stars = 1;
    return stars;
}

function winLevel() {
    solved = true;
    stopTimer();
    statusEl.textContent = 'Every target is lit!';
    statusEl.classList.remove('blocked-message', 'lost-message', 'limit-message');
    statusEl.classList.add('win-message');

    const stars = computeStars(moves, level.par, level.budget);
    renderStars(stars);
    gameOverMessageEl.textContent = stars === 3 ? 'Perfect!' : stars === 2 ? 'Clean solve!' : 'Solved!';
    const targetText = `${level.targets.length} target${level.targets.length === 1 ? '' : 's'} lit`;
    const hintText = hintUses ? ` · ${hintUses} hint${hintUses === 1 ? '' : 's'}` : '';
    gameOverDetailEl.textContent = `${moves} move${moves === 1 ? '' : 's'} · par ${level.par} · ${formatTime(elapsedSeconds)} · ${targetText}${hintText}`;

    saveBest(stars);
    updateStatsUI();

    nextBtn.hidden = false;
    nextBtn.textContent = 'Next Puzzle';
    gameOverOverlay.classList.add('show');
}

function loseOnMoveLimit() {
    stopTimer();
    statusEl.textContent = 'Out of moves. Reset and try a cleaner route.';
    statusEl.classList.remove('blocked-message', 'lost-message', 'win-message');
    statusEl.classList.add('limit-message');
    gameOverMessageEl.textContent = 'No moves left';
    gameOverDetailEl.textContent = `You used ${moves} of ${level.budget} moves. Your puzzle is still solvable.`;
    renderStars(0);
    nextBtn.hidden = false;
    nextBtn.textContent = 'New Puzzle';
    gameOverOverlay.classList.add('show');
}

function renderStars(stars) {
    starRowEl.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const span = document.createElement('span');
        span.className = `star${i < stars ? ' filled' : ''}`;
        span.textContent = '★';
        span.style.animationDelay = `${i * 0.12}s`;
        starRowEl.appendChild(span);
    }
}

// ---------------------------------------------------------------------------
// Persistence (best result per difficulty, across all random puzzles)
// ---------------------------------------------------------------------------
function bestKey() {
    return `reflect:best:${difficulty}`;
}

function getBest() {
    try {
        return JSON.parse(localStorage.getItem(bestKey()));
    } catch (e) {
        return null;
    }
}

function saveBest(stars) {
    const prev = getBest();
    const next = {
        moves: prev ? Math.min(prev.moves, moves) : moves,
        time: prev ? Math.min(prev.time, elapsedSeconds) : elapsedSeconds,
        stars: Math.max(stars, prev ? prev.stars : 0),
    };
    try { localStorage.setItem(bestKey(), JSON.stringify(next)); } catch (e) { /* storage can be unavailable */ }
    updateBestDisplay();
}

function updateBestDisplay() {
    const best = getBest();
    bestEl.textContent = best ? `best ${best.moves} · ${formatTime(best.time)}` : 'best --';
}

// ---------------------------------------------------------------------------
// Puzzle management - every puzzle is freshly generated from a random seed.
// ---------------------------------------------------------------------------
function randomSeed() {
    return (Math.random() * 0xFFFFFFFF) >>> 0;
}

function loadPuzzle(seed) {
    stopTimer();
    clearHint();
    puzzleSeed = seed >>> 0;
    level = generateLevel(difficulty, hashString(`${puzzleSeed}:${difficulty}`));

    orientations = {};
    level.mirrors.forEach(m => { orientations[cellKey(m.r, m.c)] = m.initial; });
    moves = 0;
    solved = false;
    history = [];
    hintUses = 0;
    gameOverOverlay.classList.remove('show');
    statusEl.className = '';
    statusEl.textContent = 'Rotate the mirrors to guide the beam';
    startTimer();
    recompute();
    updateBestDisplay();
}

function newPuzzle() {
    puzzleNumber++;
    loadPuzzle(randomSeed());
}

function setDifficulty(newDifficulty) {
    if (!DIFFICULTY_ORDER.includes(newDifficulty)) return;
    difficulty = newDifficulty;
    puzzleNumber = 0;
    newPuzzle();
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
resetBtn.addEventListener('click', () => loadPuzzle(puzzleSeed));
retryBtn.addEventListener('click', () => loadPuzzle(puzzleSeed));
nextBtn.addEventListener('click', newPuzzle);
undoBtn.addEventListener('click', undo);
hintBtn.addEventListener('click', showHint);
newPuzzleBtn.addEventListener('click', newPuzzle);
difficultySelect.addEventListener('change', () => setDifficulty(difficultySelect.value));

document.addEventListener('keydown', e => {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (e.key === 'z' || e.key === 'Z') { undo(); e.preventDefault(); }
    else if (e.key === 'r' || e.key === 'R') { loadPuzzle(puzzleSeed); e.preventDefault(); }
    else if (e.key === 'h' || e.key === 'H') { showHint(); e.preventDefault(); }
    else if (e.key === 'n' || e.key === 'N') { newPuzzle(); e.preventDefault(); }
});

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
(function init() {
    difficultySelect.value = difficulty;
    newPuzzle();
})();