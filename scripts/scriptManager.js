hljs.highlightAll();

const scriptCache = {};
let scriptMetadata = {};

const returnTopBtn = document.getElementById('returnTopBtn');

function showReturnTop() { returnTopBtn.style.display = 'block'; }
function hideReturnTop() { returnTopBtn.style.display = 'none'; }

returnTopBtn.addEventListener('click', () => {
    // Hide the script detail panel
    document.getElementById('scriptDetail').style.display = 'none';
    hideReturnTop();

    // Remove ?script=... from the URL without reloading
    const url = new URL(window.location);
    url.searchParams.delete('script');
    window.history.replaceState({}, '', url);

    // Scroll back to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ---------------
// Load metadata from HSP GitHub repo
// ---------------
const RAW_METADATA_URL = 'https://raw.githubusercontent.com/Chalwk/HALO-SCRIPT-PROJECTS/master/metadata.json';
const RAW_REPO_BASE = 'https://raw.githubusercontent.com/Chalwk/HALO-SCRIPT-PROJECTS/master/';
const RELEASES_API_URL = "https://api.github.com/repos/Chalwk/HALO-SCRIPT-PROJECTS/releases";

fetch(RAW_METADATA_URL)
    .then(res => res.json())
    .then(metadata => {
    scriptMetadata = metadata;
    renderScripts();
    autoOpenFromURL(); // run after scripts are rendered
})
    .catch(err => console.error('Error loading script metadata:', err));

fetch(RELEASES_API_URL)
    .then(res => res.json())
    .then(releases => renderReleases(releases))
    .catch(err => console.error("Error loading flagship releases:", err));

// ---------------
// Render scripts into categories
// ---------------
function renderScripts() {
    for (const categoryName in scriptMetadata) {
        const categoryScripts = scriptMetadata[categoryName];
        const categoryId = categoryName.toLowerCase().replace(/\s+/g, '-');
        const container = document.querySelector(`#${categoryId} .script-grid`);
        if (!container) continue;

        for (const scriptId in categoryScripts) {
            const meta = categoryScripts[scriptId];

            const card = document.createElement('div');
            card.className = 'script-card';
            card.innerHTML = `
                <div class="script-header">
                    <h3>
                        <a href="?script=${categoryName}/${scriptId}" class="script-link">
                            ${meta.title}
                        </a>
                    </h3>
                    <p>${meta.shortDescription}</p>
                </div>
                <div class="script-content">
                    <div class="script-actions">
                        <button class="action-btn view-btn" data-script="${categoryName}/${scriptId}">
                            <i class="fas fa-eye"></i> View Script
                        </button>
                        <button class="action-btn copy-btn" data-script="${categoryName}/${scriptId}">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                        <button class="action-btn download-btn" data-script="${categoryName}/${scriptId}">
                            <i class="fas fa-download"></i> Download
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        }
    }

    attachEventListeners();
    setupCollapsibleCategories();
    setupSearch();
}

// ---------------
// Render releases
// ---------------
function renderReleases(releases) {
    const container = document.querySelector("#flagship_releases .script-grid");
    if (!container) return;

    releases.forEach(release => {
        const asset = release.assets.find(a => a.name.endsWith(".zip"));
        if (!asset) return;

        const card = document.createElement("div");
        card.className = "script-card";
        card.innerHTML = `
            <div class="script-header">
                <h3>${release.name}</h3>
                <p>${release.body ? release.body.substring(0,150) + "..." : "No description provided."}</p>
            </div>
            <div class="script-content">
                <div class="script-actions">
                    <a href="${asset.browser_download_url}" class="action-btn download-btn" target="_blank">
                        <i class="fas fa-download"></i> Download ZIP
                    </a>
                    <a href="${release.html_url}" class="action-btn view-btn" target="_blank">
                        <i class="fas fa-eye"></i> View Release
                    </a>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// ---------------
// Fetch script from GitHub
// ---------------
function fetchScript(scriptPath) {
    const [category, scriptId] = scriptPath.split('/');
    const meta = scriptMetadata[category][scriptId];
    if (!meta) return Promise.reject('Metadata missing');

    const url = `${RAW_REPO_BASE}sapp/${category}/${meta.filename}`;

    return fetch(url)
        .then(res => res.ok ? res.text() : Promise.reject(`Network error: ${res.status}`))
        .then(data => {
        scriptCache[scriptPath] = data;
        return data;
    });
}

function getScript(scriptPath, callback) {
    if (scriptCache[scriptPath]) callback(scriptCache[scriptPath]);
    else fetchScript(scriptPath).then(code => callback(code)).catch(console.error);
}

// ---------------
// Event Listeners
// ---------------
function attachEventListeners() {
    document.querySelectorAll('.view-btn').forEach(button => {
        button.addEventListener('click', function() {
            const scriptPath = this.getAttribute('data-script');
            openScriptDetail(scriptPath);
        });
    });

    document.querySelectorAll('.copy-btn').forEach(button => {
        button.addEventListener('click', function() {
            const scriptPath = this.getAttribute('data-script');
            getScript(scriptPath, code => {
                navigator.clipboard.writeText(code).then(() => showToast('Code copied to clipboard!'));
            });
        });
    });

    document.querySelectorAll('.download-btn').forEach(button => {
        button.addEventListener('click', function() {
            const scriptPath = this.getAttribute('data-script');
            const [category, scriptId] = scriptPath.split('/');
            const meta = scriptMetadata[category][scriptId];
            if (!meta) return;

            getScript(scriptPath, code => {
                const blob = new Blob([code], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = meta.filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showToast('Download started!');
            });
        });
    });
}

function openScriptDetail(scriptPath) {
    const [category, scriptId] = scriptPath.split('/');
    const meta = scriptMetadata[category][scriptId];
    if (!meta) return;

    getScript(scriptPath, code => {
        document.getElementById('scriptTitle').textContent = meta.title;
        document.getElementById('scriptFullDescription').textContent = meta.description;
        document.getElementById('scriptCode').textContent = code;
        hljs.highlightElement(document.getElementById('scriptCode'));
        document.querySelector('.code-header div').textContent = meta.filename;
        document.getElementById('downloadCodeBtn').setAttribute('data-script', scriptPath);
        document.getElementById('scriptDetail').style.display = 'block';
        document.getElementById('scriptDetail').scrollIntoView({ behavior: 'smooth' });
        showReturnTop();
    });
}

document.getElementById('closeDetail').addEventListener('click', () => {
    document.getElementById('scriptDetail').style.display = 'none';
    hideReturnTop();
});

document.getElementById('copyCodeBtn').addEventListener('click', () => {
    const code = document.getElementById('scriptCode').textContent;
    navigator.clipboard.writeText(code).then(() => showToast('Code copied to clipboard!'));
});

document.getElementById('downloadCodeBtn').addEventListener('click', function() {
    const scriptPath = this.getAttribute('data-script');
    const code = scriptCache[scriptPath];
    if (!code) return;
    const [category, scriptId] = scriptPath.split('/');
    const meta = scriptMetadata[category][scriptId];
    if (!meta) return;

    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = meta.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Download started!');
});

// ---------------
// Toast Notification
// ---------------
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.querySelector('span').textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ---------------
// Collapsible categories
// ---------------
function setupCollapsibleCategories() {
    // Include both regular categories and flagship releases
    const allCategories = document.querySelectorAll('.script-category, #flagship_releases');

    allCategories.forEach(category => {
        category.classList.add('collapsed');
        const header = category.querySelector('h2');
        const grid = category.querySelector('.script-grid');

        header.addEventListener('click', () => {
            const isCollapsed = category.classList.toggle('collapsed');
            grid.style.display = isCollapsed ? 'none' : 'grid';
        });
    });
}

// ---------------
// Search functionality
// ---------------
function setupSearch() {
    const searchInput = document.getElementById('scriptSearch');
    let searchTimeout;

    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(searchInput.value);
        }, 300); // Delay search by 300ms for better performance
    });

    // Also trigger search on Enter key
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch(searchInput.value);
        }
    });
}

