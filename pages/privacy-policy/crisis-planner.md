---
layout: page
title: Crisis Planner Privacy Policy
permalink: /pages/privacy-policy/crisis-planner/
---

<!-- Copyright (c) 2026 Jericho Crosby (Chalwk). All rights reserved. -->

**Crisis Planner** is a personal crisis-planning app for Android, built for
people in New Zealand. This policy explains exactly what the app does and
does not do with your information, and which regions its built-in crisis
resources are intended to serve. It applies to anyone who installs and uses
the app.

<div class="privacy-callout">
<strong>Short version:</strong> Crisis Planner does not collect, transmit, or
share any personal information. Everything you enter, including your crisis
plan, contacts, safety information, address, mood check-ins, and archived
episodes, is stored only on your device and never leaves it unless you
deliberately export it.
</div>

<div class="privacy-callout privacy-callout-nz">
<strong>Designed for New Zealand.</strong> The crisis resources built into
Crisis Planner, including emergency services on <strong>111</strong>, the
Need to Talk helpline on <strong>1737</strong>, the Suicide Crisis Helpline
on <strong>0508 828 865</strong>, and the regional crisis lines and
specialist helplines in the Resources tab, are all New Zealand services. The
app also explains the NZ emergency text service on 111 (registration
required), but that is still an NZ service. These numbers will not work
outside New Zealand, and dialing <strong>111</strong> in other countries will
not reach emergency services there. If you are outside New Zealand, please
use your country's own emergency number and local crisis services. See
<a href="#where-the-app-is-intended-to-be-used">Where the app is intended to
be used</a> below.
</div>

| Detail              | Value                                               |
| ------------------- | --------------------------------------------------- |
| **App**             | Crisis Planner (Android)                            |
| **Package**         | `com.chalwk.crisisplanner`                          |
| **Developer**       | Jericho Crosby (Chalwk)                             |
| **Intended region** | New Zealand (built-in crisis resources are NZ-only) |
| **Effective date**  | 23 October 2026                                     |
| **Last updated**    | 23 October 2026                                     |

---

## Why this policy exists

The content you put into a crisis-planning app is inherently sensitive:
mental health information, emergency contacts, medical notes, and, if you
choose to add it, your home address. The app has been designed so that
**no one, including the developer, can see any of it**. This page sets that
out in detail, because a privacy claim is only meaningful if you can check
it.

## Where the app is intended to be used

Crisis Planner is built specifically for people in New Zealand. The crisis
resources it surfaces are New Zealand services:

- emergency services on **111**;
- the Need to Talk helpline on **1737** (free, 24/7 counselling);
- the Suicide Crisis Helpline on **0508 828 865**;
- Lifeline, Healthline, and the regional crisis lines and specialist
  helplines listed in the app's Resources tab.

These numbers do not work outside New Zealand, and the equivalent numbers in
other countries are different. Dialing 111 in Australia, the United States,
the United Kingdom, most of Europe, or anywhere else outside New Zealand
will not connect you to emergency services. The app does not include, and
cannot be used as a substitute for, crisis resources in any country other
than New Zealand.

The app will show an in-app warning banner if your device region is not New
Zealand, pointing out that the built-in numbers will not work locally. The
banner is a heuristic, based on your device's default locale. It is a
reminder, not a guarantee.

The personal side of the app, including your crisis plan, contacts, safety
information, address, and mood history, can be used anywhere. But if you are
outside New Zealand, you will need to ignore the built-in crisis numbers and
use the appropriate services for your location instead.

If you are in New Zealand and in immediate danger, call **111**. If you
cannot speak, New Zealand's emergency text service on 111 is available for
Deaf, hard-of-hearing, and speech-impaired users who have registered in
advance with Police.

## Information we collect

**None.** The app does not collect any personal data.

Specifically, the app:

- does **not** require or offer an account, sign-in, or user profile;
- does **not** send any information to any server, including servers operated
  by the developer;
- does **not** include analytics, crash reporting, advertising, or tracking
  SDKs of any kind;
- does **not** access your location, camera, microphone, contacts list, photos,
  or files unless you explicitly select a file to import;
- does **not** request any Android runtime permissions. The only permissions
  the app declares are `USE_BIOMETRIC` and `USE_FINGERPRINT`. Both are
  install-time normal permissions: they never prompt you, they grant no
  access to your data, and they are only referenced when the optional
  biometric lock is on. No other Android permissions are requested.

The optional screen-hiding feature (`FLAG_SECURE`) does not require any
permission. It only tells Android to blank the app's content in the recents
screen and to block screenshots. It does not enable the app to read anything
it could not already read.

