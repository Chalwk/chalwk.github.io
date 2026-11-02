---
layout: page
title: Privacy Policy - HearMeOut-AAC
permalink: /pages/policies/HearMeOut-AAC/PRIVACY/
---

**Last updated: 2 November 2026**

This policy applies to HearMeOut-AAC, published by Jericho Crosby (Chalwk)
("the Developer") on Google Play and as release files on the project's GitHub
Releases page. The app is an augmentative and alternative communication (AAC) tool.

## Summary

**The app collects no personal information about anyone.**
There is no account system, no analytics, no advertising, and no telemetry. The
app does not transmit anything you type, tap, or speak off your device.

## Data stored on your device

The app stores the following in its own private storage area, which Android
protects from other apps:

- **Symbols and categories** you have added, edited, or favourited.
- **Your settings** (theme, voice, speech rate, volume, pitch, grid size,
  keyboard layout, and feature toggles).
- **The learned prediction model**, built from phrases you have spoken and used
  to suggest your next word. This reflects what you say, so treat it as
  personal.
- **Imported images** from your device, resized to a maximum of 512 pixels and
  stored as JPEG files.

None of this is sent anywhere by the app. When you uninstall the app, Android
may ask whether you want to keep the app's data, so your vocabulary is not lost
by accident. If you choose to keep it, it stays on your device (and comes back
if you reinstall the app) until you delete it. To remove it for good, choose to
delete the data when uninstalling, or clear the app's storage in Android's
settings before uninstalling.

Anyone who can unlock and use your device can use the app and see this
information. The app has no separate lock.

## Network activity

The app declares the `android.permission.INTERNET` permission. This exists
**solely** so the image-loading library (Coil) can display image web addresses
(URLs) that you have chosen to paste into the symbol editor. No other network
activity occurs. In particular:

- The app does not contact any server operated by the Developer.
- The app does not send crash reports, diagnostics, or usage data.
- The app does not download updates, remote configuration, or advertising. It
  never updates itself. If you installed it from Google Play, updates come
  through Google Play. If you installed it from GitHub, you install updates
  yourself by downloading a newer release.

If you add an image by URL, your device requests that image from whoever hosts
it. That host can see your device's IP address and normal request details, as
with any web request, and has its own privacy practices. The app does not
control or receive that information. Images loaded this way may be temporarily
stored on your device by the image-loading library and are removed when you
clear the app's storage or uninstall it.

If you never paste a remote image URL, the app never opens a network connection.

The About screen has links to this policy, the EULA, and the source licence.
They open in your web browser, which makes its own network connection. The app
itself does not.

## Third-party services

The app uses no analytics, advertising, or tracking services. It uses your
device's built-in Android text-to-speech engine, which is provided by Android or
by a voice engine you have installed. Whether that engine processes speech
locally or remotely is decided by the engine and its provider, not by this app.
The app passes only the plain text of your phrase to the engine. If you are
concerned, check your engine's settings and privacy policy.

Google Play and GitHub, where you can download the app, handle your downloads
under their own privacy policies. The app does not send them anything.

## Backup, export, and data transfer

The app excludes all of its data from Android cloud backup, so Android's backup
system (for example, backup to your Google account) does not upload it.

The app has an **Export** feature that saves your setup to a JSON file in a
location you choose. That file contains your symbols, settings, and learned
prediction data, which reflects phrases you have spoken. If you save it to a
cloud-synced folder, send it to someone, or store it somewhere shared, it is
then handled by that service or person, not by this app. Treat the file as
personal.

When you set up a new phone using Android's standard device-to-device transfer,
the app's data can move with you on Android 12 and newer. On Android 11 and
older, the app's data is not included in that transfer, so use **Export** and
**Import** to move your setup. Device-to-device transfer happens only when you
start it, and it goes directly between your two devices.

## Children

The app can be used by children and adults. Because it does not collect personal
information from anyone, it does not collect personal information from
children. It includes no advertising, no accounts, and no sharing features.
Parents, carers, and teachers should be aware of the image-URL and export
behaviour described above if they set up the app for a child.

## Your rights

Because the Developer holds no data about you, there is nothing to access,
correct, or delete on the Developer's side. You control everything stored on
your device. You can delete it by clearing the app's storage, or by choosing to
delete the app's data when you uninstall it. If you have a privacy question, or
believe privacy law gives you rights that apply here (for example under the
New Zealand Privacy Act 2020), please get in touch using the contact below.

## Changes to this policy

If this policy changes, the "Last updated" date at the top will change and the
previous version will remain available in the project's public Git history at
<https://github.com/Chalwk/HearMeOut-AAC>

## Contact

Questions about privacy: **chalwk.dev@gmail.com**

---

*This privacy policy forms part of the HearMeOut-AAC End User Licence
Agreement (<https://chalwk.github.io/pages/policies/HearMeOut-AAC/EULA/>).*
