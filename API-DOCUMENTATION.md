# Smart Waste Management System - API Documentation

## Overview
This document describes the APIs for the IoT Smart Waste Management System backend.

---

## Base URL
```
http://YOUR_SERVER_IP:5000/api
```

---

## 1. Waste Management Endpoints

### A. Upload Waste Data with Image
**Endpoint:** `POST /waste/upload`

**Description:** Upload waste level data and image from ESP32-CAM

**Headers:**
```
Content-Type: application/octet-stream
X-Waste-Distance: <distance_in_cm>
X-Bin-ID: <bin_id>
X-Location: <location>
```

**Request Body:**
- Raw binary image data (JPEG)

**Example cURL:**
```bash
curl -X POST http://192.168.1.100:5000/api/waste/upload \
  -H "Content-Type: application/octet-stream" \
  -H "X-Waste-Distance: 25.5" \
  -H "X-Bin-ID: BIN_001" \
  -H "X-Location: Street_A_Corner_2" \
  --data-binary @image.jpg
```

**Success Response (200):**
```json
{
  "message": "Waste data uploaded successfully",
  "data": {
    "binId": "BIN_001",
    "location": "Street_A_Corner_2",
    "distance": 25.5,
    "wasteLevel": 85,
    "status": "full",
    "imageUrl": "/uploads/waste/BIN_001-1234567890.jpg",
    "lastUpdated": "2026-03-13T10:30:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "message": "binId, location, and distance are required"
}
```

---

### B. Get All Waste Data
**Endpoint:** `GET /waste/all`

**Description:** Retrieve all waste records

**Example cURL:**
```bash
curl http://192.168.1.100:5000/api/waste/all
```

**Response:**
```json
{
  "message": "Waste data retrieved successfully",
  "count": 5,
  "data": [
    {
      "_id": "640f1a2b3c4d5e6f7g8h9i0j",
      "binId": "BIN_001",
      "location": "Street_A_Corner_2",
      "wasteLevel": 85,
      "distance": 25.5,
      "status": "full",
      "imageUrl": "/uploads/waste/BIN_001-1234567890.jpg",
      "createdAt": "2026-03-13T09:00:00.000Z",
      "updatedAt": "2026-03-13T10:30:00.000Z"
    }
  ]
}
```

---

### C. Get Waste by Bin ID
**Endpoint:** `GET /waste/bin/:binId`

**Description:** Get specific waste record by bin ID

**Parameters:**
- `binId` (string): Unique identifier of the bin

**Example cURL:**
```bash
curl http://192.168.1.100:5000/api/waste/bin/BIN_001
```

**Response:**
```json
{
  "message": "Waste data retrieved successfully",
  "data": {
    "_id": "640f1a2b3c4d5e6f7g8h9i0j",
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
}
```

---

### D. Get Waste Statistics
**Endpoint:** `GET /waste/stats`

**Description:** Get overall waste management statistics

**Example cURL:**
```bash
curl http://10.236.0.219:5000/api/waste/stats
```

**Response:**
```json
{
  "message": "Waste statistics retrieved successfully",
  "totalBins": 5,
  "stats": [
    {
      "_id": "full",
      "count": 2,
      "avgLevel": 87.5
    },
    {
      "_id": "half",
      "count": 2,
      "avgLevel": 48.5
    },
    {
      "_id": "empty",
      "count": 1,
      "avgLevel": 15
    }
  ]
}
```

---

### E. Get Full Bins (Need Collection)
**Endpoint:** `GET /waste/full-bins`

**Description:** Get list of all bins that are full and need collection

**Example cURL:**
```bash
curl http://10.236.0.219:5000/api/waste/full-bins
```

**Response:**
```json
{
  "message": "Full bins retrieved successfully",
  "count": 2,
  "data": [
    {
      "_id": "640f1a2b3c4d5e6f7g8h9i0j",
      "binId": "BIN_001",
      "location": "Street_A_Corner_2",
      "wasteLevel": 85,
      "distance": 25.5,
      "status": "full",
      "imageUrl": "/uploads/waste/BIN_001-1234567890.jpg",
      "updatedAt": "2026-03-13T10:30:00.000Z"
    }
  ]
}
```

---

## 2. Authentication Endpoints

### A. Register
**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "collector"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "640f1a2b3c4d5e6f7g8h9i0j",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "collector"
  }
}
```

---

### B. Login
**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "640f1a2b3c4d5e6f7g8h9i0j",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "collector"
  }
}
```

---

### C. Logout
**Endpoint:** `POST /auth/logout`

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

---

## 3. Health Check

**Endpoint:** `GET /health`

**Description:** Check if the server is running

**Response:**
```json
{
  "message": "Server is healthy"
}
```

---

## Installation & Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Variables (.env)
```
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/waste-management
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
```

### 3. Run Server
```bash
npm run dev
```

---

## Image Upload Directory
Images are saved in: `/backend/uploads/waste/`

Access images via: `http://YOUR_SERVER_IP:5000/uploads/waste/filename.jpg`

---

## Error Codes
- **400** - Bad Request (Missing required fields)
- **404** - Not Found
- **500** - Server Error

---

## Notes
- Maximum image size: 5MB
- Only JPEG images are accepted
- Waste Level is calculated as: (distance / maxDistance) × 100
- Status categories:
  - **empty**: 0-33%
  - **half**: 33-66%
  - **full**: 66-100%

