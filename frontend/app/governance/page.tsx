"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from "framer-motion";
import { ProposalsManagement } from '@/components/dao/proposals-management';
import { DataManagement } from '@/components/dao/data-management';
import { daoApi } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { 
  Vote, 
  Database, 
  TrendingUp, 
  Users, 
  Wallet,
  FileText,
  Activity,
  CheckCircle,
  AlertTriangle,
  Target,
  Zap,
  Clock,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

interface GovernanceStats {
  totalProposals: number;
  activeProposals: number;
  totalMembers: number;
  treasuryBalance: number;
  totalDataRecords: number;
  recentAlerts: number;
}

export default function GovernancePage() {
  const { user } = useAuth();
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<any>(null);
  const [stats, setStats] = useState<GovernanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  // Load user status and stats
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [userStatusRes, daoInfoRes, dashboardStatsRes] = await Promise.all([
        user ? daoApi.getUserDaoStatus() : Promise.resolve({ success: false, data: null }),
        daoApi.getInfo(),
        daoApi.getDashboardStats()
      ]);

      if (userStatusRes.success) {
        setUserStatus(userStatusRes.data);
        setUserAddress(userStatusRes.data?.suiAddress);
      }

      if (daoInfoRes.success && dashboardStatsRes.success) {
        setStats({
          totalProposals: daoInfoRes.data.totalProposals || 0,
          activeProposals: dashboardStatsRes.data.activeProposals || 0,
          totalMembers: daoInfoRes.data.memberCount || 0,
          treasuryBalance: dashboardStatsRes.data.treasuryBalance || 0,
          totalDataRecords: daoInfoRes.data.totalDataRecords || 0,
          recentAlerts: dashboardStatsRes.data.recentAlerts || 0
        });
      }
    } catch (error) {
      console.error('Error loading governance data:', error);
      toast.error('Failed to load governance data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  if (isLoading) {
    return <GovernanceSkeleton />;
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
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Vote className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">DAO Governance</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Participate in decentralized decision-making. Create proposals, vote on initiatives, 
          and help shape the future of collaborative research.
        </p>
        
        {!isAuthenticated && (
          <Alert className="max-w-2xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please login to participate in DAO governance.
            </AlertDescription>
          </Alert>
        )}

        {isAuthenticated && !isMember && (
          <Alert className="max-w-2xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You need to be a DAO member to create proposals and vote. 
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
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-6"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProposals}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Votes</CardTitle>
              <Vote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeProposals}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">DAO Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMembers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Treasury</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.treasuryBalance.toFixed(2)} SUI</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Data Records</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDataRecords}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.recentAlerts}</div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid gap-4 md:grid-cols-3"
      >
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedTab('proposals')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Vote className="h-5 w-5" />
              Governance Proposals
            </CardTitle>
            <CardDescription>
              Create and vote on DAO proposals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {stats?.activeProposals || 0} active proposals
              </span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedTab('data')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Management
            </CardTitle>
            <CardDescription>
              Submit and manage IoT sensor data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {stats?.totalDataRecords || 0} data records
              </span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Analytics Dashboard
            </CardTitle>
            <CardDescription>
              View detailed DAO analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" asChild>
                <a href="/dashboard">View Dashboard</a>
              </Button>
              <ArrowRight className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Tabs */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="proposals" className="gap-2">
              <Vote className="h-4 w-4" />
              Proposals
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <Database className="h-4 w-4" />
              Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Governance Health */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Governance Health
                  </CardTitle>
                  <CardDescription>
                    Overall governance participation metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Voter Participation</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Active
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Average Turnout</span>
                      <span>72%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Proposal Success Rate</span>
                      <span>68%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Latest governance actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-2 border rounded">
                      <Vote className="h-4 w-4 text-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">New proposal created</p>
                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 border rounded">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Proposal #12 executed</p>
                        <p className="text-xs text-muted-foreground">1 day ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 border rounded">
                      <Database className="h-4 w-4 text-purple-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Data alert triggered</p>
                        <p className="text-xs text-muted-foreground">2 days ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="proposals" className="mt-6">
            <ProposalsManagement userAddress={userAddress || undefined} />
          </TabsContent>

          <TabsContent value="data" className="mt-6">
            <DataManagement userAddress={userAddress || undefined} />
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
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <Zap className="h-5 w-5" />
                Ready to Participate?
              </CardTitle>
              <CardDescription>
                Your voice matters in shaping the future of decentralized research
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => setSelectedTab('proposals')}>
                  <Vote className="h-4 w-4 mr-2" />
                  View Proposals
                </Button>
                <Button variant="outline" onClick={() => setSelectedTab('data')}>
                  <Database className="h-4 w-4 mr-2" />
                  Submit Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

const GovernanceSkeleton = () => (
  <div className="container mx-auto py-8 space-y-8">
    <div className="text-center space-y-4">
      <div className="h-10 w-64 bg-muted rounded mx-auto" />
      <div className="h-6 w-96 bg-muted rounded mx-auto" />
    </div>
    
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="h-4 w-24 bg-muted rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 bg-muted rounded" />
          </CardContent>
        </Card>
      ))}
    </div>

    <div className="grid gap-4 md:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="h-6 w-32 bg-muted rounded" />
            <div className="h-4 w-48 bg-muted rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-4 w-24 bg-muted rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);
