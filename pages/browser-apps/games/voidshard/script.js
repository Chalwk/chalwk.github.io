// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const statusEl = document.getElementById('status');
const chainEl = document.getElementById('chain');
const livesEl = document.getElementById('lives');
const resetBtn = document.getElementById('reset');
const playAgainBtn = document.getElementById('play-again');
const difficultySelect = document.getElementById('difficulty');
const hunterSelect = document.getElementById('hunter');
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

const DIFFICULTY = {
    rookie: { shardSpeed: 55, shardCount: 4, hunterAggro: 0.55, hunterFire: 2.4, lives: 4 },
    veteran: { shardSpeed: 88, shardCount: 6, hunterAggro: 1.0, hunterFire: 1.7, lives: 3 },
    master: { shardSpeed: 130, shardCount: 8, hunterAggro: 1.5, hunterFire: 1.1, lives: 3 },
};

const POWERUPS = {
    shield: { color: '#4ade80', short: 'S', duration: 9 },
    rapid: { color: '#fbbf24', short: 'R', duration: 9 },
    spread: { color: '#a78bfa', short: 'P', duration: 9 },
    slow: { color: '#60a5fa', short: 'L', duration: 6 },
    pierce: { color: '#f97316', short: 'X', duration: 7 },
};
const POWERUP_KEYS = Object.keys(POWERUPS);

const SHIP_COLOR = '#22d3ee';
const SHARD_COLOR = '#60a5fa';
const HUNTER_COLOR = '#f43f5e';
const BULLET_COLOR = '#fbbf24';

const MAX_CHAIN = 5;
const CHAIN_WINDOW = 2.2;
const SHIP_MAX_SPEED = 520;
const SHIP_ACCEL = 1800;
const SHIP_DRAG = 0.12;           // fraction of velocity kept per second
const SHIP_TURN_SPEED = 4.6;      // radians per second
const PARALLAX_STRENGTH = 0.22;   // how strongly stars react to ship motion

// Ship hull radius used for shard collisions (slightly forgiving vs. visual r)
const SHIP_HIT_RADIUS_SCALE = 0.85;

// ---------------------------------------------------------------------------
// Global UI state
// ---------------------------------------------------------------------------
let hunterOn = true;
let powerupsOn = true;

// ---------------------------------------------------------------------------
// Runtime state
// ---------------------------------------------------------------------------
let game = null;
let lastTime = 0;
const keys = Object.create(null);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const wrap = (v, max) => ((v % max) + max) % max;

function setupCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function makeStars() {
    const stars = [];
    for (let i = 0; i < 200; i++) {
        // z drives both brightness and parallax strength (nearer = stronger)
        const z = Math.random() * 0.85 + 0.15;
        stars.push({
            x: Math.random() * W,
            y: Math.random() * H,
            r: z * 1.7 + 0.25,
            z,
            tw: Math.random() * Math.PI * 2,
        });
    }
    return stars;
}

// Shard vertices are stored in local (unrotated) space.
// `a` / `r` are kept for convenience; `x` / `y` are used for collision tests.
function makeShardVerts(r) {
    const n = 9 + Math.floor(Math.random() * 3);
    const verts = [];
    for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const rr = r * (0.7 + Math.random() * 0.55);
        verts.push({
            a,
            r: rr,
            x: Math.cos(a) * rr,
            y: Math.sin(a) * rr,
        });
    }
    return verts;
}

// ---------------------------------------------------------------------------
// Collision helpers
// ---------------------------------------------------------------------------

// Shortest delta between two positions in a wrapping axis
function wrappedDelta(a, b, size) {
    let d = a - b;
    if (d > size / 2) d -= size;
    else if (d < -size / 2) d += size;
    return d;
}

// Ray-casting point-in-polygon (verts are local-space {x, y})
function pointInPolygon(px, py, verts) {
    let inside = false;
    for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
        const xi = verts[i].x, yi = verts[i].y;
        const xj = verts[j].x, yj = verts[j].y;
        const intersects = ((yi > py) !== (yj > py)) &&
            (px < ((xj - xi) * (py - yi)) / (yj - yi) + xi);
        if (intersects) inside = !inside;
    }
    return inside;
}

// Squared distance from point P to segment AB
function distToSegmentSq(px, py, ax, ay, bx, by) {
    const abx = bx - ax, aby = by - ay;
    const apx = px - ax, apy = py - ay;
    const len2 = abx * abx + aby * aby;
    let t = len2 > 0 ? (apx * abx + apy * aby) / len2 : 0;
    t = clamp(t, 0, 1);
    const cx = ax + abx * t, cy = ay + aby * t;
    const dx = px - cx, dy = py - cy;
    return dx * dx + dy * dy;
}

