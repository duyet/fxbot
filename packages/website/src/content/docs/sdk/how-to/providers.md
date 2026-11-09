---
title: "Connect providers"
description: "A provider is where a bot's model runs. Your backend adds one with fxbot.providers, or with fxbot.signIns for an account. Every provider, and what fxbot reads from it, is in Providers."
---

A provider is where a bot's model runs. Your backend adds one with `fxbot.providers`, or with `fxbot.signIns` for an account. Each is an entry in fxbot's list of providers, and its `kind` is the entry's id. Every provider, and what fxbot reads from it, is in [Providers](/docs/reference/providers/).

To see what there is to add, as a page would show it, ask for the list:

```ts
const { providers, more } = await fxbot.providers.catalog();
// providers: entries with their group, fields, key page, and steps; more: models.dev's other hosts, for search
```

## A server on your network

For `ollama`, `lmstudio`, `llamacpp`, `vllm`, `jan`, `litellm`, and `custom`, which is any server with an OpenAI-style Chat Completions API.

```ts
const local = await fxbot.providers.add({ kind: "ollama", model: "qwen3:8b" });
```

- Ollama and LM Studio default to their usual address on this machine. Give `baseUrl` for another, such as `http://192.168.1.20:11434/v1`. A `custom` server needs one.
- An address must use `https`, or `http` on localhost.
- `apiKey` is for a server that wants a key. Ollama and LM Studio take none.
- `modelIds` are model ids for a `custom` server that lists none.
- `contextWindow` overrides the context window the server reports, for every model it serves.

The server must be running: `add` asks it for its models first.

## An API key

For every entry that takes a key, such as `openai`, `groq`, `deepseek`, or `gateway`, and for models.dev's hosts in `more`, by their id.

```ts
const openai = await fxbot.providers.add({ kind: "openai", apiKey: process.env.OPENAI_API_KEY!, model: "gpt-6.1-sol" });
```

An entry with fields takes them in `fields`, which fill its address:

```ts
const bedrock = await fxbot.providers.add({ kind: "bedrock", apiKey: process.env.AWS_BEARER_TOKEN_BEDROCK!, fields: { region: "us-west-2" } });
const azure = await fxbot.providers.add({ kind: "azure", apiKey: azureKey, fields: { resource: "my-resource" }, modelIds: ["my-deployment"] });
```

Vertex AI takes a service account's JSON key, as text, in place of a key:

```ts
const vertex = await fxbot.providers.add({ kind: "vertex", serviceAccount: readFileSync("service-account.json", "utf8") });
```

`add` checks the key with the provider, and refuses one the provider rejects. Then the SDK seals the key in Postgres. A listed provider says only `hasKey: true`, never the key.

To change a key, update it. It's checked again:

```ts
await fxbot.providers.update(openai.id, { apiKey: newKey });
```

## An account, with a sign-in

For `chatgpt`, `grok`, `vercel`, `huggingface`, and `orcarouter` by device code, and `openrouter`, which shows a code to paste, or comes back to your page. The person signs in on any device, and the SDK claims the tokens or the key on your backend.

1. Start the sign-in, and show its link and code:

   ```ts
   const signIn = await fxbot.signIns.start({ kind: "chatgpt" });
   console.log(`Open ${signIn.verificationUrl} and enter ${signIn.userCode}`);
   ```

   OpenRouter's `way` is `paste` unless you pass the page's own HTTPS or localhost origin, when it's `redirect`. Send the person to `signIn.url`, then pass the code they paste to `signIns.code(signIn.id, code)`, or route `/api/sign-ins/<id>/callback` to `signIns.callback(id, query)`.

2. Ask how it's going until it's done. A finished sign-in names the new provider:

   ```ts
   import { setTimeout as sleep } from "node:timers/promises";

   let provider: string | undefined;
   while (!provider) {
     await sleep(2000);
     const status = fxbot.signIns.get(signIn.id);
     if (status.status === "failed") throw new Error(status.error);
     provider = status.provider;
   }
   ```

3. For a Vercel account with more than one team, pick the team to bill:

   ```ts
   const teams = await fxbot.providers.teams(provider);
   await fxbot.providers.update(provider, { teamId: teams[0].id });
   ```

One sign-in runs at a time: a new one replaces one still waiting. `signIns.cancel(id)` stops one. To sign in again to a provider you have, as after a failed refresh, pass its id: `signIns.start({ kind: "chatgpt", provider: id })`.

A Vercel account needs fxbot's Vercel OAuth app, and Hugging Face fxbot's Hugging Face app: the list of providers names them once they're registered, or pass their ids to `createFxbot` as `vercelClientId` and `hfClientId`.

## Then: models and bots

1. List the provider's models, and pick its default model:

   ```ts
   const models = await fxbot.providers.models(openai.id); // ids, with a context window, tool use, and images when known
   await fxbot.providers.update(openai.id, { model: "gpt-6.1-sol" });
   ```

2. Make it the default provider, so new bots start on it:

   ```ts
   await fxbot.settings.update({ defaultProvider: openai.id });
   const bot = await fxbot.profiles.create({ name: "Scout" });
   ```

   Or give a bot its provider, and a model of its own, when you make it: `profiles.create({ name, provider, model })`. A bot with no model follows its provider's default.

3. To move a bot to another provider, update it:

   ```ts
   await fxbot.profiles.update(bot.id, { provider: local.id, model: "qwen3:8b" });
   ```

   A bot with a chat starts a new one there, from a summary of the old one. See [Moving a bot to another provider](/docs/explanation/bots-and-chats/#starting-a-chat-over).

`providers.remove(id)` removes a provider that no bot uses.

## From a page

The client has the same calls over fxbot's HTTP API: `client.providers.catalog()`, `client.providers.add(...)`, `client.signIns.start(kind)`, `client.signIns.get(id)`, and `client.signIns.code(id, code)`. A key goes up to the server once and never comes back. See [Build a page on the client](/sdk/how-to/web-page/).

## If it doesn't work

- **`add` says the provider rejected this key.** It answered 401 or 403, or a status its entry names, such as xAI's 400. Check the key, and that it's for that provider and its region.
- **`add` can't reach a server on your network.** Start the server first, and check `baseUrl`. Ollama's ends in `/v1`.
- **`signIns.start` asks for `FXBOT_VERCEL_CLIENT_ID` or `FXBOT_HF_CLIENT_ID`.** Pass `vercelClientId` or `hfClientId` to `createFxbot`.
- **A ChatGPT sign-in fails.** The account or workspace must allow device code sign-in. The error says how to turn it on.
- **`send` says there's no model.** Give the provider a default model, as in step 1, or give the bot one.
- **`send` says the bot has no provider.** Set a default provider before you make bots, or give each bot one.
- **`providers.remove` says bots use the provider.** Move them to another provider first.
