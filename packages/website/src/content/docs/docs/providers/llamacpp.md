---
title: "llama.cpp"
description: "llama.cpp's llama-server runs an open model on your own machine, for free. Start it with --jinja, so the model can call tools, and add it to fxbot at its address."
---

llama.cpp runs open models in the GGUF format on your own machine, on its CPU or its GPU. Its `llama-server` serves the model you start it with over an OpenAI-compatible API. It's free and open source, and your own hardware does the work.

## Start the server

1. Install llama.cpp, such as with `brew install llama.cpp` on a Mac or Linux, `winget install llama.cpp` on Windows, or from its [releases](https://github.com/ggml-org/llama.cpp/releases).
2. Start `llama-server` with a model, from Hugging Face with `-hf`, or from a GGUF file with `-m`:

   ```sh
   llama-server -hf <user>/<model> --jinja
   ```

- **`--jinja`** uses the model's own chat template, which tool calls need. Newer builds turn it on by default, and giving it does no harm. Some models need `--chat-template-file` too: see llama.cpp's [function calling](https://github.com/ggml-org/llama.cpp/blob/master/docs/function-calling.md) page.
- **Port 9931** is where fxbot looks, and where newer builds listen unless told otherwise. Older ones, and llama.cpp's container images, use 8080.
- **`-c`**, or `--ctx-size`, sets the context. Without it, llama-server takes the model's own.
- **`--alias`** gives the model the id fxbot shows. Without it, the id is the model file's path.
- **`--api-key`** makes it ask for a key. Without it, it takes none.

llama-server listens on `127.0.0.1` unless `--host` says otherwise. `curl http://localhost:9931/props` shows the context it runs with, as `n_ctx`.

## Add it to fxbot

1. In **Settings** › **Providers**, choose **Add provider**. Under **On your machine**, **llama.cpp** says **Found here** when llama-server is running at its usual address with no key. fxbot asks each server there for its model list when the page opens, and gives it half a second to answer.
2. Choose **llama.cpp**. Its address is filled in, with **Found running on this machine.** under it when fxbot found it. If llama-server runs on another port, change it, such as to `http://localhost:8080/v1` for an older build.
3. Leave **API key, if the server needs one** empty, unless you started it with `--api-key`. Set **Context window**, and choose **Add**. fxbot checks the server first.
4. Pick the model. Tick **Make it the default for new bots** to start each new bot on it.

| Field | What to put there |
| --- | --- |
| **Address** | llama-server's, with its `/v1`. The usual one, `http://localhost:9931/v1`, is filled in. |
| **API key, if the server needs one** | One of its `--api-key` keys, if you gave any. It goes to fxbot's server once, sealed, and never comes back to the page. |
| **Context window** | The context llama-server runs with: its `n_ctx`, or the `-c` you gave it. fxbot can't read it from llama-server's list. It applies to every model on this provider. |
| **Name** | Optional. It's **llama.cpp** when you leave it empty. |

When fxbot runs from a checkout, with `npm run dev`, it runs on the machine itself, and the usual address works as it is.

### In a release install

A release install, the one `setup.sh` makes, runs fxbot in a container. There, `localhost` is the container, not your machine, so fxbot doesn't find llama-server, and the usual address doesn't reach it. fxbot takes an HTTPS address, or plain HTTP only on localhost. A server on the machine is plain HTTP from inside the container, which fxbot can't use yet, and the card says so. The same goes for a server on another machine.

Put llama-server behind HTTPS, and give fxbot that address. With Tailscale, and [HTTPS turned on](https://tailscale.com/kb/1153/enabling-https) for your tailnet, serve it on a port of its own, such as 8443:

```sh
sudo tailscale serve --bg --https=8443 9931
```

Then give fxbot `https://<machine>.<tailnet>.ts.net:8443/v1` as the **Address**. fxbot's own `tailscale serve`, on port 443, stays as it is ([Reach fxbot from other devices](/docs/how-to/reach-it/)).

## Its models

fxbot lists the model from llama-server's own list, `/v1/models`, by its id: the model file's path, or its `--alias`. Newer builds say whether it reads images. The list gives no context window or tool use that fxbot reads, so set **Context window** yourself.

## When it fails

- **"The key check couldn't reach localhost:9931."** llama-server isn't running there. Older builds listen on 8080: put its port in the address. In a release install, that's the container's own localhost: see [In a release install](#in-a-release-install).
- **"llama.cpp rejected this key (HTTP 401): it's wrong, or it was deleted."** llama-server was started with `--api-key`, and the key you gave isn't one of them, or you gave none.
- **"baseUrl must use https, or http on localhost."** The address is plain HTTP to somewhere other than `localhost` or `127.0.0.1`. Give an HTTPS address.
- **The model writes tool calls as text, or calls none.** Start llama-server with `--jinja`. If it still doesn't, the model may need `--chat-template-file`, as llama.cpp's function calling page says.
