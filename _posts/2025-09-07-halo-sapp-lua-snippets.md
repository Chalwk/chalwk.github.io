---
title: "Halo: SAPP Lua Snippets"
date: 2025-09-8
last-updated: 2026-4-6
categories: [ education, halo, modding ]
tags: [ sapp, lua, halo, scripting, tutorial ]
---

If you've ever wanted to level up your server scripting with SAPP (the powerful Halo PC/CE server mod), you're in the
right place. This guide collects battle-tested Lua snippets that interact directly with Halo's memory - giving you fine
control over player positions, vehicles, objectives, chat messages, and more.

**Why these snippets matter:**  
SAPP Lua scripts let you customize gameplay, enforce rules, build minigames, and manage your server. The functions below
are ready to drop into your own scripts - just remember that direct memory access is powerful and requires careful
testing.

> **Heads up:** Many snippets read/write raw memory offsets. Always test in a safe environment first, and keep backups
> of your server files.

Let's dive in.

---

## Send Message to All Except a Specific Player

Sends a chat message to all connected players except one. Perfect for private alerts or avoiding spam to a specific
user.

**Parameters:**

- `message` (string) - The message to send.
- `exclude_player_id` (number) - Player index (1-16) to skip.

**Code:**

```lua
local function sendExclude(message, exclude_player_id)
    for i = 1, 16 do
        if player_present(i) and i ~= exclude_player_id then
            say(i, message)
        end
    end
end
```

**Tip:** Use this to announce events like "Player X found the secret" without revealing it to X themselves.

---

## Check if Player is in a Vehicle

Quickly test if a player is riding in any vehicle.

**Parameters:**

- `dyn_player` (number) - Dynamic player memory address.

**Returns:**  
`true` if the player is in a vehicle, `false` otherwise.

**Code:**

```lua
local function inVehicle(dyn_player)
    return read_dword(dyn_player + 0x11C) ~= 0xFFFFFFFF
end
```

**Note:** `0xFFFFFFFF` means "no vehicle". This check is lightning fast - great for per-tick logic.

---

## Check if Two Points are Within a Given Radius

Determines if two 3D points are within a given radius. Uses squared distance to avoid expensive square root
calculations.

**Parameters:**

- `x1, y1, z1`, `x2, y2, z2` (numbers) - Coordinates of the two points.
- `radius` (number) - Distance threshold.

**Returns:**  
`true` if within radius, `false` otherwise.

**Code:**

```lua
local function inRange(x1, y1, z1, x2, y2, z2, radius)
    local dx = x1 - x2
    local dy = y1 - y2
    local dz = z1 - z2
    return (dx * dx + dy * dy + dz * dz) <= (radius * radius)
end
```

**Why this works:** Comparing squared distances avoids `math.sqrt` and is much faster in hot loops.

---

## Check if Vehicle is Occupied by Any Player

Checks whether a specific vehicle object is currently occupied by any player.

**Parameters:**

- `vehicleObject` (number) - Memory address of the vehicle.

**Returns:**  
`true` if any player is inside, `false` otherwise.

**Code:**

```lua
-- Helper: Returns the vehicle object memory address for a given player index, or nil if not in a vehicle
local function getPlayerVehicleObject(i)
    -- Ensure the player exists and is alive
    if not player_present(i) or not player_alive(i) then return end

    -- Get dynamic player object address
    local dyn = get_dynamic_player(i)
    if dyn == 0 then return end

    -- Offset 0x11C holds the object ID of the vehicle the player is currently in
    -- 0xFFFFFFFF means "no vehicle"
    local vehicle_id = read_dword(dyn + 0x11C)
    if vehicle_id == 0xFFFFFFFF then return end

    -- Convert object ID to actual memory address of the vehicle object
    return get_object_memory(vehicle_id)
end

-- Checks if any player is inside the given vehicle object
local function isVehicleOccupied(vehicleObject)
    -- Loop through all possible player slots
    for i = 1, 16 do
        -- Compare the vehicle this player is in with the target vehicle
        if getPlayerVehicleObject(i) == vehicleObject then
            return true  -- Found at least one occupant
        end
    end
    return false         -- No players found in this vehicle
end
```

**Example usage:**

