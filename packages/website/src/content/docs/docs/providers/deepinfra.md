---
title: "DeepInfra"
description: "DeepInfra serves open models at low prices, paid as you use them. Add it to fxbot with a key from its dashboard."
---

DeepInfra serves open models at low prices, paid as you use them. Add a card or pay ahead before a key can run a model. [Its pricing](https://deepinfra.com/pricing) lists each model's rate.

## Make a key

1. Open [deepinfra.com/dash/api_keys](https://deepinfra.com/dash/api_keys), and sign in or make an account.
2. Choose **New API Key**.
3. Copy the key.

## Add it to fxbot

1. In **Settings** › **Providers**, choose **Add provider**, then **DeepInfra**, under **Use a key**.
2. Paste the key, and choose **Add**. fxbot checks it with DeepInfra first.
3. Pick a model. Tick **Make it the default for new bots** to start each new bot on it.

| Field | What to put there |
| --- | --- |
| **API key** | The key you copied. It goes to fxbot's server once, sealed, and never comes back to the page. |
| **Name** | Optional. It's **DeepInfra** when you leave it empty. |

DeepInfra's address is `https://api.deepinfra.com/v1/openai`. fxbot fills it in.

## Its models

fxbot lists the models from DeepInfra's own list, with each one's context window, tool use, and images from [models.dev](https://models.dev), where models.dev knows the model. fxbot looks for each by its id, then by its name without the maker in front. A model models.dev doesn't know still lists, without them.

## Quirks

- **Many of DeepInfra's model ids differ from models.dev's.** When the research for this page looked, models.dev knew 55 of the 177 models DeepInfra listed. The rest list in fxbot without a context window, tool use, or images. fxbot hasn't run DeepInfra with a real key yet.

## When it fails

- **"DeepInfra rejected this key (HTTP 401): it's wrong, or it was deleted."** Make another, and add it with the provider's **Replace key**.
- **"DeepInfra rejected this key (HTTP 403): it may lack a permission, or the account may need credit."** The key may lack a permission, or the account may need credit. Add a card or credit in DeepInfra's billing, then choose **Add** again.
- **A chat stops with HTTP 429.** You've reached your account's rate limit. fxbot tries again by itself, and stops the turn after 5 minutes of nothing but refusals ([Providers](/docs/reference/providers/)).
