#!/usr/bin/env bash
set -euo pipefail

# WireGuard VPN one-shot installer for Ubuntu 22.04 (Jammy)
# - Installs required packages
# - Generates secure server and client keys
# - Configures WireGuard server (wg0)
# - Creates a default client config, ready to use
# - Enables IP forwarding and configures UFW with NAT and strict defaults
# - Enables systemd service to start on boot
# - Prints connection instructions for Windows/macOS/Linux/Android
#
# Usage:
#   sudo bash setup-wireguard-ubuntu2204.sh
#
# Optional environment overrides:
#   WG_PORT=51820 WG_NETWORK=10.8.0.0/24 WG_INTERFACE_ADDRESS=10.8.0.1/24 CLIENT_NAME=client1 DNS_SERVERS="1.1.1.1,1.0.0.1" PUBLIC_IP=1.2.3.4 sudo -E bash setup-wireguard-ubuntu2204.sh

trap 'echo "[ERROR] Failed at line $LINENO" >&2' ERR

if [[ ${EUID:-$(id -u)} -ne 0 ]]; then
  echo "Please run this script as root (use sudo)." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

# -------- Configuration (can be overridden via environment variables) --------
WG_IFACE="wg0"
WG_PORT="${WG_PORT:-51820}"
WG_NETWORK="${WG_NETWORK:-10.8.0.0/24}"
WG_INTERFACE_ADDRESS="${WG_INTERFACE_ADDRESS:-10.8.0.1/24}"
CLIENT_NAME="${CLIENT_NAME:-client1}"
CLIENT_ADDRESS="${CLIENT_ADDRESS:-10.8.0.2/32}"
DNS_SERVERS="${DNS_SERVERS:-1.1.1.1,1.0.0.1}"

# -------- Pre-flight checks --------
if ! grep -qs "Ubuntu 22.04" /etc/os-release; then
  echo "[WARN] This script is intended for Ubuntu 22.04. Proceeding anyway..." >&2
fi

# Determine the default outbound network interface (e.g., eth0, ens3)
DEFAULT_WAN_IF=$(ip -4 route list default 2>/dev/null | awk '{print $5; exit}')
if [[ -z "${DEFAULT_WAN_IF}" ]]; then
  DEFAULT_WAN_IF=$(ip route | awk '/default/ {print $5; exit}')
fi
if [[ -z "${DEFAULT_WAN_IF}" ]]; then
  echo "Could not detect default outbound interface. Please set it manually and re-run." >&2
  exit 1
fi

echo "[INFO] Default WAN interface: ${DEFAULT_WAN_IF}"

