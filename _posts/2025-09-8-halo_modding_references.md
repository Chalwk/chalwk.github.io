---
layout: post
title: "Halo PC/CE: Modding References & Tools"
date: 2025-09-8
author: Jericho Crosby
categories: [ education, halo, modding ]
tags: [ sapp, lua, halo, scripting, tutorial ]
---

Whether you are tweaking weapon stats, building custom multiplayer maps, or writing Lua scripts
for your server, having the right references and tools makes all the difference. This guide compiles the essential
resources for Halo PC and Custom Edition (CE) modding - from classic HEK utilities to modern cross-platform toolchains.

Let us dive in.

---

## Official Documentation & Community Hubs

Start here for official docs, forums, and map repositories.

- **[SAPP docs (official)](https://halo-sapp.readthedocs.io/en/latest/scripting/index.html)** - Complete Lua API,
  events, commands, and examples for SAPP server extension.
- **[Phasor (legacy)](https://phasor.halonet.net/)** - Legacy server extension and docs; useful for older scripts and
  historical examples.
- **[Phasor V1 Docs](http://phasor.halonet.net/archive/docs/05x.html)** - Documentation for Phasor V1.
- **[Phasor V2 Docs](http://phasor.halonet.net/archive/docs/200.html)** - Documentation for Phasor V2.
- **[Halopedia - Halo: Combat Evolved](https://www.halopedia.org/Halo:_Combat_Evolved)** - Canonical game behavior, tag
  structure, and weapon overviews.
- **[Halopedia - Weapons category](https://www.halopedia.org/Halo:_Combat_Evolved#Weapons)** - Full list of weapons in
  Halo.
- **[OpenCarnage](https://opencarnage.net/)** - Forums, HEK help, scripts, and CE community discussions.
- **[Elite Game Servers - SAPP overview](https://www.elitegameservers.net/sapp/)** - Practical SAPP usage notes and
  examples.
- **[HAC2 Map Repo](https://maps.halonet.net/)** - Custom maps for PC & CE.
- **[HaloMaps.org](https://www.halomaps.org/hce/)** - Another large archive of custom maps.

## Deep Dives & Networking

When you need to understand netcode, packet loss, or the Halo 1 system link protocol:

- **[Netcode (Wikipedia)](https://en.wikipedia.org/wiki/Netcode)** - General networking concepts (tickrate, latency,
  packet loss) useful for server sync debugging.
- **[Exploring the Halo 1 System Link Protocol](https://hllmn.net/blog/2023-09-18_h1x-net/)** (hllmn.net, 2023) -
  Low‑level reverse engineering of CE networking.

> **Tip:** Understanding how Halo handles network updates will save you hours of frustration when debugging weird
> desyncs or script lag.

---

## Modding Tools

You have two main eras of tooling: the classic HEK suite and modern community replacements.

### Classic HEK (Halo Editing Kit)

These are the original tools Bungie released for CE. They still work, but require some patience on modern Windows.

- **[HEK on Nexus Mods](https://www.nexusmods.com/halo/mods/6)** - The full Halo Editing Kit installer.
- **Sapien** - Scenario and map editor (in‑editor placement, scenario preview, radiosity).
- **Guerilla** - Tag editor (view and edit structured tag fields - your go‑to for weapon tweaks).
- **Tool** - Command‑line asset compiler (bitmap conversion, map build pipeline).
- **Tag Test (`tag_test.exe`)** - Launch and debug maps locally without a full server.

> **Warning:** Classic HEK tools are 32‑bit and may need compatibility settings (Windows 7 mode, admin rights). Some
> users report better stability with `dgVoodoo2` for DirectX 9 fallback.

### Modern & Community Toolchains

These tools are cross‑platform, scriptable, and under active development.

- **[Invader](https://invader.opencarnage.net/)** - Modern, cross‑platform toolkit for extracting, building, and
  modifying Halo maps.  
  GitHub: [SnowyMouse/invader](https://github.com/SnowyMouse/invader)
- **[Assembly](https://github.com/XboxChaos/Assembly)** - Multi‑generation `.map` editor and patcher (XboxChaos).
- **[MEK (Mozz Editing Kit)](https://github.com/Sigmmma/mek)** - Alternate editing suite with extractors and GUIs.

> **Tip:** Use Invader if you need batch/CI workflows or want to avoid the classic HEK's quirks. Assembly is excellent
> for quick tag edits and patching existing maps.

---

## Client‑Side Mods & Scripting Platforms

Enhance your local game or test scripts without a dedicated server.

- **[Chimera](https://github.com/SnowyMouse/chimera)** - CE client modification with Lua support, quality‑of‑life
  features, and modding APIs.
- **[Balltze](https://github.com/MangoFizz/balltze)** - Plugin loader and mod platform for CE.  
  Documentation: [balltze.shadowmods.net](https://balltze.shadowmods.net/)

> **Tip:** Run Chimera locally to prototype Lua scripts before deploying them to a SAPP‑powered server.

---

## Lua Scripting Helpers & Package Management

These libraries make writing and distributing CE Lua scripts easier.

- **[lua-blam](https://github.com/Sledmine/lua-blam)** - Memory and tag helper module for CE Lua scripting (by
  Sledmine).
- **[Mercury](https://github.com/Sledmine/mercury)** - Package manager for CE mods. Helps bundle and distribute addons
  cleanly.

> **Best practice:** Use Mercury to manage dependencies and share your scripts with the community.

---

## Asset Pipelines & Blender Tools

If you are creating custom models or importing assets, these Blender addons are essential.

- **[Halo Asset Blender Development Toolset](https://github.com/General-101/Halo-Asset-Blender-Development-Toolset)** -
  Import/export H1 assets directly in Blender.
- **Other community tools** - Search GitHub for `ekur`, `Foundry`, or `blender-halo-tools` to find additional importers
  and pipelines.

> **Tip:** Always export to the correct tag format (e.g., `.gbxmodel` for models) and use Tool or Invader to compile
> them into your map.

---

## Quick Usage Tips - Which Workflow Should You Choose?

- **Classic HEK workflow** - Use **Sapien + Guerilla + Tool + Tag Test** if you are following old tutorials or need
  precise radiosity builds.  
  *Best for: learning the original pipeline, building singleplayer scenarios.*

- **Modern, scriptable workflow** - Reach for **Invader + Assembly + MEK** when you want cross‑platform support, batch
  operations, or safer extraction.  
  *Best for: team projects, CI pipelines, or if you are tired of HEK crashes.*

- **Client‑side scripting / testing** - Run **Chimera** locally to write and test Lua scripts. Once stable, deploy the
  same scripts on a **SAPP** server.  
  *Best for: rapid prototyping and quality‑of‑life mods.*

---