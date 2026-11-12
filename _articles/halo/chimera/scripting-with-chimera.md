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
| Lua runtime        | Lua 5.5.1                                                                                 |
| Lua 5.2+ syntax    | Available: `goto`, `_ENV`, integer division `//`, native bitwise operators `& \| ~ << >>` |
| Sandboxing         | Global scripts: not sandboxed. Map scripts: sandboxed by default.                         |
| Reload all scripts | Console command `chimera_lua_scripts_reload` (`~` opens the console)                      |
| Player index       | 0-15 everywhere                                                                           |

---

## Script locations

Chimera looks for Lua scripts in two folders and treats them differently:

- **Global scripts:** Put `.lua` files in `chimera\lua\scripts\global`. They load when Chimera
  starts
  and stay active until you reload them. Use this for tools and HUD mods you want all the time.
  Global scripts are not sandboxed.

- **Map scripts:** Put scripts in `chimera\lua\scripts\map`. They load when their map is active and
  unload when you leave it. Map scripts are sandboxed by default (see
  [Sandbox restrictions](#sandbox-restrictions)).

By default, the Chimera folder is located inside your Halo data folder:

- **Halo Custom Edition (CE):** `%USERPROFILE%\Documents\My Games\Halo CE\chimera`
- **Halo PC:** `%USERPROFILE%\Documents\My Games\Halo\chimera`

Linux: `~/Documents/My Games/Halo CE/chimera` or `~/Documents/My Games/Halo/chimera`, depending
on your setup.

## Script skeleton

See [Chimera Lua Template](template.md) for every callback. Register only the ones the script uses.

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

## Callbacks and priorities

`set_callback("event", "GlobalFnName" [, priority])`. The callback function must be global (not
local or anonymous).

Chimera loads a script only when the declared `clua_version` is compatible:

| Script version                 | Example (vs 2.056) | Loads? |
|--------------------------------|--------------------|--------|
| Same                           | 2.056              | Yes    |
| Lower, same major version      | 2.04               | Yes    |
| Higher                         | 2.06               | No     |
| Lower, different major version | 1.5                | No     |

### Event priorities

When setting a callback with `set_callback`, you can specify a priority as the third argument.
Priorities determine the order in which multiple scripts' callbacks run. If multiple scripts use the
same priority, they run in script load order.

- `"before"`: runs before default callbacks
- `"default"`: normal priority (used if omitted)
- `"after"`: runs after default callbacks
- `"final"`: runs last; any return values are ignored (useful for monitoring)

**Example:**

```lua
set_callback("tick", "OnTickEarly", "before")
set_callback("tick", "OnTickMain", "default")
set_callback("tick", "OnTickLate", "after")
```

### Events

The callback names are matched after converting underscores to spaces, so `"map_load"` and
`"map load"` are equivalent.

| Callback name  | When it runs                          | Arguments                                                                     | Return value                                                          |
|----------------|---------------------------------------|-------------------------------------------------------------------------------|-----------------------------------------------------------------------|
| `command`      | A console command is about to execute | `command` string                                                              | `false` to block; `true` or nothing to allow                          |
| `frame`        | Each rendered frame                   | none                                                                          | -                                                                     |
| `preframe`     | Before frame processing               | none                                                                          | -                                                                     |
| `map_load`     | A map is being loaded                 | none                                                                          | -                                                                     |
| `map_preload`  | Before map loading                    | none                                                                          | -                                                                     |
| `precamera`    | Before the camera is applied          | 10 numbers: `x, y, z, fov, forward.x, forward.y, forward.z, up.x, up.y, up.z` | Up to 10 numbers to override the camera (ignored at `final` priority) |
| `rcon_message` | An RCON message is received           | `message` string                                                              | `false` to block; `true` or nothing to allow                          |
| `tick`         | Each game tick                        | none                                                                          | -                                                                     |
| `pretick`      | Before each game tick                 | none                                                                          | -                                                                     |
| `unload`       | Script is being unloaded              | none                                                                          | -                                                                     |

**Return values and notes:**

- `command`: return `false` to block the command and suppress the "unknown command" error; return
  `true` or nothing to allow it.
- `rcon_message`: return `false` to block the message.
- `precamera`: must return all ten camera values (see [Camera manipulation](#camera-manipulation)).
- `unload`: fired when the script unloads (map change or manual reload). The map may already have
  changed by then.

Draw calls such as `draw_text` belong in the per-frame callbacks (`preframe` or `frame`), not
`tick`.

### Sandbox restrictions

Sandboxed scripts (map scripts by default) run with a stripped environment. Chimera disables
`io`, `dofile`, `getfenv`, `load`, `loadfile`, `loadstring`, `require`, `os.execute`, `os.exit`,
`os.remove`, `os.rename`, and `os.tmpname` before your code runs.

Memory read/write functions (`read_int`, `write_float`, `read_string8`, etc.) are also restricted to
the address range `0x40000000` to `0x41B00000`. Outside that range, a sandboxed script will raise an
error. If you need file access or unrestricted memory access, place the script in the `global`
folder instead.

The built-in filesystem functions (`write_file`, `read_file`, etc.) are still available in sandbox
mode, but they are confined to the script's private data directory.

### Embedded scripts

Mapmakers can bake Lua scripts into their `.map` files with tools like Harbinger. Chimera loads
these embedded scripts when `load_embedded_lua = 1` is set in `chimera.ini`. The script runs when
players load that map, so there is no separate file to install.

### Hotkeys

Chimera can bind commands to keyboard keys in `chimera.ini`. You can bind:

- Chimera's native commands
- Halo's built-in console commands
- Your own script commands (like `wpninfo` or `compass`)

For example, bind `F5` to `compass` to toggle a compass HUD without typing in the console.

## Global variables

Chimera exposes several read-only global variables that provide useful information about the current
game state, your script's environment, and the Chimera version.

| Variable             | Description                                                                                                     |
|----------------------|-----------------------------------------------------------------------------------------------------------------|
| `build`              | Chimera build number (Git commit count).                                                                        |
| `full_build`         | Chimera version string.                                                                                         |
| `gametype`           | Current gametype: `"ctf"`, `"slayer"`, `"oddball"`, `"king"`, or `"race"`.                                      |
| `local_player_index` | Local player index (0-15). May be `nil` until assigned after joining a server.                                  |
| `map`                | Currently loaded map name.                                                                                      |
| `map_is_protected`   | `true` if the map uses protected tag data (e.g., `"h3mt-foundry"`).                                             |
| `sandboxed`          | `true` if the script is running in a sandboxed environment (see [Sandbox restrictions](#sandbox-restrictions)). |
| `script_name`        | Filename for global scripts, or map name for map scripts.                                                       |
| `script_type`        | `"global"` or `"map"`.                                                                                          |
| `server_type`        | `"none"` (single player), `"local"` (hosting), or `"dedicated"` (joined a server).                              |

> [!NOTE] Chimera has no equivalent to SAPP’s `halo_type` global and no function that reports which
> client you are on. See [Probing the Platform](../common-reference.md#probing-the-platform) for
> details on how to do this.

### Server type check

```lua
function OnTick()
    if server_type == "dedicated" then
        console_out("Running on dedicated server. Map: (" .. map .. ")")

        if gametype == "ctf" then
            -- Show flag carrier info, etc.
        elseif gametype == "slayer" then
            -- Show kill/death stats
        end

        local player_index = local_player_index
        if not player_index then return end -- not ready yet

        for i = 0, 15 do
            if i ~= player_index and get_player(i) then
                -- This player is not the local player and is connected
            end
        end
    end
end
```

## Output and HUD

The simplest way to talk to the player is `hud_message`, `console_out`, or `draw_text`:

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
        0, 460, 640, 480, -- left, top, right, bottom
        "small",          -- font: small, large, ticker
        "right",          -- alignment: left, center, right
        1.0,              -- alpha
        0.45,             -- red
        0.72,             -- green
        1.0               -- blue
    )
end
```

`draw_text` draws text inside a rectangular screen region. Supported fonts: `"small"`, `"large"`,
`"ticker"`. Supported alignments: `"left"`, `"center"`, `"right"`.

```lua
draw_text(text, left, top, right, bottom, font, align, a, r, g, b)
```

`console_out` accepts one argument (message only), four arguments (message, red, green, blue), or
five arguments (message, alpha, red, green, blue).

## Timers

Use `set_timer` and `stop_timer` to run code after a delay or at a fixed interval instead of
counting ticks.

### set_timer

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

### stop_timer

Stops a running timer by ID. Stopping a timer that no longer exists raises an error.

Syntax: `stop_timer(timer_id)`

## Console and scripting functions

| Function                  | Signature                                | Notes                                                                |
|---------------------------|------------------------------------------|----------------------------------------------------------------------|
| `execute_script`          | `execute_script(script)`                 | Runs a Halo console command or Halo script expression (Lisp syntax). |
| `get_global`              | `get_global(name)`                       | Reads a Halo scripting global. Returns boolean, number, or integer.  |
| `set_global`              | `set_global(name, value)`                | Writes a Halo scripting global. The value type is validated.         |
| `execute_chimera_command` | `execute_chimera_command(command, save)` | Executes an allow-listed Chimera command. `save` is a boolean.       |

Allow-listed Chimera commands include `chimera_show_fps`, `chimera_block_zoom_blur`,
`chimera_devmode`, `chimera_budget`, `chimera_af`, `chimera_block_hold_f1`, `chimera_fov`, and
`chimera_mouse_sensitivity`.

**Examples:**

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

## Player and object functions

| Function             | Signature                                                                          | Notes                                                                                                                               |
|----------------------|------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| `get_player`         | `get_player([index])`                                                              | Returns a player pointer (integer) or `nil`. With no argument, returns the local client player. With an index, looks up by RCON ID. |
| `get_dynamic_player` | `get_dynamic_player([index])`                                                      | Returns the dynamic object pointer for the local player or the player at the given RCON index, or `nil`.                            |
| `get_object`         | `get_object(id)`                                                                   | Returns a dynamic object pointer for an object ID, or `nil`.                                                                        |
| `delete_object`      | `delete_object(object_id)`                                                         | Deletes the object. Raises an error if the ID is invalid.                                                                           |
| `spawn_object`       | `spawn_object(tag_id, x, y, z [, parent])` or `spawn_object(class, path, x, y, z)` | Spawns an object. Returns the new object ID.                                                                                        |
| `get_tag`            | `get_tag(id)` or `get_tag(class, path)`                                            | Returns a tag pointer (integer) or `nil`.                                                                                           |

### Player pointers

Both functions use the local player when you pass no index.

```lua
local dyn_player = get_dynamic_player(player_index)
local static_player = get_player(player_index)
```

`get_dynamic_player` returns a pointer to the player's current object. Use this for position,
velocity, health, shields, and other object data. Returns `nil` if the player is dead.

`get_player` returns a pointer to the player's persistent player data structure. Use this for
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
    local name = static_player and readPlayerName(static_player) -- see Player name
    execute_script("cls")

    hud_message(string.format("Pos: %s, %.1f, %.1f, %.1f", name or "?", x, y, z))
end
```

### Player name

Player names are stored as a wide-character string (2 bytes per character, UTF-16). Use
`readWideString` and `readPlayerName` from [Wide Strings](../common-reference.md#wide-strings). The
name sits at static player offset `0x4` and is at most 12 characters.

```lua
local static_player = get_player(player_index)
local name = static_player and readPlayerName(static_player)
```

## Memory access

Chimera exposes raw memory reads and writes. These are useful for working with Halo's structures
when no higher-level API exists.

### Integer reads and writes

Registered names include sized aliases:

```text
read_i8 / write_i8      read_u8  / write_u8
read_i16 / write_i16    read_u16 / write_u16
read_i32 / write_i32    read_u32 / write_u32
read_byte / write_byte
read_word / write_word
read_dword / write_dword
read_char / write_char
read_short / write_short
read_int / write_int
read_long / write_long
```

Signature: `read_*(address)` returns an integer; `write_*(address, value)` writes an integer.

### Float reads and writes

```text
read_f32 / write_f32    read_f64 / write_f64
read_float / write_float
read_double / write_double
```

Signature: `read_*(address)` returns a number; `write_*(address, value)` writes a number.

### Bits and strings

| Function        | Signature                              | Notes                                                 |
|-----------------|----------------------------------------|-------------------------------------------------------|
| `read_bit`      | `read_bit(address, bit_index)`         | Returns `0` or `1`. `bit_index` must be less than 32. |
| `write_bit`     | `write_bit(address, bit_index, value)` | `value` may be a boolean or `0`/`1`.                  |
| `read_string8`  | `read_string8(address)`                | Reads a null-terminated string.                       |
| `write_string8` | `write_string8(address, string)`       | Writes a null-terminated string.                      |

`read_string` and `write_string` are registered as aliases for `read_string8` and `write_string8`
respectively. They call the same underlying implementation and behave identically.

In sandbox mode, addresses outside `0x40000000`-`0x41B00000` are rejected.

## Filesystem access

Chimera registers a set of filesystem functions that are always confined to the script's private
data directory: `chimera/lua/data/<script_type>/<script_name>/`

`script_type` is `"global"` or `"map"`, and `script_name` is the filename without `.lua`. Any path
that resolves outside this directory raises a scope error.

| Function           | Signature                              | Returns                                                          |
|--------------------|----------------------------------------|------------------------------------------------------------------|
| `create_directory` | `create_directory(path)`               | `true` if created (or already exists), `false` otherwise         |
| `remove_directory` | `remove_directory(path)`               | `true` if removed, `false` otherwise                             |
| `list_directory`   | `list_directory(path)`                 | Table of filenames (directories have a trailing `\`), or `false` |
| `directory_exists` | `directory_exists(path)`               | `true` if the path exists and is a directory                     |
| `write_file`       | `write_file(path, content [, append])` | `true` on success                                                |
| `read_file`        | `read_file(path)`                      | File contents as a string, or `nil` if it cannot be opened       |
| `delete_file`      | `delete_file(path)`                    | `true` if the file was removed                                   |
| `file_exists`      | `file_exists(path)`                    | `true` if the path is a regular file                             |

Global scripts can also use the standard Lua `io` library. Sandboxed map scripts cannot use `io`,
but the functions above still work.

**Persistent data example:**

```lua
local SAVE_FILE = "my_data.txt" -- file will appear in the script's data directory

---@param stats table Table with kills, deaths, and credits.
local function saveStats(stats)
    write_file(SAVE_FILE, string.format("%d;%d;%d", stats.kills, stats.deaths, stats.credits))
end

---@return table stats Table with kills, deaths, and credits.
local function loadStats()
    local content = read_file(SAVE_FILE)
    if not content then return { kills = 0, deaths = 0, credits = 0 } end

    local kills, deaths, credits = content:match("(%d+);(%d+);(%d+)")
    return {
        kills = tonumber(kills) or 0,
        deaths = tonumber(deaths) or 0,
        credits = tonumber(credits) or 0
    }
end
```

## Tag paths

Chimera provides two overloads of `get_tag`:

- `get_tag(class, name)`: looks up a tag by its class and asset path, returning the tag ID.
- `get_tag(tag_id)`: converts a tag ID into a pointer to the tag entry, so you can read the tag's
  internal data.

### Tag ID from class and name

```lua
local ghost_tag = get_tag("vehi", "vehicles\\ghost\\ghost_mp")
if ghost_tag then
    console_out("Ghost tag ID: " .. ghost_tag)
else
    console_out("Ghost tag not found!")
end
```

### Tag path from an object

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

## Object names

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

## Enumerating objects

To scan for all objects in the world (projectiles, vehicles, weapons, etc.), you need to read the
global object table. The address and the loop are in
[Object Table](../common-reference.md#object-table).

## Spawning objects

Chimera's `spawn_object` takes either a tag ID or a class and name.

> [!NOTE] Objects spawned client-side via Chimera in multiplayer sessions are local-only and will
> not be visible to other players. They are primarily useful for single-player custom mods and
> client-side testing.

```lua
-- By tag ID
local ghost_tag = get_tag("vehi", "vehicles\\ghost\\ghost_mp")
if ghost_tag then
    spawn_object(ghost_tag, x, y, z)
end

-- By class and name directly
local weapon = spawn_object("weap", "weapons\\assault rifle\\assault rifle", x, y, z)
```

## Camera manipulation

Chimera allows you to modify the camera position, orientation, and field of view before the game
renders. The example below zooms the FOV while holding a sniper. `readTagPath` is in
[Tag Entry Helpers](../common-reference.md#tag-entry-helpers).

> [!IMPORTANT] The `precamera` callback must return all ten camera parameters. Omitting
> or returning a partial list will cause the camera to lock up or freeze.

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

## Zoom control

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

## Toggle commands

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

## Ping smoothing

An exponential moving average smooths jittery ping values and makes sudden latency spikes easy to
spot:

```lua
local ema_ping = nil

---@param raw_ping number Latest ping sample in milliseconds.
---@return number avg, number delta Smoothed ping in milliseconds and difference from the average.
local function updatePing(raw_ping)
    ema_ping = ema_ping and (ema_ping * 0.85 + raw_ping * 0.15) or raw_ping
    local avg = math.floor(ema_ping + 0.5)
    local delta = math.floor(raw_ping - ema_ping + 0.5)
    return avg, delta
end
```