---
layout: post
title: "Halo PC/CE: SAPP Lua Scripting"
date: 31-03-2026
author: Jericho Crosby
categories: [ education, halo, modding ]
tags: [ sapp, lua, halo, scripting, tutorial ]
---

This page covers a variety of things that you need to start writing Lua scripts for **SAPP** (the dedicated server
mod for Halo PC/CE). You'll learn:

- The basics of SAPP Lua scripting (events, callbacks, API version)
- Three complete tutorials: Welcome Message, Chat Command, and Kill Counter
- How to use **LuaJIT** and the **FFI library** for advanced functionality
- A blank template with every available event callback

All code examples are fully functional and ready to use on your server.

---

## 1. The Basics: Every SAPP Script Needs This

All SAPP Lua scripts must declare the API version at the top:

```lua
api_version = '1.12.0.0'
```

This tells SAPP which Lua API version the script expects. After that, you register callbacks inside `OnScriptLoad()` and
implement the corresponding functions.

### Core Structure

```lua
api_version = '1.12.0.0'

function OnScriptLoad()
    -- Register your event callbacks here
    register_callback(cb['EVENT_JOIN'], "OnPlayerJoin")
    print("Script loaded!")
end

function OnScriptUnload()
    -- Cleanup code (optional)
end

-- Your event handlers go below
function OnPlayerJoin(playerIndex)
    -- Do something when a player joins
end
```

---

## 2. Tutorial 1: Welcome Message

**File:** `welcome-message.lua`

This script greets players when they join and displays the current map and game mode.

```lua
---------------------------------------------------
-- Welcome Message Tutorial for SAPP
-- Greets players on join and displays server info
---------------------------------------------------

--------------------------------------------------------------------------------
-- CONFIG / CONSTANTS
--------------------------------------------------------------------------------
-- Messages and settings that rarely change during runtime
local WELCOME_MESSAGE = "Welcome to the server, %s!" -- %s will be replaced with the player's name
local DELAY_BEFORE_WELCOME = 3                       -- Delay in seconds before showing the welcome message
local SHOW_SERVER_INFO = true                        -- Whether to display map and mode info

-- * Required for all SAPP Lua scripts.
-- Tells SAPP the Lua API version being used on the server.
api_version = '1.12.0.0'

--------------------------------------------------------------------------------
-- INTERNAL STATE
--------------------------------------------------------------------------------
-- Variables that will store the current map and game mode
-- These change whenever a new game starts
local mapName, gameMode

--------------------------------------------------------------------------------
-- EVENT CALLBACKS
--------------------------------------------------------------------------------
-- Called automatically when the script is loaded
function OnScriptLoad()
    -- Register event callbacks for when a player joins or a new game starts
    register_callback(cb['EVENT_JOIN'], "OnPlayerJoin")
    register_callback(cb['EVENT_GAME_START'], "OnGameStart")

    -- Print a message to the server console so we know the script loaded successfully
    print("Welcome script loaded successfully!")

    -- Immediately update map and mode in case the script is loaded mid-game
    OnGameStart()
end

-- Called automatically when the script is unloaded (optional, here left empty)
function OnScriptUnload() end

--------------------------------------------------------------------------------
-- EVENT HANDLERS
--------------------------------------------------------------------------------
-- Called whenever a new game starts
function OnGameStart()
    -- If the game hasn't actually started yet, exit the function early
    if get_var(0, '$gt') == 'n/a' then return end

    -- Update our internal state variables with the current map and mode
    mapName = get_var(0, "$map")
    gameMode = get_var(0, "$mode")
end

-- Called whenever a player joins the server
function OnPlayerJoin(playerIndex)
    -- Wait a few seconds before sending the welcome message
    timer(DELAY_BEFORE_WELCOME * 1000, "DelayedWelcome", playerIndex)
end

--------------------------------------------------------------------------------
-- HELPER FUNCTIONS
--------------------------------------------------------------------------------
-- Format the welcome message with the player's name
local function formatMessage(name)
    -- string.format replaces %s in WELCOME_MESSAGE with the player's name
    return string.format(WELCOME_MESSAGE, name)
end

--------------------------------------------------------------------------------
-- TIMER HANDLER
--------------------------------------------------------------------------------
-- Called by the timer to actually send the welcome message
function DelayedWelcome(playerIndex)
    -- Get the player's name
    local name = get_var(playerIndex, '$name')

    -- Format the welcome message to include the player's name
    local welcome_message = formatMessage(name)

    -- Send the welcome message to the player
    rprint(playerIndex, welcome_message)

    -- Optionally, show the server's current map and mode
    if SHOW_SERVER_INFO then
        rprint(playerIndex, "Map: " .. mapName)
        rprint(playerIndex, "Mode: " .. gameMode)
    end

    -- Returning false prevents the timer from repeating
    return false
end
```

