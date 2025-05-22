import express from 'express';
import { updateProfile, deleteAccount } from '../controllers/user.controller';
import { protect, isVerified } from '../middleware/auth.middleware';

const router = express.Router();

// Protect all routes
router.use(protect);
router.use(isVerified);

// User routes
router.put('/profile', updateProfile);
router.delete('/', deleteAccount);

export default router; 