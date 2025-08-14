#!/bin/bash

# =============================================================================
# OpenVPN Server Setup Script for Ubuntu 22.04
# =============================================================================
# This script automatically sets up a secure OpenVPN server with:
# - Automatic package installation
# - Random encryption keys and certificates
# - Client configuration generation
# - Firewall configuration (UFW)
# - Systemd service setup
# - Detailed logging and error handling
# =============================================================================

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration variables
VPN_SERVER_IP=""
VPN_PORT="1194"
VPN_PROTOCOL="udp"
VPN_NETWORK="10.8.0.0"
VPN_SUBNET="255.255.255.0"
VPN_DNS1="8.8.8.8"
VPN_DNS2="8.8.4.4"
CLIENT_NAME="client1"
EASYRSA_VERSION="3.1.7"
OPENVPN_VERSION="2.6.7"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Function to check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
    fi
}

# Function to detect server IP
detect_server_ip() {
    log "Detecting server IP address..."
    
    # Try to get the primary IP address
    if command -v ip &> /dev/null; then
        VPN_SERVER_IP=$(ip route get 8.8.8.8 | awk 'NR==1 {print $7}')
    elif command -v hostname &> /dev/null; then
        VPN_SERVER_IP=$(hostname -I | awk '{print $1}')
    else
        error "Could not detect server IP address"
    fi
    
    if [[ -z "$VPN_SERVER_IP" ]]; then
        error "Could not detect server IP address"
    fi
    
    log "Detected server IP: $VPN_SERVER_IP"
}

# Function to update system packages
update_system() {
    log "Updating system packages..."
    apt update -y || error "Failed to update package list"
    apt upgrade -y || error "Failed to upgrade packages"
    
    # Install essential packages
    log "Installing essential packages..."
    apt install -y curl wget git ufw fail2ban || error "Failed to install essential packages"
}

# Function to install OpenVPN and dependencies
install_openvpn() {
    log "Installing OpenVPN and dependencies..."
    
    # Install required packages
    apt install -y openvpn easy-rsa || error "Failed to install OpenVPN packages"
    
    # Verify installation
    if ! command -v openvpn &> /dev/null; then
        error "OpenVPN installation failed"
    fi
    
    log "OpenVPN installed successfully"
}

