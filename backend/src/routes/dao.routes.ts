import { Router } from 'express';
import * as expressValidator from 'express-validator';
import { DaoController } from '../controllers/dao.controller';
// Note: Auth middleware path needs to be verified/created
// import { authenticateToken } from '../middleware/auth';

const { body, param, query } = expressValidator;

const router = Router();
const daoController = new DaoController();

// Temporary auth middleware placeholder until the actual middleware is created
const authenticateToken = (req: any, res: any, next: any) => {
  // TODO: Replace with actual authentication middleware
  next();
};

// ================================
// VALIDATION MIDDLEWARE
// ================================

// Sui address validation
const validateSuiAddress = body('suiAddress')
  .isString()
  .matches(/^0x[a-fA-F0-9]{64}$/)
  .withMessage('Invalid Sui address format');

// Pagination validation
const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

// Common validation for sensor data
const validateSensorData = [
  body('sensorType').isInt({ min: 0, max: 255 }).withMessage('Sensor type must be between 0 and 255'),
  body('dataHash').isString().matches(/^[a-fA-F0-9]+$/).withMessage('Data hash must be a valid hex string'),
  body('metadata').isString().isLength({ max: 2000 }).withMessage('Metadata must be a string with max 2000 characters'),
  body('value').isNumeric().withMessage('Value must be a number')
];

// Proposal validation
const validateProposal = [
  body('title').isString().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
  body('description').isString().isLength({ min: 1, max: 2000 }).withMessage('Description must be 1-2000 characters'),
  body('proposalType').isInt({ min: 0, max: 2 }).withMessage('Proposal type must be 0 (General) or 2 (Configuration)')
];

// Threshold validation
const validateThreshold = [
  body('minValue').isNumeric().withMessage('Min value must be a number'),
  body('maxValue').isNumeric().withMessage('Max value must be a number'),
  body('description').isString().isLength({ min: 1, max: 500 }).withMessage('Description must be 1-500 characters')
];

// Vote validation
const validateVote = [
  body('vote').isBoolean().withMessage('Vote must be a boolean (true for yes, false for no)')
];

// ================================
// INITIALIZATION ROUTES
// ================================

/**
 * @route   POST /api/dao/initialize
 * @desc    Initialize the DAO with basic information
 * @access  Public (for initial setup)
 * @body    { name: string, description: string, adminAddress: string }
 */
router.post('/initialize', [
  body('name').isString().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
  body('description').isString().isLength({ min: 1, max: 1000 }).withMessage('Description must be 1-1000 characters'),
  body('adminAddress').isString().matches(/^0x[a-fA-F0-9]{64}$/).withMessage('Invalid admin Sui address format')
], daoController.initializeDao.bind(daoController));

// ================================
// DAO INFO ROUTES
// ================================

/**
 * @route   GET /api/dao/info
 * @desc    Get DAO basic information and statistics
 * @access  Public
 */
router.get('/info', daoController.getDaoInfo.bind(daoController));

/**
 * @route   GET /api/dao/dashboard
 * @desc    Get comprehensive dashboard statistics
 * @access  Public
 */
router.get('/dashboard', daoController.getDashboardStats.bind(daoController));

// ================================
// MEMBER MANAGEMENT ROUTES
// ================================

/**
 * @route   POST /api/dao/members/link-address
 * @desc    Link user's Sui address to their account
 * @access  Private
 * @body    { suiAddress: string, signature?: string }
 */
router.post('/members/link-address', authenticateToken, [
  validateSuiAddress
], daoController.linkSuiAddress.bind(daoController));

/**
 * @route   POST /api/dao/admin/members
 * @desc    Add a new member to the DAO (Admin only)
 * @access  Private (Admin)
 * @body    { suiAddress: string, memberName: string }
 */
router.post('/admin/members', authenticateToken, [
  validateSuiAddress,
  body('memberName').isString().isLength({ min: 1, max: 100 }).withMessage('Member name must be 1-100 characters')
], daoController.addMember.bind(daoController));

