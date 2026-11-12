---
title: "Halo: SAPP Server and Lua API Guide"
permalink: /halo/sapp/guide
description: "Complete guide to setting up, configuring, and running SAPP dedicated servers and writing server-side Lua scripts."
date: 2026-11-12
last-updated: 2026-11-13
categories: [ education, halo, modding, server ]
tags: [ sapp, lua, scripting, hosting, multiserver, server, tutorial ]
---

## Server Setup

This section covers running a Halo dedicated server with SAPP, starting from one of two pre-configured packages:

- `SAPP_PC.zip`: Halo PC (Retail)
- `SAPP_CE.zip`: Halo Custom Edition (CE)

Pick the package that matches your version of Halo. Both have the same layout, apart from the server executable and `motd.txt`, which ships in the CE package only.

First you get a single server running and learn what every file does. Then you convert it into a multiserver setup: more game modes on more ports, all sharing one set of admin files, maps, and SAPP binaries.

### Package Contents

This is the folder structure after extracting either zip:

```text
.                                        Root of the extracted server
|   haloded.exe or haloceded.exe         Dedicated server executable
|   motd.txt                             Message of the Day (CE only)
|   run.bat                              Windows launch script
|   run.sh                               Linux/Wine launch script
|   sapp.dll                             SAPP binary
|   strings.dll                          SAPP loader
|
+---cg                                   Instance configs
|   |   init.txt                         Server startup commands (run with -exec)
|   |
|   +---sapp                             SAPP configs for this instance
|   |   |   commands.txt                 Custom commands
|   |   |   events.txt                   Event scripting
|   |   |   init.txt                     SAPP settings
|   |   |   mapcycle.txt                 Map rotation
|   |   |   mapvotes.txt                 Map voting options
|   |   |
|   |   \---lua                          Lua scripts
|   |           sample_script.lua        Example Lua script
|   +---saved                            Server save data (profiles, playlists, hdmu.map)
|   |
|   \---savegames                        Game variant files
|
+---maps                                 All map files (.map)
|       beavercreek.map
|       bloodgulch.map
|       ... (all standard maps)
|
\---sapp                                 GLOBAL shared configs
        admins.txt                       Name/password admins (V2)
        areas.txt                        Custom map areas
        ipbans.txt                       IP ban list
        locations.txt                    Named teleport locations
        users.txt                        CD-key admins (V1)
```

Each package ships only the executable for its platform: `haloded.exe` for PC, `haloceded.exe` for CE.

Two folders are named `sapp`. The root `sapp\` holds global files shared by every instance. The `cg\sapp\` folder holds settings for one instance. Keep them straight, because the multiserver setup depends on the difference.

### File Reference

#### Root Files

- `haloded.exe` / `haloceded.exe`: The dedicated server executable (PC or CE).
- `sapp.dll`: The SAPP binary. Halo loads it when the `load` command runs.
- `strings.dll`: The SAPP loader. The `load` command needs it enabled and `sapp.dll` present.
- `motd.txt`: Message of the Day shown to joining players. CE only. It is set with `sv_motd`, and the package includes the file for convenience.
- `run.bat` / `run.sh`: Launch scripts for Windows and Linux/Wine. See [Run a Single Server](#run-a-single-server).

#### Global Configs (`sapp\`)

Every server instance of the same platform reads these files from the root `sapp\` folder.

- `admins.txt`: Name and password admins (V2). Each line holds a name, an MD5-hashed password, and a level, for example `AdminName;<md5_hash>;4`. Entries are normally created with `admin_add` or `admin_add_manually`. Log in once, admin everywhere.

- `areas.txt`: Custom rectangular or spherical areas, used by `event_aenter` / `event_aexit` and Lua events. Shared so triggers behave the same on every instance.

- `ipbans.txt`: IP bans, with CIDR ranges supported. A ban added on one instance applies to all instances of the same platform.

- `locations.txt`: Named X, Y, Z coordinates for teleport commands such as `t <player_id> <location_name>`.

- `users.txt`: CD-key admins (V1). Each entry holds a CD-key hash and a level, for example `AdminName;<admin index>;<cd_key_hash>;4:`, and can be limited to IP ranges. If a hash is cracked, anyone using that CD-key gets the admin level on join, so use IP ranges where you can. You can check a hash with the [Hash Checker tool][hash_checker_tool].

#### Instance Configs (`cg\`)

The `cg\` folder holds the config for one server instance.

- `cg\sapp\lua\`: Lua scripts for complex game modes. Load each one from `cg\sapp\init.txt` with `lua_load "filename"`, leaving off the `.lua` extension, and set `lua true` first. The package includes `sample_script.lua` as a starting point. See [Script Structure](#script-structure).

```lua
api_version = "1.12.0.0"

function OnScriptLoad()
    register_callback(cb.EVENT_JOIN, "OnJoin")
end

function OnJoin(player_id)
    cprint("sample_script.lua: Hello, " .. get_var(player_id, "$name"))
end

function OnScriptUnload() end
```

- `cg\saved\`: Server save data, including player profiles (`player_profiles\`), custom playlists (`playlists\`), and saved maps (`hdmu.map`).

- `cg\savegames\`: Custom game variant files. Refer to them from map cycles and votes.

- `cg\init.txt`: The startup script executed by the server at launch. It holds core server settings (`sv_name`, `sv_public`, `sv_rcon_password`, `sv_password`) and must end with the `load` command to initialize SAPP. (SAPP-specific settings belong in `cg\sapp\init.txt`).

- `cg\sapp\init.txt`: Configuration file loaded by SAPP after server startup. It controls Lua scripting (`lua`, `lua_load`), map rotation/voting (`sapp_mapcycle`, `mapvote`), game behavior (`no_lead`), message prefixes, RCON policies, and performance tunings (`custom_sleep`, `packet_limit`).

- `cg\sapp\commands.txt`: Custom commands for this instance. Each line is `command_name #arg1 #arg2... 'command1;command2...' level`.

- `cg\sapp\events.txt`: Event scripting without Lua. Lines define what runs when an event fires, such as `event_die` or `event_score`.

- `cg\sapp\mapcycle.txt`: The map rotation, used when `sapp_mapcycle true` is set. Format: `map:gametype:min_players:max_players` (min and max are optional).

- `cg\sapp\mapvotes.txt`: The maps and gametypes players can vote for, used when `mapvote true` is set. Format: `map:gametype:display_name:min_players:max_players`. Enabling map voting disables the map cycle.

#### Maps (`maps\`)

All `.map` files live here, shared by every instance. Drop a new map in and every instance can run it.

### Run a Single Server

1. Extract the zip anywhere, for example `C:\SAPP_CE` or `~/SAPP_CE`.
2. Optional: open `cg\init.txt` and change `sv_name "your_server_name_here"` to your server name.
3. Launch the server:
    - Windows: double-click `run.bat`.
    - Linux or macOS with Wine: run `chmod +x run.sh`, then `./run.sh`.

`run.bat` looks like this:

```bat
@ECHO OFF

rem Set the server port (default: 2302)
set PORT=2302

rem Get the absolute path of the directory where this script resides
set ROOT=%~dp0

rem Define instance config path and startup execution script
set CG_PATH=%ROOT%\cg\
set EXEC=%CG_PATH%\init.txt

rem Launch the server. Use haloded.exe for PC Retail, haloceded.exe for CE
"%ROOT%haloceded.exe" -path %CG_PATH% -exec %EXEC% -port %PORT%
```

And `run.sh` for Linux/Wine:

```bash
#!/usr/bin/env bash

# Set the server port (default: 2302)
PORT=2302

# Get the absolute path of the directory where this script resides
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Define instance config path and startup execution script
CG_PATH="${DIR}/cg"
EXEC="${CG_PATH}/init.txt"

# Launch the server. Use haloded.exe for PC Retail, haloceded.exe for CE
wine "${DIR}/haloceded.exe" -path "${CG_PATH}" -exec "${EXEC}" -port "${PORT}"
```

