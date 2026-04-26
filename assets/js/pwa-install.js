// Copyright (c) 2024-2026. Jericho Crosby (Chalwk)

let deferredPrompt;

const container = document.getElementById('pwa-install-container');
const button = document.getElementById('pwa-install-button');

// Don't show the button if the app is already running as a PWA
function isAppInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone // iOS Safari
        || document.referrer.includes('android-app://');
}

if (container && button && !isAppInstalled()) {
    // Always show the install button – we decide what happens on click
    container.classList.add('visible');

    button.addEventListener('click', async () => {
        if (deferredPrompt) {
            // Browser supports native install prompt (Chrome, Edge, Samsung Internet…)
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`Install prompt outcome: ${outcome}`);
            deferredPrompt = null;
            container.classList.remove('visible');
        } else {
            // Fallback for Firefox, Safari desktop, etc.
            alert(
                'To install this app, look for:\n' +
                '• Firefox: Menu ☰ → “Install …”\n' +
                '• Chrome/Edge: ⋮ → “Install HearMeOut…”\n' +
                '• Safari: Share → “Add to Dock”\n' +
                'You may need to use the browser’s main menu.'
            );
            // Hide the button after showing instructions:
            // container.classList.remove('visible');
        }
    });
}

// Still listen for the standard install prompt event (Chrome-like browsers)
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();       // suppress the mini-infobar
    deferredPrompt = e;       // stash for later
    if (container) container.classList.add('visible');
});

// Clean up if the app gets installed later
window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    if (container) container.classList.remove('visible');
});