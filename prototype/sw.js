/* Service worker del prototipo: cachea la shell y la ÚLTIMA ficha de vehículo resuelta,
 * para que sin red el escaneo repetido siga mostrando línea/unidad/conductor/teléfonos.
 * Estrategia: shell = cache-first; API = network-first con fallback a caché (stale OK). */
const SHELL = 'qruta-shell-v1';
const ASSETS = ['./', 'index.html', 'css/app.css', 'js/data.js', 'js/qr.js', 'js/map.js', 'js/bus3d.js', 'js/app.js',
  'vendor/qrcode-generator-1.4.4.js', 'vendor/three-0.128.0/three.min.js', 'manifest.webmanifest', 'icon.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(SHELL).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.pathname.includes('/v1/')) {
    e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open('qruta-api').then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request)));
});
