---
title: "Scripting with Chimera - Client-Side Lua"
date: 2026-05-17
categories: [ education, halo, modding ]
tags: [ chimera, lua, scripting, client ]
---

Chimera is a **client-side** mod for Halo PC/Custom Edition. It provides event hooks, commands, built-in map downloads,
and dozens of quality-of-life fixes. **This guide focuses on its Lua API**, walks through the core scripting model
and practical examples so you can build your own HUDs, gameplay tweaks, and quality-of-life mods using Chimera's
event-driven Lua environment.

**Important:** Chimera's Lua API is based on Lua 5.5.

This guide assumes you have read:

- [Common Lua References](2026-05-17-halo-lua-common-references.md)
- [Memory Offsets Deep Dive](2025-09-07-halo-understanding-memory-offsets.md).

---

### Where to Put Your Scripts

Chimera looks for Lua scripts in two specific places, and treats them differently depending on where they live:

* **Global Scripts**: Drop your `.lua` files in the main `chimera\lua\scripts\global` folder. These load when Chimera
  starts up and stay active until you manually reload them. Great for tools or HUD mods you use all the time. Global
  scripts are **not sandboxed**.

* **Map Scripts**: Put scripts into `chimera\lua\scripts\maps`. These only load when their associated map is active and
  unload automatically when you leave. Perfect for map-specific features. Map scripts are **sandboxed** by default,
  unless loaded from the **scripts** folder.

By default, the chimera data folder will be located in `C:\Users\<user>\Documents\My Games\Halo CE\chimera`.

To reload all scripts without restarting the game, type `chimera_lua_scripts_reload` in console (press `~`).

---

## Script Skeleton & Version Check

Every Chimera script starts with a version check and a few callbacks. Here's a skeleton script:

```lua
clua_version = 2.056   -- * required: tells Chimera which API version you expect

set_callback("command","OnCommand")
set_callback("frame","OnFrame")
set_callback("preframe","OnPreFrame")
set_callback("map load","OnMapLoad")
set_callback("map_preload","OnMapPreload")
set_callback("precamera","OnPreCamera")
set_callback("rcon_message","OnRconMessage")
set_callback("spawn","OnSpawn")
set_callback("prespawn","OnPreSpawn")
set_callback("tick","OnTick")
set_callback("pretick","OnPreTick")
set_callback("unload","OnScriptUnload")

function OnPreTick()
    -- called just before the main tick update
end

function OnTick()
    -- called ~30 times per second (main gameplay update loop)
end

function OnPreFrame()
    -- called before rendering each frame
end

function OnFrame()
    -- called after preframe, once per rendered frame
end

function OnPreCamera()
    -- called right before camera calculations are applied
end

function OnCommand(cmd)
    -- called when you type a command in the console (press ~ key)
end

function OnRconMessage(msg)
    -- called when an incoming RCON message is received; return false to block it
end

function OnPreSpawn(player)
    -- called before a player spawns
end

function OnSpawn(player)
    -- called when a player finishes spawning
end

function OnMapPreload(map_name)
    -- called before a map fully loads (early initialization point)
end

function OnMapLoad()
    -- called after the map has fully loaded (reset or init gameplay state here)
end

function OnScriptUnload()
    -- called when the script is unloaded
end
```

---

## Version Compatibility and History

Chimera checks the `clua_version` variable against its own API version. The table below shows when a script is
considered compatible.

| clua_version on the script (compared to chimera) | Example        | Script supported? |
|--------------------------------------------------|----------------|-------------------|
| the same version                                 | 2.056 vs 2.056 | Yes               |
| a lower version; same major version              | 2.04  vs 2.056 | Yes               |
| a higher version                                 | 2.06  vs 2.056 | No                |
| a lower version; different major version         | 1.5  vs 2.056  | No                |

---

## Event Priorities

When setting a callback with `set_callback`, you can specify a priority as the third argument. Priorities determine the
order in which multiple scripts' callbacks run. If multiple scripts use the same priority, they run in script load
order.

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

---

## Advanced Event Details

**`rcon_message`**  
Called when an RCON message is received. Return `false` to block the message.

**`command`**  
Called for any console command except Chimera internal commands and `rcon`. Return `false` to prevent the command from
executing (and suppress error messages). **Note:** The `command` callback cannot intercept Chimera's own commands or the
`rcon` command.

**`unload`**  
Called when the script is unloaded (e.g., map change or manual reload). Note that the map may have already changed by
this point.

### Embedded Scripts (Advanced)

