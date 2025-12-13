import { db } from '../utils/database';
import { UpdateProfileInput } from '../utils/validation';

export const getMemberDashboardData = async (memberId: string) => {
  const member = await db.user.findUnique({
    where: { id: memberId, role: 'MEMBER' },
    include: {
      subscriptions: true,
    },
  });

  if (!member) {
    throw new Error('Member not found');
  }

  const totalSubscriptions = member.subscriptions.length;

  // Mock data for member dashboard
  return {
    totalSubscriptions,
    favoriteContent: 15,
    watchTime: '24h 30m',
    subscriptionsChange: '+3 new this month',
    contentChange: '+12% from last month',
    timeChange: '+2h from last week',
  };
};

export const getMemberSubscriptions = async (memberId: string) => {
  return await db.subscription.findMany({
    where: { memberId },
    include: {
      member: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
        },
      },
    },
  });
};

export const subscribeToCreator = async (memberId: string, creatorId: string) => {
  // Check if creator exists
  const creator = await db.user.findUnique({
    where: { id: creatorId, role: 'CREATOR' },
  });

  if (!creator) {
    throw new Error('Creator not found');
  }

  // Check if already subscribed
  const existingSubscription = await db.subscription.findFirst({
    where: {
      memberId,
      // Note: You might need to add creatorId to subscription table
      // For now, we'll use a simple subscription model
    },
  });

  if (existingSubscription) {
    throw new Error('Already subscribed');
  }

  return await db.subscription.create({
    data: {
      memberId,
      creatorId,
      fee: 0,
    },
  });
};

export const unsubscribeFromCreator = async (memberId: string, subscriptionId: string) => {
  const subscription = await db.subscription.findFirst({
    where: {
      id: subscriptionId,
      memberId,
    },
  });

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  return await db.subscription.delete({
    where: { id: subscriptionId },
  });
};

export const updateMemberProfile = async (memberId: string, data: UpdateProfileInput) => {
  return await db.user.update({
    where: { id: memberId, role: 'MEMBER' },
    data,
  });
};

export const getMemberProfile = async (memberId: string) => {
  return await db.user.findUnique({
    where: { id: memberId, role: 'MEMBER' },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      avatar: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      role: true,
      bio: true,
      isWarnedTimes: true,
      _count: {
        select: {
          subscriptions: true,
          following: true,
        },
      },
    },
  });
};

export const getMemberRecommendations = async (memberId: string) => {
  // Get recommended content based on subscriptions and popular content
  const popularContent = await db.stream.findMany({
    where: { creatorId: memberId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
        },
      },
    },
  });

  return popularContent;
};

export const changeUserRole = async (userId: string) => {
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.role === 'CREATOR') {
    throw new Error('User is already a creator');
  }

  return await db.user.update({
    where: { id: userId },
    data: { role: 'CREATOR' },
  });
};
