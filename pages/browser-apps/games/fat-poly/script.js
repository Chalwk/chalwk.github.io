// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('best-score');
const statusEl = document.getElementById('status');
const progressEl = document.getElementById('progress');
const comboEl = document.getElementById('combo');
const healthFillEl = document.getElementById('health-fill');
const resetBtn = document.getElementById('reset');
const playAgainBtn = document.getElementById('play-again');
const pauseBtn = document.getElementById('pause-btn');
const muteBtn = document.getElementById('mute-btn');
const resumeBtn = document.getElementById('resume-btn');
const difficultySelect = document.getElementById('difficulty');
const powerupsSelect = document.getElementById('powerups');
const controlsHint = document.getElementById('controls-hint');
const overlay = document.getElementById('game-over-overlay');
const overlayMessage = document.getElementById('game-over-message');
const overlayScore = document.getElementById('game-over-score');
const overlayBest = document.getElementById('game-over-best');
const pauseOverlay = document.getElementById('pause-overlay');
const boardWrap = document.getElementById('board-wrap');
const joystickEl = document.getElementById('joystick');
const joystickKnobEl = document.getElementById('joystick-knob');

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

const COMBO_WINDOW = 2.4;      // seconds of grace between eats to keep a combo alive
const COMBO_MAX_BONUS = 12;    // combo count at which the multiplier caps out

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
// Sound engine - fully synthesized via Web Audio API, so there are no
// external audio assets to host or load on a static Jekyll/GitHub Pages site.
// ---------------------------------------------------------------------------
const Sound = (() => {
    let ac = null;
    let muted = localStorage.getItem('fatpoly:muted') === '1';

    function ensureCtx() {
        if (!ac) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            ac = new AC();
        }
        if (ac.state === 'suspended') ac.resume();
        return ac;
    }

    // A single synthesized oscillator "blip".
    function tone({ freq = 440, slideTo = null, duration = 0.15, type = 'sine', volume = 0.2, delay = 0 }) {
        if (muted) return;
        const ctx = ensureCtx();
        if (!ctx) return;
        const t0 = ctx.currentTime + delay;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t0);
        if (slideTo !== null) {
            osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + duration);
        }
        gain.gain.setValueAtTime(volume, t0);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

        osc.connect(gain).connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + duration + 0.02);
    }

    // Filtered white noise burst - used for impacts/hits.
    function noise({ duration = 0.2, volume = 0.25, delay = 0, filterFreq = 900 }) {
        if (muted) return;
        const ctx = ensureCtx();
        if (!ctx) return;
        const t0 = ctx.currentTime + delay;

        const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const src = ctx.createBufferSource();
        src.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFreq;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(volume, t0);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

        src.connect(filter).connect(gain).connect(ctx.destination);
        src.start(t0);
    }

    // A short sequence of tones played back-to-back (for fanfares etc).
    function sequence(notes) {
        notes.forEach((n) => tone(n));
    }

    return {
        setMuted(v) {
            muted = v;
            localStorage.setItem('fatpoly:muted', v ? '1' : '0');
        },
        isMuted() {
            return muted;
        },
        unlock() {
            ensureCtx();
        },
        eatHealthy(comboLevel) {
            const step = Math.min(comboLevel, COMBO_MAX_BONUS);
            tone({
                freq: 420 + step * 26,
                slideTo: 640 + step * 26,
                duration: 0.1,
                type: 'triangle',
                volume: 0.16,
            });
        },
        eatUnhealthy() {
            noise({ duration: 0.22, volume: 0.28, filterFreq: 700 });
            tone({ freq: 140, slideTo: 55, duration: 0.28, type: 'sawtooth', volume: 0.16 });
        },
        powerup(key) {
            // Each power-up gets its own tiny ascending arpeggio so they're
            // distinguishable by ear.
            const bases = { clean: 300, slow: 260, heal: 380, magnet: 340, shrink: 420 };
            const base = bases[key] || 320;
            sequence([
                { freq: base, duration: 0.09, type: 'square', volume: 0.14 },
                { freq: base * 1.26, duration: 0.09, type: 'square', volume: 0.14, delay: 0.07 },
                { freq: base * 1.5, duration: 0.14, type: 'square', volume: 0.14, delay: 0.14 },
            ]);
        },
        levelUp() {
            sequence([
                { freq: 392, duration: 0.12, type: 'triangle', volume: 0.18 },
                { freq: 523, duration: 0.12, type: 'triangle', volume: 0.18, delay: 0.1 },
                { freq: 659, duration: 0.22, type: 'triangle', volume: 0.2, delay: 0.2 },
            ]);
        },
        win() {
            sequence([
                { freq: 523, duration: 0.14, type: 'triangle', volume: 0.2 },
                { freq: 659, duration: 0.14, type: 'triangle', volume: 0.2, delay: 0.13 },
                { freq: 784, duration: 0.14, type: 'triangle', volume: 0.2, delay: 0.26 },
                { freq: 1047, duration: 0.35, type: 'triangle', volume: 0.22, delay: 0.39 },
            ]);
        },
        gameOver() {
            sequence([
                { freq: 300, slideTo: 90, duration: 0.5, type: 'sawtooth', volume: 0.18 },
            ]);
            noise({ duration: 0.4, volume: 0.15, filterFreq: 400, delay: 0.05 });
        },
        click() {
            tone({ freq: 320, duration: 0.05, type: 'square', volume: 0.09 });
        },
        pause() {
            tone({ freq: 260, duration: 0.08, type: 'square', volume: 0.1 });
        },
    };
})();

