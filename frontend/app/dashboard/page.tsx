"use client"

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DAODashboard } from '@/components/dao/dao-dashboard';
import { ProposalsManagement } from '@/components/dao/proposals-management';
import { DataManagement } from '@/components/dao/data-management';
import { AdminPanel } from '@/components/dao/admin-panel';
import { MembersManagement } from '@/components/dao/members-management';
import { TreasuryManagement } from '@/components/dao/treasury-management';
import { LoadingScreen } from '@/components/loading-screen';
import { useAuth } from '@/lib/auth-context';
import { daoApi } from '@/lib/api-client';
import { 
  LayoutDashboard, 
  FileText, 
  Database, 
  Settings, 
  AlertTriangle,
  Wallet,
  Users,
  RefreshCw,
  Link as LinkIcon
} from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { user } = useAuth();
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<any>(null);
  const [isLinkingAddress, setIsLinkingAddress] = useState(false);
  const [addressToLink, setAddressToLink] = useState('');

  // Check DAO status
  const checkUserDaoStatus = async () => {
    if (!user) return;
    
    try {
      const response = await daoApi.getUserDaoStatus();
      if (response.success) {
        setUserStatus(response.data);
        if (response.data?.suiAddress) {
          setUserAddress(response.data.suiAddress);
        }
      }
    } catch (error) {
      console.error('Error checking DAO status:', error);
    }
  };

  // Listen for wallet connection events
  useEffect(() => {
    const handleWalletConnected = (event: any) => {
      if (event.detail?.address) {
        setUserAddress(event.detail.address);
        setWalletError(null);
      }
    };

    const handleWalletDisconnected = () => {
      setUserAddress(null);
    };

    // Check for existing wallet connection
    const checkWalletConnection = async () => {
      if (typeof window === 'undefined') return;

      try {
        setIsConnecting(true);
        
        // Check for available wallet providers
        const providers = {
          slush: (window as any).slush,
          wallet: (window as any).wallet,
          suiWallet: (window as any).suiWallet,
          sui: (window as any).sui,
          ethos: (window as any).ethereum?.isEthos ? (window as any).ethereum : null
        };

        let connectedAddress = null;

        // Try to get accounts from available providers
        for (const [name, provider] of Object.entries(providers)) {
          if (provider) {
            try {
              let accounts = [];
              if (name === 'slush') {
                accounts = await provider.getAccounts();
              } else if (name === 'wallet' || name === 'suiWallet' || name === 'sui' || name === 'ethos') {
                accounts = await provider.getAccounts();
              }
              
              if (accounts && accounts.length > 0) {
                connectedAddress = accounts[0];
                break;
              }
            } catch (error) {
              // Provider might not be connected, continue checking others
              continue;
            }
          }
        }

        if (connectedAddress) {
          setUserAddress(connectedAddress);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
        setWalletError('Failed to check wallet connection');
      } finally {
        setIsConnecting(false);
      }
    };

    // Add event listeners
    window.addEventListener('walletConnected', handleWalletConnected);
    window.addEventListener('walletDisconnected', handleWalletDisconnected);

    // Check connection on mount
    checkWalletConnection();

    return () => {
      window.removeEventListener('walletConnected', handleWalletConnected);
      window.removeEventListener('walletDisconnected', handleWalletDisconnected);
    };
  }, []);

  // Check DAO status when user or address changes
  useEffect(() => {
    checkUserDaoStatus();
  }, [user, userAddress]);

  // Connect wallet function for manual connection
  const connectWallet = async () => {
    setIsConnecting(true);
    setWalletError(null);

    try {
      // Import the connection function dynamically to avoid SSR issues
      const { connectWallet: connectWalletFn } = await import('@/blockchain/sui-client');
      const address = await connectWalletFn();
      
      if (address) {
        setUserAddress(address);
      } else {
        setWalletError('Failed to connect wallet. Please try again.');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setWalletError('Error connecting wallet. Please ensure you have a Sui wallet installed.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Link Sui address to account
  const linkSuiAddress = async () => {
    if (!user || !userAddress) {
      toast.error('Please login and connect your wallet first');
      return;
    }

    setIsLinkingAddress(true);
    try {
      const response = await daoApi.linkSuiAddress(userAddress);
      if (response.success) {
        toast.success('Sui address linked successfully!');
        checkUserDaoStatus(); // Refresh status
      } else {
        toast.error(response.message || 'Failed to link address');
      }
    } catch (error) {
      toast.error('Error linking Sui address');
    } finally {
      setIsLinkingAddress(false);
    }
  };

  if (isConnecting) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <div className="container mx-auto py-20 text-center">
        <Alert className="max-w-md mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please login to access the DAO dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isWalletConnected = !!userAddress;
  const hasLinkedAddress = userStatus?.hasLinkedAddress || false;
  const isDaoMember = userStatus?.isDaoMember || false;

  return (
    <div className="container mx-auto py-6">
      {/* Wallet & Account Status */}
      <div className="mb-6 space-y-3">
        {/* Wallet Connection Status */}
        {isWalletConnected ? (
          <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-100">
                <Wallet className="h-3 w-3 mr-1" />
                Wallet Connected
              </Badge>
              <span className="text-sm text-muted-foreground font-mono">
                {userAddress.slice(0, 8)}...{userAddress.slice(-6)}
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={checkUserDaoStatus}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh Status
            </Button>
          </div>
        ) : (
          <Alert>
            <Wallet className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Connect your Sui wallet to access DAO features</span>
              <Button
                onClick={connectWallet}
                disabled={isConnecting}
                size="sm"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Address Linking Status */}
        {user && isWalletConnected && !hasLinkedAddress && (
          <Alert>
            <LinkIcon className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Link your Sui address to your account to join the DAO</span>
              <Button
                onClick={linkSuiAddress}
                disabled={isLinkingAddress}
                size="sm"
              >
                {isLinkingAddress ? 'Linking...' : 'Link Address'}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* DAO Membership Status */}
        {hasLinkedAddress && !isDaoMember && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your address is linked but you're not a DAO member yet. Contact an administrator to join.
            </AlertDescription>
          </Alert>
        )}

        {/* Success Status */}
        {isDaoMember && (
          <div className="flex items-center gap-2 p-3 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-100">
              <Users className="h-3 w-3 mr-1" />
              DAO Member
            </Badge>
            <span className="text-sm text-muted-foreground">
              You have full access to DAO features
            </span>
          </div>
        )}
        
        {walletError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{walletError}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Main Dashboard Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="proposals" className="gap-2">
            <FileText className="h-4 w-4" />
            Proposals
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2">
            <Database className="h-4 w-4" />
            Data
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="treasury" className="gap-2">
            <Wallet className="h-4 w-4" />
            Treasury
          </TabsTrigger>
          <TabsTrigger value="admin" className="gap-2">
            <Settings className="h-4 w-4" />
            Admin
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <DAODashboard userAddress={userAddress || undefined} />
        </TabsContent>

        <TabsContent value="proposals" className="mt-6">
          <ProposalsManagement userAddress={userAddress || undefined} />
        </TabsContent>

        <TabsContent value="data" className="mt-6">
          <DataManagement userAddress={userAddress || undefined} />
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <MembersManagement userAddress={userAddress || undefined} />
        </TabsContent>

        <TabsContent value="treasury" className="mt-6">
          <TreasuryManagement userAddress={userAddress || undefined} />
        </TabsContent>

        <TabsContent value="admin" className="mt-6">
          <AdminPanel userAddress={userAddress || undefined} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
