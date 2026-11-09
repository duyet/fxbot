---
title: "Reach fxbot with WireGuard"
description: "A WireGuard tunnel from your phone to your home network, which works where web pairing can't connect directly, run by you, with no account anywhere."
---

A [WireGuard](https://www.wireguard.com) tunnel from your phone to your home network works where web pairing can't connect directly, run by you, with no account anywhere. It needs one UDP port open at home, so it doesn't help when your provider's NAT is in front of your router ([carrier-grade NAT](/docs/how-to/when-a-device-cant-connect/#carrier-grade-nat)). There, use Tailscale or a TURN server.

## Where it runs

- **On the router,** if it has WireGuard, as OpenWrt, OPNsense, pfSense, UniFi, and many others do. Follow its own guide, then skip to [Open fxbot through it](#open-fxbot-through-it).
- **On fxbot's machine,** with UDP 51820 forwarded to it on the router. The steps below are for Debian or Ubuntu.

## Set it up on fxbot's machine

1. **Install it, and make the machine's keys:**

   ```sh
   sudo apt install wireguard qrencode
   wg genkey | sudo tee /etc/wireguard/server.key | wg pubkey | sudo tee /etc/wireguard/server.pub
   ```

2. **Make a key pair for the phone:**

   ```sh
   wg genkey | tee phone.key | wg pubkey > phone.pub
   ```

3. **Write `/etc/wireguard/wg0.conf`:**

   ```ini
   [Interface]
   Address = 10.88.0.1/24
   ListenPort = 51820
   PrivateKey = <the contents of /etc/wireguard/server.key>

   [Peer]
   # The phone: it reaches this machine only.
   PublicKey = <the contents of phone.pub>
   AllowedIPs = 10.88.0.2/32
   ```

4. **Start it, and open the port:**

   ```sh
   sudo systemctl enable --now wg-quick@wg0
   sudo ufw allow 51820/udp
   ```

   On the router, forward UDP 51820 to this machine, as [Forward or map a port](/docs/how-to/forward-a-port/#forward-them-by-hand) shows.

5. **Make the phone's config,** `phone.conf`:

   ```ini
   [Interface]
   Address = 10.88.0.2/32
   PrivateKey = <the contents of phone.key>

   [Peer]
   PublicKey = <the contents of /etc/wireguard/server.pub>
   Endpoint = <your home's public address or name>:51820
   # Only fxbot's machine goes through the tunnel; everything else goes as usual.
   AllowedIPs = 10.88.0.1/32
   PersistentKeepalive = 25
   ```

6. **Give it to the phone.** Install the WireGuard app, tap **+**, then **Scan from QR code**, and scan:

   ```sh
   qrencode -t ansiutf8 < phone.conf
   ```

   Then delete `phone.key` and `phone.conf`. Each phone gets its own key pair and `[Peer]`, at the next address.

## Open fxbot through it

fxbot listens on the machine's loopback only, so the tunnel alone doesn't reach it. Either:

- **Use web pairing through the tunnel.** With the tunnel on, the phone and fxbot can likely connect over it, since the tunnel's address is one of fxbot's candidates. Open web.fxbot.sh as usual.
- **Or put a proxy on the tunnel's address,** such as Caddy listening on `10.88.0.1` and passing to `127.0.0.1:8787`, as [Reach it](/docs/how-to/reach-it/#through-a-proxy-or-vpn-of-your-own) describes. A phone installs the app only over HTTPS.
