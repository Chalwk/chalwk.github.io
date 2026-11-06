---
layout: page
title: Privacy Policy - Knot Again!
permalink: /pages/policies/KnotAgain/PRIVACY/
---

**Version 1.0 - Last updated: 3 November 2026**

This policy applies to Knot Again!, published by Jericho Crosby (Chalwk) ("the
Developer") on Google Play. The app is a puzzle game in which you untangle ropes
by dragging dots around a board.

## 1. Summary

**The app collects no personal information about anyone, and requests no Android
permissions at all.** There is no account system, no analytics, no advertising,
and no telemetry. The app does not open any network connection and does not
transmit anything off your device.

## 2. Data stored on your device

The app stores two kinds of data in its own private storage area, which Android
protects from other apps. Both are held in Android DataStore preferences:

- **Your progress**, in a DataStore called `knot_again_progress`. This contains
  the highest level you have unlocked and, for each level you have cleared, your
  best time and your best move count.
- **Your display settings**, in a DataStore called `knot_again_settings`. This
  contains the size of the dots (a scale factor between 0.6 and 1.8) and the
  thickness of the ropes (the same range).

None of this is sent anywhere by the app.

## 3. Device access and security

Anyone who can unlock and use your device can use the app and see your progress
and settings. The app has no separate lock; if you want one, use your device's
screen lock.

## 4. Permissions

The app declares no Android permissions.

## 5. Network activity

The app does not request any network permission and does not open any network
connection. It does not contact any server operated by the Developer, send crash
reports, diagnostics, or usage data, or download updates, remote configuration,
or advertising. It never updates itself; updates come through Google Play.

The About dialog has links to this policy and the End User Licence Agreement.
They open in your web browser, which makes its own network connection. The app
itself does not.

## 6. Third-party services

The app uses no analytics, advertising, or tracking services, no crash reporting
services, no social-media integrations, and no other SDKs that would process
your data. The dependencies used are the standard AndroidX core libraries, the
AndroidX Compose UI toolkit, Material 3, AndroidX DataStore Preferences, and
kotlinx.coroutines (a transitive dependency of DataStore). These are standard
Android and Kotlin parts, not external services, and they do not receive copies
of your data.

Google Play, where you download the app, handles your download under its own
privacy policy. The app does not send it anything.

## 7. Backup, export, and data transfer

The app excludes all of its data from Android cloud backup, so Android's backup
system (for example, backup to your Google account) does not upload it.

The app's Android data-extraction rules for device-to-device transfer include
the app's file directory. Because DataStore Preferences are stored in that
directory (as `files/datastore/knot_again_progress.preferences_pb` and
`files/datastore/knot_again_settings.preferences_pb`), your progress and your
display settings will transfer to a new device on Android 12 and newer as part
of the standard device-to-device transfer. On Android 11 and older, nothing
transfers.

The app has no export or import feature.

## 8. Children

The app can be used by children and adults. It contains no violence and no scary
content. Because the app does not collect personal information from anyone, it
does not collect personal information from children. It includes no advertising,
no accounts, and no sharing features.

Parents and guardians can clear the app's data at any time from Android's
settings, as described in Section 9.

## 9. Your rights

Because the Developer holds no data about you, there is nothing to access,
correct, or delete on the Developer's side. You control everything stored on
your device.

You can reset your progress and your display settings from the "Reset progress"
and "Reset display settings" buttons in the main menu's Settings dialog.

When you uninstall the app, Android removes all of its data from your device
immediately. The app does not set `android:hasFragileUserData`, so the uninstall
flow does not offer to keep it. To remove the data without uninstalling, clear
the app's storage in Android's settings (Settings → Apps → Knot Again! → Storage
→ Clear storage; the exact wording and menu path vary slightly by Android
version).

No copy of your data exists anywhere else, so deletion is immediate and
complete.

If you have a privacy question, or believe privacy law gives you rights that
apply here (for example under the New Zealand Privacy Act 2020), please get in
touch using the contact in Section 11.

## 10. Changes to this policy

If this policy changes, the "Last updated" date at the top will change. Earlier
versions are available on request from the contact below.

## 11. Contact

Questions about privacy can be sent to Jericho Crosby (Chalwk):

- Email: chalwk.dev@gmail.com
- Discord: chalwk

---

*This privacy policy forms part of the Knot Again! End User Licence Agreement
(<https://chalwk.github.io/pages/policies/KnotAgain/EULA/>).*