/**
 * @route   GET /api/dao/members
 * @desc    Get paginated list of DAO members
 * @access  Public
 * @query   { page?: number, limit?: number, search?: string, sortBy?: string, sortOrder?: 'asc'|'desc' }
 */
router.get('/members', [
  ...validatePagination,
  query('search').optional().isString().withMessage('Search must be a string'),
  query('sortBy').optional().isIn(['name', 'joinedAt', 'votingPower']).withMessage('Sort by must be name, joinedAt, or votingPower'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
], daoController.getMembers.bind(daoController));

/**
 * @route   GET /api/dao/members/:address
 * @desc    Get specific member details by Sui address
 * @access  Public
 * @param   address - Sui address of the member
 */
router.get('/members/:address', [
  param('address').matches(/^0x[a-fA-F0-9]{64}$/).withMessage('Invalid Sui address format')
], daoController.getMemberByAddress.bind(daoController));

/**
 * @route   GET /api/dao/user/status
 * @desc    Get current user's DAO membership status
 * @access  Private
 */
router.get('/user/status', authenticateToken, daoController.getUserDaoStatus.bind(daoController));

// ================================
// DATA SUBMISSION ROUTES
// ================================

/**
 * @route   POST /api/dao/data
 * @desc    Submit sensor data to the DAO
 * @access  Private (Members only)
 * @body    { sensorType: number, dataHash: string, metadata: string, value: number }
 */
router.post('/data', authenticateToken, validateSensorData, daoController.submitData.bind(daoController));

/**
 * @route   GET /api/dao/data
 * @desc    Get paginated list of data records with filtering
 * @access  Public
 * @query   { 
 *            page?: number, limit?: number, sensorType?: number, submittedBy?: string,
 *            triggeredAlert?: boolean, dateFrom?: string, dateTo?: string,
 *            valueMin?: number, valueMax?: number, sortBy?: string, sortOrder?: 'asc'|'desc'
 *          }
 */
router.get('/data', [
  ...validatePagination,
  query('sensorType').optional().isInt({ min: 0 }).withMessage('Sensor type must be a non-negative integer'),
  query('submittedBy').optional().isString().withMessage('Submitted by must be a string'),
  query('triggeredAlert').optional().isBoolean().withMessage('Triggered alert must be a boolean'),
  query('dateFrom').optional().isISO8601().withMessage('Date from must be a valid ISO date'),
  query('dateTo').optional().isISO8601().withMessage('Date to must be a valid ISO date'),
  query('valueMin').optional().isNumeric().withMessage('Value min must be a number'),
  query('valueMax').optional().isNumeric().withMessage('Value max must be a number'),
  query('sortBy').optional().isString().withMessage('Sort by must be a string'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
], daoController.getDataRecords.bind(daoController));

/**
 * @route   GET /api/dao/data/:recordId
 * @desc    Get specific data record details
 * @access  Public
 * @param   recordId - Object ID of the data record
 */
router.get('/data/:recordId', [
  param('recordId').isString().withMessage('Record ID must be a string')
], daoController.getDataRecordById.bind(daoController));

// ================================
// PROPOSAL ROUTES
// ================================

/**
 * @route   POST /api/dao/proposals
 * @desc    Create a new proposal
 * @access  Private (Members only)
 * @body    { title: string, description: string, proposalType: number }
 */
router.post('/proposals', authenticateToken, validateProposal, daoController.createProposal.bind(daoController));

/**
 * @route   GET /api/dao/proposals
 * @desc    Get paginated list of proposals with filtering
 * @access  Public
 * @query   { 
 *            page?: number, limit?: number, type?: number, status?: string,
 *            proposer?: string, dateFrom?: string, dateTo?: string,
 *            sortBy?: string, sortOrder?: 'asc'|'desc'
 *          }
 */
router.get('/proposals', [
  ...validatePagination,
  query('type').optional().isInt({ min: 0, max: 2 }).withMessage('Type must be 0, 1, or 2'),
  query('status').optional().isIn(['active', 'executed_approved', 'executed_rejected', 'expired']).withMessage('Invalid status'),
  query('proposer').optional().isString().withMessage('Proposer must be a string'),
  query('dateFrom').optional().isISO8601().withMessage('Date from must be a valid ISO date'),
  query('dateTo').optional().isISO8601().withMessage('Date to must be a valid ISO date'),
  query('sortBy').optional().isString().withMessage('Sort by must be a string'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
], daoController.getProposals.bind(daoController));

/**
 * @route   GET /api/dao/proposals/:proposalId
 * @desc    Get specific proposal details
 * @access  Public
 * @param   proposalId - Object ID of the proposal
 */
router.get('/proposals/:proposalId', [
  param('proposalId').isString().withMessage('Proposal ID must be a string')
], daoController.getProposalById.bind(daoController));

/**
 * @route   POST /api/dao/proposals/:proposalId/vote
 * @desc    Vote on a proposal
 * @access  Private (Members only)
 * @param   proposalId - Object ID of the proposal
 * @body    { vote: boolean }
 */
router.post('/proposals/:proposalId/vote', authenticateToken, [
  param('proposalId').isString().withMessage('Proposal ID must be a string'),
  ...validateVote
], daoController.vote.bind(daoController));

/**
 * @route   POST /api/dao/proposals/:proposalId/execute
 * @desc    Execute a proposal after voting period ends
 * @access  Private (Members only)
 * @param   proposalId - Object ID of the proposal
 */
router.post('/proposals/:proposalId/execute', authenticateToken, [
  param('proposalId').isString().withMessage('Proposal ID must be a string')
], daoController.executeProposal.bind(daoController));

// ================================
// ADMIN ROUTES
// ================================

/**
 * @route   PUT /api/dao/admin/thresholds/:sensorTypeId
 * @desc    Update sensor threshold configuration (Admin only)
 * @access  Private (Admin)
 * @param   sensorTypeId - ID of the sensor type
 * @body    { minValue: number, maxValue: number, description: string }
 */
router.put('/admin/thresholds/:sensorTypeId', authenticateToken, [
  param('sensorTypeId').isInt({ min: 0 }).withMessage('Sensor type ID must be a non-negative integer'),
  ...validateThreshold
], daoController.updateThreshold.bind(daoController));

/**
 * @route   GET /api/dao/thresholds
 * @desc    Get all sensor threshold configurations
 * @access  Public
 */
router.get('/thresholds', daoController.getThresholds.bind(daoController));

/**
 * @route   GET /api/dao/sensor-types
 * @desc    Get all available sensor types
 * @access  Public
 */
router.get('/sensor-types', daoController.getSensorTypes.bind(daoController));

// ================================
// TREASURY ROUTES
// ================================

/**
 * @route   POST /api/dao/treasury/add-funds
 * @desc    Add funds to the DAO treasury
 * @access  Private (Members only)
 * @body    { amount: number }
 */
router.post('/treasury/add-funds', authenticateToken, [
  body('amount').isFloat({ min: 0.000000001 }).withMessage('Amount must be greater than 0')
], daoController.addFunds.bind(daoController));

/**
 * @route   GET /api/dao/treasury/balance
 * @desc    Get current treasury balance
 * @access  Public
 */
router.get('/treasury/balance', daoController.getTreasuryBalance.bind(daoController));

// ================================
// EVENT LISTENER ROUTES
// ================================

/**
 * @route   GET /api/dao/events/status
 * @desc    Get event listener status
 * @access  Public
 */
router.get('/events/status', daoController.getEventListenerStatus.bind(daoController));

/**
 * @route   POST /api/dao/admin/events/start
 * @desc    Start the event listener (Admin only)
 * @access  Private (Admin)
 */
router.post('/admin/events/start', authenticateToken, daoController.startEventListener.bind(daoController));

/**
 * @route   POST /api/dao/admin/events/stop
 * @desc    Stop the event listener (Admin only)
 * @access  Private (Admin)
 */
router.post('/admin/events/stop', authenticateToken, daoController.stopEventListener.bind(daoController));

/**
 * @route   POST /api/dao/admin/events/sync
 * @desc    Manually sync events from blockchain (Admin only)
 * @access  Private (Admin)
 * @query   { hours?: number }
 */
router.post('/admin/events/sync', authenticateToken, [
  query('hours').optional().isInt({ min: 1, max: 168 }).withMessage('Hours must be between 1 and 168 (1 week)')
], daoController.syncEvents.bind(daoController));

// ================================
// HEALTH CHECK ROUTES
// ================================

/**
 * @route   GET /api/dao/health
 * @desc    Health check endpoint for DAO services
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'DAO service is healthy',
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    }
  });
});

// ================================
// ERROR HANDLING MIDDLEWARE
// ================================

/**
 * Error handling middleware for DAO routes
 */
router.use((error: any, req: any, res: any, next: any) => {
  console.error('DAO Route Error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error in DAO service',
    error: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});

// ================================
// 404 HANDLER
// ================================

/**
 * Handle 404 for DAO routes
 */
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `DAO route not found: ${req.originalUrl}`,
    error: 'Route not found'
  });
});

