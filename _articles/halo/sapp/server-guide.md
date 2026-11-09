---
title: "Halo: SAPP Server Guide"
permalink: /halo/sapp/server-guide/
date: 2026-04-02
last-updated: 2026-11-10
categories: [ education, halo, modding, server ]
tags: [ sapp, lua, scripting, hosting, multiserver, tutorial ]
---

This guide covers running a Halo dedicated server with SAPP, starting from the pre-configured
packages in
the [SAPP Server Templates](https://github.com/Chalwk/SPCLib/releases/tag/sapp-server-templates)
release:

- `SAPP_PC.zip`: Halo PC (Retail)
- `SAPP_CE.zip`: Halo Custom Edition (CE)

Pick the package that matches your version of Halo. Both have the same layout; only the server
executable differs.

First you get a single server running and learn what every file does. Then you convert it into a
multiserver setup: more game modes on more ports, all sharing one set of admin files, maps, and
SAPP binaries.

---

## Package Contents

This is the folder structure after extracting either zip.

```text
.                                        Root of the extracted server
|   haloded.exe                          Dedicated server executable (PC package)
|   haloceded.exe                        Dedicated server executable (CE package)
|   libeay32.dll                         OpenSSL library
|   libgcc_s_dw2-1.dll                   GCC runtime library
|   motd.txt                             Message of the Day (CE only)
|   run.bat                              Windows launch script
|   run.sh                               Linux/Wine launch script
|   sapp.dll                             SAPP binary
|   ssleay32.dll                         OpenSSL library
|   Strings.dll                          SAPP loader
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

Each package ships only the executable for its platform: `haloded.exe` for PC, `haloceded.exe` for
CE.

Two folders are named `sapp`. The root `sapp\` holds global files shared by every instance. The
`cg\sapp\` folder holds settings for one instance. Keep them straight, because the multi-server
setup depends on the difference.

---

## File Reference

### Root Files

- `haloded.exe` / `haloceded.exe`: The dedicated server executable (PC or CE).
- `sapp.dll`: The SAPP binary. Halo loads it when the `load` command runs.
- `Strings.dll`: The SAPP loader. The `load` command needs it enabled and `sapp.dll` present.
- `libeay32.dll`, `ssleay32.dll`, `libgcc_s_dw2-1.dll`: OpenSSL and GCC runtime libraries. Keep
  them next to the executable.
- `motd.txt`: Message of the Day shown to joining players. CE only. It is set with `sv_motd`, and
  the package includes the file for convenience.
- `run.bat` / `run.sh`: Launch scripts for Windows and Linux/Wine. See
  [Run a Single Server](#run-a-single-server).

### Global Configs (`sapp\`)

Every server instance of the same platform reads these files from the root `sapp\` folder.

- `admins.txt`: Name and password admins (V2). Each line holds a name, an MD5-hashed password, and a
  level, for example `AdminName <md5_hash> 4`. Entries are normally created with `admin_add` or
  `admin_add_manually`. Log in once, admin everywhere.
- `users.txt`: CD-key admins (V1). Each entry holds a CD-key hash and a level, for example
  `<cd_key_hash> 4`, and can be limited to IP ranges. If a hash is cracked, anyone using that CD-key
  gets the admin level on join, so use IP ranges where you can. You can check a hash with the
  [Hash Checker tool](https://chalwk.github.io/SPCLib/tools/hash-checker).
- `ipbans.txt`: IP bans, with CIDR ranges supported. A ban added on one instance applies to all
  instances of the same platform.
- `areas.txt`: Custom rectangular or spherical areas, used by `event_aenter` / `event_aexit` and Lua
  events. Shared so triggers behave the same on every instance.
- `locations.txt`: Named X, Y, Z coordinates for teleport commands such as
  `t <player_id> <location_name>`.

### Instance Configs (`cg\`)

The `cg\` folder holds the config for one server instance.

- `cg\init.txt`: The startup script the server runs. It holds the basic settings (`sv_name`,
  `sv_public`, `sv_password`) and must end with `load` to start SAPP.
- `cg\sapp\init.txt`: SAPP settings for this instance: Lua, map voting, map cycle, no-lead mode,
  and so on. Typical lines are `lua true`, `mapvote true`, `no_lead true`, and `sapp_console true`.
- `cg\sapp\commands.txt`: Custom commands for this instance. Each line is
  `command_name #arg1 #arg2... 'command1;command2...' level`.
- `cg\sapp\events.txt`: Event scripting without Lua. Lines define what runs when an event fires,
  such as `event_die` or `event_score`.
- `cg\sapp\mapcycle.txt`: The map rotation, used when `sapp_mapcycle true` is set. Format:
  `map:gametype:min_players:max_players` (min and max are optional).
- `cg\sapp\mapvotes.txt`: The maps and gametypes players can vote for, used when `mapvote true` is
  set. Format: `map:gametype:display_name:min_players:max_players`. Enabling map voting disables the
  map cycle.
- `cg\sapp\lua\`: Lua scripts for complex game modes. Load each one from `cg\sapp\init.txt` with
  `lua_load "filename"`, leaving off the `.lua` extension, and set `lua true` first. The package
  includes `sample_script.lua` as a starting point. See
  [Deploying a Script](scripting-with-sapp.md#deploying-a-script).
- `cg\savegames\`: Custom game variant files (`.gamedata`). Refer to them from map cycles and
  votes.

### Maps (`maps\`)

All `.map` files live here, shared by every instance. Drop a new map in and every instance can run
it.

---

## Run a Single Server

1. Extract the zip anywhere, for example `C:\HaloServer` or `~/haloserver`.
2. Optional: open `cg\init.txt` and change `sv_name "your_server_name_here"` to your server name.
3. Launch the server:
    - Windows: double-click `run.bat`.
    - Linux or macOS with Wine: run `chmod +x run.sh`, then `./run.sh`.

`run.bat` looks like this:

```bat
@ECHO OFF
set port=2302
set root=%~dp0
set path=%root%\cg\
set exec=%path%\init.txt

rem Use haloded.exe for PC Retail, haloceded.exe for CE
"%root%haloded.exe" -path %path% -exec %exec% -port %port%
```

- `%~dp0` expands to the folder the script sits in, with a trailing backslash. That keeps the script
  portable.
- `-path` points at the instance configs (`cg\`).
- `-exec` points at that instance's `init.txt`.
- `-port` Specifies the UDP port the server listens on (default Halo port is `2302`, but custom
  ports like `2310` are commonly used to avoid conflicts or run multiple servers).

`run.sh` does the same through `wine`.

The server console opens and SAPP loads. The console output confirms SAPP is active.

---

## Multi-Server Setup

Each extra instance is a small copy of `cg\` plus its own launch script and port. The executable,
`sapp.dll`, the maps, and the global `sapp\` files stay in one place.

### Step 1: Move the Original Instance

The original instance lives directly in `cg\`. Give it its own folder so more instances can sit
beside it:

1. Create `cg\myserver\` (use any name).
2. Move `init.txt`, `sapp\`, and `savegames\` from `cg\` into `cg\myserver\`.
3. In `run.bat`, change `set path=%root%cg\` to `set path=%root%cg\myserver\`.

### Step 2: Copy the Instance

Copy `cg\myserver\` to a new folder named after the game mode, such as `cg\gun_game\`. Copying
`savegames\` is optional: bring it only if the new instance needs the same variants.

```text
cg\
+---myserver\           Original instance
|   +---sapp\
|   +---savegames\      (optional)
|   \---init.txt
\---gun_game\           New instance, copied from myserver
    +---sapp\
    +---savegames\      (optional)
    \---init.txt
```

> [!CAUTION]
> Do not copy the root `sapp\` folder when creating new instances. The root `sapp\` folder is global
> and shared across all server instances.

### Step 3: Customize the Copy

Edit these files inside `cg\gun_game\`:

- `init.txt`: Change `sv_name`, and optionally `sv_password`.
- `sapp\init.txt`: Adjust SAPP settings, such as map voting and which Lua scripts to load.
- `sapp\mapcycle.txt` or `sapp\mapvotes.txt`: Set the map rotation for this mode.
- `sapp\lua\`: Put the mode's Lua scripts here.

> [!IMPORTANT]
> `load` must always remain the final command in your instance `init.txt` file. Placing commands
> after `load` will cause them to be ignored.

### Step 4: Pick a Port

Each instance needs its own UDP port. Create `run_gun_game.bat` next to `run.bat`:

```bat
@ECHO OFF
rem 2302 is taken by the first instance
set port=2303
set root=%~dp0
set path=%root%\cg\gun_game\
set exec=%path%\init.txt

rem Use haloded.exe for PC Retail, haloceded.exe for CE
"%root%haloded.exe" -path %path% -exec %exec% -port %port%
```

### Step 5: Launch Everything

- Manually: run each script. Each server gets its own console window.
- All at once on Windows: use a master batch file with Windows Terminal:

```bat
@ECHO OFF
cd /d "%~dp0"
wt.exe cmd /k "run.bat" ^
 ; new-tab cmd /k "run_gun_game.bat"
```

---

## Shared and Per-Instance Files

| Item                                                     | Location                   | Scope        |
|----------------------------------------------------------|----------------------------|--------------|
| Server executable, `sapp.dll`, `Strings.dll`, other DLLs | Root                       | Shared       |
| `.map` files                                             | `maps\`                    | Shared       |
| `admins.txt`, `users.txt`, `ipbans.txt`                  | `sapp\`                    | Shared       |
| `areas.txt`, `locations.txt`                             | `sapp\`                    | Shared       |
| `init.txt` (name, password, `load`)                      | `cg\<instance>\`           | Per instance |
| `init.txt`, `commands.txt`, `events.txt`                 | `cg\<instance>\sapp\`      | Per instance |
| `mapcycle.txt`, `mapvotes.txt`                           | `cg\<instance>\sapp\`      | Per instance |
| Lua scripts                                              | `cg\<instance>\sapp\lua\`  | Per instance |
| Game variants                                            | `cg\<instance>\savegames\` | Per instance |

What the split gives you:

- Shared admins and bans: Ban a player on one instance and they are banned on all of them. Add an
  admin once and they are an admin everywhere. To change a global setting, edit one file and run
  `reload`.
- Small copies: A new instance is a few kilobytes of config. You never duplicate the executable,
  `sapp.dll`, or the maps.
- Isolation: Each instance has its own name, password, map rotation, and Lua scripts. A change to
  one never touches another.

---

## Updating

- SAPP: Replace `sapp.dll` and `Strings.dll` in the root folder. Every instance uses the new
  version on its next start.
- Maps: Drop the `.map` file into the root `maps\` folder. Every instance can run it.
- Moving the install: The scripts use `%~dp0`, so you can move the whole folder anywhere without
  setting environment variables.

---

## Related Guides

- [Scripting with SAPP](scripting-with-sapp.md): Writing and deploying Lua scripts.
- [SAPP Cheat Sheet](cheat-sheet.md): The commands behind the settings above, including
  [Configuration](cheat-sheet.md#configuration-commands),
  [Map Cycle](cheat-sheet.md#map-cycle-commands),
  [Map Vote](cheat-sheet.md#map-vote-commands),
  [Event](cheat-sheet.md#event-and-custom-commands), and
  [Custom](cheat-sheet.md#command-reference) commands.