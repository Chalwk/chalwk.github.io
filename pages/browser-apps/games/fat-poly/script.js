// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const statusEl = document.getElementById('status');
const progressEl = document.getElementById('progress');
const healthFillEl = document.getElementById('health-fill');
const resetBtn = document.getElementById('reset');
const playAgainBtn = document.getElementById('play-again');
const difficultySelect = document.getElementById('difficulty');
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

const MAX_LEVEL = 10;
const START_TARGET = 8;
const TARGET_STEP = 3;

const HEALTH_MAX = 100;

// Player sizing - deliberately smaller than before.
const PLAYER_R = 14;        // starting radius (was 22)
const PLAYER_MAX_R = 42;    // hard cap (was 62 - the "too big to play" zone)
const PLAYER_ACCEL = 3200;
const PLAYER_SPEED = 380;
const PLAYER_DRAG = 0.05;

const HIT_INVULN = 1.0;
const HIT_RADIUS_SCALE = 0.9;

const PLAYER_COLOR = '#22d3ee';
const HEALTHY_COLOR = '#4ade80';
const UNHEALTHY_COLOR = '#ef4444';

const DIFFICULTY = {
    easy: { speed: 60, spawn: 1.30, damage: 10, cap: 12, powerupRate: 6.5 },
    normal: { speed: 95, spawn: 1.00, damage: 16, cap: 16, powerupRate: 9.0 },
    hard: { speed: 140, spawn: 0.75, damage: 24, cap: 20, powerupRate: 12.0 },
};

const HEALTHY_TYPES = [
    'circle', 'triangle', 'pentagon', 'hexagon',
    'star', 'octagon', 'spiral',
];

const UNHEALTHY_TYPES = [
    'square', 'rectangle', 'diamond', 'trapezoid',
    'arrow', 'heptagon', 'gear',
];

const POWERUPS = {
    clean: { color: '#f97316', short: 'C', label: 'Clean' },
    slow: { color: '#60a5fa', short: 'S', label: 'Slow' },
    heal: { color: '#4ade80', short: 'H', label: 'Heal' },
    magnet: { color: '#fbbf24', short: 'M', label: 'Magnet' },
    shrink: { color: '#a78bfa', short: 'X', label: 'Shrink' },
};

// Weighted pool - Shrink is far more likely so a run doesn't snowball into
// an unplayable blob. Total is irrelevant; only ratios matter.
const POWERUP_WEIGHTS = {
    clean: 14,
    slow: 14,
    heal: 16,
    magnet: 14,
    shrink: 42,   // <-- dominates the pool
};
const POWERUP_TOTAL_WEIGHT = Object.values(POWERUP_WEIGHTS)
    .reduce((a, b) => a + b, 0);

function pickWeightedPowerup() {
    let roll = Math.random() * POWERUP_TOTAL_WEIGHT;
    for (const key of Object.keys(POWERUP_WEIGHTS)) {
        roll -= POWERUP_WEIGHTS[key];
        if (roll <= 0) return key;
    }
    return 'shrink';
}

// ---------------------------------------------------------------------------
// Globals
// ---------------------------------------------------------------------------
let difficulty = 'normal';
let powerupsOn = true;
let state = null;
let lastTime = 0;
const keys = Object.create(null);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const irand = (a, b) => Math.floor(rand(a, b + 1));

// Shortest delta between two positions on a wrapping axis.
// Used so collisions and magnet pulls still work across the wrap seam.
function wrappedDelta(a, b, size) {
    let d = a - b;
    if (d > size / 2) d -= size;
    else if (d < -size / 2) d += size;
    return d;
}

function setupCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
function createState() {
    const cfg = DIFFICULTY[difficulty];
    return {
        cfg,
        player: {
            x: W / 2, y: H / 2,
            vx: 0, vy: 0,
            r: PLAYER_R,
            invuln: 1.5,
            hitFlash: 0,
        },
        shapes: [],
        powerups: [],
        particles: [],
        score: 0,
        level: 1,
        health: HEALTH_MAX,
        eaten: 0,
        target: START_TARGET,
        spawnTimer: 0.4,
        powerupTimer: cfg.powerupRate * 0.6,
        slowTimer: 0,
        magnetTimer: 0,
        shake: 0,
        time: 0,
        gameOver: false,
    };
}

