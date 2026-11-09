import { json, pollDevice, startDevice, type Device } from "./device.ts";

// Sign in with OrcaRouter by device code, which needs no app registered, and gives a key that doesn't expire
// (https://docs.orcarouter.ai/getting-started/sign-in-with-orcarouter.md). Its discovery document names http://
// endpoints, so the addresses are fixed here.
type Fetch = typeof fetch;

export const start = (fetch: Fetch) => startDevice(fetch, "https://www.orcarouter.ai/api/v1/auth/device/code", json({ app_name: "fxbot" }), "OrcaRouter", "orcarouter.ai");

export async function complete(device: Device, fetch: Fetch, signal?: AbortSignal): Promise<{ apiKey: string }> {
  const grant = (deviceCode: string) => json({ grant_type: "urn:ietf:params:oauth:grant-type:device_code", device_code: deviceCode });
  const body = await pollDevice(fetch, device, "https://www.orcarouter.ai/api/v1/auth/device/token", grant, "OrcaRouter", signal);
  if (typeof body.key !== "string" || !body.key) throw new Error("OrcaRouter answered without a key.");
  if (body.scope && body.scope !== "api") throw new Error(`OrcaRouter gave a key for ${body.scope}, not its API.`);
  return { apiKey: body.key };
}
