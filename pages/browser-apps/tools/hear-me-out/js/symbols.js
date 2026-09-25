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

let renderBoardCallback = () => { };

export function setRenderBoard(fn) {
    renderBoardCallback = fn;
}

export function openEditModal(symbol = null) {
    state.isEditMode = true;
    document.body.classList.add('edit-mode');

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
            image = await fileToDataURL(file);
        } catch {
            alert('Could not read image file.');
            return;
        }
    }

    if (!image) image = text.charAt(0) || '?';

    if (state.currentEditingSymbol && state.currentEditingSymbol.id) {
        const idx = state.symbols.findIndex(s => s.id === state.currentEditingSymbol.id);
        if (idx !== -1) {
            state.symbols[idx] = { ...state.symbols[idx], text, image, color, category };
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

    state.symbols = state.symbols.filter(s => s.id !== state.currentEditingSymbol.id);

    saveSymbols(true);
    refreshOrderedCategories();
    renderBoardCallback();
    closeEditModal();
    showToast('Symbol deleted');
}

export function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('File read error'));
        reader.readAsDataURL(file);
    });
}