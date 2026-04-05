---
title: "Halo: How to host a Linux VPS (Ubuntu 22.04)"
date: 2025-08-29
categories: [ education, halo, modding ]
tags: [ sapp, lua, halo, scripting, tutorial ]
---

Welcome to the definitive guide for setting up a **Halo PC/CE dedicated server** on a Linux VPS. Whether you're a
seasoned Halo veteran or a budding server admin, this walkthrough will take you from a fresh Ubuntu 22.04 LTS instance
to a fully functional, secure, and remotely manageable Halo server.

We'll use **Wine** to run the Windows-based Halo dedicated server executable, **TightVNC** (or the optional **X2Go**)
for a graphical interface, and **BitVise SSH Client** for secure remote access. Along the way, we'll harden the server
with a firewall, SSH key authentication, and **fail2ban** to keep your new server safe.

**Estimated time:** 35-60 minutes (especially if you're new to Linux).

---

## Target OS

**Ubuntu 22.04 LTS (Jammy Jellyfish) x64**  
These instructions are written specifically for this version. While the core steps (Wine, VNC, UFW) are similar on other
distributions, package names and repository URLs may differ. For the smoothest experience, stick to Ubuntu 22.04 LTS.

---

## Prerequisites

Before we begin, make sure you have the following tools on your local Windows machine:

| Tool                                                                                            | Purpose                                                                                                           |
|-------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| [BitVise SSH Client](https://www.bitvise.com/ssh-client-download)                               | Secure terminal access and file transfers (SFTP).                                                                 |
| [TightVNC Viewer](https://www.tightvnc.com/download.php)                                        | Remote desktop connection to the VPS GUI (used before we upgrade to X2Go).                                        |
| [HPC/CE Server Template](https://github.com/Chalwk/HALO-SCRIPT-PROJECTS/releases/tag/ReadyToGo) | Pre‑configured server files that work flawlessly with Wine. Download either `HPC_Server.zip` or `HCE_Server.zip`. |

**Important notes before you start:**

- **Security First** - We will create a non‑root user, disable password SSH login, use a firewall, and lock down the VNC
  server. Follow each step carefully.
- **Cost** - The recommended VPS plan from Vultr is the **Shared CPU** `vc2-1c-2gb` (1 vCPU, 2GB RAM, 55GB SSD,
  2TB/month bandwidth) for **\$10/month**. Automatic backups are optional ($2 extra). You can destroy the VPS anytime to
  stop charges.
- **Static IP** - Your VPS will have a static public IP. Your home IP address is irrelevant for server availability.

---

## Step 1: Download and Prepare the Server Template

1. Visit the [ReadyToGo releases page](https://github.com/Chalwk/HALO-SCRIPT-PROJECTS/releases/tag/ReadyToGo).
2. Download either `HPC_Server.zip` (for Halo PC) or `HCE_Server.zip` (for Halo Custom Edition).
3. Extract the ZIP file on your local computer. You'll now have a folder named `HPC_Server` or `HCE_Server`.
   Keep it handy - we'll upload it to the VPS later.

---

## Step 2: Deploy a New VPS on Vultr

1. Go to the [Vultr Deploy page](https://my.vultr.com/deploy/).
2. Choose **Shared CPU**.
3. Pick a location (e.g., New York (NJ), US).
4. Select your subscription plan (see the cost recommendation above).
5. Click **Configure Software** and select **Ubuntu 22.04 LTS x64**.
6. Give your server a hostname (e.g., `halo-server`).
7. Click **Deploy Now**. Wait a few minutes for the instance to be created.
8. From the instance overview page, note the **IP Address**, **Password**, and **Username** (`root`).

---

## Step 3: Initial Connection & User Setup via BitVise

We'll use password login only this one time. Then we'll switch to SSH key authentication.

1. Open **BitVise SSH Client**.
2. Fill in the **Host** (your server's IP) and **Username** (`root`).
3. Set **Initial Method** to `password` and check **Store encrypted password in profile**. Enter the password from the
   Vultr control panel.
4. Go to the **Client key manager** (from the Login tab).
5. Click **Generate New**:

- **Algorithm:** `ed25519` (recommended).
- Leave passphrase blank unless you want to type it each time you log in.
- Click **Generate**.

6. Highlight your new key and click **Export**:

- Select **Export Public Key**.
- Select **OpenSSH format**.
- Click **Export** and save the file somewhere safe, e.g., `C:\Users\YourUsername\Desktop\halo-server-key.pub`.

7. Back on the **Login** tab, log in as `root`. If you see a host key warning, verify the fingerprint matches the one
   shown in your Vultr control panel (Overview tab) and accept it.
8. Click **New Terminal Console** to open a terminal window.

### Create a dedicated user (non‑root)

It's a security best practice to run services under a regular user account.

```bash
# Create a new user named 'haloadmin' (you can change the name)
sudo adduser haloadmin
# Follow the prompts to set a strong password.
# Leave all optional fields (Full Name, Room Number, etc.) blank.
# Type "y" and press ENTER to confirm.

# Add the new user to the 'sudo' group so they can perform administrative tasks
usermod -aG sudo haloadmin

# Verify the user was added correctly
grep sudo /etc/group
# You should see something like: sudo:x:27:ubuntu,haloadmin
```

### Upload your SSH public key

Now we'll set up key‑based authentication for the new user.

```bash
# Create the .ssh folder and authorized_keys file for haloadmin
mkdir -p /home/haloadmin/.ssh
nano /home/haloadmin/.ssh/authorized_keys
```

- Open the `halo-server-key.pub` file you exported earlier in a text editor (like Notepad).
- Copy the entire line (it starts with `ssh-ed25519 AAAA...`).
- Paste it into the `authorized_keys` file in the terminal.
- Save and exit: press `CTRL+S`, then `CTRL+X`.

Now set the correct permissions:

```bash
chmod 700 /home/haloadmin/.ssh
chmod 600 /home/haloadmin/.ssh/authorized_keys
chown -R haloadmin:haloadmin /home/haloadmin/.ssh
```

Close the terminal console.

### Test key login

1. In BitVise, go back to the **Login** tab.
2. Log out of the root session.
3. Log in as `haloadmin`:

- **Initial Method** = `publickey`
- **Client key** = the key you generated (Global 1)
- Click **Log In**

4. Once logged in, open a new terminal console. Your prompt should now show `haloadmin@your-server-name`.

> **Only proceed if key login works.** If it fails, troubleshoot before moving on.

---

## Step 4: Harden SSH and Configure the Firewall (UFW)

Now we'll change the SSH port, disable root login, disable password authentication (since we're using keys), and set up
the firewall. **Follow the order carefully to avoid locking yourself out.**

First, edit the SSH configuration file:

```bash
sudo nano /etc/ssh/sshd_config
```

Find and change (or add) these lines:

```
Port 22992                     # Change to a custom port (e.g., 22992)
PermitRootLogin no
PasswordAuthentication no
```

Save and exit (`CTRL+S`, `CTRL+X`).

**Do NOT restart SSH yet.** We must first open the new SSH port in the firewall and allow the Halo server port.

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

> **Technical note:** Since this is a public internet server and we're not running the Halo client locally, we only need
> UDP 2302. TCP 2303 is not required.

**Now restart SSH:**

```bash
sudo systemctl restart sshd
```

### Test the new SSH port

1. Open a **new** BitVise session.
2. Enter the server IP and the new port (`22992`).
3. Username: `haloadmin`
4. Initial Method: `publickey`, select your key.
5. Click **Log In**.

> **Only after you have successfully logged in on the new port** should you close the original terminal window and the
> old BitVise session.

Now we can remove the default SSH port (22) from the firewall:

```bash
# Show rules with numbers
sudo ufw status numbered

# Delete the rules for 22/tcp (replace X and Y with the numbers shown for IPv4 and IPv6)
sudo ufw delete X
sudo ufw delete Y
```

---

## Step 5: Install Wine

With the server secured, it's time to install Wine. Run these commands in the SSH terminal:

```bash
# Enable 32-bit architecture
sudo dpkg --add-architecture i386

# Download and add the WineHQ key
sudo mkdir -pm755 /etc/apt/keyrings
sudo wget -O /etc/apt/keyrings/winehq-archive.key https://dl.winehq.org/wine-builds/winehq.key

# Add the WineHQ repository for Ubuntu 22.04 LTS (Jammy)
sudo wget -NP /etc/apt/sources.list.d/ https://dl.winehq.org/wine-builds/ubuntu/dists/jammy/winehq-jammy.sources

# Update the package list
sudo apt update

# Install system upgrades (recommended)
sudo apt upgrade -y

# Install Wine (stable)
sudo apt install --install-recommends winehq-stable -y

# Verify the installation
wine --version
```

You should see a version number like `wine-7.0.x` or higher.

---

## Step 6: Install and Configure TightVNC & XFCE

To give you a graphical interface for managing the server, we'll install the XFCE desktop environment and TightVNC.

```bash
# Install XFCE and TightVNC
sudo apt install xfce4 xfce4-goodies tightvncserver -y

# Start VNC to create its config files (this is temporary)
vncserver
# Set a VNC password (max 8 characters). Optionally create a view‑only password (choose 'n').

# Kill the temporary VNC instance
vncserver -kill :1
```

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

Save and exit. Then make it executable:

```bash
chmod +x ~/.vnc/xstartup
```

---

## Step 7: Create a Systemd Service for VNC (Auto‑start on boot)

We'll use a systemd service to start VNC automatically and keep it running. The `-localhost` flag ensures VNC only
accepts connections from the local machine - we'll tunnel through SSH for security.

Create the service file:

```bash
sudo nano /etc/systemd/system/vncserver@.service
```

Paste the following, **replacing `haloadmin` with your actual username**:

```ini
[Unit]
Description = TightVNC Remote Desktop Service
After = syslog.target network.target

[Service]
Type = forking
User = haloadmin
Group = haloadmin
WorkingDirectory = /home/haloadmin
PIDFile = /home/haloadmin/.vnc/%H:%i.pid
ExecStartPre = -/usr/bin/vncserver -kill :%i > /dev/null 2>&1
ExecStart = /usr/bin/vncserver -depth 24 -geometry 1280x720 -localhost :%i
ExecStop = /usr/bin/vncserver -kill :%i

[Install]
WantedBy = multi-user.target
```

Save and exit. Then reload systemd and enable the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable vncserver@1.service
sudo systemctl start vncserver@1.service
```

---

## Step 8: Connect to VNC Securely via BitVise (SSH Tunnel)

Because we used `-localhost`, you cannot connect directly to the VNC port. Instead, we create an SSH tunnel.

1. In BitVise, go to the **C2S** (Client‑to‑Server) tab.
2. Click **Add**.
3. Set:

- **Listen Interface:** `127.0.0.1`
- **Listen Port:** `5901`
- **Destination Host:** `127.0.0.1`
- **Destination Port:** `5901`

4. Click **OK** to save the rule.

Now open **TightVNC Viewer** on your local machine:

- **VNC Server:** `127.0.0.1:5901`
- Enter the VNC password you set in Step 6.
- Click **Connect**.

You should now see the XFCE desktop of your VPS.

> **Important:** BitVise must remain connected for the tunnel to work. If you close BitVise, the VNC connection will
> drop.

---

## Step 9: Install Fail2ban

Fail2ban protects against brute‑force attacks by temporarily blocking IPs that fail too many login attempts.

```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
```

No additional configuration is needed for basic protection.

---

## Step 10: Upload Server Files via SFTP

1. In BitVise, click the **New SFTP Window** button.
2. Navigate to `/home/haloadmin/` on the VPS.
3. On your local computer, locate the extracted `HPC_Server` or `HCE_Server` folder.
4. Drag and drop the entire folder into the VPS `/home/haloadmin/` directory.

This may take a few minutes depending on file size.

---

## Step 11: Create a Desktop Shortcut for Your Server

To make launching the server easy, we'll create a script and a desktop icon.

First, create a launch script inside your server folder:

```bash
nano /home/haloadmin/HCE_Server/run.sh
```

Paste the following (adjust the path and port if needed):

```bash
#!/bin/bash
cd "/home/haloadmin/HCE_Server"
wineconsole haloceded.exe -path "cg/" -exec "cg/init.txt" -port 2302
```

Save and exit. Make it executable:

```bash
chmod +x /home/haloadmin/HCE_Server/run.sh
```

Now create the desktop shortcut:

```bash
nano /home/haloadmin/Desktop/run.desktop
```

Paste:

```ini
[Desktop Entry]
Version = 1.0
Type = Application
Name = RENAME_THIS
Exec = /home/haloadmin/HCE_Server/run.sh
Icon = utilities-terminal
Categories = Game;
```

Save and exit. Then make the desktop file executable:

```bash
chmod +x /home/haloadmin/Desktop/run.desktop
```

**Using the shortcut:** Double‑click the icon on your VPS desktop. The first time, Wine will prompt you to install *
*Mono** - click **Install** and let it finish. After that, the server console window will open. You're now ready to host
games!

---

## Step 12: (Optional, Recommended) Upgrade to X2Go

TightVNC works but can be laggy. **X2Go** uses a more efficient protocol, giving you a faster and more responsive remote
desktop. It also allows you to disconnect and reconnect to your session.

### On the VPS (via SSH):

```bash
sudo apt install x2goserver x2goserver-xsession -y
```

### On your Windows PC:

1. Download and install the [X2Go Client](https://wiki.x2go.org/doku.php/doc:installation:x2goclient).
2. Open the X2Go Client and create a new session:

- **Session Name:** `Halo Server`
- **Host:** Your VPS IP address
- **Login:** `haloadmin`
- **SSH Port:** `22992` (or your custom port)
- **Session Type:** `XFCE`

3. Click **OK** to save.
4. Select the session and click **Session** → **Start**.

You'll now have a much smoother desktop experience.

> **Note:** X2Go uses your existing SSH connection for tunneling. Once you confirm it works, you can stop and disable
> VNC if you prefer:
> ```bash
> sudo systemctl stop vncserver@1.service
> sudo systemctl disable vncserver@1.service
> ```

---

## Wrapping Up

From here, you can customize your server settings, install mods, and manage the server via the graphical desktop or
directly from the terminal. Enjoy hosting!