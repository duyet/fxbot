# Review: gaps, risks, and issues

Ask one question of every change since the last tag. What happens that nobody meant:

- to an owner who updates to this release?
- to an owner still on the last one?
- to someone who wrote a plugin against it?

This pass reports and fixes nothing. The owner decides.

## Lenses

### Upgrade and data

- **Each migration added, core and plugin.** Does it run on a database the last release left: existing rows, nulls, and large tables? Does an existing install get a sensible value, rather than a first-run experience or a default it never chose? Is it in **Before upgrading**, with anything the owner must do?
- **A shipped migration that changed or went away.** That's a blocker. The release workflow refuses it for core. Installs that already ran a plugin's migration never run it again either.
- **Defaults and settings** that change what an existing install does without the owner choosing it.
- **A libfx or runtime bump.** Saved chats, provider behavior, and anything that reads old rows.
- **Anything new kept outside Postgres and `FXBOT_DATA`.** An update backs up only those two.

### Plugins and the plugin API

- **The plugin API.** Anything removed, renamed, or changed in meaning needs a line in `packages/sdk/src/plugin-breaks.json` and a note under `## Unreleased`. Otherwise a plugin someone else wrote breaks with no warning. The scope script prints the removed and changed lines of `plugin-api.ts`.
- **When fxbot's own plugins reach owners.** Installs check each plugin's repository hourly, and offer what changed when its files' hash moves. Their versions don't matter for that. So owners still on the last release are offered a changed plugin as soon as `main` moves. A plugin that now uses something this release added needs one of two things:
  - `minFxbot` set to this version, so older installs show **Needs fxbot**
  - a fallback where the new thing is missing, as in `ui.useReorder ?? fallback`

  Search each changed plugin's `server.ts` and `page.jsx` for the API this release added.
- **Bundles.** `page.js` is rebuilt from `page.jsx`, and its size changed about as much as its source did. A plugin that bundles packages from its own `package.json` and is built without `npm ci` in its folder silently drops them. Its `page.js` comes out thousands of lines shorter, and fails in the browser.
- **Names in the changelog.** The changelog names each plugin version that `plugin.json` says. The Essentials list and the registry descriptions still match what each plugin does.

### What owners will notice

- **What now happens without asking:** new automatic actions, new prompts sent to models, rules a reviewer applies, outbound calls, and messages sent.
- **UI** removed, moved, or renamed. Docs and muscle memory still point at the old place.
- **Phones and the installed app:** safe areas, Safari on iOS (sticky elements, the keyboard, the viewport height), touch, and long-press.
- **Speed for what every owner waits on:** loading the page, sending a message, streaming a reply. Look for new requests on those paths, and for page weight. When the UI changed a lot, compare the built JavaScript with the last tag's.

### Security and privacy

Report these in the chat only, never in the docs, README, or notes, and keep each to a sentence or two.

- A key or token that can reach the page or `@fxbot/sdk/client`, or is stored unsealed.
- New routes and inputs: each checked once, at the edge that receives it.
- What a bot, a page, a plugin, or another bot's message can now make happen without the owner. Look at trust boundaries, at text a bot writes reaching a reviewer or a relay, at sandboxed frames, and at approvals.
- Files written outside `FXBOT_DATA`, and new outbound calls.

### Unfinished and unverified

- **This release's phase docs:** unchecked boxes, open questions the owner hasn't answered, notes like "not tested" or "only with the mock", and checks waiting on a person.
- **Loose ends:** TODOs added, stubs, and a feature that only works with a plugin outside **Essentials**.
- **Phase docs out of place:** a built phase still in `docs/phases/`, or a planned one described as running.

### Conventions and weight

From `CONVENTIONS.md`:

- the core naming a particular plugin
- plugin data in a core migration
- a shortcut into the core one of fxbot's own plugins takes
- a new dependency without a reason
- a file grown too long to read in one sitting
- dead code, or speculative options

### Release mechanics

- `package.json` still holds the last version. That's expected, since the release commit bumps it.
- `## Unreleased` exists. It opens with **Before upgrading** when the release has migrations, a libfx bump, or a step by hand.
- Generated files are current: `blob-data.ts` from `scripts/blob-data.mjs`, and each plugin's `page.js`.
- The notes file exists, or will be drafted in the docs pass.

## Severity

- **Blocker:** an owner who updates would lose data, fail to start, or lose a plugin. Or a headline feature is broken, or the release workflow would refuse the release.
- **Should fix:** it works, but it's wrong or confusing for owners or plugin authors, and there's a clear, cheap fix.
- **Worth knowing:** trade-offs, follow-ups, and choices the owner may want to revisit.
- **Not verified:** what nobody has checked, and how it could be.

## Report template

Put the verdict first. Write each finding as a plain sentence about what happens, then where it is, then what would fix it. Number them, so the owner can answer "fix 2 and 5".

```markdown
## Before <version>: gaps, risks, and issues

<N> blockers, <N> to fix, <N> worth knowing. <One sentence: ready apart from these, or not.>

### Blockers
1. **<What goes wrong, in plain words.>** <Who it happens to, and when.> `path/file.ts:123`. Fix: <the smallest change that would fix it>.

### Should fix
2. ...

### Worth knowing
3. ...

### Not verified
- <What nobody has checked.> To check: <how>.
```

Leave out an empty section. If the release looks clean, say so in one line. Don't pad it with weak findings.
