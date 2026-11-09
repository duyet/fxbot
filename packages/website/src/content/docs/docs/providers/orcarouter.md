---
title: "OrcaRouter"
description: "OrcaRouter reaches models from many labs with one account, on a free plan that needs no card. Sign in from fxbot, or paste a key from its dashboard."
---

OrcaRouter reaches models from many labs, such as OpenAI, Anthropic, Google, and DeepSeek, with one account. Its Hacker plan is free and needs no card, and tokens cost what each provider charges. Its model list has a few free models too ([pricing](https://www.orcarouter.ai/pricing)).

## Sign in

1. In **Settings** › **Providers**, choose **Add provider**, then **OrcaRouter**, under **Sign in**.
2. Choose **Sign in with OrcaRouter**. A code shows.
3. Open the link on any device: scan its QR code, choose **Copy link**, or **Open www.orcarouter.ai**. Sign in to OrcaRouter, check that it names fxbot, and approve.
4. Leave fxbot's page open. It finishes on its own, and shows the time left.
5. Pick a model, and choose **Done**. **Make it the default for new bots** starts new bots on it.

OrcaRouter makes a key on your account that doesn't expire, and fxbot keeps it sealed. Nothing needs registering with OrcaRouter first. You can see the key, and revoke it, under **Authorized Apps** in your OrcaRouter account.

## Make a key

1. Open [orcarouter.ai/console](https://www.orcarouter.ai/console), and sign in or make an account.
2. Open **API keys** in the dashboard, and create one. A credit limit and an expiry are optional.
3. Copy the key.

## Add it to fxbot

1. In **Settings** › **Providers**, choose **Add provider**, then **OrcaRouter**, under **Use a key**.
2. Under **Or use a key**, paste the key, and choose **Add**. fxbot checks it with OrcaRouter first.
3. Pick a model, and choose **Done**.

| Field | What to put there |
| --- | --- |
| **API key** | The key you copied. It goes to fxbot's server once, sealed, and never comes back to the page. |
| **Name** | Optional. It's **OrcaRouter** when you leave it empty. |

OrcaRouter's address is `https://api.orcarouter.ai/v1`. fxbot fills it in.

## Its models

fxbot lists the models from OrcaRouter's own list, with each one's context window, tool use, and images from [models.dev](https://models.dev), where models.dev knows the model.

## Quirks

- **Each sign-in makes a new key.** By OrcaRouter's docs, it makes at most 10 a day for each person, and emails you about each one. Signing in again, from the provider's **Replace key**, counts too. This wasn't checked with a real account.
- **Approving takes the Developer role,** or higher, in your OrcaRouter workspace.

## When it fails

- **"The sign-in was declined at OrcaRouter."** You declined it, or you've reached the 10 keys a day, or your workspace's limit on keys. Revoke an old one under **Authorized Apps**, or paste a key instead.
- **"This sign-in expired."** The code ran out before you entered it. Choose **Start again** for a new one.
- **"OrcaRouter rejected this key (HTTP 401): it's wrong, or it was deleted."** The key is wrong, it was revoked, or it expired. Make another, and add it with the provider's **Replace key**, which can also sign in again.
- **A chat stops with HTTP 429.** You've reached a rate limit. fxbot tries again by itself, and stops the turn after 5 minutes of nothing but refusals ([Providers](/docs/reference/providers/)).
