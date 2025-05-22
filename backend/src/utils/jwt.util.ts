import * as jwt from 'jsonwebtoken';
import { Response } from 'express';
import { IUser } from '../interfaces/user.interface';
import { TokenPayload } from '../interfaces/auth.interface';

// Set defaults for environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT token
export const generateToken = (user: IUser): string => {
  const payload: TokenPayload = {
    id: String(user._id)
  };

  // Using as string since we know it's a string
  return jwt.sign(payload, JWT_SECRET);
};

// Set JWT token in cookie
export const sendTokenResponse = (
  user: IUser,
  statusCode: number,
  res: Response
): void => {
  // Create token
  const token = generateToken(user);

  // Cookie options
  const options = {
    expires: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token
    });
};

// Verify token
export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}; 