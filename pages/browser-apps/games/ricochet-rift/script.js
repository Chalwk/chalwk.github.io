// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');

const score1El = document.getElementById('score-1');
const score2El = document.getElementById('score-2');
const badge1El = document.getElementById('badge-1');
const badge2El = document.getElementById('badge-2');
const statusEl = document.getElementById('status');
const rallyEl = document.getElementById('rally');
const resetBtn = document.getElementById('reset');
const playAgainBtn = document.getElementById('play-again');
const difficultySelect = document.getElementById('difficulty');
const difficultyLabel = document.getElementById('difficulty-label');
const targetScoreSelect = document.getElementById('target-score');
const powerupsSelect = document.getElementById('powerups');
const controlsHint = document.getElementById('controls-hint');
const overlay = document.getElementById('game-over-overlay');
const overlayMessage = document.getElementById('game-over-message');
const overlayScore = document.getElementById('game-over-score');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const W = 960;
const H = 600;
const WALL_THICK = 6;
const PADDLE_W = 16;
const PADDLE_H = 110;
const PADDLE_MARGIN = 40;
const BALL_R = 11;
const BASE_SPEED = 340;
const SPEED_MULT = 1.035;
const MAX_SPEED = 820;
const MAX_BOUNCE = Math.PI * 0.38;
const PADDLE_SPEED = 620;

const AI_PRESETS = {
    rookie: { speed: 300, error: 90 },
    veteran: { speed: 480, error: 40 },
    master: { speed: 680, error: 10 },
};

const POWERUPS = {
    wide: { color: '#4ade80', short: 'W' },
    multi: { color: '#fbbf24', short: 'M' },
    shield: { color: '#a78bfa', short: 'S' },
    slow: { color: '#60a5fa', short: 'L' },
    spike: { color: '#f97316', short: 'X' },
};
const POWERUP_KEYS = Object.keys(POWERUPS);

// ---------------------------------------------------------------------------
// Global UI state
// ---------------------------------------------------------------------------
let difficulty = 'veteran';
let targetScore = 7;
let powerupsOn = true;

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------
let state = null;
let lastTime = 0;
const keys = Object.create(null);

let dragging = false;
let dragY = 0;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function setupCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function speedOf(ball) {
    return Math.hypot(ball.vx, ball.vy);
}

function setSpeed(ball, sp) {
    const cur = speedOf(ball);
    if (cur === 0) return;
    const f = sp / cur;
    ball.vx *= f;
    ball.vy *= f;
}

// ---------------------------------------------------------------------------
// State creation
// ---------------------------------------------------------------------------
function createBall(dir) {
    const angle = (Math.random() - 0.5) * 0.7;
    return {
        x: W / 2,
        y: H / 2,
        vx: Math.cos(angle) * BASE_SPEED * dir,
        vy: Math.sin(angle) * BASE_SPEED,
        r: BALL_R,
        trail: [],
        spiked: false,
        owner: 0,
        serveDir: 0,
    };
}

function createPaddle(side) {
    return {
        x: side === 1 ? PADDLE_MARGIN : W - PADDLE_MARGIN - PADDLE_W,
        y: H / 2 - PADDLE_H / 2,
        w: PADDLE_W,
        h: PADDLE_H,
        baseH: PADDLE_H,
        vy: 0,
        side,
        shield: 0,
        wideTimer: 0,
    };
}

function createState() {
    return {
        paddles: { 1: createPaddle(1), 2: createPaddle(2) },
        balls: [createBall(1)],
        scores: { 1: 0, 2: 0 },
        rally: 0,
        particles: [],
        powerups: [],
        spawnTimer: 2.5 + Math.random() * 2,
        shake: 0,
        serveTimer: 1.5,
        gameOver: false,
    };
}

// ---------------------------------------------------------------------------
// Particles
// ---------------------------------------------------------------------------
function spawnHitParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 80 + Math.random() * 220;
        state.particles.push({
            x, y,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            life: 0.4 + Math.random() * 0.3,
            maxLife: 0.7,
            color,
        });
    }
}

