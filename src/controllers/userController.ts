import { Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  getCreatorDashboardAnalytics,
  getCreatorDashboardChartData,
  getCreatorRecentContent,
  createContent,
  updateContent,
  deleteContent,
  getContent,
  updateCreatorProfile,
  getCreatorProfile
} from '../services/creatorService';
import {
  getMemberDashboardData,
  getMemberSubscriptions,
  subscribeToCreator,
  unsubscribeFromCreator,
  updateMemberProfile,
  getMemberProfile,
  getMemberRecommendations,
  changeUserRole,
} from '../services/memberService';
import { sendHelpRequestEmail } from '../services/emailService';
import { createContentSchema, updateContentSchema, updateProfileSchema } from '../utils/validation';

// Creator Controllers
export const getCreatorDashboard = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const creatorId = req.user!.id;
  const analytics = await getCreatorDashboardAnalytics(creatorId);
  res.status(200).json({ success: true, data: analytics });
});

export const getCreatorChartData = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const creatorId = req.user!.id;
  const chartData = await getCreatorDashboardChartData(creatorId);
  res.status(200).json({ success: true, data: chartData });
});

export const getCreatorContent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const creatorId = req.user!.id;
  const content = await getCreatorRecentContent(creatorId);
  res.status(200).json({ success: true, data: content });
});

export const createNewContent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const creatorId = req.user!.id;
  const validatedData = createContentSchema.parse(req.body);
  const content = await createContent(creatorId, validatedData);
  res.status(201).json({ success: true, message: 'Content created successfully', data: content });
});

export const updateExistingContent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const creatorId = req.user!.id;
  const { contentId } = req.params;
  const validatedData = updateContentSchema.parse(req.body);
  const content = await updateContent(contentId, creatorId, validatedData);
  res.status(200).json({ success: true, message: 'Content updated successfully', data: content });
});

export const removeContent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const creatorId = req.user!.id;
  const { contentId } = req.params;
  await deleteContent(contentId, creatorId);
  res.status(200).json({ success: true, message: 'Content deleted successfully' });
});

export const getContentList = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const creatorId = req.user!.id;
  const { contentId } = req.params;
  const content = await getContent(creatorId, contentId);
  res.status(200).json({ success: true, data: content });
});

// Member Controllers
export const getMemberDashboard = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const memberId = req.user!.id;
  const data = await getMemberDashboardData(memberId);
  res.status(200).json({ success: true, data });
});

export const getSubscriptions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const memberId = req.user!.id;
  const subscriptions = await getMemberSubscriptions(memberId);
  res.status(200).json({ success: true, data: subscriptions });
});

export const subscribe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const memberId = req.user!.id;
  const { creatorId } = req.body;
  const subscription = await subscribeToCreator(memberId, creatorId);
  res.status(201).json({ success: true, message: 'Subscribed successfully', data: subscription });
});

export const unsubscribe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const memberId = req.user!.id;
  const { subscriptionId } = req.params;
  await unsubscribeFromCreator(memberId, subscriptionId);
  res.status(200).json({ success: true, message: 'Unsubscribed successfully' });
});

export const getRecommendations = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const memberId = req.user!.id;
  const recommendations = await getMemberRecommendations(memberId);
  res.status(200).json({ success: true, data: recommendations });
});

// Shared Controllers
export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const validatedData = updateProfileSchema.parse(req.body);
  let updatedProfile;
  if (userRole === 'CREATOR') {
    updatedProfile = await updateCreatorProfile(userId, validatedData);
  } else {
    updatedProfile = await updateMemberProfile(userId, validatedData);
  }
  res.status(200).json({ success: true, message: 'Profile updated successfully', data: updatedProfile });
});

export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  let profile;
  if (userRole === 'CREATOR') {
    profile = await getCreatorProfile(userId);
  } else {
    profile = await getMemberProfile(userId);
  }
  res.status(200).json({ success: true, data: profile });
});

export const changeRole = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.body.userId;
  const updatedUser = await changeUserRole(userId);
  res.status(200).json({
    success: true, message: 'Role updated successfully',
    data: updatedUser
  });
});

export const sendHelpRequestAsEmailToAdmin = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { name, email, phoneNumber, country, issue } = req.body;

  // Basic validation - check required fields
  if (!name || !email || !issue) {
    return res.status(400).json({ success: false, message: 'Name, email, and issue are required' });
  }

  await sendHelpRequestEmail({
    name,
    email,
    phone: phoneNumber || 'Not provided',
    country: country || 'Not provided',
    issue
  });

  res.status(200).json({ success: true, message: 'Help request sent successfully' });
});
