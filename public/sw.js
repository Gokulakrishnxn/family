/* Minimal service worker so the app can be installed as a home-screen shortcut.
   Network-first: never serve a stale page over a working connection. */
const CACHE = "family-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.headers.has("range")) return;

  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(event.request);
        if (fresh.ok && new URL(event.request.url).origin === self.location.origin) {
          const copy = fresh.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy)).catch(() => {});
        }
        return fresh;
      } catch {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        throw new Error("offline");
      }
    })(),
  );
});
