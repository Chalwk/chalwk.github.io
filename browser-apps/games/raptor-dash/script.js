// Copyright (c) 2025. Jericho Crosby (Chalwk)

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

    // player - dinosaur character
    const player = {
        x: 92, // screen x
        y: 0,
        vy: 0,
        w: 46, // width for running pose
        h: 50, // height for running pose
        crouchW: 60, // wider when crouching
        crouchH: 30, // shorter when crouching
        onGround: false,
        jumping: false,
        crouching: false,
        boostReady: true,
        color: '#072a14',
        frame: 0, // animation frame
        frameTimer: 0
    };

    // world
    const groundY = 300; // canvas-local coordinate
    let obstacles = [];
    let particles = [];
    let clouds = [];
    let birds = [];
    let groundTextures = [];

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
        birds = [];
        groundTextures = [];
        segmentCursor = 0;
        spawnX = 700;
        rng = makeRng(Date.now());
        segments = generateSegments(Date.now());
        player.y = groundY - player.h;
        player.vy = 0;
        player.onGround = true;
        player.crouching = false;
        player.frame = 0;
        player.frameTimer = 0;
        running = true;
        paused = false;
        last = performance.now();

        // Generate initial ground textures
        generateGroundTextures();
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

    // Enhanced cloud system with parallax layers
    function makeCloud(){
        const layer = Math.floor(rng() * 3); // 0: far, 1: mid, 2: near
        let size, speed, alpha, y;

        switch(layer) {
            case 0: // Far clouds - large, slow, low opacity
                size = 180 + rng() * 200;
                speed = 15 + rng() * 25;
                alpha = 0.1 + rng() * 0.15;
                y = 20 + rng() * 60;
                break;
            case 1: // Mid clouds - medium
                size = 120 + rng() * 150;
                speed = 30 + rng() * 40;
                alpha = 0.2 + rng() * 0.2;
                y = 60 + rng() * 80;
                break;
            case 2: // Near clouds - small, fast, high opacity
                size = 80 + rng() * 100;
                speed = 50 + rng() * 60;
                alpha = 0.3 + rng() * 0.2;
                y = 100 + rng() * 100;
                break;
        }

        clouds.push({
            x: 900 + rng() * 600,
            y: y,
            w: size,
            spd: speed,
            alpha: alpha,
            layer: layer
        });
    }

    // Bird system
    function makeBird(){
        const type = Math.floor(rng() * 3); // Different bird types
        const y = 40 + rng() * 120;
        const speed = 80 + rng() * 120;
        const size = 12 + rng() * 8;

        birds.push({
            x: 900,
            y: y,
            spd: speed,
            size: size,
            type: type,
            wingPhase: rng() * Math.PI * 2,
            wingSpeed: 8 + rng() * 6
        });
    }

    // Generate ground textures (rocks, debris, etc.)
    function generateGroundTextures() {
        const cw = canvas.width / DPR;
        const count = 50 + Math.floor(rng() * 30);

        for(let i = 0; i < count; i++) {
            const type = Math.floor(rng() * 3);
            const size = 2 + rng() * 6;
            const x = rng() * cw * 2; // Spread across double canvas width
            const alpha = 0.3 + rng() * 0.4;

            groundTextures.push({
                x: x,
                y: groundY + 2 + rng() * 8,
                size: size,
                type: type,
                alpha: alpha,
                speedMod: 0.3 + rng() * 0.4 // Slower than obstacles for parallax
            });
        }
    }

    // particles (for collisions and aesthetic)
    function spawnParticles(x,y,color){
        for(let i=0;i<18;i++){
            particles.push({x,y,vx:(rng()-0.5)*420,vy:(rng()-1.5)*360,life:0.9 + rng()*0.9,size:2+rng()*3,color});
        }
    }

    // input
    let wantJump = false;
    let wantCrouch = false;

    function onJump(){
        if(!running) return;
        if(player.onGround && !player.crouching){
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

    function onCrouchStart() {
        if(!running || !player.onGround || player.jumping) return;
        player.crouching = true;
        player.w = player.crouchW;
        player.h = player.crouchH;
        player.y = groundY - player.h; // Adjust Y position when crouching
    }

    function onCrouchEnd() {
        if(player.crouching) {
            player.crouching = false;
            player.w = 46;
            player.h = 50;
            player.y = groundY - player.h; // Adjust Y position when standing
        }
    }

    document.addEventListener('keydown', e => {
        if([' ','ArrowUp','w'].includes(e.key)) {
            e.preventDefault();
            onJump();
        }
        if(['ArrowDown','s'].includes(e.key)) {
            e.preventDefault();
            onCrouchStart();
        }
    });

    document.addEventListener('keyup', e => {
        if(['ArrowDown','s'].includes(e.key)) {
            e.preventDefault();
            onCrouchEnd();
        }
    });

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

    // Improved collision detection system
    let debugMode = false;
    document.addEventListener('keydown', (e) => {
        if (e.key === 'd' || e.key === 'D') {
            debugMode = !debugMode;
        }
    });

    // Basic AABB collision
    function collide(a, b) {
        return a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y;
    }

    // Enhanced collision detection for different obstacle types
    function checkPlayerCollision(player, obstacle) {
        const playerRect = {
            x: player.x + (player.crouching ? 8 : 4), // Adjust hitbox for crouching
            y: player.y + (player.crouching ? 2 : 6),
            w: player.w - (player.crouching ? 16 : 8),
            h: player.h - (player.crouching ? 4 : 12)
        };

        const obRect = {
            x: obstacle.x,
            y: obstacle.y,
            w: obstacle.w,
            h: obstacle.h
        };

        // Basic AABB check first (performance optimization)
        if (!collide(playerRect, obRect)) {
            return false;
        }

        // Enhanced collision based on obstacle type
        switch(obstacle.type) {
            case 'spike':
                return checkSpikeCollision(playerRect, obstacle);
            case 'barrel':
                return checkBarrelCollision(playerRect, obstacle);
            case 'drone':
                return checkDroneCollision(playerRect, obstacle);
            default:
                return collide(playerRect, obRect);
        }
    }

    // Spike collision - treat as triangle for more accurate detection
    function checkSpikeCollision(player, spike) {
        // Create triangle points for the spike
        const spikeTop = {
            x: spike.x + spike.w * 0.5,
            y: spike.y + spike.h * 0.05
        };

        const spikeLeft = {
            x: spike.x + spike.w * 0.25,
            y: spike.y + spike.h * 0.3
        };

        const spikeRight = {
            x: spike.x + spike.w * 0.75,
            y: spike.y + spike.h * 0.3
        };

        const spikeBaseLeft = {
            x: spike.x,
            y: spike.y + spike.h
        };

        const spikeBaseRight = {
            x: spike.x + spike.w,
            y: spike.y + spike.h
        };

        // Check if any player corner is inside the spike polygon
        const playerCorners = [
            {x: player.x, y: player.y}, // top-left
            {x: player.x + player.w, y: player.y}, // top-right
            {x: player.x, y: player.y + player.h}, // bottom-left
            {x: player.x + player.w, y: player.y + player.h} // bottom-right
        ];

        // Check against the main triangular part
        for (let corner of playerCorners) {
            if (pointInTriangle(corner, spikeTop, spikeLeft, spikeRight) ||
            pointInTriangle(corner, spikeLeft, spikeBaseLeft, spikeBaseRight) ||
            pointInTriangle(corner, spikeLeft, spikeRight, spikeBaseRight)) {
                return true;
            }
        }

        return false;
    }

    // Point in triangle test using barycentric coordinates
    function pointInTriangle(p, a, b, c) {
        const area = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
        const s = ((b.y - c.y) * (p.x - c.x) + (c.x - b.x) * (p.y - c.y)) / area;
        const t = ((c.y - a.y) * (p.x - c.x) + (a.x - c.x) * (p.y - c.y)) / area;
        const u = 1 - s - t;

        return s >= 0 && t >= 0 && u >= 0 && s <= 1 && t <= 1 && u <= 1;
    }

    // Barrel collision - rectangular but with corner tolerance
    function checkBarrelCollision(player, barrel) {
        // Basic AABB with slightly adjusted hitbox
        const adjustedBarrel = {
            x: barrel.x + 4,
            y: barrel.y + 4,
            w: barrel.w - 8,
            h: barrel.h - 8
        };

        return collide(player, adjustedBarrel);
    }

    // Drone collision - rectangular hitbox
    function checkDroneCollision(player, drone) {
        // Drone has a rectangular hitbox
        return collide(player, drone);
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

        // Spawn clouds and birds occasionally
        if(clouds.length < 12 && rng() < 0.03) makeCloud();
        if(birds.length < 3 && rng() < 0.008) makeBird();

        // update player physics
        player.vy += gravity * dt;
        player.y += player.vy * dt;
        if(player.y + player.h >= groundY){
            player.y = groundY - player.h;
            player.vy = 0;
            player.onGround = true;
            player.jumping = false;
        }

        // Update animation frames
        if (player.onGround && !player.crouching) {
            player.frameTimer += dt;
            if (player.frameTimer > 0.1) { // Switch frame every 100ms
                player.frameTimer = 0;
                player.frame = (player.frame + 1) % 2; // Alternate between 0 and 1
            }
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

        // update clouds with parallax
        for(const c of clouds){
            // Different layers move at different speeds for parallax effect
            const layerSpeed = [0.3, 0.6, 0.9][c.layer] || 0.6;
            c.x -= c.spd * dt * layerSpeed;
        }
        clouds = clouds.filter(c => c.x + c.w > -200);

        // update birds
        for(const b of birds){
            b.x -= b.spd * dt;
            b.wingPhase += dt * b.wingSpeed;
        }
        birds = birds.filter(b => b.x > -50);

        // update ground textures with parallax
        for(const t of groundTextures){
            t.x -= speed * dt * t.speedMod;
            // Wrap around when off screen
            if(t.x < -20){
                t.x = canvas.width / DPR + 20;
            }
        }

        // particles
        for(let i=particles.length-1;i>=0;i--){
            const p = particles[i];
            p.vy += 1000 * dt;
            p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
            if(p.life <= 0) particles.splice(i,1);
        }

        // Enhanced collision detection
        for(const o of obstacles){
            if(checkPlayerCollision(player, o)){
                // crash
                running = false;
                playCollision();
                spawnParticles(player.x + player.w/2, player.y + player.h/2, '#ff6b6b');
                btnStart.textContent = 'Restart';
                break; // Stop checking after first collision
            }
        }
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

    // Draw dinosaur character
    function drawDinosaur(ctx, x, y, isCrouching, frame) {
        ctx.save();

        if (isCrouching) {
            drawCrouchingDino(ctx, x, y);
        } else {
            drawRunningDino(ctx, x, y, frame);
        }

        ctx.restore();
    }

    function drawRunningDino(ctx, x, y, frame) {
        // Body (main rectangle)
        ctx.fillStyle = '#072a14';
        ctx.fillRect(x, y, 46, 50);

        // Head
        ctx.fillRect(x + 30, y - 10, 20, 20);

        // Eye
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 42, y - 5, 4, 4);

        // Legs - alternate based on frame
        ctx.fillStyle = '#072a14';
        if (frame === 0) {
            // Frame 1: left leg forward, right leg back
            ctx.fillRect(x + 5, y + 50, 12, 8);  // Left leg
            ctx.fillRect(x + 25, y + 50, 8, 12); // Right leg
        } else {
            // Frame 2: right leg forward, left leg back
            ctx.fillRect(x + 5, y + 50, 8, 12);  // Left leg
            ctx.fillRect(x + 25, y + 50, 12, 8); // Right leg
        }

        // Tail
        ctx.fillRect(x - 8, y + 15, 8, 6);

        // Arm
        ctx.fillRect(x + 20, y + 15, 6, 12);
    }

    function drawCrouchingDino(ctx, x, y) {
        // Lower, wider body for crouching
        ctx.fillStyle = '#072a14';
        ctx.fillRect(x, y + 20, 60, 30); // Wider and lower body

        // Head - lower and forward
        ctx.fillRect(x + 15, y + 10, 25, 15);

        // Eye
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 32, y + 14, 4, 4);

        // Legs tucked under
        ctx.fillStyle = '#072a14';
        ctx.fillRect(x + 10, y + 50, 15, 6);  // Left leg
        ctx.fillRect(x + 35, y + 50, 15, 6);  // Right leg

        // Tail - lower and shorter
        ctx.fillRect(x - 6, y + 30, 6, 4);
    }

    // render
    function render(){
        const cw = canvas.width / DPR;
        const ch = canvas.height / DPR;

        // background sky gradient
        ctx.clearRect(0,0,cw,ch);
        const g = ctx.createLinearGradient(0,0,0,ch);
        g.addColorStop(0,'#8fd3f4');
        g.addColorStop(0.4,'#bfe9ff');
        g.addColorStop(0.7,'#e9f7ff');
        g.addColorStop(1,'#f8fbff');
        ctx.fillStyle = g;
        ctx.fillRect(0,0,cw,ch);

        // sun / glow
        const sunX = cw - 120, sunY = 90;
        const rad = ctx.createRadialGradient(sunX,sunY,10,sunX,sunY,180);
        rad.addColorStop(0,'rgba(255,255,200,0.95)');
        rad.addColorStop(1,'rgba(255,255,200,0.0)');
        ctx.fillStyle = rad;
        ctx.fillRect(sunX-200,sunY-200,400,400);

        // Draw distant mountains
        drawMountains(ctx, cw, ch);

        // parallax clouds - draw in order (far first, then mid, then near)
        const sortedClouds = [...clouds].sort((a, b) => a.layer - b.layer);
        for(const c of sortedClouds){
            ctx.globalAlpha = c.alpha;
            drawCloud(ctx, c.x, c.y, c.w, c.layer);
            ctx.globalAlpha = 1;
        }

        // Draw birds
        for(const b of birds){
            drawBird(ctx, b.x, b.y, b.size, b.type, b.wingPhase);
        }

        // Enhanced ground with texture
        drawEnhancedGround(ctx, cw, ch, groundY);

        // Draw ground textures (rocks, debris)
        for(const t of groundTextures){
            ctx.globalAlpha = t.alpha;
            drawGroundTexture(ctx, t.x, t.y, t.size, t.type);
            ctx.globalAlpha = 1;
        }

        // obstacles
        for(const o of obstacles){
            if(o.type === 'spike') drawSpike(ctx, o.x, o.y, o.w, o.h);
            else if(o.type === 'barrel') drawBarrel(ctx, o.x, o.y, o.w, o.h);
            else if(o.type === 'drone') drawDrone(ctx, o.x, o.y, o.w, o.h);

            // Debug visualization
            if (debugMode) {
                ctx.strokeStyle = 'red';
                ctx.lineWidth = 2;
                ctx.strokeRect(o.x, o.y, o.w, o.h);
            }
        }

        // Draw dinosaur character with glow
        ctx.save();
        ctx.shadowColor = 'rgba(124,231,135,0.26)';
        ctx.shadowBlur = 18;
        drawDinosaur(ctx, player.x, player.y, player.crouching, player.frame);

        // Debug player hitbox
        if (debugMode) {
            ctx.strokeStyle = 'blue';
            ctx.lineWidth = 2;
            const playerRect = {
                x: player.x + (player.crouching ? 8 : 4),
                y: player.y + (player.crouching ? 2 : 6),
                w: player.w - (player.crouching ? 16 : 8),
                h: player.h - (player.crouching ? 4 : 12)
            };
            ctx.strokeRect(playerRect.x, playerRect.y, playerRect.w, playerRect.h);
        }
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

    // New drawing functions for enhanced environment

    function drawMountains(ctx, cw, ch) {
        ctx.save();

        // Distant mountains
        ctx.fillStyle = '#7fa8c4';
        ctx.beginPath();
        ctx.moveTo(0, groundY - 80);
        for(let i = 0; i < cw; i += 40) {
            const height = 60 + Math.sin(i * 0.02) * 20;
            ctx.lineTo(i, groundY - height);
        }
        ctx.lineTo(cw, groundY);
        ctx.lineTo(0, groundY);
        ctx.closePath();
        ctx.fill();

        // Closer hills
        ctx.fillStyle = '#95b8d1';
        ctx.beginPath();
        ctx.moveTo(0, groundY - 40);
        for(let i = 0; i < cw; i += 30) {
            const height = 30 + Math.sin(i * 0.03) * 15;
            ctx.lineTo(i, groundY - height);
        }
        ctx.lineTo(cw, groundY);
        ctx.lineTo(0, groundY);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    function drawCloud(ctx, x, y, w, layer) {
        ctx.save();

        // Different cloud styles based on layer
        let color, detail;
        switch(layer) {
            case 0: // Far clouds - simple, low detail
                color = 'rgba(255,255,255,0.7)';
                detail = 3;
                break;
            case 1: // Mid clouds - medium detail
                color = 'rgba(255,255,255,0.8)';
                detail = 4;
                break;
            case 2: // Near clouds - high detail
                color = 'rgba(255,255,255,0.9)';
                detail = 5;
                break;
        }

        ctx.fillStyle = color;
        ctx.beginPath();

        // Base cloud shape with varying detail based on layer
        ctx.moveTo(x, y + w * 0.1);
        for(let i = 0; i <= detail; i++) {
            const t = i / detail;
            const angle = Math.PI * t;
            const cx = x + w * 0.5 * (1 - Math.cos(angle));
            const cy = y + Math.sin(angle) * w * 0.15;
            ctx.lineTo(cx, cy);
        }

        for(let i = detail; i >= 0; i--) {
            const t = i / detail;
            const angle = Math.PI * t;
            const cx = x + w * 0.5 * (1 + Math.cos(angle));
            const cy = y + Math.sin(angle) * w * 0.15 + w * 0.1;
            ctx.lineTo(cx, cy);
        }

        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    function drawBird(ctx, x, y, size, type, wingPhase) {
        ctx.save();
        ctx.translate(x, y);

        // Different bird types
        switch(type) {
            case 0: // Seagull style
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(-size * 0.8, -size * 0.3);
                ctx.moveTo(0, 0);
                ctx.lineTo(size * 0.8, -size * 0.3);
                ctx.stroke();
                break;

            case 1: // Classic V shape
                ctx.strokeStyle = '#333333';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(-size * 0.5, 0);
                ctx.lineTo(0, -size * 0.7 * Math.sin(wingPhase));
                ctx.lineTo(size * 0.5, 0);
                ctx.stroke();
                break;

            case 2: // Flapping bird
                ctx.strokeStyle = '#555555';
                ctx.lineWidth = 1.3;
                ctx.beginPath();
                // Body
                ctx.moveTo(-size * 0.3, 0);
                ctx.lineTo(size * 0.3, 0);
                // Wings
                ctx.moveTo(0, 0);
                ctx.lineTo(-size * 0.4, -size * 0.6 * Math.sin(wingPhase));
                ctx.moveTo(0, 0);
                ctx.lineTo(size * 0.4, -size * 0.6 * Math.sin(wingPhase + Math.PI));
                ctx.stroke();
                break;
        }

        ctx.restore();
    }

    function drawEnhancedGround(ctx, cw, ch, groundY) {
        // Main ground fill
        const groundGrad = ctx.createLinearGradient(0, groundY, 0, groundY + 120);
        groundGrad.addColorStop(0, '#c8a87b');
        groundGrad.addColorStop(0.3, '#b8945f');
        groundGrad.addColorStop(1, '#a57c47');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, groundY, cw, ch - groundY);

        // Ground texture - dirt pattern
        ctx.fillStyle = '#9c7343';
        for(let i = 0; i < cw; i += 8) {
            for(let j = groundY; j < groundY + 40; j += 8) {
                if(Math.random() > 0.7) {
                    ctx.fillRect(i, j, 2, 1);
                }
            }
        }

        // Grass tufts along the top
        ctx.strokeStyle = '#7d9c5a';
        ctx.lineWidth = 1;
        for(let i = 0; i < cw; i += 15) {
            if(rng() > 0.4) {
                ctx.beginPath();
                ctx.moveTo(i, groundY);
                ctx.lineTo(i - 3, groundY - 4);
                ctx.moveTo(i, groundY);
                ctx.lineTo(i + 2, groundY - 6);
                ctx.moveTo(i, groundY);
                ctx.lineTo(i + 4, groundY - 3);
                ctx.stroke();
            }
        }
    }

    function drawGroundTexture(ctx, x, y, size, type) {
        ctx.save();

        switch(type) {
            case 0: // Small rock
                ctx.fillStyle = '#8a7455';
                ctx.beginPath();
                ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 1: // Pebble cluster
                ctx.fillStyle = '#7a6648';
                for(let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.arc(x + (i - 1) * size * 0.3, y, size * 0.3, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;

            case 2: // Twig
                ctx.strokeStyle = '#5d4a32';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x - size * 0.8, y);
                ctx.lineTo(x + size * 0.8, y + size * 0.2);
                ctx.stroke();
                break;
        }

        ctx.restore();
    }

    // decorative draw functions
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
        for(let i=0;i<8;i++) makeCloud();

        // Generate initial ground textures
        generateGroundTextures();

        // small decorative floor ripple
        spawnParticles(140, groundY + 2, '#b7f5c6');

        requestAnimationFrame(loop);
    }

    init();

})();