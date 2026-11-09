// A device code sign-in (RFC 8628) for a provider fxbot signs in to itself: Hugging Face and OrcaRouter. Vercel's is in
// vercel.ts, and the plans' are libfx's.
type Fetch = typeof fetch;
export type Device = { verificationUrl: string; userCode: string; deviceCode: string; intervalMs: number; expiresAt: number };

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => (clearTimeout(timer), reject(signal.reason)), { once: true });
  });
export const form = (fields: Record<string, string>): RequestInit => ({
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
  body: new URLSearchParams(fields).toString(),
});
export const json = (fields: Record<string, string>): RequestInit => ({ method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(fields) });

// The code and the page to enter it on, which must be the provider's own, since the page shows it as a link.
export async function startDevice(fetch: Fetch, url: string, init: RequestInit, name: string, host: string): Promise<Device> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const said = typeof body.error_description === "string" ? body.error_description : typeof body.error === "string" ? body.error : "";
    throw new Error(`${name} did not issue a device code (HTTP ${response.status})${said ? `: ${said.replace(/\.$/, "").slice(0, 300)}` : ""}.`);
  }
  const body = await response.json();
  const page = new URL(body.verification_uri_complete ?? body.verification_uri);
  if (page.protocol !== "https:" || !(page.hostname === host || page.hostname.endsWith(`.${host}`))) throw new Error(`${name} answered with a sign-in address that is not on ${host}.`);
  return {
    verificationUrl: page.href,
    userCode: body.user_code,
    deviceCode: body.device_code,
    intervalMs: (Number(body.interval) || 5) * 1000,
    expiresAt: Date.now() + (Number(body.expires_in) || 600) * 1000,
  };
}

// Polls at the provider's interval, 5 seconds slower after each `slow_down`, until the owner enters the code, and
// answers the token endpoint's body.
export async function pollDevice(fetch: Fetch, device: Device, url: string, init: (deviceCode: string) => RequestInit, name: string, signal?: AbortSignal) {
  let interval = device.intervalMs;
  for (;;) {
    await wait(interval, signal);
    if (Date.now() > device.expiresAt) throw new Error("The code expired before it was entered. Start again.");
    const response = await fetch(url, { ...init(device.deviceCode), signal });
    const body = await response.json().catch(() => ({}));
    if (response.ok) return body;
    if (body.error === "authorization_pending") continue;
    if (body.error === "slow_down") interval += 5000;
    else if (body.error === "expired_token") throw new Error("The code expired before it was entered. Start again.");
    else if (body.error === "access_denied") throw new Error(`The sign-in was declined at ${name}.`);
    else throw new Error(`${name} could not finish the sign-in (HTTP ${response.status}).`);
  }
}
