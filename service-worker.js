self.addEventListener("install",e=>{
  e.waitUntil(caches.open("grao-digital").then(c=>c.addAll(["/","/index.html","/estilo.css","/app.js"])));
});
self.addEventListener("fetch",e=>{
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});