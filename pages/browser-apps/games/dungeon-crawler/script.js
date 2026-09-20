// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

const boardEl = document.getElementById('dungeon-board');
const statusEl = document.getElementById('status');
const floorLabelEl = document.getElementById('floor-label');
const hpFillEl = document.getElementById('hp-fill');
const hpTextEl = document.getElementById('hp-text');
const goldCountEl = document.getElementById('gold-count');
const weaponIconEl = document.getElementById('weapon-icon');
const weaponNameEl = document.getElementById('weapon-name');
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

// Tile types
const TILE = {
    WALL: 0,
    FLOOR: 1,
    DOOR: 2,
    RED_DOOR: 3,
    GOLD_DOOR: 4,
    STAIRS: 5,
    SECRET_DOOR: 6,
};

const DIRS4 = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
const DIRS8 = [
    { x: 0, y: -1 }, { x: 1, y: -1 }, { x: 1, y: 0 }, { x: 1, y: 1 },
    { x: 0, y: 1 }, { x: -1, y: 1 }, { x: -1, y: 0 }, { x: -1, y: -1 },
];

// Presets
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
    { id: 'fists', name: 'Fists', icon: '🤛', dmg: [1, 2], tier: 0 },
    { id: 'dagger', name: 'Dagger', icon: '🗡️', dmg: [2, 4], tier: 1 },
    { id: 'sword', name: 'Sword', icon: '⚔️', dmg: [3, 6], tier: 2 },
    { id: 'axe', name: 'Axe', icon: '🪓', dmg: [4, 8], tier: 3 },
    { id: 'hammer', name: 'War Hammer', icon: '🔨', dmg: [6, 11], tier: 4 },
];

const ENEMY_TYPES = [
    { name: 'Rat', icon: '🐀', hp: 3, dmg: [1, 2], minFloor: 1, gold: [1, 3] },
    { name: 'Goblin', icon: '👺', hp: 6, dmg: [1, 3], minFloor: 1, gold: [2, 5] },
    { name: 'Skeleton', icon: '💀', hp: 9, dmg: [2, 4], minFloor: 2, gold: [3, 7] },
    { name: 'Orc', icon: '👹', hp: 13, dmg: [3, 6], minFloor: 3, gold: [5, 10] },
    { name: 'Wraith', icon: '👻', hp: 17, dmg: [4, 7], minFloor: 5, gold: [8, 14] },
];

const MAX_FLOOR = 10;
const VISION_RADIUS = 6;

// State
let sizeKey = sizeSelect.value;
let difficultyKey = difficultySelect.value;

let gridW = 0, gridH = 0;
let grid = [];              // TILE values
let discovered = [];        // bool[y][x] - ever seen
let visible = [];           // bool[y][x] - currently in view
let rooms = [];             // {x,y,w,h}
let enemies = [];           // {x,y,hp,maxHp,type,alive}
let items = [];             // {x,y,type,...}
let player = null;
let floor = 1;
let gameActive = false;
let gameOver = false;
let turnBusy = false;
let killCount = 0;

// Sound (Web Audio, synthesized)
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

function playMoveSound() { playTone(200, 0.05, { type: 'sine', gain: 0.05 }); }
function playBumpSound() { playTone(110, 0.1, { type: 'sawtooth', gain: 0.07 }); }
function playHitSound() { playTone(180, 0.09, { type: 'square', gain: 0.12 }); }
function playPlayerHurtSound() { playTone(140, 0.14, { type: 'sawtooth', gain: 0.14 }); }
function playKillSound() {
    [660, 440].forEach((f, i) => playTone(f, 0.1, { type: 'triangle', gain: 0.12, delay: i * 0.06 }));
}
function playPickupSound() { playTone(760, 0.08, { type: 'triangle', gain: 0.1 }); }
function playKeySound() {
    [523.25, 659.25].forEach((f, i) => playTone(f, 0.14, { type: 'triangle', gain: 0.13, delay: i * 0.08 }));
}
function playDoorSound() { playTone(300, 0.12, { type: 'square', gain: 0.08 }); }
function playSecretSound() {
    [880, 1108.7, 1318.5].forEach((f, i) => playTone(f, 0.16, { type: 'sine', gain: 0.12, delay: i * 0.09 }));
}
function playPotionSound() { playTone(500, 0.08, { type: 'sine', gain: 0.1 }); playTone(700, 0.1, { type: 'sine', gain: 0.09, delay: 0.06 }); }
function playFloorSound() {
    [392, 523.25, 659.25, 783.99].forEach((f, i) => playTone(f, 0.18, { type: 'triangle', gain: 0.14, delay: i * 0.1 }));
}
function playDeathSound() {
    [392, 349.23, 293.66, 220].forEach((f, i) => playTone(f, 0.35, { type: 'sawtooth', gain: 0.13, delay: i * 0.18 }));
}
function playVictorySound() {
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
        playTone(f, 0.22, { type: 'triangle', gain: 0.15, delay: i * 0.11 }));
}

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

