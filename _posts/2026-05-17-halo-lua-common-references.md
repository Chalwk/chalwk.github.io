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

### String Utilities

#### Check if a String Starts with a Command Prefix

```lua
--- Checks if a string begins with '/' or '\' (typical command prefix).
-- @param str (string)
-- @return boolean
local function is_command(str)
    if not str then return false end
    local first = sub(str, 1, 1)
    return first == "/" or first == "\\"
end
```

#### Strip Leading Slashes or Backslashes

```lua
--- Strips leading slash(es) or backslash(es) from a string.
-- @param msg (string) raw input
-- @return string cleaned string
local function strip_prefix(msg)
    if not msg then return "" end
    return gsub(msg, "^[\\/]+", "")
end
```

#### Split String by Multiple Delimiters

Splits a string by any of the given delimiter strings. Longer delimiters take precedence.

```lua
--- Splits a string by any of the given delimiter strings.
-- @param str (string) the string to split
-- @param ... delimiter strings
-- @return table array of substrings
local function split_string(str, ...)
    local delims = { ... }
    if #delims == 0 then return { str } end

    -- Split into individual characters if any delimiter is empty
    for _, d in ipairs(delims) do
        if d == "" then
            local chars = {}
            for i = 1, #str do
                chars[#chars + 1] = sub(str, i, i)
            end
            return chars
        end
    end

    -- Sort delimiters by length descending so the longest match wins
    table.sort(delims, function(a, b) return #a > #b end)

    -- Escape magic characters in each delimiter for Lua pattern
    local escaped = {}
    for _, d in ipairs(delims) do
        escaped[#escaped + 1] = gsub(d, "([%^%$%(%)%%%.%[%]%*%+%-%?])", "%%%1")
    end
    local sep_pattern = table.concat(escaped, "|")

    -- Split using the complement of the delimiter pattern
    local tokens = {}
    for token in gmatch(str, "([^" .. sep_pattern .. "]+)") do
        tokens[#tokens + 1] = token
    end

    -- Strip all delimiter characters from each token (legacy behaviour)
    for i = 1, #tokens do
        local token = tokens[i]
        for _, d in ipairs(delims) do
            token = gsub(token, gsub(d, "([%^%$%(%)%%%.%[%]%*%+%-%?])", "%%%1"), "")
        end
        tokens[i] = token
    end

    return tokens
end
```

#### Tokenize Command Line Arguments (Respect Quotes)

```lua
--- Tokenizes a string like command line arguments, respecting double quotes.
-- e.g., tokenize_cmd_string('say "hello world" foo') -> {"say", "hello world", "foo"}
-- @param str (string)
-- @return table array of tokens
local function tokenize_cmd_string(str)
    local tokens = {}
    str = str:gsub("^%s*(.-)%s*$", "%1") .. " " -- trim and add sentinel
    local pos = 1
    while pos <= #str do
        local token, newPos
        -- try double-quoted string
        token, newPos = str:match('^"([^"]*)"%s+()', pos)
        if not token then
            token, newPos = str:match('^([^%s]+)%s+()', pos)
        end
        if not token then break end
        tokens[#tokens + 1] = token
        pos = newPos
    end
    return tokens
end
```

#### Find All Indices of a Character in a String

```lua
--- Returns all indices where a character appears in a string.
-- @param str (string)
-- @param char (string) single character to search
-- @return number ... index list
local function find_char(str, character)
    local indices = {}
    for i = 1, #str do
        if sub(str, i, i) == character then
            indices[#indices + 1] = i
        end
    end
    return unpack(indices)
end
```

#### Wildcard Matching (`*` and `?`)

```lua
--- Performs case-insensitive wildcard matching with '*' and '?'.
-- @param str (string) the string to test
-- @param pattern (string) wildcard pattern (e.g., "Hel*o?")
-- @param case_sensitive (boolean) optional, default false
-- @return boolean match result
local function wildcard_match(str, pattern, case_sensitive)
    if not case_sensitive then
        str = str:lower()
        pattern = pattern:lower()
    end

    -- Quick shortcut: handle leading/trailing '?' by substituting them with
    -- the actual character from str (non-standard but kept for compatibility)
    if sub(pattern, 1, 1) == "?" then
        pattern = gsub(pattern, "?", sub(str, 1, 1), 1)
    end
    if sub(pattern, -1) == "?" then
        pattern = gsub(pattern, "?", sub(str, -1), 1)
    end

    -- No wildcards -> simple equality check
    if not pattern:find("*") and not pattern:find("?") then
        return str == pattern
    end

    -- Quick mismatch checks
    if sub(pattern, 1, 1) ~= sub(str, 1, 1) and sub(pattern, 1, 1) ~= "*" then
        return false
    end
    if sub(pattern, -1) ~= sub(str, -1) and sub(pattern, -1) ~= "*" then
        return false
    end

    -- Split pattern into subpatterns by '*'
    local subpatterns = {}
    local plen = #pattern
    local cur = ""
    for i = 1, plen do
        local c = sub(pattern, i, i)
        if c == "*" then
            if cur ~= "" then
                subpatterns[#subpatterns + 1] = cur
                cur = ""
            end
        else
            cur = cur .. c
        end
    end
    if cur ~= "" then
        subpatterns[#subpatterns + 1] = cur
    end

    -- Greedy match for each subpattern
    local start = 1
    local slen = #str
    for _, subp in ipairs(subpatterns) do
        local sublen = #subp
        local found = false
        local ts = start
        local te = start + sublen - 1
        while te <= slen do
            -- Check if subp matches the current slice (with '?' wildcard)
            local match = true
            for j = 1, sublen do
                local pc = sub(subp, j, j)
                if pc ~= "?" and pc ~= sub(str, ts + j - 1, ts + j - 1) then
                    match = false
                    break
                end
            end
            if match then
                found = true
                start = ts + sublen -- advance past the matched part
                break
            end
            ts = ts + 1
            te = te + 1
        end
        if not found then return false end
    end
    return true
end
```

