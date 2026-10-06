<!--
This file documents the server's channel structure and serves as a backup of important
server-specific messages and my personal posts. I'm keeping it so that if I ever need
to recreate the server, I won't have to remember or rewrite everything from scratch.
-->

# Chalwk - Code & Chill <!-- omit from toc -->

## Table of Contents <!-- omit from toc -->

- [Server Structure](#server-structure)
  - [INFO](#info)
  - [SOCIAL](#social)
  - [PROJECTS](#projects)
  - [VOICE](#voice)
  - [COUNCIL CHAMBERS (hidden to the public)](#council-chambers-hidden-to-the-public)
- [Backup of important server-specific messages in relevant channels:](#backup-of-important-server-specific-messages-in-relevant-channels)
  - [welcome](#welcome)
  - [role-selection](#role-selection)
  - [rules](#rules)
  - [introductions](#introductions)
  - [chatter-box](#chatter-box)
  - [releases-and-updates](#releases-and-updates)
    - [JCBudgetBuddy: Personal finance tracker for Windows](#jcbudgetbuddy-personal-finance-tracker-for-windows)
    - [SAPP-HTTP: HTTP/HTTPS client DLL for SAPP](#sapp-http-httphttps-client-dll-for-sapp)
    - [Coastal Peaks Air Service (CPAS)](#coastal-peaks-air-service-cpas)
    - [SPCLib: Lua scripting for Halo PC/CE](#spclib-lua-scripting-for-halo-pcce)
    - [Python Scripts: Self-contained utilities](#python-scripts-self-contained-utilities)
    - [JeriCraft: Minecraft Server](#jericraft-minecraft-server)
    - [Paper-AutoMessages (Java MC Plugin)](#paper-automessages-java-mc-plugin)
    - [Paper-BigBrother (Java MC Plugin)](#paper-bigbrother-java-mc-plugin)
    - [Paper-GameModeManager (Java MC Plugin)](#paper-gamemodemanager-java-mc-plugin)
    - [Paper-VacuLoot (Java MC Plugin)](#paper-vaculoot-java-mc-plugin)
    - [OBS-Lua-Scripts](#obs-lua-scripts)
  - [contributing](#contributing)
  - [support](#support)

---

## Server Structure

### INFO

| Channel             | Type  | Read-only | Description                                                                     |
| ------------------- | ----- | --------- | ------------------------------------------------------------------------------- |
| welcome             | Text  | Yes       | [See Below.](#welcome)                                                          |
| role-selection      | Text  | Yes       | [See Below.](#role-selection)                                                   |
| rules               | Text  | Yes       | [See Below.](#rules)                                                            |
| introductions       | Forum | No        | [See Below.](#introductions)                                                    |
| arrivals-departures | Text  | Yes       | @ChalwkBot will post notifications here when a user joins or leaves the server. |

### SOCIAL

| Channel     | Type | Read-only | Description                |
| ----------- | ---- | --------- | -------------------------- |
| chatter-box | Text | No        | [See Below.](#chatter-box) |

### PROJECTS

| Channel              | Type  | Read-only | Description                                                                              |
| -------------------- | ----- | --------- | ---------------------------------------------------------------------------------------- |
| releases-and-updates | Forum | No        | [See Below.](#releases-and-updates)                                                      |
| contributing         | Forum | No        | [See Below.](#contributing)                                                              |
| support              | Forum | No        | [See Below.](#support)                                                                   |
| github-feed          | Text  | Yes       | GitHub notifications for my repos: pushes, pull requests, issues, commits, and releases. |

### VOICE

| Channel | Type       | Read-only | Description               |
| ------- | ---------- | --------- | ------------------------- |
| General | Voice/Text | No        | Main public voice channel |

### COUNCIL CHAMBERS (hidden to the public)

| Channel    | Type  | Read-only | Description                                              |
| ---------- | ----- | --------- | -------------------------------------------------------- |
| watchtower | Text  | No        | Admin logs, moderation notes, and server oversight       |
| Admin Chat | Voice | No        | Private staff voice channel for discussions and planning |

---

## Backup of important server-specific messages in relevant channels:

### welcome

```
# Welcome to Chalwk's Code & Chill

Welcome to the community server for my coding projects. This is a place to follow what I'm working on, ask questions, suggest ideas, report bugs, and see what's coming next. It's also a place to hang out, chat, and enjoy some company, so feel free to drop by and say hi.

**Everyone is welcome here**, regardless of your experience level. Whether you're a seasoned developer, a curious beginner, or you've never written a line of code, you're in the right place.

While this server is code-focused, you **don't** have to be a programmer to belong here. If you're interested in the community, want to chat, or simply enjoy having a place to hang out, that's welcome too.

## What lives here
- Support and discussion for my public repositories
- Early looks at projects before they hit GitHub
- A place to share what you've done with them
- Casual chat, introductions, and community

**Projects:** [github.com/Chalwk](https://github.com/Chalwk)  
**Website:** [chalwk.github.io](https://chalwk.github.io/)

## Start here: your first 5 minutes
1. **Read the <#1556486004070809603>**.
2. **Pick your roles.** Visit the **role-selection** channel and use `/roles` to choose your interests and notifications.
3. **Introduce yourself.** Say hi in <#1556495282517315614>.
4. **Need help or found a bug?** Check the pins in <#1556486004590907510> first, then post there if you still need a hand.
5. **Want to contribute?** PRs are welcome. Check `CONTRIBUTING.md` in the relevant repo.

**Not here for code?** That's fine. Start in <#1556486004590907507> or just introduce yourself.

*By joining, you agree to follow the rules. Breaking them gets you muted or removed - nothing personal.*
```

### role-selection

```
# Self-Assignable Roles

Use the `/roles` command to assign or remove your roles at any time.

**Interests** - pick whichever apply to you.

<@&1556578831630991471>
-# Working in Python or following Python project updates <#1556511374773850173>

<@&1556579065719296041>
-# JavaScript, TypeScript, and web development.

<@&1556579134744829953>
-# Java development.

<@&1556755380942405723>
-# C and C++ development, native applications, game development, and engine work.

<@&1556582143637979186>
-# Writing Lua for SPCLib or other platforms.

<@&1556579278466842724>
-# C# and .NET development.

<@&1556579330170290228>
-# JeriCraft, SPCLib, game servers, modding, and engine work.

<@&1556579401494306837>
-# `netsec` scripts, CTFs, and general infosec.

**Notifications** - opt in to the pings you actually want.

<@&1556579451603652648>
-# Pinged when a new release or site update hits <#1556511374773850173>

<@&1556579511360032799>
-# Pinged when someone posts a project in <#1556511374773850173>

<@&1556579662950441010>
-# Pinged when a new thread opens in <#1556486004590907510>
```

### rules

```
All members are required to abide by the official **Chalwk - Code & Chill Rules**. These rules apply to this Discord server and to any GitHub discussions, issues, or pull requests connected to my repositories.

**[- Read the Full Rules -](https://chalwk.github.io/pages/community-rules/)**

By joining the server or taking part in discussions on GitHub, you agree to follow these guidelines. Violations may result in a warning, mute, or removal from the server, and, where relevant, restrictions on GitHub.

**Before posting logs or errors:** redact API keys, tokens, and real IP addresses. If you paste a secret by accident, rotate it immediately and alert a moderator.

**Reporting a message**

If you see something that breaks the rules, use `/report`:
- Right-click the offending message → **Copy Message Link**
- Run `/report`, paste the link, and add a short reason
- The report is DMed privately to the moderators. The reported user is not told, and nothing is posted publicly.

For anything involving API keys, tokens, or personal data, do not use `/report`. Use the private security report on the affected repo's **Security** tab, or DM a moderator directly.
```

### introductions

```
- One thread per person. Use your name or handle as the title.
- If you're here just to hang out, that's welcome too. This isn't only for programmers.
- No programming experience required. Seasoned developer, curious beginner, or never written a line of code: you're welcome here.
- Be friendly. No hate, harassment, or discrimination.
- Privacy reminder: do not share your full name, address, school, phone number, email, or private account handles.
- Safe to share: hobbies, interests, favourite programming languages, GitHub username, projects you're working on, timezone, what you're here to learn or build.
- No advertising other servers, Discords, or services.
- Reply to others to welcome them. I read every post.

Keep it short and kind. Thanks for being here.

**Tags used in this forum:** :wave: hello; :seedling: new; :repeat: returning
```

### chatter-box

```
General discussion about coding, projects, and life.

No support requests here - use <#1556486004590907510>.
Be kind, follow the rules, and keep it chill.
```

### releases-and-updates

#### JCBudgetBuddy: Personal finance tracker for Windows

```
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

<@&1556755380942405723> <@&1556579451603652648>
```

#### SAPP-HTTP: HTTP/HTTPS client DLL for SAPP

```
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

<@&1556755380942405723> <@&1556579451603652648>
```

#### Coastal Peaks Air Service (CPAS)

```
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

<@&1556579330170290228> <@&1556579451603652648>
```

#### SPCLib: Lua scripting for Halo PC/CE

```
**SPCLib** *(SAPP, Phasor and Chimera Library)* is the largest public archive of Lua scripts and resources for the **SAPP** and **Phasor** dedicated server extensions, and the **Chimera** client-side mod, for Halo: PC/CE.

**Inside you'll find:**
- Lua scripts for admin tools, chat, gameplay, gametypes, and more
- Setup guides and scripting references for SAPP, Phasor, and Chimera
- Script packages and archival SAPP binaries

Repo: https://github.com/Chalwk/SPCLib
Contributing guide: https://github.com/Chalwk/SPCLib/blob/master/CONTRIBUTING.md

MIT licensed. Issues, PRs, and community script contributions are welcome.

<@&1556582143637979186> <@&1556579330170290228> <@&1556579451603652648>

### Knowledge Base

**Server Setup & Hosting**
- [Host a Linux VPS (Ubuntu 22.04)](https://chalwk.github.io/blog/2025/08/29/halo-how-to-host-a-ubuntu-vps/): Setup with Wine, VNC, firewall, SSH, and fail2ban.
- [Server Port Forwarding](https://chalwk.github.io/blog/2025/08/31/halo-server-port-forwarding/): Router config for UDP ports 2302 & server port, plus Windows/Linux firewall rules.
- [SAPP Server Guide](https://chalwk.github.io/blog/2026/04/02/halo-sapp-server-guide/): Pre-configured package: file structure, launch, multi-server expansion.

**Scripting Guides**
- [Scripting with SAPP](https://chalwk.github.io/blog/2026/05/17/halo-scripting-with-sapp/): Server-side Lua API: signature scanning, globals, core functions.
- [Scripting with Phasor](https://chalwk.github.io/blog/2026/05/17/halo-scripting-with-phasor/): Server-side Lua: version handling, hardcoded addresses.
- [Scripting with Chimera](https://chalwk.github.io/blog/2026/05/17/halo-scripting-with-chimera/): Client-side Lua: event callbacks, script placement, version compat.

**Alt References**
- [SAPP Command Reference](https://chalwk.github.io/blog/2026/05/17/halo-sapp-command-reference): Server commands, admin levels, usage.
- [Common Lua References](https://chalwk.github.io/blog/2026/05/17/halo-lua-common-references): Patterns, utilities, helpers for server & client scripting.
- [Understanding Memory Offsets](https://chalwk.github.io/blog/2025/09/07/halo-understanding-memory-offsets/): Addresses, offsets, signature scanning, tools for Halo PC/CE.
- [Modding References](https://chalwk.github.io/blog/2025/09/07/halo-modding-references/): Tag editing, map rebuilding, asset injection, community tools.

### Bug Reports
Post in **this thread** with a clear description: steps to reproduce, error messages, and context (script, map, or game mode). Or use the GitHub **Bug Report Form**.

**Feature Requests**
Share ideas here or submit through the GitHub **Feature Request Form**.

**Submit via GitHub (optional):**
- [Bug Report Form](https://github.com/Chalwk/SPCLib/issues/new?assignees=Chalwk&labels=Bug%2CNeeds+Triage&projects=&template=BUG_REPORT.yaml&title=%5BBUG%5D+%3Ctitle%3E)
- [Feature Request Form](https://github.com/Chalwk/SPCLib/issues/new?assignees=Chalwk&labels=Feature%2CNeeds+Review&projects=&template=FEATURE_REQUEST.yaml&title=%5BFEATURE%5D+%3Ctitle%3E)

Be clear and specific: include error messages, what you’ve tried, and any scripts or configs involved. This helps others help you faster.
```

#### Python Scripts: Self-contained utilities

```
A grab-bag of self-contained Python scripts.

The first script is `ipqs_lookup.py`: IPQualityScore proxy / VPN / Tor / fraud lookup with a transparent two-layer verdict.

Repo: https://github.com/Chalwk/python-scripts
Docs: https://chalwk.github.io/python-scripts/

MIT licensed. Issues and PRs welcome.

<@&1556578831630991471> <@&1556579451603652648>
```

#### JeriCraft: Minecraft Server

```
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

<@&1556579134744829953> <@&1556579330170290228> <@&1556579451603652648>
```

#### Paper-AutoMessages (Java MC Plugin)

```
AutoMessages is a PaperMC plugin that automatically broadcasts rich, interactive messages to the JeriCraft server at configurable intervals. It supports colored text, clickable links, hover tooltips, and command execution.

> Related discussion: <#1556743504699334708>

Repo: https://github.com/Chalwk/Paper-AutoMessages

**Key features**
- **Periodic announcements:** Broadcast messages in sequential order at a configurable interval (default: 600 seconds)
- **Rich text support:** Use Minecraft color codes (`&`) for colorful and formatted text
- **Interactive components:** Embed clickable and hoverable elements using JSON chat components-click actions include `open_url`, `run_command`, `suggest_command`, and `change_page`; hover actions include `show_text`, `show_item`, and `show_entity`
- **Flexible configuration:** Define any number of messages; each message can have any number of lines, mixing plain text and JSON components
- **Simple management:** `/automessages reload` to apply changes instantly, `/automessages status` to check current settings
- **Lightweight & efficient:** Scheduler runs with minimal overhead; messages are parsed and cached on reload

**Commands**
- `/automessages` or `/am` - Show the command usage
- `/automessages reload` - Reload the configuration file and restart the scheduler
- `/automessages status` - Display current interval, total messages, and next index

**Permissions**
- `automessages.use` - Allows using `/automessages` (default: op)
- `automessages.reload` - Allows reloading configuration (default: op)
- `automessages.*` - Wildcard for all permissions

MIT licensed. Issues and PRs are welcome.

<@&1556579134744829953> <@&1556579330170290228> <@&1556579451603652648>
```

#### Paper-BigBrother (Java MC Plugin)

```
Monitor player interactions with anvils, books, commands, portals, signs, and private messages. BigBrother gives you fine-grained control with customizable filters and per-feature notifications.

Repo: https://github.com/Chalwk/Paper-BigBrother

**Key features**
- **CommandSpy:** Monitor all commands executed by players with configurable exclusions
- **SignSpy:** Track sign interactions and edits, displaying written content
- **AnvilSpy:** Monitor anvil usage with item renaming information
- **BookSpy:** Track book writing and editing activities
- **PortalSpy:** Monitor portal travel between dimensions
- **Granular permissions:** Fine-grained control over each spy feature
- **Configurable filters:** Exclude specific commands, players, and worlds
- **Custom notifications:** Tailored notification formats for each spy type
- **Global & individual toggles:** Enable/disable the entire system or specific features
- **Player management:** Toggle spy features for individual players

**Commands**
- `/bigbrother` or `/bb` - Toggle all BigBrother spy features for yourself
- `/bigbrother reload` - Reload the plugin configuration
- `/bigbrother status` - Check which spy features you have enabled
- `/bigbrother commands` - Toggle command spy for yourself
- `/bigbrother signs` - Toggle sign spy for yourself
- `/bigbrother anvils` - Toggle anvil spy for yourself
- `/bigbrother books` - Toggle book spy for yourself
- `/bigbrother portals` - Toggle portal spy for yourself

**Permissions**
- `bigbrother.use` - Allows using BigBrother commands (default: op)
- `bigbrother.reload` - Allows reloading configuration (default: op)
- `bigbrother.*` - Wildcard for all BigBrother permissions (default: op)
- Per-spy toggle permissions for self and others are also available

MIT licensed. Issues and PRs are welcome.

<@&1556579134744829953> <@&1556579330170290228> <@&1556579451603652648>
```

#### Paper-GameModeManager (Java MC Plugin)

```
Store and restore player states per game mode. GameModeManager keeps separate inventories, health, hunger, experience, and potion effects for Creative and Survival modes.

Repo: https://github.com/Chalwk/Paper-GameModeManager

**Key features**
- **Per-gamemode player states:** Saves inventory, health, food, saturation, experience (total, level, progress), and active potion effects separately for Creative and Survival modes
- **Automatic state switching:** When a player changes gamemode, the current state is saved and the state of the new gamemode is applied
- **World-change awareness:** If a player teleports or portals to another world, the plugin remembers the gamemode they had before the world change and restores it after the world switch completes
- **Persistent storage:** All player data is saved to disk (`playerdata/.yml`) and loaded when the player joins; data is automatically saved on quit and during server shutdown
- **Reload support:** Configuration can be reloaded in-game without restarting the server

**Commands**
- `/gmmanage` or `/gmm` - Shows the help message
- `/gmmanage reload` - Reloads the `config.yml` file
- `/gmmanage help` - Displays the help message

**Permissions**
- `gmmanage.use` - Allows using the `/gmmanage` command (default: op)
- `gmmanage.reload` - Allows reloading the configuration (default: op)
- `gmmanage.*` - Grants all `gmmanage` permissions (default: op)

MIT licensed. Issues and PRs are welcome.

<@&1556579134744829953> <@&1556579330170290228> <@&1556579451603652648>
```

#### Paper-VacuLoot (Java MC Plugin)

```
VacuLoot is an item magnet system that automatically attracts nearby items and experience orbs to players. Features toggleable settings, multiple power tiers, and optional economy integration.

Repo: https://github.com/Chalwk/Paper-VacuLoot

**Key features**
- **Toggleable magnet** - Enable/disable item attraction with a simple command
- **4 power tiers** - Basic, Advanced, Ultimate, God
- **World restrictions** - Configure which worlds allow magnet functionality
- **Smart attraction** - Smooth movement respecting Minecraft physics
- **Economy integration** - Optional toggle cost with Vault support
- **XP orb attraction** - Optional experience orb collection
- **Item blacklist** - Exclude specific items from attraction
- **Configurable cooldown** - Prevent toggle spam
- **Per-player settings** - Admins can manage magnet states for others
- **Permission-based tiers** - Tie magnet power to player permissions

**Magnet tiers**
- **Basic:** 5 blocks, normal speed
- **Advanced:** 10 blocks, 20% faster
- **Ultimate:** 15 blocks, 50% faster
- **God:** 25 blocks, 2x speed

**Commands**
- `/magnet` or `/mag` - Toggle your magnet on/off
- `/magnet check` - Check your status and tier
- `/magnet help` - Show command help
- `/magnet <player>` - Toggle magnet for another player
- `/magnet tier <player> <tier>` - Set a player's magnet tier
- `/magnet reload` - Reload the plugin configuration

**Permissions**
- `magnet.use` - Use the magnet command (default: op)
- `magnet.use.others` - Toggle magnet for other players (default: op)
- `magnet.admin` - Admin management commands (default: op)
- `magnet.tier.basic` - Basic tier (default: true)
- `magnet.tier.advanced` - Advanced tier (default: op)
- `magnet.tier.ultimate` - Ultimate tier (default: op)
- `magnet.tier.god` - God tier (default: op)
- `magnet.*` - Wildcard for all VacuLoot permissions

MIT licensed. Issues and PRs are welcome.

<@&1556579134744829953> <@&1556579330170290228> <@&1556579451603652648>
```

#### OBS-Lua-Scripts

```
A collection of Lua scripts for OBS Studio, designed to automate and enhance your streaming setup.

Repo: https://github.com/Chalwk/OBS-Lua-Scripts

**Included scripts**
- **focus_standby.lua** - Focus and standby management
- **splash_mic_mute.lua** - Splash screen with microphone mute integration
- **webcam_fallback.lua** - Webcam fallback handling

MIT licensed. Issues and PRs are welcome.

<@&1556582143637979186> <@&1556579451603652648>
```

### contributing

```
Want to help improve one of my projects?

You can contribute scripts, fix typos, improve documentation, add features, or tidy up existing code.

Browse my repositories:
https://github.com/Chalwk?tab=repositories

Where a contributing guide exists, you'll find it at `CONTRIBUTING.md` in the repo root. The guides cover:
- How to submit a pull request
- Writing new scripts and features
- Updating documentation and site pages
- Front matter, file paths, and style conventions
- Testing your changes locally

If you have questions, ask in this forum: <#1556486004909543486>

Thanks for helping make my projects better for everyone.

**Tags used in this forum:** ❓ question; 💡 proposal; 🌱 first-pr; 🐍 script; 📝 docs; ⚙️ infra; ✅ answered; 🛠️ in-progress; 🔗 pr-open; 🎉 merged; ⏸️ on-hold; 🚫 wont-do; 💤 stale
```

### support

```
**Need help or found a bug?**

This forum handles both. Whether something is broken or you just need a hand, this is the place.

**For help questions**
- Which project or repo
- What you're trying to do
- What you've already tried
- The exact command, error, or behaviour that's confusing you
- Python version and OS, if relevant to a script

**For bug reports**
- Which project or repo (e.g. `python-scripts`, `chalwk.github.io`)
- Which script or page, if applicable (e.g. `netsec/ipqs_lookup.py`)
- Version number, if applicable (scripts: check the file header or run `--help`)
- The exact command you ran, if applicable
- What you expected to happen
- What actually happened, including the full error or traceback
- Steps to reproduce
- Python version and OS
- Any relevant dependencies or config

Keep it to one question or issue per post. If you have multiple, make separate posts.

If you're not sure whether something is a bug or just expected behaviour, still post. Just say you're unsure.

Prefer GitHub? Each repo has a Bug Report template under its Issues tab.
[Browse my repositories](https://github.com/Chalwk?tab=repositories) to find the one you need.

For security issues, or anything that could expose API keys or personal data, do not post details publicly.
Use the private security report on the affected repo's Security tab, or DM a moderator instead.

Please avoid DMing moderators about regular questions or bugs unless it's private or urgent.
Posting here keeps everything trackable and may help others.

Everyone is welcome to jump in and share solutions.

**Tags used in this forum:** 🐛 bug; 💥 crash; 📝 docs; 🌐 website; ✅ confirmed; 🔍 investigating; 🛠️ fix-in-progress; 🎉 resolved; 🔎 needs-info; 🔗 duplicate; 🚫 wontfix; ❓ question
```