```lua
-- Prevent anyone from entering a specific vehicle (e.g., a reserved vehicle)
local reserved_vehicle = get_object_memory(some_vehicle_id)

function OnTick()
    for i = 1, 16 do
        if player_alive(i) and isVehicleOccupied(reserved_vehicle) then
            exit_vehicle(i) -- eject the player immediately
        end
    end
end
```

**Use case:** Prevent vehicle theft, trigger effects when a vehicle becomes empty, or enforce seat limits.

---

## Check if Player is Invisible

Detects if a player is currently invisible (e.g., from active camo or a script effect).

**Parameters:**

- `playerId` (number) - Player index (1-16).

**Returns:**  
`true` if invisible, `false` otherwise.

**Code:**

```lua
local function isPlayerInvisible(playerId)
    local dyn_player = get_dynamic_player(playerId)
    local invisible = read_float(dyn_player + 0x37C)
    return dyn_player ~= 0 and invisible == 1
end
```

**Note:** This reads a float that is exactly `1.0` when invisible. Works for both built-in camo and custom scripts.

---

## Clear Player's Console/Chat Buffer

Clears a player's console/chat buffer by printing many blank lines. Great for hiding previous messages or resetting the
display.

**Parameters:**

- `playerId` (number) - Player index.

**Code:**

```lua
local function clearConsole(playerId)
    for _ = 1, 25 do
        rprint(id, " ")
    end
end
```

**Pro tip:** 25 lines is usually enough to clear most screen heights. Adjust as needed.

---

## Spawn or Teleport Player with Position and Rotation

Writes position and rotation data directly to a dynamic object's memory - ideal for custom spawn points or teleportation
with facing direction.

**Parameters:**

- `dyn_player` (number) - dynamic player memory address.
- `px, py, pz` (numbers) - Spawn coordinates.
- `pR` (number) - Rotation in radians.
- `z_off` (number, optional) - Vertical offset. Defaults to `0.3`.

**Code:**

```lua
local function spawnObject(dyn_player, px, py, pz, pR, z_off)
    z_off = z_off or 0.3
    local x = px
    local y = py
    local z = pz + z_off
    local r = pR
    write_vector3d(dyn_player + 0x5C, x, y, z)
    write_vector3d(dyn_player + 0x74, math.cos(r), math.sin(r), 0)
end
```

**Example usage:**

```lua
-- Teleport a player to a specific location
function OnChat(playerId, message)
    if message == "/tp" then
        local dyn_player = get_dynamic_player(playerId)
        if dyn_player and dyn_player ~= 0 then
            spawnObject(dyn_player, 100, 50, 5, 0)   -- x=100, y=50, z=5, rotation=0
            say(playerId, "Teleported to coordinates (100, 50, 5)")
        end
        return false
    end
end

-- Set a custom spawn point for a player after death (OnPlayerSpawn override)
local custom_spawn = { x = -200, y = 150, z = 10, rot = math.rad(90) }

function OnPlayerDeath(playerId)
    -- Store that this player should respawn at custom location
    -- (You'd need a global table to track this)
    local dyn_player = get_dynamic_player(playerId)
    if dyn_player then
        -- Teleport immediately (could be used as instant respawn)
        spawnObject(dyn_player, custom_spawn.x, custom_spawn.y, custom_spawn.z, custom_spawn.rot, 0.5)
    end
end
```

**Explanation:**  
The function writes the new position (offset `0x5C`) and forward vector (offset `0x74`) which determines facing
direction. The vertical offset `z_off` lifts the player slightly above the ground to avoid falling through the map.

---

## Deep Copy a Table (Including Nested Tables)

Creates a deep copy of a table, including nested tables and metatables. Extremely useful when you need an independent
duplicate of complex data.

**Warning:** This recurses into everything, including keys, values, and metatables. If your table has circular
references (a table that contains itself), this will cause an infinite loop. Use only on acyclic data.

**Parameters:**

- `orig` (any) - The value or table to copy.

**Returns:**  
A fully independent copy.

**Code:**

```lua
local function deepCopy(orig)
    if type(orig) ~= "table" then return orig end
    local copy = {}
    for key, value in pairs(orig) do
        copy[deepCopy(key)] = deepCopy(value)
    end
    return setmetatable(copy, deepCopy(getmetatable(orig)))
end
```

