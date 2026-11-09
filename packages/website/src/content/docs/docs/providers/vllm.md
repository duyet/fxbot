---
title: "vLLM"
description: "vLLM serves open models on your own machine's GPU, for free. Start it with --enable-auto-tool-choice and a --tool-call-parser, so the model can call tools, and add it to fxbot at its address."
---

vLLM serves open models from Hugging Face on your own machine's GPU, fast, and to many requests at once. It's free and open source, and runs on Linux. Your own hardware does the work.

## Start the server

1. Install vLLM, as its [quickstart](https://docs.vllm.ai/en/latest/getting_started/quickstart/) says.
2. Serve a model, with tool calls turned on:

   ```sh
   vllm serve Qwen/Qwen2.5-1.5B-Instruct --enable-auto-tool-choice --tool-call-parser hermes
   ```

- **`--enable-auto-tool-choice`** lets the model call tools when it chooses to, which a bot's tools need. vLLM leaves it off unless you give it.
- **`--tool-call-parser`** says how the model writes its tool calls, which differs by model: `hermes` for Qwen2.5 and Hermes, `llama3_json` for Llama 3.1 and 3.2, `mistral` for Mistral, and `openai` for gpt-oss. vLLM's [tool calling](https://docs.vllm.ai/en/latest/features/tool_calling.html) page lists the rest, and the models that need a `--chat-template` too.
- **`--max-model-len`** sets the context. Without it, vLLM takes the model's own.
- **`--served-model-name`** gives the model the id fxbot shows. Without it, the id is the model's name, as you gave it.
- **`--api-key`**, or `VLLM_API_KEY`, makes it ask for a key. Without either, it takes none.

vLLM listens on port 8000, and serves an OpenAI-compatible API under `/v1`.

## Add it to fxbot

1. In **Settings** › **Providers**, choose **Add provider**. Under **On your machine**, **vLLM** says **Found here** when it's running at its usual address with no key. fxbot asks each server there for its model list when the page opens, and gives it half a second to answer.
2. Choose **vLLM**. Its address is filled in, with **Found running on this machine.** under it when fxbot found it.
3. Leave **API key, if the server needs one** empty, unless you gave vLLM a key. Choose **Add**. fxbot checks the server first.
4. Pick the model. Tick **Make it the default for new bots** to start each new bot on it.

| Field | What to put there |
| --- | --- |
| **Address** | vLLM's, with its `/v1`. The usual one, `http://localhost:8000/v1`, is filled in. |
| **API key, if the server needs one** | The key you gave `--api-key` or `VLLM_API_KEY`, if any. It goes to fxbot's server once, sealed, and never comes back to the page. |
| **Context window** | Optional. vLLM reports each model's, so leave it empty unless that's wrong. A number here overrides what vLLM reports, for every model on this provider. |
| **Name** | Optional. It's **vLLM** when you leave it empty. |

When fxbot runs from a checkout, with `npm run dev`, it runs on the machine itself, and the usual address works as it is.

### In a release install

A release install, the one `setup.sh` makes, runs fxbot in a container. There, `localhost` is the container, not your machine, so fxbot doesn't find vLLM, and the usual address doesn't reach it. fxbot takes an HTTPS address, or plain HTTP only on localhost. A server on the machine is plain HTTP from inside the container, which fxbot can't use yet, and the card says so. The same goes for a server on another machine.

Put vLLM behind HTTPS, and give fxbot that address. With Tailscale, and [HTTPS turned on](https://tailscale.com/kb/1153/enabling-https) for your tailnet, serve it on a port of its own, such as 8443:

```sh
sudo tailscale serve --bg --https=8443 8000
```

Then give fxbot `https://<machine>.<tailnet>.ts.net:8443/v1` as the **Address**. fxbot's own `tailscale serve`, on port 443, stays as it is ([Reach fxbot from other devices](/docs/how-to/reach-it/)).

## Its models

fxbot lists the models from vLLM's own list, `/v1/models`: the one it serves, by its id, with the context window vLLM runs it with, its `--max-model-len`. vLLM's list doesn't say whether a model uses tools or reads images.

## When it fails

- **"The key check couldn't reach localhost:8000."** vLLM isn't running there, or is still loading the model. Wait for it, or give the address it runs at. In a release install, that's the container's own localhost: see [In a release install](#in-a-release-install).
- **"vLLM rejected this key (HTTP 401): it's wrong, or it was deleted."** vLLM was started with a key, and the one you gave isn't it, or you gave none.
- **"baseUrl must use https, or http on localhost."** The address is plain HTTP to somewhere other than `localhost` or `127.0.0.1`. Give an HTTPS address.
- **A chat fails at once, with an error from vLLM about tool choice.** vLLM was started without `--enable-auto-tool-choice` and a `--tool-call-parser`. A bot's tools need both: start it with them.
- **The model writes tool calls as text.** The parser doesn't match the model. Pick the one vLLM's tool calling page names for it.
