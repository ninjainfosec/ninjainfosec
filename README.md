# VPN Server Setup Script

A comprehensive, production-ready script for setting up secure VPN servers on Ubuntu 22.04 LTS. Supports both OpenVPN and WireGuard with automatic configuration, certificate generation, and client setup.

## 🚀 Quick Start

```bash
# Download and run the script
sudo bash vpn_setup.sh
```

The script will guide you through the setup process with an interactive menu.

## ✨ Features

### 🔐 Security First
- **Strong Encryption**: AES-256-GCM for OpenVPN, ChaCha20Poly1305 for WireGuard
- **Automatic Certificate Generation**: Creates secure PKI infrastructure
- **Firewall Configuration**: Configures UFW with restrictive rules
- **IP Forwarding**: Properly configured routing and NAT
- **Privilege Dropping**: Services run with minimal privileges

### 🛠 Automation
- **One-Click Setup**: Fully automated installation and configuration
- **System Service Integration**: Auto-start on boot with systemd
- **Client Config Generation**: Ready-to-use client configurations
- **QR Code Generation**: For easy mobile device setup (WireGuard)

### 🌐 Multi-Platform Support
- **All Major Platforms**: Windows, macOS, Linux, Android, iOS
- **Multiple VPN Types**: Choose between OpenVPN or WireGuard
- **Comprehensive Instructions**: Step-by-step connection guides

## 📋 Requirements

- **Operating System**: Ubuntu 22.04 LTS (recommended)
- **Root Access**: Script must be run with sudo
- **Internet Connection**: For package installation and IP detection
- **Open Ports**: VPN port must be accessible from clients

## 🔧 Installation Options

### Option 1: OpenVPN (Traditional)
- **Port**: 1194/UDP (default)
- **Encryption**: AES-256-GCM + SHA256
- **Compatibility**: Excellent across all platforms
- **Performance**: Good, CPU-intensive encryption

### Option 2: WireGuard (Modern)
- **Port**: 51820/UDP (default)
- **Encryption**: ChaCha20Poly1305 + Poly1305
- **Compatibility**: Great, newer protocol
- **Performance**: Excellent, optimized for speed

## 📖 Usage Instructions

### 1. Run the Setup Script

```bash
sudo bash vpn_setup.sh
```

### 2. Choose Your VPN Type

The script will present a menu:
```
1) OpenVPN (Traditional, widely supported)
2) WireGuard (Modern, faster, simpler)
3) Exit
```

### 3. Configure Settings

- **VPN Port**: Accept default or specify custom port
- **Client Name**: Name for the first client configuration

### 4. Wait for Completion

The script will:
- Update system packages
- Install required software
- Generate certificates/keys
- Configure firewall rules
- Start VPN services
- Create client configurations

## 📱 Client Connection

### Client Configuration Files

After setup completion, find your client configs in:
- **OpenVPN**: `/root/vpn-clients/client1.ovpn`
- **WireGuard**: `/root/vpn-clients/wg0-client.conf`
- **WireGuard QR**: `/root/vpn-clients/wg0-client-qr.png`

### Platform-Specific Instructions

#### 📱 Mobile Devices (Android/iOS)

**OpenVPN:**
1. Install "OpenVPN for Android" or "OpenVPN Connect"
2. Import the `.ovpn` file
3. Connect

**WireGuard:**
1. Install "WireGuard" app
2. Scan the QR code or import config file
3. Toggle connection on

#### 💻 Desktop (Windows/macOS/Linux)

**OpenVPN:**
- **Windows**: Install OpenVPN GUI, place config in `C:\Program Files\OpenVPN\config\`
- **macOS**: Install Tunnelblick, import `.ovpn` file
- **Linux**: `sudo openvpn --config client1.ovpn`

**WireGuard:**
- **Windows/macOS**: Install WireGuard app, import config file
- **Linux**: `sudo wg-quick up wg0-client`

## 🔒 Security Considerations

### Server Security
- **Regular Updates**: Keep server and VPN software updated
- **SSH Hardening**: Consider changing SSH port and disabling root login
- **Monitoring**: Monitor VPN logs for suspicious activity
- **Certificate Management**: Rotate certificates periodically

### Client Security
- **Secure Storage**: Keep client configurations secure
- **Trusted Devices**: Only install on trusted devices
- **Revocation**: Remove compromised client certificates
- **DNS Leaks**: Verify DNS queries go through VPN

### Network Security
- **Firewall Rules**: Script configures restrictive firewall rules
- **Port Security**: Only VPN and SSH ports are exposed
- **IP Forwarding**: Properly configured to prevent routing loops

## 🛠 Management Commands

### OpenVPN Management
```bash
# Check service status
sudo systemctl status openvpn@server

# View logs
sudo journalctl -u openvpn@server -f

