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
    void continueBtn.offsetWidth; // force reflow so the animation restarts
    continueBtn.classList.add('pulse');

    updateStatus();
}

function beginAiTurn() {
    if (!aiTurnQueued || gameOver) return;
    aiTurnQueued = false;
    turnBarEl.hidden = true;
    questionListEl.classList.remove('is-locked');
    gamePhase = 'ai-turn';
    updateStatus();
    aiTurn(); // keeps its internal ~1.2s "thinking" beat before acting
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

    let message = '';
    let score = '';
    let palette = 2; // default red-ish

    switch (reason) {
        case 'player-guessed-correct':
            message = 'You win!';
            score = `Solved in ${questionCount} question${questionCount === 1 ? '' : 's'}`;
            statusEl.className = 'win-message';
            sfx.win();
            palette = 1;
            break;

        case 'ai-guessed-wrong':
            message = 'You win!';
            score = `The AI guessed wrong. Its character was ${charName(aiSecretIndex)}.`;
            statusEl.className = 'win-message';
            sfx.win();
            palette = 1;
            break;

        case 'ai-guessed-correct':
            message = 'AI wins!';
            score = `Your character was ${charName(playerSecretIndex)}. AI's was ${charName(aiSecretIndex)}.`;
            statusEl.className = 'tie-message';
            sfx.lose();
            palette = 2;
            break;

        case 'player-out-of-guesses':
            message = 'Out of guesses';
            score = `Your character was ${charName(playerSecretIndex)}. AI's was ${charName(aiSecretIndex)}.`;
            statusEl.className = 'tie-message';
            sfx.lose();
            palette = 2;
            break;

        case 'player-gave-up':
            message = 'You gave up';
            score = `AI's character was ${charName(aiSecretIndex)}.`;
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

    statusEl.textContent = message;
    gameOverMessageEl.textContent = message;
    gameOverScoreEl.textContent = score;
    gameOverOverlay.classList.add('show');
    launchConfetti(palette);
}

function giveUp() {
    if (gameOver || gamePhase === 'setup') return;
    const card = boardEl.querySelector(`[data-index="${aiSecretIndex}"]`);
    if (card) card.classList.add('correct');
    endGame('player-gave-up');
}

// New game
function newGame() {
    // Randomly select a board
    const sheets = ['faces1.png', 'faces2.png'];
    currentSheet = sheets[Math.floor(Math.random() * sheets.length)];
    CHARACTERS = BOARDS[currentSheet];

    playerSecretIndex = -1;
    aiSecretIndex = -1;
    guessesLeft = Number(guessesSelect.value) || 1;
    questionCount = 0;
    gameOver = false;
    pendingGuessIdx = -1;
    autoFlip = assistSelect.value === 'on';
    guessedIndices = new Set();

    aiCandidates = [];
    aiUsedQuestions.clear();
    currentAiQuestionId = null;
    gamePhase = 'setup';

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

    // Dim everything in the container except the board during selection
    gameContainerEl.classList.add('setup-mode');

    chatLogEl.innerHTML = '';

    clearConfetti();
    renderBoard();
    renderQuestions();
    updatePlayerChip();
    updateStatus();

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

// Settings: wrong-guesses restarts the match, so confirm mid-game.
guessesSelect.addEventListener('change', () => {
    const apply = () => {
        guessesLeft = Number(guessesSelect.value) || 1;
        guessesLeftEl.textContent = guessesLeft;
    };

    if (gamePhase === 'setup' || gameOver) {
        apply();
        return;
    }

    const previous = String(guessesLeft);
    showConfirm(
        'Changing wrong guesses will restart the match. Continue?',
        () => { apply(); newGame(); },
        () => { guessesSelect.value = previous; }
    );
});

assistSelect.addEventListener('change', () => {
    autoFlip = assistSelect.value === 'on';
    // Keep the turn-bar copy in sync if it's currently visible.
    if (turnBarTextEl && !turnBarEl.hidden) {
        turnBarTextEl.textContent = autoFlip
            ? 'Auto-flip is on. Hand over when ready.'
            : 'Flip any ruled-out faces, then hand over.';
    }
});

window.addEventListener('resize', () => {
    if (confettiParticles.length) resizeConfettiCanvas();
    alignPlayerCard();
});

continueBtn.addEventListener('click', beginAiTurn);

// Boot
loadSoundPref();
resizeConfettiCanvas();
newGame();