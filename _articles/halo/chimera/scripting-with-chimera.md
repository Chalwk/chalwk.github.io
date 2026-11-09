---
title: "Scripting with Chimera - Client-Side Lua"
date: 2026-11-09
last-updated: 2026-11-09
categories: [ education, halo, modding ]
tags: [ chimera, lua, scripting, client, tutorial ]
---

Chimera is a client-side mod for Halo PC/CE. It provides event hooks, commands, built-in map
downloads, and dozens of quality-of-life fixes. This guide focuses on its Lua API, walks through the
core scripting model and practical examples so you can build your own HUDs, gameplay tweaks, and
quality-of-life mods using Chimera's event-driven Lua environment.

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

Chimera looks for Lua scripts in two specific places, and treats them differently depending on where
they live:

- Global Scripts: Drop your `.lua` files in the main `chimera\lua\scripts\global` folder. These load
  when Chimera starts up and stay active until you manually reload them. Great for tools or HUD mods
  you use all the time. Global scripts are not sandboxed.

- Map Scripts: Put scripts into `chimera\lua\scripts\maps`. These only load when their associated
  map is active and unload automatically when you leave. Perfect for map-specific features. Map
  scripts are sandboxed by default. Global scripts, and map scripts explicitly placed in the global
  folder, run without sandbox restrictions.

By default, the chimera data folder will be located in
`C:\Users\<user>\Documents\My Games\Halo CE\chimera`.

To reload all scripts without restarting the game, type `chimera_lua_scripts_reload` in console
(press `~`).

## Script Skeleton

See [Chimera Lua Template](template.md) for every available callbacks. Register only the ones the
script uses.

Every Chimera Lua script must define `clua_version` and set it to the appropriate Chimera API
version (for example: `2.056`). Without this definition, Chimera will not load the script.

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

See [Chimera Lua Template](template.md) for the script skeleton, event names, and callback
signatures. Register only the ones the script uses.

### Event Priorities

When setting a callback with `set_callback`, you can specify a priority as the third argument.
Priorities determine the order in which multiple scripts' callbacks run. If multiple scripts use the
same priority, they run in script load order.

- `"before"` - runs before default callbacks
- `"default"` - normal priority (used if omitted)
- `"after"` - runs after default callbacks
- `"final"` - runs last; any return values are ignored (useful for monitoring)

Example:

```lua
set_callback("tick", "OnTickEarly", "before")
set_callback("tick", "OnTickMain", "default")
set_callback("tick", "OnTickLate", "after")
```

### Events

Exact event strings accepted by `set_callback`:

- `"tick"` - called approximately 30 times per second (main gameplay loop)
- `"pretick"` - called immediately before `"tick"`
- `"frame"` - called once per rendered frame (runs after `"preframe"`)
- `"preframe"` - called before rendering each frame
- `"precamera"` - called immediately before camera calculations are applied
- `"map load"` - called after the map has fully loaded; use it to reset state
- `"map preload"` - called before the map begins loading
- `"command"` - called for any console command (see below)
- `"rcon_message"` - called when an RCON message is received
- `"prespawn"` - called before a player spawns; receives the player index
- `"spawn"` - called when a player finishes spawning; receives the player index
- `"unload"` - called when the script is unloaded (usually wired to `OnScriptUnload`)

Draw calls such as `draw_text` belong in the per-frame callbacks (`"preframe"` or `"frame"`), not
`"tick"`.

### Return Values and Event-Specific Notes

- `"command"`: called for any console command except Chimera-internal commands and `rcon`. Return
  `false` to block the command and suppress the "unknown command" error; return `true` or nothing to
  allow it. The `command` callback cannot intercept Chimera's own commands or `rcon`.
- `"rcon_message"`: return `false` to block the message.
- `"precamera"`: must return all ten camera values (see Camera Manipulation).
- `"unload"`: fired when the script unloads (map change or manual reload). The map may already have
  changed by then.

### Sandbox Restrictions (Map Scripts)

Sandboxed scripts (map scripts by default) run with a stripped environment. Chimera disables
`io`, `dofile`, `getfenv`, `load`, `loadfile`, `loadstring`, `require`, `os.execute`, `os.exit`,
`os.remove`, `os.rename`, and `os.tmpname` before your code runs.

Memory read/write functions (`read_int`, `write_float`, `read_string`, etc.) are also restricted to
the address range `0x40000000`–`0x41B00000`. Outside that range, a sandboxed script will raise an
error. If you need file access or unrestricted memory access, place the script in the `global`
folder instead.

### Embedded Scripts (Advanced)

Mapmakers can actually bake Lua scripts directly into their `.map` files using tools like Harbinger.
Chimera can load these embedded scripts if you enable `load_embedded_lua = 1` in your `chimera.ini`.
The script then runs automatically when players load that map - no separate file needed. This is
great for distributing map-specific mods without extra install steps.

### Hotkeys: Running Scripts with Keystrokes

Chimera lets you bind any command - including your custom script commands - to keyboard keys through
the `chimera.ini` file. The hotkeys section lets you execute:

