---
layout: post
title: "Halo PC/CE: SAPP Multi-server Management"
date: 2025-09-2
author: Jericho Crosby
categories: [ education, halo, modding ]
tags: [ sapp, lua, halo, scripting, tutorial ]
---

# A Masterclass in Multi-Server Management

Running multiple Halo servers can quickly become a maintenance nightmare. But what if you could manage multiple servers
as easily as one?

This guide walks you through the exact architecture powering a full suite of Halo SAPP servers (Custom Edition and PC).
It's efficient, consistent, and incredibly easy to maintain. By the end, you'll know how to set up a unified,
professional server cluster that saves disk space, simplifies administration, and keeps your game modes perfectly
isolated.

## The Problem: The Naive Way to Manage Many Servers

A typical approach would be to create completely separate folders for each server, each with its own:

- Game executable (`haloceded.exe` or `haloded.exe`)
- SAPP DLL and dependencies
- Full set of config files (`admins.txt`, `users.txt`, `commands.txt`, etc.)
- Map files
- Save data

This leads to a nightmare of redundancy:

- **Wasted disk space:** Multiple copies of the same ~500MB+ map files and executables.
- **Administrative hell:** Adding an admin or banning a player requires manually repeating the same action across every
  server. Inconsistency is inevitable.

## The Solution: Exploiting SAPP's Dual Folder Design

My architecture solution solves these problems by leveraging SAPP's intended separation between *global* and
*instance-specific* configurations. The result is a clever, hierarchical folder layout that is both powerful and easy to
understand.

### Directory Structure Overview

```
C:\SERVERS\
├── CE/                          # Halo Custom Edition Server Root
│   ├── haloceded.exe            # Shared Binary
│   ├── sapp.dll                 # Shared SAPP
│   ├── maps/                    # Shared Map Files
│   ├── sapp/                    # GLOBAL Config Hub
│   │   ├── admins.txt           # <-- Unified Administration!
│   │   ├── users.txt            # <-- Unified User Management!
│   │   ├── ipbans.txt           # <-- "Smart Ban" System!
│   │   ├── areas.txt
│   │   └── locations.txt
│   └── cg/                      # Individual Server Configs
│       ├── divide_and_conquer/
│       │   ├── init.txt         # Server-specific settings
│       │   └── sapp/
│       │       ├── init.txt     # Instance-specific SAPP config
│       │       ├── commands.txt # Game-mode specific commands
│       │       ├── mapcycle.txt # Game-mode specific rotation
│       │       └── lua/
│       │           └── divide_and_conquer.lua # Game-mode script
│       ├── gun_game/            # [Another Server Instance]
│       └── ... (more)
├── PC/                          # Halo PC Server Root (identical structure to CE)
└── server_launchers/
├── ce/
│   ├── divide_and_conquer.bat # Launch Scripts
│   └── ... (more)
└── pc/
└── ... (batch files)
```

### How It Works: Masterful Use of SAPP's Design

The system's brilliance lies in its explicit use of two dedicated `sapp` directories, each with a distinct purpose:

- **Global Shared Configs (`/root/sapp/`)**  
  This directory contains the administrative core that governs the entire server cluster. Files placed here are enforced
  across all servers sharing the same root (e.g., all CE servers).

    - `admins.txt`, `users.txt`, `ipbans.txt` → **Unified "Smart Ban / Admin" System**
    - `areas.txt`, `locations.txt` → **Shared World Definitions**

  If you ban a player on one server, they are banned on all servers. Similarly, adding an admin on one server adds them
  everywhere.

- **Instance-Specific Configs (`/root/cg/<server_name>/sapp/`)**  
  This directory defines the unique personality of each individual server. Settings here affect only that specific game
  mode.

    - `commands.txt`, `events.txt` → **Custom Commands & Hooks**
    - `mapcycle.txt`, `mapvotes.txt` → **Unique Map Rotation & Voting**
    - `lua/<script>.lua` → **Unique server-specific Lua scripts**

### Portable Configuration with Environment Variables

To make the setup portable and easy to configure, we use system environment variables to define the root server paths.
This means the batch files don't need hardcoded paths—you can move the entire installation without editing dozens of
files.

**Environment Variables Setup:**

- `CE_SERVERS_ROOT = C:\SERVERS\CE` (points to Custom Edition root)
- `PC_SERVERS_ROOT = C:\SERVERS\PC` (points to PC root)

**The Launch Script**  
The launch scripts are the glue that makes everything work. Here's the batch file for the CE Divide and Conquer server (
`server_launchers\ce\divide_and_conquer.bat`):

```batch
@ECHO OFF
set root=%CE_SERVERS_ROOT%
set path=%root%\cg\divide_and_conquer
set exec=%path%\init.txt
set port=2301
cd /d %root%
"%root%\haloceded.exe" -path %path% -exec %exec% -port %port%
```

