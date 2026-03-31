---
layout: post
title: "Halo PC/CE: SAPP Lua Snippets"
date: 2025-09-8
author: Jericho Crosby
categories: [ education, halo, modding ]
tags: [ sapp, lua, halo, scripting, tutorial ]
---

If you've ever wanted to level up your server scripting with SAPP (the powerful Halo PC/CE server mod), you're in the right place. This guide collects battle-tested Lua snippets that interact directly with Halo's memory - giving you fine control over player positions, vehicles, objectives, chat messages, and more.

**Why these snippets matter:**  
SAPP Lua scripts let you customize gameplay, enforce rules, build minigames, and manage your server. The functions below are ready to drop into your own scripts - just remember that direct memory access is powerful and requires careful testing.

> **Heads up:** Many snippets read/write raw memory offsets. Always test in a safe environment first, and keep backups of your server files.

Let's dive in.

---

## broadcast_excluding_player

Sends a chat message to all connected players except one. Perfect for private alerts or avoiding spam to a specific user.

**Parameters:**
- `message` (string) - The message to send.
- `exclude_player` (number) - Player index (1-16) to skip.

**Code:**
```lua
local function sendExclude(message, exclude_player)
    for i = 1, 16 do
        if player_present(i) and i ~= exclude_player then
            say(i, message)
        end
    end
end
```

**Tip:** Use this to announce events like "Player X found the secret" without revealing it to X themselves.

---

## check_if_player_in_vehicle

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

## check_if_player_is_in_range

Determines if two 3D points are within a given radius. Uses squared distance to avoid expensive square root calculations.

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

## check_if_vehicle_occupied

Checks whether a specific vehicle object is currently occupied by any player.

**Parameters:**
- `vehicleObject` (number) - Memory address of the vehicle.

**Returns:**  
`true` if any player is inside, `false` otherwise.

**Code:**
```lua
local function isVehicleOccupied(vehicleObject)
    for i = 1, 16 do
        local dyn = get_dynamic_player(i)
        if player_present(i) and player_alive(i) and dyn ~= 0 then
            local vehicle_id = read_dword(dyn + 0x11C)
            if vehicle_id == 0xFFFFFFFF then goto next_player end
            local vehicle_obj = get_object_memory(vehicle_id)
            if vehicle_obj ~= 0 and vehicle_obj == vehicleObject then
                return true
            end
            ::next_player::
        end
    end
    return false
end
```

**Use case:** Prevent vehicle theft, trigger effects when a vehicle becomes empty, or enforce seat limits.

---

## check_player_invisibility_state

Detects if a player is currently invisible (e.g., from active camo or a script effect).

**Parameters:**
- `id` (number) - Player index (1-16).

**Returns:**  
`true` if invisible, `false` otherwise.

**Code:**
```lua
local function isPlayerInvisible(id)
    local dyn_player = get_dynamic_player(id)
    local invisible = read_float(dyn_player + 0x37C)
    return dyn_player ~= 0 and invisible == 1
end
```

**Note:** This reads a float that is exactly `1.0` when invisible. Works for both built-in camo and custom scripts.

---

## clear_player_rcon_chat_buffer

Clears a player's console/chat buffer by printing many blank lines. Great for hiding previous messages or resetting the display.

**Parameters:**
- `id` (number) - Player index.

**Code:**
```lua
local function clearConsole(id)
    for _ = 1, 25 do
        rprint(id, " ")
    end
end
```

**Pro tip:** 25 lines is usually enough to clear most screen heights. Adjust as needed.

---

## custom_spawn_with_rotation

Writes position and rotation data directly to a dynamic object's memory - ideal for custom spawn points or teleportation with facing direction.

**Parameters:**
- `dyn` (number) - Dynamic player memory address.
- `px, py, pz` (numbers) - Spawn coordinates.
- `pR` (number) - Rotation in radians.
- `z_off` (number, optional) - Vertical offset. Defaults to `0.3`.

