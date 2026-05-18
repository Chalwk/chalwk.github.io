---
title: "Halo: SAPP Command Reference"
date: 2026-05-17
last-updated: 2026-5-17
categories: [ education, halo, modding ]
tags: [ sapp, commands ]
---

# Configuration Commands

Used to configure server behaviour. Some settings are lost on reload unless placed in `init.txt`.

| Command               | Level | Usage                                            | Description                                                                          |
|-----------------------|-------|--------------------------------------------------|--------------------------------------------------------------------------------------|
| admin_prefix          | 4     | `admin_prefix <prefix>`                          | Prefix for admin messages via `say`. Default: "** ADMIN **".                         |
| adminadd_samelevel    | 4     | `adminadd_samelevel [0-2]`                       | Allow admins to add other V1 admins: 0=no, 1=lower level, 2=lower/equal. Default: 0. |
| adminban              | 4     | `adminban [0-2]`                                 | Admin ban permissions: 0=any, 1=no higher, 2=only lower. Default: 0.                 |
| admindel_samelevel    | 4     | `admindel_samelevel [0-2]`                       | Allow admins to delete V1 admins: 0=no, 1=lower, 2=lower/equal. Default: 0.          |
| afk_kick              | 4     | `afk_kick [seconds]`                             | Auto-kick AFK players after time (0=disabled).                                       |
| aimbot_ban            | 4     | `aimbot_ban [length] [type]`                     | Auto kick/ban aimbotters. 0=CD hash,1=IP,2=both,3=kick. 0=disabled.                  |
| alias                 | 4     | `alias <player_expr>`                            | Search for aliases recorded in aliases.txt.                                          |
| anticamp              | 4     | `anticamp [time] [distance]`                     | Raise `event_camp` if player kills while camping. Disabled by default.               |
| anticaps              | 4     | `anticaps [enabled]`                             | Prevent excessive capital letters. Default: false.                                   |
| anticheat             | 4     | `anticheat [enabled]`                            | Require anticheat client. Must be set in init.txt. Default: false.                   |
| antiglitch            | 4     | `antiglitch [enabled]`                           | Kill players who leave map BSP. Default: false.                                      |
| antihalofp            | 4     | `antihalofp [enabled]`                           | IP ban (5 minutes) for too-frequent join attempts. Default: false.                   |
| antilagspawn          | 4     | `antilagspawn [enable]`                          | Prevent lag-spawning. Default: false.                                                |
| antispam              | 4     | `antispam [type]`                                | Auto mute spammers: 0=disabled,1=CD-key,2=IP. Default: 0.                            |
| antiwarp              | 4     | `antivarp [warp_num]`                            | Raise `event_warp` after given warps. 0=disabled.                                    |
| auto_update           | 4     | `auto_update [enabled]`                          | Auto-update SAPP when available. Default: true.                                      |
| network_thread        | 4     | `network_thread [enabled]`                       | Disable to stop listing on SAPP server list, map download, anticheat. Default: true. |
| block_tc              | 4     | `block_tc [enabled]`                             | Block team changing. Default: false.                                                 |
| chat_console_echo     | 4     | `chat_console_echo [enabled]`                    | Output chat to console. Default: false.                                              |
| cmdstart1             | 4     | `cmdstart1 [character]`                          | Primary command prefix in chat. Default: "\".                                        |
| cmdstart2             | 4     | `cmdstart2 [character]`                          | Secondary command prefix. Default: "/".                                              |
| collect_alaises       | 4     | `collect_alaises [enabled] [valid CD keys only]` | Collect aliases into alias.txt. Default: false.                                      |
| console_input         | 4     | `console_input [enabled]`                        | Allow console to accept input. Default: true.                                        |
| custom_sleep          | 4     | `custom_sleep [ms]`                              | Modify Halo thread sleep per cycle (ms). Default: 8.                                 |
| disable_timer_offsets | 4     | `disable_timer_offsets [enabled]`                | Use fixed Xbox-style spawn timers. Default: false.                                   |
| dns                   | 4     | `dns [url]`                                      | Master server address for broadcasting.                                              |
| full_ipban            | 4     | `full_ipban [enabled]`                           | Block all traffic from banned IPs. May reduce performance. Default: false.           |
| hide_admin            | 4     | `hide_admin [enabled]`                           | Hide admin names when using kick/ban commands. Default: false.                       |
| hill_timer            | 4     | `hill_timer [int_expr]`                          | Seconds hill changes in "Crazy King". Default: 60.                                   |
| log                   | 4     | `log [enabled]`                                  | Log events to file. Default: false.                                                  |
| log_rotation          | 4     | `log rotation [kb]`                              | Max log size (kB) before archiving. Default: 4096.                                   |
| log_name              | 4     | `log_name [name]`                                | Log file name (".log" appended). Default: log.                                       |
| lua                   | 4     | `lua [enabled]`                                  | Enable Lua scripting. Default: false.                                                |
| lua_api_v             | 4     | `lua_api_v`                                      | Display current Lua API version.                                                     |
| lua_call              | 4     | `lua_call <script> <function> [arguments...]`    | Call a function in a loaded Lua script.                                              |
| lua_load              | 4     | `lua_load <script>`                              | Load a Lua script and call OnScriptLoad().                                           |
| lua_unload            | 4     | `lua_unload <script>`                            | Unload a Lua script and call OnScriptUnload().                                       |
| map_skip              | 4     | `map_skip [%]`                                   | Enable skip command when % of players want skip. 0=disabled.                         |
| mapvote               | 4     | `mapvote [enabled]`                              | Enable map voting at end of game. Default: false.                                    |
| max_idle              | 4     | `max_idle [time]`                                | Restart mapcycle if server idle for this many seconds. Default: 60.                  |
| max_votes             | 4     | `max_votes [count]`                              | Maximum displayed votes per round. Default: 5.                                       |
| motd                  | 4     | `motd [string]`                                  | Set the server Message of the Day.                                                   |
| msg_prefix            | 4     | `msg_prefix <string>`                            | Prefix used in server messages. Default: "**SAPP**".                                 |
| mtv                   | 4     | `mtv [enabled]`                                  | Enable multi-team vehicles (requires anticheat/HAC2). Default: false.                |
| no_lead               | 4     | `no_lead [enabled]`                              | Enable no-lead mode (ping compensation). Default: false.                             |
| packet_limit          | 4     | `packet_limit [amount]`                          | Max packets per second from an IP. Default: 1000.                                    |
| ping_kick             | 4     | `ping_kick [ping]`                               | Kick players with ping exceeding this value (ms). 0=disabled.                        |
| reload_gametypes      | 4     | `reload_gametypes`                               | Reload game variants from savegames folder.                                          |
| remote_console        | 4     | `remote_console [enabled]`                       | Enable remote console (TCP). Default: false.                                         |
| remote_console_list   | 4     | `remote_console_list`                            | List connected remote console clients.                                               |
| remote_console_port   | 4     | `remote_console_port [port]`                     | Set TCP port for remote console. Requires restart.                                   |
| sapp_console          | 4     | `sapp_console [enabled]`                         | Suppress periodic sv_status; show join/leave/game start. Default: false.             |
| sapp_mapcycle         | 4     | `sapp_mapcycle [enabled]`                        | Enable SAPP's map cycle. Default: false.                                             |
| sapp_rcon             | 4     | `sapp_rcon [enabled]`                            | Require rcon users to be SAPP admins. Default: false.                                |
| save_scores           | 4     | `save_scores [enabled]`                          | Prevent score reset when player leaves. Default: false.                              |
| say_prefix            | 4     | `say_prefix [enabled]`                           | Enable "**SERVER **" prefix on server messages (CE only). Default: true.             |
| scorelimit            | 4     | `scorelimit [int_expr]`                          | Get or edit current game's score limit.                                              |
| scrim_mode            | 4     | `scrim_mode [enabled]`                           | Disable naughty commands, Lua scripts, sightjacking. Default: false.                 |
| set_ccolor            | 4     | `set_ccolor [value]`                             | Set console color (foreground + background*16).                                      |
| setcmd                | 4     | `setcmd <command> <name/level>`                  | Change name or required admin level of a command.                                    |
| sj_level              | 4     | `sj_level [level]`                               | Minimum level to use HAC2 sightjacker. Default: -1 (everyone).                       |
| spawn_protection      | 4     | `spawn_protection [time]`                        | Invulnerability time (seconds) upon spawn. 0=disabled.                               |
| timelimit             | 4     | `timelimit [int_expr]`                           | Get or edit time limit on the fly (minutes).                                         |
| unlock_console_log    | 4     | `unlock_console_log <enabled>`                   | Make console more verbose (CE only). Default: false.                                 |
| v                     | 4     | `v [version]`                                    | View or modify Halo version string.                                                  |
| zombies               | 4     | `zombies [team]`                                 | Enable zombies medals for HAC2: 0=none,1=red,2=blue. Default: 0.                     |

