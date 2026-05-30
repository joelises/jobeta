const CACHE_NAME = 'jobeta-v2.0';
const ASSETS = [
  '/beta/',
  '/beta/index.html',
  '/beta/estoque.html',
  '/beta/saude.html',
  '/beta/manifest.json',
  '/beta/J&B.png',
  '/beta/J&B1.png'
];

// Instalação
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('✅ Cache Jo&Beta aberto');
      return cache.addAll(ASSETS).catch(err => {
        console.log('⚠️ Alguns assets não foram cacheados:', err);
      });
    })
  );
  self.skipWaiting();
});

// Ativação
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => {
              console.log('🗑️ Removendo cache antigo:', key);
              return caches.delete(key);
            })
      );
    })
  );
  self.clients.claim();
});

// Fetch (Estratégia: Cache First, depois Network)
self.addEventListener('fetch', event => {
  // Ignora extensões do Chrome
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        return cached;
      }

      return fetch(event.request).then(response => {
        // Só cacheia respostas GET válidas
        if (!response || response.status !== 200 || event.request.method !== 'GET') {
          return response;
        }

        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });

        return response;
      }).catch(() => {
        // Fallback offline: retorna index.html
        if (event.request.mode === 'navigate') {
          return caches.match('/beta/index.html');
        }
      });
    })
  );
});

// Sincronização em background
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_COMPLETE', timestamp: Date.now() });
  });
}