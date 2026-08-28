/**
 * Maps a failed platform-admin sign-in to what the admin should read and do next.
 *
 * The console used to render EVERY failure of `POST /admin/auth/login` as "Invalid credentials.
 * This portal is for platform administrators only." — the deliberately vague message, applied
 * indiscriminately. That vagueness is worth keeping for exactly one case and is actively harmful
 * for the rest:
 *
 *  - A genuine credential failure comes back 401 (`INVALID_CREDENTIALS`, or `ACCOUNT_DEACTIVATED`
 *    for a real-but-disabled account). Both stay vague on purpose: a distinct message for either
 *    would turn this form into an oracle for which email addresses are platform admins.
 *  - Everything else is operational state, and saying "invalid credentials" for it is a false
 *    statement about the admin's password. The case this module was written for: an admin who
 *    verifies their phone number and then signs in can trip the OTP send budget (429,
 *    `OTP_RATE_LIMITED`) — the password was correct, the wait is minutes, and the console told
 *    them their credentials were wrong. So they retried, which on a Caffeine-backed deployment
 *    extends the very window they are waiting out.
 */
export interface AdminLoginErrorDisplay {
  message: string
}

/** The vague message, kept verbatim — it is the 401 answer, not the fallback for everything. */
export const VAGUE_CREDENTIAL_MESSAGE =
  'Invalid credentials. This portal is for platform administrators only.'

export function adminLoginErrorMessage(error: unknown): AdminLoginErrorDisplay {
  const response = (error as { response?: { status?: number; data?: { code?: string } } })?.response
  const status = response?.status
  const code = response?.data?.code

  // The oracle-protecting case, and the only one.
  if (status === 401) {
    return { message: VAGUE_CREDENTIAL_MESSAGE }
  }

  if (code === 'OTP_RATE_LIMITED' || status === 429) {
    return {
      message:
        'Your password was accepted, but too many verification codes have been requested for this '
        + 'account recently. Wait about 15 minutes and sign in again — retrying now can extend the wait.'
    }
  }

  if (code === 'DEVICE_ID_REQUIRED') {
    return {
      message:
        'Your password was accepted, but this browser could not be identified for the verification '
        + 'step. Enable cookies and site data for this site, then try again.'
    }
  }

  if (code === 'OTP_SMS_DELIVERY_FAILED' || status === 502) {
    return {
      message:
        'Your password was accepted, but the verification code could not be sent. We are retrying — '
        + 'wait a moment and check your phone, or try again shortly.'
    }
  }

  // A network failure or a CORS rejection arrives with no response at all. Saying "invalid
  // credentials" here is the worst of both: wrong, and it sends the admin to reset a password
  // that was never checked.
  if (!response) {
    return {
      message: 'Could not reach the server. Check your connection and try again.'
    }
  }

  return {
    message: 'Sign-in failed. Please try again, or contact another platform administrator.'
  }
}
