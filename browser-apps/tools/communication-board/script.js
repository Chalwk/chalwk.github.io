/*
Copyright (c) 2024-2026. Jericho Crosby (Chalwk)

Communication Board - JavaScript
*/

(() => {
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
    const exportBtn = document.getElementById('exportBtn');
    const importFile = document.getElementById('importFile');
    const toast = document.getElementById('toast');
    const boardWrap = document.getElementById('boardWrap');
    const globalSearch = document.getElementById('globalSearch');

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

    let symbols = [];
    let currentPhrase = [];
    let phraseHistory = [];
    let isEditMode = false;
    let currentEditingSymbol = null;
    let settings = {
        filterCategory: 'All',
        gridSize: 'auto',
        theme: 'auto',
        volume: 0.6
    };

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
        'Time & Schedule'
    ];

    function saveSymbols() {
        localStorage.setItem(LS.symbolsKey, JSON.stringify(symbols));
        showToast('Symbols saved');
    }

    function saveSymbolsSilently() {
        localStorage.setItem(LS.symbolsKey, JSON.stringify(symbols));
    }

    async function loadSymbolsFromFile() {
        try {
            const response = await fetch('symbols.txt');
            if (!response.ok) throw new Error('Failed to load symbols.txt');
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
                saveSymbolsSilently();
            }
        } else {
            symbols = await loadSymbolsFromFile();
            saveSymbolsSilently();
        }

        const symbolCategories = [...new Set(symbols.map(s => s.category))];
        const existingCategories = getCategories();
        const mergedCategories = [...new Set([...existingCategories, ...symbolCategories])];
        saveCategories(mergedCategories);
        updateCategorySelects();
    }

    function saveSettings() {
        localStorage.setItem(LS.settingsKey, JSON.stringify(settings));
        saveVolume(settings.volume);
    }

    function loadSettings() {
        const raw = localStorage.getItem(LS.settingsKey);
        if (raw) {
            try {
                settings = Object.assign(settings, JSON.parse(raw));
            } catch {
            }
        }
        loadVolume();
    }

    function loadVolume() {
        const savedVolume = localStorage.getItem(LS.volumeKey);
        if (savedVolume) {
            settings.volume = parseFloat(savedVolume);
        } else {
            settings.volume = 0.6;
        }
    }

    function saveVolume(volume) {
        settings.volume = volume;
        localStorage.setItem(LS.volumeKey, volume.toString());
    }

    function applyTheme(theme) {
        document.body.classList.remove('theme-light', 'theme-dark', 'theme-high-contrast');

        if (theme === 'auto') {
            document.body.classList.add('theme-auto');
        } else {
            document.body.classList.add(`theme-${theme}`);
        }

        updateThemeColor(theme);
    }

    function updateThemeColor(theme) {
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (!themeColorMeta) return;

        const colors = {
            light: '#4a86e8',
            dark: '#1a1a1a',
            'high-contrast': '#000000',
            auto: '#4a86e8'
        };

        themeColorMeta.content = colors[theme] || colors.auto;
    }

    function loadTheme() {
        const savedTheme = localStorage.getItem(LS.themeKey);
        if (savedTheme) {
            settings.theme = savedTheme;
            applyTheme(savedTheme);
        } else {
            settings.theme = 'auto';
            applyTheme('auto');
        }
    }

    function saveTheme(theme) {
        settings.theme = theme;
        localStorage.setItem(LS.themeKey, theme);
        applyTheme(theme);
        showToast(`Theme set to ${theme}`);
    }

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

        const index = categories.indexOf(oldName);
        if (index !== -1) {
            categories[index] = newName.trim();
            saveCategories(categories);
        }

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

        const symbolsInCategory = symbols.filter(s => s.category === name);
        if (symbolsInCategory.length > 0) {
            if (!confirm(`This category contains ${symbolsInCategory.length} symbol(s). Deleting it will move these symbols to "Basic Communication". Continue?`)) {
                return false;
            }

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

        symbolCategoryInput.innerHTML = '';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            symbolCategoryInput.appendChild(option);
        });

        renderCategorySelect();
    }

    function showToast(msg, timeout = 2200) {
        if (!toast || !msg) return;

        toast.textContent = msg;
        toast.style.opacity = '1';
        toast.style.visibility = 'visible';

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.style.visibility = 'hidden';
            }, 300);
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
        if (!str) return false;
        if (isUrl(str)) return true;
        if (str.startsWith('data:image/')) return true;
        return false;
    }

    function toggleSettingsMenu() {
        settingsMenu.parentElement.classList.toggle('active');
    }

    function closeSettingsMenu() {
        settingsMenu.parentElement.classList.remove('active');
    }

    document.addEventListener('click', (e) => {
        if (!settingsToggle.contains(e.target) && !settingsMenu.contains(e.target)) {
            closeSettingsMenu();
        }
    });

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

        categories.forEach(category => {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item';
            categoryItem.innerHTML = `
                <input type="text" value="${category}" class="category-name-input">
                <div class="category-actions">
                    <button class="btn btn-secondary rename-category-btn" data-category="${category}">Rename</button>
                    <button class="btn btn-danger delete-category-btn" data-category="${category}">Delete</button>
                </div>
            `;
            categoriesList.appendChild(categoryItem);
        });

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

    function populateSettingsVoices() {
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
            const o = document.createElement('option');
            o.value = v.name;
            o.textContent = `${v.name} ${v.lang ? '(' + v.lang + ')' : ''}`;
            if (stored && stored === v.name) {
                o.selected = true;
                foundStored = true;
            }
            settingsVoiceSelect.appendChild(o);
        });

        if (!foundStored && voices.length > 0 && stored) {
            localStorage.removeItem(LS.voiceKey);
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
            if (event.error !== 'interrupted') {
                console.error('Speech synthesis error:', event);
            }
        };
        speechSynthesis.speak(ut);
    }

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

            function startPressTimer() {
                if (isEditMode) return;
                pressTimer = setTimeout(() => previewSpeak(symbol), 550);
            }

            function clearPressTimer() {
                clearTimeout(pressTimer);
                pressTimer = null;
            }

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
                    if (isEditMode) openEditModal(symbol);
                    else addToPhrase(symbol);
                }
                if (ev.key === 'e') {
                    if (isEditMode) openEditModal(symbol);
                }
            });

            communicationBoard.appendChild(node);
        });

        renderCategorySelect();
        applyGridSetting();
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

                setTimeout(() => {
                    item.style.opacity = '0.4';
                }, 0);
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

                document.querySelectorAll('.phrase-item').forEach(el => {
                    el.classList.remove('drag-over');
                });

                const afterElement = getDragAfterElement(phraseDisplay, e.clientX);
                if (afterElement) {
                    afterElement.classList.add('drag-over');
                }
            });

            item.addEventListener('dragenter', (e) => {
                e.preventDefault();
            });

            item.addEventListener('dragleave', (e) => {
                if (!item.contains(e.relatedTarget)) {
                    item.classList.remove('drag-over');
                }
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                const toIndex = index;

                if (!Number.isFinite(fromIndex)) return;
                if (fromIndex === toIndex) return;

                backupPhrase();
                const [moved] = currentPhrase.splice(fromIndex, 1);
                currentPhrase.splice(toIndex, 0, moved);
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

            if (offset < 0 && offset > closest.offset) {
                return {offset: offset, element: child};
            } else {
                return closest;
            }
        }, {offset: Number.NEGATIVE_INFINITY}).element;
    }

    function backupPhrase() {
        phraseHistory.push(JSON.stringify(currentPhrase));
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

    function speakPhrase() {
        if (currentPhrase.length === 0) return;
        const phraseText = currentPhrase.map(s => s.text).join(' ');

        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();

            const utter = new SpeechSynthesisUtterance(phraseText);
            utter.rate = 0.95;
            utter.pitch = 1;
            utter.volume = settings.volume;

            const chosen = localStorage.getItem(LS.voiceKey);
            if (chosen) {
                const voices = speechSynthesis.getVoices();
                const voice = voices.find(x => x.name === chosen);
                if (voice) {
                    utter.voice = voice;
                }
            }

            utter.onerror = (event) => {
                if (event.error === 'interrupted') {
                    return;
                }
                console.error('Speech synthesis error:', event);
                showToast('Speech error, trying without voice selection');
                if (chosen) {
                    localStorage.removeItem(LS.voiceKey);
                    const fallbackUtter = new SpeechSynthesisUtterance(phraseText);
                    fallbackUtter.rate = 0.95;
                    fallbackUtter.volume = settings.volume;
                    speechSynthesis.speak(fallbackUtter);
                }
            };

            speechSynthesis.speak(utter);
        } else {
            alert(phraseText);
        }
    }

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

        if (symbolImageFile.files && symbolImageFile.files[0]) {
            image = await fileToDataURL(symbolImageFile.files[0]);
        }

        if (!image) image = text.charAt(0) || '?';

        if (currentEditingSymbol && currentEditingSymbol.id) {
            const idx = symbols.findIndex(s => s.id === currentEditingSymbol.id);
            if (idx !== -1) {
                symbols[idx] = Object.assign({}, symbols[idx], {text, image, color, category});
            }
        } else {
            const newId = symbols.length > 0 ? Math.max(...symbols.map(s => s.id)) + 1 : 1;
            symbols.push({id: newId, text, image, color, category});
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

    function fileToDataURL(file) {
        return new Promise((res, rej) => {
            const r = new FileReader();
            r.onload = () => res(r.result);
            r.onerror = () => rej(new Error('File read error'));
            r.readAsDataURL(file);
        });
    }

    function exportJSON() {
        const payload = {
            symbols,
            settings,
            categories: getCategories()
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], {type: 'application/json'});
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
        evt.target.value = '';
        closeSettingsMenu();
    }

    function applyGridSetting() {
        const board = document.getElementById('communicationBoard');
        if (!board) return;
        board.classList.remove('grid-3x4', 'grid-4x6', 'grid-6x8');
        if (settings.gridSize === 'auto') {
            board.classList.remove('fixed-grid');
            board.style.gridTemplateColumns = '';
        } else {
            board.classList.add('fixed-grid');
            board.classList.add(`grid-${settings.gridSize}`);
            board.style.gridTemplateColumns = '';
        }
    }

    function populateVoices() {
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
            const o = document.createElement('option');
            o.value = v.name;
            o.textContent = `${v.name} ${v.lang ? '(' + v.lang + ')' : ''}`;
            if (stored && stored === v.name) {
                o.selected = true;
                foundStored = true;
            }
            settingsVoiceSelect.appendChild(o);
        });

        if (!foundStored && voices.length > 0 && stored) {
            localStorage.removeItem(LS.voiceKey);
            showToast('Previous voice not available, using default');
        }
    }

    function toggleEditMode() {
        isEditMode = !isEditMode;
        document.body.classList.toggle('edit-mode', isEditMode);
        editModeBtn.textContent = isEditMode ? 'Exit Edit Mode' : 'Edit Mode';
        renderBoard();
        closeSettingsMenu();
    }

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

    settingsThemeSelect.addEventListener('change', () => {
        saveTheme(settingsThemeSelect.value);
    });

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
        const selectedVoice = settingsVoiceSelect.value;
        if (selectedVoice) {
            localStorage.setItem(LS.voiceKey, selectedVoice);
            showToast(`Voice set to: ${selectedVoice}`);
        } else {
            localStorage.removeItem(LS.voiceKey);
            showToast('Using default voice');
        }
    });

    settingsToggle.addEventListener('click', toggleSettingsMenu);

    if (globalSearch) {
        globalSearch.addEventListener('input', renderBoard);
    }

    categorySelect.addEventListener('change', () => {
        settings.filterCategory = categorySelect.value;
        saveSettings();
        renderBoard();
    });

    symbolImageFile.addEventListener('change', () => {
    });

    settingsVoiceSelect.addEventListener('change', () => {
        const selectedVoice = settingsVoiceSelect.value;
        if (selectedVoice) {
            localStorage.setItem(LS.voiceKey, selectedVoice);
            showToast(`Voice set to: ${selectedVoice}`);
        } else {
            localStorage.removeItem(LS.voiceKey);
            showToast('Using default voice');
        }
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
        }
    });

    async function init() {
        loadSettings();
        await loadSymbols();
        loadTheme();
        updateCategorySelects();
        renderBoard();
        updatePhraseDisplay();

        applyGridSetting();

        function loadVoices() {
            const voices = speechSynthesis.getVoices();
            if (voices.length > 0) {
                populateVoices();
                populateSettingsVoices();
            } else {
                setTimeout(() => {
                    const retryVoices = speechSynthesis.getVoices();
                    if (retryVoices.length > 0) {
                        populateVoices();
                        populateSettingsVoices();
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