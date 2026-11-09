---
title: "Qwen"
description: "Alibaba Cloud Model Studio serves the Qwen models. A key works only in the region it was made in. Add it to fxbot with a key from its console."
---

Qwen is Alibaba's family of models, served by Alibaba Cloud Model Studio. Model Studio gives new accounts a [free quota](https://www.alibabacloud.com/help/en/model-studio/new-free-quota) for each of many models, in its Singapore region only, for 90 days. After that you pay as you go, at the prices on its [pricing page](https://www.alibabacloud.com/help/en/model-studio/model-pricing).

## Make a key

1. Open [Model Studio's API Key page](https://modelstudio.console.alibabacloud.com/?tab=dashboard#/api-key), and sign in or make an Alibaba Cloud account.
2. Check the region at the top of the console: Singapore or China (Beijing). It must match the **Region** you pick in fxbot.
3. Choose **Create API Key**. The default **Workspace** and **All** permissions are fine. Choose **OK**.
4. Copy the key. Model Studio shows it only once.

## Add it to fxbot

1. In **Settings** › **Providers**, choose **Add provider**, then **Qwen**, under **Use a key**.
2. Pick the **Region** you made the key in, paste the key, and choose **Add**. fxbot checks it with Model Studio first.
3. Pick a model from that region's list. **Make it the default for new bots** starts new bots on it.

| Field | What to put there |
| --- | --- |
| **Region** | **International (Singapore)**, the default, or **China (Beijing)**: the region you made the key in. A key works only in the region it was made in. |
| **API key** | The key you copied. It goes to fxbot's server once, sealed, and never comes back to the page. |
| **Name** | Optional. It's **Qwen** when you leave it empty. |

fxbot fills in the address from the region: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` for International, and `https://dashscope.aliyuncs.com/compatible-mode/v1` for China.

## Its models

Each region has its own models. fxbot lists the ones from that region's own list, with each one's context window, tool use, and images from [models.dev](https://models.dev), where models.dev knows the model.

## Quirks

These come from Alibaba's docs. fxbot hasn't run Qwen with a real key yet.

- **A key works in one region.** Alibaba's docs say a key is bound to the region it was made in, and another region's address answers it with 401.
- **Two of its regions.** fxbot offers International (Singapore) and China (Beijing). A key from another of Model Studio's regions, such as US (Virginia), doesn't work here.

## When it fails

- **"Qwen rejected this key (HTTP 401): it's wrong, or it was deleted."** The key may be from another region. Pick the region you made it in, or make a key in the region you picked.
- **"Qwen rejected this key (HTTP 403): it may lack a permission, or the account may need credit."** Alibaba's docs give 403 for an account with an overdue payment. Check your billing in the Alibaba Cloud console.
- **"Qwen rejected this provider's key. Replace it in Settings › Providers."** A chat got a 401: the key stopped working, such as after it was deleted. Make a key in the same region, and add it with the provider's **Replace key**.
- **"Qwen refused this provider's key (HTTP 403): it may lack a permission, or the account may need credit or be over its quota."** Alibaba's docs give 403 when a model's free quota is used up, or a payment is overdue, so check those in Model Studio first.
- **A chat stops with HTTP 429.** You've reached one of Model Studio's rate limits or quotas. fxbot tries again by itself, and stops the turn after 5 minutes of nothing but refusals ([Providers](/docs/reference/providers/)).