function spawnWallParticles(x, y) {
    for (let i = 0; i < 6; i++) {
        const a = (Math.random() - 0.5) * Math.PI * 0.8;
        const sp = 60 + Math.random() * 140;
        state.particles.push({
            x, y,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            life: 0.3 + Math.random() * 0.2,
            maxLife: 0.5,
            color: 'rgba(255,255,255,0.85)',
        });
    }
}

function spawnPickupParticles(x, y, color) {
    for (let i = 0; i < 22; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 100 + Math.random() * 320;
        state.particles.push({
            x, y,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            life: 0.5 + Math.random() * 0.4,
            maxLife: 0.9,
            color,
        });
    }
}

function spawnScoreParticles(scoringPlayer) {
    const x = scoringPlayer === 1 ? W - 40 : 40;
    for (let i = 0; i < 42; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 150 + Math.random() * 420;
        state.particles.push({
            x, y: H / 2,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            life: 0.8 + Math.random() * 0.5,
            maxLife: 1.3,
            color: scoringPlayer === 1 ? '#ef4444' : '#4ade80',
        });
    }
}

function spawnShieldParticles(x, y) {
    for (let i = 0; i < 30; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 120 + Math.random() * 260;
        state.particles.push({
            x, y,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            life: 0.6 + Math.random() * 0.4,
            maxLife: 1.0,
            color: '#a78bfa',
        });
    }
}

// ---------------------------------------------------------------------------
// Power-ups
// ---------------------------------------------------------------------------
function spawnPowerup() {
    if (state.powerups.length >= 3) return;
    const key = POWERUP_KEYS[Math.floor(Math.random() * POWERUP_KEYS.length)];
    const x = W * 0.22 + Math.random() * W * 0.56;
    const y = 90 + Math.random() * (H - 180);
    state.powerups.push({
        x, y, r: 22, key,
        color: POWERUPS[key].color,
        short: POWERUPS[key].short,
        spawnT: 0,
    });
}

function applyPowerup(key, owner, sourceBall) {
    const paddle = state.paddles[owner];
    switch (key) {
        case 'wide':
            if (paddle.wideTimer <= 0) {
                paddle.y = clamp(paddle.y - (paddle.baseH * 0.6) / 2, 0, H - paddle.h);
            }
            paddle.wideTimer = 8;
            paddle.h = paddle.baseH * 1.6;
            paddle.y = clamp(paddle.y - (paddle.h - paddle.baseH) / 2, 0, H - paddle.h);
            break;
        case 'multi': {
            if (state.balls.length < 4) {
                const sp = speedOf(sourceBall);
                const baseAngle = Math.atan2(sourceBall.vy, sourceBall.vx);
                for (let i = 0; i < 2; i++) {
                    const offset = i === 0 ? -0.5 : 0.5;
                    const a = baseAngle + offset;
                    state.balls.push({
                        x: sourceBall.x, y: sourceBall.y,
                        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
                        r: BALL_R, trail: [], spiked: sourceBall.spiked,
                        owner, serveDir: 0,
                    });
                }
            }
            break;
        }
        case 'shield':
            paddle.shield = Math.min(paddle.shield + 1, 2);
            break;
        case 'slow':
            state.balls.forEach(b => {
                if (speedOf(b) > 0) setSpeed(b, Math.max(speedOf(b) * 0.55, BASE_SPEED * 0.7));
            });
            break;
        case 'spike':
            sourceBall.spiked = true;
            setSpeed(sourceBall, Math.min(speedOf(sourceBall) * 1.55, MAX_SPEED + 180));
            break;
    }
    updateBadges();
}

// ---------------------------------------------------------------------------
// Physics
// ---------------------------------------------------------------------------
function handleWallBounce(ball) {
    const top = WALL_THICK + ball.r;
    const bottom = H - WALL_THICK - ball.r;
    if (ball.y - ball.r < WALL_THICK && ball.vy < 0) {
        ball.y = top;
        ball.vy = Math.abs(ball.vy);
        spawnWallParticles(ball.x, WALL_THICK);
    } else if (ball.y + ball.r > H - WALL_THICK && ball.vy > 0) {
        ball.y = bottom;
        ball.vy = -Math.abs(ball.vy);
        spawnWallParticles(ball.x, H - WALL_THICK);
    }
}