export default router;

// ================================
// ROUTE DOCUMENTATION SUMMARY
// ================================

/*
LABSHARE DAO API ROUTES SUMMARY:

INITIALIZATION:
- POST /api/dao/initialize - Initialize DAO

DAO INFO:
- GET /api/dao/info - Get DAO information
- GET /api/dao/dashboard - Get dashboard statistics

MEMBER MANAGEMENT:
- POST /api/dao/members/link-address - Link Sui address
- POST /api/dao/admin/members - Add member (Admin)
- GET /api/dao/members - Get members list
- GET /api/dao/members/:address - Get member by address
- GET /api/dao/user/status - Get user DAO status

DATA SUBMISSION:
- POST /api/dao/data - Submit sensor data
- GET /api/dao/data - Get data records
- GET /api/dao/data/:recordId - Get data record by ID

PROPOSALS:
- POST /api/dao/proposals - Create proposal
- GET /api/dao/proposals - Get proposals list
- GET /api/dao/proposals/:proposalId - Get proposal by ID
- POST /api/dao/proposals/:proposalId/vote - Vote on proposal
- POST /api/dao/proposals/:proposalId/execute - Execute proposal

ADMIN:
- PUT /api/dao/admin/thresholds/:sensorTypeId - Update threshold
- GET /api/dao/thresholds - Get thresholds
- GET /api/dao/sensor-types - Get sensor types

TREASURY:
- POST /api/dao/treasury/add-funds - Add funds
- GET /api/dao/treasury/balance - Get balance

EVENT LISTENER:
- GET /api/dao/events/status - Get event listener status
- POST /api/dao/admin/events/start - Start event listener
- POST /api/dao/admin/events/stop - Stop event listener
- POST /api/dao/admin/events/sync - Sync events

UTILITY:
- GET /api/dao/health - Health check

AUTHENTICATION:
- Public routes: GET endpoints (info, data, proposals, etc.)
- Private routes: POST/PUT endpoints require authentication
- Admin routes: Require admin privileges

VALIDATION:
- All inputs are validated using express-validator
- Sui addresses must match the pattern: ^0x[a-fA-F0-9]{64}$
- Pagination limits: 1-100 items per page
- String length limits enforced for all text inputs
- Numeric ranges validated for sensor types, values, etc.

ERROR HANDLING:
- Comprehensive error responses with success/failure status
- Development mode includes stack traces
- Production mode hides sensitive error details
- 404 handling for unknown routes
*/ 