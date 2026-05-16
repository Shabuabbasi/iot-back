#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <Arduino.h>

// ==================== WiFi Configuration ====================
const char* ssid = "eduroam";                    // Your WiFi SSID
const char* password = "4388";               // Your WiFi Password

// ==================== Backend API Configuration ====================
const char* serverUrl = "http://10.140.121.162:5000/api/waste/upload";  // Your server IP
const char* binId = "BIN_001";                   // Unique identifier for this bin
const char* location = "BSSE_Building_Floor_4";  // Location of the bin
const char* notificationUrl = "http://10.140.121.162:5000/api/waste/notification";  // Notification endpoint

// ==================== Ultrasonic Sensor Pins (According to Specification) ====================
#define TRIG_PIN 12  // GPIO12 sends trigger pulse
#define ECHO_PIN 13  // GPIO13 receives echo pulse

// ==================== Waste Level Threshold ====================
#define WASTE_THRESHOLD_PERCENT 80  // Send notification when waste level >= 80%
#define MAX_BIN_HEIGHT 30           // Maximum height in cm

// ==================== Camera Pin Configuration ====================
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// ==================== Variables ====================
long duration;
float distance;
float wasteLevel = 0;
bool wasteAlertSent = false;  // Track if alert was already sent for current full state
int sendInterval = 30000;     // Send data every 30 seconds (change as needed)

// ==================== Function to Initialize Camera ====================
void initializeCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;

  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;

  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;

  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;

  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  config.frame_size = FRAMESIZE_VGA;
  config.jpeg_quality = 10;
  config.fb_count = 1;

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    return;
  }

  Serial.println("Camera initialized successfully");
}

// ==================== Function to Read Distance from Ultrasonic Sensor ====================
float readDistance() {
  // Send trigger pulse
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);

  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Measure pulse duration
  duration = pulseIn(ECHO_PIN, HIGH);

  // Calculate distance (cm) = duration (microseconds) * 0.034 / 2
  distance = duration * 0.034 / 2;

  Serial.print("Distance: ");
  Serial.print(distance);
  Serial.println(" cm");

  return distance;
}

// ==================== Function to Capture Image ====================
camera_fb_t* capturePhoto() {
  camera_fb_t* fb = esp_camera_fb_get();

  if (!fb) {
    Serial.println("Camera capture failed");
    return NULL;
  }

  Serial.printf("Photo captured. Size: %d bytes\n", fb->len);
  return fb;
}

// ==================== Function to Send Waste Alert/Notification ====================
void sendWasteNotification(float level) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected - cannot send notification");
    return;
  }

  HTTPClient http;

  Serial.println("\n⚠️ WASTE LEVEL ALERT! Sending notification...");
  http.begin(notificationUrl);

  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Bin-ID", binId);
  http.addHeader("X-Location", location);

  // Create JSON payload for notification
  String jsonPayload = "{\"binId\":\"" + String(binId) + 
                       "\",\"location\":\"" + String(location) + 
                       "\",\"wasteLevel\":" + String(level) + 
                       ",\"message\":\"Waste level is HIGH! Bin needs immediate collection.\"}";

  int responseCode = http.POST(jsonPayload);

  Serial.print("Notification Response Code: ");
  Serial.println(responseCode);

  if (responseCode == HTTP_CODE_OK) {
    Serial.println("✅ Notification sent successfully!");
    wasteAlertSent = true;  // Mark that alert was sent
  } else {
    Serial.println("❌ Failed to send notification");
  }

  http.end();
}

