---
title: "Halo: Running SAPP Servers on an Ubuntu VPS"
permalink: /halo/ubuntu-vps-hosting/
date: 2025-08-29
last-updated: 2026-11-22
description: "A complete, headless guide to setting up a Vultr Ubuntu VPS and hosting one or many Halo CE (SAPP) dedicated servers under Wine as systemd services."
categories: [ education, halo, vps, linux, server ]
tags: [ ubuntu, wine, ssh, hosting, tutorial, ufw, fail2ban, vultr ]
---

# Summary

This guide builds a secure, headless Ubuntu VPS that runs **Halo CE (SAPP) dedicated servers** under Wine.

Everything is managed from a terminal over SSH with **BitVise**. There is no GUI, no remote desktop and no VNC. Every long-running thing is a **systemd service**, so it keeps running after you close your SSH client, starts at boot, and restarts after a crash.

| Part | What it covers                                                         |
| ---- | ---------------------------------------------------------------------- |
| 1    | VPS foundation: user, SSH hardening, firewall, Fail2ban, swap, updates |
| 2    | Halo servers: Wine, Xvfb, systemd units, the `halo` helper, status     |
| A-D  | Quick reference, ports, memory and monitoring, removal                 |

Do the parts in order the first time. After that, each part stands alone as a reference.

> [!TIP] **Already familiar with SAPP?** This guide assumes you have (or will build) a multi-server SAPP folder with one `cg/<ServerName>/` instance per server. The [SAPP Server and Lua API Guide](sapp/sapp-guide.md) explains that layout.

## How it fits together

```
Internet
   │
   ├── TCP <ssh-port> (SSH, only from your own IP)  ──────►  sshd
   └── UDP 2302-2304 (players)  ──────────────────────────►  Halo servers (Wine)

xvfb.service  →  wineserver.service  →  halo@CTF, halo@Slayer, ...   (one unit per Halo server)
```

## Conventions used throughout

| Item                | Value                                                     |
| ------------------- | --------------------------------------------------------- |
| Linux user          | `haloadmin` (everything runs as this user, never as root) |
| SSH port            | `22022` (any unused port above 1024 works; pick your own) |
| Halo servers folder | `/home/haloadmin/HaloServers`                             |
| Halo unit names     | `halo@<ServerName>.service`, plus `xvfb` and `wineserver` |
| Example servers     | `CTF` (2302), `Slayer` (2303), `KOTH` (2304)              |
| Placeholders        | `<like-this>` means "replace with your own value"         |

`haloadmin`, `22022` and the example server names are placeholders. You can use your own, but if you change the username, change it **everywhere**, including inside the systemd unit files in Part 2, which cannot use variables.

> [!TIP] **Saving in nano:** use **`Ctrl + O`**, **Enter**, then **`Ctrl + X`**.

---

# Part 1: VPS Foundation

## Prerequisites

