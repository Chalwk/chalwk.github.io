// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// --- DOM handles --------------------------------------------------------------
// Grabbing them all up front so render/update code stays tidy!
const boardEl = document.getElementById('dungeon-board');
const statusEl = document.getElementById('status');
const floorLabelEl = document.getElementById('floor-label');
const floorThemeEl = document.getElementById('floor-theme');
const hpFillEl = document.getElementById('hp-fill');
const hpTextEl = document.getElementById('hp-text');
const goldCountEl = document.getElementById('gold-count');
const weaponChip = document.getElementById('weapon-chip');
const weaponIconEl = document.getElementById('weapon-icon');
const weaponNameEl = document.getElementById('weapon-name');
const boonChip = document.getElementById('boon-chip');
const boonNameEl = document.getElementById('boon-name');
const roomChip = document.getElementById('room-chip');
const roomNameEl = document.getElementById('room-name');
const redKeyChip = document.getElementById('redkey-chip');
const redKeyDot = redKeyChip.querySelector('.key-dot');
const redKeyStatusEl = document.getElementById('redkey-status');
const goldKeyChip = document.getElementById('goldkey-chip');
const goldKeyDot = goldKeyChip.querySelector('.key-dot');
const goldKeyStatusEl = document.getElementById('goldkey-status');
const potionCountEl = document.getElementById('potion-count');
const logEl = document.getElementById('log');
const overlay = document.getElementById('game-over-overlay');
const overlayMessage = document.getElementById('game-over-message');
const overlayDetail = document.getElementById('game-over-detail');
const playAgainBtn = document.getElementById('play-again');
const resetBtn = document.getElementById('reset-btn');
const waitBtn = document.getElementById('wait-btn');
const potionBtn = document.getElementById('potion-btn');
const soundToggleBtn = document.getElementById('sound-toggle');
const sizeSelect = document.getElementById('dungeon-size');
const difficultySelect = document.getElementById('difficulty');
const choiceOverlay = document.getElementById('choice-overlay');
const choiceKickerEl = document.getElementById('choice-kicker');
const choiceTitleEl = document.getElementById('choice-title');
const choiceDescriptionEl = document.getElementById('choice-description');
const choiceOptionsEl = document.getElementById('choice-options');
const gamePanelEl = document.getElementById('game-panel');

// Every tile the board can hold. Values 1..6 are walkable in some form
// (secret doors are walkable only after you bump them).
const TILE = {
    WALL: 0,
    FLOOR: 1,
    DOOR: 2,
    RED_DOOR: 3,
    GOLD_DOOR: 4,
    STAIRS: 5,
    SECRET_DOOR: 6,
};

// Cardinal directions - used for AI movement fallbacks and key handling.
const DIRS4 = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
];

// 8-way directions for AI path smoothing / knockback helpers.
const DIRS8 = [
    { x: 0, y: -1 }, { x: 1, y: -1 }, { x: 1, y: 0 }, { x: 1, y: 1 },
    { x: 0, y: 1 }, { x: -1, y: 1 }, { x: -1, y: 0 }, { x: -1, y: -1 },
];

// Grid dimensions and target room counts per difficulty setting.
const SIZE_PRESETS = {
    small: { w: 27, h: 19, rooms: 7, cellMax: 30 },
    medium: { w: 35, h: 21, rooms: 10, cellMax: 32 },
    large: { w: 41, h: 23, rooms: 14, cellMax: 34 },
};

// Difficulty knobs: HP, starting potions, and multipliers on enemies.
const DIFFICULTY_PRESETS = {
    easy: { startHp: 26, startPotions: 2, enemyHpMult: 0.8, enemyDmgMult: 0.75, enemyCountMult: 0.8 },
    normal: { startHp: 20, startPotions: 1, enemyHpMult: 1, enemyDmgMult: 1, enemyCountMult: 1 },
    hard: { startHp: 16, startPotions: 1, enemyHpMult: 1.3, enemyDmgMult: 1.3, enemyCountMult: 1.3 },
};

const FLOOR_HUES = [222, 270, 315, 350, 20, 50, 90, 140, 175, 200, 245, 295, 330, 60];

// Weapon ladder. Higher tiers = more raw damage + unique on-hit effects.
const WEAPONS = [
    {
        id: 'fists', name: 'Fists', icon: '🤛', dmg: [1, 2], tier: 0,
        description: 'Reliable, if painfully basic.',
    },
    {
        id: 'dagger', name: 'Dagger', icon: '🗡️', dmg: [2, 4], tier: 1,
        description: '25% crit chance. +2 crit damage and +2 damage against enemies below 50% HP.',
        crit: 0.25, critBonus: 2, finisher: 2,
    },
    {
        id: 'sword', name: 'Sword', icon: '⚔️', dmg: [3, 6], tier: 2,
        description: 'Balanced damage. Strikes an adjacent enemy for 1-2 cleave damage.',
        cleave: true,
    },
    {
        id: 'axe', name: 'Axe', icon: '🪓', dmg: [4, 8], tier: 3,
        description: 'Heavy hits apply Vulnerable for 2 turns.',
        vulnerable: 2,
    },
    {
        id: 'hammer', name: 'War Hammer', icon: '🔨', dmg: [5, 10], tier: 4,
        description: '25% chance to Stun for 1 turn. Powerful hits knock enemies back.',
        stun: 0.25, knockback: true,
    },
];

// Enemy roster. minFloor gates when they start showing up; ai selects the
// move-selection branch in chooseEnemyMove(); aggro is their sight range.
const ENEMY_TYPES = [
    { id: 'rat', name: 'Rat', icon: '🐀', hp: 3, dmg: [1, 2], minFloor: 1, gold: [1, 3], ai: 'coward', aggro: 5, tags: [] },
    { id: 'goblin', name: 'Goblin', icon: '👺', hp: 6, dmg: [1, 3], minFloor: 1, gold: [2, 5], ai: 'skirmisher', aggro: 8, tags: [] },
    { id: 'skeleton', name: 'Skeleton', icon: '💀', hp: 9, dmg: [2, 4], minFloor: 2, gold: [3, 7], ai: 'sentinel', aggro: 7, tags: ['undead'] },
    { id: 'orc', name: 'Orc', icon: '👹', hp: 13, dmg: [3, 6], minFloor: 3, gold: [5, 10], ai: 'brute', aggro: 9, tags: [] },
    { id: 'wraith', name: 'Wraith', icon: '👻', hp: 17, dmg: [4, 7], minFloor: 5, gold: [8, 14], ai: 'stalker', aggro: 12, tags: ['undead'] },
    { id: 'spider', name: 'Cave Spider', icon: '🕷️', hp: 8, dmg: [2, 4], minFloor: 4, gold: [4, 8], ai: 'ambusher', aggro: 6, tags: [] },
];

// Each floor gets one of these. They mutate spawn stats, gold, vision, etc.
// The optional hooks let a theme add behavior without special-casing elsewhere.
const FLOOR_THEMES = [
    {
        id: 'catacombs', name: 'The Catacombs', icon: '🦴', desc: 'Undead are restless. Skeletons and Wraiths are slightly tougher.',
        vision: 6, enemyDamage: 1, goldMult: 1, potionMult: 1, aggro: 0,
        onEnemySpawn(enemy) { if (enemy.type.tags.includes('undead')) enemy.maxHp += 2; },
    },
    {
        id: 'bloodmoon', name: 'Bloodmoon Halls', icon: '🩸', desc: 'Enemies hit harder, but blood is worth more.',
        vision: 6, enemyDamage: 1.15, goldMult: 1.25, potionMult: 1, aggro: 0,
    },
    {
        id: 'deepdark', name: 'The Deep Dark', icon: '🌑', desc: 'Sight shrinks. Treasure Sense becomes especially valuable.',
        vision: 4, enemyDamage: 1, goldMult: 1.1, potionMult: 1, aggro: 1,
    },
    {
        id: 'blight', name: 'Blighted Grotto', icon: '🍄', desc: 'Healing is weaker, and careless turns invite poison.',
        vision: 6, enemyDamage: 1, goldMult: 1, potionMult: 0.75, aggro: 0,
        onPlayerDamaged() { if (Math.random() < 0.2) addStatus(player, 'poisoned', 2); },
    },
    {
        id: 'golden', name: 'The Golden Halls', icon: '✨', desc: 'Gold piles are plentiful, but healing is scarce.',
        vision: 6, enemyDamage: 1, goldMult: 1.55, potionMult: 0.8, aggro: 0,
    },
    {
        id: 'hunt', name: 'The Hunt', icon: '🏹', desc: 'Enemies notice you from farther away and rooms are more crowded.',
        vision: 6, enemyDamage: 1.05, goldMult: 1.1, potionMult: 1, aggro: 4,
    },
];

// Run-long buffs. Each one is checked by id in the relevant mechanic
// (see hasBoon('...') usages) so the effects are easy to trace.
const BOONS = [
    { id: 'blood_frenzy', name: 'Blood Frenzy', icon: '🩸', desc: '+1 weapon damage while below 50% HP.' },
    { id: 'executioner', name: 'Executioner', icon: '☠️', desc: '+3 damage against enemies below 25% HP.' },
    { id: 'scavenger', name: 'Scavenger', icon: '💰', desc: 'Enemy gold drops +50%.' },
    { id: 'thick_skin', name: 'Thick Skin', icon: '🛡️', desc: 'The first hit you take on each floor deals 2 less damage.' },
    { id: 'treasure_sense', name: 'Treasure Sense', icon: '👁️', desc: 'Secret doors shimmer from 3 tiles away.' },
    { id: 'vampiric', name: 'Vampiric', icon: '🦇', desc: 'Killing an enemy restores 1 HP.' },
    { id: 'momentum', name: 'Momentum', icon: '⚡', desc: 'After a kill, your next attack deals +2 damage.' },
    { id: 'alchemist', name: 'Alchemist', icon: '🧪', desc: 'Potions heal +3 HP and restore 1 extra HP at floor start.' },
    { id: 'iron_will', name: 'Iron Will', icon: '⛓️', desc: '+3 maximum HP.' },
    { id: 'fortune', name: 'Fortune', icon: '🍀', desc: '25% chance to double ordinary gold pickups.' },
    { id: 'scouting', name: 'Pathfinder', icon: '🧭', desc: 'Vision radius +1 and room entrances are highlighted.' },
    { id: 'glass_fang', name: 'Glass Fang', icon: '🔷', desc: '+15% critical chance, but maximum HP -2.' },
];

// Room "biomes" inside a floor. The `type` string drives the room-entry
// triggers in triggerRoomEntry().
const ROOM_TYPES = {
    normal: { name: 'Combat Hall', icon: '⚔️' },
    start: { name: 'Entrance', icon: '🚪' },
    exit: { name: 'Stair Hall', icon: '⬇️' },
    vault: { name: 'Gold Vault', icon: '🔐' },
    shrine: { name: 'Shrine', icon: '⛩️' },
    armory: { name: 'Armory', icon: '🗡️' },
    treasury: { name: 'Treasury', icon: '💎' },
    gauntlet: { name: 'Gauntlet', icon: '☠️' },
    library: { name: 'Library', icon: '📜' },
    healing: { name: 'Healing Sanctum', icon: '💚' },
    secret: { name: 'Secret Chamber', icon: '🌀' },
    boss: { name: 'Warden Sanctum', icon: '👑' },
};

// --- Game state --------------------------------------------------------------
// These are module-level so almost every function can read/tweak them.
const MAX_FLOOR = 10;
let sizeKey = sizeSelect.value;
let difficultyKey = difficultySelect.value;
let gridW = 0, gridH = 0;
let grid = [];              // TILE values
let discovered = [];        // tiles the player has ever seen (persists per floor)
let visible = [];           // tiles currently in line of sight
let rooms = [];
let secretRoom = null;
let enemies = [];
let items = [];
let player = null;
let floor = 1;
let floorTheme = FLOOR_THEMES[0];
let gameActive = false;
let gameOver = false;
let turnBusy = false;
let choicePending = false;  // true while a modal is open - blocks input
let choiceIndex = 0;        // index of the currently highlighted choice card
let currentRoomId = null;
let killCount = 0;
let boss = null;
let floorBuildRetryCount = 0;
let audioCtx = null;
let soundMuted = localStorage.getItem('dungeon-sound-muted') === 'true';