**Code:**
```lua
local function spawnObject(dyn, px, py, pz, pR, z_off)
    z_off = z_off or 0.3
    local x = px
    local y = py
    local z = pz + z_off
    local r = pR
    write_vector3d(dyn + 0x5C, x, y, z)
    write_vector3d(dyn + 0x74, math.cos(r), math.sin(r), 0)
end
```

**Explanation:** The forward vector (offset `0x74`) controls which direction the player faces. Using `math.cos` and `math.sin` converts radians to a unit vector.

---

## deep_copy_table

Creates a deep copy of a table, including nested tables and metatables. Extremely useful when you need an independent duplicate of complex data.

**Warning:** This recurses into everything, including keys, values, and metatables. If your table has circular references (a table that contains itself), this will cause an infinite loop. Use only on acyclic data.

**Parameters:**
- `orig` (any) - The value or table to copy.

**Returns:**  
A fully independent copy.

**Code:**
```lua
local function deepCopy(orig)
    if type(orig) ~= "table" then
        return orig
    end
    local copy = {}
    for key, value in pairs(orig) do
        copy[deepCopy(key)] = deepCopy(value)
    end
    return setmetatable(copy, deepCopy(getmetatable(orig)))
end
```

---

## find_tag_by_name_substring

Scans the tag table for a tag whose path or name contains a given substring. Optionally filter by tag class.

**Parameters:**
- `substring` (string) - Text to search for (case-insensitive).
- `class_filter` (string or nil) - Optional, e.g., `'weap'`, `'vehi'`. Pass `nil` to search all classes.

**Returns:**  
MetaIndex of the first matching tag, or `nil` if not found.

**Code:**
```lua
local function findTagByNameSubstring(substring, class_filter)
    local base_tag_table = 0x40440000
    substring = substring:lower()
    local tag_array = read_dword(base_tag_table)
    local tag_count = read_dword(base_tag_table + 0xC)
    for i = 0, tag_count - 1 do
        local tag = tag_array + 0x20 * i
        local class = read_dword(tag)
        if class_filter == nil or class == read_dword(lookup_tag(class_filter, "")) then
            local name_ptr = read_dword(tag + 0x10)
            if name_ptr ~= 0 then
                local name = read_string(name_ptr)
                if name and name:lower():find(substring, 1, true) then
                    return read_dword(tag + 0xC)
                end
            end
        end
    end
    return nil
end
```

---

## format_message_string

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
    if select('#', ...) > 0 then
        return message:format(...)
    end
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

## get_aim_vector

Retrieves the desired aim vector (camera direction) from a dynamic object.

**Parameters:**
- `dyn` (number) - Dynamic object memory address.

**Returns:**  
`aim_x, aim_y, aim_z` - the camera's facing direction components.

**Code:**
```lua
local function getAimVector(dyn)
    local aim_x = read_float(dyn + 0x230)
    local aim_y = read_float(dyn + 0x234)
    local aim_z = read_float(dyn + 0x238)
    return aim_x, aim_y, aim_z
end
```

**Use case:** Create aim-dependent abilities, like "look at a player to freeze them".

---

## get_base_directory_and_config_path

Two helper functions to dynamically locate your Halo server folder and the SAPP config directory - no hardcoded paths needed.

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

## get_flag_object_meta_and_tag_name

Finds the flag (objective) tag on the current map and returns its meta ID and tag name.

**Returns:**  
`flag_meta_id` (number), `flag_tag_name` (string) - or `nil, nil` if no flag exists.

**Code:**
```lua
local flag_meta_id, flag_tag_name
local base_tag_table = 0x40440000
local tag_entry_size = 0x20
local tag_data_offset = 0x14
local bit_check_offset = 0x308
local bit_index = 3

local function getFlagData()
    local tag_array = read_dword(base_tag_table)
    local tag_count = read_dword(base_tag_table + 0xC)
    for i = 0, tag_count - 1 do
        local tag = tag_array + tag_entry_size * i
        local tag_class = read_dword(tag)
        if tag_class == 0x77656170 then -- "weap"
            local tag_data = read_dword(tag + tag_data_offset)
            if read_bit(tag_data + bit_check_offset, bit_index) == 1 then
                if read_byte(tag_data + 2) == 0 then
                    flag_meta_id = read_dword(tag + 0xC)
                    flag_tag_name = read_string(read_dword(tag + 0x10))
                    return flag_meta_id, flag_tag_name
                end
            end
        end
    end
    return nil, nil
end
```

