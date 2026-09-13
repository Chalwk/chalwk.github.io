// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

const svg = document.getElementById('game-board');
const statusEl = document.getElementById('status');
const score1El = document.getElementById('score-1');
const score2El = document.getElementById('score-2');
const player2LabelEl = document.getElementById('player-2-label');
const resetBtn = document.getElementById('reset');
const pvpBtn = document.getElementById('pvp');
const pvaiBtn = document.getElementById('pvai');
const boardSizeSelect = document.getElementById('board-size');
const difficultySelect = document.getElementById('difficulty');
const difficultyLabel = document.getElementById('difficulty-label');

// ---------------------------------------------------------------------------
// Layout constants (SVG user-space units; the SVG scales responsively)
// ---------------------------------------------------------------------------
const CELL = 70;
const MARGIN = 28;
const DOT_R = 7;

// ---------------------------------------------------------------------------
// Global UI state (not part of simulate-able game state)
// ---------------------------------------------------------------------------
let mode = 'pvai';       // 'pvp' | 'pvai'
let difficulty = 'greedy'; // 'random' | 'greedy' | 'strategic'
let aiBusy = false;

// The core game state. n = dots per side. Boxes are (n-1) x (n-1).
let game = null;

// ---------------------------------------------------------------------------
// State helpers (all pure functions operating on a passed-in state object,
// so they double as the simulation engine used by the AI)
// ---------------------------------------------------------------------------
function createState(n) {
    return {
        n,
        horiz: Array.from({ length: n }, () => Array(n - 1).fill(false)),
        vert: Array.from({ length: n - 1 }, () => Array(n).fill(false)),
        owners: Array.from({ length: n - 1 }, () => Array(n - 1).fill(null)),
    };
}

function cloneState(state) {
    return {
        n: state.n,
        horiz: state.horiz.map(row => row.slice()),
        vert: state.vert.map(row => row.slice()),
        owners: state.owners.map(row => row.slice()),
    };
}

function isFilled(state, edge) {
    return edge.type === 'h' ? state.horiz[edge.r][edge.c] : state.vert[edge.r][edge.c];
}

function setFilled(state, edge) {
    if (edge.type === 'h') state.horiz[edge.r][edge.c] = true;
    else state.vert[edge.r][edge.c] = true;
}

function edgeKey(edge) {
    return `${edge.type}-${edge.r}-${edge.c}`;
}

function boxEdges(n, r, c) {
    return {
        top: { type: 'h', r, c },
        bottom: { type: 'h', r: r + 1, c },
        left: { type: 'v', r, c },
        right: { type: 'v', r, c: c + 1 },
    };
}

function countBoxEdges(state, r, c) {
    const e = boxEdges(state.n, r, c);
    return [e.top, e.bottom, e.left, e.right].filter(edge => isFilled(state, edge)).length;
}

function getMissingEdge(state, r, c) {
    const e = boxEdges(state.n, r, c);
    for (const edge of [e.top, e.bottom, e.left, e.right]) {
        if (!isFilled(state, edge)) return edge;
    }
    return null;
}

function getAdjacentBoxes(state, edge) {
    const boxes = [];
    const maxIdx = state.n - 2;
    if (edge.type === 'h') {
        if (edge.r - 1 >= 0) boxes.push({ r: edge.r - 1, c: edge.c });
        if (edge.r <= maxIdx) boxes.push({ r: edge.r, c: edge.c });
    } else {
        if (edge.c - 1 >= 0) boxes.push({ r: edge.r, c: edge.c - 1 });
        if (edge.c <= maxIdx) boxes.push({ r: edge.r, c: edge.c });
    }
    return boxes;
}

function getAllEdges(state) {
    const edges = [];
    for (let r = 0; r < state.n; r++) {
        for (let c = 0; c < state.n - 1; c++) {
            const e = { type: 'h', r, c };
            if (!isFilled(state, e)) edges.push(e);
        }
    }
    for (let r = 0; r < state.n - 1; r++) {
        for (let c = 0; c < state.n; c++) {
            const e = { type: 'v', r, c };
            if (!isFilled(state, e)) edges.push(e);
        }
    }
    return edges;
}