// ---------------------------------------------------------------------------
// High scores (persisted per difficulty in localStorage)
// ---------------------------------------------------------------------------
const HighScores = (() => {
    const KEY = 'fatpoly:highscores';

    function load() {
        try {
            const raw = localStorage.getItem(KEY);
            const parsed = raw ? JSON.parse(raw) : {};
            return { easy: 0, normal: 0, hard: 0, ...parsed };
        } catch {
            return { easy: 0, normal: 0, hard: 0 };
        }
    }

    let scores = load();

    return {
        get(diff) {
            return scores[diff] || 0;
        },
        // Returns true if this was a new best.
        submit(diff, score) {
            if (score > (scores[diff] || 0)) {
                scores[diff] = score;
                localStorage.setItem(KEY, JSON.stringify(scores));
                return true;
            }
            return false;
        },
    };
})();

// ---------------------------------------------------------------------------
// Globals
// ---------------------------------------------------------------------------
let difficulty = 'normal';
let powerupsOn = true;
let state = null;
let lastTime = 0;
let paused = false;
const keys = Object.create(null);

// Touch joystick input, normalized -1..1 on each axis.
const touchVec = { x: 0, y: 0, active: false };

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
        popups: [],
        score: 0,
        level: 1,
        health: HEALTH_MAX,
        eaten: 0,
        target: START_TARGET,
        combo: 0,
        comboTimer: 0,
        spawnTimer: 0.4,
        powerupTimer: cfg.powerupRate * 0.6,
        slowTimer: 0,
        magnetTimer: 0,
        shake: 0,
        time: 0,
        gameOver: false,
        newBest: false,
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

