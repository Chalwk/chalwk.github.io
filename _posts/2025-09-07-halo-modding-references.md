---
title: "Halo: Modding References & Tools"
date: 2025-09-8
last-updated: 2026-5-20
categories: [ education, halo, modding ]
tags: [ sapp, lua, halo, scripting, tutorial ]
---

Whether you are tweaking weapon stats, building custom multiplayer maps, or writing Lua scripts
for your server, having the right references and tools makes all the difference. This guide compiles the essential
resources for Halo PC and Custom Edition (CE) modding - from classic HEK utilities to modern cross-platform toolchains.

---

## Official Documentation & Community Hubs

Start here for official docs, forums, map repositories, and community knowledge bases.

- [SAPP Documentation (mirror)](https://github.com/Chalwk/SPCLib/blob/master/docs/SAPP%20Documentation%20Revision%202.4.pdf) -
  Mirror of the classic SAPP documentation PDF containing the Lua API, events, commands, and examples for the SAPP
  server extension.
- [Official SAPP Docs](https://halo-sapp.readthedocs.io/) - Modern SAPP documentation hosted on ReadTheDocs.
- [Scripting with SAPP](https://chalwk.github.io/blog/2026/05/17/halo-scripting-with-sapp) - Comprehensive guide to
  server-side Lua scripting using SAPP's Lua API, including signature scanning, global variables, and core functions.
- [Scripting with Phasor](https://chalwk.github.io/blog/2026/05/17/halo-scripting-with-phasor) - Server-side Lua
  scripting with Phasor, covering version handling and hardcoded addresses.
- [SAPP Command Reference](https://chalwk.github.io/blog/2026/05/17/halo-sapp-command-reference) - Complete reference
  for SAPP server configuration commands, admin levels, and usage.
- [Common Lua References](https://chalwk.github.io/blog/2026/05/17/halo-lua-common-references) - A practical reference
  collection of common Lua patterns, utilities, and scripting helpers used across Halo server and client scripting
  environments.
- [Phasor (legacy)](https://phasor.halonet.net/) - Legacy server extension and documentation; useful for older scripts
  and historical examples.
- [Phasor V1 Docs](http://phasor.halonet.net/archive/docs/05x.html) - Documentation for Phasor V1.
- [Phasor V2 Docs](http://phasor.halonet.net/archive/docs/200.html) - Documentation for Phasor V2.
- [The Reclaimers Library (c20)](https://c20.reclaimers.net/) - Community-maintained technical reference covering the
  Halo Editing Kit, engine internals, map-making workflows, and modern tooling.
- [Halopedia - Halo: Combat Evolved](https://www.halopedia.org/Halo:_Combat_Evolved) - Community-maintained wiki with
  detailed information about gameplay systems, tags, weapons, vehicles, and campaign content.
- [Halopedia - Weapons category](https://www.halopedia.org/Halo:_Combat_Evolved#Weapons) - Full list of Halo: CE
  weapons and related articles.
- [OpenCarnage](https://opencarnage.net/) - Forums, HEK help, scripts, and CE community discussions.
- [Elite Game Servers - SAPP overview](https://www.elitegameservers.net/sapp/) - Practical SAPP usage notes and
  examples.
- [HAC2 Map Repo](https://maps.halonet.net/) - Custom maps for Halo PC and Custom Edition.
- [HaloMaps.org](https://www.halomaps.org/hce/) - Large archive of Halo Custom Edition maps and releases.

## Deep Dives & Networking

When you need to understand netcode, packet loss, memory offsets, or the Halo 1 system link protocol:

- **[Netcode (Wikipedia)](https://en.wikipedia.org/wiki/Netcode)** - General networking concepts (tickrate, latency,
  packet loss) useful for multiplayer synchronization and debugging.
- **[Exploring the Halo 1 System Link Protocol](https://hllmn.net/blog/2023-09-18_h1x-net/)** (hllmn.net, 2023) -
  Low-level reverse engineering of CE networking and packet structures.
- **[Understanding Memory Offsets](https://chalwk.github.io/blog/2025/09/08/halo-understanding-memory-offsets)** -
  Foundational guide to memory addresses, offsets, signature scanning, and tools for finding offsets in Halo PC/CE.

> **Tip:** Understanding how Halo handles network updates and memory layout will save you hours of frustration when
> debugging desyncs, script lag, or signature scanning issues.

---

## Modding Tools

You have two main eras of tooling: the classic HEK suite and modern community replacements.

### Classic HEK (Halo Editing Kit)

These are the original tools Bungie released for Halo Custom Edition. They still work, but may require some patience
on modern versions of Windows.

- **[HEK on Nexus Mods](https://www.nexusmods.com/halo/mods/6)** - The original Halo Editing Kit installer.
- **[H1 Editing Kit Reference (c20)](https://c20.reclaimers.net/h1/h1-ek)** - Detailed explanation of the HEK tools,
  workflows, and differences between legacy HEK and modern H1A-EK setups.
- **Sapien** - Scenario and map editor (in-editor placement, scenario preview, radiosity).
- **Guerilla** - Structured tag editor for weapons, bipeds, vehicles, shaders, and gameplay tuning.
- **Tool** - Command-line asset compiler used for bitmaps, models, sounds, and map builds.
- **Tag Test (`tag_test.exe`)** - Launch and debug maps locally without a dedicated server.

> **Warning:** Classic HEK tools are 32-bit and may need compatibility settings (Windows 7 mode, admin rights). Some
> users report improved stability with `dgVoodoo2` as a DirectX wrapper.

### Modern & Community Toolchains

These tools are cross-platform, scriptable, and actively maintained by the community.

- **[Invader](https://github.com/SnowyMouse/invader)** - Modern, cross-platform toolkit for extracting, building, and
  modifying Halo maps. Designed as a modern replacement for many classic HEK workflows.
- **[Assembly](https://github.com/XboxChaos/Assembly)** - Multi-generation `.map` editor and patcher developed by
  XboxChaos. Excellent for quick edits, experimentation, and patching existing maps.
- **[MEK (Mozz Editing Kit)](https://github.com/Sigmmma/mek)** - Alternate editing suite with extraction tools and
  graphical utilities.
- **[OpenSauce](https://c20.reclaimers.net/h1/community-tools/opensauce)** - Advanced Halo CE engine extension adding
  expanded scripting, rendering, and engine-level modding features.

> **Tip:** Use Invader if you need batch workflows, CI integration, or want to avoid many of the classic HEK quirks.
> Assembly is ideal for quick testing and lightweight map edits, while larger projects are generally easier to maintain
> through proper tag-based rebuild workflows.

---

## Client-Side Mods & Scripting Platforms

Enhance your local game or test scripts without needing a dedicated server.

- **[Chimera](https://github.com/SnowyMouse/chimera)** - Halo CE client modification with Lua support,
  quality-of-life features, and modding APIs.
- **[Scripting with Chimera](https://chalwk.github.io/blog/2026/05/17/halo-scripting-with-chimera)** - Client-side Lua
  scripting with Chimera, including event callbacks, script placement, and version compatibility.
- **[Balltze](https://github.com/MangoFizz/balltze)** - Plugin loader and mod platform for Halo CE.  
  Documentation: [balltze.shadowmods.net](https://balltze.shadowmods.net/)

> **Tip:** Run Chimera locally to prototype Lua scripts before deploying them to a SAPP-powered server.

---

## Lua Scripting Helpers & Package Management

These libraries and utilities make writing and distributing CE Lua scripts easier.

- **[lua-blam](https://github.com/Sledmine/lua-blam)** - Memory and tag helper module for Halo CE Lua scripting.
- **[Mercury](https://github.com/Sledmine/mercury)** - Package manager for Halo CE mods. Helps package, install,
  remove, and distribute addons cleanly.

> **Best practice:** Use Mercury to organize reusable mods, scripts, and dependencies for easier sharing and deployment.

---

## Asset Pipelines & Blender Tools

If you are creating custom models or importing assets, these Blender addons and utilities are essential.

- **[Halo Asset Blender Development Toolset](https://github.com/General-101/Halo-Asset-Blender-Development-Toolset)** -
  Import and export Halo CE assets directly in Blender.
- **Other community tools** - Search GitHub for `ekur`, `Foundry`, or `blender-halo-tools` to find additional importers,
  exporters, and workflow utilities.

> **Tip:** Always export to the correct tag format (for example, `.gbxmodel` for models) and use Tool or Invader to
> compile assets into your map.

---

## Quick Usage Tips - Which Workflow Should You Choose?

- **Classic HEK workflow** - Use **Sapien + Guerilla + Tool + Tag Test** if you are following older tutorials or need
  traditional radiosity builds.  
  *Best for: learning the original pipeline, campaign scenarios, and legacy workflows.*

- **Modern, scriptable workflow** - Reach for **Invader + Assembly + MEK** when you want cross-platform support, batch
  operations, or safer extraction workflows.  
  *Best for: team projects, CI pipelines, and modern development environments.*

- **Advanced engine modding** - Use **OpenSauce** if your project needs extended rendering, scripting, or engine-level
  capabilities beyond stock Halo CE.  
  *Best for: large-scale visual overhauls and advanced feature mods.*

- **Client-side scripting / testing** - Run **Chimera** locally to write and test Lua scripts. Once stable, deploy the
  same scripts on a **SAPP** server.  
  *Best for: rapid prototyping, debugging, and quality-of-life mods.*