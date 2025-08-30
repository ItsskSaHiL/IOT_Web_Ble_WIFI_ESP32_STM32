export interface DeviceData {
  device_id: string;
  temperature: number;
  humidity: number;
  weight: number;
  battery: number;
  timestamp?: string;
}

export interface Device {
  id: string;
  name: string;
  status: 'online' | 'offline';
  last_seen: string;
  created_at: string;
}

export interface DeviceCommand {
  command: string;
  parameters?: Record<string, any>;
}

export interface AuthResponse {
  token: string;
  username: string;
}

export interface WebSocketMessage {
  type: string;
  data?: any;
  message?: string;
}