// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// AI Logic
function getBestQuestion(candidates, usedQs) {
    const available = pruneRedundantQuestions(
        QUESTION_DEFS.filter(q => !usedQs.has(q.id)),
        candidates
    );
    if (available.length === 0) return null;

    // Difficulty: easy/medium pick a random question some of the time.
    if (aiProfile.randomChance > 0 && Math.random() < aiProfile.randomChance) {
        return available[Math.floor(Math.random() * available.length)];
    }

    let best = -1;
    let ties = [];
    for (const q of available) {
        let yes = 0;
        for (const idx of candidates) if (q.test(CHARACTERS[idx])) yes++;
        const h = entropyScore(yes, candidates.length - yes);
        if (h > best + 1e-9) {
            best = h;
            ties = [q];
        } else if (h >= best - 1e-9) {
            ties.push(q);
        }
    }
    // Random tie-break so openings vary.
    return ties[Math.floor(Math.random() * ties.length)] || null;
}

function aiTurn() {
    if (gameOver || gamePhase !== 'ai-turn') return;

    addChatMessage('AI is thinking…', 'ai');

    setTimeout(() => {
        if (gameOver || gamePhase !== 'ai-turn') return;

        // Safety fallback if somehow empty.
        if (aiCandidates.length === 0) {
            aiCandidates = Array.from({ length: TOTAL }, (_, i) => i)
                .filter(i => i !== aiSecretIndex);
        }

        const confident = aiCandidates.length === 1;
        const earlyGuess = aiProfile.earlyGuessThreshold > 0
            && aiCandidates.length > 1
            && (1 / aiCandidates.length) >= aiProfile.earlyGuessThreshold;

        if (confident || earlyGuess) {
            aiGuess(aiCandidates[0]);
            return;
        }

        if (aiUsedQuestions.size >= aiProfile.maxQuestions) {
            const idx = aiCandidates[Math.floor(Math.random() * aiCandidates.length)];
            aiGuess(idx);
            return;
        }

        const q = getBestQuestion(aiCandidates, aiUsedQuestions);
        if (!q) {
            const idx = aiCandidates[Math.floor(Math.random() * aiCandidates.length)];
            aiGuess(idx);
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
        endGame('ai-guessed-correct');
    } else {
        endGame('ai-guessed-wrong');
    }
}

// Player answers the AI's question.
function handleAiAnswer(isYes) {
    aiQuestionOverlay.classList.remove('show');
    const q = QUESTION_DEFS.find(def => def.id === currentAiQuestionId);
    currentAiQuestionId = null;

    if (!q) {
        setPhase('player-turn');
        return;
    }

    const truthful = q.test(CHARACTERS[playerSecretIndex]);
    const lying = bluffAllowed && isYes !== truthful;

    addChatMessage(`You answered: ${isYes ? 'Yes' : 'No'}${lying ? ' (bluffing)' : ''}`, 'player');

    const before = aiCandidates.slice();
    aiCandidates = aiCandidates.filter(idx => q.test(CHARACTERS[idx]) === isYes);

    if (aiCandidates.length === 0) {
        // The AI catches the inconsistency.
        aiCandidates = before;
        aiLieDetected = true;
        addChatMessage('AI: "That doesn\'t add up. I think you may be bluffing."', 'ai');
    } else {
        aiLieDetected = false;
    }

    updateDeductionPanel();
    setPhase('player-turn');
}

// Central answer handler used by the shared overlay.
function handleAnswerClick(isYes) {
    if (gameOver) return;
    if (gameMode === 'hotseat') {
        handleHotseatAnswer(isYes);
    } else {
        handleAiAnswer(isYes);
    }
}

aiAnswerYes.addEventListener('click', () => handleAnswerClick(true));
aiAnswerNo.addEventListener('click', () => handleAnswerClick(false));