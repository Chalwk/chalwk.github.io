// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

import { LS, defaultCategories } from './config.js';
import { state } from './state.js';
import { showToast } from './toast.js';
import {
    boardWrap,
    phraseDisplay,
    speakBtn,
    clearBtn,
    undoBtn,
    copyBtn,
    editModeBtn,
    saveBtn,
    addSymbolBtn,
    closeModalBtn,
    symbolForm,
    deleteBtn,
    cancelEditBtn,
    exportBtn,
    importFile,
    manageCategoriesBtn,
    closeCategoriesModal,
    closeCategoriesBtn,
    addCategoryBtn,
    newCategoryName,
    openSettingsPanelBtn,
    closeSettingsModal,
    closeSettingsBtn,
    settingsThemeSelect,
    settingsVolumeSelect,
    settingsGridSizeSelect,
    settingsAutoSpeakSelect,
    settingsVoiceSelect,
    settingsToggle,
    settingsMenu,
    infoToggle,
    closeInfoModal,
    closeInfoBtn,
    categoryIndicator,
    categoryDropdown,
    boardPrevBtn,
    boardNextBtn,
    editModal,
    categoriesModal,
    settingsModal,
    infoModal
} from './dom.js';
import {
    registerModalCloser,
    trapFocus,
    closeTopModal,
    setupModalBackdrops
} from './modals.js';
import {
    loadSettings,
    applyTheme,
    loadSymbols,
    saveSymbols,
    saveSettings,
    saveTheme,
    getCategories,
    saveCategories
} from './storage.js';
import {
    refreshOrderedCategories,
    updateCategoryIndicator,
    updateCategorySelects,
    toggleCategoryDropdown,
    closeCategoryDropdown,
    setBoardRefresh,
    addCategory
} from './categories.js';
import {
    openEditModal,
    closeEditModal,
    saveSymbolChanges,
    deleteSymbol,
    setRenderBoard
} from './symbols.js';
import {
    renderBoard,
    applyGridSetting,
    animateCategoryChange
} from './board.js';
import {
    undo,
    addToPhrase,
    clearPhrase,
    copyPhrase,
    updatePhraseDisplay
} from './phrase.js';
import { speakPhrase, previewSpeak } from './speech.js';
import { exportJSON, importJSONFile } from './importExport.js';
import {
    closeSettingsMenu,
    toggleSettingsMenu,
    openSettingsModal,
    closeSettingsModalHandler,
    populateSettingsVoices,
    openCategoriesModal,
    closeCategoriesModalHandler,
    openInfoModal,
    closeInfoModalHandler,
    renderCategoriesList
} from './settings.js';
import { setupSwipeNavigation } from './swipe.js';

function toggleEditMode() {
    state.isEditMode = !state.isEditMode;
    document.body.classList.toggle('edit-mode', state.isEditMode);

    editModeBtn.textContent = '';
    const icon = document.createElement('i');
    icon.className = state.isEditMode ? 'fas fa-sign-out-alt' : 'fas fa-edit';
    editModeBtn.appendChild(icon);
    editModeBtn.appendChild(document.createTextNode(state.isEditMode ? ' Exit Edit Mode' : ' Edit Mode'));

    renderBoard();
    closeSettingsMenu();
}

function speakCardNumber(key, ctrlKey, altKey) {
    const currentCat = state.categoriesOrdered[state.currentCategoryIndex] || '';
    const filtered = state.symbols.filter(s => s.category === currentCat);

    let cardIndex = -1;
    let offset = 0;

    if (ctrlKey && altKey) offset = 30;
    else if (altKey) offset = 20;
    else if (ctrlKey) offset = 10;

    if (key === '0') cardIndex = 9 + offset;
    else if (key >= '1' && key <= '9') cardIndex = (parseInt(key, 10) - 1) + offset;

    if (cardIndex >= 0 && cardIndex < filtered.length) {
        previewSpeak(filtered[cardIndex]);
        return true;
    }

    return false;
}

