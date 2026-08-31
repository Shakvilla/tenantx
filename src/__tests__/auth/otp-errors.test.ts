import { describe, it, expect } from 'vitest'

import { otpErrorMessage } from '@/lib/api/otp-errors'

function backendError(status: number, code?: string) {
  return { response: { status, data: { code } } }
}

describe('otpErrorMessage', () => {
  it('gives one message for every OTP_INVALID cause', () => {
    const result = otpErrorMessage(backendError(400, 'OTP_INVALID'))

    expect(result.message).toMatch(/wrong, expired, or already used/i)
    expect(result.startOver).toBe(false)
  })

  it('tells the user to start over when the code is exhausted', () => {
    const result = otpErrorMessage(backendError(400, 'OTP_ATTEMPTS_EXHAUSTED'))

    expect(result.message).toMatch(/used all/i)
    expect(result.startOver).toBe(true)
  })

  it('names the wait when the send budget is spent', () => {
    const result = otpErrorMessage(backendError(429))

    expect(result.message).toMatch(/too many/i)
    expect(result.startOver).toBe(false)
  })

  it('sends the user back to the login form when the pending token is dead', () => {
    const result = otpErrorMessage(backendError(403))

    expect(result.startOver).toBe(true)
  })

  // A missing device id is OUR bug. Blaming the user's typing for it is how the backend's
  // @NotBlank guard came to exist in the first place: a null device id reads as a device
  // mismatch, indistinguishable from a wrong code, silently burning real attempts.
  it('does not blame the user for a missing device id', () => {
    const result = otpErrorMessage(backendError(400, 'DEVICE_ID_REQUIRED'))

    expect(result.message).not.toMatch(/code/i)
    expect(result.startOver).toBe(true)
  })

  // M-1: the verify-otp endpoints take deviceId as a required BODY field (@NotBlank on
  // VerifySelectTenantOtpRequestDto / its admin equivalent), so a blank/missing value there
  // fails DTO validation before DEVICE_ID_REQUIRED's own service-layer guard is ever reached —
  // the backend actually returns VALIDATION_ERROR for this shape of the same our-bug problem.
  // Without this branch it fell into the generic "status === 400" bucket below and rendered
  // "That code isn't valid" for something that had nothing to do with what the user typed.
  it('does not blame the user for a validation error either', () => {
    const result = otpErrorMessage(backendError(400, 'VALIDATION_ERROR'))

    expect(result.message).not.toMatch(/code/i)
    expect(result.startOver).toBe(true)
  })

  // signupStart (Register.tsx) also routes through otpErrorMessage. An EMAIL_ALREADY_EXISTS
  // response (status 400, code EMAIL_ALREADY_EXISTS) must not fall into the OTP catch-all and
  // tell the user "That code isn't valid" for a duplicate-email error.
  it('does not blame the user for a duplicate email during signup', () => {
    const result = otpErrorMessage(backendError(400, 'EMAIL_ALREADY_EXISTS'))

    expect(result.message).toMatch(/email/i)
    expect(result.message).not.toMatch(/code/i)
    expect(result.startOver).toBe(false)
  })

  it('falls back to a generic message for anything unrecognised', () => {
    expect(otpErrorMessage(new Error('socket hang up')).message).toBeTruthy()
  })

  // Guards the property, not an example: the module must not grow a branch that reveals WHICH
  // of the three causes occurred. A no-oracle property erodes one reasonable-looking commit
  // at a time, and this is the commit that would notice.
  it('never distinguishes the OTP_INVALID causes', () => {
    const forbidden = /device|mismatch|expired code|wrong code|incorrect code/i
    const result = otpErrorMessage(backendError(400, 'OTP_INVALID'))

    expect(result.message).not.toMatch(forbidden)
  })
})
