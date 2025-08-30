import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { DeviceData, Device } from '../types/device';

export class Database {
  private db: sqlite3.Database;

  constructor(dbPath: string = './iot_dashboard.db') {
    this.db = new sqlite3.Database(dbPath);
    this.initializeTables();
  }

  private async initializeTables(): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));
    
    // Create devices table
    await run(`
      CREATE TABLE IF NOT EXISTS devices (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'offline',
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create device_data table
    await run(`
      CREATE TABLE IF NOT EXISTS device_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT NOT NULL,
        temperature REAL,
        humidity REAL,
        weight REAL,
        battery INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES devices (id)
      )
    `);

    // Create users table for authentication
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await run(`CREATE INDEX IF NOT EXISTS idx_device_data_device_id ON device_data (device_id)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_device_data_timestamp ON device_data (timestamp)`);
  }

  async insertDeviceData(data: DeviceData): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));
    
    // Update or insert device
    await run(`
      INSERT OR REPLACE INTO devices (id, name, status, last_seen)
      VALUES (?, ?, 'online', CURRENT_TIMESTAMP)
    `, [data.device_id, data.device_id]);

    // Insert telemetry data
    await run(`
      INSERT INTO device_data (device_id, temperature, humidity, weight, battery)
      VALUES (?, ?, ?, ?, ?)
    `, [data.device_id, data.temperature, data.humidity, data.weight, data.battery]);
  }

  async getDevices(): Promise<Device[]> {
    const all = promisify(this.db.all.bind(this.db));
    return await all(`SELECT * FROM devices ORDER BY last_seen DESC`);
  }

  async getDeviceData(deviceId: string, limit: number = 100): Promise<DeviceData[]> {
    const all = promisify(this.db.all.bind(this.db));
    return await all(`
      SELECT device_id, temperature, humidity, weight, battery, timestamp
      FROM device_data 
      WHERE device_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `, [deviceId, limit]);
  }

  async createUser(username: string, passwordHash: string): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));
    await run(`
      INSERT INTO users (username, password_hash)
      VALUES (?, ?)
    `, [username, passwordHash]);
  }

  async getUserByUsername(username: string): Promise<any> {
    const get = promisify(this.db.get.bind(this.db));
    return await get(`SELECT * FROM users WHERE username = ?`, [username]);
  }

  close(): void {
    this.db.close();
  }
}