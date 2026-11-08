#!/usr/bin/env node
// What a release holds, from git alone: the facts every /prep-release run starts from. It reads and prints, and changes
// nothing. Run it from the repository root: node .agents/skills/prep-release/scripts/scope.mjs [version] [previous tag]
// Each "check:" line is a lead to look at, not a verdict.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";

const git = (...args) => {
  try {
    return execFileSync("git", args, { encoding: "utf8", maxBuffer: 1 << 28, stdio: ["ignore", "pipe", "ignore"] }).trimEnd();
  } catch {
    return "";
  }
};
const at = (ref, path) => git("show", `${ref}:${path}`);
const json = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};
const lines = (text) => (text ? text.split("\n") : []);
const say = (...parts) => console.log(...parts);
const head = (title) => say(`\n## ${title}`);

const branch = git("branch", "--show-current");
const version = process.argv[2] ?? /^release\/(.+)$/.exec(branch)?.[1];
const prev = process.argv[3] ?? git("describe", "--tags", "--abbrev=0", "--match", "v*", "HEAD");
if (!version || !prev) {
  say("Can't tell the release. Pass it: scope.mjs <version> <previous tag>, such as scope.mjs 0.8.0 v0.7.0");
  process.exit(1);
}
const range = `${prev}..HEAD`;

head(`Release ${version}, since ${prev}`);
say(`branch ${branch || "(detached)"}, ${git("rev-list", "--count", range)} commits, package.json says ${json(readFileSync("package.json", "utf8")).version}`);
const ahead = git("rev-list", "--count", "@{u}..HEAD");
if (ahead && ahead !== "0") say(`check: ${ahead} commits aren't pushed`);
const dirty = git("status", "--porcelain");
if (dirty) say(`check: the working tree has changes:\n${dirty}`);

head("Changed files, by area");
const changed = lines(git("diff", "--name-status", "--find-renames", range)).map((l) => l.split("\t"));
const areas = new Map();
for (const [, ...paths] of changed) {
  const path = paths.at(-1);
  const parts = path.split("/");
  const area = ["packages", "plugins", "docs"].includes(parts[0]) && parts.length > 2 ? parts.slice(0, 2).join("/") : parts.length > 1 ? parts[0] : "(root)";
  areas.set(area, (areas.get(area) ?? 0) + 1);
}
for (const [area, n] of [...areas].sort((a, b) => b[1] - a[1])) say(`${String(n).padStart(4)}  ${area}`);
say(git("diff", "--shortstat", range));

