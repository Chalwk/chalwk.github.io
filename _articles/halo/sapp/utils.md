---
title: "SAPP Utils"
date: 2026-11-09
last-updated: 2026-11-09
categories: [ education, halo, modding ]
tags: [ sapp, lua, scripting, server, tutorial ]
---

Helpers, notes, and gotchas for SAPP Lua scripting. Lookup tables (offsets, signatures, variables,
commands) are documented in [SAPP Cheat Sheet](cheat-sheet.md).

---

## Conventions

- Function arguments use `snake_case`.
- Local functions use `lowerCamelCase`.
- Callbacks are global functions named in PascalCase (`OnJoin`).

### Ternary Emulation

Lua has no ternary operator. Use `condition and value_if_true or value_if_false`.

```lua
local var1, var2 = halo_type == 'PC' and 1 or 2, halo_type == 'PC' and 3 or 4
```

Safe only when `value_if_true` is never `false` or `nil` (`0` and `""` are truthy in Lua, so they
are fine). When several values change together, index a lookup table instead of repeating the
condition:

```lua
local version = ({ PC = { 1, 2 }, CE = { 3, 4 } })[halo_type]
local var1, var2 = version[1], version[2]
```

---

## Player Index Convention

- SAPP API functions use player indices 1-16; Halo memory tables and arrays use 0-15.
- Check `player_present(i)` and `player_alive(i)` before accessing player data.
- `get_dynamic_player(i) == 0` means the player is dead. It is redundant if `player_alive(i)` is
  already checked.

```lua
if player_present(player_id) and player_alive(player_id) then
    local dyn = get_dynamic_player(player_id)
    if dyn ~= 0 then
        -- ...
    end
end
```

### Index Conversion

1. `to_real_index(player_index)`
   Converts a SAPP index (1-16) to a Halo index (0-15). Use it for zero-based memory arrays.

2. `to_player_index(real_index)`
   Converts a Halo index (0-15) to a SAPP index (1-16). Use it for SAPP API calls.

Example 1: using `to_real_index`

```lua
function OnTick()
    for i = 1, 16 do
        if player_present(i) then
            local real = to_real_index(i)
            local checkpoint_addr = race_globals + 0x44 + (real * 4)
            local checkpoint = read_dword(checkpoint_addr)
        end
    end
end
```

Example 2: using `to_player_index`

```lua
function OnTick()
    local tick_id = read_dword(tick_counter_address)
    for i = 1, 16 do
        local dyn = get_dynamic_player(i)
        if dyn == 0 or not player_alive(i) then goto continue end

        for j = 0, 3 do
            local struct = dyn + 0x430 + (j * 0x10)
            local damager_time = read_dword(struct)

            if damager_time == tick_id then
                local internal_idx = read_word(struct + 0xC)
                if internal_idx == 0xFFFF then goto continue end

                local damager = to_player_index(internal_idx)
                if player_present(damager) then
                    say(damager, "You damaged a teammate!")
                end
            end
        end
        ::continue::
    end
end
```

---

## Signature Scanning

`sig_scan` finds byte patterns (`??` = wildcard) and works on both PC and CE. It returns the
match-start address or `0`. Add the offset, then `read_dword` to get the pointer. Always check for
`0`.

- `halo_type` is a case-sensitive string: `"PC"` or `"CE"`. Use it only as a fallback when no
  reliable signature exists.
