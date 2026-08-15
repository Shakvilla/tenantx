import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSavedListings } from '@/views/listings/lib/useSavedListings'

beforeEach(() => window.localStorage.clear())

describe('useSavedListings', () => {
  it('starts unsaved', () => {
    const { result } = renderHook(() => useSavedListings())
    expect(result.current.isSaved('a')).toBe(false)
  })

  it('toggle saves and unsaves', () => {
    const { result } = renderHook(() => useSavedListings())
    act(() => result.current.toggle('a'))
    expect(result.current.isSaved('a')).toBe(true)
    act(() => result.current.toggle('a'))
    expect(result.current.isSaved('a')).toBe(false)
  })

  it('persists across remount via localStorage', () => {
    const first = renderHook(() => useSavedListings())
    act(() => first.result.current.toggle('a'))
    first.unmount()

    const second = renderHook(() => useSavedListings())
    expect(second.result.current.isSaved('a')).toBe(true)
  })

  it('survives corrupt storage', () => {
    window.localStorage.setItem('yiliora-saved-listings', '{not json')
    const { result } = renderHook(() => useSavedListings())
    expect(result.current.isSaved('a')).toBe(false)
  })
})
