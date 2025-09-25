// Documentation found here: https://petbed.github.io/Misc/Flood%20System%20Docs/

#define BLYNK_TEMPLATE_ID "TMPL6v2EAnw9W" 
#define BLYNK_TEMPLATE_NAME "Flood System"
#define BLYNK_AUTH_TOKEN "Qc4jKa9k3JvtuGGm3_9ZNa0B3LBOT4eI" // (NOTE: MAKE SECRET)

// --- Core Libraries ---
#include <WiFi.h>
#include <WebServer.h>
#include <BlynkSimpleEsp32.h>
#include <ArduinoJson.h>

// --- Libraries for Clock & Display ---
#include <WiFiUdp.h>
#include <NTPClient.h>
#include <MD_Parola.h>
#include <MD_MAX72XX.h>
#include <SPI.h>

// --- GPS Libraries ---
#include <TinyGPS++.h>
#include <HardwareSerial.h>

// --- WiFi (NOTE: MAKE SECRET) ---
const char* ssid = "iPhone";
const char* password = "leeman@9999";

// --- Alarm Configuration ---
const int BUZZER_PIN = 13;
const int MIN_FLOOD_THRESHOLD = 60; // Minimum level to trigger alarm
const int MAX_FLOOD_THRESHOLD = 70; // Level at which the bar is full
const unsigned long ALARM_ACTIVATION_DELAY = 10 * 1000; // 10 minutes
const unsigned long ALARM_SHUTOFF_DELAY = 15 * 1000; // 30 seconds to continue alarm
const unsigned long BLYNK_TIMER_RESET_DELAY = 15 * 1000; // 30 seconds to show final time

// --- LED Matrix Configuration ---
#define HARDWARE_TYPE MD_MAX72XX::FC16_HW
#define MAX_DEVICES 4
#define CLK_PIN 18
#define DATA_PIN 23
#define CS_PIN 5
MD_Parola myDisplay = MD_Parola(HARDWARE_TYPE, CS_PIN, MAX_DEVICES);

// --- Local RGB LED Configuration ---
const int RGB_RED_PIN = 25;
const int RGB_GREEN_PIN = 26;
const int RGB_BLUE_PIN = 27;

// --- NTP Time Setup ---
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 8 * 3600, 60000);

// --- GPS Setup ---
TinyGPSPlus gps;
HardwareSerial gpsSerial(2);
const int GPS_RX_PIN = 16;
const int GPS_TX_PIN = 17;

// --- Global State Variables ---
WebServer server(80);
BlynkTimer timer;
float lastWaterLevel = -1;
int lastRainStatus = -1;
bool isAlarmActive = false;
bool isAlarmSilenced = false;
float lastLatitude = 0;
float lastLongitude = 0;
bool manualLedOverride = false;
int manualLedState = 0;
bool emergencyLedActive = false;
bool heavyRainMode = false;

// --- Timer State Variables ---
unsigned long rainStartTime = 0;
unsigned long floodStopTime = 0;
unsigned long rainStopTime = 0;
unsigned long floodConditionStartTime = 0;
bool isRaining = false;

// --- Display Logic Variables ---
unsigned long lastBlinkMs = 0;
bool showColon = true;
char matrixTimeString[8];
unsigned long lastDisplaySwitchMs = 0;
bool showTimeInAlarm = true;

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n--- Flood Alert System Booting Up ---");
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  // Init LED Matrix
  SPI.begin(CLK_PIN, -1, DATA_PIN, CS_PIN);
  SPI.setFrequency(8000000);
  myDisplay.begin();
  myDisplay.displayShutdown(false);
  myDisplay.setIntensity(1);
  myDisplay.displayClear();
  Serial.println("LED Matrix Initialized.");

  pinMode(RGB_RED_PIN, OUTPUT);
  pinMode(RGB_GREEN_PIN, OUTPUT);
  pinMode(RGB_BLUE_PIN, OUTPUT);
  Serial.println("Local RGB LED Initialized.");


  // Init GPS
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN); // Pray to the satelites that this works; if not, have fun waiting for an hour! 
  Serial.println("GPS Serial Initialized.");

  // Connect WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected! IP: " + WiFi.localIP().toString());

  // Init Time
  timeClient.begin();
  timeClient.forceUpdate();
  snprintf(matrixTimeString, sizeof(matrixTimeString), "%02d:%02d", timeClient.getHours(), timeClient.getMinutes());
  myDisplay.displayText(matrixTimeString, PA_CENTER, 0, 0, PA_PRINT, PA_NO_EFFECT);

  // Connect to Blynk
  Blynk.begin(BLYNK_AUTH_TOKEN, ssid, password);

  // Web Server Routes
  server.on("/", HTTP_GET, handleRoot);
  server.on("/post-data", HTTP_POST, handlePost);
  server.begin();
  Serial.println("HTTP server started.");
  Serial.println("--- Setup Complete ---");

  // Timers
  timer.setInterval(10000L, sendToBlynk);
  timer.setInterval(1000L, updateTimers);
}

