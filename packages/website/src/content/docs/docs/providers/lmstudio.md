---
title: "LM Studio"
description: "LM Studio is an app that downloads and runs open models on your own machine, for free. Start its server in the Developer tab, and add it to fxbot at its usual address."
---

LM Studio is an app for finding, downloading, and running open models on your own machine. It's free, and your own hardware runs the models. Its server gives them to other apps, such as fxbot.

## Start the server

1. Install LM Studio from [lmstudio.ai](https://lmstudio.ai), and download a model in it. Models with native tool use carry a hammer badge. A bot works best with one of them.
2. Load the model with the context length you want, in the app, or with `lms load`:

   ```sh
   lms load <model_key> --context-length 32768
   ```

3. In the **Developer** tab, turn on **Start server**. Or run `lms server start`.
4. Leave **Require Authentication for each request**, in the **Developer** tab's **Server Settings**, off. fxbot sends LM Studio no key.

LM Studio serves an OpenAI-compatible API under `/v1`. fxbot looks for it on port 1234, the one LM Studio's own examples use. fxbot also reads LM Studio's own model list, at `/api/v1/models`, which came with LM Studio 0.4.0.

## Add it to fxbot

1. In **Settings** › **Providers**, choose **Add provider**. Under **On your machine**, **LM Studio** says **Found here** when its server is running at its usual address. fxbot asks each server there for its model list when the page opens, and gives it half a second to answer.
2. Choose **LM Studio**. Its address is filled in, with **Found running on this machine.** under it when fxbot found it.
3. Choose **Add**. fxbot reads LM Studio's model list first, to check it's there.
4. Pick a model. Tick **Make it the default for new bots** to start each new bot on it.

| Field | What to put there |
| --- | --- |
| **Address** | LM Studio's, with its `/v1`. The usual one, `http://localhost:1234/v1`, is filled in. |
| **Context window** | Optional. LM Studio says the context each loaded model runs with, so leave it empty unless that's wrong. A number here overrides what LM Studio reports, for every model on this provider. |
| **Name** | Optional. It's **LM Studio** when you leave it empty. |

There's no key to give: fxbot sends LM Studio none. When fxbot runs from a checkout, with `npm run dev`, it runs on the machine itself, and the usual address works as it is.

### In a release install

A release install, the one `setup.sh` makes, runs fxbot in a container. There, `localhost` is the container, not your machine, so fxbot doesn't find LM Studio, and the usual address doesn't reach it. fxbot takes an HTTPS address, or plain HTTP only on localhost. A server on the machine is plain HTTP from inside the container, which fxbot can't use yet, and the card says so. The same goes for a server on another machine.

Put LM Studio's server behind HTTPS, and give fxbot that address. With Tailscale, and [HTTPS turned on](https://tailscale.com/kb/1153/enabling-https) for your tailnet, serve it on a port of its own, such as 8443:

```sh
sudo tailscale serve --bg --https=8443 1234
```

Then give fxbot `https://<machine>.<tailnet>.ts.net:8443/v1` as the **Address**. fxbot's own `tailscale serve`, on port 443, stays as it is ([Reach fxbot from other devices](/docs/how-to/reach-it/)).

## Its models

fxbot lists the language models from LM Studio's own list, by each one's key, with LM Studio's name for it. LM Studio says whether each was trained for tool use, whether it reads images, and its context: the context it's loaded with, or the most it takes when it isn't loaded. Embedding models are left out.

A model that isn't loaded when fxbot reads the list shows the most it takes, which may be more than LM Studio loads it with. Load it first, or set **Context window**.

## When it fails

- **"LM Studio's model list couldn't reach localhost:1234."** Its server isn't on. Turn on **Start server** in the **Developer** tab, or give the port it runs on. In a release install, that's the container's own localhost: see [In a release install](#in-a-release-install).
- **"LM Studio rejected this key"**, though you gave none. **Require Authentication for each request** is on, and fxbot sends LM Studio no key. Turn it off.
- **The model list fails, or is empty.** An LM Studio older than 0.4.0 doesn't have the list fxbot reads: update it. Or no language model is downloaded yet.
- **"baseUrl must use https, or http on localhost."** The address is plain HTTP to somewhere other than `localhost` or `127.0.0.1`. Give an HTTPS address.
