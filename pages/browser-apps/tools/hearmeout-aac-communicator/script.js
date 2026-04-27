// Copyright (c) 2024-2026. Jericho Crosby (Chalwk)

(() => {
    // --- DOM stuff ---
    const board = document.getElementById('board');
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
    const exportBtn = document.getElementById('exportBtn');
    const importFile = document.getElementById('importFile');
    const toast = document.getElementById('toast');
    const boardWrap = document.getElementById('boardWrap');
    const categoryIndicator = document.getElementById('categoryIndicator');
    const manageCategoriesBtn = document.getElementById('manageCategoriesBtn');
    const categoriesModal = document.getElementById('categoriesModal');
    const closeCategoriesModal = document.getElementById('closeCategoriesModal');
    const closeCategoriesBtn = document.getElementById('closeCategoriesBtn');
    const categoriesList = document.getElementById('categoriesList');
    const newCategoryName = document.getElementById('newCategoryName');
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsModal = document.getElementById('closeSettingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const openSettingsPanelBtn = document.getElementById('openSettingsPanelBtn');
    const settingsThemeSelect = document.getElementById('settingsThemeSelect');
    const settingsVolumeSelect = document.getElementById('settingsVolumeSelect');
    const settingsVoiceSelect = document.getElementById('settingsVoiceSelect');
    const settingsGridSizeSelect = document.getElementById('settingsGridSizeSelect');
    const settingsToggle = document.getElementById('settingsToggle');
    const settingsMenu = document.getElementById('settingsMenu');
    const infoToggle = document.getElementById('infoToggle');
    const infoModal = document.getElementById('infoModal');
    const closeInfoModal = document.getElementById('closeInfoModal');
    const closeInfoBtn = document.getElementById('closeInfoBtn');
    const categoryDropdown = document.getElementById('categoryDropdown');
    const categoryList = document.getElementById('categoryList');
    const boardPrevBtn = document.getElementById('boardPrevBtn');
    const boardNextBtn = document.getElementById('boardNextBtn');

    // --- app state ---
    let symbols = [];
    let currentPhrase = [];
    let phraseHistory = [];
    let isEditMode = false;
    let currentEditingSymbol = null;
    let settings = {
        gridSize: 'auto',
        theme: 'auto',
        volume: 0.6
    };
    let categoriesOrdered = [];
    let currentCategoryIndex = 0;
    let isAnimating = false;

    // localStorage keys
    const LS = {
        symbolsKey: 'cb.symbols',
        settingsKey: 'cb.settings',
        voiceKey: 'cb.voice',
        categoriesKey: 'cb.categories',
        themeKey: 'cb.theme',
        volumeKey: 'cb.volume'
    };

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
        'Time & Schedule',
        'Descriptors'
    ];

    function saveSymbols(silent = false) {
        localStorage.setItem(LS.symbolsKey, JSON.stringify(symbols));
        if (!silent) showToast('Symbols saved');
    }

    async function loadSymbolsFromFile() {
        try {
            const response = await fetch('symbols.txt');
            if (!response.ok) {
                showToast('Failed to load symbols.txt, using empty board');
                return [];
            }
            const text = await response.text();
            const lines = text.split('\n').filter(line => line.trim() !== '');
            const newSymbols = [];
            lines.forEach((line, index) => {
                const parts = line.split(';').map(s => s.trim());
                if (parts.length >= 4) {
                    const [text, image, color, category] = parts;
                    newSymbols.push({
                        id: index + 1,
                        text: text,
                        image: image,
                        color: color,
                        category: category
                    });
                } else {
                    console.warn('Skipping malformed line:', line);
                }
            });
            return newSymbols;
        } catch (error) {
            console.error('Error loading symbols from file:', error);
            showToast('Could not load symbols.txt, using empty board');
            return [];
        }
    }

    async function loadSymbols() {
        const raw = localStorage.getItem(LS.symbolsKey);
        if (raw) {
            try {
                symbols = JSON.parse(raw);
            } catch {
                symbols = await loadSymbolsFromFile();
                saveSymbols(true);
            }
        } else {
            symbols = await loadSymbolsFromFile();
            saveSymbols(true);
        }

        const symbolCategories = [...new Set(symbols.map(s => s.category))];
        const existingCategories = getCategories();
        const mergedCategories = [...new Set([...existingCategories, ...symbolCategories])];
        saveCategories(mergedCategories);
        updateCategorySelects();
        refreshOrderedCategories();
    }

    function saveSettings() {
        localStorage.setItem(LS.settingsKey, JSON.stringify(settings));
        localStorage.setItem(LS.volumeKey, settings.volume.toString());
    }

    function loadSettings() {
        const raw = localStorage.getItem(LS.settingsKey);
        if (raw) {
            try {
                settings = Object.assign(settings, JSON.parse(raw));
            } catch { /* ignore */
            }
        }
        loadVolume();
    }

    function loadVolume() {
        const savedVolume = localStorage.getItem(LS.volumeKey);
        settings.volume = savedVolume ? parseFloat(savedVolume) : 0.6;
    }

    function applyTheme(theme) {
        document.body.classList.remove('theme-light', 'theme-dark', 'theme-high-contrast');
        document.body.classList.add(theme === 'auto' ? 'theme-auto' : `theme-${theme}`);
        updateThemeColor(theme);
    }

    function updateThemeColor(theme) {
        const meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) return;
        const colors = {light: '#4a86e8', dark: '#1a1a1a', 'high-contrast': '#000000', auto: '#4a86e8'};
        meta.content = colors[theme] || colors.auto;
    }

    function loadTheme() {
        const savedTheme = localStorage.getItem(LS.themeKey);
        settings.theme = savedTheme || 'auto';
        applyTheme(settings.theme);
    }

    function saveTheme(theme) {
        settings.theme = theme;
        localStorage.setItem(LS.themeKey, theme);
        applyTheme(theme);
        showToast(`Theme set to ${theme}`);
    }

    function getCategories() {
        const raw = localStorage.getItem(LS.categoriesKey);
        if (raw) {
            try {
                return JSON.parse(raw);
            } catch {
                return [...defaultCategories];
            }
        }
        return [...defaultCategories];
    }

    function saveCategories(categories) {
        localStorage.setItem(LS.categoriesKey, JSON.stringify(categories));
    }

    function refreshOrderedCategories() {
        categoriesOrdered = [...getCategories()];
        if (categoriesOrdered.length > 0 && currentCategoryIndex >= categoriesOrdered.length) {
            currentCategoryIndex = 0;
        }
        updateCategoryIndicator();
        if (categoryDropdown && categoryDropdown.style.display !== 'none') {
            populateCategoryDropdown();
        }
    }

    function updateCategoryIndicator() {
        if (categoryIndicator && categoriesOrdered.length > 0) {
            categoryIndicator.textContent = categoriesOrdered[currentCategoryIndex] || '';
        }
    }

    function addCategory(name) {
        name = name?.trim();
        if (!name) {
            showToast('Please enter a category name');
            return false;
        }
        const categories = getCategories();
        if (categories.includes(name)) {
            showToast('Category already exists');
            return false;
        }
        categories.push(name);
        saveCategories(categories);
        refreshOrderedCategories();
        updateCategorySelects();
        showToast(`Category "${name}" added`);
        return true;
    }

    function renameCategory(oldName, newName) {
        newName = newName?.trim();
        if (!newName) {
            showToast('Please enter a category name');
            return false;
        }
        const categories = getCategories();
        if (categories.includes(newName) && newName !== oldName) {
            showToast('Category already exists');
            return false;
        }
        const idx = categories.indexOf(oldName);
        if (idx !== -1) categories[idx] = newName;
        saveCategories(categories);
        symbols.forEach(s => {
            if (s.category === oldName) s.category = newName;
        });
        saveSymbols();
        refreshOrderedCategories();
        updateCategorySelects();
        renderBoard();
        showToast(`Category renamed to "${newName}"`);
        return true;
    }

    function deleteCategory(name) {
        if (!name) return false;
        const count = symbols.filter(s => s.category === name).length;
        if (count > 0 && !confirm(`This category contains ${count} symbol(s). Deleting it will move them to "Basic Communication". Continue?`)) return false;
        symbols.forEach(s => {
            if (s.category === name) s.category = 'Basic Communication';
        });
        if (count > 0) saveSymbols();
        const categories = getCategories();
        const idx = categories.indexOf(name);
        if (idx !== -1) categories.splice(idx, 1);
        saveCategories(categories);
        refreshOrderedCategories();
        updateCategorySelects();
        renderBoard();
        showToast(`Category "${name}" deleted`);
        return true;
    }

    function updateCategorySelects() {
        const categories = getCategories();
        symbolCategoryInput.innerHTML = '';
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            symbolCategoryInput.appendChild(opt);
        });
    }

    function toggleCategoryDropdown() {
        if (!categoryDropdown) return;
        categoryDropdown.style.display === 'none' ? openCategoryDropdown() : closeCategoryDropdown();
    }

    function openCategoryDropdown() {
        if (!categoryDropdown) return;
        populateCategoryDropdown();
        categoryDropdown.style.display = 'block';
    }

    function closeCategoryDropdown() {
        if (categoryDropdown) categoryDropdown.style.display = 'none';
    }

    function populateCategoryDropdown() {
        if (!categoryList) return;
        categoryList.innerHTML = '';
        categoriesOrdered.forEach((cat, idx) => {
            const li = document.createElement('li');
            li.textContent = cat;
            li.tabIndex = 0;
            if (idx === currentCategoryIndex) li.classList.add('active');
            li.addEventListener('click', (e) => {
                e.stopPropagation();
                if (idx !== currentCategoryIndex) {
                    closeCategoryDropdown();
                    animateCategoryChange(idx);
                } else {
                    closeCategoryDropdown();
                }
            });
            li.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    li.click();
                }
            });
            categoryList.appendChild(li);
        });
    }

    document.addEventListener('click', (e) => {
        if (categoryDropdown && categoryDropdown.style.display !== 'none' &&
            !categoryDropdown.contains(e.target) && e.target !== categoryIndicator) {
            closeCategoryDropdown();
        }
    });

    categoryIndicator.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleCategoryDropdown();
    });
    categoryIndicator.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleCategoryDropdown();
        }
    });

    function showToast(msg, timeout = 2200) {
        if (!toast || !msg) return;
        toast.textContent = msg;
        toast.style.opacity = '1';
        toast.style.visibility = 'visible';
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.style.visibility = 'hidden', 300);
        }, timeout);
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
        return !!str && (isUrl(str) || str.startsWith('data:image/'));
    }

    // --- settings menu toggle ---
    function toggleSettingsMenu() {
        settingsMenu.parentElement.classList.toggle('active');
    }

    function closeSettingsMenu() {
        settingsMenu.parentElement.classList.remove('active');
    }

    document.addEventListener('click', (e) => {
        if (!settingsToggle.contains(e.target) && !settingsMenu.contains(e.target)) closeSettingsMenu();
    });

    function openInfoModal() {
        infoModal.setAttribute('aria-hidden', 'false');
    }

    function closeInfoModalHandler() {
        infoModal.setAttribute('aria-hidden', 'true');
    }

    function openCategoriesModal() {
        categoriesModal.setAttribute('aria-hidden', 'false');
        renderCategoriesList();
        closeSettingsMenu();
    }

    function closeCategoriesModalHandler() {
        categoriesModal.setAttribute('aria-hidden', 'true');
        newCategoryName.value = '';
    }

    function renderCategoriesList() {
        const categories = getCategories();
        categoriesList.innerHTML = '';
        categories.forEach(cat => {
            const div = document.createElement('div');
            div.className = 'category-item';
            div.innerHTML = `
                <input type="text" value="${cat}" class="category-name-input">
                <div class="category-actions">
                    <button class="btn btn-secondary rename-category-btn" data-category="${cat}">Rename</button>
                    <button class="btn btn-danger delete-category-btn" data-category="${cat}">Delete</button>
                </div>`;
            categoriesList.appendChild(div);
        });
        categoriesList.querySelectorAll('.rename-category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const oldCat = e.target.dataset.category;
                const input = e.target.closest('.category-item').querySelector('.category-name-input');
                if (renameCategory(oldCat, input.value.trim())) renderCategoriesList();
            });
        });
        categoriesList.querySelectorAll('.delete-category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (deleteCategory(e.target.dataset.category)) renderCategoriesList();
            });
        });
    }

    function openSettingsModal() {
        settingsModal.setAttribute('aria-hidden', 'false');
        settingsThemeSelect.value = settings.theme;
        settingsVolumeSelect.value = settings.volume.toString();
        settingsGridSizeSelect.value = settings.gridSize;
        populateSettingsVoices();
        closeSettingsMenu();
    }

    function closeSettingsModalHandler() {
        settingsModal.setAttribute('aria-hidden', 'true');
    }

    function populateSettingsVoices(showAvailabilityToast = false) {
        const voices = speechSynthesis.getVoices();
        settingsVoiceSelect.innerHTML = '';
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Default Voice';
        defaultOption.selected = !localStorage.getItem(LS.voiceKey);
        settingsVoiceSelect.appendChild(defaultOption);

        const stored = localStorage.getItem(LS.voiceKey);
        let foundStored = false;
        voices.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.name;
            opt.textContent = `${v.name} ${v.lang ? '(' + v.lang + ')' : ''}`;
            if (stored && stored === v.name) {
                opt.selected = true;
                foundStored = true;
            }
            settingsVoiceSelect.appendChild(opt);
        });
        if (!foundStored && voices.length > 0 && stored) {
            localStorage.removeItem(LS.voiceKey);
            if (showAvailabilityToast) showToast('Previous voice not available, using default');
        }
    }

    function previewSpeak(symbol) {
        const text = symbol.text;
        if (!text || !('speechSynthesis' in window)) return;
        speechSynthesis.cancel();
        const ut = new SpeechSynthesisUtterance(text);
        ut.volume = settings.volume;
        const chosen = localStorage.getItem(LS.voiceKey);
        if (chosen) {
            const voice = speechSynthesis.getVoices().find(v => v.name === chosen);
            if (voice) ut.voice = voice;
        }
        ut.onerror = (event) => {
            if (event.error !== 'interrupted') console.error('Speech synthesis error:', event);
        };
        speechSynthesis.speak(ut);
    }

    function animateCategoryChange(newIndex) {
        if (isAnimating || categoriesOrdered.length === 0 || newIndex === currentCategoryIndex) return;
        isAnimating = true;
        board.style.transition = 'opacity 0.15s ease';
        board.style.opacity = '0';
        setTimeout(() => {
            currentCategoryIndex = newIndex;
            updateCategoryIndicator();
            renderBoard();
            board.style.opacity = '1';
            setTimeout(() => {
                isAnimating = false;
            }, 150);
        }, 150);
    }

    function renderBoard() {
        board.innerHTML = '';
        const currentCategory = categoriesOrdered[currentCategoryIndex] || '';
        const filtered = symbols.filter(s => s.category === currentCategory);

        filtered.forEach(symbol => {
            const node = document.createElement('div');
            node.className = 'symbol';
            node.setAttribute('role', 'listitem');
            node.setAttribute('tabindex', '0');
            node.style.backgroundColor = symbol.color || '#e8f0fe';
            if (isEditMode) node.classList.add('editing');

            if (isImageSource(symbol.image)) {
                node.innerHTML = `<img src="${symbol.image}" alt="${symbol.text}"><span>${symbol.text}</span>`;
            } else {
                node.innerHTML = `<span class="symbol-emoji">${symbol.image}</span><span>${symbol.text}</span>`;
            }

            node.addEventListener('click', () => {
                if (isEditMode) openEditModal(symbol);
                else addToPhrase(symbol);
            });

            let pressTimer = null;
            const startPressTimer = () => {
                if (!isEditMode) pressTimer = setTimeout(() => previewSpeak(symbol), 550);
            };
            const clearPressTimer = () => {
                clearTimeout(pressTimer);
                pressTimer = null;
            };

            node.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                startPressTimer();
            }, {passive: false});
            node.addEventListener('pointerup', clearPressTimer);
            node.addEventListener('pointerleave', clearPressTimer);
            node.addEventListener('pointercancel', clearPressTimer);

            node.addEventListener('keydown', (ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    isEditMode ? openEditModal(symbol) : addToPhrase(symbol);
                }
                if (ev.key === 'e' && isEditMode) openEditModal(symbol);
            });

            board.appendChild(node);
        });

        applyGridSetting();
        updateArrowVisibility();
    }

    function updateArrowVisibility() {
        if (boardPrevBtn) boardPrevBtn.disabled = false;
        if (boardNextBtn) boardNextBtn.disabled = false;
    }

    function updatePhraseDisplay() {
        phraseDisplay.innerHTML = '';
        phraseDisplay.classList.remove('drag-active');
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

            item.addEventListener('click', () => {
                backupPhrase();
                currentPhrase.splice(index, 1);
                updatePhraseDisplay();
            });

            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', index.toString());
                e.dataTransfer.effectAllowed = 'move';
                item.classList.add('dragging');
                phraseDisplay.classList.add('drag-active');
                setTimeout(() => item.style.opacity = '0.4', 0);
            });

            item.addEventListener('dragend', () => {
                document.querySelectorAll('.phrase-item').forEach(el => {
                    el.classList.remove('dragging', 'drag-over', 'drag-placeholder');
                    el.style.opacity = '';
                });
                phraseDisplay.classList.remove('drag-active');
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                document.querySelectorAll('.phrase-item').forEach(el => el.classList.remove('drag-over'));
                const after = getDragAfterElement(phraseDisplay, e.clientX);
                if (after) after.classList.add('drag-over');
            });

            item.addEventListener('dragenter', (e) => e.preventDefault());
            item.addEventListener('dragleave', (e) => {
                if (!item.contains(e.relatedTarget)) item.classList.remove('drag-over');
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
                if (!Number.isFinite(fromIdx) || fromIdx === index) return;
                backupPhrase();
                const [moved] = currentPhrase.splice(fromIdx, 1);
                currentPhrase.splice(index, 0, moved);
                updatePhraseDisplay();
            });

            phraseDisplay.appendChild(item);
        });
    }

    function getDragAfterElement(container, x) {
        const draggableElements = [...container.querySelectorAll('.phrase-item:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = x - box.left - box.width / 2;
            return offset < 0 && offset > closest.offset ? {offset, element: child} : closest;
        }, {offset: Number.NEGATIVE_INFINITY}).element;
    }

    function backupPhrase() {
        phraseHistory.push(JSON.stringify(currentPhrase));
        if (phraseHistory.length > 30) phraseHistory.shift();
    }

    function undo() {
        if (!phraseHistory.length) {
            showToast('Nothing to undo');
            return;
        }
        try {
            currentPhrase = JSON.parse(phraseHistory.pop());
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
        if (!currentPhrase.length) return;
        backupPhrase();
        currentPhrase = [];
        updatePhraseDisplay();
    }

    function speakPhrase() {
        if (!currentPhrase.length) return;
        const phraseText = currentPhrase.map(s => s.text).join(' ');
        if (!('speechSynthesis' in window)) {
            alert(phraseText);
            return;
        }
        speechSynthesis.cancel();
        const ut = new SpeechSynthesisUtterance(phraseText);
        ut.rate = 0.95;
        ut.pitch = 1;
        ut.volume = settings.volume;
        const chosen = localStorage.getItem(LS.voiceKey);
        if (chosen) {
            const voice = speechSynthesis.getVoices().find(v => v.name === chosen);
            if (voice) ut.voice = voice;
        }
        ut.onerror = (event) => {
            if (event.error === 'interrupted') return;
            console.error('Speech synthesis error:', event);
            showToast('Speech error, trying without voice selection');
            if (chosen) {
                localStorage.removeItem(LS.voiceKey);
                const fallback = new SpeechSynthesisUtterance(phraseText);
                fallback.rate = 0.95;
                fallback.volume = settings.volume;
                speechSynthesis.speak(fallback);
            }
        };
        speechSynthesis.speak(ut);
    }

    // --- edit symbol modal ---
    function openEditModal(symbol = null) {
        isEditMode = true;
        document.body.classList.add('edit-mode');
        if (symbol?.id) {
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

    async function saveSymbolChanges(e) {
        e.preventDefault();
        const text = symbolTextInput.value.trim();
        let image = symbolImageInput.value.trim();
        const color = symbolColorInput.value;
        const category = symbolCategoryInput.value || 'Basic Communication';

        if (!text) {
            alert('Please enter text');
            return;
        }
        if (symbolImageFile.files?.[0]) image = await fileToDataURL(symbolImageFile.files[0]);
        if (!image) image = text.charAt(0) || '?';

        if (currentEditingSymbol?.id) {
            const idx = symbols.findIndex(s => s.id === currentEditingSymbol.id);
            if (idx !== -1) symbols[idx] = {...symbols[idx], text, image, color, category};
        } else {
            const newId = symbols.length ? Math.max(...symbols.map(s => s.id)) + 1 : 1;
            symbols.push({id: newId, text, image, color, category});
        }
        saveSymbols();
        refreshOrderedCategories();
        renderBoard();
        closeEditModal();
    }

    function deleteSymbol() {
        if (!currentEditingSymbol?.id) return;
        if (!confirm('Delete this symbol?')) return;
        symbols = symbols.filter(s => s.id !== currentEditingSymbol.id);
        saveSymbols();
        refreshOrderedCategories();
        renderBoard();
        closeEditModal();
    }

    function addNewSymbol() {
        openEditModal(null);
    }

    function fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('File read error'));
            reader.readAsDataURL(file);
        });
    }

    function exportJSON() {
        const payload = {symbols, settings, categories: getCategories()};
        const blob = new Blob([JSON.stringify(payload, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'hear-me-out-export.json';
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
                if (typeof reader.result !== 'string') {
                    alert('Import failed: invalid file content');
                    return;
                }
                const parsed = JSON.parse(reader.result);
                if (parsed.symbols && Array.isArray(parsed.symbols)) {
                    const existingIds = new Set(symbols.map(s => s.id));
                    let nextId = symbols.length ? Math.max(...symbols.map(s => s.id)) + 1 : 1;
                    parsed.symbols.forEach(s => {
                        const copy = {...s};
                        if (!copy.id || existingIds.has(copy.id)) copy.id = nextId++;
                        symbols.push(copy);
                    });
                    saveSymbols();
                    showToast('Imported symbols');
                }
                if (parsed.settings) {
                    settings = {...settings, ...parsed.settings};
                    saveSettings();
                }
                if (parsed.categories && Array.isArray(parsed.categories)) {
                    saveCategories(parsed.categories);
                    showToast('Imported categories');
                }
                refreshOrderedCategories();
                currentCategoryIndex = 0;
                updateCategoryIndicator();
                renderBoard();
            } catch {
                alert('Import failed: invalid file');
            }
        };
        reader.readAsText(file);
        evt.target.value = '';
        closeSettingsMenu();
    }

    function applyGridSetting() {
        if (!board) return;
        board.classList.remove('grid-3x4', 'grid-4x6', 'grid-6x8');
        if (settings.gridSize === 'auto') {
            board.classList.remove('fixed-grid');
            board.style.gridTemplateColumns = '';
        } else {
            board.classList.add('fixed-grid', `grid-${settings.gridSize}`);
            board.style.gridTemplateColumns = '';
        }
    }

    function toggleEditMode() {
        isEditMode = !isEditMode;
        document.body.classList.toggle('edit-mode', isEditMode);
        editModeBtn.textContent = isEditMode ? 'Exit Edit Mode' : 'Edit Mode';
        renderBoard();
        closeSettingsMenu();
    }

    boardWrap.addEventListener('contextmenu', (e) => e.preventDefault());
    boardWrap.addEventListener('selectstart', (e) => e.preventDefault());
    phraseDisplay.addEventListener('contextmenu', (e) => e.preventDefault());
    phraseDisplay.addEventListener('selectstart', (e) => e.preventDefault());

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

    manageCategoriesBtn.addEventListener('click', openCategoriesModal);
    closeCategoriesModal.addEventListener('click', closeCategoriesModalHandler);
    closeCategoriesBtn.addEventListener('click', closeCategoriesModalHandler);
    addCategoryBtn.addEventListener('click', () => {
        if (addCategory(newCategoryName.value)) {
            newCategoryName.value = '';
            renderCategoriesList();
        }
    });
    newCategoryName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addCategoryBtn.click();
        }
    });

    openSettingsPanelBtn.addEventListener('click', openSettingsModal);
    closeSettingsModal.addEventListener('click', closeSettingsModalHandler);
    closeSettingsBtn.addEventListener('click', closeSettingsModalHandler);

    settingsThemeSelect.addEventListener('change', () => saveTheme(settingsThemeSelect.value));
    settingsVolumeSelect.addEventListener('change', () => {
        settings.volume = parseFloat(settingsVolumeSelect.value);
        saveSettings();
        showToast(`Volume set to ${Math.round(settings.volume * 100)}%`);
    });
    settingsGridSizeSelect.addEventListener('change', () => {
        settings.gridSize = settingsGridSizeSelect.value;
        saveSettings();
        applyGridSetting();
    });
    settingsVoiceSelect.addEventListener('change', () => {
        const selected = settingsVoiceSelect.value;
        if (selected) {
            localStorage.setItem(LS.voiceKey, selected);
            showToast(`Voice set to: ${selected}`);
        } else {
            localStorage.removeItem(LS.voiceKey);
            showToast('Using default voice');
        }
    });

    settingsToggle.addEventListener('click', toggleSettingsMenu);

    infoToggle.addEventListener('click', openInfoModal);
    closeInfoModal.addEventListener('click', closeInfoModalHandler);
    closeInfoBtn.addEventListener('click', closeInfoModalHandler);

    boardPrevBtn.addEventListener('click', () => {
        if (!categoriesOrdered.length) return;
        const newIdx = (currentCategoryIndex - 1 + categoriesOrdered.length) % categoriesOrdered.length;
        closeCategoryDropdown();
        animateCategoryChange(newIdx);
    });
    boardNextBtn.addEventListener('click', () => {
        if (!categoriesOrdered.length) return;
        const newIdx = (currentCategoryIndex + 1) % categoriesOrdered.length;
        closeCategoryDropdown();
        animateCategoryChange(newIdx);
    });

    symbolImageFile.addEventListener('change', () => {
    });

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
            closeCategoryDropdown();
        }
    });

    async function init() {
        loadSettings();
        await loadSymbols();
        refreshOrderedCategories();
        if (!categoriesOrdered.length) {
            saveCategories([...defaultCategories]);
            refreshOrderedCategories();
        }
        currentCategoryIndex = 0;
        updateCategoryIndicator();
        loadTheme();
        updateCategorySelects();
        renderBoard();
        updatePhraseDisplay();
        applyGridSetting();

        function loadVoices() {
            const voices = speechSynthesis.getVoices();
            if (voices.length > 0) {
                populateSettingsVoices(true);
            } else {
                setTimeout(() => {
                    const retryVoices = speechSynthesis.getVoices();
                    if (retryVoices.length > 0) {
                        populateSettingsVoices(true);
                    } else {
                        console.log('No voices available');
                        showToast('No TTS voices detected');
                    }
                }, 500);
            }
        }

        loadVoices();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = loadVoices;
        }
        setTimeout(loadVoices, 1000);
    }

    document.addEventListener('DOMContentLoaded', init);
})();