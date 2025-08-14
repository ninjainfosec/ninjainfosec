# 🔐 VPN Server Setup Scripts

This repository contains production-ready scripts to automatically set up secure VPN servers on Ubuntu 22.04. Both OpenVPN and WireGuard implementations are provided.

## 🚀 Quick Start

### OpenVPN Setup (Recommended)
```bash
# Download and run the OpenVPN setup script
wget https://raw.githubusercontent.com/your-repo/vpn_server_setup.sh
chmod +x vpn_server_setup.sh
sudo ./vpn_server_setup.sh
```

### WireGuard Setup (Alternative)
```bash
# Download and run the WireGuard setup script
wget https://raw.githubusercontent.com/your-repo/wireguard_setup.sh
chmod +x wireguard_setup.sh
sudo ./wireguard_setup.sh
```

## 📋 Features

### ✅ OpenVPN Script Features
- **Automatic Installation**: Installs all required packages
- **Certificate Generation**: Creates CA, server, and client certificates with EasyRSA
- **Security Hardening**: AES-256 encryption, TLS 1.2+, firewall configuration
- **Client Configuration**: Generates ready-to-use `.ovpn` files
- **System Integration**: Systemd service, auto-start on boot
- **DNS Protection**: Prevents DNS leaks
- **Cross-Platform Support**: Works with Windows, macOS, Linux, Android, iOS

### ✅ WireGuard Script Features
- **Modern Protocol**: Faster and more efficient than OpenVPN
- **Simple Setup**: Minimal configuration required
- **Built-in Security**: State-of-the-art cryptography
- **Performance**: Lower latency and higher throughput
- **Easy Management**: Simple key-based authentication

## 🔧 Requirements

- Ubuntu 22.04 LTS (or compatible)
- Root/sudo access
- Internet connection for package installation
- At least 512MB RAM
- 1GB free disk space

## 📁 Generated Files

After running the scripts, you'll find:

### OpenVPN
```
/etc/openvpn/
├── server.conf              # Server configuration
├── ca.crt                   # Certificate Authority
├── server.crt               # Server certificate
├── server.key               # Server private key
├── dh.pem                   # Diffie-Hellman parameters
├── ta.key                   # TLS auth key
└── client-configs/
    ├── client1.ovpn         # Client configuration
    └── README.md            # Connection instructions
```

### WireGuard
```
/etc/wireguard/
├── wg0.conf                 # Server configuration
├── privatekey               # Server private key
├── publickey                # Server public key
└── client-configs/
    ├── client1.conf         # Client configuration
    └── README.md            # Connection instructions
```

## 🔒 Security Features

### Encryption & Authentication
- **AES-256-GCM** encryption (WireGuard)
- **AES-256-CBC** encryption (OpenVPN)
- **TLS 1.2+** authentication (OpenVPN)
- **ChaCha20** encryption (WireGuard)
- **Perfect Forward Secrecy**

### Network Security
- **UFW Firewall** configuration
- **IP forwarding** enabled
- **DNS leak protection**
- **Kill switch** functionality
- **No traffic logging**

### Certificate Security
- **2048-bit RSA** keys
- **10-year validity** for certificates
- **Secure key storage** with proper permissions
- **Certificate revocation** support

## 📱 Client Support

### OpenVPN Clients
- **Windows**: OpenVPN GUI
- **macOS**: Tunnelblick, OpenVPN Connect
- **Linux**: OpenVPN CLI, Network Manager
- **Android**: OpenVPN Connect
- **iOS**: OpenVPN Connect

### WireGuard Clients
- **Windows**: WireGuard GUI
- **macOS**: WireGuard GUI
- **Linux**: WireGuard tools
- **Android**: WireGuard app
- **iOS**: WireGuard app

## 🛠️ Management Commands

### OpenVPN Management
```bash
# Check service status
sudo systemctl status openvpn@server

# Start/stop service
sudo systemctl start openvpn@server
sudo systemctl stop openvpn@server

# View logs
sudo journalctl -u openvpn@server -f

# Generate new client
sudo ./vpn_server_setup.sh --add-client client2
```

### WireGuard Management
```bash
# Check interface status
sudo wg show

# Start/stop interface
sudo wg-quick up wg0
sudo wg-quick down wg0

# View logs
sudo journalctl -u wg-quick@wg0 -f

# Generate new client
sudo ./wireguard_setup.sh --add-client client2
```

## 🔍 Troubleshooting

### Common Issues

#### Connection Problems
1. **Check firewall**: Ensure port 1194 (OpenVPN) or 51820 (WireGuard) is open
2. **Verify IP address**: Confirm server IP is correct and accessible
3. **Check certificates**: Ensure client config file is complete
4. **DNS issues**: Try different DNS servers (8.8.8.8, 1.1.1.1)

#### Performance Issues
1. **Protocol selection**: Try UDP instead of TCP for better performance
2. **MTU settings**: Adjust MTU if experiencing packet loss
3. **Server location**: Choose server closer to your location
4. **Bandwidth limits**: Check for ISP throttling

#### Security Concerns
1. **Regular updates**: Keep system and OpenVPN/WireGuard updated
2. **Certificate rotation**: Renew certificates before expiration
3. **Access logs**: Monitor connection logs for suspicious activity
4. **Backup configuration**: Keep secure backups of certificates and configs

## 📊 Performance Comparison

| Feature | OpenVPN | WireGuard |
|---------|---------|-----------|
| **Speed** | Good | Excellent |
| **Latency** | Medium | Low |
| **CPU Usage** | Higher | Lower |
| **Setup Complexity** | Complex | Simple |
| **Client Support** | Excellent | Good |
| **Maturity** | Very Mature | Newer |

## 🚨 Legal Disclaimer

This software is provided for educational and legitimate use only. Users are responsible for:

- Complying with local laws and regulations
- Obtaining proper authorization for network access
- Using the VPN for legal purposes only
- Respecting privacy and security policies

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue on GitHub
- Check the troubleshooting section
- Review the generated README files
- Consult OpenVPN/WireGuard documentation

---

**⚠️ Important**: Always test in a safe environment before deploying to production. Keep your certificates and private keys secure!