**How it works:**
- Looks for a weapon tag (`weap`) with the "objective" bit set.
- Byte `+2` of the tag data equals `0` for flag (oddball is `4`).

---

## get_object_tag_address

Retrieves the tag class and name of any object (vehicle, weapon, equipment, etc.). Includes a practical example for when a player enters a vehicle.

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
function OnVehicleEnter(playerIndex)
    local dyn = get_dynamic_player(playerIndex)
    if dyn == 0 then return end
    local vehicle_id = read_dword(dyn + 0x11C)
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

## get_objective_flag_or_oddball

Checks if the player's currently held weapon is an objective - flag, oddball, or either.

**Parameters:**
- `dyn_player` (number) - Dynamic player address.
- `objective_type` (string, optional) - `"oddball"`, `"flag"`, or `"any"` (default `"any"`).

**Returns:**  
`true` if holding the specified objective type.

**Code:**
```lua
local function hasObjective(dyn_player, objective_type)
    local base_tag_table = 0x40440000
    local tag_entry_size = 0x20
    local tag_data_offset = 0x14
    local bit_check_offset = 0x308
    local bit_index = 3
    objective_type = objective_type or "any"
    local weapon_id = read_dword(dyn_player + 0x118)
    local weapon_obj = get_object_memory(weapon_id)
    if weapon_obj == nil or weapon_obj == 0 then return false end
    local tag_address = read_word(weapon_obj)
    local tag_data_base = read_dword(base_tag_table)
    local tag_data = read_dword(tag_data_base + tag_address * tag_entry_size + tag_data_offset)
    if read_bit(tag_data + bit_check_offset, bit_index) ~= 1 then return false end
    local obj_byte = read_byte(tag_data + 2)
    local is_oddball = (obj_byte == 4)
    local is_flag = (obj_byte == 0)
    if objective_type == "oddball" then
        return is_oddball
    elseif objective_type == "flag" then
        return is_flag
    else
        return is_oddball or is_flag
    end
end
```

**Tip:** Use this to prevent flag carriers from using weapons or to give oddball carriers special abilities.

---

## get_player_inventory

Returns a table with details of all four weapon slots: ammo, clip, secondary ammo, heat (for energy weapons), and grenade counts.

**Parameters:**
- `dyn_player` (number) - Dynamic player address.

**Returns:**  
A table where each element corresponds to a weapon slot (1-4), containing:
`id, ammo, clip, ammo2, clip2, heat, frags, plasmas`.

**Code:**
```lua
local function getInventory(dyn_player)
    local inventory = {}
    for i = 0, 3 do
        local weapon = read_dword(dyn_player + 0x2F8 + i * 4)
        local object = get_object_memory(weapon)
        if object ~= 0 then
            inventory[i + 1] = {
                id = read_dword(object),
                ammo = read_word(object + 0x2B6),
                clip = read_word(object + 0x2B8),
                ammo2 = read_word(object + 0x2C6),
                clip2 = read_word(object + 0x2C8),
                heat = read_float(object + 0x240),
                frags = read_byte(dyn_player + 0x31E),
                plasmas = read_byte(dyn_player + 0x31F)
            }
        end
    end
    return inventory
end
```

**Note:** Empty slots are skipped (not included in the table). The order matches the player's weapon selection.

---

## get_player_world_coordinates

Retrieves the player's actual world position, automatically adjusting for crouch height and vehicle offsets.

**Parameters:**
- `dyn_player` (number) - Dynamic player address.

**Returns:**  
`x, y, z` coordinates (adjusted).

