---
title: "Cerebras"
description: "Cerebras serves open models very fast, on chips of its own. Add it to fxbot with a key from its cloud console."
---

Cerebras serves open models, such as OpenAI's gpt-oss, very fast, on chips of its own. A free account has lower per-minute limits than a paid one. [Its pricing](https://www.cerebras.ai/pricing) says what each plan costs.

## Make a key

1. Open [cloud.cerebras.ai/platform](https://cloud.cerebras.ai/platform), and sign in or make an account.
2. Open **API Keys**, in the menu on the left, and choose **Generate API Key**.
3. Copy the key.

## Add it to fxbot

1. In **Settings** › **Providers**, choose **Add provider**, then **Cerebras**, under **Use a key**.
2. Paste the key, and choose **Add**. fxbot checks it with Cerebras first.
3. Pick a model. fxbot fills in `gpt-oss-120b` when Cerebras serves it. Tick **Make it the default for new bots** to start each new bot on it.

| Field | What to put there |
| --- | --- |
| **API key** | The key you copied. It goes to fxbot's server once, sealed, and never comes back to the page. |
| **Name** | Optional. It's **Cerebras** when you leave it empty. |

Cerebras's address is `https://api.cerebras.ai/v1`. fxbot fills it in.

## Its models

fxbot lists the models from Cerebras's own list, with each one's context window, tool use, and images from [models.dev](https://models.dev), where models.dev knows the model. A model models.dev doesn't know still lists, without them.

## Quirks

- **Cerebras doesn't take the `developer` role,** the name OpenAI's API now gives a model's instructions, in place of `system`. If libfx, which runs fxbot's chats, sends instructions that way, a chat fails. This is what the research for this page found: pi, another agent app, marks Cerebras so. fxbot hasn't run Cerebras with a real key yet.

## When it fails

- **"Cerebras rejected this key (HTTP 401): it's wrong, or it was deleted."** Make another, and add it with the provider's **Replace key**.
- **A chat stops with HTTP 429.** You've reached your plan's per-minute limit, which is lower on a free account. fxbot tries again by itself, and stops the turn after 5 minutes of nothing but refusals ([Providers](/docs/reference/providers/)).
