---
layout: post
title: "SAPP Lua Snippets"
date: 31-03-2026
author: Jericho Crosby
categories: [ education, halo, modding ]
tags: [ sapp, lua, halo, scripting, tutorial ]
---

# broadcast_excluding_player

Sends a chat message to all connected players except the specified one.

**Parameters:**

* `message` `string` - Message to send.
* `exclude_player` `number` - Player index to exclude.

**Function Definition:**

```lua
local function sendExclude(message, exclude_player)
    for i = 1, 16 do
        if player_present(i) and i ~= exclude_player then
            say(i, message)
        end
    end
end
```

---

<br>
# check_if_player_in_vehicle

Determines if the player is currently inside a vehicle.

**Parameters:**

* `dyn_player` `number` - Dynamic player memory address.
  **Returns:**
* `boolean` - `true` if the player is in a vehicle, `false` otherwise.

**Function Definition:**

```lua
local function inVehicle(dyn_player)
    return read_dword(dyn_player + 0x11C) ~= 0xFFFFFFFF
end
```

---

<br>
# check_if_player_is_in_range

Determines if two 3D points are within a specified radius.
Uses squared distance comparison for efficiency.

**Parameters:**

* `x1, y1, z1` `number` - Coordinates of the first point.
* `x2, y2, z2` `number` - Coordinates of the second point.
* `radius` `number` - Radius distance.
  **Returns:**
* `boolean` - `true` if points are within radius, `false` otherwise.

**Function Definition:**

```lua
local function inRange(x1, y1, z1, x2, y2, z2, radius)
    local dx = x1 - x2
    local dy = y1 - y2
    local dz = z1 - z2
    return (dx * dx + dy * dy + dz * dz) <= (radius * radius)
end
```

---

<br>
# check_if_vehicle_occupied

Checks whether a specific vehicle object is currently occupied by any player.

**Parameters:**

* `vehicleObject` `number` - Vehicle object memory address.
  **Returns:**
* `boolean` - `true` if the vehicle is occupied, `false` otherwise.

**Function Definition:**

```lua
local function isVehicleOccupied(vehicleObject)
    -- Loop through all possible player indices (1-16)
    for i = 1, 16 do
        local dyn = get_dynamic_player(i)

        -- Skip if player is not present, not alive, or has no dynamic object
        if player_present(i) and player_alive(i) and dyn ~= 0 then
            local vehicle_id = read_dword(dyn + 0x11C)

            -- Skip if player is not in a vehicle
            if vehicle_id == 0xFFFFFFFF then goto next_player end

            local vehicle_obj = get_object_memory(vehicle_id)
            -- Return true if this player is in the target vehicle
            if vehicle_obj ~= 0 and vehicle_obj == vehicleObject then
                return true
            end

            ::next_player::
        end
    end

    return false
end
```

---

<br>
# check_player_invisibility_state

Determines if the specified player is currently invisible.

**Parameters:**

* `id` `number` - Player index (1-16).

**Returns:**

* `boolean` - `true` if invisible, `false` otherwise.

**Function Definition:**

```lua
local function isPlayerInvisible(id)
    local dyn_player = get_dynamic_player(id)
    local invisible = read_float(dyn_player + 0x37C)
    return dyn_player ~= 0 and invisible == 1
end
```

---

<br>
# clear_player_rcon_chat_buffer

Clears a player's RCON/Chat buffer by printing multiple blank lines.

**Parameters:**

* `id` `number` - Player index (1-16) whose console should be cleared.

**Function Definition:**

```lua
local function clearConsole(id)
    for _ = 1, 25 do
        rprint(id, " ")
    end
end
```

---

<br>
# custom_spawn_with_rotation

Writes position and rotation data to the dynamic object in memory.

**Parameters:**

* `dyn` `number` - Dynamic player memory address.
* `px` `number` - X coordinate for spawn.
* `py` `number` - Y coordinate for spawn.
* `pz` `number` - Z coordinate for spawn.
* `pR` `number` - Rotation in radians.
* `z_off` `number` *(optional)* - Vertical offset (default `0.3`).

**Function Definition:**

