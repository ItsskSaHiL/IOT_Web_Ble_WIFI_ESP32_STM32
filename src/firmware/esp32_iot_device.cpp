/*
 * ESP32 IoT Device Firmware
 * 
 * This firmware connects to WiFi, publishes telemetry data via MQTT,
 * and provides BLE GATT service for local connections.
 * 
 * Hardware Requirements:
 * - ESP32 DevKit
 * - DHT22 sensor (temperature/humidity)
 * - HX711 load cell amplifier + load cell (weight)
 * - LED for status indication
 * 
 * Pin Configuration:
 * - DHT22: GPIO 4
 * - HX711 DOUT: GPIO 16
 * - HX711 SCK: GPIO 17
 * - Status LED: GPIO 2
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <HX711.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/queue.h"

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT Configuration
const char* mqtt_server = "YOUR_MQTT_BROKER_IP";
const int mqtt_port = 1883;
const char* device_id = "esp32_001";

// Pin Definitions
#define DHT_PIN 4
#define DHT_TYPE DHT22
#define HX711_DOUT_PIN 16
#define HX711_SCK_PIN 17
#define LED_PIN 2

// BLE UUIDs
#define SERVICE_UUID        "12345678-1234-1234-1234-123456789abc"
#define CHARACTERISTIC_UUID "87654321-4321-4321-4321-cba987654321"

// Global Objects
WiFiClient espClient;
PubSubClient mqttClient(espClient);
DHT dht(DHT_PIN, DHT_TYPE);
HX711 scale;

// BLE
BLEServer* pServer = NULL;
BLECharacteristic* pCharacteristic = NULL;
bool deviceConnected = false;

// FreeRTOS Handles
TaskHandle_t sensorTaskHandle = NULL;
TaskHandle_t mqttTaskHandle = NULL;
TaskHandle_t bleTaskHandle = NULL;
QueueHandle_t sensorDataQueue;

// Data Structure
struct SensorData {
  float temperature;
  float humidity;
  float weight;
  int battery;
  unsigned long timestamp;
};

// BLE Server Callbacks
class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      Serial.println("BLE Client connected");
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("BLE Client disconnected");
      BLEDevice::startAdvertising();
    }
};

// WiFi Connection
void setupWiFi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

// MQTT Connection
void setupMQTT() {
  mqttClient.setServer(mqtt_server, mqtt_port);
  mqttClient.setCallback(mqttCallback);
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  Serial.println(message);

  // Parse command
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, message);
  
  String command = doc["command"];
  
  if (command == "toggle_led") {
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    Serial.println("LED toggled");
  } else if (command == "reset") {
    Serial.println("Resetting device...");
    ESP.restart();
  }
}

void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    if (mqttClient.connect(device_id)) {
      Serial.println("connected");
      
      // Subscribe to command topic
      String commandTopic = "iot/devices/" + String(device_id) + "/commands";
      mqttClient.subscribe(commandTopic.c_str());
      Serial.println("Subscribed to: " + commandTopic);
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

// BLE Setup
void setupBLE() {
  BLEDevice::init("ESP32_IoT_Device");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);

  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ |
                      BLECharacteristic::PROPERTY_WRITE |
                      BLECharacteristic::PROPERTY_NOTIFY
                    );

  pCharacteristic->addDescriptor(new BLE2902());

  pService->start();
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(false);
  pAdvertising->setMinPreferred(0x0);
  BLEDevice::startAdvertising();
  
  Serial.println("BLE service started, waiting for connections...");
}

// Sensor Reading Task
void sensorTask(void *pvParameters) {
  TickType_t xLastWakeTime = xTaskGetTickCount();
  const TickType_t xFrequency = pdMS_TO_TICKS(5000); // 5 seconds

  while (1) {
    SensorData data;
    
    // Read sensors
    data.temperature = dht.readTemperature();
    data.humidity = dht.readHumidity();
    data.weight = scale.get_units(10); // Average of 10 readings
    data.battery = random(85, 100); // Simulate battery reading
    data.timestamp = millis();

    // Validate readings
    if (!isnan(data.temperature) && !isnan(data.humidity)) {
      // Send to queue
      if (xQueueSend(sensorDataQueue, &data, portMAX_DELAY) != pdPASS) {
        Serial.println("Failed to send data to queue");
      }
    } else {
      Serial.println("Failed to read from DHT sensor!");
    }

    vTaskDelayUntil(&xLastWakeTime, xFrequency);
  }
}

// MQTT Publishing Task
void mqttTask(void *pvParameters) {
  SensorData data;
  
  while (1) {
    if (xQueueReceive(sensorDataQueue, &data, portMAX_DELAY) == pdPASS) {
      if (!mqttClient.connected()) {
        reconnectMQTT();
      }
      
      // Create JSON payload
      DynamicJsonDocument doc(1024);
      doc["device_id"] = device_id;
      doc["temperature"] = data.temperature;
      doc["humidity"] = data.humidity;
      doc["weight"] = data.weight;
      doc["battery"] = data.battery;
      doc["timestamp"] = data.timestamp;

      String payload;
      serializeJson(doc, payload);

      // Publish to MQTT
      String topic = "iot/devices/" + String(device_id) + "/telemetry";
      if (mqttClient.publish(topic.c_str(), payload.c_str())) {
        Serial.println("Data published: " + payload);
        digitalWrite(LED_PIN, HIGH);
        delay(100);
        digitalWrite(LED_PIN, LOW);
      } else {
        Serial.println("Failed to publish data");
      }

      mqttClient.loop();
    }
  }
}

// BLE Task
void bleTask(void *pvParameters) {
  SensorData data;
  
  while (1) {
    if (deviceConnected && xQueuePeek(sensorDataQueue, &data, 0) == pdPASS) {
      // Create JSON for BLE
      DynamicJsonDocument doc(1024);
      doc["device_id"] = device_id;
      doc["temperature"] = data.temperature;
      doc["humidity"] = data.humidity;
      doc["weight"] = data.weight;
      doc["battery"] = data.battery;

      String blePayload;
      serializeJson(doc, blePayload);

      pCharacteristic->setValue(blePayload.c_str());
      pCharacteristic->notify();
    }
    
    vTaskDelay(pdMS_TO_TICKS(1000)); // Update BLE every second
  }
}

void setup() {
  Serial.begin(115200);
  
  // Initialize pins
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  
  // Initialize sensors
  dht.begin();
  scale.begin(HX711_DOUT_PIN, HX711_SCK_PIN);
  scale.set_scale(2280.f); // Calibration factor (adjust for your load cell)
  scale.tare(); // Reset scale to 0

  // Create queue for sensor data
  sensorDataQueue = xQueueCreate(10, sizeof(SensorData));
  
  // Setup connections
  setupWiFi();
  setupMQTT();
  setupBLE();

  // Create FreeRTOS tasks
  xTaskCreatePinnedToCore(
    sensorTask,
    "SensorTask",
    4096,
    NULL,
    2,
    &sensorTaskHandle,
    0
  );

  xTaskCreatePinnedToCore(
    mqttTask,
    "MQTTTask", 
    4096,
    NULL,
    1,
    &mqttTaskHandle,
    1
  );

  xTaskCreatePinnedToCore(
    bleTask,
    "BLETask",
    4096,
    NULL,
    1,
    &bleTaskHandle,
    1
  );

  Serial.println("ESP32 IoT Device initialized");
  Serial.println("Device ID: " + String(device_id));
}

void loop() {
  // Main loop is empty as everything runs in FreeRTOS tasks
  vTaskDelay(pdMS_TO_TICKS(1000));
}