---

### Time Utilities

#### Convert Duration String to Seconds

Supports `s` (seconds), `m` (minutes), `h` (hours), `d` (days).

```lua
--- Converts a time-duration string (e.g., "5m30s", "2h", "1d12h") to seconds.
-- @param time_string (string) human-readable duration
-- @return number total seconds, or -1 if invalid
local function word_to_time(time_string)
    if not time_string then return -1 end
    local s, num = 0, ""
    for i = 1, #time_string do
        local c = sub(time_string, i, i)
        if tonumber(c) then
            num = num .. c
        else
            local amount = tonumber(num) or 0
            if c == "s" then
                s = s + amount
            elseif c == "m" then
                s = s + amount * 60
            elseif c == "h" then
                s = s + amount * 3600
            elseif c == "d" then
                s = s + amount * 86400
            end
            num = ""
        end
    end
    return s > 0 and s or -1
end
```

#### Convert Seconds to Human-Readable String

```lua
--- Converts a number of seconds to a human-readable string like "5m 30s".
-- @param s (number) total seconds
-- @return string formatted time or "-1" if invalid
local function time_to_word(s)
    if s == -1 or not tonumber(s) then return "-1" end
    s = tonumber(s)
    local days = math.floor(s / 86400)
    s = s % 86400
    local hours = math.floor(s / 3600)
    s = s % 3600
    local mins = math.floor(s / 60)
    local secs = s % 60
    local parts = {}

    if days > 0 then parts[#parts + 1] = days .. "d" end
    if hours > 0 then parts[#parts + 1] = hours .. "h" end
    if mins > 0 then parts[#parts + 1] = mins .. "m" end
    if secs > 0 or #parts == 0 then parts[#parts + 1] = secs .. "s" end

    return table.concat(parts, " ")
end
```

#### Format Duration as `HH:MM:SS`

```lua
--- Formats a duration given in seconds as a "HH:MM:SS" string.
-- @param seconds (number) total seconds
-- @return string formatted time (e.g., "01:30:45")
local function format_duration(seconds)
    seconds = tonumber(seconds) or 0
    local h = math.floor(seconds / 3600)
    local m = math.floor((seconds % 3600) / 60)
    local s = math.floor(seconds % 60)
    return string.format("%02d:%02d:%02d", h, m, s)
end
```

---

### IP / Network Utilities

These functions help validate, convert, and match IPv4 addresses using wildcards, CIDR, or ranges.

#### Validate and Normalize an IPv4 Address

```lua
--- Validates an IPv4 address (supports wildcards, CIDR, and ranges).
-- Normalizes 1.2.*.* to 1.2.0.0/16, etc. Returns formatted string or false.
-- @param ip (string) IP string
-- @return string|boolean normalized IP, or false if invalid
local function validate_ipv4(ip)
    if not ip then return false end
    ip = gsub(gsub(ip, "[%s]*", ""), "x+", "*")
    local a, b, c, slash, d, finish = ip:match("^([^%.]+)%.([^%.]*)%.?([^%./]*)%.?(/?)([^%.]*)()")
    a = a == "" and "*" or a:match("[%d%*]+")
    b = b == "" and "*" or b:match("[%d%*]+")
    c = c == "" and "*" or c:match("[%d%*]+")
    slash = slash ~= ""
    d = d or ""
    if slash then
        if d:find("/") or not d:match("[%d%*]+") then return false end
        d = "0/" .. d
    else
        d = d == "" and "*" or d:match("[%d%*/]+")
    end

    if not a or not b or not c then return false end

    local found, a2, b2, c2, d2 = ip:match("(%-)(%d+)%.(%d*)%.?(%d*)%.?(%d*)%c*$", finish)
    if not found then
        if a2 and a ~= "" then return false end
        return string.format("%s.%s.%s.%s", a, b, c, d)
    elseif slash then
        return false
    end
    a2 = a2 == "" and "*" or a2:match("[%d%*]+")
    b2 = b2 == "" and "*" or b2:match("[%d%*]+")
    c2 = c2 == "" and "*" or c2:match("[%d%*]+")
    d2 = d2 == "" and "*" or d2:match("[%d%*]+")

    if not a2 or not b2 or not c2 then return false end
    if c2:find("/") and d2:find("/") then return false end
    return string.format("%s.%s.%s.%s-%s.%s.%s.%s", a, b, c, d, a2, b2, c2, d2)
end
```

