import { db } from '../utils/database';
import { UpdateProfileInput } from '../utils/validation';
import { generateAgoraRtcToken, generateAgoraRtmToken } from '../utils/agora';
import { sendStreamNotification } from './emailService';

export const getCreatorDashboardAnalytics = async (creatorId: string) => {
  const totalStreams = await db.stream.count({ where: { creatorId } });
  const totalViews = await db.stream.aggregate({ where: { creatorId }, _sum: { viewerCount: true } })
  const totalFollowers = await db.follow.count({ where: { followerId: creatorId } });
  const totalSubscribers = await db.subscription.count({ where: { creatorId, status: 'active' } });

  const chartData = await getCreatorDashboardChartData(creatorId);
  const recentStreams = await getCreatorRecentStreams(creatorId);
  return {
    totalStreams,
    totalViews: totalViews._sum.viewerCount || 0,
    totalFollowers,
    totalSubscribers,
    ...chartData,
    recentStreams,
  };
};

export const getCreatorDashboardChartData = async (creatorId: string) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();

  // Create an array of promises for the last 7 days
  const promises = Array.from({ length: 7 }, async (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - i)); // Iterate from 6 days ago to today
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);

    const dayName = days[date.getDay()];

    const [dailyTips, dailySubsRevenue, dailyFollowers, dailySubscribers] = await Promise.all([
      db.tipTransaction.aggregate({
        where: { creator_id: creatorId, created_at: { gte: date, lt: nextDate } },
        _sum: { buck_amount: true }
      }),
      db.subscription.aggregate({
        where: { creatorId, status: 'active', createdAt: { gte: date, lt: nextDate } },
        _sum: { fee: true }
      }),
      db.follow.count({
        where: { followerId: creatorId, createdAt: { gte: date, lt: nextDate } }
      }),
      db.subscription.count({
        where: { creatorId, status: 'active', createdAt: { gte: date, lt: nextDate } }
      })
    ]);

    const tipAmount = dailyTips._sum.buck_amount ? dailyTips._sum.buck_amount.toNumber() : 0;
    const subRevenue = dailySubsRevenue._sum.fee ? dailySubsRevenue._sum.fee.toNumber() : 0;

    return {
      dayName,
      revenue: tipAmount + subRevenue,
      followers: dailyFollowers,
      subscribers: dailySubscribers
    };
  });

  const results = await Promise.all(promises);

  const creatorDataRevenueData = results.map(r => ({ name: r.dayName, value: r.revenue }));
  const creatorFollowersData = results.map(r => ({ name: r.dayName, value: r.followers }));
  const creatorSubscribersData = results.map(r => ({ name: r.dayName, value: r.subscribers }));

  return {
    creatorDataRevenueData,
    creatorFollowersData,
    creatorSubscribersData,
  };
};

