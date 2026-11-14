---
title: "Halo: Phasor Server and Lua API Guide"
permalink: /halo/phasor/guide/
description: "Complete guide to setting up, configuring, and running Phasor dedicated servers and writing server-side Lua scripts."
date: 2026-11-12
last-updated: 2026-11-13
categories: [ education, halo, modding, server ]
tags: [ phasor, lua, scripting, hosting, server, tutorial ]
---

## Server Setup

This section covers running a Halo dedicated server with Phasor 2.0, starting from one of two pre-configured packages:

- `Phasor_PC.zip`: Halo PC (Retail)
- `Phasor_CE.zip`: Halo Custom Edition (CE)

Pick the package that matches your version of Halo. Both have the same layout; only the server executable differs.

### Package Contents

This is the folder structure after extracting either zip.

```text
.                                        Root of the extracted PhasorCE server
|   dbghelp.dll                          Windows debug/crash-dump helper library
|   haloded.exe or haloceded.exe         Halo dedicated server executable (PC or CE)
|   init.txt                             Server startup / PhasorCE init commands
|   libcurl.dll                          cURL library for HTTP/FTP modules
|   lua5.22.dll                          Lua 5.2 runtime library
|   msvcp100.dll                         Visual C++ 2010 C++ runtime
|   msvcp120.dll                         Visual C++ 2013 C++ runtime
|   msvcr100.dll                         Visual C++ 2010 C runtime
|   msvcr120.dll                         Visual C++ 2013 C runtime
|   PhasorCE.dll                         PhasorCE server extension binary
|   run.bat                              Windows launch script
|   sqlite.dll                           SQLite database library
|   strings.dll                          PhasorCE loader DLL (strings replacement)
|
+---cg                                   Instance configs
|   |   access.ini                       Instance access/permissions config
|   |   admin.txt                        Admin list for this instance
|   |
|   +---crash                            Crash dump directory
|   +---data                             Runtime data
|   |       alias.sqlite                 Player alias database
|   |
|   +---logs                             Server logs
|   |   |   PhasorLog.log                Current PhasorCE log
|   |   |
|   |   \---old                          Archived/rotated logs
|   |
|   +---saved                            Saved game/variant files
|   \---scripts                          Instance Lua scripts
|       \---persistent                   Persistent Lua script storage
|
+---clibs                                Lua C library modules
|   |   lfs.dll                          LuaFileSystem module
|   |   lsqlite3.dll                     SQLite Lua module
|   |
|   +---lanes                            Lua Lanes modules
|   |       core.dll                     Lua Lanes core module
|   |
|   +---mime                             MIME modules
|   |       core.dll                     MIME core module
|   |
|   \---socket                           LuaSocket modules
|           core.dll                     LuaSocket core module
|           ftp.lua                      LuaSocket FTP module
|           headers.lua                  LuaSocket HTTP headers helper
|           http.lua                     LuaSocket HTTP module
|           smtp.lua                     LuaSocket SMTP module
|           tp.lua                       LuaSocket transfer protocol helper
|           url.lua                      LuaSocket URL parser
|
+---lua                                  Lua module wrappers
|       lanes.lua                        Lua Lanes loader/wrapper
|       ltn12.lua                        LuaSocket LTN12 filters
|       mime.lua                         MIME loader/wrapper
|       socket.lua                       LuaSocket main module
|
\---maps                                 Halo CE map files (.map)
        beavercreek.map
        bloodgulch.map
        ... (all standard maps)
```

### Run the Server

To start the server, use the provided `run.bat` script or run the executable.

#### Understanding `run.bat`

The `run.bat` script automates launching the server with recommended parameters:

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

#### Phasor Command-Line Options

Phasor adds two additional command-line options that you can append when starting the server:

| Option               | Description                                             |
| -------------------- | ------------------------------------------------------- |
| `-mappath <path>`    | Folder to load map files from. Only works on PC for now |
| `-scriptpath <path>` | Folder to use as your scripts folder                    |

For example, this points Phasor at a scripts folder outside the data folder: `haloded.exe -scriptpath C:\HaloScripts`

---

## Admins

Phasor identifies admins by CD-key hash. Every time a player joins, their client sends a hash that is unique to them. Phasor uses it for bans and to recognize admins. This is safer than rcon alone, because a player needs more than the rcon password to run commands. Scripts can also ask Phasor whether a player is an admin, and many of them rely on it.

> [!WARNING]
> RCON passwords alone are insecure because anyone who discovers the password can gain full server control. Phasor's CD-key hash-based admin system ensures that only authorized players can execute administrative commands.

### Admin Levels

Everyone on your admin list is an admin, but each admin has a level that controls which commands they can run. You can edit the levels in `access.ini`. Lower level numbers grant broader access; each lower-numbered level includes the permissions of the next higher-numbered level plus the commands listed below.

| Level | Effective permissions                                                                                             |
| ----- | ----------------------------------------------------------------------------------------------------------------- |
| 0     | All commands (`data=-1`), including commands added by scripts                                                     |
| 1     | Level 2 plus `sv_superban`                                                                                        |
| 2     | Level 3 plus `sv_unmute`, `sv_textban`, `sv_changeteam`, `sv_alias`, `sv_info`                                    |
| 3     | Level 4 plus `sv_ipban`, `sv_mute`, `sv_nameban`                                                                  |
| 4     | Level 5 plus `sv_kick`, `sv_ban`                                                                                  |
| 5     | Base: `sv_viewadmins`, `sv_commands`, `sv_players`, `sv_players_more`, `sv_teams_balance`, `sv_list`, `sv_status` |

Level 0 is the one most people use because it works best with scripts.

### Adding an Admin