function setupWiring() {
    setBoardRefresh(renderBoard);
    setRenderBoard(renderBoard);

    registerModalCloser(editModal, closeEditModal);
    registerModalCloser(categoriesModal, closeCategoriesModalHandler);
    registerModalCloser(settingsModal, closeSettingsModalHandler);
    registerModalCloser(infoModal, closeInfoModalHandler);

    setupModalBackdrops();
    setupSwipeNavigation();

    boardWrap.addEventListener('contextmenu', e => e.preventDefault());
    boardWrap.addEventListener('selectstart', e => e.preventDefault());

    phraseDisplay.addEventListener('contextmenu', e => e.preventDefault());
    phraseDisplay.addEventListener('selectstart', e => e.preventDefault());

    speakBtn.addEventListener('click', speakPhrase);
    clearBtn.addEventListener('click', clearPhrase);
    if (undoBtn) undoBtn.addEventListener('click', undo);
    if (copyBtn) copyBtn.addEventListener('click', copyPhrase);

    editModeBtn.addEventListener('click', toggleEditMode);
    saveBtn.addEventListener('click', () => {
        saveSymbols();
        closeSettingsMenu();
    });

    // "Add Symbol" should also enter edit mode (via the central toggle),
    // so the header button stays in sync with the body class.
    addSymbolBtn.addEventListener('click', () => {
        if (!state.isEditMode) toggleEditMode();
        openEditModal(null);
    });
    closeModalBtn.addEventListener('click', closeEditModal);
    symbolForm.addEventListener('submit', saveSymbolChanges);
    deleteBtn.addEventListener('click', deleteSymbol);
    cancelEditBtn.addEventListener('click', closeEditModal);

    exportBtn.addEventListener('click', exportJSON);
    importFile.addEventListener('change', importJSONFile);

    manageCategoriesBtn.addEventListener('click', openCategoriesModal);
    closeCategoriesModal.addEventListener('click', closeCategoriesModalHandler);
    closeCategoriesBtn.addEventListener('click', closeCategoriesModalHandler);

    addCategoryBtn.addEventListener('click', () => {
        if (addCategory(newCategoryName.value)) {
            newCategoryName.value = '';
            renderCategoriesList();
        }
    });

    newCategoryName.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addCategoryBtn.click();
        }
    });

    openSettingsPanelBtn.addEventListener('click', openSettingsModal);
    closeSettingsModal.addEventListener('click', closeSettingsModalHandler);
    closeSettingsBtn.addEventListener('click', closeSettingsModalHandler);

    settingsThemeSelect.addEventListener('change', () => saveTheme(settingsThemeSelect.value));

    settingsVolumeSelect.addEventListener('change', () => {
        state.settings.volume = parseFloat(settingsVolumeSelect.value);
        saveSettings();
        showToast(`Volume set to ${Math.round(state.settings.volume * 100)}%`);
    });

    settingsGridSizeSelect.addEventListener('change', () => {
        state.settings.gridSize = settingsGridSizeSelect.value;
        saveSettings();
        applyGridSetting();
    });

    if (settingsAutoSpeakSelect) {
        settingsAutoSpeakSelect.addEventListener('change', () => {
            state.settings.autoSpeak = settingsAutoSpeakSelect.value === 'on';
            saveSettings();
            showToast(`Speak as I build ${state.settings.autoSpeak ? 'on' : 'off'}`);
        });
    }

    settingsVoiceSelect.addEventListener('change', () => {
        const selected = settingsVoiceSelect.value;
        if (selected) {
            localStorage.setItem(LS.voiceKey, selected);
            showToast(`Voice set to: ${selected}`);
        } else {
            localStorage.removeItem(LS.voiceKey);
            showToast('Using default voice');
        }
    });

    settingsToggle.addEventListener('click', e => {
        e.stopPropagation();
        toggleSettingsMenu();
    });

    document.addEventListener('click', e => {
        if (!settingsMenu || !settingsToggle) return;
        if (!settingsToggle.contains(e.target) && !settingsMenu.contains(e.target)) {
            closeSettingsMenu();
        }
    });

    infoToggle.addEventListener('click', openInfoModal);
    closeInfoModal.addEventListener('click', closeInfoModalHandler);
    closeInfoBtn.addEventListener('click', closeInfoModalHandler);

    boardPrevBtn.addEventListener('click', () => {
        if (state.categoriesOrdered.length) {
            closeCategoryDropdown();
            animateCategoryChange(
                (state.currentCategoryIndex - 1 + state.categoriesOrdered.length) % state.categoriesOrdered.length
            );
        }
    });

    boardNextBtn.addEventListener('click', () => {
        if (state.categoriesOrdered.length) {
            closeCategoryDropdown();
            animateCategoryChange((state.currentCategoryIndex + 1) % state.categoriesOrdered.length);
        }
    });

    categoryIndicator.addEventListener('click', e => {
        e.stopPropagation();
        toggleCategoryDropdown();
    });

    categoryIndicator.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleCategoryDropdown();
        }
    });

    document.addEventListener('click', e => {
        if (!categoryDropdown || categoryDropdown.style.display === 'none') return;
        if (!categoryDropdown.contains(e.target) && e.target !== categoryIndicator) {
            closeCategoryDropdown();
        }
    });

    window.addEventListener('hmo:category-change', e => {
        animateCategoryChange(e.detail);
    });

    document.addEventListener('keydown', e => {
        trapFocus(e);

        const tag = (e.target.tagName || '').toLowerCase();
        const isFormControl = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;

        if (e.key === 'Escape') {
            if (state.modalStack.length) {
                e.preventDefault();
                closeTopModal();
                return;
            }
            closeSettingsMenu();
            closeCategoryDropdown();
            return;
        }

        if (isFormControl || state.modalStack.length) return;

        // If the user is interacting with a phrase chip, let the chip
        // handle arrow / delete keys without also switching categories.
        const inPhraseItem = e.target && e.target.closest && e.target.closest('.phrase-item');
        if (inPhraseItem) return;

        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            boardPrevBtn.click();
            return;
        }

        if (e.key === 'ArrowRight') {
            e.preventDefault();
            boardNextBtn.click();
            return;
        }

        if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            undo();
            return;
        }

        if (e.key === 'e' || e.key === 'E') {
            if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                toggleEditMode();
                closeSettingsMenu();
            }
            return;
        }

        if (/^[0-9]$/.test(e.key) && !e.metaKey) {
            e.preventDefault();
            speakCardNumber(e.key, e.ctrlKey, e.altKey);
        }
    });
}

