// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

let confettiParticles = [];
let confettiRaf = null;
let confettiW = 0;
let confettiH = 0;

function resizeConfettiCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    confettiW = window.innerWidth;
    confettiH = window.innerHeight;
    confettiCanvas.width = Math.floor(confettiW * dpr);
    confettiCanvas.height = Math.floor(confettiH * dpr);
    confettiCanvas.style.width = confettiW + 'px';
    confettiCanvas.style.height = confettiH + 'px';
    const ctx = confettiCanvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function launchConfetti(player) {
    const ctx = confettiCanvas.getContext('2d');
    if (!ctx) return;
    resizeConfettiCanvas();

    const palettes = {
        1: ['#60a5fa', '#93c5fd', '#dbeafe', '#ffffff', '#fbbf24'],
        2: ['#ef4444', '#f87171', '#fecaca', '#ffffff', '#fbbf24'],
    };
    const colors = palettes[player] || palettes[1];

    for (let i = 0; i < 150; i++) {
        confettiParticles.push({
            x: Math.random() * confettiW,
            y: -20 - Math.random() * confettiH * 0.5,
            vx: (Math.random() - 0.5) * 3.2,
            vy: 2 + Math.random() * 4.5,
            size: 5 + Math.random() * 7,
            rot: Math.random() * Math.PI * 2,
            vr: (Math.random() - 0.5) * 0.32,
            color: colors[Math.floor(Math.random() * colors.length)],
        });
    }
    if (!confettiRaf) confettiRaf = requestAnimationFrame(stepConfetti);
}

function stepConfetti() {
    const ctx = confettiCanvas.getContext('2d');
    if (!ctx) { confettiRaf = null; return; }
    ctx.clearRect(0, 0, confettiW, confettiH);

    for (let i = confettiParticles.length - 1; i >= 0; i--) {
        const p = confettiParticles[i];
        p.vy += 0.06;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;

        if (p.y > confettiH + 40) {
            confettiParticles.splice(i, 1);
            continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
    }

    if (confettiParticles.length) {
        confettiRaf = requestAnimationFrame(stepConfetti);
    } else {
        ctx.clearRect(0, 0, confettiW, confettiH);
        confettiRaf = null;
    }
}

function clearConfetti() {
    confettiParticles = [];
    if (!confettiW || !confettiH) return;
    const ctx = confettiCanvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, confettiW, confettiH);
}