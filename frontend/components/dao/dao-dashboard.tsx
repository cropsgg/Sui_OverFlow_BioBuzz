'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { daoApi } from '@/lib/api-client';
import { 
  Users, 
  Wallet, 
  FileText, 
  Database, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Activity,
  Zap,
  BarChart3,
  Calendar
} from 'lucide-react';

interface DAODashboardProps {
  userAddress?: string;
}

interface DashboardData {
  daoInfo: any;
  dashboardStats: any;
  userStatus: any;
  recentProposals: any[];
  recentDataRecords: any[];
  treasuryBalance: number;
  isLoading: boolean;
  error: string | null;
}

export const DAODashboard: React.FC<DAODashboardProps> = ({ userAddress }) => {
  const [data, setData] = useState<DashboardData>({
    daoInfo: null,
    dashboardStats: null,
    userStatus: null,
    recentProposals: [],
    recentDataRecords: [],
    treasuryBalance: 0,
    isLoading: true,
    error: null
  });

  const loadDashboardData = async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      // Load all dashboard data in parallel
      const [
        daoInfoRes,
        dashboardStatsRes,
        userStatusRes,
        proposalsRes,
        dataRecordsRes,
        treasuryRes
      ] = await Promise.all([
        daoApi.getInfo(),
        daoApi.getDashboardStats(),
        userAddress ? daoApi.getUserDaoStatus() : Promise.resolve({ success: false, data: null }),
        daoApi.getProposals({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
        daoApi.getDataRecords({ limit: 10, sortBy: 'timestamp', sortOrder: 'desc' }),
        daoApi.getTreasuryBalance()
      ]);

      if (!daoInfoRes.success) {
        throw new Error(daoInfoRes.message || 'Failed to load DAO info');
      }

      if (!dashboardStatsRes.success) {
        throw new Error(dashboardStatsRes.message || 'Failed to load dashboard stats');
      }

      setData({
        daoInfo: daoInfoRes.data,
        dashboardStats: dashboardStatsRes.data,
        userStatus: userStatusRes.success ? userStatusRes.data : null,
        recentProposals: proposalsRes.success ? proposalsRes.data || [] : [],
        recentDataRecords: dataRecordsRes.success ? dataRecordsRes.data || [] : [],
        treasuryBalance: treasuryRes.success ? treasuryRes.data?.balance || 0 : 0,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to load dashboard data'
      }));
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [userAddress]);

  const refreshData = () => {
    loadDashboardData();
  };

  if (data.isLoading) {
    return <DashboardSkeleton />;
  }

  if (data.error) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {data.error}
          </AlertDescription>
        </Alert>
        <Button onClick={refreshData}>Retry</Button>
      </div>
    );
  }

  const { daoInfo, dashboardStats, userStatus } = data;
  const isAdmin = userStatus?.suiAddress?.toLowerCase() === daoInfo?.adminSuiAddress?.toLowerCase();
  const isMember = userStatus?.isDaoMember || false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">DAO Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to {daoInfo?.name || 'LabShareDAO'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Badge variant="outline" className="bg-primary/10">
              <Users className="h-3 w-3 mr-1" />
              Admin
            </Badge>
          )}
          {isMember && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Member
            </Badge>
          )}
          <Button 
            size="sm" 
            variant="outline" 
            onClick={refreshData}
            className="gap-2"
          >
            <Activity className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Membership Status */}
      {userAddress && !isMember && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>You are not a member of this DAO. Link your Sui address and contact an administrator to join.</span>
            {!userStatus?.hasLinkedAddress && (
              <Button size="sm" className="ml-4">
                Link Address
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.totalMembers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active DAO members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Treasury Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data.treasuryBalance / 1_000_000_000).toFixed(2)} SUI
            </div>
            <p className="text-xs text-muted-foreground">
              Available for proposals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Proposals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.activeProposals || 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting votes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Records</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.totalDataRecords || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total submissions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {isMember && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common actions you can perform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="gap-2">
                <Database className="h-4 w-4" />
                Submit Data
              </Button>
              <Button size="sm" variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                Create Proposal
              </Button>
              <Button size="sm" variant="outline" className="gap-2">
                <Wallet className="h-4 w-4" />
                Add Funds
              </Button>
              {isAdmin && (
                <>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Users className="h-4 w-4" />
                    Add Member
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Update Thresholds
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Alerts & Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Recent Alerts
            </CardTitle>
            <CardDescription>
              Last {dashboardStats?.recentAlerts || 0} alerts in the past week
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardStats?.recentAlerts > 0 ? (
              <div className="space-y-3">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {dashboardStats.recentAlerts} new alerts triggered this week. 
                    Check the Data tab for details.
                  </AlertDescription>
                </Alert>
                <Button size="sm" variant="outline" className="w-full">
                  View All Alerts
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4">
                No recent alerts. All sensor data is within normal thresholds.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Proposals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Recent Proposals
            </CardTitle>
            <CardDescription>
              Latest governance proposals
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentProposals.length > 0 ? (
              <div className="space-y-3">
                {data.recentProposals.slice(0, 3).map((proposal: any) => (
                  <div key={proposal.proposalObjectId} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{proposal.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {proposal.typeLabel}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {proposal.totalVotes} votes
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {proposal.isActive ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <Clock className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          {proposal.executed ? (proposal.approved ? 'Approved' : 'Rejected') : 'Expired'}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                <Button size="sm" variant="outline" className="w-full">
                  View All Proposals
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4">
                No recent proposals. Be the first to create one!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trends and Analytics */}
      {dashboardStats && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Membership Growth */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4" />
                Membership Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>This Month</span>
                  <span>{dashboardStats.membershipGrowth?.length || 0} new</span>
                </div>
                <Progress value={75} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  +25% from last month
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Proposal Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4" />
                Proposal Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Created</span>
                  <span>{dashboardStats.proposalActivity?.reduce((sum: number, item: any) => sum + item.created, 0) || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Executed</span>
                  <span>{dashboardStats.proposalActivity?.reduce((sum: number, item: any) => sum + item.executed, 0) || 0}</span>
                </div>
                <Progress value={60} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Data Submissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Database className="h-4 w-4" />
                Data Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Submissions</span>
                  <span>{dashboardStats.dataSubmissionTrends?.reduce((sum: number, item: any) => sum + item.submissions, 0) || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Alerts</span>
                  <span className="text-orange-600">{dashboardStats.dataSubmissionTrends?.reduce((sum: number, item: any) => sum + item.alerts, 0) || 0}</span>
                </div>
                <Progress value={40} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-8 w-24" />
    </div>

    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32 mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>

    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24" />
          ))}
        </div>
      </CardContent>
    </Card>

    <div className="grid gap-6 lg:grid-cols-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
); 