// What the shell and the web-pairing plugin say to each other: names, the pairing link and code, the six digits, and the
// envelopes that cross the relay and the data channels. Both import this file, so they can't drift.
import { b64u, base32, concat, fromB64u, fromBase32, hkdf, hmac, sha256, u64, utf8, type Bytes } from "./bytes.ts";
import type { Cipher } from "./noise.ts";

export const VERSION = 1;
export const defaultRelay = "wss://web.fxbot.sh/signal";
export const defaultShell = "https://web.fxbot.sh";

// fxbot's address at the relay: the first 16 bytes of a hash of its two public keys, so the relay can check a listener.
export async function ridOf(listenKey: Uint8Array, staticKey: Uint8Array) {
  return base32((await sha256(concat(utf8("fxbot/1 rid"), listenKey, staticKey))).slice(0, 16));
}

// What a listener signs for the relay: its address and the time, in milliseconds, which the relay takes within two minutes.
export const listenProof = (rid: string, time: string) => concat(utf8("fxbot/1 listen"), utf8(rid), utf8(time));

// The prologues, which bind each handshake to its purpose and to fxbot's address.
export const pairPrologue = (rid: string, tid: Uint8Array) => concat(utf8("fxbot/1 pair"), utf8(rid), tid);
export const connectPrologue = (rid: string) => concat(utf8("fxbot/1 connect"), utf8(rid));
export const passkeyPrologue = (rid: string) => concat(utf8("fxbot/1 passkey"), utf8(rid));
// A passkey's challenge, when it pairs a wiped device: the device's new key, the time, and a nonce, so the assertion
// can't be used for another key, or again.
export const passkeyChallenge = (D: Uint8Array, time: number, nonce: Uint8Array) => sha256(concat(utf8("fxbot/1 passkey"), D, u64(time), nonce));
// A passkey's user id: what a wiped device needs to find its fxbot again. Version, the address's 16 bytes, its key.
export const passkeyUser = (rid: string, I: Uint8Array) => concat(Uint8Array.of(1), fromBase32(rid), I);
export function readPasskeyUser(id: Uint8Array) {
  if (id.length !== 49 || id[0] !== 1) throw new Error("That passkey isn't one for an fxbot.");
  return { rid: base32(id.slice(1, 17)), I: id.slice(17) };
}

