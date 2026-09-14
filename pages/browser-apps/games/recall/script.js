// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

const gameBoard = document.getElementById('game-board');
const status = document.getElementById('status');
const resetBtn = document.getElementById('reset');
const playAgainBtn = document.getElementById('play-again');
const pvpBtn = document.getElementById('pvp');
const pvaiBtn = document.getElementById('pvai');
const boardSizeSelect = document.getElementById('board-size');
const difficultySelect = document.getElementById('difficulty');
const difficultyLabel = document.getElementById('difficulty-label');
const score1Display = document.getElementById('score-1');
const score2Display = document.getElementById('score-2');
const moves1Display = document.getElementById('moves-1');
const moves2Display = document.getElementById('moves-2');
const player2Label = document.getElementById('player-2-label');
const overlay = document.getElementById('game-over-overlay');
const overlayMessage = document.getElementById('game-over-message');
const overlayScore = document.getElementById('game-over-score');

// Font Awesome free-solid icon pool. Any board size draws a random,
// non-repeating subset of these, so no two games look the same.
const ICONS = [
    // nature & weather
    'fa-heart', 'fa-star', 'fa-star-half-stroke', 'fa-bolt', 'fa-moon', 'fa-sun',
    'fa-snowflake', 'fa-icicles', 'fa-snowman', 'fa-fire', 'fa-fire-flame-curved',
    'fa-fire-flame-simple', 'fa-leaf', 'fa-tree', 'fa-seedling', 'fa-clover',
    'fa-feather', 'fa-feather-pointed', 'fa-wind', 'fa-water', 'fa-droplet',
    'fa-cloud', 'fa-cloud-sun', 'fa-cloud-moon', 'fa-cloud-rain',
    'fa-cloud-showers-heavy', 'fa-cloud-bolt', 'fa-cloud-sun-rain', 'fa-smog',
    'fa-umbrella', 'fa-umbrella-beach', 'fa-mountain', 'fa-mountain-sun',
    'fa-meteor', 'fa-rainbow', 'fa-temperature-high', 'fa-temperature-low',

    // animals & creatures
    'fa-paw', 'fa-bone', 'fa-bug', 'fa-spider', 'fa-mosquito', 'fa-worm',
    'fa-cat', 'fa-dog', 'fa-fish', 'fa-fish-fins', 'fa-shrimp', 'fa-frog',
    'fa-otter', 'fa-hippo', 'fa-cow', 'fa-horse', 'fa-horse-head',
    'fa-kiwi-bird', 'fa-dove', 'fa-crow', 'fa-dragon', 'fa-egg',

    // vehicles & travel
    'fa-rocket', 'fa-shuttle-space', 'fa-plane', 'fa-plane-departure',
    'fa-plane-arrival', 'fa-jet-fighter', 'fa-helicopter', 'fa-car',
    'fa-car-side', 'fa-taxi', 'fa-truck', 'fa-truck-fast', 'fa-truck-pickup',
    'fa-tractor', 'fa-trailer', 'fa-bicycle', 'fa-motorcycle', 'fa-train',
    'fa-train-subway', 'fa-train-tram', 'fa-bus', 'fa-bus-simple', 'fa-ship',
    'fa-sailboat', 'fa-ferry', 'fa-anchor',

    // food & drink
    'fa-pizza-slice', 'fa-ice-cream', 'fa-cookie', 'fa-cookie-bite',
    'fa-cake-candles', 'fa-birthday-cake', 'fa-candy-cane', 'fa-carrot',
    'fa-lemon', 'fa-apple-whole', 'fa-pepper-hot', 'fa-mug-hot',
    'fa-mug-saucer', 'fa-burger', 'fa-bacon', 'fa-cheese', 'fa-bread-slice',
    'fa-drumstick-bite', 'fa-champagne-glasses', 'fa-wine-glass',
    'fa-beer-mug-empty', 'fa-martini-glass', 'fa-martini-glass-citrus',
    'fa-bottle-water', 'fa-whiskey-glass', 'fa-utensils',

    // objects & treasures
    'fa-gem', 'fa-ring', 'fa-crown', 'fa-key', 'fa-lock', 'fa-unlock',
    'fa-unlock-keyhole', 'fa-lock-open', 'fa-gift', 'fa-trophy', 'fa-medal',
    'fa-award', 'fa-certificate', 'fa-ribbon', 'fa-bomb', 'fa-skull',
    'fa-skull-crossbones', 'fa-lightbulb', 'fa-flask', 'fa-flask-vial',
    'fa-vial', 'fa-vials', 'fa-atom', 'fa-brain', 'fa-magnet',
    'fa-puzzle-piece', 'fa-cube', 'fa-cubes', 'fa-shapes', 'fa-dumbbell',
    'fa-wifi', 'fa-coins', 'fa-sack-dollar', 'fa-sack-xmark', 'fa-money-bill',
    'fa-money-bill-wave', 'fa-credit-card', 'fa-wallet', 'fa-scale-balanced',
    'fa-scale-unbalanced', 'fa-gavel', 'fa-hammer', 'fa-wrench',
    'fa-screwdriver', 'fa-screwdriver-wrench', 'fa-toolbox', 'fa-gear',
    'fa-gears', 'fa-compass-drafting', 'fa-ruler', 'fa-ruler-combined',
    'fa-scissors', 'fa-paintbrush', 'fa-paint-roller', 'fa-brush', 'fa-eraser',
    'fa-pencil', 'fa-pen', 'fa-pen-nib', 'fa-pen-fancy', 'fa-marker',
    'fa-highlighter', 'fa-paperclip', 'fa-thumbtack', 'fa-bell',
    'fa-bell-concierge', 'fa-hourglass', 'fa-hourglass-half', 'fa-stopwatch',
    'fa-clock', 'fa-compass', 'fa-globe', 'fa-map', 'fa-map-pin',
    'fa-location-dot', 'fa-location-arrow', 'fa-route', 'fa-signs-post',
    'fa-road', 'fa-traffic-light', 'fa-ticket', 'fa-passport', 'fa-suitcase',
    'fa-suitcase-rolling', 'fa-chair', 'fa-couch', 'fa-bed', 'fa-door-open',
    'fa-door-closed', 'fa-house', 'fa-hotel', 'fa-store', 'fa-hospital',
    'fa-school', 'fa-church', 'fa-landmark', 'fa-city', 'fa-building',
    'fa-warehouse', 'fa-industry', 'fa-campground', 'fa-tent', 'fa-binoculars',
    'fa-fire-extinguisher', 'fa-bullhorn', 'fa-megaphone', 'fa-bullseye',
    'fa-crosshairs', 'fa-trash', 'fa-trash-can', 'fa-recycle', 'fa-box',
    'fa-box-open', 'fa-boxes-stacked', 'fa-archive', 'fa-folder',
    'fa-folder-open', 'fa-file', 'fa-file-lines', 'fa-copy', 'fa-clipboard',
    'fa-clipboard-check', 'fa-clipboard-list', 'fa-book', 'fa-book-open',
    'fa-bookmark', 'fa-newspaper', 'fa-scroll', 'fa-barcode', 'fa-qrcode',
    'fa-fingerprint', 'fa-signature', 'fa-stamp', 'fa-id-card', 'fa-id-badge',
    'fa-address-book', 'fa-address-card', 'fa-envelope', 'fa-envelope-open',
    'fa-paper-plane', 'fa-basket-shopping', 'fa-cart-shopping',
    'fa-bag-shopping', 'fa-tags', 'fa-tag', 'fa-receipt', 'fa-cash-register',
    'fa-percent', 'fa-star-of-life', 'fa-shield', 'fa-shield-halved',
    'fa-shield-heart', 'fa-flag', 'fa-flag-checkered', 'fa-infinity',
    'fa-hashtag', 'fa-link', 'fa-share', 'fa-download', 'fa-upload',
    'fa-print', 'fa-calculator',

    // tech & media
    'fa-keyboard', 'fa-desktop', 'fa-laptop', 'fa-tv', 'fa-camera',
    'fa-camera-retro', 'fa-video', 'fa-phone', 'fa-mobile-screen',
    'fa-hard-drive', 'fa-database', 'fa-server', 'fa-sd-card', 'fa-usb',
    'fa-plug', 'fa-battery-full', 'fa-satellite', 'fa-satellite-dish',
    'fa-tower-broadcast', 'fa-tower-cell', 'fa-rss', 'fa-bluetooth',
    'fa-sim-card', 'fa-radio', 'fa-microchip', 'fa-memory', 'fa-headphones',
    'fa-headphones-simple', 'fa-microphone', 'fa-microphone-lines', 'fa-music',
    'fa-guitar', 'fa-palette', 'fa-swatchbook', 'fa-vector-square',
    'fa-layer-group', 'fa-ghost', 'fa-robot', 'fa-gamepad', 'fa-alien',

    // games & characters
    'fa-dice', 'fa-dice-d20', 'fa-dice-d6', 'fa-chess', 'fa-chess-knight',
    'fa-chess-rook', 'fa-chess-queen', 'fa-chess-king', 'fa-chess-bishop',
    'fa-chess-pawn', 'fa-chess-board', 'fa-hat-wizard', 'fa-hat-cowboy',
    'fa-hat-cowboy-side', 'fa-wand-magic', 'fa-wand-sparkles', 'fa-broom',
    'fa-graduation-cap',

    // hands, faces & people
    'fa-thumbs-up', 'fa-thumbs-down', 'fa-eye', 'fa-eye-slash',
    'fa-hand-spock', 'fa-hand-peace', 'fa-handshake', 'fa-hands-clapping',
    'fa-hand-fist', 'fa-hand-pointer', 'fa-hand-scissors', 'fa-hand-lizard',
    'fa-heart-pulse', 'fa-heart-crack', 'fa-face-smile', 'fa-face-laugh',
    'fa-face-grin-stars', 'fa-face-grin-hearts', 'fa-face-surprise',
    'fa-face-angry', 'fa-face-sad-tear', 'fa-face-meh',
    'fa-face-grin-tongue-wink', 'fa-face-kiss-wink-heart', 'fa-poo',
    'fa-user', 'fa-user-ninja', 'fa-user-astronaut', 'fa-user-secret',
    'fa-user-doctor', 'fa-user-nurse', 'fa-user-shield', 'fa-user-lock',
    'fa-user-tag', 'fa-user-gear', 'fa-people-group', 'fa-child',
    'fa-person-running', 'fa-person-biking', 'fa-person-swimming',
    'fa-person-hiking', 'fa-person-skiing', 'fa-person-skating',
    'fa-person-snowboarding', 'fa-person-walking', 'fa-mask', 'fa-glasses',
    'fa-sunglasses', 'fa-shirt', 'fa-vest', 'fa-shoe-prints', 'fa-socks',
    'fa-mitten',

    // science & health
    'fa-tooth', 'fa-pills', 'fa-syringe', 'fa-stethoscope', 'fa-virus',
    'fa-bacteria', 'fa-dna', 'fa-microscope', 'fa-prescription-bottle',
    'fa-capsules', 'fa-tablets', 'fa-bandage',

    // seasonal
    'fa-holly-berry', 'fa-stocking'
];

