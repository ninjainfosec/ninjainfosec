#!/usr/bin/env bash

set -euo pipefail

# VPN setup script for Ubuntu 22.04
# - Supports WireGuard or OpenVPN
# - Installs packages, configures server, generates a client config
# - Enables UFW firewall + IP forwarding + NAT
# - Enables systemd service to start on boot
# - Prints connection instructions for Windows, macOS, Linux, Android

# Defaults (can be overridden via flags)
VPN_TYPE="wireguard"              # wireguard | openvpn
CLIENT_NAME="client1"
VPN_PORT=""                       # defaults: 51820 (wg) / 1194 (ovpn)
DNS_SERVERS="1.1.1.1,9.9.9.9"    # comma-separated
VPN_SUBNET_CIDR="10.8.0.0/24"     # shared across WG/OpenVPN
WG_SERVER_ADDR="10.8.0.1/24"
OVPN_SERVER_NET="10.8.0.0 255.255.255.0"

# Globals set during runtime
declare WAN_IFACE=""
declare PUBLIC_IP=""

log() {
  echo "[+] $*"
}

err() {
  echo "[!] $*" >&2
}

usage() {
  cat <<EOF
Usage: sudo bash $0 [options]

Options:
  -t, --type [wireguard|openvpn]   VPN type (default: wireguard)
  -n, --client-name NAME           Client name (default: client1)
  -p, --port PORT                  UDP port (default: 51820 for WG, 1194 for OpenVPN)
  -d, --dns CSV                    DNS servers CSV (default: ${DNS_SERVERS})
  -h, --help                       Show this help

Examples:
  sudo bash $0 --type wireguard --client-name alice
  sudo bash $0 -t openvpn -n bob -p 1194 -d 1.1.1.1,9.9.9.9
EOF
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -t|--type)
        VPN_TYPE="${2:-}"; shift 2;;
      -n|--client-name)
        CLIENT_NAME="${2:-}"; shift 2;;
      -p|--port)
        VPN_PORT="${2:-}"; shift 2;;
      -d|--dns)
        DNS_SERVERS="${2:-}"; shift 2;;
      -h|--help)
        usage; exit 0;;
      *)
        err "Unknown option: $1"; usage; exit 1;;
    esac
  done

  if [[ "${VPN_TYPE}" != "wireguard" && "${VPN_TYPE}" != "openvpn" ]]; then
    err "--type must be 'wireguard' or 'openvpn'"; exit 1
  fi

  if [[ -z "${VPN_PORT}" ]]; then
    if [[ "${VPN_TYPE}" == "wireguard" ]]; then
      VPN_PORT="51820"
    else
      VPN_PORT="1194"
    fi
  fi
}

require_root() {
  if [[ "$(id -u)" -ne 0 ]]; then
    err "Run as root or with sudo"; exit 1
  fi
}

check_ubuntu_2204() {
  if [[ -r /etc/os-release ]]; then
    . /etc/os-release
    if [[ "${ID}" != "ubuntu" || "${VERSION_ID}" != "22.04" ]]; then
      err "This script is designed for Ubuntu 22.04. Detected ${ID} ${VERSION_ID}. Proceed at your own risk.";
    fi
  else
    err "/etc/os-release not found; cannot verify OS. Proceeding cautiously."
  fi
}

detect_wan_iface() {
  # Try to detect the default outbound interface
  if WAN_IFACE=$(ip route get 1.1.1.1 2>/dev/null | awk '/dev/ {for(i=1;i<=NF;i++){if($i=="dev"){print $(i+1); exit}}}'); then
    if [[ -z "${WAN_IFACE}" ]]; then
      WAN_IFACE=$(ip route | awk '/default/ {print $5; exit}') || true
    fi
  fi
  if [[ -z "${WAN_IFACE}" ]]; then
    err "Could not detect default network interface"; exit 1
  fi
  log "Detected WAN interface: ${WAN_IFACE}"
}

