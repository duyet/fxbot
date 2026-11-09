---
title: "OpenAI"
description: "OpenAI makes the GPT models, and serves them from its own API. Add credit, then add it to fxbot with a key from its platform."
---

OpenAI makes the GPT models, and serves them from its own API. You add credit before a key can run a model. Its prices are on its [pricing page](https://openai.com/api/pricing/). If you pay for ChatGPT, [ChatGPT and Codex](/docs/providers/chatgpt/) signs in with your plan instead, with no key.

## Make a key

1. Open [platform.openai.com/api-keys](https://platform.openai.com/api-keys), and sign in or make an account.
2. Add credit under **Billing** first, or the key can't run a model.
3. Choose **Create new secret key**, and give it a name, such as fxbot.
4. Copy the key.

## Add it to fxbot

1. In **Settings** › **Providers**, choose **Add provider**, then **OpenAI**, under **Use a key**.
2. Paste the key, and choose **Add**. fxbot checks it with OpenAI first.
3. Pick a model. **Make it the default for new bots** starts new bots on it.

| Field | What to put there |
| --- | --- |
| **API key** | The key you copied. It goes to fxbot's server once, sealed, and never comes back to the page. |
| **Name** | Optional. It's **OpenAI** when you leave it empty. |

OpenAI's address is `https://api.openai.com/v1`. fxbot fills it in.

## Its models

fxbot lists models.dev's list for OpenAI, rather than OpenAI's own, with each one's context window, tool use, and images.

## Quirks

This comes from OpenAI's docs.

- **Chat Completions only.** fxbot talks to OpenAI through Chat Completions. A model OpenAI serves only through its Responses API, such as GPT-5 Pro, is in the list, but fails in a chat.

## When it fails

- **"OpenAI rejected this key (HTTP 401): it's wrong, or it was deleted."** Make another, and paste that.
- **"OpenAI rejected this key (HTTP 403): it may lack a permission, or the account may need credit."** Check the key's permissions, and your credit under **Billing**.
- **"OpenAI rejected this provider's key. Replace it in Settings › Providers."** fxbot says this when a chat gets a 401 or a 403, such as after the key was deleted. Make another, and add it with the provider's **Replace key**.
- **A chat stops with HTTP 429.** You've reached a rate limit, or run out of credit, which OpenAI also answers with 429. Add credit if it's that. fxbot tries again by itself, and stops the turn after 5 minutes of nothing but refusals ([Providers](/docs/reference/providers/)).
