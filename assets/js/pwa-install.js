// Copyright (c) 2024-2026. Jericho Crosby (Chalwk)

(function () {
    let deferredPrompt;
    let installSupported = false; // becomes true when beforeinstallprompt fires

    // Listen for the native event (Chrome/Edge/Opera)
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installSupported = true;
        updateInstallUI();
    });

    function updateInstallUI() {
        const container = document.getElementById('pwa-install-container');
        const button = document.getElementById('pwa-install-button');
        if (!container || !button) return;

        if (installSupported && deferredPrompt) {
            // Native install prompt is available – wire it up
            container.classList.add('visible');
            button.textContent = 'Install App';
            // Replace previous click listeners
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            newButton.addEventListener('click', async () => {
                if (!deferredPrompt) return;
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response to install prompt: ${outcome}`);
                deferredPrompt = null;
                container.classList.remove('visible');
            });
        } else if (!installSupported) {
            // Fallback for Firefox, Safari, etc.
            container.classList.add('visible');
            button.textContent = 'Install App';
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            newButton.addEventListener('click', () => {
                alert(
                    'To install this app:\n\n' +
                    '• On mobile: Tap ⫶ or ☰, then select "Add to Home Screen" or "Install".\n' +
                    '• On desktop: Look for an install icon in the address bar or browser menu.'
                );
            });
        } else {
            // Prompt already shown or dismissed – hide the button
            container.classList.remove('visible');
        }
    }

    // Show fallback button early if 'beforeinstallprompt' hasn’t fired by DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (!installSupported) updateInstallUI();
        });
    } else {
        if (!installSupported) updateInstallUI();
    }

    // Hide the button once the app is actually installed
    window.addEventListener('appinstalled', () => {
        const container = document.getElementById('pwa-install-container');
        if (container) container.classList.remove('visible');
        deferredPrompt = null;
        installSupported = true; // not strictly needed
    });
})();