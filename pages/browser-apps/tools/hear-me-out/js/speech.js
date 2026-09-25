// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

import { LS } from './config.js';
import { state } from './state.js';
import { showToast } from './toast.js';

export function speakPhrase() {
    if (!state.currentPhrase.length) return;

    const phraseText = state.currentPhrase.map(s => s.text).join(' ');

    if (!('speechSynthesis' in window)) {
        alert(phraseText);
        return;
    }

    speechSynthesis.cancel();

    const ut = new SpeechSynthesisUtterance(phraseText);
    ut.rate = 0.95;
    ut.pitch = 1;
    ut.volume = state.settings.volume;

    const chosen = localStorage.getItem(LS.voiceKey);
    if (chosen) {
        const voice = speechSynthesis.getVoices().find(v => v.name === chosen);
        if (voice) ut.voice = voice;
    }

    ut.onerror = event => {
        if (event.error === 'interrupted') return;
        console.error('Speech synthesis error:', event);
        showToast('Speech error - trying default voice');

        if (chosen) {
            localStorage.removeItem(LS.voiceKey);
            const fallback = new SpeechSynthesisUtterance(phraseText);
            fallback.rate = 0.95;
            fallback.volume = state.settings.volume;
            speechSynthesis.speak(fallback);
        }
    };

    speechSynthesis.speak(ut);
}

export function previewSpeak(symbol) {
    if (!symbol || !symbol.text || !('speechSynthesis' in window)) return;

    speechSynthesis.cancel();

    const ut = new SpeechSynthesisUtterance(symbol.text);
    ut.volume = state.settings.volume;

    const chosen = localStorage.getItem(LS.voiceKey);
    if (chosen) {
        const voice = speechSynthesis.getVoices().find(v => v.name === chosen);
        if (voice) ut.voice = voice;
    }

    speechSynthesis.speak(ut);
}