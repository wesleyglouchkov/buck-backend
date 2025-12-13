import { Router } from 'express';
import {
  getCreatorDashboard,
  getCreatorChartData,
  getCreatorContent,
  createNewContent,
  updateExistingContent,
  removeContent,
  getContentList,
  getMemberDashboard,
  getSubscriptions,
  subscribe,
  unsubscribe,
  getRecommendations,
  updateProfile,
  getProfile,
  changeRole,
  sendHelpRequestAsEmailToAdmin
} from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Shared routes
router.use(authenticate);
router.route('/profile').get(getProfile).put(updateProfile);
router.post('/change-role', changeRole);
router.post('/help-request', sendHelpRequestAsEmailToAdmin);
// Creator routes
const creatorRouter = Router();
creatorRouter.use(authorize('CREATOR'));
creatorRouter.get('/dashboard', getCreatorDashboard);
creatorRouter.get('/chart-data', getCreatorChartData);
creatorRouter.get('/content/recent', getCreatorContent);
creatorRouter.get('/content/:contentId?', getContentList);
creatorRouter.post('/content', createNewContent);
creatorRouter.put('/content/:contentId', updateExistingContent);
creatorRouter.delete('/content/:contentId', removeContent);

// Member routes
const memberRouter = Router();
memberRouter.use(authorize('MEMBER'));
memberRouter.get('/dashboard', getMemberDashboard);
memberRouter.get('/recommendations', getRecommendations);
memberRouter.get('/subscriptions', getSubscriptions);
memberRouter.post('/subscribe', subscribe);
memberRouter.delete('/subscriptions/:subscriptionId', unsubscribe);

router.use('/creator', creatorRouter);
router.use('/member', memberRouter);

export default router;
