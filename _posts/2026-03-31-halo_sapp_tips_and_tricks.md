---
layout: post
title: "Halo PC/CE: SAPP Tips & Tricks"
date: 31-03-2026
author: Jericho Crosby
categories: [ education, halo, modding ]
tags: [ sapp, lua, halo, scripting, tutorial ]
---

**Understanding the SAPP Lua API Structure**

Before writing any code, ensure your script declares the correct API version and the three essential functions. This is
the foundational skeleton for any SAPP Lua script.

* **`api_version`**: Always declare this at the top of your script. The API version must match the version SAPP is
  using. You can check the current version with the `lua_api_v` command in your server console. If the major version
  differs, the script won't load.
* **Required Functions**: Your script must include `OnScriptLoad()`, `OnScriptUnload()`, and optionally `OnError()`.

    * `OnScriptLoad()`: This is where you initialize your script and register all your event callbacks.
    * `OnScriptUnload()`: Use this for cleanup tasks, like resetting server states or unregistering callbacks.
    * `OnError(Message)`: Highly recommended for debugging. You can use `print(debug.traceback())` inside this function
      to get stack traces when errors occur.

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

---

## Registering Event Callbacks Efficiently

Callbacks are how your script reacts to events in the game (e.g., a player spawning, dying, or chatting). For
performance, **only register the callbacks you absolutely need**.

* **Key Event Callbacks**:

    * `cb['EVENT_SPAWN']`: Triggered when a player spawns.
    * `cb['EVENT_DIE']`: Triggered when a player dies.
    * `cb['EVENT_CHAT']`: Triggered when a chat message is sent. Returning `false` blocks the message.
    * `cb['EVENT_COMMAND']`: Triggered when a player executes a command. You can use this to create custom admin
      commands or block existing ones. Returning `false` blocks the command.
    * `cb['EVENT_OBJECT_SPAWN']`: Triggered when an object (weapon, vehicle, etc.) is created. You can even return a
      different MapID to change what object spawns.
    * `cb['EVENT_DAMAGE_APPLICATION']`: Triggered when damage is applied. This is incredibly powerful; you can modify
      damage amounts or block damage entirely. *Tip: To block fall damage without causing issues, use `return true, 0`
      instead of `return false`*.

**Example: Custom Command Handling**

```lua
function OnCommand(PlayerIndex, Command, Environment, Password)
    -- Check if a player is trying to use the server's 'kick' command without permission
    if Command == "some_command" then
        say(PlayerIndex, "You are not authorized to use that command!")
        return false -- Block the command from executing
    end
    return true -- Allow the command to proceed
end
```

---

## Leveraging SAPP's Built-In Functions

SAPP provides powerful built-in functions to interact with the game and server. Utilizing these is key to writing
effective scripts.

* **`execute_command("command_string")`**: This function allows your Lua script to execute any server command. You can
  use it to kick players, change maps, or adjust settings programmatically.
* **`say(PlayerIndex, "message")` and `say_all("message")`**: Use these to send chat messages to a specific player or
  all players, respectively. Great for sending alerts or instructions.
* **`get_var(PlayerIndex, "$variable")`**: This fetches the value of a SAPP variable (e.g., `"$hp"` for health,
  `"$warnings"` for warning count). Essential for checking player statuses. Pass `0` instead of PlayerIndex to get a
  server variable.
* **`rand(min, max)`**: Generates a cryptographically secure random number. Useful for adding randomness to events, like
  random weapon spawns or random player effects.

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

## Localizing Heavily Used Globals and Functions

Cache frequently used globals into locals at the top of the script or function (e.g.,
`local table_insert = table.insert`) - local variable access is faster than global table lookups. This is a small win
but helps in hot code paths.

---

## Managing Script Lifecycle and Errors

Properly managing how your script loads, unloads, and handles errors is crucial for server stability.

* **Load/Unload Commands**: Remember to use `lua_load <scriptname>` and `lua_unload <scriptname>` to activate or
  deactivate your scripts.
* **Error Handling**: The `OnError` function is your best friend for debugging. Without it, a runtime error in your
  script might cause it to fail silently, making problems very hard to trace. The `debug.traceback()` function provides
  a call stack, showing you exactly where the error occurred.

---

## Optimizing Math Operations

