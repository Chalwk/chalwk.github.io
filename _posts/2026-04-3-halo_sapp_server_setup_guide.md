---
title: "Halo PC/CE: SAPP Multi-server Management"
date: 2025-09-8
categories: [ education, halo, modding ]
tags: [ sapp, lua, halo, scripting, tutorial ]
---

# A Masterclass in SAPP Server Management

Running a Halo dedicated server with SAPP is easy when you have a pre‑configured package. Running *multiple* servers can
also be easy - if you understand how SAPP separates global and instance‑specific files.

This guide starts with a **single‑server instance** - exactly what you get in the pre‑configured package from
the [ReadyToGo releases](https://github.com/Chalwk/HALO-SCRIPT-PROJECTS/releases/tag/ReadyToGo). You will
learn what every file and folder does, and how to launch your server. Then, without repeating file descriptions, you
will learn how to **convert the single instance into a multi‑server cluster** - adding more game modes on different
ports while sharing admin settings, maps, and SAPP binaries.

---

## What You Get in a Pre‑Configured Package

The ready‑to‑run archive (e.g., `HCE_Server.zip`) contains a complete, working SAPP server environment. Below is the
exact folder structure you will see after extracting the zip file.

```
.                                        # Root of the extracted server
│   haloceded.exe                        # Dedicated server executable (CE)
│   haloded.exe                          # For PC version
│   libeay32.dll                         # OpenSSL library (for secure features)
│   libgcc_s_dw2-1.dll                   # GCC runtime library
│   motd.txt                             # Message of the Day (CE only)
│   run.bat                              # Windows launch script
│   run.sh                               # Linux/Wine launch script
│   sapp.dll                             # SAPP mod binary
│   ssleay32.dll                         # OpenSSL library
│   Strings.dll                          # SAPP loader / string library
│
├───cg                                   # Instance‑specific configs
│   │   init.txt                         # Server startup commands (root)
│   │
│   ├───sapp                             # SAPP configs for this instance
│   │   │   commands.txt                 # Custom commands
│   │   │   events.txt                   # Event scripting
│   │   │   init.txt                     # SAPP settings
│   │   │   mapcycle.txt                 # Map rotation (if used)
│   │   │   mapvotes.txt                 # Map voting options (if used)
│   │   │
│   │   └───lua                          # Lua scripts folder
│   │           sample_script.lua        # Example Lua script
│   │
│   └───savegames                        # Game variant files
│
├───maps                                 # All map files (.map)
│       beavercreek.map
│       bloodgulch.map
│       ... (all standard maps)
│
└───sapp                                 # GLOBAL shared configuration
admins.txt                               # CD‑key based admins
areas.txt                                # Custom map areas
ipbans.txt                               # IP ban list
locations.txt                            # Named teleport locations
users.txt                                # Name/password based admins
```

> **Note:** The package contains **one** server instance (the `cg` folder). If you want to run multiple servers (
> different game modes on different ports), you will expand this structure -
> see [Converting to Multi‑Server](#converting-a-single-server-package-to-multi-server).

---

## What Each File and Folder Does

### Root Directory Files

- **`haloceded.exe` / `haloded.exe`**  
  The Halo dedicated server executable. Use the correct one for your platform (CE or PC).

- **`sapp.dll`**  
  The SAPP mod. Loaded by Halo when the `load` command is issued.

- **`Strings.dll`**  
  A helper DLL that enables SAPP to intercept and modify Halo's behaviour. Required.

- **`libeay32.dll` / `ssleay32.dll` / `libgcc_s_dw2-1.dll`**  
  Runtime libraries for OpenSSL and GCC. Required for certain SAPP features (e.g., remote console encryption).

- **`motd.txt`**  
  Message of the Day - displayed to players when they join. **This is for Halo PC only** (Custom Edition uses `sv_motd`
  pointing to a file; the package includes it for convenience but it only works on PC).

- **`run.bat`** (Windows) and **`run.sh`** (Linux/Wine)  
  Launch scripts that start the server with the correct command‑line arguments.
  See [How to Run the Single Server](#how-to-run-the-single-server-out-of-the-box).

### Global Shared Configs (`sapp\`)

These files are read from the root `sapp\` folder and are **shared across every server instance** of the same platform.
This gives you unified administration.

- **`admins.txt`** - CD‑key based administrators (V1 admins). Format: one CD‑key hash per line, optionally with an admin
  level and IP ranges.  
  *Example:* `0123456789abcdef0123456789abcdef 4`  
  If you add an admin here, they are admin on *all* servers.

- **`users.txt`** - Name‑and‑password based administrators (V2 admins). Each line contains a name, an MD5‑hashed
  password, and a level.  
  *Example:* `AdminName 5f4dcc3b5aa765d61d8327deb882cf99 4`  
  Shared across all servers - log in once, manage everywhere.

- **`ipbans.txt`** - Permanent IP bans (CIDR ranges supported). A ban added on one server blocks the player on all
  servers of the same platform.

- **`areas.txt`** - Custom rectangular or spherical areas used with `event_aenter` / `event_aexit` or Lua events. Shared
  so that area triggers work identically on all servers.

- **`locations.txt`** - Named coordinates (X,Y,Z) for teleport commands like `t <player> <location>`. Shared across
  instances.

### Instance‑Specific Configs (`cg\` and `cg\sapp\`)

The folder `cg\` holds configuration for **your single server instance**. Everything inside is unique to this server.

- **`cg\init.txt`**  
  The main startup script executed by `haloceded.exe`. Contains basic settings (`sv_name`, `sv_public`, `sv_password`)
  and **must end with the `load` command** to activate SAPP.

- **`cg\sapp\init.txt`**  
  The SAPP configuration file for this instance. Controls Lua scripting, map voting, map cycles, no‑lead mode, admin
  permissions, etc.  
  *Typical settings:* `lua true`, `mapvote true`, `no_lead true`, `sapp_console true`.

- **`cg\sapp\commands.txt`**  
  Custom commands that only work on this server instance. Each line defines a command name, its action (a sequence of
  SAPP commands), and the required admin level.

- **`cg\sapp\events.txt`**  
  Event‑based scripting (simpler than Lua). Lines define what happens when, for example, a player dies (`event_die`) or
  scores (`event_score`).

- **`cg\sapp\mapcycle.txt`**  
  Used when `sapp_mapcycle true` is set. Defines the automatic rotation of maps and gametypes. Format:
  `map:gametype:min_players:max_players` (min/max are optional).

- **`cg\sapp\mapvotes.txt`**  
  Used when `mapvote true` is set. Lists the maps and gametypes that players can vote for. Format:
  `map:gametype:display_name:min_players:max_players`.

- **`cg\sapp\lua\`**  
  Lua scripts that implement complex game modes (e.g., Gun Game, Divide and Conquer). Loaded via `lua_load "filename"`
  in `cg\sapp\init.txt`. The package includes a placeholder `sample_script.lua` to get you started.

- **`cg\savegames\`**  
  Folder for custom game variant files (`.gamedata`). You can place your own variants here and refer to them in map
  cycles or votes.

### Maps Folder (`maps\`)

Contains all `.map` files. Shared across all server instances. Add new maps here to make them available to every server.

---

## How to Run the Single Server (Out of the Box)

1. **Extract the zip file** to any location on your hard drive (e.g., `C:\HaloServer` or `~/haloserver`).

2. **Edit the server name** (optional)  
   Open `cg\init.txt` and change `sv_name "your_server_name_here"` to your desired server name.

3. **Launch the server**
    - On Windows: double‑click `run.bat`.
    - On Linux / macOS with Wine: make `run.sh` executable (`chmod +x run.sh`) and run `./run.sh`.

The batch script (`run.bat`) contains:

```batch
@ECHO OFF
set port=2302
set root=%~dp0
set path=%root%\cg\
set exec=%path%\init.txt
"%root%\haloceded.exe" -path %path% -exec %exec% -port %port%
```

- `%~dp0` expands to the folder where the script is located (makes it portable).
- `-path` tells the server where to find the instance‑specific configs (`cg\`).
- `-exec` points to the main `init.txt`.
- `-port` sets the UDP port (default 2302).

The Linux script (`run.sh`) does the same using `wine`.

After launching, the server console will open and SAPP will load. You should see output indicating that SAPP is active.

That's it - you now have a working SAPP server.

---

## Converting a Single‑Server Package to Multi‑Server

The package is designed to be easily expanded to run **multiple server instances** (e.g., different game modes on
different ports) without duplicating large files. Here is how to do it.

### Step 1: Create a New Instance Folder

Inside the root folder, create a new subfolder under `cg\` for your second server. Name it after the game mode (e.g.,
`gun_game`). Then copy the entire contents of the existing `cg\` folder **except the `savegames` subfolder** (you can
share savegames or not - your choice).

Example:

```
cg\
├── myserver\           # Original instance (rename if you like)
│   ├── init.txt
│   ├── sapp\
│   └── savegames\      (optional)
└── gun_game\           # New instance
    ├── init.txt        # Copied from myserver
    ├── sapp\           # Copied from myserver
    └── savegames\      (optional)
```

> **Important:** Do not copy the root `sapp\` folder - that one is global and shared.

### Step 2: Customise the New Instance

Edit the following files inside `cg\gun_game\` to give the new server its own identity:

- **`init.txt`** - Change `sv_name` (server name) and optionally `sv_password`.
- **`sapp\init.txt`** - Adjust SAPP settings (e.g., different mapvote options, Lua scripts to load).
- **`sapp\mapcycle.txt`** or **`sapp\mapvotes.txt`** - Provide a different map rotation.
- **`sapp\lua\`** - Place game‑mode‑specific Lua scripts here.

> **Note:** The `load` command in `init.txt` must remain the last line.

### Step 3: Assign a Unique Port

Each server instance must listen on a different UDP port. Create a new launch script for the new instance (e.g.,
`run_gun_game.bat`):

```batch
@ECHO OFF
set port=2303                    # Different port (2302 is used by the first server)
set root=%~dp0
set path=%root%\cg\gun_game
set exec=%path%\init.txt
"%root%\haloceded.exe" -path %path% -exec %exec% -port %port%
```

On Linux, copy `run.sh` to `run_gun_game.sh` and change the `PORT` variable accordingly.

### Step 4: Launch Multiple Servers

- **Manually** - Double‑click each `.bat` file (or run each `.sh`). Each runs in its own console window.
- **All at once (Windows)** - Use a master batch file with Windows Terminal:

```batch
@ECHO OFF
cd /d "%~dp0"
wt.exe cmd /k "run.bat" ^
 ; new-tab cmd /k "run_gun_game.bat"
```

### What Remains Shared (No Duplication)

Because you keep the **global** `sapp\` and `maps\` folders untouched, all instances automatically share:

- `admins.txt`, `users.txt`, `ipbans.txt` - Unified administration.
- `areas.txt`, `locations.txt` - Shared world definitions.
- All map files - No wasted disk space.

Only the small `cg\<mode>\` folders (a few kilobytes each) are duplicated and customised.

---

## Why This Architecture Works

### Unified Administration ("Smart Ban")

Because `admins.txt`, `users.txt`, and `ipbans.txt` live only in the **global** `sapp\` folder, every server instance
reads the same files.

- Ban a player on the Gun Game server → they are also banned on the main server and all other instances.
- Add a new admin → they are instantly admin everywhere.
- Change a global setting → edit one file, reload SAPP, and all instances pick up the change.

### Efficient Disk Usage

- Only one copy of `haloceded.exe`, `sapp.dll`, and every `.map` file.
- Adding a new game mode requires only a small `cg\<newmode>\` folder (a few kilobytes), not gigabytes.

### Perfect Isolation Where It Matters

Each server instance has its own:

- `init.txt` (different server name, password)
- `mapcycle.txt` / `mapvotes.txt` (different map rotations)
- `lua\` scripts (different game mechanics)

Changes to one mode never affect another.

### Effortless Updates

- **Update SAPP** - replace `sapp.dll` and `Strings.dll` in the root folder. All servers immediately use the new
  version.
- **Add a new map** - drop it into the root `maps\` folder. All servers can now run it.
- **Move the entire installation** - because the scripts use `%~dp0` (relative paths), you can move the folder anywhere;
  no environment variables needed.

---