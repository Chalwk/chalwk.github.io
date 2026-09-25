// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

import { LS } from './config.js';
import { state } from './state.js';
import { showToast } from './toast.js';

export function saveSymbols(silent = false) {
    try {
        localStorage.setItem(LS.symbolsKey, JSON.stringify(state.symbols));
        if (!silent) showToast('Symbols saved');
    } catch (err) {
        console.error(err);
        showToast('Save failed - storage full?');
    }
}

export async function loadSymbolsFromFile() {
    try {
        const response = await fetch('symbols.txt');
        if (!response.ok) throw new Error('not found');
        const text = await response.text();

        return text
            .split('\n')
            .filter(l => l.trim())
            .map((line, i) => {
                const [text, image, color, category] = line.split(';').map(s => s.trim());
                return { id: i + 1, text, image, color, category };
            })
            .filter(s => s.text && s.image && s.color && s.category);
    } catch {
        showToast('Failed to load symbols.txt, using empty board');
        return [];
    }
}

export async function loadSymbols() {
    const raw = localStorage.getItem(LS.symbolsKey);

    try {
        state.symbols = raw ? JSON.parse(raw) : await loadSymbolsFromFile();
    } catch {
        state.symbols = await loadSymbolsFromFile();
    }

    if (!Array.isArray(state.symbols)) state.symbols = [];
    if (!raw) saveSymbols(true);
}

export function saveSettings() {
    localStorage.setItem(LS.settingsKey, JSON.stringify(state.settings));
    localStorage.setItem(LS.volumeKey, String(state.settings.volume));
    localStorage.setItem(LS.themeKey, state.settings.theme);
}

export function loadSettings() {
    try {
        const raw = localStorage.getItem(LS.settingsKey);
        if (raw) Object.assign(state.settings, JSON.parse(raw));
    } catch { /* noop */ }

    const savedVolume = localStorage.getItem(LS.volumeKey);
    if (savedVolume) state.settings.volume = parseFloat(savedVolume) || 0.6;

    const savedTheme = localStorage.getItem(LS.themeKey);
    if (savedTheme) state.settings.theme = savedTheme;
}

export function applyTheme(theme) {
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-high-contrast', 'theme-auto');
    document.body.classList.add(`theme-${theme || 'auto'}`);

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
        meta.content = {
            light: '#4a86e8',
            dark: '#111827',
            'high-contrast': '#000000',
            auto: '#4a86e8'
        }[theme] || '#4a86e8';
    }
}

export function saveTheme(theme) {
    state.settings.theme = theme;
    saveSettings();
    applyTheme(theme);
    showToast(`Theme set to ${theme}`);
}

export function getCategories() {
    try {
        const raw = localStorage.getItem(LS.categoriesKey);
        const parsed = raw ? JSON.parse(raw) : null;
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function saveCategories(categories) {
    localStorage.setItem(LS.categoriesKey, JSON.stringify(categories));
}