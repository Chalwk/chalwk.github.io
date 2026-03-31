---
layout: post
title: "Halo PC/CE: SAPP Tips & Tricks"
date: 2026-03-31
author: Jericho Crosby
categories: [ education, halo, modding ]
tags: [ sapp, lua, halo, scripting, tutorial ]
---

If you're running a Halo PC or Custom Edition (CE) server with SAPP, you already know how powerful the Lua scripting API
can be. But like any tool, the difference between a script that works and one that works *well* comes down to knowing
the right patterns, pitfalls, and performance tips.

This guide compiles hard-earned lessons from the community: from proper callback usage and garbage collection to vehicle
physics fixes, color console output, and even a reality check on SAPP's DoS protection. Whether you're a beginner or a
seasoned scripter, you'll find actionable advice to make your server more stable, responsive, and secure.

Let's dive in.

---

## Understanding the SAPP Lua API Structure

Before writing any code, ensure your script declares the correct API version and the three essential functions. This is
the foundational skeleton for any SAPP Lua script.

- **`api_version`** - Always declare this at the top of your script. The API version must match the version SAPP is
  using. You can check the current version with the `lua_api_v` command in your server console. If the major version
  differs, the script will not load.

- **Required Functions** - Your script must include `OnScriptLoad()`, `OnScriptUnload()`, and optionally `OnError()`.
    - `OnScriptLoad()`: Initialize your script and register all event callbacks here.
    - `OnScriptUnload()`: Clean up tasks (reset server states, unregister callbacks).
    - `OnError(Message)`: Highly recommended for debugging. Use `print(debug.traceback())` inside to get stack traces
      when errors occur.

**Example Skeleton Code:**

```lua
api_version = "1.12.0.0" -- Always use the correct version

function OnScriptLoad()
    -- Initialization and callback registration happens here
    register_callback(cb['EVENT_SPAWN'], "OnPlayerSpawn")
    register_callback(cb['EVENT_DIE'], "OnPlayerDeath")
    register_callback(cb['EVENT_CHAT'], "OnChatMessage")
end

function OnScriptUnload()
    -- Cleanup code (optional but good practice)
end

function OnError(Message)
    -- Enhanced error logging
    print(debug.traceback())
end
```

> **Tip:** Always include `OnError` - without it, runtime errors can fail silently, making debugging a nightmare.

---

## Registering Event Callbacks Efficiently

Callbacks are how your script reacts to game events (spawning, dying, chatting, etc.). For performance, **only register
the callbacks you absolutely need**.

### Key Event Callbacks

| Callback                         | Trigger                                | Notes                                                                                                                               |
|----------------------------------|----------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| `cb['EVENT_SPAWN']`              | Player spawns                          |                                                                                                                                     |
| `cb['EVENT_DIE']`                | Player dies                            |                                                                                                                                     |
| `cb['EVENT_CHAT']`               | Chat message sent                      | Return `false` to block the message                                                                                                 |
| `cb['EVENT_COMMAND']`            | Player executes a command              | Create custom admin commands or block existing ones. Return `false` to block.                                                       |
| `cb['EVENT_OBJECT_SPAWN']`       | Object (weapon, vehicle, etc.) created | Can return a different MapID to change what spawns                                                                                  |
| `cb['EVENT_DAMAGE_APPLICATION']` | Damage applied                         | Modify damage amounts or block entirely. *Tip: To block fall damage without issues, use `return true, 0` instead of `return false`* |

**Example: Custom Command Handling**

```lua
function OnCommand(PlayerIndex, Command, Environment, Password)
    -- Check if a player is trying to use a command without permission
    if Command == "some_command" then
        say(PlayerIndex, "You are not authorized to use that command!")
        return false -- Block the command from executing
    end
    return true -- Allow the command to proceed
end
```

---

## Leveraging SAPP's Built-In Functions

SAPP provides powerful built-in functions to interact with the game and server. Using these is key to writing effective
scripts.

- **`execute_command("command_string")`** - Execute any server command (kick players, change maps, adjust settings).
- **`say(PlayerIndex, "message")` & `say_all("message")`** - Send chat messages to a specific player or everyone.
- **`get_var(PlayerIndex, "$variable")`** - Fetch SAPP variable values like `"$hp"` (health) or `"$warnings"`. Use `0`
  instead of PlayerIndex to get a server variable.
- **`rand(min, max)`** - Cryptographically secure random number. Useful for random spawns or effects.

**Example: Random Teleport on Spawn**

```lua
function OnPlayerSpawn(PlayerIndex)
    local x = rand(-50, 50) -- Generate random coordinates
    local y = rand(-50, 50)
    local z = rand(10, 20)
    execute_command("teleport " .. PlayerIndex .. " " .. x .. " " .. y .. " " .. z)
    say(PlayerIndex, "You have been teleported to a random location!")
end
```

---

## Performance & Optimization Tips

### Localize Heavily Used Globals

Cache frequently used globals into locals at the top of your script or function (e.g.,
`local table_insert = table.insert`). Local variable access is faster than global table lookups - a small win that helps
in hot code paths.

