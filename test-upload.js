import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This script simulates the ESP32 sending an image and distance data to the backend.
async function testESP32Upload() {
  const url = 'http://localhost:5000/api/waste/upload';
  
  console.log("🚀 Starting simulation of ESP32 Upload...");
  console.log(`📡 Target URL: ${url}`);

  // 1. Create a fake "image" buffer (just some random bytes for testing)
  // In a real scenario, this would be the JPEG data.
  // We can also try to read a real image if one exists in the folder, 
  // but a dummy buffer is enough to test if the backend saves it.
  const dummyImageBuffer = Buffer.from('This is a fake image simulating JPEG binary data from ESP32 camera', 'utf8');
  
  try {
    console.log("📤 Sending POST request with raw image buffer and headers...");
    
    // 2. Send the POST request with the exact headers the ESP32 uses
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'image/jpeg',
        'X-Waste-Distance': '8.5',      // Distance from ultrasonic sensor (cm)
        'X-Bin-ID': 'TEST_BIN_001',     // Bin ID
        'X-Location': 'Test Lab',       // Location
        'X-Max-Distance': '30'          // Bin maximum height
      },
      body: dummyImageBuffer // Sending the raw binary data
    });

    // 3. Parse the response from the backend
    const responseData = await response.json();

    if (response.ok) {
      console.log("\n✅ BACKEND RECEIVED DATA SUCCESSFULLY!");
      console.log("-------------------------------------------------");
      console.log("Backend Response:", JSON.stringify(responseData, null, 2));
      console.log("-------------------------------------------------");
      console.log(`\n🔍 Check your backend terminal! You should see logs like "📨 Request received", "📸 Saving image", etc.`);
      console.log(`📁 A dummy image should now be saved in: d:/fyp project/backend/uploads/waste/`);
    } else {
      console.error("\n❌ Backend rejected the request.");
      console.error("Status:", response.status);
      console.error("Error:", responseData);
    }
  } catch (error) {
    console.error("\n❌ Connection Failed!");
    console.error("Is your backend running? Make sure 'npm run dev' is active.");
    console.error(error.message);
  }
}

testESP32Upload();
