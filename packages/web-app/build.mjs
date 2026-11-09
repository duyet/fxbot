// Builds dist/, which the Worker serves: dist/shell/ at web.fxbot.sh, and dist/frame/ at every frame's origin. It needs
// `npm install` here and at the repository's root, for rolldown. It prints each file's SHA-256 and writes them to
// dist/hashes.txt, so anyone can compare what web.fxbot.sh serves with a build of the same commit.
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { build } from "rolldown";

const here = new URL(".", import.meta.url).pathname;
const dist = join(here, "dist");
rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, "shell"), { recursive: true });
mkdirSync(join(dist, "frame"), { recursive: true });

const bundle = (input, file, format) => build({ input: join(here, input), platform: "browser", write: true, output: { file: join(dist, file), format, minify: true, comments: { legal: false } } });
await bundle("shell/shell.ts", "shell/shell.js", "esm");
await bundle("shell/sw.ts", "shell/sw.js", "iife");
await bundle("frame/start.ts", "frame/start.js", "iife");
await bundle("frame/frame.ts", "frame/frame.js", "iife");
await bundle("frame/sw.ts", "frame/sw.js", "iife");
for (const f of ["index.html", "shell.css", "manifest.webmanifest", "icon-192.png", "icon-512.png", "licenses.txt"]) copyFileSync(join(here, "shell", f), join(dist, "shell", f));
copyFileSync(join(here, "frame/start.html"), join(dist, "frame/start.html"));

// The shell's worker keeps its files under a name that changes with them.
const files = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? files(join(dir, f)) : [join(dir, f)])).sort();
const sha = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const version = createHash("sha256").update(files(join(dist, "shell")).filter((f) => !f.endsWith("sw.js")).map(sha).join()).digest("hex").slice(0, 12);
const sw = join(dist, "shell/sw.js");
writeFileSync(sw, readFileSync(sw, "utf8").replace("__FXBOT_BUILD__", version));
const hashes = files(dist).map((f) => `${sha(f)}  ${relative(dist, f)}`).join("\n") + "\n";
writeFileSync(join(dist, "hashes.txt"), hashes);
process.stdout.write(hashes);
