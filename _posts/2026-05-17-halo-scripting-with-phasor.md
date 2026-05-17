---
title: "Scripting with Phasor - Server-Side Lua"
date: 2026-05-17
categories: [ education, halo, modding ]
tags: [ phasor, lua, scripting, server ]
---

Phasor is a **server-side** extension for Halo PC/Custom Edition. It exposes a Lua Scripting API, anti-cheat tools,
event hooks, command handling, player management, logging, and numerous under-the-hood features. **This guide focuses on
its Lua API**, walks through the core scripting model and practical examples so you can build your Lua scripts.

**Important:** <u>Phasor's Lua API is based on <strong>Lua 5.2</strong>.</u>

This guide assumes you have read:

- [Common Lua References](2026-05-17-halo-lua-common-references.md)
- [Memory Offsets Deep Dive](2025-09-07-halo-understanding-memory-offsets.md).

---

## Script Skeleton & Version Check

See [this blank Phasor script](https://github.com/Chalwk/SPCLib/blob/master/phasor/blank_script_template.md)

---

## Handling Game Version (PC vs CE)

Because Phasor cannot scan signatures, you must use the `game` parameter to select the correct hardcoded addresses.
The [Common Lua References](2026-05-17-halo-lua-common-references.md) provides many offsets - here's a practical example:

```lua
local gametype_base

function OnScriptLoad(processid, game, persistent)
    if game == "PC" then
        gametype_base = 0x671340
    else  -- CE
        gametype_base = 0x5F5498
    end
end

function get_score_limit()
    return readbyte(gametype_base + 0x58)
end
```

---

THE REST OF THIS GUIDE IS STILL BEING WORKED ON

THE REST OF THIS GUIDE IS STILL BEING WORKED ON

THE REST OF THIS GUIDE IS STILL BEING WORKED ON

THE REST OF THIS GUIDE IS STILL BEING WORKED ON

---
