import { z } from 'zod'

// =============================================================================
// REGISTRATION SCHEMAS
// =============================================================================

/**
 * Password requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

/**
 * Schema for user registration.
 */
export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().max(20).optional(),
  tenantName: z.string().min(1).max(100).optional(),
  inviteCode: z.string().optional(),
}).refine(
  (data) => data.tenantName || data.inviteCode,
  { message: 'Either tenantName or inviteCode is required' }
)

/**
 * Schema for user registration when joining existing tenant.
 */
export const RegisterWithInviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().max(20).optional(),
  inviteCode: z.string().min(1, 'Invite code is required'),
})

// =============================================================================
// LOGIN SCHEMAS
// =============================================================================

/**
 * Schema for user login.
 */
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  tenantId: z.string().uuid().optional(),
})

// =============================================================================
// PASSWORD RESET SCHEMAS
// =============================================================================

/**
 * Schema for forgot password request.
 */
export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

/**
 * Schema for password reset.
 */
export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  { message: 'Passwords do not match', path: ['confirmPassword'] }
)

// =============================================================================
// PROFILE UPDATE SCHEMAS
// =============================================================================

/**
 * Schema for updating user profile.
 */
export const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  avatarUrl: z.string().url().optional().nullable(),
})

/**
 * Schema for changing password.
 */
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  { message: 'Passwords do not match', path: ['confirmPassword'] }
)

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type RegisterPayload = z.infer<typeof RegisterSchema>
export type RegisterWithInvitePayload = z.infer<typeof RegisterWithInviteSchema>
export type LoginPayload = z.infer<typeof LoginSchema>
export type ForgotPasswordPayload = z.infer<typeof ForgotPasswordSchema>
export type ResetPasswordPayload = z.infer<typeof ResetPasswordSchema>
export type UpdateProfilePayload = z.infer<typeof UpdateProfileSchema>
export type ChangePasswordPayload = z.infer<typeof ChangePasswordSchema>
