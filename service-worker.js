const CACHE = "grao-digital-v2";
const ASSETS = ["./","./index.html","./estilo.css","./app.js","./manifest.json","./icone.png","./icone-192.png"];
self.addEventListener("install", e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener("activate", e=>{ e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE && caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e=>{ e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request))); });
