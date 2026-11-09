// Noise IK and IKpsk2, `Noise_IK(psk2)_25519_AESGCM_SHA256`, revision 34, on Web Crypto alone, in the browser and in
// Node. IK is how a paired device connects; IKpsk2 how it pairs, with the ticket's secret as the PSK. check.mjs runs it
// against cacophony's vectors.
import { concat, hmac, utf8, type Bytes } from "./bytes.ts";

export type KeyPair = { privateKey: CryptoKey; publicKey: Bytes };
const X25519 = { name: "X25519" } as const;
const pkcs8Prefix = Uint8Array.from([0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x6e, 0x04, 0x22, 0x04, 0x20]);

async function rawPublic(key: CryptoKey): Promise<Bytes> {
  return new Uint8Array(await crypto.subtle.exportKey("raw", key));
}

// A new key. A device's is non-extractable: its private half can sign handshakes, and never be read back out.
export async function generateKeyPair(extractable = false): Promise<KeyPair> {
  const pair = (await crypto.subtle.generateKey(X25519, extractable, ["deriveBits"])) as CryptoKeyPair;
  return { privateKey: pair.privateKey, publicKey: await rawPublic(pair.publicKey) };
}

// A key from its 32 private bytes, as fxbot keeps its own, sealed, and as the vectors give them.
export async function keyPairFromPrivate(raw: Uint8Array): Promise<KeyPair> {
  const pkcs8 = concat(pkcs8Prefix, raw);
  const extractable = await crypto.subtle.importKey("pkcs8", pkcs8, X25519, true, ["deriveBits"]);
  const jwk = await crypto.subtle.exportKey("jwk", extractable);
  const publicKey = Uint8Array.from(atob(jwk.x!.replaceAll("-", "+").replaceAll("_", "/") + "="), (c) => c.charCodeAt(0));
  return { privateKey: await crypto.subtle.importKey("pkcs8", pkcs8, X25519, false, ["deriveBits"]), publicKey };
}

// An extractable key's 32 private bytes, for fxbot to seal.
export async function privateBytes(key: CryptoKey): Promise<Bytes> {
  return new Uint8Array(await crypto.subtle.exportKey("pkcs8", key)).slice(-32);
}

async function dh(own: KeyPair, theirs: Uint8Array): Promise<Bytes> {
  const pub = await crypto.subtle.importKey("raw", theirs as Bytes, X25519, true, []);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "X25519", public: pub }, own.privateKey, 256));
}

async function hkdf(ck: Uint8Array, ikm: Uint8Array, n: 2 | 3): Promise<Bytes[]> {
  const temp = await hmac(ck, ikm);
  const one = await hmac(temp, Uint8Array.of(1));
  const two = await hmac(temp, concat(one, Uint8Array.of(2)));
  return n === 2 ? [one, two] : [one, two, await hmac(temp, concat(two, Uint8Array.of(3)))];
}

// A CipherState: AES-GCM under one key, its 96-bit nonce four zero bytes and then n, big-endian. A message out of order
// or altered fails, and the counter only goes up.
export class Cipher {
  private n = 0n;
  private key: CryptoKey | null;
  private constructor(key: CryptoKey | null) {
    this.key = key;
  }
  static async of(raw: Uint8Array | null) {
    return new Cipher(raw ? await crypto.subtle.importKey("raw", raw as Bytes, "AES-GCM", false, ["encrypt", "decrypt"]) : null);
  }
  get hasKey() {
    return this.key !== null;
  }
  private nonce() {
    const iv = new Uint8Array(12);
    new DataView(iv.buffer).setBigUint64(4, this.n);
    return iv;
  }
  async encrypt(ad: Uint8Array, plaintext: Uint8Array): Promise<Bytes> {
    if (!this.key) return new Uint8Array(plaintext);
    const out = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: this.nonce(), additionalData: ad as Bytes }, this.key, plaintext as Bytes));
    this.n++;
    return out;
  }
  async decrypt(ad: Uint8Array, ciphertext: Uint8Array): Promise<Bytes> {
    if (!this.key) return new Uint8Array(ciphertext);
    let out: Bytes;
    try {
      out = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: this.nonce(), additionalData: ad as Bytes }, this.key, ciphertext as Bytes));
    } catch {
      throw new Error("A message didn't decrypt: it was changed, out of order, or under another key.");
    }
    this.n++;
    return out;
  }
}

export type Pattern = "IK" | "IKpsk2";
const tokens: Record<Pattern, string[][]> = {
  IK: [["e", "es", "s", "ss"], ["e", "ee", "se"]],
  IKpsk2: [["e", "es", "s", "ss"], ["e", "ee", "se", "psk"]],
};

