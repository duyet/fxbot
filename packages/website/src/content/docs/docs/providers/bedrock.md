---
title: "AWS Bedrock"
description: "AWS Bedrock runs OpenAI's open models, Qwen, DeepSeek, Mistral, and more in your own AWS account. Add it to fxbot with a long-term Bedrock API key and a region."
---

AWS Bedrock runs models from many labs in your own AWS account: OpenAI's open models, Qwen, DeepSeek, Mistral, and more. It bills your AWS account, at the prices on its [pricing page](https://aws.amazon.com/bedrock/pricing/).

## Make a key

1. Open the [Bedrock console's API keys](https://console.aws.amazon.com/bedrock/home#/api-keys), and sign in.
2. Pick the region at the top of the console.
3. In the **Long-term API keys** tab, choose **Generate long-term API keys**.
4. Under **API key expiration**, pick how long it lasts, and choose **Generate**.
5. Copy the key.

AWS recommends long-term keys only for exploring Bedrock. fxbot doesn't sign in with AWS's IAM credentials yet.

## Add it to fxbot

1. In **Settings** › **Providers**, choose **Add provider**, then **AWS Bedrock**, under **Clouds**.
2. Type the **Region** your models run in, paste the key, and choose **Add**. fxbot checks it with Bedrock first.
3. Pick a model. **Make it the default for new bots** starts new bots on it.

| Field | What to put there |
| --- | --- |
| **Region** | `us-east-1`, the default, or the region your models run in, such as `us-west-2`. |
| **API key** | The key you copied. It goes to fxbot's server once, sealed, and never comes back to the page. |
| **Name** | Optional. It's **AWS Bedrock** when you leave it empty. |

fxbot fills in the address from the region: `https://bedrock-runtime.{region}.amazonaws.com/openai/v1`, Bedrock's OpenAI-compatible Chat Completions. The runtime has no model list, so fxbot checks the key at `https://bedrock-mantle.{region}.api.aws/v1/models` instead. To move to another region, remove the provider and add it again.

## Its models

fxbot lists models.dev's list for Bedrock, with each one's context window, tool use, and images. Claude doesn't serve this API on Bedrock, so it isn't listed. Not every other model does either: each model's card in AWS's [Models at a glance](https://docs.aws.amazon.com/bedrock/latest/userguide/model-cards.html) says which APIs it takes.

## Quirks

These come from AWS's docs. fxbot hasn't run Bedrock with a real key yet.

- **The key expires.** A long-term key lasts as long as you picked. When it ends, chats stop with "AWS Bedrock rejected this provider's key". Make another, and add it with the provider's **Replace key**.
- **Ids with a region group.** Some ids start with `us.`, `eu.`, `apac.`, or `global.`. These are inference profiles, which spread requests over that group's regions, and some models take only them. Pick one that matches your region, such as `us.` for `us-east-1`. Whether each works through Chat Completions hasn't been checked.
- **The key check needs bedrock-mantle.** AWS runs that endpoint in fewer regions than the runtime: not in `us-west-1` or `ca-central-1`, for example ([AWS's table](https://docs.aws.amazon.com/bedrock/latest/userguide/endpoints-region-availability.html)). In a region without it, fxbot keeps the key unchecked, and a wrong key, or a misspelled region, shows at the first message.
- **A model's first use.** Bedrock turns most models on at their first use. One sold through AWS Marketplace also needs the key's user to be allowed to subscribe, and a payment method on the account. OpenAI's open models, and models from DeepSeek, Mistral, Qwen, and others, aren't sold there, and need neither.

## When it fails

- **"AWS Bedrock rejected this key (HTTP 401): it's wrong, or it was deleted."** It may also have expired. Make another, and paste that.
- **"AWS Bedrock rejected this key (HTTP 403): it may lack a permission, or the account may need credit."** The key's user may lack Bedrock's permissions. A key from the console comes with AWS's `AmazonBedrockLimitedAccess` policy, which you can check in IAM.
- **The first message fails, after a key that wasn't checked.** Check the region's spelling, and that the key is from that region. Remove the provider, and add it again with the right one.
- **"AWS Bedrock rejected this provider's key. Replace it in Settings › Providers."** fxbot says this when a chat gets a 401 or a 403. A 401 is an expired or deleted key: make another, and use **Replace key**. Bedrock also answers 403 when your account can't use a model yet. Open the model once in the console's playground, from **Model catalog**, then try again.
- **A chat stops with HTTP 429.** You've reached Bedrock's quota for that model. fxbot tries again by itself, and stops the turn after 5 minutes of nothing but refusals ([Providers](/docs/reference/providers/)).
