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
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { daoApi } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Vote, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Calendar,
  User,
  TrendingUp,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Play,
  Eye,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { toast } from 'sonner';

const createProposalSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description must be less than 2000 characters'),
  proposalType: z.number().min(0).max(2, 'Invalid proposal type'),
});

type CreateProposalForm = z.infer<typeof createProposalSchema>;

interface ProposalsManagementProps {
  userAddress?: string;
}

interface ProposalData {
  proposals: any[];
  userStatus: any;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
}

interface Filters {
  type?: number;
  status?: string;
  search?: string;
}

export const ProposalsManagement: React.FC<ProposalsManagementProps> = ({ userAddress }) => {
  const { user } = useAuth();
  const [isCreatingProposal, setIsCreatingProposal] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [votingProposal, setVotingProposal] = useState<string | null>(null);
  const [executingProposal, setExecutingProposal] = useState<string | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [data, setData] = useState<ProposalData>({
    proposals: [],
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
    setValue
  } = useForm<CreateProposalForm>({
    resolver: zodResolver(createProposalSchema),
    defaultValues: {
      proposalType: 0
    }
  });

  const loadProposals = async (page = 1, appliedFilters = filters) => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      const [proposalsRes, userStatusRes] = await Promise.all([
        daoApi.getProposals({ 
          page, 
          limit: 20,
          type: appliedFilters.type,
          status: appliedFilters.status,
          sortBy,
          sortOrder
        }),
        user ? daoApi.getUserDaoStatus() : Promise.resolve({ success: false, data: null })
      ]);

      if (!proposalsRes.success) {
        throw new Error(proposalsRes.message || 'Failed to load proposals');
      }

      setData({
        proposals: proposalsRes.data || [],
        userStatus: userStatusRes.success ? userStatusRes.data : null,
        isLoading: false,
        error: null,
        pagination: proposalsRes.pagination || { page: 1, totalPages: 1, total: 0 }
      });
    } catch (error: any) {
      console.error('Error loading proposals:', error);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to load proposals'
      }));
    }
  };

  useEffect(() => {
    loadProposals();
  }, [user, sortBy, sortOrder]);

  const refreshProposals = () => {
    loadProposals(data.pagination.page);
  };

  const applyFilters = () => {
    loadProposals(1, filters);
  };

  const onCreateProposal = async (formData: CreateProposalForm) => {
    if (!data.userStatus?.isDaoMember) {
      toast.error('Only DAO members can create proposals');
      return;
    }

    setIsCreatingProposal(true);
    try {
      const result = await daoApi.createProposal({
        title: formData.title,
        description: formData.description,
        proposalType: formData.proposalType
      });
      
      if (result.success) {
        toast.success('Proposal creation transaction prepared! Please sign it in your wallet.');
        reset();
        setIsCreateDialogOpen(false);
        setTimeout(refreshProposals, 3000);
      } else {
        toast.error(result.message || 'Failed to create proposal');
      }
    } catch (error) {
      toast.error('Error creating proposal');
    } finally {
      setIsCreatingProposal(false);
    }
  };

  const handleVote = async (proposalId: string, vote: boolean) => {
    if (!data.userStatus?.isDaoMember) {
      toast.error('Only DAO members can vote');
      return;
    }

    setVotingProposal(proposalId);
    try {
      const result = await daoApi.vote(proposalId, vote);
      
      if (result.success) {
        toast.success(`Vote ${vote ? 'Yes' : 'No'} transaction prepared! Please sign it in your wallet.`);
        setTimeout(refreshProposals, 3000);
      } else {
        toast.error(result.message || 'Failed to vote');
      }
    } catch (error) {
      toast.error('Error voting on proposal');
    } finally {
      setVotingProposal(null);
    }
  };

  const handleExecuteProposal = async (proposalId: string) => {
    if (!data.userStatus?.isDaoMember) {
      toast.error('Only DAO members can execute proposals');
      return;
    }

    setExecutingProposal(proposalId);
    try {
      const result = await daoApi.executeProposal(proposalId);
      
      if (result.success) {
        toast.success('Execute proposal transaction prepared! Please sign it in your wallet.');
        setTimeout(refreshProposals, 3000);
      } else {
        toast.error(result.message || 'Failed to execute proposal');
      }
    } catch (error) {
      toast.error('Error executing proposal');
    } finally {
      setExecutingProposal(null);
    }
  };

  const getProposalStatusBadge = (proposal: any) => {
    if (proposal.executed) {
      return proposal.approved ? (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      ) : (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    }
    
    if (proposal.isActive) {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          <Clock className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Expired
      </Badge>
    );
  };

  const getVotingProgress = (proposal: any) => {
    const total = proposal.totalVotes;
    if (total === 0) return 0;
    return (proposal.yesVotes / total) * 100;
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

  if (data.isLoading) {
    return <ProposalsSkeleton />;
  }

  if (data.error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{data.error}</AlertDescription>
        </Alert>
        <Button onClick={refreshProposals}>Retry</Button>
      </div>
    );
  }

  const isMember = data.userStatus?.isDaoMember || false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Governance Proposals</h2>
          <p className="text-muted-foreground">
            Create and vote on DAO proposals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshProposals}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          {isMember && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Proposal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Proposal</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onCreateProposal)} className="space-y-4">
                  <div>
                    <Label htmlFor="proposalType">Proposal Type</Label>
                    <Select onValueChange={(value) => setValue('proposalType', parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select proposal type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">General</SelectItem>
                        <SelectItem value="2">Configuration</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.proposalType && (
                      <p className="text-sm text-destructive">{errors.proposalType.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      {...register('title')}
                      placeholder="Enter proposal title..."
                    />
                    {errors.title && (
                      <p className="text-sm text-destructive">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      {...register('description')}
                      placeholder="Describe your proposal in detail..."
                      rows={6}
                    />
                    {errors.description && (
                      <p className="text-sm text-destructive">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isCreatingProposal}>
                      {isCreatingProposal ? 'Creating...' : 'Create Proposal'}
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
            You need to be a DAO member to create proposals and vote. Contact an administrator to join.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pagination.total}</div>
          </CardContent>
        </Card>
        
      <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Proposals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.proposals.filter(p => p.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.proposals.filter(p => p.executed && p.approved).length}

          </div>
        </CardContent>
      </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Participation</CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.proposals.filter(p => p.userVote !== null && p.userVote !== undefined).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search proposals..."
            value={filters.search || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="max-w-sm"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filters.type?.toString() || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value === 'all' ? undefined : parseInt(value) }))}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="0">General</SelectItem>
              <SelectItem value="1">Alert</SelectItem>
              <SelectItem value="2">Configuration</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filters.status || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value }))}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="executed_approved">Approved</SelectItem>
              <SelectItem value="executed_rejected">Rejected</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Created</SelectItem>
              <SelectItem value="votingEndTime">Deadline</SelectItem>
              <SelectItem value="totalVotes">Votes</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={applyFilters} size="sm">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Proposals List */}
          <ProposalsList
        proposals={data.proposals}
            userAddress={userAddress}
            onVote={handleVote}
            onExecute={handleExecuteProposal}
            onViewDetails={setSelectedProposal}
            votingProposal={votingProposal}
            executingProposal={executingProposal}
        isMember={isMember}
            getVotingProgress={getVotingProgress}
            getStatusBadge={getProposalStatusBadge}
          />

      {/* Pagination */}
      {data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => loadProposals(data.pagination.page - 1)}
              disabled={data.pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => loadProposals(data.pagination.page + 1)}
              disabled={data.pagination.page >= data.pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Proposal Details Dialog */}
      {selectedProposal && (
        <ProposalDetailsDialog
          proposal={selectedProposal}
          onClose={() => setSelectedProposal(null)}
          getStatusBadge={getProposalStatusBadge}
          getVotingProgress={getVotingProgress}
        />
      )}
    </div>
  );
};

