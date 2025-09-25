// Documentation found here: https://petbed.github.io/Misc/Flood%20System%20Docs/

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>

// WiFi credentials (NOTE: MAKE SECRET)
const char* ssid = "iPhone";
const char* password = "leeman@9999";

// ESP32 server IP (NOTE: KEEPS CHANGING; ESP SOT SOT; KEEP TRACK!!!)
const char* serverName = "http://192.168.167.151/post-data";

// Sensor pins
const int waterLevelPin = A0;
const int rainSensorPin = D1;  // D1 is GPIO5

// --- RGB LED Pin Configuration ---
const int RED_PIN = D5;    // GPIO14
const int GREEN_PIN = D6;  // GPIO12
const int BLUE_PIN = D7;   // GPIO13

// --- Global variables for LED state management ---
// Possible states: "OFF", "ON", "FLASH", "EMERGENCY"
String currentLedState = "OFF";
unsigned long lastFlashTime = 0;
bool flashState = false;

void setup() {
  Serial.begin(57600);
  pinMode(waterLevelPin, INPUT);
  pinMode(rainSensorPin, INPUT);

  // --- Initialize LED pins ---
  pinMode(RED_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(BLUE_PIN, OUTPUT);
  setLedColor(0, 0, 0);  // Start with LED off

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected! IP: " + WiFi.localIP().toString());
}

// Helper function to set LED color
void setLedColor(int r, int g, int b) {
  analogWrite(RED_PIN, r);
  analogWrite(GREEN_PIN, g);
  analogWrite(BLUE_PIN, b);
}

// handle LED state in loop
void handleLed() {
  // --- NEW: Handle the EMERGENCY state ---
  if (currentLedState == "EMERGENCY") {
    setLedColor(255, 0, 255); // Solid Hot Pink
  } else if (currentLedState == "ON") {
    setLedColor(255, 255, 255);  // Solid white
  } else if (currentLedState == "FLASH") {
    // Non-blocking flash logic
    if (millis() - lastFlashTime > 500) {  // Flash every 500ms
      lastFlashTime = millis();
      flashState = !flashState;
      if (flashState) {
        setLedColor(255, 255, 255);  // White
      } else {
        setLedColor(0, 0, 0);  // Off
      }
    }
  } else {                 
    setLedColor(0, 0, 0);
  }
}

void loop() {
  // Handle LED state continuously and non-blockingly
  handleLed();

  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;

    // Read sensor values
    int waterLevelValue = analogRead(waterLevelPin);
    int rainDetected = (digitalRead(rainSensorPin) == LOW) ? 1 : 0;
    Serial.printf("Water Level: %d, Rain Detected: %d\n", waterLevelValue, rainDetected);

    // Create JSON read
    StaticJsonDocument<128> jsonDoc;
    jsonDoc["water"] = waterLevelValue;
    jsonDoc["rain"] = rainDetected;
    String jsonString;
    serializeJson(jsonDoc, jsonString);

    // Send POST request with JSON
    http.begin(client, serverName);
    http.addHeader("Content-Type", "application/json");
    int httpResponseCode = http.POST(jsonString);

    if (httpResponseCode == 200) {
      Serial.println("POST success, code: " + String(httpResponseCode));
      String response = http.getString();
      Serial.println("Response from server: " + response);

      // Parse the response from the server
      StaticJsonDocument<64> responseDoc;
      DeserializationError error = deserializeJson(responseDoc, response);

      if (!error && responseDoc.containsKey("led_state")) {
        currentLedState = responseDoc["led_state"].as<String>();
        Serial.println("New LED state received: " + currentLedState);
      } else {
        Serial.println("Failed to parse response or key missing.");
      }


    } else {
      Serial.println("POST failed, error: " + String(httpResponseCode));
    }
    http.end();

  } else {
    Serial.println("WiFi disconnected, retrying...");
    WiFi.begin(ssid, password);
  }
  delay(1000);  // Send data every 1s
}