function handlePaddleCollision(ball, paddle) {
    if (paddle.side === 1 && ball.vx > 0) return false;
    if (paddle.side === 2 && ball.vx < 0) return false;

    const padL = paddle.x;
    const padR = paddle.x + paddle.w;
    const padT = paddle.y;
    const padB = paddle.y + paddle.h;

    if (ball.x + ball.r < padL || ball.x - ball.r > padR) return false;
    if (ball.y + ball.r < padT || ball.y - ball.r > padB) return false;

    const rel = clamp((ball.y - (paddle.y + paddle.h / 2)) / (paddle.h / 2), -1, 1);
    const angle = rel * MAX_BOUNCE;

    const cur = speedOf(ball);
    let newSp = Math.min(cur * SPEED_MULT, MAX_SPEED);
    if (ball.spiked) newSp = Math.min(newSp * 1.02, MAX_SPEED + 180);

    const dir = paddle.side === 1 ? 1 : -1;
    ball.vx = Math.cos(angle) * newSp * dir;
    ball.vy = Math.sin(angle) * newSp;
    ball.vy += paddle.vy * 0.32;

    const finalSp = Math.hypot(ball.vx, ball.vy);
    if (finalSp > 0) {
        const k = newSp / finalSp;
        ball.vx *= k;
        ball.vy *= k;
    }

    if (paddle.side === 1) ball.x = padR + ball.r + 1;
    else ball.x = padL - ball.r - 1;

    ball.owner = paddle.side;
    state.rally++;
    spawnHitParticles(ball.x, ball.y, paddle.side === 1 ? '#ef4444' : '#4ade80');
    state.shake = Math.min(state.shake + 4, 10);
    return true;
}

// ---------------------------------------------------------------------------
// Serve / goals
// ---------------------------------------------------------------------------
function beginServe(towardPlayer) {
    const d = towardPlayer === 1 ? -1 : 1;
    const ball = createBall(d);
    ball.vx = 0;
    ball.vy = 0;
    ball.serveDir = d;
    state.balls = [ball];
    state.serveTimer = 1.0;
    state.powerups = [];
}

function handleGoal(scoringPlayer) {
    const defendingPlayer = scoringPlayer === 1 ? 2 : 1;
    const defPaddle = state.paddles[defendingPlayer];

    if (defPaddle.shield > 0) {
        defPaddle.shield--;
        spawnShieldParticles(
            defendingPlayer === 1 ? PADDLE_MARGIN + 20 : W - PADDLE_MARGIN - 20,
            H / 2
        );
        state.shake = 10;
        state.rally = 0;
        updateBadges();
        beginServe(defendingPlayer);
        return;
    }

    state.scores[scoringPlayer]++;
    state.rally = 0;
    spawnScoreParticles(scoringPlayer);
    state.shake = 14;
    updateScoreUI();
    updateBadges();

    if (state.scores[scoringPlayer] >= targetScore) {
        endGame(scoringPlayer);
        return;
    }

    beginServe(defendingPlayer);
}

