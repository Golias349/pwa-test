const CACHE='grao-digital-v5_2';
const ASSETS=['./','./index.html','./app.js','./estilo.css','./manifest.json','./politica.html','./termos.html','./icone-192.png','./icone-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => { e.respondWith(caches.match(e.request).then(resp => resp || fetch(e.request).then(response => { const copy=response.clone(); caches.open(CACHE).then(cache => cache.put(e.request, copy)); return response; }))); });
