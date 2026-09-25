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

// Central phase transition - keeps the question list lock and status in sync.
function setPhase(next) {
    gamePhase = next;
    questionListEl.classList.toggle('is-locked', next !== 'player-turn');
    updateStatus();
}

// ---- Card flip helpers ----
function setCardEliminated(index, eliminated) {
    const card = boardEl.querySelector(`[data-index="${index}"]`);
    if (eliminated) {
        if (!playerEliminated.has(index)) {
            playerEliminated.add(index);
            if (card) card.classList.add('eliminated');
        }
    } else {
        if (playerEliminated.delete(index)) {
            if (card) card.classList.remove('eliminated');
        }
    }
}

// Renders the player's chosen character into the right-hand side panel.
function updatePlayerChip() {
    const idx = playerSecretIndex;
    if (idx >= 0 && CHARACTERS[idx]) {
        const c = CHARACTERS[idx];
        playerCharacterEl.textContent = `You: ${c.name}`;
        playerCharacterEl.classList.add('show');

        const col = idx % COLS;
        const row = Math.floor(idx / COLS);
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

    const row2Card = cards[COLS];
    const boardRect = boardWrap.getBoundingClientRect();
    const row2Rect = row2Card.getBoundingClientRect();

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

function updateUndoButton() {
    if (!undoBtn) return;
    const canUndo = !gameOver && gamePhase === 'player-turn' && flipHistory.length > 0 && undoCount < MAX_UNDOS;
    undoBtn.disabled = !canUndo;
    undoBtn.classList.toggle('disabled', !canUndo);
    undoBtn.title = `Undo last flip (${MAX_UNDOS - undoCount} left)`;
}

function updateDeductionPanel() {
    if (!deductionEl) return;
    if (gameOver) {
        deductionEl.textContent = '';
        deductionEl.style.display = 'none';
        return;
    }
    deductionEl.style.display = '';
    const n = aiCandidates.length;
    if (n === 0) {
        deductionEl.innerHTML = `AI is recalibrating...`;
    } else if (n === 1) {
        deductionEl.innerHTML = `AI has narrowed to <strong>1</strong> candidate`;
    } else {
        deductionEl.innerHTML = `AI has <strong>${n}</strong> candidates remaining`;
    }
}

function updateStatsDisplay() {
    if (!gameOverStatsEl) return;
    const b = stats.bestQuestionCount != null ? `${stats.bestQuestionCount} questions` : '—';
    gameOverStatsEl.innerHTML =
        `Wins <strong>${stats.wins}</strong> · Losses <strong>${stats.losses}</strong> · ` +
        `Streak <strong>${stats.streak}</strong> (best <strong>${stats.bestStreak}</strong>)<br>` +
        `Best solve: <strong>${b}</strong>`;
}

selectionOkBtn.addEventListener('click', () => {
    selectionOverlay.classList.remove('show');
});