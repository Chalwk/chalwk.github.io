---
title: "Halo: Chimera Scripting Guide"
date: 2026-05-16
categories: [ education, halo, modding ]
tags: [ chimera, lua, halo, scripting, tutorial ]
---

# Chimera Scripting: A guide to making your own client mods

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
    -- called when you type a command in the RCON console (press ~ key)
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

## Reading Player Data

Everything interesting comes from reading memory offsets.

### Get the player object

```lua
-- Optionally pass a player ID (0-15) to either function:
local dynamic_player = get_dynamic_player(id)
local player = get_player(id)
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

### Get player name

Player names are stored as a wide-character string (2 bytes per character, UTF-16-style), so you read every other byte
until the null terminator.

```lua
local function get_player_name(id)
    local obj = get_player(id)
    local addr = obj + 0x4
    local bytes = {}
    for i = 1, 12 do
        local b = read_byte(addr + (i-1)*2)
        if b == 0 then break end
        bytes[#bytes+1] = string.char(b)
    end
    return table.concat(bytes)
end
```

### Get object name (e.g. weapon name)

```lua
-- Gets the display name of an object (e.g. weapon, vehicle, equipment) by resolving its tag and extracting the tag path.
-- The function reads the object's tag ID, converts it to a tag pointer, reads the tag path string,
-- and then strips the directory path to return only the object name (e.g. "weapons\\assault_rifle" → "assault_rifle").
-- Returns "N/A" if the object is invalid, "???" if the tag cannot be resolved, or the raw path if parsing fails.

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

---

## Showing Stuff on Screen: `hud_message()`, `console_out()`

The simplest way to talk to the player is `hud_message("your text")` or `console_out("your text")`. But if you call it
every tick, you may fill the screen with garbage. Clear old messages first:

```lua
execute_script("cls")
```

Many scripts will benefit from an update interval to avoid spam. Here's a typical pattern from

```lua
local timer = 0
local interval = 15   -- ticks between updates

function OnTick()
    timer = timer + 1
    if timer < interval then return end
    timer = 0

    -- read data and update HUD
    execute_script("cls")
    hud_message("Speed: " .. kmh .. " km/h")
end
```

---

## Handling Commands: Toggle Your Feature

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

### Save persistent data example

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

---

## Script Management & Advanced Features (From the Official Chimera Readme)

Now that you know how to write scripts, here's where to put them and how to get the most out of Chimera's scripting
system.

### Where to Put Your Scripts

Chimera looks for Lua scripts in two specific places, and treats them differently depending on where they live:

* **Global Scripts**: Drop your `.lua` files in the main `chimera\lua\scripts\global` folder. These load when Chimera
  starts up and stay active until you manually reload them. Great for tools or HUD mods you use all the time.

* **Map Scripts**: Put scripts into `chimera\lua\scripts\maps`. These only load when their associated map is active and
  unload automatically when you leave. Perfect for map-specific features.

By default, the chimera data folder will be located in `C:\Users\<user>\Documents\My Games\Halo CE\chimera`.

If you want to reload all active scripts without restarting the game, type `chimera_lua_scripts_reload` in console (
press `~`).

### Version Check Requirement

We already mentioned `clua_version = 2.056` at the top of every script. This tells Chimera which version of the Lua API
your script expects. It prevents compatibility issues if the API changes in future versions. Always include it.

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