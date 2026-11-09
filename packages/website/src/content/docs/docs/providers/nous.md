---
title: "Nous Portal"
description: "Nous Portal is Nous Research's account for Hermes Agent, with models from many labs behind one API. Add it to fxbot with a key from the portal."
---

Nous Portal is Nous Research's account for Hermes Agent, with models from many labs behind one API. Its Free plan has free models only, and no credit. An API key always spends your credits, pay as you go, rather than a plan's included usage ([Nous Portal](https://portal.nousresearch.com)).

## Make a key

1. Open [portal.nousresearch.com/api-keys](https://portal.nousresearch.com/api-keys), and sign in or make an account.
2. Choose **Create API Key**.
3. Copy the key.

## Add it to fxbot

1. In **Settings** › **Providers**, choose **Add provider**, then **Nous Portal**, under **Use a key**.
2. Paste the key, and choose **Add**.
3. Pick a model, and choose **Done**. **Make it the default for new bots** starts new bots on it.

| Field | What to put there |
| --- | --- |
| **API key** | The key you copied. It goes to fxbot's server once, sealed, and never comes back to the page. |
| **Name** | Optional. It's **Nous Portal** when you leave it empty. |

Nous Portal's address is `https://inference-api.nousresearch.com/v1`. fxbot fills it in.

## Its models

fxbot lists the models from Nous Portal's own list, with each one's context window, tool use, and images, as the list gives them.

## Quirks

- **fxbot can't check the key when you add it.** Nous Portal's model list answers any key, so a wrong one is added, and shows at the first message. The card says so.
- **There's no sign-in yet.** Nous Portal signs Hermes Agent in with a device code, but only for apps Nous has given a client id. fxbot doesn't have one yet, so it takes a key.

## When it fails

- **The first message says "Nous Portal rejected this provider's key. Replace it in Settings › Providers."** The key is wrong, or it was deleted. Make another, and add it with the provider's **Replace key**.
- **A chat stops with HTTP 429.** You've reached a rate limit. fxbot tries again by itself, and stops the turn after 5 minutes of nothing but refusals ([Providers](/docs/reference/providers/)).
