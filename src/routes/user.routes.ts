import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { SpeechController } from '../controllers/speech.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { uploadAudio } from '../middlewares/audio.middleware';

const router = Router();

router.get('/me', authenticate, UserController.getCurrentUser);
router.post('/analyze-speech', 
  authenticate, 
  uploadAudio.single('audio'), 
  SpeechController.analyzeSpeech
);
router.get('/check-streak', authenticate, UserController.checkStreak);
router.patch('/update', authenticate, UserController.updateUser);

export default router; 