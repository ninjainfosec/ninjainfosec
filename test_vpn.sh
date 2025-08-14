#!/bin/bash

# =============================================================================
# VPN Installation Test Script
# =============================================================================
# This script tests the VPN installation and provides status information
# =============================================================================

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test functions
test_openvpn() {
    echo -e "${BLUE}Testing OpenVPN installation...${NC}"
    
    # Check if OpenVPN is installed
    if command -v openvpn &> /dev/null; then
        echo -e "${GREEN}✅ OpenVPN is installed${NC}"
    else
        echo -e "${RED}❌ OpenVPN is not installed${NC}"
        return 1
    fi
    
    # Check if service exists
    if systemctl list-unit-files | grep -q "openvpn@server"; then
        echo -e "${GREEN}✅ OpenVPN service exists${NC}"
    else
        echo -e "${RED}❌ OpenVPN service not found${NC}"
        return 1
    fi
    
    # Check service status
    if systemctl is-active --quiet openvpn@server; then
        echo -e "${GREEN}✅ OpenVPN service is running${NC}"
    else
        echo -e "${YELLOW}⚠️  OpenVPN service is not running${NC}"
    fi
    
    # Check if configuration files exist
    if [[ -f "/etc/openvpn/server.conf" ]]; then
        echo -e "${GREEN}✅ Server configuration exists${NC}"
    else
        echo -e "${RED}❌ Server configuration not found${NC}"
    fi
    
    if [[ -f "/etc/openvpn/client-configs/client1.ovpn" ]]; then
        echo -e "${GREEN}✅ Client configuration exists${NC}"
    else
        echo -e "${RED}❌ Client configuration not found${NC}"
    fi
    
    # Check certificates
    local cert_files=("ca.crt" "server.crt" "server.key" "dh.pem" "ta.key")
    for cert in "${cert_files[@]}"; do
        if [[ -f "/etc/openvpn/$cert" ]]; then
            echo -e "${GREEN}✅ Certificate $cert exists${NC}"
        else
            echo -e "${RED}❌ Certificate $cert not found${NC}"
        fi
    done
    
    echo
}

test_wireguard() {
    echo -e "${BLUE}Testing WireGuard installation...${NC}"
    
    # Check if WireGuard is installed
    if command -v wg &> /dev/null; then
        echo -e "${GREEN}✅ WireGuard is installed${NC}"
    else
        echo -e "${RED}❌ WireGuard is not installed${NC}"
        return 1
    fi
    
    # Check if interface exists
    if ip link show wg0 &> /dev/null; then
        echo -e "${GREEN}✅ WireGuard interface exists${NC}"
    else
        echo -e "${YELLOW}⚠️  WireGuard interface not found${NC}"
    fi
    
    # Check if interface is up
    if ip link show wg0 2>/dev/null | grep -q "state UP"; then
        echo -e "${GREEN}✅ WireGuard interface is up${NC}"
    else
        echo -e "${YELLOW}⚠️  WireGuard interface is down${NC}"
    fi
    
    # Check if configuration files exist
    if [[ -f "/etc/wireguard/wg0.conf" ]]; then
        echo -e "${GREEN}✅ Server configuration exists${NC}"
    else
        echo -e "${RED}❌ Server configuration not found${NC}"
    fi
    
    if [[ -f "/etc/wireguard/client-configs/client1.conf" ]]; then
        echo -e "${GREEN}✅ Client configuration exists${NC}"
    else
        echo -e "${RED}❌ Client configuration not found${NC}"
    fi
    
    # Check keys
    local key_files=("privatekey" "publickey" "client_privatekey" "client_publickey")
    for key in "${key_files[@]}"; do
        if [[ -f "/etc/wireguard/$key" ]]; then
            echo -e "${GREEN}✅ Key file $key exists${NC}"
        else
            echo -e "${RED}❌ Key file $key not found${NC}"
        fi
    done
    
    echo
}

test_firewall() {
    echo -e "${BLUE}Testing firewall configuration...${NC}"
    
    # Check if UFW is installed
    if command -v ufw &> /dev/null; then
        echo -e "${GREEN}✅ UFW is installed${NC}"
    else
        echo -e "${RED}❌ UFW is not installed${NC}"
        return 1
    fi
    
    # Check UFW status
    if ufw status | grep -q "Status: active"; then
        echo -e "${GREEN}✅ UFW is active${NC}"
    else
        echo -e "${YELLOW}⚠️  UFW is not active${NC}"
    fi
    
    # Check if VPN ports are allowed
    if ufw status | grep -q "1194/udp"; then
        echo -e "${GREEN}✅ OpenVPN port (1194/udp) is allowed${NC}"
    else
        echo -e "${YELLOW}⚠️  OpenVPN port (1194/udp) not found in UFW rules${NC}"
    fi
    
    if ufw status | grep -q "51820/udp"; then
        echo -e "${GREEN}✅ WireGuard port (51820/udp) is allowed${NC}"
    else
        echo -e "${YELLOW}⚠️  WireGuard port (51820/udp) not found in UFW rules${NC}"
    fi
    
    echo
}

