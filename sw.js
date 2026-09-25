// sw.js
const CACHE_NAME = 'CalcApp-cache-v20260925.15';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './style.css?v=20260925.15',
  './css/variables.css?v=20260925.15',
  './css/base.css?v=20260925.15',
  './css/effects.css?v=20260925.15',
  './css/layout.css?v=20260925.15',
  './css/components.css?v=20260925.15',
  './css/navigation.css?v=20260925.15',
  './css/lists.css?v=20260925.15',
  './css/typography.css?v=20260925.15',
  './css/keypad.css?v=20260925.15',
  './css/modals.css?v=20260925.15',
  './css/withdrawal-fee.css?v=20260925.15',
  './css/pc.css?v=20260925.15',
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
