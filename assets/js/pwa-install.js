// Copyright (c) 2024-2026. Jericho Crosby (Chalwk)

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const container = document.getElementById('pwa-install-container');
    if (container) container.classList.add('visible');
});

const installButton = document.getElementById('pwa-install-button');
if (installButton) {
    installButton.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        // noinspection JSUnresolvedVariable
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);
        deferredPrompt = null;
        const container = document.getElementById('pwa-install-container');
        if (container) container.classList.remove('visible');
    });
}

window.addEventListener('appinstalled', () => {
    const container = document.getElementById('pwa-install-container');
    if (container) container.classList.remove('visible');
    deferredPrompt = null;
});