// Helper stuff
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
function inBounds(x, y) { return x >= 0 && y >= 0 && x < gridW && y < gridH; }
function tileAt(x, y) { return inBounds(x, y) ? grid[y][x] : TILE.WALL; }
function isWalkableTile(t) {
    return t === TILE.FLOOR || t === TILE.DOOR || t === TILE.RED_DOOR ||
        t === TILE.GOLD_DOOR || t === TILE.STAIRS || t === TILE.SECRET_DOOR;
}
function isOpenForVision(x, y) {
    const t = tileAt(x, y);
    return t !== TILE.WALL && t !== TILE.SECRET_DOOR;
}
function enemyAt(x, y) { return enemies.find(e => e.alive && e.x === x && e.y === y) || null; }
function itemAt(x, y) { return items.find(it => it.x === x && it.y === y) || null; }
function roomCenter(r) { return { x: r.x + (r.w >> 1), y: r.y + (r.h >> 1) }; }
function rectsOverlap(a, b, pad) {
    return a.x - pad < b.x + b.w && a.x + a.w + pad > b.x &&
        a.y - pad < b.y + b.h && a.y + a.h + pad > b.y;
}
function pointInRoom(r, x, y) { return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h; }
function onRoomBorder(r, x, y) {
    if (x < r.x - 1 || x > r.x + r.w || y < r.y - 1 || y > r.y + r.h) return false;
    const onVertEdge = (x === r.x - 1 || x === r.x + r.w) && y >= r.y && y < r.y + r.h;
    const onHorizEdge = (y === r.y - 1 || y === r.y + r.h) && x >= r.x && x < r.x + r.w;
    return onVertEdge || onHorizEdge;
}

// Log
function log(msg, cls) {
    const div = document.createElement('div');
    if (cls) div.className = cls;
    div.textContent = msg;
    logEl.appendChild(div);
    while (logEl.children.length > 60) logEl.removeChild(logEl.firstChild);
    logEl.scrollTop = logEl.scrollHeight;
}
function clearLog() { logEl.innerHTML = ''; }

// Dungeon generation
function generateRooms(w, h, count) {
    const list = [];
    let attempts = 0;
    while (list.length < count && attempts < 600) {
        attempts++;
        const rw = randInt(4, 7);
        const rh = randInt(3, 6);
        const rx = randInt(1, w - rw - 2);
        const ry = randInt(1, h - rh - 2);
        const room = { x: rx, y: ry, w: rw, h: rh };
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

// Carves an L-shaped corridor between two points, turning wall-into-room
// boundary crossings into plain doors so rooms feel enclosed.
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
        if ((borderA || borderB) && grid[p.y][p.x] === TILE.WALL) {
            grid[p.y][p.x] = TILE.DOOR;
        } else if (grid[p.y][p.x] !== TILE.DOOR) {
            grid[p.y][p.x] = TILE.FLOOR;
        }
    }
}

