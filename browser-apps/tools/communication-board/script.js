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
    const globalSearch = document.getElementById('globalSearch');

    // Categories Management DOM
    const manageCategoriesBtn = document.getElementById('manageCategoriesBtn');
    const categoriesModal = document.getElementById('categoriesModal');
    const closeCategoriesModal = document.getElementById('closeCategoriesModal');
    const closeCategoriesBtn = document.getElementById('closeCategoriesBtn');
    const categoriesList = document.getElementById('categoriesList');
    const newCategoryName = document.getElementById('newCategoryName');
    const addCategoryBtn = document.getElementById('addCategoryBtn');

    // Settings dropdown elements
    const settingsToggle = document.getElementById('settingsToggle');
    const settingsMenu = document.getElementById('settingsMenu');

    // State
    let symbols = [];
    let currentPhrase = [];
    let phraseHistory = [];
    let isEditMode = false;
    let currentEditingSymbol = null;
    let settings = { filterCategory: 'All' };

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
        voiceKey: 'cb.voice',
        categoriesKey: 'cb.categories'
    };

    // Default categories
    const defaultCategories = [
        'Activities & Play',
        'Basic Communication',
        'Body & Health',
        'Common Actions',
        'Feelings & Emotions',
        'Food & Drink',
        'Needs & Wants',
        'People & Pronouns',
        'Places',
        'Questions',
        'Sensory Needs',
        'Time & Schedule'
    ];

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

    // Categories management
    function getCategories() {
        const categoriesRaw = localStorage.getItem(LS.categoriesKey);
        if (categoriesRaw) {
            try {
                return JSON.parse(categoriesRaw);
            } catch {
                return [...defaultCategories];
            }
        }
        return [...defaultCategories];
    }

    function saveCategories(categories) {
        localStorage.setItem(LS.categoriesKey, JSON.stringify(categories));
    }

    function addCategory(name) {
        if (!name || name.trim() === '') {
            showToast('Please enter a category name');
            return false;
        }

        const categories = getCategories();
        if (categories.includes(name.trim())) {
            showToast('Category already exists');
            return false;
        }

        categories.push(name.trim());
        saveCategories(categories);
        updateCategorySelects();
        showToast(`Category "${name}" added`);
        return true;
    }

    function renameCategory(oldName, newName) {
        if (!newName || newName.trim() === '') {
            showToast('Please enter a category name');
            return false;
        }

        const categories = getCategories();
        if (categories.includes(newName.trim()) && newName.trim() !== oldName) {
            showToast('Category already exists');
            return false;
        }

        // Update category in categories list
        const index = categories.indexOf(oldName);
        if (index !== -1) {
            categories[index] = newName.trim();
            saveCategories(categories);
        }

        // Update category in all symbols
        symbols.forEach(symbol => {
            if (symbol.category === oldName) {
                symbol.category = newName.trim();
            }
        });
        saveSymbols();

        updateCategorySelects();
        renderBoard();
        showToast(`Category renamed to "${newName}"`);
        return true;
    }

    function deleteCategory(name) {
        if (!name) return false;

        // Check if category is used by any symbols
        const symbolsInCategory = symbols.filter(s => s.category === name);
        if (symbolsInCategory.length > 0) {
            if (!confirm(`This category contains ${symbolsInCategory.length} symbol(s). Deleting it will move these symbols to "Basic Communication". Continue?`)) {
                return false;
            }

            // Move symbols to Basic Communication
            symbols.forEach(symbol => {
                if (symbol.category === name) {
                    symbol.category = 'Basic Communication';
                }
            });
            saveSymbols();
        }

        const categories = getCategories();
        const index = categories.indexOf(name);
        if (index !== -1) {
            categories.splice(index, 1);
            saveCategories(categories);
        }

        // Update filter if it was set to the deleted category
        if (settings.filterCategory === name) {
            settings.filterCategory = 'All';
            saveSettings();
        }

        updateCategorySelects();
        renderBoard();
        showToast(`Category "${name}" deleted`);
        return true;
    }

    function updateCategorySelects() {
        const categories = getCategories();

        // Update symbol category select in edit modal
        symbolCategoryInput.innerHTML = '';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            symbolCategoryInput.appendChild(option);
        });

        // Update category filter select
        renderCategorySelect();
    }

    // Default set
    function defaultSymbols() {
        const list = [
            /* Basic Communication */
            { text: 'Hello', image: '😊', color: '#4a86e8', category: 'Basic Communication' },
            { text: 'Goodbye', image: '👋', color: '#4a86e8', category: 'Basic Communication' },
            { text: 'Yes', image: '👍', color: '#4a86e8', category: 'Basic Communication' },
            { text: 'No', image: '👎', color: '#4a86e8', category: 'Basic Communication' },
            { text: 'Please', image: '✨', color: '#4a86e8', category: 'Basic Communication' },
            { text: 'Thank you', image: '🙏', color: '#4a86e8', category: 'Basic Communication' },
            { text: 'Sorry', image: '🙇', color: '#4a86e8', category: 'Basic Communication' },
            { text: 'Okay', image: '👌', color: '#4a86e8', category: 'Basic Communication' },
            { text: 'Excuse me', image: '🗣️', color: '#4a86e8', category: 'Basic Communication' },
            { text: 'Maybe', image: '💭', color: '#4a86e8', category: 'Basic Communication' },
            { text: 'I understand', image: '💡', color: '#4a86e8', category: 'Basic Communication' },
            { text: "I don't understand", image: '❓', color: '#4a86e8', category: 'Basic Communication' },
            { text: 'Love', image: '❤️', color: '#4a86e8', category: 'Basic Communication' },
            { text: 'Good morning', image: '🌅', color: '#4a86e8', category: 'Basic Communication' },
            { text: 'Good night', image: '🌙', color: '#4a86e8', category: 'Basic Communication' },
            { text: 'Welcome', image: '👐', color: '#4a86e8', category: 'Basic Communication' },

            /* Needs & Wants */
            { text: 'Help', image: '🆘', color: '#ea4335', category: 'Needs & Wants' },
            { text: 'I want', image: '👉', color: '#ea4335', category: 'Needs & Wants' },
            { text: 'I need', image: '👐', color: '#ea4335', category: 'Needs & Wants' },
            { text: 'Stop', image: '✋', color: '#ea4335', category: 'Needs & Wants' },
            { text: 'More', image: '➕', color: '#ea4335', category: 'Needs & Wants' },
            { text: 'Finished', image: '✔️', color: '#ea4335', category: 'Needs & Wants' },
            { text: 'Pain', image: '🤕', color: '#ea4335', category: 'Needs & Wants' },
            { text: 'Tired', image: '😴', color: '#ea4335', category: 'Needs & Wants' },
            { text: 'Break', image: '⏸️', color: '#ea4335', category: 'Needs & Wants' },
            { text: "I don't want", image: '🙅', color: '#ea4335', category: 'Needs & Wants' },
            { text: "I don't know", image: '🤷', color: '#ea4335', category: 'Needs & Wants' },
            { text: 'Space', image: '🚶', color: '#ea4335', category: 'Needs & Wants' },
            { text: 'Alone', image: '🚪', color: '#ea4335', category: 'Needs & Wants' },
            { text: 'Too much', image: '🔥', color: '#ea4335', category: 'Needs & Wants' },
            { text: 'Too loud', image: '📢', color: '#ea4335', category: 'Needs & Wants' },
            { text: 'Too bright', image: '💡', color: '#ea4335', category: 'Needs & Wants' },
            { text: 'Hungry', image: '🍽️', color: '#ea4335', category: 'Needs & Wants' },
            { text: 'Thirsty', image: '💧', color: '#ea4335', category: 'Needs & Wants' },
            { text: 'Cold', image: '🥶', color: '#ea4335', category: 'Needs & Wants' },
            { text: 'Hot', image: '🥵', color: '#ea4335', category: 'Needs & Wants' },

            /* Feelings & Emotions */
            { text: 'Happy', image: '😄', color: '#fbbc04', category: 'Feelings & Emotions' },
            { text: 'Sad', image: '😢', color: '#fbbc04', category: 'Feelings & Emotions' },
            { text: 'Angry', image: '😡', color: '#fbbc04', category: 'Feelings & Emotions' },
            { text: 'Scared', image: '😨', color: '#fbbc04', category: 'Feelings & Emotions' },
            { text: 'Excited', image: '🤩', color: '#fbbc04', category: 'Feelings & Emotions' },
            { text: 'Calm', image: '😌', color: '#fbbc04', category: 'Feelings & Emotions' },
            { text: 'Sick', image: '🤢', color: '#fbbc04', category: 'Feelings & Emotions' },
            { text: 'Surprised', image: '😲', color: '#fbbc04', category: 'Feelings & Emotions' },
            { text: 'Lonely', image: '🥺', color: '#fbbc04', category: 'Feelings & Emotions' },
            { text: 'Overwhelmed', image: '🌊', color: '#fbbc04', category: 'Feelings & Emotions' },
            { text: 'Anxious', image: '😰', color: '#fbbc04', category: 'Feelings & Emotions' },
            { text: 'Frustrated', image: '😤', color: '#fbbc04', category: 'Feelings & Emotions' },
            { text: 'Confused', image: '😕', color: '#fbbc04', category: 'Feelings & Emotions' },
            { text: 'Proud', image: '😊', color: '#fbbc04', category: 'Feelings & Emotions' },
            { text: 'Loved', image: '💝', color: '#fbbc04', category: 'Feelings & Emotions' },
            { text: 'Brave', image: '🦁', color: '#fbbc04', category: 'Feelings & Emotions' },
            { text: 'Bored', image: '🥱', color: '#fbbc04', category: 'Feelings & Emotions' },
            { text: 'Curious', image: '🤔', color: '#fbbc04', category: 'Feelings & Emotions' },

            /* Sensory Needs */
            { text: 'Headphones', image: '🎧', color: '#9c27b0', category: 'Sensory Needs' },
            { text: 'Quiet', image: '🔇', color: '#9c27b0', category: 'Sensory Needs' },
            { text: 'Dark', image: '🌙', color: '#9c27b0', category: 'Sensory Needs' },
            { text: 'Weighted blanket', image: '🛏️', color: '#9c27b0', category: 'Sensory Needs' },
            { text: 'Stim', image: '🌀', color: '#9c27b0', category: 'Sensory Needs' },
            { text: 'Fidget', image: '🔄', color: '#9c27b0', category: 'Sensory Needs' },
            { text: 'Hug', image: '🫂', color: '#9c27b0', category: 'Sensory Needs' },
            { text: 'No touch', image: '✋', color: '#9c27b0', category: 'Sensory Needs' },
            { text: 'Different clothes', image: '👕', color: '#9c27b0', category: 'Sensory Needs' },
            { text: 'Soft', image: '🪶', color: '#9c27b0', category: 'Sensory Needs' },
            { text: 'Loud', image: '🔊', color: '#9c27b0', category: 'Sensory Needs' },
            { text: 'Bright', image: '💡', color: '#9c27b0', category: 'Sensory Needs' },
            { text: 'Pressure', image: '⏬', color: '#9c27b0', category: 'Sensory Needs' },

            /* People & Pronouns */
            { text: 'Me', image: '🙂', color: '#00bcd4', category: 'People & Pronouns' },
            { text: 'You', image: '🫵', color: '#00bcd4', category: 'People & Pronouns' },
            { text: 'Friend', image: '🧑‍🤝‍🧑', color: '#00bcd4', category: 'People & Pronouns' },
            { text: 'Family', image: '👨‍👩‍👦', color: '#00bcd4', category: 'People & Pronouns' },
            { text: 'Teacher', image: '👩‍🏫', color: '#00bcd4', category: 'People & Pronouns' },
            { text: 'Mum', image: '👩', color: '#00bcd4', category: 'People & Pronouns' },
            { text: 'Dad', image: '👨', color: '#00bcd4', category: 'People & Pronouns' },
            { text: 'Doctor', image: '👨‍⚕️', color: '#00bcd4', category: 'People & Pronouns' },
            { text: 'Therapist', image: '🧠', color: '#00bcd4', category: 'People & Pronouns' },
            { text: 'Support worker', image: '👥', color: '#00bcd4', category: 'People & Pronouns' },
            { text: 'They', image: '👥', color: '#00bcd4', category: 'People & Pronouns' },
            { text: 'He', image: '👨', color: '#00bcd4', category: 'People & Pronouns' },
            { text: 'She', image: '👩', color: '#00bcd4', category: 'People & Pronouns' },
            { text: 'We', image: '👥', color: '#00bcd4', category: 'People & Pronouns' },

            /* Common Actions */
            { text: 'Eat', image: '🍽️', color: '#9c27b0', category: 'Common Actions' },
            { text: 'Drink', image: '🥤', color: '#9c27b0', category: 'Common Actions' },
            { text: 'Play', image: '🎮', color: '#9c27b0', category: 'Common Actions' },
            { text: 'Go', image: '🏃', color: '#9c27b0', category: 'Common Actions' },
            { text: 'Come', image: '👣', color: '#9c27b0', category: 'Common Actions' },
            { text: 'Look', image: '👀', color: '#9c27b0', category: 'Common Actions' },
            { text: 'Listen', image: '👂', color: '#9c27b0', category: 'Common Actions' },
            { text: 'Wait', image: '⏳', color: '#9c27b0', category: 'Common Actions' },
            { text: 'Talk', image: '💬', color: '#9c27b0', category: 'Common Actions' },
            { text: 'Sleep', image: '🛌', color: '#9c27b0', category: 'Common Actions' },
            { text: 'Read', image: '📖', color: '#9c27b0', category: 'Common Actions' },
            { text: 'Write', image: '✍️', color: '#9c27b0', category: 'Common Actions' },
            { text: 'Watch', image: '📺', color: '#9c27b0', category: 'Common Actions' },
            { text: 'Breathe', image: '🌬️', color: '#9c27b0', category: 'Common Actions' },
            { text: 'Rest', image: '😴', color: '#9c27b0', category: 'Common Actions' },
            { text: 'Run', image: '🏃', color: '#9c27b0', category: 'Common Actions' },
            { text: 'Jump', image: '🦘', color: '#9c27b0', category: 'Common Actions' },
            { text: 'Sit', image: '🪑', color: '#9c27b0', category: 'Common Actions' },
            { text: 'Stand', image: '🧍', color: '#9c27b0', category: 'Common Actions' },

            /* Places */
            { text: 'Home', image: '🏠', color: '#34a853', category: 'Places' },
            { text: 'School', image: '🏫', color: '#34a853', category: 'Places' },
            { text: 'Bathroom', image: '🚽', color: '#34a853', category: 'Places' },
            { text: 'Outside', image: '🌳', color: '#34a853', category: 'Places' },
            { text: 'Shop', image: '🛒', color: '#34a853', category: 'Places' },
            { text: 'Car', image: '🚗', color: '#34a853', category: 'Places' },
            { text: 'Park', image: '🌲', color: '#34a853', category: 'Places' },
            { text: 'Work', image: '💼', color: '#34a853', category: 'Places' },
            { text: 'Quiet room', image: '🚪', color: '#34a853', category: 'Places' },
            { text: 'Bedroom', image: '🛏️', color: '#34a853', category: 'Places' },
            { text: 'Hospital', image: '🏥', color: '#34a853', category: 'Places' },
            { text: 'Restaurant', image: '🍽️', color: '#34a853', category: 'Places' },

            /* Questions */
            { text: 'What?', image: '❓', color: '#9b59b6', category: 'Questions' },
            { text: 'Where?', image: '🗺️', color: '#9b59b6', category: 'Questions' },
            { text: 'When?', image: '🕒', color: '#9b59b6', category: 'Questions' },
            { text: 'Why?', image: '🤔', color: '#9b59b6', category: 'Questions' },
            { text: 'How?', image: '🛠️', color: '#9b59b6', category: 'Questions' },
            { text: 'Who?', image: '👤', color: '#9b59b6', category: 'Questions' },
            { text: 'How long?', image: '⏱️', color: '#9b59b6', category: 'Questions' },
            { text: 'What next?', image: '➡️', color: '#9b59b6', category: 'Questions' },
            { text: 'How are you?', image: '🙂', color: '#9b59b6', category: 'Questions' },
            { text: 'What is that?', image: '❓', color: '#9b59b6', category: 'Questions' },

            /* Time & Schedule */
            { text: 'Now', image: '⏰', color: '#ff9800', category: 'Time & Schedule' },
            { text: 'Later', image: '⏲️', color: '#ff9800', category: 'Time & Schedule' },
            { text: 'Today', image: '📅', color: '#ff9800', category: 'Time & Schedule' },
            { text: 'Tomorrow', image: '➡️', color: '#ff9800', category: 'Time & Schedule' },
            { text: 'Yesterday', image: '⬅️', color: '#ff9800', category: 'Time & Schedule' },
            { text: 'Soon', image: '🔜', color: '#ff9800', category: 'Time & Schedule' },
            { text: 'First/Then', image: '1️⃣/2️⃣', color: '#ff9800', category: 'Time & Schedule' },
            { text: 'Change', image: '🔄', color: '#ff9800', category: 'Time & Schedule' },
            { text: 'Morning', image: '🌅', color: '#ff9800', category: 'Time & Schedule' },
            { text: 'Afternoon', image: '🌞', color: '#ff9800', category: 'Time & Schedule' },
            { text: 'Evening', image: '🌆', color: '#ff9800', category: 'Time & Schedule' },
            { text: 'Night', image: '🌙', color: '#ff9800', category: 'Time & Schedule' },

            /* Food & Drink */
            { text: 'Water', image: '💧', color: '#e74c3c', category: 'Food & Drink' },
            { text: 'Juice', image: '🧃', color: '#e74c3c', category: 'Food & Drink' },
            { text: 'Snack', image: '🍎', color: '#e74c3c', category: 'Food & Drink' },
            { text: 'Lunch', image: '🥪', color: '#e74c3c', category: 'Food & Drink' },
            { text: 'Dinner', image: '🍽️', color: '#e74c3c', category: 'Food & Drink' },
            { text: 'Safe food', image: '⭐', color: '#e74c3c', category: 'Food & Drink' },
            { text: 'Texture', image: '👆', color: '#e74c3c', category: 'Food & Drink' },
            { text: 'Breakfast', image: '🍳', color: '#e74c3c', category: 'Food & Drink' },
            { text: 'Fruit', image: '🍎', color: '#e74c3c', category: 'Food & Drink' },
            { text: 'Vegetable', image: '🥦', color: '#e74c3c', category: 'Food & Drink' },

            /* Activities & Play */
            { text: 'Game', image: '🎲', color: '#2ecc71', category: 'Activities & Play' },
            { text: 'Music', image: '🎵', color: '#2ecc71', category: 'Activities & Play' },
            { text: 'Draw', image: '🎨', color: '#2ecc71', category: 'Activities & Play' },
            { text: 'Walk', image: '🚶', color: '#2ecc71', category: 'Activities & Play' },
            { text: 'Special interest', image: '❤️', color: '#2ecc71', category: 'Activities & Play' },
            { text: 'Routine', image: '📋', color: '#2ecc71', category: 'Activities & Play' },
            { text: 'Swim', image: '🏊', color: '#2ecc71', category: 'Activities & Play' },
            { text: 'Dance', image: '💃', color: '#2ecc71', category: 'Activities & Play' },
            { text: 'Sing', image: '🎤', color: '#2ecc71', category: 'Activities & Play' },

            /* Body & Health */
            { text: 'Headache', image: '🤕', color: '#8e44ad', category: 'Body & Health' },
            { text: 'Stomach ache', image: '🤢', color: '#8e44ad', category: 'Body & Health' },
            { text: 'Medicine', image: '💊', color: '#8e44ad', category: 'Body & Health' },
            { text: 'Meltdown', image: '🌪️', color: '#8e44ad', category: 'Body & Health' },
            { text: 'Shutdown', image: '🔄', color: '#8e44ad', category: 'Body & Health' },
            { text: 'Allergy', image: '🤧', color: '#8e44ad', category: 'Body & Health' },
            { text: 'Temperature', image: '🌡️', color: '#8e44ad', category: 'Body & Health' }
        ];

        return list.map((symbol, index) => ({
            ...symbol,
            id: index + 1
        }));
    }

    // Helpers
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

    // Settings Dropdown Functions
    function toggleSettingsMenu() {
        settingsMenu.parentElement.classList.toggle('active');
    }

    function closeSettingsMenu() {
        settingsMenu.parentElement.classList.remove('active');
    }

    // Close settings menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!settingsToggle.contains(e.target) && !settingsMenu.contains(e.target)) {
            closeSettingsMenu();
        }
    });

    // Categories Management Functions
    function openCategoriesModal() {
        categoriesModal.setAttribute('aria-hidden', 'false');
        renderCategoriesList();
        closeSettingsMenu();
    }

    function closeCategoriesModalHandler() { // Renamed this function
        categoriesModal.setAttribute('aria-hidden', 'true');
        newCategoryName.value = '';
    }

    function renderCategoriesList() {
        const categories = getCategories();
        categoriesList.innerHTML = '';

        categories.forEach(category => {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item';
            categoryItem.innerHTML = `
            <input type="text" value="${category}" class="category-name-input">
            <div class="category-actions">
                <button class="btn-secondary rename-category-btn" data-category="${category}">Rename</button>
                <button class="btn-danger delete-category-btn" data-category="${category}">Delete</button>
            </div>
        `;
            categoriesList.appendChild(categoryItem);
        });

        // Add event listeners for rename and delete buttons
        document.querySelectorAll('.rename-category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const oldCategory = e.target.dataset.category;
                const input = e.target.closest('.category-item').querySelector('.category-name-input');
                const newCategory = input.value.trim();

                if (renameCategory(oldCategory, newCategory)) {
                    renderCategoriesList();
                }
            });
        });

        document.querySelectorAll('.delete-category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                if (deleteCategory(category)) {
                    renderCategoriesList();
                }
            });
        });
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

    // For long-press
    function previewSpeak(symbol) {
        const text = symbol.text;
        if (!text || !('speechSynthesis' in window)) return;

        speechSynthesis.cancel();
        const ut = new SpeechSynthesisUtterance(text);

        // apply chosen voice
        const chosen = localStorage.getItem(LS.voiceKey);
        if (chosen) {
            const voice = speechSynthesis.getVoices().find(v => v.name === chosen);
            if (voice) ut.voice = voice;
        }

        speechSynthesis.speak(ut);
    }


    // Rendering
    function renderBoard() {
        communicationBoard.innerHTML = '';
        const searchValue = (globalSearch?.value || "").toLowerCase();

        const filtered = symbols.filter(s => {
            const categoryOk = settings.filterCategory === 'All' || s.category === settings.filterCategory;
            const searchOk = s.text.toLowerCase().includes(searchValue);
            return categoryOk && searchOk;
        });

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

            // LONG PRESS PREVIEW
            let pressTimer = null;
            node.addEventListener('mousedown', () => {
                if (isEditMode) return;
                pressTimer = setTimeout(() => previewSpeak(symbol), 600);
            });
            node.addEventListener('mouseup', () => clearTimeout(pressTimer));
            node.addEventListener('mouseleave', () => clearTimeout(pressTimer));
            node.addEventListener('touchstart', () => {
                if (isEditMode) return;
                pressTimer = setTimeout(() => previewSpeak(symbol), 600);
            });
            node.addEventListener('touchend', () => clearTimeout(pressTimer));
            node.addEventListener('touchcancel', () => clearTimeout(pressTimer));

            // keyboard support
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
            });

            communicationBoard.appendChild(node);
        });

        renderCategorySelect();
    }

    function renderCategorySelect() {
        const categories = getCategories();
        const cats = Array.from(new Set(['All', ...categories]));
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
            item.title = 'Click to remove. Drag to reorder.';

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
            // Cancel any ongoing speech
            speechSynthesis.cancel();

            const utter = new SpeechSynthesisUtterance(phraseText);
            utter.rate = 0.95;
            utter.pitch = 1;
            utter.volume = 1;

            // Set voice with better error handling
            const chosen = localStorage.getItem(LS.voiceKey);
            if (chosen) {
                const voices = speechSynthesis.getVoices();
                const voice = voices.find(x => x.name === chosen);
                if (voice) {
                    utter.voice = voice;
                }
            }

            utter.onerror = (event) => {
                console.error('Speech synthesis error:', event);
                showToast('Speech error, trying without voice selection');
                // Fallback: try without specific voice
                if (chosen) {
                    localStorage.removeItem(LS.voiceKey);
                    const fallbackUtter = new SpeechSynthesisUtterance(phraseText);
                    fallbackUtter.rate = 0.95;
                    speechSynthesis.speak(fallbackUtter);
                }
            };

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
            symbolCategoryInput.value = symbol.category || 'Basic Communication';
            deleteBtn.style.display = 'inline-block';
        } else {
            currentEditingSymbol = null;
            symbolForm.reset();
            symbolCategoryInput.value = 'Basic Communication';
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
        const category = symbolCategoryInput.value || 'Basic Communication';

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
        const payload = {
            symbols,
            settings,
            categories: getCategories()
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'communication-board-export.json';
        a.click();
        URL.revokeObjectURL(url);
        closeSettingsMenu();
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
                if (parsed.categories && Array.isArray(parsed.categories)) {
                    saveCategories(parsed.categories);
                    updateCategorySelects();
                    showToast('Imported categories');
                }
            } catch (err) {
                alert('Import failed: invalid file');
            }
        };
        reader.readAsText(file);
        // clear the input so same file can be imported again if needed
        evt.target.value = '';
        closeSettingsMenu();
    }

    // Voices
    function populateVoices() {
        const voices = speechSynthesis.getVoices();
        voiceSelect.innerHTML = '';

        // Add a default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Default Voice';
        defaultOption.selected = !localStorage.getItem(LS.voiceKey);
        voiceSelect.appendChild(defaultOption);

        const stored = localStorage.getItem(LS.voiceKey);
        let foundStored = false;

        voices.forEach(v => {
            const o = document.createElement('option');
            o.value = v.name;
            o.textContent = `${v.name} ${v.lang ? '(' + v.lang + ')' : ''}`;
            if (stored && stored === v.name) {
                o.selected = true;
                foundStored = true;
            }
            voiceSelect.appendChild(o);
        });

        // If stored voice not found but we have voices, select first available
        if (!foundStored && voices.length > 0 && stored) {
            localStorage.removeItem(LS.voiceKey);
            showToast('Previous voice not available, using default');
        }
    }

    // Undo handler
    undoBtn.addEventListener('click', () => {
        undo();
        closeSettingsMenu();
    });

    // Toggle edit mode
    function toggleEditMode() {
        isEditMode = !isEditMode;
        document.body.classList.toggle('edit-mode', isEditMode);
        editModeBtn.textContent = isEditMode ? 'Exit Edit Mode' : 'Edit Mode';
        renderBoard();
        closeSettingsMenu();
    }

    // Event listeners
    speakBtn.addEventListener('click', speakPhrase);
    clearBtn.addEventListener('click', clearPhrase);
    editModeBtn.addEventListener('click', toggleEditMode);
    saveBtn.addEventListener('click', () => {
        saveSymbols();
        closeSettingsMenu();
    });
    addSymbolBtn.addEventListener('click', addNewSymbol);
    closeModalBtn.addEventListener('click', closeEditModal);
    symbolForm.addEventListener('submit', saveSymbolChanges);
    deleteBtn.addEventListener('click', deleteSymbol);
    cancelEditBtn.addEventListener('click', closeEditModal);
    exportBtn.addEventListener('click', exportJSON);
    importFile.addEventListener('change', importJSONFile);

    // Categories Management Event Listeners
    manageCategoriesBtn.addEventListener('click', openCategoriesModal);
    closeCategoriesModal.addEventListener('click', closeCategoriesModalHandler);
    closeCategoriesBtn.addEventListener('click', closeCategoriesModalHandler);
    addCategoryBtn.addEventListener('click', () => {
        if (addCategory(newCategoryName.value)) {
            newCategoryName.value = '';
            renderCategoriesList();
        }
    });

    // Allow Enter key to add category
    newCategoryName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addCategoryBtn.click();
        }
    });

    // Settings dropdown event listeners
    settingsToggle.addEventListener('click', toggleSettingsMenu);

    // PWA Event Listeners
    if (installBtn) {
        installBtn.addEventListener('click', showInstallPrompt);
    }

    if (globalSearch) {
        globalSearch.addEventListener('input', renderBoard);
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
        const selectedVoice = voiceSelect.value;
        if (selectedVoice) {
            localStorage.setItem(LS.voiceKey, selectedVoice);
            showToast(`Voice set to: ${selectedVoice}`);
        } else {
            localStorage.removeItem(LS.voiceKey);
            showToast('Using default voice');
        }
    });

    // keyboard quick actions
    boardWrap.addEventListener('keydown', (ev) => {
        if (ev.key === 'e') {
            toggleEditMode();
            closeSettingsMenu();
        }
        if (ev.key === 'z' && (ev.ctrlKey || ev.metaKey)) {
            undo();
            closeSettingsMenu();
        }
        if (ev.key === 'Escape') {
            closeSettingsMenu();
        }
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
        updateCategorySelects();
        renderBoard();
        updatePhraseDisplay();

        // Check if app is already in standalone mode
        if (isStandalone) {
            console.log('App is running in standalone mode');
        }

        updateInstallButton();

        function loadVoices() {
            const voices = speechSynthesis.getVoices();
            if (voices.length > 0) {
                populateVoices();
            } else {
                // Try again after a short delay on mobile
                setTimeout(() => {
                    const retryVoices = speechSynthesis.getVoices();
                    if (retryVoices.length > 0) {
                        populateVoices();
                    } else {
                        console.log('No voices available');
                        showToast('No TTS voices detected');
                    }
                }, 500);
            }
        }

        // Initial voice load
        loadVoices();

        // Voice change handler - more aggressive on mobile
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = loadVoices;
        }

        // Mobile-specific voice check
        setTimeout(loadVoices, 1000);
    }

    init(); // This stays at the very end
});