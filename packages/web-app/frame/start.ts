// The frame's first page: it runs only inside the shell, puts the frame's service worker in place, hands it a port to
// the shell, and then loads fxbot's own page through it.
import { askShell } from "./ask.ts";

const why = (text: string) => void (document.getElementById("why")!.textContent = text);
async function start() {
  if (window.top === window) return why("Open this fxbot from its app.");
  if (!("serviceWorker" in navigator)) return why("This browser can't run fxbot here: it has no service workers in this frame.");
  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  const worker = registration.active ?? (await navigator.serviceWorker.ready).active!;
  const port = await askShell();
  worker.postMessage({ fxbot: "port" }, [port]);
  const path = new URL(location.href).searchParams.get("path") ?? "/";
  location.replace(path.startsWith("/") && !path.startsWith("//") ? path : "/");
}
start().catch((error) => why(`fxbot couldn't start here: ${error instanceof Error ? error.message : error}`));
