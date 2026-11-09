---
title: "How web pairing works"
description: "How web.fxbot.sh opens your own fxbot over a WebRTC connection straight to it: the app and its frames, the relay, the keys, pairing, getting through NATs, and what each party sees."
---

Web pairing opens your own fxbot on a phone or any computer, at web.fxbot.sh, over a WebRTC connection straight to it. Your fxbot listens only on its own machine, as always, and nothing on that machine is exposed. This page explains the parts and why they're shaped this way. To set it up, see [Reach fxbot from your phone](/docs/how-to/reach-it-from-your-phone/).

## The parts

| Part | Where | What it does |
| --- | --- | --- |
| The **web-pairing** plugin | your fxbot | Keeps fxbot's keys and its devices, talks to the relay, makes the WebRTC connections, and passes each device's requests to fxbot's own server |
| The app | web.fxbot.sh | Keeps each device's keys, pairs, connects, and draws the screens for pairing and devices |
| A frame | `<frame>.fxbot.sh`, one for each paired fxbot | Runs your fxbot's own page, plugins and all, which it gets through the connection |
| The relay | web.fxbot.sh/signal | Passes sealed messages between a device and its fxbot until they connect |

The app and the frames are static files, and the relay keeps nothing, so one Cloudflare Worker serves all three. Anyone can [run their own](/docs/how-to/run-your-own-relay/).

## Why a relay at all

Two ends can't open a WebRTC connection until they've traded an offer, an answer, and the addresses each can be reached at. Something both can reach has to pass those, and a phone can't reach fxbot, which listens on its machine only. So fxbot keeps one outgoing WebSocket to the relay while a device is paired, and a device calls it there.

The relay can't read what it passes: the two ends seal every message to each other's keys first. It sees which fxbot is being called, by an address made from its keys, the IP addresses of both sockets, when, and how much. It doesn't see which device, the addresses the two will connect at, or anything that crosses the connection afterwards.

## Keys

Your fxbot makes two keys the first time the plugin runs, and keeps them sealed in its database, so a backup carries them:

- an X25519 key, for the handshakes with devices
- an Ed25519 key, which it proves itself to the relay with

Its address at the relay is a hash of both, so the relay can check that whoever listens there holds them. A fresh install makes new keys, and devices pair again.

Each device makes an X25519 key when it pairs, which its browser keeps and can't export: the page can use it, but not read it. To fxbot, a device is that key's public half, with no password, no token, and no expiry.

## Pairing

Pairing starts where fxbot already trusts you: its own **Settings**, on the machine, over Tailscale or an SSH tunnel, or a device that's already paired. Only that side shows a code, so nobody can hand you one that grants them access.

It makes a ticket, kept in memory for 10 minutes, with a 32-byte secret. The QR code's link carries the secret, after a `#`, which browsers never send to a server. A typed code, such as `47-3816-0925`, is too short to carry it, so it runs [CPace](https://datatracker.ietf.org/doc/draft-irtf-cfrg-cpace/) first, which turns the code into a shared key and allows one guess per code: the `47` finds your fxbot at the relay, and the eight digits stay between the two ends.

Then the device runs a [Noise](https://noiseprotocol.org) handshake (IKpsk2) with fxbot's key and the secret. Both sides end with the same handshake hash, and show six digits made from it. If someone in the middle had run two handshakes, the digits wouldn't match. You check them and approve on the side that showed the code, and fxbot adds the device.

## Connecting

Each time the app opens, comes back to the front, or changes network, the device runs a Noise IK handshake through the relay. Its first message carries a counter that only goes up, so fxbot refuses one it has seen. fxbot finds the device by its key, refuses one it doesn't know or has removed, and answers with its list of STUN and TURN servers.

Then fxbot makes the WebRTC offer, and the device answers, each sealed by the handshake. The offer and answer carry each side's certificate fingerprint, and WebRTC's own encryption, DTLS, checks the connection against them. So the connection belongs to the two keys that paired. Each side's first message on it is a check made from the handshake too.

After that the relay plays no part: everything goes over the connection, peer to peer.

## The app and the frame

Your fxbot's page expects to be served by fxbot itself: it asks `/api/…` for everything. In the frame, a small script and the frame's service worker give that page what it expects:

- **Requests** it makes go to the app, which sends each over a data channel of its own to fxbot, which answers it from its own server. A chat's reply streams back as it comes.
- **What it loads by address,** such as its scripts, images, a plugin's styles, and the pages plugin's frames, the service worker fetches the same way. Scripts and styles named by their hash are kept, so the app draws at once when you open it again.
- **WebSockets,** such as the computer's desktop, each get a data channel.

Each fxbot's frame is on a name of its own, so its page, and the plugins' code in it, can't reach the device's keys or another fxbot's frame. A request that comes through a device is marked, and the plugin's own device routes refuse it, so code in the page can't pair a device.

## Getting through

Both ends sit behind NATs, as nearly every phone and home network does. Each asks a STUN server what public address it has, and they try each pair of addresses until one works. That covers most networks, with nobody passing the traffic.

It doesn't cover:

| Case | Why | What works |
| --- | --- | --- |
| A network that blocks UDP | WebRTC's direct connections use UDP | A TURN server over TLS on 443; Tailscale |
| A symmetric NAT against a typical home router | The NAT gives each destination a different port, so the address STUN saw is no use to the other side. About 40% of phone carriers do this. | A mapped or forwarded port at home; IPv6; TURN; Tailscale |
| Carrier-grade NAT at home | A second NAT, your provider's, sits in front of your router | IPv6 or a public address from your provider; TURN; Tailscale |

fxbot checks its own side in advance, under **Settings** › **Web pairing** › **Reachability**, and the device checks its side as it connects. When nothing works in 15 seconds, the device says what each side found, and links to [the fix](/docs/how-to/when-a-device-cant-connect/).

fxbot.sh runs no TURN server, which would carry everyone's traffic. A TURN server of [your own](/docs/how-to/run-your-own-turn/) sees addresses and volume, never contents.

## What each party sees

| Who | Sees | Doesn't see |
| --- | --- | --- |
| fxbot.sh's relay | Which fxbot is called, the IP addresses of both ends' sockets, times, sizes | Which device, its addresses for the connection, anything you do |
| Cloudflare, which runs the relay | What any website's host sees: IP addresses and connection times | The same |
| A STUN server | Each end's public address, when it asks | Anything else |
| Your own TURN server | Both ends' addresses, times, and how much passes | What passes: it's encrypted end to end |
| web.fxbot.sh's files | Nothing: they're static, and the app's code runs on your device | |

The app's code comes from web.fxbot.sh, so it's only what that site serves. Its build prints a hash of each file, so anyone can compare what it serves with a build of the same release.

## Staying paired

A pairing has no expiry. What could end it, and what keeps it:

- **fxbot restarting or updating:** the keys are in its database, and it reconnects to the relay by itself.
- **The relay restarting:** fxbot reconnects with a little randomness, and devices try again.
- **A phone in the background:** iOS ends the connection within about a minute; the app reconnects when it comes back.
- **Safari clearing a site after seven days:** it doesn't for Home Screen apps, which is why an iPhone pairs there.
- **The browser clearing storage:** the app asks the browser to keep its storage, and says whether it agreed. A second device or a passkey [pairs it again](/docs/how-to/pair-another-device/) from anywhere.
- **A lost device:** remove it from any other.
