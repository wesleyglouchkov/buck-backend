
import { Router } from 'express';
import { getAgoraToken } from '../controllers/streamController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public or Authenticated Member Routes

// Get token for a stream
// Frontend should pass ?userId=...&role=...
// Typically members are subscribers
router.get('/:streamId/token', getAgoraToken);

export const streamRoutes = router;
