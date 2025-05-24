import mongoose, { Schema, Model } from 'mongoose';
import {
  IDaoUserMapping,
  IDaoInfo,
  ISensorType,
  IThresholdConfig,
  IProposal,
  IDataRecord
} from '../interfaces/dao.interface';

// ================================
// DAO USER MAPPING SCHEMA
// ================================
const DaoUserMappingSchema = new Schema<IDaoUserMapping>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  suiAddress: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        // Basic Sui address validation (starts with 0x and has 64 hex characters)
        return /^0x[a-fA-F0-9]{64}$/.test(v);
      },
      message: 'Invalid Sui address format'
    }
  },
  isDaoMember: {
    type: Boolean,
    default: false
  },
  daoMemberDetails: {
    name: {
      type: String,
      trim: true
    },
    joinedAt: {
      type: Date
    },
    votingPower: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
DaoUserMappingSchema.index({ userId: 1, suiAddress: 1 });
DaoUserMappingSchema.index({ suiAddress: 1 }, { unique: true });
DaoUserMappingSchema.index({ isDaoMember: 1 });

// ================================
// DAO INFO SCHEMA
// ================================
const DaoInfoSchema = new Schema<IDaoInfo>({
  daoObjectId: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  adminSuiAddress: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^0x[a-fA-F0-9]{64}$/.test(v);
      },
      message: 'Invalid admin Sui address format'
    }
  },
  memberCount: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  treasuryBalance: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  nextProposalId: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  nextDataId: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  lastSyncedBlock: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
DaoInfoSchema.index({ daoObjectId: 1 }, { unique: true });