# Restart service
sudo systemctl restart openvpn@server

# Check connected clients
sudo cat /var/log/openvpn/openvpn-status.log
```

### WireGuard Management
```bash
# Check service status
sudo systemctl status wg-quick@wg0

# View logs
sudo journalctl -u wg-quick@wg0 -f

# Show current peers
sudo wg show

# Restart service
sudo systemctl restart wg-quick@wg0
```

### Firewall Management
```bash
# Check firewall status
sudo ufw status

# Monitor connections
sudo netstat -tulpn | grep 1194  # OpenVPN
sudo netstat -tulpn | grep 51820 # WireGuard
```

## 🔧 Troubleshooting

### Common Issues

#### Connection Fails
1. **Check Firewall**: Ensure VPN port is open
   ```bash
   sudo ufw status
   sudo iptables -L
   ```

2. **Verify Service**: Ensure VPN service is running
   ```bash
   sudo systemctl status openvpn@server    # OpenVPN
   sudo systemctl status wg-quick@wg0      # WireGuard
   ```

3. **Check Logs**: Look for error messages
   ```bash
   sudo journalctl -u openvpn@server -n 50  # OpenVPN
   sudo journalctl -u wg-quick@wg0 -n 50    # WireGuard
   ```

#### IP Forwarding Issues
```bash
# Check if IP forwarding is enabled
sysctl net.ipv4.ip_forward

# Enable if disabled
echo 'net.ipv4.ip_forward=1' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

#### DNS Resolution Problems
- **OpenVPN**: Check `push "dhcp-option DNS"` in server config
- **WireGuard**: Verify `DNS = 8.8.8.8` in client config
- **Test**: Use `nslookup` or `dig` to verify DNS resolution

### Performance Optimization

#### For High-Traffic Servers
1. **Increase Client Limit**: Edit `max-clients` in OpenVPN config
2. **Optimize Cipher**: Consider AES-128-GCM for better performance
3. **Tune Network**: Adjust `txqueuelen` and buffer sizes
4. **Monitor Resources**: Use `htop` and `iotop` to monitor usage

## 🔄 Adding More Clients

### OpenVPN
```bash
cd /etc/openvpn/easy-rsa
sudo ./easyrsa build-client-full client2 nopass
# Generate new .ovpn file with client2 certificates
```

### WireGuard
```bash
# Generate new client keys
wg genkey | tee client2_private.key | wg pubkey > client2_public.key

# Add peer to server config
sudo wg set wg0 peer $(cat client2_public.key) allowed-ips 10.0.0.3/32

# Create client config with new keys
```

## 📊 Monitoring and Maintenance

### Log Locations
- **OpenVPN Logs**: `/var/log/openvpn/`
- **WireGuard Logs**: `journalctl -u wg-quick@wg0`
- **System Logs**: `/var/log/syslog`

### Regular Maintenance
- **Update Packages**: `sudo apt update && sudo apt upgrade`
- **Rotate Logs**: Configure logrotate for VPN logs
- **Backup Configs**: Backup `/etc/openvpn/` or `/etc/wireguard/`
- **Monitor Disk**: Ensure sufficient disk space

### Performance Monitoring
```bash
# Monitor bandwidth usage
sudo iftop -i tun0    # OpenVPN
sudo iftop -i wg0     # WireGuard

# Check connection statistics
sudo ss -tuln | grep :1194   # OpenVPN
sudo ss -tuln | grep :51820  # WireGuard
```

## ⚠️ Important Notes

### Legal Considerations
- **Compliance**: Ensure VPN usage complies with local laws
- **Terms of Service**: Check your hosting provider's ToS
- **Logging**: Consider privacy implications of connection logs

### Backup and Recovery
- **Configuration Backup**: Regularly backup VPN configurations
- **Certificate Backup**: Store certificates securely
- **Recovery Plan**: Document recovery procedures

### Updates and Patches
- **Security Updates**: Apply security patches promptly
- **VPN Software**: Keep OpenVPN/WireGuard updated
- **Certificate Expiry**: Monitor certificate expiration dates

## 📞 Support

### Getting Help
1. **Check Logs**: Always check service logs first
2. **Verify Config**: Compare configs with working examples
3. **Test Connectivity**: Use `ping`, `traceroute`, and `nslookup`
4. **Community Support**: Consult OpenVPN/WireGuard communities

### Useful Resources
- **OpenVPN Documentation**: https://openvpn.net/community-resources/
- **WireGuard Documentation**: https://www.wireguard.com/
- **Ubuntu Server Guide**: https://ubuntu.com/server/docs

## 📄 License

This script is provided as-is for educational and legitimate security purposes. Use responsibly and in compliance with applicable laws and regulations.

---

**⚡ Ready to secure your network? Run `sudo bash vpn_setup.sh` and get your VPN server running in under 5 minutes!**