function seedInitialShapes() {
    for (let i = 0; i < 6; i++) spawnShape();
}

// ---------------------------------------------------------------------------
// Spawning
// ---------------------------------------------------------------------------
function spawnShape() {
    const cfg = state.cfg;

    const isHealthy = Math.random() < 0.62;
    const pool = isHealthy ? HEALTHY_TYPES : UNHEALTHY_TYPES;
    const type = pool[irand(0, pool.length - 1)];

    const r = rand(14, 26);
    const edge = irand(0, 3);
    let x, y;
    if (edge === 0) { x = -r - 20; y = rand(0, H); }
    else if (edge === 1) { x = W + r + 20; y = rand(0, H); }
    else if (edge === 2) { x = rand(0, W); y = -r - 20; }
    else { x = rand(0, W); y = H + r + 20; }

    const toCenter = Math.atan2(H / 2 - y, W / 2 - x);
    const angle = toCenter + rand(-0.85, 0.85);
    const speed = cfg.speed * rand(0.7, 1.25) * (1 + (state.level - 1) * 0.06);

    state.shapes.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r,
        type,
        healthy: isHealthy,
        rotation: Math.random() * Math.PI * 2,
        spin: rand(-1.4, 1.4),
        pulse: Math.random() * Math.PI * 2,
    });
}

function spawnPowerup() {
    const key = pickWeightedPowerup();
    state.powerups.push({
        x: rand(120, W - 120),
        y: rand(120, H - 120),
        r: 20,
        key,
        color: POWERUPS[key].color,
        short: POWERUPS[key].short,
        life: 12,
        pulse: 0,
    });
}

function spawnBurst(x, y, color, count, speed) {
    for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = speed * rand(0.4, 1.2);
        const life = rand(0.4, 1.0);
        state.particles.push({
            x, y,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            life, maxLife: life,
            color,
            size: rand(2, 5),
        });
    }
}

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------
function updatePlayer(dt) {
    const p = state.player;

    // --- Keyboard thrust (mouse input removed) ---
    let mx = 0, my = 0;
    if (keys['w'] || keys['arrowup']) my -= 1;
    if (keys['s'] || keys['arrowdown']) my += 1;
    if (keys['a'] || keys['arrowleft']) mx -= 1;
    if (keys['d'] || keys['arrowright']) mx += 1;

    if (mx !== 0 || my !== 0) {
        const len = Math.hypot(mx, my) || 1;
        p.vx += (mx / len) * PLAYER_ACCEL * dt;
        p.vy += (my / len) * PLAYER_ACCEL * dt;
    }

    // --- Drag & speed cap ---
    const drag = Math.pow(PLAYER_DRAG, dt);
    p.vx *= drag;
    p.vy *= drag;

    const sp = Math.hypot(p.vx, p.vy);
    if (sp > PLAYER_SPEED) {
        const k = PLAYER_SPEED / sp;
        p.vx *= k;
        p.vy *= k;
    }

    // --- Move & wrap the CENTER around the arena ---
    // (Radius is allowed to poke off the edge; that's normal for
    // wrap-around games and matches how the shapes behave.)
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    if (p.x < 0) p.x += W;
    else if (p.x >= W) p.x -= W;
    if (p.y < 0) p.y += H;
    else if (p.y >= H) p.y -= H;

    if (p.invuln > 0) p.invuln -= dt;
    if (p.hitFlash > 0) p.hitFlash -= dt;
}

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------
function updateShapes(dt) {
    const slow = state.slowTimer > 0 ? 0.4 : 1;
    const magnetOn = state.magnetTimer > 0;
    const p = state.player;

    for (let i = state.shapes.length - 1; i >= 0; i--) {
        const s = state.shapes[i];

        s.x += s.vx * dt * slow;
        s.y += s.vy * dt * slow;
        s.rotation += s.spin * dt * slow;
        s.pulse += dt * 2.5;

        // Magnet pulls healthy shapes toward the player (wrap-aware).
        if (magnetOn && s.healthy) {
            const dx = wrappedDelta(p.x, s.x, W);
            const dy = wrappedDelta(p.y, s.y, H);
            const d = Math.hypot(dx, dy) || 1;
            if (d < 340) {
                const pull = 280 * (1 - d / 340);
                s.x += (dx / d) * pull * dt;
                s.y += (dy / d) * pull * dt;
            }
        }

        // Wrap-around the arena edges.
        const m = s.r + 30;
        if (s.x < -m) s.x = W + m;
        else if (s.x > W + m) s.x = -m;
        if (s.y < -m) s.y = H + m;
        else if (s.y > H + m) s.y = -m;

        // Collision vs. player - wrapped so the seam doesn't break it.
        const dx = wrappedDelta(p.x, s.x, W);
        const dy = wrappedDelta(p.y, s.y, H);
        const dist = Math.hypot(dx, dy);
        const hitR = p.r * HIT_RADIUS_SCALE + s.r * HIT_RADIUS_SCALE;
        if (dist < hitR) {
            if (s.healthy) {
                eatHealthy(s);
                state.shapes.splice(i, 1);
            } else {
                if (eatUnhealthy(s)) state.shapes.splice(i, 1);
            }
        }
    }
}

