// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

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