**Key concepts:**

- `register_callback(cb['EVENT_JOIN'], "OnPlayerJoin")` – calls your function when a player joins.
- `timer(milliseconds, "functionName", params)` – delays execution.
- `get_var(index, "$name")` – retrieves player or server variables.
- `rprint(playerIndex, message)` – sends a private message to that player.

---

## 3. Tutorial 2: Chat Command

**File:** `Chat Command.lua`

This script responds to player chat commands like `!hello`.

```lua
---------------------------------------------------
-- Chat Command Tutorial for SAPP
-- Responds to player chat commands like "!hello"
---------------------------------------------------

--------------------------------------------------------------------------------
-- CONFIG / CONSTANTS
--------------------------------------------------------------------------------
local COMMAND_PREFIX = "!"    -- Prefix that identifies commands
local HELLO_COMMAND = "hello" -- Example command

-- * Required for all SAPP Lua scripts.
-- Tells SAPP the Lua API version being used on the server.
api_version = '1.12.0.0'

--------------------------------------------------------------------------------
-- EVENT CALLBACKS
--------------------------------------------------------------------------------
function OnScriptLoad()
    register_callback(cb['EVENT_CHAT'], "OnPlayerChat")
    print("Chat Command tutorial loaded!")
end

function OnScriptUnload() end

--------------------------------------------------------------------------------
-- EVENT HANDLERS
--------------------------------------------------------------------------------
function OnPlayerChat(playerIndex, message, type)
    local msg = string.lower(message) -- Make command case-insensitive

    -- Only process messages that start with the command prefix
    if string.sub(msg, 1, 1) == COMMAND_PREFIX then
        local command = string.sub(msg, 2) -- Remove prefix

        -- Example: respond to "!hello"
        if command == HELLO_COMMAND then
            local playerName = get_var(playerIndex, '$name')
            rprint(playerIndex, "Hello " .. playerName .. "! Welcome to the server!")
        end

        return false -- Block the chat message from appearing in global chat
    end
end
```

**Key concepts:**

- `cb['EVENT_CHAT']` – triggered every time a player sends a chat message.
- `return false` – prevents the message from being broadcast to other players.
- Use `string.lower()` to make commands case‑insensitive.

---

## 4. Tutorial 3: Kill Counter

**File:** `Kill Counter.lua`

This script tracks player kills and announces milestones.

