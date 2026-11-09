---
title: "SAPP Cheat Sheet"
date: 2026-11-09
last-updated: 2026-11-09
categories: [ education, halo, modding ]
tags: [ sapp, lua, scripting, server, tutorial ]
---

Lookup tables for SAPP (server) Lua scripting: memory addresses and offsets, pointers, signatures,
variables, commands, console colors, and unit conversions.

---

## Finding Offsets

A memory address is a location in the game's memory. An offset is added to a base address to reach a
specific field. For example, base `0x40440000` plus offset `0x28` gives `0x40440028`.

Dynamic addresses change between sessions. Find a stable base (module handle, pointer table) and
apply offsets to reach the data.

Tools used in the Halo PC/CE modding community:

| Tool             | Use                                                             |
|------------------|-----------------------------------------------------------------|
| Cheat Engine     | Real-time memory scanner and modifier.                          |
| IDA Pro          | Professional disassembler and debugger for the Halo executable. |
| Halo Map Tools 3 | Utility for finding and modifying offsets within map files.     |

### Practical Tips

Start with a known value (health, ammo, shield). Scan in Cheat Engine, change it in-game, scan
again, repeat until few candidates remain. Verify by writing the candidate address.

For stable pointers, right-click the working address and use "Pointer scan for this address".
Restart the game and compare results to find a consistent chain. Pointer scans can generate
thousands of results; reload a few times to filter.

Document each discovered offset with its type and purpose.

### Further Reading

