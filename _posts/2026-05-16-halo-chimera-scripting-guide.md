---
title: "Halo: Chimera Scripting Guide"
date: 2026-05-16
categories: [ education, halo, modding ]
tags: [ chimera, lua, halo, scripting, tutorial ]
---

# Chimera Scripting: A guide to making your own client mods

This guide walks through the core scripting model and practical examples so you can build your own HUDs, gameplay
tweaks, and quality-of-life mods using Chimera's event-driven Lua environment.

---

## The Basics: What Every Script Needs

Every Chimera script starts with a version check and a few callbacks. Here's a skeleton script:

```lua
clua_version = 2.056 -- declare the Chimera Lua API version this script targets

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

## Version Compatibility and History

Chimera checks the `clua_version` variable against its own API version. The table below shows when a script is
considered compatible.

| clua_version on the script (compared to chimera) | Example                 | Script supported? |
|--------------------------------------------------|-------------------------|-------------------|
| the same version                                 | 2.056 (script) vs 2.056 | Yes               |
| a lower version; same major version              | 2.04 (script) vs 2.056  | Yes               |
| a higher version                                 | 2.06 (script) vs 2.056  | No                |
| a lower version; different major version         | 1.5 (script) vs 2.056   | No                |

The current API version as of this guide is **2.056**.

---

## Global Variables

Chimera exposes several read-only global variables that provide useful information about the current game state, your
script's environment, and the Chimera version.

* `build`: Chimera build number. **Negative** = alpha/pre-release; **positive** = public release.
* `full_build`: If `build` is negative, contains the **next public release build number**; otherwise equals `build`.
* `gametype`: Current gametype: `"ctf"`, `"slayer"`, `"oddball"`, `"king"`, or `"race"`.
* `local_player_index`: Local player index (0-15). May be `nil` until assigned after joining a server.
* `map`: Currently loaded map name.
* `map_is_protected`: `true` if the map uses protected tag data (e.g., `"h3mt-foundry"`).
* `sandboxed`: `true` if the script is running in a sandboxed environment (see “Sandboxed Scripts”).
* `script_name`: Filename for global scripts, or map name for map scripts.
* `script_type`: `"global"` or `"map"`.
* `server_type`: `"none"` (single player), `"local"` (hosting), or `"dedicated"` (joined a server).

### Example: Using Global Variables

Check if the script is running on a dedicated server, then output the map name:

```lua
if server_type == "dedicated" then
    console_out("Running on dedicated server")
end

console_out("Map: " .. map)
```

### Example: Gametype-Specific Logic

```lua
function OnTick()
    if gametype == "ctf" then
        -- Show flag carrier info, etc.
    elseif gametype == "slayer" then
        -- Show kill/death stats
    end
end
```

### Example: Using `local_player_index` to Iterate Over Other Players

Because `local_player_index` may be `nil` (if not yet assigned), always check it first.

```lua
function OnTick()
    local local_idx = local_player_index
    if not local_idx then return end  -- not ready yet

    for i = 0, 15 do
        if i ~= local_idx then
            -- This player is not the local player and is connected
            -- You could read their kills, deaths, team, etc.
        end
    end
end
```

---

## Reading Player Data

Everything interesting comes from reading memory offsets.

### Get the player object

```lua
-- Optionally pass a player ID (0-15) to either function:
local dynamic_player = get_dynamic_player(id)
local static_player = get_player(id)
```

`get_dynamic_player()` returns a pointer to the player's current object. Use this for position, velocity,
health, shields, and other object data. Returns `nil` if the player is dead.

`get_player()` returns a pointer to the player's persistent player data structure. Use this for player-related data
that exists independently of the live object (team, kills, deaths, ping, name).

### Read a float (position, health, shields)

```lua
local x = read_float(dynamic_player + 0x5C)
local y = read_float(dynamic_player + 0x60)
local z = read_float(dynamic_player + 0x64)
```

Health and shields are also floats (0.0 = empty, 1.0 = full). To show as a percentage:

```lua
local health_raw = read_float(dynamic_player + 0xE0)  -- 0..1
local shields_raw = read_float(dynamic_player + 0xE4) -- 0..1

