// CPace, CPACE-RISTR255-SHA512, as draft-irtf-cfrg-cpace-21 defines it: a short code both sides know becomes a shared
// key, and each code allows one guess. On @noble/curves' ristretto255. check.mjs runs it against the draft's B.3 vectors.
import { ristretto255, ristretto255_hasher } from "@noble/curves/ed25519.js";
import { concat, random, utf8, type Bytes } from "./bytes.ts";

const Point = ristretto255.Point;
const DSI = utf8("CPaceRistretto255");
const sha512 = async (data: Uint8Array): Promise<Bytes> => new Uint8Array(await crypto.subtle.digest("SHA-512", data as Bytes));

// LEB128 length, then the bytes.
export function prependLen(data: Uint8Array): Bytes {
  const len: number[] = [];
  let n = data.length;
  do {
    len.push(n < 128 ? n : (n & 0x7f) | 0x80);
    n = Math.floor(n / 128);
  } while (n > 0);
  return concat(Uint8Array.from(len), data);
}
export const lvCat = (...args: Uint8Array[]) => concat(...args.map(prependLen));

// The generator for a code: its string padded to SHA-512's 128-byte block, hashed, then mapped to the group.
export async function generator(prs: Uint8Array, ci: Uint8Array, sid: Uint8Array) {
  const zpad = Math.max(0, 128 - 1 - prependLen(prs).length - prependLen(DSI).length);
  const hash = await sha512(lvCat(DSI, prs, new Uint8Array(zpad), ci, sid));
  return ristretto255_hasher.deriveToCurve!(hash);
}

const scalarOf = (bytes: Uint8Array) => Point.Fn.create(bytes.reduceRight((n, b) => (n << 8n) | BigInt(b), 0n));

// One side's share: a secret scalar, and its point, Y. `y` is for the vectors; otherwise it's random.
export async function share(prs: Uint8Array, ci: Uint8Array, sid: Uint8Array, y?: Uint8Array) {
  const scalar = scalarOf(y ?? random(64));
  if (scalar === 0n) throw new Error("A zero scalar.");
  const g = await generator(prs, ci, sid);
  return { y: scalar, Y: g.multiply(scalar).toBytes() as Bytes };
}

// K from our scalar and their point. A point that doesn't decode, or the identity, ends it, as the draft says.
export function secret(y: bigint, theirs: Uint8Array): Bytes {
  let point;
  try {
    point = Point.fromBytes(theirs);
  } catch {
    throw new Error("The other side's share isn't a valid point.");
  }
  const K = point.multiply(y);
  if (K.equals(Point.ZERO)) throw new Error("The other side's share gave the identity.");
  return K.toBytes() as Bytes;
}

// The initiator-responder transcript, and from it the shared key, ISK.
export const transcript = (Ya: Uint8Array, ADa: Uint8Array, Yb: Uint8Array, ADb: Uint8Array) => concat(lvCat(Ya, ADa), lvCat(Yb, ADb));
export const isk = (sid: Uint8Array, K: Uint8Array, Ya: Uint8Array, ADa: Uint8Array, Yb: Uint8Array, ADb: Uint8Array) =>
  sha512(concat(lvCat(concat(DSI, utf8("_ISK")), sid, K), transcript(Ya, ADa, Yb, ADb)));
