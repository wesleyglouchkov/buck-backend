import { db } from '../utils/database';
import { sendAccountWarningEmail, sendAccountSuspensionEmail } from './emailService';

export const getAdminDashboardAnalytics = async () => {
  // Get analytics data for admin dashboard
  const totalUsers = await db.user.count();
  const activeCreators = await db.user.count({
    where: { isActive: true, role: 'CREATOR' }
  });
  const totalContent = await db.stream.count();

  return {
    totalUsers,
    activeCreators,
    totalContent,
  };
};

export const getAdminDashboardChartData = async () => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const creatorsData = [];
  const membersData = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);

    const dayName = days[date.getDay()];

    const creatorsCount = await db.user.count({
      where: {
        role: 'CREATOR',
        createdAt: {
          gte: date,
          lt: nextDate
        }
      }
    });

    const membersCount = await db.user.count({
      where: {
        role: 'MEMBER',
        createdAt: {
          gte: date,
          lt: nextDate
        }
      }
    });

    creatorsData.push({ name: dayName, value: creatorsCount });
    membersData.push({ name: dayName, value: membersCount });
  }

  return {
    creators: creatorsData,
    members: membersData
  };
};

export const getAdminRecentActivity = async () => {
  // Get recent activity (user registrations, content creation, etc.)
  const recentUsers = await db.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, createdAt: true, role: true },
  });

  const recentContent = await db.stream.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { creator: { select: { name: true } } },
  });

  return {
    recentUsers,
    recentContent,
  };
};

export const getAllUsers = async (query: { page: number, limit: number, type: 'creator' | 'member', search?: string, isActive?: boolean }) => {
  const { page, limit, type = 'creator', search, isActive } = query;
  const offset = (page - 1) * limit;

  const whereClause = search ? {
    OR: [
      { name: { contains: search, mode: 'insensitive' as const } },
      { email: { contains: search, mode: 'insensitive' as const } }
    ]
  } : {};

  const roleType = type.toUpperCase() as 'CREATOR' | 'MEMBER';
  return await db.user.findMany({
    where: {
      ...whereClause,
      role: roleType,
      isActive
    },
    select: { id: true, name: true, username: true, email: true, createdAt: true, role: true, isActive: true },
    skip: offset,
    take: limit,
    orderBy: { createdAt: 'desc' }
  });

  return [];
};

export const deleteUser = async (userId: string, userType: 'admin' | 'creator' | 'member') => {
  switch (userType) {
    case 'admin':
      return await db.admin.delete({ where: { id: userId } });
    case 'creator':
    case 'member':
      return await db.user.delete({ where: { id: userId } });
    default:
      throw new Error('Invalid user type');
  }
};

export const toggleUserStatus = async (userId: string, userType: 'creator' | 'member') => {
  const user = await db.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new Error('User not found');
  }

  return await db.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
  });
};

export const changeAnyUserStatus = async (userId: string) => {
  const user = await db.user.findUnique({ where: { id: userId } });

  if (!user) throw new Error('User not found');

  const newIsActive = !user.isActive;

  if (newIsActive === false) {
    try {
      await sendAccountSuspensionEmail(user.email, user.username || 'User');
    } catch (error) {
      console.error('Failed to send suspension email:', error);
    }
  }

  return await db.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
  });
};

export const getDashboardStats = async () => {
  // 1. Basic Counts
  const totalUsers = await db.user.count();
  const activeCreators = await db.user.count({ where: { isActive: true, role: 'CREATOR' } });
  const totalContent = await db.stream.count();

  // 2. Recent Signups (Members only for now as per "new users")
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const newUsersCount = await db.user.count({
    where: { createdAt: { gte: sevenDaysAgo } }
  });

  const recentUsers = await db.user.findMany({
    take: 5,
    where: { createdAt: { gte: sevenDaysAgo } },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, createdAt: true, role: true }
  });

  // 3. Financials (Mocked)
  const totalRevenue = 142890;
  const avgRevenuePerCreator = 1234;

  return {
    overview: {
      totalUsers,
      activeCreators,
      totalContent,
      totalRevenue,
      avgRevenuePerCreator
    },
    recentSignups: {
      count: newUsersCount,
      users: recentUsers
    }
  };
};

