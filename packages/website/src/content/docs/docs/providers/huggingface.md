---
title: "Hugging Face"
description: "Hugging Face's router reaches open models from many inference providers with one account. Add it to fxbot with a fine-grained token, or sign in."
---

Hugging Face's router reaches open models from many inference providers, such as Groq, Together, and Cerebras, with one Hugging Face account. It's pay as you go, at each provider's own rates. A free account buys credits first, and PRO accounts and Team or Enterprise organizations get a small credit each month ([pricing](https://huggingface.co/docs/inference-providers/pricing)).

## Sign in

**Hugging Face** signs in through fxbot's own app there, which fxbot's list of providers names. A server that sets [`FXBOT_HF_CLIENT_ID`](/docs/reference/configuration/) uses its own app instead. Or [use a token](#make-a-token).

1. In **Settings** › **Providers**, choose **Add provider**, then **Hugging Face**, under **Sign in**.
2. Choose **Sign in with Hugging Face**. A code shows.
3. Open the link on any device: scan its QR code, choose **Copy link**, or follow the **Open** link beside the code. Sign in to Hugging Face, and enter the code.
4. Leave fxbot's page open. It finishes on its own, and shows the time left.
5. Pick a model, and choose **Done**. **Make it the default for new bots** starts new bots on it.

fxbot keeps the sign-in's tokens sealed, and renews them before they end.

## Make a token

1. Open [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens), and sign in or make an account.
2. Choose **Create new token**, then **Fine-grained**.
3. Tick **Make calls to Inference Providers**, give the token a name, such as fxbot, and create it.
4. Copy the token.

## Add it to fxbot

1. In **Settings** › **Providers**, choose **Add provider**, then **Hugging Face**, under **Use a key**.
2. Paste the token, and choose **Add**. fxbot checks it with Hugging Face first.
3. Pick a model, and choose **Done**.

| Field | What to put there |
| --- | --- |
| **API key** | The token you copied. It goes to fxbot's server once, sealed, and never comes back to the page. |
| **Name** | Optional. It's **Hugging Face** when you leave it empty. |

Hugging Face's router is at `https://router.huggingface.co/v1`. fxbot fills it in.

## Its models

fxbot lists the models from the router's own list, with each one's context window, tool use, and images, as the providers behind it report them. For each request, the router picks the fastest provider that serves the model.

## Quirks

- **The token check doesn't see its permissions.** fxbot checks a pasted token at Hugging Face's `https://huggingface.co/api/whoami-v2`, which answers any working token. So a token without **Make calls to Inference Providers** is added, and refused at the first message. This wasn't checked with a real token.
- **A model's context window is its largest provider's.** A model in the router's list can have several providers, and fxbot shows the largest context window among them. The provider the router picks may take less. This wasn't checked with a real token.
- **A sign-in's renewal hasn't been tried with a real account.** Hugging Face doesn't say how long its tokens last.

## When it fails

- **No Hugging Face under Sign in.** fxbot has no Hugging Face app yet. Use a token.
- **"Hugging Face rejected this key (HTTP 401): it's wrong, or it was deleted."** The token is wrong, or it was deleted. Make another, and add it with the provider's **Replace key**.
- **A chat says "Hugging Face rejected this provider's key."** The token lacks **Make calls to Inference Providers**, or it was deleted. Make one with it, and add it with **Replace key**.
- **"This sign-in expired."** The code ran out before you entered it. Choose **Start again** for a new one.
- **"Hugging Face did not renew the sign-in."** Choose the provider's **Replace key**, then **Sign in with Hugging Face**.
- **A chat stops with HTTP 429.** You've reached a rate limit. fxbot tries again by itself, and stops the turn after 5 minutes of nothing but refusals ([Providers](/docs/reference/providers/)).
