---
title: "Azure OpenAI"
description: "Azure OpenAI runs your own deployments of OpenAI's models and others, in Azure OpenAI or Microsoft Foundry. Add it to fxbot with a resource name, a key, and your deployments' names."
---

Azure OpenAI runs models as deployments in your own Azure resource, in Azure OpenAI or Microsoft Foundry: OpenAI's models, and others Foundry offers, such as DeepSeek and Grok. It bills your Azure subscription, at the prices on its [pricing page](https://azure.microsoft.com/pricing/details/cognitive-services/openai-service/).

## Make a key

1. Open your resource in the [Foundry portal](https://ai.azure.com/), or in the Azure portal, where its keys are under **Resource Management** › **Keys and Endpoint**.
2. Copy **Key 1**. Either key works.
3. Note the resource's name: the part before `.openai.azure.com` in its endpoint.
4. Note each deployment's name, as you named it in Azure. A model answers only once it's deployed.

## Add it to fxbot

1. In **Settings** › **Providers**, choose **Add provider**, then **Azure OpenAI**, under **Clouds**.
2. Type the **Resource name**, paste the key, type the **Deployments**, and choose **Add**. fxbot checks the key with Azure first.
3. Pick one of your deployments as the model. **Make it the default for new bots** starts new bots on it.

| Field | What to put there |
| --- | --- |
| **Resource name** | The part before `.openai.azure.com` in its endpoint. For `https://my-team.openai.azure.com/`, it's `my-team`. |
| **API key** | **Key 1**. It goes to fxbot's server once, sealed, and never comes back to the page. |
| **Deployments** | Each deployment's name, as you named it in Azure, with commas between. |
| **Name** | Optional. It's **Azure OpenAI** when you leave it empty. |

fxbot fills in the address from the resource: `https://{resource}.openai.azure.com/openai/v1`, Azure's v1 API, which needs no `api-version`. It sends the key as Azure's `api-key` header, and as a bearer too. To add or remove deployments later, edit **Deployments** under the provider in **Settings** › **Providers**, and choose **Save**.

## Its models

Your deployments are the list. Azure names the model in a request by its deployment's name, so that's what fxbot sends. Where a deployment's name is a model's own, such as `gpt-5`, fxbot shows that model's context window, tool use, and images from [models.dev](https://models.dev). A deployment with a name of your own works the same, without those details.

## Quirks

These come from Microsoft's docs. fxbot hasn't run Azure with a real key yet.

- **A key only.** fxbot doesn't sign in with Microsoft Entra ID yet.
- **No list from Azure.** fxbot doesn't read your deployments from Azure. A deployment you add there shows in fxbot once you type it under **Deployments**.

## When it fails

- **"Resource name isn't one fxbot can use."** Type the name alone, not the whole address.
- **"Azure OpenAI rejected this key (HTTP 401): it's wrong, or it was deleted."** The key may be from another resource, or regenerated in Azure since you copied it. Copy **Key 1** again.
- **"Azure OpenAI rejected this provider's key. Replace it in Settings › Providers."** fxbot says this when a chat gets a 401 or a 403, such as after the key was regenerated in Azure. Copy the new one, and add it with the provider's **Replace key**.
- **A chat stops with HTTP 404.** The resource has no deployment by that name. Check its spelling under **Deployments**.
- **A chat stops with HTTP 429.** You've reached the deployment's quota. fxbot tries again by itself, and stops the turn after 5 minutes of nothing but refusals ([Providers](/docs/reference/providers/)).
