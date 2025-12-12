import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { createTipPayment } from '../controllers/stripeController';

const memberRouter = Router();

memberRouter.use(authenticate, authorize('MEMBER'));

memberRouter.post('/stripe/create-tip-payment', createTipPayment);

export default memberRouter;
