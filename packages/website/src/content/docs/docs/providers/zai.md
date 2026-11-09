---
title: "Z.ai"
description: "Z.ai makes the GLM models, and serves them from its own API. Its Flash models are free. Add it to fxbot with a key from its platform."
---

Z.ai makes the GLM models, and serves them from its own API. Its Flash models, such as GLM-4.7-Flash, are free. The others are paid from a balance you top up, at the prices on its [pricing page](https://docs.z.ai/guides/overview/pricing).

## Make a key

1. Open [z.ai/manage-apikey/apikey-list](https://z.ai/manage-apikey/apikey-list), and sign in or make an account.
2. Choose **Create a new API key**. Make one for the standard API, not for the GLM Coding Plan: Z.ai says keys for the two don't work in each other's place.
3. Copy the key.
4. For models other than Flash, top up at [Billing](https://z.ai/manage-apikey/billing).

## Add it to fxbot

1. In **Settings** › **Providers**, choose **Add provider**, then **Z.ai**, under **Use a key**.
2. Paste the key, and choose **Add**. fxbot checks it with Z.ai first.
3. Pick a model from Z.ai's list. **Make it the default for new bots** starts new bots on it.

| Field | What to put there |
| --- | --- |
| **API key** | The key you copied. It goes to fxbot's server once, sealed, and never comes back to the page. |
| **Name** | Optional. It's **Z.ai** when you leave it empty. |

Z.ai's address is `https://api.z.ai/api/paas/v4`. fxbot fills it in.

## Its models

fxbot lists the models from Z.ai's own list, with each one's context window, tool use, and images from [models.dev](https://models.dev), where models.dev knows the model.

## Quirks

These come from Z.ai's docs. fxbot hasn't run Z.ai with a real key yet.

- **Tool choice is `auto` only.** Z.ai's docs say its `tool_choice` takes only `auto`, where the model decides whether to call a tool. A request that asks for anything else, such as forcing a tool, may be refused.
- **The GLM Coding Plan is separate.** Its keys are for an address of its own, `https://api.z.ai/api/coding/paas/v4`. fxbot uses the standard API's.

## When it fails

- **"Z.ai rejected this key (HTTP 401): it's wrong, or it was deleted."** Check that you copied all of it, and that it's a standard API key. Or make another and paste that.
- **"Z.ai rejected this provider's key. Replace it in Settings › Providers."** The key stopped working, such as after it was deleted. Make another, and add it with the provider's **Replace key**.
- **A chat stops with HTTP 429.** Z.ai answers 429 both for its rate limit and for a paid model with no balance left. Top up, or pick a Flash model. fxbot tries again by itself, and stops the turn after 5 minutes of nothing but refusals ([Providers](/docs/reference/providers/)).
