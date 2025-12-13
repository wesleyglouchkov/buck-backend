import { z } from 'zod';

// Auth validation schemas
export const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['ADMIN', 'CREATOR', 'MEMBER']).optional().default('MEMBER'),
  bio: z.string().optional(),
  avatar: z.string().url().optional(),
});

// Creator validation schemas
export const createContentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.string().min(1, 'Type is required'),
  url: z.string().url().optional(),
  isPublished: z.boolean().optional().default(false),
});

export const updateContentSchema = createContentSchema.partial();

// Member validation schemas
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores').optional(),
  bio: z.string().optional(),
  avatar: z.string().url().optional(),
  subscriptionPrice: z.number().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type CreateContentInput = z.infer<typeof createContentSchema>;
export type UpdateContentInput = z.infer<typeof updateContentSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const formatZodErrors = (errors: z.ZodError<any>): any => {
  return errors.errors.map((error) => ({
    name: error.path.join("."),
    message: error.message,
  }));
};
