---
title: "NVIDIA"
description: "NVIDIA serves open models from many makers at build.nvidia.com, free for development. Add it to fxbot with a key from there."
---

NVIDIA serves open models from many makers at build.nvidia.com. It's free for development. Signing up makes you a member of NVIDIA's Developer Program.

## Make a key

1. Open [build.nvidia.com/settings/api-keys](https://build.nvidia.com/settings/api-keys), and sign in or make an account.
2. Choose **Generate API Key**.
3. Copy the key.

## Add it to fxbot

1. In **Settings** › **Providers**, choose **Add provider**, then **NVIDIA**, under **Use a key**.
2. Paste the key, and choose **Add**. NVIDIA's model list answers any key, so fxbot can't check yours here, and the card says so. A wrong key shows at the first message.
3. Pick a model. Tick **Make it the default for new bots** to start each new bot on it.
4. Send a bot on NVIDIA a short message, to find out that the key works.

| Field | What to put there |
| --- | --- |
| **API key** | The key you copied. It goes to fxbot's server once, sealed, and never comes back to the page. |
| **Name** | Optional. It's **NVIDIA** when you leave it empty. |

NVIDIA's address is `https://integrate.api.nvidia.com/v1`. fxbot fills it in.

## Its models

fxbot lists the models from NVIDIA's own list, with each one's context window, tool use, and images from [models.dev](https://models.dev), where models.dev knows the model. fxbot looks for each by its id, then by its name without the maker in front. A model models.dev doesn't know still lists, without them. When the research for this page looked, models.dev knew 25 of the 84 models NVIDIA listed.

## Quirks

- **NVIDIA's model list answers any key,** a made-up one or none at all, so it can't tell fxbot whether yours is right. The first message is the first check.
- **NVIDIA doesn't take the `developer` role,** the name OpenAI's API now gives a model's instructions, in place of `system`. If libfx, which runs fxbot's chats, sends instructions that way, a chat fails. pi, another agent app, marks NVIDIA so.

This is what the research for this page found. fxbot hasn't run NVIDIA with a real key yet.

## When it fails

- **"NVIDIA rejected this provider's key. Replace it in Settings › Providers."** The key is wrong, or it was deleted. fxbot couldn't check it when you added it, so this is where a wrong key shows. Make another, and use the provider's **Replace key**.
- **A chat stops with HTTP 429.** You've reached NVIDIA's rate limit. fxbot tries again by itself, and stops the turn after 5 minutes of nothing but refusals ([Providers](/docs/reference/providers/)).
