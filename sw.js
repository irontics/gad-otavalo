const CACHE_NAME = 'gad-Otavalo-v1.0.5'; // Incrementar versión para aplicar cambios

const STATIC_ASSETS = [
  './',
  './index.html',
  './main.js',
  './manifest.json'
];

// 🔹 INSTALACIÓN: Sin cambios, es correcta.
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
});

// 🔹 ACTIVACIÓN: Sin cambios, limpia correctamente versiones viejas.
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

// 🔹 FETCH: Optimizado para Actualización Invisible (Stale-While-Revalidate)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. OMITIR SUPABASE: Datos en tiempo real, no se cachean.
  if (url.hostname.includes('supabase.co')) return;

  // 2. ESTRATEGIA PROFESIONAL: Entrega rápida + Actualización en segundo plano
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      
      // Iniciamos la búsqueda en red de todas formas para actualizar el caché
      const networkFetch = fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && url.origin === self.location.origin) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => {
        // Silenciamos errores de red si estamos offline, para que no salte alerta
      });

      // Retornamos la respuesta rápida (caché) o esperamos a la red si no hay nada
      return cachedResponse || networkFetch;
    })
  );
});