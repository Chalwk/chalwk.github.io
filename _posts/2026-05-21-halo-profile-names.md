---
title: "Halo Profile Names"
date: 2026-05-21
last-updated: 2026-05-21
categories: [ education, halo ]
tags: [ client ]
---

## The default Halo profile name: `New001`

In the PC retail release of **Halo: Combat Evolved** and in **Halo: Custom Edition**, the game creates a default
player profile named `New001`.

This is the name Halo uses when:

- The game is launched for the first time and no profile exists yet.
- A new player profile is created automatically.
- Halo cannot find an existing player profile to load.

The profile itself is stored inside the game's `savegames` directory and the profile folder is also named `New001`.

---

## What are the temporary placeholder names?

Halo PC and Halo CE also contain a built-in list of fallback multiplayer names commonly referred to as the
"temporary profile name pool" or "placeholder name pool".

These names are embedded in the game's `globals.globals` tag and ship with the stock multiplayer maps.

```text
Butcher, Caboose, Crazy, Cupid, Darling, Dasher, Disco, Donut, Dopey,
Ghost, Goat, Grumpy, Hambone, Hollywood, Howard, Jack, Killer, King,
New001, Noodle, Penguin, Pirate, Prancer, Saucy, Shadow, Sleepy, Snake,
Sneak, Stompy, Stumpy, The Bear, The Big L, Tooth, Walla Walla, Weasel,
Whicker, Wheezy, Whisp, Wilshire
```

These names are not normally used during standard single-instance gameplay. Instead, they exist as fallback identities
used by the multiplayer networking system.

---

## When does Halo assign a placeholder name?

The placeholder pool is primarily used when Halo cannot safely use the requested multiplayer profile name.

The most common example is:

* A player joining a multiplayer server where another player is already using the same profile name.

Halo PC and Halo CE do not allow duplicate active player names within the same multiplayer session. If the requested
name is already in use by another connected player, Halo automatically assigns a temporary placeholder name from the
pool instead.

For example:

1. A player joins a server using `New001`.
2. Another player joins using a profile also named `New001`.
3. Halo detects the duplicate name conflict.
4. The second player is assigned a temporary placeholder name such as `Caboose`, `Snake`, or `Wheezy`.

This behavior can occur in:

* LAN games
* Internet multiplayer
* Multi-instance testing setups
* Local dedicated server testing environments

The assigned placeholder name is temporary and only exists for that running session.

---

## Where the placeholder names are stored

The placeholder pool is stored in the map's `globals.globals` tag.

Because every stock multiplayer map contains this tag, the default pool is normally identical across the retail Halo PC
and Halo Custom Edition multiplayer maps.

Modded or rebuilt maps can change the list entirely.

---