function getCompletingEdges(state) {
    return getAllEdges(state).filter(edge =>
        getAdjacentBoxes(state, edge).some(b => countBoxEdges(state, b.r, b.c) === 3)
    );
}

function getSafeEdges(state) {
    return getAllEdges(state).filter(edge =>
        getAdjacentBoxes(state, edge).every(b => countBoxEdges(state, b.r, b.c) <= 1)
    );
}

function totalBoxes(n) {
    return (n - 1) * (n - 1);
}

// Applies a move to the REAL game state, assigning box ownership to `player`.
// Returns the list of boxes newly captured.
function applyRealMove(state, edge, player) {
    setFilled(state, edge);
    const boxes = getAdjacentBoxes(state, edge);
    const captured = [];
    for (const b of boxes) {
        if (state.owners[b.r][b.c] === null && countBoxEdges(state, b.r, b.c) === 4) {
            state.owners[b.r][b.c] = player;
            captured.push(b);
        }
    }
    return captured;
}

// ---------------------------------------------------------------------------
// Chain simulation (used by the AI to reason about consequences)
// ---------------------------------------------------------------------------

// Starting from a single completing edge, greedily follow the resulting
// chain of forced captures on a private clone of `state`. Returns the
// ordered sequence of edges played and the total number of boxes captured.
function simulateChain(state, startEdge) {
    const local = cloneState(state);
    const sequence = [];
    let capturedCount = 0;
    let edge = startEdge;

    while (edge) {
        if (isFilled(local, edge)) break;
        const boxesBefore = getAdjacentBoxes(local, edge);
        const willComplete = boxesBefore.some(b => countBoxEdges(local, b.r, b.c) === 3);
        if (!willComplete) break;

        setFilled(local, edge);
        sequence.push(edge);

        const newlyCompleted = [];
        for (const b of boxesBefore) {
            if (local.owners[b.r][b.c] === null && countBoxEdges(local, b.r, b.c) === 4) {
                local.owners[b.r][b.c] = 'sim';
                newlyCompleted.push(b);
                capturedCount++;
            }
        }

        let nextEdge = null;
        for (const b of boxesBefore) {
            const wasCompleted = newlyCompleted.some(x => x.r === b.r && x.c === b.c);
            if (!wasCompleted && countBoxEdges(local, b.r, b.c) === 3) {
                nextEdge = getMissingEdge(local, b.r, b.c);
                break;
            }
        }
        edge = nextEdge;
    }

    return { sequence, capturedCount, finalState: local };
}

// Greedily takes every currently-available free box across the whole board
// on a private clone of `state`. Used to check whether any "safe haven"
// remains once all obviously-free boxes are cleared.
function simulateFullGreedyCapture(state) {
    const local = cloneState(state);
    while (true) {
        const completing = getCompletingEdges(local);
        if (!completing.length) break;
        const edge = completing[0];
        const boxesBefore = getAdjacentBoxes(local, edge);
        setFilled(local, edge);
        for (const b of boxesBefore) {
            if (local.owners[b.r][b.c] === null && countBoxEdges(local, b.r, b.c) === 4) {
                local.owners[b.r][b.c] = 'sim';
            }
        }
    }
    return local;
}

// ---------------------------------------------------------------------------
// AI strategies
// ---------------------------------------------------------------------------

function chooseRandomEdge(state) {
    const avail = getAllEdges(state);
    return avail[Math.floor(Math.random() * avail.length)];
}

function chooseGreedyEdge(state) {
    const completing = getCompletingEdges(state);
    if (completing.length) return completing[Math.floor(Math.random() * completing.length)];

    const safe = getSafeEdges(state);
    if (safe.length) return safe[Math.floor(Math.random() * safe.length)];

    const avail = getAllEdges(state);
    return avail[Math.floor(Math.random() * avail.length)];
}