---

## Find Tag by Substring in Name or Path

Scans the tag table for a tag whose path or name contains a given substring. Optionally filter by tag class.

**Parameters:**

* `substring` (string) - Text to search for (case-insensitive).
* `class_filter` (string or nil) - Optional, e.g., `'weap'`, `'vehi'`. Pass `nil` to search all classes.

**Returns:**
MetaIndex of the first matching tag, or `nil` if not found.

**Code:**

```lua
local base_tag_table = 0x40440000 -- Halo's tag table base address

-- Searches tags by substring in name/path, optionally filtered by class.
-- Returns meta index of first match, or nil if none found.
local function findTagByNameSubstring(substring, class_filter)
    substring = substring:lower()
    local tag_array = read_dword(base_tag_table)       -- pointer to first tag entry
    local tag_count = read_dword(base_tag_table + 0xC) -- total number of tags

    -- If a class filter is provided, get its class hash once
    local filter_hash = class_filter and read_dword(lookup_tag(class_filter, "")) or nil

    for i = 0, tag_count - 1 do
        local tag = tag_array + 0x20 * i    -- each tag entry is 32 bytes
        local class_hash = read_dword(tag)  -- tag's class hash (e.g., 0x77656170 = "weap")

        -- Apply class filter if specified
        if filter_hash and class_hash ~= filter_hash then goto continue end

        local name_ptr = read_dword(tag + 0x10) -- pointer to tag name string
        if not name_ptr or name_ptr == 0 then goto continue end

        local name = read_string(name_ptr)
        if not name or not name:lower():find(substring, 1, true) then goto continue end

        return read_dword(tag + 0xC) -- meta index of the tag

        ::continue::
    end
    return nil
end
```

**Example usage:**

```lua
-- Find any weapon with "rocket" in its name
local rocket_meta = findTagByNameSubstring("rocket", "weap")
if rocket_meta then
    print("Found rocket launcher meta: " .. rocket_meta)
    -- Spawn one at a location
	spawn_object("", "", 100, 100, 100, 0, rocket_meta)
end

-- Find any vehicle containing "ghost" (case-insensitive)
local ghost_meta = findTagByNameSubstring("ghost", "vehi")

-- Search all tags for "flag" (could be weapon, scenery, etc.)
local flag_meta = findTagByNameSubstring("flag", nil)
```

**How it works:**

* Iterates through every tag in the map's tag table.
* Compares the tag's class hash against the optional `class_filter` (converted via `lookup_tag`).
* Performs a simple substring search on the tag's full path/name (case-insensitive).
* Returns the meta index (usable with `spawn_object`) of the first match.

**Note:** The search stops at the first match. If you need all matches, modify the function to collect results in a
table.

---

## Format Message Strings (Two Approaches)

Two different approaches to formatting messages - choose the one that fits your style.

### Version 1: Classic `string.format` style

Define templates as constants, then use `formatMessage` which behaves like `string.format`.

**Templates:**

```lua
local HELLO_MESSAGE     = "Hello world!"
local PLAYER_JOINED     = "Player %s has joined the game."
local PLAYER_SCORE      = "%s scored %d points in %d minutes."
```

**Function:**

```lua
local function formatMessage(message, ...)
    if select('#', ...) > 0 then return message:format(...) end
    return message
end
```

**Usage:**

```lua
print(formatMessage(HELLO_MESSAGE))                 -- Hello world!
print(formatMessage(PLAYER_JOINED, "Chalwk"))       -- Player Chalwk has joined the game.
print(formatMessage(PLAYER_SCORE, "Chalwk", 150, 12))
```

### Version 2: Placeholder-based (template variables)

Use named placeholders like `$name` and replace them from a table.

**Templates:**

```lua
local SCORE_MESSAGE   = "$name scored $points points in $minutes minutes."
local JOIN_MESSAGE    = "Player $name has joined the server."
local LEAVE_MESSAGE   = "Player $name has left the server."
```

**Function:**

```lua
local function formatMessage(message, vars)
    return (message:gsub("%$(%w+)", function(key)
        return vars[key] or "$" .. key
    end))
end
```

**Usage:**

