---
layout: page
title: Privacy Policy - Dots & Boxes - Edge of Victory
permalink: /pages/policies/DotsAndBoxes/PRIVACY/
---

**Version 1.0 - Last updated: 5 November 2026**

This policy applies to Dots & Boxes - Edge of Victory, published by Jericho
Crosby (Chalwk) ("the Developer") on Google Play. The app is a turn-based
strategy game in which you connect dots to claim boxes on a grid.

## 1. Summary

**The app collects no personal information about anyone, and requests no Android
permissions at all.** There is no account system, no analytics, no advertising,
and no telemetry. The app does not open any network connection and does not
transmit anything off your device.

## 2. Data stored on your device

The app stores two kinds of data in its own private storage area, which Android
protects from other apps:

- **Your active game save**, as a single JSON file in the app's preferences
  store. This contains the current board state, players, moves, and elapsed time.
  It is cleared when the game ends or you return to the main menu.
- **Your settings, lifetime stats, and leaderboard**, in a preferences store
  called `dotsandboxes`. This contains: sound and volume, haptics, theme,
  palette, colorblind mode, assistance toggles (legal moves, warn giveaways,
  chains), show timer, keep screen awake, and visual effects. It also holds
  lifetime totals (games played, wins, boxes captured, best score, longest
  chain, time playing, daily streaks) and the best times for specific board
  sizes and difficulties.

None of this is sent anywhere by the app.

## 3. Device access and security

Anyone who can unlock and use your device can use the app and see your save,
stats, and leaderboard. The app has no separate lock; if you want one, use your
device's screen lock.

## 4. Permissions

The app declares no Android permissions, including `RECORD_AUDIO`. All sound
effects and music are synthesized on the device at runtime using Android's
`AudioTrack`. The app does not read any audio files or record audio, and no
audio leaves your device. Haptic feedback is provided via the standard Android
View system and does not require the `VIBRATE` permission.

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
kotlinx.coroutines. These are standard Android and Kotlin parts, not external
services, and they do not receive copies of your data.

Google Play, where you download the app, handles your download under its own
privacy policy. The app does not send it anything.

## 7. Backup, export, and data transfer

The app excludes all of its data from Android cloud backup, so Android's backup
system (for example, backup to your Google account) does not upload it.

The app's Android data-extraction rules for device-to-device transfer include
only the app's file directory. Because DataStore Preferences are stored in that
directory, your settings, stats, and active save will transfer to a new device
on Android 12 and newer as part of the standard device-to-device transfer. On
Android 11 and older, nothing transfers.

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

You can reset your stats from the Statistics screen.

When you uninstall the app, Android removes all of its data from your device
immediately. The app does not set `android:hasFragileUserData`, so the uninstall
flow does not offer to keep it. To remove the data without uninstalling, clear
the app's storage in Android's settings (Settings → Apps → Dots & Boxes → Storage
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

*This privacy policy forms part of the Dots & Boxes - Edge of Victory End User
Licence Agreement (<https://chalwk.github.io/pages/policies/DotsAndBoxes/EULA/>).*