// Versão do app — mude esta string sempre que publicar uma atualização
// para forçar todos os aparelhos a buscar a versão nova.
const VERSION = 'v1';
const CACHE = 'cronograma-giuli-' + VERSION;
const CORE = ['./index.html', './manifest.json'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first: sempre tenta buscar a versão mais nova da internet.
// Só usa o que está guardado se o aparelho estiver sem internet.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // deixa Firebase/CDNs passarem direto

  e.respondWith(
    fetch(e.request, { cache: 'no-store' })
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Se o site pedir, assume o controle imediatamente (usado no auto-update).
self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
