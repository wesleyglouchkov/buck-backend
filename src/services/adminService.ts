import { db } from '../utils/database';
import { sendAccountWarningEmail, sendAccountSuspensionEmail } from './emailService';

export const getAdminDashboardAnalytics = async () => {
  // Get analytics data for admin dashboard
  const totalUsers = await db.user.count();
  const activeCreators = await db.user.count({
    where: { isActive: true, role: 'CREATOR' }
  });
  const totalContent = await db.content.count();

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

  const recentContent = await db.content.findMany({
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

  if (!user) {
    throw new Error('User not found');
  }

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
  const totalContent = await db.content.count();

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
  // TODO: These thing needs to calculate based on the total views and total revenue
  // For now, just fetch 5 creators and mock the rest
  const creators = await db.user.findMany({
    take: 5,
    where: { isActive: true, role: 'CREATOR' },
    select: { id: true, name: true, username: true },
  });

  return creators.map((c, index) => ({
    ...c,
    rank: index + 1,
    followers: Math.floor(Math.random() * 50000) + 1000,
    revenue: Math.floor(Math.random() * 10000) + 500,
  }));
};

export const getCreatorProfile = async (creatorId: string) => {
  //TODO: the other info about the creator has to be added later 
  const creator = await db.user.findUnique({
    where: { id: creatorId, role: 'CREATOR' },
    include: {
      _count: {
        select: { content: true }
      }
    }
  });

  if (!creator) throw new Error('Creator not found');

  // Exclude password from the result
  const { password, ...creatorWithoutPassword } = creator;

  // Mock extended stats
  return {
    ...creatorWithoutPassword,
    stats: {
      totalRevenue: Math.floor(Math.random() * 50000),
      followers: Math.floor(Math.random() * 10000),
      avgEngagement: '5.2%'
    }
  };
};


interface UserWithWarnings {
  id: string;
  isWarnedTimes: number;
  email: string;
  username: string | null;
}

export const incrementUserWarningsService = async ( userId: string,  userType: 'creator' | 'member',  warningMessage: string = 'Violation of community guidelines'): Promise<UserWithWarnings> => {
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
    );
  } catch (error) {
    console.error('Failed to send warning email:', error);
  }

  return updatedUser;
};