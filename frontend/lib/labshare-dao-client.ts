import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui.js/utils';
import { 
  Member, 
  Proposal, 
  DataRecord, 
  DAOInfo, 
  TransactionResult, 
  ThresholdConfig, 
  SensorType,
  ProposalStatus,
  DEFAULT_SENSOR_TYPES
} from '@/types/labshare-dao';

// Contract configuration
export const NETWORK = 'testnet';
export const PACKAGE_ID = '0xf991deaaa879a5bd1279d679be9f8e950b86228b4273b5d03d85ddbebc4b342e';
export const DAO_MODULE = 'labshare_dao';
export const DAO_OBJECT_ID = '0x6a5fecd3debe0255b830e2bf21da7777b7898929ef22eb71cc33c723c2178eae';

const connections = {
  mainnet: 'https://fullnode.mainnet.sui.io:443',
  testnet: 'https://fullnode.testnet.sui.io:443',
  devnet: 'https://fullnode.devnet.sui.io:443',
  localnet: 'http://127.0.0.1:9000',
};

export class LabShareDAOClient {
  private client: SuiClient;
  private executeTransaction: (txb: TransactionBlock) => Promise<string | null>;

  constructor(executeTransactionFn: (txb: TransactionBlock) => Promise<string | null>) {
    this.client = new SuiClient({ url: connections[NETWORK] });
    this.executeTransaction = executeTransactionFn;
  }

  // ===== DAO Management Functions =====