// --- Audio -------------------------------------------------------------------
// Everything is generated via oscillators, so there are no asset files to load.
function ensureAudioCtx() {
    if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        audioCtx = new Ctx();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

// Fire a short tone. `delay` lets callers sequence arpeggios.
function playTone(freq, duration, { type = 'sine', gain = 0.15, delay = 0 } = {}) {
    if (soundMuted) return;
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    const startTime = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    // Quick attack, exponential decay - cheap envelope for a "blip" feel.
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
}

// Named wrappers keep the game code readable instead of sprinkling freqs everywhere.
function playMoveSound() { playTone(200, 0.05, { gain: 0.05 }); }
function playBumpSound() { playTone(110, 0.1, { type: 'sawtooth', gain: 0.07 }); }
function playHitSound() { playTone(180, 0.09, { type: 'square', gain: 0.12 }); }
function playPlayerHurtSound() { playTone(140, 0.14, { type: 'sawtooth', gain: 0.14 }); }
function playKillSound() { [660, 440].forEach((f, i) => playTone(f, 0.1, { type: 'triangle', gain: 0.12, delay: i * 0.06 })); }
function playPickupSound() { playTone(760, 0.08, { type: 'triangle', gain: 0.1 }); }
function playKeySound() { [523.25, 659.25].forEach((f, i) => playTone(f, 0.14, { type: 'triangle', gain: 0.13, delay: i * 0.08 })); }
function playDoorSound() { playTone(300, 0.12, { type: 'square', gain: 0.08 }); }
function playSecretSound() { [880, 1108.7, 1318.5].forEach((f, i) => playTone(f, 0.16, { gain: 0.12, delay: i * 0.09 })); }
function playPotionSound() { playTone(500, 0.08, { gain: 0.1 }); playTone(700, 0.1, { gain: 0.09, delay: 0.06 }); }
function playFloorSound() { [392, 523.25, 659.25, 783.99].forEach((f, i) => playTone(f, 0.18, { type: 'triangle', gain: 0.14, delay: i * 0.1 })); }
function playDeathSound() { [392, 349.23, 293.66, 220].forEach((f, i) => playTone(f, 0.35, { type: 'sawtooth', gain: 0.13, delay: i * 0.18 })); }
function playVictorySound() { [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => playTone(f, 0.22, { type: 'triangle', gain: 0.15, delay: i * 0.11 })); }

function updateSoundIcon() {
    document.getElementById('sound-icon').textContent = soundMuted ? '🔇' : '🔊';
    soundToggleBtn.title = soundMuted ? 'Sound off (click to enable)' : 'Sound on (click to mute)';
}

soundToggleBtn.addEventListener('click', () => {
    soundMuted = !soundMuted;
    localStorage.setItem('dungeon-sound-muted', String(soundMuted));
    updateSoundIcon();
    if (!soundMuted) {
        // Browsers require a user gesture before audio can start.
        ensureAudioCtx();
        playTone(440, 0.08, { gain: 0.1 });
    }
});

// --- Helpers -----------------------------------------------------------
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function inBounds(x, y) { return x >= 0 && y >= 0 && x < gridW && y < gridH; }
function tileAt(x, y) { return inBounds(x, y) ? grid[y][x] : TILE.WALL; }
function isWalkableTile(t) { return t >= TILE.FLOOR && t <= TILE.SECRET_DOOR; }
// Secret doors block line-of-sight until revealed (they look like walls).
function isOpenForVision(x, y) { const t = tileAt(x, y); return t !== TILE.WALL && t !== TILE.SECRET_DOOR; }
function enemyAt(x, y) { return enemies.find(e => e.alive && e.x === x && e.y === y) || null; }
function itemAt(x, y) { return items.find(it => it.x === x && it.y === y) || null; }
function roomCenter(r) { return { x: r.x + (r.w >> 1), y: r.y + (r.h >> 1) }; }
// pad is the gap enforced between two rooms during generation.
function rectsOverlap(a, b, pad) { return a.x - pad < b.x + b.w && a.x + a.w + pad > b.x && a.y - pad < b.y + b.h && a.y + a.h + pad > b.y; }
function pointInRoom(r, x, y) { return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h; }

// Border cells sit in the wall ring just outside the room rect - that's
// where door tiles get placed by the corridor carver.
function onRoomBorder(r, x, y) {
    if (x < r.x - 1 || x > r.x + r.w || y < r.y - 1 || y > r.y + r.h) return false;
    const onVertEdge = (x === r.x - 1 || x === r.x + r.w) && y >= r.y && y < r.y + r.h;
    const onHorizEdge = (y === r.y - 1 || y === r.y + r.h) && x >= r.x && x < r.x + r.w;
    return onVertEdge || onHorizEdge;
}

// Chebyshev distance - diagonals count as 1 step, which matches how enemies move.
function distance(a, b) { return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)); }
function roomAt(x, y) { return rooms.find(r => pointInRoom(r, x, y)) || (secretRoom && pointInRoom(secretRoom, x, y) ? secretRoom : null); }
function roomTypeName(room) { return room ? `${ROOM_TYPES[room.type]?.icon || '▦'} ${ROOM_TYPES[room.type]?.name || 'Room'}` : 'Corridor'; }
function hasBoon(id) { return player.boons.some(b => b.id === id); }
function availableBoons() { return BOONS.filter(b => !hasBoon(b.id)); }
function addStatus(entity, id, turns) {
    if (!entity.statuses) entity.statuses = {};
    // Only extend duration, never shorten.
    entity.statuses[id] = Math.max(entity.statuses[id] || 0, turns);
}

function hasStatus(entity, id) { return Boolean(entity.statuses && entity.statuses[id] > 0); }

// Log keeps the last ~70 entries so the DOM doesn't grow forever.
function log(msg, cls) {
    const div = document.createElement('div');
    if (cls) div.className = cls;
    div.textContent = msg;
    logEl.appendChild(div);
    while (logEl.children.length > 70) logEl.removeChild(logEl.firstChild);
    logEl.scrollTop = logEl.scrollHeight;
}
function clearLog() { logEl.innerHTML = ''; }
function setStatus(text) { statusEl.textContent = text; }

// --- Dungeon generation ------------------------------------------------------
// Strategy: scatter non-overlapping rooms, carve corridors between them,
// pick a far-away room as the exit, then decorate with vaults/secret rooms/etc.
function generateRooms(w, h, count) {
    const list = [];
    let attempts = 0;
    // Give up after 800 tries - the size presets are tuned so this rarely hits.
    while (list.length < count && attempts < 800) {
        attempts++;
        const rw = randInt(4, 7);
        const rh = randInt(3, 6);
        const rx = randInt(1, w - rw - 2);
        const ry = randInt(1, h - rh - 2);
        const room = { x: rx, y: ry, w: rw, h: rh, type: 'normal', entered: false };
        if (list.some(r => rectsOverlap(room, r, 2))) continue;
        list.push(room);
    }
    return list;
}

function carveRoom(r) {
    for (let y = r.y; y < r.y + r.h; y++) {
        for (let x = r.x; x < r.x + r.w; x++) grid[y][x] = TILE.FLOOR;
    }
}

// Corridors are routed from one explicit wall-ring tile to another.
// A room entrance is therefore always exactly one tile wide: the only tile
// changed to DOOR is the selected connection point on each room. The route
// itself uses a 4-way BFS through wall/corridor space and is forbidden from
// entering another room or crossing an unselected room border. This prevents
// incidental wall crossings from turning into stray doors or multi-tile gaps.
function roomSidesToward(room, targetRoom) {
    const rc = roomCenter(room);
    const tc = roomCenter(targetRoom);
    const dx = tc.x - rc.x;
    const dy = tc.y - rc.y;
    if (Math.abs(dx) >= Math.abs(dy)) {
        return dx >= 0 ? ['right', 'top', 'bottom', 'left'] : ['left', 'top', 'bottom', 'right'];
    }
    return dy >= 0 ? ['bottom', 'left', 'right', 'top'] : ['top', 'left', 'right', 'bottom'];
}

function roomBorderPoint(room, side, offset) {
    if (side === 'top') return { x: room.x + offset, y: room.y - 1 };
    if (side === 'bottom') return { x: room.x + offset, y: room.y + room.h };
    if (side === 'left') return { x: room.x - 1, y: room.y + offset };
    return { x: room.x + room.w, y: room.y + offset };
}

function roomOutsidePoint(room, border) {
    if (border.x === room.x - 1) return { x: border.x - 1, y: border.y };
    if (border.x === room.x + room.w) return { x: border.x + 1, y: border.y };
    if (border.y === room.y - 1) return { x: border.x, y: border.y - 1 };
    return { x: border.x, y: border.y + 1 };
}

function pointTouchesRoomBorder(x, y) {
    return rooms.some(r => onRoomBorder(r, x, y));
}

function roomDoorIsTooClose(room, point) {
    return findRoomDoorTiles(room).some(d =>
        (d.x !== point.x || d.y !== point.y) &&
        Math.max(Math.abs(d.x - point.x), Math.abs(d.y - point.y)) <= 1
    );
}

function connectionCandidates(room, targetRoom) {
    const candidates = [];
    const sides = roomSidesToward(room, targetRoom);
    for (const side of sides) {
        const length = (side === 'top' || side === 'bottom') ? room.w : room.h;
        const offsets = Array.from({ length }, (_, i) => i).sort((a, b) => {
            const pa = roomBorderPoint(room, side, a);
            const pb = roomBorderPoint(room, side, b);
            const tc = roomCenter(targetRoom);
            return (Math.abs(pa.x - tc.x) + Math.abs(pa.y - tc.y)) -
                (Math.abs(pb.x - tc.x) + Math.abs(pb.y - tc.y));
        });
        for (const offset of offsets) {
            const border = roomBorderPoint(room, side, offset);
            const outside = roomOutsidePoint(room, border);
            if (!inBounds(border.x, border.y) || !inBounds(outside.x, outside.y)) continue;
            const borderTile = tileAt(border.x, border.y);
            if (borderTile !== TILE.WALL && borderTile !== TILE.DOOR) continue;
            if (roomDoorIsTooClose(room, border)) continue;
            if (pointTouchesRoomBorder(outside.x, outside.y)) continue;
            if (rooms.some(r => pointInRoom(r, outside.x, outside.y))) continue;
            candidates.push({ border, outside });
        }
    }
    return candidates;
}

function corridorPathAllowed(x, y, roomA, roomB, start, goal) {
    if (!inBounds(x, y)) return false;
    if ((x === start.x && y === start.y) || (x === goal.x && y === goal.y)) return true;
    // Never route through a room interior or across any room's wall ring.
    if (rooms.some(r => pointInRoom(r, x, y) || onRoomBorder(r, x, y))) return false;
    return true;
}

