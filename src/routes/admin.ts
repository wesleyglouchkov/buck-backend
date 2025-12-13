import { Router } from 'express';
import {
  getUsers,
  removeUser,
  changeUserStatus,
  getDashboard,
  getCreatorDetails,
  incrementUserWarnings,
  getFlaggedMessagesController,
  getFlaggedContentController
} from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('ADMIN'));

// Dashboard routes
router.get('/dashboard', getDashboard);
router.get('/get-creater-profile/:id', getCreatorDetails);
router.patch('/increment-warnings/:userId', incrementUserWarnings);


// User management routes
router.get('/users', getUsers);
router.patch('/user/:userId', changeUserStatus)
router.delete('/users/:userType/:userId', removeUser);

// Moderation routes
router.get('/moderation/messages', getFlaggedMessagesController);
router.get('/moderation/content', getFlaggedContentController);

export default router;

