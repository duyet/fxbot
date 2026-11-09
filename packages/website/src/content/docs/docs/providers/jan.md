---
title: "Jan"
description: "Jan is an app that runs open models on your own machine, for free. Start its Local API Server in Jan's settings, with an API key, and add it to fxbot with that key."
---

Jan is an open-source app for chatting with open models on your own machine. Its Local API Server gives them to other apps, such as fxbot, over an OpenAI-compatible API. It's free, and your own hardware runs the models.

## Start the server

1. Install Jan from [jan.ai](https://jan.ai), and download a model in it. The server needs a model Jan can load.
2. Open Jan's **Settings** › **Local API Server**, and pick the model it starts with, under **Default Model Local API Server**.
3. Type an **API Key** in its configuration. fxbot sends it with each request. With the field empty, Jan asks for no key.
4. Choose **Start Server**, and wait for **Server Status** to say it's running.

Jan listens on `127.0.0.1`, port 1337, with its API under `/v1`, unless you change them there.

## Add it to fxbot

1. In **Settings** › **Providers**, choose **Add provider**. Under **On your machine**, **Jan** says **Found here** when its server is running at its usual address with no key. fxbot asks each server there for its model list when the page opens, without a key, and gives it half a second to answer. With a key set in Jan, the tile doesn't say so, and the address is filled in all the same.
2. Choose **Jan**. Its address is filled in.
3. Paste the API key you typed in Jan, and choose **Add**. fxbot checks it with Jan first.
4. Pick a model. Tick **Make it the default for new bots** to start each new bot on it.

| Field | What to put there |
| --- | --- |
| **Address** | Jan's, with its `/v1`. The usual one, `http://localhost:1337/v1`, is filled in. |
| **API key, if the server needs one** | The **API Key** from Jan's **Local API Server** settings. Leave it empty when that's empty. It goes to fxbot's server once, sealed, and never comes back to the page. |
| **Context window** | The context Jan loads the model with. Jan's list doesn't say it. It applies to every model on this provider. |
| **Name** | Optional. It's **Jan** when you leave it empty. |

When fxbot runs from a checkout, with `npm run dev`, it runs on the machine itself, and the usual address works as it is.

### In a release install

A release install, the one `setup.sh` makes, runs fxbot in a container. There, `localhost` is the container, not your machine, so fxbot doesn't find Jan, and the usual address doesn't reach it. fxbot takes an HTTPS address, or plain HTTP only on localhost. A server on the machine is plain HTTP from inside the container, which fxbot can't use yet, and the card says so. The same goes for a server on another machine.

Put Jan's server behind HTTPS, and give fxbot that address. With Tailscale, and [HTTPS turned on](https://tailscale.com/kb/1153/enabling-https) for your tailnet:

1. Serve it on a port of its own, such as 8443:

   ```sh
   sudo tailscale serve --bg --https=8443 1337
   ```

2. Add `<machine>.<tailnet>.ts.net` to **Trusted Hosts**, in Jan's **Local API Server** settings. Jan turns away a request that comes by a name it doesn't trust, as one through `tailscale serve` does.
3. Give fxbot `https://<machine>.<tailnet>.ts.net:8443/v1` as the **Address**.

fxbot's own `tailscale serve`, on port 443, stays as it is ([Reach fxbot from other devices](/docs/how-to/reach-it/)).

## Its models

fxbot lists the models from Jan's own list, `/v1/models`, by their ids. Jan's list says nothing else of them: no context window, tool use, or images.

## When it fails

- **"The key check couldn't reach localhost:1337."** Jan's server isn't running. Choose **Start Server**: it needs a model Jan can load. In a release install, that's the container's own localhost: see [In a release install](#in-a-release-install).
- **"Jan rejected this key (HTTP 401): it's wrong, or it was deleted."** The key isn't the one in Jan's settings, or Jan has one and you gave none. Copy it again, and choose **Add**.
- **"Jan rejected this key (HTTP 403): it may lack a permission, or the account may need credit."** Jan turned away the name fxbot came by, such as through `tailscale serve`, not the key. Add that name to **Trusted Hosts**.
- **"baseUrl must use https, or http on localhost."** The address is plain HTTP to somewhere other than `localhost` or `127.0.0.1`. Give an HTTPS address.
