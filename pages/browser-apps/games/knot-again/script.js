// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

(() => {
    // ---------- DOM ----------
    const svg = document.getElementById('game-board');
    const resetBtn = document.getElementById('resetBtn');
    const shuffleBtn = document.getElementById('shuffleBtn');
    const nextBtn = document.getElementById('nextBtn');
    const undoBtn = document.getElementById('undoBtn');
    const hintBtn = document.getElementById('hintBtn');
    const muteBtn = document.getElementById('muteBtn');
    const winOverlay = document.getElementById('game-over-overlay');
    const winNext = document.getElementById('winNext');
    const winShuffle = document.getElementById('winShuffle');
    const winDetail = document.getElementById('winDetail');
    const levelLabel = document.getElementById('levelLabel');
    const crossCountEl = document.getElementById('crossCount');
    const statusEl = document.getElementById('status');
    const movesEl = document.getElementById('movesCount');
    const timeEl = document.getElementById('timeCount');

    const STORAGE_KEY = 'knot-again-save-v1';

    // ---------- sound (procedural) ----------
    const Sound = (() => {
        let ctx = null;
        let muted = localStorage.getItem(STORAGE_KEY + ':muted') === '1';

        function ensureCtx() {
            if (!ctx) {
                const AC = window.AudioContext || window.webkitAudioContext;
                if (AC) ctx = new AC();
            }
            if (ctx && ctx.state === 'suspended') ctx.resume();
            return ctx;
        }

        function tone({ freq = 440, duration = 0.12, type = 'sine', gain = 0.07, glideTo = null, delay = 0 }) {
            if (muted) return;
            const c = ensureCtx();
            if (!c) return;
            const osc = c.createOscillator();
            const g = c.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, c.currentTime + delay);
            if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, c.currentTime + delay + duration);
            g.gain.setValueAtTime(0.0001, c.currentTime + delay);
            g.gain.linearRampToValueAtTime(gain, c.currentTime + delay + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + delay + duration);
            osc.connect(g).connect(c.destination);
            osc.start(c.currentTime + delay);
            osc.stop(c.currentTime + delay + duration + 0.03);
        }

        return {
            pickup() { tone({ freq: 320, duration: 0.08, type: 'triangle', gain: 0.05 }); },
            drop() { tone({ freq: 220, duration: 0.09, type: 'triangle', gain: 0.05 }); },
            crossingCleared() { tone({ freq: 660, duration: 0.12, type: 'sine', gain: 0.06, glideTo: 880 }); },
            click() { tone({ freq: 380, duration: 0.05, type: 'square', gain: 0.04 }); },
            undo() { tone({ freq: 260, duration: 0.09, type: 'sawtooth', gain: 0.04 }); },
            hint() { tone({ freq: 700, duration: 0.15, type: 'sine', gain: 0.05, glideTo: 950 }); },
            win() {
                [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
                    tone({ freq: f, duration: 0.2, type: 'sine', gain: 0.07, delay: i * 0.09 })
                );
            },
            unlock() { ensureCtx(); },
            toggleMute() {
                muted = !muted;
                localStorage.setItem(STORAGE_KEY + ':muted', muted ? '1' : '0');
                if (!muted) ensureCtx();
                return muted;
            },
            isMuted() { return muted; },
        };
    })();

    // ---------- game state ----------
    const state = {
        level: 1,
        nodes: [],
        edges: [],
        w: 1000,
        h: 700,
    };

    let activeDrag = null;   // { node, offsetX, offsetY, startX, startY, startCrossCount }
    let undoStack = [];      // array of move-lists: [{ id, x, y }, ...]
    let moves = 0;
    let elapsedSeconds = 0;
    let timerInterval = null;

    // --- geometry helpers ---
    // check if two line segments (p1-p2, p3-p4) intersect
    function segmentsIntersect(p1, p2, p3, p4) {
        function orient(a, b, c) {
            return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
        }

        function onSegment(a, b, c) {
            return Math.min(a.x, b.x) <= c.x + 1e-6 && c.x <= Math.max(a.x, b.x) + 1e-6 &&
                Math.min(a.y, b.y) <= c.y + 1e-6 && c.y <= Math.max(a.y, b.y) + 1e-6;
        }

        const o1 = orient(p1, p2, p3);
        const o2 = orient(p1, p2, p4);
        const o3 = orient(p3, p4, p1);
        const o4 = orient(p3, p4, p2);
        if (o1 === 0 && onSegment(p1, p2, p3)) return true;
        if (o2 === 0 && onSegment(p1, p2, p4)) return true;
        if (o3 === 0 && onSegment(p3, p4, p1)) return true;
        if (o4 === 0 && onSegment(p3, p4, p2)) return true;
        return (o1 * o2 < 0) && (o3 * o4 < 0);
    }

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function makeSvg(tag, attrs) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const k in attrs) el.setAttribute(k, attrs[k]);
        return el;
    }

    function clearSvg() {
        while (svg.firstChild) svg.removeChild(svg.firstChild);
    }

    function formatTime(sec) {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    // --- level generation ---
    // builds a planar-ish graph with some random extra edges, then shuffles
    // node positions to create the tangled look
    function generateLevel(level) {
        const nodeCount = Math.min(8 + level, 16);
        const maxEdges = Math.floor(nodeCount * 1.6);

        // place nodes on a circle (base positions)
        const cx = state.w / 2;
        const cy = state.h / 2;
        const r = Math.min(state.w, state.h) / 2 - 90;
        const basePositions = [];
        for (let i = 0; i < nodeCount; i++) {
            const a = (i / nodeCount) * Math.PI * 2;
            basePositions.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
        }

        const edges = [];
        for (let i = 0; i < nodeCount; i++) edges.push({ a: i, b: (i + 1) % nodeCount });

        // helper: does edge (i,j) cross any existing edge?
        function crossesExisting(i, j) {
            const p1 = basePositions[i];
            const p2 = basePositions[j];
            for (const e of edges) {
                const q1 = basePositions[e.a];
                const q2 = basePositions[e.b];
                if (e.a === i || e.b === i || e.a === j || e.b === j) continue;
                if (segmentsIntersect(p1, p2, q1, q2)) return true;
            }
            return false;
        }

        // randomly add extra edges that don't cause crossings (keeps puzzles solvable)
        for (let attempts = 0; attempts < nodeCount * 6 && edges.length < maxEdges; attempts++) {
            const a = Math.floor(Math.random() * nodeCount);
            const b = Math.floor(Math.random() * nodeCount);
            if (a === b) continue;
            if (edges.some(e => (e.a === a && e.b === b) || (e.a === b && e.b === a))) continue;
            if (crossesExisting(a, b)) continue;
            edges.push({ a, b });
        }

        // shuffle node positions (this creates the tangled look)
        const permuted = shuffleArray(basePositions.map((p, i) => ({ ...p, id: i })))
            .map((p, idx) => ({ x: p.x, y: p.y, id: idx, baseIndex: p.id }));
        const nodes = permuted.map((p, i) => ({
            id: i,
            x: p.x,
            y: p.y,
            baseX: basePositions[p.baseIndex].x,
            baseY: basePositions[p.baseIndex].y,
            radius: 12,
        }));

        return { nodes, edges };
    }

    function shuffleArray(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // --- drawing & interaction ---
    function buildScene(spec) {
        clearSvg();
        state.nodes = spec.nodes.map(n => ({ ...n }));
        state.edges = spec.edges.map(e => ({ a: e.a, b: e.b }));

        // draw edges first (so they're behind nodes)
        for (const e of state.edges) {
            const A = state.nodes[e.a];
            const B = state.nodes[e.b];
            const line = makeSvg('line', {
                x1: A.x, y1: A.y, x2: B.x, y2: B.y,
                class: 'knot-edge',
            });
            svg.appendChild(line);
            e.el = line;
        }

        // draw nodes (draggable circles with labels)
        for (const n of state.nodes) {
            const g = makeSvg('g', {
                class: 'knot-node',
                transform: `translate(${n.x}, ${n.y})`,
                tabindex: '0',
                role: 'button',
                'aria-label': `Knot point ${n.id + 1}. Use arrow keys to move.`,
            });
            const circle = makeSvg('circle', {
                cx: 0, cy: 0, r: n.radius,
                class: 'knot-node-circle',
            });
            const inner = makeSvg('circle', {
                cx: 0, cy: 0, r: 5,
                class: 'knot-node-inner',
            });
            const label = makeSvg('text', {
                x: 0, y: 0,
                class: 'knot-node-label',
            });
            label.textContent = n.id + 1;

            g.appendChild(circle);
            g.appendChild(inner);
            g.appendChild(label);
            svg.appendChild(g);

            n.group = g;
            n.circle = circle;
            n.labelEl = label;
            attachNodeHandlers(g, n);
        }

        updateCounts();
        checkCrossings();
    }

    // single set of document-level listeners (attached once, see bottom of
    // this section) drives dragging for every node - avoids leaking a new
    // pair of document listeners per node on every level like the old code did
    function svgPoint(e) {
        const p = svg.createSVGPoint();
        p.x = e.clientX;
        p.y = e.clientY;
        const ctm = svg.getScreenCTM().inverse();
        const loc = p.matrixTransform(ctm);
        return { x: loc.x, y: loc.y };
    }

    function attachNodeHandlers(el, node) {
        el.addEventListener('pointerdown', (e) => startDrag(e, node));
        el.addEventListener('keydown', (e) => onKeyNudge(e, node));
    }

    function startDrag(e, node) {
        e.preventDefault();
        const p = svgPoint(e);
        activeDrag = {
            node,
            offsetX: node.x - p.x,
            offsetY: node.y - p.y,
            startX: node.x,
            startY: node.y,
            startCrossCount: computeCrossingIndices().size,
        };
        node.circle.classList.add('dragging');
        node.circle.setAttribute('r', node.radius + 3);
        safeCapture(node.group, e.pointerId);
        Sound.pickup();
    }

    function safeCapture(el, pointerId) {
        try { el.setPointerCapture(pointerId); } catch (err) { /* not supported, ignore */ }
    }

    function onDragMove(e) {
        if (!activeDrag) return;
        const p = svgPoint(e);
        const node = activeDrag.node;
        const padding = 30;
        node.x = clamp(p.x + activeDrag.offsetX, padding, state.w - padding);
        node.y = clamp(p.y + activeDrag.offsetY, padding, state.h - padding);
        node.group.setAttribute('transform', `translate(${node.x}, ${node.y})`);
        updateAllEdges();
        checkCrossings();
    }

    function endDrag() {
        if (!activeDrag) return;
        const { node, startX, startY, startCrossCount } = activeDrag;
        node.circle.classList.remove('dragging');
        node.circle.setAttribute('r', node.radius);

        const dist = Math.hypot(node.x - startX, node.y - startY);
        if (dist > 4) {
            pushUndo([{ id: node.id, x: startX, y: startY }]);
            incrementMoves();
            startTimerIfNeeded();
            const newCount = checkCrossings();
            Sound.drop();
            if (newCount < startCrossCount) Sound.crossingCleared();
        } else {
            checkCrossings();
        }
        activeDrag = null;
    }

    document.addEventListener('pointermove', onDragMove);
    document.addEventListener('pointerup', endDrag);
    document.addEventListener('pointercancel', endDrag);

    // keyboard nudge - lets keyboard/switch-device users play without a mouse
    function onKeyNudge(e, node) {
        const step = e.shiftKey ? 24 : 8;
        let dx = 0, dy = 0;
        switch (e.key) {
            case 'ArrowLeft': dx = -step; break;
            case 'ArrowRight': dx = step; break;
            case 'ArrowUp': dy = -step; break;
            case 'ArrowDown': dy = step; break;
            default: return;
        }
        e.preventDefault();
        const startX = node.x, startY = node.y;
        const startCrossCount = computeCrossingIndices().size;
        const padding = 30;
        node.x = clamp(node.x + dx, padding, state.w - padding);
        node.y = clamp(node.y + dy, padding, state.h - padding);
        node.group.setAttribute('transform', `translate(${node.x}, ${node.y})`);
        updateAllEdges();
        const newCount = checkCrossings();
        pushUndo([{ id: node.id, x: startX, y: startY }]);
        incrementMoves();
        startTimerIfNeeded();
        if (newCount < startCrossCount) Sound.crossingCleared();
    }

    function updateAllEdges() {
        for (const e of state.edges) {
            const A = state.nodes[e.a];
            const B = state.nodes[e.b];
            e.el.setAttribute('x1', A.x);
            e.el.setAttribute('y1', A.y);
            e.el.setAttribute('x2', B.x);
            e.el.setAttribute('y2', B.y);
        }
    }

    // --- crossing detection & win condition ---
    function computeCrossingIndices() {
        const crossings = new Set();
        for (let i = 0; i < state.edges.length; i++) {
            for (let j = i + 1; j < state.edges.length; j++) {
                const e1 = state.edges[i];
                const e2 = state.edges[j];
                if (e1.a === e2.a || e1.a === e2.b || e1.b === e2.a || e1.b === e2.b) continue;
                const p1 = state.nodes[e1.a];
                const p2 = state.nodes[e1.b];
                const p3 = state.nodes[e2.a];
                const p4 = state.nodes[e2.b];
                if (segmentsIntersect(p1, p2, p3, p4)) {
                    crossings.add(i);
                    crossings.add(j);
                }
            }
        }
        return crossings;
    }

    function checkCrossings() {
        const crossings = computeCrossingIndices();

        for (let i = 0; i < state.edges.length; i++) {
            const e = state.edges[i];
            if (crossings.has(i)) {
                e.el.classList.add('crossing');
            } else {
                e.el.classList.remove('crossing');
            }
        }

        const crossCount = crossings.size;
        crossCountEl.textContent = crossCount.toString();

        if (crossCount === 0) {
            statusEl.textContent = 'Puzzle solved!';
            statusEl.classList.add('win-message');
            onWin();
        } else {
            statusEl.textContent = crossCount === 1
                ? '1 crossing left'
                : `${crossCount} crossings left`;
            statusEl.classList.remove('win-message');
            hideWin();
        }
        return crossCount;
    }

    function updateCounts() {
        levelLabel.textContent = state.level;
    }

    // --- moves / timer ---
    function incrementMoves() {
        moves++;
        movesEl.textContent = moves.toString();
    }

    function resetMoves() {
        moves = 0;
        movesEl.textContent = '0';
    }

    function startTimerIfNeeded() {
        if (timerInterval) return;
        timerInterval = setInterval(() => {
            elapsedSeconds++;
            timeEl.textContent = formatTime(elapsedSeconds);
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    function resetTimer() {
        stopTimer();
        elapsedSeconds = 0;
        timeEl.textContent = '00:00';
    }

    // --- undo ---
    function pushUndo(moveList) {
        undoStack.push(moveList);
        if (undoStack.length > 30) undoStack.shift();
        refreshUndoButton();
    }

    function refreshUndoButton() {
        undoBtn.disabled = undoStack.length === 0;
    }

    undoBtn.addEventListener('click', () => {
        const entries = undoStack.pop();
        if (!entries) return;
        for (const entry of entries) {
            const node = state.nodes[entry.id];
            node.x = entry.x;
            node.y = entry.y;
            node.group.setAttribute('transform', `translate(${node.x}, ${node.y})`);
        }
        updateAllEdges();
        checkCrossings();
        refreshUndoButton();
        Sound.undo();
    });

    // --- hint ---
    function findFirstCrossingPair() {
        for (let i = 0; i < state.edges.length; i++) {
            for (let j = i + 1; j < state.edges.length; j++) {
                const e1 = state.edges[i];
                const e2 = state.edges[j];
                if (e1.a === e2.a || e1.a === e2.b || e1.b === e2.a || e1.b === e2.b) continue;
                const p1 = state.nodes[e1.a];
                const p2 = state.nodes[e1.b];
                const p3 = state.nodes[e2.a];
                const p4 = state.nodes[e2.b];
                if (segmentsIntersect(p1, p2, p3, p4)) return [e1, e2];
            }
        }
        return null;
    }

    hintBtn.addEventListener('click', () => {
        Sound.click();
        const pair = findFirstCrossingPair();
        if (!pair) {
            statusEl.textContent = 'No crossings left to hint!';
            return;
        }
        Sound.hint();
        pair.forEach(e => {
            e.el.classList.add('hint-flash');
            setTimeout(() => e.el.classList.remove('hint-flash'), 1200);
        });
    });

    // --- mute ---
    function refreshMuteButton() {
        muteBtn.innerHTML = Sound.isMuted()
            ? '<i class="fas fa-volume-mute"></i>'
            : '<i class="fas fa-volume-up"></i>';
        muteBtn.setAttribute('aria-label', Sound.isMuted() ? 'Unmute sound' : 'Mute sound');
    }

    muteBtn.addEventListener('click', () => {
        Sound.toggleMute();
        refreshMuteButton();
        Sound.click();
    });

    // win overlay + confetti celebration
    function onWin() {
        if (winOverlay.classList.contains('show')) return;
        stopTimer();
        winDetail.textContent = `Solved in ${moves} move${moves === 1 ? '' : 's'}, ${formatTime(elapsedSeconds)}`;
        winOverlay.classList.add('show');
        Sound.win();
        if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
        burstConfetti();
    }

    function hideWin() {
        winOverlay.classList.remove('show');
    }

    function burstConfetti() {
        const colors = ['#7ee7c7', '#6ea8fe', '#ffd166', '#ef4444', '#4ade80', '#c1a7ff'];
        for (let i = 0; i < 28; i++) {
            const c = document.createElement('div');
            c.style.position = 'fixed';
            c.style.left = (Math.random() * 60 + 20) + '%';
            c.style.top = (Math.random() * 60 + 20) + '%';
            c.style.width = '8px';
            c.style.height = '8px';
            c.style.borderRadius = '50%';
            c.style.pointerEvents = 'none';
            c.style.background = colors[Math.floor(Math.random() * colors.length)];
            c.style.opacity = '0.95';
            c.style.transform = 'translateY(0) scale(1)';
            c.style.transition = 'transform 900ms cubic-bezier(.2,.8,.2,1), opacity 900ms ease';
            c.style.zIndex = '9999';
            document.body.appendChild(c);
            requestAnimationFrame(() => {
                c.style.transform = `translateY(${Math.random() * 220 - 120}px) translateX(${Math.random() * 220 - 110}px) scale(${Math.random() * 1.8 + 0.2})`;
                c.style.opacity = '0';
            });
            setTimeout(() => c.remove(), 1100);
        }
    }

    // --- progress persistence (remembers which level you were on) ---
    function saveProgress() {
        try { localStorage.setItem(STORAGE_KEY + ':level', String(state.level)); } catch (err) { /* ignore */ }
    }

    function loadProgress() {
        try {
            const v = localStorage.getItem(STORAGE_KEY + ':level');
            const n = v ? parseInt(v, 10) : 1;
            return Number.isFinite(n) && n > 0 ? n : 1;
        } catch (err) {
            return 1;
        }
    }

    // --- button handlers ---
    resetBtn.addEventListener('click', () => {
        Sound.click();
        hideWin();
        undoStack = [];
        refreshUndoButton();
        resetMoves();
        resetTimer();
        buildScene(generateLevel(state.level));
    });

    shuffleBtn.addEventListener('click', () => {
        Sound.click();
        // randomly swap node positions (keep the same graph structure)
        const before = state.nodes.map(n => ({ id: n.id, x: n.x, y: n.y }));
        const positions = state.nodes.map(n => ({ x: n.x, y: n.y }));
        const shuffled = shuffleArray(positions);
        state.nodes.forEach((n, i) => {
            n.x = shuffled[i].x;
            n.y = shuffled[i].y;
            n.group.setAttribute('transform', `translate(${n.x}, ${n.y})`);
        });
        updateAllEdges();
        pushUndo(before);
        checkCrossings();
    });

    nextBtn.addEventListener('click', () => {
        Sound.click();
        state.level++;
        startLevel(state.level);
    });

    winNext.addEventListener('click', () => {
        Sound.click();
        state.level++;
        startLevel(state.level);
    });

    winShuffle.addEventListener('click', () => {
        // Let checkCrossings() decide whether to keep showing the overlay.
        shuffleBtn.click();
    });

    function startLevel(level) {
        state.level = level;
        updateCounts();
        hideWin();
        undoStack = [];
        refreshUndoButton();
        resetMoves();
        resetTimer();
        buildScene(generateLevel(level));
        saveProgress();
    }

    // small mobile tweak: adjust viewBox height on portrait
    function adjustForMobile() {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile && window.innerHeight > window.innerWidth) {
            state.h = 900;
            state.w = Math.min(1000, (window.innerWidth / window.innerHeight) * 900);
        }
    }

    function init() {
        adjustForMobile();
        svg.setAttribute('viewBox', `0 0 ${state.w} ${state.h}`);
        refreshMuteButton();
        refreshUndoButton();
        state.level = loadProgress();
        startLevel(state.level);
    }

    init();
})();
