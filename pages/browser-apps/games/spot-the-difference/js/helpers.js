// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// --- Helpers -----------------------------------------------------------------
// Log keeps the last 50 entries. Only auto-scroll if the user is already
// at the bottom, so reading mid-round is not interrupted.
function log(msg, cls) {
    const atBottom = logEl.scrollTop + logEl.clientHeight >= logEl.scrollHeight - 4;
    const div = document.createElement('div');
    if (cls) div.className = cls;
    div.textContent = msg;
    logEl.appendChild(div);
    while (logEl.children.length > 50) logEl.removeChild(logEl.firstChild);
    if (atBottom) logEl.scrollTop = logEl.scrollHeight;
}
function clearLog() { logEl.innerHTML = ''; }
function setStatus(text) { statusEl.textContent = text; }

function getObjectType(id) { return OBJECT_TYPES.find(t => t.id === id); }
function getObjectRadius(id) { const t = getObjectType(id); return t ? t.radius : 14; }

// Keeps freshly placed differences from crowding each other so clicks
// stay unambiguous.
function farEnough(list, point, minDist) {
    return list.every(p => distancePt(p, point) >= minDist);
}