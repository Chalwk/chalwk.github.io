// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

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

const TILE = {
    WALL: 0,
    FLOOR: 1,
    DOOR: 2,
    RED_DOOR: 3,
    GOLD_DOOR: 4,
    STAIRS: 5,
    SECRET_DOOR: 6,
};

const DIRS4 = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
];

const DIRS8 = [
    { x: 0, y: -1 }, { x: 1, y: -1 }, { x: 1, y: 0 }, { x: 1, y: 1 },
    { x: 0, y: 1 }, { x: -1, y: 1 }, { x: -1, y: 0 }, { x: -1, y: -1 },
];

const SIZE_PRESETS = {
    small: { w: 27, h: 19, rooms: 7 },
    medium: { w: 35, h: 23, rooms: 10 },
    large: { w: 43, h: 27, rooms: 14 },
};

const DIFFICULTY_PRESETS = {
    easy: { startHp: 26, startPotions: 2, enemyHpMult: 0.8, enemyDmgMult: 0.75, enemyCountMult: 0.8 },
    normal: { startHp: 20, startPotions: 1, enemyHpMult: 1, enemyDmgMult: 1, enemyCountMult: 1 },
    hard: { startHp: 16, startPotions: 1, enemyHpMult: 1.3, enemyDmgMult: 1.3, enemyCountMult: 1.3 },
};

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

const ENEMY_TYPES = [
    { id: 'rat', name: 'Rat', icon: '🐀', hp: 3, dmg: [1, 2], minFloor: 1, gold: [1, 3], ai: 'coward', aggro: 5, tags: [] },
    { id: 'goblin', name: 'Goblin', icon: '👺', hp: 6, dmg: [1, 3], minFloor: 1, gold: [2, 5], ai: 'skirmisher', aggro: 8, tags: [] },
    { id: 'skeleton', name: 'Skeleton', icon: '💀', hp: 9, dmg: [2, 4], minFloor: 2, gold: [3, 7], ai: 'sentinel', aggro: 7, tags: ['undead'] },
    { id: 'orc', name: 'Orc', icon: '👹', hp: 13, dmg: [3, 6], minFloor: 3, gold: [5, 10], ai: 'brute', aggro: 9, tags: [] },
    { id: 'wraith', name: 'Wraith', icon: '👻', hp: 17, dmg: [4, 7], minFloor: 5, gold: [8, 14], ai: 'stalker', aggro: 12, tags: ['undead'] },
    { id: 'spider', name: 'Cave Spider', icon: '🕷️', hp: 8, dmg: [2, 4], minFloor: 4, gold: [4, 8], ai: 'ambusher', aggro: 6, tags: [] },
];

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

const MAX_FLOOR = 10;
let sizeKey = sizeSelect.value;
let difficultyKey = difficultySelect.value;
let gridW = 0, gridH = 0;
let grid = [];
let discovered = [];
let visible = [];
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
let choicePending = false;
let currentRoomId = null;
let killCount = 0;
let boss = null;
let audioCtx = null;
let soundMuted = localStorage.getItem('dungeon-sound-muted') === 'true';