// Builds a simple connected graph: sequential chain + a few random extra
// links, so the dungeon has some loops but stays fully reachable.
function connectRooms(roomList) {
    const order = roomList.map((_, i) => i);
    const edges = [];
    for (let i = 0; i < order.length - 1; i++) edges.push([order[i], order[i + 1]]);

    const extra = Math.max(1, Math.floor(roomList.length / 4));
    for (let i = 0; i < extra; i++) {
        const a = randInt(0, roomList.length - 1);
        const b = randInt(0, roomList.length - 1);
        if (a !== b) edges.push([a, b]);
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

// BFS over the room-adjacency graph to find hop-distance from a start room.
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

function countRoomDoors(r) {
    let count = 0;
    for (let x = r.x - 1; x <= r.x + r.w; x++) {
        for (let y = r.y - 1; y <= r.y + r.h; y++) {
            if (!onRoomBorder(r, x, y)) continue;
            const t = tileAt(x, y);
            if (t === TILE.DOOR || t === TILE.RED_DOOR || t === TILE.GOLD_DOOR) count++;
        }
    }
    return count;
}

function findRoomDoorTile(r) {
    for (let x = r.x - 1; x <= r.x + r.w; x++) {
        for (let y = r.y - 1; y <= r.y + r.h; y++) {
            if (!onRoomBorder(r, x, y)) continue;
            if (tileAt(x, y) === TILE.DOOR) return { x, y };
        }
    }
    return null;
}

function freeFloorTile(r, exclude) {
    const candidates = [];
    for (let y = r.y; y < r.y + r.h; y++) {
        for (let x = r.x; x < r.x + r.w; x++) {
            if (exclude && exclude.some(e => e.x === x && e.y === y)) continue;
            if (grid[y][x] === TILE.FLOOR && !enemyAt(x, y) && !itemAt(x, y)) candidates.push({ x, y });
        }
    }
    return candidates.length ? pick(candidates) : roomCenter(r);
}

// Attempts to attach a hidden secret room to the side of an existing room.
function tryAddSecretRoom(hostRoom, allRooms) {
    const sides = shuffle(['top', 'bottom', 'left', 'right']);
    for (const side of sides) {
        const sw = randInt(3, 4);
        const sh = randInt(3, 4);
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

        const candidate = { x: sx, y: sy, w: sw, h: sh };
        if (sx < 1 || sy < 1 || sx + sw > gridW - 1 || sy + sh > gridH - 1) continue;
        if (allRooms.some(r => rectsOverlap(candidate, r, 1))) continue;
        if (!inBounds(doorX, doorY) || grid[doorY][doorX] !== TILE.WALL) continue;

        // Make sure the whole secret footprint is currently untouched wall.
        let clear = true;
        for (let y = sy; y < sy + sh && clear; y++) {
            for (let x = sx; x < sx + sw; x++) {
                if (grid[y][x] !== TILE.WALL) { clear = false; break; }
            }
        }
        if (!clear) continue;

        carveRoom(candidate);
        grid[doorY][doorX] = TILE.SECRET_DOOR;
        return candidate;
    }
    return null;
}

function buildDungeon() {
    const preset = SIZE_PRESETS[sizeKey];
    gridW = preset.w;
    gridH = preset.h;
    grid = Array.from({ length: gridH }, () => Array(gridW).fill(TILE.WALL));
    discovered = Array.from({ length: gridH }, () => Array(gridW).fill(false));
    visible = Array.from({ length: gridH }, () => Array(gridW).fill(false));
    enemies = [];
    items = [];

    rooms = generateRooms(gridW, gridH, preset.rooms);
    rooms.forEach(carveRoom);
    const adjacency = connectRooms(rooms);

    const startIdx = 0;
    const startRoom = rooms[startIdx];
    const dist = roomBfsDist(adjacency, startIdx);

    // Exit room: farthest reachable room (leaf preferred).
    let exitIdx = startIdx;
    let bestScore = -1;
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

    // Vault room(s): leaf rooms with a single door, locked with gold.
    const vaultCount = gridW > 30 ? 2 : 1;
    const vaultCandidates = rooms
        .map((r, i) => i)
        .filter(i => i !== startIdx && i !== exitIdx && adjacency[i].size === 1);
    shuffle(vaultCandidates);
    const vaultIdxs = vaultCandidates.slice(0, vaultCount);
    const vaultRooms = [];
    vaultIdxs.forEach(idx => {
        const r = rooms[idx];
        const doorTile = findRoomDoorTile(r);
        if (doorTile) {
            grid[doorTile.y][doorTile.x] = TILE.GOLD_DOOR;
            vaultRooms.push(r);
        }
    });

    // Secret room, attached to a random non-special room.
    const secretHostPool = rooms.filter((r, i) => i !== startIdx && i !== exitIdx && !vaultRooms.includes(r));
    shuffle(secretHostPool);
    let secretRoom = null;
    for (const host of secretHostPool) {
        secretRoom = tryAddSecretRoom(host, rooms.concat(secretRoom ? [secretRoom] : []));
        if (secretRoom) break;
    }

    // Player spawn.
    const spawn = roomCenter(startRoom);
    player.x = spawn.x;
    player.y = spawn.y;

    // Key placement: red key + one gold key per vault, in rooms that aren't
    // the start, exit, vaults, or the secret room.
    const keyPool = rooms.filter((r, i) => i !== startIdx && i !== exitIdx && !vaultRooms.includes(r));
    shuffle(keyPool);
    let poolPtr = 0;
    const nextKeyRoom = () => keyPool[poolPtr++ % keyPool.length] || startRoom;

    const redKeySpot = freeFloorTile(nextKeyRoom());
    items.push({ x: redKeySpot.x, y: redKeySpot.y, type: 'redkey' });

    vaultRooms.forEach(() => {
        const spot = freeFloorTile(nextKeyRoom());
        items.push({ x: spot.x, y: spot.y, type: 'goldkey' });
    });

    // Vault loot: a guaranteed weapon upgrade + a gold pile.
    vaultRooms.forEach(vr => {
        const weaponTier = Math.min(WEAPONS.length - 2, 1 + Math.floor((floor - 1) / 3) + randInt(0, 1));
        const weapon = WEAPONS[Math.max(1, weaponTier)];
        const spot1 = freeFloorTile(vr);
        items.push({ x: spot1.x, y: spot1.y, type: 'weapon', weaponId: weapon.id });
        const spot2 = freeFloorTile(vr, [spot1]);
        items.push({ x: spot2.x, y: spot2.y, type: 'gold', amount: randInt(15, 30) + floor * 3 });
        const guardType = ENEMY_TYPES.filter(e => e.minFloor <= floor + 1).slice(-1)[0] || ENEMY_TYPES[0];
        spawnEnemy(vr, guardType, true);
    });

    // Secret room loot: the best weapon, or a big gold stash if already owned.
    if (secretRoom) {
        const spot = freeFloorTile(secretRoom);
        if (player.weapon.tier < WEAPONS.length - 1) {
            items.push({ x: spot.x, y: spot.y, type: 'weapon', weaponId: WEAPONS[WEAPONS.length - 1].id });
        } else {
            items.push({ x: spot.x, y: spot.y, type: 'secretgold', amount: randInt(40, 70) + floor * 5 });
        }
    }

    // Populate the remaining ordinary rooms with enemies and loot.
    const usedRooms = new Set([startIdx, exitIdx, ...vaultIdxs]);
    rooms.forEach((r, i) => {
        if (usedRooms.has(i)) return;
        const diff = DIFFICULTY_PRESETS[difficultyKey];
        const enemyCount = Math.round(randInt(0, 2) * diff.enemyCountMult) + (Math.random() < 0.4 ? 1 : 0);
        for (let n = 0; n < enemyCount; n++) {
            const pool = ENEMY_TYPES.filter(e => e.minFloor <= floor);
            spawnEnemy(r, pick(pool.length ? pool : [ENEMY_TYPES[0]]), false);
        }
        if (Math.random() < 0.6) {
            const spot = freeFloorTile(r);
            items.push({ x: spot.x, y: spot.y, type: 'gold', amount: randInt(2, 8) + floor });
        }
        if (Math.random() < 0.35) {
            const spot = freeFloorTile(r);
            items.push({ x: spot.x, y: spot.y, type: 'potion' });
        }
        if (Math.random() < 0.18) {
            const spot = freeFloorTile(r);
            const tier = Math.min(3, 1 + Math.floor((floor - 1) / 3));
            items.push({ x: spot.x, y: spot.y, type: 'weapon', weaponId: WEAPONS[randInt(1, tier)].id });
        }
    });
}

function spawnEnemy(room, type, elite) {
    const spot = freeFloorTile(room);
    const diff = DIFFICULTY_PRESETS[difficultyKey];
    const floorMult = 1 + (floor - 1) * 0.14;
    const eliteMult = elite ? 1.6 : 1;
    const hp = Math.round(type.hp * diff.enemyHpMult * floorMult * eliteMult);
    enemies.push({
        x: spot.x, y: spot.y, type, hp, maxHp: hp,
        dmgMult: diff.enemyDmgMult * floorMult * (elite ? 1.3 : 1),
        elite, alive: true,
    });
}

// Visibility / fog of war (radius + line-of-sight)
function hasLineOfSight(x0, y0, x1, y1) {
    let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    let sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0, y = y0;
    while (true) {
        if (x === x1 && y === y1) return true;
        if (!(x === x0 && y === y0) && !isOpenForVision(x, y)) return false;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x += sx; }
        if (e2 <= dx) { err += dx; y += sy; }
    }
}

function recomputeVisibility() {
    visible = Array.from({ length: gridH }, () => Array(gridW).fill(false));
    const px = player.x, py = player.y;
    for (let y = Math.max(0, py - VISION_RADIUS); y <= Math.min(gridH - 1, py + VISION_RADIUS); y++) {
        for (let x = Math.max(0, px - VISION_RADIUS); x <= Math.min(gridW - 1, px + VISION_RADIUS); x++) {
            const dist = Math.max(Math.abs(x - px), Math.abs(y - py));
            if (dist > VISION_RADIUS) continue;
            if (hasLineOfSight(px, py, x, y)) {
                visible[y][x] = true;
                discovered[y][x] = true;
            }
        }
    }
}


// Rendering
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

function weaponById(id) { return WEAPONS.find(w => w.id === id) || WEAPONS[0]; }

function renderBoard() {
    computeCellSize();
    boardEl.style.gridTemplateColumns = `repeat(${gridW}, var(--cell-size))`;
    boardEl.innerHTML = '';

    for (let y = 0; y < gridH; y++) {
        for (let x = 0; x < gridW; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.x = x;
            cell.dataset.y = y;

            const seen = discovered[y][x];
            const inView = visible[y][x];
            const tile = grid[y][x];

            if (!seen) {
                cell.classList.add('fogged');
                boardEl.appendChild(cell);
                continue;
            }

            switch (tile) {
                case TILE.WALL: cell.classList.add('wall'); break;
                case TILE.DOOR: cell.classList.add('door'); cell.textContent = '🚪'; break;
                case TILE.RED_DOOR: cell.classList.add('door-red'); cell.textContent = '🔒'; break;
                case TILE.GOLD_DOOR: cell.classList.add('door-gold'); cell.textContent = '🔒'; break;
                case TILE.STAIRS: cell.classList.add('floor', 'stairs'); cell.textContent = '⬇'; break;
                case TILE.SECRET_DOOR:
                    cell.classList.add('wall');
                    if (Math.max(Math.abs(x - player.x), Math.abs(y - player.y)) <= 1) {
                        cell.classList.add('secret-hint');
                    }
                    break;
                default: cell.classList.add('floor');
            }

            if (!inView) cell.classList.add('dim');

            if (inView) {
                const enemy = enemyAt(x, y);
                const item = itemAt(x, y);
                if (enemy) {
                    cell.classList.add('enemy-cell', 'entity-icon');
                    if (enemy.elite) cell.classList.add('elite');
                    if (enemy._hitFlash) { cell.classList.add('hit-flash'); enemy._hitFlash = false; }
                    cell.textContent = enemy.type.icon;
                } else if (item) {
                    cell.classList.add(itemClass(item.type), 'entity-icon');
                    cell.textContent = itemIcon(item);
                }
            }

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
    const hpPct = Math.max(0, Math.round((player.hp / player.maxHp) * 100));
    hpFillEl.style.width = hpPct + '%';
    hpFillEl.className = 'hp-fill' + (hpPct <= 25 ? ' danger' : hpPct <= 55 ? ' warn' : '');
    hpTextEl.textContent = `${Math.max(0, player.hp)} / ${player.maxHp}`;
    goldCountEl.textContent = `💰 ${player.gold}`;
    weaponIconEl.textContent = player.weapon.icon;
    weaponNameEl.textContent = player.weapon.name;
    redKeyDot.classList.toggle('active', player.hasRedKey);
    redKeyStatusEl.textContent = player.hasRedKey ? 'Have Red Key' : 'No Red Key';
    goldKeyDot.classList.toggle('active', player.goldKeys > 0);
    goldKeyStatusEl.textContent = `${player.goldKeys} Gold Key${player.goldKeys === 1 ? '' : 's'}`;
    potionCountEl.textContent = player.potions;
}

function setStatus(text) { statusEl.textContent = text; }

function render() {
    recomputeVisibility();
    renderBoard();
    renderHud();
}

// Combat
function playerAttack(enemy) {
    const [lo, hi] = player.weapon.dmg;
    const dmg = randInt(lo, hi);
    enemy.hp -= dmg;
    enemy._hitFlash = true;
    playHitSound();
    log(`You hit the ${enemy.elite ? 'Elite ' : ''}${enemy.type.name} for ${dmg}.`, 'log-entry-combat');

    if (enemy.hp <= 0) {
        enemy.alive = false;
        killCount++;
        playKillSound();
        const [glo, ghi] = enemy.type.gold;
        const gold = randInt(glo, ghi) * (enemy.elite ? 2 : 1);
        player.gold += gold;
        log(`You defeated the ${enemy.elite ? 'Elite ' : ''}${enemy.type.name}! +${gold} gold.`, 'log-entry-good');
        if (Math.random() < 0.15) {
            player.potions++;
            log('It dropped a health potion!', 'log-entry-loot');
        }
    }
}

function enemyAttack(enemy) {
    const [lo, hi] = enemy.type.dmg;
    const dmg = Math.round(randInt(lo, hi) * enemy.dmgMult);
    player.hp -= dmg;
    player._hitFlash = true;
    playPlayerHurtSound();
    log(`The ${enemy.elite ? 'Elite ' : ''}${enemy.type.name} hits you for ${dmg}.`, 'log-entry-danger');
}

// Item pickup
function pickupItem(item) {
    items = items.filter(it => it !== item);
    switch (item.type) {
        case 'gold':
            player.gold += item.amount;
            playPickupSound();
            log(`You found ${item.amount} gold.`, 'log-entry-loot');
            break;
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
            log('You found the RED KEY! The way onward is open somewhere on this floor.', 'log-entry-good');
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
                log(`Found a ${w.name}, but your ${player.weapon.name} is better. Sold for 5 gold.`, 'log-entry-loot');
            }
            break;
        }
    }
}

// Turn resolution
function enemyTurnStep() {
    for (const enemy of enemies) {
        if (!enemy.alive) continue;
        const distToPlayer = Math.max(Math.abs(enemy.x - player.x), Math.abs(enemy.y - player.y));

        if (distToPlayer <= 1 && (enemy.x === player.x || enemy.y === player.y || distToPlayer === 1)) {
            enemyAttack(enemy);
            continue;
        }

        let canSee = distToPlayer <= VISION_RADIUS + 2 && hasLineOfSight(enemy.x, enemy.y, player.x, player.y);
        if (!canSee && Math.random() > 0.35) continue; // idle wander chance

        let dx = 0, dy = 0;
        if (canSee) {
            dx = Math.sign(player.x - enemy.x);
            dy = Math.sign(player.y - enemy.y);
        } else {
            const d = pick(DIRS4);
            dx = d.x; dy = d.y;
        }

        const tryMoves = [];
        if (dx !== 0 && dy !== 0) { tryMoves.push({ x: dx, y: 0 }, { x: 0, y: dy }); }
        else tryMoves.push({ x: dx, y: dy });
        tryMoves.push(pick(DIRS4));

        for (const m of tryMoves) {
            const nx = enemy.x + m.x, ny = enemy.y + m.y;
            if (nx === player.x && ny === player.y) break;
            if (!isWalkableTile(tileAt(nx, ny))) continue;
            if (tileAt(nx, ny) === TILE.SECRET_DOOR) continue;
            if (enemyAt(nx, ny)) continue;
            enemy.x = nx; enemy.y = ny;
            break;
        }
    }

    if (player.hp <= 0) killPlayer();
}

function afterPlayerAction() {
    if (gameOver) return;
    enemyTurnStep();
    render();
    if (gameOver) return;
}

// Player actions
function tryMove(dx, dy) {
    if (!gameActive || gameOver || turnBusy) return;
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
        afterPlayerAction();
        return;
    }

    if (tile === TILE.RED_DOOR) {
        if (!player.hasRedKey) {
            playBumpSound();
            setStatus('Locked - you need the red key.');
            return;
        }
        grid[ny][nx] = TILE.DOOR;
        playDoorSound();
        log('You unlock the red door.', 'log-entry-good');
        player.x = nx; player.y = ny;
        afterPlayerAction();
        return;
    }

    if (tile === TILE.GOLD_DOOR) {
        if (player.goldKeys <= 0) {
            playBumpSound();
            setStatus('Locked - you need a gold key.');
            return;
        }
        player.goldKeys--;
        grid[ny][nx] = TILE.DOOR;
        playDoorSound();
        log('You unlock the gold vault door.', 'log-entry-good');
        player.x = nx; player.y = ny;
        afterPlayerAction();
        return;
    }

    if (tile === TILE.DOOR) {
        grid[ny][nx] = TILE.FLOOR;
        playDoorSound();
    }

    player.x = nx; player.y = ny;
    playMoveSound();

    const item = itemAt(nx, ny);
    if (item) pickupItem(item);

    if (tile === TILE.STAIRS) {
        afterPlayerAction();
        if (!gameOver) nextFloor();
        return;
    }

    afterPlayerAction();
}