function performSearch(query) {
    const searchTerm = query.toLowerCase().trim();

    // If search is empty, show all categories and cards
    if (!searchTerm) {
        resetSearch();
        return;
    }

    // Include flagship releases in search
    const allCategories = document.querySelectorAll('.script-category, #flagship_releases');
    let totalMatches = 0;

    allCategories.forEach(category => {
        const cards = category.querySelectorAll('.script-card');
        let categoryMatches = 0;

        cards.forEach(card => {
            const titleElement = card.querySelector('h3');
            const descElement = card.querySelector('p');

            if (titleElement && descElement) {
                const title = titleElement.textContent.toLowerCase();
                const desc = descElement.textContent.toLowerCase();
                const matches = title.includes(searchTerm) || desc.includes(searchTerm);

                if (matches) {
                    card.style.display = '';
                    categoryMatches++;
                    totalMatches++;
                } else {
                    card.style.display = 'none';
                }
            }
        });

        const grid = category.querySelector('.script-grid');
        if (grid) {
            if (categoryMatches > 0) {
                category.classList.remove('collapsed');
                grid.style.display = 'grid';
            } else {
                category.classList.add('collapsed');
                grid.style.display = 'none';
            }
        }
    });

    // Show message if no results found
    if (totalMatches === 0) {
        showNoResultsMessage(searchTerm);
    } else {
        hideNoResultsMessage();
    }
}

function resetSearch() {
    const allCategories = document.querySelectorAll('.script-category, #flagship_releases');

    allCategories.forEach(category => {
        const cards = category.querySelectorAll('.script-card');
        cards.forEach(card => {
            card.style.display = '';
        });

        // Keep categories in their default state (you might want to remember collapsed state)
        const grid = category.querySelector('.script-grid');
        if (grid) {
            if (category.classList.contains('collapsed')) {
                grid.style.display = 'none';
            } else {
                grid.style.display = 'grid';
            }
        }
    });

    hideNoResultsMessage();
}

function showNoResultsMessage(searchTerm) {
    let noResultsMsg = document.getElementById('noResultsMessage');
    if (!noResultsMsg) {
        noResultsMsg = document.createElement('div');
        noResultsMsg.id = 'noResultsMessage';
        noResultsMsg.className = 'no-results-message';
        document.querySelector('.container').appendChild(noResultsMsg);
    }
    noResultsMsg.innerHTML = `No scripts found for "<strong>${searchTerm}</strong>"`;
    noResultsMsg.style.display = 'block';
}

function hideNoResultsMessage() {
    const noResultsMsg = document.getElementById('noResultsMessage');
    if (noResultsMsg) {
        noResultsMsg.style.display = 'none';
    }
}

// ---------------
// Auto-open script from URL (?script=...)
// ---------------
function autoOpenFromURL() {
    const params = new URLSearchParams(window.location.search);
    const scriptPath = params.get('script');
    if (scriptPath) {
        openScriptDetail(scriptPath);
    }
}
