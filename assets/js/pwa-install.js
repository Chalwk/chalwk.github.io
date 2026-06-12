// Copyright (c) 2024-2026. Jericho Crosby (Chalwk)

(function () {
    let deferredPrompt;

    function showInstallButton() {
        let container = document.getElementById('pwa-install-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'pwa-install-container';
            container.style.position = 'fixed';
            container.style.bottom = '20px';
            container.style.right = '20px';
            container.style.zIndex = '9999';
            container.innerHTML = '<button id="pwa-install-button">Install App</button>';
            document.body.appendChild(container);
        }

        const button = document.getElementById('pwa-install-button');
        if (!button) return;

        container.style.display = 'block';
        button.textContent = 'Install App';

        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        newButton.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response: ${outcome}`);
            deferredPrompt = null;
            container.style.display = 'none';
        });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallButton();
    });

    window.addEventListener('appinstalled', () => {
        const container = document.getElementById('pwa-install-container');
        if (container) container.style.display = 'none';
        deferredPrompt = null;
    });
})();