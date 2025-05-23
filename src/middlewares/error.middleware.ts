import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import mongoose from 'mongoose';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      errors: err.errors,
    });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((error) => ({
      field: error.path,
      message: error.message,
    }));

    return res.status(400).json({
      status: 'fail',
      message: 'Validation Error',
      errors,
    });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      status: 'fail',
      message: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // Log unexpected errors
  console.error('Unexpected error:', err);

  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong',
  });
}; 