## Map Cycle Commands

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

## Map Vote Commands

Manage map voting (stored in `mapvotes.txt`).

| Command     | Level | Usage                                                                         | Description                                            |
|-------------|-------|-------------------------------------------------------------------------------|--------------------------------------------------------|
| mapvote     | 4     | `mapvote [enabled]`                                                           | Enable map voting at end of game.                      |
| mapvote_add | 4     | `mapvote_add <map> <game variant> <name> [min players] [max players] [index]` | Add a map vote entry.                                  |
| mapvote_del | 4     | `mapvote_del <index>`                                                         | Delete a map vote entry.                               |
| mapvotes    | 4     | `mapvotes`                                                                    | List map votes.                                        |
| max_votes   | 4     | `max_votes [count]`                                                           | Maximum votes displayed per round (see Configuration). |

## Event Management Commands

Commands to control SAPP's event system (`events.txt`).

| Command   | Level        | Usage                           | Description                                             |
|-----------|--------------|---------------------------------|---------------------------------------------------------|
| cevent    | 4            | `cevent <name> [player number]` | Raise `event_custom`, set `$ename` and optional player. |
| events    | 4            | `events`                        | List all events and their indices.                      |
| eventsdel | 4            | `eventsdel <index>`             | Delete an event by index.                               |
| w8        | (event only) | `w8 <seconds>`                  | Delay the current event by seconds.                     |
| wait      | (event only) | `wait <milliseconds>`           | Delay the current event by milliseconds.                |

