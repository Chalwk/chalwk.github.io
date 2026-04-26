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

// install event: fetch and cache all those files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME) // CACHE_NAME is defined in relevant app sw.js
            .then(cache => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting()) // activate immediately, no waiting
    );
});

// activate: clean up old caches, then take control of all clients
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache); // bye bye old caches
                    }
                })
            );
        }).then(() => self.clients.claim()) // start intercepting fetches right away
    );
});

// Helper to check if a request is for the manifest
function isManifestRequest(request) {
    const url = new URL(request.url);
    return url.pathname.endsWith('/manifest.webmanifest');
}

// Helper to return a new Response with the corrected content type
function fixManifestResponse(response) {
    const headers = new Headers(response.headers);
    headers.set('Content-Type', 'application/manifest+json');
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
    });
}

// fetch: try cache first, fall back to network – with manifest MIME fix
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // Serve from cache, but fix MIME type if it's the manifest
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