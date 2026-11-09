---
title: "Run your own relay"
description: "Run web.fxbot.sh's Worker, the shell, the frames, and the relay, on your own Cloudflare account and domain, and point your fxbot at it."
---

Run web.fxbot.sh's Worker on your own Cloudflare account and domain, and point your fxbot at it. It's the same code: the app your devices open, a frame for each fxbot, and the relay that passes the sealed handshake. One fxbot uses about 100 of the free plan's 100,000 daily Durable Object requests.

You need a Cloudflare account with a domain on it, such as `example.com`, and a checkout of fxbot with Node 22.18 or newer.

## Deploy it

1. In `packages/web-app/wrangler.toml`, copy the `[env.production]` section as `[env.mine]`, with your domain:

   ```toml
   [env.mine]
   name = "fxbot-web"
   routes = [
     { pattern = "web.example.com", custom_domain = true },
     { pattern = "*.example.com/*", zone_name = "example.com" },
   ]
   vars = { SHELL_HOST = "web.example.com" }
   durable_objects.bindings = [
     { name = "RELAY", class_name = "Relay" },
     { name = "PLATES", class_name = "Plates" },
   ]
   ```

   The app must be at `web.` of a domain: each fxbot's frame is at a name of its own beside it, `<frame>.example.com`.

2. In Cloudflare's DNS for the domain, add a proxied `A` record for `*` pointing at `192.0.2.1`, so the frames' names reach the Worker. The custom domain makes `web.` itself.

3. Build and deploy, from `packages/web-app`:

   ```sh
   npm ci
   npx wrangler login
   node build.mjs && npx wrangler deploy --env mine
   ```

## Use it

In your fxbot's **Settings** › **Web pairing** › **Relay and ports**, put `wss://web.example.com/signal`, and **Save**. Your fxbot connects there, and its pairing links and codes say so. On a device, pair at `https://web.example.com`, or type the relay under **Relay** when you type a code.

Devices paired through fxbot.sh's relay need pairing again: a pairing remembers its relay.

## What it keeps

Nothing. The Worker has no storage, no alarms, and no logs: its `wrangler.toml` turns Workers Logs off. Each fxbot's connection lives in a Durable Object's memory while it's open. Cloudflare still sees IP addresses and connection times, as for any Worker.