- Chimera's native commands
- Halo's built-in console commands
- Your custom script commands (like `/wpninfo` or `/compass`)

For example, you could bind `F5` to `/compass` so players can toggle the compass without typing. Set
this up in `chimera.ini` and your scripts can respond to single key presses instead of forcing
players to type chat commands.

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

| Variable             | Description                                                                                      |
|----------------------|--------------------------------------------------------------------------------------------------|
| `build`              | Chimera build number. Negative = alpha/pre-release; positive = public release.                   |
| `full_build`         | If `build` is negative, contains the next public release build number; otherwise equals `build`. |
| `gametype`           | Current gametype: `"ctf"`, `"slayer"`, `"oddball"`, `"king"`, or `"race"`.                       |
| `local_player_index` | Local player index (0-15). May be `nil` until assigned after joining a server.                   |
| `map`                | Currently loaded map name.                                                                       |
| `map_is_protected`   | `true` if the map uses protected tag data (e.g., `"h3mt-foundry"`).                              |
| `sandboxed`          | `true` if the script is running in a sandboxed environment (see "Sandboxed Scripts").            |
| `script_name`        | Filename for global scripts, or map name for map scripts.                                        |
| `script_type`        | `"global"` or `"map"`.                                                                           |
| `server_type`        | `"none"` (single player), `"local"` (hosting), or `"dedicated"` (joined a server).               |