function eatHealthy(s) {
    const p = state.player;
    // Grow a little per bite, then cap out.
    p.r = Math.min(PLAYER_MAX_R, p.r + Math.min(1.6, s.r * 0.06));
    state.score += 10 + Math.round(s.r * 0.5) + state.level * 2;
    state.eaten++;
    spawnBurst(s.x, s.y, HEALTHY_COLOR, 10, 220);
    state.shake = Math.min(state.shake + 2, 5);

    if (state.eaten >= state.target) {
        levelUp();
    } else {
        updateHUD();
    }
}

// Returns true if the shape should be removed (i.e. the player was
// actually damaged). When invulnerable we keep the shape so the player
// doesn't "eat" it for free during i-frames.
function eatUnhealthy(s) {
    const p = state.player;
    if (p.invuln > 0) return false;

    const damage = state.cfg.damage + (state.level - 1) * 2;
    state.health = Math.max(0, state.health - damage);
    state.score = Math.max(0, state.score - 5);
    p.invuln = HIT_INVULN;
    p.hitFlash = 0.4;
    // Getting hit also shrinks you back a touch.
    p.r = Math.max(PLAYER_R, p.r - 3);
    spawnBurst(s.x, s.y, UNHEALTHY_COLOR, 14, 260);
    state.shake = Math.min(state.shake + 8, 14);

    if (state.health <= 0) {
        endGame(false);
    } else {
        updateHUD();
    }
    return true;
}

// ---------------------------------------------------------------------------
// Power-ups
// ---------------------------------------------------------------------------
function updatePowerups(dt) {
    for (let i = state.powerups.length - 1; i >= 0; i--) {
        const pu = state.powerups[i];
        pu.life -= dt;
        pu.pulse += dt;

        if (pu.life <= 0) {
            state.powerups.splice(i, 1);
            continue;
        }

        const dx = wrappedDelta(state.player.x, pu.x, W);
        const dy = wrappedDelta(state.player.y, pu.y, H);
        if (Math.hypot(dx, dy) < state.player.r + pu.r) {
            applyPowerup(pu.key);
            spawnBurst(pu.x, pu.y, pu.color, 20, 300);
            state.powerups.splice(i, 1);
        }
    }
}

function applyPowerup(key) {
    const p = state.player;
    switch (key) {
        case 'clean': {
            for (let i = state.shapes.length - 1; i >= 0; i--) {
                if (!state.shapes[i].healthy) {
                    spawnBurst(
                        state.shapes[i].x, state.shapes[i].y,
                        UNHEALTHY_COLOR, 8, 220
                    );
                    state.shapes.splice(i, 1);
                }
            }
            state.shake = Math.min(state.shake + 6, 12);
            break;
        }
        case 'slow':
            state.slowTimer = 6;
            break;
        case 'heal':
            state.health = Math.min(HEALTH_MAX, state.health + 30);
            break;
        case 'magnet':
            state.magnetTimer = 6;
            break;
        case 'shrink':
            // Aggressive shrink - this is the safety valve for a
            // snowballed player.
            p.r = Math.max(PLAYER_R, p.r - 14);
            state.score += 50;
            break;
    }
    state.score += 15;
    updateHUD();
}

