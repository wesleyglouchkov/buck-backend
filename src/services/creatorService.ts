import { db } from '../utils/database';
import { CreateContentInput, UpdateContentInput, UpdateProfileInput } from '../utils/validation';

export const getCreatorDashboardAnalytics = async (creatorId: string) => {
  const totalContent = await db.content.count({
    where: { creatorId }
  });

  const publishedContent = await db.content.count({
    where: { creatorId, isPublished: true }
  });

  // Get analytics data
  const analytics = await db.analytics.findMany({
    where: { creatorId },
    orderBy: { date: 'desc' },
    take: 30,
  });

  const totalViews = analytics.reduce((sum: number, item: any) => sum + item.views, 0);
  const totalLikes = analytics.reduce((sum: number, item: any) => sum + item.likes, 0);
  const totalShares = analytics.reduce((sum: number, item: any) => sum + item.shares, 0);

  return {
    totalContent,
    publishedContent,
    totalViews,
    totalLikes,
    totalShares,
    contentChange: '+12% from last month',
    viewsChange: '+25% from last month',
    likesChange: '+18% from last month',
  };
};

export const getCreatorDashboardChartData = async (creatorId: string) => {
  const analytics = await db.analytics.findMany({
    where: { creatorId },
    orderBy: { date: 'desc' },
    take: 7,
  });

  // Convert to chart format
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((day, index) => ({
    name: day,
    value: analytics[index]?.views || 0,
  }));
};

export const getCreatorRecentContent = async (creatorId: string) => {
  return await db.content.findMany({
    where: { creatorId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
};

export const createContent = async (creatorId: string, data: CreateContentInput) => {
  const content = await db.content.create({
    data: {
      ...data,
      creatorId,
    },
  });

  // Create initial analytics entry
  await db.analytics.create({
    data: {
      creatorId,
      views: 0,
      likes: 0,
      shares: 0,
    },
  });

  return content;
};

export const updateContent = async (contentId: string, creatorId: string, data: UpdateContentInput) => {
  // Verify content belongs to creator
  const content = await db.content.findFirst({
    where: { id: contentId, creatorId },
  });

  if (!content) {
    throw new Error('Content not found or access denied');
  }

  return await db.content.update({
    where: { id: contentId },
    data,
  });
};

export const deleteContent = async (contentId: string, creatorId: string) => {
  // Verify content belongs to creator
  const content = await db.content.findFirst({
    where: { id: contentId, creatorId },
  });

  if (!content) {
    throw new Error('Content not found or access denied');
  }

  return await db.content.delete({
    where: { id: contentId },
  });
};

export const getContent = async (creatorId: string, contentId?: string) => {
  if (contentId) {
    return await db.content.findFirst({
      where: { id: contentId, creatorId },
    });
  }

  return await db.content.findMany({
    where: { creatorId },
    orderBy: { createdAt: 'desc' },
  });
};

export const updateCreatorProfile = async (creatorId: string, data: UpdateProfileInput) => {
  return await db.user.update({
    where: { id: creatorId, role: 'CREATOR' },
    data,
  });
};

export const getCreatorProfile = async (creatorId: string) => {
  return await db.user.findUnique({
    where: { id: creatorId, role: 'CREATOR' },
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
      _count: {
        select: {
          content: true,
          analytics: true,
        },
      },
    },
  });
};