// Circle (in world space) vs. the shard's actual rotated polygon.
function circleHitsShard(cx, cy, cr, sh) {
    const verts = sh.verts;
    if (!verts || verts.length < 3) return false;

    // Transform the circle centre into the shard's local (unrotated) space
    const cos = Math.cos(-sh.rotation);
    const sin = Math.sin(-sh.rotation);
    const dx = cx - sh.x;
    const dy = cy - sh.y;
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;

    // 1) Centre inside the shape
    if (pointInPolygon(lx, ly, verts)) return true;

    // 2) Circle overlaps any edge of the shape
    const cr2 = cr * cr;
    for (let i = 0; i < verts.length; i++) {
        const a = verts[i];
        const b = verts[(i + 1) % verts.length];
        if (distToSegmentSq(lx, ly, a.x, a.y, b.x, b.y) < cr2) return true;
    }
    return false;
}

// ---------------------------------------------------------------------------
// State creation
// ---------------------------------------------------------------------------
function createState() {
    const cfg = DIFFICULTY[difficultySelect.value] || DIFFICULTY.veteran;

    return {
        cfg,
        ship: {
            x: W / 2, y: H / 2,
            vx: 0, vy: 0,
            angle: -Math.PI / 2,
            r: 13,
            fireCd: 0,
            invuln: 2.6,
            shield: 0,
            rapid: 0,
            spread: 0,
            pierce: 0,
            warpCd: 0,
            thrusting: false,
            thrustAmt: 0,
        },
        bullets: [],
        shards: [],
        hunters: [],
        particles: [],
        powerups: [],
        stars: makeStars(),
        score: 0,
        lives: cfg.lives,
        wave: 1,
        chain: 1,
        chainTimer: 0,
        slowTimer: 0,
        hunterTimer: 14,
        hunterSpawned: false,
        gameOver: false,
        shake: 0,
        time: 0,
        parallaxX: 0,
        parallaxY: 0,
    };
}

// ---------------------------------------------------------------------------
// Spawns
// ---------------------------------------------------------------------------
function spawnWave(wave) {
    const count = game.cfg.shardCount + Math.floor((wave - 1) * 1.3);
    for (let i = 0; i < count; i++) spawnShard();
}

function spawnShard() {
    const size = Math.random() < 0.65 ? 'large' : 'medium';
    const r = size === 'large' ? 42 : 24;

    const edge = Math.floor(Math.random() * 4);
    let x, y;
    if (edge === 0) { x = -r; y = Math.random() * H; }
    else if (edge === 1) { x = W + r; y = Math.random() * H; }
    else if (edge === 2) { x = Math.random() * W; y = -r; }
    else { x = Math.random() * W; y = H + r; }

    const toCenter = Math.atan2(H / 2 - y, W / 2 - x);
    const a = toCenter + rand(-0.8, 0.8);
    const sp = game.cfg.shardSpeed * rand(0.6, 1.2);

    game.shards.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        r,
        size,
        rotation: Math.random() * Math.PI * 2,
        spin: rand(-1.2, 1.2),
        verts: makeShardVerts(r),
        hitFlash: 0,
    });
}

function spawnChildShard(parent, size) {
    const r = size === 'medium' ? 24 : 13;
    const a = Math.random() * Math.PI * 2;
    const sp = game.cfg.shardSpeed * rand(0.9, 1.6) * (size === 'small' ? 1.4 : 1);
    game.shards.push({
        x: parent.x + rand(-8, 8),
        y: parent.y + rand(-8, 8),
        vx: Math.cos(a) * sp + parent.vx * 0.3,
        vy: Math.sin(a) * sp + parent.vy * 0.3,
        r,
        size,
        rotation: Math.random() * Math.PI * 2,
        spin: rand(-2.5, 2.5),
        verts: makeShardVerts(r),
        hitFlash: 0,
    });
}

function spawnHunter() {
    let x = W / 2, y = 60;
    for (let i = 0; i < 24; i++) {
        const edge = Math.floor(Math.random() * 4);
        if (edge === 0) { x = 60; y = Math.random() * H; }
        else if (edge === 1) { x = W - 60; y = Math.random() * H; }
        else if (edge === 2) { x = Math.random() * W; y = 60; }
        else { x = Math.random() * W; y = H - 60; }
        if (Math.hypot(x - game.ship.x, y - game.ship.y) > 280) break;
    }

    game.hunters.push({
        x, y,
        vx: 0, vy: 0,
        r: 18,
        angle: 0,
        target: { x, y },
        retarget: 0,
        fireCd: 1.6,
        hp: 3,
        maxHp: 3,
        spawnPulse: 1,
    });

    spawnParticles(x, y, 26, HUNTER_COLOR, 200, 1.1);
    game.shake = Math.min(game.shake + 6, 12);
    game.hunterSpawned = true;
}

