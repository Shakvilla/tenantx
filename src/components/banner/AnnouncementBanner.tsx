'use client'

import { useState, useEffect } from 'react'

import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api/v1')

interface ActiveAnnouncement {
  id: string
  title: string
  message: string
  severity: 'info' | 'warning' | 'error' | 'success'
}

const DISMISS_KEY = 'dismissed_announcements'

function getDismissed(): Set<string> {
  try {
    const raw = sessionStorage.getItem(DISMISS_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch { return new Set() }
}

function addDismissed(id: string) {
  try {
    const s = getDismissed()
    s.add(id)
    sessionStorage.setItem(DISMISS_KEY, JSON.stringify([...s]))
  } catch {}
}

/**
 * Polls /api/v1/announcements/active and shows a dismissible banner
 * at the top of every dashboard page.
 *
 * Dismissed announcements are suppressed for the rest of the browser session
 * (sessionStorage), so they re-appear if the user opens a new tab.
 */
export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<ActiveAnnouncement | null>(null)
  const [visible, setVisible]           = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchActive() {
      try {
        const res = await fetch(`${API_BASE}/announcements/active`, { cache: 'no-store' })
        if (!res.ok || res.status === 204) return

        const data: ActiveAnnouncement = await res.json()
        if (cancelled) return

        if (!getDismissed().has(data.id)) {
          setAnnouncement(data)
          setVisible(true)
        }
      } catch {
        // Silently ignore — announcement is non-critical
      }
    }

    fetchActive()

    // Re-poll every 5 minutes so scheduled announcements appear without a page reload
    const interval = setInterval(fetchActive, 5 * 60 * 1000)

    // Also re-fetch immediately when the user returns to this tab
    function handleVisibility() {
      if (document.visibilityState === 'visible') fetchActive()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelled = true
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  function handleDismiss() {
    if (announcement) addDismissed(announcement.id)
    setVisible(false)
  }

  if (!announcement) return null

  return (
    <Collapse in={visible} unmountOnExit>
      <Alert
        severity={announcement.severity}
        icon={<i className='ri-megaphone-line' />}
        action={
          <IconButton size='small' color='inherit' onClick={handleDismiss} aria-label='dismiss'>
            <i className='ri-close-line' style={{ fontSize: '1rem' }} />
          </IconButton>
        }
        sx={{
          borderRadius: 0,
          borderBottom: '1px solid',
          borderColor: `${announcement.severity}.dark`,
        }}
      >
        <AlertTitle sx={{ fontWeight: 700 }}>{announcement.title}</AlertTitle>
        {announcement.message}
      </Alert>
    </Collapse>
  )
}
