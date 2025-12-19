import { Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  getCreatorDashboardAnalytics,
  createStream as createStreamService,
  stopStream as stopStreamService,
  changeLiveStatus as changeLiveStatusService,
  updateStreamStreamService,
  cancelStream as cancelStreamService,
  getStreamService,
  updateCreatorProfile,
  getCreatorProfile,
  getScheduledStreams as getScheduledStreamsService
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
import { updateProfileSchema } from '../utils/validation';


//=============================== Shared Controllers ===============================
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

// ============================Creator Controllers ===============

/*==========Creator Dashboard==========*/
export const getCreatorDashboard = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const creatorId = req.user!.id;
  const analytics = await getCreatorDashboardAnalytics(creatorId);
  res.status(200).json({ success: true, data: analytics });
});


/*==========Streams Live================*/
export const createStream = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const creatorId = req.user!.id;
  const result = await createStreamService(creatorId, req.body);
  res.status(201).json({ success: true, ...result });
});

export const stopStream = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { streamId } = req.params;
  const { replayUrl } = req.body;
  const creatorId = req.user!.id;
  const result = await stopStreamService(streamId, creatorId, replayUrl);
  res.json({ success: true, ...result });
});

export const changeLiveStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { streamId } = req.params;
  const { isLive } = req.body;
  const creatorId = req.user!.id;
  const result = await changeLiveStatusService(streamId, creatorId, isLive);
  res.json({ success: true, ...result });
});


/*============================ Scheduled Streams ==========*/
export const getScheduledStreams = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { creatorId } = req.params;
  const { startDate, endDate } = req.query;
  const streams = await getScheduledStreamsService(creatorId, startDate as string, endDate as string);
  res.status(200).json({ success: true, streams });
});

export const getStream = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { streamId } = req.params;
  const stream = await getStreamService(streamId);
  res.status(200).json({ success: true, stream });
});

export const cancelStream = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { streamId } = req.params;
  const creatorId = req.user!.id;
  const result = await cancelStreamService(streamId, creatorId);
  res.json({ success: true, ...result });
});

export const updateStream = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { streamId } = req.params;
  const creatorId = req.user!.id;
  const { title, startTime, workoutType, description, thumbnail } = req.body;
  const result = await updateStreamStreamService(streamId, creatorId, { title, startTime, workoutType, description, thumbnail });
  res.json({ success: true, ...result });
});

// /**--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/





                                    //  ============================ Member Controllers ===============
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