function endGame(winner) {
    state.gameOver = true;
    const name = winner === 1 ? 'Player 1' : 'AI';
    overlayMessage.textContent = `${name} Wins!`;
    overlayScore.textContent = `${state.scores[1]} — ${state.scores[2]}`;
    overlay.classList.add('show');
    statusEl.textContent = `${name} Wins!`;
    statusEl.className = 'win-message';
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
function handlePaddleInput(dt) {
    const p1 = state.paddles[1];
    const p2 = state.paddles[2];

    if (dragging) {
        const oldY = p1.y;
        const targetY = clamp(dragY, 0, H - p1.h);
        const maxMove = PADDLE_SPEED * 1.8 * dt;
        p1.y += clamp(targetY - p1.y, -maxMove, maxMove);
        p1.vy = dt > 0 ? (p1.y - oldY) / dt : 0;
    } else {
        let p1Dir = 0;
        if (keys['w'] || keys['W']) p1Dir -= 1;
        if (keys['s'] || keys['S']) p1Dir += 1;
        if (keys['ArrowUp']) p1Dir -= 1;
        if (keys['ArrowDown']) p1Dir += 1;
        p1.vy = p1Dir * PADDLE_SPEED;
        p1.y = clamp(p1.y + p1.vy * dt, 0, H - p1.h);
    }

    // AI control is handled in updateAI
}

function updateAI(dt) {
    const p2 = state.paddles[2];
    const preset = AI_PRESETS[difficulty];

    const incoming = state.balls.filter(b => b.vx > 0 && b.x < p2.x);
    let targetY = H / 2;

    if (incoming.length > 0) {
        const soonest = incoming.reduce((a, b) => {
            const ta = (p2.x - a.x) / a.vx;
            const tb = (p2.x - b.x) / b.vx;
            return ta < tb ? a : b;
        });
        const dx = p2.x - soonest.x;
        const t = dx / soonest.vx;
        let y = soonest.y + soonest.vy * t;

        const minY = WALL_THICK + soonest.r;
        const maxY = H - WALL_THICK - soonest.r;
        const range = maxY - minY;
        let yy = y - minY;
        yy = ((yy % (2 * range)) + 2 * range) % (2 * range);
        if (yy > range) yy = 2 * range - yy;
        y = yy + minY;
        targetY = y;
    }

    targetY += (Math.random() - 0.5) * preset.error;

    const center = p2.y + p2.h / 2;
    const diff = targetY - center;
    const maxMove = preset.speed * dt;
    const move = clamp(diff, -maxMove, maxMove);
    const oldY = p2.y;
    p2.y = clamp(p2.y + move, 0, H - p2.h);
    p2.vy = dt > 0 ? (p2.y - oldY) / dt : 0;
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------
function update(dt) {
    if (state.gameOver) return;

    // Serve countdown
    if (state.serveTimer > 0) {
        state.serveTimer -= dt;
        if (state.serveTimer <= 0) {
            for (const ball of state.balls) {
                if (ball.serveDir) {
                    const angle = (Math.random() - 0.5) * 0.6;
                    ball.vx = Math.cos(angle) * BASE_SPEED * ball.serveDir;
                    ball.vy = Math.sin(angle) * BASE_SPEED;
                    ball.owner = ball.serveDir > 0 ? 1 : 2;
                    ball.serveDir = 0;
                }
            }
        }
    }

    handlePaddleInput(dt);
    updateAI(dt);

    // Spawn powerups
    if (powerupsOn) {
        state.spawnTimer -= dt;
        if (state.spawnTimer <= 0) {
            spawnPowerup();
            state.spawnTimer = 3 + Math.random() * 3;
        }
    }

    // Ball physics
    for (let i = 0; i < state.balls.length; i++) {
        const ball = state.balls[i];

        if (ball.vx === 0 && ball.vy === 0) continue;

        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;

        ball.trail.push({ x: ball.x, y: ball.y });
        if (ball.trail.length > 12) ball.trail.shift();

        handleWallBounce(ball);
        handlePaddleCollision(ball, state.paddles[1]);
        handlePaddleCollision(ball, state.paddles[2]);

        if (ball.x + ball.r < 0) {
            state.balls.splice(i, 1);
            handleGoal(2);
            return;
        } else if (ball.x - ball.r > W) {
            state.balls.splice(i, 1);
            handleGoal(1);
            return;
        }
    }

    // Power-up collection
    for (let i = state.powerups.length - 1; i >= 0; i--) {
        const pu = state.powerups[i];
        pu.spawnT += dt;
        let collected = false;
        for (const ball of state.balls) {
            const dx = ball.x - pu.x;
            const dy = ball.y - pu.y;
            if (Math.hypot(dx, dy) < pu.r + ball.r) {
                let owner = ball.owner;
                if (!owner) owner = ball.vx > 0 ? 1 : 2;
                applyPowerup(pu.key, owner, ball);
                spawnPickupParticles(pu.x, pu.y, pu.color);
                collected = true;
                break;
            }
        }
        if (collected) state.powerups.splice(i, 1);
    }

    // Wide timer
    let badgesDirty = false;
    for (const side of [1, 2]) {
        const p = state.paddles[side];
        if (p.wideTimer > 0) {
            p.wideTimer -= dt;
            if (p.wideTimer <= 0) {
                const cy = p.y + p.h / 2;
                p.h = p.baseH;
                p.y = clamp(cy - p.h / 2, 0, H - p.h);
                p.wideTimer = 0;
                badgesDirty = true;
            }
        }
    }
    if (badgesDirty) updateBadges();

    // Particles
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 200 * dt;
        p.life -= dt;
        if (p.life <= 0) state.particles.splice(i, 1);
    }

    // Screen shake decay
    if (state.shake > 0) state.shake = Math.max(0, state.shake - 30 * dt);

    // Rally display
    if (rallyEl) rallyEl.textContent = `Rally ${state.rally}`;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function roundRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function drawPaddle(paddle, color) {
    ctx.save();
    ctx.shadowBlur = 22;
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    roundRect(paddle.x, paddle.y, paddle.w, paddle.h, paddle.w / 2);
    ctx.fill();
    ctx.restore();

    if (paddle.shield > 0) {
        ctx.save();
        ctx.strokeStyle = '#a78bfa';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 14;
        ctx.shadowColor = '#a78bfa';
        const cx = paddle.x + paddle.w / 2;
        const cy = paddle.y + paddle.h / 2;
        const rr = paddle.h / 2 + 12;
        const startA = paddle.side === 1 ? -Math.PI / 2 : Math.PI / 2;
        const endA = paddle.side === 1 ? Math.PI / 2 : Math.PI * 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, rr, startA, endA);
        ctx.stroke();
        ctx.restore();
    }
}

function drawBall(ball) {
    ctx.save();
    ctx.shadowBlur = 26;
    ctx.shadowColor = ball.spiked ? '#f97316' : '#ffffff';
    ctx.fillStyle = ball.spiked ? '#fb923c' : '#ffffff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawBallTrail(ball) {
    const n = ball.trail.length;
    for (let i = 0; i < n; i++) {
        const t = ball.trail[i];
        const a = (i / n) * 0.45;
        ctx.fillStyle = ball.spiked
            ? `rgba(251, 146, 60, ${a})`
            : `rgba(255, 255, 255, ${a})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, ball.r * (i / n) * 0.9, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawPowerup(pu) {
    ctx.save();
    const pulse = 1 + Math.sin(pu.spawnT * 6) * 0.08;
    const r = pu.r * pulse;

    ctx.shadowBlur = 22;
    ctx.shadowColor = pu.color;

    ctx.strokeStyle = pu.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(pu.x, pu.y, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = pu.color + '22';
    ctx.beginPath();
    ctx.arc(pu.x, pu.y, r - 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = pu.color;
    ctx.font = 'bold 20px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pu.short, pu.x, pu.y + 1);
    ctx.restore();
}

function render() {
    ctx.save();

    if (state.shake > 0) {
        const sx = (Math.random() - 0.5) * state.shake;
        const sy = (Math.random() - 0.5) * state.shake;
        ctx.translate(sx, sy);
    }

    // Background
    const bg = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, Math.max(W, H));
    bg.addColorStop(0, '#0f1420');
    bg.addColorStop(1, '#050810');
    ctx.fillStyle = bg;
    ctx.fillRect(-30, -30, W + 60, H + 60);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.028)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
    }
    for (let y = 0; y < H; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
    }

    // Center line
    ctx.setLineDash([12, 14]);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W / 2, WALL_THICK);
    ctx.lineTo(W / 2, H - WALL_THICK);
    ctx.stroke();
    ctx.setLineDash([]);

    // Center circle
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 90, 0, Math.PI * 2);
    ctx.stroke();

    // Top / bottom walls
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(0, 0, W, WALL_THICK);
    ctx.fillRect(0, H - WALL_THICK, W, WALL_THICK);

    // Power-ups
    for (const pu of state.powerups) drawPowerup(pu);

    // Paddles
    drawPaddle(state.paddles[1], '#ef4444');
    drawPaddle(state.paddles[2], '#4ade80');

    // Ball trails + balls (hidden during the serve countdown so the
    // number stays readable)
    const serving = state.serveTimer > 0 && !state.gameOver;
    if (!serving) {
        for (const ball of state.balls) drawBallTrail(ball);
        for (const ball of state.balls) drawBall(ball);
    }

    // Particles
    for (const p of state.particles) {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;

    // Serve countdown
    if (state.serveTimer > 0 && !state.gameOver) {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = 'bold 64px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const sec = Math.ceil(state.serveTimer);
        ctx.fillText(sec, W / 2, H / 2);
    }

    ctx.restore();
}

// ---------------------------------------------------------------------------
// Game loop
// ---------------------------------------------------------------------------
function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    update(dt);
    render();

    requestAnimationFrame(loop);
}

// ---------------------------------------------------------------------------
// UI updates
// ---------------------------------------------------------------------------
function updateScoreUI() {
    score1El.textContent = state.scores[1];
    score2El.textContent = state.scores[2];
}

function updateBadges() {
    const p1 = state.paddles[1];
    const p2 = state.paddles[2];
    const parts = (p) => {
        const out = [];
        if (p.shield > 0) out.push('🛡'.repeat(p.shield));
        if (p.wideTimer > 0) out.push('↔');
        return out.join(' ');
    };
    badge1El.textContent = parts(p1);
    badge2El.textContent = parts(p2);
}

function updateControlsHint() {
    controlsHint.textContent = 'Move: W / S or ↑ / ↓  •  Or drag on the left half of the board';
}

function updateStatus() {
    if (state.gameOver) return;
    statusEl.className = '';
    statusEl.textContent = `First to ${targetScore}`;
    if (rallyEl) rallyEl.textContent = `Rally 0`;
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
function resetGame() {
    state = createState();
    state.scores = { 1: 0, 2: 0 };
    state.gameOver = false;

    const initialToward = Math.random() < 0.5 ? 1 : 2;
    beginServe(initialToward);
    state.serveTimer = 3;

    overlay.classList.remove('show');
    statusEl.className = '';

    updateScoreUI();
    updateBadges();
    updateStatus();
    updateControlsHint();

    lastTime = performance.now();
}

// ---------------------------------------------------------------------------
// Event bindings
// ---------------------------------------------------------------------------
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

canvas.addEventListener('pointerdown', (e) => {
    if (state.gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * W;
    const y = (e.clientY - rect.top) / rect.height * H;
    if (x < W / 2) {
        dragging = true;
        dragY = y - state.paddles[1].h / 2;
        state.paddles[1].y = clamp(dragY, 0, H - state.paddles[1].h);
        state.paddles[1].vy = 0;
        try { canvas.setPointerCapture(e.pointerId); } catch (_) { }
        e.preventDefault();
    }
});

canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const y = (e.clientY - rect.top) / rect.height * H;
    dragY = y - state.paddles[1].h / 2;
});

canvas.addEventListener('pointerup', (e) => {
    if (dragging) {
        dragging = false;
        try { canvas.releasePointerCapture(e.pointerId); } catch (_) { }
    }
});

canvas.addEventListener('pointercancel', () => {
    dragging = false;
});

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) lastTime = performance.now();
});

resetBtn.addEventListener('click', resetGame);
playAgainBtn.addEventListener('click', resetGame);

difficultySelect.addEventListener('change', () => {
    difficulty = difficultySelect.value;
});

targetScoreSelect.addEventListener('change', () => {
    targetScore = parseInt(targetScoreSelect.value, 10);
    resetGame();
});

powerupsSelect.addEventListener('change', () => {
    powerupsOn = powerupsSelect.value === 'on';
    if (!powerupsOn) state.powerups = [];
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
setupCanvas();
difficulty = difficultySelect.value;
targetScore = parseInt(targetScoreSelect.value, 10);
powerupsOn = powerupsSelect.value === 'on';
resetGame();

requestAnimationFrame((t) => {
    lastTime = t;
    requestAnimationFrame(loop);
});