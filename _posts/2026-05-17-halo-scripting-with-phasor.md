---
title: "Scripting with Phasor - Server-Side Lua"
date: 2026-05-17
categories: [ education, halo, modding ]
tags: [ phasor, lua, scripting, server ]
---

Phasor is a **server-side** extension for Halo PC/Custom Edition. It exposes a Lua Scripting API, anti-cheat tools,
event hooks, command handling, player management, logging, and numerous under-the-hood features. **This guide focuses on
its Lua API**, walks through the core scripting model and practical examples so you can build your Lua scripts.

**Important:** <u>Phasor's Lua API is based on <strong>Lua 5.2</strong>.</u>

This guide assumes you have read:

- [Common Lua References](2026-05-17-halo-lua-common-references.md)
- [Memory Offsets Deep Dive](2025-09-07-halo-understanding-memory-offsets.md).

---

## Script Skeleton & Version Check

See [full blank script](https://github.com/Chalwk/SPCLib/blob/master/phasor/blank_script_template.md) for a complete
example.

Every Phasor Lua script **must** define `GetRequiredVersion()` and return `200`, and define `OnScriptLoad()`.  
Without these, Phasor will not load the script.

```lua
function GetRequiredVersion()  -- Required or script will not load
    return 200
end

function OnScriptLoad(processId, game, persistent) -- Required or script will not load
    -- processId  : number (the process ID of the server)
    -- game       : number (the game being played: "PC", "CE")
    -- persistent : boolean (true if script is persistent)
end

function OnScriptUnload() -- Optional, but recommended to avoid Lua errors on unload
    -- Cleanup code (optional)
end
```

---

## Where to Put Your Scripts

Phasor looks for Lua scripts in its `scripts` folder. Typical path: `./cg/scripts/`.

---

## Script management commands

- `sv_script_load` `[script]` `[persistent]`
- `sv_script_unload` `[script]`
- `sv_script_reload` `[script]`
- `sv_script_list`

---

## Handling Game Version (PC vs CE)

Because Phasor cannot scan signatures, you must use the `game` parameter to select the correct hardcoded addresses.
The [Common Lua References](2026-05-17-halo-lua-common-references.md) provides many offsets - here's a practical
example:

```lua
local gametype_base

local function get_score_limit()
    return readbyte(gametype_base + 0x58)
end

function OnScriptLoad(processid, game, persistent)
    if game == "PC" then
        gametype_base = 0x671340
    else  -- CE
        gametype_base = 0x5F5498
    end
end
```

---

## Phasor Functions Reference

### General Functions

| Function                    | Description                                                                                                           |
|-----------------------------|-----------------------------------------------------------------------------------------------------------------------|
| `hprintf(message)`          | Prints text to the server terminal.                                                                                   |
| `resolveplayer(player)`     | Converts a memory ID (0-based) to an RCON/player ID (1-based).                                                        |
| `rresolveplayer(player)`    | Converts an RCON ID (1-based) back to a memory ID (0-based).                                                          |
| `getrandomnumber(min, max)` | Returns a pseudo-random integer between `min` and `max` inclusive.                                                    |
| `svcmd(cmd)`                | Executes a server command string (e.g., `sv_cmd "sv_kick 5"`). Player indices must be RCON IDs (use `resolveplayer`). |
| `getprofilepath()`          | Returns the server's data path (where `banlist.txt` is stored).                                                       |

### Memory Reading

| Function                                 | Description                                                                  |
|------------------------------------------|------------------------------------------------------------------------------|
| `readbit(data, data_offset, bit_offset)` | Reads a single bit (0 or 1) from `data + data_offset` at `bit_offset` (0-7). |
| `readbyte(address)`                      | Reads an unsigned 8-bit byte (0-255).                                        |
| `readchar(address)`                      | Reads a signed 8-bit byte (-128 to 127).                                     |
| `readword(address)`                      | Reads an unsigned 16-bit integer (0-65535).                                  |
| `readshort(address)`                     | Reads a signed 16-bit integer (-32768 to 32767).                             |
| `readdword(address)`                     | Reads an unsigned 32-bit integer (0-4294967295).                             |
| `readint(address)`                       | Reads a signed 32-bit integer.                                               |
| `readfloat(address)`                     | Reads a 32-bit floating point number.                                        |
| `readdouble(address)`                    | Reads a 64-bit double-precision float.                                       |
| `readstring(address, [length])`          | Reads a null-terminated ASCII string (optional max length).                  |
| `readwidestring(address, [length])`      | Reads a null-terminated UTF-16LE string (converted to ASCII).                |

### Memory Writing

| Function                                            | Description                               |
|-----------------------------------------------------|-------------------------------------------|
| `writebit(data_addr, data_offset, bit_offset, bit)` | Writes a bit to memory.                   |
| `writebyte(address, value)`                         | Writes an unsigned 8-bit byte.            |
| `writechar(address, value)`                         | Writes a signed 8-bit byte.               |
| `writeword(address, value)`                         | Writes an unsigned 16-bit integer.        |
| `writeshort(address, value)`                        | Writes a signed 16-bit integer.           |
| `writedword(address, value)`                        | Writes an unsigned 32-bit integer.        |
| `writeint(address, value)`                          | Writes a signed 32-bit integer.           |
| `writefloat(address, value)`                        | Writes a 32-bit floating point number.    |
| `writedouble(address, value)`                       | Writes a 64-bit double.                   |
| `writestring(address, str, [length])`               | Writes a null-terminated ASCII string.    |
| `writewidestring(address, str, [length])`           | Writes a null-terminated UTF-16LE string. |

### Player & Team Functions

| Function                      | Description                                                                                   |
|-------------------------------|-----------------------------------------------------------------------------------------------|
| `getplayer(player)`           | Returns the memory address of a player table entry (0-based).                                 |
| `getname(player)`             | Returns the player's name (ASCII).                                                            |
| `gethash(player)`             | Returns the player's CD-key hash (unique identifier).                                         |
| `getteam(player)`             | Returns the player's team (0 = Red, 1 = Blue).                                                |
| `getteamsize(team)`           | Returns the number of players on the specified team.                                          |
| `changeteam(player)`          | Switches the player's team.                                                                   |
| `kill(player)`                | Kills the specified player.                                                                   |
| `applycamo(player, duration)` | Makes the player invisible (camo) for `duration` seconds. Use `0` for infinite (until death). |
| `setspeed(player, speed)`     | Changes the player's movement speed. Default is `1.0`.                                        |
| `isadmin(player)`             | Returns `true` if the player is an admin, `false` otherwise.                                  |

### Object Functions

| Function                                                               | Description                                                                                                                                                                                                                                                                                                                                                                                                         |
|------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `getobject(m_objId)`                                                   | Converts an object ID into its memory address for reading/writing.                                                                                                                                                                                                                                                                                                                                                  |
| `getplayerobjectid(player)`                                            | Returns the object ID of the player's biped (`0xFFFFFFFF` if dead/invalid).                                                                                                                                                                                                                                                                                                                                         |
| `getobjectcoords(m_objectId)`                                          | Returns the (x, y, z) coordinates of an object. If a player is in a vehicle, returns the vehicle's coordinates.                                                                                                                                                                                                                                                                                                     |
| `gettagid(tagType, tag)`                                               | Returns the map ID of a tag given its type (e.g., `"weap"`) and full name (e.g., `"weapons\\pistol\\pistol"`).                                                                                                                                                                                                                                                                                                      |
| `createobject(tagType, tag, parentId, respawnTime, bRecycle, x, y, z)` | Creates a new object. Returns its object ID. Parameters: `tagType` (e.g., `"weap"`), `tag` (full tag name), `parentId` (object ID of parent, or `-1`), `respawnTime` (seconds; `0` = never, `-1` = gametype default), `bRecycle` (`true` = respawn, `false` = destroy), and `x,y,z` coordinates. For item collections (weapons, nades, powerups), `bRecycle` is ignored and `respawnTime` is the destruction delay. |
| `destroyobject(m_objectId)`                                            | Deletes an object. **Ensure the object ID is valid** to avoid crashes.                                                                                                                                                                                                                                                                                                                                              |
| `movobjcoords(m_objectId, x, y, z)`                                    | Teleports an object to absolute coordinates.                                                                                                                                                                                                                                                                                                                                                                        |
| `movobjname(m_objectId, name)`                                         | Teleports an object to a named location (e.g., `"redbase"`).                                                                                                                                                                                                                                                                                                                                                        |
| `assignweapon(player, m_objectId)`                                     | Gives the specified weapon object to a player (if they have fewer than 4 weapons).                                                                                                                                                                                                                                                                                                                                  |
| `updateammo(m_weaponId)`                                               | Forces ammo changes on a weapon to sync correctly.                                                                                                                                                                                                                                                                                                                                                                  |
| `entervehicle(player, m_vehicleId, seat)`                              | Forces a player into a vehicle (`seat`: 0 = driver, 1 = passenger, 2 = gunner). Ensure the player is not already in a vehicle.                                                                                                                                                                                                                                                                                      |
| `exitvehicle(player)`                                                  | Forces a player to exit their current vehicle.                                                                                                                                                                                                                                                                                                                                                                      |

### Chat & Console Output

| Function                  | Description                                   |
|---------------------------|-----------------------------------------------|
| `say(msg)`                | Broadcasts a message to all players.          |
| `privatesay(player, msg)` | Sends a private message to a specific player. |
| `respond(msg)`            | Sends a message to the server terminal.       |
| `hprint(msg)`             | Sends a message to the server terminal.       |
| `print(msg)`              | Sends a message to the server terminal.       |

### Timer Functions

| Function                              | Description                                                                                                                                                                                         |
|---------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `registertimer(delay, callback, ...)` | Creates a timer that calls `callback` after `delay` milliseconds. The callback can return `1` to repeat or `0` to stop. Extra arguments are passed to the callback as userdata. Returns a timer ID. |
| `removetimer(id)`                     | Stops and removes a timer created by `registertimer`.                                                                                                                                               |

**Callback signature:** `function callback(id, count, userdata1, userdata2, ...)` — `count` is the number of times the
timer has fired.

**Example:**

```lua
-- registertimer: call function after delay (ms), can repeat
function my_callback(id, count, msg)
    hprintf("Timer " .. id .. " fired " .. count .. " times. Msg: " .. msg)
    if count >= 3 then
        return 0  -- stop after 3 times
    end
    return 1  -- repeat
end

local timer_id = registertimer(1000, "my_callback", "Hello Timer")

-- removetimer: stop timer early (e.g., on script unload)
removetimer(timer_id)
```

---

## Utility Functions Library

The following functions are user-defined Lua helpers that build on the Phasor API. They simplify common tasks such as
player state queries, object manipulation, memory I/O, and gametype handling.  
**Note:** Many functions rely on global variables like `gametype_base`, `map_pointer`, `ctf_globals`, etc. You must set
these in `OnScriptLoad` based on the game version (PC or CE) using the offsets from the Common Lua References.

### Player State & Info

#### get_player_biped

**Parameters:**  
`id` - Player index (0-based memory ID)

**Returns:**  
`object_struct` (table), `object_id` (number) - The player's biped object and its ID, or `nil` if dead/invalid.

```lua
local function get_player_biped(id)
    local obj_id = getplayerobjectid(id)
    if not obj_id or obj_id == 0 then return nil end
    return getobject(obj_id), obj_id
end
```

**Example:**

```lua
local obj, obj_id = get_player_biped(0)
if obj then
    print("Player 0 biped address: " .. tostring(obj))
end
```

#### is_alive

**Parameters:**  
`id` - Player index (0-based)

**Returns:**  
`boolean` - `true` if the player has a valid biped object.

```lua
local function is_alive(id)
    if id == nil then return false end
    return getplayerobjectid(id) ~= nil
end
```

**Example:**

```lua
if is_alive(3) then
    kill(3)
end
```

#### get_player_pos

**Parameters:**  
`id` - Player index (0-based)

**Returns:**  
`x`, `y`, `z` (numbers) - World coordinates compensating for crouch, or `nil` if the player is invalid.

```lua
local function get_player_pos(id)
    local obj, obj_id = get_player_biped(id)
    if not obj then return nil end

    local x = readfloat(obj, 0x5C)
    local y = readfloat(obj, 0x60)
    local z = readfloat(obj, 0x64)
    local crouch = readfloat(obj + 0x50C)

    -- 0.65 is standing eye height, 0.35 is crouching adjustment
    local z_offset = (crouch == 0) and 0.65 or 0.35 * crouch
    return x, y, z + z_offset
end
```

**Example:**

```lua
local x, y, z = get_player_pos(2)
if x then
    print(string.format("Player 2 position: %.2f, %.2f, %.2f", x, y, z))
end
```

#### is_player_camouflaged

**Parameters:**  
`id` - Player index (0-based)

**Returns:**  
`boolean` - `true` if the player is invisible (camo active).

```lua
local function is_player_camouflaged(id)
    local obj = get_player_biped(id)
    if not obj then return nil end
    return readfloat(obj + 0x37C) == 1.0
end
```

#### get_player_stats

**Parameters:**  
`id` - Player index (0-based)

**Returns:**  
`table` or `nil` - Contains keys: `kills`, `deaths`, `assists`, `streaks`, `flag_captures`, `flag_returns`,
`flag_grabs`.

```lua
local function get_player_stats(id)
    local p = getplayer(id)
    if not p then return nil end

    return {
        kills = readword(p + 0x9C),
        deaths = readword(p + 0xAE),
        assists = readword(p + 0xA4),
        streaks = readword(p + 0x98),
        flag_captures = readword(p + 0xC8),
        flag_returns = readword(p + 0xC6),
        flag_grabs = readword(p + 0xC4)
    }
end
```

**Example:**

```lua
local stats = get_player_stats(1)
if stats then
    say(string.format("Player has %d kills, %d deaths", stats.kills, stats.deaths))
end
```

#### get_player_vehicle

**Parameters:**  
`id` - Player index (0-based)

**Returns:**  
`number` - Vehicle object ID, or `nil` if not in a vehicle.

```lua
local function get_player_vehicle(id)
    local obj, obj_id = get_player_biped(id)
    if not obj then return nil end

    local vehicle_id = readdword(obj + 0x11C)
    if vehicle_id == 0xFFFFFFFF then return nil end

    return vehicle_id
end
```

#### is_in_vehicle

**Parameters:**  
`id` - Player index (0-based)

**Returns:**  
`boolean` - `true` if the player is inside any vehicle.

```lua
local function is_in_vehicle(id)
    return get_player_vehicle(id) ~= nil
end
```

#### get_player_health

**Parameters:**  
`id` - Player index (0-based)

**Returns:**  
`number` or `nil` - Health value between 0.0 and 1.0.

```lua
local function get_player_health(id)
    local obj = get_player_biped(id)
    if not obj then return nil end
    return readfloat(obj + 0xE0)
end
```

**Example:**

```lua
local health = get_player_health(3)
if health and health < 0.3 then
    set_player_health(3, 1.0) -- full heal
    privatesay(3, "You have been healed!")
end
```

#### get_player_shields

**Parameters:**  
`id` - Player index (0-based)

**Returns:**  
`number` or `nil` - Shields value (0.0 to ~3.0 with overshield).

```lua
local function get_player_shields(id)
    local obj = get_player_biped(id)
    if not obj then return nil end
    return readfloat(obj + 0xE4)
end
```

#### set_player_health

**Parameters:**  
`id` - Player index (0-based)  
`value` - Desired health (0.0 to 1.0)

```lua
local function set_player_health(id, value)
    local obj = get_player_biped(id)
    if obj then
        writefloat(obj + 0xE0, value)
    end
end
```

#### set_player_shields

**Parameters:**  
`id` - Player index (0-based)  
`value` - Desired shields (0.0 to 3.0)

```lua
local function set_player_shields(id, value)
    local obj = get_player_biped(id)
    if obj then
        writefloat(obj + 0xE4, value)
    end
end
```

#### get_player_ping

**Parameters:**  
`id` - Player index (0-based)

**Returns:**  
`number` or `nil` - Ping in milliseconds.

```lua
local function get_player_ping(id)
    local p = getplayer(id)
    if not p then return nil end
    return readword(p + 0xDC)
end
```

**Example:**

```lua
local ping = get_player_ping(0)
hprintf(string.format("%s ping: %d ms", getname(0), ping))
```

#### get_player_weapon

**Parameters:**  
`id` - Player index (0-based)  
`slot` (optional) - Weapon slot 1-4. If omitted, returns the current weapon (or vehicle weapon if in vehicle).

**Returns:**  
`number` - Weapon object ID, or `0xFFFFFFFF` if none.

```lua
local function get_player_weapon(id, slot)
    local obj, obj_id = get_player_biped(id)
    if not obj then return 0xFFFFFFFF end

    -- If the player is in a vehicle, return the vehicle's weapon.
    local vehicle_id = get_player_vehicle(id)
    if vehicle_id then
        local veh_obj = getobject(vehicle_id)
        if veh_obj then
            return readdword(veh_obj + 0x2F8)
        end
    end

    if not slot then
        return readdword(obj + 0x118) -- current weapon
    end

    if slot >= 1 and slot <= 4 then
        return readdword(obj + 0x2F8 + (slot - 1) * 4)
    end

    return 0xFFFFFFFF
end
```

#### get_players_by_expression

**Parameters:**  
`expression` - String (e.g., `"*"`, `"me"`, `"red"`, `"blue"`, `"random"`, `"nearest"`, `"farthest"`, colour name,
wildcard name, or numeric ID 1-16)  
`self_id` (optional) - Player index used for `"me"`, `"random"` exclusion, and as reference for `"nearest"`/
`"farthest"`.

**Returns:**  
`table` or `nil` - List of player indices (0-based) matching the expression.

```lua
local function get_players_by_expression(expression, self_id)
    if not expression then return nil end

    -- All players
    if expression == "*" then
        local t = {}
        for i = 0, 15 do
            if getplayer(i) then t[#t + 1] = i end
        end
        return #t > 0 and t or nil

        -- Self
    elseif expression == "me" then
        if self_id and getplayer(self_id) then return { self_id } end
        return nil

        -- Red team
    elseif expression == "red" then
        local t = {}
        for i = 0, 15 do
            if getplayer(i) and getteam(i) == 0 then t[#t + 1] = i end
        end
        return #t > 0 and t or nil

        -- Blue team
    elseif expression == "blue" then
        local t = {}
        for i = 0, 15 do
            if getplayer(i) and getteam(i) == 1 then t[#t + 1] = i end
        end
        return #t > 0 and t or nil

        -- Random player
    elseif expression == "random" or expression == "rand" then
        local t = {}
        for i = 0, 15 do
            if getplayer(i) and i ~= self_id then t[#t + 1] = i end
        end
        if #t > 0 then return { t[random(#t)] } end
        return nil

        -- Nearest player to self
    elseif expression == "nearest" or expression == "closest" then
        if not self_id or not get_player_pos(self_id) then return nil end
        local sx, sy, sz = get_player_pos(self_id)
        local min_dist, closest = math_huge, nil
        for i = 0, 15 do
            if i ~= self_id and getplayer(i) then
                local x, y, z = get_player_pos(i)
                if x then
                    local d = (x - sx) ^ 2 + (y - sy) ^ 2 + (z - sz) ^ 2
                    if d < min_dist then
                        min_dist = d
                        closest = i
                    end
                end
            end
        end
        return closest and { closest } or nil

        -- Farthest player from self
    elseif expression == "farthest" then
        if not self_id or not get_player_pos(self_id) then return nil end
        local sx, sy, sz = get_player_pos(self_id)
        local max_dist, farthest = -1, nil
        for i = 0, 15 do
            if i ~= self_id and getplayer(i) then
                local x, y, z = get_player_pos(i)
                if x then
                    local d = (x - sx) ^ 2 + (y - sy) ^ 2 + (z - sz) ^ 2
                    if d > max_dist then
                        max_dist, farthest = d, i
                    end
                end
            end
        end
        return farthest and { farthest } or nil
    else
        -- Numeric ID (1-16)
        local num = tonumber(expression)
        if num and num >= 1 and num <= 16 then
            local id = num - 1
            if getplayer(id) then return { id } end
            return nil
        end

        -- Player colour name (e.g. "white", "yellow", "green", "orange", "purple", etc.)
        local colour_index = player_colours[expression]
        if colour_index then
            local t = {}
            for i = 0, 15 do
                local p = getplayer(i)
                if p and readword(p + 0x60) == colour_index then
                    t[#t + 1] = i
                end
            end
            return #t > 0 and t or nil
        end

        -- Wildcard name matching (case-insensitive)
        local t = {}
        for i = 0, 15 do
            if getplayer(i) then
                local name = getname(i)
                if wildcard_match(name, expression) then
                    t[#t + 1] = i
                end
            end
        end
        return #t > 0 and t or nil
    end
end
```

**Example:**

```lua
local players = get_players_by_expression("red", nil)
if players then
    for _, id in ipairs(players) do
        say(getname(id) .. " is on red team!")
    end
end
```

#### get_player_color

**Parameters:**  
`id` - Player index (0-based)

**Returns:**  
`number` or `nil` - Colour index (0-17) as seen by others.

```lua
local function get_player_color(id)
    local p = getplayer(id)
    if p then return readword(p + 0x60) end
    return nil
end
```

#### set_player_color

**Parameters:**  
`id` - Player index (0-based)  
`colour` - Colour index (0-17) or colour name string (e.g., `"white"`, `"yellow"`). A respawn is usually required for
the change to fully apply.

```lua
local function set_player_color(id, colour)
    local p = getplayer(id)
    if not p then return end

    if type(colour) == "string" then
        colour = player_colours[colour:lower()]
    end
    if not colour or type(colour) ~= "number" then return end

    writebyte(p + 0x60, colour)
end
```

#### get_player_object

**Parameters:**  
`id` - Player index (0-based)

**Returns:**  
`object_struct`, `object_id` - Same as `get_player_biped`.

```lua
local function get_player_object(id)
    return get_player_biped(id)
end
```

#### get_player_vehicle_object

**Parameters:**  
`id` - Player index (0-based)

**Returns:**  
`vehicle_struct`, `vehicle_id` - The vehicle object and its ID, or `nil` if not in a vehicle.

```lua
local function get_player_vehicle_object(id)
    local obj, obj_id = get_player_object(id)
    if not obj then return nil end
    local veh_id = readdword(obj + 0x11C)
    if veh_id == 0xFFFFFFFF then return nil end
    local veh_obj = getobject(veh_id)
    if not veh_obj then return nil end
    return veh_obj, veh_id
end
```

#### get_player_weapon_object

**Parameters:**  
`id` - Player index (0-based)  
`slot` (optional) - Same as `get_player_weapon`.

**Returns:**  
`weapon_struct`, `weapon_id` - The weapon object and its ID, or `nil`.

```lua
local function get_player_weapon_object(id, slot)
    local weapon_id = get_player_weapon(id, slot)
    if weapon_id == 0xFFFFFFFF then return nil end
    local weapon_obj = getobject(weapon_id)
    if not weapon_obj then return nil end
    return weapon_obj, weapon_id
end
```

#### get_player_speed

**Parameters:**  
`id` - Player index (0-based)

**Returns:**  
`number` or `nil` - Current movement speed multiplier.

```lua
local function get_player_speed(id)
    local p = getplayer(id)
    if not p then return nil end
    return readfloat(p + 0x6C)
end
```

#### set_player_speed

**Parameters:**  
`id` - Player index (0-based)  
`speed` - Desired speed multiplier (capped to 999999 to avoid crashes).

```lua
local function set_player_speed(id, speed)
    local p = getplayer(id)
    if not p then return end
    speed = tonumber(speed) or 1
    if speed > 999999 then speed = 999999 end
    writefloat(p + 0x6C, speed)
end
```

### Object Utilities

#### get_object_coords

**Parameters:**  
`object_id` - Object ID (e.g., from `getplayerobjectid`)

**Returns:**  
`x`, `y`, `z` - Coordinates of the object (if attached to a parent vehicle, returns parent's coordinates).

```lua
local function get_object_coords(object_id)
    local obj = getobject(object_id)
    if not obj then return nil end

    local parent_id = readdword(obj + 0x11C)
    if parent_id ~= 0xFFFFFFFF then
        local parent_obj = getobject(parent_id)
        if parent_obj then obj = parent_obj end
    end

    return readfloat(obj + 0x5C), readfloat(obj + 0x60), readfloat(obj + 0x64)
end
```

#### get_object_tag

**Parameters:**  
`object_id` - Object ID

**Returns:**  
`tag_name`, `tag_class` - The tag name (e.g., `"vehicles\\ghost\\ghost_mp"`) and class (e.g., `"vehi"`), or `nil`.

```lua
local tag_lookup_cache
local function get_object_tag(object_id)
    if not object_id then return nil end
    local obj = getobject(object_id)
    if not obj then return nil end
    local object_map_id = readdword(obj)

    if not tag_lookup_cache then
        local map_base = readdword(map_pointer)
        if not map_base then return nil end

        local map_tag_count = to_decimal(read_string_reverse(map_base + 0xC, 3))
        if not map_tag_count then return nil end

        local tag_table_base = map_base + 0x28
        local tag_table_size = 0x20
        tag_lookup_cache = {}

        for i = 0, map_tag_count - 1 do
            local base = tag_table_base + (tag_table_size * i)
            local tag_id = to_decimal(read_string_reverse(base + 0xC, 3))
            local tag_class = read_string(base, 4, true)
            local tag_name_addr = to_decimal(read_string_reverse(base + 0x10, 3))
            local tag_name = read_tag_name(tag_name_addr)
            tag_lookup_cache[tag_id] = { name = tag_name, class = tag_class }
        end
    end

    local entry = tag_lookup_cache[object_map_id]
    if entry then return entry.name, entry.class end
    return nil
end
```

#### get_tag_id

**Parameters:**  
`tag_class` - String, e.g., `"weap"`  
`tag_name` - String, e.g., `"weapons\\pistol\\pistol"`

**Returns:**  
`number` or `nil` - Tag map ID, or `nil` if not found.

```lua
local function get_tag_id(tag_class, tag_name)
    if not tag_class or not tag_name then return nil end
    -- ensure cache is built
    if not tag_lookup_cache then
        local map_base = readdword(map_pointer)
        if not map_base then return nil end
        local map_tag_count = to_decimal(read_string_reverse(map_base + 0xC, 3))
        if not map_tag_count then return nil end

        local tag_table_base = map_base + 0x28
        local tag_table_size = 0x20
        tag_lookup_cache = {}
        for i = 0, map_tag_count - 1 do
            local base = tag_table_base + (tag_table_size * i)
            local tag_id = to_decimal(read_string_reverse(base + 0xC, 3))
            local cls = read_string(base, 4, true)
            local tname_addr = to_decimal(read_string_reverse(base + 0x10, 3))
            local tname = read_tag_name(tname_addr)
            tag_lookup_cache[tag_id] = { name = tname, class = cls }
        end
    end

    for id, info in pairs(tag_lookup_cache) do
        if info.class == tag_class and (info.name == tag_name or info.name:gsub("\\", "/") == tag_name:gsub("\\", "/")) then
            return id
        end
    end
    return nil
end
```

#### get_object_type

**Parameters:**  
`object_id` - Object ID

**Returns:**  
`number` or `nil` - Type identifier (0=biped, 1=vehicle, 2=weapon, 3=equipment, etc.).

```lua
local function get_object_type(object_id)
    local obj = getobject(object_id)
    if not obj then return nil end
    return readword(obj + 0xB4)
end
```

#### upright_vehicle

**Parameters:**  
`vehicle_id` - Object ID of the vehicle

**Effect:** Zeroes angular velocity and re-enables physics to set the vehicle upright.

```lua
local function upright_vehicle(vehicle_id)
    local obj = getobject(vehicle_id)
    if not obj then return end
    writefloat(obj + 0x8A, 2.3 * (10 ^ -41))
    writefloat(obj + 0x8C, 2.3 * (10 ^ -41))
    writefloat(obj + 0x90, 2.3 * (10 ^ -41))
    writefloat(obj + 0x94, 2.3 * (10 ^ -41))
    write_bit(obj + 0x10, 0, 0) -- noCollisions off
    write_bit(obj + 0x10, 5, 0) -- ignorePhysics off
end
```

#### upright_player_vehicle

**Parameters:**  
`player_id` - Player index (0-based)

**Effect:** Uprights the vehicle the player is currently riding (if any).

```lua
local function upright_player_vehicle(player_id)
    local veh_id = get_player_vehicle(player_id)
    if veh_id then
        upright_vehicle(veh_id)
    end
end
```

### Memory Utilities

The following helpers extend Phasor's memory functions with safer writes and convenient string/bit operations.

#### read_string

**Parameters:**  
`address` - Starting memory address  
`length` (optional) - Maximum bytes to read (default 256)  
`reverse` (optional) - Reverse byte order (big-endian)

**Returns:**  
`string` - Decoded ASCII string (null-terminated).

```lua
local function read_string(address, length, reverse)
    local t, i = {}, 0
    local max = length or 256
    while i < max do
        local b = readbyte(address + i)
        if b == 0 then break end
        t[#t + 1] = char(b)
        i = i + 1
    end
    if reverse then
        local rev = {}
        for j = #t, 1, -1 do
            rev[#rev + 1] = t[j]
        end
        return concat(rev)
    end
    return concat(t)
end
```

#### read_tag_name

**Parameters:**  
`address` - Memory location of a null-terminated string (no length cap)

**Returns:**  
`string` - The tag name.

```lua
local function read_tag_name(address)
    if not address or address == 0 then return "" end
    return read_string(address)
end
```

#### read_string_reverse

**Parameters:**  
`address` - Base address  
`offset` - Offset from base  
`length` - Number of bytes to read

**Returns:**  
`string` - Hexadecimal representation in reversed (big-endian) order.

```lua
local function read_string_reverse(address, offset, length)
    local hex = {}
    for i = 0, length - 1 do
        local b = readbyte(address + offset + i)
        hex[#hex + 1] = format("%02X", b)
    end
    local result = ""
    for i = #hex, 1, -1 do
        result = result .. hex[i]
    end
    return result
end
```

#### read_widestring

**Parameters:**  
`address` - Starting address of a UTF-16LE string  
`length` (optional) - Maximum bytes (default 256)

**Returns:**  
`string` - ASCII approximation (non-ASCII characters ignored).

```lua
local function read_widestring(address, length)
    length = length or 256
    local chars = {}
    local pos = 0
    while pos < length do
        local b1 = readbyte(address + pos)
        if b1 == 0 then break end
        local b2 = readbyte(address + pos + 1)
        if b2 == 0 then
            chars[#chars + 1] = char(b1)
        else
            chars[#chars + 1] = char(b1)
        end
        pos = pos + 2
    end
    return concat(chars)
end
```

#### write_string

**Parameters:**  
`address` - Starting address  
`str` - String to write  
`offset` (optional) - Offset from `address`

**Effect:** Writes null-terminated ASCII string.

```lua
local function write_string(address, str, offset)
    offset = offset or 0
    local addr = address + offset
    for i = 1, #str do
        writebyte(addr + i - 1, str:byte(i))
    end
    writebyte(addr + #str, 0)
end
```

#### write_widestring

**Parameters:**  
`address` - Starting address  
`str` - ASCII string to write as UTF-16LE  
`offset` (optional) - Offset from `address`

**Effect:** Writes null-terminated wide string.

```lua
local function write_widestring(address, str, offset)
    offset = offset or 0
    local addr = address + offset
    for i = 1, #str do
        local byte = str:byte(i)
        writebyte(addr + (i - 1) * 2, byte)
        writebyte(addr + (i - 1) * 2 + 1, 0)
    end
    writeword(addr + #str * 2, 0)
end
```

#### read_bit

**Parameters:**  
`address` - Memory address  
`bit_index` - 0-based bit position (0 = LSB)

**Returns:**  
`number` - 0 or 1.

```lua
local function read_bit(address, bit_index)
    local byte_addr = address + floor(bit_index / 8)
    local bit_pos = bit_index % 8
    local val = readbyte(byte_addr)
    return bit32.band(bit32.rshift(val, bit_pos), 1)
end
```

#### write_bit

**Parameters:**  
`address` - Memory address  
`bit_index` - 0-based bit position  
`value` - 0 or 1

```lua
local function write_bit(address, bit_index, value)
    local byte_addr = address + floor(bit_index / 8)
    local bit_pos = bit_index % 8
    local old = readbyte(byte_addr)
    if value == 1 then
        writebyte(byte_addr, bit32.bor(old, bit32.lshift(1, bit_pos)))
    else
        writebyte(byte_addr, bit32.band(old, bit32.bnot(bit32.lshift(1, bit_pos))))
    end
end
```

#### safe_write_byte / safe_write_char / safe_write_short / safe_write_word / safe_write_int / safe_write_dword / safe_write_float

These functions clamp values to the valid range of the target type before writing, preventing out-of-range crashes.

**Example signature:**

```lua
local function safe_write_byte(address, offset, value)
    if value then
        address = address + offset
    else
        value = offset
    end
    value = math_min(math_max(value, 0), 0xFF)
    writebyte(address, value)
end
```

(Similar safe wrappers exist for `char`, `short`, `word`, `int`, `dword`, `float`.)

### Game Time & State

#### get_gametype_id

**Parameters:** none

**Returns:**  
`number` - Gametype ID: 0=none, 1=CTF, 2=Slayer, 3=Oddball, 4=King, 5=Race.

```lua
local function get_gametype_id()
    return readbyte(gametype_base + 0x30)
end
```

#### get_scorelimit

**Parameters:** none

**Returns:**  
`number` - Score limit of the current gametype.

```lua
local function get_scorelimit()
    return readbyte(gametype_base + 0x58)
end
```

#### set_scorelimit

**Parameters:**  
`score` - New score limit (0-255)

```lua
local function set_scorelimit(score)
    writebyte(gametype_base + 0x58, score)
end
```

#### is_ffa

**Parameters:** none

**Returns:**  
`boolean` - `true` if Free-For-All (team play disabled).

```lua
local function is_ffa()
    return readbyte(gametype_base + 0x34) == 0
end
```

#### get_team_name

**Parameters:**  
`id` - Player index (0-based)

**Returns:**  
`string` - `"Red"` or `"Blue"`.

```lua
local function get_team_name(id)
    local team_id = getteam(id)
    return team_id == 0 and "Red" or "Blue"
end
```

#### get_ctf_team_scores

**Parameters:** none

**Returns:**  
`table` - `{ red_score, blue_score }`.

```lua
local function get_ctf_team_scores()
    local scores = {}
    for team = 0, 1 do
        local current_score = readdword(ctf_globals + team * 4 + 0x10)
        scores[team] = current_score
    end
    return scores
end
```

#### get_gametype_name

**Parameters:** none

**Returns:**  
`string` - Name of the current gametype (e.g., `"CTF"`, `"Slayer"`, etc.).

```lua
local function get_gametype_name()
    local type = get_gametype_id()
    return type == 1 and "CTF" or type == 2 and "Slayer"
        or type == 3 and "Oddball" or type == 4 and "KOTH"
        or type == 5 and "Race"
end
```

#### get_score

**Parameters:**  
`player` - Player index (0-based)

**Returns:**  
`number` - Player's score according to current gametype rules.

```lua
local function get_score(player)
    local score = 0
    local timed = false
    local p = getplayer(player)
    local game_type = get_gametype_id()
    local team_play = is_ffa()

    if game_type == 1 then
        score = readword(p + 0xC8)
    elseif game_type == 2 then
        local kills = readword(p + 0x9C)
        local suicides = 0
        if not team_play then
            suicides = readword(p + 0xB0)
        else
            suicides = readword(p + 0xAC)
        end
        score = kills - suicides
    elseif game_type == 3 then
        local oddball_type = readbyte(gametype_base + 0x8C)
        if oddball_type == 0 or oddball_type == 1 then
            timed = true
            score = readdword(0x639E5C + player)
        else
            score = readword(p + 0xC8)
        end
    elseif game_type == 4 then
        timed = true
        score = readword(p + 0xC4)
    elseif game_type == 5 then
        score = readword(p + 0xC6)
    end
    if timed then score = floor(score / 30) end
    return score
end
```

#### get_game_time_remaining

**Parameters:** none

**Returns:**  
`number` - Seconds remaining until game end, or 0 if time is up.

```lua
local function get_game_time_remaining()
    local time_passed = readdword(readdword(gametime_base) + 0xC) / 30
    local time_limit = readdword(gametype_base + 0x78) / 30
    local remaining = time_limit - time_passed
    return remaining > 0 and remaining or 0
end
```

**Example:**

```lua
local remaining = get_game_time_remaining()
local elapsed = get_game_time_elapsed()
hprintf(string.format("Time remaining: %ds, elapsed: %ds", remaining, elapsed))
```

#### get_game_time_elapsed

**Parameters:** none

**Returns:**  
`number` - Seconds elapsed since game start.

```lua
local function get_game_time_elapsed()
    return readdword(readdword(gametime_base) + 0xC) / 30
end
```

**Example:**

```lua
local elapsed = get_game_time_elapsed()
local remaining = get_game_time_remaining()
hprintf(string.format("Time elapsed: %ds, remaining: %ds", elapsed, remaining))
```

#### get_player_score

**Parameters:**  
`player_id` - Player index (0-based)

**Returns:**  
`number` or `nil` - Gametype-dependent player score.

```lua
local function get_player_score(player_id)
    local p = getplayer(player_id)
    if not p then return nil end
    local gt = get_gametype_id()
    if gt == 1 then -- ctf
        return readshort(p + 0xC8)
    elseif gt == 2 then -- slayer
        return readint(slayer_globals + 0x40 + player_id * 4)
    elseif gt == 3 then -- oddball
        local oddball_game = readbyte(gametype_base + 0x8C)
        if oddball_game == 0 or oddball_game == 1 then
            return readint(oddball_globals + 0x84 + player_id * 4) / 30
        else
            return readint(oddball_globals + player_id * 4 + 0x104)
        end
    elseif gt == 4 then -- king
        return readshort(p + 0xC4)
    elseif gt == 5 then -- race
        return readshort(p + 0xC6)
    end
    return 0
end
```

#### set_player_score

**Parameters:**  
`player_id` - Player index (0-based)  
`score` - New score value

```lua
local function set_player_score(player_id, score)
    local p = getplayer(player_id)
    if not p then return end
    local gt = get_gametype_id()
    if gt == 1 then
        writeshort(p + 0xC8, score)
    elseif gt == 2 then
        writeint(slayer_globals + 0x40 + player_id * 4, score)
    elseif gt == 3 then
        local oddball_game = readbyte(gametype_base + 0x8C)
        if oddball_game == 0 or oddball_game == 1 then
            writeint(oddball_globals + 0x84 + player_id * 4, score * 30)
        else
            writeint(oddball_globals + player_id * 4 + 0x104, score)
        end
    elseif gt == 4 then
        writeshort(p + 0xC4, score)
    elseif gt == 5 then
        writeshort(p + 0xC6, score)
    end
end
```

#### get_team_score

**Parameters:**  
`team` - 0 (red) or 1 (blue)

**Returns:**  
`number` - Team score for the current gametype.

```lua
local function get_team_score(team)
    local gt = get_gametype_id()
    if gt == 1 then -- ctf
        return readint(ctf_globals + team * 4 + 0x10)
    elseif gt == 2 then -- slayer
        return readint(slayer_globals + team * 4)
    elseif gt == 3 then -- oddball
        return readint(oddball_globals + team * 4 + 0x4) / 30
    elseif gt == 4 then -- king
        return readint(koth_globals + team * 4) / 30
    elseif gt == 5 then -- race
        return readint(race_globals + team * 4 + 0x88) / 30
    end
    return 0
end
```

#### set_team_score

**Parameters:**  
`team` - 0 (red) or 1 (blue)  
`score` - New team score

```lua
local function set_team_score(team, score)
    local gt = get_gametype_id()
    if gt == 1 then
        writeint(ctf_globals + team * 4 + 0x10, score)
    elseif gt == 2 then
        writeint(slayer_globals + team * 4, score)
    elseif gt == 3 then
        writeint(oddball_globals + team * 4 + 0x4, score * 30)
    elseif gt == 4 then
        writeint(koth_globals + team * 4, score * 30)
    elseif gt == 5 then
        writeint(race_globals + team * 4 + 0x88, score * 30)
    end
end
```

### Miscellaneous

#### get_body_part_position

**Parameters:**  
`biped_object` - Object struct from `get_player_object`  
`body_part_offset` - Offset from the biped's unknown float block (e.g., `0x8C4` for right hand)

**Returns:**  
`x`, `y`, `z` - World position of the specified body part, or `nil`.

```lua
local function get_body_part_position(biped_object, body_part_offset)
    if not biped_object then return nil end
    local x = readfloat(biped_object, body_part_offset + 0x28)
    local y = readfloat(biped_object, body_part_offset + 0x2C)
    local z = readfloat(biped_object, body_part_offset + 0x30)
    return x, y, z
end
```

**Example:**

```lua
local biped_obj, _ = get_player_object(0)
if biped_obj then
    local hand_x, hand_y, hand_z = get_body_part_position(biped_obj, 0x8C4)  -- right hand
    hprintf(string.format("Right hand position: %.2f, %.2f, %.2f", hand_x, hand_y, hand_z))
end
```

---

## Event-Driven Script Examples

These snippets show how to use the Phasor event hooks together with the utility functions above.

### Server-side speed hack protection

```lua
function GetRequiredVersion() return 200 end

function OnPlayerSpawn(player, m_objectId)
    set_player_speed(player, 1.0)  -- reset speed on spawn
end

function OnClientUpdate(player, m_objectId)
    local dyn = getplayerobjectid(player)
    if dyn == 0 then return nil end
    
    local obj = getobject(dyn)
    if not obj then return nil end

    local speed = readfloat(obj + 0x6C)
    if speed > 1.05 then
        set_player_speed(player, 1.0)
    end
end
```

### Private message on join

```lua
function OnPlayerJoin(player, team)
    privatesay(player, "Welcome to the server!")
end
```

### Disable a certain weapon pickup

```lua
function OnObjectInteraction(player, m_ObjectId, tagType, tagName)
    if tagType == "weap" and tagName == "weapons\\rocket_launcher\\rocket_launcher" then
        return 0  -- block pickup
    end
    return 1
end
```

### Per-player command cooldowns

```lua
local cooldowns = {}

function OnServerCommand(player, command, environment)
    if command == "some_command" then
        local now = os.clock()
        if cooldowns[player] and now - cooldowns[player] < 3 then
            privatesay(player, "Please wait 3 seconds before using !spawn again.")
            return 1
        end
        cooldowns[player] = now
        -- handle command here...
        return 1
    end
    return 0
end
```

### Check if player is holding flag or oddball

```lua
local function has_objective(player_index)
    local dyn = getplayerobjectid(player_index)
    if dyn == 0 then return false end

    local obj = getobject(dyn)
    if not obj then return false end

    local weapon_id = readdword(obj + 0x118)
    if weapon_id == 0xFFFFFFFF then return false end

    local weapon_obj = getobject(weapon_id)
    if not weapon_obj then return false end

    local tag_data = readdword(readdword(base_tag_table) + readword(weapon_obj) * 0x20 + 0x14)
    if not tag_data then return false end

    local is_objective = (readbyte(tag_data + 0x308) >> 3) & 1
    if is_objective ~= 1 then return false end

    local obj_type = readbyte(tag_data + 2)
    
    return (obj_type == 0 and "Flag") or (obj_type == 4 and "Oddball") or nil
end

function OnClientUpdate(id)
    if is_alive(id) then
        local flag_or_oddball = has_objective(id)
        if flag_or_oddball then
            say(getname(id) .. " has the " .. flag_or_oddball)
        end
    end
end
```

### Override player's respawn time

```lua
local function set_respawn_time(player_index, seconds)
    seconds = seconds or 3
    local static = getplayer(player_index)
    if static then
        writedword(static + 0x2C, seconds * 33)  -- 33 ticks/second
    end
end
```

**Example:**

```lua
function OnPlayerKill(killer, victim, mode)
    set_respawn_time(victim, 0) -- instant respawn
end
```

---

## Complete Examples:

See my [Phasor Script Archive](https://github.com/Chalwk/SPCLib/tree/master/phasor).

---