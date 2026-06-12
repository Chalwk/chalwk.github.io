// Copyright (c) 2024-2026. Jericho Crosby (Chalwk)

(function () {
    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallButton();
    });

    function showInstallButton() {
        const container = document.getElementById('pwa-install-container');
        const button = document.getElementById('pwa-install-button');
        if (!container || !button || !deferredPrompt) return;

        container.classList.add('visible');
        button.textContent = 'Install App';

        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        newButton.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response: ${outcome}`);
            deferredPrompt = null;
            container.classList.remove('visible');
        });
    }

    window.addEventListener('appinstalled', () => {
        const container = document.getElementById('pwa-install-container');
        if (container) container.classList.remove('visible');
        deferredPrompt = null;
    });
})();