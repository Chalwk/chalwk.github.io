// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

import { MAX_IMAGE_BYTES } from './config.js';
import { state } from './state.js';
import { showToast } from './toast.js';
import { openModal, closeModal } from './modals.js';
import { saveSymbols, getCategories, saveCategories } from './storage.js';
import {
    refreshOrderedCategories,
    updateCategorySelects
} from './categories.js';
import {
    editModal,
    symbolForm,
    symbolTextInput,
    symbolImageInput,
    symbolColorInput,
    symbolCategoryInput,
    symbolImageFile,
    deleteBtn
} from './dom.js';
import { updatePhraseDisplay } from './phrase.js';

let renderBoardCallback = () => { };

export function setRenderBoard(fn) {
    renderBoardCallback = fn;
}

export function openEditModal(symbol = null) {
    // NOTE: We deliberately do not force `state.isEditMode` here.
    // The modal is a self-contained editor; forcing edit mode would
    // desync the Edit Mode button in the header.

    if (symbol && symbol.category) {
        const cats = getCategories();
        if (!cats.includes(symbol.category)) {
            cats.push(symbol.category);
            saveCategories(cats);
            refreshOrderedCategories();
        }
    }

    updateCategorySelects();

    if (symbol && symbol.id) {
        state.currentEditingSymbol = symbol;
        symbolTextInput.value = symbol.text || '';
        symbolImageInput.value = symbol.image || '';
        symbolColorInput.value = symbol.color || '#4a86e8';
        symbolCategoryInput.value = symbol.category || 'Basic Communication';
        deleteBtn.style.display = 'inline-block';
    } else {
        state.currentEditingSymbol = null;
        symbolForm.reset();
        if (getCategories().length) symbolCategoryInput.value = 'Basic Communication';
        deleteBtn.style.display = 'none';
    }

    openModal(editModal, '#symbolText');
}

export function closeEditModal() {
    closeModal(editModal);
    state.currentEditingSymbol = null;
    symbolForm.reset();
}

export async function saveSymbolChanges(e) {
    e.preventDefault();

    const text = symbolTextInput.value.trim();
    let image = symbolImageInput.value.trim();
    const color = symbolColorInput.value;
    const category = symbolCategoryInput.value || 'Basic Communication';

    if (!text) {
        alert('Please enter text');
        return;
    }

    const file = symbolImageFile.files && symbolImageFile.files[0];
    if (file) {
        if (file.size > MAX_IMAGE_BYTES) {
            alert(`Image too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`);
            return;
        }

        try {
            // Compress/resize so the resulting data URL is small enough
            // to keep localStorage well under quota.
            image = await compressImage(file);
        } catch {
            alert('Could not read image file.');
            return;
        }
    }

    if (!image) image = text.charAt(0) || '?';

    if (state.currentEditingSymbol && state.currentEditingSymbol.id) {
        const idx = state.symbols.findIndex(s => s.id === state.currentEditingSymbol.id);
        if (idx !== -1) {
            const updated = { ...state.symbols[idx], text, image, color, category };
            state.symbols[idx] = updated;

            // Keep the phrase bar in sync with the edited symbol.
            let phraseChanged = false;
            state.currentPhrase = state.currentPhrase.map(p => {
                if (p && p.id === updated.id) {
                    phraseChanged = true;
                    return updated;
                }
                return p;
            });
            if (phraseChanged) updatePhraseDisplay();
        }
    } else {
        const newId = state.symbols.length ? Math.max(...state.symbols.map(s => s.id)) + 1 : 1;
        state.symbols.push({ id: newId, text, image, color, category });
    }

    saveSymbols(true);
    refreshOrderedCategories();
    renderBoardCallback();
    closeEditModal();
    showToast('Symbol saved');
}

export function deleteSymbol() {
    if (!state.currentEditingSymbol || !state.currentEditingSymbol.id) return;
    if (!confirm('Delete this symbol?')) return;

    const deletedId = state.currentEditingSymbol.id;
    state.symbols = state.symbols.filter(s => s.id !== deletedId);

    // Remove any phrase entries that referenced the deleted symbol.
    const beforeLen = state.currentPhrase.length;
    state.currentPhrase = state.currentPhrase.filter(p => !p || p.id !== deletedId);
    if (state.currentPhrase.length !== beforeLen) updatePhraseDisplay();

    saveSymbols(true);
    refreshOrderedCategories();
    renderBoardCallback();
    closeEditModal();
    showToast('Symbol deleted');
}

/**
 * Read an image file and return a compressed data URL.
 * - Resizes so the largest dimension is at most `maxDim`
 * - Uses JPEG for opaque images (small), PNG only when transparency is needed.
 * This keeps the payload small enough for localStorage.
 */
export function compressImage(file, maxDim = 512, quality = 0.82) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('File read error'));
        reader.onload = () => {
            const img = new Image();
            img.onerror = () => reject(new Error('Image decode error'));
            img.onload = () => {
                let { width, height } = img;
                if (!width || !height) {
                    reject(new Error('Bad image dimensions'));
                    return;
                }

                if (width > maxDim || height > maxDim) {
                    const ratio = Math.min(maxDim / width, maxDim / height);
                    width = Math.max(1, Math.round(width * ratio));
                    height = Math.max(1, Math.round(height * ratio));
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                const isPng = file.type === 'image/png' || file.type === 'image/webp';

                try {
                    if (isPng) {
                        ctx.clearRect(0, 0, width, height);
                        ctx.drawImage(img, 0, 0, width, height);
                        resolve(canvas.toDataURL('image/png'));
                    } else {
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, width, height);
                        ctx.drawImage(img, 0, 0, width, height);
                        resolve(canvas.toDataURL('image/jpeg', quality));
                    }
                } catch (err) {
                    reject(err);
                }
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}

// Kept for backwards compatibility if anything else imports it.
export function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('File read error'));
        reader.readAsDataURL(file);
    });
}