When you pass arguments via `execute_command("lua_call ...")`, SAPP passes them as strings. Convert once and cache (
e.g., `tonumber(arg)` at the entry) instead of repeatedly parsing.

---

## Using Provided API Helpers (Player Checks, Indices)

SAPP exposes convenience functions like `player_present()`, `player_alive()`, and `to_player_index()`. Use them instead
of custom checks to avoid edge-case bugs with slot indices and spectators.

---

## Be GC-Aware, Control Collection During Quiet Moments

**Lua's** GC can cause pauses. If you must, use `collectgarbage()` tactically (e.g., do a manual
`collectgarbage("step", N)` or full collect during round end/idle). Use this sparingly; measure first.

---

## Minimize Garbage - Reuse Tables / Object Pools

Create simple `newtable` / `freetable` helpers to avoid allocating lots of tiny temp tables each tick. Reusing tables
reduces GC churn and frame hitches.

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

Recycling tables is a common technique to reduce GC pressure.

---

## Avoid Heavy Work Inside Callbacks - Batch & Defer

If an event can fire often (weapon pickups, player damage), do the minimum in the callback, then push work to a timer or
queue processed at a lower frequency (e.g., every 200ms).

**Pattern:**

* Callback - push a light record into a table.
* Timer every 200ms - drain the table and do heavier processing.

---

## Use `timer(ms, callback, ...)` for Delayed/Repeating Work

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

---

## Security & Sanity Checks

* **Validate every client command**: check player index exists, check admin level for privileged commands, check numeric
  ranges and types. Don't `loadstring` arbitrary strings from clients.
* **Rate-limit resource-hungry actions** (spawns, custom commands). Per-player cooldown tables are simple and effective.
* **Anti-tampering**: assume a modified client will attempt odd commands; log suspicious behaviour server-side for
  review. SAPP offers anti-cheat utilities, use them.

---

## Networking, Tickrate & Hit Detection