// The pairing link, whose fragment never reaches a server: `/pair#1.<rid>.<tid>.<I>.<S>`, and the relay when it isn't fxbot.sh's.
export type Ticket = { rid: string; tid: Bytes; I: Bytes; S: Bytes; relay: string };
export function pairLink(shell: string, t: Ticket) {
  const parts = [String(VERSION), t.rid, b64u(t.tid), b64u(t.I), b64u(t.S)];
  if (t.relay !== defaultRelay) parts.push(b64u(utf8(t.relay)));
  return `${shell}/pair#${parts.join(".")}`;
}
export function readPairLink(fragment: string): Ticket {
  const [v, rid, tid, I, S, relay] = fragment.replace(/^#/, "").split(".");
  if (v !== String(VERSION) || !/^[a-z2-7]{26}$/.test(rid ?? "")) throw new Error("That isn't a pairing link from this version of fxbot.");
  return { rid, tid: fromB64u(tid), I: fromB64u(I), S: fromB64u(S), relay: relay ? new TextDecoder().decode(fromB64u(relay)) : defaultRelay };
}

// A typed code, `N-DDDD-DDDD`: the nameplate it reaches at the relay, then eight digits only fxbot and the owner know.
export const codeOf = (plate: number, digits: string) => `${plate}-${digits.slice(0, 4)}-${digits.slice(4)}`;
export function readCode(text: string) {
  const m = /^\s*(\d{1,3})\D*(\d{4})\D*(\d{4})\s*$/.exec(text);
  if (!m || Number(m[1]) < 1) throw new Error("A code looks like 47-3816-0925.");
  return { plate: Number(m[1]), digits: m[2] + m[3] };
}
export const codeCI = (plate: number) => concat(utf8("fxbot/1 pair-code"), utf8(String(plate)));
// CPace's associated data for each side, the key that seals C2, and what a code's ticket says once it's open.
export const ADa = utf8("fxbot/1 device"), ADb = utf8("fxbot/1 fxbot");
export const codeKey = (isk: Uint8Array) => hkdf(isk, "fxbot/1 code");
export type CodeTicket = { rid: string; I: string; tid: string; name: string; relay: string };
// The pairing PSK: from the link's S, or from a code's ISK, which takes S's place.
export const pairPsk = (secret: Uint8Array) => hkdf(secret, "fxbot/1 pair psk");
// The shell a relay belongs to: the same Worker serves both, `wss://<host>/signal` and `https://<host>`.
export const shellOf = (relay: string) => relay.replace(/^ws(s?):/, "http$1:").replace(/\/signal\/?$/, "");

// Six digits from a handshake's hash, which both screens show for the owner to compare.
export async function sixDigits(hash: Uint8Array) {
  const b = await hkdf(hash, "fxbot/1 sas", 4);
  return String(new DataView(b.buffer).getUint32(0) % 1_000_000).padStart(6, "0");
}

// The check each side sends first on a data channel: proof it's the end of this handshake, beside DTLS's own.
export async function channelCheck(hash: Uint8Array, role: "fxbot" | "device") {
  return b64u(await hmac(await hkdf(hash, "fxbot/1 channel"), utf8(role)));
}

// A message across the relay: its kind, and its bytes. `k1`/`k2` connect; `p1`/`p2` pair; `c1`/`c2` turn a code into a
// ticket; `r1`/`r2` pair by passkey; `t` is a sealed transport message; `err` says why the other side stopped, as one of `errors`' names.
export type Kind = "c1" | "c2" | "p1" | "p2" | "k1" | "k2" | "r1" | "r2" | "t" | "err";
export type Envelope = { k: Kind; d?: string; e?: string };
export const envelope = (k: Kind, d?: Uint8Array): Envelope => (d ? { k, d: b64u(d) } : { k });
export const failure = (e: keyof typeof errors): Envelope => ({ k: "err", e });
export function readEnvelope(m: unknown): Envelope & { bytes: Bytes } {
  const e = m as Envelope;
  if (typeof e?.k !== "string" || (e.d !== undefined && typeof e.d !== "string")) throw new Error("Not an envelope.");
  return { ...e, bytes: e.d ? fromB64u(e.d) : new Uint8Array(0) };
}

// Why a side stopped, in words fit to show the owner.
export const errors = {
  offline: "Your fxbot isn't connected to the relay. Check that it's running, with web pairing on. If it was installed again from nothing, it has new keys: pair again.",
  expired: "That pairing code has expired or was used. Ask for a new one.",
  locked: "Pairing is locked for 15 minutes after three wrong codes. Try again later.",
  failed: "Pairing failed: the code was wrong, or something changed the messages. Ask for a new code.",
  denied: "The pairing wasn't approved.",
  unknown: "Your fxbot doesn't know this device any more: it was removed. Pair it again.",
  replay: "Your fxbot refused an old connection attempt. Try again.",
  busy: "Your fxbot is busy. Try again in a moment.",
  off: "Remote access is off in your fxbot's Settings.",
};

// Sealed JSON over a transport cipher: what crosses the relay once a handshake is done.
export async function seal(c: Cipher, value: unknown) {
  return envelope("t", await c.encrypt(new Uint8Array(0), utf8(JSON.stringify(value))));
}
export async function unseal(c: Cipher, d: Uint8Array): Promise<any> {
  return JSON.parse(new TextDecoder().decode(await c.decrypt(new Uint8Array(0), d)));
}

// The bridge. A request's channel starts with its head, as JSON; its body follows in binary chunks of 16 KiB, then
// `{"end":true}`. Its answer comes back the same way. A WebSocket's channel has a head each way too, then each message
// in binary pieces of 16 KiB at most, the first byte of each saying whether it's text and whether more follows.
export const CHUNK = 16 * 1024;
export type HttpHead = { kind: "http"; method: string; path: string; headers: [string, string][] };
export type WsHead = { kind: "ws"; path: string; protocols: string[] };
export type AnswerHead = { status: number; headers: [string, string][]; protocol?: string; error?: string };
export const end = JSON.stringify({ end: true });
export const MORE = 1, TEXT = 2;
// One WebSocket message as pieces for a data channel.
export function* pieces(data: string | Uint8Array) {
  const text = typeof data === "string";
  const bytes = text ? utf8(data) : data;
  for (let at = 0; at === 0 || at < bytes.length; at += CHUNK - 1) {
    const part = bytes.subarray(at, at + CHUNK - 1);
    const out = new Uint8Array(part.length + 1);
    out[0] = (at + CHUNK - 1 < bytes.length ? MORE : 0) | (text ? TEXT : 0);
    out.set(part, 1);
    yield out;
  }
}
// Puts pieces back together: each call answers the whole message once its last piece arrives.
export function joiner() {
  let parts: Uint8Array[] = [];
  return (piece: Uint8Array): string | Bytes | undefined => {
    parts.push(piece.subarray(1));
    if (piece[0] & MORE) return;
    const whole = concat(...parts);
    parts = [];
    return piece[0] & TEXT ? new TextDecoder().decode(whole) : whole;
  };
}
// The control channel's first message, each way, before any other channel is served.
export type ControlHello = { check: string };

// What reaches a device in K2: the ICE servers to use, in order, and what fxbot found about its network.
export type IceServer = { urls: string; username?: string; credential?: string };
export type Finding = { check: string; result: "good" | "warn" | "bad" | "unknown"; text: string; docs?: string };
export type Reach = { summary: string; findings: Finding[] };

// Docs pages for what can't connect, in the order the notice offers them.
export const docs = {
  cant: "https://fxbot.sh/docs/how-to/when-a-device-cant-connect/",
  port: "https://fxbot.sh/docs/how-to/forward-a-port/",
  turn: "https://fxbot.sh/docs/how-to/run-your-own-turn/",
  stun: "https://fxbot.sh/docs/how-to/run-your-own-stun/",
  tailscale: "https://fxbot.sh/docs/how-to/reach-it/",
  wireguard: "https://fxbot.sh/docs/how-to/reach-it-with-wireguard/",
  relay: "https://fxbot.sh/docs/how-to/run-your-own-relay/",
  phone: "https://fxbot.sh/docs/how-to/reach-it-from-your-phone/",
  another: "https://fxbot.sh/docs/how-to/pair-another-device/",
};
