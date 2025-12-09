import { Router } from 'express';
import {
  getDashboardAnalytics,
  getRecentActivity,
  getUsers,
  removeUser,
  toggleStatus,
  changeUserStatus,
  getDashboard,
  getCreatorDetails, 
  incrementUserWarnings
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
router.get('/recent-activity', getRecentActivity);
router.patch('/increment-warnings/:userId', incrementUserWarnings);


// User management routes
router.get('/users', getUsers);
router.patch('/user/:userId', changeUserStatus)
router.delete('/users/:userType/:userId', removeUser);
router.patch('/users/:userType/:userId/toggle-status', toggleStatus);

export default router;
