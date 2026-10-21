// Club Chronos · abre la app al instante (también sin internet).
// Los datos de la hoja NO pasan por aquí: la app los guarda en el celular y los envía cuando hay conexión.
var VERSION = 'chronos-v8';
var ARCHIVOS = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'panel.html'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(ARCHIVOS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (url.hostname.indexOf('script.google') >= 0 || url.hostname.indexOf('googleusercontent') >= 0) return; // la hoja: siempre en vivo
  if (url.origin === location.origin || url.hostname.indexOf('fonts.') === 0) {
    // copia guardada al instante; en segundo plano se baja la versión nueva para la próxima vez
    e.respondWith(caches.open(VERSION).then(function (c) {
      return c.match(req, { ignoreSearch: url.origin === location.origin }).then(function (guardado) {
        var red = fetch(req).then(function (r) { if (r && r.ok) c.put(req, r.clone()); return r; });
        if (guardado) { e.waitUntil(red.catch(function () {})); return guardado; }
        return red.catch(function () { return c.match('index.html'); });
      });
    }));
  }
});
