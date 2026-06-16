# Ultrasonic Data Test Route - Implementation Complete

## Overview
A new test route has been added to handle ultrasonic data from Arduino. The endpoint accepts simple JSON payload with `binId` and `level` (0-100).

## Endpoint Details
- **URL**: `POST http://10.28.156.219:5000/api/waste`
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "binId": "Bin_01",
    "level": 75
  }
  ```
- **Response**:
  ```json
  {
    "message": "Ultrasonic data received successfully",
    "data": {
      "binId": "Bin_01",
      "level": 75,
      "distance": 7.5,
      "status": "full",
      "location": "Test_Location",
      "timestamp": "2026-03-28T22:48:43.388Z"
    }
  }
  ```

## Implementation Changes Made

### 1. New Controller Function (`uploadUltrasonicData`)
Added to `backend/src/controllers/wasteController.js`:
- Validates `binId` and `level` parameters
- Calculates distance from level (assuming max 30cm)
- Determines status (empty/half/full) based on level
- Updates or creates waste record in database
- Returns success response with calculated data

### 2. Updated Routes (`backend/src/routes/waste.routes.js`)
Added new route:
```javascript
router.post("/", uploadUltrasonicData);
```
This handles POST requests to `/api/waste` with JSON payload.

## Testing Results

The endpoint has been tested with the following cases:

### ✅ Success Cases:
1. **Level 75 (Full)**: 
   ```bash
   curl -X POST http://localhost:5000/api/waste -H "Content-Type: application/json" -d "{\"binId\": \"Bin_01\", \"level\": 75}"
   ```
   Response: Status 200, correct distance (7.5cm), status "full"

2. **Level 25 (Empty)**:
   ```bash
   curl -X POST http://localhost:5000/api/waste -H "Content-Type: application/json" -d "{\"binId\": \"Bin_02\", \"level\": 25}"
   ```
   Response: Status 200, correct distance (22.5cm), status "empty"

### ❌ Error Cases:
1. **Missing level**:
   ```bash
   curl -X POST http://localhost:5000/api/waste -H "Content-Type: application/json" -d "{\"binId\": \"Bin_03\"}"
   ```
   Response: Status 400, "binId and level are required in JSON payload"

2. **Invalid level (out of range)**:
   Would return: "level must be a number between 0 and 100"

## Arduino Code Compatibility

Your Arduino code should work without modification:

```cpp
const char* serverName = "http://10.28.156.219:5000/api/waste";

void sendDataToBackend(float level) {
  if(WiFi.status()== WL_CONNECTED){
    HTTPClient http;
    http.begin(serverName);
    http.addHeader("Content-Type", "application/json");

    // Create JSON payload
    String jsonPayload = "{\"binId\": \"Bin_01\", \"level\": " + String(level) + "}";
    
    int httpResponseCode = http.POST(jsonPayload);
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    http.end();
  }
}
```

## Database Updates
The data is stored in the MongoDB `wastes` collection with the following fields:
- `binId`: Unique bin identifier
- `location`: Default "Test_Location" (can be enhanced)
- `wasteLevel`: The level percentage (0-100)
- `distance`: Calculated distance in cm
- `status`: "empty", "half", or "full"
- `ipAddress`: Client IP address
- `updatedAt`: Timestamp

## Next Steps
1. Upload the updated Arduino code to your ESP32
2. Ensure WiFi credentials are correct
3. The ESP32 should now be able to send ultrasonic data to the backend
4. Monitor the serial output for HTTP response codes
5. Check the database for received data

## Troubleshooting
- **Connection refused**: Ensure backend is running on `10.28.156.219:5000`
- **404 Not Found**: Verify the endpoint is `/api/waste` (not `/api/waste/`)
- **400 Bad Request**: Check JSON format and required fields
- **500 Internal Server**: Check MongoDB connection in backend logs

The implementation is complete and ready for hardware testing.