function ensureAudioCtx() {
    if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        audioCtx = new Ctx();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

function playTone(freq, duration, { type = 'sine', gain = 0.15, delay = 0 } = {}) {
    if (soundMuted) return;
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    const startTime = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
}

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
        ensureAudioCtx();
        playTone(440, 0.08, { gain: 0.1 });
    }
});

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
function isOpenForVision(x, y) { const t = tileAt(x, y); return t !== TILE.WALL && t !== TILE.SECRET_DOOR; }
function enemyAt(x, y) { return enemies.find(e => e.alive && e.x === x && e.y === y) || null; }
function itemAt(x, y) { return items.find(it => it.x === x && it.y === y) || null; }
function roomCenter(r) { return { x: r.x + (r.w >> 1), y: r.y + (r.h >> 1) }; }
function rectsOverlap(a, b, pad) {
    return a.x - pad < b.x + b.w && a.x + a.w + pad > b.x && a.y - pad < b.y + b.h && a.y + a.h + pad > b.y;
}
function pointInRoom(r, x, y) { return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h; }
function onRoomBorder(r, x, y) {
    if (x < r.x - 1 || x > r.x + r.w || y < r.y - 1 || y > r.y + r.h) return false;
    const onVertEdge = (x === r.x - 1 || x === r.x + r.w) && y >= r.y && y < r.y + r.h;
    const onHorizEdge = (y === r.y - 1 || y === r.y + r.h) && x >= r.x && x < r.x + r.w;
    return onVertEdge || onHorizEdge;
}
function distance(a, b) { return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)); }
function roomAt(x, y) { return rooms.find(r => pointInRoom(r, x, y)) || (secretRoom && pointInRoom(secretRoom, x, y) ? secretRoom : null); }
function roomTypeName(room) { return room ? `${ROOM_TYPES[room.type]?.icon || '▦'} ${ROOM_TYPES[room.type]?.name || 'Room'}` : 'Corridor'; }
function hasBoon(id) { return player.boons.some(b => b.id === id); }
function availableBoons() { return BOONS.filter(b => !hasBoon(b.id)); }
function addStatus(entity, id, turns) {
    if (!entity.statuses) entity.statuses = {};
    entity.statuses[id] = Math.max(entity.statuses[id] || 0, turns);
}
function hasStatus(entity, id) { return Boolean(entity.statuses && entity.statuses[id] > 0); }

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

