import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { createConnectAccountLink, disconnectConnectAccount, getConnectStatus } from '../controllers/stripeController';
import {
    getCreatorDashboard,
    getScheduledStreams,
    createStream,
    stopStream,
    changeLiveStatus,
    cancelStream,
    getStream,
    updateStream
} from '../controllers/userController';


// Creator routes
const creatorRouter = Router();

creatorRouter.use(authenticate, authorize('CREATOR'));

creatorRouter.get('/dashboard', getCreatorDashboard);

// Stripe connect routes
creatorRouter.post('/stripe/connect/create-account-link', createConnectAccountLink);
creatorRouter.post('/stripe/connect/disconnect', disconnectConnectAccount);
creatorRouter.get('/stripe/connect/status/:userId', getConnectStatus);


// Stream management routes
creatorRouter.post('/streams/create', createStream);
creatorRouter.post('/streams/:streamId/stop', stopStream);
creatorRouter.patch('/streams/:streamId/status', changeLiveStatus);  // Toggle isLive: true/false



// Creator Scheduled Streams
creatorRouter.get('/:creatorId/scheduled-streams', getScheduledStreams);
creatorRouter.route('/streams/:streamId').get(getStream).put(updateStream).delete(cancelStream);  // Get, Edit, or Cancel stream

export const creatorRoutes = creatorRouter;
