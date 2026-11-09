---
title: "Vertex AI"
description: "Vertex AI serves Gemini and partner models in your own Google Cloud project. Add it to fxbot with a service account's key file, from which fxbot makes its own tokens."
---

Vertex AI is Google Cloud's way to run Gemini, and partner models, in your own Google Cloud project, billed to that project. Google now calls it Gemini Enterprise Agent Platform, and its console and docs use that name. Its prices are on its [pricing page](https://cloud.google.com/vertex-ai/generative-ai/pricing). For a key from Google AI Studio instead, with a free tier, use [Google Gemini](/docs/providers/gemini/).

## Make a service account key

Vertex takes no API key here, so fxbot signs in as a service account: an account for software, in your project.

1. In the [Google Cloud console](https://console.cloud.google.com/), pick or make a project. Find the **Agent Platform API** with the console's search, and choose **Enable**. It was the Vertex AI API.
2. Open [Service accounts](https://console.cloud.google.com/iam-admin/serviceaccounts), and choose **Create service account**. Give it a name, such as fxbot, and choose **Create and continue**.
3. Give it the **Agent Platform User** role (`roles/aiplatform.user`). It was Vertex AI User. Choose **Continue**, then **Done**.
4. Choose the account's email, then **Keys** › **Add key** › **Create new key**. Pick **JSON**, and choose **Create**. The file downloads, and Google lets you download it only once.

## Add it to fxbot

1. In **Settings** › **Providers**, choose **Add provider**, then **Vertex AI**, under **Clouds**.
2. Leave **Location** as `global`, or type a region. Choose the JSON file under **Service account key**, then **Add**. fxbot makes its first token from the file, which checks it with Google.
3. Pick a model. **Make it the default for new bots** starts new bots on it.

| Field | What to put there |
| --- | --- |
| **Location** | `global`, the default, or a region such as `us-central1`. |
| **Service account key** | The JSON file Google downloaded. It goes to fxbot's server once, sealed, and never comes back to the page. |
| **Name** | Optional. It's **Vertex AI** when you leave it empty. |

The project comes from the file. fxbot fills in the address from the project and the location: `https://aiplatform.googleapis.com/v1/projects/{project}/locations/global/endpoints/openapi` for `global`, and a region's own host for a region, such as `https://us-central1-aiplatform.googleapis.com/…`. To move to another location, remove the provider and add it again.

## Its models

Vertex's endpoint has no model list, so fxbot lists models.dev's list for Vertex, with each one's context window, tool use, and images. Each Gemini model has `google/` in front, as Vertex wants it. A partner model keeps its maker's name in front instead. Claude isn't on this endpoint, so it isn't listed. Not every model is served at every location.

## Quirks

These come from Google's docs, and from how Vertex answers. fxbot hasn't run Vertex with a real service account yet.

- **No API keys.** Vertex's OpenAI-compatible endpoint takes only Google Cloud's own tokens, and answers an API key with "API keys are not supported by this API". So fxbot makes its own, each an hour long: it signs a request with the account's key, and trades it at Google's token endpoint, and no other. It makes a new one 5 minutes before each ends.
- **Checked by a token.** Adding checks only that Google makes a token from the file. A missing role, an API that's off, or a wrong location shows at the first chat.
- **Global or a region.** Google says `global` is more available than a single region, and gets fewer 429s. Pick a region when the model must run there.
- **Gemini's thought signatures.** Gemini 3 and newer want each tool call's thought signature back on the next turn, as on [Google Gemini](/docs/providers/gemini/#quirks). Whether libfx, the agent inside fxbot, sends them back here hasn't been checked.

## When it fails

- **"That file isn't a service account's JSON key."** Choose the JSON file from the account's **Keys**, not another file from Google Cloud.
- **"That service account names a token endpoint that isn't Google's."** The file's `token_uri` was changed. Make a new key in the console, and choose that file.
- **"Google refused the service account (HTTP …)."** Google wouldn't make a token from the file. The key or the account may have been deleted or disabled. Make a new key, and add it with the provider's **Replace service account**.
- **The console won't make a key.** An organization policy, `iam.disableServiceAccountKeyCreation`, blocks service account keys. Google turns it on for organizations made since May 3, 2024. An organization policy administrator can exempt your project.
- **"Vertex AI rejected this provider's key. Replace it in Settings › Providers."** fxbot says this when a chat gets a 401 or a 403. With Vertex, a 403 can also mean the account lacks the **Agent Platform User** role, or the API is off in its project. Check those in the console first. You need a new key file only if the old one was deleted.
- **A chat can't reach Vertex, or gets HTTP 404.** The location may be wrong, or the model isn't served there. Remove the provider, and add it again with another location.
- **A chat stops with HTTP 429.** You've reached a quota for that model. fxbot tries again by itself, and stops the turn after 5 minutes of nothing but refusals ([Providers](/docs/reference/providers/)).
