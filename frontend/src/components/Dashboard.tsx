import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { DeviceCard } from './DeviceCard';
import { DeviceChart } from './DeviceChart';
import { Device, DeviceData, WebSocketMessage } from '../types/api';
import { LogOut, RefreshCw, Smartphone } from 'lucide-react';

interface DashboardProps {
  username: string;
  onLogout: () => void;
}

export function Dashboard({ username, onLogout }: DashboardProps) {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [deviceDataMap, setDeviceDataMap] = useState<Record<string, DeviceData[]>>({});
  const [bleSupported, setBleSupported] = useState(false);
  const [bleScanning, setBleScanning] = useState(false);

  // Check BLE support
  useEffect(() => {
    setBleSupported('bluetooth' in navigator);
  }, []);

  // Fetch devices
  const { data: devices = [], refetch: refetchDevices } = useQuery({
    queryKey: ['devices'],
    queryFn: () => apiService.getDevices(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch device data for selected device
  const { data: selectedDeviceData = [] } = useQuery({
    queryKey: ['deviceData', selectedDevice],
    queryFn: () => selectedDevice ? apiService.getDeviceData(selectedDevice, 50) : Promise.resolve([]),
    enabled: !!selectedDevice,
    refetchInterval: 10000,
  });

  // WebSocket for real-time updates
  const { isConnected } = useWebSocket(
    apiService.getWebSocketUrl(),
    (message: WebSocketMessage) => {
      if (message.type === 'device_data' && message.data) {
        const data: DeviceData = message.data;
        setDeviceDataMap(prev => ({
          ...prev,
          [data.device_id]: [data, ...(prev[data.device_id] || [])].slice(0, 50)
        }));
        refetchDevices();
      }
    }
  );

  const handleSendCommand = async (deviceId: string, command: string) => {
    try {
      await apiService.sendDeviceCommand(deviceId, { command });
      alert(`Command "${command}" sent to device ${deviceId}`);
    } catch (error) {
      alert('Failed to send command: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleBLEScan = async () => {
    if (!bleSupported) {
      alert('Bluetooth is not supported in this browser');
      return;
    }

    setBleScanning(true);
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ namePrefix: 'ESP32' }],
        optionalServices: ['12345678-1234-1234-1234-123456789abc']
      });
      
      console.log('Found BLE device:', device.name);
      alert(`Found device: ${device.name}`);
    } catch (error) {
      console.error('BLE scan error:', error);
      alert('BLE scan failed or was cancelled');
    } finally {
      setBleScanning(false);
    }
  };

  const getLatestData = (deviceId: string): DeviceData | undefined => {
    const realtimeData = deviceDataMap[deviceId]?.[0];
    const queryData = selectedDevice === deviceId ? selectedDeviceData[0] : undefined;
    return realtimeData || queryData;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">IoT Dashboard</h1>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {username}</span>
              
              {bleSupported && (
                <button
                  onClick={handleBLEScan}
                  disabled={bleScanning}
                  className="btn-secondary"
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  {bleScanning ? 'Scanning...' : 'BLE Scan'}
                </button>
              )}
              
              <button onClick={() => refetchDevices()} className="btn-secondary">
                <RefreshCw className="w-4 h-4" />
              </button>
              
              <button onClick={onLogout} className="btn-secondary">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Device List */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Devices ({devices.length})
            </h2>
            <div className="space-y-4">
              {devices.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  latestData={getLatestData(device.id)}
                  onSelect={setSelectedDevice}
                  onSendCommand={handleSendCommand}
                />
              ))}
              {devices.length === 0 && (
                <div className="card text-center py-8">
                  <p className="text-gray-500">No devices found</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Devices will appear here when they start sending data
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Charts */}
          <div className="lg:col-span-2">
            {selectedDevice ? (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Device: {selectedDevice}
                </h2>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <DeviceChart data={selectedDeviceData} metric="temperature" />
                  <DeviceChart data={selectedDeviceData} metric="humidity" />
                  <DeviceChart data={selectedDeviceData} metric="weight" />
                  <DeviceChart data={selectedDeviceData} metric="battery" />
                </div>
              </div>
            ) : (
              <div className="card text-center py-16">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Select a Device
                </h2>
                <p className="text-gray-500">
                  Click on a device card to view its telemetry charts
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}