function waitTurn() {
    if (!gameActive || gameOver || turnBusy) return;
    log('You wait a moment...');
    afterPlayerAction();
}

function usePotion() {
    if (!gameActive || gameOver || turnBusy) return;
    if (player.potions <= 0) { setStatus('No potions left!'); return; }
    if (player.hp >= player.maxHp) { setStatus('Already at full health.'); return; }
    player.potions--;
    const heal = randInt(6, 10);
    player.hp = Math.min(player.maxHp, player.hp + heal);
    playPotionSound();
    log(`You drink a potion and recover ${heal} HP.`, 'log-entry-good');
    afterPlayerAction();
}

// Game flow
function newPlayer() {
    const diff = DIFFICULTY_PRESETS[difficultyKey];
    return {
        x: 0, y: 0,
        hp: diff.startHp, maxHp: diff.startHp,
        weapon: WEAPONS[0],
        gold: 0,
        potions: diff.startPotions,
        hasRedKey: false,
        goldKeys: 0,
        _hitFlash: false,
    };
}

function startNewGame() {
    overlay.classList.remove('show');
    clearLog();
    floor = 1;
    killCount = 0;
    player = newPlayer();
    gameActive = true;
    gameOver = false;
    turnBusy = false;
    buildDungeon();
    log(`You descend into the dungeon. Floor ${floor}.`, 'log-entry-good');
    setStatus('Find your way down...');
    render();
}

