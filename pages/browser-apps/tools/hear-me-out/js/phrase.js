// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

import { MAX_PHRASE_HISTORY } from './config.js';
import { state } from './state.js';
import { showToast } from './toast.js';
import { phraseDisplay } from './dom.js';
import { previewSpeak } from './speech.js';
import { isImageSource } from './helpers.js';

export function backupPhrase() {
    state.phraseHistory.push(JSON.stringify(state.currentPhrase));
    if (state.phraseHistory.length > MAX_PHRASE_HISTORY) {
        state.phraseHistory.shift();
    }
}

export function undo() {
    if (!state.phraseHistory.length) {
        showToast('Nothing to undo');
        return;
    }

    try {
        state.currentPhrase = JSON.parse(state.phraseHistory.pop());
        updatePhraseDisplay();
        showToast('Undo');
    } catch {
        showToast('Undo failed');
    }
}

export function addToPhrase(symbol) {
    if (!symbol) return;

    backupPhrase();
    state.currentPhrase.push(symbol);
    updatePhraseDisplay();

    if (state.settings.autoSpeak) previewSpeak(symbol);
}

export function clearPhrase() {
    if (!state.currentPhrase.length) return;

    backupPhrase();
    state.currentPhrase = [];
    updatePhraseDisplay();
}

export async function copyPhrase() {
    if (!state.currentPhrase.length) {
        showToast('Nothing to copy');
        return;
    }

    const text = state.currentPhrase.map(s => s.text).join(' ');

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            showToast('Phrase copied');
            return;
        }
    } catch { /* fall through */ }

    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();

    try {
        document.execCommand('copy');
        showToast('Phrase copied');
    } catch {
        showToast('Copy failed');
    }

    ta.remove();
}

export function computePhraseInsertIndex(clientX) {
    const items = [...phraseDisplay.querySelectorAll('.phrase-item:not(.dragging)')];

    for (let i = 0; i < items.length; i++) {
        const box = items[i].getBoundingClientRect();
        if (clientX < box.left + box.width / 2) return i;
    }

    return items.length;
}

export function setupPhraseItemDrag(item, index) {
    item.addEventListener('pointerdown', e => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;

        state.phraseDrag = {
            item,
            index,
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            moved: false
        };

        try { item.setPointerCapture(e.pointerId); } catch { /* noop */ }
    });

    item.addEventListener('pointermove', e => {
        if (!state.phraseDrag || state.phraseDrag.pointerId !== e.pointerId) return;

        const dx = e.clientX - state.phraseDrag.startX;
        const dy = e.clientY - state.phraseDrag.startY;

        if (!state.phraseDrag.moved && Math.hypot(dx, dy) > 6) {
            state.phraseDrag.moved = true;
            state.phraseDrag.item.classList.add('dragging');
            phraseDisplay.classList.add('drag-active');
        }

        if (state.phraseDrag.moved) e.preventDefault();
    });

    const finish = e => {
        if (!state.phraseDrag || state.phraseDrag.pointerId !== e.pointerId) return;

        const drag = state.phraseDrag;
        state.phraseDrag = null;

        const insertIdx = drag.moved ? computePhraseInsertIndex(e.clientX) : -1;

        drag.item.classList.remove('dragging');
        phraseDisplay.classList.remove('drag-active');

        try { drag.item.releasePointerCapture(e.pointerId); } catch { /* noop */ }

        if (drag.moved) {
            backupPhrase();
            const [moved] = state.currentPhrase.splice(drag.index, 1);
            state.currentPhrase.splice(insertIdx, 0, moved);
            updatePhraseDisplay();
        } else {
            backupPhrase();
            state.currentPhrase.splice(drag.index, 1);
            updatePhraseDisplay();
        }
    };

    item.addEventListener('pointerup', finish);

    item.addEventListener('pointercancel', e => {
        if (!state.phraseDrag || state.phraseDrag.pointerId !== e.pointerId) return;

        state.phraseDrag.item.classList.remove('dragging');
        phraseDisplay.classList.remove('drag-active');

        try { state.phraseDrag.item.releasePointerCapture(e.pointerId); } catch { /* noop */ }
        state.phraseDrag = null;
    });
}

export function updatePhraseDisplay() {
    phraseDisplay.innerHTML = '';
    phraseDisplay.classList.remove('drag-active');

    if (!state.currentPhrase.length) {
        const el = document.createElement('span');
        el.className = 'empty-message';
        el.textContent = 'Select symbols to build your phrase';
        phraseDisplay.appendChild(el);
        return;
    }

    state.currentPhrase.forEach((symbol, index) => {
        const item = document.createElement('div');
        item.className = 'phrase-item';
        item.setAttribute('role', 'listitem');
        item.setAttribute('tabindex', '0');
        item.dataset.index = String(index);
        item.title = 'Tap to remove. Drag to reorder.';

        if (isImageSource(symbol.image)) {
            const img = document.createElement('img');
            img.src = symbol.image;
            img.alt = '';
            img.draggable = false;
            item.appendChild(img);
        } else {
            const emoji = document.createElement('span');
            emoji.style.fontSize = '1.2rem';
            emoji.style.marginRight = '6px';
            emoji.textContent = symbol.image || '';
            item.appendChild(emoji);
        }

        const txt = document.createElement('span');
        txt.textContent = symbol.text;
        item.appendChild(txt);

        setupPhraseItemDrag(item, index);

        item.addEventListener('keydown', e => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                backupPhrase();
                state.currentPhrase.splice(index, 1);
                updatePhraseDisplay();
            } else if (e.key === 'ArrowLeft' && index > 0) {
                e.preventDefault();
                backupPhrase();
                [state.currentPhrase[index - 1], state.currentPhrase[index]] =
                    [state.currentPhrase[index], state.currentPhrase[index - 1]];
                updatePhraseDisplay();
                const items = phraseDisplay.querySelectorAll('.phrase-item');
                if (items[index - 1]) items[index - 1].focus();
            } else if (e.key === 'ArrowRight' && index < state.currentPhrase.length - 1) {
                e.preventDefault();
                backupPhrase();
                [state.currentPhrase[index + 1], state.currentPhrase[index]] =
                    [state.currentPhrase[index], state.currentPhrase[index + 1]];
                updatePhraseDisplay();
                const items = phraseDisplay.querySelectorAll('.phrase-item');
                if (items[index + 1]) items[index + 1].focus();
            }
        });

        phraseDisplay.appendChild(item);
    });
}