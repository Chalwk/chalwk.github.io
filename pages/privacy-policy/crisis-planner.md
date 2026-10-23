---
layout: page
title: Crisis Planner Privacy Policy
permalink: /pages/privacy-policy/crisis-planner/
---

<!-- Copyright (c) 2026 Jericho Crosby (Chalwk). All rights reserved. -->

**Crisis Planner** is a personal crisis-planning app for Android. This policy
explains exactly what the app does and does not do with your information. It
applies to anyone who installs and uses the app.

<div class="privacy-callout">
<strong>Short version:</strong> Crisis Planner does not collect, transmit, or
share any personal information. Everything you enter - your crisis plan,
contacts, safety information, and mood check-ins - is stored only on your
device and never leaves it unless you deliberately export it.
</div>

| Detail             | Value                      |
| ------------------ | -------------------------- |
| **App**            | Crisis Planner (Android)   |
| **Package**        | `com.chalwk.crisisplanner` |
| **Developer**      | Jericho Crosby (Chalwk)    |
| **Effective date** | 23 October 2026            |
| **Last updated**   | 23 October 2026            |

---

## Why this policy exists

The content you put into a crisis-planning app is inherently sensitive -
mental health information, emergency contacts, medical notes. The app has
been designed so that **no one, including the developer, can see any of it**.
This page sets that out in detail, because a privacy claim is only meaningful
if you can check it.

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
- does **not** request any Android runtime permissions.

## Information stored on your device

Everything you create in the app is stored locally in the app's private
storage area, which other apps cannot read. This includes:

- the steps and suggestions in your crisis plan, across all levels;
- emergency contacts you add (name, phone number, and relationship, if you
  choose to enter it);
- safety information you choose to record (GP or support-worker notes,
  diagnoses, medications, means-restriction notes, and reasons for living);
- notes about what is happening right now, when you use that section;
- your mood check-in history;
- your display settings (theme, text size, contrast, motion);
- your name, if you choose to enter it.

This data is used **only** to display the plan back to you inside the app and
to generate the handover summary, plan view, or pocket card that you ask for.

## Android backup and device transfer

The app explicitly opts out of Android's cloud backup. Your plan, contacts,
safety information, and mood history are **not** uploaded to Google's servers
as part of Android Backup, and they are **not** included in any automatic
cloud sync.

Android's *device-to-device transfer* - the flow used when you set up a
new phone - is permitted, so that you can move your plan to a new device
without retyping it. That transfer goes directly between your two devices and
does not pass through any server controlled by the developer.

## Sharing and external actions

We do not share any information. There is nothing to share, because the app
never transmits data off your device.

The app provides features that can deliberately expose information when *you*
choose to use them:

| Feature                                | What happens                                                                                                                                                          |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Call a number (hotlines, contacts)** | The app opens your phone's dialer with the number pre-filled. The app does not place the call and does not see whether you complete it.                               |
| **Text a contact**                     | The app opens your messaging app with the number pre-filled. Nothing is sent until you press send inside your messaging app.                                          |
| **Share or copy the handover summary** | Only when you tap Share or Copy. What you share, and with whom, is entirely your choice.                                                                              |
| **Export plan as JSON**                | Only when you choose Export. You pick where the file goes using Android's standard file picker. The file contains the plan data in plain text - store it accordingly. |
| **Import plan from JSON**              | Only when you choose Import and select a file. The app reads that file, and nothing else.                                                                             |
{: .rules-table}

In every case above, the action is initiated by you. The developer receives
no notification, copy, or log of any of these actions.

## Third-party services

The app does not use any third-party services. It contains no advertising
networks, no analytics providers, no crash reporting services, no
social-media integrations, and no other SDKs that would process your data.

The only third parties involved are the standard Android system components
- your dialer, your messaging app, the system file picker, and the
share sheet - that you already use for other apps on your phone.

## Data retention and deletion

Because all data is stored locally on your device, you are in full control of
it:

- you can edit or delete individual plan items, contacts, and notes inside
  the app at any time;
- you can reset the entire plan, or reset only the "what's happening right
  now" section, from the app's menus;
- uninstalling the app removes all of its data from your device;
- on Android 13 and later, you can also clear the app's storage from
  **Settings &rarr; Apps &rarr; Crisis Planner &rarr; Storage &rarr; Clear storage**.

No copy of your data exists anywhere else, so deletion is immediate and
complete.

## Children's privacy

The app is not directed at children under 13. It does not knowingly collect
personal information from anyone, including children, because it does not
collect personal information at all. If you are a parent or guardian and
believe a child has used the app to record crisis information, you can clear
the app's data at any time from the device settings as described above.

## Security

Because the app never transmits data off the device, the main security
boundary is your device itself: your screen lock, your device encryption, and
Android's app sandboxing (which prevents other apps from reading Crisis
Planner's private storage) are what protect your plan.

Please keep those protections in place. If you share your handover summary by
text or email, or export your plan to a file, remember that the content is no
longer protected by the app.

## Medical disclaimer

**Crisis Planner is a personal planning tool, not a medical device.** It is
not a substitute for professional mental-health care, diagnosis, or treatment.
It does not monitor you, does not detect a crisis, and does not contact
anyone on your behalf.

If you are in immediate danger, call **111**. If you need to talk to someone
now, call or text **1737** (free, 24/7) or call the Suicide Crisis Helpline on
**0508 828 865**.

## Changes to this policy

If the app's data practices ever change - for example, if a future
version adds an optional feature that transmits data - this policy will
be updated before that version is published, and the "Last updated" date at
the top of this page will change. The current version of this policy is
always available at the URL you are reading now, and a link to it is also
provided inside the app.

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
</style>