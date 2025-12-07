import { Router } from 'express';
import {
  getDashboardAnalytics,
  getDashboardChartData,
  getRecentContent,
  createNewContent,
  updateExistingContent,
  removeContent,
  getContentList,
  updateProfile,
  getProfile
} from '../controllers/creatorController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All creator routes require authentication and creator role
router.use(authenticate);
router.use(authorize('CREATOR'));

// Dashboard routes
router.get('/analytics', getDashboardAnalytics);
router.get('/chart-data', getDashboardChartData);
router.get('/recent-content', getRecentContent);

// Content management routes
router.get('/content', getContentList);
router.get('/content/:contentId', getContentList);
router.post('/content', createNewContent);
router.put('/content/:contentId', updateExistingContent);
router.delete('/content/:contentId', removeContent);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

export default router;
