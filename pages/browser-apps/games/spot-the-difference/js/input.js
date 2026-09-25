// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// --- Input -------------------------------------------------------------------
function handleBoardClick(boardEl, evt) {
    // Ignore extra clicks during the short celebration window after a round
    // is already fully cleared, so they can't be scored as misses.
    if (!gameActive || gameOver || roundIsCleared()) return;
    const pt = svgPointFromEvent(boardEl, evt);
    if (!pt) return;
    const hit = registerHit(pt.x, pt.y);
    render();
    if (!hit) showMissMarker(boardEl, pt.x, pt.y);
}

leftBoardEl.addEventListener('click', (e) => handleBoardClick(leftBoardEl, e));
rightBoardEl.addEventListener('click', (e) => handleBoardClick(rightBoardEl, e));

hintBtn.addEventListener('click', useHint);
resetBtn.addEventListener('click', startNewGame);
playAgainBtn.addEventListener('click', startNewGame);

// Changing settings mid-run starts a fresh game (intentional).
sizeSelect.addEventListener('change', () => { sizeKey = sizeSelect.value; startNewGame(); });
difficultySelect.addEventListener('change', () => { difficultyKey = difficultySelect.value; startNewGame(); });

function handleKeyDown(event) {
    const key = event.key.toLowerCase();
    if (gameOver) {
        if (key === ' ' || key === 'enter') startNewGame();
        return;
    }
    if (key === 'h') useHint();
    else if (key === 'm') soundToggleBtn.click();
}

document.addEventListener('keydown', handleKeyDown);

window.addEventListener('load', () => {
    startNewGame();
});

updateSoundIcon();
