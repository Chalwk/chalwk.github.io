// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// Question panel
function renderQuestions() {
    questionListEl.innerHTML = '';

    QUESTION_DEFS.forEach((def) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'gw-question';
        btn.dataset.q = def.id;
        btn.textContent = def.label;
        btn.addEventListener('click', () => askQuestion(def));
        questionListEl.appendChild(btn);
    });

    renderQuestionStates();
}

// Reflect the active player's used questions onto the panel.
function renderQuestionStates() {
    const used = getActiveUsedQuestions();
    questionListEl.querySelectorAll('.gw-question').forEach(btn => {
        btn.classList.toggle('used', used.has(btn.dataset.q));
    });
}

// Player Asking a Question
function askQuestion(def) {
    if (gameOver || gamePhase !== 'player-turn' || aiTurnQueued) return;

    const used = getActiveUsedQuestions();
    if (used.has(def.id)) return;

    used.add(def.id);
    questionCount++;
    questionCountEl.textContent = questionCount;
    renderQuestionStates();

    if (gameMode === 'hotseat') {
        // Opponent answers via the shared overlay.
        const answerer = currentPlayer === 1 ? 2 : 1;
        pendingHotseatQuestion = def;
        aiQuestionText.textContent = `P${answerer}: ${def.label}`;
        aiQuestionOverlay.classList.add('show');
        return;
    }

    // AI mode
    const secret = CHARACTERS[aiSecretIndex];
    const answer = def.test(secret);

    if (autoFlip) {
        CHARACTERS.forEach((c, i) => {
            if (i === playerSecretIndex) return;
            if (def.test(c) !== answer) setCardEliminated(i, true);
        });
        syncEliminatedAria();
    }

    sfx.answer(answer);
    flashStatus(answer ? 'Yes!' : 'No!', answer ? 'win-message' : 'tie-message');
    addChatMessage(`YOU: "${def.label}" — ${answer ? 'Yes' : 'No'}`, 'player');

    queueAiTurn();

    if (autoFlip) {
        setTimeout(() => { if (aiTurnQueued && !gameOver) beginAiTurn(); }, 900);
    }
}

// Hot-seat: opponent answers the asker's question.
function handleHotseatAnswer(isYes) {
    aiQuestionOverlay.classList.remove('show');
    const def = pendingHotseatQuestion;
    pendingHotseatQuestion = null;
    if (!def) return;

    const asker = currentPlayer;
    const answerer = asker === 1 ? 2 : 1;

    if (autoFlip) {
        const ownSecret = getActiveSecret();
        CHARACTERS.forEach((c, i) => {
            if (i === ownSecret) return;
            if (def.test(c) !== isYes) setCardEliminated(i, true);
        });
        syncEliminatedAria();
    }

    sfx.answer(isYes);
    addChatMessage(`P${asker}: "${def.label}" — P${answerer} answered ${isYes ? 'Yes' : 'No'}`, 'system');
    flashStatus(isYes ? 'Yes!' : 'No!', isYes ? 'win-message' : 'tie-message');

    queueAiTurn();
    if (autoFlip) {
        setTimeout(() => { if (aiTurnQueued && !gameOver) endHotseatTurn(); }, 900);
    }
}

// Refresh ARIA labels after a bulk flip.
function syncEliminatedAria() {
    boardEl.querySelectorAll('.gw-card').forEach(card => {
        updateCardAria(card, card.classList.contains('eliminated'));
    });
}