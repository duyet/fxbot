---
title: "Run your own STUN server"
description: "A STUN server tells each end its public address, so a device and your fxbot can connect directly. fxbot uses Cloudflare's by default; you can add your own, put it first, or remove Cloudflare's."
---

A STUN server tells each end its public address, so a device and your fxbot can connect directly. It sees only that address. fxbot uses Cloudflare's, `stun:stun.cloudflare.com:3478`, by default. You can add your own, put it first, or remove Cloudflare's, under **Settings** › **Web pairing** › **ICE servers**. Devices get the same list, in the same order, and contact no others.

## With coturn, STUN only

On any machine with a public address, such as a small VPS:

```sh
sudo apt install coturn
```

In `/etc/turnserver.conf`:

```ini
listening-port=3478
stun-only
no-cli
no-stdout-log
log-file=/dev/null
```

Then `sudo systemctl enable --now coturn`, and open UDP 3478 in its firewall. A TURN server of your own answers STUN too, so if you [run one](/docs/how-to/run-your-own-turn/), you have this already.

## Or another public server

Any STUN server works, such as Google's `stun:stun.l.google.com:19302`. Each sees your public address when your fxbot or a device connects.

## Put it in the list

1. In **ICE servers**, pick **STUN server**, type its address, such as `stun:stun.example.com:3478`, and choose **Add**.
2. Move it up with **↑** to try it first.
3. To stop using Cloudflare's, choose **Remove** beside it. **Add Cloudflare's STUN back** returns it.

Your fxbot's own WebRTC library uses the first STUN server in the list. With none at all, devices connect only on your fxbot's own network.

## Add a second STUN server

With two STUN servers, or one at two addresses, **Reachability** can tell how your fxbot's NAT maps ports, which says whether devices behind a [symmetric NAT](/docs/how-to/when-a-device-cant-connect/#a-symmetric-nat) can reach it. With one, it says it can't tell. Add any second server, then **Check again**.
