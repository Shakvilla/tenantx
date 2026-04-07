/* eslint-disable lines-around-comment */
import { apiGet, apiPost, API_BASE } from './client'
import type { RegisterPayload, LoginPayload } from '../validation/schemas/auth.schema'
import {
  getStoredToken,
  getStoredTenantId,
  setStoredTokens,
  setStoredTenantId,
  clearStoredTokens
} from './storage'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Workspace returned in the global login response */
export interface Workspace {
  tenantId: string
  tenantName: string
  role: string
  userType: string
}

/** Full response from POST /global/auth/login */
export interface GlobalLoginResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
  firstTimeLogin: boolean
  workspaces: Workspace[]
}

/** Response from POST /global/auth/select-tenant */
export interface SelectTenantResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  expiresAt: string
  user: UserProfile
}

/** Response from POST /global/auth/verify-otp */
export interface VerifyOtpResponse {
  verificationToken: string
}

/** Response from POST /auth/signup */
export interface SignupResponse {
  id: string
  email: string
  fullName: string
  companyName: string
}

/** Authenticated user profile from GET /users/me */
export interface UserProfile {
  id: string
  email: string
  fullName: string
  companyName: string
  active: boolean
  createdAt: string
}

// Re-export or alias for local use if needed, but we'll use SuccessResponse/ErrorResponse logic
export type ApiResponse<T> = {
  success: boolean
  data: T | null
  error?: {
    code: string
    message: string
  }
}

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------


/**
 * Global Login — POST /global/auth/login
 * Returns user info including available workspaces.
 */
export async function globalLogin(
  credentials: LoginPayload
): Promise<ApiResponse<GlobalLoginResponse>> {
  try {
    const data = await apiPost<GlobalLoginResponse>(
      `${API_BASE}/global/auth/login`,
      credentials
    )

    // Store access token (no refresh token in global login response)
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', data.accessToken)
      // Note: We don't set the cookie here because middleware would redirect
      // to dashboard before a tenant is selected.
    }

    return { success: true, data }
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: { code: 'LOGIN_ERROR', message: error.message || 'Login failed' },
    }
  }
}

/**
 * Select Tenant — POST /global/auth/select-tenant
 * Exchanges the global token for a tenant‑scoped token.
 */
export async function selectTenant(
  tenantId: string
): Promise<ApiResponse<SelectTenantResponse>> {
  try {
    // We need to use the global token from localStorage explicitly here
    // because the interceptor might not have it yet.
    const token = getStoredToken()

    const data = await apiPost<SelectTenantResponse>(
      `${API_BASE}/global/auth/select-tenant`,
      { tenantId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    // Replace tokens with tenant-scoped ones and set cookies
    setStoredTokens(data.accessToken, data.refreshToken)
    setStoredTenantId(tenantId)

    return { success: true, data }
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: { code: 'TENANT_SELECTION_ERROR', message: error.message || 'Tenant selection failed' },
    }
  }
}

/**
 * Register / Signup — POST /auth/signup
 * Self-service account creation (creates user + tenant).
 */
export async function registerUser(payload: RegisterPayload): Promise<ApiResponse<SignupResponse>> {
  try {
    const data = await apiPost<SignupResponse>(
      `${API_BASE}/auth/signup`,
      payload
    )

    return { success: true, data }
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: { code: 'REGISTRATION_ERROR', message: error.message || 'Registration failed' },
    }
  }
}

/**
 * Request OTP — POST /global/auth/request-otp
 * Used for first-time login flow.
 */
export async function requestOtp(
  email: string
): Promise<ApiResponse<{ message: string }>> {
  try {
    const data = await apiPost<{ message: string }>(
      `${API_BASE}/global/auth/request-otp`,
      { email }
    )

    return { success: true, data }
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: { code: 'OTP_ERROR', message: error.message || 'Failed to request OTP' },
    }
  }
}

/**
 * Verify OTP — POST /global/auth/verify-otp
 */
export async function verifyOtp(
  email: string,
  otp: string
): Promise<ApiResponse<VerifyOtpResponse>> {
  try {
    const data = await apiPost<VerifyOtpResponse>(
      `${API_BASE}/global/auth/verify-otp`,
      { email, otp }
    )

    return { success: true, data }
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: { code: 'OTP_VERIFICATION_ERROR', message: error.message || 'OTP verification failed' },
    }
  }
}

/**
 * Set Password — POST /global/auth/set-password
 */
export async function setPassword(
  otpVerificationToken: string,
  newPassword: string,
  confirmPassword: string
): Promise<ApiResponse<{ message: string }>> {
  try {
    const data = await apiPost<{ message: string }>(
      `${API_BASE}/global/auth/set-password`,
      { otpVerificationToken, newPassword, confirmPassword }
    )

    return { success: true, data }
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: { code: 'PASSWORD_ERROR', message: error.message || 'Failed to set password' },
    }
  }
}