Run `sv_admin_add <hash_or_player_index> <auth_name> <level>`. Pass a player index to add someone who is connected, or a hash to add someone who is not. See [Admin Commands](#admin-commands) for the rest of the admin tools.

```text
sv_admin_add 3 chalwk 0
```

---

## Writing init.txt

`init.txt` is executed automatically when the server starts. It configures server identity (`sv_name`, `sv_rcon_password`), map rotation (either fixed map cycles or map voting), script loading (`sv_script_load`), Phasor core settings (such as hash checks and AFK kicking), and logging options. This walkthrough builds one up step-by-step, starting with a plain mapcycle:

```text
sv_public 1
sv_timelimit 30
sv_rcon_password "change_me"
sv_name "My New Phasor Server"
sv_mapcycle_add bloodgulch ctf
sv_mapcycle_add timberland slayer
sv_mapcycle_timeout 15
sv_mapcycle_begin
```

### Scripts per Map

Say `script1` is a gametype script. Put script names at the end of an `sv_mapcycle_add` line and Phasor loads them for that map:

```text
sv_mapcycle_add bloodgulch ctf script1
sv_mapcycle_add timberland slayer script1 script2
```

> [!NOTE]
> If a script name contains spaces, you must wrap it in double quotes (e.g., `sv_mapcycle_add timberland slayer "my script"`).

### Scripts for Every Game

If you want `script1` loaded no matter which map is running, do not repeat it on every line. Make it persistent so it survives between games. Either drop it in the `scripts/persistent` folder, or load it with `sv_script_load`:

```text
sv_mapcycle_add bloodgulch ctf
sv_mapcycle_add timberland slayer script2
sv_mapcycle_timeout 15
sv_mapcycle_begin
sv_script_load script1 true
```

`script1` is gone from the mapcycle lines because `sv_script_load` already covers it.

> [!TIP]
> Placing shared utility scripts in the `cg/scripts/persistent` folder avoids cluttering your `init.txt` mapcycle lines and ensures they remain loaded across all map changes automatically.

### Map Voting

To let players vote instead of cycling, swap the mapcycle commands for the map vote ones. They work the same way, except every option needs a description so players know what they are voting for:

```text
sv_public 1
sv_timelimit 30
sv_rcon_password "change_me"
sv_name "My New Phasor Server"
sv_mapvote_add bloodgulch ctf "Bloodgulch CTF"
sv_mapvote_add timberland slayer "Timberland Slayer running script2" script2
sv_mapcycle_timeout 15
sv_mapvote_begin
sv_script_load script1 true
```

`sv_mapcycle_timeout` still sets the wait after a game, which here is how long players get to vote.

---

## Scripts

Scripts are where most of Phasor's value comes from.

### Installing a Script

1. [Download a Script][script_archive].
2. Copy it to your scripts folder: `Phasor_PC/cg/scripts` for PC or `Phasor_CE/cg/scripts` for CE.
3. To keep it loaded for the whole server session, put it in `scripts/persistent` instead.
4. Load or unload it with `sv_script_load` and `sv_script_unload`, or list it on a mapcycle or map vote line in `init.txt`.

> [!IMPORTANT]
> Compiled binary C libraries (`.dll` files) such as `lfs.dll` or `lsqlite3.dll` belong in the root `clibs/` folder, whereas Lua scripts (`.lua`) go into the `cg/scripts/` directory.

Learn more about [Deploying a Script](#deploying-a-script).

### Writing Scripts

Learn Lua first, then learn how Phasor uses scripts. The API, events, and working examples are in [Scripting with Phasor](#scripting-with-phasor), and the [Phasor Lua API](#phasor-lua-api) is a complete reference for every callback and function.

---

## Command Reference

Everything Phasor adds to the server console. `<angle>` arguments are required and `[square]` arguments are optional.

### Map Voting Commands

| Command                                                   | Description                                                  |
| --------------------------------------------------------- | ------------------------------------------------------------ |
| `sv_mapvote <boolean>`                                    | Turns map voting on or off                                   |
| `sv_mapvote_size <integer>`                               | Number of vote options shown (default `5`)                   |
| `sv_mapvote_add <map> <gametype> <description> [scripts]` | Adds a vote option. Players see the description while voting |
| `sv_mapvote_del <index>`                                  | Removes an option. Get the index from `sv_mapvote_list`      |
| `sv_mapvote_list`                                         | Lists the current vote options                               |

### Script Commands

| Command                                | Description                                                                  |
| -------------------------------------- | ---------------------------------------------------------------------------- |
| `sv_script_load <script> [persistent]` | Loads a script. `persistent` keeps it loaded between games (default `false`) |
| `sv_script_unload <script>`            | Unloads a script                                                             |
| `sv_script_reload [script]`            | Reloads a script, or every script if none is given                           |
| `sv_script_list`                       | Lists all loaded scripts                                                     |

### Logging Commands

The `log_type` argument is one of `phasor`, `script`, `game`, or `rcon`.

| Command                                 | Description                                                                   |
| --------------------------------------- | ----------------------------------------------------------------------------- |
| `sv_log_name <log_type> <new_name>`     | Changes the file a log is saved to                                            |
| `sv_log_limit <log_type> <max_size_kb>` | Maximum log size. A log that reaches it moves to the `sv_log_move_dir` folder |
| `sv_log_move_dir <directory>`           | Folder where full logs are moved                                              |

### Alias Commands

Phasor tracks the names each hash has used.

| Command                                | Description                                     |
| -------------------------------------- | ----------------------------------------------- |
| `sv_alias_enable <boolean>`            | Turns alias tracking on or off (default `true`) |
| `sv_alias_hash <hash_or_player_index>` | Looks up a hash in the alias database           |
| `sv_alias_search <partial_match>`      | Searches the alias database for matching names  |

`sv_alias_search` uses `%` as a wildcard:

| Example                 | Finds                          |
| ----------------------- | ------------------------------ |
| `sv_alias_search oxi%`  | Names starting with `oxi`      |
| `sv_alias_search oxide` | Names that are exactly `oxide` |
| `sv_alias_search %oxi%` | Names containing `oxi`         |

### Admin Commands

| Command                                                   | Description                                                                      |
| --------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `sv_admin_add <hash_or_player_index> <auth_name> <level>` | Adds an admin, identified by `auth_name`, at the given level. `0` is full access |
| `sv_admin_del <admin_name>`                               | Removes an admin                                                                 |
| `sv_admin_list`                                           | Lists all admins                                                                 |
| `sv_admin_cur`                                            | Lists admins who are in the server right now                                     |
| `sv_admin_reload`                                         | Reloads the admin list from `admin.txt`                                          |
| `sv_admin_commands`                                       | Lists the commands your level can run                                            |
| `sv_admin_check`                                          | Admins count as admins only after GameSpy validates their hash (default `true`)  |

### Version Commands

Valid versions for PC are 100 through 109. Valid versions for CE are 100, 107, 108, and 109.

| Command                      | Description                                                                                         |
| ---------------------------- | --------------------------------------------------------------------------------------------------- |
| `sv_version <ver>`           | Version the server broadcasts (default `109`)                                                       |
| `sv_version_check <boolean>` | Turns version checking on or off. Off (the default) lets clients with a different Halo version join |

### Player and Server Commands

| Command                        | Description                                                        |
| ------------------------------ | ------------------------------------------------------------------ |
| `sv_hash_check <boolean>`      | Whether players with invalid hashes may join (default `false`)     |
| `sv_kickafk <minutes>`         | Kicks players who are AFK this long. `0` disables it (default `0`) |
| `sv_kill <player>`             | Kills a player                                                     |
| `sv_getobject <object_id>`     | Prints an object's memory address. Mostly for scripters            |
| `sv_invis <player> [seconds]`  | Camo for a duration. `0` (default) lasts until they die            |
| `sv_setspeed <player> <speed>` | Changes a player's speed (default `1`)                             |
| `sv_say <msg>`                 | Sends a message to the whole server                                |
| `sv_gethash <player>`          | Prints a player's hash                                             |

---

## Scripting with Phasor

Phasor is a server-side extension for Halo PC/Custom Edition. It exposes a Lua Scripting API, event hooks, command handling, player management, logging, and numerous under-the-hood features. This guide focuses on its Lua API, walks through the core scripting model and practical examples so you can build your Lua scripts.

### Runtime Environment

| Feature            | Details                                                                   |
| ------------------ | ------------------------------------------------------------------------- |
| Lua runtime        | Lua 5.2                                                                   |
| Lua 5.2 features   | `goto`, `_ENV`, and the `bit32` library (no native bitwise operators)     |
| Runs on            | Dedicated server                                                          |
| Required functions | `GetRequiredVersion()` returning `200`, and `OnScriptLoad()`              |
| Platform detection | `game` argument of `OnScriptLoad` (`"PC"` or `"CE"`)                      |
| Signature scanning | Not available, hardcode addresses per platform                            |
| Player index       | Memory ID 0-15 everywhere, except server commands which use RCON IDs 1-16 |
| Tick rate          | 30 ticks/sec (1 tick ~ 33.3 ms); more in [Timing and Units][timing_units] |

### Script Structure

Every script needs `GetRequiredVersion()` and `OnScriptLoad()`. Without both, Phasor will not load it. `GetRequiredVersion()` must return `200`. `OnScriptUnload()` is optional, but define it so you have somewhere to clean up.

> [!IMPORTANT]
> Both `GetRequiredVersion()` (returning `200`) and `OnScriptLoad()` are mandatory in every Phasor script. Omitting either will cause Phasor to refuse loading the script entirely.

```lua
---@return number version Required API version (must be 200)
function GetRequiredVersion() return 200 end

--- Required. Called when the script is loaded.
---@param process_id number Process ID of the server.
---@param game string "PC" or "CE".
---@param persistent boolean True if the script is persistent.
function OnScriptLoad(process_id, game, persistent)
    -- Set up pointers and state here.
end

--- Called when the script is unloaded (optional cleanup).
function OnScriptUnload() end
```

Phasor has no registration call. It looks for global functions with the event names it knows, so define the ones you need and leave the rest out. See [Events](#events).

### Deploying a Script

Phasor only loads `.lua` files. A script saved as `.txt` needs renaming first. Where you put it decides how long it stays loaded:

| Folder                | Behavior                                                        |
| --------------------- | --------------------------------------------------------------- |
| `scripts/`            | Loaded on request, unloaded at the end of each game             |
| `scripts/persistent/` | Loaded when Phasor starts, stays loaded until the server closes |

### Script Commands

Install steps, and the full command list are in [Command Reference](#command-reference).

Use the script name without the `.lua` extension.

| Command                                | Description                                                                 |
| -------------------------------------- | --------------------------------------------------------------------------- |
| `sv_script_load <script> [persistent]` | Load a script. `persistent` keeps it loaded between games (default `false`) |
| `sv_script_unload <script>`            | Unload a script                                                             |
| `sv_script_reload [script]`            | Reload a script, or every script if none is given                           |
| `sv_script_list`                       | List the scripts that are loaded                                            |

#### Loading from init.txt

List scripts at the end of a mapcycle entry, and they load for that map only. For a script every game needs, load it persistent instead:

```
sv_mapcycle_add bloodgulch ctf
sv_mapcycle_add timberland slayer script2
sv_mapcycle_begin
sv_script_load script1 true
```

`sv_mapvote_add <map> <gametype> <description> [scripts]` takes the scripts the same way. Phasor also reads `earlyinit.txt` from the server folder at startup. Use it for settings that must exist before anything else, such as log directories, or to load persistent scripts.

### Player Indices

Phasor has two index spaces:

- Memory IDs run 0-15. Every Phasor function and event takes these.
- RCON IDs run 1-16. Server commands sent through `svcmd` expect these.

> [!WARNING]
> Mixing up memory IDs (0-15) and RCON IDs (1-16) when executing server commands via `svcmd` will target the incorrect player. Always use `resolveplayer()` and `rresolveplayer()` when passing player indices to console commands.

`resolveplayer(player)` converts a memory ID to an RCON ID and `rresolveplayer(rcon_id)` converts it back. Use them whenever you build a command string from a player index.

```lua
---@param player number Player index.
local function kickPlayer(player)
    svcmd("sv_kick " .. resolveplayer(player))
end
```

To loop over everyone connected, walk 0-15 and skip empty slots:

```lua
for player = 0, 15 do
    if getplayer(player) then
        local team_name = getteam(player) == 0 and "Red" or "Blue"
        hprintf(getname(player) .. " is on " .. team_name)
    end
end
```

### Game Version

Phasor cannot scan signatures, so you pick addresses yourself from the `game` argument. Phasor runs on the same dedicated server executable as SAPP, so the addresses in [Memory addresses and offsets][hardcoded_pointers] apply. Use `and` / `or` for a single value:

```lua
local gametype_base

---@param process_id number Process ID of the server.
---@param game string "PC" or "CE".
---@param persistent boolean True if the script is persistent.
function OnScriptLoad(process_id, game, persistent)
    gametype_base = game == "PC" and 0x671320 or 0x5F5478
end

---@return number score_limit Score limit of the current gametype.
local function getScoreLimit()
    return readbyte(gametype_base + 0x58)
end
```

Several values at once follow the same pattern:

```lua
local gametype_base, timelimit_address

---@param process_id number Process ID of the server.
---@param game string "PC" or "CE".
---@param persistent boolean True if the script is persistent.
function OnScriptLoad(process_id, game, persistent)
    gametype_base, timelimit_address = game == "PC" and 0x671320 or 0x5F5478,
                                       game == "PC" and 0x626630 or 0x5AA5B0
end
```

Or index a lookup table so the condition is written once:

```lua
local gametype_base, timelimit_address

---@param process_id number Process ID of the server.
---@param game string "PC" or "CE".
---@param persistent boolean True if the script is persistent.
function OnScriptLoad(process_id, game, persistent)
    local pointers = ({ PC = { 0x671320, 0x626630 }, CE = { 0x5F5478, 0x5AA5B0 } })[game]
    gametype_base, timelimit_address = pointers[1], pointers[2]
end
```

The rules for `and` / `or` are in [Ternary Emulation][ternary_emulation].

### Events

Define a global function with the exact event name and Phasor calls it. See [Phasor Lua API](#phasor-lua-api) for every event, its arguments, and what it can return. Define only the ones the script uses.

A few things to know before you write one:

- Player arguments are always memory IDs (0-15).
- Events that can stop something, such as `OnServerCommand`, `OnObjectInteraction`, and `OnVehicleEntry`, return `false` to block it and `true` to let it through.
- Tag IDs arrive as `map_id` arguments. Look tags up with `gettagid` in `OnNewGame` and cache the result, because looking them up repeatedly is slow.
- `OnClientUpdate` runs 30 times per second for every player. Keep it light.

> [!TIP]
> Always cache tag IDs (`gettagid`) during `OnNewGame` rather than calling it inside high-frequency event handlers (`OnClientUpdate`, `OnObjectInteraction`) to maintain optimal server performance.

---

## API Cheat Sheet

### Memory Read/Write

Phasor's function names have no underscores and the bit functions take an extra offset argument.

| Type            | Read                                     | Write                                               |
| --------------- | ---------------------------------------- | --------------------------------------------------- |
| Bit             | `readbit(data, data_offset, bit_offset)` | `writebit(data_addr, data_offset, bit_offset, bit)` |
| Unsigned 8-bit  | `readbyte(address)`                      | `writebyte(address, value)`                         |
| Signed 8-bit    | `readchar(address)`                      | `writechar(address, value)`                         |
| Unsigned 16-bit | `readword(address)`                      | `writeword(address, value)`                         |
| Signed 16-bit   | `readshort(address)`                     | `writeshort(address, value)`                        |
| Unsigned 32-bit | `readdword(address)`                     | `writedword(address, value)`                        |
| Signed 32-bit   | `readint(address)`                       | `writeint(address, value)`                          |
| 32-bit float    | `readfloat(address)`                     | `writefloat(address, value)`                        |
| 64-bit float    | `readdouble(address)`                    | `writedouble(address, value)`                       |
| ASCII string    | `readstring(address, [length])`          | `writestring(address, str, [length])`               |
| UTF-16LE string | `readwidestring(address, [length])`      | `writewidestring(address, str, [length])`           |

`bit_offset` is 0-7 and is counted from `data + data_offset`. `readwidestring` converts to ASCII for you, so Phasor does not need the `readWideString` helper from [Wide Strings][wide_strings].

### Messaging

Do not mix these up.

| Function                                                    | Destination              |
| ----------------------------------------------------------- | ------------------------ |
| `say(msg)`                                                  | In-game chat, everyone   |
| `privatesay(player, msg)`                                   | In-game chat, one player |
| `hprintf(msg)`, `hprint(msg)`, `print(msg)`, `respond(msg)` | Server terminal only     |

### Players and Teams

| Function                      | Notes                                          |
| ----------------------------- | ---------------------------------------------- |
| `getplayer(player)`           | Returns the player table address               |
| `getname(player)`             | Returns the player name as ASCII               |
| `gethash(player)`             | Returns the CD-key hash, a unique identifier   |
| `getteam(player)`             | `0` = Red, `1` = Blue                          |
| `getteamsize(team)`           | Number of players on that team                 |
| `changeteam(player)`          | Switches the player's team                     |
| `kill(player)`                | Kills the player                               |
| `applycamo(player, duration)` | Camo for `duration` seconds, `0` = until death |
| `setspeed(player, speed)`     | Movement speed multiplier, default `1.0`       |
| `isadmin(player)`             | `true` if the player is an admin               |
| `resolveplayer(player)`       | Memory ID (0-15) to RCON ID (1-16)             |
| `rresolveplayer(rcon_id)`     | RCON ID (1-16) to memory ID (0-15)             |

### Objects

| Function                                                                      | Notes                                                                                      |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `getobject(object_id)`                                                        | Object ID to memory address                                                                |
| `getplayerobjectid(player)`                                                   | Biped object ID, `0xFFFFFFFF` if dead or invalid                                           |
| `getobjectcoords(object_id)`                                                  | Returns `x, y, z`. A player in a vehicle returns the vehicle's coordinates                 |
| `gettagid(tag_type, tag_name)`                                                | Map ID of a tag, e.g. `gettagid("weap", "weapons\\pistol\\pistol")`                        |
| `createobject(tag_type, tag_name, parent_id, respawn_time, recycle, x, y, z)` | Returns the new object ID (see below)                                                      |
| `destroyobject(object_id)`                                                    | Deletes an object. An invalid ID can crash the server                                      |
| `movobjectcoords(object_id, x, y, z)`                                         | Teleports an object to absolute coordinates                                                |
| `movobjname(object_id, name)`                                                 | Teleports an object to a named location such as `"redbase"`                                |
| `assignweapon(player, object_id)`                                             | Gives a weapon to a player who has fewer than 4                                            |
| `updateammo(weapon_id)`                                                       | Forces ammo changes on a weapon to sync                                                    |
| `entervehicle(player, vehicle_id, seat)`                                      | `seat`: `0` = driver, `1` = passenger, `2` = gunner. The player must not already be in one |
| `exitvehicle(player)`                                                         | Forces the player out of their vehicle                                                     |

`createobject` arguments:

- `tag_type`: Four-letter class, e.g. `"weap"`.
- `tag_name`: Full tag path.
- `parent_id`: Object ID of the parent, or `-1` for none.
- `respawn_time`: Seconds. `0` = never, `-1` = gametype default.
- `recycle`: `true` = respawn, `false` = destroy.
- `x, y, z`: Spawn coordinates.

For item collections (weapons, grenades, powerups), `recycle` is ignored and `respawn_time` becomes the delay before the object is destroyed.

### Timers and Server

| Function                              | Notes                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------ |
| `registertimer(delay, callback, ...)` | Calls `callback` after `delay` ms. Extra arguments go to the callback. Returns an ID |
| `removetimer(timer_id)`               | Stops and removes a timer                                                            |
| `svcmd(cmd)`                          | Runs a server command. Player arguments must be RCON IDs                             |
| `getrandomnumber(min, max)`           | Random integer from `min` to `max`, both included                                    |
| `getprofilepath()`                    | Server data path, where `banlist.txt` is stored                                      |

---

## Phasor Lua API

This doubles as an API reference and EmmyLua / LuaLS script for Lua-aware editors (such as VS Code).

```lua
---@meta
-- Phasor 2.0 Lua API definitions for EmmyLua and lua-language-server.
-- Runtime is Lua 5.2.
--
-- Copyright (c) 2026 Jericho Crosby (Chalwk).

---@alias PhasorGame "PC" | "CE"

-- Script lifecycle -------------------------------------------------------------------------

--- Required. Phasor refuses to load the script without it.
---@return integer version Must return 200
function GetRequiredVersion() end

--- Required. Called once when the script is loaded.
---@param process_id number     The process ID of the server
---@param game       PhasorGame "PC" or "CE"
---@param persistent boolean    True if the script is persistent
function OnScriptLoad(process_id, game, persistent) end

--- Optional. Called once when the script is unloaded.
function OnScriptUnload() end

-- Callbacks --------------------------------------------------------------------------------

---@alias PhasorCallbackName
--- | "OnBanCheck"
--- | "OnClientUpdate"
--- | "OnDamageApplication"
--- | "OnDamageLookup"
--- | "OnGameEnd"
--- | "OnKillMultiplier"
--- | "OnNameRequest"
--- | "OnNewGame"
--- | "OnObjectCreation"
--- | "OnObjectCreationAttempt"
--- | "OnObjectInteraction"
--- | "OnPlayerJoin"
--- | "OnPlayerKill"
--- | "OnPlayerLeave"
--- | "OnPlayerSpawn"
--- | "OnPlayerSpawnEnd"
--- | "OnScriptLoad"
--- | "OnScriptUnload"
--- | "OnServerChat"
--- | "OnServerCommand"
--- | "OnServerCommandAttempt"
--- | "OnTeamChange"
--- | "OnTeamDecision"
--- | "OnVehicleEject"
--- | "OnVehicleEntry"
--- | "OnWeaponAssignment"
--- | "OnWeaponReload"

--- Event callbacks. Hover a field for the callback signature.
---@class PhasorCallbackIds
---@field OnBanCheck              PhasorCallbackName OnBanCheck(hash, ip): boolean. Return false to ban the joining player.
---@field OnClientUpdate          PhasorCallbackName OnClientUpdate(player). Runs 30 times per second per player; keep it light.
---@field OnDamageApplication     PhasorCallbackName OnDamageApplication(receiver, causer, map_id, location, backtap): boolean, number|nil. Return false to block damage, or true and a new damage value.
---@field OnDamageLookup          PhasorCallbackName OnDamageLookup(receiver, causer, map_id): boolean|nil. Return false to block the damage lookup.
---@field OnGameEnd               PhasorCallbackName OnGameEnd(stage). stage 1 = just ended (F1), 2 = carnage report, 3 = players may quit.
---@field OnKillMultiplier        PhasorCallbackName OnKillMultiplier(player, multiplier). multiplier: 7 double kill, 9 triple kill, 10 killtacular, 11 killing spree, 12 running riot; 16-20 = same with score.
---@field OnNameRequest           PhasorCallbackName OnNameRequest(hash, name): boolean, string|nil. Return false to kick, or true and a new name.
---@field OnNewGame               PhasorCallbackName OnNewGame(map). Look up and cache tags (gettagid) here.
---@field OnObjectCreation        PhasorCallbackName OnObjectCreation(object_id). Called after an object is created.
---@field OnObjectCreationAttempt PhasorCallbackName OnObjectCreationAttempt(map_id, parent_id, player): boolean|number. Return false to block, or a replacement tag id.
---@field OnObjectInteraction     PhasorCallbackName OnObjectInteraction(player, object_id, map_id): boolean|nil. Return false to block the interaction.
---@field OnPlayerJoin            PhasorCallbackName OnPlayerJoin(player). Player fully joined.
---@field OnPlayerKill            PhasorCallbackName OnPlayerKill(killer, victim, mode). mode 0 server, 1 fall, 2 guardians, 3 vehicle, 4 player, 5 betrayal, 6 suicide.
---@field OnPlayerLeave           PhasorCallbackName OnPlayerLeave(player). Player disconnected.
---@field OnPlayerSpawn           PhasorCallbackName OnPlayerSpawn(player). Called before OnPlayerSpawnEnd; biped is valid.
---@field OnPlayerSpawnEnd        PhasorCallbackName OnPlayerSpawnEnd(player). Server has announced the spawn.
---@field OnScriptLoad            PhasorCallbackName OnScriptLoad(process_id, game, persistent). Required.
---@field OnScriptUnload          PhasorCallbackName OnScriptUnload(). Optional; use for cleanup.
---@field OnServerChat            PhasorCallbackName OnServerChat(player, chat_type, message): boolean, string|nil, number|nil. Return false to block, or true with a new message and/or type.
---@field OnServerCommand         PhasorCallbackName OnServerCommand(player, command): boolean|nil. Return false to block the command.
---@field OnServerCommandAttempt  PhasorCallbackName OnServerCommandAttempt(player, command, password): boolean|nil. Return false to block the command.
---@field OnTeamChange            PhasorCallbackName OnTeamChange(player, old_team, new_team, voluntary): boolean|nil. Return false to prevent the team change.
---@field OnTeamDecision          PhasorCallbackName OnTeamDecision(team): number. Return the team to assign (0 = Red, 1 = Blue).
---@field OnVehicleEject          PhasorCallbackName OnVehicleEject(player, voluntary): boolean|nil. Return false to prevent the exit.
---@field OnVehicleEntry          PhasorCallbackName OnVehicleEntry(player, vehicle_id, seat, map_id, voluntary): boolean|nil. Return false to prevent entry.
---@field OnWeaponAssignment      PhasorCallbackName OnWeaponAssignment(player, object_id, slot, weapon_map_id): number. Return the weapon tag id to assign.
---@field OnWeaponReload          PhasorCallbackName OnWeaponReload(player, weapon_object_id): boolean|nil. Return false to block the reload.

-- Memory -----------------------------------------------------------------------------------

--- bit_offset is 0-7 and counted from data + data_offset.
---@param data        integer
---@param data_offset integer
---@param bit_offset  integer
---@return integer bit 0 or 1
function readbit(data, data_offset, bit_offset) end

---@param data_addr   integer
---@param data_offset integer
---@param bit_offset  integer
---@param bit         integer 0 or 1
function writebit(data_addr, data_offset, bit_offset, bit) end

--- Reads an unsigned 8-bit integer.
---@param address integer
---@return integer
function readbyte(address) end

--- Reads a signed 8-bit integer.
---@param address integer
---@return integer
function readchar(address) end

--- Reads an unsigned 16-bit integer.
---@param address integer
---@return integer
function readword(address) end

--- Reads a signed 16-bit integer.
---@param address integer
---@return integer
function readshort(address) end

--- Reads an unsigned 32-bit integer.
---@param address integer
---@return integer
function readdword(address) end

--- Reads a signed 32-bit integer.
---@param address integer
---@return integer
function readint(address) end

--- Reads a 32-bit float.
---@param address integer
---@return number
function readfloat(address) end

--- Reads a 64-bit float.
---@param address integer
---@return number
function readdouble(address) end

--- Writes an unsigned 8-bit integer.
---@param address integer
---@param value   integer
function writebyte(address, value) end

--- Writes a signed 8-bit integer.
---@param address integer
---@param value   integer
function writechar(address, value) end

--- Writes an unsigned 16-bit integer.
---@param address integer
---@param value   integer
function writeword(address, value) end

--- Writes a signed 16-bit integer.
---@param address integer
---@param value   integer
function writeshort(address, value) end

--- Writes an unsigned 32-bit integer.
---@param address integer
---@param value   integer
function writedword(address, value) end

--- Writes a signed 32-bit integer.
---@param address integer
---@param value   integer
function writeint(address, value) end

--- Writes a 32-bit float.
---@param address integer
---@param value   number
function writefloat(address, value) end

--- Writes a 64-bit float.
---@param address integer
---@param value   number
function writedouble(address, value) end

---@param address integer
---@param length? integer
---@return string
function readstring(address, length) end

---@param address integer
---@param value   string
---@param length? integer
function writestring(address, value, length) end

--- Converts UTF-16LE to ASCII for you.
---@param address integer
---@param length? integer
---@return string
function readwidestring(address, length) end

---@param address integer
---@param value   string
---@param length? integer
function writewidestring(address, value, length) end

-- Messaging --------------------------------------------------------------------------------

--- In-game chat, everyone.
---@param message string
function say(message) end

--- In-game chat, one player.
---@param player  integer
---@param message string
function privatesay(player, message) end

--- Server terminal only.
---@param message string
function hprintf(message) end

--- Server terminal only.
---@param message string
function hprint(message) end

--- Server terminal only.
---@param message string
function respond(message) end

--- Displays text in a player's console.
---@param player  integer
---@param message string
function sendconsoletext(player, message) end

-- Players and teams ------------------------------------------------------------------------

--- Player table address, or nil if the slot is empty.
---@param player integer
---@return integer | nil address
function getplayer(player) end

---@param player integer
---@return string name ASCII
function getname(player) end

--- CD-key hash, a unique identifier.
---@param player integer
---@return string hash
function gethash(player) end

---@param player integer
---@return string | nil ip
function getip(player) end

--- 0 red, 1 blue.
---@param player integer
---@return integer team
function getteam(player) end

---@param player integer
---@return string color
function getcolor(player) end

---@param team integer
---@return integer size
function getteamsize(team) end

---@param player integer
function changeteam(player) end

---@param player integer
function kill(player) end

---@param player integer
---@return boolean in_vehicle
function isinvehicle(player) end

--- duration in seconds, 0 lasts until death.
---@param player   integer
---@param duration number
function applycamo(player, duration) end

--- Movement multiplier, default 1.0.
---@param player integer
---@param speed  number
function setspeed(player, speed) end

---@param player integer
---@return boolean
function isadmin(player) end

--- Memory id (0-15) to RCON id (1-16).
---@param player integer
---@return integer rcon_id
function resolveplayer(player) end

--- RCON id (1-16) to memory id (0-15).
---@param rcon_id integer
---@return integer player
function rresolveplayer(rcon_id) end

--- Executes a server command in the context of a player.
---@param command string
---@param player  integer Player memory id (0-15)
function svcmdplayer(command, player) end

-- Objects ----------------------------------------------------------------------------------

--- Object id to memory address.
---@param object_id integer
---@return integer address
function getobject(object_id) end

--- Biped object id, 0xFFFFFFFF if the player is dead or invalid.
---@param player integer
---@return integer object_id
function getplayerobjectid(player) end

--- Returns the player memory id associated with an object, or nil if it is not a player object.
---@param object_id integer
---@return integer | nil player
function objectidtoplayer(object_id) end

--- A player in a vehicle returns the vehicle's coordinates.
---@param object_id integer
---@return number x
---@return number y
---@return number z
function getobjectcoords(object_id) end

--- Map id of a tag, e.g. gettagid("weap", "weapons\\pistol\\pistol"). Cache it in OnNewGame.
---@param tag_type string Four-letter class
---@param tag_name string
---@return integer map_id
function gettagid(tag_type, tag_name) end

--- Returns the tag path and class for a map tag id.
---@param map_id integer
---@return string | nil tag_name
---@return string | nil tag_type
function gettaginfo(map_id) end

--- respawn_time: seconds, 0 never, -1 gametype default. For weapons, grenades and powerups
--- recycle is ignored and respawn_time becomes the delay before the object is destroyed.
---@param tag_type     string      Four-letter class
---@param tag_name     string
---@param parent_id    integer - 1 for none
---@param respawn_time number
---@param recycle      boolean     true respawns, false destroys
---@param x            number
---@param y            number
---@param z            number
---@return integer object_id
function createobject(tag_type, tag_name, parent_id, respawn_time, recycle, x, y, z) end

--- An invalid id can crash the server.
---@param object_id integer
function destroyobject(object_id) end

--- Moves an object to absolute coordinates.
---@param object_id integer
---@param x         number
---@param y         number
---@param z         number
function movobjectcoords(object_id, x, y, z) end

--- Teleports to a named location such as "redbase".
---@param object_id integer
---@param name      string
function movobjname(object_id, name) end

--- Gives a weapon to a player who has fewer than 4.
---@param player    integer
---@param object_id integer
function assignweapon(player, object_id) end

--- Forces ammo changes on a weapon to sync.
---@param weapon_id integer
function updateammo(weapon_id) end

--- seat: 0 driver, 1 passenger, 2 gunner. The player must not already be in a vehicle.
---@param player     integer
---@param vehicle_id integer
---@param seat       integer
function entervehicle(player, vehicle_id, seat) end

---@param player integer
function exitvehicle(player) end

-- Timers and server ------------------------------------------------------------------------

--- Calls a global function after delay ms. The callback receives (timer_id, count, ...) and
--- returns truthy to repeat or falsy to stop.
---@param delay         integer Milliseconds
---@param callback_name string  Name of a global function
---@param ...           any     Forwarded to the callback
---@return integer timer_id
function registertimer(delay, callback_name, ...) end

---@param timer_id integer
function removetimer(timer_id) end

--- Player arguments in the command must be RCON ids. Set get_response to true to capture output.
---@param command       string
---@param get_response? boolean
---@return string[] | nil response
function svcmd(command, get_response) end

--- Sets the multiplier for damage lookup processing.
---@param multiplier number
function odl_multiplier(multiplier) end

-- String helpers ---------------------------------------------------------------------------

--- Splits a string using the supplied delimiter.
---@param value     string
---@param delimiter string
---@return string[] parts
function tokenizestring(value, delimiter) end

--- Splits a command string into tokens.
---@param command string
---@return string[] tokens
function tokenizecmdstring(command) end

--- Both bounds are included.
---@param min integer
---@param max integer
---@return integer
function getrandomnumber(min, max) end

--- Server data path, where banlist.txt is stored.
---@return string
function getprofilepath() end
```

### Reading Player Data

Phasor has no `get_dynamic_player`. Build one from `getplayerobjectid` and `getobject`. A dead player's object ID is `0xFFFFFFFF`, so check for that before you touch the address.

```lua
---@param player number Player index.
---@return number|nil dyn_player Dynamic player address, or nil if the player is dead.
local function getDynamicPlayer(player)
    local object_id = getplayerobjectid(player)
    if object_id == 0xFFFFFFFF then return nil end

    return getobject(object_id)
end
```

From there, field offsets come straight from [Dynamic Player Object][dynamic_player_object]. This tops up a player who drops below 30% health:

```lua
---@param player number Player index.
local function healIfLow(player)
    local dyn_player = getDynamicPlayer(player)
    if not dyn_player then return end

    if readfloat(dyn_player + 0xE0) < 0.3 then
        writefloat(dyn_player + 0xE0, 1.0)
        privatesay(player, "You have been healed.")
    end
end
```

### Porting Shared Helpers

The helpers in [Offset Helpers][offset_helpers] and the offset tables work on Phasor too. Only the calls around them change:

| SAPP / Chimera                                           | Phasor                                                                      |
| -------------------------------------------------------- | --------------------------------------------------------------------------- |
| `read_byte`, `read_word`, `read_dword` (SAPP / Chimera)  | `readbyte`, `readword`, `readdword`                                         |
| `read_int`, `read_float`, `read_string` (SAPP / Chimera) | `readint`, `readfloat`, `readstring`                                        |
| `write_byte`, `write_float`, ... (SAPP / Chimera)        | `writebyte`, `writefloat`, ...                                              |
| `read_bit(address, bit)` (SAPP only)                     | `readbit(address, 0, bit)`                                                  |
| `read_vector3d(address)` (SAPP only)                     | One `readfloat` per axis, as in [Position and Aim][position_aim]            |
| `readWideString` (Custom helper)                         | `readwidestring(address, [length])` (Built-in API)                          |
| `get_player(id)` (SAPP / Chimera)                        | `getplayer(player)`                                                         |
| `get_dynamic_player(id)` (SAPP / Chimera)                | `getDynamicPlayer(player)` from [Reading Player Data](#reading-player-data) |
| `get_object_memory(object_id)` (SAPP only)               | `getobject(object_id)`                                                      |
| `lookup_tag(class, name)` + `read_dword` (SAPP only)     | `gettagid(tag_type, tag_name)`                                              |
| `spawn_object(...)` (SAPP / Chimera)                     | `createobject(...)`                                                         |
| `execute_command(cmd)` (SAPP only)                       | `svcmd(cmd)`                                                                |
| `to_real_index(id)` (SAPP only)                          | Not needed, Phasor already uses 0-15                                        |

> [!NOTE]
> On SAPP and Chimera, `readWideString` is not a built-in API function, it is a custom helper function that must be copied from the [Common Reference](../common-reference.md). Phasor, by contrast, provides `readwidestring` natively as a built-in API function.

### Helper Functions

#### Vehicle Occupants

Retrieves the driver or gunner occupying a vehicle object.

```lua
---@param vehicle_object number Vehicle memory address.
---@return number|nil driver_player Player index ID (0-15), or nil if seat is empty.
local function getDriverPlayer(vehicle_object)
    local unit_id = readdword(vehicle_object + 0x324)
    if unit_id == 0xFFFFFFFF then return nil end
    for player = 0, 15 do
        if getplayerobjectid(player) == unit_id then return player end
    end
    return nil
end

---@param vehicle_object number Vehicle memory address.
---@return number|nil gunner_player Player index ID (0-15), or nil if seat is empty.
local function getGunnerPlayer(vehicle_object)
    local unit_id = readdword(vehicle_object + 0x328)
    if unit_id == 0xFFFFFFFF then return nil end
    for player = 0, 15 do
        if getplayerobjectid(player) == unit_id then return player end
    end
    return nil
end
```

#### Player Lookup by Hash or IP

Finds a player's ID by their CD-key hash or IP address.

```lua
---@param hash string CD-key hash to search for.
---@return number|nil player Player index ID (0-15), or nil if not found.
local function hashToPlayer(hash)
    for player = 0, 15 do
        if getplayer(player) and gethash(player) == hash then return player end
    end
    return nil
end

---@param ip string IP address to search for.
---@return number|nil player Player index ID (0-15), or nil if not found.
local function ipToPlayer(ip)
    for player = 0, 15 do
        if getplayer(player) and getip(player) and getip(player) == ip then return player end
    end
    return nil
end
```

#### Weapon Slot Helpers

Retrieves the weapon object ID for a specific inventory slot (0-3) or the active weapon slot index.

```lua
---@param player number Player index ID (0-15).
---@param slot number Weapon slot (0-3).
---@return number|nil weapon_id Weapon object ID, or nil if slot is empty or player is dead.
local function getWeaponObjectID(player, slot)
    local dyn_player = getDynamicPlayer(player)
    if not dyn_player then return nil end
    local weapon_id = readdword(dyn_player + 0x2F8 + (slot * 4))
    return weapon_id ~= 0xFFFFFFFF and weapon_id or nil
end

---@param player number Player index ID (0-15).
---@return number|nil slot Active weapon slot index (0-3), or nil if dead.
local function getActiveWeaponSlot(player)
    local dyn_player = getDynamicPlayer(player)
    return dyn_player and readbyte(dyn_player + 0x2F2) or nil
end
```

#### Gametype Score Calculator

Reads the player's score for the current gametype. See `oddball_globals` in [Pointers](../sapp/sapp-guide.md#pointers) before using this helper.

```lua
---@param player number Player index ID (0-15).
---@param gametype_base number Address of the gametype struct.
---@return number score Calculated score.
local function getPlayerScore(player, gametype_base)
    local static_player = getplayer(player)
    if not static_player then return 0 end

    local gametype = readbyte(gametype_base + 0x30)
    if gametype == 1 then     -- CTF (flag scores)
        return readword(static_player + 0xC8)
    elseif gametype == 2 then -- Slayer (kills minus betrays/suicides)
        local kills = readword(static_player + 0x9C)
        local team_play = readbyte(gametype_base + 0x34) == 1
        local penalties = readword(static_player + (team_play and 0xAC or 0xB0))
        return kills - penalties
    elseif gametype == 3 then -- Oddball (time with ball in seconds)
        local ticks = readdword(oddball_globals + 0x44 + player * 4) -- See 
        return math.floor(ticks / 30)
    elseif gametype == 4 then -- KOTH (hill time in seconds)
        return math.floor(readword(static_player + 0xC4) / 30)
    elseif gametype == 5 then -- Race (laps completed)
        return readword(static_player + 0xC6)
    end
    return 0
end
```

### Creating Objects

Spawn a weapon on the player and hand it over. `-1` for `parent_id` means no parent, `0` for `respawn_time` means never respawn, and `false` for `recycle` destroys it instead of respawning it.

```lua
---@param player number Player index.
local function giveSniper(player)
    local object_id = getplayerobjectid(player)
    if object_id == 0xFFFFFFFF then return end

    local x, y, z = getobjectcoords(object_id)
    local tag_name = "weapons\\sniper rifle\\sniper rifle"
    local weapon_id = createobject("weap", tag_name, -1, 0, false, x, y, z + 0.5)
    assignweapon(player, weapon_id)
end
```

### Using Timers

`registertimer` calls a global function by name after a delay in milliseconds. The callback receives the timer ID, the number of times it has fired, and any extra arguments you passed. Return `1` to repeat or `0` to stop.

```lua
local timer_id

---@param id number Timer ID.
---@param count number Times the timer has fired.
---@param message string Extra argument passed to registertimer.
---@return number repeat_timer `1` to repeat, `0` to stop.
function ShowMessage(id, count, message)
    hprintf(message .. " (" .. count .. ")")

    if count >= 3 then
        timer_id = nil
        return 0 -- stop after 3 runs
    end
    return 1
end

function OnScriptLoad(process_id, game, persistent)
    timer_id = registertimer(1000, "ShowMessage", "Hello from the timer")
end

function OnScriptUnload()
    if timer_id then removetimer(timer_id) end
end
```

### Event Examples

#### Speed Hack Protection

Phasor stores the speed multiplier in the static player table (`+0x6C`, see [Static Player Data][static_player_data]). Reset it on spawn and clamp it on every client update. This fights any script that boosts speed on purpose, so use it on servers that do not.

```lua
--- `OnPlayerSpawn`
--- Called when a player has spawned. Called BEFORE `OnPlayerSpawnEnd`.
---@param player number The player who is spawning
function OnPlayerSpawn(player)
    setspeed(player, 1.0)
end

--- `OnClientUpdate`
--- Called when a client sends its update packet.
--- Runs 30 times per second for every player, so keep it light.
---@param player number The player's index id
function OnClientUpdate(player)
    local static_player = getplayer(player)
    if not static_player then return end

    if readfloat(static_player + 0x6C) > 1.05 then
        setspeed(player, 1.0)
    end
end
```

#### Welcome Message

```lua
--- `OnPlayerJoin`
--- Called when a player successfully joins the game.
---@param player number The joining player's index id
function OnPlayerJoin(player)
    privatesay(player, "Welcome to the server, " .. getname(player) .. "!")
end
```

#### Block a Weapon Pickup

`OnObjectInteraction` gives you the object's tag ID, not its name. Look the tag up once in `OnNewGame` and compare against it.

```lua
local blocked_weapon

--- `OnNewGame`
--- Called when a new game is starting.
--- Look up all tags (via `gettagid`) here and cache them.
---@param map string The name of the map being loaded
function OnNewGame(map)
    blocked_weapon = gettagid("weap", "weapons\\rocket launcher\\rocket launcher")
end

--- `OnObjectInteraction`
--- Called when a player interacts with an object.
---@param player number The interacting player's index id
---@param object_id number The object being interacted with
---@param map_id number The object's tag id
---@return boolean|nil allow # Return `false` to block the interaction
function OnObjectInteraction(player, object_id, map_id)
    return map_id ~= blocked_weapon -- false blocks the pickup
end
```

#### Command Cooldown

Clear a player's timer when they leave, or the next player to take that slot inherits it.

```lua
local cooldown_seconds = 3
local cooldowns = {}

--- `OnServerCommand`
--- Called when a player executes a server command.
---@param player number The player's index id
---@param command string The command being executed
---@return boolean|nil allow # Return `false` to block the command
function OnServerCommand(player, command)
    if command ~= "custom_command" then return true end

    local now = os.time()
    local last_used = cooldowns[player]
    if last_used and now - last_used < cooldown_seconds then
        privatesay(player, "Wait " .. cooldown_seconds .. " seconds before using that again.")
        return false
    end

    cooldowns[player] = now
    return true
end

--- `OnPlayerLeave`
--- Called when a player quits.
---@param player number The player who left
function OnPlayerLeave(player)
    cooldowns[player] = nil
end
```

---

[dynamic_player_object]: ../common-reference.md#dynamic-player-object
[hardcoded_pointers]: ../sapp/sapp-guide.md#memory-addresses-and-offsets
[offset_helpers]: ../common-reference.md#offset-helpers
[position_aim]: ../common-reference.md#position-and-aim
[script_archive]: https://github.com/Chalwk/SPCLib/tree/master/phasor
[static_player_data]: ../common-reference.md#static-player-data
[ternary_emulation]: ../common-reference.md#ternary-emulation
[timing_units]: ../common-reference.md#timing-and-units
[wide_strings]: ../common-reference.md#wide-strings