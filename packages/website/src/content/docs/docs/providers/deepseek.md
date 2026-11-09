---
title: "DeepSeek"
description: "DeepSeek serves its own models from its own API. You top up a balance before a key can run one. Add it to fxbot with a key from its platform."
---

DeepSeek makes its own models, and serves them from its own API. You pay as you go, from a balance you top up before a key can run a model. Its prices are on its [pricing page](https://api-docs.deepseek.com/quick_start/pricing).

## Make a key

1. Open [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys), and sign in or make an account.
2. Top up your balance, at [platform.deepseek.com/top_up](https://platform.deepseek.com/top_up). Without one, the key can't run a model.
3. Choose **Create new API key**.
4. Copy the key.

## Add it to fxbot

1. In **Settings** › **Providers**, choose **Add provider**, then **DeepSeek**, under **Use a key**.
2. Paste the key, and choose **Add**. fxbot checks it with DeepSeek first.
3. Pick a model from DeepSeek's list. **Make it the default for new bots** starts new bots on it.

| Field | What to put there |
| --- | --- |
| **API key** | The key you copied. It goes to fxbot's server once, sealed, and never comes back to the page. |
| **Name** | Optional. It's **DeepSeek** when you leave it empty. |

DeepSeek's address is `https://api.deepseek.com`. fxbot fills it in.

## Its models

fxbot lists the models from DeepSeek's own list, with each one's context window, tool use, and images from [models.dev](https://models.dev), where models.dev knows the model.

## Quirks

This comes from DeepSeek's docs. fxbot hasn't run DeepSeek with a real key yet.

- **Reasoning goes back with tools.** When a request carries tools, DeepSeek's docs say each earlier reply's reasoning, its `reasoning_content`, must go back to the API in full, or the API answers 400. fxbot's bots have tools, so this applies to every chat. Whether libfx, the agent inside fxbot, sends it back hasn't been checked.

## When it fails

- **"DeepSeek rejected this key (HTTP 401): it's wrong, or it was deleted."** Check that you copied all of it, or make another and paste that.
- **"DeepSeek rejected this provider's key. Replace it in Settings › Providers."** The key stopped working, such as after it was deleted. Make another, and add it with the provider's **Replace key**.
- **A chat fails with HTTP 402.** DeepSeek's docs say this means your balance ran out. Top it up, and send the message again.
- **A chat fails with HTTP 400 after a tool call.** It may be the reasoning in **Quirks**. Move the bot to another provider for now, in its **Edit** page, under **Provider**.
- **A chat stops with HTTP 429.** You're sending more than DeepSeek's rate limit allows. fxbot tries again by itself, and stops the turn after 5 minutes of nothing but refusals ([Providers](/docs/reference/providers/)).
