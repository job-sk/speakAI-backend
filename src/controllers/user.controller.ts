import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { AppError } from '../utils/appError';

export class UserController {
  static async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await User.findById(req.user?.userId).select('-password');
      if (!user) {
        throw new AppError('User not found', 404);
      }
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }
} 