// Blynk function to handle the standard LED button press
BLYNK_WRITE(V5) {
  manualLedState = param.asInt();
  manualLedOverride = true;
  Serial.println("Blynk button V5 pressed. Manual override is now ON. State: " + String(manualLedState));
}

// Blynk function to handle the EMERGENCY LED button press
BLYNK_WRITE(V6) {
  emergencyLedActive = param.asInt() == 1;
  Serial.println("Blynk EMERGENCY button V6 pressed. Emergency State: " + String(emergencyLedActive));
}

BLYNK_WRITE(V7) {
  int value = param.asInt();
  if (value == 0) { // User is silencing the alarm
    if (isAlarmActive) {
      isAlarmSilenced = true;
      Serial.println("Blynk switch V7 turned OFF. Alarm silenced.");
    }
  } else { // User is trying to turn the alarm ON manually
    // This is not allowed, so force the switch back off immediately.
    Blynk.virtualWrite(V7, 0);
    Serial.println("Manual alarm activation from V7 denied. Forcing OFF.");
  }
}

void loop() {
  Blynk.run();
  timer.run();
  server.handleClient();
  timeClient.update();
  handleGPS();
  manageAlarmState(); // Manage alarm activation and deactivation

  // Buzzer only sounds if the alarm is active AND not silenced
  if (isAlarmActive && !isAlarmSilenced) {
    digitalWrite(BUZZER_PIN, (millis() % 1000 < 500) ? HIGH : LOW);
  } else {
    digitalWrite(BUZZER_PIN, LOW);
  }

  if (millis() - lastBlinkMs >= 1000) {
    lastBlinkMs = millis();
    showColon = !showColon;
  }

  updateMatrixDisplay();
  updateRgbLed(); // Update the local RGB LED status
  delay(20);
}

void manageAlarmState() {
  // If we are in a potential flood state (timer is running), the water level is currently high (no stop time), and the alarm isn't active yet...
  if (floodConditionStartTime > 0 && floodStopTime == 0 && !isAlarmActive) {
    // ...and the activation delay has passed...
    if (millis() - floodConditionStartTime >= ALARM_ACTIVATION_DELAY) {
      // ...then ACTIVATE the alarm.
      // Boom boom logic. 
      isAlarmActive = true;
      isAlarmSilenced = false;
      manualLedOverride = false;
      Serial.println("FLOOD CONDITION CONFIRMED! ALARM ACTIVATED.");
      Blynk.logEvent("flood_alert", "Flood alert! Water level high for 10 minutes.");
      Blynk.virtualWrite(V7, 1);
      Blynk.virtualWrite(V5, 1);
    }
  }

  // If the alarm is currently active, but the water level has dropped (indicated by floodStopTime)...
  if (isAlarmActive && floodStopTime > 0) {
    // ...and the shutoff delay has passed...
    if (millis() - floodStopTime >= ALARM_SHUTOFF_DELAY) {
      // ...then DEACTIVATE the alarm.
      isAlarmActive = false;
      isAlarmSilenced = false;
      Serial.println("Alarm deactivated after 30-second delay.");
      Blynk.virtualWrite(V7, 0);
      Blynk.virtualWrite(V5, 0);
    }
  }
}

void updateRgbLed() {
  if (isAlarmActive) {
    float progress = (lastWaterLevel - MIN_FLOOD_THRESHOLD) / float(MAX_FLOOD_THRESHOLD - MIN_FLOOD_THRESHOLD);
    progress = constrain(progress, 0.0, 1.0);

    int r = 0, g = 0, b = 0;

    if (progress >= 1.0) { // Full Red
      r = 255; g = 0; b = 0;
    } else if (progress >= 0.75) { // Orange-Red
      r = 255; g = 69; b = 0;
    } else if (progress >= 0.50) { // Orange
      r = 255; g = 165; b = 0;
    } else if (progress >= 0.25) { // Yellow-Orange
      r = 255; g = 200; b = 0;
    } else { // Yellow
      r = 255; g = 255; b = 0;
    }

    analogWrite(RGB_RED_PIN, r);
    analogWrite(RGB_GREEN_PIN, g);
    analogWrite(RGB_BLUE_PIN, b);

  } else {
    // If no alarm, turn the LED off
    analogWrite(RGB_RED_PIN, 0);
    analogWrite(RGB_GREEN_PIN, 0);
    analogWrite(RGB_BLUE_PIN, 0);
  }
}

