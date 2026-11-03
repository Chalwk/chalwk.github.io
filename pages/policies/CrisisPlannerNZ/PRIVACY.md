---
layout: page
title: Privacy Policy - CrisisPlannerNZ
permalink: /pages/policies/CrisisPlannerNZ/PRIVACY/
---

**Version 1.0 - Last updated: 3 November 2026**

This policy applies to CrisisPlannerNZ, published by Jericho Crosby (Chalwk)
("the Developer") on Google Play. The app is a personal crisis-planning app for
Android, built for people in New Zealand.

## 1. Summary

**The app collects no personal information about anyone.** There is no account
system, no analytics, no advertising, and no telemetry. The app does not
transmit anything you enter off your device. Everything you enter, including
your crisis plan, contacts, safety information, address, mood check-ins, and
archived episodes, is stored only on your device and never leaves it unless you
deliberately export or share it.

**Designed for New Zealand.** The built-in crisis resources, including emergency
services on **111**, the Need to Talk helpline on **1737**, the Suicide Crisis
Helpline on **0508 828 865**, and the regional and specialist helplines in the
Resources tab, are New Zealand services. They will not work outside New Zealand,
and dialing **111** in other countries will not reach emergency services there.
If you are outside New Zealand, use your country's own emergency number and
local crisis services. The app may show an in-app warning banner if your device
region is not New Zealand; that banner is a heuristic based on your device's
default locale, not a guarantee.

**Not a medical device.** The app is a personal planning tool, not a substitute
for professional mental-health care, diagnosis, or treatment. It does not
monitor you, does not detect a crisis, and does not contact anyone on your
behalf.

If you are in New Zealand and in immediate danger, call **111**. If you cannot
speak, New Zealand's emergency text service on 111 is available for Deaf,
hard-of-hearing, and speech-impaired users who have registered in advance with
Police.

## 2. Data stored on your device

The app stores the following in its own private storage area, which Android
protects from other apps:

- **Crisis plan steps** you have recorded, across all levels.
- **Emergency contacts** you add (name, phone number, relationship, an optional
  pre-written text message you choose to attach, and an optional plan level
  telling the handover summary when to show the contact).
- **Safety information** you choose to record, including GP or support-worker
  notes, diagnoses, medications, allergies, NHI number, means-restriction notes,
  reasons for living, your address, a "how to help me" note, and the editable
  headline and message shown on the can't-speak card.
- **Notes** about what is happening right now, when you use that section.
- **Your mood check-in history**, including the optional tags and notes you
  attach to each check-in.
- **Archived episodes**. When you tap "Start new episode", the currently
  recorded steps and notes are copied into a past episode so the handover for
  the next one starts clean.
- **Your settings** (theme, text size, high contrast, whether the optional
  biometric lock is on, whether the optional screen-hiding feature is on, and
  feature toggles).
- **Your name**, if you choose to enter it.

None of this is sent anywhere by the app. It is used only to display the plan
back to you inside the app and to generate the handover summary, plan view,
pocket card, or can't-speak script that you ask for.

## 3. Device access and security

Anyone who can unlock and use your device can use the app and see this
information, unless you turn on the optional biometric lock. The biometric lock,
which is off by default, asks Android to confirm your fingerprint, face, or
device lock-screen credential before your plan is shown. The check is handled
entirely by the Android system. The app never sees, receives, stores, or
transmits your biometric data. It only learns whether the system said "yes" or
"no" to a particular unlock attempt, and that result is not logged, saved, or
sent anywhere.

The optional "Hide in recents" setting, also off by default, applies Android's
`FLAG_SECURE` to blank the app's content in the recent-apps switcher and to
block screenshots and screen recording. It does not stop someone who has already
unlocked your phone from opening the app.

The app does not currently encrypt its local storage beyond the protection
Android's app sandbox already provides. If you want defence-in-depth, keep your
device's screen lock on and keep device encryption on, which is the default on
modern Android.

## 4. Permissions