function findCorridorPath(starts, goals, roomA, roomB) {



    const queue = [];
    const visited = Array.from({ length: gridH }, () => Array(gridW).fill(false));
    const prev = Array.from({ length: gridH }, () => Array(gridW).fill(null));
    const source = Array.from({ length: gridH }, () => Array(gridW).fill(-1));
    const goalLookup = new Map(goals.map((g, i) => [`${g.x},${g.y}`, i]));

    starts.forEach((start, i) => {
        if (!inBounds(start.x, start.y) || visited[start.y][start.x]) return;
        visited[start.y][start.x] = true;
        source[start.y][start.x] = i;
        queue.push({ x: start.x, y: start.y });
    });

    let found = null;
    for (let head = 0; head < queue.length; head++) {
        const cur = queue[head];
        const goalIndex = goalLookup.get(`${cur.x},${cur.y}`);
        if (goalIndex !== undefined) {
            found = { point: cur, goalIndex };
            break;
        }
        for (const d of DIRS4) {
            const nx = cur.x + d.x, ny = cur.y + d.y;
            if (!corridorPathAllowed(nx, ny, roomA, roomB, starts[source[cur.y][cur.x]], cur) || visited[ny]?.[nx]) continue;
            visited[ny][nx] = true;
            prev[ny][nx] = cur;
            source[ny][nx] = source[cur.y][cur.x];
            queue.push({ x: nx, y: ny });
        }
    }

    if (!found) return null;
    const path = [];
    let cur = found.point;
    while (cur) {
        path.push(cur);
        const si = source[cur.y][cur.x];
        const start = starts[si];
        if (start && cur.x === start.x && cur.y === start.y) break;
        cur = prev[cur.y][cur.x];
    }
    path.reverse();
    return { path, sourceIndex: source[found.point.y][found.point.x], goalIndex: found.goalIndex };
}

function carveCorridor(roomA, roomB) {
    const candidatesA = connectionCandidates(roomA, roomB);
    const candidatesB = connectionCandidates(roomB, roomA);
    if (!candidatesA.length || !candidatesB.length) return false;

    // A multi-source BFS keeps this cheap: all plausible wall exits from A
    // search simultaneously until one reaches any plausible wall exit at B.
    const starts = candidatesA.slice(0, Math.min(10, candidatesA.length)).map(c => c.outside);
    const goals = candidatesB.slice(0, Math.min(10, candidatesB.length)).map(c => c.outside);
    const result = findCorridorPath(starts, goals, roomA, roomB);
    if (!result) return false;

    const a = candidatesA[result.sourceIndex];
    const b = candidatesB[result.goalIndex];
    for (const p of result.path) grid[p.y][p.x] = TILE.FLOOR;
    grid[a.border.y][a.border.x] = TILE.DOOR;
    grid[b.border.y][b.border.x] = TILE.DOOR;
    return true;
}

// Chain rooms in index order, then throw in a few random extra edges so the
// layout isn't a boring single path. Every graph edge must also produce a
// real carved corridor; failed edges are retried through the connectivity
// repair pass instead of being recorded as fake graph links.
function connectRooms(roomList) {
    const order = roomList.map((_, i) => i);
    const edges = [];
    for (let i = 0; i < order.length - 1; i++) edges.push([order[i], order[i + 1]]);
    const extra = Math.max(1, Math.floor(roomList.length / 4));
    for (let i = 0; i < extra; i++) {
        const a = randInt(0, roomList.length - 1);
        const b = randInt(0, roomList.length - 1);
        if (a !== b && !edges.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) edges.push([a, b]);
    }

    const adjacency = roomList.map(() => new Set());
    for (const [a, b] of edges) {
        if (!carveCorridor(roomList[a], roomList[b])) continue;
        adjacency[a].add(b);
        adjacency[b].add(a);
    }

    // The chain normally connects everything, but a pathological room layout
    // can make one route impossible. Repair disconnected graph components by
    // carving a real corridor before any locked doors are placed.
    for (let guard = 0; guard < roomList.length * 2; guard++) {
        const dist = roomBfsDist(adjacency, 0);
        const missing = roomList.map((_, i) => i).filter(i => dist[i] === -1);
        if (!missing.length) break;

        const reachable = roomList.map((_, i) => i).filter(i => dist[i] !== -1);
        let connected = false;
        // Try every cross-component pair before giving up. A single room can be
        // temporarily awkward to approach because of surrounding wall rings,
        // but another member of the component may have a perfectly valid route.
        for (const b of missing) {
            const orderedReachable = reachable.slice().sort((i, j) =>
                distance(roomCenter(roomList[i]), roomCenter(roomList[b])) -
                distance(roomCenter(roomList[j]), roomCenter(roomList[b])));
            for (const a of orderedReachable) {
                if (!carveCorridor(roomList[a], roomList[b])) continue;
                adjacency[a].add(b);
                adjacency[b].add(a);
                connected = true;
                break;
            }
            if (connected) break;
        }
        if (!connected) break;
    }

    return adjacency;
}

// BFS over the room graph to find how far each room is (in rooms, not tiles).
// Used to place the exit as far from the start as possible.
function roomBfsDist(adjacency, startIdx) {
    const dist = new Array(adjacency.length).fill(-1);
    dist[startIdx] = 0;
    const q = [startIdx];
    while (q.length) {
        const cur = q.shift();
        for (const nb of adjacency[cur]) {
            if (dist[nb] === -1) { dist[nb] = dist[cur] + 1; q.push(nb); }
        }
    }
    return dist;
}

// Find every DOOR tile on the room's wall ring.
function findRoomDoorTiles(r) {
    const doors = [];
    for (let x = r.x - 1; x <= r.x + r.w; x++) {
        for (let y = r.y - 1; y <= r.y + r.h; y++) {
            if (!onRoomBorder(r, x, y)) continue;
            if (tileAt(x, y) === TILE.DOOR) doors.push({ x, y });
        }
    }
    return doors;
}

// Any walkable border tile that opens inward. Fallback only - used when a
// room somehow has no DOOR tile on its border (very unlikely with the
// current carver, but cheap insurance against an unwinnable run).
function findRoomEntranceTiles(r) {
    const entrances = [];
    for (let x = r.x - 1; x <= r.x + r.w; x++) {
        for (let y = r.y - 1; y <= r.y + r.h; y++) {
            if (!onRoomBorder(r, x, y)) continue;
            if (!inBounds(x, y)) continue;
            if (!isWalkableTile(grid[y][x])) continue;
            const inward = [];
            if (x === r.x - 1) inward.push({ x: x + 1, y });
            if (x === r.x + r.w) inward.push({ x: x - 1, y });
            if (y === r.y - 1) inward.push({ x, y: y + 1 });
            if (y === r.y + r.h) inward.push({ x, y: y - 1 });
            const opensIntoRoom = inward.some(p =>
                inBounds(p.x, p.y) && pointInRoom(r, p.x, p.y) && isWalkableTile(tileAt(p.x, p.y))
            );
            if (opensIntoRoom) entrances.push({ x, y });
        }
    }
    return entrances;
}

// Reduce a room down to a single entrance. This deliberately checks every
// walkable border opening, not only TILE.DOOR, because an accidental FLOOR gap
// is just as capable of bypassing a locked vault/exit. All extras are walled
// off so the special room has exactly one possible entry point.
function sealRoomToSingleDoor(room, reachable = null) {
    const entries = findRoomEntranceTiles(room);
    if (!entries.length) return null;

    const scoreEntry = entry => {
        if (!reachable) return Math.random();
        const outside = roomOutsidePoint(room, entry);
        return inBounds(outside.x, outside.y) && reachable[outside.y][outside.x] ? 0 : 1;
    };
    entries.sort((a, b) => scoreEntry(a) - scoreEntry(b));
    const bestScore = scoreEntry(entries[0]);
    const bestCandidates = entries.filter(e => scoreEntry(e) === bestScore);
    const kept = pick(bestCandidates);
    entries.forEach(d => { if (d.x !== kept.x || d.y !== kept.y) grid[d.y][d.x] = TILE.WALL; });
    return kept;
}

// Last-resort: open a WALL tile on the room's border that has a walkable
// neighbour outside. Only fires if the room ended up with no entrance at
// all, which would otherwise make the run unwinnable.
function forceExitDoor(room) {
    for (let x = room.x - 1; x <= room.x + room.w; x++) {
        for (let y = room.y - 1; y <= room.y + room.h; y++) {
            if (!onRoomBorder(room, x, y)) continue;
            if (!inBounds(x, y)) continue;
            if (grid[y][x] !== TILE.WALL) continue;
            let ox = x, oy = y;
            if (x === room.x - 1) ox = x - 1;
            else if (x === room.x + room.w) ox = x + 1;
            else if (y === room.y - 1) oy = y - 1;
            else if (y === room.y + room.h) oy = y + 1;
            if (!inBounds(ox, oy)) continue;
            if (!isWalkableTile(grid[oy][ox])) continue;
            grid[y][x] = TILE.RED_DOOR;
            return { x, y };
        }
    }
    return null;
}

// Pick a random walkable, unoccupied tile inside a room. `exclude` avoids
// stacking two items on the same spot (or on the player).
function freeFloorTile(r, exclude = []) {
    const candidates = [];
    for (let y = r.y; y < r.y + r.h; y++) {
        for (let x = r.x; x < r.x + r.w; x++) {
            if (exclude.some(e => e.x === x && e.y === y)) continue;
            if (grid[y][x] === TILE.FLOOR && !enemyAt(x, y) && !itemAt(x, y) && !(player && player.x === x && player.y === y)) candidates.push({ x, y });
        }
    }
    return candidates.length ? pick(candidates) : roomCenter(r);
}

// Try to bolt a small secret room onto one side of a host room. It must
// fit inside the grid, not overlap anything, and have a wall tile for the door.
function tryAddSecretRoom(hostRoom, allRooms) {
    const sides = shuffle(['top', 'bottom', 'left', 'right']);
    for (const side of sides) {
        const sw = randInt(3, 4), sh = randInt(3, 4);
        let sx, sy, doorX, doorY;
        if (side === 'top') {
            sx = hostRoom.x + randInt(0, Math.max(0, hostRoom.w - sw));
            sy = hostRoom.y - 1 - sh;
            doorX = sx + (sw >> 1); doorY = hostRoom.y - 1;
        } else if (side === 'bottom') {
            sx = hostRoom.x + randInt(0, Math.max(0, hostRoom.w - sw));
            sy = hostRoom.y + hostRoom.h + 1;
            doorX = sx + (sw >> 1); doorY = hostRoom.y + hostRoom.h;
        } else if (side === 'left') {
            sx = hostRoom.x - 1 - sw;
            sy = hostRoom.y + randInt(0, Math.max(0, hostRoom.h - sh));
            doorX = hostRoom.x - 1; doorY = sy + (sh >> 1);
        } else {
            sx = hostRoom.x + hostRoom.w + 1;
            sy = hostRoom.y + randInt(0, Math.max(0, hostRoom.h - sh));
            doorX = hostRoom.x + hostRoom.w; doorY = sy + (sh >> 1);
        }
        const candidate = { x: sx, y: sy, w: sw, h: sh, type: 'secret', entered: false };
        if (sx < 1 || sy < 1 || sx + sw > gridW - 1 || sy + sh > gridH - 1) continue;
        if (allRooms.some(r => rectsOverlap(candidate, r, 1))) continue;
        if (!inBounds(doorX, doorY) || grid[doorY][doorX] !== TILE.WALL) continue;
        // The interior must be entirely untouched wall - no clipping into existing space.
        let clear = true;
        for (let y = sy; y < sy + sh && clear; y++) {
            for (let x = sx; x < sx + sw; x++) if (grid[y][x] !== TILE.WALL) { clear = false; break; }
        }
        if (!clear) continue;
        carveRoom(candidate);
        grid[doorY][doorX] = TILE.SECRET_DOOR;
        return candidate;
    }
    return null;
}

// Avoid repeating the same theme two floors in a row (unless floor 1).
function chooseFloorTheme() {
    const candidates = FLOOR_THEMES.filter(t => t.id !== floorTheme.id || floor <= 1);
    floorTheme = pick(candidates.length ? candidates : FLOOR_THEMES);
}

