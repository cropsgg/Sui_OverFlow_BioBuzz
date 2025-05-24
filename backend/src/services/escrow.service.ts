import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { normalizeSuiAddress, isValidSuiAddress } from '@mysten/sui/utils';
import {
  EscrowConfig,
  EscrowAccountData,
  MilestoneData,
  EscrowStatus,
  MilestoneStatus,
  CreateEscrowRequest,
  DepositFundsRequest,
  CreateMilestoneRequest,
  SubmitMilestoneRequest,
  ApproveMilestoneRequest,
  RejectMilestoneRequest,
  ReleaseMilestonePaymentRequest,
  TransactionResponse,
  PaymentRailsError,
  PaymentRailsErrorCodes,
  EscrowEvent
} from '../interfaces/payment-rails.interface';

export class EscrowService {
  private client: SuiClient;
  private config: EscrowConfig;

  constructor(config: EscrowConfig) {
    this.config = config;
    this.client = new SuiClient({ url: config.rpcUrl });
  }

  // ================================
  // CONFIGURATION METHODS
  // ================================

  public getConfig(): EscrowConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<EscrowConfig>): void {
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

  // ================================
  // ESCROW READ OPERATIONS
  // ================================

  public async getEscrowAccount(escrowId: string): Promise<EscrowAccountData | null> {
    try {
      const response = await this.client.getObject({
        id: escrowId,
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

      return this.parseEscrowAccountData(content.fields);
    } catch (error) {
      console.error('Error getting escrow account:', error);
      throw this.createPaymentRailsError(PaymentRailsErrorCodes.NETWORK_ERROR, 'Failed to get escrow account', error);
    }
  }

  public async getMilestone(escrowId: string, milestoneIndex: number): Promise<MilestoneData | null> {
    try {
      const response = await this.client.devInspectTransactionBlock({
        transactionBlock: this.buildGetMilestoneTransaction(escrowId, milestoneIndex),
        sender: this.config.packageId, // Use package ID as dummy sender for inspection
      });

      if (!response.results || response.results.length === 0) {
        return null;
      }

      return this.parseMilestoneData(response.results[0]);
    } catch (error) {
      console.error('Error getting milestone:', error);
      throw this.createPaymentRailsError(PaymentRailsErrorCodes.NETWORK_ERROR, 'Failed to get milestone', error);
    }
  }

  public async getEscrowBalance(escrowId: string): Promise<number> {
    try {
      const response = await this.client.devInspectTransactionBlock({
        transactionBlock: this.buildGetEscrowBalanceTransaction(escrowId),
        sender: this.config.packageId,
      });

      if (!response.results || response.results.length === 0) {
        return 0;
      }

      return this.parseBalanceResult(response.results[0]);
    } catch (error) {
      console.error('Error getting escrow balance:', error);
      return 0;
    }
  }

  public async isMilestoneCompleted(escrowId: string, milestoneIndex: number): Promise<boolean> {
    try {
      const response = await this.client.devInspectTransactionBlock({
        transactionBlock: this.buildIsMilestoneCompletedTransaction(escrowId, milestoneIndex),
        sender: this.config.packageId,
      });

      if (!response.results || response.results.length === 0) {
        return false;
      }

      return this.parseBooleanResult(response.results[0]);
    } catch (error) {
      console.error('Error checking milestone completion:', error);
      return false;
    }
  }

  // ================================
  // TRANSACTION BUILDERS
  // ================================

  public buildInitializeEscrowTransaction(request: CreateEscrowRequest, senderAddress: string): Transaction {
    const tx = new Transaction();
    
    // Get current timestamp (in production, this would come from a reliable source)
    const currentTime = Date.now();
    
    tx.moveCall({
      target: `${this.config.packageId}::lab_escrow::initialize_escrow`,
      arguments: [
        tx.pure.address(request.funder),
        tx.pure.address(request.beneficiary),
        tx.pure.u64(request.totalAmount),
        request.daoReference ? tx.pure.option('id', request.daoReference) : tx.pure.option('id', null),
        tx.object('0x6'), // Clock object
      ],
    });

    return tx;
  }

  public buildDepositFundsTransaction(request: DepositFundsRequest, coinObjectId: string): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.config.packageId}::lab_escrow::deposit_funds_to_escrow`,
      arguments: [
        tx.object(request.escrowId),
        tx.object(coinObjectId),
      ],
    });

    return tx;
  }

  public buildCreateMilestoneTransaction(request: CreateMilestoneRequest): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.config.packageId}::lab_escrow::define_milestone`,
      arguments: [
        tx.object(request.escrowId),
        tx.pure.string(request.description),
        tx.pure.u64(request.amount),
        tx.pure.u64(request.dueDate),
        request.approvalProposalId ? tx.pure.option('id', request.approvalProposalId) : tx.pure.option('id', null),
      ],
    });

    return tx;
  }

  public buildSubmitMilestoneTransaction(request: SubmitMilestoneRequest): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.config.packageId}::lab_escrow::submit_milestone_for_approval`,
      arguments: [
        tx.object(request.escrowId),
        tx.pure.u64(request.milestoneIndex),
        tx.pure.string(request.proofLink),
      ],
    });

    return tx;
  }

  public buildApproveMilestoneTransaction(request: ApproveMilestoneRequest): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.config.packageId}::lab_escrow::approve_milestone`,
      arguments: [
        tx.object(request.escrowId),
        tx.pure.u64(request.milestoneIndex),
      ],
    });

    return tx;
  }

  public buildRejectMilestoneTransaction(request: RejectMilestoneRequest): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.config.packageId}::lab_escrow::reject_milestone`,
      arguments: [
        tx.object(request.escrowId),
        tx.pure.u64(request.milestoneIndex),
        tx.pure.string(request.reason),
      ],
    });

    return tx;
  }

  public buildReleaseMilestonePaymentTransaction(request: ReleaseMilestonePaymentRequest): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.config.packageId}::lab_escrow::release_milestone_payment`,
      arguments: [
        tx.object(request.escrowId),
        tx.pure.u64(request.milestoneIndex),
      ],
    });

    return tx;
  }

  public buildCancelEscrowTransaction(escrowId: string): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.config.packageId}::lab_escrow::cancel_escrow`,
      arguments: [
        tx.object(escrowId),
      ],
    });

    return tx;
  }

  public buildInitiateDisputeTransaction(escrowId: string, milestoneIndex: number | null, reason: string): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.config.packageId}::lab_escrow::initiate_dispute`,
      arguments: [
        tx.object(escrowId),
        milestoneIndex !== null ? tx.pure.option('u64', milestoneIndex) : tx.pure.option('u64', null),
        tx.pure.string(reason),
      ],
    });

    return tx;
  }

  // ================================
  // PRIVATE TRANSACTION BUILDERS
  // ================================

  private buildGetMilestoneTransaction(escrowId: string, milestoneIndex: number): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.config.packageId}::lab_escrow::get_milestone_info`,
      arguments: [
        tx.object(escrowId),
        tx.pure.u64(milestoneIndex),
      ],
    });

    return tx;
  }

  private buildGetEscrowBalanceTransaction(escrowId: string): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.config.packageId}::lab_escrow::get_escrow_balance`,
      arguments: [
        tx.object(escrowId),
      ],
    });

    return tx;
  }

  private buildIsMilestoneCompletedTransaction(escrowId: string, milestoneIndex: number): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.config.packageId}::lab_escrow::is_milestone_completed`,
      arguments: [
        tx.object(escrowId),
        tx.pure.u64(milestoneIndex),
      ],
    });

    return tx;
  }

  // ================================
  // EVENT HANDLING
  // ================================

  public async subscribeToEscrowEvents(
    escrowId: string,
    onEvent: (event: EscrowEvent) => void,
    onError?: (error: any) => void
  ): Promise<() => void> {
    try {
      const unsubscribe = await this.client.subscribeEvent({
        filter: {
          Package: this.config.packageId,
        } as any,
        onMessage: (event) => {
          try {
            const escrowEvent = this.parseEscrowEvent(event);
            if (escrowEvent.escrowId === escrowId) {
              onEvent(escrowEvent);
            }
          } catch (error) {
            console.error('Error parsing escrow event:', error);
            if (onError) onError(error);
          }
        },
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to escrow events:', error);
      if (onError) onError(error);
      return () => {};
    }
  }

  public async queryEscrowEvents(
    escrowId?: string,
    eventType?: string,
    fromCheckpoint?: string,
    toCheckpoint?: string,
    limit?: number
  ): Promise<EscrowEvent[]> {
    try {
      const events = await this.client.queryEvents({
        query: {
          Package: this.config.packageId,
        } as any,
        cursor: fromCheckpoint ? { eventSeq: fromCheckpoint, txDigest: '' } : null,
        limit: limit || 50,
        order: 'ascending',
      });

      return events.data
        .map(event => this.parseEscrowEvent(event))
        .filter(event => !escrowId || event.escrowId === escrowId);
    } catch (error) {
      console.error('Error querying escrow events:', error);
      throw this.createPaymentRailsError(PaymentRailsErrorCodes.NETWORK_ERROR, 'Failed to query escrow events', error);
    }
  }

  // ================================
  // PARSING METHODS
  // ================================

  private parseEscrowAccountData(fields: any): EscrowAccountData {
    return {
      id: fields.id.id,
      funder: fields.funder,
      beneficiary: fields.beneficiary,
      totalAmount: parseInt(fields.total_amount),
      depositedAmount: parseInt(fields.deposited_amount),
      paidAmount: parseInt(fields.paid_amount),
      currencyType: fields.currency_type,
      status: parseInt(fields.status.id) as EscrowStatus,
      milestoneCount: parseInt(fields.milestone_count),
      createdAt: parseInt(fields.created_at),
      daoReference: fields.dao_reference || undefined,
    };
  }

  private parseMilestoneData(result: any): MilestoneData {
    // Parse the result from get_milestone_info function
    const [description, amount, dueDate, status, proofLink] = result.returnValues;
    
    return {
      index: 0, // This would need to be passed separately
      description: description,
      amount: parseInt(amount),
      dueDate: parseInt(dueDate),
      status: parseInt(status) as MilestoneStatus,
      proofLink: proofLink || undefined,
    };
  }

  private parseBalanceResult(result: any): number {
    return parseInt(result.returnValues[0]);
  }

  private parseBooleanResult(result: any): boolean {
    return result.returnValues[0] === true;
  }

  private parseEscrowEvent(event: any): EscrowEvent {
    const eventType = event.type.split('::').pop();
    
    return {
      type: eventType as any,
      escrowId: event.parsedJson?.escrow_id || '',
      data: event.parsedJson,
      timestamp: parseInt(event.timestampMs),
      transactionId: event.id.txDigest,
    };
  }

  // ================================
  // ERROR HANDLING
  // ================================

  private createPaymentRailsError(code: PaymentRailsErrorCodes, message: string, details?: any): PaymentRailsError {
    return {
      code,
      message,
      details,
    };
  }

  // ================================
  // STATIC FACTORY METHODS
  // ================================

  public static createEscrowService(config: Partial<EscrowConfig> & { packageId: string }): EscrowService {
    const fullConfig: EscrowConfig = {
      rpcUrl: config.rpcUrl || getFullnodeUrl('devnet'),
      ...config,
    };

    return new EscrowService(fullConfig);
  }

  // ================================
  // VALIDATION METHODS
  // ================================

  public validateCreateEscrowRequest(request: CreateEscrowRequest): boolean {
    return (
      EscrowService.validateSuiAddress(request.funder) &&
      EscrowService.validateSuiAddress(request.beneficiary) &&
      request.totalAmount > 0 &&
      request.funder !== request.beneficiary
    );
  }

  public validateMilestoneRequest(request: CreateMilestoneRequest): boolean {
    return (
      EscrowService.validateSuiAddress(request.senderAddress) &&
      request.amount > 0 &&
      request.dueDate > Date.now() &&
      request.description.length > 0
    );
  }
} 