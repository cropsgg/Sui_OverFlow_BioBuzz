"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from "framer-motion";
import { DataManagement } from '@/components/dao/data-management';
import { daoApi } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { 
  Thermometer, 
  Droplets, 
  Zap, 
  Database, 
  AlertTriangle,
  Activity,
  TrendingUp,
  Eye,
  Shield,
  Clock,
  CheckCircle,
  Bell,
  Download,
  Settings,
  Gauge
} from 'lucide-react';
import { toast } from 'sonner';

interface IoTStats {
  totalDataRecords: number;
  recentAlerts: number;
  activeSensors: number;
  lastUpdate: Date | null;
}

interface SensorReading {
  sensorType: number;
  sensorTypeName: string;
  value: number;
  timestamp: Date;
  status: 'normal' | 'warning' | 'critical';
  triggeredAlert: boolean;
}

export default function IoTPage() {
  const { user } = useAuth();
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<any>(null);
  const [stats, setStats] = useState<IoTStats | null>(null);
  const [recentReadings, setRecentReadings] = useState<SensorReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  // Mock sensor data - in a real app this would come from the backend
  const mockSensorReadings: SensorReading[] = [
    {
      sensorType: 0,
      sensorTypeName: 'Temperature Sensor',
      value: 21.3,
      timestamp: new Date(Date.now() - 5 * 60000),
      status: 'normal',
      triggeredAlert: false
    },
    {
      sensorType: 0,
      sensorTypeName: 'Temperature Sensor',
      value: -80.1,
      timestamp: new Date(Date.now() - 10 * 60000),
      status: 'normal',
      triggeredAlert: false
    },
    {
      sensorType: 0,
      sensorTypeName: 'Temperature Sensor',
      value: -76.2,
      timestamp: new Date(Date.now() - 15 * 60000),
      status: 'warning',
      triggeredAlert: true
    },
    {
      sensorType: 1,
      sensorTypeName: 'Humidity Sensor',
      value: 45.8,
      timestamp: new Date(Date.now() - 3 * 60000),
      status: 'normal',
      triggeredAlert: false
    }
  ];

  // Load user status and stats
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [userStatusRes, dashboardStatsRes, dataRecordsRes] = await Promise.all([
        user ? daoApi.getUserDaoStatus() : Promise.resolve({ success: false, data: null }),
        daoApi.getDashboardStats(),
        daoApi.getDataRecords({ limit: 10, sortBy: 'timestamp', sortOrder: 'desc' })
      ]);

      if (userStatusRes.success) {
        setUserStatus(userStatusRes.data);
        setUserAddress(userStatusRes.data?.suiAddress);
      }

      if (dashboardStatsRes.success) {
        setStats({
          totalDataRecords: dashboardStatsRes.data.totalDataRecords || 0,
          recentAlerts: dashboardStatsRes.data.recentAlerts || 0,
          activeSensors: 4, // Mock data
          lastUpdate: new Date()
        });
      }

      // Use mock data for recent readings for now
      setRecentReadings(mockSensorReadings);

    } catch (error) {
      console.error('Error loading IoT data:', error);
      toast.error('Failed to load IoT data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const getSensorIcon = (sensorType: number) => {
    switch (sensorType) {
      case 0: return <Thermometer className="h-4 w-4" />;
      case 1: return <Droplets className="h-4 w-4" />;
      case 2: return <Gauge className="h-4 w-4" />;
      case 3: return <Zap className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'normal': 
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Normal</Badge>;
      case 'warning': 
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Warning</Badge>;
      case 'critical': 
        return <Badge variant="destructive">Critical</Badge>;
      default: 
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return <IoTSkeleton />;
  }

  const isAuthenticated = !!user;
  const isMember = userStatus?.isDaoMember || false;

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center">
            <Database className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">IoT Data Management</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Submit, monitor, and manage IoT sensor data with blockchain verification. 
          Contribute to decentralized research through secure data sharing.
        </p>
        
        {!isAuthenticated && (
          <Alert className="max-w-2xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please login to submit and manage IoT sensor data.
            </AlertDescription>
          </Alert>
        )}

        {isAuthenticated && !isMember && (
          <Alert className="max-w-2xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You need to be a DAO member to submit data. 
              Link your Sui address and contact an administrator to join.
            </AlertDescription>
          </Alert>
        )}
      </motion.div>

      {/* Stats Overview */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Data Records</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDataRecords}</div>
              <p className="text-xs text-muted-foreground">
                Verified on blockchain
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sensors</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeSensors}</div>
              <p className="text-xs text-muted-foreground">
                Currently monitoring
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.recentAlerts}</div>
              <p className="text-xs text-muted-foreground">
                Last 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Update</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Now</div>
              <p className="text-xs text-muted-foreground">
                Real-time monitoring
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-wrap gap-4 justify-center"
      >
        <Button onClick={() => setSelectedTab('data')} className="gap-2">
          <Database className="h-4 w-4" />
          Submit Data
        </Button>
        <Button variant="outline" onClick={() => setSelectedTab('monitoring')} className="gap-2">
          <Eye className="h-4 w-4" />
          Monitor Sensors
        </Button>
        <Button variant="outline" className="gap-2">
          <Settings className="h-4 w-4" />
          Configure Alerts
        </Button>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </motion.div>

      {/* Main Content Tabs */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="monitoring" className="gap-2">
              <Activity className="h-4 w-4" />
              Live Monitoring
          </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <Database className="h-4 w-4" />
              Data Management
          </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2">
              <Bell className="h-4 w-4" />
              Alerts & Thresholds
          </TabsTrigger>
        </TabsList>

          <TabsContent value="monitoring" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Recent Sensor Readings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    Recent Sensor Readings
                  </CardTitle>
                  <CardDescription>
                    Latest verified sensor data submissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentReadings.slice(0, 4).map((reading, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getSensorIcon(reading.sensorType)}
                          <div>
                            <p className="font-medium">{reading.sensorTypeName}</p>
                <p className="text-sm text-muted-foreground">
                              {formatTimestamp(reading.timestamp)}
                </p>
              </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${getStatusColor(reading.status)}`}>
                            {reading.value}
                            {reading.sensorType === 0 ? '°C' : 
                             reading.sensorType === 1 ? '%' : 
                             reading.sensorType === 2 ? ' hPa' : ' lux'}
                          </p>
                          {getStatusBadge(reading.status)}
                </div>
              </div>
                    ))}
              </div>
                </CardContent>
              </Card>

              {/* System Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-500" />
                    System Status
                  </CardTitle>
                  <CardDescription>
                    Overall system health and connectivity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Blockchain Connection</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Data Verification</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Alert System</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Operational
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Last Sync</span>
                      <span className="text-sm text-muted-foreground">
                        {stats?.lastUpdate ? formatTimestamp(stats.lastUpdate) : 'N/A'}
                      </span>
                </div>
              </div>
                </CardContent>
              </Card>
            </div>

            {/* Sensor Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
              {recentReadings.map((reading, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className={`border-l-4 ${
                    reading.status === 'normal' ? 'border-l-green-500' :
                    reading.status === 'warning' ? 'border-l-yellow-500' :
                    'border-l-red-500'
                  }`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getSensorIcon(reading.sensorType)}
                          <CardTitle className="text-sm">{reading.sensorTypeName}</CardTitle>
                        </div>
                        {reading.triggeredAlert && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {reading.value}
                        {reading.sensorType === 0 ? '°C' : 
                         reading.sensorType === 1 ? '%' : 
                         reading.sensorType === 2 ? ' hPa' : ' lux'}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        {getStatusBadge(reading.status)}
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(reading.timestamp)}
                        </span>
              </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="data" className="mt-6">
            <DataManagement userAddress={userAddress || undefined} />
        </TabsContent>

          <TabsContent value="alerts" className="mt-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-orange-500" />
                    Alert Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure thresholds and alert conditions for sensors
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Thermometer className="h-4 w-4" />
                          <h4 className="font-medium">Temperature Alerts</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Triggers when temperature exceeds safe ranges
                        </p>
                        <div className="text-xs text-muted-foreground">
                          Range: -10°C to 50°C
                        </div>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Droplets className="h-4 w-4" />
                          <h4 className="font-medium">Humidity Alerts</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Triggers when humidity is outside optimal range
                        </p>
                        <div className="text-xs text-muted-foreground">
                          Range: 20% to 80%
            </div>
              </div>
            </div>
                    
                    {!isMember && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          You must be a DAO member to configure alerts and thresholds.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Recent Alerts
                  </CardTitle>
                  <CardDescription>
                    Latest sensor alerts and threshold violations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentReadings.filter(r => r.triggeredAlert).map((alert, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-red-50 dark:bg-red-900/20">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <div className="flex-1">
                          <p className="font-medium">{alert.sensorTypeName} Alert</p>
              <p className="text-sm text-muted-foreground">
                            Value {alert.value} exceeded threshold at {formatTimestamp(alert.timestamp)}
              </p>
            </div>
                        <Badge variant="destructive">Active</Badge>
                      </div>
                    ))}
                    
                    {recentReadings.filter(r => r.triggeredAlert).length === 0 && (
                      <div className="text-center py-6">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                        <h3 className="text-lg font-semibold mb-2">No Active Alerts</h3>
                        <p className="text-muted-foreground">All sensors are operating within normal parameters.</p>
                      </div>
                    )}
              </div>
                </CardContent>
              </Card>
            </div>
        </TabsContent>
      </Tabs>
      </motion.div>

      {/* Call to Action */}
      {isAuthenticated && isMember && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center space-y-4 py-8"
        >
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <Database className="h-5 w-5" />
                Contribute to Research
              </CardTitle>
              <CardDescription>
                Help build the world's largest decentralized research dataset
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => setSelectedTab('data')}>
                  <Database className="h-4 w-4 mr-2" />
                  Submit Data
                </Button>
                <Button variant="outline" onClick={() => setSelectedTab('monitoring')}>
                  <Eye className="h-4 w-4 mr-2" />
                  Monitor Live
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

const IoTSkeleton = () => (
  <div className="container mx-auto py-8 space-y-8">
    <div className="text-center space-y-4">
      <div className="h-10 w-64 bg-muted rounded mx-auto" />
      <div className="h-6 w-96 bg-muted rounded mx-auto" />
    </div>
    
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="h-4 w-24 bg-muted rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 bg-muted rounded" />
            <div className="h-3 w-20 bg-muted rounded mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>

    <div className="grid gap-6 md:grid-cols-2">
      {[...Array(2)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="h-6 w-32 bg-muted rounded" />
            <div className="h-4 w-48 bg-muted rounded" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-16 bg-muted rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
          </div>
        </div>
);
