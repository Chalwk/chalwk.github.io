// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// --- Helpers -----------------------------------------------------------------
// Log keeps the last ~50 entries so the DOM doesn't grow forever.
function log(msg, cls) {
    const div = document.createElement('div');
    if (cls) div.className = cls;
    div.textContent = msg;
    logEl.appendChild(div);
    while (logEl.children.length > 50) logEl.removeChild(logEl.firstChild);
    logEl.scrollTop = logEl.scrollHeight;
}
function clearLog() { logEl.innerHTML = ''; }
function setStatus(text) { statusEl.textContent = text; }

function getObjectType(id) { return OBJECT_TYPES.find(t => t.id === id); }
function getObjectRadius(id) { const t = getObjectType(id); return t ? t.radius : 14; }

// Keeps freshly placed objects/differences from crowding each other so
// clicks stay unambiguous.
function farEnough(list, point, minDist) {
    return list.every(p => distancePt(p, point) >= minDist);
}

function findFreeSpot(existingObjects, viewW, viewH, radius) {
    const pad = 24;
    for (let i = 0; i < 60; i++) {
        const x = randInt(pad, viewW - pad);
        const y = randInt(pad + 20, viewH - pad);
        const clash = existingObjects.some(o => distancePt(o, { x, y }) < (o.radius + radius + 14));
        if (!clash) return { x, y };
    }
    return null;
}