// Assign the various room roles. Start/exit/vaults are fixed; everything
// else is shuffled into the remaining special slots.
function assignRoomTypes(adjacency, startIdx, exitIdx, vaultIdxs) {
    rooms.forEach(r => { r.type = 'normal'; r.entered = false; });
    rooms[startIdx].type = 'start';
    rooms[exitIdx].type = floor >= MAX_FLOOR ? 'boss' : 'exit';
    vaultIdxs.forEach(i => rooms[i].type = 'vault');
    const candidates = rooms.map((r, i) => i).filter(i => ![startIdx, exitIdx, ...vaultIdxs].includes(i));
    shuffle(candidates);
    const specialTypes = ['shrine', 'armory', 'treasury', 'gauntlet', 'library', 'healing'];
    const count = gridW > 38 ? 5 : gridW > 30 ? 4 : 3;
    specialTypes.slice(0, count).forEach(type => { if (candidates.length) rooms[candidates.shift()].type = type; });
}

function spawnEnemy(room, type, elite = false, forcedSpot = null) {
    const spot = forcedSpot || freeFloorTile(room);
    const diff = DIFFICULTY_PRESETS[difficultyKey];
    // HP/damage scales linearly with floor depth; elites get a flat multiplier.
    const floorMult = 1 + (floor - 1) * 0.14;
    const eliteMult = elite ? 1.6 : 1;
    const hp = Math.round(type.hp * diff.enemyHpMult * floorMult * eliteMult);
    const enemy = {
        x: spot.x, y: spot.y, type, hp, maxHp: hp,
        dmgMult: diff.enemyDmgMult * floorMult * floorTheme.enemyDamage * (elite ? 1.3 : 1),
        elite, alive: true, roomId: roomIndexOf(room), statuses: {}, hidden: type.ai === 'ambusher', windup: false, retreatNext: false,
    };
    // Theme hook may bump HP (e.g. Catacombs vs undead) - re-sync after.
    floorTheme.onEnemySpawn?.(enemy);
    enemy.maxHp = Math.max(enemy.maxHp, enemy.hp);
    enemy.hp = enemy.maxHp;
    enemies.push(enemy);
    return enemy;
}

function roomIndexOf(room) { return rooms.indexOf(room); }
function weaponById(id) { return WEAPONS.find(w => w.id === id) || WEAPONS[0]; }

// Pick a random weapon in a tier window - used for armory/loot drops.
function randomWeaponAtTier(minTier, maxTier = WEAPONS.length - 1) {
    const lo = clamp(minTier, 1, WEAPONS.length - 1);
    const hi = clamp(maxTier, lo, WEAPONS.length - 1);
    return pick(WEAPONS.filter(w => w.tier >= lo && w.tier <= hi));
}

// Main floor generator. Wipes the previous floor and rebuilds everything.
const VAULT_SPAWN_CHANCE = 0.28;

function getUnlockedReachable(start) {
    const reachable = Array.from({ length: gridH }, () => Array(gridW).fill(false));
    if (!start || !inBounds(start.x, start.y)) return reachable;
    const queue = [start];
    reachable[start.y][start.x] = true;
    for (let head = 0; head < queue.length; head++) {
        const cur = queue[head];
        for (const d of DIRS4) {
            const nx = cur.x + d.x, ny = cur.y + d.y;
            if (!inBounds(nx, ny) || reachable[ny][nx]) continue;
            const tile = tileAt(nx, ny);
            if (!isWalkableTile(tile) || tile === TILE.RED_DOOR || tile === TILE.GOLD_DOOR || tile === TILE.SECRET_DOOR) continue;
            reachable[ny][nx] = true;
            queue.push({ x: nx, y: ny });
        }
    }
    return reachable;
}

function getReachableIgnoringLocks(start, ignoredLocks = []) {
    const ignored = new Set(ignoredLocks);
    const reachable = Array.from({ length: gridH }, () => Array(gridW).fill(false));
    if (!start || !inBounds(start.x, start.y)) return reachable;
    const queue = [start];
    reachable[start.y][start.x] = true;
    for (let head = 0; head < queue.length; head++) {
        const cur = queue[head];
        for (const d of DIRS4) {
            const nx = cur.x + d.x, ny = cur.y + d.y;
            if (!inBounds(nx, ny) || reachable[ny][nx]) continue;
            const tile = tileAt(nx, ny);
            if (!isWalkableTile(tile)) continue;
            if (!ignored.has(tile) && (tile === TILE.RED_DOOR || tile === TILE.GOLD_DOOR || tile === TILE.SECRET_DOOR)) continue;
            reachable[ny][nx] = true;
            queue.push({ x: nx, y: ny });
        }
    }
    return reachable;
}

function roomHasReachableTile(room, reachable) {
    for (let y = room.y; y < room.y + room.h; y++) {
        for (let x = room.x; x < room.x + room.w; x++) {
            if (reachable[y]?.[x]) return true;
        }
    }
    return false;
}

function adjacentReachableToDoor(room, door, reachable) {
    if (!door) return false;
    const outside = roomOutsidePoint(room, door);
    return inBounds(outside.x, outside.y) && Boolean(reachable[outside.y][outside.x]);
}

function reachableRoomPool(reachable, exclude = []) {
    return rooms.filter((r, i) => !exclude.includes(i) && roomHasReachableTile(r, reachable));
}

function findCriticalPlacementRoom(startRoom, exitIdx, vaultRooms, reachable) {
    const excluded = [exitIdx, ...vaultRooms.map(r => roomIndexOf(r))];
    const candidates = reachableRoomPool(reachable, excluded);
    return candidates.length ? pick(candidates) : startRoom;
}

function validateDungeonProgression(startRoom, exitRoom, exitDoor, vaultRooms, keyItems) {
    const start = roomCenter(startRoom);
    const base = getUnlockedReachable(start);
    const structuralReach = getReachableIgnoringLocks(start, [TILE.RED_DOOR, TILE.GOLD_DOOR, TILE.SECRET_DOOR]);
    // Every generated room must belong to the connected dungeon graph before
    // keys/locks are considered. This catches stray islands and dead-end room
    // islands that the logical adjacency graph can otherwise miss.
    if (!rooms.every(r => roomHasReachableTile(r, structuralReach))) return false;
    if (!roomHasReachableTile(startRoom, base)) return false;
    if (!keyItems.some(k => k.type === 'redkey' && base[k.y]?.[k.x])) return false;
    if (!adjacentReachableToDoor(exitRoom, exitDoor, base)) return false;
    for (const key of keyItems.filter(k => k.type === 'goldkey')) {
        if (!base[key.y]?.[key.x]) return false;
    }

    // Once the red key is available, the stair room itself must be traversable.
    const afterRed = getReachableIgnoringLocks(start, [TILE.RED_DOOR]);
    const stairs = [];
    for (let y = exitRoom.y; y < exitRoom.y + exitRoom.h; y++) {
        for (let x = exitRoom.x; x < exitRoom.x + exitRoom.w; x++) {
            if (tileAt(x, y) === TILE.STAIRS) stairs.push({ x, y });
        }
    }
    if (!stairs.some(p => afterRed[p.y]?.[p.x])) return false;

    // Vaults are optional, but every generated vault must actually be reachable
    // after spending the corresponding gold key.
    if (vaultRooms.length) {
        const afterGold = getReachableIgnoringLocks(start, [TILE.RED_DOOR, TILE.GOLD_DOOR]);
        for (const vr of vaultRooms) {
            const door = findRoomDoorTiles(vr).find(d => tileAt(d.x, d.y) === TILE.GOLD_DOOR) ||
                findRoomEntranceTiles(vr).find(d => tileAt(d.x, d.y) === TILE.GOLD_DOOR);
            if (!door || !adjacentReachableToDoor(vr, door, afterGold) && !roomHasReachableTile(vr, afterGold)) return false;
        }
    }
    return true;
}

