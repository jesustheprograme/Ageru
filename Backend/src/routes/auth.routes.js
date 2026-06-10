import { Router } from 'express';
import {
  forgotPassword,
  login,
  register,
  resetPasswordController,
  sendCode,
  verifyCode,
} from '../controllers/auth.controller.js';

const router = Router();

// Endpoints publicos de autenticacion, registro y recuperacion de acceso.
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPasswordController);
router.post('/send-code', sendCode);
router.post('/verify-code', verifyCode);

export default router;
