---
title: "Scripting with SAPP - Server-Side Lua"
permalink: /halo/sapp/scripting-with-sapp/
date: 2026-11-09
last-updated: 2026-11-09
categories: [ education, halo, modding ]
tags: [ sapp, lua, scripting, server, tutorial ]
---

SAPP is a server-side extension for Halo PC/CE. It gives you a Lua API, anti-cheat, event hooks,
commands, player management, and direct memory access. Scripts run on dedicated servers
(`haloded.exe` / `haloceded.exe`).

---

## Reference Files

- [Utils](utils.md): Conventions, helper functions, and known quirks.
- [Server Guide](server-guide.md): Complete guide to setting up, configuring, and running SAPP on
  a server.
- [Common References](../common-reference.md): Memory offsets, game constants, unit
  conversions, shared helpers, and stock Halo commands.
- [Cheat Sheet](cheat-sheet.md): Pointers, `sig_scan` patterns, `get_var` variables, SAPP
  commands, and console colors.
- [SAPP Lua Template](template.md): Script skeleton and callback reference.

SAPP Lua scripts cannot talk to each other directly. The only shared channel is custom variables
(see Custom Variables in [Cheat Sheet](cheat-sheet.md)).

---

## Runtime Environment

| Feature                     | Details                                                                                                              |
|-----------------------------|----------------------------------------------------------------------------------------------------------------------|
| Lua runtime                 | LuaJIT based on Lua 5.1                                                                                              |
| Lua 5.2+ syntax             | Partial (LuaJIT extensions): `goto` works, `_ENV` does not (use `setfenv`)                                           |
| `ffi` library               | Available via `require("ffi")`                                                                                       |
| `bit` library               | Available via `require("bit")` (NOT `bit32`)                                                                         |
| `table.new` / `table.clear` | Available via `require("table.new")` / `require("table.clear")`                                                      |
| `math.atan2`                | NOT available; use the guard in [Math and Geometry](../common-reference.md#math-and-geometry)                        |
| Sandboxing                  | Scripts run sandboxed; unsafe memory ops can crash the server                                                        |
| Global platform values      | `cb`, `halo_type`, `pid`, `lua_api_version`, `sapp_version`                                                          |
| Player index convention     | SAPP API uses 1-16; Halo internal memory uses 0-15 (see [Player Index Convention](utils.md#player-index-convention)) |
| Tick rate                   | 30 ticks/sec (1 tick ~ 33.3 ms); 1 WU = 3.048 m; more in [Timing and Units](../common-reference.md#timing-and-units) |

---

## Script Structure

Every script needs a global `api_version` and an `OnScriptLoad()`, or SAPP refuses to load it.
Register callbacks in `OnScriptLoad()`. `OnScriptUnload()` and `OnError(message)` are optional; the
latter receives Lua errors.

```lua
api_version = "1.12.0.0"

function OnScriptLoad()
    register_callback(cb.EVENT_JOIN, "OnJoin")
end

function OnJoin(player_id)
    say(player_id, "Hello, World!")
end

function OnScriptUnload() end
```

SAPP API functions only work after `OnScriptLoad()` starts. Run signature scans inside
`OnScriptLoad()` or a function it calls, never at file scope. Do `get_var` and tag lookups in a
runtime callback such as `OnStart` or `OnJoin`. Calling `OnStart()` from `OnScriptLoad()` is fine
(it covers a script loaded mid-game) as long as it bails out when no game is running.

```lua
local sniper_rifle

function OnScriptLoad()
    register_callback(cb.EVENT_GAME_START, "OnStart")
    register_callback(cb.EVENT_SPAWN, "OnSpawn")
    OnStart() -- in case the script was loaded mid-game
end

function OnStart()
    if get_var(0, "$gt") == "n/a" then return end
      sniper_rifle = getTagId("weap", "weapons\\sniper rifle\\sniper rifle")
end

function OnSpawn(player_id)
    if not sniper_rifle then return end
    local weapon = spawn_object("", "", 0, 0, 0, 0, sniper_rifle)
    if weapon ~= 0 then assign_weapon(weapon, player_id) end
end
```

---

## Callbacks

`register_callback(cb.EVENT_NAME, "GlobalFnName")` registers a global callback and
`unregister_callback(cb.EVENT_NAME)` removes it. See [SAPP Lua Template](template.md) for every
available callback. Register only the ones the script uses.

---

## API Cheat Sheet

### Memory Read/Write

| Category        | Functions                                                                                  |
|-----------------|--------------------------------------------------------------------------------------------|
| Byte            | `read_byte`, `write_byte`, `read_char`, `write_char`                                       |
| 16-bit          | `read_word`, `write_word`, `read_short`, `write_short`                                     |
| 32-bit unsigned | `read_dword`, `write_dword`                                                                |
| 32-bit signed   | `read_int`, `write_int`                                                                    |
| 32-bit float    | `read_float`, `write_float`                                                                |
| 64-bit float    | `read_double`, `write_double`                                                              |
| String          | `read_string`, `write_string` (null-terminated 8-bit)                                      |
| Bit             | `read_bit(addr, bit)`, `write_bit(addr, bit, val)`                                         |
| Vector          | `read_vector3d(addr)` returns `x, y, z`; `write_vector3d(addr, x, y, z)`                   |
| Safety          | `safe_read(true/false)`, `safe_write(true/false)` (toggles memory write-protection bypass) |

Bad addresses crash the server. Leave safe mode off unless you need it (it costs performance) and
test memory operations off production. Pointers are in Hardcoded Pointers and Signature Reference
in [SAPP Cheat Sheet](cheat-sheet.md). Player, weapon, and vehicle offsets are
in [Memory Offsets](../common-reference.md#memory-offsets) in the Common Reference, since Chimera
uses the same ones.

Halo also stores many strings as UTF-16LE (player names, server name, gametype name, map display
name). SAPP has no built-in wide-string reader. Use the `readWideString` helper
in [Wide Strings](../common-reference.md#wide-strings). `read_string` returns `""` for these fields.

### Messaging

Do not mix these up.

| Function               | Destination                                |
|------------------------|--------------------------------------------|
| `say(id, msg)`         | In-game chat, one player (1-16)            |
| `say_all(msg)`         | In-game chat, everyone                     |
| `rprint(id, msg)`      | One player's console (`~`)                 |
| `cprint(msg, [color])` | Server console only (players never see it) |

### Players, Objects, and Actions

| Function                                                                                    | Notes                                                                                                                                                                     |
|---------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `player_present(id)`, `player_alive(id)`                                                    | Return booleans                                                                                                                                                           |
| `get_player(id)`                                                                            | Returns player table address                                                                                                                                              |
| `get_dynamic_player(id)`                                                                    | Returns object address, or `0` if dead                                                                                                                                    |
| `get_object_memory(object_id)`                                                              | Returns object address, or `0` if invalid                                                                                                                                 |
| `to_real_index(id)`, `to_player_index(real_index)`                                          | Convert between SAPP (1-16) and Halo (0-15) indices                                                                                                                       |
| `get_var(id, "$name")`, `set_var(id, "name", value, [copy_id])`                             | `get_var` returns strings; global vars use ID `0`. `set_var` returns `false` if undefined                                                                                 |
| `add_var(name, type)`, `del_var(name)`                                                      | Manage custom variables (types 0-5; see [Variables](cheat-sheet.md#variables))                                                                                            |
| `kill(id)`                                                                                  | Adds a death and applies respawn time                                                                                                                                     |
| `assign_weapon(object_id, id)`                                                              | Returns success; silently fails if dead or unable to take it (max 4 weapons)                                                                                              |
| `drop_weapon(id)`                                                                           | Drops current weapon                                                                                                                                                      |
| `enter_vehicle(vehicle_id, id, "seat")`, `exit_vehicle(id)`                                 | Supports multiple occupants per seat                                                                                                                                      |
| `camo(id, ticks)`                                                                           | No effect if already camouflaged                                                                                                                                          |
| `powerup_interact(object_id, id)`                                                           | Returns success                                                                                                                                                           |
| `spawn_object("class", "path", x, y, z, rotation, tag_id)`                                  | Returns object ID. `class`/`path` are required strings (pass `""`, `""` when spawning by `tag_id`). `x`/`y`/`z`/`rotation` default to `0`; `tag_id` overrides class/path. |
| `spawn_object_location("class", "path", "location", [rotation], [tag_id])`                  | Returns object ID. Spawns at a named location (see `loc_add`) instead of coordinates. `rotation` is radians. `tag_id` overrides class/path.                               |
| `spawn_projectile(tag_id, player_id, x, y, z, [rx, ry, rz])`                                | Returns object ID. `player_id` is the parent/owner; `rx`/`ry`/`rz` are optional rotation values (radians).                                                                |
| `destroy_object(object_id)`                                                                 | Destroying flags, oddballs, or non-SAPP vehicles may crash the server                                                                                                     |
| `sync_ammo(object_id)`                                                                      | Syncs loaded/unloaded ammo                                                                                                                                                |
| `intersect(x, y, z, vx, vy, vz, [ignore_object_id])`                                        | Returns `success, cx, cy, cz, hit_object_id`; `0xFFFFFFFF` = no hit                                                                                                       |
| `lookup_tag("weap", "weapons\\pistol\\pistol")` / `lookup_tag(tag_id)`                      | Returns tag address (`0` if not found); use the tag-ID form on protected maps                                                                                             |
| `execute_command(cmd, [id], [echo])`, `execute_command_sequence("cmd1;cmd2", [id], [echo])` | `id` runs commands on a player's behalf. Sequence splits on `;`. `echo = true` raises `EVENT_ECHO` with output.                                                           |
| `rand([min, max])`                                                                          | `max` is exclusive (see [Known SAPP Quirks](utils.md#known-sapp-quirks))                                                                                                  |
| `sig_scan("signature")`                                                                     | Returns match address, or `0` (see [Signature Scanning](utils.md#signature-scanning))                                                                                     |
| `timer(ms, "GlobalFn", [args...])`                                                          | See [SAPP timer()](utils.md#sapp-timer-)                                                                                                                                  |

Tag class codes are the four-letter Halo class (`weap`, `vehi`, `eqip`, ...), not full words.

`get_var` names (`$gt`, `$map`, `$name`, `$score`, ...) are listed
in [Variables](cheat-sheet.md#variables). Global variables use player index `0`, and every value
comes back as a string.

## Script Hygiene

### Security

Applies to anything driven by player input.

- Validate player indices, admin levels, numeric ranges, and types. Never `loadstring` or `load`
  player input.
- Rate-limit costly actions with per-player cooldowns.
- Treat client input as untrusted and log suspicious behavior for review.

### Performance

`EVENT_TICK` runs 30 times per second, so keep it lean.

- Queue or debounce frequent events (damage, weapon fire) and drain them with short timers (50-200
  ms).
- Use separate queues for different priorities (score updates vs. log writes).
- Localize frequently used globals at file scope:

```lua
local table_insert = table.insert
local math_random = math.random
```

- Reuse tables from a pool to cut GC churn in hot paths:

```lua
local pool = {}

local function newTable()
    return table.remove(pool) or {}
end

local function freeTable(t)
    for k in pairs(t) do t[k] = nil end
    pool[#pool + 1] = t
end
```

- Avoid forcing garbage collection. If you must, do it at a quiet moment (round end, idle).

---

## Deploying a Script

Depending on the project folder you are working in, do one of the following:

- SPCLib: Place the script in `sapp/<category>/`.
- SAPP_CE: Place the script in `cg/sapp/lua/` and register it in `cg/sapp/init.txt` with
  `lua_load "filename"` (leave off the `.lua` extension).

---