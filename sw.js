const CACHE_NAME = 'hisaab-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/index.css',
  '/css/components.css',
  '/css/pages.css',
  '/js/utils.js',
  '/js/db.js',
  '/js/store.js',
  '/js/router.js',
  '/js/app.js',
  '/js/components/toast.js',
  '/js/components/empty-state.js',
  '/js/components/expense-card.js',
  '/js/components/category-picker.js',
  '/js/components/profile-picker.js',
  '/js/components/add-modal.js',
  '/js/components/chart.js',
  '/js/components/voice-input.js',
  '/js/components/notification.js',
  '/js/components/qr-sync.js',
  '/js/pages/home.js',
  '/js/pages/analytics.js',
  '/js/pages/history.js',
  '/js/pages/search.js',
  '/js/pages/settings.js',
  '/favicon.svg',
  '/manifest.json'
];

// Install — cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate — clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — cache-first for static assets, network-first for others
self.addEventListener('fetch', event => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // For navigation requests (HTML), use network-first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // For CDN resources (fonts, chart.js), use cache-first with network fallback
  if (request.url.includes('googleapis.com') ||
      request.url.includes('gstatic.com') ||
      request.url.includes('cdn.jsdelivr.net')) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // For all other static assets — cache first
  event.respondWith(
    caches.match(request).then(cached => {
      return cached || fetch(request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return response;
      });
    })
  );
});
