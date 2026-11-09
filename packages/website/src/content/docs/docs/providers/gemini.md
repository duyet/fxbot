---
title: "Google Gemini"
description: "Google's Gemini API serves the Gemini models, with a free tier. Add it to fxbot with a key from Google AI Studio."
---

Google's Gemini API serves Google's Gemini models, with a key from Google AI Studio. Its free tier has lower limits than its paid one, which needs billing set up on the key's Google Cloud project. Its prices are on its [pricing page](https://ai.google.dev/gemini-api/docs/pricing). To run Gemini in your own Google Cloud project instead, use [Vertex AI](/docs/providers/vertex/).

## Make a key

1. Open [aistudio.google.com/apikey](https://aistudio.google.com/apikey), and sign in with a Google account.
2. Choose **Create API key**, and pick or make a Google Cloud project for it. A new AI Studio account gets a project made for it.
3. Copy the key.

## Add it to fxbot

1. In **Settings** › **Providers**, choose **Add provider**, then **Google Gemini**, under **Use a key**.
2. Paste the key, and choose **Add**. fxbot checks it with Google first.
3. Pick a model. fxbot fills in `gemini-flash-latest` when Gemini serves it. **Make it the default for new bots** starts new bots on it.

| Field | What to put there |
| --- | --- |
| **API key** | The key you copied. It goes to fxbot's server once, sealed, and never comes back to the page. |
| **Name** | Optional. It's **Google Gemini** when you leave it empty. |

Gemini's address is `https://generativelanguage.googleapis.com/v1beta/openai`, Google's OpenAI compatibility, which Google calls beta. fxbot fills it in.

## Its models

fxbot lists the models from Gemini's own list, with each one's context window, tool use, and images from [models.dev](https://models.dev), where models.dev knows the model.

## Quirks

These come from Google's docs, and from how its model list answers. fxbot hasn't run Gemini with a real key yet.

- **A bad key gets 400.** Gemini answers a key it can't read with 400, not 401. So when you add a key, fxbot counts a 400 as a refusal too.
- **Thought signatures.** Gemini 3 and newer fail a tool call on the next turn unless each call's thought signature comes back with it. Whether libfx, the agent inside fxbot, sends them back hasn't been checked. If a bot fails right after its first tool call, try a Gemini 2.5 model.
- **Unrestricted keys are refused.** The Gemini API rejects a standard key with no restrictions. Keys AI Studio makes now are restricted to the Gemini API from the start.

## When it fails

- **"Google Gemini rejected this key (HTTP 400): it isn't a key it can read."** The key is wrong, or was cut short when you copied it. Copy it again, or make another.
- **A key that worked stops.** Google blocks standard keys with no restrictions, including ones left unused for a long time. In AI Studio's **API Keys**, find it marked **Unrestricted**, and choose **Add restrictions**, **Restrict to Gemini API only**, then **Restrict key**. Or make a new key, and add it with the provider's **Replace key**.
- **A chat stops with HTTP 400 from Gemini.** fxbot names a refused key itself only for a 401 or a 403, so a key Gemini stops taking shows as Gemini's own 400. Make another, and use **Replace key**.
- **A chat stops with HTTP 429.** You've reached your tier's rate limit, which is lowest on the free tier. fxbot tries again by itself, and stops the turn after 5 minutes of nothing but refusals ([Providers](/docs/reference/providers/)).