// One handshake, from either side. The initiator knows the responder's static key before it starts, as IK requires.
export class Handshake {
  private h!: Bytes;
  private ck!: Bytes;
  private cipher!: Cipher;
  private e?: KeyPair;
  private re?: Bytes;
  private step = 0;
  rs?: Bytes;
  private o: { pattern: Pattern; initiator: boolean; prologue: Uint8Array; s: KeyPair; rs?: Uint8Array; psk?: Uint8Array; e?: KeyPair };
  constructor(o: { pattern: Pattern; initiator: boolean; prologue: Uint8Array; s: KeyPair; rs?: Uint8Array; psk?: Uint8Array; e?: KeyPair }) {
    this.o = o;
    this.rs = o.rs ? new Uint8Array(o.rs) : undefined;
    this.e = o.e;
  }
  private get psk() {
    return this.o.pattern === "IKpsk2";
  }
  async init() {
    const name = utf8(`Noise_${this.o.pattern}_25519_AESGCM_SHA256`);
    this.h = name.length <= 32 ? concat(name, new Uint8Array(32 - name.length)) : new Uint8Array(await crypto.subtle.digest("SHA-256", name));
    this.ck = this.h;
    this.cipher = await Cipher.of(null);
    await this.mixHash(this.o.prologue);
    // The pre-message `<- s`: the responder's static key.
    await this.mixHash(this.o.initiator ? this.rs! : this.o.s.publicKey);
    return this;
  }
  private async mixHash(data: Uint8Array) {
    this.h = new Uint8Array(await crypto.subtle.digest("SHA-256", concat(this.h, data)));
  }
  private async mixKey(ikm: Uint8Array) {
    const [ck, k] = await hkdf(this.ck, ikm, 2);
    this.ck = ck;
    this.cipher = await Cipher.of(k);
  }
  private async mixKeyAndHash(ikm: Uint8Array) {
    const [ck, h, k] = await hkdf(this.ck, ikm, 3);
    this.ck = ck;
    await this.mixHash(h);
    this.cipher = await Cipher.of(k);
  }
  private async encryptAndHash(plaintext: Uint8Array) {
    const out = await this.cipher.encrypt(this.h, plaintext);
    await this.mixHash(out);
    return out;
  }
  private async decryptAndHash(ciphertext: Uint8Array) {
    const out = await this.cipher.decrypt(this.h, ciphertext);
    await this.mixHash(ciphertext);
    return out;
  }
  // The DH a token names, from this side: e and s are ours, re and rs theirs.
  private async token(t: string) {
    const ours = (k: "e" | "s") => (k === "e" ? this.e! : this.o.s);
    const theirs = (k: "e" | "s") => (k === "e" ? this.re! : this.rs!);
    // "es" is the initiator's e with the responder's s; read from the responder, that's its s with the initiator's e.
    const [a, b] = t.split("") as ["e" | "s", "e" | "s"];
    return this.o.initiator ? dh(ours(a), theirs(b)) : dh(ours(b), theirs(a));
  }
  private mine() {
    return (this.step % 2 === 0) === this.o.initiator;
  }
  async write(payload: Uint8Array): Promise<Bytes> {
    if (!this.mine() || this.step > 1) throw new Error("Not this side's handshake message to write.");
    const parts: Uint8Array[] = [];
    for (const t of tokens[this.o.pattern][this.step]) {
      if (t === "e") {
        this.e ??= await generateKeyPair();
        parts.push(this.e.publicKey);
        await this.mixHash(this.e.publicKey);
        if (this.psk) await this.mixKey(this.e.publicKey);
      } else if (t === "s") parts.push(await this.encryptAndHash(this.o.s.publicKey));
      else if (t === "psk") await this.mixKeyAndHash(this.o.psk!);
      else await this.mixKey(await this.token(t));
    }
    parts.push(await this.encryptAndHash(payload));
    this.step++;
    return concat(...parts);
  }
  async read(message: Uint8Array): Promise<Bytes> {
    if (this.mine() || this.step > 1) throw new Error("Not the other side's handshake message to read.");
    let at = 0;
    const take = (n: number) => {
      if (at + n > message.length) throw new Error("A handshake message was too short.");
      return message.slice(at, (at += n));
    };
    for (const t of tokens[this.o.pattern][this.step]) {
      if (t === "e") {
        this.re = take(32);
        await this.mixHash(this.re);
        if (this.psk) await this.mixKey(this.re);
      } else if (t === "s") this.rs = await this.decryptAndHash(take(this.cipher.hasKey ? 48 : 32));
      else if (t === "psk") await this.mixKeyAndHash(this.o.psk!);
      else await this.mixKey(await this.token(t));
    }
    const payload = await this.decryptAndHash(message.slice(at));
    this.step++;
    return payload;
  }
  get done() {
    return this.step === 2;
  }
  // The handshake hash, which both ends share once it's done: the six digits come from it.
  get hash() {
    return this.h;
  }
  // The two transport ciphers, this side's to send with and to receive with.
  async split(): Promise<{ send: Cipher; recv: Cipher }> {
    if (!this.done) throw new Error("The handshake isn't done.");
    const [k1, k2] = await hkdf(this.ck, new Uint8Array(0), 2);
    const [a, b] = [await Cipher.of(k1), await Cipher.of(k2)];
    return this.o.initiator ? { send: a, recv: b } : { send: b, recv: a };
  }
}