```lua
print(formatMessage(JOIN_MESSAGE, {name = "Chalwk"}))
print(formatMessage(SCORE_MESSAGE, {name = "Chalwk", points = 150, minutes = 12}))
print(formatMessage(LEAVE_MESSAGE, {}))  -- unmatched placeholders remain
```

**Which one to use?**  
Version 1 is simpler for ordered arguments. Version 2 is more readable when you have many named values.

---

## Get Player's Aim/Camera Direction Vector

Retrieves the desired aim vector (camera direction) from a dynamic object.

**Parameters:**

- `dyn_player` (number) - Dynamic object memory address.

**Returns:**  
`aim_x, aim_y, aim_z` - the camera's facing direction components.

**Code:**

```lua
local function getAimVector(dyn_player)
    local aim_x = read_float(dyn_player + 0x230)
    local aim_y = read_float(dyn_player + 0x234)
    local aim_z = read_float(dyn_player + 0x238)
    return aim_x, aim_y, aim_z
end
```

**Use case:** Create aim-dependent abilities, like "look at a player to freeze them".

---

## Get Server Base Directory and Config Path

Two helper functions to dynamically locate your Halo server folder and the SAPP config directory - no hardcoded paths
needed.

**Code:**

```lua
local function getConfigPath()
    return read_string(read_dword(sig_scan('68??????008D54245468') + 0x1))
end

local function getBaseDir(folder)
    folder = folder or ""
    local exe_path = read_string(read_dword(sig_scan('0000BE??????005657C605') + 0x3))
    local base_path = exe_path:match("(.*\\)")
    return base_path .. folder
end
```

**Examples:**

```lua
local base_dir = getBaseDir()          -- "C:\YourHaloServer\"
local maps_dir = getBaseDir("maps")    -- "C:\YourHaloServer\maps"
local sapp_cg  = getConfigPath()       -- "C:\YourHaloServer\cg\sapp"
```

> **Note:** The signature scans are specific to SAPP. They should work on standard builds, but test after updates.

---

## Get Flag Object Meta ID and Tag Name

Finds the flag (objective) tag on the current map and returns its meta ID and tag name.

**Returns:**  
`flag_meta_id` (number), `flag_tag_name` (string) - or `nil, nil` if no flag exists.

**Code:**

```lua
local base_tag_table = 0x40440000   -- Halo's tag table base address

-- Returns meta ID and tag name of the flag (if present on the map)
local function getFlagData()
    local tag_array = read_dword(base_tag_table)          -- pointer to first tag entry
    local tag_count = read_dword(base_tag_table + 0xC)    -- total number of tags

    for i = 0, tag_count - 1 do
        local tag = tag_array + 0x20 * i                  -- each tag entry is 32 bytes
        local tag_class = read_dword(tag)                 -- class hash (0x77656170 = "weap")

        if tag_class == 0x77656170 then                   -- only interested in weapons (may be different on CE)
            local tag_data = read_dword(tag + 0x14)       -- pointer to tag data in memory
            -- Check if this weapon is an objective (bit 3 at offset 0x308)
            if read_bit(tag_data + 0x308, 3) == 1 then
                -- Byte at offset 0x2: 0 = flag, 4 = oddball
                if read_byte(tag_data + 0x2) == 0 then
                    local meta_id = read_dword(tag + 0xC)	    -- meta index
                    local name_ptr = read_dword(tag + 0x10)	    -- pointer to tag name
                    local tag_name = read_string(name_ptr)		-- e.g., "objects\weapons\multiplayer\flag\flag"
                    return meta_id, tag_name
                end
            end
        end
    end
    return nil, nil -- no flag found on this map
end
```

**Example usage:**

```lua
local flag_meta, flag_name

function OnScriptLoad()
    flag_meta, flag_name = getFlagData()
    if flag_meta then
        print("Flag found: " .. flag_name .. " (meta: " .. flag_meta .. ")")
    else
        print("No flag on this map.")
    end
end

-- Use the cached values elsewhere (e.g., spawning the flag)
function OnPlayerDeath(player_index)
    if flag_meta then
        -- Respawn flag at custom position
		spawn_object("", "", 100, 100, 100, 0, flag_meta)
    end
end
```

**How it works:**

