---
title: "Halo: SAPP Anti-Aimbot"
permalink: /halo/sapp/anti-aimbot/
description: "A SAPP Lua script that flags suspicious aim using camera data and can kick or IP ban players when their score exceeds a configured limit."
date: 2026-11-19
last-updated: 2026-11-19
categories: [ education, halo, modding ]
tags: [ sapp, lua, scripting, reference, tutorial ]
---

A SAPP Lua script that scores suspicious aim and runs a kick or IP ban on players whose score passes a limit. It only looks at camera data: every tick it compares each living player's camera vector with the position of their enemies and awards points for camera movement that looks like an aimbot.

It is a heuristic, so it needs tuning for your server. Run it in logging-only mode first (see [Tuning](#tuning)) before you let it kick or ban anyone.

The script is independent of SAPP's built-in aimbot detection. It does not use `aimbot_ban`, `$botscore` or `EVENT_SNAP`.

---

## Requirements

- SAPP 10.2.1
- Stock weapons only (default). See [Custom Maps and Weapons](#custom-maps-and-weapons).

---

## Installation

1. [Download anti_aimbot.lua](https://github.com/Chalwk/SPCLib/blob/main/sapp/admin/anti_aimbot.lua) and enable the usual way.
2. Edit the `CFG` table at the top of the script. Run `reload` to apply changes.

---

## How It Works

Every tick, for each living player (the shooter), the script does the following in order:

1. Applies score decay.
2. Updates the shooter's accuracy from shots fired this life.
3. Measures how far the camera moved since the previous tick.
4. Builds the aim cone for this tick (see [Aim Cone](#aim-cone)).
5. Walks the enemy list in player index order and stops at the first enemy inside the cone. Only that one enemy is evaluated per tick.
6. Scores the event if it qualifies as a snap or tracking (see [Scoring](#scoring)).
7. Runs enforcement if the score is over `CFG.AUTO_AIM.MAX_SCORE`.

Nothing is scored unless the camera moved. A player holding the crosshair still on an enemy scores zero, however long they do it.

Per-player state is created on join and cleared on leave and at game end. Aim score, lock count and shot counts reset on death and after enforcement.

---

## Scoring

### Snaps

A snap is a camera change of more than `SNAP_DETECTION.BASELINE_DEGREES` (6.0) in a single tick that ends with the camera inside the aim cone of an enemy.

Points are the snap angle in degrees multiplied by a weight. The weight depends on whether a ray cast along the shooter's actual camera vector hits the target:

| Ray result | Weight (default)              |
| ---------- | ----------------------------- |
| Hit        | `SCORING.SNAP_ON_TARGET` (15) |
| Miss       | `SCORING.SNAP_OFF_TARGET` (5) |

The cone points roughly at the enemy. The ray is what decides whether a shot would land. With defaults, a 20 degree snap that ends on target is worth 300 points, so about ten of them in one life reach the 3000 limit.

### Tracking

Off by default (`SNAP_DETECTION.TRACKING_ENABLED = false`). When enabled, a camera change above 0 and below `MOVING_THRESHOLD_DEGREES` scores flat points while the shooter's horizontal speed is above `MOVING_SPEED`. The weights are the reverse of the snap weights: a miss scores more (10) than a hit (4).

Leave this off until you have tested it. Steady aim during a strafing duel looks a lot like tracking.

### Lock Distance

Each scoring event also adds `lock_count * distance * SCORING.LOCK_DISTANCE_WEIGHT`. The lock count goes up by one on every scoring tick and drops by 0.5 on every tick that does not score, with a floor of 0. This term is small for isolated snaps and grows when a player stays locked on a distant target.

The lock count is read before the current event is added to it. Distance is in world units.

### Multipliers

The event score (points plus the lock distance term) is multiplied by:

- `ENVIRONMENTAL.OBSCURED_MULTIPLIER` (0.3) when a ray from the shooter's eye to the target's eye hits something other than the target first, whether that is map geometry or another object.
- `CAMO.SCORE_MULTIPLIER` (2.0) when the target has active camo.

Both can apply to the same event.

### Pattern Detection

A new lock is the first scoring tick after a tick that did not score, so a sustained lock counts as one event. The script keeps the timestamps of the last `MAX_PATTERN_LENGTH` new locks. Once it has `MIN_LOCKS`, it takes the standard deviation of the gaps between them. If that is under `MAX_STD_DEV` seconds, it adds `SCORE_BOOST` points and clears the list so the same pattern is not counted twice.

The boost is added after the multipliers and is not scaled by them. The limit applies to the standard deviation of the gaps. With the minimum of three locks there are only two gaps, and they can differ by up to about 0.1 seconds and still count as a pattern, so this is looser than it sounds.

### Decay

Every `DECAY.INTERVAL_SECONDS` (0.25), the script removes `DECAY.POINTS_PER_SECOND` (0.25) multiplied by the time since the last decay. That works out to 15 points a minute, so in practice the score is a running total for the current life. Raise it if you want older events to stop counting.

---

## Aim Cone

The cone is the maximum angle between the shooter's camera and the direction to the target for the target to count as aimed at. It is calculated each tick in this order:

1. Start from the player's dynamic threshold, which begins at `AUTO_AIM.ANGLE_THRESHOLD_DEGREES` (2.5).
2. Multiply by `VELOCITY_ADJUSTED.ANGLE_MODIFIER` (0.8) if the shooter's horizontal speed is above `SPEED_THRESHOLD` (1.5 m/s).
3. Multiply by the held weapon's entry in `WEAPON_MODIFIERS`, or `DEFAULT` if it is not listed or the player is unarmed.
4. Raise to `AUTO_AIM.MIN_ANGLE_THRESHOLD_DEGREES` (0.2) if the result is lower.

For example, a moving player with a sniper rifle at 50 percent accuracy gets 2.5 x 0.8 x 0.65 = 1.3 degrees. A stationary player with an assault rifle gets 3.0 degrees.

The aim point is the target's eye position, led by the target's velocity. The lead time is the distance in meters divided by `PLAYER.PROJECTILE_SPEED`, capped at `PLAYER.MAX_LEAD_SECONDS`. Seated players use their vehicle's position and velocity, and rays are checked against the vehicle instead of the biped.

### Accuracy Adjustment

The dynamic threshold changes with the shooter's hit rate. Shots are counted from magazine drops, or from a heat increase for weapons listed in `ENERGY_WEAPONS`. Reloads and pickups raise the magazine count, so they are ignored. On each shot, one ray is cast along the camera vector and the shot counts as a hit if it lands on any enemy. The current accuracy (hits over shots this life) is added to a history of the last `ACCURACY.HISTORY_SIZE` samples and the average is used.

Higher accuracy widens the cone. That is intentional: a wider cone lets more events qualify for scoring, so accurate players are scrutinised more. With the default settings the multiplier works out to 0.5 plus the average accuracy, clamped to 0.8 and 1.2, so it stops changing below 30 percent and above 70 percent.

The accuracy history and dynamic threshold carry over between lives. The shot counts do not.

---

## Configuration

The table lists the settings you are most likely to change. Every field in `CFG` has a comment in the script.

| Setting                            | Default | Notes                                                      |
| ---------------------------------- | ------- | ---------------------------------------------------------- |
| `AUTO_AIM.MAX_SCORE`               | `3000`  | Score that triggers enforcement. Raise to be more lenient. |
| `AUTO_AIM.ANGLE_THRESHOLD_DEGREES` | `2.5`   | Base cone. Lower it to narrow the cone.                    |
| `SNAP_DETECTION.BASELINE_DEGREES`  | `6.0`   | Smallest single-tick camera change that counts as a snap.  |
| `SNAP_DETECTION.TRACKING_ENABLED`  | `false` | See [Tracking](#tracking).                                 |
| `DECAY.POINTS_PER_SECOND`          | `0.25`  | See [Decay](#decay).                                       |
| `ENFORCEMENT.COMMAND`              | `"k"`   | `"k"`, `"ipban"` or `"NONE"`.                              |
| `ENFORCEMENT.IPBAN_TIME_MINUTES`   | `60`    | Only used by `ipban`. `0` is indefinite.                   |
| `PATTERN_DETECTION.SCORE_BOOST`    | `150`   | Points added when a timing pattern is found.               |

Units are mixed, so check each field's comment. Distances (`TRACE_DISTANCE`, lock distance) are in world units. Speeds (`MOVING_SPEED`, `SPEED_THRESHOLD`, `PROJECTILE_SPEED`) are in meters per second. One world unit is 3.048 meters.

---

## Enforcement

When a shooter's score is over `MAX_SCORE`, the script prints an alert to the server console in red and then runs the command:

| `COMMAND` | Command that runs                                        |
| --------- | -------------------------------------------------------- |
| `"k"`     | `k <id> "<PLAYER_KICK_REASON>"`                          |
| `"ipban"` | `ipban <id> <IPBAN_TIME_MINUTES> "<PLAYER_KICK_REASON>"` |
| `"NONE"`  | Nothing. The alert is still printed.                     |

The alert goes to the server console only. It is not sent to in-game admins. `MESSAGES.ADMIN_ALERT` is a `string.format` template and receives the player name, player index, score and command, in that order, so it needs a `%s`, `%d`, a number format and a `%s` in that order.

After enforcement the player's score resets, so with `"NONE"` the same player can trigger another alert once they pass the limit again.

Other points:

- A kick does not stop the player rejoining, and their state starts fresh when they do.
- An IP ban affects everyone behind that address.
- There is no admin exemption (yet).
- The command string is not validated. Any value other than `"ipban"` or `"NONE"` is run as `<command> <id> "<reason>"`.

---

## Tuning

The script only prints when a player passes `MAX_SCORE`, so there is no per-event output to watch. To see how your normal players score:

1. Set `ENFORCEMENT.COMMAND = "NONE"`.
2. Lower `AUTO_AIM.MAX_SCORE` well below the real value for a test period.
3. Watch how often the alert fires for players you trust. If legitimate players trip it, raise the limit or narrow the cone. If a known cheater never trips it, do the opposite.
4. Restore the real limit and switch to `"k"` before moving to `"ipban"`.

Fast flicks to an enemy are normal play, which is why the default limit needs several large on-target snaps in one life.

---

## Custom Maps and Weapons

`WEAPON_MODIFIERS` and `ENERGY_WEAPONS` are keyed by tag path with escaped backslashes (`"weapons\\pistol\\pistol"`). For a custom weapon:

- Add it to `WEAPON_MODIFIERS`, or it uses `DEFAULT`.
- If it runs on heat instead of a magazine, add it to `ENERGY_WEAPONS` as well. Otherwise the script reads its magazine count and shots will not be counted correctly, which skews the accuracy adjustment.

Weapon names are cached by tag index and the cache is cleared at game start.

For custom maps, use a map-inspection tool to find the weapon tag paths. See the [modding references](../modding-references.md) for tools; [Lethargy](https://opencarnage.net/index.php?/topic/3769-lethargy/) is one option.

---

## Developer Notes

This section is for anyone editing or porting the script. None of it is needed to install or configure it.

### Callbacks and Lifecycle

The script registers `EVENT_TICK`, `EVENT_JOIN`, `EVENT_DIE`, `EVENT_LEAVE`, `EVENT_GAME_START` and `EVENT_GAME_END`. `OnScriptLoad` also calls `OnStart` directly so the script works when it is loaded mid-game. `OnStart` returns early when `$gt` is `n/a`, since no game is running. Otherwise it reads `$ffa` into `is_ffa`, empties the weapon name cache and creates state for every player present.

`players` and `camera_vectors` are indexed by player id.

`OnEnd` clears `players`, but players are still alive for a moment after the game ends. That is why `processPlayerAim` starts with a nil check on the state and returns when there is none.

### Time Base

`now()` returns `tick_count / 30`, and `tick_count` is incremented once per `OnTick`. This is used instead of `os.clock()` so decay and pattern timing follow the server tick rate and not the wall clock. If the server runs at a different tick rate, a script second is still 30 ticks and no longer matches a real second.

### Memory Used

All offsets are listed in the [Common Reference](../common-reference.md#memory-offsets). This table shows what the script reads from each structure.

| Structure      | Offset              | Field                                      | Used by                                 |
| -------------- | ------------------- | ------------------------------------------ | --------------------------------------- |
| Dynamic player | `0x118`             | Current weapon object ID                   | `getWeaponObject`                       |
| Dynamic player | `0x11C`             | Vehicle object ID (`0xFFFFFFFF` = on foot) | `getBaseObject`, `getCollisionObjectId` |
| Dynamic player | `0x230/0x234/0x238` | Aim vector                                 | `getCamera`                             |
| Dynamic player | `0x50C`             | Crouch scale                               | `getPlayerPosition`                     |
| Base object    | `0x5C`              | World position X, Y, Z                     | `getPlayerPosition`                     |
| Base object    | `0x68`              | Velocity X, Y, Z (world units per tick)    | `getVelocity`                           |
| Static player  | `0x34`              | Biped object ID                            | `getCollisionObjectId`                  |
| Static player  | `0x68`              | Camo timer (above 0 = camouflaged)         | `isPlayerCamouflaged`                   |
| Weapon object  | `0x0`               | Tag ID (low word is the tag index)         | `getWeaponName`                         |
| Weapon object  | `0x240`             | Overheat                                   | `updateAccuracy` (energy weapons)       |
| Weapon object  | `0x2B8`             | Rounds in magazine                         | `updateAccuracy` (everything else)      |
| Tag entry      | `0x10`              | Pointer to tag name                        | `getWeaponName`                         |

The tag table base is `0x40440000` on both PC and CE. Read the array pointer from the base, then each entry is `0x20` bytes.

Position and velocity come from the vehicle object when the player is seated. The aim vector, crouch scale and weapon always come from the biped. Eye height is `z + 0.65 - 0.3 * crouch` for both shooter and target, (see [Get Player Position](sapp-guide.md#get-player-position)) in the SAPP Guide. Horizontal speed uses X and Y of the velocity only, multiplied by `30 * 3.048` to convert world units per tick to meters per second.

### Camera Change Measurement

`calculateOrientationChange` runs every tick for every living player, whether or not an enemy is nearby, so the baseline never goes stale.

- The aim vector is normalized and the dot product with last tick's vector is clamped to the range -1 to 1 before `acos`.
- A dot product within `1e-10` of 1 is treated as no movement. Identical vectors can land slightly under 1 from rounding, and `acos` would turn that into a small false angle.
- A zero or NaN vector (see `getCamera`) drops the stored baseline instead of being compared. Otherwise the next valid read would look like a 90 degree snap.
- The first tick after a baseline is created returns 0. The baseline is dropped on spawn, death, join, game start and bad reads, so a respawn is never scored as a snap.
- The stored vector is updated in place to avoid allocating a table every tick.

### Cone Check

`checkAimAtTarget` builds a predicted aim point and compares the camera against it:

1. Get the shooter and target eye positions and the distance between them (world units).
2. Lead time is `min(distance * 3.048 / PROJECTILE_SPEED, MAX_LEAD_SECONDS)`. The distance is converted to meters because the projectile speed is in meters per second.
3. The predicted point is the target position plus its velocity times the lead time in ticks.
4. The cone test is the angle between the camera and the direction to that point, compared against the threshold.

On success it returns the distance to the predicted point, not the current distance, and that is the value used in the lock distance term. It returns nil if either position is unavailable or the predicted distance is under 0.001.

### Raycasts

All rays use `intersect`, which takes a direction vector that is already scaled to the reach.

- The aim ray (`castAimRay`) scales the normalized camera vector by `PLAYER.TRACE_DISTANCE` (250 world units). A target further away than that cannot register as a hit.
- The visibility ray goes from the shooter's eye to the target's eye. The vector is not normalized, so the ray ends at the target.
- Both rays ignore the shooter's own collision object, which is the vehicle when seated and the biped otherwise.
- A hit counts for a target only when the returned object ID equals that target's collision object. Map geometry returns `0xFFFFFFFF`, so it reads as a miss for the aim ray and as obscured for the visibility ray.
- Because of that last point, the visibility ray also reads as obscured when another player or a vehicle is between the two.

Rays are only cast when needed: one aim ray per qualifying scoring event, one visibility ray per scoring event when `ENVIRONMENTAL.ENABLED` is true, and one aim ray per detected shot. Ticks with no snap and no shot cast nothing.

### Scoring Pipeline

For a qualifying event, `evaluateAim` computes:

```text
event = points + lock_count * distance * LOCK_DISTANCE_WEIGHT
event = event * OBSCURED_MULTIPLIER   (if enabled and not visible)
event = event * CAMO_SCORE_MULTIPLIER (if enabled and target camouflaged)
aim_score = aim_score + event
```

`lock_count` is incremented after it is read for the formula. `was_scoring` is read before it is updated for this tick, which is how `is_new_lock` is determined, and it is set from the return value at the end of `processPlayerAim`.

An event only exists when the camera moved enough to count as a snap or tracking, so `was_scoring` is false on any tick where the crosshair is simply resting on a target. With tracking off (the default), a scoring tick needs a camera change above `BASELINE_DEGREES` in that tick. Two of those back to back are rare in real play, so `lock_count` seldom climbs above 1 or 2 and almost every snap counts as a new lock. In practice that means the lock distance term is only significant with tracking enabled, and pattern detection is looking at the spacing between individual snaps.

`checkPattern` appends the current time and trims the list to `MAX_PATTERN_LENGTH`. It then computes the population standard deviation of the gaps, so with exactly two gaps the deviation is half their difference. The boost goes straight onto `aim_score` and the list is replaced with an empty table.

Decay is applied in chunks. Once `INTERVAL_SECONDS` has passed, it subtracts `elapsed * POINTS_PER_SECOND` (floored at 0) and sets `last_decay_time` to now. The timestamp advances even when the score is already 0 so idle time is never banked.

### Shot Detection and Accuracy

`updateAccuracy` samples one number per tick from the held weapon: the heat float for weapons in `ENERGY_WEAPONS`, the magazine word for everything else.

- The first sample after a weapon change, or after being unarmed, only records the value. Weapon changes are detected by object ID, not tag, so picking up a second weapon of the same type also resets it.
- A magazine weapon fires `max(0, previous - current)` shots, so a tick that missed a few rounds counts them all and a reload (count goes up) counts none.
- An energy weapon counts one shot per tick at most, when heat has risen by more than `ACCURACY.HEAT_EPSILON`. That threshold is shared by all energy weapons. I plan on making this per weapon (stay tuned!).
- When shots are found, `checkShotHit` casts one aim ray and `shots_hit` is increased by the full shot count if it lands on any enemy. `updateDynamicThreshold` then runs once for that event.

Setting `DYNAMIC_THRESHOLD.ENABLED` to false only stops the threshold from changing. Shot counting and its ray cast still run, so it does not save any work.

### Per-Player State

`PlayerAimState` is created by `newState` on join and at game start. `resetLife` clears most of it on death and after enforcement.

| Field               | Reset on death or enforcement | Other resets                                   |
| ------------------- | ----------------------------- | ---------------------------------------------- |
| `aim_score`         | Yes                           | None                                           |
| `lock_count`        | Yes                           | Drops by 0.5 each tick without a scoring event |
| `last_decay_time`   | Yes                           | Updated each decay                             |
| `lock_pattern`      | Yes                           | Cleared when a pattern is found                |
| `was_scoring`       | Yes                           | Set every tick                                 |
| `shots_fired`       | Yes                           | None                                           |
| `shots_hit`         | Yes                           | None                                           |
| `last_fire_value`   | Yes                           | Weapon change or no weapon                     |
| `last_weapon_id`    | Yes                           | Weapon change or no weapon                     |
| `dynamic_threshold` | No                            | Only changes on a detected shot                |
| `accuracy_history`  | No                            | None                                           |

The last two carry over between lives within a game. A player who leaves and rejoins gets a fresh state, including accuracy history.

`camera_vectors` is a separate table. It is cleared on death, leave, game start, game end, a bad camera read, and whenever the dynamic player address is 0.

### Enforcement Command

`enforce` builds the command with `string.format` and passes it to `execute_command` with no player ID, so it runs with server permissions. The kick reason is wrapped in double quotes and not escaped, so a reason containing a double quote will break the command. `resetLife` runs straight after, even though the player may still be connected for another tick or two, which stops the alert repeating while the kick completes.

### Performance

- The cone check is the hot path. It runs every tick for every living shooter against every living enemy, so a full free-for-all server is up to 16 by 15 pairs per tick. It involves no raycasts and only a few reads, a square root and an `acos` per pair.
- `isEnemy` rejects absent, dead and same-team targets using `tick_teams` before any memory is read. `tick_teams` is filled in one pass at the start of each tick so `get_var` is called once per living player instead of once per pair.
- API functions and math functions are copied into file-scope locals at the top of the script.
- Weapon names are cached by tag index, since the tag table does not change during a map. The cache is emptied at game start.

### Limitations

- The script reads the aim vector and nothing else about player input. It cannot tell a player's own movement from a camera change caused by something else.
- Camera change is measured between two server ticks. A movement split across two ticks is smaller per tick than the movement itself and can fall under `BASELINE_DEGREES`.
- If two enemies are inside the cone at once, only the lowest player index is evaluated.
- Accuracy only counts hits on enemy players. Hits on other objects count as misses.
- It uses SAPP-only calls such as `read_vector3d`, `intersect` and `get_var`, so it does not run on Chimera or Phasor without changes.

---
