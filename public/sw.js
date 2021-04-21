const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/styles.css",
    "/index.js",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
  ];

  const CACHE_NAME = "static-cache-v1";
  const DATA_CACHE_NAME = "data-cache-v1";

  // install
self.addEventListener("install", function(evt) {
    evt.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
        return cache.addAll(FILES_TO_CACHE);
      })
    );
  
    self.skipWaiting();
  });

  //activate
  self.addEventListener("activate", function(evt) {
    evt.waitUntil(
      caches.keys().then(keyList => {
        return Promise.all(
          keyList.map(key => {
            if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
              console.log("Removing old cache data", key);
              return caches.delete(key);
            }
          })
        );
      })
    );
  
    self.clients.claim();
  });