get_public_ip() {
  # Attempt to discover a public IPv4
  if ! command -v curl >/dev/null 2>&1; then
    apt-get update -y -qq || true
    apt-get install -y -qq curl >/dev/null
  fi
  PUBLIC_IP=$(curl -4 -s https://ifconfig.co || true)
  if [[ -z "${PUBLIC_IP}" ]]; then
    PUBLIC_IP=$(curl -4 -s https://api.ipify.org || true)
  fi
  if [[ -z "${PUBLIC_IP}" ]]; then
    PUBLIC_IP=$(hostname -I | awk '{print $1}')
  fi
  log "Detected public IP: ${PUBLIC_IP}"
}

enable_ip_forwarding() {
  log "Enabling IP forwarding"
  mkdir -p /etc/sysctl.d
  cat >/etc/sysctl.d/99-vpn-forwarding.conf <<EOF
net.ipv4.ip_forward=1
EOF
  sysctl -p /etc/sysctl.d/99-vpn-forwarding.conf >/dev/null

  # Keep UFW's sysctl in sync (not strictly required when using /etc/sysctl.d)
  if [[ -f /etc/ufw/sysctl.conf ]]; then
    sed -i 's/^#\?net\.ipv4\.ip_forward=.*/net.ipv4.ip_forward=1/' /etc/ufw/sysctl.conf || true
  fi
}

configure_ufw_firewall() {
  log "Configuring UFW firewall"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -y -qq || true
  apt-get install -y -qq ufw >/dev/null

  # Ensure SSH is allowed to avoid cutting off access
  ufw allow OpenSSH >/dev/null 2>&1 || true
  ufw allow ${VPN_PORT}/udp >/dev/null 2>&1 || true

  # Accept forwarding and add NAT for VPN subnet
  if [[ -f /etc/default/ufw ]]; then
    sed -i 's/^DEFAULT_FORWARD_POLICY=.*/DEFAULT_FORWARD_POLICY="ACCEPT"/' /etc/default/ufw
  fi

  # Insert a NAT block at the top of before.rules if not already present
  local marker="START-OPENVPN-WIREGUARD-NAT"
  if ! grep -q "$marker" /etc/ufw/before.rules 2>/dev/null; then
    log "Adding NAT rules to /etc/ufw/before.rules"
    local tmp_file=/etc/ufw/before.rules.new
    local orig_file=/etc/ufw/before.rules
    cp "$orig_file" "${orig_file}.bak.$(date +%s)" || true
    cat >"$tmp_file" <<EOF
# ${marker}
*nat
:POSTROUTING ACCEPT [0:0]
-A POSTROUTING -s ${VPN_SUBNET_CIDR} -o ${WAN_IFACE} -j MASQUERADE
COMMIT
# END-${marker}

EOF
    cat "$orig_file" >>"$tmp_file"
    mv "$tmp_file" "$orig_file"
  fi

  # Enable or reload UFW
  if ufw status | grep -q inactive; then
    ufw --force enable >/dev/null
  else
    ufw reload >/dev/null
  fi

  log "UFW configured (SSH + UDP ${VPN_PORT} open, NAT + forwarding enabled)"
}

install_common_packages() {
  log "Installing common packages"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -y -qq || true
  apt-get install -y -qq software-properties-common ca-certificates apt-transport-https lsb-release jq >/dev/null || true
}

configure_wireguard_server() {
  log "Installing and configuring WireGuard"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -y -qq || true
  apt-get install -y -qq wireguard iproute2 iptables qrencode >/dev/null

  mkdir -p /etc/wireguard
  chmod 700 /etc/wireguard

  # Keys
  if [[ ! -f /etc/wireguard/server_privatekey ]]; then
    umask 077
    wg genkey | tee /etc/wireguard/server_privatekey | wg pubkey > /etc/wireguard/server_publickey
  fi

  # Optional preshared key for client
  if [[ ! -f /etc/wireguard/psk_${CLIENT_NAME} ]]; then
    umask 077
    wg genpsk > /etc/wireguard/psk_${CLIENT_NAME}
  fi

  local server_priv
  server_priv=$(cat /etc/wireguard/server_privatekey)

  # Server config
  if [[ ! -f /etc/wireguard/wg0.conf ]]; then
    cat >/etc/wireguard/wg0.conf <<EOF
[Interface]
Address = ${WG_SERVER_ADDR}
ListenPort = ${VPN_PORT}
PrivateKey = ${server_priv}
SaveConfig = true

# Note: NAT + forwarding handled by UFW
EOF
    chmod 600 /etc/wireguard/wg0.conf
  fi

  systemctl enable wg-quick@wg0 >/dev/null
  systemctl restart wg-quick@wg0 || systemctl start wg-quick@wg0
}

generate_wireguard_client() {
  log "Generating WireGuard client config: ${CLIENT_NAME}"
  umask 077
  local client_priv client_pub server_pub psk client_ip

  client_ip="10.8.0.2/32" # first client

  if [[ ! -f "/etc/wireguard/${CLIENT_NAME}_privatekey" ]]; then
    wg genkey | tee "/etc/wireguard/${CLIENT_NAME}_privatekey" | wg pubkey > "/etc/wireguard/${CLIENT_NAME}_publickey"
  fi

  client_priv=$(cat "/etc/wireguard/${CLIENT_NAME}_privatekey")
  client_pub=$(cat "/etc/wireguard/${CLIENT_NAME}_publickey")
  server_pub=$(cat /etc/wireguard/server_publickey)
  psk=$(cat "/etc/wireguard/psk_${CLIENT_NAME}")

  # Add peer to server if not present
  if ! grep -q "\[Peer\]" /etc/wireguard/wg0.conf || ! grep -q "${client_pub}" /etc/wireguard/wg0.conf; then
    cat >>/etc/wireguard/wg0.conf <<EOF

[Peer]
# ${CLIENT_NAME}
PublicKey = ${client_pub}
PresharedKey = ${psk}
AllowedIPs = 10.8.0.2/32
EOF
  fi

  systemctl restart wg-quick@wg0 || true

  # Client config
  local client_cfg="/root/${CLIENT_NAME}-wg0.conf"
  cat >"${client_cfg}" <<EOF
[Interface]
PrivateKey = ${client_priv}
Address = ${client_ip}
DNS = ${DNS_SERVERS}

[Peer]
PublicKey = ${server_pub}
PresharedKey = ${psk}
AllowedIPs = 0.0.0.0/0, ::/0
Endpoint = ${PUBLIC_IP}:${VPN_PORT}
PersistentKeepalive = 25
EOF
  chmod 600 "${client_cfg}"

  # Optional QR for mobile
  if command -v qrencode >/dev/null 2>&1; then
    qrencode -t ansiutf8 < "${client_cfg}" || true
  fi

  log "WireGuard client config saved: ${client_cfg}"
}

configure_openvpn_server() {
  log "Installing and configuring OpenVPN"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -y -qq || true
  apt-get install -y -qq openvpn easy-rsa iptables >/dev/null

  mkdir -p /etc/openvpn/server

  # Easy-RSA PKI (v3) setup
  if [[ ! -d /etc/openvpn/easy-rsa ]]; then
    mkdir -p /etc/openvpn/easy-rsa
    if [[ -d /usr/share/easy-rsa ]]; then
      cp -a /usr/share/easy-rsa/* /etc/openvpn/easy-rsa/
    else
      err "easy-rsa not found in /usr/share/easy-rsa"; exit 1
    fi
  fi
  cd /etc/openvpn/easy-rsa
  chmod +x ./easyrsa || true

  if [[ ! -d pki ]]; then
    EASYRSA_BATCH=1 ./easyrsa init-pki >/dev/null
    EASYRSA_BATCH=1 ./easyrsa build-ca nopass >/dev/null
    EASYRSA_BATCH=1 ./easyrsa gen-dh >/dev/null
    EASYRSA_BATCH=1 ./easyrsa build-server-full server nopass >/dev/null
    EASYRSA_BATCH=1 ./easyrsa build-client-full "${CLIENT_NAME}" nopass >/dev/null
    EASYRSA_CRL_DAYS=3650 EASYRSA_BATCH=1 ./easyrsa gen-crl >/dev/null
  fi

  # TLS-crypt key
  if [[ ! -f /etc/openvpn/server/ta.key ]]; then
    openvpn --genkey --secret /etc/openvpn/server/ta.key
  fi

  # Copy server materials
  install -m 600 -o root -g root pki/ca.crt /etc/openvpn/server/ca.crt
  install -m 600 -o root -g root pki/issued/server.crt /etc/openvpn/server/server.crt
  install -m 600 -o root -g root pki/private/server.key /etc/openvpn/server/server.key
  install -m 600 -o root -g root pki/dh.pem /etc/openvpn/server/dh.pem
  install -m 600 -o root -g root pki/crl.pem /etc/openvpn/server/crl.pem

  # Build DNS push lines
  local dns_push_lines=""
  IFS=',' read -ra dns_array <<< "${DNS_SERVERS}"
  for dns in "${dns_array[@]}"; do
    dns_push_lines+="push \"dhcp-option DNS ${dns}\""$'\n'
  done

  # Server config
  if [[ ! -f /etc/openvpn/server/server.conf ]]; then
    cat >/etc/openvpn/server/server.conf <<EOF
port ${VPN_PORT}
proto udp
dev tun
user nobody
group nogroup
persist-key
persist-tun

# Networking
server ${OVPN_SERVER_NET}
topology subnet
push "redirect-gateway def1 bypass-dhcp"
${dns_push_lines}# Crypto
cipher AES-256-GCM
ncp-ciphers AES-256-GCM:AES-128-GCM
auth SHA256
dh /etc/openvpn/server/dh.pem
crl-verify /etc/openvpn/server/crl.pem
remote-cert-tls server

# TLS
tls-crypt /etc/openvpn/server/ta.key

# Misc
keepalive 10 120
explicit-exit-notify 1
verb 3
EOF
  fi

  systemctl enable openvpn-server@server >/dev/null
  systemctl restart openvpn-server@server || systemctl start openvpn-server@server
}

generate_openvpn_client() {
  log "Generating OpenVPN client config: ${CLIENT_NAME}"
  local out="/root/${CLIENT_NAME}.ovpn"
  local easyrsa_dir="/etc/openvpn/easy-rsa"
  local ca="${easyrsa_dir}/pki/ca.crt"
  local cert="${easyrsa_dir}/pki/issued/${CLIENT_NAME}.crt"
  local key="${easyrsa_dir}/pki/private/${CLIENT_NAME}.key"
  local ta="/etc/openvpn/server/ta.key"

  cat >"${out}" <<EOF
client
dev tun
proto udp
remote ${PUBLIC_IP} ${VPN_PORT}
resolv-retry infinite
nobind
persist-key
persist-tun
remote-cert-tls server
cipher AES-256-GCM
auth SHA256
verb 3
<ca>
$(cat "${ca}")
</ca>
<cert>
$(cat "${cert}")
</cert>
<key>
$(cat "${key}")
</key>
<tls-crypt>
$(cat "${ta}")
</tls-crypt>
EOF
  chmod 600 "${out}"
  log "OpenVPN client config saved: ${out}"
}

print_connection_instructions() {
  echo
  echo "============================================================"
  echo " VPN setup complete (${VPN_TYPE})."
  echo " Server public IP: ${PUBLIC_IP}"
  echo " UDP port: ${VPN_PORT}"
  echo " VPN subnet: ${VPN_SUBNET_CIDR}"
  echo "============================================================"

  if [[ "${VPN_TYPE}" == "wireguard" ]]; then
    echo "Client config: /root/${CLIENT_NAME}-wg0.conf"
    echo
    echo "Connect instructions:"
    echo "- Windows/macOS: Install WireGuard app, then 'Import tunnel' using the .conf file."
    echo "- Linux: Install wireguard-tools, run: sudo wg-quick up /root/${CLIENT_NAME}-wg0.conf"
    echo "- Android/iOS: Install 'WireGuard' app, then import the .conf or scan QR (if shown above)."
    echo "- To copy config from server: scp root@${PUBLIC_IP}:/root/${CLIENT_NAME}-wg0.conf ."
  else
    echo "Client config: /root/${CLIENT_NAME}.ovpn"
    echo
    echo "Connect instructions:"
    echo "- Windows: Install 'OpenVPN Connect' and import the .ovpn file."
    echo "- macOS: Install 'Tunnelblick' or 'OpenVPN Connect' and import the .ovpn file."
    echo "- Linux: Install openvpn and run: sudo openvpn --config /root/${CLIENT_NAME}.ovpn"
    echo "- Android/iOS: Install 'OpenVPN Connect' and import the .ovpn file."
    echo "- To copy config from server: scp root@${PUBLIC_IP}:/root/${CLIENT_NAME}.ovpn ."
  fi

  echo
  echo "Firewall notes: UFW is enabled with SSH + UDP ${VPN_PORT} allowed. NAT and forwarding are configured for ${VPN_SUBNET_CIDR}."
  echo "Systemd: The VPN service is enabled to start on boot."
  echo "============================================================"
}

main() {
  require_root
  parse_args "$@"
  check_ubuntu_2204
  detect_wan_iface
  get_public_ip
  install_common_packages
  enable_ip_forwarding
  configure_ufw_firewall

  if [[ "${VPN_TYPE}" == "wireguard" ]]; then
    configure_wireguard_server
    generate_wireguard_client
  else
    configure_openvpn_server
    generate_openvpn_client
  fi

  print_connection_instructions
}

main "$@"