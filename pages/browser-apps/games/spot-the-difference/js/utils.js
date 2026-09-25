// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// --- Utils -----------------------------------------------------------------
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function distancePt(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

// Maps a raw client click into the SVG's own viewBox coordinate space,
// so hit detection stays correct at any rendered size.
function svgPointFromEvent(svgEl, evt) {
    const ctm = svgEl.getScreenCTM();
    if (!ctm) return null;
    const pt = new DOMPoint(evt.clientX, evt.clientY).matrixTransform(ctm.inverse());
    return { x: pt.x, y: pt.y };
}