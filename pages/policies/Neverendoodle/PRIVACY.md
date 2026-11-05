---
layout: page
title: Privacy Policy - Neverendoodle
permalink: /pages/policies/Neverendoodle/PRIVACY/
---

**Version 1.0 - Last updated: 5 November 2026**

This policy applies to Neverendoodle, published by Jericho Crosby (Chalwk)
("the Developer") on Google Play. The app is an infinite canvas drawing and
sketching application for Android.

## 1. Summary

**The app collects no personal information about anyone.** There is no account
system, no analytics, no advertising, and no telemetry. The app does not
transmit anything you enter off your device. Everything you draw, including
your artwork, reference images, and settings, is stored only on your device and
never leaves it unless you deliberately export or share it.

## 2. Data stored on your device

The app stores the following in its own private storage area, which Android
protects from other apps:

- **Your artwork**, including every stroke, layer, and canvas frame you create.
  This is saved in a local file named `neverendoodle.json`.
- **Your reference images**, imported from your device, saved locally alongside
  your artwork for tracing and reference.
- **Your app settings**, including theme preferences, canvas background,
  brush configurations, custom palettes, and grid settings. These are stored in
  standard Android SharedPreferences.
- **Your exported files**, temporarily saved to the app's cache directory when
  you choose to share a drawing, so they can be handed safely to other apps.

None of this is sent anywhere by the app. It is used only to display your
artwork and preferences back to you inside the app.

## 3. Device access and security

Anyone who can unlock and use your device can use the app and see your artwork.
The app has no separate lock; if you want one, use your device's screen lock.

The app does not currently encrypt its local storage beyond the protection
Android's app sandbox already provides. If you want defence-in-depth, keep your
device's screen lock on and keep device encryption on, which is the default on
modern Android.

## 4. Permissions

The app does not request or declare any runtime Android permissions. It does
not need access to your contacts, camera, location, microphone, or external
files.

The app declares a standard Android `FileProvider` to manage the safe sharing of
exported images. This does not grant the app access to your files; it simply
allows the app to hand a specific file you have chosen to export (like a PNG of
your drawing) to another app (like your messaging app or email client) when you
tap the share button.

## 5. Network activity

The app does not request any network permission and does not open any network
connection. It does not contact any server operated by the Developer, send
crash reports, diagnostics, or usage data, or download updates, remote
configuration, or advertising. It never updates itself; updates come through
Google Play.

When you choose to export or share a drawing, the app uses Android's standard
sharing mechanism or file picker. The app does not receive copies of what those
other apps do. Those apps may make their own network connections under their
own privacy practices.

The Settings dialog has a link to this policy. It opens in your web browser,
which makes its own network connection. The app itself does not.

## 6. Third-party services

The app uses no analytics, advertising, or tracking services, no crash reporting
services, no social-media integrations, and no other SDKs that would process
your data. The only third parties involved are standard Android system
components: Android's system file picker and share sheet. These are standard
Android parts, not external services, and they do not receive copies of your
data.

Google Play, where you download the app, handles your download under its own
privacy policy. The app does not send it anything.

## 7. Backup, export, and data transfer

The app excludes all of its data from Android cloud backup, so Android's backup
system (for example, backup to your Google account) does not upload it.

When you set up a new phone using Android's standard device-to-device transfer,
the app's data can move with you on Android 12 and newer. On Android 11 and
older, the app's data is not included in that transfer, so use **Export** and
**Import** to move your setup.

The **Export** feature saves your data to a file in a location you choose.
Depending on the format selected (PNG, SVG, or JSON), that file contains an
image of your drawing or the underlying stroke data. If you save it to a
cloud-synced folder, send it to someone, or store it somewhere shared, it is
then handled by that service or person, not by this app. Treat the file as
personal. The **Import** feature reads only the file you select.

## 8. Children

The app can be used by children and adults. Because the app does not collect
personal information from anyone, it does not collect personal information from
children. It includes no advertising, no accounts, and no automatic sharing
features.

Parents and guardians can clear the app's data at any time from Android's
settings, as described in Section 9.

## 9. Your rights

Because the Developer holds no data about you, there is nothing to access,
correct, or delete on the Developer's side. You control everything stored on
your device.

When you uninstall the app, Android removes its data from your device. The
uninstall flow on some Android versions may offer to keep the app's data; if you
accept, it stays on your device (and comes back if you reinstall the app) until
you delete it. To remove it for good, choose to delete the data when
uninstalling, or clear the app's storage in Android's settings (Settings → Apps
→ Neverendoodle → Storage → Clear storage; the exact wording and menu path vary
slightly by Android version).

Inside the app, the top menu has an option to **Clear Canvas**, which wipes your
artwork.

Files you have exported are separate copies, which you must delete yourself.
Apart from those, no copy of your data exists anywhere else, so deletion is
immediate and complete.

## 10. Changes to this policy

If this policy changes, the "Last updated" date at the top will change. Earlier
versions are available on request from the contact below.

## 11. Contact

Questions about privacy can be sent to Jericho Crosby (Chalwk):

- Email: chalwk.dev@gmail.com
- Discord: chalwk

---

*This privacy policy forms part of the Neverendoodle End User Licence Agreement
(<https://chalwk.github.io/pages/policies/Neverendoodle/EULA/>).*