# IoT Dashboard - Full Stack Application

A comprehensive IoT dashboard application with ESP32 firmware, Node.js backend, and React frontend.

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   ESP32 Device  │───▶│ MQTT Broker  │───▶│   Backend API   │
│   (C++/FreeRTOS)│    │ (Mosquitto)  │    │   (Node.js)     │
└─────────────────┘    └──────────────┘    └─────────────────┘
         │                                           │
         │ BLE GATT                                  │ WebSocket
         │                                           │
         ▼                                           ▼
┌─────────────────┐                        ┌─────────────────┐
│  Mobile App     │                        │  Web Dashboard  │
│  (BLE Client)   │                        │    (React)      │
└─────────────────┘                        └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PlatformIO (for ESP32 firmware)

### 1. Development Setup

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Start development servers
npm run dev
```

### 2. Docker Deployment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 3. ESP32 Firmware

```bash
# Navigate to firmware directory
cd src/firmware

# Install PlatformIO CLI
pip install platformio

# Build and upload firmware
pio run --target upload

# Monitor serial output
pio device monitor
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - User login

### Devices
- `GET /api/devices` - List all devices
- `GET /api/devices/:id/data` - Get device telemetry data
- `POST /api/devices/:id/command` - Send command to device

### WebSocket
- `ws://localhost:3001?token=JWT_TOKEN` - Real-time data updates

## 🔧 Configuration

### Environment Variables

Create `.env` file:

```env
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-in-production
MQTT_BROKER_URL=mqtt://localhost:1883
DATABASE_PATH=./iot_dashboard.db
```

### ESP32 Configuration

Update `src/firmware/esp32_iot_device.cpp`:

```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* mqtt_server = "YOUR_MQTT_BROKER_IP";
```

## 📊 Features

### ESP32 Device
- ✅ WiFi connectivity
- ✅ MQTT telemetry publishing
- ✅ BLE GATT service
- ✅ FreeRTOS multitasking
- ✅ Sensor readings (DHT22, HX711)
- ✅ Remote command handling

### Backend API
- ✅ REST API with Express.js
- ✅ WebSocket real-time updates
- ✅ MQTT broker integration
- ✅ SQLite database
- ✅ JWT authentication
- ✅ Device management

### Frontend Dashboard
- ✅ React with TypeScript
- ✅ Real-time charts (Recharts)
- ✅ Device status monitoring
- ✅ Command sending interface
- ✅ BLE device scanning
- ✅ Responsive design

## 🧪 Testing

### Device Simulator

Test the system without physical hardware:

```bash
# Start the device simulator
node src/simulator/device_simulator.js
```

This creates 3 virtual ESP32 devices sending realistic telemetry data.

### Manual Testing

1. Register a new user account
2. Login to access the dashboard
3. Start the device simulator
4. Watch real-time data updates
5. Send commands to devices

## 🔒 Security

- JWT-based authentication
- CORS protection
- Input validation
- Secure WebSocket connections
- Environment variable configuration

## 📱 BLE Integration

The web dashboard supports Web Bluetooth API for direct device connections:

1. Click "BLE Scan" in the dashboard
2. Select ESP32 device from the list
3. View real-time data without MQTT

## 🐳 Production Deployment

### Docker Compose

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

### Individual Services

```bash
# MQTT Broker
docker run -d -p 1883:1883 eclipse-mosquitto:2.0

# Backend
docker build -f Dockerfile.backend -t iot-backend .
docker run -d -p 3001:3001 iot-backend

# Frontend
docker build -f Dockerfile.frontend -t iot-frontend ./frontend
docker run -d -p 3000:80 iot-frontend
```

## 🛠️ Hardware Setup

### Required Components
- ESP32 DevKit
- DHT22 temperature/humidity sensor
- HX711 load cell amplifier
- Load cell (weight sensor)
- LED for status indication
- Breadboard and jumper wires

### Wiring Diagram
```
ESP32 Pin    Component
GPIO 4    ── DHT22 Data
GPIO 16   ── HX711 DOUT
GPIO 17   ── HX711 SCK
GPIO 2    ── LED (+ 220Ω resistor)
3.3V      ── DHT22 VCC, HX711 VCC
GND       ── All component grounds
```

## 📈 Monitoring

- Device status: Online/Offline detection
- Real-time telemetry charts
- WebSocket connection status
- MQTT broker health
- Battery level monitoring

## 🔄 Data Flow

1. **ESP32** reads sensors every 5 seconds
2. **FreeRTOS** tasks handle concurrent operations
3. **MQTT** publishes telemetry to broker
4. **Backend** subscribes to MQTT topics
5. **Database** stores historical data
6. **WebSocket** broadcasts real-time updates
7. **Frontend** displays live charts and device status

## 🚨 Troubleshooting

### Common Issues

1. **MQTT Connection Failed**
   - Check broker URL and port
   - Verify network connectivity
   - Check firewall settings

2. **WebSocket Not Connecting**
   - Verify JWT token is valid
   - Check CORS configuration
   - Ensure backend is running

3. **ESP32 Not Publishing**
   - Check WiFi credentials
   - Verify MQTT broker accessibility
   - Monitor serial output for errors

4. **BLE Not Working**
   - Use HTTPS or localhost
   - Check browser BLE support
   - Ensure device is advertising

## 📝 License

MIT License - see LICENSE file for details.