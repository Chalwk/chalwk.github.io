// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// Game state
let CHARACTERS = [];
let currentSheet = 'faces1.png';
let boardIndex = -1;
let playerSecretIndex = -1;
let aiSecretIndex = -1;
let guessesLeft = 1;
let initialGuesses = 1;
let questionCount = 0;
let gameOver = false;
let autoFlip = false;
let pendingGuessIdx = -1;
let soundOn = true;
let guessedIndices = new Set();

// Player board state
let playerEliminated = new Set();
let playerUsedQuestions = new Set();

// AI State
let aiCandidates = [];
let aiUsedQuestions = new Set();
let currentAiQuestionId = null;
let aiProfile = AI_PROFILES.medium;

// Turn / phase
let gamePhase = 'setup';
let aiTurnQueued = false;

// Undo
let flipHistory = [];
let undoCount = 0;

// Stats
let stats = { wins: 0, losses: 0, streak: 0, bestStreak: 0, games: 0, bestQuestionCount: null };