// Column counts per board size (total cards)
const COLUMN_MAP = { 12: 4, 16: 4, 24: 6 };

// Chance the AI "forgets" a card it has already seen, per difficulty
const FORGET_CHANCE = { forgetful: 0.65, sharp: 0.25, perfect: 0 };

let deck = [];
let cardEls = [];
let flippedIndices = [];
let matchedIndices = new Set();
let lockBoard = false;
let currentPlayer = 1;
let scores = { 1: 0, 2: 0 };
let moves = { 1: 0, 2: 0 };
let gameMode = 'pvai';
let gameActive = true;
let aiMemory = {};
let boardSize = 16;
let difficulty = 'sharp';

function shuffle(array) {
    const a = array.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Draw `count` unique icons at random from the pool without mutating ICONS.
function pickRandomIcons(count) {
    if (count > ICONS.length) {
        throw new Error(`Board needs ${count} pairs but only ${ICONS.length} icons are available.`);
    }
    return shuffle(ICONS).slice(0, count);
}

function buildDeck(size) {
    const pairCount = size / 2;
    const icons = pickRandomIcons(pairCount);
    return shuffle([...icons, ...icons]);
}

function renderBoard() {
    gameBoard.innerHTML = '';
    gameBoard.style.gridTemplateColumns = `repeat(${COLUMN_MAP[boardSize]}, 1fr)`;

    cardEls = deck.map((icon, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.index = index;
        card.dataset.icon = icon;
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-face card-front"><i class="fas fa-question"></i></div>
                <div class="card-face card-back"><i class="fas ${icon}"></i></div>
            </div>`;
        card.addEventListener('click', () => handleCardClick(index));
        gameBoard.appendChild(card);
        return card;
    });
}

function handleCardClick(index) {
    if (!gameActive || lockBoard) return;
    if (matchedIndices.has(index)) return;
    if (flippedIndices.includes(index)) return;
    if (gameMode === 'pvai' && currentPlayer === 2) return; // AI's turn, ignore clicks

    flipCard(index);
}

function flipCard(index) {
    const card = cardEls[index];
    card.classList.add('flipped');
    flippedIndices.push(index);

    // The AI "watches" every card revealed, by either player
    if (gameMode === 'pvai') {
        aiMemory[index] = card.dataset.icon;
    }

    if (flippedIndices.length === 2) {
        // A "move" is one full attempt: two cards flipped by the current player.
        moves[currentPlayer]++;
        updateMoves();
        lockBoard = true;
        setTimeout(evaluateMatch, 600);
    }
}

function evaluateMatch() {
    const [i1, i2] = flippedIndices;
    const card1 = cardEls[i1];
    const card2 = cardEls[i2];

    if (card1.dataset.icon === card2.dataset.icon) {
        matchedIndices.add(i1);
        matchedIndices.add(i2);
        card1.classList.add('matched', `owner-${currentPlayer}`);
        card2.classList.add('matched', `owner-${currentPlayer}`);
        delete aiMemory[i1];
        delete aiMemory[i2];

        scores[currentPlayer]++;
        updateScores();
        flippedIndices = [];
        lockBoard = false;

        if (matchedIndices.size === deck.length) {
            endGame();
            return;
        }

        updateStatus();
        if (gameMode === 'pvai' && currentPlayer === 2 && gameActive) {
            setTimeout(makeAIMove, 600);
        }
    } else {
        card1.classList.add('mismatch');
        card2.classList.add('mismatch');

        setTimeout(() => {
            card1.classList.remove('flipped', 'mismatch');
            card2.classList.remove('flipped', 'mismatch');
            flippedIndices = [];
            lockBoard = false;

            maybeForget(i1);
            maybeForget(i2);
            switchPlayer();

            if (gameMode === 'pvai' && currentPlayer === 2 && gameActive) {
                setTimeout(makeAIMove, 500);
            }
        }, 500);
    }
}

function maybeForget(index) {
    if (gameMode !== 'pvai' || difficulty === 'perfect') return;
    if (matchedIndices.has(index)) return;
    if (Math.random() < FORGET_CHANCE[difficulty]) {
        delete aiMemory[index];
    }
}

function switchPlayer() {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    updateStatus();
}

function updateScores() {
    score1Display.textContent = scores[1];
    score2Display.textContent = scores[2];
}

function updateMoves() {
    moves1Display.textContent = `Moves: ${moves[1]}`;
    moves2Display.textContent = `Moves: ${moves[2]}`;
}

function updateStatus() {
    if (!gameActive) return;
    if (gameMode === 'pvai' && currentPlayer === 2) {
        status.textContent = "AI's turn";
    } else {
        status.textContent = `Player ${currentPlayer}'s turn`;
    }
}

function findKnownPair() {
    const entries = Object.entries(aiMemory).filter(([idx]) => !matchedIndices.has(Number(idx)));
    for (let i = 0; i < entries.length; i++) {
        for (let j = i + 1; j < entries.length; j++) {
            if (entries[i][1] === entries[j][1]) {
                return [Number(entries[i][0]), Number(entries[j][0])];
            }
        }
    }
    return null;
}

function makeAIMove() {
    if (!gameActive) return;

    const knownPair = findKnownPair();
    if (knownPair) {
        flipCard(knownPair[0]);
        setTimeout(() => flipCard(knownPair[1]), 550);
        return;
    }

    const available = cardEls
        .map((_, i) => i)
        .filter((i) => !matchedIndices.has(i) && !flippedIndices.includes(i));

    const first = available[Math.floor(Math.random() * available.length)];
    flipCard(first);

    setTimeout(() => {
        const icon = cardEls[first].dataset.icon;
        const knownMatch = Object.entries(aiMemory).find(
            ([idx, ic]) => Number(idx) !== first && ic === icon && !matchedIndices.has(Number(idx))
        );

        let second;
        if (knownMatch) {
            second = Number(knownMatch[0]);
        } else {
            const remaining = available.filter((i) => i !== first);
            second = remaining[Math.floor(Math.random() * remaining.length)];
        }

        flipCard(second);
    }, 550);
}

function endGame() {
    gameActive = false;

    const opponentName = gameMode === 'pvai' ? 'AI' : 'Player 2';
    let message;

    if (scores[1] > scores[2]) {
        message = 'Player 1 Wins!';
        status.textContent = message;
        status.className = 'win-message';
    } else if (scores[2] > scores[1]) {
        message = `${opponentName} Wins!`;
        status.textContent = message;
        status.className = 'win-message';
    } else {
        message = "It's a Tie!";
        status.textContent = message;
        status.className = 'tie-message';
    }

    overlayMessage.textContent = message;
    overlayScore.textContent =
        `Player 1: ${scores[1]} pairs (${moves[1]} moves)  —  ` +
        `${opponentName}: ${scores[2]} pairs (${moves[2]} moves)`;
    overlay.classList.add('show');
}

function hideOverlay() {
    overlay.classList.remove('show');
}

function resetGame() {
    hideOverlay();
    deck = buildDeck(boardSize);
    matchedIndices = new Set();
    flippedIndices = [];
    lockBoard = false;
    currentPlayer = 1;
    scores = { 1: 0, 2: 0 };
    moves = { 1: 0, 2: 0 };
    gameActive = true;
    aiMemory = {};
    status.className = '';

    renderBoard();
    updateScores();
    updateMoves();
    updateStatus();
}

function setGameMode(mode) {
    gameMode = mode;

    pvpBtn.className = mode === 'pvp' ? 'btn' : 'btn btn-secondary';
    pvaiBtn.className = mode === 'pvai' ? 'btn' : 'btn btn-secondary';
    player2Label.textContent = mode === 'pvai' ? 'AI' : 'Player 2';
    difficultyLabel.classList.toggle('hidden', mode !== 'pvai');

    resetGame();
}

boardSizeSelect.addEventListener('change', () => {
    boardSize = Number(boardSizeSelect.value);
    resetGame();
});

difficultySelect.addEventListener('change', () => {
    difficulty = difficultySelect.value;
    resetGame();
});

resetBtn.addEventListener('click', resetGame);
playAgainBtn.addEventListener('click', resetGame);
pvpBtn.addEventListener('click', () => setGameMode('pvp'));
pvaiBtn.addEventListener('click', () => setGameMode('pvai'));

setGameMode('pvai');