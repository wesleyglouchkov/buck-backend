
import { Request, Response } from 'express';
import { db } from '../utils/database';
import { generateAgoraRtcToken, generateAgoraRtmToken } from '../utils/agora';

// --- Get Agora Token ---
export const getAgoraToken = async (req: Request, res: Response) => {
    try {
        const { streamId } = req.params;
        const { userId, role } = req.query; // 'publisher' | 'subscriber'

        const stream = await db.stream.findUnique({ where: { id: streamId } });
        if (!stream) {
            return res.status(404).json({ success: false, message: 'Stream not found' });
        }

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
            stream
        });

    } catch (error: any) {
        console.error('Error generating token:', error);
        return res.status(500).json({ success: false, message: error.message });
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
