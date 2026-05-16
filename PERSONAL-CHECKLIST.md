# ✅ YOUR PERSONAL SETUP CHECKLIST

## Your System Configuration
```
IP Address:   172.30.112.1  ✅
WiFi SSID:    eduroam       ✅
WiFi Pass:    bsse4388      ✅
Location:     BSSE Floor 4  ✅
```

---

## 📋 Pre-Flight Checklist

### Hardware Preparation (15 minutes)
- [ ] Gather ESP32-CAM board
- [ ] Gather HC-SR04 ultrasonic sensor
- [ ] Prepare USB data cable (not charging cable)
- [ ] Prepare 5V power supply
- [ ] Connect sensor to ESP32: VCC→5V, GND→GND, TRIG→GPIO13, ECHO→GPIO12
- [ ] Power on ESP32-CAM
- [ ] LED should light up (verify power)

### Software Preparation (10 minutes)
- [ ] Arduino IDE installed
- [ ] ESP32 board added to Arduino IDE
- [ ] Node.js installed (`node -v` should work)
- [ ] npm installed (`npm -v` should work)
- [ ] File: d:\fyp project\backend\ESP32-CAM-Code.ino ready
- [ ] File: d:\fyp project\backend\package.json ready
- [ ] File: d:\fyp project\backend\.env exists

### Network Preparation (5 minutes)
- [ ] WiFi "eduroam" appears in available networks
- [ ] You have WiFi password: "bsse4388"
- [ ] Your laptop is on same network (172.30.112.1)
- [ ] Firewall allows port 5000 (ask IT if issues)
- [ ] MongoDB connection string in .env is valid

---

## 🚀 Startup Procedure

### STEP 1: Start Backend (Do This First)

**Location:** Open Command Prompt / PowerShell

```bash
cd d:\fyp project\backend
npm install
npm run dev
```

**Wait for:**
```
[nodemon] starting `node src/server.js`
Server is running on port 5000
Mongo DB connected successfully
```

**Status:** ✅ Backend ready, keep terminal open

---

### STEP 2: Connect ESP32-CAM

- [ ] Connect ESP32-CAM via USB cable to laptop
- [ ] Wait 2 seconds for driver to load
- [ ] Check COM port appeared in Device Manager

---

### STEP 3: Upload Arduino Code

**In Arduino IDE:**

1. [ ] File → Open → `ESP32-CAM-Code.ino`
2. [ ] Tools → Board → "ESP32 Wrover Module"
3. [ ] Tools → Port → Select COM port
4. [ ] Sketch → Upload (Or Ctrl+U)

**Wait for:**
```
Sketch upload complete
No errors
```

**Status:** ✅ Code uploaded to ESP32

---

### STEP 4: Verify WiFi Connection

**In Arduino IDE:**

1. [ ] Tools → Serial Monitor
2. [ ] Set baud rate to 115200 (bottom right)
3. [ ] Watch output - should see:

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
RSSI: -45
```

**Status:** ✅ WiFi connected, system sending data

---

### STEP 5: Check Backend Receives Data

**In backend terminal (npm run dev):**

Watch for:
```
POST /api/waste/upload HTTP/1.1
HTTP Response Code: 200
Waste data uploaded successfully
```

**Status:** ✅ Data received by backend

---

### STEP 6: Verify Images Saved

**In File Explorer:**

Navigate to: `d:\fyp project\backend\uploads\waste\`

Check for files like:
```
BIN_001-1710328200000.jpg
BIN_001-1710328230000.jpg
```

**Status:** ✅ Images being saved

---

### STEP 7: Check Database

**In Command Prompt:**

```bash
curl http://172.30.112.1:5000/api/waste/all
```

Should return JSON:
```json
{
  "message": "Waste data retrieved successfully",
  "count": 1,
  "data": [
    {
      "binId": "BIN_001",
      "location": "BSSE_Building_Floor_4",
      "distance": 15.5,
      "wasteLevel": 51,
      "status": "half"
    }
  ]
}
```

**Status:** ✅ Data in database

---

## 🎯 How to Know It's Working

| What to Check | Expected Result | Status |
|---------------|-----------------|--------|
| Arduino Serial | "WiFi Connected" | ✅ |
| Backend Console | "HTTP 200" response | ✅ |
| API Response | JSON with data | ✅ |
| Images | Files in `/uploads/waste/` | ✅ |
| MongoDB | Records present | ✅ |
| API Endpoints | Return correct data | ✅ |

---

## ⚠️ Common First-Time Issues

### Issue 1: "WiFi won't connect"
**Solution:**
- Check SSID exactly: "eduroam" (lowercase)
- Check password exactly: "bsse4388"
- Make sure you're on 2.4GHz (not 5GHz)
- Move closer to WiFi router
- Try: restart ESP32-CAM and re-upload code

### Issue 2: "Backend won't start - Port 5000 in use"
**Solution:**
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
npm run dev
```

### Issue 3: "Arduino upload fails"
**Solution:**
- Use DATA cable (not charging cable)
- Try different USB port
- Restart computer
- Reinstall CH340 driver

### Issue 4: "No data in database"
**Solution:**
- Check backend console for errors
- Verify MongoDB connection string in .env
- Check IP address: run `ipconfig`
- Make sure backend is running (npm run dev active)