- Looks for a weapon tag (`weap`) with the "objective" bit set at offset `0x308`, bit index `3`.
- Byte `+2` of the tag data equals `0` for flag (oddball is `4`).

**Note:** The result can be cached globally (as shown above) because the map's tag table doesn't change during gameplay.
Call `getFlagData()` once in `OnScriptLoad` or during `EVENT_GAME_START` for efficiency.

---

## Get Tag Class and Name from Object Memory

Retrieves the tag class and name of any object (vehicle, weapon, equipment, etc.). Includes a practical example for when
a player enters a vehicle.

**Code:**

```lua
local function getTag(object)
    local tag_class = read_byte(object + 0xB4)
    local tag_address = read_word(object) * 32 + 0x40440038
    local tag_name = read_string(read_dword(tag_address))
    return tag_class, tag_name
end
```

**Example - OnVehicleEnter:**

```lua
function OnVehicleEnter(playerId)
    local dyn_player = get_dynamic_player(playerId)
    if dyn == 0 then return end
    local vehicle_id = read_dword(dyn_player + 0x11C)
    if vehicle_id == 0xFFFFFFFF then return end
    local vehicle_obj = get_object_memory(vehicle_id)
    if vehicle_obj == 0 then return end
    local tag_class, tag_name = getTag(vehicle_obj)
    print(tag_class, tag_name)  -- e.g., "vehi", "vehicles\warthog\mp_warthog"
end
```

**Memory explanation:**

- `read_word(object)` gives the object's tag index.
- Each tag entry is 32 bytes, so multiply by 32.
- Add the base tag table address (`0x40440038`) to locate the tag's metadata.

---

## Check if Player is Holding Flag or Oddball

Checks if the player's currently held weapon is an objective - flag, oddball, or either.

**Parameters:**

- `dyn_player` (number) - Dynamic player address.
- `objective_type` (string, optional) - `"oddball"`, `"flag"`, or `"any"` (default `"any"`).

**Returns:**  
`true` if holding the specified objective type.

**Code:**

```lua
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

**Tip:** Use this to prevent flag carriers from using weapons or to give oddball carriers special abilities.

---

## Get Player's Full Inventory (Weapons, Ammo, Grenades)

Returns a table of all weapon slots (1-4) with ammo, heat, grenades, etc. Empty slots are omitted from the result.

**Parameters:**

- `dyn_player` (number) - Dynamic player address.

**Returns:**  
A table where each element corresponds to a weapon slot (1-4), containing:
`id, ammo, clip, ammo2, clip2, heat, frags, plasmas`.

**Code:**

```lua
local function getInventory(dyn_player)
    local inv = {}
    -- 4 weapon slots at offsets 0x2F8, 0x2FC, 0x300, 0x304
    for slot = 0, 3 do
        local weapon_id = read_dword(dyn_player + 0x2F8 + slot * 4)
        local weapon_obj = get_object_memory(weapon_id)
        if weapon_obj and weapon_obj ~= 0 then
            inv[slot + 1] = {
                id      = read_dword(weapon_obj),           -- object identifier
                ammo    = read_word(weapon_obj + 0x2B6),    -- primary ammo remaining
                clip    = read_word(weapon_obj + 0x2B8),    -- bullets in current magazine
                ammo2   = read_word(weapon_obj + 0x2C6),    -- secondary ammo (e.g., grenades for launcher)
                clip2   = read_word(weapon_obj + 0x2C8),    -- secondary clip (e.g., rockets loaded)
                heat    = read_float(weapon_obj + 0x240),   -- overheat value (0 = cool, 1 = overheated)
                frags   = read_byte(dyn_player + 0x31E),    -- frag grenade count
                plasmas = read_byte(dyn_player + 0x31F)     -- plasma grenade count
            }
        end
    end
    return inv
end
```

**Usage example:**

```lua
local gear = getInventory(dyn_player)
for slot, data in pairs(gear) do
    print(string.format("Slot %d: weapon id %d, ammo %d/%d", slot, data.id, data.clip, data.ammo))