// ---------------------------------------------------------------------------
// Level / game flow
// ---------------------------------------------------------------------------
function levelUp() {
    if (state.level >= MAX_LEVEL) {
        endGame(true);
        return;
    }
    state.level++;
    state.eaten = 0;
    state.target = START_TARGET + (state.level - 1) * TARGET_STEP;
    // Gentler per-level shrink so progression doesn't feel punishing.
    state.player.r = Math.max(PLAYER_R + 2, state.player.r - 4);
    state.score += 100 * state.level;
    state.health = Math.min(HEALTH_MAX, state.health + 15);
    state.shake = 12;
    spawnBurst(state.player.x, state.player.y, PLAYER_COLOR, 30, 340);
    updateHUD();
    updateStatus();
}

function endGame(won) {
    state.gameOver = true;
    if (won) {
        overlayMessage.textContent = 'Victory!';
        overlayScore.textContent =
            `Final Score: ${state.score.toLocaleString()}  •  Reached Level ${state.level}`;
        statusEl.textContent = 'Victory!';
        statusEl.className = 'win-message';
    } else {
        overlayMessage.textContent = 'Game Over';
        overlayScore.textContent =
            `Final Score: ${state.score.toLocaleString()}  •  Level ${state.level}`;
        statusEl.textContent = 'Game Over';
        statusEl.className = 'lose-message';
    }
    overlay.classList.add('show');
}

// ---------------------------------------------------------------------------
// HUD
// ---------------------------------------------------------------------------
function updateHUD() {
    scoreEl.textContent = state.score.toLocaleString();

    const pct = clamp(state.health / HEALTH_MAX, 0, 1) * 100;
    healthFillEl.style.width = pct + '%';
    healthFillEl.classList.toggle('low', pct < 30);

    progressEl.textContent = `${state.eaten} / ${state.target}`;
}

function updateStatus() {
    if (state.gameOver) return;
    statusEl.className = '';
    statusEl.textContent = `Level ${state.level}`;
    progressEl.textContent = `${state.eaten} / ${state.target}`;
}

function updateControlsHint() {
    controlsHint.textContent =
        'Move: W A S D / Arrows  •  Edges wrap around';
}

// ---------------------------------------------------------------------------
// Update loop
// ---------------------------------------------------------------------------
function update(dt) {
    if (state.gameOver) return;
    state.time += dt;

    updatePlayer(dt);
    updateShapes(dt);
    updatePowerups(dt);

    if (state.slowTimer > 0) state.slowTimer -= dt;
    if (state.magnetTimer > 0) state.magnetTimer -= dt;

    const spawnInterval = Math.max(0.35, state.cfg.spawn - (state.level - 1) * 0.06);
    state.spawnTimer -= dt;
    const cap = state.cfg.cap + state.level;
    if (state.spawnTimer <= 0 && state.shapes.length < cap) {
        spawnShape();
        state.spawnTimer = spawnInterval * rand(0.7, 1.3);
    }

    if (powerupsOn) {
        state.powerupTimer -= dt;
        if (state.powerupTimer <= 0 && state.powerups.length < 2) {
            spawnPowerup();
            state.powerupTimer = state.cfg.powerupRate * rand(0.8, 1.4);
        }
    }

    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const k = Math.pow(0.15, dt);
        p.vx *= k;
        p.vy *= k;
        p.life -= dt;
        if (p.life <= 0) state.particles.splice(i, 1);
    }

    if (state.shake > 0) state.shake = Math.max(0, state.shake - 24 * dt);
}

