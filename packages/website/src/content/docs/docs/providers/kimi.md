---
title: "Kimi"
description: "Moonshot AI makes the Kimi models, and serves them from its own API, on a global platform and a China one. Add credit, then add it to fxbot with a key."
---

Moonshot AI makes the Kimi models, and serves them from its own API. It has two platforms, a global one at platform.kimi.ai and a China one at platform.moonshot.cn, each with keys of its own. You add credit before a key can run a model. Its prices are on its [pricing page](https://platform.kimi.ai/docs/pricing/chat), and the rate limits your credit brings on its [limits page](https://platform.kimi.ai/docs/pricing/limits).

## Make a key

1. Open [platform.kimi.ai/console/api-keys](https://platform.kimi.ai/console/api-keys), and sign in or make an account. For the China platform, go to platform.moonshot.cn instead, which now opens at platform.kimi.com.
2. Add credit. Without it, the key can't run a model.
3. Choose **Create API Key**.
4. Copy the key.

## Add it to fxbot

1. In **Settings** › **Providers**, choose **Add provider**, then **Kimi**, under **Use a key**.
2. Pick the **Platform** you made the key on, paste the key, and choose **Add**. fxbot checks it with Kimi first.
3. Pick a model from Kimi's list. **Make it the default for new bots** starts new bots on it.

| Field | What to put there |
| --- | --- |
| **Platform** | **Global (platform.kimi.ai)**, the default, or **China (platform.moonshot.cn)**: the platform you made the key on. A key works only on the platform it was made on. |
| **API key** | The key you copied. It goes to fxbot's server once, sealed, and never comes back to the page. |
| **Name** | Optional. It's **Kimi** when you leave it empty. |

fxbot fills in the address from the platform: `https://api.moonshot.ai/v1` for Global, and `https://api.moonshot.cn/v1` for China.

## Its models

fxbot lists the models from Kimi's own list, with each one's context window, tool use, and images from [models.dev](https://models.dev), where models.dev knows the model.

## Quirks

These come from Kimi's docs. fxbot hasn't run Kimi with a real key yet.

- **Reasoning goes back.** Kimi's thinking models, Kimi K3 among them, reply with their reasoning in `reasoning_content`. Kimi's docs say to keep it in every earlier reply of the conversation, and to send back a reply that called a tool whole, as it came. Whether libfx, the agent inside fxbot, does hasn't been checked.
- **A key works on one platform.** Kimi's docs say a key from the other platform gets 401.

## When it fails

- **"Kimi rejected this key (HTTP 401): it's wrong, or it was deleted."** The key may be from the other platform. Pick the platform you made it on, or check that you copied all of it.
- **"Kimi rejected this provider's key. Replace it in Settings › Providers."** The key stopped working, such as after it was deleted. Make another on the same platform, and add it with the provider's **Replace key**.
- **A chat stops with HTTP 429.** Kimi answers 429 when your credit runs out, as well as for its rate limits. Add credit, or wait. fxbot tries again by itself, and stops the turn after 5 minutes of nothing but refusals ([Providers](/docs/reference/providers/)).
