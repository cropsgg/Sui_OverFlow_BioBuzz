import { Response, NextFunction } from 'express';
import { User } from '../models/user.model';
import { AppError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../interfaces/auth.interface';

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { firstName, lastName, username } = req.body;
    
    // Find user
    const user = await User.findById(req.user?._id);
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // If username is being updated, check if it's already taken
    if (username && username !== user.username) {
      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        return next(new AppError('Username already taken', 400));
      }
      user.username = username;
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    await user.save();

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user account
// @route   DELETE /api/users
// @access  Private
export const deleteAccount = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await User.findByIdAndDelete(req.user?._id);

    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}; 