```lua
---------------------------------------------------
-- Kill Counter Tutorial for SAPP
-- Tracks and announces player kill achievements
---------------------------------------------------

--------------------------------------------------------------------------------
-- CONFIG / CONSTANTS
--------------------------------------------------------------------------------
-- Settings that rarely change during runtime
local ANNOUNCE_MILESTONES = { 5, 10, 25, 50 }        -- Kill counts that trigger announcements
local MILESTONE_MESSAGE = "%s has reached %d kills!" -- %s = player name, %d = kill count
local SHOW_KILL_MESSAGE = true                       -- Whether to show a message on each kill
local KILL_MESSAGE = "+1 kill (%d total)"            -- Message format for individual kills

-- * Required for all SAPP Lua scripts.
-- Tells SAPP the Lua API version being used on the server.
api_version = '1.12.0.0'

--------------------------------------------------------------------------------
-- EVENT CALLBACKS
--------------------------------------------------------------------------------
-- Called automatically when the script is loaded
function OnScriptLoad()
    -- Register the OnKill function to run whenever a kill occurs
    register_callback(cb['EVENT_KILL'], "OnKill")

    -- Print a message to the server console so we know the script loaded successfully
    print("Kill Counter script loaded successfully!")
end

-- Called automatically when the script is unloaded (optional, here left empty)
function OnScriptUnload() end

--------------------------------------------------------------------------------
-- HELPER FUNCTIONS
--------------------------------------------------------------------------------
-- Formats a string using string.format
-- Accepts variable arguments and returns the formatted string
local function formatMessage(...)
    return string.format(...)
end

--------------------------------------------------------------------------------
-- EVENT HANDLERS
--------------------------------------------------------------------------------
-- Called whenever a player gets a kill
function OnKill(victimIndex, killerIndex)
    -- Convert indices to numbers
    victimIndex = tonumber(victimIndex)
    killerIndex = tonumber(killerIndex)

    -- Ignore server kills, suicides, and environmental kills
    -- killerIndex == 0             -> server
    -- killerIndex == -1            -> environmental object (e.g., unoccupied vehicle)
    -- victimIndex == killerIndex   -> suicide
    if killerIndex == 0 or killerIndex == -1 or victimIndex == killerIndex then return end

    -- Get the killer's name and current number of kills
    local playerName = get_var(killerIndex, "$name")
    local currentKills = tonumber(get_var(killerIndex, "$kills"))

    -- Show individual kill message if enabled
    if SHOW_KILL_MESSAGE then
        local output = formatMessage(KILL_MESSAGE, currentKills)
        rprint(killerIndex, output) -- Prints message only to the killer
    end

    -- Check if this kill count matches any milestone
    for _, milestone in ipairs(ANNOUNCE_MILESTONES) do
        if currentKills == milestone then
            local output = formatMessage(MILESTONE_MESSAGE, playerName, milestone)
            say_all(output) -- Announce milestone to all players
            break           -- Stop checking further milestones once matched
        end
    end
end
```

**Key concepts:**

- `cb['EVENT_KILL']` – triggered on every kill (victimIndex, killerIndex).
- `get_var(killerIndex, "$kills")` – returns the player’s current kill count.
- `say_all(message)` – broadcasts a message to everyone on the server.
- Use `tonumber()` because SAPP returns values as strings.

---

## 5. Advanced: Using LuaJIT and FFI in SAPP

**File:** `Using LuaJIT and ffi in SAPP.md`

SAPP uses **LuaJIT**, a high-performance just-in-time compiler for **Lua 5.1**. This means most Lua 5.1 code works, plus
you get advanced features like the `ffi` library to interface with C functions and memory.

### 5.1 What LuaJIT Gives You

- Fully compatible with **Lua 5.1**
- `ffi` library: call C functions, define structs, manipulate memory
- Performance improvements for math-heavy or iterative code

> **Note:** SAPP scripts run in a sandboxed environment. Some OS APIs may be restricted, and unsafe memory operations
> can crash the server.

### 5.2 Checking if `ffi` is Available

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

- `pcall` prevents crashes if `ffi` is blocked.
- Output appears in the server console.

### 5.3 Fully Functional Demo: Ticks Since Boot

Real-world FFI use: calling `GetTickCount` from Windows to get milliseconds since system boot.

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
    
    register_callback(cb["EVENT_TICK"], "OnTick")
end

-- Print ticks every 10 seconds
function OnTick()
    if (os.clock() % 10) < 0.05 then
        local ticks = ffi.C.GetTickCount()
        cprint(string.format("Ticks since boot: %d", ticks), 10) -- print in green
    end
end
```

**How It Works**

1. **`api_version`** – Required for SAPP 1.12.0.0 scripts.
2. **`ffi.cdef`** – Declares the C function signature.
3. **`ffi.C.GetTickCount()`** – Calls the Windows API to get milliseconds since system boot.
4. **`cprint`** – Prints colored text to the server console (SAPP built-in).
5. **`OnTick`** – Prints ticks every 10 seconds to show live updates.

### 5.4 Key Tips and Safety

- Stick to **safe, read-only operations** at first.
- Avoid writing memory directly unless you know the exact structure.
- Remember: SAPP Lua is sandboxed, so not all OS APIs or memory operations are available.

---

## 6. Complete Blank Template (All Event Callbacks)

**File:** `blank_tutorial.lua`

Use this as a starting point for your own scripts. It includes every available SAPP event callback with helpful
comments.

```lua
api_version = '1.12.0.0'

