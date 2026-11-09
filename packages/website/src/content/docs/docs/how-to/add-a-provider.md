---
title: "Add a provider"
description: "A provider is where a bot's model runs. Open Settings › Providers, choose Add provider, and pick one: sign in with an account, use a key, a cloud, or a server on your own machine."
---

A provider is where a bot's model runs. Open **Settings** › **Providers**, and choose **Add provider**. First-run setup shows the same page.

<img class="shot dark:sl-hidden" src="/shots/providers-desktop-light.png" width="1280" height="800" alt="The Add a provider page in Settings, with sign-ins first, then providers that take a key" />
<img class="shot light:sl-hidden" src="/shots/providers-desktop-dark.png" width="1280" height="800" alt="The Add a provider page in Settings, with sign-ins first, then providers that take a key" />

The page groups providers by how they connect: **Sign in**, **Use a key**, **Clouds**, and **On your machine**, with **Custom** at the end of the first row. **Search** finds any of them, and about 175 more from [models.dev](https://models.dev). Each provider's card has **Help**, which opens its own page in these docs.

## Sign in with an account

For **Vercel**, **ChatGPT and Codex**, **Grok**, **OpenRouter**, **Hugging Face**, and **OrcaRouter**. There's nothing to copy: each sign-in gives fxbot a key or a token, which it keeps sealed.

1. Tap the provider. ChatGPT, Grok, and Vercel start at once. For the others, choose **Sign in with** its name.
2. Most show a code. Open the link on any device, or scan the QR with your phone, sign in, and enter the code. Leave the page open: it finishes by itself.
3. OpenRouter shows **Continue to OpenRouter** instead. Approve fxbot in the tab it opens, and it comes back to fxbot. When fxbot's address is plain HTTP, such as `http://192.168.1.20:8787`, OpenRouter shows a code to paste instead. **Didn't come back? Use a code instead** asks for one too.

If it fails:

- A code that runs out says so, with **Start again**.
- A ChatGPT account or workspace must allow device code sign-in. The error says how to turn it on.
- **Vercel** and **Hugging Face** show only once fxbot's own app at each is set, by fxbot's list of providers or with [`FXBOT_VERCEL_CLIENT_ID` and `FXBOT_HF_CLIENT_ID`](/docs/reference/configuration/). Until then, use an AI Gateway key, or a Hugging Face token, under **Use a key**.
- After a failed refresh, the provider's **Sign in again**, in **Settings** › **Providers**, starts a new sign-in.

## Use a key

For the gateways and labs under **Use a key**, from AI Gateway and OpenAI to Groq and Nous Portal.

1. Tap the provider. Its card links straight to the page where its keys are made, says what to pick there, and what it costs to start.
2. Fill in any field it asks for, such as Qwen's region.
3. Paste the key, and choose **Add**. fxbot checks it with the provider first. A key the provider refuses says the status, and what it most likely means.

To change a key later, use the provider's **Replace key**.

## A cloud

For **Vertex AI**, **AWS Bedrock**, **Azure OpenAI**, and **Cloudflare**, each with a field or two of its own:

- **Vertex AI:** choose your service account's JSON key file. fxbot makes its own short-lived tokens from it. See [Vertex AI](/docs/providers/vertex/).
- **AWS Bedrock:** a Bedrock API key, and its region. See [AWS Bedrock](/docs/providers/bedrock/).
- **Azure OpenAI:** your resource's name, its key, and your deployments' names. See [Azure OpenAI](/docs/providers/azure/).
- **Cloudflare:** an API token for Workers AI, and your account ID. See [Cloudflare](/docs/providers/cloudflare/).

## A server on your machine

For **Ollama**, **LM Studio**, **llama.cpp**, **vLLM**, **Jan**, and **LiteLLM**. fxbot looks for each at its usual address when the page opens, and marks one that answers **Found here**.

1. Tap the server. Its usual address is filled in.
2. Add a key if the server wants one.
3. Set **Context window** if the server reports the wrong one, as Ollama does when it runs with a shorter context than the model's.

fxbot reaches a server at an HTTPS address, or a plain-HTTP one on localhost. In a release install, fxbot runs in a container, where localhost is the container, not your machine, and the card says so. Put the server behind HTTPS, such as with `tailscale serve`, and give that address.

## Custom

For any server that speaks OpenAI's Chat Completions.

1. Give its address, with its `/v1`, such as `https://models.example.com/v1`.
2. Add a key if the server wants one.
3. If the server lists no models, type their ids, with commas between.

## Then

- Pick the provider's model. The list shows what each model can do, where fxbot knows: its context window, tools, and images. fxbot fills in a good first model when the provider serves it.
- **Make it the default for new bots** is on for your first provider.
- Move a bot onto the provider in the bot's **Edit** page, under **Provider**.

Every provider, and what fxbot reads from it, is in [Providers](/docs/reference/providers/).
