import { Router } from 'express';
import { EscrowController } from '../controllers/escrow.controller';

const router = Router();
const escrowController = new EscrowController();

// ================================
// ESCROW MANAGEMENT ROUTES
// ================================

// Create a new escrow account
router.post(
  '/', 
  EscrowController.createEscrowValidation, 
  escrowController.createEscrow
);

// Get escrow account details
router.get('/:escrowId', escrowController.getEscrow);

// Deposit funds to escrow
router.post(
  '/:escrowId/deposit', 
  EscrowController.depositFundsValidation, 
  escrowController.depositFunds
);

// Get escrow balance
router.get('/:escrowId/balance', escrowController.getEscrowBalance);

// Cancel escrow
router.post('/:escrowId/cancel', escrowController.cancelEscrow);

// Initiate dispute
router.post('/:escrowId/dispute', escrowController.initiateDispute);

// ================================
// MILESTONE MANAGEMENT ROUTES
// ================================

// Create a new milestone
router.post(
  '/:escrowId/milestones', 
  EscrowController.createMilestoneValidation, 
  escrowController.createMilestone
);

// Get milestone details
router.get('/:escrowId/milestones/:milestoneIndex', escrowController.getMilestone);

// Submit milestone for approval
router.post(
  '/:escrowId/milestones/:milestoneIndex/submit', 
  EscrowController.submitMilestoneValidation, 
  escrowController.submitMilestone
);

// Approve milestone
router.post(
  '/:escrowId/milestones/:milestoneIndex/approve', 
  EscrowController.approveMilestoneValidation, 
  escrowController.approveMilestone
);

// Reject milestone
router.post(
  '/:escrowId/milestones/:milestoneIndex/reject', 
  EscrowController.rejectMilestoneValidation, 
  escrowController.rejectMilestone
);

// Release milestone payment
router.post(
  '/:escrowId/milestones/:milestoneIndex/release', 
  escrowController.releaseMilestonePayment
);

// Check milestone completion status
router.get('/:escrowId/milestones/:milestoneIndex/status', escrowController.checkMilestoneCompletion);

// ================================
// EVENT AND UTILITY ROUTES
// ================================

// Get escrow events
router.get('/:escrowId/events', escrowController.getEscrowEvents);

// Validate Sui address
router.get('/utils/validate/:address', escrowController.validateAddress);

// Get service configuration
router.get('/utils/config', escrowController.getServiceConfig);

export default router; 