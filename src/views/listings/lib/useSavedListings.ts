'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'yiliora-saved-listings'

function readSaved(): Set<string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [])
  } catch {
    return new Set()
  }
}

/**
 * Client-only saved-listings state, persisted to localStorage.
 * Starts empty on the server and first client render, then hydrates in an
 * effect — keeps SSR markup and first client render identical.
 */
export function useSavedListings() {
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const savedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const s = readSaved()
    savedRef.current = s
    setSaved(s)
  }, [])

  const toggle = useCallback((id: string) => {
    const next = new Set(savedRef.current)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    savedRef.current = next
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
    } catch {
      // storage full/blocked — keep in-memory state
    }
    setSaved(next)
  }, [])

  const isSaved = useCallback((id: string) => saved.has(id), [saved])

  return { isSaved, toggle }
}