void updateBlynkRainStatus() {
  if (lastRainStatus == -1) return; // Don't send if no data yet

  if (lastRainStatus == 0) {
    Blynk.virtualWrite(V2, "No rain");
  } else { // It is raining
      Blynk.virtualWrite(V2, "Rain");
    }
  }
}


void handlePost() {
  if (server.hasArg("plain")) {
    String body = server.arg("plain");
    StaticJsonDocument<128> jsonDoc;
    DeserializationError error = deserializeJson(jsonDoc, body);

    if (error) {
      server.send(400, "text/plain", "Invalid JSON");
      return;
    }

    if (jsonDoc.containsKey("water") && jsonDoc.containsKey("rain")) {
      lastWaterLevel = jsonDoc["water"];
      lastRainStatus = jsonDoc["rain"];

      if (lastWaterLevel > MIN_FLOOD_THRESHOLD) {
        // Water is high. If the master timer hasn't started, start it.
        if (floodConditionStartTime == 0) {
          floodConditionStartTime = millis();
          Serial.println("Potential flood detected. Starting observation and Blynk timer.");
        }
        // If we were in a shutdown state (indicated by floodStopTime), cancel it.
        if (floodStopTime > 0) {
          Serial.println("Water level high again. Cancelling shutdown.");
          floodStopTime = 0;
        }
      } else { // Water is normal.
        // If a flood condition was in progress...
        if (floodConditionStartTime > 0) {
          // ...and if we haven't already marked the stop time...
          if (floodStopTime == 0) {
            floodStopTime = millis(); // Mark the stop time ONCE. ONCE. (NOTE: ESP SOT SOT, sometimes multiple times, has no effect atall, but keep note)
            Serial.println("Water level normal. Starting shutdown timers.");
          }
        }
      }


      bool currentlyRaining = (lastRainStatus == 1);
      if (currentlyRaining && !isRaining) { // Rain just started
        rainStartTime = millis();
        isRaining = true;
        rainStopTime = 0;
        Serial.println("Rain detected. Starting timer.");
      } else if (!currentlyRaining && isRaining) { // Rain just stopped
        rainStopTime = millis();
        isRaining = false;
        Serial.println("Rain stopped. Marking end time.");
      }

      String ledCommand = "OFF";
      if (emergencyLedActive) {
        ledCommand = "EMERGENCY";
      } else if (manualLedOverride) {
        ledCommand = (manualLedState == 1) ? "ON" : "OFF"; // LIVE LAUGH LOVE TERNARY OPERATORS
      } else {
        ledCommand = isAlarmActive ? "ON" : "OFF";
      }

      Blynk.virtualWrite(V1, lastWaterLevel);
      updateBlynkRainStatus();

      StaticJsonDocument<64> responseDoc;
      responseDoc["led_state"] = ledCommand;
      String responseJson;
      serializeJson(responseDoc, responseJson);

      server.send(200, "application/json", responseJson);

    } else {
      server.send(400, "text/plain", "Missing JSON keys");
    }
  } else {
    server.send(400, "text/plain", "No body received"); // Uh oh
  }
}

String formatDuration(unsigned long duration_ms) {
  unsigned long seconds = duration_ms / 1000;
  unsigned long minutes = seconds / 60;
  unsigned long hours = minutes / 60;
  char buf[12];
  snprintf(buf, sizeof(buf), "%02lu:%02lu:%02lu", hours, minutes % 60, seconds % 60);
  return String(buf);
}

void updateTimers() {
  // Flood Timer
  if (floodConditionStartTime > 0) { // A potential flood is happening OR was happening recently
    unsigned long duration;
    // If the water level dropped, freeze the timer display at the value when it dropped
    if (floodStopTime > 0) {
      duration = floodStopTime - floodConditionStartTime;
    } else {
      duration = millis() - floodConditionStartTime;
    }
    Blynk.virtualWrite(V8, formatDuration(duration));

    // Check if the reset delay has passed since the water level dropped
    if (floodStopTime > 0 && (millis() - floodStopTime >= BLYNK_TIMER_RESET_DELAY)) {
      Blynk.virtualWrite(V8, "00:00:00");
      floodStopTime = 0; // Stop this block from running again
      floodConditionStartTime = 0; // Reset the master timer now that the event is truly over
      Serial.println("Blynk flood timer reset after delay.");
    }
  }

  // Rain Timer
  if (isRaining) {
    unsigned long duration = millis() - rainStartTime;
    Blynk.virtualWrite(V9, formatDuration(duration));
  } else if (rainStopTime > 0 && (millis() - rainStopTime > 30000)) {
    // Reset after 30 seconds
    Blynk.virtualWrite(V9, "00:00:00");
    rainStartTime = 0;
    rainStopTime = 0;
  }
}


