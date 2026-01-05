/*
Copyright (c) 2024-2026. Jericho Crosby (Chalwk)

Raptor Dash - JavaScript
*/

(() => {
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    let DPR = Math.max(1, window.devicePixelRatio || 1);

    function resize() {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = Math.floor(rect.width * DPR);
        canvas.height = Math.floor(rect.height * DPR);
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    window.addEventListener('resize', resize);

    let running = false;
    let paused = false;
    let last = performance.now();
    let speed = 240;
    let distance = 0;
    let level = 1;
    const gravity = 2200;

    const scoreEl = document.getElementById('score');
    const levelEl = document.getElementById('level');
    const btnStart = document.getElementById('btn-start');
    const btnPause = document.getElementById('btn-pause');

    const player = {
        x: 92,
        y: 0,
        vy: 0,
        w: 46,
        h: 50,
        crouchW: 60,
        crouchH: 30,
        onGround: false,
        jumping: false,
        crouching: false,
        boostReady: true,
        color: '#072a14',
        frame: 0,
        frameTimer: 0
    };

    const groundY = 300;
    let obstacles = [];
    let particles = [];
    let clouds = [];
    let birds = [];
    let groundTextures = [];

    function makeRng(seed = Date.now()) {
        let t = seed >>> 0;
        return () => {
            t += 0x6D2B79F5;
            let r = Math.imul(t ^ t >>> 15, 1 | t);
            r = (r + Math.imul(r ^ r >>> 7, 61 | r)) ^ r;
            return ((r ^ r >>> 14) >>> 0) / 4294967296;
        }
    }

    function generateSegments(seed) {
        const rng = makeRng(seed);
        const segs = [];

        for (let i = 0; i < 100; i++) {
            const difficulty = Math.min(1, i / 40);
            const theme = rng() < 0.22 ? 'aerial' : 'ground';
            const density = 0.6 + difficulty * 1.2 + rng() * 0.6;
            const gapMin = 220 - difficulty * 80 - rng() * 60;
            const gapMax = gapMin + 160 + rng() * 280;
            segs.push({ theme, density, gapMin: Math.round(gapMin), gapMax: Math.round(gapMax) });
        }
        return segs;
    }

    let segmentCursor = 0;
    let spawnX = 700;
    let rng = makeRng();
    let segments = generateSegments(Date.now());

    function resetGame() {
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

        generateGroundTextures();
    }

    function createObstacle(type, x) {
        if (type === 'spike') {
            const h = 56 + Math.round(rng() * 48);
            const w = 26 + Math.round(rng() * 18);
            return { type: 'spike', x, y: 0, w, h, pass: false };
        }
        if (type === 'barrel') {
            const w = 46 + Math.round(rng() * 38);
            const h = 38 + Math.round(rng() * 20);
            return { type: 'barrel', x, w, h, pass: false };
        }
        if (type === 'drone') {
            const w = 60;
            const h = 40;
            const ybase = groundY - player.h - 80 - Math.round(rng() * 120);
            return { type: 'drone', x, w, h, y: ybase, osc: rng() * Math.PI * 2, pass: false };
        }
        return createObstacle('spike', x);
    }

    function populateObstaclesIfNeeded() {
        const needed = 6;
        if (obstacles.length > 0 && obstacles.filter(o => o.x > 0).length >= needed) return;

        const seg = segments[segmentCursor % segments.length];
        const density = seg.density;
        const count = 3 + Math.floor(density * 3);
        let x = spawnX + rng() * 120;
        for (let i = 0; i < count; i++) {
            const roll = rng();
            let type;
            if (seg.theme === 'aerial') type = roll < 0.6 ? 'drone' : (roll < 0.8 ? 'spike' : 'barrel');
            else type = roll < 0.6 ? 'spike' : (roll < 0.85 ? 'barrel' : 'drone');

            const gap = seg.gapMin + Math.round(rng() * (seg.gapMax - seg.gapMin));
            const ob = createObstacle(type, x + gap);
            if (ob.type === 'spike' || ob.type === 'barrel') {
                ob.y = groundY - ob.h;
            }
            obstacles.push(ob);
            x += gap;
        }
        spawnX = x + 160 + rng() * 240;
        segmentCursor++;
    }

    function makeCloud() {
        const layer = Math.floor(rng() * 3);
        let size, speed, alpha, y;

        switch (layer) {
            case 0:
                size = 180 + rng() * 200;
                speed = 15 + rng() * 25;
                alpha = 0.1 + rng() * 0.15;
                y = 20 + rng() * 60;
                break;
            case 1:
                size = 120 + rng() * 150;
                speed = 30 + rng() * 40;
                alpha = 0.2 + rng() * 0.2;
                y = 60 + rng() * 80;
                break;
            case 2:
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

    function makeBird() {
        const type = Math.floor(rng() * 3);
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

    function generateGroundTextures() {
        const cw = canvas.width / DPR;
        const count = 50 + Math.floor(rng() * 30);

        for (let i = 0; i < count; i++) {
            const type = Math.floor(rng() * 3);
            const size = 2 + rng() * 6;
            const x = rng() * cw * 2;
            const alpha = 0.3 + rng() * 0.4;

            groundTextures.push({
                x: x,
                y: groundY + 2 + rng() * 8,
                size: size,
                type: type,
                alpha: alpha,
                speedMod: 0.3 + rng() * 0.4
            });
        }
    }

    function spawnParticles(x, y, color) {
        for (let i = 0; i < 18; i++) {
            particles.push({ x, y, vx: (rng() - 0.5) * 420, vy: (rng() - 1.5) * 360, life: 0.9 + rng() * 0.9, size: 2 + rng() * 3, color });
        }
    }

    let wantJump = false;
    let wantCrouch = false;

    function onJump() {
        if (!running) return;
        if (player.onGround && !player.crouching) {
            player.vy = -820;
            player.onGround = false;
            player.jumping = true;
            player.boostReady = true;
            playJumpTone();
        } else if (player.jumping && player.boostReady) {
            player.vy = -520;
            player.boostReady = false;
            playBoostTone();
        }
    }

    function onCrouchStart() {
        if (!running || !player.onGround || player.jumping) return;
        player.crouching = true;
        player.w = player.crouchW;
        player.h = player.crouchH;
        player.y = groundY - player.h;
    }

    function onCrouchEnd() {
        if (player.crouching) {
            player.crouching = false;
            player.w = 46;
            player.h = 50;
            player.y = groundY - player.h;
        }
    }

    document.addEventListener('keydown', e => {
        if ([' ', 'ArrowUp', 'w'].includes(e.key)) {
            e.preventDefault();
            onJump();
        }
        if (['ArrowDown', 's'].includes(e.key)) {
            e.preventDefault();
            onCrouchStart();
        }
    });

    document.addEventListener('keyup', e => {
        if (['ArrowDown', 's'].includes(e.key)) {
            e.preventDefault();
            onCrouchEnd();
        }
    });

    canvas.addEventListener('pointerdown', e => onJump());

    btnStart.addEventListener('click', () => { resetGame(); });
    btnPause.addEventListener('click', () => { paused = !paused; btnPause.innerHTML = paused ? '<i class="fas fa-play"></i> Resume' : '<i class="fas fa-pause"></i> Pause'; });

    let audioCtx;
    function ensureAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    function playJumpTone() { try { ensureAudio(); const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type = 'sine'; o.frequency.value = 420; g.gain.value = 0.02; o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + 0.06); } catch (e) { } }
    function playBoostTone() { try { ensureAudio(); const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type = 'triangle'; o.frequency.value = 620; g.gain.value = 0.03; o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + 0.09); } catch (e) { } }
    function playCollision() { try { ensureAudio(); const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type = 'square'; o.frequency.value = 120; g.gain.value = 0.06; o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + 0.12); } catch (e) { } }

    function collide(a, b) {
        return a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y;
    }

    function checkPlayerCollision(player, obstacle) {
        const playerRect = {
            x: player.x + (player.crouching ? 8 : 4),
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

        if (!collide(playerRect, obRect)) return false;

        switch (obstacle.type) {
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

    function pointInTriangle(p, a, b, c) {
        const area = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
        const s = ((b.y - c.y) * (p.x - c.x) + (c.x - b.x) * (p.y - c.y)) / area;
        const t = ((c.y - a.y) * (p.x - c.x) + (a.x - c.x) * (p.y - c.y)) / area;
        const u = 1 - s - t;

        return s >= 0 && t >= 0 && u >= 0 && s <= 1 && t <= 1 && u <= 1;
    }

    function checkSpikeCollision(player, spike) {
        const spikeTop = { x: spike.x + spike.w * 0.5, y: spike.y + spike.h * 0.05 };
        const spikeLeft = { x: spike.x + spike.w * 0.25, y: spike.y + spike.h * 0.3 };
        const spikeRight = { x: spike.x + spike.w * 0.75, y: spike.y + spike.h * 0.3 };
        const spikeBaseLeft = { x: spike.x, y: spike.y + spike.h };
        const spikeBaseRight = { x: spike.x + spike.w, y: spike.y + spike.h };

        const playerCorners = [
            { x: player.x, y: player.y },
            { x: player.x + player.w, y: player.y },
            { x: player.x, y: player.y + player.h },
            { x: player.x + player.w, y: player.y + player.h }
        ];

        for (let corner of playerCorners) {
            if (pointInTriangle(corner, spikeTop, spikeLeft, spikeRight) ||
            pointInTriangle(corner, spikeLeft, spikeBaseLeft, spikeBaseRight) ||
            pointInTriangle(corner, spikeLeft, spikeRight, spikeBaseRight)) {
                return true;
            }
        }
        return false;
    }

    function checkBarrelCollision(player, barrel) {
        const adjustedBarrel = {
            x: barrel.x + 4,
            y: barrel.y + 4,
            w: barrel.w - 8,
            h: barrel.h - 8
        };
        return collide(player, adjustedBarrel);
    }

    function checkDroneCollision(player, drone) {
        return collide(player, drone);
    }

    function update(dt) {
        if (!running || paused) return;

        distance += speed * dt;
        level = 1 + Math.floor(distance / 1500);
        speed = 240 + level * 18;

        populateObstaclesIfNeeded();

        if (clouds.length < 12 && rng() < 0.03) makeCloud();
        if (birds.length < 3 && rng() < 0.008) makeBird();

        player.vy += gravity * dt;
        player.y += player.vy * dt;
        if (player.y + player.h >= groundY) {
            player.y = groundY - player.h;
            player.vy = 0;
            player.onGround = true;
            player.jumping = false;
        }

        if (player.onGround && !player.crouching) {
            player.frameTimer += dt;
            if (player.frameTimer > 0.1) {
                player.frameTimer = 0;
                player.frame = (player.frame + 1) % 2;
            }
        }

        for (const o of obstacles) {
            o.x -= speed * dt;
            if (o.type === 'drone') {
                o.osc += dt * 4 * (0.8 + rng() * 0.4);
                o.y += Math.sin(o.osc) * 6 * dt * 60;
            }
            if (!o.pass && o.x + (o.w || 30) < player.x) { o.pass = true; distance += 8; }
        }
        obstacles = obstacles.filter(o => o.x + (o.w || 30) > -60);

        for (const c of clouds) {
            const layerSpeed = [0.3, 0.6, 0.9][c.layer] || 0.6;
            c.x -= c.spd * dt * layerSpeed;
        }
        clouds = clouds.filter(c => c.x + c.w > -200);

        for (const b of birds) {
            b.x -= b.spd * dt;
            b.wingPhase += dt * b.wingSpeed;
        }
        birds = birds.filter(b => b.x > -50);

        for (const t of groundTextures) {
            t.x -= speed * dt * t.speedMod;
            if (t.x < -20) {
                t.x = canvas.width / DPR + 20;
            }
        }

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.vy += 1000 * dt;
            p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
            if (p.life <= 0) particles.splice(i, 1);
        }

        for (const o of obstacles) {
            if (checkPlayerCollision(player, o)) {
                running = false;
                playCollision();
                spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#ff6b6b');
                btnStart.innerHTML = '<i class="fas fa-redo"></i> Restart';
                break;
            }
        }
    }

    function drawRoundedRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        ctx.fill();
    }

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
        ctx.fillStyle = '#072a14';
        ctx.fillRect(x, y, 46, 50);
        ctx.fillRect(x + 30, y - 10, 20, 20);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 42, y - 5, 4, 4);
        ctx.fillStyle = '#072a14';
        if (frame === 0) {
            ctx.fillRect(x + 5, y + 50, 12, 8);
            ctx.fillRect(x + 25, y + 50, 8, 12);
        } else {
            ctx.fillRect(x + 5, y + 50, 8, 12);
            ctx.fillRect(x + 25, y + 50, 12, 8);
        }
        ctx.fillRect(x - 8, y + 15, 8, 6);
        ctx.fillRect(x + 20, y + 15, 6, 12);
    }

    function drawCrouchingDino(ctx, x, y) {
        ctx.fillStyle = '#072a14';
        ctx.fillRect(x, y + 20, 60, 30);
        ctx.fillRect(x + 15, y + 10, 25, 15);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 32, y + 14, 4, 4);
        ctx.fillStyle = '#072a14';
        ctx.fillRect(x + 10, y + 50, 15, 6);
        ctx.fillRect(x + 35, y + 50, 15, 6);
        ctx.fillRect(x - 6, y + 30, 6, 4);
    }

    function render() {
        const cw = canvas.width / DPR;
        const ch = canvas.height / DPR;

        ctx.clearRect(0, 0, cw, ch);
        const g = ctx.createLinearGradient(0, 0, 0, ch);
        g.addColorStop(0, '#8fd3f4');
        g.addColorStop(0.4, '#bfe9ff');
        g.addColorStop(0.7, '#e9f7ff');
        g.addColorStop(1, '#f8fbff');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, cw, ch);

        const sunX = cw - 120, sunY = 90;
        const rad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 180);
        rad.addColorStop(0, 'rgba(255,255,200,0.95)');
        rad.addColorStop(1, 'rgba(255,255,200,0.0)');
        ctx.fillStyle = rad;
        ctx.fillRect(sunX - 200, sunY - 200, 400, 400);

        drawMountains(ctx, cw, ch);

        const sortedClouds = [...clouds].sort((a, b) => a.layer - b.layer);
        for (const c of sortedClouds) {
            ctx.globalAlpha = c.alpha;
            drawCloud(ctx, c.x, c.y, c.w, c.layer);
            ctx.globalAlpha = 1;
        }

        for (const b of birds) {
            drawBird(ctx, b.x, b.y, b.size, b.type, b.wingPhase);
        }

        drawEnhancedGround(ctx, cw, ch, groundY);

        for (const t of groundTextures) {
            ctx.globalAlpha = t.alpha;
            drawGroundTexture(ctx, t.x, t.y, t.size, t.type);
            ctx.globalAlpha = 1;
        }

        for (const o of obstacles) {
            if (o.type === 'spike') drawSpike(ctx, o.x, o.y, o.w, o.h);
            else if (o.type === 'barrel') drawBarrel(ctx, o.x, o.y, o.w, o.h);
            else if (o.type === 'drone') drawDrone(ctx, o.x, o.y, o.w, o.h);
        }

        ctx.save();
        ctx.shadowColor = 'rgba(124,231,135,0.26)';
        ctx.shadowBlur = 18;
        drawDinosaur(ctx, player.x, player.y, player.crouching, player.frame);
        ctx.restore();

        for (const p of particles) {
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
            ctx.globalAlpha = 1;
        }

        ctx.fillStyle = 'rgba(2,6,23,0.06)';
        ctx.fillRect(12, 12, 160, 40);
        ctx.fillStyle = '#072a14';
        ctx.font = '14px system-ui, -apple-system, Roboto, "Segoe UI"';
        ctx.fillText('Score: ' + Math.floor(distance), 22, 36);
    }

    function drawMountains(ctx, cw, ch) {
        ctx.save();
        ctx.fillStyle = '#7fa8c4';
        ctx.beginPath();
        ctx.moveTo(0, groundY - 80);
        for (let i = 0; i < cw; i += 40) {
            const height = 60 + Math.sin(i * 0.02) * 20;
            ctx.lineTo(i, groundY - height);
        }
        ctx.lineTo(cw, groundY);
        ctx.lineTo(0, groundY);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#95b8d1';
        ctx.beginPath();
        ctx.moveTo(0, groundY - 40);
        for (let i = 0; i < cw; i += 30) {
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
        let color, detail;
        switch (layer) {
            case 0:
                color = 'rgba(255,255,255,0.7)';
                detail = 3;
                break;
            case 1:
                color = 'rgba(255,255,255,0.8)';
                detail = 4;
                break;
            case 2:
                color = 'rgba(255,255,255,0.9)';
                detail = 5;
                break;
        }

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y + w * 0.1);
        for (let i = 0; i <= detail; i++) {
            const t = i / detail;
            const angle = Math.PI * t;
            const cx = x + w * 0.5 * (1 - Math.cos(angle));
            const cy = y + Math.sin(angle) * w * 0.15;
            ctx.lineTo(cx, cy);
        }

        for (let i = detail; i >= 0; i--) {
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

        switch (type) {
            case 0:
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(-size * 0.8, -size * 0.3);
                ctx.moveTo(0, 0);
                ctx.lineTo(size * 0.8, -size * 0.3);
                ctx.stroke();
                break;

            case 1:
                ctx.strokeStyle = '#333333';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(-size * 0.5, 0);
                ctx.lineTo(0, -size * 0.7 * Math.sin(wingPhase));
                ctx.lineTo(size * 0.5, 0);
                ctx.stroke();
                break;

            case 2:
                ctx.strokeStyle = '#555555';
                ctx.lineWidth = 1.3;
                ctx.beginPath();
                ctx.moveTo(-size * 0.3, 0);
                ctx.lineTo(size * 0.3, 0);
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
        const groundGrad = ctx.createLinearGradient(0, groundY, 0, groundY + 120);
        groundGrad.addColorStop(0, '#c8a87b');
        groundGrad.addColorStop(0.3, '#b8945f');
        groundGrad.addColorStop(1, '#a57c47');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, groundY, cw, ch - groundY);

        ctx.fillStyle = '#9c7343';
        for (let i = 0; i < cw; i += 8) {
            for (let j = groundY; j < groundY + 40; j += 8) {
                if (Math.random() > 0.7) {
                    ctx.fillRect(i, j, 2, 1);
                }
            }
        }

        ctx.strokeStyle = '#7d9c5a';
        ctx.lineWidth = 1;
        for (let i = 0; i < cw; i += 15) {
            if (Math.random() > 0.4) {
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

        switch (type) {
            case 0:
                ctx.fillStyle = '#8a7455';
                ctx.beginPath();
                ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 1:
                ctx.fillStyle = '#7a6648';
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.arc(x + (i - 1) * size * 0.3, y, size * 0.3, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;

            case 2:
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

    function drawSpike(ctx, x, y, w, h) {
        ctx.save();
        ctx.translate(0, 0);
        ctx.fillStyle = '#2b6b3b';
        ctx.beginPath();
        ctx.moveTo(x, y + h);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x + w * 0.75, y + h * 0.3);
        ctx.lineTo(x + w * 0.5, y + h * 0.05);
        ctx.lineTo(x + w * 0.25, y + h * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    function drawBarrel(ctx, x, y, w, h) {
        ctx.save();
        ctx.fillStyle = '#7f4b20';
        drawRoundedRect(ctx, x, y, w, h, 8);
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(x + 6, y + 6, w - 12, 6);
        ctx.restore();
    }

    function drawDrone(ctx, x, y, w, h) {
        ctx.save();
        ctx.fillStyle = '#263238';
        drawRoundedRect(ctx, x, y, w, h, 8);
        ctx.fillStyle = 'rgba(124,200,255,0.98)';
        ctx.fillRect(x + w * 0.18, y + h * 0.28, w * 0.64, h * 0.36);
        ctx.beginPath();
        ctx.arc(x + 8, y + 6, 6, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fill();
        ctx.beginPath();
        ctx.arc(x + w - 8, y + 6, 6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    function loop(t) {
        const dt = Math.min(0.032, (t - last) / 1000);
        last = t;
        update(dt);
        render();
        scoreEl.textContent = Math.floor(distance);
        levelEl.textContent = level;
        requestAnimationFrame(loop);
    }

    function init() {
        resize();
        player.y = groundY - player.h;

        for (let i = 0; i < 8; i++) makeCloud();

        generateGroundTextures();

        spawnParticles(140, groundY + 2, '#b7f5c6');

        requestAnimationFrame(loop);
    }

    init();

})();