// ---------------------------------------------------------------------------
// Particles
// ---------------------------------------------------------------------------
function spawnParticles(x, y, count, color, speed, life) {
    for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = speed * rand(0.35, 1.25);
        const l = life * rand(0.6, 1.2);
        game.particles.push({
            x, y,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            life: l,
            maxLife: l,
            color,
            size: rand(1.5, 3.5),
        });
    }
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
document.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    if (k === ' ' || k === 'arrowup' || k === 'arrowdown' ||
        k === 'arrowleft' || k === 'arrowright') {
        e.preventDefault();
    }
});
document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});
window.addEventListener('blur', () => {
    for (const k in keys) keys[k] = false;
});

// ---------------------------------------------------------------------------
// Ship
// ---------------------------------------------------------------------------
function updateShip(dt) {
    const s = game.ship;

    // --- Turning (A / D or Left / Right) ---
    let turn = 0;
    if (keys['a'] || keys['arrowleft']) turn -= 1;
    if (keys['d'] || keys['arrowright']) turn += 1;
    s.angle += turn * SHIP_TURN_SPEED * dt;

    // --- Thrust (W / Up forward, S / Down brake) ---
    let thrust = 0;
    if (keys['w'] || keys['arrowup']) thrust += 1;
    if (keys['s'] || keys['arrowdown']) thrust -= 0.55;

    s.thrusting = thrust > 0;
    s.thrustAmt = s.thrusting ? 1 : Math.max(0, s.thrustAmt - dt * 4);

    s.vx += Math.cos(s.angle) * thrust * SHIP_ACCEL * dt;
    s.vy += Math.sin(s.angle) * thrust * SHIP_ACCEL * dt;

    // Friction
    const fr = Math.pow(SHIP_DRAG, dt);
    s.vx *= fr;
    s.vy *= fr;

    // Clamp speed
    const sp = Math.hypot(s.vx, s.vy);
    if (sp > SHIP_MAX_SPEED) {
        const k = SHIP_MAX_SPEED / sp;
        s.vx *= k; s.vy *= k;
    }

    s.x += s.vx * dt;
    s.y += s.vy * dt;

    // --- Screen wrapping ---
    if (s.x < 0) s.x += W;
    else if (s.x >= W) s.x -= W;
    if (s.y < 0) s.y += H;
    else if (s.y >= H) s.y -= H;

    // Fire
    s.fireCd -= dt;
    if (keys[' '] && s.fireCd <= 0) fireBullets();

    // Timers
    if (s.invuln > 0) s.invuln -= dt;
    if (s.rapid > 0) s.rapid -= dt;
    if (s.spread > 0) s.spread -= dt;
    if (s.pierce > 0) s.pierce -= dt;

    // Warp
    s.warpCd -= dt;
    if (keys['shift'] && s.warpCd <= 0) {
        s.warpCd = 4;
        spawnParticles(s.x, s.y, 26, SHIP_COLOR, 280, 0.9);
        let nx = rand(80, W - 80), ny = rand(80, H - 80);
        for (let i = 0; i < 12; i++) {
            const dx = nx - s.x, dy = ny - s.y;
            if (Math.hypot(dx, dy) > 220) break;
            nx = rand(80, W - 80); ny = rand(80, H - 80);
        }
        s.x = nx; s.y = ny;
        s.vx = 0; s.vy = 0;
        s.invuln = Math.max(s.invuln, 1.2);
        spawnParticles(s.x, s.y, 26, SHIP_COLOR, 280, 0.9);
        game.shake = Math.min(game.shake + 6, 12);
    }
}

function fireBullets() {
    const s = game.ship;
    const angle = s.angle;

    const offsets = s.spread > 0 ? [-0.24, 0, 0.24] : [0];
    const speed = 720;
    const r = s.pierce > 0 ? 5 : 3;

    for (const off of offsets) {
        const a = angle + off;
        game.bullets.push({
            x: s.x + Math.cos(a) * (s.r + 4),
            y: s.y + Math.sin(a) * (s.r + 4),
            vx: Math.cos(a) * speed + s.vx * 0.35,
            vy: Math.sin(a) * speed + s.vy * 0.35,
            life: 1.1,
            r,
            pierce: s.pierce > 0,
            hostile: false,
        });
    }

    // Recoil
    s.vx -= Math.cos(angle) * 14;
    s.vy -= Math.sin(angle) * 14;

    spawnParticles(
        s.x + Math.cos(angle) * (s.r + 4),
        s.y + Math.sin(angle) * (s.r + 4),
        5, BULLET_COLOR, 130, 0.35
    );

    s.fireCd = s.rapid > 0 ? 0.10 : 0.21;
    game.shake = Math.min(game.shake + 1.2, 5);
}