## Information stored on your device

Everything you create in the app is stored locally in the app's private
storage area, which other apps cannot read. This includes:

- the steps you have recorded in your crisis plan, across all levels;
- emergency contacts you add (name, phone number, relationship, an optional
  pre-written text message you choose to attach to them, and an optional
  plan level telling the handover summary when to show the contact);
- safety information you choose to record, including GP or support-worker
  notes, diagnoses, medications, allergies, NHI number, means-restriction
  notes, reasons for living, **your address, and a "how to help me" note**;
- notes about what is happening right now, when you use that section;
- your mood check-in history, including the optional tags and notes you
  attach to each check-in;
- **archived episodes**. When you tap "Start new episode", the currently
  recorded steps and notes are copied into a past episode so the handover
  for the next one starts clean;
- your display settings (theme, text size, whether the optional
  biometric lock is on, and whether the optional screen-hiding feature is
  on);
- your name, if you choose to enter it.

This data is used **only** to display the plan back to you inside the app and
to generate the handover summary, plan view, pocket card, or can't-speak
script that you ask for.

## Optional biometric lock

Crisis Planner offers an optional biometric lock, off by default. When it is
on, opening the app asks Android to confirm your fingerprint, face, or
device lock-screen credential before your plan is shown. The lock re-engages
any time the app has been in the background, so briefly leaving the app and
coming back is enough to require a new check.

The check is handled entirely by the Android system on your device, through
the platform's standard biometric prompt. The app never sees, receives,
stores, or transmits your biometric data. There is no fingerprint image, no
template, no pattern, and no PIN recorded by the app. The app only learns
whether the system said "yes" or "no" to a particular unlock attempt, and
that result is not logged, saved, or sent anywhere. Nothing about your
authentication is attached to your plan, your contacts, or your mood history.

You can turn the lock on or off at any time from **Settings**. Turning it on
first checks that your device can actually authenticate you (a fingerprint,
face, or screen lock is enrolled) and refuses with an inline message if it
cannot, so the lock cannot be enabled in a state where you would be unable
to get back in.

The biometric lock is an extra layer on top of the protections already
described in this policy. It does not change what data the app stores, where
it stores it, or whether that data ever leaves the device. Those answers
remain the same whether the lock is on or off.

## Optional screen hiding

Crisis Planner offers an optional "Hide in recents" setting, off by default.
When on, it applies Android's `FLAG_SECURE` to the app's window. This:

- blanks the app's content in the recent-apps switcher;
- blocks screenshots and screen recording of the app.

It does not stop someone who has already unlocked your phone from opening
the app. It only reduces the chance of your plan showing up in a screenshot
or on the recents screen. It also does not add any permissions and does not
change what the app stores.

## Android backup and device transfer

The app explicitly opts out of Android's cloud backup. Your plan, contacts,
safety information, address, and mood history are **not** uploaded to
Google's servers as part of Android Backup, and they are **not** included in
any automatic cloud sync.

Android's *device-to-device transfer*, the flow used when you set up a new
phone, is permitted, so that you can move your plan to a new device without
retyping it. That transfer goes directly between your two devices and does
not pass through any server controlled by the developer.

## Sharing and external actions

We do not share any information. There is nothing to share, because the app
never transmits data off your device.

The app provides features that can deliberately expose information when *you*
choose to use them:

| Feature                                | What happens                                                                                                                                                                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Call a number (hotlines, contacts)** | The app opens your phone's dialer with the number pre-filled. The app does not place the call and does not see whether you complete it. The built-in crisis numbers are New Zealand services only and do not work elsewhere. |
| **Text a contact**                     | The app opens your messaging app with the number and, if you have one, your pre-written message pre-filled. Nothing is sent until you press send inside your messaging app.                                                  |
| **Show the can't-speak script**        | The app shows a full-screen card with the script text, your address, and your how-to-help note. It does not send anything. It is for you to show to someone in the room.                                                     |
| **Share or copy the handover summary** | Only when you tap Share or Copy. What you share, and with whom, is entirely your choice.                                                                                                                                     |
| **Export plan as JSON**                | Only when you choose Export and dismiss the warning that the file is unencrypted. You pick where the file goes using Android's standard file picker. The file contains the plan data in plain text, so store it accordingly. |
| **Import plan from JSON**              | Only when you choose Import and select a file. The app reads that file, and nothing else.                                                                                                                                    |
{: .rules-table}

In every case above, the action is initiated by you. The developer receives
no notification, copy, or log of any of these actions.