### Issue 5: "Images not saving"
**Solution:**
- Check folder exists: `d:\fyp project\backend\uploads\waste\`
- Check disk space available
- Check file permissions
- Verify multer installed: `npm list multer`

---

## 📱 Testing the Entire System

### Test 1: Single Upload
```bash
# Move hand towards ultrasonic sensor
# Wait 30 seconds for auto-send
# Check backend console for "HTTP 200"
```

### Test 2: View Latest Data
```bash
curl http://172.30.112.1:5000/api/waste/all
# Should show your data
```

### Test 3: View Specific Bin
```bash
curl http://172.30.112.1:5000/api/waste/bin/BIN_001
# Should show BIN_001 data
```

### Test 4: Get Statistics
```bash
curl http://172.30.112.1:5000/api/waste/stats
# Should show total bins and average waste level
```

### Test 5: View Full Bins
```bash
curl http://172.30.112.1:5000/api/waste/full-bins
# Should show which bins are full
```

---

## 📊 Expected Data Format

When everything works, you should see in database:

```json
{
  "_id": "ObjectId(...)",
  "binId": "BIN_001",
  "location": "BSSE_Building_Floor_4",
  "wasteLevel": 85,
  "distance": 25.5,
  "status": "full",
  "imageUrl": "/uploads/waste/BIN_001-1710328200000.jpg",
  "ipAddress": "10.19.x.x",
  "createdAt": "2026-03-13T10:30:00.000Z",
  "updatedAt": "2026-03-13T10:30:05.000Z"
}
```

---

## 🛠️ Maintenance Notes

**Every 30 seconds:**
- [ ] Check Arduino Serial Monitor for successful upload
- [ ] Check backend receives HTTP 200 response
- [ ] Verify new images appear in `/uploads/waste/`

**Every hour:**
- [ ] Verify database has recent records
- [ ] Check API endpoints return updated data
- [ ] Monitor disk space (images take ~30KB each)

**Daily:**
- [ ] Check MongoDB for any errors
- [ ] Verify WiFi connection stable
- [ ] Check for loose connections on ultrasonic sensor

---

## 📈 Performance Baseline

Your system should show:

| Metric | Expected Value |
|--------|-----------------|
| WiFi Connection Time | <5 seconds |
| Data Send Interval | 30 seconds |
| HTTP Response Time | <1 second |
| Database Save Time | <500ms |
| Image Size | 25-35 KB |
| CPU Usage | <30% |
| Memory Usage | <80MB |

---

## 🎓 FYP Documentation

Create these for your report:

1. **Circuit Diagram** (Fritzing)
   - ESP32-CAM connections
   - Ultrasonic sensor connections
   - Power connections

2. **System Architecture** (BlockDiagram)
   - Device → Server → Database flow
   - WiFi connection
   - API endpoints

3. **Screenshots**
   - Arduino Serial Monitor (WiFi connected)
   - Backend console (HTTP 200 responses)
   - MongoDB data
   - API response (curl output)
   - File structure
   - Images in `/uploads/waste/`

4. **Test Results**
   - Date/time of test
   - Distance readings
   - Response times
   - Image sizes
   - Database records

5. **Performance Data**
   - Average response time
   - Data transmission success rate
   - WiFi connection stability
   - System uptime

---

## 💾 Backup Important Files

Before final submission, backup:

```bash
# Backup your .env with real MongoDB URI
Copy .env → .env.backup

# Backup ESP32-CAM-Code.ino
Copy ESP32-CAM-Code.ino → ESP32-CAM-Code-FINAL.ino

# Export MongoDB data
# (Use MongoDB Atlas export feature)
```

---

## 🚨 Emergency Procedures

### System Won't Start
```bash
# 1. Stop backend: Ctrl+C
# 2. Kill any process on 5000: taskkill /PID ... /F
# 3. Restart: npm run dev
```

### WiFi Disconnected
```bash
# 1. Check router is on
# 2. Reset ESP32-CAM
# 3. Re-upload Arduino code
```

### No Data Being Received
```bash
# 1. Check backend console for errors
# 2. Verify API endpoint: curl http://172.30.112.1:5000/api/health
# 3. Check MongoDB connection string
# 4. Check firewall settings
```

---

## ✅ Final Verification

Before saying "it's working", verify ALL of these:

- [ ] Backend starts without errors
- [ ] Arduino serial shows "WiFi Connected"
- [ ] Backend console shows "HTTP 200"
- [ ] Images appear in `/uploads/waste/`
- [ ] API returns JSON data (curl test)
- [ ] MongoDB has records
- [ ] System runs for 5+ minutes without errors
- [ ] New data arrives every 30 seconds

---

## 📞 Quick Help Commands

```bash
# Check if backend is running
curl http://172.30.112.1:5000/api/health

# Get all waste data
curl http://172.30.112.1:5000/api/waste/all

# Get your IP
ipconfig

# Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Check npm packages
npm list

# Reinstall node_modules
rm -r node_modules
npm install
```

---

## 🎉 You're All Set!

Everything is configured and ready. Just follow the steps above and your system will work!

**Remember:**
1. Keep backend terminal open (npm run dev)
2. Upload Arduino code to ESP32
3. Wait for data to flow
4. Check results in database

**Good luck with your FYP!** 🚀

---

**Checklist Status:** Ready to Deploy  
**Configuration:** 172.30.112.1, eduroam, bsse4388 ✅  
**Version:** 1.0.0  
**Date:** March 13, 2026