Mapmakers can actually bake Lua scripts directly into their `.map` files using tools like Harbinger. Chimera can load
these embedded scripts if you enable `load_embedded_lua = 1` in your `chimera.ini`. The script then runs automatically
when players load that map - no separate file needed. This is great for distributing map-specific mods without extra
install steps.

### Hotkeys: Running Scripts with Keystrokes

Chimera lets you bind any command - including your custom script commands - to keyboard keys through the `chimera.ini`
file. The hotkeys section lets you execute:

* Chimera's native commands
* Halo's built-in console commands
* Your custom script commands (like `/wpninfo` or `/compass`)

For example, you could bind `F5` to `/compass` so players can toggle the compass without typing. Set this up in
`chimera.ini` and your scripts can respond to single key presses instead of forcing players to type chat commands.

---

## Displaying Information on Screen

The simplest way to talk to the player is `hud_message("your text")`, `console_out(...)` or `draw_text(...)`.

Example using `hud_message()`:

```lua
function OnTick()
    hud_message(string.format("Pos: %.1f, %.1f, %.1f", x, y, z))
end
```

Example using `console_out()`:

```lua
function OnTick()
	console_out("Chimera Rocks!")                       -- standard console output
    console_out("Chimera Rocks!", 1.0, 0.35, 0.35)      -- w/RGB colors (red, green, blue)
    console_out("Chimera Rocks!", 1, 1.0, 0.35, 0.35)   -- w/ARGB colors (alpha, red, green, blue)
end
```

Example using `draw_text()` (with RGBA values and screen bounds):

```lua
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

`draw_text()` draws text inside a rectangular screen region:

```lua
draw_text(text, left, top, right, bottom, font, align, a, r, g, b)
```

Supported fonts: `"small"`, `"large"`, `"ticker"`

Supported alignment values: `"left"`, `"center"`, `"right"`

---

## Global Variables

Chimera exposes several read-only global variables that provide useful information about the current game state, your
script's environment, and the Chimera version.

| Variable             | Description                                                                                          |
|----------------------|------------------------------------------------------------------------------------------------------|
| `build`              | Chimera build number. **Negative** = alpha/pre-release; **positive** = public release.               |
| `full_build`         | If `build` is negative, contains the **next public release build number**; otherwise equals `build`. |
| `gametype`           | Current gametype: `"ctf"`, `"slayer"`, `"oddball"`, `"king"`, or `"race"`.                           |
| `local_player_index` | Local player index (0-15). May be `nil` until assigned after joining a server.                       |
| `map`                | Currently loaded map name.                                                                           |
| `map_is_protected`   | `true` if the map uses protected tag data (e.g., `"h3mt-foundry"`).                                  |
| `sandboxed`          | `true` if the script is running in a sandboxed environment (see “Sandboxed Scripts”).                |
| `script_name`        | Filename for global scripts, or map name for map scripts.                                            |
| `script_type`        | `"global"` or `"map"`.                                                                               |
| `server_type`        | `"none"` (single player), `"local"` (hosting), or `"dedicated"` (joined a server).                   |

Example - only run on dedicated server:

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
    
        --
        -- Using local_player_index to iterate over other players:
        --
        local local_idx = local_player_index
        if not local_idx then return end  -- not ready yet
        
		for i = 0, 15 do
			if i ~= local_idx and get_player(i) then
			-- This player is not the local player and is connected
			-- You could read their kills, deaths, team, etc.
			end
		end
    end
end
```

---

## Persistent Data Storage

```lua
local SAVE_FILE = "my_data.txt" -- file will appear in Halo's root installation folder

local function save_stats(stats)
    local f = io.open(SAVE_FILE, "w")
    if f then
        f:write(string.format("%d;%d;%d", stats.kills, stats.deaths))
        f:close()
    end
end

local function load_stats()
    local f = io.open(SAVE_FILE, "r")
    if not f then return {kills=0, deaths=0, credits=0} end
    local content = f:read("*l")
    f:close()
    local kills, deaths = content:match("(%d+);(%d+)")
    return {kills=tonumber(kills), deaths=tonumber(deaths)}
end
```

**Note:** Sandboxed scripts (map scripts) cannot use `io.*` functions. If you need file access in a map script, you must
place the script in the global folder instead.

---

## Tick Rate and Tick Counter

You can get or set the game's tick rate (the number of simulation updates per second). The default is 30. Setting it
lower than 0.01 will clamp.

```lua
local current_rate = tick_rate()  -- get current tick rate
tick_rate(60)                     -- set to 60 ticks per second
```

`ticks()` returns the number of ticks that have passed since the game started, as a decimal value (fractional ticks
represent time between updates).

