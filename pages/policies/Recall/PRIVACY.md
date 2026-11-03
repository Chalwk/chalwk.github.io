---
layout: page
title: Privacy Policy - Recall
permalink: /pages/policies/Recall/PRIVACY/
---

**Version 1.0 - Last updated: 3 November 2026**

This policy applies to Recall, published by Jericho Crosby (Chalwk) ("the
Developer") on Google Play. The app is a card-matching memory game that you can
play against another person or against an AI opponent.

## 1. Summary

**The app collects no personal information about anyone.** There is no account
system, no analytics, no advertising, and no telemetry. The app does not open
any network connection and does not transmit anything off your device.

The app requests one Android permission, `VIBRATE`, solely to provide haptic
feedback during play. It requests no other Android permissions.

## 2. Data stored on your device

The app stores one kind of data in its own private storage area, which Android
protects from other apps: **your settings and your game stats**, in an Android
DataStore called `recall_settings`.

- **Your settings**: game mode (player vs player or player vs AI), board size,
  AI difficulty (Forgetful, Sharp, or Perfect), sound on/off, haptics on/off,
  high contrast on/off, hints on/off, and background theme (one of eight
  gradient backgrounds).
- **Your stats**: total games played, Player 1 wins, Player 2 wins, AI wins,
  ties, total time played across all sessions, and, for each board size you have
  won, your best winning move count and your best winning time.

None of this is sent anywhere by the app.

**What the AI opponent remembers.** When you play in player vs AI mode, the AI
remembers card positions it has seen during the current game session, including
cards you flipped yourself. How much it remembers depends on the AI difficulty
you choose:

- **Forgetful**: a 65 percent chance of forgetting a card it has seen each time
  the pair it flipped does not match.
- **Sharp**: a 25 percent chance of forgetting per mismatched pair.
- **Perfect**: the AI never forgets a card it has seen.

This AI memory is held only in the app's memory for the duration of the game
session. It is never written to disk, never sent anywhere, and is gone as soon
as you start a new game or close the app.

## 3. Device access and security

Anyone who can unlock and use your device can use the app and see your settings
and stats. The app has no separate lock; if you want one, use your device's
screen lock.

## 4. Permissions

The app declares one permission, `android.permission.VIBRATE`. It is used solely
by the `Haptics` class, which uses Android's `Vibrator` or `VibratorManager` to
provide short haptic feedback on card flips, matches, mismatches, and wins.
`VIBRATE` is an install-time normal permission: it does not prompt you, and it
grants no access to personal data.

The app does not request `INTERNET`, `READ_CONTACTS`, `CAMERA`, `RECORD_AUDIO`,
`ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, or any storage permission.

The Android build tools may also add an internal, app-private permission named
`com.chalwk.recall.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` through the
standard AndroidX libraries. It is not a permission you are asked to grant, it
grants no access to your data or to any device feature, and other apps cannot
use it.

**Audio.** The app plays short tones using Android's `ToneGenerator` class from
the standard Android SDK. These are system-provided tones, not files bundled
with the app. The app does not read any audio files, does not record audio, and
does not request `RECORD_AUDIO`. No audio leaves your device.

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
AndroidX Activity and Lifecycle libraries, the AndroidX Compose UI toolkit,
Material 3, AndroidX DataStore Preferences, and kotlinx.coroutines (a
transitive dependency of DataStore). These are standard Android and Kotlin
parts, not external services, and they do not receive copies of your data.

Google Play, where you download the app, handles your download under its own
privacy policy. The app does not send it anything.

## 7. Backup, export, and data transfer

The app excludes all of its data from Android cloud backup, so Android's backup
system (for example, backup to your Google account) does not upload it.

The app's Android data-extraction rules for device-to-device transfer include
the app's file directory. Because DataStore Preferences are stored in that
directory (as `files/datastore/recall_settings.preferences_pb`), your settings
and stats will transfer to a new device on Android 12 and newer as part of the
standard device-to-device transfer. On Android 11 and older, nothing transfers.

The app has no export or import feature.

## 8. Children

The app can be used by children and adults. It contains no violence, no scary
content, and no advertising. The card faces are rendered as Unicode emoji from
the system font, depicting animals, foods, everyday objects, and symbols.
Because the app does not collect personal information from anyone, it does not
collect personal information from children. It includes no accounts and no
sharing features.

Parents and guardians can clear the app's data at any time from Android's
settings, as described in Section 9.

## 9. Your rights

Because the Developer holds no data about you, there is nothing to access,
correct, or delete on the Developer's side. You control everything stored on
your device.

You can reset your stats from the "Reset stats" button on the Settings screen.

When you uninstall the app, Android removes all of its data from your device
immediately. The app does not set `android:hasFragileUserData`, so the uninstall
flow does not offer to keep it. To remove the data without uninstalling, clear
the app's storage in Android's settings (Settings → Apps → Recall → Storage →
Clear storage; the exact wording and menu path vary slightly by Android
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

*This privacy policy forms part of the Recall End User Licence Agreement
(<https://chalwk.github.io/pages/policies/Recall/EULA/>).*
