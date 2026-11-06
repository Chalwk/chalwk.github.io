---
layout: page
title: Privacy Policy - PocketTools
permalink: /pages/policies/PocketTools/PRIVACY/
---

**Version 1.0 - Last updated: 3 November 2026**

This policy applies to PocketTools, published by Jericho Crosby (Chalwk) ("the
Developer") on Google Play. The app is a collection of small everyday utilities:
a date calculator, a list alphabetizer, and a password generator.

## 1. Summary

**The app collects no personal information about anyone, and requests no Android
permissions at all.** There is no account system, no analytics, no advertising,
and no telemetry. The app does not open any network connection and does not
transmit anything off your device.

**The app does not write any user data to persistent storage.** Everything you
type or generate stays in memory while the app is open and is gone as soon as
the app closes.

## 2. Data stored on your device

There is no account, no profile, no save file, and no settings database.

The app uses Android's standard `rememberSaveable` mechanism to preserve
on-screen state across configuration changes such as rotating the device or
changing the system dark-mode setting. This state includes the text you have
typed into the List Alphabetizer and the password currently shown by the
Password Generator. Android's saved-state mechanism may write this state to
storage temporarily. It is not persistent: it is cleared when the app's process
ends, and the Developer has no access to it.

The app reads `eff_large_wordlist.txt` from its own bundled assets when you use
the passphrase mode of the Password Generator. This file is part of the app, is
never modified, and is not user data.

**Password Generator.** Passwords are created entirely on your device and are
never transmitted anywhere.

- **Generated passwords are not saved.** The password currently shown is held
  only in memory.
- **The recent-passwords list is session-only.** It holds the last few passwords
  you generated during the current app session. It is cleared when the app's
  process ends, and it is not written to any file or database.
- **The Copy button writes to the system clipboard.** Once a password is on the
  clipboard, any other app with clipboard access can read it, and on Android 12
  and older the clipboard is not visible to you when another app reads it.
  Android 13 and newer show a system clipboard preview and clear the clipboard
  automatically after a short time, but this is not a guarantee on older
  versions. Clear the clipboard after pasting your password into the destination
  app, and do not leave a password on it.
- **The app does not save passwords to any password manager.** If you want
  long-term password storage, use a dedicated password manager.

**List Alphabetizer.** Whatever text you paste in is processed entirely on your
device. It is not transmitted anywhere and is not written to any file. If you
paste sensitive information (for example, a list of names, addresses, or email
addresses), it exists in the app's memory only while the app is open.

## 3. Device access and security

The app has no separate lock, and nothing it holds survives after it closes.
While the app is open, anyone who can use your unlocked device can see what is
on screen. If you want a lock, use your device's screen lock.

## 4. Permissions

The app declares no Android permissions. It does not request any of the
sensitive permissions such as `INTERNET`, `READ_CONTACTS`, `CAMERA`,
`RECORD_AUDIO`, or any storage permission, and it does not request any
install-time normal permissions either.

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
AndroidX Activity and Lifecycle libraries, the AndroidX Compose UI toolkit, and
Material 3. These are standard Android and Kotlin parts, not external services,
and they do not receive copies of your data.

Google Play, where you download the app, handles your download under its own
privacy policy. The app does not send it anything.

## 7. Backup, export, and data transfer

The app's Android backup and data-extraction rules exclude every storage domain,
so no app data is uploaded to Android's cloud backup system and none is included
in device-to-device transfer. Since the app does not persist any user data
anyway, this is a belt-and-braces measure.

The app has no export or import feature.

## 8. Children

The app can be used by children and adults. Because the app does not collect
personal information from anyone, it does not collect personal information from
children. It includes no advertising, no accounts, and no sharing features.

Parents and guardians can close the app at any time; nothing is saved.

## 9. Your rights

Because the Developer holds no data about you, there is nothing to access,
correct, or delete on the Developer's side. You control everything in the app's
memory.

To discard it immediately, close the app fully (swipe it out of the recent-apps
switcher) or force-stop it from Android's settings. On some devices, locking the
screen and waiting for the system to reclaim the app's memory will also discard
it. No copy of your data exists anywhere else, so deletion is immediate and
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

*This privacy policy forms part of the PocketTools End User Licence Agreement
(<https://chalwk.github.io/pages/policies/PocketTools/EULA/>).*