The `-path %path%` parameter is the most important part. It tells the executable: *"Your working directory for this
instance is `%CE_SERVERS_ROOT%\cg\divide_and_conquer`."*

This directive causes SAPP to:

1. Load its instance-specific configuration from `%path%\sapp\` (e.g., `mapcycle.txt`).
2. Simultaneously pull global, shared data from the `../sapp` folder (relative to the executable) for files like
   `admins.txt`.

> **Note:** This is not a fallback mechanism. It is a deliberate, fixed feature of SAPP that your structure leverages
> optimally. This clear separation is what makes the architecture robust and professional.

**Configuration Simplicity**  
With environment variables, configuring a new server batch file requires changing only two values:

1. The config directory name in the `path` variable
2. The port number

Example for a new server:

```batch
@ECHO OFF
set root=%CE_SERVERS_ROOT%
set path=%root%\cg\my_new_mode  # ← Only this changes
set exec=%path%\init.txt
set port=2302                   # ← And this changes if you need to modify the port
cd /d %root%
"%root%\haloceded.exe" -path %path% -exec %exec% -port %port%
```

## Key Benefits and Genius Practices

### 1. Unified Administration ("Smart Ban System")

By placing `admins.txt`, `users.txt`, and `ipbans.txt` **only in the global root `sapp` directory**, they are shared
across all servers.

- **Action:** Ban a player on one server.
- **Result:** They are instantly banned on all servers on that platform.

This is a huge deterrent for troublemakers and a massive administrative time-saver.

### 2. Efficient Disk Usage

- **No Redundancy:** Only one copy of the game executable, SAPP DLL, core dependencies, and map files exists per
  platform (CE/PC).
- **Saves gigabytes** compared to the naive many-folder approach.

### 3. Effortless Maintenance and Updates

- **Update SAPP?** Just replace `sapp.dll` in the root folder. Done.
- **Add a new map?** Drop it in the root `maps/` folder. All servers can now use it.
- **Change a core admin setting?** Modify a file in the global `sapp` folder once.
- **Move installation location?** Simply update the `CE_SERVERS_ROOT` and `PC_SERVERS_ROOT` environment variables.

### 4. Perfect Isolation Where Needed

Each server's game mode logic and map rotation are perfectly isolated in their own `cg/<mode>/` folder. Changing one
mode's mapcycle has no effect on another. This prevents conflicts and allows total customization of each server's
experience.

### 5. Clear and Organized Structure

The layout is logical and intuitive. Anyone new to the project can understand the hierarchy and relationship between
servers within minutes.

## Implementation Guide

### Step 1: Set Environment Variables

- Create system environment variables `CE_SERVERS_ROOT` and `PC_SERVERS_ROOT` pointing to your server root directories.
- After creating these variables, restart any command prompts or applications that need to access them.

### Step 2: Batch File Configuration

- Use the template above for all server batch files.
- Only modify the config directory name and port number for each server.
- Place all batch files in the `server_launchers` directory organized by platform.

### Step 3: Bulk Server Launching (All Servers at Once)

Managing many servers is already effortless with the environment variable + batch file system. But what if you want to
launch *all of them at once*?

Instead of manually clicking each `.bat` file, you can use **Windows Terminal** (`wt.exe`) to open each server in its
own tab within a single window.

**Example master launcher (`launch_all_ce.bat` for CE):**

```batch
@ECHO OFF
cd /d "%~dp0"

wt.exe cmd /k "%~dp0divide_and_conquer.bat" ^
 ; new-tab cmd /k "%~dp0gun_game.bat" ^
 ; new-tab cmd /k "%~dp0kill_confirmed.bat" ^
 ; new-tab cmd /k "%~dp0melee_attack.bat" ^
 ; new-tab cmd /k "%~dp0one_in_the_chamber.bat" ^
 ; new-tab cmd /k "%~dp0rooster_ctf.bat" ^
 ; new-tab cmd /k "%~dp0snipers_dream_team.bat" ^
 ; new-tab cmd /k "%~dp0tag.bat"
```

**How It Works:**

- `wt` → Launches Windows Terminal.
- `cmd /k "<batfile>"` → Runs the server batch file and keeps the tab open.
- `new-tab` → Opens a new tab for the next server.

**Usage:**

1. Save the script as `launch_all_ce.bat` inside `server_launchers\ce\`
2. Double-click it to launch all of your servers in separate tabs.
3. Make a similar script for PC servers by swapping in their `.bat` filenames.

### Step 4: Server Configuration

- Place global admin/ban files in the root `sapp` directory.
- Place server-specific configs in each server's `cg/<server_name>/sapp/` directory.

---