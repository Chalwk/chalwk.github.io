const CACHE_NAME = 'communication-board-v1.3';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png'
];

self.addEventListener('install', event => {
    console.log('Service Worker installing');
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
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
            // Return cached version or fetch from network
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request)
                .then(networkResponse => {
                // Only cache successful responses
                if (!networkResponse || networkResponse.status !== 200) {
                    return networkResponse;
                }

                // Clone the response for caching
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                    .then(cache => {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            })
                .catch(() => {
                // If both cache and network fail, return offline page for HTML
                if (event.request.headers.get('accept').includes('text/html')) {
                    return caches.match('./index.html');
                }
            });
        })
    );
});