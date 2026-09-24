// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// --- Game lifecycle ----------------------------------------------------------
function newPlayer() {
    const diff = DIFFICULTY_PRESETS[difficultyKey];
    return {
        x: 0, y: 0, hp: diff.startHp, maxHp: diff.startHp, weapon: WEAPONS[0], gold: 0,
        potions: diff.startPotions, hasRedKey: false, goldKeys: 0, boons: [], statuses: {},
        firstHitTaken: true, momentumReady: false, _hitFlash: false,
        facing: 'right',
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