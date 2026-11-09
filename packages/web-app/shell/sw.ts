// The shell's own service worker. It keeps the shell's few files, so the app opens without a network, and fetches each
// fresh when it can. It never touches the relay, and the frames have workers of their own.
declare const self: ServiceWorkerGlobalScope;
export {};
const version = "__FXBOT_BUILD__";
const files = ["/", "/shell.js", "/shell.css", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (e) => e.waitUntil(caches.open(version).then((c) => c.addAll(files)).then(() => self.skipWaiting())));
self.addEventListener("activate", (e) =>
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== version).map((k) => caches.delete(k)))).then(() => self.clients.claim())),
);
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/signal")) return;
  const key = e.request.mode === "navigate" ? "/" : url.pathname;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok && files.includes(key)) {
          const copy = res.clone();
          void caches.open(version).then((c) => c.put(key, copy));
        }
        return res;
      })
      .catch(async () => (await caches.match(key)) ?? Response.error()),
  );
});
