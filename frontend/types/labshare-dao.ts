// Types for LabShareDAO Frontend Integration

export interface SensorType {
  id: number;
  name: string;
}

export interface ThresholdConfig {
  sensor_type_id: number;
  min_value: number;
  max_value: number;
  description: string;
}

export interface Member {
  addr: string;
  name: string;
  joined_at: number;
  voting_power: number;
}

export interface DataRecord {
  id: string;
  data_id: number;
  sensor_type: number;
  submitted_by: string;
  data_hash: number[];
  metadata: string;
  timestamp: number;
  value: number;
  triggered_alert: boolean;
  alert_proposal_id?: string;
}

export interface Proposal {
  id: string;
  proposal_id: number;
  proposal_type: number; // 0: General, 1: Alert, 2: Configuration
  title: string;
  description: string;
  proposer: string;
  created_at: number;
  voting_end_time: number;
  executed: boolean;
  yes_votes: number;
  no_votes: number;
  voters: Record<string, boolean>;
  data_reference?: string;
  alert_data_value?: number;
  alert_sensor_id?: number;
}

export interface DAOInfo {
  id: string;
  name: string;
  description: string;
  admin: string;
  member_count: number;
}

// Event types
export interface MemberAddedEvent {
  dao_id: string;
  member: string;
  name: string;
}

export interface DataRecordCreatedEvent {
  dao_id: string;
  data_id: number;
  sensor_type: number;
  submitted_by: string;
  timestamp: number;
  triggered_alert: boolean;
}

export interface ProposalCreatedEvent {
  dao_id: string;
  proposal_id: number;
  proposal_type: number;
  title: string;
  proposer: string;
}

export interface VoteCastEvent {
  dao_id: string;
  proposal_id: number;
  voter: string;
  vote: boolean;
}

export interface ProposalExecutedEvent {
  dao_id: string;
  proposal_id: number;
  approved: boolean;
}

export interface AlertTriggeredEvent {
  dao_id: string;
  data_id: number;
  sensor_type: number;
  value: number;
  threshold_min: number;
  threshold_max: number;
  proposal_id: number;
}

// API Response types
export interface TransactionResult {
  success: boolean;
  digest?: string;
  error?: string;
}

export interface ProposalStatus {
  isActive: boolean;
  canVote: boolean;
  canExecute: boolean;
  quorumReached: boolean;
  approved: boolean;
  timeRemaining: number;
}

// Form types
export interface CreateProposalForm {
  title: string;
  description: string;
  proposal_type: 'general' | 'configuration';
}

export interface AddMemberForm {
  address: string;
  name: string;
}

export interface SubmitDataForm {
  sensor_type: number;
  data_hash: string;
  metadata: string;
  value: number;
}

export interface UpdateThresholdForm {
  sensor_type: number;
  min_value: number;
  max_value: number;
  description: string;
}

// Utility types
export type ProposalTypeLabel = 'General' | 'Alert' | 'Configuration';
export type VoteOption = 'yes' | 'no';
export type SensorTypeName = 'Temperature' | 'Humidity' | 'Pressure' | 'Luminosity';

// Constants
export const PROPOSAL_TYPES: Record<number, ProposalTypeLabel> = {
  0: 'General',
  1: 'Alert',
  2: 'Configuration'
};

export const SENSOR_TYPES: Record<number, SensorTypeName> = {
  0: 'Temperature',
  1: 'Humidity',
  2: 'Pressure',
  3: 'Luminosity'
};

export const DEFAULT_SENSOR_TYPES: SensorType[] = [
  { id: 0, name: 'Temperature' },
  { id: 1, name: 'Humidity' },
  { id: 2, name: 'Pressure' },
  { id: 3, name: 'Luminosity' }
]; 