// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// Sound engine
let audioCtx = null;

function getAudioCtx() {
    if (!audioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        try { audioCtx = new AC(); } catch (e) { return null; }
    }
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => { });
    return audioCtx;
}

function tone({ freq = 440, type = 'sine', duration = 0.15, gain = 0.15, delay = 0, sweepTo = null }) {
    if (!soundOn) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (sweepTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), t0 + duration);
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(amp).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.03);
}

const sfx = {
    flip() { tone({ freq: 420, type: 'triangle', duration: 0.08, gain: 0.10, sweepTo: 260 }); },
    answer(yes) { tone({ freq: yes ? 660 : 330, type: 'sine', duration: 0.22, gain: 0.14, sweepTo: yes ? 880 : 220 }); },
    wrong() { tone({ freq: 180, type: 'sawtooth', duration: 0.28, gain: 0.10 }); },
    win() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone({ freq: f, type: 'triangle', duration: 0.24, gain: 0.16, delay: i * 0.10 })); },
    lose() { [392, 329.63, 261.63].forEach((f, i) => tone({ freq: f, type: 'sawtooth', duration: 0.30, gain: 0.10, delay: i * 0.14 })); },
    toggle() { tone({ freq: 660, type: 'sine', duration: 0.08, gain: 0.10, sweepTo: 880 }); },
};

function loadSoundPref() {
    try { if (localStorage.getItem(SOUND_KEY) === '0') soundOn = false; } catch (e) { /* ignore */ }
    updateSoundIcon();
}

function updateSoundIcon() {
    soundIcon.textContent = soundOn ? '🔊' : '🔇';
    soundToggleBtn.classList.toggle('muted', !soundOn);
}

function toggleSound() {
    soundOn = !soundOn;
    try { localStorage.setItem(SOUND_KEY, soundOn ? '1' : '0'); } catch (e) { /* ignore */ }
    updateSoundIcon();
    if (soundOn) sfx.toggle();
}