/**
 * Token Refresh — POST /auth/refresh
 */
export async function refreshTokens(tenantId: string): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
  try {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null

    if (!refreshToken) {
      return { success: false, data: null, error: { code: 'NO_TOKEN', message: 'No refresh token available' } }
    }

    const data = await apiPost<{ accessToken: string; refreshToken: string }>(
      `${API_BASE}/auth/refresh`,
      { refreshToken },
      {
        headers: {
          'X-Tenant-ID': tenantId
        }
      }
    )

    setStoredTokens(data.accessToken, data.refreshToken)

    return { success: true, data }
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: { code: 'REFRESH_ERROR', message: error.message || 'Token refresh failed' },
    }
  }
}

// ---------------------------------------------------------------------------
// Forgot Password Flow
// ---------------------------------------------------------------------------

/** Channel returned by forgot-password initiation */
export interface ForgotPasswordChannel {
  channel: 'EMAIL' | 'SMS'
  maskedAddress: string
}

/** Response from POST /global/auth/forgot-password/initiate */
export interface ForgotPasswordInitiateResponse {
  channels: ForgotPasswordChannel[]
}

/**
 * Response from POST /global/auth/forgot-password/otp/verify
 * NOTE: This endpoint returns `otpVerificationToken`, distinct from the
 * first-time-login OTP flow which returns `verificationToken`.
 */
export interface ForgotPasswordVerifyOtpResponse {
  otpVerificationToken: string
}

/**
 * Forgot Password — Step 1: Initiate
 * POST /global/auth/forgot-password/initiate
 */
export async function forgotPasswordInitiate(
  email: string
): Promise<ApiResponse<ForgotPasswordInitiateResponse>> {
  try {
    const data = await apiPost<ForgotPasswordInitiateResponse>(
      `${API_BASE}/global/auth/forgot-password/initiate`,
      { email }
    )

    return { success: true, data }
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: { code: 'FORGOT_PASSWORD_INITIATE_ERROR', message: error.message || 'Failed to initiate password reset' }
    }
  }
}

/**
 * Forgot Password — Step 2: Send OTP
 * POST /global/auth/forgot-password/otp/send
 */
export async function forgotPasswordSendOtp(
  email: string,
  channel: 'EMAIL' | 'SMS'
): Promise<ApiResponse<{ message: string }>> {
  try {
    const data = await apiPost<{ message: string }>(
      `${API_BASE}/global/auth/forgot-password/otp/send`,
      { email, channel }
    )

    return { success: true, data }
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: { code: 'FORGOT_PASSWORD_OTP_SEND_ERROR', message: error.message || 'Failed to send OTP' }
    }
  }
}

/**
 * Forgot Password — Step 3: Verify OTP
 * POST /global/auth/forgot-password/otp/verify
 * Returns `otpVerificationToken` which must be passed as `resetToken` in the final reset step.
 */
export async function forgotPasswordVerifyOtp(
  email: string,
  otp: string
): Promise<ApiResponse<ForgotPasswordVerifyOtpResponse>> {
  try {
    const data = await apiPost<ForgotPasswordVerifyOtpResponse>(
      `${API_BASE}/global/auth/forgot-password/otp/verify`,
      { email, otp }
    )

    return { success: true, data }
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: { code: 'FORGOT_PASSWORD_OTP_VERIFY_ERROR', message: error.message || 'OTP verification failed' }
    }
  }
}

/**
 * Forgot Password — Step 4: Reset Password
 * POST /global/auth/forgot-password/reset
 */
export async function forgotPasswordReset(
  resetToken: string,
  newPassword: string,
  confirmPassword: string
): Promise<ApiResponse<{ message: string }>> {
  try {
    const data = await apiPost<{ message: string }>(
      `${API_BASE}/global/auth/forgot-password/reset`,
      { resetToken, newPassword, confirmPassword }
    )

    return { success: true, data }
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: { code: 'FORGOT_PASSWORD_RESET_ERROR', message: error.message || 'Password reset failed' }
    }
  }
}

/**
 * Get Current User — GET /users/me
 */
export async function getCurrentUser(tenantId: string): Promise<ApiResponse<UserProfile>> {
  try {
    const data = await apiGet<UserProfile>(`${API_BASE}/users/me`, {
      headers: {
        'X-Tenant-ID': tenantId
      }
    })

    return { success: true, data }
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: { code: 'USER_FETCH_ERROR', message: error.message || 'Failed to fetch user profile' },
    }
  }
}

/**
 * Logout — clears stored tokens
 */
export async function logoutUser(): Promise<ApiResponse<null>> {
  clearStoredTokens()

  return { success: true, data: null }
}

// Re-export storage helpers for convenience
export { getStoredToken, getStoredTenantId, setStoredTokens, setStoredTenantId, clearStoredTokens }
