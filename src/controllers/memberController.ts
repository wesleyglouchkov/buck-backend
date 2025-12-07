import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  getMemberDashboardData,
  getMemberSubscriptions,
  subscribeToCreator,
  unsubscribeFromCreator,
  updateMemberProfile,
  getMemberProfile,
  getMemberRecommendations
} from '../services/memberService';
import { updateProfileSchema } from '../utils/validation';

export const getDashboardData = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const memberId = req.user!.id;
  const data = await getMemberDashboardData(memberId);

  res.status(200).json({
    success: true,
    data,
  });
});

export const getSubscriptions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const memberId = req.user!.id;
  const subscriptions = await getMemberSubscriptions(memberId);

  res.status(200).json({
    success: true,
    data: subscriptions,
  });
});

export const subscribe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const memberId = req.user!.id;
  const { creatorId } = req.body;
  const subscription = await subscribeToCreator(memberId, creatorId);

  res.status(201).json({
    success: true,
    message: 'Subscribed successfully',
    data: subscription,
  });
});

export const unsubscribe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const memberId = req.user!.id;
  const { subscriptionId } = req.params;
  await unsubscribeFromCreator(memberId, subscriptionId);

  res.status(200).json({
    success: true,
    message: 'Unsubscribed successfully',
  });
});

export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const memberId = req.user!.id;
  const validatedData = updateProfileSchema.parse(req.body);
  const updatedProfile = await updateMemberProfile(memberId, validatedData);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedProfile,
  });
});

export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const memberId = req.user!.id;
  const profile = await getMemberProfile(memberId);

  res.status(200).json({
    success: true,
    data: profile,
  });
});

export const getRecommendations = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const memberId = req.user!.id;
  const recommendations = await getMemberRecommendations(memberId);

  res.status(200).json({
    success: true,
    data: recommendations,
  });
});
