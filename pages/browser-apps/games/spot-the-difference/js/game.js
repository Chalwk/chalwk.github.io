// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// --- Game lifecycle ------------------------------------------------------------
function startNewGame() {
    clearInterval(timerId);
    clearTimeout(roundTimeoutId);
    roundTimeoutId = null;
    overlay.classList.remove('show');
    clearLog();
    round = 1;
    score = 0;
    combo = 0;
    bestCombo = 0;
    carryTime = 0;
    gameActive = true;
    gameOver = false;
    log('A new set of pictures appears. Good luck!', 'log-entry-good');
    newRound();
}

function newRound() {
    clearInterval(timerId);
    scene = buildRoundScene(sizeKey, round);
    foundCount = 0;
    hintsLeft = DIFFICULTY_PRESETS[difficultyKey].hintsPerRound;
    roundTimeTotal = timeForRound(round) + carryTime;
    timeLeft = roundTimeTotal;
    carryTime = 0;
    setStatus(`Round ${round}: find ${scene.diffs.length} differences.`);
    log(`${scene.theme.icon} ${scene.theme.name} - ${scene.diffs.length} differences hidden.`, 'log-entry-loot');
    render();
    timerId = setInterval(tickTimer, 1000);
}

function tickTimer() {
    if (!gameActive || gameOver) return;
    timeLeft--;
    updateTimerHud();
    if (timeLeft <= 0) {
        timeLeft = 0;
        updateTimerHud();
        endGame(false);
    }
}

function roundIsCleared() { return !scene || foundCount >= scene.diffs.length; }

// A click counts if it lands near any of the difference's marked points.
// A "move" diff has two (from and to). Everything else has one.
function registerHit(x, y) {
    if (!gameActive || gameOver || !scene) return false;
    const preset = DIFFICULTY_PRESETS[difficultyKey];
    const diff = scene.diffs.find(d => {
        if (d.found) return false;
        const anchors = [];
        if (d.markLeft) anchors.push(d.markLeft);
        if (d.markRight) anchors.push(d.markRight);
        if (!anchors.length) anchors.push({ x: d.x, y: d.y });
        return anchors.some(p => distancePt(p, { x, y }) <= d.radius);
    });

    if (diff) {
        diff.found = true;
        foundCount++;
        combo++;
        bestCombo = Math.max(bestCombo, combo);
        const gained = 25 + combo * 5;
        score += gained;
        playFoundSound();
        log(`Found ${DIFF_TYPES[diff.kind].label}! +${gained}`, 'log-entry-good');
        if (foundCount >= scene.diffs.length) completeRound();
        return true;
    }

    combo = 0;
    playMissSound();
    timeLeft = Math.max(0, timeLeft - preset.missPenalty);
    log(`No difference there. -${preset.missPenalty}s`, 'log-entry-danger');
    if (timeLeft <= 0) endGame(false);
    return false;
}

function completeRound() {
    clearInterval(timerId);
    playRoundCompleteSound();
    const bonus = timeLeft * 2;
    score += bonus;
    log(`Round cleared! Time bonus +${bonus}.`, 'log-entry-good');
    setStatus(`Round ${round} cleared!`);
    carryTime = Math.min(timeLeft, 20);
    if (round >= MAX_ROUND) { endGame(true); return; }
    const nextRound = round + 1;
    // Stored so a New Game click during the celebration cancels it.
    roundTimeoutId = setTimeout(() => {
        roundTimeoutId = null;
        if (!gameActive || gameOver) return;
        round = nextRound;
        newRound();
    }, 1400);
}

function useHint() {
    if (!gameActive || gameOver || !scene) return;
    if (hintsLeft <= 0) { setStatus('No hints left this round.'); return; }
    const remaining = scene.diffs.filter(d => !d.found);
    if (!remaining.length) return;
    hintsLeft--;
    const preset = DIFFICULTY_PRESETS[difficultyKey];
    timeLeft = Math.max(1, timeLeft - preset.hintCost);
    const diff = pick(remaining);
    playHintSound();
    log(`Hint used: revealing ${DIFF_TYPES[diff.kind].label}. -${preset.hintCost}s`, 'log-entry-loot');
    flashHint(diff);
    updateHud();
}

function endGame(won) {
    if (gameOver) return;
    gameOver = true;
    gameActive = false;
    clearInterval(timerId);
    clearTimeout(roundTimeoutId);
    roundTimeoutId = null;
    if (won) playVictorySound(); else playDeathSound();
    if (score > bestScore) {
        bestScore = score;
        try { localStorage.setItem('spotdiff-best-score', String(bestScore)); } catch (e) { /* storage unavailable */ }
    }
    overlayMessage.textContent = won ? 'All Rounds Cleared!' : "Time's Up!";
    overlayDetail.textContent = `Reached Round ${round}\nScore: ${score}\nBest Combo: ${bestCombo}x\nBest Score: ${bestScore}`;
    overlay.classList.add('show');
    setStatus(won ? 'You spotted everything!' : 'Game over.');
    render();
}