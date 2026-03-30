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
  fullName: z.string().min(1, 'Full name is required').max(100),
  companyName: z.string().min(1, 'Company name is required').max(100),
})

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
 * Schema for forgot password initiation (Step 1).
 */
export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

/**
 * Schema for forgot password OTP send (Step 2).
 */
export const ForgotPasswordSendOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  channel: z.enum(['EMAIL', 'SMS'], { message: 'Channel must be EMAIL or SMS' }),
})

/**
 * Schema for forgot password OTP verification (Step 3).
 */
export const ForgotPasswordVerifyOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().min(4, 'OTP must be at least 4 characters').max(8, 'OTP must be at most 8 characters'),
})

/**
 * Schema for password reset (Step 4).
 */
export const ResetPasswordSchema = z.object({
  resetToken: z.string().min(1, 'Reset token is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
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
export type ForgotPasswordSendOtpPayload = z.infer<typeof ForgotPasswordSendOtpSchema>
export type ForgotPasswordVerifyOtpPayload = z.infer<typeof ForgotPasswordVerifyOtpSchema>
export type ResetPasswordPayload = z.infer<typeof ResetPasswordSchema>
export type UpdateProfilePayload = z.infer<typeof UpdateProfileSchema>
export type ChangePasswordPayload = z.infer<typeof ChangePasswordSchema>