- [BitVise SSH Client](https://www.bitvise.com/ssh-client-download) (Windows). On Linux or macOS you can use the built-in `ssh` and `ssh-keygen` instead; the steps are the same.
- A Vultr account
- Your home public IP address (search "what is my IP")
- Your Halo CE dedicated server files: `haloceded.exe`, `sapp.dll`, `strings.dll`, your `maps/` folder, and a `cg/` folder with one subfolder per server (see [Folder layout](#folder-layout))

## Step 1: Deploy the VPS

1. Go to the [Vultr Deploy page](https://my.vultr.com/deploy/).
2. Choose **Shared CPU**.
3. Pick the location closest to your players.
4. Select a plan. See [Appendix C](#appendix-c-memory-budget-and-monitoring): RAM is the limiting factor.
5. Click **Configure Software** and select the latest **Ubuntu LTS x64**.
6. Set a hostname (e.g., `halo-vps`).
7. Click **Deploy Now** and wait a few minutes.
8. From the instance overview page, note the **IP Address**, **Password** and **Username** (`root`).

## Step 2: First Connection and SSH Key (BitVise)

We use the root password once, then switch to key authentication.

1. Open **BitVise SSH Client**.
2. Enter the **Host** (server IP), **Port** `22`, and **Username** `root`.
3. Set **Initial Method** to `password` and enter the password from Vultr.
4. Open the **Client key manager** (Login tab) and generate a key:
    - **Algorithm:** `ed25519`
    - Leave the passphrase blank unless you want to type it every login.
    - Click **Generate**.
5. Export the public key in `OpenSSH format` to a file, e.g. `bitvise-key.pub`.
6. Export the private key in `BitVise format (text)`, e.g. `bitvise-key.bkp`, and store it somewhere safe.
7. Log in as `root` and accept the host fingerprint, then open a **terminal console**.

## Step 3: Create the Non-Root User

```bash
# Create the user. Set a strong password; leave the optional fields blank; confirm with y.
adduser haloadmin

# Give it sudo rights
usermod -aG sudo haloadmin

# Verify (you should see haloadmin in the list)
grep sudo /etc/group
```

## Step 4: Install Your SSH Public Key

Still as `root`:

```bash
mkdir -p /home/haloadmin/.ssh
nano /home/haloadmin/.ssh/authorized_keys
```

Open `bitvise-key.pub` in a text editor, copy the whole line (it starts with `ssh-ed25519 AAAA...`), paste it into nano, then save and exit. Fix the permissions:

```bash
chmod 700 /home/haloadmin/.ssh
chmod 600 /home/haloadmin/.ssh/authorized_keys
chown -R haloadmin:haloadmin /home/haloadmin/.ssh
```

Close the terminal console.

## Step 5: Test Key Login

1. In BitVise, log out of the `root` session.
2. Log in as `haloadmin` with **Initial Method** `publickey` and your **Client key**.
3. Open a terminal console. The prompt should read `haloadmin@<hostname>`.

> [!WARNING] **Do not continue until key login works.** If it fails, fix it now. Locking yourself out later is much harder to fix.

## Step 6: Update the System

```bash
sudo apt update
sudo apt full-upgrade -y
sudo apt install -y unattended-upgrades curl unzip tmux htop
sudo dpkg-reconfigure -plow unattended-upgrades    # choose Yes
```

> [!TIP] `unattended-upgrades` installs security updates automatically. If a kernel update needs a reboot, the file `/var/run/reboot-required` appears. Reboot when convenient (`sudo reboot`). Every service in this guide comes back by itself.

## Step 7: Firewall and SSH Hardening

> [!WARNING] **Follow this order exactly to avoid locking yourself out.** Keep your current BitVise session open throughout.

### 7a. Set up the firewall first

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing

# New SSH port, only from your own IP
sudo ufw allow from <your-home-ip> to any port 22022 proto tcp comment 'SSH'

# TEMPORARY: keep the old port open until the new one is proven (removed in 7d)
sudo ufw allow 22/tcp comment 'SSH temporary'

sudo ufw enable        # type y to confirm
sudo ufw status verbose
```

> [!NOTE] **Home IP changes often?** If your ISP rotates your address, restricting SSH to one IP will lock you out regularly. The fallback below (the Vultr console) always works, but you can also choose to allow the SSH port from anywhere: `sudo ufw allow 22022/tcp`. That is acceptable **only** because password login is disabled in the next step and Fail2ban (Step 8) is watching the port.

### 7b. Edit the SSH configuration

```bash
sudo nano /etc/ssh/sshd_config
```

Set (or add) these lines, removing any leading `#`:

```
Port 22022
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
AllowUsers haloadmin
```

> [!NOTE] Cloud images sometimes ship a drop-in file that overrides these settings. Check for one:

```bash
ls /etc/ssh/sshd_config.d/
sudo grep -ri 'PasswordAuthentication' /etc/ssh/sshd_config.d/
```

If a file there (for example `50-cloud-init.conf`) says `PasswordAuthentication yes`, change it to `no`. Drop-ins are read before the main file, so they win.

Validate the config and look at what SSH will actually use:

```bash
sudo sshd -t && echo "config OK"
sudo sshd -T | grep -Ei '^(port|permitrootlogin|passwordauthentication|pubkeyauthentication|allowusers) '
```

### 7c. Restart SSH and confirm it listens on the new port

```bash
sudo systemctl restart ssh
sudo ss -tlnp | grep sshd
```

You must see `:22022`. On Ubuntu, SSH can be started by a *socket* unit that keeps listening on port 22 and ignores your `Port` line. If `ss` only shows port 22, switch to the normal service:

```bash
sudo systemctl disable --now ssh.socket
sudo systemctl enable --now ssh.service
sudo ss -tlnp | grep sshd
```

### 7d. Test the new port, then remove port 22

1. Open a **second** BitVise session: server IP, port **`22022`**, user `haloadmin`, `publickey`.
2. Only after it works, close the old session and remove the temporary rule:

```bash
sudo ufw status numbered
sudo ufw delete <number-of-the-22/tcp-rule>      # repeat for the IPv6 (v6) 22/tcp rule
sudo ufw status verbose
```

> [!TIP] **If your home IP changes and you're locked out:** open the Vultr control panel, choose **View Console** on the instance, log in there (this bypasses the firewall), and run `sudo ufw allow from <new-ip> to any port 22022 proto tcp`. Then delete the old rule.

## Step 8: Fail2ban

Fail2ban bans IPs that fail logins repeatedly. Its default SSH jail watches the **default port**, so it must be told about `22022`:

```bash
sudo apt install -y fail2ban
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
ignoreip = 127.0.0.1/8 ::1 <your-home-ip>

[sshd]
enabled = true
port = 22022
maxretry = 5
findtime = 10m
bantime = 1h
```

```bash
sudo systemctl enable --now fail2ban
sudo fail2ban-client status sshd
```

## Step 9: Swap File

Small VPS plans have little RAM, so swap is a safety net against the kernel killing your servers:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

Swap is slow compared with RAM and is no substitute for it. See [Appendix C](#appendix-c-memory-budget-and-monitoring).

## Step 10: Limit Journal Size

systemd keeps service logs in the journal, which can grow large over time. Cap it:

```bash
sudo mkdir -p /etc/systemd/journald.conf.d
sudo nano /etc/systemd/journald.conf.d/size.conf
```

```ini
[Journal]
SystemMaxUse=200M
```

```bash
sudo systemctl restart systemd-journald
```

## Step 11: Create the Base Folder

```bash
mkdir -p /home/haloadmin/HaloServers
```

## Part 1 Checklist

| Check                                         | Command                                                        |
| --------------------------------------------- | -------------------------------------------------------------- |
| SSH is on 22022, password login off, root off | `sudo sshd -T \| grep -Ei '^(port\|permitroot\|passwordauth)'` |
| Only intended ports open                      | `sudo ufw status verbose`                                      |
| Fail2ban is watching the right port           | `sudo fail2ban-client status sshd`                             |
| Swap is active                                | `free -h`                                                      |
| Security updates are automatic                | `systemctl status unattended-upgrades`                         |

---

# Part 2: Halo Servers (Wine)

This part runs your Halo CE (SAPP) servers so they:

- keep running after you close BitVise SSH,
- start automatically on boot,
- restart if they crash (but give up cleanly if something is truly broken),
- can be started, stopped and checked from a terminal, one at a time or all together.

## How the Halo services fit together

```
xvfb.service         virtual display :1 (Wine wants a display, even for console apps)
   └─ wineserver.service     ONE shared, persistent wineserver for the Wine prefix
         └─ halo@CTF.service, halo@Slayer.service, ...   one unit per Halo server
                └─ run.sh <name>  →  wine haloceded.exe -path ... -exec ... -port ...
```

Why a separate `wineserver.service`: all servers share one Wine prefix, and so one `wineserver`. If `wineserver` were started by the first Halo service, it would live in that service's cgroup. Stopping that one server would kill `wineserver`, and every other server would die with it. Running it as its own service avoids that, and it saves a lot of RAM compared with one prefix per server.

Because the Halo units `Require` both `xvfb` and `wineserver`, stopping or restarting either of those stops or restarts **every** Halo server. Stopping an individual `halo@NAME` never affects the others.

## Folder layout

Path: `/home/haloadmin/HaloServers`

```
│   haloceded.exe
│   sapp.dll
│   strings.dll
│   motd.txt                    (optional)
│   run.sh                      launcher (systemd calls this)
│   status.sh                   status dashboard
│   halo                        start/stop/restart/status/logs helper
│   servers.conf                the ONE list of server names + ports
│   logs/                       only used by the run.sh menu "Launch all"
│
├───sapp                        GLOBAL shared files (admins.txt, ipbans.txt, ...)
├───cg
│   ├───CTF
│   │   │   init.txt            server startup (sv_name, load, ...)
│   │   ├───sapp
│   │   │   │   commands.txt
│   │   │   │   events.txt
│   │   │   │   init.txt        SAPP settings (lua, mapcycle, etc.)
│   │   │   │   mapcycle.txt
│   │   │   │   mapvotes.txt
│   │   │   └───lua
│   │   ├───saved
│   │   └───savegames
│   ├───Slayer
│   └───KOTH                    (every server follows the same structure as cg/CTF)
├───maps
│       bloodgulch.map
│       bitmaps.map             (these four base maps are required)
│       loc.map
│       sounds.map
│       ui.map
│       ...
```

Rules for your server folders:

- Each server has **two** `init.txt` files, both required:
  - `cg/<ServerName>/init.txt` is read by `haloceded.exe` at launch. It holds basic settings (`sv_name`, `sv_public`, passwords, MOTD) and **must end with the `load` command**, which is what loads SAPP.
  - `cg/<ServerName>/sapp/init.txt` is read by SAPP after the server is up. It holds SAPP-specific settings (Lua, map cycle/vote, prefixes, RCON).
- You do **not** put the port in either file. The launcher passes it from `servers.conf`.
- Server names must not contain spaces, and the folder name must match the name in `servers.conf` exactly.
- The launcher refuses to start a server if `cg/<ServerName>/sapp/mapcycle.txt` is missing, or if any map it lists (or any of the four base maps) is missing from `maps/`. If you use map voting instead of a map cycle, keep a `mapcycle.txt` that lists the same maps.

## Servers and ports

| #   | Server | UDP port |
| --- | ------ | -------- |
| 1   | CTF    | 2302     |
| 2   | Slayer | 2303     |
| 3   | KOTH   | 2304     |

These are examples. Give each server its own UDP port; consecutive ports starting at Halo's default `2302` are the easiest to manage. The list lives in `servers.conf` only. `run.sh`, `status.sh` and `halo` all read it, so they can never disagree. See [Adding a server](#adding-a-halo-server).

## Step 1: Install Wine and Xvfb

```bash
sudo dpkg --add-architecture i386
sudo apt update
sudo apt install -y wine wine32 xvfb
```

> [!NOTE] `wine32` lives in Ubuntu's `universe` repository. If apt can't find it: `sudo add-apt-repository universe && sudo apt update`.

## Step 2: Upload the Server Files

Using BitVise's **New SFTP Window**, copy `haloceded.exe`, `sapp.dll`, `strings.dll`, `maps/`, `sapp/` and `cg/` to `/home/haloadmin/HaloServers`.

## Step 3: Create the Helper Scripts

Four small files live next to `haloceded.exe`. The simplest way to create them is to open each in nano (`nano /home/haloadmin/HaloServers/<file>`), paste the contents below, then save and exit.

```bash
cd /home/haloadmin/HaloServers
nano servers.conf
nano run.sh
nano status.sh
nano halo
```

> [!CAUTION] **Pasted or uploaded from Windows?** Files edited on Windows usually have CRLF line endings, which break shell scripts (you get `bad interpreter: /usr/bin/env bash^M`). The `sed` command below fixes this. Pasting through nano avoids the problem, but running it does no harm.

### `servers.conf`

Edit the names and ports to match your own servers.

```bash
# servers.conf - single source of truth for the Halo server list.
#
# SERVER_NAMES[i] must match the folder name under cg/ and the systemd
# instance name (halo@<name>). SERVER_PORTS[i] is that server's UDP port.
# Both arrays must stay the same length and in the same order.
# Use letters, numbers and underscores only (no spaces).
#
# Copyright (c) 2026. Jericho Crosby (Chalwk)

SERVER_NAMES=(CTF Slayer KOTH)
SERVER_PORTS=(2302 2303 2304)

# To add a server (e.g. a test server on the next port), append to BOTH arrays:
#   SERVER_NAMES=(... Test)
#   SERVER_PORTS=(... 2305)
# then create cg/Test/, open its UDP port in the firewall, and enable halo@Test
```

### `run.sh`

The launcher. systemd calls this with a server name (`./run.sh ctf`). Run with no arguments it shows a menu, which is handy for local testing only.

```bash
#!/usr/bin/env bash
# Halo CE (SAPP) launcher for Wine on Linux.
#
#   ./run.sh <id|name>   Run one server in the foreground (this is what systemd uses).
#   ./run.sh             Interactive menu (local testing only; use ./halo on the VPS).
#
# Environment toggles:
#   HALO_UNIX_PATHS=1    Pass Unix paths to haloceded.exe instead of Windows (Z:\...) paths.
#
# Copyright (c) 2026. Jericho Crosby (Chalwk)

set -uo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

export WINEARCH="${WINEARCH:-win32}"
export WINEPREFIX="${WINEPREFIX:-$HOME/.wine}"
export WINEDLLOVERRIDES="${WINEDLLOVERRIDES:-msvcrt=n,b}"
export WINEDEBUG="${WINEDEBUG:--all}"
export DISPLAY="${DISPLAY:-:1.0}"

readonly RED='\033[31m'
readonly GREEN='\033[32m'
readonly YELLOW='\033[33m'
readonly CYAN='\033[36m'
readonly RESET='\033[0m'

SERVER_CONF="$ROOT/servers.conf"
if [[ ! -f "$SERVER_CONF" ]]; then
    printf "${RED}Missing server list: %s${RESET}\n" "$SERVER_CONF" >&2
    exit 1
fi
# shellcheck source=servers.conf
source "$SERVER_CONF"

if ((${#SERVER_NAMES[@]} != ${#SERVER_PORTS[@]})); then
    printf "${RED}servers.conf: SERVER_NAMES and SERVER_PORTS differ in length.${RESET}\n" >&2
    exit 1
fi

BASE_MAPS=(bitmaps.map loc.map sounds.map ui.map)
MAPS_DIR="$ROOT/maps"
LOG_DIR="$ROOT/logs"

if [[ ! -f "$ROOT/haloceded.exe" ]]; then
    printf "${RED}Could not find haloceded.exe in project root: %s${RESET}\n" "$ROOT" >&2
    exit 1
fi
if ! command -v wine >/dev/null 2>&1; then
    printf "${RED}Could not find 'wine' in PATH.${RESET}\n" >&2
    exit 1
fi

# Matches on the "-port N" argument, so it works regardless of how paths are passed.
is_running() {
    pgrep -f -- "-port $1( |\$)" >/dev/null 2>&1
}

# Directory argument for -path.
wine_dir_arg() {
    local p
    if [[ "${HALO_UNIX_PATHS:-0}" != 1 ]] && p="$(winepath -w "$1" 2>/dev/null)" && [[ -n "$p" ]]; then
        printf '%s\\' "$p"
    else
        printf '%s/' "$1"
    fi
}

# File argument for -exec.
wine_file_arg() {
    local p
    if [[ "${HALO_UNIX_PATHS:-0}" != 1 ]] && p="$(winepath -w "$1" 2>/dev/null)" && [[ -n "$p" ]]; then
        printf '%s' "$p"
    else
        printf '%s' "$1"
    fi
}

read_choice() {
    local title="$1"
    shift
    local -a items=("$@")
    local choice

    printf "\n${CYAN}%s${RESET}\n" "$title"
    for ((i = 0; i < ${#items[@]}; i++)); do
        printf '  %d. %s\n' "$((i + 1))" "${items[$i]}"
    done
    printf '  Q. Quit\n'

    while true; do
        read -r -p 'Select an option: ' choice || { REPLY=-1; return; }
        if [[ "$choice" =~ ^[Qq]$ ]]; then
            REPLY=-1
            return
        fi
        if [[ "$choice" =~ ^[0-9]+$ ]] && ((choice >= 1 && choice <= ${#items[@]})); then
            REPLY=$((choice - 1))
            return
        fi
        printf "${YELLOW}Enter one of the listed numbers, or Q to quit.${RESET}\n"
    done
}

map_exists() {
    local wanted="${1,,}"
    local file name
    for file in "$MAPS_DIR"/*.map; do
        [[ -f "$file" ]] || continue
        name="${file##*/}"
        [[ "${name,,}" == "$wanted" ]] && return 0
    done
    return 1
}

check_maps() {
    local server="$1"
    local mapcycle="$ROOT/cg/$server/sapp/mapcycle.txt"
    local -a cycle_maps=()
    local -a missing=()
    local -A seen_maps=()
    local line map_name lower_name map_file support_file

    if [[ ! -f "$mapcycle" ]]; then
        printf "${RED}Mapcycle file not found: %s${RESET}\n" "$mapcycle"
        return 1
    fi

    while IFS= read -r line || [[ -n "$line" ]]; do
        line="${line%$'\r'}"
        map_name="${line%%[;:]*}"
        map_name="$(printf '%s' "$map_name" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')"
        if [[ -n "$map_name" && "$map_name" != \#* ]]; then
            lower_name="${map_name,,}"
            if [[ -z "${seen_maps[$lower_name]+x}" ]]; then
                cycle_maps+=("$map_name.map")
                seen_maps[$lower_name]=1
            fi
        fi
    done < "$mapcycle"

    mkdir -p -- "$MAPS_DIR"
    for support_file in "${BASE_MAPS[@]}"; do
        map_exists "$support_file" || missing+=("$support_file")
    done
    for map_file in "${cycle_maps[@]}"; do
        map_exists "$map_file" || missing+=("$map_file")
    done

    if ((${#missing[@]} > 0)); then
        printf "${RED}Cannot launch %s. These required map files are missing from '%s':${RESET}\n" "$server" "$MAPS_DIR"
        for map_file in "${missing[@]}"; do
            printf "${RED}  %s${RESET}\n" "$map_file"
        done
        printf "${YELLOW}Place the missing map files in '%s' before launching this server.${RESET}\n" "$MAPS_DIR"
        return 1
    fi
    return 0
}

# launch_server <index> [foreground|exec|background]
#   foreground  run and wait (menu use)
#   exec        replace this shell with wine, so wine is the main process (systemd use)
#   background  detached from the terminal, logs to logs/<server>.log (local testing)
launch_server() {
    local index="$1"
    local mode="${2:-foreground}"
    local server="${SERVER_NAMES[$index]}"
    local port="${SERVER_PORTS[$index]}"
    local server_path="$ROOT/cg/$server"
    local init_file="$server_path/init.txt"

    if [[ ! -d "$server_path" ]]; then
        printf "${RED}Server folder not found: %s${RESET}\n" "$server_path"
        return 1
    fi
    if [[ ! -f "$init_file" ]]; then
        printf "${RED}Init file not found: %s${RESET}\n" "$init_file"
        return 1
    fi
    if ! check_maps "$server"; then
        return 1
    fi
    if is_running "$port"; then
        printf "${YELLOW}%s is already running (UDP %s). Not starting a second copy.${RESET}\n" "$server" "$port"
        return 1
    fi

    local path_arg init_arg
    path_arg="$(wine_dir_arg "$server_path")"
    init_arg="$(wine_file_arg "$init_file")"
    local -a cmd=(wine ./haloceded.exe -path "$path_arg" -exec "$init_arg" -port "$port")

    case "$mode" in
        exec)
            cd -- "$ROOT" || return 1
            exec "${cmd[@]}"
            ;;
        background)
            mkdir -p -- "$LOG_DIR"
            (cd -- "$ROOT" && exec setsid nohup "${cmd[@]}" </dev/null >>"$LOG_DIR/$server.log" 2>&1) &
            printf "${GREEN}Started %s in the background (PID %s). Log: %s${RESET}\n" \
                "$server" "$!" "$LOG_DIR/$server.log"
            ;;
        *)
            printf "${GREEN}Launching %s with Wine...${RESET}\n" "$server"
            (cd -- "$ROOT" && "${cmd[@]}")
            ;;
    esac
}

start_server_argument() {
    local argument="$1"
    local lower_name
    local i

    argument="${argument#-}"
    if [[ "$argument" =~ ^[0-9]+$ ]]; then
        if ((argument < 1 || argument > ${#SERVER_NAMES[@]})); then
            printf "${RED}Server ID must be between 1 and %d.${RESET}\n" "${#SERVER_NAMES[@]}" >&2
            return 2
        fi
        launch_server "$((argument - 1))" exec
        return $?
    fi

    lower_name="${argument,,}"
    for ((i = 0; i < ${#SERVER_NAMES[@]}; i++)); do
        if [[ "${SERVER_NAMES[$i],,}" == "$lower_name" ]]; then
            launch_server "$i" exec
            return $?
        fi
    done
    printf "${RED}Unknown server '%s'. Choose one of: %s.${RESET}\n" "$argument" "${SERVER_NAMES[*]}" >&2
    return 2
}

if (($# > 1)); then
    printf "${RED}Specify at most one server by ID or name, for example: ./run.sh 1 or ./run.sh -ctf.${RESET}\n" >&2
    exit 2
elif (($# == 1)); then
    start_server_argument "$1"
    exit $?
fi

printf "${YELLOW}Menu mode is for local testing. On the VPS, manage servers with ./halo (systemd).${RESET}\n"

while true; do
    menu_items=("${SERVER_NAMES[@]}" 'Launch all (background)')
    read_choice 'Select a server to run:' "${menu_items[@]}"
    server_index=$REPLY
    ((server_index < 0)) && break

    if ((server_index < ${#SERVER_NAMES[@]})); then
        launch_server "$server_index"
    else
        for ((i = 0; i < ${#SERVER_NAMES[@]}; i++)); do
            launch_server "$i" background
            sleep 5 # stagger starts so a small VPS is not swamped
        done
    fi
done
```

### `status.sh`

The status dashboard.

```bash
#!/usr/bin/env bash
# Status dashboard for the Halo servers.
#
#   ./status.sh          All servers
#   ./status.sh ctf      One server (case-insensitive; a leading "-" is allowed)
#
# STATUS meanings:
#   RUNNING     systemd service is active
#   RESTARTING  systemd is waiting to restart it after a crash
#   FAILED      systemd gave up (see: journalctl -u halo@NAME -n 50)
#   MANUAL      a server is running on that port outside systemd (e.g. started via run.sh)
#   STOPPED     nothing running
#
# Copyright (c) 2026. Jericho Crosby (Chalwk)

set -uo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

if [[ ! -f "$ROOT/servers.conf" ]]; then
    echo "Missing $ROOT/servers.conf" >&2
    exit 1
fi
# shellcheck source=servers.conf
source "$ROOT/servers.conf"

readonly RED='\033[31m'
readonly GREEN='\033[32m'
readonly YELLOW='\033[33m'
readonly CYAN='\033[36m'
readonly BOLD='\033[1m'
readonly RESET='\033[0m'

filter="${1:-}"
filter="${filter#-}"

# True if something is listening on the given UDP port.
udp_open() {
    ss -H -lun 2>/dev/null | awk -v p=":$1" '$4 ~ (p "$") { f = 1 } END { exit !f }'
}

printf "${BOLD}${CYAN}%-15s %-8s %-14s %-10s %-12s${RESET}\n" "SERVER NAME" "PORT" "STATUS" "PID" "UDP PORT"
printf "%s\n" "-------------------------------------------------------------------"

found=0
for ((i = 0; i < ${#SERVER_NAMES[@]}; i++)); do
    name="${SERVER_NAMES[$i]}"
    port="${SERVER_PORTS[$i]}"

    [[ -n "$filter" && "${name,,}" != "${filter,,}" ]] && continue
    found=1

    state="$(systemctl is-active "halo@$name" 2>/dev/null || true)"
    pid="$(pgrep -f -- "-port $port( |\$)" 2>/dev/null | head -n 1 || true)"

    case "$state" in
        active)     status="${GREEN}RUNNING${RESET}" ;;
        activating) status="${YELLOW}RESTARTING${RESET}" ;;
        failed)     status="${RED}FAILED${RESET}" ;;
        *)
            if [[ -n "$pid" ]]; then
                status="${YELLOW}MANUAL${RESET}"
            else
                status="${RED}STOPPED${RESET}"
            fi
            ;;
    esac

    if udp_open "$port"; then
        udp="${GREEN}OPEN${RESET}"
    else
        udp="${RED}CLOSED${RESET}"
    fi

    printf "%-15s %-8s %-23b %-10s %-21b\n" "$name" "$port" "$status" "${pid:--}" "$udp"
done

if ((!found)); then
    printf "${RED}Unknown server '%s'. Choose one of: %s.${RESET}\n" "$filter" "${SERVER_NAMES[*]}" >&2
    exit 2
fi
```

### `halo`

The helper you will use day to day. It wraps `systemctl` so you don't have to remember unit names.

```bash
#!/usr/bin/env bash
# halo - start/stop/restart/status/logs for the Halo servers (systemd wrapper).
#
#   ./halo start   [server|all]
#   ./halo stop    [server|all]
#   ./halo restart [server|all]
#   ./halo status  [server|all]
#   ./halo logs    <server>
#   ./halo enable  [server|all]    start at boot
#   ./halo disable [server|all]
#
# Server names are case-insensitive. Default target is "all".
#
# Copyright (c) 2026. Jericho Crosby (Chalwk)

set -uo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

if [[ ! -f "$ROOT/servers.conf" ]]; then
    echo "Missing $ROOT/servers.conf" >&2
    exit 1
fi
# shellcheck source=servers.conf
source "$ROOT/servers.conf"

usage() {
    echo "Usage: ./halo {start|stop|restart|status|logs|enable|disable} [server|all]" >&2
    echo "Servers: ${SERVER_NAMES[*]}" >&2
    exit 2
}

SUDO=""
((EUID != 0)) && SUDO="sudo"

action="${1:-}"
target="${2:-all}"
[[ -z "$action" ]] && usage

# Case-insensitive name -> canonical name.
resolve() {
    local s
    for s in "${SERVER_NAMES[@]}"; do
        if [[ "${s,,}" == "${1,,}" ]]; then
            printf '%s' "$s"
            return 0
        fi
    done
    return 1
}

if [[ "$target" == all ]]; then
    names=("${SERVER_NAMES[@]}")
else
    if ! single="$(resolve "$target")"; then
        echo "Unknown server '$target'. Choose one of: ${SERVER_NAMES[*]}" >&2
        exit 2
    fi
    names=("$single")
fi

case "$action" in
    start|restart)
        $SUDO systemctl start xvfb wineserver || exit 1
        for n in "${names[@]}"; do
            echo "$action $n"
            $SUDO systemctl "$action" "halo@$n"
            # Stagger so a 1 vCPU / 1 GB VPS is not swamped.
            [[ "$target" == all ]] && sleep 5
        done
        ;;
    stop|enable|disable)
        for n in "${names[@]}"; do
            echo "$action $n"
            $SUDO systemctl "$action" "halo@$n"
        done
        ;;
    status)
        if [[ "$target" == all ]]; then
            "$ROOT/status.sh"
        else
            "$ROOT/status.sh" "${names[0]}"
        fi
        ;;
    logs)
        if [[ "$target" == all ]]; then
            echo "Give a server name, e.g. ./halo logs ctf" >&2
            exit 2
        fi
        journalctl -u "halo@${names[0]}" -f
        ;;
    *)
        usage
        ;;
esac
```

### Make them executable

```bash
cd /home/haloadmin/HaloServers
sed -i 's/\r$//' run.sh status.sh halo servers.conf
chmod +x run.sh status.sh halo
```

> [!TIP] Re-run that `sed` line any time you re-upload a script from Windows.

## Step 4: Create the Wine Prefix (One Time)

```bash
Xvfb :1 -screen 0 1024x768x16 &     # temporary, only for this step
sleep 2
WINEARCH=win32 WINEPREFIX=$HOME/.wine WINEDLLOVERRIDES="mscoree,mshtml=" DISPLAY=:1.0 wineboot --init
kill %1                             # stop the temporary Xvfb
```

The `mscoree,mshtml=` override stops Wine asking to download Mono and Gecko, which a headless server doesn't need.

## Step 5: Create the systemd Units

Three unit files are needed. Create each with nano and paste the contents below.

1. `sudo nano /etc/systemd/system/xvfb.service`

```ini
[Unit]
Description=Xvfb virtual display :1 (for Wine)
After=network.target

[Service]
Type=simple
User=haloadmin
ExecStart=/usr/bin/Xvfb :1 -screen 0 1024x768x16 -nolisten tcp
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

2. `sudo nano /etc/systemd/system/wineserver.service`

```ini
[Unit]
Description=Persistent wineserver for the Halo servers
After=xvfb.service
Requires=xvfb.service

[Service]
Type=simple
User=haloadmin
Environment="WINEARCH=win32"
Environment="WINEPREFIX=/home/haloadmin/.wine"
Environment="WINEDEBUG=-all"
Environment="DISPLAY=:1.0"
# Verify the path with: which wineserver
ExecStart=/usr/bin/wineserver -f -p
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

3. `sudo nano /etc/systemd/system/halo@.service`

```ini
[Unit]
Description=Halo CE Dedicated Server (%i)
Requires=xvfb.service wineserver.service
After=network.target xvfb.service wineserver.service
# Give up after 5 failed starts in 2 minutes instead of looping forever.
StartLimitIntervalSec=120
StartLimitBurst=5

[Service]
Type=simple
User=haloadmin
WorkingDirectory=/home/haloadmin/HaloServers
Environment="WINEARCH=win32"
Environment="WINEPREFIX=/home/haloadmin/.wine"
Environment="WINEDLLOVERRIDES=msvcrt=n,b"
Environment="WINEDEBUG=-all"
Environment="DISPLAY=:1.0"
# Uncomment if Halo rejects the Windows-style paths run.sh passes by default:
#Environment="HALO_UNIX_PATHS=1"
ExecStart=/usr/bin/bash /home/haloadmin/HaloServers/run.sh %i
Restart=on-failure
RestartSec=10s
TimeoutStopSec=15s

[Install]
WantedBy=multi-user.target
```

Check that `which wineserver` and `which Xvfb` match the paths in the units, then reload systemd:

```bash
sudo systemctl daemon-reload
```

## Step 6: Open the Game Ports

Halo uses **UDP**. Players need to reach these from anywhere, so no source restriction. Open the range that covers your servers:

```bash
sudo ufw allow 2302:2304/udp comment 'Halo servers'
sudo ufw status verbose
```

If a Vultr firewall group is attached to the VPS, open the same UDP range there too.

## Step 7: Test ONE Server by Hand

```bash
sudo systemctl start xvfb wineserver
cd /home/haloadmin/HaloServers
./run.sh ctf
```

Check that SAPP loads and the console is running, then connect from the game to `<vps-ip>:2302`. Stop it with `Ctrl + C`.

If the server won't start or can't find its files, Halo may not like the Windows-style paths that `run.sh` passes by default. Try `HALO_UNIX_PATHS=1 ./run.sh ctf`. If that works, uncomment the `HALO_UNIX_PATHS` line in `halo@.service` and run `sudo systemctl daemon-reload`.

## Step 8: Hand It Over to systemd

```bash
sudo systemctl enable --now xvfb wineserver
sudo systemctl enable --now halo@CTF
```

Close BitVise, reconnect, and run `./halo status ctf`. It should still be `RUNNING`.

**Check that servers are independent:** enable a second one (`sudo systemctl enable --now halo@Slayer`), then stop the first (`./halo stop ctf`). Slayer must keep running. If it dies, `wineserver.service` isn't running properly. Check `systemctl status wineserver`.

## Step 9: Bring Up the Rest, Gradually

```bash
./halo enable all   # start at boot
./halo start all    # starts them one by one, 5 seconds apart
```

Watch RAM while they come up (`free -h`, `top`). See [Appendix C](#appendix-c-memory-budget-and-monitoring).

## Step 10: Reboot Test

```bash
sudo reboot
```

Reconnect after a minute and run `./halo status`. Everything enabled should be back without any action.

## Daily Use: the `halo` Helper

Run from `/home/haloadmin/HaloServers`. Server names are case-insensitive. The default target is `all`.

| Task                    | Command                                |
| ----------------------- | -------------------------------------- |
| Status of everything    | `./halo status`                        |
| Status of one server    | `./halo status ctf`                    |
| Start one server        | `./halo start slayer`                  |
| Start all (staggered)   | `./halo start all`                     |
| Stop one server         | `./halo stop ctf`                      |
| Stop all servers        | `./halo stop all`                      |
| Restart one server      | `./halo restart ctf`                   |
| Restart all (staggered) | `./halo restart all`                   |
| Follow a server's log   | `./halo logs ctf`                      |
| Start at boot / not     | `./halo enable\|disable [server\|all]` |

`./status.sh` and `./status.sh ctf` also work directly. `./halo` uses `sudo`, so it will ask for your password.

### Reading the status table

```
SERVER NAME     PORT     STATUS         PID        UDP PORT
-------------------------------------------------------------------
CTF             2302     RUNNING        14825      OPEN
Slayer          2303     STOPPED        -          CLOSED
KOTH            2304     RESTARTING     -          CLOSED
```

| Status       | Meaning                                                                       |
| ------------ | ----------------------------------------------------------------------------- |
| `RUNNING`    | systemd service is active                                                     |
| `RESTARTING` | it crashed and systemd is waiting to retry                                    |
| `FAILED`     | systemd gave up after 5 failures in 2 minutes. Look at the logs and fix it    |
| `MANUAL`     | running on that port **outside** systemd (e.g. started with `run.sh` by hand) |
| `STOPPED`    | nothing running                                                               |

`UDP PORT` shows whether something is listening on the port. `RUNNING` with `CLOSED` is normal for a few seconds after start.

After a `FAILED` state, once the cause is fixed:

```bash
sudo systemctl reset-failed halo@CTF
./halo start ctf
```

## Talking to a Halo Server Console

A systemd service has no interactive console, so you can't type SAPP commands into it. Options:

- **In-game rcon / admin commands:** work as normal.
- **SAPP `remote_console`** (TCP): configure it in `cg/<server>/sapp/init.txt`. If used, open that TCP port deliberately and restrict its source IP.
- **tmux**, for hands-on debugging only: stop the service (`./halo stop ctf`), then run `tmux new -s ctf` and `./run.sh ctf` inside it. Detach with `Ctrl + B`, then `D`. Start the service again afterwards, or `status` will show `MANUAL`.

Server output (what SAPP prints with `cprint`) goes to the journal: `./halo logs ctf`.

## Adding a Halo Server

1. Create `cg/<NAME>/` with both `init.txt` files, `sapp/` and so on (copy an existing one).
2. Append the name and port to **both** arrays in `servers.conf`. Keep the order the same.
3. Make sure the maps listed in `sapp/mapcycle.txt` are in `maps/`.
4. Open its UDP port: `sudo ufw allow <port>/udp` (or widen the range you opened in Step 6).
5. `./halo enable <name>`, then `./halo start <name>`.

Example for a test server: add `Test` and `2305` to `servers.conf`, create `cg/Test/`, and allow UDP 2305.

## Halo Troubleshooting

| Symptom                                          | Likely cause and fix                                                                                   |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `bad interpreter: ... ^M`                        | Windows line endings. `sed -i 's/\r$//' run.sh status.sh halo servers.conf`.                           |
| Server goes `RESTARTING` then `FAILED`           | `journalctl -u halo@NAME -n 50 --no-pager`. Usually missing maps or a bad `init.txt` path.             |
| `Start request repeated too quickly`             | Hit the start limit. Fix the problem, then `sudo systemctl reset-failed halo@NAME`.                    |
| "Cannot launch ... map files are missing"        | Put the listed `.map` files in `maps/` (the four base maps are also required).                         |
| "Mapcycle file not found"                        | Create `cg/<NAME>/sapp/mapcycle.txt`, even if you use map voting.                                      |
| "already running ... Not starting a second copy" | Something else is on that port (`MANUAL` in status). Find it with `pgrep -af haloceded` and stop it.   |
| All servers die when one is stopped              | `wineserver.service` isn't running or isn't being used. Check `systemctl status wineserver`.           |
| Wine complains about a display                   | `systemctl status xvfb`. It must be running and `DISPLAY=:1.0` must match.                             |
| Halo can't find its init or map files            | Try `HALO_UNIX_PATHS=1` (see [Step 7](#step-7-test-one-server-by-hand)).                               |
| Process is up but nobody can connect             | UDP port closed in UFW or the Vultr firewall. `sudo ufw status`; status table shows `UDP PORT` `OPEN`. |
| Servers randomly vanish                          | Out of memory. See [Appendix C](#appendix-c-memory-budget-and-monitoring).                             |
| Changed a unit file and nothing happened         | `sudo systemctl daemon-reload`, then restart the service.                                              |
| Need to restart Wine itself                      | `sudo systemctl restart wineserver` (this restarts all Halo servers).                                  |

---

# Appendix A: Quick Reference

| Task                     | Command                                              |
| ------------------------ | ---------------------------------------------------- |
| Connect                  | BitVise, port **22022**, user `haloadmin`, publickey |
| All Halo servers         | `cd ~/HaloServers && ./halo status`                  |
| One Halo server          | `./halo start\|stop\|restart\|logs <name>`           |
| Firewall rules           | `sudo ufw status numbered`                           |
| Fail2ban                 | `sudo fail2ban-client status sshd`                   |
| Unblock an IP            | `sudo fail2ban-client set sshd unbanip <ip>`         |
| Memory                   | `free -h`                                            |
| Kernel killed something? | `sudo dmesg -T \| grep -i 'out of memory'`           |
| Reload unit files        | `sudo systemctl daemon-reload`                       |
| Clear a failed state     | `sudo systemctl reset-failed <unit>`                 |
| Reboot required?         | `ls /var/run/reboot-required`                        |

---

# Appendix B: Ports and Firewall

| Port           | Protocol | Source            | Purpose                |
| -------------- | -------- | ----------------- | ---------------------- |
| 22022          | TCP      | your home IP only | SSH                    |
| 2302-2304      | UDP      | anywhere          | Halo servers (players) |
| (all outbound) | any      | n/a               | apt, updates, etc.     |

Anything else should be absent from `sudo ufw status verbose`. When you add a service, add its rule, and when you remove one, delete its rule. If a Vultr firewall group is attached, keep it consistent with UFW.

---

# Appendix C: Memory Budget and Monitoring

Memory is a small VPS's tightest resource. It runs one Wine process per Halo server, plus a shared `wineserver`, `Xvfb` and the OS on top.

**Measure, don't guess.** After everything is up for a while:

```bash
free -h                   # total/used/available RAM and swap
top                       # press M to sort by memory; q to quit
sudo dmesg -T | grep -i 'out of memory'   # evidence the kernel killed something
```

**Rules of thumb:**

- Compare `available` in `free -h` with what you plan to add. Add servers one at a time and re-check.
- Using swap occasionally is fine. If `free -h` shows swap steadily growing and `top` shows `kswapd` busy, the machine is under pressure and gameplay will suffer (lag, rubber-banding, dropped players).
- Cheapest fixes, in order: stop (`./halo disable`) rarely used Halo servers, then upgrade the Vultr plan. You can resize a Vultr instance in the control panel.

Disk is rarely a problem, but `df -h` and `sudo journalctl --disk-usage` are worth an occasional look.

---

# Appendix D: Removal

## Halo servers

```bash
cd /home/haloadmin/HaloServers
./halo disable all
./halo stop all
sudo systemctl disable --now wineserver xvfb
sudo rm /etc/systemd/system/halo@.service /etc/systemd/system/wineserver.service /etc/systemd/system/xvfb.service
sudo ufw delete allow 2302:2304/udp
rm -rf ~/.wine      # optional: delete the Wine prefix
```

## Finish

```bash
sudo systemctl daemon-reload
sudo systemctl reset-failed
```