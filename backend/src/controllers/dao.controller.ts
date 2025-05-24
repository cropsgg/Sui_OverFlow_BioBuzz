import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { SuiService } from '../services/sui.service';
import { EventListenerService } from '../services/eventListener.service';
import { logger } from '../services/logger';
import {
  DaoUserMapping,
  DaoInfo,
  Proposal,
  DataRecord,
  SensorType,
  ThresholdConfig,
  getProposalTypeLabel,
  getProposalStatus,
  isValidSuiAddress,
  normalizeSuiAddress,
  initializeDefaultSensorTypes,
  initializeDefaultThresholds,
  getProposalAggregationPipeline,
  getDataRecordAggregationPipeline
} from '../models/dao.model';
import {
  ApiResponse,
  DaoInfoResponse,
  MemberResponse,
  ProposalResponse,
  DataRecordResponse,
  DashboardStatsResponse,
  AddMemberRequest,
  LinkSuiAddressRequest,
  SubmitDataRequest,
  CreateProposalRequest,
  VoteRequest,
  UpdateThresholdRequest,
  AddFundsRequest,
  ProposalFilters,
  DataRecordFilters,
  MemberFilters,
  ProposalType,
  ProposalStatus,
  DaoErrorCodes
} from '../interfaces/dao.interface';
import { User } from '../models/user.model';

export class DaoController {
  private suiService: SuiService;
  private eventListener: EventListenerService;

  constructor() {
    // Initialize services with environment variables
    const packageId = process.env.SUI_PACKAGE_ID;
    const daoObjectId = process.env.DAO_OBJECT_ID;
    const networkType = (process.env.SUI_NETWORK || 'devnet') as 'mainnet' | 'testnet' | 'devnet' | 'localnet';

    if (!packageId || !daoObjectId) {
      throw new Error('SUI_PACKAGE_ID and DAO_OBJECT_ID environment variables are required');
    }

    this.suiService = SuiService.createSuiService({
      packageId,
      daoObjectId,
      networkType
    });

    this.eventListener = new EventListenerService(this.suiService);
  }

  // ================================
  // INITIALIZATION METHODS
  // ================================

  public async initializeDao(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json(this.createErrorResponse('Validation failed', errors.array()));
        return;
      }

      const { name, description, adminAddress } = req.body;

      // Validate admin address
      if (!isValidSuiAddress(adminAddress)) {
        res.status(400).json(this.createErrorResponse('Invalid admin Sui address format'));
        return;
      }

      // Check if DAO is already initialized
      const existingDao = await DaoInfo.findOne({ daoObjectId: this.suiService.getConfig().daoObjectId });
      if (existingDao) {
        res.status(400).json(this.createErrorResponse('DAO is already initialized'));
        return;
      }

      // Initialize default data
      await initializeDefaultSensorTypes();
      await initializeDefaultThresholds();

      // Create DAO info document
      const daoInfo = new DaoInfo({
        daoObjectId: this.suiService.getConfig().daoObjectId,
        name,
        description,
        adminSuiAddress: normalizeSuiAddress(adminAddress),
        memberCount: 1, // Admin is the first member
        treasuryBalance: 0,
        nextProposalId: 1,
        nextDataId: 1
      });

      await daoInfo.save();

      // Start event listener
      await this.eventListener.startListening();

      logger.info('DAO initialized successfully:', {
        daoObjectId: this.suiService.getConfig().daoObjectId,
        name,
        adminAddress
      });