// ---------------------------------------------------------------------------
// Bullets
// ---------------------------------------------------------------------------
function updateBullets(dt) {
    for (let i = game.bullets.length - 1; i >= 0; i--) {
        const b = game.bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt;

        if (b.hostile) {
            // Hunter shots wrap around the arena edges
            if (b.x < 0) b.x += W;
            else if (b.x >= W) b.x -= W;
            if (b.y < 0) b.y += H;
            else if (b.y >= H) b.y -= H;
        } else {
            // Player shots do NOT wrap: they are culled at the board edges
            const m = b.r + 1;
            if (b.x < -m || b.x > W + m || b.y < -m || b.y > H + m) {
                game.bullets.splice(i, 1);
                continue;
            }
        }

        if (b.life <= 0) {
            game.bullets.splice(i, 1);
            continue;
        }

        if (b.hostile) continue;

        let remove = false;

        // Shards
        for (let j = game.shards.length - 1; j >= 0; j--) {
            const sh = game.shards[j];
            const dx = b.x - sh.x, dy = b.y - sh.y;
            const rr = sh.r + b.r;
            if (dx * dx + dy * dy < rr * rr) {
                destroyShard(j);
                if (!b.pierce) { remove = true; break; }
            }
        }
        if (remove) {
            game.bullets.splice(i, 1);
            continue;
        }

        // Hunters
        for (let j = game.hunters.length - 1; j >= 0; j--) {
            const h = game.hunters[j];
            const dx = b.x - h.x, dy = b.y - h.y;
            const rr = h.r + b.r;
            if (dx * dx + dy * dy < rr * rr) {
                h.hp--;
                spawnParticles(b.x, b.y, 8, HUNTER_COLOR, 160, 0.5);
                if (h.hp <= 0) destroyHunter(j);
                if (!b.pierce) { remove = true; break; }
            }
        }
        if (remove) game.bullets.splice(i, 1);
    }
}

// ---------------------------------------------------------------------------
// Shards
// ---------------------------------------------------------------------------
function updateShards(dt) {
    const slow = game.slowTimer > 0 ? 0.45 : 1;
    for (const sh of game.shards) {
        sh.x += sh.vx * dt * slow;
        sh.y += sh.vy * dt * slow;
        sh.rotation += sh.spin * dt * slow;
        if (sh.hitFlash > 0) sh.hitFlash -= dt;

        const m = sh.r + 4;
        if (sh.x < -m) sh.x = W + m;
        if (sh.x > W + m) sh.x = -m;
        if (sh.y < -m) sh.y = H + m;
        if (sh.y > H + m) sh.y = -m;
    }
}

// Ship vs. shard collision (shape-accurate, wrap-aware).
function checkShipShardCollisions() {
    const s = game.ship;
    if (game.gameOver) return;

    const hitR = s.r * SHIP_HIT_RADIUS_SCALE;

    for (let i = game.shards.length - 1; i >= 0; i--) {
        const sh = game.shards[i];
        if (!sh) continue;

        // Express the ship's position in the shard's own (unwrapped) frame
        // so collisions still work across the screen-wrap seam.
        const dx = wrappedDelta(s.x, sh.x, W);
        const dy = wrappedDelta(s.y, sh.y, H);
        const cx = sh.x + dx;
        const cy = sh.y + dy;

        if (!circleHitsShard(cx, cy, hitR, sh)) continue;

        // Invulnerable (post-hit / spawning) ships phase through shards
        if (s.invuln > 0) continue;

        // Shatter the shard first (no score awarded for ramming)
        const impactX = sh.x;
        const impactY = sh.y;
        const impactR = sh.r;
        destroyShard(i, false);

        // Impact feedback + knock the ship back along the contact normal
        spawnParticles(impactX, impactY, 18, SHARD_COLOR, 240, 0.7);
        game.shake = Math.min(game.shake + 9, 16);

        const d = Math.hypot(dx, dy) || 1;
        s.vx -= (dx / d) * 150;
        s.vy -= (dy / d) * 150;

        damageShip();
        if (game.gameOver) return;
    }
}

function destroyShard(index, awardScore = true) {
    const sh = game.shards[index];
    if (!sh) return;

    if (awardScore) {
        const base = sh.size === 'large' ? 20 : sh.size === 'medium' ? 50 : 100;
        game.score += base * game.chain;

        game.chainTimer = CHAIN_WINDOW;
        game.chain = Math.min(game.chain + 1, MAX_CHAIN);
    }

    spawnParticles(
        sh.x, sh.y,
        sh.size === 'small' ? 8 : 16,
        SHARD_COLOR,
        sh.size === 'small' ? 160 : 220,
        0.65
    );

    if (sh.size === 'large') {
        for (let i = 0; i < 2; i++) spawnChildShard(sh, 'medium');
    } else if (sh.size === 'medium') {
        for (let i = 0; i < 2; i++) spawnChildShard(sh, 'small');
    }

    game.shards.splice(index, 1);
    game.shake = Math.min(game.shake + 2.5, 10);

    if (powerupsOn) {
        const chance = sh.size === 'small' ? 0.10 : 0.06;
        if (Math.random() < chance) dropPowerup(sh.x, sh.y);
    }

    updateHUD();
}

