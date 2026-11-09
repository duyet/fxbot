---
title: "Grok plans"
description: "Run bots on your SuperGrok or X Premium plan. Sign in with a code from fxbot, and your plan's own usage limits apply."
---

Sign in with your SuperGrok or X Premium plan, and bots run on the Grok models it serves. Your plan's own usage limits apply. For xAI's API, billed by the token, see [xAI](/docs/providers/xai/).

## Add it to fxbot

1. In **Settings** › **Providers**, choose **Add provider**, then **Grok**, under **Sign in**. A code shows at once.
2. Open the link on any device: scan its QR code, choose **Copy link**, or follow the **Open** link beside the code. Sign in with the account that has your plan, and enter the code.
3. Leave fxbot's page open. It finishes on its own, and shows the time left.
4. Pick a model, and choose **Done**. **Make it the default for new bots** starts new bots on it.

| On the card | What it's for |
| --- | --- |
| **The code** | What you enter on xAI's page. |
| **QR code** | The link, for a phone, when fxbot is open on a computer. |
| **Copy code**, **Copy link** | Copy either one, to paste on another device. |
| **Open** | xAI's page, in a new tab. |

fxbot signs in through libfx, with the same xAI client as the fx CLI. It keeps the plan's tokens sealed, and libfx renews them before they end, checking they still belong to the same xAI account. Your Grok plan and xAI's terms apply to each chat.

## Its models

fxbot lists the models your plan serves, from Grok's own list, with each one's context window and output limit.

## When it fails

- **"This sign-in expired."** The code ran out before you entered it. Choose **Start again** for a new one.
- **"The sign-in was declined on xAI's page."** Choose **Start again**, and approve it this time.
- **"xAI could not finish the sign-in."** Choose **Start again**.
- **A chat says "Grok rejected this provider's key."** The sign-in no longer works. Use the provider's **Sign in again**.
- **"The provider kept refusing this, with HTTP 429, so it was stopped after 5 minutes."** You've most likely reached your plan's usage limits, which reset with time ([Providers](/docs/reference/providers/)).
