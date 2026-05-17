---
title: "Halo Lua - Common References"
date: 2026-05-17
categories: [ education, halo, modding ]
tags: [ sapp, phasor, chimera, lua, scripting, utilities ]
---

This document collects **pure Lua utility functions** that work across SAPP, Phasor, and Chimera without relying on
platform-specific APIs. They are safe to use in any Lua 5.1+ environment.

> For platform-specific APIs, see the dedicated tutorials:
> - [SAPP Scripting](2026-05-17-halo-scripting-with-sapp.md)
> - [Phasor Scripting](2026-05-17-halo-scripting-with-phasor.md)
> - [Chimera Scripting](2026-05-17-halo-scripting-with-chimera.md)

---

## Compatibility Note: `math.atan2`

Some Lua environments may not expose `math.atan2`. Use this fallback to ensure, for example, that cardinal direction
functions work everywhere:

```lua
if not math.atan2 then
    local pi = math.pi
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

## Utility Functions

### Check if Two Points are Within a Radius (3D, squared distance)

Uses squared distance to avoid expensive `math.sqrt` - ideal for per-tick checks.

**Parameters:**  
`px, py, pz`, `ox, oy, oz` (numbers) - Coordinates of the two points.  
`radius` (number) - Distance threshold.

**Returns:** `true` if within radius, `false` otherwise.

```lua
local function in_sphere(px, py, pz, ox, oy, oz, radius)
    local dx, dy, dz = ox - px, oy - py, oz - pz
    return (dx * dx + dy * dy + dz * dz) <= radius * radius
end
```

---

### Convert Camera Direction to Cardinal Point (N, NE, E, ...)

Converts a direction vector (e.g., from camera forward vector) into a compass point. Includes the `math.atan2` fallback
shown above.

**Parameters:**  
`fx, fy` (numbers) - X and Y components of the direction vector.

**Returns:** String like `"N"`, `"NE"`, `"E"`, etc.

```lua
function direction_to_cardinal(fx, fy)
    local angle = (90 - math.deg(math.atan2(fy, fx))) % 360
    local dirs = {"N", "NE", "E", "SE", "S", "SW", "W", "NW"}
    local idx = math.floor((angle + 22.5) / 45) % 8 + 1
    return dirs[idx]
end
```

---

### Deep Copy a Table (Handles Nested Tables and Metatables)

Creates a fully independent copy of a table, including nested structures and metatables.

**Warning:** Does not handle circular references (will cause infinite recursion).

**Parameters:**  
`orig` (any) - The value or table to copy.

**Returns:** A deep copy.

```lua
function deep_copy(orig)
    if type(orig) ~= "table" then return orig end
    local copy = {}
    for k, v in pairs(orig) do
        copy[deep_copy(k)] = deep_copy(v)
    end
    return setmetatable(copy, deep_copy(getmetatable(orig)))
end
```

---

### Shuffle an Array (Fisher-Yates)

Randomly shuffles an array-style table in place. Every permutation is equally likely.

**Parameters:**  
`t` (table) - Table with sequential integer keys starting at 1.

**Returns:** Nothing (modifies the table in place).

```lua
function shuffle_array(t)
    for i = #t, 2, -1 do
        local j = math.random(i)
        t[i], t[j] = t[j], t[i]
    end
end
```

**Note:** Call `math.randomseed(os.time())` once at script load for proper randomness.

---

### Get Number of Key-Value Pairs in Any Table

Works for both array-style and dictionary-style tables (unlike Lua's `#` operator).

**Parameters:**  
`t` (table) - Any table.

**Returns:** Number of key-value pairs.

```lua
function table_length(t)
    local count = 0
    for _ in pairs(t) do
        count = count + 1
    end
    return count
end
```

---

### Parse Command Arguments by Delimiter

Splits a string into substrings based on a delimiter - useful for parsing chat commands or CSV data.

**Parameters:**  
`input` (string) - The string to split.  
`delimiter` (string) - The delimiter character (e.g., `" "`, `","`).

**Returns:** An array-like table of substrings.

```lua
function parse_args(input, delimiter)
    local result = {}
    for substring in input:gmatch("([^" .. delimiter .. "]+)") do
        result[#result + 1] = substring
    end
    return result
end
```

**Example:**  
`parse_args("/give weapon sniper", " ")` → `{"/give", "weapon", "sniper"}`

---

### Format Messages - Three Approaches

#### Version 1: Classic `string.format` style

Define message templates as constants and use a wrapper that behaves like `string.format`.