      res.status(201).json(this.createSuccessResponse('DAO initialized successfully', {
        daoObjectId: this.suiService.getConfig().daoObjectId,
        name,
        description,
        adminAddress: normalizeSuiAddress(adminAddress)
      }));
    } catch (error) {
      logger.error('Error initializing DAO:', error);
      res.status(500).json(this.createErrorResponse('Failed to initialize DAO', error));
    }
  }

  // ================================
  // DAO INFO METHODS
  // ================================

  public async getDaoInfo(req: Request, res: Response): Promise<void> {
    try {
      const daoInfo = await DaoInfo.findOne({ daoObjectId: this.suiService.getConfig().daoObjectId });
      
      if (!daoInfo) {
        res.status(404).json(this.createErrorResponse('DAO not found'));
        return;
      }

      // Get additional statistics
      const [totalProposals, totalDataRecords, activeProposals] = await Promise.all([
        Proposal.countDocuments(),
        DataRecord.countDocuments(),
        Proposal.countDocuments({ executed: false, votingEndTime: { $gt: new Date() } })
      ]);

      const response: DaoInfoResponse = {
        daoObjectId: daoInfo.daoObjectId,
        name: daoInfo.name,
        description: daoInfo.description,
        adminSuiAddress: daoInfo.adminSuiAddress,
        memberCount: daoInfo.memberCount,
        treasuryBalance: daoInfo.treasuryBalance,
        totalProposals,
        totalDataRecords,
        activeProposals
      };

      res.json(this.createSuccessResponse('DAO info retrieved successfully', response));
    } catch (error) {
      logger.error('Error getting DAO info:', error);
      res.status(500).json(this.createErrorResponse('Failed to get DAO info', error));
    }
  }

  public async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const [
        totalMembers,
        totalProposals,
        activeProposals,
        totalDataRecords,
        recentAlerts,
        daoInfo
      ] = await Promise.all([
        DaoUserMapping.countDocuments({ isDaoMember: true }),
        Proposal.countDocuments(),
        Proposal.countDocuments({ executed: false, votingEndTime: { $gt: new Date() } }),
        DataRecord.countDocuments(),
        DataRecord.countDocuments({ 
          triggeredAlert: true, 
          timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
        }),
        DaoInfo.findOne({ daoObjectId: this.suiService.getConfig().daoObjectId })
      ]);

      // Get membership growth data (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const membershipGrowth = await DaoUserMapping.aggregate([
        {
          $match: {
            isDaoMember: true,
            'daoMemberDetails.joinedAt': { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$daoMemberDetails.joinedAt'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Get proposal activity data (last 30 days)
      const proposalActivity = await Proposal.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            created: { $sum: 1 },
            executed: {
              $sum: {
                $cond: [{ $eq: ['$executed', true] }, 1, 0]
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Get data submission trends (last 30 days)
      const dataSubmissionTrends = await DataRecord.aggregate([
        {
          $match: {
            timestamp: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$timestamp'
              }
            },
            submissions: { $sum: 1 },
            alerts: {
              $sum: {
                $cond: [{ $eq: ['$triggeredAlert', true] }, 1, 0]
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      const response: DashboardStatsResponse = {
        totalMembers,
        totalProposals,
        activeProposals,
        totalDataRecords,
        recentAlerts,
        treasuryBalance: daoInfo?.treasuryBalance || 0,
        membershipGrowth: membershipGrowth.map(item => ({
          date: item._id,
          count: item.count
        })),
        proposalActivity: proposalActivity.map(item => ({
          date: item._id,
          created: item.created,
          executed: item.executed
        })),
        dataSubmissionTrends: dataSubmissionTrends.map(item => ({
          date: item._id,
          submissions: item.submissions,
          alerts: item.alerts
        }))
      };

      res.json(this.createSuccessResponse('Dashboard stats retrieved successfully', response));
    } catch (error) {
      logger.error('Error getting dashboard stats:', error);
      res.status(500).json(this.createErrorResponse('Failed to get dashboard stats', error));
    }
  }

  // ================================
  // MEMBER MANAGEMENT METHODS
  // ================================

  public async linkSuiAddress(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json(this.createErrorResponse('Validation failed', errors.array()));
        return;
      }

      const userId = req.user?.id;
      const { suiAddress }: LinkSuiAddressRequest = req.body;

      if (!userId) {
        res.status(401).json(this.createErrorResponse('User not authenticated'));
        return;
      }

      if (!isValidSuiAddress(suiAddress)) {
        res.status(400).json(this.createErrorResponse('Invalid Sui address format'));
        return;
      }

      const normalizedAddress = normalizeSuiAddress(suiAddress);

      // Check if address is already linked
      const existingMapping = await DaoUserMapping.findOne({ suiAddress: normalizedAddress });
      if (existingMapping) {
        res.status(400).json(this.createErrorResponse('Sui address is already linked to another account'));
        return;
      }

      // Check if user already has a linked address
      const userMapping = await DaoUserMapping.findOne({ userId });
      if (userMapping) {
        res.status(400).json(this.createErrorResponse('User already has a linked Sui address'));
        return;
      }

      // Check if address is already a DAO member
      const isMember = await this.suiService.isMember(normalizedAddress);

      const newMapping = new DaoUserMapping({
        userId,
        suiAddress: normalizedAddress,
        isDaoMember: isMember
      });

      if (isMember) {
        const memberData = await this.suiService.getMember(normalizedAddress);
        if (memberData) {
          newMapping.daoMemberDetails = {
            name: memberData.name,
            joinedAt: new Date(parseInt(memberData.joinedAt)),
            votingPower: memberData.votingPower
          };
        }
      }

      await newMapping.save();

      logger.info('Sui address linked successfully:', {
        userId,
        suiAddress: normalizedAddress,
        isDaoMember: isMember
      });

      res.status(201).json(this.createSuccessResponse('Sui address linked successfully', {
        suiAddress: normalizedAddress,
        isDaoMember: isMember
      }));
    } catch (error) {
      logger.error('Error linking Sui address:', error);
      res.status(500).json(this.createErrorResponse('Failed to link Sui address', error));
    }
  }

  public async addMember(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json(this.createErrorResponse('Validation failed', errors.array()));
        return;
      }

      const { suiAddress, memberName }: AddMemberRequest = req.body;
      const adminUserId = req.user?.id;

      // Check if user is DAO admin
      const isAdmin = await this.isUserDaoAdmin(adminUserId);
      if (!isAdmin) {
        res.status(403).json(this.createErrorResponse('Only DAO admin can add members'));
        return;
      }

      if (!isValidSuiAddress(suiAddress)) {
        res.status(400).json(this.createErrorResponse('Invalid Sui address format'));
        return;
      }

      const normalizedAddress = normalizeSuiAddress(suiAddress);

      // Check if already a member
      const isMember = await this.suiService.isMember(normalizedAddress);
      if (isMember) {
        res.status(400).json(this.createErrorResponse('Address is already a DAO member'));
        return;
      }

      // Build transaction
      const tx = this.suiService.buildAddMemberTransaction(normalizedAddress, memberName);

      res.json(this.createSuccessResponse('Add member transaction prepared', {
        transactionBlock: await tx.build({ client: this.suiService['client'] }),
        targetAddress: normalizedAddress,
        memberName
      }));
    } catch (error) {
      logger.error('Error adding member:', error);
      res.status(500).json(this.createErrorResponse('Failed to add member', error));
    }
  }

  public async getMembers(req: Request, res: Response): Promise<void> {
    try {
      const filters: MemberFilters = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        searchTerm: req.query.search as string,
        sortBy: (req.query.sortBy as 'name' | 'joinedAt' | 'votingPower') || 'joinedAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
      };

      const query: any = { isDaoMember: true };

      if (filters.searchTerm) {
        query.$or = [
          { 'daoMemberDetails.name': { $regex: filters.searchTerm, $options: 'i' } },
          { suiAddress: { $regex: filters.searchTerm, $options: 'i' } }
        ];
      }

      const sortField = filters.sortBy === 'name' 
        ? 'daoMemberDetails.name' 
        : filters.sortBy === 'joinedAt' 
        ? 'daoMemberDetails.joinedAt'
        : 'daoMemberDetails.votingPower';

      const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;

      const [members, total] = await Promise.all([
        DaoUserMapping.find(query)
          .sort({ [sortField]: sortOrder })
          .limit(filters.limit!)
          .skip((filters.page! - 1) * filters.limit!)
          .populate('userId', 'name email'),
        DaoUserMapping.countDocuments(query)
      ]);

      const membersWithStats = await Promise.all(
        members.map(async (member) => {
          const [dataSubmissions, votesCast] = await Promise.all([
            DataRecord.countDocuments({ submittedBySuiAddress: member.suiAddress }),
            Proposal.countDocuments({ 'voters.suiAddress': member.suiAddress })
          ]);

          const response: MemberResponse = {
            suiAddress: member.suiAddress,
            name: member.daoMemberDetails?.name || 'Unknown',
            joinedAt: member.daoMemberDetails?.joinedAt || member.createdAt,
            votingPower: member.daoMemberDetails?.votingPower || 0,
            isDaoMember: member.isDaoMember,
            totalDataSubmissions: dataSubmissions,
            totalVotesCast: votesCast
          };

          return response;
        })
      );

      const totalPages = Math.ceil(total / filters.limit!);

      res.json(this.createSuccessResponse('Members retrieved successfully', membersWithStats, {
        pagination: {
          page: filters.page!,
          limit: filters.limit!,
          total,
          totalPages
        }
      }));
    } catch (error) {
      logger.error('Error getting members:', error);
      res.status(500).json(this.createErrorResponse('Failed to get members', error));
    }
  }

  public async getMemberByAddress(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;

      if (!isValidSuiAddress(address)) {
        res.status(400).json(this.createErrorResponse('Invalid Sui address format'));
        return;
      }

      const normalizedAddress = normalizeSuiAddress(address);
      const member = await DaoUserMapping.findOne({ suiAddress: normalizedAddress });

      if (!member || !member.isDaoMember) {
        res.status(404).json(this.createErrorResponse('Member not found'));
        return;
      }

      const [dataSubmissions, votesCast] = await Promise.all([
        DataRecord.countDocuments({ submittedBySuiAddress: normalizedAddress }),
        Proposal.countDocuments({ 'voters.suiAddress': normalizedAddress })
      ]);

      const response: MemberResponse = {
        suiAddress: member.suiAddress,
        name: member.daoMemberDetails?.name || 'Unknown',
        joinedAt: member.daoMemberDetails?.joinedAt || member.createdAt,
        votingPower: member.daoMemberDetails?.votingPower || 0,
        isDaoMember: member.isDaoMember,
        totalDataSubmissions: dataSubmissions,
        totalVotesCast: votesCast
      };

      res.json(this.createSuccessResponse('Member retrieved successfully', response));
    } catch (error) {
      logger.error('Error getting member:', error);
      res.status(500).json(this.createErrorResponse('Failed to get member', error));
    }
  }

  public async getUserDaoStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json(this.createErrorResponse('User not authenticated'));
        return;
      }

      const userMapping = await DaoUserMapping.findOne({ userId });

      if (!userMapping) {
        res.json(this.createSuccessResponse('User DAO status retrieved', {
          hasLinkedAddress: false,
          isDaoMember: false,
          suiAddress: null,
          memberDetails: null
        }));
        return;
      }

      res.json(this.createSuccessResponse('User DAO status retrieved', {
        hasLinkedAddress: true,
        isDaoMember: userMapping.isDaoMember,
        suiAddress: userMapping.suiAddress,
        memberDetails: userMapping.daoMemberDetails
      }));
    } catch (error) {
      logger.error('Error getting user DAO status:', error);
      res.status(500).json(this.createErrorResponse('Failed to get user DAO status', error));
    }
  }

  // ================================
  // DATA SUBMISSION METHODS
  // ================================

  public async submitData(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json(this.createErrorResponse('Validation failed', errors.array()));
        return;
      }

      const { sensorType, dataHash, metadata, value }: SubmitDataRequest = req.body;
      const userId = req.user?.id;

      // Check if user is DAO member
      const userMapping = await this.getUserDaoMapping(userId);
      if (!userMapping || !userMapping.isDaoMember) {
        res.status(403).json(this.createErrorResponse('Only DAO members can submit data'));
        return;
      }

      // Validate sensor type
      const sensorTypeExists = await SensorType.findOne({ sensorTypeId: sensorType, isActive: true });
      if (!sensorTypeExists) {
        res.status(400).json(this.createErrorResponse('Invalid sensor type'));
        return;
      }

      // Build transaction
      const tx = this.suiService.buildSubmitDataTransaction(
        userMapping.suiAddress,
        sensorType,
        dataHash,
        metadata,
        value
      );

      res.json(this.createSuccessResponse('Submit data transaction prepared', {
        transactionBlock: await tx.build({ client: this.suiService['client'] }),
        sensorType,
        value,
        dataHash
      }));
    } catch (error) {
      logger.error('Error submitting data:', error);
      res.status(500).json(this.createErrorResponse('Failed to submit data', error));
    }
  }

  public async getDataRecords(req: Request, res: Response): Promise<void> {
    try {
      const filters: DataRecordFilters = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        sensorType: req.query.sensorType ? parseInt(req.query.sensorType as string) : undefined,
        submittedBy: req.query.submittedBy as string,
        triggeredAlert: req.query.triggeredAlert ? req.query.triggeredAlert === 'true' : undefined,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        valueMin: req.query.valueMin ? parseFloat(req.query.valueMin as string) : undefined,
        valueMax: req.query.valueMax ? parseFloat(req.query.valueMax as string) : undefined,
        sortBy: (req.query.sortBy as string) || 'timestamp',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
      };

      const matchQuery: any = {};

      if (filters.sensorType !== undefined) {
        matchQuery.sensorType = filters.sensorType;
      }

      if (filters.submittedBy) {
        if (isValidSuiAddress(filters.submittedBy)) {
          matchQuery.submittedBySuiAddress = normalizeSuiAddress(filters.submittedBy);
        }
      }

      if (filters.triggeredAlert !== undefined) {
        matchQuery.triggeredAlert = filters.triggeredAlert;
      }

      if (filters.dateFrom || filters.dateTo) {
        matchQuery.timestamp = {};
        if (filters.dateFrom) matchQuery.timestamp.$gte = filters.dateFrom;
        if (filters.dateTo) matchQuery.timestamp.$lte = filters.dateTo;
      }

      if (filters.valueMin !== undefined || filters.valueMax !== undefined) {
        matchQuery.value = {};
        if (filters.valueMin !== undefined) matchQuery.value.$gte = filters.valueMin;
        if (filters.valueMax !== undefined) matchQuery.value.$lte = filters.valueMax;
      }

      const pipeline = getDataRecordAggregationPipeline(matchQuery);
      
      // Add sorting
      const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
      pipeline.push({ $sort: { [filters.sortBy!]: sortOrder } });

      // Add pagination
      pipeline.push({ $skip: (filters.page! - 1) * filters.limit! });
      pipeline.push({ $limit: filters.limit! });

      const [dataRecords, total] = await Promise.all([
        DataRecord.aggregate(pipeline),
        DataRecord.countDocuments(matchQuery)
      ]);

      const dataRecordsWithDetails = await Promise.all(
        dataRecords.map(async (record) => {
          const response: DataRecordResponse = {
            dataRecordObjectId: record.dataRecordObjectId,
            dataSequentialId: record.dataSequentialId,
            sensorType: record.sensorType,
            sensorTypeName: record.sensorTypeName || 'Unknown',
            submittedBySuiAddress: record.submittedBySuiAddress,
            dataHash: record.dataHash,
            metadata: record.metadata,
            timestamp: record.timestamp,
            value: record.value,
            triggeredAlert: record.triggeredAlert,
            thresholdConfig: record.thresholdConfig
          };

          // Add submitter name if available
          const submitter = await DaoUserMapping.findOne({ 
            suiAddress: record.submittedBySuiAddress 
          });
          if (submitter) {
            response.submitterName = submitter.daoMemberDetails?.name;
          }

          // Add alert proposal info if applicable
          if (record.triggeredAlert && record.alertProposalObjectId) {
            const alertProposal = await Proposal.findOne({
              proposalObjectId: record.alertProposalObjectId
            });
            if (alertProposal) {
              response.alertProposal = {
                proposalId: alertProposal.proposalObjectId,
                title: alertProposal.title,
                status: getProposalStatus(alertProposal)
              };
            }
          }

          return response;
        })
      );

      const totalPages = Math.ceil(total / filters.limit!);

      res.json(this.createSuccessResponse('Data records retrieved successfully', dataRecordsWithDetails, {
        pagination: {
          page: filters.page!,
          limit: filters.limit!,
          total,
          totalPages
        }
      }));
    } catch (error) {
      logger.error('Error getting data records:', error);
      res.status(500).json(this.createErrorResponse('Failed to get data records', error));
    }
  }

  public async getDataRecordById(req: Request, res: Response): Promise<void> {
    try {
      const { recordId } = req.params;

      const dataRecord = await DataRecord.findOne({ dataRecordObjectId: recordId });
      if (!dataRecord) {
        res.status(404).json(this.createErrorResponse('Data record not found'));
        return;
      }

      const [sensorType, submitter, thresholdConfig] = await Promise.all([
        SensorType.findOne({ sensorTypeId: dataRecord.sensorType }),
        DaoUserMapping.findOne({ suiAddress: dataRecord.submittedBySuiAddress }),
        ThresholdConfig.findOne({ sensorTypeId: dataRecord.sensorType })
      ]);

      const response: DataRecordResponse = {
        dataRecordObjectId: dataRecord.dataRecordObjectId,
        dataSequentialId: dataRecord.dataSequentialId,
        sensorType: dataRecord.sensorType,
        sensorTypeName: sensorType?.name || 'Unknown',
        submittedBySuiAddress: dataRecord.submittedBySuiAddress,
        submitterName: submitter?.daoMemberDetails?.name,
        dataHash: dataRecord.dataHash,
        metadata: dataRecord.metadata,
        timestamp: dataRecord.timestamp,
        value: dataRecord.value,
        triggeredAlert: dataRecord.triggeredAlert,
        thresholdConfig: thresholdConfig ? {
          minValue: thresholdConfig.minValue,
          maxValue: thresholdConfig.maxValue,
          description: thresholdConfig.description
        } : undefined
      };

      // Add alert proposal info if applicable
      if (dataRecord.triggeredAlert && dataRecord.alertProposalObjectId) {
        const alertProposal = await Proposal.findOne({
          proposalObjectId: dataRecord.alertProposalObjectId
        });
        if (alertProposal) {
          response.alertProposal = {
            proposalId: alertProposal.proposalObjectId,
            title: alertProposal.title,
            status: getProposalStatus(alertProposal)
          };
        }
      }

      res.json(this.createSuccessResponse('Data record retrieved successfully', response));
    } catch (error) {
      logger.error('Error getting data record:', error);
      res.status(500).json(this.createErrorResponse('Failed to get data record', error));
    }
  }

  // ================================
  // PROPOSAL METHODS
  // ================================

  public async createProposal(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json(this.createErrorResponse('Validation failed', errors.array()));
        return;
      }

      const { title, description, proposalType }: CreateProposalRequest = req.body;
      const userId = req.user?.id;

      // Check if user is DAO member
      const userMapping = await this.getUserDaoMapping(userId);
      if (!userMapping || !userMapping.isDaoMember) {
        res.status(403).json(this.createErrorResponse('Only DAO members can create proposals'));
        return;
      }

      // Validate proposal type (only General and Configuration allowed for manual creation)
      if (proposalType !== ProposalType.GENERAL && proposalType !== ProposalType.CONFIGURATION) {
        res.status(400).json(this.createErrorResponse('Invalid proposal type. Only General and Configuration proposals can be created manually'));
        return;
      }

      // Build transaction
      const tx = this.suiService.buildCreateProposalTransaction(
        userMapping.suiAddress,
        proposalType,
        title,
        description
      );

      res.json(this.createSuccessResponse('Create proposal transaction prepared', {
        transactionBlock: await tx.build({ client: this.suiService['client'] }),
        title,
        description,
        proposalType
      }));
    } catch (error) {
      logger.error('Error creating proposal:', error);
      res.status(500).json(this.createErrorResponse('Failed to create proposal', error));
    }
  }

  public async getProposals(req: Request, res: Response): Promise<void> {
    try {
      const filters: ProposalFilters = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        type: req.query.type ? parseInt(req.query.type as string) : undefined,
        status: req.query.status as ProposalStatus,
        proposer: req.query.proposer as string,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        sortBy: (req.query.sortBy as string) || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
      };

      const matchQuery: any = {};

      if (filters.type !== undefined) {
        matchQuery.type = filters.type;
      }

      if (filters.proposer && isValidSuiAddress(filters.proposer)) {
        matchQuery.proposerSuiAddress = normalizeSuiAddress(filters.proposer);
      }

      if (filters.dateFrom || filters.dateTo) {
        matchQuery.createdAt = {};
        if (filters.dateFrom) matchQuery.createdAt.$gte = filters.dateFrom;
        if (filters.dateTo) matchQuery.createdAt.$lte = filters.dateTo;
      }

      // Handle status filter
      if (filters.status) {
        switch (filters.status) {
          case ProposalStatus.ACTIVE:
            matchQuery.executed = false;
            matchQuery.votingEndTime = { $gt: new Date() };
            break;
          case ProposalStatus.EXECUTED_APPROVED:
            matchQuery.executed = true;
            matchQuery.approved = true;
            break;
          case ProposalStatus.EXECUTED_REJECTED:
            matchQuery.executed = true;
            matchQuery.approved = false;
            break;
          case ProposalStatus.EXPIRED:
            matchQuery.executed = false;
            matchQuery.votingEndTime = { $lte: new Date() };
            break;
        }
      }

      const pipeline = getProposalAggregationPipeline(matchQuery);
      
      // Add sorting
      const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
      pipeline.push({ $sort: { [filters.sortBy!]: sortOrder } });

      // Add pagination
      pipeline.push({ $skip: (filters.page! - 1) * filters.limit! });
      pipeline.push({ $limit: filters.limit! });

      const [proposals, total] = await Promise.all([
        Proposal.aggregate(pipeline),
        Proposal.countDocuments(matchQuery)
      ]);

      const userId = req.user?.id;
      const userMapping = userId ? await this.getUserDaoMapping(userId) : null;

      const proposalsWithDetails = await Promise.all(
        proposals.map(async (proposal) => {
          const [proposer, dataReference] = await Promise.all([
            DaoUserMapping.findOne({ suiAddress: proposal.proposerSuiAddress }),
            proposal.dataReferenceObjectId 
              ? DataRecord.findOne({ dataRecordObjectId: proposal.dataReferenceObjectId })
              : null
          ]);

          const response: ProposalResponse = {
            proposalObjectId: proposal.proposalObjectId,
            proposalSequentialId: proposal.proposalSequentialId,
            type: proposal.type,
            typeLabel: getProposalTypeLabel(proposal.type),
            title: proposal.title,
            description: proposal.description,
            proposerSuiAddress: proposal.proposerSuiAddress,
            proposerName: proposer?.daoMemberDetails?.name,
            createdAt: proposal.createdAt,
            votingEndTime: proposal.votingEndTime,
            executed: proposal.executed,
            approved: proposal.approved,
            yesVotes: proposal.yesVotes,
            noVotes: proposal.noVotes,
            totalVotes: proposal.totalVotes || (proposal.yesVotes + proposal.noVotes),
            voterCount: proposal.voterCount || proposal.voters.length,
            isActive: proposal.isActive !== undefined ? proposal.isActive : (!proposal.executed && new Date() < proposal.votingEndTime)
          };

          // Add user-specific data if authenticated
          if (userMapping && userMapping.isDaoMember) {
            response.canVote = response.isActive;
            const userVote = proposal.voters.find((voter: any) => 
              voter.suiAddress.toLowerCase() === userMapping.suiAddress.toLowerCase()
            );
            response.userVote = userVote ? userVote.vote : null;
          }

          // Add data reference if applicable
          if (dataReference) {
            response.dataReference = {
              recordId: dataReference.dataRecordObjectId,
              sensorType: dataReference.sensorType,
              value: dataReference.value,
              metadata: dataReference.metadata
            };
          }

          return response;
        })
      );

      const totalPages = Math.ceil(total / filters.limit!);

      res.json(this.createSuccessResponse('Proposals retrieved successfully', proposalsWithDetails, {
        pagination: {
          page: filters.page!,
          limit: filters.limit!,
          total,
          totalPages
        }
      }));
    } catch (error) {
      logger.error('Error getting proposals:', error);
      res.status(500).json(this.createErrorResponse('Failed to get proposals', error));
    }
  }

  public async getProposalById(req: Request, res: Response): Promise<void> {
    try {
      const { proposalId } = req.params;
      const userId = req.user?.id;

      const proposal = await Proposal.findOne({ proposalObjectId: proposalId });
      if (!proposal) {
        res.status(404).json(this.createErrorResponse('Proposal not found'));
        return;
      }

      const [proposer, dataReference] = await Promise.all([
        DaoUserMapping.findOne({ suiAddress: proposal.proposerSuiAddress }),
        proposal.dataReferenceObjectId 
          ? DataRecord.findOne({ dataRecordObjectId: proposal.dataReferenceObjectId })
          : null
      ]);

      const userMapping = userId ? await this.getUserDaoMapping(userId) : null;

      const response: ProposalResponse = {
        proposalObjectId: proposal.proposalObjectId,
        proposalSequentialId: proposal.proposalSequentialId,
        type: proposal.type,
        typeLabel: getProposalTypeLabel(proposal.type),
        title: proposal.title,
        description: proposal.description,
        proposerSuiAddress: proposal.proposerSuiAddress,
        proposerName: proposer?.daoMemberDetails?.name,
        createdAt: proposal.createdAt,
        votingEndTime: proposal.votingEndTime,
        executed: proposal.executed,
        approved: proposal.approved,
        yesVotes: proposal.yesVotes,
        noVotes: proposal.noVotes,
        totalVotes: proposal.yesVotes + proposal.noVotes,
        voterCount: proposal.voters.length,
        isActive: !proposal.executed && new Date() < proposal.votingEndTime
      };

      // Add user-specific data if authenticated
      if (userMapping && userMapping.isDaoMember) {
        response.canVote = response.isActive;
        const userVote = proposal.voters.find(voter => 
          voter.suiAddress.toLowerCase() === userMapping.suiAddress.toLowerCase()
        );
        response.userVote = userVote ? userVote.vote : null;
      }

      // Add data reference if applicable
      if (dataReference) {
        response.dataReference = {
          recordId: dataReference.dataRecordObjectId,
          sensorType: dataReference.sensorType,
          value: dataReference.value,
          metadata: dataReference.metadata
        };
      }

      res.json(this.createSuccessResponse('Proposal retrieved successfully', response));
    } catch (error) {
      logger.error('Error getting proposal:', error);
      res.status(500).json(this.createErrorResponse('Failed to get proposal', error));
    }
  }

  public async vote(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json(this.createErrorResponse('Validation failed', errors.array()));
        return;
      }

      const { proposalId } = req.params;
      const { vote }: VoteRequest = req.body;
      const userId = req.user?.id;

      // Check if user is DAO member
      const userMapping = await this.getUserDaoMapping(userId);
      if (!userMapping || !userMapping.isDaoMember) {
        res.status(403).json(this.createErrorResponse('Only DAO members can vote'));
        return;
      }

      // Check if proposal exists
      const proposal = await Proposal.findOne({ proposalObjectId: proposalId });
      if (!proposal) {
        res.status(404).json(this.createErrorResponse('Proposal not found'));
        return;
      }

      // Check if proposal is active
      if (proposal.executed) {
        res.status(400).json(this.createErrorResponse('Proposal has already been executed'));
        return;
      }

      if (new Date() >= proposal.votingEndTime) {
        res.status(400).json(this.createErrorResponse('Voting period has ended'));
        return;
      }

      // Check if user has already voted
      const hasVoted = proposal.voters.some(voter => 
        voter.suiAddress.toLowerCase() === userMapping.suiAddress.toLowerCase()
      );

      if (hasVoted) {
        res.status(400).json(this.createErrorResponse('User has already voted on this proposal'));
        return;
      }

      // Build transaction
      const tx = this.suiService.buildVoteTransaction(
        userMapping.suiAddress,
        proposalId,
        vote
      );

      res.json(this.createSuccessResponse('Vote transaction prepared', {
        transactionBlock: await tx.build({ client: this.suiService['client'] }),
        proposalId,
        vote
      }));
    } catch (error) {
      logger.error('Error voting:', error);
      res.status(500).json(this.createErrorResponse('Failed to vote', error));
    }
  }

  public async executeProposal(req: Request, res: Response): Promise<void> {
    try {
      const { proposalId } = req.params;
      const userId = req.user?.id;

      // Check if user is DAO member
      const userMapping = await this.getUserDaoMapping(userId);
      if (!userMapping || !userMapping.isDaoMember) {
        res.status(403).json(this.createErrorResponse('Only DAO members can execute proposals'));
        return;
      }

      // Check if proposal exists
      const proposal = await Proposal.findOne({ proposalObjectId: proposalId });
      if (!proposal) {
        res.status(404).json(this.createErrorResponse('Proposal not found'));
        return;
      }

      // Check if proposal can be executed
      if (proposal.executed) {
        res.status(400).json(this.createErrorResponse('Proposal has already been executed'));
        return;
      }

      if (new Date() < proposal.votingEndTime) {
        res.status(400).json(this.createErrorResponse('Voting period is still active'));
        return;
      }

      // Build transaction
      const tx = this.suiService.buildExecuteProposalTransaction(
        userMapping.suiAddress,
        proposalId
      );

      res.json(this.createSuccessResponse('Execute proposal transaction prepared', {
        transactionBlock: await tx.build({ client: this.suiService['client'] }),
        proposalId
      }));
    } catch (error) {
      logger.error('Error executing proposal:', error);
      res.status(500).json(this.createErrorResponse('Failed to execute proposal', error));
    }
  }

  // ================================
  // ADMIN METHODS
  // ================================

  public async updateThreshold(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json(this.createErrorResponse('Validation failed', errors.array()));
        return;
      }

      const { sensorTypeId } = req.params;
      const { minValue, maxValue, description }: UpdateThresholdRequest = req.body;
      const adminUserId = req.user?.id;

      // Check if user is DAO admin
      const isAdmin = await this.isUserDaoAdmin(adminUserId);
      if (!isAdmin) {
        res.status(403).json(this.createErrorResponse('Only DAO admin can update thresholds'));
        return;
      }

      const sensorTypeIdNum = parseInt(sensorTypeId);

      // Validate sensor type
      const sensorType = await SensorType.findOne({ sensorTypeId: sensorTypeIdNum });
      if (!sensorType) {
        res.status(404).json(this.createErrorResponse('Sensor type not found'));
        return;
      }

      // Validate values
      if (minValue >= maxValue) {
        res.status(400).json(this.createErrorResponse('Min value must be less than max value'));
        return;
      }

      // Get admin's Sui address
      const adminMapping = await this.getUserDaoMapping(adminUserId);
      if (!adminMapping) {
        res.status(400).json(this.createErrorResponse('Admin Sui address not found'));
        return;
      }

      // Build transaction
      const tx = this.suiService.buildUpdateThresholdTransaction(
        adminMapping.suiAddress,
        sensorTypeIdNum,
        minValue,
        maxValue,
        description
      );

      res.json(this.createSuccessResponse('Update threshold transaction prepared', {
        transactionBlock: await tx.build({ client: this.suiService['client'] }),
        sensorTypeId: sensorTypeIdNum,
        minValue,
        maxValue,
        description
      }));
    } catch (error) {
      logger.error('Error updating threshold:', error);
      res.status(500).json(this.createErrorResponse('Failed to update threshold', error));
    }
  }

  public async getThresholds(req: Request, res: Response): Promise<void> {
    try {
      const thresholds = await ThresholdConfig.find({ isActive: true })
        .sort({ sensorTypeId: 1 });

      const thresholdsWithSensorInfo = await Promise.all(
        thresholds.map(async (threshold) => {
          const sensorType = await SensorType.findOne({ 
            sensorTypeId: threshold.sensorTypeId 
          });

          return {
            sensorTypeId: threshold.sensorTypeId,
            sensorTypeName: sensorType?.name || 'Unknown',
            minValue: threshold.minValue,
            maxValue: threshold.maxValue,
            description: threshold.description,
            updatedAt: threshold.updatedAt
          };
        })
      );

      res.json(this.createSuccessResponse('Thresholds retrieved successfully', thresholdsWithSensorInfo));
    } catch (error) {
      logger.error('Error getting thresholds:', error);
      res.status(500).json(this.createErrorResponse('Failed to get thresholds', error));
    }
  }

  public async getSensorTypes(req: Request, res: Response): Promise<void> {
    try {
      const sensorTypes = await SensorType.find({ isActive: true })
        .sort({ sensorTypeId: 1 });

      res.json(this.createSuccessResponse('Sensor types retrieved successfully', sensorTypes));
    } catch (error) {
      logger.error('Error getting sensor types:', error);
      res.status(500).json(this.createErrorResponse('Failed to get sensor types', error));
    }
  }

  // ================================
  // TREASURY METHODS
  // ================================

  public async addFunds(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json(this.createErrorResponse('Validation failed', errors.array()));
        return;
      }

      const { amount }: AddFundsRequest = req.body;
      const userId = req.user?.id;

      // Check if user is DAO member
      const userMapping = await this.getUserDaoMapping(userId);
      if (!userMapping || !userMapping.isDaoMember) {
        res.status(403).json(this.createErrorResponse('Only DAO members can add funds'));
        return;
      }

      if (amount <= 0) {
        res.status(400).json(this.createErrorResponse('Amount must be greater than 0'));
        return;
      }

      // Build transaction
      const tx = this.suiService.buildAddFundsTransaction(
        userMapping.suiAddress,
        amount
      );

      res.json(this.createSuccessResponse('Add funds transaction prepared', {
        transactionBlock: await tx.build({ client: this.suiService['client'] }),
        amount
      }));
    } catch (error) {
      logger.error('Error adding funds:', error);
      res.status(500).json(this.createErrorResponse('Failed to add funds', error));
    }
  }

  public async getTreasuryBalance(req: Request, res: Response): Promise<void> {
    try {
      const daoInfo = await DaoInfo.findOne({ 
        daoObjectId: this.suiService.getConfig().daoObjectId 
      });

      if (!daoInfo) {
        res.status(404).json(this.createErrorResponse('DAO not found'));
        return;
      }

      res.json(this.createSuccessResponse('Treasury balance retrieved successfully', {
        balance: daoInfo.treasuryBalance,
        daoObjectId: daoInfo.daoObjectId
      }));
    } catch (error) {
      logger.error('Error getting treasury balance:', error);
      res.status(500).json(this.createErrorResponse('Failed to get treasury balance', error));
    }
  }

  // ================================
  // EVENT LISTENER METHODS
  // ================================

  public async getEventListenerStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = this.eventListener.getStatus();
      res.json(this.createSuccessResponse('Event listener status retrieved', status));
    } catch (error) {
      logger.error('Error getting event listener status:', error);
      res.status(500).json(this.createErrorResponse('Failed to get event listener status', error));
    }
  }

  public async startEventListener(req: Request, res: Response): Promise<void> {
    try {
      const adminUserId = req.user?.id;
      const isAdmin = await this.isUserDaoAdmin(adminUserId);
      
      if (!isAdmin) {
        res.status(403).json(this.createErrorResponse('Only DAO admin can control event listener'));
        return;
      }

      await this.eventListener.startListening();
      res.json(this.createSuccessResponse('Event listener started successfully'));
    } catch (error) {
      logger.error('Error starting event listener:', error);
      res.status(500).json(this.createErrorResponse('Failed to start event listener', error));
    }
  }

  public async stopEventListener(req: Request, res: Response): Promise<void> {
    try {
      const adminUserId = req.user?.id;
      const isAdmin = await this.isUserDaoAdmin(adminUserId);
      
      if (!isAdmin) {
        res.status(403).json(this.createErrorResponse('Only DAO admin can control event listener'));
        return;
      }

      await this.eventListener.stopListening();
      res.json(this.createSuccessResponse('Event listener stopped successfully'));
    } catch (error) {
      logger.error('Error stopping event listener:', error);
      res.status(500).json(this.createErrorResponse('Failed to stop event listener', error));
    }
  }

  public async syncEvents(req: Request, res: Response): Promise<void> {
    try {
      const adminUserId = req.user?.id;
      const isAdmin = await this.isUserDaoAdmin(adminUserId);
      
      if (!isAdmin) {
        res.status(403).json(this.createErrorResponse('Only DAO admin can sync events'));
        return;
      }

      const { hours } = req.query;
      const syncHours = hours ? parseInt(hours as string) : 24;

      await this.eventListener.syncRecentEvents(syncHours);
      res.json(this.createSuccessResponse(`Events synced successfully for last ${syncHours} hours`));
    } catch (error) {
      logger.error('Error syncing events:', error);
      res.status(500).json(this.createErrorResponse('Failed to sync events', error));
    }
  }

  // ================================
  // UTILITY METHODS
  // ================================

  private async getUserDaoMapping(userId?: string) {
    if (!userId) return null;
    return await DaoUserMapping.findOne({ userId });
  }

  private async isUserDaoAdmin(userId?: string): Promise<boolean> {
    if (!userId) return false;

    const userMapping = await this.getUserDaoMapping(userId);
    if (!userMapping) return false;

    const daoInfo = await DaoInfo.findOne({ 
      daoObjectId: this.suiService.getConfig().daoObjectId 
    });
    if (!daoInfo) return false;

    return userMapping.suiAddress.toLowerCase() === daoInfo.adminSuiAddress.toLowerCase();
  }

  private createSuccessResponse<T = any>(
    message: string, 
    data?: T, 
    meta?: any
  ): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      ...meta
    };
  }

  private createErrorResponse(message: string, error?: any): ApiResponse {
    return {
      success: false,
      message,
      error: error instanceof Error ? error.message : error
    };
  }
} 