head("Migrations");
for (const dir of ["packages/sdk/src/migrations", ...readdirSync("plugins").map((p) => `plugins/${p}/fxbot/migrations`)]) {
  const rows = changed.filter(([, ...paths]) => paths.some((p) => p.startsWith(dir + "/")));
  for (const [status, ...paths] of rows) say(`${status === "A" ? "added  " : `check: ${status} (a shipped migration must never change)`}  ${paths.join(" -> ")}`);
}
const unreleased = (readFileSync("CHANGELOG.md", "utf8").split(/^## /m).find((s) => s.startsWith("Unreleased")) ?? "");
for (const [status, path] of changed.filter(([s, p]) => s === "A" && p?.startsWith("packages/sdk/src/migrations/"))) {
  const id = path.split("/").pop().replace(/\.sql$/, "");
  if (!unreleased.includes(id)) say(`check: CHANGELOG's Unreleased doesn't name ${id}, for Before upgrading`);
}

head("fxbot's plugins");
for (const name of readdirSync("plugins").sort()) {
  const path = `plugins/${name}/plugin.json`;
  if (!existsSync(path)) continue;
  const now = json(readFileSync(path, "utf8")), then = json(at(prev, path));
  const floor = now?.extensions?.["sh.fxbot"]?.minFxbot ?? "-";
  const files = lines(git("diff", "--name-only", range, "--", `plugins/${name}`));
  const own = (f) => files.includes(`plugins/${name}/${f}`);
  // Installs mark an update by the files' hash, not the version, so a version that stayed only leaves it unnamed.
  let note = !then ? "new" : then.version === now.version ? (files.length ? "files changed, version stayed (installs still see an update; nothing names it)" : "unchanged") : `${then.version} -> ${now.version}`;
  if (own("fxbot/page.jsx") && !own("fxbot/page.js")) note += "; check: page.jsx changed, page.js didn't (rebuild it)";
  say(`${name.padEnd(20)} ${String(now?.version).padEnd(8)} minFxbot ${String(floor).padEnd(7)} ${files.length} files  ${note}`);
}
say(`(installs check each plugin's repository hourly and offer what changed, so these reach owners still on ${prev} as soon as main moves; a minFxbot above ${prev} shows Needs fxbot there instead)`);

head("Plugin API");
const api = git("diff", "-U0", range, "--", "packages/sdk/src/plugin-api.ts");
const removed = lines(api).filter((l) => /^-(?!--)/.test(l) && !/^-\s*(\/\/|\*|\/\*)/.test(l) && l.slice(1).trim());
const added = lines(api).filter((l) => /^\+(?!\+\+)/.test(l) && !/^\+\s*(\/\/|\*|\/\*)/.test(l) && l.slice(1).trim());
say(`plugin-api.ts: +${added.length} -${removed.length} code lines`);
if (removed.length) say("check each removed or changed line against plugin-breaks.json and the Unreleased notes:\n" + removed.slice(0, 40).map((l) => "  " + l.slice(1).trim()).join("\n"));
const breaks = (b) => json(b)?.breaks?.length ?? 0;
say(`plugin-breaks.json: ${breaks(at(prev, "packages/sdk/src/plugin-breaks.json"))} lines at ${prev}, ${breaks(readFileSync("packages/sdk/src/plugin-breaks.json", "utf8"))} now`);

head("Dependencies");
const manifests = ["package.json", ...readdirSync("packages").map((p) => `packages/${p}/package.json`), ...readdirSync("plugins").map((p) => `plugins/${p}/package.json`)].filter(existsSync);
let deps = 0;
for (const path of manifests) {
  const now = json(readFileSync(path, "utf8")) ?? {}, then = json(at(prev, path)) ?? {};
  for (const kind of ["dependencies", "devDependencies", "peerDependencies"]) {
    const a = then[kind] ?? {}, b = now[kind] ?? {};
    for (const name of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (a[name] === b[name]) continue;
      deps++;
      say(`${path}: ${name} ${a[name] ?? "(new)"} -> ${b[name] ?? "(removed)"}${kind === "dependencies" ? "" : ` [${kind}]`}`);
    }
  }
}
if (!deps) say("none changed");

head("Settings an owner sets");
const vars = (text) => new Set(text.match(/\bFXBOT_[A-Z0-9_]+\b/g) ?? []);
const code = (ref) => git("grep", "-h", "-o", "-E", "FXBOT_[A-Z0-9_]+", ref, "--", "packages/sdk/src", "packages/server/src", "deploy", "setup.sh");
const before = vars(code(prev)), after = vars(code("HEAD")), readme = readFileSync("README.md", "utf8");
const fresh = [...after].filter((v) => !before.has(v));
say(fresh.length ? fresh.map((v) => `new: ${v}${readme.includes(v) ? "" : "  check: not in the README's variables"}`).join("\n") : "no new FXBOT_ variables");
for (const v of before) if (!after.has(v)) say(`gone: ${v}  check: an owner's .env may still set it`);

head("Docs");
const docs = changed.filter(([, ...p]) => p.some((x) => x.startsWith("packages/website/src/content/docs/")));
for (const [status, ...paths] of docs.filter(([s]) => s !== "M")) say(`${status}  ${paths.join(" -> ")}`);
say(`${docs.filter(([s]) => s === "M").length} pages edited`);
const sidebar = readFileSync("packages/website/src/sidebar.ts", "utf8");
for (const set of ["docs", "sdk"]) {
  for (const kind of ["tutorials", "how-to", "reference", "explanation"]) {
    const dir = `packages/website/src/content/docs/${set}/${kind}`;
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir)) {
      const slug = `${kind}/${file.replace(/\.mdx?$/, "")}`;
      if (!sidebar.includes(`"${slug}"`) && slug !== "reference/changelog") say(`check: ${set}/${slug} isn't in src/sidebar.ts`);
    }
  }
}
const phases = changed.filter(([s, ...p]) => s !== "D" && p.at(-1).startsWith("docs/_completed/phases/"));
for (const [, ...paths] of phases) {
  const path = paths.at(-1), text = readFileSync(path, "utf8");
  const open = (text.match(/^\s*- \[ \]/gm) ?? []).length;
  say(`${path}${open ? `  check: ${open} unchecked boxes` : ""}${/not (been )?(tested|verified|checked)|untested|unverified/i.test(text) ? "  check: says something wasn't verified" : ""}`);
}
const notes = `docs/releases/${version}.md`;
say(existsSync(notes) ? (readFileSync(notes, "utf8").split("\n")[0] === `fxbot v${version} is out!` ? `${notes} is written` : `check: ${notes} must open with: fxbot v${version} is out!`) : `${notes} isn't written yet`);
say(unreleased ? `CHANGELOG Unreleased: ${(unreleased.match(/^- /gm) ?? []).length} bullets${/Before upgrading/.test(unreleased) ? ", with Before upgrading" : ""}` : "check: CHANGELOG.md has no ## Unreleased");

head("Added lines worth a look");
const diff = git("diff", "-U0", range, "--", ".", ":!package-lock.json", ":!**/package-lock.json", ":!**/page.js", ":!archive", ":!packages/ui/src/blob-data.ts", ":!packages/website/src/blob-data.ts");
const leads = [
  [/\b(TODO|FIXME|XXX|HACK)\b/, "a TODO"],
  [/\/root\/|\/home\/[a-z]|\/Users\/[A-Za-z]/, "a home path"],
  [/\b[a-z0-9-]+\.[a-z0-9-]+\.ts\.net\b/, "a tailnet hostname"],
  [/[A-Za-z0-9._%+-]+@(gmail|outlook|hotmail|icloud|proton)\.[a-z]+/, "a personal email"],
  [/BEGIN [A-Z ]*PRIVATE KEY|\bghp_[A-Za-z0-9]{20,}|\bsk-[A-Za-z0-9_-]{20,}|\bxai-[A-Za-z0-9]{20,}/, "a secret"],
];
let file = "", line = 0, hits = 0;
for (const l of lines(diff)) {
  if (l.startsWith("+++ ")) file = l.slice(6);
  else if (l.startsWith("@@")) line = Number(/\+(\d+)/.exec(l)?.[1] ?? 0);
  else if (l.startsWith("+")) {
    for (const [pattern, what] of leads) if (pattern.test(l) && hits++ < 60) say(`${what}: ${file}:${line}  ${l.slice(1).trim().slice(0, 140)}`);
    line++;
  }
}
if (!hits) say("none");
