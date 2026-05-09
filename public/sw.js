const CACHE = "poised-v1";
const PRECACHE = ["/", "/src/main.jsx"];

self.addEventListener("install", e => {
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first: always try the network so Supabase data stays fresh.
// Falls back to cache if offline (shows the app shell).
self.addEventListener("fetch", e => {
  // Don't intercept Supabase API calls — always let those go to the network.
  if (e.request.url.includes("supabase.co")) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