local health_percent = math.floor(health_raw * 100)
local shields_percent = math.floor(shields_raw * 100)
```

### Read integers (team, ping, kills, deaths)

Use `read_byte()` for small values (0-255), `read_word()` for 16-bit, and `read_dword()` for 32-bit.

**Team** (0 = Red, 1 = Blue, from the player structure):

```lua
local team = read_byte(static_player + 0x20)
local team_name = (team == 0) and "Red" or "Blue"
```

**Ping** (milliseconds, from player structure):

```lua
local ping = read_dword(static_player + 0xDC)
```

**Kills and deaths** (from player structure):

```lua
local kills = read_word(static_player + 0x9C)
local deaths = read_word(static_player + 0xAE)
```

### Read velocity vector (dynamic player)

Velocity is stored as three floats (world units per tick). Combine with a scaling factor to get km/h or mph.

```lua
local vx = read_float(dynamic_player + 0x68)
local vy = read_float(dynamic_player + 0x6C)
local vz = read_float(dynamic_player + 0x70)
local speed = math.sqrt(vx*vx + vy*vy + vz*vz)
local kmh = speed * 30 * 3.6   -- 30 ticks/sec, convert world units to km/h
```

### Check if player is in a vehicle

Read the vehicle object ID from the dynamic player. If it's `0xFFFFFFFF`, the player is on foot.

```lua
local vehicle_id = read_dword(dynamic_player + 0x11C)
if vehicle_id ~= 0xFFFFFFFF then
    local vehicle = get_object(vehicle_id)
    -- now you can read vehicle position, health, type, etc.
end
```

### Read current weapon ammo (dynamic player weapon)

First get the weapon object pointer from the dynamic player, then read ammo offsets.

```lua
local weapon_id = read_dword(dynamic_player + 0x118)
local weapon_object = get_object(weapon_id)
if weapon_object then
    local clip = read_word(weapon + 0x2B6)      -- rounds in magazine
    local reserve = read_word(weapon + 0x2B8)   -- total reserve ammo
end
```

### Get player name

Player names are stored as a wide-character string (2 bytes per character, UTF-16). Because Halo names are limited to
ASCII characters, each character's high byte is `0x00`. So you can read every other byte (the low bytes) and stop at a
single `0x00` byte—that marks the null terminator.

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

### Reading Player's Forward Vector (for Compass / Direction Warnings)

The dynamic player structure contains a 3D forward vector (world-relative). Only X and Y are needed for yaw (horizontal
facing).

```lua
local forward_x = read_float(dynamic_player + 0x230)
local forward_y = read_float(dynamic_player + 0x234)
local forward_z = read_float(dynamic_player + 0x238)
```

**Convert to cardinal or clock-face direction:**

```lua
local function yaw_to_cardinal(fx, fy)
    local angle = (90 - math.deg(math.atan2(fy, fx))) % 360
    local dirs = {"N", "NE", "E", "SE", "S", "SW", "W", "NW"}
    local idx = math.floor((angle + 22.5) / 45) % 8 + 1
    return dirs[idx]
end

local facing = yaw_to_cardinal(forward_x, forward_y)  -- "N", "NE", etc.
```

---

## Working with Game Objects

### Get object name (e.g. weapon name)

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

local weapon_id = get_object(read_dword(dynamic_player + 0x118))
local weapon_name = get_object_name(weapon_id) -- returns "Weapon Name" (e.g. "Assault Rifle")
```

### Enumerating and Working with Game Objects

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

### Deleting Objects

Use this function to delete objects from the game.

```lua
delete_object(object_id)
```

### Spawning an object

Spawn an object by tag class and path or ID. Pass the object's x, y, and z coordinates.

```lua
local sniper = spawn_object("weap","weapons\\sniper rifle\\sniper rifle", x, y, z)
local sniper = spawn_object(tag_id, x, y, z)
```

### Accessing game tags directly

`get_tag()` returns the address of a tag in the tag array. You can use either a numeric tag ID or a tag class and path.

```lua
local sniper_tag_id = get_tag("weap", "weapons\\sniper rifle\\sniper rifle")
if sniper_tag_id then
    -- read or write tag data
end
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

## Displaying Information on Screen: `hud_message()`, `console_out()`

The simplest way to talk to the player is `hud_message("your text")` or `console_out("your text")`. But if you call it
every tick, you may fill the screen with garbage. Clear old messages first:

```lua
execute_script("cls")
```

Many scripts will benefit from an update interval to avoid spam. Here's a typical pattern:

```lua
local timer = 0
local interval = 15 -- ticks between updates

function OnTick()
    timer = timer + 1
    if timer < interval then return end
    timer = 0

    -- read data and update HUD
    execute_script("cls")
    hud_message("Speed: " .. kmh .. " km/h")
end
```

You can also check if the console is open to avoid spamming players who are typing:

```lua
if not console_is_open() then
    console_out("This message only appears when console is closed.")