## Third-party services

The app does not use any third-party services. It contains no advertising
networks, no analytics providers, no crash reporting services, no
social-media integrations, and no other SDKs that would process your data.

The only third parties involved are the standard Android system components,
specifically your dialer, your messaging app, the system file picker, the
share sheet, the system biometric prompt, and the OS-level window flags that
provide `FLAG_SECURE`. These are standard Android parts, not external
services, and they do not receive copies of your data.

## Data retention and deletion

Because all data is stored locally on your device, you are in full control of
it:

- you can edit or delete individual plan items, contacts, and notes inside
  the app at any time;
- you can archive the current episode from the Plan screen, or delete a past
  episode from the Past episodes section;
- you can clear all plan data from the **Settings** dialog, or reset only
  the "what's happening right now" section from the **Now** screen;
- you can turn the optional biometric lock and the optional screen-hiding
  setting off from **Settings**;
- uninstalling the app removes all of its data from your device;
- you can also clear the app's storage from **Settings &rarr; Apps &rarr;
  Crisis Planner &rarr; Storage &rarr; Clear storage** (the exact wording
  and menu path vary slightly by Android version).

No copy of your data exists anywhere else, so deletion is immediate and
complete.

## Children's privacy

The app is not directed at children. It is a personal crisis-planning tool,
written for adults and for people old enough to be managing their own mental
health. It does not knowingly collect personal information from anyone,
including children, because it does not collect personal information at all.
Some of the crisis resources it lists are for young people (What's Up and
Youthline), but that does not make the app itself a service for children.

If you are a parent or guardian and believe a child has used the app to
record crisis information, you can clear the app's data at any time from the
device settings as described above.

## Security

Because the app never transmits data off the device, the main security
boundary is your device itself: your screen lock, your device encryption, and
Android's app sandboxing (which prevents other apps from reading Crisis
Planner's private storage) are what protect your plan.

The optional biometric lock adds a further layer: it prevents someone who has
picked up your unlocked phone from opening Crisis Planner and reading your
plan, contacts, address, or safety information. Because the check is
performed by the Android system and nothing about it is recorded by the app,
turning the lock on does not create any new place where your information, or
any hint of it, is stored.

The optional screen-hiding setting reduces the risk of your plan appearing in
a screenshot or on the recents screen. It does not replace the lock, and it
is off by default.

The app does **not** currently encrypt its local storage beyond the
protection Android's app sandbox already provides. If you want
defence-in-depth, keep your device's screen lock on and keep device
encryption on (which is the default on modern Android).

Please keep those protections in place. If you share your handover summary by
text or email, or export your plan to a file, remember that the content is no
longer protected by the app. Exported files are plain text JSON and are not
encrypted.

## Medical disclaimer

**Crisis Planner is a personal planning tool, not a medical device.** It is
not a substitute for professional mental-health care, diagnosis, or treatment.
It does not monitor you, does not detect a crisis, and does not contact
anyone on your behalf.

If you are in New Zealand and in immediate danger, call **111**. If you need
to talk to someone now, call or text **1737** (free, 24/7) or call the
Suicide Crisis Helpline on **0508 828 865**. These numbers are New Zealand
services only. See "Where the app is intended to be used" above. If you are
outside New Zealand, use your country's own emergency number and local
crisis services instead.

## Changes to this policy

If the app's data practices ever change, for example if a future version
adds an optional feature that transmits data, or adds crisis resources for
another region, this policy will be updated before that version is
published, and the "Last updated" date at the top of this page will change.
The current version of this policy is always available at the URL you are
reading now, and a link to it is also provided inside the app.

## Contact

Questions about this policy, or about how Crisis Planner handles your
information, can be sent to <{{ site.links.Email }}>.

Because the app collects no personal data, most questions can be answered
directly from the sections above.

---

*This policy applies to the Crisis Planner Android app. This page is a static
document and does not itself set cookies, run scripts, or use analytics.*

<style>
.privacy-callout {
    background: rgba(30, 136, 229, 0.08);
    border-left: 4px solid var(--primary);
    padding: 1rem 1.25rem;
    border-radius: var(--radius);
    margin: 1.5rem 0;
    font-size: 1.02rem;
    line-height: 1.55;
}

.privacy-callout strong {
    color: var(--darker);
}

.privacy-callout-nz {
    background: rgba(217, 119, 6, 0.10);
    border-left: 4px solid #D97706;
}

.privacy-callout-nz strong {
    color: #92400E;
}

.privacy-callout a {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 2px;
}
</style>