
import { Request, Response } from 'express';
import { db } from '../utils/database';
import { generateAgoraTokens } from '../utils/agora';

// --- Get Agora Token ---
export const getAgoraToken = async (req: Request, res: Response) => {
    try {
        const { streamId } = req.params;
        const { userId, role } = req.query;

        const stream = await db.stream.findUnique({ where: { id: streamId } });
        if (!stream) {
            return res.status(404).json({ success: false, message: 'Stream not found' });
        }

        const uid = userId ? hashCode(userId as string) : 0;
        
        // Generate both tokens
        const { rtcToken, rtmToken } = generateAgoraTokens(
            stream.id, 
            uid, 
            (role as 'publisher' | 'subscriber') || 'subscriber'
        );

        return res.json({
            success: true,
            token: rtcToken,      // RTC token for video/audio
            rtmToken: rtmToken,   // RTM token for signaling/messaging
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
