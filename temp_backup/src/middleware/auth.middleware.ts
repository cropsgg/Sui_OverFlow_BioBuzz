import { Response, NextFunction } from 'express';
import { User } from '../models/user.model';
import { verifyToken } from '../utils/jwt.util';
import { AppError } from './error.middleware';
import { AuthenticatedRequest } from '../interfaces/auth.interface';

export const protect = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token;

    // Check if token exists in cookies or headers
    if (req.cookies.token) {
      token = req.cookies.token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
      return next(new AppError('Not authorized to access this route', 401));
    }

    // Verify token
    const decoded = verifyToken(token);

    // Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Add user to req object
    req.user = user;
    next();
  } catch (error) {
    next(new AppError('Not authorized to access this route', 401));
  }
};

// Middleware to check if user is verified
export const isVerified = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    return next(new AppError('User not authenticated', 401));
  }

  if (!req.user.verified) {
    return next(new AppError('Please verify your email to access this route', 403));
  }

  next();
}; 