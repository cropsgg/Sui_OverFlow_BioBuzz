import { ObjectId } from 'mongoose';

// ================================
// BLOCKCHAIN STRUCTURES
// ================================

export interface SuiObjectReference {
  objectId: string;
  version: string;
  digest: string;
}

export interface SuiTransactionBlock {
  digest: string;
  timestampMs: string;
  checkpoint: string;
  effects: {
    status: { status: string };
    gasUsed: {
      computationCost: string;
      storageCost: string;
      storageRebate: string;
      nonRefundableStorageFee: string;
    };
  };
}

// DAO Blockchain Structures
export interface DAOObjectData {
  id: string;
  name: string;
  description: string;
  admin: string;
  memberCount: number;
  treasury: {
    type: string;
    fields: {
      balance: string;
      id: { id: string };
    };
  };
  sensors: Array<{
    id: number;
    name: string;
  }>;
  thresholds: {
    type: string;
    fields: {
      id: { id: string };
      size: string;
    };
  };
  proposals: {
    type: string;
    fields: {
      id: { id: string };
      size: string;
    };
  };
  dataRecords: {
    type: string;
    fields: {
      id: { id: string };
      size: string;
    };
  };
  nextProposalId: string;
  nextDataId: string;
}

export interface MemberData {
  addr: string;
  name: string;
  joinedAt: string;
  votingPower: number;
}

export interface SensorTypeData {
  id: number;
  name: string;
}

export interface ThresholdConfigData {
  sensorTypeId: number;
  minValue: number;
  maxValue: number;
  description: string;
}

export interface ProposalData {
  id: string;
  proposalId: number;
  proposalType: number;
  title: string;
  description: string;
  proposer: string;
  createdAt: string;
  votingEndTime: string;
  executed: boolean;
  yesVotes: number;
  noVotes: number;
  voters: {
    type: string;
    fields: {
      id: { id: string };
      size: string;
    };
  };
  dataReference?: string;
  alertDataValue?: number;
  alertSensorId?: number;
}

export interface DataRecordData {
  id: string;
  dataId: number;
  sensorType: number;
  submittedBy: string;
  dataHash: string;
  metadata: string;
  timestamp: string;
  value: number;
  triggeredAlert: boolean;
  alertProposalId?: string;
}

export interface VoterData {
  address: string;
  vote: boolean;
}

// ================================
// BLOCKCHAIN EVENTS
// ================================

export interface MemberAddedEvent {
  addr: string;
  name: string;
  votingPower: number;
  timestamp: string;
}

export interface DataRecordCreatedEvent {
  recordId: string;
  dataId: number;
  sensorType: number;
  submittedBy: string;
  value: number;
  triggeredAlert: boolean;
  timestamp: string;
}

export interface ProposalCreatedEvent {
  proposalId: string;
  proposalSequentialId: number;
  proposalType: number;
  title: string;
  proposer: string;
  timestamp: string;
}

export interface VoteCastEvent {
  proposalId: string;
  voter: string;
  vote: boolean;
  votingPower: number;
  timestamp: string;
}

export interface ProposalExecutedEvent {
  proposalId: string;
  executed: boolean;
  approved: boolean;
  finalYesVotes: number;
  finalNoVotes: number;
  timestamp: string;
}

export interface AlertTriggeredEvent {
  recordId: string;
  sensorType: number;
  value: number;
  threshold: string;
  proposalId: string;
  timestamp: string;
}

// ================================
// MONGODB DOCUMENT INTERFACES
// ================================

