import { createHash, randomBytes } from "node:crypto";

// Sign in with OpenRouter by PKCE (https://openrouter.ai/docs/guides/overview/auth/oauth), which needs no app
// registered, and gives a key on the owner's account. OpenRouter sends the browser back to fxbot's own page with a
// code, or, with no callback, shows the code to paste. Either code, with the verifier only the server holds, makes the key.
type Fetch = typeof fetch;

export function begin(callbackUrl: string | undefined, state: string) {
  const verifier = randomBytes(32).toString("base64url");
  const url = new URL("https://openrouter.ai/auth");
  if (callbackUrl) url.searchParams.set("callback_url", callbackUrl);
  url.searchParams.set("code_challenge", createHash("sha256").update(verifier).digest("base64url"));
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("key_label", "fxbot");
  if (callbackUrl) url.searchParams.set("state", state);
  return { url: url.href, verifier };
}

export async function exchange(code: string, verifier: string, fetch: Fetch): Promise<{ apiKey: string }> {
  const response = await fetch("https://openrouter.ai/api/v1/auth/keys", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code, code_verifier: verifier, code_challenge_method: "S256" }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || typeof body.key !== "string") throw new Error(`OpenRouter did not give a key for that code (HTTP ${response.status}). Start again.`);
  return { apiKey: body.key };
}
