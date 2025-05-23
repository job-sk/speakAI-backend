import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { AppError } from '../utils/appError';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/audio/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'speech-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  console.log('Checking file type:', {
    mimetype: file.mimetype,
    originalname: file.originalname
  });
  
  // Accept only audio files
  if (file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    console.log('Invalid file type:', file.mimetype);
    cb(new AppError('Please upload only audio files.', 400));
  }
};

export const uploadAudio = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit
  }
});
