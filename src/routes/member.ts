import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { createTipPayment } from '../controllers/stripeController';
import { getMemberDashboard, getRecommendations, getSubscriptions, subscribe, unsubscribe } from '../controllers/userController';

const memberRouter = Router();

memberRouter.use(authenticate, authorize('MEMBER'));

memberRouter.get('/dashboard', getMemberDashboard);
memberRouter.get('/recommendations', getRecommendations);
memberRouter.get('/subscriptions', getSubscriptions);
memberRouter.post('/subscribe', subscribe);
memberRouter.delete('/subscriptions/:subscriptionId', unsubscribe);

memberRouter.post('/stripe/create-tip-payment', createTipPayment);

export default memberRouter;
