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
  // Only handle GET requests and skip non-http(s) URLs and Supabase calls.
  if (e.request.method !== "GET") return;
  if (!e.request.url.startsWith("http")) return;
  if (e.request.url.includes("supabase.co")) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.status === 200 && res.type === "basic") {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
