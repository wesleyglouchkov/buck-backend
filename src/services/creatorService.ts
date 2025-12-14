import { db } from '../utils/database';
import { CreateStreamInput, UpdateStreamInput, UpdateProfileInput } from '../utils/validation';

export const getCreatorDashboardAnalytics = async (creatorId: string) => {
  const totalStreams = await db.stream.count({
    where: { creatorId }
  });

  const publishedStreams = await db.stream.count({
    where: { creatorId }
  });

  // Get analytics data
  const analytics = await db.stream.findMany({
    where: { creatorId },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

  const totalViews = analytics.reduce((sum: number, item: any) => sum + item.views, 0);
  const totalLikes = analytics.reduce((sum: number, item: any) => sum + item.likes, 0);
  const totalShares = analytics.reduce((sum: number, item: any) => sum + item.shares, 0);

  return {
    totalContent: totalStreams,
    publishedContent: publishedStreams,
    totalViews,
    totalLikes,
    totalShares,
    contentChange: '+12% from last month',
    viewsChange: '+25% from last month',
    likesChange: '+18% from last month',
  };
};

export const getCreatorDashboardChartData = async (creatorId: string) => {

};

export const getCreatorRecentStreams = async (creatorId: string) => {

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
