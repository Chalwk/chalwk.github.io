---
title: "Halo: Chimera Scripting Guide"
date: 2026-05-16
categories: [ education, halo, modding ]
tags: [ chimera, lua, halo, scripting, tutorial ]
---

### Read a float (position, health, shields)

```lua
local x = read_float(dynamic_player + 0x5C)
local y = read_float(dynamic_player + 0x60)
local z = read_float(dynamic_player + 0x64)
```

Health and shields are also floats (0.0 = empty, 1.0 = full). To show as a percentage:

```lua
local health_raw = read_float(dynamic_player + 0xE0)  -- 0..1
local shields_raw = read_float(dynamic_player + 0xE4) -- 0..1

local health_percent = math.floor(health_raw * 100)
local shields_percent = math.floor(shields_raw * 100)
```

### Read integers (team, ping, kills, deaths)

Use `read_byte()` for small values (0-255), `read_word()` for 16-bit, and `read_dword()` for 32-bit.

**Team** (0 = Red, 1 = Blue, from the player structure):

```lua
local team = read_byte(static_player + 0x20)
local team_name = (team == 0) and "Red" or "Blue"
```

**Ping** (milliseconds, from player structure):

```lua
local ping = read_dword(static_player + 0xDC)
```

**Kills and deaths** (from player structure):

```lua
local kills = read_word(static_player + 0x9C)
local deaths = read_word(static_player + 0xAE)
```

### Reading Player's Forward Vector (for Compass / Direction Warnings)

The dynamic player structure contains a 3D forward vector (world-relative). Only X and Y are needed for yaw (horizontal
facing).

```lua
local forward_x = read_float(dynamic_player + 0x230)
local forward_y = read_float(dynamic_player + 0x234)
local forward_z = read_float(dynamic_player + 0x238)
```

**Convert to cardinal or clock-face direction:**

```lua
local function yaw_to_cardinal(fx, fy)
    local angle = (90 - math.deg(math.atan2(fy, fx))) % 360
    local dirs = {"N", "NE", "E", "SE", "S", "SW", "W", "NW"}
    local idx = math.floor((angle + 22.5) / 45) % 8 + 1
    return dirs[idx]
end

local facing = yaw_to_cardinal(forward_x, forward_y)  -- "N", "NE", etc.
```

---

### Reading and Writing Memory (I/O Functions)

Chimera provides a full set of memory read/write functions. Use these to inspect or modify game state. Writing to
read-only memory or invalid addresses may cause a segmentation fault (crash).

| Read function                         | Write function                           | Description                                          |
|---------------------------------------|------------------------------------------|------------------------------------------------------|
| `read_i8` / `read_char`               | `write_i8` / `write_char`                | signed 8-bit integer                                 |
| `read_u8` / `read_byte`               | `write_u8` / `write_byte`                | unsigned 8-bit integer                               |
| `read_i16` / `read_short`             | `write_i16` / `write_short`              | signed 16-bit integer                                |
| `read_u16` / `read_word`              | `write_u16` / `write_word`               | unsigned 16-bit integer                              |
| `read_i32` / `read_int` / `read_long` | `write_i32` / `write_int` / `write_long` | signed 32-bit integer                                |
| `read_u32` / `read_dword`             | `write_u32` / `write_dword`              | unsigned 32-bit integer                              |
| `read_f32` / `read_float`             | `write_f32` / `write_float`              | single-precision float                               |
| `read_f64` / `read_double`            | `write_f64` / `write_double`             | double-precision float                               |
| `read_string8` / `read_string`        | `write_string8` / `write_string`         | null-terminated string (8-bit)                       |
| `read_bit(address, bit)`              | `write_bit(address, bit, value)`         | read/write a single bit (value as number or boolean) |

---