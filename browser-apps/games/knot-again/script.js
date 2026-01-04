/*
Copyright (c) 2025-2026. Jericho Crosby (Chalwk)

Knot Again - JavaScript
*/

(() => {
    const svg = document.getElementById('svg');
    const resetBtn = document.getElementById('resetBtn');
    const shuffleBtn = document.getElementById('shuffleBtn');
    const nextBtn = document.getElementById('nextBtn');
    const winOverlay = document.getElementById('winOverlay');
    const winNext = document.getElementById('winNext');
    const winShuffle = document.getElementById('winShuffle');
    const levelLabel = document.getElementById('levelLabel');
    const edgeCountEl = document.getElementById('edgeCount');
    const crossCountEl = document.getElementById('crossCount');

    let state = {
        level: 1,
        nodes: [],
        edges: [],
        w: 1000,
        h: 700
    };

    function randRange(min, max) {
        return Math.random() * (max - min) + min;
    }

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

    function makeSvg(tag, attrs) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const k in attrs) el.setAttribute(k, attrs[k]);
        return el;
    }

    function clearSvg() {
        while (svg.firstChild) svg.removeChild(svg.firstChild);
    }

    function generateLevel(level) {
        const nodeCount = Math.min(8 + level, 16);
        const maxEdges = Math.floor(nodeCount * 1.6);

        const cx = state.w / 2,
        cy = state.h / 2,
        r = Math.min(state.w, state.h) / 2 - 90;
        const basePositions = [];

        for (let i = 0; i < nodeCount; i++) {
            const a = (i / nodeCount) * Math.PI * 2;
            basePositions.push({
                x: cx + Math.cos(a) * r,
                y: cy + Math.sin(a) * r
            });
        }

        const edges = [];

        function crossesExisting(i, j) {
            const p1 = basePositions[i],
            p2 = basePositions[j];
            for (const e of edges) {
                const q1 = basePositions[e.a],
                q2 = basePositions[e.b];
                if (e.a === i || e.b === i || e.a === j || e.b === j) continue;
                if (segmentsIntersect(p1, p2, q1, q2)) return true;
            }
            return false;
        }

        const tempEdges = [];
        for (let i = 0; i < nodeCount; i++) tempEdges.push({
            a: i,
            b: (i + 1) % nodeCount
        });

        for (let attempts = 0; attempts < nodeCount * 6 && tempEdges.length < maxEdges; attempts++) {
            const a = Math.floor(Math.random() * nodeCount);
            const b = Math.floor(Math.random() * nodeCount);
            if (a === b) continue;
            if (tempEdges.some(e => (e.a === a && e.b === b) || (e.a === b && e.b === a))) continue;
            if (crossesExisting(a, b)) continue;
            tempEdges.push({
                a,
                b
            });
        }

        const permuted = shuffleArray(basePositions.map((p, i) => ({
            ...p,
            id: i
        }))).map((p, idx) => ({
            x: p.x,
            y: p.y,
            id: idx,
            baseIndex: p.id
        }));

        const nodes = permuted.map((p, i) => ({
            id: i,
            x: p.x,
            y: p.y,
            baseX: basePositions[p.baseIndex].x,
            baseY: basePositions[p.baseIndex].y,
            radius: 12
        }));

        const finalEdges = tempEdges.map(e => ({
            a: e.a,
            b: e.b
        }));

        return {
            nodes,
            edges: finalEdges
        };
    }

    function shuffleArray(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function buildScene(spec) {
        clearSvg();
        state.nodes = spec.nodes.map(n => ({ ...n }));
        state.edges = spec.edges.map(e => ({ a: e.a, b: e.b }));

        for (const e of state.edges) {
            const A = state.nodes[e.a];
            const B = state.nodes[e.b];
            const line = makeSvg('line', {
                x1: A.x,
                y1: A.y,
                x2: B.x,
                y2: B.y,
                class: 'edge',
                'stroke-width': 3
            });
            svg.appendChild(line);
            e.el = line;
        }

        for (const n of state.nodes) {
            const g = makeSvg('g', {
                class: 'node',
                cursor: 'grab'
            });
            const circle = makeSvg('circle', {
                cx: n.x,
                cy: n.y,
                r: n.radius,
                class: 'node-circle',
                fill: 'white',
                opacity: 0.95
            });
            const inner = makeSvg('circle', {
                cx: n.x,
                cy: n.y,
                r: 6,
                fill: 'url(#grad)'
            });
            const label = makeSvg('text', {
                x: n.x,
                y: n.y + 4,
                'text-anchor': 'middle',
                class: 'node-label',
                'font-size': '10px'
            });
            label.textContent = n.id + 1;

            g.appendChild(circle);
            g.appendChild(inner);
            g.appendChild(label);
            svg.appendChild(g);

            n.group = g;
            n.circle = circle;
            n.labelEl = label;
            attachPointerHandlers(g, n);
        }

        addDefs();
        updateCounts();
        checkCrossings();
    }

    function addDefs() {
        if (svg.querySelector('defs')) return;
        const defs = makeSvg('defs', {});
        const grad = makeSvg('radialGradient', {
            id: 'grad'
        });
        grad.appendChild(makeSvg('stop', {
            offset: '0%',
            'stop-color': '#ffffff',
            'stop-opacity': '1'
        }));
        grad.appendChild(makeSvg('stop', {
            offset: '100%',
            'stop-color': '#6ea8fe',
            'stop-opacity': '1'
        }));
        defs.appendChild(grad);
        svg.appendChild(defs);
    }

    function attachPointerHandlers(el, node) {
        let dragging = false;
        let offset = {
            x: 0,
            y: 0
        };

        function pt(e) {
            const p = svg.createSVGPoint();
            p.x = e.clientX;
            p.y = e.clientY;
            const ctm = svg.getScreenCTM().inverse();
            const loc = p.matrixTransform(ctm);
            return {
                x: loc.x,
                y: loc.y
            };
        }

        function onDown(e) {
            if (e.type === 'touchstart') e.preventDefault();
            dragging = true;
            const p = pt(e.type === 'touchstart' ? e.touches[0] : e);
            offset.x = node.x - p.x;
            offset.y = node.y - p.y;
            node.circle.setAttribute('r', node.radius + 2);
            node.circle.style.fill = '#f0f8ff';
        }

        function onMove(e) {
            if (!dragging) return;
            const p = pt(e.type === 'touchmove' ? e.touches[0] : e);
            const padding = 40;
            node.x = Math.max(padding, Math.min(state.w - padding, p.x + offset.x));
            node.y = Math.max(padding, Math.min(state.h - padding, p.y + offset.y));

            node.group.setAttribute('transform', `translate(${node.x - parseFloat(node.circle.getAttribute('cx'))}, ${node.y - parseFloat(node.circle.getAttribute('cy'))})`);
            node.circle.setAttribute('cx', node.x);
            node.circle.setAttribute('cy', node.y);
            node.labelEl.setAttribute('x', node.x);
            node.labelEl.setAttribute('y', node.y + 4);

            for (const e of state.edges) {
                if (e.a === node.id || e.b === node.id) {
                    const A = state.nodes[e.a];
                    const B = state.nodes[e.b];
                    e.el.setAttribute('x1', A.x);
                    e.el.setAttribute('y1', A.y);
                    e.el.setAttribute('x2', B.x);
                    e.el.setAttribute('y2', B.y);
                }
            }
            checkCrossings();
        }

        function onUp() {
            if (!dragging) return;
            dragging = false;
            node.circle.setAttribute('r', node.radius);
            node.circle.style.fill = 'white';
            checkCrossings();
        }

        el.addEventListener('mousedown', onDown);
        el.addEventListener('touchstart', onDown, {
            passive: false
        });

        document.addEventListener('mousemove', onMove);
        document.addEventListener('touchmove', onMove, {
            passive: false
        });

        document.addEventListener('mouseup', onUp);
        document.addEventListener('touchend', onUp);
    }

    function checkCrossings() {
        const crossings = new Set();
        for (let i = 0; i < state.edges.length; i++) {
            for (let j = i + 1; j < state.edges.length; j++) {
                const e1 = state.edges[i],
                e2 = state.edges[j];
                if (e1.a === e2.a || e1.a === e2.b || e1.b === e2.a || e1.b === e2.b) continue;
                const p1 = state.nodes[e1.a],
                p2 = state.nodes[e1.b];
                const p3 = state.nodes[e2.a],
                p4 = state.nodes[e2.b];
                if (segmentsIntersect(p1, p2, p3, p4)) {
                    crossings.add(i);
                    crossings.add(j);
                }
            }
        }

        let crossCount = 0;
        for (let i = 0; i < state.edges.length; i++) {
            const e = state.edges[i];
            if (crossings.has(i)) {
                e.el.classList.add('crossing');
                e.el.setAttribute('stroke-width', 4);
                crossCount++;
            } else {
                e.el.classList.remove('crossing');
                e.el.setAttribute('stroke-width', 3);
            }
        }
        crossCountEl.textContent = crossCount;
        edgeCountEl.textContent = state.edges.length;

        if (crossCount === 0) {
            onWin();
        } else {
            hideWin();
        }
    }

    function updateCounts() {
        levelLabel.textContent = state.level;
    }

    function onWin() {
        winOverlay.classList.remove('hidden');
        burstConfetti();
    }

    function hideWin() {
        winOverlay.classList.add('hidden');
    }

    function burstConfetti() {
        const colors = ['#7ee7c7', '#6ea8fe', '#ffd97a', '#ff9aa2', '#c1a7ff'];
        for (let i = 0; i < 28; i++) {
            const c = document.createElement('div');
            c.style.position = 'absolute';
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

    resetBtn.addEventListener('click', () => {
        buildScene(generateLevel(state.level));
    });

    shuffleBtn.addEventListener('click', () => {
        const positions = state.nodes.map(n => ({
            x: n.x,
            y: n.y
        }));
        const shuffled = shuffleArray(positions);
        state.nodes.forEach((n, i) => {
            n.x = shuffled[i].x;
            n.y = shuffled[i].y;
            n.group.setAttribute('transform', `translate(${n.x - parseFloat(n.circle.getAttribute('cx'))}, ${n.y - parseFloat(n.circle.getAttribute('cy'))})`);
            n.circle.setAttribute('cx', n.x);
            n.circle.setAttribute('cy', n.y);
            n.labelEl.setAttribute('x', n.x);
            n.labelEl.setAttribute('y', n.y + 4);
        });

        for (const e of state.edges) {
            const A = state.nodes[e.a],
            B = state.nodes[e.b];
            e.el.setAttribute('x1', A.x);
            e.el.setAttribute('y1', A.y);
            e.el.setAttribute('x2', B.x);
            e.el.setAttribute('y2', B.y);
        }
        checkCrossings();
    });

    nextBtn.addEventListener('click', () => {
        state.level++;
        startLevel(state.level);
    });

    winNext.addEventListener('click', () => {
        state.level++;
        startLevel(state.level);
    });

    winShuffle.addEventListener('click', () => {
        shuffleBtn.click();
        hideWin();
    });

    function startLevel(level) {
        state.level = level;
        updateCounts();
        const spec = generateLevel(level);
        buildScene(spec);
    }

    function adjustForMobile() {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile && window.innerHeight > window.innerWidth) {
            state.h = 900;
            state.w = Math.min(1000, window.innerWidth / window.innerHeight * 900);
        }
    }

    function init() {
        adjustForMobile();
        svg.setAttribute('viewBox', `0 0 ${state.w} ${state.h}`);
        startLevel(state.level);
    }

    init();
})();