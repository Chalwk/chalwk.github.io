// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// --- Boons & choices ---------------------------------------------------------
function addBoon(boon) {
    if (!boon || hasBoon(boon.id)) return;
    player.boons.push(boon);
    // Grant-time effects are data-driven off the boon entry itself.
    boon.onGrant?.(player);
    playSecretSound();
    // Callers log their own message (the string returned from `choose`).
}

// Paints the currently focused choice card so keyboard navigation
// has a visible selection state.
function updateChoiceFocus() {
    const cards = choiceOptionsEl.querySelectorAll('.choice-card');
    cards.forEach((c, i) => c.classList.toggle('choice-focused', i === choiceIndex));
    cards[choiceIndex]?.focus();
}

// Modal for boons/weapons/secret rewards. The overlay blocks input
// until the player clicks a card (or presses Space on the focused card).
// Options may supply either a `sprite` name or an `icon` glyph.
function openChoice({ kicker = 'DISCOVERY', title, description, options, advanceTurn = true }) {
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
        const iconHtml = option.sprite ? sprite(option.sprite) : (option.icon || '');
        button.innerHTML = `<span class="choice-icon">${iconHtml}</span><span class="choice-copy"><strong>${option.title}</strong><small>${option.desc}</small></span>`;
        button.addEventListener('click', () => {
            const result = option.choose?.();
            choicePending = false;
            choiceOverlay.classList.remove('show');
            choiceOverlay.setAttribute('aria-hidden', 'true');
            if (result) log(result, 'log-entry-good');
            // Picking a reward normally burns the turn - enemies act now.
            if (advanceTurn && !gameOver) enemyTurnStep();
            render();
        }, { once: true });
        choiceOptionsEl.appendChild(button);
        if (index === 0) setTimeout(() => button.focus(), 0);
    });
    choiceOverlay.classList.add('show');
    choiceOverlay.setAttribute('aria-hidden', 'false');
    updateChoiceFocus();
    render();
}

function chooseBoon(title = 'Choose a Boon', kicker = 'RUN BUILD', count = 3, advanceTurn = true) {
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
        advanceTurn,
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
        sprite: w.sprite,
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
    room.entered = true;
    playSecretSound();
    const legendary = WEAPONS[WEAPONS.length - 1];
    const options = [
        {
            sprite: legendary.sprite,
            title: legendary.name,
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
            chooseBoon('Claim Your Gauntlet Reward', 'GAUNTLET CLEARED', 2, false);
            return true;
        }
    }
    return false;
}