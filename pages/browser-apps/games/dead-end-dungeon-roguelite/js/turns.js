// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

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
    if (dx < 0) player.facing = 'left';
    else if (dx > 0) player.facing = 'right';

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