// Floating score/label text that drifts upward and fades - gives feedback
// on exactly how many points (and why) the player just got.
function spawnPopup(x, y, text, color) {
    state.popups.push({
        x, y,
        text,
        color,
        life: 0.9,
        maxLife: 0.9,
    });
}

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------
function updatePlayer(dt) {
    const p = state.player;

    // --- Keyboard thrust ---
    let mx = 0, my = 0;
    if (keys['w'] || keys['arrowup']) my -= 1;
    if (keys['s'] || keys['arrowdown']) my += 1;
    if (keys['a'] || keys['arrowleft']) mx -= 1;
    if (keys['d'] || keys['arrowright']) mx += 1;

    // --- Touch joystick overrides keyboard when active ---
    if (touchVec.active) {
        mx = touchVec.x;
        my = touchVec.y;
        const len = Math.hypot(mx, my);
        if (len > 1) { mx /= len; my /= len; }
        p.vx += mx * PLAYER_ACCEL * dt;
        p.vy += my * PLAYER_ACCEL * dt;
    } else if (mx !== 0 || my !== 0) {
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

    // Combo: eating healthy shapes back-to-back (within COMBO_WINDOW
    // seconds of each other) builds a multiplier that decays if you stall.
    state.combo++;
    state.comboTimer = COMBO_WINDOW;
    const comboMult = 1 + Math.min(state.combo - 1, COMBO_MAX_BONUS) * 0.08;

    const basePoints = 10 + Math.round(s.r * 0.5) + state.level * 2;
    const points = Math.round(basePoints * comboMult);
    state.score += points;
    state.eaten++;

    Sound.eatHealthy(state.combo);
    spawnBurst(s.x, s.y, HEALTHY_COLOR, 10, 220);
    spawnPopup(s.x, s.y, `+${points}`, HEALTHY_COLOR);
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
    // Getting hit also shrinks you back a touch, and breaks any combo.
    p.r = Math.max(PLAYER_R, p.r - 3);
    state.combo = 0;
    state.comboTimer = 0;

    Sound.eatUnhealthy();
    spawnBurst(s.x, s.y, UNHEALTHY_COLOR, 14, 260);
    spawnPopup(s.x, s.y, '-5', UNHEALTHY_COLOR);
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
            Sound.powerup(pu.key);
            spawnBurst(pu.x, pu.y, pu.color, 20, 300);
            spawnPopup(pu.x, pu.y, POWERUPS[pu.key].label, pu.color);
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
    Sound.levelUp();
    spawnBurst(state.player.x, state.player.y, PLAYER_COLOR, 30, 340);
    spawnPopup(state.player.x, state.player.y - 30, `Level ${state.level}!`, PLAYER_COLOR);
    updateHUD();
    updateStatus();
}

function endGame(won) {
    state.gameOver = true;
    state.newBest = HighScores.submit(difficulty, state.score);
    const best = HighScores.get(difficulty);

    if (won) {
        Sound.win();
        overlayMessage.textContent = 'Victory!';
        overlayScore.textContent =
            `Final Score: ${state.score.toLocaleString()}  •  Reached Level ${state.level}`;
        statusEl.textContent = 'Victory!';
        statusEl.className = 'win-message';
    } else {
        Sound.gameOver();
        overlayMessage.textContent = 'Game Over';
        overlayScore.textContent =
            `Final Score: ${state.score.toLocaleString()}  •  Level ${state.level}`;
        statusEl.textContent = 'Game Over';
        statusEl.className = 'lose-message';
    }

    overlayBest.textContent = state.newBest
        ? `New Best Score: ${best.toLocaleString()}!`
        : `Best: ${best.toLocaleString()}`;

    overlay.classList.add('show');
    updateHUD();
}

// ---------------------------------------------------------------------------
// HUD
// ---------------------------------------------------------------------------
function updateHUD() {
    scoreEl.textContent = state.score.toLocaleString();

    const best = HighScores.get(difficulty);
    const isBest = state.score >= best && state.score > 0;
    bestScoreEl.textContent = `Best: ${Math.max(best, state.score).toLocaleString()}`;
    bestScoreEl.classList.toggle('new-best', isBest);

    const pct = clamp(state.health / HEALTH_MAX, 0, 1) * 100;
    healthFillEl.style.width = pct + '%';
    healthFillEl.classList.toggle('low', pct < 30);
    boardWrap.classList.toggle('critical', pct < 25 && !state.gameOver);

    progressEl.textContent = `${state.eaten} / ${state.target}`;

    if (state.combo > 1) {
        const mult = (1 + Math.min(state.combo - 1, COMBO_MAX_BONUS) * 0.08).toFixed(1);
        comboEl.textContent = `x${state.combo} combo (${mult}x)`;
        comboEl.classList.add('show');
    } else {
        comboEl.classList.remove('show');
    }
}

function updateStatus() {
    if (state.gameOver) return;
    statusEl.className = '';
    statusEl.textContent = `Level ${state.level}`;
    progressEl.textContent = `${state.eaten} / ${state.target}`;
}

function updateControlsHint() {
    controlsHint.textContent =
        'Move: WASD / Arrows / drag to steer  •  P: pause  •  M: mute  •  Edges wrap around';
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

    if (state.comboTimer > 0) {
        state.comboTimer -= dt;
        if (state.comboTimer <= 0) {
            state.combo = 0;
            updateHUD();
        }
    }

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

    for (let i = state.popups.length - 1; i >= 0; i--) {
        const p = state.popups[i];
        p.y -= 40 * dt;
        p.life -= dt;
        if (p.life <= 0) state.popups.splice(i, 1);
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

function drawPopups() {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 16px ui-monospace, SFMono-Regular, Menlo, monospace';
    for (const p of state.popups) {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
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

    drawPopups();

    ctx.restore();
}

// ---------------------------------------------------------------------------
// Loop
// ---------------------------------------------------------------------------
function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    if (!paused) update(dt);
    render();

    requestAnimationFrame(loop);
}

// ---------------------------------------------------------------------------
// Pause / mute
// ---------------------------------------------------------------------------
function setPaused(v) {
    if (state.gameOver) return;
    if (v === paused) return;
    paused = v;
    pauseOverlay.classList.toggle('show', paused);
    pauseBtn.innerHTML = paused
        ? '<i class="fas fa-play"></i>'
        : '<i class="fas fa-pause"></i>';
    pauseBtn.setAttribute('aria-label', paused ? 'Resume game' : 'Pause game');
    Sound.pause();
    if (!paused) lastTime = performance.now();
}

function togglePause() {
    setPaused(!paused);
}

function updateMuteButton() {
    const muted = Sound.isMuted();
    muteBtn.innerHTML = muted
        ? '<i class="fas fa-volume-mute"></i>'
        : '<i class="fas fa-volume-up"></i>';
    muteBtn.classList.toggle('active', muted);
    muteBtn.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
}

function toggleMute() {
    Sound.unlock();
    Sound.setMuted(!Sound.isMuted());
    updateMuteButton();
    if (!Sound.isMuted()) Sound.click();
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
function resetGame() {
    Sound.unlock();
    difficulty = difficultySelect.value;
    powerupsOn = powerupsSelect.value === 'on';

    state = createState();
    seedInitialShapes();

    paused = false;
    pauseOverlay.classList.remove('show');
    pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    overlay.classList.remove('show');
    statusEl.className = '';

    updateHUD();
    updateStatus();
    updateControlsHint();

    lastTime = performance.now();
}

// ---------------------------------------------------------------------------
// Input - keyboard
// ---------------------------------------------------------------------------
document.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();

    if (k === 'p' || k === 'escape') {
        e.preventDefault();
        togglePause();
        return;
    }
    if (k === 'm') {
        e.preventDefault();
        toggleMute();
        return;
    }

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
    if (state && !state.gameOver) setPaused(true);
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (state && !state.gameOver) setPaused(true);
    } else if (!paused) {
        lastTime = performance.now();
    }
});

// ---------------------------------------------------------------------------
// Input - touch joystick
// ---------------------------------------------------------------------------
let touchId = null;
let touchBase = { x: 0, y: 0 };
const JOYSTICK_MAX = 44;

function boardWrapPoint(clientX, clientY) {
    const rect = boardWrap.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
}

function beginTouch(t) {
    touchId = t.identifier;
    touchBase = boardWrapPoint(t.clientX, t.clientY);
    joystickEl.style.left = `${touchBase.x}px`;
    joystickEl.style.top = `${touchBase.y}px`;
    joystickEl.classList.add('show');
    joystickKnobEl.style.transform = 'translate(0px, 0px)';
    touchVec.active = true;
    touchVec.x = 0;
    touchVec.y = 0;
    Sound.unlock();
}

function moveTouch(t) {
    const pt = boardWrapPoint(t.clientX, t.clientY);
    let dx = pt.x - touchBase.x;
    let dy = pt.y - touchBase.y;
    const dist = Math.hypot(dx, dy);
    if (dist > JOYSTICK_MAX) {
        dx = (dx / dist) * JOYSTICK_MAX;
        dy = (dy / dist) * JOYSTICK_MAX;
    }
    joystickKnobEl.style.transform = `translate(${dx}px, ${dy}px)`;
    touchVec.x = dx / JOYSTICK_MAX;
    touchVec.y = dy / JOYSTICK_MAX;
}

function endTouch() {
    touchId = null;
    touchVec.active = false;
    touchVec.x = 0;
    touchVec.y = 0;
    joystickEl.classList.remove('show');
}

boardWrap.addEventListener('touchstart', (e) => {
    if (touchId !== null) return;
    e.preventDefault();
    beginTouch(e.changedTouches[0]);
}, { passive: false });

boardWrap.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
        if (t.identifier === touchId) {
            e.preventDefault();
            moveTouch(t);
        }
    }
}, { passive: false });

function handleTouchEnd(e) {
    for (const t of e.changedTouches) {
        if (t.identifier === touchId) endTouch();
    }
}
boardWrap.addEventListener('touchend', handleTouchEnd);
boardWrap.addEventListener('touchcancel', handleTouchEnd);

// ---------------------------------------------------------------------------
// Bindings
// ---------------------------------------------------------------------------
resetBtn.addEventListener('click', () => { Sound.click(); resetGame(); });
playAgainBtn.addEventListener('click', () => { Sound.click(); resetGame(); });
resumeBtn.addEventListener('click', () => setPaused(false));
pauseBtn.addEventListener('click', togglePause);
muteBtn.addEventListener('click', toggleMute);

difficultySelect.addEventListener('change', () => { Sound.click(); resetGame(); });

powerupsSelect.addEventListener('change', () => {
    Sound.click();
    powerupsOn = powerupsSelect.value === 'on';
    if (!powerupsOn && state) state.powerups = [];
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
setupCanvas();
updateMuteButton();
resetGame();

requestAnimationFrame((t) => {
    lastTime = t;
    requestAnimationFrame(loop);
});