### Be GC-Aware - Control Collection During Quiet Moments

Lua's garbage collector can cause small pauses. If you must, use `collectgarbage()` tactically (e.g., during round end
or idle). Use this sparingly and measure first.

### Minimize Garbage - Reuse Tables / Object Pools

Creating many small temporary tables each tick increases GC churn and can cause frame hitches. Reuse tables with a
simple pool.

**Simple pool pattern:**

```lua
local pool = {}

local function newtable()
  return table.remove(pool) or {}
end

local function freetable(t)
  for k in pairs(t) do t[k] = nil end
  pool[#pool+1] = t
end
```

### Avoid Heavy Work Inside Callbacks - Batch & Defer

If an event fires often (weapon pickups, damage), do the minimum in the callback, then push work to a timer or queue
processed at a lower frequency (e.g., every 200ms).

**Pattern:**

- Callback pushes a light record into a table.
- Timer every 200ms drains the table and does heavier processing.

### Use `timer(ms, callback, ...)` for Delayed/Repeating Work

SAPP provides `timer()` so you can schedule work after X milliseconds. If the callback returns `true`, it repeats.

**Example (run once after 5s):**

```lua
function OnPlayerJoin(PlayerIndex)
  timer(5000, "PostJoinTask", PlayerIndex)
end

function PostJoinTask(PlayerIndex)
  -- returns nothing -> runs once
  say_all("5s passed for "..PlayerIndex)
end
```

This avoids per-tick loops.

### Optimize Math Operations

When you pass arguments via `execute_command("lua_call ...")`, SAPP passes them as strings. Convert once and cache (
e.g., `tonumber(arg)` at entry) instead of repeatedly parsing.

### Use Provided API Helpers (Player Checks, Indices)

SAPP exposes convenience functions like `player_present()`, `player_alive()`, and `to_player_index()`. Use them instead
of custom checks to avoid edge-case bugs with slot indices and spectators.

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
initial_wu_s = <read_from_projectile_tag> 

-- distance travelled in one tick
wu_per_tick = initial_wu_s * TICK_SEC
m_per_tick  = wu_per_tick * WU_TO_M
```

**Practical notes for CE server operators**

- Always read projectile initial velocities from the CE tag files used by your server build rather than copying values
  from MCC or community posts. HEK tag values are authoritative for CE.
- Small differences across community builds, patches, or ports can change projectile timing. Test on the exact CE
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
local function assignWeapons(playerId)
    -- Delete the player's inventory first:
    execute_command('wdel ' .. playerId)

    -- Assign primary and secondary weapons immediately
    local primary_weapon = spawn_object('weap', WEAPONS[1], 0, 0, 0)
    local secondary_weapon = spawn_object('weap', WEAPONS[2], 0, 0, 0)
    
    assign_weapon(primary_weapon, playerId)
    assign_weapon(secondary_weapon, playerId)

    local tertiary_weapon = spawn_object('weap', WEAPONS[3], 0, 0, 0)
    local quaternary_weapon = spawn_object('weap', WEAPONS[4], 0, 0, 0)
    
    -- Assign tertiary and quaternary weapons with a delay
    timer(250, 'assign_weapon', tertiary_weapon, playerId)
    timer(500, 'assign_weapon', quaternary_weapon, playerId)
    
    -- Technical note: 
    -- SAPP's "assign_weapon" function will fail silently/safely if the player is dead.
end

function OnScriptLoad()
    register_callback(cb['EVENT_SPAWN'], 'OnSpawn')
end

-- Assign weapons when the player spawns:
function OnSpawn(playerId)
    assignWeapons(playerId)    
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
   After joining the server, admins must enter:  
   `login <password>`  
   in in-game chat to activate their privileges.

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

## SAPP's rand() Upper Bound

SAPP's built-in `rand()` excludes the maximum value. Fix: increment the upper bound by `1` to include it.

**Example Usage:**

```lua
local t = {'a', 'b', 'c'}
local i = rand(1, #t + 1)
print(t[i]) -- ensures 1 to #t
```

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

## Sources & Further Reading

- [Scripting - c20](https://c20.reclaimers.net/h1/scripting)
- [Halo in 60 FPS - Halo PC: Development - Open Carnage](https://opencarnage.net/index.php?%2Ftopic%2F6527-halo-in-60-fps)
- [Set up metric units in Blender - Halo CE - Open Carnage](https://opencarnage.net/index.php?%2Ftopic%2F8402-set-up-metric-units-in-blender)
- [Scale and unit conversions - c20](https://c20.reclaimers.net/general/scale)
- [weapon - c20](https://c20.reclaimers.net/h1/tags/object/item/weapon)
- [(HEK) Halo Editing Kit for Halo (CE) Custom Edition](https://www.halomaps.org/hce/detail.cfm?fid=411)
- [Halo CE: The Xbox Experience - Open Carnage](https://opencarnage.net/index.php?%2Ftopic%2F5784-halo-ce-the-xbox-experience)

---