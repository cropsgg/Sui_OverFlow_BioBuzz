'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { daoApi } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { 
  Database, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  Thermometer,
  Droplets,
  Gauge,
  Sun,
  RefreshCw,
  Calendar,
  User,
  Activity,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';

const submitDataSchema = z.object({
  sensorType: z.number().min(0).max(3, 'Invalid sensor type'),
  value: z.number().min(-1000).max(10000, 'Value must be between -1000 and 10000'),
  metadata: z.string().min(5, 'Metadata must be at least 5 characters').max(2000, 'Metadata must be less than 2000 characters'),
  dataHash: z.string().min(8, 'Data hash must be at least 8 characters'),
});

type SubmitDataForm = z.infer<typeof submitDataSchema>;

interface DataManagementProps {
  userAddress?: string;
}

interface DataManagementState {
  dataRecords: any[];
  sensorTypes: any[];
  thresholds: any[];
  userStatus: any;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
}

interface DataFilters {
  sensorType?: number;
  triggeredAlert?: boolean;
  dateFrom?: string;
  dateTo?: string;
  valueMin?: number;
  valueMax?: number;
  search?: string;
}

export const DataManagement: React.FC<DataManagementProps> = ({ userAddress }) => {
  const { user } = useAuth();
  const [isSubmittingData, setIsSubmittingData] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [filters, setFilters] = useState<DataFilters>({});
  const [sortBy, setSortBy] = useState<string>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [data, setData] = useState<DataManagementState>({
    dataRecords: [],
    sensorTypes: [],
    thresholds: [],
    userStatus: null,
    isLoading: true,
    error: null,
    pagination: { page: 1, totalPages: 1, total: 0 }
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<SubmitDataForm>({
    resolver: zodResolver(submitDataSchema),
  });

  const sensorTypeValue = watch('sensorType');

  const loadDataRecords = async (page = 1, appliedFilters = filters) => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      const [dataRes, sensorTypesRes, thresholdsRes, userStatusRes] = await Promise.all([
        daoApi.getDataRecords({ 
          page, 
          limit: 20, 
          sensorType: appliedFilters.sensorType,
          triggeredAlert: appliedFilters.triggeredAlert,
          dateFrom: appliedFilters.dateFrom,
          dateTo: appliedFilters.dateTo,
          valueMin: appliedFilters.valueMin,
          valueMax: appliedFilters.valueMax,
          sortBy,
          sortOrder
        }),
        daoApi.getSensorTypes(),
        daoApi.getThresholds(),
        user ? daoApi.getUserDaoStatus() : Promise.resolve({ success: false, data: null })
      ]);

      if (!dataRes.success) {
        throw new Error(dataRes.message || 'Failed to load data records');
      }

      setData({
        dataRecords: dataRes.data || [],
        sensorTypes: sensorTypesRes.success ? sensorTypesRes.data || [] : [],
        thresholds: thresholdsRes.success ? thresholdsRes.data || [] : [],
        userStatus: userStatusRes.success ? userStatusRes.data : null,
        isLoading: false,
        error: null,
        pagination: dataRes.pagination || { page: 1, totalPages: 1, total: 0 }
      });
    } catch (error: any) {
      console.error('Error loading data records:', error);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to load data records'
      }));
    }
  };

  useEffect(() => {
    loadDataRecords();
  }, [user, sortBy, sortOrder]);

  const refreshData = () => {
    loadDataRecords(data.pagination.page);
  };

  const applyFilters = () => {
    loadDataRecords(1, filters);
  };

  const onSubmitData = async (formData: SubmitDataForm) => {
    if (!data.userStatus?.isDaoMember) {
      toast.error('Only DAO members can submit data');
      return;
    }

    setIsSubmittingData(true);
    try {
      const result = await daoApi.submitData({
        sensorType: formData.sensorType,
        dataHash: formData.dataHash,
        metadata: formData.metadata,
        value: formData.value
      });
      
      if (result.success) {
        toast.success('Data submission transaction prepared! Please sign it in your wallet.');
        reset();
        setIsSubmitDialogOpen(false);
        setTimeout(refreshData, 3000);
      } else {
        toast.error(result.message || 'Failed to submit data');
      }
    } catch (error) {
      toast.error('Error submitting data');
    } finally {
      setIsSubmittingData(false);
    }
  };

  const getSensorIcon = (sensorTypeId: number) => {
    switch (sensorTypeId) {
      case 0: return <Thermometer className="h-4 w-4" />;
      case 1: return <Droplets className="h-4 w-4" />;
      case 2: return <Gauge className="h-4 w-4" />;
      case 3: return <Sun className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const getSensorTypeName = (sensorTypeId: number) => {
    const sensorType = data.sensorTypes.find(st => st.sensorTypeId === sensorTypeId);
    return sensorType?.name || 'Unknown';
  };

  const getThresholdInfo = (sensorTypeId: number) => {
    return data.thresholds.find(th => th.sensorTypeId === sensorTypeId);
  };

  const isValueInThreshold = (value: number, sensorTypeId: number) => {
    const threshold = getThresholdInfo(sensorTypeId);
    if (!threshold) return true;
    return value >= threshold.minValue && value <= threshold.maxValue;
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const generateDataHash = () => {
    // Generate a simple hash for demonstration
    const hash = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setValue('dataHash', hash);
  };

  if (data.isLoading) {
    return <DataManagementSkeleton />;
  }

  if (data.error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{data.error}</AlertDescription>
        </Alert>
        <Button onClick={refreshData}>Retry</Button>
      </div>
    );
  }

  const isMember = data.userStatus?.isDaoMember || false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">IoT Data Management</h2>
          <p className="text-muted-foreground">
            Submit and monitor sensor data from IoT devices
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          {isMember && (
            <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Data
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Submit Sensor Data</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmitData)} className="space-y-4">
                  <div>
                    <Label htmlFor="sensorType">Sensor Type</Label>
                    <Select onValueChange={(value) => setValue('sensorType', parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sensor type" />
                      </SelectTrigger>
                      <SelectContent>
                        {data.sensorTypes.map((sensor) => (
                          <SelectItem key={sensor.sensorTypeId} value={sensor.sensorTypeId.toString()}>
                            <div className="flex items-center gap-2">
                                {getSensorIcon(sensor.sensorTypeId)}
                              {sensor.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.sensorType && (
                      <p className="text-sm text-destructive">{errors.sensorType.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="value">Sensor Value</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register('value', { valueAsNumber: true })}
                      placeholder="Enter sensor reading..."
                    />
                    {errors.value && (
                      <p className="text-sm text-destructive">{errors.value.message}</p>
                    )}
                    {sensorTypeValue !== undefined && getThresholdInfo(sensorTypeValue) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Normal range: {getThresholdInfo(sensorTypeValue)?.minValue} - {getThresholdInfo(sensorTypeValue)?.maxValue}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="metadata">Metadata</Label>
                    <Textarea
                      {...register('metadata')}
                      placeholder="Additional information about the sensor reading (location, conditions, etc.)"
                      rows={3}
                    />
                    {errors.metadata && (
                      <p className="text-sm text-destructive">{errors.metadata.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="dataHash">Data Hash</Label>
                    <div className="flex gap-2">
                      <Input
                        {...register('dataHash')}
                        placeholder="Data verification hash..."
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" onClick={generateDataHash}>
                        Generate
                      </Button>
                    </div>
                    {errors.dataHash && (
                      <p className="text-sm text-destructive">{errors.dataHash.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Hash used for data integrity verification
                    </p>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsSubmitDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmittingData}>
                      {isSubmittingData ? 'Submitting...' : 'Submit Data'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Membership Status */}
      {user && !isMember && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You need to be a DAO member to submit sensor data. Contact an administrator to join.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pagination.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sensors</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.sensorTypes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.dataRecords.filter(r => r.triggeredAlert).length}
            </div>
          </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Submissions</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold">
              {data.dataRecords.filter(r => r.submittedBySuiAddress?.toLowerCase() === data.userStatus?.suiAddress?.toLowerCase()).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sensor Types Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        {data.sensorTypes.map((sensorType) => {
          const threshold = getThresholdInfo(sensorType.sensorTypeId);
          const recentRecords = data.dataRecords.filter(r => r.sensorType === sensorType.sensorTypeId).slice(0, 10);
          const averageValue = recentRecords.length > 0 
            ? recentRecords.reduce((sum, r) => sum + r.value, 0) / recentRecords.length 
            : 0;
          const isHealthy = threshold ? averageValue >= threshold.minValue && averageValue <= threshold.maxValue : true;

          return (
            <Card key={sensorType.sensorTypeId}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getSensorIcon(sensorType.sensorTypeId)}
                    <CardTitle className="text-sm">{sensorType.name}</CardTitle>
                  </div>
                  <Badge variant={isHealthy ? "default" : "destructive"}>
                    {isHealthy ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                    {isHealthy ? 'Normal' : 'Alert'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold">
                  {averageValue.toFixed(2)}
                </div>
              <p className="text-xs text-muted-foreground">
                  Average from {recentRecords.length} recent readings
              </p>
                {threshold && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Range: {threshold.minValue} - {threshold.maxValue}</span>
                    </div>
                    <Progress 
                      value={Math.min(100, Math.max(0, ((averageValue - threshold.minValue) / (threshold.maxValue - threshold.minValue)) * 100))} 
                      className="h-1" 
                    />
                  </div>
              )}
            </CardContent>
          </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search records..."
            value={filters.search || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="max-w-sm"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filters.sensorType?.toString() || ''} onValueChange={(value) => setFilters(prev => ({ ...prev, sensorType: value ? parseInt(value) : undefined }))}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Sensor Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Sensors</SelectItem>
              {data.sensorTypes.map((sensor) => (
                <SelectItem key={sensor.sensorTypeId} value={sensor.sensorTypeId.toString()}>
                  {sensor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filters.triggeredAlert?.toString() || ''} onValueChange={(value) => setFilters(prev => ({ ...prev, triggeredAlert: value ? value === 'true' : undefined }))}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Alerts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="true">Alerts Only</SelectItem>
              <SelectItem value="false">Normal Only</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="timestamp">Date</SelectItem>
              <SelectItem value="value">Value</SelectItem>
              <SelectItem value="sensorType">Sensor</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={applyFilters} size="sm">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
    </div>

      {/* Data Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Records</CardTitle>
          <CardDescription>
            Showing {data.dataRecords.length} of {data.pagination.total} records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.dataRecords.length === 0 ? (
            <div className="text-center py-12">
              <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No data records found</h3>
              <p className="text-muted-foreground">
                Start submitting sensor data to see records here!
              </p>
          </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sensor</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.dataRecords.map((record) => (
                    <TableRow key={record.dataRecordObjectId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                  {getSensorIcon(record.sensorType)}
                          <div>
                            <div className="font-medium">{record.sensorTypeName}</div>
                            <div className="text-xs text-muted-foreground">
                              ID: {record.dataSequentialId}
                            </div>
                          </div>
                </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{record.value}</div>
                        {!isValueInThreshold(record.value, record.sensorType) && (
                          <div className="text-xs text-orange-600">Out of range</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {record.triggeredAlert ? (
                          <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Alert
                      </Badge>
                        ) : (
                          <Badge variant="outline">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Normal
                      </Badge>
                    )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {record.submitterName || 'Unknown'}
                  </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {record.submittedBySuiAddress?.slice(0, 8)}...{record.submittedBySuiAddress?.slice(-6)}
                  </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{formatDate(record.timestamp)}</span>
                </div>
                      </TableCell>
                      <TableCell>
              <Button 
                size="sm" 
                          variant="ghost"
                          onClick={() => setSelectedRecord(record)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                View
              </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loadDataRecords(data.pagination.page - 1)}
                  disabled={data.pagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loadDataRecords(data.pagination.page + 1)}
                  disabled={data.pagination.page >= data.pagination.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Details Dialog */}
      {selectedRecord && (
        <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Data Record Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-1">Sensor Type</h4>
                  <div className="flex items-center gap-2">
                    {getSensorIcon(selectedRecord.sensorType)}
                    <span>{selectedRecord.sensorTypeName}</span>
              </div>
            </div>
                <div>
                  <h4 className="font-medium mb-1">Value</h4>
                  <p className="text-2xl font-bold">{selectedRecord.value}</p>
          </div>
                <div>
                  <h4 className="font-medium mb-1">Status</h4>
                  {selectedRecord.triggeredAlert ? (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Alert Triggered
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Normal
                    </Badge>
                  )}
                </div>
                <div>
                  <h4 className="font-medium mb-1">Timestamp</h4>
                  <p>{formatDate(selectedRecord.timestamp)}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Metadata</h4>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm">{selectedRecord.metadata}</p>
                </div>
            </div>

              <div>
                <h4 className="font-medium mb-2">Submitter Information</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Name:</span> {selectedRecord.submitterName || 'Unknown'}</p>
                  <p><span className="text-muted-foreground">Address:</span> <code className="text-xs bg-muted px-1 py-0.5 rounded">{selectedRecord.submittedBySuiAddress}</code></p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Technical Details</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Record ID:</span> {selectedRecord.dataSequentialId}</p>
                  <p><span className="text-muted-foreground">Data Hash:</span> <code className="text-xs bg-muted px-1 py-0.5 rounded">{selectedRecord.dataHash}</code></p>
                  <p><span className="text-muted-foreground">Object ID:</span> <code className="text-xs bg-muted px-1 py-0.5 rounded">{selectedRecord.dataRecordObjectId}</code></p>
                </div>
              </div>

              {selectedRecord.thresholdConfig && (
                <div>
                  <h4 className="font-medium mb-2">Threshold Configuration</h4>
                  <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Valid Range:</span>
                      <span>{selectedRecord.thresholdConfig.minValue} - {selectedRecord.thresholdConfig.maxValue}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{selectedRecord.thresholdConfig.description}</p>
                  </div>
                </div>
              )}

              {selectedRecord.alertProposal && (
                <div>
                  <h4 className="font-medium mb-2">Related Alert Proposal</h4>
                  <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                    <p className="font-medium">{selectedRecord.alertProposal.title}</p>
                    <p className="text-sm text-muted-foreground">Status: {selectedRecord.alertProposal.status}</p>
                    <Button size="sm" variant="outline" className="mt-2 gap-2">
                      <ExternalLink className="h-3 w-3" />
                      View Proposal
                    </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
      )}
    </div>
  );
};

const DataManagementSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>

    <div className="grid gap-4 md:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>

    <div className="grid gap-4 md:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>

    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  </div>
);