import { RtcTokenBuilder, RtmTokenBuilder, RtcRole } from 'agora-token';

export interface AgoraTokens {
    rtcToken: string;
    rtmToken: string;
}

export function generateAgoraTokens(channelName: string, uid: number, role: 'publisher' | 'subscriber'): AgoraTokens {
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
        throw new Error('AGORA_APP_ID or AGORA_APP_CERTIFICATE is missing in environment variables');
    }

    const expirationInSeconds = 7200;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationInSeconds;
    
    const rtcRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    // Generate RTC token for video/audio streaming
    const rtcToken = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        uid,
        rtcRole,
        expirationInSeconds,   // Token expiration
        expirationInSeconds    // Privilege expiration
    );

    // Generate RTM token for signaling (uses string UID)
    const rtmToken = RtmTokenBuilder.buildToken(
        appId,
        appCertificate,
        uid.toString(),        // RTM uses string user ID
        privilegeExpiredTs
    );

    return { rtcToken, rtmToken };
}