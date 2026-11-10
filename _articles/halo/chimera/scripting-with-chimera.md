---
title: "Scripting with Chimera: Client-Side Lua"
permalink: /halo/chimera/scripting-with-chimera/
description: "Guide to client-side Lua scripting with Chimera, covering event callbacks, HUD rendering, camera manipulation, and memory offsets."
date: 2026-11-09
last-updated: 2026-11-10
categories: [ education, halo, modding ]
tags: [ chimera, lua, scripting, client, tutorial ]
---

Chimera is a client-side mod for Halo PC/CE. It provides event hooks, commands, built-in map
downloads, and a lot of quality-of-life fixes. This guide covers its Lua API, with practical
examples for HUDs and gameplay tweaks.

Memory offsets, game constants, shared helpers, and Chimera's hardcoded pointers are in
[Common Reference](../common-reference.md).

| Property           | Value                                                                                     |
|--------------------|-------------------------------------------------------------------------------------------|
| Lua runtime        | Lua 5.5                                                                                   |
| Lua 5.2+ syntax    | Available: `goto`, `_ENV`, integer division `//`, native bitwise operators `& \| ~ << >>` |
| Sandboxing         | Global scripts: not sandboxed. Map scripts: sandboxed by default.                         |
| Reload all scripts | Console command `chimera_lua_scripts_reload` (`~` opens the console)                      |
| Player index       | 0-15 everywhere                                                                           |

---

## Where to Put Your Scripts

Chimera looks for Lua scripts in two folders and treats them differently:

- Global scripts: Put `.lua` files in `chimera\lua\scripts\global`. They load when Chimera starts
  and stay active until you reload them. Use this for tools and HUD mods you want all the time.
  Global scripts are not sandboxed.

