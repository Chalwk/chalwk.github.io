---
title: "Halo: Phasor Server Guide"
permalink: /halo/phasor/server-guide/
date: 2026-11-09
last-updated: 2026-11-09
categories: [ education, halo, modding ]
tags: [ sapp, lua, scripting, server, tutorial ]
---

This guide covers running a Halo dedicated server with Phasor 2.0, starting from the pre-configured
packages in the [Phasor Server Templates][server_template] release:

- `Phasor_PC.zip`: Halo PC (Retail)
- `Phasor_CE.zip`: Halo Custom Edition (CE)

Pick the package that matches your version of Halo. Both have the same layout; only the server
executable differs.

## Package Contents

This is the folder structure after extracting either zip.

```text
.                                        Root of the extracted PhasorCE server
|   dbghelp.dll                          Windows debug/crash-dump helper library
|   haloceded.exe                        Halo Custom Edition dedicated server executable
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

---

## Run the Server

To start the server, use the provided `run.bat` script or run the executable.

### Understanding `run.bat`

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
- `-port` specifies the UDP port the server listens on (default Halo port is `2302`, but custom
  ports like `2310` are commonly used to avoid conflicts or run multiple servers).

### Phasor Command-Line Options

Phasor adds two additional command-line options that you can append when starting the server:

| Option               | Description                                             |
|----------------------|---------------------------------------------------------|
| `-mappath <path>`    | Folder to load map files from. Only works on PC for now |
| `-scriptpath <path>` | Folder to use as your scripts folder                    |

For example, this points Phasor at a scripts folder outside the data folder:
`haloded.exe -scriptpath C:\HaloScripts`

---

## Admins

Phasor identifies admins by CD-key hash. Every time a player joins, their client sends a hash that
is unique to them. Phasor uses it for bans and to recognize admins. This is safer than rcon alone,
because a player needs more than the rcon password to run commands. Scripts can also ask Phasor
whether a player is an admin, and many of them rely on it.

> [!WARNING]
> RCON passwords alone are insecure because anyone who discovers the password can gain full server
> control. Phasor's CD-key hash-based admin system ensures that only authorized players can execute
> administrative commands.

### Admin Levels

Everyone on your admin list is an admin, but each admin has a level that controls which commands
they can run. You can edit the levels in `access.ini`. Lower level numbers grant broader access;
each lower-numbered level includes the permissions of the next higher-numbered level plus the
commands listed below.

| Level | Effective permissions                                                                                             |
|-------|-------------------------------------------------------------------------------------------------------------------|
| 0     | All commands (`data=-1`), including commands added by scripts                                                     |
| 1     | Level 2 plus `sv_superban`                                                                                        |
| 2     | Level 3 plus `sv_unmute`, `sv_textban`, `sv_changeteam`, `sv_alias`, `sv_info`                                    |
| 3     | Level 4 plus `sv_ipban`, `sv_mute`, `sv_nameban`                                                                  |
| 4     | Level 5 plus `sv_kick`, `sv_ban`                                                                                  |
| 5     | Base: `sv_viewadmins`, `sv_commands`, `sv_players`, `sv_players_more`, `sv_teams_balance`, `sv_list`, `sv_status` |

Level 0 is the one most people use because it works best with scripts.

### Adding an Admin

Run `sv_admin_add <hash_or_player_index> <auth_name> <level>`. Pass a player index to add someone
who is connected, or a hash to add someone who is not. See [Admin Commands](#admin-commands) for
the rest of the admin tools.

```text
sv_admin_add 3 chalwk 0
```

---

## Writing init.txt

`init.txt` is executed automatically when the server starts. It configures server identity
(`sv_name`, `sv_rcon_password`), map rotation (either fixed map cycles or map voting), script
loading (`sv_script_load`), Phasor core settings (such as hash checks and AFK kicking), and logging
options. This walkthrough builds one up step-by-step, starting with a plain mapcycle:

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

Say `script1` is a gametype script. Put script names at the end of an `sv_mapcycle_add` line and
Phasor loads them for that map:

```text
sv_mapcycle_add bloodgulch ctf script1
sv_mapcycle_add timberland slayer script1 script2
```

> [!NOTE]
> If a script name contains spaces, you must wrap it in double quotes (e.g.,
> `sv_mapcycle_add timberland slayer "my script"`).

### Scripts for Every Game

If you want `script1` loaded no matter which map is running, do not repeat it on every line. Make
it persistent so it survives between games. Either drop it in the `scripts/persistent` folder, or
load it with `sv_script_load`:

```text
sv_mapcycle_add bloodgulch ctf
sv_mapcycle_add timberland slayer script2
sv_mapcycle_timeout 15
sv_mapcycle_begin
sv_script_load script1 true
```

`script1` is gone from the mapcycle lines because `sv_script_load` already covers it.

> [!TIP]
> Placing shared utility scripts in the `cg/scripts/persistent` folder avoids cluttering your
> `init.txt` mapcycle lines and ensures they remain loaded across all map changes automatically.

### Map Voting

To let players vote instead of cycling, swap the mapcycle commands for the map vote ones. They work
the same way, except every option needs a description so players know what they are voting for:

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

## Installing a Script

1. [Download a Script][phasor_scripts].
2. Copy it to your scripts folder: `Phasor_PC/cg/scripts` for PC or `Phasor_CE/cg/scripts` for CE.
3. To keep it loaded for the whole server session, put it in `scripts/persistent` instead.
4. Load or unload it with `sv_script_load` and `sv_script_unload`, or list it on a mapcycle or map
   vote line in `init.txt`.

> [!IMPORTANT]
> Compiled binary C libraries (`.dll` files) such as `lfs.dll` or `lsqlite3.dll` belong in the root
> `clibs/` folder, whereas Lua scripts (`.lua`) go into the `cg/scripts/` directory.

Learn more about [Deploying a Script](scripting-with-phasor.md#deploying-a-script) here.

### Writing Scripts

Learn Lua first, then learn how Phasor uses scripts. The API, events, and working examples are in
[Scripting with Phasor](scripting-with-phasor.md), and the [Phasor Lua Template](template.md) is a
ready-made skeleton.

---

## Command Reference

Everything Phasor adds to the server console. `<angle>` arguments are required and `[square]`
arguments are optional.

### Map Voting Commands

| Command                                                   | Description                                                  |
|-----------------------------------------------------------|--------------------------------------------------------------|
| `sv_mapvote <boolean>`                                    | Turns map voting on or off                                   |
| `sv_mapvote_size <integer>`                               | Number of vote options shown (default `5`)                   |
| `sv_mapvote_add <map> <gametype> <description> [scripts]` | Adds a vote option. Players see the description while voting |
| `sv_mapvote_del <index>`                                  | Removes an option. Get the index from `sv_mapvote_list`      |
| `sv_mapvote_list`                                         | Lists the current vote options                               |

### Script Commands

| Command                                | Description                                                                  |
|----------------------------------------|------------------------------------------------------------------------------|
| `sv_script_load <script> [persistent]` | Loads a script. `persistent` keeps it loaded between games (default `false`) |
| `sv_script_unload <script>`            | Unloads a script                                                             |
| `sv_script_reload [script]`            | Reloads a script, or every script if none is given                           |
| `sv_script_list`                       | Lists all loaded scripts                                                     |

### Logging Commands

The `log_type` argument is one of `phasor`, `script`, `game`, or `rcon`.

| Command                                 | Description                                                                   |
|-----------------------------------------|-------------------------------------------------------------------------------|
| `sv_log_name <log_type> <new_name>`     | Changes the file a log is saved to                                            |
| `sv_log_limit <log_type> <max_size_kb>` | Maximum log size. A log that reaches it moves to the `sv_log_move_dir` folder |
| `sv_log_move_dir <directory>`           | Folder where full logs are moved                                              |

### Alias Commands

Phasor tracks the names each hash has used.

| Command                                | Description                                     |
|----------------------------------------|-------------------------------------------------|
| `sv_alias_enable <boolean>`            | Turns alias tracking on or off (default `true`) |
| `sv_alias_hash <hash_or_player_index>` | Looks up a hash in the alias database           |
| `sv_alias_search <partial_match>`      | Searches the alias database for matching names  |

`sv_alias_search` uses `%` as a wildcard:

| Example                 | Finds                          |
|-------------------------|--------------------------------|
| `sv_alias_search oxi%`  | Names starting with `oxi`      |
| `sv_alias_search oxide` | Names that are exactly `oxide` |
| `sv_alias_search %oxi%` | Names containing `oxi`         |

### Admin Commands

| Command                                                   | Description                                                                      |
|-----------------------------------------------------------|----------------------------------------------------------------------------------|
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
|------------------------------|-----------------------------------------------------------------------------------------------------|
| `sv_version <ver>`           | Version the server broadcasts (default `109`)                                                       |
| `sv_version_check <boolean>` | Turns version checking on or off. Off (the default) lets clients with a different Halo version join |

### Player and Server Commands

| Command                        | Description                                                        |
|--------------------------------|--------------------------------------------------------------------|
| `sv_hash_check <boolean>`      | Whether players with invalid hashes may join (default `false`)     |
| `sv_kickafk <minutes>`         | Kicks players who are AFK this long. `0` disables it (default `0`) |
| `sv_kill <player>`             | Kills a player                                                     |
| `sv_getobject <object_id>`     | Prints an object's memory address. Mostly for scripters            |
| `sv_invis <player> [seconds]`  | Camo for a duration. `0` (default) lasts until they die            |
| `sv_setspeed <player> <speed>` | Changes a player's speed (default `1`)                             |
| `sv_say <msg>`                 | Sends a message to the whole server                                |
| `sv_gethash <player>`          | Prints a player's hash                                             |

---

[server_template]: https://github.com/Chalwk/SPCLib/releases/tag/phasor-server-templates
[phasor_scripts]: https://github.com/Chalwk/SPCLib/tree/master/phasor