function generateRooms(w, h, count) {
    const list = [];
    let attempts = 0;
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
function carveCorridor(x1, y1, x2, y2, roomA, roomB) {
    const horizFirst = Math.random() < 0.5;
    const points = [];
    if (horizFirst) {
        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) points.push({ x, y: y1 });
        for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) points.push({ x: x2, y });
    } else {
        for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) points.push({ x: x1, y });
        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) points.push({ x, y: y2 });
    }
    for (const p of points) {
        if (!inBounds(p.x, p.y)) continue;
        const insideA = pointInRoom(roomA, p.x, p.y);
        const insideB = pointInRoom(roomB, p.x, p.y);
        if (insideA || insideB) { grid[p.y][p.x] = TILE.FLOOR; continue; }
        const borderA = onRoomBorder(roomA, p.x, p.y);
        const borderB = onRoomBorder(roomB, p.x, p.y);
        if ((borderA || borderB) && grid[p.y][p.x] === TILE.WALL) grid[p.y][p.x] = TILE.DOOR;
        else if (grid[p.y][p.x] !== TILE.DOOR) grid[p.y][p.x] = TILE.FLOOR;
    }
}
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
        const ca = roomCenter(roomList[a]);
        const cb = roomCenter(roomList[b]);
        carveCorridor(ca.x, ca.y, cb.x, cb.y, roomList[a], roomList[b]);
        adjacency[a].add(b);
        adjacency[b].add(a);
    }
    return adjacency;
}
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
function findRoomDoorTile(r) {
    const doors = [];
    for (let x = r.x - 1; x <= r.x + r.w; x++) {
        for (let y = r.y - 1; y <= r.y + r.h; y++) {
            if (!onRoomBorder(r, x, y)) continue;
            if (tileAt(x, y) === TILE.DOOR) doors.push({ x, y });
        }
    }
    return doors.length ? pick(doors) : null;
}
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
function chooseFloorTheme() {
    const candidates = FLOOR_THEMES.filter(t => t.id !== floorTheme.id || floor <= 1);
    floorTheme = pick(candidates.length ? candidates : FLOOR_THEMES);
}
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
    const floorMult = 1 + (floor - 1) * 0.14;
    const eliteMult = elite ? 1.6 : 1;
    const hp = Math.round(type.hp * diff.enemyHpMult * floorMult * eliteMult);
    const enemy = {
        x: spot.x, y: spot.y, type, hp, maxHp: hp,
        dmgMult: diff.enemyDmgMult * floorMult * floorTheme.enemyDamage * (elite ? 1.3 : 1),
        elite, alive: true, roomId: roomIndexOf(room), statuses: {}, hidden: type.ai === 'ambusher', windup: false, retreatNext: false,
    };
    floorTheme.onEnemySpawn?.(enemy);
    enemy.maxHp = Math.max(enemy.maxHp, enemy.hp);
    enemy.hp = enemy.maxHp;
    enemies.push(enemy);
    return enemy;
}
function roomIndexOf(room) { return rooms.indexOf(room); }
function weaponById(id) { return WEAPONS.find(w => w.id === id) || WEAPONS[0]; }
function randomWeaponAtTier(minTier, maxTier = WEAPONS.length - 1) {
    const lo = clamp(minTier, 1, WEAPONS.length - 1);
    const hi = clamp(maxTier, lo, WEAPONS.length - 1);
    return pick(WEAPONS.filter(w => w.tier >= lo && w.tier <= hi));
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
    const dist = roomBfsDist(adjacency, startIdx);
    let exitIdx = startIdx, bestScore = -1;
    rooms.forEach((r, i) => {
        if (i === startIdx) return;
        const leafBonus = adjacency[i].size === 1 ? 100 : 0;
        const score = (dist[i] === -1 ? 0 : dist[i]) + leafBonus;
        if (score > bestScore) { bestScore = score; exitIdx = i; }
    });

    const exitRoom = rooms[exitIdx];
    const exitDoorTile = findRoomDoorTile(exitRoom);
    if (exitDoorTile) grid[exitDoorTile.y][exitDoorTile.x] = TILE.RED_DOOR;
    const stairsSpot = freeFloorTile(exitRoom, exitDoorTile ? [exitDoorTile] : []);
    grid[stairsSpot.y][stairsSpot.x] = TILE.STAIRS;

    const vaultCount = gridW > 30 ? 2 : 1;
    const vaultCandidates = rooms.map((r, i) => i)
        .filter(i => i !== startIdx && i !== exitIdx && adjacency[i].size === 1);
    shuffle(vaultCandidates);
    const vaultIdxs = vaultCandidates.slice(0, vaultCount);
    const vaultRooms = [];
    vaultIdxs.forEach(idx => {
        const r = rooms[idx], doorTile = findRoomDoorTile(r);
        if (doorTile) {
            grid[doorTile.y][doorTile.x] = TILE.GOLD_DOOR;
            vaultRooms.push(r);
        }
    });

    assignRoomTypes(adjacency, startIdx, exitIdx, vaultIdxs);

    const secretHostPool = rooms.filter((r, i) => i !== startIdx && i !== exitIdx && !vaultRooms.includes(r));
    shuffle(secretHostPool);
    for (const host of secretHostPool) {
        secretRoom = tryAddSecretRoom(host, [...rooms, ...(secretRoom ? [secretRoom] : [])]);
        if (secretRoom) break;
    }

    const spawn = roomCenter(startRoom);
    player.x = spawn.x; player.y = spawn.y;

    const keyPool = rooms.filter((r, i) => i !== startIdx && i !== exitIdx && !vaultRooms.includes(r));
    shuffle(keyPool);
    let poolPtr = 0;
    const nextKeyRoom = () => keyPool[poolPtr++ % Math.max(1, keyPool.length)] || startRoom;
    const redKeySpot = freeFloorTile(nextKeyRoom());
    items.push({ x: redKeySpot.x, y: redKeySpot.y, type: 'redkey' });
    vaultRooms.forEach(() => {
        const spot = freeFloorTile(nextKeyRoom());
        items.push({ x: spot.x, y: spot.y, type: 'goldkey' });
    });

    vaultRooms.forEach(vr => {
        const weapon = randomWeaponAtTier(1 + Math.floor((floor - 1) / 3), 3 + Math.floor((floor - 2) / 5));
        const spot1 = freeFloorTile(vr);
        items.push({ x: spot1.x, y: spot1.y, type: 'weapon', weaponId: weapon.id });
        const spot2 = freeFloorTile(vr, [spot1]);
        items.push({ x: spot2.x, y: spot2.y, type: 'gold', amount: Math.round((randInt(15, 30) + floor * 3) * floorTheme.goldMult), roomIndex: roomIndexOf(vr) });
        const guardPool = ENEMY_TYPES.filter(e => e.minFloor <= floor + 1);
        spawnEnemy(vr, pick(guardPool.length ? guardPool : [ENEMY_TYPES[0]]), true);
    });

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
            if (r.type === 'gauntlet') {
                if (!r.enemyIds) r.enemyIds = [];
                r.enemyIds.push(spawned);
            }
        }
        if (r.type === 'treasury') {
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
            const tier = Math.min(3, 1 + Math.floor((floor - 1) / 3));
            items.push({ x: spot.x, y: spot.y, type: 'weapon', weaponId: WEAPONS[randInt(1, tier)].id });
        }
    });

    if (secretRoom) secretRoom.type = 'secret';
    if (floor >= MAX_FLOOR) {
        spawnBoss(exitRoom);
    }
}

