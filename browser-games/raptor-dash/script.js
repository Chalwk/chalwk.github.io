// Raptor Dash - procedural endless runner
// Controls: Space / Up Arrow / Click to jump

(() => {
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    let DPR = Math.max(1, window.devicePixelRatio || 1);

    // sizing
    function resize(){
        const rect = canvas.getBoundingClientRect();
        canvas.width = Math.floor(rect.width * DPR);
        canvas.height = Math.floor(rect.height * DPR);
        ctx.setTransform(DPR,0,0,DPR,0,0);
    }
    window.addEventListener('resize', resize);

    // game state
    let running = false;
    let paused = false;
    let last = performance.now();
    let speed = 240; // pixels per second
    let distance = 0;
    let level = 1;
    const gravity = 2200;

    // scoreboard elements
    const scoreEl = document.getElementById('score');
    const levelEl = document.getElementById('level');
    const btnStart = document.getElementById('btn-start');
    const btnPause = document.getElementById('btn-pause');

    // player
    const player = {
        x: 92, // screen x
        y: 0,
        vy: 0,
        w: 46,
        h: 40,
        onGround: false,
        jumping: false,
        boostReady: true,
        color: '#072a14'
    };

    // world
    const groundY = 300; // canvas-local coordinate. We'll scale canvas height to match.
    let obstacles = [];
    let particles = [];
    let clouds = [];

    // PRNG so every run is procedural but reproducible if needed
    function makeRng(seed = Date.now()){
        let t = seed >>> 0;
        return () => {
            t += 0x6D2B79F5;
            let r = Math.imul(t ^ t >>> 15, 1 | t);
            r = (r + Math.imul(r ^ r >>> 7, 61 | r)) ^ r;
            return ((r ^ r >>> 14) >>> 0) / 4294967296;
        }
    }

    // procedural generator: generates segments that push obstacles into the spawn queue
    function generateSegments(seed){
        const rng = makeRng(seed);
        const segs = [];

        // We create a series of segments; each segment has density, minGap, maxGap, theme
        for(let i=0;i<100;i++){
            const difficulty = Math.min(1, i / 40);
            const theme = rng() < 0.22 ? 'aerial' : 'ground';
            const density = 0.6 + difficulty * 1.2 + rng() * 0.6; // more obstacles with progression
            const gapMin = 220 - difficulty * 80 - rng()*60; // smaller gaps with progression
            const gapMax = gapMin + 160 + rng()*280;
            segs.push({theme,density,gapMin:Math.round(gapMin),gapMax:Math.round(gapMax)});
        }
        return segs;
    }

    // spawn obstacles using segments
    let segmentCursor = 0;
    let spawnX = 700; // where new obstacles are spawned (canvas-space)
    let rng = makeRng();
    let segments = generateSegments(Date.now());

    function resetGame(){
        speed = 240;
        distance = 0;
        level = 1;
        obstacles = [];
        particles = [];
        clouds = [];
        segmentCursor = 0;
        spawnX = 700;
        rng = makeRng(Date.now());
        segments = generateSegments(Date.now());
        player.y = groundY - player.h;
        player.vy = 0;
        player.onGround = true;
        running = true;
        paused = false;
        last = performance.now();
    }

    // obstacle types
    function createObstacle(type, x){
        if(type === 'spike'){
            const h = 56 + Math.round(rng()*48);
            const w = 26 + Math.round(rng()*18);
            return {type:'spike',x,y:0,w,h,pass:false};
        }
        if(type === 'barrel'){
            const w = 46 + Math.round(rng()*38);
            const h = 38 + Math.round(rng()*20);
            return {type:'barrel',x,w,h,pass:false};
        }
        if(type === 'drone'){
            const w = 60; const h = 40;
            const ybase = groundY - player.h - 80 - Math.round(rng()*120);
            return {type:'drone',x,w,h,y:ybase,osc:rng()*Math.PI*2,pass:false};
        }
        // fallback spike
        return createObstacle('spike', x);
    }

    // populate spawn queue from segments ahead of time
    function populateObstaclesIfNeeded(){
        // ensure there's enough obstacles to the right
        const needed = 6; // maintain at least this many upcoming obstacles
        if(obstacles.length > 0 && obstacles.filter(o=>o.x > 0).length >= needed) return;

        const seg = segments[segmentCursor % segments.length];
        const density = seg.density;
        const count = 3 + Math.floor(density * 3);
        let x = spawnX + rng()*120;
        for(let i=0;i<count;i++){
            // choose type based on theme and rng
            const roll = rng();
            let type;
            if(seg.theme === 'aerial') type = roll < 0.6 ? 'drone' : (roll < 0.8 ? 'spike':'barrel');
            else type = roll < 0.6 ? 'spike' : (roll < 0.85 ? 'barrel':'drone');

            const gap = seg.gapMin + Math.round(rng() * (seg.gapMax - seg.gapMin));
            const ob = createObstacle(type, x + gap);
            // normalize y for ground-types
            if(ob.type === 'spike' || ob.type === 'barrel'){
                ob.y = groundY - ob.h;
            }
            obstacles.push(ob);
            x += gap;
        }
        // advance spawnX and cursor to diversify
        spawnX = x + 160 + rng()*240;
        segmentCursor++;
    }

    // clouds for parallax
    function makeCloud(){
        clouds.push({x:900 + rng()*600,y:40 + rng()*160,w:120+rng()*220,spd:20 + rng()*40,alpha:0.18 + rng()*0.3});
    }

    // particles (for collisions and aesthetic)
    function spawnParticles(x,y,color){
        for(let i=0;i<18;i++){
            particles.push({x,y,vx:(rng()-0.5)*420,vy:(rng()-1.5)*360,life:0.9 + rng()*0.9,size:2+rng()*3,color});
        }
    }

    // input
    let wantJump = false;
    function onJump(){
        if(!running) return;
        if(player.onGround){
            player.vy = -820;
            player.onGround = false;
            player.jumping = true;
            player.boostReady = true;
            playJumpTone();
        } else if(player.jumping && player.boostReady){
            // little mid-air boost
            player.vy = -520;
            player.boostReady = false;
            playBoostTone();
        }
    }

    document.addEventListener('keydown', e => { if([' ','ArrowUp','w'].includes(e.key)) { e.preventDefault(); onJump(); } });
    canvas.addEventListener('pointerdown', e => onJump());

    // start / pause buttons
    btnStart.addEventListener('click', ()=>{ resetGame(); });
    btnPause.addEventListener('click', ()=>{ paused = !paused; btnPause.textContent = paused ? 'Resume' : 'Pause'; });

    // simple audio feedback
    let audioCtx;
    function ensureAudio(){ if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    function playJumpTone(){ try{ ensureAudio(); const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type = 'sine'; o.frequency.value = 420; g.gain.value = 0.02; o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + 0.06);}catch(e){} }
    function playBoostTone(){ try{ ensureAudio(); const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type = 'triangle'; o.frequency.value = 620; g.gain.value = 0.03; o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + 0.09);}catch(e){} }
    function playCollision(){ try{ ensureAudio(); const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type = 'square'; o.frequency.value = 120; g.gain.value = 0.06; o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + 0.12);}catch(e){} }

    // collision test AABB
    function collide(a,b){
        return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    // update loop
    function update(dt){
        if(!running || paused) return;

        // difficulty over time
        distance += speed * dt;
        level = 1 + Math.floor(distance / 1500);
        speed = 240 + level * 18;

        // spawn obstacles
        populateObstaclesIfNeeded();
        if(clouds.length < 8 && rng() < 0.02) makeCloud();

        // update player physics
        player.vy += gravity * dt;
        player.y += player.vy * dt;
        if(player.y + player.h >= groundY){
            player.y = groundY - player.h;
            player.vy = 0;
            player.onGround = true;
            player.jumping = false;
        }

        // move obstacles left with speed
        for(const o of obstacles){
            o.x -= speed * dt;
            if(o.type === 'drone'){
                // small oscillation
                o.osc += dt * 4 * (0.8 + rng()*0.4);
                o.y += Math.sin(o.osc) * 6 * dt * 60;
            }
            // mark passing for score
            if(!o.pass && o.x + (o.w||30) < player.x){ o.pass = true; distance += 8; }
        }
        // remove off-screen obstacles
        obstacles = obstacles.filter(o => o.x + (o.w||30) > -60);

        // update clouds
        for(const c of clouds){
            c.x -= c.spd * dt * (0.4 + level*0.02);
        }
        clouds = clouds.filter(c => c.x + c.w > -200);

        // particles
        for(let i=particles.length-1;i>=0;i--){
            const p = particles[i];
            p.vy += 1000 * dt;
            p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
            if(p.life <= 0) particles.splice(i,1);
        }

        // collision detection
        for(const o of obstacles){
            const obRect = {x:o.x, y:o.y, w:o.w, h:o.h};
            const plRect = {x:player.x, y:player.y, w:player.w, h:player.h};
            if(collide(obRect,plRect)){
                // crash
                running = false;
                playCollision();
                spawnParticles(player.x + player.w/2, player.y + player.h/2, '#ff6b6b');
                btnStart.textContent = 'Restart';
            }
        }

        // occasionally leave decorative marks
    }

    function drawRoundedRect(ctx,x,y,w,h,r){
        ctx.beginPath();
        ctx.moveTo(x+r,y);
        ctx.arcTo(x+w,y,x+w,y+h,r);
        ctx.arcTo(x+w,y+h,x,y+h,r);
        ctx.arcTo(x,y+h,x,y,r);
        ctx.arcTo(x,y,x+w,y,r);
        ctx.closePath();
        ctx.fill();
    }

    // render
    function render(){
        const cw = canvas.width / DPR;
        const ch = canvas.height / DPR;

        // background sky gradient
        ctx.clearRect(0,0,cw,ch);
        const g = ctx.createLinearGradient(0,0,0,ch);
        g.addColorStop(0,'#bfe9ff');
        g.addColorStop(0.6,'#e9f7ff');
        g.addColorStop(1,'#f8fbff');
        ctx.fillStyle = g;
        ctx.fillRect(0,0,cw,ch);

        // parallax clouds
        for(const c of clouds){
            ctx.globalAlpha = c.alpha;
            drawCloud(ctx, c.x, c.y, c.w);
            ctx.globalAlpha = 1;
        }

        // sun / glow
        const sunX = cw - 120, sunY = 90;
        const rad = ctx.createRadialGradient(sunX,sunY,10,sunX,sunY,180);
        rad.addColorStop(0,'rgba(255,255,180,0.95)');
        rad.addColorStop(1,'rgba(255,255,180,0.0)');
        ctx.fillStyle = rad; ctx.fillRect(sunX-200,sunY-200,400,400);

        // ground
        ctx.fillStyle = '#dceff9';
        ctx.fillRect(0,groundY + 6, cw, ch - groundY);
        // ground detail gradient
        const groundGrad = ctx.createLinearGradient(0,groundY,0,groundY + 120);
        groundGrad.addColorStop(0,'#e6f3ff');
        groundGrad.addColorStop(1,'#bcd6f0');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0,groundY, cw, 120);

        // obstacles
        for(const o of obstacles){
            if(o.type === 'spike') drawSpike(ctx, o.x, o.y, o.w, o.h);
            else if(o.type === 'barrel') drawBarrel(ctx, o.x, o.y, o.w, o.h);
            else if(o.type === 'drone') drawDrone(ctx, o.x, o.y, o.w, o.h);
        }

        // player with glow
        ctx.save();
        ctx.shadowColor = 'rgba(124,231,135,0.26)';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#0b5829';
        drawRoundedRect(ctx, player.x, player.y, player.w, player.h, 8);
        ctx.restore();

        // particle effects
        for(const p of particles){
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
            ctx.globalAlpha = 1;
        }

        // subtle HUD in canvas (score)
        ctx.fillStyle = 'rgba(2,6,23,0.06)';
        ctx.fillRect(12,12,160,40);
        ctx.fillStyle = '#072a14';
        ctx.font = '14px system-ui, -apple-system, Roboto, "Segoe UI"';
        ctx.fillText('Score: ' + Math.floor(distance), 22, 36);

    }

    // decorative draw functions
    function drawCloud(ctx,x,y,w){
        ctx.beginPath();
        ctx.moveTo(x + w*0.1, y + 20);
        ctx.bezierCurveTo(x + w*0.15, y - 10, x + w*0.4, y - 8, x + w*0.48, y + 8);
        ctx.bezierCurveTo(x + w*0.7, y + 8, x + w*0.85, y + 24, x + w*0.72, y + 36);
        ctx.bezierCurveTo(x + w*0.6, y + 52, x + w*0.3, y + 46, x + w*0.16, y + 40);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fill();
    }

    function drawSpike(ctx,x,y,w,h){
        ctx.save();
        ctx.translate(0,0);
        // rock base
        ctx.fillStyle = '#2b6b3b';
        ctx.beginPath();
        ctx.moveTo(x, y + h);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x + w*0.75, y + h*0.3);
        ctx.lineTo(x + w*0.5, y + h*0.05);
        ctx.lineTo(x + w*0.25, y + h*0.3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    function drawBarrel(ctx,x,y,w,h){
        ctx.save();
        // barrel body
        ctx.fillStyle = '#7f4b20';
        drawRoundedRect(ctx, x, y, w, h, 8);
        // highlight
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(x + 6, y + 6, w - 12, 6);
        ctx.restore();
    }

    function drawDrone(ctx,x,y,w,h){
        ctx.save();
        // body
        ctx.fillStyle = '#263238';
        drawRoundedRect(ctx, x, y, w, h, 8);
        // eyes / panel
        ctx.fillStyle = 'rgba(124,200,255,0.98)';
        ctx.fillRect(x + w*0.18, y + h*0.28, w*0.64, h*0.36);
        // rotors
        ctx.beginPath();
        ctx.arc(x + 8, y + 6, 6, 0, Math.PI*2); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fill();
        ctx.beginPath();
        ctx.arc(x + w - 8, y + 6, 6, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    }

    // main loop
    function loop(t){
        const dt = Math.min(0.032, (t - last) / 1000);
        last = t;
        update(dt);
        render();
        // update HUD elements outside canvas
        scoreEl.textContent = 'Score: ' + Math.floor(distance);
        levelEl.textContent = 'Level: ' + level;
        requestAnimationFrame(loop);
    }

    // initialization
    function init(){
        resize();
        // initial player placement relative to groundY
        player.y = groundY - player.h;

        // fill initial clouds
        for(let i=0;i<6;i++) makeCloud();

        // small decorative floor ripple
        spawnParticles(140, groundY + 2, '#b7f5c6');

        requestAnimationFrame(loop);
    }

    init();

})();