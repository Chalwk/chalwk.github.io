// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// Guessing
function requestGuess(index) {
    if (gameOver || gamePhase !== 'player-turn' || aiTurnQueued) return;
    if (guessesLeft <= 0) return;

    if (guessedIndices.has(index)) {
        flashStatus('Already guessed that one.', 'tie-message', 1000);
        return;
    }

    const card = boardEl.querySelector(`[data-index="${index}"]`);
    if (card && card.classList.contains('eliminated')) {
        flashStatus('That face is flipped.', 'tie-message', 1000);
        return;
    }

    pendingGuessIdx = index;
    showConfirm(`Guess ${charName(index)}?`, commitGuess, cancelGuess);
}

function cancelGuess() {
    pendingGuessIdx = -1;
    hideConfirm();
}

function commitGuess() {
    hideConfirm();
    if (pendingGuessIdx === -1 || gameOver) return;

    const idx = pendingGuessIdx;
    pendingGuessIdx = -1;

    guessedIndices.add(idx);

    const card = boardEl.querySelector(`[data-index="${idx}"]`);
    if (card) card.classList.add('guessed');

    if (idx === aiSecretIndex) {
        if (card) card.classList.add('correct');
        endGame('player-guessed-correct');
        return;
    }

    guessesLeft--;
    guessesLeftEl.textContent = guessesLeft;
    sfx.wrong();

    if (card) {
        card.classList.add('wrong-guess');
        setTimeout(() => card.classList.remove('wrong-guess'), 900);
    }

    if (guessesLeft <= 0) {
        endGame('player-out-of-guesses');
    } else {
        flashStatus('Wrong! Try again.', 'tie-message', 1500);
        addChatMessage(`You guessed ${charName(idx)}. Wrong!`, 'player');
    }
}

// Queue / begin the AI turn on the player's signal
function queueAiTurn() {
    aiTurnQueued = true;
    turnBarEl.hidden = false;
    questionListEl.classList.add('is-locked');

    if (turnBarTextEl) {
        turnBarTextEl.textContent = autoFlip
            ? 'Auto-flip is on. Hand over when ready.'
            : 'Flip any ruled-out faces, then hand over.';
    }

    continueBtn.classList.remove('pulse');
    void continueBtn.offsetWidth;
    continueBtn.classList.add('pulse');

    updateStatus();
    updateUndoButton();
}

function beginAiTurn() {
    if (!aiTurnQueued || gameOver) return;
    aiTurnQueued = false;
    turnBarEl.hidden = true;
    questionListEl.classList.remove('is-locked');
    setPhase('ai-turn');
    updateUndoButton();
    aiTurn();
}

// End of game
// reason: 'player-guessed-correct' | 'ai-guessed-wrong'
//       | 'ai-guessed-correct'   | 'player-out-of-guesses' | 'player-gave-up'
function endGame(reason) {
    gameOver = true;
    gamePhase = 'game-over';

    aiTurnQueued = false;
    turnBarEl.hidden = true;
    questionListEl.classList.remove('is-locked');

    // Always clear overlays so the game-over card is visible.
    aiQuestionOverlay.classList.remove('show');
    confirmOverlay.classList.remove('show');
    selectionOverlay.classList.remove('show');

    let message = '';
    let score = '';
    let palette = 2;
    let won = false;

    const p1Name = charName(playerSecretIndex);
    const aiName = charName(aiSecretIndex);

    switch (reason) {
        case 'player-guessed-correct':
            won = true;
            message = 'You win!';
            score = `Solved in ${questionCount} question${questionCount === 1 ? '' : 's'}`;
            statusEl.className = 'win-message';
            sfx.win();
            palette = 1;
            break;

        case 'ai-guessed-wrong':
            won = true;
            message = 'You win!';
            score = `The AI guessed wrong. Its character was ${aiName}.`;
            statusEl.className = 'win-message';
            sfx.win();
            palette = 1;
            break;

        case 'ai-guessed-correct':
            message = 'AI wins!';
            score = `Your character was ${p1Name}. AI's was ${aiName}.`;
            statusEl.className = 'tie-message';
            sfx.lose();
            palette = 2;
            break;

        case 'player-out-of-guesses':
            message = 'Out of guesses';
            score = `Your character was ${p1Name}. AI's was ${aiName}.`;
            statusEl.className = 'tie-message';
            sfx.lose();
            palette = 2;
            break;

        case 'player-gave-up':
            message = 'You gave up';
            score = `AI's character was ${aiName}.`;
            statusEl.className = 'tie-message';
            sfx.lose();
            palette = 2;
            break;

        default:
            message = 'Game over';
            score = '';
            statusEl.className = '';
            palette = 2;
    }

    // ---- Persistent stats ----
    stats.games += 1;
    if (won) {
        stats.wins += 1;
        stats.streak += 1;
        if (stats.streak > stats.bestStreak) stats.bestStreak = stats.streak;
        if (questionCount > 0) {
            if (stats.bestQuestionCount == null || questionCount < stats.bestQuestionCount) {
                stats.bestQuestionCount = questionCount;
            }
        }
    } else {
        stats.losses += 1;
        stats.streak = 0;
    }
    saveStats();

    statusEl.textContent = message;
    gameOverMessageEl.textContent = message;
    gameOverScoreEl.textContent = score;
    updateStatsDisplay();
    gameOverOverlay.classList.add('show');
    launchConfetti(palette);

    updateUndoButton();
    updateDeductionPanel();
}

