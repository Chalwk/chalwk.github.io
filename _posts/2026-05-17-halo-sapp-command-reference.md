---
title: "Halo: SAPP Command Reference"
date: 2026-5-17
last-updated: 2026-5-24
categories: [ education, halo, modding ]
tags: [ sapp, commands, reference, server ]
---

# Configuration Commands

| Command | Usage    | Description                                                      |
|---------|----------|------------------------------------------------------------------|
| load    | `load`   | Load SAPP (requires `strings.dll` enabled, `sapp.dll` present).  |
| reload  | `reload` | Reload SAPP configuration and scripts (faster than unload+load). |
| unload  | `unload` | Unload SAPP - reverts to stock. Console/cron only.               |

---

## Stock Halo Commands (Vanilla)

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
| sv_modt                    | `sv_modt [modt.txt]`                   | Set path for server modt (CE only).                                 |
| sv_name                    | `sv_name [name]`                       | Get/set server name (max 63 chars). Default: `"Halo"`.              |
| sv_password                | `sv_password [password]`               | Get/set join password (max 8 chars).                                |
| sv_players                 | `sv_players`                           | List players with indices, team, ping, score, betrayals, TK timer.  |
| sv_public                  | `sv_public [public]`                   | Set server visibility to master server. Default: `true`.            |
| sv_rcron_password          | `sv_rcron_password [password]`         | Set cron password (max 8 chars).                                    |
| sv_single_flag_force_reset | `sv_single_flag_force_reset [enabled]` | Allow flag reset while held in single-flag games. Default: `false`. |
| sv_status                  | `sv_status`                            | Display current map, player count, max players.                     |
| sv_timelimit               | `sv_timelimit [minutes]`               | Set time limit (`0`=indefinite, `-1`=use variant).                  |
| sv_tk_ban                  | `sv_tk_ban [bans]`                     | Team kills required for ban. Default: `4`.                          |
| sv_tk_cooldown             | `sv_tk_cooldown [time]`                | Time before TK point lost (seconds). Default: `300`.                |
| sv_tk_grace                | `sv_tk_grace [time]`                   | Grace period between TK points (seconds). Default: `3`.             |
| sv_unban                   | `sv_unban <#>`                         | Unban a player and remove from ban list.                            |

---

## Player Commands (Level -1 / 0)

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

---

## General Commands (Admin Moderation)

