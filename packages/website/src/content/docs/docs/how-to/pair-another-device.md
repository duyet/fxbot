---
title: "Pair another device from one you have"
description: "A paired device pairs another one from anywhere, so a phone that lost its storage, or a new laptop, doesn't wait until you're home. A passkey pairs one with no other device."
---

A paired device pairs another one from anywhere, so a phone that lost its storage, or a new laptop, doesn't wait until you're home. A passkey pairs one with no other device.

## From a paired device

1. On the paired device, open web.fxbot.sh, and tap **Devices** beside your fxbot.
2. Choose **Pair another device**. It shows a code and a QR code, for 10 minutes and one try.
3. On the new device, open web.fxbot.sh, choose **Pair a device**, and type the code. On an iPhone, [add it to the Home Screen](/docs/how-to/reach-it-from-your-phone/#install-the-app-on-the-device) first, and pair in that app.
4. Both screens show six digits. Check they match, then tap **Approve** on the device that showed the code.

Every connected device hears that a device was added, and your fxbot lists it under **Settings** › **Web pairing** › **Devices**, with the device that approved it.

## With a passkey

A passkey pairs a device again with no code and no other device, such as a phone after a reset. Your password manager keeps it, such as iCloud Keychain or Google Password Manager, and syncs it to your other devices.

**Add one** while a device is paired: on its **Devices** screen, choose **Add a passkey**, and follow the browser. Your fxbot keeps one public key for it, under **Settings** › **Web pairing** › **Passkeys**.

**Use it** on the new device: open web.fxbot.sh, choose **Use a passkey**, and pick the passkey for your fxbot. The device is paired, and every connected device hears it. Your fxbot uses the relay it had when you added the passkey: if it's one of your own, put its address under **Relay** first.

A passkey works only at web.fxbot.sh, so another site can't use it. To stop one pairing devices, remove it under **Passkeys**.

## Remove a lost device

On any paired device's **Devices** screen, or in **Settings** › **Web pairing** › **Devices** on your fxbot, choose **Remove** beside it. Its connection closes at once, and it can't connect again until it pairs again. Removing the device you're on works too: it says so, and stops.

**Forget on this device**, on the **Devices** screen, only deletes the pairing from the device in your hand. Your fxbot keeps listing it until you remove it there.
