// Copyright (c) 2024-2026 Jericho Crosby (Chalwk). All Rights Reserved.

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

// Network-first, cache as fallback (and as the offline copy).
// Previously this was cache-first, which meant once a URL was cached it
// was served forever regardless of what was actually deployed - the cache
// was the source of truth instead of a fallback. Now the live network
// response is preferred whenever it's reachable, and the cache is only
// used when the network fails (i.e. offline).
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .then(networkResponse => {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });

                if (isManifestRequest(event.request)) {
                    return fixManifestResponse(networkResponse);
                }
                return networkResponse;
            })
            .catch(() => {
                return caches.match(event.request).then(cachedResponse => {
                    if (cachedResponse && isManifestRequest(event.request)) {
                        return fixManifestResponse(cachedResponse.clone());
                    }
                    return cachedResponse;
                });
            })
    );
});
