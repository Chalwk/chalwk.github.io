// Rope Untangle - script.js
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
        nodes: [], // {id, x, y, baseX, baseY, cxEl, labelEl}
        edges: [], // {a,b,lineEl}
        w: 1000, h:700
    };

    // Helpers
    function randRange(min,max){return Math.random()*(max-min)+min}
    function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}

    // Segment intersection excluding shared endpoints
    function segmentsIntersect(p1,p2,p3,p4){
        function orient(a,b,c){return (b.x-a.x)*(c.y-a.y) - (b.y-a.y)*(c.x-a.x)}
        const o1 = orient(p1,p2,p3);
        const o2 = orient(p1,p2,p4);
        const o3 = orient(p3,p4,p1);
        const o4 = orient(p3,p4,p2);
        if (o1===0 && onSegment(p1,p2,p3)) return true;
        if (o2===0 && onSegment(p1,p2,p4)) return true;
        if (o3===0 && onSegment(p3,p4,p1)) return true;
        if (o4===0 && onSegment(p3,p4,p2)) return true;
        return (o1*o2<0) && (o3*o4<0);

        function onSegment(a,b,c){
            return Math.min(a.x,b.x)<=c.x+1e-6 && c.x<=Math.max(a.x,b.x)+1e-6 && Math.min(a.y,b.y)<=c.y+1e-6 && c.y<=Math.max(a.y,b.y)+1e-6;
        }
    }

    // Build SVG elements
    function makeSvg(tag, attrs){
        const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for(const k in attrs) el.setAttribute(k, attrs[k]);
        return el;
    }

    function clearSvg(){ while(svg.firstChild) svg.removeChild(svg.firstChild); }

    // Procedural level generator
    function generateLevel(level){
        const nodeCount = Math.min(8 + level, 16);
        const maxEdges = Math.floor(nodeCount * 1.6);

        // Base positions on a circle (solved configuration)
        const cx = state.w/2, cy = state.h/2, r = Math.min(state.w,state.h)/2 - 90;
        const basePositions = [];
        for(let i=0;i<nodeCount;i++){
            const a = (i/nodeCount) * Math.PI*2;
            basePositions.push({x: cx + Math.cos(a)*r, y: cy + Math.sin(a)*r});
        }

        // Create planar graph by attempting to add random edges that don't cross (on base positions)
        const edges = [];
        function crossesExisting(i,j){
            const p1 = basePositions[i], p2 = basePositions[j];
            for(const e of edges){
                const q1 = basePositions[e.a], q2 = basePositions[e.b];
                // don't consider touching at endpoints
                if(e.a===i||e.b===i||e.a===j||e.b===j) continue;
                if(segmentsIntersect(p1,p2,q1,q2)) return true;
            }
            return false;
        }

        // Start by connecting nodes to form a cycle for connectivity
        const tempEdges = [];
        for(let i=0;i<nodeCount;i++) tempEdges.push({a:i,b:(i+1)%nodeCount});

        // Add random extra edges without crossing
        for(let attempts=0; attempts<nodeCount*6 && tempEdges.length < maxEdges; attempts++){
            const a = Math.floor(Math.random()*nodeCount);
            const b = Math.floor(Math.random()*nodeCount);
            if(a===b) continue;
            // avoid duplicate
            if(tempEdges.some(e=> (e.a===a&&e.b===b)||(e.a===b&&e.b===a))) continue;
            if(crossesExisting(a,b)) continue;
            tempEdges.push({a,b});
        }

        // Now create nodes assigned base positions, but shuffle positions to create messy starting layout
        const permuted = shuffleArray(basePositions.map((p,i)=>({...p,id:i}))).map((p,idx)=>({x:p.x,y:p.y,id:idx,baseIndex:p.id}));

        // We'll set nodes so that node object references original base coords in basePositions[baseIndex]
        const nodes = permuted.map((p, i)=>({
            id:i,
            x:p.x, y:p.y,
            baseX: basePositions[p.baseIndex].x,
            baseY: basePositions[p.baseIndex].y,
            radius: 12
        }));

        // Edges referencing node ids
        const finalEdges = tempEdges.map(e=>({a: e.a, b: e.b}));

        return {nodes, edges: finalEdges};
    }

    // Utility: Fisher-Yates shuffle
    function shuffleArray(arr){
        const a = arr.slice();
        for(let i=a.length-1;i>0;i--){
            const j = Math.floor(Math.random()*(i+1));
            [a[i],a[j]]=[a[j],a[i]];
        }
        return a;
    }

    function buildScene(spec){
        clearSvg();
        state.nodes = spec.nodes.map(n=>({...n}));
        state.edges = spec.edges.map(e=>({a:e.a,b:e.b}));

        // Draw edges first
        for(const e of state.edges){
            const A = state.nodes[e.a];
            const B = state.nodes[e.b];
            const line = makeSvg('line',{x1:A.x,y1:A.y,x2:B.x,y2:B.y,class:'edge'});
            svg.appendChild(line);
            e.el = line;
        }

        // Draw nodes on top
        for(const n of state.nodes){
            const g = makeSvg('g',{class:'node',cursor:'grab'});
            const circle = makeSvg('circle',{cx:n.x,cy:n.y,r:n.radius,class:'node-circle',fill:'white',opacity:0.95});
            const inner = makeSvg('circle',{cx:n.x,cy:n.y,r:6,fill:'url(#grad)'});
            const label = makeSvg('text',{x:n.x,y:n.y+4,'text-anchor':'middle',class:'node-label'});
            label.textContent = n.id+1;

            g.appendChild(circle);
            g.appendChild(inner);
            g.appendChild(label);
            svg.appendChild(g);

            n.group = g; n.circle = circle; n.labelEl = label;
            attachPointerHandlers(g,n);
        }

        // Add defs for gradient
        addDefs();

        updateCounts();
        checkCrossings();
    }

    function addDefs(){
        // if defs already exists, skip
        if(svg.querySelector('defs')) return;
        const defs = makeSvg('defs',{});
        const grad = makeSvg('radialGradient',{id:'grad'});
        grad.appendChild(makeSvg('stop',{offset:'0%', 'stop-color':'#ffffff', 'stop-opacity':'1'}));
        grad.appendChild(makeSvg('stop',{offset:'100%', 'stop-color':'#6ea8fe', 'stop-opacity':'1'}));
        defs.appendChild(grad);
        svg.appendChild(defs);
    }

    function attachPointerHandlers(el, node) {
        let dragging = false;
        let offset = { x: 0, y: 0 };
        let pointerId = null;

        function pt(e) {
            const p = svg.createSVGPoint();
            p.x = e.clientX !== undefined ? e.clientX : e.touches[0].clientX;
            p.y = e.clientY !== undefined ? e.clientY : e.touches[0].clientY;
            const ctm = svg.getScreenCTM().inverse();
            const loc = p.matrixTransform(ctm);
            return { x: loc.x, y: loc.y };
        }

        function onDown(e) {
            // Prevent default to stop scrolling on mobile
            e.preventDefault();
            dragging = true;
            pointerId = e.pointerId !== undefined ? e.pointerId : null;

            // For touch events on mobile
            if (e.type === 'touchstart') {
                // Convert touch event to pointer-like event
                const touch = e.touches[0];
                const fakeEvent = {
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    pointerId: touch.identifier
                };
                const p = pt(fakeEvent);
                offset.x = node.x - p.x;
                offset.y = node.y - p.y;
            } else {
                // For mouse/pointer events
                if (pointerId !== null) {
                    el.setPointerCapture(pointerId);
                }
                const p = pt(e);
                offset.x = node.x - p.x;
                offset.y = node.y - p.y;
            }

            node.circle.setAttribute('r', node.radius + 2);
        }

        function onMove(e) {
            if (!dragging) return;

            // Prevent default to stop scrolling
            e.preventDefault();

            let p;
            if (e.type === 'touchmove') {
                // Handle touch move
                const touch = e.touches[0];
                const fakeEvent = {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                };
                p = pt(fakeEvent);
            } else {
                p = pt(e);
            }

            node.x = Math.max(40, Math.min(state.w - 40, p.x + offset.x));
            node.y = Math.max(40, Math.min(state.h - 40, p.y + offset.y));

            // Update visual elements
            node.group.setAttribute('transform', `translate(${node.x - parseFloat(node.circle.getAttribute('cx'))}, ${node.y - parseFloat(node.circle.getAttribute('cy'))})`);
            node.circle.setAttribute('cx', node.x);
            node.circle.setAttribute('cy', node.y);
            node.labelEl.setAttribute('x', node.x);
            node.labelEl.setAttribute('y', node.y + 4);

            // Update connected edges
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

        function onUp(e) {
            if (!dragging) return;
            dragging = false;

            if (pointerId !== null && e.type !== 'touchend') {
                try {
                    el.releasePointerCapture(pointerId);
                } catch (_) {}
            }
            pointerId = null;
            node.circle.setAttribute('r', node.radius);
            checkCrossings();
        }

        el.addEventListener('pointerdown', onDown);
        el.addEventListener('touchstart', onDown, { passive: false });

        document.addEventListener('pointermove', onMove);
        document.addEventListener('touchmove', onMove, { passive: false });

        document.addEventListener('pointerup', onUp);
        document.addEventListener('touchend', onUp);
        document.addEventListener('pointercancel', onUp);
    }

    // Compute crossing count and style edges
    function checkCrossings(){
        const crossings = new Set();
        for(let i=0;i<state.edges.length;i++){
            for(let j=i+1;j<state.edges.length;j++){
                const e1 = state.edges[i], e2 = state.edges[j];
                // ignore shared endpoints
                if(e1.a===e2.a || e1.a===e2.b || e1.b===e2.a || e1.b===e2.b) continue;
                const p1 = state.nodes[e1.a], p2 = state.nodes[e1.b];
                const p3 = state.nodes[e2.a], p4 = state.nodes[e2.b];
                if(segmentsIntersect(p1,p2,p3,p4)){
                    crossings.add(i); crossings.add(j);
                }
            }
        }
        // style
        let crossCount = 0;
        for(let i=0;i<state.edges.length;i++){
            const e = state.edges[i];
            if(crossings.has(i)){
                e.el.classList.add('crossing'); crossCount++;
            } else {
                e.el.classList.remove('crossing');
            }
        }
        crossCountEl.textContent = crossCount;
        edgeCountEl.textContent = state.edges.length;

        if(crossCount===0){
            onWin();
        } else {
            hideWin();
        }
    }

    function updateCounts(){
        levelLabel.textContent = state.level;
    }

    function onWin(){
        winOverlay.classList.remove('hidden');
        burstConfetti();
    }

    function hideWin(){
        winOverlay.classList.add('hidden');
    }

    // Simple confetti: create colorful circles that fade
    function burstConfetti(){
        const colors = ['#7ee7c7','#6ea8fe','#ffd97a','#ff9aa2','#c1a7ff'];
        for(let i=0;i<28;i++){
            const c = document.createElement('div');
            c.style.position='absolute'; c.style.left=(Math.random()*60+20)+'%';
            c.style.top=(Math.random()*60+20)+'%'; c.style.width='8px'; c.style.height='8px';
            c.style.borderRadius='50%'; c.style.pointerEvents='none';
            c.style.background=colors[Math.floor(Math.random()*colors.length)];
            c.style.opacity='0.95';
            c.style.transform='translateY(0) scale(1)';
            c.style.transition='transform 900ms cubic-bezier(.2,.8,.2,1), opacity 900ms ease';
            document.body.appendChild(c);
            requestAnimationFrame(()=>{
                c.style.transform = `translateY(${Math.random()*220-120}px) translateX(${Math.random()*220-110}px) scale(${Math.random()*1.8+0.2})`;
                c.style.opacity='0';
            });
            setTimeout(()=>c.remove(),1100);
        }
    }

    // Controls
    resetBtn.addEventListener('click', ()=>{
        buildScene(generateLevel(state.level));
    });
    shuffleBtn.addEventListener('click', ()=>{
        // shuffle current positions among nodes
        const positions = state.nodes.map(n=>({x:n.x,y:n.y}));
        const shuffled = shuffleArray(positions);
        state.nodes.forEach((n,i)=>{ n.x=shuffled[i].x; n.y=shuffled[i].y; n.group.setAttribute('transform', `translate(${n.x-parseFloat(n.circle.getAttribute('cx'))}, ${n.y-parseFloat(n.circle.getAttribute('cy'))})`); n.circle.setAttribute('cx', n.x); n.circle.setAttribute('cy', n.y); n.labelEl.setAttribute('x', n.x); n.labelEl.setAttribute('y', n.y+4); });
        // update edges
        for(const e of state.edges){ const A=state.nodes[e.a], B=state.nodes[e.b]; e.el.setAttribute('x1',A.x); e.el.setAttribute('y1',A.y); e.el.setAttribute('x2',B.x); e.el.setAttribute('y2',B.y); }
        checkCrossings();
    });

    nextBtn.addEventListener('click', ()=>{ state.level++; startLevel(state.level); });
    winNext.addEventListener('click', ()=>{ state.level++; startLevel(state.level); });
    winShuffle.addEventListener('click', ()=>{ shuffleBtn.click(); hideWin(); });

    // Start given level
    function startLevel(level){
        state.level = level; updateCounts();
        const spec = generateLevel(level);
        buildScene(spec);
    }

    // initialize
    function init(){
        svg.setAttribute('viewBox', `0 0 ${state.w} ${state.h}`);
        startLevel(state.level);

        // small resize behaviour
        window.addEventListener('resize', ()=>{
            // nothing complex - viewBox handles scaling
        });
    }

    init();
})();