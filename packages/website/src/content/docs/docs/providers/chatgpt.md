---
title: "ChatGPT and Codex plans"
description: "Run bots on your ChatGPT plan, as Codex does. Sign in with a code from fxbot, and your plan's own usage limits apply."
---

Sign in with your ChatGPT plan, and bots run on the models it serves to Codex, OpenAI's coding agent. It takes a ChatGPT Plus, Pro, Business, Enterprise, or Edu plan, and your plan's own usage limits apply, as they do in Codex. For OpenAI's API, billed by the token, see [OpenAI](/docs/providers/openai/).

Your account, or your ChatGPT workspace, must allow device code sign-in. For your own account, turn it on in ChatGPT's security settings. In a workspace, its admin allows it in the workspace's permissions.

## Add it to fxbot

1. In **Settings** › **Providers**, choose **Add provider**, then **ChatGPT and Codex**, under **Sign in**. A code shows at once.
2. Open the link on any device: scan its QR code, choose **Copy link**, or **Open auth.openai.com**. Sign in to ChatGPT, and enter the code.
3. Leave fxbot's page open. It finishes on its own, and shows the time left.
4. Pick a model, and choose **Done**. **Make it the default for new bots** starts new bots on it.

| On the card | What it's for |
| --- | --- |
| **The code** | What you enter on OpenAI's page. |
| **QR code** | The link, for a phone, when fxbot is open on a computer. |
| **Copy code**, **Copy link** | Copy either one, to paste on another device. |
| **Open auth.openai.com** | OpenAI's page, in a new tab. |

fxbot signs in through libfx, with the same OpenAI client as the Codex CLI. It keeps the plan's tokens sealed, and libfx renews them before they end. Your ChatGPT plan and OpenAI's terms apply to each chat.

## Its models

fxbot lists the models your plan serves to Codex, from ChatGPT's own list, with each one's context window, and whether it takes images. It asks as the newest Codex CLI does, so the list matches Codex's.

## When it fails

- **"The code expired before it was entered. If OpenAI's page said device code sign-in is off, turn it on in ChatGPT's security settings, or ask your workspace admin."** Do that, then choose **Start again**.
- **"This sign-in expired."** The code ran out before you entered it. Choose **Start again** for a new one.
- **"OpenAI could not finish the sign-in."** Choose **Start again**.
- **A chat says "ChatGPT and Codex rejected this provider's key."** The sign-in no longer works. Use the provider's **Sign in again**.
- **"The provider kept refusing this, with HTTP 429, so it was stopped after 5 minutes."** You've most likely reached your plan's usage limits. They reset with time, as they do in Codex ([Providers](/docs/reference/providers/)).
