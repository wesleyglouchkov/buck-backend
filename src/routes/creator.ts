import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { createConnectAccountLink, disconnectConnectAccount, getConnectStatus, stripeWebhook } from '../controllers/stripeController';


// Creator routes
const creatorRouter = Router();

creatorRouter.use(authenticate, authorize('CREATOR'));

creatorRouter.post('/stripe/connect/create-account-link', createConnectAccountLink);
creatorRouter.post('/stripe/connect/disconnect', disconnectConnectAccount);
creatorRouter.get('/stripe/connect/status/:userId', getConnectStatus);

// Backend routes (webhook)
const backendRouter = Router();
// Note: webhook middleware for raw body will be set in server.ts when mounting
backendRouter.post('/stripe/webhook', stripeWebhook);

export const creatorRoutes = creatorRouter;
export const backendRoutes = backendRouter;
