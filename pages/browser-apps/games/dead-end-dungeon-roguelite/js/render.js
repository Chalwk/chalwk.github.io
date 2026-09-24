// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

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
    const height = clamp(available, 300, 1400);
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
    const clamped = Math.max(8, Math.min(preset.cellMax, base));
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

// Sprite name for each item type.
function itemSpriteName(item) {
    switch (item.type) {
        case 'gold': return 'gold';
        case 'secretgold': return 'gem';
        case 'potion': return 'potion';
        case 'redkey': return 'redKey';
        case 'goldkey': return 'goldKey';
        case 'weapon': return weaponById(item.weaponId).sprite;
        default: return null;
    }
}

function syncLogPanelWidth() {
    if (!logEl || !boardEl) return;
    const width = boardEl.getBoundingClientRect().width;
    if (width > 0) logEl.style.width = width + 'px';
}

// Full board rebuild every render. Cheap enough at this grid size and
// keeps the logic simple - no diffing needed.
//
// Each cell is drawn as a stack of SVG layers (bottom to top):
//   1. terrain        - wall brick OR textured floor
//   2. map feature    - door / red door / gold door / stairs (falls through
//                       to whatever terrain was underneath)
//   3. entity         - enemy or item (only when the tile is in view)
//   4. player         - overrides whatever entity was on the same tile
function renderBoard() {
    computeCellSize();
    boardEl.style.gridTemplateColumns = `repeat(${gridW}, var(--cell-size))`;
    boardEl.innerHTML = '';
    for (let y = 0; y < gridH; y++) {
        for (let x = 0; x < gridW; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            const seen = discovered[y][x], inView = visible[y][x], tile = grid[y][x];

            // Never-explored tiles are pure fog; nothing to draw.
            if (!seen) {
                cell.classList.add('fogged');
                boardEl.appendChild(cell);
                continue;
            }

            // --- Layer 1: terrain. -----------------------------------------
            // Walls and unrevealed secret doors both look like wall until
            // the player bumps them. Revealed secret doors become FLOOR.
            let terrainLayer;
            if (tile === TILE.WALL || tile === TILE.SECRET_DOOR) {
                cell.classList.add('wall');
                terrainLayer = sprite(variantFor(x, y, WALL_VARIANTS));
                if (tile === TILE.SECRET_DOOR &&
                    Math.max(Math.abs(x - player.x), Math.abs(y - player.y)) <= secretHintRadius()) {
                    cell.classList.add('secret-hint');
                }
            } else {
                cell.classList.add('floor');
                const floorRoom = roomAt(x, y);
                if (floorRoom && floorRoom.floorHue !== undefined) {
                    cell.style.setProperty('--floor-hue', floorRoom.floorHue);
                }
                terrainLayer = sprite(variantFor(x, y, FLOOR_VARIANTS));
            }

            // --- Layer 2: map feature. -------------------------------------
            // Doors and stairs are drawn ON TOP of the terrain so the stone
            // texture still shows around their frame. Map features stay
            // visible on remembered tiles so the player can navigate back
            // to them - only entities are hidden when the tile is dim.
            let featureLayer = '';
            switch (tile) {
                case TILE.DOOR:
                    cell.classList.add('door');
                    featureLayer = sprite('door');
                    break;
                case TILE.RED_DOOR:
                    cell.classList.add('door-red');
                    featureLayer = sprite('doorRed');
                    break;
                case TILE.GOLD_DOOR:
                    cell.classList.add('door-gold');
                    featureLayer = sprite('doorGold');
                    break;
                case TILE.STAIRS:
                    cell.classList.add('stairs');
                    featureLayer = sprite('stairs');
                    break;
            }

            // --- Layer 3: entities. ----------------------------------------
            // Only rendered when the tile is currently in line of sight.
            let entityLayer = '';
            if (inView) {
                const enemy = enemyAt(x, y);
                const item = itemAt(x, y);
                if (enemy) {
                    cell.classList.add('enemy-cell', 'entity-icon');
                    if (enemy.elite) cell.classList.add('elite');
                    if (enemy.hidden) cell.classList.add('hidden-enemy');
                    if (enemy.windup) cell.classList.add('windup');
                    if (enemy._hitFlash) { cell.classList.add('hit-flash'); enemy._hitFlash = false; }
                    entityLayer = sprite(enemy.type.sprite);
                } else if (item) {
                    cell.classList.add(itemClass(item.type), 'entity-icon');
                    entityLayer = sprite(itemSpriteName(item));
                }
            } else {
                cell.classList.add('dim');
            }

            // --- Layer 4: player. ------------------------------------------
            // The player overrides any entity sprite sitting on its tile.
            const isPlayer = (x === player.x && y === player.y);
            if (isPlayer) {
                cell.classList.add('player-cell');
                if (player._hitFlash) { cell.classList.add('player-hit'); player._hitFlash = false; }
                entityLayer = sprite('player');
            }

            cell.innerHTML = terrainLayer + featureLayer + entityLayer;

            // Mirror the player sprite when facing left. The player is
            // always the LAST svg in the cell, so grab the last one.
            if (isPlayer && player.facing === 'left') {
                const svgs = cell.querySelectorAll('svg.sprite');
                const last = svgs[svgs.length - 1];
                if (last) last.classList.add('facing-left');
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
    weaponIconEl.innerHTML = sprite(player.weapon.sprite);
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