function spawnBoss(exitRoom) {
    const spot = freeFloorTile(exitRoom, [{ x: player.x, y: player.y }]);
    boss = {
        x: spot.x, y: spot.y, hp: 95, maxHp: 95, alive: true, roomId: roomIndexOf(exitRoom),
        type: { id: 'crypt_warden', name: 'Crypt Warden', icon: '👑', dmg: [5, 8], ai: 'boss', gold: [20, 35], tags: ['undead'] },
        dmgMult: DIFFICULTY_PRESETS[difficultyKey].enemyDmgMult * 1.1,
        elite: true, statuses: {}, windup: false, turn: 0, phase2: false, phase3: false,
    };
    enemies.push(boss);
    log('The Crypt Warden seals the sanctuary. Defeat it before you can escape.', 'log-entry-danger');
}

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
function secretHintRadius() { return hasBoon('treasure_sense') ? 3 : hasBoon('scouting') ? 2 : 1; }
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

function computeCellSize() {
    const wrap = boardEl.parentElement;
    const available = wrap.clientWidth - 24;
    const base = Math.floor(available / gridW) - 1;
    const clamped = Math.max(12, Math.min(28, base));
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
        case 'goldkey': return '🔑';
        case 'weapon': return weaponById(item.weaponId).icon;
        default: return '';
    }
}
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
                case TILE.FLOOR: cell.classList.add('floor'); break;
                case TILE.DOOR: cell.classList.add('door'); cell.textContent = '🚪'; break;
                case TILE.RED_DOOR: cell.classList.add('door-red'); cell.textContent = '🔒'; break;
                case TILE.GOLD_DOOR: cell.classList.add('door-gold'); cell.textContent = '🔒'; break;
                case TILE.STAIRS: cell.classList.add('floor', 'stairs'); cell.textContent = '⬇'; break;
                case TILE.SECRET_DOOR:
                    cell.classList.add('wall');
                    if (Math.max(Math.abs(x - player.x), Math.abs(y - player.y)) <= secretHintRadius()) cell.classList.add('secret-hint');
                    break;
                default: cell.classList.add('floor');
            }
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

function addBoon(boon) {
    if (!boon || hasBoon(boon.id)) return;
    player.boons.push(boon);
    if (boon.id === 'iron_will') player.maxHp += 3;
    if (boon.id === 'glass_fang') player.maxHp = Math.max(1, player.maxHp - 2);
    player.hp = Math.min(player.maxHp, player.hp + (boon.id === 'iron_will' ? 3 : 0));
    playSecretSound();
    log(`You gain the boon ${boon.name}: ${boon.desc}`, 'log-entry-good');
}

function openChoice({ kicker = 'DISCOVERY', title, description, options }) {
    choicePending = true;
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
    render();
}