export const getTopCreators = async () => {
  // Fetch creators with their follower count, tip revenue, and subscription revenue
  const creators = await db.user.findMany({
    where: { isActive: true, role: 'CREATOR' },
    select: { id: true, name: true, username: true, email: true, bio: true, avatar: true, subscriptionPrice: true, stripe_connected: true,  stripe_onboarding_completed: true,  isWarnedTimes: true,  createdAt: true,
      _count: {
        select: {
          followers: true, // Count of Follow records where this user is followed
          subscribers: true, // Count of active subscribers
          createdStreams: true // Total streams created
        }
      },
      tipCreatorTransactions: {
        where: {
          status: 'completed' // Only count completed transactions
        },
        select: {
          creator_receives_cents: true
        }
      },
      subscribers: {
        where: {
          status: 'active' // Only count active subscriptions
        },
        select: {
          fee: true // Monthly subscription fee
        }
      }
    },
  });

  // Calculate total revenue for each creator and prepare the data
  const creatorsWithStats = creators.map((creator) => {
    // Sum up all completed tip transactions (creator_receives_cents)
    const totalTipRevenueCents = creator.tipCreatorTransactions.reduce(
      (sum, transaction) => sum + transaction.creator_receives_cents,
      0
    );

    // Sum up all active subscription fees (convert Decimal to number)
    const totalSubscriptionRevenue = creator.subscribers.reduce(
      (sum, subscription) => sum + subscription.fee.toNumber(),
      0
    );

    // Convert tip cents to dollars and add subscription revenue
    const totalRevenue = (totalTipRevenueCents / 100) + totalSubscriptionRevenue;

    return {
      id: creator.id,
      name: creator.name,
      username: creator.username,
      email: creator.email,
      bio: creator.bio,
      avatar: creator.avatar,
      subscriptionPrice: creator.subscriptionPrice ? creator.subscriptionPrice.toNumber() : null,
      stripeConnected: creator.stripe_connected,
      stripeOnboardingCompleted: creator.stripe_onboarding_completed,
      warningCount: creator.isWarnedTimes,
      joinedAt: creator.createdAt,
      followers: creator._count.followers,
      subscriberCount: creator._count.subscribers,
      totalStreams: creator._count.createdStreams,
      revenue: totalRevenue,
    };
  });

  // Sort by revenue (descending) and take top 5
  const topCreators = creatorsWithStats.sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((creator, index) => ({
      ...creator,
      rank: index + 1,
    }));

  return topCreators;
};

export const getCreatorProfile = async (creatorId: string) => {
  //TODO: the other info about the creator has to be added later 
  // const creator = await db.user.findUnique({
  //   where: { id: creatorId, role: 'CREATOR' },
  //   include: {
  //     _count: {
  //       select: { stream: true }
  //     }
  //   }
  // });

  // if (!creator) throw new Error('Creator not found');

  // // Exclude password from the result
  // const { password, ...creatorWithoutPassword } = creator;

  // // Mock extended stats
  // return {
  //   ...creatorWithoutPassword,
  //   stats: {
  //     totalRevenue: Math.floor(Math.random() * 50000),
  //     followers: Math.floor(Math.random() * 10000),
  //     avgEngagement: '5.2%'
  //   }
  // };
};


interface UserWithWarnings {
  id: string;
  isWarnedTimes: number;
  email: string;
  username: string | null;
}

export const incrementUserWarningsService = async (userId: string, userType: 'creator' | 'member', warningMessage: string = 'Violation of community guidelines',
  violatingContent: string): Promise<UserWithWarnings> => {
  let updatedUser: UserWithWarnings;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, isWarnedTimes: true, email: true, username: true, role: true }
  });

  if (!user || (user.role !== 'CREATOR' && user.role !== 'MEMBER')) {
    throw new Error('User not found or not a creator/member');
  }

  updatedUser = await db.user.update({
    where: { id: userId },
    data: { isWarnedTimes: { increment: 1 } },
    select: { id: true, isWarnedTimes: true, email: true, username: true }
  }) as UserWithWarnings;

  // Send warning email
  try {
    await sendAccountWarningEmail(
      updatedUser.email,
      updatedUser.username || 'User',
      warningMessage,
      updatedUser.isWarnedTimes,
      violatingContent
    );
  } catch (error) {
    console.error('Failed to send warning email:', error);
  }

  return updatedUser;
};