// ---------------------------------------------------------------------------
// Void Hunter
// ---------------------------------------------------------------------------
function updateHunters(dt) {
    const slow = game.slowTimer > 0 ? 0.55 : 1;

    for (let i = game.hunters.length - 1; i >= 0; i--) {
        const h = game.hunters[i];
        if (h.spawnPulse > 0) h.spawnPulse = Math.max(0, h.spawnPulse - dt);

        h.retarget -= dt;
        if (h.retarget <= 0) {
            const off = 70;
            h.target.x = clamp(game.ship.x + rand(-off, off), 40, W - 40);
            h.target.y = clamp(game.ship.y + rand(-off, off), 40, H - 40);
            h.retarget = rand(0.9, 1.6);
        }

        const dx = h.target.x - h.x;
        const dy = h.target.y - h.y;
        const d = Math.hypot(dx, dy) || 1;
        const acc = 260 * game.cfg.hunterAggro;
        h.vx += (dx / d) * acc * dt * slow;
        h.vy += (dy / d) * acc * dt * slow;

        const fr = Math.pow(0.08, dt);
        h.vx *= fr; h.vy *= fr;

        const sp = Math.hypot(h.vx, h.vy);
        const maxSp = 200 + 60 * game.cfg.hunterAggro;
        if (sp > maxSp) {
            const k = maxSp / sp;
            h.vx *= k; h.vy *= k;
        }

        h.x += h.vx * dt * slow;
        h.y += h.vy * dt * slow;

        // Hunter also wraps at edges
        if (h.x < 0) h.x += W;
        else if (h.x >= W) h.x -= W;
        if (h.y < 0) h.y += H;
        else if (h.y >= H) h.y -= H;

        h.angle = Math.atan2(game.ship.y - h.y, game.ship.x - h.x);

        h.fireCd -= dt * slow;
        if (h.fireCd <= 0) {
            h.fireCd = game.cfg.hunterFire * rand(0.8, 1.2);
            fireHunterBullet(h);
        }

        // Touch damage (using wrapped delta so wrapping feels fair)
        const s = game.ship;
        const dxw = wrappedDelta(s.x, h.x, W);
        const dyw = wrappedDelta(s.y, h.y, H);
        const touchR = s.r + h.r;
        if (dxw * dxw + dyw * dyw < touchR * touchR) {
            if (s.invuln <= 0) damageShip();
            const dn = Math.hypot(dxw, dyw) || 1;
            h.x -= (dxw / dn) * 30;
            h.y -= (dyw / dn) * 30;
        }
    }

    if (hunterOn && !game.gameOver) {
        game.hunterTimer -= dt;
        if (game.hunterTimer <= 0 && game.hunters.length < 1) {
            spawnHunter();
        }
    }
}

function fireHunterBullet(h) {
    const s = game.ship;
    const baseAngle = Math.atan2(s.y - h.y, s.x - h.x);
    const inacc = (1 / game.cfg.hunterAggro) * 0.35;
    const a = baseAngle + rand(-inacc, inacc);
    const speed = 340;

    game.bullets.push({
        x: h.x + Math.cos(a) * (h.r + 4),
        y: h.y + Math.sin(a) * (h.r + 4),
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: 2.2,
        r: 4,
        pierce: false,
        hostile: true,
    });
    spawnParticles(h.x, h.y, 6, HUNTER_COLOR, 150, 0.4);
}

function destroyHunter(index) {
    const h = game.hunters[index];
    if (!h) return;

    game.score += 250 * game.chain;
    spawnParticles(h.x, h.y, 42, HUNTER_COLOR, 340, 1.15);
    spawnParticles(h.x, h.y, 20, '#ffffff', 200, 0.7);
    game.shake = Math.min(game.shake + 12, 18);

    if (powerupsOn) dropPowerup(h.x, h.y);

    game.hunters.splice(index, 1);
    game.hunterTimer = rand(14, 22);

    updateHUD();
}

