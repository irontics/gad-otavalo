// 🔹 Nombre fijo para evitar bucles infinitos de instalación
const CACHE_NAME = 'gad-Otavalo-v1.0.4'; 

const STATIC_ASSETS = [
  './',
  './index.html',
  './main.js',
  './manifest.json'
];

// 🔹 INSTALACIÓN
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
});

// 🔹 ACTIVACIÓN (Limpia versiones antiguas solo cuando cambies el nombre arriba)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// 🔹 FETCH (Estrategia Cache-First para velocidad, Network-First para datos)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. OMITIR SUPABASE: No interferir con la base de datos ni autenticación
  if (url.hostname.includes('supabase.co')) return;

  // 2. ESTRATEGIA PARA ARCHIVOS ESTÁTICOS (JS, CSS, HTML, Imágenes locales)
  // Cargan instantáneamente desde el caché
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then(networkResponse => {
        // Solo cachear respuestas válidas de nuestro propio dominio
        if (networkResponse && networkResponse.status === 200 && url.origin === self.location.origin) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkResponse;
      });
    })
  );
});