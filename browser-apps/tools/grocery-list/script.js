let groceryData = {};
let isOnline = navigator.onLine;

// Initialize the application
function initApp() {
    // Load data from localStorage
    const savedData = localStorage.getItem('groceryData');
    if (savedData) {
        groceryData = JSON.parse(savedData);
    } else {
        // Initialize with empty categories if no data exists
        groceryData = {
            "DINNER ESSENTIALS": [],
            "SCHOOL LUNCHES": [],
            "FRUIT": [],
            "VEGETABLES": [],
            "CEREAL": [],
            "SNACK FOODS AND CONVENIENCE ITEMS": [],
            "PERSONAL CARE": [],
            "CLEANING & HOUSEHOLD": [],
            "SPIDER ESSENTIALS": [],
            "TAKEOUT": [],
            "BEVERAGES": [],
            "DISPOSABLE SUPPLIES": [],
            "OTHER ESSENTIALS": []
        };
        saveData();
    }

    renderGroceries();
    setupEventListeners();
    updateStats();
    setupOnlineOfflineListener();
}

// Setup online/offline detection
function setupOnlineOfflineListener() {
    window.addEventListener('online', function() {
        isOnline = true;
        showStatusMessage('Back online', 'success');
    });

    window.addEventListener('offline', function() {
        isOnline = false;
        showStatusMessage('You are currently offline', 'warning');
    });

    // Show initial status
    if (!isOnline) {
        showStatusMessage('You are currently offline', 'warning');
    }
}

