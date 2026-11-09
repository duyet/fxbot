// The frame's service worker: everything the frame's pages load by address, it fetches from fxbot through the shell.
// fxbot's page itself, its scripts and styles, images in the library, plugins' files, and the pages plugin's frames.
// Content-hashed assets are kept, so a reopened app draws at once while it connects.
import { Line, SHELL } from "./port.ts";

declare const self: ServiceWorkerGlobalScope;
let line: Line | null = null;
let waiting: ((l: Line) => void)[] = [];

self.addEventListener("install", () => void self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("message", (e) => {
  if (e.data?.fxbot !== "port" || !e.ports[0]) return;
  line = new Line(e.ports[0]);
  for (const w of waiting.splice(0)) w(line);
});

// A port, from the one it has, or from a page of the frame's, which asks the shell. A worker that was stopped has none.
async function getLine(): Promise<Line | null> {
  if (line) return line;
  const got = new Promise<Line>((r) => waiting.push(r));
  for (const c of await self.clients.matchAll({ type: "window", includeUncontrolled: true })) c.postMessage({ fxbot: "want-port" });
  return Promise.race([got, new Promise<null>((r) => setTimeout(() => r(null), 3000))]);
}

// Lets the frame run inside the shell: a page that allows only its own origin to frame it allows the shell too.
function framing(csp: string) {
  return csp.replace(/frame-ancestors([^;]*)'self'/, `frame-ancestors$1'self' ${SHELL}`);
}

async function handle(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const asset = request.method === "GET" && url.pathname.startsWith("/assets/");
  if (asset) {
    const kept = await caches.match(request);
    if (kept) return kept;
  }
  const l = await getLine();
  if (!l) {
    // No way to the shell: start over from the frame's first page, which gets one.
    if (request.mode === "navigate") return Response.redirect(`/__fxbot/start?path=${encodeURIComponent(url.pathname + url.search)}`, 302);
    return new Response("Not connected to your fxbot.", { status: 503 });
  }
  let res = await l.fetch(request);
  const csp = res.headers.get("content-security-policy");
  const type = res.headers.get("content-type") ?? "";
  if (csp || type.startsWith("text/html")) {
    const headers = new Headers(res.headers);
    if (csp) headers.set("content-security-policy", framing(csp));
    let body: BodyInit | null = res.body;
    // fxbot's own pages get the frame's script first, where their policy lets a script from here run.
    if (type.startsWith("text/html") && (!csp || /script-src[^;]*'self'/.test(csp) || (!/script-src/.test(csp) && /default-src[^;]*'self'/.test(csp)))) {
      const text = await res.text();
      body = text.replace(/<head[^>]*>/i, (m) => `${m}<script src="/__fxbot/frame.js"></script>`);
      if (body === text) body = `<script src="/__fxbot/frame.js"></script>${text}`;
      headers.delete("content-length");
    }
    res = new Response(body, { status: res.status, statusText: res.statusText, headers });
  }
  if (asset && res.ok) {
    const cache = await caches.open("fxbot-assets");
    await cache.put(request, res.clone());
  }
  return res;
}

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || url.pathname.startsWith("/__fxbot/") || url.pathname === "/sw.js") return;
  e.respondWith(handle(e.request));
});
