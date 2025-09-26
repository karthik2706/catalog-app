'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { 
  Database, 
  Server, 
  Settings, 
  Shield, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  HardDrive,
  Cpu,
  MemoryStick,
  Network
} from 'lucide-react';

interface SystemStatus {
  database: {
    status: 'healthy' | 'warning' | 'error';
    responseTime: number;
    connections: number;
    lastBackup: string;
  };
  server: {
    status: 'healthy' | 'warning' | 'error';
    uptime: string;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
    disk: {
      used: number;
      total: number;
      percentage: number;
    };
  };
  services: Array<{
    name: string;
    status: 'running' | 'stopped' | 'error';
    port: number;
    lastCheck: string;
  }>;
}

export default function AdminSystemPage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    fetchSystemStatus();
  }, []);

  const fetchSystemStatus = async () => {
    try {
      setRefreshing(true);
      // Mock data for now - replace with actual API call
      const mockData: SystemStatus = {
        database: {
          status: 'healthy',
          responseTime: 12,
          connections: 8,
          lastBackup: '2025-09-26T02:00:00Z'
        },
        server: {
          status: 'healthy',
          uptime: '7 days, 14 hours',
          memory: {
            used: 2.1,
            total: 8.0,
            percentage: 26
          },
          cpu: {
            usage: 15
          },
          disk: {
            used: 45.2,
            total: 100.0,
            percentage: 45
          }
        },
        services: [
          {
            name: 'Web Server',
            status: 'running',
            port: 3000,
            lastCheck: '2025-09-26T10:45:00Z'
          },
          {
            name: 'Database',
            status: 'running',
            port: 5432,
            lastCheck: '2025-09-26T10:45:00Z'
          },
          {
            name: 'Redis Cache',
            status: 'running',
            port: 6379,
            lastCheck: '2025-09-26T10:45:00Z'
          },
          {
            name: 'File Storage',
            status: 'running',
            port: 9000,
            lastCheck: '2025-09-26T10:45:00Z'
          }
        ]
      };
      
      setSystemStatus(mockData);
    } catch (error) {
      console.error('Error fetching system status:', error);
      showToast('error', 'Failed to fetch system status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'running':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'error':
      case 'stopped':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'running':
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'error':
      case 'stopped':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading system status...</p>
        </div>
      </div>
    );
  }

  if (!systemStatus) {
    return (
      <div className="text-center py-12">
        <Server className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load system status</h3>
        <p className="text-gray-600">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Administration</h1>
          <p className="text-gray-600 mt-2">Monitor system health and performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={fetchSystemStatus} 
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Database</p>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(systemStatus.database.status)}
                  {getStatusBadge(systemStatus.database.status)}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-500">Response Time: {systemStatus.database.responseTime}ms</p>
              <p className="text-xs text-gray-500">Connections: {systemStatus.database.connections}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Server className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Server</p>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(systemStatus.server.status)}
                  {getStatusBadge(systemStatus.server.status)}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-500">Uptime: {systemStatus.server.uptime}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MemoryStick className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Memory</p>
                <p className="text-lg font-bold text-gray-900">
                  {systemStatus.server.memory.percentage}%
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-500">
                {formatBytes(systemStatus.server.memory.used * 1024 * 1024 * 1024)} / {formatBytes(systemStatus.server.memory.total * 1024 * 1024 * 1024)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Cpu className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">CPU Usage</p>
                <p className="text-lg font-bold text-gray-900">
                  {systemStatus.server.cpu.usage}%
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-600 h-2 rounded-full" 
                  style={{ width: `${systemStatus.server.cpu.usage}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Services Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Network className="w-5 h-5" />
              <span>Services Status</span>
            </CardTitle>
            <CardDescription>Monitor running services and their health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemStatus.services.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(service.status)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{service.name}</p>
                      <p className="text-xs text-gray-500">Port {service.port}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(service.status)}
                    <p className="text-xs text-gray-500">
                      {formatTimestamp(service.lastCheck)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Storage Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <HardDrive className="w-5 h-5" />
              <span>Storage Information</span>
            </CardTitle>
            <CardDescription>Disk usage and storage statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Disk Usage</span>
                  <span className="text-sm text-gray-500">
                    {systemStatus.server.disk.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full" 
                    style={{ width: `${systemStatus.server.disk.percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatBytes(systemStatus.server.disk.used * 1024 * 1024 * 1024)} / {formatBytes(systemStatus.server.disk.total * 1024 * 1024 * 1024)}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Memory Usage</span>
                  <span className="text-sm text-gray-500">
                    {systemStatus.server.memory.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-purple-600 h-3 rounded-full" 
                    style={{ width: `${systemStatus.server.memory.percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatBytes(systemStatus.server.memory.used * 1024 * 1024 * 1024)} / {formatBytes(systemStatus.server.memory.total * 1024 * 1024 * 1024)}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Last Database Backup</span>
                  <span className="text-sm text-gray-500">
                    {formatTimestamp(systemStatus.database.lastBackup)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
          toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
