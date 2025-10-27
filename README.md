# Chainway R6 RFID Reader Web App

A modern web application for reading UHF RFID tags using the Chainway R6 handheld reader via Bluetooth Low Energy (BLE).

![RFID Reader](https://img.shields.io/badge/RFID-UHF-blue) ![Bluetooth](https://img.shields.io/badge/Bluetooth-BLE-green) ![React](https://img.shields.io/badge/React-18.2-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178c6)

## 🚀 Features

- ✅ **Bluetooth Connectivity**: Connect to Chainway R6 via Web Bluetooth API
- ✅ **Real-time Tag Reading**: Read UHF RFID tags in real-time
- ✅ **Power Control**: Adjust reader power (0-30 dBm)
- ✅ **Tag Management**: View, count, and track detected tags
- ✅ **CSV Export**: Export tag data to CSV format
- ✅ **Responsive Design**: Works on desktop and mobile devices
- ✅ **Modern UI**: Clean and intuitive user interface

## 📋 Requirements

### Browser Requirements
- **Chrome/Edge 89+** (recommended)
- **Opera 76+**
- Browser must support **Web Bluetooth API**

> ⚠️ **Important**: Web Bluetooth requires **HTTPS**. The app will not work over HTTP (except on localhost).

### Device Requirements
- **Chainway R6** handheld UHF RFID reader with Bluetooth Low Energy (BLE)
- Device must be in pairing mode

## 🛠️ Installation

1. **Navigate to the webapp directory**:
   ```bash
   cd webapp
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

## 🏃 Running the Application

### Development Mode

Run the development server with HTTPS:

```bash
npm run dev
```

The app will be available at: `https://localhost:3000`

> 💡 **Note**: Your browser will show a security warning because of the self-signed certificate. Click "Advanced" and "Proceed to localhost" to continue.

### Production Build

Build the application for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## 📱 How to Use

### 1. Connect to Device

1. Click the **"Connect Device"** button
2. A browser dialog will appear showing available Bluetooth devices
3. Select your Chainway R6 device (should show as "R6" or "Chainway")
4. Click **"Pair"**
5. Wait for the connection to establish (status indicator will turn green)

### 2. Adjust Power (Optional)

- Use the **power slider** to adjust the reader's transmission power
- Range: 0-30 dBm
- Higher power = longer read range but more battery consumption

### 3. Start Scanning

1. Click **"▶ Start Scan"** to begin reading RFID tags
2. Tags will appear in the list below as they are detected
3. Each tag shows:
   - **EPC**: Electronic Product Code (unique identifier)
   - **RSSI**: Signal strength
   - **Count**: Number of times the tag was read
   - **PC**: Protocol Control word
   - **Timestamp**: When the tag was last read

### 4. Manage Tags

- **Clear**: Remove all tags from the list
- **Export CSV**: Download tag data as a CSV file
- **Stop Scan**: Stop reading tags

### 5. Disconnect

Click **"Disconnect"** when finished to close the Bluetooth connection.

## 🏗️ Project Structure

```
webapp/
├── src/
│   ├── components/
│   │   ├── RFIDReader.tsx       # Main RFID reader component
│   │   └── RFIDReader.css       # Component styles
│   ├── services/
│   │   └── chainway-r6.service.ts  # Bluetooth communication service
│   ├── types/
│   │   └── rfid.types.ts        # TypeScript type definitions
│   ├── App.tsx                  # Root application component
│   ├── App.css                  # Global app styles
│   ├── main.tsx                 # Application entry point
│   └── index.css                # Global styles
├── index.html                   # HTML template
├── package.json                 # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite configuration
└── README.md                   # Documentation
```

## 🔧 Technical Details

### Web Bluetooth API

The application uses the Web Bluetooth API to communicate with the Chainway R6:

- **Service UUID**: `0000fff0-0000-1000-8000-00805f9b34fb`
- **Characteristic UUID**: `0000fff1-0000-1000-8000-00805f9b34fb`

### Communication Protocol

Commands are sent as byte arrays following the Chainway protocol:

- **Start Inventory**: `[0xA0, 0x04, 0x01, 0x27, 0xCC]`
- **Stop Inventory**: `[0xA0, 0x04, 0x01, 0x28, 0xCD]`
- **Set Power**: `[0xA0, 0x05, 0x01, 0xB6, <power>, <checksum>]`

Tag data is received via Bluetooth notifications and parsed to extract:
- EPC (Electronic Product Code)
- RSSI (Signal Strength)
- PC (Protocol Control)

## 🌐 Browser Compatibility

| Browser | Minimum Version | Status |
|---------|----------------|--------|
| Chrome | 89+ | ✅ Supported |
| Edge | 89+ | ✅ Supported |
| Opera | 76+ | ✅ Supported |
| Firefox | - | ❌ Not Supported |
| Safari | - | ❌ Not Supported |

> Firefox and Safari do not currently support the Web Bluetooth API.

## 🔒 Security & Privacy

- The app only requests access to Bluetooth devices that match the R6 filter
- No data is sent to external servers
- All processing happens locally in your browser
- HTTPS is required for security

## 🐛 Troubleshooting

### Cannot Connect to Device

1. **Check Bluetooth is enabled** on your computer
2. **Ensure the R6 is powered on** and in pairing mode
3. **Check the R6 is in range** (typically within 10 meters)
4. **Restart the browser** and try again
5. **Clear browser cache** and reload the page

### No Tags Detected

1. **Check power level** - increase if needed
2. **Ensure tags are in range** (typically 1-10 meters depending on power)
3. **Verify tags are UHF RFID tags** (EPC Gen2)
4. **Check scanning is started** (green "Stop Scan" button should be visible)

### Browser Shows "Bluetooth not supported"

1. **Update your browser** to the latest version
2. **Use Chrome or Edge** (Firefox/Safari don't support Web Bluetooth)
3. **Check you're using HTTPS** (required for Web Bluetooth)

### Certificate Warning on HTTPS

This is normal for local development. The development server uses a self-signed certificate. Click "Advanced" → "Proceed to localhost" to continue.

## 📚 API Documentation

The Chainway R6 SDK documentation is located in the `doc/` folder at the project root.

Key classes:
- `RFIDWithUHFBLE`: Bluetooth UHF RFID reader operations
- `UHFTAGInfo`: Tag information structure
- `IUHFInventoryCallback`: Callback interface for tag reads

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

This project is provided as-is for use with Chainway R6 RFID readers.

## 🙏 Acknowledgments

- Built with React + TypeScript + Vite
- Uses Web Bluetooth API for device communication
- Designed for Chainway R6 UHF RFID readers

---

**Made with ❤️ for RFID enthusiasts**
