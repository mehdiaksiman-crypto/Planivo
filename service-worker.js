const CACHE_NAME = 'planivo-v9';
const ASSETS = [
  '/Planivo/',
  '/Planivo/index.html',
  '/Planivo/manifest.json',
  '/Planivo/icon-192.png',
  '/Planivo/icon-512.png'
];

// Installation — mise en cache des assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  // Ne pas skipWaiting automatiquement — attendre la confirmation de l'utilisateur
});

// Activation — suppression des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first pour index.html, cache first pour le reste
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isHTML = url.pathname.endsWith('/') || url.pathname.endsWith('.html');

  if (isHTML) {
    // Network first pour HTML — toujours la dernière version si connecté
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Mettre à jour le cache avec la nouvelle version
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache first pour les autres assets (icônes, manifest)
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).catch(() => caches.match('/Planivo/index.html'));
      })
    );
  }
});

// Message depuis l'app pour forcer la mise à jour
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
