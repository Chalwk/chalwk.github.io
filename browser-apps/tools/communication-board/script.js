document.addEventListener('DOMContentLoaded', () => {
    // DOM
    const communicationBoard = document.getElementById('communicationBoard');
    const phraseDisplay = document.getElementById('phraseDisplay');
    const speakBtn = document.getElementById('speakBtn');
    const clearBtn = document.getElementById('clearBtn');
    const editModeBtn = document.getElementById('editModeBtn');
    const saveBtn = document.getElementById('saveBtn');
    const addSymbolBtn = document.getElementById('addSymbolBtn');
    const editModal = document.getElementById('editModal');
    const closeModalBtn = document.getElementById('closeModal');
    const symbolForm = document.getElementById('symbolForm');
    const deleteBtn = document.getElementById('deleteBtn');
    const cancelEditBtn = document.getElementById('cancelEdit');
    const symbolImageFile = document.getElementById('symbolImageFile');
    const symbolImageInput = document.getElementById('symbolImage');
    const symbolTextInput = document.getElementById('symbolText');
    const symbolColorInput = document.getElementById('symbolColor');
    const symbolCategoryInput = document.getElementById('symbolCategory');
    const categorySelect = document.getElementById('categorySelect');
    const voiceSelect = document.getElementById('voiceSelect');
    const undoBtn = document.getElementById('undoBtn');
    const exportBtn = document.getElementById('exportBtn');
    const importFile = document.getElementById('importFile');
    const toast = document.getElementById('toast');
    const boardWrap = document.getElementById('boardWrap');
    const installBtn = document.getElementById('installBtn');

    // State
    let symbols = [];
    let currentPhrase = [];
    let phraseHistory = [];
    let isEditMode = false;
    let currentEditingSymbol = null;
    let settings = { filterCategory: 'All' };
    let longPressTimer = null;
    const LONG_PRESS_DURATION = 500; // milliseconds

    // PWA State
    let deferredPrompt;
    let isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    let isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone ||
    document.referrer.includes('android-app://');

    // LocalStorage helpers
    const LS = {
        symbolsKey: 'cb.symbols',
        settingsKey: 'cb.settings',
        voiceKey: 'cb.voice'
    };

    function saveSymbols() {
        localStorage.setItem(LS.symbolsKey, JSON.stringify(symbols));
        showToast('Symbols saved');
    }
    function loadSymbols() {
        const raw = localStorage.getItem(LS.symbolsKey);
        if (raw) {
            try { symbols = JSON.parse(raw); }
            catch { symbols = defaultSymbols(); saveSymbols(); }
        } else {
            symbols = defaultSymbols();
            saveSymbols();
        }
    }
    function saveSettings() {
        localStorage.setItem(LS.settingsKey, JSON.stringify(settings));
    }
    function loadSettings() {
        const raw = localStorage.getItem(LS.settingsKey);
        if (raw) {
            try { settings = Object.assign(settings, JSON.parse(raw)); }
            catch {}
        }
    }

    // Default set
    function defaultSymbols() {
        return [
            /* Basic Communication */
            { id: 1, text: 'Hello', image: '😊', color: '#4a86e8', category: 'Basic Communication' },
            { id: 2, text: 'Goodbye', image: '👋', color: '#4a86e8', category: 'Basic Communication' },
            { id: 3, text: 'Yes', image: '👍', color: '#4a86e8', category: 'Basic Communication' },
            { id: 4, text: 'No', image: '👎', color: '#4a86e8', category: 'Basic Communication' },
            { id: 5, text: 'Please', image: '✨', color: '#4a86e8', category: 'Basic Communication' },
            { id: 6, text: 'Thank you', image: '🙏', color: '#4a86e8', category: 'Basic Communication' },
            { id: 7, text: 'Sorry', image: '🙇', color: '#4a86e8', category: 'Basic Communication' },
            { id: 42, text: 'Okay', image: '👌', color: '#4a86e8', category: 'Basic Communication' },
            { id: 43, text: 'Excuse me', image: '🗣️', color: '#4a86e8', category: 'Basic Communication' },

            /* Needs & Wants */
            { id: 8, text: 'Help', image: '🆘', color: '#ea4335', category: 'Needs & Wants' },
            { id: 9, text: 'I want', image: '👉', color: '#ea4335', category: 'Needs & Wants' },
            { id: 10, text: 'I need', image: '👐', color: '#ea4335', category: 'Needs & Wants' },
            { id: 11, text: 'Stop', image: '✋', color: '#ea4335', category: 'Needs & Wants' },
            { id: 12, text: 'More', image: '➕', color: '#ea4335', category: 'Needs & Wants' },
            { id: 13, text: 'Finished', image: '✔️', color: '#ea4335', category: 'Needs & Wants' },
            { id: 14, text: 'Pain', image: '🤕', color: '#ea4335', category: 'Needs & Wants' },
            { id: 15, text: 'Tired', image: '😴', color: '#ea4335', category: 'Needs & Wants' },
            { id: 44, text: 'Break', image: '⏸️', color: '#ea4335', category: 'Needs & Wants' },
            { id: 45, text: 'I don\'t want', image: '🙅', color: '#ea4335', category: 'Needs & Wants' },
            { id: 46, text: 'I don\'t know', image: '🤷', color: '#ea4335', category: 'Needs & Wants' },

            /* Feelings & Emotions */
            { id: 36, text: 'Happy', image: '😄', color: '#fbbc04', category: 'Feelings & Emotions' },
            { id: 37, text: 'Sad', image: '😢', color: '#fbbc04', category: 'Feelings & Emotions' },
            { id: 38, text: 'Angry', image: '😡', color: '#fbbc04', category: 'Feelings & Emotions' },
            { id: 39, text: 'Scared', image: '😨', color: '#fbbc04', category: 'Feelings & Emotions' },
            { id: 40, text: 'Excited', image: '🤩', color: '#fbbc04', category: 'Feelings & Emotions' },
            { id: 41, text: 'Calm', image: '😌', color: '#fbbc04', category: 'Feelings & Emotions' },
            { id: 47, text: 'Sick', image: '🤢', color: '#fbbc04', category: 'Feelings & Emotions' },
            { id: 48, text: 'Surprised', image: '😲', color: '#fbbc04', category: 'Feelings & Emotions' },
            { id: 49, text: 'Lonely', image: '🥺', color: '#fbbc04', category: 'Feelings & Emotions' },

            /* People & Pronouns */
            { id: 31, text: 'Me', image: '🙂', color: '#00bcd4', category: 'People & Pronouns' },
            { id: 32, text: 'You', image: '🫵', color: '#00bcd4', category: 'People & Pronouns' },
            { id: 33, text: 'Friend', image: '🧑‍🤝‍🧑', color: '#00bcd4', category: 'People & Pronouns' },
            { id: 34, text: 'Family', image: '👨‍👩‍👦', color: '#00bcd4', category: 'People & Pronouns' },
            { id: 35, text: 'Teacher', image: '👩‍🏫', color: '#00bcd4', category: 'People & Pronouns' },
            { id: 50, text: 'Mum', image: '👩', color: '#00bcd4', category: 'People & Pronouns' },
            { id: 51, text: 'Dad', image: '👨', color: '#00bcd4', category: 'People & Pronouns' },
            { id: 52, text: 'Doctor', image: '👨‍⚕️', color: '#00bcd4', category: 'People & Pronouns' },

            /* Common Actions */
            { id: 16, text: 'Eat', image: '🍽️', color: '#9c27b0', category: 'Common Actions' },
            { id: 17, text: 'Drink', image: '🥤', color: '#9c27b0', category: 'Common Actions' },
            { id: 18, text: 'Play', image: '🎮', color: '#9c27b0', category: 'Common Actions' },
            { id: 19, text: 'Go', image: '🏃', color: '#9c27b0', category: 'Common Actions' },
            { id: 20, text: 'Come', image: '👣', color: '#9c27b0', category: 'Common Actions' },
            { id: 21, text: 'Look', image: '👀', color: '#9c27b0', category: 'Common Actions' },
            { id: 22, text: 'Listen', image: '👂', color: '#9c27b0', category: 'Common Actions' },
            { id: 23, text: 'Wait', image: '⏳', color: '#9c27b0', category: 'Common Actions' },
            { id: 24, text: 'Talk', image: '💬', color: '#9c27b0', category: 'Common Actions' },
            { id: 53, text: 'Sleep', image: '🛌', color: '#9c27b0', category: 'Common Actions' },
            { id: 54, text: 'Read', image: '📖', color: '#9c27b0', category: 'Common Actions' },
            { id: 55, text: 'Write', image: '✍️', color: '#9c27b0', category: 'Common Actions' },
            { id: 56, text: 'Watch', image: '📺', color: '#9c27b0', category: 'Common Actions' },

            /* Places */
            { id: 25, text: 'Home', image: '🏠', color: '#34a853', category: 'Places' },
            { id: 26, text: 'School', image: '🏫', color: '#34a853', category: 'Places' },
            { id: 27, text: 'Bathroom', image: '🚽', color: '#34a853', category: 'Places' },
            { id: 28, text: 'Outside', image: '🌳', color: '#34a853', category: 'Places' },
            { id: 29, text: 'Shop', image: '🛒', color: '#34a853', category: 'Places' },
            { id: 30, text: 'Car', image: '🚗', color: '#34a853', category: 'Places' },
            { id: 57, text: 'Park', image: '🌲', color: '#34a853', category: 'Places' },
            { id: 58, text: 'Work', image: '💼', color: '#34a853', category: 'Places' },

            /* Questions */
            { id: 59, text: 'What?', image: '❓', color: '#9b59b6', category: 'Questions' },
            { id: 60, text: 'Where?', image: '🗺️', color: '#9b59b6', category: 'Questions' },
            { id: 61, text: 'When?', image: '🕒', color: '#9b59b6', category: 'Questions' },
            { id: 62, text: 'Why?', image: '🤔', color: '#9b59b6', category: 'Questions' },
            { id: 63, text: 'How?', image: '🛠️', color: '#9b59b6', category: 'Questions' },
            { id: 64, text: 'Who?', image: '👤', color: '#9b59b6', category: 'Questions' },

            /* Time & Schedule */
            { id: 65, text: 'Now', image: '⏰', color: '#ff9800', category: 'Time & Schedule' },
            { id: 66, text: 'Later', image: '⏲️', color: '#ff9800', category: 'Time & Schedule' },
            { id: 67, text: 'Today', image: '📅', color: '#ff9800', category: 'Time & Schedule' },
            { id: 68, text: 'Tomorrow', image: '➡️', color: '#ff9800', category: 'Time & Schedule' },
            { id: 69, text: 'Yesterday', image: '⬅️', color: '#ff9800', category: 'Time & Schedule' },

            /* Food & Drink */
            { id: 70, text: 'Water', image: '💧', color: '#e74c3c', category: 'Food & Drink' },
            { id: 71, text: 'Juice', image: '🧃', color: '#e74c3c', category: 'Food & Drink' },
            { id: 72, text: 'Snack', image: '🍎', color: '#e74c3c', category: 'Food & Drink' },
            { id: 73, text: 'Lunch', image: '🥪', color: '#e74c3c', category: 'Food & Drink' },
            { id: 74, text: 'Dinner', image: '🍽️', color: '#e74c3c', category: 'Food & Drink' },

            /* Activities & Play */
            { id: 75, text: 'Game', image: '🎲', color: '#2ecc71', category: 'Activities & Play' },
            { id: 76, text: 'Music', image: '🎵', color: '#2ecc71', category: 'Activities & Play' },
            { id: 77, text: 'Draw', image: '🎨', color: '#2ecc71', category: 'Activities & Play' },
            { id: 78, text: 'Walk', image: '🚶', color: '#2ecc71', category: 'Activities & Play' }
        ];
    }

    // Helpers
    function handleSymbolLongPress(symbol) {
        if (!symbol) return;

        // Speak the individual symbol
        const phraseText = symbol.text;
        if ('speechSynthesis' in window) {
            const utter = new SpeechSynthesisUtterance(phraseText);
            utter.rate = 0.95;
            // set voice
            const chosen = localStorage.getItem(LS.voiceKey);
            if (chosen) {
                const v = speechSynthesis.getVoices().find(x => x.name === chosen);
                if (v) utter.voice = v;
            }
            speechSynthesis.speak(utter);
        } else {
            alert(phraseText);
        }
    }

    function showToast(msg, timeout = 2200) {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = msg;
        toast.style.opacity = 1;
        setTimeout(() => { toast.style.opacity = 0; }, timeout);
    }

    function isUrl(str) {
        if (!str) return false;
        if (str.startsWith('data:')) return true;
        try {
            const u = new URL(str);
            return u.protocol === 'http:' || u.protocol === 'https:';
        } catch {
            return false;
        }
    }

    function isImageSource(str) {
        if (!str) return false;
        if (isUrl(str)) return true;
        if (str.startsWith('data:image/')) return true;
        // single-character emoji fallback considered non-url but usable
        return false;
    }

    // PWA Functions
    function showInstallPrompt() {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                    showToast('App installed successfully!');
                } else {
                    console.log('User dismissed the install prompt');
                }
                deferredPrompt = null;
                updateInstallButton();
            });
        } else if (isIOS) {
            showToast('Tap the share button and "Add to Home Screen" to install');
        }
    }

    function updateInstallButton() {
        if (!installBtn) return;

        // Don't show install button if already in standalone mode
        if (isStandalone) {
            installBtn.style.display = 'none';
            return;
        }

        // Show install button if we have a deferred prompt or on iOS
        if (deferredPrompt || isIOS) {
            installBtn.style.display = 'block';
        } else {
            installBtn.style.display = 'none';
        }
    }

    // Rendering
    function renderBoard() {
        communicationBoard.innerHTML = '';
        const filtered = symbols.filter(s => settings.filterCategory === 'All' || s.category === settings.filterCategory);
        filtered.forEach(symbol => {
            const node = document.createElement('div');
            node.className = 'symbol';
            node.setAttribute('role', 'listitem');
            node.setAttribute('tabindex', '0');
            node.style.backgroundColor = symbol.color || '#e8f0fe';
            if (isEditMode) node.classList.add('editing');

            // image or emoji
            if (isImageSource(symbol.image)) {
                node.innerHTML = `<img src="${symbol.image}" alt="${symbol.text}"><span>${symbol.text}</span>`;
            } else {
                node.innerHTML = `<span style="font-size:2rem">${symbol.image}</span><span>${symbol.text}</span>`;
            }

            // click behavior
            node.addEventListener('click', () => {
                if (isEditMode) openEditModal(symbol);
                else addToPhrase(symbol);
            });

            // ADD LONG-PRESS SUPPORT HERE
            // Touch events for mobile
            node.addEventListener('touchstart', (ev) => {
                if (isEditMode) return; // Don't long-press in edit mode
                longPressTimer = setTimeout(() => {
                    handleSymbolLongPress(symbol);
                    longPressTimer = null;
                }, LONG_PRESS_DURATION);
                ev.preventDefault();
            });

            node.addEventListener('touchend', (ev) => {
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
                ev.preventDefault();
            });

            node.addEventListener('touchmove', (ev) => {
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
                ev.preventDefault();
            });

            // Mouse events for desktop
            node.addEventListener('mousedown', (ev) => {
                if (isEditMode) return; // Don't long-press in edit mode
                longPressTimer = setTimeout(() => {
                    handleSymbolLongPress(symbol);
                    longPressTimer = null;
                }, LONG_PRESS_DURATION);
            });

            node.addEventListener('mouseup', (ev) => {
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
            });

            node.addEventListener('mouseleave', (ev) => {
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
            });

            // keyboard support (existing code)
            node.addEventListener('keydown', (ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    if (isEditMode) openEditModal(symbol);
                    else addToPhrase(symbol);
                }
                if (ev.key === 'e') {
                    // quick edit when in edit mode
                    if (isEditMode) openEditModal(symbol);
                }
                // ADD: Quick speak with 's' key
                if (ev.key === 's' && !isEditMode) {
                    ev.preventDefault();
                    handleSymbolLongPress(symbol);
                }
            });

            communicationBoard.appendChild(node);
        });

        renderCategorySelect();
    }

    function setupPhraseItemSpeak() {
        document.querySelectorAll('.phrase-item').forEach(item => {
            // Remove existing event listeners to avoid duplicates
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);

            // Add long-press to phrase items as well
            const symbolIndex = parseInt(newItem.dataset.index);
            const symbol = currentPhrase[symbolIndex];

            if (!symbol) return;

            // Touch events for phrase items
            newItem.addEventListener('touchstart', (ev) => {
                longPressTimer = setTimeout(() => {
                    handleSymbolLongPress(symbol);
                    longPressTimer = null;
                }, LONG_PRESS_DURATION);
                ev.preventDefault();
            });

            newItem.addEventListener('touchend', (ev) => {
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
                ev.preventDefault();
            });

            newItem.addEventListener('touchmove', (ev) => {
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
                ev.preventDefault();
            });

            // Mouse events for phrase items
            newItem.addEventListener('mousedown', (ev) => {
                longPressTimer = setTimeout(() => {
                    handleSymbolLongPress(symbol);
                    longPressTimer = null;
                }, LONG_PRESS_DURATION);
            });

            newItem.addEventListener('mouseup', (ev) => {
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
            });

            newItem.addEventListener('mouseleave', (ev) => {
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
            });
        });
    }

    function renderCategorySelect() {
        const cats = Array.from(new Set(['All', ...symbols.map(s => s.category || 'Basic')]));
        categorySelect.innerHTML = '<option value="All">All Categories</option>';
        cats.forEach(cat => {
            const option = document.createElement('option');

            option.style.color = symbols.find(s => s.category === cat)?.color || '#4a86e8';

            option.value = cat;
            option.textContent = cat;
            if (settings.filterCategory === cat) option.selected = true;
            categorySelect.appendChild(option);
        });
    }

    function updatePhraseDisplay() {
        phraseDisplay.innerHTML = '';
        if (currentPhrase.length === 0) {
            const el = document.createElement('span');
            el.className = 'empty-message';
            el.textContent = 'Select symbols to build your phrase';
            phraseDisplay.appendChild(el);
            return;
        }

        currentPhrase.forEach((symbol, index) => {
            const item = document.createElement('div');
            item.className = 'phrase-item';
            item.setAttribute('draggable', 'true');
            item.setAttribute('role', 'listitem');
            item.dataset.index = index;
            item.title = 'Click to remove. Drag to reorder. Press and hold to speak.';

            if (isImageSource(symbol.image)) {
                item.innerHTML = `<img src="${symbol.image}" alt="${symbol.text}"><span>${symbol.text}</span>`;
            } else {
                item.innerHTML = `<span style="font-size:1.2rem; margin-right:6px;">${symbol.image}</span><span>${symbol.text}</span>`;
            }

            // click to remove (backed up for undo)
            item.addEventListener('click', () => {
                backupPhrase();
                currentPhrase.splice(index, 1);
                updatePhraseDisplay();
            });

            // drag handlers
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', index.toString());
                e.dataTransfer.effectAllowed = 'move';
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
                const to = index;
                if (!Number.isFinite(from)) return;
                if (from === to) return;
                backupPhrase();
                const [moved] = currentPhrase.splice(from, 1);
                currentPhrase.splice(to, 0, moved);
                updatePhraseDisplay();
            });

            phraseDisplay.appendChild(item);
        });

        // Setup long-press for phrase items
        setupPhraseItemSpeak();
    }

    // Phrase operations
    function backupPhrase() {
        phraseHistory.push(JSON.stringify(currentPhrase));
        // limit history
        if (phraseHistory.length > 30) phraseHistory.shift();
    }

    function undo() {
        if (phraseHistory.length === 0) {
            showToast('Nothing to undo');
            return;
        }
        const raw = phraseHistory.pop();
        try {
            currentPhrase = JSON.parse(raw);
            updatePhraseDisplay();
            showToast('Undo');
        } catch {
            showToast('Undo failed');
        }
    }

    function addToPhrase(symbol) {
        if (!symbol) return;
        backupPhrase();
        currentPhrase.push(symbol);
        updatePhraseDisplay();
    }

    function clearPhrase() {
        if (currentPhrase.length === 0) return;
        backupPhrase();
        currentPhrase = [];
        updatePhraseDisplay();
    }

    // Speech
    function speakPhrase() {
        if (currentPhrase.length === 0) return;
        const phraseText = currentPhrase.map(s => s.text).join(' ');
        if ('speechSynthesis' in window) {
            const utter = new SpeechSynthesisUtterance(phraseText);
            utter.rate = 0.95;
            // set voice
            const chosen = localStorage.getItem(LS.voiceKey);
            if (chosen) {
                const v = speechSynthesis.getVoices().find(x => x.name === chosen);
                if (v) utter.voice = v;
            }
            speechSynthesis.speak(utter);
        } else {
            alert(phraseText);
        }
    }

    // Edit modal
    function openEditModal(symbol = null) {
        isEditMode = true;
        document.body.classList.add('edit-mode');
        if (symbol && symbol.id) {
            currentEditingSymbol = symbol;
            symbolTextInput.value = symbol.text || '';
            symbolImageInput.value = isUrl(symbol.image) ? symbol.image : (symbol.image || '');
            symbolColorInput.value = symbol.color || '#4a86e8';
            symbolCategoryInput.value = symbol.category || 'Basic';
            deleteBtn.style.display = 'inline-block';
        } else {
            currentEditingSymbol = null;
            symbolForm.reset();
            deleteBtn.style.display = 'none';
        }
        editModal.setAttribute('aria-hidden', 'false');
    }

    function closeEditModal() {
        editModal.setAttribute('aria-hidden', 'true');
        currentEditingSymbol = null;
        symbolForm.reset();
    }

    // Save symbol from modal
    async function saveSymbolChanges(e) {
        e.preventDefault();
        const text = symbolTextInput.value.trim();
        let image = symbolImageInput.value.trim();
        const color = symbolColorInput.value;
        const category = symbolCategoryInput.value || 'Basic';

        if (!text) { alert('Please enter text'); return; }

        // if file selected, convert to data URL
        if (symbolImageFile.files && symbolImageFile.files[0]) {
            image = await fileToDataURL(symbolImageFile.files[0]);
        }

        // fallback: single character if no image
        if (!image) image = text.charAt(0) || '?';

        if (currentEditingSymbol && currentEditingSymbol.id) {
            const idx = symbols.findIndex(s => s.id === currentEditingSymbol.id);
            if (idx !== -1) {
                symbols[idx] = Object.assign({}, symbols[idx], { text, image, color, category });
            }
        } else {
            const newId = symbols.length > 0 ? Math.max(...symbols.map(s => s.id)) + 1 : 1;
            symbols.push({ id: newId, text, image, color, category });
        }
        saveSymbols();
        renderBoard();
        closeEditModal();
    }

    function deleteSymbol() {
        if (!currentEditingSymbol || !currentEditingSymbol.id) return;
        if (!confirm('Delete this symbol?')) return;
        symbols = symbols.filter(s => s.id !== currentEditingSymbol.id);
        saveSymbols();
        renderBoard();
        closeEditModal();
    }

    function addNewSymbol() {
        openEditModal(null);
    }

    // File helpers
    function fileToDataURL(file) {
        return new Promise((res, rej) => {
            const r = new FileReader();
            r.onload = () => res(r.result);
            r.onerror = () => rej(new Error('File read error'));
            r.readAsDataURL(file);
        });
    }

    // Import / Export
    function exportJSON() {
        const payload = { symbols, settings };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'communication-board-export.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    function importJSONFile(evt) {
        const file = evt.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(reader.result);
                if (parsed.symbols && Array.isArray(parsed.symbols)) {
                    // merge with safe id assignment
                    const existingIds = new Set(symbols.map(s => s.id));
                    let nextId = symbols.length > 0 ? Math.max(...symbols.map(s => s.id)) + 1 : 1;
                    parsed.symbols.forEach(s => {
                        const copy = Object.assign({}, s);
                        if (!copy.id || existingIds.has(copy.id)) {
                            copy.id = nextId++;
                        }
                        symbols.push(copy);
                    });
                    saveSymbols();
                    renderBoard();
                    showToast('Imported symbols');
                }
                if (parsed.settings) {
                    settings = Object.assign({}, settings, parsed.settings);
                    saveSettings();
                }
            } catch (err) {
                alert('Import failed: invalid file');
            }
        };
        reader.readAsText(file);
        // clear the input so same file can be imported again if needed
        evt.target.value = '';
    }

    // Voices
    function populateVoices() {
        const voices = speechSynthesis.getVoices();
        voiceSelect.innerHTML = '';
        const stored = localStorage.getItem(LS.voiceKey);
        voices.forEach(v => {
            const o = document.createElement('option');
            o.value = v.name;
            o.textContent = `${v.name} ${v.lang ? '(' + v.lang + ')' : ''}`;
            if (stored && stored === v.name) o.selected = true;
            voiceSelect.appendChild(o);
        });
    }

    // Undo handler
    undoBtn.addEventListener('click', undo);

    // Toggle edit mode
    function toggleEditMode() {
        isEditMode = !isEditMode;
        document.body.classList.toggle('edit-mode', isEditMode);
        editModeBtn.textContent = isEditMode ? 'Exit Edit Mode' : 'Edit Mode';
        renderBoard();
    }

    // Event listeners
    speakBtn.addEventListener('click', speakPhrase);
    clearBtn.addEventListener('click', clearPhrase);
    editModeBtn.addEventListener('click', toggleEditMode);
    saveBtn.addEventListener('click', saveSymbols);
    addSymbolBtn.addEventListener('click', addNewSymbol);
    closeModalBtn.addEventListener('click', closeEditModal);
    symbolForm.addEventListener('submit', saveSymbolChanges);
    deleteBtn.addEventListener('click', deleteSymbol);
    cancelEditBtn.addEventListener('click', closeEditModal);
    exportBtn.addEventListener('click', exportJSON);
    importFile.addEventListener('change', importJSONFile);

    // PWA Event Listeners
    if (installBtn) {
        installBtn.addEventListener('click', showInstallPrompt);
    }

    // Category select event listener
    categorySelect.addEventListener('change', () => {
        settings.filterCategory = categorySelect.value;
        saveSettings();
        renderBoard();
    });

    // file input preview - clear previously selected
    symbolImageFile.addEventListener('change', () => {
        // file will be processed when saving
    });

    // voice select save
    voiceSelect.addEventListener('change', () => {
        localStorage.setItem(LS.voiceKey, voiceSelect.value);
    });

    // keyboard quick actions
    boardWrap.addEventListener('keydown', (ev) => {
        if (ev.key === 'e') toggleEditMode();
        if (ev.key === 'z' && (ev.ctrlKey || ev.metaKey)) undo();
    });

    // PWA Events
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        updateInstallButton();
        console.log('Before install prompt event fired');
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        isStandalone = true;
        updateInstallButton();
        console.log('App was installed');
        showToast('App installed successfully!');
    });

    // initial load
    function init() {
        loadSettings();
        loadSymbols();
        renderBoard();
        updatePhraseDisplay();

        // Check if app is already in standalone mode
        if (isStandalone) {
            console.log('App is running in standalone mode');
        }

        updateInstallButton();

        // voices may load after first call
        populateVoices();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = populateVoices;
        }
    }

    init(); // This stays at the very end
});