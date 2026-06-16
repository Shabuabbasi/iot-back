#include "esp_camera.h"
#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>

// ==================== WiFi ====================
const char* ssid = "infinix10";
const char* password = "abbasi1234567";

// ==================== Backend ====================
const char* uploadUrl = "http://10.168.118.219:5000/api/waste/upload";
const char* heartbeatUrl = "http://10.168.118.219:5000/api/waste/heartbeat";
const char* binId = "BIN_001";
const char* locationName = "BSSE_Building_Floor_4";

// ==================== Ultrasonic Sensor ====================
// Use the same pin where your Echo wire is connected.
// If your Echo wire is on GPIO13, change ECHO_PIN from 15 to 13.
#define TRIG_PIN 12
#define ECHO_PIN 15

// Your real closed-bin empty distance is 29 cm.
const float BIN_HEIGHT_CM = 29.0;

// When the foot pedal opens the lid, your sensor reads about 50 cm.
// That is outside the bin, so the code ignores it and keeps the last good reading.
const float LID_OPEN_DISTANCE_CM = 38.0;
const float MAX_SENSOR_DISTANCE_CM = 80.0;

// ==================== Timing ====================
const unsigned long HEARTBEAT_INTERVAL_MS = 2000;
const unsigned long IMAGE_UPLOAD_INTERVAL_MS = 30000;

unsigned long lastHeartbeatMs = 0;
unsigned long lastUploadMs = 0;
float lastGoodDistance = BIN_HEIGHT_CM;
bool cameraReady = false;

// ==================== AI Thinker ESP32-CAM Pins ====================
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

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.print("Connecting to WiFi");
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  unsigned long startMs = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startMs < 20000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("WiFi connected. IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("WiFi connection failed. Will retry.");
  }
}

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

  if (psramFound()) {
    config.frame_size = FRAMESIZE_VGA;
    config.jpeg_quality = 10;
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_QVGA;
    config.jpeg_quality = 12;
    config.fb_count = 1;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed: 0x%x\n", err);
    cameraReady = false;
    return;
  }

  cameraReady = true;
  Serial.println("Camera initialized");
}

float rawDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(5);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  if (duration == 0) return -1.0;

  return (duration * 0.0343) / 2.0;
}

float readDistanceCm(bool* lidOpen) {
  const int samples = 5;
  float total = 0;
  int count = 0;
  int lidOpenCount = 0;

  for (int i = 0; i < samples; i++) {
    float d = rawDistanceCm();
    delay(60);

    if (d < 0 || d > MAX_SENSOR_DISTANCE_CM) {
      continue;
    }

    if (d > LID_OPEN_DISTANCE_CM) {
      lidOpenCount++;
      continue;
    }

    total += d;
    count++;
  }

  *lidOpen = lidOpenCount > 0 && count == 0;

  if (count == 0) {
    return lastGoodDistance;
  }

  float distance = total / count;
  if (distance < 0) distance = 0;
  if (distance > BIN_HEIGHT_CM) distance = BIN_HEIGHT_CM;

  lastGoodDistance = distance;
  return distance;
}

int fillPercentFromDistance(float distance) {
  int fill = round(((BIN_HEIGHT_CM - distance) / BIN_HEIGHT_CM) * 100.0);
  if (fill < 0) fill = 0;
  if (fill > 100) fill = 100;
  return fill;
}

void sendHeartbeat(float distance, bool lidOpen) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(heartbeatUrl);
  http.addHeader("Content-Type", "application/json");

  String payload = "{";
  payload += "\"binId\":\"" + String(binId) + "\",";
  payload += "\"location\":\"" + String(locationName) + "\",";
  payload += "\"distance\":" + String(distance, 1) + ",";
  payload += "\"maxDistance\":" + String(BIN_HEIGHT_CM, 1) + ",";
  payload += "\"lidOpen\":" + String(lidOpen ? "true" : "false");
  payload += "}";

  int code = http.POST(payload);
  Serial.print("Heartbeat HTTP: ");
  Serial.println(code);
  http.end();
}

void uploadPhoto(float distance) {
  if (!cameraReady || WiFi.status() != WL_CONNECTED) return;

  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed");
    return;
  }

  HTTPClient http;
  http.begin(uploadUrl);
  http.addHeader("Content-Type", "image/jpeg");
  http.addHeader("X-Bin-ID", binId);
  http.addHeader("X-Location", locationName);
  http.addHeader("X-Waste-Distance", String(distance, 1));
  http.addHeader("X-Max-Distance", String(BIN_HEIGHT_CM, 1));

  int code = http.POST(fb->buf, fb->len);
  Serial.print("Upload HTTP: ");
  Serial.println(code);

  if (code > 0) {
    Serial.println(http.getString());
  } else {
    Serial.println(http.errorToString(code));
  }

  http.end();
  esp_camera_fb_return(fb);
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  Serial.println();
  Serial.println("ESP32-CAM Smart Bin Starting");
  Serial.println("Bin height: 29 cm");
  Serial.println("Lid-open readings above 38 cm will be ignored");

  initializeCamera();
  connectWiFi();
}

void loop() {
  connectWiFi();

  bool lidOpen = false;
  float distance = readDistanceCm(&lidOpen);
  int fillPercent = fillPercentFromDistance(distance);

  Serial.print("Distance used: ");
  Serial.print(distance, 1);
  Serial.print(" cm | Fill: ");
  Serial.print(fillPercent);
  Serial.print("% | Lid: ");
  Serial.println(lidOpen ? "OPEN" : "CLOSED");

  unsigned long now = millis();

  if (now - lastHeartbeatMs >= HEARTBEAT_INTERVAL_MS) {
    sendHeartbeat(distance, lidOpen);
    lastHeartbeatMs = now;
  }

  if (!lidOpen && now - lastUploadMs >= IMAGE_UPLOAD_INTERVAL_MS) {
    uploadPhoto(distance);
    lastUploadMs = now;
  }

  delay(500);
}
