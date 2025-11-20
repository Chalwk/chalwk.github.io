// script.js
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const communicationBoard = document.getElementById('communicationBoard');
    const phraseDisplay = document.getElementById('phraseDisplay');
    const speakBtn = document.getElementById('speakBtn');
    const clearBtn = document.getElementById('clearBtn');
    const editModeBtn = document.getElementById('editModeBtn');
    const saveBtn = document.getElementById('saveBtn');
    const addSymbolBtn = document.getElementById('addSymbolBtn');
    const editModal = document.getElementById('editModal');
    const closeModal = document.querySelector('.close');
    const symbolForm = document.getElementById('symbolForm');
    const deleteBtn = document.getElementById('deleteBtn');

    // App State
    let symbols = [];
    let currentPhrase = [];
    let isEditMode = false;
    let currentEditingSymbol = null;

    // Initialize the app
    function init() {
        loadSymbols();
        renderBoard();
        setupEventListeners();
    }

    // Load symbols from localStorage or use default set
    function loadSymbols() {
        const savedSymbols = localStorage.getItem('communicationSymbols');
        if (savedSymbols) {
            symbols = JSON.parse(savedSymbols);
        } else {
            // Default symbols if none saved
            symbols = [
                { id: 1, text: 'Hello', image: '😊', color: '#4a86e8' },
                { id: 2, text: 'Thank you', image: '🙏', color: '#34a853' },
                { id: 3, text: 'Help', image: '🆘', color: '#ea4335' },
                { id: 4, text: 'Yes', image: '👍', color: '#fbbc04' },
                { id: 5, text: 'No', image: '👎', color: '#fbbc04' },
                { id: 6, text: 'Eat', image: '🍽️', color: '#4a86e8' },
                { id: 7, text: 'Drink', image: '🥤', color: '#4a86e8' },
                { id: 8, text: 'Bathroom', image: '🚽', color: '#34a853' },
                { id: 9, text: 'Play', image: '🎮', color: '#fbbc04' },
                { id: 10, text: 'Home', image: '🏠', color: '#4a86e8' },
                { id: 11, text: 'School', image: '🏫', color: '#4a86e8' },
                { id: 12, text: 'I want', image: '👉', color: '#ea4335' }
            ];
            saveSymbols();
        }
    }

    // Save symbols to localStorage
    function saveSymbols() {
        localStorage.setItem('communicationSymbols', JSON.stringify(symbols));
    }

    // Render the communication board
    function renderBoard() {
        communicationBoard.innerHTML = '';

        symbols.forEach(symbol => {
            const symbolElement = document.createElement('div');
            symbolElement.className = 'symbol';
            symbolElement.style.backgroundColor = symbol.color;

            if (isEditMode) {
                symbolElement.classList.add('editing');
            }

            symbolElement.innerHTML = `
                ${symbol.image.startsWith('http') ?
                    `<img src="${symbol.image}" alt="${symbol.text}">` :
                    `<span style="font-size: 2rem;">${symbol.image}</span>`
                }
                <span>${symbol.text}</span>
            `;

            symbolElement.addEventListener('click', () => {
                if (isEditMode) {
                    openEditModal(symbol);
                } else {
                    addToPhrase(symbol);
                }
            });

            communicationBoard.appendChild(symbolElement);
        });
    }

    // Add symbol to current phrase
    function addToPhrase(symbol) {
        currentPhrase.push(symbol);
        updatePhraseDisplay();
    }

    // Update the phrase display area
    function updatePhraseDisplay() {
        phraseDisplay.innerHTML = '';

        if (currentPhrase.length === 0) {
            phraseDisplay.innerHTML = '<span class="empty-message">Select symbols to build your phrase</span>';
            return;
        }

        currentPhrase.forEach((symbol, index) => {
            const phraseItem = document.createElement('div');
            phraseItem.className = 'phrase-item';
            phraseItem.style.backgroundColor = symbol.color;

            phraseItem.innerHTML = `
                ${symbol.image.startsWith('http') ?
                    `<img src="${symbol.image}" alt="${symbol.text}">` :
                    `<span style="font-size: 1.2rem; margin-right: 5px;">${symbol.image}</span>`
                }
                <span>${symbol.text}</span>
            `;

            // Add click to remove functionality
            phraseItem.addEventListener('click', () => {
                currentPhrase.splice(index, 1);
                updatePhraseDisplay();
            });

            phraseDisplay.appendChild(phraseItem);
        });
    }

    // Speak the current phrase
    function speakPhrase() {
        if (currentPhrase.length === 0) return;

        const phraseText = currentPhrase.map(symbol => symbol.text).join(' ');

        // Use the Web Speech API if available
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(phraseText);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            speechSynthesis.speak(utterance);
        } else {
            alert(`Speech: ${phraseText}`);
        }
    }

    // Clear the current phrase
    function clearPhrase() {
        currentPhrase = [];
        updatePhraseDisplay();
    }

    // Toggle edit mode
    function toggleEditMode() {
        isEditMode = !isEditMode;
        editModeBtn.textContent = isEditMode ? 'Exit Edit Mode' : 'Edit Mode';
        editModeBtn.classList.toggle('btn-danger', isEditMode);
        renderBoard();
    }

    // Open the edit modal for a symbol
    function openEditModal(symbol) {
        currentEditingSymbol = symbol;
        document.getElementById('symbolText').value = symbol.text;
        document.getElementById('symbolImage').value = symbol.image.startsWith('http') ? symbol.image : '';
        document.getElementById('symbolColor').value = symbol.color;

        // Show delete button only for existing symbols (not for new ones)
        deleteBtn.style.display = symbol.id ? 'block' : 'none';

        editModal.style.display = 'flex';
    }

    // Close the edit modal
    function closeEditModal() {
        editModal.style.display = 'none';
        currentEditingSymbol = null;
        symbolForm.reset();
    }

    // Save symbol changes from the modal
    function saveSymbolChanges(event) {
        event.preventDefault();

        const text = document.getElementById('symbolText').value.trim();
        let image = document.getElementById('symbolImage').value.trim();
        const color = document.getElementById('symbolColor').value;

        if (!text) {
            alert('Please enter text for the symbol');
            return;
        }

        // If no image URL provided, use the first character as emoji placeholder
        if (!image) {
            image = text.charAt(0);
        }

        if (currentEditingSymbol && currentEditingSymbol.id) {
            // Update existing symbol
            const index = symbols.findIndex(s => s.id === currentEditingSymbol.id);
            if (index !== -1) {
                symbols[index] = {
                    ...symbols[index],
                    text,
                    image,
                    color
                };
            }
        } else {
            // Add new symbol
            const newId = symbols.length > 0 ? Math.max(...symbols.map(s => s.id)) + 1 : 1;
            symbols.push({
                id: newId,
                text,
                image,
                color
            });
        }

        saveSymbols();
        renderBoard();
        closeEditModal();
    }

    // Delete the current symbol
    function deleteSymbol() {
        if (!currentEditingSymbol || !currentEditingSymbol.id) return;

        if (confirm('Are you sure you want to delete this symbol?')) {
            symbols = symbols.filter(s => s.id !== currentEditingSymbol.id);
            saveSymbols();
            renderBoard();
            closeEditModal();
        }
    }

    // Add a new symbol
    function addNewSymbol() {
        openEditModal({});
    }

    // Set up event listeners
    function setupEventListeners() {
        speakBtn.addEventListener('click', speakPhrase);
        clearBtn.addEventListener('click', clearPhrase);
        editModeBtn.addEventListener('click', toggleEditMode);
        saveBtn.addEventListener('click', saveSymbols);
        addSymbolBtn.addEventListener('click', addNewSymbol);
        closeModal.addEventListener('click', closeEditModal);
        symbolForm.addEventListener('submit', saveSymbolChanges);
        deleteBtn.addEventListener('click', deleteSymbol);

        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === editModal) {
                closeEditModal();
            }
        });
    }

    // Initialize the application
    init();
});