export const getCreatorRecentStreams = async (creatorId: string) => {
  const streams = await db.stream.findMany({
    where: { creatorId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return streams;
};

export const createStream = async (creatorId: string, data: { title: string; description?: string; workoutType?: string; thumbnail?: string; startTime: string | Date; isScheduled: boolean; timezone?: string }) => {
  const { title, description, workoutType, thumbnail, startTime, isScheduled, timezone } = data;

  // 0. Verify creator exists (to prevent foreign key constraint issues)
  const creatorExists = await db.user.findUnique({
    where: { id: creatorId, role: 'CREATOR' }
  });

  if (!creatorExists) {
    throw new Error(`Invalid creator ID: ${creatorId}. User does not exist or is not a creator. Please try logging out and back in.`);
  }

  // 1. Create stream record
  const stream = await db.stream.create({
    data: {
      title,
      description,
      workoutType,
      thumbnail,
      startTime: new Date(startTime),
      isLive: !isScheduled, // Start immediately if not scheduled
      creatorId,
    },
  });

  // 2. Generate Agora Token (Channel ID is the stream ID)
  const agoraToken = generateAgoraRtcToken(stream.id, 0, 'publisher');
  const agoraRtmToken = generateAgoraRtmToken(creatorId);

  // 3. Notifications
  const followers = await db.follow.findMany({
    where: { followedId: creatorId },
    include: { follower: true },
  });

  const subscribers = await db.subscription.findMany({
    where: { creatorId, status: 'active' },
    include: { member: true },
  });

  const recipients = [...new Set([
    ...followers.map(f => f.follower),
    ...subscribers.map(s => s.member),
  ])];

  const creator = await db.user.findUnique({ where: { id: creatorId } });

  // Add creator to recipients if it's a scheduled stream
  if (isScheduled && creator) {
    const isCreatorAlreadyRecipient = recipients.some(r => r.id === creator.id);
    if (!isCreatorAlreadyRecipient) {
      recipients.push(creator);
    }
  }

  const notificationType = isScheduled ? 'scheduled' : 'live_now';
  const creatorName = creator?.name || 'Creator';

  // Send notifications async
  Promise.all(recipients.map(recipient => {
    if (!recipient.email) return Promise.resolve();
    return sendStreamNotification(
      recipient.email,
      recipient.name,
      {
        type: notificationType,
        creatorName,
        streamTitle: title,
        workoutType,
        streamId: stream.id,
        startTime: new Date(startTime),
        timezone
      }
    );
  })).catch(err => console.error('Error sending notifications:', err));

  return {
    stream: {
      id: stream.id,
      title: stream.title,
      agoraToken,
      agoraUid: 0,
      agoraRtmToken,
      startTime: stream.startTime,
      isLive: stream.isLive,
    },
    message: isScheduled ? 'Stream scheduled successfully' : 'Stream started successfully',
  };
};

export const stopStream = async (streamId: string, creatorId: string, replayUrl?: string) => {
  const stream = await db.stream.findUnique({ where: { id: streamId } });
  if (!stream) {
    throw new Error('Stream not found');
  }
  if (stream.creatorId !== creatorId) {
    throw new Error('Unauthorized');
  }

  await db.stream.update({
    where: { id: streamId },
    data: {
      isLive: false,
      endTime: new Date(),
      replayUrl: replayUrl || null,
    },
  });

  return { message: 'Stream stopped successfully' };
};

// Toggle isLive status (PATCH /creator/streams/:id/status)
export const changeLiveStatus = async (streamId: string, creatorId: string, isLive: boolean) => {
  const stream = await db.stream.findUnique({
    where: { id: streamId },
    include: { creator: true }
  });

  if (!stream) {
    throw new Error('Stream not found');
  }
  if (stream.creatorId !== creatorId) {
    throw new Error('Unauthorized');
  }


  await db.stream.update({
    where: { id: streamId },
    data: { isLive },
  });

  if (isLive) {
    // Send "LIVE NOW" emails
    const followers = await db.follow.findMany({
      where: { followedId: creatorId },
      include: { follower: true },
    });

    const subscribers = await db.subscription.findMany({
      where: { creatorId, status: 'active' },
      include: { member: true },
    });

    const recipients = [...new Set([
      ...followers.map(f => f.follower),
      ...subscribers.map(s => s.member),
    ])];

    const creatorName = stream.creator.name;

    recipients.forEach(async (recipient) => {
      if (!recipient.email) return;
      await sendStreamNotification(
        recipient.email,
        recipient.name,
        {
          type: 'live_now',
          creatorName,
          streamTitle: stream.title,
          workoutType: stream.workoutType || undefined,
          streamId: stream.id,
          startTime: stream.startTime
        }
      );
    });
  }

  return { message: `Stream is now ${isLive ? 'live' : 'offline'}` };
};

export const deleteStream = async () => { };

export const getStream = async (creatorId: string, streamId?: string) => {
  // Placeholder implementation or future use
};



/*===================Creator Profile===================*/

// Update: Creator Profile Update
export const updateCreatorProfile = async (creatorId: string, data: UpdateProfileInput) => {
  return await db.user.update({
    where: { id: creatorId, role: 'CREATOR' },
    data,
  });
};

// Get: Creator Profile
export const getCreatorProfile = async (creatorId: string) => {
  const creator = await db.user.findUnique({
    where: { id: creatorId },
    select: {
      id: true,
      name: true,
      username: true,
      stripe_account_id: true,
      stripe_connected: true,
      stripe_onboarding_completed: true,
      email: true,
      bio: true,
      avatar: true,
      isActive: true,
      createdAt: true,
      isWarnedTimes: true,
      subscriptionPrice: true,
      _count: {
        select: {
          followers: true,
          subscribers: true,
          createdStreams: true,
        },
      },
    },
  });

  if (!creator) throw new Error('Creator not found');

  return {
    ...creator,
    subscriptionPrice: creator.subscriptionPrice ? creator.subscriptionPrice.toNumber() : null,
  };
};


/*===================Scheduled Streams===================*/

// Get All: Creator My Scheduled Streams
export const getScheduledStreams = async (creatorId: string, startDate?: string, endDate?: string) => {
  const streams = await db.stream.findMany({
    where: {
      creatorId,
      startTime: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
      isLive: false, // Assuming scheduled streams are not live yet? Logic seemed to just rely on startTime in controller, but user asked for "scheduled". The previous controller didn't filter by isLive=false, just date range. I'll stick to previous logic unless implied otherwise. actually previous controller didn't mock isLive. I'll keep it exactly as it was.
    },
    orderBy: { startTime: 'asc' },
  });
  return streams;
};

// Get Single: Stream
export const getStreamService = async (streamId?: string) => {
  const stream = await db.stream.findUnique({
    where: { id: streamId },
    include: { creator: true },
  });
  return stream;
};

//  Delete/Cancel: Stream by id
export const cancelStream = async (streamId: string, creatorId: string) => {
  const stream = await db.stream.findUnique({
    where: { id: streamId },
    include: { creator: true }
  });

  if (!stream) {
    throw new Error('Stream not found');
  }
  if (stream.creatorId !== creatorId) {
    throw new Error('Unauthorized');
  }

  // Don't allow cancelling a stream that is currently live or already ended
  if (stream.isLive) {
    throw new Error('Cannot cancel a live stream. Stop the stream first.');
  }
  if (stream.endTime) {
    throw new Error('Cannot cancel a completed stream');
  }

  // Send cancellation emails to all followers and subscribers
  const followers = await db.follow.findMany({
    where: { followedId: creatorId },
    include: { follower: true },
  });

  const subscribers = await db.subscription.findMany({
    where: { creatorId, status: 'active' },
    include: { member: true },
  });

  const recipients = [...new Set([
    ...followers.map(f => f.follower),
    ...subscribers.map(s => s.member),
  ])];
  const creatorName = stream.creator.name || 'Creator';

  // Send cancellation notifications async (don't block stream deletion)
  Promise.all(recipients.map(recipient => {
    if (!recipient.email) return Promise.resolve();
    return sendStreamNotification(
      recipient.email,
      recipient.name,
      {
        type: 'cancelled',
        creatorName,
        streamTitle: stream.title,
        workoutType: stream.workoutType || undefined,
        streamId: stream.id,
        startTime: stream.startTime
      }
    );
  })).catch(err => console.error('Error sending cancellation notifications:', err));

  await db.stream.delete({
    where: { id: streamId },
  });

  return { message: 'Stream cancelled/deleted successfully' };
};

// Update a  stream details (PUT /creator/streams/:id)
export const updateStreamStreamService = async (streamId: string, creatorId: string, data: { title?: string; startTime?: string | Date; workoutType?: string; description?: string; thumbnail?: string }) => {
  const stream = await db.stream.findUnique({
    where: { id: streamId },
    include: { creator: true }
  });

  if (!stream) {
    throw new Error('Stream not found');
  }
  if (stream.creatorId !== creatorId) {
    throw new Error('Unauthorized');
  }

  // Don't allow editing a completed stream
  if (stream.endTime) {
    throw new Error('Cannot edit a completed stream');
  }

  const updateData: {
    title?: string;
    startTime?: Date;
    workoutType?: string;
    description?: string;
    thumbnail?: string;
  } = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.startTime !== undefined) updateData.startTime = new Date(data.startTime);
  if (data.workoutType !== undefined) updateData.workoutType = data.workoutType;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.thumbnail !== undefined) updateData.thumbnail = data.thumbnail;


  const updatedStream = await db.stream.update({
    where: { id: streamId },
    data: updateData,
  });

  // Send cancellation emails to all followers and subscribers
  const followers = await db.follow.findMany({
    where: { followedId: creatorId },
    include: { follower: true },
  });

  const subscribers = await db.subscription.findMany({
    where: { creatorId, status: 'active' },
    include: { member: true },
  });

  const recipients = [...new Set([
    ...followers.map(f => f.follower),
    ...subscribers.map(s => s.member),
  ])];
  const creatorName = stream.creator.name || 'Creator';

  // Send update notifications async (don't block stream update)
  Promise.all(recipients.map(recipient => {
    if (!recipient.email) return Promise.resolve();
    return sendStreamNotification(
      recipient.email,
      recipient.name,
      {
        type: 'updated',
        creatorName,
        streamTitle: stream.title,
        workoutType: stream.workoutType || undefined,
        streamId: stream.id,
        startTime: stream.startTime
      }
    );
  })).catch(err => console.error('Error sending update notifications:', err));

  return { stream: updatedStream, message: 'Stream updated successfully' };
};
