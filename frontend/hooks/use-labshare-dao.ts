import { useState, useEffect, useCallback, useRef } from 'react';
import { LabShareDAOClient } from '@/lib/labshare-dao-client';
import { executeTransaction } from '@/blockchain/sui-client';
import { 
  DAOInfo, 
  Proposal, 
  DataRecord, 
  Member, 
  TransactionResult,
  ProposalStatus,
  SensorType,
  DEFAULT_SENSOR_TYPES
} from '@/types/labshare-dao';

// Main hook for DAO client
export const useLabShareDAO = () => {
  const clientRef = useRef<LabShareDAOClient | null>(null);

  const getClient = useCallback(() => {
    if (!clientRef.current) {
      clientRef.current = new LabShareDAOClient(executeTransaction);
    }
    return clientRef.current;
  }, []);

  return getClient();
};

// Hook for DAO information
export const useDAOInfo = () => {
  const [daoInfo, setDAOInfo] = useState<DAOInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const client = useLabShareDAO();

  const fetchDAOInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const info = await client.getDAOInfo();
      setDAOInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch DAO info');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchDAOInfo();
  }, [fetchDAOInfo]);

  return { daoInfo, loading, error, refetch: fetchDAOInfo };
};

// Hook for treasury balance
export const useTreasuryBalance = () => {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const client = useLabShareDAO();

  const fetchBalance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const treasuryBalance = await client.getTreasuryBalance();
      setBalance(treasuryBalance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch treasury balance');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, loading, error, refetch: fetchBalance };
};

// Hook for member management
export const useMemberManagement = (userAddress?: string) => {
  const [isMember, setIsMember] = useState(false);
  const [memberInfo, setMemberInfo] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const client = useLabShareDAO();

  const checkMembership = useCallback(async (address: string) => {
    try {
      setLoading(true);
      setError(null);
      const membershipStatus = await client.isMember(address);
      setIsMember(membershipStatus);
      
      if (membershipStatus) {
        const info = await client.getMember(address);
        setMemberInfo(info);
      } else {
        setMemberInfo(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check membership');
    } finally {
      setLoading(false);
    }
  }, [client]);

  const addMember = useCallback(async (address: string, name: string): Promise<TransactionResult> => {
    return await client.addMember(address, name);
  }, [client]);

  useEffect(() => {
    if (userAddress) {
      checkMembership(userAddress);
    }
  }, [userAddress, checkMembership]);

  return { 
    isMember, 
    memberInfo, 
    loading, 
    error, 
    addMember, 
    checkMembership 
  };
};

// Hook for proposals management
export const useProposals = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const client = useLabShareDAO();

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allProposals = await client.getAllProposals();
      setProposals(allProposals);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch proposals');
    } finally {
      setLoading(false);
    }
  }, [client]);

  const createProposal = useCallback(async (
    title: string, 
    description: string, 
    proposalType: 0 | 2
  ): Promise<TransactionResult> => {
    const result = await client.createProposal(title, description, proposalType);
    if (result.success) {
      // Refetch proposals after creation
      setTimeout(fetchProposals, 2000);
    }
    return result;
  }, [client, fetchProposals]);

  const vote = useCallback(async (
    proposalId: string, 
    voteValue: boolean
  ): Promise<TransactionResult> => {
    const result = await client.vote(proposalId, voteValue);
    if (result.success) {
      // Refetch proposals after voting
      setTimeout(fetchProposals, 2000);
    }
    return result;
  }, [client, fetchProposals]);

  const executeProposal = useCallback(async (
    proposalId: string
  ): Promise<TransactionResult> => {
    const result = await client.executeProposal(proposalId);
    if (result.success) {
      // Refetch proposals after execution
      setTimeout(fetchProposals, 2000);
    }
    return result;
  }, [client, fetchProposals]);

  const getProposalStatus = useCallback((proposal: Proposal): ProposalStatus => {
    const currentTime = Math.floor(Date.now() / 1000);
    return client.calculateProposalStatus(proposal, currentTime);
  }, [client]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  return { 
    proposals, 
    loading, 
    error, 
    createProposal, 
    vote, 
    executeProposal, 
    getProposalStatus,
    refetch: fetchProposals 
  };
};

