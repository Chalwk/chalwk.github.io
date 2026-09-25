// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

import { state } from './state.js';
import { board } from './dom.js';
import { isImageSource } from './helpers.js';
import {
    updateCategoryIndicator,
    persistCategoryIndex
} from './categories.js';
import { openEditModal } from './symbols.js';
import { addToPhrase } from './phrase.js';
import { previewSpeak } from './speech.js';

export function animateCategoryChange(newIndex) {
    if (state.isAnimating || !state.categoriesOrdered.length || newIndex === state.currentCategoryIndex) return;

    state.isAnimating = true;
    board.style.transition = 'opacity 0.15s ease';
    board.style.opacity = '0';

    setTimeout(() => {
        state.currentCategoryIndex = newIndex;
        persistCategoryIndex();
        updateCategoryIndicator();
        renderBoard();
        board.style.opacity = '1';

        setTimeout(() => {
            state.isAnimating = false;
        }, 150);
    }, 150);
}

export function renderBoard() {
    board.innerHTML = '';

    const currentCat = state.categoriesOrdered[state.currentCategoryIndex] || '';
    const filtered = state.symbols.filter(s => s.category === currentCat);

    filtered.forEach((symbol, index) => {
        const node = document.createElement('div');
        node.className = 'symbol' + (state.isEditMode ? ' editing' : '');
        node.setAttribute('role', 'listitem');
        node.setAttribute('tabindex', '0');
        node.setAttribute('aria-label', `${symbol.text}. Symbol ${index + 1} of ${filtered.length}.`);
        node.style.backgroundColor = symbol.color || '';

        const numSpan = document.createElement('span');
        numSpan.className = 'symbol-number';
        numSpan.textContent = String(index + 1);
        node.appendChild(numSpan);

        if (isImageSource(symbol.image)) {
            const img = document.createElement('img');
            img.src = symbol.image;
            img.alt = symbol.text;
            img.loading = 'lazy';
            img.draggable = false;
            node.appendChild(img);
        } else {
            const emojiSpan = document.createElement('span');
            emojiSpan.className = 'symbol-emoji';
            emojiSpan.textContent = symbol.image || '?';
            node.appendChild(emojiSpan);
        }

        const textSpan = document.createElement('span');
        textSpan.textContent = symbol.text;
        node.appendChild(textSpan);

        node.addEventListener('click', () => {
            if (state.isEditMode) openEditModal(symbol);
            else addToPhrase(symbol);
        });

        let pressTimer = null;
        let startX = 0;
        let startY = 0;

        const clearPressTimer = () => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
        };

        node.addEventListener('pointerdown', e => {
            if (state.isEditMode) return;

            startX = e.clientX;
            startY = e.clientY;
            clearPressTimer();

            pressTimer = setTimeout(() => {
                pressTimer = null;
                previewSpeak(symbol);
            }, 550);
        });

        node.addEventListener('pointermove', e => {
            if (!pressTimer) return;
            if (Math.hypot(e.clientX - startX, e.clientY - startY) > 12) clearPressTimer();
        });

        ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev =>
            node.addEventListener(ev, clearPressTimer)
        );

        node.addEventListener('keydown', ev => {
            if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault();
                state.isEditMode ? openEditModal(symbol) : addToPhrase(symbol);
            } else if (ev.key === 'e' && state.isEditMode) {
                openEditModal(symbol);
            }
        });

        board.appendChild(node);
    });

    applyGridSetting();
}

export function applyGridSetting() {
    if (!board) return;

    board.classList.remove('grid-3x4', 'grid-4x6', 'grid-6x8', 'fixed-grid');

    if (state.settings.gridSize && state.settings.gridSize !== 'auto') {
        board.classList.add('fixed-grid', `grid-${state.settings.gridSize}`);
    }
}