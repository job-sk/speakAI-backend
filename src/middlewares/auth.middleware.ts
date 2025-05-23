import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/appError';
import { IJwtPayload } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: IJwtPayload;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("--------------->>",req.headers);
    
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError('No token provided', 401);
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET!
    ) as IJwtPayload;

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else {
      next(error);
    }
  }
}; 