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

| Function                  | Description                                                    |
|---------------------------|----------------------------------------------------------------|
| `say(msg)`                | Broadcasts a message to all players. ASCII only.               |
| `privatesay(player, msg)` | Sends a private message to a specific player. ASCII only.      |
| `respond(msg)`            | Sends a message to the server terminal.                        |
| `hprint(msg)`             | Sends a message to the server terminal.                        |
| `print(msg)`              | Sends a message to the server terminal.                        |

### Timer Functions

| Function                              | Description                                                                                                                                                                                         |
|---------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `registertimer(delay, callback, ...)` | Creates a timer that calls `callback` after `delay` milliseconds. The callback can return `1` to repeat or `0` to stop. Extra arguments are passed to the callback as userdata. Returns a timer ID. |
| `removetimer(id)`                     | Stops and removes a timer created by `registertimer`.                                                                                                                                               |

**Callback signature:** `function callback(id, count, userdata1, userdata2, ...)` — `count` is the number of times the
timer has fired.

---

## Practical Examples

### Example: Server-side speed hack protection

```lua
function GetRequiredVersion() return 200 end

function OnPlayerSpawn(player, m_objectId)
    setspeed(player, 1.0)  -- reset speed on spawn
end

function OnClientUpdate(player, m_objectId)
    local dyn = getplayerobjectid(player)
    if dyn == 0 then return nil end
	
    local obj = getobject(dyn)
    if not obj then return nil end

    local speed = readfloat(obj + 0x6C)
    if speed > 1.05 then
        setspeed(player, 1.0)
    end
end
```

### Example: Private message on join

```lua
function OnPlayerJoin(player, team)
    privatesay(player, "Welcome to the server!")
end
```

### Example: Disable a certain weapon pickup

```lua
function OnObjectInteraction(player, m_ObjectId, tagType, tagName)
    if tagType == "weap" and tagName == "weapons\\rocket_launcher\\rocket_launcher" then
        return 0  -- block pickup
    end
    return 1
end
```

### Check if Player is in a Vehicle

```lua
local function in_vehicle(player_index)
    local dyn = getplayerobjectid(player_index)
    if dyn == 0 then return false end

    local obj = getobject(dyn)
    if not obj then return false end

    return readdword(obj + 0x11C) ~= 0xFFFFFFFF
end
```

### Get Player’s World Position (Eye Level, Crouch-Aware)

```lua
local function get_player_position(player_index)
    local dyn = getplayerobjectid(player_index)
    if dyn == 0 then return nil end
	
    local obj = getobject(dyn)
    if not obj then return nil end

    local crouch = readfloat(obj + 0x50C) -- 0 = standing

    local x = readfloat(obj + 0x5C)
    local y = readfloat(obj + 0x60)
    local z = readfloat(obj + 0x64)
    
    local z_offset = (crouch == 0) and 0.65 or 0.35 * crouch

    return x, y, z + z_offset
end
```

### Per-Player Cooldowns

Prevent command spam with a simple cooldown table:

```lua
local cooldowns = {}

function OnServerCommand(player, command, environment)
    if command == "some_command" then
        local now = os.clock()
        if cooldowns[player] and now - cooldowns[player] < 3 then
            say(player, "Please wait 3 seconds before using !spawn again.")
            return 1
        end
        cooldowns[player] = now
        return 1
    end
    return 0
end
```

### Get Player’s Aim Direction Vector

```lua
local function get_aim_vector(player_index)
    local dyn = getplayerobjectid(player_index)
    if dyn == 0 then return nil end
	
    local obj = getobject(dyn)
    if not obj then return nil end
	
    local ax = readfloat(obj + 0x230)
    local ay = readfloat(obj + 0x234)
    local az = readfloat(obj + 0x238)

    return ax, ay, az
end
```

### Override Player’s Respawn Time

```lua
local function set_respawn_time(player_index, seconds)
    seconds = seconds or 3
    local static = getplayer(player_index)
    if static then
        writedword(static + 0x2C, seconds * 33)  -- 33 ticks/second
    end
end
```

### Get Tag Class and Name from Any Object

```lua

local base_tag_table = 0x40440000  -- Works on PC and CE
local function get_tag_from_object(object)
    if not object then return nil end
    local tag_class = readbyte(object + 0xB4)
    local tag_index = readword(object)  -- index in tag table
    local tag_address = tag_index * 32 + base_tag_table + 0x38
    local tag_name = readstring(readdword(tag_address))
    return tag_class, tag_name
end
```

### Check if Player is Holding Flag or Oddball

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

    -- Check bit 3 of offset 0x308 (holds objective flag)
    local is_objective = (readbyte(tag_data + 0x308) >> 3) & 1
    if is_objective ~= 1 then return false end

    local obj_type = readbyte(tag_data + 2)
    return obj_type == 0 or obj_type == 4  -- 0 = flag, 4 = oddball
end
```
