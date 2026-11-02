---
layout: page
title: Privacy Policy - PooDiction
permalink: /pages/policies/PooDiction/PRIVACY/
---

**Last updated: 3 November 2026**

This policy applies to PooDiction, published by Jericho Crosby (Chalwk)
("the Developer") on Google Play. The app is a personal bowel-movement and
health-tracking tool with an on-device prediction engine.

## Summary

**The app collects no personal information about anyone.**
There is no account system, no analytics, no advertising, and no telemetry. The
app does not transmit anything you enter off your device. Everything you enter,
including your bowel-movement entries, notes, product usage, inventory, supply
checklist, orders, locations, and settings, is stored only on your device and
never leaves it unless you deliberately export or share it.

Because the app tracks health information, treat everything you enter as
personal and sensitive. The app does not send it anywhere.

**Not a medical device.** The prediction engine produces statistical estimates
from your own history; it is not medical advice, diagnosis, or treatment, and
it should not be relied upon to make medical decisions.

## Data stored on your device

The app stores the following in its own private storage area, which Android
protects from other apps. Most of it lives in a single JSON file
(`poodiction.json`) in the app's private files directory; your settings live in
a preferences store.

- **Bowel-movement entries**: date, time, Bristol type (1–7), notes, product
  worn, event kind (intentional, accidental, partial, unspecified), output kind
  (stool, urine, both, unspecified), precursor awareness, whether leakage
  occurred, and an optional location tag.
- **Products** you've added, edited, or retired, including name, capacity, type,
  supplier, price, pack size, URL, image filename, notes, and retired flag.
- **Inventory counts** per product, the **hygiene bag checklist**, **order
  history**, and **washable rotation** counts for washable products.
- **Locations** you've added, with their bathroom flags and notes.
- **Your settings**: theme, whether the prediction notification is on and at
  what lead time, and whether the app-lock is on and with what grace period.
- **The prediction model's learned state**, which is recalculated in memory
  from your entries on each launch. It is derived from your data, so treat it
  as personal.

None of this is sent anywhere by the app. When you uninstall the app, Android
removes its data from your device. Because the app sets
`android:hasFragileUserData="true"`, the uninstall flow on some Android
versions may offer to keep the app's data; if you accept, it stays on your
device until you delete it. To remove it before then, clear the app's storage
in Android's settings (Settings → Apps → PooDiction → Storage → Clear
storage; the exact wording and menu path vary slightly by Android version).

Anyone who can unlock and use your device can use the app and see this
information, unless you turn on the optional app lock. The app lock, which is
off by default, asks Android to confirm your fingerprint, face, or device
lock-screen credential before your entries are shown. The check is handled
entirely by the Android system. The app never sees, receives, stores, or
transmits your biometric data. It only learns whether the system said "yes" or
"no" to a particular unlock attempt, and that result is not logged, saved, or
sent anywhere. After unlocking, the app stays open for the grace period you
choose in Settings (immediately, 30 seconds, 1 minute, or 5 minutes) before it
asks again.

The permissions the app declares are:

- `POST_NOTIFICATIONS` — used only to show the optional prediction notification.
- `USE_BIOMETRIC` and `USE_FINGERPRINT` — install-time normal permissions, used
  only when the optional app lock is on. They never prompt you and grant no
  access to your data.

No other Android permissions are requested. In particular, the app does **not**
declare `android.permission.INTERNET`, `ACCESS_FINE_LOCATION`,
`ACCESS_COARSE_LOCATION`, `CAMERA`, `RECORD_AUDIO`, `READ_CONTACTS`, or any
storage permission.

The app does not currently encrypt its local storage beyond the protection
Android's app sandbox already provides. If you want defence-in-depth, keep your
device's screen lock on and keep device encryption on, which is the default on
modern Android.

## Network activity

The app does not request any network permission and does not open any network
connection. It does not contact any server operated by the Developer. It does
not send crash reports, diagnostics, or usage data. It does not download
updates, remote configuration, or advertising. It never updates itself.
Updates come through Google Play.

