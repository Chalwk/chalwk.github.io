// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

(() => {
    const canvas = document.getElementById('game-board');
    const ctx = canvas.getContext('2d');

    const scoreEl = document.getElementById('score');
    const levelEl = document.getElementById('level');
    const statusEl = document.getElementById('status');
    const startBtn = document.getElementById('start');
    const pauseBtn = document.getElementById('pause');
    const playAgainBtn = document.getElementById('play-again');
    const difficultySelect = document.getElementById('difficulty');
    const themeSelect = document.getElementById('theme');
    const controlsHint = document.getElementById('controls-hint');
    const overlay = document.getElementById('game-over-overlay');
    const overlayMessage = document.getElementById('game-over-message');
    const overlayScore = document.getElementById('game-over-score');

    // ------------------------------------------------------------------
    // Constants
    // ------------------------------------------------------------------
    const W = 960;
    const H = 540;
    const GROUND_Y = 420;

    const GRAVITY = 2400;
    const JUMP_VELOCITY = -880;
    const BOOST_VELOCITY = -560;
    const MAX_JUMP_HEIGHT = (JUMP_VELOCITY * JUMP_VELOCITY) / (2 * GRAVITY);

    // Difficulty presets - all tuning knobs in one place
    const DIFFICULTY = {
        easy: { startSpeed: 210, speedRamp: 9, speedMax: 400, gapBase: 380, gapVar: 200, spikeChance: 0.55, barrelChance: 0.35, droneChance: 0.10 },
        normal: { startSpeed: 250, speedRamp: 13, speedMax: 500, gapBase: 320, gapVar: 180, spikeChance: 0.50, barrelChance: 0.32, droneChance: 0.18 },
        hard: { startSpeed: 300, speedRamp: 17, speedMax: 600, gapBase: 265, gapVar: 160, spikeChance: 0.45, barrelChance: 0.30, droneChance: 0.25 },
    };

    // Theme palettes
    const THEMES = {
        day: {
            skyTop: '#7fc4ee', skyMid: '#bfe9ff', skyBot: '#eef8ff',
            mountainFar: '#a9c8de', mountainNear: '#7fa8c4',
            groundTop: '#c8a87b', groundMid: '#b8945f', groundBot: '#a57c47',
            groundSpeck: '#8a7455', grass: '#7d9c5a',
            sun: 'rgba(255,245,200,0.95)', sunGlow: 'rgba(255,245,200,0)',
            cloud: 'rgba(255,255,255,0.85)',
            bird: '#333333',
            dino: '#0a3d20', dinoEye: '#ffffff',
            star: null,
        },
        dusk: {
            skyTop: '#3d2255', skyMid: '#d97655', skyBot: '#f2b06c',
            mountainFar: '#7a4b6f', mountainNear: '#5b3a55',
            groundTop: '#6b4a3a', groundMid: '#523a2c', groundBot: '#3d2b21',
            groundSpeck: '#2e1f17', grass: '#8b6b3a',
            sun: 'rgba(255,190,120,0.95)', sunGlow: 'rgba(255,190,120,0)',
            cloud: 'rgba(255,200,160,0.7)',
            bird: '#2a1a1a',
            dino: '#1a2e1e', dinoEye: '#ffe8b0',
            star: null,
        },
        night: {
            skyTop: '#050a18', skyMid: '#0f1e38', skyBot: '#1e3350',
            mountainFar: '#1a2a45', mountainNear: '#0f1b30',
            groundTop: '#2a3245', groundMid: '#1c2330', groundBot: '#0e131b',
            groundSpeck: '#080b12', grass: '#3a5f4a',
            sun: 'rgba(220,235,255,0.9)', sunGlow: 'rgba(220,235,255,0)',
            cloud: 'rgba(150,180,220,0.35)',
            bird: '#8899aa',
            dino: '#4a7a5c', dinoEye: '#ffffff',
            star: '#e8eeff',
        },
    };

    // ------------------------------------------------------------------
    // Canvas
    // ------------------------------------------------------------------
    let dpr = 1;
    function setupCanvas() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // ------------------------------------------------------------------
    // Seeded RNG (used only for one-time / spawn-time generation)
    // ------------------------------------------------------------------
    function makeRng(seed) {
        let t = seed >>> 0;
        return () => {
            t += 0x6D2B79F5;
            let r = Math.imul(t ^ (t >>> 15), 1 | t);
            r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
            return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
        };
    }

    let rng = makeRng(Date.now());

    // ------------------------------------------------------------------
    // State
    // ------------------------------------------------------------------
    let started = false;
    let paused = false;
    let gameOver = false;

    let lastTime = 0;
    let elapsed = 0;

    let distance = 0;
    let speed = 0;
    let level = 1;
    let score = 0;

    let cfg = DIFFICULTY.normal;
    let theme = THEMES.day;

    let nextSpawnDist = 0;
    let distSinceSpawn = 0;

    const player = {
        x: 140,
        y: GROUND_Y - 60,
        vy: 0,
        w: 52,
        h: 60,
        crouchW: 66,
        crouchH: 36,
        onGround: true,
        jumping: false,
        crouching: false,
        canBoost: false,
        runFrame: 0,
        runTimer: 0,
    };

    let obstacles = [];
    let particles = [];
    let clouds = [];
    let birds = [];
    let groundDetails = [];
    let grassTufts = [];
    let stars = [];

    // ------------------------------------------------------------------
    // Audio (created lazily on first user gesture)
    // ------------------------------------------------------------------
    let audioCtx = null;
    function ensureAudio() {
        if (!audioCtx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (AC) audioCtx = new AC();
        }
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    }
    function tone(freq, dur, type = 'sine', gain = 0.03) {
        const ac = ensureAudio();
        if (!ac) return;
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.type = type;
        o.frequency.value = freq;
        g.gain.value = gain;
        g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
        o.connect(g);
        g.connect(ac.destination);
        o.start();
        o.stop(ac.currentTime + dur);
    }

    // ------------------------------------------------------------------
    // World generation (one-time, per-run)
    // ------------------------------------------------------------------
    function makeCloud() {
        const layer = Math.floor(rng() * 3);
        let size, spd, alpha, y;
        if (layer === 0) { size = 180 + rng() * 200; spd = 10 + rng() * 20; alpha = 0.35 + rng() * 0.25; y = 30 + rng() * 60; }
        else if (layer === 1) { size = 120 + rng() * 150; spd = 25 + rng() * 30; alpha = 0.55 + rng() * 0.2; y = 70 + rng() * 70; }
        else { size = 80 + rng() * 100; spd = 45 + rng() * 45; alpha = 0.75 + rng() * 0.2; y = 110 + rng() * 90; }

        return {
            x: rng() * W * 1.3,
            y, w: size, spd, alpha, layer,
            seed: rng() * 1000,
        };
    }

    function makeBird() {
        return {
            x: W + rng() * 200,
            y: 40 + rng() * 140,
            spd: 70 + rng() * 110,
            size: 10 + rng() * 8,
            type: Math.floor(rng() * 3),
            wingPhase: rng() * Math.PI * 2,
            wingSpeed: 8 + rng() * 6,
        };
    }

    function rebuildGroundDecor() {
        groundDetails = [];
        grassTufts = [];
        const count = 140;
        for (let i = 0; i < count; i++) {
            groundDetails.push({
                x: rng() * W * 2,
                y: GROUND_Y + 4 + rng() * 70,
                size: 2 + rng() * 5,
                type: Math.floor(rng() * 3),
                alpha: 0.25 + rng() * 0.4,
            });
        }
        for (let i = 0; i < 90; i++) {
            grassTufts.push({
                x: rng() * W * 2,
                h: 4 + rng() * 7,
                lean: (rng() - 0.5) * 3,
            });
        }
    }

    function rebuildStars() {
        stars = [];
        for (let i = 0; i < 130; i++) {
            stars.push({
                x: rng() * W,
                y: rng() * (GROUND_Y - 80),
                r: 0.4 + rng() * 1.4,
                tw: rng() * Math.PI * 2,
            });
        }
    }

    // ------------------------------------------------------------------
    // Player actions
    // ------------------------------------------------------------------
    function jump() {
        if (!started || paused || gameOver) return;
        if (player.onGround && !player.crouching) {
            player.vy = JUMP_VELOCITY;
            player.onGround = false;
            player.jumping = true;
            player.canBoost = true;
            tone(420, 0.06, 'sine', 0.025);
        } else if (!player.onGround && player.jumping && player.canBoost) {
            player.vy = BOOST_VELOCITY;
            player.canBoost = false;
            tone(620, 0.09, 'triangle', 0.03);
            spawnParticles(player.x + player.w / 2, player.y + player.h, theme.dino, 10, 140);
        }
    }

    function crouchStart() {
        if (!started || paused || gameOver) return;
        if (!player.onGround || player.jumping) return;
        player.crouching = true;
        player.w = player.crouchW;
        player.h = player.crouchH;
        player.y = GROUND_Y - player.h;
    }

    function crouchEnd() {
        if (!player.crouching) return;
        player.crouching = false;
        player.w = 52;
        player.h = 60;
        player.y = GROUND_Y - player.h;
    }

    // ------------------------------------------------------------------
    // Obstacles
    // ------------------------------------------------------------------
    function spawnObstacle() {
        const r = rng();
        let type;
        if (level < 2) {
            type = r < 0.65 ? 'spike' : 'barrel';
        } else {
            type = r < cfg.spikeChance ? 'spike'
                : r < cfg.spikeChance + cfg.barrelChance ? 'barrel'
                    : 'drone';
        }

        const margin = 80;
        let ob;

        if (type === 'spike') {
            const h = 48 + Math.round(rng() * 40); // 48-88, jumpable
            const w = 30 + Math.round(rng() * 16);
            ob = { type, x: W + margin, y: GROUND_Y - h, w, h };
        } else if (type === 'barrel') {
            const w = 46 + Math.round(rng() * 30);
            const h = 40 + Math.round(rng() * 26);
            ob = { type, x: W + margin, y: GROUND_Y - h, w, h };
        } else {
            // drone - flying, at a height the player must duck or jump under/over
            const w = 62;
            const h = 38;
            // bottom of drone sits between -55 and -95 above ground
            const bottomOffset = 55 + Math.round(rng() * 40);
            const y = GROUND_Y - bottomOffset - h;
            ob = {
                type: 'drone',
                x: W + margin,
                y, w, h,
                baseY: y,
                osc: rng() * Math.PI * 2,
                oscAmp: 4 + rng() * 5,
                oscSpeed: 2.5 + rng() * 1.5,
            };
        }

        obstacles.push(ob);

        // Next spawn gap accounts for this obstacle's width
        const gap = cfg.gapBase + rng() * cfg.gapVar;
        nextSpawnDist = gap + ob.w;
        distSinceSpawn = 0;
    }

    // ------------------------------------------------------------------
    // Particles
    // ------------------------------------------------------------------
    function spawnParticles(x, y, color, count = 16, speed = 380) {
        for (let i = 0; i < count; i++) {
            const a = rng() * Math.PI * 2;
            const sp = speed * (0.35 + rng() * 0.9);
            particles.push({
                x, y,
                vx: Math.cos(a) * sp,
                vy: Math.sin(a) * sp - 120,
                life: 0.7 + rng() * 0.7,
                maxLife: 0.7 + rng() * 0.7,
                size: 2 + rng() * 3,
                color,
            });
        }
    }

    // ------------------------------------------------------------------
    // Collision
    // ------------------------------------------------------------------
    function playerHitbox() {
        // Slightly tightened hitbox so the game feels fair
        const px = player.x + (player.crouching ? 8 : 6);
        const py = player.y + (player.crouching ? 2 : 4);
        const pw = (player.crouching ? player.crouchW : player.w) - (player.crouching ? 16 : 12);
        const ph = (player.crouching ? player.crouchH : player.h) - (player.crouching ? 4 : 8);
        return { x: px, y: py, w: pw, h: ph };
    }

    function obstacleHitbox(o) {
        if (o.type === 'spike') {
            // Narrow the spike down to its solid body
            return {
                x: o.x + o.w * 0.22,
                y: o.y + o.h * 0.35,
                w: o.w * 0.56,
                h: o.h * 0.65,
            };
        }
        if (o.type === 'barrel') {
            return { x: o.x + 3, y: o.y + 3, w: o.w - 6, h: o.h - 6 };
        }
        // drone
        return { x: o.x + 5, y: o.y + 5, w: o.w - 10, h: o.h - 10 };
    }

    function rectsOverlap(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x &&
            a.y < b.y + b.h && a.y + a.h > b.y;
    }

    function checkCollisions() {
        const p = playerHitbox();
        for (const o of obstacles) {
            if (rectsOverlap(p, obstacleHitbox(o))) return o;
        }
        return null;
    }

    // ------------------------------------------------------------------
    // Update
    // ------------------------------------------------------------------
    function update(dt) {
        if (!started || paused || gameOver) return;

        elapsed += dt;
        distance += speed * dt;

        const targetLevel = 1 + Math.floor(distance / 1500);
        if (targetLevel !== level) {
            level = targetLevel;
            levelEl.textContent = level;
        }
        speed = Math.min(cfg.speedMax, cfg.startSpeed + (level - 1) * cfg.speedRamp);

        // Player physics
        player.vy += GRAVITY * dt;
        player.y += player.vy * dt;

        if (player.y + player.h >= GROUND_Y) {
            player.y = GROUND_Y - player.h;
            player.vy = 0;
            if (!player.onGround) {
                // landing puff
                spawnParticles(player.x + player.w / 2, GROUND_Y, 'rgba(220,200,160,0.9)', 6, 120);
            }
            player.onGround = true;
            player.jumping = false;
            player.canBoost = false;
        }

        // Run animation
        if (player.onGround && !player.crouching) {
            player.runTimer += dt;
            if (player.runTimer > 0.1) {
                player.runTimer = 0;
                player.runFrame ^= 1;
            }
        }

        // Obstacles move & scroll
        const scroll = speed * dt;
        for (const o of obstacles) {
            o.x -= scroll;
            if (o.type === 'drone') {
                o.osc += dt * o.oscSpeed;
                o.y = o.baseY + Math.sin(o.osc) * o.oscAmp;
            }
        }
        obstacles = obstacles.filter(o => o.x + o.w > -60);

        // Spawning
        distSinceSpawn += scroll;
        if (distSinceSpawn >= nextSpawnDist) {
            spawnObstacle();
        }

        // Score: award small trickle per distance
        score = Math.floor(distance / 10) + level * 25;
        scoreEl.textContent = score;

        // Clouds / birds
        for (const c of clouds) {
            const layerMul = [0.25, 0.5, 0.85][c.layer] || 0.5;
            c.x -= (c.spd + speed * 0.15) * dt * layerMul;
        }
        clouds = clouds.filter(c => c.x + c.w > -220);

        if (clouds.length < 14 && rng() < 0.02) clouds.push(makeCloud());

        for (const b of birds) {
            b.x -= (b.spd + speed * 0.1) * dt;
            b.wingPhase += dt * b.wingSpeed;
        }
        birds = birds.filter(b => b.x > -60);
        if (birds.length < 3 && rng() < 0.006) birds.push(makeBird());

        // Ground decorations scroll
        for (const t of groundDetails) {
            t.x -= scroll * 0.55;
            if (t.x < -20) t.x += W * 2;
        }
        for (const g of grassTufts) {
            g.x -= scroll * 0.9;
            if (g.x < -20) g.x += W * 2;
        }

        // Particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.vy += 900 * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0) particles.splice(i, 1);
        }

        // Collision
        const hit = checkCollisions();
        if (hit) {
            triggerGameOver();
        }
    }

    function triggerGameOver() {
        gameOver = true;
        started = false;
        tone(120, 0.18, 'square', 0.06);
        spawnParticles(
            player.x + player.w / 2,
            player.y + player.h / 2,
            '#ff6b6b',
            26,
            460
        );
        statusEl.textContent = 'Game Over';
        statusEl.className = 'lose-message';

        overlayMessage.textContent = 'Extinction';
        overlayScore.textContent = `Score: ${score}  •  Level ${level}`;
        overlay.classList.add('show');

        pauseBtn.disabled = true;
        startBtn.innerHTML = '<i class="fas fa-redo"></i> Restart';
    }

    // ------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------
    function drawSky() {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, theme.skyTop);
        g.addColorStop(0.5, theme.skyMid);
        g.addColorStop(1, theme.skyBot);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
    }

    function drawSun() {
        const sunX = W - 130;
        const sunY = 100;
        const grad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 170);
        grad.addColorStop(0, theme.sun);
        grad.addColorStop(1, theme.sunGlow);
        ctx.fillStyle = grad;
        ctx.fillRect(sunX - 200, sunY - 200, 400, 400);
    }

    function drawStars() {
        if (!theme.star) return;
        for (const s of stars) {
            const tw = 0.5 + 0.5 * Math.sin(elapsed * 1.5 + s.tw);
            ctx.globalAlpha = 0.4 + tw * 0.6;
            ctx.fillStyle = theme.star;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    function drawMountains() {
        // Far range
        ctx.fillStyle = theme.mountainFar;
        ctx.beginPath();
        ctx.moveTo(0, GROUND_Y - 40);
        for (let x = 0; x <= W; x += 40) {
            const y = GROUND_Y - 70 - Math.sin(x * 0.011 + 1.2) * 40 - Math.cos(x * 0.023) * 22;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(W, GROUND_Y);
        ctx.lineTo(0, GROUND_Y);
        ctx.closePath();
        ctx.fill();

        // Near range
        ctx.fillStyle = theme.mountainNear;
        ctx.beginPath();
        ctx.moveTo(0, GROUND_Y - 20);
        for (let x = 0; x <= W; x += 30) {
            const y = GROUND_Y - 40 - Math.sin(x * 0.017 + 2.7) * 26 - Math.cos(x * 0.031) * 12;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(W, GROUND_Y);
        ctx.lineTo(0, GROUND_Y);
        ctx.closePath();
        ctx.fill();
    }

    function drawCloud(c) {
        ctx.globalAlpha = c.alpha;
        ctx.fillStyle = theme.cloud;
        const cx = c.x + c.w / 2;
        const cy = c.y + c.w * 0.05;
        const r = c.w * 0.22;

        ctx.beginPath();
        ctx.arc(cx - r * 1.2, cy, r * 0.85, 0, Math.PI * 2);
        ctx.arc(cx, cy - r * 0.35, r * 1.05, 0, Math.PI * 2);
        ctx.arc(cx + r * 1.1, cy, r * 0.9, 0, Math.PI * 2);
        ctx.arc(cx + r * 0.1, cy + r * 0.4, r * 0.95, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    function drawBird(b) {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.strokeStyle = theme.bird;
        ctx.lineWidth = 1.4;
        const w = b.size;
        const flap = Math.sin(b.wingPhase) * w * 0.55;

        if (b.type === 0) {
            // Simple "V"
            ctx.beginPath();
            ctx.moveTo(-w, -flap);
            ctx.lineTo(0, 0);
            ctx.lineTo(w, -flap);
            ctx.stroke();
        } else if (b.type === 1) {
            // "M" shape
            ctx.beginPath();
            ctx.moveTo(-w, 0);
            ctx.quadraticCurveTo(-w * 0.5, -flap * 1.2, 0, 0);
            ctx.quadraticCurveTo(w * 0.5, -flap * 1.2, w, 0);
            ctx.stroke();
        } else {
            // Double arc
            ctx.beginPath();
            ctx.moveTo(-w * 0.6, 0);
            ctx.quadraticCurveTo(0, -flap, w * 0.6, 0);
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawGround() {
        // Ground band
        const g = ctx.createLinearGradient(0, GROUND_Y, 0, GROUND_Y + 120);
        g.addColorStop(0, theme.groundTop);
        g.addColorStop(0.35, theme.groundMid);
        g.addColorStop(1, theme.groundBot);
        ctx.fillStyle = g;
        ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

        // Top highlight line
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, GROUND_Y + 0.5);
        ctx.lineTo(W, GROUND_Y + 0.5);
        ctx.stroke();

        // Details (pre-generated, stable)
        for (const t of groundDetails) {
            ctx.globalAlpha = t.alpha;
            ctx.fillStyle = theme.groundSpeck;
            if (t.type === 0) {
                ctx.fillRect(t.x, t.y, t.size, 1.5);
            } else if (t.type === 1) {
                ctx.beginPath();
                ctx.arc(t.x, t.y, t.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(t.x - t.size * 0.5, t.y, t.size, 1);
            }
        }
        ctx.globalAlpha = 1;

        // Grass tufts
        ctx.strokeStyle = theme.grass;
        ctx.lineWidth = 1.4;
        for (const g2 of grassTufts) {
            ctx.beginPath();
            ctx.moveTo(g2.x, GROUND_Y);
            ctx.lineTo(g2.x + g2.lean - 2, GROUND_Y - g2.h);
            ctx.moveTo(g2.x, GROUND_Y);
            ctx.lineTo(g2.x + g2.lean + 2, GROUND_Y - g2.h * 0.85);
            ctx.moveTo(g2.x, GROUND_Y);
            ctx.lineTo(g2.x + g2.lean, GROUND_Y - g2.h * 1.05);
            ctx.stroke();
        }
    }

    function drawSpike(o) {
        ctx.save();
        ctx.fillStyle = '#2b6b3b';
        ctx.beginPath();
        ctx.moveTo(o.x, o.y + o.h);
        ctx.lineTo(o.x + o.w * 0.5, o.y);
        ctx.lineTo(o.x + o.w, o.y + o.h);
        ctx.closePath();
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(120,200,120,0.35)';
        ctx.beginPath();
        ctx.moveTo(o.x + o.w * 0.5, o.y);
        ctx.lineTo(o.x + o.w * 0.5, o.y + o.h * 0.75);
        ctx.lineTo(o.x + o.w * 0.72, o.y + o.h);
        ctx.lineTo(o.x + o.w * 0.5, o.y + o.h);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    function drawBarrel(o) {
        ctx.save();
        ctx.fillStyle = '#7f4b20';
        roundRect(o.x, o.y, o.w, o.h, 8);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        ctx.fillRect(o.x + 6, o.y + 5, o.w - 12, 4);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(o.x + 6, o.y + o.h - 8, o.w - 12, 3);

        // Bands
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(o.x + 3, o.y + o.h * 0.3);
        ctx.lineTo(o.x + o.w - 3, o.y + o.h * 0.3);
        ctx.moveTo(o.x + 3, o.y + o.h * 0.7);
        ctx.lineTo(o.x + o.w - 3, o.y + o.h * 0.7);
        ctx.stroke();
        ctx.restore();
    }

    function drawDrone(o) {
        ctx.save();
        // Body
        ctx.fillStyle = '#263238';
        roundRect(o.x, o.y, o.w, o.h, 8);
        ctx.fill();

        // Cockpit / eye
        ctx.fillStyle = 'rgba(124,200,255,0.98)';
        ctx.beginPath();
        ctx.ellipse(o.x + o.w * 0.5, o.y + o.h * 0.5, o.w * 0.24, o.h * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();

        // Rotor housings
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.arc(o.x + 8, o.y + 6, 5, 0, Math.PI * 2);
        ctx.arc(o.x + o.w - 8, o.y + 6, 5, 0, Math.PI * 2);
        ctx.fill();

        // Blinking LED
        const blink = 0.5 + 0.5 * Math.sin(elapsed * 8);
        ctx.fillStyle = `rgba(255,80,80,${0.5 + blink * 0.5})`;
        ctx.beginPath();
        ctx.arc(o.x + o.w * 0.5, o.y + o.h - 5, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    function drawRaptor() {
        const crouch = player.crouching;
        const x = player.x;
        const y = player.y;
        const w = player.w;
        const h = player.h;

        ctx.save();
        ctx.translate(x + w / 2, y + h);

        // Scale to a canonical design space around a standing raptor
        const sx = crouch ? 1.15 : 1;
        const sy = crouch ? 0.72 : 1;
        ctx.scale(sx, sy);

        const bodyColor = theme.dino;
        const eyeColor = theme.dinoEye;

        // Tail
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.moveTo(-w * 0.35, -h * 0.55);
        ctx.lineTo(-w * 0.85, -h * 0.35);
        ctx.lineTo(-w * 0.75, -h * 0.15);
        ctx.lineTo(-w * 0.30, -h * 0.30);
        ctx.closePath();
        ctx.fill();

        // Body (rounded capsule)
        roundRect(-w * 0.4, -h * 0.9, w * 0.78, h * 0.68, 8);
        ctx.fill();

        // Neck
        ctx.beginPath();
        ctx.moveTo(w * 0.10, -h * 0.75);
        ctx.lineTo(w * 0.32, -h * 1.05);
        ctx.lineTo(w * 0.42, -h * 0.82);
        ctx.lineTo(w * 0.20, -h * 0.55);
        ctx.closePath();
        ctx.fill();

        // Head
        roundRect(w * 0.20, -h * 1.14, w * 0.42, h * 0.30, 6);
        ctx.fill();

        // Snout
        ctx.beginPath();
        ctx.moveTo(w * 0.55, -h * 1.10);
        ctx.lineTo(w * 0.72, -h * 1.02);
        ctx.lineTo(w * 0.72, -h * 0.94);
        ctx.lineTo(w * 0.55, -h * 0.88);
        ctx.closePath();
        ctx.fill();

        // Eye
        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.arc(w * 0.50, -h * 1.00, 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.9)';
        ctx.beginPath();
        ctx.arc(w * 0.505, -h * 0.998, 1.1, 0, Math.PI * 2);
        ctx.fill();

        // Legs (animated when grounded)
        ctx.fillStyle = bodyColor;
        const phase = player.onGround && !crouch ? player.runFrame : 0;
        const stride = 4;
        const backLegY = phase === 0 ? 0 : stride;
        const frontLegY = phase === 0 ? stride : 0;

        // Back leg
        ctx.fillRect(-w * 0.20, -h * 0.28 + backLegY, 7, h * 0.30 - backLegY);
        // Back foot
        ctx.fillRect(-w * 0.24, -h * 0.02, 12, 4);

        // Front leg
        ctx.fillRect(w * 0.02, -h * 0.28 + frontLegY, 7, h * 0.30 - frontLegY);
        ctx.fillRect(w * 0.00, -h * 0.02, 12, 4);

        // Small arm
        ctx.fillRect(w * 0.22, -h * 0.52, 8, 4);

        ctx.restore();
    }

    function drawParticles() {
        for (const p of particles) {
            const a = Math.max(0, p.life / p.maxLife);
            ctx.globalAlpha = a;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        ctx.globalAlpha = 1;
    }

    function drawPausedOverlay() {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 44px system-ui, -apple-system, "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PAUSED', W / 2, H / 2);
        ctx.font = '16px system-ui, -apple-system, "Segoe UI", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.fillText('Press P or Esc to resume', W / 2, H / 2 + 40);
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
    }

    function render() {
        drawSky();
        if (theme.star) drawStars();
        drawSun();
        drawMountains();
        for (const c of clouds) drawCloud(c);
        for (const b of birds) drawBird(b);
        drawGround();

        for (const o of obstacles) {
            if (o.type === 'spike') drawSpike(o);
            else if (o.type === 'barrel') drawBarrel(o);
            else if (o.type === 'drone') drawDrone(o);
        }

        drawRaptor();
        drawParticles();

        if (paused) drawPausedOverlay();
    }

    // ------------------------------------------------------------------
    // Main loop
    // ------------------------------------------------------------------
    function frame(now) {
        const dt = Math.min((now - lastTime) / 1000, 0.033);
        lastTime = now;

        update(dt);
        render();

        requestAnimationFrame(frame);
    }

    // ------------------------------------------------------------------
    // Lifecycle
    // ------------------------------------------------------------------
    function resetWorld() {
        rng = makeRng(Date.now());

        // Reset player
        player.x = 140;
        player.y = GROUND_Y - 60;
        player.vy = 0;
        player.w = 52;
        player.h = 60;
        player.onGround = true;
        player.jumping = false;
        player.crouching = false;
        player.canBoost = false;
        player.runFrame = 0;
        player.runTimer = 0;

        // Reset world
        obstacles = [];
        particles = [];
        birds = [];
        clouds = [];
        for (let i = 0; i < 8; i++) clouds.push(makeCloud());

        rebuildGroundDecor();
        rebuildStars();

        distance = 0;
        elapsed = 0;
        level = 1;
        score = 0;
        speed = cfg.startSpeed;
        distSinceSpawn = 0;
        nextSpawnDist = 420; // give the player a moment

        scoreEl.textContent = '0';
        levelEl.textContent = '1';
    }

    function startGame() {
        cfg = DIFFICULTY[difficultySelect.value] || DIFFICULTY.normal;
        theme = THEMES[themeSelect.value] || THEMES.day;

        overlay.classList.remove('show');
        statusEl.className = '';
        statusEl.textContent = 'Running';

        resetWorld();

        started = true;
        paused = false;
        gameOver = false;

        pauseBtn.disabled = false;
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        startBtn.innerHTML = '<i class="fas fa-redo"></i> Restart';

        ensureAudio();
    }

    function togglePause() {
        if (!started || gameOver) return;
        paused = !paused;
        if (paused) {
            statusEl.textContent = 'Paused';
            pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
        } else {
            statusEl.textContent = 'Running';
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        }
    }

    function applyTheme() {
        theme = THEMES[themeSelect.value] || THEMES.day;
    }

    function updateControlsHint() {
        controlsHint.textContent =
            'Jump: Space / ↑ / Click  •  Crouch: ↓ / S  •  Boost: Double-Jump  •  Pause: P / Esc';
    }

    // ------------------------------------------------------------------
    // Input
    // ------------------------------------------------------------------
    document.addEventListener('keydown', (e) => {
        const k = e.key.toLowerCase();
        if (k === ' ' || k === 'arrowup' || k === 'w') {
            e.preventDefault();
            jump();
        } else if (k === 'arrowdown' || k === 's') {
            e.preventDefault();
            crouchStart();
        } else if (k === 'p' || k === 'escape') {
            e.preventDefault();
            togglePause();
        }
    });

    document.addEventListener('keyup', (e) => {
        const k = e.key.toLowerCase();
        if (k === 'arrowdown' || k === 's') {
            e.preventDefault();
            crouchEnd();
        }
    });

    // Touch / mouse on the canvas - tap upper half to jump, lower half to crouch briefly
    canvas.addEventListener('pointerdown', (e) => {
        if (!started || paused || gameOver) return;
        const rect = canvas.getBoundingClientRect();
        const relY = (e.clientY - rect.top) / rect.height;
        if (relY > 0.65) {
            crouchStart();
        } else {
            jump();
        }
    });

    canvas.addEventListener('pointerup', () => {
        crouchEnd();
    });

    canvas.addEventListener('pointercancel', () => {
        crouchEnd();
    });

    // ------------------------------------------------------------------
    // Bindings
    // ------------------------------------------------------------------
    startBtn.addEventListener('click', startGame);
    playAgainBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', togglePause);

    difficultySelect.addEventListener('change', () => {
        cfg = DIFFICULTY[difficultySelect.value] || DIFFICULTY.normal;
        // Restart so the new tuning takes effect cleanly
        if (started || gameOver) startGame();
    });

    themeSelect.addEventListener('change', () => {
        applyTheme();
    });

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) lastTime = performance.now();
    });

    window.addEventListener('resize', () => {
        // Recalculate DPR - keeps things crisp after moving between monitors
        setupCanvas();
    });

    // ------------------------------------------------------------------
    // Boot
    // ------------------------------------------------------------------
    setupCanvas();
    updateControlsHint();

    cfg = DIFFICULTY[difficultySelect.value] || DIFFICULTY.normal;
    theme = THEMES[themeSelect.value] || THEMES.day;

    resetWorld();
    render();

    lastTime = performance.now();
    requestAnimationFrame(frame);
})();