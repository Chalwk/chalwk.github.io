---
title: "Halo: Modding References & Tools"
permalink: /halo/modding-references/
date: 2026-11-09
last-updated: 2026-11-09
categories: [ education, halo, modding ]
tags: [ hek, tools, sapp, lua, scripting, tutorial, reference ]
---

Essential references and tools for Halo PC and Custom Edition (CE) modding, from classic HEK
utilities to modern cross-platform toolchains. Covers weapon stat tweaking, custom multiplayer maps,
and server-side Lua scripting.

---

## Official Documentation and Community Hubs

Official docs, forums, map repositories, and community knowledge bases.

- [SAPP Documentation (mirror)](https://github.com/Chalwk/SPCLib/blob/master/docs/sapp_docs_revision_2.4.pdf):
- [Official SAPP Docs](https://halo-sapp.readthedocs.io/): Lua API, events, commands, and examples
  for the SAPP server extension.
- [Scripting with SAPP](sapp/scripting-with-sapp.md): Comprehensive guide to server-side Lua
  scripting using SAPP's Lua API, including signature scanning, global variables, and core
  functions.
- [Scripting with Phasor](phasor/scripting-with-phasor.md):
  Server-side Lua scripting with Phasor, covering version handling and hardcoded addresses.
- [Phasor (legacy)](https://phasor.halonet.net/): Legacy server extension and documentation; useful
  for older scripts and historical examples.
- [Phasor V1 Docs](http://phasor.halonet.net/archive/docs/05x.html): Documentation for Phasor V1.
- [Phasor V2 Docs](http://phasor.halonet.net/archive/docs/200.html): Documentation for Phasor V2.
- [The Reclaimers Library (c20)](https://c20.reclaimers.net/): Community-maintained technical
  reference covering the Halo Editing Kit, engine internals, map-making workflows, and modern
  tooling.
- [Halopedia - Halo: Combat Evolved](https://www.halopedia.org/Halo:_Combat_Evolved):
  Community-maintained wiki with detailed information about gameplay systems, tags, weapons,
  vehicles, and campaign content.
- [Halopedia - Weapons category](https://www.halopedia.org/Halo:_Combat_Evolved#Weapons): Full list
  of Halo: CE weapons and related articles.
- [OpenCarnage](https://opencarnage.net/): Forums, HEK help, scripts, and CE community discussions.
- [Elite Game Servers - SAPP overview](https://www.elitegameservers.net/sapp/): Practical SAPP usage
  notes and examples.
- [HAC2 Map Repo](https://maps.halonet.net/): Custom maps for Halo PC and Custom Edition.
- [HaloMaps.org](https://www.halomaps.org/hce/): Large archive of Halo Custom Edition maps and
  releases.

## Deep Dives and Networking

When you need to understand netcode, packet loss, memory offsets, or the Halo 1 system link
protocol:

- [Netcode (Wikipedia)](https://en.wikipedia.org/wiki/Netcode): General networking concepts
  (tickrate, latency, packet loss) useful for multiplayer synchronization and debugging.
- [Exploring the Halo 1 System Link Protocol](https://hllmn.net/blog/2023-09-18_h1x-net/)
  (hllmn.net, 2023): Low-level reverse engineering of CE networking and packet structures.
- [Understanding Memory Offsets](https://chalwk.github.io/blog/2025/09/07/halo-understanding-memory-offsets/):
  Foundational guide to memory addresses, offsets, signature scanning, and tools for finding offsets
  in Halo PC/CE.

---

## Modding Tools

There are two main eras of tooling: the classic HEK suite and modern community replacements.

### Classic HEK (Halo Editing Kit)

These are the original tools Bungie released for Halo Custom Edition. They still work, but may
require some patience on modern versions of Windows.

- [HEK on Nexus Mods](https://www.nexusmods.com/halo/mods/6): The original Halo Editing Kit
  installer.
- [H1 Editing Kit Reference (c20)](https://c20.reclaimers.net/h1/h1-ek): Detailed explanation of the
  HEK tools, workflows, and differences between legacy HEK and modern H1A-EK setups.
- Sapien: Scenario and map editor (in-editor placement, scenario preview, radiosity).
- Guerilla: Structured tag editor for weapons, bipeds, vehicles, shaders, and gameplay tuning.
- Tool: Command-line asset compiler used for bitmaps, models, sounds, and map builds.
- Tag Test (`tag_test.exe`): Launch and debug maps locally without a dedicated server.

> [!WARNING]
> Classic HEK tools are 32-bit applications and may require setting compatibility mode (such as
> Windows 7 mode) or running with administrator rights. Using `dgVoodoo2` as a DirectX wrapper can
> also improve stability on modern Windows versions.

### Modern and Community Toolchains

These tools are cross-platform, scriptable, and actively maintained by the community.

- [Invader](https://github.com/SnowyMouse/invader): Modern, cross-platform toolkit for extracting,
  building, and modifying Halo maps. Designed as a modern replacement for many classic HEK
  workflows.
- [Assembly](https://github.com/XboxChaos/Assembly): Multi-generation `.map` editor and patcher
  developed by XboxChaos. Excellent for quick edits, experimentation, and patching existing maps.
- [MEK (Mozz Editing Kit)](https://github.com/Sigmmma/mek): Alternate editing suite with extraction
  tools and graphical utilities.
- [OpenSauce](https://c20.reclaimers.net/h1/community-tools/opensauce): Advanced Halo CE engine
  extension adding expanded scripting, rendering, and engine-level modding features.

> [!TIP]
> Use `Invader` for automated build pipelines, batch workflows, and CI/CD integration. Use
> `Assembly` for rapid on-the-fly map patching and lightweight experimentation.

---

## Client-Side Mods and Scripting Platforms

Enhance your local game or test scripts without needing a dedicated server.

- [Chimera](https://github.com/SnowyMouse/chimera): Halo CE client modification with Lua support,
  quality-of-life features, and modding APIs.
- [Scripting with Chimera](chimera/scripting-with-chimera.md): Client-side Lua scripting with
  Chimera, including event callbacks, script placement, and version compatibility.
- [Balltze](https://github.com/MangoFizz/balltze): Plugin loader and mod platform for Halo CE.
  Documentation: [balltze.shadowmods.net](https://balltze.shadowmods.net/)

---

## Lua Scripting Helpers and Package Management

These libraries and utilities make writing and distributing CE Lua scripts easier.

- [lua-blam](https://github.com/Sledmine/lua-blam): Memory and tag helper module for Halo CE Lua
  scripting.
- [Mercury](https://github.com/Sledmine/mercury): Package manager for Halo CE mods. Helps package,
  install, remove, and distribute addons cleanly.

> [!NOTE]
> Use `Mercury` to manage and distribute reusable mods, scripts, and dependencies cleanly across
> projects.

---

## Asset Pipelines and Blender Tools

If you are creating custom models or importing assets, these Blender addons and utilities are
essential.

- [Halo Asset Blender Development Toolset](https://github.com/General-101/Halo-Asset-Blender-Development-Toolset):
  Import and export Halo CE assets directly in Blender.
- Other community tools: Search GitHub for `ekur`, `Foundry`, or `blender-halo-tools` to find
  additional importers, exporters, and workflow utilities.

---