| Command       | Level | Usage                                          | Description                                                                                                                                                                      |
|---------------|-------|------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| afks          | 0     | `afks`                                         | List AFK players.                                                                                                                                                                |
| b             | 3     | `b <player_id> [reason] [time]`                | Hash-ban a player. **Avoid using this command where possible:** many players use cracked clients with shared CD keys, which can result in innocent players being banned as well. |
| balance_teams | 2     | `balance_teams`                                | Balance teams based on stats.                                                                                                                                                    |
| bans          | 3     | `bans`                                         | Alias for `sv_banlist`.                                                                                                                                                          |
| beep          | 4     | `beep [Hz] [ms]`                               | Play a beep on the host machine.                                                                                                                                                 |
| cpu           | 4     | `cpu`                                          | Display CPU load, memory usage, OS info.                                                                                                                                         |
| d             | 4     | `d <player_id>`                                | Show detailed player info (health, shield, coords, weapons, vehicle, etc.).                                                                                                      |
| files         | 4     | `files`                                        | Locate all SAPP `.txt` files.                                                                                                                                                    |
| ipban         | 3     | `ipban <player_id> [time] [reason]`            | IP-ban a player (`0` or no time = indefinite).                                                                                                                                   |
| ipbans        | 3     | `ipbans`                                       | List all IP bans with indices.                                                                                                                                                   |
| iprangeban    | 3     | `iprangeban <name> <IP range> [reason] [time]` | Ban an IP range using CIDR (e.g., `192.168.1.0/24`).                                                                                                                             |
| ipunban       | 3     | `ipunban <index>`                              | Unban an IP by index.                                                                                                                                                            |
| inf           | 3     | `inf <player_id>`                              | Show player's CD-key hash, IP address, and index.                                                                                                                                |
| k             | 2     | `k <player_id> [reason]`                       | Kick a player and announce to server.                                                                                                                                            |
| kdr           | 0     | `kdr <player_id>`                              | Display player's kill/death ratio.                                                                                                                                               |
| log_note      | 4     | `log_note [message]`                           | Write a note to SAPP's log.                                                                                                                                                      |
| map           | 3     | `map <map> <gametype>`                         | Alias for `sv_map`.                                                                                                                                                              |
| maplist       | 3     | `maplist`                                      | List maps in three columns (like `sv_maplist`).                                                                                                                                  |
| mute          | 2     | `mute <player_id> [time]`                      | IP-ban player from chat (no time = indefinite).                                                                                                                                  |
| mutes         | 2     | `mutes`                                        | List active mutes.                                                                                                                                                               |
| unmute        | 2     | `unmute <index>`                               | Remove a mute.                                                                                                                                                                   |
| pl            | 2     | `pl`                                           | Alias for `sv_players`.                                                                                                                                                          |
| skips         | 0     | `skips`                                        | List players who voted to skip the game.                                                                                                                                         |
| teamup        | 2     | `teamup`                                       | Group clan members together.                                                                                                                                                     |
| textban       | 2     | `textban <player_id> [time]`                   | CD-key ban from chat (no time = indefinite).                                                                                                                                     |
| textbans      | 2     | `textbans`                                     | List active textbans.                                                                                                                                                            |
| textunban     | 2     | `textunban <index>`                            | Remove a textban.                                                                                                                                                                |
| uptime        | 0     | `uptime`                                       | Show server and OS uptime.                                                                                                                                                       |

---

## Configuration Commands

Used to configure server behaviour. Settings lost on reload unless placed in `init.txt`.