function giveUp() {
    if (gameOver || gamePhase === 'setup') return;
    const card = boardEl.querySelector(`[data-index="${aiSecretIndex}"]`);
    if (card) card.classList.add('correct');
    endGame('player-gave-up');
}

// Undo last flip
function undoLastFlip() {
    if (gameOver || gamePhase !== 'player-turn') return;
    if (undoCount >= MAX_UNDOS) return;
    if (!flipHistory.length) return;

    const last = flipHistory.pop();
    // last.wasEliminated is the state BEFORE the click.
    setCardEliminated(last.index, last.wasEliminated);
    const card = boardEl.querySelector(`[data-index="${last.index}"]`);
    if (card) updateCardAria(card, last.wasEliminated);
    undoCount++;
    sfx.flip();
    updateStatus();
    updateUndoButton();
}

// New game
function newGame() {
    // Alternate boards deterministically.
    boardIndex = (boardIndex + 1) % BOARD_ORDER.length;
    currentSheet = BOARD_ORDER[boardIndex];
    CHARACTERS = BOARDS[currentSheet];

    playerSecretIndex = -1;
    aiSecretIndex = -1;
    initialGuesses = Number(guessesSelect.value) || 1;
    guessesLeft = initialGuesses;
    questionCount = 0;
    gameOver = false;
    pendingGuessIdx = -1;
    autoFlip = assistSelect.value === 'on';
    aiProfile = AI_PROFILES[difficultySelect.value] || AI_PROFILES.medium;

    guessedIndices = new Set();
    playerEliminated = new Set();
    playerUsedQuestions = new Set();

    aiCandidates = [];
    aiUsedQuestions.clear();
    currentAiQuestionId = null;

    flipHistory = [];
    undoCount = 0;

    aiTurnQueued = false;
    turnBarEl.hidden = true;
    questionListEl.classList.remove('is-locked');

    questionCountEl.textContent = questionCount;
    guessesLeftEl.textContent = guessesLeft;
    statusEl.className = '';
    statusEl.textContent = 'Select your character to begin';

    gameOverOverlay.classList.remove('show');
    confirmOverlay.classList.remove('show');
    aiQuestionOverlay.classList.remove('show');
    selectionOverlay.classList.add('show');

    gameContainerEl.classList.add('setup-mode');

    chatLogEl.innerHTML = '';
    addChatMessage(`New game. AI difficulty: ${difficultySelect.value}.`, 'system');

    clearConfetti();
    renderBoard();
    renderQuestions();
    updatePlayerChip();
    setPhase('setup');
    updateUndoButton();
    updateDeductionPanel();

    requestAnimationFrame(alignPlayerCard);
}

// Events
resetBtn.addEventListener('click', () => {
    if (gamePhase === 'setup' || gameOver) {
        newGame();
        return;
    }
    showConfirm('Start a new game? The current match will be lost.', newGame);
});

playAgainBtn.addEventListener('click', newGame);

revealBtn.addEventListener('click', () => {
    if (gameOver || gamePhase === 'setup') return;
    showConfirm("Give up and reveal the AI's character?", giveUp);
});

soundToggleBtn.addEventListener('click', toggleSound);

undoBtn.addEventListener('click', undoLastFlip);

// Settings: wrong-guesses restarts the match, so confirm mid-game.
guessesSelect.addEventListener('change', () => {
    const apply = () => {
        initialGuesses = Number(guessesSelect.value) || 1;
        guessesLeft = initialGuesses;
        guessesLeftEl.textContent = guessesLeft;
    };

    if (gamePhase === 'setup' || gameOver) {
        apply();
        return;
    }

    const previous = String(initialGuesses);
    showConfirm(
        'Changing wrong guesses will restart the match. Continue?',
        () => { apply(); newGame(); },
        () => { guessesSelect.value = previous; }
    );
});

assistSelect.addEventListener('change', () => {
    autoFlip = assistSelect.value === 'on';
    if (turnBarTextEl && !turnBarEl.hidden) {
        turnBarTextEl.textContent = autoFlip
            ? 'Auto-flip is on. Hand over when ready.'
            : 'Flip any ruled-out faces, then hand over.';
    }
});

// Changing difficulty mid-game restarts.
function promptRestartSetting(applySetting, revertSetting) {
    if (gamePhase === 'setup' || gameOver) {
        applySetting();
        return;
    }
    showConfirm(
        'Changing this setting will restart the match. Continue?',
        () => { applySetting(); newGame(); },
        () => { revertSetting(); }
    );
}

difficultySelect.addEventListener('change', () => {
    const prev = difficultySelect.value;
    promptRestartSetting(
        () => { aiProfile = AI_PROFILES[difficultySelect.value] || AI_PROFILES.medium; },
        () => { difficultySelect.value = prev; }
    );
});

window.addEventListener('resize', () => {
    if (confettiParticles.length) resizeConfettiCanvas();
    alignPlayerCard();
});

continueBtn.addEventListener('click', beginAiTurn);

// ---- Keyboard shortcuts ----
window.addEventListener('keydown', (e) => {
    // Ignore when typing into a form field.
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

    if (e.key === 'Enter') {
        if (confirmOverlay.classList.contains('show')) { confirmYesBtn.click(); return; }
        if (!turnBarEl.hidden) { continueBtn.click(); return; }
    }
    if (e.key === 'u' || e.key === 'U') { undoLastFlip(); }
    if (e.key === 'r' || e.key === 'R') { resetBtn.click(); }
});

// Boot
loadStats();
loadSoundPref();
resizeConfettiCanvas();
newGame();