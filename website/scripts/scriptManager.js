hljs.highlightAll();

const scriptCache = {};
let scriptMetadata = {};

const returnTopBtn = document.getElementById('returnTopBtn');

function showReturnTop() { returnTopBtn.style.display = 'block'; }
function hideReturnTop() { returnTopBtn.style.display = 'none'; }

returnTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ---------------
// Load metadata from HSP GitHub repo
// ---------------
const RAW_METADATA_URL = 'https://raw.githubusercontent.com/Chalwk/HALO-SCRIPT-PROJECTS/master/metadata.json';
const RAW_REPO_BASE = 'https://raw.githubusercontent.com/Chalwk/HALO-SCRIPT-PROJECTS/master/';
const RELEASES_API_URL = "https://api.github.com/repos/Chalwk/HALO-SCRIPT-PROJECTS/releases";
//const RELEASES_API_URL = "https://raw.githubusercontent.com/Chalwk/HALO-SCRIPT-PROJECTS/master/flagship_metadata.json";

fetch(RAW_METADATA_URL)
    .then(res => res.json())
    .then(metadata => {
        scriptMetadata = metadata;
        renderScripts();
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
                    <h3>${meta.title}</h3>
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

//function renderReleases(releases) {
//    const container = document.querySelector("#flagship_releases .script-grid");
//    if (!container) return;
//
//    releases.forEach(release => {
//        const asset = release.assets.find(a => a.name.endsWith(".zip"));
//        if (!asset) return;
//
//        const card = document.createElement("div");
//        card.className = "script-card";
//        card.innerHTML = `
//            <div class="script-header">
//                <h3><a href="${release.html_url}" target="_blank">${release.name || release.tag_name}</a></h3>
//                <p>${release.body ? release.body.replace(/\r?\n|\r/g, " ").substring(0, 150) + "..." : "No description provided."}</p>
//            </div>
//            <div class="script-content">
//                <div class="script-actions">
//                    <a href="${asset.download_url}" class="action-btn download-btn" target="_blank">
//                        <i class="fas fa-download"></i> ${asset.name}
//                    </a>
//                </div>
//            </div>
//        `;
//        container.appendChild(card);
//    });
//}

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
            const [category, scriptId] = scriptPath.split('/');
            const meta = scriptMetadata[category][scriptId];
            if (!meta) return;

            getScript(scriptPath, code => {
                document.getElementById('scriptTitle').textContent = meta.title;
                document.getElementById('scriptFullDescription').textContent = meta.description;
                document.getElementById('scriptCode').textContent = code;
                hljs.highlightElement(document.getElementById('scriptCode'));
                document.querySelector('.code-header div').textContent = meta.filename; // script name
                document.getElementById('downloadCodeBtn').setAttribute('data-script', scriptPath);
                document.getElementById('scriptDetail').style.display = 'block';
                document.getElementById('scriptDetail').scrollIntoView({ behavior: 'smooth' });
                showReturnTop();
            });
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
    document.querySelectorAll('.script-category').forEach(category => {
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

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();

        document.querySelectorAll('.script-category').forEach(category => {
            const cards = category.querySelectorAll('.script-card');
            let anyVisible = false;

            cards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const desc = card.querySelector('p').textContent.toLowerCase();

                if (title.includes(query) || desc.includes(query)) {
                    card.style.display = '';
                    anyVisible = true;
                } else {
                    card.style.display = 'none';
                }
            });

            const grid = category.querySelector('.script-grid');
            if (anyVisible) {
                category.classList.remove('collapsed');
                grid.style.display = 'grid';
            } else {
                category.classList.add('collapsed');
                grid.style.display = 'none';
            }
        });
    });
}
