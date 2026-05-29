# 📥 Installation Guide

## Enterprise POS & ERP System

This guide covers complete installation for Windows desktop deployment.

---

## Option 1: Pre-Built Executable (Recommended)

### Step 1: Download
- Get the latest release from the repository or provided installer
- Installer file: `EnterprisePOS-Setup.exe`

### Step 2: Run Installer
1. Double-click `EnterprisePOS-Setup.exe`
2. If SmartScreen appears, click "More info" → "Run anyway"
3. Follow installation wizard:
   - Accept license agreement
   - Choose installation location
   - Create desktop shortcut (optional)
   - Choose Start Menu folder

### Step 3: Launch Application
- Launch from Desktop shortcut or Start Menu
- Default credentials:
  - Username: `admin`
  - Password: `admin123`

---

## Option 2: Build from Source

### Prerequisites
- Windows 10/11
- Node.js 18+ (Download from nodejs.org)
- Git

### Step 1: Install Node.js
```bash
# Download from https://nodejs.org/
# LTS version recommended (18.x or higher)
```

### Step 2: Clone Repository
```bash
git clone https://github.com/ShahabAhmed01/enterprise-pos-erp.git
cd enterprise-pos-erp
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Run in Development Mode
```bash
npm run dev
```

### Step 5: Build Desktop App
```bash
# Build for Windows
npm run electron:build

# Output will be in 'release/' or 'dist/' folder
```

---

## Option 3: Portable Version

### Creating Portable App
```bash
npm run electron:build -- -p portable
```

The portable `.exe` can run from USB drive without installation.

---

## Database Setup

The application uses SQLite with local storage:
- Database file: `%APPDATA%/enterprise-pos/data.db`
- Auto-created on first run
- Auto-backup enabled

---

## Troubleshooting

### App won't start
1. Install VC++ Redistributables
2. Run as Administrator

### Database errors
1. Delete `%APPDATA%/enterprise-pos/`
2. Restart application

### Printer not working
1. Ensure ESC/POS compatible printer
2. Check printer is set as default

---

## First-Time Setup

1. **Login** with default credentials
2. **Change password** immediately
3. **Configure** business settings (Settings → Business)
4. **Add** categories and brands
5. **Add** products with barcodes
6. **Add** employees and assign roles

---

## Support

For issues, contact: [GitHub Issues](https://github.com/ShahabAhmed01/enterprise-pos-erp/issues)