```lua
local HELLO_MESSAGE = "Hello world!"
local PLAYER_JOINED = "Player %s has joined the game."
local PLAYER_SCORE = "%s scored %d points in %d minutes."

local function format_message(message, ...)
    if select('#', ...) > 0 then
        return message:format(...)
    end
    return message
end

-- Usage:
print(format_message(HELLO_MESSAGE))
print(format_message(PLAYER_JOINED, "Chalwk"))
print(format_message(PLAYER_SCORE, "Chalwk", 150, 12))
```

#### Version 2: Placeholder-based (named variables)

Use named placeholders like `$name` and replace from a table.

```lua
local SCORE_MESSAGE = "$name scored $points points in $minutes minutes."
local JOIN_MESSAGE = "Player $name has joined the server."

local function format_message(message, vars)
    return (message:gsub("%$(%w+)", function(key)
        return vars[key] or "$" .. key
    end))
end

-- Usage:
print(format_message(JOIN_MESSAGE, {name = "Chalwk"}))
print(format_message(SCORE_MESSAGE, {name = "Chalwk", points = 150, minutes = 12}))
```

#### Version 3: Case-insensitive placeholders with fallback

This version matches placeholders like `$NAME`, `$Name`, or `$name` to a key in the `args` table by trying the original
key, then lowercased, then uppercased. Missing placeholders are left unchanged.

```lua
local function format(template, args)
    if not args then return template end
    return (template:gsub("%$([%w_]+)", function(key)
        local value = args[key] or args[key:lower()] or args[key:upper()]
        return value ~= nil and tostring(value) or "$" .. key
    end))
end
```

**Usage examples:**

```lua
print(format("Hello $name, you have $points points!", {name = "Chalwk", points = 42}))
-- → "Hello Chalwk, you have 42 points!"

print(format("Welcome $NAME", {name = "Chalwk"}))
-- → "Welcome Chalwk"  (matches because $NAME -> args["name"]:upper())

print(format("Score: $score", {}))
-- → "Score: $score"

-- No args table → returns template unchanged
print(format("Plain text"))
-- → "Plain text"
```

---

## Performance Best Practices

The following tips help you write efficient Lua scripts that run smoothly with SAPP, Phasor and Chimera. They are
especially important for code that executes frequently, such as per-tick callbacks.

### Localize Heavily Used Globals

Cache frequently used globals into local variables at the top of your script or function. For example:

```lua
local table_insert = table.insert
local math_random = math.random
local string_sub = string.sub
```

Local variable access is faster than global table lookups. This small optimisation adds up in hot code paths that run
many times per second.

### Be GC-Aware - Control Collection During Quiet Moments

Lua's garbage collector can cause small pauses when it runs. If you need to force collection, use `collectgarbage()`
tactically - for example, during round end or idle periods. Use this sparingly and measure the impact first. In most
cases, letting the collector run automatically is fine.

### Minimize Garbage - Reuse Tables / Object Pools

Creating many small temporary tables each tick increases garbage collector churn and can cause frame hitches. Reuse
tables with a simple pool instead of allocating new ones repeatedly.

**Simple pool pattern:**

```lua
local pool = {}

local function new_table()
    return table.remove(pool) or {}
end

local function free_table(t)
    for k in pairs(t) do t[k] = nil end
    pool[#pool + 1] = t
end
```

Use `new_table()` to obtain a table and `free_table(t)` to return it to the pool when you are done.

### Avoid Heavy Work Inside Callbacks - Batch and Defer

If an event fires often, such as `OnTick` or `OnClientUpdate`, do the minimum work inside the callback. Push heavy
processing to a timer or queue that runs at a lower frequency, for example every 200 milliseconds.

**Pattern:**

1. The callback pushes a lightweight record (e.g., a player ID and timestamp) into a table.
2. A separate timer, running every 200 ms, drains that table and performs the expensive operations.

This keeps the fast path lean and prevents frame rate drops.

### Timer Functions for Delayed/Repeating Work

Each platform provides its own timer function for scheduling work after a delay. Use these to defer non-critical tasks
or run periodic checks without blocking the main game loop.

- **SAPP:** `timer(ms, callback, ...)`
- **Chimera:** `set_timer(ms, callback, ...)`
- **Phasor:** `registertimer(ms, callback, ...)`

If the callback returns `true`, it repeats every `ms` milliseconds. The following example uses SAPP syntax:

```lua
function OnPlayerJoin(player_id)
    timer(5000, "PostJoinTask", player_id)
end

function PostJoinTask(player_id)
    -- do something after 5 seconds
end
```

Adapt the function name to match your target platform.

---

