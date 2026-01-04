/*
Copyright (c) 2025-2026. Jericho Crosby (Chalwk)

Communication Board - JavaScript (service worker)
*/

const CACHE_NAME = 'communication-board-v1.4';
const BASE_PATH = '/browser-apps/tools/communication-board/';

const urlsToCache = [
    BASE_PATH,
    BASE_PATH + 'index.html',
    BASE_PATH + 'style.css',
    BASE_PATH + 'script.js',
    BASE_PATH + 'manifest.json',
    BASE_PATH + 'icons/icon-192x192.png',
    BASE_PATH + 'icons/icon-512x512.png'
];

self.addEventListener('install', event => {
    console.log('Service Worker installing for path:', BASE_PATH);
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
            console.log('Caching app resources');
            return cache.addAll(urlsToCache).catch(error => {
                console.log('Cache addAll error:', error);
            });
        })
    );
});

self.addEventListener('activate', event => {
    console.log('Service Worker activating');
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
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    const requestUrl = new URL(event.request.url);

    if (requestUrl.origin !== location.origin ||
    !requestUrl.pathname.startsWith(BASE_PATH)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request)
                .then(networkResponse => {
                if (!networkResponse || networkResponse.status !== 200) {
                    return networkResponse;
                }

                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                    .then(cache => {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            })
                .catch(error => {
                console.log('Fetch failed, serving offline page:', error);
                if (event.request.headers.get('accept').includes('text/html')) {
                    return caches.match(BASE_PATH + 'index.html');
                }
            });
        })
    );
});