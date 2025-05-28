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

  static async checkStreak(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await User.findById(req.user?.userId);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const today = new Date().toDateString();
      const lastOpened = new Date(user.lastOpened).toDateString();

      if (today === lastOpened) {
        res.status(200).json({ streak: user.streak }); // already opened today
        return;
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const isYesterday = new Date(user.lastOpened).toDateString() === yesterday.toDateString();

      const newStreak = isYesterday ? user.streak + 1 : 1;

      user.streak = newStreak;
      user.lastOpened = new Date();
      await user.save();

      res.status(200).json({ streak: newStreak });
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const updates = req.body;
      
      // Remove any fields that shouldn't be updated
      const allowedUpdates = ['name', 'profilePhoto', 'xpPoint'];
      const updatesToApply = Object.keys(updates)
        .filter(key => allowedUpdates.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key];
          return obj;
        }, {} as Record<string, any>);

      if (Object.keys(updatesToApply).length === 0) {
        throw new AppError('No valid fields to update', 400);
      }

      // Validate specific fields
      if (updatesToApply.name && (typeof updatesToApply.name !== 'string' || updatesToApply.name.trim().length === 0)) {
        throw new AppError('Name must be a non-empty string', 400);
      }

      if (updatesToApply.age && (typeof updatesToApply.age !== 'number' || updatesToApply.age < 13 || updatesToApply.age > 120)) {
        throw new AppError('Age must be between 13 and 120', 400);
      }

      if (updatesToApply.englishProficiency && !['Beginner', 'Intermediate', 'Upper Intermediate'].includes(updatesToApply.englishProficiency)) {
        throw new AppError('Invalid English proficiency level', 400);
      }

      if (updatesToApply.xpPoint && (typeof updatesToApply.xpPoint !== 'number' || updatesToApply.xpPoint < 0)) {
        throw new AppError('XP points cannot be negative', 400);
      }

      const user = await User.findById(req.user?.userId);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Apply updates
      Object.assign(user, updatesToApply);
      await user.save();

      res.status(200).json({ 
        message: 'Updated successfully',
        user: user.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }
} 