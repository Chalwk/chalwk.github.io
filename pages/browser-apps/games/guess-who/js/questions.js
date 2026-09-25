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
}

// Player Asking a Question
function askQuestion(def) {
    if (gameOver || gamePhase !== 'player-turn' || aiTurnQueued) return;

    const secret = CHARACTERS[aiSecretIndex];
    const answer = def.test(secret);

    questionCount++;
    questionCountEl.textContent = questionCount;

    const chip = questionListEl.querySelector(`[data-q="${def.id}"]`);
    if (chip) chip.classList.add('used');

    if (autoFlip) {
        CHARACTERS.forEach((c, i) => {
            // Never auto-flip the player's own face - they know who they are.
            if (i === playerSecretIndex) return;
            if (def.test(c) !== answer) {
                const card = boardEl.querySelector(`[data-index="${i}"]`);
                if (card && !card.classList.contains('eliminated')) {
                    card.classList.add('eliminated');
                }
            }
        });
    }

    sfx.answer(answer);
    flashStatus(answer ? 'Yes!' : 'No!', answer ? 'win-message' : 'tie-message');
    addChatMessage(`YOU: "${def.label}" — ${answer ? 'Yes' : 'No'}`, 'player');

    queueAiTurn();

    if (autoFlip) {
        setTimeout(() => { if (aiTurnQueued && !gameOver) beginAiTurn(); }, 900);
    }
}