function chooseBoon(title = 'Choose a Boon', kicker = 'RUN BUILD', count = 3) {
    const pool = shuffle([...availableBoons()]).slice(0, count);
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
    const critChance = (player.weapon.crit || 0) + (hasBoon('glass_fang') ? 0.15 : 0);
    if (Math.random() < critChance) {
        crit = true;
        dmg += player.weapon.critBonus || 0;
    }
    if (hasStatus(enemy, 'vulnerable')) dmg += 2;
    enemy.hp -= dmg;
    enemy._hitFlash = true;
    playHitSound();
    log(`You hit the ${enemy.elite ? 'Elite ' : ''}${enemy.type.name} for ${dmg}${crit ? ' critical damage' : ''}.`, 'log-entry-combat');

    if (player.weapon.finisher && enemy.hp > 0 && enemy.hp <= enemy.maxHp * 0.5) {
        enemy.hp -= player.weapon.finisher;
        log(`The Dagger finds an opening for +${player.weapon.finisher} damage.`, 'log-entry-combat');
    }
    if (player.weapon.vulnerable && enemy.hp > 0 && Math.random() < 0.45) {
        addStatus(enemy, 'vulnerable', player.weapon.vulnerable);
        log('The Axe leaves the target vulnerable.', 'log-entry-loot');
    }
    if (player.weapon.stun && enemy.hp > 0 && Math.random() < player.weapon.stun) {
        addStatus(enemy, 'stunned', 1);
        log(`The Hammer stuns the ${enemy.type.name}.`, 'log-entry-loot');
    }
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
function defeatBoss() {
    if (!boss?.alive) return;
    boss.alive = false;
    boss.hp = 0;
    player.gold += 80;
    playVictorySound();
    log('The Crypt Warden collapses. The final stairs are yours.', 'log-entry-good');
    setStatus('The Warden is defeated. Escape.');
}

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
function chooseEnemyMove(enemy) {
    const d = distance(enemy, player);
    const aggro = enemy.type.aggro + floorTheme.aggro;
    const canSee = d <= aggro && hasLineOfSight(enemy.x, enemy.y, player.x, player.y);
    const dx = Math.sign(player.x - enemy.x), dy = Math.sign(player.y - enemy.y);
    const away = { x: -dx, y: -dy };

    if (enemy.hidden && d <= 4) {
        enemy.hidden = false;
        log(`The ${enemy.type.name} springs from hiding!`, 'log-entry-danger');
        return null;
    }
    if (enemy.type.ai === 'ambusher' && enemy.hidden) return null;
    if (enemy.type.ai === 'sentinel' && !canSee) return null;
    if (!canSee && enemy.type.ai !== 'stalker') return null;

    if (enemy.type.ai === 'coward' && enemy.hp < enemy.maxHp * 0.45 && d <= 8) return away;
    if (enemy.type.ai === 'skirmisher' && enemy.retreatNext) {
        enemy.retreatNext = false;
        return away;
    }
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
                if (enemy.type.ai === 'skirmisher') enemy.retreatNext = true;
            }
            if (player.hp <= 0) { killPlayer(); return; }
            continue;
        }
        const move = chooseEnemyMove(enemy);
        if (!move) continue;
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
    processStatuses(player);
    if (player.hp <= 0) killPlayer();
}
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
            if (w.tier > player.weapon.tier) {
                const old = player.weapon;
                player.weapon = w;
                playPickupSound();
                log(`You equipped a ${w.name}! (was ${old.name})`, 'log-entry-good');
            } else {
                player.gold += 5;
                playPickupSound();
                log(`Found a ${w.name}, but the ${player.weapon.name} is stronger. Sold for 5 gold.`, 'log-entry-loot');
            }
            break;
        }
    }
}

function afterPlayerAction() {
    if (gameOver || choicePending) return;
    enemyTurnStep();
    render();
    if (gameOver) return;
    if (completeGauntlets()) return;
}

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
    if (item) pickupItem(item);
    const room = roomAt(nx, ny);
    const openedChoice = triggerRoomEntry(room);
    if (tile === TILE.STAIRS) {
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
    const heal = randInt(6, 10) + (hasBoon('alchemist') ? 3 : 0);
    const finalHeal = Math.round(heal * floorTheme.potionMult);
    player.hp = Math.min(player.maxHp, player.hp + finalHeal);
    playPotionSound();
    log(`You drink a potion and recover ${finalHeal} HP.`, 'log-entry-good');
    afterPlayerAction();
}

function newPlayer() {
    const diff = DIFFICULTY_PRESETS[difficultyKey];
    return {
        x: 0, y: 0, hp: diff.startHp, maxHp: diff.startHp, weapon: WEAPONS[0], gold: 0,
        potions: diff.startPotions, hasRedKey: false, goldKeys: 0, boons: [], statuses: {},
        firstHitTaken: true, momentumReady: false, _hitFlash: false,
    };
}
function startNewGame() {
    overlay.classList.remove('show');
    choiceOverlay.classList.remove('show');
    choicePending = false;
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

function handleKeyDown(event) {
    if (!gameActive || gameOver) return;
    if (choicePending) return;
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
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
sizeSelect.addEventListener('change', () => { sizeKey = sizeSelect.value; startNewGame(); });
difficultySelect.addEventListener('change', () => { difficultyKey = difficultySelect.value; startNewGame(); });
window.addEventListener('resize', () => { if (gameActive || gameOver) renderBoard(); });
updateSoundIcon();
startNewGame();
