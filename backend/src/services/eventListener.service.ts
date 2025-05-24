import WebSocket from 'ws';
import { SuiService } from './sui.service';
import logger from './logger';
import {
  DaoUserMapping,
  DaoInfo,
  Proposal,
  DataRecord,
  SensorType,
  ThresholdConfig,
  getProposalTypeLabel,
  normalizeSuiAddress
} from '../models/dao.model';
import {
  MemberAddedEvent,
  DataRecordCreatedEvent,
  ProposalCreatedEvent,
  VoteCastEvent,
  ProposalExecutedEvent,
  AlertTriggeredEvent,
  EventProcessingResult,
  DaoErrorCodes
} from '../interfaces/dao.interface';

export class EventListenerService {
  private suiService: SuiService;
  private isListening: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 5000; // 5 seconds
  private unsubscribeCallback: (() => void) | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private lastEventTimestamp: number = Date.now();
  private processedEvents: Set<string> = new Set();

  constructor(suiService: SuiService) {
    this.suiService = suiService;
  }

  // ================================
  // MAIN EVENT LISTENER METHODS
  // ================================

  public async startListening(): Promise<void> {
    if (this.isListening) {
      logger.warn('Event listener is already running');
      return;
    }

    try {
      logger.info('Starting DAO event listener...');
      await this.subscribeToEvents();
      this.isListening = true;
      this.startHealthCheck();
      logger.info('DAO event listener started successfully');
    } catch (error) {
      logger.error('Failed to start event listener:', error);
      throw error;
    }
  }

