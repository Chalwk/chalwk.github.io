// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

function charName(index) {
    const c = CHARACTERS[index];
    return c && c.name ? c.name : `#${index + 1}`;
}

function addChatMessage(text, sender) {
    const msg = document.createElement('div');
    msg.className = `chat-message ${sender}`;
    msg.textContent = text;
    chatLogEl.appendChild(msg);
    chatLogEl.scrollTop = chatLogEl.scrollHeight;
}

// Shannon entropy of a yes/no split.
function entropyScore(yes, no) {
    const total = yes + no;
    if (total === 0 || yes === 0 || no === 0) return 0;
    const p = yes / total;
    const q = no / total;
    return -(p * Math.log2(p) + q * Math.log2(q));
}

// Removes questions whose yes/no pattern across `candidates` is identical
// (or the exact complement) to one already in the pool.
function pruneRedundantQuestions(questions, candidates) {
    const seen = new Set();
    const out = [];
    for (const q of questions) {
        let bits = '';
        for (const idx of candidates) bits += q.test(CHARACTERS[idx]) ? '1' : '0';
        const comp = bits.replace(/[01]/g, b => (b === '1' ? '0' : '1'));
        const key = bits < comp ? bits + '|' + comp : comp + '|' + bits;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(q);
    }
    return out;
}

// Storage helpers
function loadStats() {
    try {
        const raw = localStorage.getItem(STATS_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
                stats = Object.assign(stats, parsed);
            }
        }
    } catch (e) { /* ignore */ }
}

function saveStats() {
    try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch (e) { /* ignore */ }
}