// ---------------------------------------------------------------------------
// Damage
// ---------------------------------------------------------------------------
function damageShip() {
    const s = game.ship;
    if (s.invuln > 0) return;

    if (s.shield > 0) {
        s.shield--;
        s.invuln = 1.4;
        spawnParticles(s.x, s.y, 26, '#4ade80', 260, 0.9);
        game.shake = Math.min(game.shake + 8, 14);
        updateHUD();
        return;
    }

    game.lives--;
    s.invuln = 2.4;
    spawnParticles(s.x, s.y, 46, SHIP_COLOR, 360, 1.2);
    game.shake = Math.min(game.shake + 16, 20);
    game.chain = 1;
    game.chainTimer = 0;
    updateHUD();

    if (game.lives <= 0) {
        endGame();
        return;
    }

    s.x = W / 2; s.y = H / 2;
    s.vx = 0; s.vy = 0;
    spawnParticles(s.x, s.y, 20, SHIP_COLOR, 200, 0.8);
}

// ---------------------------------------------------------------------------
// Power-ups
// ---------------------------------------------------------------------------
function dropPowerup(x, y) {
    const key = POWERUP_KEYS[Math.floor(Math.random() * POWERUP_KEYS.length)];
    game.powerups.push({
        x, y,
        r: 16,
        key,
        color: POWERUPS[key].color,
        short: POWERUPS[key].short,
        pulse: 0,
        life: 14,
    });
}

function updatePowerups(dt) {
    for (let i = game.powerups.length - 1; i >= 0; i--) {
        const p = game.powerups[i];
        p.pulse += dt;
        p.life -= dt;

        if (p.life <= 0) {
            game.powerups.splice(i, 1);
            continue;
        }

        const dx = game.ship.x - p.x;
        const dy = game.ship.y - p.y;
        const d = Math.hypot(dx, dy);

        if (d > 0 && d < 180) {
            p.x += (dx / d) * 90 * dt;
            p.y += (dy / d) * 90 * dt;
        }

        if (d < p.r + game.ship.r + 4) {
            applyPowerup(p.key);
            spawnParticles(p.x, p.y, 22, p.color, 220, 0.8);
            game.powerups.splice(i, 1);
        }
    }
}

function applyPowerup(key) {
    const s = game.ship;
    switch (key) {
        case 'shield': s.shield = Math.min(s.shield + 1, 3); break;
        case 'rapid': s.rapid = POWERUPS.rapid.duration; break;
        case 'spread': s.spread = POWERUPS.spread.duration; break;
        case 'slow': game.slowTimer = POWERUPS.slow.duration; break;
        case 'pierce': s.pierce = POWERUPS.pierce.duration; break;
    }
    game.score += 15;
    updateHUD();
}

// ---------------------------------------------------------------------------
// Update loop
// ---------------------------------------------------------------------------
function update(dt) {
    if (game.gameOver) return;

    game.time += dt;

    updateShip(dt);
    updateBullets(dt);
    updateShards(dt);
    checkShipShardCollisions();
    updateHunters(dt);
    updatePowerups(dt);

    // Hostile bullet → ship
    for (let i = game.bullets.length - 1; i >= 0; i--) {
        const b = game.bullets[i];
        if (!b.hostile) continue;
        const s = game.ship;
        const dx = b.x - s.x, dy = b.y - s.y;
        const rr = s.r + b.r;
        if (dx * dx + dy * dy < rr * rr) {
            damageShip();
            game.bullets.splice(i, 1);
        }
    }

    // Chain timer
    if (game.chainTimer > 0) {
        game.chainTimer -= dt;
        if (game.chainTimer <= 0) {
            game.chain = 1;
            updateHUD();
        }
    }

    if (game.slowTimer > 0) game.slowTimer -= dt;

    // Wave clear
    if (game.shards.length === 0) {
        game.wave++;
        game.score += 100 * game.wave;
        spawnWave(game.wave);
        updateHUD();
        updateStatus();
    }

    // Particles
    for (let i = game.particles.length - 1; i >= 0; i--) {
        const p = game.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const fr = Math.pow(0.15, dt);
        p.vx *= fr;
        p.vy *= fr;
        p.life -= dt;
        if (p.life <= 0) game.particles.splice(i, 1);
    }

    // Parallax offset accumulates from ship motion
    game.parallaxX += game.ship.vx * dt * PARALLAX_STRENGTH;
    game.parallaxY += game.ship.vy * dt * PARALLAX_STRENGTH;

    if (game.shake > 0) game.shake = Math.max(0, game.shake - 24 * dt);
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------
function drawBackground() {
    const grad = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, Math.max(W, H));
    grad.addColorStop(0, '#0f1420');
    grad.addColorStop(1, '#050810');
    ctx.fillStyle = grad;
    ctx.fillRect(-40, -40, W + 80, H + 80);

    // Parallax starfield: nearer stars (higher z) shift more
    for (const s of game.stars) {
        const tw = 0.6 + 0.4 * Math.sin(game.time * 1.2 + s.tw);
        const ox = wrap(s.x - game.parallaxX * s.z, W);
        const oy = wrap(s.y - game.parallaxY * s.z, H);
        ctx.globalAlpha = s.z * tw;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ox, oy, s.r, s.r);
    }
    ctx.globalAlpha = 1;

    // Faint grid — subtle parallax too
    const gridX = wrap(-game.parallaxX * 0.08, 60);
    const gridY = wrap(-game.parallaxY * 0.08, 60);
    ctx.strokeStyle = 'rgba(255,255,255,0.022)';
    ctx.lineWidth = 1;
    for (let x = -60 + gridX; x < W + 60; x += 60) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = -60 + gridY; y < H + 60; y += 60) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
}

