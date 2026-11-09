---
title: "OpenCode Zen and Go"
description: "OpenCode Zen and OpenCode Go serve models the OpenCode team picked and tested for coding agents. Zen is pay as you go, and Go is a monthly plan. Add either with a key."
---

OpenCode Zen and OpenCode Go are the OpenCode team's gateways, with models it picked and tested for coding agents. Zen is pay as you go, from credits you add. OpenCode's docs now call it the OpenCode Console. Go is a monthly plan for open models, as Go, Go Plus, or Go Teams, with usage limits for each model. See [Zen's](https://opencode.ai/docs/zen/) and [Go's](https://opencode.ai/docs/go/) pages for prices.

Each is a provider of its own in fxbot, with its own card.

## Make a key

For Zen:

1. Open [opencode.ai/console](https://opencode.ai/console). Sign in, and open **API Keys**.
2. Choose **Create API Key**.
3. Copy the key.

For Go:

1. Open [opencode.ai/console](https://opencode.ai/console). Sign in, and subscribe to **Go**.
2. Open **API Keys**, and choose **Create API Key**.
3. Copy the key.

## Add it to fxbot

1. In **Settings** › **Providers**, choose **Add provider**, then **OpenCode Zen** or **OpenCode Go**, under **Use a key**.
2. Paste the key, and choose **Add**. fxbot checks it with OpenCode first.
3. Pick a model, and choose **Done**. **Make it the default for new bots** starts new bots on it.

| Field | What to put there |
| --- | --- |
| **API key** | The key you copied. It goes to fxbot's server once, sealed, and never comes back to the page. |
| **Name** | Optional. It's **OpenCode Zen** or **OpenCode Go** when you leave it empty. |

Zen's address is `https://opencode.ai/inference/openai/v1`, and Go's is `https://opencode.ai/inference/go/openai/v1`. fxbot fills it in.

## Its models

fxbot lists each one's models from [models.dev](https://models.dev)'s copy of its list, with each one's context window, tool use, and images. It lists only the models models.dev says speak OpenAI's API. A model too new for the list can still be used: type its id in the model's search, and choose **Use this id**.

## Quirks

- **Zen's free models work only in OpenCode.** OpenCode's docs say: "Free-tier chat models require OpenCode; use paid models or Go from other clients." From fxbot, pick a paid model, or use Go. This wasn't checked with a real key.
- **Each chat is a session of its own.** fxbot sends each chat's session to OpenCode in its `x-opencode-session` header, which Go requires.

## When it fails

- **"OpenCode Zen rejected this key (HTTP 401): it's wrong, or it was deleted."** Make another, and add it with the provider's **Replace key**. Go's says **OpenCode Go**.
- **A chat on Go is refused after heavy use.** Go's limits are a dollar amount for each model, over 5 hours, a week, and a month. Wait for them to reset, or turn on **Extra Usage** on the **Go** page of OpenCode's console, which goes on with your pay-as-you-go balance.
- **A chat stops with HTTP 429.** You've reached a rate limit. fxbot tries again by itself, and stops the turn after 5 minutes of nothing but refusals ([Providers](/docs/reference/providers/)).
