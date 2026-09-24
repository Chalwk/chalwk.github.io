// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// --- Constants -----------------------------------------------------------

// Every tile the board can hold. Values 1..6 are walkable in some form
// (secret doors are walkable only after you bump them).
const TILE = {
    WALL: 0,
    FLOOR: 1,
    DOOR: 2,
    RED_DOOR: 3,
    GOLD_DOOR: 4,
    STAIRS: 5,
    SECRET_DOOR: 6,
};

// Cardinal directions - used for AI movement fallbacks and key handling.
const DIRS4 = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
];

// Grid dimensions and target room counts per difficulty setting.
const SIZE_PRESETS = {
    small: { w: 27, h: 19, rooms: 7, cellMax: 30 },
    medium: { w: 35, h: 21, rooms: 10, cellMax: 32 },
    large: { w: 41, h: 23, rooms: 14, cellMax: 34 },
};

// Difficulty knobs: HP, starting potions, and multipliers on enemies.
const DIFFICULTY_PRESETS = {
    easy: { startHp: 26, startPotions: 2, enemyHpMult: 0.8, enemyDmgMult: 0.75, enemyCountMult: 0.8 },
    normal: { startHp: 20, startPotions: 1, enemyHpMult: 1, enemyDmgMult: 1, enemyCountMult: 1 },
    hard: { startHp: 16, startPotions: 1, enemyHpMult: 1.3, enemyDmgMult: 1.3, enemyCountMult: 1.3 },
};

// Weapon ladder. Higher tiers = more raw damage + unique on-hit effects.
// `sprite` names point into sprites.js.
const WEAPONS = [
    {
        id: 'fists', name: 'Fists', sprite: 'weaponFists', dmg: [1, 2], tier: 0,
        description: 'Reliable, if painfully basic.',
    },
    {
        id: 'dagger', name: 'Dagger', sprite: 'weaponDagger', dmg: [2, 4], tier: 1,
        description: '25% crit chance. +2 crit damage and +2 damage against enemies below 50% HP.',
        crit: 0.25, critBonus: 2, finisher: 2,
    },
    {
        id: 'sword', name: 'Sword', sprite: 'weaponSword', dmg: [3, 6], tier: 2,
        description: 'Balanced damage. Strikes an adjacent enemy for 1-2 cleave damage.',
        cleave: true,
    },
    {
        id: 'axe', name: 'Axe', sprite: 'weaponAxe', dmg: [4, 8], tier: 3,
        description: 'Heavy hits apply Vulnerable for 2 turns.',
        vulnerable: 2,
    },
    {
        id: 'hammer', name: 'War Hammer', sprite: 'weaponHammer', dmg: [5, 10], tier: 4,
        description: '25% chance to Stun for 1 turn. Powerful hits knock enemies back.',
        stun: 0.25, knockback: true,
    },
];

// Enemy roster. minFloor gates when they start showing up; ai selects the
// move-selection branch in chooseEnemyMove(); aggro is their sight range.
// `sprite` names point into sprites.js.
const ENEMY_TYPES = [
    { id: 'rat', name: 'Rat', sprite: 'rat', hp: 3, dmg: [1, 2], minFloor: 1, gold: [1, 3], ai: 'coward', aggro: 5, tags: [] },
    { id: 'goblin', name: 'Goblin', sprite: 'goblin', hp: 6, dmg: [1, 3], minFloor: 1, gold: [2, 5], ai: 'skirmisher', aggro: 8, tags: [] },
    { id: 'skeleton', name: 'Skeleton', sprite: 'skeleton', hp: 9, dmg: [2, 4], minFloor: 2, gold: [3, 7], ai: 'sentinel', aggro: 7, tags: ['undead'] },
    { id: 'orc', name: 'Orc', sprite: 'orc', hp: 13, dmg: [3, 6], minFloor: 3, gold: [5, 10], ai: 'brute', aggro: 9, tags: [] },
    { id: 'wraith', name: 'Wraith', sprite: 'wraith', hp: 17, dmg: [4, 7], minFloor: 5, gold: [8, 14], ai: 'stalker', aggro: 12, tags: ['undead'] },
    { id: 'spider', name: 'Cave Spider', sprite: 'spider', hp: 8, dmg: [2, 4], minFloor: 4, gold: [4, 8], ai: 'ambusher', aggro: 6, tags: [] },
];

