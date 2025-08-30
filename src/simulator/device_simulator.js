/*
 * ESP32 Device Simulator
 * 
 * This Node.js script simulates multiple ESP32 devices sending
 * telemetry data via MQTT for testing purposes.
 */

const mqtt = require('mqtt');

const MQTT_BROKER = 'mqtt://localhost:1883';
const DEVICE_COUNT = 3;
const PUBLISH_INTERVAL = 5000; // 5 seconds

class DeviceSimulator {
  constructor(deviceId) {
    this.deviceId = deviceId;
    this.client = mqtt.connect(MQTT_BROKER);
    this.setupMQTT();
    this.startPublishing();
  }

  setupMQTT() {
    this.client.on('connect', () => {
      console.log(`Device ${this.deviceId} connected to MQTT broker`);
      
      // Subscribe to commands
      const commandTopic = `iot/devices/${this.deviceId}/commands`;
      this.client.subscribe(commandTopic);
    });

    this.client.on('message', (topic, message) => {
      console.log(`Device ${this.deviceId} received command:`, message.toString());
    });

    this.client.on('error', (error) => {
      console.error(`Device ${this.deviceId} MQTT error:`, error);
    });
  }

  generateSensorData() {
    return {
      device_id: this.deviceId,
      temperature: Math.round((20 + Math.random() * 15) * 10) / 10, // 20-35°C
      humidity: Math.round((40 + Math.random() * 40) * 10) / 10,    // 40-80%
      weight: Math.round((Math.random() * 10) * 100) / 100,         // 0-10kg
      battery: Math.floor(85 + Math.random() * 15),                 // 85-100%
      timestamp: new Date().toISOString()
    };
  }

  startPublishing() {
    setInterval(() => {
      if (this.client.connected) {
        const data = this.generateSensorData();
        const topic = `iot/devices/${this.deviceId}/telemetry`;
        
        this.client.publish(topic, JSON.stringify(data), (err) => {
          if (err) {
            console.error(`Failed to publish data for ${this.deviceId}:`, err);
          } else {
            console.log(`Published data for ${this.deviceId}:`, data);
          }
        });
      }
    }, PUBLISH_INTERVAL);
  }
}

// Create multiple simulated devices
console.log(`Starting ${DEVICE_COUNT} device simulators...`);

for (let i = 1; i <= DEVICE_COUNT; i++) {
  const deviceId = `esp32_${String(i).padStart(3, '0')}`;
  new DeviceSimulator(deviceId);
}

console.log('Device simulators started. Press Ctrl+C to stop.');