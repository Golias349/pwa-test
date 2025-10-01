self.addEventListener('install', e=>{
  e.waitUntil(caches.open('grao-digital-v1').then(c=>c.addAll([
    './','index.html','app.js','manifest.json','icone-192.png','icone-512.png'
  ])));
});
self.addEventListener('fetch', e=>{
  e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request)));
});