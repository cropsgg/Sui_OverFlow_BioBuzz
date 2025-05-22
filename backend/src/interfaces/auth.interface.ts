import { Request } from 'express';
import { IUser } from './user.interface';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export interface RegisterUserInput {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface TokenPayload {
  id: string;
}

export interface ResetPasswordInput {
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
} 