// Strategic AI: takes free boxes, but recognizes when it's about to hand
// itself the "last move" before an otherwise-empty board and instead
// double-crosses (sacrifices the final two boxes of a chain) to keep the
// opponent stuck opening the next region. When forced to sacrifice, it
// opens the shortest available chain rather than a random one.
function chooseStrategicEdge(state) {
    const completing = getCompletingEdges(state);

    if (completing.length) {
        const { sequence, capturedCount } = simulateChain(state, completing[0]);

        if (capturedCount === 2 && sequence.length >= 2) {
            const afterAll = simulateFullGreedyCapture(state);
            const safeAfter = getSafeEdges(afterAll);
            const edgesLeftAfter = getAllEdges(afterAll);

            if (safeAfter.length === 0 && edgesLeftAfter.length > 0) {
                // Double-cross: play the outer edge of the final domino,
                // completing nothing and handing both boxes back.
                return sequence[sequence.length - 1];
            }
        }

        return completing[0];
    }

    const safe = getSafeEdges(state);
    if (safe.length) return safe[Math.floor(Math.random() * safe.length)];

    // Forced to open a chain: pick the move that gives away the fewest boxes.
    const avail = getAllEdges(state);
    let best = null;
    let bestLen = Infinity;
    for (const e of avail) {
        const cloned = cloneState(state);
        setFilled(cloned, e);
        const comp = getCompletingEdges(cloned);
        let len = 0;
        if (comp.length) {
            len = simulateChain(cloned, comp[0]).capturedCount;
        }
        if (len < bestLen) {
            bestLen = len;
            best = e;
        }
    }
    return best || avail[0];
}

function chooseAIEdge(state) {
    switch (difficulty) {
        case 'random': return chooseRandomEdge(state);
        case 'strategic': return chooseStrategicEdge(state);
        default: return chooseGreedyEdge(state);
    }
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

function buildBoard() {
    const n = game.n;
    const size = MARGIN * 2 + (n - 1) * CELL;
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.innerHTML = '';

    // Box backgrounds + labels (created empty, filled in as boxes are won)
    for (let r = 0; r < n - 1; r++) {
        for (let c = 0; c < n - 1; c++) {
            const x = MARGIN + c * CELL;
            const y = MARGIN + r * CELL;
            const rect = svgEl('rect', {
                id: `box-${r}-${c}`,
                class: 'db-box',
                x: x + 6, y: y + 6, width: CELL - 12, height: CELL - 12, rx: 8,
            });
            svg.appendChild(rect);
            const text = svgEl('text', {
                id: `boxtext-${r}-${c}`,
                class: 'db-box-text',
                x: x + CELL / 2, y: y + CELL / 2 + 2,
                'font-size': CELL * 0.4,
            });
            svg.appendChild(text);
        }
    }

    // Horizontal edges
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n - 1; c++) {
            addEdgeGroup({ type: 'h', r, c },
                MARGIN + c * CELL, MARGIN + r * CELL,
                MARGIN + (c + 1) * CELL, MARGIN + r * CELL);
        }
    }

    // Vertical edges
    for (let r = 0; r < n - 1; r++) {
        for (let c = 0; c < n; c++) {
            addEdgeGroup({ type: 'v', r, c },
                MARGIN + c * CELL, MARGIN + r * CELL,
                MARGIN + c * CELL, MARGIN + (r + 1) * CELL);
        }
    }

    // Dots on top
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            svg.appendChild(svgEl('circle', {
                class: 'db-dot',
                cx: MARGIN + j * CELL, cy: MARGIN + i * CELL, r: DOT_R,
            }));
        }
    }
}

function addEdgeGroup(edge, x1, y1, x2, y2) {
    const key = edgeKey(edge);
    const group = svgEl('g', { class: 'db-edge-group', id: `edge-${key}` });

    const hit = svgEl('line', { class: 'db-hit', x1, y1, x2, y2 });
    const line = svgEl('line', { class: 'db-line', id: `line-${key}`, x1, y1, x2, y2 });

    group.appendChild(hit);
    group.appendChild(line);
    group.addEventListener('click', () => onEdgeClick(edge));

    svg.appendChild(group);
}