function nextFloor() {
    if (floor >= MAX_FLOOR) { winGame(); return; }
    floor++;
    player.hasRedKey = false;
    player.goldKeys = 0;
    player.hp = Math.min(player.maxHp, player.hp + 4);
    playFloorSound();
    log(`You descend to floor ${floor}. (+4 HP)`, 'log-entry-good');
    setStatus(`Floor ${floor} - explore carefully.`);
    buildDungeon();
    render();
}

function killPlayer() {
    gameOver = true;
    gameActive = false;
    playDeathSound();
    log('You have died.', 'log-entry-danger');
    overlayMessage.textContent = 'You Died';
    overlayDetail.textContent =
        `Reached Floor ${floor}\n${killCount} enemies defeated\n${player.gold} gold collected`;
    overlay.classList.add('show');
    setStatus('Game over.');
    render();
}

function winGame() {
    gameOver = true;
    gameActive = false;
    playVictorySound();
    log('You escaped the dungeon with your life and your loot!', 'log-entry-good');
    overlayMessage.textContent = 'You Escaped!';
    overlayDetail.textContent =
        `Cleared ${MAX_FLOOR} floors\n${killCount} enemies defeated\n${player.gold} gold collected`;
    overlay.classList.add('show');
    setStatus('Victory!');
    render();
}

// Input
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) e.preventDefault();

    switch (key) {
        case 'w': case 'arrowup': tryMove(0, -1); break;
        case 's': case 'arrowdown': tryMove(0, 1); break;
        case 'a': case 'arrowleft': tryMove(-1, 0); break;
        case 'd': case 'arrowright': tryMove(1, 0); break;
        case ' ': waitTurn(); break;
        case 'p': usePotion(); break;
        case 'm': soundToggleBtn.click(); break;
    }
});

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

// Boot
updateSoundIcon();
startNewGame();
