// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

import { LS } from './config.js';
import { state } from './state.js';
import { showToast } from './toast.js';
import { openModal, closeModal } from './modals.js';
import { getCategories } from './storage.js';
import {
    renameCategory,
    deleteCategory
} from './categories.js';
import {
    settingsModal,
    closeSettingsModal,
    categoriesModal,
    newCategoryName,
    categoriesList,
    infoModal,
    closeInfoBtn,
    settingsThemeSelect,
    settingsVolumeSelect,
    settingsGridSizeSelect,
    settingsAutoSpeakSelect,
    settingsVoiceSelect,
    settingsMenu
} from './dom.js';

export function closeSettingsMenu() {
    const dd = settingsMenu && settingsMenu.parentElement;
    if (dd) dd.classList.remove('active');
}

export function toggleSettingsMenu() {
    const dd = settingsMenu && settingsMenu.parentElement;
    if (dd) dd.classList.toggle('active');
}

export function openSettingsModal() {
    settingsThemeSelect.value = state.settings.theme;
    settingsVolumeSelect.value = String(state.settings.volume);
    settingsGridSizeSelect.value = state.settings.gridSize;

    if (settingsAutoSpeakSelect) {
        settingsAutoSpeakSelect.value = state.settings.autoSpeak ? 'on' : 'off';
    }

    populateSettingsVoices();
    openModal(settingsModal, '#settingsThemeSelect');
    closeSettingsMenu();
}

export function closeSettingsModalHandler() {
    closeModal(settingsModal);
}

export function populateSettingsVoices(showAvailabilityToast = false) {
    if (!('speechSynthesis' in window)) return;

    const voices = speechSynthesis.getVoices();
    settingsVoiceSelect.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Default Voice';

    const stored = localStorage.getItem(LS.voiceKey);
    defaultOption.selected = !stored;
    settingsVoiceSelect.appendChild(defaultOption);

    let foundStored = false;

    voices.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.name;
        opt.textContent = `${v.name}${v.lang ? ` (${v.lang})` : ''}`;

        if (stored && stored === v.name) {
            opt.selected = true;
            foundStored = true;
        }

        settingsVoiceSelect.appendChild(opt);
    });

    if (!foundStored && voices.length && stored) {
        localStorage.removeItem(LS.voiceKey);
        if (showAvailabilityToast) showToast('Previous voice not available, using default');
    }
}

export function openCategoriesModal() {
    renderCategoriesList();
    openModal(categoriesModal, '#newCategoryName');
    closeSettingsMenu();
}

export function closeCategoriesModalHandler() {
    closeModal(categoriesModal);
    newCategoryName.value = '';
}

export function renderCategoriesList() {
    const categories = getCategories();
    categoriesList.innerHTML = '';

    categories.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'category-item';

        const input = document.createElement('input');
        input.type = 'text';
        input.value = cat;
        input.className = 'category-name-input';
        input.setAttribute('aria-label', `Category name: ${cat}`);

        const actions = document.createElement('div');
        actions.className = 'category-actions';

        const renameBtn = document.createElement('button');
        renameBtn.className = 'btn btn-secondary rename-category-btn';
        renameBtn.textContent = 'Rename';
        renameBtn.addEventListener('click', () => {
            if (renameCategory(cat, input.value.trim())) renderCategoriesList();
        });

        const delBtn = document.createElement('button');
        delBtn.className = 'btn btn-danger delete-category-btn';
        delBtn.textContent = 'Delete';
        delBtn.addEventListener('click', () => {
            if (deleteCategory(cat)) renderCategoriesList();
        });

        actions.appendChild(renameBtn);
        actions.appendChild(delBtn);
        div.appendChild(input);
        div.appendChild(actions);
        categoriesList.appendChild(div);
    });
}

export function openInfoModal() {
    openModal(infoModal, '#closeInfoBtn');
}

export function closeInfoModalHandler() {
    closeModal(infoModal);
}