test_network() {
    echo -e "${BLUE}Testing network configuration...${NC}"
    
    # Check IP forwarding
    if [[ $(cat /proc/sys/net/ipv4/ip_forward) -eq 1 ]]; then
        echo -e "${GREEN}✅ IP forwarding is enabled${NC}"
    else
        echo -e "${RED}❌ IP forwarding is disabled${NC}"
    fi
    
    # Check server IP
    local server_ip=$(ip route get 8.8.8.8 | awk 'NR==1 {print $7}')
    if [[ -n "$server_ip" ]]; then
        echo -e "${GREEN}✅ Server IP detected: $server_ip${NC}"
    else
        echo -e "${RED}❌ Could not detect server IP${NC}"
    fi
    
    # Check DNS resolution
    if nslookup google.com &> /dev/null; then
        echo -e "${GREEN}✅ DNS resolution working${NC}"
    else
        echo -e "${RED}❌ DNS resolution failed${NC}"
    fi
    
    echo
}

test_connectivity() {
    echo -e "${BLUE}Testing basic connectivity...${NC}"
    
    # Test internet connectivity
    if ping -c 1 8.8.8.8 &> /dev/null; then
        echo -e "${GREEN}✅ Internet connectivity working${NC}"
    else
        echo -e "${RED}❌ Internet connectivity failed${NC}"
    fi
    
    # Test DNS
    if ping -c 1 google.com &> /dev/null; then
        echo -e "${GREEN}✅ DNS resolution working${NC}"
    else
        echo -e "${RED}❌ DNS resolution failed${NC}"
    fi
    
    echo
}

show_summary() {
    echo -e "${BLUE}=============================================================================${NC}"
    echo -e "${BLUE}📊 VPN Installation Test Summary${NC}"
    echo -e "${BLUE}=============================================================================${NC}"
    echo
    
    # Check what's installed
    local openvpn_installed=false
    local wireguard_installed=false
    
    if command -v openvpn &> /dev/null; then
        openvpn_installed=true
    fi
    
    if command -v wg &> /dev/null; then
        wireguard_installed=true
    fi
    
    if [[ "$openvpn_installed" == true && "$wireguard_installed" == true ]]; then
        echo -e "${GREEN}✅ Both OpenVPN and WireGuard are installed${NC}"
    elif [[ "$openvpn_installed" == true ]]; then
        echo -e "${GREEN}✅ OpenVPN is installed${NC}"
    elif [[ "$wireguard_installed" == true ]]; then
        echo -e "${GREEN}✅ WireGuard is installed${NC}"
    else
        echo -e "${RED}❌ No VPN software detected${NC}"
    fi
    
    # Show client configuration locations
    echo
    echo -e "${BLUE}📁 Client Configuration Files:${NC}"
    if [[ -f "/etc/openvpn/client-configs/client1.ovpn" ]]; then
        echo -e "${GREEN}   • OpenVPN: /etc/openvpn/client-configs/client1.ovpn${NC}"
    fi
    
    if [[ -f "/etc/wireguard/client-configs/client1.conf" ]]; then
        echo -e "${GREEN}   • WireGuard: /etc/wireguard/client-configs/client1.conf${NC}"
    fi
    
    # Show next steps
    echo
    echo -e "${BLUE}📱 Next Steps:${NC}"
    echo -e "${YELLOW}   1. Download the client configuration file(s)${NC}"
    echo -e "${YELLOW}   2. Install the appropriate client software${NC}"
    echo -e "${YELLOW}   3. Import the configuration and test connection${NC}"
    echo -e "${YELLOW}   4. Check the generated README files for detailed instructions${NC}"
    
    echo
    echo -e "${BLUE}=============================================================================${NC}"
}

# Main function
main() {
    echo -e "${BLUE}=============================================================================${NC}"
    echo -e "${BLUE}🔍 VPN Installation Test Script${NC}"
    echo -e "${BLUE}=============================================================================${NC}"
    echo
    
    # Run tests
    test_connectivity
    test_network
    test_firewall
    test_openvpn
    test_wireguard
    
    # Show summary
    show_summary
}

# Run main function
main "$@"