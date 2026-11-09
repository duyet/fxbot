// The bridge: each data channel a device opens carries one request, or one WebSocket, to fxbot's own API at
// fx.localUrl. A request goes without the device's Host, Origin, or Cookie, and with a header that marks it as bridged,
// which the plugin's own device routes refuse, so code in the device's frame can't pair or remove a device.
import type { RTCDataChannel } from "werift";
import type { Bytes } from "../../../packages/web-app/protocol/bytes.ts";
import { CHUNK, end, joiner, pieces, type AnswerHead, type HttpHead, type WsHead } from "../../../packages/web-app/protocol/wire.ts";

export const bridged = "x-fxbot-web-pairing";
const dropped = new Set(["host", "origin", "cookie", "referer", "connection", "keep-alive", "upgrade", "te", "trailer", "transfer-encoding", "content-length", "proxy-authorization", bridged]);
const droppedBack = new Set(["content-encoding", "content-length", "transfer-encoding", "connection", "keep-alive", "set-cookie"]);
const MiB = 1 << 20;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Sends when the channel has room: under 1 MiB queued.
async function send(dc: RTCDataChannel, data: string | Uint8Array) {
  while (dc.bufferedAmount > MiB) {
    if (dc.readyState !== "open") throw new Error("closed");
    await sleep(5);
  }
  if (dc.readyState !== "open") throw new Error("closed");
  dc.send(typeof data === "string" ? data : Buffer.from(data.buffer, data.byteOffset, data.byteLength));
}

// A path on fxbot's own server, never another host.
function target(localUrl: string, path: unknown) {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//") || path.includes("\\") || path.length > 8192) return null;
  const url = new URL(path, localUrl);
  return url.origin === new URL(localUrl).origin ? url : null;
}

export function serve(dc: RTCDataChannel, ctx: { localUrl: string; device: string; log: (...parts: unknown[]) => void }) {
  let head: HttpHead | WsHead | null = null;
  const body: Buffer[] = [];
  let size = 0;
  const abort = new AbortController();
  let ws: WebSocket | null = null;
  const queued: (string | Bytes)[] = [];
  const join = joiner();
  let out = Promise.resolve();
  const fail = (status: number, error: string) =>
    send(dc, JSON.stringify({ status, headers: [], error } satisfies AnswerHead)).then(() => send(dc, end)).catch(() => {});

  dc.stateChanged.subscribe((state) => {
    if (state !== "closed") return;
    abort.abort();
    ws?.close();
  });
  dc.onMessage.subscribe((m: string | Buffer) => {
    if (!head) {
      try {
        head = JSON.parse(String(m));
      } catch {
        return void dc.close();
      }
      if (head?.kind === "ws") openSocket(head);
      else if (head?.kind !== "http") dc.close();
      return;
    }
    if (head.kind === "http") {
      if (typeof m === "string") {
        if (m === end) void request(head);
        return;
      }
      size += m.length;
      // What one request may carry, well past the library's own limit.
      if (size > 256 * MiB) return void (fail(413, "That's too big to send.").then(() => dc.close()));
      body.push(m);
    } else {
      if (typeof m === "string") return;
      const whole = join(new Uint8Array(m));
      if (whole === undefined) return;
      if (ws?.readyState === WebSocket.OPEN) ws.send(whole);
      else queued.push(whole);
    }
  });

  async function request(h: HttpHead) {
    const url = target(ctx.localUrl, h.path);
    if (!url || typeof h.method !== "string" || !/^[A-Z]{3,7}$/.test(h.method)) return fail(400, "Not a path on this fxbot.");
    const headers = new Headers();
    for (const [k, v] of Array.isArray(h.headers) ? h.headers : []) if (typeof k === "string" && typeof v === "string" && !dropped.has(k.toLowerCase())) headers.append(k, v);
    headers.set(bridged, ctx.device);
    let res: Response;
    try {
      res = await fetch(url, { method: h.method, headers, body: h.method === "GET" || h.method === "HEAD" ? undefined : Buffer.concat(body), signal: abort.signal, redirect: "manual" });
    } catch (error) {
      if (!abort.signal.aborted) await fail(502, `fxbot didn't answer: ${error instanceof Error ? error.message : error}`);
      return;
    }
    try {
      await send(dc, JSON.stringify({ status: res.status, headers: [...res.headers].filter(([k]) => !droppedBack.has(k)) } satisfies AnswerHead));
      if (res.body) for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) for (let at = 0; at < chunk.length; at += CHUNK) await send(dc, chunk.subarray(at, at + CHUNK));
      await send(dc, end);
    } catch {
      abort.abort();
    }
  }

  function openSocket(h: WsHead) {
    const url = target(ctx.localUrl, h.path);
    if (!url) return void fail(400, "Not a path on this fxbot.");
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    const protocols = Array.isArray(h.protocols) ? h.protocols.filter((p) => typeof p === "string") : [];
    // Node's WebSocket takes headers as undici's own option.
    ws = new (WebSocket as any)(url, { protocols, headers: { [bridged]: ctx.device } }) as WebSocket;
    ws.binaryType = "arraybuffer";
    let opened = false;
    ws.onopen = () => {
      opened = true;
      out = out.then(() => send(dc, JSON.stringify({ status: 101, headers: [], protocol: ws!.protocol } satisfies AnswerHead))).catch(() => ws?.close());
      for (const m of queued.splice(0)) ws!.send(m);
    };
    ws.onmessage = (e) => {
      const data = typeof e.data === "string" ? e.data : new Uint8Array(e.data as ArrayBuffer);
      out = out.then(async () => {
        for (const piece of pieces(data)) await send(dc, piece);
      }).catch(() => ws?.close());
    };
    ws.onclose = () => {
      if (!opened) void fail(502, "fxbot refused the WebSocket.").then(() => dc.close());
      else void out.then(() => dc.close());
    };
  }
}