function buildDungeon() {
    const preset = SIZE_PRESETS[sizeKey];
    gridW = preset.w; gridH = preset.h;
    grid = Array.from({ length: gridH }, () => Array(gridW).fill(TILE.WALL));
    discovered = Array.from({ length: gridH }, () => Array(gridW).fill(false));
    visible = Array.from({ length: gridH }, () => Array(gridW).fill(false));
    enemies = []; items = []; secretRoom = null; boss = null; currentRoomId = null;
    chooseFloorTheme();

    rooms = generateRooms(gridW, gridH, preset.rooms);
    rooms.forEach(carveRoom);
    const adjacency = connectRooms(rooms);
    const startIdx = 0;
    const startRoom = rooms[startIdx];

    // Rank every non-start room: leaves first (dead-ends), then by BFS
    // distance from the start, descending. The exit takes slot #0; vaults
    // take the next slots. This replaces the old "pick the exit by max
    // score, THEN filter for leaves" flow, which could - and in practice
    // almost always did - leave the vault filter with zero candidates:
    // the exit's +100 leaf bonus scooped up the only leaf the chain graph
    // produced. Ranking once and slicing guarantees we always fill both
    // slots even when the random extra corridor edges ate every leaf.
    const dist = roomBfsDist(adjacency, startIdx);
    const ranked = rooms.map((r, i) => i)
        .filter(i => i !== startIdx)
        .sort((a, b) => {
            const leafA = adjacency[a].size === 1 ? 1 : 0;
            const leafB = adjacency[b].size === 1 ? 1 : 0;
            if (leafA !== leafB) return leafB - leafA;
            const distA = dist[a] === -1 ? 0 : dist[a];
            const distB = dist[b] === -1 ? 0 : dist[b];
            return distB - distA;
        });
    const exitIdx = ranked[0];

    // Lock the exit behind a SINGLE red door.
    // The exit room may genuinely have more than one carved entrance (extra
    // edges in the room graph produce cycles). Locking only one would leave
    // the stairs reachable through the others without the key, so the
    // extras get walled off instead - the room then has exactly one door,
    // surrounded by the wall ring it was always supposed to have.
    const baseReachable = getUnlockedReachable(roomCenter(startRoom));
    const exitRoom = rooms[exitIdx];
    const exitDoor = sealRoomToSingleDoor(exitRoom, baseReachable);
    let exitDoors = [];
    if (exitDoor) {
        grid[exitDoor.y][exitDoor.x] = TILE.RED_DOOR;
        exitDoors = [exitDoor];
    } else {
        // Should never happen, but if it does, force-open a wall tile
        // that touches an existing walkable tile outside the room.
        const forced = forceExitDoor(exitRoom);
        if (forced) {
            exitDoors = [forced];
            log('A sealed way opens in the stair hall.', 'log-entry-loot');
        }
    }
    const stairsSpot = freeFloorTile(exitRoom, exitDoors);
    grid[stairsSpot.y][stairsSpot.x] = TILE.STAIRS;

    // Vaults are optional bonus content. A floor has a 28% chance to get one,
    // and never more than one, which keeps Gold Keys from becoming routine
    // progression on every floor, especially Floor 1.
    const vaultCount = Math.random() < VAULT_SPAWN_CHANCE ? 1 : 0;
    const vaultCandidates = ranked.filter(i => i !== exitIdx && adjacency[i].size === 1);
    const vaultIdxs = vaultCount ? [vaultCandidates[0] ?? ranked.find(i => i !== exitIdx)] : [];
    const vaultRooms = [];
    const sealedVaultIdxs = [];
    vaultIdxs.forEach(idx => {
        const r = rooms[idx];
        const doorTile = sealRoomToSingleDoor(r, baseReachable);
        if (doorTile) {
            grid[doorTile.y][doorTile.x] = TILE.GOLD_DOOR;
            vaultRooms.push(r);
            sealedVaultIdxs.push(idx);
            console.log(`[Dungeon] Floor ${floor}: vault room spawned at room #${idx} ` +
                `(x=${r.x}, y=${r.y}, w=${r.w}, h=${r.h}); gold door at (${doorTile.x}, ${doorTile.y}).`);
        } else {
            console.log(`[Dungeon] Floor ${floor}: vault candidate room #${idx} had no entrance - skipped.`);
        }
    });
    console.log(`[Dungeon] Floor ${floor}: ${vaultRooms.length} vault room(s) spawned ` +
        `(ranked=${ranked.length}, requested=${vaultCount}).`);

    // Pass the SEALED list, not the raw picks: a vault whose door couldn't
    // be carved would otherwise be tagged 'vault' but have no gold door on
    // it, and get populated as a normal room - reachable without a key.
    assignRoomTypes(adjacency, startIdx, exitIdx, sealedVaultIdxs);

    // Try to attach a secret room to any non-start/non-exit host until one sticks.
    const secretHostPool = rooms.filter((r, i) => i !== startIdx && i !== exitIdx && !vaultRooms.includes(r));
    shuffle(secretHostPool);
    for (const host of secretHostPool) {
        secretRoom = tryAddSecretRoom(host, [...rooms, ...(secretRoom ? [secretRoom] : [])]);
        if (secretRoom) break;
    }

    const allFloorRooms = secretRoom ? [...rooms, secretRoom] : rooms;
    allFloorRooms.forEach((r, i) => { r.floorHue = FLOOR_HUES[i % FLOOR_HUES.length]; });

    const spawn = roomCenter(startRoom);
    player.x = spawn.x; player.y = spawn.y;

    // Keys are placed only in rooms reachable without opening a locked door.
    // This prevents a key from accidentally spawning behind the lock it is
    // supposed to solve, and the fallback to the start room makes the safety
    // invariant explicit rather than relying on random room connectivity.
    const reachableForKeys = getUnlockedReachable(roomCenter(startRoom));
    const redKeyRoom = findCriticalPlacementRoom(startRoom, exitIdx, vaultRooms, reachableForKeys);
    const redKeySpot = freeFloorTile(redKeyRoom);
    items.push({ x: redKeySpot.x, y: redKeySpot.y, type: 'redkey' });
    console.log(`[Dungeon] Floor ${floor}: red key spawned at (${redKeySpot.x}, ${redKeySpot.y}).`);

    vaultRooms.forEach(() => {
        const goldKeyRoom = findCriticalPlacementRoom(startRoom, exitIdx, vaultRooms, reachableForKeys);
        const spot = freeFloorTile(goldKeyRoom);
        items.push({ x: spot.x, y: spot.y, type: 'goldkey' });
        console.log(`[Dungeon] Floor ${floor}: gold key spawned at (${spot.x}, ${spot.y}).`);
    });

    // Each vault gets a weapon, a gold pile, and an elite guard.
    vaultRooms.forEach(vr => {
        const weapon = randomWeaponAtTier(1 + Math.floor((floor - 1) / 3), 3 + Math.floor((floor - 2) / 5));
        const spot1 = freeFloorTile(vr);
        items.push({ x: spot1.x, y: spot1.y, type: 'weapon', weaponId: weapon.id });
        const spot2 = freeFloorTile(vr, [spot1]);
        items.push({ x: spot2.x, y: spot2.y, type: 'gold', amount: Math.round((randInt(15, 30) + floor * 3) * floorTheme.goldMult), roomIndex: roomIndexOf(vr) });
        const guardPool = ENEMY_TYPES.filter(e => e.minFloor <= floor + 1);
        spawnEnemy(vr, pick(guardPool.length ? guardPool : [ENEMY_TYPES[0]]), true);
    });

    // Populate every other room with enemies, gold, potions, and occasional loot.
    const specialRooms = new Set(['start', 'exit', 'boss', 'vault']);
    rooms.forEach((r, i) => {
        if (specialRooms.has(r.type)) return;
        const diff = DIFFICULTY_PRESETS[difficultyKey];
        let enemyCount = Math.round(randInt(0, 2) * diff.enemyCountMult) + (Math.random() < 0.45 ? 1 : 0);
        if (floorTheme.id === 'hunt') enemyCount += 1;
        if (r.type === 'gauntlet') enemyCount = Math.max(1, enemyCount);
        if (r.type === 'healing' || r.type === 'library') enemyCount = Math.min(enemyCount, 1);
        for (let n = 0; n < enemyCount; n++) {
            const pool = ENEMY_TYPES.filter(e => e.minFloor <= floor);
            const spawned = spawnEnemy(r, pick(pool.length ? pool : [ENEMY_TYPES[0]]), false);
            // Track gauntlet enemies so I can detect when the room is cleared.
            if (r.type === 'gauntlet') {
                if (!r.enemyIds) r.enemyIds = [];
                r.enemyIds.push(spawned);
            }
        }
        if (r.type === 'treasury') {
            // Treasury rooms always get a couple of big piles.
            for (let n = 0; n < 2; n++) {
                const spot = freeFloorTile(r);
                items.push({ x: spot.x, y: spot.y, type: 'gold', amount: Math.round((randInt(8, 18) + floor) * floorTheme.goldMult), roomIndex: i });
            }
        } else if (Math.random() < 0.6) {
            const spot = freeFloorTile(r);
            items.push({ x: spot.x, y: spot.y, type: 'gold', amount: Math.round((randInt(2, 8) + floor) * floorTheme.goldMult), roomIndex: i });
        }
        const potionChance = r.type === 'healing' ? 0.75 : 0.35;
        if (Math.random() < potionChance) {
            const spot = freeFloorTile(r);
            items.push({ x: spot.x, y: spot.y, type: 'potion' });
        }
        if (Math.random() < (r.type === 'armory' ? 0.7 : 0.18)) {
            const spot = freeFloorTile(r);
            // Weapon tier scales gently with depth, capped at tier 3 for floor drops.
            const tier = Math.min(3, 1 + Math.floor((floor - 1) / 3));
            items.push({ x: spot.x, y: spot.y, type: 'weapon', weaponId: WEAPONS[randInt(1, tier)].id });
        }
    });

    if (secretRoom) secretRoom.type = 'secret';

    const lockedExitDoor = exitDoors[0] || exitDoor;
    if (!validateDungeonProgression(startRoom, exitRoom, lockedExitDoor, vaultRooms, items)) {
        console.warn(`[Dungeon] Floor ${floor}: critical progression validation failed. Rebuilding this floor.`);
        // Generation bugs should hopefully never become a player-facing unwinnable floor.
        // Re-seeding the layout is safer than trying to patch a half-populated map (I think?).
        const retry = floorBuildRetryCount;
        if (retry < 12) {
            floorBuildRetryCount++;
            buildDungeon();
            floorBuildRetryCount = retry;
            return;
        }
        console.error('[Dungeon] Floor generation exceeded the retry budget; keeping the best available layout.');
    }

    floorBuildRetryCount = 0;
    if (floor >= MAX_FLOOR) {
        spawnBoss(exitRoom);
    }
}

function spawnBoss(exitRoom) {
    const spot = freeFloorTile(exitRoom, [{ x: player.x, y: player.y }]);
    // Boss is just a hand-rolled enemy object with a unique type + phase flags.
    boss = {
        x: spot.x, y: spot.y, hp: 95, maxHp: 95, alive: true, roomId: roomIndexOf(exitRoom),
        type: { id: 'crypt_warden', name: 'Crypt Warden', icon: '👑', dmg: [5, 8], ai: 'boss', gold: [20, 35], tags: ['undead'] },
        dmgMult: DIFFICULTY_PRESETS[difficultyKey].enemyDmgMult * 1.1,
        elite: true, statuses: {}, windup: false, turn: 0, phase2: false, phase3: false,
    };
    enemies.push(boss);
    log('The Crypt Warden seals the sanctuary. Defeat it before you can escape.', 'log-entry-danger');
}

// --- Vision ------------------------------------------------------------------
// Standard Bresenham line - if any tile between us blocks sight, this fails.
function hasLineOfSight(x0, y0, x1, y1) {
    let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    let sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy, x = x0, y = y0;
    while (true) {
        if (x === x1 && y === y1) return true;
        if (!(x === x0 && y === y0) && !isOpenForVision(x, y)) return false;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x += sx; }
        if (e2 <= dx) { err += dx; y += sy; }
    }
}
function visionRadius() {
    let radius = floorTheme.vision;
    if (hasBoon('scouting')) radius += 1;
    return radius;
}

// Treasure Sense extends the shimmer range; Pathfinder gives a small bump too.
function secretHintRadius() { return hasBoon('treasure_sense') ? 3 : hasBoon('scouting') ? 2 : 1; }

// Rebuild `visible` (line of sight) and OR the results into `discovered` (memory).
function recomputeVisibility() {
    visible = Array.from({ length: gridH }, () => Array(gridW).fill(false));
    const px = player.x, py = player.y, vr = visionRadius();
    for (let y = Math.max(0, py - vr); y <= Math.min(gridH - 1, py + vr); y++) {
        for (let x = Math.max(0, px - vr); x <= Math.min(gridW - 1, px + vr); x++) {
            if (Math.max(Math.abs(x - px), Math.abs(y - py)) > vr) continue;
            if (hasLineOfSight(px, py, x, y)) {
                visible[y][x] = true;
                discovered[y][x] = true;
            }
        }
    }
}

// --- Rendering ---------------------------------------------------------------

// Fit the game panel to the remaining viewport height. This is what stops the
// page from scrolling on a laptop - the panel becomes exactly as tall as the
// space between its top edge and the bottom of the viewport (with a small gap),
// and everything inside flexes to share that height.
function fitGamePanel() {
    if (!gamePanelEl) return;
    // Document-relative top of the panel (safe even if the page is scrolled).
    const top = gamePanelEl.getBoundingClientRect().top + window.scrollY;
    const available = window.innerHeight - top - 12;
    // Clamp so tiny windows still render something usable, and huge monitors
    // don't stretch the panel to absurd heights.
    const height = clamp(available, 520, 1400);
    gamePanelEl.style.height = height + 'px';
}

// Cell size considers BOTH available width and available height.
function computeCellSize() {
    const wrap = boardEl.parentElement;
    // Reserve a little room for the board's own padding + the 1px gaps.
    const availableW = Math.max(0, wrap.clientWidth - 12);
    const availableH = Math.max(0, wrap.clientHeight - 12);
    const byW = Math.floor(availableW / gridW) - 1;
    const byH = Math.floor(availableH / gridH) - 1;
    const base = Math.min(byW, byH);
    const preset = SIZE_PRESETS[sizeKey] || SIZE_PRESETS.small;
    const clamped = Math.max(12, Math.min(preset.cellMax, base));
    boardEl.style.setProperty('--cell-size', clamped + 'px');
}

function itemClass(type) {
    switch (type) {
        case 'gold': case 'secretgold': return 'item-gold';
        case 'potion': return 'item-potion';
        case 'redkey': return 'item-key-red';
        case 'goldkey': return 'item-key-gold';
        case 'weapon': return 'item-weapon';
        default: return '';
    }
}

function itemIcon(item) {
    switch (item.type) {
        case 'gold': return '💰';
        case 'secretgold': return '💎';
        case 'potion': return '🧪';
        case 'redkey': return '🔑';
        case 'goldkey': return '🗝️';
        case 'weapon': return weaponById(item.weaponId).icon;
        default: return '';
    }
}

function syncLogPanelWidth() {
    if (!logEl || !boardEl) return;
    const width = boardEl.getBoundingClientRect().width;
    if (width > 0) logEl.style.width = width + 'px';
}