void updateMatrixDisplay() {
  if (isAlarmActive) {
    // Switch every 5 seconds between time and progress bar
    if (millis() - lastDisplaySwitchMs >= 5000) {
      lastDisplaySwitchMs = millis();
      showTimeInAlarm = !showTimeInAlarm;
      myDisplay.displayReset();
    }

    if (showTimeInAlarm) {
      // Display the current time
      int h = timeClient.getHours();
      int m = timeClient.getMinutes();
      snprintf(matrixTimeString, sizeof(matrixTimeString), showColon ? "%02d:%02d" : "%02d %02d", h, m);
      if (myDisplay.displayAnimate()) {
        myDisplay.displayText(matrixTimeString, PA_CENTER, 0, 0, PA_PRINT, PA_NO_EFFECT);
      }
    } else {
      // Display water level as progress bar
      int barLength = 0;
      if (lastWaterLevel >= MIN_FLOOD_THRESHOLD) {
        float progress = (lastWaterLevel - MIN_FLOOD_THRESHOLD) / float(MAX_FLOOD_THRESHOLD - MIN_FLOOD_THRESHOLD);
        progress = constrain(progress, 0.0, 1.0);
        barLength = int(progress * (MAX_DEVICES * 8)); // Each device has 8 columns
      }

      // Access the raw MD_MAX72XX object
      MD_MAX72XX *mx = myDisplay.getGraphicObject();

      mx->control(MD_MAX72XX::UPDATE, MD_MAX72XX::OFF); // Pause auto updates
      mx->clear();

      for (int col = 0; col < barLength; col++) {
        for (int row = 0; row < 8; row++) {
          mx->setPoint(row, col, true); // Fill column
        }
      }

      mx->control(MD_MAX72XX::UPDATE, MD_MAX72XX::ON); // Refresh
    }

  } else {
    // X alarm mode then just show time
    if (!showTimeInAlarm) {
      showTimeInAlarm = true;
      myDisplay.displayReset();
    }
    int h = timeClient.getHours();
    int m = timeClient.getMinutes();
    snprintf(matrixTimeString, sizeof(matrixTimeString), showColon ? "%02d:%02d" : "%02d %02d", h, m);
    if (myDisplay.displayAnimate()) {
      myDisplay.displayText(matrixTimeString, PA_CENTER, 0, 0, PA_PRINT, PA_NO_EFFECT);
    }
  }
}

void handleGPS() {
  while (gpsSerial.available() > 0) gps.encode(gpsSerial.read());
  if (gps.location.isUpdated()) {
    lastLatitude = gps.location.lat();
    lastLongitude = gps.location.lng();
  }
}

// NOTE: MAKE AN ACTUAL WEBSITE HOSTED ON GITHUB PAGES IN THE FUTURE TO PREVENT ESP LOAD. API IS KEY
// J: Use https://petbed.github.io/ and my vercel backend, it already has some setup there
void handleRoot() {
  String html = "<!DOCTYPE html><html><head><title>Flood Alert Dashboard</title><meta http-equiv='refresh' content='10'></head><body style='font-family: Arial; text-align: center; background-color: #f4f4f4;'><div style='background-color: white; margin: 50px auto; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); max-width: 500px;'><h1>Flood Alert Dashboard</h1>";
  if (isAlarmActive) { html += "<h2 style='color: red;'>FLOOD ALERT ACTIVE!</h2>"; }
  if (lastWaterLevel >= 0) {
    html += "<p style='font-size: 1.2em;'><b>Latest Water Level:</b> " + String(lastWaterLevel) + "</p>";
  } else {
    html += "<p><i>Waiting for water level data...</i></p>";
  }
  if (lastRainStatus >= 0) {
    String rainText = (lastRainStatus == 1) ? "<span style='color: blue;'>YES</span>" : "<span style='color: green;'>NO</span>";
    html += "<p style='font-size: 1.2em;'><b>Rain Detected:</b> " + rainText + "</p>";
  } else {
    html += "<p><i>Waiting for rain sensor data...</i></p>";
  }
  html += "<hr><div style='margin-top: 20px;'><h3>GPS Location</h3>";
  if (lastLatitude != 0.0 && lastLongitude != 0.0) {
    html += "<p><b>Latitude:</b> " + String(lastLatitude, 6) + "</p>";
    html += "<p><b>Longitude:</b> " + String(lastLongitude, 6) + "</p>";
  } else {
    html += "<p><i>Waiting for GPS fix...</i></p>";
  }
  html += "</div></div></body></html>";
  server.send(200, "text/html", html);
}

void sendToBlynk() {
  if (lastWaterLevel >= 0) {
    Blynk.virtualWrite(V1, lastWaterLevel);
    updateBlynkRainStatus();
  }
  if (lastLatitude != 0.0 && lastLongitude != 0.0) {
    Blynk.virtualWrite(V3, lastLatitude);
    Blynk.virtualWrite(V4, lastLongitude);
  }
}

