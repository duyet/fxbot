---
title: "OpenRouter"
description: "OpenRouter reaches hundreds of models from many labs with one account. Sign in from fxbot, and OpenRouter makes the key, or paste one of your own."
---

OpenRouter reaches hundreds of models from many labs with one account. Some models are free, up to a number of requests a day that rises once you've bought credits. The rest are paid from credits you add ([OpenRouter's FAQ](https://openrouter.ai/docs/faq)).

## Sign in

1. In **Settings** › **Providers**, choose **Add provider**, then **OpenRouter**, under **Sign in**.
2. Choose **Sign in with OpenRouter**, then **Continue to OpenRouter**. OpenRouter opens in a new tab.
3. Sign in to OpenRouter, and approve fxbot. The tab comes back to fxbot, and says you can close it. fxbot's page finishes on its own.
4. Pick a model, and choose **Done**. **Make it the default for new bots** starts new bots on it.

OpenRouter can come back only to an fxbot whose address is HTTPS, such as a tailnet name, or on localhost. On a plain-HTTP address, such as `http://192.168.1.20:8787`, or after **Didn't come back? Use a code instead**, the card asks for a code:

1. Choose **Open OpenRouter's sign-in**, and approve fxbot.
2. Copy the code OpenRouter shows, and paste it into fxbot.
3. Choose **Finish**.

Either way, OpenRouter makes a key on your account, and fxbot keeps it sealed. A sign-in has 10 minutes, and the card shows the time left.

## Make a key

1. Open [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys), and sign in or make an account.
2. Choose **Create API Key**, and give it a name, such as fxbot. A credit limit on the key is optional.
3. Copy the key.

## Add it to fxbot

1. In **Settings** › **Providers**, choose **Add provider**, then **OpenRouter**, under **Use a key**.
2. Under **Or use a key**, paste the key, and choose **Add**. fxbot checks it at `https://openrouter.ai/api/v1/key`, since OpenRouter's model list answers anyone.
3. Pick a model, and choose **Done**.

| Field | What to put there |
| --- | --- |
| **API key** | The key you copied. It goes to fxbot's server once, sealed, and never comes back to the page. |
| **Name** | Optional. It's **OpenRouter** when you leave it empty. |

OpenRouter's address is `https://openrouter.ai/api/v1`. fxbot fills it in.

## Its models

fxbot lists OpenRouter's models from [models.dev](https://models.dev)'s copy of its list, with each one's context window, tool use, and images. fxbot reads models.dev once a day, so a model OpenRouter added today may not show yet. Type its id in the model's search, and choose **Use this id**.

## Quirks

- **fxbot shows among OpenRouter's apps.** Its requests carry OpenRouter's attribution headers, `HTTP-Referer: https://fxbot.sh` and `X-OpenRouter-Title: fxbot`, which OpenRouter uses to rank apps on openrouter.ai.

## When it fails

- **"OpenRouter rejected this key (HTTP 401): it's wrong, or it was deleted."** Make another, and add it with the provider's **Replace key**, which can also sign in again.
- **"OpenRouter did not give a key for that code."** The code was mistyped, already used, or older than 10 minutes. Choose **Start again**.
- **"The sign-in took too long. Start again."** 10 minutes passed. Choose **Start again**.
- **The new tab never comes back to fxbot.** Choose **Didn't come back? Use a code instead**, and paste the code OpenRouter shows.
- **A chat says "OpenRouter rejected this provider's key."** The key was deleted on OpenRouter. Use the provider's **Replace key** to sign in again, or to paste a new key.
- **A chat stops with HTTP 429.** You've reached a rate limit, such as the daily one on free models. fxbot tries again by itself, and stops the turn after 5 minutes of nothing but refusals ([Providers](/docs/reference/providers/)).
