import { Request, Response } from 'express';
const expressValidator = require('express-validator');
const { body, param } = expressValidator;
import { EscrowService } from '../services/escrow.service';
import {
  CreateEscrowRequest,
  DepositFundsRequest,
  CreateMilestoneRequest,
  SubmitMilestoneRequest,
  ApproveMilestoneRequest,
  RejectMilestoneRequest,
  ReleaseMilestonePaymentRequest,
  PaymentRailsErrorCodes
} from '../interfaces/payment-rails.interface';

export class EscrowController {
  private escrowService: EscrowService;

  constructor() {
    // Initialize with environment variables
    this.escrowService = EscrowService.createEscrowService({
      packageId: process.env.ESCROW_PACKAGE_ID || '0x10e7c34711af37fdc1eb46ebccf89facbc32bbffe29148f75e0d0c3700e4bab9',
      rpcUrl: process.env.SUI_RPC_URL || 'https://fullnode.devnet.sui.io:443',
    });
  }

  // ================================
  // VALIDATION RULES
  // ================================

  public static createEscrowValidation = [
    body('funder').isString().notEmpty().withMessage('Funder address is required'),
    body('beneficiary').isString().notEmpty().withMessage('Beneficiary address is required'),
    body('totalAmount').isNumeric().isFloat({ min: 1 }).withMessage('Total amount must be greater than 0'),
    body('daoReference').optional().isString(),
  ];

  public static depositFundsValidation = [
    param('escrowId').isString().notEmpty().withMessage('Escrow ID is required'),
    body('amount').isNumeric().isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
    body('senderAddress').isString().notEmpty().withMessage('Sender address is required'),
    body('coinObjectId').isString().notEmpty().withMessage('Coin object ID is required'),
  ];

  public static createMilestoneValidation = [
    param('escrowId').isString().notEmpty().withMessage('Escrow ID is required'),
    body('description').isString().notEmpty().withMessage('Description is required'),
    body('amount').isNumeric().isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
    body('dueDate').isNumeric().withMessage('Due date is required'),
    body('senderAddress').isString().notEmpty().withMessage('Sender address is required'),
    body('approvalProposalId').optional().isString(),
  ];

  public static submitMilestoneValidation = [
    param('escrowId').isString().notEmpty().withMessage('Escrow ID is required'),
    param('milestoneIndex').isNumeric().withMessage('Milestone index is required'),
    body('proofLink').isString().notEmpty().withMessage('Proof link is required'),
    body('senderAddress').isString().notEmpty().withMessage('Sender address is required'),
  ];

  public static approveMilestoneValidation = [
    param('escrowId').isString().notEmpty().withMessage('Escrow ID is required'),
    param('milestoneIndex').isNumeric().withMessage('Milestone index is required'),
    body('senderAddress').isString().notEmpty().withMessage('Sender address is required'),
  ];

  public static rejectMilestoneValidation = [
    param('escrowId').isString().notEmpty().withMessage('Escrow ID is required'),
    param('milestoneIndex').isNumeric().withMessage('Milestone index is required'),
    body('reason').isString().notEmpty().withMessage('Rejection reason is required'),
    body('senderAddress').isString().notEmpty().withMessage('Sender address is required'),
  ];

  // ================================
  // ESCROW MANAGEMENT ENDPOINTS
  // ================================