// Full board rebuild every render. Cheap enough at this grid size and
// keeps the logic simple - no diffing needed.
function renderBoard() {
    computeCellSize();
    boardEl.style.gridTemplateColumns = `repeat(${gridW}, var(--cell-size))`;
    boardEl.innerHTML = '';
    for (let y = 0; y < gridH; y++) {
        for (let x = 0; x < gridW; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            const seen = discovered[y][x], inView = visible[y][x], tile = grid[y][x];
            if (!seen) { cell.classList.add('fogged'); boardEl.appendChild(cell); continue; }
            switch (tile) {
                case TILE.WALL: cell.classList.add('wall'); break;
                case TILE.FLOOR: {
                    cell.classList.add('floor');
                    const floorRoom = roomAt(x, y);
                    if (floorRoom && floorRoom.floorHue !== undefined) cell.style.setProperty('--floor-hue', floorRoom.floorHue);
                    break;
                }
                // Map features (doors, stairs) stay visible on remembered
                // tiles so the player can navigate back to them. Only
                // *entities* (enemies, items) are hidden when not in view.
                case TILE.DOOR:
                    cell.classList.add('door');
                    cell.textContent = '🚪';
                    break;
                case TILE.RED_DOOR:
                    cell.classList.add('door-red');
                    cell.textContent = '🔒';
                    break;
                case TILE.GOLD_DOOR:
                    cell.classList.add('door-gold');
                    cell.textContent = '🔒';
                    break;
                case TILE.STAIRS:
                    cell.classList.add('floor', 'stairs');
                    cell.textContent = '⬇';
                    break;
                case TILE.SECRET_DOOR:
                    // Secret doors render as walls, but shimmer when close enough.
                    cell.classList.add('wall');
                    if (Math.max(Math.abs(x - player.x), Math.abs(y - player.y)) <= secretHintRadius()) cell.classList.add('secret-hint');
                    break;
                default: cell.classList.add('floor');
            }
            // Entities only show on currently-visible tiles.
            if (inView) {
                const enemy = enemyAt(x, y);
                const item = itemAt(x, y);
                if (enemy) {
                    cell.classList.add('enemy-cell', 'entity-icon');
                    if (enemy.elite) cell.classList.add('elite');
                    if (enemy.hidden) cell.classList.add('hidden-enemy');
                    if (enemy.windup) cell.classList.add('windup');
                    if (enemy._hitFlash) { cell.classList.add('hit-flash'); enemy._hitFlash = false; }
                    cell.textContent = enemy.type.icon;
                } else if (item) {
                    cell.classList.add(itemClass(item.type), 'entity-icon');
                    cell.textContent = itemIcon(item);
                }
            } else cell.classList.add('dim');
            if (x === player.x && y === player.y) {
                cell.classList.add('player-cell');
                if (player._hitFlash) { cell.classList.add('player-hit'); player._hitFlash = false; }
            }
            boardEl.appendChild(cell);
        }
    }
    syncLogPanelWidth();
}

function renderHud() {
    floorLabelEl.textContent = `Floor ${floor}`;
    floorThemeEl.textContent = `${floorTheme.icon} ${floorTheme.name}`;
    const hpPct = Math.max(0, Math.round((player.hp / player.maxHp) * 100));
    hpFillEl.style.width = hpPct + '%';
    hpFillEl.className = 'hp-fill' + (hpPct <= 25 ? ' danger' : hpPct <= 55 ? ' warn' : '');
    hpTextEl.textContent = `${Math.max(0, player.hp)} / ${player.maxHp}`;
    goldCountEl.textContent = `💰 ${player.gold}`;
    weaponIconEl.textContent = player.weapon.icon;
    weaponNameEl.textContent = player.weapon.name;
    weaponChip.title = `${player.weapon.name}: ${player.weapon.description}`;
    // Boon chip shows the first boon + a "+N" for the rest, full list on hover.
    const boonText = player.boons.length ? player.boons.map(b => b.name).join(' • ') : 'No Boons';
    boonNameEl.textContent = player.boons.length ? `${player.boons[0].icon} ${player.boons[0].name}${player.boons.length > 1 ? ` +${player.boons.length - 1}` : ''}` : 'No Boons';
    boonChip.title = boonText;
    const room = roomAt(player.x, player.y);
    roomNameEl.textContent = room ? roomTypeName(room) : 'Corridor';
    roomChip.title = room?.type === 'secret' ? 'Secret Chamber. Its reward is on the house.' : (floorTheme.desc || 'Current room.');
    redKeyDot.classList.toggle('active', player.hasRedKey);
    redKeyStatusEl.textContent = player.hasRedKey ? 'Have Red Key' : 'No Red Key';
    goldKeyDot.classList.toggle('active', player.goldKeys > 0);
    goldKeyStatusEl.textContent = `${player.goldKeys} Gold Key${player.goldKeys === 1 ? '' : 's'}`;
    potionCountEl.textContent = player.potions;
}

function render() { recomputeVisibility(); renderBoard(); renderHud(); }

// --- Boons & choices ---------------------------------------------------------
function addBoon(boon) {
    if (!boon || hasBoon(boon.id)) return;
    player.boons.push(boon);
    // Some boons change max HP immediately.
    if (boon.id === 'iron_will') player.maxHp += 3;
    if (boon.id === 'glass_fang') player.maxHp = Math.max(1, player.maxHp - 2);
    player.hp = Math.min(player.maxHp, player.hp + (boon.id === 'iron_will' ? 3 : 0));
    playSecretSound();
    log(`You gain the boon ${boon.name}: ${boon.desc}`, 'log-entry-good');
}

// Helper - paints the currently focused choice card so keyboard navigation
// has a visible selection state.
function updateChoiceFocus() {
    const cards = choiceOptionsEl.querySelectorAll('.choice-card');
    cards.forEach((c, i) => c.classList.toggle('choice-focused', i === choiceIndex));
    cards[choiceIndex]?.focus();
}

// Generic modal for boons/weapons/secret rewards. The overlay blocks input
// until the player clicks a card (or presses Space on the focused card).
function openChoice({ kicker = 'DISCOVERY', title, description, options }) {
    choicePending = true;
    choiceIndex = 0;
    choiceKickerEl.textContent = kicker;
    choiceTitleEl.textContent = title;
    choiceDescriptionEl.textContent = description;
    choiceOptionsEl.innerHTML = '';
    options.forEach((option, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `choice-card ${option.kind || ''}`;
        button.innerHTML = `<span class="choice-icon">${option.icon || '◆'}</span><span class="choice-copy"><strong>${option.title}</strong><small>${option.desc}</small></span>`;
        button.addEventListener('click', () => {
            const result = option.choose?.();
            choicePending = false;
            choiceOverlay.classList.remove('show');
            choiceOverlay.setAttribute('aria-hidden', 'true');
            if (result) log(result, 'log-entry-good');
            // Picking a reward burns the turn - enemies act now.
            if (!gameOver) {
                enemyTurnStep();
                render();
            }
        }, { once: true });
        choiceOptionsEl.appendChild(button);
        if (index === 0) setTimeout(() => button.focus(), 0);
    });
    choiceOverlay.classList.add('show');
    choiceOverlay.setAttribute('aria-hidden', 'false');
    updateChoiceFocus();
    render();
}

function chooseBoon(title = 'Choose a Boon', kicker = 'RUN BUILD', count = 3) {
    const pool = shuffle([...availableBoons()]).slice(0, count);
    // Out of boons? Convert the reward to gold instead of nothing.
    if (!pool.length) {
        player.gold += 20;
        log('You have discovered every boon. The shrine grants 20 gold instead.', 'log-entry-loot');
        return;
    }
    openChoice({
        kicker,
        title,
        description: 'This choice becomes part of the rest of your run. Pick the effect that changes how you want to play.',
        options: pool.map(boon => ({
            icon: boon.icon,
            title: boon.name,
            desc: boon.desc,
            choose: () => { addBoon(boon); return `${boon.icon} ${boon.name} joins your build.`; },
        })),
    });
}

// Armory offers weapons strictly better than your current tier (or equal),
// and never your current weapon.
function chooseArmoryWeapon() {
    const minTier = Math.min(WEAPONS.length - 1, Math.max(1, player.weapon.tier + (Math.random() < 0.65 ? 0 : 1)));
    const pool = WEAPONS.filter(w => w !== player.weapon && w.tier >= minTier);
    const options = shuffle(pool.length ? pool : WEAPONS.slice(1)).slice(0, 3).map(w => ({
        icon: w.icon,
        title: w.name,
        desc: `${w.description} Damage ${w.dmg[0]}-${w.dmg[1]}.`,
        choose: () => {
            const old = player.weapon;
            player.weapon = w;
            return `You equip the ${w.name}. ${old.name} stays behind.`;
        },
    }));
    openChoice({
        kicker: 'ARMORY',
        title: 'Choose Your Weapon',
        description: 'The armory offers several styles. Here, identity matters as much as raw tier.',
        options,
    });
}

// Secret rooms always offer: the legendary hammer, one random boon, or a big gold pile.
function triggerSecretRoom(room) {
    if (room.entered) return;
    room.entered = true;
    playSecretSound();
    const legendary = WEAPONS[WEAPONS.length - 1];
    const options = [
        {
            icon: legendary.icon, title: legendary.name,
            desc: legendary.description,
            choose: () => { player.weapon = legendary; return `You uncover the ${legendary.name}.`; },
        },
        ...shuffle([...availableBoons()]).slice(0, 1).map(boon => ({
            icon: boon.icon, title: boon.name, desc: boon.desc,
            choose: () => { addBoon(boon); return `The secret chamber grants ${boon.name}.`; },
        })),
        {
            icon: '💎', title: 'Bottomless Hoard',
            desc: `Take ${55 + floor * 8} gold. Fortune becomes your build for a moment.`,
            choose: () => {
                const amount = 55 + floor * 8;
                player.gold += amount;
                return `The hidden hoard contains ${amount} gold.`;
            },
        },
    ];
    openChoice({ kicker: 'SECRET ROOM', title: 'A Door That Should Not Exist', description: 'Secret rooms now offer build-defining rewards instead of being just another pile of loot.', options });
}

// Returns true if the room opened a choice modal (so the caller can skip
// the normal post-action enemy turn - the modal handles it on close).
function triggerRoomEntry(room) {
    if (!room || room.entered) return false;
    room.entered = true;
    currentRoomId = roomIndexOf(room);
    switch (room.type) {
        case 'start':
            setStatus(`Floor ${floor}: ${floorTheme.name}.`);
            return false;
        case 'shrine':
            log('An ancient shrine hums with trapped power.', 'log-entry-good');
            chooseBoon('Choose a Shrine Boon');
            return true;
        case 'armory':
            log('Weapon racks line the walls. None of them look ordinary.', 'log-entry-loot');
            chooseArmoryWeapon();
            return true;
        case 'treasury':
            player.gold += Math.round(10 * floorTheme.goldMult);
            log('The treasury rewards your greed. +10 gold.', 'log-entry-loot');
            setStatus('Treasury opened. Mind the guards.');
            return false;
        case 'gauntlet':
            room.gauntletStarted = true;
            log('The gauntlet begins. Clear the room for a choice of reward.', 'log-entry-danger');
            return false;
        case 'library':
            // Library reveals the whole map (not just its own area).
            for (let y = 0; y < gridH; y++) for (let x = 0; x < gridW; x++) {
                if (grid[y][x] !== TILE.WALL) discovered[y][x] = true;
            }
            log('The library reveals the dungeon paths.', 'log-entry-good');
            chooseBoon('Choose a Library Boon', 'ANCIENT KNOWLEDGE', 2);
            return true;
        case 'healing':
            const heal = Math.min(player.maxHp - player.hp, Math.round(player.maxHp * 0.35));
            player.hp += heal;
            player.potions += 1;
            log(`The sanctum restores ${heal} HP and reveals a potion.`, 'log-entry-good');
            return false;
        case 'secret':
            triggerSecretRoom(room);
            return true;
        case 'boss':
            setStatus('The Warden guards the final escape.');
            return false;
        case 'exit':
            setStatus('The stairs wait beyond the red door.');
            return false;
        default:
            return false;
    }
}

