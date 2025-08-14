# 🚀 Quick Installation Guide

## Prerequisites
- Ubuntu 22.04 LTS (or compatible)
- Root/sudo access
- Internet connection

## Choose Your VPN Protocol

### Option 1: OpenVPN (Recommended for Maximum Compatibility)
```bash
# Download and run OpenVPN setup
sudo ./vpn_server_setup.sh
```

### Option 2: WireGuard (Recommended for Performance)
```bash
# Download and run WireGuard setup
sudo ./wireguard_setup.sh
```

## What Happens During Installation

1. **System Update**: Updates all packages
2. **VPN Installation**: Installs OpenVPN/WireGuard and dependencies
3. **Certificate Generation**: Creates secure certificates and keys
4. **Configuration**: Sets up server and client configurations
5. **Firewall Setup**: Configures UFW firewall rules
6. **Service Setup**: Enables auto-start on boot
7. **Client Files**: Generates ready-to-use client configuration files

## After Installation

### OpenVPN
- Client config: `/etc/openvpn/client-configs/client1.ovpn`
- Instructions: `/etc/openvpn/client-configs/README.md`

### WireGuard
- Client config: `/etc/wireguard/client-configs/client1.conf`
- Instructions: `/etc/wireguard/client-configs/README.md`

## Adding More Clients

### OpenVPN
```bash
# Add a new client (requires manual certificate generation)
cd /etc/openvpn/easy-rsa/
./easyrsa gen-req client2 nopass
./easyrsa sign-req client client2
```

### WireGuard
```bash
# Add a new client automatically
sudo ./wireguard_setup.sh --add-client client2
```

## Management Commands

### OpenVPN
```bash
# Check status
sudo systemctl status openvpn@server

# Start/stop
sudo systemctl start openvpn@server
sudo systemctl stop openvpn@server

# View logs
sudo journalctl -u openvpn@server -f
```

### WireGuard
```bash
# Check status
sudo wg show

# Start/stop
sudo wg-quick up wg0
sudo wg-quick down wg0

# View logs
sudo journalctl -u wg-quick@wg0 -f
```

## Security Features

✅ **AES-256 encryption**  
✅ **TLS 1.2+ authentication** (OpenVPN)  
✅ **ChaCha20 encryption** (WireGuard)  
✅ **Firewall protection**  
✅ **DNS leak protection**  
✅ **IP forwarding enabled**  
✅ **Secure key storage**  

## Troubleshooting

### Common Issues
1. **Port blocked**: Ensure port 1194 (OpenVPN) or 51820 (WireGuard) is open
2. **Connection fails**: Check server IP and firewall settings
3. **DNS issues**: Try different DNS servers (8.8.8.8, 1.1.1.1)

### Get Help
- Check the generated README files for detailed instructions
- Review the troubleshooting section in the main README
- Ensure you're using the correct client configuration file

## Performance Tips

### OpenVPN
- Use UDP protocol for better performance
- Adjust MTU if experiencing packet loss
- Consider using compression for slower connections

### WireGuard
- Generally faster than OpenVPN
- Lower CPU usage
- Better for mobile devices

---

**⚠️ Important**: Always test in a safe environment first. Keep your certificates and private keys secure!