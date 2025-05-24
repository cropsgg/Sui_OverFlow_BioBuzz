'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLabShareDAOState } from '@/hooks/use-labshare-dao';
import { DEFAULT_SENSOR_TYPES } from '@/types/labshare-dao';
import { 
  Users, 
  Plus, 
  TrendingUp, 
  Settings, 
  AlertTriangle, 
  CheckCircle,
  Wallet,
  Shield,
  UserPlus,
  Sliders
} from 'lucide-react';
import { toast } from 'sonner';

const addMemberSchema = z.object({
  address: z.string().min(40, 'Address must be a valid Sui address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

const updateThresholdSchema = z.object({
  sensor_type: z.number().min(0).max(3),
  min_value: z.number().min(0),
  max_value: z.number().min(0),
  description: z.string().min(5, 'Description must be at least 5 characters'),
});

const addFundsSchema = z.object({
  amount: z.number().min(0.001, 'Amount must be at least 0.001 SUI'),
});

type AddMemberForm = z.infer<typeof addMemberSchema>;
type UpdateThresholdForm = z.infer<typeof updateThresholdSchema>;
type AddFundsForm = z.infer<typeof addFundsSchema>;

interface AdminPanelProps {
  userAddress?: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ userAddress }) => {
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isUpdatingThreshold, setIsUpdatingThreshold] = useState(false);
  const [isAddingFunds, setIsAddingFunds] = useState(false);

  const {
    daoInfo,
    treasury,
    memberManagement,
    sensorManagement,
    isAdmin,
    canManageMembers,
    canUpdateThresholds
  } = useLabShareDAOState(userAddress);

  const memberForm = useForm<AddMemberForm>({
    resolver: zodResolver(addMemberSchema),
  });

  const thresholdForm = useForm<UpdateThresholdForm>({
    resolver: zodResolver(updateThresholdSchema),
  });

  const fundsForm = useForm<AddFundsForm>({
    resolver: zodResolver(addFundsSchema),
  });

  const onAddMember = async (data: AddMemberForm) => {
    if (!canManageMembers) {
      toast.error('You do not have permission to add members');
      return;
    }

    setIsAddingMember(true);
    try {
      const result = await memberManagement.addMember(data.address, data.name);
      
      if (result.success) {
        toast.success('Member added successfully!');
        memberForm.reset();
      } else {
        toast.error(result.error || 'Failed to add member');
      }
    } catch (error) {
      toast.error('Error adding member');
    } finally {
      setIsAddingMember(false);
    }
  };

  const onUpdateThreshold = async (data: UpdateThresholdForm) => {
    if (!canUpdateThresholds) {
      toast.error('You do not have permission to update thresholds');
      return;
    }

    if (data.min_value >= data.max_value) {
      toast.error('Minimum value must be less than maximum value');
      return;
    }

    setIsUpdatingThreshold(true);
    try {
      const result = await sensorManagement.updateThreshold(
        data.sensor_type,
        data.min_value,
        data.max_value,
        data.description
      );
      
      if (result.success) {
        toast.success('Threshold updated successfully!');
        thresholdForm.reset();
      } else {
        toast.error(result.error || 'Failed to update threshold');
      }
    } catch (error) {
      toast.error('Error updating threshold');
    } finally {
      setIsUpdatingThreshold(false);
    }
  };

  const onAddFunds = async (data: AddFundsForm) => {
    setIsAddingFunds(true);
    try {
      const amountInMist = Math.floor(data.amount * 1_000_000_000); // Convert SUI to MIST
      const result = await treasury.addFunds(amountInMist);
      
      if (result.success) {
        toast.success('Funds added successfully!');
        fundsForm.reset();
      } else {
        toast.error(result.error || 'Failed to add funds');
      }
    } catch (error) {
      toast.error('Error adding funds');
    } finally {
      setIsAddingFunds(false);
    }
  };

  if (!userAddress) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Please connect your wallet to access the admin panel.
        </AlertDescription>
      </Alert>
    );
  }

  if (!isAdmin) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You do not have administrator privileges. Only the DAO admin can access this panel.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground">
            Manage DAO settings, members, and configurations
          </p>
        </div>
        <Badge variant="outline" className="bg-primary/10">
          Administrator
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Treasury Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {treasury.loading ? 'Loading...' : `${(treasury.balance / 1_000_000_000).toFixed(2)} SUI`}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {daoInfo.daoInfo?.member_count || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configured Sensors</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {DEFAULT_SENSOR_TYPES.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Tabs */}
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="thresholds" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Thresholds
          </TabsTrigger>
          <TabsTrigger value="treasury" className="gap-2">
            <Wallet className="h-4 w-4" />
            Treasury
          </TabsTrigger>
        </TabsList>

        {/* Members Management */}
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Member Management</CardTitle>
                  <CardDescription>
                    Add new members to the DAO
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <UserPlus className="h-4 w-4" />
                      Add Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Member</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={memberForm.handleSubmit(onAddMember)} className="space-y-4">
                      <div>
                        <Label htmlFor="address">Wallet Address</Label>
                        <Input
                          id="address"
                          {...memberForm.register('address')}
                          placeholder="0x..."
                        />
                        {memberForm.formState.errors.address && (
                          <p className="text-sm text-red-600 mt-1">
                            {memberForm.formState.errors.address.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="name">Display Name</Label>
                        <Input
                          id="name"
                          {...memberForm.register('name')}
                          placeholder="Enter member name..."
                        />
                        {memberForm.formState.errors.name && (
                          <p className="text-sm text-red-600 mt-1">
                            {memberForm.formState.errors.name.message}
                          </p>
                        )}
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => memberForm.reset()}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isAddingMember}>
                          {isAddingMember ? 'Adding...' : 'Add Member'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Users className="h-4 w-4" />
                  <AlertDescription>
                    Only administrators can add new members. New members will have default voting power of 10.
                  </AlertDescription>
                </Alert>
                
                <div className="text-sm text-muted-foreground">
                  <p>Current member count: {daoInfo.daoInfo?.member_count || 0}</p>
                  <p>Admin address: {daoInfo.daoInfo?.admin || 'Loading...'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Threshold Management */}
        <TabsContent value="thresholds" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sensor Thresholds</CardTitle>
                  <CardDescription>
                    Configure alert thresholds for each sensor type
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Sliders className="h-4 w-4" />
                      Update Threshold
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update Sensor Threshold</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={thresholdForm.handleSubmit(onUpdateThreshold)} className="space-y-4">
                      <div>
                        <Label htmlFor="sensor_type">Sensor Type</Label>
                        <Select onValueChange={(value) => thresholdForm.setValue('sensor_type', parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select sensor type" />
                          </SelectTrigger>
                          <SelectContent>
                            {DEFAULT_SENSOR_TYPES.map((sensor) => (
                              <SelectItem key={sensor.id} value={sensor.id.toString()}>
                                {sensor.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {thresholdForm.formState.errors.sensor_type && (
                          <p className="text-sm text-red-600 mt-1">
                            {thresholdForm.formState.errors.sensor_type.message}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="min_value">Minimum Value</Label>
                          <Input
                            id="min_value"
                            type="number"
                            step="0.01"
                            {...thresholdForm.register('min_value', { valueAsNumber: true })}
                            placeholder="0"
                          />
                          {thresholdForm.formState.errors.min_value && (
                            <p className="text-sm text-red-600 mt-1">
                              {thresholdForm.formState.errors.min_value.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="max_value">Maximum Value</Label>
                          <Input
                            id="max_value"
                            type="number"
                            step="0.01"
                            {...thresholdForm.register('max_value', { valueAsNumber: true })}
                            placeholder="100"
                          />
                          {thresholdForm.formState.errors.max_value && (
                            <p className="text-sm text-red-600 mt-1">
                              {thresholdForm.formState.errors.max_value.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          {...thresholdForm.register('description')}
                          placeholder="Describe the threshold purpose..."
                          rows={3}
                        />
                        {thresholdForm.formState.errors.description && (
                          <p className="text-sm text-red-600 mt-1">
                            {thresholdForm.formState.errors.description.message}
                          </p>
                        )}
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => thresholdForm.reset()}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isUpdatingThreshold}>
                          {isUpdatingThreshold ? 'Updating...' : 'Update Threshold'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    Thresholds determine when sensor data triggers alerts. When exceeded, automatic proposals are created.
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4 md:grid-cols-2">
                  {DEFAULT_SENSOR_TYPES.map((sensor) => (
                    <Card key={sensor.id}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">{sensor.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">
                          Current thresholds: Contact with smart contract to view configured values
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Treasury Management */}
        <TabsContent value="treasury" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Treasury Management</CardTitle>
                  <CardDescription>
                    Manage DAO funds and treasury operations
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Funds
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Funds to Treasury</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={fundsForm.handleSubmit(onAddFunds)} className="space-y-4">
                      <div>
                        <Label htmlFor="amount">Amount (SUI)</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.001"
                          {...fundsForm.register('amount', { valueAsNumber: true })}
                          placeholder="0.1"
                        />
                        {fundsForm.formState.errors.amount && (
                          <p className="text-sm text-red-600 mt-1">
                            {fundsForm.formState.errors.amount.message}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Minimum: 0.001 SUI
                        </p>
                      </div>

                      <Alert>
                        <Wallet className="h-4 w-4" />
                        <AlertDescription>
                          Funds will be transferred from your wallet to the DAO treasury.
                        </AlertDescription>
                      </Alert>

                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => fundsForm.reset()}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isAddingFunds}>
                          {isAddingFunds ? 'Adding...' : 'Add Funds'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-6 bg-muted/50 rounded-lg">
                  <Wallet className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-2xl font-bold mb-1">
                    {treasury.loading ? 'Loading...' : `${(treasury.balance / 1_000_000_000).toFixed(4)} SUI`}
                  </div>
                  <p className="text-sm text-muted-foreground">Current Treasury Balance</p>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Treasury funds can be used for approved proposals and DAO operations.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 