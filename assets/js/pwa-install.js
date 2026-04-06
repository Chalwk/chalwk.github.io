// Copyright (c) 2024-2026. Jericho Crosby (Chalwk)

let deferredPrompt; // hang onto install event until user clicks our button

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // don't show the browser's default popup yet
    deferredPrompt = e; // stash it for later
    const container = document.getElementById('pwa-install-container');
    if (container) container.classList.add('visible'); // show install button
});

const installButton = document.getElementById('pwa-install-button');
if (installButton) {
    installButton.addEventListener('click', async () => {
        if (!deferredPrompt) return; // nothing to install? bail out
        deferredPrompt.prompt(); // now show the native install dialog
        // wait to see if user accepted or dismissed
        const {outcome} = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);
        deferredPrompt = null; // cleanup, can only be used once
        const container = document.getElementById('pwa-install-container');
        if (container) container.classList.remove('visible'); // hide button again
    });
}

// once the app is actually installed, hide the button just in case
window.addEventListener('appinstalled', () => {
    const container = document.getElementById('pwa-install-container');
    if (container) container.classList.remove('visible');
    deferredPrompt = null;
});