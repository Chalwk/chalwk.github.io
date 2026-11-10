---
title: "Scripting with Phasor - Server-Side Lua"
permalink: /halo/phasor/scripting-with-phasor/
description: "Complete guide to server-side Lua scripting with Phasor 2.0, covering version handling, event hooks, player data, and helper functions."
date: 2026-11-09
last-updated: 2026-11-09
categories: [ education, halo, modding ]
tags: [ sapp, lua, scripting, server, tutorial ]
---

Phasor is a server-side extension for Halo PC/Custom Edition. It exposes a Lua Scripting API, event
hooks, command handling, player management, logging, and numerous under-the-hood features. This
guide focuses on its Lua API, walks through the core scripting model and practical examples so you
can build your Lua scripts.

---

## Reference Files

- [Phasor Server Guide](server-guide.md): Installation, admins, `init.txt`, and every Phasor
  command.
- [Common Reference][common_ref]: Memory offsets, game constants, unit conversions, shared helpers,
  and stock Halo commands.
- [SAPP Cheat Sheet][sapp_cheat_sheet]: Hardcoded pointers for the dedicated server, used
  in [Game Version](#game-version).
- [Phasor Lua Template](template.md): Script skeleton and callback reference for every event.
- [Phasor Script Archive][script_archive]: Complete working scripts.

---

## Runtime Environment

| Feature            | Details                                                                   |
|--------------------|---------------------------------------------------------------------------|
| Lua runtime        | Lua 5.2                                                                   |
| Lua 5.2 features   | `goto`, `_ENV`, and the `bit32` library (no native bitwise operators)     |
| Runs on            | Dedicated server                                                          |
| Required functions | `GetRequiredVersion()` returning `200`, and `OnScriptLoad()`              |
| Platform detection | `game` argument of `OnScriptLoad` (`"PC"` or `"CE"`)                      |
| Signature scanning | Not available, hardcode addresses per platform                            |
| Player index       | Memory ID 0-15 everywhere, except server commands which use RCON IDs 1-16 |
| Tick rate          | 30 ticks/sec (1 tick ~ 33.3 ms); more in [Timing and Units][timing_units] |

---

## Script Structure

Every script needs `GetRequiredVersion()` and `OnScriptLoad()`. Without both, Phasor will not load
it. `GetRequiredVersion()` must return `200`. `OnScriptUnload()` is optional, but define it so you
have somewhere to clean up.

> [!IMPORTANT]
> Both `GetRequiredVersion()` (returning `200`) and `OnScriptLoad()` are mandatory in every Phasor
> script. Omitting either will cause Phasor to refuse loading the script entirely.

```lua
---@return number version Required API version (must be 200)
function GetRequiredVersion() return 200 end

--- Required. Called when the script is loaded.
---@param process_id number Process ID of the server.
---@param game string "PC" or "CE".
---@param persistent boolean True if the script is persistent.
function OnScriptLoad(process_id, game, persistent)
    -- Set up pointers and state here.
end

--- Called when the script is unloaded (optional cleanup).
function OnScriptUnload() end
```

Phasor has no registration call. It looks for global functions with the event names it knows, so
define the ones you need and leave the rest out. See [Events](#events).

---

## Deploying a Script

Phasor only loads `.lua` files. A script saved as `.txt` needs renaming first. Where you put it
decides how long it stays loaded:

| Folder                | Behavior                                                        |
|-----------------------|-----------------------------------------------------------------|
| `scripts/`            | Loaded on request, unloaded at the end of each game             |
| `scripts/persistent/` | Loaded when Phasor starts, stays loaded until the server closes |

The scripts folder lives in the data folder, not next to `haloded.exe`: `My Games/Halo/scripts` for
PC and `My Games/Halo CE/scripts` for CE. To use a different folder, start the server with
`-scriptpath <path>`. Not every script supports persistence, so check its docs before you put it in
`persistent`.

### Script Commands

Install steps, and the full command list are in the [Phasor Server Guide](server-guide.md#scripts).

Use the script name without the `.lua` extension.

| Command                                | Description                                                                 |
|----------------------------------------|-----------------------------------------------------------------------------|
| `sv_script_load <script> [persistent]` | Load a script. `persistent` keeps it loaded between games (default `false`) |
| `sv_script_unload <script>`            | Unload a script                                                             |
| `sv_script_reload [script]`            | Reload a script, or every script if none is given                           |
| `sv_script_list`                       | List the scripts that are loaded                                            |

### Loading from init.txt

List scripts at the end of a mapcycle entry, and they load for that map only. For a script every
game needs, load it persistent instead:

```
sv_mapcycle_add bloodgulch ctf
sv_mapcycle_add timberland slayer script2
sv_mapcycle_begin
sv_script_load script1 true
```

`sv_mapvote_add <map> <gametype> <description> [scripts]` takes the scripts the same way. Phasor
also reads `earlyinit.txt` from the server folder at startup. Use it for settings that must exist
before anything else, such as log directories, or to load persistent scripts.

---

## Player Indices

Phasor has two index spaces:

- Memory IDs run 0-15. Every Phasor function and event takes these.
- RCON IDs run 1-16. Server commands sent through `svcmd` expect these.

> [!WARNING]
> Mixing up memory IDs (0-15) and RCON IDs (1-16) when executing server commands via `svcmd` will
> target the incorrect player. Always use `resolveplayer()` and `rresolveplayer()` when passing
> player indices to console commands.

`resolveplayer(player)` converts a memory ID to an RCON ID and `rresolveplayer(rcon_id)` converts it
back. Use them whenever you build a command string from a player index.

```lua
---@param player number Player index.
local function kickPlayer(player)
    svcmd("sv_kick " .. resolveplayer(player))
end
```

To loop over everyone connected, walk 0-15 and skip empty slots:

```lua
for player = 0, 15 do
    if getplayer(player) then
        local team_name = getteam(player) == 0 and "Red" or "Blue"
        hprintf(getname(player) .. " is on " .. team_name)
    end
end
```

---

## Game Version

Phasor cannot scan signatures, so you pick addresses yourself from the `game` argument. Phasor runs
on the same dedicated server executable as SAPP, so the addresses
in [Hardcoded Pointers][hardcoded_pointers] apply. Use `and` / `or` for a single value:

```lua
local gametype_base

---@param process_id number Process ID of the server.
---@param game string "PC" or "CE".
---@param persistent boolean True if the script is persistent.
function OnScriptLoad(process_id, game, persistent)
    gametype_base = game == "PC" and 0x671320 or 0x5F5478
end

---@return number score_limit Score limit of the current gametype.
local function getScoreLimit()
    return readbyte(gametype_base + 0x58)
end
```

Several values at once follow the same pattern:

```lua
local gametype_base, timelimit_address

---@param process_id number Process ID of the server.
---@param game string "PC" or "CE".
---@param persistent boolean True if the script is persistent.
function OnScriptLoad(process_id, game, persistent)
    gametype_base, timelimit_address = game == "PC" and 0x671320 or 0x5F5478,
                                       game == "PC" and 0x626630 or 0x5AA5B0
end
```

Or index a lookup table so the condition is written once:

```lua
local gametype_base, timelimit_address

---@param process_id number Process ID of the server.
---@param game string "PC" or "CE".
---@param persistent boolean True if the script is persistent.
function OnScriptLoad(process_id, game, persistent)
    local pointers = ({ PC = { 0x671320, 0x626630 }, CE = { 0x5F5478, 0x5AA5B0 } })[game]
    gametype_base, timelimit_address = pointers[1], pointers[2]
end
```

The rules for `and` / `or` are in [Ternary Emulation][ternary_emulation].

---

## Events

Define a global function with the exact event name and Phasor calls it.
See [Phasor Lua Template](template.md) for every event, its arguments, and what it can return.
Define only the ones the script uses.

A few things to know before you write one:

- Player arguments are always memory IDs (0-15).
- Events that can stop something, such as `OnServerCommand`, `OnObjectInteraction`, and
  `OnVehicleEntry`, return `false` to block it and `true` to let it through.
- Tag IDs arrive as `map_id` arguments. Look tags up with `gettagid` in `OnNewGame` and cache the
  result, because looking them up repeatedly is slow.
- `OnClientUpdate` runs 30 times per second for every player. Keep it light.

> [!TIP]
> Always cache tag IDs (`gettagid`) during `OnNewGame` rather than calling it inside high-frequency
> event handlers (`OnClientUpdate`, `OnObjectInteraction`) to maintain optimal server performance.

---

## API Cheat Sheet

### Memory Read/Write

Phasor's function names have no underscores and the bit functions take an extra offset argument.

| Type            | Read                                     | Write                                               |
|-----------------|------------------------------------------|-----------------------------------------------------|
| Bit             | `readbit(data, data_offset, bit_offset)` | `writebit(data_addr, data_offset, bit_offset, bit)` |
| Unsigned 8-bit  | `readbyte(address)`                      | `writebyte(address, value)`                         |
| Signed 8-bit    | `readchar(address)`                      | `writechar(address, value)`                         |
| Unsigned 16-bit | `readword(address)`                      | `writeword(address, value)`                         |
| Signed 16-bit   | `readshort(address)`                     | `writeshort(address, value)`                        |
| Unsigned 32-bit | `readdword(address)`                     | `writedword(address, value)`                        |
| Signed 32-bit   | `readint(address)`                       | `writeint(address, value)`                          |
| 32-bit float    | `readfloat(address)`                     | `writefloat(address, value)`                        |
| 64-bit float    | `readdouble(address)`                    | `writedouble(address, value)`                       |
| ASCII string    | `readstring(address, [length])`          | `writestring(address, str, [length])`               |
| UTF-16LE string | `readwidestring(address, [length])`      | `writewidestring(address, str, [length])`           |

`bit_offset` is 0-7 and is counted from `data + data_offset`. `readwidestring` converts to ASCII for
you, so Phasor does not need the `readWideString` helper from [Wide Strings][wide_strings].

### Messaging

Do not mix these up.

| Function                                                    | Destination              |
|-------------------------------------------------------------|--------------------------|
| `say(msg)`                                                  | In-game chat, everyone   |
| `privatesay(player, msg)`                                   | In-game chat, one player |
| `hprintf(msg)`, `hprint(msg)`, `print(msg)`, `respond(msg)` | Server terminal only     |

### Players and Teams

| Function                      | Notes                                          |
|-------------------------------|------------------------------------------------|
| `getplayer(player)`           | Returns the player table address               |
| `getname(player)`             | Returns the player name as ASCII               |
| `gethash(player)`             | Returns the CD-key hash, a unique identifier   |
| `getteam(player)`             | `0` = Red, `1` = Blue                          |
| `getteamsize(team)`           | Number of players on that team                 |
| `changeteam(player)`          | Switches the player's team                     |
| `kill(player)`                | Kills the player                               |
| `applycamo(player, duration)` | Camo for `duration` seconds, `0` = until death |
| `setspeed(player, speed)`     | Movement speed multiplier, default `1.0`       |
| `isadmin(player)`             | `true` if the player is an admin               |
| `resolveplayer(player)`       | Memory ID (0-15) to RCON ID (1-16)             |
| `rresolveplayer(rcon_id)`     | RCON ID (1-16) to memory ID (0-15)             |

### Objects

| Function                                                                      | Notes                                                                                      |
|-------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|
| `getobject(object_id)`                                                        | Object ID to memory address                                                                |
| `getplayerobjectid(player)`                                                   | Biped object ID, `0xFFFFFFFF` if dead or invalid                                           |
| `getobjectcoords(object_id)`                                                  | Returns `x, y, z`. A player in a vehicle returns the vehicle's coordinates                 |
| `gettagid(tag_type, tag_name)`                                                | Map ID of a tag, e.g. `gettagid("weap", "weapons\\pistol\\pistol")`                        |
| `createobject(tag_type, tag_name, parent_id, respawn_time, recycle, x, y, z)` | Returns the new object ID (see below)                                                      |
| `destroyobject(object_id)`                                                    | Deletes an object. An invalid ID can crash the server                                      |
| `movobjcoords(object_id, x, y, z)`                                            | Teleports an object to absolute coordinates                                                |
| `movobjname(object_id, name)`                                                 | Teleports an object to a named location such as `"redbase"`                                |
| `assignweapon(player, object_id)`                                             | Gives a weapon to a player who has fewer than 4                                            |
| `updateammo(weapon_id)`                                                       | Forces ammo changes on a weapon to sync                                                    |
| `entervehicle(player, vehicle_id, seat)`                                      | `seat`: `0` = driver, `1` = passenger, `2` = gunner. The player must not already be in one |
| `exitvehicle(player)`                                                         | Forces the player out of their vehicle                                                     |

`createobject` arguments:

- `tag_type`: Four-letter class, e.g. `"weap"`.
- `tag_name`: Full tag path.
- `parent_id`: Object ID of the parent, or `-1` for none.
- `respawn_time`: Seconds. `0` = never, `-1` = gametype default.
- `recycle`: `true` = respawn, `false` = destroy.
- `x, y, z`: Spawn coordinates.

For item collections (weapons, grenades, powerups), `recycle` is ignored and `respawn_time` becomes
the delay before the object is destroyed.

### Timers and Server

| Function                              | Notes                                                                                |
|---------------------------------------|--------------------------------------------------------------------------------------|
| `registertimer(delay, callback, ...)` | Calls `callback` after `delay` ms. Extra arguments go to the callback. Returns an ID |
| `removetimer(timer_id)`               | Stops and removes a timer                                                            |
| `svcmd(cmd)`                          | Runs a server command. Player arguments must be RCON IDs                             |
| `getrandomnumber(min, max)`           | Random integer from `min` to `max`, both included                                    |
| `getprofilepath()`                    | Server data path, where `banlist.txt` is stored                                      |

---

## Reading Player Data

Phasor has no `get_dynamic_player`. Build one from `getplayerobjectid` and `getobject`. A dead
player's object ID is `0xFFFFFFFF`, so check for that before you touch the address.

```lua
---@param player number Player index.
---@return number|nil dyn_player Dynamic player address, or nil if the player is dead.
local function getDynamicPlayer(player)
    local object_id = getplayerobjectid(player)
    if object_id == 0xFFFFFFFF then return nil end

    return getobject(object_id)
end
```

From there, field offsets come straight from [Dynamic Player Object][dynamic_player_object]. This
tops up a player who drops below 30% health:

```lua
---@param player number Player index.
local function healIfLow(player)
    local dyn_player = getDynamicPlayer(player)
    if not dyn_player then return end

    if readfloat(dyn_player + 0xE0) < 0.3 then
        writefloat(dyn_player + 0xE0, 1.0)
        privatesay(player, "You have been healed.")
    end
end
```

---

## Porting Shared Helpers

The helpers in [Offset Helpers][offset_helpers] and the offset tables work on Phasor too. Only the
calls around them change:

| SAPP / Chimera                                           | Phasor                                                                      |
|----------------------------------------------------------|-----------------------------------------------------------------------------|
| `read_byte`, `read_word`, `read_dword` (SAPP / Chimera)  | `readbyte`, `readword`, `readdword`                                         |
| `read_int`, `read_float`, `read_string` (SAPP / Chimera) | `readint`, `readfloat`, `readstring`                                        |
| `write_byte`, `write_float`, ... (SAPP / Chimera)        | `writebyte`, `writefloat`, ...                                              |
| `read_bit(address, bit)` (SAPP only)                     | `readbit(address, 0, bit)`                                                  |
| `read_vector3d(address)` (SAPP only)                     | One `readfloat` per axis, as in [Position and Aim][position_aim]            |
| `readWideString` (Custom helper)                         | `readwidestring(address, [length])` (Built-in API)                          |
| `get_player(id)` (SAPP / Chimera)                        | `getplayer(player)`                                                         |
| `get_dynamic_player(id)` (SAPP / Chimera)                | `getDynamicPlayer(player)` from [Reading Player Data](#reading-player-data) |
| `get_object_memory(object_id)` (SAPP only)               | `getobject(object_id)`                                                      |
| `lookup_tag(class, name)` + `read_dword` (SAPP only)     | `gettagid(tag_type, tag_name)`                                              |
| `spawn_object(...)` (SAPP / Chimera)                     | `createobject(...)`                                                         |
| `execute_command(cmd)` (SAPP only)                       | `svcmd(cmd)`                                                                |
| `to_real_index(id)` (SAPP only)                          | Not needed, Phasor already uses 0-15                                        |

> [!NOTE]
> On SAPP and Chimera, `readWideString` is not a built-in API function, it is a custom helper
> function that must be copied from the [Common Reference](../common-reference.md). Phasor, by
> contrast, provides `readwidestring` natively as a built-in API function.

---

## Helper Functions

### Vehicle Occupants

Retrieves the driver or gunner occupying a vehicle object.

```lua
---@param vehicle_object number Vehicle memory address.
---@return number|nil driver_player Player index ID (0-15), or nil if seat is empty.
local function getDriverPlayer(vehicle_object)
    local unit_id = readdword(vehicle_object + 0x324)
    if unit_id == 0xFFFFFFFF then return nil end
    for player = 0, 15 do
        if getplayerobjectid(player) == unit_id then return player end
    end
    return nil
end

---@param vehicle_object number Vehicle memory address.
---@return number|nil gunner_player Player index ID (0-15), or nil if seat is empty.
local function getGunnerPlayer(vehicle_object)
    local unit_id = readdword(vehicle_object + 0x328)
    if unit_id == 0xFFFFFFFF then return nil end
    for player = 0, 15 do
        if getplayerobjectid(player) == unit_id then return player end
    end
    return nil
end
```

### Player Lookup by Hash or IP

Finds a player's ID by their CD-key hash or IP address.

```lua
---@param hash string CD-key hash to search for.
---@return number|nil player Player index ID (0-15), or nil if not found.
local function hashToPlayer(hash)
    for player = 0, 15 do
        if getplayer(player) and gethash(player) == hash then return player end
    end
    return nil
end

---@param ip string IP address to search for.
---@return number|nil player Player index ID (0-15), or nil if not found.
local function ipToPlayer(ip)
    for player = 0, 15 do
        if getplayer(player) and getip(player) and getip(player) == ip then return player end
    end
    return nil
end
```

### Weapon Slot Helpers

Retrieves the weapon object ID for a specific inventory slot (0-3) or the active weapon slot index.

```lua
---@param player number Player index ID (0-15).
---@param slot number Weapon slot (0-3).
---@return number|nil weapon_id Weapon object ID, or nil if slot is empty or player is dead.
local function getWeaponObjectID(player, slot)
    local dyn_player = getDynamicPlayer(player)
    if not dyn_player then return nil end
    local weapon_id = readdword(dyn_player + 0x2F8 + (slot * 4))
    return weapon_id ~= 0xFFFFFFFF and weapon_id or nil
end

---@param player number Player index ID (0-15).
---@return number|nil slot Active weapon slot index (0-3), or nil if dead.
local function getActiveWeaponSlot(player)
    local dyn_player = getDynamicPlayer(player)
    return dyn_player and readword(dyn_player + 0x2F2) or nil
end
```

### Gametype Score Calculator

Calculates a player's score according to the active gametype rules (CTF flag captures, Slayer net
kills, KOTH hill time, Race laps, or Oddball hold time).

```lua
---@param player number Player index ID (0-15).
---@param gametype_base number Address of the gametype struct.
---@return number score Calculated score.
local function getPlayerScore(player, gametype_base)
    local static_player = getplayer(player)
    if not static_player then return 0 end

    local gametype = readbyte(gametype_base + 0x30)
    if gametype == 1 then     -- CTF (flag scores)
        return readword(static_player + 0xC8)
    elseif gametype == 2 then -- Slayer (kills minus betrays/suicides)
        local kills = readword(static_player + 0x9C)
        local team_play = readbyte(gametype_base + 0x34)
        local penalties = readword(static_player + (team_play == 1 and 0xAC or 0xB0))
        return kills - penalties
    elseif gametype == 3 then -- Oddball (time with ball in seconds)
        return math.floor(readword(static_player + 0xC8) / 30)
    elseif gametype == 4 then -- KOTH (hill time in seconds)
        return math.floor(readword(static_player + 0xC4) / 30)
    elseif gametype == 5 then -- Race (laps completed)
        return readword(static_player + 0xC6)
    end
    return 0
end
```

---

## Creating Objects

Spawn a weapon on the player and hand it over. `-1` for `parent_id` means no parent, `0` for
`respawn_time` means never respawn, and `false` for `recycle` destroys it instead of respawning it.

```lua
---@param player number Player index.
local function giveSniper(player)
    local object_id = getplayerobjectid(player)
    if object_id == 0xFFFFFFFF then return end

    local x, y, z = getobjectcoords(object_id)
    local tag_name = "weapons\\sniper rifle\\sniper rifle"
    local weapon_id = createobject("weap", tag_name, -1, 0, false, x, y, z + 0.5)
    assignweapon(player, weapon_id)
end
```

---

## Using Timers

`registertimer` calls a global function by name after a delay in milliseconds. The callback receives
the timer ID, the number of times it has fired, and any extra arguments you passed. Return `1` to
repeat or `0` to stop.

```lua
local timer_id

---@param id number Timer ID.
---@param count number Times the timer has fired.
---@param message string Extra argument passed to registertimer.
---@return number repeat_timer `1` to repeat, `0` to stop.
function ShowMessage(id, count, message)
    hprintf(message .. " (" .. count .. ")")

    if count >= 3 then
        timer_id = nil
        return 0 -- stop after 3 runs
    end
    return 1
end

function OnScriptLoad(process_id, game, persistent)
    timer_id = registertimer(1000, "ShowMessage", "Hello from the timer")
end

function OnScriptUnload()
    if timer_id then removetimer(timer_id) end
end
```

---

## Event Examples

### Speed Hack Protection

Phasor stores the speed multiplier in the static player table (`+0x6C`,
see [Static Player Data][static_player_data]). Reset it on spawn and clamp it on every client
update. This fights any script that boosts speed on purpose, so use it on servers that do not.

```lua
--- `OnPlayerSpawn`
--- Called when a player has spawned. Called BEFORE `OnPlayerSpawnEnd`.
---@param player number The player who is spawning
function OnPlayerSpawn(player)
    setspeed(player, 1.0)
end

--- `OnClientUpdate`
--- Called when a client sends its update packet.
--- Runs 30 times per second for every player, so keep it light.
---@param player number The player's index id
function OnClientUpdate(player)
    local static_player = getplayer(player)
    if not static_player then return end

    if readfloat(static_player + 0x6C) > 1.05 then
        setspeed(player, 1.0)
    end
end
```

### Welcome Message

```lua
--- `OnPlayerJoin`
--- Called when a player successfully joins the game.
---@param player number The joining player's index id
function OnPlayerJoin(player)
    privatesay(player, "Welcome to the server, " .. getname(player) .. "!")
end
```

### Block a Weapon Pickup

`OnObjectInteraction` gives you the object's tag ID, not its name. Look the tag up once in
`OnNewGame` and compare against it.

```lua
local blocked_weapon

--- `OnNewGame`
--- Called when a new game is starting.
--- Look up all tags (via `gettagid`) here and cache them.
---@param map string The name of the map being loaded
function OnNewGame(map)
    blocked_weapon = gettagid("weap", "weapons\\rocket launcher\\rocket launcher")
end

--- `OnObjectInteraction`
--- Called when a player interacts with an object.
---@param player number The interacting player's index id
---@param object_id number The object being interacted with
---@param map_id number The object's tag id
---@return boolean|nil allow # Return `false` to block the interaction
function OnObjectInteraction(player, object_id, map_id)
    return map_id ~= blocked_weapon -- false blocks the pickup
end
```

### Command Cooldown

Clear a player's timer when they leave, or the next player to take that slot inherits it.

```lua
local cooldown_seconds = 3
local cooldowns = {}

--- `OnServerCommand`
--- Called when a player executes a server command.
---@param player number The player's index id
---@param command string The command being executed
---@return boolean|nil allow # Return `false` to block the command
function OnServerCommand(player, command)
    if command ~= "custom_command" then return true end

    local now = os.time()
    local last_used = cooldowns[player]
    if last_used and now - last_used < cooldown_seconds then
        privatesay(player, "Wait " .. cooldown_seconds .. " seconds before using that again.")
        return false
    end

    cooldowns[player] = now
    return true
end

--- `OnPlayerLeave`
--- Called when a player quits.
---@param player number The player who left
function OnPlayerLeave(player)
    cooldowns[player] = nil
end
```

---

[common_ref]: ../common-reference.md
[dynamic_player_object]: ../common-reference.md#dynamic-player-object
[hardcoded_pointers]: ../sapp/cheat-sheet.md#hardcoded-pointers
[offset_helpers]: ../common-reference.md#offset-helpers
[position_aim]: ../common-reference.md#position-and-aim
[sapp_cheat_sheet]: ../sapp/cheat-sheet.md
[script_archive]: https://github.com/Chalwk/SPCLib/tree/master/phasor
[static_player_data]: ../common-reference.md#static-player-data
[ternary_emulation]: ../common-reference.md#ternary-emulation
[timing_units]: ../common-reference.md#timing-and-units
[wide_strings]: ../common-reference.md#wide-strings