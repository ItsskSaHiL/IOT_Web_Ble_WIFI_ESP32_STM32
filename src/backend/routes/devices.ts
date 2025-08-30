import express from 'express';
import { Database } from '../database/database';
import { MQTTClient } from '../mqtt/mqttClient';
import { authenticateToken } from '../middleware/auth';

export function createDeviceRoutes(database: Database, mqttClient: MQTTClient): express.Router {
  const router = express.Router();

  // Apply authentication to all device routes
  router.use(authenticateToken);

  // Get all devices
  router.get('/', async (req, res) => {
    try {
      const devices = await database.getDevices();
      res.json(devices);
    } catch (error) {
      console.error('Error fetching devices:', error);
      res.status(500).json({ error: 'Failed to fetch devices' });
    }
  });

  // Get device data
  router.get('/:id/data', async (req, res) => {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;
      
      const data = await database.getDeviceData(id, limit);
      res.json(data);
    } catch (error) {
      console.error('Error fetching device data:', error);
      res.status(500).json({ error: 'Failed to fetch device data' });
    }
  });

  // Send command to device
  router.post('/:id/command', async (req, res) => {
    try {
      const { id } = req.params;
      const command = req.body;

      if (!command.command) {
        return res.status(400).json({ error: 'Command field is required' });
      }

      mqttClient.publishCommand(id, command);
      res.json({ message: 'Command sent successfully', command });
    } catch (error) {
      console.error('Error sending command:', error);
      res.status(500).json({ error: 'Failed to send command' });
    }
  });

  return router;
}