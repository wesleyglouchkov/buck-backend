import { Router } from 'express';
import {
  updateProfile,
  getProfile,
  changeRole,
  sendHelpRequestAsEmailToAdmin
} from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/help-request', sendHelpRequestAsEmailToAdmin);

// Shared routes of creator and member
router.use(authenticate);
router.route('/profile').get(getProfile).put(updateProfile);
router.post('/change-role', changeRole);

export default router;