  public async stopListening(): Promise<void> {
    if (!this.isListening) {
      logger.warn('Event listener is not running');
      return;
    }

    try {
      logger.info('Stopping DAO event listener...');
      this.isListening = false;
      
      if (this.unsubscribeCallback) {
        this.unsubscribeCallback();
        this.unsubscribeCallback = null;
      }

      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }

      logger.info('DAO event listener stopped successfully');
    } catch (error) {
      logger.error('Error stopping event listener:', error);
      throw error;
    }
  }

  public getStatus(): {
    isListening: boolean;
    reconnectAttempts: number;
    lastEventTimestamp: number;
    processedEventsCount: number;
  } {
    return {
      isListening: this.isListening,
      reconnectAttempts: this.reconnectAttempts,
      lastEventTimestamp: this.lastEventTimestamp,
      processedEventsCount: this.processedEvents.size,
    };
  }

  // ================================
  // EVENT SUBSCRIPTION METHODS
  // ================================

  private async subscribeToEvents(): Promise<void> {
    try {
      const eventFilter = await this.suiService.getEventFilter();
      
      this.unsubscribeCallback = await this.suiService.subscribeToEvents(
        eventFilter,
        this.handleEvent.bind(this),
        this.handleEventError.bind(this)
      );

      this.reconnectAttempts = 0;
      logger.info('Successfully subscribed to DAO events');
    } catch (error) {
      logger.error('Failed to subscribe to events:', error);
      await this.handleReconnection(error);
    }
  }

  private async handleEvent(event: any): Promise<void> {
    try {
      this.lastEventTimestamp = Date.now();
      
      // Prevent processing duplicate events
      const eventId = this.generateEventId(event);
      if (this.processedEvents.has(eventId)) {
        logger.debug('Skipping duplicate event:', eventId);
        return;
      }

      this.processedEvents.add(eventId);
      
      // Cleanup old processed events (keep only last 1000)
      if (this.processedEvents.size > 1000) {
        const eventsArray = Array.from(this.processedEvents);
        this.processedEvents = new Set(eventsArray.slice(-1000));
      }

      logger.info('Processing event:', {
        eventId,
        type: event.type,
        timestamp: event.timestampMs
      });

      const result = await this.processEvent(event);
      
      if (result.success) {
        logger.info('Event processed successfully:', result);
      } else {
        logger.error('Event processing failed:', result);
      }
    } catch (error) {
      logger.error('Error handling event:', error);
    }
  }

  private async handleEventError(error: any): Promise<void> {
    logger.error('Event subscription error:', error);
    
    if (this.isListening) {
      await this.handleReconnection(error);
    }
  }

  // ================================
  // EVENT PROCESSING METHODS
  // ================================

  private async processEvent(event: any): Promise<EventProcessingResult> {
    const eventType = this.extractEventType(event);
    const eventId = this.generateEventId(event);

    try {
      switch (eventType) {
        case 'MemberAdded':
          return await this.processMemberAddedEvent(event, eventId);
        
        case 'DataRecordCreated':
          return await this.processDataRecordCreatedEvent(event, eventId);
        
        case 'ProposalCreated':
          return await this.processProposalCreatedEvent(event, eventId);
        
        case 'VoteCast':
          return await this.processVoteCastEvent(event, eventId);
        
        case 'ProposalExecuted':
          return await this.processProposalExecutedEvent(event, eventId);
        
        case 'AlertTriggered':
          return await this.processAlertTriggeredEvent(event, eventId);
        
        default:
          logger.warn('Unknown event type:', eventType);
          return {
            success: false,
            eventType,
            eventId,
            processed: false,
            error: 'Unknown event type'
          };
      }
    } catch (error) {
      logger.error(`Error processing ${eventType} event:`, error);
      return {
        success: false,
        eventType,
        eventId,
        processed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async processMemberAddedEvent(event: any, eventId: string): Promise<EventProcessingResult> {
    try {
      const eventData: MemberAddedEvent = this.parseEventData(event);
      
      // Update DaoUserMapping
      await DaoUserMapping.findOneAndUpdate(
        { suiAddress: normalizeSuiAddress(eventData.addr) },
        {
          isDaoMember: true,
          daoMemberDetails: {
            name: eventData.name,
            joinedAt: new Date(parseInt(eventData.timestamp)),
            votingPower: eventData.votingPower
          }
        },
        { upsert: false } // Only update existing mappings
      );

      // Update DAO info member count
      const daoConfig = this.suiService.getConfig();
      await DaoInfo.findOneAndUpdate(
        { daoObjectId: daoConfig.daoObjectId },
        { $inc: { memberCount: 1 } }
      );

      logger.info('Member added event processed:', {
        address: eventData.addr,
        name: eventData.name,
        votingPower: eventData.votingPower
      });

      return {
        success: true,
        eventType: 'MemberAdded',
        eventId,
        processed: true
      };
    } catch (error) {
      logger.error('Error processing MemberAdded event:', error);
      throw error;
    }
  }

  private async processDataRecordCreatedEvent(event: any, eventId: string): Promise<EventProcessingResult> {
    try {
      const eventData: DataRecordCreatedEvent = this.parseEventData(event);
      
      // Get full data record details from blockchain
      const dataRecord = await this.suiService.getDataRecord(eventData.recordId);
      if (!dataRecord) {
        throw new Error('Data record not found on blockchain');
      }

      // Create DataRecord document
      const newDataRecord = new DataRecord({
        dataRecordObjectId: eventData.recordId,
        dataSequentialId: eventData.dataId,
        sensorType: eventData.sensorType,
        submittedBySuiAddress: normalizeSuiAddress(eventData.submittedBy),
        dataHash: dataRecord.dataHash,
        metadata: dataRecord.metadata,
        timestamp: new Date(parseInt(eventData.timestamp)),
        value: eventData.value,
        triggeredAlert: eventData.triggeredAlert,
        blockHeight: event.parsedJson?.blockHeight,
        transactionDigest: event.id?.txDigest,
        processedAt: new Date()
      });

      await newDataRecord.save();

      logger.info('Data record created event processed:', {
        recordId: eventData.recordId,
        dataId: eventData.dataId,
        sensorType: eventData.sensorType,
        value: eventData.value,
        triggeredAlert: eventData.triggeredAlert
      });

      return {
        success: true,
        eventType: 'DataRecordCreated',
        eventId,
        processed: true
      };
    } catch (error) {
      logger.error('Error processing DataRecordCreated event:', error);
      throw error;
    }
  }

  private async processProposalCreatedEvent(event: any, eventId: string): Promise<EventProcessingResult> {
    try {
      const eventData: ProposalCreatedEvent = this.parseEventData(event);
      
      // Get full proposal details from blockchain
      const proposal = await this.suiService.getProposal(eventData.proposalId);
      if (!proposal) {
        throw new Error('Proposal not found on blockchain');
      }

      // Create Proposal document
      const newProposal = new Proposal({
        proposalObjectId: eventData.proposalId,
        proposalSequentialId: eventData.proposalSequentialId,
        type: eventData.proposalType,
        title: eventData.title,
        description: proposal.description,
        proposerSuiAddress: normalizeSuiAddress(eventData.proposer),
        createdAt: new Date(parseInt(eventData.timestamp)),
        votingEndTime: new Date(parseInt(proposal.votingEndTime)),
        executed: false,
        yesVotes: 0,
        noVotes: 0,
        voters: [],
        dataReferenceObjectId: proposal.dataReference,
        alertDataValue: proposal.alertDataValue,
        alertSensorId: proposal.alertSensorId,
        blockHeight: event.parsedJson?.blockHeight,
        transactionDigest: event.id?.txDigest
      });

      await newProposal.save();

      logger.info('Proposal created event processed:', {
        proposalId: eventData.proposalId,
        sequentialId: eventData.proposalSequentialId,
        type: eventData.proposalType,
        title: eventData.title,
        proposer: eventData.proposer
      });

      return {
        success: true,
        eventType: 'ProposalCreated',
        eventId,
        processed: true
      };
    } catch (error) {
      logger.error('Error processing ProposalCreated event:', error);
      throw error;
    }
  }

  private async processVoteCastEvent(event: any, eventId: string): Promise<EventProcessingResult> {
    try {
      const eventData: VoteCastEvent = this.parseEventData(event);
      
      // Update Proposal document
      const updateData: any = {
        $inc: eventData.vote 
          ? { yesVotes: eventData.votingPower }
          : { noVotes: eventData.votingPower },
        $push: {
          voters: {
            suiAddress: normalizeSuiAddress(eventData.voter),
            vote: eventData.vote,
            votingPower: eventData.votingPower,
            votedAt: new Date(parseInt(eventData.timestamp))
          }
        }
      };

      await Proposal.findOneAndUpdate(
        { proposalObjectId: eventData.proposalId },
        updateData
      );

      logger.info('Vote cast event processed:', {
        proposalId: eventData.proposalId,
        voter: eventData.voter,
        vote: eventData.vote,
        votingPower: eventData.votingPower
      });

      return {
        success: true,
        eventType: 'VoteCast',
        eventId,
        processed: true
      };
    } catch (error) {
      logger.error('Error processing VoteCast event:', error);
      throw error;
    }
  }

  private async processProposalExecutedEvent(event: any, eventId: string): Promise<EventProcessingResult> {
    try {
      const eventData: ProposalExecutedEvent = this.parseEventData(event);
      
      // Update Proposal document
      await Proposal.findOneAndUpdate(
        { proposalObjectId: eventData.proposalId },
        {
          executed: true,
          approved: eventData.approved,
          yesVotes: eventData.finalYesVotes,
          noVotes: eventData.finalNoVotes,
          executedAt: new Date(parseInt(eventData.timestamp))
        }
      );

      logger.info('Proposal executed event processed:', {
        proposalId: eventData.proposalId,
        executed: eventData.executed,
        approved: eventData.approved,
        finalYesVotes: eventData.finalYesVotes,
        finalNoVotes: eventData.finalNoVotes
      });

      return {
        success: true,
        eventType: 'ProposalExecuted',
        eventId,
        processed: true
      };
    } catch (error) {
      logger.error('Error processing ProposalExecuted event:', error);
      throw error;
    }
  }

  private async processAlertTriggeredEvent(event: any, eventId: string): Promise<EventProcessingResult> {
    try {
      const eventData: AlertTriggeredEvent = this.parseEventData(event);
      
      // Update DataRecord with alert proposal ID
      await DataRecord.findOneAndUpdate(
        { dataRecordObjectId: eventData.recordId },
        {
          triggeredAlert: true,
          alertProposalObjectId: eventData.proposalId
        }
      );

      logger.info('Alert triggered event processed:', {
        recordId: eventData.recordId,
        sensorType: eventData.sensorType,
        value: eventData.value,
        threshold: eventData.threshold,
        proposalId: eventData.proposalId
      });

      return {
        success: true,
        eventType: 'AlertTriggered',
        eventId,
        processed: true
      };
    } catch (error) {
      logger.error('Error processing AlertTriggered event:', error);
      throw error;
    }
  }

  // ================================
  // HEALTH CHECK AND RECONNECTION
  // ================================

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(() => {
      const timeSinceLastEvent = Date.now() - this.lastEventTimestamp;
      const maxIdleTime = 300000; // 5 minutes

      if (timeSinceLastEvent > maxIdleTime && this.isListening) {
        logger.warn('Event listener seems idle, checking connection...');
        this.checkConnection();
      }
    }, 60000); // Check every minute
  }

  private async checkConnection(): Promise<void> {
    try {
      // Test connection by getting latest checkpoint
      await this.suiService.getLatestCheckpoint();
      logger.info('Connection check passed');
    } catch (error) {
      logger.error('Connection check failed:', error);
      if (this.isListening) {
        await this.handleReconnection(error);
      }
    }
  }

  private async handleReconnection(error: any): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached. Stopping event listener.');
      await this.stopListening();
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    logger.info(`Attempting reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);

    setTimeout(async () => {
      try {
        if (this.unsubscribeCallback) {
          this.unsubscribeCallback();
          this.unsubscribeCallback = null;
        }

        await this.subscribeToEvents();
        logger.info('Reconnection successful');
      } catch (reconnectError) {
        logger.error('Reconnection failed:', reconnectError);
        await this.handleReconnection(reconnectError);
      }
    }, delay);
  }

  // ================================
  // UTILITY METHODS
  // ================================

  private extractEventType(event: any): string {
    try {
      if (event.type) {
        const parts = event.type.split('::');
        return parts[parts.length - 1];
      }
      return 'Unknown';
    } catch (error) {
      logger.error('Error extracting event type:', error);
      return 'Unknown';
    }
  }

  private generateEventId(event: any): string {
    try {
      return `${event.id?.txDigest || 'unknown'}_${event.id?.eventSeq || 'unknown'}`;
    } catch (error) {
      logger.error('Error generating event ID:', error);
      return `unknown_${Date.now()}_${Math.random()}`;
    }
  }

  private parseEventData(event: any): any {
    try {
      return event.parsedJson || event.bcs || {};
    } catch (error) {
      logger.error('Error parsing event data:', error);
      return {};
    }
  }

  // ================================
  // MANUAL SYNC METHODS
  // ================================

  public async syncFromCheckpoint(fromCheckpoint?: string): Promise<void> {
    try {
      logger.info('Starting manual sync from checkpoint:', fromCheckpoint);
      
      const events = await this.suiService.queryEvents(
        undefined, // Get all event types
        fromCheckpoint,
        undefined,
        1000 // Limit to 1000 events per sync
      );

      let processedCount = 0;
      let errorCount = 0;

      for (const event of events.data) {
        try {
          const eventId = this.generateEventId(event);
          if (!this.processedEvents.has(eventId)) {
            const result = await this.processEvent(event);
            if (result.success) {
              processedCount++;
              this.processedEvents.add(eventId);
            } else {
              errorCount++;
            }
          }
        } catch (error) {
          errorCount++;
          logger.error('Error processing event during sync:', error);
        }
      }

      logger.info('Manual sync completed:', {
        totalEvents: events.data.length,
        processedCount,
        errorCount,
        hasNextPage: events.hasNextPage
      });

      // Continue syncing if there are more events
      if (events.hasNextPage && events.nextCursor) {
        await this.syncFromCheckpoint(events.nextCursor as unknown as string);
      }
    } catch (error) {
      logger.error('Error during manual sync:', error);
      throw error;
    }
  }

  public async syncRecentEvents(hours: number = 24): Promise<void> {
    try {
      logger.info(`Syncing recent events from last ${hours} hours`);
      
      // Calculate timestamp for the start of sync period
      const syncStartTime = Date.now() - (hours * 60 * 60 * 1000);
      
      const events = await this.suiService.queryEvents();
      
      let syncedCount = 0;
      
      for (const event of events.data) {
        const eventTimestamp = parseInt(event.timestampMs || '0');
        
        if (eventTimestamp >= syncStartTime) {
          const eventId = this.generateEventId(event);
          if (!this.processedEvents.has(eventId)) {
            try {
              const result = await this.processEvent(event);
              if (result.success) {
                syncedCount++;
                this.processedEvents.add(eventId);
              }
            } catch (error) {
              logger.error('Error processing recent event:', error);
            }
          }
        }
      }

      logger.info(`Recent events sync completed. Synced ${syncedCount} events.`);
    } catch (error) {
      logger.error('Error syncing recent events:', error);
      throw error;
    }
  }

  // ================================
  // CLEANUP METHODS
  // ================================

  public clearProcessedEvents(): void {
    this.processedEvents.clear();
    logger.info('Cleared processed events cache');
  }

  public async cleanup(): Promise<void> {
    await this.stopListening();
    this.clearProcessedEvents();
    logger.info('Event listener service cleaned up');
  }
} 