// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

import { state } from './state.js';
import { editModal, categoriesModal, settingsModal, infoModal } from './dom.js';

const modalClosers = new Map();

export function registerModalCloser(modal, closer) {
    modalClosers.set(modal, closer);
}

export function openModal(modal, focusSelector) {
    if (!modal) return;
    const prevFocus = document.activeElement;
    state.modalStack.push({ modal, prevFocus });
    modal.setAttribute('aria-hidden', 'false');

    setTimeout(() => {
        const target = (focusSelector && modal.querySelector(focusSelector))
            || modal.querySelector('input:not([type="hidden"]), select, textarea, button');
        if (target && typeof target.focus === 'function') target.focus();
    }, 40);
}

export function closeModal(modal) {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');

    const idx = state.modalStack.findIndex(m => m.modal === modal);
    if (idx !== -1) {
        const { prevFocus } = state.modalStack.splice(idx, 1)[0];
        if (prevFocus && typeof prevFocus.focus === 'function') {
            try { prevFocus.focus(); } catch { /* noop */ }
        }
    }
}

export function closeTopModal() {
    if (!state.modalStack.length) return false;
    const top = state.modalStack[state.modalStack.length - 1].modal;
    const closer = modalClosers.get(top);
    if (closer) {
        closer();
        return true;
    }
    return false;
}

export function trapFocus(e) {
    if (e.key !== 'Tab' || !state.modalStack.length) return;

    const modal = state.modalStack[state.modalStack.length - 1].modal;
    const focusables = [...modal.querySelectorAll(
        'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'
    )].filter(el => el.offsetParent !== null && !el.disabled);

    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
    }
}

export function setupModalBackdrops() {
    [editModal, categoriesModal, settingsModal, infoModal].forEach(modal => {
        let downOnBackdrop = false;

        modal.addEventListener('pointerdown', e => {
            downOnBackdrop = (e.target === modal);
        });

        modal.addEventListener('click', e => {
            if (e.target === modal && downOnBackdrop) closeTopModal();
            downOnBackdrop = false;
        });
    });
}