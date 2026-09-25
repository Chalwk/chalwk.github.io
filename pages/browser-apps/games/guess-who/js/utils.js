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