# Function to setup EasyRSA for certificate generation
setup_easyrsa() {
    log "Setting up EasyRSA for certificate generation..."
    
    # Create directory for certificates
    mkdir -p /etc/openvpn/easy-rsa/
    cd /etc/openvpn/easy-rsa/
    
    # Copy EasyRSA files
    cp -r /usr/share/easy-rsa/* . || error "Failed to copy EasyRSA files"
    
    # Create vars file
    cat > vars << EOF
export EASYRSA_REQ_COUNTRY="US"
export EASYRSA_REQ_PROVINCE="CA"
export EASYRSA_REQ_CITY="SanFrancisco"
export EASYRSA_REQ_ORG="OpenVPN"
export EASYRSA_REQ_EMAIL="admin@example.com"
export EASYRSA_REQ_OU="OpenVPN"
export EASYRSA_KEY_SIZE=2048
export EASYRSA_ALGO=rsa
export EASYRSA_CA_EXPIRE=3650
export EASYRSA_CERT_EXPIRE=3650
EOF
    
    # Initialize PKI
    ./easyrsa init-pki || error "Failed to initialize PKI"
    
    # Build CA
    log "Building Certificate Authority (this may take a moment)..."
    echo "yes" | ./easyrsa build-ca nopass || error "Failed to build CA"
    
    # Generate server certificate and key
    log "Generating server certificate and key..."
    echo "yes" | ./easyrsa gen-req server nopass || error "Failed to generate server certificate"
    echo "yes" | ./easyrsa sign-req server server || error "Failed to sign server certificate"
    
    # Generate Diffie-Hellman parameters
    log "Generating Diffie-Hellman parameters (this may take several minutes)..."
    ./easyrsa gen-dh || error "Failed to generate DH parameters"
    
    # Generate TLS auth key
    log "Generating TLS auth key..."
    openvpn --genkey secret ta.key || error "Failed to generate TLS auth key"
    
    # Copy certificates to OpenVPN directory
    cp pki/ca.crt /etc/openvpn/ || error "Failed to copy CA certificate"
    cp pki/issued/server.crt /etc/openvpn/ || error "Failed to copy server certificate"
    cp pki/private/server.key /etc/openvpn/ || error "Failed to copy server key"
    cp pki/dh.pem /etc/openvpn/ || error "Failed to copy DH parameters"
    cp ta.key /etc/openvpn/ || error "Failed to copy TLS auth key"
    
    # Set proper permissions
    chmod 644 /etc/openvpn/ca.crt
    chmod 644 /etc/openvpn/server.crt
    chmod 600 /etc/openvpn/server.key
    chmod 644 /etc/openvpn/dh.pem
    chmod 600 /etc/openvpn/ta.key
    
    log "EasyRSA setup completed successfully"
}

# Function to generate client certificate
generate_client_cert() {
    log "Generating client certificate for $CLIENT_NAME..."
    
    cd /etc/openvpn/easy-rsa/
    
    # Generate client certificate and key
    echo "yes" | ./easyrsa gen-req $CLIENT_NAME nopass || error "Failed to generate client certificate"
    echo "yes" | ./easyrsa sign-req client $CLIENT_NAME || error "Failed to sign client certificate"
    
    # Copy client certificate and key
    cp pki/issued/$CLIENT_NAME.crt /etc/openvpn/ || error "Failed to copy client certificate"
    cp pki/private/$CLIENT_NAME.key /etc/openvpn/ || error "Failed to copy client key"
    
    # Set proper permissions
    chmod 644 /etc/openvpn/$CLIENT_NAME.crt
    chmod 600 /etc/openvpn/$CLIENT_NAME.key
    
    log "Client certificate generated successfully"
}

# Function to create OpenVPN server configuration
create_server_config() {
    log "Creating OpenVPN server configuration..."
    
    cat > /etc/openvpn/server.conf << EOF
# OpenVPN Server Configuration
# Generated by VPN Setup Script

# Network configuration
port $VPN_PORT
proto $VPN_PROTOCOL
dev tun

# Certificate configuration
ca ca.crt
cert server.crt
key server.key
dh dh.pem

# Security settings
tls-auth ta.key 0
auth SHA256
cipher AES-256-CBC
ncp-ciphers AES-256-GCM:AES-256-CBC:AES-128-GCM:AES-128-CBC

# Network topology
topology subnet
server $VPN_NETWORK $VPN_SUBNET
ifconfig-pool-persist ipp.txt

# DNS configuration
push "dhcp-option DNS $VPN_DNS1"
push "dhcp-option DNS $VPN_DNS2"

# Security features
keepalive 10 120
comp-lzo
user nobody
group nogroup
persist-key
persist-tun

# Logging
status openvpn-status.log
verb 3

# Security hardening
tls-version-min 1.2
tls-cipher TLS-ECDHE-RSA-WITH-AES-256-GCM-SHA384:TLS-ECDHE-RSA-WITH-AES-256-CBC-SHA384:TLS-ECDHE-RSA-WITH-AES-256-CBC-SHA

# Prevent DNS leaks
push "redirect-gateway def1 bypass-dhcp"
push "block-outside-dns"

# Connection management
max-clients 100
duplicate-cn

# Performance optimization
sndbuf 393216
rcvbuf 393216
push "sndbuf 393216"
push "rcvbuf 393216"
EOF
    
    log "Server configuration created successfully"
}

# Function to create client configuration
create_client_config() {
    log "Creating client configuration file..."
    
    # Create client config directory
    mkdir -p /etc/openvpn/client-configs/
    
    cat > /etc/openvpn/client-configs/$CLIENT_NAME.ovpn << EOF
# OpenVPN Client Configuration
# Generated by VPN Setup Script
# Client: $CLIENT_NAME

# Connection settings
client
dev tun
proto $VPN_PROTOCOL
remote $VPN_SERVER_IP $VPN_PORT
resolv-retry infinite
nobind

# Security settings
auth SHA256
cipher AES-256-CBC
ncp-ciphers AES-256-GCM:AES-256-CBC:AES-128-GCM:AES-128-CBC
tls-version-min 1.2
tls-cipher TLS-ECDHE-RSA-WITH-AES-256-GCM-SHA384:TLS-ECDHE-RSA-WITH-AES-256-CBC-SHA384:TLS-ECDHE-RSA-WITH-AES-256-CBC-SHA

# Certificate and key data
<ca>
$(cat /etc/openvpn/ca.crt)
</ca>

<cert>
$(cat /etc/openvpn/$CLIENT_NAME.crt)
</cert>

<key>
$(cat /etc/openvpn/$CLIENT_NAME.key)
</key>

<tls-auth>
$(cat /etc/openvpn/ta.key)
</tls-auth>
key-direction 1

# Performance settings
sndbuf 393216
rcvbuf 393216

# Security features
persist-key
persist-tun
comp-lzo
verb 3

# Prevent DNS leaks
block-outside-dns
EOF
    
    # Set proper permissions
    chmod 644 /etc/openvpn/client-configs/$CLIENT_NAME.ovpn
    
    log "Client configuration created: /etc/openvpn/client-configs/$CLIENT_NAME.ovpn"
}

# Function to enable IP forwarding
enable_ip_forwarding() {
    log "Enabling IP forwarding..."
    
    # Enable IP forwarding
    echo 'net.ipv4.ip_forward=1' >> /etc/sysctl.conf
    sysctl -p || error "Failed to apply sysctl changes"
    
    log "IP forwarding enabled successfully"
}

# Function to configure firewall
configure_firewall() {
    log "Configuring firewall (UFW)..."
    
    # Reset UFW to default
    ufw --force reset || error "Failed to reset UFW"
    
    # Set default policies
    ufw default deny incoming || error "Failed to set default deny incoming"
    ufw default allow outgoing || error "Failed to set default allow outgoing"
    
    # Allow SSH (important to prevent lockout)
    ufw allow ssh || error "Failed to allow SSH"
    
    # Allow OpenVPN port
    ufw allow $VPN_PORT/$VPN_PROTOCOL || error "Failed to allow OpenVPN port"
    
    # Enable UFW
    ufw --force enable || error "Failed to enable UFW"
    
    log "Firewall configured successfully"
}

# Function to create systemd service
create_systemd_service() {
    log "Creating systemd service..."
    
    # Create systemd service file
    cat > /etc/systemd/system/openvpn@server.service << EOF
[Unit]
Description=OpenVPN service for %I
After=network.target

[Service]
Type=notify
PrivateTmp=true
ExecStart=/usr/sbin/openvpn --config /etc/openvpn/%i.conf
ExecReload=/bin/kill -HUP \$MAINPID
KillMode=mixed
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd and enable service
    systemctl daemon-reload || error "Failed to reload systemd"
    systemctl enable openvpn@server || error "Failed to enable OpenVPN service"
    
    log "Systemd service created and enabled"
}

# Function to start OpenVPN service
start_openvpn_service() {
    log "Starting OpenVPN service..."
    
    systemctl start openvpn@server || error "Failed to start OpenVPN service"
    
    # Check if service is running
    if systemctl is-active --quiet openvpn@server; then
        log "OpenVPN service started successfully"
    else
        error "OpenVPN service failed to start"
    fi
}

# Function to create connection instructions
create_instructions() {
    log "Creating connection instructions..."
    
    cat > /etc/openvpn/client-configs/README.md << EOF
# OpenVPN Client Connection Instructions

## Server Information
- Server IP: $VPN_SERVER_IP
- Port: $VPN_PORT
- Protocol: $VPN_PROTOCOL

## Client Configuration File
The client configuration file is: \`$CLIENT_NAME.ovpn\`

## Connection Instructions by Platform

### Windows
1. Download and install OpenVPN GUI from: https://openvpn.net/community-downloads/
2. Copy the \`$CLIENT_NAME.ovpn\` file to: \`C:\\Program Files\\OpenVPN\\config\\\`
3. Right-click the OpenVPN GUI icon in the system tray
4. Select "Connect" and choose your configuration

### macOS
1. Download and install Tunnelblick from: https://tunnelblick.net/
2. Double-click the \`$CLIENT_NAME.ovpn\` file
3. Tunnelblick will import the configuration
4. Click "Connect" in Tunnelblick

### Linux
1. Install OpenVPN: \`sudo apt install openvpn\` (Ubuntu/Debian)
2. Copy the \`$CLIENT_NAME.ovpn\` file to your home directory
3. Connect: \`sudo openvpn --config $CLIENT_NAME.ovpn\`

### Android
1. Install OpenVPN Connect from Google Play Store
2. Import the \`$CLIENT_NAME.ovpn\` file
3. Tap "Connect" in the app

### iOS
1. Install OpenVPN Connect from App Store
2. Import the \`$CLIENT_NAME.ovpn\` file
3. Tap "Connect" in the app

## Security Notes
- Keep your client configuration file secure
- The VPN will route all traffic through the server
- DNS queries are also routed through the VPN for privacy

## Troubleshooting
- Ensure the server IP and port are correct
- Check that your firewall allows the connection
- Verify the client configuration file is complete
EOF
    
    log "Connection instructions created: /etc/openvpn/client-configs/README.md"
}

# Function to display final information
display_final_info() {
    echo
    echo "============================================================================="
    echo "🎉 OpenVPN Server Setup Completed Successfully!"
    echo "============================================================================="
    echo
    echo "📋 Server Information:"
    echo "   • Server IP: $VPN_SERVER_IP"
    echo "   • Port: $VPN_PORT"
    echo "   • Protocol: $VPN_PROTOCOL"
    echo "   • VPN Network: $VPN_NETWORK/$VPN_SUBNET"
    echo
    echo "📁 Important Files:"
    echo "   • Client Config: /etc/openvpn/client-configs/$CLIENT_NAME.ovpn"
    echo "   • Instructions: /etc/openvpn/client-configs/README.md"
    echo "   • Server Config: /etc/openvpn/server.conf"
    echo
    echo "🔧 Service Status:"
    echo "   • OpenVPN Service: $(systemctl is-active openvpn@server)"
    echo "   • UFW Firewall: $(ufw status | grep -o "Status: active")"
    echo
    echo "📱 Next Steps:"
    echo "   1. Download the client configuration file"
    echo "   2. Follow the instructions in the README.md file"
    echo "   3. Test your connection"
    echo
    echo "🔒 Security Features Enabled:"
    echo "   • AES-256 encryption"
    echo "   • TLS 1.2+ authentication"
    echo "   • Firewall protection (UFW)"
    echo "   • IP forwarding enabled"
    echo "   • DNS leak protection"
    echo
    echo "============================================================================="
    echo
}

# Main execution function
main() {
    echo "============================================================================="
    echo "🚀 OpenVPN Server Setup Script for Ubuntu 22.04"
    echo "============================================================================="
    echo
    
    # Check if running as root
    check_root
    
    # Detect server IP
    detect_server_ip
    
    # Update system
    update_system
    
    # Install OpenVPN
    install_openvpn
    
    # Setup EasyRSA and generate certificates
    setup_easyrsa
    
    # Generate client certificate
    generate_client_cert
    
    # Create server configuration
    create_server_config
    
    # Create client configuration
    create_client_config
    
    # Enable IP forwarding
    enable_ip_forwarding
    
    # Configure firewall
    configure_firewall
    
    # Create systemd service
    create_systemd_service
    
    # Start OpenVPN service
    start_openvpn_service
    
    # Create connection instructions
    create_instructions
    
    # Display final information
    display_final_info
}

# Run main function
main "$@"