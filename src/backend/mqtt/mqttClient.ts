import mqtt from 'mqtt';
import { Database } from '../database/database';
import { DeviceData } from '../types/device';
import { WebSocketManager } from '../websocket/websocketManager';

export class MQTTClient {
  private client: mqtt.MqttClient;
  private database: Database;
  private wsManager: WebSocketManager;

  constructor(brokerUrl: string, database: Database, wsManager: WebSocketManager) {
    this.database = database;
    this.wsManager = wsManager;
    this.client = mqtt.connect(brokerUrl);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      console.log('Connected to MQTT broker');
      // Subscribe to all device telemetry topics
      this.client.subscribe('iot/devices/+/telemetry', (err) => {
        if (err) {
          console.error('Failed to subscribe to telemetry topics:', err);
        } else {
          console.log('Subscribed to telemetry topics');
        }
      });
    });

    this.client.on('message', async (topic, message) => {
      try {
        const data: DeviceData = JSON.parse(message.toString());
        
        // Store in database
        await this.database.insertDeviceData(data);
        
        // Broadcast to WebSocket clients
        this.wsManager.broadcast('device_data', data);
        
        console.log(`Received data from ${data.device_id}:`, data);
      } catch (error) {
        console.error('Error processing MQTT message:', error);
      }
    });

    this.client.on('error', (error) => {
      console.error('MQTT connection error:', error);
    });
  }

  publishCommand(deviceId: string, command: any): void {
    const topic = `iot/devices/${deviceId}/commands`;
    this.client.publish(topic, JSON.stringify(command), (err) => {
      if (err) {
        console.error('Failed to publish command:', err);
      } else {
        console.log(`Command sent to ${deviceId}:`, command);
      }
    });
  }

  disconnect(): void {
    this.client.end();
  }
}