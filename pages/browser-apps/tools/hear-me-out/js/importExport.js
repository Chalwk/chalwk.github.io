// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

import { state } from './state.js';
import { showToast } from './toast.js';
import {
    getCategories,
    saveCategories,
    saveSymbols,
    saveSettings,
    applyTheme
} from './storage.js';
import {
    refreshOrderedCategories,
    persistCategoryIndex,
    updateCategoryIndicator,
    updateCategorySelects
} from './categories.js';
import { renderBoard } from './board.js';
import { closeSettingsMenu } from './settings.js';

export function exportJSON() {
    const payload = {
        symbols: state.symbols,
        settings: state.settings,
        categories: getCategories()
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = 'hear-me-out-export.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    closeSettingsMenu();
}

export function importJSONFile(evt) {
    const file = evt.target.files && evt.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
        try {
            if (typeof reader.result !== 'string') throw new Error('bad file');

            const parsed = JSON.parse(reader.result);

            if (parsed.symbols && Array.isArray(parsed.symbols)) {
                const existingIds = new Set(state.symbols.map(s => s.id));
                let nextId = state.symbols.length ? Math.max(...state.symbols.map(s => s.id)) + 1 : 1;

                parsed.symbols.forEach(s => {
                    const copy = { ...s };
                    if (!copy.id || existingIds.has(copy.id)) copy.id = nextId++;
                    state.symbols.push(copy);
                });

                saveSymbols(true);
            }

            if (parsed.settings && typeof parsed.settings === 'object') {
                state.settings = { ...state.settings, ...parsed.settings };
                saveSettings();
                applyTheme(state.settings.theme);
            }

            const cats = getCategories();
            const imported = Array.isArray(parsed.categories) ? parsed.categories : [];
            const symbolCats = state.symbols.map(s => s.category).filter(Boolean);
            const merged = [...new Set([...cats, ...imported, ...symbolCats])];
            saveCategories(merged);

            refreshOrderedCategories();
            state.currentCategoryIndex = 0;
            persistCategoryIndex();
            updateCategoryIndicator();
            updateCategorySelects();
            renderBoard();
            showToast('Import complete');
        } catch (err) {
            console.error(err);
            alert('Import failed: invalid file');
        }
    };

    reader.readAsText(file);
    evt.target.value = '';
    closeSettingsMenu();
}