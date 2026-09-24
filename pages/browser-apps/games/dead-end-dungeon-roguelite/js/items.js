// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

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
                        sprite: w.sprite,
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