// Each floor gets one of these. They mutate spawn stats, gold, vision, etc.
// The optional hooks let a theme add behavior without special-casing elsewhere.
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

// Run-long buffs. Each one is checked by id in the relevant mechanic
// (see hasBoon('...') usages) so the effects are easy to trace.
// Grant-time effects live on the entry itself via onGrant(player).
const BOONS = [
    { id: 'blood_frenzy', name: 'Blood Frenzy', icon: '🩸', desc: '+1 weapon damage while below 50% HP.' },
    { id: 'executioner', name: 'Executioner', icon: '☠️', desc: '+3 damage against enemies below 25% HP.' },
    { id: 'scavenger', name: 'Scavenger', icon: '💰', desc: 'Enemy gold drops +50%.' },
    { id: 'thick_skin', name: 'Thick Skin', icon: '🛡️', desc: 'The first hit you take on each floor deals 2 less damage.' },
    { id: 'treasure_sense', name: 'Treasure Sense', icon: '👁️', desc: 'Secret doors shimmer from 3 tiles away.' },
    { id: 'vampiric', name: 'Vampiric', icon: '🦇', desc: 'Killing an enemy restores 1 HP.' },
    { id: 'momentum', name: 'Momentum', icon: '⚡', desc: 'After a kill, your next attack deals +2 damage.' },
    { id: 'alchemist', name: 'Alchemist', icon: '🧪', desc: 'Potions heal +3 HP and restore 1 extra HP at floor start.' },
    {
        id: 'iron_will', name: 'Iron Will', icon: '⛓️', desc: '+3 maximum HP.',
        onGrant(player) {
            player.maxHp += 3;
            player.hp = Math.min(player.maxHp, player.hp + 3);
        },
    },
    { id: 'fortune', name: 'Fortune', icon: '🍀', desc: '25% chance to double ordinary gold pickups.' },
    { id: 'scouting', name: 'Pathfinder', icon: '🧭', desc: 'Vision radius +1 and room entrances are highlighted.' },
    {
        id: 'glass_fang', name: 'Glass Fang', icon: '🔷', desc: '+15% critical chance, but maximum HP -2.',
        onGrant(player) {
            player.maxHp = Math.max(1, player.maxHp - 2);
            player.hp = Math.min(player.maxHp, player.hp);
        },
    },
];

// Room "biomes" inside a floor. The `type` string drives the room-entry
// triggers in triggerRoomEntry() and selects the floor sprite set via
// ROOM_FLOORS below.
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

const ROOM_FLOORS = {
    normal: ['floorA', 'floorB', 'floorC'],
    start: ['floorStartA', 'floorStartB', 'floorStartC'],
    exit: ['floorExitA', 'floorExitB', 'floorExitC'],
    vault: ['floorVaultA', 'floorVaultB', 'floorVaultC'],
    shrine: ['floorShrineA', 'floorShrineB', 'floorShrineC'],
    armory: ['floorArmoryA', 'floorArmoryB', 'floorArmoryC'],
    treasury: ['floorTreasuryA', 'floorTreasuryB', 'floorTreasuryC'],
    gauntlet: ['floorGauntletA', 'floorGauntletB', 'floorGauntletC'],
    library: ['floorLibraryA', 'floorLibraryB', 'floorLibraryC'],
    healing: ['floorHealingA', 'floorHealingB', 'floorHealingC'],
    secret: ['floorSecretA', 'floorSecretB', 'floorSecretC'],
    boss: ['floorBossA', 'floorBossB', 'floorBossC'],
};