function drawShard(sh) {
    ctx.save();
    ctx.translate(sh.x, sh.y);
    ctx.rotate(sh.rotation);

    ctx.beginPath();
    const vs = sh.verts;
    for (let i = 0; i < vs.length; i++) {
        const v = vs[i];
        if (i === 0) ctx.moveTo(v.x, v.y);
        else ctx.lineTo(v.x, v.y);
    }
    ctx.closePath();

    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, sh.r);
    grad.addColorStop(0, 'rgba(96, 165, 250, 0.24)');
    grad.addColorStop(1, 'rgba(96, 165, 250, 0.03)');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.shadowBlur = 14;
    ctx.shadowColor = SHARD_COLOR;
    ctx.strokeStyle = sh.hitFlash > 0 ? '#ffffff' : SHARD_COLOR;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(191, 219, 254, 0.32)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -sh.r * 0.4);
    ctx.lineTo(sh.r * 0.4, 0);
    ctx.lineTo(0, sh.r * 0.4);
    ctx.lineTo(-sh.r * 0.4, 0);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
}

function drawShip() {
    const s = game.ship;

    if (s.invuln > 0 && Math.floor(game.time * 12) % 2 === 0) {
        drawShieldRings(s);
        return;
    }

    ctx.save();
    ctx.translate(s.x, s.y);

    // Thrust flame (points backward along ship angle)
    if (s.thrustAmt > 0) {
        const flick = 0.7 + Math.random() * 0.5;
        ctx.save();
        ctx.rotate(s.angle);
        ctx.beginPath();
        ctx.moveTo(-s.r - 1, -5);
        ctx.lineTo(-s.r - 1 - 16 * flick * s.thrustAmt, 0);
        ctx.lineTo(-s.r - 1, 5);
        ctx.closePath();
        ctx.fillStyle = 'rgba(251, 146, 60, 0.85)';
        ctx.shadowBlur = 16;
        ctx.shadowColor = '#fb923c';
        ctx.fill();
        ctx.restore();
    }

    ctx.rotate(s.angle);

    ctx.shadowBlur = 18;
    ctx.shadowColor = SHIP_COLOR;
    ctx.fillStyle = SHIP_COLOR;
    ctx.beginPath();
    ctx.moveTo(s.r, 0);
    ctx.lineTo(-s.r * 0.8, -s.r * 0.75);
    ctx.lineTo(-s.r * 0.35, 0);
    ctx.lineTo(-s.r * 0.8, s.r * 0.75);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0f1420';
    ctx.beginPath();
    ctx.arc(s.r * 0.1, 0, s.r * 0.28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffffff';
    ctx.beginPath();
    ctx.arc(s.r * 0.55, 0, 1.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    drawShieldRings(s);
}

function drawShieldRings(s) {
    if (s.shield > 0) {
        for (let i = 0; i < s.shield; i++) {
            ctx.save();
            ctx.strokeStyle = '#4ade80';
            ctx.shadowBlur = 14;
            ctx.shadowColor = '#4ade80';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.75 - i * 0.18;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r + 9 + i * 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        ctx.globalAlpha = 1;
    }
}

function drawHunter(h) {
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle);

    ctx.shadowBlur = 22;
    ctx.shadowColor = HUNTER_COLOR;
    ctx.fillStyle = 'rgba(244, 63, 94, 0.88)';
    ctx.beginPath();
    const spikes = 8;
    for (let i = 0; i < spikes * 2; i++) {
        const a = (i / (spikes * 2)) * Math.PI * 2;
        const r = i % 2 === 0 ? h.r : h.r * 0.65;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0f1420';
    ctx.beginPath();
    ctx.arc(0, 0, h.r * 0.55, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = HUNTER_COLOR;
    ctx.beginPath();
    ctx.arc(h.r * 0.25, -h.r * 0.28, 2.6, 0, Math.PI * 2);
    ctx.arc(h.r * 0.25, h.r * 0.28, 2.6, 0, Math.PI * 2);
    ctx.fill();

    if (h.spawnPulse > 0) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = HUNTER_COLOR;
        ctx.globalAlpha = h.spawnPulse * 0.7;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, h.r + 22 * (1 - h.spawnPulse) + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    const pipY = h.r + 12;
    const pipW = 6;
    const gap = 3;
    const totalW = h.maxHp * pipW + (h.maxHp - 1) * gap;
    ctx.save();
    ctx.rotate(-h.angle);
    for (let i = 0; i < h.maxHp; i++) {
        ctx.fillStyle = i < h.hp ? HUNTER_COLOR : 'rgba(244, 63, 94, 0.25)';
        ctx.fillRect(-totalW / 2 + i * (pipW + gap), pipY, pipW, 3);
    }
    ctx.restore();

    ctx.restore();
}

function drawBullet(b) {
    ctx.save();
    const col = b.hostile ? HUNTER_COLOR : BULLET_COLOR;
    ctx.shadowBlur = 14;
    ctx.shadowColor = col;
    ctx.fillStyle = col;

    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();

    if (b.pierce || b.hostile) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.4;
        ctx.stroke();
    }

    ctx.restore();
}

function drawPowerup(p) {
    ctx.save();
    const pulse = 1 + Math.sin(p.pulse * 6) * 0.12;
    const r = p.r * pulse;

    if (p.life < 3) ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(p.life * 6));

    ctx.shadowBlur = 22;
    ctx.shadowColor = p.color;
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = p.color + '33';
    ctx.beginPath();
    ctx.arc(p.x, p.y, r - 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = p.color;
    ctx.font = 'bold 15px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.short, p.x, p.y + 1);

    ctx.restore();
}

function render() {
    ctx.save();

    if (game.shake > 0) {
        const sx = (Math.random() - 0.5) * game.shake;
        const sy = (Math.random() - 0.5) * game.shake;
        ctx.translate(sx, sy);
    }

    drawBackground();

    for (const p of game.powerups) drawPowerup(p);
    for (const sh of game.shards) drawShard(sh);
    for (const h of game.hunters) drawHunter(h);
    for (const b of game.bullets) drawBullet(b);

    if (!game.gameOver) drawShip();

    for (const p of game.particles) {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    if (game.slowTimer > 0) {
        ctx.fillStyle = `rgba(96, 165, 250, ${0.06 * Math.min(1, game.slowTimer)})`;
        ctx.fillRect(-40, -40, W + 80, H + 80);
    }

    ctx.restore();
}

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------
function updateHUD() {
    scoreEl.textContent = game.score.toLocaleString();
    livesEl.textContent = game.lives;

    if (game.chain > 1) {
        chainEl.textContent = `Chain x${game.chain}`;
        chainEl.style.color = '#fbbf24';
    } else {
        chainEl.textContent = 'Chain x1';
        chainEl.style.color = '';
    }
}

function updateStatus() {
    if (game.gameOver) return;
    statusEl.className = '';
    statusEl.textContent = `Wave ${game.wave}`;
}

function updateControlsHint() {
    controlsHint.textContent =
        'Thrust: W / ↑  •  Turn: A D / ← →  •  Brake: S / ↓  •  Fire: Space  •  Warp: Shift';
}

function endGame() {
    game.gameOver = true;
    overlayMessage.textContent = 'Hull Lost';
    overlayScore.textContent = `Final Score: ${game.score.toLocaleString()}  •  Wave ${game.wave}`;
    overlay.classList.add('show');
    statusEl.textContent = 'Game Over';
    statusEl.className = 'lose-message';
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
function resetGame() {
    hunterOn = hunterSelect.value === 'on';
    powerupsOn = powerupsSelect.value === 'on';

    game = createState();
    spawnWave(game.wave);

    overlay.classList.remove('show');
    statusEl.className = '';

    updateHUD();
    updateStatus();
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
// Bindings
// ---------------------------------------------------------------------------
resetBtn.addEventListener('click', resetGame);
playAgainBtn.addEventListener('click', resetGame);

difficultySelect.addEventListener('change', resetGame);

hunterSelect.addEventListener('change', () => {
    hunterOn = hunterSelect.value === 'on';
    if (!game) return;
    if (!hunterOn) {
        game.hunters = [];
        game.hunterTimer = Infinity;
    } else {
        game.hunterTimer = Math.min(game.hunterTimer, 6);
    }
});

powerupsSelect.addEventListener('change', () => {
    powerupsOn = powerupsSelect.value === 'on';
    if (game && !powerupsOn) game.powerups = [];
});

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) lastTime = performance.now();
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
setupCanvas();
updateControlsHint();
resetGame();

requestAnimationFrame((t) => {
    lastTime = t;
    requestAnimationFrame(loop);
});