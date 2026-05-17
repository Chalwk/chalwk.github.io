---
title: "Halo: Understanding Memory Offsets"
date: 2025-09-8
last-updated: 2026-5-17
categories: [ education, halo, modding ]
tags: [ sapp, chimera, lua, halo, scripting, tutorial ]
---

If you are diving into Halo PC or Custom Edition modding, you will quickly encounter the need to manipulate game
behavior directly in memory. Whether you are creating advanced scripts, building tools, or just experimenting,
understanding memory addresses and offsets is a foundational skill.

---

## What Are Memory Addresses and Offsets?

- **Memory Address**: A specific location in the game's memory where a piece of data (like player health, ammo, or
  position) is stored.
- **Offset**: A number added to a base address to reach a particular data point.

For example, if a base address is `0x40440000` and the offset is `0x28`, the target address becomes:

```
0x40440000 + 0x28 = 0x40440028
```

In many modding scenarios, you will not know the absolute address ahead of time because it changes between game
sessions. Instead, you find a stable base address (like a module handle) and then apply offsets to reach the data you
care about.

For a deeper technical dive, check
out [Kavawuvi's post on OpenCarnage](https://opencarnage.net/index.php?/topic/6693-halo-map-file-structure-revision-212/#comment-88743)
about Halo map file structures.

---

## Why This Matters for Halo Modding

Memory offsets let you:

- Read and modify player stats in real time.
- Create custom gameplay mechanics (e.g., infinite ammo, health regeneration).
- Debug and analyze game behavior.
- Build external tools or scripts (like Sapphire Lua scripts) that interact with the game.

Without offsets, you would be guessing where data lives. With them, you gain precise control.

---

## Tools for Finding Offsets

Here are three tools commonly used in the Halo PC/CE modding community:

- **Cheat Engine**  
  A powerful, real-time memory scanner and modifier. Great for beginners and advanced users alike.

- **IDA Pro**  
  A professional disassembler and debugger. Useful for reverse engineering the Halo executable itself.

- **Halo Map Tools 3**  
  A utility designed specifically for Halo. It simplifies finding and modifying offsets within map files.

---

## Advanced Memory Discovery - Signatures and Version-Specific Addresses

### Signature Scanning (SAPP Only)

Offsets can change between game versions or builds. **Signature scanning** (also called pattern scanning) lets you
locate code or data without relying on hardcoded addresses. **Only SAPP** provides a built-in `sig_scan(pattern)`
function that returns a memory address. Chimera and Phasor do **not** expose signature scanning to Lua scripts.

A signature is a string of bytes with wildcards (`??`) where values may vary (e.g., memory addresses). Example:  
`"F3ABA1????????BA????????C740??????????E8????????668B0D"`

#### Generating Signatures with Specialized Tools

| Tool             | Plugin / Method                      | Output                                                                                         |
|------------------|--------------------------------------|------------------------------------------------------------------------------------------------|
| **IDA Pro**      | SigMaker (e.g., `IDA_SigMaker.dll`)  | Right-click on assembly → generate AOB signature; copy from output window.                     |
| **Ghidra**       | MakeSig script                       | Right-click a function → "Generate Signature" → copy pattern.                                  |
| **Cheat Engine** | Array of bytes scan + Auto Assembler | Find the instruction in memory disassembler → use `aobscan` or generate AOB from context menu. |

#### Using a Signature in SAPP

The address returned by `sig_scan` points to the **start** of the matched byte sequence. You often need to add an *
*offset** to reach the actual data pointer.

```lua
-- Signature found at: F3 ABA1 [?? ?? ?? ??] BA ...
-- The 4-byte network_struct pointer is located 3 bytes after the signature start
local ptr = sig_scan("F3ABA1????????BA????????C740??????????E8????????668B0D")
if ptr then
    network_struct = read_dword(ptr + 3)
end
```

#### Verifying a Signature

Before using a signature in a script, test it in **Cheat Engine**:

1. Attach to the game process.
2. Open **Memory View** → **Search** → **Array of bytes**.
3. Paste the signature (with `??` for wildcards).
4. Confirm it finds **exactly one** unique result. If it finds none or many, adjust the pattern length or add more
   unique bytes.

---

### Version Detection for Chimera and Phasor (Hardcoded Addresses)

Because Chimera and Phasor cannot scan signatures, scripts detect the game version (`"PC"` for Halo PC or `"CE"` for
Custom Edition) and load the correct hardcoded addresses.

**SAPP** - `halo_type` global:

```lua
local timelimit_address
function OnScriptLoad()
    timelimit_address = (halo_type == "PC" and 0x626630) or 0x5AA5B0
end
```

**Phasor** - `game` parameter in `OnScriptLoad`:

```lua
local timelimit_address
function OnScriptLoad(processid, game, persistent)
    timelimit_address = (game == "PC" and 0x626630) or 0x5AA5B0
end
```

**Chimera** - Does not support version detection.

#### Known Common Pointer Addresses for PC and CE

Use these with version detection. All values are hexadecimal. Missing addresses are marked with `-`.

| Pointer Name                  | PC Address | CE Address | Description                                    |
|-------------------------------|------------|------------|------------------------------------------------|
| `banlist_header`              | `0x641280` | `0x5C52A0` | Header for the banlist structure               |
| `banlist_path_address`        | `0x69B950` | `0x61FB80` | Path to the banlist file                       |
| `broadcast_game_address`      | `0x5E4768` | `0x569EAC` | Determines broadcast type (PC/CE/Trial)        |
| `broadcast_version_address`   | `0x5DF840` | `0x564B34` | Version that the server is broadcasting on     |
| `camera_base`                 | `0x69C2F8` | `0x62075C` | Base address for per-player camera data        |
| `collideable_objects_pointer` | `0x744C34` | `0x6C6A14` | Pointer to the list of collideable objects     |
| `color_patch`                 | `0x4828FE` | `0x45EB5E` | -                                              |
| `computer_name_address`       | `0x62CD60` | `0x5B0D40` | Server computer (domain) name                  |
| `computer_specs_address`      | `0x662D04` | `0x5E6E5C` | Server hardware information (CPU speed, brand) |
| `ctf_globals`                 | `0x639B98` | `0x5BDBB8` | CTF gametype global data structure             |
| `devmode_patch1`              | `0x4A4DBF` | `0x47DF0C` | -                                              |
| `devmode_patch2`              | `0x4A4E7F` | `0x47DFBC` | -                                              |
| `flags_pointer`               | `0x6A590C` | `-`        | -                                              |
| `game_globals`                | `-`        | `0x61CFE0` | Global game data                               |
| `gametime_base`               | `0x671420` | `0x5F55BC` | Header for game time information               |
| `gametype_base`               | `0x671340` | `0x5F5498` | Base address for current gametype settings     |
| `gametype_patch`              | `0x481F3C` | `0x45E50C` | -                                              |
| `hash_duplicate_patch`        | `0x59C516` | `0x5302E6` | -                                              |
| `hash_table_base`             | `0x6A2AE4` | `0x5AFB34` | Base of hash table (CD key validation)         |
| `hashcheck_patch`             | `0x59C280` | `0x530130` | Patch for hash (CD key) check                  |
| `init_file_address`           | `0x8EB38`  | `0x8EB26`  | -                                              |
| `koth_globals`                | `0x639BD0` | `0x5BDBF0` | King of the Hill gametype global data          |
| `machine_pointer`             | `0x745BA0` | `0x6C7980` | Pointer to network machine information         |
| `map_header_base`             | `0x630E74` | `0x6E2CA4` | Base address of the loaded map header          |
| `map_name_address`            | `0x63BC78` | `0x5BFC98` | Map display name (e.g., "Bloodgulch")          |
| `map_name_address2`           | `0x698F21` | `0x61D151` | Map file name (e.g., "bloodgulch")             |
| `map_pointer`                 | `0x63525C` | `0x5B927C` | Pointer to map data base address               |
| `mapcycle_header`             | `0x614B4C` | `0x598A8C` | Header for mapcycle data                       |
| `name_base`                   | `0x745D4A` | `0x6C7B6A` | -                                              |
| `network_server_globals`      | `0x69B934` | `0x61FB64` | Server-side network globals                    |
| `network_struct`              | `0x745BA0` | `0x6C7980` | Main network structure for server/client       |
| `obj_header_pointer`          | `0x744C18` | `0x6C69F0` | Pointer to the object header                   |
| `oddball_globals`             | `0x639E58` | `0x5BDE78` | Oddball gametype global data                   |
| `player_globals`              | `-`        | `0x6E1478` | Player global data structure                   |
| `player_header_pointer`       | `0x75ECE4` | `0x6E1480` | Pointer to the player header                   |
| `profile_path_address`        | `0x635610` | `0x5B9630` | Path to the profile directory                  |
| `public_value_address`        | `0x6164C0` | `0x59A424` | -                                              |
| `race_globals`                | `0x639FA0` | `0x5BDFC0` | Race gametype global data                      |
| `race_locs`                   | `0x670F40` | `0x5F5098` | Race checkpoint locations                      |
| `rcon_password_address`       | `0x69BA5C` | `0x61FC8C` | Current RCON password for the server           |
| `server_password_address`     | `0x69B93C` | `0x61FB6C` | Current server password (null if none)         |
| `server_path_address`         | `0x62C390` | `0x5B0670` | Path to the server's haloded.exe               |
| `server_port_address`         | `0x625230` | `0x5A91A0` | Port that the server is broadcasting on        |
| `servername_patch`            | `0x517D6B` | `0x4CE0CD` | Patch for server name                          |
| `slayer_globals`              | `0x63A0E8` | `0x5BE108` | Slayer gametype global data                    |
| `sockaddr_pointer`            | `0x6A1F08` | `0x626388` | -                                              |
| `special_chars_patch`         | `0x517D6B` | `0x4CE0CD` | -                                              |
| `stats_globals`               | `0x639898` | `0x5BD8B8` | Player statistics data                         |
| `stats_header`                | `0x639720` | `0x5BD740` | Header for statistics (decal locations, etc.)  |
| `timelimit_address`           | `0x626630` | `0x5AA5B0` | Game's time limit value (in ticks)             |
| `version_info_address`        | `0x5E02C0` | `0x565104` | Version information string for Halo            |
| `versioncheck_patch`          | `0x5152E7` | `0x4CB587` | Patch for version check                        |

---

### SAPP-Only Signatures

SAPP scripts can avoid hardcoded addresses entirely by using the following pre-computed signatures. These work on both
PC and CE.

| Pointer Name                | SAPP Signature (with offset)                                                                     |
|-----------------------------|--------------------------------------------------------------------------------------------------|
| `banlist_header`            | `read_dword(sig_scan("A3??????00A1??????0033DB3BC3") + 1)`                                       |
| `banlist_path_address`      | `read_dword(sig_scan("68??????00E8??????0083C41068") + 0x1)`                                     |
| `banlist_path_address2`     | `read_dword(sig_scan("CCCCC605??????0000E8??????0085C0") + 0x4)`                                 |
| `broadcast_game_address`    | `read_dword(sig_scan("CCCCBA??????002BD08A08") + 0x3)`                                           |
| `broadcast_version_address` | `read_dword(sig_scan("751768??????0068??????00BA") + 0x3)`                                       |
| `color_patch1`              | `read_dword(sig_scan("741F8B482085C9750C"))`                                                     |
| `color_patch2`              | `read_dword(sig_scan("EB1F8B482085C9750C"))`                                                     |
| `computer_name_address`     | `read_dword(sig_scan("68??????0068??????0068000401006A00") + 0x1)`                               |
| `ctf_globals`               | `read_dword(sig_scan("C6000083C0303D??????00") + 8)`                                             |
| `gameinfo_header`           | `read_dword(sig_scan("A1????????8B480C894D00") + 0x1)`                                           |
| `gametype_base`             | `read_dword(sig_scan("B9360000008BF3BF78545F00") + 0x8)`                                         |
| `hardware_info_address`     | `read_dword(sig_scan("BE??????008BC68B4DF064890D000000005F5E5B8BE55DC36A0C") + 0x1)`             |
| `kill_message_address`      | `read_dword(sig_scan("8B42348A8C28D500000084C9") + 3)`                                           |
| `koth_globals`              | `read_dword(sig_scan("BF??????00F3ABB96B000000") + 0x1)`                                         |
| `logfile_path_address`      | `read_dword(sig_scan("740ABB????5C00E8????0300") + 0x3)` - CE only                               |
| `map_name_address`          | `read_dword(sig_scan("66A3??????00890D??????00C3") + 0x2)`                                       |
| `map_name_address2`         | `read_dword(sig_scan("B8??????00E8??????0032C983F813") + 0x1)`                                   |
| `network_struct`            | `read_dword(sig_scan("F3ABA1????????BA????????C740??????????E8????????668B0D") + 3)`             |
| `nonslayer_score_patch`     | `sig_scan("8B??3883C404????74??57FFD0") + 0x8`                                                   |
| `object_header_pointer`     | `read_dword(sig_scan("8B0D????????8B513425FFFF00008D") + 2)`                                     |
| `oddball_globals`           | `read_dword(sig_scan("BF??????00F3ABB951000000") + 0x1)`                                         |
| `player_header_pointer`     | `read_dword(sig_scan("DDD8A1??????008944244835") + 0x3)`                                         |
| `profile_path_address`      | `read_dword(sig_scan("68??????008D54245468") + 0x1)`                                             |
| `race_globals`              | `read_dword(sig_scan("BF??????00F3ABB952000000") + 0x1)`                                         |
| `rcon_failed_address`       | `read_dword(sig_scan("B8????????E8??000000A1????????55") + 1)`                                   |
| `rcon_password_address`     | `read_dword(sig_scan("7740BA??????008D9B000000008A01") + 0x3)`                                   |
| `server_ip_argument`        | `read_dword(sig_scan("BA??????008BC72BD78A08880C024084C975F68B442404") + 0x1)`                   |
| `server_password_address`   | `read_dword(sig_scan("F3ABA3??????00A3??????00A2??????00C705") + 0x3)`                           |
| `server_path_address`       | `read_dword(sig_scan("0000BE??????005657C605") + 0x3)`                                           |
| `server_port_address`       | `read_dword(sig_scan("668B0D??????000BF2C605") + 0x3)`                                           |
| `slayer_globals`            | `read_dword(sig_scan("5733C0B910000000BFE8E05B00F3ABB910000000") + 19)`                          |
| `slayer_score_patch`        | `sig_scan("74178B94242808000052518B8C24280800005157FFD083C4108B8424240800003BF8530F94C383FFFF")` |
| `stats_globals`             | `read_dword(sig_scan("33C0BF??????00F3AB881D") + 0x3)`                                           |

---

### Summary

- **SAPP** can use either version-detected hardcoded addresses **or** automatic signatures via `sig_scan`.
- **Phasor** and **Chimera** must rely on version detection and the pointer table above (no signature scanning
  available).
- When writing cross-platform scripts, always check for the existence of `sig_scan` (e.g.,
  `if sig_scan then ... else ... end`) or use version detection to select the correct hardcoded addresses.

---

## Resources

To get started with finding and using offsets, explore these resources:

- [How To Find Offsets, Entity Addresses & Pointers](https://www.youtube.com/watch?v=YaFlh2pIKAg)
  A video tutorial that walks through locating offsets using Cheet Engine.

- [Finding Offsets /w Cheat Engine - UnKnoWnCheaTs](https://www.unknowncheats.me/forum/general-programming-and-reversing/200702-finding-offsets-using-cheat-engine.html)
  A comprehensive written guide on using Cheat Engine for offset discovery.

- [Halo Map Tools - Bungie Forums](https://forums.bungie.org/halo/archive13.pl?read=390998)
  A discussion thread covering offset manipulation with Halo Map Tools 3.

---

## Common Memory Offsets Reference

Understanding memory offsets is the key to reading and modifying game state. The tables below list the most frequently
used offsets for dynamic objects (players, vehicles, weapons) and static player data.

### **Note:**

Phasor 2.0 uses **Lua 5.2**. Chimera uses **Lua v5.5**, while SAPP uses **LuaJIT** based on Lua 5.1. Some functions and
language features differ between them (e.g. `ffi`, `math.atan2`, bitwise operators, `_ENV`, `goto`, etc.), so always
check compatibility when writing cross-platform scripts.

### Dynamic Player Object

Chimera & SAPP: `local dyn = get_dynamic_player()`

| Offset  | Type  | Description                                                           | Example Use                                                            |
|---------|-------|-----------------------------------------------------------------------|------------------------------------------------------------------------|
| `0x5C`  | float | World X position                                                      | `local x = read_float(dyn + 0x5C)`                                     |
| `0x60`  | float | World Y position                                                      |                                                                        |
| `0x64`  | float | World Z position                                                      |                                                                        |
| `0x68`  | float | Velocity X                                                            | `local vx = read_float(dyn + 0x68)`                                    |
| `0x6C`  | float | Velocity Y                                                            |                                                                        |
| `0x70`  | float | Velocity Z                                                            |                                                                        |
| `0xE0`  | float | Health (0.0 = dead, 1.0 = full)                                       | `local health = read_float(dyn + 0xE0)`<br>`health = health * 100`     |
| `0xE4`  | float | Shields (0.0 = empty, 1.0 = full)                                     | `local shield = read_float(dyn + 0xE4)`<br>`shield = shield * 100`     |
| `0x118` | dword | Currently held weapon object ID                                       | `local weapon_id = read_dword(dyn + 0x118)`                            |
| `0x11C` | dword | Vehicle object ID (0xFFFFFFFF = on foot)                              | `if vehicle_id ~= 0xFFFFFFFF then ... end`                             |
| `0x230` | float | Forward vector X (aim/camera)                                         | AFK System, Anti-Aim Bots, Grenade Launchers, Direction warnings, etc. |
| `0x234` | float | Forward vector Y                                                      |                                                                        |
| `0x238` | float | Forward vector Z                                                      |                                                                        |
| `0x2F2` | byte  | Current weapon slot (0-3)                                             |                                                                        |
| `0x2F8` | dword | Weapon slot 1 object ID (slots 1-4 at +0x2F8, +0x2FC, +0x300, +0x304) |                                                                        |
| `0x31E` | byte  | Frag grenade count                                                    | `local frags = read_byte(dyn + 0x31E)`                                 |
| `0x31F` | byte  | Plasma grenade count                                                  | `local plasmas = read_byte(dyn + 0x31F)`                               |
| `0x37C` | float | Invisibility (1.0 = invisible)                                        | `local invisible = read_float(dyn + 0x37C)`                            |

### Static Player Data

Chimera & SAPP: `local static_p = get_player(id)`

| Offset  | Type    | Description                          | Example Use                                                                               |
|---------|---------|--------------------------------------|-------------------------------------------------------------------------------------------|
| `0x4`   | wchar[] | Player name (UTF-16, max 12 chars)   | See Chimera [get_player_name()](2025-09-07-halo-understanding-memory-offsets.md)) example |
| `0x20`  | byte    | Team (0 = Red, 1 = Blue)             | `local team = read_byte(static_p + 0x20)`                                                 |
| `0x9C`  | word    | Kill count                           | `local kills = read_word(static_p + 0x9C)`                                                |
| `0xAE`  | word    | Death count                          | `local deaths = read_word(static_p + 0xAE)`                                               |
| `0xDC`  | dword   | Ping in milliseconds                 |                                                                                           |
| `0xF8`  | float   | World X (alternate position storage) |                                                                                           |
| `0xFC`  | float   | World Y                              |                                                                                           |
| `0x100` | float   | World Z                              |                                                                                           |

### Weapon Object

Chimera: `get_object(weapon_id)`, SAPP `get_object_memory(weapon_id)`

| Offset  | Type  | Description                                 | Example Use      |
|---------|-------|---------------------------------------------|------------------|
| `0x2B6` | word  | Rounds in current magazine                  | Low ammo warning |
| `0x2B8` | word  | Total reserve ammo                          |                  |
| `0x2C6` | word  | Secondary ammo (e.g., grenades in launcher) |                  |
| `0x2C8` | word  | Secondary clip                              |                  |
| `0x240` | float | Overheat (0 = cool, 1 = overheated)         |                  |

### Vehicle Object

Chimera: `get_object(vehicle_id)`, SAPP `get_object_memory(vehicle_id)`

| Offset | Type  | Description                                   |
|--------|-------|-----------------------------------------------|
| `0x5C` | float | World X position (same as player when seated) |
| `0x60` | float | World Y                                       |
| `0x64` | float | World Z                                       |
| `0x68` | float | Velocity X                                    |
| `0x6C` | float | Velocity Y                                    |
| `0x70` | float | Velocity Z                                    |

### Weapon Object

Chimera: `get_object(weapon_id)`, SAPP `get_object_memory(weapon_id)`

| Offset  | Type  | Description                                 | Example Use           |
|---------|-------|---------------------------------------------|-----------------------|
| `0x2B6` | word  | Rounds in current magazine                  | Low ammo warning      |
| `0x2B8` | word  | Total reserve ammo                          | Ammo tracking         |
| `0x2C6` | word  | Secondary ammo (e.g., grenades in launcher) | Grenade launcher ammo |
| `0x2C8` | word  | Secondary clip                              |                       |
| `0x240` | float | Overheat (0 = cool, 1 = overheated)         | Plasma weapon heat    |

---

## Practical Usage Examples

The following examples demonstrate how to combine these offsets into real-world scripts.

### Speedometer (on-foot)

```lua
function get_speed(dynamic_player)
    local vx = read_float(dynamic_player + 0x68)
    local vy = read_float(dynamic_player + 0x6C)
    local vz = read_float(dynamic_player + 0x70)
    local speed = math.sqrt(vx*vx + vy*vy + vz*vz)
    -- Convert world units per tick to km/h (1 tick ≈ 1/30 sec, 1 unit ≈ 0.1 m)
    return speed * 30 * 3.6
end
```

### Low Ammo Warning

```lua
function is_low_ammo(dynamic_player, threshold)
    local weapon_id = read_dword(dynamic_player + 0x118)
    if weapon_id == 0 then return false end

    local weapon = get_object(weapon_id) -- use get_object_memory for SAPP
    if not weapon then return false end

    local clip = read_word(weapon + 0x2B6)
    return clip <= threshold
end
```

### Get Player Name (UTF-16 to ASCII) - Chimera Only, use get_var("$name") for SAPP

```lua
function get_player_name(player_id)
    local addr = static + 0x4
    local chars = {}
    for i = 1, 12 do
        local byte = read_byte(addr + (i-1)*2)  -- low byte only; high byte is zero for ASCII
        if byte == 0 then break end
        chars[#chars+1] = string.char(byte)
    end
    return table.concat(chars)
end
```

### Check If Player Is In A Vehicle (and what seat)

```lua
function is_in_vehicle(dynamic_player)
    local vehicle_id = read_dword(dynamic_player + 0x11C)
    return vehicle_id ~= 0xFFFFFFFF
end
```

### Get Current Health/Shields as Percentage

```lua
function get_health_percent(dynamic_player)
    local health = read_float(dynamic_player + 0xE0)
    return math.floor(health * 100)
end

function get_shields_percent(dynamic_player)
    local shields = read_float(dynamic_player + 0xE4)
    return math.floor(shields * 100)
end
```

### Simple Compass (Cardinal Direction)

Note: SAPP's Lua API doesn't provide `math.atan2`. See [math.atan2](#mathatan2) or create your own implementation.

```lua
function get_cardinal_direction(dynamic_player)
    local fx = read_float(dynamic_player + 0x230)
    local fy = read_float(dynamic_player + 0x234)
    local angle = (90 - math.deg(math.atan2(fy, fx))) % 360
    local dirs = {"N", "NE", "E", "SE", "S", "SW", "W", "NW"}
    local idx = math.floor((angle + 22.5) / 45) % 8 + 1
    return dirs[idx]
end
```

### Get Player Team Name

```lua
function get_team_name(player_id)
    local static = get_player(player_id)
    if not static then return "None" end
    local team = read_byte(static + 0x20)
    return (team == 0) and "Red" or "Blue"
end
```

### Calculate Kill/Death Ratio

```lua
function get_kd_ratio(player_id)
    local static = get_player(player_id)
    if not static then return 0 end
    local kills = read_word(static + 0x9C)
    local deaths = read_word(static + 0xAE)
    if deaths == 0 then return kills end
    return kills / deaths
end
```

### Iterate All Active Players

```lua
function for_each_player(callback)
    for i = 0, 15 do
        local dyn = get_dynamic_player(i)
        if dyn then
            callback(i, dyn)
        end
    end
end

-- Usage:
for_each_player(function(idx, dyn)
    local name = get_player_name(idx) -- Chimera only, use get_var("$name") for SAPP
    local health = get_health_percent(dyn)
    local shields = get_shields_percent(dyn)
    console_out(string.format("%s HP:%d SH:%i", name, health, shields))
end)
```

#### Inventory Scanning

Iterate over all weapon slots and retrieve each weapon object using the dynamic player and object memory pointers.

```lua
for slot = 0,3 do
    local item_id = read_dword(dynamic_player + 0x2F8 + s * 4)
    if item_id == 0xFFFFFFFF then goto next end

    local object = get_object_memory(item_id) -- Use get_object for Chimera
    if object == 0 then goto next end

    players[player_id].inventory[i + 1] = {
        [object] = object,                 -- ..
        [ammo] = read_word(object + 0x2B6),  -- ..
        [clip] = read_word(object + 0x2B8),  -- ..
        [ammo2] = read_word(object + 0x2C6), -- ..
        [clip2] = read_word(object + 0x2C8), -- ..
        [age] = read_float(object + 0x240),  -- battery weapons (e.g. plasma cannon/pistol)
        [frags] = read_byte(dynamic_player + 0x31E),
        [plasmas] = read_byte(dynamic_player + 0x31F)
    }
    ::next::
end
```

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

## Practical Tips for Success

Follow these steps to find offsets efficiently:

### Start with Known Values

Pick a value you can easily change in the game, such as:

- Current health
- Ammo count
- Shield strength

Search for that value in Cheat Engine.

### Use Cheat Engine's Scanning Features

- **First Scan**: Enter the known value and perform an initial scan.
- **Next Scan**: Change the value in the game (e.g., take damage, fire a weapon), then scan for the new value.
- Repeat until you have a small list of candidate addresses.

> **Pro Tip**: Use exact value scans when possible. If the value is displayed as a number in the game (like 100 health),
> scan as 4-byte integer.

### Verify the Address

Once you have a candidate address, change it in Cheat Engine and see if the game reflects the change. If it works, you
have found the dynamic address.

### Pointer Scanning

Dynamic addresses change each time you restart the game. To find a stable base address and offset chain:

- Right-click the working address in Cheat Engine.
- Select "Pointer scan for this address".
- Configure the scan settings (maximum offset depth, address range).
- Restart the game and compare pointer results to find a consistent chain.

> **Warning**: Pointer scanning can generate thousands of results. Be patient and filter by reloading the game a few
> times to see which pointers survive.

### Document Your Offsets

Keep a list of discovered offsets, their data types, and what they control. This saves time in future projects.

## Acknowledgments

Many of the addresses & offsets documented in this guide were discovered by [aLTis](https://github.com/aLTis94),
Giraffe, Silentk, [SnowyMouse](https://github.com/SnowyMouse), [Wizard](https://github.com/th3w1zard1), and others. Many
thanks to them!