---
title: "Scripting with SAPP - Server-Side Lua"
date: 2026-05-17
categories: [ education, halo, modding ]
tags: [ sapp, lua, scripting, server ]
---

SAPP is a **server-side** extension for Halo PC/Custom Edition. It exposes a Lua Scripting API, anti-cheat tools, event
hooks, command handling, player management, logging, and numerous under-the-hood features. **This guide focuses on its
Lua API**, walks through the core scripting model and practical examples so you can build your Lua scripts.

**Important:** <u>SAPP uses <strong>LuaJit</strong> based on <strong>Lua 5.1</strong>.</u>

This guide assumes you have read:

- [Common Lua References](2026-05-17-halo-lua-common-references.md)
- [Memory Offsets Deep Dive](2025-09-07-halo-understanding-memory-offsets.md).
- [SAPP Command Reference](2026-05-17-halo-sapp-command-reference.md)

---

## Script Skeleton & Version Check

See [full blank script](https://github.com/Chalwk/SPCLib/blob/master/sapp/blank_script_template.lua) for a complete
example.

Every SAPP Lua script must define both `api_version` and `OnScriptLoad()`. Set `api_version` to match your server's SAPP
API version (for example: `"1.12.0.0"`). Without these definitions, SAPP will not load the script.

```lua
api_version = "1.12.0.0"

function OnScriptLoad() -- Required or script will not load
    -- Register callbacks here
end

function OnScriptUnload() -- Optional, but recommended to avoid Lua errors on unload
    -- Cleanup code (optional)
end
```

---

## Where to Put Your Scripts

SAPP looks for Lua scripts in its `Lua` folder; By default, this is located in `./cg/sapp/lua`.

---

## Lua Scripting Management

Commands for controlling Lua scripts (see also Configuration Commands).

| Command    | Level | Usage                                         | Description                                      |
|------------|-------|-----------------------------------------------|--------------------------------------------------|
| lua        | 4     | `lua [enabled]`                               | Enable Lua scripting. Default: false.            |
| lua_api_v  | 4     | `lua_api_v`                                   | Display current Lua API version.                 |
| lua_call   | 4     | `lua_call <script> <function> [arguments...]` | Call a function in a loaded Lua script.          |
| lua_load   | 4     | `lua_load <script>`                           | Load a Lua script and call `OnScriptLoad()`.     |
| lua_unload | 4     | `lua_unload <script>`                         | Unload a Lua script and call `OnScriptUnload()`. |

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

| Function                                                         | Description                                                                                                                                                                                  |
|------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `add_var(name, type)`                                            | Creates a new custom event variable. `type`: 0=global string, 1=global int, 2=global float, 3=player string, 4=player int, 5=player float.                                                   |
| `assign_weapon(objectID, playerIndex)`                           | Assigns a weapon object to a player. Returns `true` on success.                                                                                                                              |
| `camo(playerIndex, duration)`                                    | Applies active camouflage to a player for `duration` ticks (30 ticks/sec). Does nothing if already camo'd.                                                                                   |
| `cprint(message, [color])`                                       | Outputs a message to the server console. Optional `color` value.                                                                                                                             |
| `del_var(name)`                                                  | Deletes a custom event variable.                                                                                                                                                             |
| `destroy_object(objectID)`                                       | Deletes an object. Deleting critical objects (flags, oddballs, etc.) may crash the server.                                                                                                   |
| `drop_weapon(playerIndex)`                                       | Removes the player's current weapon and throws it to the ground.                                                                                                                             |
| `enter_vehicle(vehicleID, playerIndex, seat)`                    | Forces a player into a vehicle seat (e.g., `"1"` for driver). Returns success boolean.                                                                                                       |
| `execute_command(command, [playerIndex], [echo])`                | Executes a server command, optionally on behalf of a player. If `echo` is `true`, raises `EVENT_ECHO` with output.                                                                           |
| `execute_command_sequence(sequence, [playerIndex], [echo])`      | Executes a semicolon-separated sequence of commands.                                                                                                                                         |
| `exit_vehicle(playerIndex)`                                      | Forces a player to exit any vehicle they are in.                                                                                                                                             |
| `get_dynamic_player(playerIndex)`                                | Returns the memory address of a player's object (0 if not alive).                                                                                                                            |
| `get_object_memory(objectID)`                                    | Returns the memory address of an object from its object ID (0 if invalid).                                                                                                                   |
| `get_player(playerIndex)`                                        | Returns the static memory address of the player table entry.                                                                                                                                 |
| `get_var(playerIndex, variableName)`                             | Retrieves a player or global variable. Pass a player ID for player variables, or `0` for global variables such as `$map`. Use names like `$name` for player data and `$map` for global data. |
| `intersect(x, y, z, vx, vy, vz, [ignoreObjectID])`               | Performs a collision check. Returns `success, collisionX, collisionY, collisionZ, hitObjectID`.                                                                                              |
| `kill(playerIndex)`                                              | Kills the player (adds death, applies respawn timer).                                                                                                                                        |
| `lookup_tag(tagClass, tagPath)`                                  | Returns the memory address of a tag by class and path (e.g., `"weapon", "weapons\\pistol\\pistol"`).                                                                                         |
| `lookup_tag(tagID)`                                              | Returns the memory address of a tag by its ID (variant for protected maps).                                                                                                                  |
| `player_alive(playerIndex)`                                      | Returns `true` if the player is alive.                                                                                                                                                       |
| `player_present(playerIndex)`                                    | Returns `true` if the player is on the server.                                                                                                                                               |
| `powerup_interact(objectID, playerIndex)`                        | Assigns a powerup object to a player. Returns success boolean.                                                                                                                               |
| `rand([min, max])`                                               | Returns a cryptographically secure random number. `min` inclusive, `max` exclusive. Defaults: min=0, max=2^37.                                                                               |
| `register_callback(callback, functionName)`                      | Registers a Lua function for an event callback (see `cb` table). Overwrites any previous callback.                                                                                           |
| `rprint(playerIndex, message)`                                   | Sends a message to a player's console.                                                                                                                                                       |
| `say(playerIndex, message)`                                      | Sends a chat message to a specific player.                                                                                                                                                   |
| `say_all(message)`                                               | Sends a chat message to all players on the server.                                                                                                                                           |
| `set_var(playerIndex, variableName, value, [copiedPlayerIndex])` | Sets an event variable to `value`. Returns `false` if variable does not exist.                                                                                                               |
| `sig_scan(signature)`                                            | Scans Halo's executable for a byte signature (e.g., `"83EC??568BF0A0????????84C00F84"`). Returns address or 0.                                                                               |
| `spawn_object(tagType, tagPath, [x, y, z, rotation, tagID])`     | Spawns an object at coordinates. If `tagID` given, `tagType`/`tagPath` are ignored. Returns object ID.                                                                                       |
| `spawn_object_location(tagType, tagPath, locationName, [tagID])` | Spawns an object at a named location (defined via `loc_add`). Returns object ID.                                                                                                             |
| `sync_ammo(objectID)`                                            | Syncs loaded and unloaded ammo of a weapon object.                                                                                                                                           |
| `timer(milliseconds, functionName, [args...])`                   | Creates a timer that calls a function after a delay. If the function returns `true`, the timer repeats.                                                                                      |
| `to_player_index(tableIndex)`                                    | Converts Halo internal player table index (0-15) to SAPP player index (1-16).                                                                                                                |
| `to_real_index(playerIndex)`                                     | Converts SAPP player index (1-16) to Halo internal table index (0-15).                                                                                                                       |
| `unregister_callback(callback)`                                  | Unregisters an event callback previously set with `register_callback`.                                                                                                                       |
| `safe_read(enabled)`                                             | Enables/disables safe memory reading (prevents segfaults at performance cost).                                                                                                               |
| `safe_write(enabled)`                                            | Enables/disables safe memory writing (allows modifying read-only memory, but can crash game if misused).                                                                                     |
| `read_bit(address, bit)`                                         | Reads a bit (0 or 1) from a byte at `address`.                                                                                                                                               |
| `write_bit(address, bit, value)`                                 | Writes a bit to a byte at `address`. Returns success (segfaults without safe mode).                                                                                                          |
| `read_byte(address)`                                             | Reads an unsigned 8-bit byte (0-255).                                                                                                                                                        |
| `write_byte(address, value)`                                     | Writes an unsigned 8-bit byte. Returns success.                                                                                                                                              |
| `read_char(address)`                                             | Reads a signed 8-bit byte (-128 to 127).                                                                                                                                                     |
| `write_char(address, value)`                                     | Writes a signed 8-bit byte. Returns success.                                                                                                                                                 |
| `read_word(address)`                                             | Reads an unsigned 16-bit integer (0-65535).                                                                                                                                                  |
| `write_word(address, value)`                                     | Writes an unsigned 16-bit integer. Returns success.                                                                                                                                          |
| `read_short(address)`                                            | Reads a signed 16-bit integer (-32768 to 32767).                                                                                                                                             |
| `write_short(address, value)`                                    | Writes a signed 16-bit integer. Returns success.                                                                                                                                             |
| `read_dword(address)`                                            | Reads an unsigned 32-bit integer (0-4294967295).                                                                                                                                             |
| `write_dword(address, value)`                                    | Writes an unsigned 32-bit integer. Returns success.                                                                                                                                          |
| `read_int(address)`                                              | Reads a signed 32-bit integer (-2147483648 to 2147483647).                                                                                                                                   |
| `write_int(address, value)`                                      | Writes a signed 32-bit integer. Returns success.                                                                                                                                             |
| `read_float(address)`                                            | Reads a 32-bit floating point number.                                                                                                                                                        |
| `write_float(address, value)`                                    | Writes a 32-bit floating point number. Returns success.                                                                                                                                      |
| `read_double(address)`                                           | Reads a 64-bit double-precision float.                                                                                                                                                       |
| `write_double(address, value)`                                   | Writes a 64-bit double-precision float. Returns success.                                                                                                                                     |
| `read_vector3d(address)`                                         | Reads three 32-bit floats as X, Y, Z. Returns `x, y, z`.                                                                                                                                     |
| `write_vector3d(address, x, y, z)`                               | Writes three 32-bit floats. Returns success.                                                                                                                                                 |
| `read_string(address)`                                           | Reads a null-terminated 8-bit string.                                                                                                                                                        |
| `write_string(address, value)`                                   | Writes a null-terminated 8-bit string. Returns success.                                                                                                                                      |

---

## Displaying Information on Screen

The simplest way to send messages directly to players is using `say()`, `say_all()`, or `rprint()`.

- **`say(id, message)`** - Send chat message to a **specific player** (visible in the in-game chat area).
- **`say_all(message)`** - Sends chat message to **every player** on the server.
- **`rprint(id, message)`** - Send chat message to **player's console** (the text area you see when pressing `~`).

> **Note:** `say()` and `say_all()` messages appear in the player's chat box, while `rprint()` goes to the RCON console.
> For server-side console output, use `cprint()` - see
> the [Console Color Tutorial](#sapp-console-color-tutorial-cprint--set_ccolor).

### Examples

```lua
-- Send a private welcome message to a specific player (e.g., when they join)
say(player_id, "Welcome to the server, " .. get_var(player_id, "$name") .. "!")

-- Announce a server event to everyone
say_all("The flag has been captured! Next round in 10 seconds.")

-- Show a player their current score in the console (e.g., when they type /myscore)
rprint(player_id, "Your current score is: " .. get_var(player_id, "$score"))
```

---

## Signature Scanning and Game Version Detection

### Signature Scanning

SAPP can resolve memory addresses dynamically using byte patterns (signature scanning), making scripts *
*version-independent (PC/CE)** without relying on hardcoded addresses.

```lua
local gametype_base
function OnScriptLoad()
    -- Works on both PC and CE
    gametype_base = read_dword(sig_scan("B9360000008BF3BF78545F00") + 0x8)
end

function get_score_limit()
    return read_byte(gametype_base + 0x58)
end
```

---

### Handling Game Version (`halo_type`)

SAPP exposes the global `halo_type` to indicate the running game version. It returns a **case-sensitive string**: `"PC"`
or `"CE"`.

This is mainly useful as a **fallback when a reliable signature cannot be found** for a memory address. In those cases,
you can use version-specific fixed addresses instead of dynamic scanning.

```lua
local gametype_base, timelimit_address
function OnScriptLoad()
    local base_sig = sig_scan("B9360000008BF3BF78545F00")
    local header_sig = sig_scan("A1????????8B480C894D00")
    
    if base_sig == 0 or header_sig == 0 then return end

    gametype_base = read_dword(base_sig + 0x8)
    gameinfo_header = read_dword(header_sig + 0x1)

    -- Fallback: no reliable signature exists for timelimit, so use version-specific address
    timelimit_address = (halo_type == "PC" and 0x626630) or 0x5AA5B0
end
```

For more information on memory offsets and signature scanning,
see [this guide](2025-09-07-halo-understanding-memory-offsets.md).

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

## Use Provided API Helpers (Player Checks, Indices)

SAPP exposes convenience functions like `player_present()`, `player_alive()`, and `to_player_index()`. Use them instead
of custom checks to avoid edge-case bugs with slot indices and spectators.

---

## Converting Player Indices: to_player_index vs to_real_index

SAPP uses player indices 1 through 16 for its API functions such as `get_var()`, `say()`, `player_present()`, and
`player_alive()`. Halo internally uses real indices 0 through 15 for memory tables and arrays. The two conversion
functions let you switch between them.

1. `to_player_index(player_id)`
   Converts a Halo internal index (0-15) to a SAPP index (1-16).
   Use this when you have a real index from a low-level loop or memory scan and need to call SAPP functions.

2. `to_real_index(player_index)`
   Converts a SAPP index (1-16) to a Halo internal index (0-15).
   Use this when you have a SAPP player index from an event or API call and need to index into a zero-based memory
   array.

Example 1: Using `to_player_index`

```lua
for real = 0, 15 do
	local player = to_player_index(real)
	if player_present(player) then
		say(player, "You are visible")
	end
end
```

Example 2: Using `to_real_index`

```lua
function OnTick()
	for i = 1, 16 do
		if player_present(i) then
			local real = to_real_index(id)
			local checkpoint_addr = 0x500000 + (real * 4)
			local checkpoint = read_dword(checkpoint_addr)
		end
	end
end
```

Rule of thumb:

- SAPP API calls (`say`, `get_var`, `kill`, `rprint`, `player_present`), use SAPP indices (1-16)
- Direct memory reads/writes that use player slots (arrays of size 16), convert to real indices (0-15) first

---

## Security & Sanity Checks

- **Validate every client command** - Check player index exists, admin level for privileged commands, numeric ranges,
  and types. Never `loadstring` arbitrary strings from clients.
- **Rate-limit resource-hungry actions** (spawns, custom commands). Per-player cooldown tables are simple and effective.
- **Anti-tampering** - Assume a modified client will attempt odd commands; log suspicious behaviour server-side for
  review. SAPP offers anti-cheat utilities - use them.

---

## Networking, Tickrate & Hit Detection

Understanding Halo's simulation model helps you write accurate movement, projectile, and anti-cheat logic.

- **Tickrate reality:** The classic Halo engine runs at approximately **30 Hz** simulation/tick. This affects per-tick
  movement and projectile traversal. Be conservative when using timing constants.  
  See [hllmn's blog](https://hllmn.net/blog/2023-09-18_h1x-net) for more details.

- **Per-tick math:** Convert velocities to per-tick deltas: `per_tick = (WU_per_s / tickrate)`. That is how far a
  projectile moves each server tick. Use per-tick math for prediction and collision checks.

- **Latency compensation patterns:** Timestamp inputs (client-side) and use server reconciliation if you simulate player
  movement for anti-cheat. For most server-side scripts, record authoritative server states, apply client inputs when
  received (with reasonable bounds), and perform conservative validation (did the player have line-of-sight at that
  time?).  
  See [Wikipedia Netcode](https://en.wikipedia.org/wiki/Netcode) for general patterns.

- **Projectiles vs hitscan:** Understand weapon behavior. For CE, common projectile values are documented in tag files.
  Use those for accurate travel math.

---

## Event Handling Patterns & Anti-Spam

- **Debounce & coalesce:** If event X can fire many times quickly (weapon fire, damage), push a small entry into a queue
  and process it on a short repeating timer (e.g., every 50-200ms).

- **Rate-limit player actions:** Track timestamps per player for sensitive commands (e.g., `/spawngun`). If
  `now - last_cmd < limit`, reject silently or warn.

- **Priority queues:** For tasks of different criticality (immediate score updates vs. log writes), use separate queues
  to avoid blocking critical flows.

---

## Utility Functions

These functions read and write Halo's memory directly. They give you fine control over players, vehicles, weapons, and
game state.

> **Warning:** Always test memory operations on a non-production server first. Incorrect offsets can crash the game.

### Send Message to All Except a Specific Player

Sends a chat message to every connected player except one.

**Parameters:**

- `message` (string) - The message to send.
- `exclude_player_id` (number) - Player index (1-16) to skip.

```lua
local function send_exclude(message, exclude_player_id)
    for i = 1, 16 do
        if player_present(i) and i ~= exclude_player_id then
            say(i, message)
        end
    end
end
```

**Use case:** Announce "Player X found the secret" without revealing it to X.

### Check if Player is in a Vehicle

Quickly tests whether a player is riding in any vehicle.

**Parameters:**

- `dyn_player` (number) - Dynamic player memory address (from `get_dynamic_player`).

**Returns:** `true` if in a vehicle, `false` otherwise.

```lua
local function in_vehicle(dyn_player)
    return read_dword(dyn_player + 0x11C) ~= 0xFFFFFFFF
end
```

**Note:** `0xFFFFFFFF` means "no vehicle". This check is extremely fast - ideal for per-tick logic.

### Get the Vehicle Object a Player is In

Returns the memory address of the vehicle the player is currently occupying, or `nil` if none.

**Parameters:**

- `player_id` (number) - Player index (1-16).

**Returns:** Vehicle object address, or `nil`.

```lua
local function get_player_vehicle_object(player_id)
    if not player_present(player_id) or not player_alive(player_id) then return nil end

    local dyn = get_dynamic_player(player_id)
    if dyn == 0 then return nil end

    local vehicle_id = read_dword(dyn + 0x11C)
    if vehicle_id == 0xFFFFFFFF then return nil end

    return get_object_memory(vehicle_id)
end
```

### Check if a Vehicle is Occupied by Any Player

**Parameters:**

- `vehicle_object` (number) - Memory address of the vehicle.

**Returns:** `true` if at least one player is inside.

```lua
local function is_vehicle_occupied(vehicle_object)
    for i = 1, 16 do
        if get_player_vehicle_object(i) == vehicle_object then
            return true
        end
    end
    return false
end
```

**Example:** Eject any player who enters a reserved vehicle.

### Check if Player is Invisible

Detects active camouflage or script-based invisibility.

**Parameters:**

- `player_id` (number) - Player index (1-16).

**Returns:** `true` if invisible, `false` otherwise.

```lua
local function is_player_invisible(player_id)
    local dyn = get_dynamic_player(player_id)
    if dyn == 0 then return false end

    return read_float(dyn + 0x37C) == 1
end
```

### Clear Player's Console / Chat Buffer

Prints many blank lines to hide previous messages.

**Parameters:**

- `player_id` (number) - Player index.

```lua
local function clear_console(player_id)
    for _ = 1, 25 do
        rprint(player_id, " ")
    end
end
```

### Spawn or Teleport Player with Position and Rotation

Writes position and forward vector directly to a player's dynamic object.

**Parameters:**

- `dyn_player` (number) - Dynamic player address.
- `px, py, pz` (numbers) - Target coordinates.
- `p_rad` (number) - Facing direction in radians.
- `z_offset` (number, optional) - Vertical lift, defaults to `0.3`.

```lua
local function teleport_player(dyn_player, px, py, pz, p_rad, z_offset)
    z_offset = z_offset or 0.3
    write_vector3d(dyn_player + 0x5C, px, py, pz + z_offset)
    write_vector3d(dyn_player + 0x74, math.cos(p_rad), math.sin(p_rad), 0)
end
```

**Explanation:** Offset `0x5C` is the object's position; `0x74` is the forward vector (direction).

### Get Player's World Position (Adjusted for Crouch/Vehicle)

Returns the player's actual eye-level position, accounting for vehicles and crouching.

**Parameters:**

- `dyn_player` (number) - Dynamic player address.

**Returns:** `x, y, z` or `nil` if invalid state.

```lua
local function get_player_position(dyn_player)
    local crouch = read_float(dyn_player + 0x50C)          -- 0 = standing
    local vehicle_id = read_dword(dyn_player + 0x11C)
    local vehicle_obj = get_object_memory(vehicle_id)

    local x, y, z
    if vehicle_id == 0xFFFFFFFF then
        x, y, z = read_vector3d(dyn_player + 0x5C)         -- feet position
    elseif vehicle_obj and vehicle_obj ~= 0 then
        x, y, z = read_vector3d(vehicle_obj + 0x5C)        -- vehicle origin
    end

    local z_offset = (crouch == 0) and 0.65 or 0.35 * crouch

    return x, y, z + z_offset
end
```

### Get Player's Aim / Camera Direction Vector

**Parameters:**

- `dyn_player` (number) - Dynamic player address.

**Returns:** `aim_x, aim_y, aim_z` (the camera's facing direction).

```lua
local function get_aim_vector(dyn_player)
    local ax = read_float(dyn_player + 0x230)
    local ay = read_float(dyn_player + 0x234)
    local az = read_float(dyn_player + 0x238)
    return ax, ay, az
end
```

### Vanish a Player (Move Off-Map)

Moves a player far off-map so others cannot see them. Must be called every tick to stay hidden.

**Parameters:**

- `player_id` (number) - Player index.

```lua
local function vanish_player(player_id)
    local static = get_player(player_id)
    if not static then return end
    
    local dyn = get_dynamic_player(player_id)
    if dyn == 0 then return end

    local x, y, z = get_player_position(dyn)   -- uses function above
    if not x then return end

    write_float(static + 0xF8, x - 1000)       -- X offset in static table
    write_float(static + 0xFC, y - 1000)       -- Y offset
    write_float(static + 0x100, z - 1000)      -- Z offset
end
```

**Usage:** Call from `OnTick` for each vanished player.

### Override Player's Respawn Time

Writes directly to the static player table to change respawn delay.

**Parameters:**

- `player_id` (number) - Player index (1-16).
- `respawn_time` (number, optional) - Seconds until respawn, defaults to `3`.

```lua
local function set_respawn_time(player_id, respawn_time)
    respawn_time = respawn_time or 3
    local static = get_player(player_id)
    if static then
        write_dword(static + 0x2C, respawn_time * 33)   -- 33 ticks/second
    end
end
```

### Get Score Limit of Current Game

Reads the score limit (kills, captures, points) from the active game type.

**Returns:** Score limit as a number.

```lua
local gametype_base
function OnScriptLoad()
    gametype_base = read_dword(sig_scan("B9360000008BF3BF78545F00") + 0x8)
    register_callback(cb.EVENT_GAME_START, "OnStart")
    OnStart() -- in case script loads mid-game
end

function OnStart()
    if get_var(0, '$gt') == "n/a" then return end
    local score_limit = read_byte(gametype_base + 0x58)
    cprint("Score limit: " .. score_limit, 10)
end
```

### Get Server Base Directory and Config Path

Dynamically locate your Halo server folder - no hardcoded paths.

```lua
local function get_base_dir(folder)
    folder = folder or ""
    local exe_path = read_string(read_dword(sig_scan('0000BE??????005657C605') + 0x3))
    local base_path = exe_path:match("(.*\\)")
    return base_path .. folder
end

local function get_config_path()
    return read_string(read_dword(sig_scan('68??????008D54245468') + 0x1))
end
```

**Examples:**

```lua
local base = get_base_dir()        -- "C:\YourHaloServer\"
local maps = get_base_dir("maps")  -- "C:\YourHaloServer\maps"
local sapp_cg = get_config_path()  -- "C:\YourHaloServer\cg\sapp"
```

---

## Vehicle & Weapon Functions

### Get Tag Class and Name from any Object

**Parameters:**

- `object` (number) - Memory address of the object (vehicle, weapon, etc.).

**Returns:** `tag_class` (byte), `tag_name` (string).

```lua
local function get_tag_from_object(object)
    local tag_class = read_byte(object + 0xB4)
    local tag_index = read_word(object)                     -- tag index in table
    local tag_address = tag_index * 32 + 0x40440038         -- base tag table + 0x38
    local tag_name = read_string(read_dword(tag_address))
    return tag_class, tag_name
end
```

**Example - OnVehicleEnter:**

```lua
function OnVehicleEnter(player_id)
    local dyn = get_dynamic_player(player_id)
    if dyn == 0 then return end
    
    local vehicle_id = read_dword(dyn + 0x11C)
    if vehicle_id == 0xFFFFFFFF then return end

    local vehicle_obj = get_object_memory(vehicle_id)
    if vehicle_obj == 0 then return end

    local class, name = get_tag_from_object(vehicle_obj)
    cprint(class .. " " .. name, 11) -- print vehicle name to the SAPP terminal 
end
```

### Check if Player is Holding Flag or Oddball

**Parameters:**

- `dyn_player` (number) - Dynamic player address.
- `objective_type` (string, optional) - `"oddball"`, `"flag"`, or `"any"` (default `"any"`).

**Returns:** `true` if holding the specified objective.

```lua
local function has_objective(dyn_player, objective_type)
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

### Get Player's Full Inventory (Weapons, Ammo, Grenades)

Returns a table of all weapon slots (1-4) with detailed stats. Empty slots are omitted.

**Parameters:**

- `dyn_player` (number) - Dynamic player address.

**Returns:** Table where each key is a slot number, and each value is a table with fields:
`id, ammo, clip, ammo2, clip2, heat, frags, plasmas`.

```lua
local function get_inventory(dyn_player)
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

### Get Current Weapon Slot Index

**Parameters:**

- `dyn_player` (number) - Dynamic player address.

**Returns:** Slot number (0-3).

```lua
local function get_weapon_slot(dyn_player)
    return read_byte(dyn_player + 0x2F2)
end
```

---

## Tag & Map Data Helpers

### Find Tag by Substring in Name or Path

Scans the tag table for a tag whose name contains a given substring (case-insensitive). Optionally filter by class.

**Parameters:**

- `substring` (string) - Text to search for.
- `class_filter` (string or nil) - Optional, e.g., `"weap"`, `"vehi"`. Pass `nil` for all classes.

**Returns:** Meta index of the first matching tag, or `nil`.

```lua
local base_tag_table = 0x40440000

local function find_tag_by_substring(substring, class_filter)
    substring = substring:lower()
    local tag_array = read_dword(base_tag_table)
    local tag_count = read_dword(base_tag_table + 0xC)
    local filter_hash = class_filter and read_dword(lookup_tag(class_filter, "")) or nil

    for i = 0, tag_count - 1 do
        local tag = tag_array + 0x20 * i
        local class_hash = read_dword(tag)
        if filter_hash and class_hash ~= filter_hash then goto continue end
        local name_ptr = read_dword(tag + 0x10)
        if name_ptr and name_ptr ~= 0 then
            local name = read_string(name_ptr)
            if name and name:lower():find(substring, 1, true) then
                return read_dword(tag + 0xC)   -- meta index
            end
        end
        ::continue::
    end
    return nil
end
```

**Example:**

```lua
local rocket_meta = find_tag_by_substring("rocket", "weap")
if rocket_meta then
    spawn_object("", "", 100, 100, 100, 0, rocket_meta)
end
```

### Get Flag Object Meta ID and Tag Name

Detects the flag (objective) tag on the current map.

**Returns:** `meta_id, tag_name` or `nil, nil` if no flag exists.

```lua
local function get_flag_data()
    local tag_array = read_dword(base_tag_table)
    local tag_count = read_dword(base_tag_table + 0xC)
    for i = 0, tag_count - 1 do
        local tag = tag_array + 0x20 * i
        if read_dword(tag) == 0x77656170 then   -- "weap" class hash
            local tag_data = read_dword(tag + 0x14)
            if read_bit(tag_data + 0x308, 3) == 1 and read_byte(tag_data + 2) == 0 then
                local meta = read_dword(tag + 0xC)
                local name_ptr = read_dword(tag + 0x10)
                local name = read_string(name_ptr)
                return meta, name
            end
        end
    end
    return nil, nil
end
```

### Get Tag Data Memory Address by Class and Name

Wrapper around `lookup_tag` that returns the tag's data address.

**Parameters:**

- `class` (string) - Tag class, e.g., `"weap"`.
- `name` (string) - Tag path, e.g., `"weapons\\pistol\\pistol"`.

**Returns:** Memory address of the tag data, or `nil`.

```lua
local function get_tag_data(class, name)
    local tag = lookup_tag(class, name)
    return tag and read_dword(tag + 0xC) or nil
end
```

### Debug: Scan and Print All Weapons, Vehicles, Equipment

Prints tag information for every weapon, vehicle, and equipment on the map. Useful during development.

```lua
local function scan_map_objects()
    local tag_array = read_dword(base_tag_table)
    local tag_count = read_dword(base_tag_table + 0xC)
    local function class_name(hash)
        if hash == 0x76656869 then return "vehi"
        elseif hash == 0x77656170 then return "weap"
        elseif hash == 1701931376 then return "eqip"
        else return nil end
    end
    for i = 0, tag_count - 1 do
        local tag = tag_array + 0x20 * i
        local class = read_dword(tag)
        local name_str = class_name(class)
        if name_str then
            local name_ptr = read_dword(tag + 0x10)
            local name = (name_ptr ~= 0) and read_string(name_ptr) or "<no-name>"
            local meta = read_dword(tag + 0xC)
            cprint(string.format("%s meta=%u name=%s", name_str, meta, name), 12)
        end
    end
end
```

---

## Startup Hang Max Idle Fix

Add this line to your SAPP `init.txt` (the one in the SAPP folder):

```
max_idle 1
```

This prevents the default 60-second idle/mapcycle behavior that commonly shows up as a 60-second "hang" on boot.

- **SAPP docs - `max_idle` behavior:** Sets how many seconds of server idle before SAPP restarts the mapcycle. Default
  is 60 seconds. Changing it to `1` makes that restart happen almost immediately.
- **Where to put it:** Some Halo servers use two `init.txt` files (one for the dedicated server, another for SAPP). Put
  `max_idle 1` in the SAPP `init.txt` to avoid the 60-second delay.

### Short caveats & notes

- `max_idle` affects how SAPP handles *idle* servers (mapcycle restarts). Setting it to `1` avoids the startup pause,
  but if you rely on idle mapcycle behavior for other reasons, test the change first.
- Make sure you edit the correct `init.txt` (the SAPP one) - some installs have two.

---

## Timing & Movement Reference

**Core tick rate**  
Halo PC / CE simulates at **30 ticks per second**. Tick duration = `1 / 30 = 0.033333... s` (approx 33.333 ms).

**World unit conversion**  
**1 World Unit (WU) = 10 feet = 3.048 meters.** Waypoints shown in-game are expressed in meters, so multiply WU by *
*3.048** to get metres.

**How to compute distances per tick**

- Tick seconds = `1 / 30`.
- Distance per tick (WU) = `velocity_wu_per_s * (1 / 30)`.
- Distance per tick (m) = `velocity_wu_per_s * (1 / 30) * 3.048`.

**Where to get projectile speeds (CE PC)**  
Projectile speed values for CE are stored in the projectile tag (HEK / Custom Edition). Look up the projectile tag's
initial velocity field using HEK tools (Tool / Guerilla / Sapien).

**Why first-tick distance matters**  
CE simulates motion on discrete ticks. A projectile with initial velocity `V` (WU/s) will travel `V / 30` WU in its
first tick. That often determines the range at which a projectile *feels* instant.

**Scripter quick formulas**

```lua
-- CE constants
TICK_RATE = 30               -- ticks per second (CE)
TICK_SEC  = 1 / TICK_RATE    -- seconds per tick (~0.033333)
WU_TO_M = 3.048              -- metres per world unit

-- Given initial projectile velocity (from the CE projectile tag) in WU/s:
initial_wu_s = read_from_projectile_tag

-- distance travelled in one tick
wu_per_tick = initial_wu_s * TICK_SEC
m_per_tick  = wu_per_tick * WU_TO_M
```

**Practical notes for PC/CE server operators**

- Always read projectile initial velocities from the PC/CE tag files used by your server build rather than copying
  values
  from MCC or community posts. HEK tag values are authoritative for PC/CE.
- Small differences across community builds, patches, or ports can change projectile timing. Test on the exact PC/CE
  executable and tagset your players use.
- To measure first-tick travel for a weapon, use the projectile tag initial velocity, divide by 30, and convert to
  metres with `* 3.048`.

---

## Assigning 3 or More Weapons

Delay **tertiary** and **quaternary** assignments by at least 250ms to prevent them from dropping.

```lua
api_version = '1.12.0.0'

local WEAPONS = {
    'weapons\\pistol\\pistol',
    'weapons\\sniper rifle\\sniper rifle',
    'weapons\\shotgun\\shotgun',
    'weapons\\assault rifle\\assault rifle'
}

-- Function to assign weapons to a player
local function assign_weapon(player_id)
    -- Delete the player's inventory first:
    execute_command('wdel ' .. player_id)

    -- Assign primary and secondary weapons immediately
    local primary_weapon = spawn_object('weap', WEAPONS[1], 0, 0, 0)
    local secondary_weapon = spawn_object('weap', WEAPONS[2], 0, 0, 0)
    
    assign_weapon(primary_weapon, player_id)
    assign_weapon(secondary_weapon, player_id)

    local tertiary_weapon = spawn_object('weap', WEAPONS[3], 0, 0, 0)
    local quaternary_weapon = spawn_object('weap', WEAPONS[4], 0, 0, 0)
    
    -- Assign tertiary and quaternary weapons with a delay
    timer(250, "assign_weapon", tertiary_weapon, player_id)
    timer(500, "assign_weapon", quaternary_weapon, player_id)
    
    -- Technical note: 
    -- SAPP's "assign_weapon" function will fail silently/safely if the player is dead.
end

function OnScriptLoad()
    register_callback(cb.EVENT_SPAWN, "OnSpawn")
end

-- Assign weapons when the player spawns:
function OnSpawn(player_id)
    assign_weapons(player_id)    
end

function OnScriptUnload() end
```

---

## Fixing Vehicle Physics Glitch

Sometimes, directly writing a vehicle's position with `write_vector3d()` can cause glitchy physics. This method reduces,
but does not fully eliminate, teleport glitches.

**Usage Notes:**

1. Update the vehicle's position as usual (e.g., `write_vector3d(object + 0x5C, x, y, z)`).
2. Apply a tiny downward Z-velocity to stabilize physics.
3. Unset the no-collision & ignore-physics bits to restore normal behavior.

**Example Fix:**

```lua
-- Apply new position
-- write_vector3d(object + 0x5C, x, y, z)

-- Apply tiny downward velocity
write_float(object + 0x70, -0.025)

-- Unset no-collision & ignore-physics bits
write_bit(object + 0x10, 0, 0)
write_bit(object + 0x10, 5, 0)
```

---

## Name/Password Admin Setup

I generally **do not recommend adding users as hash-admins**, since many players use pirated clients. Similarly, because
most players have **dynamic IP addresses**, assigning them as IP-admins is often impractical.

For these members, use the **Name/Password system** instead.

### How to Set Up Name/Password Admins

1. **Add the admin** using the command:  
   `admin_add <player_name> <password> <level>`
    - `<player_name>`: The exact in-game name the player uses to join.
    - `<password>`: A password you set for them.
    - `<level>`: Admin level (1-4).  
      **Example:**  
      `admin_add Chalwk mySecurePassword123 3`

2. **Activating admin privileges:**  
   After joining the server, admins must enter `login <password>` in in-game chat to activate their privileges.

**Security Recommendations:**

- Assign a **unique password for each admin**. If one password is compromised, other users are not affected.
- Admins do **not need to log in every time**, unless the server is restarted or their IP changes.

For users with **legitimate CD keys**, the hash-based system remains the recommended method.

---

## Player Count Var Delay

During `EVENT_LEAVE`, `get_var(0, "$pn")` does not update immediately. Subtract `1` manually to get the correct player
count.

**Example Usage:**

```lua
function OnLeave()
    local n = tonumber(get_var(0, "$pn")) - 1
    print('Total Players: ' .. n)
end
```

---

## SAPP's `rand()` Upper Bound

SAPP's built-in `rand(min, max)` excludes the upper bound (`max`). That means: `rand(1, 4)` can only return: `1, 2, 3`,
not `4`. Because of this, using: `rand(1, #t)` would never select the last element in the table. To include the final
index, increment the upper bound by `1`:

```lua
local t = {'a', 'b', 'c'}
local i = rand(1, #t + 1)

print(t[i]) -- can print 'a', 'b', or 'c'
```

With `#t == 3`, the call becomes: `rand(1, 4)` which allows indices `1` through `3` to be returned.

---

## SAPP Console Color Tutorial (`cprint` / `set_ccolor`)

Understanding how to use colors in SAPP's console and messages makes your server logs, automated messages, and scripts
much more readable. The system is based on classic Windows console color attributes.

### 1. The Basics: The Color Number

The color is defined by a single number, calculated by combining a **Foreground** color and a **Background** color.

**Formula:**  
`Color Number = Foreground_Color + (Background_Color * 16)`

- **Foreground** - text color (value 0 to 15).
- **Background** - color behind the text (value 0 to 15, multiplied by 16).

**Example:**  
Green text (Foreground 10) on Black background (Background 0):  
`10 + (0 * 16) = 10` → `cprint("Hello", 10)` prints green text.

Red text (Foreground 12) on Light Aqua background (Background 11):  
`12 + (11 * 16) = 188` → `cprint("Warning!", 188)`.

### 2. The Color Code Table

| Color Name   | Value |
|--------------|:-----:|
| Black        |   0   |
| Dark Blue    |   1   |
| Dark Green   |   2   |
| Dark Aqua    |   3   |
| Dark Red     |   4   |
| Dark Purple  |   5   |
| Dark Yellow  |   6   |
| Light Gray   |   7   |
| Gray         |   8   |
| Blue         |   9   |
| Green        |  10   |
| Aqua         |  11   |
| Red          |  12   |
| Light Purple |  13   |
| Yellow       |  14   |
| White        |  15   |

*Note: Background colors use the same values, multiplied by 16.*

### 3. How to Use It

**A) In Lua Scripts with `cprint`**  
Sends a colored message to the **server's console**.

```lua
cprint("Script loaded successfully!", 10) -- Green success
cprint("Player connected.", 14) -- Yellow
cprint("ERROR: Invalid command!", 12 + (14*16)) -- Red on Yellow (236)
```

**B) With the `set_ccolor` Command**  
Changes the default color of the **entire server console** until changed again or server restarts.

```
set_ccolor 11
```

(Aqua text on black background)

### 4. Common Combinations & Tips

- **Success:** Green (10)
- **Info / Notification:** Aqua (11) or Yellow (14)
- **Warning:** Yellow on Black (14)
- **Error / Alert:** Red (12)
- **Admin Message:** Light Purple (13)
- **Debug Data:** Gray (8)

> **Pro Tip:** Avoid high-intensity background colors (like White 15) for large text blocks - they are hard to read. Use
> them sparingly for important warnings.

**Resetting:** To return to default (Light Gray on Black), use `set_ccolor 7`.

---

## SAPP's "DoS" Protection: Explained

Let's be precise: SAPP offers **DoS (Denial-of-Service)** protection, which is different from **DDoS (Distributed
Denial-of-Service)**. The key difference is one attacker vs. many.

### What SAPP Does Well (The Good)

SAPP is excellent at mitigating common nuisances and basic attacks:

1. **Packet Flooding** - `packet_limit` (default 1000 packets/second per IP) instantly kicks any single IP exceeding the
   threshold. Stops simple UDP floods.
2. **Join Spamming** - `antihalofp` automatically IP bans players who attempt to join too frequently. Neutralizes tools
   like "Halo Flood Prevent".
3. **RCON Brute-Force Protection** - After 4 failed RCON password attempts, the IP is banned for one hour.
4. **Resource Management** - Core fixes reduce CPU usage and memory leaks, making the server more resilient.

### Where It Falls Short (The Limitations)

A true, large-scale **D**DoS attack will overwhelm SAPP's protections:

- **No Volume-Based Mitigation** - `packet_limit` works per IP. A DDoS uses thousands of unique IPs; each appears as
  normal traffic. The network port still saturates.
- **Application Layer vs. Network Layer** - SAPP works at the application layer (understands Halo's protocol). It cannot
  filter at the network layer or distinguish legitimate packets from garbage bandwidth floods.
- **On-Server Only** - If attack traffic is large enough, it can saturate the server's network card before SAPP even
  processes packets.

### Summary

| For This...                                                    | SAPP is...                                                    |
|----------------------------------------------------------------|---------------------------------------------------------------|
| Script Kiddies using public flooding tools                     | Excellent. Stops them cold.                                   |
| Join Spammers trying to crash the server with fake players     | Excellent. `antihalofp` is built for this.                    |
| RCON Brute-Forcers trying to guess your password               | Excellent. The 4-strike rule works perfectly.                 |
| Small, simple DoS attacks from a single IP or a handful of IPs | Very Good. `packet_limit` handles this well.                  |
| Large-Scale DDoS from a massive botnet (100s/1000s of IPs)     | Not sufficient. Will not stop a saturated network connection. |

**Recommendations:**

1. **For most server hosts** - SAPP's protections are **enough**. They handle 99% of attacks you will ever see.
2. **If you are a high-profile target** (popular scrim server, tournament) - You **must** have additional protection:
    - Use a game server provider with **DDoS mitigation** at the network level.
    - Look into proxy services (complex for game traffic).
    - Ensure your host has infrastructure to absorb large attacks.

**In short:** SAPP's protection is expertly tailored for the specific threats a Halo server faces. It is not a magic
shield against a determined attacker with a large botnet. Enable all features (`packet_limit`, `antihalofp`, etc.) and
consider them your essential first line of defense.

---

## Special Text Positioning Characters for HAC2 Users (`|l`, `|r`, `|c`, `|n`, `|t`)

When sending private messages with `rprint()`, you can prefix your message with one of several special characters to
reposition the text on the player's screen. This only works if the player has the **HAC2 client** installed. Players
using **Chimera** (or vanilla Halo) will not see the repositioning effect; their messages will appear at default
positions defined by the client.

### Available Positioning Characters

| Prefix  | Effect                                                |
|---------|-------------------------------------------------------|
| **\|l** | Left-align the message (default position).            |
| **\|r** | Right-align the message.                              |
| **\|c** | Center the message horizontally.                      |
| **\|n** | Place the message at the "normal" (default) position. |
| **\|t** | Tab the message                                       |

These characters are stripped from the displayed message and only affect layout.

#### Example

```lua
rprint("|cHello, welcome to my server")   -- Centers the message
rprint("|rPlayer joined: " .. playerName) -- Right-aligns the message
```

> **Note:** Because HAC2 and Chimera handle text positioning differently, scripters should avoid relying solely on `|c`,
`|l`, etc., for critical information. For maximum compatibility, consider sending plain messages and let players
> configure their own client's layout via `chimera.ini` if they use Chimera.

---

## Advanced: Using LuaJIT and FFI in SAPP

SAPP uses **LuaJIT**, a high-performance just-in-time compiler based on Lua 5.1. This means most Lua 5.1 code works
normally, but LuaJIT also includes some features from newer Lua versions and its own extensions.

In addition, you get advanced capabilities like the `ffi` library to call C functions and manipulate memory directly.

### 1 What LuaJIT Gives You

* Full compatibility with **Lua 5.1**
* Support for some **Lua 5.2+ features** and LuaJIT extensions (such as `goto`, the `bit` library for bitwise
  operations, `_ENV` environments, and performance helpers like `table.new` and `table.clear`)
* `ffi` library - call C functions, define structs, work with raw memory
* Better performance for math-heavy or iterative code

> **Note:** SAPP scripts run in a sandboxed environment. Some operating system APIs may be restricted, and unsafe memory
> operations can crash the server. Proceed with caution.

### 2 Checking if `ffi` is Available

You can test if your SAPP version exposes `ffi`:

```lua
function OnScriptLoad()
    if pcall(function() require("ffi") end) then
        print("ffi is available")
    else
        print("ffi is NOT available")
    end
end
```

* `pcall` prevents crashes if `ffi` is blocked.
* The output appears in the server console.

### 3 Fully Functional Demo: Ticks Since Boot

Here is a real-world FFI example: calling `GetTickCount` from the Windows API to get milliseconds since system boot.

```lua
api_version = '1.12.0.0'

local ffi = require("ffi")

-- Declare the C function we want to call
ffi.cdef[[
    unsigned long GetTickCount(void);
]]

function OnScriptLoad()
    -- Call the function and print result to the server console
    local ticks = ffi.C.GetTickCount()
    cprint(string.format("Ticks since boot: %d", ticks), 10) -- print in green
    
    register_callback(cb.EVENT_TICK, "OnTick")
end

-- Print ticks every 10 seconds
function OnTick()
    if (os.clock() % 10) < 0.05 then
        local ticks = ffi.C.GetTickCount()
        cprint(string.format("Ticks since boot: %d", ticks), 10) -- print in green
    end
end
```

#### How It Works

1. **`api_version`** - Required for SAPP 1.12.0.0 scripts.
2. **`ffi.cdef`** - Declares the C function signature so LuaJIT knows how to call it.
3. **`ffi.C.GetTickCount()`** - Calls the actual Windows API function.
4. **`cprint`** - A SAPP built-in that prints colored text to the server console (color code 10 is green).
5. **`OnTick`** - Runs every game tick (about 30 times per second). We use `os.clock()` to throttle the output to once
   every 10 seconds.

### 4 Key Tips and Safety

* Start with **safe, read-only operations**. Do not write to arbitrary memory addresses.
* Avoid writing memory directly unless you know the exact structure and offset.
* Remember that SAPP Lua is sandboxed; not all OS APIs or memory operations are available.
* Some Lua features available in LuaJIT (like `goto`) may not be recognized by all editors or plugins that assume strict
  Lua 5.1 syntax.

> **Tip:** Use FFI to read server performance counters, system time, or interact with external libraries, but always
> test thoroughly on a non-production server first.

### 5 Using `table.new`, `table.clear`, `_ENV`, and `bit`

LuaJIT provides several performance-oriented extensions that can make your scripts faster and more memory-efficient.

#### `table.new(narray, nhash)`

Pre-allocates a table with space for `narray` array elements and `nhash` hash (key-value) slots. This avoids repeated
resizing when you know the table size in advance.

```lua
local table_new = require("table.new")

-- Create a table pre-sized for 10 array elements and 5 hash entries
local my_table = table_new(10, 5)

-- Add array elements (integer keys)
my_table[1] = "a"
my_table[2] = "b"

-- Add hash entries (string keys)
my_table.name = "LuaJIT"
my_table.version = "2.1"

-- Print numeric indices
for i = 1, #my_table do
    print("Index " .. i .. ": " .. tostring(my_table[i]))
end

-- Print named keys
for k, v in pairs(my_table) do
    if type(k) ~= "number" then
        print("Key '" .. k .. "': " .. tostring(v))
    end
end
```

#### `table.clear(tab)`

Clears all elements from a table without deallocating its memory. This is much faster than creating a new empty table
when you need to reuse an existing one.

```lua
local table_clear = require("table.clear")

local scores = { player1 = 5, player2 = 3, player3 = 8 }
print("Before clear:", #scores)  -- No effect on array part, but hash cleared

-- Clear the table (removes all key-value pairs)
table_clear(scores)

print("After clear:", next(scores))  -- nil (table is empty)
```

#### `_ENV` Environments

LuaJIT supports `_ENV`, which lets you control the environment (global variable table) for a chunk of code. You can
create sandboxes or restrict access to certain globals.

```lua
-- Create a custom environment that hides dangerous functions
local sandbox_env = {
    print = print,  -- allow print
    math = math,    -- allow math library
    -- "os" and "io" are intentionally omitted
}

-- Run a function with the custom environment
local function run_in_sandbox(f)
    local old_env = _ENV
    _ENV = sandbox_env
    local success, err = pcall(f)
    _ENV = old_env
    return success, err
end

-- This works because print is in the sandbox
run_in_sandbox(function() print("Hello from sandbox") end)

-- This will error because os.execute is not available
run_in_sandbox(function() os.execute("format c:") end)  -- error: attempt to index a nil value (global 'os')
```

> **Warning:** Modifying `_ENV` globally affects all subsequent code. Use local `_ENV` overrides or restore the original
> environment as shown above.

#### `bit` Library - Bitwise Operations

LuaJIT includes the `bit` library for fast bitwise operations (AND, OR, XOR, shifts, etc.). These are useful for
packing/unpacking flags, working with network protocols, or interacting with C structures that use bit fields.

```lua
local bit = require("bit")

local flags = 0

-- Set bit 2 (value 4) and bit 5 (value 32)
flags = bit.bor(flags, 4, 32)   -- flags = 36 (binary 100100)

-- Check if bit 2 is set
if bit.band(flags, 4) ~= 0 then
    print("Bit 2 is set")
end

-- Clear bit 5
flags = bit.band(flags, bit.bnot(32))   -- flags = 4

-- Bit shifting examples
local shifted = bit.lshift(1, 3)   -- 1 << 3 = 8
print("1 << 3 =", shifted)

local original = bit.rshift(8, 3)  -- 8 >> 3 = 1
print("8 >> 3 =", original)

-- Pack two 16-bit values into one 32-bit integer
local high = 0xABCD
local low  = 0x1234
local packed = bit.bor(bit.lshift(high, 16), low)
print(string.format("Packed: 0x%08X", packed))  -- 0xABCD1234

-- Unpack again
local high2 = bit.rshift(packed, 16)
local low2  = bit.band(packed, 0xFFFF)
print(string.format("Unpacked: 0x%04X, 0x%04X", high2, low2))
```

Combine these extensions with SAPP events for efficient, high-performance scripts. For example, pre-allocate tables for
player data with `table.new`, clear them with `table.clear` between maps, use bitwise flags for player states, and
sandbox admin commands with `_ENV` for extra safety.

---

## Sources & Further Reading

- [Scripting - c20](https://c20.reclaimers.net/h1/scripting)
- [Halo in 60 FPS - Halo PC: Development - Open Carnage](https://opencarnage.net/index.php?%2Ftopic%2F6527-halo-in-60-fps)
- [Set up metric units in Blender - Halo CE - Open Carnage](https://opencarnage.net/index.php?%2Ftopic%2F8402-set-up-metric-units-in-blender)
- [Scale and unit conversions - c20](https://c20.reclaimers.net/general/scale)
- [weapon - c20](https://c20.reclaimers.net/h1/tags/object/item/weapon)
- [(HEK) Halo Editing Kit for Halo (CE) Custom Edition](https://www.halomaps.org/hce/detail.cfm?fid=411)
- [Halo CE: The Xbox Experience - Open Carnage](https://opencarnage.net/index.php?%2Ftopic%2F5784-halo-ce-the-xbox-experience)

---

## Complete Examples:

See my [Phasor Script Archive](https://github.com/Chalwk/SPCLib/tree/master/sapp).

---