// Show status message
function showStatusMessage(message, type) {
    // Remove existing status message
    const existingStatus = document.querySelector('.status-message');
    if (existingStatus) {
        existingStatus.remove();
    }

    const statusEl = document.createElement('div');
    statusEl.className = `status-message status-${type}`;
    statusEl.textContent = message;

    // Add styles for status message
    statusEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 10px 15px;
        border-radius: 4px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        transition: opacity 0.3s;
    `;

    if (type === 'success') {
        statusEl.style.backgroundColor = '#2ecc71';
    } else if (type === 'warning') {
        statusEl.style.backgroundColor = '#f39c12';
    } else {
        statusEl.style.backgroundColor = '#e74c3c';
    }

    document.body.appendChild(statusEl);

    // Auto remove after 3 seconds for success messages
    if (type === 'success') {
        setTimeout(() => {
            statusEl.style.opacity = '0';
            setTimeout(() => statusEl.remove(), 300);
        }, 3000);
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('groceryData', JSON.stringify(groceryData));
}

// Function to create grocery cards
function createGroceryCard(grocery, category) {
    const card = document.createElement('div');
    card.className = 'grocery-card';
    card.dataset.category = category;

    // Check if item is marked as "needed" (from localStorage)
    const neededItems = JSON.parse(localStorage.getItem('neededGroceryItems') || '{}');
    const itemKey = `${category}-${grocery.name}`;
    const isNeeded = neededItems[itemKey] || false;

    if (isNeeded) {
        card.classList.add('needed');
    }

    let html = `
        <div class="grocery-header">
            <div class="grocery-name">
                <input type="checkbox" class="grocery-checkbox" ${isNeeded ? 'checked' : ''} data-key="${itemKey}">
                ${grocery.name}
            </div>
            <div class="grocery-actions">
                <button class="grocery-edit" data-category="${category}" data-item="${grocery.name}">✏️</button>
                <button class="grocery-delete" data-category="${category}" data-item="${grocery.name}">🗑️</button>
            </div>
        </div>
    `;

    if (grocery.price) {
        let displayPrice = grocery.price;
        if (!displayPrice.startsWith('$')) {
            displayPrice = '$' + displayPrice;
        }
        html += `<div class="grocery-price">${displayPrice}</div>`;
    }

    if (grocery.location) {
        html += `<div class="grocery-store">${grocery.location}</div>`;
    }

    if (grocery.description) {
        html += `<div class="grocery-description">${grocery.description}</div>`;
    }

    card.innerHTML = html;
    return card;
}

// Function to render all groceries
function renderGroceries() {
    const main = document.querySelector('main');
    main.innerHTML = '';

    for (const [category, items] of Object.entries(groceryData)) {
        const section = document.createElement('section');
        section.className = 'category-section';
        section.id = category.replace(/\s+/g, '-').toLowerCase();

        const categoryTitle = document.createElement('h2');
        categoryTitle.className = 'category-title';
        categoryTitle.innerHTML = `
                ${category}
                <div class="category-actions">
                    <button class="category-edit" data-category="${category}">✏️</button>
                    <button class="category-delete" data-category="${category}">🗑️</button>
                    <button class="category-toggle">▼</button>
                </div>
            `;

        const grid = document.createElement('div');
        grid.className = 'grocery-grid';
        grid.id = `${category.replace(/\s+/g, '-').toLowerCase()}Grid`;

        if (items.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'no-results';
            emptyMessage.textContent = 'No items in this category';
            grid.appendChild(emptyMessage);
        } else {
            items.forEach(item => {
                grid.appendChild(createGroceryCard(item, category));
            });
        }

        section.appendChild(categoryTitle);
        section.appendChild(grid);
        main.appendChild(section);
    }
}

// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');

    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        const allCards = document.querySelectorAll('.grocery-card');

        let hasVisibleResults = false;

        allCards.forEach(card => {
            const cardText = card.textContent.toLowerCase();

            if (cardText.includes(searchTerm)) {
                card.classList.remove('hidden');
                hasVisibleResults = true;
            } else {
                card.classList.add('hidden');
            }
        });

        // Show/hide category sections based on whether they have visible results
        const categorySections = document.querySelectorAll('.category-section');
        categorySections.forEach(section => {
            const sectionGrid = section.querySelector('.grocery-grid');
            const visibleCards = sectionGrid.querySelectorAll('.grocery-card:not(.hidden)');

            if (visibleCards.length > 0 || searchTerm.length === 0) {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        });

        // Show message if no results
        const noResultsElements = document.querySelectorAll('.no-results');
        noResultsElements.forEach(el => el.remove());

        if (!hasVisibleResults && searchTerm.length > 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = `No groceries found for "${searchTerm}"`;

            const firstGrid = document.querySelector('.grocery-grid');
            if (firstGrid) {
                firstGrid.parentNode.insertBefore(noResults, firstGrid);
            }
        }
    });
}

// Toggle purchased status
function setupCheckboxes() {
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('grocery-checkbox')) {
            const itemKey = e.target.dataset.key;
            const isChecked = e.target.checked;

            // Update localStorage under neededGroceryItems
            const neededItems = JSON.parse(localStorage.getItem('neededGroceryItems') || '{}');
            neededItems[itemKey] = isChecked;
            localStorage.setItem('neededGroceryItems', JSON.stringify(neededItems));

            // Update UI:
            const card = e.target.closest('.grocery-card');
            if (isChecked) {
                card.classList.add('needed');
            } else {
                card.classList.remove('needed');
            }

            updateStats();

            // Re-apply current filter when items are checked/unchecked
            const activeFilter = document.querySelector('.control-btn.active[data-filter]');
            if (activeFilter) {
                applyFilter(activeFilter.dataset.filter);
            }
        }
    });
}

// Filter functionality
function setupFilters() {
    const filterButtons = document.querySelectorAll('.control-btn[data-filter]');

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const filter = this.dataset.filter;
            applyFilter(filter);
        });
    });

    // Clear all button
    document.getElementById('clearAll').addEventListener('click', function() {
        if (confirm('Are you sure you want to clear all needed items?')) {
            localStorage.removeItem('neededGroceryItems');
            renderGroceries();
            updateStats();

            // Reset filter to all
            filterButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelector('.control-btn[data-filter="all"]').classList.add('active');
            applyFilter('all');
        }
    });
}

// Apply filter to all items
function applyFilter(filter) {
    const allCards = document.querySelectorAll('.grocery-card');
    const allSections = document.querySelectorAll('.category-section');

    allSections.forEach(section => {
        const grid = section.querySelector('.grocery-grid');
        const visibleCards = Array.from(grid.querySelectorAll('.grocery-card')).filter(card => {
            const isNeeded = card.classList.contains('needed');

            switch(filter) {
                case 'all':
                    card.style.display = 'flex';
                    return true;
                case 'needed':
                    if (isNeeded) {
                        card.style.display = 'flex';
                        return true;
                    } else {
                        card.style.display = 'none';
                        return false;
                    }
                default:
                    card.style.display = 'flex';
                    return true;
            }
        });

        // Show/hide category section based on whether it has visible items
        if (visibleCards.length === 0 && filter === 'needed') {
            section.style.display = 'none';
        } else {
            section.style.display = 'block';
        }

        // Show empty message if no items in category after filtering
        const existingEmptyMessage = grid.querySelector('.no-results');
        if (existingEmptyMessage) {
            existingEmptyMessage.remove();
        }

        if (visibleCards.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'no-results';

            if (filter === 'needed') {
                emptyMessage.textContent = 'No needed items in this category';
            } else {
                emptyMessage.textContent = 'No items in this category';
            }

            grid.appendChild(emptyMessage);
        }
    });
}

// Toggle category visibility
function setupCategoryToggles() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('category-toggle')) {
            const section = e.target.closest('.category-section');
            const grid = section.querySelector('.grocery-grid');

            if (grid.style.display === 'none') {
                grid.style.display = 'grid';
                e.target.textContent = '▼';
            } else {
                grid.style.display = 'none';
                e.target.textContent = '►';
            }
        }
    });
}

// Update statistics
function updateStats() {
    const totalItems = Object.values(groceryData).flat().length;
    const neededItems = JSON.parse(localStorage.getItem('neededGroceryItems') || '{}');
    const neededCount = Object.values(neededItems).filter(Boolean).length;

    // Calculate total price of needed items
    let totalPrice = 0;
    Object.entries(neededItems).forEach(([key, isNeeded]) => {
        if (isNeeded) {
            const parts = key.split('-');
            const category = parts.slice(0, -1).join('-');
            const itemName = parts[parts.length - 1];

            if (groceryData[category]) {
                const item = groceryData[category].find(i => i.name === itemName);
                if (item && item.price) {
                    const priceString = item.price.replace(/[^\d.-]/g, '');
                    const priceValue = parseFloat(priceString);
                    if (!isNaN(priceValue)) {
                        totalPrice += priceValue;
                    }
                }
            }
        }
    });

    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('neededItems').textContent = neededCount;
    document.getElementById('totalPrice').textContent = `$${totalPrice.toFixed(2)}`;
}

// Export functionality
function setupExport() {
    document.getElementById('exportBtn').addEventListener('click', function() {
        const dataToExport = {
            groceryData: groceryData,
            neededItems: JSON.parse(localStorage.getItem('neededGroceryItems') || '{}')
        };

        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});

        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'grocery-list.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });
}

// Import functionality
function setupImport() {
    const fileInput = document.getElementById('importFile');

    document.getElementById('importBtn').addEventListener('click', function() {
        fileInput.click();
    });

    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);

                if (importedData.groceryData) {
                    groceryData = importedData.groceryData;
                    saveData();
                }

                if (importedData.neededItems) {
                    localStorage.setItem('neededGroceryItems', JSON.stringify(importedData.neededItems));
                }

                renderGroceries();
                updateStats();

                // Apply current filter after import
                const activeFilter = document.querySelector('.control-btn.active[data-filter]');
                if (activeFilter) {
                    applyFilter(activeFilter.dataset.filter);
                }

                alert('Grocery list imported successfully!');
            } catch (error) {
                alert('Error importing file: ' + error.message);
            }
        };
        reader.readAsText(file);

        // Reset file input
        fileInput.value = '';
    });
}

// Category management
function setupCategoryManagement() {
    const categoryModal = document.getElementById('categoryModal');
    const categoryForm = document.getElementById('categoryForm');
    const categoryNameInput = document.getElementById('categoryName');
    const cancelCategoryBtn = document.getElementById('cancelCategory');
    const closeButtons = document.querySelectorAll('.close');

    let currentCategory = null;

    // Open modal for adding category
    document.getElementById('addCategoryBtn').addEventListener('click', function() {
        document.getElementById('categoryModalTitle').textContent = 'Add Category';
        categoryNameInput.value = '';
        currentCategory = null;
        categoryModal.style.display = 'block';
    });

    // Edit category
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('category-edit')) {
            currentCategory = e.target.dataset.category;
            document.getElementById('categoryModalTitle').textContent = 'Edit Category';
            categoryNameInput.value = currentCategory;
            categoryModal.style.display = 'block';
        }
    });

    // Delete category
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('category-delete')) {
            const category = e.target.dataset.category;
            if (confirm(`Are you sure you want to delete the category "${category}" and all its items?`)) {
                delete groceryData[category];
                saveData();
                renderGroceries();

                const activeFilter = document.querySelector('.control-btn.active[data-filter]');
                if (activeFilter) {
                    applyFilter(activeFilter.dataset.filter);
                }

                updateStats();
            }
        }
    });

    // Save category
    categoryForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const newCategoryName = categoryNameInput.value.trim();

        if (newCategoryName) {
            if (currentCategory && currentCategory !== newCategoryName) {
                // Rename category
                groceryData[newCategoryName] = groceryData[currentCategory];
                delete groceryData[currentCategory];
            } else if (!currentCategory) {
                // Add new category
                if (!groceryData[newCategoryName]) {
                    groceryData[newCategoryName] = [];
                }
            }

            saveData();
            renderGroceries();
            categoryModal.style.display = 'none';
        }
    });

    // Cancel category edit
    cancelCategoryBtn.addEventListener('click', function() {
        categoryModal.style.display = 'none';
    });

    // Close modals when clicking X
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            categoryModal.style.display = 'none';
            document.getElementById('itemModal').style.display = 'none';
        });
    });

    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === categoryModal) {
            categoryModal.style.display = 'none';
        }
        if (e.target === document.getElementById('itemModal')) {
            document.getElementById('itemModal').style.display = 'none';
        }
    });
}

// Item management
function setupItemManagement() {
    const itemModal = document.getElementById('itemModal');
    const itemForm = document.getElementById('itemForm');
    const itemCategorySelect = document.getElementById('itemCategory');
    const itemNameInput = document.getElementById('itemName');
    const itemPriceInput = document.getElementById('itemPrice');
    const itemLocationInput = document.getElementById('itemLocation');
    const itemDescriptionInput = document.getElementById('itemDescription');
    const cancelItemBtn = document.getElementById('cancelItem');
    const deleteItemBtn = document.getElementById('deleteItem');

    let currentItem = null;
    let currentItemCategory = null;

    // Open modal for adding item
    document.getElementById('addItemBtn').addEventListener('click', function() {
        populateCategorySelect();
        document.getElementById('itemModalTitle').textContent = 'Add Item';
        clearItemForm();
        currentItem = null;
        currentItemCategory = null;
        deleteItemBtn.style.display = 'none';
        itemModal.style.display = 'block';
    });

    // Edit item
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('grocery-edit')) {
            currentItemCategory = e.target.dataset.category;
            currentItem = e.target.dataset.item;

            const item = groceryData[currentItemCategory].find(i => i.name === currentItem);
            if (item) {
                populateCategorySelect();
                document.getElementById('itemModalTitle').textContent = 'Edit Item';
                itemCategorySelect.value = currentItemCategory;
                itemNameInput.value = item.name || '';
                itemPriceInput.value = item.price || '';
                itemLocationInput.value = item.location || '';
                itemDescriptionInput.value = item.description || '';
                deleteItemBtn.style.display = 'block';
                itemModal.style.display = 'block';
            }
        }
    });

    // Delete item
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('grocery-delete')) {
            const category = e.target.dataset.category;
            const itemName = e.target.dataset.item;

            if (confirm(`Are you sure you want to delete "${itemName}"?`)) {
                groceryData[category] = groceryData[category].filter(item => item.name !== itemName);
                saveData();
                renderGroceries();

                // Apply current filter after changes
                const activeFilter = document.querySelector('.control-btn.active[data-filter]');
                if (activeFilter) {
                    applyFilter(activeFilter.dataset.filter);
                }

                updateStats();
            }
        }
    });

    // Delete item from modal
    deleteItemBtn.addEventListener('click', function() {
        if (currentItem && currentItemCategory) {
            if (confirm(`Are you sure you want to delete "${currentItem}"?`)) {
                groceryData[currentItemCategory] = groceryData[currentItemCategory].filter(item => item.name !== currentItem);
                saveData();
                renderGroceries();
                updateStats();
                itemModal.style.display = 'none';
            }
        }
    });

    // Save item
    itemForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const category = itemCategorySelect.value;
        const name = itemNameInput.value.trim();
        let price = itemPriceInput.value.trim();
        const location = itemLocationInput.value.trim();
        const description = itemDescriptionInput.value.trim();

        if (price && !price.startsWith('$')) {
            price = '$' + price;
        }

        if (name && category) {
            const newItem = {
                name: name,
                price: price,
                location: location,
                description: description
            };

            if (currentItem && currentItemCategory) {
                // Editing existing item
                if (currentItemCategory === category) {
                    // Same category - update item
                    const index = groceryData[category].findIndex(item => item.name === currentItem);
                    if (index !== -1) {
                        groceryData[category][index] = newItem;
                    }
                } else {
                    // Different category - remove from old, add to new
                    groceryData[currentItemCategory] = groceryData[currentItemCategory].filter(item => item.name !== currentItem);
                    groceryData[category].push(newItem);
                }
            } else {
                // Adding new item
                if (!groceryData[category]) {
                    groceryData[category] = [];
                }
                groceryData[category].push(newItem);
            }

            saveData();
            renderGroceries();
            updateStats();
            itemModal.style.display = 'none';
        }
    });

    // Cancel item edit
    cancelItemBtn.addEventListener('click', function() {
        itemModal.style.display = 'none';
    });

    // Populate category select
    function populateCategorySelect() {
        itemCategorySelect.innerHTML = '';
        Object.keys(groceryData).forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            itemCategorySelect.appendChild(option);
        });
    }

    // Clear item form
    function clearItemForm() {
        itemNameInput.value = '';
        itemPriceInput.value = '';
        itemLocationInput.value = '';
        itemDescriptionInput.value = '';
    }
}

// Setup all event listeners
function setupEventListeners() {
    setupSearch();
    setupCheckboxes();
    setupFilters();
    setupCategoryToggles();
    setupExport();
    setupImport();
    setupCategoryManagement();
    setupItemManagement();
}

// Initialize the page
document.addEventListener('DOMContentLoaded', initApp);