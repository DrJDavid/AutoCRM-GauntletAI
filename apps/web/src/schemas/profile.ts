import { z } from 'zod';

/**
 * Schema for validating profile data
 */
export const profileSchema = z.object({
  id: z.string().uuid('Invalid profile ID'),
  email: z.string().email('Invalid email address'),
  organization_id: z.string().uuid('Invalid organization ID').nullable(),
  role: z.enum(['admin', 'agent', 'customer'] as const),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

/**
 * Schema for creating/updating a profile
 */
export const profileUpdateSchema = profileSchema
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
  })
  .partial();

/**
 * Schema for user registration
 */
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  role: z.enum(['admin', 'agent', 'customer'] as const),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