```lua
local elapsed = ticks()
console_out("Ticks elapsed: " .. elapsed)
```

---

## Using Timers: `set_timer` and `stop_timer`

Sometimes you need to run code after a delay, or repeat an action at a fixed interval without relying on `OnTick` and
manual counters. Chimera provides two functions for this: `set_timer` and `stop_timer`.

### `set_timer`

Registers a repeating timer and returns a timer ID that you can later cancel with `stop_timer`.  
The specified function will execute repeatedly at the given interval (in milliseconds) until either:

- it returns `false`, or
- you manually remove it with `stop_timer`.

You can pass additional arguments to the callback (strings, numbers, booleans, or nil).

**Syntax:**  
`set_timer(interval_ms, "function_name", [arg1, arg2, ...])`

**Returns:** a numeric timer ID.

**Example:**

```lua
function show_message(text)
    console_out(text)
end

-- Run every 2 seconds, passing a string argument
local timer_id = set_timer(2000, "show_message", "Hello from the timer!")
```

### `stop_timer`

Stops a running timer using its ID. If the timer no longer exists, an error will occur.

**Syntax:**  
`stop_timer(timer_id)`

**Example:**

```lua
stop_timer(timer_id) -- Stop the timer created above
```

---

## Deleting Objects

Use this function to delete objects from the game.

```lua
delete_object(object_id)
```

Example:

```lua
-- Spawn a ghost:
local ghost = spawn_object("vehi", "vehicles\\ghost\\ghost_mp", x, y, z)

-- Delete it:
delete_object(ghost)
```

---

## Executing Console Commands and Scripts: `execute_script()`

Chimera's `execute_script()` function lets you run any Halo console command or a full Lisp-formatted Halo script block
directly from Lua. This is useful for changing settings, displaying information, triggering built-in game functionality,
or executing custom Halo script logic at runtime.

**Syntax:**  
`execute_script("command or script")`

**Examples:**

```lua
-- Show the current player list in the console
execute_script("sv_players")

-- Clear the console
execute_script("cls")

-- Change the map after 5 seconds
function change_map()
    execute_script("map bloodgulch ctf")
    return false
end
set_timer(5000, "change_map")

-- Display a message using Halo script syntax
execute_script('(print "Welcome to the server!")')

-- Execute a Halo script command directly
execute_script("(object_teleport (player0) teleport_flag)")
```

---

## Reading Player Data

Because Chimera is client-side, you can read **any** player's data (the server sends it to you),
but you can only **write** to memory for your own local player (writing to others will desync or crash).

### Get the player object

```lua
-- Optionally pass a player ID (0-15) to either function. If no ID is passed, the local player is used.

local dynamic_player = get_dynamic_player(id)
local static_player = get_player(id)
```

`get_dynamic_player()` returns a pointer to the player's current object. Use this for position, velocity,
health, shields, and other object data. Returns `nil` if the player is dead.

`get_player()` returns a pointer to the player's persistent player data structure. Use this for player-related data
that exists independently of the live object (team, kills, deaths, ping, name).

### Example - Position HUD

```lua
function OnTick()
    local dyn = get_dynamic_player()
    if not dyn then return end -- player is dead
    
    local x = read_float(dyn + 0x5C)
    local y = read_float(dyn + 0x60)
    local z = read_float(dyn + 0x64)
    
    execute_script("cls") -- clear old HUD lines
    
    hud_message(string.format("Pos: %s, %.1f, %.1f, %.1f", name, x, y, z))
end
```

## Camera Manipulation (OnPreCamera)

Chimera allows you to modify the camera position, orientation, and field of view before the game renders.

Example: zoom in when holding a sniper

```lua
-- x,y,z: camera position
-- fov: field of view in degrees
-- ox1,oy1,oz1: camera look-at point (forward vector)
-- ox2,oy2,oz2: up vector
function OnPreCamera(x, y, z, fov, ox1, oy1, oz1, ox2, oy2, oz2)
	local dyn = get_dynamic_player(idx)
	if dyn == 0 then return end

	local weapon_id = read_dword(dyn + 0x118)
	if weapon_id ~= 0xFFFFFFFF then
		local weapon = get_object(weapon_id)
		if weapon then
			local tag = get_tag(read_dword(weapon))
			local weapon_name = read_string(read_dword(tag + 0x10)):lower()
			if weapon_name:find("sniper") then
				fov = 20  -- zoom
			end
		end
	end
    return x, y, z, fov, ox1, oy1, oz1, ox2, oy2, oz2
end
```

> **Note:** Returning the values is mandatory; otherwise the camera will not update.

---

