---
title: "LiteLLM"
description: "LiteLLM's proxy is a server you run yourself, in front of other providers, with keys of its own. Add it to fxbot at its address, with a virtual key or its master key."
---

LiteLLM's proxy is a server you run yourself, in front of other providers: clouds, labs, and servers on your own machine, such as Ollama or vLLM. It gives them all one OpenAI-compatible API, with keys of its own. It's free and open source. The providers behind it bill as they do.

## Start the server

1. Install it, as LiteLLM's [quick start](https://docs.litellm.ai/docs/proxy/quick_start) says:

   ```sh
   uv tool install 'litellm[proxy]'
   ```

2. Write a `config.yaml` that lists its models under `model_list`: for each one, the `model_name` fxbot will show, and under `litellm_params`, the provider's model and key. LiteLLM's [config](https://docs.litellm.ai/docs/proxy/configs) page shows how.
3. Start it:

   ```sh
   litellm --config config.yaml
   ```

It listens on port 4000, with an OpenAI-compatible API under `/v1`. Whether a model calls tools depends on the model and the provider behind it.

Its keys:

- **No master key:** the proxy takes requests with no key.
- **A master key,** `master_key` under `general_settings` in `config.yaml`, or `LITELLM_MASTER_KEY`, starts with `sk-`. Every request then needs a key: the master key, or a virtual key.
- **A virtual key** is made with the master key, at the proxy's `/key/generate`. Virtual keys need a Postgres database of LiteLLM's own, set with `DATABASE_URL`. One made for fxbot can be removed without touching the rest.

## Add it to fxbot

1. In **Settings** › **Providers**, choose **Add provider**. Under **On your machine**, **LiteLLM** says **Found here** when the proxy is running at its usual address with no master key. fxbot asks each server there for its model list when the page opens, without a key, and gives it half a second to answer. With a master key, the tile doesn't say so, and the address is filled in all the same.
2. Choose **LiteLLM**. Its address is filled in.
3. Paste a virtual key, or the master key, and choose **Add**. fxbot checks it with the proxy first.
4. Pick a model. Tick **Make it the default for new bots** to start each new bot on it.

| Field | What to put there |
| --- | --- |
| **Address** | The proxy's, with its `/v1`. The usual one, `http://localhost:4000/v1`, is filled in. |
| **API key, if the server needs one** | A virtual key, or the master key. Leave it empty when the proxy has no master key. It goes to fxbot's server once, sealed, and never comes back to the page. |
| **Context window** | The proxy's list doesn't say it. A number here applies to every model behind the proxy, so give the smallest of those you'll use. |
| **Name** | Optional. It's **LiteLLM** when you leave it empty. |

When fxbot runs from a checkout, with `npm run dev`, it runs on the machine itself, and the usual address works as it is.

### In a release install

A release install, the one `setup.sh` makes, runs fxbot in a container. There, `localhost` is the container, not your machine, so fxbot doesn't find the proxy, and the usual address doesn't reach it. fxbot takes an HTTPS address, or plain HTTP only on localhost. A server on the machine is plain HTTP from inside the container, which fxbot can't use yet, and the card says so. The same goes for a server on another machine.

Put the proxy behind HTTPS, and give fxbot that address. With Tailscale, and [HTTPS turned on](https://tailscale.com/kb/1153/enabling-https) for your tailnet, serve it on a port of its own, such as 8443:

```sh
sudo tailscale serve --bg --https=8443 4000
```

Then give fxbot `https://<machine>.<tailnet>.ts.net:8443/v1` as the **Address**. fxbot's own `tailscale serve`, on port 443, stays as it is ([Reach fxbot from other devices](/docs/how-to/reach-it/)).

## Its models

fxbot lists the models from the proxy's own list, `/v1/models`, by their ids: each `model_name` in its config. The list gives ids only, with no context window, tool use, or images.

## When it fails

- **"The key check couldn't reach localhost:4000."** The proxy isn't running there. Start it, or give the address it runs at. In a release install, that's the container's own localhost: see [In a release install](#in-a-release-install).
- **"LiteLLM rejected this key (HTTP 401): it's wrong, or it was deleted."** The key isn't one the proxy knows, or the proxy has a master key and you gave none.
- **"baseUrl must use https, or http on localhost."** The address is plain HTTP to somewhere other than `localhost` or `127.0.0.1`. Give an HTTPS address.
- **A chat fails on one model, and not the others.** The provider behind that model is failing, such as with a wrong key in `config.yaml`. The proxy's log says why.
