// Writes packages/ui/src/provider-logos.ts: a logo for each provider the Add provider page offers, and for models.dev's
// other hosts in its search. Run it after adding a provider to packages/sdk/src/providers-registry.json:
//
//   node scripts/provider-logos.mjs
//
// The logos come from LobeHub's icons (MIT, a release at least two weeks old), in their brand's colors where it has them,
// models.dev (MIT), and llama.cpp's own repository (MIT). OrcaRouter's, which none has as a shape, is its site's own
// picture, made small in scripts/provider-logos/. Each is its owner's trademark, used only to name its provider.
// The page shows each as an image, which runs nothing, in its own colors, on a light tile in both themes. A provider with
// none shows its first letter.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const lobehub = "https://unpkg.com/@lobehub/icons-static-svg@1.98.0/icons";
// Where a catalog entry's logo comes from, when it isn't models.dev's logo for the entry's first models.dev id: LobeHub's
// in color where it has one, and its single-color one where the brand itself is one color.
const lobe = (name) => `url:${lobehub}/${name}.svg`;
const sources = {
  chatgpt: lobe("openai"),
  openai: lobe("openai"),
  grok: lobe("grok"),
  xai: lobe("xai"),
  vercel: lobe("vercel"),
  gateway: lobe("vercel"),
  anthropic: lobe("anthropic"),
  gemini: lobe("gemini-color"),
  deepseek: lobe("deepseek-color"),
  // LobeHub's color one is the lime OpenRouter left: its shape, in the purple openrouter.ai uses now (--primary).
  openrouter: `color:#7624f4:${lobe("openrouter")}`,
  // https://www.orcarouter.ai/orca-logo-classic.png, at 96 pixels.
  orcarouter: "png:scripts/provider-logos/orcarouter.png",
  zai: lobe("zai"),
  qwen: lobe("qwen-color"),
  kimi: lobe("kimi-color"),
  minimax: lobe("minimax-color"),
  mistral: lobe("mistral-color"),
  groq: lobe("groq"),
  together: lobe("together-color"),
  fireworks: lobe("fireworks-color"),
  deepinfra: lobe("deepinfra-color"),
  cerebras: lobe("cerebras-color"),
  nvidia: lobe("nvidia-color"),
  huggingface: lobe("huggingface-color"),
  nous: lobe("nousresearch"),
  opencode: lobe("opencode"),
  "opencode-go": lobe("opencode"),
  vertex: lobe("vertexai-color"),
  bedrock: lobe("bedrock-color"),
  azure: lobe("azure-color"),
  cloudflare: lobe("cloudflare-color"),
  ollama: lobe("ollama"),
  lmstudio: lobe("lmstudio"),
  vllm: lobe("vllm-color"),
  llamacpp: "url:https://raw.githubusercontent.com/ggml-org/llama.cpp/2cfef4d117d67ab1dec002915b48a15d11ee1973/media/llama1-icon-transparent.svg",
};

const get = async (url) => {
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.text();
};
// models.dev answers an id it has no logo for with one of its own, so that one counts as none.
const placeholder = await get("https://models.dev/logos/fxbot-no-such-provider.svg");

