// Passkeys, opt-in: one per fxbot, which the browser's password manager keeps and syncs. On a wiped or new device, it
// pairs again with no code and no other device. WebAuthn binds it to this site, so a lookalike page can't use it.
import { b64u, dec, fromB64u, random, utf8 } from "../protocol/bytes.ts";
import { Handshake, generateKeyPair } from "../protocol/noise.ts";
import * as wire from "../protocol/wire.ts";
import type { Link, Pairing } from "./shell.ts";

export const passkeysSupported = () => typeof PublicKeyCredential !== "undefined" && Boolean(navigator.credentials?.create);

// Its user id carries the fxbot's address and key, which is all a wiped device needs to find it again.
export async function addPasskey(link: Link) {
  const { challenge } = await link.ask("passkey-start");
  const cred = (await navigator.credentials.create({
    publicKey: {
      rp: { id: location.hostname, name: "fxbot" },
      user: { id: wire.passkeyUser(link.p.rid, fromB64u(link.p.I)), name: `${link.p.name} (fxbot)`, displayName: link.p.name },
      challenge: fromB64u(challenge),
      pubKeyCredParams: [-8, -7, -257].map((alg) => ({ type: "public-key" as const, alg })),
      authenticatorSelection: { residentKey: "required", userVerification: "required" },
      attestation: "none",
    },
  })) as PublicKeyCredential | null;
  if (!cred) throw new Error("No passkey was made.");
  const r = cred.response as AuthenticatorAttestationResponse;
  const spki = r.getPublicKey();
  if (!spki) throw new Error("This browser didn't give the passkey's public key.");
  await link.ask("passkey-add", { id: b64u(new Uint8Array(cred.rawId)), spki: b64u(new Uint8Array(spki)), alg: r.getPublicKeyAlgorithm(), clientData: b64u(new Uint8Array(r.clientDataJSON)) });
}

// Pairs this device by passkey: a new key, an assertion over it, then Noise IK to the fxbot the passkey names.
export async function recoverWithPasskey(relay: string, me: { name: string; platform: string }, frame: string): Promise<Pairing> {
  const D = await generateKeyPair(false);
  const time = Date.now();
  const nonce = random(16);
  const cred = (await navigator.credentials.get({ publicKey: { challenge: await wire.passkeyChallenge(D.publicKey, time, nonce), rpId: location.hostname, userVerification: "required" } })) as PublicKeyCredential | null;
  if (!cred) throw new Error("No passkey was chosen.");
  const r = cred.response as AuthenticatorAssertionResponse;
  if (!r.userHandle) throw new Error("That passkey doesn't say which fxbot it's for.");
  const { rid, I } = wire.readPasskeyUser(new Uint8Array(r.userHandle));
  const ws = new WebSocket(`${relay}/call/${rid}`);
  const answer = new Promise<wire.Envelope & { bytes: Uint8Array }>((resolve, reject) => {
    ws.onmessage = (e) => resolve(wire.readEnvelope(JSON.parse(String(e.data))));
    ws.onclose = () => reject(new Error(wire.errors.offline));
    setTimeout(() => reject(new Error("Your fxbot didn't answer in time.")), 20_000);
  });
  await new Promise((resolve, reject) => ((ws.onopen = resolve), (ws.onerror = () => reject(new Error(wire.errors.offline)))));
  const hs = await new Handshake({ pattern: "IK", initiator: true, prologue: wire.passkeyPrologue(rid), s: D, rs: I }).init();
  const proof = {
    passkey: { id: b64u(new Uint8Array(cred.rawId)), clientData: b64u(new Uint8Array(r.clientDataJSON)), authData: b64u(new Uint8Array(r.authenticatorData)), sig: b64u(new Uint8Array(r.signature)) },
    time,
    nonce: b64u(nonce),
    ...me,
  };
  ws.send(JSON.stringify(wire.envelope("r1", await hs.write(utf8(JSON.stringify(proof))))));
  const e = await answer;
  ws.close();
  if (e.k === "err") throw new Error(wire.errors[e.e as keyof typeof wire.errors] ?? "Your fxbot refused the passkey.");
  const hello = JSON.parse(dec.decode(await hs.read(e.bytes))) as { deviceId: string; name: string };
  return { rid, I: b64u(I), relay, device: hello.deviceId, frame, name: hello.name, key: D, seq: 0, pairedAt: Date.now(), how: "passkey" };
}
