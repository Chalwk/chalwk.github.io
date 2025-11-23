const CACHE_NAME = 'communication-board-v1.2';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/manifest.json'
];

// Install event - cache essential resources
self.addEventListener('install', event => {
    console.log('Service Worker installing');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
            console.log('Opened cache');
            return cache.addAll(urlsToCache);
        })
            .catch(error => {
            console.log('Cache addAll failed:', error);
        })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
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

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    // Skip non-GET requests and external URLs
    if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
            // Return cached version or fetch from network
            return response || fetch(event.request)
                .then(fetchResponse => {
                // Don't cache non-successful responses
                if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                    return fetchResponse;
                }

                // Clone the response and cache it
                const responseToCache = fetchResponse.clone();
                caches.open(CACHE_NAME)
                    .then(cache => {
                    cache.put(event.request, responseToCache);
                });

                return fetchResponse;
            })
                .catch(error => {
                console.log('Fetch failed; returning offline page:', error);
                // For HTML requests, return the cached index.html
                if (event.request.headers.get('accept').includes('text/html')) {
                    return caches.match('/index.html');
                }
            });
        })
    );
});