---
title: "Fireworks AI"
description: "Fireworks AI serves open models fast, and charges by the token. Add it to fxbot with a key from its settings."
---

Fireworks AI serves open models fast, and charges by the token. [Its pricing](https://docs.fireworks.ai/serverless/pricing) lists each model's rate.

## Make a key

1. Open [app.fireworks.ai/settings/users/api-keys](https://app.fireworks.ai/settings/users/api-keys), and sign in or make an account.
2. Choose **Create API Key**.
3. Copy the key.

## Add it to fxbot

1. In **Settings** › **Providers**, choose **Add provider**, then **Fireworks AI**, under **Use a key**.
2. Paste the key, and choose **Add**. fxbot checks it with Fireworks first.
3. Pick a model. Tick **Make it the default for new bots** to start each new bot on it.

| Field | What to put there |
| --- | --- |
| **API key** | The key you copied. It goes to fxbot's server once, sealed, and never comes back to the page. |
| **Name** | Optional. It's **Fireworks AI** when you leave it empty. |

Fireworks's address is `https://api.fireworks.ai/inference/v1`. fxbot fills it in.

## Its models

fxbot lists the models from Fireworks's own list, with each one's context window, tool use, and images from [models.dev](https://models.dev), where models.dev knows the model. A model models.dev doesn't know still lists, without them. Fireworks names its models with a path: `accounts/fireworks/models/`, then the model's name.

## When it fails

- **"Fireworks AI rejected this key (HTTP 401): it's wrong, or it was deleted."** Make another, and add it with the provider's **Replace key**.
- **A chat stops with HTTP 429.** You've reached your account's rate limit, which Fireworks raises as you spend more. fxbot tries again by itself, and stops the turn after 5 minutes of nothing but refusals ([Providers](/docs/reference/providers/)).
