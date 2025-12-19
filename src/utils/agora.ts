
import { RtcTokenBuilder, RtcRole } from 'agora-token';

export function generateAgoraToken(channelName: string, uid: number, role: 'publisher' | 'subscriber'): string {

    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
        throw new Error('AGORA_APP_ID or AGORA_APP_CERTIFICATE is missing in environment variables');
    }

    const roleNum = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
    const expirationTimeInSeconds = 7200; // 2 hours
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    return RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        uid,
        roleNum,
        expirationTimeInSeconds,
        privilegeExpiredTs
    );
}