- Map scripts: Put scripts in `chimera\lua\scripts\maps`. They load when their map is active and
  unload when you leave it. Map scripts are sandboxed by default (see
  [Sandbox Restrictions](#sandbox-restrictions-map-scripts)).

By default, the Chimera folder is located inside your Halo data folder:

- **Halo Custom Edition (CE):** `%USERPROFILE%\Documents\My Games\Halo CE\chimera`
- **Halo PC:** `%USERPROFILE%\Documents\My Games\Halo\chimera`

**Linux:** `~/Documents/My Games/Halo CE/chimera` or `~/Documents/My Games/Halo/chimera`, depending
on your setup.

## Script Skeleton

See [Chimera Lua Template](template.md) for every callback. Register only the ones the script
uses.

Every Chimera Lua script must define `clua_version` as the Chimera API version it targets (for
example `2.056`). Without it, Chimera will not load the script.

```lua
clua_version = 2.056

set_callback("map load", "OnMapLoad")
set_callback("tick",     "OnTick")

function OnMapLoad()
    console_out("Map: (" .. map .. ")")
end

function OnTick() end -- runs every tick; keep this lean
```

## Callbacks and Event Priorities

`set_callback("event", "GlobalFnName" [, priority])`. The callback function must be global (not
local or anonymous).

Scripts declare `clua_version` to match the Chimera API version they target. Chimera loads a script
only when the declared version is compatible:

| Script version                 | Example (vs 2.056) | Loads? |
|--------------------------------|--------------------|--------|
| Same                           | 2.056              | Yes    |
| Lower, same major version      | 2.04               | Yes    |
| Higher                         | 2.06               | No     |
| Lower, different major version | 1.5                | No     |

### Event Priorities

When setting a callback with `set_callback`, you can specify a priority as the third argument.
Priorities determine the order in which multiple scripts' callbacks run. If multiple scripts use the
same priority, they run in script load order.

- `"before"`: runs before default callbacks
- `"default"`: normal priority (used if omitted)
- `"after"`: runs after default callbacks
- `"final"`: runs last; any return values are ignored (useful for monitoring)

Example:

```lua
set_callback("tick", "OnTickEarly", "before")
set_callback("tick", "OnTickMain", "default")
set_callback("tick", "OnTickLate", "after")
```

### Events

The [Chimera Lua Template](template.md) lists every event string with its callback signature. Draw
calls such as `draw_text` belong in the per-frame callbacks (`"preframe"` or `"frame"`), not
`"tick"`.

### Return Values and Event-Specific Notes

- `"command"`: called for any console command except Chimera's own commands and `rcon`. Return
  `false` to block the command and suppress the "unknown command" error; return `true` or nothing to
  allow it.
- `"rcon_message"`: return `false` to block the message.
- `"precamera"`: must return all ten camera values (see Camera Manipulation).
- `"unload"`: fired when the script unloads (map change or manual reload). The map may already have
  changed by then.

### Sandbox Restrictions (Map Scripts)

Sandboxed scripts (map scripts by default) run with a stripped environment. Chimera disables
`io`, `dofile`, `getfenv`, `load`, `loadfile`, `loadstring`, `require`, `os.execute`, `os.exit`,
`os.remove`, `os.rename`, and `os.tmpname` before your code runs.

Memory read/write functions (`read_int`, `write_float`, `read_string`, etc.) are also restricted to
the address range `0x40000000` to `0x41B00000`. Outside that range, a sandboxed script will raise an
error. If you need file access or unrestricted memory access, place the script in the `global`
folder instead.

### Embedded Scripts (Advanced)

Mapmakers can bake Lua scripts into their `.map` files with tools like Harbinger. Chimera loads
these embedded scripts when `load_embedded_lua = 1` is set in `chimera.ini`. The script runs when
players load that map, so there is no separate file to install.

### Hotkeys: Running Scripts with Keystrokes

Chimera can bind commands to keyboard keys in `chimera.ini`. You can bind:

- Chimera's native commands
- Halo's built-in console commands
- Your own script commands (like `wpninfo` or `compass`)

For example, bind `F5` to `compass` to toggle a compass HUD without typing in the console.

## Displaying Information on Screen

The simplest way to talk to the player is `hud_message("your text")`, `console_out(...)` or
`draw_text(...)`:

```lua
function OnTick()
    hud_message("Chimera Rocks!")                     -- standard hud message

    console_out("Chimera Rocks!")                     -- standard console output
    console_out("Chimera Rocks!", 1.0, 0.35, 0.35)    -- w/RGB colors (red, green, blue)
    console_out("Chimera Rocks!", 1, 1.0, 0.35, 0.35) -- w/ARGB colors (alpha, red, green, blue)
end

function OnPreFrame()
    draw_text(
        "Hello, World!",
        0, 460, 640, 480, -- left, top, width, height
        "small",          -- font: small, large, ticker
        "right",          -- alignment: left, center, right
        1.0,              -- alpha
        0.45,             -- red
        0.72,             -- green
        1.0               -- blue
    )
end
```

`draw_text()` draws text inside a rectangular screen region. Supported fonts: `"small"`, `"large"`,
`"ticker"`. Supported alignments: `"left"`, `"center"`, `"right"`.

```lua
draw_text(text, left, top, width, height, font, align, a, r, g, b)
```

## Global Variables

Chimera exposes several read-only global variables that provide useful information about the current
game state, your script's environment, and the Chimera version.

| Variable             | Description                                                                                                                 |
|----------------------|-----------------------------------------------------------------------------------------------------------------------------|
| `build`              | Chimera build number. Negative = alpha/pre-release; positive = public release.                                              |
| `full_build`         | If `build` is negative, contains the next public release build number; otherwise equals `build`.                            |
| `gametype`           | Current gametype: `"ctf"`, `"slayer"`, `"oddball"`, `"king"`, or `"race"`.                                                  |
| `local_player_index` | Local player index (0-15). May be `nil` until assigned after joining a server.                                              |
| `map`                | Currently loaded map name.                                                                                                  |
| `map_is_protected`   | `true` if the map uses protected tag data (e.g., `"h3mt-foundry"`).                                                         |
| `sandboxed`          | `true` if the script is running in a sandboxed environment (see [Sandbox Restrictions](#sandbox-restrictions-map-scripts)). |
| `script_name`        | Filename for global scripts, or map name for map scripts.                                                                   |
| `script_type`        | `"global"` or `"map"`.                                                                                                      |
| `server_type`        | `"none"` (single player), `"local"` (hosting), or `"dedicated"` (joined a server).                                          |

Chimera has no `halo_type` global. See [Detecting PC vs. CE](#detecting-pc-vs-ce) below.

### Server Type Check

```lua
function OnTick()
    if server_type == "dedicated" then
        console_out("Running on dedicated server. Map: (" .. map .. ")")

        --
        -- Gametype-specific logic:
        --
        if gametype == "ctf" then
            -- Show flag carrier info, etc.
        elseif gametype == "slayer" then
            -- Show kill/death stats
        end

        local local_idx = local_player_index
        if not local_idx then return end -- not ready yet

        for i = 0, 15 do
            if i ~= local_idx and get_player(i) then
                -- This player is not the local player (you) and is connected
                -- You could read their kills, deaths, team, etc.
            end
        end
    end
end
```

## Detecting PC vs. CE

Chimera has no equivalent to SAPP's `halo_type` global and no function that reports which client
you are on. The SAPP hardcoded pointers do not apply, and Chimera cannot scan for signatures, so
version-specific addresses are hardcoded per platform.

The candidates table, the probe code, and the other documented addresses are in
[Chimera Pointers](../common-reference.md#chimera-pointers). Relative offsets after you hold a
pointer work the same on both platforms.

## Persistent Data Storage

> [!NOTE]
> Sandboxed scripts (map scripts) cannot use `io.*`. Put the script in the `global` folder if it
> needs file access. See [Sandbox Restrictions](#sandbox-restrictions-map-scripts).

```lua
local SAVE_FILE = "my_data.txt" -- file will appear in Halo's root installation folder

---@param stats table Table with kills, deaths, and credits.
local function saveStats(stats)
    local f = io.open(SAVE_FILE, "w")
    if f then
        f:write(string.format("%d;%d;%d", stats.kills, stats.deaths, stats.credits))
        f:close()
    end
end

---@return table stats Table with kills, deaths, and credits.
local function loadStats()
    local f = io.open(SAVE_FILE, "r")
    if not f then return { kills = 0, deaths = 0, credits = 0 } end
    local content = f:read("l")
    f:close()

    local kills, deaths, credits = (content or ""):match("(%d+);(%d+);(%d+)")
    return {
        kills = tonumber(kills) or 0,
        deaths = tonumber(deaths) or 0,
        credits = tonumber(credits) or 0
    }
end
```

## Timers

Use `set_timer` and `stop_timer` to run code after a delay or at a fixed interval instead of
counting ticks.

### `set_timer`

Registers a repeating timer and returns a timer ID that you can later cancel with `stop_timer`. The
function runs at the given interval (in milliseconds) until either:

- it returns `false`, or
- you manually remove it with `stop_timer`.

You can pass additional arguments to the callback (strings, numbers, booleans, or nil).

Syntax: `set_timer(interval_ms, "function_name", [arg1, arg2, ...])`

Returns: a numeric timer ID.

```lua
function ShowMessage(text)
    console_out(text)
end

local timer_id = set_timer(2000, "ShowMessage", "Hello from the timer!") -- runs every 2s
```

### `stop_timer`

Stops a running timer by ID. Stopping a timer that no longer exists raises an error.

Syntax: `stop_timer(timer_id)`

## Deleting Objects

Use `delete_object(object_id)` to delete objects from the game.

## Console Commands

`execute_script()` runs any Halo console command or Halo script expression (Lisp syntax) from Lua.

Syntax: `execute_script("command or script")`

Examples:

```lua
-- Show the current player list in the console
execute_script("sv_players")

-- Clear the console
execute_script("cls")

-- Change the map after 5 seconds
function ChangeMap()
    execute_script("map bloodgulch ctf")
    return false
end
set_timer(5000, "ChangeMap")

-- Display a message using Halo script syntax
execute_script('(print "Welcome to the server!")')

-- Execute a Halo script command directly
execute_script("(object_teleport (player0) teleport_flag)")
```

## Reading Player Data

Chimera is client-side. You can read any player's data because the server sends it to you, but you
can only write to your own local player.

> [!WARNING]
> Never write memory for remote players or global game state in multiplayer. It causes client
> desyncs, crashes, or server anti-cheat kicks.

### Player Pointers

Both functions use the local player when you pass no index.

```lua
local dyn_player = get_dynamic_player(player)
local static_player = get_player(player)
```

`get_dynamic_player()` returns a pointer to the player's current object. Use this for position,
velocity, health, shields, and other object data. Returns `nil` if the player is dead.

`get_player()` returns a pointer to the player's persistent player data structure. Use this for
player-related data that exists independently of the live object (team, kills, deaths, ping, name).

Field offsets for both pointers are in [Memory Offsets](../common-reference.md#memory-offsets).

### Position HUD

Chimera has no `read_vector3d` or `write_vector3d`. Read the position as three floats (or use
`getObjectPosition` from [Position and Aim](../common-reference.md#position-and-aim)):

```lua
function OnTick()
    local dyn_player = get_dynamic_player()
    if not dyn_player then return end -- player is dead

    local x = read_float(dyn_player + 0x5C)
    local y = read_float(dyn_player + 0x60)
    local z = read_float(dyn_player + 0x64)

    local static_player = get_player(local_player_index)
    local name = static_player and readPlayerName(static_player) -- see Player Name
    execute_script("cls")

    hud_message(string.format("Pos: %s, %.1f, %.1f, %.1f", name or "?", x, y, z))
end
```

## Player Name

Player names are stored as a wide-character string (2 bytes per character, UTF-16). Use
`readWideString` and `readPlayerName` from [Wide Strings](../common-reference.md#wide-strings). The
name sits at static player offset `0x4` and is at most 12 characters.

```lua
local static_player = get_player(player)
local name = static_player and readPlayerName(static_player)
```

## Camera Manipulation

Chimera allows you to modify the camera position, orientation, and field of view before the game
renders. The example below zooms the FOV while holding a sniper. `readTagPath` is in
[Tag Entry Helpers](../common-reference.md#tag-entry-helpers).

> [!IMPORTANT]
> The `OnPreCamera` callback must return all ten camera parameters. Omitting or returning a
> partial list will cause the camera to lock up or freeze.

```lua
-- x,y,z: camera position
-- fov: field of view in degrees
-- ox1,oy1,oz1: camera look-at point (forward vector)
-- ox2,oy2,oz2: up vector
function OnPreCamera(x, y, z, fov, ox1, oy1, oz1, ox2, oy2, oz2)
    local dyn_player = get_dynamic_player(local_player_index)
    if not dyn_player then return x, y, z, fov, ox1, oy1, oz1, ox2, oy2, oz2 end

    local weapon_id = read_dword(dyn_player + 0x118)
    if weapon_id ~= 0xFFFFFFFF then
        local weapon = get_object(weapon_id)
        if weapon then
            local tag_entry = get_tag(read_dword(weapon))
            local weapon_name = readTagPath(tag_entry):lower()
            if weapon_name:find("sniper") then
                fov = 20 -- zoom
            end
        end
    end

    return x, y, z, fov, ox1, oy1, oz1, ox2, oy2, oz2
end
```

## Zoom Control

Reads a weapon's zoom level count from its tag data (offset `0x3DA`) and writes the zoom state
directly to memory. The zoom pointer is `zoom_address` in
[Chimera Pointers](../common-reference.md#candidates-table).

```lua
local ZOOM_ADDRESS = 0x815918

---@param level number Zoom level (0 for level 1, 1 for level 2, 0xFFFF to unzoom).
local function setZoomLevel(level)
    local zoom_ptr = read_dword(ZOOM_ADDRESS)
    if zoom_ptr and zoom_ptr ~= 0 then
        write_word(zoom_ptr + 0xCC, level)
    end
end

---@param weapon_object number Memory address of the weapon.
---@return number zoom_levels Number of zoom levels available on the weapon.
local function getWeaponZoomLevels(weapon_object)
    local tag_id = read_dword(weapon_object)
    local tag_ptr = get_tag(tag_id)
    if not tag_ptr then return 0 end

    local tag_data = read_dword(tag_ptr + 0x14)
    return tag_data ~= 0 and read_word(tag_data + 0x3DA) or 0
end
```

## Tag Paths

Chimera provides two overloads of `get_tag`:

- `get_tag(class, name)`: looks up a tag by its class and asset path, returning the tag ID.
- `get_tag(tag_id)`: converts a tag ID into a pointer to the tag entry, so you can read the tag's
  internal data.

### Tag ID from Class and Name

```lua
local ghost_tag = get_tag("vehi", "vehicles\\ghost\\ghost_mp")
if ghost_tag then
    console_out("Ghost tag ID: " .. ghost_tag)
else
    console_out("Ghost tag not found!")
end
```

### Tag Path from an Object

Once you have an object, read its tag ID (the first dword), convert it with `get_tag(tag_id)`, then
read the path string at offset `0x10`. `readTagPath` in
[Tag Entry Helpers](../common-reference.md#tag-entry-helpers) does the last step.

```lua
local ghost_id = spawn_object("vehi", "vehicles\\ghost\\ghost_mp", 0, 0, 0)
local object = get_object(ghost_id) -- raw object pointer

if object then
    local tag_entry = get_tag(read_dword(object))
    if tag_entry then console_out(readTagPath(tag_entry)) end -- vehicles\ghost\ghost_mp
end
```

## Object Names

Gets the display name of an object (weapon, vehicle, equipment) from its tag path, using
`readTagPath` and `getShortName` from
[Tag Entry Helpers](../common-reference.md#tag-entry-helpers). `getShortName` drops the directory
part, so `weapons\assault rifle\assault rifle` becomes `assault rifle`. It returns `"N/A"` for an
invalid object and `"???"` if the tag cannot be resolved.

```lua
---@param object number|nil Object memory address.
---@return string name Short object name, "N/A", or "???".
local function getObjectName(object)
    if not object then return "N/A" end

    local tag_entry = get_tag(read_dword(object))
    if not tag_entry then return "???" end

    return getShortName(readTagPath(tag_entry))
end

function OnTick()
    local dyn_player = get_dynamic_player()
    if not dyn_player then return end -- dead

    local weapon_object_id = read_dword(dyn_player + 0x118)
    if weapon_object_id == 0xFFFFFFFF then return end -- nothing held

    local weapon_object = get_object(weapon_object_id)
    local weapon_name = getObjectName(weapon_object) -- e.g. "assault rifle"
    console_out("Weapon: " .. weapon_name)
end
```

## Enumerating Objects

To scan for all objects in the world (projectiles, vehicles, weapons, etc.), you need to read the
global object table. The address and the loop are
in [Object Table](../common-reference.md#object-table).

## Spawning Objects (Client-Side Spawning)

Chimera's `spawn_object` takes either a tag ID or a class+name.

> [!NOTE]
> Objects spawned client-side via Chimera in multiplayer sessions are local-only and will not be
> visible to other players. They are primarily useful for single-player custom mods and client-side
> testing.

```lua
-- By tag ID
local ghost_tag = get_tag("vehi", "vehicles\\ghost\\ghost_mp")
if ghost_tag then
    spawn_object(ghost_tag, x, y, z)
end

-- By class and name directly
local weapon = spawn_object("weap", "weapons\\assault rifle\\assault rifle", x, y, z)
```

## Toggle Commands

Create console toggles to enable/disable features. Type `my_command` in the console (press `~`) to
toggle.

```lua
clua_version = 2.056

local enabled = true
local command_name = "my_command"

set_callback("command", "OnCommand")
set_callback("tick", "OnTick")

function OnCommand(cmd)
    if cmd:lower() == command_name then
        enabled = not enabled
        console_out("My Feature " .. (enabled and "ON" or "OFF"))
        return false -- prevents Halo error message
    end
    return true -- allow other commands
end

function OnTick()
    if not enabled then return end
    -- ... do something ...
end
```

## Ping Smoothing

An exponential moving average smooths jittery ping values and makes sudden latency spikes easy to
spot:

```lua
local ema_ping = nil

---@param raw_ping number Latest ping sample in milliseconds.
---@return number avg Smoothed ping in milliseconds.
---@return number delta Difference between the latest sample and the average.
local function updatePing(raw_ping)
    ema_ping = ema_ping and (ema_ping * 0.85 + raw_ping * 0.15) or raw_ping
    local avg = math.floor(ema_ping + 0.5)
    local delta = math.floor(raw_ping - ema_ping + 0.5)
    return avg, delta
end
```