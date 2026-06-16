# 🚀 START HERE - Complete Startup Guide

## ✅ What's Ready for You

Your entire Smart Waste Management System is configured and ready to run with your specific network:

```
WiFi: eduroam (bsse4388)
Server: 172.30.112.1:5000
Backend: Node.js Express
Database: MongoDB Atlas
Hardware: ESP32-CAM + HC-SR04
```

---

## ⚡ Quick Start (15 minutes)

### **Part A: Start Backend Server (2 minutes)**

```bash
# Open Command Prompt/PowerShell
cd d:\fyp project\backend

# Install dependencies (one time)
npm install

# Start server
npm run dev
```

✅ Stop when you see:
```
[nodemon] starting `node src/server.js`
Server is running on port 5000
Mongo DB connected successfully
```

**Keep this terminal OPEN** while ESP32 is running.

---

### **Part B: Upload Arduino Code (5 minutes)**

1. **Connect ESP32-CAM** to laptop via USB cable

2. **Open Arduino IDE**

3. **File → Open** 
   - Select: `d:\fyp project\backend\ESP32-CAM-Code.ino`

4. **Select Board & Port**
   - Tools → Board → "ESP32 Wrover Module"
   - Tools → Port → Select your COM port

5. **Upload Code**
   - Click Upload button (▶)
   - Wait for: "Sketch upload complete"

6. **Verify Connection**
   - Tools → Serial Monitor (Baud: 115200)
   - Should see WiFi connected message

✅ Done! System now sends data every 30 seconds.

---

### **Part C: Verify Data Flow (1 minute)**

**In Command Prompt:**
```bash
# Check server is receiving data
curl http://172.30.112.1:5000/api/waste/all
```

**Expect:**
```json
{
  "message": "Waste data retrieved successfully",
  "count": 1,
  "data": [{"binId":"BIN_001","location":"BSSE_Building..."}]
}
```

✅ Success! Data is flowing.

---

## 📂 Files You Need to Know

| File | Purpose |
|------|---------|
| **ESP32-CAM-Code.ino** | Arduino code - already configured |
| **.env** | Backend config - already configured |
| **src/server.js** | Backend server |
| **YOUR-SETUP-CONFIGURATION.md** | Your specific settings |
| **API-DOCUMENTATION.md** | All API endpoints |
| **SETUP-GUIDE.md** | Detailed instructions |

---

## 🔌 Hardware Setup

### Ultrasonic Sensor to ESP32-CAM:
```
HC-SR04     →    ESP32-CAM
VCC (5V)    →    5V
GND         →    GND  
TRIG        →    GPIO 13
ECHO        →    GPIO 12
```

### Power:
- 5V external power supply (USB not enough)
- Ground connected

---

## 🧪 Quick Tests

### Test 1: Server Running?
```bash
curl http://172.30.112.1:5000/api/health
# Should return: {"message":"Server is healthy"}
```

### Test 2: Database Connected?
- Check backend console for "Mongo DB connected successfully"

### Test 3: Data Saved?
```bash
curl http://172.30.112.1:5000/api/waste/all
# Should return JSON array
```

### Test 4: Images Saved?
- File Explorer → `d:\fyp project\backend\uploads\waste\`
- Should see JPG files

---

## 🎯 What's Happening

```
Every 30 seconds:

1. ESP32-CAM measures distance with ultrasonic sensor
2. Takes a JPEG photo with camera  
3. Connects to "eduroam" WiFi
4. Sends HTTP POST to 172.30.112.1:5000
5. Backend receives and processes data
6. Image saved to disk
7. Data saved to MongoDB
8. API endpoints updated
```

---

## 📊 Expected Output

### Serial Monitor (Arduino):
```
==============================================
ESP32-CAM Waste Management System
==============================================

Initializing camera...
Camera initialized successfully

Connecting to WiFi...
WiFi Connected!
IP Address: 10.19.x.x

--- Sending Waste Data ---
Distance: 15.5 cm
Photo captured. Size: 28430 bytes
Starting HTTP request...
HTTP Response Code: 200
Response: {"message":"Waste data uploaded successfully",...}
Next transmission in 30 seconds...
```

### Backend Console:
```
[nodemon] starting `node src/server.js`
Server is running on port 5000
Mongo DB connected successfully

POST /api/waste/upload 200 - 1.245s
Waste data uploaded successfully
```

---

## ⚠️ Common Issues

### Issue: Backend doesn't start
```bash
# Error: listen EADDRINUSE :::5000
# Solution: Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Issue: Arduino won't upload
- Check USB cable (data cable, not charger)
- Try different USB port
- Install CH340 driver if needed

### Issue: WiFi won't connect
- Check SSID: "eduroam" (case-sensitive)
- Check password: "bsse4388"
- Ensure 2.4GHz WiFi connection
- Try from closer to router

### Issue: Server not receiving data
```bash
# Verify IP address
ipconfig
# Should show 172.30.112.1

# Test connectivity
ping 172.30.112.1
```

---

## 📈 Success Checklist

- [ ] Backend starts without errors
- [ ] MongoDB shows "connected"
- [ ] Arduino uploads successfully
- [ ] Serial Monitor shows WiFi connected
- [ ] Backend receives HTTP POST (check console)
- [ ] curl http://172.30.112.1:5000/api/waste/all returns data
- [ ] Images appear in `/uploads/waste/` folder
- [ ] Data visible in MongoDB Atlas

---

## 🎓 For Your FYP Report

Include:
1. Circuit diagram of ESP32 + ultrasonic sensor
2. Architecture diagram (3-tier: Device → Server → DB)
3. API flow diagram
4. Screenshots of:
   - Arduino Serial Monitor
   - Backend console output
   - API response in browser
   - MongoDB records
5. Test results with timestamps
6. Performance metrics (response times)
7. Challenges and solutions

---

## 📞 Reference Documents

1. **YOUR-SETUP-CONFIGURATION.md** ← Your specific settings
2. **API-DOCUMENTATION.md** ← All endpoints
3. **SETUP-GUIDE.md** ← Detailed setup
4. **COMPLETE-IMPLEMENTATION.md** ← Full overview
5. **README.md** ← Project info

---

## 🚀 Next Steps

1. **NOW:** Start backend server (`npm run dev`)
2. **NEXT:** Upload Arduino code to ESP32-CAM
3. **VERIFY:** Check data in MongoDB
4. **EXTEND:** Add more bins by uploading code with different binId
5. **DEPLOY:** Copy to cloud server if needed

---

## ✨ Key Points

- Your server IP **172.30.112.1** is pre-configured in Arduino code
- WiFi **eduroam** with password **bsse4388** is pre-configured
- Backend is ready to receive data on port **5000**
- MongoDB Atlas is already connected
- Images auto-save to `/uploads/waste/`
- Data auto-saves to MongoDB

**Everything is ready to go!** 🎉

---

**Status:** ✅ Ready for Production  
**Configuration:** Complete with your network details  
**Version:** 1.0 - Final  
**Date:** March 13, 2026

Run `npm run dev` and upload the Arduino code. That's it! 🚀