- Pre-computed signatures: [Signature Reference](cheat-sheet.md#signature-reference).
- Hardcoded PC/CE pointer table: [Hardcoded Pointers](cheat-sheet.md#hardcoded-pointers).

Some CE patterns do not match on PC because the compilers emitted different instruction shapes for
the same code. The `gametype_base` sig is one example. Always use the version-fallback form below
rather than returning early on sig failure.

```lua
--- Returns the pointer at sig_scan(sig) + offset, or nil if invalid.
--- Guards against sig_scan returning 0 and against read_dword returning
--- something outside Halo's data range (0x400000-0x800000).
local function safeScan(sig, offset)
    local hit = sig_scan(sig)
    if hit == 0 then return nil end
    local ptr = read_dword(hit + offset)
    if not ptr or ptr < 0x400000 or ptr > 0x800000 then return nil end
    return ptr
end

local network_struct_address, gametype_base_address

function OnScriptLoad()
    -- Sig that works on both PC and CE. Fallback is here for robustness.
    network_struct_address = safeScan("F3ABA1????????BA????????C740??????????E8????????668B0D", 0x3)
        or (halo_type == 'PC' and 0x745B80 or 0x6C7960)

    -- Sig that works on CE but returns 0 on PC (different instruction shape). Fallback handles PC.
    gametype_base_address = safeScan("B9360000008BF3BF????????", 0x8)
        or (halo_type == 'PC' and 0x671320 or 0x5F5478)
end

--- Returns the current server's name (UTF-16LE).
local function getServerName()
    if not network_struct_address then return nil end
    return readWideString(network_struct_address + 0x8, 0x42)
end

--- Returns the current gametype's score limit.
local function getScoreLimit()
    if not gametype_base_address then return nil end
    return read_byte(gametype_base_address + 0x58)
end
```

Notes:

- Calling `read_dword(sig_scan(...) + offset)` unguarded crashes the server when `sig_scan` returns
  `0`. The `safeScan` helper above checks `sig_scan ~= 0`, that `read_dword` returns a number, and
  that the number is in Halo's data range.

- Do not return early when a sig fails. A single-platform miss disables the entire script on the
  other platform. Fall back to the hardcoded value via the `or` expression shown above.

- Wildcard the address bytes rather than embedding a specific immediate. This survives builds
  where the address moves but not when the instruction shape changed (as with `gametype_base` on
  PC).

- Some pointers have no signature at all. `map_pointer` is a static data slot the map loader
  writes once per load; no fixed instruction references it. Pick the value by `halo_type` from
  Hardcoded Pointers.

---

## SAPP timer ()

`timer(ms, "GlobalFnName", [args...])`

- Calls global `GlobalFnName` once after `ms`, forwarding any extra args. It cannot be a local or
  anonymous function.
- `timer()` returns `nil`, so there is no cancellation handle.
- Callback return: `true` repeats indefinitely; `false`, `nil`, or no return fires once. Other types
  do not repeat.
- `lua_unload` disables the script's timers.
- SAPP API functions are globals, so `timer` can call them directly (see Assigning Weapons).

```lua
function OnJoin(player_id)
    timer(3000, "Welcome", player_id)
end

function Welcome(player_id)
    if player_present(player_id) then -- They may have left during the delay.
        say(player_id, "Welcome!")
    end
end
```

---

## Player and Chat

### Message Excluding a Player

Sends a chat message to every connected player except one.

```lua
---@param message string The message to send.
---@param exclude_player_id number Player index (1-16) to skip.
local function sendExclude(message, exclude_player_id)
    for i = 1, 16 do
        if player_present(i) and i ~= exclude_player_id then
            say(i, message)
        end
    end
end
```

Use case: announce "Player X found the secret" without revealing it to X.

### In Vehicle Check

Fast test for whether a player is riding in any vehicle.

```lua
---@param dyn_player number Dynamic player memory address.
---@return boolean in_vehicle True if riding in a vehicle.
local function inVehicle(dyn_player)
    return read_dword(dyn_player + 0x11C) ~= 0xFFFFFFFF
end
```

`0xFFFFFFFF` means no vehicle. The check is cheap, so it suits per-tick logic.

### Get Player Vehicle

Returns the vehicle object address the player is currently occupying, or `nil` if none.

```lua
---@param player_id number Player index (1-16).
---@return number|nil vehicle_object Vehicle object address, or nil.
local function getPlayerVehicleObject(player_id)
    if not player_present(player_id) or not player_alive(player_id) then return nil end

    local dyn = get_dynamic_player(player_id)
    if dyn == 0 then return nil end

    local vehicle_id = read_dword(dyn + 0x11C)
    if vehicle_id == 0xFFFFFFFF then return nil end

    local vehicle_object = get_object_memory(vehicle_id)
    return vehicle_object ~= 0 and vehicle_object or nil
end
```

### Vehicle Occupied Check

```lua
---@param vehicle_object number Memory address of the vehicle.
---@return boolean occupied True if at least one player is inside.
local function isVehicleOccupied(vehicle_object)
    for i = 1, 16 do
        if getPlayerVehicleObject(i) == vehicle_object then
            return true
        end
    end
    return false
end
```

Example: eject any player who enters a reserved vehicle.

### Player Invisible Check

Detects active camouflage or script-based invisibility.

```lua
---@param player_id number Player index (1-16).
---@return boolean invisible True if invisible.
local function isPlayerInvisible(player_id)
    local dyn = get_dynamic_player(player_id)
    if dyn == 0 then return false end

    return read_float(dyn + 0x37C) == 1
end
```

### Clear Console

Prints blank lines to push previous messages out of view.

```lua
---@param player_id number Player index (1-16).
local function clearConsole(player_id)
    for _ = 1, 25 do
        rprint(player_id, " ")
    end
end
```

### Teleport Player or Object

Writes the position and forward vector straight to a player's dynamic object or a vehicle.

```lua
---@param object number Dynamic player or vehicle memory address.
---@param x number Target X coordinate.
---@param y number Target Y coordinate.
---@param z number Target Z coordinate.
---@param rotation number Rotation in radians.
---@param z_offset number|nil Vertical lift. Defaults to 0.3.
local function teleportPlayer(object, x, y, z, rotation, z_offset)
    z_offset = z_offset or 0.3
    write_vector3d(object + 0x5C, x, y, z + z_offset)
    write_vector3d(object + 0x74, math.cos(rotation), math.sin(rotation), 0)
end
```

Offset `0x5C` is the object's position and `0x74` is its forward vector. For vehicles, also apply
the physics fix under Known SAPP Quirks.

### Get Player Position

Returns the player's eye-level position, accounting for vehicles and crouching.

```lua
---@param dyn_player number Dynamic player address.
---@return number|nil x
---@return number|nil y
---@return number|nil z
local function getPlayerPosition(dyn_player)
    local crouch = read_float(dyn_player + 0x50C) -- 0 = standing, 1 = fully crouched
    local vehicle_id = read_dword(dyn_player + 0x11C)

    -- Seated players use the vehicle's position:
    local object = vehicle_id == 0xFFFFFFFF and dyn_player or get_object_memory(vehicle_id)
    if object == 0 then return nil end

    local x, y, z = read_vector3d(object + 0x5C)
    return x, y, z + 0.65 - (0.3 * crouch)
end
```

### Get Aim Vector

Returns the camera's facing direction.

```lua
---@param dyn_player number Dynamic player address.
---@return number aim_x
---@return number aim_y
---@return number aim_z
local function getAimVector(dyn_player)
    local aim_x = read_float(dyn_player + 0x230)
    local aim_y = read_float(dyn_player + 0x234)
    local aim_z = read_float(dyn_player + 0x238)
    return aim_x, aim_y, aim_z
end
```

### Get Player Health and Shields

```lua
---@param dyn_player number Dynamic player address.
local function getHealthAndShields(dyn_player)
    return read_float(dyn_player + 0xE0), read_float(dyn_player + 0xE4)
end

-- Get as percentage:
local function getHealthPercent(dyn_player)
    return math.floor(read_float(dyn_player + 0xE0) * 100)
end

local function getShieldsPercent(dyn_player)
    return math.floor(read_float(dyn_player + 0xE4) * 100)
end
```

### Get Player Name

Prefer `get_var(player_id, "$name")`. The memory read below is useful when you need the raw UTF-16LE
bytes.

```lua
local function getPlayerName(player_id)
    local static_p = get_player(player_id)
    if not static_p then return nil end
    return readWideString(static_p + 0x4, 12)
end
```

### Get Team Name

Prefer `get_var(player_id, "$team")`.

```lua
local function getTeamName(player_id)
    local static_p = get_player(player_id)
    if not static_p then return "None" end
    return read_byte(static_p + 0x20) == 0 and "Red" or "Blue"
end
```

### Get K/D Ratio

```lua
local function getKDRatio(player_id)
    local static_p = get_player(player_id)
    if not static_p then return 0 end
    local kills = read_word(static_p + 0x9C)
    local deaths = read_word(static_p + 0xAE)
    return deaths == 0 and kills or kills / deaths
end
```

### Speedometer

Returns speed in km/h from the object's velocity offsets. Velocity is in world units per tick.

See [Timing and Units](cheat-sheet.md#timing-and-units) (SAPP Cheat Sheet).

```lua
local function getSpeed(dyn_player)
    local vx = read_float(dyn_player + 0x68)
    local vy = read_float(dyn_player + 0x6C)
    local vz = read_float(dyn_player + 0x70)
    local speed_wu_per_tick = math.sqrt(vx * vx + vy * vy + vz * vz)
    return speed_wu_per_tick * 30 * 3.048 * 3.6
end
```

### Get Player Ping

```lua
local function getPlayerPing(player_id)
    local static = get_player(player_id)
    return static and read_dword(static + 0xDC) or nil
end
```

### Get and Set Player Color

```lua
local function getPlayerColor(player_id)
    local static = get_player(player_id)
    return static and read_byte(static + 0x60)
end

-- A respawn is usually required for the change to fully apply.
---@param color number Color index (0-17)
--- Color table:
---    0 =  white   1 = black    2 = red     3 = blue    4 = gray
---    5 =  yellow  6 = green    7 = pink    8 = purple  9 = cyan
---    10 = cobalt  11 = orange  12 = teal   13 = sage   14 = brown
---    15 = tan     16 = maroon  17 = salmon
local function setPlayerColor(player_id, color)
    local static = get_player(player_id)
    write_byte(static + 0x60, color)
end
```

### Spawning Projectiles

```lua
-- Example: Fire a rocket projectile from a player's position
local ROCKET_PROJECTILE_TAG_ID = getTagId("proj", "weapons\\rocket launcher\\rocket")
local rocket_projectile = spawn_projectile(
    ROCKET_PROJECTILE_TAG_ID, 
    player_id, 
    x, y, z, 
    rx, ry, rz -- Optional rotation in radians (defaults to 0, 0, 0 if omitted)
)
```

### Vanish Player

Moves a player far off-map so others cannot see them. Call it every tick to keep them hidden.

```lua
---@param player_id number Player index (1-16).
local function vanishPlayer(player_id)
    if not player_present(player_id) then return end

    local dyn = get_dynamic_player(player_id)
    if dyn == 0 then return end

    local x, y, z = getPlayerPosition(dyn)
    if not x then return end

    local static = get_player(player_id)
    write_float(static + 0xF8, x - 1000)
    write_float(static + 0xFC, y - 1000)
    write_float(static + 0x100, z - 1000)
end
```

### Override Respawn Time

Writes to the static player table to change the respawn delay.

```lua
---@param player_id number Player index (1-16).
---@param respawn_time number|nil Seconds until respawn. Defaults to 3.
local function setRespawnTime(player_id, respawn_time)
    if not player_present(player_id) then return end

    -- The timer is stored in ticks (30 per second).
    write_dword(get_player(player_id) + 0x2C, (respawn_time or 3) * 30)
end
```

### Get Base Directory

Finds the Halo server folder at runtime, so no hardcoded paths.

```lua
---@param folder string|nil Subfolder to append. Defaults to "".
---@return string base_path
local function getBaseDir(folder)
    folder = folder or ""
    local exe_path = read_string(read_dword(sig_scan('0000BE??????005657C605') + 0x3))
    local base_path = exe_path:match("(.*\\)")
    return base_path .. folder
end

---@return string config_path
local function getProfilePath()
    return read_string(read_dword(sig_scan('68??????008D54245468') + 0x1))
end
```

Examples:

```lua
local base = getBaseDir()
local maps = getBaseDir("maps")
local sapp_cg = getProfilePath()
```

---

## Vehicle and Weapon Functions

### Get Object Tag

Returns the object type byte and the tag name of any object.

```lua
---@param object number Memory address of the object.
---@return number object_type
---@return string tag_name
local function getTagFromObject(object)
    local object_type = read_byte(object + 0xB4)
    local tag_index = read_word(object)
    local tag_array = read_dword(0x40440000)
    local tag_address = tag_index * 32 + tag_array
    local tag_name = read_string(read_dword(tag_address + 0x10))
    return object_type, tag_name
end
```

Example:

```lua
function OnVehicleEnter(player_id)
    local dyn = get_dynamic_player(player_id)
    if dyn == 0 then return end

    local vehicle_id = read_dword(dyn + 0x11C)
    if vehicle_id == 0xFFFFFFFF then return end

    local vehicle_obj = get_object_memory(vehicle_id)
    if vehicle_obj == 0 then return end

    local object_type, tag_name = getTagFromObject(vehicle_obj)
    cprint(object_type .. " " .. tag_name, 11)
end
```

### Has Objective Check

Tests whether a player is holding a flag or oddball.

```lua
local BASE_TAG_TABLE = 0x40440000 -- same for PC and CE

---@param dyn_player number Dynamic player address.
---@param objective_type string|nil "oddball", "flag", or "any". Defaults to "any".
---@return boolean holding True if holding the specified objective.
local function hasObjective(dyn_player, objective_type)
    objective_type = objective_type or "any"

    local weapon_obj = get_object_memory(read_dword(dyn_player + 0x118))
    if not weapon_obj or weapon_obj == 0 then return false end

    local tag_data = read_dword(read_dword(0x40440000) + read_word(weapon_obj) * 0x20 + 0x14)
    if read_bit(tag_data + 0x308, 3) ~= 1 then return false end

    local obj_byte = read_byte(tag_data + 2)
    return (objective_type == "oddball" and obj_byte == 4) or
            (objective_type == "flag" and obj_byte == 0) or
            (objective_type == "any" and (obj_byte == 4 or obj_byte == 0))
end
```

### Get Inventory

Returns a table of all weapon slots (1-4) with detailed stats. Empty slots are omitted. Grenade
counts belong to the player, so they are repeated on every slot entry.

```lua
---@param dyn_player number Dynamic player address.
---@return table inventory Keys are slot numbers (1-4).
local function getInventory(dyn_player)
    local inv = {}
    for slot = 0, 3 do
        local weapon_id = read_dword(dyn_player + 0x2F8 + slot * 4)
        local weapon_obj = get_object_memory(weapon_id)
        if weapon_obj and weapon_obj ~= 0 then
            inv[slot + 1] = {
                id = read_dword(weapon_obj),
                ammo = read_word(weapon_obj + 0x2B6),
                clip = read_word(weapon_obj + 0x2B8),
                ammo2 = read_word(weapon_obj + 0x2C6),
                clip2 = read_word(weapon_obj + 0x2C8),
                heat = read_float(weapon_obj + 0x240),
                frags = read_byte(dyn_player + 0x31E),
                plasmas = read_byte(dyn_player + 0x31F)
            }
        end
    end
    return inv
end
```

### Get Weapon Slot

Returns the player's current weapon slot index (0-3).

```lua
---@param dyn_player number Dynamic player address.
---@return number slot
local function getWeaponSlot(dyn_player)
    return read_byte(dyn_player + 0x2F2)
end
```

### Low Ammo Warning

Checks the loaded magazine against a threshold. Offset `0x2B8` is rounds in the magazine; `0x2B6`
is reserve ammo.

```lua
local function isLowAmmo(dyn_player, threshold)
    local weapon_id = read_dword(dyn_player + 0x118)
    if weapon_id == 0 then return false end
    local weapon_obj = get_object_memory(weapon_id)
    if weapon_obj == 0 then return false end
    return read_word(weapon_obj + 0x2B8) <= threshold
end
```

---

## Tag and Map Helpers

The tag table layout is documented under [Tag Table](cheat-sheet.md#tag-table) (SAPP Cheat Sheet).

```lua
--- Converts a four-letter tag class (e.g. "weap") to the dword stored in the tag table.
---@param class string Four-letter tag class.
---@return number class_dword
local function classToDword(class)
    local a, b, c, d = class:byte(1, 4)
    return a * 0x1000000 + b * 0x10000 + c * 0x100 + d
end
```

### Find Tag

Scans the tag table for a tag whose name contains a substring (case-insensitive). Optionally filter
by class.

```lua
---@param substring string Text to search for.
---@param class_filter string|nil Optional class filter, e.g. "weap" or "vehi".
---@return number|nil meta_index Meta index of the first match.
local function findTagBySubstring(substring, class_filter)
    substring = substring:lower()
    local tag_array = read_dword(BASE_TAG_TABLE)
    local tag_count = read_dword(BASE_TAG_TABLE + 0xC)
    local filter_class = class_filter and classToDword(class_filter) or nil

    for i = 0, tag_count - 1 do
        local tag = tag_array + 0x20 * i
        if filter_class and read_dword(tag) ~= filter_class then goto continue end

        local name_ptr = read_dword(tag + 0x10)
        if name_ptr and name_ptr ~= 0 then
            local name = read_string(name_ptr)
            if name and name:lower():find(substring, 1, true) then
                return read_dword(tag + 0xC)
            end
        end
        ::continue::
    end
    return nil
end
```

Example:

```lua
local rocket_meta = findTagBySubstring("rocket", "weap")
if rocket_meta then
    spawn_object("", "", 100, 100, 100, 0, rocket_meta)
end
```

### Get Flag Data

Finds the flag (objective) tag on the current map. Returns its meta id and tag name, or `nil` if
there is no flag.

```lua
---@return number|nil meta_id
---@return string|nil tag_name
local function getFlagData()
    local tag_array = read_dword(BASE_TAG_TABLE)
    local tag_count = read_dword(BASE_TAG_TABLE + 0xC)
    for i = 0, tag_count - 1 do
        local tag = tag_array + 0x20 * i
        if read_dword(tag) == 0x77656170 then -- weap
            local tag_data = read_dword(tag + 0x14)
            if read_bit(tag_data + 0x308, 3) == 1 and read_byte(tag_data + 2) == 0 then
                local meta = read_dword(tag + 0xC)
                local name = read_string(read_dword(tag + 0x10))
                return meta, name
            end
        end
    end
    return nil, nil
end
```

### Get Tag ID

Wrapper around `lookup_tag` that returns the tag ID (meta id) you pass to `spawn_object` and similar
functions. `lookup_tag` returns `0` when the tag does not exist.

```lua
---@param class string Tag class, e.g. "weap".
---@param name string Tag path, e.g. "weapons\\pistol\\pistol".
---@return number|nil tag_id
local function getTagId(class, name)
    local tag = lookup_tag(class, name)
    return tag ~= 0 and read_dword(tag + 0xC) or nil
end
```

### Scan Map Objects

Prints tag information for every weapon, vehicle, and equipment tag on the map. Handy during
development. It will not work on protected maps or some custom maps.

```lua
local function scanMapObjects()
    local tag_array = read_dword(BASE_TAG_TABLE)
    local tag_count = read_dword(BASE_TAG_TABLE + 0xC)
    local class_names = { [0x76656869] = "vehi", [0x77656170] = "weap", [0x65716970] = "eqip" }

    for i = 0, tag_count - 1 do
        local tag = tag_array + 0x20 * i
        local class_name = class_names[read_dword(tag)]
        if class_name then
            local name_ptr = read_dword(tag + 0x10)
            local name = name_ptr ~= 0 and read_string(name_ptr) or "<no-name>"
            local meta = read_dword(tag + 0xC)
            cprint(string.format("%s meta=%u name=%s", class_name, meta, name), 12)
        end
    end
end
```

---

## Distance Helpers

Unit conversions (ticks, world units, meters) are documented in
[Timing and Units](cheat-sheet.md#timing-and-units) (SAPP Cheat Sheet).

```lua
local WU_TO_M = 3.048

--- Returns the 3D distance between two points in world units.
---@return number distance
local function distance3d(x1, y1, z1, x2, y2, z2)
    local dx = x2 - x1
    local dy = y2 - y1
    local dz = z2 - z1
    return math.sqrt(dx * dx + dy * dy + dz * dz)
end

--- Returns the distance in meters between a point and a target table.
---@param x number
---@param y number
---@param z number
---@param target table {x, y, z} in world units.
---@return number distance_m
local function distanceMeters(x, y, z, target)
    local wu = distance3d(x, y, z, target[1], target[2], target[3])
    return wu * WU_TO_M
end
```

Example:

```lua
local px, py, pz = read_vector3d(dynamic_player + 0x5C)
local loc = { 0, 0, 0 }
local distance_wu = distance3d(px, py, pz, loc[1], loc[2], loc[3])
local distance_m = distanceMeters(px, py, pz, loc)
```

---

## IP and Network Helpers

SAPP uses `bit`, not `bit32`. These helpers validate IPv4 strings, convert between dotted and
integer forms, convert wildcard notation to CIDR, and match an IP against CIDR, wildcard, or range
definitions.

```lua
local bit = require("bit")

-- validateIpv4("192.168.*.*") -> "192.168.*.*"
-- validateIpv4("10.0.0.1-10.0.0.255") -> "10.0.0.1-10.0.0.255"
local function validateIpv4(ip)
    if not ip then return false end
    ip = string.gsub(string.gsub(ip, "[%s]*", ""), "x+", "*")
    local a, b, c, slash, d, finish = ip:match("^([^%.]+)%.([^%.]*)%.?([^%./]*)%.?(/?)([^%.]*)()")
    a = a == "" and "*" or a:match("[%d%*]+")
    b = b == "" and "*" or b:match("[%d%*]+")
    c = c == "" and "*" or c:match("[%d%*]+")
    slash = slash ~= ""
    d = d or ""
    if slash then
        if d:find("/") or not d:match("[%d%*]+") then return false end
        d = "0/" .. d
    else
        d = d == "" and "*" or d:match("[%d%*/]+")
    end

    if not a or not b or not c then return false end

    local found, a2, b2, c2, d2 = ip:match("(%-)(%d+)%.(%d*)%.?(%d*)%.?(%d*)%c*$", finish)
    if not found then
        if a2 and a ~= "" then return false end
        return string.format("%s.%s.%s.%s", a, b, c, d)
    elseif slash then
        return false
    end
    a2 = a2 == "" and "*" or a2:match("[%d%*]+")
    b2 = b2 == "" and "*" or b2:match("[%d%*]+")
    c2 = c2 == "" and "*" or c2:match("[%d%*]+")
    d2 = d2 == "" and "*" or d2:match("[%d%*]+")

    if not a2 or not b2 or not c2 then return false end
    if c2:find("/") and d2:find("/") then return false end
    return string.format("%s.%s.%s.%s-%s.%s.%s.%s", a, b, c, d, a2, b2, c2, d2)
end

-- Returns an unsigned 32-bit value, or nil if the address is invalid.
local function ipToLong(ip_addr)
    local a, b, c, d = ip_addr:match("^(%d+)%.(%d+)%.(%d+)%.(%d+)$")
    if not a then return nil end
    a, b, c, d = tonumber(a), tonumber(b), tonumber(c), tonumber(d)
    if not (a and b and c and d) then return nil end
    return bit.bor(bit.lshift(a, 24), bit.lshift(b, 16), bit.lshift(c, 8), d) % 0x100000000
end

local function longToIp(addr)
    local a = bit.rshift(bit.band(addr, 0xFF000000), 24)
    local b = bit.rshift(bit.band(addr, 0x00FF0000), 16)
    local c = bit.rshift(bit.band(addr, 0x0000FF00), 8)
    local d = bit.band(addr, 0x000000FF)
    return string.format("%i.%i.%i.%i", a, b, c, d)
end

-- wildcardToCidr("10.*.*.*") -> "10.0.0.0/8"
local function wildcardToCidr(addr)
    local count = select(2, addr:gsub("%*", "*"))
    if count == 1 then
        return addr:gsub("%*", "0") .. "/24"
    elseif count == 2 then
        return addr:gsub("%*", "0") .. "/16"
    elseif count == 3 then
        return addr:gsub("%*", "0") .. "/8"
    elseif count > 3 then
        return "0.0.0.0/0"
    end
    return addr
end

-- ipMatchesNetwork("192.168.1.0/24", "192.168.1.100") -> true
local function ipMatchesNetwork(network, ip)
    network = validateIpv4(network)
    if not ip then return false end
    ip = validateIpv4(ip)
    if not network or not ip then return false end

    -- Normalize wildcard to CIDR
    if network:find("%*") then network = wildcardToCidr(network) end
    if ip:find("%*") then ip = wildcardToCidr(ip) end

    local dash = network:find("-")
    if not dash then
        local net_part, mask_len = network:match("^(.-)/(%d+)$")
        mask_len = tonumber(mask_len) or 32
        local net_long = ipToLong(net_part)
        if not net_long then return false end
        local ip_part, ip_mask_len = ip:match("^(.-)/(%d+)$")
        ip_mask_len = tonumber(ip_mask_len) or 32
        local ip_long = ipToLong(ip_part)
        if not ip_long then return false end
        local mask = bit.lshift(0xFFFFFFFF, (32 - mask_len))
        local ip_mask = bit.lshift(0xFFFFFFFF, (32 - ip_mask_len))
        return bit.band(net_long, mask, ip_mask) == bit.band(ip_long, mask, ip_mask)
    else
        local from = ipToLong(network:sub(1, dash - 1))
        local to = ipToLong(network:sub(dash + 1))
        if not from or not to then return false end
        local ip_long = ipToLong(ip)
        if not ip_long then return false end
        return ip_long >= from and ip_long <= to
    end
end
```

---

## Assigning Weapons

Note: Assigning 3 or more weapons at once makes the third and fourth drop on the ground. Delay them
by at least 250 ms. `assign_weapon` silently fails if the player is dead.

```lua
function AssignWeapon(weapon_id, player_id) -- used in both examples below
    if weapon_id then assign_weapon(weapon_id, player_id) end
end
```

```lua
execute_command("wdel " .. player_id) -- clear their inventory first (for both examples)

-- Example 1 (simple):
AssignWeapon(spawn_object(...), player_id) -- x2 (receive now)
timer(250, "AssignWeapon", spawn_object(...), player_id) -- x2 (receive 250ms later)

-- Example 2 (advanced assignment logic):
local WEAPONS = {
	["pistol"] = {
		tag_name = "weapons\\pistol\\pistol",
		attributes = { clip = 12, ammo = 100, frags = 1, plasmas = 1 }
	},
	--...
}

local weapon_datums = {}
local function cacheWeaponDatums() -- during EVENT_GAME_START. Clear `weapon_datums` every start.
    for name, data in pairs(WEAPONS) do
		local tag_id = getTagId("weap", data.tag_name)
		if tag_id then
			weapon_datums[name] = { tag_id = tag_id, attributes = data.attributes }
		end
    end
end

local function setGrenades(dyn_player, frags, plasmas)
    write_byte(dyn_player + 0x31E, frags)
    write_byte(dyn_player + 0x31F, plasmas)
end

local function spawnWeapon(player_id, weapon_name, slot)
    local dyn = get_dynamic_player(player_id)
    if dyn == 0 then return end
    
    local tag_datum = weapon_datums[weapon_name]
    if not tag_datum then return end

    local tag_id = tag_datum.tag_id
    local attributes = tag_datum.attributes

    local weapon = spawn_object("", "", 0, 0, 0, 0, tag_id)
    if weapon == 0 then return end

    local weapon_mem = get_object_memory(weapon)
    if weapon_mem == 0 then return end

    write_word(weapon_mem + 0x2B6, attributes.ammo) -- primary
    write_word(weapon_mem + 0x2B8, attributes.clip) -- secondary
    sync_ammo(weapon) -- sync before assigning

    if slot <= 2 then
        AssignWeapon(weapon, player_id)
    else
        timer(250, 'AssignWeapon', weapon, player_id)
    end

    -- Set last
    setGrenades(dyn, attributes.frags, attributes.plasmas)
end
```

---

## Platform-Independent Helpers

Copy them into scripts as needed.

### Table Utilities

```lua
-- deepCopy({a = 1, b = {c = 2}}) -> fully independent copy
-- Warning: does not handle circular references
local function deepCopy(original)
    if type(original) ~= "table" then return original end
    local copy = {}
    for k, v in pairs(original) do copy[deepCopy(k)] = deepCopy(v) end
    return setmetatable(copy, deepCopy(getmetatable(original)))
end

-- shuffleArray({10, 20, 30, 40}) -> shuffles in place (Fisher-Yates)
-- Call math.randomseed(os.time()) once at script load.
local function shuffleArray(array)
    for i = #array, 2, -1 do
        local j = math.random(i)
        array[i], array[j] = array[j], array[i]
    end
end

-- tableLength({10, 20, name = "Chalwk", 30}) -> 4
local function tableLength(t)
    local count = 0
    for _ in pairs(t) do count = count + 1 end
    return count
end
```

### String Utilities

```lua
-- parseArgs("/give weapon sniper", " ") -> {"/give", "weapon", "sniper"}
-- The delimiter goes into a Lua pattern, so escape special characters (e.g. "%.").
local function parseArgs(input, delimiter)
    local t = {}
    for substring in input:gmatch("([^" .. delimiter .. "]+)") do t[#t + 1] = substring end
    return t
end

-- isChatCommand("/kick") -> true; isChatCommand("hello") -> false
local function isChatCommand(str)
    if not str then return false end
    local first = string.sub(str, 1, 1)
    return first == "/" or first == "\\"
end

-- stripPrefix("//give") -> "give"
local function stripPrefix(message)
    if not message then return "" end
    return (string.gsub(message, "^[\\/]+", ""))
end

-- splitString("a,b;c", ",", ";") -> {"a", "b", "c"}
-- Longer delimiters take precedence.
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

    -- Strip all delimiter characters from each token (legacy behavior)
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
local function tokenizeCmdString(str)
    local tokens = {}
    str = str:gsub("^%s*(.-)%s*$", "%1") .. " " -- trim and add sentinel
    local pos = 1
    while pos <= #str do
        local token, newPos
        -- try double-quoted string
        token, newPos = str:match('^"([^"]*)"%s+()', pos)
        if not token then
            token, newPos = str:match('^([^%s]+)%s+()', pos)
        end
        if not token then break end
        tokens[#tokens + 1] = token
        pos = newPos
    end
    return tokens
end

-- findChar("hello world", "l") -> 3, 4, 10
local function findChar(str, character)
    local indices = {}
    for i = 1, #str do
        if string.sub(str, i, i) == character then
            indices[#indices + 1] = i
        end
    end
    return unpack(indices) -- do not use table.unpack
end

-- wildcardMatch("hello", "he?lo") -> true
-- wildcardMatch("test123", "test*") -> true
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

-- Reads a UTF-16LE string. Stops at the first null code unit.
local function readWideString(address, max_chars)
    local chars = {}
    for i = 0, (max_chars - 1) * 2, 2 do
        local lo = read_byte(address + i)
        if lo == 0 then break end
        chars[#chars + 1] = string.char(lo)
    end
    return table.concat(chars)
end
```

Many Halo strings are UTF-16LE: player name (`get_player(id) + 0x4`), server name
(`network_struct + 0x8`), gametype name (`network_struct + 0x10C`), and map display name
(`map_name_address`). `read_string` returns `""` for these fields; use `readWideString` instead.
The narrow (8-bit) form is used only for filenames and paths (e.g. `map_name_address2`,
`server_path_address`).

### Message Formatting

Three approaches. Pick the one that fits:

```lua
-- V1: string.format wrapper
-- formatMessage("Player %s joined.", "Chalwk") -> "Player Chalwk joined."
local function formatMessage(message, ...)
    return select('#', ...) > 0 and message:format(...) or message
end

-- V2: $placeholder substitution
-- formatMessageVars("Hello $name", {name = "Chalwk"}) -> "Hello Chalwk"
local function formatMessageVars(message, vars)
    return (message:gsub("%$(%w+)", function(key)
        return vars[key] or "$" .. key
    end))
end

-- V3: case-insensitive placeholders with fallback
-- formatTemplate("Welcome $NAME", {name = "Chalwk"}) -> "Welcome Chalwk"
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
local function inSphere(px, py, pz, ox, oy, oz, radius)
    local dx, dy, dz = ox - px, oy - py, oz - pz
    return (dx * dx + dy * dy + dz * dz) <= radius * radius
end

local function checkInCircle(px, py, cx, cy, radius)
    return (px - cx) ^ 2 + (py - cy) ^ 2 <= radius ^ 2
end

-- Needs the math.atan2 guard below.
local function directionToCardinal(forward_x, forward_y)
    local angle = (90 - math.deg(math.atan2(forward_y, forward_x))) % 360
    local dirs = { "N", "NE", "E", "SE", "S", "SW", "W", "NW" }
    local idx = math.floor((angle + 22.5) / 45) % 8 + 1
    return dirs[idx]
end

local function round(value, decimals)
    local factor = 10 ^ (decimals or 0)
    return math.floor(value * factor + 0.5) / factor
end

local function toDecimal(hex_string) return tonumber(hex_string, 16) end
```

#### math.atan2 Guard

SAPP's LuaJIT environment has no `math.atan2`. Define this once at the top of any script that needs
it, or that uses a helper that calls it such as `directionToCardinal`:

```lua
if not math.atan2 then
    local pi = math.pi
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

---

## LuaJIT and FFI

- Lua 5.1 compatible, plus LuaJIT extensions: `goto`, `bit`, `table.new`, `table.clear`.
- `_ENV` is not supported. Use `setfenv` and `getfenv` for environments.
- `ffi` gives you C interop and raw memory access.
- The JIT speeds up math-heavy and iterative code.
- Scripts are sandboxed, so some OS APIs may be blocked. Unsafe memory access can crash the server.

### Check for FFI

```lua
function OnScriptLoad()
    if pcall(function() require("ffi") end) then
        cprint("ffi is available")
    else
        cprint("ffi is NOT available")
    end
end
```

`pcall` keeps the script from erroring out if `ffi` is blocked.

### FFI Demo

Calls `GetTickCount` from the Windows API to get the milliseconds since system boot.

```lua
api_version = '1.12.0.0'

local ffi = require("ffi")

ffi.cdef[[
    unsigned long GetTickCount(void);
]]

local tick_count = 0

function OnScriptLoad()
    cprint(string.format("Ticks since boot: %d", ffi.C.GetTickCount()), 10)
    register_callback(cb.EVENT_TICK, "OnTick")
end

function OnTick()
    tick_count = tick_count + 1
    if tick_count % 300 == 0 then -- every 10 seconds
        cprint(string.format("Ticks since boot: %d", ffi.C.GetTickCount()), 10)
    end
end
```

### table.new

`table.new(narray, nhash)` pre-allocates a table with `narray` array slots and `nhash` hash slots,
so it does not resize while you fill it.

```lua
local table_new = require("table.new")
local my_table = table_new(10, 5)

my_table[1] = "a"
my_table[2] = "b"
my_table.name = "LuaJIT"
my_table.version = "2.1"

for i = 1, #my_table do
    cprint("Index " .. i .. ": " .. tostring(my_table[i]))
end

for key, value in pairs(my_table) do
    if type(key) ~= "number" then
        cprint("Key '" .. key .. "': " .. tostring(value))
    end
end
```

### table.clear

`table.clear(tab)` empties a table but keeps the allocated memory for reuse.

```lua
local table_clear = require("table.clear")
local scores = { player1 = 5, player2 = 3, player3 = 8 }
cprint("Has entries before clear: " .. tostring(next(scores) ~= nil))

table_clear(scores)

cprint("Has entries after clear: " .. tostring(next(scores) ~= nil))
```

### Environments

`setfenv` swaps the globals a function sees. Useful for restricting what a chunk can touch.

```lua
local sandbox_env = { cprint = cprint, math = math }

---@param fn function Function to run inside the sandbox.
---@return boolean success
---@return any result_or_error
local function runInSandbox(fn)
    setfenv(fn, sandbox_env)
    return pcall(fn)
end

runInSandbox(function() cprint("Hello from sandbox") end)
runInSandbox(function() return os.time() end) -- fails: `os` is nil in the sandbox
```

### bit Library

SAPP Lua does not support `require("bit32")` (use `require("bit")`), the native bitwise operators
(`& | ~ << >>`), or integer division (`//`). Use `bit.band`, `bit.bor`, `bit.bxor`, `bit.bnot`,
`bit.lshift`, `bit.rshift`, and `math.floor(a / b)` instead.

```lua
local bit = require("bit")

local flags = 0

flags = bit.bor(flags, 4, 32)

if bit.band(flags, 4) ~= 0 then
    cprint("Bit 2 is set")
end

flags = bit.band(flags, bit.bnot(32))

local shifted = bit.lshift(1, 3)
cprint("1 << 3 = " .. shifted)

local original = bit.rshift(8, 3)
cprint("8 >> 3 = " .. original)

local high = 0xABCD
local low = 0x1234
local packed = bit.bor(bit.lshift(high, 16), low)
cprint(string.format("Packed: 0x%08X", packed))

local high_unpacked = bit.rshift(packed, 16)
local low_unpacked = bit.band(packed, 0xFFFF)
cprint(string.format("Unpacked: 0x%04X, 0x%04X", high_unpacked, low_unpacked))
```

These pair well with SAPP events: pre-allocate tables with `table.new`, clear them between maps with
`table.clear`, track player states with bit flags, and run admin command handlers in a `setfenv`
sandbox.

---

## Known SAPP Quirks

### rand () Upper Bound

`rand(min, max)` excludes the upper bound, so `rand(1, 4)` returns 1-3 and never 4. To include the
last index when picking from a table, add `1`: `local i = rand(1, #t + 1)`.

### execute_command_sequence () Quoting

For chained commands (e.g. `say_all`), use single-quoted Lua strings, double-quoted arguments, and
semicolons as separators:

- `execute_command_sequence('say_all "Hello world";god 1')`
- `execute_command_sequence("camo 1;god 1")`

### $pn Is Stale During EVENT_LEAVE

During `EVENT_LEAVE`, `get_var(0, "$pn")` has not updated yet. Subtract `1` to get the right player
count: `tonumber(get_var(0, "$pn")) - 1`.

### math.atan2 Is Missing

Define the guard from Math and Geometry before using it, or before using any helper that calls it
such as `directionToCardinal`.

### Vehicle Physics Fix

Writing a vehicle's position with `write_vector3d()` can cause glitchy physics. This reduces the
teleport glitches but does not remove them completely.

```lua
-- Set the vehicle's position as usual:
write_vector3d(object + 0x5C, x, y, z)

-- Apply the fix:
write_float(object + 0x70, -0.025)      -- tiny downward velocity
write_bit(object + 0x10, 0, 0)          -- unset no-collision
write_bit(object + 0x10, 5, 0)          -- unset ignore-physics
```