end
```

---

## Get Player's World Position (Adjusted for Crouch/Vehicle)

Retrieves the player's actual world position, automatically adjusting for crouch height and vehicle offsets.

**Parameters:**

- `dyn_player` (number) - Dynamic player address.

**Returns:**  
`x, y, z` coordinates (adjusted), or `nil` if the player is in an invalid state.

**Code:**

```lua
-- Returns player's world position (x, y, z) adjusted for crouch height and vehicle offsets.
-- If the player is not in a valid state, returns nil.
local function getPlayerPosition(dyn_player)
    local crouch = read_float(dyn_player + 0x50C)                 -- crouch factor (0 = standing)
    local vehicle_id = read_dword(dyn_player + 0x11C)             -- vehicle object ID, 0xFFFFFFFF = none
    local vehicle_obj = get_object_memory(vehicle_id)

    -- Get base position: from player's own object or from the vehicle they're in
    local x, y, z
    if vehicle_id == 0xFFFFFFFF then
        x, y, z = read_vector3d(dyn_player + 0x5C)                -- player's feet position
    elseif vehicle_obj and vehicle_obj ~= 0 then
        x, y, z = read_vector3d(vehicle_obj + 0x5C)               -- vehicle's origin
    else
        return nil                                                -- invalid state
    end

    -- Eye height offset: 0.65 when standing, proportionally lower when crouching
    local z_offset = (crouch == 0) and 0.65 or 0.35 * crouch
    return x, y, z + z_offset
end
```

**Example usage:**

```lua
function OnTick()
    for i = 1, 16 do
        if player_present(i) and player_alive(i) then
            local dyn = get_dynamic_player(i)
            local x, y, z = getPlayerPosition(dyn)
            if x then
                -- Do something with the player's world position, e.g., check distance to a flag
                say(i, string.format("You are at: %.2f, %.2f, %.2f", x, y, z))
            end
        end
    end
end
```

**Why the offset?**  
Players have a small "eye height" above their feet. This function gives you the actual world location for collision
checks, spawning effects, or distance calculations.

---

## Get Total Number of Key-Value Pairs in a Table

Returns the total number of key-value pairs in a table - works for both array-style and dictionary-style tables (unlike
the `#` operator).

**Parameters:**

- `tbl` (table) - The table to count.

**Returns:**  
Number of elements.

**Code:**

```lua
local function tableLength(tbl)
    local count = 0
    for _ in pairs(tbl) do
        count = count + 1
    end
    return count
end
```

**Examples:**

```lua
local t1 = {10, 20, 30, 40}          -- tableLength(t1) → 4
local t2 = {name = "Jay", age = 32}   -- tableLength(t2) → 2
local t3 = {1, 2, foo = "bar"}        -- tableLength(t3) → 3
```

---

## Get Tag Data Memory Address by Class and Name

Retrieves the memory address of a tag's data given its class and name. (Note the typo in the function name - it's
intentional to match the original snippet.)

**Parameters:**

- `class` (string) - Tag class, e.g., `"weap"`, `"vehi"`.
- `name` (string) - Tag name, e.g., `"weapons\\pistol\\pistol"`.

**Returns:**  
Memory address of the tag data, or `nil` if not found.

**Code:**

```lua
local function getTag(class, name)
    local tag = lookup_tag(class, name)
    return tag and read_dword(tag + 0xC) or nil
end
```

**Usage:** Use this to dynamically fetch tag data for spawning or modification.

---

## Get Current Weapon Slot Index

Reads the current weapon slot byte from the dynamic player object.

**Parameters:**

- `dyn_player` (number) - Dynamic player address.

**Returns:**  
Weapon slot number (byte).

**Code:**

```lua
local function getWeaponSlot(dyn_player)
    return read_byte(dyn_player + 0x2F2)
end
```

**Slot values:** Usually 0-3 matching the player's weapon selection.

---

## Scan and Print All Map Objects (Weapons, Vehicles, Equipment)

A debugging tool that scans the map's tag table and prints all weapons, vehicles, and equipment with their metadata.

**Parameters:**  
None.

**Returns:**  
Nothing (prints directly to console via `cprint`).

**Code:**

