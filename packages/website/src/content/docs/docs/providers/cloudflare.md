---
title: "Cloudflare"
description: "Cloudflare's Workers AI runs open models on Cloudflare's network, and reaches other labs' models through AI Gateway. Add it to fxbot with an API token and your account ID."
---

Cloudflare's Workers AI runs open models on Cloudflare's own network, such as Llama, Qwen, and gpt-oss, and reaches other labs' models through AI Gateway. Workers AI has a free allocation each day. Its prices past that are on its [pricing page](https://developers.cloudflare.com/workers-ai/platform/pricing/).

## Make a key

Cloudflare's key is an API token.

1. Open [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens), and sign in or make an account.
2. Choose **Create Token**, then the **Workers AI** template. If it isn't there, start from scratch, with **Workers AI** › **Read** and **Workers AI** › **Edit** on your account.
3. Choose **Continue to summary**, then **Create Token**.
4. Copy the token. Cloudflare shows it only once.
5. Copy your account ID, from your account's home page, under **Account details**.

## Add it to fxbot

1. In **Settings** › **Providers**, choose **Add provider**, then **Cloudflare**, under **Clouds**.
2. Paste the **Account ID** and the token, and choose **Add**. fxbot checks the token with Cloudflare first.
3. Pick a model. **Make it the default for new bots** starts new bots on it.

| Field | What to put there |
| --- | --- |
| **Account ID** | Your account's ID, from its home page, under **Account details**. |
| **API key** | The token you copied. It goes to fxbot's server once, sealed, and never comes back to the page. |
| **Name** | Optional. It's **Cloudflare** when you leave it empty. |

fxbot fills in the address from the account: `https://api.cloudflare.com/client/v4/accounts/{account}/ai/v1`. That address has no model list, so fxbot checks the token at the account's Workers AI model search instead. To move to another account, remove the provider and add it again.

## Its models

fxbot lists models.dev's lists for Workers AI, whose ids start with `@cf/`, and for AI Gateway, whose ids start with their lab, such as `openai/`. Each comes with its context window, tool use, and images. A new model shows once models.dev lists it.

## Quirks

These come from Cloudflare's docs. fxbot hasn't run Cloudflare with a real token yet.

- **Other labs' models need credits.** A model from AI Gateway's list, such as one starting `openai/`, is paid for with Cloudflare's Unified Billing credits. Buy them in Cloudflare's dashboard, under **AI** › **AI Gateway**: **Credits Available** › **Manage** › **Top-up credits**. Cloudflare adds a fee to each purchase. Workers AI's own `@cf/` models don't need them.

## When it fails

- **"Cloudflare rejected this key (HTTP 400): it isn't a key it can read."** The token was cut short, or changed, when you copied it. Copy it again, or make another.
- **"Cloudflare rejected this key (HTTP 401): it's wrong, or it was deleted."** Make another, and paste that.
- **"Cloudflare rejected this key (HTTP 403): it may lack a permission, or the account may need credit."** The token may lack Workers AI's permissions, or be for another account than the ID. Make one with the **Workers AI** template.
- **"Account ID isn't one fxbot can use."** Paste the ID alone.
- **"Cloudflare rejected this provider's key. Replace it in Settings › Providers."** fxbot says this when a chat gets a 401 or a 403, such as after the token was deleted or expired. Make another, and add it with the provider's **Replace key**.
- **A chat fails on another lab's model.** The account may have no Unified Billing credits. Top them up in **AI** › **AI Gateway**, or pick a `@cf/` model.
- **A chat stops with HTTP 429.** You've reached Cloudflare's rate limit for that model. fxbot tries again by itself, and stops the turn after 5 minutes of nothing but refusals ([Providers](/docs/reference/providers/)).
