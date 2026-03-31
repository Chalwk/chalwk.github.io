---
layout: post
title: "Halo PC/CE: Server Port Forwarding"
date: 2026-03-31
author: Jericho Crosby
categories: [ education, halo, modding ]
tags: [ sapp, phasor, halo, server, port-forwarding, tutorial ]
---

So you have set up your Halo PC or Custom Edition server with SAPP or Phasor. It works perfectly on your local network,
but your friends across the internet cannot join. What is missing? **Port forwarding**.

Port forwarding tells your router to direct incoming traffic on specific ports to the machine running your game server.
Without it, outside players cannot reach your server.

This guide walks you through every step: finding your server's local IP, logging into your router, creating forwarding
rules, and configuring your firewall on Windows or Linux.

Let us get your server online.

---

## Step 1: Find Your Server's Local IP Address

You need the local (LAN) IP address of the computer that runs the Halo server. This step works the same whether you use
Windows or Linux.

### On Windows

1. Press `Win + R`, type `cmd`, and press Enter.
2. In the Command Prompt, type `ipconfig` and press Enter.
3. Look for the **IPv4 Address** under your active network adapter. It will look something like `192.168.1.100` or
   `10.0.0.50`. That is your server's local IP.

### On Linux

1. Open a terminal window.
2. Type `ip addr show` or `hostname -I` and press Enter.
3. Look for the `inet` address on your main network interface (usually `eth0` or `wlan0`). It will typically be in the
   `192.168.x.x` or `10.0.x.x` range.

> **Tip:** Write down this IP address. You will need it in Step 4.

---

## Step 2: Log Into Your Router's Admin Page

You do this from any web browser on a device connected to your home network. The operating system does not matter.

1. Open a web browser (Chrome, Firefox, Edge, etc.).
2. Enter your router's gateway IP address into the address bar. Common addresses include:
    - `192.168.1.1`
    - `192.168.0.1`
    - `10.0.0.1`

   (On Windows, you can find the gateway by running `ipconfig` and looking for the "Default Gateway" value.)

3. Enter the administrator username and password when prompted. These are often printed on a sticker on the router
   itself (for example, `admin` / `password`).

> **Warning:** If you changed the login credentials and forgot them, you may need to reset your router to factory
> defaults. That usually involves pressing a small reset button for 10 seconds.

---

## Step 3: Find Port Forwarding Settings

Every router brands this section differently. Look for one of these names:

- **Port Forwarding**
- **Virtual Server**
- **NAT Forwarding**
- **Firewall** (then a sub-tab like "Port Forwarding")
- **Applications & Gaming**

If you cannot find it, search the web for "*[Your Router Model] port forwarding*" - you will likely find a specific
guide.

---

## Step 4: Create Port Forwarding Rules

You need to forward **two UDP ports** for your Halo server to work correctly. Create two separate rules.

### Rule 1: Game Port (Required)

| Field             | Value                                  |
|:------------------|:---------------------------------------|
| **Service Name**  | `Halo (Game Port)`                     |
| **Protocol**      | `UDP`                                  |
| **External Port** | `2302`                                 |
| **Internal Port** | `2302`                                 |
| **Internal IP**   | `Your server's local IP (from Step 1)` |

### Rule 2: Server Port (Match Your Configuration)

| Field             | Value                                  |
|:------------------|:---------------------------------------|
| **Service Name**  | `Halo Server Port`                     |
| **Protocol**      | `UDP`                                  |
| **External Port** | `Your chosen server port (e.g., 2310)` |
| **Internal Port** | `Your chosen server port (e.g., 2310)` |
| **Internal IP**   | `Your server's local IP (from Step 1)` |

> **Important Note on Ports:**
> - The server port can be **any 4-digit number** (examples: 2305, 2310, 2400). But it **must match** the port you set
    in your SAPP or Phasor configuration.
> - **If you play Halo on the same PC that runs your server**, you must avoid a port conflict. To do this:

1. Launch Halo Custom Edition.
2. Go to **Settings -> Network Setup**.
3. Set your **Client Port** to `0`. This lets Halo choose a random unused port.
   This prevents your game client and server from fighting over the same port.

---

## Step 5: Save and Apply

