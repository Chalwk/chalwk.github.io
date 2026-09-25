// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

let confirmOnYes = null;
let confirmOnNo = null;

function showConfirm(message, onYes, onNo) {
    confirmMessageEl.textContent = message;
    confirmOnYes = onYes || null;
    confirmOnNo = onNo || null;
    confirmOverlay.classList.add('show');
}

function hideConfirm() {
    confirmOverlay.classList.remove('show');
    confirmOnYes = null;
    confirmOnNo = null;
}

confirmYesBtn.addEventListener('click', () => {
    const cb = confirmOnYes;
    hideConfirm();
    if (cb) cb();
});

confirmNoBtn.addEventListener('click', () => {
    const cb = confirmOnNo;
    hideConfirm();
    if (cb) cb();
});

// Renders the player's chosen character into the right-hand side panel.
function updatePlayerChip() {
    if (playerSecretIndex >= 0 && CHARACTERS[playerSecretIndex]) {
        const c = CHARACTERS[playerSecretIndex];
        playerCharacterEl.textContent = `You: ${c.name}`;
        playerCharacterEl.classList.add('show');

        const col = playerSecretIndex % COLS;
        const row = Math.floor(playerSecretIndex / COLS);
        const posX = (col * 100) / (COLS - 1);
        const posY = (row * 100) / (ROWS - 1);

        playerCharacterFaceEl.style.backgroundImage = `url('${currentSheet}')`;
        playerCharacterFaceEl.style.backgroundPosition = `${posX}% ${posY}%`;
        playerCharacterFaceEl.classList.remove('empty');
        playerCharacterFaceEl.textContent = '';
    } else {
        playerCharacterEl.textContent = '';
        playerCharacterEl.classList.remove('show');
        playerCharacterFaceEl.style.backgroundImage = '';
        playerCharacterFaceEl.classList.add('empty');
        playerCharacterFaceEl.textContent = '?';
    }
    requestAnimationFrame(alignPlayerCard);
}

// Aligns the right-panel player card with row 2 of the character grid.
function alignPlayerCard() {
    const panel = document.querySelector('.player-card-panel');
    const faceWrap = document.querySelector('.player-card-face-wrap');
    const nameEl = playerCharacterEl;
    if (!panel || !faceWrap || !nameEl) return;

    // Only align in the three-column desktop layout.
    if (window.innerWidth <= 900) {
        panel.style.paddingTop = '';
        faceWrap.style.width = '';
        faceWrap.style.maxWidth = '';
        return;
    }

    const boardWrap = document.getElementById('board-wrap');
    const cards = boardEl.querySelectorAll('.gw-card');
    if (!boardWrap || cards.length <= COLS) {
        panel.style.paddingTop = '';
        return;
    }

    const row2Card = cards[COLS]; // first card of row 2
    const boardRect = boardWrap.getBoundingClientRect();
    const row2Rect = row2Card.getBoundingClientRect();

    // Match the preview face size to an actual board card.
    faceWrap.style.maxWidth = 'none';
    faceWrap.style.width = Math.round(row2Rect.width) + 'px';

    const cs = getComputedStyle(panel);
    const gap = parseFloat(cs.rowGap) || parseFloat(cs.gap) || 6;

    const offset = row2Rect.top - boardRect.top;
    const nameVisible = nameEl.classList.contains('show');
    const nameH = nameVisible ? nameEl.offsetHeight : 0;
    const pad = Math.max(0, offset - nameH - gap);
    panel.style.paddingTop = Math.round(pad) + 'px';
}

function updateStatus() {
    if (gameOver) return;
    if (gamePhase === 'setup') {
        statusEl.textContent = 'Select your character to begin';
        return;
    }
    if (gamePhase === 'ai-turn') {
        statusEl.textContent = 'AI is thinking...';
        return;
    }

    const n = faceUpCount();

    if (aiTurnQueued) {
        if (autoFlip) {
            statusEl.textContent = n <= 1
                ? 'Ready to hand over.'
                : 'Auto-flip is on. Hand over when ready.';
        } else {
            statusEl.textContent = 'Flip any ruled-out faces, then hand over.';
        }
        return;
    }

    if (n === 1) statusEl.textContent = 'One character left - make your guess!';
    else if (n === 0) statusEl.textContent = 'All faces flipped - ask a question or restart';
    else statusEl.textContent = 'Your turn - ask a question or flip faces';
}

function flashStatus(text, cls, ms = 1300) {
    statusEl.textContent = text;
    statusEl.className = cls;
    setTimeout(() => {
        if (!gameOver) {
            statusEl.className = '';
            updateStatus();
        }
    }, ms);
}

selectionOkBtn.addEventListener('click', () => {
    selectionOverlay.classList.remove('show');
});