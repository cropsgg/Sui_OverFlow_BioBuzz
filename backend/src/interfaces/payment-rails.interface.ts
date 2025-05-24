// Payment Rails Interface Types for Lab Escrow, Marketplace, and Research Incentives

export interface EscrowConfig {
  packageId: string;
  rpcUrl: string;
}

export interface MarketplaceConfig {
  packageId: string;
  rpcUrl: string;
}

export interface IncentivesConfig {
  packageId: string;
  rpcUrl: string;
}

// ===== ESCROW INTERFACES =====

export interface EscrowAccountData {
  id: string;
  funder: string;
  beneficiary: string;
  totalAmount: number;
  depositedAmount: number;
  paidAmount: number;
  currencyType: string;
  status: EscrowStatus;
  milestoneCount: number;
  createdAt: number;
  daoReference?: string;
}

export interface MilestoneData {
  index: number;
  description: string;
  amount: number;
  dueDate: number;
  status: MilestoneStatus;
  proofLink?: string;
  approvalProposalId?: string;
}

export enum EscrowStatus {
  ACTIVE = 0,
  COMPLETED = 1,
  DISPUTED = 2,
  CANCELLED = 3
}

export enum MilestoneStatus {
  PENDING = 0,
  SUBMITTED = 1,
  APPROVED = 2,
  REJECTED = 3,
  PAID = 4
}

export interface CreateEscrowRequest {
  funder: string;
  beneficiary: string;
  totalAmount: number;
  daoReference?: string;
}

export interface DepositFundsRequest {
  escrowId: string;
  amount: number;
  senderAddress: string;
}

export interface CreateMilestoneRequest {
  escrowId: string;
  description: string;
  amount: number;
  dueDate: number;
  approvalProposalId?: string;
  senderAddress: string;
}

export interface SubmitMilestoneRequest {
  escrowId: string;
  milestoneIndex: number;
  proofLink: string;
  senderAddress: string;
}

export interface ApproveMilestoneRequest {
  escrowId: string;
  milestoneIndex: number;
  senderAddress: string;
}

export interface RejectMilestoneRequest {
  escrowId: string;
  milestoneIndex: number;
  reason: string;
  senderAddress: string;
}

export interface ReleaseMilestonePaymentRequest {
  escrowId: string;
  milestoneIndex: number;
  senderAddress: string;
}

// ===== MARKETPLACE INTERFACES =====

export interface MarketplaceData {
  id: string;
  name: string;
  description: string;
  admin: string;
  totalFees: number;
  serviceFeeRate: number;
  categories: string[];
}

export interface ServiceListingData {
  id: string;
  provider: string;
  title: string;
  description: string;
  category: number;
  pricePerUnit: number;
  availability: boolean;
  totalSales: number;
  rating: number;
  reviewCount: number;
  metadata: string;
  createdAt: number;
}

export interface ServiceAgreementData {
  id: string;
  listingId: string;
  buyer: string;
  provider: string;
  quantity: number;
  totalPrice: number;
  deliveryDeadline?: number;
  status: AgreementStatus;
  deliveryProof?: string;
  rating?: number;
  createdAt: number;
}

export enum AgreementStatus {
  PENDING = 0,
  DELIVERED = 1,
  CONFIRMED = 2,
  DISPUTED = 3,
  CANCELLED = 4
}

export interface CreateMarketplaceRequest {
  name: string;
  description: string;
  initialTreasury: number;
  senderAddress: string;
}

export interface ListServiceRequest {
  marketplaceId: string;
  title: string;
  description: string;
  category: number;
  pricePerUnit: number;
  metadata: string;
  availability?: boolean;
  senderAddress: string;
}

export interface PurchaseServiceRequest {
  marketplaceId: string;
  listingId: string;
  quantity: number;
  amount: number;
  deliveryDeadline?: number;
  senderAddress: string;
}

export interface DeliverServiceRequest {
  agreementId: string;
  deliveryProof: string;
  senderAddress: string;
}