```lua
local function spawnObject(dyn, px, py, pz, pR, z_off)
    z_off = z_off or 0.3  -- default offset if not provided

    local x = px
    local y = py
    local z = pz + z_off
    local r = pR

    -- Write the 3D position to the dynamic object memory
    write_vector3d(dyn + 0x5C, x, y, z)

    -- Write the forward vector (direction) for rotation
    -- Convert rotation in radians to a unit vector on the XY plane
    write_vector3d(dyn + 0x74, math.cos(r), math.sin(r), 0)
end
```

---

<br>
# deep_copy_table

Creates a deep copy of a table, including nested tables and metatables.

**Note:**
This recurses into everything, including keys, values, and metatables. It's powerful but can cause infinite loops if the
table is self-referential.

**Parameters:**

* `orig` `any` - The value or table to copy.
  **Returns:**
* `any` - A fully independent copy of the original.

**Function Definition:**

```lua
local function deepCopy(orig)
    -- If it's not a table, return the value directly
    if type(orig) ~= "table" then
        return orig
    end

    -- Create a new table to hold the copy
    local copy = {}

    -- Recursively copy each key-value pair
    for key, value in pairs(orig) do
        copy[deep_copy(key)] = deep_copy(value)
    end

    -- Preserve the original table's metatable (also copied recursively)
    return setmetatable(copy, deep_copy(getmetatable(orig)))
end
```

---

<br>
# find_tag_by_name_substring

```lua
-- Scan tag table for tags whose path/name contains substring.
-- class_filter is optional (string like 'weap','eqip','vehi'); pass nil to search all classes.
local function findTagByNameSubstring(substring, class_filter)
    local base_tag_table = 0x40440000
    substring = substring:lower()
    local tag_array = read_dword(base_tag_table)
    local tag_count = read_dword(base_tag_table + 0xC)
    for i = 0, tag_count - 1 do
        local tag = tag_array + 0x20 * i
        local class = read_dword(tag) -- class as 4-char code (weap, eqip, etc)
        if class_filter == nil or class == read_dword(lookup_tag(class_filter, "")) then
            local name_ptr = read_dword(tag + 0x10)
            if name_ptr ~= 0 then
                local name = read_string(name_ptr)
                if name and name:lower():find(substring, 1, true) then
                    return read_dword(tag + 0xC) -- return MetaIndex
                end
            end
        end
    end
    return nil
end
```

---

<br>
# format_message_string

**Version 1**

**Message Templates (Local Constants):**

```lua
local HELLO_MESSAGE     = "Hello world!"
local PLAYER_JOINED     = "Player %s has joined the game."
local PLAYER_SCORE      = "%s scored %d points in %d minutes."
```

**Version 1: Format function using `string.format`**

```lua
-- Formats a string with optional arguments, similar to string.format
local function formatMessage(message, ...)
    -- Check if any extra arguments are provided
    if select('#', ...) > 0 then
        -- Format the string with the provided arguments
        return message:format(...)
    end

    -- Return the original string if no arguments are given
    return message
end
```

**Usage Examples:**

```lua
-- Example 1: No formatting arguments, returns original string
print(formatMessage(HELLO_MESSAGE))
-- Output: Hello world!

-- Example 2: Formatting with one argument
print(formatMessage(PLAYER_JOINED, "Chalwk"))
-- Output: Player Chalwk has joined the game.

-- Example 3: Formatting with multiple arguments
print(formatMessage(PLAYER_SCORE, "Chalwk", 150, 12))
-- Output: Chalwk scored 150 points in 12 minutes.
```

---

**Version 2:**

**Define message templates as constants:**

```lua
-- Message templates
local SCORE_MESSAGE   = "$name scored $points points in $minutes minutes."
local JOIN_MESSAGE    = "Player $name has joined the server."
local LEAVE_MESSAGE   = "Player $name has left the server."
```

**Placeholder-based formatting function:**

```lua
-- Replaces placeholders in messages with values from a table
local function formatMessage(message, vars)
    return (message:gsub("%$(%w+)", function(key)
        return vars[key] or "$" .. key  -- Leave unmatched placeholders intact
    end))
end
```

**Usage Examples:**

```lua
-- Player joins
local msg1 = formatMessage(JOIN_MESSAGE, {name = "Chalwk"})
print(msg1)
-- Output: Player Chalwk has joined the game.

-- Player scores points
local msg2 = formatMessage(SCORE_MESSAGE, {name = "Chalwk", points = 150, minutes = 12})
print(msg2)
-- Output: Chalwk scored 150 points in 12 minutes.

-- Player leaves (placeholder not fully provided)
local msg3 = formatMessage(LEAVE_MESSAGE, {})
print(msg3)
-- Output: Player $name has left the server.  (unmatched placeholders remain)
```

