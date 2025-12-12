import { Router } from 'express';
import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { createConnectAccountLink, disconnectConnectAccount, getConnectStatus, stripeWebhook } from '../controllers/stripeController';


// Creator routes
const creatorRouter = Router();

creatorRouter.use(authenticate, authorize('CREATOR'));

creatorRouter.post('/stripe/connect/create-account-link', createConnectAccountLink);
creatorRouter.post('/stripe/connect/disconnect', disconnectConnectAccount);
creatorRouter.get('/stripe/connect/status/:userId', getConnectStatus);

// Stripe webhook route with raw body parser

export const creatorRoutes = creatorRouter;
