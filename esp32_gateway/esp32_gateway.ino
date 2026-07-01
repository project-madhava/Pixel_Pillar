#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiManager.h> // The Captive Portal Magic!

// YOUR FINAL CLOUD SERVER URL
String serverUrl = "https://nishil-patel-pixelpillar.hf.space"; 

String versionUrl = serverUrl + "/version";
String screenUrl = serverUrl + "/get_screen";

#define CLOCK_PIN 10
#define DATA_PIN  7
#define CS_PIN    5 
String currentScreenVersion = "NONE";

void setup() {
  Serial.begin(115200);
  pinMode(CLOCK_PIN, OUTPUT); pinMode(DATA_PIN, OUTPUT); pinMode(CS_PIN, OUTPUT);
  digitalWrite(CLOCK_PIN, LOW); digitalWrite(DATA_PIN, LOW); digitalWrite(CS_PIN, HIGH); 
  
  Serial.println("\n--- Booting ESP32 PixelPillar Gateway ---");
  Serial.println("📡 Starting WiFiManager Captive Portal...");
  
  WiFiManager wm;
  // If no saved Wi-Fi is found, it broadcasts "PixelPillar_Setup"
  bool res = wm.autoConnect("PixelPillar_Setup"); 

  if(!res) {
    Serial.println("❌ Failed to connect to WiFi. Restarting...");
    ESP.restart();
  } else {
    Serial.println("✅ ESP32 Successfully Connected to User's WiFi!");
    Serial.println("🌐 Cloud Endpoint: " + serverUrl);
  }
}

void sendByteOverWires(uint8_t b) {
  for (int i = 0; i < 8; i++) {
    digitalWrite(DATA_PIN, (b >> i) & 1);
    digitalWrite(CLOCK_PIN, HIGH);
    delayMicroseconds(5); // Ultra-fast 5us clock for massive payloads
    digitalWrite(CLOCK_PIN, LOW);
    delayMicroseconds(5);
  }
}

void fetchAndStreamImage() {
  HTTPClient http;
  http.setTimeout(15000); 
  
  Serial.println("📥 Fetching 102.4KB True-Color Payload from Cloud...");
  http.begin(screenUrl);
  
  if (http.GET() == HTTP_CODE_OK) {
    WiFiClient* stream = http.getStreamPtr();
    int len = http.getSize(); 

    Serial.println("🔗 Initiating connection to Aries (Pulling CS LOW)...");
    digitalWrite(CS_PIN, LOW); delay(300); 
    Serial.println("✅ Aries connection established. Starting high-speed data transmission...");

    while (http.connected() && (len > 0 || len == -1)) {
      size_t size = stream->available();
      if (size) {
        uint8_t buffer[256]; 
        int c = stream->readBytes(buffer, ((size > sizeof(buffer)) ? sizeof(buffer) : size));
        for(int i = 0; i < c; i++) sendByteOverWires(buffer[i]); 
        yield(); // Feed watchdog to prevent crashes
        if (len > 0) len -= c;
      }
    }
    digitalWrite(DATA_PIN, LOW); digitalWrite(CS_PIN, HIGH);
    Serial.println("🚀 Data transmission complete. Aries connection closed (CS HIGH).");
  } else {
    Serial.println("❌ Error: Could not fetch payload from Cloud Server.");
  }
  http.end();
}

void loop() {
  if(WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.setTimeout(5000); 
    http.begin(versionUrl);
    if (http.GET() == HTTP_CODE_OK) {
      String cloudVersion = http.getString(); cloudVersion.trim();
      if(cloudVersion != currentScreenVersion) {
        Serial.println("\n🌐 New upload detected from Cloud! Version: " + cloudVersion);
        fetchAndStreamImage();
        currentScreenVersion = cloudVersion; 
      }
    }
    http.end();
  }
  delay(3000); // 3 Second Heartbeat Ping and Polling loop
}