async function init() {
    loadSettings();
    applyTheme(state.settings.theme);
    await loadSymbols();

    const existingCategories = getCategories();
    const symbolCategories = [...new Set(state.symbols.map(s => s.category).filter(Boolean))];
    const mergedCategories = [...new Set([...existingCategories, ...symbolCategories])];

    if (!mergedCategories.length) {
        mergedCategories.push(...defaultCategories);
    }

    saveCategories(mergedCategories);
    refreshOrderedCategories();
    updateCategorySelects();

    const savedIdx = parseInt(localStorage.getItem(LS.categoryKey) || '0', 10);
    state.currentCategoryIndex =
        Number.isFinite(savedIdx) && savedIdx >= 0 && savedIdx < state.categoriesOrdered.length
            ? savedIdx
            : 0;

    updateCategoryIndicator();
    updateCategorySelects();
    renderBoard();
    updatePhraseDisplay();
    applyGridSetting();

    const loadVoices = () => {
        if (!('speechSynthesis' in window)) return;
        if (speechSynthesis.getVoices().length) {
            populateSettingsVoices(true);
        } else {
            setTimeout(() => {
                if (speechSynthesis.getVoices().length) populateSettingsVoices(true);
            }, 500);
        }
    };

    loadVoices();

    if ('speechSynthesis' in window && speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
    }

    setTimeout(loadVoices, 1000);
}

setupWiring();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}