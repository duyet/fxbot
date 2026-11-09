import { createPrivateKey, sign } from "node:crypto";

// Vertex AI takes an OAuth access token, never an API key. fxbot makes its own, an hour long, from a service account's
// JSON key: a JWT signed with the account's private key, traded at Google's token endpoint
// (https://developers.google.com/identity/protocols/oauth2/service-account).
type Fetch = typeof fetch;
export type ServiceAccount = { client_email: string; private_key: string; project_id: string; token_uri?: string };
export type VertexCredentials = { serviceAccount: ServiceAccount; accessToken?: string; expiresAt?: number };
const fail = (message: string): never => {
  throw Object.assign(new Error(message), { status: 400 });
};

// The JSON key's file as the owner chose it, checked enough to sign with.
export function readServiceAccount(text: unknown): ServiceAccount {
  let account: any;
  try {
    account = JSON.parse(String(text));
  } catch {
    return fail("That file isn't a service account's JSON key.");
  }
  if (account?.type !== "service_account" || typeof account.client_email !== "string" || typeof account.private_key !== "string" || typeof account.project_id !== "string")
    fail("That file isn't a service account's JSON key: it needs type, client_email, private_key, and project_id.");
  try {
    createPrivateKey(account.private_key);
  } catch {
    fail("That service account's private key doesn't read as a key.");
  }
  // Google's own token endpoint only, so the signed assertion goes nowhere else.
  if (account.token_uri !== undefined && account.token_uri !== "https://oauth2.googleapis.com/token") fail("That service account names a token endpoint that isn't Google's.");
  return { client_email: account.client_email, private_key: account.private_key, project_id: account.project_id };
}

export const baseUrl = (project: string, location: string) =>
  `https://${location === "global" ? "" : `${location}-`}aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/endpoints/openapi`;

const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
export async function token(account: ServiceAccount, fetch: Fetch, tokenUrl = "https://oauth2.googleapis.com/token"): Promise<{ accessToken: string; expiresAt: number }> {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({ iss: account.client_email, scope: "https://www.googleapis.com/auth/cloud-platform", aud: tokenUrl, iat: now, exp: now + 3600 })}`;
  const assertion = `${unsigned}.${sign("RSA-SHA256", Buffer.from(unsigned), account.private_key).toString("base64url")}`;
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }).toString(),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || typeof body.access_token !== "string")
    throw Object.assign(new Error(`Google refused the service account (HTTP ${response.status}${body.error_description ? `: ${body.error_description}` : ""}).`), { status: 400 });
  return { accessToken: body.access_token, expiresAt: Date.now() + (Number(body.expires_in) || 3600) * 1000 };
}
