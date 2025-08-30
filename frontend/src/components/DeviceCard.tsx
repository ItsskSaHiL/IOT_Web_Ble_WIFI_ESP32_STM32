import React from 'react';
import { Device } from '../types/api';
import { Wifi, WifiOff, Battery, Thermometer, Droplets, Weight } from 'lucide-react';

interface DeviceCardProps {
  device: Device;
  latestData?: {
    temperature: number;
    humidity: number;
    weight: number;
    battery: number;
  };
  onSelect: (deviceId: string) => void;
  onSendCommand: (deviceId: string, command: string) => void;
}

export function DeviceCard({ device, latestData, onSelect, onSendCommand }: DeviceCardProps) {
  const isOnline = device.status === 'online';
  const lastSeen = new Date(device.last_seen).toLocaleString();

  return (
    <div className="card hover:shadow-md transition-shadow cursor-pointer" onClick={() => onSelect(device.id)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{device.name}</h3>
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <Wifi className="w-5 h-5 text-green-500" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-500" />
          )}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {device.status}
          </span>
        </div>
      </div>

      {latestData && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <Thermometer className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-gray-600">{latestData.temperature}°C</span>
          </div>
          <div className="flex items-center space-x-2">
            <Droplets className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-600">{latestData.humidity}%</span>
          </div>
          <div className="flex items-center space-x-2">
            <Weight className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-gray-600">{latestData.weight}kg</span>
          </div>
          <div className="flex items-center space-x-2">
            <Battery className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-600">{latestData.battery}%</span>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 mb-4">
        Last seen: {lastSeen}
      </div>

      <div className="flex space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSendCommand(device.id, 'toggle_led');
          }}
          className="btn-secondary text-xs px-3 py-1 flex-1"
          disabled={!isOnline}
        >
          Toggle LED
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSendCommand(device.id, 'reset');
          }}
          className="btn-secondary text-xs px-3 py-1 flex-1"
          disabled={!isOnline}
        >
          Reset
        </button>
      </div>
    </div>
  );
}