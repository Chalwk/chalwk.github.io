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
    // Quick attack, exponential decay - cheap envelope for a "blip" feel.
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
}

// Named wrappers keep the game code readable instead of sprinkling freqs everywhere.
function playMoveSound() { playTone(200, 0.05, { gain: 0.05 }); }
function playBumpSound() { playTone(110, 0.1, { type: 'sawtooth', gain: 0.07 }); }
function playHitSound() { playTone(180, 0.09, { type: 'square', gain: 0.12 }); }
function playPlayerHurtSound() { playTone(140, 0.14, { type: 'sawtooth', gain: 0.14 }); }
function playKillSound() { [660, 440].forEach((f, i) => playTone(f, 0.1, { type: 'triangle', gain: 0.12, delay: i * 0.06 })); }
function playPickupSound() { playTone(760, 0.08, { type: 'triangle', gain: 0.1 }); }
function playKeySound() { [523.25, 659.25].forEach((f, i) => playTone(f, 0.14, { type: 'triangle', gain: 0.13, delay: i * 0.08 })); }
function playDoorSound() { playTone(300, 0.12, { type: 'square', gain: 0.08 }); }
function playSecretSound() { [880, 1108.7, 1318.5].forEach((f, i) => playTone(f, 0.16, { gain: 0.12, delay: i * 0.09 })); }
function playPotionSound() { playTone(500, 0.08, { gain: 0.1 }); playTone(700, 0.1, { gain: 0.09, delay: 0.06 }); }
function playFloorSound() { [392, 523.25, 659.25, 783.99].forEach((f, i) => playTone(f, 0.18, { type: 'triangle', gain: 0.14, delay: i * 0.1 })); }
function playDeathSound() { [392, 349.23, 293.66, 220].forEach((f, i) => playTone(f, 0.35, { type: 'sawtooth', gain: 0.13, delay: i * 0.18 })); }
function playVictorySound() { [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => playTone(f, 0.22, { type: 'triangle', gain: 0.15, delay: i * 0.11 })); }

function updateSoundIcon() {
    document.getElementById('sound-icon').textContent = soundMuted ? '🔇' : '🔊';
    soundToggleBtn.title = soundMuted ? 'Sound off (click to enable)' : 'Sound on (click to mute)';
}

soundToggleBtn.addEventListener('click', () => {
    soundMuted = !soundMuted;
    localStorage.setItem('dungeon-sound-muted', String(soundMuted));
    updateSoundIcon();
    if (!soundMuted) {
        // Browsers require a user gesture before audio can start.
        ensureAudioCtx();
        playTone(440, 0.08, { gain: 0.1 });
    }
});