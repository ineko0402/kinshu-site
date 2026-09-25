// sw.js
const CACHE_NAME = 'CalcApp-cache-v20260925.2';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './style.css?v=20260925.2',
  './css/variables.css?v=20260925.2',
  './css/base.css?v=20260925.2',
  './css/effects.css?v=20260925.2',
  './css/layout.css?v=20260925.2',
  './css/components.css?v=20260925.2',
  './css/navigation.css?v=20260925.2',
  './css/lists.css?v=20260925.2',
  './css/typography.css?v=20260925.2',
  './css/keypad.css?v=20260925.2',
  './css/modals.css?v=20260925.2',
  './css/pc.css?v=20260925.2',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((resp) => resp || fetch(event.request))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
});
