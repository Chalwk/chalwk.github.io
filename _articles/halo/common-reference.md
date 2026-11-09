---
title: "Halo Lua Common Reference"
permalink: /halo/common-reference/
date: 2026-11-09
last-updated: 2026-11-09
categories: [ education, halo, modding ]
tags: [ sapp, chimera, lua, scripting, reference, tutorial ]
---

Shared reference for SAPP (server) and Chimera (client) Lua scripting: relative memory offsets, game
constants, platform-independent helpers, and stock Halo commands. Anything that only one platform
can use stays in its own guide: [Scripting with SAPP](sapp/scripting-with-sapp.md),
[SAPP Cheat Sheet](sapp/cheat-sheet.md), [SAPP Utils](sapp/utils.md), and
[Scripting with Chimera](chimera/scripting-with-chimera.md).

The one exception is [Chimera Pointers](#chimera-pointers), which lives here until Chimera gets a
pointer table of its own.

---

## What Carries Over

- Relative offsets are shared. Once you hold a player, object, or tag pointer, the field offsets
  from that pointer are identical on SAPP and Chimera.
- Absolute addresses are not shared. The SAPP Hardcoded Pointers belong to the dedicated server
  (`haloded.exe` / `haloceded.exe`). Chimera runs inside the game client, so those addresses do not
  apply.
- Chimera cannot scan for signatures. Every Chimera address has to be hardcoded per platform (PC or
  CE).

---

## Conventions

- Function arguments use `snake_case`.
- Local functions use `lowerCamelCase`.
- Callbacks are global functions named in PascalCase (`OnJoin`, `OnTick`).

### Ternary Emulation

Lua has no ternary operator. Use `condition and value_if_true or value_if_false`.

```lua
local label = enabled and "ON" or "OFF"
```

Safe only when `value_if_true` is never `false` or `nil` (`0` and `""` are truthy in Lua, so they
are fine). When more than two outcomes exist, or several values change together, index a lookup
table instead:

```lua
local team_names = { [0] = "Red", [1] = "Blue" }
local team_name = team_names[team_index] or "None"
```

SAPP picks PC or CE values with `halo_type`, for example `halo_type == "PC" and 1 or 2`. Chimera has
no `halo_type`; see [Probing the Platform](#probing-the-platform).

---

## Platform Differences

The offsets in this file work on both platforms. What changes is the API call you use to obtain the
pointer.

| Topic                                | SAPP                              | Chimera                                                  |
|--------------------------------------|-----------------------------------|----------------------------------------------------------|
| Runs on                              | Dedicated server                  | Game client                                              |
| Player index in the API              | 1-16                              | 0-15                                                     |
| `get_dynamic_player` for dead player | Returns `0`                       | Returns `nil`                                            |
| Object ID to address                 | `get_object_memory(object_id)`    | `get_object(object_id)`                                  |
| Tag ID to tag entry                  | `lookup_tag(tag_id)`              | `get_tag(tag_id)`                                        |
| Platform detection                   | `halo_type` global                | None, probe candidate addresses                          |
| Signature scanning                   | `sig_scan`                        | Not available                                            |
| 3D vector access                     | `read_vector3d`, `write_vector3d` | Not available, use `read_float` / `write_float` per axis |
| Memory writes                        | Any valid address                 | Local player only; writing to others desyncs             |
| Run a console command                | `execute_command`                 | `execute_script`                                         |

`get_player(i)` and `get_dynamic_player(i)` exist on both. On Chimera, omitting the index uses the
local player.

---

## Finding Offsets

A memory address is a location in the game's memory. An offset is added to a base address to reach a
specific field. For example, a dynamic player object address plus `0xE0` reaches that player's
health.

Dynamic addresses change between sessions. Find a stable base (module handle, pointer table) and
apply offsets to reach the data.

Tools used in the Halo PC/CE modding community:

| Tool             | Use                                                             |
|------------------|-----------------------------------------------------------------|
| Cheat Engine     | Real-time memory scanner and modifier.                          |
| IDA Pro          | Professional disassembler and debugger for the Halo executable. |
| Halo Map Tools 3 | Utility for finding and modifying offsets within map files.     |

### Practical Tips

Start with a known value (health, ammo, shield). Scan in Cheat Engine, change it in-game, scan
again, repeat until few candidates remain. Verify by writing the candidate address.

For stable pointers, right-click the working address and use "Pointer scan for this address".
Restart the game and compare results to find a consistent chain. Pointer scans can generate
thousands of results; reload a few times to filter.

Document each discovered offset with its type and purpose.

### Further Reading

- [How To Find Offsets, Entity Addresses & Pointers](https://www.youtube.com/watch?v=YaFlh2pIKAg)
  walks through locating offsets using Cheat Engine.
- [Finding Offsets /w Cheat Engine - UnKnoWnCheaTs](https://www.unknowncheats.me/forum/general-programming-and-reversing/200702-finding-offsets-using-cheat-engine.html)
  is a written guide on using Cheat Engine for offset discovery.
- [Halo Map Tools - Bungie Forums](https://forums.bungie.org/halo/archive13.pl?read=390998)
  covers offset manipulation with Halo Map Tools 3.

---

## Memory Offsets

Every table below is relative to a pointer you already hold. Obtain the pointer with the call listed
in [Platform Differences](#platform-differences).

Memory arrays are indexed 0-15. SAPP's API takes 1-16, so convert with `to_real_index(i)` before
using an index in an array offset. Chimera's API already takes 0-15, so pass the index through.

### Base Object

Fields shared by every object (players, weapons, vehicles).

Chimera has no `read_vector3d`. Read position, velocity, and forward vector one float at a time:

```lua
local x = read_float(dyn + 0x5C)
local y = read_float(dyn + 0x60)
local z = read_float(dyn + 0x64)
```

| Offset           | Type  | Field                                                 |
|------------------|-------|-------------------------------------------------------|
| `0x0`            | dword | Tag ID (the low word is the index into the tag array) |
| `0x10`           | bits  | Flags (bit 0 = no collision, bit 5 = ignore physics)  |
| `0x5C/0x60/0x64` | float | World X / Y / Z                                       |
| `0x68/0x6C/0x70` | float | Velocity X / Y / Z (world units per tick)             |
| `0x74/0x78/0x7C` | float | Forward vector X / Y / Z                              |
| `0xB4`           | byte  | Object type                                           |

### Dynamic Player Object

The live player object. It uses the Base Object fields above plus the ones below. A dead player has
no dynamic object: check for `0` on SAPP and `nil` on Chimera before reading.

| Offset              | Type  | Field                                                      |
|---------------------|-------|------------------------------------------------------------|
| `0xE0`              | float | Health (0.0-1.0)                                           |
| `0xE4`              | float | Shields (0.0-1.0)                                          |
| `0x106`             | bits  | Dynamic player flags (bit 11 = no damage/invulnerable)     |
| `0x118`             | dword | Current weapon object ID                                   |
| `0x11C`             | dword | Vehicle object ID (`0xFFFFFFFF` = on foot)                 |
| `0x208`             | word  | Key/action input flags (bit 4 = flashlight)                |
| `0x230/0x234/0x238` | float | Aim vector X / Y / Z                                       |
| `0x2A3`             | byte  | Movement key input state                                   |
| `0x2A4`             | byte  | Reload key input state                                     |
| `0x2F0`             | word  | Vehicle seat index (0 = driver, 1 = passenger, 2 = gunner) |
| `0x2F2`             | byte  | Current weapon slot (0-3)                                  |
| `0x2F8-0x304`       | dword | Weapon slots 1-4 object IDs (`0x2F8 + (slot - 1) * 4`)     |
| `0x31E`             | byte  | Frag grenades                                              |
| `0x31F`             | byte  | Plasma grenades                                            |
| `0x37C`             | float | Invisibility (1.0 = invisible)                             |
| `0x47C`             | byte  | Weapon switch key input state                              |
| `0x47E`             | byte  | Grenade switch key input state                             |
| `0x480`             | word  | Zoom state (0 = unzoomed)                                  |
| `0x490`             | float | Primary trigger / shooting state                           |
| `0x50C`             | float | Crouch scale (0.0 = standing, 1.0 = crouched)              |

### Static Player Data

The persistent player structure.

| Offset            | Type    | Field                                                      |
|-------------------|---------|------------------------------------------------------------|
| `0x4`             | wchar[] | Name (UTF-16LE, low bytes readable as ASCII, max 12 chars) |
| `0x20`            | byte    | Team (0 = Red, 1 = Blue)                                   |
| `0x2C`            | dword   | Respawn timer (ticks)                                      |
| `0x34`            | dword   | Player unit / biped object ID                              |
| `0x60`            | byte    | Player FFA color index (0-17)                              |
| `0x68`            | word    | Active camouflage timer/state (> 0 = camouflaged)          |
| `0x6C`            | float   | Player speed multiplier (1.0 = normal)                     |
| `0x9C`            | word    | Kills                                                      |
| `0xA4`            | word    | Assists / secondary kills                                  |
| `0xAE`            | word    | Deaths                                                     |
| `0xC4`            | word    | King of the Hill hill time (ticks)                         |
| `0xC6`            | word    | Race score / laps                                          |
| `0xC8`            | word    | CTF score / flag returns                                   |
| `0xDC`            | dword   | Ping (ms)                                                  |
| `0xF8/0xFC/0x100` | float   | Alternate world X / Y / Z                                  |

### Weapon Object

Base Object fields plus the ones below.

| Offset  | Type  | Field                        |
|---------|-------|------------------------------|
| `0x240` | float | Overheat (0-1)               |
| `0x2B6` | word  | Reserve ammo                 |
| `0x2B8` | word  | Rounds in magazine           |
| `0x2C6` | word  | Secondary reserve ammo       |
| `0x2C8` | word  | Secondary rounds in magazine |

### Vehicle Object

Position and velocity use the Base Object offsets. A seated player's position is the vehicle's
position.

| Offset  | Type  | Field                                                      |
|---------|-------|------------------------------------------------------------|
| `0x324` | dword | Driver seat occupant unit object ID (`0xFFFFFFFF` = empty) |

[//]: # (Todo: Add missing Vehicle Object offsets)

### Tag Entry

Each tag entry is `0x20` bytes. On Chimera, `get_tag(tag_id)` returns the entry pointer, and the
Chimera guide reads the name pointer at `+0x10`. On SAPP, the table base and lookup are covered in
the Tag Table section of the [SAPP Cheat Sheet](sapp/cheat-sheet.md#tag-table).

| Entry offset | Type  | Field                                                                           |
|--------------|-------|---------------------------------------------------------------------------------|
| `0x0`        | dword | Tag class (`weap` = `0x77656170`, `vehi` = `0x76656869`, `eqip` = `0x65716970`) |
| `0xC`        | dword | Meta ID                                                                         |
| `0x10`       | dword | Pointer to the tag name string                                                  |
| `0x14`       | dword | Pointer to the tag data                                                         |

Weapon tag data: bit 3 of `+0x308` is set for objective weapons (flag, oddball), and the byte at
`+0x2` tells them apart (`0` = flag, `4` = oddball).

Vehicle tag data (`vehi`): word at `+0x2F4` controls vehicle motion/physics type (`0` = ground,
`1` = flying banshee, `3` = flying vehicle).

### Gametype Struct

Relative to the gametype struct base. On Chimera that is `gametype` from the
[Candidates Table](#candidates-table).

| Offset | Field                                                                         |
|--------|-------------------------------------------------------------------------------|
| `0x0`  | Gametype name, UTF-16LE (see [Wide Strings](#wide-strings))                   |
| `0x30` | Game type code, read with `read_byte` (see [Gametype Codes](#gametype-codes)) |
| `0x34` | Team play                                                                     |
| `0x58` | Score limit, read with `read_byte`                                            |

### Race Globals

Relative to the race globals base. On Chimera that is `race_globals` from the
[Candidates Table](#candidates-table).

| Offset             | Field                                                                      |
|--------------------|----------------------------------------------------------------------------|
| `0x0`              | Course checkpoint mask (popcount = checkpoints required)                   |
| `0x44 + index * 4` | Per-player progress mask (bit 0 = checkpoint 1, bit 1 = checkpoint 2, ...) |

`index` is the 0-15 memory index.

```lua
local function getRaceProgress(race_globals, memory_index)
    return read_dword(race_globals + 0x44 + (memory_index * 4))
end
```

---

## Game Constants

### Gametype Codes

The byte at gametype struct `+0x30` maps to the same strings SAPP exposes through `$gt` and Chimera
exposes through the `gametype` global.

| Code | Gametype         | String    |
|------|------------------|-----------|
| `1`  | CTF              | `ctf`     |
| `2`  | Slayer           | `slayer`  |
| `3`  | Oddball          | `oddball` |
| `4`  | King of the Hill | `king`    |
| `5`  | Race             | `race`    |

```lua
local gametype_names = { "ctf", "slayer", "oddball", "king", "race" }
local gametype = gametype_names[read_byte(gametype_base + 0x30)] or "unknown"
```

### Team and Color

Team byte (static player `+0x20`): `0` = Red, `1` = Blue.

Player FFA color index (static player `+0x60`), range 0-17:

| Value | Color  | Value | Color  |
|-------|--------|-------|--------|
| `0`   | White  | `9`   | Cyan   |
| `1`   | Black  | `10`  | Cobalt |
| `2`   | Red    | `11`  | Orange |
| `3`   | Blue   | `12`  | Teal   |
| `4`   | Gray   | `13`  | Sage   |
| `5`   | Yellow | `14`  | Brown  |
| `6`   | Green  | `15`  | Tan    |
| `7`   | Pink   | `16`  | Maroon |
| `8`   | Purple | `17`  | Salmon |

Writing the color usually needs a respawn before it fully applies. On Chimera, only write it for the
local player.

### Timing and Units

- 1 tick = 1/30 s, about 33.333 ms
- 1 world unit (WU) = 10 ft = 3.048 m
- Velocity offsets are in WU per tick; scripts often quote speeds in WU per second

| From    | To              | Formula                    |
|---------|-----------------|----------------------------|
| WU/s    | WU/tick         | `speed / 30`               |
| WU/s    | m/s             | `speed * 3.048`            |
| WU/s    | km/h            | `speed * 3.048 * 3.6`      |
| WU/tick | km/h            | `speed * 30 * 3.048 * 3.6` |
| WU/s    | meters per tick | `(speed / 30) * 3.048`     |

Example: an object moving at 15 WU/s covers `15 / 30 = 0.5` WU per tick, which is
`0.5 * 3.048 = 1.524` m. See [Distance](#distance) for the code.

---

## Chimera Pointers

The SAPP Hardcoded Pointers do not work in Chimera. They point into the dedicated server, Chimera
runs on the game client, and Chimera has no `sig_scan` to find the new locations. Each Chimera
pointer is hardcoded per platform. Relative offsets from a pointer you already hold are unaffected.

Only the pointers below are documented for Chimera so far.

### Candidates Table

| Pointer        | PC         | CE         | Description                                |
|----------------|------------|------------|--------------------------------------------|
| `gametype`     | `0x6F1C88` | `0x68CC48` | Gametype struct base (see Gametype Struct) |
| `race_globals` | `0x87A520` | `0x64C1C0` | Race global data base (see Race Globals)   |

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

The Chimera guide enumerates objects from a hardcoded address instead of a signature. It does not
give separate PC and CE values for it.

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

## Offset Helpers

These take a pointer, so they behave the same on both platforms. Get the pointer first (see
[Platform Differences](#platform-differences)).

### Wide Strings

Halo stores many strings as UTF-16LE: the player name (static player `+0x4`, max 12 characters) and
the gametype name (gametype struct `+0x0`). Names are ASCII, so the high byte of each character is
`0x00` and reading the low bytes is enough. Stop at the first null.

```lua
-- Reads a UTF-16LE string. Stops at the first null code unit.
---@param address number Memory address of the UTF-16LE string.
---@param max_chars number Maximum number of characters to read.
---@return string value Decoded ASCII string.
local function readWideString(address, max_chars)
    local chars = {}
    for i = 0, (max_chars - 1) * 2, 2 do
        local lo = read_byte(address + i)
        if lo == 0 then break end
        chars[#chars + 1] = string.char(lo)
    end
    return table.concat(chars)
end

---@param static_player number Static player address.
---@return string player_name Player name (maximum 12 characters).
local function readPlayerName(static_player)
    return readWideString(static_player + 0x4, 12)
end
```

### Position and Aim

Position is read as three floats because Chimera has no `read_vector3d`.

```lua
---@param object number Object memory address.
---@return number x
---@return number y
---@return number z
local function getObjectPosition(object)
    local x = read_float(object + 0x5C)
    local y = read_float(object + 0x60)
    local z = read_float(object + 0x64)
    return x,y,z
end

---@param dyn_player number Dynamic player address.
---@return number aim_x
---@return number aim_y
---@return number aim_z
local function getAimVector(dyn_player)
    local aim_x = read_float(dyn_player + 0x230)
    local aim_y = read_float(dyn_player + 0x234)
    local aim_z = read_float(dyn_player + 0x238)
    return aim_x,aim_y,aim_z
end
```

### Health and Shields

```lua
---@param dyn_player number Dynamic player address.
---@return number health Current health value (0.0-1.0).
---@return number shields Current shield value (0.0-1.0).
local function getHealthAndShields(dyn_player)
    local health = read_float(dyn_player + 0xE0)
    local shields = read_float(dyn_player + 0xE4)
    return health, shields
end

---@param dyn_player number Dynamic player address.
---@return number percentage Health as an integer percentage (0-100).
local function getHealthPercent(dyn_player)
    local health = read_float(dyn_player + 0xE0)
    local percentage = math.floor(health * 100)
    return percentage
end

---@param dyn_player number Dynamic player address.
---@return number percentage Shields as an integer percentage (0-100).
local function getShieldsPercent(dyn_player)
    local shields = read_float(dyn_player + 0xE4)
    local percentage = math.floor(shields * 100)
    return percentage
end
```

### Vehicle and Weapon

```lua
---@param dyn_player number Dynamic player address.
---@return boolean is_in_vehicle True if riding in a vehicle.
local function inVehicle(dyn_player)
    local vehicle_id = read_dword(dyn_player + 0x11C)
    local is_in_vehicle = vehicle_id ~= 0xFFFFFFFF
    return vehicle_id ~= 0xFFFFFFFF
end

---@param dyn_player number Dynamic player address.
---@return number weapon_slot Current weapon slot (0-3).
local function getWeaponSlot(dyn_player)
    local weapon_slot = read_byte(dyn_player + 0x2F2)
    return weapon_slot
end

---@param weapon_object number Weapon object address.
---@param threshold number Magazine count at or below which ammo is low.
---@return boolean low_ammo True if ammunition is low.
local function isLowAmmo(weapon_object, threshold)
    local mag_count = read_word(weapon_object + 0x2B8)
    local low_ammo = mag_count <= threshold
    return low_ammo
end
```

### Speed

Returns km/h. Velocity is in world units per tick, see [Timing and Units](#timing-and-units).

```lua
---@param dyn_player number Dynamic player address.
---@return number speed Speed in kilometres per hour (km/h).
local function getSpeed(dyn_player)
    local vx = read_float(dyn_player + 0x68)
    local vy = read_float(dyn_player + 0x6C)
    local vz = read_float(dyn_player + 0x70)
    local speed_wu_per_tick = math.sqrt(vx * vx + vy * vy + vz * vz)
    local speed_kmh = speed_wu_per_tick * 30 * 3.048 * 3.6
    return speed_kmh
end
```

### Static Player Fields

```lua
local team_names = { [0] = "Red", [1] = "Blue" }

---@param static_player number Static player address.
---@return string team_name Team name ("Red", "Blue", or "None").
local function getTeamName(static_player)
    local team_id = read_byte(static_player + 0x20)
    local team_name = team_names[team_id] or "None"
    return team_name
end

---@param static_player number Static player address.
---@return number kd_ratio Kill/death ratio. Returns kills if deaths are zero.
local function getKdRatio(static_player)
    local kills = read_word(static_player + 0x9C)
    local deaths = read_word(static_player + 0xAE)
    local kd_ratio = deaths == 0 and kills or kills / deaths
    return kd_ratio
end

local color_names = {
    [0] = "white", "black", "red", "blue", "gray", "yellow", "green", "pink", "purple",
    "cyan", "cobalt", "orange", "teal", "sage", "brown", "tan", "maroon", "salmon"
}

---@param static_player number Static player address.
---@return string color_name Player color name, or "unknown" if unrecognized.
local function getColorName(static_player)
    local color_id = read_byte(static_player + 0x60)
    local color_name = color_names[color_id] or "unknown"
    return color_name
end
```

### Tag Entry Helpers

```lua
-- Converts a four-letter tag class (e.g. "weap") to the dword stored in the tag entry.
---@param class string Four-letter tag class.
---@return number class_dword Encoded tag class as a 32-bit integer.
local function classToDword(class)
    local a, b, c, d = class:byte(1, 4)
    local class_dword = a * 0x1000000 + b * 0x10000 + c * 0x100 + d
    return class_dword
end

-- Reads the tag path from a tag entry pointer.
---@param tag_entry number Tag entry address.
---@return string tag_path Full tag path.
local function readTagPath(tag_entry)
    local tag_path_address = read_dword(tag_entry + 0x10)
    local tag_path = read_string(tag_path_address)
    return tag_path
end

-- getShortName("weapons\\assault rifle\\assault rifle") -> "assault rifle"
-- Extracts the final component of a tag path.
---@param tag_path string Full tag path.
---@return string short_name Final path component, or the original path if no separator exists.
local function getShortName(tag_path)
    local short_name = tag_path:match(".*\\([^\\]+)$") or tag_path
    return short_name
end
```

---

## Pure Lua Helpers

No game API calls. Copy them into scripts as needed.

### Table Utilities

```lua
-- deepCopy({a = 1, b = {c = 2}}) -> fully independent copy
-- Warning: does not handle circular references.
---@generic T
---@param original T Value to copy.
---@return T copy Independent copy of the original value.
local function deepCopy(original)
    if type(original) ~= "table" then return original end

    local copy = {}
    for k, v in pairs(original) do
        copy[deepCopy(k)] = deepCopy(v)
    end

    return setmetatable(copy, deepCopy(getmetatable(original)))
end

-- shuffleArray({10, 20, 30, 40}) -> shuffles in place (Fisher-Yates)
-- Call math.randomseed(os.time()) once at script load.
---@generic T
---@param array T[] Array to shuffle in place.
---@return nil
local function shuffleArray(array)
    for i = #array, 2, -1 do
        local j = math.random(i)
        array[i], array[j] = array[j], array[i]
    end
end

-- tableLength({10, 20, name = "Chalwk", 30}) -> 4
---@param t table Table to count.
---@return number count Number of key-value pairs in the table.
local function tableLength(t)
    local count = 0
    for _ in pairs(t) do
        count = count + 1
    end
    return count
end
```

### String Utilities

```lua
-- parseArgs("/give weapon sniper", " ") -> {"/give", "weapon", "sniper"}
-- The delimiter goes into a Lua pattern, so escape special characters (e.g. "%.").
---@param input string Input string to parse.
---@param delimiter string Lua pattern used to separate arguments.
---@return string[] args Parsed arguments.
local function parseArgs(input, delimiter)
    local t = {}
    for substring in input:gmatch("([^" .. delimiter .. "]+)") do
        t[#t + 1] = substring
    end
    return t
end

-- isChatCommand("/kick") -> true; isChatCommand("hello") -> false
---@param str string|nil Input string to check.
---@return boolean is_command True if the string begins with "/" or "\".
local function isChatCommand(str)
    if not str then return false end
    local first = string.sub(str, 1, 1)
    return first == "/" or first == "\\"
end

-- stripPrefix("//give") -> "give"
---@param message string|nil Message to strip the prefix from.
---@return string stripped_message Message without leading slashes or backslashes.
local function stripPrefix(message)
    if not message then return "" end
    return (string.gsub(message, "^[\\/]+", ""))
end

-- splitString("a,b;c", ",", ";") -> {"a", "b", "c"}
-- Longer delimiters take precedence.
---@param str string Input string to split.
---@param ... string One or more delimiters.
---@return string[] tokens Extracted string segments.
local function splitString(str, ...)
    local delims = { ... }
    if #delims == 0 then return { str } end

    -- Split into individual characters if any delimiter is empty
    for _, d in ipairs(delims) do
        if d == "" then
            local chars = {}
            for i = 1, #str do
                chars[#chars + 1] = string.sub(str, i, i)
            end
            return chars
        end
    end

    -- Sort delimiters by length descending so the longest match wins
    table.sort(delims, function(a, b) return #a > #b end)

    -- Escape magic characters in each delimiter for Lua pattern
    local escaped = {}
    for _, d in ipairs(delims) do
        escaped[#escaped + 1] = string.gsub(d, "([%^%$%(%)%%%.%[%]%*%+%-%?])", "%%%1")
    end
    local sep_pattern = table.concat(escaped, "|")

    -- Split using the complement of the delimiter pattern
    local tokens = {}
    for token in string.gmatch(str, "([^" .. sep_pattern .. "]+)") do
        tokens[#tokens + 1] = token
    end

    -- Strip all delimiter characters from each token
    for i = 1, #tokens do
        local token = tokens[i]
        for _, d in ipairs(delims) do
            token = string.gsub(token, string.gsub(d, "([%^%$%(%)%%%.%[%]%*%+%-%?])", "%%%1"), "")
        end
        tokens[i] = token
    end

    return tokens
end

-- tokenizeCmdString('say "hello world" foo') -> {"say", "hello world", "foo"}
---@param str string Command string to tokenize.
---@return string[] tokens Extracted command arguments.
local function tokenizeCmdString(str)
    local tokens = {}
    str = str:gsub("^%s*(.-)%s*$", "%1") .. " " -- trim and add sentinel
    local pos = 1
    while pos <= #str do
        local token, next_pos

        -- try double-quoted string
        token, next_pos = str:match('^"([^"]*)"%s+()', pos)
        if not token then
            token, next_pos = str:match('^([^%s]+)%s+()', pos)
        end
        if not token then break end

        tokens[#tokens + 1] = token
        pos = next_pos
    end
    return tokens
end

-- findChar("hello world", "l") -> 3, 4, 10
local unpack = unpack or table.unpack

---@param str string String to search.
---@param character string Character to find.
---@return integer ... One-based position for each occurrence.
local function findChar(str, character)
    local indices = {}
    for i = 1, #str do
        if string.sub(str, i, i) == character then
            indices[#indices + 1] = i
        end
    end
    return unpack(indices)
end

-- wildcardMatch("hello", "he?lo") -> true
-- wildcardMatch("test123", "test*") -> true
---@param str string String to compare against the pattern.
---@param pattern string Wildcard pattern. Supports "*" and "?".
---@param case_sensitive boolean|nil Whether matching is case-sensitive (defaults to false).
---@return boolean matches True if the string matches the wildcard pattern.
local function wildcardMatch(str, pattern, case_sensitive)
    if not case_sensitive then
        str = str:lower()
        pattern = pattern:lower()
    end

    -- Handle leading/trailing '?' by substituting the actual character.
    if string.sub(pattern, 1, 1) == "?" then
        pattern = string.sub(str, 1, 1) .. string.sub(pattern, 2)
    end
    if string.sub(pattern, -1) == "?" then
        pattern = string.sub(pattern, 1, -2) .. string.sub(str, -1)
    end

    -- No wildcards -> simple equality check
    if not pattern:find("*", 1, true) and not pattern:find("?", 1, true) then
        return str == pattern
    end

    -- Quick mismatch checks
    if string.sub(pattern, 1, 1) ~= string.sub(str, 1, 1) and string.sub(pattern, 1, 1) ~= "*" then
        return false
    end
    if string.sub(pattern, -1) ~= string.sub(str, -1) and string.sub(pattern, -1) ~= "*" then
        return false
    end

    -- Split pattern into subpatterns by '*'
    local subpatterns = {}
    local plen = #pattern
    local cur = ""
    for i = 1, plen do
        local c = string.sub(pattern, i, i)
        if c == "*" then
            if cur ~= "" then
                subpatterns[#subpatterns + 1] = cur
                cur = ""
            end
        else
            cur = cur .. c
        end
    end
    if cur ~= "" then
        subpatterns[#subpatterns + 1] = cur
    end

    -- Greedy match for each subpattern
    local start = 1
    local slen = #str
    for _, subp in ipairs(subpatterns) do
        local sublen = #subp
        local found = false
        local ts = start
        local te = start + sublen - 1

        while te <= slen do
            local match = true
            for j = 1, sublen do
                local pc = string.sub(subp, j, j)
                if pc ~= "?" and pc ~= string.sub(str, ts + j - 1, ts + j - 1) then
                    match = false
                    break
                end
            end
            if match then
                found = true
                start = ts + sublen
                break
            end
            ts = ts + 1
            te = te + 1
        end
        if not found then return false end
    end
    return true
end
```

### Message Formatting

Three approaches. Pick the one that fits:

```lua
-- V1: string.format wrapper
-- formatMessage("Player %s joined.", "Chalwk") -> "Player Chalwk joined."
---@param message string Format string containing standard Lua format specifiers.
---@param ... any Arguments passed to string.format.
---@return string formatted_message Formatted message, or the original message if no arguments are supplied.
local function formatMessage(message, ...)
    return select('#', ...) > 0 and message:format(...) or message
end

-- V2: $placeholder substitution
-- formatMessageVars("Hello $name", {name = "Chalwk"}) -> "Hello Chalwk"
---@param message string Message containing named placeholders.
---@param vars table<string, string|number> Values to substitute into matching placeholders.
---@return string formatted_message Message with placeholders replaced.
local function formatMessageVars(message, vars)
    return (message:gsub("%$(%w+)", function(key)
        return vars[key] or "$" .. key
    end))
end

-- V3: case-insensitive placeholders with fallback
-- formatTemplate("Welcome $NAME", {name = "Chalwk"}) -> "Welcome Chalwk"
---@param template string Message template containing named placeholders.
---@param args table<string, any>|nil Values to substitute into matching placeholders.
---@return string formatted_message Message with placeholders replaced, or the original template if args is nil.
local function formatTemplate(template, args)
    if not args then return template end

    return (template:gsub("%$([%w_]+)", function(key)
        local value = args[key] or args[key:lower()] or args[key:upper()]
        return value ~= nil and tostring(value) or "$" .. key
    end))
end
```

### Time Utilities

```lua
-- wordToTime("1m30s") -> 90 | ("2h") -> 7200 | ("1d12h") -> 129600
---@param time_string string|nil Duration string containing s, m, h, and d units.
---@return number total_seconds Parsed duration in seconds, or -1 if no positive duration is parsed.
local function wordToTime(time_string)
    if not time_string then return -1 end

    local total, num = 0, ""
    for i = 1, #time_string do
        local c = string.sub(time_string, i, i)
        if tonumber(c) then
            num = num .. c
        else
            local amount = tonumber(num) or 0
            if c == "s" then
                total = total + amount
            elseif c == "m" then
                total = total + amount * 60
            elseif c == "h" then
                total = total + amount * 3600
            elseif c == "d" then
                total = total + amount * 86400
            end
            num = ""
        end
    end
    return total > 0 and total or -1
end

-- timeToWord(3665) -> "1h 1m 5s" | (-1) -> "-1" | (0) -> "0s"
---@param seconds number|string|nil Duration in seconds.
---@return string duration Human-readable duration, or "-1" if the input is invalid.
local function timeToWord(seconds)
    if seconds == -1 or not tonumber(seconds) then return "-1" end

    seconds = tonumber(seconds)

    local days = math.floor(seconds / 86400)
    seconds = seconds % 86400

    local hours = math.floor(seconds / 3600)
    seconds = seconds % 3600

    local mins = math.floor(seconds / 60)
    local secs = seconds % 60
    local parts = {}

    if days > 0 then parts[#parts + 1] = days .. "d" end
    if hours > 0 then parts[#parts + 1] = hours .. "h" end
    if mins > 0 then parts[#parts + 1] = mins .. "m" end
    if secs > 0 or #parts == 0 then parts[#parts + 1] = secs .. "s" end

    return table.concat(parts, " ")
end

-- formatDuration(125) -> "00:02:05"
---@param seconds number|string|nil Duration in seconds.
---@return string formatted_duration Duration formatted as HH:MM:SS.
local function formatDuration(seconds)
    seconds = tonumber(seconds) or 0

    local h = math.floor(seconds / 3600)
    local m = math.floor((seconds % 3600) / 60)
    local s = math.floor(seconds % 60)

    return string.format("%02d:%02d:%02d", h, m, s)
end
```

### Math and Geometry

```lua
---@param px number Point X coordinate.
---@param py number Point Y coordinate.
---@param pz number Point Z coordinate.
---@param ox number Origin X coordinate.
---@param oy number Origin Y coordinate.
---@param oz number Origin Z coordinate.
---@param radius number Sphere radius.
---@return boolean inside True if the point is within or on the sphere.
local function inSphere(px, py, pz, ox, oy, oz, radius)
    local dx, dy, dz = ox - px, oy - py, oz - pz
    return (dx * dx + dy * dy + dz * dz) <= radius * radius
end

---@param px number Point X coordinate.
---@param py number Point Y coordinate.
---@param cx number Circle centre X coordinate.
---@param cy number Circle centre Y coordinate.
---@param radius number Circle radius.
---@return boolean inside True if the point is within or on the circle.
local function checkInCircle(px, py, cx, cy, radius)
    return (px - cx) ^ 2 + (py - cy) ^ 2 <= radius ^ 2
end

-- Needs the math.atan2 guard below.
---@param forward_x number Forward vector X component.
---@param forward_y number Forward vector Y component.
---@return string direction Nearest cardinal or intercardinal direction (N, NE, E, SE, S, SW, W, NW).
local function directionToCardinal(forward_x, forward_y)
    local angle = (90 - math.deg(math.atan2(forward_y, forward_x))) % 360
    local dirs = { "N", "NE", "E", "SE", "S", "SW", "W", "NW" }
    local idx = math.floor((angle + 22.5) / 45) % 8 + 1
    return dirs[idx]
end

---@param value number Value to round.
---@param decimals number|nil Number of decimal places (defaults to 0).
---@return number rounded_value Rounded value.
local function round(value, decimals)
    local factor = 10 ^ (decimals or 0)
    return math.floor(value * factor + 0.5) / factor
end

---@param hex_string string Hexadecimal string to convert.
---@return number|nil decimal_value Converted decimal number, or nil if the string is invalid.
local function toDecimal(hex_string)
    return tonumber(hex_string, 16)
end
```

#### math.atan2 Guard

SAPP's LuaJIT environment has no `math.atan2`. Define this once at the top of any script that needs
it, or that uses a helper that calls it such as `directionToCardinal`. The `if not` check makes it
safe to paste on any platform.

```lua
if not math.atan2 then
    local pi = math.pi

    ---@param y number Y coordinate or vector component.
    ---@param x number X coordinate or vector component.
    ---@return number angle_radians Angle in radians, ranging from -pi to pi.
    math.atan2 = function(y, x)
        if x > 0 then
            return math.atan(y / x)
        elseif x < 0 then
            return y >= 0 and math.atan(y / x) + pi or math.atan(y / x) - pi
        else
            if y > 0 then return pi / 2
            elseif y < 0 then return -pi / 2
            else return 0 end
        end
    end
end
```

### Distance

Unit conversions are under [Timing and Units](#timing-and-units).

```lua
local WU_TO_M = 3.048

-- Returns the 3D distance between two points in world units.
---@param x1 number Starting point X coordinate.
---@param y1 number Starting point Y coordinate.
---@param z1 number Starting point Z coordinate.
---@param x2 number Target point X coordinate.
---@param y2 number Target point Y coordinate.
---@param z2 number Target point Z coordinate.
---@return number distance Distance between the two points in world units.
local function distance3d(x1, y1, z1, x2, y2, z2)
    local dx = x2 - x1
    local dy = y2 - y1
    local dz = z2 - z1
    return math.sqrt(dx * dx + dy * dy + dz * dz)
end

-- Returns the distance in meters between a point and a target table.
---@param x number Starting point X coordinate.
---@param y number Starting point Y coordinate.
---@param z number Starting point Z coordinate.
---@param target number[] Target position {x, y, z} in world units.
---@return number distance_m Distance between the points in meters.
local function distanceMeters(x, y, z, target)
    local wu = distance3d(x, y, z, target[1], target[2], target[3])
    return wu * WU_TO_M
end
```

Example:

```lua
local px, py, pz = getObjectPosition(dynamic_player)
local loc = { 0, 0, 0 }

local distance_wu = distance3d(px, py, pz, loc[1], loc[2], loc[3])
local distance_m = distanceMeters(px, py, pz, loc)
```

---

## Stock Halo Commands

These are Halo's built-in server commands. SAPP enhances or overrides some. Run them from a script
with `execute_command` on SAPP or `execute_script` on Chimera. Stock `sv_*` commands need a plain
player index. SAPP-only commands and player expressions are in the
[SAPP Cheat Sheet](sapp/cheat-sheet.md#command-reference).

| Command                    | Usage                                  | Description                                                         |
|----------------------------|----------------------------------------|---------------------------------------------------------------------|
| quit                       | `quit`                                 | Close the server application.                                       |
| sv_ban                     | `sv_ban <player> [length]`             | Ban a player (optional duration).                                   |
| sv_ban_penalty             | `sv_ban_penalty [1] [2] [3] [4]`       | Set ban lengths for TK penalties. Default: `5m, 1d, 10d, 0`.        |
| sv_banlist                 | `sv_banlist`                           | Display ban list.                                                   |
| sv_banlist_file            | `sv_banlist_file`                      | Locate ban list file.                                               |
| sv_end_game                | `sv_end_game`                          | End game without starting a new one.                                |
| sv_friendly_fire           | `sv_friendly_fire [0-3]`               | 0=default,1=off,2=shield only,3=on.                                 |
| sv_gamelist                | `sv_gamelist`                          | List game variants in `savegames` folder.                           |
| sv_kick                    | `sv_kick <player>`                     | Remove a player.                                                    |
| sv_log_echo_chat           | `sv_log_echo_chat [enabled]`           | Echo chat to non-SAPP log (CE only).                                |
| sv_log_enabled             | `sv_log_enabled [enabled]`             | Enable non-SAPP server log (CE only).                               |
| sv_log_file                | `sv_log_file [path]`                   | Set log file path (CE only). Default: `haloserver.log`.             |
| sv_log_note                | `sv_log_note [string]`                 | Write note to non-SAPP log (CE only).                               |
| sv_log_rotation_threshold  | `sv_log_rotation_threshold [KiB]`      | Set log rotation size (CE only). Default: `4096`.                   |
| sv_map                     | `sv_map <map> <game variant>`          | Change map and/or game variant.                                     |
| sv_map_next                | `sv_map_next`                          | End current game, load next.                                        |
| sv_map_reset               | `sv_map_reset`                         | Reset game (scores, kills, objects).                                |
| sv_mapcycle                | `sv_mapcycle`                          | Display non-SAPP map cycle.                                         |
| sv_mapcycle_add            | `sv_mapcycle_add <map> <game variant>` | Add entry to non-SAPP map cycle.                                    |
| sv_mapcycle_begin          | `sv_mapcycle_begin`                    | Start non-SAPP map cycle from beginning.                            |
| sv_mapcycle_del            | `sv_mapcycle_del <#>`                  | Remove entry from non-SAPP map cycle.                               |
| sv_mapcycle_timeout        | `sv_mapcycle_timeout [time]`           | Set time between games (seconds). Default: `10`.                    |
| sv_maplist                 | `sv_maplist`                           | Display all loaded maps.                                            |
| sv_maxplayers              | `sv_maxplayers [players]`              | Get/set max players (1-16). Default: `16`.                          |
| sv_motd                    | `sv_motd [motd.txt]`                   | Set path for server motd (CE only).                                 |
| sv_name                    | `sv_name [name]`                       | Get/set server name (max 63 chars). Default: `"Halo"`.              |
| sv_password                | `sv_password [password]`               | Get/set join password (max 8 chars).                                |
| sv_players                 | `sv_players`                           | List players with indices, team, ping, score, betrayals, TK timer.  |
| sv_public                  | `sv_public [public]`                   | Set server visibility to master server. Default: `true`.            |
| sv_rcon_password           | `sv_rcon_password [password]`          | Set rcon password (max 8 chars).                                    |
| sv_single_flag_force_reset | `sv_single_flag_force_reset [enabled]` | Allow flag reset while held in single-flag games. Default: `false`. |
| sv_status                  | `sv_status`                            | Display current map, player count, max players.                     |
| sv_timelimit               | `sv_timelimit [minutes]`               | Set time limit (`0`=indefinite, `-1`=use variant).                  |
| sv_tk_ban                  | `sv_tk_ban [bans]`                     | Team kills required for ban. Default: `4`.                          |
| sv_tk_cooldown             | `sv_tk_cooldown [time]`                | Time before TK point lost (seconds). Default: `300`.                |
| sv_tk_grace                | `sv_tk_grace [time]`                   | Grace period between TK points (seconds). Default: `3`.             |
| sv_unban                   | `sv_unban <#>`                         | Unban a player and remove from ban list.                            |

---

## Default Profile Name

This is the name Halo uses when:

- The game is launched for the first time and no profile exists yet.
- A new player profile is created automatically.
- Halo cannot find an existing player profile to load.

The profile itself is stored inside the game's `savegames` directory and the profile folder is also
named `New001`.

### Placeholder Names

Halo PC and CE contain a built-in list of fallback multiplayer names commonly referred to as the
"temporary profile name pool" or "placeholder name pool".

These names are embedded in the game's `globals.globals` tag and ship with the stock multiplayer
maps.

Because every stock multiplayer map contains this tag, the default pool is normally identical across
the retail Halo PC and CE multiplayer maps.

Modded or rebuilt maps can change the list entirely.

```text
Butcher, Caboose, Crazy, Cupid, Darling, Dasher, Disco, Donut, Dopey,
Ghost, Goat, Grumpy, Hambone, Hollywood, Howard, Jack, Killer, King,
Noodle, Penguin, Pirate, Prancer, Saucy, Shadow, Sleepy, Snake, Sneak,
Stompy, Stumpy, The Bear, The Big L, Tooth, Walla Walla, Weasel, Whicker,
Wheezy, Whisp, Wilshire
```

These names are not normally used during standard single-instance gameplay. Instead, they exist as
fallback identities used by the multiplayer networking system.

### When They Apply

The placeholder pool is primarily used when Halo cannot safely use the requested multiplayer profile
name.

The most common example is:

- A player joining a multiplayer server where another player is already using the same profile name.

Halo PC and CE do not allow duplicate active player names within the same multiplayer session. If
the requested name is already in use by another connected player, Halo automatically assigns a
temporary placeholder name from the pool instead.

For example:

1. A player joins a server using `New001`.
2. Another player joins using a profile also named `New001`.
3. Halo detects the duplicate name conflict.
4. The second player is assigned a temporary placeholder name such as `Caboose`, or `Wheezy`.

---