// ================================
// SENSOR TYPE SCHEMA
// ================================
const SensorTypeSchema = new Schema<ISensorType>({
  sensorTypeId: {
    type: Number,
    required: true,
    min: 0
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
SensorTypeSchema.index({ sensorTypeId: 1 }, { unique: true });
SensorTypeSchema.index({ isActive: 1 });

// ================================
// THRESHOLD CONFIG SCHEMA
// ================================
const ThresholdConfigSchema = new Schema<IThresholdConfig>({
  sensorTypeId: {
    type: Number,
    required: true,
    ref: 'SensorType',
    min: 0
  },
  minValue: {
    type: Number,
    required: true
  },
  maxValue: {
    type: Number,
    required: true,
    validate: {
      validator: function(this: IThresholdConfig, value: number) {
        return value > this.minValue;
      },
      message: 'Max value must be greater than min value'
    }
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
ThresholdConfigSchema.index({ sensorTypeId: 1 });
ThresholdConfigSchema.index({ isActive: 1 });
ThresholdConfigSchema.index({ sensorTypeId: 1, isActive: 1 });

// ================================
// PROPOSAL SCHEMA
// ================================
const ProposalSchema = new Schema<IProposal>({
  proposalObjectId: {
    type: String,
    required: true,
    trim: true
  },
  proposalSequentialId: {
    type: Number,
    required: true,
    min: 1
  },
  type: {
    type: Number,
    required: true,
    enum: [0, 1, 2] // 0: General, 1: Alert, 2: Configuration
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  proposerSuiAddress: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^0x[a-fA-F0-9]{64}$/.test(v);
      },
      message: 'Invalid proposer Sui address format'
    }
  },
  createdAt: {
    type: Date,
    required: true
  },
  votingEndTime: {
    type: Date,
    required: true
  },
  executed: {
    type: Boolean,
    default: false
  },
  approved: {
    type: Boolean,
    default: null
  },
  yesVotes: {
    type: Number,
    default: 0,
    min: 0
  },
  noVotes: {
    type: Number,
    default: 0,
    min: 0
  },
  voters: [{
    suiAddress: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    vote: {
      type: Boolean,
      required: true
    },
    votingPower: {
      type: Number,
      required: true,
      min: 0
    },
    votedAt: {
      type: Date,
      required: true,
      default: Date.now
    }
  }],
  dataReferenceObjectId: {
    type: String,
    trim: true
  },
  alertDataValue: {
    type: Number
  },
  alertSensorId: {
    type: Number,
    min: 0
  },
  executedAt: {
    type: Date
  },
  blockHeight: {
    type: String,
    trim: true
  },
  transactionDigest: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
ProposalSchema.index({ proposalObjectId: 1 }, { unique: true });
ProposalSchema.index({ proposalSequentialId: 1 });
ProposalSchema.index({ type: 1 });
ProposalSchema.index({ executed: 1 });
ProposalSchema.index({ proposerSuiAddress: 1 });
ProposalSchema.index({ createdAt: -1 });
ProposalSchema.index({ votingEndTime: 1 });
ProposalSchema.index({ type: 1, executed: 1 });
ProposalSchema.index({ 'voters.suiAddress': 1 });
ProposalSchema.index({ dataReferenceObjectId: 1 });

// Virtual for total votes
ProposalSchema.virtual('totalVotes').get(function(this: IProposal) {
  return this.yesVotes + this.noVotes;
});

// Virtual for voter count
ProposalSchema.virtual('voterCount').get(function(this: IProposal) {
  return this.voters.length;
});

// Virtual for active status
ProposalSchema.virtual('isActive').get(function(this: IProposal) {
  return !this.executed && new Date() < this.votingEndTime;
});

// Method to check if user has voted
ProposalSchema.methods.hasUserVoted = function(suiAddress: string): boolean {
  return this.voters.some((voter: any) => voter.suiAddress.toLowerCase() === suiAddress.toLowerCase());
};

// Method to get user's vote
ProposalSchema.methods.getUserVote = function(suiAddress: string): boolean | null {
  const voter = this.voters.find((voter: any) => voter.suiAddress.toLowerCase() === suiAddress.toLowerCase());
  return voter ? voter.vote : null;
};

// ================================
// DATA RECORD SCHEMA
// ================================
const DataRecordSchema = new Schema<IDataRecord>({
  dataRecordObjectId: {
    type: String,
    required: true,
    trim: true
  },
  dataSequentialId: {
    type: Number,
    required: true,
    min: 1
  },
  sensorType: {
    type: Number,
    required: true,
    ref: 'SensorType',
    min: 0
  },
  submittedBySuiAddress: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^0x[a-fA-F0-9]{64}$/.test(v);
      },
      message: 'Invalid submitter Sui address format'
    }
  },
  dataHash: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        // Basic hex hash validation
        return /^[a-fA-F0-9]+$/.test(v);
      },
      message: 'Invalid data hash format'
    }
  },
  metadata: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  timestamp: {
    type: Date,
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  triggeredAlert: {
    type: Boolean,
    default: false
  },
  alertProposalObjectId: {
    type: String,
    trim: true
  },
  blockHeight: {
    type: String,
    trim: true
  },
  transactionDigest: {
    type: String,
    trim: true
  },
  processedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
DataRecordSchema.index({ dataRecordObjectId: 1 }, { unique: true });
DataRecordSchema.index({ dataSequentialId: 1 });
DataRecordSchema.index({ sensorType: 1 });
DataRecordSchema.index({ submittedBySuiAddress: 1 });
DataRecordSchema.index({ timestamp: -1 });
DataRecordSchema.index({ value: 1 });
DataRecordSchema.index({ triggeredAlert: 1 });
DataRecordSchema.index({ processedAt: -1 });
DataRecordSchema.index({ sensorType: 1, timestamp: -1 });
DataRecordSchema.index({ submittedBySuiAddress: 1, timestamp: -1 });
DataRecordSchema.index({ triggeredAlert: 1, timestamp: -1 });
DataRecordSchema.index({ alertProposalObjectId: 1 });

// Compound indexes for common queries
DataRecordSchema.index({ sensorType: 1, triggeredAlert: 1, timestamp: -1 });
DataRecordSchema.index({ submittedBySuiAddress: 1, sensorType: 1, timestamp: -1 });

// ================================
// MODEL EXPORTS
// ================================

export const DaoUserMapping: Model<IDaoUserMapping> = mongoose.model<IDaoUserMapping>('DaoUserMapping', DaoUserMappingSchema);
export const DaoInfo: Model<IDaoInfo> = mongoose.model<IDaoInfo>('DaoInfo', DaoInfoSchema);
export const SensorType: Model<ISensorType> = mongoose.model<ISensorType>('SensorType', SensorTypeSchema);
export const ThresholdConfig: Model<IThresholdConfig> = mongoose.model<IThresholdConfig>('ThresholdConfig', ThresholdConfigSchema);
export const Proposal: Model<IProposal> = mongoose.model<IProposal>('Proposal', ProposalSchema);
export const DataRecord: Model<IDataRecord> = mongoose.model<IDataRecord>('DataRecord', DataRecordSchema);

// ================================
// STATIC METHODS AND UTILITIES
// ================================

// Static method to initialize default sensor types
export const initializeDefaultSensorTypes = async (): Promise<void> => {
  try {
    const defaultSensors = [
      { sensorTypeId: 0, name: 'Temperature Sensor' },
      { sensorTypeId: 1, name: 'Humidity Sensor' },
      { sensorTypeId: 2, name: 'Pressure Sensor' },
      { sensorTypeId: 3, name: 'Luminosity Sensor' }
    ];

    for (const sensor of defaultSensors) {
      await SensorType.findOneAndUpdate(
        { sensorTypeId: sensor.sensorTypeId },
        sensor,
        { upsert: true, new: true }
      );
    }
  } catch (error) {
    console.error('Error initializing default sensor types:', error);
    throw error;
  }
};

// Static method to initialize default threshold configs
export const initializeDefaultThresholds = async (): Promise<void> => {
  try {
    const defaultThresholds = [
      {
        sensorTypeId: 0, // Temperature
        minValue: -10,
        maxValue: 50,
        description: 'Safe temperature range for lab equipment (-10°C to 50°C)'
      },
      {
        sensorTypeId: 1, // Humidity
        minValue: 20,
        maxValue: 80,
        description: 'Optimal humidity range for lab environment (20% to 80%)'
      },
      {
        sensorTypeId: 2, // Pressure
        minValue: 950,
        maxValue: 1050,
        description: 'Normal atmospheric pressure range (950 to 1050 hPa)'
      },
      {
        sensorTypeId: 3, // Luminosity
        minValue: 100,
        maxValue: 1000,
        description: 'Adequate lighting levels for lab work (100 to 1000 lux)'
      }
    ];

    for (const threshold of defaultThresholds) {
      await ThresholdConfig.findOneAndUpdate(
        { sensorTypeId: threshold.sensorTypeId },
        threshold,
        { upsert: true, new: true }
      );
    }
  } catch (error) {
    console.error('Error initializing default thresholds:', error);
    throw error;
  }
};

// Helper function to get proposal type label
export const getProposalTypeLabel = (type: number): string => {
  switch (type) {
    case 0: return 'General';
    case 1: return 'Alert';
    case 2: return 'Configuration';
    default: return 'Unknown';
  }
};

// Helper function to determine proposal status
export const getProposalStatus = (proposal: IProposal): string => {
  if (proposal.executed) {
    return proposal.approved ? 'executed_approved' : 'executed_rejected';
  }
  
  if (new Date() > proposal.votingEndTime) {
    return 'expired';
  }
  
  return 'active';
};

// Helper function to validate Sui address
export const isValidSuiAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{64}$/.test(address);
};

// Helper function to normalize Sui address
export const normalizeSuiAddress = (address: string): string => {
  return address.toLowerCase().trim();
};

// Aggregation pipeline helpers
export const getProposalAggregationPipeline = (filters: any = {}) => {
  const pipeline: any[] = [];

  // Match stage
  if (Object.keys(filters).length > 0) {
    pipeline.push({ $match: filters });
  }

  // Add computed fields
  pipeline.push({
    $addFields: {
      totalVotes: { $add: ['$yesVotes', '$noVotes'] },
      voterCount: { $size: '$voters' },
      isActive: {
        $and: [
          { $eq: ['$executed', false] },
          { $gt: ['$votingEndTime', new Date()] }
        ]
      }
    }
  });

  return pipeline;
};

export const getDataRecordAggregationPipeline = (filters: any = {}) => {
  const pipeline: any[] = [];

  // Match stage
  if (Object.keys(filters).length > 0) {
    pipeline.push({ $match: filters });
  }

  // Lookup sensor type information
  pipeline.push({
    $lookup: {
      from: 'sensortypes',
      localField: 'sensorType',
      foreignField: 'sensorTypeId',
      as: 'sensorTypeInfo'
    }
  });

  // Lookup threshold config
  pipeline.push({
    $lookup: {
      from: 'thresholdconfigs',
      localField: 'sensorType',
      foreignField: 'sensorTypeId',
      as: 'thresholdInfo'
    }
  });

  // Add computed fields
  pipeline.push({
    $addFields: {
      sensorTypeName: { $arrayElemAt: ['$sensorTypeInfo.name', 0] },
      thresholdConfig: { $arrayElemAt: ['$thresholdInfo', 0] }
    }
  });

  return pipeline;
}; 