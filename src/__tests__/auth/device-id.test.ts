import { describe, it, expect, beforeEach } from 'vitest'

import { getDeviceId, DEVICE_ID_STORAGE_KEY } from '@/lib/api/device-id'

describe('getDeviceId', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('generates an id and persists it under the agreed key', () => {
    const id = getDeviceId()

    expect(id).not.toBe('')
    expect(localStorage.getItem(DEVICE_ID_STORAGE_KEY)).toBe(id)
  })

  // The whole feature rests on this: an id that changed per call would make every login look
  // like a new device, so the user would be challenged forever and never build any trust.
  it('returns the same id on every subsequent call', () => {
    const first = getDeviceId()
    const second = getDeviceId()
    const third = getDeviceId()

    expect(second).toBe(first)
    expect(third).toBe(first)
  })

  it('reuses an id already in storage rather than generating a new one', () => {
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, 'pre-existing-id')

    expect(getDeviceId()).toBe('pre-existing-id')
  })

  // Clearing site data legitimately yields a new device and therefore one extra challenge.
  it('generates a fresh id after storage is cleared', () => {
    const before = getDeviceId()
    localStorage.clear()
    const after = getDeviceId()

    expect(after).not.toBe(before)
  })
})
