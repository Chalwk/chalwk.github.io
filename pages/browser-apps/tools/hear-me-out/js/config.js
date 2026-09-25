// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

export const LS = {
    symbolsKey: 'cb.symbols',
    settingsKey: 'cb.settings',
    voiceKey: 'cb.voice',
    categoriesKey: 'cb.categories',
    themeKey: 'cb.theme',
    volumeKey: 'cb.volume',
    categoryKey: 'cb.categoryIndex'
};

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const MAX_PHRASE_HISTORY = 50;

export const defaultCategories = [
    'Activities & Play', 'Basic Communication', 'Body & Health', 'Common Actions',
    'Feelings & Emotions', 'Food & Drink', 'Needs & Wants', 'People & Pronouns',
    'Places', 'Questions', 'Sensory Needs', 'Time & Schedule', 'Descriptors'
];