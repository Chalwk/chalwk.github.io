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

// Reflect the used questions onto the panel.
function renderQuestionStates() {
    questionListEl.querySelectorAll('.gw-question').forEach(btn => {
        btn.classList.toggle('used', playerUsedQuestions.has(btn.dataset.q));
    });
}

// Player Asking a Question
function askQuestion(def) {
    if (gameOver || gamePhase !== 'player-turn' || aiTurnQueued) return;
    if (playerUsedQuestions.has(def.id)) return;

    playerUsedQuestions.add(def.id);
    questionCount++;
    questionCountEl.textContent = questionCount;
    renderQuestionStates();

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

// Refresh ARIA labels after a bulk flip.
function syncEliminatedAria() {
    boardEl.querySelectorAll('.gw-card').forEach(card => {
        updateCardAria(card, card.classList.contains('eliminated'));
    });
}