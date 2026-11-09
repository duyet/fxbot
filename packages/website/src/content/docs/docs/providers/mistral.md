---
title: "Mistral"
description: "Mistral makes models of its own, and serves them from La Plateforme. Add it to fxbot with a key from Mistral's console."
---

Mistral makes models of its own, and serves them from La Plateforme, which its console now calls Studio. A key works once your workspace has a plan. [Mistral's pricing](https://mistral.ai/pricing) lists them.

## Make a key

1. Open [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys), and sign in or make an account.
2. Pick a plan for your workspace, if it has none.
3. Choose **Create new key**. Give it a name, such as fxbot, and a date for it to expire.
4. Copy the key. Mistral shows it only once.

## Add it to fxbot

1. In **Settings** › **Providers**, choose **Add provider**, then **Mistral**, under **Use a key**.
2. Paste the key, and choose **Add**. fxbot checks it with Mistral first.
3. Pick a model. Tick **Make it the default for new bots** to start each new bot on it.

| Field | What to put there |
| --- | --- |
| **API key** | The key you copied. It goes to fxbot's server once, sealed, and never comes back to the page. |
| **Name** | Optional. It's **Mistral** when you leave it empty. |

Mistral's address is `https://api.mistral.ai/v1`. fxbot fills it in.

## Its models

fxbot lists the models from Mistral's own list, with each one's context window, tool use, and images from [models.dev](https://models.dev), where models.dev knows the model. A model models.dev doesn't know still lists, without them.

## Quirks

- **Mistral refuses a request with any field it doesn't know, with HTTP 422.** libfx, which runs fxbot's chats, asks for token counts with a field called `stream_options`. If Mistral doesn't take it, every chat fails with 422. This is what the research for this page found, in Mistral's API and in libfx's package. fxbot hasn't run Mistral with a real key yet.

## When it fails

- **"Mistral rejected this key (HTTP 401): it's wrong, or it was deleted."** Make another, and add it with the provider's **Replace key**.
- **"Mistral rejected this key (HTTP 403): it may lack a permission, or the account may need credit."** The key may lack a permission, or the account may need credit. Check that its workspace has a plan.
- **"Mistral rejected this provider's key. Replace it in Settings › Providers."** The key worked when you added it, and stopped. It was deleted, or it reached the date you set for it to expire. Make another, and use **Replace key**.
- **A chat fails with HTTP 422.** Mistral refused a field in the request, as **Quirks** describes. Put the bot on another provider until fxbot handles it.
- **A chat stops with HTTP 429.** You've reached your plan's rate limit. fxbot tries again by itself, and stops the turn after 5 minutes of nothing but refusals ([Providers](/docs/reference/providers/)).
