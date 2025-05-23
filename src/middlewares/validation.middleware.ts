import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { AppError } from '../utils/appError';

export const validateRegistration = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2 })
    .withMessage('Full name must be at least 2 characters long'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('profilePhoto')
    .optional()
    .isURL()
    .withMessage('Profile photo must be a valid URL'),

  body('age')
    .notEmpty()
    .withMessage('Age is required')
    .isInt({ min: 13, max: 120 })
    .withMessage('Age must be between 13 and 120'),

  body('nativeLanguage')
    .trim()
    .notEmpty()
    .withMessage('Native language is required')
    .isLength({ min: 2 }),

  body('englishProficiency')
    .trim()
    .notEmpty()
    .withMessage('English proficiency level is required')
    .isIn(['Beginner', 'Intermediate', 'Upper Intermediate'])
    .withMessage('English proficiency must be one of: Beginner, Intermediate, Upper Intermediate'),
  
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    console.log(errors, "validatiion errors");
    if (!errors.isEmpty()) {
      const error = new AppError('Validation failed', 400);
      error.errors = errors.array();
      return next(error);
    }
    next();
  },
];

export const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required'),
  
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new AppError('Validation failed', 400);
      error.errors = errors.array();
      return next(error);
    }
    next();
  },
]; 