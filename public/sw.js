const CACHE_NAME = 'imedia-cache-v2';

// تثبيت الـ Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// تفعيل وتحكم فوري
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// جلب الملفات
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});