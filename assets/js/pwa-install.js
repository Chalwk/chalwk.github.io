// Copyright (c) 2024-2026. Jericho Crosby (Chalwk)

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installContainer = document.getElementById('pwa-install-container');
    if (installContainer) installContainer.style.display = 'block';
});

const installButton = document.getElementById('pwa-install-button');
if (installButton) {
    installButton.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        deferredPrompt = null;
        document.getElementById('pwa-install-container').style.display = 'none';
    });
}

window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    document.getElementById('pwa-install-container').style.display = 'none';
    deferredPrompt = null;
});