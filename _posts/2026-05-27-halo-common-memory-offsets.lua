---
title: "Halo: Common Memory Offsets Reference"
date: 2026-05-17
categories: [ education, halo, modding ]
tags: [ sapp, chimera, lua, halo, scripting, tutorial ]
---

## Common Memory Offsets Reference

Understanding memory offsets is the key to reading and modifying game state. The tables below list the most frequently
used offsets for dynamic objects (players, vehicles, weapons) and static player data.

### Dynamic Player Object (`get_dynamic_player()`)

| Offset  | Type  | Description                                                           | Example Use                                |
|---------|-------|-----------------------------------------------------------------------|--------------------------------------------|
| `0x5C`  | float | World X position                                                      | `local x = read_float(dyn + 0x5C)`         |
| `0x60`  | float | World Y position                                                      |                                            |
| `0x64`  | float | World Z position                                                      |                                            |
| `0x68`  | float | Velocity X                                                            | `local vx = read_float(dyn + 0x68)`        |
| `0x6C`  | float | Velocity Y                                                            |                                            |
| `0x70`  | float | Velocity Z                                                            |                                            |
| `0xE0`  | float | Health (0.0 = dead, 1.0 = full)                                       | `local health = read_float(dyn + 0xE0)`<br>`health = health * 100`|
| `0xE4`  | float | Shields (0.0 = empty, 1.0 = full)                                     | `local shield = read_float(dyn + 0xE4)`<br>`shield = shield * 100`|
| `0x118` | dword | Currently held weapon object ID                                       | `local weapon_id = read_dword(dyn + 0x118)`|
| `0x11C` | dword | Vehicle object ID (0xFFFFFFFF = on foot)                              | `if vehicle_id ~= 0xFFFFFFFF then ... end` |
| `0x230` | float | Forward vector X (aim/camera)                                         | Compass, direction warnings                |
| `0x234` | float | Forward vector Y                                                      |                                            |
| `0x238` | float | Forward vector Z                                                      |                                            |
| `0x2F2` | byte  | Current weapon slot (0-3)                                             |                                            |
| `0x2F8` | dword | Weapon slot 1 object ID (slots 1-4 at +0x2F8, +0x2FC, +0x300, +0x304) |                                            |
| `0x31E` | byte  | Frag grenade count                                                    |                                            |
| `0x31F` | byte  | Plasma grenade count                                                  |                                            |
| `0x37C` | float | Invisibility (1.0 = invisible)                                        | local invisible = read_float(dyn + 0x37C)  |

### Static Player Data (`get_player()`)

| Offset  | Type    | Description                          | Example Use                   |
|---------|---------|--------------------------------------|-------------------------------|
| `0x4`   | wchar[] | Player name (UTF-16, max 12 chars)   | See get_player_name() example |
| `0x20`  | byte    | Team (0 = Red, 1 = Blue)             |                               |
| `0x9C`  | word    | Kill count                           |                               |
| `0xAE`  | word    | Death count                          |                               |
| `0xDC`  | dword   | Ping in milliseconds                 |                               |
| `0xF8`  | float   | World X (alternate position storage) |                               |
| `0xFC`  | float   | World Y                              |                               |
| `0x100` | float   | World Z                              |                               |

### Weapon Object (`get_object(weapon_id)`)

| Offset  | Type  | Description                                 | Example Use      |
|---------|-------|---------------------------------------------|------------------|
| `0x2B6` | word  | Rounds in current magazine                  | Low ammo warning |
| `0x2B8` | word  | Total reserve ammo                          |                  |
| `0x2C6` | word  | Secondary ammo (e.g., grenades in launcher) |                  |
| `0x2C8` | word  | Secondary clip                              |                  |
| `0x240` | float | Overheat (0 = cool, 1 = overheated)         |                  |

### Vehicle Object (`get_object(vehicle_id)`)

| Offset | Type  | Description                                   |
|--------|-------|-----------------------------------------------|
| `0x5C` | float | World X position (same as player when seated) |
| `0x60` | float | World Y                                       |
| `0x64` | float | World Z                                       |
| `0x68` | float | Velocity X                                    |
| `0x6C` | float | Velocity Y                                    |
| `0x70` | float | Velocity Z                                    |

---

## Practical Usage Examples

The following examples demonstrate how to combine these offsets into real-world scripts.

### 1. Speedometer (Vehicle or On-foot)

```lua
function get_speed(dynamic_player)
    local vx = read_float(dynamic_player + 0x68)
    local vy = read_float(dynamic_player + 0x6C)
    local vz = read_float(dynamic_player + 0x70)
    local speed = math.sqrt(vx*vx + vy*vy + vz*vz)
    -- Convert world units per tick to km/h (1 tick ≈ 1/30 sec, 1 unit ≈ 0.1 m? adjust as needed)
    return speed * 30 * 3.6
end
```

### 2. Low Ammo Warning

```lua
function is_low_ammo(dynamic_player, threshold)
    local weapon_id = read_dword(dynamic_player + 0x118)
    if weapon_id == 0 then return false end
    local weapon = get_object(weapon_id)
    if not weapon then return false end
    local clip = read_word(weapon + 0x2B6)
    return clip <= threshold
end
```

### 3. Get Player Name (UTF-16 to ASCII)

```lua
function get_player_name(player_index)
    local static = get_player(player_index)
    if not static then return "Unknown" end
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

### 4. Check If Player Is In A Vehicle

```lua
function is_in_vehicle(dynamic_player)
    local vehicle_id = read_dword(dynamic_player + 0x11C)
    return vehicle_id ~= 0xFFFFFFFF
end
```

### 5. Get Current Health/Shields as Percentage

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

### 6. Simple Compass (Cardinal Direction)

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

### 7. Get Player Team Name

```lua
function get_team_name(player_index)
    local static = get_player(player_index)
    if not static then return "None" end
    local team = read_byte(static + 0x20)
    return (team == 0) and "Red" or "Blue"
end
```

### 8. Calculate Kill/Death Ratio

```lua
function get_kd_ratio(player_index)
    local static = get_player(player_index)
    if not static then return 0 end
    local kills = read_word(static + 0x9C)
    local deaths = read_word(static + 0xAE)
    if deaths == 0 then return kills end
    return kills / deaths
end
```

### 9. Iterate All Active Players

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
    local name = get_player_name(idx)
    local health = get_health_percent(dyn)
    console_out(string.format("%s: %d%% health", name, health))
end)
```

### 10. Detect Grenade Count Change (Weapon Slot Scanning)

```lua
function get_grenade_counts(dynamic_player)
    return {
        frags = read_byte(dynamic_player + 0x31E),
        plasmas = read_byte(dynamic_player + 0x31F)
    }
end
```

---

## Tips for Working with Offsets

* **Always validate pointers** – `get_dynamic_player()` can return `nil` (dead or nonexistent). Check before reading.
* **Use local variables for performance** – In `OnTick`, cache frequently used offsets (e.g.,
  `local read_float = read_float`) when scanning many objects.
* **Remember endianness** – Halo runs on x86 (little-endian); Chimera’s read functions handle it automatically.
* **Write with caution** – Writing to wrong addresses can crash the game. Test in single-player or local server first.
* **Combine offsets** – Many features need multiple offsets: e.g., vehicle speed requires reading vehicle position (
  0x5C) from the vehicle object, not the player’s dynamic object, when seated.
* **Refer to example scripts** – The `low_ammo_warning.lua`, `vehicle_speedometer.lua`, and `mini_compass.lua` attached
  to this guide demonstrate many of these offsets in complete working scripts.

---