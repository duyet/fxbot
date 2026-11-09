---
title: "MiniMax"
description: "MiniMax makes its own models, and serves them from its own API. Add credit, then add it to fxbot with a key from its platform."
---

MiniMax makes its own models, and serves them from its own API. You pay as you go, from credit you add before a key can run a model. Its prices are on its [pricing page](https://platform.minimax.io/docs/pricing/overview).

## Make a key

1. Open [platform.minimax.io/console/keys](https://platform.minimax.io/console/keys), and sign in or make an account.
2. Add credit to your balance. Without it, the key can't run a model.
3. Choose **Create new secret key**.
4. Copy the key.

## Add it to fxbot

1. In **Settings** › **Providers**, choose **Add provider**, then **MiniMax**, under **Use a key**.
2. Paste the key, and choose **Add**. fxbot checks it with MiniMax first.
3. Pick a model from MiniMax's list. **Make it the default for new bots** starts new bots on it.

| Field | What to put there |
| --- | --- |
| **API key** | The key you copied. It goes to fxbot's server once, sealed, and never comes back to the page. |
| **Name** | Optional. It's **MiniMax** when you leave it empty. |

MiniMax's address is `https://api.minimax.io/v1`. fxbot fills it in.

## Its models

fxbot lists the models from MiniMax's own list, with each one's context window, tool use, and images from [models.dev](https://models.dev), where models.dev knows the model.

## Quirks

These come from MiniMax's docs. fxbot hasn't run MiniMax with a real key yet.

- **The whole reply goes back.** In a run of tool calls, MiniMax's docs say each reply must go back to the model whole, its reasoning and tool calls too, and call this essential to the model's best results. Whether libfx, the agent inside fxbot, sends the reasoning back hasn't been checked.
- **Its international API only.** fxbot offers MiniMax's international API, at `api.minimax.io`, and not its China one. Make the key on platform.minimax.io.

## When it fails

- **"MiniMax rejected this key (HTTP 401): it's wrong, or it was deleted."** Check that you copied all of it, or make another and paste that.
- **"MiniMax rejected this provider's key. Replace it in Settings › Providers."** The key stopped working, such as after it was deleted. Make another, and add it with the provider's **Replace key**.
- **A chat fails once your credit runs out.** MiniMax's docs call this "insufficient balance", with the code 1008. Add credit, and send the message again.
