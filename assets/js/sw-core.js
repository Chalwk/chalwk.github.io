// Copyright (c) 2024-2026. Jericho Crosby (Chalwk)

// files to cache right away when service worker installs
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.webmanifest',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME) // CACHE_NAME is defined in each app's 'sw.js' file.
            .then(cache => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

function isManifestRequest(request) {
    const url = new URL(request.url);
    return url.pathname.endsWith('/manifest.webmanifest');
}

function fixManifestResponse(response) {
    const headers = new Headers(response.headers);
    headers.set('Content-Type', 'application/manifest+json');
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
    });
}

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    if (isManifestRequest(event.request)) {
                        return fixManifestResponse(cachedResponse.clone());
                    }
                    return cachedResponse;
                }
                return fetch(event.request).then(networkResponse => {
                    if (isManifestRequest(event.request)) {
                        return fixManifestResponse(networkResponse);
                    }
                    return networkResponse;
                });
            })
    );
});