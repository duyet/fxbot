---
title: "Run your own TURN server"
description: "A TURN server carries a device's connection when no direct path works, such as on a network that blocks UDP. fxbot.sh runs none: this is yours, on a small VPS or on Cloudflare."
---

A TURN server carries a device's connection when no direct path works, such as on a network that blocks UDP. fxbot.sh runs none: this is yours, on a small VPS or on your own Cloudflare account. The connection stays encrypted end to end through it: a TURN server sees IP addresses, timing, and how much passes, not what.

Either way, it goes into **Settings** › **Web pairing** › **ICE servers**, and devices get it the next time they connect.

## On a small VPS, with coturn

Any VPS with a public IPv4 address works, such as one for €4 a month. A watched desktop through it is about 1.35 GB an hour; a chat is kilobytes. These steps are for Debian or Ubuntu, with a domain name pointing at the VPS, such as `turn.example.com`.

1. **Install coturn and a certificate:**

   ```sh
   sudo apt install coturn certbot
   sudo certbot certonly --standalone -d turn.example.com
   ```

   coturn runs as its own user, which can't read certbot's keys, so give it a copy, now and at each renewal:

   ```sh
   sudo install -d -o turnserver -g turnserver /etc/coturn/certs
   printf '#!/bin/sh\ninstall -o turnserver -m 600 /etc/letsencrypt/live/turn.example.com/fullchain.pem /etc/letsencrypt/live/turn.example.com/privkey.pem /etc/coturn/certs/\nsystemctl restart coturn\n' | sudo tee /etc/letsencrypt/renewal-hooks/deploy/coturn > /dev/null
   sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/coturn && sudo /etc/letsencrypt/renewal-hooks/deploy/coturn
   ```

2. **Make a shared secret,** which fxbot turns into short-lived passwords:

   ```sh
   openssl rand -hex 32
   ```

3. **Write `/etc/turnserver.conf`:**

   ```ini
   # TLS on 443, which networks that allow only web traffic let through, and plain UDP on 3478.
   listening-port=3478
   tls-listening-port=443
   cert=/etc/coturn/certs/fullchain.pem
   pkey=/etc/coturn/certs/privkey.pem
   realm=turn.example.com
   # Passwords fxbot makes from the shared secret, each good for 24 hours.
   use-auth-secret
   static-auth-secret=<the secret>
   # Never relay into the VPS's own network, or any private one.
   no-multicast-peers
   denied-peer-ip=0.0.0.0-0.255.255.255
   denied-peer-ip=10.0.0.0-10.255.255.255
   denied-peer-ip=100.64.0.0-100.127.255.255
   denied-peer-ip=127.0.0.0-127.255.255.255
   denied-peer-ip=169.254.0.0-169.254.255.255
   denied-peer-ip=172.16.0.0-172.31.255.255
   denied-peer-ip=192.168.0.0-192.168.255.255
   denied-peer-ip=::1
   denied-peer-ip=fc00::-fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff
   denied-peer-ip=fe80::-febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff
   # A limit for each user, and no log of who connected.
   user-quota=12
   total-quota=120
   no-cli
   no-stdout-log
   simple-log
   log-file=/dev/null
   ```

4. **Let it bind port 443, and start it:**

   ```sh
   sudo setcap cap_net_bind_service=+ep /usr/bin/turnserver
   sudo systemctl enable --now coturn
   ```

5. **Open the firewall:** TCP 443, UDP and TCP 3478, and UDP 49152–65535, which coturn relays through. With ufw:

   ```sh
   sudo ufw allow 443/tcp && sudo ufw allow 3478 && sudo ufw allow 49152:65535/udp
   ```

6. **Add it to fxbot.** In **ICE servers**, pick **TURN with a shared secret (coturn, eturnal)**, and add it twice, once for each way in:
   - `turns:turn.example.com:443?transport=tcp`, with the secret
   - `turn:turn.example.com:3478`, with the secret

[eturnal](https://eturnal.net) works the same way: its `secret` is the shared secret.

## On Cloudflare, with your own account

Cloudflare's TURN gives each account 1,000 GB a month free, then $0.05 for each GB it sends. It answers on port 443 too.

1. In the Cloudflare dashboard, open **Realtime** › **TURN Server**, and create a TURN key.
2. Copy its **Turn Token ID** and its **API Token**.
3. In **ICE servers**, pick **Cloudflare TURN key**, and paste both.

fxbot asks Cloudflare for credentials, good for 24 hours, each time a device connects, and keeps them for 12. The key's token stays sealed in fxbot.

## Check it

Under **ICE servers**, the TURN server sits after the STUN servers, so devices try a direct path first. **Reachability** then says "Your TURN server covers the rest". The best check is the network that didn't connect: the device connects within a few seconds.

To check the server alone, [Trickle ICE](https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/) takes a TURN address with a username and password and shows whether it answers. For a server with a shared secret, the username is a time and a name, such as `1767225600:check`, and the password is the base64 of its HMAC-SHA1 under the secret.
