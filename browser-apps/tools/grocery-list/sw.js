/*
Copyright (c) 2025-2026. Jericho Crosby (Chalwk)

Grocery List - JavaScript (service worker)
*/

const CACHE_NAME = 'grocery-list-v1.0.0';
const urlsToCache = [
    '/browser-apps/tools/grocery-list/',
    '/browser-apps/tools/grocery-list/index.html',
    '/browser-apps/tools/grocery-list/style.css',
    '/browser-apps/tools/grocery-list/script.js',
    '/browser-apps/tools/grocery-list/manifest.json',
    '/browser-apps/tools/grocery-list/icons/icon-192x192.png',
    '/browser-apps/tools/grocery-list/icons/icon-512x512.png'
];

self.addEventListener('install', function(event) {
    console.log('Service Worker installing.');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
            console.log('Opened cache');
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('activate', function(event) {
    console.log('Service Worker activating.');
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
            if (response) {
                return response;
            }

            const fetchRequest = event.request.clone();

            return fetch(fetchRequest).then(
                function(response) {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then(function(cache) {
                        cache.put(event.request, responseToCache);
                    });

                    return response;
                }
            ).catch(function() {
                console.log('Fetch failed; returning offline page.');
            });
        })
    );
});