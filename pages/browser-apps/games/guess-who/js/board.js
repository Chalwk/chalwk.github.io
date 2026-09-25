// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// Board rendering
function renderBoard() {
    boardEl.innerHTML = '';
    boardEl.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;

    CHARACTERS.forEach((char, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const posX = (col * 100) / (COLS - 1);
        const posY = (row * 100) / (ROWS - 1);

        const card = document.createElement('div');
        card.className = 'gw-card';
        card.dataset.index = i;
        card.setAttribute('role', 'button');

        const face = document.createElement('div');
        face.className = 'gw-face';
        face.style.backgroundImage = `url('${currentSheet}')`;
        face.style.backgroundPosition = `${posX}% ${posY}%`;

        const nameTag = document.createElement('div');
        nameTag.className = 'gw-name';
        nameTag.textContent = char.name;

        const flip = document.createElement('div');
        flip.className = 'gw-flip';
        flip.textContent = '?';

        const guessBtn = document.createElement('button');
        guessBtn.type = 'button';
        guessBtn.className = 'gw-guess';
        guessBtn.title = `Guess ${char.name}`;
        guessBtn.setAttribute('aria-label', `Guess ${char.name}`);
        guessBtn.textContent = '?';
        guessBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // During setup the guess button should behave like a card click
            // so the player can still pick their character from that corner.
            if (gamePhase === 'setup') {
                onCardClick(i);
                return;
            }
            requestGuess(i);
        });

        card.appendChild(face);
        card.appendChild(flip);
        card.appendChild(nameTag);
        card.appendChild(guessBtn);
        card.addEventListener('click', () => onCardClick(i));

        boardEl.appendChild(card);
    });
}

function faceUpCount() {
    return boardEl.querySelectorAll('.gw-card:not(.eliminated)').length;
}

// Card interaction
function onCardClick(index) {
    if (gameOver) return;

    if (gamePhase === 'setup') {
        // Player is selecting their character - any click inside the cell works
        playerSecretIndex = index;
        selectionOverlay.classList.remove('show');
        gameContainerEl.classList.remove('setup-mode');
        gamePhase = 'player-turn';
        statusEl.textContent = "Character selected! Your turn.";
        sfx.answer(true);
        updatePlayerChip();

        const ownCard = boardEl.querySelector(`[data-index="${index}"]`);
        if (ownCard) {
            ownCard.classList.add('eliminated');
            setTimeout(() => sfx.flip(), 220);
        }

        // AI selects a different character
        do {
            aiSecretIndex = Math.floor(Math.random() * TOTAL);
        } while (aiSecretIndex === playerSecretIndex);

        // AI always tracks its own candidates automatically (auto-flip).
        // Its own secret is excluded since the player's character can never match it.
        aiCandidates = Array.from({ length: TOTAL }, (_, i) => i).filter(i => i !== aiSecretIndex);
        return;
    }

    if (gamePhase !== 'player-turn') return;

    const card = boardEl.querySelector(`[data-index="${index}"]`);
    if (!card) return;

    if (card.classList.contains('eliminated')) {
        card.classList.remove('eliminated');
    } else {
        card.classList.add('eliminated');
    }
    sfx.flip();
    updateStatus();
}