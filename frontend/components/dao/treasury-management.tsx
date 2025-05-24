'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { daoApi } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { 
  Wallet, 
  Plus, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Copy,
  DollarSign,
  Target,
  Calendar,
  Activity,
  TrendingDown
} from 'lucide-react';
import { toast } from 'sonner';

const addFundsSchema = z.object({
  amount: z.number().min(0.001, 'Amount must be at least 0.001 SUI'),
});

type AddFundsForm = z.infer<typeof addFundsSchema>;

interface TreasuryManagementProps {
  userAddress?: string;
}

interface TreasuryData {
  balance: number;
  userStatus: any;
  daoInfo: any;
  isLoading: boolean;
  error: string | null;
}

interface FundingGoal {
  target: number;
  current: number;
  description: string;
  deadline: Date;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'proposal_funding';
  amount: number;
  from?: string;
  to?: string;
  description: string;
  timestamp: Date;
  txHash?: string;
  status: 'pending' | 'completed' | 'failed';
}

export const TreasuryManagement: React.FC<TreasuryManagementProps> = ({ userAddress }) => {
  const { user } = useAuth();
  const [isAddingFunds, setIsAddingFunds] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const [data, setData] = useState<TreasuryData>({
    balance: 0,
    userStatus: null,
    daoInfo: null,
    isLoading: true,
    error: null
  });

  // Mock data for funding goals and transactions (in a real app, these would come from the API)
  const [fundingGoals] = useState<FundingGoal[]>([
    {
      target: 1000,
      current: 450,
      description: "Research Equipment Fund",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    },
    {
      target: 500,
      current: 275,
      description: "Community Events Budget",
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
    }
  ]);

  const [recentTransactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'deposit',
      amount: 100,
      from: '0x1234...5678',
      description: 'Member contribution',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      txHash: '0xabcd...efgh',
      status: 'completed'
    },
    {
      id: '2',
      type: 'proposal_funding',
      amount: 50,
      to: '0x9876...5432',
      description: 'Research grant - Proposal #15',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      txHash: '0xijkl...mnop',
      status: 'completed'
    },
    {
      id: '3',
      type: 'deposit',
      amount: 25,
      from: '0x5555...7777',
      description: 'Member contribution',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      txHash: '0xqrst...uvwx',
      status: 'completed'
    }
  ]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<AddFundsForm>({
    resolver: zodResolver(addFundsSchema),
  });

  const loadTreasuryData = async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      const [treasuryRes, userStatusRes, daoInfoRes] = await Promise.all([
        daoApi.getTreasuryBalance(),
        user ? daoApi.getUserDaoStatus() : Promise.resolve({ success: false, data: null }),
        daoApi.getInfo()
      ]);

      setData({
        balance: treasuryRes.success ? treasuryRes.data?.balance || 0 : 0,
        userStatus: userStatusRes.success ? userStatusRes.data : null,
        daoInfo: daoInfoRes.success ? daoInfoRes.data : null,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      console.error('Error loading treasury data:', error);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to load treasury data'
      }));
    }
  };

  useEffect(() => {
    loadTreasuryData();
  }, [user]);

  const refreshTreasuryData = () => {
    loadTreasuryData();
  };

  const onAddFunds = async (formData: AddFundsForm) => {
    if (!data.userStatus?.isDaoMember) {
      toast.error('Only DAO members can add funds');
      return;
    }

    setIsAddingFunds(true);
    try {
      const result = await daoApi.addFunds(formData.amount);
      
      if (result.success) {
        toast.success('Add funds transaction prepared! Please sign it in your wallet.');
        reset();
        setIsAddDialogOpen(false);
        setTimeout(refreshTreasuryData, 3000);
      } else {
        toast.error(result.message || 'Failed to add funds');
      }
    } catch (error) {
      toast.error('Error adding funds');
    } finally {
      setIsAddingFunds(false);
    }
  };

  const copyTransactionHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast.success('Transaction hash copied to clipboard');
  };

  const formatAmount = (amount: number) => {
    if (amount >= 1_000_000_000) {
      return `${(amount / 1_000_000_000).toFixed(4)} SUI`;
    }
    return `${amount.toFixed(4)} SUI`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
      case 'withdrawal':
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      case 'proposal_funding':
        return <Target className="h-4 w-4 text-blue-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (!user) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Please sign in to access treasury management.
        </AlertDescription>
      </Alert>
    );
  }

  if (data.isLoading) {
    return <TreasurySkeleton />;
  }

  if (data.error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{data.error}</AlertDescription>
        </Alert>
        <Button onClick={refreshTreasuryData}>Retry</Button>
      </div>
    );
  }

  const isMember = data.userStatus?.isDaoMember || false;
  const isAdmin = data.userStatus?.suiAddress?.toLowerCase() === data.daoInfo?.adminSuiAddress?.toLowerCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Treasury Management</h2>
          <p className="text-muted-foreground">
            Manage DAO funds and track financial activities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshTreasuryData}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          {isMember && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Funds
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Funds to Treasury</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onAddFunds)} className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Amount (SUI)</Label>
                    <Input
                      type="number"
                      step="0.001"
                      {...register('amount', { valueAsNumber: true })}
                      placeholder="0.1"
                    />
                    {errors.amount && (
                      <p className="text-sm text-destructive">{errors.amount.message}</p>
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
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isAddingFunds}>
                      {isAddingFunds ? 'Adding...' : 'Add Funds'}
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
            You need to be a DAO member to contribute funds. Contact an administrator to join.
          </AlertDescription>
        </Alert>
      )}

      {/* Treasury Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Treasury Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">
                {formatAmount(data.balance)}
              </div>
              <p className="text-muted-foreground">Available for DAO operations</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.daoInfo?.memberCount || 0}</div>
            <p className="text-xs text-muted-foreground">Contributing members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Badge variant="outline" className="bg-primary/10">
                  Admin
                </Badge>
              )}
              {isMember && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Member
                </Badge>
              )}
              {!isMember && !isAdmin && (
                <Badge variant="outline">
                  Visitor
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="goals" className="gap-2">
            <Target className="h-4 w-4" />
            Funding Goals
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-2">
            <Clock className="h-4 w-4" />
            Transactions
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Treasury Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Treasury Statistics</CardTitle>
                <CardDescription>Financial metrics and trends</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-700">
                      {recentTransactions.filter(t => t.type === 'deposit').length}
                    </div>
                    <div className="text-sm text-green-600">Total Deposits</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-700">
                      {recentTransactions.filter(t => t.type === 'proposal_funding').length}
                    </div>
                    <div className="text-sm text-blue-600">Funded Proposals</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Treasury Utilization</span>
                    <span>60%</span>
                  </div>
                  <Progress value={60} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Percentage of funds allocated to active proposals
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* How to Contribute */}
            <Card>
              <CardHeader>
                <CardTitle>How to Contribute</CardTitle>
                <CardDescription>Support the DAO's mission</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium">1</span>
                    </div>
                    <div>
                      <p className="font-medium">Join as a Member</p>
                      <p className="text-sm text-muted-foreground">
                        Connect your wallet and become a DAO member
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium">2</span>
                    </div>
                    <div>
                      <p className="font-medium">Add Funds</p>
                      <p className="text-sm text-muted-foreground">
                        Contribute SUI tokens to support DAO operations
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium">3</span>
                    </div>
                    <div>
                      <p className="font-medium">Vote on Funding</p>
                      <p className="text-sm text-muted-foreground">
                        Participate in governance decisions about fund allocation
                      </p>
                    </div>
                  </div>
                </div>

                {isMember ? (
                  <Button className="w-full gap-2" onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Contribute Now
                  </Button>
                ) : (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      You must be a DAO member to contribute funds.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Funding Goals Tab */}
        <TabsContent value="goals" className="space-y-6">
          <div className="grid gap-6">
            {fundingGoals.map((goal, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{goal.description}</CardTitle>
                      <CardDescription>
                        Target: {goal.target} SUI • Deadline: {formatDate(goal.deadline)}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <Target className="h-3 w-3" />
                      {Math.round((goal.current / goal.target) * 100)}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{goal.current} / {goal.target} SUI</span>
                    </div>
                    <Progress value={(goal.current / goal.target) * 100} className="h-3" />
                    
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Raised: {goal.current} SUI</span>
                      <span>Remaining: {goal.target - goal.current} SUI</span>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        Contribute to Goal
                      </Button>
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest treasury activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(transaction.type)}
                      <div>
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {formatDate(transaction.timestamp)}
                          {transaction.txHash && (
                            <>
                              <span>•</span>
                              <button
                                onClick={() => copyTransactionHash(transaction.txHash!)}
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                              >
                                <Copy className="h-3 w-3" />
                                {transaction.txHash.slice(0, 8)}...
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`font-medium ${
                        transaction.type === 'deposit' ? 'text-green-600' : 
                        transaction.type === 'withdrawal' ? 'text-red-600' : 
                        'text-blue-600'
                      }`}>
                        {transaction.type === 'deposit' ? '+' : '-'}{transaction.amount} SUI
                      </div>
                      <div className="mt-1">
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {recentTransactions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No transactions yet</p>
                  <p className="text-sm">Transaction history will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const TreasurySkeleton = () => (
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