// An SVG, small: no editor's notes, no size of its own, its viewBox kept.
function tidy(svg) {
  let out = svg
    .replace(/<\?xml[^>]*>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(sodipodi|inkscape):[^>]*\/>/g, "")
    .replace(/<(sodipodi|inkscape):[\s\S]*?<\/\1:[^>]*>/g, "")
    .replace(/<(title|metadata|desc)[\s\S]*?<\/\1>/g, "")
    .replace(/\s(?:sodipodi|inkscape|xmlns:(?:sodipodi|inkscape|svg|dc|cc|rdf))(?::[\w-]+)?="[^"]*"/g, "")
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .trim();
  out = out.replace(/<svg\b[^>]*>/, (open) => {
    const box = /viewBox="([^"]+)"/.exec(open)?.[1] ?? `0 0 ${/width="([\d.]+)/.exec(open)?.[1] ?? 24} ${/height="([\d.]+)/.exec(open)?.[1] ?? 24}`;
    const xlink = /xlink:/.test(svg) ? ' xmlns:xlink="http://www.w3.org/1999/xlink"' : "";
    // How it's painted stays: a fill, and the rule that cuts holes in its shapes.
    const paint = [...open.matchAll(/\s((?:fill|fill-rule|clip-rule|stroke|stroke-width|stroke-linecap|stroke-linejoin)="[^"]*")/g)].map(([, a]) => ` ${a}`).join("");
    return `<svg xmlns="http://www.w3.org/2000/svg"${xlink} viewBox="${box}"${paint}>`;
  });
  // An image runs nothing, but a logo that names anything outside itself, other than a picture inside it, is left out.
  if (!out.startsWith("<svg") || /<script|\son\w+="|href="(?!#|data:image\/)/i.test(out)) throw new Error("not a plain SVG");
  return out;
}

const { providers } = JSON.parse(readFileSync(join(root, "packages/sdk/src/providers-registry.json"), "utf8"));
const modelsDev = JSON.parse(await get("https://models.dev/api.json"));
const wanted = new Map(); // key → source
for (const e of providers) {
  const md = [e.modelsDev ?? []].flat()[0];
  wanted.set(e.id, sources[e.id] ?? (md ? `md:${md}` : `md:${e.id}`));
}
// models.dev's hosts that search shows: OpenAI-compatible at a fixed HTTPS address, as catalog.ts's `more` picks them.
const covered = new Set(providers.flatMap((e) => [e.id, ...[e.modelsDev ?? []].flat()]));
const searched = Object.entries(modelsDev).filter(([id, p]) => !covered.has(id) && p?.npm === "@ai-sdk/openai-compatible" && /^https:\/\/[^${}\s]+$/.test(p.api ?? ""));
for (const [id] of searched) wanted.set(id, `md:${id}`);

// A source: models.dev's logo by id, an address, a picture in this repository, or a one-color logo filled with a color.
async function logoAt(source) {
  const [kind, rest] = [source.slice(0, source.indexOf(":")), source.slice(source.indexOf(":") + 1)];
  if (kind === "md") return get(`https://models.dev/logos/${rest}.svg`);
  if (kind === "url") return get(rest);
  if (kind === "png") return `<svg viewBox="0 0 96 96"><image width="96" height="96" href="data:image/png;base64,${readFileSync(join(root, rest)).toString("base64")}"/></svg>`;
  const [color, from] = [rest.slice(0, rest.indexOf(":")), rest.slice(rest.indexOf(":") + 1)];
  return (await logoAt(from)).replaceAll("currentColor", color);
}
const logos = {};
const missing = [];
const queue = [...wanted];
await Promise.all(
  Array.from({ length: 8 }, async () => {
    for (let next = queue.shift(); next; next = queue.shift()) {
      const [key, source] = next;
      try {
        const svg = await logoAt(source);
        if (svg === placeholder) throw new Error("no logo");
        const small = tidy(svg);
        // A search result's logo is left out when it's large: the page loads them all at once.
        if (small.length > 6000 && !providers.some((e) => e.id === key)) throw new Error("too large");
        logos[key] = small;
      } catch (error) {
        missing.push(`${key} (${error.message})`);
      }
    }
  }),
);

const keys = Object.keys(logos).sort();
const body = keys.map((key) => `  ${JSON.stringify(key)}: ${JSON.stringify(logos[key])},`).join("\n");
writeFileSync(
  join(root, "packages/ui/src/provider-logos.ts"),
  `// Written by scripts/provider-logos.mjs: each provider's logo, by its catalog id or its models.dev id. From LobeHub's
// icons (MIT), models.dev (MIT), and llama.cpp's repository (MIT). Each is its owner's trademark, used only to name its
// provider. Loaded only when the Add provider page opens.
export const logos: Record<string, string> = {\n${body}\n};\n`,
);
const curated = providers.filter((e) => logos[e.id]).length;
console.log(`${keys.length} logos, ${curated} of ${providers.length} catalog entries. Without one: ${providers.filter((e) => !logos[e.id]).map((e) => e.id).join(", ")}`);
console.log(`${Math.round(Buffer.byteLength(body) / 1024)} KB`);