// ---------------------------------------------------------------------------
// Rendering - shape paths
// ---------------------------------------------------------------------------
function polygonPath(sides, r) {
    for (let i = 0; i < sides; i++) {
        const a = -Math.PI / 2 + (i / sides) * Math.PI * 2;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
}

function starPath(points, outer, inner) {
    const steps = points * 2;
    for (let i = 0; i < steps; i++) {
        const rr = i % 2 === 0 ? outer : inner;
        const a = -Math.PI / 2 + (i / steps) * Math.PI * 2;
        const x = Math.cos(a) * rr;
        const y = Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
}

function shapePath(type, r) {
    ctx.beginPath();
    switch (type) {
        case 'circle':
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            break;
        case 'triangle':
            polygonPath(3, r);
            break;
        case 'square':
            polygonPath(4, r);
            break;
        case 'rectangle':
            ctx.rect(-r, -r * 0.68, r * 2, r * 1.36);
            break;
        case 'pentagon':
            polygonPath(5, r);
            break;
        case 'hexagon':
            polygonPath(6, r);
            break;
        case 'heptagon':
            polygonPath(7, r);
            break;
        case 'octagon':
            polygonPath(8, r);
            break;
        case 'star':
            starPath(5, r, r * 0.45);
            break;
        case 'diamond':
            ctx.moveTo(0, -r);
            ctx.lineTo(r, 0);
            ctx.lineTo(0, r);
            ctx.lineTo(-r, 0);
            ctx.closePath();
            break;
        case 'trapezoid':
            ctx.moveTo(-r * 0.85, -r * 0.55);
            ctx.lineTo(r * 0.85, -r * 0.55);
            ctx.lineTo(r * 0.55, r * 0.70);
            ctx.lineTo(-r * 0.55, r * 0.70);
            ctx.closePath();
            break;
        case 'arrow':
            ctx.moveTo(0, -r);
            ctx.lineTo(r * 0.85, 0);
            ctx.lineTo(r * 0.22, 0);
            ctx.lineTo(r * 0.22, r * 0.85);
            ctx.lineTo(-r * 0.22, r * 0.85);
            ctx.lineTo(-r * 0.22, 0);
            ctx.lineTo(-r * 0.85, 0);
            ctx.closePath();
            break;
        case 'gear': {
            const teeth = 8;
            const steps = teeth * 2;
            for (let i = 0; i < steps; i++) {
                const a = -Math.PI / 2 + (i / steps) * Math.PI * 2;
                const rr = i % 2 === 0 ? r * 1.08 : r * 0.72;
                const x = Math.cos(a) * rr;
                const y = Math.sin(a) * rr;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            break;
        }
        case 'spiral':
            ctx.moveTo(0, 0);
            for (let i = 1; i <= 40; i++) {
                const a = i * 0.45;
                const rr = (i / 40) * r;
                ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
            }
            break;
        default:
            ctx.arc(0, 0, r, 0, Math.PI * 2);
    }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function drawEntityShape(s) {
    const color = s.healthy ? HEALTHY_COLOR : UNHEALTHY_COLOR;
    const pulse = 1 + Math.sin(s.pulse) * 0.05;
    const r = s.r * pulse;

    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rotation);

    ctx.shadowBlur = 16;
    ctx.shadowColor = color;

    shapePath(s.type, r);
    if (s.type !== 'spiral') {
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = color;
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    if (s.type !== 'spiral') {
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.14, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    }

    ctx.restore();
}

function drawPowerup(pu) {
    ctx.save();
    const pulse = 1 + Math.sin(pu.pulse * 6) * 0.12;
    const r = pu.r * pulse;

    if (pu.life < 3) ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(pu.life * 6));

    ctx.shadowBlur = 22;
    ctx.shadowColor = pu.color;

    ctx.strokeStyle = pu.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(pu.x, pu.y, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = pu.color + '33';
    ctx.beginPath();
    ctx.arc(pu.x, pu.y, r - 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = pu.color;
    ctx.font = 'bold 15px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pu.short, pu.x, pu.y + 1);
    ctx.restore();
}

// Draws the player at (px, py). We call it once for the real position
// and, when close to an edge, again on the opposite side so the wrap
// looks continuous instead of teleporting.
function drawPlayerAt(px, py) {
    const p = state.player;
    const flashing = p.hitFlash > 0 && Math.floor(p.hitFlash * 20) % 2 === 0;
    const blink = p.invuln > 0 && Math.floor(p.invuln * 12) % 2 === 0;

    if (blink && !flashing) return;

    const color = flashing ? '#ffffff' : PLAYER_COLOR;
    const r = p.r;

    ctx.save();
    ctx.translate(px, py);

    ctx.shadowBlur = 26;
    ctx.shadowColor = color;

    const rad = Math.min(8, r * 0.35);
    const s = r * 0.92;
    ctx.beginPath();
    ctx.moveTo(-s + rad, -s);
    ctx.lineTo(s - rad, -s);
    ctx.arcTo(s, -s, s, -s + rad, rad);
    ctx.lineTo(s, s - rad);
    ctx.arcTo(s, s, s - rad, s, rad);
    ctx.lineTo(-s + rad, s);
    ctx.arcTo(-s, s, -s, s - rad, rad);
    ctx.lineTo(-s, -s + rad);
    ctx.arcTo(-s, -s, -s + rad, -s, rad);
    ctx.closePath();

    ctx.globalAlpha = 0.25;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(r * 0.28, -r * 0.10, r * 0.16, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r * 0.28, -r * 0.10, r * 0.07, 0, Math.PI * 2);
    ctx.fillStyle = '#0b1220';
    ctx.fill();

    ctx.restore();
}

function drawPlayer() {
    const p = state.player;
    drawPlayerAt(p.x, p.y);

    // Ghost copies across the wrap seam so partial overlaps look right.
    if (p.x < p.r) drawPlayerAt(p.x + W, p.y);
    else if (p.x > W - p.r) drawPlayerAt(p.x - W, p.y);

    if (p.y < p.r) drawPlayerAt(p.x, p.y + H);
    else if (p.y > H - p.r) drawPlayerAt(p.x, p.y - H);
}

function render() {
    ctx.save();

    if (state.shake > 0) {
        const sx = (Math.random() - 0.5) * state.shake;
        const sy = (Math.random() - 0.5) * state.shake;
        ctx.translate(sx, sy);
    }

    const bg = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, Math.max(W, H));
    bg.addColorStop(0, '#0f1420');
    bg.addColorStop(1, '#050810');
    ctx.fillStyle = bg;
    ctx.fillRect(-40, -40, W + 80, H + 80);

    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 60) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    if (state.slowTimer > 0) {
        ctx.fillStyle = `rgba(96,165,250,${0.05 * Math.min(1, state.slowTimer)})`;
        ctx.fillRect(-40, -40, W + 80, H + 80);
    }
    if (state.magnetTimer > 0) {
        ctx.fillStyle = `rgba(251,191,36,${0.04 * Math.min(1, state.magnetTimer)})`;
        ctx.fillRect(-40, -40, W + 80, H + 80);
    }

    for (const pu of state.powerups) drawPowerup(pu);
    for (const s of state.shapes) drawEntityShape(s);

    if (!state.gameOver) drawPlayer();

    for (const p of state.particles) {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    ctx.restore();
}

// ---------------------------------------------------------------------------
// Loop
// ---------------------------------------------------------------------------
function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    update(dt);
    render();

    requestAnimationFrame(loop);
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
function resetGame() {
    difficulty = difficultySelect.value;
    powerupsOn = powerupsSelect.value === 'on';

    state = createState();
    seedInitialShapes();

    overlay.classList.remove('show');
    statusEl.className = '';

    updateHUD();
    updateStatus();
    updateControlsHint();

    lastTime = performance.now();
}

// ---------------------------------------------------------------------------
// Input - keyboard only
// ---------------------------------------------------------------------------
document.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

window.addEventListener('blur', () => {
    for (const k in keys) keys[k] = false;
});

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) lastTime = performance.now();
});

// ---------------------------------------------------------------------------
// Bindings
// ---------------------------------------------------------------------------
resetBtn.addEventListener('click', resetGame);
playAgainBtn.addEventListener('click', resetGame);

difficultySelect.addEventListener('change', resetGame);

powerupsSelect.addEventListener('change', () => {
    powerupsOn = powerupsSelect.value === 'on';
    if (!powerupsOn && state) state.powerups = [];
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
setupCanvas();
resetGame();

requestAnimationFrame((t) => {
    lastTime = t;
    requestAnimationFrame(loop);
});