
import { Router } from 'express';
import { getAgoraToken, getChatMessages, sendChatMessage, updateStreamStats } from '../controllers/streamController';
import { authenticate } from '../middleware/auth';
import { getStream } from '../controllers/userController';

const router = Router();

// Public or Authenticated Member Routes

// Get token for a stream
// Frontend should pass ?userId=...&role=...
// Typically members are subscribers
router.get('/:streamId/token', getAgoraToken);
router.get('/:streamId', getStream); 

// Chat routes
router.get('/:streamId/chat', getChatMessages); // Public - get chat history
router.post('/:streamId/chat', authenticate, sendChatMessage); // Authenticated - send chat message

// Stream stats routes
router.post('/:streamId/stats', authenticate, updateStreamStats); // Authenticated - update viewer count


export const streamRoutes = router;
