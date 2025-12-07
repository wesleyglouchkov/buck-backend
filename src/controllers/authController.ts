
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { loginUser, signupUser, logoutUser } from '../services/authService';
import { findUserInAllTables, generateToken, verifyPasswordResetToken, resetUserPassword, comparePassword } from '../utils/auth';
import { loginSchema, signupSchema } from '../utils/validation';
import { sendResetPasswordEmail } from '../services/emailService';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = loginSchema.parse(req.body);
  const result = await loginUser(validatedData);

  // Token is handled by frontend
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: result.user,
    },
  });
});

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = signupSchema.parse(req.body);
  const result = await signupUser(validatedData);

  // Token is handled by frontend
  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: {
      user: result.user,
    },
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const result = await logoutUser();

  // Clear cookie
  res.clearCookie('token');

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

export const getMe = asyncHandler(async (req: any, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

export const checkAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { username, email } = req.query;

  if (!username && !email) {
    return res.status(400).json({
      success: false,
      message: 'Username or email is required',
    });
  }

  if (username) {
    if (typeof username !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid username format' });
    }
    const existingUser = await findUserInAllTables(username, 'username');
    return res.status(200).json({
      success: true,
      available: !existingUser,
      message: existingUser ? 'Username is taken' : 'Username is available',
    });
  }

  if (email) {
    if (typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }
    const existingUser = await findUserInAllTables(email, 'email');
    return res.status(200).json({
      success: true,
      available: !existingUser,
      message: existingUser ? 'Email is taken' : 'Email is available',
    });
  }
});


export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
    });
  }

  const user = await findUserInAllTables(email, 'email');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  const token = await generateToken(email);

  // Send password reset email
  const result = await sendResetPasswordEmail(email, user.user.name, token);

  if (result?.error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to send password reset email',
    });
  }
  res.status(200).json({
    success: true,
    message: 'Password reset email sent',
    // In production, not return the token to the client for security reasons
    ...(process.env.NODE_ENV === 'development' && { token }),
  });
});

export const verifyResetToken = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Token is required',
    });
  }

  try {
    const resetToken = await verifyPasswordResetToken(token);

    // Determine which user type it is
    const user = await findUserInAllTables(resetToken.email, 'email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User associated with this token not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      email: resetToken.email,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Invalid or expired token',
    });
  }
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Token and new password are required',
    });
  }

  try {
    // Verify the token
    const resetToken = await verifyPasswordResetToken(token);

    // Find the user
    const user = await findUserInAllTables(resetToken.email, 'email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User associated with this token not found',
      });
    }

    // Reset the password
    await resetUserPassword(resetToken.email, newPassword);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Invalid or expired token',
    });
  }
});

export const changePassword = asyncHandler(async (req: any, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  const userPayload = req.user;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Old password and new password are required',
    });
  }

  // Find the user to get their current password hash
  const userRecord = await findUserInAllTables(userPayload.email, 'email');

  if (!userRecord) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Verify old password
  const isPasswordValid = await comparePassword(oldPassword, userRecord.user.password);
  if (!isPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid old password',
    });
  }

  // Update to new password
  await resetUserPassword(userPayload.email, newPassword);

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
});
