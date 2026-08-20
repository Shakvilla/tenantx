/**
 * Maps a failed OTP verification to what the user should read and do next.
 *
 * The backend throws an IDENTICAL error for a wrong code, a device mismatch and an expired
 * code, on purpose, so that none of them is an oracle. This module preserves that: those three
 * share one message, and nothing here may branch on anything that would let a caller tell them
 * apart. `OTP_ATTEMPTS_EXHAUSTED` is the single deliberate exception, because there — and only
 * there — the user's next action genuinely differs: no code they can type will work.
 */
export interface OtpErrorDisplay {
  message: string

  /** True when retyping a code cannot help, so the UI should return to the login form. */
  startOver: boolean
}

export function otpErrorMessage(error: unknown): OtpErrorDisplay {
  const response = (error as { response?: { status?: number; data?: { code?: string } } })?.response
  const status = response?.status
  const code = response?.data?.code

  if (code === 'OTP_ATTEMPTS_EXHAUSTED') {
    return {
      message: 'You\'ve used all attempts for this code. Start over to get a new one.',
      startOver: true
    }
  }

  if (code === 'DEVICE_ID_REQUIRED') {
    // Nothing the user typed caused this and nothing they type will fix it.
    return {
      message: 'Something went wrong on our side identifying this browser. Please start over.',
      startOver: true
    }
  }

  if (status === 429) {
    return {
      message: 'Too many codes requested. Try again in an hour.',
      startOver: false
    }
  }

  if (status === 403) {
    return {
      message: 'This sign-in attempt has expired. Please sign in again.',
      startOver: true
    }
  }

  if (code === 'OTP_INVALID' || status === 400) {
    return {
      message: 'That code isn\'t valid. It may be wrong, expired, or already used. Start over to get a new one.',
      startOver: false
    }
  }

  return {
    message: 'We couldn\'t verify that code. Please try again.',
    startOver: false
  }
}
