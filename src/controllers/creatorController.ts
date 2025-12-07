import { Request, Response } from 'express';
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
import { createContentSchema, updateContentSchema, updateProfileSchema } from '../utils/validation';

export const getDashboardAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const creatorId = req.user!.id;
  const analytics = await getCreatorDashboardAnalytics(creatorId);

  res.status(200).json({
    success: true,
    data: analytics,
  });
});

export const getDashboardChartData = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const creatorId = req.user!.id;
  const chartData = await getCreatorDashboardChartData(creatorId);

  res.status(200).json({
    success: true,
    data: chartData,
  });
});

export const getRecentContent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const creatorId = req.user!.id;
  const content = await getCreatorRecentContent(creatorId);

  res.status(200).json({
    success: true,
    data: content,
  });
});

export const createNewContent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const creatorId = req.user!.id;
  const validatedData = createContentSchema.parse(req.body);
  const content = await createContent(creatorId, validatedData);

  res.status(201).json({
    success: true,
    message: 'Content created successfully',
    data: content,
  });
});

export const updateExistingContent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const creatorId = req.user!.id;
  const { contentId } = req.params;
  const validatedData = updateContentSchema.parse(req.body);
  const content = await updateContent(contentId, creatorId, validatedData);

  res.status(200).json({
    success: true,
    message: 'Content updated successfully',
    data: content,
  });
});

export const removeContent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const creatorId = req.user!.id;
  const { contentId } = req.params;
  await deleteContent(contentId, creatorId);

  res.status(200).json({
    success: true,
    message: 'Content deleted successfully',
  });
});

export const getContentList = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const creatorId = req.user!.id;
  const { contentId } = req.params;
  const content = await getContent(creatorId, contentId);

  res.status(200).json({
    success: true,
    data: content,
  });
});

export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const creatorId = req.user!.id;
  const validatedData = updateProfileSchema.parse(req.body);
  const updatedProfile = await updateCreatorProfile(creatorId, validatedData);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedProfile,
  });
});

export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const creatorId = req.user!.id;
  const profile = await getCreatorProfile(creatorId);

  res.status(200).json({
    success: true,
    data: profile,
  });
});
