---
title: "Halo: Scripting with Chimera (Client-Side Lua)"
permalink: /halo/chimera/guide/
description: "Complete Guide to client-side Lua scripting with Chimera."
date: 2026-11-12
last-updated: 2026-11-13
categories: [ education, halo, modding ]
tags: [ chimera, lua, scripting, client, tutorial ]
---

Chimera is a client-side mod for Halo PC/CE. It provides event hooks, commands, built-in map
downloads, and a lot of quality-of-life fixes. This guide covers its Lua API, with practical
examples for HUDs and gameplay tweaks.

| Property           | Value                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------- |
| Lua runtime        | Lua 5.5.1                                                                                 |
| Lua 5.2+ syntax    | Available: `goto`, `_ENV`, integer division `//`, native bitwise operators `& \| ~ << >>` |
| Sandboxing         | Global and file-based map scripts: not sandboxed. Embedded map scripts: sandboxed.        |
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
  unload when you leave it. File-based map scripts are not sandboxed; embedded map scripts are
  sandboxed (see [Sandbox restrictions](#sandbox-restrictions)).

By default, the Chimera folder is located inside your Halo data folder:

- **Halo Custom Edition (CE):** `%USERPROFILE%\Documents\My Games\Halo CE\chimera`
- **Halo PC:** `%USERPROFILE%\Documents\My Games\Halo\chimera`

Linux: `~/Documents/My Games/Halo CE/chimera` or `~/Documents/My Games/Halo/chimera`, depending
on your setup.

---

## Script skeleton

Scripts should define `clua_version` as the Chimera API version they target (for example `2.056`).
Chimera uses it to check compatibility and may warn, but a missing or mismatched version does not
prevent the script from running. See [Chimera Lua API](#chimera-lua-api) for every callback and
function.

```lua
clua_version = 2.056

set_callback("map load", "OnMapLoad")
set_callback("tick",     "OnTick")

function OnMapLoad()
    console_out("Map: (" .. map .. ")")
end

function OnTick() end -- runs every tick; keep this lean
```

---

## Chimera Lua API

This doubles as an API reference and EmmyLua / LuaLS script for Lua-aware editors (such as VS Code).

```lua
---@meta
-- Chimera Lua API for EmmyLua and lua-language-server.
-- Runtime is Lua 5.5.
--
-- Copyright (c) 2026 Jericho Crosby (Chalwk).
--

---@alias ChimeraEvent
--- | "command"      # (cmd: string): boolean|nil. Return false to block.
--- | "frame"        # Each rendered frame. Draw calls go here or in preframe.
--- | "preframe"     # Before frame processing.
--- | "map_load"     # A map is being loaded.
--- | "map_preload"  # Accepted, but not hooked in the current build.
--- | "precamera"    # Receives camera position, FOV, forward vector, and up vector.
--- | "rcon_message" # (message: string): boolean|nil. Return false to block.
--- | "tick"         # Each game tick (1/30 s).
--- | "pretick"      # Before each game tick.
--- | "unload"       # The script is unloading.

---@alias ChimeraGametype "ctf" | "slayer" | "oddball" | "king" | "race"

-- Script lifecycle -------------------------------------------------------------------------

--- Declare the API version targeted; missing, newer, or lower-major versions produce a warning.
---@type number
clua_version = nil

-- Globals ----------------------------------------------------------------------------------

--- Chimera build number (Git commit count).
---@type integer
build = 0

--- Chimera version string.
---@type string
full_build = ""

--- Current gametype, or nil when hosting locally.
---@type ChimeraGametype | nil
gametype = nil

--- Local player index (0-15). nil until assigned after joining a server.
---@type number | nil
local_player_index = nil

--- Currently loaded map name.
---@type string
map = ""

--- True if the map uses protected tag data.
---@type boolean
map_is_protected = false

--- True if the script runs sandboxed.
---@type boolean
sandboxed = false

--- Script filename including its extension (.lua or .map).
---@type string
script_name = ""

---@type "global" | "map"
script_type = "global"

--- "none" is single player, "local" is hosting, "dedicated" is joined to a server.
---@type "none" | "local" | "dedicated"
server_type = "none"

-- Callbacks and timers ---------------------------------------------------------------------
--
-- NOTE: "map_preload", "spawn", and "prespawn" are accepted by set_callback but are not hooked
-- into any engine event by the current Chimera build.

--- Callback names for set_callback. These are the global function names.
---@alias ChimeraCallbackName
--- | "OnCommand"
--- | "OnFrame"
--- | "OnMapLoad"
--- | "OnMapPreload"
--- | "OnPreCamera"
--- | "OnPreFrame"
--- | "OnPreTick"
--- | "OnRconMessage"
--- | "OnScriptUnload"
--- | "OnTick"

--- Event names for set_callback. Hover a field for the callback signature.
---@class ChimeraCallbackIds
---@field command      ChimeraEvent OnCommand(cmd: string): boolean|nil. Return false to block.
---@field frame        ChimeraEvent OnFrame(). Each rendered frame. Draw calls go here or in preframe.
---@field map_load     ChimeraEvent OnMapLoad(). A map is being loaded.
---@field map_preload  ChimeraEvent OnMapPreload(). Accepted, but not hooked in the current build.
---@field precamera    ChimeraEvent OnPreCamera(x, y, z, fov, fx, fy, fz, ux, uy, uz).
---@field preframe     ChimeraEvent OnPreFrame(). Before frame processing. Draw calls go here or in frame.
---@field pretick      ChimeraEvent OnPreTick(). Before each game tick.
---@field rcon_message ChimeraEvent OnRconMessage(message: string): boolean|nil. Return false to block.
---@field tick         ChimeraEvent OnTick(). Each game tick (1/30 s).
---@field unload       ChimeraEvent OnScriptUnload(). The script is unloading.

--- Register a global callback, or clear it by omitting callback_name.
---@param event          ChimeraEvent | string
---@param callback_name? ChimeraCallbackName | string Name of a global function
function set_callback(event, callback_name) end

--- Runs the callback every interval until it returns false or the timer is stopped.
---@param interval_ms   number                          Minimum 0.1
---@param callback_name string                          Name of a global function
---@param ...           boolean | number | string | nil Forwarded to the callback
---@return integer timer_id
function set_timer(interval_ms, callback_name, ...) end

--- Gets the game tick rate, or sets it when rate is supplied (minimum 0.01).
---@param rate? number
---@return number rate
function tick_rate(rate) end

--- Current tick count, including progress toward the next tick.
---@return number
function ticks() end

--- Stopping a timer that no longer exists raises an error.
---@param timer_id number
function stop_timer(timer_id) end

-- Output -----------------------------------------------------------------------------------

---@return boolean
function console_is_open() end

---@param message string
function hud_message(message) end

---@overload fun(message: string, red: number, green: number, blue: number)
---@overload fun(message: string, alpha: number, red: number, green: number, blue: number)
---@param message string
function console_out(message) end

--- Draws inside a screen rectangle. Call it from preframe or frame.
---@param text   string
---@param left   number
---@param top    number
---@param right  number
---@param bottom number
---@param font   "small" | "large" | "ticker" | integer font tag ID
---@param align  "left" | "center" | "right"
---@param alpha  number
---@param red    number
---@param green  number
---@param blue   number
function draw_text(text, left, top, right, bottom, font, align, alpha, red, green, blue) end

--- Loads a UI widget by tag path or tag ID.
---@param tag_path_or_id string | integer
---@return boolean loaded
function load_ui_widget(tag_path_or_id) end

--- Overrides a font tag's family, size, weight, shadow, and offset.
---@param tag_id   integer
---@param family   string
---@param size     integer
---@param weight   integer
---@param shadow_x integer
---@param shadow_y integer
---@param offset_x integer
---@param offset_y integer
function create_font_override(tag_id, family, size, weight, shadow_x, shadow_y, offset_x, offset_y) end

-- Console and scripting --------------------------------------------------------------------

--- Runs a Halo console command or a Halo script expression (Lisp syntax).
---@param script string
function execute_script(script) end

--- Reads a Halo scripting global.
---@param name string
---@return boolean | number
function get_global(name) end

--- The value type is validated.
---@param name  string
---@param value boolean | number
function set_global(name, value) end

--- Only allow-listed Chimera commands work.
---@param command string
---@param save    boolean
function execute_chimera_command(command, save) end

-- Players, objects and tags ----------------------------------------------------------------

--- Player table pointer, or nil. No index returns the local player.
---@param index? number
---@return integer | nil address
function get_player(index) end

--- Pointer to the player's current object, or nil if the player is dead. No index returns the local player.
---@param index? number
---@return integer | nil address
function get_dynamic_player(index) end

--- Dynamic object pointer for an object id, or nil.
---@param object_id number
---@return integer | nil address
function get_object(object_id) end

--- Raises an error if the ID is null.
---@param object_id number
function delete_object(object_id) end

--- Spawns an object. In multiplayer, other players do not see client-side spawned objects.
---@overload fun(tag_class: string, tag_path: string, x: number, y: number, z: number): integer
---@param tag_id number
---@param x      number
---@param y      number
---@param z      number
---@return integer object_id
function spawn_object(tag_id, x, y, z) end

--- Returns a tag entry pointer for either a tag ID or class and path.
---@overload fun(tag_id: number): integer | nil tag_entry
---@param tag_class string Four-letter class, e.g. "weap"
---@param tag_path  string
---@return integer | nil tag_entry
function get_tag(tag_class, tag_path) end

-- Memory -----------------------------------------------------------------------------------

--- Reads a signed 8-bit integer.
---@param address number
---@return integer
function read_i8(address) end

--- Reads an unsigned 8-bit integer.
---@param address number
---@return integer
function read_u8(address) end

--- Reads a signed 16-bit integer.
---@param address number
---@return integer
function read_i16(address) end

--- Reads an unsigned 16-bit integer.
---@param address number
---@return integer
function read_u16(address) end

--- Reads a signed 32-bit integer.
---@param address number
---@return integer
function read_i32(address) end

--- Reads an unsigned 32-bit integer.
---@param address number
---@return integer
function read_u32(address) end

--- Reads an unsigned 8-bit integer.
---@param address number
---@return integer
function read_byte(address) end

--- Reads an unsigned 16-bit integer.
---@param address number
---@return integer
function read_word(address) end

--- Reads an unsigned 32-bit integer.
---@param address number
---@return integer
function read_dword(address) end

--- Reads a signed 8-bit integer.
---@param address number
---@return integer
function read_char(address) end

--- Reads a signed 16-bit integer.
---@param address number
---@return integer
function read_short(address) end

--- Reads a signed 32-bit integer.
---@param address number
---@return integer
function read_int(address) end

--- Reads an integer.
---@param address number
---@return integer
function read_long(address) end

--- Reads a 32-bit float.
---@param address number
---@return number
function read_f32(address) end

--- Reads a 64-bit float.
---@param address number
---@return number
function read_f64(address) end

--- Reads a 32-bit float.
---@param address number
---@return number
function read_float(address) end

--- Reads a 64-bit float.
---@param address number
---@return number
function read_double(address) end

--- Writes a signed 8-bit integer.
---@param address number
---@param value   number
function write_i8(address, value) end

--- Writes an unsigned 8-bit integer.
---@param address number
---@param value   number
function write_u8(address, value) end

--- Writes a signed 16-bit integer.
---@param address number
---@param value   number
function write_i16(address, value) end

--- Writes an unsigned 16-bit integer.
---@param address number
---@param value   number
function write_u16(address, value) end

--- Writes a signed 32-bit integer.
---@param address number
---@param value   number
function write_i32(address, value) end

--- Writes an unsigned 32-bit integer.
---@param address number
---@param value   number
function write_u32(address, value) end

--- Writes an unsigned 8-bit integer.
---@param address number
---@param value   number
function write_byte(address, value) end

--- Writes an unsigned 16-bit integer.
---@param address number
---@param value   number
function write_word(address, value) end

--- Writes an unsigned 32-bit integer.
---@param address number
---@param value   number
function write_dword(address, value) end

--- Writes a signed 8-bit integer.
---@param address number
---@param value   number
function write_char(address, value) end

--- Writes a signed 16-bit integer.
---@param address number
---@param value   number
function write_short(address, value) end

--- Writes a signed 32-bit integer.
---@param address number
---@param value   number
function write_int(address, value) end

--- Writes an integer.
---@param address number
---@param value   number
function write_long(address, value) end

--- Writes a 32-bit float.
---@param address number
---@param value   number
function write_f32(address, value) end

--- Writes a 64-bit float.
---@param address number
---@param value   number
function write_f64(address, value) end

--- Writes a 32-bit float.
---@param address number
---@param value   number
function write_float(address, value) end

--- Writes a 64-bit float.
---@param address number
---@param value   number
function write_double(address, value) end

---@param address   number
---@param bit_index number Less than 32
---@return integer bit 0 or 1
function read_bit(address, bit_index) end

---@param address   number
---@param bit_index number           Less than 32
---@param value     boolean | number
function write_bit(address, bit_index, value) end

--- Reads a null-terminated string.
---@param address number
---@return string
function read_string8(address) end

--- Writes a null-terminated string.
---@param address number
---@param value   string
function write_string8(address, value) end

--- Alias of read_string8.
---@param address number
---@return string
function read_string(address) end

--- Alias of write_string8.
---@param address number
---@param value   string
function write_string(address, value) end

-- Filesystem -------------------------------------------------------------------------------
-- Confined to chimera/lua/data/<script_type>/<script_basename>/. Paths outside raise a scope error.

---@param path string
---@return boolean ok True if created; false if already present
function create_directory(path) end

---@param path string
---@return boolean ok
function remove_directory(path) end

--- Directory entries end in a backslash.
---@param path string
---@return string[] | false entries
function list_directory(path) end

---@param path string
---@return boolean
function directory_exists(path) end

---@param path    string
---@param content string
---@param append? boolean
---@return boolean ok
function write_file(path, content, append) end

---@param path string
---@return string | nil content nil if the file cannot be opened
function read_file(path) end

---@param path string
---@return boolean ok
function delete_file(path) end

---@param path string
---@return boolean
function file_exists(path) end
```

### Memory addresses and offsets

| Pointer                          | PC Address                   | CE Address                   | Description                                                                                          |
| -------------------------------- | ---------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| `gametype`                       | `0x6F1C88`                   | `0x68CC48`                   | Gametype struct base (see Gametype Struct)                                                           |
| `race_globals`                   | `0x87A520`                   | `0x64C1C0`                   | Race global data base (see Race Globals)                                                             |
| `camera_address`                 | `0x647498`                   | `0x647498`                   | Camera state mode (30400 = First Person, 31952 = Third Person, 30704 = Devcam)                       |
| `camera_interpolation`           | `0x647494`                   | `0x647494`                   | Camera interpolation scale when entering or leaving vehicles                                         |
| `zoom_address`                   | `read_dword(0x815918) + 204` | `read_dword(0x815918) + 204` | Local player camera zoom level pointer                                                               |
| `mouse_input_address`            | `0x64C73C`                   | `0x64C73C`                   | Mouse input state (+0x0 delta X, +0x4 delta Y, +0x8 scroll wheel, +0xC left click, +0xE right click) |
| `keyboard_input_address`         | `0x64C550`                   | `0x64C550`                   | Keyboard key state array indexed by key code                                                         |
| `chat_open_address`              | `0x64E788`                   | `0x64E788`                   | Chat input window state (1 = open, 0 = closed)                                                       |
| `announcer_address`              | `0x64C020`                   | `0x64C020`                   | Client-side multiplayer announcer sound queue (+0x8 delay, +0x14 sound tag ID)                       |
| `first_person_animation_address` | `0x40000EB8`                 | `0x40000EB8`                 | First-person animation structure (+0x1E base anim ID, +0x20 base anim frame)                         |
| `game_state_address`             | `0x400002E8`                 | `0x400002E8`                 | Screen render and pause state (+0x0 screen render, +0x1 game running, +0x2 game paused)              |
| `game_paused_address`            | `0x004ACA79`                 | `0x004ACA79`                 | Game pause byte (1 = paused, 0 = running)                                                            |
| `game_on_menus_address`          | `0x00622058`                 | `0x00622058`                 | Game menu state byte (1 = in menu/console, 0 = gameplay)                                             |
| `joystick_input_address`         | `0x0064D998`                 | `0x0064D998`                 | Controller/joystick input structure array (0xA0 bytes per controller)                                |
| `object_table_address`           | `0x400506B4`                 | `0x4005062C`                 | Pointer to the global object table header                                                            |
| `device_groups_table`            | `0x00816110`                 | `0x006E1C50`                 | Scenario device groups table                                                                         |
| `widgets_instance`               | `0x006B401C`                 | `0x006B401C`                 | UI widget instance structure                                                                         |
| `synced_network_objects`         | `0x006226F0`                 | `0x00598020`                 | Synced network objects table pointer                                                                 |
| `gravity_global`                 | `0x637BE4`                   | `0x637BE4`                   | World gravity float multiplier (default ~ 0.003656)                                                  |
| `ctf_flag_red`                   | `0x40492F1C`                 | `0x40492F1C`                 | Red flag world spawn coordinates structure                                                           |
| `ctf_flag_blue`                  | `0x40492FB0`                 | `0x40492FB0`                 | Blue flag world spawn coordinates structure                                                          |
| `koth_globals`                   | `0x64BDF0`                   | `0x64BDF0`                   | King of the Hill global data (+0x90 marker count, +0x94 marker coords, +0x184 center coords)         |
| `race_locs`                      | `0x68C848`                   | `0x68C848`                   | Race checkpoint world coordinates array (0x20 bytes per checkpoint)                                  |

### Probing the Platform

Chimera has no `halo_type` and no function that reports which client you are on. Put both variants
in a candidates table, probe each one, and check the value you read against what the field should
hold.

```lua
-- Same logical pointer, different address on each platform.
local candidates = {
    { gametype = 0x6F1C88, race_globals = 0x87A520 }, -- PC
    { gametype = 0x68CC48, race_globals = 0x64C1C0 }  -- CE
}

local gametype_base, race_globals

local function detectPlatform()
    for _, cand in ipairs(candidates) do
        -- pcall: an address valid on one platform may be unmapped on the other.
        local ok, game_type = pcall(function()
            return read_byte(cand.gametype + 0x30)
        end)

        -- 5 = Race. The value, not just a successful read, identifies the platform.
        if ok and game_type == 5 then
            gametype_base = cand.gametype
            race_globals = cand.race_globals
            return
        end
    end
end
```

The check compares against `5`, so it only resolves while a race gametype is loaded. A script for
another gametype would compare against that gametype's code instead. If both probes fail, both
pointers stay `nil`, so check before using them.

### Object Table

```lua
local function scanObjects()
    local object_table_address = read_dword(0x401192 + 2)
    local object_table = read_dword(object_table_address)
    if object_table == 0 then return end

    local object_count = read_word(object_table + 0x2E)
    local first_object = read_dword(object_table + 0x34)

    for i = 0, object_count - 1 do
        local object_entry = first_object + i * 0xC + 0x8
        local object = read_dword(object_entry)

        if object ~= 0 then
            -- Valid object pointer.
        end
    end
end
```

---

### Callbacks

`set_callback("event", "GlobalFnName")`. The callback function must be global (not local or
anonymous). Omit the callback name to clear that event's callback.

Chimera uses `clua_version` to warn about API-version mismatches; these warnings do not prevent
scripts from running:

| Declared version               | Example (current API: 2.056) | Result                         |
| ------------------------------ | ---------------------------- | ------------------------------ |
| Same                           | 2.056                        | Runs without a version warning |
| Lower, same major version      | 2.04                         | Runs without a version warning |
| Higher                         | 2.06                         | Runs with a warning            |
| Lower, different major version | 1.5                          | Runs with a warning            |
| Missing or not a number        | -                            | Runs with a warning            |

#### Callback dispatch

The current Lua binding runs script callbacks at the default priority. Although the native
dispatcher has before/default/after/final phases, `set_callback` accepts at most two arguments;
passing a third (priority) argument raises an error. When multiple scripts register the same event,
they run in script load order.

#### Events

The callback names are matched after converting underscores to spaces, so `"map_load"` and
`"map load"` are equivalent.

| Callback name  | When it runs                                                    | Arguments                                                                     | Return value                                 |
| -------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------- |
| `command`      | A console command is about to execute                           | `command` string                                                              | `false` to block; `true` or nothing to allow |
| `frame`        | Each rendered frame                                             | none                                                                          | -                                            |
| `preframe`     | Before frame processing                                         | none                                                                          | -                                            |
| `map_load`     | A map is being loaded                                           | none                                                                          | -                                            |
| `map_preload`  | Accepted by `set_callback`, but not hooked in the current build | none                                                                          | -                                            |
| `precamera`    | Before the camera is applied                                    | 10 numbers: `x, y, z, fov, forward.x, forward.y, forward.z, up.x, up.y, up.z` | Up to 10 numbers to override the camera      |
| `rcon_message` | An RCON message is received                                     | `message` string                                                              | `false` to block; `true` or nothing to allow |
| `tick`         | Each game tick                                                  | none                                                                          | -                                            |
| `pretick`      | Before each game tick                                           | none                                                                          | -                                            |
| `unload`       | Script is being unloaded                                        | none                                                                          | -                                            |

**Return values and notes:**

- `command`: return `false` to block the command and suppress the "unknown command" error; return
  `true` or nothing to allow it.
- `rcon_message`: return `false` to block the message.
- `precamera`: each numeric return value overrides the corresponding camera value; omitted or
  non-numeric values leave that value unchanged (see [Camera manipulation](#camera-manipulation)).
- `unload`: fired when the script unloads (map change or manual reload). The map may already have
  changed by then.

Draw calls such as `draw_text` belong in the per-frame callbacks (`preframe` or `frame`), not
`tick`.

### Sandbox restrictions

Only embedded map scripts are sandboxed in the current build. Sandboxed scripts run with a
stripped environment. Chimera disables
`io`, `dofile`, `getfenv`, `load`, `loadfile`, `loadstring`, `require`, `os.execute`, `os.exit`,
`os.remove`, `os.rename`, and `os.tmpname` before your code runs.

Memory write functions (`write_int`, `write_float`, `write_string8`, etc.) are also restricted to
the address range `0x40000000` to `0x41B00000`. Outside that range, a sandboxed script will raise an
error. The memory read functions are not restricted to this range. Global and file-based map scripts
are not sandboxed.

The built-in filesystem functions (`write_file`, `read_file`, etc.) are still available in sandbox
mode, but they are confined to the script's private data directory.

### Embedded scripts

Mapmakers can bake Lua scripts into their `.map` files with tools like Harbinger. Chimera loads
these embedded scripts when `load_embedded_lua = 1` is set in `chimera.ini`. The script runs when
players load that map, so there is no separate file to install. Embedded scripts are sandboxed.

### Hotkeys

Chimera can bind commands to keyboard keys in `chimera.ini`. You can bind:

- Chimera's native commands
- Halo's built-in console commands
- Your own script commands (like `wpninfo` or `compass`)

For example, bind `F5` to `compass` to toggle a compass HUD without typing in the console.

### Global variables

Chimera populates these Lua globals with information about the current game state, script
environment, and Chimera version. They are not protected from reassignment by script code.

| Variable             | Description                                                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------------------------- |
| `build`              | Chimera build number (Git commit count).                                                                        |
| `full_build`         | Chimera version string.                                                                                         |
| `gametype`           | Current gametype (`"ctf"`, `"slayer"`, `"oddball"`, `"king"`, or `"race"`); `nil` when hosting locally.         |
| `local_player_index` | Local player index (0-15). May be `nil` until assigned after joining a server.                                  |
| `map`                | Currently loaded map name.                                                                                      |
| `map_is_protected`   | `true` if the map uses protected tag data (e.g., `"h3mt-foundry"`).                                             |
| `sandboxed`          | `true` if the script is running in a sandboxed environment (see [Sandbox restrictions](#sandbox-restrictions)). |
| `script_name`        | Script filename, including its extension (`.lua` or `.map`).                                                    |
| `script_type`        | `"global"` or `"map"`.                                                                                          |
| `server_type`        | `"none"` (single player), `"local"` (hosting), or `"dedicated"` (joined a server).                              |

> [!NOTE] Chimera has no equivalent to SAPP’s `halo_type` global and no function that reports which
> client you are on. See [Probing the Platform](#probing-the-platform) for
> details on how to do this.

#### Server type check

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

### Output and HUD

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

`draw_text` draws text inside a rectangular screen region. The font may be `"small"`, `"large"`,
`"ticker"`, or a font tag ID. Supported alignments: `"left"`, `"center"`, `"right"`.

```lua
draw_text(text, left, top, right, bottom, font, align, a, r, g, b)
```

`console_out` accepts one argument (message only), four arguments (message, red, green, blue), or
five arguments (message, alpha, red, green, blue).

Use `console_is_open()` to check whether the Halo console is open. To customize a font tag, call
`create_font_override(tag_id, family, size, weight, shadow_x, shadow_y, offset_x, offset_y)`.
The function raises a Lua error if the override fails.

### Timers and tick timing

Use `set_timer` and `stop_timer` to run code after a delay or at a fixed interval instead of
counting ticks.

#### set_timer

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

#### stop_timer

Stops a running timer by ID. Stopping a timer that no longer exists raises an error.

Syntax: `stop_timer(timer_id)`

`tick_rate()` returns the configured game tick rate. Pass a number to set it; values below `0.01`
raise an error. `ticks()` returns the current tick count, including progress toward the next tick.

### Console, UI, and scripting functions

| Function                  | Signature                                | Notes                                                                |
| ------------------------- | ---------------------------------------- | -------------------------------------------------------------------- |
| `execute_script`          | `execute_script(script)`                 | Runs a Halo console command or Halo script expression (Lisp syntax). |
| `get_global`              | `get_global(name)`                       | Reads a Halo scripting global. Returns boolean, number, or integer.  |
| `set_global`              | `set_global(name, value)`                | Writes a Halo scripting global. The value type is validated.         |
| `execute_chimera_command` | `execute_chimera_command(command, save)` | Executes an allow-listed Chimera command. `save` is a boolean.       |
| `load_ui_widget`          | `load_ui_widget(tag_path_or_id)`         | Loads a UI widget by tag path or tag ID; returns whether it loaded.  |

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

### Player and object functions

| Function             | Signature                                                               | Notes                                                                                           |
| -------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `get_player`         | `get_player([index])`                                                   | Returns a player pointer (integer) or `nil`. With no argument, returns the local client player. |
| `get_dynamic_player` | `get_dynamic_player([index])`                                           | Returns the dynamic object pointer for the local player or the player at the given index.       |
| `get_object`         | `get_object(id)`                                                        | Returns a dynamic object pointer for an object ID, or `nil`.                                    |
| `delete_object`      | `delete_object(object_id)`                                              | Deletes the object. Raises an error if the ID is null.                                          |
| `spawn_object`       | `spawn_object(tag_id, x, y, z)` or `spawn_object(class, path, x, y, z)` | Spawns an object. Returns the new object ID.                                                    |
| `get_tag`            | `get_tag(id)` or `get_tag(class, path)`                                 | Returns a tag pointer (integer) or `nil`.                                                       |

#### Player pointers

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

#### Position HUD

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

#### Player name

Player names are stored as a wide-character string (2 bytes per character, UTF-16). Use
`readWideString` and `readPlayerName` from [Wide Strings](../common-reference.md#wide-strings). The
name sits at static player offset `0x4` and is at most 12 characters.

```lua
local static_player = get_player(player_index)
local name = static_player and readPlayerName(static_player)
```

### Memory access

Chimera exposes raw memory reads and writes. These are useful for working with Halo's structures
when no higher-level API exists.

#### Integer reads and writes

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

#### Float reads and writes

```text
read_f32 / write_f32    read_f64 / write_f64
read_float / write_float
read_double / write_double
```

Signature: `read_*(address)` returns a number; `write_*(address, value)` writes a number.

#### Bits and strings

| Function        | Signature                              | Notes                                                 |
| --------------- | -------------------------------------- | ----------------------------------------------------- |
| `read_bit`      | `read_bit(address, bit_index)`         | Returns `0` or `1`. `bit_index` must be less than 32. |
| `write_bit`     | `write_bit(address, bit_index, value)` | `value` may be a boolean or `0`/`1`.                  |
| `read_string8`  | `read_string8(address)`                | Reads a null-terminated string.                       |
| `write_string8` | `write_string8(address, string)`       | Writes a null-terminated string.                      |

`read_string` and `write_string` are registered as aliases for `read_string8` and `write_string8`
respectively. They call the same underlying implementation and behave identically.

In sandbox mode, memory writes to addresses outside `0x40000000`-`0x41B00000` are rejected;
memory reads are not restricted to this range.

### Filesystem access

Chimera registers filesystem functions that are always confined to the script's private data
directory: `chimera/lua/data/<script_type>/<script_basename>/`. The `script_name` global includes
the script extension; Chimera removes it when building the private data directory path.

`script_type` is `"global"` or `"map"`. Any path that resolves outside this directory raises a
scope error.

| Function           | Signature                              | Returns                                                          |
| ------------------ | -------------------------------------- | ---------------------------------------------------------------- |
| `create_directory` | `create_directory(path)`               | `true` if a directory was created; `false` if none was created   |
| `remove_directory` | `remove_directory(path)`               | `true` if removed, `false` otherwise                             |
| `list_directory`   | `list_directory(path)`                 | Table of filenames (directories have a trailing `\`), or `false` |
| `directory_exists` | `directory_exists(path)`               | `true` if the path exists and is a directory                     |
| `write_file`       | `write_file(path, content [, append])` | `true` on success                                                |
| `read_file`        | `read_file(path)`                      | File contents as a string, or `nil` if it cannot be opened       |
| `delete_file`      | `delete_file(path)`                    | `true` if the file was removed                                   |
| `file_exists`      | `file_exists(path)`                    | `true` if the path is a regular file                             |

Global and file-based map scripts can also use the standard Lua `io` library. Sandboxed embedded
map scripts cannot use `io`, but the functions above still work.

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

### Tag paths

Chimera provides two overloads of `get_tag`:

- `get_tag(class, path)`: looks up a tag by its class and asset path, returning a pointer to the tag
  entry.
- `get_tag(tag_id)`: looks up a tag by ID and returns a pointer to the tag entry.

#### Tag entry by class and name

```lua
local ghost_tag_entry = get_tag("vehi", "vehicles\\ghost\\ghost_mp")
if ghost_tag_entry then
    console_out(readTagPath(ghost_tag_entry))
else
    console_out("Ghost tag not found!")
end
```

#### Tag path from an object

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

### Object names

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

### Enumerating objects

To scan for all objects in the world (projectiles, vehicles, weapons, etc.), you need to read the
global object table. The address and the loop are in [Object Table](#object-table).

### Spawning objects

Chimera's `spawn_object` takes either a numeric tag ID or a class and path. `get_tag` returns a tag
entry pointer, not a tag ID, so use the class-and-path overload when starting from a tag path.

> [!NOTE] Objects spawned client-side via Chimera in multiplayer sessions are local-only and will
> not be visible to other players. They are primarily useful for single-player custom mods and
> client-side testing.

```lua
-- By class and path
local weapon = spawn_object("weap", "weapons\\assault rifle\\assault rifle", x, y, z)
```

### Camera manipulation

Chimera allows you to modify the camera position, orientation, and field of view before the game
renders. The example below zooms the FOV while holding a sniper. `readTagPath` is in
[Tag Entry Helpers](../common-reference.md#tag-entry-helpers).

```lua
-- x,y,z: camera position
-- fov: field of view in degrees
-- ox1,oy1,oz1: camera look-at point (forward vector)
-- ox2,oy2,oz2: up vector
function OnPreCamera(x, y, z, fov, ox1, oy1, oz1, ox2, oy2, oz2)
    local dyn_player = get_dynamic_player(local_player_index)
    if not dyn_player then return end

    local weapon_id = read_dword(dyn_player + 0x118)
    if weapon_id == 0xFFFFFFFF then return end

    local weapon = get_object(weapon_id)
    if not weapon then return end

    local tag_entry = get_tag(read_dword(weapon))
    if not tag_entry then return end

    local weapon_name = readTagPath(tag_entry)
    if weapon_name and weapon_name:lower():find("sniper", 1, true) then
        fov = 20
    end

    return x, y, z, fov, ox1, oy1, oz1, ox2, oy2, oz2
end
```

### Zoom control

Reads a weapon's zoom level count from its tag data (offset `0x3DA`) and writes the zoom state
directly to memory. The zoom pointer is `zoom_address` in [Memory addresses and offsets](#memory-addresses-and-offsets).

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

### Toggle commands

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

### Ping smoothing

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