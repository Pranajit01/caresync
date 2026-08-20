/**
 * CareSync PWA Service Worker
 */

const CACHE_NAME = "caresync-cache-v1";

const ASSETS_TO_CACHE = [
  "/",
  "/manifest.json",
  "/favicon.ico"
];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Pre-caching app shell");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[SW] Cleaning old cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // Avoid intercepting third-party requests or chrome-extension/supabase websockets
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip POST, PUT, DELETE, PATCH, etc.
  if (event.request.method !== "GET") {
    return;
  }

  // Network-First, Cache-Fallback strategy
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache dynamic assets on success
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        console.log("[SW] Offline, falling back to cache for:", event.request.url);
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Default offline fallback if nothing matches
          return new Response("Offline mode active. Last known data is cached locally.", {
            status: 503,
            statusText: "Service Unavailable",
            headers: { "Content-Type": "text/plain" }
          });
        });
      })
  );
});