---

<br>
# get_aim_vector

Retrieves the desired aim vector from a dynamic object.

**Parameters:**

* `dyn` `number` - Dynamic object memory address.
  **Returns:**
* `number, number, number` - Desired aim vector components (camera X, camera Y, camera Z).

**Function Definition:**

```lua
local function getAimVector(dyn)
    local aim_x = read_float(dyn + 0x230)
    local aim_y = read_float(dyn + 0x234)
    local aim_z = read_float(dyn + 0x238)

    return aim_x, aim_y, aim_z
end
```

---

<br>
# get_base_directory_and_config_path

Here's a pair of functions for retrieving the **base Halo directory** and the **SAPP config directory**. Great for
building dynamic paths in scripts without hardcoding.

```lua
-- Returns the SAPP "config" directory path
-- Example: "C:\YourHaloServer\cg\sapp"
local function getConfigPath()
    return read_string(read_dword(sig_scan('68??????008D54245468') + 0x1))
end

-- Returns the base Server directory (optionally append a folder)
-- Example: "C:\YourHaloServer\" or "C:\YourHaloServer\logs"
local function getBaseDir(folder)
    folder = folder or "" -- optional subfolder
    local exe_path = read_string(read_dword(sig_scan('0000BE??????005657C605') + 0x3))
    local base_path = exe_path:match("(.*\\)") -- strip exe filename
    return base_path .. folder
end

-- Examples:
local base_dir = getBaseDir()       -- "C:\YourHaloServer\"
local maps_dir = getBaseDir("maps") -- "C:\YourHaloServer\maps"
local sapp_cg = getConfigPath()     -- "C:\YourHaloServer\cg\sapp"
```

---

<br>
# get_flag_object_meta_and_tag_name

Retrieves the meta ID and tag name of the flag (objective) in the map.

**Returns:**

* `flag_meta_id` (`number`) - Memory reference ID of the flag tag.
* `flag_tag_name` (`string`) - Name of the flag tag.

**Notes:**

* Iterates through all tags in the base tag table.
* Checks for weapon class (`"weap"`) with the specific bit set for objectives.
* Only returns the first tag where the objective type byte equals `0` (flag).
* Returns `nil, nil` if no valid flag is found.

**Function Definition:**

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

---

<br>
# get_object_tag_address

Retrieves the tag class and name of an object, with explanation of memory offsets, and demonstrates usage when a player
enters a vehicle.

## Functions:

**`getTag`**
Retrieves the tag class and name of an object.

**Parameters:**

* `object` `number` - Memory address of the object.
  **Returns:**
* `number` - Object class (byte).
* `string` - Tag class (e.g., `"vehi"`).
* `string` - Tag name  (e.g., `"vehicles\\warthog\\mp_warthog"`).

**Function Definition:**

```lua
local function getTag(object)
    -- Read the object tag class (byte at offset 0xB4)
    local tag_class = read_byte(object + 0xB4)
    
    -- Calculate the tag pointer:
    -- 1. read_word(object) gives the object's tag index
    -- 2. Multiply by 32 because each tag entry in the tag table is 32 bytes
    -- 3. Add the base address of the tag table (0x40440038) to get the tag's memory address
    local tag_address = read_word(object) * 32 + 0x40440038
    local tag_name = read_string(read_dword(tag_address))
    
    return tag_class, tag_name
end
```

**Example Usage: OnVehicleEnter**

```lua
function OnVehicleEnter(playerIndex)
    local dyn = get_dynamic_player(playerIndex)
    if dyn == 0 then return end

    local vehicle_id = read_dword(dyn + 0x11C)
    if vehicle_id == 0xFFFFFFFF then return end

    local vehicle_obj = get_object_memory(vehicle_id)
    if vehicle_obj == 0 then return end

    local tag_class, tag_name = getTag(vehicle_obj)
    
    print(tag_class, tag_name) -- Example output: "vehi", "vehicles\\warthog\\mp_warthog"
end
```

---

<br>
# get_objective_flag_or_oddball

Checks if the player's currently held weapon is an objective (oddball, flag, or any).

**Parameters:**