// ==================== Function to Send Waste Data ====================
void sendDataToBackend() {
  // Read distance
  float wasteDistance = readDistance();

  // Calculate waste level percentage
  wasteLevel = (wasteDistance / MAX_BIN_HEIGHT) * 100;
  if (wasteLevel > 100) wasteLevel = 100;  // Cap at 100%
  
  Serial.print("Waste Level: ");
  Serial.print(wasteLevel);
  Serial.println("%");

  // ✅ CHECK IF WASTE LEVEL EXCEEDS THRESHOLD (80%)
  if (wasteLevel >= WASTE_THRESHOLD_PERCENT) {
    if (!wasteAlertSent) {
      Serial.println("\n🚨 WASTE LEVEL CRITICAL - >= 80%!");
      sendWasteNotification(wasteLevel);
    }
  } else {
    // Reset alert flag when waste goes below threshold
    if (wasteAlertSent && wasteLevel < WASTE_THRESHOLD_PERCENT) {
      Serial.println("✅ Waste level back to normal");
      wasteAlertSent = false;
    }
  }

  // Capture image
  camera_fb_t* fb = capturePhoto();

  if (!fb) {
    Serial.println("Failed to capture image");
    return;
  }

  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected");
    esp_camera_fb_return(fb);
    return;
  }

  // Create HTTP request
  HTTPClient http;

  Serial.println("Starting HTTP request...");
  http.begin(serverUrl);

  // Add headers
  http.addHeader("Content-Type", "application/octet-stream");
  http.addHeader("X-Waste-Distance", String(wasteDistance));
  http.addHeader("X-Waste-Level", String(wasteLevel));
  http.addHeader("X-Bin-ID", binId);
  http.addHeader("X-Location", location);

  Serial.println("Sending request with image data...");

  // Send POST request with image data
  int responseCode = http.POST(fb->buf, fb->len);

  Serial.print("HTTP Response Code: ");
  Serial.println(responseCode);

  // Handle response
  if (responseCode == HTTP_CODE_OK) {
    String response = http.getString();
    Serial.println("Response: ");
    Serial.println(response);
  } else {
    Serial.print("Error: ");
    Serial.println(http.errorToString(responseCode));
  }

  http.end();
  esp_camera_fb_return(fb);
}

// ==================== Function to Send Data (Alternative: Using Multipart Form) ====================
void sendDataToBackendMultipart() {
  // Read distance
  float wasteDistance = readDistance();

  // Capture image
  camera_fb_t* fb = capturePhoto();

  if (!fb) {
    Serial.println("Failed to capture image");
    return;
  }

  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected");
    esp_camera_fb_return(fb);
    return;
  }

  // Create HTTP request
  HTTPClient http;

  Serial.println("Starting multipart HTTP request...");
  http.begin(serverUrl);

  // Set headers for multipart form
  String boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
  String contentType = "multipart/form-data; boundary=" + boundary;
  http.addHeader("Content-Type", contentType);

  // Create multipart body
  String body = "--" + boundary + "\r\n";
  body += "Content-Disposition: form-data; name=\"binId\"\r\n\r\n";
  body += binId;
  body += "\r\n--" + boundary + "\r\n";
  body += "Content-Disposition: form-data; name=\"location\"\r\n\r\n";
  body += location;
  body += "\r\n--" + boundary + "\r\n";
  body += "Content-Disposition: form-data; name=\"distance\"\r\n\r\n";
  body += String(wasteDistance);
  body += "\r\n--" + boundary + "\r\n";
  body += "Content-Disposition: form-data; name=\"image\"; filename=\"bin_photo.jpg\"\r\n";
  body += "Content-Type: image/jpeg\r\n\r\n";

  // Note: This method requires buffering which may cause memory issues on ESP32
  // Use sendDataToBackend() method above as preferred

  http.end();
  esp_camera_fb_return(fb);
}

// ==================== Setup Function ====================
void setup() {
  Serial.begin(115200);
  delay(2000);

  Serial.println("\n\n");
  Serial.println("==============================================");
  Serial.println("ESP32-CAM Waste Management System");
  Serial.println("==============================================\n");

  // Initialize pins
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // Initialize camera
  Serial.println("Initializing camera...");
  initializeCamera();

  // Connect to WiFi
  Serial.println("\nConnecting to WiFi...");
  Serial.print("SSID: ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("RSSI: ");
    Serial.println(WiFi.RSSI());
  } else {
    Serial.println("\nFailed to connect to WiFi");
  }

  Serial.println("\n==============================================");
  Serial.println("System Ready - Starting data collection");
  Serial.println("==============================================\n");
}

// ==================== Main Loop ====================
void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n--- Sending Waste Data ---");
    sendDataToBackend();
  } else {
    Serial.println("WiFi disconnected. Attempting to reconnect...");
    WiFi.reconnect();
  }

  Serial.print("Next transmission in ");
  Serial.print(sendInterval / 1000);
  Serial.println(" seconds...\n");

  delay(sendInterval);
}