interface ProposalsListProps {
  proposals: any[];
  userAddress?: string;
  onVote: (proposalId: string, vote: boolean) => void;
  onExecute: (proposalId: string) => void;
  onViewDetails: (proposal: any) => void;
  votingProposal: string | null;
  executingProposal: string | null;
  isMember: boolean;
  getVotingProgress: (proposal: any) => number;
  getStatusBadge: (proposal: any) => React.ReactNode;
}

const ProposalsList: React.FC<ProposalsListProps> = ({
  proposals,
  userAddress,
  onVote,
  onExecute,
  onViewDetails,
  votingProposal,
  executingProposal,
  isMember,
  getVotingProgress,
  getStatusBadge
}) => {
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (proposals.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No proposals found</h3>
          <p className="text-muted-foreground">
            Be the first to create a proposal for the DAO!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {proposals.map((proposal) => (
        <Card key={proposal.proposalObjectId} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{proposal.typeLabel}</Badge>
                  {getStatusBadge(proposal)}
                  <span className="text-sm text-muted-foreground">
                    #{proposal.proposalSequentialId}
                  </span>
                </div>
                <CardTitle className="text-lg mb-2">{proposal.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {proposal.description}
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {proposal.proposerName || 'Unknown'}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Created: {formatDate(proposal.createdAt)}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Ends: {formatDate(proposal.votingEndTime)}
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
              {/* Voting Progress */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                  <span>Voting Progress</span>
                <span>{proposal.totalVotes} votes</span>
                </div>
                <Progress value={getVotingProgress(proposal)} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Yes: {proposal.yesVotes}</span>
                <span>No: {proposal.noVotes}</span>
                </div>
              </div>

            {/* User Vote Status */}
            {proposal.userVote !== null && proposal.userVote !== undefined && (
              <div className="mb-4">
                <Badge variant={proposal.userVote ? "default" : "secondary"}>
                  You voted: {proposal.userVote ? 'Yes' : 'No'}
                </Badge>
              </div>
            )}

              {/* Actions */}
            <div className="flex items-center justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onViewDetails(proposal)}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </Button>

              <div className="flex gap-2">
                {/* Voting Buttons */}
                {proposal.isActive && isMember && proposal.canVote && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onVote(proposal.proposalObjectId, true)}
                      disabled={votingProposal === proposal.proposalObjectId}
                      className="gap-2 text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      {votingProposal === proposal.proposalObjectId ? 'Voting...' : 'Yes'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onVote(proposal.proposalObjectId, false)}
                      disabled={votingProposal === proposal.proposalObjectId}
                      className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <ThumbsDown className="h-4 w-4" />
                      {votingProposal === proposal.proposalObjectId ? 'Voting...' : 'No'}
                    </Button>
                  </>
                )}

                {/* Execute Button */}
                {!proposal.executed && !proposal.isActive && isMember && (
                  <Button
                    size="sm"
                    onClick={() => onExecute(proposal.proposalObjectId)}
                    disabled={executingProposal === proposal.proposalObjectId}
                    className="gap-2"
                  >
                    <Play className="h-4 w-4" />
                    {executingProposal === proposal.proposalObjectId ? 'Executing...' : 'Execute'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

interface ProposalDetailsDialogProps {
  proposal: any;
  onClose: () => void;
  getStatusBadge: (proposal: any) => React.ReactNode;
  getVotingProgress: (proposal: any) => number;
}

const ProposalDetailsDialog: React.FC<ProposalDetailsDialogProps> = ({
  proposal,
  onClose,
  getStatusBadge,
  getVotingProgress
}) => {
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl mb-2">{proposal.title}</DialogTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{proposal.typeLabel}</Badge>
                {getStatusBadge(proposal)}
                <span className="text-sm text-muted-foreground">
            Proposal #{proposal.proposalSequentialId}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Proposal Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
              <h4 className="font-medium mb-1">Proposer</h4>
              <p className="text-muted-foreground">{proposal.proposerName || 'Unknown'}</p>
              </div>
              <div>
              <h4 className="font-medium mb-1">Created</h4>
              <p className="text-muted-foreground">{formatDate(proposal.createdAt)}</p>
              </div>
              <div>
              <h4 className="font-medium mb-1">Voting Ends</h4>
              <p className="text-muted-foreground">{formatDate(proposal.votingEndTime)}</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Total Votes</h4>
              <p className="text-muted-foreground">{proposal.totalVotes}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-medium mb-2">Description</h4>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="whitespace-pre-wrap">{proposal.description}</p>
            </div>
          </div>

          {/* Voting Results */}
          <div>
            <h4 className="font-medium mb-3">Voting Results</h4>
          <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{proposal.totalVotes} total votes</span>
              </div>
              <Progress value={getVotingProgress(proposal)} className="h-3" />
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-700">{proposal.yesVotes}</div>
                  <div className="text-sm text-green-600">Yes Votes</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-red-700">{proposal.noVotes}</div>
                  <div className="text-sm text-red-600">No Votes</div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Reference (if applicable) */}
          {proposal.dataReference && (
            <div>
              <h4 className="font-medium mb-2">Related Data</h4>
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Sensor Type:</span> {proposal.dataReference.sensorType}
                  </div>
                  <div>
                    <span className="font-medium">Value:</span> {proposal.dataReference.value}
                </div>
                  <div className="col-span-2">
                    <span className="font-medium">Metadata:</span> {proposal.dataReference.metadata}
                </div>
                </div>
              </div>
            </div>
          )}

          {/* User Vote Status */}
          {proposal.userVote !== null && proposal.userVote !== undefined && (
            <Alert>
              <Vote className="h-4 w-4" />
              <AlertDescription>
                You voted <strong>{proposal.userVote ? 'Yes' : 'No'}</strong> on this proposal.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ProposalsSkeleton = () => (
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

    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
); 