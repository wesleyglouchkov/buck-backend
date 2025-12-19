
import { db } from '../utils/database';
import dayjs from 'dayjs';
import { sendStreamNotification } from '../services/emailService';
import { configDotenv } from 'dotenv';

configDotenv();

export const checkStreamReminders = async () => {
    console.log('Starting stream reminder check...');
    try {
        const now = dayjs();
        const in15Minutes = now.add(15, 'minute');

        // Find streams starting in the next 15 minutes that haven't been reminded
        const upcomingStreams = await db.stream.findMany({
            where: {
                isLive: false,
                reminderSent: false,
                startTime: {
                    gte: now.toDate(),              // Starting from now
                    lte: in15Minutes.toDate(),      // Up to 15 minutes from now
                },
            },
            include: { creator: true },
        });

        if (upcomingStreams.length === 0) {
            console.log('No upcoming streams found for reminders.');
            return;
        }

        console.log(`Found ${upcomingStreams.length} upcoming streams.`);

        // Send reminder emails
        for (const stream of upcomingStreams) {
            if (!stream.creator) continue;

            // Fetch followers and subscribers
            const followers = await db.follow.findMany({
                where: { followedId: stream.creatorId },
                include: { follower: true },
            });

            const subscribers = await db.subscription.findMany({
                where: { creatorId: stream.creatorId, status: 'active' },
                include: { member: true },
            });

            // Combine and deduplicate
            const recipients = [...new Set([
                ...followers.map(f => f.follower),
                ...subscribers.map(s => s.member),
            ])];

            console.log(`Sending reminders to ${recipients.length} recipients for stream: ${stream.title}`);

            // Send emails
            for (const recipient of recipients) {
                if (!recipient.email) continue;

                await sendStreamNotification(
                    recipient.email,
                    recipient.name,
                    {
                        type: 'reminder',
                        creatorName: stream.creator.name,
                        streamTitle: stream.title,
                        workoutType: stream.workoutType || undefined,
                        streamId: stream.id,
                        startTime: stream.startTime
                    }
                );
            }

            // Mark reminder as sent
            await db.stream.update({
                where: { id: stream.id },
                data: { reminderSent: true },
            });

            console.log(`Successfully sent reminders for stream: ${stream.id}`);
        }

        console.log('Stream reminder check completed.');
    } catch (error: any) {
        console.error('Error during stream reminder check:', error);
        throw error;
    }
};

// Allow running directly if called from command line
if (require.main === module) {
    checkStreamReminders()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}
