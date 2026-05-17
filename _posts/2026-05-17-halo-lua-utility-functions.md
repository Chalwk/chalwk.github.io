---
title: "Halo Lua Scripting - Common Reference"
date: 2026-05-17
categories: [ education, halo, modding ]
tags: [ sapp, phasor, chimera, lua, scripting, memory ]
---

This document covers common Lua **utility functions** for Lua scripting across SAPP, Phasor and Chimera.

> For platform-specific APIs, see the dedicated tutorials:
> - [SAPP Scripting](2026-05-17-halo-scripting-with-sapp.md)
> - [Phasor Scripting](2026-05-17-halo-scripting-with-phasor.md)
> - [Chimera Scripting](2026-05-17-halo-scripting-with-chimera.md)

---

# Common Lua Functions

## Check if Two Points are Within a Radius (3D, squared distance)

```lua
function points_in_range(x1,y1,z1, x2,y2,z2, radius)
    local dx = x1 - x2
    local dy = y1 - y2
    local dz = z1 - z2
    return (dx*dx + dy*dy + dz*dz) <= (radius*radius)
end
```

## Convert Camera Direction to Cardinal Point (N, NE, E, ...)

```lua
function direction_to_cardinal(fx, fy)
    local angle = (90 - math.deg(math.atan2(fy, fx))) % 360
    local dirs = {"N", "NE", "E", "SE", "S", "SW", "W", "NW"}
    local idx = math.floor((angle + 22.5) / 45) % 8 + 1
    return dirs[idx]
end
```

## Deep Copy a Table (handles nested tables and metatables)

```lua
function deep_copy(orig)
    if type(orig) ~= "table" then return orig end
    local copy = {}
    for k,v in pairs(orig) do
        copy[deep_copy(k)] = deep_copy(v)
    end
    return setmetatable(copy, deep_copy(getmetatable(orig)))
end
```

## Shuffle an Array (Fisher-Yates)

```lua
function shuffle_array(t)
    for i = #t, 2, -1 do
        local j = math.random(i)
        t[i], t[j] = t[j], t[i]
    end
end
```

## Get Number of Key-Value Pairs in Any Table

```lua
function table_length(t)
    local count = 0
    for _ in pairs(t) do count = count + 1 end
    return count
end
```

---