# Determine a usable public IP (falls back to interface IP if external check fails)
PUBLIC_IP="${PUBLIC_IP:-}"
if [[ -z "${PUBLIC_IP}" ]]; then
  if command -v curl >/dev/null 2>&1; then
    PUBLIC_IP=$(curl -fsS -4 https://ipv4.icanhazip.com || true)
  fi
fi
if [[ -z "${PUBLIC_IP}" ]]; then
  PUBLIC_IP=$(ip -4 addr show "${DEFAULT_WAN_IF}" | awk '/inet /{print $2}' | cut -d/ -f1 | head -n1)
fi
if [[ -z "${PUBLIC_IP}" ]]; then
  echo "Could not determine public IP. Set PUBLIC_IP and re-run." >&2
  exit 1
fi

echo "[INFO] Detected public IP: ${PUBLIC_IP}"

# -------- Package installation --------
echo "[INFO] Installing required packages..."
apt-get update -y
apt-get install -y --no-install-recommends \
  wireguard \
  wireguard-tools \
  qrencode \
  ufw \
  iproute2 \
  curl \
  ca-certificates

# -------- Kernel/IP forwarding --------
# Persistently enable IPv4 forwarding (and IPv6 forwarding; harmless if unused)
echo "[INFO] Enabling IP forwarding..."
install -d -m 755 /etc/sysctl.d
cat >/etc/sysctl.d/99-wireguard-forwarding.conf <<EOF
# Enable IPv4/IPv6 forwarding for WireGuard VPN
net.ipv4.ip_forward=1
net.ipv6.conf.all.forwarding=1
EOF
sysctl --system >/dev/null 2>&1 || sysctl -p /etc/sysctl.d/99-wireguard-forwarding.conf

# -------- WireGuard keys and configuration --------
echo "[INFO] Generating WireGuard keys..."
install -d -m 700 /etc/wireguard
umask 077

# Server keypair
wg genkey | tee /etc/wireguard/server_private.key | wg pubkey > /etc/wireguard/server_public.key

# Client keypair
wg genkey | tee /etc/wireguard/${CLIENT_NAME}_private.key | wg pubkey > /etc/wireguard/${CLIENT_NAME}_public.key

# Optional pre-shared key for an extra layer of security
wg genpsk > /etc/wireguard/${CLIENT_NAME}.psk

# Read keys into variables
SERVER_PRIVATE_KEY=$(cat /etc/wireguard/server_private.key)
SERVER_PUBLIC_KEY=$(cat /etc/wireguard/server_public.key)
CLIENT_PRIVATE_KEY=$(cat /etc/wireguard/${CLIENT_NAME}_private.key)
CLIENT_PUBLIC_KEY=$(cat /etc/wireguard/${CLIENT_NAME}_public.key)
CLIENT_PSK=$(cat /etc/wireguard/${CLIENT_NAME}.psk)

chmod 600 /etc/wireguard/*

# Create server configuration
# Notes:
# - SaveConfig=false so we keep a clean, declarative config on disk
# - Firewall/NAT is handled via UFW configuration below (not PostUp/PostDown iptables here)
echo "[INFO] Writing /etc/wireguard/${WG_IFACE}.conf ..."
cat >/etc/wireguard/${WG_IFACE}.conf <<EOF
[Interface]
Address = ${WG_INTERFACE_ADDRESS}
ListenPort = ${WG_PORT}
PrivateKey = ${SERVER_PRIVATE_KEY}
SaveConfig = false

[Peer]
# ${CLIENT_NAME}
PublicKey = ${CLIENT_PUBLIC_KEY}
PresharedKey = ${CLIENT_PSK}
AllowedIPs = ${CLIENT_ADDRESS}
EOF

chmod 600 /etc/wireguard/${WG_IFACE}.conf

# -------- UFW firewall + NAT configuration --------
echo "[INFO] Configuring UFW (firewall and NAT)..."

# Ensure UFW allows SSH to prevent lockout; prefer profile name if present
ufw allow OpenSSH >/dev/null 2>&1 || ufw allow 22/tcp >/dev/null 2>&1 || true

# Allow WireGuard UDP port
ufw allow ${WG_PORT}/udp >/dev/null 2>&1 || true

# Set secure defaults: deny incoming, allow outgoing
ufw default deny incoming >/dev/null 2>&1 || true
ufw default allow outgoing >/dev/null 2>&1 || true

# Ensure forward policy is ACCEPT so routed VPN traffic can pass through
if grep -q '^\s*DEFAULT_FORWARD_POLICY=' /etc/default/ufw; then
  sed -i 's/^\s*DEFAULT_FORWARD_POLICY=.*/DEFAULT_FORWARD_POLICY="ACCEPT"/' /etc/default/ufw
else
  echo 'DEFAULT_FORWARD_POLICY="ACCEPT"' >> /etc/default/ufw
fi

# Add NAT (masquerade) for the VPN subnet via the WAN interface, if not already present
if ! grep -q "^# START_WIREGUARD_NAT" /etc/ufw/before.rules 2>/dev/null; then
  tmpfile=$(mktemp)
  cat >"${tmpfile}" <<EOF
# START_WIREGUARD_NAT
*nat
:POSTROUTING ACCEPT [0:0]
-A POSTROUTING -s ${WG_NETWORK} -o ${DEFAULT_WAN_IF} -j MASQUERADE
COMMIT
# END_WIREGUARD_NAT

EOF
  # Prepend NAT block before existing rules to ensure proper order
  if [[ -f /etc/ufw/before.rules ]]; then
    cat /etc/ufw/before.rules >>"${tmpfile}"
  fi
  mv "${tmpfile}" /etc/ufw/before.rules
else
  # Update MASQUERADE rule within existing block to reflect current settings
  awk -v net="${WG_NETWORK}" -v ifc="${DEFAULT_WAN_IF}" '
    BEGIN {inblock=0}
    /^# START_WIREGUARD_NAT/ {inblock=1; print; next}
    /^# END_WIREGUARD_NAT/ {inblock=0; print; next}
    {
      if (inblock && $0 ~ /^-A POSTROUTING -s /) {
        print "-A POSTROUTING -s " net " -o " ifc " -j MASQUERADE";
        next
      }
      print
    }
  ' /etc/ufw/before.rules > /etc/ufw/before.rules.tmp && mv /etc/ufw/before.rules.tmp /etc/ufw/before.rules
fi

# Allow routing between wg and WAN interfaces
ufw route allow in on ${WG_IFACE} out on ${DEFAULT_WAN_IF} >/dev/null 2>&1 || true
ufw route allow in on ${DEFAULT_WAN_IF} out on ${WG_IFACE} >/dev/null 2>&1 || true

# Enable UFW non-interactively
ufw --force enable >/dev/null 2>&1 || true
ufw reload >/dev/null 2>&1 || true

# -------- Enable and start WireGuard --------
echo "[INFO] Enabling and starting WireGuard (${WG_IFACE})..."
systemctl enable wg-quick@${WG_IFACE}.service >/dev/null 2>&1 || true
systemctl restart wg-quick@${WG_IFACE}.service

# -------- Create client configuration --------
echo "[INFO] Creating client configuration for ${CLIENT_NAME}..."
CLIENT_CONF_PATH=/root/${CLIENT_NAME}-${WG_IFACE}.conf
cat >"${CLIENT_CONF_PATH}" <<EOF
[Interface]
PrivateKey = ${CLIENT_PRIVATE_KEY}
Address = ${CLIENT_ADDRESS}
DNS = ${DNS_SERVERS}

[Peer]
PublicKey = ${SERVER_PUBLIC_KEY}
PresharedKey = ${CLIENT_PSK}
AllowedIPs = 0.0.0.0/0
Endpoint = ${PUBLIC_IP}:${WG_PORT}
PersistentKeepalive = 25
EOF
chmod 600 "${CLIENT_CONF_PATH}"

# Also generate a QR code image for mobile clients (optional)
if command -v qrencode >/dev/null 2>&1; then
  qrencode -o "/root/${CLIENT_NAME}-${WG_IFACE}.png" -r "${CLIENT_CONF_PATH}" || true
fi

# -------- Final output / instructions --------
echo
echo "============================================================"
echo "WireGuard VPN is configured and running on Ubuntu 22.04"
echo "============================================================"
echo
ip -4 addr show ${WG_IFACE} | awk '/inet /{print "[INFO] " $2 " is assigned to interface ${WG_IFACE}"}' || true
systemctl is-active wg-quick@${WG_IFACE}.service >/dev/null 2>&1 && echo "[INFO] Service wg-quick@${WG_IFACE} is active." || echo "[WARN] Service wg-quick@${WG_IFACE} is not active. Check: journalctl -u wg-quick@${WG_IFACE}"
echo

echo "Server public IP:      ${PUBLIC_IP}"
echo "WireGuard UDP port:    ${WG_PORT}"
echo "VPN network (server):  ${WG_INTERFACE_ADDRESS} (subnet ${WG_NETWORK})"
echo "Client address:        ${CLIENT_ADDRESS}"
echo

echo "Client config path:    ${CLIENT_CONF_PATH}"
if [[ -f "/root/${CLIENT_NAME}-${WG_IFACE}.png" ]]; then
  echo "Client config QR:      /root/${CLIENT_NAME}-${WG_IFACE}.png"
fi

echo
echo "How to connect:"
echo "- Windows/macOS:"
echo "  1) Install the 'WireGuard' app (Windows: wireguard.com/install, macOS: App Store)."
echo "  2) Transfer ${CLIENT_CONF_PATH} to your device and import it, or scan the QR (if using WireGuard for iOS/macOS)."
echo "- Linux:"
echo "  1) Install wireguard-tools (e.g., apt-get install wireguard-tools)."
echo "  2) Copy ${CLIENT_CONF_PATH} to, e.g., /etc/wireguard/${CLIENT_NAME}.conf (chmod 600)."
echo "  3) Bring it up with: sudo wg-quick up ${CLIENT_NAME}"
echo "- Android/iOS:"
echo "  1) Install the 'WireGuard' app from the Play Store/App Store."
echo "  2) Option A: Scan the QR (if generated). Option B: Share the .conf to the phone and import."
echo

echo "To download the client config from this server:"
echo "- From your local machine: scp root@${PUBLIC_IP}:${CLIENT_CONF_PATH} ."
echo

echo "Add more clients later by repeating the key generation and adding additional [Peer] entries to /etc/wireguard/${WG_IFACE}.conf."