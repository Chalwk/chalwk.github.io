// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// Constants
const COLS = 6;
const ROWS = 4;
const TOTAL = COLS * ROWS; // 24
const SOUND_KEY = 'guesswho.sound';
const STATS_KEY = 'guesswho.stats';
const MAX_UNDOS = 3;
const BOARD_ORDER = ['faces1.png', 'faces2.png'];

// AI difficulty profiles
const AI_PROFILES = {
    easy: { randomChance: 0.45, earlyGuessThreshold: 0.0, maxQuestions: 8 },
    medium: { randomChance: 0.15, earlyGuessThreshold: 0.0, maxQuestions: 7 },
    hard: { randomChance: 0.0, earlyGuessThreshold: 0.75, maxQuestions: 6 },
};

// Character traits
// Order is left-to-right, top-to-bottom
const BOARDS = {
    'faces1.png': [
        // Row 1
        { name: 'Alex', gender: 'male', hairColor: 'brown', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Maria', gender: 'female', hairColor: 'blonde', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
        { name: 'Bernard', gender: 'male', hairColor: 'gray', hairLength: 'short', bald: false, facialHair: 'mustache', glasses: true, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Anita', gender: 'female', hairColor: 'black', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: true, eyeColor: 'brown', skinTone: 'dark', freckles: false, bigNose: false, earrings: true },
        { name: 'Eric', gender: 'male', hairColor: 'red', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'green', skinTone: 'light', freckles: true, bigNose: false, earrings: false },
        { name: 'Claire', gender: 'female', hairColor: 'black', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
        // Row 2
        { name: 'Bill', gender: 'male', hairColor: 'brown', hairLength: 'short', bald: false, facialHair: 'beard', glasses: false, hat: true, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Susan', gender: 'female', hairColor: 'red', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'green', skinTone: 'light', freckles: true, bigNose: false, earrings: true },
        { name: 'George', gender: 'male', hairColor: null, hairLength: null, bald: true, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Anne', gender: 'female', hairColor: 'gray', hairLength: 'short', bald: false, facialHair: 'none', glasses: true, hat: false, headband: false, eyeColor: 'blue', skinTone: 'dark', freckles: false, bigNose: false, earrings: true },
        { name: 'Alfred', gender: 'male', hairColor: 'brown', hairLength: 'short', bald: false, facialHair: 'mustache', glasses: false, hat: true, headband: false, eyeColor: 'brown', skinTone: 'medium', freckles: false, bigNose: false, earrings: false },
        { name: 'Sophie', gender: 'female', hairColor: 'blonde', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: true, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: true, bigNose: false, earrings: false },
        // Row 3
        { name: 'Rachel', gender: 'female', hairColor: 'gray', hairLength: 'short', bald: false, facialHair: 'none', glasses: true, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
        { name: 'Charles', gender: 'male', hairColor: 'black', hairLength: 'short', bald: false, facialHair: 'none', glasses: true, hat: false, headband: false, eyeColor: 'brown', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'David', gender: 'male', hairColor: 'black', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'dark', freckles: false, bigNose: false, earrings: false },
        { name: 'Laura', gender: 'female', hairColor: 'brown', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'green', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
        { name: 'Max', gender: 'male', hairColor: 'blonde', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Emily', gender: 'female', hairColor: 'black', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: true, eyeColor: 'brown', skinTone: 'medium', freckles: false, bigNose: false, earrings: true },
        // Row 4
        { name: 'Herman', gender: 'male', hairColor: 'brown', hairLength: 'short', bald: false, facialHair: 'none', glasses: true, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Jane', gender: 'female', hairColor: 'red', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
        { name: 'Joe', gender: 'male', hairColor: 'gray', hairLength: 'short', bald: false, facialHair: 'beard', glasses: false, hat: true, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: true, earrings: false },
        { name: 'Grace', gender: 'female', hairColor: 'black', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'brown', skinTone: 'dark', freckles: false, bigNose: false, earrings: true },
        { name: 'Peter', gender: 'male', hairColor: null, hairLength: null, bald: true, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: true, earrings: false },
        { name: 'Julia', gender: 'female', hairColor: 'black', hairLength: 'long', bald: false, facialHair: 'none', glasses: true, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
    ],
    'faces2.png': [
        // Row 1
        { name: 'Tom', gender: 'male', hairColor: 'black', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Anita', gender: 'female', hairColor: 'red', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'green', skinTone: 'light', freckles: true, bigNose: false, earrings: false },
        { name: 'Phillip', gender: 'male', hairColor: null, hairLength: null, bald: true, facialHair: 'mustache', glasses: true, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Kate', gender: 'female', hairColor: 'blonde', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: true, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
        { name: 'Frans', gender: 'male', hairColor: 'black', hairLength: 'short', bald: false, facialHair: 'beard', glasses: false, hat: false, headband: false, eyeColor: 'brown', skinTone: 'medium', freckles: false, bigNose: false, earrings: false },
        { name: 'Maria', gender: 'female', hairColor: 'gray', hairLength: 'short', bald: false, facialHair: 'none', glasses: true, hat: true, headband: false, eyeColor: 'brown', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
        // Row 2
        { name: 'Robert', gender: 'male', hairColor: 'brown', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: true, headband: false, eyeColor: 'brown', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Sarah', gender: 'female', hairColor: 'black', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'brown', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
        { name: 'Sam', gender: 'male', hairColor: 'brown', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: true, bigNose: false, earrings: false },
        { name: 'Richard', gender: 'male', hairColor: 'brown', hairLength: 'short', bald: false, facialHair: 'mustache', glasses: false, hat: true, headband: false, eyeColor: 'brown', skinTone: 'medium', freckles: false, bigNose: false, earrings: false },
        { name: 'Olivia', gender: 'female', hairColor: 'red', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'green', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
        { name: 'Anne', gender: 'female', hairColor: 'black', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: true, eyeColor: 'brown', skinTone: 'dark', freckles: false, bigNose: false, earrings: true },
        // Row 3
        { name: 'Paul', gender: 'male', hairColor: 'gray', hairLength: 'short', bald: false, facialHair: 'beard', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Julia', gender: 'female', hairColor: 'brown', hairLength: 'long', bald: false, facialHair: 'none', glasses: true, hat: false, headband: false, eyeColor: 'blue', skinTone: 'medium', freckles: false, bigNose: false, earrings: true },
        { name: 'Peter', gender: 'male', hairColor: 'black', hairLength: 'short', bald: false, facialHair: 'none', glasses: true, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Emily', gender: 'female', hairColor: 'gray', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
        { name: 'Herman', gender: 'male', hairColor: 'red', hairLength: 'short', bald: false, facialHair: 'beard', glasses: false, hat: true, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Claire', gender: 'female', hairColor: 'black', hairLength: 'long', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'brown', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
        // Row 4
        { name: 'Alex', gender: 'male', hairColor: 'brown', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: true, headband: false, eyeColor: 'brown', skinTone: 'light', freckles: false, bigNose: true, earrings: false },
        { name: 'Charles', gender: 'male', hairColor: 'black', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'brown', skinTone: 'dark', freckles: false, bigNose: false, earrings: false },
        { name: 'Laura', gender: 'female', hairColor: 'brown', hairLength: 'long', bald: false, facialHair: 'none', glasses: true, hat: false, headband: false, eyeColor: 'green', skinTone: 'light', freckles: false, bigNose: false, earrings: true },
        { name: 'George', gender: 'male', hairColor: null, hairLength: null, bald: true, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Bernard', gender: 'male', hairColor: 'blonde', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: false, eyeColor: 'blue', skinTone: 'light', freckles: false, bigNose: false, earrings: false },
        { name: 'Susan', gender: 'female', hairColor: 'black', hairLength: 'short', bald: false, facialHair: 'none', glasses: false, hat: false, headband: true, eyeColor: 'brown', skinTone: 'medium', freckles: false, bigNose: false, earrings: true },
    ]
};

const QUESTION_DEFS = [
    { id: 'male', label: 'Is your character male?', test: c => c.gender === 'male' },
    { id: 'female', label: 'Is your character female?', test: c => c.gender === 'female' },
    { id: 'hair-black', label: 'Does your character have black hair?', test: c => c.hairColor === 'black' },
    { id: 'hair-brown', label: 'Does your character have brown hair?', test: c => c.hairColor === 'brown' },
    { id: 'hair-blonde', label: 'Does your character have blonde hair?', test: c => c.hairColor === 'blonde' },
    { id: 'hair-red', label: 'Does your character have red hair?', test: c => c.hairColor === 'red' },
    { id: 'hair-gray', label: 'Does your character have gray hair?', test: c => c.hairColor === 'gray' },
    { id: 'bald', label: 'Is your character bald?', test: c => c.bald === true },
    { id: 'long-hair', label: 'Does your character have long hair?', test: c => c.hairLength === 'long' },
    { id: 'short-hair', label: 'Does your character have short hair?', test: c => c.hairLength === 'short' },
    { id: 'mustache', label: 'Does your character have a mustache?', test: c => c.facialHair === 'mustache' },
    { id: 'beard', label: 'Does your character have a beard?', test: c => c.facialHair === 'beard' },
    { id: 'clean', label: 'Is your character clean-shaven?', test: c => c.facialHair === 'none' },
    { id: 'glasses', label: 'Does your character wear glasses?', test: c => c.glasses === true },
    { id: 'hat', label: 'Does your character wear a hat?', test: c => c.hat === true },
    { id: 'headband', label: 'Does your character wear a headband or bandana?', test: c => c.headband === true },
    { id: 'eyes-brown', label: 'Does your character have brown eyes?', test: c => c.eyeColor === 'brown' },
    { id: 'eyes-blue', label: 'Does your character have blue eyes?', test: c => c.eyeColor === 'blue' },
    { id: 'eyes-green', label: 'Does your character have green eyes?', test: c => c.eyeColor === 'green' },
    { id: 'skin-light', label: 'Does your character have light skin?', test: c => c.skinTone === 'light' },
    { id: 'skin-medium', label: 'Does your character have medium skin?', test: c => c.skinTone === 'medium' },
    { id: 'skin-dark', label: 'Does your character have dark skin?', test: c => c.skinTone === 'dark' },
    { id: 'freckles', label: 'Does your character have freckles?', test: c => c.freckles === true },
    { id: 'big-nose', label: 'Does your character have a big nose?', test: c => c.bigNose === true },
    { id: 'earrings', label: 'Does your character wear earrings?', test: c => c.earrings === true },
];