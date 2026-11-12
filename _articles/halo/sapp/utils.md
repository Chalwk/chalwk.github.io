---
title: "SAPP Utils"
permalink: /halo/sapp/utils/
description: "Conventions, helper functions, signature scanning patterns, and known quirks for SAPP server-side Lua scripting."
date: 2026-11-09
last-updated: 2026-11-09
categories: [ education, halo, modding ]
tags: [ sapp, lua, scripting, server, tutorial ]
---

Helpers, notes, and gotchas for SAPP Lua scripting. Lookup tables (pointers, signatures, variables,
commands) are documented in [SAPP Cheat Sheet](cheat-sheet.md). Offsets, unit conversions, and the
helpers shared with Chimera are in [Common Reference](../common-reference.md).

---

## Conventions

Naming conventions are shared with Chimera. See [Conventions](../common-reference.md#conventions).

### Ternary Emulation

SAPP picks PC or CE values with `halo_type`. The `and` / `or` rules are in
[Ternary Emulation](../common-reference.md#ternary-emulation).

```lua
local var1, var2 = halo_type == 'PC' and 1 or 2, halo_type == 'PC' and 3 or 4
```

When several values change together, index a lookup table instead of repeating the condition:

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

> [!IMPORTANT]
> SAPP API functions use 1-16 player indices, whereas internal Halo memory tables and arrays are
> 0-15. Always convert indices using `to_real_index()` when accessing zero-based memory arrays.

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

> [!WARNING]
> Calling `read_dword()` on an unguarded `sig_scan()` result will crash the server if the signature
> returns `0`. Always validate that `sig_scan` matches successfully before dereferencing pointers.

- `halo_type` is a case-sensitive string: `"PC"` or `"CE"`. Use it only as a fallback when no
  reliable signature exists.
- Pre-computed signatures: [Signature Reference](cheat-sheet.md#signature-reference).
- Hardcoded PC/CE pointer table: [Hardcoded Pointers](cheat-sheet.md#hardcoded-pointers).

Some CE patterns do not match on PC because the compilers emitted different instruction shapes for
the same code. The `gametype_base` sig is one example. Always use the version-fallback form below
rather than returning early on sig failure.

```lua
-- Returns the pointer at sig_scan(sig) + offset, or nil if invalid.
-- Guards against sig_scan returning 0 and against read_dword returning
-- something outside Halo's data range (0x400000-0x800000).
---@param sig string Signature byte pattern to scan for.
---@param offset number Offset from the signature match to the pointer.
---@return number|nil ptr Resolved pointer, or nil if invalid.
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

-- Returns the current server's name (UTF-16LE).
---@return string|nil server_name Server name, or nil if the network struct pointer is unavailable.
local function getServerName()
    if not network_struct_address then return nil end
    return readWideString(network_struct_address + 0x8, 0x42)
end

-- Returns the current gametype's score limit.
---@return number|nil score_limit Score limit, or nil if the gametype pointer is unavailable.
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

- `readWideString` is defined under [Wide Strings](../common-reference.md#wide-strings).

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
---@param player_id number Player index (1-16).
function OnJoin(player_id)
    timer(3000, "Welcome", player_id)
end

---@param player_id number Player index (1-16).
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

Returns the player's eye-level position, accounting for vehicles and crouching. `read_vector3d` is
SAPP only; Chimera reads three floats
(see [Position and Aim](../common-reference.md#position-and-aim)).

```lua
---@param dyn_player number Dynamic player address.
---@return number|nil x, number|nil y, number|nil z Player X, Y, and eye-level Z coordinates, or nil if the object is invalid.
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

### Shared Helpers

These work on a pointer and are the same on SAPP and Chimera, so they live in the
[Common Reference](../common-reference.md#offset-helpers):

- `inVehicle`, `getWeaponSlot`,
  `isLowAmmo`: [Vehicle and Weapon](../common-reference.md#vehicle-and-weapon)
- `getAimVector`: [Position and Aim](../common-reference.md#position-and-aim)
- `getHealthAndShields`, `getHealthPercent`,
  `getShieldsPercent`: [Health and Shields](../common-reference.md#health-and-shields)
- `getSpeed`: [Speed](../common-reference.md#speed)
- `getTeamName`, `getKdRatio`,
  `getColorName`: [Static Player Fields](../common-reference.md#static-player-fields)
- `readPlayerName`: [Wide Strings](../common-reference.md#wide-strings)

For names and teams, prefer `get_var(player_id, "$name")` and `get_var(player_id, "$team")`.

### Get Player Ping

```lua
---@param player_id number Player index (1-16).
---@return number|nil ping Player ping in milliseconds, or nil if unavailable.
local function getPlayerPing(player_id)
    local static = get_player(player_id)
    return static and read_dword(static + 0xDC) or nil
end
```

### Set Player Color

A respawn is usually required for the change to fully apply. Color values are listed under
[Team and Color](../common-reference.md#team-and-color).

```lua
---@param player_id number Player index (1-16).
---@param color number Color index (0-17).
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

Finds the Halo server folder at runtime.

```lua
-- Resolves the pointer at sig_scan(sig) + offset, or returns nil if the scan
-- missed or the dereferenced value is outside Halo's data range.
---@param sig string Signature byte pattern to scan for.
---@param offset number Offset from the signature match to the pointer.
---@return number|nil ptr Resolved pointer, or nil if invalid.
local function resolvePointer(sig, offset)
    local hit = sig_scan(sig)
    if hit == 0 then return nil end

    local ptr = read_dword(hit + offset)
    if not ptr or ptr < 0x400000 or ptr > 0x800000 then return nil end

    return ptr
end

---@param folder string|nil Subfolder to append. Defaults to "".
---@return string|nil base_path Halo server directory path (with optional subfolder), or nil if the lookup failed.
local function getBaseDir(folder)
    folder = folder or ""

    local exe_path_ptr = resolvePointer("0000BE??????005657C605", 0x3)
    if not exe_path_ptr then return nil end

    local exe_path = read_string(exe_path_ptr)
    if not exe_path or exe_path == "" then return nil end

    local base_path = exe_path:match("(.*\\)")
    if not base_path then return nil end

    return base_path .. folder
end

---@return string|nil config_path Path to the SAPP configuration file, or nil if the lookup failed.
local function getProfilePath()
    local ptr = resolvePointer("68??????008D54245468", 0x1)
    if not ptr then return nil end
    return read_string(ptr)
end
```

Both functions can return `nil`, so check before concatenating:

```lua
local base = getBaseDir()
local maps = getBaseDir("maps")
local sapp_cg = getProfilePath()

if base then cprint("Server dir: " .. base) end
if maps then cprint("Maps dir: " .. maps) end
if sapp_cg then cprint("SAPP cfg: " .. sapp_cg) end
```

Or fall back to a relative path in one expression:

```lua
local maps = getBaseDir("maps") or "maps\\"
```

---

## Vehicle and Weapon Functions

### Get Object Tag

Returns the object type byte and the tag name of any object.

```lua
---@param object number Memory address of the object.
---@return number object_type, string tag_name Object type identifier (byte at offset 0xB4) and full tag path.
local function getTagFromObject(object)
    local object_type = read_byte(object + 0xB4)
    local tag_index = read_word(object)
    local tag_array = read_dword(0x40440000)
    local tag_address = tag_index * 0x20 + tag_array
    local tag_name = read_string(read_dword(tag_address + 0x10))
    return object_type, tag_name
end
```

Example:

```lua
---@param player_id number Player index (1-16).
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

    local weapon_id = read_dword(dyn_player + 0x118)
    local weapon_obj = get_object_memory(weapon_id)
    if not weapon_obj or weapon_obj == 0 then return false end

    local tag_array = read_dword(BASE_TAG_TABLE)
    local tag_index = read_word(weapon_obj)
    local tag_entry = tag_array + tag_index * 0x20
    local tag_data = read_dword(tag_entry + 0x14)

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
---@class WeaponInventoryEntry
---@field id number Weapon tag ID.
---@field ammo number Primary reserve ammunition.
---@field clip number Primary magazine ammunition.
---@field ammo2 number Secondary reserve ammunition.
---@field clip2 number Secondary magazine ammunition.
---@field heat number Weapon overheat value (0-1).
---@field frags number Player frag grenade count.
---@field plasmas number Player plasma grenade count.

---@param dyn_player number Dynamic player address.
---@return table<number, WeaponInventoryEntry> inventory Weapon inventory indexed by slot (1-4).
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

## Tag and Map Helpers

The tag table base is documented under [Tag Table](cheat-sheet.md#tag-table) (SAPP Cheat Sheet) and
the entry layout under [Tag Entry](../common-reference.md#tag-entry).

`classToDword` is defined under [Tag Entry Helpers](../common-reference.md#tag-entry-helpers).

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
---@return number|nil meta_id, string|nil tag_name Flag weapon tag meta ID and path, or nil if no flag exists.
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
---@return number|nil tag_id Tag meta ID, or nil if the tag does not exist.
local function getTagId(class, name)
    local tag = lookup_tag(class, name)
    if tag == 0 then return nil end
    local meta_id = read_dword(tag + 0xC)
    return meta_id ~= 0 and meta_id or nil
end
```

### Scan Map Objects

Prints tag information for every weapon, vehicle, and equipment tag on the map. Handy during
development. It will not work on protected maps or some custom maps.

```lua
local function scanMapObjects()
    -- Read the tag table base address and total number of entries.
    local tag_array = read_dword(BASE_TAG_TABLE)
    local tag_count = read_dword(BASE_TAG_TABLE + 0xC)

    -- Map-specific tag class dwords to their four-letter identifiers.
    local class_names = {
        [0x76656869] = "vehi",
        [0x77656170] = "weap",
        [0x65716970] = "eqip"
    }

    -- Iterate through every tag entry (each entry is 0x20 bytes).
    for i = 0, tag_count - 1 do
        local tag = tag_array + 0x20 * i

        -- Identify the tag class and skip anything other than vehicles, weapons, and equipment.
        local class_name = class_names[read_dword(tag)]
        if class_name then
            -- Resolve the tag name through its string pointer at offset 0x10.
            local name_ptr = read_dword(tag + 0x10)
            local name = name_ptr ~= 0 and read_string(name_ptr) or "<no-name>"

            -- Read the tag's metadata ID from offset 0xC.
            local meta = read_dword(tag + 0xC)

            -- Print the tag class, metadata ID, and name to the server console.
            cprint(string.format("%s meta=%u name=%s", class_name, meta, name), 12)
        end
    end
end
```

---

## Distance Helpers

`distance3d` and `distanceMeters` are shared with Chimera.
See [Distance](../common-reference.md#distance).
Unit conversions are under [Timing and Units](../common-reference.md#timing-and-units).

On SAPP, read the position with `read_vector3d`:

```lua
local px, py, pz = read_vector3d(dynamic_player + 0x5C)
local distance_m = distanceMeters(px, py, pz, { 0, 0, 0 })
```

---

## Raycasting with intersect

The `intersect()` function casts a 3D ray from an origin coordinate `(x, y, z)` along a direction
vector `(vx, vy, vz)`. It tests for collisions against map geometry (terrain, structures, BSP) and
dynamic objects (bipeds, vehicles, weapons, equipment, devices).

```lua
local success, hit_x, hit_y, hit_z, hit_object_id = intersect(x, y, z, vx, vy, vz, ignore_object_id)
```

### Parameters

- **`x, y, z`** (`number`): Starting 3D coordinates of the raycast in World Units (WU). To raycast
  from a player's line of sight, use their eye-level position (`read_vector3d(dyn + 0x5C)` with
  vertical offset `+0.65` when standing or `+0.35` when crouching).
- **`vx, vy, vz`** (`number`): Direction vector multiplied by maximum reach distance in WU. Camera
  vectors read from `dyn + 0x230` are normalized unit vectors (length 1), so multiplying by `1000`
  casts a ray up to 1000 WU away.
- **`ignore_object_id`** (`number`, optional): Object ID to ignore during collision testing. Pass
  the casting player's biped Object ID (`read_dword(get_player(player_id) + 0x34)`) so the ray does
  not hit the player's own body.

### Return Values

- **`success`** (`boolean`): `true` if the ray intersected any surface or dynamic object before
  reaching the maximum vector distance; `false` if no collision occurred.
- **`hit_x, hit_y, hit_z`** (`number`): 3D World Unit coordinates of the intersection point.
- **`hit_object_id`** (`number`): Object ID of the dynamic object hit. Returns `0xFFFFFFFF`
  (`4294967295`) if static map geometry (BSP/structure) or nothing was hit.

> [!TIP]
> Use `get_object_memory(hit_object_id)` to verify whether a valid dynamic object was hit. If
> non-zero, read byte `object + 0xB4` to check its object type (`1` = Vehicle, `4` = Equipment,
`5` = Weapon, `6` = Device).

### Example: Aim Target Raycasting

```lua
---@param player_id number SAPP player index (1-16).
---@param max_distance number Maximum raycast distance in World Units.
---@return number|nil hit_object_id Object ID of the targeted dynamic object, or nil if none hit.
local function getTargetObject(player_id, max_distance)
    local dyn = get_dynamic_player(player_id)
    if dyn == 0 or not player_alive(player_id) then return nil end

    -- Eye position (accounting for crouching)
    local crouching = read_float(dyn + 0x50C)
    local px, py, pz = read_vector3d(dyn + 0x5C)
    pz = pz + (crouching == 0 and 0.65 or 0.35)

    -- Aim vector scaled by max reach distance
    local cx, cy, cz = read_vector3d(dyn + 0x230)
    cx, cy, cz = cx * max_distance, cy * max_distance, cz * max_distance

    -- Ignore casting player's biped
    local ignore_biped = read_dword(get_player(player_id) + 0x34)

    local success, hit_x, hit_y, hit_z, hit_object_id = intersect(px, py, pz, cx, cy, cz, ignore_biped)
    if success and hit_object_id ~= 0xFFFFFFFF then
        local object = get_object_memory(hit_object_id)
        if object ~= 0 then
            return hit_object_id
        end
    end
    return nil
end
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
---@param ip string|nil IPv4 address, wildcard, CIDR, or range string.
---@return string|boolean normalized_ip Normalized IPv4 expression, or false if rejected.
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
---@param ip_addr string Dotted-decimal IPv4 address.
---@return number|nil address Unsigned 32-bit integer, or nil if the input cannot be parsed.
local function ipToLong(ip_addr)
    local a, b, c, d = ip_addr:match("^(%d+)%.(%d+)%.(%d+)%.(%d+)$")
    if not a then return nil end

    a, b, c, d = tonumber(a), tonumber(b), tonumber(c), tonumber(d)
    if not (a and b and c and d) then return nil end

    return bit.bor(bit.lshift(a, 24), bit.lshift(b, 16), bit.lshift(c, 8), d) % 0x100000000
end

-- Converts an unsigned 32-bit IPv4 value to dotted-decimal notation.
---@param addr number Unsigned 32-bit IPv4 address.
---@return string ip_addr Dotted-decimal IPv4 address.
local function longToIp(addr)
    local a = bit.rshift(bit.band(addr, 0xFF000000), 24)
    local b = bit.rshift(bit.band(addr, 0x00FF0000), 16)
    local c = bit.rshift(bit.band(addr, 0x0000FF00), 8)
    local d = bit.band(addr, 0x000000FF)
    return string.format("%i.%i.%i.%i", a, b, c, d)
end

-- wildcardToCidr("10.*.*.*") -> "10.0.0.0/8"
---@param addr string IPv4 address containing wildcard octets.
---@return string cidr_address CIDR representation of the wildcard address.
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
---@param network string Network definition in CIDR, wildcard, or range notation.
---@param ip string|nil IPv4 address or wildcard notation to check.
---@return boolean matches True if the IP matches the network definition.
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
---@param weapon_id number|nil Spawned weapon object ID.
---@param player_id number Player index (1-16).
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
local function cacheWeaponDatums()
    for name, data in pairs(WEAPONS) do
        local tag_id = getTagId("weap", data.tag_name)
        if tag_id then
            weapon_datums[name] = {
                tag_id = tag_id,
                attributes = data.attributes
            }
        end
    end
end

---@param dyn_player number Dynamic player address.
---@param frags number Frag grenade count.
---@param plasmas number Plasma grenade count.
local function setGrenades(dyn_player, frags, plasmas)
    write_byte(dyn_player + 0x31E, frags)
    write_byte(dyn_player + 0x31F, plasmas)
end

---@param player_id number Player index (1-16).
---@param weapon_name string Weapon name key in weapon_datums.
---@param slot number Weapon slot (1-4).
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

    write_word(weapon_mem + 0x2B6, attributes.ammo) -- reserve ammo
    write_word(weapon_mem + 0x2B8, attributes.clip) -- rounds in magazine
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

Table, string, message formatting, time, and math helpers work on any platform and are shared with
Chimera. See [Pure Lua Helpers](../common-reference.md#pure-lua-helpers) in the Common Reference,
including the [math.atan2 guard](../common-reference.md#mathatan2-guard).

Many Halo strings are UTF-16LE: player name (`get_player(id) + 0x4`), server name
(`network_struct + 0x8`), gametype display name (`gametype_base + 0x0`; a mirror of the same
value also lives at `network_struct + 0x10C`), and map display name (`map_name_address`).
`read_string` returns `""` for these fields; use `readWideString` from
[Wide Strings](../common-reference.md#wide-strings) instead. The narrow (8-bit) form is used only
for filenames and paths (e.g. `map_name_address2`, `server_path_address`).

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

-- Declare the Windows API function signature for LuaJIT FFI.
ffi.cdef[[
    unsigned long GetTickCount(void);
]]

-- Tracks elapsed EVENT_TICK callbacks.
local tick_count = 0

function OnScriptLoad()
    -- Display the system uptime immediately when the script loads.
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
---@return boolean success, any result_or_error True if executed without error and function result, or false and error value.
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

-- Initialize an empty set of flags.
local flags = 0

-- Set bits 2 and 5 using bitwise OR.
flags = bit.bor(flags, 4, 32)

-- Check whether bit 2 is set using bitwise AND.
if bit.band(flags, 4) ~= 0 then
    cprint("Bit 2 is set")
end

-- Clear bit 5 using NOT to invert its mask, then AND to remove it.
flags = bit.band(flags, bit.bnot(32))

-- Shift 1 three positions to the left (equivalent to 1 * 2^3).
local shifted = bit.lshift(1, 3)
cprint("1 << 3 = " .. shifted)

-- Shift 8 three positions to the right (equivalent to 8 / 2^3).
local original = bit.rshift(8, 3)
cprint("8 >> 3 = " .. original)

-- Pack two 16-bit values into a single 32-bit value.
local high = 0xABCD
local low = 0x1234
local packed = bit.bor(bit.lshift(high, 16), low)
cprint(string.format("Packed: 0x%08X", packed))

-- Extract the upper 16 bits by shifting right.
local high_unpacked = bit.rshift(packed, 16)

-- Extract the lower 16 bits using a 16-bit mask.
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

Define the guard from [Math and Geometry](../common-reference.md#math-and-geometry) before using it,
or before using any helper that calls it such as `directionToCardinal`.

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