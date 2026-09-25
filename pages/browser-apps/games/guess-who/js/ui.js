// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

let confirmOnYes = null;
let confirmOnNo = null;
let passReadyHandler = null;

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

// ---- Pass-device overlay (hot-seat) ----
function showPassOverlay(text, subtext, onReady) {
    passTextEl.textContent = text;
    passSubtextEl.textContent = subtext || '';
    passReadyHandler = onReady || null;
    passOverlay.classList.add('show');
    // Focus the button so Enter works immediately.
    requestAnimationFrame(() => passReadyBtn.focus());
}

function hidePassOverlay() {
    passOverlay.classList.remove('show');
    passReadyHandler = null;
}

passReadyBtn.addEventListener('click', () => {
    const cb = passReadyHandler;
    hidePassOverlay();
    if (cb) cb();
});

// ---- Active-player state helpers ----
function getActiveEliminated() {
    if (gameMode === 'hotseat' && currentPlayer === 2) return p2Eliminated;
    return playerEliminated;
}

function getActiveUsedQuestions() {
    if (gameMode === 'hotseat' && currentPlayer === 2) return p2UsedQuestions;
    return playerUsedQuestions;
}

function getActiveGuessed() {
    if (gameMode === 'hotseat' && currentPlayer === 2) return p2Guessed;
    return guessedIndices;
}

function getActiveSecret() {
    if (gameMode === 'hotseat' && currentPlayer === 2) return p2SecretIndex;
    return playerSecretIndex;
}

function getOpponentSecret() {
    if (gameMode === 'hotseat') {
        return currentPlayer === 1 ? p2SecretIndex : playerSecretIndex;
    }
    return aiSecretIndex;
}

function getActiveGuessesLeft() {
    return guessesLeft;
}

// ---- Card flip helpers ----
function setCardEliminated(index, eliminated) {
    const set = getActiveEliminated();
    const card = boardEl.querySelector(`[data-index="${index}"]`);
    if (eliminated) {
        if (!set.has(index)) {
            set.add(index);
            if (card) card.classList.add('eliminated');
        }
    } else {
        if (set.delete(index)) {
            if (card) card.classList.remove('eliminated');
        }
    }
}

// Re-sync DOM to whichever player's state is active.
function applyBoardStateToDom() {
    const elim = getActiveEliminated();
    const guessed = getActiveGuessed();
    boardEl.querySelectorAll('.gw-card').forEach(card => {
        const i = Number(card.dataset.index);
        card.classList.toggle('eliminated', elim.has(i));
        card.classList.toggle('guessed', guessed.has(i));
        card.classList.remove('correct', 'wrong-guess');
    });
}

// Renders the player's chosen character into the right-hand side panel.
function updatePlayerChip() {
    const idx = getActiveSecret();
    if (idx >= 0 && CHARACTERS[idx]) {
        const c = CHARACTERS[idx];
        const label = gameMode === 'hotseat' ? `P${currentPlayer}: ${c.name}` : `You: ${c.name}`;
        playerCharacterEl.textContent = label;
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
    if (gamePhase === 'setup' || gamePhase === 'setup-p2') {
        statusEl.textContent = gameMode === 'hotseat'
            ? `Player ${currentPlayer === 2 ? 2 : 1} — select your character`
            : 'Select your character to begin';
        return;
    }
    if (gamePhase === 'ai-turn') {
        statusEl.textContent = gameMode === 'hotseat' ? 'Passing...' : 'AI is thinking...';
        return;
    }

    const n = faceUpCount();
    const who = gameMode === 'hotseat' ? `P${currentPlayer} — ` : '';

    if (aiTurnQueued) {
        if (autoFlip) {
            statusEl.textContent = n <= 1
                ? who + 'Ready to hand over.'
                : who + 'Auto-flip is on. Hand over when ready.';
        } else {
            statusEl.textContent = who + 'Flip any ruled-out faces, then hand over.';
        }
        return;
    }

    if (n === 1) statusEl.textContent = who + 'One character left - make your guess!';
    else if (n === 0) statusEl.textContent = who + 'All faces flipped - ask a question or restart';
    else statusEl.textContent = who + 'Your turn - ask a question or flip faces';
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
    if (gameOver || gameMode !== 'ai') {
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