// Hook for data records management
export const useDataRecords = () => {
  const [dataRecords, setDataRecords] = useState<DataRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const client = useLabShareDAO();

  const fetchDataRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allRecords = await client.getAllDataRecords();
      setDataRecords(allRecords);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data records');
    } finally {
      setLoading(false);
    }
  }, [client]);

  const submitData = useCallback(async (
    sensorType: number,
    dataHash: string,
    metadata: string,
    value: number
  ): Promise<TransactionResult> => {
    const result = await client.submitData(sensorType, dataHash, metadata, value);
    if (result.success) {
      // Refetch data records after submission
      setTimeout(fetchDataRecords, 2000);
    }
    return result;
  }, [client, fetchDataRecords]);

  useEffect(() => {
    fetchDataRecords();
  }, [fetchDataRecords]);

  return { 
    dataRecords, 
    loading, 
    error, 
    submitData, 
    refetch: fetchDataRecords 
  };
};

// Hook for sensor types and thresholds
export const useSensorManagement = () => {
  const [sensorTypes] = useState<SensorType[]>(DEFAULT_SENSOR_TYPES);
  const client = useLabShareDAO();

  const updateThreshold = useCallback(async (
    sensorType: number,
    minValue: number,
    maxValue: number,
    description: string
  ): Promise<TransactionResult> => {
    return await client.updateThreshold(sensorType, minValue, maxValue, description);
  }, [client]);

  return { 
    sensorTypes, 
    updateThreshold 
  };
};

// Hook for treasury management
export const useTreasury = () => {
  const { balance, loading, error, refetch } = useTreasuryBalance();
  const client = useLabShareDAO();

  const addFunds = useCallback(async (amount: number): Promise<TransactionResult> => {
    const result = await client.addFunds(amount);
    if (result.success) {
      // Refetch balance after adding funds
      setTimeout(refetch, 2000);
    }
    return result;
  }, [client, refetch]);

  return { 
    balance, 
    loading, 
    error, 
    addFunds, 
    refetch 
  };
};

// Hook for real-time events
export const useDAOEvents = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const client = useLabShareDAO();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const subscribeToEvents = useCallback(async () => {
    try {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      const unsubscribe = await client.subscribeToEvents((event) => {
        setEvents(prev => [event, ...prev.slice(0, 99)]); // Keep last 100 events
      });

      unsubscribeRef.current = unsubscribe;
      setIsSubscribed(true);
    } catch (error) {
      console.error('Failed to subscribe to events:', error);
      setIsSubscribed(false);
    }
  }, [client]);

  const unsubscribeFromEvents = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
      setIsSubscribed(false);
    }
  }, []);

  useEffect(() => {
    subscribeToEvents();
    
    return () => {
      unsubscribeFromEvents();
    };
  }, [subscribeToEvents, unsubscribeFromEvents]);

  return { 
    events, 
    isSubscribed, 
    subscribeToEvents, 
    unsubscribeFromEvents 
  };
};

// Combined hook for complete DAO state
export const useLabShareDAOState = (userAddress?: string) => {
  const daoInfo = useDAOInfo();
  const treasury = useTreasury();
  const memberManagement = useMemberManagement(userAddress);
  const proposals = useProposals();
  const dataRecords = useDataRecords();
  const sensorManagement = useSensorManagement();
  const events = useDAOEvents();

  const isAdmin = daoInfo.daoInfo?.admin === userAddress;
  const canManageMembers = isAdmin;
  const canUpdateThresholds = isAdmin;

  return {
    daoInfo,
    treasury,
    memberManagement,
    proposals,
    dataRecords,
    sensorManagement,
    events,
    isAdmin,
    canManageMembers,
    canUpdateThresholds,
  };
}; 