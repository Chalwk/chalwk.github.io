---
title: "Halo: How to host a Linux VPS (Ubuntu 22.04)"
date: 2025-08-29
last-updated: 2026-10-09
description: "Step-by-step guide to hosting a secure Halo PC / Custom Edition dedicated server (SAPP or Phasor) on a Vultr Ubuntu 22.04 VPS using Wine, TightVNC, UFW and fail2ban."
categories: [ education, halo, vps, linux, server ]
tags: [ ubuntu, wine, vnc, ssh, hosting, tutorial, ufw, fail2ban, vultr ]
toc: false
---

This guide walks you through setting up a **Halo** server on a Linux VPS, from a fresh Ubuntu 22.04 LTS installation to
a fully functional, secure, and remotely manageable server.

We'll use **Wine** to run the Windows-based Halo dedicated server executable, **TightVNC** for a graphical interface
(tunnelled through SSH, never exposed to the internet), and the **Bitvise SSH Client** for secure remote access. Along
the way, we'll harden the server with a firewall, SSH key authentication, and **fail2ban**.

**Estimated time:** 35-60 minutes (longer if you're new to Linux).

---

## What you'll build

```
  Your Windows PC                            Vultr VPS (Ubuntu 22.04)
+-------------------+   SSH, TCP 22992    +--------------------------------+
| Bitvise           |-------------------->| sshd (SSH keys only)           |
|  - terminal       |                     |                                |
|  - SFTP           |   tunnel to :5901   | TightVNC on 127.0.0.1:5901     |
|  - C2S tunnel     |-------------------->|   +- XFCE desktop              |
| TightVNC Viewer   |                     |        +- Wine -> Halo server  |
+-------------------+                     |                                |
                                          | UFW firewall + fail2ban        |
  Halo players  ---------- UDP 2302 ----->|                                |
                                          +--------------------------------+
```

Only two ports are open to the internet: your custom **SSH port** (TCP) and the **Halo server port** (UDP). The desktop
is only reachable through the SSH tunnel.

---

## Before you begin

### Target OS

**Ubuntu 22.04 LTS (Jammy Jellyfish) x64**

These instructions are written specifically for this version. While the core steps (Wine, VNC, UFW) are similar on other
distributions, package names and repository URLs may differ.

> **Why not Ubuntu 24.04?** It changes how SSH starts (systemd socket activation), which means the "change the SSH
> port" step in this guide works differently. Stick to 22.04 LTS for the smoothest experience. Standard security
> updates for 22.04 run until April 2027, which is plenty for a game server you rebuild when needed.

### Prerequisites

Make sure you have the following on your local Windows machine:

| Tool                                                                                                                                                                                             | Purpose                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| [Bitvise SSH Client](https://www.bitvise.com/ssh-client-download)                                                                                                                                | Secure terminal access, file transfers (SFTP) and the VNC tunnel.                                   |
| [TightVNC Viewer](https://www.tightvnc.com/download.php)                                                                                                                                         | Remote desktop connection to the VPS GUI.                                                           |
| [SAPP Server Templates](https://github.com/Chalwk/SPCLib/releases/tag/sapp-server-templates) or [Phasor Server Templates](https://github.com/Chalwk/SPCLib/releases/tag/phasor-server-templates) | Pre-configured server files that work with Wine (`SAPP_PC`, `SAPP_CE`, `Phasor_PC` or `Phasor_CE`). |

### Important notes

- **Security first** - We will create a non-root user, disable password SSH login, use a firewall, and lock down the
  VNC server. Follow each step carefully and in order.
- **Cost** - The recommended VPS plan from Vultr is the **Shared CPU** `vc2-1c-2gb` (1 vCPU, 2GB RAM, 55GB SSD,
  2TB/month bandwidth) for about **\$10/month**. Automatic backups are optional (about \$2/month extra). Prices change,
  so check Vultr's pricing page. You can destroy the VPS anytime to stop charges.
- **Static IP** - Your VPS has a static public IP. Your home IP address is irrelevant for server availability.
- **Your username** - This guide uses `haloadmin` as the non-root user. You can pick another name, but then replace it
  in every command and file path below.
- **Which user runs what** - Steps 3 and 4 start as `root`. From the moment you log in as `haloadmin`, run everything
  as `haloadmin` (use `sudo` where shown), not as `root`.

---

## Step 1: Download and Prepare the Server Template

1. Open the [SAPP server templates](https://github.com/Chalwk/SPCLib/releases/tag/sapp-server-templates) or the
   [Phasor server templates](https://github.com/Chalwk/SPCLib/releases/tag/phasor-server-templates) release page.
2. Download the appropriate archive:
    - From **sapp-server-templates**: `SAPP_PC` (Halo PC) or `SAPP_CE` (Halo Custom Edition).
    - From **phasor-server-templates**: `Phasor_PC` or `Phasor_CE`.

   Both are ready-to-run.
3. Extract the archive on your local computer. You'll now have a folder named after it (e.g., `SAPP_PC`, `SAPP_CE`,
   `Phasor_PC`, or `Phasor_CE`). Keep it handy - we'll upload it to the VPS later.

---

## Step 2: Deploy a New VPS on Vultr

1. Go to the [Vultr Deploy page](https://my.vultr.com/deploy/).
2. Choose **Shared CPU**.
3. Pick a location. Choose the one closest to most of your players - it directly affects their ping.
4. Select your subscription plan (see the cost note above).
5. Select **Ubuntu 22.04 LTS x64** as the operating system.
6. Give your server a hostname (e.g., `halo-server`).
7. Click **Deploy Now**. Wait a few minutes for the instance to be created.
8. From the instance overview page, note the **IP Address**, **Password**, and **Username** (`root`).

> **Keep this page handy.** The Vultr web console (the **View Console** button on the instance page) is your safety
> net. It gives you a login prompt directly on the server, even if you break SSH. We'll rely on it in Step 4.

---

## Step 3: Initial Connection & User Setup via Bitvise

We'll use the `root` password only this one time. Then we'll switch to SSH key authentication.

### Generate a key and connect

1. Open **Bitvise SSH Client**.
2. Fill in the **Host** (your server's IP) and **Username** (`root`). Leave the port at `22` for now.
3. Set **Initial Method** to `password` and enter the password from the Vultr control panel.
4. Open the **Client key manager** (from the Login tab).
5. Click **Generate New**:

   - **Algorithm:** `ed25519` (recommended).
   - **Passphrase:** optional. A passphrase protects the key if someone ever gets hold of the file, so it's a good idea
     on a shared PC or laptop. Leaving it blank means you won't be prompted on every login.
   - Click **Generate**.

6. Highlight your new key and click **Export**, then export the **public key**:

   - Select **Export Public Key**, choose **OpenSSH format**.
   - Save it somewhere easy to find, e.g. `C:\Users\YourUsername\Desktop\bitvise-ssh-public-key.pub`.

7. Export a **private key backup** the same way, using **Export Private Key** in **Bitvise format (text)**, e.g.
   `bitvise-ssh-private-key.bkp`.

   > **Treat the private key like a password.** Never share it, email it, or upload it anywhere public. Store the
   > backup in a password manager or on an encrypted drive, then delete the copy from your Desktop. If you lose the
   > key and your Bitvise profile, you can recover access through the Vultr web console.

8. Back on the **Login** tab, click **Log in**. The first time you connect, Bitvise shows the server's host key
   fingerprint. Choose **Accept and Save**.
9. Click **New terminal console** to open a terminal window.

> **Optional fingerprint check:** On a brand-new server you created seconds ago there's little risk, but if you want
> to verify, open the Vultr **View Console**, log in as `root`, and run
> `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub`. The fingerprint should match what Bitvise showed. If it
> ever changes unexpectedly on a later connection, stop and find out why.

### Create a dedicated user (non-root)

It's a security best practice to run services under a regular user account. You're `root` right now, so `sudo` isn't
needed yet.

```bash
# Create a new user named 'haloadmin' (you can change the name)
adduser haloadmin
# Follow the prompts to set a strong password.
# Leave all optional fields (Full Name, Room Number, etc.) blank.
# Type "y" and press ENTER to confirm.

# Add the new user to the 'sudo' group so they can perform administrative tasks
usermod -aG sudo haloadmin

# Verify the user was added correctly
grep sudo /etc/group
# You should see something like: sudo:x:27:haloadmin
```

> **Don't skip the strong password.** It's what `sudo` asks for, and it's also how you log in through the Vultr web
> console if SSH ever breaks.

### Upload your SSH public key

Now we'll set up key-based authentication for the new user.

```bash
# Create the .ssh folder and authorized_keys file for haloadmin
mkdir -p /home/haloadmin/.ssh
nano /home/haloadmin/.ssh/authorized_keys
```

- Open the `bitvise-ssh-public-key.pub` file you exported earlier in a text editor (like Notepad).
- Copy the entire line (it starts with `ssh-ed25519 AAAA...`). It must stay on **one line**.
- Paste it into the `authorized_keys` file in the terminal.
- Save and exit nano: press `CTRL+O`, then `ENTER`, then `CTRL+X`.

Now set the correct permissions:

```bash
chmod 700 /home/haloadmin/.ssh
chmod 600 /home/haloadmin/.ssh/authorized_keys
chown -R haloadmin:haloadmin /home/haloadmin/.ssh
```

**Leave this root session open** for now. If something goes wrong, you can still fix it from here.

### Test key login

1. Start a **second** Bitvise window (leave the root session running in the first one).
2. Enter the same server IP and set **Username** to `haloadmin`.
3. Set **Initial Method** to `publickey` and pick the key you generated (e.g. `Global 1`).
4. Click **Log in**.
5. Open a new terminal console. Your prompt should now show `haloadmin@your-server-name`.

> **Only proceed if key login works.** If it fails, troubleshoot before moving on (see the
> [troubleshooting table](#troubleshooting) at the end). Once it works, you can close the root session.

**Tip:** In Bitvise, use **Save profile as** so you don't have to retype the host, port and key next time.

---

## Step 4: Harden SSH and Configure the Firewall (UFW)

Now we'll change the SSH port, disable root login, disable password authentication (since we're using keys), and set up
the firewall. **Follow the order carefully to avoid locking yourself out.**

### Edit the SSH configuration

In your `haloadmin` terminal:

```bash
sudo nano /etc/ssh/sshd_config
```

Find these lines, **remove the `#`** at the start of each, and set the values:

```
Port 22992
PermitRootLogin no
PasswordAuthentication no
```

Use any port you like between 1024 and 65535 (22992 is just an example). Save and exit (`CTRL+O`, `ENTER`,
`CTRL+X`).

Next, check whether another file overrides your changes. On Ubuntu, `sshd_config` starts by including every file in
`/etc/ssh/sshd_config.d/`, and **the first value found wins**. Some cloud images ship a file there
(often `50-cloud-init.conf`) that re-enables password logins:

```bash
sudo grep -Ri "PasswordAuthentication" /etc/ssh/sshd_config /etc/ssh/sshd_config.d/
```

If any file in `sshd_config.d` says `PasswordAuthentication yes`, edit that file and change it to `no`.

Now test the configuration and confirm what SSH will actually use:

```bash
# No output means the syntax is fine
sudo sshd -t

# Show the effective settings
sudo sshd -T | grep -Ei '^(port|permitrootlogin|passwordauthentication|kbdinteractiveauthentication) '
```

You should see:

```
port 22992
permitrootlogin no
passwordauthentication no
kbdinteractiveauthentication no
```

**Do NOT restart SSH yet.** We must first open the new SSH port in the firewall.

### Configure UFW

> **Note:** If you need to allow a port range, use the `start:end/protocol` format (for example
> `sudo ufw allow 2010:2315/udp comment 'Halo Server Ports'`).

```bash
# Allow the custom SSH port
sudo ufw allow 22992/tcp comment 'Custom SSH Port'

# Allow the Halo server port (UDP 2302 by default)
sudo ufw allow 2302/udp comment 'Halo Server Port'

# Enable the firewall (it will deny all other incoming connections)
sudo ufw enable
# Type 'y' and press ENTER to confirm.

# Verify the rules
sudo ufw status verbose
```

You should see `22992/tcp` and `2302/udp` set to `ALLOW IN`, and `deny (incoming)` as the default policy.

> **Technical note:** Since this is a public internet server and we're not running the Halo client locally, we only
> need UDP 2302. TCP 2303 is not required.

> **Extra layer (optional):** Vultr also offers a network-level **Firewall** under *Products*. If you use it, allow
> the same two ports there, or you'll block yourself. UFW alone is enough for this guide.

### Restart SSH

```bash
sudo systemctl restart ssh
```

(`sshd` also works as the service name on Ubuntu 22.04.) Your current session stays connected, which is exactly what
we want while testing.

### Test the new SSH port

1. Open a **new** Bitvise window.
2. Enter the server IP and the new port (`22992`).
3. Username: `haloadmin`
4. Initial Method: `publickey`, select your key.
5. Click **Log in**.

> **Only after you have successfully logged in on the new port** should you close the original terminal window and the
> old Bitvise session.

> **Locked out?** Open the Vultr **View Console** and log in as `haloadmin` with your password. Edit
> `/etc/ssh/sshd_config` (or the file in `sshd_config.d`), fix the setting, run `sudo sshd -t`, then
> `sudo systemctl restart ssh`.

### Remove the default SSH port from the firewall

Many Vultr images come with UFW already enabled and port 22 allowed. Check:

```bash
sudo ufw status numbered
```

If you see a rule for port 22 (shown as `22/tcp`, or `OpenSSH`), delete it by name. This removes both the IPv4 and
IPv6 rules and avoids the rule numbers shifting after each delete:

```bash
sudo ufw delete allow 22/tcp
# If it's listed as OpenSSH instead:
# sudo ufw delete allow OpenSSH

# Confirm it's gone
sudo ufw status numbered
```

If there's no port 22 rule, there's nothing to remove.

---

## Step 5: Install Wine and Configure a 32-bit Prefix

With the server secured, it's time to install Wine. We'll set up a 32-bit prefix from the start so Halo's 32-bit server
runs without issues.

Run these commands in the SSH terminal (as `haloadmin`):

```bash
# Enable 32-bit architecture
sudo dpkg --add-architecture i386

# Download and add the WineHQ key
sudo mkdir -pm755 /etc/apt/keyrings
sudo wget -O /etc/apt/keyrings/winehq-archive.key https://dl.winehq.org/wine-builds/winehq.key

# Add the WineHQ repository for Ubuntu 22.04 LTS (Jammy)
sudo wget -NP /etc/apt/sources.list.d/ https://dl.winehq.org/wine-builds/ubuntu/dists/jammy/winehq-jammy.sources

# Update the package list and install system upgrades
sudo apt update
sudo apt upgrade -y

# Install Wine (stable). --install-recommends pulls in the 32-bit components.
sudo apt install --install-recommends winehq-stable -y

# Verify the installation
wine --version
```

You should see a version number like `wine-11.0` or higher.

If the upgrade installed a new kernel, Ubuntu will want a reboot. You can check:

```bash
[ -f /var/run/reboot-required ] && echo "Reboot needed" || echo "No reboot needed"
```

If a reboot is needed, run `sudo reboot`, wait a minute, then log back in as `haloadmin`.

Now create a **32-bit** Wine prefix. The Halo server is 32-bit, and we force the architecture from the very first
Wine command:

```bash
# Set the architecture and prefix location
export WINEARCH=win32
export WINEPREFIX=/home/haloadmin/.wine

# Create and initialise the 32-bit prefix
wineboot --init
```

Because you're in an SSH terminal without a graphical display, Wine may print display-related errors or fail to show
its Mono/Gecko installer prompts. **The prefix is still created** - those messages are safe to ignore. Verify it:

```bash
grep -m1 '#arch' /home/haloadmin/.wine/system.reg
# Expected: #arch=win32
```

> **Seeing "WINEARCH is set to 'win32' but this is not supported in wow64 mode"?** Newer Wine builds use a "new WoW64"
> mode that only supports 64-bit prefixes (Wine 11 deprecates pure 32-bit prefixes). The WineHQ packages for Ubuntu
> 22.04 install separate 64-bit and 32-bit parts and support `win32` prefixes, so you should not see this. If you do,
> your Wine is a new-WoW64 build: delete the failed prefix (`rm -rf ~/.wine`), remove the two `WINEARCH` lines
> here and in `run.sh` (Step 11), and let Wine create its default 64-bit prefix. 32-bit programs such as the Halo
> server still run fine in it.

---

## Step 6: Install and Configure TightVNC & XFCE

To give you a graphical interface for managing the server, we'll install the XFCE desktop environment and TightVNC.

```bash
# Install XFCE and TightVNC (this downloads a few hundred MB, so it takes a few minutes)
sudo apt install xfce4 xfce4-goodies tightvncserver -y

# Start VNC to create its config files (this is temporary)
vncserver
# Set a VNC password (max 8 characters). When asked about a view-only password, choose 'n'.

# Kill the temporary VNC instance
vncserver -kill :1
```

> **About the 8-character limit:** TightVNC only uses the first 8 characters of the password. That's acceptable here
> because VNC will only listen on `localhost` and every connection goes through your SSH tunnel.
> `xfce4-goodies` is optional extras - drop it if you want a lighter install.

### Configure VNC to launch XFCE

Back up the original startup script and create a new one:

```bash
mv ~/.vnc/xstartup ~/.vnc/xstartup.bak
nano ~/.vnc/xstartup
```

Paste the following:

```bash
#!/bin/bash
xrdb $HOME/.Xresources
startxfce4 &
```

Save and exit (`CTRL+O`, `ENTER`, `CTRL+X`). Then make it executable:

```bash
chmod +x ~/.vnc/xstartup
```

---

## Step 7: Create a Systemd Service for VNC (Auto-start on boot)

We'll use a systemd service to start VNC automatically and keep it running. The `-localhost` flag ensures VNC only
accepts connections from the local machine - we'll tunnel through SSH for security.

Create the service file:

```bash
sudo nano /etc/systemd/system/vncserver@.service
```

Paste the following, **replacing `haloadmin` with your actual username** (it appears in four places):

```ini
[Unit]
Description=TightVNC Remote Desktop Service
After=network.target

[Service]
Type=forking
User=haloadmin
Group=haloadmin
WorkingDirectory=/home/haloadmin
PIDFile=/home/haloadmin/.vnc/%H:%i.pid
ExecStartPre=-/usr/bin/vncserver -kill :%i
ExecStart=/usr/bin/vncserver -depth 24 -geometry 1280x720 -localhost :%i
ExecStop=/usr/bin/vncserver -kill :%i

[Install]
WantedBy=multi-user.target
```

Save and exit. Then reload systemd, enable the service and start it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now vncserver@1.service
```

Check that it's running and **only listening on localhost**:

```bash
sudo systemctl status vncserver@1.service --no-pager
ss -ltn | grep 5901
```

The `ss` output should show `127.0.0.1:5901`. If it shows `0.0.0.0:5901`, the `-localhost` flag is missing - fix the
service file before continuing.

> **Service won't start?** Read the log with `journalctl -u vncserver@1.service -n 50 --no-pager`. A common cause is
> a leftover lock file from the temporary VNC instance; clear it with
> `sudo rm -f /tmp/.X1-lock /tmp/.X11-unix/X1` and start the service again.

---

## Step 8: Connect to VNC Securely via Bitvise (SSH Tunnel)

Because we used `-localhost`, you cannot connect directly to the VNC port. Instead, we create an SSH tunnel.

1. In Bitvise, go to the **C2S** (Client-to-Server) tab.
2. Click **Add**.
3. Set:

   - **Listen Interface:** `127.0.0.1`
   - **Listen Port:** `5901`
   - **Destination Host:** `127.0.0.1`
   - **Destination Port:** `5901`

4. Click **OK** to save the rule, then **Log in** (or reconnect) so the tunnel becomes active.
5. Save your Bitvise profile so the rule is remembered.

Now open **TightVNC Viewer** on your local machine:

- **Remote Host:** `127.0.0.1:5901` (if your viewer rejects that, use `127.0.0.1::5901`)
- Enter the VNC password you set in Step 6.
- Click **Connect**.

You should now see the XFCE desktop of your VPS.

> **Important:** Bitvise must remain connected for the tunnel to work. If you close Bitvise, the VNC viewer will
> drop. The desktop itself keeps running on the server, and so does anything you launch in it.

---

## Step 9: Install fail2ban

fail2ban protects against brute-force attacks by temporarily blocking IPs that fail too many login attempts. Since
we disabled password logins this is mostly a bonus, but it keeps bots from hammering your SSH port and filling your
logs.

```bash
sudo apt install fail2ban -y
```

**You must tell fail2ban about your custom SSH port.** By default it only watches and blocks port `22`, which would
leave your real SSH port unprotected. Create a local config:

```bash
sudo nano /etc/fail2ban/jail.local
```

Paste:

```ini
[sshd]
enabled  = true
port     = 22992
maxretry = 5
findtime = 10m
bantime  = 1h
```

Save and exit, then start it and enable it on boot:

```bash
sudo systemctl enable --now fail2ban
sudo systemctl restart fail2ban

# Verify the sshd jail is active
sudo fail2ban-client status sshd
```

You should see the `sshd` jail with a file list and `Currently banned: 0`.

If you ever lock **yourself** out (too many failed logins from your own IP), unban yourself from the Vultr web console
or another connection:

```bash
sudo fail2ban-client set sshd unbanip YOUR_IP_ADDRESS
```

---

## Step 10: Upload Server Files via SFTP

1. In Bitvise, click the **New SFTP window** button.
2. Navigate to `/home/haloadmin/Desktop/` on the VPS. (If the folder doesn't exist yet, connect to VNC once so XFCE
   creates it, or create it with `mkdir -p ~/Desktop`.)
3. On your local computer, locate the extracted server folder (e.g., `SAPP_PC`, `SAPP_CE`, `Phasor_PC`, or
   `Phasor_CE`).
4. Drag and drop the entire folder into the VPS `/home/haloadmin/Desktop/` directory.

This may take a few minutes depending on file size.

> **Faster alternative:** Thousands of small files upload slowly over SFTP. Instead, upload the **zip** file and
> extract it on the server:
>
> ```bash
> sudo apt install unzip -y
> unzip ~/Desktop/SAPP_CE.zip -d ~/Desktop/
> ```
>
> Check the resulting folder name afterwards with `ls ~/Desktop`.

---

## Step 11: Set Up the Launch Script and Desktop Shortcut

Your server template (`SAPP_PC`, `SAPP_CE`, `Phasor_PC`, or `Phasor_CE`) already includes a ready-to-use `run.sh`
script. All you need to do is make it executable and create a desktop shortcut to launch it with a single click.

First, make the existing `run.sh` executable:

```bash
chmod +x /home/haloadmin/Desktop/SAPP_CE/run.sh
```

Replace `SAPP_CE` with the name of your actual server folder (`SAPP_PC`, `Phasor_CE`, etc.) here and in the rest of
this step.

> **If the `run.sh` script is missing**, or if you need to change the **port**, **folder structure**, or any other
> setting, you can create or edit it using **nano**:
>
> ```bash
> nano /home/haloadmin/Desktop/SAPP_CE/run.sh
> ```

The template's `run.sh` looks like this (adjust it if you change the **port** or **folder structure**):

```bash
#!/bin/bash

# Force 32-bit Wine prefix
export WINEARCH=win32
export WINEPREFIX=/home/haloadmin/.wine

# Set server port
PORT=2302

# Get the script directory
ROOT="$(dirname "$(realpath "$0")")"
cd "$ROOT"

# Set paths
CG_PATH="$ROOT/cg"
INIT_FILE="$CG_PATH/init.txt"

# Launch Server
wine "$ROOT/haloceded.exe" -path "$CG_PATH" -exec "$INIT_FILE" -port $PORT
```

Notes:

- **Halo PC vs Custom Edition:** the Custom Edition server executable is `haloceded.exe`. Halo PC uses `haloded.exe`,
  so the PC templates launch that instead.
- **Running more than one server?** Copy the server folder, give each copy its own `PORT`, and open each port in UFW
  (`sudo ufw allow PORT/udp`).
- **Editing on Windows?** Windows editors can save files with `CRLF` line endings, which breaks shell scripts (you'll
  see `bad interpreter: /bin/bash^M`). Use an editor that keeps `LF` endings, or fix the file on the server with
  `sed -i 's/\r$//' run.sh`.

Now create the desktop shortcut:

```bash
nano /home/haloadmin/Desktop/run.desktop
```

Paste the following (change `Name` to whatever you like):

```ini
[Desktop Entry]
Version=1.0
Type=Application
Name=Halo Server
Exec=/home/haloadmin/Desktop/SAPP_CE/run.sh
Path=/home/haloadmin/Desktop/SAPP_CE
Icon=utilities-terminal
Terminal=true
Categories=Game;
```

Save and exit. Next, make the desktop file executable:

```bash
chmod +x /home/haloadmin/Desktop/run.desktop
```

**Using the shortcut:** Double-click the icon on your VPS desktop (inside your VNC session). The first time, Wine may
prompt you to install **Mono** (and possibly **Gecko**) - click **Install** and let it finish. After that, the server
console window will open. You're now ready to host games!

You can close the VNC viewer and Bitvise at any time. The server keeps running because the desktop session lives on the
VPS.

---

## Step 12: Check That Your Server Is Reachable

On the VPS, confirm the server is listening on its UDP port:

```bash
sudo ss -ulnp | grep 2302
```

Then test from the outside. From your Halo client, join the server by IP (`YOUR_SERVER_IP:2302`). In Halo Custom
Edition you can also open the console (launch with `-console`) and run `connect YOUR_SERVER_IP:2302`. Ask a friend to
try as well; a server that works from your own PC but not theirs usually points to a firewall rule (see the
troubleshooting table).

---

## Optional: Start the Halo Server Automatically After a Reboot

VNC already starts on boot, so you can have XFCE launch the server as soon as the desktop session starts:

```bash
mkdir -p ~/.config/autostart
cp ~/Desktop/run.desktop ~/.config/autostart/halo-server.desktop
```

Test it with `sudo reboot`, wait a minute or two, reconnect through Bitvise and VNC, and check the server console is
already open.

> **Note:** This starts the server on boot, but it won't restart it if the server itself crashes. In that case,
> double-click the desktop shortcut again.

---

## Keeping the Server Healthy

- **Updates:** Run `sudo apt update && sudo apt upgrade -y` every few weeks. Ubuntu also installs security updates
  automatically by default. If `/var/run/reboot-required` exists, plan a reboot (`sudo reboot`).
- **Backups:** Before big changes, take a **snapshot** in the Vultr control panel. Also keep a copy of your server
  folder (configs, scripts, ban lists) on your own PC via SFTP.
- **Monitor:** `htop` (`sudo apt install htop`) shows CPU and RAM use. A 2GB plan has plenty of room for one or two
  servers plus the desktop.

---

## Troubleshooting

| Problem                                                              | Likely cause                                               | Fix                                                                                                                             |
| -------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Can't connect after changing the SSH port                            | Firewall rule missing or typo in `sshd_config`             | Log in via the Vultr **View Console**, run `sudo ufw status`, `sudo sshd -t`, fix, then `sudo systemctl restart ssh`.           |
| `Permission denied (publickey)`                                      | Wrong permissions/ownership, or the key was pasted broken  | Re-check the `chmod`/`chown` commands in Step 3 and that `authorized_keys` is a single line. See `sudo tail /var/log/auth.log`. |
| Password login still works                                           | A file in `sshd_config.d` overrides your setting           | Follow the override check in Step 4 and run `sudo sshd -T`.                                                                     |
| VNC viewer: connection refused                                       | Bitvise tunnel not connected, or the service isn't running | Reconnect Bitvise (C2S rule active), then `sudo systemctl status vncserver@1.service`.                                          |
| VNC shows a grey screen with no desktop                              | `xstartup` not executable or XFCE not installed            | Run `chmod +x ~/.vnc/xstartup`, confirm Step 6, restart the service. Check the logs in `~/.vnc/`.                               |
| VNC service fails to start                                           | Stale X lock file                                          | `sudo rm -f /tmp/.X1-lock /tmp/.X11-unix/X1`, then start the service again.                                                     |
| `bad interpreter: /bin/bash^M`                                       | Windows line endings in `run.sh`                           | `sed -i 's/\r$//' run.sh`                                                                                                       |
| `WINEARCH is set to 'win32' but this is not supported in wow64 mode` | Your Wine is a new-WoW64 build                             | See the note at the end of Step 5.                                                                                              |
| Players can't see or join the server                                 | Port closed, wrong port, or Vultr firewall                 | Confirm `sudo ufw status`, that `PORT` in `run.sh` matches the open UDP port, and that any Vultr firewall group allows it.      |
| You banned yourself with fail2ban                                    | Too many failed logins from your IP                        | `sudo fail2ban-client set sshd unbanip YOUR_IP_ADDRESS` from another connection or the web console.                             |

Still stuck? Ask in the support forum on the [Chalwk - Code & Chill Discord](https://discord.gg/VAEb4FXU5) and include
the exact error message and the step you're on.

---

## Next Steps

- Browse ready-made scripts for your server in the
  [SPCLib Script Browser](https://chalwk.github.io/SPCLib/tools/script-browser).
- Learn how to write your own with the
  [Scripting with SAPP guide](https://chalwk.github.io/blog/2026/05/17/halo-scripting-with-sapp/).
- Before granting admin rights by CD-key hash, check it with the
  [CD Key Hash Checker](https://chalwk.github.io/SPCLib/tools/hash-checker).

---

## Optional: Changing Passwords

This section covers how to change the passwords you created during the setup. If you ever need to update your
credentials, follow these steps.

**Which passwords are covered?**

- The `haloadmin` user password (used for `sudo` and local/console login).
- The VNC password (used to connect to the remote desktop).
- (Optional) The SSH key passphrase, if you chose to set one during key generation.

> **The Vultr `root` password** is not changed here. SSH can no longer use it, but it still works on the Vultr web
> console. Keep it safe, and change it from the Vultr control panel if you think it has been exposed.

---

### Change the haloadmin User Password

1. Open a terminal session in Bitvise (as `haloadmin`).
2. Run the `passwd` command:

   ```bash
   passwd
   ```

3. You will be prompted for:
    - Your current password.
    - The new password (type it twice to confirm).
4. After a successful change, the password for `haloadmin` is updated immediately.

> **Note:** This password is used when you run `sudo` commands and if you ever need to log in on the Vultr web console.

---

### Change the VNC Password

The VNC password is stored in the user's home directory and is managed with the `vncpasswd` tool.

1. In your SSH terminal, stop the VNC service first. It must restart anyway to pick up the new password, and stopping
   it avoids confusion about which password is active:

   ```bash
   sudo systemctl stop vncserver@1.service
   ```

   Remember this also stops the Halo server running inside the desktop session.

2. Run the VNC password utility:

   ```bash
   vncpasswd
   ```

3. Enter your new password when prompted (maximum 8 characters). When asked about a view-only password, type `n`.
4. Restart the VNC service:

   ```bash
   sudo systemctl start vncserver@1.service
   ```

5. The new password will be required the next time you connect through your SSH tunnel.

---

### (Optional) Change Your SSH Key Passphrase

If you left the passphrase blank, you can ignore this section.

**If you generated the key in Bitvise** (as in this guide), the key is stored in Bitvise's **Client key manager**, in
Bitvise's own format. Manage its passphrase there. Bitvise's key files are not in OpenSSH format, so the
`ssh-keygen` command below cannot read them.

**If you have an OpenSSH-format private key** (for example one made with `ssh-keygen`), change its passphrase on your
**local Windows machine**:

1. Open a Command Prompt or PowerShell window.
2. Navigate to the folder containing your private key (e.g., `C:\Users\YourUsername\.ssh\`).
3. Run:

   ```powershell
   ssh-keygen -p -f your-private-key-file
   ```

   Replace `your-private-key-file` with the actual filename (e.g., `id_ed25519`).
4. You will be asked for:
    - The old passphrase (if any).
    - The new passphrase (type it twice to confirm).
5. The key is updated in place. You do not need to upload a new public key to the server, because the key pair itself
   remains unchanged; only the encryption of the private key changes.

---
