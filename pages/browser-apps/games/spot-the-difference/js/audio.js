// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// --- Audio -------------------------------------------------------------------
// Everything is generated via oscillators, so there are no asset files to load.
function ensureAudioCtx() {
    if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        audioCtx = new Ctx();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

// Fire a short tone. `delay` lets callers sequence arpeggios.
function playTone(freq, duration, { type = 'sine', gain = 0.15, delay = 0 } = {}) {
    if (soundMuted) return;
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    const startTime = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
}

// Named wrappers keep the game code readable instead of sprinkling freqs everywhere.
function playFoundSound() { [880, 1318.5].forEach((f, i) => playTone(f, 0.12, { type: 'triangle', gain: 0.13, delay: i * 0.05 })); }
function playMissSound() { playTone(140, 0.16, { type: 'sawtooth', gain: 0.1 }); }
function playHintSound() { [523.25, 392].forEach((f, i) => playTone(f, 0.12, { type: 'sine', gain: 0.09, delay: i * 0.07 })); }
function playRoundCompleteSound() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => playTone(f, 0.16, { type: 'triangle', gain: 0.13, delay: i * 0.09 })); }
function playVictorySound() { [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => playTone(f, 0.22, { type: 'triangle', gain: 0.15, delay: i * 0.11 })); }
function playDeathSound() { [392, 349.23, 293.66, 220].forEach((f, i) => playTone(f, 0.32, { type: 'sawtooth', gain: 0.13, delay: i * 0.18 })); }

function updateSoundIcon() {
    document.getElementById('sound-icon').textContent = soundMuted ? '🔇' : '🔊';
    soundToggleBtn.title = soundMuted ? 'Sound off (click to enable)' : 'Sound on (click to mute)';
}

soundToggleBtn.addEventListener('click', () => {
    soundMuted = !soundMuted;
    try {
        localStorage.setItem('spotdiff-sound-muted', String(soundMuted));
    } catch (e) { /* storage unavailable */ }
    updateSoundIcon();
    if (!soundMuted) {
        ensureAudioCtx();
        playTone(440, 0.08, { gain: 0.1 });
    }
});