## Custom Commands

Create custom commands (`commands.txt`).

| Command | Level | Usage                                                      | Description                  |
|---------|-------|------------------------------------------------------------|------------------------------|
| cmd_add | 4     | `cmd_add <command> [arguments] <command sequence> [level]` | Create a new custom command. |
| cmd_del | 4     | `cmd_del <command>`                                        | Remove a custom command.     |

## Admin Management Commands

### CD-Key Based Admins

| Command    | Level | Usage                                                   | Description                                               |
|------------|-------|---------------------------------------------------------|-----------------------------------------------------------|
| adminadd   | 0     | `adminadd <player_expr> <level> [allowed IP ranges...]` | Add a CD-key based admin (requires `adminadd_samelevel`). |
| adminlevel | 0     | `adminlevel <index> <level>`                            | Set new level for a CD-key admin.                         |
| admindel   | 0     | `admindel <index>`                                      | Remove a CD-key admin (requires `admindel_samelevel`).    |
| admins     | 4     | `admins`                                                | List CD-key based admins.                                 |

### Name and Password Based Admins

| Command            | Level | Usage                                           | Description                                                 |
|--------------------|-------|-------------------------------------------------|-------------------------------------------------------------|
| admin_add          | 4     | `admin_add <player_expr> <password> <level>`    | Add name/password admin (player must be on server).         |
| admin_add_manually | 4     | `admin_add_manually <name> <password> <level>`  | Add name/password admin without player being present.       |
| admin_change_pw    | 4     | `admin_change_pw <index> <password>`            | Change password of name/password admin.                     |
| admin_change_level | 4     | `admin_change_level <index> <level>`            | Change level of name/password admin.                        |
| admin_del          | 4     | `admin_del <index>`                             | Delete name/password admin.                                 |
| admin_list         | 4     | `admin_list`                                    | List name/password admins.                                  |
| change_password    | 0     | `change_password <old password> <new password>` | Change password of currently logged-in name/password admin. |
| login              | -1    | `login <password>`                              | Log into name/password admin account (see Player Commands). |