export interface ConfirmDeliveryRequest {
  marketplaceId: string;
  agreementId: string;
  rating?: number;
  senderAddress: string;
}

// ===== RESEARCH INCENTIVES INTERFACES =====

export interface IncentivesRegistryData {
  id: string;
  admin: string;
  contributionTypes: ContributionType[];
  totalPools: number;
  totalContributions: number;
}

export interface ContributionType {
  id: number;
  name: string;
  description: string;
  baseReward: number;
}

export interface RewardPoolData {
  id: string;
  admin: string;
  name: string;
  description: string;
  criteria: string;
  eligibleTypes: number[];
  totalFunds: number;
  distributedAmount: number;
  isActive: boolean;
  createdAt: number;
  deadline?: number;
}

export interface ContributionReceiptData {
  id: string;
  contributor: string;
  contributionType: number;
  referenceId: string;
  title: string;
  description: string;
  metadata: string;
  status: ContributionStatus;
  rewardAmount?: number;
  evaluationNotes?: string;
  submittedAt: number;
  evaluatedAt?: number;
}

export enum ContributionStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
  REWARDED = 3
}

export interface RoyaltySplitAgreementData {
  id: string;
  ipReference: string;
  beneficiaries: string[];
  shares: number[];
  totalRoyalties: number;
  distributedAmount: number;
  isActive: boolean;
  createdAt: number;
}

export interface CreateRewardPoolRequest {
  registryId: string;
  name: string;
  description: string;
  criteria: string;
  eligibleTypes: number[];
  initialFunds: number;
  deadline?: number;
  senderAddress: string;
}

export interface RegisterContributionRequest {
  registryId: string;
  contributionType: number;
  referenceId: string;
  title: string;
  description: string;
  metadata: string;
  senderAddress: string;
}

export interface EvaluateContributionRequest {
  registryId: string;
  poolId: string;
  receiptId: string;
  approved: boolean;
  rewardAmount: number;
  evaluationNotes?: string;
  senderAddress: string;
}

export interface CreateRoyaltySplitRequest {
  ipReference: string;
  beneficiaries: string[];
  shares: number[];
  senderAddress: string;
}

export interface DistributeRoyaltiesRequest {
  agreementId: string;
  amount: number;
  senderAddress: string;
}

// ===== COMMON TYPES =====

export interface TransactionResponse {
  success: boolean;
  transactionId?: string;
  objectId?: string;
  error?: string;
  gasUsed?: number;
}

export interface PaymentRailsError {
  code: PaymentRailsErrorCodes;
  message: string;
  details?: any;
}

export enum PaymentRailsErrorCodes {
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  OBJECT_NOT_FOUND = 'OBJECT_NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

export interface EventFilter {
  package?: string;
  module?: string;
  eventType?: string;
  sender?: string;
  fromCheckpoint?: string;
  toCheckpoint?: string;
}

export interface EscrowEvent {
  type: 'EscrowInitialized' | 'FundsDeposited' | 'MilestoneDefined' | 'MilestoneSubmitted' | 
        'MilestoneApproved' | 'MilestoneRejected' | 'MilestonePaymentReleased' | 
        'EscrowDisputed' | 'EscrowCancelled';
  escrowId: string;
  data: any;
  timestamp: number;
  transactionId: string;
}

export interface MarketplaceEvent {
  type: 'MarketplaceInitialized' | 'ServiceListed' | 'ServicePurchased' | 
        'ServiceDelivered' | 'DeliveryConfirmed' | 'ServiceDisputed';
  data: any;
  timestamp: number;
  transactionId: string;
}

export interface IncentivesEvent {
  type: 'IncentivesRegistryInitialized' | 'RewardPoolCreated' | 'ContributionRegistered' | 
        'ContributionEvaluated' | 'RewardDistributed' | 'RoyaltySplitCreated' | 
        'RoyaltiesDistributed';
  data: any;
  timestamp: number;
  transactionId: string;
} 