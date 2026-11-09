// Bytes, for the protocol: the same in the browser and in Node, on Web Crypto alone.
export type Bytes = Uint8Array<ArrayBuffer>;

export const enc = new TextEncoder();
export const dec = new TextDecoder();
export const utf8 = (text: string): Bytes => enc.encode(text) as Bytes;

export function concat(...parts: Uint8Array[]): Bytes {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) (out.set(p, at), (at += p.length));
  return out;
}

export const random = (n: number): Bytes => crypto.getRandomValues(new Uint8Array(n));

export const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
export const fromHex = (s: string): Bytes => Uint8Array.from(s.match(/../g) ?? [], (h) => parseInt(h, 16));

// base64url without padding, for keys in links and JSON.
export function b64u(b: Uint8Array) {
  let s = "";
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
export function fromB64u(s: string): Bytes {
  if (!/^[A-Za-z0-9_-]*$/.test(s)) throw new Error("not base64url");
  const bin = atob(s.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

// RFC 4648 base32, lowercase, no padding: names the relay and the frames use, readable in a host name.
const alphabet = "abcdefghijklmnopqrstuvwxyz234567";
export function base32(b: Uint8Array) {
  let out = "", bits = 0, value = 0;
  for (const x of b) {
    value = (value << 8) | x;
    bits += 8;
    while (bits >= 5) (out += alphabet[(value >>> (bits - 5)) & 31], (bits -= 5));
  }
  if (bits > 0) out += alphabet[(value << (5 - bits)) & 31];
  return out;
}

// Compares in time that doesn't depend on where they differ.
export function equal(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}

export const sha256 = async (data: Uint8Array): Promise<Bytes> => new Uint8Array(await crypto.subtle.digest("SHA-256", data as Bytes));

export async function hmac(key: Uint8Array, data: Uint8Array): Promise<Bytes> {
  const k = await crypto.subtle.importKey("raw", key as Bytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, data as Bytes));
}

// HKDF-SHA-256 for a label: one key from a secret, as `HKDF(secret, label)` in the protocol.
export async function hkdf(secret: Uint8Array, label: string, length = 32): Promise<Bytes> {
  const k = await crypto.subtle.importKey("raw", secret as Bytes, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: new Uint8Array(32), info: utf8(label) }, k, length * 8));
}

export function fromBase32(s: string): Bytes {
  const a = "abcdefghijklmnopqrstuvwxyz234567";
  const out: number[] = [];
  let bits = 0, value = 0;
  for (const ch of s) {
    const i = a.indexOf(ch);
    if (i < 0) throw new Error("not base32");
    value = (value << 5) | i;
    bits += 5;
    if (bits >= 8) (out.push((value >>> (bits - 8)) & 255), (bits -= 8));
  }
  return Uint8Array.from(out);
}

// A number as 8 bytes, big-endian.
export function u64(n: number): Bytes {
  const out = new Uint8Array(8);
  new DataView(out.buffer).setBigUint64(0, BigInt(n));
  return out;
}
