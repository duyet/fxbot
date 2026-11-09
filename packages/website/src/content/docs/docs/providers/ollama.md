---
title: "Ollama"
description: "Ollama runs open models on your own machine, for free. Add it to fxbot at its usual address, and set its context window when Ollama runs a shorter one than its models'."
---

Ollama runs open models, such as Qwen and Gemma, on your own machine. It's free, and your own hardware does the work: how much memory your GPU has decides how big a model, and how long a context, runs well.

## Start the server

1. Install Ollama from [ollama.com/download](https://ollama.com/download). Its app, or its service on Linux, runs the server. Without either, run `ollama serve`.
2. Pull a model, such as `ollama pull qwen3`. fxbot's model list says which models can use tools. A bot works best with one that can.
3. Give it room. Ollama picks its context by your GPU's memory: 4k tokens under 24 GiB, 32k up to 48 GiB, and 256k above. Ollama's docs suggest at least 64000 for agents. Set it with the context length slider in the Ollama app's settings, or start the server with `OLLAMA_CONTEXT_LENGTH`:

   ```sh
   OLLAMA_CONTEXT_LENGTH=64000 ollama serve
   ```

`ollama ps` shows the context each loaded model runs with, under `CONTEXT`. Ollama serves an OpenAI-compatible API under `/v1`, on port 11434, with nothing to turn on. It takes no key.

## Add it to fxbot

1. In **Settings** › **Providers**, choose **Add provider**. Under **On your machine**, **Ollama** says **Found here** when it's running at its usual address. fxbot asks each server there for its model list when the page opens, and gives it half a second to answer.
2. Choose **Ollama**. Its address is filled in, with **Found running on this machine.** under it when fxbot found it.
3. Set **Context window** if Ollama runs a shorter context than its models', and choose **Add**. fxbot reads Ollama's model list first, to check it's there.
4. Pick a model. Tick **Make it the default for new bots** to start each new bot on it.

| Field | What to put there |
| --- | --- |
| **Address** | Ollama's, with its `/v1`. The usual one, `http://localhost:11434/v1`, is filled in. |
| **Context window** | Optional. The context Ollama runs with, from `ollama ps`, when it's shorter than the models' own. It overrides what Ollama reports, for every model on this provider. |
| **Name** | Optional. It's **Ollama** when you leave it empty. |

There's no key to give: Ollama takes none. When fxbot runs from a checkout, with `npm run dev`, it runs on the machine itself, and the usual address works as it is.

### In a release install

A release install, the one `setup.sh` makes, runs fxbot in a container. There, `localhost` is the container, not your machine, so fxbot doesn't find Ollama, and the usual address doesn't reach it. fxbot takes an HTTPS address, or plain HTTP only on localhost. A server on the machine is plain HTTP from inside the container, which fxbot can't use yet, and the card says so. The same goes for a server on another machine.

Put Ollama behind HTTPS, and give fxbot that address. With Tailscale, and [HTTPS turned on](https://tailscale.com/kb/1153/enabling-https) for your tailnet:

1. Have Ollama listen on every address, with `OLLAMA_HOST=0.0.0.0:11434`. [Ollama's FAQ](https://docs.ollama.com/faq) says how to set it on each system. While Ollama listens only on localhost, it turns away a request that comes by another name, as one through `tailscale serve` does. Other devices on your network then reach Ollama too.
2. Serve it on a port of its own, such as 8443:

   ```sh
   sudo tailscale serve --bg --https=8443 11434
   ```

3. Give fxbot `https://<machine>.<tailnet>.ts.net:8443/v1` as the **Address**.

fxbot's own `tailscale serve`, on port 443, stays as it is ([Reach fxbot from other devices](/docs/how-to/reach-it/)).

## Its models

fxbot lists the models from Ollama's own list, `/api/tags`, by the names `ollama ls` shows, such as `qwen3:latest`. For each one, it asks Ollama's `/api/show` whether the model uses tools and reads images, and how long its context is. It leaves out models that can't chat, such as embedding models.

That context is the model's own, not the one Ollama runs it with. Set **Context window** when Ollama's is shorter.

## When it fails

- **"Ollama's model list couldn't reach localhost:11434."** Ollama isn't running there. Start it, or give the address it runs at. In a release install, that's the container's own localhost: see [In a release install](#in-a-release-install).
- **"Ollama rejected this key (HTTP 403): it may lack a permission, or the account may need credit."** Ollama takes no key. It turned away the name fxbot came by, such as through `tailscale serve`, because it listens only on localhost. Set `OLLAMA_HOST=0.0.0.0:11434`.
- **"baseUrl must use https, or http on localhost."** The address is plain HTTP to somewhere other than `localhost` or `127.0.0.1`. Give an HTTPS address.
- **The model list is empty.** Pull a model first.
- **A bot loses track in a long chat.** Ollama may run a shorter context than fxbot knows. Set **Context window** to what `ollama ps` shows, or raise Ollama's.
