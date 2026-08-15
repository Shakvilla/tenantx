'use client'

import { useEffect, useState } from 'react'

import themeConfig from '@configs/themeConfig'

const RETRY_SECONDS = 30

export default function MaintenancePage() {
  const [message, setMessage] = useState('Platform is temporarily offline for maintenance.')
  const [countdown, setCountdown] = useState(RETRY_SECONDS)

  // Read ?msg from the URL client-side — avoids useSearchParams() Suspense requirement
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const msg = params.get('msg')
    if (msg) setMessage(decodeURIComponent(msg))
  }, [])

  // Auto-retry countdown — navigates to home when it reaches zero
  useEffect(() => {
    if (countdown <= 0) {
      window.location.href = '/'
      return
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf0 100%)',
        padding: '24px',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 520,
          width: '100%',
          background: '#ffffff',
          borderRadius: 16,
          boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
          overflow: 'hidden',
        }}
      >
        {/* Top accent bar */}
        <div style={{ height: 4, background: '#7367F0' }} />

        <div style={{ padding: '48px 40px 40px' }}>
          {/* Icon */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: '#F3F0FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
            }}
          >
            <span style={{ fontSize: 36 }}>🔧</span>
          </div>

          {/* Platform name */}
          <p
            style={{
              margin: '0 0 8px',
              fontSize: 13,
              fontWeight: 600,
              color: '#7367F0',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {themeConfig.templateName}
          </p>

          {/* Heading */}
          <h1
            style={{
              margin: '0 0 16px',
              fontSize: 28,
              fontWeight: 700,
              color: '#212121',
              lineHeight: 1.2,
            }}
          >
            Under Maintenance
          </h1>

          {/* Message from backend */}
          <p
            style={{
              margin: '0 0 32px',
              fontSize: 16,
              color: '#616161',
              lineHeight: 1.6,
            }}
          >
            {message}
          </p>

          {/* Auto-retry notice */}
          <div
            style={{
              background: '#F8F8FF',
              border: '1px solid #E8E4FF',
              borderRadius: 8,
              padding: '14px 18px',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 20 }}>⏱</span>
            <p style={{ margin: 0, fontSize: 14, color: '#424242' }}>
              Retrying automatically in{' '}
              <strong style={{ color: '#7367F0' }}>{countdown}s</strong>
            </p>
          </div>

          {/* Manual retry */}
          <button
            onClick={() => { window.location.href = '/' }}
            style={{
              width: '100%',
              padding: '12px 24px',
              background: '#7367F0',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.02em',
            }}
          >
            Try Again Now
          </button>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 40px',
            borderTop: '1px solid #f0f0f0',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, fontSize: 13, color: '#9e9e9e' }}>
            &copy; {themeConfig.templateName}. We&apos;ll be back shortly.
          </p>
        </div>
      </div>
    </div>
  )
}
