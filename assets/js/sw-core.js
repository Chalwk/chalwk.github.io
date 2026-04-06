// Copyright (c) 2024-2026. Jericho Crosby (Chalwk)

// files to cache right away when service worker installs
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
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

// fetch: try cache first, fall back to network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});