  public createEscrow = async (req: Request, res: Response): Promise<void> => {
    try {
      const { funder, beneficiary, totalAmount, daoReference, senderAddress } = req.body;

      // Basic validation
      if (!funder || !beneficiary || !totalAmount) {
        res.status(400).json({
          success: false,
          error: 'Funder, beneficiary, and totalAmount are required'
        });
        return;
      }

      const request: CreateEscrowRequest = {
        funder,
        beneficiary,
        totalAmount: parseFloat(totalAmount),
        daoReference
      };

      // Validate the request
      if (!this.escrowService.validateCreateEscrowRequest(request)) {
        res.status(400).json({
          success: false,
          error: 'Invalid escrow request parameters'
        });
        return;
      }

      const transaction = this.escrowService.buildInitializeEscrowTransaction(request, senderAddress || funder);

      res.status(200).json({
        success: true,
        message: 'Escrow transaction built successfully',
        transaction: transaction.serialize(),
        request: request
      });

    } catch (error) {
      console.error('Error creating escrow:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create escrow',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  public getEscrow = async (req: Request, res: Response): Promise<void> => {
    try {
      const { escrowId } = req.params;

      if (!escrowId) {
        res.status(400).json({
          success: false,
          error: 'Escrow ID is required'
        });
        return;
      }

      const escrowData = await this.escrowService.getEscrowAccount(escrowId);

      if (!escrowData) {
        res.status(404).json({
          success: false,
          error: 'Escrow not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: escrowData
      });

    } catch (error) {
      console.error('Error getting escrow:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get escrow information',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  public depositFunds = async (req: Request, res: Response): Promise<void> => {
    try {
      const { escrowId } = req.params;
      const { amount, senderAddress, coinObjectId } = req.body;

      if (!amount || !senderAddress || !coinObjectId) {
        res.status(400).json({
          success: false,
          error: 'Amount, senderAddress, and coinObjectId are required'
        });
        return;
      }

      const request: DepositFundsRequest = {
        escrowId,
        amount: parseFloat(amount),
        senderAddress
      };

      const transaction = this.escrowService.buildDepositFundsTransaction(request, coinObjectId);

      res.status(200).json({
        success: true,
        message: 'Deposit transaction built successfully',
        transaction: transaction.serialize(),
        request: request
      });

    } catch (error) {
      console.error('Error depositing funds:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to deposit funds',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  public getEscrowBalance = async (req: Request, res: Response): Promise<void> => {
    try {
      const { escrowId } = req.params;

      if (!escrowId) {
        res.status(400).json({
          success: false,
          error: 'Escrow ID is required'
        });
        return;
      }

      const balance = await this.escrowService.getEscrowBalance(escrowId);

      res.status(200).json({
        success: true,
        data: { balance }
      });

    } catch (error) {
      console.error('Error getting escrow balance:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get escrow balance',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // ================================
  // MILESTONE MANAGEMENT ENDPOINTS
  // ================================

  public createMilestone = async (req: Request, res: Response): Promise<void> => {
    try {
      const { escrowId } = req.params;
      const { description, amount, dueDate, senderAddress, approvalProposalId } = req.body;

      if (!description || !amount || !dueDate || !senderAddress) {
        res.status(400).json({
          success: false,
          error: 'Description, amount, dueDate, and senderAddress are required'
        });
        return;
      }

      const request: CreateMilestoneRequest = {
        escrowId,
        description,
        amount: parseFloat(amount),
        dueDate: parseInt(dueDate),
        senderAddress,
        approvalProposalId
      };

      // Validate the request
      if (!this.escrowService.validateMilestoneRequest(request)) {
        res.status(400).json({
          success: false,
          error: 'Invalid milestone request parameters'
        });
        return;
      }

      const transaction = this.escrowService.buildCreateMilestoneTransaction(request);

      res.status(200).json({
        success: true,
        message: 'Milestone creation transaction built successfully',
        transaction: transaction.serialize(),
        request: request
      });

    } catch (error) {
      console.error('Error creating milestone:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create milestone',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  public getMilestone = async (req: Request, res: Response): Promise<void> => {
    try {
      const { escrowId, milestoneIndex } = req.params;

      if (!escrowId || milestoneIndex === undefined) {
        res.status(400).json({
          success: false,
          error: 'Escrow ID and milestone index are required'
        });
        return;
      }

      const milestoneData = await this.escrowService.getMilestone(escrowId, parseInt(milestoneIndex));

      if (!milestoneData) {
        res.status(404).json({
          success: false,
          error: 'Milestone not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: milestoneData
      });

    } catch (error) {
      console.error('Error getting milestone:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get milestone information',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  public submitMilestone = async (req: Request, res: Response): Promise<void> => {
    try {
      const { escrowId, milestoneIndex } = req.params;
      const { proofLink, senderAddress } = req.body;

      if (!proofLink || !senderAddress) {
        res.status(400).json({
          success: false,
          error: 'ProofLink and senderAddress are required'
        });
        return;
      }

      const request: SubmitMilestoneRequest = {
        escrowId,
        milestoneIndex: parseInt(milestoneIndex),
        proofLink,
        senderAddress
      };

      const transaction = this.escrowService.buildSubmitMilestoneTransaction(request);

      res.status(200).json({
        success: true,
        message: 'Milestone submission transaction built successfully',
        transaction: transaction.serialize(),
        request: request
      });

    } catch (error) {
      console.error('Error submitting milestone:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit milestone',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  public approveMilestone = async (req: Request, res: Response): Promise<void> => {
    try {
      const { escrowId, milestoneIndex } = req.params;
      const { senderAddress } = req.body;

      if (!senderAddress) {
        res.status(400).json({
          success: false,
          error: 'SenderAddress is required'
        });
        return;
      }

      const request: ApproveMilestoneRequest = {
        escrowId,
        milestoneIndex: parseInt(milestoneIndex),
        senderAddress
      };

      const transaction = this.escrowService.buildApproveMilestoneTransaction(request);

      res.status(200).json({
        success: true,
        message: 'Milestone approval transaction built successfully',
        transaction: transaction.serialize(),
        request: request
      });

    } catch (error) {
      console.error('Error approving milestone:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to approve milestone',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  public rejectMilestone = async (req: Request, res: Response): Promise<void> => {
    try {
      const { escrowId, milestoneIndex } = req.params;
      const { reason, senderAddress } = req.body;

      if (!reason || !senderAddress) {
        res.status(400).json({
          success: false,
          error: 'Reason and senderAddress are required'
        });
        return;
      }

      const request: RejectMilestoneRequest = {
        escrowId,
        milestoneIndex: parseInt(milestoneIndex),
        reason,
        senderAddress
      };

      const transaction = this.escrowService.buildRejectMilestoneTransaction(request);

      res.status(200).json({
        success: true,
        message: 'Milestone rejection transaction built successfully',
        transaction: transaction.serialize(),
        request: request
      });

    } catch (error) {
      console.error('Error rejecting milestone:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reject milestone',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  public releaseMilestonePayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { escrowId, milestoneIndex } = req.params;
      const { senderAddress } = req.body;

      if (!senderAddress) {
        res.status(400).json({
          success: false,
          error: 'SenderAddress is required'
        });
        return;
      }

      const request: ReleaseMilestonePaymentRequest = {
        escrowId,
        milestoneIndex: parseInt(milestoneIndex),
        senderAddress
      };

      const transaction = this.escrowService.buildReleaseMilestonePaymentTransaction(request);

      res.status(200).json({
        success: true,
        message: 'Payment release transaction built successfully',
        transaction: transaction.serialize(),
        request: request
      });

    } catch (error) {
      console.error('Error releasing milestone payment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to release milestone payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  public checkMilestoneCompletion = async (req: Request, res: Response): Promise<void> => {
    try {
      const { escrowId, milestoneIndex } = req.params;

      if (!escrowId || milestoneIndex === undefined) {
        res.status(400).json({
          success: false,
          error: 'Escrow ID and milestone index are required'
        });
        return;
      }

      const isCompleted = await this.escrowService.isMilestoneCompleted(escrowId, parseInt(milestoneIndex));

      res.status(200).json({
        success: true,
        data: { isCompleted }
      });

    } catch (error) {
      console.error('Error checking milestone completion:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check milestone completion',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // ================================
  // DISPUTE AND CANCELLATION ENDPOINTS
  // ================================

  public initiateDispute = async (req: Request, res: Response): Promise<void> => {
    try {
      const { escrowId } = req.params;
      const { milestoneIndex, reason, senderAddress } = req.body;

      if (!escrowId || !reason || !senderAddress) {
        res.status(400).json({
          success: false,
          error: 'Escrow ID, reason, and sender address are required'
        });
        return;
      }

      const transaction = this.escrowService.buildInitiateDisputeTransaction(
        escrowId,
        milestoneIndex !== undefined ? parseInt(milestoneIndex) : null,
        reason
      );

      res.status(200).json({
        success: true,
        message: 'Dispute initiation transaction built successfully',
        transaction: transaction.serialize()
      });

    } catch (error) {
      console.error('Error initiating dispute:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to initiate dispute',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  public cancelEscrow = async (req: Request, res: Response): Promise<void> => {
    try {
      const { escrowId } = req.params;
      const { senderAddress } = req.body;

      if (!escrowId || !senderAddress) {
        res.status(400).json({
          success: false,
          error: 'Escrow ID and sender address are required'
        });
        return;
      }

      const transaction = this.escrowService.buildCancelEscrowTransaction(escrowId);

      res.status(200).json({
        success: true,
        message: 'Escrow cancellation transaction built successfully',
        transaction: transaction.serialize()
      });

    } catch (error) {
      console.error('Error cancelling escrow:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel escrow',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // ================================
  // EVENT ENDPOINTS
  // ================================

  public getEscrowEvents = async (req: Request, res: Response): Promise<void> => {
    try {
      const { escrowId } = req.params;
      const { eventType, fromCheckpoint, toCheckpoint, limit } = req.query;

      const events = await this.escrowService.queryEscrowEvents(
        escrowId,
        eventType as string,
        fromCheckpoint as string,
        toCheckpoint as string,
        limit ? parseInt(limit as string) : undefined
      );

      res.status(200).json({
        success: true,
        data: events,
        count: events.length
      });

    } catch (error) {
      console.error('Error getting escrow events:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get escrow events',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // ================================
  // UTILITY ENDPOINTS
  // ================================

  public validateAddress = async (req: Request, res: Response): Promise<void> => {
    try {
      const { address } = req.params;

      if (!address) {
        res.status(400).json({
          success: false,
          error: 'Address is required'
        });
        return;
      }

      const isValid = EscrowService.validateSuiAddress(address);

      res.status(200).json({
        success: true,
        data: { isValid, address }
      });

    } catch (error) {
      console.error('Error validating address:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate address',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  public getServiceConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      const config = this.escrowService.getConfig();

      res.status(200).json({
        success: true,
        data: {
          packageId: config.packageId,
          rpcUrl: config.rpcUrl
        }
      });

    } catch (error) {
      console.error('Error getting service config:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get service configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
} 