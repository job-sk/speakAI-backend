import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRegistration, validateLogin } from '../middlewares/validation.middleware';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', validateRegistration, AuthController.register);
router.post('/login', validateLogin, AuthController.login);
router.post('/logout', authenticate, AuthController.logout);

export default router; 