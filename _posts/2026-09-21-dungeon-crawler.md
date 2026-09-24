---
title: "Dead End - Dungeon Roguelite"
date: 2026-09-21
last-updated: 2026-09-21
categories: [ programming, guide, web-app ]
tags: [ programming, guide, web-app ]
---

A turn-based, procedurally generated dungeon roguelite. Explore fog-covered floors, fight distinct enemies, collect weapons and boons, and descend ten floors to escape.

The game is optimized for use on larger devices such as a computer or tablet. Smaller phones work, but the board and HUD are cramped.

## [**Link to Game**](https://chalwk.github.io/pages/browser-apps/games/dead-end-dungeon-roguelite)

---

## Sprites:

![alt text](../pages/browser-apps/games/dead-end-dungeon-roguelite/spritesheet.png)

---

## Features

- Procedural floor generation: rooms are scattered, connected by corridors, then assigned roles
- Fog of war with line of sight. Tiles stay remembered once seen, but dim when out of view
- Turn-based movement with bump-to-attack combat
- Six enemy types, each with its own AI: coward, skirmisher, sentinel, brute, stalker, ambusher
- Five tier weapon ladder, each weapon with a unique on-hit effect. Every pickup is your choice: equip it or sell it for gold
- Twelve run boons that change how the run plays
- Locked progression: the red key unlocks the exit door, gold keys open vaults
- Secret rooms hidden behind wall tiles that shimmer when you get close
- Six floor themes that modify vision, damage, gold, and enemy aggression
- Ten floors, ending in a three phase boss fight
- Three dungeon sizes and three difficulty settings
- All sound generated at runtime with the Web Audio API, no asset files
- Keyboard and touch controls

---

## How to Play

Goal: descend ten floors and defeat the Crypt Warden on the last one.

**Controls:**

- WASD or arrow keys: move. Moving into an enemy attacks it
- Space: wait one turn
- P: drink a potion
- M: mute or unmute
- Touch devices show an on-screen D-pad

**Rules:**

- Every move is a turn. Enemies act after you
- Find the red key, unlock the red door guarding the exit room, then step on the stairs to descend
- Gold keys open vaults, which hold a weapon, gold, and an elite guard
- Shrines, armories, libraries, and cleared gauntlets offer a choice of reward
- Boons last the whole run. Every weapon you find is yours to equip or sell for gold
- Potions heal, and each floor restores a little health
- Changing dungeon size or difficulty starts a new dungeon

---

## Design Notes

Data driven content. Tiles, weapons, enemies, themes, boons, and room types are plain arrays and objects. Adding a weapon or an enemy means adding one entry, not editing the engine.

One action, one turn. Every player action follows the same sequence: resolve, then enemies act, then render. Choice modals pause that sequence and resume it when closed.

Generation in stages. Rooms are placed first, corridors carved second, and room roles assigned last using a graph distance pass. Non-start rooms are ranked once: dead ends first, then by graph distance from the entrance, descending. The exit takes the top slot and the vaults take the next ones. Ranking before assigning rather than filtering after the fact guarantees both slots always get filled, even when the random extra corridor edges leave the graph with no dead ends.

Doors mark real crossings only. A corridor becomes a door exactly where it crosses into a room's interior, never anywhere else along that room's wall - so every door on the map means something.

Graphs over coordinates. Room connections are stored as a graph, so distance and dead ends come from a breadth first search instead of geometric guessing.

Every route in is locked. The exit room can end up with more than one corridor leading to it, so every extra entrance gets walled off and the single surviving one becomes the red door. Progress always waits on the key, never on a graph coincidence.

Two layers of fog. Discovered tracks memory, visible tracks current sight. Rendering reads both, so remembered tiles dim rather than vanish.

Scaling through multipliers. Difficulty and floor depth adjust HP, damage, and spawn counts with multipliers. There are no separate code paths per difficulty.

Hooks instead of special cases. Themes expose optional hooks such as `onEnemySpawn` and `onPlayerDamaged`, so a theme can change behavior without the engine knowing about it.

Boons as flags. Boon effects are queried by id at the moment they matter, so a boon is one table entry plus a check where it applies.

Player choice over auto-resolution. Weapon pickups open a choice modal instead of the game deciding for you, using the same modal system as boons and armories.

Full redraw each frame. The board is rebuilt from state on every render. At this grid size that is cheap, and it removes a whole class of stale UI bugs.

No assets. Sound is oscillators, visuals are CSS and text glyphs. The whole game is three files.