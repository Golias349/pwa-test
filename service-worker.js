self.addEventListener('install', e=>{
  e.waitUntil(caches.open('gd-v1').then(c=>c.addAll([
    './','./index.html','./estilo.css','./app.js','./icone-192.png','./icone-512.png','./manifest.json'
  ])));
});
self.addEventListener('fetch', e=>{
  e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request)));
});
