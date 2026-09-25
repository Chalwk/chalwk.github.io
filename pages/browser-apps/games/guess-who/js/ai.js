// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// AI Logic
function getBestQuestion(candidates, usedQs) {
    let bestQ = null;
    let minDiff = Infinity;
    const availableQs = QUESTION_DEFS.filter(q => !usedQs.has(q.id));
    if (availableQs.length === 0) return null;

    for (const q of availableQs) {
        let yes = 0;
        let no = 0;
        for (const idx of candidates) {
            if (q.test(CHARACTERS[idx])) yes++;
            else no++;
        }
        const diff = Math.abs(yes - no);
        if (diff < minDiff) {
            minDiff = diff;
            bestQ = q;
        }
    }
    return bestQ;
}

function aiTurn() {
    if (gameOver || gamePhase !== 'ai-turn') return;

    setTimeout(() => {
        // Re-check after the delay: the player may have given up or won.
        if (gameOver || gamePhase !== 'ai-turn') return;

        // Safety fallback: if candidates drop to 0, reset to all (excluding the AI's own secret)
        if (aiCandidates.length === 0) {
            aiCandidates = Array.from({ length: TOTAL }, (_, i) => i).filter(i => i !== aiSecretIndex);
        }

        if (aiCandidates.length === 1) {
            // AI is confident, make a guess
            const guessIdx = aiCandidates[0];
            aiGuess(guessIdx);
            return;
        }

        const q = getBestQuestion(aiCandidates, aiUsedQuestions);
        if (!q) {
            // No questions left, guess randomly from remaining candidates
            const guessIdx = aiCandidates[Math.floor(Math.random() * aiCandidates.length)];
            aiGuess(guessIdx);
            return;
        }

        aiUsedQuestions.add(q.id);
        currentAiQuestionId = q.id;
        aiQuestionText.textContent = q.label;
        aiQuestionOverlay.classList.add('show');
        addChatMessage(`AI asks: "${q.label}"`, 'ai');
    }, 1200);
}

function aiGuess(idx) {
    addChatMessage(`AI guesses: ${charName(idx)}`, 'ai');
    const card = boardEl.querySelector(`[data-index="${idx}"]`);
    if (card) card.classList.add('correct');

    if (idx === playerSecretIndex) {
        endGame('ai-guessed-correct'); // AI wins
    } else {
        endGame('ai-guessed-wrong');   // AI blundered - player wins
    }
}

// Handle Player answering AI's question
// The AI always narrows its own candidates automatically (auto-flip is always on for the AI).
aiAnswerYes.addEventListener('click', () => {
    if (gameOver) return;
    aiQuestionOverlay.classList.remove('show');
    const q = QUESTION_DEFS.find(def => def.id === currentAiQuestionId);
    if (q) {
        aiCandidates = aiCandidates.filter(idx => q.test(CHARACTERS[idx]));
        addChatMessage(`You answered: Yes`, 'player');
    }
    gamePhase = 'player-turn';
    updateStatus();
});

aiAnswerNo.addEventListener('click', () => {
    if (gameOver) return;
    aiQuestionOverlay.classList.remove('show');
    const q = QUESTION_DEFS.find(def => def.id === currentAiQuestionId);
    if (q) {
        aiCandidates = aiCandidates.filter(idx => !q.test(CHARACTERS[idx]));
        addChatMessage(`You answered: No`, 'player');
    }
    gamePhase = 'player-turn';
    updateStatus();
});