```lua
local base_tag_table = 0x40440000  -- Halo's tag table base address

-- Convert tag class hash to readable string
-- Note: Class name may differ on custom maps!
local function getClassName(class)
    return (class == 0x76656869 and "vehi") or
           (class == 0x77656170 and "weap") or
           (class == 1701931376 and "eqip")
end

local function scanMapObjects()
    local tag_array = read_dword(base_tag_table)          -- pointer to first tag entry
    local tag_count = read_dword(base_tag_table + 0xC)    -- total number of tags

    for i = 0, tag_count - 1 do
        local tag = tag_array + 0x20 * i                  -- each tag entry is 32 bytes
        local class = read_dword(tag)                     -- tag class hash
        local class_name = getClassName(class)
        if class_name then
            local name_ptr = read_dword(tag + 0x10)       -- pointer to tag name string
            local name = (name_ptr ~= 0) and read_string(name_ptr) or "<no-name>"
            local meta = read_dword(tag + 0xC)           -- meta index (used for spawning)
            local tag_data = read_dword(tag + 0x14)      -- pointer to tag data in memory

            if tag_data and tag_data ~= 0 then
                -- Read useful debug fields from tag data
                local b2 = read_byte(tag_data + 0x2)     -- objective type (0=flag,4=oddball)
                local b8 = read_byte(tag_data + 0x8)
                local d0 = read_dword(tag_data + 0x0)    -- first 4 bytes of tag data
                local d4 = read_dword(tag_data + 0x4)    -- next 4 bytes
                cprint(string.format("%s meta=%u tag_data=0x%X name=%s | b2=%d b8=%d d0=0x%X d4=0x%X",
                    class_name, meta, tag_data, name, b2, b8, d0, d4), 12)
            else
                cprint(string.format("%s meta=%u tag_data=nil name=%s", class_name, meta, name), 12)
            end
        end
    end
end
```

**Example usage:**

```lua
function OnScriptLoad()
    -- Call this once to see all weapons, vehicles, and equipment on the current map
    scanMapObjects()
end

-- Or bind to a chat command for on-demand debugging
function OnChat(player_index, player_name, message)
    if message == "!scanobjects" and has_admin(player_index) then
        scanMapObjects()
        return false  -- prevent command from being broadcast
    end
end
```

**When to use:** During map or script development or when you need to understand what objects a map contains. The output
includes meta IDs (useful for spawning) and raw tag data offsets for advanced debugging.

**Note:** The color argument `12` in `cprint` prints in red. You can change it to any SAPP color code (e.g., `10` for
green, `12` for red).

---

## Parse Command Arguments by Delimiter

Splits a string into substrings based on a delimiter - perfect for parsing chat commands or CSV data.

**Parameters:**

- `input` (string) - The string to split.
- `delimiter` (string) - The delimiter character (e.g., `" "`, `","`).

**Returns:**  
An array-like table of substrings.

**Code:**

```lua
local function parseArgs(input, delimiter)
    local result = {}
    for substring in input:gmatch("([^" .. delimiter .. "]+)") do
        result[#result + 1] = substring
    end
    return result
end
```

**Example:**

```lua
local args = parseArgs("!give weapon sniper", " ")
-- args = {"!give", "weapon", "sniper"}
```

---

## Send Formatted Message to Specific Player or Globally

A unified function that sends a formatted message either to a specific player or to everyone (without the server
prefix).

**Parameters:**

- `player_id` (number or nil) - Target player index, or `nil` for global broadcast.
- `...` - Formatting arguments for `string.format`.

**Code:**

```lua
local format = string.format

local function send(player_id, ...)
    if not player_id then
        execute_command('msg_prefix ""')
        say_all(format(...))
        execute_command('msg_prefix "' .. MSG_PREFIX .. '"')
        return
    end
    rprint(player_id, format(...))
end
```

**Usage:**

```lua
send(nil, "Server restarting in %d seconds!", 30)   -- global
send(3, "Hello %s, welcome!", get_var(3, "$name"))  -- private
```

> **Important:** The variable `MSG_PREFIX` must be defined elsewhere in your script. The function temporarily removes it
> for clean global messages.

---

## Override Player's Respawn Time

Overrides a player's respawn time by writing directly to the player table memory.

**Parameters:**

- `playerIndex` (number) - Player index (1-16).
- `respawnTime` (number, optional) - Seconds until respawn. Defaults to 3.

**Code:**