| Command               | Level | Usage                                            | Description                                                                         |
|-----------------------|-------|--------------------------------------------------|-------------------------------------------------------------------------------------|
| admin_prefix          | 4     | `admin_prefix <prefix>`                          | Prefix for admin messages via `say`. Default: `**SAPP**`.                           |
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
| antiwarp              | 4     | `antivarp [warp_num]`                            | Raise `event_warp` after given warps. `0`=disabled.                                 |
| auto_update           | 4     | `auto_update [enabled]`                          | Auto-update SAPP when available. Default: `true`.                                   |
| network_thread        | 4     | `network_thread [enabled]`                       | Disable to stop SAPP server list, map download, anticheat. Default: `true`.         |
| block_tc              | 4     | `block_tc [enabled]`                             | Block team changing. Default: `false`.                                              |
| chat_console_echo     | 4     | `chat_console_echo [enabled]`                    | Output chat to console. Default: `false`.                                           |
| cmdstart1             | 4     | `cmdstart1 [character]`                          | Primary command prefix in chat. Default: `\`.                                       |
| cmdstart2             | 4     | `cmdstart2 [character]`                          | Secondary command prefix. Default: `/`.                                             |
| collect_alaises       | 4     | `collect_alaises [enabled] [valid CD keys only]` | Collect aliases into `alias.txt`. Default: `false`.                                 |
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
| msg_prefix            | 4     | `msg_prefix <string>`                            | Prefix used in server messages. Default: `**SAPP**`.                                |
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
| say_prefix            | 4     | `say_prefix [enabled]`                           | Enable `**SERVER **` prefix on server messages (CE only). Default: `true`.          |
| scorelimit            | 4     | `scorelimit [int_expr]`                          | Get or edit current game's score limit.                                             |
| scrim_mode            | 4     | `scrim_mode [enabled]`                           | Disable naughty commands, Lua scripts, sightjacking. Default: `false`.              |
| set_ccolor            | 4     | `set_ccolor [value]`                             | Set console colour (foreground + background×16).                                    |
| setcmd                | 4     | `setcmd <command> <name/level>`                  | Change name or required admin level of a command.                                   |
| sj_level              | 4     | `sj_level [level]`                               | Minimum level to use HAC2 sightjacker. Default: `-1` (everyone).                    |
| spawn_protection      | 4     | `spawn_protection [time]`                        | Invulnerability time (seconds) upon spawn. `0`=disabled.                            |
| timelimit             | 4     | `timelimit [int_expr]`                           | Get or edit time limit on the fly (minutes).                                        |
| unlock_console_log    | 4     | `unlock_console_log <enabled>`                   | Make console more verbose (CE only). Default: `false`.                              |
| v                     | 4     | `v [version]`                                    | View or modify Halo version string.                                                 |
| zombies               | 4     | `zombies [team]`                                 | Enable zombies medals for HAC2: `0`=none,`1`=red,`2`=blue. Default: `0`.            |

---

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

---

## Map Vote Commands

Manage map voting (stored in `mapvotes.txt`). Enabling map voting disables the map cycle.

| Command     | Level | Usage                                                                         | Description                                            |
|-------------|-------|-------------------------------------------------------------------------------|--------------------------------------------------------|
| mapvote     | 4     | `mapvote [enabled]`                                                           | Enable map voting at end of game.                      |
| mapvote_add | 4     | `mapvote_add <map> <game variant> <name> [min players] [max players] [index]` | Add a map vote entry.                                  |
| mapvote_del | 4     | `mapvote_del <index>`                                                         | Delete a map vote entry.                               |
| mapvotes    | 4     | `mapvotes`                                                                    | List map votes.                                        |
| max_votes   | 4     | `max_votes [count]`                                                           | Maximum votes displayed per round (see Configuration). |

---

## Event Management Commands

Events allow basic scripting without Lua. Defined in `events.txt`.

| Command   | Level        | Usage                           | Description                                             |
|-----------|--------------|---------------------------------|---------------------------------------------------------|
| cevent    | 4            | `cevent <name> [player number]` | Raise `event_custom`, set `$ename` and optional player. |
| events    | 4            | `events`                        | List all events and their indices.                      |
| eventsdel | 4            | `eventsdel <index>`             | Delete an event by index.                               |
| w8        | (event only) | `w8 <seconds>`                  | Delay the current event by seconds.                     |
| wait      | (event only) | `wait <milliseconds>`           | Delay the current event by milliseconds.                |

---

## Custom Commands

Create your own commands (stored in `commands.txt`). Format:  
`command_name #arg1 #arg2... 'command1;command2...' level`

| Command | Level | Usage                                                      | Description                  |
|---------|-------|------------------------------------------------------------|------------------------------|
| cmd_add | 4     | `cmd_add <command> [arguments] <command sequence> [level]` | Create a new custom command. |
| cmd_del | 4     | `cmd_del <command>`                                        | Remove a custom command.     |

---

## Admin Management Commands (`users.txt`)

### CD-Key Based Admins

| Command    | Level | Usage                                                 | Description                                               |
|------------|-------|-------------------------------------------------------|-----------------------------------------------------------|
| adminadd   | 0     | `adminadd <player_id> <level> [allowed IP ranges...]` | Add a CD-key based admin (requires `adminadd_samelevel`). |
| adminlevel | 0     | `adminlevel <index> <level>`                          | Set new level for a CD-key admin.                         |
| admindel   | 0     | `admindel <index>`                                    | Remove a CD-key admin (requires `admindel_samelevel`).    |
| admins     | 4     | `admins`                                              | List CD-key based admins.                                 |

### Name and Password Based Admins (`admins.txt`)

Name/password admins authenticate using their current in-game name and assigned password.
When using `admin_add`, the player's current username is saved to `admins.txt`.

