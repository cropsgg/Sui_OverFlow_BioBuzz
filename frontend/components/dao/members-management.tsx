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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { daoApi } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  UserPlus, 
  Crown, 
  Calendar, 
  Database, 
  Vote,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Copy,
  ExternalLink,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

const addMemberSchema = z.object({
  suiAddress: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid Sui address format'),
  memberName: z.string().min(2, 'Name must be at least 2 characters'),
});

type AddMemberForm = z.infer<typeof addMemberSchema>;

interface MembersManagementProps {
  userAddress?: string;
}

interface Member {
  suiAddress: string;
  name: string;
  joinedAt: Date;
  votingPower: number;
  isDaoMember: boolean;
  totalDataSubmissions?: number;
  totalVotesCast?: number;
}

interface MembersData {
  members: Member[];
  userStatus: any;
  daoInfo: any;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
}

export const MembersManagement: React.FC<MembersManagementProps> = ({ userAddress }) => {
  const { user } = useAuth();
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'joinedAt' | 'votingPower'>('joinedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [data, setData] = useState<MembersData>({
    members: [],
    userStatus: null,
    daoInfo: null,
    isLoading: true,
    error: null,
    pagination: { page: 1, totalPages: 1, total: 0 }
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<AddMemberForm>({
    resolver: zodResolver(addMemberSchema),
  });

  const loadMembers = async (page = 1) => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      const [membersRes, userStatusRes, daoInfoRes] = await Promise.all([
        daoApi.getMembers({ 
          page, 
          limit: 20, 
          search: searchTerm || undefined,
          sortBy,
          sortOrder
        }),
        user ? daoApi.getUserDaoStatus() : Promise.resolve({ success: false, data: null }),
        daoApi.getInfo()
      ]);

      if (!membersRes.success) {
        throw new Error(membersRes.message || 'Failed to load members');
      }

      setData({
        members: membersRes.data || [],
        userStatus: userStatusRes.success ? userStatusRes.data : null,
        daoInfo: daoInfoRes.success ? daoInfoRes.data : null,
        isLoading: false,
        error: null,
        pagination: membersRes.pagination || { page: 1, totalPages: 1, total: 0 }
      });
    } catch (error: any) {
      console.error('Error loading members:', error);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to load members'
      }));
    }
  };

  useEffect(() => {
    loadMembers();
  }, [user, searchTerm, sortBy, sortOrder]);

  const refreshMembers = () => {
    loadMembers(data.pagination.page);
  };

  const onAddMember = async (formData: AddMemberForm) => {
    const isAdmin = data.userStatus?.suiAddress?.toLowerCase() === data.daoInfo?.adminSuiAddress?.toLowerCase();
    
    if (!isAdmin) {
      toast.error('Only DAO admin can add members');
      return;
    }

    setIsAddingMember(true);
    try {
      const result = await daoApi.addMember({
        suiAddress: formData.suiAddress,
        memberName: formData.memberName
      });
      
      if (result.success) {
        toast.success('Add member transaction prepared! Please sign it in your wallet.');
        reset();
        setIsAddDialogOpen(false);
        setTimeout(refreshMembers, 3000);
      } else {
        toast.error(result.message || 'Failed to add member');
      }
    } catch (error) {
      toast.error('Error adding member');
    } finally {
      setIsAddingMember(false);
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard');
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAvatarFallback = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (data.isLoading) {
    return <MembersSkeleton />;
  }

  if (data.error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{data.error}</AlertDescription>
        </Alert>
        <Button onClick={refreshMembers}>Retry</Button>
      </div>
    );
  }

  const isAdmin = data.userStatus?.suiAddress?.toLowerCase() === data.daoInfo?.adminSuiAddress?.toLowerCase();
  const isMember = data.userStatus?.isDaoMember || false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">DAO Members</h2>
          <p className="text-muted-foreground">
            Manage and view DAO membership
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshMembers}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          {isAdmin && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Member</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onAddMember)} className="space-y-4">
                  <div>
                    <Label htmlFor="suiAddress">Sui Address</Label>
                    <Input
                      {...register('suiAddress')}
                      placeholder="0x..."
                      className="font-mono"
                    />
                    {errors.suiAddress && (
                      <p className="text-sm text-destructive">{errors.suiAddress.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="memberName">Member Name</Label>
                    <Input
                      {...register('memberName')}
                      placeholder="John Doe"
                    />
                    {errors.memberName && (
                      <p className="text-sm text-destructive">{errors.memberName.message}</p>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isAddingMember}>
                      {isAddingMember ? 'Adding...' : 'Add Member'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pagination.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.members.filter(m => m.isDaoMember).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Status</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
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
                  Not Member
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="joinedAt">Join Date</SelectItem>
              <SelectItem value="votingPower">Voting Power</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Asc</SelectItem>
              <SelectItem value="desc">Desc</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Members List</CardTitle>
          <CardDescription>
            Showing {data.members.length} of {data.pagination.total} members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Voting Power</TableHead>
                  <TableHead>Data Submissions</TableHead>
                  <TableHead>Votes Cast</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.members.map((member) => (
                  <TableRow key={member.suiAddress}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getAvatarFallback(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          {member.suiAddress.toLowerCase() === data.daoInfo?.adminSuiAddress?.toLowerCase() && (
                            <Badge variant="outline" className="text-xs bg-primary/10">
                              <Crown className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {formatAddress(member.suiAddress)}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyAddress(member.suiAddress)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(member.joinedAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {member.votingPower}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        {member.totalDataSubmissions || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Vote className="h-4 w-4 text-muted-foreground" />
                        {member.totalVotesCast || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.isDaoMember ? "default" : "secondary"}>
                        {member.isDaoMember ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedMember(member)}
                        className="h-8 w-8 p-0"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

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
                  onClick={() => loadMembers(data.pagination.page - 1)}
                  disabled={data.pagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loadMembers(data.pagination.page + 1)}
                  disabled={data.pagination.page >= data.pagination.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member Details Dialog */}
      {selectedMember && (
        <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Member Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback>
                    {getAvatarFallback(selectedMember.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedMember.name}</h3>
                  <p className="text-muted-foreground font-mono">
                    {selectedMember.suiAddress}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {selectedMember.suiAddress.toLowerCase() === data.daoInfo?.adminSuiAddress?.toLowerCase() && (
                      <Badge variant="outline" className="bg-primary/10">
                        <Crown className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                    <Badge variant={selectedMember.isDaoMember ? "default" : "secondary"}>
                      {selectedMember.isDaoMember ? "Active Member" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Member Since</h4>
                  <p className="text-muted-foreground">
                    {formatDate(selectedMember.joinedAt)}
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Voting Power</h4>
                  <p className="text-muted-foreground">
                    {selectedMember.votingPower}
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Data Submissions</h4>
                  <p className="text-muted-foreground">
                    {selectedMember.totalDataSubmissions || 0} records
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Votes Cast</h4>
                  <p className="text-muted-foreground">
                    {selectedMember.totalVotesCast || 0} votes
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => copyAddress(selectedMember.suiAddress)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Address
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    window.open(`https://explorer.sui.io/address/${selectedMember.suiAddress}`, '_blank');
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Explorer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

const MembersSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
    
    <div className="grid gap-4 md:grid-cols-3">
      {[...Array(3)].map((_, i) => (
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
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
); 