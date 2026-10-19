// Club Chronos · permite abrir la app sin internet.
// Los datos de la hoja NO pasan por aquí: la app los guarda en el celular y los envía cuando hay conexión.
var VERSION = 'chronos-v3';
var ARCHIVOS = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

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
  if (url.origin === location.origin) {
    // la app: primero internet (para recibir actualizaciones), si no hay, la copia guardada
    e.respondWith(fetch(req).then(function (r) {
      var copia = r.clone(); caches.open(VERSION).then(function (c) { c.put(req, copia); }); return r;
    }).catch(function () { return caches.match(req).then(function (r) { return r || caches.match('index.html'); }); }));
    return;
  }
  if (url.hostname.indexOf('fonts.') === 0) {
    // tipografías: copia guardada primero
    e.respondWith(caches.match(req).then(function (r) {
      return r || fetch(req).then(function (res) { var copia = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copia); }); return res; });
    }));
  }
});
