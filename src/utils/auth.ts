import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { decode } from 'next-auth/jwt';
import { db } from './database';
import { UserRole } from '@prisma/client';

export interface UserPayload {
  id: string;
  email: string;
  username: string;
  name: string;
  role: UserRole;
}

export interface JWTPayload {
  user: UserPayload;
  iat: number;
  exp: number;
}

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const verifyToken = async (token: string) => {
  const decoded = await decode({
    token,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET!,
    salt: process.env.JWT_SALT || 'authjs.session-token',
  });

  if (!decoded) {
    throw new Error('Invalid token');
  }
  return { user: decoded } as unknown as JWTPayload;
};

export const generateToken = async (email: string) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

  // Delete any existing tokens for this email
  await db.passwordResetToken.deleteMany({
    where: { email },
  });

  // Create new token
  await db.passwordResetToken.create({
    data: {
      email,
      token,
      expiresAt,
    },
  });

  return token;
};

export const verifyPasswordResetToken = async (token: string) => {
  const resetToken = await db.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken) {
    throw new Error('Invalid or expired password reset token');
  }

  if (resetToken.expiresAt < new Date()) {
    // Clean up expired token
    await db.passwordResetToken.delete({
      where: { id: resetToken.id },
    });
    throw new Error('Invalid or expired password reset token');
  }

  return resetToken;
};

export const resetUserPassword = async (email: string, newPassword: string) => {
  const hashedPassword = await hashPassword(newPassword);

  // Update in Admin
  const admin = await db.admin.findUnique({ where: { email } });
  if (admin) {
    await db.admin.update({
      where: { email },
      data: { password: hashedPassword },
    });
  }

  // Update in User table for Creators and Members
  const user = await db.user.findUnique({ where: { email } });
  if (user) {
    await db.user.update({
      where: { email },
      data: { password: hashedPassword },
    });
  }

  // Clean up ALL tokens for this email
  await db.passwordResetToken.deleteMany({
    where: { email },
  });

  return true;
};


// Utility function to check if user exists in any table
export const findUserInAllTables = async (identifier: string, type: 'email' | 'username' = 'email') => {
  const whereClause = type === 'email' ? { email: identifier } : { username: identifier };

  // Check in Admin table
  const admin = await db.admin.findUnique({
    where: whereClause,
  });
  if (admin) return { user: admin, role: UserRole.ADMIN };

  // Check in User table for Creators and Members
  const user = await db.user.findUnique({
    where: whereClause,
  });
  if (user) return { user, role: user.role };

  return null;
};

// Utility function to create user in appropriate table
export const createUserInTable = async (userData: {
  name: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  bio?: string;
  avatar?: string;
}) => {
  const hashedPassword = await hashPassword(userData.password);

  switch (userData.role) {
    case UserRole.ADMIN:
      return db.admin.create({
        data: {
          name: userData.name,
          username: userData.username,
          email: userData.email,
          password: hashedPassword,
        },
      });

    case UserRole.CREATOR:
    case UserRole.MEMBER:
      return db.user.create({
        data: {
          name: userData.name,
          username: userData.username,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          bio: userData.bio,
          avatar: userData.avatar,
        },
      });

    default:
      throw new Error('Invalid user role');
  }
};
