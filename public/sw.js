const CACHE_NAME = "aniverse-v1";
const STATIC_CACHE = "aniverse-static-v1";
const API_CACHE = "aniverse-api-v1";

// Assets yang di-cache saat install
const STATIC_ASSETS = [
  "/",
  "/offline",
  "/manifest.json",
];

// ─── Install ────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// ─── Activate ───────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== STATIC_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch Strategy ─────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET dan chrome-extension
  if (request.method !== "GET" || url.protocol === "chrome-extension:") return;

  // API Routes: Network-first, fallback ke cache (max 5 menit)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, API_CACHE, 300));
    return;
  }

  // Biarkan Next.js dan Vercel menangani caching file _next/static/ secara native
  // karena menginterceptnya dengan CacheFirst di SW sering memecah chunk js saat update versi.
  if (url.pathname.startsWith("/_next/static/")) {
    return; // Pass through to browser native handling
  }

  // AniList CDN images: Cache-first dengan TTL 24 jam
  if (url.hostname === "s4.anilist.co" || url.hostname === "cdn.myanimelist.net") {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  // Halaman navigasi: Network-first, fallback ke /offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match("/offline"))
    );
    return;
  }

  // Default: Network-first
  event.respondWith(networkFirst(request, CACHE_NAME, 600));
});

// ─── Helper: Cache-first ────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

// ─── Helper: Network-first ──────────────────────────────
async function networkFirst(request, cacheName, maxAgeSeconds) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      // Clone & add timestamp header
      const headers = new Headers(response.headers);
      headers.append("sw-fetched-on", new Date().toISOString());
      const cachedResponse = new Response(await response.clone().blob(), {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
      cache.put(request, cachedResponse);
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      // Check max age
      const fetchedOn = cached.headers.get("sw-fetched-on");
      if (fetchedOn) {
        const age = (Date.now() - new Date(fetchedOn).getTime()) / 1000;
        if (age < maxAgeSeconds) return cached;
      } else {
        return cached;
      }
    }
    return new Response(JSON.stringify({ error: "Offline", cached: false }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// ─── Push Notifications ─────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title ?? "AniVerse", {
      body: data.body ?? "",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      data: { url: data.url ?? "/" },
      tag: data.tag ?? "aniverse",
      renotify: true,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      const url = event.notification.data?.url ?? "/";
      for (const client of clientList) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