## Reading the tag path of an object

Chimera provides two overloads of `get_tag`:

* `get_tag(class, name)` - looks up a tag by its class and asset path, returning the **tag ID** (a number).
* `get_tag(tag_id)` - converts a tag ID into a **pointer** to the tag entry, so you can read the tag's internal data.

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

Once you have an object, you can retrieve its tag path (e.g. `"vehicles\\ghost\\ghost_mp"`) by reading the tag pointer
and then the string at offset `0x10`.

```lua
function get_tag_name(obj)
    if not obj then return nil end

    local tag_id = read_dword(obj)        -- first dword of an object is its tag ID
    local tag_ptr = get_tag(tag_id)       -- tag_id → tag pointer (2nd overload)
    if not tag_ptr then return nil end

    local name_ptr = read_dword(tag_ptr + 0x10)
    return read_string(name_ptr)
end

local ghost = spawn_object("vehi", "vehicles\\ghost\\ghost_mp", 0, 0, 0)
local object = get_object(ghost)         -- get_object returns the raw object pointer
if object then
    console_out(get_tag_name(object))
end
```

---

## Enumerating Objects

To scan for all objects in the world (projectiles, vehicles, weapons, etc.), you need to read the global object table.

```lua
local object_table = read_dword(read_dword(0x401192 + 2))
if object_table == 0 then return end

local object_count = read_word(object_table + 0x2E)
local first_object = read_dword(object_table + 0x34)

for i = 0, object_count - 1 do
    local object = read_dword(first_object + i * 0xC + 0x8)
    if object ~= 0 then
        -- Now you have a valid object pointer
    end
end
```

## Get object name (e.g. weapon name)

Gets the display name of an object (e.g. weapon, vehicle, equipment) by resolving its tag and extracting the tag path.
The function reads the object's tag ID, converts it to a tag pointer, reads the tag path string, and then strips the
directory path to return only the object name (e.g. "weapons\\assault_rifle" → "assault_rifle"). Returns "N/A" if the
object is invalid, "???" if the tag cannot be resolved, or the raw path if parsing fails.

```lua
local function get_object_name(obj)
    if not obj then return "N/A" end

    local tag = get_tag(read_dword(obj))
    if not tag then return "???" end
	
    local path = read_string(read_dword(tag + 0x10)) or "unknown"
    return path:match(".*\\([^\\]+)$") or path
end

function OnTick()
    local dynamic_player = get_dynamic_player()
    if not dynamic_player then return end -- dead
    
    local weapon_id = get_object(read_dword(dynamic_player + 0x118))
    local weapon_name = get_object_name(weapon_id) -- returns "Weapon Name" (e.g. "Assault Rifle")
    
    console_out("Weapon: " .. weapon_name)
end
```

---

## Spawning Objects (Client-Side Spawning)

Chimera's `spawn_object` takes either a tag ID or a class+name.

```lua
-- By tag ID
local ghost_tag = get_tag("vehi", "vehicles\\ghost\\ghost_mp")
if ghost_tag then
    spawn_object(ghost_tag, x, y, z)
end

-- By class and name directly
local weapon = spawn_object("weap", "weapons\\assault rifle\\assault rifle", x, y, z)
```

> **Warning:** Spawning objects client-side only affects your own game. Others in multiplayer will not see them; Useful
> in Single Player.

---

## Toggle Commands (OnCommand)

Create console toggles to enable/disable features. Type `my_command` in the console (press `~`) to toggle.

```lua
local ENABLED = true
local command_name = "my_command"

function OnCommand(cmd)
    if cmd:lower() == command_name then
        ENABLED = not ENABLED
        console_out("My Feature " .. (ENABLED and "ON" or "OFF"))
        return false  -- prevents Halo error message
    end
    return true -- allow other commands
end

function OnTick()
    if not ENABLED then return end
    -- ... do something ...
end
```

---

## Get player name

Player names are stored as a wide-character string (2 bytes per character, UTF-16). Because Halo names are limited to
ASCII characters, each character's high byte is `0x00`. So you can read every other byte (the low bytes) and stop at a
single `0x00` byte that marks the null terminator.

```lua
local function get_player_name(id)
    local obj = get_player(id)
    local addr = obj + 0x4
    local name_chars = {}
    for i = 1, 12 do
        local b = read_byte(addr + (i-1)*2)
        if b == 0 then break end
        name_chars[#name_chars+1] = string.char(b)
    end
    return table.concat(name_chars)
end
```

## Complete Examples:

See my [Chimera Script Archive](https://github.com/Chalwk/SPCLib/tree/master/chimera/global).

---