Chimera has no `halo_type` global. See [Detecting PC vs. CE](#detecting-pc-vs-ce) below.

### Example - only run on dedicated server:

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

Chimera has no equivalent to SAPP's `halo_type` global. There is no function that tells you which
client you are running on. The SAPP hardcoded pointers do not work in Chimera, and Chimera cannot
scan for signatures, so version-specific addresses are hardcoded per platform.

The candidates table, the probe code, and the other documented addresses are in
[Chimera Pointers](../common-reference.md#chimera-pointers). Relative offsets after you hold a
pointer work the same on both platforms.

## Persistent Data Storage

Note: Sandboxed scripts (map scripts) cannot use `io.*` functions. If you need file access in a map
script, you must place the script in the `global` folder instead.
See [Sandbox Restrictions](#sandbox-restrictions-map-scripts).

```lua
local SAVE_FILE = "my_data.txt" -- file will appear in Halo's root installation folder

local function saveStats(stats)
    local f = io.open(SAVE_FILE, "w")
    if f then
        f:write(string.format("%d;%d;%d", stats.kills, stats.deaths, stats.credits))
        f:close()
    end
end

local function loadStats()
    local f = io.open(SAVE_FILE, "r")
    if not f then return { kills = 0, deaths = 0, credits = 0 } end
    local content = f:read("*l")
    f:close()

    local kills, deaths, credits = (content or ""):match("(%d+);(%d+);(%d+)")
    return {
        kills = tonumber(kills) or 0,
        deaths = tonumber(deaths) or 0,
        credits = tonumber(credits) or 0
    }
end
```

## Using Timers: `set_timer` and `stop_timer`

Sometimes you need to run code after a delay, or repeat an action at a fixed interval without
relying on `tick` and manual counters. Chimera provides two functions for this: `set_timer` and
`stop_timer`.

### `set_timer`

Registers a repeating timer and returns a timer ID that you can later cancel with `stop_timer`.  
The specified function will execute repeatedly at the given interval (in milliseconds) until either:

- it returns `false`, or
- you manually remove it with `stop_timer`.

You can pass additional arguments to the callback (strings, numbers, booleans, or nil).

Syntax: `set_timer(interval_ms, "function_name", [arg1, arg2, ...])`

Returns: a numeric timer ID.

```lua
function showMessage(text)
    console_out(text)
end

local timer_id = set_timer(2000, "showMessage", "Hello from the timer!") -- runs every 2s
```

### `stop_timer`

Stops a running timer using its ID. If the timer no longer exists, an error will occur. Syntax:
`stop_timer(timer_id)`

## Deleting Objects

Use `delete_object(object_id)` to delete objects from the game.

## Executing Console Commands and Scripts: `execute_script()`

Chimera's `execute_script()` function lets you run any Halo console command or a full Lisp-formatted
Halo script block directly from Lua. This is useful for changing settings, displaying information,
triggering built-in game functionality, or executing custom Halo script logic at runtime.

Syntax: `execute_script("command or script")`

Examples:

```lua
-- Show the current player list in the console
execute_script("sv_players")

-- Clear the console
execute_script("cls")

-- Change the map after 5 seconds
function changeMap()
    execute_script("map bloodgulch ctf")
    return false
end
set_timer(5000, "changeMap")

-- Display a message using Halo script syntax
execute_script('(print "Welcome to the server!")')

-- Execute a Halo script command directly
execute_script("(object_teleport (player0) teleport_flag)")
```

## Reading Player Data

Because Chimera is client-side, you can read any player's data (the server sends it to you), but you
can only write to memory for your own local player (writing to others will desync or crash).

### Get the player object

Note: If no ID is passed, the local player is used.

```lua
local dynamic_player = get_dynamic_player(id)
local static_player = get_player(id)
```

`get_dynamic_player()` returns a pointer to the player's current object. Use this for position,
velocity, health, shields, and other object data. Returns `nil` if the player is dead.

`get_player()` returns a pointer to the player's persistent player data structure. Use this for
player-related data that exists independently of the live object (team, kills, deaths, ping, name).

Field offsets for both pointers are in [Memory Offsets](../common-reference.md#memory-offsets).

### Example - Position HUD

Chimera has no `read_vector3d` or `write_vector3d`. Read the position as three floats:

```lua
function OnTick()
    local dyn = get_dynamic_player()
    if not dyn then return end -- player is dead
    
    local x = read_float(dyn + 0x5C)
    local y = read_float(dyn + 0x60)
    local z = read_float(dyn + 0x64)
    
    local static_player = get_player(local_player_index)
    local name = static_player and readPlayerName(static_player) -- see Get player name
    execute_script("cls")
    
    hud_message(string.format("Pos: %s, %.1f, %.1f, %.1f", name or "?", x, y, z))
end
```

## Get player name

Player names are stored as a wide-character string (2 bytes per character, UTF-16). Use
`readWideString` and `readPlayerName` from [Wide Strings](../common-reference.md#wide-strings). The
name
sits at static player offset `0x4` and is at most 12 characters.

```lua
local static_player = get_player(id)
local name = static_player and readPlayerName(static_player)
```

## Camera Manipulation (OnPreCamera)

Chimera allows you to modify the camera position, orientation, and field of view before the game
renders. The below example zooms the FOV while holding a sniper.

```lua
-- x,y,z: camera position
-- fov: field of view in degrees
-- ox1,oy1,oz1: camera look-at point (forward vector)
-- ox2,oy2,oz2: up vector
function OnPreCamera(x, y, z, fov, ox1, oy1, oz1, ox2, oy2, oz2)
    local dyn = get_dynamic_player(local_player_index)
    if not dyn then return end

    local weapon_id = read_dword(dyn + 0x118)
    if weapon_id ~= 0xFFFFFFFF then
        local weapon = get_object(weapon_id)
        if weapon then
            local tag = get_tag(read_dword(weapon))
            local weapon_name = read_string(read_dword(tag + 0x10)):lower()
            if weapon_name:find("sniper") then
                fov = 20 -- zoom
            end
        end
    end

    -- Returning the values is mandatory; otherwise the camera will not update.
    return x, y, z, fov, ox1, oy1, oz1, ox2, oy2, oz2
end
```

## Reading the tag path of an object

Chimera provides two overloads of `get_tag`:

- `get_tag(class, name)` - looks up a tag by its class and asset path, returning the tag ID.
- `get_tag(tag_id)` - converts a tag ID into a pointer to the tag entry, so you can read the tag's
  internal data.

### Example 1: Getting a tag ID from class + name

```lua
local ghost_tag = get_tag("vehi", "vehicles\\ghost\\ghost_mp")
if ghost_tag then
    console_out("Ghost tag ID: " .. ghost_tag)
else
    console_out("Ghost tag not found!")
end
```

### Example 2: Reading the tag path from a spawned object

Once you have an object, you can retrieve its tag path (e.g. `"vehicles\\ghost\\ghost_mp"`) by
reading the tag pointer and then the string at offset `0x10`. `readTagPath` in
[Tag Entry Helpers](../common-reference.md#tag-entry-helpers) does the second part.

```lua
local function getTagName(obj)
    if not obj then return nil end

    local tag_id = read_dword(obj)  -- first dword of an object is its tag ID
    local tag_ptr = get_tag(tag_id) -- tag_id -> tag pointer (2nd overload)
    return tag_ptr and readTagPath(tag_ptr) -- see Tag Entry Helpers in Common Reference
end

local ghost = spawn_object("vehi", "vehicles\\ghost\\ghost_mp", 0, 0, 0)
local object = get_object(ghost) -- get_object returns the raw object pointer

if object then console_out(getTagName(object)) end
```

## Get object name (e.g. weapon name)

Gets the display name of an object (e.g. weapon, vehicle, equipment) by resolving its tag and
extracting the tag path. It uses `readTagPath` and `getShortName`
from [Tag Entry Helpers](../common-reference.md#tag-entry-helpers). The function reads the object's
tag ID, converts it to a tag pointer, reads the tag path string, and then strips the directory path
to return only the object name (e.g. `"weapons\\assault_rifle"` -> `"assault_rifle"`). Returns
`"N/A"` if the object is invalid, `"???"` if the tag cannot be resolved, or the raw path if parsing
fails.

```lua
local function getObjectName(obj)
    if not obj then return "N/A" end

    local tag = get_tag(read_dword(obj))
    if not tag then return "???" end

    return getShortName(readTagPath(tag) or "unknown")
end

function OnTick()
    local dynamic_player = get_dynamic_player()
    if not dynamic_player then return end -- dead

    local weapon_object_id = read_dword(dynamic_player + 0x118)
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

Chimera's `spawn_object` takes either a tag ID or a class+name. Note: Spawning objects client-side
only affects your own game. Others in multiplayer will not see them; Useful in Single Player.

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