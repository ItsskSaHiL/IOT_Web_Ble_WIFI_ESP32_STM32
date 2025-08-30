import { Device, DeviceData, DeviceCommand, AuthResponse } from '../types/api';

const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data: AuthResponse = await response.json();
    this.token = data.token;
    localStorage.setItem('auth_token', data.token);
    return data;
  }

  async register(username: string, password: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  async getDevices(): Promise<Device[]> {
    const response = await fetch(`${API_BASE_URL}/devices`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch devices');
    }

    return response.json();
  }

  async getDeviceData(deviceId: string, limit: number = 100): Promise<DeviceData[]> {
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}/data?limit=${limit}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch device data');
    }

    return response.json();
  }

  async sendDeviceCommand(deviceId: string, command: DeviceCommand): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}/command`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      throw new Error('Failed to send command');
    }
  }

  getWebSocketUrl(): string {
    return `ws://localhost:3001?token=${this.token}`;
  }
}

export const apiService = new ApiService();