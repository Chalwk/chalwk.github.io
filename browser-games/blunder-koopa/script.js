const board = document.getElementById("board");
const keyboard = document.getElementById("keyboard");

const WORDS = ["shell", "spike", "flame", "roast", "koopa", "bowse", "roar"];
const answer = WORDS[Math.floor(Math.random() * WORDS.length)];

let currentRow = 0;
let currentCol = 0;
let guessedWord = "";

function createBoard() {
    for (let i = 0; i < 30; i++) {
        const tile = document.createElement("div");
        tile.classList.add("tile");
        tile.id = "tile-" + i;
        board.appendChild(tile);
    }
}

function createKeyboard() {
    const keys = [
        "q","w","e","r","t","y","u","i","o","p",
        "a","s","d","f","g","h","j","k","l",
        "enter","z","x","c","v","b","n","m","del"
    ];

    keys.forEach(k => {
        const key = document.createElement("div");
        key.textContent = k;
        key.classList.add("key");

        key.addEventListener("click", () => handleKey(k));

        keyboard.appendChild(key);
    });
}

function handleKey(key) {
    if (key === "enter") {
        submitGuess();
        return;
    }
    if (key === "del") {
        deleteLetter();
        return;
    }
    addLetter(key);
}

function addLetter(letter) {
    if (currentCol >= 5) return;
    const tile = document.getElementById("tile-" + (currentRow * 5 + currentCol));
    tile.textContent = letter;
    guessedWord += letter;
    currentCol++;
}

function deleteLetter() {
    if (currentCol === 0) return;
    currentCol--;
    const tile = document.getElementById("tile-" + (currentRow * 5 + currentCol));
    tile.textContent = "";
    guessedWord = guessedWord.slice(0, -1);
}

function submitGuess() {
    if (guessedWord.length !== 5) return;

    for (let i = 0; i < 5; i++) {
        const tile = document.getElementById("tile-" + (currentRow * 5 + i));
        const letter = guessedWord[i];

        if (answer[i] === letter) {
            tile.classList.add("correct");
        } else if (answer.includes(letter)) {
            tile.classList.add("present");
        } else {
            tile.classList.add("wrong");
        }
    }

    if (guessedWord === answer) {
        setTimeout(() => alert("Victory for the Koopa King"), 100);
    }

    currentRow++;
    currentCol = 0;
    guessedWord = "";
}

document.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if (key >= "a" && key <= "z") {
        handleKey(key);
    }
    else if (key === "enter") {
        handleKey("enter");
    }
    else if (key === "backspace" || key === "delete") {
        handleKey("del");
    }
});

createBoard();
createKeyboard();