  /**
   * Initialize a new DAO (admin only, called once)
   */
  async initializeDAO(
    name: string,
    description: string,
    initialFunds: number
  ): Promise<TransactionResult> {
    try {
      const txb = new TransactionBlock();
      
      // Create initial funds coin
      const [coin] = txb.splitCoins(txb.gas, [txb.pure(initialFunds)]);
      
      txb.moveCall({
        target: `${PACKAGE_ID}::${DAO_MODULE}::initialize`,
        arguments: [
          txb.pure(name),
          txb.pure(description),
          coin,
        ],
      });

      const digest = await this.executeTransaction(txb);
      return { success: !!digest, digest: digest || undefined };
    } catch (error) {
      console.error('Error initializing DAO:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Add a new member to the DAO (admin only)
   */
  async addMember(address: string, name: string): Promise<TransactionResult> {
    try {
      const txb = new TransactionBlock();
      
      txb.moveCall({
        target: `${PACKAGE_ID}::${DAO_MODULE}::add_member`,
        arguments: [
          txb.object(DAO_OBJECT_ID),
          txb.pure(address),
          txb.pure(name),
        ],
      });

      const digest = await this.executeTransaction(txb);
      return { success: !!digest, digest: digest || undefined };
    } catch (error) {
      console.error('Error adding member:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Add funds to the DAO treasury
   */
  async addFunds(amount: number): Promise<TransactionResult> {
    try {
      const txb = new TransactionBlock();
      
      // Create coin with specified amount
      const [coin] = txb.splitCoins(txb.gas, [txb.pure(amount)]);
      
      txb.moveCall({
        target: `${PACKAGE_ID}::${DAO_MODULE}::add_funds`,
        arguments: [
          txb.object(DAO_OBJECT_ID),
          coin,
        ],
      });

      const digest = await this.executeTransaction(txb);
      return { success: !!digest, digest: digest || undefined };
    } catch (error) {
      console.error('Error adding funds:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // ===== Data Management Functions =====

  /**
   * Submit sensor data
   */
  async submitData(
    sensorType: number,
    dataHash: string,
    metadata: string,
    value: number
  ): Promise<TransactionResult> {
    try {
      const txb = new TransactionBlock();
      
      // Convert data hash to bytes
      const dataHashBytes = Array.from(new TextEncoder().encode(dataHash));
      
      txb.moveCall({
        target: `${PACKAGE_ID}::${DAO_MODULE}::submit_data`,
        arguments: [
          txb.object(DAO_OBJECT_ID),
          txb.pure(sensorType),
          txb.pure(dataHashBytes),
          txb.pure(metadata),
          txb.pure(value),
          txb.object(SUI_CLOCK_OBJECT_ID),
        ],
      });

      const digest = await this.executeTransaction(txb);
      return { success: !!digest, digest: digest || undefined };
    } catch (error) {
      console.error('Error submitting data:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Update sensor threshold (admin only)
   */
  async updateThreshold(
    sensorType: number,
    minValue: number,
    maxValue: number,
    description: string
  ): Promise<TransactionResult> {
    try {
      const txb = new TransactionBlock();
      
      txb.moveCall({
        target: `${PACKAGE_ID}::${DAO_MODULE}::update_threshold`,
        arguments: [
          txb.object(DAO_OBJECT_ID),
          txb.pure(sensorType),
          txb.pure(minValue),
          txb.pure(maxValue),
          txb.pure(description),
        ],
      });

      const digest = await this.executeTransaction(txb);
      return { success: !!digest, digest: digest || undefined };
    } catch (error) {
      console.error('Error updating threshold:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // ===== Governance Functions =====

  /**
   * Create a new proposal
   */
  async createProposal(
    title: string,
    description: string,
    proposalType: 0 | 2 // 0: General, 2: Configuration (Alert proposals are auto-created)
  ): Promise<TransactionResult> {
    try {
      const txb = new TransactionBlock();
      
      txb.moveCall({
        target: `${PACKAGE_ID}::${DAO_MODULE}::create_proposal`,
        arguments: [
          txb.object(DAO_OBJECT_ID),
          txb.pure(title),
          txb.pure(description),
          txb.pure(proposalType),
          txb.object(SUI_CLOCK_OBJECT_ID),
        ],
      });

      const digest = await this.executeTransaction(txb);
      return { success: !!digest, digest: digest || undefined };
    } catch (error) {
      console.error('Error creating proposal:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Vote on a proposal
   */
  async vote(proposalId: string, vote: boolean): Promise<TransactionResult> {
    try {
      const txb = new TransactionBlock();
      
      txb.moveCall({
        target: `${PACKAGE_ID}::${DAO_MODULE}::vote`,
        arguments: [
          txb.object(DAO_OBJECT_ID),
          txb.object(proposalId),
          txb.pure(vote),
          txb.object(SUI_CLOCK_OBJECT_ID),
        ],
      });

      const digest = await this.executeTransaction(txb);
      return { success: !!digest, digest: digest || undefined };
    } catch (error) {
      console.error('Error voting:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Execute a proposal after voting period ends
   */
  async executeProposal(proposalId: string): Promise<TransactionResult> {
    try {
      const txb = new TransactionBlock();
      
      txb.moveCall({
        target: `${PACKAGE_ID}::${DAO_MODULE}::execute_proposal`,
        arguments: [
          txb.object(DAO_OBJECT_ID),
          txb.object(proposalId),
          txb.object(SUI_CLOCK_OBJECT_ID),
        ],
      });

      const digest = await this.executeTransaction(txb);
      return { success: !!digest, digest: digest || undefined };
    } catch (error) {
      console.error('Error executing proposal:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // ===== Read Functions =====

  /**
   * Get DAO information by reading the DAO object directly
   */
  async getDAOInfo(): Promise<DAOInfo | null> {
    try {
      const daoObject = await this.client.getObject({
        id: DAO_OBJECT_ID,
        options: { showContent: true },
      });

      if (daoObject.data?.content && 'fields' in daoObject.data.content) {
        const fields = daoObject.data.content.fields as any;
        
        return {
          id: DAO_OBJECT_ID,
          name: fields.name || 'LabShareDAO',
          description: fields.description || 'Decentralized research collaboration platform',
          admin: fields.admin || '0x0000000000000000000000000000000000000000000000000000000000000000',
          member_count: parseInt(fields.member_count || '0'),
        };
      }
      
      // Return default values if object can't be read
      return {
        id: DAO_OBJECT_ID,
        name: 'LabShareDAO',
        description: 'Decentralized research collaboration platform',
        admin: '0x0000000000000000000000000000000000000000000000000000000000000000',
        member_count: 0,
      };
    } catch (error) {
      console.error('Error getting DAO info:', error);
      // Return default values if there's an error
      return {
        id: DAO_OBJECT_ID,
        name: 'LabShareDAO',
        description: 'Decentralized research collaboration platform',
        admin: '0x0000000000000000000000000000000000000000000000000000000000000000',
        member_count: 0,
      };
    }
  }

  /**
   * Check if an address is a member
   */
  async isMember(address: string): Promise<boolean> {
    try {
      // For now, return a basic implementation
      // In a real implementation, you would check the DAO's member list
      const daoObject = await this.client.getObject({
        id: DAO_OBJECT_ID,
        options: { showContent: true },
      });

      if (daoObject.data?.content && 'fields' in daoObject.data.content) {
        const fields = daoObject.data.content.fields as any;
        // Check if the address is the admin
        if (fields.admin === address) {
          return true;
        }
        
        // For now, return true for any address to allow testing
        // In production, you would implement proper member checking
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking membership:', error);
      return false;
    }
  }

  /**
   * Get member information
   */
  async getMember(address: string): Promise<Member | null> {
    try {
      const isMemberResult = await this.isMember(address);
      
      if (!isMemberResult) {
        return null;
      }

      // Return basic member info
      // In a real implementation, you would fetch this from the contract
      return {
        addr: address,
        name: address.slice(0, 8) + '...',
        joined_at: Math.floor(Date.now() / 1000),
        voting_power: address === (await this.getDAOInfo())?.admin ? 100 : 10,
      };
    } catch (error) {
      console.error('Error getting member:', error);
      return null;
    }
  }

  /**
   * Get proposal information
   */
  async getProposal(proposalId: string): Promise<Proposal | null> {
    try {
      const proposalObject = await this.client.getObject({
        id: proposalId,
        options: { showContent: true },
      });

      if (proposalObject.data?.content && 'fields' in proposalObject.data.content) {
        const fields = proposalObject.data.content.fields as any;
        
        return {
          id: proposalId,
          proposal_id: parseInt(fields.proposal_id || '0'),
          proposal_type: parseInt(fields.proposal_type || '0'),
          title: fields.title || 'Untitled Proposal',
          description: fields.description || 'No description',
          proposer: fields.proposer || '0x0000000000000000000000000000000000000000000000000000000000000000',
          created_at: parseInt(fields.created_at || Math.floor(Date.now() / 1000).toString()),
          voting_end_time: parseInt(fields.voting_end_time || Math.floor(Date.now() / 1000 + 86400).toString()),
          executed: fields.executed === true || fields.executed === 'true',
          yes_votes: parseInt(fields.yes_votes || '0'),
          no_votes: parseInt(fields.no_votes || '0'),
          voters: {},
          data_reference: fields.data_reference,
          alert_data_value: fields.alert_data_value ? parseInt(fields.alert_data_value) : undefined,
          alert_sensor_id: fields.alert_sensor_id ? parseInt(fields.alert_sensor_id) : undefined,
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting proposal:', error);
      return null;
    }
  }

  /**
   * Get data record information
   */
  async getDataRecord(recordId: string): Promise<DataRecord | null> {
    try {
      const dataObject = await this.client.getObject({
        id: recordId,
        options: { showContent: true },
      });

      if (dataObject.data?.content && 'fields' in dataObject.data.content) {
        const fields = dataObject.data.content.fields as any;
        
        return {
          id: recordId,
          data_id: parseInt(fields.data_id || '0'),
          sensor_type: parseInt(fields.sensor_type || '0'),
          submitted_by: fields.submitted_by || '0x0000000000000000000000000000000000000000000000000000000000000000',
          timestamp: parseInt(fields.timestamp || Math.floor(Date.now() / 1000).toString()),
          value: parseInt(fields.value || '0'),
          triggered_alert: fields.triggered_alert === true || fields.triggered_alert === 'true',
          data_hash: fields.data_hash || [],
          metadata: fields.metadata || '',
          alert_proposal_id: fields.alert_proposal_id,
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting data record:', error);
      return null;
    }
  }

  /**
   * Get treasury balance
   */
  async getTreasuryBalance(): Promise<number> {
    try {
      const daoObject = await this.client.getObject({
        id: DAO_OBJECT_ID,
        options: { showContent: true },
      });

      if (daoObject.data?.content && 'fields' in daoObject.data.content) {
        const fields = daoObject.data.content.fields as any;
        return parseInt(fields.treasury_balance || '0');
      }
      
      return 0;
    } catch (error) {
      console.error('Error getting treasury balance:', error);
      return 0;
    }
  }

  // ===== Utility Functions =====

  /**
   * Get available sensor types
   */
  getSensorTypes(): SensorType[] {
    return DEFAULT_SENSOR_TYPES;
  }

  /**
   * Calculate proposal status
   */
  calculateProposalStatus(proposal: Proposal, currentTime: number): ProposalStatus {
    const isActive = !proposal.executed && currentTime <= proposal.voting_end_time;
    const canVote = isActive;
    const canExecute = !proposal.executed && currentTime > proposal.voting_end_time;
    
    // Simplified quorum calculation (50% of total voting power)
    const totalVotes = proposal.yes_votes + proposal.no_votes;
    const estimatedTotalVotingPower = 110; // Simplified: admin (100) + others (10 each, estimated)
    const quorumReached = (totalVotes * 100) >= (estimatedTotalVotingPower * 50);
    
    const approved = quorumReached && proposal.yes_votes > proposal.no_votes;
    const timeRemaining = Math.max(0, proposal.voting_end_time - currentTime);

    return {
      isActive,
      canVote,
      canExecute,
      quorumReached,
      approved,
      timeRemaining,
    };
  }

  /**
   * Subscribe to DAO events
   */
  async subscribeToEvents(onEvent: (event: any) => void): Promise<() => void> {
    try {
      const unsubscribe = await this.client.subscribeEvent({
        filter: { Package: PACKAGE_ID },
        onMessage: (event) => {
          console.log('DAO Event received:', event);
          onEvent(event);
        },
      });
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to events:', error);
      return () => {};
    }
  }

  /**
   * Get all proposals (by fetching dynamic fields from DAO)
   */
  async getAllProposals(): Promise<Proposal[]> {
    try {
      const daoObject = await this.client.getObject({
        id: DAO_OBJECT_ID,
        options: { showContent: true },
      });

      if (!daoObject.data?.content || !('fields' in daoObject.data.content)) {
        return [];
      }

      const fields = daoObject.data.content.fields as any;
      const proposalsTableId = fields.proposals?.fields?.id?.id;

      if (!proposalsTableId) {
        return [];
      }

      const dynamicFields = await this.client.getDynamicFields({
        parentId: proposalsTableId,
      });

      const proposals: Proposal[] = [];
      for (const field of dynamicFields.data) {
        if (field.objectId) {
          const proposal = await this.getProposal(field.objectId);
          if (proposal) {
            proposals.push(proposal);
          }
        }
      }

      return proposals.sort((a, b) => b.created_at - a.created_at);
    } catch (error) {
      console.error('Error getting all proposals:', error);
      return [];
    }
  }

  /**
   * Get all data records
   */
  async getAllDataRecords(): Promise<DataRecord[]> {
    try {
      const daoObject = await this.client.getObject({
        id: DAO_OBJECT_ID,
        options: { showContent: true },
      });

      if (!daoObject.data?.content || !('fields' in daoObject.data.content)) {
        return [];
      }

      const fields = daoObject.data.content.fields as any;
      const dataRecordsTableId = fields.data_records?.fields?.id?.id;

      if (!dataRecordsTableId) {
        return [];
      }

      const dynamicFields = await this.client.getDynamicFields({
        parentId: dataRecordsTableId,
      });

      const dataRecords: DataRecord[] = [];
      for (const field of dynamicFields.data) {
        if (field.objectId) {
          const dataRecord = await this.getDataRecord(field.objectId);
          if (dataRecord) {
            dataRecords.push(dataRecord);
          }
        }
      }

      return dataRecords.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error getting all data records:', error);
      return [];
    }
  }
} 