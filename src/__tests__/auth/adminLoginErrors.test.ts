import { describe, it, expect } from 'vitest'

import { adminLoginErrorMessage, VAGUE_CREDENTIAL_MESSAGE } from '@/lib/api/admin-login-errors'

const err = (status?: number, code?: string) =>
  status === undefined ? new Error('Network Error') : { response: { status, data: { code } } }

describe('adminLoginErrorMessage', () => {
  it('stays vague for a genuine credential failure, so the form is not an email oracle', () => {
    expect(adminLoginErrorMessage(err(401, 'INVALID_CREDENTIALS')).message).toBe(VAGUE_CREDENTIAL_MESSAGE)
  })

  it('stays vague for a deactivated account — naming it would confirm the address exists', () => {
    expect(adminLoginErrorMessage(err(401, 'ACCOUNT_DEACTIVATED')).message).toBe(VAGUE_CREDENTIAL_MESSAGE)
  })

  it('tells a rate-limited admin the password was fine and that retrying makes it worse', () => {
    const { message } = adminLoginErrorMessage(err(429, 'OTP_RATE_LIMITED'))

    expect(message).not.toBe(VAGUE_CREDENTIAL_MESSAGE)
    expect(message).toMatch(/password was accepted/i)
    expect(message).toMatch(/15 minutes/i)
  })

  it('does not blame the password when the browser could not be identified', () => {
    const { message } = adminLoginErrorMessage(err(400, 'DEVICE_ID_REQUIRED'))

    expect(message).not.toBe(VAGUE_CREDENTIAL_MESSAGE)
    expect(message).toMatch(/password was accepted/i)
  })

  it('does not blame the password when the code could not be sent', () => {
    const { message } = adminLoginErrorMessage(err(502, 'OTP_SMS_DELIVERY_FAILED'))

    expect(message).toMatch(/could not be sent/i)
  })

  it('reports an unreachable server as such, not as bad credentials', () => {
    const { message } = adminLoginErrorMessage(err())

    expect(message).not.toBe(VAGUE_CREDENTIAL_MESSAGE)
    expect(message).toMatch(/could not reach the server/i)
  })

  it('falls back to a neutral message for an unrecognised failure', () => {
    const { message } = adminLoginErrorMessage(err(500))

    expect(message).not.toBe(VAGUE_CREDENTIAL_MESSAGE)
    expect(message).toMatch(/sign-in failed/i)
  })
})