// After every action, check if any gauntlet room is now clear. If so,
// hand out the reward. Returns true if a modal was opened.
function completeGauntlets() {
    for (const room of rooms) {
        if (room.type !== 'gauntlet' || !room.gauntletStarted || room.gauntletRewarded) continue;
        const living = enemies.some(e => e.alive && e.roomId === roomIndexOf(room));
        if (!living) {
            room.gauntletRewarded = true;
            log('The gauntlet falls silent. You earned a rare boon.', 'log-entry-good');
            chooseBoon('Claim Your Gauntlet Reward', 'GAUNTLET CLEARED', 2);
            return true;
        }
    }
    return false;
}

// --- Combat ------------------------------------------------------------------
// All damage bonuses from boons/weapon effects get pooled here so the
// damage roll in playerAttack() stays easy to read.
function applyWeaponBonuses(enemy) {
    let bonus = 0;
    if (hasBoon('blood_frenzy') && player.hp < player.maxHp * 0.5) bonus += 1;
    if (hasBoon('executioner') && enemy.hp <= enemy.maxHp * 0.25) bonus += 3;
    if (player.momentumReady) { bonus += 2; player.momentumReady = false; }
    return bonus;
}

function playerAttack(enemy) {
    if (hasStatus(player, 'stunned')) {
        log('You are stunned and lose the attack.', 'log-entry-danger');
        return;
    }
    const [lo, hi] = player.weapon.dmg;
    let dmg = randInt(lo, hi) + applyWeaponBonuses(enemy);
    let crit = false;
    // Crit chance is weapon crit + the Glass Fang boon bonus.
    const critChance = (player.weapon.crit || 0) + (hasBoon('glass_fang') ? 0.15 : 0);
    if (Math.random() < critChance) {
        crit = true;
        dmg += player.weapon.critBonus || 0;
    }
    // Vulnerable is a flat +2 damage taken on any hit.
    if (hasStatus(enemy, 'vulnerable')) dmg += 2;
    enemy.hp -= dmg;
    enemy._hitFlash = true;
    playHitSound();
    log(`You hit the ${enemy.elite ? 'Elite ' : ''}${enemy.type.name} for ${dmg}${crit ? ' critical damage' : ''}.`, 'log-entry-combat');

    // Dagger finisher - extra damage on already-hurt targets.
    if (player.weapon.finisher && enemy.hp > 0 && enemy.hp <= enemy.maxHp * 0.5) {
        enemy.hp -= player.weapon.finisher;
        log(`The Dagger finds an opening for +${player.weapon.finisher} damage.`, 'log-entry-combat');
    }
    // Axe applies Vulnerable, but only sometimes.
    if (player.weapon.vulnerable && enemy.hp > 0 && Math.random() < 0.45) {
        addStatus(enemy, 'vulnerable', player.weapon.vulnerable);
        log('The Axe leaves the target vulnerable.', 'log-entry-loot');
    }
    // Hammer stuns on a chance.
    if (player.weapon.stun && enemy.hp > 0 && Math.random() < player.weapon.stun) {
        addStatus(enemy, 'stunned', 1);
        log(`The Hammer stuns the ${enemy.type.name}.`, 'log-entry-loot');
    }
    // Sword cleave - hit one adjacent enemy for a small amount.
    if (player.weapon.cleave) {
        const adjacent = enemies.find(e => e.alive && e !== enemy && distance(e, enemy) <= 1);
        if (adjacent) {
            const cleave = randInt(1, 2);
            adjacent.hp -= cleave;
            adjacent._hitFlash = true;
            log(`Your Sword cleaves the ${adjacent.type.name} for ${cleave}.`, 'log-entry-combat');
            if (adjacent.hp <= 0) killEnemy(adjacent);
        }
    }
    if (enemy.hp <= 0) killEnemy(enemy);
}

function killEnemy(enemy) {
    if (!enemy.alive) return;
    enemy.alive = false;
    killCount++;
    playKillSound();
    // Gold roll: base * elite * scavenger * theme, with a chance to double.
    const [glo, ghi] = enemy.type.gold;
    let gold = randInt(glo, ghi) * (enemy.elite ? 2 : 1);
    if (hasBoon('scavenger')) gold = Math.round(gold * 1.5);
    gold = Math.round(gold * floorTheme.goldMult);
    player.gold += gold;
    if (hasBoon('fortune') && Math.random() < 0.25) player.gold += gold;
    if (hasBoon('vampiric')) player.hp = Math.min(player.maxHp, player.hp + 1);
    if (hasBoon('momentum')) player.momentumReady = true;
    log(`You defeated the ${enemy.elite ? 'Elite ' : ''}${enemy.type.name}! +${gold} gold.`, 'log-entry-good');
    if (Math.random() < 0.15 * floorTheme.potionMult) {
        player.potions++;
        log('It dropped a health potion!', 'log-entry-loot');
    }
    if (enemy === boss) defeatBoss();
}

// Tick statuses on an entity and deal any DOT damage. Decrements each
// counter by 1 per call.
function processStatuses(entity) {
    if (!entity.statuses) entity.statuses = {};
    if (entity.statuses.poisoned > 0) {
        entity.hp -= 1;
        entity._hitFlash = true;
        log(`Poison hurts the ${entity === player ? 'player' : entity.type.name} for 1.`, 'log-entry-danger');
    }
    if (entity.statuses.bleed > 0) {
        entity.hp -= 1;
        entity._hitFlash = true;
        log(`Bleed deals 1 damage to the ${entity.type.name}.`, 'log-entry-danger');
    }
    Object.keys(entity.statuses).forEach(k => {
        entity.statuses[k]--;
        if (entity.statuses[k] <= 0) delete entity.statuses[k];
    });
}

// Decide where an enemy wants to step. Each AI archetype has its own quirk.
function chooseEnemyMove(enemy) {
    const d = distance(enemy, player);
    const aggro = enemy.type.aggro + floorTheme.aggro;
    const canSee = d <= aggro && hasLineOfSight(enemy.x, enemy.y, player.x, player.y);
    const dx = Math.sign(player.x - enemy.x), dy = Math.sign(player.y - enemy.y);
    const away = { x: -dx, y: -dy };

    // Ambushers reveal themselves when you get close, and lose that turn.
    if (enemy.hidden && d <= 4) {
        enemy.hidden = false;
        log(`The ${enemy.type.name} springs from hiding!`, 'log-entry-danger');
        return null;
    }
    if (enemy.type.ai === 'ambusher' && enemy.hidden) return null;
    // Sentinels refuse to chase - they only fight in sight range.
    if (enemy.type.ai === 'sentinel' && !canSee) return null;
    // Most enemies just idle if they can't see the player (stalkers excepted).
    if (!canSee && enemy.type.ai !== 'stalker') return null;

    if (enemy.type.ai === 'coward' && enemy.hp < enemy.maxHp * 0.45 && d <= 8) return away;
    if (enemy.type.ai === 'skirmisher' && enemy.retreatNext) {
        enemy.retreatNext = false;
        return away;
    }
    // Stalkers wander until they get within 10 tiles, then beeline.
    if (enemy.type.ai === 'stalker') {
        if (d <= 10) return { x: dx, y: dy };
        return pick(DIRS4);
    }
    return { x: dx, y: dy };
}

function enemyCanAttack(enemy) { return distance(enemy, player) <= 1; }
function enemyAttack(enemy, bonusMultiplier = 1) {
    const [lo, hi] = enemy.type.dmg;
    let dmg = Math.round(randInt(lo, hi) * enemy.dmgMult * bonusMultiplier);
    // Thick Skin softens the very first hit taken this floor.
    if (hasBoon('thick_skin') && player.firstHitTaken) {
        dmg = Math.max(0, dmg - 2);
        player.firstHitTaken = false;
        log('Thick Skin softens the blow by 2.', 'log-entry-good');
    }
    player.hp -= dmg;
    player._hitFlash = true;
    playPlayerHurtSound();
    log(`The ${enemy.elite ? 'Elite ' : ''}${enemy.type.name} hits you for ${dmg}.`, 'log-entry-danger');
    floorTheme.onPlayerDamaged?.();
}

// Runs every enemy in order: status tick, then either attack or move.
function enemyTurnStep() {
    for (const enemy of [...enemies]) {
        if (!enemy.alive) continue;
        processStatuses(enemy);
        if (enemy.hp <= 0) { killEnemy(enemy); continue; }
        if (hasStatus(enemy, 'stunned')) {
            log(`The ${enemy.type.name} is stunned.`, 'log-entry-loot');
            continue;
        }
        if (enemy.type.ai === 'boss') {
            bossTurn(enemy);
            if (gameOver) return;
            continue;
        }
        if (enemyCanAttack(enemy)) {
            // Brutes spend a turn winding up, then swing hard next turn.
            if (enemy.type.ai === 'brute') {
                if (!enemy.windup) {
                    enemy.windup = true;
                    log('The Orc raises its weapon. Move!', 'log-entry-danger');
                } else {
                    enemy.windup = false;
                    enemyAttack(enemy, 1.6);
                }
            } else {
                enemyAttack(enemy);
                // Skirmishers back off right after they hit you.
                if (enemy.type.ai === 'skirmisher') enemy.retreatNext = true;
            }
            if (player.hp <= 0) { killPlayer(); return; }
            continue;
        }
        const move = chooseEnemyMove(enemy);
        if (!move) continue;
        // Try the ideal step, then fall back to axis-aligned moves, then any cardinal.
        const tryMoves = shuffle([
            move,
            { x: move.x, y: 0 },
            { x: 0, y: move.y },
            ...DIRS4,
        ]);
        for (const m of tryMoves) {
            const nx = enemy.x + m.x, ny = enemy.y + m.y;
            if (!inBounds(nx, ny)) continue;
            if (nx === player.x && ny === player.y) continue;
            const t = tileAt(nx, ny);
            if (!isWalkableTile(t) || t === TILE.RED_DOOR || t === TILE.GOLD_DOOR || t === TILE.SECRET_DOOR) continue;
            if (enemyAt(nx, ny)) continue;
            enemy.x = nx; enemy.y = ny;
            break;
        }
    }
    completeGauntlets();
    // DOT on the player happens after everyone moves.
    processStatuses(player);
    if (player.hp <= 0) killPlayer();
}

// Boss AI: phase transitions at 66% and 33% HP; telegraphed big hits every
// third turn when it can reach you, otherwise it just chases.
function bossTurn(enemy) {
    enemy.turn++;
    if (enemy.hp <= enemy.maxHp * 0.66 && !enemy.phase2) {
        enemy.phase2 = true;
        log('The Crypt Warden enters its second phase and summons a guard.', 'log-entry-danger');
        const room = rooms[enemy.roomId];
        const guard = pick(ENEMY_TYPES.filter(e => e.id === 'skeleton' || e.id === 'wraith'));
        spawnEnemy(room, guard, true);
    }
    if (enemy.hp <= enemy.maxHp * 0.33 && !enemy.phase3) {
        enemy.phase3 = true;
        enemy.dmgMult *= 1.35;
        log('The Crypt Warden enrages. Its attacks become devastating.', 'log-entry-danger');
    }
    if (enemyCanAttack(enemy)) {
        if (enemy.windup) {
            // Second turn of a windup = the actual swing.
            enemy.windup = false;
            enemyAttack(enemy, enemy.phase3 ? 2 : 1.5);
        } else if (enemy.turn % 3 === 0 && distance(enemy, player) <= 4) {
            enemy.windup = true;
            log('The Crypt Warden gathers dark energy. Move!', 'log-entry-danger');
        } else {
            enemyAttack(enemy, enemy.phase3 ? 1.25 : 1);
        }
        if (player.hp <= 0) killPlayer();
        return;
    }
    // Same movement fallback pattern the grunts use.
    const move = { x: Math.sign(player.x - enemy.x), y: Math.sign(player.y - enemy.y) };
    const tryMoves = shuffle([move, { x: move.x, y: 0 }, { x: 0, y: move.y }, ...DIRS4]);
    for (const m of tryMoves) {
        const nx = enemy.x + m.x, ny = enemy.y + m.y;
        if (!inBounds(nx, ny) || !isWalkableTile(tileAt(nx, ny)) || tileAt(nx, ny) === TILE.SECRET_DOOR) continue;
        if (enemyAt(nx, ny) || (nx === player.x && ny === player.y)) continue;
        enemy.x = nx; enemy.y = ny;
        break;
    }
}

