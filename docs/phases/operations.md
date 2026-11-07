# Operations

Getting fxbot onto a machine, keeping it running, and taking it off again, with as little as possible for the owner to know:
- **The computer runs wherever fxbot runs.** On Ubuntu's `docker.io`, the computer's setup stops today, because Ubuntu ships no rootless Docker script. The computer's engine becomes rootless podman, beside whichever engine fxbot itself runs on.
- **`setup.sh` checks before it changes anything,** and stops with what to do: a port in use, a Docker from snap, a CPU with no image, too little disk. It picks the engine that's already running, takes the engine and the port from the owner when asked, and shows its downloads as they go.
- **One command takes fxbot off the machine:** `sudo fxbot uninstall`, which keeps a backup and the key unless told `--purge`, and says what's left and how to remove it.
- **One command backs it up:** `sudo fxbot backup`, for moving to a new machine, and before an uninstall.
- **The docs say how:** a page to uninstall, and a page with the fix for each way an install stops.

Status: planned on 2026-11-07, on `release/0.7.0`, not built. Researched the same day against the research directive's references, nine other installers' scripts, and Debian's and Ubuntu's package indexes. Where this plan says *likely*, the checklist checks it before the build relies on it. The owner's five questions are answered in [fxbot today](#fxbot-today-the-owners-questions).

## What the owner asked

"I want you to look at our install setup... for fxbot..."

1. "What happens if user doesn't have docker or podman?"
2. "What happens if user has docker.io and not docker-ce?"
3. "Why can't one of my users run docker.io in rootless and run fxbot, they have to use docker-ce to do both?"
4. "How can we make install and operation of the application easier and more simple for end users?"
5. "How can we make uninstall of the application more straightforward and documented?"

"I want to make the app as easy as possible for users to install and get going!"

## 0. Core or plugin

