import { RtcTokenBuilder, RtmTokenBuilder, RtcRole } from 'agora-token';

export function generateAgoraToken(channelName: string, uid: number, role: 'publisher' | 'subscriber'): string {
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
        throw new Error('AGORA_APP_ID or AGORA_APP_CERTIFICATE is missing in environment variables');
    }

    const expirationInSeconds = 7200;
    const rtcRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    const token = RtcTokenBuilder.buildTokenWithRtm(
        appId,
        appCertificate,
        channelName,
        uid.toString(),  // ← Convert to string here
        rtcRole,
        expirationInSeconds,
        expirationInSeconds
    );

    return token;
}