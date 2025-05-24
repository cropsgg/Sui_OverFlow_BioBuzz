import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { normalizeSuiAddress, isValidSuiAddress } from '@mysten/sui/utils';
import {
  SuiServiceConfig,
  DAOObjectData,
  MemberData,
  ProposalData,
  DataRecordData,
  ThresholdConfigData,
  SensorTypeData,
  TransactionResponse,
  DaoError,
  DaoErrorCodes
} from '../interfaces/dao.interface';

export class SuiService {
  private client: SuiClient;
  private config: SuiServiceConfig;

  constructor(config: SuiServiceConfig) {
    this.config = config;
    this.client = new SuiClient({ url: config.rpcUrl });
  }

  // ================================
  // CONFIGURATION METHODS
  // ================================

  public getConfig(): SuiServiceConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<SuiServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.rpcUrl) {
      this.client = new SuiClient({ url: newConfig.rpcUrl });
    }
  }

  // ================================
  // UTILITY METHODS
  // ================================

  public static validateSuiAddress(address: string): boolean {
    try {
      return isValidSuiAddress(address);
    } catch {
      return false;
    }
  }

  public static normalizeSuiAddress(address: string): string {
    try {
      return normalizeSuiAddress(address);
    } catch {
      throw new Error('Invalid Sui address format');
    }
  }

  public async getLatestCheckpoint(): Promise<string> {
    try {
      const checkpoint = await this.client.getLatestCheckpointSequenceNumber();
      return checkpoint;
    } catch (error) {
      console.error('Error getting latest checkpoint:', error);
      throw this.createDaoError(DaoErrorCodes.NETWORK_ERROR, 'Failed to get latest checkpoint', error);
    }
  }

  public async getTransactionDetails(digest: string) {
    try {
      return await this.client.getTransactionBlock({
        digest,
        options: {
          showInput: true,
          showEvents: true,
          showEffects: true,
          showObjectChanges: true,
        },
      });
    } catch (error) {
      console.error('Error getting transaction details:', error);
      throw this.createDaoError(DaoErrorCodes.NETWORK_ERROR, 'Failed to get transaction details', error);
    }
  }

  // ================================
  // DAO READ OPERATIONS
  // ================================

  public async getDaoInfo(): Promise<DAOObjectData> {
    try {
      const response = await this.client.getObject({
        id: this.config.daoObjectId,
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (!response.data || !response.data.content) {
        throw this.createDaoError(DaoErrorCodes.OBJECT_NOT_FOUND, 'DAO object not found');
      }

      const content = response.data.content as any;
      if (content.dataType !== 'moveObject') {
        throw this.createDaoError(DaoErrorCodes.OBJECT_NOT_FOUND, 'Invalid DAO object type');
      }

      return this.parseDaoObjectFields(content.fields);
    } catch (error) {
      if (error instanceof Error && error.message.includes('DAO object not found')) {
        throw error;
      }
      console.error('Error getting DAO info:', error);
      throw this.createDaoError(DaoErrorCodes.NETWORK_ERROR, 'Failed to get DAO information', error);
    }
  }

  public async getMember(memberAddress: string): Promise<MemberData | null> {
    try {
      const normalizedAddress = SuiService.normalizeSuiAddress(memberAddress);
      
      // Call the is_member function first to check if member exists
      const response = await this.client.devInspectTransactionBlock({
        transactionBlock: this.buildIsMemberTransaction(normalizedAddress),
        sender: normalizedAddress,
      });

      if (!response.results || response.results.length === 0) {
        return null;
      }

      // If member exists, get member details
      const memberResponse = await this.client.devInspectTransactionBlock({
        transactionBlock: this.buildGetMemberTransaction(normalizedAddress),
        sender: normalizedAddress,
      });

      if (!memberResponse.results || memberResponse.results.length === 0) {
        return null;
      }

      return this.parseMemberData(memberResponse.results[0]);
    } catch (error) {
      console.error('Error getting member:', error);
      throw this.createDaoError(DaoErrorCodes.NETWORK_ERROR, 'Failed to get member information', error);
    }
  }

  public async isMember(memberAddress: string): Promise<boolean> {
    try {
      const normalizedAddress = SuiService.normalizeSuiAddress(memberAddress);
      
      const response = await this.client.devInspectTransactionBlock({
        transactionBlock: this.buildIsMemberTransaction(normalizedAddress),
        sender: normalizedAddress,
      });

      if (!response.results || response.results.length === 0) {
        return false;
      }

      return this.parseBooleanResult(response.results[0]);
    } catch (error) {
      console.error('Error checking member status:', error);
      return false;
    }
  }

  public async getProposal(proposalId: string): Promise<ProposalData | null> {
    try {
      const response = await this.client.getObject({
        id: proposalId,
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (!response.data || !response.data.content) {
        return null;
      }

      const content = response.data.content as any;
      if (content.dataType !== 'moveObject') {
        return null;
      }

      return this.parseProposalData(content.fields);
    } catch (error) {
      console.error('Error getting proposal:', error);
      throw this.createDaoError(DaoErrorCodes.NETWORK_ERROR, 'Failed to get proposal information', error);
    }
  }

  public async getDataRecord(recordId: string): Promise<DataRecordData | null> {
    try {
      const response = await this.client.getObject({
        id: recordId,
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (!response.data || !response.data.content) {
        return null;
      }

      const content = response.data.content as any;
      if (content.dataType !== 'moveObject') {
        return null;
      }

      return this.parseDataRecordData(content.fields);
    } catch (error) {
      console.error('Error getting data record:', error);
      throw this.createDaoError(DaoErrorCodes.NETWORK_ERROR, 'Failed to get data record information', error);
    }
  }

  public async getTreasuryBalance(): Promise<number> {
    try {
      const daoInfo = await this.getDaoInfo();
      return parseInt(daoInfo.treasury.fields.balance) / 1_000_000_000; // Convert MIST to SUI
    } catch (error) {
      console.error('Error getting treasury balance:', error);
      throw this.createDaoError(DaoErrorCodes.NETWORK_ERROR, 'Failed to get treasury balance', error);
    }
  }

  // ================================
  // TRANSACTION BUILDING METHODS
  // ================================

  public buildAddMemberTransaction(memberAddress: string, memberName: string): Transaction {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${this.config.packageId}::labshare_dao::add_member`,
      arguments: [
        tx.object(this.config.daoObjectId),
        tx.pure.address(SuiService.normalizeSuiAddress(memberAddress)),
        tx.pure.string(memberName),
      ],
    });

    return tx;
  }

  public buildSubmitDataTransaction(
    senderAddress: string,
    sensorType: number,
    dataHash: string,
    metadata: string,
    value: number
  ): Transaction {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${this.config.packageId}::labshare_dao::submit_data`,
      arguments: [
        tx.object(this.config.daoObjectId),
        tx.pure.u8(sensorType),
        tx.pure.vector('u8', Array.from(Buffer.from(dataHash, 'hex'))),
        tx.pure.string(metadata),
        tx.pure.u64(value),
      ],
    });

    return tx;
  }

  public buildCreateProposalTransaction(
    senderAddress: string,
    proposalType: number,
    title: string,
    description: string
  ): Transaction {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${this.config.packageId}::labshare_dao::create_proposal`,
      arguments: [
        tx.object(this.config.daoObjectId),
        tx.pure.u8(proposalType),
        tx.pure.string(title),
        tx.pure.string(description),
      ],
    });

    return tx;
  }

  public buildVoteTransaction(
    senderAddress: string,
    proposalId: string,
    vote: boolean
  ): Transaction {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${this.config.packageId}::labshare_dao::vote`,
      arguments: [
        tx.object(this.config.daoObjectId),
        tx.object(proposalId),
        tx.pure.bool(vote),
      ],
    });

    return tx;
  }

  public buildExecuteProposalTransaction(
    senderAddress: string,
    proposalId: string
  ): Transaction {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${this.config.packageId}::labshare_dao::execute_proposal`,
      arguments: [
        tx.object(this.config.daoObjectId),
        tx.object(proposalId),
      ],
    });

    return tx;
  }

  public buildUpdateThresholdTransaction(
    adminAddress: string,
    sensorTypeId: number,
    minValue: number,
    maxValue: number,
    description: string
  ): Transaction {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${this.config.packageId}::labshare_dao::update_threshold`,
      arguments: [
        tx.object(this.config.daoObjectId),
        tx.pure.u8(sensorTypeId),
        tx.pure.u64(minValue),
        tx.pure.u64(maxValue),
        tx.pure.string(description),
      ],
    });

    return tx;
  }

  public buildAddFundsTransaction(
    senderAddress: string,
    amount: number
  ): Transaction {
    const tx = new Transaction();
    
    // Convert SUI to MIST (1 SUI = 1_000_000_000 MIST)
    const amountInMist = Math.floor(amount * 1_000_000_000);
    
    const [coin] = tx.splitCoins(tx.gas, [amountInMist]);
    
    tx.moveCall({
      target: `${this.config.packageId}::labshare_dao::add_funds`,
      arguments: [
        tx.object(this.config.daoObjectId),
        coin,
      ],
    });

    return tx;
  }

  // ================================
  // HELPER TRANSACTION BUILDERS
  // ================================

  private buildIsMemberTransaction(memberAddress: string): Transaction {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${this.config.packageId}::labshare_dao::is_member`,
      arguments: [
        tx.object(this.config.daoObjectId),
        tx.pure.address(memberAddress),
      ],
    });

    return tx;
  }

  private buildGetMemberTransaction(memberAddress: string): Transaction {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${this.config.packageId}::labshare_dao::get_member`,
      arguments: [
        tx.object(this.config.daoObjectId),
        tx.pure.address(memberAddress),
      ],
    });

    return tx;
  }

  // ================================
  // EVENT SUBSCRIPTION METHODS
  // ================================

  public async subscribeToEvents(
    eventFilter: any,
    onEvent: (event: any) => void,
    onError?: (error: any) => void
  ): Promise<() => void> {
    try {
      const unsubscribe = await this.client.subscribeEvent({
        filter: eventFilter,
        onMessage: onEvent,
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to events:', error);
      if (onError) {
        onError(error);
      }
      throw this.createDaoError(DaoErrorCodes.NETWORK_ERROR, 'Failed to subscribe to events', error);
    }
  }

  public async getEventFilter() {
    return {
      Package: this.config.packageId,
    };
  }

  public async queryEvents(
    eventType?: string,
    fromCheckpoint?: string,
    toCheckpoint?: string,
    limit?: number
  ) {
    try {
      const filter: any = eventType
        ? {
            Package: this.config.packageId,
          }
        : { Package: this.config.packageId };

      const response = await this.client.queryEvents({
        query: filter,
        cursor: fromCheckpoint as any,
        limit: limit || 100,
        order: 'descending',
      });

      return response;
    } catch (error) {
      console.error('Error querying events:', error);
      throw this.createDaoError(DaoErrorCodes.NETWORK_ERROR, 'Failed to query events', error);
    }
  }

  // ================================
  // DATA PARSING METHODS
  // ================================

  private parseDaoObjectFields(fields: any): DAOObjectData {
    return {
      id: fields.id?.id || '',
      name: fields.name || '',
      description: fields.description || '',
      admin: fields.admin || '',
      memberCount: parseInt(fields.member_count || '0'),
      treasury: fields.treasury || { type: '', fields: { balance: '0', id: { id: '' } } },
      sensors: fields.sensors || [],
      thresholds: fields.thresholds || { type: '', fields: { id: { id: '' }, size: '0' } },
      proposals: fields.proposals || { type: '', fields: { id: { id: '' }, size: '0' } },
      dataRecords: fields.data_records || { type: '', fields: { id: { id: '' }, size: '0' } },
      nextProposalId: fields.next_proposal_id || '1',
      nextDataId: fields.next_data_id || '1',
    };
  }

  private parseMemberData(result: any): MemberData {
    // Parse the result from the Move function call
    const fields = result.returnValues?.[0] || {};
    return {
      addr: fields.addr || '',
      name: fields.name || '',
      joinedAt: fields.joined_at || '',
      votingPower: parseInt(fields.voting_power || '0'),
    };
  }

  private parseProposalData(fields: any): ProposalData {
    return {
      id: fields.id?.id || '',
      proposalId: parseInt(fields.proposal_id || '0'),
      proposalType: parseInt(fields.proposal_type || '0'),
      title: fields.title || '',
      description: fields.description || '',
      proposer: fields.proposer || '',
      createdAt: fields.created_at || '',
      votingEndTime: fields.voting_end_time || '',
      executed: fields.executed || false,
      yesVotes: parseInt(fields.yes_votes || '0'),
      noVotes: parseInt(fields.no_votes || '0'),
      voters: fields.voters || { type: '', fields: { id: { id: '' }, size: '0' } },
      dataReference: fields.data_reference,
      alertDataValue: fields.alert_data_value ? parseInt(fields.alert_data_value) : undefined,
      alertSensorId: fields.alert_sensor_id ? parseInt(fields.alert_sensor_id) : undefined,
    };
  }

  private parseDataRecordData(fields: any): DataRecordData {
    return {
      id: fields.id?.id || '',
      dataId: parseInt(fields.data_id || '0'),
      sensorType: parseInt(fields.sensor_type || '0'),
      submittedBy: fields.submitted_by || '',
      dataHash: Buffer.from(fields.data_hash || []).toString('hex'),
      metadata: fields.metadata || '',
      timestamp: fields.timestamp || '',
      value: parseInt(fields.value || '0'),
      triggeredAlert: fields.triggered_alert || false,
      alertProposalId: fields.alert_proposal_id,
    };
  }

  private parseBooleanResult(result: any): boolean {
    return result.returnValues?.[0] === true || result.returnValues?.[0] === 'true';
  }

  // ================================
  // ERROR HANDLING
  // ================================

  private createDaoError(code: DaoErrorCodes, message: string, details?: any): DaoError {
    return {
      code,
      message,
      details,
    };
  }

  // ================================
  // STATIC UTILITY METHODS
  // ================================

  public static getNetworkUrl(network: 'mainnet' | 'testnet' | 'devnet' | 'localnet'): string {
    switch (network) {
      case 'mainnet':
        return getFullnodeUrl('mainnet');
      case 'testnet':
        return getFullnodeUrl('testnet');
      case 'devnet':
        return getFullnodeUrl('devnet');
      case 'localnet':
        return getFullnodeUrl('localnet');
      default:
        return getFullnodeUrl('devnet');
    }
  }

  public static createSuiService(config: Partial<SuiServiceConfig> & { packageId: string; daoObjectId: string }): SuiService {
    const fullConfig: SuiServiceConfig = {
      rpcUrl: config.rpcUrl || SuiService.getNetworkUrl('devnet'),
      packageId: config.packageId,
      daoObjectId: config.daoObjectId,
      networkType: config.networkType || 'devnet',
    };

    return new SuiService(fullConfig);
  }

  // ================================
  // TRANSACTION EXECUTION HELPERS
  // ================================

  public async estimateGasCost(tx: Transaction, sender: string): Promise<{ totalGas: string; gasPrice: string }> {
    try {
      const response = await this.client.dryRunTransactionBlock({
        transactionBlock: await tx.build({ client: this.client }),
      });

      return {
        totalGas: response.effects.gasUsed?.computationCost || '0',
        gasPrice: response.effects.gasUsed?.storageCost || '0',
      };
    } catch (error) {
      console.error('Error estimating gas cost:', error);
      throw this.createDaoError(DaoErrorCodes.NETWORK_ERROR, 'Failed to estimate gas cost', error);
    }
  }

  public async simulateTransaction(tx: Transaction): Promise<any> {
    try {
      const response = await this.client.dryRunTransactionBlock({
        transactionBlock: await tx.build({ client: this.client }),
      });

      return response;
    } catch (error) {
      console.error('Error simulating transaction:', error);
      throw this.createDaoError(DaoErrorCodes.NETWORK_ERROR, 'Failed to simulate transaction', error);
    }
  }

  // ================================
  // VALIDATION METHODS
  // ================================

  public validateTransaction(tx: Transaction): boolean {
    try {
      // Basic validation - check if transaction has move calls
      return true; // Placeholder - implement specific validation logic
    } catch (error) {
      console.error('Error validating transaction:', error);
      return false;
    }
  }

  public validateObjectId(objectId: string): boolean {
    try {
      return /^0x[a-fA-F0-9]{64}$/.test(objectId);
    } catch {
      return false;
    }
  }

  public validatePackageId(packageId: string): boolean {
    try {
      return /^0x[a-fA-F0-9]{64}$/.test(packageId);
    } catch {
      return false;
    }
  }
} 