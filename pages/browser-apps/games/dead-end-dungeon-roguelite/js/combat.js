// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

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