import { Request, Response, NextFunction } from 'express';
import * as expressValidator from 'express-validator';
import { AppError } from '../middleware/error.middleware';

const { validationResult } = expressValidator;

// Middleware to check validation results
export const validate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors.array().map((err: any) => err.msg).join(', ');
    return next(new AppError(message, 400));
  }
  next();
};

// Function to use validation rules
export const validation = (validations: any[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    for (let validation of validations) {
      const result = await validation.run(req);
      if (!result.isEmpty()) break;
    }

    validate(req, res, next);
  };
}; 