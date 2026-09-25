// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

import { state } from './state.js';
import { toast } from './dom.js';

export function showToast(msg, timeout = 2200) {
    if (!toast || !msg) return;

    if (state.toastVisibleTimer) clearTimeout(state.toastVisibleTimer);
    if (state.toastHideTimer) clearTimeout(state.toastHideTimer);

    toast.textContent = msg;
    toast.style.opacity = '1';
    toast.style.visibility = 'visible';

    state.toastVisibleTimer = setTimeout(() => {
        toast.style.opacity = '0';
        state.toastHideTimer = setTimeout(() => {
            toast.style.visibility = 'hidden';
            state.toastVisibleTimer = state.toastHideTimer = null;
        }, 300);
    }, timeout);
}