Some features deliberately hand off to other apps on your device. Tapping a
product's "Open product page" button opens the product URL in your browser;
the app does not receive copies of anything your browser does. Exporting and
importing use Android's standard file picker. The app does not receive copies
of what those other apps do. Those apps may make their own network connections
under their own privacy practices.

The Settings dialog has a link to this policy and the End User Licence
Agreement. They open in your web browser, which makes its own network
connection. The app itself does not.

## Optional prediction notifications

If you turn on the prediction notification, the app schedules a background job
through Android's WorkManager that runs approximately every 15 minutes. Each
run re-computes the model from your entries, decides whether the probability of
a bowel movement starting within the lead time you chose has crossed a
threshold, and, if so, posts one quiet notification. The job runs entirely on
your device and does not require any network connection. The app does not share
your data with WorkManager or with any third party; WorkManager only triggers
the check.

The notification itself contains only a short summary such as "Movement
possible" and a rough probability. It is posted at low importance with no
sound. Whether it shows on your lock screen depends on your Android
notification settings; if you want to hide it, turn off "Show on lock screen"
for PooDiction in Android settings, or turn the notification off in the app's
Settings.

Only one notification is posted per episode: after a notification fires, the
app records the current newest entry ID and will not fire again for the same
entry. Logging a new entry resets that state.

## Third-party services

The app uses no analytics, advertising, or tracking services. It uses no crash
reporting services, social-media integrations, or other SDKs that would process
your data. The only third parties involved are standard Android system
components: Android's notification system, its biometric prompt, its system
file picker, its browser intent, and WorkManager. These are standard Android
parts, not external services, and they do not receive copies of your data.

Google Play, where you download the app, handles your download under its own
privacy policy. The app does not send it anything.

## Backup, export, and data transfer

The app excludes all of its data from Android cloud backup, so Android's backup
system (for example, backup to your Google account) does not upload it.

The app's Android data-extraction rules for device-to-device transfer include
only the app's file directory. That covers `poodiction.json` (which holds your
entries, products, inventory, supplies, orders, washables, and locations) and
any imported images. Your app settings (theme, notification options, app-lock
options) live in the preferences store, which those rules do not include, so
those settings do not transfer that way. On a new device you may need to set
them again.

The **Export** feature saves your setup to a JSON file in a location you choose.
That file contains your entries, products, inventory, supplies, orders,
washables, locations, and (in the exported payload) the current theme. If you
save it to a cloud-synced folder, send it to someone, or store it somewhere
shared, it is then handled by that service or person, not by this app. Treat
the file as personal health information. The **Import** feature reads only the
file you select.

Exported files are plain text JSON and are not encrypted.

## Children

The app is not directed at children. It is a personal health-tracking tool for
adults and for people old enough to be managing their own health. Because it
does not collect personal information from anyone, it does not collect personal
information from children. It includes no advertising, no accounts, and no
automatic sharing features. Parents, carers, and guardians can clear the app's
data at any time from Android's settings as described above.

## Your rights

Because the Developer holds no data about you, there is nothing to access,
correct, or delete on the Developer's side. You control everything stored on
your device. You can edit or delete individual entries, products, orders,
washables, and locations inside the app; clear the checklist; turn the
notification and app lock off; reset all app data to defaults from the
Settings dialog; clear the app's storage in Android's settings; or uninstall
the app. No copy of your data exists anywhere else, so deletion is immediate
and complete. If you have a privacy question, or believe privacy law gives you
rights that apply here (for example under the New Zealand Privacy Act 2020),
please get in touch using the contact below.

## Changes to this policy

If this policy changes, the "Last updated" date at the top will change. Earlier
versions are available on request from the contact below.

## Contact

Questions about privacy: **chalwk.dev@gmail.com**

---

*This privacy policy forms part of the PooDiction End User Licence Agreement
(<https://chalwk.github.io/pages/policies/PooDiction/EULA/>).*