# Smart Waste Management System - Setup Guide

## Project Overview
This is an IoT-based Smart Waste Management System that monitors waste levels in bins using ultrasonic sensors and ESP32-CAM devices, sending data to a Node.js backend for real-time monitoring and collection management.

---

## Part 1: Backend Setup

### 1.1 Install Node Modules
```bash
cd backend
npm install
```

### 1.2 Environment Configuration
Create a `.env` file in the backend folder:

```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@your-cluster.mongodb.net/waste-management
JWT_SECRET=your_super_secret_key_here_change_this
JWT_EXPIRES_IN=7d
```

### 1.3 Start Backend Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:5000`

---

## Part 2: Hardware Setup

### 2.1 Required Components
- **ESP32-CAM** Module
- **HC-SR04** Ultrasonic Sensor (Waste Level Detection)
- **5V Power Supply**
- **USB Cable** for programming

### 2.2 Wiring Diagram

#### ESP32-CAM to HC-SR04 Connection
```
HC-SR04          ESP32-CAM
VCC ────────────→ 5V
GND ────────────→ GND
TRIG ───────────→ GPIO 13
ECHO ───────────→ GPIO 12
```

#### Alternative connections if needed:
- TRIG: GPIO 12, ECHO: GPIO 13 (swap them)
- TRIG: GPIO 14, ECHO: GPIO 15
- TRIG: GPIO 2, ECHO: GPIO 4

### 2.3 Power Considerations
- Use external 5V power supply for both ESP32-CAM and ultrasonic sensor
- Don't power from USB alone (insufficient current)
- Use voltage regulator if needed

---

## Part 3: Arduino IDE Setup

### 3.1 Install Arduino IDE
Download from: https://www.arduino.cc/en/software

### 3.2 Add ESP32 Board Support

1. Go to: **File → Preferences**
2. Add this URL to "Additional Boards Manager URLs":
   ```
   https://dl.espressif.com/dl/package_esp32_index.json
   ```
3. Go to: **Tools → Board Manager**
4. Search for "ESP32" and install by Espressif Systems

### 3.3 Select Board and Port

1. **Tools → Board**: Select "ESP32 Wrover Module"
2. **Tools → Port**: Select COM port of your ESP32
3. **Tools → Upload Speed**: 115200

---

## Part 4: Arduino Code Setup

### 4.1 Install Required Libraries

In Arduino IDE, go to **Sketch → Include Library → Manage Libraries** and install:

1. **esp32-camera** - ESP32 camera support
2. Search and install any other required dependencies

### 4.2 Load the Code

1. Copy the code from `ESP32-CAM-Code.ino`
2. Open Arduino IDE and paste the code
3. **IMPORTANT**: Modify these values in the code:

```cpp
// ==================== WiFi Configuration ====================
const char* ssid = "YOUR_WIFI_SSID";           // ← Change this
const char* password = "YOUR_WIFI_PASSWORD";   // ← Change this

// ==================== Backend API Configuration ====================
const char* serverUrl = "http://YOUR_SERVER_IP:5000/api/waste/upload";  // ← Change IP
const char* binId = "BIN_001";                 // ← Unique ID for each bin
const char* location = "Street_A_Corner_2";    // ← Location name
```

### 4.3 Upload Code

1. Connect ESP32-CAM via USB cable
2. Click **Upload** button
3. Wait for "Sketch upload complete" message

### 4.4 Verify Connection

1. Open **Tools → Serial Monitor**
2. Set baud rate to **115200**
3. You should see:
   ```
   ==============================================
   ESP32-CAM Waste Management System
   ==============================================
   
   Initializing camera...
   Camera initialized successfully
   
   Connecting to WiFi...
   WiFi Connected!
   IP Address: 192.168.x.x
   ```

---

## Part 5: API Testing

### 5.1 Test with cURL

```bash
# Test server health
curl http://localhost:5000/api/health

# Get all waste data
curl http://localhost:5000/api/waste/all

# Get statistics
curl http://localhost:5000/api/waste/stats

# Get full bins
curl http://localhost:5000/api/waste/full-bins
```

### 5.2 Simulate Waste Data

Using Postman or cURL to test the upload endpoint:

```bash
curl -X POST http://localhost:5000/api/waste/upload \
  -H "X-Waste-Distance: 25.5" \
  -H "X-Bin-ID: BIN_001" \
  -H "X-Location: Test_Location" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @test_image.jpg
```

---

## Part 6: Project Structure

```
backend/
├── src/
│   ├── server.js                    # Main server file
│   ├── config/
│   │   └── database.js              # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js        # User authentication
│   │   └── wasteController.js       # Waste management logic
│   ├── models/
│   │   ├── userModel.js             # User schema
│   │   └── wasteModel.js            # Waste schema
│   ├── routes/
│   │   ├── auth.routes.js           # Auth endpoints
│   │   └── waste.routes.js          # Waste endpoints
│   └── middlewares/
│       └── uploadMiddleware.js      # Image upload handler
├── uploads/
│   └── waste/                       # Saved bin images
├── package.json                     # Dependencies
├── .env                            # Environment variables
├── ESP32-CAM-Code.ino              # Arduino code
└── API-DOCUMENTATION.md            # API docs
```

---

## Part 7: MongoDB Setup

### 7.1 Create Cluster on MongoDB Atlas

1. Go to: https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a new cluster
4. Get connection string and update `.env`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/waste-management
```

### 7.2 Database Collections

The system automatically creates these collections:
- **users** - User accounts (admin, collector)
- **wastes** - Waste records with images

---

## Part 8: Data Flow Diagram

```
┌──────────────┐
│  ESP32-CAM   │
├──────────────┤
│ • Ultrasonic │
│   Sensor     │
│ • Camera     │
│ • WiFi       │
└──────┬───────┘
       │ (HTTP POST)
       │ Binary Image +
       │ Headers (Distance, BinID)
       ▼
┌──────────────────────┐
│   Node.js Backend    │
├──────────────────────┤
│ • Express Server     │
│ • Image Storage      │
│ • MongoDB Database   │
└──────┬───────────────┘
       │
       ▼
┌──────────────────┐
│ MongoDB Cloud    │
├──────────────────┤
│ • Waste Records  │
│ • User Data      │
│ • Statistics     │
└──────────────────┘
```

---

## Part 9: Troubleshooting

### Issue: ESP32 Won't Upload
- Check USB cable (data cable, not charging only)
- Try different USB port
- Install **CH340 driver**: https://github.com/wch-ch/ch341ser_windows

### Issue: Camera Init Failed
- Check GPIO pin connections
- Verify power supply (5V, sufficient current)
- Try different FRAMESIZE (FRAMESIZE_QVGA instead of VGA)

### Issue: WiFi Connection fails
- Double-check SSID and password (case-sensitive)
- Ensure 2.4GHz WiFi (ESP32 doesn't support 5GHz)
- Add WiFi.reconnect() in loop

### Issue: Server receiving no data
- Check server IP address in Arduino code
- Verify firewall allows port 5000
- Test connectivity: `ping YOUR_SERVER_IP`

### Issue: Images not saving
- Verify `/uploads/waste/` directory exists
- Check file permissions
- Ensure sufficient disk space

---

## Part 10: Maintenance & Monitoring

### Check System Health
```bash
curl http://YOUR_SERVER_IP:5000/api/health
```

### View Recent Waste Data
```bash
curl http://YOUR_SERVER_IP:5000/api/waste/all
```

### Monitor Full Bins
```bash
curl http://YOUR_SERVER_IP:5000/api/waste/full-bins
```

---

## Part 11: For FYP Project

### What to Document
1. Complete hardware circuit diagram
2. System architecture diagram
3. ER diagram for MongoDB schema
4. API flow diagrams
5. Testing results and screenshots
6. Performance metrics

### Key Features to Highlight
- Real-time waste monitoring
- Automated image capture
- Cloud-based data storage
- RESTful API design
- Scalability for multiple bins

---

## Support & Resources

- **ESP32 Documentation**: https://docs.espressif.com/projects/esp-idf/
- **Express.js Docs**: https://expressjs.com/
- **MongoDB Docs**: https://docs.mongodb.com/
- **Arduino References**: https://www.arduino.cc/reference/

---

**Last Updated:** March 13, 2026
**Version:** 1.0