end
```

---

## Handling Commands and Toggles

Need a way to turn a feature on/off? Do something like this:

```lua
local enabled = true
local command_name = "mything"

function OnCommand(cmd)
    if cmd:lower() == command_name then
        enabled = not enabled
        console_out("My thing " .. (enabled and "enabled" or "disabled"))
        return false  -- prevents Halo error message
    end
end

function OnTick()
    if not enabled then return end
    -- do your thing
end
```

**Important:** The `command` callback cannot intercept Chimera's own commands or the `rcon` command. Also, starting with
API version 2.02, you must return `false` to deny (block) a command. Earlier scripts returned `true` to deny.

Want arguments? Parse them:

```lua
local args = {}
for word in cmd:gmatch("%S+") do
    table.insert(args, word)
end

if args[1] == "mything" and args[2] then
    local value = tonumber(args[2])
    -- do something with value
end

-- Example: mything 100
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

## Script Management & Advanced Features

Now that you know how to write scripts, here's where to put them and how to get the most out of Chimera's scripting
system.

### Where to Put Your Scripts

Chimera looks for Lua scripts in two specific places, and treats them differently depending on where they live:

* **Global Scripts**: Drop your `.lua` files in the main `chimera\lua\scripts\global` folder. These load when Chimera
  starts up and stay active until you manually reload them. Great for tools or HUD mods you use all the time. Global
  scripts are **not sandboxed**.

* **Map Scripts**: Put scripts into `chimera\lua\scripts\maps`. These only load when their associated map is active and
  unload automatically when you leave. Perfect for map-specific features. Map scripts are **sandboxed** by default,
  unless loaded from the scripts folder.

By default, the chimera data folder will be located in `C:\Users\<user>\Documents\My Games\Halo CE\chimera`.

To reload all scripts without restarting the game, type `chimera_lua_scripts_reload` in console (press `~`).

### Reading and Writing Memory (I/O Functions)

Chimera provides a full set of memory read/write functions. Use these to inspect or modify game state. Writing to
read-only memory or invalid addresses may cause a segmentation fault (crash).

| Read function                         | Write function                           | Description                                          |
|---------------------------------------|------------------------------------------|------------------------------------------------------|
| `read_i8` / `read_char`               | `write_i8` / `write_char`                | signed 8-bit integer                                 |
| `read_u8` / `read_byte`               | `write_u8` / `write_byte`                | unsigned 8-bit integer                               |
| `read_i16` / `read_short`             | `write_i16` / `write_short`              | signed 16-bit integer                                |
| `read_u16` / `read_word`              | `write_u16` / `write_word`               | unsigned 16-bit integer                              |
| `read_i32` / `read_int` / `read_long` | `write_i32` / `write_int` / `write_long` | signed 32-bit integer                                |
| `read_u32` / `read_dword`             | `write_u32` / `write_dword`              | unsigned 32-bit integer                              |
| `read_f32` / `read_float`             | `write_f32` / `write_float`              | single-precision float                               |
| `read_f64` / `read_double`            | `write_f64` / `write_double`             | double-precision float                               |
| `read_string8` / `read_string`        | `write_string8` / `write_string`         | null-terminated string (8-bit)                       |
| `read_bit(address, bit)`              | `write_bit(address, bit, value)`         | read/write a single bit (value as number or boolean) |

### Tick Rate and Tick Counter

You can get or set the game's tick rate (the number of simulation updates per second). The default is 30. Setting it
lower than 0.01 will clamp.

```lua
local current_rate = tick_rate()        -- get current tick rate
tick_rate(60)                           -- set to 60 ticks per second
```

`ticks()` returns the number of ticks that have passed since the game started, as a decimal value (fractional ticks
represent time between updates).

```lua
local elapsed = ticks()
console_out("Ticks elapsed: " .. elapsed)
```

### Event Priorities

When setting a callback with `set_callback`, you can specify a priority as the third argument. Priorities determine the
order in which multiple scripts' callbacks run.

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

If multiple scripts use the same priority, they run in script load order.

### Advanced Event Details

**`precamera`**  
Called just before Halo reads camera data. You can modify camera position, orientation, and FOV by returning new values.

```lua
function OnPreCamera(x, y, z, fov, ox1, oy1, oz1, ox2, oy2, oz2)
    -- modify values and return them
    return x, y, z, fov, ox1, oy1, oz1, ox2, oy2, oz2
end
```

**`rcon_message`**  
Called when an RCON message is received. Return `false` to block the message.

**`command`**  
Called for any console command except Chimera internal commands and `rcon`. Return `false` to prevent the command from
executing (and suppress error messages).

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