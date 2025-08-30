import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';
import { Database } from './database/database';
import { MQTTClient } from './mqtt/mqttClient';
import { WebSocketManager } from './websocket/websocketManager';
import { createAuthRoutes } from './routes/auth';
import { createDeviceRoutes } from './routes/devices';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
const database = new Database(process.env.DATABASE_PATH);

// Initialize WebSocket manager
const wsManager = new WebSocketManager(server);

// Initialize MQTT client
const mqttClient = new MQTTClient(
  process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
  database,
  wsManager
);

// Routes
app.use('/api/auth', createAuthRoutes(database));
app.use('/api/devices', createDeviceRoutes(database, mqttClient));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    websocket_clients: wsManager.getClientCount()
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  mqttClient.disconnect();
  database.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

server.listen(PORT, () => {
  console.log(`IoT Dashboard Backend running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
});