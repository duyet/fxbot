---
title: "xAI"
description: "xAI makes the Grok models, and serves them from its own API. Load credits, then add it to fxbot with a key from its console."
---

xAI makes the Grok models, and serves them from its own API. You load credits before a key can run a model. Its prices are on its [models page](https://docs.x.ai/developers/models). If you pay for SuperGrok or X Premium, [Grok](/docs/providers/grok/) signs in with your plan instead, with no key.

## Make a key

1. Open [console.x.ai/team/default/api-keys](https://console.x.ai/team/default/api-keys), and sign in or make an account.
2. Load credits. Without them, the key can't run a model.
3. Choose **Create API key**. Leave every model and endpoint allowed.
4. Copy the key.

## Add it to fxbot

1. In **Settings** › **Providers**, choose **Add provider**, then **xAI**, under **Use a key**.
2. Paste the key, and choose **Add**. fxbot checks it with xAI first.
3. Pick a model from xAI's list. **Make it the default for new bots** starts new bots on it.

| Field | What to put there |
| --- | --- |
| **API key** | The key you copied. It goes to fxbot's server once, sealed, and never comes back to the page. |
| **Name** | Optional. It's **xAI** when you leave it empty. |

xAI's address is `https://api.x.ai/v1`. fxbot fills it in.

## Its models

fxbot lists the models from xAI's own list, with each one's context window, tool use, and images from [models.dev](https://models.dev), where models.dev knows the model.

## Quirks

These come from xAI's docs, and from how its model list answers. fxbot hasn't run xAI with a real key yet.

- **A bad key gets 400.** xAI's model list answers a key it can't read with 400, not 401. So when you add a key, fxbot counts a 400 as a refusal too.
- **Chat Completions is legacy there.** fxbot talks to xAI through Chat Completions, which xAI's docs call legacy and deprecated, with new features going to its Responses API first.
- **Reasoning.** xAI's docs carry a model's reasoning from one turn to the next only in the Responses API, encrypted. Chat Completions returns none. How that plays out with libfx, the agent inside fxbot, hasn't been checked.

## When it fails

- **"xAI rejected this key (HTTP 400): it isn't a key it can read."** The key is wrong, or was cut short when you copied it. Copy it again, or make another.
- **"xAI rejected this key (HTTP 401): it's wrong, or it was deleted."** Make another, and paste that.
- **"xAI rejected this provider's key. Replace it in Settings › Providers."** The key stopped working, such as after it was deleted. Make another, and add it with the provider's **Replace key**.
- **A chat fails once your credits run out.** Load more in xAI's console, and send the message again.
- **A chat stops with HTTP 429.** You're sending more than xAI's rate limit allows. fxbot tries again by itself, and stops the turn after 5 minutes of nothing but refusals ([Providers](/docs/reference/providers/)).