**Code:**
```lua
local function getPlayerPosition(dyn_player)
    local crouch = read_float(dyn_player + 0x50C)
    local vehicle_id = read_dword(dyn_player + 0x11C)
    local vehicle_obj = get_object_memory(vehicle_id)
    local x, y, z
    if vehicle_id == 0xFFFFFFFF then
        x, y, z = read_vector3d(dyn_player + 0x5C)
    elseif vehicle_obj ~= 0 then
        x, y, z = read_vector3d(vehicle_obj + 0x5C)
    end
    local z_off = (crouch == 0) and 0.65 or 0.35 * crouch
    return x, y, z + z_off
end
```

**Why the offset?**  
Players have a small "eye height" above their feet. This function gives you the actual world location for collision checks, spawning effects, or distance calculations.

---

## get_table_length

Returns the total number of key-value pairs in a table - works for both array-style and dictionary-style tables (unlike the `#` operator).

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

## get_tag_referernce_address

Retrieves the memory address of a tag's data given its class and name. (Note the typo in the function name - it's intentional to match the original snippet.)

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

## get_weapon_slot

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

## map_object_scanner

A debugging tool that scans the map's tag table and prints all weapons, vehicles, and equipment with their metadata.

**Code:**
```lua
local format = string.format
local base_tag_table = 0x40440000

local function getClassName(class)
    return class == 0x76656869 and "vehi" 
        or class == 0x77656170 and "weap" 
        or class == 1701931376 and "eqip"
end

local function scanMapObjects()
    local tag_array = read_dword(base_tag_table)
    local tag_count = read_dword(base_tag_table + 0xC)
    for i = 0, tag_count - 1 do
        local tag = tag_array + 0x20 * i
        local class = read_dword(tag)
        local class_name = getClassName(class)
        if class_name then
            local name_ptr = read_dword(tag + 0x10)
            local name = (name_ptr ~= 0) and read_string(name_ptr) or "<no-name>"
            local meta = read_dword(tag + 0xC)
            local tag_data = read_dword(tag + 0x14)
            if tag_data ~= 0 then
                local b2 = read_byte(tag_data + 0x2)
                local b8 = read_byte(tag_data + 0x8)
                local d0 = read_dword(tag_data + 0x0)
                local d4 = read_dword(tag_data + 0x4)
                cprint(format(class_name .. " meta=%u tag_data=0x%X name=%s | b2=%d b8=%d d0=0x%X d4=0x%X",
                    meta, tag_data, name, b2, b8, d0, d4), 12)
            else
                cprint(format(class_name .. " meta=%u tag_data=nil name=%s", meta, name), 12)
            end
        end
    end
end
```

**When to use:** During map development or when you need to understand what objects a map contains.

---

## parse_args

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

## send_private_or_global_message

A unified function that sends a formatted message either to a specific player or to everyone (without the server prefix).

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

> **Important:** The variable `MSG_PREFIX` must be defined elsewhere in your script. The function temporarily removes it for clean global messages.

---

## set_respawn_time

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

## shuffle_table_fisher_yates

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

## vanish_player

"Vanishes" a player by moving them far off-map. The player sees themselves in a spectator-like state, but others cannot see them.

**Parameters:**
- `playerId` (number) - Player index.

**Code:**
```lua
local function vanish(playerId)
    local static_player = get_player(playerId)
    if not static_player then return end
    local dyn_player = get_dynamic_player(playerId)
    if dyn_player == 0 then return end
    local x, y, z = getPlayerPosition(dyn_player)
    if not x then return end
    local x_off, y_off, z_off = -1000, -1000, -1000
    write_float(static_player + 0xF8, x + x_off)
    write_float(static_player + 0xFC, y + y_off)
    write_float(static_player + 0x100, z + z_off)
end
```

**Important:** This must be called every tick (e.g., inside `OnTick`) to keep the player hidden. The offsets `0xF8`, `0xFC`, and `0x100` are the player's world position in the static player table.

**Use cases:** Invisibility for admins, "ghost" modes, or custom respawn systems.

---