```lua
local function setRespawnTime(playerIndex, respawnTime)
    respawnTime = respawnTime or 3
    local static_player = get_player(playerIndex)
    if static_player then
        write_dword(static_player + 0x2C, respawnTime * 33)
    end
end
```

**Note:** The value is stored in ticks (1 tick ≈ 1/33 second), so multiply seconds by 33.

---

## Get Score Limit of Current Game

Retrieves the score limit (e.g., kills to win, flag captures, oddball points) from the active game type or variant by
reading it directly from memory.

**Returns:**  
`score_limit` (number) - The score limit as a byte value (e.g., 50 for Slayer to 50 kills).

**Code:**

```lua
api_version = "1.12.0.0"

local gametype_base, score_limit

function OnScriptLoad()
    gametype_base = read_dword(sig_scan("B9360000008BF3BF78545F00") + 0x8)
    register_callback(cb['EVENT_GAME_START'], "OnStart")
    OnStart() -- in case script is loaded mid-game
end

local function getScoreLimit()
    return read_byte(gametype_base + 0x58)
end

function OnStart()
    if get_var(0, '$gt') == "n/a" then return end
    score_limit = getScoreLimit()
    print(score_limit)
end
```

**How it works:**  
The signature scan locates the game type data structure in memory; offset `0x58` holds the score limit byte. The
function reads it and stores it in `score_limit`. The print is just an example - you can use the value for custom win
conditions, HUD messages, or early match termination.

---

## Shuffle an Array Table (Fisher-Yates)

Randomly shuffles an array-like table in place using the Fisher-Yates algorithm. Every permutation is equally likely.

**Parameters:**

- `tbl` (table) - The array-style table to shuffle.

**Code:**

```lua
local function shuffleTable(tbl)
    for i = #tbl, 2, -1 do
        local j = math.random(i)
        tbl[i], tbl[j] = tbl[j], tbl[i]
    end
end
```

**Requirements:**

- Table must have sequential integer keys starting at 1.
- Use `math.randomseed()` at script start for true randomness.

**Example:**

```lua
local players = {1, 2, 3, 4, 5}
shuffleTable(players)
-- Now players is in random order
```

---

## Vanish a Player by Moving Off-Map

"Vanishes" a player by moving them far off-map. The player sees themselves in a spectator-like state, but others cannot
see them.

**Parameters:**

- `playerId` (number) - Player index (1-16).

**Code:**

```lua
-- Moves a player far off-map (requires calling every tick to stay hidden)
local function vanish(playerId)
    local static = get_player(playerId)               -- static player table address
    if not static then return end
    local dyn = get_dynamic_player(playerId)          -- dynamic player object address
    if dyn == 0 then return end

    -- Get current world position (adjusted for crouch/vehicle)
    local x, y, z = getPlayerPosition(dyn)            -- assumes getPlayerPosition exists
    if not x then return end

    -- Teleport player far away (off-map)
    write_float(static + 0xF8, x - 1000)              -- X offset in static table
    write_float(static + 0xFC, y - 1000)              -- Y offset
    write_float(static + 0x100, z - 1000)             -- Z offset
end
```

**Example usage (keeps player vanished every tick):**

```lua
local vanished_players = {}  -- track vanished players (e.g., after a command)

function OnTick()
    for i = 1, 16 do
        if vanished_players[i] and player_present(i) then
            vanish(i) -- re-apply vanish each tick
        end
    end
end

-- Example command: !vanish 3
function OnChat(player, _, msg)
    if msg:match("^/vanish") then
        local args = parseArgs(msg, " ") -- See parseArgs snippet above.
        local target = tonumber(args[2])
        if target and has_admin(player) then
            vanished_players[target] = true
            vanish(target)
            say(player, "You vanished!")
        end
    end
end
```

**Important:**

- This must be called **every tick** (e.g., inside `OnTick`) to keep the player hidden. The offsets `0xF8`, `0xFC`, and
  `0x100` are the player's world position in the static player table.
- The player will appear to be in a spectator-like state but can still move on their own client - they'll be frozen
  off-map for others.
- Works best when combined with `player_disable` or similar to prevent interaction.

**Use cases:** Invisibility for admins, "ghost" modes, custom respawn systems, or hiding players during minigames.