--[[
SAPP Tutorial Script
This script demonstrates how to use various SAPP event callbacks.
Server operators can use this as a starting point for their own scripts.
]]

function OnScriptLoad()
    -- Register all event callbacks
    -- Game State Events
    register_callback(cb['EVENT_GAME_START'], 'OnNewGame')
    register_callback(cb['EVENT_GAME_END'], 'OnGameEnd')
    register_callback(cb['EVENT_MAP_RESET'], 'OnMapReset')
    register_callback(cb['EVENT_TICK'], 'OnTick')

    -- Player Lifecycle Events
    register_callback(cb['EVENT_PREJOIN'], 'OnPlayerPrejoin')
    register_callback(cb['EVENT_JOIN'], 'OnPlayerJoin')
    register_callback(cb['EVENT_LEAVE'], 'OnPlayerLeave')
    register_callback(cb['EVENT_PRESPAWN'], 'OnPlayerPrespawn')
    register_callback(cb['EVENT_SPAWN'], 'OnPlayerSpawn')
    register_callback(cb['EVENT_ALIVE'], 'OnCheckAlive')
    register_callback(cb['EVENT_DIE'], 'OnPlayerDeath')

    -- Player Action Events
    register_callback(cb['EVENT_CHAT'], 'OnPlayerChat')
    register_callback(cb['EVENT_KILL'], 'OnPlayerKill')
    register_callback(cb['EVENT_SUICIDE'], 'OnSuicide')
    register_callback(cb['EVENT_BETRAY'], 'OnBetray')
    register_callback(cb['EVENT_SCORE'], 'OnScore')
    register_callback(cb['EVENT_LOGIN'], 'OnLogin')
    register_callback(cb['EVENT_TEAM_SWITCH'], 'OnTeamSwitch')

    -- Anti-Cheat Events
    register_callback(cb['EVENT_SNAP'], 'OnSnap')
    register_callback(cb['EVENT_CAMP'], 'OnCamp')
    register_callback(cb['EVENT_WARP'], 'OnWarp')

    -- Object Interaction Events
    register_callback(cb['EVENT_WEAPON_DROP'], 'OnWeaponDrop')
    register_callback(cb['EVENT_WEAPON_PICKUP'], 'OnWeaponPickup')
    register_callback(cb['EVENT_VEHICLE_ENTER'], 'OnVehicleEntry')
    register_callback(cb['EVENT_VEHICLE_EXIT'], 'OnVehicleExit')
    register_callback(cb['EVENT_OBJECT_SPAWN'], 'OnObjectSpawn')

    -- Area Events
    register_callback(cb['EVENT_AREA_ENTER'], 'OnAreaEnter')
    register_callback(cb['EVENT_AREA_EXIT'], 'OnAreaExit')

    -- Command and Damage Events
    register_callback(cb['EVENT_COMMAND'], 'OnServerCommand')
    register_callback(cb['EVENT_DAMAGE_APPLICATION'], 'OnDamageApplication')
    register_callback(cb['EVENT_ECHO'], 'OnEcho')
end

function OnScriptUnload()
    -- Cleanup code when script is unloaded
    -- Unregister timers, free resources, etc.
end

-- Game State Events
function OnNewGame()
    -- Called when a new game starts
    -- Good for initializing game-specific variables
end

function OnGameEnd()
    -- Called when the game ends
    -- Good for cleanup or saving statistics
end

function OnMapReset()
    -- Called when sv_map_reset is executed
    -- Resets the map without changing game variant
end

function OnTick()
    -- Called every game tick (approximately 30 times per second)
    -- Use for frequent checks or updates
end

-- Player Lifecycle Events
function OnPlayerPrejoin(PlayerIndex)
    -- Called when a player is joining but not fully connected yet
    -- Can be used to block players before they fully join
