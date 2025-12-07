import { Router } from 'express';
import {
  getDashboardData,
  getSubscriptions,
  subscribe,
  unsubscribe,
  updateProfile,
  getProfile,
  getRecommendations
} from '../controllers/memberController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All member routes require authentication and member role
router.use(authenticate);
router.use(authorize('MEMBER'));

// Dashboard routes
router.get('/dashboard', getDashboardData);
router.get('/recommendations', getRecommendations);

// Subscription routes
router.get('/subscriptions', getSubscriptions);
router.post('/subscribe', subscribe);
router.delete('/subscriptions/:subscriptionId', unsubscribe);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

export default router;
