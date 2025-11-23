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

// Install event - cache essential files
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

// Activate event - clean up old caches
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

// Fetch event - serve from cache or network
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
            // Cache hit - return response
            if (response) {
                return response;
            }

            // Clone the request because it's a one-time use stream
            const fetchRequest = event.request.clone();

            return fetch(fetchRequest).then(
                function(response) {
                    // Check if we received a valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response because it's a one-time use stream
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then(function(cache) {
                        cache.put(event.request, responseToCache);
                    });

                    return response;
                }
            ).catch(function() {
                // If both cache and network fail, show a custom offline page
                // For this app, we'll just let it fail gracefully since it works offline with localStorage
                console.log('Fetch failed; returning offline page.');
            });
        })
    );
});