export interface IDaoUserMapping {
  _id?: ObjectId;
  userId: ObjectId;
  suiAddress: string;
  isDaoMember: boolean;
  daoMemberDetails?: {
    name: string;
    joinedAt: Date;
    votingPower: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IDaoInfo {
  _id?: ObjectId;
  daoObjectId: string;
  name: string;
  description: string;
  adminSuiAddress: string;
  memberCount: number;
  treasuryBalance: number;
  nextProposalId: number;
  nextDataId: number;
  lastSyncedBlock?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISensorType {
  _id?: ObjectId;
  sensorTypeId: number;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IThresholdConfig {
  _id?: ObjectId;
  sensorTypeId: number;
  minValue: number;
  maxValue: number;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProposal {
  _id?: ObjectId;
  proposalObjectId: string;
  proposalSequentialId: number;
  type: number; // 0: General, 1: Alert, 2: Configuration
  title: string;
  description: string;
  proposerSuiAddress: string;
  createdAt: Date;
  votingEndTime: Date;
  executed: boolean;
  approved?: boolean;
  yesVotes: number;
  noVotes: number;
  voters: Array<{
    suiAddress: string;
    vote: boolean;
    votingPower: number;
    votedAt: Date;
  }>;
  dataReferenceObjectId?: string;
  alertDataValue?: number;
  alertSensorId?: number;
  executedAt?: Date;
  blockHeight?: string;
  transactionDigest?: string;
}

export interface IDataRecord {
  _id?: ObjectId;
  dataRecordObjectId: string;
  dataSequentialId: number;
  sensorType: number;
  submittedBySuiAddress: string;
  dataHash: string;
  metadata: string;
  timestamp: Date;
  value: number;
  triggeredAlert: boolean;
  alertProposalObjectId?: string;
  blockHeight?: string;
  transactionDigest?: string;
  processedAt: Date;
}

// ================================
// API REQUEST/RESPONSE INTERFACES
// ================================

// Request Interfaces
export interface AddMemberRequest {
  suiAddress: string;
  memberName: string;
}

export interface LinkSuiAddressRequest {
  suiAddress: string;
  signature?: string; // For address verification
}

export interface SubmitDataRequest {
  sensorType: number;
  dataHash: string;
  metadata: string;
  value: number;
}

export interface CreateProposalRequest {
  title: string;
  description: string;
  proposalType: number; // 0: General, 2: Configuration
}

export interface VoteRequest {
  vote: boolean; // true for yes, false for no
}

export interface UpdateThresholdRequest {
  minValue: number;
  maxValue: number;
  description: string;
}

export interface AddFundsRequest {
  amount: number; // Amount in SUI
}

// Response Interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TransactionResponse {
  transactionBlock: any;
  digest?: string;
  effects?: any;
}

export interface DaoInfoResponse {
  daoObjectId: string;
  name: string;
  description: string;
  adminSuiAddress: string;
  memberCount: number;
  treasuryBalance: number;
  totalProposals: number;
  totalDataRecords: number;
  activeProposals: number;
}

export interface MemberResponse {
  suiAddress: string;
  name: string;
  joinedAt: Date;
  votingPower: number;
  isDaoMember: boolean;
  totalDataSubmissions?: number;
  totalVotesCast?: number;
}

export interface ProposalResponse {
  proposalObjectId: string;
  proposalSequentialId: number;
  type: number;
  typeLabel: string; // "General", "Alert", "Configuration"
  title: string;
  description: string;
  proposerSuiAddress: string;
  proposerName?: string;
  createdAt: Date;
  votingEndTime: Date;
  executed: boolean;
  approved?: boolean;
  yesVotes: number;
  noVotes: number;
  totalVotes: number;
  voterCount: number;
  isActive: boolean;
  canVote?: boolean; // For authenticated requests
  userVote?: boolean | null; // User's vote if they voted
  dataReference?: {
    recordId: string;
    sensorType: number;
    value: number;
    metadata: string;
  };
}

export interface DataRecordResponse {
  dataRecordObjectId: string;
  dataSequentialId: number;
  sensorType: number;
  sensorTypeName: string;
  submittedBySuiAddress: string;
  submitterName?: string;
  dataHash: string;
  metadata: string;
  timestamp: Date;
  value: number;
  triggeredAlert: boolean;
  alertProposal?: {
    proposalId: string;
    title: string;
    status: string;
  };
  thresholdConfig?: {
    minValue: number;
    maxValue: number;
    description: string;
  };
}

export interface DashboardStatsResponse {
  totalMembers: number;
  totalProposals: number;
  activeProposals: number;
  totalDataRecords: number;
  recentAlerts: number;
  treasuryBalance: number;
  membershipGrowth: Array<{
    date: string;
    count: number;
  }>;
  proposalActivity: Array<{
    date: string;
    created: number;
    executed: number;
  }>;
  dataSubmissionTrends: Array<{
    date: string;
    submissions: number;
    alerts: number;
  }>;
}

// ================================
// SERVICE INTERFACES
// ================================

export interface SuiServiceConfig {
  rpcUrl: string;
  packageId: string;
  daoObjectId: string;
  networkType: 'mainnet' | 'testnet' | 'devnet' | 'localnet';
}

export interface EventSubscriptionConfig {
  eventTypes: string[];
  filter?: {
    Package?: string;
    Module?: string;
    EventType?: string;
  };
}

export interface EventProcessingResult {
  success: boolean;
  eventType: string;
  eventId: string;
  processed: boolean;
  error?: string;
}

// ================================
// UTILITY TYPES
// ================================

export enum ProposalType {
  GENERAL = 0,
  ALERT = 1,
  CONFIGURATION = 2
}

export enum SensorTypeEnum {
  TEMPERATURE = 0,
  HUMIDITY = 1,
  PRESSURE = 2,
  LUMINOSITY = 3
}

export enum ProposalStatus {
  ACTIVE = 'active',
  EXECUTED_APPROVED = 'executed_approved',
  EXECUTED_REJECTED = 'executed_rejected',
  EXPIRED = 'expired'
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProposalFilters extends PaginationQuery {
  type?: number;
  status?: ProposalStatus;
  proposer?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface DataRecordFilters extends PaginationQuery {
  sensorType?: number;
  submittedBy?: string;
  triggeredAlert?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  valueMin?: number;
  valueMax?: number;
}

export interface MemberFilters extends PaginationQuery {
  searchTerm?: string;
  sortBy?: 'name' | 'joinedAt' | 'votingPower';
}

// ================================
// ERROR TYPES
// ================================

export interface DaoError {
  code: string;
  message: string;
  details?: any;
}

export enum DaoErrorCodes {
  // Authentication/Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_DAO_MEMBER = 'NOT_DAO_MEMBER',
  NOT_DAO_ADMIN = 'NOT_DAO_ADMIN',
  
  // Validation
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_SUI_ADDRESS = 'INVALID_SUI_ADDRESS',
  INVALID_SENSOR_TYPE = 'INVALID_SENSOR_TYPE',
  INVALID_PROPOSAL_TYPE = 'INVALID_PROPOSAL_TYPE',
  
  // Business Logic
  ALREADY_DAO_MEMBER = 'ALREADY_DAO_MEMBER',
  ALREADY_VOTED = 'ALREADY_VOTED',
  PROPOSAL_NOT_ACTIVE = 'PROPOSAL_NOT_ACTIVE',
  PROPOSAL_ALREADY_EXECUTED = 'PROPOSAL_ALREADY_EXECUTED',
  INSUFFICIENT_VOTING_POWER = 'INSUFFICIENT_VOTING_POWER',
  
  // Blockchain
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  OBJECT_NOT_FOUND = 'OBJECT_NOT_FOUND',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // System
  DATABASE_ERROR = 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
} 