**Core: what fxbot needs to run** ([Core or plugin](../../CONVENTIONS.md#core-or-plugin)). Install, updates, and backups are core, and uninstall goes with them. The work is in `setup.sh`, the machine's `fxbot` command (`deploy/fxbot`), the release's compose file and health check, and the docs. The app's code and the plugin API don't change.

One part is the computer plugin's own: its `host/setup.sh` picks the computer's engine. That is a fix to a built feature, which falls short on Ubuntu's `docker.io`. It can be built at once, as a bug fix, and recorded in [the computer](../_completed/phases/computer.md)'s **What the build changed**. It is here because it answers questions 2 and 3. `fxbot uninstall` takes the computer's engine away with `fxbot computer off`, which the `fxbot` command has run since [the computer on Add](../_completed/phases/computer-on-add.md), so the core names no plugin it didn't before.

## 1. Research

### fxbot today: the owner's questions

**1. No docker or podman.** `setup.sh` installs an engine from apt (`setup.sh:41-55`): podman when apt has 4 or newer, and `docker.io` otherwise. Then it finds a Compose 2.26 or newer, from apt or from Compose's own release (`setup.sh:73-125`).

| Machine | fxbot's engine | Compose | The computer |
| --- | --- | --- | --- |
| Debian 13 | podman 5.4.2 | apt's `docker-compose` 2.26.1 | Works: checked on this machine |
| Ubuntu 24.04 | podman 4.9.3 | apt's `docker-compose-v2` 2.40.3 | *Likely* fails when a computer starts: no `slirp4netns` (below) |
| Debian 12 | podman 4.3.1, on CNI with `dnsname` | Compose 2.40.3, downloaded: apt's `docker-compose` is v1 (1.29.2) | Stops: "podman 4.3 is too old: the computer needs 4.9 or newer" |
| Ubuntu 22.04 | `docker.io` 29.1.3: apt's podman is 3.4.4 | apt's `docker-compose-v2` 2.40.3 | Stops: "dockerd-rootless.sh isn't installed" |
| No apt (Fedora, Arch) | Stops: "Elsewhere, follow the README's steps." The README has no such steps. | | |
| No systemd | Installs, then says "start it yourself: sudo fxbot up". Nothing starts it at boot, Settings can't update it, and on podman nothing starts the socket that Compose reaches podman through. | | |

`setup.sh` and the computer's script both install with `--no-install-recommends`. podman 4.9's rootless network is slirp4netns: pasta became the default only in podman 5.0.0 ([release notes](https://github.com/containers/podman/blob/main/RELEASE_NOTES.md)). The computer installs `passt` and not `slirp4netns` (`plugins/computer/host/setup.sh:81`). So on a fresh Ubuntu 24.04, where podman came in without its recommends, a computer's first start *likely* fails for want of `slirp4netns`. The computer was checked only on podman 5.4.2.

**2. `docker.io`, not `docker-ce`.** fxbot itself runs: `setup.sh` treats any `docker` alike, and Compose comes from apt or Compose's release. The computer depends on whose `docker.io` it is (`plugins/computer/host/setup.sh:82-102`):
- **Debian's** ships `dockerd-rootless.sh` and `dockerd-rootless-setuptool.sh` in `/usr/share/docker.io/contrib/` (12 and 13), beside a `rootlesskit` package. The computer was checked on Debian 13's `docker.io` 26.1.5.
- **Ubuntu's** ships neither (24.04 and 22.04: `contrib/` holds only `check-config.sh` and `nuke-graph-directory.sh`), and no package in Ubuntu 24.04 has a file named `dockerd-rootless.sh` (packages.ubuntu.com's contents search, 2026-11-07). The script installs `rootlesskit` and `slirp4netns`, then stops at line 102: "dockerd-rootless.sh isn't installed". The docs say Ubuntu's `docker.io` works (`reference/computer.md:127`, the computer's `README.md:50`, `computer.md:222`). It was only ever run on Debian's.

So on Ubuntu with `docker.io`, the computer in **Essentials** fails on the first screen of a new install, and **Try again** fails the same way.

**3. Why only `docker-ce` does both.** fxbot runs two engines. Its own three containers run on the machine's engine as root, started by systemd, with the `fxbot` user's ids inside. The computer needs a second engine, rootless, for a user of its own, `fxbot-computer`, so a bot that breaks out of its computer lands in a user who can read nothing of fxbot's. Docker runs rootless only through `dockerd-rootless.sh` and RootlessKit. Docker's own packages carry both, in `docker-ce-rootless-extras`. Debian's `docker.io` carries the script, and Ubuntu's leaves it out. So on Ubuntu, `docker-ce` is the only Docker that can be both engines. Podman can be both on every distro the computer supports, since rootless is how podman runs by default.

If the owner's user meant fxbot itself on a rootless Docker, with no root engine at all: `setup.sh` doesn't do that. It runs as root and uses the root engine, and on a machine whose Docker is rootless only, `systemctl enable --now docker` (`setup.sh:66`) quietly starts the root daemon that the owner had turned off. A rootless fxbot is [not in this phase](#not-in-this-phase).

**4. What else gets in the way.** Read from the scripts:
- **Docker from snap.** Ubuntu's hint for a missing `docker` offers the snap beside `docker.io`. The snap's daemon reaches files only under home folders and removable media ([its README](https://github.com/canonical/docker-snap)), and its unit is `snap.docker.dockerd.service`. fxbot bind-mounts `/var/lib/fxbot` and `/etc/fxbot/secret.key`, and `fxbot.service` says `Requires=docker.service`. `setup.sh` would take that `docker`, install everything, and then fail to start. The computer's script already refuses a snap. Coolify refuses one too, with `snap remove docker`.
- **Both engines.** podman 4 or newer wins over docker whenever it's installed (`setup.sh:44-47`), even with Docker's daemon running. A running Docker sets the `FORWARD` chain's policy to `DROP`, which can filter podman's bridged traffic ([Red Hat](https://access.redhat.com/solutions/5885821), [podman](https://github.com/podman-container-tools/podman/discussions/29817)). This machine keeps a root Docker off beside its release on podman for that reason.
- **The port.** 8787 is fixed, though compose takes `FXBOT_PORT`. It's RStudio Server's default port too ([Posit](https://docs.posit.co/ide/server-pro/admin/access_and_security/network_port_and_address.html)). The check comes after apt, the engine, Compose, and the downloads (`setup.sh:237`), so a machine with RStudio on it gets all of those and then a stop.
- **The CPU.** fxbot's image is for amd64 and arm64. A 32-bit Raspberry Pi OS gets podman, then a stop that asks for a Compose, which wouldn't help, or, where apt has one new enough, a failed pull.
- **Silence.** The images (about 110 MB, 163 MB, and llama.cpp's) download inside `systemctl start fxbot`, whose output goes to the journal. The terminal shows nothing for minutes, up to the unit's 10-minute timeout.
- **ufw.** An owner's install on Ubuntu 24.04 with ufw active crash-looped on `getaddrinfo EAI_AGAIN db` after an update on 2026-11-07, and `fxbot up` waited out its 5 minutes. Containers on podman ask aardvark-dns, on the bridge's gateway, for names, and ufw's default deny dropped it. `ufw allow in on podman1 to any port 53` fixed it. Docker's DNS answers inside each container, so only podman has this.
- **A database without its `.env`.** An owner who removes `/opt/fxbot` by hand and runs `setup.sh` again gets a new random database password (`setup.sh:169`). The `fxbot_pgdata` volume keeps the old one, since Postgres's image sets the password only on an empty volume, so the app can't sign in and the start fails.
- **A truncated download.** `curl | sudo bash` runs what arrives. A script cut off mid-line runs half. Tailscale wraps its installer in `main()` for this.
- **For agents.** `fxbot logs` follows (`deploy/fxbot:331`), so an agent's call never returns. `agent-setup.txt` works around it with `fxbot compose logs --tail 50`.

**5. Uninstall today.** There is no command and no page. The owner would have to know [What setup.sh creates](https://fxbot.sh/docs/reference/install-layout/), and remove each part by hand:

| What | Removed by |
| --- | --- |
| The containers, `fxbot_default`, and the volumes `pgdata` and `models` | `fxbot compose down --volumes` |
| The images: fxbot's, pgvector's, and llama.cpp's, about 1 GB unpacked | `podman rmi` or `docker rmi`, by name |
| The computer: its user, engine, computers, homes, image (1.2 GB), firewall, and override | `fxbot computer off` |
| `fxbot.service`, `fxbot-control.path`, and `fxbot-control.service` | `systemctl disable --now`, then `rm` and `daemon-reload` |
| `/usr/local/bin/fxbot`, `/opt/fxbot`, `/etc/fxbot`, and `/var/lib/fxbot` | `rm` |
| The `fxbot` user | `userdel` |
| podman, netavark, aardvark-dns, nftables, Compose, or `docker.io`, whichever `setup.sh` installed | `apt-get purge`, if nothing else uses them. Nothing records which it installed. |
| `tailscale serve --bg 8787`, if the owner ran it | `tailscale serve reset`. Left alone, the address answers 502. |

### The directive's references

All twelve are public. Read from their READMEs, docs, and install scripts on 2026-11-07:
- **CopilotKit OpenBot**, the closest to fxbot, runs from source with Docker and Bun (`scripts/start.sh`, which never checks Docker is there), or as one `docker run` of its image. Its desktop app picks an engine: a Docker that answers, then Docker Desktop, then podman, which it installs itself through the package manager, rootful, "because k3d needs a rootful engine". It saves the choice and never switches (`desktop/src-tauri/src/install.rs`). Its updates take a `pg_dump` first and never run `down --volumes`. "Uninstalling the app alone is not a reset": it keeps `~/OpenBot` and the containers on purpose, and a separate reset script removes the containers, volumes, and podman machine, keeping the engine and, unless `--images`, the images (`docs/installer-runbook.md`).
- **OpenDuet** is built on OpenBot, with `start.sh` and `stop.sh`, and its volumes stay. **OpenDots** is `npm ci` or `docker compose up`, and `down` keeps its volume. **openmuse** is pnpm and a Render blueprint, and without Docker its computer "reports the connection error". None of the three documents an update or an uninstall.
- **Pi** installs with `curl -fsSL pi.dev/install.sh | sh` into `~/.pi/agent/install`. With no Node 22.19, it asks `[Y/n]`, then installs one with brew, apt through sudo, apk, or a tarball, and with no terminal it stops and says what to install. Running the installer again offers **u** to uninstall, and with no terminal it never uninstalls. Its docs say what stays: "None of these methods removes configuration, credentials, sessions, or installed Pi packages."
- **fx** installs one binary into `~/.local/bin` with `curl -fsSL fx.sh/setup.sh | bash`, needing only curl or wget. It updates itself, and `fx doctor --json` checks its config, credentials, and sessions, and prints the commands that fix them. No uninstall is documented.
- **agent-browser**: `agent-browser install --with-deps` runs apt, dnf, or yum through sudo, and on apt it simulates the install first and stops if any package would be removed (`cli/src/install.rs`). Its `doctor` takes `--fix` for repairs that change things, and `--json`. No uninstall command.
- **agent-desktop** installs nothing it needs: `status` reports what's missing, such as the accessibility bus. Uninstall is "through its original package manager".
- **eve** is a framework, run under the owner's process manager. Only its sandbox needs Docker: with no daemon, the first sandbox session fails with what to start, and `EVE_DOCKER_PATH` points it at podman. An upgrade strands the sessions that were running. No uninstall is documented.
- **Grok Bot** is hosted, with desktop apps; its `.deb` updates through apt. Uninstalling the app "leaves the account in place".
- **fx0** deploys to Vercel with Neon and Upstash, and **durable-harness** is an npm library whose Postgres `bootstrap` is "safe to run again". Neither has an installer or an uninstall.

None covers `docker.io` against `docker-ce`, or rootless Docker.

### Other installers

Read from their scripts on 2026-11-07, line numbers as of that day:
- **k3s** checks for systemd or OpenRC and a known CPU, then writes `/usr/local/bin/k3s-uninstall.sh` at install (`install.sh:900-1016`). It asks nothing, and removes the units, the data folder, the binaries, and only the SELinux package it added.
- **Ollama** checks the CPU, WSL 1, sudo, and missing tools, and warns and carries on without systemd. Its downloads show `curl --progress-bar`. Uninstall is a list of `rm` and `userdel` in its Linux docs, which leaves out the CUDA drivers it may have installed.
- **Coolify** checks root, an OS list, and disk, which only warns. It refuses Docker from snap with "snap remove docker" (`install.sh:694-703`), and Docker older than 24. With no engine, it runs get.docker.com. Its terminal shows a list of steps, everything else goes to a log, and a failure prints the log's last 15 lines and its path. Uninstall is a page of `docker rm`, `rmi`, and `volume rm`, which warns against `docker volume prune`.
- **get.docker.com** warns and waits 20 seconds when `docker` exists. It doesn't notice `docker.io`, and `docker-ce` replaces it through apt. It installs `docker-ce-rootless-extras`, and has `--dry-run`. Its uninstall is `apt purge`, with images and volumes left until removed by hand.
- **Tailscale** wraps the whole script in `main()`, so a cut-off download runs nothing. It asks its server whether the distro and version are supported, and an unsupported one gets the details to paste into a support request.
- **Netdata** installs its uninstaller at `/usr/libexec/netdata/netdata-uninstaller.sh`, and `kickstart.sh --uninstall` downloads it if it's gone. It refuses without `--yes`, then asks about each folder and user unless `--force`. It has `--dry-run` and `--reinstall-clean`.
- **Pi-hole**: `pihole uninstall` asks once, "Are you sure… [y/N]", and removes its folders, units, user, and the meta-package that holds its dependencies, then says to autoremove those and to reset the router's DNS.
- **CasaOS** checks the CPU, the distro, 400 MB of memory, and 5 GB of disk, and picks the first free port from 80. It writes `/usr/bin/casaos-uninstall` at install, which asks about containers, images, and app data. Its "all containers" is every container on the machine, not only its own.
- **Immich** needs Docker first, and shows Compose's own pull progress. Removing it is `docker compose down -v` and deleting its two folders, from its FAQ.
- **Umbrel** no longer installs on Debian or Ubuntu: umbrelOS is the operating system.

None of them detects podman, or sets up rootless Docker for a user of its own.

### Packages

Read from packages.debian.org and packages.ubuntu.com on 2026-11-07:

| Distro | podman | `docker.io` | Its rootless script | `rootlesskit` | Compose v2 |
| --- | --- | --- | --- | --- | --- |
| Debian 13 | 5.4.2 | 26.1.5 | yes, in `contrib/` | 2.0.2 | `docker-compose` 2.26.1 |
| Debian 12 | 4.3.1 | 20.10.24 | yes, in `contrib/` | 1.1.0 | none: `docker-compose` is 1.29.2 |
| Ubuntu 24.04 | 4.9.3 | 29.1.3 | **no** | 1.1.1 | `docker-compose-v2` 2.40.3 |
| Ubuntu 22.04 | 3.4.4 | 29.1.3 | **no** | 0.14.6 | `docker-compose-v2` 2.40.3 |

- **podman beside Docker.** podman needs `conmon`, `crun` or `runc`, and `containers-common` on Debian 13 and Ubuntu 24.04, none of which is a Docker package. Rootless podman's network is a process run as its user, slirp4netns or pasta, so Docker's `FORWARD` rules never see it, and the computer's firewall by uid covers it as it does today.
- **Ubuntu 24.04's AppArmor** has profiles for `podman`, `slirp4netns`, `crun`, `runc`, and `rootlesskit` in its `apparmor` package. The computer's check for a profile (`plugins/computer/host/setup.sh:106`) finds `podman`'s.
- **Docker's own docs** say rootless needs `docker-ce-rootless-extras` when `dockerd-rootless-setuptool.sh` is missing, and that on Ubuntu 24.04 the `apparmor` package already covers that package's `rootlesskit` ([rootless](https://docs.docker.com/engine/security/rootless/), [troubleshooting](https://docs.docker.com/engine/security/rootless/troubleshoot/)).
- **Rootless Docker's daemon** held 183 MB at rest on this machine, all the time ([the computer](../_completed/phases/computer.md#docker-rootless)). Rootless podman starts on a call and stops 5 seconds after.

## 2. Key takeaways

1. **The computer's engine is rootless podman, always.** It's in apt on every distro the computer supports, it sits beside either Docker, it costs nothing between calls, and it leaves one engine to set up and check. Keeping the machine's own Docker would mean carrying moby's script for Ubuntu, and checking it against Ubuntu's `rootlesskit` 1.1.1, older than the 2.0.2 it was checked with on Debian 13. A computer already set up on rootless Docker keeps it.
2. **Check first, then change.** Every stop that `setup.sh` can see coming, it sees before apt runs: Coolify, CasaOS, and Tailscale check the system first, and Coolify names the fix.
3. **The engine that's running wins,** as in OpenBot's desktop app, which takes a Docker that answers before it installs podman, and keeps its choice. A running Docker daemon is a stronger sign of what the owner uses than an installed podman, and it keeps podman's bridge clear of Docker's rules. The owner can name one with `FXBOT_ENGINE`.
4. **Long steps show themselves.** Compose's own pull progress, as Immich shows, before the service starts.
5. **Uninstall is a command on the machine,** as with k3s, Netdata, Pi-hole, and CasaOS. The `fxbot` command is already there, versioned with each release, and knows the engine. It asks once, and never without a terminal unless told, as Pi and Netdata do. It keeps a backup and the key by default, as OpenBot and Pi keep the owner's data and say so, and removes everything with `--purge`. It touches only fxbot's own containers, volumes, and images, by project and name, never by pruning: CasaOS's "all containers" is every container on the machine.
6. **Record what `setup.sh` installed, and say it at uninstall.** Pi-hole and k3s remove only what they added. fxbot lists it with the command to remove it, since the owner may now use podman or Docker for other things. Before it installs, apt's own simulation shows whether anything would be removed, and `setup.sh` stops if so, as agent-browser does.
7. **A backup command.** Uninstall, moving to a new machine, and [Back up fxbot](https://fxbot.sh/docs/how-to/back-up/) all need the same four steps, so they become one.
8. **Every stop has its fix on one page,** under the words `setup.sh` prints.
9. **Not taken:** a `doctor` command, since `fxbot status` saying whether fxbot answers covers the common case, and `--dry-run`, since the checks now run first and [agent-setup.txt](../../packages/website/public/agent-setup.txt) has an agent read the script before it runs.

## 3. Implementation

### The computer's engine (`plugins/computer/host/setup.sh`)

The engine is podman unless `--engine` names one, or the user is already set up on rootless Docker:

```bash
# Rootless podman, beside whichever engine fxbot runs on: it's in apt wherever the computer runs, Ubuntu's docker.io
# has no rootless script, and podman starts on a call where rootless Docker's daemon runs all the time. A user set up
# on rootless Docker before keeps it.
if [ -z "$engine" ]; then
  if [ -f "$home/.config/systemd/user/docker.service" ]; then engine=docker; else engine=podman; fi
fi
```

This replaces lines 72-76, which read `FXBOT_ENGINE` from the release's `.env`, and preferred podman only when it was installed.
- **Packages:** `podman passt slirp4netns`, beside `uidmap dbus-user-session nftables curl`. podman 4.9 needs `slirp4netns`, which it only recommends.
- **Too old:** "podman 4.3 is too old: the computer needs 4.9 or newer, as Debian 13 and Ubuntu 24.04 have." Debian 12 and Ubuntu 22.04 get this, on any engine.
- **The docker branch stays,** for a user already on it and for `--engine docker`. Taking it out is [open question 2](#5-open-questions).
- **The plugin's code doesn't change:** it reads the engine through the Docker API's `/info` and `/version`, which podman answers (`plugins/computer/fxbot/server.ts:977-983`).
- **Its docs:** the computer's `README.md`, [Give bots a computer](https://fxbot.sh/docs/how-to/give-bots-a-computer/), and [The computer](https://fxbot.sh/docs/reference/computer/) say the computers run on rootless podman, whatever fxbot runs on, and drop Ubuntu's `docker.io`. The computer goes to 0.3.2 for its README.

The script comes from the release's tag (`deploy/fxbot:302`), so the fix reaches installs with the release.

### `setup.sh`

**The checks, before anything changes.** In order, after root:

| Check | When it fails |
| --- | --- |
| apt | Stops: "setup.sh is for Debian, Ubuntu, and distros built on them, which have apt." With a link to the commands reference, in place of the README |
| systemd | Stops: "fxbot needs systemd, to start at boot and to update from Settings." On WSL, it adds how to turn systemd on. See [open question 3](#5-open-questions) |
| The CPU is x86_64 or aarch64 | Stops: "fxbot's images are for x86_64 and arm64, and this machine is armv7l." |
| The port is free, unless fxbot holds it | Stops: "another program listens on port 8787. Run this again with FXBOT_PORT set to a free one, such as: curl -fsSL https://fxbot.sh/setup.sh \| sudo FXBOT_PORT=8790 bash" |
| `docker` isn't a snap: `readlink -f "$(command -v docker)"` under `/snap/` | Stops, unless `FXBOT_ENGINE=podman`: "Docker here is a snap, which can't reach fxbot's folders. Remove it (sudo snap remove docker) and run this again, or run it with FXBOT_ENGINE=podman." |
| 3 GB free where the engine keeps images: `/var/lib` | Stops, with what's free. The computer's image needs 1.2 GB more, later |
| 1 GB of memory available | Warns, and carries on: fxbot, its database, and the embedder hold about 500 MB, and a computer about 120 MB at idle |

The port check is today's (`setup.sh:237`), moved up: it stops when something answers on the port and `fxbot.service` isn't running.

**Two inputs,** beside `FXBOT_FILES` and the others:
- `FXBOT_ENGINE`: `podman` or `docker`, for a fresh install. An install keeps the engine it has.
- `FXBOT_PORT`: written to `/opt/fxbot/.env`, and used by the port check, the health check, and the last lines. Compose publishes it today (`deploy/compose.yaml:25`), but the app inside still listens on 8787, and an MCP sign-in reached over `http://127.0.0.1` comes back to `http://127.0.0.1:<the app's port>/callback` (`packages/server/src/index.ts:31`, `packages/sdk/src/mcp.ts:523`). So compose passes `FXBOT_PORT` to the app too and publishes it as the same port on both sides, and `deploy/health` checks `${FXBOT_PORT:-8787}`.

**The engine,** for a fresh install:
1. `FXBOT_ENGINE`, when set.
2. docker, when `docker info` answers: its daemon is running.
3. podman 4 or newer, when it's installed.
4. docker, when it's installed and not a snap. `setup.sh` starts it, as today.
5. podman from apt, when apt has 4 or newer.
6. `docker.io` from apt.

Only step 2 is new: on a machine with a running Docker and an installed podman, a new install takes docker, where today it takes podman.

**The downloads,** seen: before `systemctl start fxbot`, `"$install/fxbot" compose pull`, with Compose's own progress. The service then starts on images that are already here. The embedder's model still downloads on its first start, as the end says.

**ufw,** in `deploy/fxbot`'s `start()`: on podman, with `ufw status` active, after `compose up -d` makes the network and before the wait:

```bash
# ufw's default deny drops the containers' DNS to aardvark-dns on the bridge, so each start lets port 53 in on it.
iface=$(podman network inspect "${COMPOSE_PROJECT_NAME:-fxbot}_default" --format '{{.NetworkInterface}}' 2>/dev/null) &&
  ufw allow in on "$iface" to any port 53 comment fxbot >/dev/null
```

ufw skips a rule it has. `fxbot down` removes the network, so the next start may get another bridge, and adds its rule; uninstall removes every rule marked `fxbot`. It is in `start()`, not `setup.sh`, so `fxbot update` brings it to the installs that need it, such as the owner's from 2026-11-07, and so does a ufw turned on later. [Open question 4](#5-open-questions).

**A database without its `.env`:** when `setup.sh` starts fresh and finds `fxbot_pgdata`, it starts the database alone, sets the new password over its local socket, which trusts local connections as `fxbot restore` already relies on, and goes on:

```bash
"$install/fxbot" compose up -d --wait db
"$install/fxbot" compose exec -T db psql -U fxbot -d postgres -qc "alter role fxbot password '$password'"
```

The owner's bots, chats, and providers come back, with the key that `setup.sh` leaves in `/etc/fxbot`. If the key is gone too, the sealed keys and tokens can't be opened, and Settings asks for them again.

**What it installed:** one `install_packages` function runs every `apt-get install`. It first runs the same install with `--simulate`, and stops if apt would remove any package: "installing podman would remove <package>. Nothing changed." Then it installs, and puts each package that wasn't on the machine before on a line of `/etc/fxbot/packages`. The computer's script appends its own the same way. Uninstall reads the file.

**The end** names the real address, with the port, and each way in:
```
fxbot 0.7.0 runs on http://127.0.0.1:8787
Open it there, or reach it:
  from your computer, over SSH:  ssh -N -L 8787:127.0.0.1:8787 <you>@<this machine>
  from your phone, with Tailscale:  sudo tailscale serve --bg 8787
Settings shows each new release, with an Update button. To uninstall: sudo fxbot uninstall
```
The Tailscale line names `tailscale` as installed or not, with its download page when not.

**The guard:** the script's body becomes a `main` function, called on its last line, so a download cut off midway runs nothing.

### The `fxbot` command (`deploy/fxbot`)

| Command | What it does |
| --- | --- |
| `fxbot backup [<folder>]` | Stops the app, writes `database.dump` and `data.tar.gz` into the folder, `/var/lib/fxbot/backups/<date>-by-hand` by default, and starts the app again if it was running. It says to keep `/etc/fxbot/secret.key` apart, and that the app keeps only the five newest folders in `backups/`, so a backup to keep goes elsewhere. `fxbot restore` takes the folder as it is. |
| `fxbot uninstall [--purge] [--yes]` | Below |
| `fxbot status` | Adds whether fxbot answers: "fxbot answers at http://127.0.0.1:8787", or "fxbot doesn't answer. See: sudo fxbot logs fxbot" |
| `fxbot logs` | Follows only on a terminal. Piped, as an agent runs it, it prints the last 100 lines and exits |

`backup` is about 15 lines, the steps in [Back up fxbot](https://fxbot.sh/docs/how-to/back-up/), which then uses it.

### Uninstall

`sudo fxbot uninstall` says what it removes and what it keeps, then asks once, from the terminal:

```
fxbot uninstall removes fxbot from this machine:
  its containers, its database and model volumes, and its images
  the computer: the user fxbot-computer, its computers and their homes, and its firewall
  fxbot.service and fxbot-control, the fxbot command, and /opt/fxbot
It keeps, so you can install again and restore:
  a backup of the database and plugins' files, in /var/lib/fxbot/backups/<date>-uninstall
  the key that opens its stored keys and tokens, /etc/fxbot/secret.key
  the user fxbot, which owns them
To remove those too: sudo fxbot uninstall --purge
Uninstall fxbot? [y/N]
```

| What | `uninstall` | `--purge` |
| --- | --- | --- |
| A backup first, with `fxbot backup` | yes | no |
| The containers, `fxbot_default`, and the volumes `pgdata` and `models` | removed: `compose down --volumes` | removed |
| The images in this install's compose files | removed: `compose down --rmi all`, by name, never a prune | removed |
| The computer, when its override or its user is there | removed: `fxbot computer off` | removed |
| ufw's rules marked `fxbot` | removed | removed |
| The units, `/usr/local/bin/fxbot`, and `/opt/fxbot` | removed | removed |
| `/var/lib/fxbot`: the backups and plugins' files | kept | removed |
| `/etc/fxbot`: the key and the app's settings | kept | removed |
| The user `fxbot` | kept: it owns what's kept | removed |
| Packages `setup.sh` installed | listed, with `apt-get purge` | listed |
| podman, Docker, and their other containers | left alone | left alone |

- **The order:** ask; back up; remove the computer's override, then `fxbot computer off`, so its script doesn't start fxbot again; disable and stop the units; `compose down --volumes --rmi all`; the ufw rules; the files; with `--purge`, the user. Each step that fails says so and the rest go on, so a second run finishes what the first left.
- **The computer's script** is the copy in `/opt/fxbot/computer-setup.sh`, which `fxbot computer on` saved, so uninstall works with no network. It downloads it only when there's no copy.
- **`--yes`** skips the question, for an agent or a script. With no terminal and no `--yes`, it stops: "add --yes to uninstall without a question".
- **What it prints last:** what it kept and how to restore it (`curl -fsSL https://fxbot.sh/setup.sh | sudo bash`, then `sudo fxbot restore /var/lib/fxbot/backups/<date>-uninstall`); the packages from `/etc/fxbot/packages`, with `sudo apt-get purge <them>` "if nothing else here uses them"; `sudo tailscale serve reset` when `tailscale serve status` shows port 8787; and, for the owner's devices, that the installed app goes from the home screen like any other, and that keys made for fxbot at providers are revoked there.
- **Running from `/opt/fxbot`:** bash has the script open, so removing the folder doesn't stop it, and the last lines print from memory.
- **A 0.2 install that moved** also has `/opt/fxbot/{repo,releases,current}`, which go with `/opt/fxbot`, and the machine's Postgres database, which uninstall names with its `dropdb` line, as `fxbot status` does.

**When the `fxbot` command is gone,** [Uninstall fxbot](#the-docs) lists the same steps by hand.

### A checkout

Docs only, in [Run a checkout beside a release](https://fxbot.sh/docs/how-to/checkout-beside-release/): `podman compose -f deploy/compose.dev.yaml --env-file .env down --volumes`, removing `/etc/fxbot-dev` and `.env`, and the computer's `host/setup.sh --remove`.

### The docs

- **New:** [Uninstall fxbot](https://fxbot.sh/docs/how-to/uninstall/), a how-to: the command, `--purge`, what's left and how to remove it, installing again on a backup, and the steps by hand.
- **New:** **Fix an install that stopped**, a how-to: each line `setup.sh` prints after `fxbot setup stopped:`, and its fix, with ufw's `EAI_AGAIN db` and Docker's snap.
- **Changed:** [Back up fxbot](https://fxbot.sh/docs/how-to/back-up/) uses `fxbot backup`, and gains **Move to a new machine**. [Commands](https://fxbot.sh/docs/reference/commands/): `backup`, `uninstall`, `FXBOT_ENGINE`, `FXBOT_PORT`, and the checks. [What setup.sh creates](https://fxbot.sh/docs/reference/install-layout/): `/etc/fxbot/packages`, ufw's rule, and what uninstall removes. [Your first fxbot](https://fxbot.sh/docs/tutorials/first-fxbot/): the CPU, memory, and disk under **You need**. The computer's pages, as above.
- **`agent-setup.txt`:** its checks say `setup.sh` checks too, and a last section says how to uninstall, with the owner's yes first and `--yes` in the command.
- **README:** a row each for `backup` and `uninstall` in the commands table, and one line under Install on how to uninstall. `src/sidebar.ts` lists the two pages.
- **`CHANGELOG.md`,** under `## Unreleased`: the computer on Ubuntu's `docker.io`, the checks, `fxbot backup`, and `fxbot uninstall`. No migration, and nothing in the plugin API.

### Cost

- **Loading the page, sending, and streaming:** unchanged. The app's code doesn't change.
- **`setup.sh`:** the checks take milliseconds. The pull it shows is the one the service ran before.
- **Each start:** one `ufw status`, when ufw is installed and the engine is podman.
- **A machine whose fxbot runs on Docker,** once the computer is added: about 45 MB of podman packages on disk (Ubuntu 24.04's podman is 42.6 MB installed), and nothing running between calls, where rootless Docker held 183 MB.

### Not in this phase

- **fxbot itself rootless,** with no root engine. Its units, folders, port, and updates assume root.
- **Other distros:** dnf, pacman, and SELinux's labels on the bind mounts.
- **macOS and Windows.** WSL 2 with systemd may run `setup.sh` as it is: unchecked.
- **Proxmox's LXC containers,** which need nesting turned on for an engine to run inside.
- **Removing packages** on uninstall.
- **Backups on a schedule,** or to another machine.
- **A `doctor` command,** and **`--dry-run`**.

### What changes

| Part | Change | Lines |
| --- | --- | --- |
| `plugins/computer/host/setup.sh` | podman by default, `slirp4netns`, the version message, `/etc/fxbot/packages` | about 10 |
| `plugins/computer/README.md`, `plugin.json` | rootless podman, and 0.3.2 | about 5 |
| `setup.sh` | the checks, two inputs, the engine, the pull, the old database, the packages, the end, `main` | about 70, and about 10 removed |
| `deploy/fxbot` | `backup`, `uninstall`, ufw's rule, `status`, `logs`, the usage | about 95 |
| `deploy/compose.yaml`, `deploy/health` | `FXBOT_PORT` inside the app's container too | about 3 |
| Website, `README.md`, `CHANGELOG.md`, `agent-setup.txt` | two new pages, and the others above | about 220 |

Size: about 180 lines of shell, and about 220 of docs.

## 4. Checklist

Checks run on machines made as the installer checks of 2026-11-05 made them: `podman run -d --privileged --systemd=always` from a distro's image with systemd, with volumes on `/var/lib/containers`, `/var/lib/docker`, and `/var/lib/containerd`, at most three at a time, each removed when done, clear of the real install on 8787. An image built from this branch, and the branch's files, come from a mirror on the host's network, through `FXBOT_IMAGE`, `FXBOT_FILES`, and `FXBOT_RELEASES_URL`. Where rootless podman won't run nested in such a machine, a VM stands in, with the owner's go-ahead. New users, units, nftables tables, and packages on this machine itself need the owner's go-ahead. An install that passes proves little: each runs the lifecycle after (restart, `update`, `restore`, `rotate-key`, `down`, `up`).

Print each check's setup, and match exact fields.

**The bound:**
- **Size:** at most 220 lines of shell.
- **Out of scope:** [Not in this phase](#not-in-this-phase).
- **If it must be cut,** the end's address lines go first, then ufw's rule, then the old database. The computer's engine, the checks, `backup`, `uninstall`, and their docs stay.

**M1. The computer on every engine** (a fix: it can be built and released first)
- [ ] Before the change, on Ubuntu 24.04 with `docker.io`: the computer's setup stops with "dockerd-rootless.sh isn't installed". On Ubuntu 24.04 with podman from `setup.sh`: a computer's first start, as it is today, and what it says. Record both in `computer.md`.
- [ ] After: on Ubuntu 24.04 with `docker.io`, with `docker-ce`, and with podman, and on Debian 13 with `docker.io` and with podman, adding the computer sets up rootless podman for `fxbot-computer`. A bot's computer starts, runs a command, reaches the internet, and is refused this machine and `10.0.0.0/8`.
- [ ] Docker's daemon keeps running beside it, and fxbot's own containers still answer.
- [ ] A user already set up on rootless Docker keeps it on a second run, and its computers still list.
- [ ] Debian 12 and Ubuntu 22.04 stop with the message that names podman's version and the distros that have one new enough.
- [ ] `--remove` takes it all away, and the packages stay.
- [ ] The computer's docs and README, 0.3.2, `CHANGELOG.md`, and `computer.md`'s **What the build changed** say so.

**M2. `setup.sh`**
- [ ] Each stop comes before apt changes anything, checked with `dpkg -l` before and after: port 8787 held by another program, a `docker` under `/snap/` (a stub file stands in), and no systemd (a machine run without `--systemd`). The CPU and disk checks are read in the diff, with a stubbed `uname` and `df` run through each.
- [ ] Memory under 1 GB warns and carries on.
- [ ] `FXBOT_PORT=8790` installs on 8790: `.env` has it, the app listens on it inside its container, the health check and the end use it, and `fxbot update` keeps it. An MCP server's OAuth sign-in from `http://127.0.0.1:8790`, against a mock authorization server, comes back to 8790 and finishes.
- [ ] With Docker running and podman installed, it picks docker. With `FXBOT_ENGINE=podman` on the same machine, podman.
- [ ] The pull shows its progress in a terminal.
- [ ] With ufw active and denying incoming, an install on podman answers, and `ufw status` shows the rule marked `fxbot`. After `fxbot down` and `up`, it still answers.
- [ ] With `/opt/fxbot` removed by hand, `setup.sh` comes back on the same bots and chats, and a provider's key still opens.
- [ ] `/etc/fxbot/packages` lists exactly what apt installed, on Debian 13 and on Ubuntu 22.04.
- [ ] An install that apt would answer by removing a package stops before it, and changes nothing. A held package that conflicts stands in for one.
- [ ] The script cut off halfway, piped to bash, does nothing.
- [ ] Run again, it leaves a working install alone. The lifecycle passes on Debian 13, Ubuntu 24.04, Ubuntu 22.04, and Debian 12.

**M3. The `fxbot` command**
- [ ] `fxbot backup` writes a folder with `database.dump` and `data.tar.gz`, and the app answers again after. On a fresh machine, `setup.sh`, the key, and `fxbot restore` of that folder bring back the same bots, chats, and library, and a provider's key opens.
- [ ] `fxbot status` says whether fxbot answers, both ways.
- [ ] `fxbot logs | head` exits, and `fxbot logs` in a terminal follows.

**M4. Uninstall**
- [ ] `fxbot uninstall` shows what it removes and keeps, and **N**, or no answer, changes nothing.
- [ ] **y** leaves no container, volume, image, unit, or ufw rule of fxbot's, no `/opt/fxbot`, and no `fxbot` command. `/var/lib/fxbot`, `/etc/fxbot`, and the user stay, with the new backup.
- [ ] Another compose project's containers, volumes, and images on the same engine are all still there.
- [ ] `setup.sh`, then `fxbot restore` of the uninstall's backup, brings back the same bots, chats, and providers.
- [ ] `--purge` leaves nothing of fxbot's: the paths in [What setup.sh creates](https://fxbot.sh/docs/reference/install-layout/), the user, the volumes, the images, the units, the rules, and the computer's user and firewall table.
- [ ] With the computer set up, its user, computers, firewall, and units are gone, with the network off.
- [ ] With no terminal, it stops without `--yes`, and runs with it.
- [ ] A second run after one stopped partway finishes.
- [ ] The packages it lists are those in `/etc/fxbot/packages`, and the Tailscale line shows only when `tailscale serve` serves 8787.

**M5. Docs and checks**
- [ ] The two new pages, the changed ones, `agent-setup.txt`, the README, the sidebar, and `CHANGELOG.md`, as above.
- [ ] `npm run typecheck`, `npm run build-site`, `bash -n setup.sh deploy/fxbot plugins/computer/host/setup.sh`, and `git diff --check` pass. New files are checked for whitespace too.
- [ ] The shell's lines are within the bound.
- [ ] This doc's Status says built, with what the build changed. It moves to `docs/_completed/phases/`, and `AGENTS.md` and the README list it.
- [ ] The work is committed on the open release branch, the computer's fix, the scripts, and the docs in separate commits, and not pushed.

**The human runs these:**
- **A fresh VPS on Ubuntu 24.04 with `docker.io`:** install, **Essentials** with the computer, a bot's computer, then `fxbot uninstall`.
- **The owner's machine with ufw:** the update that brings ufw's rule, with nothing done by hand.
- **The words:** do the stops and the uninstall's question tell a newcomer what to do?

## 5. Open questions

Each has a default the build follows unless the owner changes it.

1. **The computer's engine.** *Default:* rootless podman, beside whichever engine fxbot runs on. On 2026-11-03 the owner made it the machine's own engine, podman or docker; that is what fails on Ubuntu's `docker.io`. The other way keeps it: carry moby's `dockerd-rootless.sh` in the plugin, for Ubuntu's `docker.io`, and check it against Ubuntu's `rootlesskit` 1.1.1, which is older than any the computer has run on.
2. **The computer's Docker branch.** *Default:* it stays, for a user already set up on it. Removing it saves about 45 lines, and a user on it would move to podman, with their computers made again and their homes lost.
3. **No systemd.** *Default:* `setup.sh` stops, since such an install never starts at boot or updates from Settings. The other way keeps today's install, and says what doesn't work.
4. **ufw's rule.** *Default:* `fxbot up` adds it on podman, marked `fxbot`, and uninstall takes it away. Offered for 0.7.0 on 2026-11-07, not yet agreed. The other way: a check that prints the command.
5. **What uninstall keeps.** *Default:* a backup, the key, and the user, as apt's `remove` keeps settings, with `--purge` for everything. The other way removes everything unless told `--keep`.
6. **Packages.** *Default:* listed, with the command, never removed. podman or Docker may now run other things.
7. **A running Docker wins.** *Default:* on a machine with a running Docker and an installed podman, a new install uses docker. Installs already made keep their engine.