- `%~dp0` / `$DIR` expands to the folder the script sits in. That keeps the script portable.
- `-path` points at the instance configs (`cg\`).
- `-exec` points at that instance's `init.txt`.
- `-port` specifies the UDP port the server listens on (default Halo port is `2302`, but custom ports like `2310` are commonly used to avoid conflicts or run multiple servers).

The server console opens and SAPP loads. The console output confirms SAPP is active.

### Multi-Server Setup

Each extra instance is a small copy of `cg\` plus its own launch script and port. The executable, `sapp.dll`, the maps, and the global `sapp\` files stay in one place.

#### Step 1: Move the Original Instance

The original instance lives directly in `cg\`. Give it its own folder so more instances can sit beside it:

1. Create `cg\myserver\` (use any name).
2. Move `init.txt`, `sapp\`, `saved\`, and `savegames\` from `cg\` into `cg\myserver\`.
3. In `run.bat`, change `set CG_PATH=%ROOT%\cg\` to `set CG_PATH=%ROOT%\cg\myserver\`. In `run.sh`, change `CG_PATH="${DIR}/cg"` to `CG_PATH="${DIR}/cg/myserver"`.

#### Step 2: Copy the Instance

Copy `cg\myserver\` to a new folder named after the game mode, such as `cg\gun_game\`. Copying `saved\` and `savegames\` is optional: bring them only if the new instance needs the same save data or variants.

```text
cg\
+---myserver\           Original instance
|   +---sapp\
|   +---saved\          (optional)
|   +---savegames\      (optional)
|   \---init.txt
\---gun_game\           New instance, copied from myserver
    +---sapp\
    +---saved\          (optional)
    +---savegames\      (optional)
    \---init.txt
```

> [!CAUTION]
> Do not copy the root `sapp\` folder when creating new instances. The root `sapp\` folder is global and shared across all server instances.

#### Step 3: Customize the Copy

Edit these files inside `cg\gun_game\`:

- `init.txt`: Change `sv_name`, and optionally `sv_password`.
- `sapp\init.txt`: Adjust SAPP settings, such as map voting and which Lua scripts to load.
- `sapp\mapcycle.txt` or `sapp\mapvotes.txt`: Set the map rotation for this mode.
- `sapp\lua\`: Put the mode's Lua scripts here.

> [!IMPORTANT]
> `load` must always remain the final command in your instance `init.txt` file. Placing commands after `load` will cause them to be ignored.

#### Step 4: Pick a Port

Each instance needs its own UDP port. Create `run_gun_game.bat` next to `run.bat`:

```bat
@ECHO OFF

rem 2302 is taken by the first instance
set PORT=2303

rem Get the absolute path of the directory where this script resides
set ROOT=%~dp0

rem Define instance config path for gun_game and startup execution script
set CG_PATH=%ROOT%\cg\gun_game\
set EXEC=%CG_PATH%\init.txt

rem Launch the server. Use haloded.exe for PC Retail, haloceded.exe for CE
"%ROOT%haloceded.exe" -path %CG_PATH% -exec %EXEC% -port %PORT%
```

Open each UDP port in your firewall. On Linux, copy `run.sh` the same way and change `CG_PATH` and `PORT`.

#### Step 5: Launch Everything

Run each script by hand and each server gets its own console window. To start them all at once on Windows, open one Windows Terminal (`wt.exe`) tab per server with `run_all.bat`:

```bat
@ECHO OFF
cd /d "%~dp0"
wt.exe cmd /k "run.bat" ^
 ; new-tab cmd /k "run_gun_game.bat"
```

Or from a Command Prompt:

```bat
wt.exe cmd /k "run.bat" ; new-tab cmd /k "run_gun_game.bat"
```

Or from PowerShell, where the semicolon needs a backtick:

```powershell
wt.exe cmd /k "run.bat" `; new-tab cmd /k "run_gun_game.bat"
```

### Shared and Per-Instance Files

| Item                                                     | Location                   | Scope        |
| -------------------------------------------------------- | -------------------------- | ------------ |
| Server executable, `sapp.dll`, `strings.dll`, other DLLs | Root                       | Shared       |
| `.map` files                                             | `maps\`                    | Shared       |
| `admins.txt`, `users.txt`, `ipbans.txt`                  | `sapp\`                    | Shared       |
| `areas.txt`, `locations.txt`                             | `sapp\`                    | Shared       |
| `init.txt` (name, password, `load`)                      | `cg\<instance>\`           | Per instance |
| `init.txt`, `commands.txt`, `events.txt`                 | `cg\<instance>\sapp\`      | Per instance |
| `mapcycle.txt`, `mapvotes.txt`                           | `cg\<instance>\sapp\`      | Per instance |
| Lua scripts                                              | `cg\<instance>\sapp\lua\`  | Per instance |
| Game variants                                            | `cg\<instance>\savegames\` | Per instance |
| Server save data (profiles, playlists)                   | `cg\<instance>\saved\`     | Per instance |

What the split gives you:

- Shared admins and bans: Ban a player on one instance, and they are banned on all of them. Add an admin once and they are an admin everywhere. To change a global setting, edit one file and run `reload`.
- Small copies: A new instance is a few kilobytes of config. You never duplicate the executable, `sapp.dll`, or the maps.
- Isolation: Each instance has its own name, password, map rotation, and Lua scripts. A change to one never touches another.

---

## Scripting with SAPP

SAPP is a server-side extension for Halo PC/CE. It gives you a Lua API, anti-cheat, event hooks, commands, player management, and direct memory access. Scripts run on dedicated servers (`haloded.exe` / `haloceded.exe`).

### Runtime Environment

| Feature                     | Details                                                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Lua runtime                 | LuaJIT based on Lua 5.1                                                                                              |
| Lua 5.2+ syntax             | Partial (LuaJIT extensions): `goto` works, `_ENV` does not (use `setfenv`)                                           |
| `ffi` library               | Available via `require("ffi")`                                                                                       |
| `bit` library               | Available via `require("bit")` (NOT `bit32`)                                                                         |
| `table.new` / `table.clear` | Available via `require("table.new")` / `require("table.clear")`                                                      |
| `math.atan2`                | NOT available; use the guard in [Math and Geometry](../common-reference.md#math-and-geometry)                        |
| Sandboxing                  | Scripts run sandboxed; unsafe memory ops can crash the server                                                        |
| Global platform values      | `cb`, `halo_type`, `pid`, `lua_api_version`, `sapp_version`                                                          |
| Player index convention     | SAPP API uses 1-16; Halo internal memory uses 0-15 (see [Player Index Convention](#player-index-convention))         |
| Tick rate                   | 30 ticks/sec (1 tick ~ 33.3 ms); 1 WU = 3.048 m; more in [Timing and Units](../common-reference.md#timing-and-units) |

> [!WARNING]
> Scripts run sandboxed, but unsafe memory operations or invalid pointers will immediately crash the dedicated server. Always test memory-writing code in a non-production environment.

### Script Structure

Every script needs a global `api_version` and an `OnScriptLoad()`, or SAPP refuses to load it. Register callbacks in `OnScriptLoad()`. `OnScriptUnload()` and `OnError(message)` are optional; the latter receives Lua errors.

```lua
api_version = "1.12.0.0"

function OnScriptLoad()
    -- register event callbacks here
end

function OnScriptUnload() end
```

SAPP API functions only work after `OnScriptLoad()` starts. Run signature scans inside `OnScriptLoad()` or a function it calls, never at file scope. Do `get_var` and tag lookups in a runtime callback such as `OnStart` or `OnJoin`. Calling `OnStart()` from `OnScriptLoad()` is fine (it covers a script loaded mid-game) as long as it bails out when no game is running. `getTagId` is defined in [Get Tag ID](#get-tag-id).

```lua
local sniper_rifle

function OnScriptLoad()
    register_callback(cb.EVENT_GAME_START, "OnGameStart")
    register_callback(cb.EVENT_SPAWN, "OnSpawn")
    OnGameStart() -- in case the script was loaded mid-game
end

function OnGameStart()
    if get_var(0, "$gt") == "n/a" then return end

    sniper_rifle = getTagId("weap", "weapons\\sniper rifle\\sniper rifle")
end

---@param player_id number Player index.
function OnSpawn(player_id)
    if not sniper_rifle then return end

    local weapon = spawn_object("", "", 0, 0, 0, 0, sniper_rifle)
    if weapon ~= 0 then assign_weapon(weapon, player_id) end
end
```

### Callbacks

`register_callback(cb.EVENT_NAME, "GlobalFnName")` registers a global callback and `unregister_callback(cb.EVENT_NAME)` removes it. See [SAPP Lua API](#sapp-lua-api) for every available callback. Register only the ones the script uses.

---

## API Cheat Sheet

### Memory Read/Write

| Category        | Functions                                                                                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Byte            | `read_byte`, `write_byte`, `read_char`, `write_char`                                                                                                                                                                      |
| 16-bit          | `read_word`, `write_word`, `read_short`, `write_short`                                                                                                                                                                    |
| 32-bit unsigned | `read_dword`, `write_dword`                                                                                                                                                                                               |
| 32-bit signed   | `read_int`, `write_int`                                                                                                                                                                                                   |
| 32-bit float    | `read_float`, `write_float`                                                                                                                                                                                               |
| 64-bit float    | `read_double`, `write_double`                                                                                                                                                                                             |
| String          | `read_string`, `write_string` (null-terminated 8-bit)                                                                                                                                                                     |
| Bit             | `read_bit(addr, bit)`, `write_bit(addr, bit, val)`                                                                                                                                                                        |
| Vector          | `read_vector3d(addr)` returns `x, y, z`; `write_vector3d(addr, x, y, z)`                                                                                                                                                  |
| Safety (read)   | `safe_read(true/false)` prevents segfault on invalid reads; read functions return `nil` on failure; performance penalty                                                                                                   |
| Safety (write)  | `safe_write(true/false)` prevents segfault on invalid writes; allows writing to read-only memory (Halo's instructions); write functions return `true`/`false`; performance penalty; undo code patches in `OnScriptUnload` |

Bad addresses crash the server. Leave safe mode off unless you need it, since it costs performance. Pointers are in [Hardcoded Pointers](#pointers) and [Signatures](#signatures). Player, weapon, and vehicle offsets are in [Memory Offsets](../common-reference.md#memory-offsets) in the Common Reference, since Chimera uses the same ones.

Halo also stores many strings as UTF-16LE (player names, server name, gametype name, map display name). SAPP has no built-in wide-string reader. Use the `readWideString` helper in [Wide Strings](../common-reference.md#wide-strings). `read_string` returns `""` for these fields.

### Messaging

Do not mix these up.

| Function               | Destination                                |
| ---------------------- | ------------------------------------------ |
| `say(id, msg)`         | In-game chat, one player (1-16)            |
| `say_all(msg)`         | In-game chat, everyone                     |
| `rprint(id, msg)`      | One player's console (`~`)                 |
| `cprint(msg, [color])` | Server console only (players never see it) |

### Players, Objects, and Actions

| Function                                                                                    | Notes                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `player_present(id)`, `player_alive(id)`                                                    | Return booleans                                                                                                                                                           |
| `get_player(id)`                                                                            | Returns player table address                                                                                                                                              |
| `get_dynamic_player(id)`                                                                    | Returns dynamic memory address of the player, or `0` if dead                                                                                                              |
| `get_object_memory(object_id)`                                                              | Returns object address, or `0` if invalid                                                                                                                                 |
| `to_real_index(id)`, `to_player_index(real_index)`                                          | Convert between SAPP (1-16) and Halo (0-15) indices                                                                                                                       |
| `get_var(id, "$name")`, `set_var(id, "name", value, [copy_id])`                             | `get_var` returns strings; global vars use ID `0`. `set_var` returns `false` if undefined                                                                                 |
| `add_var(name, type)`, `del_var(name)`                                                      | Manage custom variables (types 0-5; see [Variables](#variables))                                                                                                          |
| `kill(id)`                                                                                  | Adds a death and applies respawn time                                                                                                                                     |
| `assign_weapon(object_id, id)`                                                              | Returns success; silently fails if dead or unable to take it (max 4 weapons)                                                                                              |
| `drop_weapon(id)`                                                                           | Drops current weapon                                                                                                                                                      |
| `enter_vehicle(vehicle_id, id, "seat")`, `exit_vehicle(id)`                                 | Supports multiple occupants per seat                                                                                                                                      |
| `camo(id, ticks)`                                                                           | No effect if already camouflaged                                                                                                                                          |
| `powerup_interact(object_id, id)`                                                           | Returns success                                                                                                                                                           |
| `spawn_object("class", "path", x, y, z, rotation, tag_id)`                                  | Returns object ID. `class`/`path` are required strings (pass `""`, `""` when spawning by `tag_id`). `x`/`y`/`z`/`rotation` default to `0`; `tag_id` overrides class/path. |
| `spawn_object_location("class", "path", "location", [rotation], [tag_id])`                  | Returns object ID. Spawns at a named location (see `loc_add`) instead of coordinates. `rotation` is radians. `tag_id` overrides class/path.                               |
| `spawn_projectile(tag_id, player_id, x, y, z, [rx, ry, rz])`                                | Returns object ID. `player_id` is the parent/owner; `rx`/`ry`/`rz` are optional rotation values (radians).                                                                |
| `destroy_object(object_id)`                                                                 | Destroying flags, oddballs, or non-SAPP vehicles may crash the server                                                                                                     |
| `sync_ammo(object_id)`                                                                      | Syncs loaded/unloaded ammo                                                                                                                                                |
| `intersect(x, y, z, vx, vy, vz, [ignore_object_id])`                                        | Performs 3D raycast collision test. See [Raycasting with intersect](#raycasting-with-intersect).                                                                          |
| `lookup_tag("weap", "weapons\\pistol\\pistol")` / `lookup_tag(tag_id)`                      | Returns tag address (`0` if not found); use the tag-ID form on protected maps                                                                                             |
| `execute_command(cmd, [id], [echo])`, `execute_command_sequence("cmd1;cmd2", [id], [echo])` | `id` runs commands on a player's behalf. Sequence splits on `;`. `echo = true` raises `EVENT_ECHO` with output.                                                           |
| `rand([min, max])`                                                                          | `max` is exclusive (see [Known SAPP Quirks](#known-sapp-quirks))                                                                                                          |
| `sig_scan("signature")`                                                                     | Returns match address, or `0` (see [Signature Scanning](#signature-scanning))                                                                                             |
| `timer(ms, "GlobalFn", [args...])`                                                          | See [SAPP timer()](#sapp-timer)                                                                                                                                           |

Tag class codes are the four-letter Halo class (`weap`, `vehi`, `eqip`, ...), not full words.

`get_var` names (`$gt`, `$map`, `$name`, `$score`, ...) are listed in [Variables](#variables). Global variables use player index `0`, and every value comes back as a string.

---

## Script Hygiene

### Security

Applies to anything driven by player input.

- Validate player indices, admin levels, numeric ranges, and types. Never `loadstring` or `load` player input.
- Rate-limit costly actions with per-player cooldowns.
- Treat client input as untrusted and log suspicious behavior for review.

### Performance

`EVENT_TICK` runs 30 times per second, so keep it lean.

- Queue or debounce frequent events (damage, weapon fire) and drain them with short timers (50-200 ms).
- Use separate queues for different priorities (score updates vs. log writes).

- Localize frequently used globals at file scope:

```lua
local table_insert = table.insert
local math_random = math.random
```

- Reuse tables from a pool to cut GC churn in hot paths:

```lua
local pool = {}

---@return table t Reusable table from the pool, or a new empty table.
local function newTable()
    return table.remove(pool) or {}
end

---@param t table Table to clear and return to the pool.
local function freeTable(t)
    for k in pairs(t) do t[k] = nil end
    pool[#pool + 1] = t
end
```

- Avoid forcing garbage collection. If you must, do it at a quiet moment (round end, idle).

---

## SAPP Lua API

This doubles as an API reference and EmmyLua / LuaLS script for Lua-aware editors (such as VS Code).

```lua
---@meta
-- SAPP Lua API (api_version "1.12.0.0") for EmmyLua and lua-language-server.
-- Runtime is LuaJIT (Lua 5.1).
--
-- Copyright (c) 2026 Jericho Crosby (Chalwk).
--

---@alias HaloType "PC" | "CE"

--- Platform of the running server. Case sensitive.
---@type HaloType
halo_type = nil

--- Process ID of the server.
---@type number
pid = nil

--- Lua API version of the loaded SAPP build.
---@type string
lua_api_version = nil

--- Loaded SAPP version.
---@type string
sapp_version = nil

-- Script lifecycle -------------------------------------------------------------------------

---@alias SappApiVersion
--- | "1.12.0.0" # SAPP 10.2.1
--- | "1.11.0.0" # SAPP 10.2.0

--- Required. The script refuses to load without it.
--- Select the API version matching the SAPP release; typing the value offers known versions.
---@type SappApiVersion
api_version = nil

--- Required. Called once when the script is loaded. Register callbacks here.
function OnScriptLoad() end

--- Optional. Called once when the script is unloaded. Useful for cleanup.
--- Not registered with `register_callback`.
function OnScriptUnload() end

--- Optional. Called when a Lua error occurs in a script. Not registered
--- with `register_callback`.
---@param message string The Lua error message
function OnError(message) end

---@alias SappEvent number

--- Event ids for register_callback. Hover a field for the callback signature.
---@class SappCallbackIds
---@field EVENT_ALIVE              SappEvent OnAlive(player_id). Once per second while a player is alive.
---@field EVENT_AREA_ENTER         SappEvent OnAreaEnter(player_id, area). Player enters a custom area.
---@field EVENT_AREA_EXIT          SappEvent OnAreaExit(player_id, area). Player exits a custom area.
---@field EVENT_ASSIST             SappEvent OnAssist(player_id). Player gets an assist.
---@field EVENT_BETRAY             SappEvent OnBetray(killer_id, victim_id). victim_id is a string. Player kills a teammate.
---@field EVENT_CAMP               SappEvent OnCamp(player_id). Anti-camp triggers.
---@field EVENT_CHAT               SappEvent OnChat(player_id, message, chat_type): boolean|nil. Return false to block. chat_type 0 global, 1 team, 2 vehicle.
---@field EVENT_COMMAND            SappEvent OnCommand(executor_id, command, environment, rcon_password): boolean|nil. Return false to block. environment 0 console, 1 rcon, 2 chat.
---@field EVENT_CUSTOM             SappEvent OnCustom(player_id, event_name). Raised by cevent.
---@field EVENT_DAMAGE_APPLICATION SappEvent OnDamageApplication(victim_id, causer_id, damage_tag_id, damage, collision_material, backtap): boolean|nil, number|nil. collision_material is a string. Return false to block, or true and a new damage value (do `return true, damage * 1.5`)
---@field EVENT_DIE                SappEvent OnDie(victim_id, killer_id). killer_id is a string: -1 server/falling/distance, 0 non-player source, 1+ player. Called after EVENT_KILL.
---@field EVENT_ECHO               SappEvent OnEcho(player_id, message). Output of execute_command(..., true).
---@field EVENT_GAME_END           SappEvent OnEnd(). Before the post game carnage report.
---@field EVENT_GAME_START         SappEvent OnStart(). A game begins.
---@field EVENT_JOIN               SappEvent OnJoin(player_id). Player fully joined.
---@field EVENT_KILL               SappEvent OnKill(killer_id, victim_id). victim_id is a string. Called before EVENT_DIE.
---@field EVENT_LEAVE              SappEvent OnLeave(player_id). Player disconnected.
---@field EVENT_LOGIN              SappEvent OnLogin(player_id). Admin logged in.
---@field EVENT_MAP_RESET          SappEvent OnMapReset(). sv_map_reset was executed.
---@field EVENT_OBJECT_SPAWN       SappEvent OnObjectSpawn(player_id, tag_id, parent_object_id, new_object_id, sapp_spawning): boolean|nil, number|nil. Return false to block, or true and a replacement tag id.
---@field EVENT_PREJOIN            SappEvent OnPreJoin(player_id). get_player() is not valid yet.
---@field EVENT_PRESPAWN           SappEvent OnPreSpawn(player_id). Spawned but not yet announced; biped is valid.
---@field EVENT_SCORE              SappEvent OnScore(player_id). Player scores a point.
---@field EVENT_SNAP               SappEvent OnSnap(suspect_id, snap_score). snap_score is a string. Requires aimbot_ban.
---@field EVENT_SPAWN              SappEvent OnSpawn(player_id). After the player spawned.
---@field EVENT_STICK              SappEvent OnStick(player_id, victim_id, object_id, victim_object_id, body_part).
---@field EVENT_SUICIDE            SappEvent OnSuicide(player_id).
---@field EVENT_TEAM_SWITCH        SappEvent OnTeamSwitch(player_id).
---@field EVENT_TICK               SappEvent OnTick(). Every tick (1/30 s).
---@field EVENT_VEHICLE_ENTER      SappEvent OnVehicleEnter(player_id, seat_index). seat_index is a string. 0 = Driver (all vehicles); Warthog/Rocket Hog: 1 = Passenger, 2 = Gunner; Tank: 1-4 = Passenger seats; Ghost/Turret/Banshee: Driver only (slot 0)
---@field EVENT_VEHICLE_EXIT       SappEvent OnVehicleExit(player_id).
---@field EVENT_WARP               SappEvent OnWarp(player_id).
---@field EVENT_WEAPON_DROP        SappEvent OnWeaponDrop(player_id, weapon_slot). weapon_slot is a string (0-3).
---@field EVENT_WEAPON_PICKUP      SappEvent OnWeaponPickup(player_id, weapon_slot, weapon_type). Strings. weapon_type 1 weapon (weapon_slot 0-3), 2 grenade (weapon_slot 1 frag, 2 plasma).

---@alias SappCallbackName
--- | "OnAlive"
--- | "OnAreaEnter"
--- | "OnAreaExit"
--- | "OnAssist"
--- | "OnBetray"
--- | "OnCamp"
--- | "OnChat"
--- | "OnCommand"
--- | "OnCustom"
--- | "OnDamageApplication"
--- | "OnDie"
--- | "OnEcho"
--- | "OnEnd"
--- | "OnStart"
--- | "OnJoin"
--- | "OnKill"
--- | "OnLeave"
--- | "OnLogin"
--- | "OnMapReset"
--- | "OnObjectSpawn"
--- | "OnPreJoin"
--- | "OnPreSpawn"
--- | "OnScore"
--- | "OnSnap"
--- | "OnSpawn"
--- | "OnStick"
--- | "OnSuicide"
--- | "OnTeamSwitch"
--- | "OnTick"
--- | "OnVehicleEnter"
--- | "OnVehicleExit"
--- | "OnWarp"
--- | "OnWeaponDrop"
--- | "OnWeaponPickup"

---@type SappCallbackIds
cb = {}

--- Registers a global function as the handler for an event.
---@param event         SappEvent
---@param callback_name SappCallbackName Name of a global callback function
function register_callback(event, callback_name) end

---@param event SappEvent
function unregister_callback(event) end

--- Variable names for get_var and set_var. Global variables use player id 0.
--- Custom variables made with add_var are also accepted.
---@alias SappVariable
--- | "$afk"       # (P: player) Seconds the player has been AFK
--- | "$app"       # (P: player) Bitfield: 1 SAPP, 2 Anticheat, 4 HAC2, 8 RefleX
--- | "$area"      # (E: event only) Area name for EVENT_AREA_ENTER / EVENT_AREA_EXIT
--- | "$assists"   # (P: player) Assist count
--- | "$blues"     # (G: global, use id 0) Players on blue team
--- | "$bluescore" # (G: global, use id 0) Blue team score
--- | "$botscore"  # (P: player) Aimbot score
--- | "$campkills" # (P: player) Kills while camping
--- | "$combo"     # (P: player) Current kill combo (resets after 4 s without a kill)
--- | "$deaths"    # (P: player) Deaths this game
--- | "$ename"     # (E: event only) Name passed to cevent for EVENT_CUSTOM
--- | "$ffa"       # (G: global, use id 0) 1 if FFA, 0 if teams
--- | "$gt"        # (G: global, use id 0) ctf, slayer, king, race, oddball, or n/a when no game is running
--- | "$hash"      # (P: player) CD-key hash
--- | "$hp"        # (P: player) Health as a decimal
--- | "$index"     # (E: event only) Weapon slot index for weapon drop/pickup
--- | "$invis"     # (P: player) 1 if active camo
--- | "$ip"        # (P: player) IP:Port
--- | "$killed"    # (E: event only) Victim player index for EVENT_KILL / EVENT_BETRAY
--- | "$killer"    # (E: event only) Killer player index for EVENT_DIE; -1 unknown, 0 AI/vehicle/world
--- | "$kills"     # (P: player) Kills this game
--- | "$lvl"       # (P: player) Admin level
--- | "$map"       # (G: global, use id 0) Loaded map
--- | "$mode"      # (G: global, use id 0) Game variant name
--- | "$n"         # (P: player) Player index
--- | "$name"      # (P: player) Player name
--- | "$oteam"     # (P: player) Opposite team name
--- | "$ping"      # (P: player) Ping in ms
--- | "$pn"        # (G: global, use id 0) Players on server (stale during EVENT_LEAVE, subtract 1)
--- | "$rand"      # (G: global, use id 0) Random number 1-16
--- | "$reds"      # (G: global, use id 0) Players on red team
--- | "$redscore"  # (G: global, use id 0) Red team score
--- | "$running"   # (G: global, use id 0) 1 if a game is running
--- | "$score"     # (P: player) Player score
--- | "$sh"        # (P: player) Shield as a decimal
--- | "$snapscore" # (E: event only) Aimbot score from the snap for EVENT_SNAP
--- | "$streak"    # (P: player) Kills since last respawn
--- | "$suicides"  # (P: player) Suicides this game
--- | "$svname"    # (G: global, use id 0) Server name
--- | "$team"      # (P: player) red or blue
--- | "$ticks"     # (G: global, use id 0) Ticks since match start
--- | "$tk"        # (P: player) Team kills this game
--- | "$type"      # (E: event only) Picked-up type for EVENT_WEAPON_PICKUP: 1 weapon, 2 grenade
--- | "$valid"     # (P: player) Whether the CD key is valid
--- | "$x"         # (P: player) Player X coordinate
--- | "$y"         # (P: player) Player Y coordinate
--- | "$z"         # (P: player) Player Z coordinate

-- Variables --------------------------------------------------------------------------------

--- Always returns a string. Wrap in tonumber() for math.
---@param player_id number                0 for globals; 1-16 for players
---@param variable  SappVariable | string
---@return string
function get_var(player_id, variable) end

--- Returns false if the variable is not defined.
---@param player_id number 0 for globals; 1-16 for players
---@param name      string Variable name without the leading "$"
---@param value     string
---@param copy_id?  number
---@return boolean
function set_var(player_id, name, value, copy_id) end

--- Variable type ids for add_var.
---@alias SappVarType
--- | 0 # Global string
--- | 1 # Global integer
--- | 2 # Global float
--- | 3 # Player string
--- | 4 # Player integer
--- | 5 # Player float

--- Creates a custom variable.
---@param name string
---@param type SappVarType
function add_var(name, type) end

---@param name string
function del_var(name) end

-- Memory -----------------------------------------------------------------------------------
-- A bad address crashes the server.

--- Reads an unsigned 8-bit integer.
---@param address number
---@return number
function read_byte(address) end

--- Reads a signed 8-bit integer.
---@param address number
---@return number
function read_char(address) end

--- Reads an unsigned 16-bit integer.
---@param address number
---@return number
function read_word(address) end

--- Reads a signed 16-bit integer.
---@param address number
---@return number
function read_short(address) end

--- Reads an unsigned 32-bit integer.
---@param address number
---@return number
function read_dword(address) end

--- Reads a signed 32-bit integer.
---@param address number
---@return number
function read_int(address) end

--- Reads a 32-bit float.
---@param address number
---@return number
function read_float(address) end

--- Reads a 64-bit float.
---@param address number
---@return number
function read_double(address) end

--- Writes an unsigned 8-bit integer.
---@param address number
---@param value   number
function write_byte(address, value) end

--- Writes a signed 8-bit integer.
---@param address number
---@param value   number
function write_char(address, value) end

--- Writes an unsigned 16-bit integer.
---@param address number
---@param value   number
function write_word(address, value) end

--- Writes a signed 16-bit integer.
---@param address number
---@param value   number
function write_short(address, value) end

--- Writes an unsigned 32-bit integer.
---@param address number
---@param value   number
function write_dword(address, value) end

--- Writes a signed 32-bit integer.
---@param address number
---@param value   number
function write_int(address, value) end

--- Writes a 32-bit float.
---@param address number
---@param value   number
function write_float(address, value) end

--- Writes a 64-bit float.
---@param address number
---@param value   number
function write_double(address, value) end

--- Reads a null-terminated 8-bit string. UTF-16LE fields (names) read as "", use a wide string helper.
---@param address number
---@param length? number
---@return string
function read_string(address, length) end

--- Writes a null-terminated 8-bit string.
---@param address number
---@param value   string
function write_string(address, value) end

---@param address number
---@param bit     number Bit index
---@return number bit 0 or 1
function read_bit(address, bit) end

---@param address number
---@param bit     number Bit index
---@param value   number 0 or 1
function write_bit(address, bit, value) end

---@param address number
---@return number x
---@return number y
---@return number z
function read_vector3d(address) end

---@param address number
---@param x       number
---@param y       number
---@param z       number
function write_vector3d(address, x, y, z) end

--- Toggles safe mode for reads. Costs performance, leave off unless needed.
---@param enabled boolean
function safe_read(enabled) end

--- Toggles safe mode for writes. Costs performance, leave off unless needed.
---@param enabled boolean
function safe_write(enabled) end

--- Known signatures. The comment shows the pointer name and how to resolve it from the match.
---@alias SappSignature
--- | "A3??????00A1??????0033DB3BC3"                                                       # banlist_header: read_dword(sig + 1)
--- | "68??????00E8??????0083C41068"                                                       # banlist_path_address: read_dword(sig + 0x1)
--- | "CCCCC605??????0000E8??????0085C0"                                                   # banlist_path_address2: read_dword(sig + 0x4)
--- | "CCCCBA??????002BD08A08"                                                             # broadcast_game_address: read_dword(sig + 0x3)
--- | "751768??????0068??????00BA"                                                         # broadcast_version_address: read_dword(sig + 0x3)
--- | "741F8B482085C9750C"                                                                 # color_patch1: patch address, use sig as is
--- | "EB1F8B482085C9750C"                                                                 # color_patch2: patch address, use sig as is
--- | "68??????0068??????0068000401006A00"                                                 # computer_name_address: read_dword(sig + 0x1)
--- | "8B3C85????????3BF9741FE8????????8B8E2C0200008B4610"                                 # ctf_globals: read_dword(sig + 3)
--- | "A1????????8B88080100008B410C"                                                       # game_globals_tag_slot: read_dword(sig + 1)
--- | "A1????????8B480C894D00"                                                             # gameinfo_header: read_dword(sig + 0x1)
--- | "B9360000008BF3BF????????"                                                           # gametype_base (CE only): read_dword(sig + 0x8), PC needs the hardcoded 0x671320
--- | "BE??????008BC68B4DF064890D000000005F5E5B8BE55DC36A0C"                               # hardware_info_address: read_dword(sig + 0x1)
--- | "8B42348A8C28D500000084C9"                                                           # kill_message_address: read_dword(sig + 3)
--- | "BF??????00F3ABB96B000000"                                                           # koth_globals: read_dword(sig + 0x1)
--- | "740ABB????5C00E8????0300"                                                           # logfile_path_address (CE only): read_dword(sig + 0x3)
--- | "66A3??????00890D??????00C3"                                                         # map_name_address: read_dword(sig + 0x2)
--- | "B8??????00E8??????0032C983F813"                                                     # map_name_address2: read_dword(sig + 0x1)
--- | "F3ABA1????????BA????????C740??????????E8????????668B0D"                             # network_struct: read_dword(sig + 3)
--- | "8B??3883C404????74??57FFD0"                                                         # nonslayer_score_patch: patch address, sig + 0x8
--- | "8B0D????????8B513425FFFF00008D"                                                     # object_header_pointer: read_dword(sig + 2)
--- | "BF??????00F3ABB951000000"                                                           # oddball_globals: read_dword(sig + 0x1)
--- | "DDD8A1??????008944244835"                                                           # player_header_pointer: read_dword(sig + 0x3)
--- | "68??????008D54245468"                                                               # profile_path_address: read_dword(sig + 0x1)
--- | "BF??????00F3ABB952000000"                                                           # race_globals: read_dword(sig + 0x1)
--- | "B8????????E8??000000A1????????55"                                                   # rcon_failed_address: read_dword(sig + 1)
--- | "7740BA??????008D9B000000008A01"                                                     # rcon_password_address: read_dword(sig + 0x3)
--- | "BA??????008BC72BD78A08880C024084C975F68B442404"                                     # server_ip_argument: read_dword(sig + 0x1)
--- | "F3ABA3??????00A3??????00A2??????00C705"                                             # server_password_address: read_dword(sig + 0x3)
--- | "0000BE??????005657C605"                                                             # server_path_address: read_dword(sig + 0x3)
--- | "668B0D??????000BF2C605"                                                             # server_port_address: read_dword(sig + 0x3)
--- | "5733C0B910000000BFE8E05B00F3ABB910000000"                                           # slayer_globals (CE only): read_dword(sig + 19)
--- | "74178B94242808000052518B8C24280800005157FFD083C4108B8424240800003BF8530F94C383FFFF" # slayer_score_patch: patch address, use sig as is
--- | "33C0BF??????00F3AB881D"                                                             # stats_globals: read_dword(sig + 0x3)
--- | "8B510C6A018915????????E8????????83C404"                                             # sv_map_reset_tick_address: read_dword(sig + 7)
--- | "8B2D????????807D0000C644240600"                                                     # tick_counter_sig: read_dword(read_dword(sig + 2)) + 0xC
--- | "8B0D????????83C8FF85C97E17"                                                         # timelimit_address: read_dword(sig + 2)

--- Finds a byte pattern ("??" is a wildcard). Returns the match address, or 0.
--- Guard against 0 before dereferencing.
--- See [Signature Scanning](#signature-scanning).
---@param signature string | SappSignature
---@return number address
function sig_scan(signature) end

-- Messaging --------------------------------------------------------------------------------

--- In-game chat, one player. Prefixes with `say_prefix` if set.
---@param player_id number
---@param message   string
function say(player_id, message) end

--- In-game chat, everyone. Prefixes with `say_prefix` if set.
---@param message string
function say_all(message) end

--- One player's console (~).
---@param player_id number
---@param message   string
function rprint(player_id, message) end

--- Prints to the dedicated server console only; players do not see this message in-game.
--- Optional color is a Windows console attribute: `foreground (0-15) + background (0-15) * 16`.
--- Example: green text on black:
--- ```lua
--- cprint("Hello", 10 + (0 * 16))
--- ```
--- See [Console Colors](#console-colors) for color values.
---@param message string
---@param color?  number Console color attribute (`0-255`); combines foreground and background colors.
function cprint(message, color) end

---@alias TagClass
--- | "weap" # Weapon
--- | "vehi" # Vehicle
--- | "eqip" # Equipment (powerups, grenades)
--- | "proj" # Projectile
--- | "bipd" # Biped
--- | "scen" # Scenery
--- | "mach" # Device machine
--- | "ctrl" # Device control
--- | "lifi" # Device light fixture
--- | "garb" # Garbage
--- | "plac" # Placeholder
--- | "ssce" # Sound scenery
--- | "jpt!" # Damage effect
--- | "effe" # Effect
--- | "snd!" # Sound
--- | "bitm" # Bitmap
--- | "matg" # Globals
--- | "scnr" # Scenario

-- Players and objects ----------------------------------------------------------------------

--- Player indices are 1-16; 0 is reserved for global/server context where supported.
---@param player_id number
---@return boolean
function player_present(player_id) end

---@param player_id number
---@return boolean
function player_alive(player_id) end

--- Static player table address.
--- See [Players, Objects, and Actions](#players-objects-and-actions).
---@param player_id number
---@return number address
function get_player(player_id) end

--- Dynamic player object address, or 0 if the player is dead.
--- See [Players, Objects, and Actions](#players-objects-and-actions).
---@param player_id number
---@return number address
function get_dynamic_player(player_id) end

--- Object address, or 0 if the id is invalid.
--- See [Players, Objects, and Actions](#players-objects-and-actions).
---@param object_id number
---@return number address
function get_object_memory(object_id) end

--- SAPP index (1-16) to Halo index (0-15).
--- See [Index Conversion](#index-conversion).
---@param player_index number
---@return number real_index
function to_real_index(player_index) end

--- Halo index (0-15) to SAPP index (1-16).
--- See [Index Conversion](#index-conversion).
---@param real_index number
---@return number player_index
function to_player_index(real_index) end

--- Adds a death and applies the respawn time.
---@param player_id number
function kill(player_id) end

--- Returns success. Silently fails if the player is dead or has 4 weapons.
--- Example:
--- ```lua
--- local weapon = spawn_object("weap", "weapons\\pistol\\pistol", 0, 0, 0)
--- if weapon ~= 0 then assign_weapon(weapon, 1) end
--- ```
---@param object_id number
---@param player_id number
---@return boolean
function assign_weapon(object_id, player_id) end

---@param player_id number
function drop_weapon(player_id) end

---@param vehicle_id number
---@param player_id  number
---@param seat       string
function enter_vehicle(vehicle_id, player_id, seat) end

---@param player_id number
function exit_vehicle(player_id) end

--- No effect if the player is already camouflaged.
--- Example:
--- ```lua
--- camo(1, 300) -- 10 seconds
--- ```
---@param player_id number
---@param ticks     number
function camo(player_id, ticks) end

--- Assigns a powerup to the player.
--- Example:
--- ```lua
--- local powerup = spawn_object("eqip", "powerups\\active camouflage", 0, 0, 0)
--- if powerup ~= 0 then powerup_interact(powerup, 1) end
--- ```
---@param object_id number
---@param player_id number
---@return boolean
function powerup_interact(object_id, player_id) end

--- Returns the object id (0 on failure). Pass "" for class and path when spawning by tag_id.
--- Example:
--- ```lua
--- local object_id = spawn_object("weap", "weapons\\pistol\\pistol", 0, 0, 0)
--- ```
--- Example using a tag ID:
--- ```lua
--- local object_id = spawn_object("", "", 0, 0, 0, 0, tag_id)
--- ```
---@param tag_class TagClass | string
---@param tag_path  string
---@param x?        number
---@param y?        number
---@param z?        number
---@param rotation? number            Radians
---@param tag_id?   number            Overrides tag_class and tag_path
---@return number object_id
function spawn_object(tag_class, tag_path, x, y, z, rotation, tag_id) end

--- Spawns at a named location (see loc_add).
--- Example:
--- ```lua
--- local object_id = spawn_object_location("weap", "weapons\\pistol\\pistol", "my_location")
--- ```
--- Example using a tag ID:
--- ```lua
--- local object_id = spawn_object_location("", "", "my_location", 0, tag_id)
--- ```
---@param tag_class TagClass | string
---@param tag_path  string
---@param location  string
---@param rotation? number            Radians
---@param tag_id?   number            Overrides tag_class and tag_path
---@return number object_id
function spawn_object_location(tag_class, tag_path, location, rotation, tag_id) end

--- Example:
--- ```lua
--- local projectile = spawn_projectile(projectile_tag_id, 1, 0, 0, 0)
--- ```
--- Example with rotation:
--- ```lua
--- local projectile = spawn_projectile(projectile_tag_id, 1, 0, 0, 0, 0, 0, math.pi / 2)
--- ```
---@param tag_id    number
---@param player_id number Parent/owner
---@param x         number
---@param y         number
---@param z         number
---@param rx?       number Radians
---@param ry?       number Radians
---@param rz?       number Radians
---@return number object_id
function spawn_projectile(tag_id, player_id, x, y, z, rx, ry, rz) end

--- Destroying flags, oddballs or non-SAPP vehicles may crash the server.
---@param object_id number
function destroy_object(object_id) end

--- Syncs loaded and unloaded ammo.
---@param object_id number
function sync_ammo(object_id) end

--- 3D raycast. The direction vector is multiplied by the reach in world units.
--- See [Raycasting with intersect](#raycasting-with-intersect).
---@param x                 number
---@param y                 number
---@param z                 number
---@param vx                number
---@param vy                number
---@param vz                number
---@param ignore_object_id? number
---@return boolean success
---@return number hit_x
---@return number hit_y
---@return number hit_z
---@return number hit_object_id 0xFFFFFFFF for map geometry or no hit
function intersect(x, y, z, vx, vy, vz, ignore_object_id) end

--- Returns the tag address, or 0 if not found. Use the tag id form on protected maps.
--- See [Players, Objects, and Actions](#players-objects-and-actions).
---@overload fun(tag_id: number): number
---@param tag_class TagClass | string Four-letter class, e.g. "weap"
---@param tag_name  string
---@return number address
function lookup_tag(tag_class, tag_name) end

-- Commands and timers ----------------------------------------------------------------------

--- player_id runs the command on a player's behalf. echo = true raises EVENT_ECHO with the output.
---@param command    string
---@param player_id? number
---@param echo?      boolean
function execute_command(command, player_id, echo) end

--- Splits on ";". Use single-quoted Lua strings with double-quoted arguments.
--- Example:
--- ```lua
--- execute_command_sequence('say_all "Hello world";god 1')
--- ```
---@param commands   string
---@param player_id? number
---@param echo?      boolean
function execute_command_sequence(commands, player_id, echo) end

--- The upper bound is exclusive: rand(1, 4) returns 1-3.
---@param min? number
---@param max? number
---@return number
function rand(min, max) end

--- Calls a global function once after delay ms. The callback returns true to repeat. Returns nil.
---@param delay         number Milliseconds
---@param callback_name string Name of a global function
---@param ...           any    Forwarded to the callback
function timer(delay, callback_name, ...) end
```

---

## Utilities and Helpers

### Player Index Convention

- SAPP API functions use player indices 1-16; Halo memory tables and arrays use 0-15.
- Check `player_present(i)` and `player_alive(i)` before accessing player data.
- `get_dynamic_player(i) == 0` means the player is dead. It is redundant if `player_alive(i)` is already checked.

> [!IMPORTANT]
> SAPP API functions use 1-16 player indices, whereas internal Halo memory tables and arrays are 0-15. Always convert indices using `to_real_index()` when accessing zero-based memory arrays.

```lua
if player_present(player_id) and player_alive(player_id) then
    local dyn = get_dynamic_player(player_id)
    if dyn ~= 0 then
        -- ...
    end
end
```

#### Index Conversion

1. `to_real_index(player_index)` converts a SAPP index (1-16) to a Halo index (0-15). Use it for zero-based memory arrays.
2. `to_player_index(real_index)` converts a Halo index (0-15) to a SAPP index (1-16). Use it for SAPP API calls.

Example 1: using `to_real_index`

```lua
function OnTick()
    for i = 1, 16 do
        if player_present(i) then
            local real = to_real_index(i)
            local checkpoint_addr = race_globals + 0x44 + (real * 4)
            local checkpoint = read_dword(checkpoint_addr)
        end
    end
end
```

Example 2: using `to_player_index`

```lua
function OnTick()
    local tick_id = read_dword(tick_counter_address)
    for i = 1, 16 do
        local dyn = get_dynamic_player(i)
        if dyn == 0 or not player_alive(i) then goto continue end

        for j = 0, 3 do
            local struct = dyn + 0x430 + (j * 0x10)
            local damager_time = read_dword(struct)

            if damager_time == tick_id then
                local internal_idx = read_word(struct + 0xC)
                if internal_idx == 0xFFFF then goto continue end

                local damager = to_player_index(internal_idx)
                if player_present(damager) then
                    say(damager, "You damaged a teammate!")
                end
            end
        end
        ::continue::
    end
end
```

### Signature Scanning

`sig_scan` finds byte patterns (`??` = wildcard) and works on both PC and CE. It returns the match-start address or `0`. Add the offset, then `read_dword` to get the pointer. Always check for `0`.

> [!WARNING]
> Calling `read_dword()` on an unguarded `sig_scan()` result will crash the server if the signature returns `0`. Always validate that `sig_scan` matches successfully before dereferencing pointers.

- `halo_type` is a case-sensitive string: `"PC"` or `"CE"`. Use it only as a fallback when no reliable signature exists.
- Pre-computed signatures: [Signatures](#signatures).
- Hardcoded PC/CE pointer table: [Hardcoded Pointers](#pointers).

Some CE patterns do not match on PC because the compilers emitted different instruction shapes for the same code. The `gametype_base` sig is one example. Always use the version-fallback form below rather than returning early on sig failure.

```lua
-- Returns the pointer at sig_scan(sig) + offset, or nil if invalid.
-- Guards against sig_scan returning 0 and against read_dword returning
-- something outside Halo's data range (0x400000-0x800000).
---@param sig string Signature byte pattern to scan for.
---@param offset number Offset from the signature match to the pointer.
---@return number|nil ptr Resolved pointer, or nil if invalid.
local function safeScan(sig, offset)
    local hit = sig_scan(sig)
    if hit == 0 then return nil end

    local ptr = read_dword(hit + offset)
    if not ptr or ptr < 0x400000 or ptr > 0x800000 then return nil end
    return ptr
end

local network_struct_address, gametype_base_address

function OnScriptLoad()
    -- Sig that works on both PC and CE. Fallback is here for robustness.
    network_struct_address = safeScan("F3ABA1????????BA????????C740??????????E8????????668B0D", 0x3)
        or (halo_type == 'PC' and 0x745B80 or 0x6C7960)

    -- Sig that works on CE but returns 0 on PC (different instruction shape). Fallback handles PC.
    gametype_base_address = safeScan("B9360000008BF3BF????????", 0x8)
        or (halo_type == 'PC' and 0x671320 or 0x5F5478)
end

-- Returns the current server's name (UTF-16LE).
---@return string|nil server_name Server name, or nil if the network struct pointer is unavailable.
local function getServerName()
    if not network_struct_address then return nil end
    return readWideString(network_struct_address + 0x8, 0x42)
end

-- Returns the current gametype's score limit.
---@return number|nil score_limit Score limit, or nil if the gametype pointer is unavailable.
local function getScoreLimit()
    if not gametype_base_address then return nil end
    return read_byte(gametype_base_address + 0x58)
end
```

Notes:

- Calling `read_dword(sig_scan(...) + offset)` unguarded crashes the server when `sig_scan` returns `0`. The `safeScan` helper above checks `sig_scan ~= 0`, that `read_dword` returns a number, and that the number is in Halo's data range.
- Do not return early when a sig fails. A single-platform miss disables the entire script on the other platform. Fall back to the hardcoded value via the `or` expression shown above.
- Wildcard the address bytes rather than embedding a specific immediate. This survives builds where the address moves but not when the instruction shape changed (as with `gametype_base` on PC).
- `readWideString` is defined under [Wide Strings](../common-reference.md#wide-strings).
- Some pointers have no signature at all. `map_pointer` is a static data slot the map loader writes once per load; no fixed instruction references it. Pick the value by `halo_type` from [Hardcoded Pointers](#pointers).

### SAPP timer()

`timer(ms, "GlobalFnName", [args...])`

- Calls global `GlobalFnName` once after `ms`, forwarding any extra args. It cannot be a local or anonymous function.
- `timer()` returns `nil`, so there is no cancellation handle.
- Callback return: `true` repeats indefinitely; `false`, `nil`, or no return fires once. Other types do not repeat.
- `lua_unload` disables the script's timers.
- SAPP API functions are globals, so `timer` can call them directly (see [Assigning Weapons](#assigning-weapons)).

```lua
---@param player_id number Player index (1-16).
function OnJoin(player_id)
    timer(3000, "Welcome", player_id)
end

---@param player_id number Player index (1-16).
function Welcome(player_id)
    if player_present(player_id) then -- They may have left during the delay.
        say(player_id, "Welcome!")
    end
end
```

### Player and Chat

#### Message Excluding a Player

Sends a chat message to every connected player except one.

```lua
---@param message string The message to send.
---@param exclude_player_id number Player index (1-16) to skip.
local function sendExclude(message, exclude_player_id)
    for i = 1, 16 do
        if player_present(i) and i ~= exclude_player_id then
            say(i, message)
        end
    end
end
```

Use case: announce "Player X found the secret" without revealing it to X.

#### Get Player Vehicle

Returns the vehicle object address the player is currently occupying, or `nil` if none.

```lua
---@param player_id number Player index (1-16).
---@return number|nil vehicle_object Vehicle object address, or nil.
local function getPlayerVehicleObject(player_id)
    if not player_present(player_id) or not player_alive(player_id) then return nil end

    local dyn = get_dynamic_player(player_id)
    if dyn == 0 then return nil end

    local vehicle_id = read_dword(dyn + 0x11C)
    if vehicle_id == 0xFFFFFFFF then return nil end

    local vehicle_object = get_object_memory(vehicle_id)
    return vehicle_object ~= 0 and vehicle_object or nil
end
```

#### Vehicle Occupied Check

```lua
---@param vehicle_object number Memory address of the vehicle.
---@return boolean occupied True if at least one player is inside.
local function isVehicleOccupied(vehicle_object)
    for i = 1, 16 do
        if getPlayerVehicleObject(i) == vehicle_object then
            return true
        end
    end
    return false
end
```

Example: eject any player who enters a reserved vehicle.

#### Player Invisible Check

Detects active camouflage or script-based invisibility.

```lua
---@param player_id number Player index (1-16).
---@return boolean invisible True if invisible.
local function isPlayerInvisible(player_id)
    local dyn = get_dynamic_player(player_id)
    if dyn == 0 then return false end

    return read_float(dyn + 0x37C) == 1
end
```

#### Clear Console

Prints blank lines to push previous messages out of view.

```lua
---@param player_id number Player index (1-16).
local function clearConsole(player_id)
    for _ = 1, 25 do
        rprint(player_id, " ")
    end
end
```

#### Teleport Player or Object

Writes the position and forward vector straight to a player's dynamic object or a vehicle.

```lua
---@param object number Dynamic player or vehicle memory address.
---@param x number Target X coordinate.
---@param y number Target Y coordinate.
---@param z number Target Z coordinate.
---@param rotation number Rotation in radians.
---@param z_offset number|nil Vertical lift. Defaults to 0.3.
local function teleportPlayer(object, x, y, z, rotation, z_offset)
    z_offset = z_offset or 0.3
    write_vector3d(object + 0x5C, x, y, z + z_offset)
    write_vector3d(object + 0x74, math.cos(rotation), math.sin(rotation), 0)
end
```

Offset `0x5C` is the object's position and `0x74` is its forward vector. For vehicles, also apply the physics fix under [Known SAPP Quirks](#known-sapp-quirks).

#### Get Player Position

Returns the player's eye-level position, accounting for vehicles and crouching. `read_vector3d` is SAPP only; Chimera reads three floats (see [Position and Aim](../common-reference.md#position-and-aim)).

```lua
---@param dyn_player number Dynamic player address.
---@return number|nil x, number|nil y, number|nil z Player X, Y, and eye-level Z coordinates, or nil if the object is invalid.
local function getPlayerPosition(dyn_player)
    local crouch = read_float(dyn_player + 0x50C) -- 0 = standing, 1 = fully crouched
    local vehicle_id = read_dword(dyn_player + 0x11C)

    -- Seated players use the vehicle's position:
    local object = vehicle_id == 0xFFFFFFFF and dyn_player or get_object_memory(vehicle_id)
    if object == 0 then return nil end

    local x, y, z = read_vector3d(object + 0x5C)
    return x, y, z + 0.65 - (0.3 * crouch)
end
```

#### Shared Helpers

These work on a pointer and are the same on SAPP and Chimera, so they live in the [Common Reference](../common-reference.md#offset-helpers):

- `inVehicle`, `getWeaponSlot`, `isLowAmmo`: [Vehicle and Weapon](../common-reference.md#vehicle-and-weapon)
- `getAimVector`: [Position and Aim](../common-reference.md#position-and-aim)
- `getHealthAndShields`, `getHealthPercent`, `getShieldsPercent`: [Health and Shields](../common-reference.md#health-and-shields)
- `getSpeed`: [Speed](../common-reference.md#speed)
- `getTeamName`, `getKdRatio`, `getColorName`: [Static Player Fields](../common-reference.md#static-player-fields)
- `readPlayerName`: [Wide Strings](../common-reference.md#wide-strings)

For names and teams, prefer `get_var(player_id, "$name")` and `get_var(player_id, "$team")`.

#### Get Player Ping

```lua
---@param player_id number Player index (1-16).
---@return number|nil ping Player ping in milliseconds, or nil if unavailable.
local function getPlayerPing(player_id)
    local static = get_player(player_id)
    if not static then return nil end
    return read_dword(static + 0xDC)
end
```

#### Get Player Score

Reads the player's score for the current gametype. See `oddball_globals` in [Pointers](#pointers) before using this helper.

```lua
local function getPlayerScore(player_id)
    local static_player = get_player(player_id)
    if not static_player then return 0 end

    local gametype = get_var(0, "$gt")
    if gametype == "ctf" then -- CTF (flag scores)
        return read_word(static_player + 0xC8)
    elseif gametype == "slayer" then -- Slayer (kills minus betrays/suicides)
        local kills = read_word(static_player + 0x9C)
        local team_play = get_var(0, "$ffa") ~= "1"
        local penalties = read_word(static_player + (team_play and 0xAC or 0xB0))
        return kills - penalties
    elseif gametype == "oddball" then -- Oddball (time with ball in seconds)
        local ticks = read_dword(oddball_globals + 0x44 + to_real_index(player_id) * 4)
        return math.floor(ticks / 30)
    elseif gametype == "king" then -- KOTH (hill time in seconds)
        return math.floor(read_word(static_player + 0xC4) / 30)
    elseif gametype == "race" then -- Race (laps completed)
        return read_word(static_player + 0xC6)
    end
    return 0
end
```

#### Set Player Color

A respawn is usually required for the change to fully apply. Color values are listed under [Team and Color](../common-reference.md#team-and-color).

```lua
---@param player_id number Player index (1-16).
---@param color number Color index (0-17).
local function setPlayerColor(player_id, color)
    local static = get_player(player_id)
    write_byte(static + 0x60, color)
end
```

#### Spawning Projectiles

```lua
-- Example: Fire a rocket projectile from a player's position
local ROCKET_PROJECTILE_TAG_ID = getTagId("proj", "weapons\\rocket launcher\\rocket")
local rocket_projectile = spawn_projectile(
    ROCKET_PROJECTILE_TAG_ID,
    player_id,
    x, y, z,
    rx, ry, rz -- Optional rotation in radians (defaults to 0, 0, 0 if omitted)
)
```

#### Vanish Player

Moves a player far off-map so others cannot see them. Call it every tick to keep them hidden.

```lua
---@param player_id number Player index (1-16).
local function vanishPlayer(player_id)
    if not player_present(player_id) then return end

    local dyn = get_dynamic_player(player_id)
    if dyn == 0 then return end

    local x, y, z = getPlayerPosition(dyn)
    if not x then return end

    local static = get_player(player_id)
    write_float(static + 0xF8, x - 1000)
    write_float(static + 0xFC, y - 1000)
    write_float(static + 0x100, z - 1000)
end
```

#### Override Respawn Time

Writes to the static player table to change the respawn delay.

```lua
---@param player_id number Player index (1-16).
---@param respawn_time number|nil Seconds until respawn. Defaults to 3.
local function setRespawnTime(player_id, respawn_time)
    if not player_present(player_id) then return end

    -- The timer is stored in ticks (30 per second).
    write_dword(get_player(player_id) + 0x2C, (respawn_time or 3) * 30)
end
```

#### Get Base Directory

Finds the Halo server folder at runtime.

```lua
-- Resolves the pointer at sig_scan(sig) + offset, or returns nil if the scan
-- missed or the dereferenced value is outside Halo's data range.
---@param sig string Signature byte pattern to scan for.
---@param offset number Offset from the signature match to the pointer.
---@return number|nil ptr Resolved pointer, or nil if invalid.
local function resolvePointer(sig, offset)
    local hit = sig_scan(sig)
    if hit == 0 then return nil end

    local ptr = read_dword(hit + offset)
    if not ptr or ptr < 0x400000 or ptr > 0x800000 then return nil end

    return ptr
end

---@param folder string|nil Subfolder to append. Defaults to "".
---@return string|nil base_path Halo server directory path (with optional subfolder), or nil if the lookup failed.
local function getBaseDir(folder)
    folder = folder or ""

    local exe_path_ptr = resolvePointer("0000BE??????005657C605", 0x3)
    if not exe_path_ptr then return nil end

    local exe_path = read_string(exe_path_ptr)
    if not exe_path or exe_path == "" then return nil end

    local base_path = exe_path:match("(.*\\)")
    if not base_path then return nil end

    return base_path .. folder
end

---@return string|nil config_path Path to the SAPP configuration file, or nil if the lookup failed.
local function getProfilePath()
    local ptr = resolvePointer("68??????008D54245468", 0x1)
    if not ptr then return nil end
    return read_string(ptr)
end
```

Both functions can return `nil`, so check before concatenating:

```lua
local base = getBaseDir()
local maps = getBaseDir("maps")
local sapp_cg = getProfilePath()

if base then cprint("Server dir: " .. base) end
if maps then cprint("Maps dir: " .. maps) end
if sapp_cg then cprint("SAPP cfg: " .. sapp_cg) end
```

Or fall back to a relative path in one expression:

```lua
local maps = getBaseDir("maps") or "maps\\"
```

### Vehicle and Weapon Functions

#### Get Object Tag

Returns the object type byte and the tag name of any object.

```lua
---@param object number Memory address of the object.
---@return number object_type, string tag_name Object type identifier (byte at offset 0xB4) and full tag path.
local function getTagFromObject(object)
    local object_type = read_byte(object + 0xB4)
    local tag_index = read_word(object)
    local tag_array = read_dword(0x40440000)
    local tag_address = tag_index * 0x20 + tag_array
    local tag_name = read_string(read_dword(tag_address + 0x10))
    return object_type, tag_name
end
```

Example:

```lua
---@param player_id number Player index (1-16).
function OnVehicleEnter(player_id)
    local dyn = get_dynamic_player(player_id)
    if dyn == 0 then return end

    local vehicle_id = read_dword(dyn + 0x11C)
    if vehicle_id == 0xFFFFFFFF then return end

    local vehicle_obj = get_object_memory(vehicle_id)
    if vehicle_obj == 0 then return end

    local object_type, tag_name = getTagFromObject(vehicle_obj)
    cprint(object_type .. " " .. tag_name, 11)
end
```

#### Has Objective Check

Tests whether a player is holding a flag or oddball.

```lua
local BASE_TAG_TABLE = 0x40440000 -- same for PC and CE

---@param dyn_player number Dynamic player address.
---@param objective_type string|nil "oddball", "flag", or "any". Defaults to "any".
---@return boolean holding True if holding the specified objective.
local function hasObjective(dyn_player, objective_type)
    objective_type = objective_type or "any"

    local weapon_id = read_dword(dyn_player + 0x118)
    local weapon_obj = get_object_memory(weapon_id)
    if not weapon_obj or weapon_obj == 0 then return false end

    local tag_array = read_dword(BASE_TAG_TABLE)
    local tag_index = read_word(weapon_obj)
    local tag_entry = tag_array + tag_index * 0x20
    local tag_data = read_dword(tag_entry + 0x14)

    if read_bit(tag_data + 0x308, 3) ~= 1 then return false end

    local obj_byte = read_byte(tag_data + 2)
    return (objective_type == "oddball" and obj_byte == 4) or
            (objective_type == "flag" and obj_byte == 0) or
            (objective_type == "any" and (obj_byte == 4 or obj_byte == 0))
end
```

#### Get Inventory

Returns a table of all weapon slots (1-4) with detailed stats. Empty slots are omitted. Grenade counts belong to the player, so they are repeated on every slot entry.

```lua
---@class WeaponInventoryEntry
---@field id number Weapon tag ID.
---@field ammo number Primary reserve ammunition.
---@field clip number Primary magazine ammunition.
---@field ammo2 number Secondary reserve ammunition.
---@field clip2 number Secondary magazine ammunition.
---@field heat number Weapon overheat value (0-1).
---@field frags number Player frag grenade count.
---@field plasmas number Player plasma grenade count.

---@param dyn_player number Dynamic player address.
---@return table<number, WeaponInventoryEntry> inventory Weapon inventory indexed by slot (1-4).
local function getInventory(dyn_player)
    local inv = {}
    for slot = 0, 3 do
        local weapon_id = read_dword(dyn_player + 0x2F8 + slot * 4)
        local weapon_obj = get_object_memory(weapon_id)
        if weapon_obj and weapon_obj ~= 0 then
            inv[slot + 1] = {
                id = read_dword(weapon_obj),
                ammo = read_word(weapon_obj + 0x2B6),
                clip = read_word(weapon_obj + 0x2B8),
                ammo2 = read_word(weapon_obj + 0x2C6),
                clip2 = read_word(weapon_obj + 0x2C8),
                heat = read_float(weapon_obj + 0x240),
                frags = read_byte(dyn_player + 0x31E),
                plasmas = read_byte(dyn_player + 0x31F)
            }
        end
    end
    return inv
end
```

### Tag and Map Helpers

The tag table base is documented under [Tag Table](#tag-table) and the entry layout under [Tag Entry](../common-reference.md#tag-entry).

`classToDword` is defined under [Tag Entry Helpers](../common-reference.md#tag-entry-helpers).

#### Find Tag

Scans the tag table for a tag whose name contains a substring (case-insensitive). Optionally filter by class.

```lua
---@param substring string Text to search for.
---@param class_filter string|nil Optional class filter, e.g. "weap" or "vehi".
---@return number|nil meta_index Meta index of the first match.
local function findTagBySubstring(substring, class_filter)
    substring = substring:lower()
    local tag_array = read_dword(BASE_TAG_TABLE)
    local tag_count = read_dword(BASE_TAG_TABLE + 0xC)
    local filter_class = class_filter and classToDword(class_filter) or nil

    for i = 0, tag_count - 1 do
        local tag = tag_array + 0x20 * i
        if filter_class and read_dword(tag) ~= filter_class then goto continue end

        local name_ptr = read_dword(tag + 0x10)
        if name_ptr and name_ptr ~= 0 then
            local name = read_string(name_ptr)
            if name and name:lower():find(substring, 1, true) then
                return read_dword(tag + 0xC)
            end
        end
        ::continue::
    end
    return nil
end
```

Example:

```lua
local rocket_meta = findTagBySubstring("rocket", "weap")
if rocket_meta then
    spawn_object("", "", 100, 100, 100, 0, rocket_meta)
end
```

#### Get Flag Data

Finds the flag (objective) tag on the current map. Returns its meta id and tag name, or `nil` if there is no flag.

```lua
---@return number|nil meta_id, string|nil tag_name Flag weapon tag meta ID and path, or nil if no flag exists.
local function getFlagData()
    local tag_array = read_dword(BASE_TAG_TABLE)
    local tag_count = read_dword(BASE_TAG_TABLE + 0xC)
    for i = 0, tag_count - 1 do
        local tag = tag_array + 0x20 * i
        if read_dword(tag) == 0x77656170 then -- weap
            local tag_data = read_dword(tag + 0x14)
            if read_bit(tag_data + 0x308, 3) == 1 and read_byte(tag_data + 2) == 0 then
                local meta = read_dword(tag + 0xC)
                local name = read_string(read_dword(tag + 0x10))
                return meta, name
            end
        end
    end
    return nil, nil
end
```

#### Get Tag ID

Wrapper around `lookup_tag` that returns the tag ID (meta id) you pass to `spawn_object` and similar functions. `lookup_tag` returns `0` when the tag does not exist.

```lua
---@param class string Tag class, e.g. "weap".
---@param name string Tag path, e.g. "weapons\\pistol\\pistol".
---@return number|nil tag_id Tag meta ID, or nil if the tag does not exist.
local function getTagId(class, name)
    local tag = lookup_tag(class, name)
    if tag == 0 then return nil end
    local meta_id = read_dword(tag + 0xC)
    return meta_id ~= 0 and meta_id or nil
end
```

#### Scan Map Objects

Prints tag information for every weapon, vehicle, and equipment tag on the map. Handy during development. It will not work on protected maps or some custom maps.

```lua
local function scanMapObjects()
    -- Read the tag table base address and total number of entries.
    local tag_array = read_dword(BASE_TAG_TABLE)
    local tag_count = read_dword(BASE_TAG_TABLE + 0xC)

    -- Map-specific tag class dwords to their four-letter identifiers.
    local class_names = {
        [0x76656869] = "vehi",
        [0x77656170] = "weap",
        [0x65716970] = "eqip"
    }

    -- Iterate through every tag entry (each entry is 0x20 bytes).
    for i = 0, tag_count - 1 do
        local tag = tag_array + 0x20 * i

        -- Identify the tag class and skip anything other than vehicles, weapons, and equipment.
        local class_name = class_names[read_dword(tag)]
        if class_name then
            -- Resolve the tag name through its string pointer at offset 0x10.
            local name_ptr = read_dword(tag + 0x10)
            local name = name_ptr ~= 0 and read_string(name_ptr) or "<no-name>"

            -- Read the tag's metadata ID from offset 0xC.
            local meta = read_dword(tag + 0xC)

            -- Print the tag class, metadata ID, and name to the server console.
            cprint(string.format("%s meta=%u name=%s", class_name, meta, name), 12)
        end
    end
end
```

### Distance Helpers

`distance3d` and `distanceMeters` are shared with Chimera. See [Distance](../common-reference.md#distance). Unit conversions are under [Timing and Units](../common-reference.md#timing-and-units).

On SAPP, read the position with `read_vector3d`:

```lua
local px, py, pz = read_vector3d(dynamic_player + 0x5C)
local distance_m = distanceMeters(px, py, pz, { 0, 0, 0 })
```

#### Raycasting with intersect

The `intersect()` function casts a 3D ray from an origin coordinate `(x, y, z)` along a direction vector `(vx, vy, vz)`. It tests for collisions against map geometry (terrain, structures, BSP) and dynamic objects (bipeds, vehicles, weapons, equipment, devices).

```lua
local success, hit_x, hit_y, hit_z, hit_object_id = intersect(x, y, z, vx, vy, vz, ignore_object_id)
```

##### Parameters

- `x, y, z` (`number`): Starting 3D coordinates of the raycast in World Units (WU). To raycast from a player's line of sight, use their eye-level position (`read_vector3d(dyn + 0x5C)` with vertical offset `+0.65` when standing or `+0.35` when crouching).
- `vx, vy, vz` (`number`): Direction vector multiplied by maximum reach distance in WU. Camera vectors read from `dyn + 0x230` are normalized unit vectors (length 1), so multiplying by `1000` casts a ray up to 1000 WU away.
- `ignore_object_id` (`number`, optional): Object ID to ignore during collision testing. Pass the casting player's biped Object ID (`read_dword(get_player(player_id) + 0x34)`) so the ray does not hit the player's own body.

##### Return Values

- `success` (`boolean`): `true` if the ray intersected any surface or dynamic object before reaching the maximum vector distance; `false` if no collision occurred.
- `hit_x, hit_y, hit_z` (`number`): 3D World Unit coordinates of the intersection point.
- `hit_object_id` (`number`): Object ID of the dynamic object hit. Returns `0xFFFFFFFF` (`4294967295`) if static map geometry (BSP/structure) or nothing was hit.

> [!TIP]
> Use `get_object_memory(hit_object_id)` to verify whether a valid dynamic object was hit. If non-zero, read byte `object + 0xB4` to check its object type (`1` = Vehicle, `4` = Equipment, `5` = Weapon, `6` = Device).

##### Example: Aim Target Raycasting

```lua
---@param player_id number SAPP player index (1-16).
---@param max_distance number Maximum raycast distance in World Units.
---@return number|nil hit_object_id Object ID of the targeted dynamic object, or nil if none hit.
local function getTargetObject(player_id, max_distance)
    local dyn = get_dynamic_player(player_id)
    if dyn == 0 or not player_alive(player_id) then return nil end

    -- Eye position (accounting for crouching)
    local crouching = read_float(dyn + 0x50C)
    local px, py, pz = read_vector3d(dyn + 0x5C)
    pz = pz + (crouching == 0 and 0.65 or 0.35)

    -- Aim vector scaled by max reach distance
    local cx, cy, cz = read_vector3d(dyn + 0x230)
    cx, cy, cz = cx * max_distance, cy * max_distance, cz * max_distance

    -- Ignore casting player's biped
    local ignore_biped = read_dword(get_player(player_id) + 0x34)

    local success, hit_x, hit_y, hit_z, hit_object_id = intersect(px, py, pz, cx, cy, cz, ignore_biped)
    if success and hit_object_id ~= 0xFFFFFFFF then
        local object = get_object_memory(hit_object_id)
        if object ~= 0 then
            return hit_object_id
        end
    end
    return nil
end
```

### IP and Network Helpers

SAPP uses `bit`, not `bit32`. These helpers validate IPv4 strings, convert between dotted and integer forms, convert wildcard notation to CIDR, and match an IP against CIDR, wildcard, or range definitions.

```lua
local bit = require("bit")

-- validateIpv4("192.168.*.*") -> "192.168.*.*"
-- validateIpv4("10.0.0.1-10.0.0.255") -> "10.0.0.1-10.0.0.255"
---@param ip string|nil IPv4 address, wildcard, CIDR, or range string.
---@return string|boolean normalized_ip Normalized IPv4 expression, or false if rejected.
local function validateIpv4(ip)
    if not ip then return false end
    ip = string.gsub(string.gsub(ip, "[%s]*", ""), "x+", "*")
    local a, b, c, slash, d, finish = ip:match("^([^%.]+)%.([^%.]*)%.?([^%./]*)%.?(/?)([^%.]*)()")
    a = a == "" and "*" or a:match("[%d%*]+")
    b = b == "" and "*" or b:match("[%d%*]+")
    c = c == "" and "*" or c:match("[%d%*]+")
    slash = slash ~= ""
    d = d or ""

    if slash then
        if d:find("/") or not d:match("[%d%*]+") then return false end
        d = "0/" .. d
    else
        d = d == "" and "*" or d:match("[%d%*/]+")
    end

    if not a or not b or not c then return false end

    local found, a2, b2, c2, d2 = ip:match("(%-)(%d+)%.(%d*)%.?(%d*)%.?(%d*)%c*$", finish)
    if not found then
        if a2 and a ~= "" then return false end
        return string.format("%s.%s.%s.%s", a, b, c, d)
    elseif slash then
        return false
    end

    a2 = a2 == "" and "*" or a2:match("[%d%*]+")
    b2 = b2 == "" and "*" or b2:match("[%d%*]+")
    c2 = c2 == "" and "*" or c2:match("[%d%*]+")
    d2 = d2 == "" and "*" or d2:match("[%d%*]+")

    if not a2 or not b2 or not c2 then return false end
    if c2:find("/") and d2:find("/") then return false end
    return string.format("%s.%s.%s.%s-%s.%s.%s.%s", a, b, c, d, a2, b2, c2, d2)
end

-- Returns an unsigned 32-bit value, or nil if the address is invalid.
---@param ip_addr string Dotted-decimal IPv4 address.
---@return number|nil address Unsigned 32-bit integer, or nil if the input cannot be parsed.
local function ipToLong(ip_addr)
    local a, b, c, d = ip_addr:match("^(%d+)%.(%d+)%.(%d+)%.(%d+)$")
    if not a then return nil end

    a, b, c, d = tonumber(a), tonumber(b), tonumber(c), tonumber(d)
    if not (a and b and c and d) then return nil end

    return bit.bor(bit.lshift(a, 24), bit.lshift(b, 16), bit.lshift(c, 8), d) % 0x100000000
end

-- Converts an unsigned 32-bit IPv4 value to dotted-decimal notation.
---@param addr number Unsigned 32-bit IPv4 address.
---@return string ip_addr Dotted-decimal IPv4 address.
local function longToIp(addr)
    local a = bit.rshift(bit.band(addr, 0xFF000000), 24)
    local b = bit.rshift(bit.band(addr, 0x00FF0000), 16)
    local c = bit.rshift(bit.band(addr, 0x0000FF00), 8)
    local d = bit.band(addr, 0x000000FF)
    return string.format("%i.%i.%i.%i", a, b, c, d)
end

-- wildcardToCidr("10.*.*.*") -> "10.0.0.0/8"
---@param addr string IPv4 address containing wildcard octets.
---@return string cidr_address CIDR representation of the wildcard address.
local function wildcardToCidr(addr)
    local count = select(2, addr:gsub("%*", "*"))
    if count == 1 then
        return addr:gsub("%*", "0") .. "/24"
    elseif count == 2 then
        return addr:gsub("%*", "0") .. "/16"
    elseif count == 3 then
        return addr:gsub("%*", "0") .. "/8"
    elseif count > 3 then
        return "0.0.0.0/0"
    end
    return addr
end

-- ipMatchesNetwork("192.168.1.0/24", "192.168.1.100") -> true
---@param network string Network definition in CIDR, wildcard, or range notation.
---@param ip string|nil IPv4 address or wildcard notation to check.
---@return boolean matches True if the IP matches the network definition.
local function ipMatchesNetwork(network, ip)
    network = validateIpv4(network)
    if not ip then return false end
    ip = validateIpv4(ip)
    if not network or not ip then return false end

    -- Normalize wildcard to CIDR
    if network:find("%*") then network = wildcardToCidr(network) end
    if ip:find("%*") then ip = wildcardToCidr(ip) end

    local dash = network:find("-")
    if not dash then
        local net_part, mask_len = network:match("^(.-)/(%d+)$")
        mask_len = tonumber(mask_len) or 32
        local net_long = ipToLong(net_part)
        if not net_long then return false end

        local ip_part, ip_mask_len = ip:match("^(.-)/(%d+)$")
        ip_mask_len = tonumber(ip_mask_len) or 32
        local ip_long = ipToLong(ip_part)
        if not ip_long then return false end

        local mask = bit.lshift(0xFFFFFFFF, (32 - mask_len))
        local ip_mask = bit.lshift(0xFFFFFFFF, (32 - ip_mask_len))
        return bit.band(net_long, mask, ip_mask) == bit.band(ip_long, mask, ip_mask)
    else
        local from = ipToLong(network:sub(1, dash - 1))
        local to = ipToLong(network:sub(dash + 1))
        if not from or not to then return false end

        local ip_long = ipToLong(ip)
        if not ip_long then return false end

        return ip_long >= from and ip_long <= to
    end
end
```

### Assigning Weapons

Note: Assigning 3 or more weapons at once makes the third and fourth drop on the ground. Delay them by at least 250 ms. `assign_weapon` silently fails if the player is dead.

```lua
---@param weapon_id number|nil Spawned weapon object ID.
---@param player_id number Player index (1-16).
function AssignWeapon(weapon_id, player_id) -- used in both examples below
    if weapon_id then assign_weapon(weapon_id, player_id) end
end
```

```lua
execute_command("wdel " .. player_id .. " 5") -- clear their inventory first (for both examples)

-- Example 1 (simple):
AssignWeapon(spawn_object(...), player_id) -- x2 (receive now)
timer(250, "AssignWeapon", spawn_object(...), player_id) -- x2 (receive 250ms later)

-- Example 2 (advanced assignment logic):
local WEAPONS = {
    ["pistol"] = {
        tag_name = "weapons\\pistol\\pistol",
        attributes = { clip = 12, ammo = 100, frags = 1, plasmas = 1 }
    },
    --...
}

local weapon_datums = {}
local function cacheWeaponDatums()
    for name, data in pairs(WEAPONS) do
        local tag_id = getTagId("weap", data.tag_name)
        if tag_id then
            weapon_datums[name] = {
                tag_id = tag_id,
                attributes = data.attributes
            }
        end
    end
end

---@param dyn_player number Dynamic player address.
---@param frags number Frag grenade count.
---@param plasmas number Plasma grenade count.
local function setGrenades(dyn_player, frags, plasmas)
    write_byte(dyn_player + 0x31E, frags)
    write_byte(dyn_player + 0x31F, plasmas)
end

---@param player_id number Player index (1-16).
---@param weapon_name string Weapon name key in weapon_datums.
---@param slot number Weapon slot (1-4).
local function spawnWeapon(player_id, weapon_name, slot)
    local dyn = get_dynamic_player(player_id)
    if dyn == 0 then return end

    local tag_datum = weapon_datums[weapon_name]
    if not tag_datum then return end

    local tag_id = tag_datum.tag_id
    local attributes = tag_datum.attributes

    local weapon = spawn_object("", "", 0, 0, 0, 0, tag_id)
    if weapon == 0 then return end

    local weapon_mem = get_object_memory(weapon)
    if weapon_mem == 0 then return end

    write_word(weapon_mem + 0x2B6, attributes.ammo) -- reserve ammo
    write_word(weapon_mem + 0x2B8, attributes.clip) -- rounds in magazine
    sync_ammo(weapon) -- sync before assigning

    if slot <= 2 then
        AssignWeapon(weapon, player_id)
    else
        timer(250, 'AssignWeapon', weapon, player_id)
    end

    -- Set last
    setGrenades(dyn, attributes.frags, attributes.plasmas)
end
```

### Platform-Independent Helpers

Table, string, message formatting, time, and math helpers work on any platform and are shared with Chimera. See [Pure Lua Helpers](../common-reference.md#pure-lua-helpers) in the Common Reference, including the [math.atan2 guard](../common-reference.md#mathatan2-guard).

Many Halo strings are UTF-16LE: player name (`get_player(id) + 0x4`), server name (`network_struct + 0x8`), gametype display name (`gametype_base + 0x0`; a mirror of the same value also lives at `network_struct + 0x10C`), and map display name (`map_name_address`). `read_string` returns `""` for these fields; use `readWideString` from [Wide Strings](../common-reference.md#wide-strings) instead. The narrow (8-bit) form is used only for filenames and paths (e.g. `map_name_address2`, `server_path_address`).

### LuaJIT and FFI

- Lua 5.1 compatible, plus LuaJIT extensions: `goto`, `bit`, `table.new`, `table.clear`.
- `_ENV` is not supported. Use `setfenv` and `getfenv` for environments.
- `ffi` gives you C interop and raw memory access.
- The JIT speeds up math-heavy and iterative code.
- Scripts are sandboxed, so some OS APIs may be blocked. Unsafe memory access can crash the server.

#### Check for FFI

```lua
function OnScriptLoad()
    if pcall(function() require("ffi") end) then
        cprint("ffi is available")
    else
        cprint("ffi is NOT available")
    end
end
```

`pcall` keeps the script from erroring out if `ffi` is blocked.

#### FFI Demo

Calls `GetTickCount` from the Windows API to get the milliseconds since system boot.

```lua
api_version = '1.12.0.0'

local ffi = require("ffi")

-- Declare the Windows API function signature for LuaJIT FFI.
ffi.cdef[[
    unsigned long GetTickCount(void);
]]

-- Tracks elapsed EVENT_TICK callbacks.
local tick_count = 0

function OnScriptLoad()
    -- Display the system uptime immediately when the script loads.
    cprint(string.format("Ticks since boot: %d", ffi.C.GetTickCount()), 10)
    register_callback(cb.EVENT_TICK, "OnTick")
end

function OnTick()
    tick_count = tick_count + 1
    if tick_count % 300 == 0 then -- every 10 seconds
        cprint(string.format("Ticks since boot: %d", ffi.C.GetTickCount()), 10)
    end
end
```

#### table.new

`table.new(narray, nhash)` pre-allocates a table with `narray` array slots and `nhash` hash slots, so it does not resize while you fill it.

```lua
local table_new = require("table.new")
local my_table = table_new(10, 5)

my_table[1] = "a"
my_table[2] = "b"
my_table.name = "LuaJIT"
my_table.version = "2.1"

for i = 1, #my_table do
    cprint("Index " .. i .. ": " .. tostring(my_table[i]))
end

for key, value in pairs(my_table) do
    if type(key) ~= "number" then
        cprint("Key '" .. key .. "': " .. tostring(value))
    end
end
```

#### table.clear

`table.clear(tab)` empties a table but keeps the allocated memory for reuse.

```lua
local table_clear = require("table.clear")
local scores = { player1 = 5, player2 = 3, player3 = 8 }
cprint("Has entries before clear: " .. tostring(next(scores) ~= nil))

table_clear(scores)

cprint("Has entries after clear: " .. tostring(next(scores) ~= nil))
```

#### Environments

`setfenv` swaps the globals a function sees. Useful for restricting what a chunk can touch.

```lua
local sandbox_env = { cprint = cprint, math = math }

---@param fn function Function to run inside the sandbox.
---@return boolean success, any result_or_error True if executed without error and function result, or false and error value.
local function runInSandbox(fn)
    setfenv(fn, sandbox_env)
    return pcall(fn)
end

runInSandbox(function() cprint("Hello from sandbox") end)
runInSandbox(function() return os.time() end) -- fails: `os` is nil in the sandbox
```

#### bit Library

SAPP Lua does not support `require("bit32")` (use `require("bit")`), the native bitwise operators (`& | ~ << >>`), or integer division (`//`). Use `bit.band`, `bit.bor`, `bit.bxor`, `bit.bnot`, `bit.lshift`, `bit.rshift`, and `math.floor(a / b)` instead.

```lua
local bit = require("bit")

-- Initialize an empty set of flags.
local flags = 0

-- Set bits 2 and 5 using bitwise OR.
flags = bit.bor(flags, 4, 32)

-- Check whether bit 2 is set using bitwise AND.
if bit.band(flags, 4) ~= 0 then
    cprint("Bit 2 is set")
end

-- Clear bit 5 using NOT to invert its mask, then AND to remove it.
flags = bit.band(flags, bit.bnot(32))

-- Shift 1 three positions to the left (equivalent to 1 * 2^3).
local shifted = bit.lshift(1, 3)
cprint("1 << 3 = " .. shifted)

-- Shift 8 three positions to the right (equivalent to 8 / 2^3).
local original = bit.rshift(8, 3)
cprint("8 >> 3 = " .. original)

-- Pack two 16-bit values into a single 32-bit value.
local high = 0xABCD
local low = 0x1234
local packed = bit.bor(bit.lshift(high, 16), low)
cprint(string.format("Packed: 0x%08X", packed))

-- Extract the upper 16 bits by shifting right.
local high_unpacked = bit.rshift(packed, 16)

-- Extract the lower 16 bits using a 16-bit mask.
local low_unpacked = bit.band(packed, 0xFFFF)
cprint(string.format("Unpacked: 0x%04X, 0x%04X", high_unpacked, low_unpacked))
```

These pair well with SAPP events: pre-allocate tables with `table.new`, clear them between maps with `table.clear`, track player states with bit flags, and run admin command handlers in a `setfenv` sandbox.

### Known SAPP Quirks

#### rand() Upper Bound

`rand(min, max)` excludes the upper bound, so `rand(1, 4)` returns 1-3 and never 4. To include the last index when picking from a table, add `1`: `local i = rand(1, #t + 1)`.

#### execute_command_sequence() Quoting

For chained commands (e.g. `say_all`), use single-quoted Lua strings, double-quoted arguments, and semicolons as separators:

- `execute_command_sequence('say_all "Hello world";god 1')`
- `execute_command_sequence("camo 1;god 1")`

#### $pn Is Stale During EVENT_LEAVE

During `EVENT_LEAVE`, `get_var(0, "$pn")` has not updated yet. Subtract `1` to get the right player count: `tonumber(get_var(0, "$pn")) - 1`.

#### math.atan2 Is Missing

Define the guard from [Math and Geometry](../common-reference.md#math-and-geometry) before using it, or before using any helper that calls it such as `directionToCardinal`.

#### Vehicle Physics Fix

Writing a vehicle's position with `write_vector3d()` can cause glitchy physics. This reduces the teleport glitches but does not remove them completely.

```lua
-- Set the vehicle's position as usual:
write_vector3d(object + 0x5C, x, y, z)

-- Apply the fix:
write_float(object + 0x70, -0.025)      -- tiny downward velocity
write_bit(object + 0x10, 0, 0)          -- unset no-collision
write_bit(object + 0x10, 5, 0)          -- unset ignore-physics
```

---

### Memory addresses and offsets

Lookup tables for SAPP (server) Lua scripting: pointers, signatures, variables, commands, and console colors. Memory offsets, game constants, unit conversions, and stock Halo commands are shared with Chimera and live in [Common Reference](../common-reference.md).

#### Pointers

Addresses below apply to both PC and CE. The `halo_type` global is defined by SAPP; the snippet below probes when it is absent. Use these pointers when no reliable signature exists (see [Signatures](#signatures)). Addresses are hex and `-` means unavailable. Pick PC or CE with `halo_type` (`"PC"` or `"CE"`):

```lua
local timelimit_address = halo_type == "PC" and 0x626630 or 0x5AA5B0
```

> [!IMPORTANT]
> Hardcoded pointers differ between PC and CE builds. Always check `halo_type` (`"PC"` or `"CE"`) to select the correct memory address or rely on signature scanning.

| Pointer Name                  | PC Address | CE Address | Description                                                                                                   |
| ----------------------------- | ---------- | ---------- | ------------------------------------------------------------------------------------------------------------- |
| `banlist_header`              | `0x641280` | `0x5C52A0` | Banlist structure header                                                                                      |
| `banlist_path_address`        | `0x69B950` | `0x61FB80` | Banlist file path                                                                                             |
| `broadcast_game_address`      | `0x5E4768` | `0x569EAC` | Broadcast type (PC/CE/Trial)                                                                                  |
| `broadcast_version_address`   | `0x5DF840` | `0x564B34` | Broadcast server version                                                                                      |
| `camera_base`                 | `0x69C2F8` | `0x62075C` | Per-player camera data base                                                                                   |
| `collideable_objects_pointer` | `0x744C34` | `0x6C69F4` | Collideable objects list pointer                                                                              |
| `color_patch`                 | `0x4828FE` | `0x45EB5E` | Byte patch (0xEB = patched, 0x74 = normal)                                                                    |
| `computer_name_address`       | `0x62CD40` | `0x5B0D20` | Server computer/domain name                                                                                   |
| `computer_specs_address`      | `0x662CE4` | `0x5E6E3C` | Server hardware info, CPU brand/speed                                                                         |
| `ctf_globals`                 | `0x639B78` | `0x5BDB98` | CTF global data                                                                                               |
| `ctf_msgs_patch`              | `0x481545` | `0x45DA95` | CTF announcement messages patch (0xEB = patched, 0x74 = normal)                                               |
| `devmode_patch1`              | `0x4A4DBF` | `0x47DF0C` | Byte patch (0xEB = patched, 0x74 = normal)                                                                    |
| `devmode_patch2`              | `0x4A4E7F` | `0x47DFBC` | Byte patch (0xEB = patched, 0x74 = normal)                                                                    |
| `flags_pointer`               | `0x6A590C` | `-`        | -                                                                                                             |
| `game_globals`                | `-`        | `0x61CFE0` | Global game data                                                                                              |
| `gametime_base`               | `0x671420` | `0x5F55BC` | Game time info header                                                                                         |
| `gametype_base`               | `0x671320` | `0x5F5478` | Current gametype settings. `+0x0` name (UTF-16LE), `+0x30` game type, `+0x34` team play, `+0x58` score limit. |
| `gametype_patch`              | `0x481F3C` | `0x45E50C` | Byte patch                                                                                                    |
| `hash_duplicate_patch`        | `0x59C516` | `0x5302E6` | Hash duplicate check patch.                                                                                   |
| `hash_table_base`             | `0x6A2AE4` | `0x5AFB14` | CD key validation hash table base                                                                             |
| `hashcheck_patch`             | `0x59C280` | `0x530130` | CD key hash check patch (0xEB = patched, 0x74 = normal)                                                       |
| `init_file_address`           | `0x8EB38`  | `0x8EB26`  | -                                                                                                             |
| `koth_globals`                | `0x639BB0` | `0x5BDBD0` | King of the Hill global data                                                                                  |
| `machine_pointer`             | `0x745B80` | `0x6C7960` | Network machine info pointer                                                                                  |
| `map_header_base`             | `-`        | `-`        | Not available on dedi (the dedi does not cache the .map header).                                              |
| `map_name_address`            | `0x63BC58` | `0x5BFC78` | Map display name, UTF-16LE                                                                                    |
| `map_name_address2`           | `-`        | `-`        | Use `read_string(network_struct + 0x8C, 0x80)` instead                                                        |
| `map_pointer`                 | `0x63523C` | `0x5B925C` | Map data base pointer, resolves to `0x40440000`                                                               |
| `mapcycle_header`             | `0x614B4C` | `0x598A8C` | Mapcycle data header                                                                                          |
| `mapcycle_timeout`            | `0x614AC0` | `0x598A00` | Mapcycle intermission timer                                                                                   |
| `name_base`                   | `0x745D4A` | `0x6C7B6A` | -                                                                                                             |
| `network_server_globals`      | `0x69B934` | `0x61FB44` | Server network globals                                                                                        |
| `network_struct`              | `0x745B80` | `0x6C7960` | Main server/client network structure                                                                          |
| `obj_header_pointer`          | `0x744C18` | `0x6C69F0` | Object header pointer                                                                                         |
| `oddball_globals`             | `0x639E38` | `0x5BDE58` | Oddball global data                                                                                           |
| `player_globals`              | `-`        | `0x6E1478` | Player global data                                                                                            |
| `player_header_pointer`       | `0x75ECE4` | `0x6E1480` | Player header pointer                                                                                         |
| `profile_path_address`        | `0x635610` | `0x5B9630` | Profile directory path                                                                                        |
| `public_value_address`        | `0x6164C0` | `0x59A424` | -                                                                                                             |
| `race_globals`                | `0x639F80` | `0x5BDFA0` | Race global data. `+0x0` = course checkpoint mask; `+0x44 + real_idx*4` = per-player progress                 |
| `race_locs`                   | `0x670F20` | `0x5F5078` | Race checkpoint world coordinates. Not required for lap tracking                                              |
| `rcon_password_address`       | `0x69BA5C` | `0x61FC8C` | Current server RCON password                                                                                  |
| `server_password_address`     | `0x69B93C` | `0x61FB6C` | Current server password (`null` if unset)                                                                     |
| `server_path_address`         | `0x62C390` | `0x5B0670` | `haloded.exe` server path                                                                                     |
| `server_port_address`         | `0x625230` | `0x5A91A0` | Broadcast server port                                                                                         |
| `servername_patch`            | `0x517D6B` | `0x4CE0CD` | Server name patch (0x9090 = patched, 0x4B74 = normal)                                                         |
| `slayer_globals`              | `0x63A0E8` | `0x5BE108` | Slayer global data (base for the score array; see note below)                                                 |
| `sockaddr_pointer`            | `0x6A1F08` | `0x626388` | -                                                                                                             |
| `special_chars_patch`         | `0x517D6B` | `0x4CE0CD` | -                                                                                                             |
| `stats_globals`               | `0x639878` | `0x5BD898` | Player statistics data                                                                                        |
| `stats_header`                | `0x639720` | `0x5BD740` | Statistics header (decal locations, etc.)                                                                     |
| `timelimit_address`           | `0x626630` | `0x5AA5B0` | Game time limit (ticks)                                                                                       |
| `version_info_address`        | `0x5E02C0` | `0x5650B4` | Halo version info string                                                                                      |
| `versioncheck_patch`          | `0x5152E7` | `0x4CB587` | Version check patch (0xEB = patched, 0x7D = normal)                                                           |

Notes:

- `gametype_base + 0x0` is the gametype variant display name as UTF-16LE (e.g. `"Team Slayer"`, not the base identifier `$gt` returns). Use `readWideString`, not `read_string` (see [Wide Strings](../common-reference.md#wide-strings)). The base identifier comes from the code byte at `+0x30` (see [Gametype Codes](../common-reference.md#gametype-codes)). The other fields are listed under [Gametype Struct](../common-reference.md#gametype-struct). There is no working PC sig for this pointer; use `0x671320`.
- `map_name_address` is UTF-16LE. Use `readWideString`. For the map filename, use `read_string(network_struct + 0x8C, 0x80)`. `map_name_address2` is not populated on the dedi.
- `map_pointer` resolves to `0x40440000` on both PC and CE. Read the tag array pointer from the base (`read_dword(0x40440000)`) and the tag count from `0x4044000C`.
- The `race_globals` fields are listed under [Race Globals](../common-reference.md#race-globals). On SAPP the player index is `to_real_index(i)`. `race_locs` is not required for lap timing.
- `ctf_globals + 0x0` is a pointer to the red flag spawn coords (`vector3d`). `+0x4` is a pointer to the blue flag spawn coords. Read with `read_vector3d(read_dword(ctf_globals + team * 4))`, where `team = 0` is red and `team = 1` is blue.

#### Offsets

Player, object, weapon, vehicle, and tag entry offsets can be found in [Memory Offsets](../common-reference.md#memory-offsets).

#### Tag Table

The tag table base is `0x40440000` on both PC and CE. Read the tag array pointer from the base and the tag count from `base + 0xC`. You can reach the base directly without `map_pointer`. The entry layout is under [Tag Entry](../common-reference.md#tag-entry).

#### Signatures

Signatures below use `sig_scan`, which works on both PC and CE. Use the [hardcoded pointers](#pointers) above as a fallback. `halo_type` is a case-sensitive string (`"PC"` or `"CE"`) and is the correct way to pick a fallback when `sig_scan` returns `0`.

| Pointer name                | Expression                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------ |
| `banlist_header`            | `read_dword(sig_scan("A3??????00A1??????0033DB3BC3") + 1)`                                       |
| `banlist_path_address`      | `read_dword(sig_scan("68??????00E8??????0083C41068") + 0x1)`                                     |
| `banlist_path_address2`     | `read_dword(sig_scan("CCCCC605??????0000E8??????0085C0") + 0x4)`                                 |
| `broadcast_game_address`    | `read_dword(sig_scan("CCCCBA??????002BD08A08") + 0x3)`                                           |
| `broadcast_version_address` | `read_dword(sig_scan("751768??????0068??????00BA") + 0x3)`                                       |
| `color_patch`               | `sig_scan("741F8B482085C9750C")` or `sig_scan("EB1F8B482085C9750C")` if already patched          |
| `computer_name_address`     | `read_dword(sig_scan("68??????0068??????0068000401006A00") + 0x1)`                               |
| `ctf_globals`               | `read_dword(sig_scan("8B3C85????????3BF9741FE8????????8B8E2C0200008B4610") + 3)`                 |
| `game_globals_tag_slot`     | `read_dword(sig_scan("A1????????8B88080100008B410C") + 1)`                                       |
| `gameinfo_header`           | `read_dword(sig_scan("A1????????8B480C894D00") + 0x1)`                                           |
| `gametype_base`             | `read_dword(sig_scan("B9360000008BF3BF????????") + 0x8)` (CE only; see note below)               |
| `hardware_info_address`     | `read_dword(sig_scan("BE??????008BC68B4DF064890D000000005F5E5B8BE55DC36A0C") + 0x1)`             |
| `kill_message_address`      | `read_dword(sig_scan("8B42348A8C28D500000084C9") + 3)`                                           |
| `koth_globals`              | `read_dword(sig_scan("BF??????00F3ABB96B000000") + 0x1)`                                         |
| `logfile_path_address`      | `read_dword(sig_scan("740ABB????5C00E8????0300") + 0x3)` (CE only)                               |
| `map_name_address`          | `read_dword(sig_scan("66A3??????00890D??????00C3") + 0x2)`                                       |
| `map_name_address2`         | `read_dword(sig_scan("B8??????00E8??????0032C983F813") + 0x1)`                                   |
| `network_struct`            | `read_dword(sig_scan("F3ABA1????????BA????????C740??????????E8????????668B0D") + 3)`             |
| `nonslayer_score_patch`     | `sig_scan("8B??3883C404????74??57FFD0") + 0x8`                                                   |
| `object_header_pointer`     | `read_dword(sig_scan("8B0D????????8B513425FFFF00008D") + 2)`                                     |
| `oddball_globals`           | `read_dword(sig_scan("BF??????00F3ABB951000000") + 0x1)`                                         |
| `player_header_pointer`     | `read_dword(sig_scan("DDD8A1??????008944244835") + 0x3)`                                         |
| `profile_path_address`      | `read_dword(sig_scan("68??????008D54245468") + 0x1)`                                             |
| `race_globals`              | `read_dword(sig_scan("BF??????00F3ABB952000000") + 0x1)`                                         |
| `rcon_failed_address`       | `read_dword(sig_scan("B8????????E8??000000A1????????55") + 1)`                                   |
| `rcon_password_address`     | `read_dword(sig_scan("7740BA??????008D9B000000008A01") + 0x3)`                                   |
| `server_ip_argument`        | `read_dword(sig_scan("BA??????008BC72BD78A08880C024084C975F68B442404") + 0x1)`                   |
| `server_password_address`   | `read_dword(sig_scan("F3ABA3??????00A3??????00A2??????00C705") + 0x3)`                           |
| `server_path_address`       | `read_dword(sig_scan("0000BE??????005657C605") + 0x3)`                                           |
| `server_port_address`       | `read_dword(sig_scan("668B0D??????000BF2C605") + 0x3)`                                           |
| `slayer_globals`            | `read_dword(sig_scan("5733C0B910000000BFE8E05B00F3ABB910000000") + 19)`                          |
| `slayer_score_patch`        | `sig_scan("74178B94242808000052518B8C24280800005157FFD083C4108B8424240800003BF8530F94C383FFFF")` |
| `stats_globals`             | `read_dword(sig_scan("33C0BF??????00F3AB881D") + 0x3)`                                           |
| `sv_map_reset_tick_address` | `read_dword(sig_scan("8B510C6A018915????????E8????????83C404") + 7)`                             |
| `tick_counter_sig`          | `sig_scan("8B2D????????807D0000C644240600")`                                                     |
| `tick_counter_address`      | `read_dword(read_dword(tick_counter_sig + 2)) + 0xC`                                             |
| `timelimit_address`         | `read_dword(sig_scan("8B0D????????83C8FF85C97E17") + 2)`                                         |

`tick_counter_address` is a two-step lookup: scan `tick_counter_sig`, read the pointer at `+ 2`, dereference it, then add `0xC`. For pointers without a reliable signature (e.g. `map_pointer`), use the PC/CE addresses under [Hardcoded Pointers](#pointers).

The `slayer_globals` signature embeds a CE address and its offset reads past the end of the pattern. Use the hardcoded pointer values for it (see [Hardcoded Pointers](#pointers)).

The `gametype_base` signature is CE only. Use the hardcoded PC value `0x671320`.

##### Generating Signatures

| Tool         | Plugin / Method                      | Output                                                                                        |
| ------------ | ------------------------------------ | --------------------------------------------------------------------------------------------- |
| IDA Pro      | SigMaker (e.g., `IDA_SigMaker.dll`)  | Right-click on assembly, generate AOB signature, copy from output window.                     |
| Ghidra       | MakeSig script                       | Right-click a function, "Generate Signature", copy pattern.                                   |
| Cheat Engine | Array of bytes scan + Auto Assembler | Find the instruction in memory disassembler, use `aobscan` or generate AOB from context menu. |

A signature is a byte string with wildcards (`??`) where values vary. Example: `"F3ABA1????????BA????????C740??????????E8????????668B0D"`.

###### Verifying a Signature

1. Attach to the game process.
2. Open Memory View, Search, Array of bytes.
3. Paste the signature (with `??` for wildcards).
4. Confirm exactly one unique result. If none or many, adjust the pattern length or add more unique bytes.

### Variables

- Global variables: Use `0` as the target ID.
- Player variables: Use the player's index as the target ID.
- Numeric values: Wrap the result in `tonumber()` because `get_var` returns strings.

> [!NOTE]
> `get_var()` always returns string values. Wrap the result in `tonumber()` when performing numeric comparisons or math operations.

- Examples:
    - `get_var(1, "$name")`
    - `get_var(0, "$gt")` - Returns the gametype string (e.g., `ctf`, `slayer`).

Scope: G = global (index `0`), P = per player, E = event-only (populated only while the matching callback or event fires, see [SAPP Lua API](#sapp-lua-api)).

| Variable       | Scope | Description                                                                                 |
| -------------- | ----- | ------------------------------------------------------------------------------------------- |
| `$afk`         | P     | Seconds the player has been AFK                                                             |
| `$app`         | P     | Bitfield: 1 SAPP, 2 Anticheat, 4 HAC2, 8 RefleX                                             |
| `$area`        | E     | Area name for `EVENT_AREA_ENTER` / `EVENT_AREA_EXIT`                                        |
| `$assists`     | P     | Assist count                                                                                |
| `$blues`       | G     | Players on blue team                                                                        |
| `$bluescore`   | G     | Blue team score                                                                             |
| `$botscore`    | P     | Aimbot score                                                                                |
| `$campkills`   | P     | Kills while camping                                                                         |
| `$combo`       | P     | Current kill combo (resets after 4 s without a kill)                                        |
| `$deaths`      | P     | Deaths this game                                                                            |
| `$ename`       | E     | Name passed to `cevent` for `EVENT_CUSTOM`                                                  |
| `$ffa`         | G     | `1` if FFA, `0` if teams                                                                    |
| `$gt`          | G     | Gametype: `ctf`, `slayer`, `king`, `race`, `oddball`; `n/a` when no game is running         |
| `$hash`        | P     | CD-key hash                                                                                 |
| `$hp`          | P     | Health as a decimal                                                                         |
| `$index`       | E     | Weapon slot index for `EVENT_WEAPON_DROP` / `EVENT_WEAPON_PICKUP`                           |
| `$invis`       | P     | `1` if active camo                                                                          |
| `$ip`          | P     | `IP:Port`                                                                                   |
| `$killed`      | E     | Victim player index for `EVENT_KILL` / `EVENT_BETRAY`                                       |
| `$killer`      | E     | Killer player index for `EVENT_DIE`; -1 unknown, 0 AI/vehicle/world                         |
| `$kills`       | P     | Kills this game                                                                             |
| `$lvl`         | P     | Admin level                                                                                 |
| `$map`         | G     | Loaded map                                                                                  |
| `$mode`        | G     | Game variant name                                                                           |
| `$n`           | P     | Player index                                                                                |
| `$name`        | P     | Player name                                                                                 |
| `$oteam`       | P     | Opposite team name                                                                          |
| `$ping`        | P     | Ping in ms                                                                                  |
| `$pn`          | G     | Players on server (stale during `EVENT_LEAVE`, see [Known SAPP Quirks](#known-sapp-quirks)) |
| `$rand`        | G     | Random number 1-16                                                                          |
| `$reds`        | G     | Players on red team                                                                         |
| `$redscore`    | G     | Red team score                                                                              |
| `$running`     | G     | `1` if a game is running                                                                    |
| `$score`       | P     | Player score                                                                                |
| `$sh`          | P     | Shield as a decimal                                                                         |
| `$snapscore`   | E     | Aimbot score from the snap for `EVENT_SNAP`                                                 |
| `$streak`      | P     | Kills since last respawn                                                                    |
| `$suicides`    | P     | Suicides this game                                                                          |
| `$svname`      | G     | Server name                                                                                 |
| `$team`        | P     | `red` / `blue`                                                                              |
| `$ticks`       | G     | Ticks since match start                                                                     |
| `$tk`          | P     | Team kills this game                                                                        |
| `$type`        | E     | Picked-up type for `EVENT_WEAPON_PICKUP`; `1` weapon, `2` grenade                           |
| `$valid`       | P     | Whether the CD key is valid                                                                 |
| `$x` `$y` `$z` | P     | Player coordinates                                                                          |

Notes:

- `w8` and `wait` only work inside an event command sequence. In Lua use `timer()` (see [SAPP timer()](#sapp-timer)).
- Player-scoped variables (types 3-5) clear when the player leaves.
- Custom variables are the only channel for sharing state between Lua scripts (see [Scripting with SAPP](#scripting-with-sapp)).

#### Event Types

Names usable in `events.txt` and targetable with `cevent`. Event-only variables (see [Variables](#variables)) are populated only while the matching event fires.

| Event              | Event vars        | Fires when                                                            |
| ------------------ | ----------------- | --------------------------------------------------------------------- |
| `event_aenter`     | `$area`           | A player enters a custom area.                                        |
| `event_aexit`      | `$area`           | A player exits a custom area.                                         |
| `event_alive`      |                   | Once per second while a player is alive.                              |
| `event_assist`     |                   | A player gains an assist.                                             |
| `event_camp`       |                   | A player kills while `anticamp` is enabled.                           |
| `event_custom`     | `$ename`          | `cevent` is invoked.                                                  |
| `event_die`        | `$killer`         | A player dies.                                                        |
| `event_end`        |                   | The game ends.                                                        |
| `event_join`       |                   | A player joins.                                                       |
| `event_kill`       | `$killed`         | A player kills another player.                                        |
| `event_leave`      |                   | A player disconnects.                                                 |
| `event_login`      |                   | An admin logs in via `login`.                                         |
| `event_prejoin`    |                   | A player is joining (not yet announced).                              |
| `event_prespawn`   |                   | A player has spawned (not yet announced).                             |
| `event_reset`      |                   | `sv_map_reset` was executed.                                          |
| `event_score`      |                   | A player scores.                                                      |
| `event_snap`       | `$snapscore`      | A player snaps while `aimbot_ban` is enabled.                         |
| `event_spawn`      |                   | A player has finished spawning.                                       |
| `event_start`      |                   | The game starts.                                                      |
| `event_suicide`    |                   | A player suicides.                                                    |
| `event_teamswitch` |                   | A player switches teams.                                              |
| `event_tick`       |                   | Every tick (1/30 s).                                                  |
| `event_tk`         | `$killed`         | A player team-kills.                                                  |
| `event_venter`     |                   | A player enters a vehicle.                                            |
| `event_vexit`      |                   | A player exits a vehicle.                                             |
| `event_warp`       |                   | A player warps past the `antiwarp` threshold.                         |
| `event_wdrop`      | `$index`          | A player drops a weapon.                                              |
| `event_wpickup`    | `$index`, `$type` | A player picks up a weapon or grenade (`$type`: 1 weapon, 2 grenade). |

### File Formats

- events.txt: `event_name 'conditional 1' 'conditional 2' 'command1;command2'`

Quotes optional unless a section contains spaces. Conditionals optional. Example:

```
event_join 'var_set money 100 $n'
event_score 'var_set money +50 $n; say $n "+50 ($money)"'
event_custom $name=buynades $money<100 'say $n "Insufficient funds ($money)"'
event_custom $name=buynades $money>=100 'var_set money -100 $n; nades $n 4; say $n "Nades maxed ($money)"'
```

- commands.txt: `command_name #arg1 #arg2 'command1;command2' level`

Arguments use `#` (not `$`). Level optional, defaults to `4`. Example: `buynades 'cevent buynades $n' -1`

### Console Colors

- `cprint` writes to the server console with classic Windows console color attributes.
- `cprint(msg, color)` uses the classic Windows console color attributes.
- `color_number = foreground + (background * 16)`

Both foreground and background take a value from 0 to 15. Examples: green text on black is `10 + (0 * 16) = 10`, and red on light aqua is `12 + (11 * 16) = 188`.

| Value | Color       | Value | Color        |
| ----- | ----------- | ----- | ------------ |
| `0`   | Black       | `8`   | Gray         |
| `1`   | Dark Blue   | `9`   | Blue         |
| `2`   | Dark Green  | `10`  | Green        |
| `3`   | Dark Aqua   | `11`  | Aqua         |
| `4`   | Dark Red    | `12`  | Red          |
| `5`   | Dark Purple | `13`  | Light Purple |
| `6`   | Dark Yellow | `14`  | Yellow       |
| `7`   | Light Gray  | `15`  | White        |

```lua
cprint("Script loaded successfully!", 10)
cprint("Player connected.", 14)
cprint("ERROR: Invalid command!", 12 + (14 * 16))
```

Common picks:

| Use     | Color                        |
| ------- | ---------------------------- |
| Success | Green (`10`)                 |
| Info    | Aqua (`11`) or yellow (`14`) |
| Warning | Yellow (`14`)                |
| Error   | Red (`12`)                   |
| Admin   | Light purple (`13`)          |
| Debug   | Gray (`8`)                   |

## Command Reference

Admin levels: `-1` = public, `0` = server, `1-4` = admins (4 highest). `setcmd` can re-level commands. Player commands (`about`, `afk`, `info`, `login`, `stats`, etc.) cannot be renamed, re-leveled, or run through `execute_command`.

`<player_expr>` accepts the expressions below. Stock Halo `sv_*` commands need a plain player index.

### Expressions

Player expressions (`<player_expr>`):

| Expression             | Matches                          |
| ---------------------- | -------------------------------- |
| `1`-`16`               | Player index                     |
| `*`                    | Wildcard in names; alone = all   |
| `me`                   | The player executing the command |
| `rt` / `bt`            | All red / all blue team players  |
| `pl`                   | All non-admins                   |
| `admin`                | All admins                       |
| `rand`                 | A random player                  |
| `randred` / `randblue` | A random red / blue player       |

Number expressions (`<int_expr>`, `<decimal_expr>`). A `<decimal_expr>` is a float where `1.0` = 100% (1% = `0.01`).

| Expression      | Effect                                               |
| --------------- | ---------------------------------------------------- |
| `:<n>`          | Set exact value (required for negatives, e.g. `:-5`) |
| `+<n>` / `-<n>` | Add to / subtract from current value                 |
| `*<n>` / `/<n>` | Multiply / divide current value                      |
| `%<n>`          | Modulo of current value                              |

### Stock Halo Commands (Vanilla)

The stock `sv_*` command table is shared with Chimera. See [Stock Halo Commands](../common-reference.md#stock-halo-commands).

### SAPP Loader Commands

| Command | Usage    | Description                                                      |
| ------- | -------- | ---------------------------------------------------------------- |
| load    | `load`   | Load SAPP (requires `strings.dll` enabled, `sapp.dll` present).  |
| reload  | `reload` | Reload SAPP configuration and scripts (faster than unload+load). |
| unload  | `unload` | Unload SAPP - reverts to stock. Console/cron only.               |

### Player Commands (Level -1 / 0)

Available to all players.

| Command   | Level | Usage                                | Description                                                                                     |
| --------- | ----- | ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| about     | -1    | `about`                              | Display current SAPP version.                                                                   |
| afk       | 0     | `afk`                                | Mark player as AFK - disables future respawns.                                                  |
| clead     | -1    | `clead [ping]`                       | Set player lead at a certain ping (requires `no_lead` enabled, `lead` disabled). Default: 0 ms. |
| info      | -1    | `info`                               | Show server name, player count, current map, scrim mode status.                                 |
| lead      | -1    | `lead [enabled]`                     | Toggle leading when no-lead mode is enabled. Default: `false`.                                  |
| list      | -1    | `list ['generic'/'player'/'custom']` | List commands available to the player.                                                          |
| login     | -1    | `login <password>`                   | Log into a V2 (name/password) admin account.                                                    |
| report    | -1    | `report [message]`                   | Send a report (requires anticheat).                                                             |
| stats     | -1    | `stats`                              | Show player's kills, deaths, and K/D ratio.                                                     |
| stfu      | -1    | `stfu`                               | Block messages from `say` and scripted rcon messages.                                           |
| sv_stats  | -1    | `sv_stats`                           | Display server statistics (queries, joins, commands, events, games, etc.).                      |
| unstfu    | -1    | `unstfu`                             | Disable `stfu`.                                                                                 |
| usage     | -1    | `usage <command>`                    | Show usage for a command.                                                                       |
| whatsnext | -1    | `whatsnext`                          | Show the next game in the mapcycle.                                                             |

### General Commands (Admin Moderation)

| Command       | Level | Usage                                          | Description                                                                                                                                                                  |
| ------------- | ----- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| afks          | 0     | `afks`                                         | List AFK players.                                                                                                                                                            |
| b             | 3     | `b <player_id> [reason] [time]`                | Hash-ban a player. Avoid using this command where possible: many players use cracked clients with shared CD keys, which can result in innocent players being banned as well. |
| balance_teams | 2     | `balance_teams`                                | Balance teams based on stats.                                                                                                                                                |
| bans          | 3     | `bans`                                         | Alias for `sv_banlist`.                                                                                                                                                      |
| beep          | 4     | `beep [Hz] [ms]`                               | Play a beep on the host machine.                                                                                                                                             |
| cpu           | 4     | `cpu`                                          | Display CPU load, memory usage, OS info.                                                                                                                                     |
| d             | 4     | `d <player_id>`                                | Show detailed player info (health, shield, coords, weapons, vehicle, etc.).                                                                                                  |
| files         | 4     | `files`                                        | Locate all SAPP `.txt` files.                                                                                                                                                |
| ipban         | 3     | `ipban <player_id> [time] [reason]`            | IP-ban a player (`0` or no time = indefinite).                                                                                                                               |
| ipbans        | 3     | `ipbans`                                       | List all IP bans with indices.                                                                                                                                               |
| iprangeban    | 3     | `iprangeban <name> <IP range> [reason] [time]` | Ban an IP range using CIDR (e.g., `192.168.1.0/24`).                                                                                                                         |
| ipunban       | 3     | `ipunban <index>`                              | Unban an IP by index.                                                                                                                                                        |
| inf           | 3     | `inf <player_id>`                              | Show player's CD-key hash, IP address, and index.                                                                                                                            |
| k             | 2     | `k <player_id> [reason]`                       | Kick a player and announce to server.                                                                                                                                        |
| kdr           | 0     | `kdr <player_id>`                              | Display player's kill/death ratio.                                                                                                                                           |
| log_note      | 4     | `log_note [message]`                           | Write a note to SAPP's log.                                                                                                                                                  |
| map           | 3     | `map <map> <gametype>`                         | Alias for `sv_map`.                                                                                                                                                          |
| maplist       | 3     | `maplist`                                      | List maps in three columns (like `sv_maplist`).                                                                                                                              |
| mute          | 2     | `mute <player_id> [time]`                      | IP-ban player from chat (no time = indefinite).                                                                                                                              |
| mutes         | 2     | `mutes`                                        | List active mutes.                                                                                                                                                           |
| unmute        | 2     | `unmute <index>`                               | Remove a mute.                                                                                                                                                               |
| pl            | 2     | `pl`                                           | Alias for `sv_players`.                                                                                                                                                      |
| skips         | 0     | `skips`                                        | List players who voted to skip the game.                                                                                                                                     |
| teamup        | 2     | `teamup`                                       | Group clan members together.                                                                                                                                                 |
| textban       | 2     | `textban <player_id> [time]`                   | CD-key ban from chat (no time = indefinite).                                                                                                                                 |
| textbans      | 2     | `textbans`                                     | List active textbans.                                                                                                                                                        |
| textunban     | 2     | `textunban <index>`                            | Remove a textban.                                                                                                                                                            |
| uptime        | 0     | `uptime`                                       | Show server and OS uptime.                                                                                                                                                   |

### Configuration Commands

Used to configure server behavior. Settings lost on reload unless placed in `init.txt`.

| Command               | Level | Usage                                            | Description                                                                               |
| --------------------- | ----- | ------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| admin_prefix          | 4     | `admin_prefix <prefix>`                          | Prefix for admin messages via `say`. Default: `** ADMIN **`.                              |
| adminadd_samelevel    | 4     | `adminadd_samelevel [0-2]`                       | Allow admins to add V1 admins: `0`=no, `1`=lower, `2`=lower/equal. Default: `0`.          |
| adminban              | 4     | `adminban [0-2]`                                 | Admin ban permissions: `0`=any, `1`=no higher, `2`=only lower. Default: `0`.              |
| admindel_samelevel    | 4     | `admindel_samelevel [0-2]`                       | Allow admins to delete V1 admins: `0`=no, `1`=lower, `2`=lower/equal. Default: `0`.       |
| afk_kick              | 4     | `afk_kick [seconds]`                             | Auto-kick AFK players after given seconds (`0`=disabled).                                 |
| aimbot_ban            | 4     | `aimbot_ban [length] [type]`                     | Auto kick/ban aimbotters. Type: `0`=CD hash,`1`=IP,`2`=both,`3`=kick. Default: `0 (off)`. |
| alias                 | 4     | `alias <player_id>`                              | Search for aliases in `aliases.txt`.                                                      |
| anticamp              | 4     | `anticamp [time] [distance]`                     | Raise `event_camp` if player kills while camping. Disabled by default.                    |
| anticaps              | 4     | `anticaps [enabled]`                             | Prevent excessive capital letters. Default: `false`.                                      |
| anticheat             | 4     | `anticheat [enabled]`                            | Require anticheat client. Must be set in `init.txt`. Default: `false`.                    |
| antiglitch            | 4     | `antiglitch [enabled]`                           | Kill players who leave map BSP. Default: `false`.                                         |
| antihalofp            | 4     | `antihalofp [enabled]`                           | IP ban (5 min) for too-frequent join attempts. Default: `false`.                          |
| antilagspawn          | 4     | `antilagspawn [enable]`                          | Prevent lag-spawning. Default: `false`.                                                   |
| antispam              | 4     | `antispam [type]`                                | Auto mute spammers: `0`=disabled,`1`=CD-key,`2`=IP. Default: `0`.                         |
| antiwarp              | 4     | `antiwarp [warp_num]`                            | Raise `event_warp` after given warps. `0`=disabled.                                       |
| auto_update           | 4     | `auto_update [enabled]`                          | Auto-update SAPP when available. Default: `true`.                                         |
| network_thread        | 4     | `network_thread [enabled]`                       | Disable to stop SAPP server list, map download, anticheat. Default: `true`.               |
| block_tc              | 4     | `block_tc [enabled]`                             | Block team changing. Default: `false`.                                                    |
| chat_console_echo     | 4     | `chat_console_echo [enabled]`                    | Output chat to console. Default: `false`.                                                 |
| cmdstart1             | 4     | `cmdstart1 [character]`                          | Primary command prefix in chat. Default: `\`.                                             |
| cmdstart2             | 4     | `cmdstart2 [character]`                          | Secondary command prefix. Default: `/`.                                                   |
| collect_aliases       | 4     | `collect_aliases [enabled] [valid CD keys only]` | Collect aliases into `alias.txt`. Default: `false`.                                       |
| console_input         | 4     | `console_input [enabled]`                        | Allow console to accept input. Default: `true`.                                           |
| custom_sleep          | 4     | `custom_sleep [ms]`                              | Modify Halo thread sleep per cycle (ms). Default: `8`.                                    |
| disable_backtap       | 4     | `disable_backtap [enabled]`                      | When enabled, backtapping won't insta-kill.                                               |
| disable_timer_offsets | 4     | `disable_timer_offsets [enabled]`                | Use fixed Xbox-style spawn timers. Default: `false`.                                      |
| dns                   | 4     | `dns [url]`                                      | Master server address for broadcasting.                                                   |
| full_ipban            | 4     | `full_ipban [enabled]`                           | Block all traffic from banned IPs (may reduce performance). Default: `false`.             |
| hide_admin            | 4     | `hide_admin [enabled]`                           | Hide admin names when using kick/ban commands. Default: `false`.                          |
| hill_timer            | 4     | `hill_timer [int_expr]`                          | Seconds hill changes in "Crazy King". Default: `60`.                                      |
| log                   | 4     | `log [enabled]`                                  | Log events to file. Default: `false`.                                                     |
| log_rotation          | 4     | `log_rotation [kb]`                              | Max log size (kB) before archiving. Default: `4096`.                                      |
| log_name              | 4     | `log_name [name]`                                | Log file name (`.log` appended). Default: `log`.                                          |
| lua                   | 4     | `lua [enabled]`                                  | Enable Lua scripting. Default: `false`.                                                   |
| lua_api_v             | 4     | `lua_api_v`                                      | Display current Lua API version.                                                          |
| lua_call              | 4     | `lua_call <script> <function> [arguments...]`    | Call a function in a loaded Lua script.                                                   |
| lua_load              | 4     | `lua_load <script>`                              | Load a Lua script and call `OnScriptLoad()`.                                              |
| lua_unload            | 4     | `lua_unload <script>`                            | Unload a Lua script and call `OnScriptUnload()`.                                          |
| map_skip              | 4     | `map_skip [%]`                                   | Enable skip command when % of players want skip. `0`=disabled.                            |
| mapvote               | 4     | `mapvote [enabled]`                              | Enable map voting at end of game. Default: `false`.                                       |
| max_idle              | 4     | `max_idle [time]`                                | Restart mapcycle if server idle for this many seconds. Default: `60`.                     |
| max_votes             | 4     | `max_votes [count]`                              | Maximum displayed votes per round. Default: `5`.                                          |
| motd                  | 4     | `motd [string]`                                  | Set the server Message of the Day.                                                        |
| msg_prefix            | 4     | `msg_prefix <string>`                            | Prefix used in server messages. Default: `**SAPP**`.                                      |
| mtv                   | 4     | `mtv [enabled]`                                  | Enable multi-team vehicles (requires anticheat/HAC2). Default: `false`.                   |
| no_lead               | 4     | `no_lead [enabled]`                              | Enable no-lead mode (ping compensation). Default: `false`.                                |
| packet_limit          | 4     | `packet_limit [amount]`                          | Max packets per second from an IP. Default: `1000`.                                       |
| ping_kick             | 4     | `ping_kick [ping]`                               | Kick players with ping exceeding this value (ms). `0`=disabled.                           |
| reload_gametypes      | 4     | `reload_gametypes`                               | Reload game variants from `savegames` folder.                                             |
| remote_console        | 4     | `remote_console [enabled]`                       | Enable remote console (TCP). Default: `false`.                                            |
| remote_console_list   | 4     | `remote_console_list`                            | List connected remote console clients.                                                    |
| remote_console_port   | 4     | `remote_console_port [port]`                     | Set TCP port for remote console (requires restart).                                       |
| sapp_console          | 4     | `sapp_console [enabled]`                         | Suppress periodic `sv_status`; show join/leave/game start. Default: `false`.              |
| sapp_mapcycle         | 4     | `sapp_mapcycle [enabled]`                        | Enable SAPP's map cycle. Default: `false`.                                                |
| sapp_rcon             | 4     | `sapp_rcon [enabled]`                            | Require rcon users to be SAPP admins. Default: `false`.                                   |
| save_scores           | 4     | `save_scores [enabled]`                          | Prevent score reset when player leaves. Default: `false`.                                 |
| say_prefix            | 4     | `say_prefix [enabled]`                           | Enable `SERVER ` prefix on server messages (CE only). Default: `true`.                    |
| scorelimit            | 4     | `scorelimit [int_expr]`                          | Get or edit current game's score limit.                                                   |
| scrim_mode            | 4     | `scrim_mode [enabled]`                           | Disable naughty commands, Lua scripts, sightjacking. Default: `false`.                    |
| set_ccolor            | 4     | `set_ccolor [value]`                             | Set console color (foreground + background x 16).                                         |
| setcmd                | 4     | `setcmd <command> <name/level>`                  | Change name or required admin level of a command.                                         |
| sj_level              | 4     | `sj_level [level]`                               | Minimum level to use HAC2 sightjacker. Default: `-1` (everyone).                          |
| spawn_protection      | 4     | `spawn_protection [time]`                        | Invulnerability time (seconds) upon spawn. `0`=disabled.                                  |
| timelimit             | 4     | `timelimit [int_expr]`                           | Get or edit time limit on the fly (minutes).                                              |
| unlock_console_log    | 4     | `unlock_console_log <enabled>`                   | Make console more verbose (CE only). Default: `false`.                                    |
| v                     | 4     | `v [version]`                                    | View or modify Halo version string.                                                       |
| zombies               | 4     | `zombies [team]`                                 | Enable zombies medals for HAC2: `0`=none,`1`=red,`2`=blue. Default: `0`.                  |

### Map Cycle Commands

Manage SAPP's map cycle (stored in `mapcycle.txt`).

| Command        | Level | Usage                                                                   | Description                                   |
| -------------- | ----- | ----------------------------------------------------------------------- | --------------------------------------------- |
| map_next       | 4     | `map_next`                                                              | Start the next game in the map cycle.         |
| map_prev       | 4     | `map_prev`                                                              | Start the previous game in the map cycle.     |
| map_spec       | 4     | `map_spec <index>`                                                      | Skip to a specific map cycle entry.           |
| mapcycle       | 0     | `mapcycle`                                                              | List all games in the map cycle with indices. |
| mapcycle_add   | 4     | `mapcycle_add <map> <game variant> [min players] [max players] [index]` | Add a map cycle entry.                        |
| mapcycle_begin | 4     | `mapcycle_begin`                                                        | Begin the map cycle from the start.           |
| mapcycle_del   | 4     | `mapcycle_del <index>`                                                  | Remove a map cycle entry.                     |
| sapp_mapcycle  | 4     | `sapp_mapcycle [enabled]`                                               | Enable SAPP's map cycle (see Configuration).  |

### Map Vote Commands

Manage map voting (stored in `mapvotes.txt`). Enabling map voting disables the map cycle.

| Command     | Level | Usage                                                                         | Description                                            |
| ----------- | ----- | ----------------------------------------------------------------------------- | ------------------------------------------------------ |
| mapvote     | 4     | `mapvote [enabled]`                                                           | Enable map voting at end of game.                      |
| mapvote_add | 4     | `mapvote_add <map> <game variant> <name> [min players] [max players] [index]` | Add a map vote entry.                                  |
| mapvote_del | 4     | `mapvote_del <index>`                                                         | Delete a map vote entry.                               |
| mapvotes    | 4     | `mapvotes`                                                                    | List map votes.                                        |
| max_votes   | 4     | `max_votes [count]`                                                           | Maximum votes displayed per round (see Configuration). |

### Event and Custom Commands

Commands for events (`events.txt`), custom commands (`commands.txt`), and custom variables. File formats follow the tables.

| Category | Command     | Level      | Usage                                                      | Description                                                                                                                                                                      |
| -------- | ----------- | ---------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Event    | `cevent`    | 4          | `cevent <name> [player number]`                            | Raise `event_custom`, set `$ename`, and optionally the triggering player. See [Event Types](#event-types) and [Variables](#variables).                                           |
| Event    | `events`    | 4          | `events`                                                   | List all events and their indices.                                                                                                                                               |
| Event    | `eventsdel` | 4          | `eventsdel <index>`                                        | Delete an event by index.                                                                                                                                                        |
| Event    | `w8`        | event only | `w8 <seconds>`                                             | Delay the current event by N seconds. Only valid inside an event command sequence.                                                                                               |
| Event    | `wait`      | event only | `wait <milliseconds>`                                      | Delay the current event by N milliseconds. Only valid inside an event command sequence.                                                                                          |
| Command  | `cmd_add`   | 4          | `cmd_add <command> [arguments] <command sequence> [level]` | Append a custom command to `commands.txt`. Defaults to level `4` when omitted.                                                                                                   |
| Command  | `cmd_del`   | 4          | `cmd_del <command>`                                        | Remove a custom command from `commands.txt`.                                                                                                                                     |
| Variable | `var_add`   | 4          | `var_add <name> <type>`                                    | Create a custom variable. Types: `0` global str, `1` global int, `2` global float, `3` player str, `4` player int, `5` player float.                                             |
| Variable | `var_conv`  | 4          | `var_conv <name>`                                          | Convert between integer and float types.                                                                                                                                         |
| Variable | `var_del`   | 4          | `var_del <name>`                                           | Delete a custom variable.                                                                                                                                                        |
| Variable | `var_list`  | 4          | `var_list`                                                 | List all custom variables.                                                                                                                                                       |
| Variable | `var_set`   | 4          | `var_set <name> <value_expr> [player number]`              | Set a custom variable. `value_expr` supports `+`, `-`, `*`, `/`, `%`, and `:` prefixes (see [Expressions](#expressions)). Player number is required for player-scoped variables. |

---

### Admin Management Commands

#### CD-Key Based Admins

CD-key admins are stored in `users.txt` and authenticate using a player's Halo CD-key hash. If a CD-key hash is cracked, anyone using that CD-key can automatically receive the assigned admin level when joining the server.

To reduce abuse, you can optionally restrict CD-key admins to specific IP ranges. For example, adding an IP range such as `192.168.1.100/24` limits admin access to players connecting from that subnet.

You can validate whether a hash is cracked with the [Hash Checker tool][hash_checker_tool].

| Command    | Level | Usage                                                 | Description                                                                                                                       |
| ---------- | ----- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| adminadd   | 0     | `adminadd <player_id> <level> [allowed IP ranges...]` | Add a CD-key based admin using the player's current CD-key hash. Optional IP ranges can restrict where the admin may log in from. |
| adminlevel | 0     | `adminlevel <index> <level>`                          | Set new level for a CD-key admin.                                                                                                 |
| admindel   | 0     | `admindel <index>`                                    | Remove a CD-key admin (requires `admindel_samelevel`).                                                                            |
| admins     | 4     | `admins`                                              | List CD-key based admins.                                                                                                         |

#### Name and Password Based Admins

Name/password admins authenticate using their current in-game name and assigned password. When using `admin_add`, the player's current username is saved to `admins.txt`.

| Command            | Level | Usage                                           | Description                                                                              |
| ------------------ | ----- | ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| admin_add          | 4     | `admin_add <player_name> <password> <level>`    | Add name/password admin using the player's current in-game name (player must be online). |
| admin_add_manually | 4     | `admin_add_manually <name> <password> <level>`  | Add name/password admin without player being present.                                    |
| admin_change_pw    | 4     | `admin_change_pw <index> <password>`            | Change password of name/password admin.                                                  |
| admin_change_level | 4     | `admin_change_level <index> <level>`            | Change level of name/password admin.                                                     |
| admin_del          | 4     | `admin_del <index>`                             | Delete name/password admin.                                                              |
| admin_list         | 4     | `admin_list`                                    | List name/password admins.                                                               |
| change_password    | 0     | `change_password <old password> <new password>` | Change password of currently logged-in name/password admin.                              |
| login              | -1    | `login <password>`                              | Log into a name/password admin account using the assigned admin name.                    |

### Naughty Commands

Directly modify player attributes. Cannot be used when `scrim_mode` is enabled.

| Command              | Usage                                                        | Description                                                                     |
| -------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| ammo                 | `ammo <player_id> [int_expr] [weapon]`                       | Change unloaded ammo (`0`=current,`1`-`4`=weapon slots,`5`=all).                |
| area_add_cuboid      | `area_add_cuboid <name> <a_x> <a_y> <a_z> <b_x> <b_y> <b_z>` | Add a rectangular area.                                                         |
| area_add_sphere      | `area_add_sphere <name> <x> <y> <z> <r>`                     | Add a spherical area.                                                           |
| area_del             | `area_del <name>`                                            | Remove an area.                                                                 |
| area_list            | `area_list`                                                  | List areas for loaded map.                                                      |
| area_listall         | `area_listall`                                               | List areas for all maps.                                                        |
| assists              | `assists <player_id> [int_expr]`                             | Change player's assist count.                                                   |
| battery              | `battery <player_id> [decimal_expr] [weapon]`                | Change weapon battery (weapon index as in `ammo`).                              |
| boost                | `boost <player_id>`                                          | Move player to location they are looking at.                                    |
| camo                 | `camo <player_id> [time]`                                    | Apply active camouflage for time (ticks). No effect if already camo.            |
| color                | `color <player_id> [index]`                                  | Change player's FFA color.                                                      |
| coord                | `coord <player_id>`                                          | Return player's coordinates.                                                    |
| deaths               | `deaths <player_id> [amount]`                                | Change player's death count.                                                    |
| disable_all_objects  | `disable_all_objects <team> <disable>`                       | Disable all objects for a team.                                                 |
| disable_all_vehicles | `disable_all_vehicles <team> <disable>`                      | Disable all vehicles for a team.                                                |
| disable_object       | `disable_object <tag_path> [team]`                           | Disable an object, optionally for a specific team.                              |
| disabled_objects     | `disabled_objects`                                           | List all disabled objects.                                                      |
| enable_object        | `enable_object <index or tag_path>`                          | Enable a disabled object by index or tag path.                                  |
| gamespeed            | `gamespeed [speed]`                                          | Change ticks per second (default `30`). Requires anticheat/HAC2 for sync.       |
| god                  | `god <player_id>`                                            | Enable invulnerability (use `ungod` to remove).                                 |
| gravity              | `gravity [float]`                                            | Set server gravity (default `0.003656` units/tick). Requires anticheat.         |
| hp                   | `hp <player_id> [decimal_expr]`                              | Get or set player health (decimal).                                             |
| kill                 | `kill <player_id>`                                           | Kill the player.                                                                |
| kills                | `kills <player_id> [int_expr]`                               | Get or set player's kill count.                                                 |
| lag                  | `lag <player_id>`                                            | Prevent player from moving (use `unlag` to remove).                             |
| loc_add              | `loc_add <location_name> [x] [y] [z]`                        | Add a location at player's position or given coordinates.                       |
| loc_del              | `loc_del <location_name>`                                    | Delete a location.                                                              |
| loc_list             | `loc_list`                                                   | List locations for current map.                                                 |
| loc_listall          | `loc_listall`                                                | List locations for all maps.                                                    |
| m                    | `m <player_id> <x> <y> <z>`                                  | Teleport player relative to their current position.                             |
| mag                  | `mag <player_id> [int_expr] [weapon]`                        | Get or edit loaded ammo (weapon index as in `ammo`).                            |
| nades                | `nades <player_id> [int_expr] [type]`                        | Get or edit grenade count (`1`=primary,`2`=secondary). Values >7 may not sync.  |
| s                    | `s <player_id> [decimal_expr]`                               | Get or edit player speed.                                                       |
| score                | `score <player_id> [int_expr]`                               | Get or edit player's score.                                                     |
| sh                   | `sh <player_id> [decimal_expr]`                              | Get or edit player's shield (decimal).                                          |
| spawn                | `spawn <type> <tag_path> [player_number] [rotation]`         | Spawn object at player's location.                                              |
| spawn                | `spawn <type> <tag_path> [location_name] [rotation]`         | Spawn object at named location.                                                 |
| spawn                | `spawn <type> <tag_path> [<x> <y> <z>] [rotation]`           | Spawn object at coordinates. Rotation in radians.                               |
| st                   | `st <player_id> [red/blue]`                                  | Change player's team. If team name provided, only switches if on opposite team. |
| t                    | `t <player_id> <location_name>`                              | Teleport player to named location.                                              |
| t                    | `t <player_id> <x> <y> <z>`                                  | Teleport player to coordinates.                                                 |
| team_score           | `team_score [red/blue/both] [int_expr]`                      | Get or edit team score(s).                                                      |
| tp                   | `tp <player_id> <player_number>`                             | Move one player to another player.                                              |
| ungod                | `ungod <player_id>`                                          | Remove god mode.                                                                |
| unlag                | `unlag <player_id>`                                          | Remove `lag` effect.                                                            |
| vdel                 | `vdel <player_id>`                                           | Delete all vehicle(s) assigned to player via `spawn`.                           |
| vdel_all             | `vdel_all`                                                   | Delete all vehicles spawned with SAPP.                                          |
| venter               | `venter <player_id> [seat]`                                  | Force player into a previously spawned vehicle (seat index, `1`=driver).        |
| vexit                | `vexit <player_id>`                                          | Force player to exit all vehicles.                                              |
| wadd                 | `wadd <player_id>`                                           | Add previously spawned weapon to player's inventory.                            |
| wdel                 | `wdel <player_id> <weapon>`                                  | Remove weapon from inventory (`0`=current,`1`-`4`=slots,`5`=all).               |
| wdrop                | `wdrop <player_id>`                                          | Drop player's currently held weapon.                                            |

### Remote Console Commands

Manage the TCP remote console.

| Command             | Level | Usage                        | Description                                         |
| ------------------- | ----- | ---------------------------- | --------------------------------------------------- |
| remote_console      | 4     | `remote_console [enabled]`   | Enable remote console. Default: `false`.            |
| remote_console_list | 4     | `remote_console_list`        | List connected remote console clients.              |
| remote_console_port | 4     | `remote_console_port [port]` | Set TCP port for remote console (requires restart). |

### Query Packet Manipulation

Add custom fields to Halo's query response.

| Command    | Level | Usage                       | Description                              |
| ---------- | ----- | --------------------------- | ---------------------------------------- |
| query_add  | 4     | `query_add <key> <value>`   | Add or overwrite a query key/value pair. |
| query_del  | 4     | `query_del <index or name>` | Remove a query entry.                    |
| query_list | 4     | `query_list`                | List custom query entries.               |

### Custom Variables

Custom variables come from these commands, or from `add_var`, `del_var`, and `set_var` in Lua. SAPP scripts have separate Lua environments, so they cannot directly access each other's globals. Use `lua_call <script> <function> [arguments...]` to invoke a function in a loaded script, and custom variables when scripts need to share state.

| Command  | Level | Usage                                         | Description                                                                                                           |
| -------- | ----- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| var_add  | 4     | `var_add <name> <type>`                       | Type: `0` = global str, `1` = global int, `2` = global float, `3` = player str, `4` = player int, `5` = player float. |
| var_conv | 4     | `var_conv <name>`                             | Convert between integer and float variable.                                                                           |
| var_del  | 4     | `var_del <name>`                              | Delete a variable.                                                                                                    |
| var_list | 4     | `var_list`                                    | List all custom variables.                                                                                            |
| var_set  | 4     | `var_set <name> <value_expr> [player number]` | Set a custom variable (player number required for player variables).                                                  |

---

[hash_checker_tool]: https://chalwk.github.io/SPCLib/tools/hash-checker