/*
	Copyright (c) 2025-2026. Jericho Crosby (Chalwk)

    Social Script Builder JavaScript
*/

const CACHE_NAME = 'social-script-builder-v1.2';
const urlsToCache = [
    '/browser-apps/tools/social-script-builder/',
    '/browser-apps/tools/social-script-builder/index.html',
    '/browser-apps/tools/social-script-builder/style.css',
    '/browser-apps/tools/social-script-builder/script.js',
    '/browser-apps/tools/social-script-builder/icons/icon-192x192.png',
    '/browser-apps/tools/social-script-builder/icons/icon-512x512.png'
];

self.addEventListener('install', event => {
    console.log('Service Worker installing.');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
            console.log('Opened cache');
            return cache.addAll(urlsToCache);
        })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    console.log('Service Worker activating.');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
            return response || fetch(event.request);
        })
            .catch(() => {
            if (event.request.destination === 'document') {
                return caches.match('/browser-apps/tools/social-script-builder/index.html');
            }
        })
    );
});