* `dyn_player` `number` - Dynamic player memory address.
* `objective_type` `string` *(optional)* - `"oddball"`, `"flag"`, or `"any"` (default: `"any"`).
  **Returns:**
* `boolean` - `true` if the currently held weapon matches the specified objective type, `false` otherwise.

**Function Definition:**

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

---

<br>
# get_player_inventory

Returns a table containing the player's weapons with ammo, clip, and stats.

**Parameters:**

* `dyn_player` `number` - The memory address of the player's dynamic object.
  **Returns:**
* `table` - An array-like table of weapons and their details:
    * `id` - Weapon ID
    * `ammo` - Primary ammo count
    * `clip` - Primary clip count
    * `ammo2` - Secondary ammo count
    * `clip2` - Secondary clip count
    * `heat` - Weapon heat (energy weapons)
    * `frags` - Player's frag count
    * `plasmas` - Player's plasma kills

**Function Definition:**

```lua
local function getInventory(dyn_player)
    local inventory = {}

    -- Loop through the 4 weapon slots (0-3)
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

---

<br>
# get_player_world_coordinates

Retrieves the player's world (x, y, z) coordinates with crouch height adjustment.

**Parameters:**

* `dyn_player` `number` - Dynamic player memory address.
  **Returns:**
* `x, y, z` `number` - Player’s X, Y, Z coordinates, adjusted for crouch.

**Function Definition:**

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

---

<br>
# get_table_length

Returns the number of elements in a table.
Works for tables with string keys (dictionary-style tables), since the length operator (`#`) only works reliably on
array-like tables.

**Parameters:**

* `tbl` `table` - The table to count elements in.
  **Returns:**
* `number` - The total number of key-value pairs in the table.

**Function Definition:**

```lua
local function tableLength(tbl)
    local count = 0
    -- Iterate through all key-value pairs in the table
    for _ in pairs(tbl) do
        count = count + 1
    end
    return count
end
```

---

### Examples

#### 1. Array-style table (numeric keys)

```lua
local t1 = {10, 20, 30, 40}
print(tableLength(t1)) -- 4
```

#### 2. Dictionary-style table (string keys)

```lua
local t2 = {name = "Jay", age = 32, city = "Christchurch"}
print(tableLength(t2)) -- 3
```

#### 3. Mixed keys (numeric + string)

```lua
local t3 = {1, 2, 3, foo = "bar", hello = "world"}
print(tableLength(t3)) -- 5
```

#### 4. Empty table

```lua
local t4 = {}
print(tableLength(t4)) -- 0
```

#### 5. Nested tables

```lua
local t5 = {
    name = "Kai",
    hobbies = {"drawing", "music"},
    info = {height = 165, weight = 50}
}
print(tableLength(t5)) -- 3  (top-level keys only)
```

#### 6. Sparse array (holes in numeric indices)

```lua
local t6 = {}
t6[1] = "a"
t6[3] = "b"
print(tableLength(t6)) -- 2 (only counts actual keys present)
```

---

<br>
# get_tag_referernce_address

Retrieves the memory address of a tag given its class and name.

**Parameters:**

* `class` `string` - Tag class identifier (e.g., `"weap"`, `"vehi"`).
* `name` `string` - Tag name (e.g., `"weapons\\pistol\\pistol"`).
  **Returns:**
* `number|nil` - Memory address of the tag data, or `nil` if not found.

**Function Definition:**

```lua
local function getTag(class, name)
    local tag = lookup_tag(class, name)
    return tag and read_dword(tag + 0xC) or nil
end
```

---

<br>
# get_weapon_slot

Retrieves the weapon slot byte from the dynamic player object.

**Parameters:**

* `dyn_player` `number` - Dynamic player memory address.
  **Returns:**
* `number` - Weapon slot (byte).

**Function Definition:**

```lua
local function getWeaponSlot(dyn_player)
    return read_byte(dyn_player + 0x2F2)
end
```

---

<br>
# map_object_scanner

Scans the map's tag table in memory to find all weapons, vehicles, and equipment. For each tag, it reads the class,
name, metadata ID, and some key data bytes, then prints them in a readable format. Essentially, it's a tool for
exploring and debugging the properties of objects on a Halo map.

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

---

<br>
# parse_args

Splits a string into substrings based on a delimiter.
Useful for parsing command-line style arguments or CSV-like input.

**Parameters:**

