import { Router } from 'express';
import { login, signup, logout, getMe, checkAvailability, forgotPassword, verifyResetToken, resetPassword, changePassword } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/login', login);
router.post('/signup', signup);
router.post('/forgot-password', forgotPassword);
router.post('/verify-token', verifyResetToken);
router.post('/reset-password', resetPassword);
router.get('/check-username', checkAvailability);
router.post('/change-password', authenticate, changePassword);


// Protected routes
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

export default router;