- [How To Find Offsets, Entity Addresses & Pointers](https://www.youtube.com/watch?v=YaFlh2pIKAg)
  walks through locating offsets using Cheat Engine.
- [Finding Offsets /w Cheat Engine - UnKnoWnCheaTs](https://www.unknowncheats.me/forum/general-programming-and-reversing/200702-finding-offsets-using-cheat-engine.html)
  is a written guide on using Cheat Engine for offset discovery.
- [Halo Map Tools - Bungie Forums](https://forums.bungie.org/halo/archive13.pl?read=390998)
  covers offset manipulation with Halo Map Tools 3.

---

## Hardcoded Pointers

Addresses below apply to both PC and CE. The `halo_type` global is defined by SAPP; the snippet
below probes when it is absent.

Use these pointers when no reliable signature exists
(see [Signature Reference](#signature-reference)). Addresses are hex and `-` means unavailable. Pick
PC or CE with `halo_type` (`"PC"` or `"CE"`):

```lua
local timelimit_address = halo_type == "PC" and 0x626630 or 0x5AA5B0
```

| Pointer Name                  | PC Address | CE Address | Description                                                                                                   |
|-------------------------------|------------|------------|---------------------------------------------------------------------------------------------------------------|
| `banlist_header`              | `0x641280` | `0x5C52A0` | Banlist structure header                                                                                      |
| `banlist_path_address`        | `0x69B950` | `0x61FB80` | Banlist file path                                                                                             |
| `broadcast_game_address`      | `0x5E4768` | `0x569EAC` | Broadcast type (PC/CE/Trial)                                                                                  |
| `broadcast_version_address`   | `0x5DF840` | `0x564B34` | Broadcast server version                                                                                      |
| `camera_base`                 | `0x69C2F8` | `0x62075C` | Per-player camera data base                                                                                   |
| `collideable_objects_pointer` | `0x744C34` | `0x6C69F4` | Collideable objects list pointer                                                                              |
| `color_patch`                 | `0x4828FE` | `0x45EB5E` | Byte patch (0xEB = patched, 0x74 = normal)                                                                    |
| `computer_name_address`       | `0x62CD40` | `0x5B0D20` | Server computer/domain name                                                                                   |
| `computer_specs_address`      | `0x662CE4` | `0x5E6E3C` | Server hardware info, CPU brand/speed                                                                         |
| `ctf_globals`                 | `0x639B78` | `0x5BDB98` | CTF global data                                                                                               |
| `ctf_msgs_patch`              | `0x481545` | `0x45DA95` | CTF announcement messages patch (0xEB = patched, 0x74 = normal)                                               |
| `devmode_patch1`              | `0x4A4DBF` | `0x47DF0C` | Byte patch (0xEB = patched, 0x74 = normal)                                                                    |
| `devmode_patch2`              | `0x4A4E7F` | `0x47DFBC` | Byte patch (0xEB = patched, 0x74 = normal)                                                                    |
| `flags_pointer`               | `0x6A590C` | `-`        | -                                                                                                             |
| `game_globals`                | `-`        | `0x61CFE0` | Global game data                                                                                              |
| `gametime_base`               | `0x671420` | `0x5F55BC` | Game time info header                                                                                         |
| `gametype_base`               | `0x671320` | `0x5F5478` | Current gametype settings. `+0x0` name (UTF-16LE), `+0x30` game type, `+0x34` team play, `+0x58` score limit. |
| `gametype_patch`              | `0x481F3C` | `0x45E50C` | Byte patch                                                                                                    |
| `hash_duplicate_patch`        | `0x59C516` | `0x5302E6` | Hash duplicate check patch. See note below.                                                                   |
| `hash_table_base`             | `0x6A2AE4` | `0x5AFB14` | CD key validation hash table base                                                                             |
| `hashcheck_patch`             | `0x59C280` | `0x530130` | CD key hash check patch (0xEB = patched, 0x74 = normal)                                                       |
| `init_file_address`           | `0x8EB38`  | `0x8EB26`  | -                                                                                                             |
| `koth_globals`                | `0x639BB0` | `0x5BDBD0` | King of the Hill global data                                                                                  |
| `machine_pointer`             | `0x745B80` | `0x6C7960` | Network machine info pointer                                                                                  |
| `map_header_base`             | `-`        | `-`        | Not available on dedi (the dedi does not cache the .map header).                                              |
| `map_name_address`            | `0x63BC58` | `0x5BFC78` | Map display name, UTF-16LE                                                                                    |
| `map_name_address2`           | `-`        | `-`        | Use `read_string(network_struct + 0x8C, 0x80)` instead                                                        |
| `map_pointer`                 | `0x63523C` | `0x5B925C` | Map data base pointer, resolves to `0x40440000`                                                               |
| `mapcycle_header`             | `0x614B4C` | `0x598A8C` | Mapcycle data header                                                                                          |
| `mapcycle_timeout`            | `0x614AC0` | `0x598A00` | Mapcycle intermission timer                                                                                   |
| `name_base`                   | `0x745D4A` | `0x6C7B6A` | -                                                                                                             |
| `network_server_globals`      | `0x69B934` | `0x61FB44` | Server network globals                                                                                        |
| `network_struct`              | `0x745B80` | `0x6C7960` | Main server/client network structure                                                                          |
| `obj_header_pointer`          | `0x744C18` | `0x6C69F0` | Object header pointer                                                                                         |
| `oddball_globals`             | `0x639E38` | `0x5BDE58` | Oddball global data                                                                                           |
| `player_globals`              | `-`        | `0x6E1478` | Player global data                                                                                            |
| `player_header_pointer`       | `0x75ECE4` | `0x6E1480` | Player header pointer                                                                                         |
| `profile_path_address`        | `0x635610` | `0x5B9630` | Profile directory path                                                                                        |
| `public_value_address`        | `0x6164C0` | `0x59A424` | -                                                                                                             |
| `race_globals`                | `0x639F80` | `0x5BDFA0` | Race global data. `+0x0` = course checkpoint mask; `+0x44 + real_idx*4` = per-player progress                 |
| `race_locs`                   | `0x670F20` | `0x5F5078` | Race checkpoint world coordinates. Not required for lap tracking                                              |
| `rcon_password_address`       | `0x69BA5C` | `0x61FC8C` | Current server RCON password                                                                                  |
| `server_password_address`     | `0x69B93C` | `0x61FB6C` | Current server password (`null` if unset)                                                                     |
| `server_path_address`         | `0x62C390` | `0x5B0670` | `haloded.exe` server path                                                                                     |
| `server_port_address`         | `0x625230` | `0x5A91A0` | Broadcast server port                                                                                         |
| `servername_patch`            | `0x517D6B` | `0x4CE0CD` | Server name patch (0x9090 = patched, 0x4B74 = normal)                                                         |
| `slayer_globals`              | `0x63A0E8` | `0x5BE108` | Slayer global data (base for the score array; see note below)                                                 |
| `sockaddr_pointer`            | `0x6A1F08` | `0x626388` | -                                                                                                             |
| `special_chars_patch`         | `0x517D6B` | `0x4CE0CD` | -                                                                                                             |
| `stats_globals`               | `0x639878` | `0x5BD898` | Player statistics data                                                                                        |
| `stats_header`                | `0x639720` | `0x5BD740` | Statistics header (decal locations, etc.)                                                                     |
| `timelimit_address`           | `0x626630` | `0x5AA5B0` | Game time limit (ticks)                                                                                       |
| `version_info_address`        | `0x5E02C0` | `0x5650B4` | Halo version info string                                                                                      |
| `versioncheck_patch`          | `0x5152E7` | `0x4CB587` | Version check patch (0xEB = patched, 0x7D = normal)                                                           |

Notes:

- `gametype_base + 0x0` is the gametype name as UTF-16LE. Use `readWideString`, not `read_string`.
  `+0x30` is game type (1=CTF 2=Slayer 3=Oddball 4=KOTH 5=Race), `+0x34` is team play, `+0x58` is
  score limit. There is no working PC sig for this pointer; use `0x671320`.

- `map_name_address` is UTF-16LE. Use `readWideString`. For the map filename, use
  `read_string(network_struct + 0x8C, 0x80)`. `map_name_address2` is not populated on the dedi.

- `map_pointer` resolves to `0x40440000` on both PC and CE. If you only need the tag table, use
  `0x40440000` directly (tag array at `0x40440028`, tag count at `0x4044000C`).

- `race_globals + 0x0` is the course checkpoint mask (popcount = checkpoints required).
  `race_globals + 0x44 + to_real_index(i) * 4` is the per-player progress mask (bit 0 = checkpoint
  1, bit 1 = checkpoint 2, etc.). `race_locs` is not required for lap timing.

- `ctf_globals + 0x0` is a pointer to the red flag spawn coords (vector3d). `+0x4` is a pointer to
  the blue flag spawn coords. Read with `read_vector3d(read_dword(ctf_globals + team * 4))`, where
  `team = 0` is red and `team = 1` is blue.

---

## Memory Offsets

SAPP player API indices run 1-16, and any memory array indexed 0-15 must be reached through
`to_real_index(i)`. `get_dynamic_player(i)` returns `0` when the player is dead, and
`get_object_memory(object_id)` returns `0` when the id is invalid, so test with `if not player then`
rather than comparing to `0`. Loop from `1` to `16`.

### Base Object

Fields shared by every object (players, weapons, vehicles). Get the address with
`get_object_memory(objectId)`.

| Offset           | Type  | Field                                                 |
|------------------|-------|-------------------------------------------------------|
| `0x0`            | dword | Tag ID (the low word is the index into the tag array) |
| `0x10`           | bits  | Flags (bit 0 = no collision, bit 5 = ignore physics)  |
| `0x5C/0x60/0x64` | float | World X / Y / Z                                       |
| `0x68/0x6C/0x70` | float | Velocity X / Y / Z (world units per tick)             |
| `0x74/0x78/0x7C` | float | Forward vector X / Y / Z                              |
| `0xB4`           | byte  | Object type                                           |

### Dynamic Player Object

`get_dynamic_player(i)` returns the live player object. It uses the Base Object fields above plus
the ones below. Check `dyn ~= 0` before reading; `0` means dead or invalid.

| Offset              | Type  | Field                                                      |
|---------------------|-------|------------------------------------------------------------|
| `0xE0`              | float | Health (0.0-1.0)                                           |
| `0xE4`              | float | Shields (0.0-1.0)                                          |
| `0x106`             | bits  | Dynamic player flags (bit 11 = no damage/invulnerable)     |
| `0x118`             | dword | Current weapon object ID                                   |
| `0x11C`             | dword | Vehicle object ID (`0xFFFFFFFF` = on foot)                 |
| `0x208`             | word  | Key/action input flags (bit 4 = flashlight)                |
| `0x230/0x234/0x238` | float | Aim vector X / Y / Z                                       |
| `0x2A3`             | byte  | Movement key input state                                   |
| `0x2A4`             | byte  | Reload key input state                                     |
| `0x2F0`             | word  | Vehicle seat index (0 = driver, 1 = passenger, 2 = gunner) |
| `0x2F2`             | byte  | Current weapon slot (0-3)                                  |
| `0x2F8-0x304`       | dword | Weapon slots 1-4 object IDs (`0x2F8 + (slot - 1) * 4`)     |
| `0x31E`             | byte  | Frag grenades                                              |
| `0x31F`             | byte  | Plasma grenades                                            |
| `0x37C`             | float | Invisibility (1.0 = invisible)                             |
| `0x47C`             | byte  | Weapon switch key input state                              |
| `0x47E`             | byte  | Grenade switch key input state                             |
| `0x480`             | word  | Zoom state (0 = unzoomed)                                  |
| `0x490`             | float | Primary trigger / shooting state                           |
| `0x50C`             | float | Crouch scale (0.0 = standing, 1.0 = crouched)              |

### Static Player Data

`get_player(i)` returns the persistent player structure.

| Offset            | Type    | Field                                                      |
|-------------------|---------|------------------------------------------------------------|
| `0x4`             | wchar[] | Name (UTF-16LE, low bytes readable as ASCII, max 12 chars) |
| `0x20`            | byte    | Team (0 = Red, 1 = Blue)                                   |
| `0x2C`            | dword   | Respawn timer (ticks)                                      |
| `0x34`            | dword   | Player unit / biped object ID                              |
| `0x60`            | byte    | Player FFA color index (0-17)                              |
| `0x68`            | word    | Active camouflage timer/state (> 0 = camouflaged)          |
| `0x6C`            | float   | Player speed multiplier (1.0 = normal)                     |
| `0x9C`            | word    | Kills                                                      |
| `0xA4`            | word    | Assists / secondary kills                                  |
| `0xAE`            | word    | Deaths                                                     |
| `0xC4`            | word    | King of the Hill hill time (ticks)                         |
| `0xC6`            | word    | Race score / laps                                          |
| `0xC8`            | word    | CTF score / flag returns                                   |
| `0xDC`            | dword   | Ping (ms)                                                  |
| `0xF8/0xFC/0x100` | float   | Alternate world X / Y / Z                                  |

### Weapon Object

Base Object fields plus the ones below.

| Offset  | Type  | Field                        |
|---------|-------|------------------------------|
| `0x240` | float | Overheat (0-1)               |
| `0x2B6` | word  | Reserve ammo                 |
| `0x2B8` | word  | Rounds in magazine           |
| `0x2C6` | word  | Secondary reserve ammo       |
| `0x2C8` | word  | Secondary rounds in magazine |

### Vehicle Object

Same lookup as weapons. Position and velocity use the Base Object offsets. A seated player's
position is the vehicle's position.

| Offset  | Type  | Field                                                      |
|---------|-------|------------------------------------------------------------|
| `0x324` | dword | Driver seat occupant unit object ID (`0xFFFFFFFF` = empty) |

[//]: # (Todo: Add missing Vehicle Object offsets)

### Tag Table

The tag table base is `0x40440000` on both PC and CE. Read the tag array pointer from the base and
the tag count from `base + 0xC`. Each tag entry is `0x20` bytes. You can reach the base directly
without `map_pointer`.

| Entry offset | Type  | Field                                                                           |
|--------------|-------|---------------------------------------------------------------------------------|
| `0x0`        | dword | Tag class (`weap` = `0x77656170`, `vehi` = `0x76656869`, `eqip` = `0x65716970`) |
| `0xC`        | dword | Meta ID                                                                         |
| `0x10`       | dword | Pointer to the tag name string                                                  |
| `0x14`       | dword | Pointer to the tag data                                                         |

Weapon tag data: bit 3 of `+0x308` is set for objective weapons (flag, oddball), and the byte at
`+0x2` tells them apart (`0` = flag, `4` = oddball). `hasObjective` and `getFlagData`
in [SAPP Utils](utils.md) rely on this.

Vehicle tag data (`vehi`): word at `+0x2F4` controls vehicle motion/physics type (`0` = ground,
`1` = flying banshee, `3` = flying vehicle).

---

## Signature Reference

Signatures below use `sig_scan`, which works on both PC and CE. Use the
[hardcoded pointers](#hardcoded-pointers) above as a fallback. `halo_type` is a
case-sensitive string (`"PC"` or `"CE"`) and is the correct way to pick a fallback when
`sig_scan` returns `0`.

| Pointer name                | Expression                                                                                       |
|-----------------------------|--------------------------------------------------------------------------------------------------|
| `banlist_header`            | `read_dword(sig_scan("A3??????00A1??????0033DB3BC3") + 1)`                                       |
| `banlist_path_address`      | `read_dword(sig_scan("68??????00E8??????0083C41068") + 0x1)`                                     |
| `banlist_path_address2`     | `read_dword(sig_scan("CCCCC605??????0000E8??????0085C0") + 0x4)`                                 |
| `broadcast_game_address`    | `read_dword(sig_scan("CCCCBA??????002BD08A08") + 0x3)`                                           |
| `broadcast_version_address` | `read_dword(sig_scan("751768??????0068??????00BA") + 0x3)`                                       |
| `color_patch1`              | `read_dword(sig_scan("741F8B482085C9750C"))`                                                     |
| `color_patch2`              | `read_dword(sig_scan("EB1F8B482085C9750C"))`                                                     |
| `computer_name_address`     | `read_dword(sig_scan("68??????0068??????0068000401006A00") + 0x1)`                               |
| `ctf_globals`               | `read_dword(sig_scan("8B3C85????????3BF9741FE8????????8B8E2C0200008B4610") + 3)`                 |
| `gameinfo_header`           | `read_dword(sig_scan("A1????????8B480C894D00") + 0x1)`                                           |
| `gametype_base`             | `read_dword(sig_scan("B9360000008BF3BF????????") + 0x8)` (CE only; see note below)               |
| `hardware_info_address`     | `read_dword(sig_scan("BE??????008BC68B4DF064890D000000005F5E5B8BE55DC36A0C") + 0x1)`             |
| `kill_message_address`      | `read_dword(sig_scan("8B42348A8C28D500000084C9") + 3)`                                           |
| `koth_globals`              | `read_dword(sig_scan("BF??????00F3ABB96B000000") + 0x1)`                                         |
| `logfile_path_address`      | `read_dword(sig_scan("740ABB????5C00E8????0300") + 0x3)` (CE only)                               |
| `map_name_address`          | `read_dword(sig_scan("66A3??????00890D??????00C3") + 0x2)`                                       |
| `map_name_address2`         | `read_dword(sig_scan("B8??????00E8??????0032C983F813") + 0x1)`                                   |
| `network_struct`            | `read_dword(sig_scan("F3ABA1????????BA????????C740??????????E8????????668B0D") + 3)`             |
| `nonslayer_score_patch`     | `sig_scan("8B??3883C404????74??57FFD0") + 0x8`                                                   |
| `object_header_pointer`     | `read_dword(sig_scan("8B0D????????8B513425FFFF00008D") + 2)`                                     |
| `oddball_globals`           | `read_dword(sig_scan("BF??????00F3ABB951000000") + 0x1)`                                         |
| `player_header_pointer`     | `read_dword(sig_scan("DDD8A1??????008944244835") + 0x3)`                                         |
| `profile_path_address`      | `read_dword(sig_scan("68??????008D54245468") + 0x1)`                                             |
| `race_globals`              | `read_dword(sig_scan("BF??????00F3ABB952000000") + 0x1)`                                         |
| `rcon_failed_address`       | `read_dword(sig_scan("B8????????E8??000000A1????????55") + 1)`                                   |
| `rcon_password_address`     | `read_dword(sig_scan("7740BA??????008D9B000000008A01") + 0x3)`                                   |
| `server_ip_argument`        | `read_dword(sig_scan("BA??????008BC72BD78A08880C024084C975F68B442404") + 0x1)`                   |
| `server_password_address`   | `read_dword(sig_scan("F3ABA3??????00A3??????00A2??????00C705") + 0x3)`                           |
| `server_path_address`       | `read_dword(sig_scan("0000BE??????005657C605") + 0x3)`                                           |
| `server_port_address`       | `read_dword(sig_scan("668B0D??????000BF2C605") + 0x3)`                                           |
| `slayer_globals`            | `read_dword(sig_scan("5733C0B910000000BFE8E05B00F3ABB910000000") + 19)`                          |
| `slayer_score_patch`        | `sig_scan("74178B94242808000052518B8C24280800005157FFD083C4108B8424240800003BF8530F94C383FFFF")` |
| `stats_globals`             | `read_dword(sig_scan("33C0BF??????00F3AB881D") + 0x3)`                                           |
| `sv_map_reset_tick_address` | `read_dword(sig_scan("8B510C6A018915????????E8????????83C404") + 7)`                             |
| `tick_counter_sig`          | `sig_scan("8B2D????????807D0000C644240600")`                                                     |
| `tick_counter_address`      | `read_dword(read_dword(tick_counter_sig + 2)) + 0xC`                                             |
| `timelimit_address`         | `read_dword(sig_scan("8B0D????????83C8FF85C97E17") + 2)`                                         |

`tick_counter_address` is a two-step lookup: scan `tick_counter_sig`, read the pointer at `+ 2`,
dereference it, then add `0xC`. For pointers without a reliable signature (e.g. `map_pointer`),
use the PC/CE addresses under Hardcoded Pointers.

The `slayer_globals` signature embeds a CE address and its offset reads past the end of the
pattern. Use the hardcoded pointer values for it (see Hardcoded Pointers).

The `gametype_base` signature is CE only. Use the hardcoded PC value `0x671320`.

### Generating Signatures

| Tool         | Plugin / Method                      | Output                                                                                        |
|--------------|--------------------------------------|-----------------------------------------------------------------------------------------------|
| IDA Pro      | SigMaker (e.g., `IDA_SigMaker.dll`)  | Right-click on assembly, generate AOB signature, copy from output window.                     |
| Ghidra       | MakeSig script                       | Right-click a function, "Generate Signature", copy pattern.                                   |
| Cheat Engine | Array of bytes scan + Auto Assembler | Find the instruction in memory disassembler, use `aobscan` or generate AOB from context menu. |

A signature is a byte string with wildcards (`??`) where values vary. Example:
`"F3ABA1????????BA????????C740??????????E8????????668B0D"`.

### Verifying a Signature

1. Attach to the game process.
2. Open Memory View, Search, Array of bytes.
3. Paste the signature (with `??` for wildcards).
4. Confirm exactly one unique result. If none or many, adjust the pattern length or add more unique
   bytes.

---

## Variables

Read event variables with `get_var(player_id, "$name")`. Use player index `0` for global variables.

### Event Variables

Scope: G = global (use index `0`), P = per player.

| Variable       | Scope | Description                                                                                         |
|----------------|-------|-----------------------------------------------------------------------------------------------------|
| `$afk`         | P     | Seconds the player has been AFK                                                                     |
| `$app`         | P     | Bitfield of client apps: 1 SAPP, 2 Anticheat, 4 HAC2, 8 RefleX                                      |
| `$assists`     | P     | Assist count                                                                                        |
| `$blues`       | G     | Players on blue team                                                                                |
| `$bluescore`   | G     | Blue team score                                                                                     |
| `$botscore`    | P     | Player's aimbot score                                                                               |
| `$campkills`   | P     | Kills made while camping                                                                            |
| `$combo`       | P     | Current kill combo (resets after 4 s without a kill)                                                |
| `$deaths`      | P     | Deaths this game                                                                                    |
| `$ffa`         | G     | `1` if FFA, `0` if teams                                                                            |
| `$gt`          | G     | Gametype: `ctf`, `slayer`, `king`, `race`, `oddball`; `n/a` when no game is running                 |
| `$hash`        | P     | CD-key hash                                                                                         |
| `$hp`          | P     | Health as a decimal                                                                                 |
| `$invis`       | P     | `1` if active camo                                                                                  |
| `$ip`          | P     | `IP:Port`                                                                                           |
| `$kills`       | P     | Kills this game                                                                                     |
| `$lvl`         | P     | Admin level                                                                                         |
| `$map`         | G     | Loaded map                                                                                          |
| `$mode`        | G     | Game variant name (e.g. `Team Slayer` or a custom name)                                             |
| `$n`           | P     | Player index                                                                                        |
| `$name`        | P     | Player name                                                                                         |
| `$oteam`       | P     | Name of the opposite team                                                                           |
| `$ping`        | P     | Ping (ms)                                                                                           |
| `$pn`          | G     | Players on server (stale during `EVENT_LEAVE`, see [Known SAPP Quirks](utils.md#known-sapp-quirks)) |
| `$rand`        | G     | Random number 1-16                                                                                  |
| `$reds`        | G     | Players on red team                                                                                 |
| `$redscore`    | G     | Red team score                                                                                      |
| `$running`     | G     | `1` if a game is running                                                                            |
| `$score`       | P     | Player score                                                                                        |
| `$sh`          | P     | Shield as a decimal                                                                                 |
| `$streak`      | P     | Kills since last respawn                                                                            |
| `$suicides`    | P     | Suicides this game                                                                                  |
| `$svname`      | G     | Server name                                                                                         |
| `$team`        | P     | `red` / `blue`                                                                                      |
| `$ticks`       | G     | Ticks since match start                                                                             |
| `$tk`          | P     | Team kills this game                                                                                |
| `$valid`       | P     | Whether the CD key is valid                                                                         |
| `$x` `$y` `$z` | P     | Player coordinates                                                                                  |

`get_var` returns strings. Wrap numeric reads in `tonumber()`.

---

## Timing and Units

- 1 tick = 1/30 s, about 33.333 ms
- 1 world unit (WU) = 10 ft = 3.048 m
- Velocity offsets are in WU per tick; scripts often quote speeds in WU per second

| From    | To              | Formula                    |
|---------|-----------------|----------------------------|
| WU/s    | WU/tick         | `speed / 30`               |
| WU/s    | m/s             | `speed * 3.048`            |
| WU/s    | km/h            | `speed * 3.048 * 3.6`      |
| WU/tick | km/h            | `speed * 30 * 3.048 * 3.6` |
| WU/s    | meters per tick | `(speed / 30) * 3.048`     |

Example: an object moving at 15 WU/s covers `15 / 30 = 0.5` WU per tick, which is
`0.5 * 3.048 = 1.524` m. See [Distance Helpers](utils.md#distance-helpers) for the code.

---

## Console Colors

`cprint` writes to the server console with classic Windows console color attributes.

`cprint(msg, color)` uses the classic Windows console color attributes.
`color_number = foreground + (background * 16)`

Both foreground and background take a value from 0 to 15. Examples: green text on black is
`10 + (0 * 16) = 10`, and red on light aqua is `12 + (11 * 16) = 188`.

| Value | Color       | Value | Color        |
|-------|-------------|-------|--------------|
| `0`   | Black       | `8`   | Gray         |
| `1`   | Dark Blue   | `9`   | Blue         |
| `2`   | Dark Green  | `10`  | Green        |
| `3`   | Dark Aqua   | `11`  | Aqua         |
| `4`   | Dark Red    | `12`  | Red          |
| `5`   | Dark Purple | `13`  | Light Purple |
| `6`   | Dark Yellow | `14`  | Yellow       |
| `7`   | Light Gray  | `15`  | White        |

```lua
cprint("Script loaded successfully!", 10)
cprint("Player connected.", 14)
cprint("ERROR: Invalid command!", 12 + (14 * 16))
```

Common picks:

| Use     | Color                        |
|---------|------------------------------|
| Success | Green (`10`)                 |
| Info    | Aqua (`11`) or yellow (`14`) |
| Warning | Yellow (`14`)                |
| Error   | Red (`12`)                   |
| Admin   | Light purple (`13`)          |
| Debug   | Gray (`8`)                   |

---

## Command Reference

Admin levels: `-1` = public, `0` = server, `1-4` = admins (4 highest). `setcmd` can re-level
commands. Player commands (`about`, `afk`, `info`, `login`, `stats`, etc.) cannot be renamed,
re-leveled, or run through `execute_command`.

`<player_expr>` accepts the expressions below. Stock Halo `sv_*` commands need a plain player index.

### Expressions

Player expressions (`<player_expr>`):

| Expression             | Matches                          |
|------------------------|----------------------------------|
| `1`-`16`               | Player index                     |
| `*`                    | Wildcard in names; alone = all   |
| `me`                   | The player executing the command |
| `rt` / `bt`            | All red / all blue team players  |
| `pl`                   | All non-admins                   |
| `admin`                | All admins                       |
| `rand`                 | A random player                  |
| `randred` / `randblue` | A random red / blue player       |

Number expressions (`<int_expr>`, `<decimal_expr>`). A `<decimal_expr>` is a float where `1.0` =
100% (1% = `0.01`).

| Expression      | Effect                                               |
|-----------------|------------------------------------------------------|
| `:<n>`          | Set exact value (required for negatives, e.g. `:-5`) |
| `+<n>` / `-<n>` | Add to / subtract from current value                 |
| `*<n>` / `/<n>` | Multiply / divide current value                      |
| `%<n>`          | Modulo of current value                              |

### Stock Halo Commands (Vanilla)

These are Halo's built-in server commands. SAPP enhances or overrides some.

| Command                    | Usage                                  | Description                                                         |
|----------------------------|----------------------------------------|---------------------------------------------------------------------|
| quit                       | `quit`                                 | Close the server application.                                       |
| sv_ban                     | `sv_ban <player> [length]`             | Ban a player (optional duration).                                   |
| sv_ban_penalty             | `sv_ban_penalty [1] [2] [3] [4]`       | Set ban lengths for TK penalties. Default: `5m, 1d, 10d, 0`.        |
| sv_banlist                 | `sv_banlist`                           | Display ban list.                                                   |
| sv_banlist_file            | `sv_banlist_file`                      | Locate ban list file.                                               |
| sv_end_game                | `sv_end_game`                          | End game without starting a new one.                                |
| sv_friendly_fire           | `sv_friendly_fire [0-3]`               | 0=default,1=off,2=shield only,3=on.                                 |
| sv_gamelist                | `sv_gamelist`                          | List game variants in `savegames` folder.                           |
| sv_kick                    | `sv_kick <player>`                     | Remove a player.                                                    |
| sv_log_echo_chat           | `sv_log_echo_chat [enabled]`           | Echo chat to non-SAPP log (CE only).                                |
| sv_log_enabled             | `sv_log_enabled [enabled]`             | Enable non-SAPP server log (CE only).                               |
| sv_log_file                | `sv_log_file [path]`                   | Set log file path (CE only). Default: `haloserver.log`.             |
| sv_log_note                | `sv_log_note [string]`                 | Write note to non-SAPP log (CE only).                               |
| sv_log_rotation_threshold  | `sv_log_rotation_threshold [KiB]`      | Set log rotation size (CE only). Default: `4096`.                   |
| sv_map                     | `sv_map <map> <game variant>`          | Change map and/or game variant.                                     |
| sv_map_next                | `sv_map_next`                          | End current game, load next.                                        |
| sv_map_reset               | `sv_map_reset`                         | Reset game (scores, kills, objects).                                |
| sv_mapcycle                | `sv_mapcycle`                          | Display non-SAPP map cycle.                                         |
| sv_mapcycle_add            | `sv_mapcycle_add <map> <game variant>` | Add entry to non-SAPP map cycle.                                    |
| sv_mapcycle_begin          | `sv_mapcycle_begin`                    | Start non-SAPP map cycle from beginning.                            |
| sv_mapcycle_del            | `sv_mapcycle_del <#>`                  | Remove entry from non-SAPP map cycle.                               |
| sv_mapcycle_timeout        | `sv_mapcycle_timeout [time]`           | Set time between games (seconds). Default: `10`.                    |
| sv_maplist                 | `sv_maplist`                           | Display all loaded maps.                                            |
| sv_maxplayers              | `sv_maxplayers [players]`              | Get/set max players (1-16). Default: `16`.                          |
| sv_motd                    | `sv_motd [motd.txt]`                   | Set path for server motd (CE only).                                 |
| sv_name                    | `sv_name [name]`                       | Get/set server name (max 63 chars). Default: `"Halo"`.              |
| sv_password                | `sv_password [password]`               | Get/set join password (max 8 chars).                                |
| sv_players                 | `sv_players`                           | List players with indices, team, ping, score, betrayals, TK timer.  |
| sv_public                  | `sv_public [public]`                   | Set server visibility to master server. Default: `true`.            |
| sv_rcon_password           | `sv_rcon_password [password]`          | Set cron password (max 8 chars).                                    |
| sv_single_flag_force_reset | `sv_single_flag_force_reset [enabled]` | Allow flag reset while held in single-flag games. Default: `false`. |
| sv_status                  | `sv_status`                            | Display current map, player count, max players.                     |
| sv_timelimit               | `sv_timelimit [minutes]`               | Set time limit (`0`=indefinite, `-1`=use variant).                  |
| sv_tk_ban                  | `sv_tk_ban [bans]`                     | Team kills required for ban. Default: `4`.                          |
| sv_tk_cooldown             | `sv_tk_cooldown [time]`                | Time before TK point lost (seconds). Default: `300`.                |
| sv_tk_grace                | `sv_tk_grace [time]`                   | Grace period between TK points (seconds). Default: `3`.             |
| sv_unban                   | `sv_unban <#>`                         | Unban a player and remove from ban list.                            |

### SAPP Loader Commands

| Command | Usage    | Description                                                      |
|---------|----------|------------------------------------------------------------------|
| load    | `load`   | Load SAPP (requires `strings.dll` enabled, `sapp.dll` present).  |
| reload  | `reload` | Reload SAPP configuration and scripts (faster than unload+load). |
| unload  | `unload` | Unload SAPP - reverts to stock. Console/cron only.               |

### Player Commands (Level -1 / 0)

Available to all players.

| Command   | Level | Usage                                | Description                                                                                     |
|-----------|-------|--------------------------------------|-------------------------------------------------------------------------------------------------|
| about     | -1    | `about`                              | Display current SAPP version.                                                                   |
| afk       | 0     | `afk`                                | Mark player as AFK - disables future respawns.                                                  |
| clead     | -1    | `clead [ping]`                       | Set player lead at a certain ping (requires `no_lead` enabled, `lead` disabled). Default: 0 ms. |
| info      | -1    | `info`                               | Show server name, player count, current map, scrim mode status.                                 |
| lead      | -1    | `lead [enabled]`                     | Toggle leading when no-lead mode is enabled. Default: `false`.                                  |
| list      | -1    | `list ['generic'/'player'/'custom']` | List commands available to the player.                                                          |
| login     | -1    | `login <password>`                   | Log into a V2 (name/password) admin account.                                                    |
| report    | -1    | `report [message]`                   | Send a report (requires anticheat).                                                             |
| stats     | 0     | `stats`                              | Show player's kills, deaths, and K/D ratio.                                                     |
| stfu      | 0     | `stfu`                               | Block messages from `say` and scripted rcon messages.                                           |
| sv_stats  | 0     | `sv_stats`                           | Display server statistics (queries, joins, commands, events, games, etc.).                      |
| unstfu    | 0     | `unstfu`                             | Disable `stfu`.                                                                                 |
| usage     | -1    | `usage <command>`                    | Show usage for a command.                                                                       |
| whatsnext | 0     | `whatsnext`                          | Show the next game in the mapcycle.                                                             |

### General Commands (Admin Moderation)

| Command       | Level | Usage                                          | Description                                                                                                                                                                  |
|---------------|-------|------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| afks          | 0     | `afks`                                         | List AFK players.                                                                                                                                                            |
| b             | 3     | `b <player_id> [reason] [time]`                | Hash-ban a player. Avoid using this command where possible: many players use cracked clients with shared CD keys, which can result in innocent players being banned as well. |
| balance_teams | 2     | `balance_teams`                                | Balance teams based on stats.                                                                                                                                                |
| bans          | 3     | `bans`                                         | Alias for `sv_banlist`.                                                                                                                                                      |
| beep          | 4     | `beep [Hz] [ms]`                               | Play a beep on the host machine.                                                                                                                                             |
| cpu           | 4     | `cpu`                                          | Display CPU load, memory usage, OS info.                                                                                                                                     |
| d             | 4     | `d <player_id>`                                | Show detailed player info (health, shield, coords, weapons, vehicle, etc.).                                                                                                  |
| files         | 4     | `files`                                        | Locate all SAPP `.txt` files.                                                                                                                                                |
| ipban         | 3     | `ipban <player_id> [time] [reason]`            | IP-ban a player (`0` or no time = indefinite).                                                                                                                               |
| ipbans        | 3     | `ipbans`                                       | List all IP bans with indices.                                                                                                                                               |
| iprangeban    | 3     | `iprangeban <name> <IP range> [reason] [time]` | Ban an IP range using CIDR (e.g., `192.168.1.0/24`).                                                                                                                         |
| ipunban       | 3     | `ipunban <index>`                              | Unban an IP by index.                                                                                                                                                        |
| inf           | 3     | `inf <player_id>`                              | Show player's CD-key hash, IP address, and index.                                                                                                                            |
| k             | 2     | `k <player_id> [reason]`                       | Kick a player and announce to server.                                                                                                                                        |
| kdr           | 0     | `kdr <player_id>`                              | Display player's kill/death ratio.                                                                                                                                           |
| log_note      | 4     | `log_note [message]`                           | Write a note to SAPP's log.                                                                                                                                                  |
| map           | 3     | `map <map> <gametype>`                         | Alias for `sv_map`.                                                                                                                                                          |
| maplist       | 3     | `maplist`                                      | List maps in three columns (like `sv_maplist`).                                                                                                                              |
| mute          | 2     | `mute <player_id> [time]`                      | IP-ban player from chat (no time = indefinite).                                                                                                                              |
| mutes         | 2     | `mutes`                                        | List active mutes.                                                                                                                                                           |
| unmute        | 2     | `unmute <index>`                               | Remove a mute.                                                                                                                                                               |
| pl            | 2     | `pl`                                           | Alias for `sv_players`.                                                                                                                                                      |
| skips         | 0     | `skips`                                        | List players who voted to skip the game.                                                                                                                                     |
| teamup        | 2     | `teamup`                                       | Group clan members together.                                                                                                                                                 |
| textban       | 2     | `textban <player_id> [time]`                   | CD-key ban from chat (no time = indefinite).                                                                                                                                 |
| textbans      | 2     | `textbans`                                     | List active textbans.                                                                                                                                                        |
| textunban     | 2     | `textunban <index>`                            | Remove a textban.                                                                                                                                                            |
| uptime        | 0     | `uptime`                                       | Show server and OS uptime.                                                                                                                                                   |

### Configuration Commands

Used to configure server behavior. Settings lost on reload unless placed in `init.txt`.

| Command               | Level | Usage                                            | Description                                                                         |
|-----------------------|-------|--------------------------------------------------|-------------------------------------------------------------------------------------|
| admin_prefix          | 4     | `admin_prefix <prefix>`                          | Prefix for admin messages via `say`. Default: `SAPP`.                               |
| adminadd_samelevel    | 4     | `adminadd_samelevel [0-2]`                       | Allow admins to add V1 admins: `0`=no, `1`=lower, `2`=lower/equal. Default: `0`.    |
| adminban              | 4     | `adminban [0-2]`                                 | Admin ban permissions: `0`=any, `1`=no higher, `2`=only lower. Default: `0`.        |
| admindel_samelevel    | 4     | `admindel_samelevel [0-2]`                       | Allow admins to delete V1 admins: `0`=no, `1`=lower, `2`=lower/equal. Default: `0`. |
| afk_kick              | 4     | `afk_kick [seconds]`                             | Auto-kick AFK players after given seconds (`0`=disabled).                           |
| aimbot_ban            | 4     | `aimbot_ban [length] [type]`                     | Auto kick/ban aimbotters. Type: `0`=CD hash,`1`=IP,`2`=both,`3`=kick. Default: `0`. |
| alias                 | 4     | `alias <player_id>`                              | Search for aliases in `aliases.txt`.                                                |
| anticamp              | 4     | `anticamp [time] [distance]`                     | Raise `event_camp` if player kills while camping. Disabled by default.              |
| anticaps              | 4     | `anticaps [enabled]`                             | Prevent excessive capital letters. Default: `false`.                                |
| anticheat             | 4     | `anticheat [enabled]`                            | Require anticheat client. Must be set in `init.txt`. Default: `false`.              |
| antiglitch            | 4     | `antiglitch [enabled]`                           | Kill players who leave map BSP. Default: `false`.                                   |
| antihalofp            | 4     | `antihalofp [enabled]`                           | IP ban (5 min) for too-frequent join attempts. Default: `false`.                    |
| antilagspawn          | 4     | `antilagspawn [enable]`                          | Prevent lag-spawning. Default: `false`.                                             |
| antispam              | 4     | `antispam [type]`                                | Auto mute spammers: `0`=disabled,`1`=CD-key,`2`=IP. Default: `0`.                   |
| antiwarp              | 4     | `antiwarp [warp_num]`                            | Raise `event_warp` after given warps. `0`=disabled.                                 |
| auto_update           | 4     | `auto_update [enabled]`                          | Auto-update SAPP when available. Default: `true`.                                   |
| network_thread        | 4     | `network_thread [enabled]`                       | Disable to stop SAPP server list, map download, anticheat. Default: `true`.         |
| block_tc              | 4     | `block_tc [enabled]`                             | Block team changing. Default: `false`.                                              |
| chat_console_echo     | 4     | `chat_console_echo [enabled]`                    | Output chat to console. Default: `false`.                                           |
| cmdstart1             | 4     | `cmdstart1 [character]`                          | Primary command prefix in chat. Default: `\`.                                       |
| cmdstart2             | 4     | `cmdstart2 [character]`                          | Secondary command prefix. Default: `/`.                                             |
| collect_aliases       | 4     | `collect_aliases [enabled] [valid CD keys only]` | Collect aliases into `alias.txt`. Default: `false`.                                 |
| console_input         | 4     | `console_input [enabled]`                        | Allow console to accept input. Default: `true`.                                     |
| custom_sleep          | 4     | `custom_sleep [ms]`                              | Modify Halo thread sleep per cycle (ms). Default: `8`.                              |
| disable_timer_offsets | 4     | `disable_timer_offsets [enabled]`                | Use fixed Xbox-style spawn timers. Default: `false`.                                |
| dns                   | 4     | `dns [url]`                                      | Master server address for broadcasting.                                             |
| full_ipban            | 4     | `full_ipban [enabled]`                           | Block all traffic from banned IPs (may reduce performance). Default: `false`.       |
| hide_admin            | 4     | `hide_admin [enabled]`                           | Hide admin names when using kick/ban commands. Default: `false`.                    |
| hill_timer            | 4     | `hill_timer [int_expr]`                          | Seconds hill changes in "Crazy King". Default: `60`.                                |
| log                   | 4     | `log [enabled]`                                  | Log events to file. Default: `false`.                                               |
| log_rotation          | 4     | `log rotation [kb]`                              | Max log size (kB) before archiving. Default: `4096`.                                |
| log_name              | 4     | `log_name [name]`                                | Log file name (`.log` appended). Default: `log`.                                    |
| lua                   | 4     | `lua [enabled]`                                  | Enable Lua scripting. Default: `false`.                                             |
| lua_api_v             | 4     | `lua_api_v`                                      | Display current Lua API version.                                                    |
| lua_call              | 4     | `lua_call <script> <function> [arguments...]`    | Call a function in a loaded Lua script.                                             |
| lua_load              | 4     | `lua_load <script>`                              | Load a Lua script and call `OnScriptLoad()`.                                        |
| lua_unload            | 4     | `lua_unload <script>`                            | Unload a Lua script and call `OnScriptUnload()`.                                    |
| map_skip              | 4     | `map_skip [%]`                                   | Enable skip command when % of players want skip. `0`=disabled.                      |
| mapvote               | 4     | `mapvote [enabled]`                              | Enable map voting at end of game. Default: `false`.                                 |
| max_idle              | 4     | `max_idle [time]`                                | Restart mapcycle if server idle for this many seconds. Default: `60`.               |
| max_votes             | 4     | `max_votes [count]`                              | Maximum displayed votes per round. Default: `5`.                                    |
| motd                  | 4     | `motd [string]`                                  | Set the server Message of the Day.                                                  |
| msg_prefix            | 4     | `msg_prefix <string>`                            | Prefix used in server messages. Default: `SAPP`.                                    |
| mtv                   | 4     | `mtv [enabled]`                                  | Enable multi-team vehicles (requires anticheat/HAC2). Default: `false`.             |
| no_lead               | 4     | `no_lead [enabled]`                              | Enable no-lead mode (ping compensation). Default: `false`.                          |
| packet_limit          | 4     | `packet_limit [amount]`                          | Max packets per second from an IP. Default: `1000`.                                 |
| ping_kick             | 4     | `ping_kick [ping]`                               | Kick players with ping exceeding this value (ms). `0`=disabled.                     |
| reload_gametypes      | 4     | `reload_gametypes`                               | Reload game variants from `savegames` folder.                                       |
| remote_console        | 4     | `remote_console [enabled]`                       | Enable remote console (TCP). Default: `false`.                                      |
| remote_console_list   | 4     | `remote_console_list`                            | List connected remote console clients.                                              |
| remote_console_port   | 4     | `remote_console_port [port]`                     | Set TCP port for remote console (requires restart).                                 |
| sapp_console          | 4     | `sapp_console [enabled]`                         | Suppress periodic `sv_status`; show join/leave/game start. Default: `false`.        |
| sapp_mapcycle         | 4     | `sapp_mapcycle [enabled]`                        | Enable SAPP's map cycle. Default: `false`.                                          |
| sapp_rcon             | 4     | `sapp_rcon [enabled]`                            | Require rcon users to be SAPP admins. Default: `false`.                             |
| save_scores           | 4     | `save_scores [enabled]`                          | Prevent score reset when player leaves. Default: `false`.                           |
| say_prefix            | 4     | `say_prefix [enabled]`                           | Enable `SERVER ` prefix on server messages (CE only). Default: `true`.              |
| scorelimit            | 4     | `scorelimit [int_expr]`                          | Get or edit current game's score limit.                                             |
| scrim_mode            | 4     | `scrim_mode [enabled]`                           | Disable naughty commands, Lua scripts, sightjacking. Default: `false`.              |
| set_ccolor            | 4     | `set_ccolor [value]`                             | Set console color (foreground + background x 16).                                   |
| setcmd                | 4     | `setcmd <command> <name/level>`                  | Change name or required admin level of a command.                                   |
| sj_level              | 4     | `sj_level [level]`                               | Minimum level to use HAC2 sightjacker. Default: `-1` (everyone).                    |
| spawn_protection      | 4     | `spawn_protection [time]`                        | Invulnerability time (seconds) upon spawn. `0`=disabled.                            |
| timelimit             | 4     | `timelimit [int_expr]`                           | Get or edit time limit on the fly (minutes).                                        |
| unlock_console_log    | 4     | `unlock_console_log <enabled>`                   | Make console more verbose (CE only). Default: `false`.                              |
| v                     | 4     | `v [version]`                                    | View or modify Halo version string.                                                 |
| zombies               | 4     | `zombies [team]`                                 | Enable zombies medals for HAC2: `0`=none,`1`=red,`2`=blue. Default: `0`.            |

### Map Cycle Commands

Manage SAPP's map cycle (stored in `mapcycle.txt`).

| Command        | Level | Usage                                                                   | Description                                   |
|----------------|-------|-------------------------------------------------------------------------|-----------------------------------------------|
| map_next       | 4     | `map_next`                                                              | Start the next game in the map cycle.         |
| map_prev       | 4     | `map_prev`                                                              | Start the previous game in the map cycle.     |
| map_spec       | 4     | `map_spec <index>`                                                      | Skip to a specific map cycle entry.           |
| mapcycle       | 0     | `mapcycle`                                                              | List all games in the map cycle with indices. |
| mapcycle_add   | 4     | `mapcycle_add <map> <game variant> [min players] [max players] [index]` | Add a map cycle entry.                        |
| mapcycle_begin | 4     | `mapcycle_begin`                                                        | Begin the map cycle from the start.           |
| mapcycle_del   | 4     | `mapcycle_del <index>`                                                  | Remove a map cycle entry.                     |
| sapp_mapcycle  | 4     | `sapp_mapcycle [enabled]`                                               | Enable SAPP's map cycle (see Configuration).  |

### Map Vote Commands

Manage map voting (stored in `mapvotes.txt`). Enabling map voting disables the map cycle.

| Command     | Level | Usage                                                                         | Description                                            |
|-------------|-------|-------------------------------------------------------------------------------|--------------------------------------------------------|
| mapvote     | 4     | `mapvote [enabled]`                                                           | Enable map voting at end of game.                      |
| mapvote_add | 4     | `mapvote_add <map> <game variant> <name> [min players] [max players] [index]` | Add a map vote entry.                                  |
| mapvote_del | 4     | `mapvote_del <index>`                                                         | Delete a map vote entry.                               |
| mapvotes    | 4     | `mapvotes`                                                                    | List map votes.                                        |
| max_votes   | 4     | `max_votes [count]`                                                           | Maximum votes displayed per round (see Configuration). |

### Event Management Commands

Events allow basic scripting without Lua. Defined in `events.txt`.

| Command   | Level        | Usage                           | Description                                             |
|-----------|--------------|---------------------------------|---------------------------------------------------------|
| cevent    | 4            | `cevent <name> [player number]` | Raise `event_custom`, set `$ename` and optional player. |
| events    | 4            | `events`                        | List all events and their indices.                      |
| eventsdel | 4            | `eventsdel <index>`             | Delete an event by index.                               |
| w8        | (event only) | `w8 <seconds>`                  | Delay the current event by seconds.                     |
| wait      | (event only) | `wait <milliseconds>`           | Delay the current event by milliseconds.                |

### Custom Commands

Create your own commands (stored in `commands.txt`). Format:  
`command_name #arg1 #arg2... 'command1;command2...' level`

| Command | Level | Usage                                                      | Description                  |
|---------|-------|------------------------------------------------------------|------------------------------|
| cmd_add | 4     | `cmd_add <command> [arguments] <command sequence> [level]` | Create a new custom command. |
| cmd_del | 4     | `cmd_del <command>`                                        | Remove a custom command.     |

### Admin Management Commands (`users.txt`)

#### CD-Key Based Admins

CD-key admins are stored in `users.txt` and authenticate using a player's Halo CD-key hash. If a
CD-key hash is cracked, anyone using that CD-key can automatically receive the assigned admin level
when joining the server.

To reduce abuse, you can optionally restrict CD-key admins to specific IP ranges. For example,
adding an IP range such as `192.168.1.100/24` limits admin access to players connecting from that
subnet.

You can validate whether a hash is cracked, use
the [Hash Checker tool](https://chalwk.github.io/SPCLib/tools/hash-checker).

| Command    | Level | Usage                                                 | Description                                                                                                                       |
|------------|-------|-------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| adminadd   | 0     | `adminadd <player_id> <level> [allowed IP ranges...]` | Add a CD-key based admin using the player's current CD-key hash. Optional IP ranges can restrict where the admin may log in from. |
| adminlevel | 0     | `adminlevel <index> <level>`                          | Set new level for a CD-key admin.                                                                                                 |
| admindel   | 0     | `admindel <index>`                                    | Remove a CD-key admin (requires `admindel_samelevel`).                                                                            |
| admins     | 4     | `admins`                                              | List CD-key based admins.                                                                                                         |

#### Name and Password Based Admins (`admins.txt`)

Name/password admins authenticate using their current in-game name and assigned password.
When using `admin_add`, the player's current username is saved to `admins.txt`.

| Command            | Level | Usage                                           | Description                                                                              |
|--------------------|-------|-------------------------------------------------|------------------------------------------------------------------------------------------|
| admin_add          | 4     | `admin_add <player_name> <password> <level>`    | Add name/password admin using the player's current in-game name (player must be online). |
| admin_add_manually | 4     | `admin_add_manually <name> <password> <level>`  | Add name/password admin without player being present.                                    |
| admin_change_pw    | 4     | `admin_change_pw <index> <password>`            | Change password of name/password admin.                                                  |
| admin_change_level | 4     | `admin_change_level <index> <level>`            | Change level of name/password admin.                                                     |
| admin_del          | 4     | `admin_del <index>`                             | Delete name/password admin.                                                              |
| admin_list         | 4     | `admin_list`                                    | List name/password admins.                                                               |
| change_password    | 0     | `change_password <old password> <new password>` | Change password of currently logged-in name/password admin.                              |
| login              | -1    | `login <password>`                              | Log into a name/password admin account using the assigned admin name.                    |

### Naughty Commands (Level 4)

Directly modify player attributes. Cannot be used when `scrim_mode` is enabled.

| Command              | Usage                                                        | Description                                                                     |
|----------------------|--------------------------------------------------------------|---------------------------------------------------------------------------------|
| ammo                 | `ammo <player_id> [int_expr] [weapon]`                       | Change unloaded ammo (`0`=current,`1`-`4`=weapon slots,`5`=all).                |
| area_add_cuboid      | `area_add_cuboid <name> <a_x> <a_y> <a_z> <b_x> <b_y> <b_z>` | Add a rectangular area.                                                         |
| area_add_sphere      | `area_add_sphere <name> <x> <y> <z> <r>`                     | Add a spherical area.                                                           |
| area_del             | `area_del <name>`                                            | Remove an area.                                                                 |
| area_list            | `area_list`                                                  | List areas for loaded map.                                                      |
| area_listall         | `area_listall`                                               | List areas for all maps.                                                        |
| assist               | `assist <player_id> [int_expr]`                              | Change player's assist count.                                                   |
| battery              | `battery <player_id> [decimal_expr] [weapon]`                | Change weapon battery (weapon index as in `ammo`).                              |
| boost                | `boost <player_id>`                                          | Move player to location they are looking at.                                    |
| camo                 | `camo <player_id> [time]`                                    | Apply active camouflage for time (seconds). No effect if already camo.          |
| color                | `color <player_id> [index]`                                  | Change player's FFA color.                                                      |
| coord                | `coord <player_id>`                                          | Return player's coordinates.                                                    |
| deaths               | `deaths <player_id> [amount]`                                | Change player's death count.                                                    |
| disable_all_objects  | `disable_all_objects <team> <disable>`                       | Disable all objects for a team.                                                 |
| disable_all_vehicles | `disable_all_vehicles <team> <disable>`                      | Disable all vehicles for a team.                                                |
| disable_object       | `disable_object <tag_path> [team]`                           | Disable an object, optionally for a specific team.                              |
| disabled_objects     | `disabled_objects`                                           | List all disabled objects.                                                      |
| enable_object        | `enable_object <index or tag_path>`                          | Enable a disabled object by index or tag path.                                  |
| gamespeed            | `gamespeed [speed]`                                          | Change ticks per second (default `30`). Requires anticheat/HAC2 for sync.       |
| god                  | `god <player_id>`                                            | Enable invulnerability (use `ungod` to remove).                                 |
| gravity              | `gravity [float]`                                            | Set server gravity (default `0.003656` units/tick). Requires anticheat.         |
| hp                   | `hp <player_id> [decimal_expr]`                              | Get or set player health (decimal).                                             |
| kill                 | `kill <player_id>`                                           | Kill the player.                                                                |
| kills                | `kills <player_id> [int_expr]`                               | Get or set player's kill count.                                                 |
| lag                  | `lag <player_id>`                                            | Prevent player from moving (use `unlag` to remove).                             |
| loc_add              | `loc_add <location_name> [x] [y] [z]`                        | Add a location at player's position or given coordinates.                       |
| loc_del              | `loc_del <location_name>`                                    | Delete a location.                                                              |
| loc_list             | `loc_list`                                                   | List locations for current map.                                                 |
| loc_listall          | `loc_listall`                                                | List locations for all maps.                                                    |
| m                    | `m <player_id> <x> <y> <z>`                                  | Teleport player relative to their current position.                             |
| mag                  | `mag <player_id> [int_expr] [weapon]`                        | Get or edit loaded ammo (weapon index as in `ammo`).                            |
| nades                | `nades <player_id> [int_expr] [type]`                        | Get or edit grenade count (`1`=primary,`2`=secondary). Values >7 may not sync.  |
| s                    | `s <player_id> [decimal_expr]`                               | Get or edit player speed.                                                       |
| score                | `score <player_id> [int_expr]`                               | Get or edit player's score.                                                     |
| sh                   | `sh <player_id> [decimal_expr]`                              | Get or edit player's shield (decimal).                                          |
| spawn                | `spawn <type> <tag_path> [player_number] [rotation]`         | Spawn object at player's location.                                              |
| spawn                | `spawn <type> <tag_path> [location_name] [rotation]`         | Spawn object at named location.                                                 |
| spawn                | `spawn <type> <tag_path> [<x> <y> <z>] [rotation]`           | Spawn object at coordinates. Rotation in radians.                               |
| st                   | `st <player_id> [red/blue]`                                  | Change player's team. If team name provided, only switches if on opposite team. |
| t                    | `t <player_id> <location_name>`                              | Teleport player to named location.                                              |
| t                    | `t <player_id> <x> <y> <z>`                                  | Teleport player to coordinates.                                                 |
| team_score           | `team_score [red/blue/both] [int_expr]`                      | Get or edit team score(s).                                                      |
| tp                   | `tp <player_id> <player_number>`                             | Move one player to another player.                                              |
| ungod                | `ungod <player_id>`                                          | Remove god mode.                                                                |
| unlag                | `unlag <player_id>`                                          | Remove `lag` effect.                                                            |
| vdel                 | `vdel <player_id>`                                           | Delete all vehicle(s) assigned to player via `spawn`.                           |
| vdel_all             | `vdel_all`                                                   | Delete all vehicles spawned with SAPP.                                          |
| venter               | `venter <player_id> [seat]`                                  | Force player into a previously spawned vehicle (seat index, `1`=driver).        |
| vexit                | `vexit <player_id>`                                          | Force player to exit all vehicles.                                              |
| wadd                 | `wadd <player_id>`                                           | Add previously spawned weapon to player's inventory.                            |
| wdel                 | `wdel <player_id> <weapon>`                                  | Remove weapon from inventory (`0`=current,`1`-`4`=slots,`5`=all).               |
| wdrop                | `wdrop <player_id>`                                          | Drop player's currently held weapon.                                            |

### Remote Console Commands

Manage the TCP remote console.

| Command             | Level | Usage                        | Description                                         |
|---------------------|-------|------------------------------|-----------------------------------------------------|
| remote_console      | 4     | `remote_console [enabled]`   | Enable remote console. Default: `false`.            |
| remote_console_list | 4     | `remote_console_list`        | List connected remote console clients.              |
| remote_console_port | 4     | `remote_console_port [port]` | Set TCP port for remote console (requires restart). |

### Query Packet Manipulation

Add custom fields to Halo's query response.

| Command    | Level | Usage                       | Description                              |
|------------|-------|-----------------------------|------------------------------------------|
| query_add  | 4     | `query_add <key> <value>`   | Add or overwrite a query key/value pair. |
| query_del  | 4     | `query_del <index or name>` | Remove a query entry.                    |
| query_list | 4     | `query_list`                | List custom query entries.               |

### Custom Variables

Custom variables come from these commands, or from `add_var`, `del_var`, and `set_var` in Lua. Since
scripts cannot call each other directly, a custom variable is the way to share data between them.

| Command  | Level | Usage                                         | Description                                                                                                           |
|----------|-------|-----------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| var_add  | 4     | `var_add <name> <type>`                       | Type: `0` = global str, `1` = global int, `2` = global float, `3` = player str, `4` = player int, `5` = player float. |
| var_conv | 4     | `var_conv <name>`                             | Convert between integer and float variable.                                                                           |
| var_del  | 4     | `var_del <name>`                              | Delete a variable.                                                                                                    |
| var_list | 4     | `var_list`                                    | List all custom variables.                                                                                            |
| var_set  | 4     | `var_set <name> <value_expr> [player number]` | Set a custom variable (player number required for player variables).                                                  |

---

## The default Halo profile name: `New001`

This is the name Halo uses when:

- The game is launched for the first time and no profile exists yet.
- A new player profile is created automatically.
- Halo cannot find an existing player profile to load.

The profile itself is stored inside the game's `savegames` directory and the profile folder is also
named `New001`.

### What are the temporary placeholder names?

Halo PC and CE contain a built-in list of fallback multiplayer names commonly referred to as the
"temporary profile name pool" or "placeholder name pool".

These names are embedded in the game's `globals.globals` tag and ship with the stock multiplayer
maps.

Because every stock multiplayer map contains this tag, the default pool is normally identical across
the retail Halo PC and CE multiplayer maps.

Modded or rebuilt maps can change the list entirely.

```text
Butcher, Caboose, Crazy, Cupid, Darling, Dasher, Disco, Donut, Dopey,
Ghost, Goat, Grumpy, Hambone, Hollywood, Howard, Jack, Killer, King,
Noodle, Penguin, Pirate, Prancer, Saucy, Shadow, Sleepy, Snake, Sneak,
Stompy, Stumpy, The Bear, The Big L, Tooth, Walla Walla, Weasel, Whicker,
Wheezy, Whisp, Wilshire
```

These names are not normally used during standard single-instance gameplay. Instead, they exist as
fallback identities used by the multiplayer networking system.

### When does Halo assign a placeholder name?

The placeholder pool is primarily used when Halo cannot safely use the requested multiplayer profile
name.

The most common example is:

- A player joining a multiplayer server where another player is already using the same profile name.

Halo PC and CE do not allow duplicate active player names within the same multiplayer session. If
the requested name is already in use by another connected player, Halo automatically assigns a
temporary placeholder name from the pool instead.

For example:

1. A player joins a server using `New001`.
2. Another player joins using a profile also named `New001`.
3. Halo detects the duplicate name conflict.
4. The second player is assigned a temporary placeholder name such as `Caboose`, `Snake`, or
   `Wheezy`.

---