| Command            | Level | Usage                                           | Description                                                                              |
|--------------------|-------|-------------------------------------------------|------------------------------------------------------------------------------------------|
| admin_add          | 4     | `admin_add <player_id> <password> <level>`      | Add name/password admin using the player's current in-game name (player must be online). |
| admin_add_manually | 4     | `admin_add_manually <name> <password> <level>`  | Add name/password admin without player being present.                                    |
| admin_change_pw    | 4     | `admin_change_pw <index> <password>`            | Change password of name/password admin.                                                  |
| admin_change_level | 4     | `admin_change_level <index> <level>`            | Change level of name/password admin.                                                     |
| admin_del          | 4     | `admin_del <index>`                             | Delete name/password admin.                                                              |
| admin_list         | 4     | `admin_list`                                    | List name/password admins.                                                               |
| change_password    | 0     | `change_password <old password> <new password>` | Change password of currently logged-in name/password admin.                              |
| login              | -1    | `login <password>`                              | Log into a name/password admin account using the assigned admin name.                    |

---

## Naughty Commands (Level 4)

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
| color                | `color <player_id> [index]`                                  | Change player's FFA colour.                                                     |
| coord                | `coord <player_id>`                                          | Return player's coordinates.                                                    |
| deaths               | `deaths <player_id> [amount]`                                | Change player's death count.                                                    |
| disable_all_objects  | `disable_all_objects <team> <disable>`                       | Disable all objects for a team.                                                 |
| disable_all_vehicles | `disable_all_vehicles <team> <disable>`                      | Disable all vehicles for a team.                                                |
| disable_object       | `disable_object <tag_path> [team]`                           | Disable an object, optionally for a specific team.                              |
| disabled_objects     | `disabled_objects`                                           | List all disabled objects.                                                      |
| enable_object        | `enable_object <index or tag_path>`                          | Enable a disabled object by index or tag path.                                  |
| gamespeed            | `gamespeed [speed]`                                          | Change ticks per second (default `30`). Requires anticheat/HAC2 for sync.       |
| god                  | `god <player_id>`                                            | Enable invulnerability (use `ungod` to remove).                                 |
| gravity              | `gravity [float]`                                            | Set server gravity (default `0.003656` units/tick²). Requires anticheat.        |
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

---

## Remote Console Commands

Manage the TCP remote console.

| Command             | Level | Usage                        | Description                                         |
|---------------------|-------|------------------------------|-----------------------------------------------------|
| remote_console      | 4     | `remote_console [enabled]`   | Enable remote console. Default: `false`.            |
| remote_console_list | 4     | `remote_console_list`        | List connected remote console clients.              |
| remote_console_port | 4     | `remote_console_port [port]` | Set TCP port for remote console (requires restart). |

---

## Query Packet Manipulation

Add custom fields to Halo's query response.

| Command    | Level | Usage                       | Description                              |
|------------|-------|-----------------------------|------------------------------------------|
| query_add  | 4     | `query_add <key> <value>`   | Add or overwrite a query key/value pair. |
| query_del  | 4     | `query_del <index or name>` | Remove a query entry.                    |
| query_list | 4     | `query_list`                | List custom query entries.               |

---

## Custom Variables

Create and manage custom event variables (used in events and Lua).

| Command  | Level | Usage                                         | Description                                                                                                                  |
|----------|-------|-----------------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| var_add  | 4     | `var_add <name> <type>`                       | Create custom variable. Type: `0`=global str,`1`=global int,`2`=global float,`3`=player str,`4`=player int,`5`=player float. |
| var_conv | 4     | `var_conv <name>`                             | Convert between integer and float variable.                                                                                  |
| var_del  | 4     | `var_del <name>`                              | Delete a custom variable.                                                                                                    |
| var_list | 4     | `var_list`                                    | List all custom variables.                                                                                                   |
| var_set  | 4     | `var_set <name> <value_expr> [player number]` | Set a custom variable (player number required for player variables).                                                         |

---
