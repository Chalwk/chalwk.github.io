// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// --- Input -------------------------------------------------------------------
function handleKeyDown(event) {
    const key = event.key.toLowerCase();
    // Stop the page from scrolling when arrows/space are pressed.
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();

    // 1. Game over: SPACE restarts the run.
    if (gameOver) {
        if (key === ' ') startNewGame();
        return;
    }

    // 2. Choice modal: LEFT/RIGHT (or A/D) move the highlight, SPACE / ENTER confirm.
    if (choicePending) {
        const cards = choiceOptionsEl.querySelectorAll('.choice-card');
        if (!cards.length) return;
        if (key === 'arrowleft' || key === 'a') {
            choiceIndex = (choiceIndex - 1 + cards.length) % cards.length;
            updateChoiceFocus();
        } else if (key === 'arrowright' || key === 'd') {
            choiceIndex = (choiceIndex + 1) % cards.length;
            updateChoiceFocus();
        } else if (key === ' ' || key === 'enter') {
            cards[choiceIndex]?.click();
        }
        return;
    }

    if (!gameActive) return;

    switch (key) {
        case 'w': case 'arrowup': tryMove(0, -1); break;
        case 's': case 'arrowdown': tryMove(0, 1); break;
        case 'a': case 'arrowleft': tryMove(-1, 0); break;
        case 'd': case 'arrowright': tryMove(1, 0); break;
        case ' ': waitTurn(); break;
        case 'p': usePotion(); break;
        case 'm': soundToggleBtn.click(); break;
    }
}

document.addEventListener('keydown', handleKeyDown);
document.querySelectorAll('.dpad-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const dir = btn.dataset.dir;
        if (dir === 'up') tryMove(0, -1);
        else if (dir === 'down') tryMove(0, 1);
        else if (dir === 'left') tryMove(-1, 0);
        else if (dir === 'right') tryMove(1, 0);
    });
});

waitBtn.addEventListener('click', waitTurn);
potionBtn.addEventListener('click', usePotion);
resetBtn.addEventListener('click', startNewGame);
playAgainBtn.addEventListener('click', startNewGame);

// Changing settings mid-run starts a fresh dungeon - intentional.
sizeSelect.addEventListener('change', () => { sizeKey = sizeSelect.value; startNewGame(); });
difficultySelect.addEventListener('change', () => { difficultyKey = difficultySelect.value; startNewGame(); });

// Re-fit the panel and redraw the board on resize so cells stay correct.
window.addEventListener('resize', () => {
    fitGamePanel();
    if (gameActive || gameOver) renderBoard();
});

window.addEventListener('load', () => {
    startNewGame();
});

updateSoundIcon();