// --- Items -------------------------------------------------------------------
function pickupItem(item) {
    items = items.filter(it => it !== item);
    switch (item.type) {
        case 'gold': {
            let amount = item.amount;
            if (hasBoon('fortune') && Math.random() < 0.25) amount *= 2;
            player.gold += amount;
            playPickupSound();
            log(`You found ${amount} gold.`, 'log-entry-loot');
            break;
        }
        case 'secretgold':
            player.gold += item.amount;
            playSecretSound();
            log(`A hidden hoard! +${item.amount} gold.`, 'log-entry-good');
            break;
        case 'potion':
            player.potions++;
            playPickupSound();
            log('You picked up a health potion.', 'log-entry-loot');
            break;
        case 'redkey':
            player.hasRedKey = true;
            playKeySound();
            log('You found the RED KEY! Find the red stairs door.', 'log-entry-good');
            break;
        case 'goldkey':
            player.goldKeys++;
            playKeySound();
            log('You found a gold key.', 'log-entry-loot');
            break;
        case 'weapon': {
            const w = weaponById(item.weaponId);
            const old = player.weapon;
            const sellValue = 5 * w.tier;
            const isUpgrade = w.tier > old.tier;
            playPickupSound();
            openChoice({
                kicker: 'WEAPON FOUND',
                title: `You found a ${w.name}`,
                description: `${w.description} Damage ${w.dmg[0]}-${w.dmg[1]}.`,
                options: [
                    {
                        icon: w.icon,
                        title: `Equip ${w.name}`,
                        desc: isUpgrade ? `Replaces your ${old.name}.` : `A sidegrade from your ${old.name} - style over stats.`,
                        choose: () => {
                            player.weapon = w;
                            return `You equip the ${w.name}. ${old.name} stays behind.`;
                        },
                    },
                    {
                        icon: '💰',
                        title: `Sell for ${sellValue} gold`,
                        desc: `Keep your ${old.name} and pocket the coin instead.`,
                        choose: () => {
                            player.gold += sellValue;
                            return `You sell the ${w.name} for ${sellValue} gold.`;
                        },
                    },
                ],
            });
            return true; // signals a choice modal was opened, so the caller skips its own turn-advance
        }
    }
    return false;
}

// --- Player turn flow --------------------------------------------------------
// Standard post-action: enemies act, re-render, check gauntlets.
function afterPlayerAction() {
    if (gameOver || choicePending) return;
    enemyTurnStep();
    render();
    if (gameOver) return;
    if (completeGauntlets()) return;
}

// Main movement/attack handler. Door and secret interactions resolve here,
// since the player only learns about them by bumping into them.
function tryMove(dx, dy) {
    if (!gameActive || gameOver || turnBusy || choicePending) return;
    const nx = player.x + dx, ny = player.y + dy;
    if (!inBounds(nx, ny)) return;
    const enemy = enemyAt(nx, ny);
    if (enemy) {
        playerAttack(enemy);
        afterPlayerAction();
        return;
    }
    const tile = tileAt(nx, ny);
    if (tile === TILE.WALL) { playBumpSound(); return; }
    if (tile === TILE.SECRET_DOOR) {
        // Walking into a secret door reveals it and steps through.
        grid[ny][nx] = TILE.FLOOR;
        playSecretSound();
        log('A hidden passage creaks open!', 'log-entry-good');
        player.x = nx; player.y = ny;
        const room = roomAt(nx, ny);
        if (room && room.type === 'secret') { triggerRoomEntry(room); return; }
        afterPlayerAction();
        return;
    }
    if (tile === TILE.RED_DOOR) {
        if (!player.hasRedKey) { playBumpSound(); setStatus('Locked - you need the red key.'); return; }
        grid[ny][nx] = TILE.DOOR;
        playDoorSound();
        log('You unlock the red door.', 'log-entry-good');
        player.x = nx; player.y = ny;
    } else if (tile === TILE.GOLD_DOOR) {
        if (player.goldKeys <= 0) { playBumpSound(); setStatus('Locked - you need a gold key.'); return; }
        player.goldKeys--;
        grid[ny][nx] = TILE.DOOR;
        playDoorSound();
        log('You unlock the gold vault door.', 'log-entry-good');
        player.x = nx; player.y = ny;
    } else {
        if (tile === TILE.DOOR) { grid[ny][nx] = TILE.FLOOR; playDoorSound(); }
        player.x = nx; player.y = ny;
        playMoveSound();
    }

    const item = itemAt(nx, ny);
    // Picking up a weapon can open an equip-or-sell choice modal; if it does,
    // don't also fire room-entry logic (which might open its own modal) this turn.
    const itemOpenedChoice = item ? Boolean(pickupItem(item)) : false;
    const room = roomAt(nx, ny);
    const openedChoice = itemOpenedChoice || triggerRoomEntry(room);
    if (tile === TILE.STAIRS) {
        // Boss floor: can't leave until the Warden is dead.
        if (floor >= MAX_FLOOR && boss?.alive) {
            setStatus('The Crypt Warden still lives.');
            afterPlayerAction();
            return;
        }
        afterPlayerAction();
        if (!gameOver) nextFloor();
        return;
    }
    if (!openedChoice) afterPlayerAction();
}

function waitTurn() {
    if (!gameActive || gameOver || turnBusy || choicePending) return;
    log('You wait a moment...');
    afterPlayerAction();
}

function usePotion() {
    if (!gameActive || gameOver || turnBusy || choicePending) return;
    if (player.potions <= 0) { setStatus('No potions left!'); return; }
    if (player.hp >= player.maxHp) { setStatus('Already at full health.'); return; }
    player.potions--;
    // Healing is scaled by floor theme (Blighted Grotto weakens it).
    const heal = randInt(6, 10) + (hasBoon('alchemist') ? 3 : 0);
    const finalHeal = Math.round(heal * floorTheme.potionMult);
    player.hp = Math.min(player.maxHp, player.hp + finalHeal);
    playPotionSound();
    log(`You drink a potion and recover ${finalHeal} HP.`, 'log-entry-good');
    afterPlayerAction();
}

// --- Game lifecycle ----------------------------------------------------------
function newPlayer() {
    const diff = DIFFICULTY_PRESETS[difficultyKey];
    return {
        x: 0, y: 0, hp: diff.startHp, maxHp: diff.startHp, weapon: WEAPONS[0], gold: 0,
        potions: diff.startPotions, hasRedKey: false, goldKeys: 0, boons: [], statuses: {},
        firstHitTaken: true, momentumReady: false, _hitFlash: false,
    };
}

function startNewGame() {
    // Size the panel to the viewport FIRST, so computeCellSize() sees the
    // real available height when it runs inside render().
    fitGamePanel();
    overlay.classList.remove('show');
    choiceOverlay.classList.remove('show');
    choicePending = false;
    choiceIndex = 0;
    clearLog();
    floor = 1;
    killCount = 0;
    player = newPlayer();
    gameActive = true;
    gameOver = false;
    turnBusy = false;
    buildDungeon();
    log(`You descend into the dungeon. Floor ${floor}.`, 'log-entry-good');
    log(`${floorTheme.icon} ${floorTheme.name}: ${floorTheme.desc}`, 'log-entry-loot');
    setStatus('Find your way down...');
    const startRoom = rooms[0];
    startRoom.entered = true;
    currentRoomId = 0;
    render();
}

function nextFloor() {
    if (floor >= MAX_FLOOR) { winGame(); return; }
    floor++;
    // Keys are consumed per floor.
    player.hasRedKey = false;
    player.goldKeys = 0;
    player.firstHitTaken = true;
    let floorHeal = 4;
    if (hasBoon('alchemist')) floorHeal += 1;
    player.hp = Math.min(player.maxHp, player.hp + floorHeal);
    playFloorSound();
    buildDungeon();
    log(`You descend to floor ${floor}. (+${floorHeal} HP)`, 'log-entry-good');
    log(`${floorTheme.icon} ${floorTheme.name}: ${floorTheme.desc}`, 'log-entry-loot');
    setStatus(`Floor ${floor} - explore carefully.`);
    render();
}

function killPlayer() {
    if (gameOver) return;
    gameOver = true;
    gameActive = false;
    choicePending = false;
    playDeathSound();
    log('You have died.', 'log-entry-danger');
    overlayMessage.textContent = 'You Died';
    overlayDetail.textContent = `Reached Floor ${floor}\n${killCount} enemies defeated\n${player.gold} gold collected\n${player.boons.length} boons collected`;
    overlay.classList.add('show');
    setStatus('Game over.');
    render();
}

function winGame() {
    gameOver = true;
    gameActive = false;
    playVictorySound();
    log('You escaped the dungeon with your build intact!', 'log-entry-good');
    overlayMessage.textContent = 'You Escaped!';
    overlayDetail.textContent = `Cleared ${MAX_FLOOR} floors\n${killCount} enemies defeated\n${player.gold} gold collected\n${player.boons.length} boons collected`;
    overlay.classList.add('show');
    setStatus('Victory!');
    render();
}

// --- Input -------------------------------------------------------------------
function handleKeyDown(event) {
    const key = event.key.toLowerCase();
    // Stop the page from scrolling when arrows/space are pressed.
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();

    // 1. Game over: SPACE restarts the run.
    if (gameOver) {
        if (key === ' ') startNewGame();
        return;
    }

    // 2. Choice modal: LEFT/RIGHT (or A/D) move the highlight, SPACE / ENTER confirm.
    if (choicePending) {
        const cards = choiceOptionsEl.querySelectorAll('.choice-card');
        if (!cards.length) return;
        if (key === 'arrowleft' || key === 'a') {
            choiceIndex = (choiceIndex - 1 + cards.length) % cards.length;
            updateChoiceFocus();
        } else if (key === 'arrowright' || key === 'd') {
            choiceIndex = (choiceIndex + 1) % cards.length;
            updateChoiceFocus();
        } else if (key === ' ' || key === 'enter') {
            cards[choiceIndex]?.click();
        }
        return;
    }

    if (!gameActive) return;

    switch (key) {
        case 'w': case 'arrowup': tryMove(0, -1); break;
        case 's': case 'arrowdown': tryMove(0, 1); break;
        case 'a': case 'arrowleft': tryMove(-1, 0); break;
        case 'd': case 'arrowright': tryMove(1, 0); break;
        case ' ': waitTurn(); break;
        case 'p': usePotion(); break;
        case 'm': soundToggleBtn.click(); break;
    }
}

document.addEventListener('keydown', handleKeyDown);
document.querySelectorAll('.dpad-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const dir = btn.dataset.dir;
        if (dir === 'up') tryMove(0, -1);
        else if (dir === 'down') tryMove(0, 1);
        else if (dir === 'left') tryMove(-1, 0);
        else if (dir === 'right') tryMove(1, 0);
    });
});

waitBtn.addEventListener('click', waitTurn);
potionBtn.addEventListener('click', usePotion);
resetBtn.addEventListener('click', startNewGame);
playAgainBtn.addEventListener('click', startNewGame);

// Changing settings mid-run starts a fresh dungeon - intentional.
sizeSelect.addEventListener('change', () => { sizeKey = sizeSelect.value; startNewGame(); });
difficultySelect.addEventListener('change', () => { difficultyKey = difficultySelect.value; startNewGame(); });

// Re-fit the panel and redraw the board on resize so cells stay correct.
window.addEventListener('resize', () => {
    fitGamePanel();
    if (gameActive || gameOver) renderBoard();
});

window.addEventListener('load', () => {
    fitGamePanel();
    if (gameActive || gameOver) renderBoard();
});

updateSoundIcon();
startNewGame();