end

function OnPlayerJoin(PlayerIndex)
    -- Called when a player has successfully joined the server
    -- Good for welcome messages or initializing player data
end

function OnPlayerLeave(PlayerIndex)
    -- Called when a player disconnects from the server
    -- Good for cleanup of player-specific data
end

function OnPlayerPrespawn(PlayerIndex)
    -- Called when a player is about to spawn
    -- Can modify player properties before they spawn
end

function OnPlayerSpawn(PlayerIndex)
    -- Called after a player has spawned
    -- Good for giving items or setting up player state
end

function OnCheckAlive(PlayerIndex)
    -- Called every second for each alive player
    -- Good for periodic checks on living players
end

function OnPlayerDeath(PlayerIndex, KillerIndex)
    -- Called when a player dies
    -- PlayerIndex: who died
    -- KillerIndex: who caused the death (-1 for suicide, 0 for environment)
end

-- Player Action Events
function OnPlayerChat(PlayerIndex, Message, Type)
    -- Called when a player sends a chat message
    -- Return false to block the message
    -- Type: 0 = global, 1 = team, 2 = vehicle chat
end

function OnPlayerKill(PlayerIndex, VictimIndex)
    -- Called when a player gets a kill
    -- PlayerIndex: who got the kill
    -- VictimIndex: who was killed
end

function OnSuicide(PlayerIndex)
    -- Called when a player commits suicide
end

function OnBetray(PlayerIndex, VictimIndex)
    -- Called when a player betrays a teammate
end

function OnScore(PlayerIndex)
    -- Called when a player scores (in objective games)
end

function OnLogin(PlayerIndex)
    -- Called when a player successfully logs in as admin
end

function OnTeamSwitch(PlayerIndex)
    -- Called when a player changes teams
end

-- Anti-Cheat Events
function OnSnap(PlayerIndex, SnapScore)
    -- Called when anti-cheat detects snapping (aimbot behavior)
    -- SnapScore: the calculated snap score
end

function OnCamp(PlayerIndex, CampKills)
    -- Called when anti-camp detects camping behavior
    -- CampKills: number of kills while camping
end

function OnWarp(PlayerIndex)
    -- Called when anti-warp detects warping (lag switching)
end

-- Object Interaction Events
function OnWeaponDrop(PlayerIndex, Slot)
    -- Called when a player drops a weapon
    -- Slot: which weapon slot was dropped
end

function OnWeaponPickup(PlayerIndex, WeaponId)
    -- Called when a player picks up a weapon
    -- WeaponId: the object ID of the picked up weapon
end

function OnVehicleEntry(PlayerIndex, VehicleId)
    -- Called when a player enters a vehicle
    -- VehicleId: the object ID of the vehicle entered
end

function OnVehicleExit(PlayerIndex, VehicleId)
    -- Called when a player exits a vehicle
    -- VehicleId: the object ID of the vehicle exited
end

function OnObjectSpawn(ObjectId)
    -- Called when an object spawns in the game
    -- ObjectId: the object ID of the spawned object
end

-- Area Events
function OnAreaEnter(PlayerIndex, AreaName)
    -- Called when a player enters a defined area
    -- AreaName: the name of the area entered
end

function OnAreaExit(PlayerIndex, AreaName)
    -- Called when a player exits a defined area
    -- AreaName: the name of the area exited
end

-- Command and Damage Events
function OnServerCommand(PlayerIndex, Command)
    -- Called when a command is executed on the server
    -- Return false to block the command
end

function OnDamageApplication(PlayerIndex, Damage)
    -- Called when damage is applied to a player
    -- Can modify or block damage before it's applied
    -- Return false to block the damage
end

function OnEcho()
    -- Called when command output is echoed to console
end
```

---

## 7. Next Steps

Now that you have the basics and a full template, you can:

- Combine multiple event callbacks into one script.
- Use `timer()` for delayed or repeating actions.
- Experiment with `get_var()` and `set_var()` to modify player properties.
- Explore the FFI library for advanced system integration.
- Join the HSP community to share your scripts and get help.