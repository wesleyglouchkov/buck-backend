import { RtcTokenBuilder, RtmTokenBuilder, RtcRole } from 'agora-token';

// For RTC (audio/video)
export function generateAgoraRtcToken(channelName: string, uid: number, role: 'publisher' | 'subscriber'): string {
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
        throw new Error('AGORA_APP_ID or AGORA_APP_CERTIFICATE is missing');
    }

    const expirationInSeconds = 7200; // 2 hours
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpire = currentTimestamp + expirationInSeconds;
    const rtcRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    return RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        uid,
        rtcRole,
        privilegeExpire,      // Absolute timestamp
        privilegeExpire       // Absolute timestamp
    );
}

// For RTM (signaling/messaging) - SEPARATE TOKEN
export function generateAgoraRtmToken(uid: string | number): string {
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
        throw new Error('AGORA_APP_ID or AGORA_APP_CERTIFICATE is missing');
    }

    const expirationInSeconds = 7200; // 2 hours (duration, not timestamp)
    
    return RtmTokenBuilder.buildToken(
        appId,
        appCertificate,
        uid.toString(),
        expirationInSeconds  // Duration in seconds (NOT a timestamp)
    );
}