import { Router } from 'express';
import {
  getDashboardAnalytics,
  getDashboardChartData,
  getRecentActivity,
  getUsers,
  removeUser,
  toggleStatus,
  changeUserStatus,
  getDashboard,
  getCreatorDetails
} from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('ADMIN'));

// Dashboard routes
router.get('/dashboard', getDashboard);
router.get('/get-creater-profile/:id', getCreatorDetails);
router.get('/analytics', getDashboardAnalytics);
router.get('/chart-data', getDashboardChartData);
router.get('/recent-activity', getRecentActivity);

// User management routes
router.get('/users', getUsers);
router.patch('/user/:userId', changeUserStatus)
router.delete('/users/:userType/:userId', removeUser);
router.patch('/users/:userType/:userId/toggle-status', toggleStatus);

export default router;
