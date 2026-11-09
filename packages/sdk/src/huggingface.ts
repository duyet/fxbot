import { form, pollDevice, startDevice, type Device } from "./device.ts";

// Sign in with Hugging Face by device code, through fxbot's own public app, for its router's models. The endpoints come
// from https://huggingface.co/.well-known/openid-configuration. Its tokens expire, and are renewed with the refresh token.
type Fetch = typeof fetch;
export type HfCredentials = { accessToken: string; refreshToken?: string; expiresAt?: number };
const tokenUrl = "https://huggingface.co/oauth/token";
const credentials = (body: any, old?: HfCredentials): HfCredentials => ({
  accessToken: body.access_token,
  refreshToken: body.refresh_token ?? old?.refreshToken,
  ...(Number.isFinite(body.expires_in) ? { expiresAt: Date.now() + body.expires_in * 1000 } : {}),
});

export const start = (clientId: string, fetch: Fetch) =>
  startDevice(fetch, "https://huggingface.co/oauth/device", form({ client_id: clientId, scope: "inference-api" }), "Hugging Face", "huggingface.co");

export async function complete(device: Device, clientId: string, fetch: Fetch, signal?: AbortSignal): Promise<HfCredentials> {
  const grant = (deviceCode: string) => form({ grant_type: "urn:ietf:params:oauth:grant-type:device_code", device_code: deviceCode, client_id: clientId });
  return credentials(await pollDevice(fetch, device, tokenUrl, grant, "Hugging Face", signal));
}

export async function refresh(old: HfCredentials, clientId: string, fetch: Fetch): Promise<HfCredentials> {
  if (!old.refreshToken) throw new Error("This Hugging Face sign-in cannot be renewed. Sign in again.");
  const response = await fetch(tokenUrl, form({ grant_type: "refresh_token", refresh_token: old.refreshToken, client_id: clientId }));
  if (!response.ok) throw new Error(`Hugging Face did not renew the sign-in (HTTP ${response.status}). Sign in again.`);
  return credentials(await response.json(), old);
}