The only permissions the app declares are `USE_BIOMETRIC` and `USE_FINGERPRINT`.
Both are install-time normal permissions: they never prompt you, they grant no
access to your data, and they are only referenced when the optional biometric
lock is on. No other Android permissions are requested. The optional
screen-hiding feature does not require any permission.

## 5. Network activity

The app does not request any network permission and does not open any network
connection. It does not contact any server operated by the Developer, send crash
reports, diagnostics, or usage data, or download updates, remote configuration,
or advertising. It never updates itself; updates come through Google Play.

Some features deliberately hand off to other apps on your device. Calling a
number opens your phone's dialer with the number pre-filled; the app does not
place the call and does not see whether you complete it. Texting a contact opens
your messaging app with the number and, if you have one, your pre-written
message pre-filled; nothing is sent until you press send inside your messaging
app. Sharing or copying the handover summary uses Android's share sheet or
clipboard. Exporting and importing use Android's standard file picker. The app
does not receive copies of what those other apps do. Those apps may make their
own network connections under their own privacy practices.

Showing the can't-speak script displays a full-screen card on your device with
your custom headline and message, your address, and your how-to-help note.
Nothing is sent; it is for you to show to someone in the room.

The Settings dialog has a link to this policy. It opens in your web browser,
which makes its own network connection. The app itself does not.

## 6. Third-party services

The app uses no analytics, advertising, or tracking services, no crash reporting
services, no social-media integrations, and no other SDKs that would process
your data. The only third parties involved are standard Android system
components: your dialer, your messaging app, the system file picker, the share
sheet, the system biometric prompt, and the OS-level window flags that provide
`FLAG_SECURE`. These are standard Android parts, not external services, and they
do not receive copies of your data.

Google Play, where you download the app, handles your download under its own
privacy policy. The app does not send it anything.

## 7. Backup, export, and data transfer

The app excludes all of its data from Android cloud backup, so Android's backup
system (for example, backup to your Google account) does not upload it.

The app's Android data-extraction rules for device-to-device transfer currently
include only the app's file directory. The plan, contacts, safety information,
mood history, archived episodes, and settings are stored in Android's
shared-preferences storage, which those rules do not include, so that flow does
not move your plan. Use the app's **Export** and **Import** features to move
your setup to a new device.

The **Export** feature saves your setup to a JSON file in a location you choose,
after you dismiss a warning that the file is unencrypted. That file contains
your plan, contacts, safety information, mood history, archived episodes, and
settings in plain text. If you save it to a cloud-synced folder, send it to
someone, or store it somewhere shared, it is then handled by that service or
person, not by this app. Treat the file as personal. The **Import** feature
reads only the file you select.

If you share or copy the handover summary, what you share and with whom is
entirely your choice. Once shared, it is handled by the app or service you
shared it with, not by this app.

## 8. Children

The app can be used by children and adults. Because the app does not collect
personal information from anyone, it does not collect personal information from
children. It includes no advertising, no accounts, and no automatic sharing
features.

Parents, carers, and teachers should be aware of the export behaviour described
in Section 7 if they set up the app for a child. Parents and guardians can clear
the app's data at any time from Android's settings, as described in Section 9.

## 9. Your rights

Because the Developer holds no data about you, there is nothing to access,
correct, or delete on the Developer's side. You control everything stored on
your device.

When you uninstall the app, Android removes its data from your device. The the
uninstall flow on some Android versions may offer to keep the app's data; if you
accept, it stays on your device (and comes back if you reinstall the app) until
you delete it. To remove it for good, choose to delete the data when
uninstalling, or clear the app's storage in Android's settings (Settings → Apps
→ CrisisPlannerNZ → Storage → Clear storage; the exact wording and menu path
vary slightly by Android version).

Files you have exported are separate copies, which you must delete yourself.
Apart from those, no copy of your data exists anywhere else, so deletion is
immediate and complete.

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

*This privacy policy forms part of the CrisisPlannerNZ End User Licence
Agreement (<https://chalwk.github.io/pages/policies/CrisisPlannerNZ/EULA/>).*