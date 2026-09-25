// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

// Game state
let CHARACTERS = [];
let currentSheet = 'faces1.png';
let boardIndex = -1;
let playerSecretIndex = -1;
let aiSecretIndex = -1;
let p2SecretIndex = -1;
let guessesLeft = 1;
let initialGuesses = 1;
let questionCount = 0;
let gameOver = false;
let autoFlip = false;
let pendingGuessIdx = -1;
let soundOn = true;
let guessedIndices = new Set();
let bluffAllowed = false;

// AI State
let aiCandidates = [];
let aiUsedQuestions = new Set();
let currentAiQuestionId = null;
let aiProfile = AI_PROFILES.medium;
let aiLieDetected = false;

// Turn / phase
let gamePhase = 'setup';
let aiTurnQueued = false;
let gameMode = 'ai'; // 'ai' | 'hotseat'
let currentPlayer = 1;

// Hot-seat per-player state
let p1GuessesLeft = 1;
let p2GuessesLeft = 1;
let p1Eliminated = new Set();
let p2Eliminated = new Set();
let p1UsedQuestions = new Set();
let p2UsedQuestions = new Set();
let p1Guessed = new Set();
let p2Guessed = new Set();
let pendingHotseatQuestion = null;

// Undo
let flipHistory = [];
let undoCount = 0;

// Stats
let stats = { wins: 0, losses: 0, streak: 0, bestStreak: 0, games: 0, bestQuestionCount: null };