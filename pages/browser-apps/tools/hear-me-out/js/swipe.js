// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

import { state } from './state.js';
import { boardWrap } from './dom.js';
import { animateCategoryChange } from './board.js';
import { closeCategoryDropdown } from './categories.js';

export function setupSwipeNavigation() {
    function handleSwipePointerDown(e) {
        if (e.pointerType !== 'touch') return;
        if (state.swipeActivePointerId !== null) return;

        state.swipeActivePointerId = e.pointerId;
        state.swipeStartX = e.clientX;
        state.swipeStartY = e.clientY;
        state.swipeStartTime = Date.now();
    }

    function handleSwipePointerMove(e) {
        if (e.pointerType !== 'touch' || e.pointerId !== state.swipeActivePointerId) return;

        const dx = e.clientX - state.swipeStartX;
        const dy = e.clientY - state.swipeStartY;

        if (Math.abs(dx) > 25 && Math.abs(dx) > Math.abs(dy)) e.preventDefault();
    }

    function handleSwipePointerUp(e) {
        if (e.pointerType !== 'touch' || e.pointerId !== state.swipeActivePointerId) return;

        const dx = e.clientX - state.swipeStartX;
        const dy = e.clientY - state.swipeStartY;
        const dt = Date.now() - state.swipeStartTime;

        if (dt < 300 && Math.abs(dx) > 25 && Math.abs(dy) < 50 && state.categoriesOrdered.length) {
            closeCategoryDropdown();

            if (dx > 0) {
                animateCategoryChange(
                    (state.currentCategoryIndex - 1 + state.categoriesOrdered.length) % state.categoriesOrdered.length
                );
            } else {
                animateCategoryChange((state.currentCategoryIndex + 1) % state.categoriesOrdered.length);
            }
        }

        resetSwipe();
    }

    function handleSwipePointerCancel(e) {
        if (e.pointerId === state.swipeActivePointerId) resetSwipe();
    }

    function resetSwipe() {
        state.swipeActivePointerId = null;
        state.swipeStartX = 0;
        state.swipeStartY = 0;
        state.swipeStartTime = 0;
    }

    boardWrap.addEventListener('pointerdown', handleSwipePointerDown);
    boardWrap.addEventListener('pointermove', handleSwipePointerMove, { passive: false });
    boardWrap.addEventListener('pointerup', handleSwipePointerUp);
    boardWrap.addEventListener('pointercancel', handleSwipePointerCancel);
}