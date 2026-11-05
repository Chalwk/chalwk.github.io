---
layout: page
title: Privacy Policy - PaletteLedger
permalink: /pages/policies/PaletteLedger/PRIVACY/
---

**Version 1.0 - Last updated: 5 November 2026**

This policy applies to PaletteLedger, published by Jericho Crosby (Chalwk)
("the Developer") on Google Play. The app is a commission tracking and
invoicing application for artists.

## 1. Summary

**The app collects no personal information about anyone.** There is no account
system, no analytics, no advertising, and no telemetry. The app does not
transmit anything you enter off your device. Everything you enter, including
your commissions, receipts, payments, and business profile, is stored only on
your device and never leaves it unless you deliberately export or share it.

## 2. Data stored on your device

The app stores the following in its own private storage area, which Android
protects from other apps:

- **Your business profile**, including your artist name, business name, email,
  phone, address, and tax numbers.
- **Your commissions**, including titles, clients, material lists, costs, and
  notes.
- **Your shopping list**, receipts, and payment records.
- **Your app settings**, including theme preferences and security settings
  (like whether the biometric lock is enabled). These are stored in a local JSON
  file (`paletteledger.json`).

None of this is sent anywhere by the app. It is used only to display your
financial overview and generate invoices.

## 3. Device access and security

Anyone who can unlock and use your device can use the app and see this
information, unless you turn on the optional biometric lock. The biometric lock,
which is off by default, asks Android to confirm your fingerprint, face, or
device lock-screen credential before your data is shown.

The app never sees, receives, stores, or transmits your biometric data. It only
learns whether the system said "yes" or "no" to an unlock attempt, and that
result is not logged, saved, or sent anywhere.

## 4. Permissions

The only permission the app declares is `USE_BIOMETRIC`. This is an install-time
normal permission used solely to support the biometric lock feature.

The app declares a standard Android `FileProvider` to manage the safe sharing of
generated invoices. This does not grant the app access to your files; it simply
allows the app to hand a specific file you have chosen to share (like a PDF
invoice) to another app (like your email client) safely.

## 5. Network activity

The app does not request any network permission and does not open any network
connection. It does not contact any server operated by the Developer, send
crash reports, diagnostics, or usage data, or download updates, remote
configuration, or advertising.

When you choose to share an invoice, the app uses Android's standard sharing
mechanism. The app does not receive copies of what those other apps do. Those
apps may make their own network connections under their own privacy practices.

## 6. Third-party services

The app uses no analytics, advertising, or tracking services, no crash reporting
services, no social-media integrations, and no other SDKs that would process
your data. The only third parties involved are standard Android system
components: Android DataStore for local storage, the biometric prompt, and the
system share sheet.

## 7. Backup, export, and data transfer

The app excludes all of its data from Android cloud backup, so Android's backup
system (for example, backup to your Google account) does not upload it.

When you set up a new phone using Android's standard device-to-device transfer,
the app's data can move with you on Android 12 and newer. On Android 11 and
older, the app's data is not included in that transfer, so use **Export** and
**Import** to move your setup.

The **Export** feature saves your data to a JSON file in a location you choose.
If you save it to a cloud-synced folder, send it to someone, or store it
somewhere shared, it is then handled by that service or person, not by this app.
The **Import** feature reads only the file you select.

When you share an invoice (as PDF, CSV, or text), the file is temporarily
written to the app's cache directory and handed to the system share sheet. The
app does not retain the shared files.

## 8. Children

The app can be used by children and adults. Because the app does not collect
personal information from anyone, it does not collect personal information from
children.

## 9. Your rights

Because the Developer holds no data about you, there is nothing to access,
correct, or delete on the Developer's side. You control everything stored on
your device.

When you uninstall the app, Android removes its data from your device. The app
declares `hasFragileUserData="true"`, so the Android uninstall flow will
explicitly ask if you want to keep the app's data. If you choose to keep it, the
data stays on your device (and comes back if you reinstall the app) until you
delete it. To remove it for good, choose to delete the data when uninstalling,
or clear the app's storage in Android's settings.

Inside the app, you can reset everything from the Settings dialog.

## 10. Changes to this policy

If this policy changes, the "Last updated" date at the top will change. Earlier
versions are available on request from the contact below.

## 11. Contact

Questions about privacy can be sent to Jericho Crosby (Chalwk):

- Email: chalwk.dev@gmail.com
- Discord: chalwk

---

*This privacy policy forms part of the PaletteLedger End User Licence Agreement
(<https://chalwk.github.io/pages/policies/PaletteLedger/EULA/>).*