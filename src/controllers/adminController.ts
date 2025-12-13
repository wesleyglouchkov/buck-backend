import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { parseBoolean } from '../utils/helpers';
import {
  getAdminDashboardAnalytics,
  getAdminDashboardChartData,
  getAllUsers,
  deleteUser,
  toggleUserStatus,
  changeAnyUserStatus,
  getDashboardStats,
  getTopCreators,
  getCreatorProfile,
  incrementUserWarningsService,
  getFlaggedMessages,
  getFlaggedContent
} from '../services/adminService';


export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const stats = await getDashboardStats();
  const chartData = await getAdminDashboardChartData();
  const topCreators = await getTopCreators();

  res.status(200).json({
    success: true,
    data: {
      stats: [
        {
          title: "Total Users",
          value: stats.overview.totalUsers
        },
        {
          title: "Active Creators",
          value: stats.overview.activeCreators
        },
        {
          title: "Total Content",
          value: stats.overview.totalContent
        },
        {
          title: "Total Revenue",
          value: stats.overview.totalRevenue,
          prefix: "$"
        },
        {
          title: "Avg Revenue/Creator",
          value: stats.overview.avgRevenuePerCreator,
          prefix: "$"
        }
      ],
      recentSignups: stats.recentSignups,
      topCreators: topCreators,
      chart: chartData
    },
  });
});

export const getCreatorDetails = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const profile = await getCreatorProfile(id);

  res.status(200).json({
    success: true,
    data: profile
  });
});

export const getDashboardAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const analytics = await getAdminDashboardAnalytics();

  res.status(200).json({
    success: true,
    data: analytics,
  });
});




export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const type = (req.query.type as string) === 'member' ? 'member' : 'creator';
  const search = (req.query.search as string) || undefined;
  const isActive = parseBoolean(req.query.isActive as string);
  const users = await getAllUsers({ page, limit, type, search, isActive });

  res.status(200).json({
    success: true,
    data: users,
  });
});

export const removeUser = asyncHandler(async (req: Request, res: Response) => {
  const { userId, userType } = req.params;

  if (!['admin', 'creator', 'member'].includes(userType)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user type',
    });
  }

  await deleteUser(userId, userType as 'admin' | 'creator' | 'member');

  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
});

export const changeUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const updatedUser = await changeAnyUserStatus(userId);

  res.status(200).json({
    success: true,
    message: 'User status updated successfully',
    data: updatedUser,
  });
});

// Send warning email and increment count
export const incrementUserWarnings = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { userType, warningMessage, violatingContent } = req.body;

  if (!userId || !userType) {
    throw new Error('User ID and type are required');
  }

  if (userType !== 'creator' && userType !== 'member') {
    throw new Error('Invalid user type. Must be "creator" or "member"');
  }

  const updatedUser = await incrementUserWarningsService(
    userId,
    userType,
    warningMessage || 'A warning has been issued on your account',
    violatingContent
  );

  res.status(200).json({
    success: true,
    data: {
      id: updatedUser.id,
      isWarnedTimes: updatedUser.isWarnedTimes,
    },
  });
});

// Get flagged messages with filters
export const getFlaggedMessagesController = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = (req.query.search as string) || undefined;
  const badWords = req.query.badWords ? (req.query.badWords as string).split(',') : undefined;

  const result = await getFlaggedMessages({ page, limit, search, badWords });

  res.status(200).json({
    success: true,
    data: result,
  });
});

// Get flagged content (streams/videos) - no search needed
export const getFlaggedContentController = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const result = await getFlaggedContent({ page, limit });

  res.status(200).json({
    success: true,
    data: result,
  });
});
