---
title: "Scripting with SAPP - Server-Side Lua"
date: 2026-05-17
categories: [ education, halo, modding ]
tags: [ sapp, lua, scripting, server ]
---

SAPP is a **server-side** extension for Halo PC/Custom Edition. It exposes a Lua Scripting API, anti-cheat tools, event
hooks, command handling, player management, logging, and numerous under-the-hood features. **This guide focuses on its
Lua API**, walks through the core scripting model and practical examples so you can build your Lua scripts.

**Important:** SAPP uses **LuaJIT** based on **Lua 5.1.**

This guide assumes you have read:

- [Common Reference](2026-09-17-halo-lua-common.md)
- [Memory Offsets Deep Dive](2025-09-07-halo-understanding-memory-offsets.md). 
- [SAPP Command Reference](2026-09-17-halo-sapp-command-reference.md).

---

## Script Skeleton & Version Check

See [this blank SAPP script](https://github.com/Chalwk/SPCLib/blob/master/sapp/blank_script_template.md)

---

### Where to Put Your Scripts

SAPP looks for Lua scripts in its `Lua` folder; By default, this is located in `./cg/sapp/lua`.

---

## Signature Scanning

Unlike Phasor or Chimera, SAPP can find memory addresses dynamically using byte patterns.
This makes scripts **version-independent** (PC/CE) without hardcoded offsets.

```lua
local gametype_base

function OnScriptLoad()
    -- Signature for gametype base (works on both PC and CE)
    gametype_base = read_dword(sig_scan("B9360000008BF3BF78545F00") + 0x8)
end

function get_score_limit()
    return read_byte(gametype_base + 0x58)
end
```

For more information on signature scanning, see [this guide](2025-09-07-halo-understanding-memory-offsets.md).

---

## Global Variables

| Variable          | Description                                                                                                                           |
|-------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `cb`              | A table of callback constants for use with `register_callback` and `unregister_callback`. Keys are strings like `"EVENT_GAME_START"`. |
| `halo_type`       | The version of Halo being used. `"CE"` for Halo Custom Edition, `"PC"` for retail Halo.                                               |
| `lua_api_version` | The Lua API version running on the server (e.g., `"1.12.0.0"`).                                                                       |
| `pid`             | The process ID of the server.                                                                                                         |
| `sapp_version`    | The SAPP version running on the server.                                                                                               |

---

## SAPP Functions

| Function                                                         | Description                                                                                                                                |
|------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| `add_var(name, type)`                                            | Creates a new custom event variable. `type`: 0=global string, 1=global int, 2=global float, 3=player string, 4=player int, 5=player float. |
| `assign_weapon(objectID, playerIndex)`                           | Assigns a weapon object to a player. Returns `true` on success.                                                                            |
| `camo(playerIndex, duration)`                                    | Applies active camouflage to a player for `duration` ticks (30 ticks/sec). Does nothing if already camo’d.                                 |
| `cprint(message, [color])`                                       | Outputs a message to the server console. Optional `color` value.                                                                           |
| `del_var(name)`                                                  | Deletes a custom event variable.                                                                                                           |
| `destroy_object(objectID)`                                       | Deletes an object. Deleting critical objects (flags, oddballs, etc.) may crash the server.                                                 |
| `drop_weapon(playerIndex)`                                       | Removes the player’s current weapon and throws it to the ground.                                                                           |
| `enter_vehicle(vehicleID, playerIndex, seat)`                    | Forces a player into a vehicle seat (e.g., `"1"` for driver). Returns success boolean.                                                     |
| `execute_command(command, [playerIndex], [echo])`                | Executes a server command, optionally on behalf of a player. If `echo` is `true`, raises `EVENT_ECHO` with output.                         |
| `execute_command_sequence(sequence, [playerIndex], [echo])`      | Executes a semicolon‑separated sequence of commands.                                                                                       |
| `exit_vehicle(playerIndex)`                                      | Forces a player to exit any vehicle they are in.                                                                                           |
| `get_dynamic_player(playerIndex)`                                | Returns the memory address of a player’s object (0 if not alive).                                                                          |
| `get_object_memory(objectID)`                                    | Returns the memory address of an object from its object ID (0 if invalid).                                                                 |
| `get_player(playerIndex)`                                        | Returns the static memory address of the player table entry.                                                                               |
| `get_var(playerIndex, variableName)`                             | Retrieves an event or custom variable. Use `playerIndex=0` for global variables.                                                           |
| `intersect(x, y, z, vx, vy, vz, [ignoreObjectID])`               | Performs a collision check. Returns `success, collisionX, collisionY, collisionZ, hitObjectID`.                                            |
| `kill(playerIndex)`                                              | Kills the player (adds death, applies respawn timer).                                                                                      |
| `lookup_tag(tagClass, tagPath)`                                  | Returns the memory address of a tag by class and path (e.g., `"weapon", "weapons\\pistol\\pistol"`).                                       |
| `lookup_tag(tagID)`                                              | Returns the memory address of a tag by its ID (variant for protected maps).                                                                |
| `player_alive(playerIndex)`                                      | Returns `true` if the player is alive.                                                                                                     |
| `player_present(playerIndex)`                                    | Returns `true` if the player is on the server.                                                                                             |
| `powerup_interact(objectID, playerIndex)`                        | Assigns a powerup object to a player. Returns success boolean.                                                                             |
| `rand([min, max])`                                               | Returns a cryptographically secure random number. `min` inclusive, `max` exclusive. Defaults: min=0, max=2^37.                             |
| `register_callback(callback, functionName)`                      | Registers a Lua function for an event callback (see `cb` table). Overwrites any previous callback.                                         |
| `rprint(playerIndex, message)`                                   | Sends a message to a player’s console.                                                                                                     |
| `say(playerIndex, message)`                                      | Sends a chat message to a specific player.                                                                                                 |
| `say_all(message)`                                               | Sends a chat message to all players on the server.                                                                                         |
| `set_var(playerIndex, variableName, value, [copiedPlayerIndex])` | Sets an event variable to `value`. Returns `false` if variable does not exist.                                                             |
| `sig_scan(signature)`                                            | Scans Halo’s executable for a byte signature (e.g., `"83EC??568BF0A0????????84C00F84"`). Returns address or 0.                             |
| `spawn_object(tagType, tagPath, [x, y, z, rotation, tagID])`     | Spawns an object at coordinates. If `tagID` given, `tagType`/`tagPath` are ignored. Returns object ID.                                     |
| `spawn_object_location(tagType, tagPath, locationName, [tagID])` | Spawns an object at a named location (defined via `loc_add`). Returns object ID.                                                           |
| `sync_ammo(objectID)`                                            | Syncs loaded and unloaded ammo of a weapon object.                                                                                         |
| `timer(milliseconds, functionName, [args...])`                   | Creates a timer that calls a function after a delay. If the function returns `true`, the timer repeats.                                    |
| `to_player_index(tableIndex)`                                    | Converts Halo internal player table index (0‑15) to SAPP player index (1‑16).                                                              |
| `to_real_index(playerIndex)`                                     | Converts SAPP player index (1‑16) to Halo internal table index (0‑15).                                                                     |
| `unregister_callback(callback)`                                  | Unregisters an event callback previously set with `register_callback`.                                                                     |
| `safe_read(enabled)`                                             | Enables/disables safe memory reading (prevents segfaults at performance cost).                                                             |
| `safe_write(enabled)`                                            | Enables/disables safe memory writing (allows modifying read‑only memory, but can crash game if misused).                                   |
| `read_bit(address, bit)`                                         | Reads a bit (0 or 1) from a byte at `address`.                                                                                             |
| `write_bit(address, bit, value)`                                 | Writes a bit to a byte at `address`. Returns success (segfaults without safe mode).                                                        |
| `read_byte(address)`                                             | Reads an unsigned 8‑bit byte (0‑255).                                                                                                      |
| `write_byte(address, value)`                                     | Writes an unsigned 8‑bit byte. Returns success.                                                                                            |
| `read_char(address)`                                             | Reads a signed 8‑bit byte (-128 to 127).                                                                                                   |
| `write_char(address, value)`                                     | Writes a signed 8‑bit byte. Returns success.                                                                                               |
| `read_word(address)`                                             | Reads an unsigned 16‑bit integer (0‑65535).                                                                                                |
| `write_word(address, value)`                                     | Writes an unsigned 16‑bit integer. Returns success.                                                                                        |
| `read_short(address)`                                            | Reads a signed 16‑bit integer (-32768 to 32767).                                                                                           |
| `write_short(address, value)`                                    | Writes a signed 16‑bit integer. Returns success.                                                                                           |
| `read_dword(address)`                                            | Reads an unsigned 32‑bit integer (0‑4294967295).                                                                                           |
| `write_dword(address, value)`                                    | Writes an unsigned 32‑bit integer. Returns success.                                                                                        |
| `read_int(address)`                                              | Reads a signed 32‑bit integer (-2147483648 to 2147483647).                                                                                 |
| `write_int(address, value)`                                      | Writes a signed 32‑bit integer. Returns success.                                                                                           |
| `read_float(address)`                                            | Reads a 32‑bit floating point number.                                                                                                      |
| `write_float(address, value)`                                    | Writes a 32‑bit floating point number. Returns success.                                                                                    |
| `read_double(address)`                                           | Reads a 64‑bit double‑precision float.                                                                                                     |
| `write_double(address, value)`                                   | Writes a 64‑bit double‑precision float. Returns success.                                                                                   |
| `read_vector3d(address)`                                         | Reads three 32‑bit floats as X, Y, Z. Returns `x, y, z`.                                                                                   |
| `write_vector3d(address, x, y, z)`                               | Writes three 32‑bit floats. Returns success.                                                                                               |
| `read_string(address)`                                           | Reads a null‑terminated 8‑bit string.                                                                                                      |
| `write_string(address, value)`                                   | Writes a null‑terminated 8‑bit string. Returns success.                                                                                    |

---

### math.atan2

SAPP doesn't have `math.atan2` so here is a pure Lua implementation.

```lua
if not math.atan2 then
    math.atan2 = function(y, x)
        if x > 0 then
            return math.atan(y / x)
        elseif x < 0 then
            return (y >= 0 and math.atan(y / x) + pi or math.atan(y / x) - pi)
        else
            if y > 0 then return pi / 2
            elseif y < 0 then return -pi / 2
            else return 0 end
        end
    end
end
```

---

THE REST OF THIS GUIDE IS STILL BEING WORKED ON

THE REST OF THIS GUIDE IS STILL BEING WORKED ON

THE REST OF THIS GUIDE IS STILL BEING WORKED ON

THE REST OF THIS GUIDE IS STILL BEING WORKED ON

---
