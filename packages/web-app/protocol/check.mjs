// Checks the protocol against published vectors: Noise IK and IKpsk2 against cacophony's, and CPace against
// draft-irtf-cfrg-cpace-21's B.3, for ristretto255 and SHA-512. Run it after any change to the protocol:
//
//   node packages/web-app/protocol/check.mjs
import { readFileSync } from "node:fs";
import { fromHex, hex, utf8 } from "./bytes.ts";
import { Handshake, keyPairFromPrivate } from "./noise.ts";
import { generator, isk, lvCat, prependLen, secret, share, transcript } from "./cpace.ts";

let passed = 0, failed = 0;
const ok = (cond, what) => (cond ? passed++ : failed++, console.log(`${cond ? "ok  " : "FAIL"} ${what}`));

for (const v of JSON.parse(readFileSync(new URL("./noise-vectors.json", import.meta.url), "utf8")).vectors) {
  const pattern = v.protocol_name.includes("psk2") ? "IKpsk2" : "IK";
  const psk = v.init_psks?.[0] && fromHex(v.init_psks[0]);
  const init = await new Handshake({ pattern, initiator: true, prologue: fromHex(v.init_prologue), s: await keyPairFromPrivate(fromHex(v.init_static)), rs: fromHex(v.init_remote_static), e: await keyPairFromPrivate(fromHex(v.init_ephemeral)), psk }).init();
  const resp = await new Handshake({ pattern, initiator: false, prologue: fromHex(v.resp_prologue), s: await keyPairFromPrivate(fromHex(v.resp_static)), e: await keyPairFromPrivate(fromHex(v.resp_ephemeral)), psk: v.resp_psks?.[0] && fromHex(v.resp_psks[0]) }).init();
  const out = [];
  let ciphers;
  for (const [i, m] of v.messages.entries()) {
    const fromInit = i % 2 === 0;
    if (i < 2) {
      const [w, r] = fromInit ? [init, resp] : [resp, init];
      const ct = await w.write(fromHex(m.payload));
      const pt = await r.read(ct);
      out.push(hex(ct) === m.ciphertext && hex(pt) === m.payload);
      if (i === 1) ciphers = { init: await init.split(), resp: await resp.split() };
    } else {
      const [w, r] = fromInit ? [ciphers.init, ciphers.resp] : [ciphers.resp, ciphers.init];
      const ct = await w.send.encrypt(new Uint8Array(0), fromHex(m.payload));
      const pt = await r.recv.decrypt(new Uint8Array(0), ct);
      out.push(hex(ct) === m.ciphertext && hex(pt) === m.payload);
    }
  }
  ok(out.every(Boolean), `${v.protocol_name}: each of its ${v.messages.length} messages matches`);
  ok(hex(init.hash) === v.handshake_hash && hex(resp.hash) === v.handshake_hash, `${v.protocol_name}: the handshake hash matches`);
  // A message altered on the way fails.
  const a = await new Handshake({ pattern, initiator: true, prologue: utf8("x"), s: await keyPairFromPrivate(fromHex(v.init_static)), rs: fromHex(v.init_remote_static), psk }).init();
  const b = await new Handshake({ pattern, initiator: false, prologue: utf8("x"), s: await keyPairFromPrivate(fromHex(v.resp_static)), psk }).init();
  const msg = await a.write(utf8("hello"));
  msg[msg.length - 1] ^= 1;
  ok(await b.read(msg).then(() => false, () => true), `${v.protocol_name}: an altered message is refused`);
}

// CPace, draft 21, B.3.
const PRS = utf8("Password"), CI = fromHex("0b415f696e69746961746f720b425f726573706f6e646572"), sid = fromHex("7e4b4791d6a8ef019b936c79fb7f2c57");
ok(hex(prependLen(utf8("1234"))) === "0431323334" && hex(lvCat(utf8("1234"), utf8("5"), new Uint8Array(0), utf8("678"))) === "043132333401350003363738", "CPace: prepend_len and lv_cat (A.1)");
ok(hex((await generator(PRS, CI, sid)).toBytes()) === "222b6b195fe84b1652badb6f6a3ae3d24341e7306967f0b8115b40d5698c7e56", "CPace: the generator (B.3.1)");
const A = await share(PRS, CI, sid, fromHex("da3d23700a9e5699258aef94dc060dfda5ebb61f02a5ea77fad53f4ff0976d08"));
const B = await share(PRS, CI, sid, fromHex("d2316b454718c35362d83d69df6320f38578ed5984651435e2949762d900b80d"));
ok(hex(A.Y) === "d6bac480f2c386c394efc7c47adb9925dcd2630b64f240c50f8d0eec482b9157", "CPace: Ya (B.3.2)");
ok(hex(B.Y) === "3ea7e0b19560d7c0b0f5734f63b955286dfa8232b5ebe63324e2d9e7433f7258", "CPace: Yb (B.3.3)");
const Ka = secret(A.y, B.Y), Kb = secret(B.y, A.Y);
ok(hex(Ka) === "80b69a8a76457ab6a4d7f887a4bf6b55a2f80ac19c333f917a05fc9887c8b40f" && hex(Kb) === hex(Ka), "CPace: K on both sides (B.3.4)");
const ADa = utf8("ADa"), ADb = utf8("ADb");
ok(hex(transcript(A.Y, ADa, B.Y, ADb)) === "20d6bac480f2c386c394efc7c47adb9925dcd2630b64f240c50f8d0eec482b915703414461203ea7e0b19560d7c0b0f5734f63b955286dfa8232b5ebe63324e2d9e7433f725803414462", "CPace: transcript_ir (B.3.5)");
ok(hex(await isk(sid, Ka, A.Y, ADa, B.Y, ADb)) === "b69effbf61b51d56401c0f65601abe428de8206feaaf0e32198896dcae7b35cd2b38950a39dfd5d4a79164614c2984f7daa460b588c1e80c3fa2068af7900447", "CPace: ISK (B.3.5)");
ok((() => { try { secret(A.y, new Uint8Array(32)); return false; } catch { return true; } })(), "CPace: the identity is refused");
ok((() => { try { secret(A.y, new Uint8Array(32).fill(0xff)); return false; } catch { return true; } })(), "CPace: a point that doesn't decode is refused");
// A wrong code gives another key.
const C = await share(utf8("Passw0rd"), CI, sid);
ok(hex(secret(C.y, A.Y)) !== hex(Ka), "CPace: a wrong code gives a different K");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
