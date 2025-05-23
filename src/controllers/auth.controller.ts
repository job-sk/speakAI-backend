import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AppError } from '../utils/appError';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // static async refreshToken(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const { refreshToken } = req.body;
  //     if (!refreshToken) {
  //       throw new AppError('Refresh token is required', 400);
  //     }

  //     const tokens = await AuthService.refreshToken(refreshToken);
  //     res.status(200).json(tokens);
  //   } catch (error) {
  //     next(error);
  //   }
  // }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      await AuthService.logout(userId);
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }
} 