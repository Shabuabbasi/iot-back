# 🎯 Your System Configuration - READY TO DEPLOY

## ✅ Your Network Details (Already Configured)

```
Server IP Address:    172.30.112.1
WiFi SSID:           eduroam
WiFi Password:       bsse4388
Mobile Network:      BSSE Building - Floor 4
```

---

## ✅ Backend Configuration (Already Done)

Your `.env` file is configured with:
- ✔ MONGO_URI: Connected to MongoDB Atlas
- ✔ PORT: 5000
- ✔ JWT_SECRET: Set up
- ✔ NODE_ENV: development

**No changes needed to backend configuration!**

---

## ✅ Arduino Code Configuration (Already Done)

Your `ESP32-CAM-Code.ino` is now pre-configured with:
```cpp
const char* ssid = "eduroam";           // ✔ Your WiFi
const char* password = "bsse4388";      // ✔ Your Password
const char* serverUrl = "http://172.30.112.1:5000/api/waste/upload";  // ✔ Your Server IP
const char* binId = "BIN_001";          // Unique per bin
const char* location = "BSSE_Building_Floor_4";  // ✔ Your location
```

**No changes needed in Arduino code!**

---

## 🔧 Final Setup Steps

### Step 1: Verify Dependencies (2 minutes)
```bash
cd d:\fyp project\backend
npm install
```

### Step 2: Start Backend Server (automatic)
```bash
npm run dev
```

You should see:
```
[nodemon] starting `node src/server.js`
Server is running on port 5000
Mongo DB connected successfully
```

### Step 3: Upload Arduino Code (5 minutes)

1. **Open Arduino IDE**
2. **File → Open** → Select `ESP32-CAM-Code.ino`
3. **Tools → Board** → Select "ESP32 Wrover Module"
4. **Tools → Port** → Select your ESP32 COM port
5. **Sketch → Upload** (or Ctrl+U)
6. Wait for: "Sketch upload complete"

### Step 4: Verify WiFi Connection (1 minute)

- **Tools → Serial Monitor** (Baud: 115200)
- Watch for:
```
==============================================
ESP32-CAM Waste Management System
==============================================

Initializing camera...
Camera initialized successfully

Connecting to WiFi...
....
WiFi Connected!
IP Address: 10.19.x.x
RSSI: -55
```

### Step 5: Check Data Reception (1 minute)

Backend console should show:
```
POST /api/waste/upload HTTP/1.1
HTTP/1.1 200 OK
Waste data uploaded successfully for bin: BIN_001
```

---

## 📊 System Data Flow

```
Your ESP32-CAM (eduroam WiFi)
         ↓
   172.30.112.1:5000
   (Your Backend)
         ↓
   MongoDB Atlas Cloud
   (Your MongoDB Database)
         ↓
   /api/waste/all (accessible from your laptop)
```

---

## 🧪 Quick Tests

### Test 1: Server Health
```bash
curl http://172.30.112.1:5000/api/health
```

Expected response:
```json
{"message":"Server is healthy"}
```

### Test 2: Get All Waste Data
```bash
curl http://172.30.112.1:5000/api/waste/all
```

Expected response:
```json
{
  "message": "Waste data retrieved successfully",
  "count": 1,
  "data": [...]
}
```

### Test 3: Check Images Saved
```bash
# In Windows File Explorer, navigate to:
d:\fyp project\backend\uploads\waste\
# You should see: BIN_001-1710328200000.jpg
```

---

## 🎥 What the ESP32-CAM Will Do

**Every 30 seconds (configurable):**

1. ✔ Measure distance with ultrasonic sensor
2. ✔ Capture image with camera
3. ✔ Connect to eduroam WiFi
4. ✔ Send HTTP POST to 172.30.112.1:5000
5. ✔ Backend receives and stores data
6. ✔ Image saved with timestamp
7. ✔ Database updated with latest reading

---

## 📱 For Multiple Bins

To add more waste bins:

1. **Copy** `ESP32-CAM-Code.ino`
2. **Change only these 2 lines:**
```cpp
const char* binId = "BIN_002";              // Different ID
const char* location = "BSSE_Floor_3";      // Different location
```
3. Keep WiFi and server IP same
4. Upload to different ESP32-CAM
5. Backend automatically tracks all bins!

---

## ⚠️ Important Checklist

Before submitting project, verify:

- [ ] Backend starts without errors (`npm run dev`)
- [ ] MongoDB connection successful (check console)
- [ ] Arduino code uploaded to ESP32-CAM
- [ ] Serial Monitor shows WiFi connected
- [ ] Server receives data (HTTP 200 responses)
- [ ] Images saved in `/uploads/waste/`
- [ ] API endpoints return data
- [ ] Database has records in MongoDB Atlas

---

## 🚨 If Something Goes Wrong

### Issue: Backend won't start
```bash
# Check if port 5000 is free
netstat -ano | findstr :5000

# If port used, kill it
taskkill /PID <PID> /F

# Or use different port
# Edit .env: PORT=5001
```

### Issue: Arduino won't upload
- Check USB cable (data cable required)
- Try different USB port
- Reset ESP32 during upload (press reset button)

### Issue: WiFi "eduroam" won't connect
- Verify password: "bsse4388"
- Check BSSE Building has WiFi
- Try from different location (closer to router)
- Check 2.4GHz band available

### Issue: Server not receiving data
- Verify IP: `ipconfig` (should be 172.30.112.1)
- Check firewall allows port 5000
- Test: `ping 172.30.112.1`

### Issue: MongoDB not connected
- Check `.env` MONGO_URI is correct
- Visit MongoDB Atlas dashboard
- Ensure your IP is whitelisted

---

## 📝 Configuration Summary

| Setting | Value | Status |
|---------|-------|--------|
| Server IP | 172.30.112.1 | ✅ |
| WiFi SSID | eduroam | ✅ |
| WiFi Password | bsse4388 | ✅ |
| Backend Port | 5000 | ✅ |
| MongoDB | Connected | ✅ |
| Arduino Code | Pre-configured | ✅ |
| Bin Location | BSSE Building Floor 4 | ✅ |

---

## ✨ You're All Set!

Everything is pre-configured with your network details. Just:

1. Run: `npm run dev` (backend)
2. Upload: Arduino code to ESP32-CAM
3. Watch: Data flowing through system
4. Success! 🎉

---

## 📚 Quick Reference

- **Backend Endpoint:** http://172.30.112.1:5000/api/waste/upload
- **Get Data:** http://172.30.112.1:5000/api/waste/all
- **Folder Structure:** d:\fyp project\backend\
- **Images Location:** d:\fyp project\backend\uploads\waste\
- **Setup Guide:** SETUP-GUIDE.md
- **API Docs:** API-DOCUMENTATION.md

---

**Status:** ✅ System Ready for Deployment  
**Date:** March 13, 2026  
**Version:** 1.0 - Final Configuration

Good luck! Your system is ready to monitor waste levels. 🚀