* `input` `string` - The string to split.
* `delimiter` `string` - The character to split on (e.g., `" "`, `","`, `";"`).
  **Returns:**
* `table` - An array-like table containing the split substrings.

**Function Definition:**

```lua
local function parseArgs(input, delimiter)
    local result = {}
    -- Use Lua's pattern matching to find sequences between delimiters
    for substring in input:gmatch("([^" .. delimiter .. "]+)") do
        -- Append each substring to the result table
        result[#result + 1] = substring
    end
    return result
end
```

---

<br>
# send_private_or_global_message

Sends a formatted message to all players (global) or a single player (private).

**Parameters:**

* `player_id` `number|nil` - Player index (1-16) to send a private message.
    * If `nil`, the message is broadcast to all players.
* `...` `varargs` - Arguments passed to `string.format` for message text.

**Notes:**

* Uses `say_all()` for global messages, but temporarily removes the server prefix (`msg_prefix`) so only your message
  shows.
* Private messages are sent with `rprint()` to the target player.
* `MSG_PREFIX` is expected to be defined elsewhere in your script.

**Example Usage:**

```lua
-- Broadcast to all players
send(nil, "Server restarting in %d seconds!", 30)

-- Send privately to player 3
send(3, "Hello %s, welcome!", get_var(3, "$name"))
```

**Function Definition:**

```lua
local format = string.format

local function send(player_id, ...)
    if not player_id then
        -- No player id given > send to everyone
        execute_command('msg_prefix ""') -- temporarily remove prefix
        say_all(format(...)) -- global broadcast
        execute_command('msg_prefix "' .. MSG_PREFIX .. '"') -- restore prefix
        return
    end
    -- Send private message to a specific player
    rprint(player_id, format(...))
end
```

---

<br>
# set_respawn_time

Sets the respawn time for a player - Writes the respawn time directly to the player table memory.

**Parameters:**

* `playerIndex` `number` - Index of the player (1-16).
* `respawnTime` `number` *(optional)* - Time in seconds before the player respawns. Defaults to 3 seconds.

**Function Definition:**

```lua
local function setRespawnTime(playerIndex, respawnTime)
    -- Default respawn time to 3 seconds if not provided
    respawnTime = respawnTime or 3

    -- Get the static memory address of the player's table entry
    local static_player = get_player(playerIndex)

    if static_player then
        -- Write respawn time in ticks (1 tick ≈ 1/33 seconds)
        write_dword(static_player + 0x2C, respawnTime * 33)
    end
end
```

---

<br>
# shuffle_table_fisher_yates

Shuffles the elements of an array-like table in place using the Fisher-Yates algorithm.
Works only for sequential (array-style) tables with integer keys.
Each element has an equal chance of ending up in any position.

**Parameters:**

* `tbl` `table` - The array-like table to shuffle.

**Function Definition:**

```lua
local function shuffleTable(tbl)
    -- Start from the end of the table and work backwards
    for i = #tbl, 2, -1 do
        -- Pick a random index from 1 to i
        local j = math.random(i)
        -- Swap the elements at positions i and j
        tbl[i], tbl[j] = tbl[j], tbl[i]
    end
end
```

---

<br>
# vanish_player

Relocates a player off-map by modifying their world coordinates.

See #"Get Player World Coordinates" for the `getPlayerPosition()` helper function.

**Technical Note:** Writing to `0xF8`, `0xFC`, and `0x100` hides the player from other players, but from the playerId's
perspective, they remain on the map in a "spectator-like" state.
**Parameters:**

* `playerId` `number` - Index of the player (1-16).
  **Usage:**
* Call this function every tick to maintain the hidden state.

**Function Definition:**

```lua
local function vanish(playerId)
    -- Get the static player table address
    local static_player = get_player(playerId)
    if not static_player then return end

    -- Get the dynamic player object
    local dyn_player = get_dynamic_player(playerId)
    if dyn_player == 0 then return end

    -- Get current player position
    local x, y, z = getPlayerPosition(dyn_player)
    if not x then return end

    -- Off-map offsets
    local x_off, y_off, z_off = -1000, -1000, -1000

    -- Relocate player off-map by writing new coordinates to player table
    write_float(static_player + 0xF8, x + x_off)
    write_float(static_player + 0xFC, y + y_off)
    write_float(static_player + 0x100, z + z_off)
end
```