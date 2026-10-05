# Back of pinned messages for my posted projects

---

## JCBudgetBuddy: Personal finance tracker for Windows

A Windows desktop personal finance tracker built with Qt Widgets, JSON persistence, and CMake. Manages weekly and monthly expenses, invoices, and payments.

**Features**
- **Dashboard overview:** weekly income, expenses, remaining balance, and monthly averages
- **Bill management:** track weekly and monthly bills with custom frequencies and payment methods
- **Invoice tracking:** manage invoices with payment history and balance calculations
- **Data persistence:** automatic saving to `%USERPROFILE%\.JCBudgetBuddy\userdata.json`
- **Windows installer:** NSIS installer with Start Menu shortcuts and uninstall support

**Getting started**
- Download the latest `JCBudgetBuddySetup.exe` from the [Releases page](https://github.com/Chalwk/JCBudgetBuddy/releases)
- Or build from source with CMake and Qt 6.x

Repo: https://github.com/Chalwk/JCBudgetBuddy

GPL-3.0 licensed. Issues and PRs welcome.

---

## SAPP-HTTP: HTTP/HTTPS client DLL for SAPP

A lightweight HTTP/HTTPS client DLL for SAPP that exposes a C API through LuaJIT FFI. Lets your Lua scripts make GET, POST, and PUT requests using libcurl.

**Key features**
- Asynchronous requests that never block the main thread
- Simple polling model: call `sapp_http_process()` to drive transfers, check with `sapp_http_request_is_done()`
- Full response access: status code, body, content type, error messages
- Built on libcurl, statically linked for 32-bit Windows
- Ships with example Lua scripts for common use cases

**Typical uses**
- Server status reporting to a web dashboard
- Webhook notifications from in-game events
- Fetching player data from external APIs
- Any Lua script that needs to talk to the internet

Repo: https://github.com/Chalwk/SAPP-HTTP

MIT licensed. Issues and PRs welcome.

---

## Coastal Peaks Air Service (CPAS)

A Virtual Charter (VC) and specialty flight operator for Microsoft Flight Simulator. We fly general aviation aircraft and helicopters across New Zealand's South Island, covering Canterbury, Christchurch, Banks Peninsula, and the Southern Alps.

**What we do**
- Scenic tours, charters, and HEMS missions
- Realistic routes with live weather
- Bases at Christchurch International (NZCH) and Mount Cook (NZMC/NZGT)
- ICAO code: CPX

**For new pilots**
- Rank progression from Pilot in Training to Instructor
- Endorsements for mountain flying, multi-engine, and turbine helicopters
- Community events and group flights
- Optional participation; fly at your own pace

**Apply**
- Repo: https://github.com/Chalwk/CPAS
- Site: https://chalwk.github.io/CPAS/

Proprietary license. Applications are reviewed through the CPAS [Discord](https://discord.gg/NsndXgYfxQ) or [GitHub](https://github.com/Chalwk/CPAS).

---

## SPCLib: Lua scripting for Halo PC/CE

The largest public archive of Lua scripts and resources for Halo: PC and Custom Edition. Built for SAPP and Phasor server extensions, plus support for the Chimera client-side mod.

**Inside you'll find:**
- Lua scripts for admin tools, chat, gameplay, gametypes, and more
- Setup guides and scripting references for SAPP, Phasor, and Chimera
- Script packages and archival SAPP binaries

Repo: https://github.com/Chalwk/SPCLib
Contributing guide: https://github.com/Chalwk/SPCLib/blob/master/CONTRIBUTING.md

MIT licensed. Issues, PRs, and community script contributions are welcome.

---

## New project: python-scripts

A grab-bag of self-contained Python scripts.

The first script is `ipqs_lookup.py`: IPQualityScore proxy / VPN / Tor / fraud lookup with a transparent two-layer verdict.

Repo: https://github.com/Chalwk/python-scripts
Docs: https://chalwk.github.io/python-scripts/

MIT licensed. Issues and PRs welcome.

---

## JeriCraft: Minecraft Server

A medieval-themed SMP/RPG Factions server for Minecraft Java Edition. This repository contains the Jekyll source code for the official public documentation site at [jericraft.net](https://jericraft.net), featuring server guides, tutorials, rules, and policies.

Repo: https://github.com/Chalwk/JeriCraft/

**Want to help improve the JeriCraft website?**

You can contribute guides, fix typos, update command lists, add shop pages, or improve existing pages.

To get started, read the full [CONTRIBUTING guide](https://github.com/Chalwk/JeriCraft/blob/main/CONTRIBUTING.md). It covers:
- How to submit a pull request
- Writing new guides in `_guides`
- Adding shop pages in `_shops`
- Updating existing `pages` and `includes`
- Front matter, image paths, and style conventions
- Testing your changes locally

If you have questions, ask here!

Proprietary license. Issues and PRs are reviewed through the [GitHub](https://github.com/Chalwk/JeriCraft) repository.