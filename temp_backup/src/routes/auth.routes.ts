import express from 'express';
import {
  register,
  login,
  logout,
  getCurrentUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  checkEmailExists,
  checkUsernameExists,
  resendVerification,
  checkEmailVerification
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { validation } from '../utils/validation.util';
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation
} from '../utils/validation.schema';

const router = express.Router();

// Public routes
router.get('/check-email', checkEmailExists);
router.get('/check-username', checkUsernameExists);
router.post('/check-verification', checkEmailVerification);
router.post('/register', validation(registerValidation), register);
router.post('/login', validation(loginValidation), login);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', validation(forgotPasswordValidation), forgotPassword);
router.put('/reset-password', validation(resetPasswordValidation), resetPassword);

// Protected routes
router.use(protect);
router.get('/logout', logout);
router.get('/me', getCurrentUser);
router.put('/change-password', validation(changePasswordValidation), changePassword);

export default router; 