#### Convert IPv4 to 32-bit Integer

```lua
--- Converts a dotted IPv4 address to a 32-bit integer.
-- @param ip_addr (string) IPv4 address
-- @return number|nil IP as 32-bit unsigned integer, or nil on error
local function ip_to_long(ip_addr)
    local a, b, c, d = ip_addr:match("^(%d+)%.(%d+)%.(%d+)%.(%d+)$")
    if not a then return nil end
    a, b, c, d = tonumber(a), tonumber(b), tonumber(c), tonumber(d)
    if not (a and b and c and d) then return nil end
    return bit32.bor(bit32.lshift(a, 24), bit32.lshift(b, 16), bit32.lshift(c, 8), d)
end
```

#### Convert Integer to Dotted IPv4

```lua
--- Converts a 32-bit integer to a dotted IPv4 address.
-- @param addr (number) 32-bit unsigned integer
-- @return string IPv4 dotted notation
local function long_to_ip(addr)
    local a = bit32.rshift(bit32.band(addr, 0xFF000000), 24)
    local b = bit32.rshift(bit32.band(addr, 0x00FF0000), 16)
    local c = bit32.rshift(bit32.band(addr, 0x0000FF00), 8)
    local d = bit32.band(addr, 0x000000FF)
    return string.format("%i.%i.%i.%i", a, b, c, d)
end
```

#### Convert Wildcard Notation to CIDR

```lua
local function wildcard_to_cidr(addr)
    local count = select(2, addr:gsub("%*", "*"))
    if count == 1 then
        return addr:gsub("%*", "0") .. "/24"
    elseif count == 2 then
        return addr:gsub("%*", "0") .. "/16"
    elseif count == 3 then
        return addr:gsub("%*", "0") .. "/8"
    elseif count > 3 then
        return "0.0.0.0/0"
    end
    return addr
end
```

#### Check if an IP Matches a Network Definition

Supports CIDR (`192.168.1.0/24`), wildcards (`10.*.*.*`), and ranges (`10.0.0.1-10.0.0.255`).

```lua
--- Checks whether an IP address matches a network definition (CIDR, wildcard, range).
-- @param network (string) network pattern
-- @param ip (string) IP address to test
-- @return string|boolean matched network string, or false
local function ip_matches_network(network, ip)
    network = validate_ipv4(network)
    if not ip then return network end
    ip = validate_ipv4(ip)
    if not network or not ip then return false end

    -- Normalize wildcard to CIDR
    if network:find("%*") then network = wildcard_to_cidr(network) end
    if ip:find("%*") then ip = wildcard_to_cidr(ip) end

    local dash = network:find("-")
    if not dash then
        local net_part, mask_len = network:match("^(.-)/(%d+)$")
        mask_len = tonumber(mask_len) or 32
        local net_long = ip_to_long(net_part)
        if not net_long then return false end
        local ip_part, ip_mask_len = ip:match("^(.-)/(%d+)$")
        ip_mask_len = tonumber(ip_mask_len) or 32
        local ip_long = ip_to_long(ip_part)
        if not ip_long then return false end
        local mask = bit32.lshift(0xFFFFFFFF, (32 - mask_len))
        local ip_mask = bit32.lshift(0xFFFFFFFF, (32 - ip_mask_len))
        return bit32.band(net_long, mask, ip_mask) == bit32.band(ip_long, mask, ip_mask)
    else
        local from = ip_to_long(network:sub(1, dash - 1))
        local to = ip_to_long(network:sub(dash + 1))
        if not from or not to then return false end
        local ip_long = ip_to_long(ip)
        if not ip_long then return false end
        return ip_long >= from and ip_long <= to
    end
end
```

---

### Math Utilities

#### Check if a Point Lies Within a Circle (2D)

```lua
--- Checks if a point (px, py) lies within a circle on the XY plane.
-- @param px, py (number) point coordinates
-- @param cx, cy (number) circle center
-- @param radius (number) circle radius
-- @return boolean
local function check_in_circle(px, py, cx, cy, radius)
    return (px - cx) ^ 2 + (py - cy) ^ 2 <= radius ^ 2
end
```

#### Round a Number to a Specified Decimal Place

```lua
--- Rounds a number to a specified number of decimal places.
-- @param val (number)
-- @param decimal (number) number of decimal places (optional)
-- @return number rounded value
local function round(val, decimal)
    if decimal then
        return math.floor((val * 10 ^ decimal) + 0.5) / (10 ^ decimal)
    end
    return math.floor(val + 0.5)
end
```

#### Convert Hexadecimal String to Decimal

```lua
--- Converts a hexadecimal string to a number.
-- @param hex (string) hexadecimal representation
-- @return number|nil decimal value, or nil on failure
local function to_decimal(hex)
    return tonumber(hex, 16)
end
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