* **Tickrate reality:** The classic Halo engine runs at ~**30 Hz** simulation/tick; this affects per-tick movement and
  projectile traversal (impacts interpolation/extrapolation decisions). Higher/lower tickrates change projectile
  behavior and timers, be conservative when using timing constants.
  See [hllmn](https://hllmn.net/blog/2023-09-18_h1x-net) for more information.

* **Per-tick math:** convert velocities to per-tick deltas: `per_tick = (WU_per_s / tickrate)`. That's how far a
  projectile moves each server tick. Use per-tick math for prediction and collision checks.

* **Latency compensation patterns:** timestamp inputs (client-side) and use server reconciliation if you simulate player
  movement for e.g., anti-cheat. For most server-side scripts you'll: record authoritative server states, apply client
  inputs when received (with reasonable bounds), and, when necessary, perform conservative validation (did the player
  have line-of-sight at that time?). See general netcode patterns (extrapolation/prediction/reconciliation).
  See [Wikipedia Netcode](https://en.wikipedia.org/wiki/Netcode) for more information.

* **Projectiles vs hitscan:** Understand weapon behavior (some weapons are effectively projectile-based with very high
  velocity; others are closer to hitscan). For CE, a common pistol projectile value is documented (community references
  give `300 WU/s` for pistol projectile speed). Use those tag values for accurate projectile travel math if you need
  exact behavior.

---

## Event Handling Patterns & Anti-Spam

* **Debounce & coalesce:** If event X can fire many times quickly (weapon fire, damage), push a small entry into a queue
  and process it on a short repeating timer (e.g., every 50-200ms).

* **Rate-limit player actions:** track timestamps per player for sensitive commands or calls (e.g., /spawngun). If
  `now - last_cmd < limit` reject silently or warn.

* **Priority queues:** for tasks of different criticality (e.g., immediate score updates vs. log writes), use separate
  queues to avoid blocking critical flows.

# Startup Hang Max Idle Fix

Add this line to your SAPP `init.txt` (the one in the SAPP folder):

```
max_idle 1
```

This prevents the default 60-second idle/mapcycle behavior that commonly shows up as a 60s "hang" on boot.

* **SAPP docs - `max_idle` behavior:** SAPP’s `max_idle` sets how many seconds of server idle before SAPP restarts the
  mapcycle. The default is 60 seconds. Changing it to `1` makes that restart happen almost immediately instead of
  waiting 60s.
* **Where to put it:** SAPP/ Halo servers can use two `init.txt` files (one opened by the dedicated server at start, and
  another loaded when SAPP starts). Putting `max_idle 1` in the SAPP `init.txt` is recommend to avoid the 60s delay when
  SAPP finishes loading.

### Short caveats & notes

* `max_idle` affects how SAPP handles *idle* servers (mapcycle restarts). Setting it to `1` avoids the perceived startup
  pause, but if you rely on idle mapcycle behavior for other reasons you may want to test the change first.
* Make sure you edit the correct `init.txt` (the SAPP one) - some installs have two `init.txt` files (server vs. SAPP).

# Timing & Movement

**Timing & Movement**

**Core tick rate**
Halo: Combat Evolved (PC / CE) simulates at **30 ticks per second**. Tick duration = **1 / 30 = 0.033333... s** (≈
33.333 ms). Simulation logic and many recorded animations run tick-for-tick at 30Hz on CE.

**World unit conversion**
**1 World Unit (WU) = 10 feet = 3.048 meters.** Waypoints shown in-game are expressed in meters, so multiply WU by *
*3.048** to get metres.

**How to compute distances per tick**
• Tick seconds = **1 / 30**.
• Distance per tick (WU) = `velocity_wu_per_s * (1 / 30)`.
• Distance per tick (m) = `velocity_wu_per_s * (1 / 30) * 3.048`.
Use these to compute first-tick travel and effective "hitscan" ranges for projectiles.

**Where to get projectile speeds (CE PC)**
Projectile speed values for CE are stored in the projectile tag (HEK / Custom Edition). Look up the projectile tag's
initial velocity field (the projectile tag's numeric initial velocity) using the HEK tools (Tool / Guerilla / Sapien or
tag inspectors from the CE toolchain).

**Why first-tick distance matters**
CE simulates motion on discrete ticks. A projectile with initial velocity `V` (WU/s) will travel `V / 30` WU in its
first tick. That first-tick travel often determines the range at which a projectile *feels* instant, so accurate
scripting or lead calculations should use the projectile's tag value and the 1/30 tick.

---

**Scripter quick formulas**

```
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
• Always read projectile initial velocities from the CE tag files used by your server build rather than copying values
from MCC or community posts. HEK tag values are authoritative for CE.
• Small differences across community builds, patches, or ports can change projectile timing or behavior. Test on the
exact CE executable and tagset your players use.
• If you want a short command to measure first-tick travel for a weapon, use the projectile tag initial velocity, divide
by 30, and convert to metres with `* 3.048`. That gives you the first-tick distance to use for lead / hitscan
approximations.

# Sources:

- [Scripting - c20](https://c20.reclaimers.net/h1/scripting)
- [Halo in 60 FPS - Halo PC: Development - Open Carnage](https://opencarnage.net/index.php?%2Ftopic%2F6527-halo-in-60-fps)
- [Set up metric units in Blender - Halo CE - Open Carnage](https://opencarnage.net/index.php?%2Ftopic%2F8402-set-up-metric-units-in-blender)
- [Scale and unit conversions - c20](https://c20.reclaimers.net/general/scale)
- [weapon - c20](https://c20.reclaimers.net/h1/tags/object/item/weapon)
- [(HEK) Halo Editing Kit for Halo (CE) Custom Edition](https://www.halomaps.org/hce/detail.cfm?fid=411)
- [Halo CE: The Xbox Experience - Open Carnage](https://opencarnage.net/index.php?%2Ftopic%2F5784-halo-ce-the-xbox-experience)

# Assigning 3 or more weapons

Delay **tertiary** and **quaternary** assignments by `≥250ms` to prevent them from dropping.

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

# Fixing vehicle physics glitch

Sometimes, directly writing a vehicle's position with `write_vector3d()` can cause glitchy physics. This method reduces,
but does not fully eliminate teleport glitches.

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

# Name Password Admin Setup

I generally **do not recommend adding users as hash-admins**, since many players are using pirated clients. Similarly,
because most players have **dynamic IP addresses**, assigning them as IP-admins is often impractical.

For these members, I advise using the **Name/Password system** instead.

### How to Set Up Name/Password Admins:

1. **Add the admin** using the command:
   `admin_add <player_name> <password> <level>`

* `<player_name>`: The exact in-game name the player uses to join the server.
* `<password>`: A password you set for them.
* `<level>`: Their admin level (1-4).
  **Example:**
  `admin_add Chalwk mySecurePassword123 3`

2. **Activating admin privileges**:
   After joining the server, your admins must enter:
   `login <password>`
   in the in-game chat to activate their privileges. The password used here is the one set in step 1.
   **Security Recommendations:**

* Assign a **unique password for each admin**. This ensures that if one password is compromised, it does not affect
  other users.
* Admins do **not need to log in every time**, unless the server is restarted or their IP address changes.

For users with **legitimate CD Keys**, the **hash-based system** remains the recommended method.

# Player Count Var Delay

During `EVENT_LEAVE`, `get_var(0, "$pn")` does not update immediately.
Subtract `1` manually to get the correct player count.

**Example Usage:**

```lua
function OnLeave()
    local n = tonumber(get_var(0, "$pn")) - 1
    print('Total Players: ' .. n)
end
```

# SAPP's rand() upper bound

SAPP's built-in `rand()` excludes the maximum value.
Fix: increment the upper bound by `1` to include it.

**Example Usage:**

```lua
local t = {'a', 'b', 'c'}
local i = rand(1, #t + 1)
print(t[i]) -- ensures 1 to #t
```

# 🎨 SAPP Console Color Tutorial (`cprint` / `set_ccolor`)

Understanding how to use colors in SAPP's console and messages can make your server logs, automated messages, and
scripts much more readable and organized. The system is based on the classic Windows console color attributes.

---

### **1. The Basics: The Color Number**

The color is defined by a single number. This number is calculated by combining a **Foreground** color and a *
*Background** color.

The formula is:
`Color Number = Foreground_Color + (Background_Color * 16)`

* The **Foreground** is the color of the text itself. Its value can be from **0 to 15**.
* The **Background** is the color behind the text. Its value can also be from **0 to 15**, but you must multiply it by
  16 before adding it to the foreground.

**Example:**

* You want **Green text (Foreground 10)** on a **Black background (Background 0)**.
    * Calculation: `10 + (0 * 16) = 10`
    * So, `cprint("Hello", 10)` prints green text.

* You want **Red text (Foreground 12)** on a **Light Aqua background (Background 11)**.
    * Calculation: `12 + (11 * 16) = 12 + 176 = 188`
    * So, `cprint("Warning!", 188)` prints red text on a light blue background.

---

### **2. The Color Code Table**

Here are all the possible values for the foreground and background. The "Value" is the number you use in the formula
above.

| Color Name       | Value | Example & Code                |
|------------------|:-----:|-------------------------------|
| **Black**        |   0   | `cprint("text", 0)`           |
| **Dark Blue**    |   1   | `cprint("text", 1)`           |
| **Dark Green**   |   2   | `cprint("text", 2)`           |
| **Dark Aqua**    |   3   | `cprint("text", 3)`           |
| **Dark Red**     |   4   | `cprint("text", 4)`           |
| **Dark Purple**  |   5   | `cprint("text", 5)`           |
| **Dark Yellow**  |   6   | `cprint("text", 6)`           |
| **Light Gray**   |   7   | `cprint("text", 7)` (Default) |
| **Gray**         |   8   | `cprint("text", 8)`           |
| **Blue**         |   9   | `cprint("text", 9)`           |
| **Green**        |  10   | `cprint("text", 10)`          |
| **Aqua**         |  11   | `cprint("text", 11)`          |
| **Red**          |  12   | `cprint("text", 12)`          |
| **Light Purple** |  13   | `cprint("text", 13)`          |
| **Yellow**       |  14   | `cprint("text", 14)`          |
| **White**        |  15   | `cprint("text", 15)`          |

*Note: The background colors use these same values, just multiplied by 16.*

---

### **3. How to Use It**

**A) In Lua Scripts with `cprint`**
The `cprint` function sends a colored message to the **server's console**. It's perfect for logging script events.

```lua
cprint("Script loaded successfully!", 10) -- Green success message
cprint("Player connected.", 14) -- Yellow connection message
cprint("ERROR: Invalid command!", 12 + (14*16)) -- Red text on Yellow background (Value: 236)
```

**B) With the `set_ccolor` Command**
This command changes the default color of the **entire server console** until it's changed again or the server restarts.
This is done from the console or RCON.

```
set_ccolor 11
```

The above command would set the entire console to **Aqua text on a Black background**.

---

### **4. Common Color Combinations & Tips**

* **Success:** Green (`10`)
* **Info / Notification:** Aqua (`11`) or Yellow (`14`)
* **Warning:** Yellow (`14`) on Black (`0`) -> `14`
* **Error / Alert:** Red (`12`)
* **Admin Message:** Light Purple (`13`)
* **Debug Data:** Gray (`8`)

**Pro Tip:** Avoid using high-intensity background colors (like White `15`) for large blocks of text, as it can be hard
to read. Use them sparingly for important warnings.

**Resetting:** If you change the console with `set_ccolor` and want to go back to the default (Light Gray on Black), use
`set_ccolor 7`.

# SAPP's "DoS" Protection: Explained

Let's be precise: SAPP offers **DoS (Denial-of-Service)** protection, which is different from **DDoS (Distributed
Denial-of-Service)**. The key difference is one attacker vs. many.

### What SAPP Does Well (The Good):

SAPP is excellent at mitigating the most common nuisances and basic attacks that Halo servers face:

1. **Packet Flooding:** The `packet_limit` command (default: 1000 packets/second per IP) is very effective. It instantly
   kicks any single IP that exceeds this threshold. This will stop simple UDP floods from a single machine or a small
   botnet that isn't masking its IPs.
2. **Join Spamming:** The `antihalofp` feature is crucial. It automatically IP bans players who attempt to join too
   frequently in a short time. This completely neutralizes tools like "Halo Flood Prevent" which spam join requests to
   crash the server.
3. **RCON Brute-Force Protection:** After 4 failed RCON password attempts, the offending IP is banned for **one hour**.
   This makes guessing the password via automation practically impossible.
4. **Resource Management:** Its core fixes, reducing CPU usage and fixing memory leaks, make the server more resilient
   overall, helping it handle higher loads without crashing, which is a form of mitigation in itself.

### Where It Falls Short (The Limitations):

A true, large-scale **D**DoS attack will overwhelm SAPP's protections:

* **No Volume-Based Mitigation:** SAPP's `packet_limit` works per IP. A sophisticated DDoS uses thousands of unique IP
  addresses (a botnet). SAPP will see each one as a separate "player" sending a "normal" amount of traffic and won't
  block them. The server's network port still gets saturated, causing a crash or lag for everyone.
* **Application Layer vs. Network Layer:** SAPP's protection works at the **application layer** (it understands Halo's
  protocol). It can't filter traffic at the **network layer**. It can't tell the difference between a legitimate game
  packet and a malicious garbage packet designed to fill your bandwidth; it just sees incoming data.
* **On-Server Only:** All protection is handled by the Halo process on your server itself. If the attack traffic is
  large enough, it can saturate your server's network card *before* SAPP even gets a chance to process the packets and
  decide to block them.

### Summary

| For This...                                                          | SAPP is...                                                           |
|----------------------------------------------------------------------|----------------------------------------------------------------------|
| **✅ Script Kiddies** using public flooding tools                     | **Excellent.** It will stop them cold.                               |
| **✅ Join Spammers** trying to crash the server with fake players     | **Excellent.** `antihalofp` is built for this.                       |
| **✅ RCON Brute-Forcers** trying to guess your password               | **Excellent.** The 4-strike rule is perfect.                         |
| **✅ Small, simple DoS attacks** from a single IP or a handful of IPs | **Very Good.** `packet_limit` handles this well.                     |
| **❌ Large-Scale DDoS** from a massive botnet (100s/1000s of IPs)     | **Not Sufficient.** It will not stop a saturated network connection. |

**Recommendations:**

1. **For most server hosts:** SAPP's protections are **enough**. They handle 99% of the "attacks" you'll ever see, which
   are usually just kids with basic tools.
2. **If you're a high-profile target:** (e.g., a popular scrim server, a tournament server), you **must** have
   additional protection:

* Use a game server provider that offers **DDoS mitigation** at the network level.
* Look into **proxy services** like Cloudflare (though setting this up for game traffic is complex and not supported
  by most standard proxies).
* Ensure your **server host** has infrastructure to absorb and filter large-scale attacks.

**In short: SAPP's protection is far from rudimentary, it's expertly tailored for the specific threats a Halo server
faces. However, it is not a magic shield against a determined, well-resourced attacker with a large botnet.** You should
enable all its features (`packet_limit`, `antihalofp`, etc.) and consider them your essential first line of defense.