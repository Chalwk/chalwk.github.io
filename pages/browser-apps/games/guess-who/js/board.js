// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// Board rendering
function renderBoard() {
    boardEl.innerHTML = '';
    boardEl.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;

    const frag = document.createDocumentFragment();

    CHARACTERS.forEach((char, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const posX = (col * 100) / (COLS - 1);
        const posY = (row * 100) / (ROWS - 1);

        const card = document.createElement('div');
        card.className = 'gw-card';
        card.dataset.index = i;
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Character ${char.name}, face up`);
        card.setAttribute('aria-pressed', 'false');

        const inner = document.createElement('div');
        inner.className = 'gw-card-inner';

        const faceWrap = document.createElement('div');
        faceWrap.className = 'gw-face-wrap';

        const face = document.createElement('div');
        face.className = 'gw-face';
        face.style.backgroundImage = `url('${currentSheet}')`;
        face.style.backgroundPosition = `${posX}% ${posY}%`;

        const nameTag = document.createElement('div');
        nameTag.className = 'gw-name';
        nameTag.textContent = char.name;

        faceWrap.appendChild(face);
        faceWrap.appendChild(nameTag);

        const flip = document.createElement('div');
        flip.className = 'gw-flip';
        flip.textContent = '?';

        inner.appendChild(faceWrap);
        inner.appendChild(flip);

        const guessBtn = document.createElement('button');
        guessBtn.type = 'button';
        guessBtn.className = 'gw-guess';
        guessBtn.tabIndex = -1;
        guessBtn.title = `Guess ${char.name}`;
        guessBtn.setAttribute('aria-label', `Guess ${char.name}`);
        guessBtn.textContent = '?';

        card.appendChild(inner);
        card.appendChild(guessBtn);

        frag.appendChild(card);
    });

    boardEl.appendChild(frag);
}

function faceUpCount() {
    return boardEl.querySelectorAll('.gw-card:not(.eliminated)').length;
}

function updateCardAria(card, eliminated) {
    const i = Number(card.dataset.index);
    const name = charName(i);
    card.setAttribute('aria-label', `${name} — ${eliminated ? 'flipped' : 'face up'}`);
    card.setAttribute('aria-pressed', String(eliminated));
}

// Event delegation - single listener on the board handles all cards and guess buttons.
boardEl.addEventListener('click', (e) => {
    const card = e.target.closest('.gw-card');
    if (!card) return;
    const i = Number(card.dataset.index);
    if (e.target.closest('.gw-guess')) {
        if (gamePhase === 'setup') {
            onCardClick(i);
        } else {
            requestGuess(i);
        }
    } else {
        onCardClick(i);
    }
});

boardEl.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.gw-card');
    if (!card) return;
    e.preventDefault();
    onCardClick(Number(card.dataset.index));
});

// Card interaction
function onCardClick(index) {
    if (gameOver) return;

    if (gamePhase === 'setup') {
        selectSecret(index);
        return;
    }

    if (gamePhase !== 'player-turn') return;

    const card = boardEl.querySelector(`[data-index="${index}"]`);
    if (!card) return;

    const eliminated = !card.classList.contains('eliminated');
    setCardEliminated(index, eliminated);
    updateCardAria(card, eliminated);

    // Push to undo history
    flipHistory.push({ index, wasEliminated: !eliminated });
    if (flipHistory.length > MAX_UNDOS * 4) flipHistory.shift();
    updateUndoButton();

    sfx.flip();
    updateStatus();
}

// Player selects their secret character during setup.
function selectSecret(index) {
    playerSecretIndex = index;

    selectionOverlay.classList.remove('show');
    gameContainerEl.classList.remove('setup-mode');
    sfx.answer(true);

    updatePlayerChip();

    const ownCard = boardEl.querySelector(`[data-index="${index}"]`);
    if (ownCard) {
        ownCard.classList.add('eliminated');
        setTimeout(() => { if (!gameOver) sfx.flip(); }, 220);
    }

    // AI selects a different character
    do {
        aiSecretIndex = Math.floor(Math.random() * TOTAL);
    } while (aiSecretIndex === playerSecretIndex);

    aiCandidates = Array.from({ length: TOTAL }, (_, i) => i).filter(i => i !== aiSecretIndex);
    aiUsedQuestions.clear();
    currentAiQuestionId = null;
    updateDeductionPanel();
    setPhase('player-turn');
}