import { describe, it, expect, beforeEach, vi } from 'vitest'

import type * as ApiClient from '@/lib/api/client'

vi.mock('@/lib/api/client', async importOriginal => {
  const actual = await importOriginal<typeof ApiClient>()

  return { ...actual, apiGet: vi.fn(), apiPut: vi.fn() }
})

import { apiGet, apiPut } from '@/lib/api/client'
import { contactSettingsApi, CONTACT_PHONE_PATTERN } from '@/lib/api/settings'

describe('contactSettingsApi', () => {
  beforeEach(() => vi.clearAllMocks())

  it('reads the typed endpoint, not the {category} blob route', async () => {
    vi.mocked(apiGet).mockResolvedValue({ contactPhone: '+233241234567' } as never)

    const contact = await contactSettingsApi.get()

    expect(apiGet).toHaveBeenCalledWith(expect.stringMatching(/\/settings\/contact$/))
    expect(contact.contactPhone).toBe('+233241234567')
  })

  it('writes to the typed endpoint and returns the normalised value', async () => {
    vi.mocked(apiPut).mockResolvedValue({ contactPhone: '+233241234567' } as never)

    const contact = await contactSettingsApi.update('024 123 4567')

    expect(apiPut).toHaveBeenCalledWith(expect.stringMatching(/\/settings\/contact$/), {
      contactPhone: '024 123 4567'
    })

    // The landlord typed a local number; tenants dial the E.164 one.
    expect(contact.contactPhone).toBe('+233241234567')
  })

  it('an unset number comes back as null rather than failing', async () => {
    vi.mocked(apiGet).mockResolvedValue({ contactPhone: null } as never)

    expect((await contactSettingsApi.get()).contactPhone).toBeNull()
  })
})

describe('CONTACT_PHONE_PATTERN', () => {
  // Must match the backend's @Pattern exactly, or the form either rejects
  // input the server would accept or lets through input it will 400 on.
  it.each(['0241234567', '024 123-4567', '+233241234567', '+442071234567', '(024) 123 4567'])(
    'accepts %s',
    value => expect(CONTACT_PHONE_PATTERN.test(value)).toBe(true)
  )

  it.each(['', '   '])('accepts %o, which clears the number', value =>
    expect(CONTACT_PHONE_PATTERN.test(value)).toBe(true)
  )

  it('rejects text', () => {
    expect(CONTACT_PHONE_PATTERN.test('not a phone')).toBe(false)
  })

  it('rejects too few digits to be a number', () => {
    expect(CONTACT_PHONE_PATTERN.test('12345')).toBe(false)
  })

  it('rejects 17 characters — normalising 0 to +233 would overflow VARCHAR(20)', () => {
    expect(CONTACT_PHONE_PATTERN.test('01234567890123456')).toBe(false)
  })
})
