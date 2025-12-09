import { UserRole } from '@prisma/client';
import { findUserInAllTables, createUserInTable, comparePassword } from '../utils/auth';
import { LoginInput, SignupInput } from '../utils/validation';
import { sendWelcomeEmail } from './emailService';

export const loginUser = async (data: LoginInput) => {
  // Find user in all tables
  const result = await findUserInAllTables(data.emailOrUsername, data.emailOrUsername.includes('@') ? 'email' : 'username');
  if (!result) {
    throw new Error('Invalid email or password');
  }

  const { user } = result;
  if (user && (user.role === UserRole.CREATOR || user.role === UserRole.MEMBER) && 'isActive' in user) {
      if (user.isActive === false) {
          throw new Error("Your account is suspended");
      }
  }

  // Check password
  const isPasswordValid = await comparePassword(data.password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Frontend handles token generation
  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
    },
  };
};

export const signupUser = async ( data: SignupInput) => {
  // Check if user already exists
  const existingUser = await findUserInAllTables(data.email, 'email');
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Check if username already exists
  const existingUsername = await findUserInAllTables(data.username, 'username');
  if (existingUsername) {
    throw new Error('Username already taken');
  }

  // Create user in appropriate table
  const user = await createUserInTable({
    name: data.name,
    username: data.username,
    email: data.email,
    password: data.password,
    role: data.role as UserRole,
    bio: data.bio,
    avatar: data.avatar,
  });

  try {
    await sendWelcomeEmail(data.email, data.name);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
  // Frontend handles token generation
  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
    },
  };
};

export const logoutUser = async () => {
  // Since we're using JWT tokens, logout is handled on the frontend
  // by removing the token from cookies/localStorage
  return { message: 'Logged out successfully' };
};
