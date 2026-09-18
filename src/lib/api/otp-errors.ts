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

  // DEVICE_ID_REQUIRED and VALIDATION_ERROR are grouped for the same reason: nothing the user
  // typed caused either and nothing they type will fix it. They reach this function via
  // different call sites, though, so both are matched explicitly rather than one standing in
  // for the other:
  //  - DEVICE_ID_REQUIRED is thrown by the service layer when a REQUIRED HEADER (X-Device-Id) is
  //    missing — reachable on the resend path (selectTenant sends the device id as a header,
  //    which apiClient's interceptor could in principle omit).
  //  - The verify-otp endpoints (VerifySelectTenantOtpRequestDto / the admin equivalent) instead
  //    take deviceId as a REQUIRED BODY FIELD with @NotBlank, so a blank/missing value there
  //    fails DTO validation before the handler ever runs and comes back as VALIDATION_ERROR, not
  //    DEVICE_ID_REQUIRED — that branch is written to match what the backend actually sends for
  //    THIS shape of the same underlying problem. Without it, a blank device id at verify time
  //    fell through to the generic "status === 400" bucket below and rendered "That code isn't
  //    valid" for a bug that had nothing to do with the code the user typed.
  if (code === 'DEVICE_ID_REQUIRED' || code === 'VALIDATION_ERROR') {
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

  // signupStart also routes through this module — not because signup errors are OTP errors,
  // but because Register.tsx calls otpErrorMessage for every auth failure. Without this guard
  // an EMAIL_ALREADY_EXISTS (status 400, code EMAIL_ALREADY_EXISTS) fell into the OTP catch-all
  // below and told the user "That code isn't valid" for something unrelated to any code.
  if (code === 'EMAIL_ALREADY_EXISTS') {
    return {
      message: 'An account with this email already exists. Please sign in or use a different email.',
      startOver: false
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