// Get flagged messages with filters
export const getFlaggedMessages = async (query: { page: number; limit: number; search?: string; badWords?: string[] }) => {
  const { page, limit, search, badWords } = query;
  const offset = (page - 1) * limit;

  // Build where clause for search and bad word filters
  const whereClause: any = {
    flaggedMsgId: { not: null } // Only get flagged messages (not streams)
  };

  // If search is provided, search in message content, sender name, or sender email
  if (search) {
    whereClause.OR = [
      { flaggedMsg: { message: { contains: search, mode: 'insensitive' as const } } },
      { sender: { name: { contains: search, mode: 'insensitive' as const } } },
      { sender: { email: { contains: search, mode: 'insensitive' as const } } }
    ];
  }

  // If bad words filter is provided, filter messages containing those words
  if (badWords && badWords.length > 0) {
    const badWordConditions = badWords.map(word => ({
      flaggedMsg: { message: { contains: word, mode: 'insensitive' as const } }
    }));

    if (whereClause.OR) {
      whereClause.AND = [
        { OR: whereClause.OR },
        { OR: badWordConditions }
      ];
      delete whereClause.OR;
    }
    else {
      whereClause.OR = badWordConditions;
    }
  }

  const [flaggedMessages, total] = await Promise.all([
    db.flaggedContent.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            isWarnedTimes: true
          }
        },
        reporter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        flaggedMsg: {
          select: {
            id: true,
            message: true,
            timestamp: true
          }
        },
        livestream: {
          select: {
            id: true,
            title: true
          }
        }
      },
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    db.flaggedContent.count({ where: whereClause })
  ]);

  // Transform the data to match frontend expectations
  const transformedMessages = flaggedMessages.map(item => ({
    id: item.id,
    content: item.flaggedMsg?.message || '',
    sender: {
      id: item.sender.id,
      name: item.sender.name,
      email: item.sender.email,
      username: item.sender.username,
      warningCount: item.sender.isWarnedTimes
    },
    timestamp: item.flaggedMsg?.timestamp || item.createdAt,
    flagged: true,
    reporterComment: item.reporterComment,
    streamTitle: item.livestream?.title
  }));

  return {
    messages: transformedMessages,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

// Get flagged content (streams/videos) with filters
export const getFlaggedContent = async (query: {
  page: number;
  limit: number;
}) => {
  const { page, limit } = query;
  const offset = (page - 1) * limit;

  // Only get flagged streams (not messages)
  const whereClause: any = {
    livestreamId: { not: null }
  };

  const [flaggedContent, total] = await Promise.all([
    db.flaggedContent.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            isWarnedTimes: true
          }
        },
        reporter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        livestream: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            workoutType: true,
            replayUrl: true,
            isLive: true,
            startTime: true,
            endTime: true,
            createdAt: true
          }
        }
      },
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    db.flaggedContent.count({ where: whereClause })
  ]);

  // Transform the data to match frontend expectations
  const transformedContent = flaggedContent.map(item => ({
    id: item.id,
    streamId: item.livestream?.id,
    title: item.livestream?.title || 'Untitled Stream',
    description: item.livestream?.description,
    thumbnail: item.livestream?.thumbnail || '/svgs/buck.svg',
    workoutType: item.livestream?.workoutType,
    streamUrl: item.livestream?.replayUrl, // URL for admin to view the flagged content
    isLive: item.livestream?.isLive || false,
    startTime: item.livestream?.startTime,
    endTime: item.livestream?.endTime,
    creator: {
      id: item.sender.id,
      name: item.sender.name,
      email: item.sender.email,
      username: item.sender.username,
      warningCount: item.sender.isWarnedTimes
    },
    flagged: true,
    reporterComment: item.reporterComment,
    createdAt: item.livestream?.createdAt || item.createdAt
  }));

  return {
    content: transformedContent,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};