// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

import { LS } from './config.js';
import { state } from './state.js';
import { showToast } from './toast.js';
import { getCategories, saveCategories, saveSymbols } from './storage.js';
import {
    categoryIndicator,
    categoryDropdown,
    categoryList,
    symbolCategoryInput
} from './dom.js';

const DEFAULT_FALLBACK_CATEGORY = 'Basic Communication';

let refreshBoardCallback = () => { };

export function setBoardRefresh(fn) {
    refreshBoardCallback = fn;
}

export function refreshOrderedCategories() {
    state.categoriesOrdered = [...getCategories()];

    if (state.categoriesOrdered.length && state.currentCategoryIndex >= state.categoriesOrdered.length) {
        state.currentCategoryIndex = 0;
    }

    updateCategoryIndicator();

    if (categoryDropdown && categoryDropdown.style.display !== 'none') {
        populateCategoryDropdown();
    }
}

export function updateCategoryIndicator() {
    if (categoryIndicator && state.categoriesOrdered.length) {
        categoryIndicator.textContent = state.categoriesOrdered[state.currentCategoryIndex] || '';
    }
}

export function persistCategoryIndex() {
    try {
        localStorage.setItem(LS.categoryKey, String(state.currentCategoryIndex));
    } catch { /* noop */ }
}

export function addCategory(name) {
    name = (name || '').trim();
    if (!name) {
        showToast('Please enter a category name');
        return false;
    }

    const categories = getCategories();
    if (categories.includes(name)) {
        showToast('Category already exists');
        return false;
    }

    categories.push(name);
    saveCategories(categories);
    refreshOrderedCategories();
    updateCategorySelects();
    showToast(`Category "${name}" added`);
    return true;
}

export function renameCategory(oldName, newName) {
    newName = (newName || '').trim();
    if (!newName) {
        showToast('Please enter a category name');
        return false;
    }

    const categories = getCategories();
    if (categories.includes(newName) && newName !== oldName) {
        showToast('Category already exists');
        return false;
    }

    const idx = categories.indexOf(oldName);
    if (idx !== -1) categories[idx] = newName;
    saveCategories(categories);

    let changed = 0;
    state.symbols.forEach(s => {
        if (s.category === oldName) {
            s.category = newName;
            changed++;
        }
    });

    if (changed) saveSymbols(true);

    refreshOrderedCategories();
    updateCategorySelects();
    refreshBoardCallback();
    showToast(`Category renamed to "${newName}"`);
    return true;
}

export function deleteCategory(name) {
    if (!name) return false;

    const categories = getCategories();
    const count = state.symbols.filter(s => s.category === name).length;

    // Pick a safe fallback that is NOT the category being deleted.
    let fallback = DEFAULT_FALLBACK_CATEGORY;
    if (name === fallback) {
        // Deleting the default fallback — use any other category, or
        // re-add the default fallback if none remain.
        const others = categories.filter(c => c !== name);
        fallback = others.length ? others[0] : DEFAULT_FALLBACK_CATEGORY;
    } else if (!categories.includes(fallback)) {
        // Fallback doesn't exist yet — create it or use another existing category.
        const others = categories.filter(c => c !== name);
        fallback = others.includes(DEFAULT_FALLBACK_CATEGORY)
            ? DEFAULT_FALLBACK_CATEGORY
            : (others[0] || DEFAULT_FALLBACK_CATEGORY);
    }

    if (count > 0 && !confirm(
        `This category contains ${count} symbol(s). Deleting it will move them to "${fallback}". Continue?`
    )) return false;

    state.symbols.forEach(s => {
        if (s.category === name) s.category = fallback;
    });

    if (count > 0) saveSymbols(true);

    const idx = categories.indexOf(name);
    if (idx !== -1) categories.splice(idx, 1);

    // Guarantee the fallback category exists so the moved symbols remain visible.
    if (!categories.includes(fallback)) categories.push(fallback);

    saveCategories(categories);

    refreshOrderedCategories();
    updateCategorySelects();
    refreshBoardCallback();
    showToast(`Category "${name}" deleted`);
    return true;
}

export function updateCategorySelects(preserveValue) {
    if (!symbolCategoryInput) return;

    const categories = getCategories();
    const current = preserveValue !== undefined ? preserveValue : symbolCategoryInput.value;

    symbolCategoryInput.innerHTML = '';

    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = opt.textContent = cat;
        symbolCategoryInput.appendChild(opt);
    });

    if (current && categories.includes(current)) {
        symbolCategoryInput.value = current;
    }
}

export function toggleCategoryDropdown() {
    if (!categoryDropdown) return;
    if (categoryDropdown.style.display === 'none') {
        openCategoryDropdown();
    } else {
        closeCategoryDropdown();
    }
}

export function openCategoryDropdown() {
    populateCategoryDropdown();
    if (categoryDropdown) categoryDropdown.style.display = 'block';
}

export function closeCategoryDropdown() {
    if (categoryDropdown) categoryDropdown.style.display = 'none';
}

export function populateCategoryDropdown() {
    if (!categoryList) return;

    categoryList.innerHTML = '';

    state.categoriesOrdered.forEach((cat, idx) => {
        const li = document.createElement('li');
        li.textContent = cat;
        li.tabIndex = 0;
        if (idx === state.currentCategoryIndex) li.classList.add('active');

        li.addEventListener('click', e => {
            e.stopPropagation();
            if (idx !== state.currentCategoryIndex) {
                closeCategoryDropdown();
                // This callback is set in main.js
                window.dispatchEvent(new CustomEvent('hmo:category-change', { detail: idx }));
            } else {
                closeCategoryDropdown();
            }
        });

        li.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                li.click();
            }
        });

        categoryList.appendChild(li);
    });
}