function renderMoveResult(edge, player, capturedBoxes) {
    const key = edgeKey(edge);
    const line = document.getElementById(`line-${key}`);
    const group = document.getElementById(`edge-${key}`);
    line.classList.add(`filled-${player}`);
    group.classList.add('filled');

    for (const b of capturedBoxes) {
        const rect = document.getElementById(`box-${b.r}-${b.c}`);
        const text = document.getElementById(`boxtext-${b.r}-${b.c}`);
        rect.classList.add(`owner-${player}`);
        text.classList.add(`owner-${player}`);
        text.textContent = player === 1 ? '\u25CF' : '\u25CB';
    }
}

// ---------------------------------------------------------------------------
// Game flow
// ---------------------------------------------------------------------------
let currentPlayer = 1;
let scores = [0, 0];
let gameOver = false;

function isAITurn() {
    return mode === 'pvai' && currentPlayer === 2 && !gameOver;
}

function onEdgeClick(edge) {
    if (aiBusy || gameOver || isFilled(game, edge) || isAITurn()) return;
    playMove(edge);
}

function playMove(edge) {
    const player = currentPlayer;
    const captured = applyRealMove(game, edge, player);
    if (captured.length) scores[player - 1] += captured.length;

    renderMoveResult(edge, player, captured);

    const claimed = game.owners.flat().filter(o => o !== null).length;
    if (claimed === totalBoxes(game.n)) {
        endGame();
        return;
    }

    if (captured.length === 0) {
        currentPlayer = currentPlayer === 1 ? 2 : 1;
    }

    updateStatsUI();

    if (isAITurn()) {
        aiBusy = true;
        setTimeout(() => {
            const aiEdge = chooseAIEdge(game);
            aiBusy = false;
            playMove(aiEdge);
        }, 450);
    }
}

function endGame() {
    gameOver = true;
    updateStatsUI();

    let message;
    if (scores[0] === scores[1]) {
        message = "It's a tie!";
        statusEl.className = 'tie-message';
    } else {
        const winner = scores[0] > scores[1] ? 1 : 2;
        if (mode === 'pvai') {
            message = winner === 1 ? 'You win!' : 'AI wins!';
        } else {
            message = `Player ${winner} wins!`;
        }
        statusEl.className = 'win-message';
    }
    statusEl.textContent = message;
}

function updateStatsUI() {
    score1El.textContent = scores[0];
    score2El.textContent = scores[1];
    if (gameOver) return;

    if (mode === 'pvai') {
        statusEl.textContent = currentPlayer === 1 ? 'Your turn' : "AI's turn";
    } else {
        statusEl.textContent = `Player ${currentPlayer}'s turn`;
    }
}

function resetGame() {
    const n = parseInt(boardSizeSelect.value, 10);
    game = createState(n);
    currentPlayer = 1;
    scores = [0, 0];
    gameOver = false;
    statusEl.className = '';
    buildBoard();
    updateStatsUI();
}

function setMode(newMode) {
    mode = newMode;
    pvpBtn.className = mode === 'pvp' ? 'btn' : 'btn btn-secondary';
    pvaiBtn.className = mode === 'pvai' ? 'btn' : 'btn btn-secondary';
    difficultyLabel.classList.toggle('hidden', mode !== 'pvai');
    player2LabelEl.textContent = mode === 'pvai' ? 'AI:' : 'Player 2:';
    resetGame();
}

resetBtn.addEventListener('click', resetGame);
pvpBtn.addEventListener('click', () => setMode('pvp'));
pvaiBtn.addEventListener('click', () => setMode('pvai'));
boardSizeSelect.addEventListener('change', resetGame);
difficultySelect.addEventListener('change', () => {
    difficulty = difficultySelect.value;
});

difficulty = difficultySelect.value;
setMode(mode);
