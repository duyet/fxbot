---
title: "Together AI"
description: "Together AI serves open models from many labs, paid for with credit you buy first. Add it to fxbot with a key from one of your projects."
---

Together AI serves open models from many labs. It has no free trial: you buy credit first, and a key can't run a model without it. [Its pricing](https://www.together.ai/pricing) lists each model's rate, and [its billing docs](https://docs.together.ai/docs/billing) say the smallest first purchase.

## Make a key

1. Open [api.together.ai/settings/projects/~current/api-keys](https://api.together.ai/settings/projects/~current/api-keys), and sign in or make an account. It opens the keys of the project you're in.
2. Choose **Create API Key**, and give it a name, such as fxbot.
3. Copy the key. Together shows it only once.
4. Add credit in Together's billing settings, if you haven't yet.

## Add it to fxbot

1. In **Settings** › **Providers**, choose **Add provider**, then **Together AI**, under **Use a key**.
2. Paste the key, and choose **Add**. fxbot checks it with Together first.
3. Pick a model. Tick **Make it the default for new bots** to start each new bot on it.

| Field | What to put there |
| --- | --- |
| **API key** | The key you copied. It goes to fxbot's server once, sealed, and never comes back to the page. |
| **Name** | Optional. It's **Together AI** when you leave it empty. |

Together's address is `https://api.together.ai/v1`. fxbot fills it in.

## Its models

fxbot lists the models from Together's own list, with each one's context window, tool use, and images from [models.dev](https://models.dev), where models.dev knows the model. fxbot looks for each by its id, then by its name without the maker in front. A model models.dev doesn't know still lists, without them.

## Quirks

- **Together doesn't take the `developer` role,** the name OpenAI's API now gives a model's instructions, in place of `system`. If libfx, which runs fxbot's chats, sends instructions that way, a chat fails. This is what the research for this page found: pi, another agent app, marks Together so. fxbot hasn't run Together with a real key yet.

## When it fails

- **"Together AI rejected this key (HTTP 401): it's wrong, or it was deleted."** Make another, and add it with the provider's **Replace key**.
- **"Together AI rejected this key (HTTP 403): it may lack a permission, or the account may need credit."** The key may lack a permission, or the account may need credit. Add credit, then choose **Add** again.
- **A chat fails after the key was added.** Together stops a key's access when its balance reaches zero. Add credit in its billing settings.
- **A chat stops with HTTP 429.** You've reached your account's rate limit. fxbot tries again by itself, and stops the turn after 5 minutes of nothing but refusals ([Providers](/docs/reference/providers/)).
