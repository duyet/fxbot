import { SHELL } from "./port.ts";

// Asks the shell for a port. The shell answers only its own frames, by origin.
export function askShell(): Promise<MessagePort> {
  return new Promise((resolve, reject) => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== SHELL || e.data?.fxbot !== "port" || !e.ports[0]) return;
      removeEventListener("message", onMessage);
      resolve(e.ports[0]);
    };
    addEventListener("message", onMessage);
    window.top!.postMessage({ fxbot: "port" }, SHELL);
    setTimeout(() => (removeEventListener("message", onMessage), reject(new Error("The app didn't answer."))), 10_000);
  });
}