## Naughty Commands (Level 4)

Directly modify player attributes. Cannot be used when `scrim_mode` is enabled.

| Command              | Usage                                                        | Description                                                                     |
|----------------------|--------------------------------------------------------------|---------------------------------------------------------------------------------|
| ammo                 | `ammo <player_expr> [int_expr] [weapon]`                     | Change unloaded ammo (0=current,1-4=weapon slots,5=all).                        |
| area_add_cuboid      | `area_add_cuboid <name> <a_x> <a_y> <a_z> <b_x> <b_y> <b_z>` | Add a rectangular area.                                                         |
| area_add_sphere      | `area_add_sphere <name> <x> <y> <z> <r>`                     | Add a spherical area.                                                           |
| area_del             | `area_del <name>`                                            | Remove an area.                                                                 |
| area_list            | `area_list`                                                  | List areas for loaded map.                                                      |
| area_listall         | `area_listall`                                               | List areas for all maps.                                                        |
| assist               | `assist <player_expr> [int_expr]`                            | Change player's assist count.                                                   |
| battery              | `battery <player_expr> [decimal_expr] [weapon]`              | Change weapon battery (weapon index as in `ammo`).                              |
| boost                | `boost <player_expr>`                                        | Move player to location they are looking at.                                    |
| camo                 | `camo <player_expr> [time]`                                  | Apply active camouflage for time (seconds). No effect if already camo.          |
| color                | `color <player_expr> [index]`                                | Change player's FFA colour.                                                     |
| coord                | `coord <player_expr>`                                        | Return player's coordinates.                                                    |
| deaths               | `deaths <player_expr> [amount]`                              | Change player's death count.                                                    |
| disable_all_objects  | `disable_all_objects <team> <disable>`                       | Disable all objects for a team.                                                 |
| disable_all_vehicles | `disable_all_vehicles <team> <disable>`                      | Disable all vehicles for a team.                                                |
| disable_object       | `disable_object <tag_path> [team]`                           | Disable an object, optionally for a specific team.                              |
| disabled_objects     | `disabled_objects`                                           | List all disabled objects.                                                      |
| enable_object        | `enable_object <index or tag_path>`                          | Enable a disabled object by index or tag path.                                  |
| gamespeed            | `gamespeed [speed]`                                          | Change ticks per second (default 30). Requires anticheat/HAC2 for sync.         |
| god                  | `god <player_expr>`                                          | Enable invulnerability (use `ungod` to remove).                                 |
| gravity              | `gravity [float]`                                            | Set server gravity (default 0.003656 units/tick^2). Requires anticheat.         |
| hp                   | `hp <player_expr> [decimal_expr]`                            | Get or set player health (decimal).                                             |
| kill                 | `kill <player_expr>`                                         | Kill the player.                                                                |
| kills                | `kills <player_expr> [int_expr]`                             | Get or set player's kill count.                                                 |
| lag                  | `lag <player_expr>`                                          | Prevent player from moving (use `unlag` to remove).                             |
| loc_add              | `loc_add <location_name> [x] [y] [z]`                        | Add a location at player's position or given coordinates.                       |
| loc_del              | `loc_del <location_name>`                                    | Delete a location.                                                              |
| loc_list             | `loc_list`                                                   | List locations for current map.                                                 |
| loc_listall          | `loc_listall`                                                | List locations for all maps.                                                    |
| m                    | `m <player_expr> <x> <y> <z>`                                | Teleport player relative to their current position.                             |
| mag                  | `mag <player_expr> [int_expr] [weapon]`                      | Get or edit loaded ammo (weapon index as in `ammo`).                            |
| nades                | `nades <player_expr> [int_expr] [type]`                      | Get or edit grenade count (1=primary,2=secondary). Values >7 may not sync.      |
| s                    | `s <player_expr> [decimal_expr]`                             | Get or edit player speed.                                                       |
| score                | `score <player_expr> [int_expr]`                             | Get or edit player's score.                                                     |
| sh                   | `sh <player_expr> [decimal_expr]`                            | Get or edit player's shield (decimal).                                          |
| spawn                | `spawn <type> <tag_path> [player_number] [rotation]`         | Spawn object at player's location.                                              |
| spawn                | `spawn <type> <tag_path> [location_name] [rotation]`         | Spawn object at named location.                                                 |
| spawn                | `spawn <type> <tag_path> [<x> <y> <z>] [rotation]`           | Spawn object at coordinates. Rotation in radians.                               |
| st                   | `st <player_expr> [red/blue]`                                | Change player's team. If team name provided, only switches if on opposite team. |
| t                    | `t <player_expr> <location_name>`                            | Teleport player to named location.                                              |
| t                    | `t <player_expr> <x> <y> <z>`                                | Teleport player to coordinates.                                                 |
| team_score           | `team_score [red/blue/both] [int_expr]`                      | Get or edit team score(s).                                                      |
| tp                   | `tp <player_expr> <player_number>`                           | Move one player to another player.                                              |
| ungod                | `ungod <player_expr>`                                        | Remove god mode.                                                                |
| unlag                | `unlag <player_expr>`                                        | Remove `lag` effect.                                                            |
| vdel                 | `vdel <player_expr>`                                         | Delete all vehicle(s) assigned to player via `spawn`.                           |
| vdel_all             | `vdel_all`                                                   | Delete all vehicles spawned with SAPP.                                          |
| venter               | `venter <player_expr> [seat]`                                | Force player into a previously spawned vehicle (seat index, 1=driver).          |
| vexit                | `vexit <player_expr>`                                        | Force player to exit all vehicles.                                              |
| wadd                 | `wadd <player_expr>`                                         | Add previously spawned weapon to player's inventory.                            |
| wdel                 | `wdel <player_expr> <weapon>`                                | Remove weapon from inventory (0=current,1-4=slots,5=all).                       |
| wdrop                | `wdrop <player_expr>`                                        | Drop player's currently held weapon.                                            |

