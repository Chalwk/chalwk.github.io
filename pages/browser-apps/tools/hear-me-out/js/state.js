// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

export const state = {
    symbols: [],
    currentPhrase: [],
    phraseHistory: [],
    isEditMode: false,
    currentEditingSymbol: null,
    settings: {
        gridSize: 'auto',
        theme: 'auto',
        volume: 0.6,
        autoSpeak: false
    },
    categoriesOrdered: [],
    currentCategoryIndex: 0,
    isAnimating: false,

    swipeActivePointerId: null,
    swipeStartX: 0,
    swipeStartY: 0,
    swipeStartTime: 0,

    phraseDrag: null,

    toastVisibleTimer: null,
    toastHideTimer: null,

    modalStack: []
};