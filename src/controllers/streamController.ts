
import { Request, Response } from 'express';
import { db } from '../utils/database';
import { generateAgoraRtcToken, generateAgoraRtmToken } from '../utils/agora';
import { AuthenticatedRequest } from '../middleware/auth';

// --- Get Agora Token ---
export const getAgoraToken = async (req: Request, res: Response) => {
    try {
        const { streamId } = req.params;
        const { userId, role } = req.query; // 'publisher' | 'subscriber'

        const stream = await db.stream.findUnique({ where: { id: streamId } });
        if (!stream) {
            return res.status(404).json({ success: false, message: 'Stream not found' });
        }
        const user = await db.user.findUnique({ where: { id: userId as string } })
        // Determine UID: Use hashing since Agora UIDs must be Int (32-bit uint)
        // Or simpler: generate a random one if it's a viewer
        // Ideally we persist this mapping or the frontend passes a numeric ID they manage
        // For now, let's use a simple hash of the userId or just 0 if frontend doesn't strictly need persistent UIDs

        // Better: hash the UUID to a 32-bit int
        const uid = userId ? hashCode(userId as string) : 0;
        const token = generateAgoraRtcToken(stream.id, uid, (role as 'publisher' | 'subscriber') || 'subscriber');
        const rtmToken = generateAgoraRtmToken(uid);

        return res.json({
            success: true,
            token,
            rtmToken,
            uid,
            channelId: stream.id,
            appId: process.env.AGORA_APP_ID,
            stream,
            userName: user?.name,
            userAvatar: user?.avatar
        });

    } catch (error: any) {
        console.error('Error generating token:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// --- Get Chat Messages (Chat History) ---
export const getChatMessages = async (req: Request, res: Response) => {
    try {
        const { streamId } = req.params;

        // Fetch latest 100 messages ordered by timestamp ascending (oldest first)
        const messages = await db.streamChat.findMany({
            where: {
                streamId,
                isRemoved: false // Only show non-removed messages
            },
            select: {
                id: true,
                userId: true,
                message: true,
                timestamp: true,
                user: {
                    select: {
                        username: true,
                        name: true,
                        avatar: true
                    }
                },
                stream: {
                    select: {
                        creatorId: true
                    }
                }
            },
            orderBy: {
                timestamp: 'asc'
            },
            take: 100
        });

        // Map timestamp to createdAt for frontend compatibility
        const formattedMessages = messages.map(msg => ({
            id: msg.id,
            userId: msg.userId,
            message: msg.message,
            createdAt: msg.timestamp.toISOString(),
            user: msg.user,
            stream: msg.stream
        }));

        return res.json({
            success: true,
            messages: formattedMessages
        });

    } catch (error: any) {
        console.error('Error fetching chat messages:', error);
        return res.status(500).json({
            success: false,
            messages: []
        });
    }
};

// --- Send Chat Message ---
export const sendChatMessage = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { streamId } = req.params;
        const { message } = req.body;

        // Validation: User must be authenticated
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized - login required'
            });
        }

        // Validation: Message must not be empty
        const trimmedMessage = message?.trim();
        if (!trimmedMessage) {
            return res.status(400).json({
                success: false,
                error: 'Message cannot be empty'
            });
        }

        // Validation: Message max length
        if (trimmedMessage.length > 200) {
            return res.status(400).json({
                success: false,
                error: 'Message must be 200 characters or less'
            });
        }

        // Validation: Stream must exist
        const stream = await db.stream.findUnique({
            where: { id: streamId }
        });

        if (!stream) {
            return res.status(404).json({
                success: false,
                error: 'Stream not found'
            });
        }

        // Create chat message
        const chatMessage = await db.streamChat.create({
            data: {
                streamId,
                userId: req.user.id,
                message: trimmedMessage
            },
            select: {
                id: true,
                userId: true,
                message: true,
                timestamp: true
            }
        });

        return res.json({
            success: true,
            message: {
                id: chatMessage.id,
                userId: chatMessage.userId,
                message: chatMessage.message,
                createdAt: chatMessage.timestamp.toISOString()
            }
        });

    } catch (error: any) {
        console.error('Error sending chat message:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to send message'
        });
    }
};

// --- Update Stream Stats (Viewer Count) ---
export const updateStreamStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { streamId } = req.params;
        const { viewerCount } = req.body;

        // Validation: User must be authenticated
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized - login required'
            });
        }

        // Validation: viewerCount must be a positive integer
        if (typeof viewerCount !== 'number' || viewerCount < 0 || !Number.isInteger(viewerCount)) {
            return res.status(400).json({
                success: false,
                error: 'Viewer count must be a positive integer'
            });
        }

        // Validation: Stream must exist and user must be the creator
        const stream = await db.stream.findUnique({
            where: { id: streamId },
            select: {
                id: true,
                creatorId: true
            }
        });

        if (!stream) {
            return res.status(404).json({
                success: false,
                error: 'Stream not found'
            });
        }

        // Check if user is the stream owner
        if (stream.creatorId !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized - only stream owner can update stats'
            });
        }

        // Update viewer count
        await db.stream.update({
            where: { id: streamId },
            data: { viewerCount }
        });

        return res.json({
            success: true,
            viewerCount
        });

    } catch (error: any) {
        console.error('Error updating stream stats:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to update stream stats'
        });
    }
};

// Helper: Simple hash function for string to 32-bit int
function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const character = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + character;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash); // Agora UIDs are typically unsigned or positive
}
