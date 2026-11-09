---
title: "Groq"
description: "Groq serves open models very fast, on chips of its own. Its free plan needs no card. Add it to fxbot with a key from its console."
---

Groq serves open models, such as OpenAI's gpt-oss and Qwen, very fast, on chips of its own. Its free plan needs no card, and has lower rate limits than its paid one.

## Make a key

1. Open [console.groq.com/keys](https://console.groq.com/keys), and sign in or make an account.
2. Choose **Create API Key**, and give it a name, such as fxbot.
3. Copy the key. Groq shows it only once.

## Add it to fxbot

1. In **Settings** › **Providers**, choose **Add provider**, then **Groq**, under **Use a key**.
2. Paste the key, and choose **Add**. fxbot checks it with Groq first.
3. Pick a model. fxbot fills in `openai/gpt-oss-120b` when Groq serves it. Tick **Make it the default for new bots** to start each new bot on it.

| Field | What to put there |
| --- | --- |
| **API key** | The key you copied. It goes to fxbot's server once, sealed, and never comes back to the page. |
| **Name** | Optional. It's **Groq** when you leave it empty. |

Groq's address is `https://api.groq.com/openai/v1`. fxbot fills it in.

## Its models

fxbot lists the models from Groq's own list, with each one's context window, tool use, and images from [models.dev](https://models.dev), where models.dev knows the model.

## When it fails

- **"Groq rejected this key (HTTP 401): it's wrong, or it was deleted."** Make another, and add it with the provider's **Replace key**.
- **A chat stops with HTTP 429.** You've reached your plan's rate limit. fxbot tries again by itself, and stops the turn after 5 minutes of nothing but refusals ([Providers](/docs/reference/providers/)).