- Click **Save**, **Apply**, or **OK**. Your router will likely process the changes and may briefly disconnect.
- Some routers require a restart for port forwarding to take full effect. If your server still does not appear online
  after a few minutes, try restarting the router.

---

## Step 6: Configure the Firewall (OS Specific)

The machine running your Halo server must also allow incoming traffic on the two UDP ports. The instructions differ
between Windows and Linux.

### For Windows Firewall

Create **one inbound rule** that covers both UDP ports.

1. Press `Win + R`, type `wf.msc`, and press Enter. This opens Windows Firewall with Advanced Security.
2. Click on **Inbound Rules** in the left pane.
3. Click **New Rule...** in the right pane.
4. Select **Port** and click **Next**.
5. Select **UDP** and enter **Specific local ports**: `2302, <your server port>` (for example, `2302, 2310`). Click *
   *Next**.
6. Select **Allow the connection**. Click **Next**.
7. Select all three profiles (Domain, Private, Public). Click **Next**.
8. Give the rule a descriptive name, e.g., `Halo SAPP Server (Ports 2302, 2310)`. Click **Finish**.

> **Tip:** If you have third-party antivirus software with a firewall, you may need to add similar rules there as well.

### For Linux Firewalls

Choose the method that matches your distribution.

#### Method A: Using `ufw` (Ubuntu, Mint, Debian)

```bash
# Allow the specific UDP ports through the firewall
sudo ufw allow 2302/udp
sudo ufw allow 2310/udp  # Replace 2310 with your chosen server port

# Enable the firewall if it is not already active
sudo ufw enable

# Verify the rules were added
sudo ufw status verbose
```

#### Method B: Using `firewalld` (Fedora, CentOS, RHEL)

```bash
# Permanently add the UDP ports to the public zone (or your active zone)
sudo firewall-cmd --permanent --add-port=2302/udp
sudo firewall-cmd --permanent --add-port=2310/udp  # Replace 2310 with your chosen server port

# Reload the firewall to apply changes
sudo firewall-cmd --reload

# List open ports to confirm
sudo firewall-cmd --list-ports
```

#### Method C: Using `iptables` (Universal, but less persistent)

```bash
# Add rules to accept incoming UDP packets on the required ports
sudo iptables -A INPUT -p udp --dport 2302 -j ACCEPT
sudo iptables -A INPUT -p udp --dport 2310 -j ACCEPT  # Replace 2310 with your chosen server port

# To make these rules persistent across reboots, you need to save them.
# The command varies by distribution:
sudo netfilter-persistent save  # On Debian/Ubuntu (if installed)
# or
sudo service iptables save      # On older distributions like CentOS 6
```

---

## Bonus Tips & Troubleshooting

### Static IP / DHCP Reservation

Your server's local IP might change if it gets a new address from the router's DHCP. That would break port forwarding.
To prevent this:

- Set a **static IP** on the server machine itself, or
- Better: Set up a **DHCP reservation** in your router. This ties a specific IP address to your server's MAC address, so
  it never changes.

### Double NAT

If you have two routers in a row (for example, an ISP modem/router plus your own router), you must forward ports on *
*both devices**. This is called Double NAT.

- The best solution is to put the ISP modem into **Bridge Mode**. This makes it act as a simple modem and passes all
  traffic to your main router.
- If you cannot do that, forward ports on the ISP router to your main router's WAN IP, then forward again from your main
  router to your server.

### Check Your Work

Use an online port checker
like [https://www.yougetsignal.com/tools/open-ports/](https://www.yougetsignal.com/tools/open-ports/)
to see if your UDP ports appear open.

- You will need your public IP address. Just search Google for "what is my ip".
- Enter your server port (e.g., 2310) and click Check. Note that UDP checks are less reliable than TCP, but the tool
  will give you a good indication.

### Antivirus Interference

Some third-party antivirus suites include their own firewall. If you have one installed (Norton, McAfee, Bitdefender,
etc.), check its settings and add an exception for your Halo server executable and the two UDP ports.

---

## You Are Now Ready

With port forwarding and firewall rules in place, players from anywhere on the internet should be able to join your Halo
PC/CE server. Test it with a friend or use an online port checker. If something still does not work, double-check:

- Your server's local IP is correct and static.
- Both UDP ports are forwarded in the router.
- The Windows or Linux firewall allows the ports.
- Your server configuration uses the same server port you forwarded.