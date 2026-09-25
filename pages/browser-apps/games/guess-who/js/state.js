// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// Game state
let CHARACTERS = [];
let currentSheet = 'faces1.png';
let playerSecretIndex = -1;
let aiSecretIndex = -1;
let guessesLeft = 1;
let questionCount = 0;
let gameOver = false;
let autoFlip = false;
let pendingGuessIdx = -1;
let soundOn = true;
let guessedIndices = new Set();

// AI State
let aiCandidates = [];
let aiUsedQuestions = new Set();
let currentAiQuestionId = null;
let gamePhase = 'setup'; // 'setup', 'player-turn', 'ai-turn', 'game-over'
let aiTurnQueued = false;