## Remote Console Commands

Manage the TCP remote console.

| Command             | Level | Usage                        | Description                                        |
|---------------------|-------|------------------------------|----------------------------------------------------|
| remote_console      | 4     | `remote_console [enabled]`   | Enable remote console. Default: false.             |
| remote_console_list | 4     | `remote_console_list`        | List connected remote console clients.             |
| remote_console_port | 4     | `remote_console_port [port]` | Set TCP port for remote console. Requires restart. |

## Query Packet Manipulation

Add custom fields to Halo's query response.

| Command    | Level | Usage                       | Description                              |
|------------|-------|-----------------------------|------------------------------------------|
| query_add  | 4     | `query_add <key> <value>`   | Add or overwrite a query key/value pair. |
| query_del  | 4     | `query_del <index or name>` | Remove a query entry.                    |
| query_list | 4     | `query_list`                | List custom query entries.               |

## Custom Variables

Create and manage custom event variables.

| Command  | Level | Usage                                         | Description                                                                                                            |
|----------|-------|-----------------------------------------------|------------------------------------------------------------------------------------------------------------------------|
| var_add  | 4     | `var_add <name> <type>`                       | Create custom variable. Type: 0=global string,1=global int,2=global float,3=player string,4=player int,5=player float. |
| var_conv | 4     | `var_conv <name>`                             | Convert between integer and float variable.                                                                            |
| var_del  | 4     | `var_del <name>`                              | Delete a custom variable.                                                                                              |
| var_list | 4     | `var_list`                                    | List all custom variables.                                                                                             |
| var_set  | 4     | `var_set <name> <value_expr> [player number]` | Set a custom variable. For player variables, specify player index.                                                     |

---