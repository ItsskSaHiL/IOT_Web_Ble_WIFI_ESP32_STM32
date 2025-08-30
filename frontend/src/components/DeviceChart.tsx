import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DeviceData } from '../types/api';

interface DeviceChartProps {
  data: DeviceData[];
  metric: 'temperature' | 'humidity' | 'weight' | 'battery';
}

export function DeviceChart({ data, metric }: DeviceChartProps) {
  const chartData = data
    .slice()
    .reverse()
    .map((item, index) => ({
      time: new Date(item.timestamp || Date.now()).toLocaleTimeString(),
      value: item[metric],
      index,
    }));

  const getColor = () => {
    switch (metric) {
      case 'temperature': return '#f97316';
      case 'humidity': return '#3b82f6';
      case 'weight': return '#8b5cf6';
      case 'battery': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getUnit = () => {
    switch (metric) {
      case 'temperature': return '°C';
      case 'humidity': return '%';
      case 'weight': return 'kg';
      case 'battery': return '%';
      default: return '';
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
        {metric} {getUnit()}
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              labelFormatter={(label) => `Time: ${label}`}
              formatter={(value) => [`${value}${getUnit()}`, metric]}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={getColor()} 
              strokeWidth={2}
              dot={{ fill: getColor(), strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}