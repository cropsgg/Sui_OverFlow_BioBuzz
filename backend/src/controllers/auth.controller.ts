import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { User } from '../models/user.model';
import { sendTokenResponse } from '../utils/jwt.util';
import { AppError } from '../middleware/error.middleware';
import emailUtil from '../utils/email.util';
import { 
  AuthenticatedRequest, 
  LoginUserInput, 
  RegisterUserInput, 
  ResetPasswordInput, 
  ChangePasswordInput 
} from '../interfaces/auth.interface';

// @desc    Check if email already exists
// @route   GET /api/auth/check-email
// @access  Public
export const checkEmailExists = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
      return next(new AppError('Email is required', 400));
    }

    // Check if user already exists with that email
    const emailExists = await User.findOne({ email });

    res.status(200).json({
      success: true,
      data: {
        exists: !!emailExists
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check if username already exists
// @route   GET /api/auth/check-username
// @access  Public
export const checkUsernameExists = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username } = req.query;

    if (!username || typeof username !== 'string') {
      return next(new AppError('Username is required', 400));
    }

    // Check if username already exists
    const usernameExists = await User.findOne({ username });

    res.status(200).json({
      success: true,
      data: {
        exists: !!usernameExists
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
export const resendVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Email is required', 400));
    }

    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      return next(new AppError('No user found with that email', 404));
    }

    // Check if already verified
    if (user.verified) {
      return next(new AppError('Email is already verified', 400));
    }

    // Generate new verification token if needed
    if (!user.verificationToken) {
      user.verificationToken = crypto.randomBytes(20).toString('hex');
      await user.save({ validateBeforeSave: false });
    }

    // Try to send verification email but handle failures gracefully
    const emailSent = await emailUtil.sendVerificationEmail(
      email, 
      `${user.firstName} ${user.lastName}`,
      user.verificationToken
    );

    res.status(200).json({
      success: true,
      message: emailSent 
        ? 'Verification email sent' 
        : 'Failed to send verification email due to server configuration. Please contact support.',
      emailSent
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (
  req: Request<{}, {}, RegisterUserInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { firstName, lastName, username, email, password } = req.body;

    // Check if user already exists with that email
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return next(new AppError('Email already in use. Please log in or use a different email.', 400));
    }

    // Check if username is already taken
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return next(new AppError('Username already taken. Please choose another username.', 400));
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      username,
      email,
      password,
      verificationToken
    });

    // Try to send verification email but don't fail registration if it fails
    const emailSent = await emailUtil.sendVerificationEmail(
      email,
      `${firstName} ${lastName}`,
      verificationToken
    );

    const message = emailSent 
      ? 'Registration successful. Please check your email to verify your account.'
      : 'Registration successful. Please contact support to verify your account.';

    res.status(201).json({
      success: true,
      message,
      emailSent
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email
// @access  Public
export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return next(new AppError('Invalid verification token', 400));
    }

    // Find user with the verification token
    const user = await User.findOne({ verificationToken: token });
    
    if (!user) {
      return next(new AppError('Invalid verification token', 400));
    }

    // Update user
    user.verified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now log in.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (
  req: Request<{}, {}, LoginUserInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return next(new AppError('Invalid credentials', 401));
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new AppError('Invalid credentials', 401));
    }

    // Check if user is verified
    if (!user.verified) {
      return next(new AppError('Please verify your email before logging in', 403));
    }

    // Send token response
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   GET /api/auth/logout
// @access  Private
export const logout = (
  req: Request,
  res: Response
): void => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getCurrentUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const user = await User.findById(req.user?._id);

  res.status(200).json({
    success: true,
    data: user
  });
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      return next(new AppError('There is no user with that email', 404));
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expire
    user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await user.save({ validateBeforeSave: false });

    // Try to send email but handle failures gracefully
    const emailSent = await emailUtil.sendPasswordResetEmail(
      email,
      `${user.firstName} ${user.lastName}`,
      resetToken
    );

      res.status(200).json({
        success: true,
      message: emailSent 
        ? 'Password reset email sent' 
        : 'Failed to send password reset email due to server configuration. Please contact support.',
      emailSent
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password
// @access  Public
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      return next(new AppError('Invalid or missing reset token', 400));
    }

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return next(new AppError('Invalid or expired token', 400));
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body as ChangePasswordInput;

    // Get user with password
    const user = await User.findById(req.user?._id).select('+password');
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new AppError('Current password is incorrect', 401));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Check if email is verified
// @route   POST /api/auth/check-verification
// @access  Public
export const checkEmailVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Email is required', 400));
    }

    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      // Don't expose that the email doesn't exist for security reasons
      res.status(200).json({
        success: true,
        verified: false,
        message: 'Email not verified'
      });
      return;
    }

    // Return verification status
    res.status(200).json({
      success: true,
      verified: user.verified,
      message: user.verified ? 'Email is verified' : 'Email not verified'
    });
  } catch (error) {
    next(error);
  }
}; 