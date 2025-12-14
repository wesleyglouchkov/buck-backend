import { db } from '../utils/database';
import { CreateStreamInput, UpdateStreamInput, UpdateProfileInput } from '../utils/validation';

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

export const createStream = async (creatorId: string, data: CreateStreamInput) => {

};

export const updateStream = async (streamId: string, creatorId: string, data: UpdateStreamInput) => {
};

export const deleteStream = async (streamId: string, creatorId: string) => {
};

export const getStream = async (creatorId: string, streamId?: string) => {
};


//  Creator Profile Services
export const updateCreatorProfile = async (creatorId: string, data: UpdateProfileInput) => {
  return await db.user.update({
    where: { id: creatorId, role: 'CREATOR' },
    data,
  });
};

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
