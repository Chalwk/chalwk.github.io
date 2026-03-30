/* Copyright (c) 2024-2026. Jericho Crosby (Chalwk) */

const CACHE_NAME = '{{ page.cache_name }}-v{{ page.cache_version | default: 1 }}';
const urlsToCache = [
    {% assign urls = page.urls_to_cache | default: site.default_urls %}
    {% if urls %}
        {% for url in urls %}
            "{{ url }}"{% unless forloop.last %},{% endunless %}
        {% endfor %}
    {% else %}
        "./", "./index.html", "./style.css", "./script.js", "./manifest.json",
        "./icons/icon-192x192.png", "./icons/icon-512x512.png"
    {% endif %}
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
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

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});