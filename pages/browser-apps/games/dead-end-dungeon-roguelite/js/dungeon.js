// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

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
    allFloorRooms.forEach(r => { r.floorHue = ROOM_HUES[r.type] ?? 222; });

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
        type: { id: 'crypt_warden', name: 'Crypt Warden', sprite: 'boss', dmg: [5, 8], ai: 'boss', gold: [20, 35], tags: ['undead'] },
        dmgMult: DIFFICULTY_PRESETS[difficultyKey].enemyDmgMult * 1.1,
        elite: true, statuses: {}, windup: false, turn: 0, phase2: false, phase3: false,
    };
    enemies.push(boss);
    log('The Crypt Warden seals the sanctuary. Defeat it before you can escape.', 'log-entry-danger');
}