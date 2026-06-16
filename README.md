# Smart Waste Management System - IoT Project

A complete IoT-based Smart Waste Management System that monitors waste levels in bins using ultrasonic sensors and ESP32-CAM devices. The system sends real-time data to a Node.js backend for monitoring, analysis, and optimized waste collection.

## Features

✅ **Real-time Waste Level Monitoring**
- Ultrasonic sensor detects waste level in cm
- Automatic status classification (empty, half, full)
- Waste level percentage calculation

✅ **Image Capture & Storage**
- ESP32-CAM captures bin photos
- Images stored on backend server
- Accessible via REST API

✅ **Cloud Database Integration**
- MongoDB stores all waste data
- Scalable and reliable data persistence
- Easy data querying and analytics

✅ **RESTful API**
- Complete API for waste data management
- User authentication system
- Statistics and analytics endpoints

✅ **Multi-Bin Support**
- Each bin has unique identifier
- Location tracking
- Independent status monitoring

## System Architecture

```
ESP32-CAM + Ultrasonic Sensor
         ↓
    WiFi Upload
         ↓
Node.js Express Server
         ↓
MongoDB Database + Image Storage
         ↓
Dashboard & Analytics
```

## Tech Stack

### Hardware
- **ESP32-CAM** - Microcontroller with camera
- **HC-SR04** - Ultrasonic sensor
- **WiFi** - Wireless communication

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Multer** - File upload handling
- **JWT** - Authentication

### DevTools
- **Arduino IDE** - Code upload
- **Postman** - API testing
- **MongoDB Atlas** - Cloud database

## Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env  # Configure your .env
npm run dev
```

### 2. Arduino Code
1. Install Arduino IDE
2. Add ESP32 board support
3. Load `ESP32-CAM-Code.ino`
4. Update WiFi credentials and server IP
5. Upload to ESP32-CAM

### 3. Test the System
```bash
# Check server health
curl http://localhost:5000/api/health

# View all waste data
curl http://localhost:5000/api/waste/all
```

## API Endpoints

### Waste Management
- `POST /api/waste/upload` - Upload waste data and image
- `GET /api/waste/all` - Get all waste records
- `GET /api/waste/bin/:binId` - Get specific bin data
- `GET /api/waste/stats` - Get statistics
- `GET /api/waste/full-bins` - Get bins needing collection

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

## Project Structure

```
fyp project/
└── backend/
    ├── src/
    │   ├── server.js
    │   ├── config/
    │   ├── controllers/
    │   ├── models/
    │   ├── routes/
    │   └── middlewares/
    ├── uploads/
    ├── package.json
    ├── .env
    ├── ESP32-CAM-Code.ino
    ├── API-DOCUMENTATION.md
    ├── SETUP-GUIDE.md
    └── README.md
```

## Data Structure

### Waste Record
```json
{
  "binId": "BIN_001",
  "location": "Street_A_Corner_2",
  "wasteLevel": 85,
  "distance": 25.5,
  "status": "full",
  "imageUrl": "/uploads/waste/BIN_001-1234567890.jpg",
  "ipAddress": "192.168.1.50",
  "createdAt": "2026-03-13T09:00:00.000Z",
  "updatedAt": "2026-03-13T10:30:00.000Z"
}
```

## Key Features

### Waste Level Detection
- Uses HC-SR04 ultrasonic sensor
- Measures distance in cm
- Calculates percentage (0-100%)
- Auto-classifies as: empty, half, or full

### Image Capture
- 30fps video capture capability
- JPEG compression for efficiency
- Stored with timestamp and bin ID
- Accessible via HTTP

### Real-time Updates
- Configurable update interval (default: 30 seconds)
- Automatic retries on connection failure
- IP address logging for tracking

### Analytics
- Waste statistics by status
- Average waste levels
- Collection tracking
- Historical data analysis

## Environmental Variables

```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/waste-management
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
```

## Hardware Connections

### Ultrasonic Sensor to ESP32-CAM
| Sensor | ESP32-CAM |
|--------|-----------|
| VCC    | 5V        |
| GND    | GND       |
| TRIG   | GPIO 13   |
| ECHO   | GPIO 12   |

## Testing

### Test with cURL
```bash
# Upload test data
curl -X POST http://localhost:5000/api/waste/upload \
  -H "X-Waste-Distance: 25.5" \
  -H "X-Bin-ID: BIN_001" \
  -H "X-Location: Test_Location" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @image.jpg
```

### Test with Postman
1. Create POST request to `http://localhost:5000/api/waste/upload`
2. Add headers: X-Waste-Distance, X-Bin-ID, X-Location
3. Select binary image in body
4. Send request

## Documentation

- [API Documentation](./API-DOCUMENTATION.md) - Complete API reference
- [Setup Guide](./SETUP-GUIDE.md) - Detailed setup instructions
- [Arduino Code](./ESP32-CAM-Code.ino) - IoT device firmware

## Troubleshooting

**ESP32 upload fails?**
- Check USB cable (data cable required)
- Install CH340 driver
- Select correct COM port

**WiFi connection issues?**
- Verify SSID and password
- Use 2.4GHz WiFi (5GHz not supported)
- Check router firewall

**Server can't receive data?**
- Verify server IP in Arduino code
- Check firewall allows port 5000
- Test connectivity: `ping YOUR_SERVER_IP`

## Future Enhancements

- [ ] Mobile app for monitoring
- [ ] Notification system for full bins
- [ ] Route optimization for collection
- [ ] Machine learning for prediction
- [ ] Weather-based collection scheduling
- [ ] Multiple bin clustering
- [ ] Real-time dashboard visualization

## Security Notes

- Change default JWT_SECRET in production
- Use HTTPS for API in production
- Validate all input data
- Implement rate limiting
- Use environment variables for sensitive data

## License

This is a Final Year Project (FYP) for educational purposes.

## Support

For issues or questions, refer to:
- [SETUP-GUIDE.md](./SETUP-GUIDE.md)
- [API-DOCUMENTATION.md](./API-DOCUMENTATION.md)

---

**Created:** March 13, 2026  
**Version:** 1.0.0  
**Status:** Development

